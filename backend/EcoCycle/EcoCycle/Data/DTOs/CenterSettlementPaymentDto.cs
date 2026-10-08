using System.ComponentModel.DataAnnotations;

namespace EcoCycle.API.Data.DTOs
{
    public class CenterSettlementPaymentDto
    {
        [Required]
        public int DeviceId { get; set; }

        [Required]
        [Range(0.01, 10000000, ErrorMessage = "Final realizable value must be greater than zero.")]
        public decimal FinalRealizableValue { get; set; }

        [StringLength(50)]
        public string PaymentMethod { get; set; } = "Razorpay";

        [StringLength(100)]
        public string? RazorpayPaymentId { get; set; }

        [StringLength(100)]
        public string? RazorpayOrderId { get; set; }

        [StringLength(255)]
        public string? RazorpaySignature { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }
}
