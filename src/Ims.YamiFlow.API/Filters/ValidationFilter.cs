using FluentValidation;

namespace Ims.YamiFlow.API.Filters;

/// <summary>
/// Runs FluentValidation on every bound request argument before the handler executes.
/// Replaces MediatR's ValidationBehavior pipeline behavior.
/// Throws ValidationException on failure so ExceptionHandlerMiddleware returns the same 400 shape.
/// </summary>
public sealed class ValidationFilter(IServiceProvider sp) : IEndpointFilter
{
    private static readonly HashSet<Type> SkippedTypes =
    [
        typeof(string), typeof(Guid), typeof(CancellationToken),
        typeof(HttpContext), typeof(HttpRequest), typeof(HttpResponse)
    ];

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        foreach (var arg in ctx.Arguments)
        {
            if (arg is null) continue;

            var type = arg.GetType();
            if (type.IsPrimitive || SkippedTypes.Contains(type) || type.IsEnum) continue;

            var validatorType = typeof(IValidator<>).MakeGenericType(type);
            if (sp.GetService(validatorType) is not IValidator validator) continue;

            var valCtx = new ValidationContext<object>(arg);
            var result = await validator.ValidateAsync(valCtx, ctx.HttpContext.RequestAborted);

            if (!result.IsValid)
                throw new ValidationException(result.Errors);
        }

        return await next(ctx);
    }
}
