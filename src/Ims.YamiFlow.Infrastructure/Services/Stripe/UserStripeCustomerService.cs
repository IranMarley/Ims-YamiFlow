using Ims.YamiFlow.Application.Commands.Subscriptions;
using Ims.YamiFlow.Infrastructure.IAM;
using Microsoft.AspNetCore.Identity;

namespace Ims.YamiFlow.Infrastructure.Services.Stripe;

public class UserStripeCustomerService(UserManager<AppUser> users) : IUserStripeCustomerService
{
    public async Task<string?> GetStripeCustomerIdAsync(string userId, CancellationToken ct = default)
    {
        var user = await users.FindByIdAsync(userId);
        return user?.StripeCustomerId;
    }

    public async Task SetStripeCustomerIdAsync(string userId, string customerId, CancellationToken ct = default)
    {
        var user = await users.FindByIdAsync(userId)
            ?? throw new InvalidOperationException($"User {userId} not found.");
        if (user.StripeCustomerId == customerId) return;
        user.StripeCustomerId = customerId;
        await users.UpdateAsync(user);
    }
}
