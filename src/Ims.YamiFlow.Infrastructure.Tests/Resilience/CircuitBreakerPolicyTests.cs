using System.Net;
using Ims.YamiFlow.API.Extensions;
using Microsoft.Extensions.Logging.Abstractions;
using Polly.CircuitBreaker;
using Xunit;

namespace Ims.YamiFlow.Infrastructure.Tests.Resilience;

/// <summary>
/// Tests for the Polly resilience pipeline built by ResilienceExtensions.
/// Uses a FakeHttpMessageHandler to control HTTP responses without a real server.
/// </summary>
public sealed class CircuitBreakerPolicyTests
{
    private const string ClientName = "TestClient";

    private static HttpClient BuildClientWithPolicy(FakeHttpMessageHandler handler)
    {
        var policy = ResilienceExtensions.BuildResiliencePipeline(
            NullLogger.Instance, ClientName);

        // Wrap the handler with the policy via a custom DelegatingHandler bridge
        var client = new HttpClient(new PolicyHttpMessageHandler(policy, handler))
        {
            BaseAddress = new Uri("https://test.example.com"),
            Timeout = Timeout.InfiniteTimeSpan
        };
        return client;
    }

    [Fact]
    public async Task SingleSuccess_ReturnsOk()
    {
        var handler = new FakeHttpMessageHandler();
        handler.Enqueue(HttpStatusCode.OK);

        var client = BuildClientWithPolicy(handler);
        var response = await client.GetAsync("/ping");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task TransientFailureThenSuccess_RetriesAndSucceeds()
    {
        var handler = new FakeHttpMessageHandler();
        handler.Enqueue(HttpStatusCode.InternalServerError); // attempt 1 fails
        handler.Enqueue(HttpStatusCode.InternalServerError); // attempt 2 fails
        handler.Enqueue(HttpStatusCode.OK);                  // attempt 3 succeeds

        var client = BuildClientWithPolicy(handler);
        var response = await client.GetAsync("/ping");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(3, handler.CallCount);
    }

    [Fact]
    public async Task ThreeConsecutiveFailures_CircuitOpensAndFallbackReturns503()
    {
        var handler = new FakeHttpMessageHandler();

        // Queue enough failures to trip the circuit (3 failures per attempt × 3 attempts)
        // With retry(3) inside CB(3): 3 retries each counting toward CB → circuit opens.
        for (var i = 0; i < 9; i++)
            handler.Enqueue(HttpStatusCode.InternalServerError);

        var client = BuildClientWithPolicy(handler);

        // Trigger the first call — retries exhaust, CB eventually opens, fallback fires
        var response = await client.GetAsync("/ping");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }

    [Fact]
    public async Task CircuitOpenAfterFailures_ImmediatelyReturnsFallback()
    {
        var policy = ResilienceExtensions.BuildResiliencePipeline(NullLogger.Instance, ClientName);

        // Trip the circuit by executing 3 failures directly
        for (var i = 0; i < 3; i++)
        {
            await policy.ExecuteAsync(() =>
                Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError)));
        }

        // Next call should hit fallback without going to the handler at all
        var callCount = 0;
        var result = await policy.ExecuteAsync(() =>
        {
            callCount++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
        });

        Assert.Equal(HttpStatusCode.ServiceUnavailable, result.StatusCode);
        Assert.Equal(0, callCount); // circuit was open — handler never called
    }

    [Fact]
    public async Task AllRetriesExhausted_FallbackReturnsSvcUnavailable()
    {
        // Use policy directly to exhaust all retries without tripping circuit
        var policy = ResilienceExtensions.BuildResiliencePipeline(NullLogger.Instance, ClientName);

        // 1 call + 3 retries = 4 total, each returning 503 from handler
        var callCount = 0;
        var result = await policy.ExecuteAsync(() =>
        {
            callCount++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
        });

        Assert.Equal(HttpStatusCode.ServiceUnavailable, result.StatusCode);
        Assert.True(callCount > 1, "Expected retries to have occurred");
    }
}

/// <summary>
/// Minimal DelegatingHandler that bridges a Polly IAsyncPolicy&lt;HttpResponseMessage&gt;
/// with a custom inner handler — useful for testing without IHttpClientFactory.
/// </summary>
internal sealed class PolicyHttpMessageHandler : DelegatingHandler
{
    private readonly Polly.IAsyncPolicy<HttpResponseMessage> _policy;

    public PolicyHttpMessageHandler(
        Polly.IAsyncPolicy<HttpResponseMessage> policy,
        HttpMessageHandler inner) : base(inner)
    {
        _policy = policy;
    }

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        return _policy.ExecuteAsync(ct => base.SendAsync(request, ct), cancellationToken);
    }
}

/// <summary>Pre-queued responses for deterministic HTTP testing.</summary>
internal sealed class FakeHttpMessageHandler : HttpMessageHandler
{
    private readonly Queue<HttpStatusCode> _queue = new();
    public int CallCount { get; private set; }

    public void Enqueue(HttpStatusCode code) => _queue.Enqueue(code);

    protected override Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        CallCount++;
        var code = _queue.TryDequeue(out var queued) ? queued : HttpStatusCode.InternalServerError;
        return Task.FromResult(new HttpResponseMessage(code));
    }
}
