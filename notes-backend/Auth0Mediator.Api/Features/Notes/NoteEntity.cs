using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Auth0Mediator.Api.Features.Notes;

public class NoteEntity
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = default!;

    public string UserSub { get; set; } = default!;

    public string Title { get; set; } = default!;
    public string Content { get; set; } = default!;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public string Status { get; set; } = "todo";
}
