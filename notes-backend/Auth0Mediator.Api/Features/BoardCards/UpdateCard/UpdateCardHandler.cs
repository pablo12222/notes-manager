using MediatR;
using Auth0Mediator.Api.Features.BoardCards.GetCards;
using Auth0Mediator.Api.Features.BoardCards.Persistence;

namespace Auth0Mediator.Api.Features.BoardCards.UpdateCard;

public class UpdateCardHandler(IBoardCardsRepository repo)
    : IRequestHandler<UpdateCardCommand, BoardCardDto>
{
    public async Task<BoardCardDto> Handle(UpdateCardCommand req, CancellationToken ct)
    {
        var entity = await repo.Get(req.Id, ct) ?? throw new KeyNotFoundException();
        if (entity.OwnerSub != req.OwnerSub) throw new UnauthorizedAccessException();

        entity.Text = req.Text;
        entity.Color = req.Color;

        await repo.Update(entity, ct);

        return new BoardCardDto(entity.Id, entity.Text, entity.Color, entity.Column, entity.Order, entity.CreatedAt);
    }
}
