using Auth0.AuthenticationApi;
using Auth0.AuthenticationApi.Models;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Auth0Mediator.Api.Features.Admin;

public class Auth0MgmtTokenProvider
{
    private readonly IMemoryCache _cache;
    private readonly Auth0MgmtOptions _opt;

    public Auth0MgmtTokenProvider(IMemoryCache cache, IOptions<Auth0MgmtOptions> opt)
    {
        _cache = cache;
        _opt   = opt.Value;
    }

    public async Task<string> GetTokenAsync()
    {
        return await _cache.GetOrCreateAsync("auth0-mgmt-token", async entry =>
        {
            var domain = _opt.Domain ?? throw new("Missing Auth0:Domain");
            var auth   = new AuthenticationApiClient(new Uri($"https://{domain}/"));

            var res = await auth.GetTokenAsync(new ClientCredentialsTokenRequest
            {
                Audience      = $"https://{domain}/api/v2/",
                ClientId      = _opt.Mgmt.ClientId ?? throw new("Missing Auth0:Mgmt:ClientId"),
                ClientSecret  = _opt.Mgmt.ClientSecret ?? throw new("Missing Auth0:Mgmt:ClientSecret")
            });

            // odśwież 60s przed wygaśnięciem
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(Math.Max(60, res.ExpiresIn - 60));
            return res.AccessToken;
        }) ?? throw new InvalidOperationException("Cannot get Management API token.");
    }
}
