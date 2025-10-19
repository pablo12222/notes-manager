using MediatR;

namespace Auth0Mediator.Api.Features.Notes;

public class GetNoteByIdHandler(INotesRepository repo) : IRequestHandler<GetNoteByIdQuery, NoteEntity?>
{
    public async Task<NoteEntity?> Handle(GetNoteByIdQuery request, CancellationToken ct)
    {
        var note = await repo.GetByIdAsync(request.Id, ct);
        return note is not null && note.UserSub == request.UserSub ? note : null;
    }
}
