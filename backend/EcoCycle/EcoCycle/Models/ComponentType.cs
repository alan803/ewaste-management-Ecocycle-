using System.ComponentModel.DataAnnotations;

namespace EcoCycle.API.Models
{
    public class ComponentType
    {
        [Key]
        public int ComponentTypeId { get; set; }

        [Required]
        [StringLength(100)]
        public string ComponentName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string HandlingType { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        public bool IsHazardous { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public ICollection<MaterialPrice> MaterialPrices { get; set; }= new List<MaterialPrice>();
        public ICollection<DeviceModelComponent> DeviceModelComponents { get; set; }
            = new List<DeviceModelComponent>();
    }
}