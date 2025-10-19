using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Auth0Mediator.Api.Features.BoardCards.Persistence;

public enum BoardColumn { Backlog = 0, Doing = 1, Done = 2 }

public class BoardCardEntity
{
    [BsonId, BsonRepresentation(BsonType.String)]
    public Guid Id { get; set; }

    public string OwnerSub { get; set; } = default!;   // user sub z JWT
    public string Text { get; set; } = default!;
    public string Color { get; set; } = "yellow";      // yellow | green | blue | pink
    public BoardColumn Column { get; set; } = BoardColumn.Backlog;
    public int Order { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
