using MongoDB.Driver;

namespace Auth0Mediator.Api.Features.BoardCards.Persistence;

public class BoardCardsRepository : IBoardCardsRepository
{
    public IMongoCollection<BoardCardEntity> Collection { get; }

    public BoardCardsRepository(IMongoDatabase db)
    {
        Collection = db.GetCollection<BoardCardEntity>("board_cards");
        BoardCardConfiguration.EnsureIndexes(Collection);
    }

    public Task<List<BoardCardEntity>> GetAll(string ownerSub, CancellationToken ct) =>
        Collection.Find(x => x.OwnerSub == ownerSub)
                  .SortBy(x => x.Column).ThenBy(x => x.Order)
                  .ToListAsync(ct);

    public async Task<BoardCardEntity?> Get(Guid id, CancellationToken ct)
    {
        return await Collection.Find(x => x.Id == id).FirstOrDefaultAsync(ct);
    }
    
    public async Task<int> NextOrder(string ownerSub, BoardColumn column, CancellationToken ct)
    {
        var last = await Collection.Find(x => x.OwnerSub == ownerSub && x.Column == column)
                                   .SortByDescending(x => x.Order).Limit(1)
                                   .FirstOrDefaultAsync(ct);
        return last?.Order is int n ? n + 1 : 0;
    }

    public Task Add(BoardCardEntity entity, CancellationToken ct) =>
        Collection.InsertOneAsync(entity, cancellationToken: ct);

    public Task Update(BoardCardEntity entity, CancellationToken ct)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        return Collection.ReplaceOneAsync(x => x.Id == entity.Id, entity, cancellationToken: ct);
    }

    public Task Delete(Guid id, CancellationToken ct) =>
        Collection.DeleteOneAsync(x => x.Id == id, ct);
}
