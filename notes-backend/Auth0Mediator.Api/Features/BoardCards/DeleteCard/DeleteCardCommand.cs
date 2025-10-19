using MediatR;

namespace Auth0Mediator.Api.Features.BoardCards.DeleteCard;

public record DeleteCardCommand(Guid Id, string OwnerSub) : IRequest;
