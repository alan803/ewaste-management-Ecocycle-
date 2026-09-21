using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class DeviceModel
    {
        [Key]
        public int DeviceModelId { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [ForeignKey(nameof(CategoryId))]
        public DeviceCategory? Category { get; set; }

        [Required]
        [StringLength(100)]
        public string Brand { get; set; } = string.Empty;

        [Required]
        [StringLength(150)]
        public string Model { get; set; } = string.Empty;

        [StringLength(100)]
        public string? ModelNumber { get; set; }

        [Column(TypeName = "decimal(8,3)")]
        public decimal? Weight { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public ICollection<DeviceModelComponent> DeviceModelComponents { get; set; } = new List<DeviceModelComponent>();
    }
}