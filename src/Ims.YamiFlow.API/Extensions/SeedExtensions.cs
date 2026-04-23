using Ims.YamiFlow.Domain.Entities;
using Ims.YamiFlow.Domain.Enums;
using Ims.YamiFlow.Infrastructure.IAM;
using Ims.YamiFlow.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Ims.YamiFlow.API.Extensions;

public static class SeedExtensions
{
    public static async Task MigrateAndSeedAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();

        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();

        var seeder = scope.ServiceProvider.GetRequiredService<IamSeed>();
        await seeder.RunAsync();

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        await SeedUsersAsync(userManager);
        await SeedCoursesAsync(db, userManager);
        await SeedSubscriptionPlansAsync(db);
    }
    
    private static async Task SeedUsersAsync(UserManager<AppUser> userManager)
    {
        var defaultUsers = new[]
        {
            new { 
                Email = "admin@yamiflow.es", 
                FullName = "Platform Admin", 
                Role = "Admin", 
                Password = "Admin@123" 
            },
            new { 
                Email = "instructor@yamiflow.es", 
                FullName = "Alex Rivera", 
                Role = "Instructor", 
                Password = "Instructor@123" 
            }
        };

        foreach (var userData in defaultUsers)
        {
            if (await userManager.FindByEmailAsync(userData.Email) == null)
            {
                var user = new AppUser
                {
                    UserName = userData.Email,
                    Email = userData.Email,
                    FullName = userData.FullName,
                    IsActive = true,
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow
                };

                var result = await userManager.CreateAsync(user, userData.Password);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, userData.Role);
                }
            }
        }
    }

    private static async Task SeedSubscriptionPlansAsync(AppDbContext db)
    {
        if (await db.SubscriptionPlans.AnyAsync()) return;

        // These StripePriceId values are placeholders — replace with real IDs from your Stripe dashboard.
        // Create products/prices in Stripe first, then paste the price_xxx IDs here.
        var plans = new[]
        {
            SubscriptionPlan.Create(
                name: "Basic Monthly",
                description: "Full platform access, billed monthly.",
                stripeProductId: "prod_REPLACE_BASIC",
                stripePriceId:   "price_REPLACE_BASIC_MONTHLY",
                amount: 19.99m,
                currency: "usd",
                interval: BillingInterval.Month,
                intervalCount: 1,
                trialDays: 7,
                sortOrder: 1),

            SubscriptionPlan.Create(
                name: "Basic Annual",
                description: "Full platform access, billed annually (2 months free).",
                stripeProductId: "prod_REPLACE_BASIC",
                stripePriceId:   "price_REPLACE_BASIC_ANNUAL",
                amount: 199.99m,
                currency: "usd",
                interval: BillingInterval.Year,
                intervalCount: 1,
                trialDays: 7,
                sortOrder: 2),

            SubscriptionPlan.Create(
                name: "Pro Monthly",
                description: "Everything in Basic plus priority support and analytics.",
                stripeProductId: "prod_REPLACE_PRO",
                stripePriceId:   "price_REPLACE_PRO_MONTHLY",
                amount: 39.99m,
                currency: "usd",
                interval: BillingInterval.Month,
                intervalCount: 1,
                trialDays: null,
                sortOrder: 3),

            SubscriptionPlan.Create(
                name: "Pro Annual",
                description: "Pro plan billed annually (2 months free).",
                stripeProductId: "prod_REPLACE_PRO",
                stripePriceId:   "price_REPLACE_PRO_ANNUAL",
                amount: 399.99m,
                currency: "usd",
                interval: BillingInterval.Year,
                intervalCount: 1,
                trialDays: null,
                sortOrder: 4),
        };

        db.SubscriptionPlans.AddRange(plans);
        await db.SaveChangesAsync();
    }

    private static async Task SeedCoursesAsync(AppDbContext db, UserManager<AppUser> userManager)
    {
        if (await db.Courses.CountAsync() >= 10) return;

        // Find or create a seed instructor
        var instructorRole = "Instructor";
        var instructors = await userManager.GetUsersInRoleAsync(instructorRole);
        AppUser? instructor = instructors.FirstOrDefault();

        if (instructor is null)
        {
            instructor = new AppUser
            {
                UserName = "instructor@yamiflow.com",
                Email = "instructor@yamiflow.com",
                FullName = "Alex Rivera",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            };
            var created = await userManager.CreateAsync(instructor, "Instructor@123");
            if (created.Succeeded)
                await userManager.AddToRoleAsync(instructor, instructorRole);
            else
                return;
        }

        var courses = new[]
        {
            (Title: "Complete Web Development Bootcamp",        Desc: "Master HTML, CSS, JavaScript, React and Node.js from zero to hero.",          IsFree: true,  Level: CourseLevel.Beginner),
            (Title: "Advanced React & TypeScript",              Desc: "Deep dive into React hooks, context, performance and TypeScript generics.",   IsFree: false, Level: CourseLevel.Advanced),
            (Title: "Python for Data Science",                  Desc: "Learn Python, Pandas, NumPy, and Matplotlib to analyse real-world datasets.", IsFree: true,  Level: CourseLevel.Beginner),
            (Title: "Machine Learning A-Z",                     Desc: "Practical machine learning with scikit-learn, regression and classification.",IsFree: false, Level: CourseLevel.Intermediate),
            (Title: "Cloud Architecture with AWS",              Desc: "Design scalable, fault-tolerant systems using AWS core services.",             IsFree: false, Level: CourseLevel.Advanced),
            (Title: "UI/UX Design Fundamentals",                Desc: "User research, wireframing, prototyping and design systems with Figma.",       IsFree: true,  Level: CourseLevel.Beginner),
            (Title: "Docker & Kubernetes in Practice",          Desc: "Containerise applications and orchestrate them with Kubernetes.",              IsFree: false, Level: CourseLevel.Intermediate),
            (Title: "Full-Stack .NET with Clean Architecture",  Desc: "Build production-grade APIs with ASP.NET Core, EF Core and MediatR.",         IsFree: false, Level: CourseLevel.Advanced),
            (Title: "iOS Development with SwiftUI",             Desc: "Build beautiful native iOS apps using SwiftUI and Swift 5.",                  IsFree: false, Level: CourseLevel.Intermediate),
            (Title: "GraphQL API Design",                       Desc: "Design and build scalable GraphQL APIs with schema-first development.",        IsFree: false, Level: CourseLevel.Intermediate),
            (Title: "Cybersecurity Essentials",                 Desc: "Understand threats, vulnerabilities and defensive security fundamentals.",     IsFree: true,  Level: CourseLevel.Beginner),
            (Title: "DevOps CI/CD Pipelines",                   Desc: "Automate builds, tests and deployments with GitHub Actions and Jenkins.",     IsFree: false, Level: CourseLevel.Intermediate),
        };

        foreach (var (title, desc, isFree, level) in courses)
        {
            if (await db.Courses.AnyAsync(c => c.Title == title)) continue;

            var course = Course.Create(title, desc, level, instructor.Id, isFree);
            course.AddModule("Introduction", 1);
            var introModule = course.Modules.First();
            introModule.AddLesson("Getting Started", LessonType.Video, 600, 1);

            course.AddModule("Core Concepts", 2);
            var coreModule = course.Modules.Skip(1).First();
            coreModule.AddLesson("Fundamentals Overview", LessonType.Video, 1800, 1);
            coreModule.AddLesson("Hands-on Practice", LessonType.Video, 2400, 2);

            // Publish so courses appear in listings
            course.Publish();
            db.Courses.Add(course);
        }

        await db.SaveChangesAsync();
    }
}
