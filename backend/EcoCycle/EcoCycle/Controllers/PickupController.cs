using EcoCycle.API.Data;
using EcoCycle.API.Models;
using EcoCycle.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcoCycle.API.Controllers
{
    public class RequestPickupAgainDto
    {
        public DateTime PickupDate { get; set; }
        public string TimeSlot { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
    }

    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PickupController : ControllerBase
    {
        private readonly ApplicationDbContext db;
        private readonly IWebHostEnvironment env;
        private readonly EmailService emailService;

        public PickupController(ApplicationDbContext db, IWebHostEnvironment env, EmailService emailService)
        {
            this.db = db;
            this.env = env;
            this.emailService = emailService;
        }

        private async Task<CollectionAgent?> FindBestCollectionAgent(Device device)
        {
            var agents = await db.CollectionAgents
                .Include(x => x.Login)
                .Where(x => x.Status == "Active")
                .ToListAsync();

            if (!agents.Any())
            {
                return null;
            }

            var candidates = new List<(CollectionAgent Agent, int Workload)>();

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

                int workload = await db.CollectionAssignments
                    .CountAsync(x =>
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

        [HttpPost("request-again/{deviceid}")]
        public async Task<IActionResult> RequestPickupAgain(int deviceid, [FromBody] RequestPickupAgainDto request)
        {
            try
            {
                var loginIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (loginIdClaim == null || !int.TryParse(loginIdClaim.Value, out int loginId))
                {
                    return Unauthorized(new { message = "User identity not found." });
                }

                var user = await db.Users.FirstOrDefaultAsync(u => u.LoginId == loginId);
                if (user == null)
                {
                    return Unauthorized(new { message = "User record not found." });
                }

                var device = await db.Device
                    .Include(d => d.User)
                    .FirstOrDefaultAsync(d => d.DeviceId == deviceid && d.UserId == user.UserId);

                if (device == null)
                {
                    return NotFound(new { message = "Device not found or does not belong to you." });
                }

                // Update device details
                device.PickupDate = request.PickupDate;
                if (!string.IsNullOrWhiteSpace(request.TimeSlot))
                {
                    device.TimeSlot = request.TimeSlot;
                }
                if (!string.IsNullOrWhiteSpace(request.Address))
                {
                    device.Address = request.Address;
                }
                // Keep device Status as Accepted (do not revert to Pending requiring admin approval)
                if (device.Status != "Rejected")
                {
                    device.Status = "Accepted";
                }
                device.LifecycleStatus = "CollectionPending";

                // Auto allocate best collection agent
                var agent = await FindBestCollectionAgent(device);

                var newAssignment = new CollectionAssignment
                {
                    DeviceId = deviceid,
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

                db.CollectionAssignments.Add(newAssignment);
                await db.SaveChangesAsync();

                if (agent != null && agent.LoginId > 0)
                {
                    var notification = new Notification
                    {
                        LoginId = agent.LoginId,
                        Title = "New Pickup Request Assigned",
                        Message = $"A new pickup request for {device.Brand} {device.Model} (Device #{deviceid}) has been assigned to you.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };
                    db.Notification.Add(notification);
                    await db.SaveChangesAsync();
                }

                return Ok(new
                {
                    message = "Pickup request submitted again successfully.",
                    deviceId = deviceid,
                    assignmentStatus = newAssignment.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "An error occurred while requesting pickup again.",
                    error = ex.Message
                });
            }
        }

        [HttpPost("cancelpickup/{deviceid}")]
        public async Task<IActionResult> CancelPickup(int deviceid)
        {
            try
            {
                // Find the device with User included for rich notification details
                var device = await db.Device
                    .Include(d => d.User)
                    .FirstOrDefaultAsync(d => d.DeviceId == deviceid);

                if (device == null)
                {
                    return NotFound(new
                    {
                        message = "Device does not exist.",
                        deviceId = deviceid
                    });
                }

                var deviceName = $"{device.Brand} {device.Model}".Trim();
                if (string.IsNullOrWhiteSpace(deviceName)) deviceName = $"Device #{deviceid}";
                var citizenName = device.User != null ? $"{device.User.FirstName} {device.User.LastName}".Trim() : "Citizen";
                var dateStr = device.PickupDate != default ? device.PickupDate.ToString("dd MMM yyyy") : "Scheduled Date";
                var slotStr = !string.IsNullOrWhiteSpace(device.TimeSlot) ? device.TimeSlot : "Scheduled Slot";
                var addressStr = !string.IsNullOrWhiteSpace(device.Address) ? device.Address : "Registered Address";

                // Find active collection assignment
                var collectionAssignment = await db.CollectionAssignments
                    .Include(c => c.CollectionAgent)
                    .FirstOrDefaultAsync(c =>
                        c.DeviceId == deviceid &&
                        c.Status != "Completed" &&
                        c.Status != "Delivered" &&
                        c.Status != "Rejected" &&
                        c.Status != "Cancelled");

                // Blocking Check: If device is already physically collected / in-transit / delivered / completed
                if (collectionAssignment != null)
                {
                    var cas = collectionAssignment.Status?.ToLower();
                    if (cas == "pickupstarted" || cas == "pickedup" || cas == "intransit" || cas == "delivered" || cas == "completed")
                    {
                        return BadRequest(new
                        {
                            message = $"Pickup for {deviceName} cannot be cancelled because the device has already been physically collected."
                        });
                    }
                }

                // 1. Cancel CollectionAssignment & Notify Collection Agent (Notification + Email)
                if (collectionAssignment != null)
                {
                    collectionAssignment.Status = "Cancelled";
                    collectionAssignment.UpdatedAt = DateTime.Now;

                    var agent = collectionAssignment.CollectionAgent;
                    if (agent == null && collectionAssignment.CollectionAgentId.HasValue)
                    {
                        agent = await db.CollectionAgents.FirstOrDefaultAsync(a => a.CollectionAgentId == collectionAssignment.CollectionAgentId.Value);
                    }

                    if (agent != null && agent.LoginId > 0)
                    {
                        var notification = new Notification
                        {
                            LoginId = agent.LoginId,
                            Title = $"🚫 Pickup Cancelled: {deviceName}",
                            Message = $"Citizen {citizenName} has cancelled the pickup request for {deviceName} (Tag #DEV-{deviceid}) scheduled for {dateStr} ({slotStr}) at {addressStr}. The pickup task has been removed from your active list.",
                            Isread = false,
                            Status = true,
                            CreatedAt = DateTime.Now
                        };
                        db.Notification.Add(notification);

                        // Send Email to Collection Agent
                        var agentLogin = await db.Login.FirstOrDefaultAsync(l => l.LoginId == agent.LoginId);
                        if (agentLogin != null && !string.IsNullOrWhiteSpace(agentLogin.Email))
                        {
                            string agentSubj = $"[EcoCycle Alert] Pickup Cancelled - Device Tag #DEV-{deviceid}";
                            string agentBody = $@"
                                <div style='font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;'>
                                    <div style='background: #ef4444; color: #ffffff; padding: 12px 18px; border-radius: 8px; font-size: 18px; font-weight: bold;'>
                                        🚫 Pickup Request Cancelled
                                    </div>
                                    <p>Hello <strong>{agent.FirstName} {agent.LastName}</strong>,</p>
                                    <p>Citizen <strong>{citizenName}</strong> has cancelled the scheduled pickup request for the following device:</p>
                                    <table style='width: 100%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 8px;'>
                                        <tr><td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'><strong>Device Tag:</strong></td><td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>#DEV-{deviceid}</td></tr>
                                        <tr><td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'><strong>Device Name:</strong></td><td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>{deviceName}</td></tr>
                                        <tr><td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'><strong>Scheduled Date:</strong></td><td style='padding: 10px; border-bottom: 1px solid #e2e8f0;'>{dateStr} ({slotStr})</td></tr>
                                        <tr><td style='padding: 10px;'><strong>Pickup Address:</strong></td><td style='padding: 10px;'>{addressStr}</td></tr>
                                    </table>
                                    <p>This collection task has been removed from your active assignments. No further action is required from your side.</p>
                                    <p style='color: #64748b; font-size: 13px;'>Regards,<br/>EcoCycle Operations Team</p>
                                </div>";
                            _ = emailService.SendEmailAsync(agentLogin.Email, agentSubj, agentBody);
                        }
                    }
                }

                // 2. Cancel InspectionRequest & Notify Technician (Notification + Email)
                var inspectionRequest = await db.InspectionRequest
                    .Include(ir => ir.Technician)
                    .FirstOrDefaultAsync(ir =>
                        ir.DeviceId == deviceid &&
                        ir.Status != "Completed" &&
                        ir.Status != "Approved" &&
                        ir.Status != "Rejected" &&
                        ir.Status != "Cancelled");

                if (inspectionRequest != null)
                {
                    inspectionRequest.Status = "Cancelled";
                    inspectionRequest.UpdatedAt = DateTime.Now;

                    var tech = inspectionRequest.Technician;
                    if (tech == null && inspectionRequest.TechnicianId.HasValue)
                    {
                        tech = await db.Technician.FirstOrDefaultAsync(t => t.TechnicianId == inspectionRequest.TechnicianId.Value);
                    }

                    if (tech != null && tech.LoginId > 0)
                    {
                        var techNotification = new Notification
                        {
                            LoginId = tech.LoginId,
                            Title = $"🚫 Inspection Cancelled: {deviceName}",
                            Message = $"Pickup request cycle for {deviceName} (Tag #DEV-{deviceid}) was cancelled by citizen {citizenName}. Your inspection assignment for this device has been released.",
                            Isread = false,
                            Status = true,
                            CreatedAt = DateTime.Now
                        };
                        db.Notification.Add(techNotification);

                        // Send Email to Technician
                        var techLogin = await db.Login.FirstOrDefaultAsync(l => l.LoginId == tech.LoginId);
                        if (techLogin != null && !string.IsNullOrWhiteSpace(techLogin.Email))
                        {
                            string techSubj = $"[EcoCycle Alert] Inspection Assignment Cancelled - Device Tag #DEV-{deviceid}";
                            string techBody = $@"
                                <div style='font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;'>
                                    <div style='background: #ef4444; color: #ffffff; padding: 12px 18px; border-radius: 8px; font-size: 18px; font-weight: bold;'>
                                        🚫 Inspection Assignment Cancelled
                                    </div>
                                    <p>Hello <strong>{tech.FirstName} {tech.LastName}</strong>,</p>
                                    <p>The pickup request cycle for <strong>{deviceName}</strong> (Tag #DEV-{deviceid}) was cancelled by citizen <strong>{citizenName}</strong>.</p>
                                    <p>Your inspection assignment for this device has been released and cleared from your workload schedule.</p>
                                    <p style='color: #64748b; font-size: 13px;'>Regards,<br/>EcoCycle Inspection Operations</p>
                                </div>";
                            _ = emailService.SendEmailAsync(techLogin.Email, techSubj, techBody);
                        }
                    }
                }

                // 3. Notify Citizen (Confirmation Notification + Email)
                if (device.User != null && device.User.LoginId > 0)
                {
                    var citizenNotification = new Notification
                    {
                        LoginId = device.User.LoginId,
                        Title = $"🚫 Pickup Cancellation Confirmed: {deviceName}",
                        Message = $"Your pickup request for {deviceName} (Tag #DEV-{deviceid}) scheduled on {dateStr} ({slotStr}) at {addressStr} has been cancelled successfully. Your device remains registered in your account and you can request allocation again whenever ready.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };
                    db.Notification.Add(citizenNotification);

                    // Send Email to Citizen
                    var citizenLogin = await db.Login.FirstOrDefaultAsync(l => l.LoginId == device.User.LoginId);
                    if (citizenLogin != null && !string.IsNullOrWhiteSpace(citizenLogin.Email))
                    {
                        string citizenSubj = $"[EcoCycle Confirmation] Pickup Cancellation Confirmed - {deviceName}";
                        string citizenBody = $@"
                            <div style='font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;'>
                                <div style='background: #3b82f6; color: #ffffff; padding: 12px 18px; border-radius: 8px; font-size: 18px; font-weight: bold;'>
                                    🚫 Pickup Cancellation Confirmed
                                </div>
                                <p>Hello <strong>{citizenName}</strong>,</p>
                                <p>Your pickup request for <strong>{deviceName}</strong> (Tag #DEV-{deviceid}) scheduled on <strong>{dateStr}</strong> has been cancelled successfully.</p>
                                <p>Your device remains registered and approved in your account. You may click 'Request Allocation Again' at any time to reschedule your pickup.</p>
                                <p style='color: #64748b; font-size: 13px;'>Regards,<br/>EcoCycle Customer Support</p>
                            </div>";
                        _ = emailService.SendEmailAsync(citizenLogin.Email, citizenSubj, citizenBody);
                    }
                }

                // 4. Notify Admin Users
                var adminLoginIds = await db.Login
                    .Include(l => l.Role)
                    .Where(l => l.Role != null && (l.Role.Name.ToLower() == "admin" || l.Role.Name.ToLower() == "superadmin" || l.Role.Name.ToLower() == "administrator"))
                    .Select(l => l.LoginId)
                    .ToListAsync();

                foreach (var adminLoginId in adminLoginIds)
                {
                    var adminNotification = new Notification
                    {
                        LoginId = adminLoginId,
                        Title = $"🚫 Citizen Cancelled Pickup: {deviceName}",
                        Message = $"Citizen {citizenName} cancelled the pickup request cycle for {deviceName} (Tag #DEV-{deviceid}) scheduled for {dateStr} at {addressStr}. Assigned collection agent and technician have been released.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };
                    db.Notification.Add(adminNotification);
                }

                // 5. Update device status - Keep device.Status Approved / Accepted (Do NOT set to Rejected or Cancelled)
                if (device.Status != "Rejected" && device.Status != "Inactive" && device.Status != "Deleted")
                {
                    if (device.Status == "Pending")
                    {
                        device.Status = "Approved";
                    }
                }

                device.LifecycleStatus = "PickupCancelled";
                device.AllocationRequested = false;

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = $"Pickup request for {deviceName} (Tag #DEV-{deviceid}) cancelled successfully.",
                    deviceId = deviceid,
                    deviceName = deviceName,
                    status = device.Status,
                    lifecycleStatus = device.LifecycleStatus,
                    allocationRequested = device.AllocationRequested
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "An error occurred while cancelling the pickup.",
                    error = ex.Message
                });
            }
        }
    }
}