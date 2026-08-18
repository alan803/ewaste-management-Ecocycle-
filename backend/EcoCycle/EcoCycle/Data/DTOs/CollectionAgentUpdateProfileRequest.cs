using Microsoft.AspNetCore.Http;

namespace EcoCycle.API.DTOs
{
    public class CollectionAgentUpdateProfileRequest
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Phone { get; set; }
        public string? AlternatePhone { get; set; }
        public DateTime? DOB { get; set; }
        public string? Gender { get; set; }

        public string? Address { get; set; }
        public string? State { get; set; }
        public string? District { get; set; }
        public string? City { get; set; }
        public string? Pincode { get; set; }

        public string? AccountHolder { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IFSCCode { get; set; }

        // Vehicle Details
        public string? VehicleType { get; set; }
        public string? VehicleNumber { get; set; }
        public string? LicenseNumber { get; set; }
        public IFormFile? VehicleInsurance { get; set; }
        public IFormFile? VehiclePollution { get; set; }
        public IFormFile? VehiclePhoto { get; set; }

        public IFormFile? ProfilePicture { get; set; }
    }
}
