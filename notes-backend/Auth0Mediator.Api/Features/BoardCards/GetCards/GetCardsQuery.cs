using MediatR;

namespace Auth0Mediator.Api.Features.BoardCards.GetCards;

public record GetCardsQuery(string OwnerSub) : IRequest<IReadOnlyList<BoardCardDto>>;
