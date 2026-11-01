using GradPath.Member1.Api.Services;

namespace GradPath.Member1.Api.Infrastructure;

/// <summary>
/// Adapter Pattern: Implements ICvExtractor.
/// Simulates PDF extraction — decouples PDF/OCR/LLM parsing from domain logic.
/// Real implementation can swap in Azure Document Intelligence or Gemini API without touching ProfileService.
/// </summary>
public class SimulatedPdfCvExtractorAdapter : ICvExtractor
{
    private readonly ILogger<SimulatedPdfCvExtractorAdapter> _logger;

    public SimulatedPdfCvExtractorAdapter(ILogger<SimulatedPdfCvExtractorAdapter> logger)
    {
        _logger = logger;
    }

    public Task<CvExtractionResult> ExtractAsync(Stream fileStream, string fileName, string contentType)
    {
        _logger.LogInformation("Cv.ExtractionStarted FileName={FileName}", fileName);

        // Simulated extraction — replace with real PDF parser in production
        var result = new CvExtractionResult(
            Success: true,
            ExtractedSkills: ["Python", "Machine Learning", "Data Analysis"],
            ExtractedResearchInterests: ["NLP", "Computer Vision"],
            ErrorMessage: null
        );

        _logger.LogInformation("Cv.ExtractionCompleted FileName={FileName} SkillsFound={Count}",
            fileName, result.ExtractedSkills.Length);

        return Task.FromResult(result);
    }
}
