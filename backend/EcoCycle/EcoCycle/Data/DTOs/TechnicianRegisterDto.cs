using Microsoft.AspNetCore.Http;
namespace EcoCycle.API.Data.DTOs
{
    public class TechnicianRegisterDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;


        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;

        public IFormFile? ProfilePhoto { get; set; }

        public string Address { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string PinCode { get; set; } = string.Empty;

        public string InspectionCenterName { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public string JobTitle { get; set; } = string.Empty;
        public DateTime DateOfJoining { get; set; }
        public int ExperienceYears { get; set; }
        public string Specialization { get; set; } = string.Empty;
        public string IssuingInstitute { get; set; } = string.Empty;
        public string CertificateNumber { get; set; } = string.Empty;
        public DateTime CertificateIssueDate { get; set; }
        public DateTime? CertificateExpiryDate { get; set; }

        public string GovernmentIdType { get; set; } = string.Empty;
        public string GovernmentIdNumber { get; set; } = string.Empty;

        public IFormFile? GovernmentIdFile { get; set; }
        public IFormFile? EmployeeIdCard { get; set; }
        public IFormFile? TechnicalCertificate { get; set; }
        public IFormFile? Resume { get; set; }
     }
}