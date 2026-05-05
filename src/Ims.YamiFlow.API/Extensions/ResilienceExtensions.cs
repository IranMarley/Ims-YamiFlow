using System.Collections.Concurrent;
using System.Net;
using Polly;
using Polly.CircuitBreaker;
using Polly.Extensions.Http;
using Polly.Timeout;

namespace Ims.YamiFlow.API.Extensions;

public static class ResilienceExtensions
{
    // Shared policy cache: circuit breaker state must survive across requests.
    // ConcurrentDictionary ensures one policy instance per named client.
    private static readonly ConcurrentDictionary<string, IAsyncPolicy<HttpResponseMessage>> _policyCache = new();

    /// <summary>
    /// Wraps the named HTTP client with Polly resilience: timeout → circuit breaker → retry → fallback.
    /// </summary>
    public static IHttpClientBuilder AddResiliencePolicies(
        this IHttpClientBuilder builder,
        string clientName)
    {
        return builder.AddPolicyHandler((sp, _) =>
            _policyCache.GetOrAdd(clientName, name =>
            {
                var logger = sp.GetRequiredService<ILoggerFactory>()
                    .CreateLogger($"Resilience.{name}");
                return BuildResiliencePipeline(logger, name);
            }));
    }

    /// <summary>
    /// Builds a PolicyWrap combining timeout, circuit breaker, retry, and fallback.
    /// Public so unit tests can exercise the pipeline directly with a custom logger.
    /// </summary>
    /// <remarks>
    /// Execution order (inner → outer):
    ///   timeout (5 s per attempt)
    ///   → circuit breaker (opens after 3 failures, 30 s break)
    ///   → retry (3 attempts, exponential backoff: 1 s, 2 s, 4 s)
    ///   → fallback (503 when circuit is open or all retries exhausted)
    /// </remarks>
    public static IAsyncPolicy<HttpResponseMessage> BuildResiliencePipeline(
        ILogger logger,
        string clientName)
    {
        var timeout = Policy.TimeoutAsync<HttpResponseMessage>(
            TimeSpan.FromSeconds(5),
            TimeoutStrategy.Optimistic);

        var circuitBreaker = HttpPolicyExtensions
            .HandleTransientHttpError()
            .Or<TimeoutRejectedException>()
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: 3,
                durationOfBreak: TimeSpan.FromSeconds(30),
                onBreak: (outcome, duration) =>
                    logger.LogError(
                        "[{Client}] Circuit OPENED — break {Duration}s. Cause: {Reason}",
                        clientName,
                        duration.TotalSeconds,
                        outcome.Exception?.Message ?? outcome.Result?.StatusCode.ToString()),
                onReset: () =>
                    logger.LogInformation("[{Client}] Circuit CLOSED — service recovered.", clientName),
                onHalfOpen: () =>
                    logger.LogInformation("[{Client}] Circuit HALF-OPEN — probing service.", clientName));

        var retry = HttpPolicyExtensions
            .HandleTransientHttpError()
            .Or<TimeoutRejectedException>()
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt - 1)),
                onRetry: (outcome, delay, attempt, _) =>
                    logger.LogWarning(
                        "[{Client}] Retry {Attempt}/3 in {Delay}s. Cause: {Reason}",
                        clientName,
                        attempt,
                        delay.TotalSeconds,
                        outcome.Exception?.Message ?? outcome.Result?.StatusCode.ToString()));

        var fallback = Policy<HttpResponseMessage>
            .Handle<BrokenCircuitException>()
            .Or<TimeoutRejectedException>()
            .Or<HttpRequestException>()
            .OrResult(r => (int)r.StatusCode >= 500)
            .FallbackAsync(
                fallbackAction: (_, _) => Task.FromResult(
                    new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
                    {
                        Content = new StringContent("Service temporarily unavailable — circuit open or retries exhausted.")
                    }),
                onFallbackAsync: (outcome, _) =>
                {
                    logger.LogWarning(
                        "[{Client}] Fallback triggered. Cause: {Reason}",
                        clientName,
                        outcome.Exception?.Message ?? outcome.Result?.StatusCode.ToString());
                    return Task.CompletedTask;
                });

        // PolicyWrap: outermost → innermost
        // fallback wraps (retry wraps (circuitBreaker wraps timeout))
        return Policy.WrapAsync(fallback, retry, circuitBreaker, timeout);
    }
}
