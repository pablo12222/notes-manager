using MediatR;

namespace Auth0Mediator.Api.Features.Notes;

public class UpdateNoteHandler(INotesRepository repo) : IRequestHandler<UpdateNoteCommand, bool>
{
    public async Task<bool> Handle(UpdateNoteCommand request, CancellationToken ct)
    {
        var existing = await repo.GetByIdAsync(request.Id, ct);
        if (existing is null || existing.UserSub != request.UserSub) return false;

        existing.Title   = request.Title;
        existing.Content = request.Content;
        if (!string.IsNullOrWhiteSpace(request.Status))
            existing.Status = request.Status!;

        return await repo.UpdateAsync(existing, ct);
    }
}
