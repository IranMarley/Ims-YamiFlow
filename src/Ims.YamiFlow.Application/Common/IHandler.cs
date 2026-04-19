namespace Ims.YamiFlow.Application.Common;

/// <summary>
/// Contract for all command and query handlers.
/// Replaces MediatR's IRequestHandler&lt;TRequest, TResponse&gt;.
/// Request types are plain records — no marker interface required.
/// </summary>
public interface IHandler<TRequest, TResponse>
{
    Task<TResponse> Handle(TRequest request, CancellationToken ct = default);
}
