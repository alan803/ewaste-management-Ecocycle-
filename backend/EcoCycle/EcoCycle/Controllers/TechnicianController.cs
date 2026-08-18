using EcoCycle.API.Data;
using EcoCycle.API.Data.DTOs;
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
    public class TechnicianController : ControllerBase
    {
        private readonly ApplicationDbContext db;
        private readonly IWebHostEnvironment env;

        public TechnicianController(
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
                "technicians",
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
            [FromForm] TechnicianRegisterDto dto)
        {
            if (db.Login.Any(x => x.Email == dto.Email))
            {
                return BadRequest(new
                {
                    field = "email_er",
                    message = "Email already registered."
                });
            }

            if (db.Technician.Any(
                x => x.PhoneNumber == dto.PhoneNumber))
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
                Email = dto.Email,

                PasswordHash =
                    hasher.HashPassword(
                        null,
                        dto.Password
                    ),

                RoleId = 3,

                LastLogin = null
            };

            db.Login.Add(login);

            db.SaveChanges();


            Technician technician = new Technician
            {
                LoginId = login.LoginId,

                FirstName = dto.FirstName,
                LastName = dto.LastName,

                PhoneNumber = dto.PhoneNumber,

                DateOfBirth = dto.DateOfBirth,

                Gender = dto.Gender,

                Address = dto.Address,
                State = dto.State,
                District = dto.District,
                City = dto.City,
                PinCode = dto.PinCode,

                InspectionCenterName =
                    dto.InspectionCenterName,

                EmployeeId = dto.EmployeeId,

                JobTitle = dto.JobTitle,

                DateOfJoining = dto.DateOfJoining,

                ExperienceYears =
                    dto.ExperienceYears,

                Specialization =
                    dto.Specialization,

                IssuingInstitute =
                    dto.IssuingInstitute,

                CertificateNumber =
                    dto.CertificateNumber,

                CertificateIssueDate =
                    dto.CertificateIssueDate,

                CertificateExpiryDate =
                    dto.CertificateExpiryDate,

                GovernmentIdType =
                    dto.GovernmentIdType,

                GovernmentIdNumber =
                    dto.GovernmentIdNumber,

                Status = "Pending",

                CreatedAt = DateTime.Now
            };

            technician.ProfilePhoto =
                await SaveFile(
                    dto.ProfilePhoto,
                    "ProfilePhotos"
                );

            string governmentIdFolder =
                dto.GovernmentIdType switch
                {
                    "Aadhaar" =>
                        "GovernmentIds/Aadhaar",

                    "PAN" =>
                        "GovernmentIds/PAN",

                    "Driving Licence" =>
                        "GovernmentIds/DrivingLicence",

                    "Passport" =>
                        "GovernmentIds/Passport",

                    _ =>
                        "GovernmentIds"
                };

            technician.GovernmentIdFile =
                await SaveFile(
                    dto.GovernmentIdFile,
                    governmentIdFolder
                );

            technician.EmployeeIdCard =
                await SaveFile(
                    dto.EmployeeIdCard,
                    "EmployeeIdCards"
                );

            technician.TechnicalCertificate =
                await SaveFile(
                    dto.TechnicalCertificate,
                    "TechnicalCertificates"
                );


            technician.Resume =
                await SaveFile(
                    dto.Resume,
                    "Resumes"
                );


            db.Technician.Add(technician);

            await db.SaveChangesAsync();


            return Ok(new
            {
                message =
                    "Technician registered successfully."
            });
        }

        [HttpGet("Pending")]
        public async Task<IActionResult>
            getpendingtechnicians()
        {
            var technician =
                await db.Technician
                    .Include(x => x.Login)
                    .Where(x => x.Status == "Pending")
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();

            return Ok(technician);
        }

        [HttpGet("All")]
        public async Task<IActionResult>
            GetAllTechniciansList()
        {
            var technician =
                await db.Technician
                    .Include(x => x.Login)
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();

            return Ok(technician);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult>
            GetTechnicianById(int id)
        {
            var technician =
                await db.Technician
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(
                        x => x.TechnicianId == id
                    );

            if (technician == null)
            {
                return NotFound(new
                {
                    message = "Technician not found"
                });
            }

            return Ok(technician);
        }

        [HttpPost("Accept/{id}")]
        public async Task<IActionResult>
            Activatetechnician(int id)
        {
            try
            {
                var technician =
                    await db.Technician
                        .Include(x => x.Login)
                        .FirstOrDefaultAsync(
                            x => x.TechnicianId == id
                        );

                if (technician == null)
                {
                    return NotFound(new
                    {
                        message = "Technician not found."
                    });
                }

                if (technician.Status != "Pending")
                {
                    return BadRequest(new
                    {
                        message =
                            "This request has already been processed."
                    });
                }

                if (technician.Login == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Login account not found for this technician."
                    });
                }

                technician.Status = "Active";

                await db.SaveChangesAsync();

                string userEmail =
                    technician.Login.Email;
                string subject =
                    "EcoCycle Technician Application Approved";

                string body = $@"
                <html>
                <body>

                    <h2>EcoCycle Technician Application Approved</h2>

                    <p>
                        Dear {technician.FirstName} {technician.LastName},
                    </p>

                    <p>
                        We are pleased to inform you that your
                        technician registration has been
                        <strong>approved</strong> by the EcoCycle administrator.
                    </p>

                    <p>
                        Your EcoCycle technician account is now active.
                    </p>

                    <p>
                        <strong>Account Status:</strong> Active
                    </p>

                    <p>
                        You can now log in to the EcoCycle platform
                        and access your technician account.
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

                await SendEmailAsync(
                    userEmail,
                    subject,
                    body
                );

                return Ok(new
                {
                    message =
                        "Technician accepted successfully and approval email sent."
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
        public async Task<IActionResult>
            Rejecttechnician(
                int id,
                string? reason)
        {
            try
            {
                var technician =
                    await db.Technician
                        .Include(x => x.Login)
                        .FirstOrDefaultAsync(
                            x => x.TechnicianId == id
                        );

                if (technician == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Technician not found."
                    });
                }

                if (technician.Status != "Pending")
                {
                    return BadRequest(new
                    {
                        message =
                            "This request has already been processed."
                    });
                }

                if (technician.Login == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Login account not found for this technician."
                    });
                }
                if (string.IsNullOrWhiteSpace(reason))
                {
                    reason =
                        "Your technician registration request did not meet the requirements of EcoCycle.";
                }

                technician.Status = "Rejected";

                await db.SaveChangesAsync();

                string userEmail =
                    technician.Login.Email;

                string subject =
                    "EcoCycle Technician Application Rejected";

                string body = $@"
                <html>
                <body>

                    <h2>EcoCycle Technician Application Rejected</h2>

                    <p>
                        Dear {technician.FirstName} {technician.LastName},
                    </p>

                    <p>
                        We regret to inform you that your
                        technician registration request has been
                        <strong>rejected</strong> by the EcoCycle administrator.
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

                await SendEmailAsync(
                    userEmail,
                    subject,
                    body
                );

                return Ok(new
                {
                    message =
                        "Technician rejected successfully and rejection email sent."
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
        public async Task<IActionResult>
            gettechnician()
        {
            try
            {
                var technician =
                    await db.Technician
                        .Include(x => x.Login)
                        .Where(x => x.Status != "Pending")
                        .OrderByDescending(x => x.CreatedAt)
                        .ToListAsync();

                return Ok(technician);
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
            deactivatetechnicain(
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


                var technician =
                    await db.Technician
                        .Include(x => x.Login)
                        .FirstOrDefaultAsync(
                            x => x.TechnicianId == id
                        );


                if (technician == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Technician not found."
                    });
                }


                if (technician.Status != "Active")
                {
                    return BadRequest(new
                    {
                        message =
                            "Only active technicians can be deactivated."
                    });
                }


                if (technician.Login == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Login account not found."
                    });
                }

                technician.Status = "Inactive";

                await db.SaveChangesAsync();


                string userEmail =
                    technician.Login.Email;


                string subject =
                    "EcoCycle Account Deactivated";


                string body = $@"
                <html>
                <body>

                    <h2>EcoCycle Account Deactivated</h2>

                    <p>
                        Dear {technician.FirstName} {technician.LastName},
                    </p>

                    <p>
                        Your EcoCycle technician account has been
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
                        "Technician deactivated successfully and email sent."
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
            activatetechnician(int id)
        {
            try
            {
                var technician =
                    await db.Technician
                        .FirstOrDefaultAsync(
                            x => x.TechnicianId == id
                        );


                if (technician == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Technician not found."
                    });
                }


                if (technician.Status != "Inactive")
                {
                    return BadRequest(new
                    {
                        message =
                            "Technician is already Active."
                    });
                }


                technician.Status = "Active";

                await db.SaveChangesAsync();


                return Ok(new
                {
                    message =
                        "Technician activated successfully."
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
                    ?? User.FindFirst("TechnicianId");

                if (loginIdClaim == null || string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new { message = "User identity not found in token." });
                }

                if (!int.TryParse(loginIdClaim.Value, out int id))
                {
                    return Unauthorized(new { message = "Invalid user identity format." });
                }

                var tech = await db.Technician
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.LoginId == id || x.TechnicianId == id);

                if (tech == null)
                {
                    return NotFound(new { message = "Inspection Technician profile not found." });
                }

                return Ok(new
                {
                    tech.TechnicianId,
                    tech.LoginId,
                    tech.FirstName,
                    tech.LastName,
                    Email = tech.Login?.Email,
                    tech.PhoneNumber,
                    tech.ProfilePhoto,
                    tech.DateOfBirth,
                    tech.Gender,
                    tech.Address,
                    tech.State,
                    tech.District,
                    tech.City,
                    tech.PinCode,
                    tech.InspectionCenterName,
                    tech.EmployeeId,
                    tech.JobTitle,
                    tech.DateOfJoining,
                    tech.ExperienceYears,
                    tech.Specialization,
                    tech.IssuingInstitute,
                    tech.CertificateNumber,
                    tech.CertificateIssueDate,
                    tech.CertificateExpiryDate,
                    tech.GovernmentIdType,
                    tech.GovernmentIdNumber,
                    tech.GovernmentIdFile,
                    tech.EmployeeIdCard,
                    tech.TechnicalCertificate,
                    tech.Resume,
                    tech.Status,
                    tech.CreatedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching technician profile.", error = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromForm] TechnicianUpdateProfileRequest request)
        {
            try
            {
                var loginIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                    ?? User.FindFirst("sub")
                    ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                    ?? User.FindFirst("TechnicianId");

                if (loginIdClaim == null || string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new { message = "User identity not found in token." });
                }

                if (!int.TryParse(loginIdClaim.Value, out int id))
                {
                    return Unauthorized(new { message = "Invalid user identity format." });
                }

                var tech = await db.Technician
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.LoginId == id || x.TechnicianId == id);

                if (tech == null)
                {
                    return NotFound(new { message = "Technician not found." });
                }

                if (!string.IsNullOrWhiteSpace(request.FirstName))
                    tech.FirstName = request.FirstName.Trim();

                if (!string.IsNullOrWhiteSpace(request.LastName))
                    tech.LastName = request.LastName.Trim();

                if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
                    tech.PhoneNumber = request.PhoneNumber.Trim();

                if (request.DateOfBirth.HasValue)
                    tech.DateOfBirth = request.DateOfBirth.Value;

                if (!string.IsNullOrWhiteSpace(request.Gender))
                    tech.Gender = request.Gender.Trim();

                if (!string.IsNullOrWhiteSpace(request.Address))
                    tech.Address = request.Address.Trim();

                if (!string.IsNullOrWhiteSpace(request.City))
                    tech.City = request.City.Trim();

                if (!string.IsNullOrWhiteSpace(request.District))
                    tech.District = request.District.Trim();

                if (!string.IsNullOrWhiteSpace(request.State))
                    tech.State = request.State.Trim();

                if (!string.IsNullOrWhiteSpace(request.PinCode))
                    tech.PinCode = request.PinCode.Trim();

                if (!string.IsNullOrWhiteSpace(request.Specialization))
                    tech.Specialization = request.Specialization.Trim();

                if (request.ExperienceYears.HasValue)
                    tech.ExperienceYears = request.ExperienceYears.Value;

                if (request.ProfilePhoto != null)
                {
                    string? savedPic = await SaveFile(request.ProfilePhoto, "ProfilePhotos");
                    if (!string.IsNullOrEmpty(savedPic))
                    {
                        tech.ProfilePhoto = savedPic;
                    }
                }

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Technician profile updated successfully.",
                    profilePhoto = tech.ProfilePhoto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating technician profile.", error = ex.Message });
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
                    ?? User.FindFirst("TechnicianId");

                if (loginIdClaim == null || string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new { message = "User identity not found in token." });
                }

                if (!int.TryParse(loginIdClaim.Value, out int id))
                {
                    return Unauthorized(new { message = "Invalid user identity format." });
                }

                var tech = await db.Technician
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.LoginId == id || x.TechnicianId == id);

                if (tech == null || tech.Login == null)
                {
                    return NotFound(new { message = "Technician account not found." });
                }

                if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                {
                    return BadRequest(new { message = "Current password is required." });
                }

                var hasher = new PasswordHasher<Login>();
                var result = hasher.VerifyHashedPassword(tech.Login, tech.Login.PasswordHash, request.CurrentPassword);

                if (result == PasswordVerificationResult.Failed)
                {
                    return BadRequest(new { message = "Current password is incorrect. Please try again." });
                }

                return Ok(new { success = true, message = "Current password verified." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangeTechnicianPassword([FromBody] ChangeUserPasswordRequest request)
        {
            try
            {
                var loginIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                    ?? User.FindFirst("sub")
                    ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                    ?? User.FindFirst("TechnicianId");

                if (loginIdClaim == null || string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new { message = "User identity not found in token." });
                }

                if (!int.TryParse(loginIdClaim.Value, out int id))
                {
                    return Unauthorized(new { message = "Invalid user identity format." });
                }

                var tech = await db.Technician
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.LoginId == id || x.TechnicianId == id);

                if (tech == null || tech.Login == null)
                {
                    return NotFound(new { message = "Technician account not found." });
                }

                if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                {
                    return BadRequest(new { message = "Current password is required." });
                }

                var hasher = new PasswordHasher<Login>();
                var verifyResult = hasher.VerifyHashedPassword(tech.Login, tech.Login.PasswordHash, request.CurrentPassword);

                if (verifyResult == PasswordVerificationResult.Failed)
                {
                    return BadRequest(new { message = "Current password is incorrect. Please try again." });
                }

                if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
                {
                    return BadRequest(new { message = "New password must be at least 6 characters." });
                }

                if (request.NewPassword != request.ConfirmPassword)
                {
                    return BadRequest(new { message = "New password and confirmation password do not match." });
                }

                tech.Login.PasswordHash = hasher.HashPassword(tech.Login, request.NewPassword);
                await db.SaveChangesAsync();

                return Ok(new { message = "Password updated successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}