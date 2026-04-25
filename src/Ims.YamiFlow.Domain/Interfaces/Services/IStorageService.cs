namespace Ims.YamiFlow.Domain.Interfaces.Services;

public interface IStorageService
{
    Task<string> UploadAsync(Stream file, string fileName, string contentType, CancellationToken ct = default);
    Task DeleteAsync(string fileUrl, CancellationToken ct = default);
}
