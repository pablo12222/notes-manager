using MediatR;
using Auth0Mediator.Api.Features.BoardCards.Persistence;

namespace Auth0Mediator.Api.Features.BoardCards.Reorder;

public class ReorderCardsHandler(IBoardCardsRepository repo)
    : IRequestHandler<ReorderCardsCommand>
{
    public async Task Handle(ReorderCardsCommand req, CancellationToken ct)
    {
        // Pobierz wszystkie karty użytkownika w kolumnie
        var cards = (await repo.GetAll(req.OwnerSub, ct))
            .Where(x => x.Column == req.Column)
            .ToDictionary(x => x.Id, x => x);

        for (int i = 0; i < req.OrderedIds.Count; i++)
        {
            if (cards.TryGetValue(req.OrderedIds[i], out var card))
            {
                card.Order = i;
                await repo.Update(card, ct);
            }
        }
    }
}
