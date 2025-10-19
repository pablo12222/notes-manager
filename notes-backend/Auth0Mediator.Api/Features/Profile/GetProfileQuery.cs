using MediatR;

namespace Auth0Mediator.Api.Features.Profile;

public record GetProfileQuery(string Sub, string? Name, string? Email) : IRequest<UserProfileDto>;
