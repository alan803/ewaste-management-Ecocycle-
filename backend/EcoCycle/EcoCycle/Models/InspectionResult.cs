using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class InspectionResult
    {
        [Key]
        public int InspectionResultId { get; set; }

        [Required]
        public int InspectionId { get; set; }

        [ForeignKey(nameof(InspectionId))]
        public Inspection? Inspection { get; set; }

        [Required]
        [MaxLength(100)]
        public string CriteriaName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Result { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Remarks { get; set; }

        public decimal? Score { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public ICollection<InspectionPhoto>? Photos { get; set; }
    }
}