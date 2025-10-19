using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Auth0Mediator.Api.Features.Notes;

[ApiController]
[Route("api/[controller]")]
public class NotesController : ControllerBase
{
    private readonly IMediator _mediator;
    public NotesController(IMediator mediator) => _mediator = mediator;

    // GET /api/notes
    [HttpGet]
    [Authorize("read:notes")]
    [ProducesResponseType(typeof(IEnumerable<NoteEntity>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Get()
    {
        var sub = User.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(sub)) return Unauthorized();

        var notes = await _mediator.Send(new GetNotesQuery(sub));
        return Ok(notes);
    }

    // POST /api/notes
    [HttpPost]
    [Authorize("create:notes")]
    [ProducesResponseType(typeof(NoteEntity), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] AddNoteDto dto)
    {
        var sub = User.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(sub)) return Unauthorized();

        var note = await _mediator.Send(new AddNoteCommand(sub, dto.Title, dto.Content));
        return CreatedAtAction(nameof(GetById), new { id = note.Id }, note);
    }

    // GET /api/notes/{id}
    [HttpGet("{id}")]
    [Authorize("read:notes")]
    [ProducesResponseType(typeof(NoteEntity), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(string id)
    {
        var sub = User.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(sub)) return Unauthorized();

        var note = await _mediator.Send(new GetNoteByIdQuery(id, sub));
        return note is null ? NotFound() : Ok(note);
    }

    // PUT /api/notes/{id}
    [HttpPut("{id}")]
    [Authorize("create:notes")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateNoteDto dto)
    {
        var sub = User.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(sub)) return Unauthorized();

        var ok = await _mediator.Send(new UpdateNoteCommand(id, sub, dto.Title, dto.Content, dto.Status));
        return ok ? NoContent() : NotFound();
    }

    // DELETE /api/notes/{id}
    [HttpDelete("{id}")]
    [Authorize("create:notes")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        var sub = User.FindFirst("sub")?.Value;
        if (string.IsNullOrWhiteSpace(sub)) return Unauthorized();

        var ok = await _mediator.Send(new DeleteNoteCommand(id, sub));
        return ok ? NoContent() : NotFound();
    }
}
