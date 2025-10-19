using MediatR;

namespace Auth0Mediator.Api.Features.Notes;

public record UpdateNoteCommand(string Id, string UserSub, string Title, string Content, string? Status) : IRequest<bool>;

