using MediatR;

namespace Auth0Mediator.Api.Features.Notes;

public class DeleteNoteHandler(INotesRepository repo) : IRequestHandler<DeleteNoteCommand, bool>
{
    public Task<bool> Handle(DeleteNoteCommand request, CancellationToken ct)
        => repo.DeleteAsync(request.Id, request.UserSub, ct);
}
