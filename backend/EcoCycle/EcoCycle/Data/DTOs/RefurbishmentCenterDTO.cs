using Microsoft.AspNetCore.Http;

namespace EcoCycle.API.DTOs
{
    public class RefurbishmentCenterDTO
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;

        public string CenterName { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;

        public string BusinessRegistrationNumber { get; set; } = string.Empty;
        public string? GstNumber { get; set; }
        public int ExperienceYears { get; set; }
        public string? LicenseNumber { get; set; }

        public string BuildingNumber { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Pincode { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;

        public List<string> DeviceTypes { get; set; } = new();
        public List<string> Services { get; set; } = new();

        public int TechnicianCount { get; set; }
        public string PickupAvailable { get; set; } = string.Empty;

        public IFormFile? BusinessRegistrationCertificate { get; set; }
        public IFormFile? TradeLicense { get; set; }
        public IFormFile? AddressProof { get; set; }
        public IFormFile? CenterPhoto { get; set; }
        public IFormFile? AuthorizedPersonId { get; set; }
    }
}