using System.ComponentModel.DataAnnotations;

namespace Auth0Mediator.Api.Features.BoardCards.UpdateCard;

public record UpdateCardDto(
    [Required, MaxLength(1000)] string Text,
    [Required, RegularExpression("^#([0-9A-Fa-f]{6})$")] string Color
);