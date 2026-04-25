using Ims.YamiFlow.Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Ims.YamiFlow.Infrastructure.Services.Media;

public sealed class LocalStorageService(
    IOptions<StorageOptions> options,
    ILogger<LocalStorageService> logger) : IStorageService
{
    private readonly string _root = options.Value.RootPath;

    // fileName is treated as a relative path under RootPath.
    // Returns the same relative path so callers can store it in the DB.
    public async Task<string> UploadAsync(
        Stream file, string fileName, string contentType, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_root, fileName);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using var fs = new FileStream(
            fullPath, FileMode.Create, FileAccess.Write,
            FileShare.None, bufferSize: 81920, useAsync: true);

        await file.CopyToAsync(fs, ct);

        logger.LogDebug("Stored file at {Path}", fullPath);
        return fileName;
    }

    public Task DeleteAsync(string fileUrl, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_root, fileUrl);
        if (File.Exists(fullPath))
            File.Delete(fullPath);
        return Task.CompletedTask;
    }
}
