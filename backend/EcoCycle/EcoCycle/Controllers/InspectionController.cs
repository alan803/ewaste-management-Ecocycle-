using EcoCycle.API.Data;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Mail;

namespace EcoCycle.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InspectionController : ControllerBase
    {
        private readonly ApplicationDbContext db;
        private readonly IWebHostEnvironment env;

        public InspectionController(
            ApplicationDbContext db,
            IWebHostEnvironment env)
        {
            this.db = db;
            this.env = env;
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

                        smtp.DeliveryMethod =
                            SmtpDeliveryMethod.Network;

                        await smtp.SendMailAsync(mail);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[Email Notice] Failed to send email to {recipientEmail}: {ex.Message}"
                );
            }
        }
        [HttpPost("create/{deviceId}")]
        public async Task<IActionResult> CreateInspectionRequest(
            int deviceId)
        {
            await CheckAndUpdateExpiredInspectionRequests();

            var device = await db.Device
                .Include(d => d.Category)
                .Include(d => d.User)
                .FirstOrDefaultAsync(
                d => d.DeviceId == deviceId);

            if (device == null)
            {
                return NotFound(new
                {
                    message = "Device not found."
                });
            }
            var existingRequest = await db.InspectionRequest
                .Where(x => x.DeviceId == deviceId && x.Status != "Rejected" && x.Status != "Cancelled")
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            Technician? technician = null;
            InspectionRequest request;

            if (existingRequest != null)
            {
                bool isExpired = string.Equals(existingRequest.Status, "Expired", StringComparison.OrdinalIgnoreCase) ||
                                 (existingRequest.ResponseDeadline.HasValue && existingRequest.ResponseDeadline.Value < DateTime.Now);
                bool isWaiting = string.Equals(existingRequest.Status, "Waiting", StringComparison.OrdinalIgnoreCase);

                if (isExpired)
                {
                    existingRequest.Status = "Expired";
                    existingRequest.UpdatedAt = DateTime.Now;

                    technician = await FindBestTechnician(device);
                    if (technician == null)
                    {
                        var waitingReq = new InspectionRequest
                        {
                            DeviceId = device.DeviceId,
                            TechnicianId = null,
                            Status = "Waiting",
                            ReassignmentCount = existingRequest.ReassignmentCount + 1,
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
                        };
                        db.InspectionRequest.Add(waitingReq);
                        await db.SaveChangesAsync();

                        return Ok(new
                        {
                            message = "Inspection request is currently waiting, but no suitable technician is available.",
                            inspectionRequestId = waitingReq.InspectionRequestId,
                            status = "Waiting"
                        });
                    }

                    request = new InspectionRequest
                    {
                        DeviceId = device.DeviceId,
                        TechnicianId = technician.TechnicianId,
                        Status = "Assigned",
                        AssignedAt = DateTime.Now,
                        ResponseDeadline = DateTime.Now.AddHours(24),
                        ReassignmentCount = existingRequest.ReassignmentCount + 1,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };
                    db.InspectionRequest.Add(request);
                    device.LifecycleStatus = "InspectionAssigned";

                    await db.SaveChangesAsync();

                    if (technician.LoginId > 0)
                    {
                        var notification = new Notification
                        {
                            LoginId = technician.LoginId,
                            Title = "New Inspection Request",
                            Message = $"A new inspection request for {device.Brand} {device.Model} has been assigned to you.",
                            Isread = false,
                            Status = true,
                            CreatedAt = DateTime.Now
                        };

                        db.Notification.Add(notification);
                        await db.SaveChangesAsync();
                    }
                }
                else if (isWaiting)
                {
                    technician = await FindBestTechnician(device);
                    if (technician == null)
                    {
                        return Ok(new
                        {
                            message = "Inspection request is currently waiting, but no suitable technician is available.",
                            inspectionRequestId = existingRequest.InspectionRequestId,
                            status = "Waiting"
                        });
                    }

                    existingRequest.Status = "Reassigned";
                    existingRequest.UpdatedAt = DateTime.Now;

                    request = new InspectionRequest
                    {
                        DeviceId = device.DeviceId,
                        TechnicianId = technician.TechnicianId,
                        Status = "Assigned",
                        AssignedAt = DateTime.Now,
                        ResponseDeadline = DateTime.Now.AddHours(24),
                        ReassignmentCount = existingRequest.ReassignmentCount + 1,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };
                    db.InspectionRequest.Add(request);
                    device.LifecycleStatus = "InspectionAssigned";

                    await db.SaveChangesAsync();

                    if (technician.LoginId > 0)
                    {
                        var notification = new Notification
                        {
                            LoginId = technician.LoginId,
                            Title = "New Inspection Request",
                            Message = $"A new inspection request for {device.Brand} {device.Model} has been assigned to you.",
                            Isread = false,
                            Status = true,
                            CreatedAt = DateTime.Now
                        };

                        db.Notification.Add(notification);
                        await db.SaveChangesAsync();
                    }
                }
                else
                {
                    return BadRequest(new
                    {
                        message = "An active inspection request already exists for this device."
                    });
                }
            }
            else
            {
                technician = await FindBestTechnician(device);

                request = new InspectionRequest
                {
                    DeviceId = device.DeviceId,
                    TechnicianId = null,
                    Status = "Waiting",
                    CreatedAt = DateTime.Now
                };

                if (technician != null)
                {
                    request.TechnicianId = technician.TechnicianId;
                    request.Status = "Assigned";
                    request.AssignedAt = DateTime.Now;
                    request.ResponseDeadline = DateTime.Now.AddHours(24);
                    device.LifecycleStatus = "InspectionAssigned";
                }
                else
                {
                    device.LifecycleStatus = "InspectionPending";
                }

                db.InspectionRequest.Add(request);
                await db.SaveChangesAsync();
                if (technician != null)
                {
                    var notification = new Notification
                    {
                        LoginId = technician.LoginId,
                        Title = "New Inspection Request",
                        Message = $"A new inspection request for {device.Brand} {device.Model} has been assigned to you.",
                        Isread = false,
                        CreatedAt = DateTime.Now
                    };

                    db.Notification.Add(notification);
                    await db.SaveChangesAsync();
                }
            }
            if (technician != null &&
                technician.Login != null &&
                !string.IsNullOrWhiteSpace(
                    technician.Login.Email))
            {
                string technicianEmail =
                    technician.Login.Email;

                string subject =
                    "EcoCycle - New Inspection Request Assigned";

                string body = $@"
                <html>
                <body>

                    <h2>New Inspection Request Assigned</h2>

                    <p>
                        Dear {technician.FirstName} {technician.LastName},
                    </p>

                    <p>
                        A new e-waste device inspection request has been
                        assigned to you through the EcoCycle platform.
                    </p>

                    <h3>Inspection Details</h3>

                    <p>
                        <strong>Inspection Request ID:</strong>
                        {request.InspectionRequestId}
                    </p>

                    <p>
                        <strong>Device ID:</strong>
                        {device.DeviceId}
                    </p>

                    <p>
                        <strong>Category:</strong>
                        {device.Category?.CategoryName}
                    </p>

                    <p>
                        <strong>Brand:</strong>
                        {device.Brand}
                    </p>

                    <p>
                        <strong>Model:</strong>
                        {device.Model}
                    </p>

                    <p>
                        <strong>Condition:</strong>
                        {device.Condition}
                    </p>

                    <p>
                        <strong>Response Deadline:</strong>
                        {request.ResponseDeadline:dd-MM-yyyy hh:mm tt}
                    </p>

                    <p>
                        Please log in to your EcoCycle technician account
                        and respond to this inspection request.
                    </p>

                    <br />

                    <p>
                        Regards,<br />
                        <strong>EcoCycle Admin Team</strong>
                    </p>

                </body>
                </html>";

                await SendEmailAsync(
                    technicianEmail,
                    subject,
                    body
                );
            }
            return Ok(new
            {
                message = technician == null
                    ? "Inspection request created but no suitable technician is currently available."
                    : "Inspection request created and technician assigned successfully.",

                inspectionRequestId =
                    request.InspectionRequestId,

                technicianId =
                    technician?.TechnicianId,

                technicianEmail =
                    technician?.Login?.Email,

                status =
                    request.Status
            });
        }
        private async Task<Technician?> FindBestTechnician(Device device)
        {
            var customer = device.User;

            if (customer == null)
            {
                return null;
            }

            var penalizedTechIds = await db.technicianPenalties
                .Where(p => p.Status == "Pending" || p.Status == "Unpaid")
                .Select(p => p.TechnicianId)
                .Distinct()
                .ToListAsync();

            var technicians = await db.Technician
                .Include(t => t.Login)
                .Where(t => t.Status == "Active" && !penalizedTechIds.Contains(t.TechnicianId))
                .ToListAsync();

            if (!technicians.Any())
            {
                return null;
            }

            var candidates = new List<(Technician Technician, int Workload)>();

            foreach (var technician in technicians)
            {
                // Strict State match
                if (!string.IsNullOrWhiteSpace(customer.State) &&
                    !string.IsNullOrWhiteSpace(technician.State))
                {
                    if (!customer.State.Trim().Equals(technician.State.Trim(), StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }
                }

                // Strict District match
                if (!string.IsNullOrWhiteSpace(customer.District) &&
                    !string.IsNullOrWhiteSpace(technician.District))
                {
                    if (!customer.District.Trim().Equals(technician.District.Trim(), StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }
                }

                bool specializationMatch = true;
                if (!string.IsNullOrWhiteSpace(device.Category?.CategoryName) &&
                    !string.IsNullOrWhiteSpace(technician.Specialization))
                {
                    specializationMatch = technician.Specialization.Contains(
                        device.Category.CategoryName,
                        StringComparison.OrdinalIgnoreCase
                    );
                }

                if (!specializationMatch)
                {
                    continue;
                }

                int workload = await db.InspectionRequest.CountAsync(x =>
                    x.TechnicianId == technician.TechnicianId &&
                    (
                        x.Status == "Assigned" ||
                        x.Status == "Accepted" ||
                        x.Status == "InProgress"
                    )
                );

                if (workload >= 5)
                {
                    continue;
                }

                candidates.Add((technician, workload));
            }

            return candidates
                .OrderBy(x => x.Workload)
                .Select(x => x.Technician)
                .FirstOrDefault();
        }
        private async Task CheckAndApplyOverdueInspectionPenalties()
        {
            try
            {
                var now = DateTime.Now;

                // Query Inspections where deadline has expired, ExtensionCount >= 2, and inspection is not completed
                var overdueInspections = await db.Inspection
                    .Include(i => i.Technician)
                        .ThenInclude(t => t!.Login)
                    .Include(i => i.Device)
                    .Where(i => i.InspectionCompletedAt == null &&
                                i.InspectionDeadline.HasValue &&
                                i.InspectionDeadline.Value < now &&
                                i.ExtensionCount >= 2)
                    .ToListAsync();

                if (!overdueInspections.Any()) return;

                foreach (var insp in overdueInspections)
                {
                    // Check if a penalty record already exists for this inspection/device/technician
                    bool penaltyExists = await db.technicianPenalties
                        .AnyAsync(p => p.TechnicianId == insp.TechnicianId &&
                                       p.DeviceId == insp.DeviceId &&
                                       p.InspectionRequestId == insp.InspectionRequestId);

                    if (!penaltyExists && insp.Technician != null && insp.Device != null)
                    {
                        // 1. Create TechnicianPenalty entry (₹100 fine)
                        var penalty = new TechnicianPenalty
                        {
                            TechnicianId = insp.TechnicianId,
                            DeviceId = insp.DeviceId,
                            InspectionRequestId = insp.InspectionRequestId,
                            PenaltyAmount = 100.00m,
                            Reason = $"Failure to complete device inspection within permitted 24-hour extension timeframe for Device #DEV-{insp.DeviceId} ({insp.Device.Brand} {insp.Device.Model}).",
                            Status = "Pending",
                            CreatedAt = now
                        };
                        db.technicianPenalties.Add(penalty);

                        insp.Status = "Penalized";
                        if (insp.Device != null)
                        {
                            insp.Device.LifecycleStatus = "InspectionPenalized";
                        }

                        await db.SaveChangesAsync();

                        // 2. Send email notice ONLY to technician (NO in-app notification per requirement)
                        string techEmail = insp.Technician.Login?.Email ?? "";
                        if (!string.IsNullOrWhiteSpace(techEmail))
                        {
                            string subject = $"EcoCycle Penalty Notice: ₹100 Fine Applied (Device #DEV-{insp.DeviceId})";
                            string emailBody = $@"
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <style>
                                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }}
                                    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }}
                                    .header {{ background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; padding: 24px; text-align: center; }}
                                    .header h1 {{ margin: 0; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }}
                                    .content {{ padding: 24px; }}
                                    .alert-box {{ background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 16px; margin: 16px 0; color: #991b1b; font-weight: 600; font-size: 14px; }}
                                    .detail-table {{ width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }}
                                    .detail-table td {{ padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }}
                                    .detail-label {{ color: #64748b; font-weight: 600; width: 40%; }}
                                    .detail-val {{ color: #0f172a; font-weight: 700; }}
                                    .policy-card {{ background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin-top: 20px; font-size: 13px; color: #475569; }}
                                    .footer {{ background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
                                </style>
                            </head>
                            <body>
                                <div class='container'>
                                    <div class='header'>
                                        <h1>EcoCycle Penalty Notice</h1>
                                        <p style='margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;'>Inspection Deadline & Penalty Enforcement</p>
                                    </div>
                                    <div class='content'>
                                        <p style='font-size: 15px; margin-top: 0;'>Dear <strong>{insp.Technician.FirstName} {insp.Technician.LastName}</strong>,</p>
                                        
                                        <div class='alert-box'>
                                            ⚠️ A penalty of <strong>₹100.00</strong> has been automatically generated for your account due to failure to complete device inspection within the permitted timeframe.
                                        </div>

                                        <p style='font-size: 14px; color: #475569;'>Your assigned e-waste device inspection exceeded the maximum permitted 24-hour extensions without completion. Details are outlined below:</p>

                                        <table class='detail-table'>
                                            <tr>
                                                <td class='detail-label'>Device ID</td>
                                                <td class='detail-val'>#DEV-{insp.DeviceId}</td>
                                            </tr>
                                            <tr>
                                                <td class='detail-label'>Device Description</td>
                                                <td class='detail-val'>{insp.Device.Brand} {insp.Device.Model}</td>
                                            </tr>
                                            <tr>
                                                <td class='detail-label'>Penalty Amount</td>
                                                <td class='detail-val' style='color: #dc2626; font-size: 16px;'>₹100.00</td>
                                            </tr>
                                            <tr>
                                                <td class='detail-label'>Extensions Used</td>
                                                <td class='detail-val'>{insp.ExtensionCount} of 2 permitted</td>
                                            </tr>
                                            <tr>
                                                <td class='detail-label'>Deadline Expiry</td>
                                                <td class='detail-val'>{insp.InspectionDeadline:dd-MM-yyyy hh:mm tt}</td>
                                            </tr>
                                            <tr>
                                                <td class='detail-label'>Penalty Status</td>
                                                <td class='detail-val' style='color: #d97706;'>Pending Resolution</td>
                                            </tr>
                                        </table>

                                        <div class='policy-card'>
                                            <strong>Technician Compliance Policy:</strong><br/>
                                            Once a device is assigned to you, inspections must be completed within the specified deadline. Extensions are limited to a maximum of two 24-hour periods. Failure to complete inspections within these limits results in an automated ₹100 penalty and may impact future assignment eligibility.
                                        </div>
                                    </div>
                                    <div class='footer'>
                                        EcoCycle E-Waste Platform &bull; Technician Management System<br/>
                                        This is an automated system notification.
                                    </div>
                                </div>
                            </body>
                            </html>";

                            await SendEmailAsync(techEmail, subject, emailBody);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking overdue inspection penalties: {ex.Message}");
            }
        }

        private async Task CheckAndUpdateExpiredInspectionRequests()
        {
            await CheckAndApplyOverdueInspectionPenalties();

            var now = DateTime.Now;
            var expiredRequests = await db.InspectionRequest
                .Include(x => x.Device)
                .Where(x => x.Status == "Assigned" &&
                            x.ResponseDeadline.HasValue &&
                            x.ResponseDeadline.Value < now)
                .ToListAsync();

            if (expiredRequests.Any())
            {
                foreach (var req in expiredRequests)
                {
                    req.Status = "Expired";
                    req.UpdatedAt = now;
                    if (req.Device != null)
                    {
                        req.Device.LifecycleStatus = "InspectionExpired";
                    }
                }
                await db.SaveChangesAsync();
            }
        }
        [Microsoft.AspNetCore.Authorization.Authorize]
        [HttpGet("my-requests")]
        public async Task<IActionResult> GetMyRequests()
        {
            await CheckAndUpdateExpiredInspectionRequests();

            var loginIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                            ?? User.FindFirst("sub")
                            ?? User.FindFirst("nameid");

            if (loginIdClaim == null || !int.TryParse(loginIdClaim.Value, out int loginId))
            {
                return Unauthorized(new { message = "User identity not found or invalid." });
            }

            var tech = await db.Technician
                .FirstOrDefaultAsync(t => t.LoginId == loginId);

            if (tech == null)
            {
                return NotFound(new { message = "Technician profile not found for the authenticated user." });
            }

            int targetTechId = tech.TechnicianId;

            var rawRequests = await db.InspectionRequest
                .Include(x => x.Device)
                    .ThenInclude(d => d.Category)
                .Include(x => x.Device)
                    .ThenInclude(d => d.User)
                .Where(x =>
                    x.TechnicianId == targetTechId &&
                    x.Device.Status != "Inactive" &&
                    x.Device.Status != "Deleted")
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            var deviceIds = rawRequests.Select(r => r.DeviceId).ToList();
            var reqIds = rawRequests.Select(r => r.InspectionRequestId).ToList();

            var inspections = await db.Inspection
                .Where(i => deviceIds.Contains(i.DeviceId) || reqIds.Contains(i.InspectionRequestId))
                .ToListAsync();

            var requests = rawRequests.Select(x => {
                var insp = inspections.FirstOrDefault(i => i.InspectionRequestId == x.InspectionRequestId) ?? inspections.FirstOrDefault(i => i.InspectionRequestId == 0 && i.DeviceId == x.DeviceId);
                
                string effectiveStatus = (insp != null && !string.IsNullOrWhiteSpace(insp.Status) && insp.Status != "NotStarted" && insp.Status != "Pending")
                    ? insp.Status
                    : x.Status;

                DateTime? calcDeadline = insp?.InspectionDeadline ?? (x.AssignedAt.HasValue ? x.AssignedAt.Value.AddDays(3) : x.CreatedAt.AddDays(3));
                return new
                {
                    inspectionRequestId = x.InspectionRequestId,
                    deviceId = x.DeviceId,
                    technicianId = x.TechnicianId,
                    status = effectiveStatus,
                    assignedAt = x.AssignedAt,
                    responseDeadline = x.ResponseDeadline,
                    inspectionDeadline = calcDeadline,
                    respondedAt = x.RespondedAt,
                    rejectionReason = x.RejectionReason,
                    reassignmentCount = x.ReassignmentCount,
                    createdAt = x.CreatedAt,
                    updatedAt = x.UpdatedAt,
                    device = x.Device
                };
            })
            .Where(r => !string.Equals(r.status, "Reassigned", StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(r.status, "Penalized", StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(r.status, "Cancelled", StringComparison.OrdinalIgnoreCase))
            .ToList();

            return Ok(requests);
        }

        [Microsoft.AspNetCore.Authorization.Authorize]
        [HttpGet("technicain/{technicianId}")]
        public async Task<IActionResult> GetTechnicianRequests(
            int technicianId)
        {
            await CheckAndUpdateExpiredInspectionRequests();

            var loginIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                            ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                            ?? User.FindFirst("sub")
                            ?? User.FindFirst("nameid");

            if (loginIdClaim == null || !int.TryParse(loginIdClaim.Value, out int loginId))
            {
                return Unauthorized(new { message = "User identity not found." });
            }

            var callerTech = await db.Technician.FirstOrDefaultAsync(t => t.LoginId == loginId);
            var roleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            bool isAdmin = string.Equals(roleClaim, "Admin", StringComparison.OrdinalIgnoreCase) ||
                           string.Equals(roleClaim, "Administrator", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin)
            {
                if (callerTech == null || (callerTech.TechnicianId != technicianId && callerTech.LoginId != technicianId))
                {
                    return Forbid();
                }
            }

            int targetTechId = callerTech != null ? callerTech.TechnicianId : technicianId;

            var rawRequests = await db.InspectionRequest
                .Include(x => x.Device)
                    .ThenInclude(d => d.Category)
                .Include(x => x.Device)
                    .ThenInclude(d => d.User)
                .Where(x =>
                    x.TechnicianId == targetTechId &&
                    x.Device.Status != "Inactive" &&
                    x.Device.Status != "Deleted")
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            var deviceIds = rawRequests.Select(r => r.DeviceId).ToList();
            var reqIds = rawRequests.Select(r => r.InspectionRequestId).ToList();

            var inspections = await db.Inspection
                .Where(i => deviceIds.Contains(i.DeviceId) || reqIds.Contains(i.InspectionRequestId))
                .ToListAsync();

            var requests = rawRequests.Select(x => {
                var insp = inspections.FirstOrDefault(i => i.InspectionRequestId == x.InspectionRequestId) ?? inspections.FirstOrDefault(i => i.InspectionRequestId == 0 && i.DeviceId == x.DeviceId);
                
                string effectiveStatus = (insp != null && !string.IsNullOrWhiteSpace(insp.Status) && insp.Status != "NotStarted" && insp.Status != "Pending")
                    ? insp.Status
                    : x.Status;

                DateTime? calcDeadline = insp?.InspectionDeadline ?? (x.AssignedAt.HasValue ? x.AssignedAt.Value.AddDays(3) : x.CreatedAt.AddDays(3));
                return new
                {
                    inspectionRequestId = x.InspectionRequestId,
                    deviceId = x.DeviceId,
                    technicianId = x.TechnicianId,
                    status = effectiveStatus,
                    assignedAt = x.AssignedAt,
                    responseDeadline = x.ResponseDeadline,
                    inspectionDeadline = calcDeadline,
                    respondedAt = x.RespondedAt,
                    rejectionReason = x.RejectionReason,
                    reassignmentCount = x.ReassignmentCount,
                    createdAt = x.CreatedAt,
                    updatedAt = x.UpdatedAt,
                    device = x.Device
                };
            })
            .Where(r => !string.Equals(r.status, "Reassigned", StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(r.status, "Penalized", StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(r.status, "Cancelled", StringComparison.OrdinalIgnoreCase))
            .ToList();

            return Ok(requests);
        }

        [Microsoft.AspNetCore.Authorization.Authorize]
        [HttpGet("my-deliveries")]
        public async Task<IActionResult> GetMyDeliveries()
        {
            await CheckAndUpdateExpiredInspectionRequests();
            await CollectionAssignmentController.CheckAndUpdateExpiredCollectionAssignments(db);

            try
            {
                var loginIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                                ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                                ?? User.FindFirst("sub")
                                ?? User.FindFirst("nameid");

                if (loginIdClaim == null || !int.TryParse(loginIdClaim.Value, out int loginId))
                {
                    return Unauthorized(new { message = "User identity not found or invalid." });
                }

                var tech = await db.Technician
                    .Include(t => t.Login)
                    .FirstOrDefaultAsync(t => t.LoginId == loginId);

                if (tech == null)
                {
                    return NotFound(new { message = "Technician profile not found for the authenticated user." });
                }

                int targetTechId = tech.TechnicianId;

                // Find inspection requests assigned to this technician that have been ACCEPTED by the technician
                var inspRequests = await db.InspectionRequest
                    .Include(x => x.Device)
                        .ThenInclude(d => d.Category)
                    .Include(x => x.Device)
                        .ThenInclude(d => d.User)
                    .Include(x => x.Device)
                        .ThenInclude(d => d.CollectionAssignments)
                            .ThenInclude(ca => ca.CollectionAgent)
                    .Where(x => x.TechnicianId == targetTechId && 
                                x.Device.Status != "Inactive" && 
                                x.Device.Status != "Deleted" &&
                                (x.Status == "Accepted" || x.Status == "InProgress" || x.Status == "Completed"))
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();

                var processedDeviceIds = new HashSet<int>();
                var result = new List<object>();

                foreach (var x in inspRequests)
                {
                    var dev = x.Device;
                    if (dev == null || processedDeviceIds.Contains(dev.DeviceId)) continue;

                    // Verify that this technician is still the current active technician for this device
                    var latestReqForDevice = await db.InspectionRequest
                        .Where(ir => ir.DeviceId == dev.DeviceId && ir.Status != "Cancelled" && ir.Status != "Rejected")
                        .OrderByDescending(ir => ir.InspectionRequestId)
                        .FirstOrDefaultAsync();

                    if (latestReqForDevice != null && latestReqForDevice.TechnicianId != targetTechId)
                    {
                        // Device has been reassigned to another technician
                        continue;
                    }

                    processedDeviceIds.Add(dev.DeviceId);

                    var allCas = dev.CollectionAssignments?.OrderByDescending(caItem => caItem.CreatedAt).ToList() ?? new List<CollectionAssignment>();
                    // Pick the inbound assignment to the technician hub (CustomerToTechnician / TechnicianToTechnician)
                    var inboundCa = allCas.FirstOrDefault(caItem => caItem.AssignmentType == "CustomerToTechnician" || caItem.AssignmentType == "TechnicianToTechnician" || caItem.AssignmentType == "CitizenToTechnician") 
                                    ?? allCas.LastOrDefault();
                    var latestCa = inboundCa ?? allCas.FirstOrDefault();
                    var prevCa = allCas.Skip(1).FirstOrDefault(p => p.Status == "Failed" || p.Status == "PickupFailed" || p.Status == "Cancelled" || p.Status == "Rejected" || p.Status == "Expired");

                    bool hasPreviousFailedPickup = prevCa != null;
                    string previousFailureReason = prevCa?.RejectionReason ?? "";
                    string previousAgentName = prevCa?.CollectionAgent != null ? $"{prevCa.CollectionAgent.FirstName} {prevCa.CollectionAgent.LastName}".Trim() : "";

                    Delivery? delObj = null;
                    if (latestCa != null)
                    {
                        try
                        {
                            delObj = await db.Deliveries.FirstOrDefaultAsync(d => d.CollectionAssignmentId == latestCa.CollectionAssignmentId);
                        }
                        catch { }
                    }

                    var inspObj = await db.Inspection.FirstOrDefaultAsync(i => i.DeviceId == dev.DeviceId || i.InspectionRequestId == x.InspectionRequestId);
                    bool isInspected = inspObj != null && (inspObj.Status == "Completed" || inspObj.InspectionCompletedAt != null || !string.IsNullOrEmpty(inspObj.OverallCondition) || inspObj.OverallScore > 0);
                    bool isInspectionInProgress = !isInspected && inspObj != null && (inspObj.Status == "InProgress" || inspObj.InspectionStartedAt != null);

                    string caStatus = latestCa?.Status ?? "Scheduled";
                    string delStatus = delObj != null ? delObj.Status : (caStatus == "Completed" ? "Pending" : caStatus == "OutForDelivery" ? "InTransit" : caStatus == "DeliveredToCenter" ? "Delivered" : "Pending");

                    if (isInspected || dev.LifecycleStatus == "AtInspectionCenter" || dev.LifecycleStatus == "Inspected" || (dev.LifecycleStatus != null && (dev.LifecycleStatus.Contains("Refurbish") || dev.LifecycleStatus.Contains("Recycl"))))
                    {
                        caStatus = "DeliveredToCenter";
                        delStatus = "Delivered";
                    }

                    result.Add(new
                    {
                        deviceId = dev.DeviceId,
                        inspectionRequestId = (int?)x.InspectionRequestId,
                        collectionAssignmentId = latestCa?.CollectionAssignmentId,

                        brand = dev.Brand,
                        model = dev.Model,
                        modelNumber = dev.ModelNumber,
                        serialNumber = dev.SerialNumber,
                        purchaseDate = dev.PurchaseDate,
                        deviceQrToken = !string.IsNullOrEmpty(dev.DeviceQrToken) ? dev.DeviceQrToken : $"ECOQR-DEV-{dev.DeviceId}",
                        categoryName = dev.Category?.CategoryName ?? "E-Waste",
                        quantity = dev.Quantity,
                        weight = dev.Weight,
                        condition = dev.Condition,
                        working = dev.Working,
                        physicalDamage = dev.PhysicalDamage,
                        displayCondition = dev.DisplayCondition,
                        batteryCondition = dev.BatteryCondition,
                        accessories = dev.Accessories,
                        charger = dev.Charger,
                        ownership = dev.Ownership,
                        ownershipConfirmed = dev.OwnershipConfirmed,
                        processingPreference = dev.ProcessingPreference,
                        frontPhoto = dev.FrontPhoto,
                        backPhoto = dev.BackPhoto,
                        damagePhoto = dev.DamagePhoto,
                        labelPhoto = dev.LabelPhoto,

                        customerName = dev.User != null ? $"{dev.User.FirstName} {dev.User.LastName}".Trim() : "Citizen",
                        customerPhone = dev.User?.PhoneNumber ?? "",
                        address = dev.Address,
                        landmark = dev.Landmark,
                        city = dev.User?.City ?? "",
                        district = dev.User?.District ?? "",
                        state = dev.User?.State ?? "",
                        pincode = dev.User?.Pincode ?? "",

                        pickupDate = dev.PickupDate,
                        timeSlot = dev.TimeSlot,
                        pickupInstructions = dev.PickupInstructions,

                        status = caStatus,
                        deliveryStatus = delStatus,
                        lifecycleStatus = isInspected ? "Inspected" : dev.LifecycleStatus,
                        requestStatus = isInspected ? "Completed" : x.Status,

                        isInspected = isInspected,
                        inspectionCompleted = isInspected,
                        qualityGrade = inspObj?.OverallCondition,
                        overallScore = inspObj?.OverallScore,
                        inspectionStartedAt = inspObj?.InspectionStartedAt ?? (isInspected ? (inspObj?.CreatedAt ?? x.CreatedAt) : null),
                        inspectionCompletedAt = inspObj?.InspectionCompletedAt,

                        hasPreviousFailedPickup = hasPreviousFailedPickup,
                        previousFailureReason = previousFailureReason,
                        previousAgentName = previousAgentName,

                        collectionAgentId = latestCa?.CollectionAgentId,
                        collectionAgentName = latestCa?.CollectionAgent != null ? $"{latestCa.CollectionAgent.FirstName} {latestCa.CollectionAgent.LastName}".Trim() : "Assigned Agent",
                        collectionAgentPhone = latestCa?.CollectionAgent?.Phone ?? latestCa?.CollectionAgent?.AlternatePhone ?? "",
                        collectionAgentAltPhone = latestCa?.CollectionAgent?.AlternatePhone,
                        collectionAgentPhoto = latestCa?.CollectionAgent?.ProfilePicture,

                        inspectionCenterName = tech.InspectionCenterName ?? "EcoCycle Inspection Hub",
                        technicianAddress = tech.Address,
                        technicianPhone = tech.PhoneNumber,

                        assignedAt = latestCa?.AssignedAt ?? x.CreatedAt,
                        startedAt = latestCa?.AssignedAt,
                        deliveredAt = delObj?.DeliveredAt,
                        inspectionDeadline = inspObj?.InspectionDeadline ?? (delObj?.DeliveredAt?.AddDays(3) ?? (latestCa?.AssignedAt?.AddDays(3) ?? x.CreatedAt.AddDays(3))),
                        createdAt = dev.CreatedAt
                    });
                }

                // Query 2: Active devices with CollectionAssignments allocated to this technician ONLY if candidate devices belong to this technician
                var candidateDevIds = await db.InspectionRequest
                    .Where(r => r.TechnicianId == targetTechId && 
                               (r.Status == "Accepted" || r.Status == "InProgress" || r.Status == "Completed"))
                    .Select(r => r.DeviceId)
                    .Distinct()
                    .ToListAsync();

                var remainingDevIds = candidateDevIds.Where(id => !processedDeviceIds.Contains(id)).ToList();

                if (remainingDevIds.Any())
                {
                    var targetedCas = await db.CollectionAssignments
                        .Include(ca => ca.Device)
                            .ThenInclude(d => d.Category)
                        .Include(ca => ca.Device)
                            .ThenInclude(d => d.User)
                        .Include(ca => ca.Device)
                            .ThenInclude(d => d.InspectionRequests)
                        .Include(ca => ca.CollectionAgent)
                        .Where(ca => remainingDevIds.Contains(ca.DeviceId) && ca.Device != null && ca.Device.Status != "Inactive" && ca.Device.Status != "Deleted")
                        .OrderByDescending(ca => ca.CreatedAt)
                        .ToListAsync();

                    foreach (var ca in targetedCas)
                    {
                        var dev = ca.Device;
                        if (dev == null || processedDeviceIds.Contains(dev.DeviceId)) continue;

                        var latestInspReq = dev.InspectionRequests?
                            .Where(ir => ir.Status != "Cancelled" && ir.Status != "Rejected")
                            .OrderByDescending(ir => ir.InspectionRequestId)
                            .FirstOrDefault();

                        // Only include if latest inspection request is assigned to targetTechId AND HAS BEEN ACCEPTED
                        if (latestInspReq != null && 
                            latestInspReq.TechnicianId == targetTechId && 
                            (latestInspReq.Status == "Accepted" || latestInspReq.Status == "InProgress" || latestInspReq.Status == "Completed"))
                        {
                            processedDeviceIds.Add(dev.DeviceId);
                            Delivery? delObj = null;
                            try
                            {
                                delObj = await db.Deliveries.FirstOrDefaultAsync(d => d.CollectionAssignmentId == ca.CollectionAssignmentId);
                            }
                            catch { }

                            var inspObj = await db.Inspection.FirstOrDefaultAsync(i => i.DeviceId == dev.DeviceId || i.InspectionRequestId == latestInspReq.InspectionRequestId);
                            bool isInspected = inspObj != null && (inspObj.Status == "Completed" || inspObj.InspectionCompletedAt != null || !string.IsNullOrEmpty(inspObj.OverallCondition) || inspObj.OverallScore > 0);
                            bool isInspectionInProgress = !isInspected && inspObj != null && (inspObj.Status == "InProgress" || inspObj.InspectionStartedAt != null);

                            string caStatus = ca.Status ?? "Scheduled";
                            string delStatus = delObj != null ? delObj.Status : (caStatus == "Completed" ? "Pending" : caStatus == "OutForDelivery" ? "InTransit" : caStatus == "DeliveredToCenter" ? "Delivered" : "Pending");

                            if (isInspected || dev.LifecycleStatus == "AtInspectionCenter" || dev.LifecycleStatus == "Inspected" || (dev.LifecycleStatus != null && (dev.LifecycleStatus.Contains("Refurbish") || dev.LifecycleStatus.Contains("Recycl"))))
                            {
                                caStatus = "DeliveredToCenter";
                                delStatus = "Delivered";
                            }

                            var allCas = dev.CollectionAssignments?.OrderByDescending(caItem => caItem.CreatedAt).ToList() ?? new List<CollectionAssignment>();
                            var prevCa = allCas.Skip(1).FirstOrDefault(p => p.Status == "Failed" || p.Status == "PickupFailed" || p.Status == "Cancelled" || p.Status == "Rejected" || p.Status == "Expired");

                            bool hasPreviousFailedPickup = prevCa != null;
                            string previousFailureReason = prevCa?.RejectionReason ?? "";
                            string previousAgentName = prevCa?.CollectionAgent != null ? $"{prevCa.CollectionAgent.FirstName} {prevCa.CollectionAgent.LastName}".Trim() : "";

                            result.Add(new
                            {
                                deviceId = dev.DeviceId,
                                inspectionRequestId = (int?)latestInspReq.InspectionRequestId,
                                collectionAssignmentId = ca.CollectionAssignmentId,

                                brand = dev.Brand,
                                model = dev.Model,
                                modelNumber = dev.ModelNumber,
                                serialNumber = dev.SerialNumber,
                                purchaseDate = dev.PurchaseDate,
                                deviceQrToken = !string.IsNullOrEmpty(dev.DeviceQrToken) ? dev.DeviceQrToken : $"ECOQR-DEV-{dev.DeviceId}",
                                categoryName = dev.Category?.CategoryName ?? "E-Waste",
                                quantity = dev.Quantity,
                                weight = dev.Weight,
                                condition = dev.Condition,
                                working = dev.Working,
                                physicalDamage = dev.PhysicalDamage,
                                displayCondition = dev.DisplayCondition,
                                batteryCondition = dev.BatteryCondition,
                                accessories = dev.Accessories,
                                charger = dev.Charger,
                                ownership = dev.Ownership,
                                ownershipConfirmed = dev.OwnershipConfirmed,
                                processingPreference = dev.ProcessingPreference,
                                frontPhoto = dev.FrontPhoto,
                                backPhoto = dev.BackPhoto,
                                damagePhoto = dev.DamagePhoto,
                                labelPhoto = dev.LabelPhoto,

                                customerName = dev.User != null ? $"{dev.User.FirstName} {dev.User.LastName}".Trim() : "Citizen",
                                customerPhone = dev.User?.PhoneNumber ?? "",
                                address = dev.Address,
                                landmark = dev.Landmark,
                                city = dev.User?.City ?? "",
                                district = dev.User?.District ?? "",
                                state = dev.User?.State ?? "",
                                pincode = dev.User?.Pincode ?? "",

                                pickupDate = dev.PickupDate,
                                timeSlot = dev.TimeSlot,
                                pickupInstructions = dev.PickupInstructions,

                                status = caStatus,
                                deliveryStatus = delStatus,
                                lifecycleStatus = isInspected ? "Inspected" : dev.LifecycleStatus,
                                requestStatus = isInspected ? "Completed" : latestInspReq.Status,

                                isInspected = isInspected,
                                inspectionCompleted = isInspected,
                                qualityGrade = inspObj?.OverallCondition,
                                overallScore = inspObj?.OverallScore,
                                inspectionStartedAt = inspObj?.InspectionStartedAt ?? (isInspected ? (inspObj?.CreatedAt ?? latestInspReq.CreatedAt) : null),
                                inspectionCompletedAt = inspObj?.InspectionCompletedAt,

                                hasPreviousFailedPickup = hasPreviousFailedPickup,
                                previousFailureReason = previousFailureReason,
                                previousAgentName = previousAgentName,

                                collectionAgentId = ca.CollectionAgentId,
                                collectionAgentName = ca.CollectionAgent != null ? $"{ca.CollectionAgent.FirstName} {ca.CollectionAgent.LastName}".Trim() : "Assigned Agent",
                                collectionAgentPhone = ca.CollectionAgent?.Phone ?? ca.CollectionAgent?.AlternatePhone ?? "",
                                collectionAgentAltPhone = ca.CollectionAgent?.AlternatePhone,
                                collectionAgentPhoto = ca.CollectionAgent?.ProfilePicture,

                                inspectionCenterName = tech.InspectionCenterName ?? "EcoCycle Inspection Hub",
                                technicianAddress = tech.Address,
                                technicianPhone = tech.PhoneNumber,

                                assignedAt = ca.AssignedAt ?? ca.CreatedAt,
                                startedAt = ca.AssignedAt,
                                deliveredAt = delObj?.DeliveredAt,
                                inspectionDeadline = inspObj?.InspectionDeadline ?? (delObj?.DeliveredAt?.AddDays(3) ?? (ca.AssignedAt?.AddDays(3) ?? dev.CreatedAt.AddDays(3))),
                                createdAt = dev.CreatedAt
                            });
                        }
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving technician deliveries.", error = ex.Message });
            }
        }

        [Microsoft.AspNetCore.Authorization.Authorize]
        [HttpPost("confirm-receipt/{assignmentId}")]
        public async Task<IActionResult> ConfirmDeviceReceipt(int assignmentId, [FromBody] ConfirmReceiptDto? dto)
        {
            try
            {
                var ca = await db.CollectionAssignments
                    .Include(a => a.Device)
                        .ThenInclude(d => d.User)
                            .ThenInclude(u => u.Login)
                    .Include(a => a.CollectionAgent)
                        .ThenInclude(agent => agent.Login)
                    .FirstOrDefaultAsync(a => a.CollectionAssignmentId == assignmentId);

                if (ca == null)
                {
                    return NotFound(new { message = "Collection assignment not found." });
                }

                // 1. Update or create Delivery Record
                var delivery = await db.Deliveries
                    .FirstOrDefaultAsync(d => d.CollectionAssignmentId == assignmentId);

                if (delivery == null)
                {
                    delivery = new Delivery
                    {
                        CollectionAssignmentId = assignmentId,
                        Status = "Delivered",
                        StartedAt = DateTime.Now,
                        DeliveredAt = DateTime.Now,
                        DeviceVerified = true,
                        AgentNotes = dto?.Notes ?? "Device received and physically verified by Technician."
                    };
                    db.Deliveries.Add(delivery);
                }
                else
                {
                    delivery.Status = "Delivered";
                    delivery.DeliveredAt = DateTime.Now;
                    delivery.DeviceVerified = true;
                    delivery.HandoverRejectedAt = null;
                    delivery.HandoverRejectionReason = null;
                    if (!string.IsNullOrWhiteSpace(dto?.Notes))
                    {
                        delivery.AgentNotes = dto.Notes;
                    }
                }

                // 2. Update CollectionAssignment Status to DeliveredToCenter
                ca.Status = "DeliveredToCenter";

                // 3. Update or create Inspection Request Status (Waiting -> Assigned)
                var inspReq = await db.InspectionRequest
                    .Where(ir => ir.DeviceId == ca.DeviceId && ir.Status != "Rejected" && ir.Status != "Cancelled")
                    .OrderByDescending(ir => ir.CreatedAt)
                    .FirstOrDefaultAsync();

                if (inspReq == null)
                {
                    var defaultTech = await db.Technician
                        .Where(t => t.Status == "Active" || t.Status == "Approved")
                        .FirstOrDefaultAsync() ?? await db.Technician.FirstOrDefaultAsync();

                    if (defaultTech != null)
                    {
                        inspReq = new InspectionRequest
                        {
                            DeviceId = ca.DeviceId,
                            TechnicianId = defaultTech.TechnicianId,
                            Status = "Assigned",
                            AssignedAt = DateTime.Now,
                            ResponseDeadline = DateTime.Now.AddHours(24),
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
                        };
                        db.InspectionRequest.Add(inspReq);
                        await db.SaveChangesAsync();
                    }
                }
                else
                {
                    if (inspReq.Status == "Waiting" || inspReq.Status == "Pending" || inspReq.Status == "Scheduled")
                    {
                        inspReq.Status = "Assigned";
                    }
                    inspReq.UpdatedAt = DateTime.Now;
                }

                // 4. Update Device Lifecycle Status
                if (ca.Device != null)
                {
                    ca.Device.LifecycleStatus = "AtInspectionCenter";
                    ca.Device.Status = "Assigned";
                }

                // 5. Notify Collection Agent (Notification + Email)
                int agentLoginId = ca.CollectionAgent != null 
                    ? (ca.CollectionAgent.LoginId > 0 ? ca.CollectionAgent.LoginId : (ca.CollectionAgent.Login?.LoginId ?? 0))
                    : 0;

                if (agentLoginId > 0)
                {
                    var agentNotif = new Notification
                    {
                        LoginId = agentLoginId,
                        Title = "Device Handover Approved",
                        Message = $"Technician verified & accepted device handover for {ca.Device?.Brand} {ca.Device?.Model} (Device #{ca.DeviceId}).",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };
                    db.Notification.Add(agentNotif);

                    string agentEmail = ca.CollectionAgent?.Login?.Email ?? "";
                    if (string.IsNullOrWhiteSpace(agentEmail))
                    {
                        var l = await db.Login.FirstOrDefaultAsync(x => x.LoginId == agentLoginId);
                        agentEmail = l?.Email ?? "";
                    }

                    if (!string.IsNullOrWhiteSpace(agentEmail))
                    {
                        string agentFirstName = ca.CollectionAgent?.FirstName ?? "Collection Agent";
                        string agentEmailSub = $"EcoCycle - Handover Accepted: {ca.Device?.Brand} {ca.Device?.Model}";
                        string agentEmailBody = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif;'>
                            <h2 style='color: #059669;'>Device Handover Confirmed</h2>
                            <p>Dear <strong>{agentFirstName}</strong>,</p>
                            <p>The Inspection Officer has verified and accepted the device handover for <strong>{ca.Device?.Brand} {ca.Device?.Model}</strong> (Device ID #{ca.DeviceId}).</p>
                            <p>Delivery Status: <strong>Delivered to Center</strong></p>
                            <p>Thank you for completing this collection delivery!</p>
                        </body>
                        </html>";
                        await SendEmailAsync(agentEmail, agentEmailSub, agentEmailBody);
                    }
                }

                // 6. Notify Citizen (Notification + Email)
                User? citizenUser = ca.Device?.User;
                if (citizenUser == null && ca.Device?.UserId > 0)
                {
                    citizenUser = await db.Users.Include(u => u.Login).FirstOrDefaultAsync(u => u.UserId == ca.Device.UserId);
                }
                int citizenLoginId = citizenUser != null 
                    ? (citizenUser.LoginId > 0 ? citizenUser.LoginId : (citizenUser.Login?.LoginId ?? 0))
                    : 0;

                if (citizenLoginId > 0 && ca.Device != null)
                {
                    var citizenNotif = new Notification
                    {
                        LoginId = citizenLoginId,
                        Title = "Device Delivered & Verified at Hub",
                        Message = $"Your e-waste device ({ca.Device.Brand} {ca.Device.Model}) has been safely received and verified by our Inspection Officer.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };
                    db.Notification.Add(citizenNotif);

                    string citizenEmail = citizenUser?.Login?.Email ?? "";
                    if (string.IsNullOrWhiteSpace(citizenEmail))
                    {
                        var l = await db.Login.FirstOrDefaultAsync(x => x.LoginId == citizenLoginId);
                        citizenEmail = l?.Email ?? "";
                    }

                    if (!string.IsNullOrWhiteSpace(citizenEmail))
                    {
                        string citizenFirstName = citizenUser?.FirstName ?? "Valued Customer";
                        string citizenEmailSub = $"EcoCycle - Device Received at Inspection Hub";
                        string citizenEmailBody = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif;'>
                            <h2 style='color: #059669;'>Device Delivered to Inspection Center</h2>
                            <p>Dear <strong>{citizenFirstName}</strong>,</p>
                            <p>Your listed e-waste device <strong>{ca.Device.Brand} {ca.Device.Model}</strong> has arrived at our inspection facility and was successfully verified by the Inspection Officer.</p>
                            <p>Our team will now perform technical evaluations and recycling processing.</p>
                        </body>
                        </html>";
                        await SendEmailAsync(citizenEmail, citizenEmailSub, citizenEmailBody);
                    }
                }

                // 7. Add or update entry in db.Inspection when device is accepted from Collection Agent
                DateTime deadline = DateTime.Now.AddDays(3);
                int targetTechId = inspReq?.TechnicianId ?? 0;
                if (targetTechId <= 0)
                {
                    var activeTech = await db.Technician.FirstOrDefaultAsync(t => t.Status == "Active" || t.Status == "Approved")
                                     ?? await db.Technician.FirstOrDefaultAsync();
                    if (activeTech != null) targetTechId = activeTech.TechnicianId;
                }

                if (inspReq != null && targetTechId > 0)
                {
                    var existingInsp = await db.Inspection
                        .FirstOrDefaultAsync(i => i.InspectionRequestId == inspReq.InspectionRequestId || i.DeviceId == ca.DeviceId);

                    if (existingInsp == null)
                    {
                        var newInsp = new Inspection
                        {
                            InspectionRequestId = inspReq.InspectionRequestId,
                            DeviceId = ca.DeviceId,
                            TechnicianId = targetTechId,
                            Status = "Pending",
                            InspectionDeadline = deadline,
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
                        };
                        db.Inspection.Add(newInsp);
                    }
                    else
                    {
                        existingInsp.TechnicianId = targetTechId;
                        if (existingInsp.InspectionDeadline.HasValue)
                        {
                            deadline = existingInsp.InspectionDeadline.Value;
                        }
                        else
                        {
                            existingInsp.InspectionDeadline = deadline;
                        }
                        existingInsp.UpdatedAt = DateTime.Now;
                    }
                }

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Device received and confirmed successfully!",
                    deliveryStatus = "Delivered",
                    inspectionStatus = inspReq?.Status ?? "Assigned",
                    inspectionDeadline = deadline,
                    receivedAt = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error confirming device receipt.", error = ex.Message });
            }
        }

        [Microsoft.AspNetCore.Authorization.Authorize]
        [HttpPost("reject-handover/{assignmentId}")]
        public async Task<IActionResult> RejectDeviceHandover(int assignmentId, [FromBody] RejectHandoverDto? dto)
        {
            try
            {
                var ca = await db.CollectionAssignments
                    .Include(a => a.Device)
                        .ThenInclude(d => d.User)
                            .ThenInclude(u => u.Login)
                    .Include(a => a.CollectionAgent)
                        .ThenInclude(agent => agent.Login)
                    .FirstOrDefaultAsync(a => a.CollectionAssignmentId == assignmentId);

                if (ca == null)
                {
                    return NotFound(new { message = "Collection assignment not found." });
                }

                string reason = !string.IsNullOrWhiteSpace(dto?.Reason) ? dto.Reason : "Handover Rejected";
                string description = dto?.Description ?? "";

                // 1. Update or create Delivery Record
                var delivery = await db.Deliveries
                    .FirstOrDefaultAsync(d => d.CollectionAssignmentId == assignmentId);

                if (delivery == null)
                {
                    delivery = new Delivery
                    {
                        CollectionAssignmentId = assignmentId,
                        Status = "HandoverRejected",
                        StartedAt = DateTime.Now,
                        DeviceVerified = false,
                        HandoverRejectedAt = DateTime.Now,
                        HandoverRejectionReason = reason,
                        TechnicianNotes = description
                    };
                    db.Deliveries.Add(delivery);
                }
                else
                {
                    delivery.Status = "HandoverRejected";
                    delivery.DeviceVerified = false;
                    delivery.HandoverRejectedAt = DateTime.Now;
                    delivery.HandoverRejectionReason = reason;
                    delivery.TechnicianNotes = description;
                }

                // 2. Update CollectionAssignment Status
                ca.Status = "HandoverRejected";

                // 3. Update Device Lifecycle Status
                if (ca.Device != null)
                {
                    ca.Device.LifecycleStatus = "HandoverRejected";
                }

                // 4. Notify Collection Agent (Notification + Email)
                int agentLoginId = ca.CollectionAgent != null 
                    ? (ca.CollectionAgent.LoginId > 0 ? ca.CollectionAgent.LoginId : (ca.CollectionAgent.Login?.LoginId ?? 0))
                    : 0;

                if (agentLoginId > 0)
                {
                    var agentNotif = new Notification
                    {
                        LoginId = agentLoginId,
                        Title = "⚠️ Technician Rejected Device Handover",
                        Message = $"Technician rejected device handover for {ca.Device?.Brand} {ca.Device?.Model}. Reason: {reason}. Notes: {description}",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };
                    db.Notification.Add(agentNotif);

                    string agentEmail = ca.CollectionAgent?.Login?.Email ?? "";
                    if (string.IsNullOrWhiteSpace(agentEmail))
                    {
                        var l = await db.Login.FirstOrDefaultAsync(x => x.LoginId == agentLoginId);
                        agentEmail = l?.Email ?? "";
                    }

                    if (!string.IsNullOrWhiteSpace(agentEmail))
                    {
                        string agentFirstName = ca.CollectionAgent?.FirstName ?? "Collection Agent";
                        string agentEmailSub = $"⚠️ Action Required: Handover Rejected for {ca.Device?.Brand} {ca.Device?.Model}";
                        string agentEmailBody = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif;'>
                            <h2 style='color: #dc2626;'>Technician Rejected Device Handover</h2>
                            <p>Dear <strong>{agentFirstName}</strong>,</p>
                            <p>The Inspection Officer rejected the device handover for <strong>{ca.Device?.Brand} {ca.Device?.Model}</strong> (Device ID #{ca.DeviceId}).</p>
                            <p><strong>Reason:</strong> <span style='color: #dc2626; font-weight: bold;'>{reason}</span></p>
                            {(string.IsNullOrWhiteSpace(description) ? "" : $"<p><strong>Technician Notes:</strong> {description}</p>")}
                            <p>Please review and resolve the issue with the device or contact the customer / inspection officer.</p>
                        </body>
                        </html>";
                        await SendEmailAsync(agentEmail, agentEmailSub, agentEmailBody);
                    }
                }

                // 5. Notify Citizen (Notification)
                User? citizenUser = ca.Device?.User;
                if (citizenUser == null && ca.Device?.UserId > 0)
                {
                    citizenUser = await db.Users.Include(u => u.Login).FirstOrDefaultAsync(u => u.UserId == ca.Device.UserId);
                }
                int citizenLoginId = citizenUser != null 
                    ? (citizenUser.LoginId > 0 ? citizenUser.LoginId : (citizenUser.Login?.LoginId ?? 0))
                    : 0;

                if (citizenLoginId > 0 && ca.Device != null)
                {
                    var citizenNotif = new Notification
                    {
                        LoginId = citizenLoginId,
                        Title = "Handover Discrepancy Reported",
                        Message = $"Inspection officer reported an issue ({reason}) during handover for your {ca.Device.Brand} {ca.Device.Model}. Collection agent is reviewing.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };
                    db.Notification.Add(citizenNotif);
                }

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Device handover rejection recorded successfully.",
                    deliveryStatus = "HandoverRejected",
                    reason = reason,
                    rejectedAt = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error rejecting device handover.", error = ex.Message });
            }
        }

        [HttpPost("accept/{requestId}")]
        public async Task<IActionResult> AcceptRequest(int requestId)
        {
            await CheckAndUpdateExpiredInspectionRequests();

            using var transaction =
                await db.Database.BeginTransactionAsync();

            try
            {
                var request = await db.InspectionRequest
                    .Include(x => x.Device)
                        .ThenInclude(d => d.User)
                    .Include(x => x.Device)
                        .ThenInclude(d => d.Category)
                    .FirstOrDefaultAsync(
                        x => x.InspectionRequestId == requestId
                    );

                if (request == null)
                {
                    return NotFound(new
                    {
                        message = "Inspection request not found."
                    });
                }

                if (string.Equals(request.Status, "Expired", StringComparison.OrdinalIgnoreCase) ||
                    (request.ResponseDeadline.HasValue && request.ResponseDeadline.Value < DateTime.Now))
                {
                    if (request.Status == "Assigned")
                    {
                        request.Status = "Expired";
                        request.UpdatedAt = DateTime.Now;
                        if (request.Device != null)
                        {
                            request.Device.LifecycleStatus = "InspectionExpired";
                        }
                        await db.SaveChangesAsync();
                    }

                    return BadRequest(new
                    {
                        message = "Response deadline has expired for this inspection request."
                    });
                }

                if (!string.Equals(request.Status, "Assigned", StringComparison.OrdinalIgnoreCase))
                {
                    if (string.Equals(request.Status, "Accepted", StringComparison.OrdinalIgnoreCase))
                    {
                        return Ok(new
                        {
                            message = "Inspection request is already accepted.",
                            inspectionStatus = request.Status
                        });
                    }

                    return BadRequest(new
                    {
                        message = $"This request cannot be accepted because its status is '{request.Status}'."
                    });
                }

                request.Status = "Accepted";
                request.RespondedAt = DateTime.Now;
                request.UpdatedAt = DateTime.Now;

                var existingAssignment =
                    await db.CollectionAssignments
                    .FirstOrDefaultAsync(
                        x => x.DeviceId == request.DeviceId &&
                             x.Status != "Rejected" &&
                             x.Status != "Cancelled" &&
                             x.Status != "DeliveredToCenter" &&
                             x.Status != "Delivered" &&
                             x.Status != "Completed" &&
                             x.Status != "Reassigned" &&
                             x.Status != "Expired"
                    );

                if (existingAssignment != null)
                {
                    await db.SaveChangesAsync();

                    await transaction.CommitAsync();

                    return Ok(new
                    {
                        message =
                            "Inspection accepted. Collection agent was already assigned.",

                        inspectionStatus =
                            request.Status,

                        collectionAssignmentId =
                            existingAssignment.CollectionAssignmentId,

                        collectionStatus =
                            existingAssignment.Status
                    });
                }

                var agent =await FindBestCollectionAgent(request.Device);

                if (agent == null)
                {
                    var waitingAssignment = new CollectionAssignment
                    {
                        DeviceId = request.DeviceId,
                        CollectionAgentId = null,
                        AssignmentType = "CustomerToTechnician",
                        SourceType = "Customer",
                        DestinationType = "Technician Center",
                        Status = "Waiting",
                        AssignedAt = null,
                        ResponseDeadline = DateTime.Now.AddHours(24),
                        CreatedAt = DateTime.Now
                    };

                    db.CollectionAssignments.Add(waitingAssignment);

                    await db.SaveChangesAsync();

                    await transaction.CommitAsync();

                    return Ok(new
                    {
                        message =
                            "Technician accepted. No collection agent currently available. Pickup request moved to Waiting.",

                        inspectionStatus =
                            request.Status,

                        collectionAssignmentId =
                            waitingAssignment.CollectionAssignmentId,

                        collectionStatus =
                            waitingAssignment.Status
                    });
                }
                var assignment = new CollectionAssignment
                {
                    DeviceId =
                        request.DeviceId,

                    CollectionAgentId =
                        agent.CollectionAgentId,

                    AssignmentType =
                        "CustomerToTechnician",

                    SourceType =
                        "Customer",

                    DestinationType =
                        "Technician Center",

                    Status =
                        "Assigned",

                    AssignedAt =
                        DateTime.Now,

                    ResponseDeadline =
                        DateTime.Now.AddHours(24),

                    CreatedAt =
                        DateTime.Now
                };

                db.CollectionAssignments.Add(
                    assignment
                );

                await db.SaveChangesAsync();

                if (agent != null && agent.LoginId > 0)
                {
                    var notification = new Notification
                    {
                        LoginId = agent.LoginId,
                        Title = "New Pickup Request Assigned",
                        Message = $"A new pickup request for {request.Device.Brand} {request.Device.Model} has been assigned to you.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };

                    db.Notification.Add(notification);
                    await db.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                Console.WriteLine("====================================");
                Console.WriteLine("COLLECTION AGENT EMAIL DEBUG");
                Console.WriteLine($"Agent ID: {agent.CollectionAgentId}");
                Console.WriteLine($"Agent Name: {agent.FirstName} {agent.LastName}");
                Console.WriteLine($"Login is null: {agent.Login == null}");
                Console.WriteLine($"Agent Email: {agent.Login?.Email}");
                Console.WriteLine("====================================");
                string agentEmail = agent.Login?.Email;
                if (string.IsNullOrWhiteSpace(agentEmail) && agent != null && agent.LoginId > 0)
                {
                    var loginObj = await db.Login.FirstOrDefaultAsync(l => l.LoginId == agent.LoginId);
                    agentEmail = loginObj?.Email;
                }

                if (!string.IsNullOrWhiteSpace(agentEmail))
                {
                    string subject = "EcoCycle - New Collection Pickup Request Assigned";

                    var dev = request.Device;
                    string fullAddress = dev.Address +
                        (string.IsNullOrWhiteSpace(dev.User?.City) ? "" : $", {dev.User?.City}") +
                        (string.IsNullOrWhiteSpace(dev.User?.District) ? "" : $", {dev.User?.District}") +
                        (string.IsNullOrWhiteSpace(dev.User?.State) ? "" : $", {dev.User?.State}") +
                        (string.IsNullOrWhiteSpace(dev.User?.Pincode) ? "" : $" - {dev.User?.Pincode}");

                    var tech = request.Technician;
                    if (tech == null && request.TechnicianId > 0)
                    {
                        tech = await db.Technician.FirstOrDefaultAsync(t => t.TechnicianId == request.TechnicianId);
                    }
                    if (tech == null)
                    {
                        tech = await db.Technician.Where(t => t.Status == "Approved" || t.Status == "Active").OrderBy(t => t.TechnicianId).FirstOrDefaultAsync() ?? await db.Technician.OrderBy(t => t.TechnicianId).FirstOrDefaultAsync();
                    }

                    string tName = tech != null ? $"{tech.FirstName} {tech.LastName}".Trim() : "Inspection Technician";
                    string tPhone = tech?.PhoneNumber ?? "";
                    string cName = tech?.InspectionCenterName ?? "EcoCycle Central Inspection Center";
                    var tParts = new List<string>();
                    if (tech != null)
                    {
                        if (!string.IsNullOrWhiteSpace(tech.InspectionCenterName)) tParts.Add(tech.InspectionCenterName);
                        if (!string.IsNullOrWhiteSpace(tech.Address)) tParts.Add(tech.Address);
                        if (!string.IsNullOrWhiteSpace(tech.City)) tParts.Add(tech.City);
                        if (!string.IsNullOrWhiteSpace(tech.District)) tParts.Add(tech.District);
                        if (!string.IsNullOrWhiteSpace(tech.State)) tParts.Add(tech.State);
                        if (!string.IsNullOrWhiteSpace(tech.PinCode)) tParts.Add(tech.PinCode);
                    }
                    string delAddress = tParts.Any() ? string.Join(", ", tParts) : "EcoCycle Central E-Waste Facility & Inspection Hub";

                    string body = $@"
<!DOCTYPE html>
<html>
<body style=""font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; color: #0f172a;"">
    <div style=""max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;"">
        <h2 style=""color: #059669; margin-top: 0;"">EcoCycle Pickup Assignment</h2>
        <p>Dear <strong>{agent.FirstName} {agent.LastName}</strong>,</p>
        <p>A new e-waste collection pickup request for <strong>{dev.Brand} {dev.Model}</strong> (Assignment #{assignment.CollectionAssignmentId}) has been assigned to you.</p>

        <div style=""background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 10px; margin-top: 16px;"">
            <div style=""font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.05em;"">COLLECT FROM</div>
            <div style=""font-weight: 700; color: #065f46; font-size: 15px; margin-top: 4px;"">Customer: {dev.User?.FirstName} {dev.User?.LastName} (Ph: {dev.User?.PhoneNumber})</div>
            <div style=""color: #047857; font-size: 14px; margin-top: 4px;""><strong>Customer pickup address:</strong> {fullAddress}</div>
            <div style=""color: #059669; font-size: 13px; margin-top: 4px;""><strong>Pickup date / time slot:</strong> {dev.PickupDate:dd-MM-yyyy} • {dev.TimeSlot}</div>
        </div>

        <div style=""text-align: center; font-size: 24px; font-weight: bold; color: #059669; margin: 10px 0;"">↓</div>

        <div style=""background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 10px;"">
            <div style=""font-size: 11px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.05em;"">DELIVER TO</div>
            <div style=""font-weight: 700; color: #1e40af; font-size: 15px; margin-top: 4px;"">Technician / Inspection Center: {tName} ({cName}) {(string.IsNullOrEmpty(tPhone) ? "" : $"• Ph: {tPhone}")}</div>
            <div style=""color: #1e3a8a; font-size: 14px; margin-top: 4px;""><strong>Technician/center address:</strong> {delAddress}</div>
        </div>

        <div style=""margin-top: 24px; text-align: center;"">
            <a href=""https://ewaste-management-ecocycle-gbc9-sepia.vercel.app/collectionagent/pickups"" style=""background: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; display: inline-block;"">[ View & Start Pickup ]</a>
        </div>

        <p style=""margin-top: 24px; font-size: 12px; color: #64748b;"">
            Regards,<br/><strong>EcoCycle Admin Team</strong>
        </p>
    </div>
</body>
</html>";

                    await SendEmailAsync(agentEmail, subject, body);
                }
                else
                {
                    Console.WriteLine(
                        $"EMAIL NOT SENT: Collection agent {agent.CollectionAgentId} has no Login/Email."
                    );
                }

                return Ok(new
                {
                    message =
                        "Technician accepted and collection agent automatically assigned.",

                    inspectionStatus =
                        request.Status,

                    collectionAssignmentId =
                        assignment.CollectionAssignmentId,

                    collectionAgentId =
                        agent.CollectionAgentId,

                    collectionAgentName =
                        agent.FirstName + " " + agent.LastName,

                    collectionStatus =
                        assignment.Status
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message =
                        "Error accepting inspection request.",

                    error =
                        ex.Message
                });
            }
        }
        private async Task<CollectionAgent?> FindBestCollectionAgent(Device device)
        {
            var agents = await db.CollectionAgents
                .Include(x => x.Login)
                .Where(x => x.Status == "Active")
                .ToListAsync();

            if (!agents.Any())
                return null;

            var candidates = new List<(CollectionAgent Agent, int Workload)>();

            foreach (var agent in agents)
            {
                // Strict State match
                if (!string.IsNullOrWhiteSpace(device.User?.State) &&
                    !string.IsNullOrWhiteSpace(agent.State))
                {
                    if (!device.User.State.Trim().Equals(
                            agent.State.Trim(),
                            StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }
                }

                // Strict District match
                if (!string.IsNullOrWhiteSpace(device.User?.District) &&
                    !string.IsNullOrWhiteSpace(agent.District))
                {
                    if (!device.User.District.Trim().Equals(
                            agent.District.Trim(),
                            StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }
                }

                int workload = await db.CollectionAssignments.CountAsync(x =>
                    x.CollectionAgentId == agent.CollectionAgentId &&
                    (
                        x.Status == "Assigned" ||
                        x.Status == "Accepted" ||
                        x.Status == "PickupStarted"
                    )
                );

                if (workload >= 5)
                    continue;

                candidates.Add((agent, workload));
            }

            return candidates
                .OrderBy(x => x.Workload)
                .Select(x => x.Agent)
                .FirstOrDefault();
        }
        [HttpPost("reject/{requestId}")]
        public async Task<IActionResult> RejectRequest(int requestId,[FromBody] string reason)
        {
            using var transaction =
                await db.Database.BeginTransactionAsync();

            try
            {
                var request = await db.InspectionRequest
                    .Include(x => x.Device)
                        .ThenInclude(d => d.Category)
                    .Include(x => x.Device)
                        .ThenInclude(d => d.User)
                    .Include(x => x.Technician)
                        .ThenInclude(t => t.Login)
                    .FirstOrDefaultAsync(
                        x => x.InspectionRequestId == requestId
                    );

                if (request == null)
                {
                    return NotFound(new
                    {
                        message = "Inspection request not found."
                    });
                }

                if (!string.Equals(request.Status, "Assigned", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new
                    {
                        message = $"This request cannot be rejected because its status is '{request.Status}'."
                    });
                }

                if (request.Technician == null)
                {
                    return BadRequest(new
                    {
                        message =
                            "No technician is assigned to this inspection request."
                    });
                }

                if (string.IsNullOrWhiteSpace(reason))
                {
                    return BadRequest(new
                    {
                        message = "Rejection reason is required."
                    });
                }

                // =========================================================
                // 1. SAVE THE CURRENT TECHNICIAN'S REJECTION
                // =========================================================

                var rejection = new AllocationRejection
                {
                    AllocationType = "Technician",

                    // The inspection request this rejection belongs to
                    AllocationId = request.InspectionRequestId,

                    // The LoginId of the technician who rejected
                    LoginId = request.Technician.LoginId,

                    Reason = reason.Trim(),

                    RejectedAt = DateTime.Now
                };

                db.AllocationRejections.Add(rejection);

                // =========================================================
                // 2. MARK CURRENT REQUEST AS REJECTED
                // =========================================================

                int oldTechnicianId =
                    request.TechnicianId ?? 0;

                request.Status = "Rejected";
                request.RejectionReason = reason.Trim();
                request.RespondedAt = DateTime.Now;
                request.UpdatedAt = DateTime.Now;

                // =========================================================
                // 3. FIND ANOTHER TECHNICIAN
                //    - Excludes current technician
                //    - Excludes all previously rejected technicians for this device
                //    - Checks specialization
                //    - Checks workload
                // =========================================================

                var newTechnician =
                    await FindAnotherTechnician(
                        request.Device,
                        oldTechnicianId,
                        request.DeviceId
                    );

                // =========================================================
                // 4. NO TECHNICIAN AVAILABLE -> CREATE WAITING REQUEST
                // =========================================================

                if (newTechnician == null)
                {
                    var waitingRequest = new InspectionRequest
                    {
                        DeviceId = request.DeviceId,
                        TechnicianId = null,
                        Status = "Waiting",
                        AssignedAt = null,
                        ResponseDeadline = null,
                        RespondedAt = null,
                        RejectionReason = null,
                        ReassignmentCount = request.ReassignmentCount + 1,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };

                    db.InspectionRequest.Add(waitingRequest);

                    request.Device.LifecycleStatus =
                        "InspectionPending";

                    await db.SaveChangesAsync();

                    await transaction.CommitAsync();

                    return Ok(new
                    {
                        message =
                            "Technician rejection recorded. No suitable technician found. Request moved to Waiting.",

                        status = "Waiting",

                        inspectionRequestId =
                            waitingRequest.InspectionRequestId,

                        reassignmentCount =
                            waitingRequest.ReassignmentCount
                    });
                }

                // =========================================================
                // 5. CREATE NEW INSPECTION REQUEST FOR NEW TECHNICIAN
                // =========================================================

                var newRequest = new InspectionRequest
                {
                    DeviceId = request.DeviceId,
                    TechnicianId = newTechnician.TechnicianId,
                    Status = "Assigned",
                    AssignedAt = DateTime.Now,
                    ResponseDeadline = DateTime.Now.AddHours(24),
                    RespondedAt = null,
                    RejectionReason = null,
                    ReassignmentCount = request.ReassignmentCount + 1,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                db.InspectionRequest.Add(newRequest);

                request.Device.LifecycleStatus =
                    "InspectionAssigned";

                // Save rejection + new request entry
                await db.SaveChangesAsync();

                if (newTechnician.Login != null)
                {
                    var notification = new Notification
                    {
                        LoginId = newTechnician.LoginId,

                        Title = "New Inspection Request Assigned",

                        Message = $"A new inspection request for {request.Device.Brand} {request.Device.Model} has been reassigned to you.",

                        Isread = false,

                        CreatedAt = DateTime.Now
                    };

                    db.Notification.Add(notification);

                    await db.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                // =========================================================
                // 6. SEND EMAIL TO NEW TECHNICIAN
                // =========================================================

                if (newTechnician.Login != null &&
                    !string.IsNullOrWhiteSpace(
                        newTechnician.Login.Email))
                {
                    string technicianEmail =
                        newTechnician.Login.Email;

                    string subject =
                        "EcoCycle - Inspection Request Reassigned";

                    string body = $@"
<html>
<body>

    <h2>Inspection Request Reassigned</h2>

    <p>
        Dear {newTechnician.FirstName} {newTechnician.LastName},
    </p>

    <p>
        A new e-waste inspection request has been
        assigned to you through the EcoCycle platform.
    </p>

    <p>
        The previous technician rejected the request,
        so it has been automatically reassigned to you.
    </p>

    <h3>Inspection Details</h3>

    <p>
        <strong>Inspection Request ID:</strong>
        {newRequest.InspectionRequestId}
    </p>

    <p>
        <strong>Device ID:</strong>
        {newRequest.DeviceId}
    </p>

    <p>
        <strong>Category:</strong>
        {request.Device.Category?.CategoryName ?? "E-Waste"}
    </p>

    <p>
        <strong>Brand:</strong>
        {request.Device.Brand}
    </p>

    <p>
        <strong>Model:</strong>
        {request.Device.Model}
    </p>

    <p>
        <strong>Condition:</strong>
        {request.Device.Condition}
    </p>

    <p>
        <strong>Response Deadline:</strong>
        {newRequest.ResponseDeadline:dd-MM-yyyy hh:mm tt}
    </p>

    <p>
        Please log in to your EcoCycle technician account
        and respond to this inspection request.
    </p>

    <br />

    <p>
        Regards,<br />
        <strong>EcoCycle Admin Team</strong>
    </p>

</body>
</html>";

                    await SendEmailAsync(
                        technicianEmail,
                        subject,
                        body
                    );
                }

                // =========================================================
                // 7. RETURN RESPONSE
                // =========================================================

                return Ok(new
                {
                    message =
                        "Request automatically reassigned to another technician.",

                    inspectionRequestId =
                        newRequest.InspectionRequestId,

                    previousTechnicianId =
                        oldTechnicianId,

                    technicianId =
                        newTechnician.TechnicianId,

                    technicianName =
                        $"{newTechnician.FirstName} {newTechnician.LastName}",

                    technicianEmail =
                        newTechnician.Login?.Email,

                    status =
                        newRequest.Status,

                    reassignmentCount =
                        newRequest.ReassignmentCount
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message =
                        "Error rejecting and reassigning inspection request.",

                    error = ex.Message
                });
            }
        }
        private async Task<Technician?> FindAnotherTechnician(
    Device device,
    int excludedTechnicianId,
    int deviceId)
        {
            // =========================================================
            // GET ALL TECHNICIANS WHO HAVE ALREADY REJECTED THIS DEVICE
            // =========================================================

            var inspectionRequestIds =
                await db.InspectionRequest
                    .Where(x => x.DeviceId == deviceId)
                    .Select(x => x.InspectionRequestId)
                    .ToListAsync();

            var rejectedTechIds =
                await db.InspectionRequest
                    .Where(x => x.DeviceId == deviceId &&
                                x.TechnicianId.HasValue &&
                                x.Status == "Rejected")
                    .Select(x => x.TechnicianId!.Value)
                    .ToListAsync();

            var rejectedLoginIds =
                await db.AllocationRejections
                    .Where(x =>
                        x.AllocationType == "Technician" &&
                        inspectionRequestIds.Contains(x.AllocationId))
                    .Select(x => x.LoginId)
                    .Distinct()
                    .ToListAsync();

            Console.WriteLine(
                "=========================================="
            );

            Console.WriteLine(
                $"Device ID: {deviceId}"
            );

            Console.WriteLine(
                "Previously rejected Login IDs:"
            );

            foreach (var loginId in rejectedLoginIds)
            {
                Console.WriteLine(
                    $"Rejected LoginId: {loginId}"
                );
            }

            Console.WriteLine(
                "=========================================="
            );

            // =========================================================
            // GET ACTIVE TECHNICIANS
            // EXCLUDE:
            // 1. CURRENT/OLD TECHNICIAN
            // 2. EVERY TECHNICIAN WHO ALREADY REJECTED
            // 3. TECHNICIANS WITH UNPAID/PENDING FINES
            // =========================================================

            var penalizedTechIds = await db.technicianPenalties
                .Where(p => p.Status == "Pending" || p.Status == "Unpaid")
                .Select(p => p.TechnicianId)
                .Distinct()
                .ToListAsync();

            var technicians = await db.Technician
                .Include(t => t.Login)
                .Where(t => (t.Status == "Active" || t.Status == "Approved") &&
                            t.TechnicianId != excludedTechnicianId &&
                            !rejectedTechIds.Contains(t.TechnicianId) &&
                            !rejectedLoginIds.Contains(t.LoginId) &&
                            !penalizedTechIds.Contains(t.TechnicianId))
                .ToListAsync();

            if (!technicians.Any())
            {
                // Fallback: any active/approved technician if all non-rejected ones are excluded
                technicians = await db.Technician
                    .Include(t => t.Login)
                    .Where(t => (t.Status == "Active" || t.Status == "Approved") && !penalizedTechIds.Contains(t.TechnicianId))
                    .ToListAsync();
            }

            if (!technicians.Any())
            {
                // Ultimate fallback: any technician in system without unpaid fine
                technicians = await db.Technician
                    .Include(t => t.Login)
                    .Where(t => !penalizedTechIds.Contains(t.TechnicianId))
                    .ToListAsync();
            }

            if (!technicians.Any())
            {
                Console.WriteLine("NO TECHNICIANS IN DATABASE (OR ALL HAVE UNPAID FINES)");
                return null;
            }

            var scoredCandidates = new List<(Technician Technician, int Score, int Workload)>();

            foreach (var technician in technicians)
            {
                int score = 100; // Base Score

                // 1. Specialization Match (+50 Points)
                if (!string.IsNullOrWhiteSpace(device.Category?.CategoryName) &&
                    !string.IsNullOrWhiteSpace(technician.Specialization))
                {
                    if (technician.Specialization.Contains(device.Category.CategoryName, StringComparison.OrdinalIgnoreCase))
                    {
                        score += 50;
                    }
                }

                // 2. District Match (+40 Points)
                if (device.User != null &&
                    !string.IsNullOrWhiteSpace(device.User.District) &&
                    !string.IsNullOrWhiteSpace(technician.District))
                {
                    if (device.User.District.Trim().Equals(technician.District.Trim(), StringComparison.OrdinalIgnoreCase))
                    {
                        score += 40;
                    }
                }

                // 3. State Match (+30 Points)
                if (device.User != null &&
                    !string.IsNullOrWhiteSpace(device.User.State) &&
                    !string.IsNullOrWhiteSpace(technician.State))
                {
                    if (device.User.State.Trim().Equals(technician.State.Trim(), StringComparison.OrdinalIgnoreCase))
                    {
                        score += 30;
                    }
                }

                // 4. Current Workload Penalty (-10 Points per active task)
                int workload = await db.InspectionRequest
                    .CountAsync(x => x.TechnicianId == technician.TechnicianId &&
                                     (x.Status == "Assigned" || x.Status == "Accepted" || x.Status == "InProgress"));

                score -= (workload * 10);

                scoredCandidates.Add((technician, score, workload));
            }

            var selected = scoredCandidates
                .OrderByDescending(x => x.Score)
                .ThenBy(x => x.Workload)
                .Select(x => x.Technician)
                .FirstOrDefault();

            if (selected != null)
            {
                Console.WriteLine($"Selected Technician: {selected.TechnicianId} - {selected.FirstName} {selected.LastName}");
            }

            return selected;
        }
        [HttpGet("admin/assignments")]
        public async Task<IActionResult> GetAllAssignments()
        {
            await CheckAndUpdateExpiredInspectionRequests();
            await CollectionAssignmentController.CheckAndUpdateExpiredCollectionAssignments(db);

            // Database sync for completed inspections
            try
            {
                var completedInspections = await db.Inspection
                    .Where(i => i.Status == "Completed" || i.InspectionCompletedAt != null)
                    .ToListAsync();

                if (completedInspections.Any())
                {
                    var reqIds = completedInspections.Select(ci => ci.InspectionRequestId).Where(id => id > 0).ToList();
                    var devIds = completedInspections.Select(ci => ci.DeviceId).Where(id => id > 0).ToList();

                    var reqsToUpdate = await db.InspectionRequest
                        .Where(r => (reqIds.Contains(r.InspectionRequestId) || devIds.Contains(r.DeviceId)) && r.Status != "Completed" && r.Status != "Rejected" && r.Status != "Cancelled")
                        .ToListAsync();

                    bool changed = false;
                    foreach (var req in reqsToUpdate)
                    {
                        req.Status = "Completed";
                        req.UpdatedAt = DateTime.Now;
                        changed = true;
                    }

                    if (changed)
                    {
                        await db.SaveChangesAsync();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error syncing completed inspection requests: " + ex.Message);
            }

            var rawAssignments = await db.InspectionRequest
                .Include(x => x.Device)
                    .ThenInclude(d => d.Category)
                .Include(x => x.Device)
                    .ThenInclude(d => d.User)
                .Include(x => x.Technician)
                    .ThenInclude(t => t.Login)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            var deviceIds = rawAssignments.Select(a => a.DeviceId).ToList();
            var inspectionList = await db.Inspection
                .Where(i => deviceIds.Contains(i.DeviceId))
                .ToListAsync();

            DateTime now = DateTime.Now;

            var assignments = rawAssignments.Select(x => {
                var insp = inspectionList.FirstOrDefault(i => i.InspectionRequestId == x.InspectionRequestId) ?? inspectionList.FirstOrDefault(i => i.InspectionRequestId == 0 && i.DeviceId == x.DeviceId);
                DateTime? deadline = insp?.InspectionDeadline;
                bool isCompleted = string.Equals(x.Status, "Completed", StringComparison.OrdinalIgnoreCase) ||
                                   string.Equals(x.Device?.LifecycleStatus, "Inspected", StringComparison.OrdinalIgnoreCase) ||
                                   (insp != null && (string.Equals(insp.Status, "Completed", StringComparison.OrdinalIgnoreCase) || insp.InspectionCompletedAt != null || !string.IsNullOrEmpty(insp.OverallCondition) || insp.OverallScore > 0));
                bool isOverdue = deadline.HasValue && deadline.Value < now && !isCompleted;

                string statusToReturn = (insp != null && string.Equals(insp.Status, "Penalized", StringComparison.OrdinalIgnoreCase))
                    ? "Penalized"
                    : (isCompleted ? "Completed" : x.Status);

                return new
                {
                    inspectionRequestId = x.InspectionRequestId,

                    deviceId = x.DeviceId,
                    brand = x.Device != null ? x.Device.Brand : "",
                    model = x.Device != null ? x.Device.Model : "",
                    category = x.Device?.Category != null ? x.Device.Category.CategoryName : "E-Waste",

                    userName = x.Device?.User != null ? x.Device.User.FirstName + " " + x.Device.User.LastName : "N/A",

                    technicianId = x.TechnicianId,
                    technicianName = x.Technician != null
                        ? x.Technician.FirstName + " " + x.Technician.LastName
                        : null,

                    technicianEmail = x.Technician?.Login != null
                        ? x.Technician.Login.Email
                        : null,

                    status = statusToReturn,

                    assignedAt = x.AssignedAt,
                    responseDeadline = x.ResponseDeadline,
                    inspectionDeadline = deadline,
                    isInspectionOverdue = isOverdue,
                    extensionCount = insp != null ? insp.ExtensionCount : 0,

                    rejectionReason = x.RejectionReason,
                    reassignmentCount = x.ReassignmentCount,

                    lifecycleStatus = isCompleted ? (x.Device?.LifecycleStatus ?? "Inspected") : x.Device?.LifecycleStatus,
                    isInspected = isCompleted,
                    qualityGrade = insp?.OverallCondition,
                    overallScore = insp?.OverallScore
                };
            }).ToList();

            return Ok(assignments);
        }

        [HttpPost("admin/extend-deadline/{deviceId}")]
        public async Task<IActionResult> ExtendInspectionDeadline(int deviceId, [FromQuery] int hours = 24)
        {
            var device = await db.Device
                .Include(d => d.Category)
                .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

            if (device == null)
            {
                return NotFound(new { message = $"Device #{deviceId} not found." });
            }

            var inspReq = await db.InspectionRequest
                .Include(r => r.Technician)
                    .ThenInclude(t => t.Login)
                .Where(r => r.DeviceId == deviceId && r.Status != "Rejected" && r.Status != "Cancelled")
                .OrderByDescending(r => r.CreatedAt)
                .FirstOrDefaultAsync();

            if (inspReq == null)
            {
                return NotFound(new { message = $"No active inspection request found for device #{deviceId}." });
            }

            var inspection = await db.Inspection
                .FirstOrDefaultAsync(i => i.DeviceId == deviceId || i.InspectionRequestId == inspReq.InspectionRequestId);

            if (inspection != null && inspection.ExtensionCount >= 2)
            {
                return BadRequest(new { message = "Maximum limit of two 24-hour extensions reached for this device inspection. Further extensions are not permitted." });
            }

            DateTime now = DateTime.Now;
            DateTime baseDeadline = now;

            if (inspection == null)
            {
                baseDeadline = now.AddHours(hours);
                inspection = new Inspection
                {
                    InspectionRequestId = inspReq.InspectionRequestId,
                    DeviceId = deviceId,
                    TechnicianId = inspReq.TechnicianId ?? 0,
                    Status = "Pending",
                    InspectionDeadline = baseDeadline,
                    ExtensionCount = 1,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                db.Inspection.Add(inspection);
            }
            else
            {
                DateTime currentDead = (inspection.InspectionDeadline.HasValue && inspection.InspectionDeadline.Value > now)
                    ? inspection.InspectionDeadline.Value
                    : now;
                baseDeadline = currentDead.AddHours(hours);
                inspection.InspectionDeadline = baseDeadline;
                inspection.ExtensionCount += 1;
                inspection.UpdatedAt = now;
            }

            await db.SaveChangesAsync();

            // Ensure technician details are resolved
            var technician = inspReq.Technician;
            if (technician == null && inspReq.TechnicianId.HasValue && inspReq.TechnicianId.Value > 0)
            {
                technician = await db.Technician
                    .Include(t => t.Login)
                    .FirstOrDefaultAsync(t => t.TechnicianId == inspReq.TechnicianId.Value);
            }

            if (technician != null)
            {
                string formattedDeadline = baseDeadline.ToString("dd MMM yyyy, hh:mm tt");
                string techName = $"{technician.FirstName} {technician.LastName}".Trim();
                if (string.IsNullOrEmpty(techName)) techName = "Technician";

                string? techEmail = technician.Login?.Email;

                // 1. Create In-App Notification if Technician has LoginId
                if (technician.LoginId > 0)
                {
                    var notification = new Notification
                    {
                        LoginId = technician.LoginId,
                        Title = "Inspection Deadline Extended",
                        Message = $"Administrator has granted a {hours}-hour deadline extension for device inspection ({device.Brand} {device.Model} - #{device.DeviceId}).\n\n" +
                                  $"📌 Updated Inspection Details:\n" +
                                  $"• New Inspection Deadline: {formattedDeadline}\n" +
                                  $"• Extension Count: {inspection.ExtensionCount}/2\n\n" +
                                  $"⚠️ Inspection Deadline Policy:\n" +
                                  $"• A maximum of two 24-hour extensions are permitted per inspection assignment.\n" +
                                  $"• Failure to complete the inspection after the second 24-hour extension will incur a technician performance penalty.",
                        Isread = false,
                        Status = true,
                        CreatedAt = now
                    };
                    db.Notification.Add(notification);
                    await db.SaveChangesAsync();
                }

                // 2. Send Email Notification to Technician
                if (!string.IsNullOrWhiteSpace(techEmail))
                {
                    string emailSubject = $"[EcoCycle] Inspection Deadline Extended (+{hours}h) - {device.Brand} {device.Model}";
                    string emailBody = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #10b981; border-radius: 12px; padding: 24px; background-color: #ffffff;'>
                            <div style='background-color: #ecfdf5; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;'>
                                <h2 style='color: #047857; margin: 0; font-size: 20px;'>EcoCycle E-Waste Management</h2>
                                <p style='color: #065f46; margin: 4px 0 0 0; font-weight: 600; font-size: 13px;'>Inspection Deadline Extension Granted (Extension {inspection.ExtensionCount}/2)</p>
                            </div>
                            
                            <p style='font-size: 14px; color: #1e293b;'>Dear <strong>{techName}</strong>,</p>
                            <p style='font-size: 14px; color: #334155;'>The Administrator has granted a <strong>{hours}-hour deadline extension</strong> for your assigned device inspection.</p>
                            
                            <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; margin: 20px 0; border-radius: 8px;'>
                                <p style='margin: 0 0 8px 0; font-size: 13px; color: #475569;'><strong>Device:</strong> {device.Brand} {device.Model} (#{device.DeviceId})</p>
                                <p style='margin: 0 0 8px 0; font-size: 13px; color: #475569;'><strong>Category:</strong> {device.Category?.CategoryName ?? "E-Waste"}</p>
                                <p style='margin: 0 0 8px 0; font-size: 13px; color: #475569;'><strong>Inspection Request ID:</strong> #{inspReq.InspectionRequestId}</p>
                                <p style='margin: 0 0 8px 0; font-size: 13px; color: #475569;'><strong>Extensions Granted:</strong> {inspection.ExtensionCount} of 2 permitted</p>
                                <p style='margin: 0; font-size: 14px; color: #047857;'><strong>New Inspection Deadline:</strong> <span style='font-weight: 800;'>{formattedDeadline}</span></p>
                            </div>

                            <div style='background-color: #fffbe6; border: 1.5px solid #fde68a; border-radius: 10px; padding: 18px; margin: 20px 0;'>
                                <h4 style='color: #b45309; margin: 0 0 10px 0; font-size: 15px; font-weight: 800;'>Technician Inspection Deadline &amp; Penalty Instruction</h4>
                                <p style='font-size: 13px; color: #78350f; font-weight: 800; margin: 0 0 6px 0;'>Inspection Deadline Policy</p>
                                <p style='font-size: 12px; color: #92400e; margin: 0 0 6px 0; line-height: 1.5;'>• Once a device is assigned to you, you are responsible for completing the inspection within the specified inspection deadline.</p>
                                <p style='font-size: 12px; color: #92400e; margin: 0 0 6px 0; line-height: 1.5;'>• If you are unable to complete the inspection within the initial deadline, an extension may be provided. A maximum of two 24-hour extensions will be permitted.</p>
                                <p style='font-size: 12px; color: #92400e; margin: 0 0 6px 0; line-height: 1.5;'>• If the inspection is still not completed after the second 24-hour extension, a penalty will be applied to the assigned technician for failure to complete the inspection within the permitted timeframe.</p>
                                <p style='font-size: 12px; color: #92400e; margin: 0 0 6px 0; line-height: 1.5;'>• Repeated failure to complete inspections on time may also affect your technician performance record and future assignments.</p>
                                <p style='font-size: 12px; color: #92400e; margin: 0; line-height: 1.5;'>• Please ensure that every assigned device is inspected within the permitted deadline or request an extension when necessary.</p>
                            </div>
                            
                            <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;' />
                            <p style='font-size: 11px; color: #94a3b8; margin: 0; text-align: center;'>This is an automated notification from the EcoCycle System. Please do not reply directly to this email.</p>
                        </div>";

                    try
                    {
                        await SendEmailAsync(techEmail, emailSubject, emailBody);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[ExtendInspectionDeadline Email Error]: {ex.Message}");
                    }
                }
            }

            return Ok(new
            {
                message = $"Inspection deadline extended by {hours} hours successfully.",
                deviceId = deviceId,
                newInspectionDeadline = baseDeadline,
                hoursGranted = hours,
                extensionCount = inspection.ExtensionCount
            });
        }

        private static bool IsCitizenAssignment(CollectionAssignment ca)
        {
            if (string.IsNullOrWhiteSpace(ca.AssignmentType))
            {
                return !string.Equals(ca.SourceType, "Technician Center", StringComparison.OrdinalIgnoreCase);
            }
            return !string.Equals(ca.AssignmentType, "TechnicianToRecyclingCenter", StringComparison.OrdinalIgnoreCase) &&
                   !string.Equals(ca.AssignmentType, "TechnicianToRefurbishmentCenter", StringComparison.OrdinalIgnoreCase);
        }

        [Microsoft.AspNetCore.Authorization.Authorize]
        [HttpGet("my-pickup-requests")]
        public async Task<IActionResult> GetMyPickupRequests()
        {
            await CheckAndUpdateExpiredInspectionRequests();
            await CollectionAssignmentController.CheckAndUpdateExpiredCollectionAssignments(db);

            try
            {
                var loginIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (loginIdClaim == null)
                {
                    return Unauthorized(new { message = "User identity not found." });
                }

                int loginId = int.Parse(loginIdClaim.Value);
                var user = await db.Users.FirstOrDefaultAsync(x => x.LoginId == loginId);
                if (user == null)
                {
                    return NotFound(new { message = "User not found." });
                }

                var devices = await db.Device
                    .Include(d => d.Category)
                    .Include(d => d.InspectionRequests)
                        .ThenInclude(ir => ir.Technician)
                    .Include(d => d.CollectionAssignments)
                        .ThenInclude(ca => ca.CollectionAgent)
                    .Where(d => d.UserId == user.UserId && d.Status != "Inactive" && d.Status != "Deleted")
                    .OrderByDescending(d => d.CreatedAt)
                    .ToListAsync();

                // Fetch Deliveries and Pickups records for all collection assignments
                var assignmentIds = devices
                    .SelectMany(d => d.CollectionAssignments)
                    .Where(ca => ca.CollectionAssignmentId.HasValue)
                    .Select(ca => ca.CollectionAssignmentId!.Value)
                    .Distinct()
                    .ToList();

                var deliveriesList = await db.Deliveries
                    .Where(del => assignmentIds.Contains(del.CollectionAssignmentId))
                    .ToListAsync();

                var deliveriesMap = deliveriesList
                    .GroupBy(del => del.CollectionAssignmentId)
                    .ToDictionary(g => g.Key, g => g.OrderByDescending(del => del.CreatedAt).FirstOrDefault());

                var pickupsList = await db.Pickups
                    .Where(p => assignmentIds.Contains(p.CollectionAssignmentId))
                    .ToListAsync();

                var pickupsMap = pickupsList
                    .GroupBy(p => p.CollectionAssignmentId)
                    .ToDictionary(g => g.Key, g => g.OrderByDescending(p => p.CreatedAt).FirstOrDefault());

                // Auto-repair any devices mistakenly marked as DueDatePassed despite having active inspection/collection
                bool hasUpdates = false;
                var today = DateTime.Today;
                var activeOrCompletedStatuses = new[]
                {
                    "inspected", "inspectioncompleted", "inspectionassigned", "inspectionaccepted", "inspectioninprogress",
                    "atinspectioncenter", "collectionassigned", "collectionpending", "pickedup", "enroute",
                    "handoverpendingverification", "recyclingcenteraccepted", "refurbishmentcenteraccepted",
                    "completed", "delivered", "recycled", "refurbished", "duedatepassed", "pickupcancelled", "cancelled"
                };

                foreach (var d in devices)
                {
                    var citizenAssignments = d.CollectionAssignments
                        .Where(ca => IsCitizenAssignment(ca))
                        .OrderByDescending(ca => ca.CreatedAt)
                        .ToList();

                    var latestCitizenCa = citizenAssignments.FirstOrDefault(ca =>
                        !string.Equals(ca.Status, "Expired", StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(ca.Status, "Cancelled", StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(ca.Status, "Rejected", StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(ca.Status, "Reassigned", StringComparison.OrdinalIgnoreCase)
                    ) ?? citizenAssignments.FirstOrDefault();

                    EcoCycle.API.Models.Pickup? citizenPickupForRepair = null;
                    if (latestCitizenCa?.CollectionAssignmentId != null &&
                        pickupsMap.TryGetValue(latestCitizenCa.CollectionAssignmentId.Value, out var cpRepair))
                    {
                        citizenPickupForRepair = cpRepair;
                    }

                    if (d.LifecycleStatus == "DueDatePassed")
                    {
                        if (!string.IsNullOrEmpty(d.ProcessingDecision) || (d.InspectionRequests != null && d.InspectionRequests.Any(ir => ir.Status == "Accepted" || ir.Status == "Completed")))
                        {
                            d.LifecycleStatus = "Inspected";
                            hasUpdates = true;
                            continue;
                        }
                        if (d.CollectionAssignments != null && d.CollectionAssignments.Any(ca => ca.Status == "DeliveredToCenter"))
                        {
                            d.LifecycleStatus = "AtInspectionCenter";
                            hasUpdates = true;
                            continue;
                        }
                        if (citizenPickupForRepair != null && (citizenPickupForRepair.PickedUpAt != null || string.Equals(citizenPickupForRepair.Status, "Completed", StringComparison.OrdinalIgnoreCase)))
                        {
                            d.LifecycleStatus = "Collected";
                            hasUpdates = true;
                            continue;
                        }
                        if (latestCitizenCa != null && (latestCitizenCa.Status == "Assigned" || latestCitizenCa.Status == "Accepted" || latestCitizenCa.Status == "PickupStarted"))
                        {
                            d.LifecycleStatus = "CollectionAssigned";
                            hasUpdates = true;
                            continue;
                        }
                    }

                    string citCaStatus = (latestCitizenCa?.Status ?? "").ToLower().Trim();
                    bool isDone = citCaStatus == "completed" || citCaStatus == "delivered" || citCaStatus == "pickedup" || citCaStatus == "deliveredtocenter" ||
                                  (citizenPickupForRepair?.PickedUpAt != null) ||
                                  (citizenPickupForRepair?.Status?.ToLower() == "completed");
                    string lcs = (d.LifecycleStatus ?? "").ToLower().Trim();

                    if (!isDone &&
                        !activeOrCompletedStatuses.Contains(lcs) &&
                        d.Status != "Accepted" &&
                        string.IsNullOrEmpty(d.ProcessingDecision) &&
                        (d.InspectionRequests == null || !d.InspectionRequests.Any(ir => ir.Status != "Rejected" && ir.Status != "Cancelled")))
                    {
                        if (d.PickupDate.Date < today)
                        {
                            d.LifecycleStatus = "DueDatePassed";
                            hasUpdates = true;
                        }
                    }
                }
                if (hasUpdates)
                {
                    await db.SaveChangesAsync();
                }

                var result = devices.Select(d => {
                    var latestInsp = d.InspectionRequests.OrderByDescending(ir => ir.CreatedAt).FirstOrDefault();

                    // Stage 1: Citizen-to-Technician assignment
                    var citizenAssignments = d.CollectionAssignments
                        .Where(ca => IsCitizenAssignment(ca))
                        .OrderByDescending(ca => ca.CreatedAt)
                        .ToList();

                    var citizenAssignment = citizenAssignments.FirstOrDefault(ca =>
                        !string.Equals(ca.Status, "Expired", StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(ca.Status, "Cancelled", StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(ca.Status, "Rejected", StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(ca.Status, "Reassigned", StringComparison.OrdinalIgnoreCase)
                    ) ?? citizenAssignments.FirstOrDefault();

                    // Stage 2: Technician-to-Center assignment (if exists)
                    var centerAssignment = d.CollectionAssignments
                        .Where(ca => !IsCitizenAssignment(ca))
                        .OrderByDescending(ca => ca.CreatedAt)
                        .FirstOrDefault();

                    EcoCycle.API.Models.Pickup? citizenPickup = null;
                    Delivery? citizenDelivery = null;
                    if (citizenAssignment?.CollectionAssignmentId != null)
                    {
                        if (pickupsMap.TryGetValue(citizenAssignment.CollectionAssignmentId.Value, out var cp))
                            citizenPickup = cp;
                        if (deliveriesMap.TryGetValue(citizenAssignment.CollectionAssignmentId.Value, out var cd))
                            citizenDelivery = cd;
                    }

                    EcoCycle.API.Models.Pickup? centerPickup = null;
                    Delivery? centerDelivery = null;
                    if (centerAssignment?.CollectionAssignmentId != null)
                    {
                        if (pickupsMap.TryGetValue(centerAssignment.CollectionAssignmentId.Value, out var cenP))
                            centerPickup = cenP;
                        if (deliveriesMap.TryGetValue(centerAssignment.CollectionAssignmentId.Value, out var cenD))
                            centerDelivery = cenD;
                    }

                    bool isAgentAccepted = citizenAssignment != null && (
                        string.Equals(citizenAssignment.Status, "Accepted", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(citizenAssignment.Status, "PickupStarted", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(citizenAssignment.Status, "Completed", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(citizenAssignment.Status, "PickedUp", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(citizenAssignment.Status, "OutForDelivery", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(citizenAssignment.Status, "InTransit", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(citizenAssignment.Status, "AwaitingTechnicianApproval", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(citizenAssignment.Status, "DeliveredToCenter", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(citizenAssignment.Status, "Delivered", StringComparison.OrdinalIgnoreCase)
                    );

                    var tech = latestInsp?.Technician;
                    string techCenterName = tech != null && !string.IsNullOrWhiteSpace(tech.InspectionCenterName) ? tech.InspectionCenterName : "EcoCycle Regional Inspection Hub";
                    string techCenterAddress = tech != null && !string.IsNullOrWhiteSpace(tech.Address) 
                        ? $"{tech.Address}{(string.IsNullOrWhiteSpace(tech.City) ? "" : ", City: " + tech.City)}{(string.IsNullOrWhiteSpace(tech.PinCode) ? "" : " - PIN: " + tech.PinCode)}"
                        : "EcoCycle Central Hub, Processing Center";

                    DateTime? pickedUpAt = citizenPickup?.PickedUpAt ?? citizenAssignment?.PickedUpAt;
                    DateTime? pickupStartedAt = citizenPickup?.StartedAt ?? citizenAssignment?.PickupStartedAt;
                    DateTime? deliveredAt = citizenDelivery?.DeliveredAt ?? citizenAssignment?.DeliveredAt;
                    string? deliveryStatus = citizenDelivery?.Status ?? (string.Equals(citizenAssignment?.Status, "DeliveredToCenter", StringComparison.OrdinalIgnoreCase) ? "Delivered" : citizenAssignment?.Status);
                    DateTime? deliveryStartedAt = citizenDelivery?.StartedAt;

                    var agent = citizenAssignment?.CollectionAgent;

                    return new
                    {
                        deviceId = d.DeviceId,
                        inspectionRequestId = latestInsp != null ? (int?)latestInsp.InspectionRequestId : null,

                        brand = d.Brand,
                        model = d.Model,
                        categoryName = d.Category != null ? d.Category.CategoryName : "E-Waste",
                        quantity = d.Quantity,
                        weight = d.Weight,
                        condition = d.Condition,
                        working = d.Working,
                        processingPreference = d.ProcessingPreference,
                        address = d.Address,
                        landmark = d.Landmark,
                        pickupDate = d.PickupDate,
                        timeSlot = d.TimeSlot,
                        pickupInstructions = d.PickupInstructions,
                        status = d.Status,
                        lifecycleStatus = d.LifecycleStatus,
                        requestStatus = latestInsp != null ? latestInsp.Status : (d.LifecycleStatus ?? "Scheduled"),
                        createdAt = d.CreatedAt,
                        technicianName = tech != null ? $"{tech.FirstName} {tech.LastName}".Trim() : "Pending Assignment",
                        technicianPhone = tech?.PhoneNumber,
                        assignedTechnicianName = tech != null ? $"{tech.FirstName} {tech.LastName}".Trim() : "Pending Assignment",
                        assignedTechnicianCenterName = techCenterName,
                        assignedTechnicianCenterAddress = techCenterAddress,
                        assignedTechnicianPhone = tech?.PhoneNumber,

                        // Stage 1: Citizen Pickup & Delivery to Technician
                        collectionAssignmentId = citizenAssignment?.CollectionAssignmentId,
                        assignmentType = citizenAssignment?.AssignmentType ?? "CustomerToTechnician",
                        collectionAgentAccepted = isAgentAccepted,
                        collectionAssignmentStatus = citizenAssignment != null ? citizenAssignment.Status : null,
                        collectionAgentName = agent != null ? $"{agent.FirstName} {agent.LastName}".Trim() : null,
                        collectionAgentPhone = agent != null ? (agent.Phone ?? agent.AlternatePhone) : null,
                        collectionAgentAltPhone = agent?.AlternatePhone,
                        collectionAgentPhoto = agent?.ProfilePicture,
                        vehicleNumber = agent?.VehicleNumber,
                        vehicleType = agent?.VehicleType,
                        deviceQrToken = !string.IsNullOrEmpty(d.DeviceQrToken) ? d.DeviceQrToken : $"ECOQR-DEV-{d.DeviceId}",
                        acceptedAt = citizenAssignment?.AcceptedAt,
                        pickupStartedAt = pickupStartedAt,
                        pickedUpAt = pickedUpAt,
                        pickupStatus = citizenPickup?.Status,
                        pickupVerified = citizenPickup?.DeviceVerified ?? false,
                        pickupProofPhoto = citizenPickup?.ProofPhotoPath,
                        deliveredAt = deliveredAt,
                        deliveryStatus = deliveryStatus,
                        deliveryStartedAt = deliveryStartedAt,

                        // Stage 2: Technician -> Refurbishment/Recycling Center (Separated)
                        centerAssignmentId = centerAssignment?.CollectionAssignmentId,
                        centerAssignmentType = centerAssignment?.AssignmentType,
                        centerAssignmentStatus = centerAssignment?.Status,
                        centerAgentName = centerAssignment?.CollectionAgent != null ? $"{centerAssignment.CollectionAgent.FirstName} {centerAssignment.CollectionAgent.LastName}".Trim() : null,
                        centerAgentPhone = centerAssignment?.CollectionAgent?.Phone,
                        centerVehicleNumber = centerAssignment?.CollectionAgent?.VehicleNumber,
                        centerAcceptedAt = centerAssignment?.AcceptedAt,
                        centerPickupStartedAt = centerPickup?.StartedAt ?? centerAssignment?.PickupStartedAt,
                        centerPickedUpAt = centerPickup?.PickedUpAt ?? centerAssignment?.PickedUpAt,
                        centerDeliveredAt = centerDelivery?.DeliveredAt ?? centerAssignment?.DeliveredAt,
                        centerDeliveryStatus = centerDelivery?.Status ?? (string.Equals(centerAssignment?.Status, "DeliveredToCenter", StringComparison.OrdinalIgnoreCase) ? "Delivered" : centerAssignment?.Status)
                    };
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("manual-allocate/{deviceId}")]
        public async Task<IActionResult> ManualAllocateAuto(int deviceId)
        {
            await CheckAndUpdateExpiredInspectionRequests();

            var device = await db.Device
                .Include(d => d.Category)
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

            if (device == null)
            {
                return NotFound(new { message = "Device not found." });
            }

            var technician = await FindBestTechnician(device);
            if (technician == null)
            {
                var penalizedTechIds = await db.technicianPenalties
                    .Where(p => p.Status == "Pending" || p.Status == "Unpaid")
                    .Select(p => p.TechnicianId)
                    .Distinct()
                    .ToListAsync();

                technician = await db.Technician
                    .Include(t => t.Login)
                    .Where(t => t.Status == "Active" && !penalizedTechIds.Contains(t.TechnicianId))
                    .OrderBy(t => db.InspectionRequest.Count(ir => ir.TechnicianId == t.TechnicianId && (ir.Status == "Assigned" || ir.Status == "Accepted" || ir.Status == "InProgress")))
                    .FirstOrDefaultAsync();

                if (technician == null)
                {
                    return BadRequest(new { message = "No eligible active technician (without pending fines) is available for allocation." });
                }
            }

            return await AssignTechnicianToDevice(device, technician);
        }

        [HttpPost("manual-allocate/{deviceId}/{technicianId}")]
        public async Task<IActionResult> ManualAllocateSpecific(int deviceId, int technicianId)
        {
            await CheckAndUpdateExpiredInspectionRequests();

            var device = await db.Device
                .Include(d => d.Category)
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

            if (device == null)
            {
                return NotFound(new { message = "Device not found." });
            }

            var technician = await db.Technician
                .Include(t => t.Login)
                .FirstOrDefaultAsync(t => t.TechnicianId == technicianId);

            if (technician == null)
            {
                return NotFound(new { message = "Technician not found." });
            }

            bool hasUnpaidFine = await db.technicianPenalties
                .AnyAsync(p => p.TechnicianId == technicianId && (p.Status == "Pending" || p.Status == "Unpaid"));

            if (hasUnpaidFine)
            {
                return BadRequest(new { message = $"Allocation Denied: Technician {technician.FirstName} {technician.LastName} cannot be allocated because they have an outstanding policy fine. Please resolve their fine first." });
            }

            return await AssignTechnicianToDevice(device, technician);
        }

        private async Task<IActionResult> AssignTechnicianToDevice(Device device, Technician technician)
        {
            var existingRequest = await db.InspectionRequest
                .Where(x => x.DeviceId == device.DeviceId && x.Status != "Rejected" && x.Status != "Cancelled")
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            int reassignmentCount = 0;

            if (existingRequest != null)
            {
                reassignmentCount = existingRequest.ReassignmentCount + 1;

                if (!string.Equals(existingRequest.Status, "Expired", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(existingRequest.Status, "Rejected", StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(existingRequest.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    existingRequest.Status = "Reassigned";
                }

                existingRequest.UpdatedAt = DateTime.Now;
            }

            var request = new InspectionRequest
            {
                DeviceId = device.DeviceId,
                TechnicianId = technician.TechnicianId,
                Status = "Assigned",
                AssignedAt = DateTime.Now,
                ResponseDeadline = DateTime.Now.AddHours(24),
                ReassignmentCount = reassignmentCount,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            db.InspectionRequest.Add(request);

            device.LifecycleStatus = "InspectionAssigned";

            var existingInspections = await db.Inspection
                .Where(i => i.DeviceId == device.DeviceId && i.Status != "Completed")
                .ToListAsync();

            foreach (var insp in existingInspections)
            {
                insp.Status = "Reassigned";
                insp.UpdatedAt = DateTime.Now;
            }

            await db.SaveChangesAsync();

            if (technician.Login != null)
            {
                var notification = new Notification
                {
                    LoginId = technician.LoginId,
                    Title = "New Inspection Request",
                    Message = $"A new inspection request for {device.Brand} {device.Model} has been assigned to you.",
                    Isread = false,
                    CreatedAt = DateTime.Now
                };

                db.Notification.Add(notification);
                await db.SaveChangesAsync();
            }

            if (technician.Login != null && !string.IsNullOrWhiteSpace(technician.Login.Email))
            {
                string subject = "EcoCycle - Inspection Request Assigned";
                string body = $@"
                <html>
                <body>
                    <h2>New Inspection Request Assigned</h2>
                    <p>Dear {technician.FirstName} {technician.LastName},</p>
                    <p>An e-waste device inspection request has been assigned to you by Admin.</p>
                    <p><strong>Device:</strong> {device.Brand} {device.Model}</p>
                    <p><strong>Response Deadline:</strong> {request.ResponseDeadline:dd-MM-yyyy hh:mm tt}</p>
                </body>
                </html>";
                await SendEmailAsync(technician.Login.Email, subject, body);
            }

            return Ok(new
            {
                message = $"Successfully assigned technician {technician.FirstName} {technician.LastName}.",
                inspectionRequestId = request.InspectionRequestId,
                technicianId = technician.TechnicianId,
                status = request.Status
            });
        }

        // Admin Endpoints: Manage Technician Penalties
        [HttpGet("technician-penalties")]
        public async Task<IActionResult> GetAllTechnicianPenalties()
        {
            await CheckAndApplyOverdueInspectionPenalties();

            var penalties = await db.technicianPenalties
                .Include(p => p.Technician)
                    .ThenInclude(t => t!.Login)
                .Include(p => p.Device)
                    .ThenInclude(d => d!.Category)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    technicianPenaltyId = p.TechnicianPenaltyId,
                    technicianId = p.TechnicianId,
                    technicianName = p.Technician != null ? $"{p.Technician.FirstName} {p.Technician.LastName}".Trim() : "Technician",
                    technicianEmail = p.Technician != null && p.Technician.Login != null ? p.Technician.Login.Email : "N/A",
                    technicianPhone = p.Technician != null ? p.Technician.PhoneNumber : "N/A",
                    employeeId = p.Technician != null ? p.Technician.EmployeeId : "N/A",
                    inspectionCenter = p.Technician != null ? p.Technician.InspectionCenterName : "EcoCycle Hub",
                    
                    deviceId = p.DeviceId,
                    brand = p.Device != null ? p.Device.Brand : "Device",
                    model = p.Device != null ? p.Device.Model : "",
                    categoryName = p.Device != null && p.Device.Category != null ? p.Device.Category.CategoryName : "E-Waste",
                    serialNumber = p.Device != null ? p.Device.SerialNumber : "N/A",
                    purchaseDate = p.Device != null ? p.Device.PurchaseDate : null,
                    
                    inspectionRequestId = p.InspectionRequestId,
                    penaltyAmount = p.PenaltyAmount,
                    reason = p.Reason,
                    status = p.Status,
                    createdAt = p.CreatedAt,
                    resolvedAt = p.ResolvedAt
                })
                .ToListAsync();

            return Ok(penalties);
        }

        [HttpPut("technician-penalties/{penaltyId}/status")]
        public async Task<IActionResult> UpdatePenaltyStatus(int penaltyId, [FromBody] UpdatePenaltyStatusDto dto)
        {
            var penalty = await db.technicianPenalties.FindAsync(penaltyId);
            if (penalty == null)
            {
                return NotFound(new { message = "Penalty record not found." });
            }

            string newStatus = dto.Status ?? "Pending";
            penalty.Status = newStatus;
            if (newStatus == "Paid" || newStatus == "Waived" || newStatus == "Resolved" || newStatus == "Cancelled")
            {
                penalty.ResolvedAt = DateTime.Now;
            }
            else
            {
                penalty.ResolvedAt = null;
            }

            await db.SaveChangesAsync();
            return Ok(new { message = $"Penalty status updated to {newStatus}.", penaltyId = penalty.TechnicianPenaltyId, status = penalty.Status, resolvedAt = penalty.ResolvedAt });
        }

        [HttpPost("technician-penalties/{penaltyId}/cancel")]
        public async Task<IActionResult> CancelPenalty(int penaltyId)
        {
            var penalty = await db.technicianPenalties
                .Include(p => p.Technician)
                    .ThenInclude(t => t!.Login)
                .Include(p => p.Device)
                .FirstOrDefaultAsync(p => p.TechnicianPenaltyId == penaltyId);

            if (penalty == null)
            {
                return NotFound(new { message = "Penalty record not found." });
            }

            if (penalty.Status == "Cancelled" || penalty.Status == "Waived")
            {
                return BadRequest(new { message = "Penalty is already cancelled." });
            }

            penalty.Status = "Cancelled";
            penalty.ResolvedAt = DateTime.Now;

            // Update associated payment records if present
            var relatedPayments = await db.Payments
                .Where(pm => pm.PaymentType == "TechnicianPenalty" && pm.ReferenceId == penaltyId && pm.PaymentStatus != "Paid")
                .ToListAsync();

            foreach (var pm in relatedPayments)
            {
                pm.PaymentStatus = "Cancelled";
                pm.UpdatedAt = DateTime.Now;
            }

            // Add in-app notification for technician
            if (penalty.Technician != null && penalty.Technician.LoginId > 0)
            {
                var notification = new Notification
                {
                    LoginId = penalty.Technician.LoginId,
                    Title = "Fine Cancelled by Admin",
                    Message = $"Your fine of ₹{penalty.PenaltyAmount} (#PEN-{penalty.TechnicianPenaltyId}) for device #{penalty.DeviceId} has been cancelled by Administrator. Your account is fully active.",
                    Isread = false,
                    Status = true,
                    CreatedAt = DateTime.Now
                };
                db.Notification.Add(notification);
            }

            // Send email to technician
            string techEmail = penalty.Technician?.Login?.Email ?? "";
            if (!string.IsNullOrWhiteSpace(techEmail))
            {
                try
                {
                    string subject = $"EcoCycle Notice: Fine Cancelled - Penalty #PEN-{penalty.TechnicianPenaltyId}";
                    string emailBody = $@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }}
                            .card {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }}
                            .header {{ background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; padding: 24px; text-align: center; }}
                            .header h1 {{ margin: 0; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }}
                            .content {{ padding: 24px; font-size: 14px; line-height: 1.6; }}
                            .badge {{ display: inline-block; background: #dcfce7; color: #15803d; font-weight: 700; padding: 6px 14px; border-radius: 6px; border: 1px solid #86efac; font-size: 13px; }}
                            .table {{ width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }}
                            .table td {{ padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }}
                            .label {{ color: #64748b; font-weight: 600; width: 40%; }}
                            .val {{ color: #0f172a; font-weight: 700; }}
                            .footer {{ background: #f8fafc; text-align: center; padding: 16px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
                        </style>
                    </head>
                    <body>
                        <div class='card'>
                            <div class='header'>
                                <h1>Fine Cancelled Notice</h1>
                                <p style='margin: 4px 0 0; font-size: 13px; opacity: 0.9;'>EcoCycle Policy & Compliance</p>
                            </div>
                            <div class='content'>
                                <p style='margin-top: 0;'>Dear <strong>{penalty.Technician?.FirstName} {penalty.Technician?.LastName}</strong>,</p>
                                <p>We are writing to inform you that your pending policy fine of <strong style='color: #059669;'>₹{penalty.PenaltyAmount}</strong> regarding device <strong>#{penalty.DeviceId}</strong> has been <strong>CANCELLED</strong> by the Administrator.</p>
                                
                                <div style='text-align: center; margin: 20px 0;'>
                                    <span class='badge'>STATUS: CANCELLED / WAIVED</span>
                                </div>

                                <table class='table'>
                                    <tr><td class='label'>Penalty Ref</td><td class='val'>#PEN-{penalty.TechnicianPenaltyId}</td></tr>
                                    <tr><td class='label'>Device ID</td><td class='val'>#DEV-{penalty.DeviceId}</td></tr>
                                    <tr><td class='label'>Original Fine</td><td class='val'>₹{penalty.PenaltyAmount}</td></tr>
                                    <tr><td class='label'>Violation Reason</td><td class='val'>{penalty.Reason}</td></tr>
                                </table>

                                <p style='color: #475569;'>Your account access is fully restored. No further payment or action is required from your side.</p>
                            </div>
                            <div class='footer'>
                                EcoCycle E-Waste Platform &bull; Admin Operations
                            </div>
                        </div>
                    </body>
                    </html>";

                    await SendEmailAsync(techEmail, subject, emailBody);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error sending penalty cancellation email: {ex.Message}");
                }
            }

            await db.SaveChangesAsync();

            return Ok(new
            {
                message = $"Penalty #PEN-{penaltyId} cancelled successfully. Email and notification sent to technician.",
                penaltyId = penalty.TechnicianPenaltyId,
                status = penalty.Status
            });
        }

        [HttpPost("technician-penalties/{penaltyId}/resend-email")]
        public async Task<IActionResult> ResendPenaltyEmail(int penaltyId)
        {
            var penalty = await db.technicianPenalties
                .Include(p => p.Technician)
                    .ThenInclude(t => t!.Login)
                .Include(p => p.Device)
                .FirstOrDefaultAsync(p => p.TechnicianPenaltyId == penaltyId);

            if (penalty == null)
            {
                return NotFound(new { message = "Penalty record not found." });
            }

            string techEmail = penalty.Technician?.Login?.Email ?? "";
            if (string.IsNullOrWhiteSpace(techEmail))
            {
                return BadRequest(new { message = "Technician email address not available." });
            }

            string subject = $"EcoCycle Penalty Notice Reminder: ₹{penalty.PenaltyAmount} Fine (Device #DEV-{penalty.DeviceId})";
            string emailBody = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }}
                    .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }}
                    .header {{ background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; padding: 24px; text-align: center; }}
                    .header h1 {{ margin: 0; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }}
                    .content {{ padding: 24px; }}
                    .alert-box {{ background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 16px; margin: 16px 0; color: #991b1b; font-weight: 600; font-size: 14px; }}
                    .detail-table {{ width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }}
                    .detail-table td {{ padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }}
                    .detail-label {{ color: #64748b; font-weight: 600; width: 40%; }}
                    .detail-val {{ color: #0f172a; font-weight: 700; }}
                    .policy-card {{ background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin-top: 20px; font-size: 13px; color: #475569; }}
                    .footer {{ background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>EcoCycle Penalty Reminder</h1>
                        <p style='margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;'>Inspection Deadline & Penalty Enforcement</p>
                    </div>
                    <div class='content'>
                        <p style='font-size: 15px; margin-top: 0;'>Dear <strong>{penalty.Technician?.FirstName} {penalty.Technician?.LastName}</strong>,</p>
                        
                        <div class='alert-box'>
                            ⚠️ REMINDER: A penalty of <strong>₹{penalty.PenaltyAmount}</strong> is pending for your account regarding overdue device inspection.
                        </div>

                        <table class='detail-table'>
                            <tr>
                                <td class='detail-label'>Penalty ID</td>
                                <td class='detail-val'>#PEN-{penalty.TechnicianPenaltyId}</td>
                            </tr>
                            <tr>
                                <td class='detail-label'>Device ID</td>
                                <td class='detail-val'>#DEV-{penalty.DeviceId}</td>
                            </tr>
                            <tr>
                                <td class='detail-label'>Device</td>
                                <td class='detail-val'>{penalty.Device?.Brand} {penalty.Device?.Model}</td>
                            </tr>
                            <tr>
                                <td class='detail-label'>Penalty Amount</td>
                                <td class='detail-val' style='color: #dc2626; font-size: 16px;'>₹{penalty.PenaltyAmount}</td>
                            </tr>
                            <tr>
                                <td class='detail-label'>Current Status</td>
                                <td class='detail-val' style='color: #d97706;'>{penalty.Status}</td>
                            </tr>
                            <tr>
                                <td class='detail-label'>Penalty Reason</td>
                                <td class='detail-val'>{penalty.Reason}</td>
                            </tr>
                        </table>

                        <div class='policy-card'>
                            <strong>Compliance Instruction:</strong><br/>
                            Please resolve this penalty notice or contact your EcoCycle Administrator. Unresolved penalties may affect your technician performance record and future assignment eligibility.
                        </div>
                    </div>
                    <div class='footer'>
                        EcoCycle E-Waste Platform &bull; Admin Operations<br/>
                        This is an official system reminder.
                    </div>
                </div>
            </body>
            </html>";

            await SendEmailAsync(techEmail, subject, emailBody);
            return Ok(new { message = $"Penalty reminder email successfully re-sent to {techEmail}." });
        }
    }

    public class UpdatePenaltyStatusDto
    {
        public string? Status { get; set; }
    }

    public class ConfirmReceiptDto
    {
        public string? Notes { get; set; }
        public string? QrCode { get; set; }
    }

    public class RejectHandoverDto
    {
        public string? Reason { get; set; }
        public string? Description { get; set; }
    }
}
