using System.ComponentModel.DataAnnotations;

namespace GradPath.Member1.Api.Contracts;

public record ProfileDto(
    [Required] string Degree,
    [Range(0.01, 10.0)] double Cgpa,
    [Range(1.0, 10.0)] double CgpaScale,
    [Range(2020, 2032)] int GraduationYear,
    string SkillsCsv,
    string ResearchInterestsCsv,
    string TargetCountriesCsv,
    string TargetIntake,
    string FundingPreference,
    string ConsentVersion = "v1.0"
);

public record ProfileSnapshotV1(
    Guid StudentId,
    string Degree,
    double Cgpa,
    double CgpaScale,
    int GraduationYear,
    string[] Skills,
    string[] ResearchInterests,
    string[] TargetCountries,
    string TargetIntake,
    string FundingPreference,
    string ConsentVersion,
    DateTime SnapshotGeneratedAtUtc
);
