using Microsoft.AspNetCore.Http;
namespace EcoCycle.Data.DTOs
{
    public class RecyclingCenterRegisterRequest
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
        public string RecyclerRegistrationNumber { get; set; } = string.Empty;
        public string BuildingNumber { get; set; } = string.Empty;
        public string Street { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Pincode { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string DeviceTypes { get; set; } = string.Empty;
        public string RecyclingProcesses { get; set; } = string.Empty;
        public string PickupAvailable { get; set; } = string.Empty;
        public string HazardousWasteHandling { get; set; } = string.Empty;
        public string RecoveredMaterials { get; set; } = string.Empty;
        public string? HazardousWasteTypes { get; set; }
        public IFormFile? BusinessRegistrationCertificate { get; set; }
        public IFormFile? RecyclerRegistrationCertificate { get; set; }
        public IFormFile? ConsentToOperate { get; set; }
        public IFormFile? HazardousWasteAuthorization { get; set; }
        public IFormFile? AddressProof { get; set; }
        public IFormFile? CenterPhoto { get; set; }
        public IFormFile? AuthorizedPersonId { get; set; }
    }
}
