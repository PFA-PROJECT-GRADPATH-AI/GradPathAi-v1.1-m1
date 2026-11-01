using System.Security.Claims;
using GradPath.Member1.Api.Infrastructure;
using GradPath.Member1.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GradPath.Member1.Api.Controllers;

[ApiController]
[Route("api/v1/profile/me/cv")]
[Authorize]
public class CvController : ControllerBase
{
    private readonly ICvExtractor _cvExtractor;
    private readonly IPrivacyPolicyRegistry _privacyRegistry;
    private readonly ILogger<CvController> _logger;

    public CvController(
        ICvExtractor cvExtractor,
        IPrivacyPolicyRegistry privacyRegistry,
        ILogger<CvController> logger)
    {
        _cvExtractor = cvExtractor;
        _privacyRegistry = privacyRegistry;
        _logger = logger;
    }

    /// <summary>POST /api/v1/profile/me/cv — Information Retrieval & Adapter Pattern entry point</summary>
    [HttpPost]
    public async Task<IActionResult> UploadCv(IFormFile file)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        // Validate MIME type against Singleton PrivacyPolicyRegistry
        if (!_privacyRegistry.AllowedCvMimeTypes.Contains(file.ContentType))
        {
            _logger.LogWarning("Cv.UploadRejected StudentId={StudentId} Reason={Reason}", userId, "InvalidFileExtension");
            return BadRequest(new { detail = $"Only PDF files are allowed. Got: {file.ContentType}" });
        }

        // Validate file size against Singleton PrivacyPolicyRegistry
        if (file.Length > _privacyRegistry.MaxCvFileSizeBytes)
        {
            _logger.LogWarning("Cv.UploadRejected StudentId={StudentId} Reason={Reason}", userId, "FileTooLarge");
            return BadRequest(new { detail = "File exceeds maximum size of 5 MB." });
        }

        using var stream = file.OpenReadStream();
        var result = await _cvExtractor.ExtractAsync(stream, file.FileName, file.ContentType);

        if (!result.Success)
            return UnprocessableEntity(new { detail = result.ErrorMessage });

        _logger.LogInformation("Cv.Uploaded StudentId={StudentId} FileName={FileName}", userId, file.FileName);

        return Ok(new
        {
            candidateName = result.CandidateName,
            email = result.Email,
            phone = result.Phone,
            degree = result.Degree,
            cgpa = result.Cgpa,
            cgpaScale = result.CgpaScale,
            graduationYear = result.GraduationYear,
            institution = result.Institution,
            extractedSkills = result.ExtractedSkills,
            extractedResearchInterests = result.ExtractedResearchInterests,
            extractedCertifications = result.ExtractedCertifications,
            extractedProjects = result.ExtractedProjects,
            rawSummary = result.RawSummary,
            message = "CV credentials analyzed and extracted successfully via Information Retrieval (IR) pipeline."
        });
    }
}
