using Microsoft.AspNetCore.Http;

namespace EcoCycle.API.Data.DTOs
{
    public class TechnicianUpdateProfileRequest
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }

        public string? Address { get; set; }
        public string? State { get; set; }
        public string? District { get; set; }
        public string? City { get; set; }
        public string? PinCode { get; set; }

        public string? Specialization { get; set; }
        public int? ExperienceYears { get; set; }

        public IFormFile? ProfilePhoto { get; set; }
    }
}
