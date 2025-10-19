using MediatR;

namespace Auth0Mediator.Api.Features.Notes;

public class AddNoteHandler(INotesRepository repo) : IRequestHandler<AddNoteCommand, NoteEntity>
{
    public Task<NoteEntity> Handle(AddNoteCommand request, CancellationToken ct)
        => repo.AddAsync(new NoteEntity
        {
            UserSub = request.UserSub,
            Title = request.Title,
            Content = request.Content,
            Status  = "todo"
        }, ct);
}
