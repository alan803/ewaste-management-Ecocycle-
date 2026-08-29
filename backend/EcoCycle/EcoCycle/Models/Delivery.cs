using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class Delivery
    {
        [Key]
        public int DeliveryId { get; set; }

        [Required]
        public int CollectionAssignmentId { get; set; }

        [ForeignKey(nameof(CollectionAssignmentId))]
        public CollectionAssignment? CollectionAssignment { get; set; }

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Pending";

        public DateTime? StartedAt { get; set; }

        public DateTime? DeliveredAt { get; set; }

        public bool DeviceVerified { get; set; } = false;

        [MaxLength(500)]
        public string? ProofPhotoPath { get; set; }

        [MaxLength(1000)]
        public string? AgentNotes { get; set; }

        [MaxLength(500)]
        public string? FailureReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
