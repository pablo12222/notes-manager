using MediatR;
using Auth0Mediator.Api.Features.BoardCards.Persistence;

namespace Auth0Mediator.Api.Features.BoardCards.MoveCard;

public record MoveCardCommand(Guid Id, string OwnerSub, BoardColumn TargetColumn) : IRequest;
