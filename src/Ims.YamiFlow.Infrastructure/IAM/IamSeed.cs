using System.Security.Claims;
using Ims.YamiFlow.Application.IAM.Constants;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace Ims.YamiFlow.Infrastructure.IAM;

public class IamSeed(
    RoleManager<AppRole> roleManager,
    ILogger<IamSeed> logger)
{
    // default platform roles
    private static readonly Dictionary<string, string> DefaultRoles = new()
    {
        ["Admin"] = "Full platform access",
        ["Instructor"] = "Course creation and management",
        ["Student"] = "Access to enrolled courses"
    };

    // permissions stored as Claim(resource, operation)
    private static readonly Dictionary<string, (string Resource, string Operation)[]> DefaultPermissions = new()
    {
        ["Admin"] =
        [
            ("Course", "Create"), ("Course", "Read"), ("Course", "Update"), ("Course", "Delete"),
            ("Module", "Create"), ("Module", "Read"), ("Module", "Update"), ("Module", "Delete"),
            ("Lesson", "Create"), ("Lesson", "Read"), ("Lesson", "Update"), ("Lesson", "Delete"),
            ("Enrollment", "Create"), ("Enrollment", "Read"), ("Enrollment", "Update"), ("Enrollment", "Delete"),
            ("Certificate", "Read"),
            ("Quiz", "Create"), ("Quiz", "Read"), ("Quiz", "Update"), ("Quiz", "Delete"),
            ("Review", "Read"), ("Review", "Delete"),
            ("Forum", "Read"), ("Forum", "Delete"),
            ("Coupon", "Create"), ("Coupon", "Read"), ("Coupon", "Update"), ("Coupon", "Delete"),
            ("Payment", "Read"),
            ("Subscription", "Read"), ("Subscription", "Create"), ("Subscription", "Update"),
            ("Affiliate", "Read"),
            ("Instructor", "Read"),
            ("Notification", "Read"),
            ("Role", "Create"), ("Role", "Read"), ("Role", "Update"), ("Role", "Delete"),
            ("User", "Read"), ("User", "Update")
        ],
        ["Instructor"] =
        [
            ("Course", "Create"), ("Course", "Read"), ("Course", "Update"),
            ("Module", "Create"), ("Module", "Read"), ("Module", "Update"), ("Module", "Delete"),
            ("Lesson", "Create"), ("Lesson", "Read"), ("Lesson", "Update"), ("Lesson", "Delete"),
            ("Enrollment", "Read"),
            ("Certificate", "Read"),
            ("Quiz", "Create"), ("Quiz", "Read"), ("Quiz", "Update"), ("Quiz", "Delete"),
            ("Review", "Read"),
            ("Forum", "Read"),
            ("Coupon", "Create"), ("Coupon", "Read"),
            ("Instructor", "Read"),
            ("Notification", "Read")
        ],
        ["Student"] =
        [
            ("Course", "Read"),
            ("Lesson", "Read"),
            ("Enrollment", "Create"), ("Enrollment", "Read"),
            ("Certificate", "Read"),
            ("Quiz", "Read"),
            ("Review", "Create"), ("Review", "Read"), ("Review", "Update"),
            ("Forum", "Create"), ("Forum", "Read"),
            ("Payment", "Read"),
            ("Subscription", "Read"), ("Subscription", "Create"), ("Subscription", "Update"),
            ("Notification", "Read")
        ]
    };

    public async Task RunAsync()
    {
        foreach (var (roleName, description) in DefaultRoles)
        {
            if (await roleManager.RoleExistsAsync(roleName))
            {
                logger.LogInformation("Role '{Role}' already exists, skipping seed.", roleName);
                continue;
            }

            var role = new AppRole { Name = roleName, Description = description };
            var result = await roleManager.CreateAsync(role);

            if (!result.Succeeded)
            {
                logger.LogError("Failed to create role '{Role}': {Errors}",
                    roleName, string.Join(", ", result.Errors.Select(e => e.Description)));
                continue;
            }

            logger.LogInformation("Role '{Role}' created.", roleName);

            // add permissions as Claim(resource, operation)
            if (!DefaultPermissions.TryGetValue(roleName, out var permissions)) continue;

            foreach (var (resource, operation) in permissions)
            {
                var claimResult = await roleManager.AddClaimAsync(
                    role, new Claim(resource, operation));

                if (!claimResult.Succeeded)
                    logger.LogWarning("Failed to add permission '{Resource}:{Operation}' to role '{Role}'.",
                        resource, operation, roleName);
            }

            logger.LogInformation("{Count} permissions added to role '{Role}'.",
                permissions.Length, roleName);
        }
    }
}
