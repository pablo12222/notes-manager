using MediatR;
using Auth0Mediator.Api.Features.BoardCards.GetCards;
using Auth0Mediator.Api.Features.BoardCards.Persistence;

namespace Auth0Mediator.Api.Features.BoardCards.AddCard;

public class AddCardHandler(IBoardCardsRepository repo)
    : IRequestHandler<AddCardCommand, BoardCardDto>
{
    public async Task<BoardCardDto> Handle(AddCardCommand req, CancellationToken ct)
    {
        var entity = new BoardCardEntity
        {
            Id = Guid.NewGuid(),
            OwnerSub = req.OwnerSub,
            Text = req.Text,
            Color = req.Color,
            Column = req.Column,
            Order = await repo.NextOrder(req.OwnerSub, req.Column, ct),
            CreatedAt = DateTime.UtcNow
        };

        await repo.Add(entity, ct);
        return new BoardCardDto(entity.Id, entity.Text, entity.Color, entity.Column, entity.Order, entity.CreatedAt);
    }
}
