namespace Ims.YamiFlow.Application.Common;

public record ConfirmEmailPayload(string To, string Name, string ConfirmationLink);
