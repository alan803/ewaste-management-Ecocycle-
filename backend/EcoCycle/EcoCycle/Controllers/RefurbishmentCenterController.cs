using EcoCycle.API.Data;
using EcoCycle.API.DTOs;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Mail;

namespace EcoCycle.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RefurbishmentCenterController : ControllerBase
    {
        private readonly ApplicationDbContext db;
        private readonly IWebHostEnvironment env;

        public RefurbishmentCenterController(
            ApplicationDbContext db,
            IWebHostEnvironment env)
        {
            this.db = db;
            this.env = env;
        }
        private string? SaveFile(IFormFile? file, string folderName)
        {
            if (file == null)
                return null;

            string uploadsFolder = Path.Combine(
                env.WebRootPath,
                "uploads",
                "refurbishment",
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
                file.CopyTo(stream);
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
                            "gxgy cclr rght awid"
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
        public IActionResult Register(
            [FromForm] RefurbishmentCenterDTO request)
        {
            using var transaction =
                db.Database.BeginTransaction();

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

                if (db.RefurbishmentCenter.Any(
                    x => x.PhoneNumber == request.PhoneNumber))
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

                    PasswordHash =
                        hasher.HashPassword(
                            null,
                            request.Password
                        ),

                    RoleId = 4,

                    LastLogin = null
                };

                db.Login.Add(login);

                db.SaveChanges();

                string? businessRegistrationCertificate =
                    SaveFile(
                        request.BusinessRegistrationCertificate,
                        "business-registration"
                    );

                string? tradeLicense =
                    SaveFile(
                        request.TradeLicense,
                        "trade-license"
                    );

                string? addressProof =
                    SaveFile(
                        request.AddressProof,
                        "address-proof"
                    );

                string? centerPhoto =
                    SaveFile(
                        request.CenterPhoto,
                        "center-photo"
                    );

                string? authorizedPersonId =
                    SaveFile(
                        request.AuthorizedPersonId,
                        "authorized-person-id"
                    );

                RefurbishmentCenter center =
                    new RefurbishmentCenter
                    {
                        LoginId = login.LoginId,

                        CenterName = request.CenterName,
                        OwnerName = request.OwnerName,
                        PhoneNumber = request.PhoneNumber,

                        BusinessRegistrationNumber =
                            request.BusinessRegistrationNumber,

                        GstNumber =
                            request.GstNumber,

                        ExperienceYears =
                            request.ExperienceYears,

                        LicenseNumber =
                            request.LicenseNumber,

                        BuildingNumber =
                            request.BuildingNumber,

                        Street =
                            request.Street,

                        District =
                            request.District,

                        State =
                            request.State,

                        Pincode =
                            request.Pincode,

                        City =
                            request.City,

                        DeviceTypes =
                            string.Join(",", request.DeviceTypes),

                        Services =
                            string.Join(",", request.Services),

                        TechnicianCount =
                            request.TechnicianCount,

                        PickupAvailable =
                            request.PickupAvailable,

                        BusinessRegistrationCertificate =
                            businessRegistrationCertificate ?? "",

                        TradeLicense =
                            tradeLicense ?? "",

                        AddressProof =
                            addressProof ?? "",

                        CenterPhoto =
                            centerPhoto ?? "",

                        AuthorizedPersonId =
                            authorizedPersonId ?? "",

                        Status = "Pending",

                        CreatedAt = DateTime.Now
                    };

                db.RefurbishmentCenter.Add(center);

                db.SaveChanges();

                transaction.Commit();

                return Ok(new
                {
                    message =
                        "Refurbishment Center Registered Successfully",

                    refurbishmentCenterId =
                        center.RefurbishmentCenterId,

                    loginId =
                        login.LoginId
                });
            }
            catch (Exception ex)
            {
                transaction.Rollback();

                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpGet("Pending")]
        public async Task<IActionResult>
            getpendingrefurbishmentcenter()
        {
            var refurbishmentcenter =
                await db.RefurbishmentCenter
                    .Include(x => x.Login)
                    .Where(x => x.Status == "Pending")
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();

            return Ok(refurbishmentcenter);
        }

        [HttpGet("All")]
        public async Task<IActionResult>
            GetAllRefurbishmentCentersList()
        {
            var refurbishmentcenter =
                await db.RefurbishmentCenter
                    .Include(x => x.Login)
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();

            return Ok(refurbishmentcenter);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult>
            GetRefurbishmentcenterById(int id)
        {
            var refurbishmentcenter =
                await db.RefurbishmentCenter
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(
                        x => x.RefurbishmentCenterId == id
                    );

            if (refurbishmentcenter == null)
            {
                return NotFound(new
                {
                    message =
                        "Refurbishment center not found"
                });
            }

            return Ok(refurbishmentcenter);
        }

        [HttpPost("Accept/{id}")]
        public async Task<IActionResult>
            Activaterefurbishmentcenter(int id)
        {
            try
            {
                var refurbishmentcenter =
                    await db.RefurbishmentCenter
                        .Include(x => x.Login)
                        .FirstOrDefaultAsync(
                            x => x.RefurbishmentCenterId == id
                        );

                if (refurbishmentcenter == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Refurbishment Center not found."
                    });
                }

                if (refurbishmentcenter.Status != "Pending")
                {
                    return BadRequest(new
                    {
                        message =
                            "This request has already been processed."
                    });
                }

                if (refurbishmentcenter.Login == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Login account not found for this refurbishment center."
                    });
                }

                string userEmail =
                    refurbishmentcenter.Login.Email;

                string subject =
                    "EcoCycle Refurbishment Center Application Approved";

                string body = $@"
                <html>
                <body>

                    <h2>EcoCycle Application Approved</h2>

                    <p>
                        Dear {refurbishmentcenter.CenterName},
                    </p>

                    <p>
                        We are pleased to inform you that your
                        refurbishment center registration has been
                        <strong>approved</strong> by the EcoCycle administrator.
                    </p>

                    <p>
                        Your EcoCycle account is now active.
                    </p>

                    <p>
                        <strong>Account Status:</strong> Active
                    </p>

                    <p>
                        You can now log in to the EcoCycle platform
                        and access your account.
                    </p>

                    <br>

                    <p>
                        Thank you for joining EcoCycle.
                    </p>

                    <p>
                        Regards,<br>
                        <strong>EcoCycle Admin Team</strong>
                    </p>

                </body>
                </html>
                ";

                // Send email FIRST
                await SendEmailAsync(
                    userEmail,
                    subject,
                    body
                );

                // Only activate after email is successfully sent
                refurbishmentcenter.Status = "Active";

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message =
                        "Refurbishment Center accepted successfully and approval email sent."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message,
                    innerException = ex.InnerException?.Message
                });
            }
        }
        [HttpPost("Reject/{id}")]
        public async Task<IActionResult>
            Rejectrefurbishmentcenter(
                int id,
                string? reason)
        {
            try
            {
                var refurbishmentcenter =
                    await db.RefurbishmentCenter
                        .Include(x => x.Login)
                        .FirstOrDefaultAsync(
                            x => x.RefurbishmentCenterId == id
                        );

                if (refurbishmentcenter == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Refurbishment Center not found."
                    });
                }

                if (refurbishmentcenter.Status != "Pending")
                {
                    return BadRequest(new
                    {
                        message =
                            "This request has already been processed."
                    });
                }

                if (refurbishmentcenter.Login == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Login account not found for this refurbishment center."
                    });
                }

                if (string.IsNullOrWhiteSpace(reason))
                {
                    reason =
                        "Your registration request did not meet the requirements of EcoCycle.";
                }

                string userEmail =
                    refurbishmentcenter.Login.Email;

                string subject =
                    "EcoCycle Refurbishment Center Application Rejected";

                string body = $@"
                <html>
                <body>

                    <h2>EcoCycle Application Rejected</h2>

                    <p>
                        Dear {refurbishmentcenter.CenterName},
                    </p>

                    <p>
                        We regret to inform you that your
                        refurbishment center registration request
                        has been <strong>rejected</strong> by the
                        EcoCycle administrator.
                    </p>

                    <p>
                        <strong>Reason for rejection:</strong>
                    </p>

                    <p>
                        {reason}
                    </p>

                    <p>
                        If you believe this decision was made by mistake
                        or you require additional information, please
                        contact the EcoCycle administration.
                    </p>

                    <br>

                    <p>
                        Regards,<br>
                        <strong>EcoCycle Admin Team</strong>
                    </p>

                </body>
                </html>
                ";

                // Send email FIRST
                await SendEmailAsync(
                    userEmail,
                    subject,
                    body
                );

                // Only reject after email is successfully sent
                refurbishmentcenter.Status = "Rejected";

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message =
                        "Refurbishment Center rejected successfully and rejection email sent."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message,
                    innerException = ex.InnerException?.Message
                });
            }
        }

        [HttpGet("alluser")]
        public async Task<IActionResult>
            getrefurbishmentcenter()
        {
            try
            {
                var refurbishmentcenter =
                    await db.RefurbishmentCenter
                        .Include(x => x.Login)
                        .Where(x => x.Status != "Pending")
                        .OrderByDescending(x => x.CreatedAt)
                        .ToListAsync();

                return Ok(refurbishmentcenter);
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
        public async Task<IActionResult>
            deactivaterefurbishmentcenter(
                int id,
                string reason)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(reason))
                {
                    return BadRequest(new
                    {
                        message =
                            "Deactivation reason is required."
                    });
                }


                var refurbishmentcenter =
                    await db.RefurbishmentCenter
                        .Include(x => x.Login)
                        .FirstOrDefaultAsync(
                            x => x.RefurbishmentCenterId == id
                        );


                if (refurbishmentcenter == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Refurbishment Center not found."
                    });
                }


                if (refurbishmentcenter.Status != "Active")
                {
                    return BadRequest(new
                    {
                        message =
                            "Only active refurbishment centers can be deactivated."
                    });
                }


                if (refurbishmentcenter.Login == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Login account not found."
                    });
                }

                refurbishmentcenter.Status = "Inactive";

                await db.SaveChangesAsync();


                string userEmail =
                    refurbishmentcenter.Login.Email;


                string subject =
                    "EcoCycle Account Deactivated";


                string body = $@"
                <html>
                <body>

                    <h2>EcoCycle Account Deactivated</h2>

                    <p>
                        Dear {refurbishmentcenter.CenterName},
                    </p>

                    <p>
                        Your EcoCycle account has been
                        <strong>deactivated</strong> by the administrator.
                    </p>

                    <p>
                        <strong>Reason for deactivation:</strong>
                    </p>

                    <p>
                        {reason}
                    </p>

                    <p>
                        If you believe this deactivation was made by mistake,
                        please contact the EcoCycle administration.
                    </p>

                    <br>

                    <p>
                        Regards,<br>
                        <strong>EcoCycle Admin Team</strong>
                    </p>

                </body>
                </html>
                ";


                await SendEmailAsync(
                    userEmail,
                    subject,
                    body
                );


                return Ok(new
                {
                    message =
                        "Refurbishment Center deactivated successfully and email sent."
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
        public async Task<IActionResult>
            activaterefurbishmentcenter(int id)
        {
            try
            {
                var refurbishmentcenter =
                    await db.RefurbishmentCenter
                        .FirstOrDefaultAsync(
                            x => x.RefurbishmentCenterId == id
                        );


                if (refurbishmentcenter == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Refurbishment Center not found."
                    });
                }


                if (refurbishmentcenter.Status != "Inactive")
                {
                    return BadRequest(new
                    {
                        message =
                            "Refurbishment Center is already Active."
                    });
                }


                refurbishmentcenter.Status = "Active";

                await db.SaveChangesAsync();


                return Ok(new
                {
                    message =
                        "Refurbishment Center activated successfully."
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
                    ?? User.FindFirst("RefurbishmentCenterId");

                if (loginIdClaim == null || string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new
                    {
                        message = "User identity claim not found in token."
                    });
                }

                if (!int.TryParse(loginIdClaim.Value, out int id))
                {
                    return Unauthorized(new
                    {
                        message = "Invalid user identity format."
                    });
                }

                var center = await db.RefurbishmentCenter
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.LoginId == id || x.RefurbishmentCenterId == id);

                if (center == null)
                {
                    return NotFound(new { message = "Refurbishment Center not found." });
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
                    LicenseNumber = center.LicenseNumber,
                    BuildingNumber = center.BuildingNumber,
                    Street = center.Street,
                    District = center.District,
                    State = center.State,
                    Pincode = center.Pincode,
                    City = center.City,
                    DeviceTypes = center.DeviceTypes,
                    Services = center.Services,
                    TechnicianCount = center.TechnicianCount,
                    PickupAvailable = center.PickupAvailable,
                    BusinessRegistrationCertificate = center.BusinessRegistrationCertificate,
                    TradeLicense = center.TradeLicense,
                    AddressProof = center.AddressProof,
                    CenterPhoto = center.CenterPhoto,
                    AuthorizedPersonId = center.AuthorizedPersonId,
                    RefurbishmentCenterId = center.RefurbishmentCenterId,
                    Status = center.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error retrieving refurbishment center profile.",
                    error = ex.Message
                });
            }
        }

        [Authorize]
        [HttpPost("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromForm] RefurbishmentCenterUpdateProfileRequest request)
        {
            try
            {
                var loginIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                    ?? User.FindFirst("sub")
                    ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                    ?? User.FindFirst("RefurbishmentCenterId");

                if (loginIdClaim == null || string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new { message = "User identity not found in token." });
                }

                if (!int.TryParse(loginIdClaim.Value, out int id))
                {
                    return Unauthorized(new { message = "Invalid user identity format." });
                }

                var center = await db.RefurbishmentCenter
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.LoginId == id || x.RefurbishmentCenterId == id);

                if (center == null)
                {
                    return NotFound(new { message = "Refurbishment Center not found." });
                }

                if (!string.IsNullOrWhiteSpace(request.CenterName))
                    center.CenterName = request.CenterName.Trim();

                if (!string.IsNullOrWhiteSpace(request.OwnerName))
                    center.OwnerName = request.OwnerName.Trim();

                if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
                    center.PhoneNumber = request.PhoneNumber.Trim();

                if (request.ExperienceYears.HasValue)
                    center.ExperienceYears = request.ExperienceYears.Value;

                if (request.TechnicianCount.HasValue)
                    center.TechnicianCount = request.TechnicianCount.Value;

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

                if (!string.IsNullOrWhiteSpace(request.Services))
                    center.Services = request.Services.Trim();

                if (!string.IsNullOrWhiteSpace(request.PickupAvailable))
                    center.PickupAvailable = request.PickupAvailable.Trim();

                if (request.CenterPhoto != null)
                {
                    string? savedPic = SaveFile(request.CenterPhoto, "center-photo");
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
                    ?? User.FindFirst("RefurbishmentCenterId");

                if (loginIdClaim == null || string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new { message = "User identity claim not found in token." });
                }

                if (!int.TryParse(loginIdClaim.Value, out int id))
                {
                    return Unauthorized(new { message = "Invalid user identity format." });
                }

                var center = await db.RefurbishmentCenter
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.LoginId == id || x.RefurbishmentCenterId == id);

                if (center == null || center.Login == null)
                {
                    return NotFound(new { message = "Refurbishment Center account not found." });
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
                    ?? User.FindFirst("RefurbishmentCenterId");

                if (loginIdClaim == null || string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new { message = "User identity claim not found in token." });
                }

                if (!int.TryParse(loginIdClaim.Value, out int id))
                {
                    return Unauthorized(new { message = "Invalid user identity format." });
                }

                var center = await db.RefurbishmentCenter
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.LoginId == id || x.RefurbishmentCenterId == id);

                if (center == null || center.Login == null)
                {
                    return NotFound(new { message = "Refurbishment Center account not found." });
                }

                if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
                {
                    return BadRequest(new { message = "New password must be at least 6 characters." });
                }

                if (request.NewPassword != request.ConfirmPassword)
                {
                    return BadRequest(new { message = "New password and confirm password do not match." });
                }

                var hasher = new PasswordHasher<Login>();
                var verifyResult = hasher.VerifyHashedPassword(center.Login, center.Login.PasswordHash, request.CurrentPassword ?? "");

                if (verifyResult == PasswordVerificationResult.Failed)
                {
                    return BadRequest(new { message = "Current password is incorrect." });
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

    public class RefurbishmentCenterUpdateProfileRequest
    {
        public string? CenterName { get; set; }
        public string? OwnerName { get; set; }
        public string? PhoneNumber { get; set; }
        public int? ExperienceYears { get; set; }
        public int? TechnicianCount { get; set; }
        public string? BuildingNumber { get; set; }
        public string? Street { get; set; }
        public string? District { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }
        public string? City { get; set; }
        public string? DeviceTypes { get; set; }
        public string? Services { get; set; }
        public string? PickupAvailable { get; set; }
        public IFormFile? CenterPhoto { get; set; }
    }
}