using MediatR;

namespace Auth0Mediator.Api.Features.Notes;

public record AddNoteCommand(string UserSub, string Title, string Content) : IRequest<NoteEntity>;
