using MediatR;
using Auth0Mediator.Api.Features.BoardCards.Persistence;

namespace Auth0Mediator.Api.Features.BoardCards.MoveCard;

public class MoveCardHandler(IBoardCardsRepository repo) : IRequestHandler<MoveCardCommand>
{
    public async Task Handle(MoveCardCommand req, CancellationToken ct)
    {
        var entity = await repo.Get(req.Id, ct) ?? throw new KeyNotFoundException();
        if (entity.OwnerSub != req.OwnerSub) throw new UnauthorizedAccessException();

        entity.Column = req.TargetColumn;
        entity.Order  = await repo.NextOrder(req.OwnerSub, req.TargetColumn, ct);

        await repo.Update(entity, ct);
    }
}
