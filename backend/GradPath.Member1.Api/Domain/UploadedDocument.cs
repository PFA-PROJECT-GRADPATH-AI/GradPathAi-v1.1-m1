namespace GradPath.Member1.Api.Domain;

public class UploadedDocument
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid StudentId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;
}
