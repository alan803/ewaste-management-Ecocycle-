using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
namespace EcoCycle.API.Models
{
    [Index(nameof(DeviceQrToken), IsUnique = true)]
    public class Device
    {
        [Key]
        public int DeviceId { get; set; }

        // User
        [Required]
        public int UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }


        // Device Category
        [Required]
        public int CategoryId { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public DeviceCategory? Category { get; set; }

        // Linked Device Model
        public int? DeviceModelId { get; set; }

        [ForeignKey(nameof(DeviceModelId))]
        public DeviceModel? DeviceModel { get; set; }


        // Device Details
        [Required]
        [StringLength(100)]
        public string Brand { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Model { get; set; } = string.Empty;

        [StringLength(100)]
        public string? ModelNumber { get; set; }

        [StringLength(100)]
        public string? SerialNumber { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Required]
        public int Weight { get; set; }

        [Required]
        [StringLength(30)]
        public string Condition { get; set; } = string.Empty;

        [StringLength(30)]
        public string? Working { get; set; }

        [StringLength(500)]
        public string? PhysicalDamage { get; set; }

        [StringLength(50)]
        public string? DisplayCondition { get; set; }

        [StringLength(50)]
        public string? BatteryCondition { get; set; }

        [StringLength(30)]
        public string? Accessories { get; set; }

        [StringLength(30)]
        public string? Charger { get; set; }


        // Photos
        [StringLength(255)]
        public string? FrontPhoto { get; set; }

        [StringLength(255)]
        public string? BackPhoto { get; set; }

        [StringLength(255)]
        public string? DamagePhoto { get; set; }

        [StringLength(255)]
        public string? LabelPhoto { get; set; }


        // Processing
        [Required]
        [StringLength(30)]
        public string ProcessingPreference { get; set; } = string.Empty;


        // Pickup
        [Required]
        [StringLength(500)]
        public string Address { get; set; } = string.Empty;

        [StringLength(150)]
        public string? Landmark { get; set; }

        [Required]
        public DateTime PickupDate { get; set; }

        [Required]
        [StringLength(30)]
        public string TimeSlot { get; set; } = string.Empty;

        [StringLength(500)]
        public string? PickupInstructions { get; set; }


        // Ownership
        [Required]
        [StringLength(30)]
        public string Ownership { get; set; } = string.Empty;

        [Required]
        public bool OwnershipConfirmed { get; set; }

        [Required]
        public bool TermsAccepted { get; set; }


        // Device status(accept/reject or active or inactive)
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        [StringLength(30)]
        public string Status { get; set; } = "Pending";

        //device lifecycle status
        public string LifecycleStatus { get; set; } = "Pending";

        public bool AllocationRequested { get; set; } = false;
        // Inspection assignments

        [MaxLength(100)]
        public string? DeviceQrToken { get; set; }

        public string? ProcessingDecision { get; set; }

        public DateTime? ProcessingDecisionAt { get; set; }

        [StringLength(50)]
        public string? ProcessingLifecycleStatus { get; set; }
        public DateTime? PurchaseDate { get; set; }

        public ICollection<InspectionRequest> InspectionRequests { get; set; }
            = new List<InspectionRequest>();

        // Collection assignments
        public ICollection<CollectionAssignment> CollectionAssignments { get; set; }
            = new List<CollectionAssignment>();
    }
}