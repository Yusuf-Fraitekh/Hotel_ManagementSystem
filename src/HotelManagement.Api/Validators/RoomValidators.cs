using FluentValidation;
using HotelManagement.Api.DTOs.Rooms;

namespace HotelManagement.Api.Validators;

public class RoomListQueryValidator : AbstractValidator<RoomListQueryDto>
{
    public RoomListQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
        RuleFor(x => x.CheckOut)
            .GreaterThan(x => x.CheckIn!.Value)
            .When(x => x.CheckIn.HasValue && x.CheckOut.HasValue);
    }
}

public class RoomWriteValidator : AbstractValidator<RoomWriteDto>
{
    public RoomWriteValidator()
    {
        RuleFor(x => x.Name).NotEmpty();
        RuleFor(x => x.Type).NotEmpty();
        RuleFor(x => x.BedType).NotEmpty();
        RuleFor(x => x.ViewType).NotEmpty();
        RuleFor(x => x.MaxGuests).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PricePerNight).GreaterThan(0);
    }
}
