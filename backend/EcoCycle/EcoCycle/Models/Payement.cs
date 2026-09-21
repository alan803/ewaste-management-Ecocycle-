using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class Payment
    {
        [Key]
        public int PaymentId { get; set; }

        // Purpose of the payment
        // Examples:
        // TechnicianPenalty, InspectionFee, CollectionFee,
        // RecyclingFee, RefurbishmentFee, UserValuation
        [Required]
        [StringLength(50)]
        public string PaymentType { get; set; } = string.Empty;

        // ID of the related business record
        // Example:
        // TechnicianPenaltyId, InspectionId,
        // CollectionAssignmentId, DeviceId, etc.
        public int? ReferenceId { get; set; }

        // Person/entity making the payment
        // Examples: Technician, User, EcoCycle
        [Required]
        [StringLength(50)]
        public string PayerType { get; set; } = string.Empty;

        // Login ID of the payer if the payer is a registered
        // EcoCycle account
        public int? PayerLoginId { get; set; }

        [ForeignKey(nameof(PayerLoginId))]
        public Login? Payer { get; set; }

        // Person/entity receiving the payment
        // Examples: Technician, CollectionAgent,
        // RecyclingCenter, RefurbishmentCenter, User, EcoCycle
        [Required]
        [StringLength(50)]
        public string ReceiverType { get; set; } = string.Empty;

        // Login ID of the receiver if the receiver is a registered
        // EcoCycle account
        public int? ReceiverLoginId { get; set; }

        [ForeignKey(nameof(ReceiverLoginId))]
        public Login? Receiver { get; set; }

        // Payment amount
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        // Currency
        [Required]
        [StringLength(10)]
        public string Currency { get; set; } = "INR";

        // Direction of the transaction
        // Incoming = money comes into EcoCycle
        // Outgoing = money goes from EcoCycle
        [Required]
        [StringLength(20)]
        public string TransactionType { get; set; } = string.Empty;

        // Pending, Processing, Paid, Failed, Cancelled, Refunded
        [Required]
        [StringLength(30)]
        public string PaymentStatus { get; set; } = "Pending";

        // Razorpay order ID
        [StringLength(100)]
        public string? RazorpayOrderId { get; set; }

        // Razorpay payment ID
        [StringLength(100)]
        public string? RazorpayPaymentId { get; set; }

        // Razorpay signature used for payment verification
        [StringLength(255)]
        public string? RazorpaySignature { get; set; }

        // Payment record creation time
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Successful payment time
        public DateTime? PaidAt { get; set; }

        // Failed payment time
        public DateTime? FailedAt { get; set; }

        // Reason for failure
        [StringLength(500)]
        public string? FailureReason { get; set; }

        // Last update time
        public DateTime? UpdatedAt { get; set; }
    }
}