using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class RefurbishmentCenter
    {
        [Key]
        public int RefurbishmentCenterId { get; set; }

        [Required]
        public int LoginId { get; set; }

        [ForeignKey(nameof(LoginId))]
        public Login Login { get; set; } = null!;

        [Required]
        public string CenterName { get; set; } = string.Empty;

        [Required]
        public string OwnerName { get; set; } = string.Empty;

        [Required]
        public string PhoneNumber { get; set; } = string.Empty;


        [Required]
        public string BusinessRegistrationNumber { get; set; } = string.Empty;

        public string? GstNumber { get; set; }

        [Required]
        public int ExperienceYears { get; set; }

        public string? LicenseNumber { get; set; }


        [Required]
        public string BuildingNumber { get; set; } = string.Empty;

        [Required]
        public string Street { get; set; } = string.Empty;

        [Required]
        public string District { get; set; } = string.Empty;

        [Required]
        public string State { get; set; } = string.Empty;

        [Required]
        public string Pincode { get; set; } = string.Empty;

        [Required]
        public string City { get; set; } = string.Empty;


        [Required]
        public string DeviceTypes { get; set; } = string.Empty;

        [Required]
        public string Services { get; set; } = string.Empty;


        [Required]
        public int TechnicianCount { get; set; }

        [Required]
        public string PickupAvailable { get; set; } = string.Empty;

        [Required]
        public string BusinessRegistrationCertificate { get; set; } = string.Empty;

        [Required]
        public string TradeLicense { get; set; } = string.Empty;

        [Required]
        public string AddressProof { get; set; } = string.Empty;

        [Required]
        public string CenterPhoto { get; set; } = string.Empty;

        [Required]
        public string AuthorizedPersonId { get; set; } = string.Empty;


        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}