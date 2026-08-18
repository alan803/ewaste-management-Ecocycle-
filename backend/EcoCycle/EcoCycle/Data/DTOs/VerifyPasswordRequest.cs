namespace EcoCycle.API.DTOs
{
    public class VerifyPasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
    }

    public class ChangeUserPasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
