using MongoDB.Bson.Serialization.Attributes;

namespace Auth0Mediator.Api.Features.Users;

public class UserEntity
{
    // używamy Auth0 sub jako klucza (Mongo _id)
    [BsonId] 
    public string Id { get; set; } = default!;   // np. "auth0|abc123"

    public string? Email { get; set; }
    public string? Name  { get; set; }

    public DateTime CreatedAt  { get; set; }
    public DateTime? LastSeenAt { get; set; }
}
