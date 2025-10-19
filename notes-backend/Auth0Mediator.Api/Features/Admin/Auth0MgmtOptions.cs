namespace Auth0Mediator.Api.Features.Admin;

public class Auth0MgmtOptions
{
    public string? Domain { get; set; }
    public string? Audience { get; set; }

    public MgmtOptions Mgmt { get; set; } = new();
    public class MgmtOptions
    {
        public string? ClientId { get; set; }
        public string? ClientSecret { get; set; }
    }
}
