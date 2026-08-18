using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace EcoCycle.API.DTOs
{
    public class CollectionAgentRegisterRequest
    {
        // Personal Details
        [Required]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        [Required]
        [Phone]
        public string Phone { get; set; } = string.Empty;

        [Phone]
        public string? AlternatePhone { get; set; }

        public IFormFile? ProfilePicture { get; set; }

        [Required]
        public DateTime DOB { get; set; }

        [Required]
        public string Gender { get; set; } = string.Empty;
        [Required]
        [StringLength(12, MinimumLength = 12)]
        public string AdhaarNumber { get; set; } = string.Empty;

        public IFormFile? AdhaarProof { get; set; }

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

        [Required]
        public string LicenseNumber { get; set; } = string.Empty;

        public IFormFile? VehicleInsurance { get; set; }

        public IFormFile? VehiclePollution { get; set; }
        public IFormFile? VehiclePhoto { get; set; }

        [Required]
        public string AccountHolder { get; set; } = string.Empty;

        [Required]
        public string BankName { get; set; } = string.Empty;

        [Required]
        public string AccountNumber { get; set; } = string.Empty;

        [Required]
        public string IFSCCode { get; set; } = string.Empty;
    }
}