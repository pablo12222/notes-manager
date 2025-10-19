using MediatR;

namespace Auth0Mediator.Api.Features.Notes;

public record GetNoteByIdQuery(string Id, string UserSub) : IRequest<NoteEntity?>;
