using System.ComponentModel.DataAnnotations;

namespace EcoCycle.API.DTOs
{
    public class UpdateBankDetailsDto
    {
        [Required(ErrorMessage = "Account holder name is required.")]
        [StringLength(100, ErrorMessage = "Account holder name cannot exceed 100 characters.")]
        public string AccountHolder { get; set; } = string.Empty;

        [Required(ErrorMessage = "Bank name is required.")]
        [StringLength(100, ErrorMessage = "Bank name cannot exceed 100 characters.")]
        public string BankName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Account number is required.")]
        [RegularExpression(@"^\d{9,18}$", ErrorMessage = "Account number must be 9 to 18 numeric digits.")]
        public string AccountNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "IFSC code is required.")]
        [RegularExpression(@"^[A-Z]{4}0[A-Z0-9]{6}$", ErrorMessage = "Invalid IFSC code format (e.g. SBIN0001234).")]
        public string IFSCCode { get; set; } = string.Empty;
    }
}
