namespace Ims.YamiFlow.Domain.Interfaces.Services;

public interface IVideoProcessor
{
    Task<string> ProcessAsync(string rawVideoUrl, CancellationToken ct = default);
}
