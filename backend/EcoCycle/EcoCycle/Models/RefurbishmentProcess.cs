using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class RefurbishmentProcess
    {
        [Key]
        public int RefurbishmentProcessId { get; set; }

        [Required]
        public int RefurbishmentRequestId { get; set; }

        [ForeignKey(nameof(RefurbishmentRequestId))]
        public RefurbishmentRequest RefurbishmentRequest { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Completed"; // "Completed", "TransferredToRecycling", "InProgress"

        public DateTime StartedAt { get; set; } = DateTime.Now;
        public DateTime? CompletedAt { get; set; }

        // Step 1: Verification
        public bool DeviceVerified { get; set; } = true;
        [StringLength(100)]
        public string? VerifiedByTechnician { get; set; }
        public DateTime? VerifiedAt { get; set; }

        // Step 2: Assessment
        [StringLength(50)]
        public string? PhysicalCondition { get; set; }
        [StringLength(50)]
        public string? DisplayCondition { get; set; }
        [StringLength(50)]
        public string? BatteryAssessment { get; set; }
        [StringLength(50)]
        public string? KeyboardAssessment { get; set; }
        [StringLength(50)]
        public string? StorageAssessment { get; set; }
        [StringLength(50)]
        public string? RamAssessment { get; set; }
        [StringLength(50)]
        public string? PortsAssessment { get; set; }
        [StringLength(50)]
        public string? SoftwareAssessment { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal? EstimatedRepairCost { get; set; }
        [StringLength(50)]
        public string? AssessmentDecision { get; set; } // "Refurbishable", "NotEconomical"

        // Step 3: Data Destruction
        public bool DataWiped { get; set; } = false;
        [StringLength(100)]
        public string? WipingMethod { get; set; }
        public DateTime? WipingCompletedAt { get; set; }
        [StringLength(100)]
        public string? WipingTechnician { get; set; }
        [StringLength(50)]
        public string? WipingVerificationStatus { get; set; }
        [StringLength(100)]
        public string? CertificateNumber { get; set; }

        // Step 4: Repair & Replacement Items
        public string? RepairItemsJson { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal? TotalRepairCost { get; set; }

        // Step 5: Functional Testing
        public string? FunctionalTestsJson { get; set; }
        public bool TestingPassed { get; set; } = true;

        // Step 6: Quality Check
        public bool QcRepairCompleted { get; set; } = true;
        public bool QcDataWiped { get; set; } = true;
        public bool QcHardwareTested { get; set; } = true;
        public bool QcSoftwareTested { get; set; } = true;
        public bool QcApproved { get; set; } = true;
        [StringLength(50)]
        public string? QualityGrade { get; set; } = "Grade A (Pristine)";
        [StringLength(100)]
        public string? QcInspector { get; set; }

        // Step 7: Final Decision
        [StringLength(50)]
        public string? FinalOutcome { get; set; } // "Refurbished", "TransferredToRecycling"
        [Column(TypeName = "decimal(18,2)")]
        public decimal? RefurbishedValue { get; set; }
        [StringLength(50)]
        public string? WarrantyDuration { get; set; }
        [StringLength(100)]
        public string? RefurbishedCertificateNumber { get; set; }
        [StringLength(1000)]
        public string? Remarks { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? UpdatedAt { get; set; }
    }
}
