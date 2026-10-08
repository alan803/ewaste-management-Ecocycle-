using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class MaterialPrice
    {
        [Key]
        public int MaterialPriceId { get; set; }

        [Required]
        public int ComponentTypeId { get; set; }

        [ForeignKey(nameof(ComponentTypeId))]
        public ComponentType? ComponentType { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal PricePerKg { get; set; }

        [Required]
        public DateTime EffectiveFrom { get; set; } = DateTime.Now;

        public DateTime? EffectiveTo { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }
    }
}