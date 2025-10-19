using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Auth0Mediator.Api.Features.BoardCards.AddCard;
using Auth0Mediator.Api.Features.BoardCards.DeleteCard;
using Auth0Mediator.Api.Features.BoardCards.GetCards;
using Auth0Mediator.Api.Features.BoardCards.MoveCard;
using Auth0Mediator.Api.Features.BoardCards.Reorder;
using Auth0Mediator.Api.Features.BoardCards.UpdateCard;
using Auth0Mediator.Api.Features.BoardCards.Persistence;

namespace Auth0Mediator.Api.Features.BoardCards;

[ApiController]
[Route("api/board/cards")]
public class BoardCardsController(IMediator mediator) : ControllerBase
{
    private string RequireSub()
    {
        var sub = User.FindFirst("sub")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(sub))
            throw new UnauthorizedAccessException("Missing user sub.");
        var gty = User.FindFirst("gty")?.Value;
        if ((gty?.Equals("client-credentials", StringComparison.OrdinalIgnoreCase) ?? false) ||
            sub.EndsWith("@clients", StringComparison.OrdinalIgnoreCase))
            throw new UnauthorizedAccessException("M2M tokens are not allowed.");
        return sub;
    }

    [HttpGet]
    [Authorize(Policy = "cards:read")]
    public async Task<ActionResult<IEnumerable<BoardCardDto>>> Get(CancellationToken ct)
    {
        var sub = RequireSub();
        var list = await mediator.Send(new GetCardsQuery(sub), ct);
        return Ok(list);
    }

    [HttpPost]
    [Authorize(Policy = "cards:create")]
    public async Task<ActionResult<BoardCardDto>> Add([FromBody] AddCardDto dto, CancellationToken ct)
    {
        var sub = RequireSub();
        var created = await mediator.Send(new AddCardCommand(sub, dto.Text, dto.Color, dto.Column), ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Policy = "cards:update")]
    public async Task<ActionResult<BoardCardDto>> Update(Guid id, [FromBody] UpdateCardDto dto, CancellationToken ct)
    {
        var sub = RequireSub();
        var updated = await mediator.Send(new UpdateCardCommand(id, sub, dto.Text, dto.Color), ct);
        return Ok(updated);
    }

    [HttpPost("{id:guid}/move")]
    [Authorize(Policy = "cards:update")]
    public async Task<IActionResult> Move(Guid id, [FromBody] MoveCardDto body, CancellationToken ct)
    {
        var sub = RequireSub();
        await mediator.Send(new MoveCardCommand(id, sub, body.TargetColumn), ct);
        return NoContent();
    }

    [HttpPost("reorder")]
    [Authorize(Policy = "cards:update")]
    public async Task<IActionResult> Reorder([FromBody] ReorderDto dto, CancellationToken ct)
    {
        var sub = RequireSub();
        await mediator.Send(new ReorderCardsCommand(sub, dto.Column, dto.OrderedIds), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "cards:delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var sub = RequireSub();
        await mediator.Send(new DeleteCardCommand(id, sub), ct);
        return NoContent();
    }
}

// DTOs używane w kontrolerze
public record MoveCardDto(BoardColumn TargetColumn);
public record ReorderDto(BoardColumn Column, IList<Guid> OrderedIds);
public record UpdateCardDto(string Text, string Color);
