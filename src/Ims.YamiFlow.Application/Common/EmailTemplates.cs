namespace Ims.YamiFlow.Application.Common;

public static class EmailTemplates
{
    public static string ConfirmEmail(string name, string confirmationLink) => $"""
        <!DOCTYPE html>
        <html>
        <body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:32px;">
          <div style="max-width:520px;margin:auto;background:#fff;border-radius:8px;padding:32px;">
            <h2 style="color:#1a1a1a;">Welcome to YamiFlow, {name}!</h2>
            <p style="color:#555;">Please confirm your email address to activate your account.</p>
            <a href="{confirmationLink}"
               style="display:inline-block;margin:24px 0;padding:12px 28px;background:#6c47ff;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
              Confirm Email
            </a>
            <p style="color:#999;font-size:12px;">
              This link expires in 24 hours. If you didn't create an account, you can ignore this email.
            </p>
          </div>
        </body>
        </html>
        """;

    public static string ResetPassword(string resetLink) => $"""
        <!DOCTYPE html>
        <html>
        <body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:32px;">
          <div style="max-width:520px;margin:auto;background:#fff;border-radius:8px;padding:32px;">
            <h2 style="color:#1a1a1a;">Reset your password</h2>
            <p style="color:#555;">We received a request to reset your YamiFlow password. Click below to choose a new one.</p>
            <a href="{resetLink}"
               style="display:inline-block;margin:24px 0;padding:12px 28px;background:#6c47ff;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
              Reset Password
            </a>
            <p style="color:#999;font-size:12px;">
              This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
        """;
}
