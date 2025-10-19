namespace Auth0Mediator.Api.Features.Admin;

public record UserSummaryDto(string Id, string? Email, bool Blocked, string[] Roles);
public record AssignRolesDto(string[] RoleIds);
public record BlockDto(bool Block);

public record RoleDto(string Id, string Name, string? Description);
public record SimpleRoleDto(string Id, string Name);
