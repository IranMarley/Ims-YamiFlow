using System.Diagnostics;
using System.Globalization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Ims.YamiFlow.Infrastructure.Services.Media;

public sealed class FFmpegService(
    IOptions<FfmpegOptions> options,
    ILogger<FFmpegService> logger)
{
    private readonly string _ffmpeg = options.Value.FfmpegPath;
    private readonly string _ffprobe = options.Value.FfprobePath;

    public async Task<int> GetDurationAsync(string inputPath, CancellationToken ct = default)
    {
        var output = await RunAsync(
            _ffprobe,
            $"-v error -show_entries format=duration -of csv=p=0 \"{inputPath}\"",
            ct);

        return double.TryParse(output.Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var d)
            ? (int)Math.Round(d)
            : 0;
    }

    // Single-pass encode: splits into 3 renditions and writes HLS for each.
    // Produces: {outputDir}/360/stream.m3u8, /720/stream.m3u8, /1080/stream.m3u8, master.m3u8
    public async Task GenerateHlsAsync(string inputPath, string outputDir, CancellationToken ct = default)
    {
        Directory.CreateDirectory(Path.Combine(outputDir, "360"));
        Directory.CreateDirectory(Path.Combine(outputDir, "720"));
        Directory.CreateDirectory(Path.Combine(outputDir, "1080"));

        var args = string.Join(" ",
            $"-i \"{inputPath}\"",
            "-filter_complex",
            "\"[0:v]split=3[v1][v2][v3];[v1]scale=-2:360[v360];[v2]scale=-2:720[v720];[v3]scale=-2:1080[v1080]\"",

            "-map [v360] -map 0:a? -c:v:0 libx264 -crf 28 -preset fast -c:a:0 aac -b:a:0 128k",
            "-f hls -hls_time 10 -hls_playlist_type vod",
            $"-hls_segment_filename \"{outputDir}/360/seg_%03d.ts\"",
            $"\"{outputDir}/360/stream.m3u8\"",

            "-map [v720] -map 0:a? -c:v:1 libx264 -crf 23 -preset fast -c:a:1 aac -b:a:1 128k",
            "-f hls -hls_time 10 -hls_playlist_type vod",
            $"-hls_segment_filename \"{outputDir}/720/seg_%03d.ts\"",
            $"\"{outputDir}/720/stream.m3u8\"",

            "-map [v1080] -map 0:a? -c:v:2 libx264 -crf 20 -preset fast -c:a:2 aac -b:a:2 192k",
            "-f hls -hls_time 10 -hls_playlist_type vod",
            $"-hls_segment_filename \"{outputDir}/1080/seg_%03d.ts\"",
            $"\"{outputDir}/1080/stream.m3u8\""
        );

        await RunAsync(_ffmpeg, args, ct);
        await WriteMasterPlaylistAsync(outputDir);
    }

    public async Task GenerateThumbnailAsync(
        string inputPath, string outputPath, int atSecond = 5, CancellationToken ct = default)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);
        var args = $"-ss {atSecond} -i \"{inputPath}\" -vframes 1 -q:v 2 \"{outputPath}\"";
        await RunAsync(_ffmpeg, args, ct);
    }

    private static async Task WriteMasterPlaylistAsync(string outputDir)
    {
        const string master = "#EXTM3U\n" +
            "#EXT-X-VERSION:3\n" +
            "#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n" +
            "360/stream.m3u8\n" +
            "#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720\n" +
            "720/stream.m3u8\n" +
            "#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080\n" +
            "1080/stream.m3u8\n";

        await File.WriteAllTextAsync(Path.Combine(outputDir, "master.m3u8"), master);
    }

    private async Task<string> RunAsync(string binary, string args, CancellationToken ct)
    {
        logger.LogDebug("Running: {Binary} {Args}", binary, args);

        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = binary,
                Arguments = args,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };

        process.Start();

        var stdoutTask = process.StandardOutput.ReadToEndAsync(ct);
        var stderrTask = process.StandardError.ReadToEndAsync(ct);

        await process.WaitForExitAsync(ct);

        var stdout = await stdoutTask;
        var stderr = await stderrTask;

        if (process.ExitCode != 0)
        {
            var preview = stderr.Length > 600 ? stderr[..600] : stderr;
            throw new InvalidOperationException(
                $"FFmpeg exited with code {process.ExitCode}: {preview}");
        }

        return stdout;
    }
}
