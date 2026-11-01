using GradPath.Member1.Api.Contracts;

namespace GradPath.Member1.Api.Services;

public interface IProfileService
{
    Task<ProfileDto?> GetProfileAsync(Guid studentId);
    Task<ProfileDto> UpsertProfileAsync(Guid studentId, ProfileDto dto);
    Task<ProfileSnapshotV1> GetProfileSnapshotAsync(Guid studentId);
}
