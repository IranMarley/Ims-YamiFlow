namespace Ims.YamiFlow.Domain.Entities;

public class ForumReply
{
    public Guid Id { get; private set; }
    public Guid PostId { get; private set; }
    public string AuthorId { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    private ForumReply() { }

    public static ForumReply Create(Guid postId, string authorId, string body)
        => new()
        {
            Id = Guid.NewGuid(),
            PostId = postId,
            AuthorId = authorId,
            Body = body,
            CreatedAt = DateTime.UtcNow
        };
}
