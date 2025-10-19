using System.Collections.Generic;
using System.Threading.Tasks;

namespace Auth0Mediator.Api.Features.Admin;

public interface IAuth0MgmtService
{
    Task<(int total, IEnumerable<UserSummaryDto> items)> GetUsersAsync(string? q, int page, int pageSize);

    Task BlockAsync(string userId, bool block);

    Task<string> CreateResetPasswordTicketAsync(string userId, string? resultUrl);


    Task<IEnumerable<RoleDto>> GetRolesAsync();

    Task<IEnumerable<string>> GetRolePermissionsAsync(string roleId);

    Task<IEnumerable<SimpleRoleDto>> GetUserRolesAsync(string userId);

    Task AssignRolesAsync(string userId, IEnumerable<string> roleIds);

    Task RemoveRoleAsync(string userId, string roleId);
}
