using EcoCycle.API.Data;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Mail;

namespace EcoCycle.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CollectionAssignmentController : ControllerBase
    {
        private readonly ApplicationDbContext db;

        public CollectionAssignmentController(ApplicationDbContext db)
        {
            this.db = db;
        }

        private async Task<(int? techId, string centerName, string delAddress, string techName, string techPhone)> GetTechnicianLocationForDeviceAsync(int deviceId)
        {
            var inspReq = await db.InspectionRequest
                .Include(ir => ir.Technician)
                .Where(ir => ir.DeviceId == deviceId && ir.Technician != null)
                .OrderByDescending(ir => ir.CreatedAt)
                .FirstOrDefaultAsync();

            var tech = inspReq?.Technician;
            if (tech == null)
            {
                tech = await db.Technician
                    .Where(t => t.Status == "Approved" || t.Status == "Active")
                    .OrderBy(t => t.TechnicianId)
                    .FirstOrDefaultAsync() ?? await db.Technician.OrderBy(t => t.TechnicianId).FirstOrDefaultAsync();
            }

            if (tech != null)
            {
                string tName = $"{tech.FirstName} {tech.LastName}".Trim();
                string tPhone = tech.PhoneNumber;
                string cName = tech.InspectionCenterName;

                var parts = new List<string>();
                if (!string.IsNullOrWhiteSpace(tech.InspectionCenterName)) parts.Add(tech.InspectionCenterName);
                if (!string.IsNullOrWhiteSpace(tech.Address)) parts.Add(tech.Address);
                if (!string.IsNullOrWhiteSpace(tech.City)) parts.Add(tech.City);
                if (!string.IsNullOrWhiteSpace(tech.District)) parts.Add(tech.District);
                if (!string.IsNullOrWhiteSpace(tech.State)) parts.Add(tech.State);
                if (!string.IsNullOrWhiteSpace(tech.PinCode)) parts.Add(tech.PinCode);

                string fullDelAddress = string.Join(", ", parts);
                return (tech.TechnicianId, cName, fullDelAddress, tName, tPhone);
            }

            return (null, "EcoCycle Central Inspection Center", "EcoCycle Central E-Waste Facility & Inspection Hub", "Inspection Technician", "");
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

        public static async Task CheckAndUpdateExpiredCollectionAssignments(ApplicationDbContext db)
        {
            var now = DateTime.Now;
            var expiredAssignments = await db.CollectionAssignments
                .Include(x => x.Device)
                .Where(x => (x.Status == "Assigned" || x.Status == "Waiting" || x.Status == "Pending" ||
                             x.Status == "assigned" || x.Status == "waiting" || x.Status == "pending") &&
                            ((x.ResponseDeadline.HasValue && x.ResponseDeadline.Value < now) ||
                             (!x.ResponseDeadline.HasValue && x.AssignedAt.HasValue && x.AssignedAt.Value.AddHours(24) < now) ||
                             (!x.ResponseDeadline.HasValue && !x.AssignedAt.HasValue && x.CreatedAt.AddHours(24) < now)))
                .ToListAsync();

            if (expiredAssignments.Any())
            {
                foreach (var assignment in expiredAssignments)
                {
                    assignment.Status = "Expired";
                    assignment.UpdatedAt = now;
                    if (assignment.Device != null)
                    {
                        assignment.Device.LifecycleStatus = "PickupExpired";
                    }
                }
                await db.SaveChangesAsync();
            }
        }

        [HttpPost("auto-allocate/{deviceId}")]
        public async Task<IActionResult> AutoAllocate(int deviceId)
        {
            await CheckAndUpdateExpiredCollectionAssignments(db);

            using var transaction =
                await db.Database.BeginTransactionAsync();

            try
            {
                var device = await db.Device
                    .Include(d => d.Category)
                    .Include(d => d.User)
                    .FirstOrDefaultAsync(x => x.DeviceId == deviceId);

                if (device == null)
                {
                    return NotFound(new
                    {
                        message = "Device not found."
                    });
                }

                // =========================================================
                // CHECK EXISTING ASSIGNMENT
                // =========================================================

                var existingAssignment =
                    await db.CollectionAssignments
                        .Where(x => x.DeviceId == deviceId && x.Status != "Rejected" && x.Status != "Cancelled")
                        .OrderByDescending(x => x.CreatedAt)
                        .FirstOrDefaultAsync();

                CollectionAgent? agent = null;
                CollectionAssignment assignment;

                // =========================================================
                // EXISTING ASSIGNMENT
                // =========================================================

                if (existingAssignment != null)
                {
                    bool isExpired = string.Equals(existingAssignment.Status, "Expired", StringComparison.OrdinalIgnoreCase) ||
                                     (existingAssignment.ResponseDeadline.HasValue && existingAssignment.ResponseDeadline.Value < DateTime.Now) ||
                                     (!existingAssignment.ResponseDeadline.HasValue && existingAssignment.AssignedAt.HasValue && existingAssignment.AssignedAt.Value.AddHours(24) < DateTime.Now) ||
                                     (!existingAssignment.ResponseDeadline.HasValue && !existingAssignment.AssignedAt.HasValue && existingAssignment.CreatedAt.AddHours(24) < DateTime.Now);

                    if (isExpired)
                    {
                        existingAssignment.Status = "Expired";
                        existingAssignment.UpdatedAt = DateTime.Now;

                        agent = await FindBestCollectionAgent(device);

                        assignment = new CollectionAssignment
                        {
                            DeviceId = deviceId,
                            CollectionAgentId = agent?.CollectionAgentId,
                            Status = agent != null ? "Assigned" : "Waiting",
                            AssignedAt = agent != null ? DateTime.Now : null,
                            ResponseDeadline = DateTime.Now.AddHours(24),
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
                        };

                        if (agent != null)
                        {
                            device.LifecycleStatus = "CollectionAssigned";
                        }
                        else
                        {
                            device.LifecycleStatus = "CollectionPending";
                        }

                        db.CollectionAssignments.Add(assignment);
                    }
                    else if (existingAssignment.Status == "Waiting")
                    {
                        agent = await FindBestCollectionAgent(device);

                        if (agent == null)
                        {
                            return Ok(new
                            {
                                message =
                                    "Collection request is currently waiting, but no suitable collection agent is available.",

                                collectionAssignmentId =
                                    existingAssignment.CollectionAssignmentId,

                                status = "Waiting"
                            });
                        }

                        assignment = existingAssignment;

                        assignment.CollectionAgentId =
                            agent.CollectionAgentId;

                        assignment.Status =
                            "Assigned";

                        assignment.AssignedAt =
                            DateTime.Now;

                        if (!assignment.ResponseDeadline.HasValue)
                        {
                            assignment.ResponseDeadline = DateTime.Now.AddHours(24);
                        }

                        assignment.UpdatedAt =
                            DateTime.Now;

                        device.LifecycleStatus =
                            "CollectionAssigned";
                    }
                    else
                    {
                        return Ok(new
                        {
                            message =
                                "Collection agent is already assigned.",

                            assignmentId =
                                existingAssignment.CollectionAssignmentId,

                            collectionAgentId =
                                existingAssignment.CollectionAgentId,

                            status =
                                existingAssignment.Status
                        });
                    }
                }

                // =========================================================
                // NO EXISTING ASSIGNMENT
                // =========================================================

                else
                {
                    agent = await FindBestCollectionAgent(device);

                    var techInfo = await GetTechnicianLocationForDeviceAsync(deviceId);
                    assignment = new CollectionAssignment
                    {
                        DeviceId = deviceId,
                        CollectionAgentId = agent?.CollectionAgentId,
                        Status = agent != null ? "Assigned" : "Waiting",
                        AssignedAt = agent != null ? DateTime.Now : null,
                        ResponseDeadline = DateTime.Now.AddHours(24),
                        TechnicianId = techInfo.techId,
                        TechnicianCenterName = techInfo.centerName,
                        DeliveredAddress = techInfo.delAddress,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };

                    if (agent != null)
                    {
                        device.LifecycleStatus =
                            "CollectionAssigned";
                    }
                    else
                    {
                        device.LifecycleStatus =
                            "CollectionPending";
                    }

                    db.CollectionAssignments.Add(assignment);
                }

                // =========================================================
                // SAVE ASSIGNMENT FIRST
                // =========================================================

                await db.SaveChangesAsync();

                string fullAddress =
                    device.Address +
                    (string.IsNullOrWhiteSpace(device.User?.City) ? "" : $", {device.User.City}") +
                    (string.IsNullOrWhiteSpace(device.User?.District) ? "" : $", {device.User.District}") +
                    (string.IsNullOrWhiteSpace(device.User?.State) ? "" : $", {device.User.State}") +
                    (string.IsNullOrWhiteSpace(device.User?.Pincode) ? "" : $" - {device.User.Pincode}");

                var routeTech = await GetTechnicianLocationForDeviceAsync(deviceId);

                // =========================================================
                // INSERT NOTIFICATION WHEN AGENT IS ACTUALLY ASSIGNED
                // =========================================================

                if (agent != null)
                {
                    if (agent.LoginId > 0)
                    {
                        var notification = new Notification
                        {
                            LoginId = agent.LoginId,
                            Title = "New Pickup Request Assigned",
                            Message = $"COLLECT FROM Customer {device.User?.FirstName} {device.User?.LastName} ({fullAddress}) [Slot: {device.PickupDate:dd-MM-yyyy} {device.TimeSlot}] ↓ DELIVER TO {routeTech.techName} ({routeTech.centerName} - {routeTech.delAddress})",
                            Isread = false,
                            Status = true,
                            CreatedAt = DateTime.Now
                        };

                        db.Notification.Add(notification);
                        await db.SaveChangesAsync();
                    }
                }

                // =========================================================
                // COMMIT DATABASE TRANSACTION
                // =========================================================

                await transaction.CommitAsync();

                // =========================================================
                // SEND EMAIL IF AGENT ASSIGNED
                // =========================================================

                string recipientEmail = agent?.Login?.Email;
                if (string.IsNullOrWhiteSpace(recipientEmail) && agent != null && agent.LoginId > 0)
                {
                    var loginObj = await db.Login.FirstOrDefaultAsync(l => l.LoginId == agent.LoginId);
                    recipientEmail = loginObj?.Email;
                }

                if (agent != null && !string.IsNullOrWhiteSpace(recipientEmail))
                {
                    string subject = "EcoCycle - New Collection Pickup Request Assigned";

                    string body = $@"
<!DOCTYPE html>
<html>
<body style=""font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; color: #0f172a;"">
    <div style=""max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;"">
        <h2 style=""color: #059669; margin-top: 0;"">EcoCycle Pickup Assignment</h2>
        <p>Dear <strong>{agent.FirstName} {agent.LastName}</strong>,</p>
        <p>A new e-waste collection pickup request for <strong>{device.Brand} {device.Model}</strong> (Assignment #{assignment.CollectionAssignmentId}) has been assigned to you.</p>

        <div style=""background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 10px; margin-top: 16px;"">
            <div style=""font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.05em;"">COLLECT FROM</div>
            <div style=""font-weight: 700; color: #065f46; font-size: 15px; margin-top: 4px;"">Customer: {device.User?.FirstName} {device.User?.LastName} (Ph: {device.User?.PhoneNumber})</div>
            <div style=""color: #047857; font-size: 14px; margin-top: 4px;""><strong>Customer pickup address:</strong> {fullAddress}</div>
            <div style=""color: #059669; font-size: 13px; margin-top: 4px;""><strong>Pickup date / time slot:</strong> {device.PickupDate:dd-MM-yyyy} • {device.TimeSlot}</div>
        </div>

        <div style=""text-align: center; font-size: 24px; font-weight: bold; color: #059669; margin: 10px 0;"">↓</div>

        <div style=""background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 10px;"">
            <div style=""font-size: 11px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.05em;"">DELIVER TO</div>
            <div style=""font-weight: 700; color: #1e40af; font-size: 15px; margin-top: 4px;"">Technician / Inspection Center: {routeTech.techName} ({routeTech.centerName}) {(string.IsNullOrEmpty(routeTech.techPhone) ? "" : $"• Ph: {routeTech.techPhone}")}</div>
            <div style=""color: #1e3a8a; font-size: 14px; margin-top: 4px;""><strong>Technician/center address:</strong> {routeTech.delAddress}</div>
        </div>

        <div style=""margin-top: 24px; text-align: center;"">
            <a href=""https://localhost:7102"" style=""background: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; display: inline-block;"">[ Start Pickup ]</a>
        </div>

        <p style=""margin-top: 24px; font-size: 12px; color: #64748b;"">
            Regards,<br/><strong>EcoCycle Admin Team</strong>
        </p>
    </div>
</body>
</html>";

                    await SendEmailAsync(
                        recipientEmail,
                        subject,
                        body
                    );
                }

                // =========================================================
                // RESPONSE
                // =========================================================

                return Ok(new
                {
                    message =
                        agent == null
                            ? "Collection request recorded in Waiting status. No collection agent currently available."
                            : "Collection agent automatically assigned.",

                    assignmentId =
                        assignment.CollectionAssignmentId,

                    collectionAgentId =
                        agent?.CollectionAgentId,

                    collectionAgentName =
                        agent != null
                            ? $"{agent.FirstName} {agent.LastName}"
                            : null,

                    status =
                        assignment.Status
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message =
                        "Error automatically assigning collection agent.",

                    error =
                        ex.Message
                });
            }
        }

        private async Task<CollectionAgent?> FindBestCollectionAgent(
            Device device)
        {
            var agents = await db.CollectionAgents
                .Include(x => x.Login)
                .Where(x => x.Status == "Active")
                .ToListAsync();

            if (!agents.Any())
            {
                return null;
            }

            var candidates =
                new List<(CollectionAgent Agent, int Workload)>();

            foreach (var agent in agents)
            {
                // Strict State match
                if (device.User != null &&
                    !string.IsNullOrWhiteSpace(device.User.State) &&
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
                if (device.User != null &&
                    !string.IsNullOrWhiteSpace(device.User.District) &&
                    !string.IsNullOrWhiteSpace(agent.District))
                {
                    if (!device.User.District.Trim().Equals(
                            agent.District.Trim(),
                            StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }
                }

                int workload =
                    await db.CollectionAssignments
                    .CountAsync(x =>
                        x.CollectionAgentId ==
                        agent.CollectionAgentId &&

                        (
                            x.Status == "Assigned" ||
                            x.Status == "Accepted" ||
                            x.Status == "PickupStarted"
                        )
                    );

                if (workload >= 5)
                    continue;

                candidates.Add(
                    (agent, workload)
                );
            }

            return candidates
                .OrderBy(x => x.Workload)
                .Select(x => x.Agent)
                .FirstOrDefault();
        }

        [HttpGet("my-assignments")]
        public async Task<IActionResult> GetMyAssignments()
        {
            await CheckAndUpdateExpiredCollectionAssignments(db);

            try
            {
                var loginIdClaim = User.FindFirst(
                    System.Security.Claims.ClaimTypes.NameIdentifier
                ) ?? User.FindFirst("sub");

                if (loginIdClaim == null)
                {
                    return Unauthorized(new
                    {
                        message = "User identity not found."
                    });
                }

                if (!int.TryParse(loginIdClaim.Value, out int loginId))
                {
                    return Unauthorized(new
                    {
                        message = "Invalid user identity."
                    });
                }

                // Find the collection agent using LoginId
                var agent = await db.CollectionAgents
                    .FirstOrDefaultAsync(x => x.LoginId == loginId);

                if (agent == null)
                {
                    return NotFound(new
                    {
                        message = "Collection agent not found."
                    });
                }

                // Get assignments belonging to this collection agent
                var rawAssignments = await db.CollectionAssignments
                    .Include(x => x.Device)
                        .ThenInclude(d => d.Category)
                    .Include(x => x.Device)
                        .ThenInclude(d => d.User)
                            .ThenInclude(u => u.Login)
                    .Where(x =>
                        x.CollectionAgentId == agent.CollectionAgentId &&
                        (x.Device == null || (x.Device.Status != "Inactive" && x.Device.Status != "Deleted")) &&
                        (
                            x.Status == "Assigned" ||
                            x.Status == "Accepted" ||
                            x.Status == "PickupStarted" ||
                            x.Status == "Completed" ||
                            x.Status == "completed" ||
                            x.Status == "OutForDelivery" ||
                            x.Status == "DeliveredToCenter"
                        )
                    )
                    .OrderByDescending(x => x.CollectionAssignmentId)
                    .ToListAsync();

                var resultList = new List<object>();
                foreach (var x in rawAssignments)
                {
                    var (techId, centerName, delAddress, techName, techPhone) = await GetTechnicianLocationForDeviceAsync(x.DeviceId);

                    string delStatus = (x.Status == "Completed" ? "Pending" : x.Status == "OutForDelivery" ? "InTransit" : x.Status == "DeliveredToCenter" ? "Delivered" : "Pending");
                    try
                    {
                        var delObj = await db.Deliveries.FirstOrDefaultAsync(d => d.CollectionAssignmentId == x.CollectionAssignmentId);
                        if (delObj != null && !string.IsNullOrEmpty(delObj.Status))
                        {
                            delStatus = delObj.Status;
                        }
                    }
                    catch
                    {
                        // Fallback if Deliveries table is not created in DB yet
                    }

                    resultList.Add(new
                    {
                        collectionAssignmentId = x.CollectionAssignmentId,
                        deviceId = x.DeviceId,
                        collectionAgentId = x.CollectionAgentId,
                        status = x.Status,
                        deliveryStatus = delStatus,
                        rejectionReason = x.RejectionReason,
                        assignedAt = x.AssignedAt,
                        responseDeadline = x.ResponseDeadline ?? (x.AssignedAt.HasValue ? x.AssignedAt.Value.AddHours(24) : x.CreatedAt.AddHours(24)),
                        respondedAt = x.RespondedAt,
                        createdAt = x.CreatedAt,
                        categoryName = x.Device.Category != null
                            ? x.Device.Category.CategoryName
                            : "E-Waste",
                        brand = x.Device.Brand,
                        model = x.Device.Model,
                        quantity = x.Device.Quantity,
                        condition = x.Device.Condition,
                        working = x.Device.Working,
                        customerName = x.Device.User != null
                            ? x.Device.User.FirstName + " " + x.Device.User.LastName
                            : "",
                        customerEmail = x.Device.User != null && x.Device.User.Login != null
                            ? x.Device.User.Login.Email
                            : "",
                        customerPhone = x.Device.User != null
                            ? x.Device.User.PhoneNumber
                            : "",
                        address = x.Device.Address,
                        landmark = x.Device.Landmark,
                        city = x.Device.User != null
                            ? x.Device.User.City
                            : "",
                        district = x.Device.User != null
                            ? x.Device.User.District
                            : "",
                        state = x.Device.User != null
                            ? x.Device.User.State
                            : "",
                        pincode = x.Device.User != null
                            ? x.Device.User.Pincode
                            : "",
                        pickupDate = x.Device.PickupDate,
                        timeSlot = x.Device.TimeSlot,
                        pickupInstructions = x.Device.PickupInstructions,
                        lifecycleStatus = x.Device.LifecycleStatus,
                        technicianId = techId,
                        technicianName = techName,
                        technicianPhone = techPhone,
                        inspectionCenterName = centerName,
                        technicianCenterName = centerName,
                        deliveredAddress = delAddress,
                        technicianAddress = delAddress,
                        deviceQrToken = !string.IsNullOrEmpty(x.Device.DeviceQrToken) ? x.Device.DeviceQrToken : $"ECOQR-DEV-{x.DeviceId}"
                    });
                }

                return Ok(resultList);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error retrieving assigned pickup requests.",
                    error = ex.Message
                });
            }
        }

        [HttpPost("accept/{assignmentId}")]
        public async Task<IActionResult> AcceptAssignment(int assignmentId)
        {
            await CheckAndUpdateExpiredCollectionAssignments(db);

            try
            {
                var assignment = await db.CollectionAssignments
                    .Include(x => x.Device)
                    .FirstOrDefaultAsync(x => x.CollectionAssignmentId == assignmentId);

                if (assignment == null)
                {
                    return NotFound(new
                    {
                        message = "Collection assignment not found."
                    });
                }

                if (string.Equals(assignment.Status, "Expired", StringComparison.OrdinalIgnoreCase) ||
                    (assignment.AssignedAt.HasValue && assignment.AssignedAt.Value.AddHours(24) < DateTime.Now) ||
                    (!assignment.AssignedAt.HasValue && assignment.CreatedAt.AddHours(24) < DateTime.Now))
                {
                    assignment.Status = "Expired";
                    assignment.UpdatedAt = DateTime.Now;
                    if (assignment.Device != null)
                    {
                        assignment.Device.LifecycleStatus = "PickupExpired";
                    }
                    await db.SaveChangesAsync();

                    return BadRequest(new
                    {
                        message = "Response deadline has expired."
                    });
                }

                if (assignment.Status != "Assigned")
                {
                    return BadRequest(new
                    {
                        message = "This request cannot be accepted."
                    });
                }

                assignment.Status = "Accepted";
                assignment.RespondedAt = DateTime.Now;
                assignment.AcceptedAt = DateTime.Now;
                assignment.UpdatedAt = DateTime.Now;
                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Collection assignment accepted successfully.",
                    status = assignment.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error accepting collection assignment.",
                    error = ex.Message
                });
            }
        }

        [HttpPost("start-pickup/{assignmentId}")]
        public async Task<IActionResult> StartPickup(int assignmentId)
        {
            try
            {
                var assignment = await db.CollectionAssignments
                    .Include(x => x.Device)
                    .FirstOrDefaultAsync(x => x.CollectionAssignmentId == assignmentId);

                if (assignment == null)
                {
                    return NotFound(new { message = "Collection assignment not found." });
                }

                assignment.Status = "PickupStarted";
                assignment.PickupStartedAt = DateTime.Now;
                assignment.UpdatedAt = DateTime.Now;
                if (assignment.Device != null)
                {
                    assignment.Device.LifecycleStatus = "EnRoute";
                }
                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Pickup started successfully.",
                    status = assignment.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error starting pickup.", error = ex.Message });
            }
        }

        [HttpPost("reject/{assignmentId}")]

        public async Task<IActionResult> RejectAssignment(int assignmentId,[FromBody] string reason)
        {
            using var transaction = await db.Database.BeginTransactionAsync();

            try
            {
                var assignment = await db.CollectionAssignments
                    .Include(x => x.Device)
                        .ThenInclude(d => d.Category)
                    .Include(x => x.Device)
                        .ThenInclude(d => d.User)
                    .Include(x => x.CollectionAgent)
                        .ThenInclude(a => a.Login)
                    .FirstOrDefaultAsync(
                        x => x.CollectionAssignmentId == assignmentId
                    );

                if (assignment == null)
                {
                    return NotFound(new
                    {
                        message = "Collection assignment not found."
                    });
                }

                if (assignment.Status != "Assigned")
                {
                    return BadRequest(new
                    {
                        message = "This request cannot be rejected."
                    });
                }

                if (assignment.CollectionAgent == null)
                {
                    return BadRequest(new
                    {
                        message = "No collection agent is assigned to this collection assignment."
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
                // 1. SAVE THE CURRENT COLLECTION AGENT'S REJECTION
                // =========================================================

                var rejection = new AllocationRejection
                {
                    AllocationType = "CollectionAgent",
                    AllocationId = assignment.CollectionAssignmentId ?? 0,
                    LoginId = assignment.CollectionAgent.LoginId,
                    Reason = reason.Trim(),
                    RejectedAt = DateTime.Now
                };

                db.AllocationRejections.Add(rejection);

                // Mark current assignment as rejected
                int oldAgentId = assignment.CollectionAgentId ?? 0;

                assignment.Status = "Rejected";
                assignment.RespondedAt = DateTime.Now;
                assignment.RejectionReason = reason.Trim();
                assignment.UpdatedAt = DateTime.Now;

                // =========================================================
                // 2. FIND ANOTHER COLLECTION AGENT
                // =========================================================

                var newAgent = await FindAnotherCollectionAgent(
                    assignment.Device,
                    oldAgentId,
                    assignment.DeviceId
                );

                // =========================================================
                // 3. NO OTHER AGENT AVAILABLE
                // =========================================================

                if (newAgent == null)
                {
                    var waitingAssignment = new CollectionAssignment
                    {
                        DeviceId = assignment.DeviceId,

                        CollectionAgentId = null,

                        Status = "Waiting",

                        AssignedAt = null,

                        ResponseDeadline = DateTime.Now.AddHours(24),

                        CreatedAt = DateTime.Now,

                        UpdatedAt = DateTime.Now
                    };

                    db.CollectionAssignments.Add(waitingAssignment);

                    assignment.Device.LifecycleStatus =
                        "CollectionPending";

                    await db.SaveChangesAsync();

                    await transaction.CommitAsync();

                    return Ok(new
                    {
                        message =
                            "Request rejected. No suitable collection agent is available. Request moved to Waiting.",

                        previousAssignmentId =
                            assignment.CollectionAssignmentId,

                        newAssignmentId =
                            waitingAssignment.CollectionAssignmentId,

                        previousAgentId =
                            oldAgentId,

                        collectionAgentId =
                            (int?)null,

                        status =
                            "Waiting"
                    });
                }

                // =========================================================
                // 4. CREATE NEW ASSIGNMENT FOR NEW AGENT
                // =========================================================

                var techInfoReassign = await GetTechnicianLocationForDeviceAsync(assignment.DeviceId);
                var newAssignment = new CollectionAssignment
                {
                    DeviceId = assignment.DeviceId,
                    CollectionAgentId = newAgent.CollectionAgentId,
                    Status = "Assigned",
                    AssignedAt = DateTime.Now,
                    ResponseDeadline = DateTime.Now.AddHours(24),
                    TechnicianId = techInfoReassign.techId,
                    TechnicianCenterName = techInfoReassign.centerName,
                    DeliveredAddress = techInfoReassign.delAddress,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                db.CollectionAssignments.Add(newAssignment);

                assignment.Device.LifecycleStatus =
                    "CollectionAssigned";

                // =========================================================
                // 5. SAVE OLD REJECTED + NEW ASSIGNMENT
                // =========================================================

                await db.SaveChangesAsync();

                string fullAddress =
                    assignment.Device.Address +
                    (string.IsNullOrWhiteSpace(assignment.Device.User?.City) ? "" : $", {assignment.Device.User.City}") +
                    (string.IsNullOrWhiteSpace(assignment.Device.User?.District) ? "" : $", {assignment.Device.User.District}") +
                    (string.IsNullOrWhiteSpace(assignment.Device.User?.State) ? "" : $", {assignment.Device.User.State}") +
                    (string.IsNullOrWhiteSpace(assignment.Device.User?.Pincode) ? "" : $" - {assignment.Device.User.Pincode}");

                if (newAgent != null && newAgent.LoginId > 0)
                {
                    var notification = new Notification
                    {
                        LoginId = newAgent.LoginId,
                        Title = "New Pickup Request Assigned",
                        Message = $"COLLECT FROM Customer {assignment.Device.User?.FirstName} {assignment.Device.User?.LastName} ({fullAddress}) [Slot: {assignment.Device.PickupDate:dd-MM-yyyy} {assignment.Device.TimeSlot}] ↓ DELIVER TO {techInfoReassign.techName} ({techInfoReassign.centerName} - {techInfoReassign.delAddress})",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };

                    db.Notification.Add(notification);
                    await db.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                // =========================================================
                // 6. SEND EMAIL TO NEW AGENT
                // =========================================================

                string newAgentEmail = newAgent?.Login?.Email;
                if (string.IsNullOrWhiteSpace(newAgentEmail) && newAgent != null && newAgent.LoginId > 0)
                {
                    var loginObj = await db.Login.FirstOrDefaultAsync(l => l.LoginId == newAgent.LoginId);
                    newAgentEmail = loginObj?.Email;
                }

                if (newAgent != null && !string.IsNullOrWhiteSpace(newAgentEmail))
                {
                    string subject = "EcoCycle - Collection Pickup Request Reassigned";

                    string body = $@"
<!DOCTYPE html>
<html>
<body style=""font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; color: #0f172a;"">
    <div style=""max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;"">
        <h2 style=""color: #059669; margin-top: 0;"">EcoCycle Pickup Assignment Reassigned</h2>
        <p>Dear <strong>{newAgent.FirstName} {newAgent.LastName}</strong>,</p>
        <p>A collection pickup request for <strong>{assignment.Device.Brand} {assignment.Device.Model}</strong> (Assignment #{newAssignment.CollectionAssignmentId}) has been reassigned to you.</p>

        <div style=""background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 10px; margin-top: 16px;"">
            <div style=""font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.05em;"">COLLECT FROM</div>
            <div style=""font-weight: 700; color: #065f46; font-size: 15px; margin-top: 4px;"">Customer: {assignment.Device.User?.FirstName} {assignment.Device.User?.LastName} (Ph: {assignment.Device.User?.PhoneNumber})</div>
            <div style=""color: #047857; font-size: 14px; margin-top: 4px;""><strong>Customer pickup address:</strong> {fullAddress}</div>
            <div style=""color: #059669; font-size: 13px; margin-top: 4px;""><strong>Pickup date / time slot:</strong> {assignment.Device.PickupDate:dd-MM-yyyy} • {assignment.Device.TimeSlot}</div>
        </div>

        <div style=""text-align: center; font-size: 24px; font-weight: bold; color: #059669; margin: 10px 0;"">↓</div>

        <div style=""background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 10px;"">
            <div style=""font-size: 11px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.05em;"">DELIVER TO</div>
            <div style=""font-weight: 700; color: #1e40af; font-size: 15px; margin-top: 4px;"">Technician / Inspection Center: {techInfoReassign.techName} ({techInfoReassign.centerName}) {(string.IsNullOrEmpty(techInfoReassign.techPhone) ? "" : $"• Ph: {techInfoReassign.techPhone}")}</div>
            <div style=""color: #1e3a8a; font-size: 14px; margin-top: 4px;""><strong>Technician/center address:</strong> {techInfoReassign.delAddress}</div>
        </div>

        <div style=""margin-top: 24px; text-align: center;"">
            <a href=""https://localhost:7102"" style=""background: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; display: inline-block;"">[ Start Pickup ]</a>
        </div>

        <p style=""margin-top: 24px; font-size: 12px; color: #64748b;"">
            Regards,<br/><strong>EcoCycle Admin Team</strong>
        </p>
    </div>
</body>
</html>";

                    await SendEmailAsync(
                        newAgentEmail,
                        subject,
                        body
                    );
                }

                // =========================================================
                // 7. SUCCESS RESPONSE
                // =========================================================

                return Ok(new
                {
                    message =
                        "Collection agent rejected the request and it was automatically reassigned.",

                    previousAssignmentId =
                        assignment.CollectionAssignmentId,

                    previousAgentId =
                        oldAgentId,

                    newAssignmentId =
                        newAssignment.CollectionAssignmentId,

                    collectionAgentId =
                        newAgent.CollectionAgentId,

                    collectionAgentName =
                        $"{newAgent.FirstName} {newAgent.LastName}",

                    collectionAgentEmail =
                        newAgent.Login?.Email,

                    status =
                        newAssignment.Status
                });
            }
            catch (Exception ex)
            {
                try
                {
                    await transaction.RollbackAsync();
                }
                catch
                {
                }

                Console.WriteLine("==========================================");
                Console.WriteLine("REJECT ASSIGNMENT ERROR");
                Console.WriteLine(ex.ToString());
                Console.WriteLine("==========================================");

                return StatusCode(500, new
                {
                    message =
                        "Error rejecting and reassigning collection assignment.",

                    error =
                        ex.Message,

                    details =
                        ex.ToString()
                });
            }
        }

        [HttpGet("admin/all-assignments")]
        public async Task<IActionResult> GetAllCollectionAssignments()
        {
            await CheckAndUpdateExpiredCollectionAssignments(db);

            try
            {
                // Default fallback technician from Technician table if device does not have an allocated technician yet
                var defaultTechnician = await db.Technician
                    .Where(t => t.Status == "Approved" || t.Status == "Active")
                    .OrderBy(t => t.TechnicianId)
                    .FirstOrDefaultAsync() ?? await db.Technician.OrderBy(t => t.TechnicianId).FirstOrDefaultAsync();

                var allPickupsList = await db.Pickups.ToListAsync();
                var pickupDict = allPickupsList
                    .GroupBy(p => p.CollectionAssignmentId)
                    .ToDictionary(g => g.Key, g => g.OrderByDescending(p => p.CreatedAt).FirstOrDefault());

                var allDeliveriesList = await db.Deliveries.ToListAsync();
                var deliveryDict = allDeliveriesList
                    .GroupBy(d => d.CollectionAssignmentId)
                    .ToDictionary(g => g.Key, g => g.OrderByDescending(d => d.CreatedAt).FirstOrDefault());

                var rawAssignments = await db.CollectionAssignments
                    .Include(x => x.Device)
                        .ThenInclude(d => d.Category)
                    .Include(x => x.Device)
                        .ThenInclude(d => d.User)
                    .Include(x => x.Device)
                        .ThenInclude(d => d.InspectionRequests)
                            .ThenInclude(ir => ir.Technician)
                    .Include(x => x.CollectionAgent)
                        .ThenInclude(a => a.Login)
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();

                var assignments = rawAssignments.Select(x =>
                {
                    var pickupObj = x.CollectionAssignmentId.HasValue && pickupDict.TryGetValue(x.CollectionAssignmentId.Value, out var foundPickup)
                        ? foundPickup
                        : null;
                    var delObj = x.CollectionAssignmentId.HasValue && deliveryDict.TryGetValue(x.CollectionAssignmentId.Value, out var foundDel)
                        ? foundDel
                        : null;
                    string proofPath = pickupObj?.ProofPhotoPath ?? delObj?.ProofPhotoPath;
                    var latestInspTech = x.Device?.InspectionRequests?
                        .OrderByDescending(ir => ir.CreatedAt)
                        .Select(ir => ir.Technician)
                        .FirstOrDefault(t => t != null) ?? defaultTechnician;

                    string techName = latestInspTech != null ? $"{latestInspTech.FirstName} {latestInspTech.LastName}".Trim() : null;
                    string techPhone = latestInspTech?.PhoneNumber;
                    string centerName = latestInspTech?.InspectionCenterName;
                    string techAddress = latestInspTech?.Address;
                    string techCity = latestInspTech?.City;
                    string techDistrict = latestInspTech?.District;
                    string techState = latestInspTech?.State;
                    string techPincode = latestInspTech?.PinCode;

                    string delAddr = null;
                    if (latestInspTech != null)
                    {
                        var parts = new List<string>();
                        if (!string.IsNullOrWhiteSpace(centerName)) parts.Add(centerName);
                        if (!string.IsNullOrWhiteSpace(techAddress)) parts.Add(techAddress);
                        if (!string.IsNullOrWhiteSpace(techCity)) parts.Add(techCity);
                        if (!string.IsNullOrWhiteSpace(techDistrict)) parts.Add(techDistrict);
                        if (!string.IsNullOrWhiteSpace(techState)) parts.Add(techState);
                        if (!string.IsNullOrWhiteSpace(techPincode)) parts.Add(techPincode);
                        delAddr = string.Join(", ", parts);
                    }

                    return new
                    {
                        collectionAssignmentId = x.CollectionAssignmentId,
                        deviceId = x.DeviceId,
                        brand = x.Device.Brand,
                        model = x.Device.Model,
                        categoryName = x.Device.Category != null ? x.Device.Category.CategoryName : "E-Waste",
                        quantity = x.Device.Quantity,
                        condition = x.Device.Condition,
                        working = x.Device.Working,
                        customerName = x.Device.User != null ? x.Device.User.FirstName + " " + x.Device.User.LastName : "",
                        customerPhone = x.Device.User != null ? x.Device.User.PhoneNumber : "",
                        address = x.Device.Address,
                        landmark = x.Device.Landmark,
                        city = x.Device.User != null ? x.Device.User.City : "",
                        district = x.Device.User != null ? x.Device.User.District : "",
                        state = x.Device.User != null ? x.Device.User.State : "",
                        pincode = x.Device.User != null ? x.Device.User.Pincode : "",
                        collectionAgentId = x.CollectionAgentId,
                        collectionAgentName = x.CollectionAgent != null ? x.CollectionAgent.FirstName + " " + x.CollectionAgent.LastName : "Unassigned",
                        collectionAgentPhone = x.CollectionAgent != null ? x.CollectionAgent.Phone : "",
                        collectionAgentEmail = x.CollectionAgent != null && x.CollectionAgent.Login != null ? x.CollectionAgent.Login.Email : "",
                        collectionAgentPhoto = x.CollectionAgent != null ? x.CollectionAgent.ProfilePicture : null,
                        vehicleNumber = x.CollectionAgent != null ? x.CollectionAgent.VehicleNumber : null,
                        vehicleType = x.CollectionAgent != null ? x.CollectionAgent.VehicleType : null,
                        status = x.Status,
                        assignedAt = x.AssignedAt,
                        responseDeadline = x.ResponseDeadline ?? (x.AssignedAt.HasValue ? x.AssignedAt.Value.AddHours(24) : x.CreatedAt.AddHours(24)),
                        respondedAt = x.RespondedAt,
                        acceptedAt = x.AcceptedAt,
                        pickupStartedAt = x.PickupStartedAt,
                        startedAt = x.PickupStartedAt,
                        pickedUpAt = x.PickedUpAt,
                        deliveredAt = x.DeliveredAt,
                        completedAt = x.DeliveredAt,
                        rejectionReason = x.RejectionReason,
                        createdAt = x.CreatedAt,
                        pickupDate = x.Device.PickupDate,
                        timeSlot = x.Device.TimeSlot,
                        pickupInstructions = x.Device.PickupInstructions,
                        lifecycleStatus = x.Device.LifecycleStatus,

                        // Pickup Model Table Fields:
                        pickupId = pickupObj?.PickupId,
                        pickupStatus = pickupObj?.Status,
                        deviceVerified = pickupObj?.DeviceVerified ?? false,
                        proofPhotoPath = proofPath,
                        agentNotes = pickupObj?.AgentNotes,
                        failureReason = pickupObj?.FailureReason ?? x.RejectionReason,

                        // Delivery Model Table Fields (STRICTLY FROM DELIVERIES TABLE):
                        deliveryId = delObj?.DeliveryId,
                        deliveryStatus = delObj?.Status ?? "Pending",
                        deliveryStartedAt = delObj?.StartedAt,
                        deliveryDeliveredAt = delObj?.DeliveredAt,
                        deliveryDeviceVerified = delObj?.DeviceVerified ?? false,
                        deliveryAgentNotes = delObj?.AgentNotes,
                        deliveryFailureReason = delObj?.FailureReason,
                        technicianId = latestInspTech?.TechnicianId,
                        technicianName = techName,
                        technicianPhone = techPhone,
                        inspectionCenterName = centerName,
                        technicianAddress = techAddress,
                        technicianCity = techCity,
                        technicianDistrict = techDistrict,
                        technicianState = techState,
                        technicianPincode = techPincode,
                        deliveredAddress = delAddr
                    };
                });

                return Ok(assignments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error retrieving collection assignments.",
                    error = ex.Message
                });
            }
        }

        private async Task<CollectionAgent?> FindAnotherCollectionAgent(Device device, int? excludedAgentId, int deviceId)
        {
            // =========================================================
            // GET ALL PREVIOUS COLLECTION ASSIGNMENTS & REJECTIONS FOR THIS DEVICE
            // =========================================================

            var collectionAssignmentIds =
                await db.CollectionAssignments
                    .Where(x => x.DeviceId == deviceId && x.CollectionAssignmentId.HasValue)
                    .Select(x => x.CollectionAssignmentId!.Value)
                    .ToListAsync();

            var rejectedAgentIds =
                await db.CollectionAssignments
                    .Where(x =>
                        x.DeviceId == deviceId &&
                        x.Status == "Rejected" &&
                        x.CollectionAgentId.HasValue)
                    .Select(x => x.CollectionAgentId!.Value)
                    .Distinct()
                    .ToListAsync();

            var rejectedLoginIds =
                await db.AllocationRejections
                    .Where(x =>
                        x.AllocationType == "CollectionAgent" &&
                        collectionAssignmentIds.Contains(x.AllocationId))
                    .Select(x => x.LoginId)
                    .Distinct()
                    .ToListAsync();

            // =========================================================
            // GET ACTIVE COLLECTION AGENTS
            // EXCLUDE:
            // 1. CURRENT/OLD AGENT
            // 2. ALL PREVIOUSLY REJECTING AGENTS
            // =========================================================

            var agents = await db.CollectionAgents
                .Include(x => x.Login)
                .Where(x =>
                    x.Status == "Active" &&
                    (!excludedAgentId.HasValue ||
                        x.CollectionAgentId != excludedAgentId.Value) &&
                    !rejectedAgentIds.Contains(x.CollectionAgentId) &&
                    !rejectedLoginIds.Contains(x.LoginId)
                )
                .ToListAsync();

            if (!agents.Any())
            {
                return null;
            }

            var candidates =
                new List<(CollectionAgent Agent, int Workload)>();

            // =========================================================
            // CHECK EACH AGENT
            // =========================================================

            foreach (var agent in agents)
            {
                // Strict State match
                if (device.User != null &&
                    !string.IsNullOrWhiteSpace(device.User.State) &&
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
                if (device.User != null &&
                    !string.IsNullOrWhiteSpace(device.User.District) &&
                    !string.IsNullOrWhiteSpace(agent.District))
                {
                    if (!device.User.District.Trim().Equals(
                            agent.District.Trim(),
                            StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }
                }

                // =====================================================
                // CURRENT WORKLOAD
                // =====================================================

                int workload =
                    await db.CollectionAssignments.CountAsync(x =>
                        x.CollectionAgentId ==
                            agent.CollectionAgentId &&

                        (
                            x.Status == "Assigned" ||
                            x.Status == "Accepted" ||
                            x.Status == "PickupStarted"
                        )
                    );

                if (workload >= 5)
                    continue;

                candidates.Add(
                    (agent, workload)
                );
            }

            // =========================================================
            // SELECT LOWEST WORKLOAD
            // =========================================================

            return candidates
                .OrderBy(x => x.Workload)
                .Select(x => x.Agent)
                .FirstOrDefault();
        }

        [HttpPost("reassign/{assignmentId}/{agentId}")]
        public async Task<IActionResult> ReassignCollectionAgent(
    int assignmentId,
    int agentId)
        {
            try
            {
                // Find the existing assignment
                var assignment = await db.CollectionAssignments
                    .Include(x => x.Device)
                        .ThenInclude(d => d.User)
                    .Include(x => x.Device)
                        .ThenInclude(d => d.Category)
                    .FirstOrDefaultAsync(
                        x => x.CollectionAssignmentId == assignmentId
                    );

                if (assignment == null)
                {
                    return NotFound(new
                    {
                        message = "Collection assignment not found."
                    });
                }

                // Find selected collection agent
                var agent = await db.CollectionAgents
                    .Include(x => x.Login)
                    .FirstOrDefaultAsync(
                        x => x.CollectionAgentId == agentId
                    );

                if (agent == null)
                {
                    return NotFound(new
                    {
                        message = "Selected collection agent not found."
                    });
                }

                // =========================================================
                // ONLY ALLOW MANUAL ASSIGNMENT FROM WAITING STATUS
                // =========================================================

                if (assignment.Status != "Waiting")
                {
                    return BadRequest(new
                    {
                        message =
                            "Only a Waiting collection assignment can be manually assigned."
                    });
                }

                // =========================================================
                // UPDATE THE EXISTING WAITING RECORD
                // DO NOT CREATE A NEW CollectionAssignment
                // =========================================================

                var techInfoManual = await GetTechnicianLocationForDeviceAsync(assignment.DeviceId);
                assignment.CollectionAgentId = agent.CollectionAgentId;
                assignment.Status = "Assigned";
                assignment.AssignedAt = DateTime.Now;
                assignment.ResponseDeadline = DateTime.Now.AddHours(24);
                assignment.TechnicianId = techInfoManual.techId;
                assignment.TechnicianCenterName = techInfoManual.centerName;
                assignment.DeliveredAddress = techInfoManual.delAddress;
                assignment.UpdatedAt = DateTime.Now;
                assignment.RejectionReason = null;

                // Update device lifecycle status
                assignment.Device.LifecycleStatus =
                    "CollectionAssigned";

                await db.SaveChangesAsync();

                var device = assignment.Device;
                string fullAddress =
                    device.Address +
                    (string.IsNullOrWhiteSpace(device.User?.City) ? "" : $", {device.User.City}") +
                    (string.IsNullOrWhiteSpace(device.User?.District) ? "" : $", {device.User.District}") +
                    (string.IsNullOrWhiteSpace(device.User?.State) ? "" : $", {device.User.State}") +
                    (string.IsNullOrWhiteSpace(device.User?.Pincode) ? "" : $" - {device.User.Pincode}");

                if (agent != null && agent.LoginId > 0)
                {
                    var notification = new Notification
                    {
                        LoginId = agent.LoginId,
                        Title = "New Pickup Request Assigned",
                        Message = $"COLLECT FROM Customer {device.User?.FirstName} {device.User?.LastName} ({fullAddress}) [Slot: {device.PickupDate:dd-MM-yyyy} {device.TimeSlot}] ↓ DELIVER TO {techInfoManual.techName} ({techInfoManual.centerName} - {techInfoManual.delAddress})",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };

                    db.Notification.Add(notification);
                    await db.SaveChangesAsync();
                }

                // =========================================================
                // SEND EMAIL TO SELECTED COLLECTION AGENT
                // =========================================================

                string agentEmail = agent?.Login?.Email;
                if (string.IsNullOrWhiteSpace(agentEmail) && agent != null && agent.LoginId > 0)
                {
                    var loginObj = await db.Login.FirstOrDefaultAsync(l => l.LoginId == agent.LoginId);
                    agentEmail = loginObj?.Email;
                }

                if (agent != null && !string.IsNullOrWhiteSpace(agentEmail))
                {
                    string subject = "EcoCycle - Collection Pickup Request Assigned";

                    string body = $@"
<!DOCTYPE html>
<html>
<body style=""font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px; color: #0f172a;"">
    <div style=""max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;"">
        <h2 style=""color: #059669; margin-top: 0;"">EcoCycle Pickup Assignment</h2>
        <p>Dear <strong>{agent.FirstName} {agent.LastName}</strong>,</p>
        <p>A collection pickup request for <strong>{device.Brand} {device.Model}</strong> (Assignment #{assignment.CollectionAssignmentId}) has been assigned to you.</p>

        <div style=""background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 10px; margin-top: 16px;"">
            <div style=""font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 0.05em;"">COLLECT FROM</div>
            <div style=""font-weight: 700; color: #065f46; font-size: 15px; margin-top: 4px;"">Customer: {device.User?.FirstName} {device.User?.LastName} (Ph: {device.User?.PhoneNumber})</div>
            <div style=""color: #047857; font-size: 14px; margin-top: 4px;""><strong>Customer pickup address:</strong> {fullAddress}</div>
            <div style=""color: #059669; font-size: 13px; margin-top: 4px;""><strong>Pickup date / time slot:</strong> {device.PickupDate:dd-MM-yyyy} • {device.TimeSlot}</div>
        </div>

        <div style=""text-align: center; font-size: 24px; font-weight: bold; color: #059669; margin: 10px 0;"">↓</div>

        <div style=""background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 10px;"">
            <div style=""font-size: 11px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.05em;"">DELIVER TO</div>
            <div style=""font-weight: 700; color: #1e40af; font-size: 15px; margin-top: 4px;"">Technician / Inspection Center: {techInfoManual.techName} ({techInfoManual.centerName}) {(string.IsNullOrEmpty(techInfoManual.techPhone) ? "" : $"• Ph: {techInfoManual.techPhone}")}</div>
            <div style=""color: #1e3a8a; font-size: 14px; margin-top: 4px;""><strong>Technician/center address:</strong> {techInfoManual.delAddress}</div>
        </div>

        <div style=""margin-top: 24px; text-align: center;"">
            <a href=""https://localhost:7102"" style=""background: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; display: inline-block;"">[ Start Pickup ]</a>
        </div>

        <p style=""margin-top: 24px; font-size: 12px; color: #64748b;"">
            Regards,<br/><strong>EcoCycle Admin Team</strong>
        </p>
    </div>
</body>
</html>";

                    await SendEmailAsync(
                        agentEmail,
                        subject,
                        body
                    );
                }

                // =========================================================
                // SUCCESS RESPONSE
                // =========================================================

                return Ok(new
                {
                    message =
                        "Waiting collection assignment successfully assigned to the selected collection agent.",

                    assignmentId =
                        assignment.CollectionAssignmentId,

                    deviceId =
                        assignment.DeviceId,

                    collectionAgentId =
                        assignment.CollectionAgentId,

                    collectionAgentName =
                        $"{agent.FirstName} {agent.LastName}",

                    collectionAgentEmail =
                        agent.Login?.Email,

                    status =
                        assignment.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message =
                        "Error manually assigning collection agent.",

                    error =
                        ex.Message
                });
            }
        }

        [HttpPost("auto-reassign/{assignmentId}")]
        public async Task<IActionResult> AutoReassignCollectionAgent(
    int assignmentId)
        {
            using var transaction =
                await db.Database.BeginTransactionAsync();

            try
            {
                var assignment =
                    await db.CollectionAssignments
                        .Include(x => x.Device)
                            .ThenInclude(d => d.User)
                        .Include(x => x.Device)
                            .ThenInclude(d => d.Category)
                        .FirstOrDefaultAsync(
                            x => x.CollectionAssignmentId == assignmentId
                        );

                if (assignment == null)
                {
                    return NotFound(new
                    {
                        message =
                            "Collection assignment not found."
                    });
                }

                var newAgent =
                    await FindAnotherCollectionAgent(
                        assignment.Device,
                        assignment.CollectionAgentId,
                        assignment.DeviceId
                    );

                // =========================================================
                // NO AGENT -> CREATE WAITING RECORD
                // =========================================================

                if (newAgent == null)
                {
                    var waitingAssignment =
                        new CollectionAssignment
                        {
                            DeviceId =
                                assignment.DeviceId,

                            CollectionAgentId =
                                null,

                            Status =
                                "Waiting",

                            AssignedAt =
                                null,

                            ResponseDeadline =
                                DateTime.Now.AddHours(24),

                            CreatedAt =
                                DateTime.Now,

                            UpdatedAt =
                                DateTime.Now
                        };

                    db.CollectionAssignments.Add(
                        waitingAssignment
                    );

                    assignment.Device.LifecycleStatus =
                        "CollectionPending";

                    await db.SaveChangesAsync();

                    await transaction.CommitAsync();

                    return Ok(new
                    {
                        message =
                            "No alternative collection agent available. New waiting assignment created.",

                        previousAssignmentId =
                            assignment.CollectionAssignmentId,

                        newAssignmentId =
                            waitingAssignment.CollectionAssignmentId,

                        status =
                            "Waiting"
                    });
                }

                // =========================================================
                // CREATE NEW ASSIGNMENT
                // =========================================================

                var newAssignment =
                    new CollectionAssignment
                    {
                        DeviceId =
                            assignment.DeviceId,

                        CollectionAgentId =
                            newAgent.CollectionAgentId,

                        Status =
                            "Assigned",

                        AssignedAt =
                            DateTime.Now,

                        ResponseDeadline =
                            DateTime.Now.AddHours(24),

                        CreatedAt =
                            DateTime.Now,

                        UpdatedAt =
                            DateTime.Now
                    };

                db.CollectionAssignments.Add(
                    newAssignment
                );

                assignment.Device.LifecycleStatus =
                    "CollectionAssigned";

                await db.SaveChangesAsync();

                if (newAgent != null && newAgent.LoginId > 0)
                {
                    var notification = new Notification
                    {
                        LoginId = newAgent.LoginId,
                        Title = "New Pickup Request Assigned",
                        Message = $"A new pickup request for {assignment.Device.Brand} {assignment.Device.Model} has been reassigned to you.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };

                    db.Notification.Add(notification);
                    await db.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                return Ok(new
                {
                    message =
                        "Collection assignment automatically reassigned to another agent.",

                    previousAssignmentId =
                        assignment.CollectionAssignmentId,

                    newAssignmentId =
                        newAssignment.CollectionAssignmentId,

                    status =
                        newAssignment.Status,

                    collectionAgentId =
                        newAgent.CollectionAgentId,

                    collectionAgentName =
                        $"{newAgent.FirstName} {newAgent.LastName}"
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                return StatusCode(500, new
                {
                    message =
                        "Error automatically reassigning collection agent.",

                    error =
                        ex.Message
                });
            }
        }
    }
}