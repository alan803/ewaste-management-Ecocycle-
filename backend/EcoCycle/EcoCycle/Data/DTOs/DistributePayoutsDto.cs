using System.ComponentModel.DataAnnotations;

namespace EcoCycle.API.Data.DTOs
{
    public class DistributePayoutsDto
    {
        [Required]
        public int DeviceId { get; set; }

        [Required]
        [Range(0, 10000000, ErrorMessage = "Citizen payout must be zero or positive.")]
        public decimal CitizenAmount { get; set; }

        [Range(0, 10000000)]
        public decimal Agent1Amount { get; set; } = 150m;

        [Range(0, 10000000)]
        public decimal TechnicianAmount { get; set; } = 300m;

        [Range(0, 10000000)]
        public decimal Agent2Amount { get; set; } = 150m;

        [Range(0, 10000000)]
        public decimal CenterAmount { get; set; } = 0m;

        [Range(0, 10000000)]
        public decimal EcoCycleShare { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }
}
