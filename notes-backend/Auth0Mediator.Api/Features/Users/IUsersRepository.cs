namespace Auth0Mediator.Api.Features.Users;

public interface IUsersRepository
{
    Task<UserEntity?> GetByIdAsync(string id, CancellationToken ct = default);
    Task UpsertOnLoginAsync(UserEntity user, CancellationToken ct = default);
}
