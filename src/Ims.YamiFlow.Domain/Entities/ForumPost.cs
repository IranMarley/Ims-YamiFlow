namespace Ims.YamiFlow.Domain.Entities;

public class ForumPost
{
    public Guid Id { get; private set; }
    public string AuthorId { get; private set; } = string.Empty;
    public Guid? CourseId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    private readonly List<ForumReply> _replies = [];
    public IReadOnlyCollection<ForumReply> Replies => _replies.AsReadOnly();

    private ForumPost() { }

    public static ForumPost Create(string authorId, Guid? courseId, string title, string body)
        => new()
        {
            Id = Guid.NewGuid(),
            AuthorId = authorId,
            CourseId = courseId,
            Title = title,
            Body = body,
            CreatedAt = DateTime.UtcNow
        };

    public ForumReply AddReply(string authorId, string body)
    {
        var reply = ForumReply.Create(Id, authorId, body);
        _replies.Add(reply);
        return reply;
    }
}

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
