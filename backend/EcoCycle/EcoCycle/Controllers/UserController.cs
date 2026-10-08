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
using System.Security.Claims;

namespace EcoCycle.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext db;
        private readonly IWebHostEnvironment env;

        public UserController(ApplicationDbContext db, IWebHostEnvironment env)
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
                folderName);

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            string fileName = Guid.NewGuid().ToString() +
                              Path.GetExtension(file.FileName);

            string filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                file.CopyTo(stream);
            }

            return fileName;
        }

        [HttpPost("Register")]
        public IActionResult Register(RegisterRequest request)
        {
            using var transaction = db.Database.BeginTransaction();

            try
            {
                // Check if email already exists
                if (db.Login.Any(x => x.Email == request.Email))
                {
                    return BadRequest(new
                    {
                        field = "email_er",
                        message = "Email already registered."
                    });
                }

                // Check if phone already exists
                if (db.Users.Any(x => x.PhoneNumber == request.PhoneNumber))
                {
                    return BadRequest(new
                    {
                        field = "phone_er",
                        message = "Phone number already registered."
                    });
                }

                // Hash Password
                var hasher = new PasswordHasher<Login>();

                // Create Login
                Login login = new Login
                {
                    Email = request.Email,
                    PasswordHash = hasher.HashPassword(null, request.Password),
                    RoleId = request.RoleId,
                    LastLogin = null
                };

                db.Login.Add(login);
                db.SaveChanges();

                // Create User
                User user = new User
                {
                    LoginId = login.LoginId,

                    FirstName = request.FirstName,
                    LastName = request.LastName,

                    PhoneNumber = request.PhoneNumber,

                    Address = request.Address,
                    Pincode = request.Pincode,
                    City = request.City,
                    State = request.State,
                    District=request.District,

                    Gender = request.Gender,
                    DateOfBirth = request.DateOfBirth,

                    CreatedAt = DateTime.Now,
                    Status = "Active"
                };

                db.Users.Add(user);
                db.SaveChanges();

                transaction.Commit();

                return Ok(new
                {
                    message = ""
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

        [HttpGet("alluser")]
        public async Task<IActionResult> getuser()
        {
            var users=await db.Users.Include(x=>x.Login).OrderByDescending(x=>x.CreatedAt).ToListAsync();
            return Ok(users);
        }

        [HttpPost("deactivate/{id}")]
        public async Task<IActionResult> deactivateuser(int id, string reason)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(reason))
                {
                    return BadRequest(new
                    {
                        message = ""
                    });
                }
                var user = await db.Users
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.UserId == id);
                if (user == null)
                {
                    return BadRequest(new
                    {
                        message = ""
                    });
                }
                if (user.Status != "Active")
                {
                    return BadRequest(new
                    {
                        message = ""
                    });
                }
                user.Status = "Inactive";

                await db.SaveChangesAsync();
                string userEmail = user.Login.Email;

                string subject = "EcoCycle Account Deactivated";

                string body = $@"
                <html>
                <body>
                    <h2>EcoCycle Account Deactivated</h2>

                    <p>Dear {user.FirstName} {user.LastName},</p>

                    <p>
                        Your EcoCycle account has been deactivated by the administrator.
                    </p>

                    <p><strong>Reason for deactivation:</strong></p>

                    <p>{reason}</p>

                    <p>
                        If you believe this deactivation was made by mistake,
                        please contact the EcoCycle administration.
                    </p>

                    <br>

                    <p>Regards,</p>
                    <p><strong>EcoCycle Admin Team</strong></p>
                </body>
                </html>
                ";

                using (MailMessage mail = new MailMessage())
                {
                    mail.From = new MailAddress(
                        "YOUR_EMAIL@gmail.com",
                        "EcoCycle Admin"
                    );

                    mail.To.Add(userEmail);

                    mail.Subject = subject;

                    mail.Body = body;

                    mail.IsBodyHtml = true;

                    using (SmtpClient smtp = new SmtpClient("smtp.gmail.com", 587))
                    {
                        smtp.EnableSsl = true;

                        smtp.Credentials = new NetworkCredential(
                            "drogbqdidier7@gmail.com",
                            "gxgy cclr rght awid"
                        );

                        await smtp.SendMailAsync(mail);
                    }
                    return Ok(new
                    {
                        message = ""
                    });
                }
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
        public async Task<IActionResult> activateuser(int id)
        {
            var user = await db.Users.FirstOrDefaultAsync(x => x.UserId == id);
            if (user == null)
            {
                return BadRequest(new
                {
                    message = "user not found"
                });
            }
            if (user.Status != "Inactive")
            {
                return BadRequest(new
                {
                    message = "User is already Active"
                });
            }
            user.Status = "Active";

            await db.SaveChangesAsync();

            return Ok(new
            {
            });
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> ViewUserProfile()
        {
            try
            {
                var loginIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

                if (loginIdClaim == null)
                {
                    return Unauthorized(new
                    {
                        message = "User identity not found."
                    });
                }

                int loginId = int.Parse(loginIdClaim.Value);

                var user = await db.Users
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.LoginId == loginId);

                if (user == null)
                {
                    return NotFound(new
                    {
                        message = "User not found."
                    });
                }

                return Ok(new
                {
                    userId = user.UserId,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    email = user.Login.Email,
                    phoneNumber = user.PhoneNumber,
                    address = user.Address,
                    state = user.State,
                    district = user.District,
                    city = user.City,
                    pincode = user.Pincode,
                    gender = user.Gender,
                    dateOfBirth = user.DateOfBirth,
                    profilePicture = user.ProfileImage,
                    status = user.Status,
                    accountHolder = user.AccountHolder ?? "",
                    bankName = user.BankName ?? "",
                    accountNumber = user.AccountNumber ?? "",
                    ifscCode = user.IFSCCode ?? ""
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
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateUserProfile([FromForm] Userprofileupdate request)
        {
            try
            {
                var loginIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

                if (loginIdClaim == null)
                {
                    return Unauthorized(new
                    {
                        message = "User identity not found."
                    });
                }

                int loginId = int.Parse(loginIdClaim.Value);

                var user = await db.Users
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(x => x.LoginId == loginId);

                if (user == null)
                {
                    return NotFound(new
                    {
                        message = "User not found."
                    });
                }

                bool updatedAny = false;

                // 0. First Name & Last Name update
                if (!string.IsNullOrWhiteSpace(request.FirstName) && request.FirstName != user.FirstName)
                {
                    user.FirstName = request.FirstName.Trim();
                    updatedAny = true;
                }

                if (!string.IsNullOrWhiteSpace(request.LastName) && request.LastName != user.LastName)
                {
                    user.LastName = request.LastName.Trim();
                    updatedAny = true;
                }

                // 1. Email update (only if updated and not empty)
                if (!string.IsNullOrWhiteSpace(request.Email) && request.Email != user.Login.Email)
                {
                    bool emailExists = await db.Login
                        .AnyAsync(x =>
                            x.Email == request.Email &&
                            x.LoginId != loginId);

                    if (emailExists)
                    {
                        return BadRequest(new
                        {
                            field = "email",
                            message = "Email is already registered."
                        });
                    }
                    user.Login.Email = request.Email;
                    updatedAny = true;
                }

                // 2. Phone Number update (only if updated and not empty)
                if (!string.IsNullOrWhiteSpace(request.PhoneNumber) && request.PhoneNumber != user.PhoneNumber)
                {
                    bool phoneExists = await db.Users
                        .AnyAsync(x =>
                            x.PhoneNumber == request.PhoneNumber &&
                            x.LoginId != loginId);

                    if (phoneExists)
                    {
                        return BadRequest(new
                        {
                            field = "phoneNumber",
                            message = "Phone number is already registered."
                        });
                    }
                    user.PhoneNumber = request.PhoneNumber;
                    updatedAny = true;
                }

                // 3. Address update (only if updated and not empty)
                if (!string.IsNullOrWhiteSpace(request.Address) && request.Address != user.Address)
                {
                    user.Address = request.Address;
                    updatedAny = true;
                }

                // 4. Gender update (only if updated and not empty)
                if (!string.IsNullOrWhiteSpace(request.Gender) && request.Gender != user.Gender)
                {
                    user.Gender = request.Gender;
                    updatedAny = true;
                }

                // 5. DateOfBirth update (only if updated and has value)
                if (request.DateOfBirth.HasValue && request.DateOfBirth.Value != user.DateOfBirth)
                {
                    user.DateOfBirth = request.DateOfBirth.Value;
                    updatedAny = true;
                }

                // 6. Profile Picture file upload
                if (request.ProfilePicture != null)
                {
                    string? profileFileName = SaveFile(request.ProfilePicture, "profile");
                    if (profileFileName != null)
                    {
                        user.ProfileImage = profileFileName;
                        updatedAny = true;
                    }
                }

                // 7. Bank Details update
                if (!string.IsNullOrWhiteSpace(request.AccountHolder) && request.AccountHolder != user.AccountHolder)
                {
                    user.AccountHolder = request.AccountHolder.Trim();
                    updatedAny = true;
                }

                if (!string.IsNullOrWhiteSpace(request.BankName) && request.BankName != user.BankName)
                {
                    user.BankName = request.BankName.Trim();
                    updatedAny = true;
                }

                if (!string.IsNullOrWhiteSpace(request.AccountNumber) && request.AccountNumber != user.AccountNumber)
                {
                    user.AccountNumber = request.AccountNumber.Trim();
                    updatedAny = true;
                }

                if (!string.IsNullOrWhiteSpace(request.IFSCCode) && request.IFSCCode != user.IFSCCode)
                {
                    user.IFSCCode = request.IFSCCode.Trim().ToUpper();
                    updatedAny = true;
                }

                if (updatedAny)
                {
                    await db.SaveChangesAsync();
                }

                return Ok(new
                {
                    message = "Profile updated successfully.",
                    profilePicture = user.ProfileImage,
                    accountHolder = user.AccountHolder,
                    bankName = user.BankName,
                    accountNumber = user.AccountNumber,
                    ifscCode = user.IFSCCode
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
        [HttpPost("bank-details")]
        [HttpPut("bank-details")]
        public async Task<IActionResult> UpdateBankDetails([FromBody] UpdateBankDetailsDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var loginIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (loginIdClaim == null)
                {
                    return Unauthorized(new { message = "User identity not found." });
                }

                int loginId = int.Parse(loginIdClaim.Value);
                var user = await db.Users.FirstOrDefaultAsync(x => x.LoginId == loginId);
                if (user == null)
                {
                    return NotFound(new { message = "User record not found." });
                }

                user.AccountHolder = request.AccountHolder.Trim();
                user.BankName = request.BankName.Trim();
                user.AccountNumber = request.AccountNumber.Trim();
                user.IFSCCode = request.IFSCCode.Trim().ToUpper();

                await db.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Bank details updated successfully.",
                    accountHolder = user.AccountHolder,
                    bankName = user.BankName,
                    accountNumber = user.AccountNumber,
                    ifscCode = user.IFSCCode
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("verify-password")]
        public async Task<IActionResult> VerifyCurrentPassword([FromBody] VerifyPasswordRequest request)
        {
            try
            {
                var loginIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (loginIdClaim == null)
                {
                    return Unauthorized(new { message = "User identity not found." });
                }

                int loginId = int.Parse(loginIdClaim.Value);
                var login = await db.Login.FirstOrDefaultAsync(x => x.LoginId == loginId);
                if (login == null)
                {
                    return NotFound(new { message = "User not found." });
                }

                if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                {
                    return BadRequest(new { message = "Current password is required." });
                }

                var hasher = new PasswordHasher<Login>();
                var result = hasher.VerifyHashedPassword(login, login.PasswordHash, request.CurrentPassword);

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
        public async Task<IActionResult> ChangeUserPassword([FromBody] ChangeUserPasswordRequest request)
        {
            try
            {
                var loginIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (loginIdClaim == null)
                {
                    return Unauthorized(new { message = "User identity not found." });
                }

                int loginId = int.Parse(loginIdClaim.Value);
                var login = await db.Login.FirstOrDefaultAsync(x => x.LoginId == loginId);
                if (login == null)
                {
                    return NotFound(new { message = "User not found." });
                }

                if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                {
                    return BadRequest(new { message = "Current password is required." });
                }

                var hasher = new PasswordHasher<Login>();
                var verifyResult = hasher.VerifyHashedPassword(login, login.PasswordHash, request.CurrentPassword);

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

                login.PasswordHash = hasher.HashPassword(login, request.NewPassword);
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

