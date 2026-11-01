namespace GradPath.Member1.Api.Domain;

public class StudentProfile
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid StudentId { get; set; }
    public ApplicationUser Student { get; set; } = null!;
    public string Degree { get; set; } = string.Empty;
    public double Cgpa { get; set; }
    public double CgpaScale { get; set; } = 4.0;
    public int GraduationYear { get; set; }
    public string SkillsCsv { get; set; } = string.Empty;
    public string ResearchInterestsCsv { get; set; } = string.Empty;
    public string TargetCountriesCsv { get; set; } = string.Empty;
    public string TargetIntake { get; set; } = string.Empty;
    public string FundingPreference { get; set; } = string.Empty;
    public string ConsentVersion { get; set; } = "v1.0";
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
