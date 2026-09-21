using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class InspectionPhoto
    {
        [Key]
        public int InspectionPhotoId { get; set; }

        [Required]
        public int InspectionResultId { get; set; }

        [ForeignKey(nameof(InspectionResultId))]
        public InspectionResult? InspectionResult { get; set; }

        [Required]
        [MaxLength(500)]
        public string PhotoPath { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? PhotoType { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.Now;
    }
}