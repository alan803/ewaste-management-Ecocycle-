using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
namespace EcoCycle.API.Models
{
    public class Inspection
    {
        [Key]
        public int InspectionId { get; set; }

        [Required]
        public int InspectionRequestId { get; set; }

        [ForeignKey(nameof(InspectionRequestId))]
        public InspectionRequest InspectionRequest { get; set; } = null!;

        [Required]
        public int DeviceId { get; set; }

        [ForeignKey(nameof(DeviceId))]
        public Device Device { get; set; } = null!;

        [Required]
        public int TechnicianId { get; set; }

        [ForeignKey(nameof(TechnicianId))]
        public Technician Technician { get; set; } = null!;

        [Required]
        [StringLength(30)]
        public string Status { get; set; } = "NotStarted";

        public DateTime? InspectionStartedAt { get; set; }

        public DateTime? InspectionDeadline { get; set; }

        public DateTime? InspectionCompletedAt { get; set; }

        public decimal? OverallScore { get; set; }

        [StringLength(100)]
        public string? OverallCondition { get; set; }

        [StringLength(100)]
        public string? RecommendedAction { get; set; }

        [StringLength(2000)]
        public string? TechnicianRemarks { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }

        public ICollection<InspectionResult>? Results { get; set; }
        public int ExtensionCount { get; set; } = 0;
    }
}
