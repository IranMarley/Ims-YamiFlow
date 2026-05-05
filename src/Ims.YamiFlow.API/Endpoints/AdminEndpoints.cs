using Ims.YamiFlow.Application.Commands.Admin;
using Ims.YamiFlow.Application.IAM.Constants;
using Ims.YamiFlow.Application.Queries.Admin;
using Ims.YamiFlow.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Ims.YamiFlow.API.Endpoints;

public static class AdminEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin").WithTags("Admin");

        // ── Stats ─────────────────────────────────────────────────────────────

        group.MapGet("/stats", async (GetAdminStatsHandler handler, CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetAdminStatsQuery(), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Read))
        .WithName("GetAdminStats");

        // ── Users ─────────────────────────────────────────────────────────────

        group.MapGet("/users", async (string? search, int page, int pageSize, ListUsersHandler handler, CancellationToken ct) =>
            Results.Ok(await handler.Handle(new ListUsersQuery(search, page, pageSize), ct)))
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Read))
        .WithName("ListUsers");

        group.MapPut("/users/{userId}", async (
            string userId,
            [FromBody] UpdateUserRequest req,
            UpdateUserByAdminHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new UpdateUserByAdminCommand(userId, req.FullName, req.Role), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Update))
        .WithName("UpdateUser");

        group.MapPost("/users/{userId}/toggle-status", async (
            string userId,
            [FromBody] ToggleUserStatusRequest req,
            ToggleUserStatusHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new ToggleUserStatusCommand(userId, req.IsActive), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Update))
        .WithName("ToggleUserStatus");

        group.MapPost("/users/{userId}/confirm-email", async (
            string userId,
            ConfirmUserEmailHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new ConfirmUserEmailCommand(userId), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Update))
        .WithName("AdminConfirmUserEmail");

        group.MapPost("/users/{userId}/revoke-tokens", async (
            string userId,
            RevokeUserTokensHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new RevokeUserTokensCommand(userId), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Update))
        .WithName("RevokeUserTokens");

        // ── Subscription Plans ────────────────────────────────────────────────

        group.MapGet("/subscription-plans", async (
            GetAdminSubscriptionPlansHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new GetAdminSubscriptionPlansQuery(), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Subscription, Operations.Read))
        .WithName("GetAdminSubscriptionPlans");

        group.MapPut("/subscription-plans/{planId:guid}", async (
            Guid planId,
            [FromBody] UpdateSubscriptionPlanRequest req,
            UpdateSubscriptionPlanHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(
                new UpdateSubscriptionPlanCommand(planId, req.Name, req.Description, req.Amount, req.SortOrder, req.StripeProductId, req.StripePriceId), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Subscription, Operations.Update))
        .WithName("UpdateSubscriptionPlan");

        // ── Create User ───────────────────────────────────────────────────────

        group.MapPost("/users", async (
            [FromBody] CreateUserByAdminRequest req,
            CreateUserByAdminHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(
                new CreateUserByAdminCommand(req.Email, req.FullName, req.Password, req.Role), ct);
            return result.IsSuccess ? Results.Ok(result.Value) : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Update))
        .WithName("CreateUserByAdmin");

        // ── Instructors ───────────────────────────────────────────────────────

        group.MapGet("/instructors", async (GetInstructorsHandler handler, CancellationToken ct) =>
            Results.Ok(await handler.Handle(new GetInstructorsQuery(), ct)))
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Read))
        .WithName("GetInstructors");

        // ── Courses ───────────────────────────────────────────────────────────

        group.MapGet("/courses", async (
            string? search,
            string? instructorId,
            int? status,
            int page,
            int pageSize,
            GetAdminCoursesHandler handler,
            CancellationToken ct) =>
            Results.Ok(await handler.Handle(new GetAdminCoursesQuery(search, instructorId, status, page, pageSize), ct)))
        .RequireAuthorization(x => x.RequireClaim(Resources.Course, Operations.Read))
        .WithName("GetAdminCourses");

        group.MapPut("/courses/{courseId:guid}/status", async (
            Guid courseId,
            [FromBody] SetCourseStatusRequest req,
            SetCourseStatusHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.Handle(new SetCourseStatusCommand(courseId, req.Status), ct);
            return result.IsSuccess ? Results.Ok() : Results.BadRequest(result.Error);
        })
        .RequireAuthorization(x => x.RequireClaim(Resources.Course, Operations.Update))
        .WithName("AdminSetCourseStatus");

        // ── Audit Logs ────────────────────────────────────────────────────────

        group.MapGet("/audit-logs", async (
            string? entityName,
            string? userName,
            DateTime? dateFrom,
            DateTime? dateTo,
            int page,
            int pageSize,
            bool? sortAsc,
            GetAuditLogsHandler handler,
            CancellationToken ct) =>
            Results.Ok(await handler.Handle(new GetAuditLogsQuery(entityName, userName, dateFrom, dateTo, page, pageSize, sortAsc ?? false), ct)))
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Read))
        .WithName("GetAuditLogs");

        // ── Auth Logs ─────────────────────────────────────────────────────────

        group.MapGet("/auth-logs", async (
            string? email,
            bool? success,
            DateTime? dateFrom,
            DateTime? dateTo,
            int page,
            int pageSize,
            GetAuthLogsHandler handler,
            CancellationToken ct) =>
            Results.Ok(await handler.Handle(new GetAuthLogsQuery(email, success, dateFrom, dateTo, page, pageSize), ct)))
        .RequireAuthorization(x => x.RequireClaim(Resources.User, Operations.Read))
        .WithName("GetAuthLogs");
    }
}

public record UpdateUserRequest(string FullName, string Role);
public record ToggleUserStatusRequest(bool IsActive);
public record UpdateSubscriptionPlanRequest(string Name, string Description, decimal Amount, int SortOrder, string? StripeProductId, string? StripePriceId);
public record CreateUserByAdminRequest(string Email, string FullName, string Password, string Role);
public record SetCourseStatusRequest(CourseStatus Status);
