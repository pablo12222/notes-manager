using MediatR;
using Auth0Mediator.Api.Features.BoardCards.GetCards;

namespace Auth0Mediator.Api.Features.BoardCards.UpdateCard;

public record UpdateCardCommand(Guid Id, string OwnerSub, string Text, string Color)
    : IRequest<BoardCardDto>;
