using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class RecyclingCenterRequest
    {
        [Key]
        public int RecyclingCenterRequestId { get; set; }
        [Required]
        public int DeviceId { get; set; }

        [ForeignKey(nameof(DeviceId))]
        public Device Device { get; set; } = null!;

        public int? RecyclingCenterId { get; set; }

        [ForeignKey(nameof(RecyclingCenterId))]
        public RecyclingCenter? RecyclingCenter { get; set; }

        [Required]
        [StringLength(30)]
        public string Status { get; set; } = "Waiting";

        public DateTime? AssignedAt { get; set; }
        public DateTime? ResponseDeadline { get; set; }

        public DateTime? RespondedAt { get; set; }

        public DateTime? ProcessStartDate { get; set; }

        public DateTime? ProcessDeadline { get; set; }

        [StringLength(500)]
        public string? RejectionReason { get; set; }

        public int ReassignmentCount { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }
    }
}