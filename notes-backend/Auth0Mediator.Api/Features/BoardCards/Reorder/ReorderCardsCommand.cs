using MediatR;
using Auth0Mediator.Api.Features.BoardCards.Persistence;

namespace Auth0Mediator.Api.Features.BoardCards.Reorder;

public record ReorderCardsCommand(string OwnerSub, BoardColumn Column, IList<Guid> OrderedIds) : IRequest;
