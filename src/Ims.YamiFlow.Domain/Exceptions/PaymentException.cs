namespace Ims.YamiFlow.Domain.Exceptions;

public class PaymentException(string message, string? code = null) : Exception(message)
{
    public string? Code { get; } = code;
}
