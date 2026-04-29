namespace Ims.YamiFlow.API.Middlewares;

public class SecurityHeadersMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        // Prevent Clickjacking
        context.Response.Headers.Append("X-Frame-Options", "DENY");

        // Prevent MIME sniffing
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");

        // Control how much referrer information is shared
        context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");

        // Content Security Policy: Strict for an API
        // Skip strict CSP for Swagger UI to avoid breaking it in development
        if (!context.Request.Path.StartsWithSegments("/swagger"))
        {
            context.Response.Headers.Append("Content-Security-Policy", 
                "default-src 'none'; frame-ancestors 'none'; sandbox;");
        }

        // Disable unused browser features
        context.Response.Headers.Append("Permissions-Policy", 
            "camera=(), microphone=(), geolocation=(), payment=()");

        // Prevent Adobe Flash from loading content from this domain
        context.Response.Headers.Append("X-Permitted-Cross-Domain-Policies", "none");

        await next(context);
    }
}
