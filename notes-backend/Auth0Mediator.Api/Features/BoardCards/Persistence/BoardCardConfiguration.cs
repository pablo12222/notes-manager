using MongoDB.Driver;

namespace Auth0Mediator.Api.Features.BoardCards.Persistence;

public static class BoardCardConfiguration
{
    public static void EnsureIndexes(IMongoCollection<BoardCardEntity> col)
    {
        var keys = Builders<BoardCardEntity>.IndexKeys
            .Ascending(x => x.OwnerSub)
            .Ascending(x => x.Column)
            .Ascending(x => x.Order);

        col.Indexes.CreateOne(new CreateIndexModel<BoardCardEntity>(keys));
    }
}
