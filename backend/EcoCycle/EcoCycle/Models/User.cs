using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required]
        public int LoginId { get; set; }

        [ForeignKey(nameof(LoginId))]
        public Login Login { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [StringLength(15)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string Address { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string State { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string District { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string City { get; set; } = string.Empty;

        [Required]
        [StringLength(10)]
        public string Pincode { get; set; } = string.Empty;

        [StringLength(500)]
        public string? ProfileImage { get; set; }

        [Required]
        [StringLength(10)]
        public string Gender { get; set; } = string.Empty;

        public double? Latitude { get; set; }

        public double? Longitude { get; set; }

        [Required]
        public DateTime DateOfBirth { get; set; }

        // ================= PAYMENT DETAILS =================

        [Required]
        public string AccountHolder { get; set; } = string.Empty;

        [Required]
        public string BankName { get; set; } = string.Empty;

        [Required]
        public string AccountNumber { get; set; } = string.Empty;

        [Required]
        public string IFSCCode { get; set; } = string.Empty;

        // ===================================================

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public string Status { get; set; } = "Active";
    }
}