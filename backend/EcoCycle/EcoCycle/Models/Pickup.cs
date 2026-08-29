using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class Pickup
    {
        [Key]
        public int PickupId { get; set; }

        [Required]
        public int CollectionAssignmentId { get; set; }

        [ForeignKey("CollectionAssignmentId")]
        public CollectionAssignment? CollectionAssignment { get; set; }

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } = "Scheduled";
        
        public DateTime? StartedAt { get; set; }

        public DateTime? PickedUpAt { get; set; }

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