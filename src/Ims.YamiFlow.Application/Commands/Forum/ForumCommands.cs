using FluentValidation;
using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Interfaces;
using MediatR;

namespace Ims.YamiFlow.Application.Commands.Forum;

// ── Responses ─────────────────────────────────────────
public record PostResponse(
    Guid PostId,
    string AuthorId,
    Guid? CourseId,
    string Title,
    string Body,
    DateTime CreatedAt
);

public record ReplyResponse(
    Guid ReplyId,
    Guid PostId,
    string AuthorId,
    string Body,
    DateTime CreatedAt
);

// ── CreatePostCommand ─────────────────────────────────
public record CreatePostCommand(
    string AuthorId,
    Guid? CourseId,
    string Title,
    string Body
) : IRequest<Result<PostResponse>>;

public class CreatePostValidator : AbstractValidator<CreatePostCommand>
{
    public CreatePostValidator()
    {
        RuleFor(x => x.AuthorId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Body).NotEmpty().MaximumLength(10000);
    }
}

public class CreatePostHandler(IForumPostRepository postRepository, IUnitOfWork uow)
    : IRequestHandler<CreatePostCommand, Result<PostResponse>>
{
    public async Task<Result<PostResponse>> Handle(CreatePostCommand cmd, CancellationToken ct)
    {
        var post = ForumPost.Create(cmd.AuthorId, cmd.CourseId, cmd.Title, cmd.Body);
        await postRepository.AddAsync(post, ct);
        await uow.CommitAsync(ct);

        return Result.Success(new PostResponse(
            post.Id, post.AuthorId, post.CourseId,
            post.Title, post.Body, post.CreatedAt));
    }
}

// ── ReplyToPostCommand ────────────────────────────────
public record ReplyToPostCommand(Guid PostId, string AuthorId, string Body) : IRequest<Result<ReplyResponse>>;

public class ReplyToPostValidator : AbstractValidator<ReplyToPostCommand>
{
    public ReplyToPostValidator()
    {
        RuleFor(x => x.PostId).NotEmpty();
        RuleFor(x => x.AuthorId).NotEmpty();
        RuleFor(x => x.Body).NotEmpty().MaximumLength(10000);
    }
}

public class ReplyToPostHandler(IForumPostRepository postRepository, IUnitOfWork uow)
    : IRequestHandler<ReplyToPostCommand, Result<ReplyResponse>>
{
    public async Task<Result<ReplyResponse>> Handle(ReplyToPostCommand cmd, CancellationToken ct)
    {
        var post = await postRepository.GetByIdAsync(cmd.PostId, ct);
        if (post is null)
            return Result.Failure<ReplyResponse>("Post not found.");

        var reply = post.AddReply(cmd.AuthorId, cmd.Body);
        await uow.CommitAsync(ct);

        return Result.Success(new ReplyResponse(
            reply.Id, reply.PostId, reply.AuthorId,
            reply.Body, reply.CreatedAt));
    }
}

// ── DeletePostCommand ─────────────────────────────────
public record DeletePostCommand(Guid PostId, string AuthorId) : IRequest<Result>;

public class DeletePostValidator : AbstractValidator<DeletePostCommand>
{
    public DeletePostValidator()
    {
        RuleFor(x => x.PostId).NotEmpty();
        RuleFor(x => x.AuthorId).NotEmpty();
    }
}

public class DeletePostHandler(IForumPostRepository postRepository, IUnitOfWork uow)
    : IRequestHandler<DeletePostCommand, Result>
{
    public async Task<Result> Handle(DeletePostCommand cmd, CancellationToken ct)
    {
        var post = await postRepository.GetByIdAsync(cmd.PostId, ct);
        if (post is null)
            return Result.Failure("Post not found.");
        if (post.AuthorId != cmd.AuthorId)
            return Result.Failure("You can only delete your own posts.");

        postRepository.Remove(post);
        await uow.CommitAsync(ct);
        return Result.Success();
    }
}
