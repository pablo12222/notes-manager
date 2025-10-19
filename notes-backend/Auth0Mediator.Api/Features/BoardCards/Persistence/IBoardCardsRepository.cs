using MongoDB.Driver;

namespace Auth0Mediator.Api.Features.BoardCards.Persistence;

public interface IBoardCardsRepository
{
    IMongoCollection<BoardCardEntity> Collection { get; }

    Task<List<BoardCardEntity>> GetAll(string ownerSub, CancellationToken ct);
    Task<BoardCardEntity?> Get(Guid id, CancellationToken ct);
    Task<int> NextOrder(string ownerSub, BoardColumn column, CancellationToken ct);
    Task Add(BoardCardEntity entity, CancellationToken ct);
    Task Update(BoardCardEntity entity, CancellationToken ct);
    Task Delete(Guid id, CancellationToken ct);
}
