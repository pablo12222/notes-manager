using MongoDB.Driver;

namespace Auth0Mediator.Api.Features.Users;

public class UsersRepository : IUsersRepository
{
    private readonly IMongoCollection<UserEntity> _col;
    private readonly ILogger<UsersRepository> _logger;

    public UsersRepository(IMongoDatabase db, ILogger<UsersRepository> logger)
    {
        _logger = logger;
        _col = db.GetCollection<UserEntity>("users");
        EnsureIndexes();
    }

    private void EnsureIndexes()
    {
        try
        {
            // NIE tworzymy indeksu na _id — Mongo tworzy go automatycznie.
            var models = new[]
            {
                new CreateIndexModel<UserEntity>(
                    Builders<UserEntity>.IndexKeys.Ascending(x => x.Email),
                    new CreateIndexOptions { Unique = false, Sparse = true })
            };
            _col.Indexes.CreateMany(models);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Nie udało się utworzyć indeksów kolekcji 'users'.");
        }
    }

    public async Task<UserEntity?> GetByIdAsync(string id, CancellationToken ct = default)
        => (await _col.FindAsync(x => x.Id == id, cancellationToken: ct)).FirstOrDefault(ct);

    public Task UpsertOnLoginAsync(UserEntity user, CancellationToken ct = default)
    {
        var filter = Builders<UserEntity>.Filter.Eq(x => x.Id, user.Id);

        var update = Builders<UserEntity>.Update
            .SetOnInsert(x => x.CreatedAt, DateTime.UtcNow)
            .Set(x => x.Email, user.Email)
            .Set(x => x.Name, user.Name)
            .Set(x => x.LastSeenAt, DateTime.UtcNow);

        return _col.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true }, ct);
    }
}
