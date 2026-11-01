namespace GradPath.Member1.Api.Infrastructure;

/// <summary>
/// Singleton: Holds immutable application-wide privacy and policy configuration.
/// Implements Singleton Design Pattern — single instance shared across all HTTP requests.
/// </summary>
public sealed class PrivacyPolicyRegistry : IPrivacyPolicyRegistry
{
    public string CurrentConsentVersion => "v1.0";
    public string[] AllowedCvMimeTypes => ["application/pdf"];
    public long MaxCvFileSizeBytes => 5 * 1024 * 1024; // 5 MB
    public string[] PiiFieldsRedacted => ["Password", "SessionToken", "RawCvText"];
}
