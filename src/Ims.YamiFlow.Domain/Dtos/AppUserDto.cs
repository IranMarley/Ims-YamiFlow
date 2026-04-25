namespace Ims.YamiFlow.Domain.Dtos;

public record AppUserDto(string Id, string Email, string FullName, bool IsActive, bool EmailConfirmed);
