using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class InspectionRequest
    {
        [Key]
        public int InspectionRequestId { get; set; }
        [Required]
        public int DeviceId { get; set; }
        [ForeignKey(nameof(DeviceId))]
        public Device Device { get; set; } = null!;
        public int? TechnicianId { get; set; }
        [ForeignKey(nameof(TechnicianId))]
        public Technician? Technician { get; set; }
        [Required]
        [StringLength(30)]
        public string Status { get; set; } = "Waiting";
        public DateTime? AssignedAt { get; set; }
        public DateTime? ResponseDeadline { get; set; }
        public DateTime? RespondedAt { get; set; }
        [StringLength(500)]
        public string? RejectionReason { get; set; }
        public int ReassignmentCount { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
    }
}