using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Auth0Mediator.Api.Features.Admin;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    [Authorize(Policy = "read:admin-secret")]
    [HttpGet("secret")]
    public IActionResult Secret() =>
        Ok(new { topSecret = "42", you = User.FindFirst("sub")?.Value });

    // === USERS ===

    [Authorize(Policy = "read:admin-users")]
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromServices] IAuth0MgmtService svc,
        [FromQuery] string? q = null,
        [FromQuery] int page = 0,
        [FromQuery] int pageSize = 25)
    {
        var (total, items) = await svc.GetUsersAsync(q, page, pageSize);
        return Ok(new { total, items });
    }

    [Authorize(Policy = "update:admin-users")]
    [HttpPost("users/{id}/block")]
    public async Task<IActionResult> BlockUser(
        [FromServices] IAuth0MgmtService svc,
        string id,
        [FromBody] BlockDto dto)
    {
        await svc.BlockAsync(id, dto.Block);
        return NoContent();
    }

    [Authorize(Policy = "reset:admin-passwords")]
    [HttpPost("users/{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(
        [FromServices] IAuth0MgmtService svc,
        string id,
        [FromQuery] string? resultUrl = null)
    {
        var url = await svc.CreateResetPasswordTicketAsync(id, resultUrl);
        return Ok(new { ticketUrl = url });
    }

    // === ROLES ===

    [Authorize(Policy = "read:admin-roles")]
    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles([FromServices] IAuth0MgmtService svc) =>
        Ok(await svc.GetRolesAsync());

    [Authorize(Policy = "read:admin-roles")]
    [HttpGet("roles/{roleId}/permissions")]
    public async Task<IActionResult> GetRolePermissions(
        [FromServices] IAuth0MgmtService svc,
        string roleId) =>
        Ok(await svc.GetRolePermissionsAsync(roleId));

    [Authorize(Policy = "read:admin-roles")]
    [HttpGet("users/{id}/roles")]
    public async Task<IActionResult> GetUserRoles(
        [FromServices] IAuth0MgmtService svc,
        string id) =>
        Ok(await svc.GetUserRolesAsync(id));

    [Authorize(Policy = "manage:admin-roles")]
    [HttpPost("users/{id}/roles")]
    public async Task<IActionResult> AssignRoles(
        [FromServices] IAuth0MgmtService svc,
        string id,
        [FromBody] AssignRolesDto dto)
    {
        await svc.AssignRolesAsync(id, dto.RoleIds);
        return NoContent();
    }

    [Authorize(Policy = "manage:admin-roles")]
    [HttpDelete("users/{id}/roles/{roleId}")]
    public async Task<IActionResult> RemoveRole(
        [FromServices] IAuth0MgmtService svc,
        string id,
        string roleId)
    {
        await svc.RemoveRoleAsync(id, roleId);
        return NoContent();
    }
}
