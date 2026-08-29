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
    public class CollectionAgentController : ControllerBase
    {
        private readonly ApplicationDbContext db;
        private readonly IWebHostEnvironment env;

        public CollectionAgentController(
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
                        "EcoCycle Admin");

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
                            "rksd acks ucgc yiiy");

                        smtp.DeliveryMethod = SmtpDeliveryMethod.Network;

                        await smtp.SendMailAsync(mail);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[Email Notice] Failed to send email to {recipientEmail}: {ex.Message}");
            }
        }

        // ============================================================
        // REGISTER COLLECTION AGENT
        // ============================================================

        [HttpPost("Register")]
        public IActionResult Register(
            [FromForm] CollectionAgentRegisterRequest request)
        {
            string? profilePicture =
                SaveFile(request.ProfilePicture, "profile");

            string? aadhaarProof =
                SaveFile(request.AdhaarProof, "aadhaar");

            string? vehicleInsurance =
                SaveFile(request.VehicleInsurance, "insurance");

            string? vehiclePollution =
                SaveFile(request.VehiclePollution, "pollution");

            string? vehiclePhoto =
                SaveFile(request.VehiclePhoto, "vehicle");

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

                if (db.CollectionAgents.Any(x =>
                    x.Phone == request.Phone))
                {
                    return BadRequest(new
                    {
                        field = "phone_er",
                        message = "Phone number already registered."
                    });
                }

                if (!string.IsNullOrWhiteSpace(request.AlternatePhone)
                    && request.Phone == request.AlternatePhone)
                {
                    return BadRequest(new
                    {
                        field = "alternate_phone_er",
                        message =
                            "Alternate phone cannot be the same as the primary phone."
                    });
                }

                if (!string.IsNullOrWhiteSpace(request.AlternatePhone))
                {
                    if (db.CollectionAgents.Any(x =>
                        x.Phone == request.AlternatePhone ||
                        x.AlternatePhone == request.AlternatePhone))
                    {
                        return BadRequest(new
                        {
                            field = "alternate_phone_er",
                            message =
                                "Alternate phone number already registered."
                        });
                    }
                }

                var hasher = new PasswordHasher<Login>();

                Login login = new Login
                {
                    Email = request.Email,
                    PasswordHash =
                        hasher.HashPassword(null, request.Password),
                    RoleId = 2,
                    LastLogin = null
                };

                db.Login.Add(login);
                db.SaveChanges();

                CollectionAgent agent = new CollectionAgent
                {
                    LoginId = login.LoginId,

                    FirstName = request.FirstName,
                    LastName = request.LastName,

                    ProfilePicture = profilePicture,
                    AdhaarProof = aadhaarProof,
                    VehicleInsurance = vehicleInsurance,
                    VehiclePollution = vehiclePollution,
                    VehiclePhoto = vehiclePhoto,

                    Phone = request.Phone,
                    AlternatePhone = request.AlternatePhone,

                    DOB = request.DOB,
                    Gender = request.Gender,

                    AdhaarNumber = request.AdhaarNumber,

                    Address = request.Address,
                    State = request.State,
                    District = request.District,
                    City = request.City,
                    Pincode = request.Pincode,

                    VehicleType = request.VehicleType,
                    VehicleNumber = request.VehicleNumber,

                    LicenseNumber = request.LicenseNumber,

                    AccountHolder = request.AccountHolder,
                    BankName = request.BankName,
                    AccountNumber = request.AccountNumber,
                    IFSCCode = request.IFSCCode,

                    CreatedAt = DateTime.Now,
                    Status = "Pending"
                };

                db.CollectionAgents.Add(agent);
                db.SaveChanges();

                transaction.Commit();

                return Ok(new
                {
                    message =
                        "Collection Agent Registered Successfully"
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

        // ============================================================
        // GET PENDING AGENTS
        // ============================================================

        [HttpGet("Pending")]
        public async Task<IActionResult> Getpendingagents()
        {
            var agents = await db.CollectionAgents
                .Include(x => x.Login)
                .Where(x => x.Status == "Pending")
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(agents);
        }

        // ============================================================
        // GET ALL AGENTS
        // ============================================================

        [HttpGet("All")]
        public async Task<IActionResult> GetAllAgentsList()
        {
            var agents = await db.CollectionAgents
                .Include(x => x.Login)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(agents);
        }

        // ============================================================
        // GET AGENT BY ID
        // ============================================================

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAgentById(int id)
        {
            var agent = await db.CollectionAgents
                .Include(x => x.Login)
                .FirstOrDefaultAsync(
                    x => x.CollectionAgentId == id);

            if (agent == null)
            {
                return NotFound(new
                {
                    message = "Collection Agent not found"
                });
            }

            return Ok(agent);
        }

        // ============================================================
        // ACCEPT AGENT
        // ============================================================

        [HttpPost("Accept/{id}")]
        public async Task<IActionResult> Activateagent(int id)
        {
            try
            {
                var agent = await db.CollectionAgents
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(
                        x => x.CollectionAgentId == id);

                if (agent == null)
                {
                    return NotFound(new
                    {
                        message = "Collection Agent not found."
                    });
                }

                if (agent.Status != "Pending")
                {
                    return BadRequest(new
                    {
                        message =
                            "This request has already been processed."
                    });
                }

                if (agent.Login == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Login account not found for this collection agent."
                    });
                }

                agent.Status = "Active";

                await db.SaveChangesAsync();

                string userEmail = agent.Login.Email;

                string subject =
                    "EcoCycle Collection Agent Application Approved";

                string body = $@"
<html>
<body>

<h2>EcoCycle Collection Agent Application Approved</h2>

<p>Dear {agent.FirstName} {agent.LastName},</p>

<p>
We are pleased to inform you that your
collection agent registration has been
<strong>approved</strong> by the EcoCycle administrator.
</p>

<p>Your EcoCycle collection agent account is now active.</p>

<p><strong>Account Status:</strong> Active</p>

<p>
You can now log in to the EcoCycle platform
and access your account.
</p>

<br>

<p>Thank you for joining EcoCycle.</p>

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
                        "Collection Agent accepted successfully and approval email sent."
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

        // ============================================================
        // REJECT AGENT
        // ============================================================

        [HttpPost("Reject/{id}")]
        public async Task<IActionResult> RejectAgent(
            int id,
            string? reason)
        {
            try
            {
                var agent = await db.CollectionAgents
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(
                        x => x.CollectionAgentId == id);

                if (agent == null)
                {
                    return NotFound(new
                    {
                        message = "Collection Agent not found."
                    });
                }

                if (agent.Status != "Pending")
                {
                    return BadRequest(new
                    {
                        message =
                            "This request has already been processed."
                    });
                }

                if (agent.Login == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Login account not found for this collection agent."
                    });
                }

                if (string.IsNullOrWhiteSpace(reason))
                {
                    reason =
                        "Your collection agent registration request did not meet the requirements of EcoCycle.";
                }

                agent.Status = "Rejected";

                await db.SaveChangesAsync();

                string userEmail = agent.Login.Email;

                string subject =
                    "EcoCycle Collection Agent Application Rejected";

                string body = $@"
<html>
<body>

<h2>EcoCycle Collection Agent Application Rejected</h2>

<p>Dear {agent.FirstName} {agent.LastName},</p>

<p>
We regret to inform you that your
collection agent registration request has been
<strong>rejected</strong> by the EcoCycle administrator.
</p>

<p><strong>Reason for rejection:</strong></p>

<p>{reason}</p>

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
                        "Collection Agent rejected successfully and rejection email sent."
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

        // ============================================================
        // GET ALL NON-PENDING AGENTS
        // ============================================================

        [HttpGet("alluser")]
        public async Task<IActionResult> getuser()
        {
            try
            {
                var collectionagent = await db.CollectionAgents
                    .Include(x => x.Login)
                    .Where(x => x.Status != "Pending")
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();

                return Ok(collectionagent);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        // ============================================================
        // DEACTIVATE COLLECTION AGENT
        // ============================================================

        [HttpPost("deactivate/{id}")]
        public async Task<IActionResult> deactivatecollectionagent(
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

                var collectionagent =
                    await db.CollectionAgents
                        .Include(x => x.Login)
                        .FirstOrDefaultAsync(
                            x => x.CollectionAgentId == id);

                if (collectionagent == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Collection Agent not found."
                    });
                }

                if (collectionagent.Status != "Active")
                {
                    return BadRequest(new
                    {
                        message =
                            "Only active collection agents can be deactivated."
                    });
                }

                if (collectionagent.Login == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Login account not found."
                    });
                }

                collectionagent.Status = "Inactive";

                await db.SaveChangesAsync();

                string userEmail =
                    collectionagent.Login.Email;

                string subject =
                    "EcoCycle Account Deactivated";

                string body = $@"
<html>
<body>

<h2>EcoCycle Account Deactivated</h2>

<p>
Dear {collectionagent.FirstName}
{collectionagent.LastName},
</p>

<p>
Your EcoCycle collection agent account has been
<strong>deactivated</strong> by the administrator.
</p>

<p><strong>Reason for deactivation:</strong></p>

<p>{reason}</p>

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
                        "Collection Agent deactivated successfully and email sent."
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

        // ============================================================
        // ACTIVATE COLLECTION AGENT
        // ============================================================

        [HttpPost("activate/{id}")]
        public async Task<IActionResult> activatecollectionagent(
            int id)
        {
            try
            {
                var collectionagent =
                    await db.CollectionAgents
                        .FirstOrDefaultAsync(
                            x => x.CollectionAgentId == id);

                if (collectionagent == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Collection Agent not found."
                    });
                }

                if (collectionagent.Status != "Inactive")
                {
                    return BadRequest(new
                    {
                        message =
                            "Collection Agent is already Active."
                    });
                }

                collectionagent.Status = "Active";

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message =
                        "Collection Agent activated successfully."
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

        // ============================================================
        // GET MY PROFILE
        // ============================================================

        [Authorize]
        [HttpGet("myprofile")]
        public async Task<IActionResult> getmyrprofile()
        {
            try
            {
                var loginIdClaim =
                    User.FindFirst(
                        System.Security.Claims.ClaimTypes.NameIdentifier)
                    ?? User.FindFirst("sub")
                    ?? User.FindFirst(
                        System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                    ?? User.FindFirst("CollectionAgentId");

                if (loginIdClaim == null ||
                    string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new
                    {
                        message =
                            "User identity claim not found in token."
                    });
                }

                if (!int.TryParse(
                    loginIdClaim.Value,
                    out int id))
                {
                    return Unauthorized(new
                    {
                        message =
                            "Invalid user identity format."
                    });
                }

                var agent = await db.CollectionAgents
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(
                        x => x.LoginId == id ||
                             x.CollectionAgentId == id);

                if (agent == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Collection Agent not found."
                    });
                }

                return Ok(new
                {
                    Email = agent.Login?.Email,
                    Name =
                        agent.FirstName + " " + agent.LastName,
                    FirstName = agent.FirstName,
                    LastName = agent.LastName,
                    Phone = agent.Phone,
                    Alternate_phone = agent.AlternatePhone,
                    Profilepicture = agent.ProfilePicture,
                    dob = agent.DOB.ToString("yyyy-MM-dd"),
                    gender = agent.Gender,
                    adharnumber = agent.AdhaarNumber,
                    adharproof = agent.AdhaarProof,
                    address = agent.Address,
                    state = agent.State,
                    district = agent.District,
                    city = agent.City,
                    pincode = agent.Pincode,
                    vehicletype = agent.VehicleType,
                    vehicleno = agent.VehicleNumber,
                    vehicelpollution = agent.VehiclePollution,
                    vehicleinsurance = agent.VehicleInsurance,
                    vehiclephoto = agent.VehiclePhoto,
                    licensenumber = agent.LicenseNumber,
                    accoundholder = agent.AccountHolder,
                    bankname = agent.BankName,
                    account_no = agent.AccountNumber,
                    ifsc_code = agent.IFSCCode,
                    CollectionAgentId =
                        agent.CollectionAgentId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message =
                        "Error retrieving collection agent profile.",
                    error = ex.Message
                });
            }
        }

        // ============================================================
        // SEND ASSIGNMENT EMAIL
        // ============================================================

        [HttpPost("send-assignment-email/{agentId}/{deviceId}")]
        public async Task<IActionResult> SendAssignmentEmail(
            int agentId,
            int deviceId)
        {
            try
            {
                // ----------------------------------------------------
                // FIND COLLECTION AGENT
                // ----------------------------------------------------

                var agent = await db.CollectionAgents
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(
                        x => x.CollectionAgentId == agentId);

                if (agent == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Collection Agent not found."
                    });
                }

                if (agent.Login == null ||
                    string.IsNullOrWhiteSpace(agent.Login.Email))
                {
                    return BadRequest(new
                    {
                        message =
                            "Login email not found for this collection agent."
                    });
                }

                // ----------------------------------------------------
                // FIND DEVICE
                // ----------------------------------------------------

                var device = await db.Device
                    .Include(d => d.Category)
                    .Include(d => d.User)
                    .FirstOrDefaultAsync(
                        d => d.DeviceId == deviceId);

                if (device == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Device not found."
                    });
                }

                // ----------------------------------------------------
                // AGENT EMAIL
                // ----------------------------------------------------

                string agentEmail = agent.Login.Email;

                // ----------------------------------------------------
                // GET TECHNICIAN / INSPECTION CENTER
                // ----------------------------------------------------

                var inspReq = await db.InspectionRequest
                    .Include(ir => ir.Technician)
                    .Where(ir =>
                        ir.DeviceId == deviceId &&
                        ir.Technician != null)
                    .OrderByDescending(ir => ir.CreatedAt)
                    .FirstOrDefaultAsync();

                var tech = inspReq?.Technician;

                if (tech == null)
                {
                    tech = await db.Technician
                        .Where(t =>
                            t.Status == "Approved" ||
                            t.Status == "Active")
                        .OrderBy(t => t.TechnicianId)
                        .FirstOrDefaultAsync();

                    if (tech == null)
                    {
                        tech = await db.Technician
                            .OrderBy(t => t.TechnicianId)
                            .FirstOrDefaultAsync();
                    }
                }

                // ----------------------------------------------------
                // TECHNICIAN DETAILS
                // ----------------------------------------------------

                string tName =
                    tech != null
                        ? $"{tech.FirstName} {tech.LastName}".Trim()
                        : "Inspection Technician";

                string tPhone =
                    tech?.PhoneNumber ?? "";

                string cName =
                    tech?.InspectionCenterName
                    ?? "EcoCycle Central Inspection Center";

                // ----------------------------------------------------
                // TECHNICIAN / CENTER ADDRESS
                // ----------------------------------------------------

                var tParts = new List<string>();

                if (tech != null)
                {
                    if (!string.IsNullOrWhiteSpace(
                        tech.InspectionCenterName))
                    {
                        tParts.Add(
                            tech.InspectionCenterName);
                    }

                    if (!string.IsNullOrWhiteSpace(
                        tech.Address))
                    {
                        tParts.Add(tech.Address);
                    }

                    if (!string.IsNullOrWhiteSpace(
                        tech.City))
                    {
                        tParts.Add(tech.City);
                    }

                    if (!string.IsNullOrWhiteSpace(
                        tech.District))
                    {
                        tParts.Add(tech.District);
                    }

                    if (!string.IsNullOrWhiteSpace(
                        tech.State))
                    {
                        tParts.Add(tech.State);
                    }

                    if (!string.IsNullOrWhiteSpace(
                        tech.PinCode))
                    {
                        tParts.Add(tech.PinCode);
                    }
                }

                string delAddress =
                    tParts.Any()
                        ? string.Join(", ", tParts)
                        : "EcoCycle Central E-Waste Facility & Inspection Hub";

                // ----------------------------------------------------
                // CUSTOMER PICKUP ADDRESS
                // ----------------------------------------------------

                string fullAddress =
                    device.Address +
                    (string.IsNullOrWhiteSpace(
                        device.User?.City)
                        ? ""
                        : $", {device.User?.City}") +
                    (string.IsNullOrWhiteSpace(
                        device.User?.District)
                        ? ""
                        : $", {device.User?.District}") +
                    (string.IsNullOrWhiteSpace(
                        device.User?.State)
                        ? ""
                        : $", {device.User?.State}") +
                    (string.IsNullOrWhiteSpace(
                        device.User?.Pincode)
                        ? ""
                        : $" - {device.User?.Pincode}");

                // ----------------------------------------------------
                // EMAIL
                // ----------------------------------------------------

                string subject =
                    "EcoCycle - New Collection Pickup Request Assigned";

                string body = $@"
<!DOCTYPE html>
<html>
<body style=""font-family: Arial, sans-serif;
             background-color: #f8fafc;
             padding: 20px;
             color: #0f172a;"">

    <div style=""max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 24px;"">

        <h2 style=""color: #059669; margin-top: 0;"">
            EcoCycle Pickup Assignment
        </h2>

        <p>
            Dear
            <strong>
                {agent.FirstName} {agent.LastName}
            </strong>,
        </p>

        <p>
            A new e-waste collection pickup request for
            <strong>
                {device.Brand} {device.Model}
            </strong>
            has been assigned to you.
        </p>

        <!-- COLLECT FROM -->

        <div style=""background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    padding: 16px;
                    border-radius: 10px;
                    margin-top: 16px;"">

            <div style=""font-size: 11px;
                        font-weight: 800;
                        color: #047857;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;"">
                COLLECT FROM
            </div>

            <div style=""font-weight: 700;
                        color: #065f46;
                        font-size: 15px;
                        margin-top: 4px;"">

                Customer:
                {device.User?.FirstName}
                {device.User?.LastName}

                (Ph:
                {device.User?.PhoneNumber})
            </div>

            <div style=""color: #047857;
                        font-size: 14px;
                        margin-top: 4px;"">

                <strong>
                    Customer pickup address:
                </strong>

                {fullAddress}
            </div>

            <div style=""color: #059669;
                        font-size: 13px;
                        margin-top: 4px;"">

                <strong>
                    Pickup date / time slot:
                </strong>

                {device.PickupDate:dd-MM-yyyy}
                •
                {device.TimeSlot}

            </div>

        </div>

        <!-- ARROW -->

        <div style=""text-align: center;
                    font-size: 24px;
                    font-weight: bold;
                    color: #059669;
                    margin: 10px 0;"">

            ↓

        </div>

        <!-- DELIVER TO -->

        <div style=""background: #eff6ff;
                    border: 1px solid #bfdbfe;
                    padding: 16px;
                    border-radius: 10px;"">

            <div style=""font-size: 11px;
                        font-weight: 800;
                        color: #1d4ed8;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;"">

                DELIVER TO

            </div>

            <div style=""font-weight: 700;
                        color: #1e40af;
                        font-size: 15px;
                        margin-top: 4px;"">

                Technician / Inspection Center:
                {tName}
                ({cName})

                {(string.IsNullOrEmpty(tPhone)
                    ? ""
                    : $"• Ph: {tPhone}")}

            </div>

            <div style=""color: #1e3a8a;
                        font-size: 14px;
                        margin-top: 4px;"">

                <strong>
                    Technician/center address:
                </strong>

                {delAddress}

            </div>

        </div>

        <!-- START PICKUP BUTTON -->

        <div style=""margin-top: 24px;
                    text-align: center;"">

            <a href=""https://localhost:7102""
               style=""background: #059669;
                      color: #ffffff;
                      text-decoration: none;
                      padding: 12px 24px;
                      font-weight: bold;
                      border-radius: 8px;
                      display: inline-block;"">

                [ Start Pickup ]

            </a>

        </div>

        <p style=""margin-top: 24px;
                  font-size: 12px;
                  color: #64748b;"">

            Regards,<br/>
            <strong>
                EcoCycle Admin Team
            </strong>

        </p>

    </div>

</body>
</html>";

                // ----------------------------------------------------
                // SEND EMAIL
                // ----------------------------------------------------

                await SendEmailAsync(
                    agentEmail,
                    subject,
                    body);

                // ----------------------------------------------------
                // SUCCESS RESPONSE
                // ----------------------------------------------------

                return Ok(new
                {
                    message =
                        "Assignment email sent to collection agent successfully."
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

        // ============================================================
        // UPDATE PROFILE
        // ============================================================

        [Authorize]
        [HttpPost("update-profile")]
        public async Task<IActionResult> UpdateProfile(
            [FromForm] CollectionAgentUpdateProfileRequest request)
        {
            try
            {
                var loginIdClaim =
                    User.FindFirst(
                        System.Security.Claims.ClaimTypes.NameIdentifier)
                    ?? User.FindFirst("sub")
                    ?? User.FindFirst(
                        System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                    ?? User.FindFirst("CollectionAgentId");

                if (loginIdClaim == null ||
                    string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new
                    {
                        message =
                            "User identity not found in token."
                    });
                }

                if (!int.TryParse(
                    loginIdClaim.Value,
                    out int id))
                {
                    return Unauthorized(new
                    {
                        message =
                            "Invalid user identity format."
                    });
                }

                var agent = await db.CollectionAgents
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(
                        x => x.LoginId == id ||
                             x.CollectionAgentId == id);

                if (agent == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Collection Agent not found."
                    });
                }

                if (!string.IsNullOrWhiteSpace(
                    request.FirstName))
                {
                    agent.FirstName =
                        request.FirstName.Trim();
                }

                if (!string.IsNullOrWhiteSpace(
                    request.LastName))
                {
                    agent.LastName =
                        request.LastName.Trim();
                }

                if (!string.IsNullOrWhiteSpace(
                    request.Phone))
                {
                    agent.Phone =
                        request.Phone.Trim();
                }

                if (request.AlternatePhone != null)
                {
                    agent.AlternatePhone =
                        request.AlternatePhone.Trim();
                }

                if (request.DOB.HasValue)
                {
                    agent.DOB = request.DOB.Value;
                }

                if (!string.IsNullOrWhiteSpace(
                    request.Gender))
                {
                    agent.Gender =
                        request.Gender.Trim();
                }

                if (!string.IsNullOrWhiteSpace(
                    request.Address))
                {
                    agent.Address =
                        request.Address.Trim();
                }

                if (!string.IsNullOrWhiteSpace(
                    request.City))
                {
                    agent.City =
                        request.City.Trim();
                }

                if (!string.IsNullOrWhiteSpace(
                    request.District))
                {
                    agent.District =
                        request.District.Trim();
                }

                if (!string.IsNullOrWhiteSpace(
                    request.State))
                {
                    agent.State =
                        request.State.Trim();
                }

                if (!string.IsNullOrWhiteSpace(
                    request.Pincode))
                {
                    agent.Pincode =
                        request.Pincode.Trim();
                }

                if (!string.IsNullOrWhiteSpace(
                    request.AccountHolder))
                {
                    agent.AccountHolder =
                        request.AccountHolder.Trim();
                }

                if (!string.IsNullOrWhiteSpace(
                    request.BankName))
                {
                    agent.BankName =
                        request.BankName.Trim();
                }

                if (!string.IsNullOrWhiteSpace(
                    request.AccountNumber))
                {
                    agent.AccountNumber =
                        request.AccountNumber.Trim();
                }

                if (!string.IsNullOrWhiteSpace(
                    request.IFSCCode))
                {
                    agent.IFSCCode =
                        request.IFSCCode.Trim();
                }

                if (!string.IsNullOrWhiteSpace(
                    request.VehicleType))
                {
                    agent.VehicleType =
                        request.VehicleType.Trim();
                }

                if (!string.IsNullOrWhiteSpace(
                    request.VehicleNumber))
                {
                    agent.VehicleNumber =
                        request.VehicleNumber.Trim();
                }

                if (!string.IsNullOrWhiteSpace(
                    request.LicenseNumber))
                {
                    agent.LicenseNumber =
                        request.LicenseNumber.Trim();
                }

                if (request.VehicleInsurance != null)
                {
                    string? savedInsurance =
                        SaveFile(
                            request.VehicleInsurance,
                            "insurance");

                    if (!string.IsNullOrEmpty(
                        savedInsurance))
                    {
                        agent.VehicleInsurance =
                            savedInsurance;
                    }
                }

                if (request.VehiclePollution != null)
                {
                    string? savedPollution =
                        SaveFile(
                            request.VehiclePollution,
                            "pollution");

                    if (!string.IsNullOrEmpty(
                        savedPollution))
                    {
                        agent.VehiclePollution =
                            savedPollution;
                    }
                }

                if (request.VehiclePhoto != null)
                {
                    string? savedPhoto =
                        SaveFile(
                            request.VehiclePhoto,
                            "vehicle");

                    if (!string.IsNullOrEmpty(
                        savedPhoto))
                    {
                        agent.VehiclePhoto =
                            savedPhoto;
                    }
                }

                if (request.ProfilePicture != null)
                {
                    string? savedPic =
                        SaveFile(
                            request.ProfilePicture,
                            "profile");

                    if (!string.IsNullOrEmpty(
                        savedPic))
                    {
                        agent.ProfilePicture =
                            savedPic;
                    }
                }

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message =
                        "Profile updated successfully.",
                    profilePicture =
                        agent.ProfilePicture
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message =
                        "Error updating profile.",
                    error = ex.Message
                });
            }
        }

        // ============================================================
        // VERIFY PASSWORD
        // ============================================================

        [Authorize]
        [HttpPost("verify-password")]
        public async Task<IActionResult> VerifyCurrentPassword(
            [FromBody] VerifyPasswordRequest request)
        {
            try
            {
                var loginIdClaim =
                    User.FindFirst(
                        System.Security.Claims.ClaimTypes.NameIdentifier)
                    ?? User.FindFirst("sub")
                    ?? User.FindFirst(
                        System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                    ?? User.FindFirst("CollectionAgentId");

                if (loginIdClaim == null ||
                    string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new
                    {
                        message =
                            "User identity claim not found in token."
                    });
                }

                if (!int.TryParse(
                    loginIdClaim.Value,
                    out int id))
                {
                    return Unauthorized(new
                    {
                        message =
                            "Invalid user identity format."
                    });
                }

                var agent = await db.CollectionAgents
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(
                        x => x.LoginId == id ||
                             x.CollectionAgentId == id);

                if (agent == null ||
                    agent.Login == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Collection Agent account not found."
                    });
                }

                var hasher =
                    new PasswordHasher<Login>();

                var result =
                    hasher.VerifyHashedPassword(
                        agent.Login,
                        agent.Login.PasswordHash,
                        request.CurrentPassword ?? "");

                if (result ==
                    PasswordVerificationResult.Failed)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message =
                            "Current password is incorrect."
                    });
                }

                return Ok(new
                {
                    success = true,
                    message =
                        "Password verified successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message =
                        "Error verifying password.",
                    error = ex.Message
                });
            }
        }

        // ============================================================
        // CHANGE PASSWORD
        // ============================================================

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangeAgentPassword(
            [FromBody] ChangeUserPasswordRequest request)
        {
            try
            {
                var loginIdClaim =
                    User.FindFirst(
                        System.Security.Claims.ClaimTypes.NameIdentifier)
                    ?? User.FindFirst("sub")
                    ?? User.FindFirst(
                        System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                    ?? User.FindFirst("CollectionAgentId");

                if (loginIdClaim == null ||
                    string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new
                    {
                        message =
                            "User identity claim not found in token."
                    });
                }

                if (!int.TryParse(
                    loginIdClaim.Value,
                    out int id))
                {
                    return Unauthorized(new
                    {
                        message =
                            "Invalid user identity format."
                    });
                }

                var agent = await db.CollectionAgents
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(
                        x => x.LoginId == id ||
                             x.CollectionAgentId == id);

                if (agent == null ||
                    agent.Login == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Collection Agent account not found."
                    });
                }

                if (string.IsNullOrWhiteSpace(
                    request.NewPassword) ||
                    request.NewPassword.Length < 6)
                {
                    return BadRequest(new
                    {
                        message =
                            "New password must be at least 6 characters."
                    });
                }

                if (request.NewPassword !=
                    request.ConfirmPassword)
                {
                    return BadRequest(new
                    {
                        message =
                            "New password and confirm password do not match."
                    });
                }

                var hasher =
                    new PasswordHasher<Login>();

                var verifyResult =
                    hasher.VerifyHashedPassword(
                        agent.Login,
                        agent.Login.PasswordHash,
                        request.CurrentPassword ?? "");

                if (verifyResult ==
                    PasswordVerificationResult.Failed)
                {
                    return BadRequest(new
                    {
                        message =
                            "Current password is incorrect."
                    });
                }

                agent.Login.PasswordHash =
                    hasher.HashPassword(
                        agent.Login,
                        request.NewPassword);

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message =
                        "Password updated successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message =
                        "Error changing password.",
                    error = ex.Message
                });
            }
        }

        // ============================================================
        // TODAY'S PICKUPS
        // ============================================================

        [Authorize]
        [HttpGet("todays-pickup")]
        public async Task<IActionResult> gettodayspickup()
        {
            try
            {
                var loginIdClaim =
                    User.FindFirst(
                        System.Security.Claims.ClaimTypes.NameIdentifier)
                    ?? User.FindFirst("sub")
                    ?? User.FindFirst(
                        System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                    ?? User.FindFirst("CollectionAgentId");

                if (loginIdClaim == null ||
                    string.IsNullOrEmpty(loginIdClaim.Value))
                {
                    return Unauthorized(new
                    {
                        message =
                            "User identity claim not found in token."
                    });
                }

                if (!int.TryParse(
                    loginIdClaim.Value,
                    out int id))
                {
                    return Unauthorized(new
                    {
                        message =
                            "Invalid user identity format."
                    });
                }

                var agent =
                    await db.CollectionAgents
                        .FirstOrDefaultAsync(
                            x => x.LoginId == id ||
                                 x.CollectionAgentId == id);

                if (agent == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Collection Agent not found."
                    });
                }

                var today = DateTime.Today;
                var tomorrow = today.AddDays(1);

                var pickups =
                    await db.CollectionAssignments
                        .Include(x => x.Device)
                            .ThenInclude(d => d.Category)
                        .Include(x => x.Device)
                            .ThenInclude(d => d.User)
                        .Where(x =>
                            x.CollectionAgentId ==
                                agent.CollectionAgentId &&

                            x.Device.PickupDate >= today &&
                            x.Device.PickupDate < tomorrow &&

                            x.Device.Status != "Inactive" &&
                            x.Device.Status != "Deleted" &&

                            (
                                x.Status == "Assigned" ||
                                x.Status == "Accepted" ||
                                x.Status == "PickupStarted"
                            ))
                        .OrderBy(x => x.Device.PickupDate)
                        .Select(x => new
                        {
                            assignmentId =
                                x.CollectionAssignmentId,

                            deviceId =
                                x.DeviceId,

                            brand =
                                x.Device.Brand,

                            model =
                                x.Device.Model,

                            categoryName =
                                x.Device.Category != null
                                    ? x.Device.Category.CategoryName
                                    : "E-Waste",

                            quantity =
                                x.Device.Quantity,

                            weight =
                                x.Device.Weight,

                            pickupDate =
                                x.Device.PickupDate,

                            timeSlot =
                                x.Device.TimeSlot,

                            address =
                                x.Device.Address,

                            landmark =
                                x.Device.Landmark,

                            city =
                                x.Device.User != null
                                    ? x.Device.User.City
                                    : "",

                            district =
                                x.Device.User != null
                                    ? x.Device.User.District
                                    : "",

                            state =
                                x.Device.User != null
                                    ? x.Device.User.State
                                    : "",

                            pincode =
                                x.Device.User != null
                                    ? x.Device.User.Pincode
                                    : "",

                            pickupInstructions =
                                x.Device.PickupInstructions,

                            customerName =
                                x.Device.User != null
                                    ? x.Device.User.FirstName +
                                      " " +
                                      x.Device.User.LastName
                                    : "",

                            customerPhone =
                                x.Device.User != null
                                    ? x.Device.User.PhoneNumber
                                    : "",

                            status =
                                x.Status
                        })
                        .ToListAsync();

                return Ok(new
                {
                    date =
                        today.ToString("yyyy-MM-dd"),

                    totalPickups =
                        pickups.Count,

                    pickups =
                        pickups
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message =
                        "Error retrieving today's pickups.",
                    error = ex.Message
                });
            }
        }
    }
}