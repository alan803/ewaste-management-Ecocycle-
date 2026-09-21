using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace EcoCycle.API.Models
{
    public class RecoveredMaterials
    {
        [Key]
        public int RecoveredMaterialId {  get; set; }
        [Required]
        public int RecyclingProccessId {  get; set; }
        [ForeignKey(nameof(RecyclingProccessId))]
        public RecyclingProcess RecyclingProcess { get; set; } = null;

        [Required]
        [StringLength(100)]
        public string MaterialName { get; set; } = string.Empty;

        [Required]
        public decimal Quantity { get; set; }

        [Required]
        [StringLength(20)]
        public string Unit { get; set; } = "kg";

        [Required]
        public decimal PricePerUnit { get; set; }

        [Required]
        public decimal EstimatedValue { get; set; }


        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
