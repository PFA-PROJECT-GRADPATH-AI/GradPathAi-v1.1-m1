namespace GradPath.Member1.Api.Services;

public interface ICvExtractor
{
    Task<CvExtractionResult> ExtractAsync(Stream fileStream, string fileName, string contentType);
}

public record CvExtractionResult(
    bool Success,
    string? CandidateName,
    string? Email,
    string? Phone,
    string? Degree,
    double? Cgpa,
    double? CgpaScale,
    int? GraduationYear,
    string[] ExtractedSkills,
    string[] ExtractedResearchInterests,
    string[] ExtractedCertifications,
    string[] ExtractedProjects,
    string? Institution,
    string? RawSummary,
    string? ErrorMessage
);
