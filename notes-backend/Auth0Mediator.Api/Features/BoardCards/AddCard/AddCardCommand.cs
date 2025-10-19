using MediatR;
using Auth0Mediator.Api.Features.BoardCards.GetCards;
using Auth0Mediator.Api.Features.BoardCards.Persistence;

namespace Auth0Mediator.Api.Features.BoardCards.AddCard;

public record AddCardCommand(string OwnerSub, string Text, string Color, BoardColumn Column)
    : IRequest<BoardCardDto>;
