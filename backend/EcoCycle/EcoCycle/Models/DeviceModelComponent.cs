using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class DeviceModelComponent
    {
        [Key]
        public int DeviceModelComponentId { get; set; }

        [Required]
        public int DeviceModelId { get; set; }

        [ForeignKey(nameof(DeviceModelId))]
        public DeviceModel? DeviceModel { get; set; }

        [Required]
        public int ComponentTypeId { get; set; }

        [ForeignKey(nameof(ComponentTypeId))]
        public ComponentType? ComponentType { get; set; }

        public bool IsExpected { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}