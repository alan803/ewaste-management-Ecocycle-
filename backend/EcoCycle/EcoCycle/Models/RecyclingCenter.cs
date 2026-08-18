using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class RecyclingCenter
    {
        [Key]
        public int RecyclingCenterId { get; set; }

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

        [Required]
        public string RecyclerRegistrationNumber { get; set; } = string.Empty;

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
        public string RecyclingProcesses { get; set; } = string.Empty;

        [Required]
        public string PickupAvailable { get; set; } = string.Empty;

        [Required]
        public string HazardousWasteHandling { get; set; } = string.Empty;

        [Required]
        public string RecoveredMaterials { get; set; } = string.Empty;

        public string? HazardousWasteTypes { get; set; }


        public string? BusinessRegistrationCertificate { get; set; }

        public string? RecyclerRegistrationCertificate { get; set; }

        public string? ConsentToOperate { get; set; }

        public string? HazardousWasteAuthorization { get; set; }

        public string? AddressProof { get; set; }

        public string? CenterPhoto { get; set; }

        public string? AuthorizedPersonId { get; set; }

        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}