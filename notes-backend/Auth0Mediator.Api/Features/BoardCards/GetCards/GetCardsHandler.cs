using MediatR;
using Auth0Mediator.Api.Features.BoardCards.Persistence;

namespace Auth0Mediator.Api.Features.BoardCards.GetCards;

public class GetCardsHandler(IBoardCardsRepository repo)
    : IRequestHandler<GetCardsQuery, IReadOnlyList<BoardCardDto>>
{
    public async Task<IReadOnlyList<BoardCardDto>> Handle(GetCardsQuery request, CancellationToken ct)
    {
        var list = await repo.GetAll(request.OwnerSub, ct);
        return list.Select(ToDto).ToList();
    }

    private static BoardCardDto ToDto(BoardCardEntity e) =>
        new(e.Id, e.Text, e.Color, e.Column, e.Order, e.CreatedAt);
}
