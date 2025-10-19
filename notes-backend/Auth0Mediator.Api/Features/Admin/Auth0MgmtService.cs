using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Auth0.ManagementApi;
using Auth0.ManagementApi.Models;

namespace Auth0Mediator.Api.Features.Admin;

public class Auth0MgmtService : IAuth0MgmtService
{
    private readonly IManagementApiClient _mgmt;

    public Auth0MgmtService(IManagementApiClient mgmt)
    {
        _mgmt = mgmt ?? throw new ArgumentNullException(nameof(mgmt));
    }

    // Lista użytkowników + role (lokalna paginacja)
    public async Task<(int total, IEnumerable<UserSummaryDto> items)> GetUsersAsync(string? q, int page, int pageSize)
    {
        var allUsers = await _mgmt.Users.GetAllAsync(new GetUsersRequest
        {
            Query = q,
            SearchEngine = "v3"
        });

        var all = allUsers?.ToList() ?? new List<User>();
        var total = all.Count;

        var slice = all.Skip(page * pageSize).Take(pageSize).ToList();
        var result = new List<UserSummaryDto>(slice.Count);

        foreach (var u in slice)
        {
            string[] roles = Array.Empty<string>();
            try
            {
                var r = await _mgmt.Users.GetRolesAsync(u.UserId ?? string.Empty);
                var roleList = r?.ToList() ?? new List<Role>();
                roles = roleList.Select(x => x.Name ?? string.Empty).ToArray();
            }
            catch
            {
                // brak scope’ów do ról / błąd sieci — zostaw pustą tablicę
            }

            result.Add(new UserSummaryDto(
                u.UserId ?? string.Empty,
                u.Email ?? string.Empty,
                u.Blocked ?? false,
                roles
            ));
        }

        return (total, result);
    }

    public Task BlockAsync(string userId, bool block) =>
        _mgmt.Users.UpdateAsync(userId, new UserUpdateRequest { Blocked = block });

    public async Task<string> CreateResetPasswordTicketAsync(string userId, string? resultUrl)
    {
        var ticket = await _mgmt.Tickets.CreatePasswordChangeTicketAsync(new PasswordChangeTicketRequest
        {
            UserId = userId,
            ResultUrl = resultUrl
        });
        return ticket.Value;
    }

    // ➜ Role jako RoleDto (id, name, description)
    public async Task<IEnumerable<RoleDto>> GetRolesAsync()
    {
        var rolesResp = await _mgmt.Roles.GetAllAsync(new GetRolesRequest());
        var roles = rolesResp?.ToList() ?? new List<Role>();

        return roles.Select(r => new RoleDto(
            r.Id ?? string.Empty,
            r.Name ?? string.Empty,
            r.Description
        ));
    }

    // Zwracamy nazwy uprawnień
    public async Task<IEnumerable<string>> GetRolePermissionsAsync(string roleId)
    {
        var permsResp = await _mgmt.Roles.GetPermissionsAsync(
            roleId,
            pagination: default!,
            cancellationToken: CancellationToken.None
        );

        var perms = permsResp?.ToList() ?? new List<Permission>();
        return perms.Select(p => p.Name ?? string.Empty);
    }

    // ➜ Role użytkownika jako SimpleRoleDto (id, name)
    public async Task<IEnumerable<SimpleRoleDto>> GetUserRolesAsync(string userId)
    {
        var rolesResp = await _mgmt.Users.GetRolesAsync(userId);
        var roles = rolesResp?.ToList() ?? new List<Role>();
        return roles.Select(r => new SimpleRoleDto(r.Id ?? string.Empty, r.Name ?? string.Empty));
    }

    public Task AssignRolesAsync(string userId, IEnumerable<string> roleIds) =>
        _mgmt.Users.AssignRolesAsync(userId, new AssignRolesRequest
        {
            Roles = roleIds?.ToArray() ?? Array.Empty<string>()
        });

    public Task RemoveRoleAsync(string userId, string roleId) =>
        _mgmt.Users.RemoveRolesAsync(userId, new AssignRolesRequest
        {
            Roles = new[] { roleId }
        });
}
