using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class RecyclingProcess
    {
        [Key]
        public int RecyclingProcessId { get; set; }

        [Required]
        public int RecyclingCenterRequestId { get; set; }

        [ForeignKey(nameof(RecyclingCenterRequestId))]
        public RecyclingCenterRequest RecyclingCenterRequest { get; set; } = null!;

        [Required]
        [StringLength(30)]
        public string Status { get; set; } = "Processing";

        [Required]
        public DateTime StartedAt { get; set; }

        public DateTime? CompletionDeadline { get; set; }

        public DateTime? CompletedAt { get; set; }

        public decimal? TotalRecoveredWeight { get; set; }

        public decimal? TotalMaterialValue { get; set; }

        public decimal? ProcessingCost { get; set; }

        public decimal? NetRecoveryValue { get; set; }

        public decimal? HazardousWasteWeight { get; set; }

        [StringLength(1000)]
        public string? HazardousWasteDetails { get; set; }

        [StringLength(500)]
        public string? DisposalMethod { get; set; }

        [StringLength(1000)]
        public string? Notes { get; set; }

        [StringLength(500)]
        public string? VisibleDamage { get; set; }

        [StringLength(500)]
        public string? MissingParts { get; set; }

        [StringLength(50)]
        public string? DataFound { get; set; }

        [StringLength(100)]
        public string? SanitizationPerformed { get; set; }

        [StringLength(100)]
        public string? SanitizationMethod { get; set; }

        [StringLength(100)]
        public string? BatteryCondition { get; set; }

        [StringLength(200)]
        public string? HazardousStorageArea { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? ResidualWasteWeight { get; set; }

        [StringLength(200)]
        public string? PackagingContainer { get; set; }

        [StringLength(200)]
        public string? DispatchDestination { get; set; }

        public string? RemovedComponentsJson { get; set; }

        public string? HazardousComponentsJson { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }
    }
}
