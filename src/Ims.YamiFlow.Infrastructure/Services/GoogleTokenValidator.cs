using Google.Apis.Auth;
using Ims.YamiFlow.Domain.Interfaces.Services;
using Microsoft.Extensions.Configuration;

namespace Ims.YamiFlow.Infrastructure.Services;

public class GoogleTokenValidator(IConfiguration config) : IGoogleTokenValidator
{
    public async Task<GoogleUserInfo?> ValidateAsync(string idToken, CancellationToken ct = default)
    {
        var clientId = config["Authentication:Google:ClientId"];

        var settings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = [clientId]
        };

        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            return new GoogleUserInfo(payload.Email, payload.Name, payload.Picture);
        }
        catch (InvalidJwtException)
        {
            return null;
        }
    }
}
