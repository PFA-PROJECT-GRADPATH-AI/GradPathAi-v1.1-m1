using System.ComponentModel.DataAnnotations;

namespace GradPath.Member1.Api.Contracts;

public record RegisterDto(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [Required] string FullName
);

public record LoginDto(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record UserInfoDto(
    Guid Id,
    string Email,
    string FullName,
    bool HasProfile
);
