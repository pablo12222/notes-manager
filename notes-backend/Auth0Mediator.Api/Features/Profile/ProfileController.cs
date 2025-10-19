using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Auth0Mediator.Api.Features.Profile;

[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProfileController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Get()
    {
        var sub = User.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(sub)) return Unauthorized();

        var name  = User.FindFirst("name")?.Value ?? User.Identity?.Name;
        var email = User.FindFirst("email")?.Value;

        var dto = await _mediator.Send(new GetProfileQuery(sub!, name, email));
        return Ok(dto);
    }
}
