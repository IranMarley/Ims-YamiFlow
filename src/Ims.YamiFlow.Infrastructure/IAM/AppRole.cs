using Microsoft.AspNetCore.Identity;

namespace Ims.YamiFlow.Infrastructure.IAM;

public class AppRole : IdentityRole
{
    public string Description { get; set; } = string.Empty;
}
