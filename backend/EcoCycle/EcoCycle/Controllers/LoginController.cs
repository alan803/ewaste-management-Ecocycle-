using EcoCycle.API.Data;
using EcoCycle.API.DTOs;
using Microsoft.AspNetCore.Identity;
using EcoCycle.API.Models;
using EcoCycle.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;

namespace EcoCycle.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly ApplicationDbContext db;
        private readonly EmailService emailService;
        private readonly IConfiguration configuration;
        public LoginController(
            ApplicationDbContext db,
            EmailService emailService,
            IConfiguration configuration)
        {
            this.db = db;
            this.emailService = emailService;
            this.configuration = configuration;
        }

        // =========================================================
        // LOGIN
        // =========================================================

        [HttpPost("Login")]
        public IActionResult Login(EcoCycle.API.DTOs.LoginRequest request)
        {
            var login = db.Login
                          .Include(x => x.Role)
                          .FirstOrDefault(x => x.Email == request.Email);
            
            if (login == null)
            {
                return BadRequest(new
                {
                    field = "email_er",
                    message = "Email not registered."
                });
            }
            if (login == null)
            {
                return BadRequest(new
                {
                    field = "email_er",
                    message = "Email not registered."
                });
            }

            var hasher = new PasswordHasher<Login>();

            var result = hasher.VerifyHashedPassword(
                login,
                login.PasswordHash,
                request.Password
            );

            if (result == PasswordVerificationResult.Failed)
            {
                return BadRequest(new
                {
                    field = "password_er",
                    message = "Incorrect password."
                });
            }

            login.LastLogin = DateTime.Now;
            db.SaveChanges();

            string firstName = "";
            string roleName = login.Role.Name;
            string status = "";

            switch (login.RoleId)
            {
                case 1:

                    var user = db.Users
                                 .FirstOrDefault(x => x.LoginId == login.LoginId);

                    if (user == null)
                    {
                        return BadRequest(new
                        {
                            message = "User not found."
                        });
                    }

                    firstName = user.FirstName;
                    status = user.Status;
                    break;


                case 2:

                    var agent = db.CollectionAgents
                                  .FirstOrDefault(x => x.LoginId == login.LoginId);

                    if (agent == null)
                    {
                        return BadRequest(new
                        {
                            message = "Collection Agent not found."
                        });
                    }

                    firstName = agent.FirstName;
                    status = agent.Status;

                    break;

                case 3:

                    var technician = db.Technician
                                       .FirstOrDefault(x => x.LoginId == login.LoginId);

                    if (technician == null)
                    {
                        return BadRequest(new
                        {
                            message = "Technician not found."
                        });
                    }

                    firstName = technician.FirstName;
                    status = technician.Status;
                    break;


                case 4:

                    var refurbishmentcenter = db.RefurbishmentCenter
                                               .FirstOrDefault(
                                                   x => x.LoginId == login.LoginId
                                               );

                    if (refurbishmentcenter == null)
                    {
                        return BadRequest(new
                        {
                            message = "Refurbishment center not found."
                        });
                    }

                    firstName = refurbishmentcenter.CenterName;
                    status = refurbishmentcenter.Status;
                    break;


                case 5:

                    var recyclingcenter = db.RecyclingCenter
                                            .FirstOrDefault(
                                                x => x.LoginId == login.LoginId
                                            );

                    if (recyclingcenter == null)
                    {
                        return BadRequest(new
                        {
                            message = "Recycling center not found."
                        });
                    }

                    firstName = recyclingcenter.CenterName;
                    status = recyclingcenter.Status;
                    break;


                case 6:

                    var admin = db.Login
                                  .FirstOrDefault(
                                      x => x.LoginId == login.LoginId
                                  );

                    if (admin == null)
                    {
                        return BadRequest(new
                        {
                            message = "Admin not found."
                        });
                    }

                    firstName = "ecocycle admin";
                    break;


                default:

                    return BadRequest(new
                    {
                        message = "Invalid Role."
                    });
            }
            if (login.RoleId != 6)
            {
                if (string.IsNullOrWhiteSpace(status))
                {
                    return BadRequest(new
                    {
                        field = "status_er",
                        message = "Account status is not available."
                    });
                }

                if (!status.Trim().Equals("Active", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        field = "status_er",
                        message = $"Your account is currently {status}. Please contact the administrator.",
                        status = status,
                        loginId = login.LoginId,
                        roleId = login.RoleId
                    });
                }
            }
            var claims = new[]
            {
                new Claim(
                    JwtRegisteredClaimNames.Sub,
                    login.LoginId.ToString()
                ),

                new Claim(
                    JwtRegisteredClaimNames.Email,
                    login.Email
                ),

                new Claim(
                    ClaimTypes.Name,
                    firstName
                ),

                new Claim(
                    ClaimTypes.Role,
                    roleName
                )
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    "ThisIsMySuperSecretJWTKeyForEcoCycle2026!"
                )
            );

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: credentials
            );

            string jwt =
                new JwtSecurityTokenHandler().WriteToken(token);

            int? resolvedTechId = null;
            if (login.RoleId == 3)
            {
                var techObj = db.Technician.FirstOrDefault(x => x.LoginId == login.LoginId);
                if (techObj != null) resolvedTechId = techObj.TechnicianId;
            }

            return Ok(new
            {
                message = "Login Successful",
                token = jwt,
                loginId = login.LoginId,
                technicianId = resolvedTechId,
                roleId = login.RoleId,
                role = roleName,
                firstName = firstName
            });
        }
        [HttpPost("ForgotPassword")]
        public async Task<IActionResult> ForgotPassword(
    [FromBody] EcoCycle.API.DTOs.ForgotPasswordRequest request)
        {
            var login = db.Login
                          .FirstOrDefault(x => x.Email == request.Email);

            if (login == null)
            {
                return BadRequest(new
                {
                    field = "email_er",
                    message = "Email not registered."
                });
            }

            string otp = Random.Shared
                .Next(100000, 1000000)
                .ToString();

            login.PasswordResetToken = otp;
            login.PasswordResetTokenExpiry = DateTime.Now.AddMinutes(1);

            db.SaveChanges();

            await emailService.SendOtpEmail(
                request.Email,
                otp
            );

            return Ok(new
            {
                message = "OTP sent successfully."
            });
        }
        [HttpPost("VerifyOtp")]
        public IActionResult VerifyOtp(
            [FromBody] EcoCycle.API.DTOs.VerifyOtpRequest request)
        {
            var login = db.Login
                          .FirstOrDefault(x => x.Email == request.Email);

            if (login == null)
            {
                return BadRequest(new
                {
                    field = "email_er",
                    message = "Email not registered."
                });
            }

            if (login.PasswordResetToken != request.Otp)
            {
                return BadRequest(new
                {
                    field = "otp_er",
                    message = "Invalid OTP."
                });
            }

            if (login.PasswordResetTokenExpiry == null ||
                login.PasswordResetTokenExpiry < DateTime.Now)
            {
                return BadRequest(new
                {
                    field = "otp_er",
                    message = "OTP has expired. Please request a new OTP."
                });
            }

            return Ok(new
            {
                message = "OTP verified successfully."
            });
        }
        [HttpPost("ResetPassword")]
        public IActionResult ResetPassword(
            [FromBody] EcoCycle.API.DTOs.ResetPasswordRequest request)
        {
            var login = db.Login
                          .FirstOrDefault(
                              x => x.Email == request.Email
                          );

            if (login == null)
            {
                return BadRequest(new
                {
                    field = "email_er",
                    message = "Email not registered."
                });
            }
            if (login.PasswordResetToken != request.Otp)
            {
                return BadRequest(new
                {
                    field = "otp_er",
                    message = "Invalid OTP."
                });
            }
            if (login.PasswordResetTokenExpiry == null ||
                login.PasswordResetTokenExpiry < DateTime.Now)
            {
                return BadRequest(new
                {
                    field = "otp_er",
                    message = "OTP has expired. Please request a new OTP."
                });
            }

            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new
                {
                    field = "password_er",
                    message = "Password is required."
                });
            }

            if (request.NewPassword != request.ConfirmPassword)
            {
                return BadRequest(new
                {
                    field = "confirmPassword_er",
                    message = "Passwords do not match."
                });
            }

            var hasher = new PasswordHasher<Login>();

            login.PasswordHash =
                hasher.HashPassword(
                    login,
                    request.NewPassword
                );

            login.PasswordResetToken = null;
            login.PasswordResetTokenExpiry = null;

            db.SaveChanges();

            return Ok(new
            {
                message = "Password reset successfully."
            });
        }
        [HttpGet("alluser")]
        public async Task<IActionResult> getuser()
        {
            var users = await db.Login.ToListAsync();
            return Ok(users);
        }
        [HttpPost("GoogleLogin")]
        public async Task<IActionResult> GoogleLogin(
    [FromBody] GoogleLoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Credential))
            {
                return BadRequest(new
                {
                    message = "Google credential is required."
                });
            }

            try
            {
                // Get Google Client ID from appsettings.json
                var clientId = configuration["Google:ClientId"];

                if (string.IsNullOrWhiteSpace(clientId))
                {
                    return StatusCode(500, new
                    {
                        message = "Google Client ID is not configured."
                    });
                }

                // Verify Google ID token
                var payload = await GoogleJsonWebSignature.ValidateAsync(
                    request.Credential,
                    new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = new[] { clientId }
                    }
                );

                // Get email from Google
                var googleEmail = payload.Email;

                if (string.IsNullOrWhiteSpace(googleEmail))
                {
                    return Unauthorized(new
                    {
                        message = "Google account email could not be obtained."
                    });
                }

                // Find existing EcoCycle account
                var login = await db.Login
                    .Include(x => x.Role)
                    .FirstOrDefaultAsync(
                        x => x.Email == googleEmail
                    );

                // Do NOT create a new account
                if (login == null)
                {
                    return Unauthorized(new
                    {
                        field = "google",
                        message = "This Google account is not registered with EcoCycle. Please register first."
                    });
                }

                // Link Google account if not already linked
                if (string.IsNullOrWhiteSpace(login.GoogleId))
                {
                    login.GoogleId = payload.Subject;
                }
                else if (login.GoogleId != payload.Subject)
                {
                    return Unauthorized(new
                    {
                        field = "google",
                        message = "This Google account is not linked to this EcoCycle account."
                    });
                }

                login.LastLogin = DateTime.Now;

                string firstName = "";
                string roleName = login.Role.Name;
                string status = "";

                // Get role-specific information
                switch (login.RoleId)
                {
                    case 1:

                        var user = await db.Users
                            .FirstOrDefaultAsync(
                                x => x.LoginId == login.LoginId
                            );

                        if (user == null)
                        {
                            return BadRequest(new
                            {
                                message = "User not found."
                            });
                        }

                        firstName = user.FirstName;
                        status = user.Status;

                        break;


                    case 2:

                        var agent = await db.CollectionAgents
                            .FirstOrDefaultAsync(
                                x => x.LoginId == login.LoginId
                            );

                        if (agent == null)
                        {
                            return BadRequest(new
                            {
                                message = "Collection Agent not found."
                            });
                        }

                        firstName = agent.FirstName;
                        status = agent.Status;

                        break;


                    case 3:

                        var technician = await db.Technician
                            .FirstOrDefaultAsync(
                                x => x.LoginId == login.LoginId
                            );

                        if (technician == null)
                        {
                            return BadRequest(new
                            {
                                message = "Technician not found."
                            });
                        }

                        firstName = technician.FirstName;
                        status = technician.Status;

                        break;


                    case 4:

                        var refurbishmentcenter = await db.RefurbishmentCenter
                            .FirstOrDefaultAsync(
                                x => x.LoginId == login.LoginId
                            );

                        if (refurbishmentcenter == null)
                        {
                            return BadRequest(new
                            {
                                message = "Refurbishment center not found."
                            });
                        }

                        firstName = refurbishmentcenter.CenterName;
                        status = refurbishmentcenter.Status;

                        break;


                    case 5:

                        var recyclingcenter = await db.RecyclingCenter
                            .FirstOrDefaultAsync(
                                x => x.LoginId == login.LoginId
                            );

                        if (recyclingcenter == null)
                        {
                            return BadRequest(new
                            {
                                message = "Recycling center not found."
                            });
                        }

                        firstName = recyclingcenter.CenterName;
                        status = recyclingcenter.Status;

                        break;


                    case 6:

                        firstName = "ecocycle admin";

                        break;


                    default:

                        return BadRequest(new
                        {
                            message = "Invalid Role."
                        });
                }

                // Check account status
                if (login.RoleId != 6)
                {
                    if (string.IsNullOrWhiteSpace(status))
                    {
                        return BadRequest(new
                        {
                            field = "status_er",
                            message = "Account status is not available."
                        });
                    }

                    if (!status.Trim().Equals(
                        "Active",
                        StringComparison.OrdinalIgnoreCase))
                    {
                        return BadRequest(new
                        {
                            field = "status_er",
                            message =
                                $"Your account is currently {status}. Please contact the administrator.",
                            status = status,
                            loginId = login.LoginId,
                            roleId = login.RoleId
                        });
                    }
                }

                // Generate the same JWT used by normal login
                var claims = new[]
                {
            new Claim(
                JwtRegisteredClaimNames.Sub,
                login.LoginId.ToString()
            ),

            new Claim(
                JwtRegisteredClaimNames.Email,
                login.Email
            ),

            new Claim(
                ClaimTypes.Name,
                firstName
            ),

            new Claim(
                ClaimTypes.Role,
                roleName
            )
        };

                var key = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(
                        "ThisIsMySuperSecretJWTKeyForEcoCycle2026!"
                    )
                );

                var credentials = new SigningCredentials(
                    key,
                    SecurityAlgorithms.HmacSha256
                );

                var token = new JwtSecurityToken(
                    claims: claims,
                    expires: DateTime.Now.AddHours(2),
                    signingCredentials: credentials
                );

                string jwt =
                    new JwtSecurityTokenHandler().WriteToken(token);

                int? resolvedTechId = null;

                if (login.RoleId == 3)
                {
                    var techObj = await db.Technician
                        .FirstOrDefaultAsync(
                            x => x.LoginId == login.LoginId
                        );

                    if (techObj != null)
                    {
                        resolvedTechId = techObj.TechnicianId;
                    }
                }

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Google Login Successful",
                    token = jwt,
                    loginId = login.LoginId,
                    technicianId = resolvedTechId,
                    roleId = login.RoleId,
                    role = roleName,
                    firstName = firstName
                });
            }
            catch (InvalidJwtException)
            {
                return Unauthorized(new
                {
                    field = "google",
                    message = "Invalid Google login."
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    message = "An error occurred during Google login."
                });
            }
        }
    }
}