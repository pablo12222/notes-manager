using Auth0Mediator.Api.Features.BoardCards.Persistence;

namespace Auth0Mediator.Api.Features.BoardCards.GetCards;

public record BoardCardDto(
    Guid Id, string Text, string Color, BoardColumn Column, int Order, DateTime CreatedAt);
