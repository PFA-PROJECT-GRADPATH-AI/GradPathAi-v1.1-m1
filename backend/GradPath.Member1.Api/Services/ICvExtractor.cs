namespace GradPath.Member1.Api.Services;

public interface ICvExtractor
{
    Task<CvExtractionResult> ExtractAsync(Stream fileStream, string fileName, string contentType);
}

public record CvExtractionResult(
    bool Success,
    string[] ExtractedSkills,
    string[] ExtractedResearchInterests,
    string? ErrorMessage
);
