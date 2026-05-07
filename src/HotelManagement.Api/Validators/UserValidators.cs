using FluentValidation;
using HotelManagement.Api.DTOs.Users;

namespace HotelManagement.Api.Validators;

public class UpdateUserProfileValidator : AbstractValidator<UpdateUserProfileRequestDto>
{
    public UpdateUserProfileValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MinimumLength(3);
    }
}
