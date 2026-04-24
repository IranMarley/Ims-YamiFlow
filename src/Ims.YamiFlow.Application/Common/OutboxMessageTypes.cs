namespace Ims.YamiFlow.Application.Common;

public static class OutboxMessageTypes
{
    public const string ConfirmEmail = "ConfirmEmail";
    public const string ResetPassword = "ResetPassword";
}

public record ConfirmEmailPayload(string To, string Name, string ConfirmationLink);

public record ResetPasswordPayload(string To, string ResetLink);
