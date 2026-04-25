using Microsoft.AspNetCore.Identity;

namespace Ims.YamiFlow.Infrastructure.IAM;

public class AppUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    public string? StripeCustomerId { get; set; }
}
