using MediatR;

namespace Auth0Mediator.Api.Features.Notes;

public class GetNotesHandler(INotesRepository repo)
    : IRequestHandler<GetNotesQuery, IReadOnlyList<NoteEntity>>
{
    public Task<IReadOnlyList<NoteEntity>> Handle(GetNotesQuery request, CancellationToken cancellationToken)
        => repo.GetAllByUserAsync(request.UserSub, cancellationToken);
}
