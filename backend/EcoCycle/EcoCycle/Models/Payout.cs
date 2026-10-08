using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class Payout
    {
        [Key]
        public int PayoutId { get; set; }

        // Device for which this payout is made
        [Required]
        public int DeviceId { get; set; }

        [ForeignKey(nameof(DeviceId))]
        public Device Device { get; set; } = null!;


        // Person/entity receiving the money
        // User, CollectionAgent, Technician,
        // RecyclingCenter, RefurbishmentCenter
        [Required]
        [StringLength(50)]
        public string ReceiverType { get; set; } = string.Empty;

        // Login ID of the receiver
        [Required]
        public int ReceiverLoginId { get; set; }

        [ForeignKey(nameof(ReceiverLoginId))]
        public Login Receiver { get; set; } = null!;


        // Reason for the payout
        // UserValuation, CollectionFee,
        // InspectionFee, ProcessingFee
        [Required]
        [StringLength(50)]
        public string PayoutType { get; set; } = string.Empty;


        // Amount being paid
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }


        // Currency
        [Required]
        [StringLength(10)]
        public string Currency { get; set; } = "INR";


        // Pending, Processing, Paid, Failed, Cancelled
        [Required]
        [StringLength(30)]
        public string PayoutStatus { get; set; } = "Pending";


        // Groups all payouts created by one Pay action
        [Required]
        [StringLength(100)]
        public string PayoutBatchId { get; set; } = string.Empty;


        // Razorpay payout information
        [StringLength(100)]
        public string? RazorpayPayoutId { get; set; }

        [StringLength(100)]
        public string? RazorpayContactId { get; set; }

        [StringLength(100)]
        public string? RazorpayFundAccountId { get; set; }


        // Failure information
        [StringLength(500)]
        public string? FailureReason { get; set; }


        // Dates
        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? PaidAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}