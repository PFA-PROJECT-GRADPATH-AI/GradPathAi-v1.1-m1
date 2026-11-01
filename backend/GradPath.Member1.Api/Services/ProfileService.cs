using System.Diagnostics;
using GradPath.Member1.Api.Contracts;
using GradPath.Member1.Api.Domain;
using GradPath.Member1.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace GradPath.Member1.Api.Services;

/// <summary>
/// Scoped Service: Implements IProfileService.
/// Follows Controller-Service Layering + DI pattern (Scoped lifecycle).
/// </summary>
public class ProfileService : IProfileService
{
    private readonly AppDbContext _db;
    private readonly ILogger<ProfileService> _logger;

    public ProfileService(AppDbContext db, ILogger<ProfileService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<ProfileDto?> GetProfileAsync(Guid studentId)
    {
        var profile = await _db.StudentProfiles.FirstOrDefaultAsync(p => p.StudentId == studentId);
        if (profile is null) return null;

        return MapToDto(profile);
    }

    public async Task<ProfileDto> UpsertProfileAsync(Guid studentId, ProfileDto dto)
    {
        var sw = Stopwatch.StartNew();

        // Domain validation
        if (dto.Cgpa <= 0 || dto.Cgpa > dto.CgpaScale)
            throw new ArgumentException($"CGPA {dto.Cgpa} must be between 0 (exclusive) and CgpaScale {dto.CgpaScale}.");

        if (dto.GraduationYear < 2020 || dto.GraduationYear > 2032)
            throw new ArgumentException($"GraduationYear {dto.GraduationYear} must be between 2020 and 2032.");

        var profile = await _db.StudentProfiles.FirstOrDefaultAsync(p => p.StudentId == studentId);

        if (profile is null)
        {
            profile = new StudentProfile { StudentId = studentId };
            _db.StudentProfiles.Add(profile);
        }

        // Map DTO -> Entity (never trust studentId from request body — IDOR prevention)
        profile.Degree = dto.Degree;
        profile.Cgpa = dto.Cgpa;
        profile.CgpaScale = dto.CgpaScale;
        profile.GraduationYear = dto.GraduationYear;
        profile.SkillsCsv = dto.SkillsCsv;
        profile.ResearchInterestsCsv = dto.ResearchInterestsCsv;
        profile.TargetCountriesCsv = dto.TargetCountriesCsv;
        profile.TargetIntake = dto.TargetIntake;
        profile.FundingPreference = dto.FundingPreference;
        profile.ConsentVersion = dto.ConsentVersion;
        profile.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        sw.Stop();

        _logger.LogInformation(
            "Profile.Updated StudentId={StudentId} Cgpa={Cgpa}/{Scale} DurationMs={Elapsed}",
            studentId, dto.Cgpa, dto.CgpaScale, sw.ElapsedMilliseconds);

        return MapToDto(profile);
    }

    public async Task<ProfileSnapshotV1> GetProfileSnapshotAsync(Guid studentId)
    {
        var profile = await _db.StudentProfiles.FirstOrDefaultAsync(p => p.StudentId == studentId)
            ?? throw new KeyNotFoundException($"No profile found for student {studentId}.");

        return new ProfileSnapshotV1(
            StudentId: studentId,
            Degree: profile.Degree,
            Cgpa: profile.Cgpa,
            CgpaScale: profile.CgpaScale,
            GraduationYear: profile.GraduationYear,
            Skills: SplitCsv(profile.SkillsCsv),
            ResearchInterests: SplitCsv(profile.ResearchInterestsCsv),
            TargetCountries: SplitCsv(profile.TargetCountriesCsv),
            TargetIntake: profile.TargetIntake,
            FundingPreference: profile.FundingPreference,
            ConsentVersion: profile.ConsentVersion,
            SnapshotGeneratedAtUtc: DateTime.UtcNow
        );
    }

    private static ProfileDto MapToDto(StudentProfile p) => new(
        Degree: p.Degree,
        Cgpa: p.Cgpa,
        CgpaScale: p.CgpaScale,
        GraduationYear: p.GraduationYear,
        SkillsCsv: p.SkillsCsv,
        ResearchInterestsCsv: p.ResearchInterestsCsv,
        TargetCountriesCsv: p.TargetCountriesCsv,
        TargetIntake: p.TargetIntake,
        FundingPreference: p.FundingPreference,
        ConsentVersion: p.ConsentVersion
    );

    private static string[] SplitCsv(string csv) =>
        string.IsNullOrWhiteSpace(csv)
            ? []
            : csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}
