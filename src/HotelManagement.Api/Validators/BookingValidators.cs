using FluentValidation;
using HotelManagement.Api.DTOs.Bookings;

namespace HotelManagement.Api.Validators;

public class CreateBookingValidator : AbstractValidator<CreateBookingRequestDto>
{
    public CreateBookingValidator()
    {
        RuleFor(x => x.RoomId).GreaterThan(0);
        RuleFor(x => x.CheckInDate).GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow));
        RuleFor(x => x.CheckOutDate).GreaterThan(x => x.CheckInDate);
        RuleFor(x => x.GuestsCount).GreaterThan(0);
        RuleFor(x => x.StayType).NotEmpty();
    }
}

public class ExtendBookingValidator : AbstractValidator<ExtendBookingRequestDto>
{
    public ExtendBookingValidator()
    {
        RuleFor(x => x.NewCheckOutDate).GreaterThan(DateOnly.FromDateTime(DateTime.UtcNow));
    }
}

public class BookingListQueryValidator : AbstractValidator<BookingListQueryDto>
{
    public BookingListQueryValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}
