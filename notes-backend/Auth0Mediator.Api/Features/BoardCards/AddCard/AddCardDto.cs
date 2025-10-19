
using System.ComponentModel.DataAnnotations;
using Auth0Mediator.Api.Features.BoardCards.Persistence;

namespace Auth0Mediator.Api.Features.BoardCards.AddCard;

public record AddCardDto(
    [Required, MaxLength(1000)] string Text,
   
    [Required, RegularExpression("^#([0-9A-Fa-f]{6})$")] string Color,
    
    BoardColumn Column
);
