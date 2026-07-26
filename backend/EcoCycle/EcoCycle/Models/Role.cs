using EcoCycle.API.Models;
using System.ComponentModel.DataAnnotations;
namespace EcoCycle.API.Models
{
    public class Role
    {
        [Key]
        public int role_id {  get; set; }
        [Required]
        [StringLength(50)]
        public string name { get; set; } = String.Empty;
        public ICollection<User> Users { get; set; }
    }
}
