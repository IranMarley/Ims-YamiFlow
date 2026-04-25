namespace Ims.YamiFlow.Infrastructure.Services.Media;

public class FfmpegOptions
{
    public const string SectionName = "Ffmpeg";
    public string FfmpegPath  { get; set; } = "ffmpeg";
    public string FfprobePath { get; set; } = "ffprobe";
}
