using Microsoft.AspNetCore.Identity;

namespace GradPath.Member1.Api.Domain;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public StudentProfile? Profile { get; set; }
}
