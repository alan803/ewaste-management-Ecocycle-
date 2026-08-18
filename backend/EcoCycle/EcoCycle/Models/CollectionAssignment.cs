using EcoCycle.API.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class CollectionAssignment
    {
        [Key]
        public int? CollectionAssignmentId { get; set; }

        [Required]
        public int DeviceId { get; set; }

        [ForeignKey(nameof(DeviceId))]
        public Device Device { get; set; } = null!;

        public int? CollectionAgentId { get; set; }

        [ForeignKey(nameof(CollectionAgentId))]
        public CollectionAgent? CollectionAgent { get; set; }

        [Required]
        [StringLength(30)]
        public string Status { get; set; } = "Assigned";

        public DateTime? AssignedAt { get; set; }

        public DateTime? AcceptedAt { get; set; }

        public DateTime? PickupStartedAt { get; set; }

        public DateTime? PickedUpAt { get; set; }

        public DateTime? DeliveredAt { get; set; }

        [StringLength(500)]
        public string? RejectionReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }
    }
}