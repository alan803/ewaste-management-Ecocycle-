using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
   public class EcoCycleTransaction
    {
        [Key]
        public int TransactionId { get; set; }

        public int? DeviceId { get; set; }

        [Required]
        [StringLength(50)]
        public string TransactionType { get; set; } = string.Empty;
        // DeviceSale, UserPayment, AgentFee,
        // TechnicianFee, CenterFee, etc.

        [Required]
        [StringLength(20)]
        public string Direction { get; set; } = string.Empty;
        // Credit / Debit

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [StringLength(30)]
        public string Status { get; set; } = "Completed";

        [StringLength(500)]
        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}