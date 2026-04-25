using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

using Ims.YamiFlow.Domain.Interfaces.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Ims.YamiFlow.Infrastructure.IAM;

public class TokenService(
    UserManager<AppUser> userManager,
    RoleManager<AppRole> roleManager,
    IConfiguration config) : ITokenService
{
    public async Task<AuthTokens> GenerateTokensAsync(string userId)
    {
        var user = await userManager.FindByIdAsync(userId)
                   ?? throw new InvalidOperationException("User not found.");

        var accessToken = await BuildAccessTokenAsync(user);
        var refreshToken = GenerateRefreshToken();

        var jwtSettings = config.GetSection("JwtSettings");
        var refreshDays = int.TryParse(jwtSettings["RefreshTokenExpirationDays"], out var d) ? d : 30;
        var expiryHours = int.TryParse(jwtSettings["ExpirationHours"], out var h) ? h : 8;

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(refreshDays);
        await userManager.UpdateAsync(user);

        return new AuthTokens(accessToken, refreshToken, DateTime.UtcNow.AddHours(expiryHours));
    }

    public async Task<AuthTokens?> RefreshAsync(string refreshToken)
    {
        var user = await userManager.Users
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

        if (user is null || user.RefreshTokenExpiry <= DateTime.UtcNow)
            return null;

        return await GenerateTokensAsync(user.Id);
    }

    public async Task RevokeAsync(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return;

        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        await userManager.UpdateAsync(user);
    }

    // ── Private helpers ───────────────────────────────
    private async Task<string> BuildAccessTokenAsync(AppUser user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,   user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            new("fullName",                    user.FullName)
        };

        var roles = await userManager.GetRolesAsync(user);
        foreach (var roleName in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, roleName));

            var role = await roleManager.FindByNameAsync(roleName);
            if (role is null) continue;

            // add all permission claims stored as Claim(resource, operation)
            var roleClaims = await roleManager.GetClaimsAsync(role);
            claims.AddRange(roleClaims);
        }

        var jwtSettings = config.GetSection("JwtSettings");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var hours = int.TryParse(jwtSettings["ExpirationHours"], out var h) ? h : 8;

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(hours),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }
}
