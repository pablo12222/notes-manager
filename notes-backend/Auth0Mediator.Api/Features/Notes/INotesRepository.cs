using MongoDB.Driver;

namespace Auth0Mediator.Api.Features.Notes;

public interface INotesRepository
{
    Task<NoteEntity> AddAsync(NoteEntity note, CancellationToken ct);
    Task<IReadOnlyList<NoteEntity>> GetAllByUserAsync(string userSub, CancellationToken ct);
    Task<NoteEntity?> GetByIdAsync(string id, CancellationToken ct);
    Task<bool> UpdateAsync(NoteEntity note, CancellationToken ct);
    Task<bool> DeleteAsync(string id, string userSub, CancellationToken ct);
}
