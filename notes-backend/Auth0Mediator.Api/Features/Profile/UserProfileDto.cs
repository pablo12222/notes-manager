namespace Auth0Mediator.Api.Features.Profile;

public class UserProfileDto
{
    public string Id { get; set; } = default!;
    public string? Email { get; set; }
    public string? Name  { get; set; }
}
