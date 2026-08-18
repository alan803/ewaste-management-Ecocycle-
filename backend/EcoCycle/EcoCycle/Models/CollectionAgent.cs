using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class CollectionAgent
    {
        [Key]
        public int CollectionAgentId { get; set; }

        [Required]
        public int LoginId { get; set; }

        [ForeignKey(nameof(LoginId))]
        public Login Login { get; set; } = null!;

        [Required]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        public string LastName { get; set; } = string.Empty;

        [Required]
        public string Phone { get; set; } = string.Empty;

        public string? AlternatePhone { get; set; }

        public string? ProfilePicture { get; set; }

        [Required]
        public DateTime DOB { get; set; }

        [Required]
        public string Gender { get; set; } = string.Empty;

        [Required]
        public string AdhaarNumber { get; set; } = string.Empty;

        public string? AdhaarProof { get; set; }

        [Required]
        public string Address { get; set; } = string.Empty;

        [Required]
        public string State { get; set; } = string.Empty;

        [Required]
        public string District { get; set; } = string.Empty;

        [Required]
        public string City { get; set; } = string.Empty;

        [Required]
        public string Pincode { get; set; } = string.Empty;


        [Required]
        public string VehicleType { get; set; } = string.Empty;

        [Required]
        public string VehicleNumber { get; set; } = string.Empty;

        public string? VehicleInsurance { get; set; }

        public string? VehiclePollution { get; set; }
        public string? VehiclePhoto{ get; set; }


        [Required]
        public string LicenseNumber { get; set; } = string.Empty;

        [Required]
        public string AccountHolder { get; set; } = string.Empty;

        [Required]
        public string BankName { get; set; } = string.Empty;

        [Required]
        public string AccountNumber { get; set; } = string.Empty;

        [Required]
        public string IFSCCode { get; set; } = string.Empty;

        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}