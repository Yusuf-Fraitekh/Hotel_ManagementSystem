using HotelManagement.Domain.Entities;

namespace HotelManagement.Application.Interfaces;

public interface IHotelInfoService
{
    Task<HotelInfo> GetAsync(CancellationToken cancellationToken = default);
    Task<HotelInfo> UpdateAsync(string name, string city, string country, string email, CancellationToken cancellationToken = default);
}
