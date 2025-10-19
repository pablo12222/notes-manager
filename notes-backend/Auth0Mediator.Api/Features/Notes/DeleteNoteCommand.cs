using MediatR;

namespace Auth0Mediator.Api.Features.Notes;

public record DeleteNoteCommand(string Id, string UserSub) : IRequest<bool>;
