using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EcoCycle.API.Models
{
    public class Technician
    {
        [Key]
        public int TechnicianId { get; set; }

        [Required]
        public int LoginId { get; set; }

        [ForeignKey(nameof(LoginId))]
        public Login Login { get; set; } = null!;

        [Required]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        public string LastName { get; set; } = string.Empty;

        [Required]
        public string PhoneNumber { get; set; } = string.Empty;

        public string? ProfilePhoto { get; set; }

        [Required]
        public DateTime DateOfBirth { get; set; }

        [Required]
        public string Gender { get; set; } = string.Empty;

        [Required]
        public string Address { get; set; } = string.Empty;

        [Required]
        public string State { get; set; } = string.Empty;

        [Required]
        public string District { get; set; } = string.Empty;

        [Required]
        public string City { get; set; } = string.Empty;

        [Required]
        public string PinCode { get; set; } = string.Empty;

        [Required]
        public string InspectionCenterName { get; set; } = string.Empty;

        [Required]
        public string EmployeeId { get; set; } = string.Empty;

        [Required]
        public string JobTitle { get; set; } = string.Empty;

        [Required]
        public DateTime DateOfJoining { get; set; }

        [Required]
        public int ExperienceYears { get; set; }

        [Required]
        public string Specialization { get; set; } = string.Empty;

        [Required]
        public string IssuingInstitute { get; set; } = string.Empty;

        [Required]
        public string CertificateNumber { get; set; } = string.Empty;

        [Required]
        public DateTime CertificateIssueDate { get; set; }

        public DateTime? CertificateExpiryDate { get; set; }

        [Required]
        public string GovernmentIdType { get; set; } = string.Empty;

        [Required]
        public string GovernmentIdNumber { get; set; } = string.Empty;

        public string? GovernmentIdFile { get; set; }

        [Required]
        public string EmployeeIdCard { get; set; } = string.Empty;

        [Required]
        public string TechnicalCertificate { get; set; } = string.Empty;

        public string? Resume { get; set; }

        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}