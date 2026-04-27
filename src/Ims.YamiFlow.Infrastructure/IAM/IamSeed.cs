using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace Ims.YamiFlow.Infrastructure.IAM;

public class IamSeed(
    RoleManager<AppRole> roleManager,
    ILogger<IamSeed> logger)
{
    private static readonly Dictionary<string, string> DefaultRoles = new()
    {
        ["Admin"] = "Full platform access",
        ["Instructor"] = "Course creation and management",
        ["Student"] = "Access to enrolled courses"
    };

    private static readonly Dictionary<string, (string Resource, string Operation)[]> DefaultPermissions = new()
    {
        ["Admin"] = [
            ("Course", "Create"), ("Course", "Read"), ("Course", "Update"), ("Course", "Delete"),
            ("Module", "Create"), ("Module", "Read"), ("Module", "Update"), ("Module", "Delete"),
            ("Lesson", "Create"), ("Lesson", "Read"), ("Lesson", "Update"), ("Lesson", "Delete"),
            ("Enrollment", "Create"), ("Enrollment", "Read"), ("Enrollment", "Update"), ("Enrollment", "Delete"),
            ("Certificate", "Read"),
            ("Payment", "Read"),
            ("Subscription", "Read"), ("Subscription", "Create"), ("Subscription", "Update"),
            ("Instructor", "Read"),
            ("Role", "Create"), ("Role", "Read"), ("Role", "Update"), ("Role", "Delete"),
            ("User", "Read"), ("User", "Update")
        ],
        ["Instructor"] = [
            ("Course", "Create"), ("Course", "Read"), ("Course", "Update"),
            ("Module", "Create"), ("Module", "Read"), ("Module", "Update"), ("Module", "Delete"),
            ("Lesson", "Create"), ("Lesson", "Read"), ("Lesson", "Update"), ("Lesson", "Delete"),
            ("Enrollment", "Read"),
            ("Certificate", "Read"),
            ("Instructor", "Read")
        ],
        ["Student"] = [
            ("Course", "Read"),
            ("Lesson", "Read"),
            ("Enrollment", "Create"), ("Enrollment", "Read"),
            ("Certificate", "Read"),
            ("Payment", "Read"),
            ("Subscription", "Read"), ("Subscription", "Create"), ("Subscription", "Update")
        ]
    };

    public async Task RunAsync()
    {
        foreach (var (roleName, description) in DefaultRoles)
        {
            var role = await roleManager.FindByNameAsync(roleName);

            if (role == null)
            {
                role = new AppRole { Name = roleName, Description = description };
                var result = await roleManager.CreateAsync(role);

                if (!result.Succeeded)
                {
                    logger.LogError("Failed to create role '{Role}': {Errors}",
                        roleName, string.Join(", ", result.Errors.Select(e => e.Description)));
                    continue;
                }
                logger.LogInformation("Role '{Role}' created successfully.", roleName);
            }

            if (!DefaultPermissions.TryGetValue(roleName, out var permissions)) continue;

            var existingClaims = await roleManager.GetClaimsAsync(role);

            foreach (var (resource, operation) in permissions)
            {
                if (!existingClaims.Any(c => c.Type == resource && c.Value == operation))
                {
                    var claimResult = await roleManager.AddClaimAsync(role, new Claim(resource, operation));

                    if (!claimResult.Succeeded)
                    {
                        logger.LogWarning("Failed to add permission '{Resource}:{Operation}' to role '{Role}'.",
                            resource, operation, roleName);
                    }
                }
            }

            logger.LogInformation("Claims synchronized for role '{Role}'.", roleName);
        }
    }
}
