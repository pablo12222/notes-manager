using MediatR;
using Auth0Mediator.Api.Features.Users;

namespace Auth0Mediator.Api.Features.Profile;

public class GetProfileHandler : IRequestHandler<GetProfileQuery, UserProfileDto>
{
    private readonly IUsersRepository _users;

    public GetProfileHandler(IUsersRepository users) => _users = users;

    public async Task<UserProfileDto> Handle(GetProfileQuery req, CancellationToken ct)
    {
        // upsert użytkownika na podstawie tokena
        await _users.UpsertOnLoginAsync(new UserEntity
        {
            Id = req.Sub,
            Email = req.Email,
            Name = req.Name
        }, ct);

        var user = await _users.GetByIdAsync(req.Sub, ct) 
                   ?? new UserEntity { Id = req.Sub, Email = req.Email, Name = req.Name };

        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name
        };
    }
}
