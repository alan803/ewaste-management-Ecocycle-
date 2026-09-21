using EcoCycle.API.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class TechnicianPenalty
    {
        [Key]
        public int TechnicianPenaltyId { get; set; }

        [Required]
        public int TechnicianId { get; set; }

        [ForeignKey(nameof(TechnicianId))]
        public Technician Technician { get; set; } = null!;

        [Required]
        public int DeviceId { get; set; }

        [ForeignKey(nameof(DeviceId))]
        public Device Device { get; set; } = null!;

        public int? InspectionRequestId { get; set; }

        [ForeignKey(nameof(InspectionRequestId))]
        public InspectionRequest? InspectionRequest { get; set; }

        [Required]
        public decimal PenaltyAmount { get; set; }

        [Required]
        [StringLength(500)]
        public string Reason { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? ResolvedAt { get; set; }
    }
}
