using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class InspectionCriteria
    {
        [Key]
        public int InspectionCriteriaId { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public DeviceCategory? Category { get; set; }

        [Required]
        [MaxLength(100)]
        public string CriteriaName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public decimal Weight { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation property
        public ICollection<InspectionResult>? InspectionResults { get; set; }
    }
}