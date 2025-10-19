using MediatR;

namespace Auth0Mediator.Api.Features.Notes;

public record GetNotesQuery(string UserSub) : IRequest<IReadOnlyList<NoteEntity>>;
