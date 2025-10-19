using MediatR;
using Auth0Mediator.Api.Features.BoardCards.Persistence;

namespace Auth0Mediator.Api.Features.BoardCards.DeleteCard;

public class DeleteCardHandler(IBoardCardsRepository repo) : IRequestHandler<DeleteCardCommand>
{
    public async Task Handle(DeleteCardCommand req, CancellationToken ct)
    {
        var entity = await repo.Get(req.Id, ct) ?? throw new KeyNotFoundException();
        if (entity.OwnerSub != req.OwnerSub) throw new UnauthorizedAccessException();

        await repo.Delete(req.Id, ct);
    }
}
