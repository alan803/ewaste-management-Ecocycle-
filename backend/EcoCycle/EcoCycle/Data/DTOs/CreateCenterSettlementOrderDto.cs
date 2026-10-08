using System.ComponentModel.DataAnnotations;

namespace EcoCycle.API.Data.DTOs
{
    public class CreateCenterSettlementOrderDto
    {
        [Required]
        public int DeviceId { get; set; }

        [Required]
        [Range(0.01, 10000000, ErrorMessage = "Amount must be greater than zero.")]
        public decimal Amount { get; set; }

        public string? Notes { get; set; }
    }
}
