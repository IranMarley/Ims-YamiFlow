using System.Security.Claims;
using Ims.YamiFlow.Domain.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;

namespace Ims.YamiFlow.API.Authorization;

/// <summary>
/// Requires the authenticated user to have a subscription in Active or Trialing state.
/// Apply with .RequireAuthorization(ActiveSubscriptionRequirement.PolicyName).
/// </summary>
public class ActiveSubscriptionRequirement : IAuthorizationRequirement
{
    public const string PolicyName = "ActiveSubscription";
}

public class ActiveSubscriptionHandler(IServiceProvider sp)
    : AuthorizationHandler<ActiveSubscriptionRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ActiveSubscriptionRequirement requirement)
    {
        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return;

        // Admins and Instructors bypass the subscription gate for authoring/moderation flows.
        if (context.User.IsInRole("Admin") || context.User.IsInRole("Instructor"))
        {
            context.Succeed(requirement);
            return;
        }

        using var scope = sp.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<ISubscriptionRepository>();
        var sub = await repo.GetActiveByUserAsync(userId);
        if (sub is not null && sub.GrantsAccess())
            context.Succeed(requirement);
    }
}
