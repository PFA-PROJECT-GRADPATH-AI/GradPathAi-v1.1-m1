namespace GradPath.Member1.Api.Infrastructure;

public interface IPrivacyPolicyRegistry
{
    string CurrentConsentVersion { get; }
    string[] AllowedCvMimeTypes { get; }
    long MaxCvFileSizeBytes { get; }
    string[] PiiFieldsRedacted { get; }
}
