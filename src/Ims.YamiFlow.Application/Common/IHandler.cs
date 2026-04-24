namespace Ims.YamiFlow.Application.Common;

public interface IHandler<TRequest, TResponse>
{
    Task<TResponse> Handle(TRequest request, CancellationToken ct = default);
}
