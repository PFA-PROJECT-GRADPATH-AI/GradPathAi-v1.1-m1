using System.Security.Claims;
using System.Text;
using System.Text.Json;
using GradPath.Member1.Api.Contracts;
using GradPath.Member1.Api.Infrastructure;
using GradPath.Member1.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GradPath.Member1.Api.Controllers;

[ApiController]
[Route("api/v1/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;
    private readonly ILogger<ProfileController> _logger;

    public ProfileController(IProfileService profileService, ILogger<ProfileController> logger)
    {
        _profileService = profileService;
        _logger = logger;
    }

    private Guid GetCurrentUserId()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User ID not found in token.");
        return Guid.Parse(id);
    }

    /// <summary>GET /api/v1/profile/me</summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetProfile()
    {
        var profile = await _profileService.GetProfileAsync(GetCurrentUserId());
        if (profile is null) return NotFound(new { detail = "Profile not yet created." });
        return Ok(profile);
    }

    /// <summary>PUT /api/v1/profile/me</summary>
    [HttpPut("me")]
    public async Task<IActionResult> UpsertProfile([FromBody] ProfileDto dto)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var result = await _profileService.UpsertProfileAsync(GetCurrentUserId(), dto);
        return Ok(result);
    }

    /// <summary>GET /api/v1/profile/me/consented-summary — ProfileSnapshot v1 for Member 2</summary>
    [HttpGet("me/consented-summary")]
    public async Task<IActionResult> GetConsentedSummary()
    {
        var snapshot = await _profileService.GetProfileSnapshotAsync(GetCurrentUserId());
        return Ok(snapshot);
    }

    /// <summary>GET /api/v1/profile/me/export — Direct File Export for Member 2 Integrators</summary>
    [HttpGet("me/export")]
    public async Task<IActionResult> ExportSnapshotForMember2()
    {
        var userId = GetCurrentUserId();
        var snapshot = await _profileService.GetProfileSnapshotAsync(userId);

        var exportEnvelope = new
        {
            contractVersion = "v1.0",
            targetModule = "Member2-RecommendationEngine",
            schema = "https://schemas.gradpath.ai/contracts/member2/profile-snapshot-v1.json",
            exportedAtUtc = DateTime.UtcNow,
            data = snapshot
        };

        var json = JsonSerializer.Serialize(exportEnvelope, new JsonSerializerOptions { WriteIndented = true });
        var bytes = Encoding.UTF8.GetBytes(json);
        var fileName = $"GradPath_Member2_Snapshot_{userId.ToString()[..8]}_v1.json";

        _logger.LogInformation("Profile.ExportedForMember2 StudentId={StudentId} FileName={FileName}", userId, fileName);

        return File(bytes, "application/json", fileName);
    }

    /// <summary>GET /api/v1/profile/privacy-audit</summary>
    [HttpGet("privacy-audit")]
    [AllowAnonymous]
    public IActionResult GetPrivacyAudit([FromServices] IPrivacyPolicyRegistry registry)
    {
        return Ok(new
        {
            consentVersion = registry.CurrentConsentVersion,
            allowedCvMimeTypes = registry.AllowedCvMimeTypes,
            maxCvFileSizeMb = registry.MaxCvFileSizeBytes / (1024.0 * 1024.0),
            piiFieldsRedacted = registry.PiiFieldsRedacted
        });
    }
}
