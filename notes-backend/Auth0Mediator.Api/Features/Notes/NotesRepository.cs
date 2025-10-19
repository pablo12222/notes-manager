using MongoDB.Driver;

namespace Auth0Mediator.Api.Features.Notes;

public class NotesRepository(IMongoDatabase db) : INotesRepository
{
    private readonly IMongoCollection<NoteEntity> _col = db.GetCollection<NoteEntity>("notes");

    public async Task<NoteEntity> AddAsync(NoteEntity note, CancellationToken ct)
    {
        note.CreatedAt = DateTime.UtcNow;
        note.UpdatedAt = note.CreatedAt;
        await _col.InsertOneAsync(note, cancellationToken: ct);
        return note;
    }

    public async Task<IReadOnlyList<NoteEntity>> GetAllByUserAsync(string userSub, CancellationToken ct)
        => await _col.Find(x => x.UserSub == userSub).SortByDescending(x=>x.UpdatedAt).ToListAsync(ct);

    public Task<NoteEntity?> GetByIdAsync(string id, CancellationToken ct)
        => _col.Find(x => x.Id == id).FirstOrDefaultAsync(ct)!;

    public async Task<bool> UpdateAsync(NoteEntity note, CancellationToken ct)
    {
        note.UpdatedAt = DateTime.UtcNow;
        var res = await _col.ReplaceOneAsync(
            x => x.Id == note.Id && x.UserSub == note.UserSub,
            note,
            new ReplaceOptions { IsUpsert = false },
            ct);
        return res.ModifiedCount == 1;
    }

    public async Task<bool> DeleteAsync(string id, string userSub, CancellationToken ct)
    {
        var res = await _col.DeleteOneAsync(x => x.Id == id && x.UserSub == userSub, ct);
        return res.DeletedCount == 1;
    }
}
