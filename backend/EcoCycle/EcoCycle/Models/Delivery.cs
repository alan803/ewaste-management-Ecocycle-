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

        // Technician verification
        public bool DeviceVerified { get; set; } = false;

        // When technician rejects the handover
        public DateTime? HandoverRejectedAt { get; set; }

        // Why technician rejected the device
        [MaxLength(500)]
        public string? HandoverRejectionReason { get; set; }

        // Technician's additional comments
        [MaxLength(1000)]
        public string? TechnicianNotes { get; set; }

        [MaxLength(500)]
        public string? ProofPhotoPath { get; set; }

        [MaxLength(1000)]
        public string? AgentNotes { get; set; }

        [MaxLength(500)]
        public string? FailureReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}