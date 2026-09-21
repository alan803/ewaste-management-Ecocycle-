using EcoCycle.API.Data;
using EcoCycle.API.DTOs;
using EcoCycle.API.Models;
using EcoCycle.Data.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Mail;

namespace EcoCycle.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecyclingCenterController : ControllerBase
    {
        private readonly ApplicationDbContext db;
        private readonly IWebHostEnvironment env;

        public RecyclingCenterController(
            ApplicationDbContext db,
            IWebHostEnvironment env)
        {
            this.db = db;
            this.env = env;
        }

        private async Task<string?> SaveFile(
            IFormFile? file,
            string folderName)
        {
            if (file == null)
                return null;

            string uploadsFolder = Path.Combine(
                env.WebRootPath,
                "uploads",
                "recycling",
                folderName
            );

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            string fileName =
                Guid.NewGuid().ToString() +
                Path.GetExtension(file.FileName);

            string filePath =
                Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(
                filePath,
                FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return fileName;
        }

        private async Task SendEmailAsync(
            string recipientEmail,
            string subject,
            string body)
        {
            try
            {
                using (MailMessage mail = new MailMessage())
                {
                    mail.From = new MailAddress(
                        "drogbqdidier7@gmail.com",
                        "EcoCycle Admin"
                    );
                    mail.To.Add(recipientEmail);

                    mail.Subject = subject;
                    mail.Body = body;
                    mail.IsBodyHtml = true;

                    using (SmtpClient smtp = new SmtpClient(
                        "smtp.gmail.com",
                        587))
                    {
                        smtp.UseDefaultCredentials = false;
                        smtp.EnableSsl = true;

                        smtp.Credentials = new NetworkCredential(
                            "drogbqdidier7@gmail.com",
                            "rksd acks ucgc yiiy"
                        );

                        smtp.DeliveryMethod = SmtpDeliveryMethod.Network;

                        await smtp.SendMailAsync(mail);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Email Notice] Failed to send email to {recipientEmail}: {ex.Message}");
            }
        }

        [HttpPost("Register")]
        public async Task<IActionResult> Register(
            [FromForm] RecyclingCenterRegisterRequest request)
        {
            using var transaction = await db.Database.BeginTransactionAsync();
            try
            {
                if (db.Login.Any(x => x.Email == request.Email))
                {
                    return BadRequest(new
                    {
                        field = "email_er",
                        message = "Email already registered."
                    });
                }
                if (db.RecyclingCenter.Any(x => x.PhoneNumber == request.PhoneNumber))
                {
                    return BadRequest(new
                    {
                        field = "phoneNumber_er",
                        message = "Phone number already registered."
                    });
                }

                var hasher = new PasswordHasher<Login>();
                Login login = new Login
                {
                    Email = request.Email,
                    PasswordHash = hasher.HashPassword(null, request.Password),
                    RoleId = 5,
                    LastLogin = null
                };

                db.Login.Add(login);
                await db.SaveChangesAsync();

                string? BusinessRegistrationCertificate = await SaveFile(request.BusinessRegistrationCertificate, "buisness registration certificate");
                string? RecyclerRegistrationCertificate = await SaveFile(request.RecyclerRegistrationCertificate, "recycler registration certificate");
                string? ConsentToOperate = await SaveFile(request.ConsentToOperate, "Consent To Operate");
                string? HazardousWasteAuthorization = await SaveFile(request.HazardousWasteAuthorization, "Hazardous Waste Authorization");
                string? AddressProof = await SaveFile(request.AddressProof, "Address Proof");
                string? CenterPhoto = await SaveFile(request.CenterPhoto, "Center Photo");
                string? AuthorizedPersonId = await SaveFile(request.AuthorizedPersonId, "AuthorizedPersonId");

                RecyclingCenter center = new RecyclingCenter
                {
                    LoginId = login.LoginId,
                    CenterName = request.CenterName,
                    OwnerName = request.OwnerName,
                    PhoneNumber = request.PhoneNumber,
                    BusinessRegistrationNumber = request.BusinessRegistrationNumber,
                    GstNumber = request.GstNumber,
                    ExperienceYears = request.ExperienceYears,
                    RecyclerRegistrationNumber = request.RecyclerRegistrationNumber,
                    BuildingNumber = request.BuildingNumber,
                    Street = request.Street,
                    District = request.District,
                    State = request.State,
                    Pincode = request.Pincode,
                    City = request.City,
                    DeviceTypes = request.DeviceTypes,
                    RecyclingProcesses = request.RecyclingProcesses,
                    PickupAvailable = request.PickupAvailable,
                    HazardousWasteHandling = request.HazardousWasteHandling,
                    RecoveredMaterials = request.RecoveredMaterials,
                    HazardousWasteTypes = request.HazardousWasteTypes,
                    BusinessRegistrationCertificate = BusinessRegistrationCertificate ?? "",
                    RecyclerRegistrationCertificate = RecyclerRegistrationCertificate,
                    ConsentToOperate = ConsentToOperate,
                    HazardousWasteAuthorization = HazardousWasteAuthorization,
                    AddressProof = AddressProof,
                    CenterPhoto = CenterPhoto,
                    AuthorizedPersonId = AuthorizedPersonId,
                    Status = "Pending",
                    CreatedAt = DateTime.Now
                };

                db.RecyclingCenter.Add(center);
                await db.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Recycling Center Registered Successfully",
                    recyclingCenterId = center.RecyclingCenterId,
                    loginId = login.LoginId
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpGet("Pending")]
        public async Task<IActionResult> getpendingrecyclincenter()
        {
            var recyclecenter = await db.RecyclingCenter
                .Include(x => x.Login)
                .Where(x => x.Status == "Pending")
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(recyclecenter);
        }

        [HttpGet("All")]
        public async Task<IActionResult> GetAllRecyclingCentersList()
        {
            var recyclecenter = await db.RecyclingCenter
                .Include(x => x.Login)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(recyclecenter);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRecyclecenterById(int id)
        {
            var recyclecenter = await db.RecyclingCenter
                .Include(x => x.Login)
                .FirstOrDefaultAsync(x => x.RecyclingCenterId == id);

            if (recyclecenter == null)
            {
                return NotFound(new
                {
                    message = "Recycling center not found"
                });
            }

            return Ok(recyclecenter);
        }

        [HttpPost("Accept/{id}")]
        public async Task<IActionResult> Activaterecyclingcenter(int id)
        {
            try
            {
                var recyclecenter = await db.RecyclingCenter
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.RecyclingCenterId == id);

                if (recyclecenter == null)
                {
                    return NotFound(new
                    {
                        message = "Recycling Center not found."
                    });
                }

                if (recyclecenter.Status != "Pending")
                {
                    return BadRequest(new
                    {
                        message = "This request has already been processed."
                    });
                }

                if (recyclecenter.Login == null)
                {
                    return BadRequest(new
                    {
                        message = "Login account not found for this recycling center."
                    });
                }

                recyclecenter.Status = "Active";
                await db.SaveChangesAsync();

                string userEmail = recyclecenter.Login.Email;
                string subject = "EcoCycle Recycling Center Application Approved";
                string body = $@"
                <html>
                <body>
                    <h2>EcoCycle Recycling Center Application Approved</h2>
                    <p>Dear {recyclecenter.CenterName},</p>
                    <p>We are pleased to inform you that your recycling center registration application has been <strong>approved</strong> by the EcoCycle administrator.</p>
                    <p>Your EcoCycle account is now active.</p>
                    <p><strong>Account Status:</strong> Active</p>
                    <p>You can now log in to the EcoCycle platform and manage your recycling operations.</p>
                    <br>
                    <p>Thank you for joining EcoCycle.</p>
                    <p>Regards,<br><strong>EcoCycle Admin Team</strong></p>
                </body>
                </html>";

                await SendEmailAsync(userEmail, subject, body);

                return Ok(new
                {
                    message = "Recycling Center accepted successfully and approval email sent."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpPost("Reject/{id}")]
        public async Task<IActionResult> Rejectrecyclingcenter(int id, string? reason)
        {
            try
            {
                var recyclecenter = await db.RecyclingCenter
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.RecyclingCenterId == id);

                if (recyclecenter == null)
                {
                    return NotFound(new
                    {
                        message = "Recycling Center not found."
                    });
                }

                if (recyclecenter.Status != "Pending")
                {
                    return BadRequest(new
                    {
                        message = "This request has already been processed."
                    });
                }

                if (recyclecenter.Login == null)
                {
                    return BadRequest(new
                    {
                        message = "Login account not found for this recycling center."
                    });
                }

                recyclecenter.Status = "Rejected";
                await db.SaveChangesAsync();

                string userEmail = recyclecenter.Login.Email;
                string subject = "EcoCycle Recycling Center Application Status";
                string rejectionReason = string.IsNullOrWhiteSpace(reason)
                    ? "Application details did not meet the required criteria."
                    : reason;

                string body = $@"
                <html>
                <body>
                    <h2>EcoCycle Recycling Center Registration Update</h2>
                    <p>Dear {recyclecenter.CenterName},</p>
                    <p>We regret to inform you that your registration request has been <strong>rejected</strong> by the EcoCycle administrator.</p>
                    <p><strong>Reason for rejection:</strong></p>
                    <p style='color: #dc2626;'>{rejectionReason}</p>
                    <p>If you believe this was in error, please contact support.</p>
                    <br>
                    <p>Regards,<br><strong>EcoCycle Admin Team</strong></p>
                </body>
                </html>";

                await SendEmailAsync(userEmail, subject, body);

                return Ok(new
                {
                    message = "Recycling Center rejected successfully and email sent."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpGet("alluser")]
        public async Task<IActionResult> getrecyclingcenter()
        {
            try
            {
                var recyclingcenter = await db.RecyclingCenter
                    .Include(x => x.Login)
                    .Where(x => x.Status != "Pending")
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();
                return Ok(recyclingcenter);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpPost("deactivate/{id}")]
        public async Task<IActionResult> deactivaterecyclingcenter(int id, string reason)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(reason))
                {
                    return BadRequest(new
                    {
                        message = "Reason for deactivation is required."
                    });
                }

                var recyclingcenter = await db.RecyclingCenter
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.RecyclingCenterId == id);

                if (recyclingcenter == null)
                {
                    return NotFound(new
                    {
                        message = "Recycling Center not found."
                    });
                }

                if (recyclingcenter.Status != "Active")
                {
                    return BadRequest(new
                    {
                        message = "Recycling Center is not in active state."
                    });
                }

                recyclingcenter.Status = "Inactive";
                await db.SaveChangesAsync();

                if (recyclingcenter.Login != null)
                {
                    string userEmail = recyclingcenter.Login.Email;
                    string subject = "EcoCycle Account Deactivated";
                    string body = $@"
                    <html>
                    <body>
                        <h2>EcoCycle Account Deactivated</h2>
                        <p>Dear {recyclingcenter.CenterName},</p>
                        <p>Your EcoCycle account has been deactivated by the administrator.</p>
                        <p><strong>Reason for deactivation:</strong></p>
                        <p>{reason}</p>
                        <p>If you believe this deactivation was made by mistake, please contact administration.</p>
                        <br>
                        <p>Regards,<br><strong>EcoCycle Admin Team</strong></p>
                    </body>
                    </html>";

                    await SendEmailAsync(userEmail, subject, body);
                }

                return Ok(new
                {
                    message = "Recycling Center deactivated successfully."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpPost("activate/{id}")]
        public async Task<IActionResult> activaterecyclingcenter(int id)
        {
            try
            {
                var recyclingcenter = await db.RecyclingCenter.FirstOrDefaultAsync(x => x.RecyclingCenterId == id);
                if (recyclingcenter == null)
                {
                    return NotFound(new
                    {
                        message = "Recycling Center not found"
                    });
                }
                if (recyclingcenter.Status != "Inactive")
                {
                    return BadRequest(new
                    {
                        message = "Recycling Center is already Active"
                    });
                }

                recyclingcenter.Status = "Active";
                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Recycling Center activated successfully."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [Authorize]
        [HttpGet("myprofile")]
        public async Task<IActionResult> GetMyProfile()
        {
            try
            {
                var loginIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                    ?? User.FindFirst("sub")
                    ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                    ?? User.FindFirst("RecyclingCenterId");

                if (loginIdClaim == null || string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new { message = "User identity claim not found in token." });
                }

                if (!int.TryParse(loginIdClaim.Value, out int id))
                {
                    return Unauthorized(new { message = "Invalid user identity format." });
                }

                var center = await db.RecyclingCenter
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.LoginId == id || x.RecyclingCenterId == id);

                if (center == null)
                {
                    center = await db.RecyclingCenter
                        .Include(x => x.Login)
                        .FirstOrDefaultAsync();
                }

                if (center == null)
                {
                    return NotFound(new { message = "Recycling Center not found." });
                }

                return Ok(new
                {
                    Email = center.Login?.Email,
                    CenterName = center.CenterName,
                    OwnerName = center.OwnerName,
                    PhoneNumber = center.PhoneNumber,
                    BusinessRegistrationNumber = center.BusinessRegistrationNumber,
                    GstNumber = center.GstNumber,
                    ExperienceYears = center.ExperienceYears,
                    RecyclerRegistrationNumber = center.RecyclerRegistrationNumber,
                    BuildingNumber = center.BuildingNumber,
                    Street = center.Street,
                    District = center.District,
                    State = center.State,
                    Pincode = center.Pincode,
                    City = center.City,
                    DeviceTypes = center.DeviceTypes,
                    RecyclingProcesses = center.RecyclingProcesses,
                    PickupAvailable = center.PickupAvailable,
                    HazardousWasteHandling = center.HazardousWasteHandling,
                    RecoveredMaterials = center.RecoveredMaterials,
                    HazardousWasteTypes = center.HazardousWasteTypes,
                    BusinessRegistrationCertificate = center.BusinessRegistrationCertificate,
                    RecyclerRegistrationCertificate = center.RecyclerRegistrationCertificate,
                    ConsentToOperate = center.ConsentToOperate,
                    HazardousWasteAuthorization = center.HazardousWasteAuthorization,
                    AddressProof = center.AddressProof,
                    CenterPhoto = center.CenterPhoto,
                    AuthorizedPersonId = center.AuthorizedPersonId,
                    RecyclingCenterId = center.RecyclingCenterId,
                    Status = center.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving recycling center profile.", error = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromForm] RecyclingCenterUpdateProfileRequest request)
        {
            try
            {
                var loginIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                    ?? User.FindFirst("sub")
                    ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                    ?? User.FindFirst("RecyclingCenterId");

                if (loginIdClaim == null || string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new { message = "User identity not found in token." });
                }

                if (!int.TryParse(loginIdClaim.Value, out int id))
                {
                    return Unauthorized(new { message = "Invalid user identity format." });
                }

                var center = await db.RecyclingCenter
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.LoginId == id || x.RecyclingCenterId == id);

                if (center == null)
                {
                    return NotFound(new { message = "Recycling Center not found." });
                }

                if (!string.IsNullOrWhiteSpace(request.CenterName))
                    center.CenterName = request.CenterName.Trim();

                if (!string.IsNullOrWhiteSpace(request.OwnerName))
                    center.OwnerName = request.OwnerName.Trim();

                if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
                    center.PhoneNumber = request.PhoneNumber.Trim();

                if (request.ExperienceYears.HasValue)
                    center.ExperienceYears = request.ExperienceYears.Value;

                if (!string.IsNullOrWhiteSpace(request.BuildingNumber))
                    center.BuildingNumber = request.BuildingNumber.Trim();

                if (!string.IsNullOrWhiteSpace(request.Street))
                    center.Street = request.Street.Trim();

                if (!string.IsNullOrWhiteSpace(request.District))
                    center.District = request.District.Trim();

                if (!string.IsNullOrWhiteSpace(request.State))
                    center.State = request.State.Trim();

                if (!string.IsNullOrWhiteSpace(request.Pincode))
                    center.Pincode = request.Pincode.Trim();

                if (!string.IsNullOrWhiteSpace(request.City))
                    center.City = request.City.Trim();

                if (!string.IsNullOrWhiteSpace(request.DeviceTypes))
                    center.DeviceTypes = request.DeviceTypes.Trim();

                if (!string.IsNullOrWhiteSpace(request.RecyclingProcesses))
                    center.RecyclingProcesses = request.RecyclingProcesses.Trim();

                if (!string.IsNullOrWhiteSpace(request.PickupAvailable))
                    center.PickupAvailable = request.PickupAvailable.Trim();

                if (!string.IsNullOrWhiteSpace(request.HazardousWasteHandling))
                    center.HazardousWasteHandling = request.HazardousWasteHandling.Trim();

                if (!string.IsNullOrWhiteSpace(request.RecoveredMaterials))
                    center.RecoveredMaterials = request.RecoveredMaterials.Trim();

                if (!string.IsNullOrWhiteSpace(request.HazardousWasteTypes))
                    center.HazardousWasteTypes = request.HazardousWasteTypes.Trim();

                if (request.CenterPhoto != null)
                {
                    string? savedPic = await SaveFile(request.CenterPhoto, "Center Photo");
                    if (!string.IsNullOrEmpty(savedPic))
                    {
                        center.CenterPhoto = savedPic;
                    }
                }

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Profile updated successfully.",
                    centerPhoto = center.CenterPhoto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating profile.", error = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("verify-password")]
        public async Task<IActionResult> VerifyCurrentPassword([FromBody] VerifyPasswordRequest request)
        {
            try
            {
                var loginIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                    ?? User.FindFirst("sub")
                    ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                    ?? User.FindFirst("RecyclingCenterId");

                if (loginIdClaim == null || string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new { message = "User identity claim not found in token." });
                }

                if (!int.TryParse(loginIdClaim.Value, out int id))
                {
                    return Unauthorized(new { message = "Invalid user identity format." });
                }

                var center = await db.RecyclingCenter
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.LoginId == id || x.RecyclingCenterId == id);

                if (center == null || center.Login == null)
                {
                    return NotFound(new { message = "Recycling Center account not found." });
                }

                var hasher = new PasswordHasher<Login>();
                var result = hasher.VerifyHashedPassword(center.Login, center.Login.PasswordHash, request.CurrentPassword ?? "");

                if (result == PasswordVerificationResult.Failed)
                {
                    return BadRequest(new { success = false, message = "Current password is incorrect." });
                }

                return Ok(new { success = true, message = "Password verified successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error verifying password.", error = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangeCenterPassword([FromBody] ChangeUserPasswordRequest request)
        {
            try
            {
                var loginIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                    ?? User.FindFirst("sub")
                    ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                    ?? User.FindFirst("RecyclingCenterId");

                if (loginIdClaim == null || string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new { message = "User identity claim not found in token." });
                }

                if (!int.TryParse(loginIdClaim.Value, out int id))
                {
                    return Unauthorized(new { message = "Invalid user identity format." });
                }

                var center = await db.RecyclingCenter
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.LoginId == id || x.RecyclingCenterId == id);

                if (center == null || center.Login == null)
                {
                    return NotFound(new { message = "Recycling Center account not found." });
                }

                if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                {
                    return BadRequest(new { message = "Current password is required." });
                }

                var hasher = new PasswordHasher<Login>();
                var verifyResult = hasher.VerifyHashedPassword(center.Login, center.Login.PasswordHash, request.CurrentPassword);

                if (verifyResult == PasswordVerificationResult.Failed)
                {
                    return BadRequest(new { message = "Current password is incorrect." });
                }

                if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
                {
                    return BadRequest(new { message = "New password must be at least 6 characters." });
                }

                if (request.NewPassword != request.ConfirmPassword)
                {
                    return BadRequest(new { message = "New password and confirm password do not match." });
                }

                center.Login.PasswordHash = hasher.HashPassword(center.Login, request.NewPassword);
                await db.SaveChangesAsync();

                return Ok(new { message = "Password updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error changing password.", error = ex.Message });
            }
        }
    }

    public class RecyclingCenterUpdateProfileRequest
    {
        public string? CenterName { get; set; }
        public string? OwnerName { get; set; }
        public string? PhoneNumber { get; set; }
        public int? ExperienceYears { get; set; }
        public string? BuildingNumber { get; set; }
        public string? Street { get; set; }
        public string? District { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }
        public string? City { get; set; }
        public string? DeviceTypes { get; set; }
        public string? RecyclingProcesses { get; set; }
        public string? PickupAvailable { get; set; }
        public string? HazardousWasteHandling { get; set; }
        public string? RecoveredMaterials { get; set; }
        public string? HazardousWasteTypes { get; set; }
        public IFormFile? CenterPhoto { get; set; }
    }
}
