using System.ComponentModel.DataAnnotations;

namespace EcoCycle.API.Models
{
    public class AllocationRejection
    {
        [Key]
        public int RejectionId { get; set; }
        [Required]
        [MaxLength(50)]
        public string AllocationType { get; set; }
        [Required]
        public int AllocationId { get; set; }
        [Required]
        public int LoginId { get; set; }

        [Required]
        [MaxLength(500)]
        public string Reason { get; set; }

        public DateTime RejectedAt { get; set; } = DateTime.Now;
    }
}