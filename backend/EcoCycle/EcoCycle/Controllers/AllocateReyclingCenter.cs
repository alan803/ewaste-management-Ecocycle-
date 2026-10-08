using EcoCycle.API.Data;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Mail;

namespace EcoCycle.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AllocateRecyclingCenterController : ControllerBase
    {
        private readonly ApplicationDbContext db;

        public AllocateRecyclingCenterController(ApplicationDbContext db)
        {
            this.db = db;
        }

        private async Task CheckAndUpdateExpiredRecyclingCenterRequests()
        {
            var now = DateTime.Now;
            var expiredRequests = await db.RecyclingCenterRequests
                .Where(x => (x.Status == "Assigned" || x.Status == "Waiting") &&
                            x.ResponseDeadline.HasValue &&
                            x.ResponseDeadline.Value < now)
                .ToListAsync();

            if (expiredRequests.Any())
            {
                foreach (var req in expiredRequests)
                {
                    req.Status = "Expired";
                    req.UpdatedAt = now;
                }
                await db.SaveChangesAsync();
            }
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
                Console.WriteLine(
                    $"[Email Notice] Failed to send email to {recipientEmail}: {ex.Message}"
                );
            }
        }

        private async Task SendCenterAllocationEmail(RecyclingCenter center, Device device, DateTime? responseDeadline)
        {
            try
            {
                var login = center.Login ?? await db.Login.FirstOrDefaultAsync(l => l.LoginId == center.LoginId);
                if (login == null || string.IsNullOrWhiteSpace(login.Email)) return;

                string deviceName = $"{device.Brand} {device.Model}".Trim();
                string deadlineStr = responseDeadline.HasValue ? responseDeadline.Value.ToString("f") : "24 Hours";

                string subject = $"[EcoCycle] New Recycling Device Allocation Request - Device #{device.DeviceId}";
                string body = $@"
                    <div style='font-family: Arial, sans-serif; padding: 20px; color: #333;'>
                        <h2 style='color: #059669;'>New Recycling Allocation Assigned</h2>
                        <p>Dear <strong>{center.CenterName}</strong>,</p>
                        <p>A new e-waste device has been allocated to your recycling center for material recovery & recycling.</p>
                        
                        <table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>
                            <tr style='background: #f3f4f6;'><td style='padding: 10px; border: 1px solid #ddd;'><strong>Device ID:</strong></td><td style='padding: 10px; border: 1px solid #ddd;'>#{device.DeviceId}</td></tr>
                            <tr><td style='padding: 10px; border: 1px solid #ddd;'><strong>Device Name:</strong></td><td style='padding: 10px; border: 1px solid #ddd;'>{deviceName}</td></tr>
                            <tr style='background: #f3f4f6;'><td style='padding: 10px; border: 1px solid #ddd;'><strong>Category:</strong></td><td style='padding: 10px; border: 1px solid #ddd;'>{device.Category?.CategoryName ?? "E-Waste"}</td></tr>
                            <tr><td style='padding: 10px; border: 1px solid #ddd;'><strong>Quantity:</strong></td><td style='padding: 10px; border: 1px solid #ddd;'>{device.Quantity}</td></tr>
                            <tr style='background: #f3f4f6;'><td style='padding: 10px; border: 1px solid #ddd;'><strong>Response Deadline:</strong></td><td style='padding: 10px; border: 1px solid #ddd;'>{deadlineStr}</td></tr>
                        </table>

                        <p style='margin-top: 20px;'>Please log into your EcoCycle Recycling Center portal to review and accept or reject this request before the deadline.</p>
                        <p>Thank you,<br/><strong>EcoCycle Administration Team</strong></p>
                    </div>";

                await SendEmailAsync(login.Email, subject, body);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Email Notice] Error sending recycling allocation email: {ex.Message}");
            }
        }

        private async Task SendCenterAllocationNotificationAndEmail(RecyclingCenter center, Device device, DateTime? responseDeadline)
        {
            try
            {
                if (center != null && center.LoginId > 0)
                {
                    string deviceName = $"{device.Brand} {device.Model}".Trim();
                    string deadlineStr = responseDeadline.HasValue ? responseDeadline.Value.ToString("f") : "24 Hours";

                    var notification = new Notification
                    {
                        LoginId = center.LoginId,
                        Title = "New Device Allocated for Recycling",
                        Message = $"Device '{deviceName}' (#{device.DeviceId}) has been allocated to your recycling center. Please respond before deadline: {deadlineStr}.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };

                    db.Notification.Add(notification);
                    await db.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification Notice] Error creating recycling allocation notification: {ex.Message}");
            }

            await SendCenterAllocationEmail(center, device, responseDeadline);
        }

        private async Task<RecyclingCenter?> FindRecyclingCenter(Device device, int? excludeCenterId = null)
        {
            if (device.User == null)
            {
                return null;
            }

            var centers = await db.RecyclingCenter.Include(c => c.Login).Where(c => c.Status == "Active").ToListAsync();

            if (excludeCenterId.HasValue)
            {
                centers = centers
                    .Where(c => c.RecyclingCenterId != excludeCenterId.Value)
                    .ToList();
            }

            if (!centers.Any())
            {
                return null;
            }

            var workload = await db.RecyclingCenterRequests
                .Where(r => r.RecyclingCenterId.HasValue && (
                    r.Status == "Assigned" ||
                    r.Status == "Accepted" ||
                    r.Status == "Processing" ||
                    r.Status == "Waiting"))
                .GroupBy(r => r.RecyclingCenterId!.Value)
                .Select(g => new
                {
                    RecyclingCenterId = g.Key,
                    Workload = g.Count()
                })
                .ToListAsync();

            var samedistrict = centers.Where(c => !string.IsNullOrWhiteSpace(c.District) &&
                !string.IsNullOrWhiteSpace(device.User.District) &&
                c.District.Trim().Equals(device.User.District.Trim(), StringComparison.OrdinalIgnoreCase)
            ).ToList();

            if (samedistrict.Any())
            {
                centers = samedistrict;
            }
            else
            {
                var sameState = centers.Where(c => !string.IsNullOrWhiteSpace(c.State) &&
                    !string.IsNullOrWhiteSpace(device.User.State) &&
                    c.State.Trim().Equals(device.User.State.Trim(), StringComparison.OrdinalIgnoreCase)
                ).ToList();

                if (sameState.Any())
                {
                    centers = sameState;
                }
            }

            var bestCenter = centers
                .OrderBy(c =>
                    workload
                        .FirstOrDefault(w =>
                            w.RecyclingCenterId == c.RecyclingCenterId)
                        ?.Workload ?? 0)
                .FirstOrDefault();

            return bestCenter;
        }

        private async Task<CollectionAgent?> FindBestCollectionAgentForRecycling(
    Technician technician,
    RecyclingCenter recyclingCenter)
        {
            var agents = await db.CollectionAgents
                .Where(a => a.Status == "Active" || a.Status == "Approved")
                .ToListAsync();

            if (!agents.Any())
            {
                return null;
            }

            // Get current workload of collection agents
            var activeAssignments = await db.CollectionAssignments
                .Where(a =>
                    a.CollectionAgentId.HasValue &&
                    (
                        a.Status == "Assigned" ||
                        a.Status == "Accepted" ||
                        a.Status == "PickupStarted"
                    ))
                .GroupBy(a => a.CollectionAgentId!.Value)
                .Select(g => new
                {
                    CollectionAgentId = g.Key,
                    Workload = g.Count()
                })
                .ToListAsync();

            var workloadDictionary = activeAssignments
                .ToDictionary(
                    x => x.CollectionAgentId,
                    x => x.Workload
                );

            var bestAgent = agents
                .Where(agent =>
                    !workloadDictionary.ContainsKey(agent.CollectionAgentId) ||
                    workloadDictionary[agent.CollectionAgentId] < 5)
                .Select(agent =>
                {
                    int workload =
                        workloadDictionary.TryGetValue(
                            agent.CollectionAgentId,
                            out int count)
                            ? count
                            : 0;

                    int score = 0;

                    // -----------------------------------------
                    // Technician location matching
                    // -----------------------------------------

                    if (!string.IsNullOrWhiteSpace(agent.District) &&
                        !string.IsNullOrWhiteSpace(technician.District) &&
                        agent.District.Trim().Equals(
                            technician.District.Trim(),
                            StringComparison.OrdinalIgnoreCase))
                    {
                        score += 40;
                    }

                    if (!string.IsNullOrWhiteSpace(agent.State) &&
                        !string.IsNullOrWhiteSpace(technician.State) &&
                        agent.State.Trim().Equals(
                            technician.State.Trim(),
                            StringComparison.OrdinalIgnoreCase))
                    {
                        score += 30;
                    }

                    // -----------------------------------------
                    // Recycling center location matching
                    // -----------------------------------------

                    if (!string.IsNullOrWhiteSpace(agent.District) &&
                        !string.IsNullOrWhiteSpace(recyclingCenter.District) &&
                        agent.District.Trim().Equals(
                            recyclingCenter.District.Trim(),
                            StringComparison.OrdinalIgnoreCase))
                    {
                        score += 40;
                    }

                    if (!string.IsNullOrWhiteSpace(agent.State) &&
                        !string.IsNullOrWhiteSpace(recyclingCenter.State) &&
                        agent.State.Trim().Equals(
                            recyclingCenter.State.Trim(),
                            StringComparison.OrdinalIgnoreCase))
                    {
                        score += 30;
                    }

                    // -----------------------------------------
                    // Workload penalty
                    // -----------------------------------------

                    score -= workload * 10;

                    return new
                    {
                        Agent = agent,
                        Score = score,
                        Workload = workload
                    };
                })
                .OrderByDescending(x => x.Score)
                .ThenBy(x => x.Workload)
                .FirstOrDefault();

            return bestAgent?.Agent;
        }

        [HttpPost("allocate/{deviceId}")]
        public async Task<IActionResult> AllocateRecyclingCenter(int deviceId)
        {
            await CheckAndUpdateExpiredRecyclingCenterRequests();

            var device = await db.Device
                .Include(d => d.User)
                .Include(d => d.Category)
                .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

            if (device == null)
            {
                return NotFound(new { message = "Device not found." });
            }

            if (device.User == null)
            {
                return BadRequest(new { message = "User information not found." });
            }

            var existingRequest = await db.RecyclingCenterRequests
                .Where(x => x.DeviceId == deviceId && x.Status != "Rejected" && x.Status != "Cancelled")
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            RecyclingCenter? center = null;
            RecyclingCenterRequest request;

            if (existingRequest != null)
            {
                bool isExpired = string.Equals(existingRequest.Status, "Expired", StringComparison.OrdinalIgnoreCase) ||
                                 (existingRequest.ResponseDeadline.HasValue && existingRequest.ResponseDeadline.Value < DateTime.Now);
                bool isWaiting = string.Equals(existingRequest.Status, "Waiting", StringComparison.OrdinalIgnoreCase);

                if (isExpired)
                {
                    existingRequest.Status = "Expired";
                    existingRequest.UpdatedAt = DateTime.Now;

                    center = await FindRecyclingCenter(device);
                    if (center == null)
                    {
                        var waitingReq = new RecyclingCenterRequest
                        {
                            DeviceId = device.DeviceId,
                            RecyclingCenterId = null,
                            Status = "Waiting",
                            ReassignmentCount = existingRequest.ReassignmentCount + 1,
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
                        };
                        db.RecyclingCenterRequests.Add(waitingReq);
                        await db.SaveChangesAsync();

                        return Ok(new
                        {
                            message = "Recycling center request is currently waiting, but no suitable recycling center is available.",
                            recyclingCenterRequestId = waitingReq.RecyclingCenterRequestId,
                            status = "Waiting"
                        });
                    }

                    request = new RecyclingCenterRequest
                    {
                        DeviceId = device.DeviceId,
                        RecyclingCenterId = center.RecyclingCenterId,
                        Status = "Assigned",
                        AssignedAt = DateTime.Now,
                        ResponseDeadline = DateTime.Now.AddHours(24),
                        ReassignmentCount = existingRequest.ReassignmentCount + 1,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };
                    db.RecyclingCenterRequests.Add(request);

                    await db.SaveChangesAsync();
                }
                else if (isWaiting)
                {
                    center = await FindRecyclingCenter(device);
                    if (center == null)
                    {
                        return Ok(new
                        {
                            message = "Recycling center request is currently waiting, but no suitable recycling center is available.",
                            recyclingCenterRequestId = existingRequest.RecyclingCenterRequestId,
                            status = "Waiting"
                        });
                    }

                    request = existingRequest;
                    request.RecyclingCenterId = center.RecyclingCenterId;
                    request.Status = "Assigned";
                    request.AssignedAt = DateTime.Now;
                    request.ResponseDeadline = DateTime.Now.AddHours(24);
                    request.UpdatedAt = DateTime.Now;

                    await db.SaveChangesAsync();
                }
                else
                {
                    return BadRequest(new
                    {
                        message = "An active recycling center request already exists for this device."
                    });
                }
            }
            else
            {
                center = await FindRecyclingCenter(device);

                request = new RecyclingCenterRequest
                {
                    DeviceId = device.DeviceId,
                    RecyclingCenterId = center?.RecyclingCenterId,
                    Status = center != null ? "Assigned" : "Waiting",
                    AssignedAt = center != null ? DateTime.Now : null,
                    ResponseDeadline = center != null ? DateTime.Now.AddHours(24) : null,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                db.RecyclingCenterRequests.Add(request);
                await db.SaveChangesAsync();
            }

            if (center != null && request.Status == "Assigned")
            {
                device.ProcessingLifecycleStatus = "CenterAllocationPending";
                await db.SaveChangesAsync();
                await SendCenterAllocationNotificationAndEmail(center, device, request.ResponseDeadline);
            }
            else if (request.Status == "Waiting")
            {
                device.ProcessingLifecycleStatus = "CenterAllocationWaiting";
                await db.SaveChangesAsync();
            }

            return Ok(new
            {
                message = center == null
                    ? "Recycling center request created but no suitable recycling center is currently available."
                    : "Recycling center allocated successfully",
                deviceId = device.DeviceId,
                recyclingCenterRequestId = request.RecyclingCenterRequestId,
                recyclingCenterId = center?.RecyclingCenterId,
                status = request.Status,
                assignedAt = request.AssignedAt,
                responseDeadline = request.ResponseDeadline
            });
        }

        [HttpPut("accept/{requestId}")]
        public async Task<IActionResult> AcceptRequest(int requestId)
        {
            await CheckAndUpdateExpiredRecyclingCenterRequests();

            // ---------------------------------------------------------
            // 1. Load recycling center request
            // ---------------------------------------------------------

            var request = await db.RecyclingCenterRequests
                .Include(r => r.Device)
                    .ThenInclude(d => d.User)
                .Include(r => r.Device)
                    .ThenInclude(d => d.Category)
                .Include(r => r.RecyclingCenter)
                .FirstOrDefaultAsync(r => r.RecyclingCenterRequestId == requestId);

            if (request == null)
            {
                return NotFound(new { message = "Request not found." });
            }

            // ---------------------------------------------------------
            // 2. Validate status
            // ---------------------------------------------------------

            if (request.Status != "Assigned" && request.Status != "Waiting")
            {
                return BadRequest(new { message = "This request cannot be accepted in its current status." });
            }

            // ---------------------------------------------------------
            // 3. Make sure recycling center exists
            // ---------------------------------------------------------

            if (request.RecyclingCenter == null)
            {
                return BadRequest(new { message = "No recycling center is associated with this request." });
            }

            // ---------------------------------------------------------
            // 4. Find the technician responsible for this device
            // ---------------------------------------------------------

            var inspectionRequest = await db.InspectionRequest
                .Include(i => i.Technician)
                    .ThenInclude(t => t.Login)
                .Include(i => i.Device)
                .Where(i => i.DeviceId == request.DeviceId && i.Status != "Rejected" && i.Status != "Cancelled")
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefaultAsync();

            if (inspectionRequest == null || inspectionRequest.Technician == null)
            {
                return BadRequest(new { message = "Technician information could not be found for this device." });
            }

            // ---------------------------------------------------------
            // 5. Accept recycling center request
            // ---------------------------------------------------------

            request.Status = "Accepted";
            request.RespondedAt = DateTime.Now;
            request.ProcessStartDate = DateTime.Now;
            request.ProcessDeadline = DateTime.Now.AddDays(10);
            request.UpdatedAt = DateTime.Now;

            // ---------------------------------------------------------
            // 6. Check if second collection assignment already exists
            // ---------------------------------------------------------

            var existingAssignment = await db.CollectionAssignments
                .FirstOrDefaultAsync(a =>
                    a.DeviceId == request.DeviceId &&
                    a.AssignmentType == "TechnicianToRecyclingCenter" &&
                    a.RecyclingCenterId == request.RecyclingCenterId &&
                    a.Status != "Rejected" &&
                    a.Status != "Cancelled");

            if (existingAssignment != null)
            {
                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Recycling center accepted the device. A collection assignment already exists.",
                    recyclingCenterRequestId = request.RecyclingCenterRequestId,
                    recyclingCenterStatus = request.Status,
                    collectionAssignmentId = existingAssignment.CollectionAssignmentId,
                    collectionAgentId = existingAssignment.CollectionAgentId,
                    collectionAssignmentStatus = existingAssignment.Status
                });
            }

            // ---------------------------------------------------------
            // 7. Find best collection agent
            // ---------------------------------------------------------

            var agent = await FindBestCollectionAgentForRecycling(
                inspectionRequest.Technician,
                request.RecyclingCenter
            );

            // ---------------------------------------------------------
            // 8. No agent available → Waiting
            // ---------------------------------------------------------

            if (agent == null)
            {
                var waitingAssignment = new CollectionAssignment
                {
                    DeviceId = request.DeviceId,
                    CollectionAgentId = null,
                    RecyclingCenterId = request.RecyclingCenterId,
                    AssignmentType = "TechnicianToRecyclingCenter",
                    SourceType = "Technician Center",
                    DestinationType = "Recycling Center",
                    Status = "Waiting",
                    AssignedAt = null,
                    ResponseDeadline = null,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                db.CollectionAssignments.Add(waitingAssignment);

                if (request.Device != null)
                {
                    request.Device.LifecycleStatus = "RecyclingCenterAccepted";
                    request.Device.ProcessingLifecycleStatus = "DispatchAgentWaiting";
                }

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Recycling center accepted the device, but no collection agent is currently available. The collection assignment is waiting.",
                    recyclingCenterRequestId = request.RecyclingCenterRequestId,
                    recyclingCenterStatus = request.Status,
                    collectionAssignmentId = waitingAssignment.CollectionAssignmentId,
                    collectionAgentStatus = "Waiting"
                });
            }

            // ---------------------------------------------------------
            // 9. Create collection assignment
            // ---------------------------------------------------------

            var assignment = new CollectionAssignment
            {
                DeviceId = request.DeviceId,
                CollectionAgentId = agent.CollectionAgentId,
                RecyclingCenterId = request.RecyclingCenterId,
                AssignmentType = "TechnicianToRecyclingCenter",
                SourceType = "Technician Center",
                DestinationType = "Recycling Center",
                Status = "Assigned",
                AssignedAt = DateTime.Now,
                ResponseDeadline = DateTime.Now.AddHours(24),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            db.CollectionAssignments.Add(assignment);

            // ---------------------------------------------------------
            // 10. Update device lifecycle
            // ---------------------------------------------------------

            if (request.Device != null)
            {
                request.Device.LifecycleStatus = "RecyclingCenterAccepted";
                request.Device.ProcessingLifecycleStatus = "DispatchAgentAssigned";
            }

            await db.SaveChangesAsync();

            // ---------------------------------------------------------
            // 11. Notify collection agent & Technician (In-App & Email)
            // ---------------------------------------------------------

            string agentName = $"{agent.FirstName} {agent.LastName}".Trim();
            if (string.IsNullOrWhiteSpace(agentName)) agentName = "EcoCycle Field Officer";

            var techObj = inspectionRequest.Technician;
            string techName = $"{techObj.FirstName} {techObj.LastName}".Trim();
            if (string.IsNullOrWhiteSpace(techName)) techName = "Inspection Technician";

            string deviceName = request.Device != null ? $"{request.Device.Brand} {request.Device.Model}".Trim() : "E-Waste Device";
            string centerName = request.RecyclingCenter?.CenterName ?? "Recycling Center";

            // A. In-App Notification to Collection Agent
            if (agent.LoginId > 0)
            {
                var notification = new Notification
                {
                    LoginId = agent.LoginId,
                    Title = "New Recycling Center Pickup Assignment",
                    Message = $"Device #{request.DeviceId} must be collected from Technician {techName} and delivered to {centerName}. Please respond before the deadline.",
                    Isread = false,
                    Status = true,
                    CreatedAt = DateTime.Now
                };
                db.Notification.Add(notification);
            }

            // B. In-App Notification to Technician
            if (techObj.LoginId > 0)
            {
                var techNotification = new Notification
                {
                    LoginId = techObj.LoginId,
                    Title = "Collection Agent Allocated for Recycling Dispatch",
                    Message = $"Collection agent {agentName} has been allocated to collect device {deviceName} from your center for dispatch to {centerName}.",
                    Isread = false,
                    Status = true,
                    CreatedAt = DateTime.Now
                };
                db.Notification.Add(techNotification);
            }

            await db.SaveChangesAsync();

            // C. Send Email to Technician
            var techLogin = techObj.Login;
            if (techLogin == null && techObj.LoginId > 0)
            {
                techLogin = await db.Login.FirstOrDefaultAsync(l => l.LoginId == techObj.LoginId);
            }
            string? techEmail = techLogin?.Email;
            if (!string.IsNullOrWhiteSpace(techEmail))
            {
                string techHtmlBody = $@"
                    <html>
                    <body style='font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;'>
                        <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; font-family: sans-serif;'>
                            <div style='text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px;'>
                                <h2 style='color: #10b981; margin: 0;'>EcoCycle E-Waste Management</h2>
                                <p style='color: #64748b; margin: 4px 0 0 0; font-size: 14px;'>Collection Agent Allocated • Pickup Prepared</p>
                            </div>
                            <div style='color: #0f172a;'>
                                <p>Hello <strong>{techName}</strong>,</p>
                                <p>Great news! The recycling center <strong>{centerName}</strong> has accepted the allocation request. Collection agent <strong>{agentName}</strong> has been allocated to collect the device from your inspection center.</p>
                                
                                <div style='background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0;'>
                                    <h4 style='margin: 0 0 10px 0; color: #1d4ed8;'>Allocation Summary</h4>
                                    <p style='margin: 4px 0;'><strong>Device:</strong> {deviceName}</p>
                                    <p style='margin: 4px 0;'><strong>Collection Agent:</strong> {agentName} ({agent.Phone})</p>
                                    <p style='margin: 4px 0;'><strong>Recycling Center:</strong> {centerName}</p>
                                </div>

                                <p>The collection agent will arrive at your center shortly. Please keep the device safely in its original packaging for handover.</p>
                                
                                <p style='color: #64748b; font-size: 13px; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px;'>
                                    Best regards,<br/>
                                    <strong>EcoCycle Logistics Team</strong>
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                ";

                _ = SendEmailAsync(techEmail, $"EcoCycle: Collection Agent Allocated for {deviceName}", techHtmlBody);
            }

            // D. Send Email to Collection Agent
            var agentLoginObj = agent.Login;
            if (agentLoginObj == null && agent.LoginId > 0)
            {
                agentLoginObj = await db.Login.FirstOrDefaultAsync(l => l.LoginId == agent.LoginId);
            }
            string? agentEmail = agentLoginObj?.Email;
            if (!string.IsNullOrWhiteSpace(agentEmail))
            {
                string agentHtmlBody = $@"
                    <html>
                    <body style='font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;'>
                        <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; font-family: sans-serif;'>
                            <div style='text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px;'>
                                <h2 style='color: #10b981; margin: 0;'>EcoCycle E-Waste Management</h2>
                                <p style='color: #64748b; margin: 4px 0 0 0; font-size: 14px;'>New Recycling Center Assignment</p>
                            </div>
                            <div style='color: #0f172a;'>
                                <p>Hello <strong>{agentName}</strong>,</p>
                                <p>You have been assigned a new pickup from a Technician Center for delivery to a Recycling Center.</p>
                                
                                <div style='background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0;'>
                                    <h4 style='margin: 0 0 10px 0; color: #1d4ed8;'>Assignment Details</h4>
                                    <p style='margin: 4px 0;'><strong>Device:</strong> {deviceName}</p>
                                    <p style='margin: 4px 0;'><strong>Pickup From:</strong> {techName} ({techObj.InspectionCenterName ?? "Technician Center"})</p>
                                    <p style='margin: 4px 0;'><strong>Deliver To:</strong> {centerName}</p>
                                </div>

                                <p>Please log in to your EcoCycle Collection Agent app to respond to and start this pickup before the deadline.</p>
                                
                                <p style='color: #64748b; font-size: 13px; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px;'>
                                    Best regards,<br/>
                                    <strong>EcoCycle Dispatch Operations</strong>
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                ";

                _ = SendEmailAsync(agentEmail, $"EcoCycle: New Recycling Center Assignment #{assignment.CollectionAssignmentId}", agentHtmlBody);
            }

            return Ok(new
            {
                message = "Recycling center accepted the device and a collection agent was automatically allocated.",
                recyclingCenterRequestId = request.RecyclingCenterRequestId,
                recyclingCenterId = request.RecyclingCenterId,
                recyclingCenterName = request.RecyclingCenter.CenterName,
                collectionAssignmentId = assignment.CollectionAssignmentId,
                collectionAgentId = agent.CollectionAgentId,
                collectionAgentName = agentName,
                collectionAgentPhone = agent.Phone,
                assignmentType = assignment.AssignmentType,
                status = assignment.Status,
                assignedAt = assignment.AssignedAt,
                responseDeadline = assignment.ResponseDeadline
            });
        }

        [HttpPut("reject/{requestId}")]
        public async Task<IActionResult> RejectRequest(int requestId, string reason)
        {
            await CheckAndUpdateExpiredRecyclingCenterRequests();

            var request = await db.RecyclingCenterRequests
                .Include(r => r.Device)
                    .ThenInclude(d => d.User)
                .Include(r => r.Device)
                    .ThenInclude(d => d.Category)
                .FirstOrDefaultAsync(r =>
                    r.RecyclingCenterRequestId == requestId);

            if (request == null)
                return NotFound(new { message = "Request not found." });

            if (request.Status != "Assigned" && request.Status != "Waiting")
                return BadRequest(new { message = "This request is already processed." });

            request.Status = "Rejected";
            request.RejectionReason = reason;
            request.RespondedAt = DateTime.Now;
            request.UpdatedAt = DateTime.Now;

            request.ReassignmentCount++;

            var newCenter = await FindRecyclingCenter(
                request.Device,
                request.RecyclingCenterId);

            if (newCenter == null)
            {
                var waitingReq = new RecyclingCenterRequest
                {
                    DeviceId = request.DeviceId,
                    RecyclingCenterId = null,
                    Status = "Waiting",
                    ReassignmentCount = request.ReassignmentCount,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };
                db.RecyclingCenterRequests.Add(waitingReq);

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Request rejected. No other recycling center available at this time.",
                    status = "Waiting",
                    recyclingCenterRequestId = waitingReq.RecyclingCenterRequestId
                });
            }

            var newRequest = new RecyclingCenterRequest
            {
                DeviceId = request.DeviceId,
                RecyclingCenterId = newCenter.RecyclingCenterId,
                Status = "Assigned",
                AssignedAt = DateTime.Now,
                ResponseDeadline = DateTime.Now.AddHours(24),
                ReassignmentCount = request.ReassignmentCount,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            db.RecyclingCenterRequests.Add(newRequest);

            await db.SaveChangesAsync();

            if (newCenter != null && request.Device != null)
            {
                await SendCenterAllocationNotificationAndEmail(newCenter, request.Device, newRequest.ResponseDeadline);
            }

            return Ok(new
            {
                message = "Request rejected and device allocated to another recycling center",
                newRecyclingCenterId = newCenter.RecyclingCenterId,
                status = newRequest.Status,
                recyclingCenterRequestId = newRequest.RecyclingCenterRequestId
            });
        }

        // ─────────────────────────────────────────────────────────────────────
        // GET  api/AllocateRecyclingCenter/my-assignments
        // Returns all TechnicianToRecyclingCenter CollectionAssignments for the
        // logged-in recycling center — i.e. devices that are on their way.
        // ─────────────────────────────────────────────────────────────────────
        [Microsoft.AspNetCore.Authorization.Authorize]
        [HttpGet("my-assignments")]
        public async Task<IActionResult> GetMyRecyclingAssignments()
        {
            try
            {
                var loginIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)
                                ?? User.FindFirst("sub");

                if (loginIdClaim == null || !int.TryParse(loginIdClaim.Value, out int loginId))
                    return Unauthorized(new { message = "User identity not found." });

                var center = await db.RecyclingCenter
                    .FirstOrDefaultAsync(c => c.LoginId == loginId || c.RecyclingCenterId == loginId);

                if (center == null)
                    return Ok(new List<object>());

                var assignments = await db.CollectionAssignments
                    .Where(ca =>
                        ca.AssignmentType == "TechnicianToRecyclingCenter" &&
                        ca.RecyclingCenterId == center.RecyclingCenterId)
                    .Include(ca => ca.Device)
                        .ThenInclude(d => d.User)
                    .Include(ca => ca.Device)
                        .ThenInclude(d => d.Category)
                    .Include(ca => ca.RecyclingCenter)
                    .OrderByDescending(ca => ca.CreatedAt)
                    .Select(ca => new
                    {
                        collectionAssignmentId = ca.CollectionAssignmentId,
                        assignmentType         = ca.AssignmentType,
                        deviceId               = ca.DeviceId,
                        recyclingCenterId      = ca.RecyclingCenterId,
                        status                 = ca.Status,
                        assignedAt             = ca.AssignedAt,
                        respondedAt            = ca.RespondedAt,
                        acceptedAt             = ca.AcceptedAt,
                        completionDeadline     = ca.CompletionDeadline ?? (ca.AcceptedAt.HasValue ? ca.AcceptedAt.Value.AddDays(5) : (ca.Status == "Accepted" || ca.Status == "PickupStarted" || ca.Status == "PickedUp" || ca.Status == "En Route" || ca.Status == "en route" || ca.Status == "pickupstarted" ? (ca.UpdatedAt ?? ca.CreatedAt).AddDays(5) : null)),
                        createdAt              = ca.CreatedAt,
                        updatedAt              = ca.UpdatedAt,
                        // Device details
                        brand          = ca.Device != null ? ca.Device.Brand : null,
                        model          = ca.Device != null ? ca.Device.Model : null,
                        categoryName   = ca.Device != null && ca.Device.Category != null
                                            ? ca.Device.Category.CategoryName : null,
                        quantity       = ca.Device != null ? ca.Device.Quantity : 1,
                        weight         = ca.Device != null ? ca.Device.Weight : 0,
                        condition      = ca.Device != null ? ca.Device.Condition : null,
                        lifecycleStatus = ca.Device != null ? ca.Device.LifecycleStatus : null,
                        // Customer details
                        customerName  = ca.Device != null && ca.Device.User != null
                                            ? (ca.Device.User.FirstName + " " + ca.Device.User.LastName).Trim()
                                            : null,
                        customerCity  = ca.Device != null && ca.Device.User != null
                                            ? ca.Device.User.City : null,
                        customerPhone = ca.Device != null && ca.Device.User != null
                                            ? ca.Device.User.PhoneNumber : null
                    })
                    .ToListAsync();

                return Ok(assignments);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("manual-allocate/{deviceId}")]
        public async Task<IActionResult> ManualAllocateAuto(int deviceId)
        {
            await CheckAndUpdateExpiredRecyclingCenterRequests();

            var device = await db.Device
                .Include(d => d.Category)
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

            if (device == null)
            {
                return NotFound(new { message = "Device not found." });
            }

            var center = await FindRecyclingCenter(device);
            if (center == null)
            {
                center = await db.RecyclingCenter
                    .Where(c => c.Status == "Active")
                    .OrderBy(c => db.RecyclingCenterRequests.Count(r => r.RecyclingCenterId == c.RecyclingCenterId && (r.Status == "Assigned" || r.Status == "Accepted" || r.Status == "Processing")))
                    .FirstOrDefaultAsync();

                if (center == null)
                {
                    return BadRequest(new { message = "No active recycling center available for manual allocation." });
                }
            }

            return await AssignCenterToDevice(device, center);
        }

        [HttpPost("manual-allocate/{deviceId}/{recyclingCenterId}")]
        public async Task<IActionResult> ManualAllocateSpecific(int deviceId, int recyclingCenterId)
        {
            await CheckAndUpdateExpiredRecyclingCenterRequests();

            var device = await db.Device
                .Include(d => d.Category)
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

            if (device == null)
            {
                return NotFound(new { message = "Device not found." });
            }

            var center = await db.RecyclingCenter
                .FirstOrDefaultAsync(c => c.RecyclingCenterId == recyclingCenterId);

            if (center == null)
            {
                return NotFound(new { message = "Recycling center not found." });
            }

            return await AssignCenterToDevice(device, center);
        }

        private async Task<IActionResult> AssignCenterToDevice(Device device, RecyclingCenter center)
        {
            var existingRequest = await db.RecyclingCenterRequests
                .Where(x => x.DeviceId == device.DeviceId && x.Status != "Rejected" && x.Status != "Cancelled")
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            RecyclingCenterRequest request;
            if (existingRequest != null)
            {
                bool isExpired = string.Equals(existingRequest.Status, "Expired", StringComparison.OrdinalIgnoreCase) ||
                                 (existingRequest.ResponseDeadline.HasValue && existingRequest.ResponseDeadline.Value < DateTime.Now);

                if (isExpired)
                {
                    existingRequest.Status = "Expired";
                    existingRequest.UpdatedAt = DateTime.Now;

                    request = new RecyclingCenterRequest
                    {
                        DeviceId = device.DeviceId,
                        RecyclingCenterId = center.RecyclingCenterId,
                        Status = "Assigned",
                        AssignedAt = DateTime.Now,
                        ResponseDeadline = DateTime.Now.AddHours(24),
                        ReassignmentCount = existingRequest.ReassignmentCount + 1,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };
                    db.RecyclingCenterRequests.Add(request);
                }
                else
                {
                    request = existingRequest;
                    request.RecyclingCenterId = center.RecyclingCenterId;
                    request.Status = "Assigned";
                    request.AssignedAt = DateTime.Now;
                    request.ResponseDeadline = DateTime.Now.AddHours(24);
                    request.UpdatedAt = DateTime.Now;
                }
            }
            else
            {
                request = new RecyclingCenterRequest
                {
                    DeviceId = device.DeviceId,
                    RecyclingCenterId = center.RecyclingCenterId,
                    Status = "Assigned",
                    AssignedAt = DateTime.Now,
                    ResponseDeadline = DateTime.Now.AddHours(24),
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };
                db.RecyclingCenterRequests.Add(request);
            }

            await db.SaveChangesAsync();

            if (center != null && request.Status == "Assigned")
            {
                await SendCenterAllocationNotificationAndEmail(center, device, request.ResponseDeadline);
            }

            return Ok(new
            {
                message = $"Successfully assigned recycling center {center.CenterName}.",
                recyclingCenterRequestId = request.RecyclingCenterRequestId,
                recyclingCenterId = center.RecyclingCenterId,
                status = request.Status
            });
        }



        [HttpGet("admin/requests")]
        public async Task<IActionResult> GetAllRecyclingCenterRequests()
        {
            await CheckAndUpdateExpiredRecyclingCenterRequests();

            var requests = await db.RecyclingCenterRequests
                .Include(r => r.Device)
                    .ThenInclude(d => d.User)
                .Include(r => r.Device)
                    .ThenInclude(d => d.Category)
                .Include(r => r.RecyclingCenter)
                    .ThenInclude(c => c.Login)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    recyclingCenterRequestId = r.RecyclingCenterRequestId,
                    deviceId = r.DeviceId,
                    recyclingCenterId = r.RecyclingCenterId,
                    recyclingCenterName = r.RecyclingCenter != null ? r.RecyclingCenter.CenterName : null,
                    recyclingCenterCity = r.RecyclingCenter != null ? r.RecyclingCenter.City : null,
                    recyclingCenterState = r.RecyclingCenter != null ? r.RecyclingCenter.State : null,
                    recyclingCenterPhone = r.RecyclingCenter != null ? r.RecyclingCenter.PhoneNumber : null,
                    recyclingCenterEmail = r.RecyclingCenter != null && r.RecyclingCenter.Login != null ? r.RecyclingCenter.Login.Email : null,
                    status = r.Status,
                    assignedAt = r.AssignedAt,
                    responseDeadline = r.ResponseDeadline,
                    respondedAt = r.RespondedAt,
                    processStartDate = r.ProcessStartDate,
                    processDeadline = r.ProcessDeadline,
                    rejectionReason = r.RejectionReason,
                    reassignmentCount = r.ReassignmentCount,
                    createdAt = r.CreatedAt,
                    updatedAt = r.UpdatedAt,

                    // Device details
                    brand = r.Device != null ? r.Device.Brand : null,
                    model = r.Device != null ? r.Device.Model : null,
                    categoryName = r.Device != null && r.Device.Category != null ? r.Device.Category.CategoryName : null,
                    quantity = r.Device != null ? r.Device.Quantity : 1,
                    weight = r.Device != null ? r.Device.Weight : 0,
                    condition = r.Device != null ? r.Device.Condition : null,
                    customerName = r.Device != null && r.Device.User != null ? (r.Device.User.FirstName + " " + r.Device.User.LastName).Trim() : null,
                    customerCity = r.Device != null && r.Device.User != null ? r.Device.User.City : null,
                    customerPhone = r.Device != null && r.Device.User != null ? r.Device.User.PhoneNumber : null,
                    processingDecision = r.Device != null ? r.Device.ProcessingDecision : null,
                    lifecycleStatus = r.Device != null ? r.Device.LifecycleStatus : null
                })
                .ToListAsync();

            return Ok(requests);
        }

        [Microsoft.AspNetCore.Authorization.Authorize]
        [HttpGet("my-requests")]
        public async Task<IActionResult> GetMyRecyclingCenterRequests()
        {
            await CheckAndUpdateExpiredRecyclingCenterRequests();

            try
            {
                var loginIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (loginIdClaim == null || !int.TryParse(loginIdClaim.Value, out int loginId))
                {
                    return Unauthorized(new { message = "User identity not found." });
                }

                var center = await db.RecyclingCenter.FirstOrDefaultAsync(c => c.LoginId == loginId || c.RecyclingCenterId == loginId);
                if (center == null)
                {
                    center = await db.RecyclingCenter.FirstOrDefaultAsync();
                }

                if (center == null)
                {
                    return Ok(new List<object>());
                }

                var requests = await db.RecyclingCenterRequests
                    .Include(r => r.Device)
                        .ThenInclude(d => d.User)
                    .Include(r => r.Device)
                        .ThenInclude(d => d.Category)
                    .Where(r => r.RecyclingCenterId == center.RecyclingCenterId && r.Status != "Rejected" && r.Status != "Expired" && r.Status != "Cancelled")
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new
                    {
                        recyclingCenterRequestId = r.RecyclingCenterRequestId,
                        deviceId = r.DeviceId,
                        recyclingCenterId = r.RecyclingCenterId,
                        status = r.Status,
                        assignedAt = r.AssignedAt,
                        responseDeadline = r.ResponseDeadline,
                        respondedAt = r.RespondedAt,
                        processStartDate = r.ProcessStartDate,
                        processDeadline = r.ProcessDeadline,
                        rejectionReason = r.RejectionReason,
                        reassignmentCount = r.ReassignmentCount,
                        createdAt = r.CreatedAt,
                        updatedAt = r.UpdatedAt,
                        brand = r.Device != null ? r.Device.Brand : null,
                        model = r.Device != null ? r.Device.Model : null,
                        categoryName = r.Device != null && r.Device.Category != null ? r.Device.Category.CategoryName : null,
                        quantity = r.Device != null ? r.Device.Quantity : 1,
                        weight = r.Device != null ? r.Device.Weight : 0,
                        condition = r.Device != null ? r.Device.Condition : null,
                        working = r.Device != null ? r.Device.Working : null,
                        physicalDamage = r.Device != null ? r.Device.PhysicalDamage : null,
                        displayCondition = r.Device != null ? r.Device.DisplayCondition : null,
                        batteryCondition = r.Device != null ? r.Device.BatteryCondition : null,
                        customerName = r.Device != null && r.Device.User != null ? (r.Device.User.FirstName + " " + r.Device.User.LastName).Trim() : null,
                        customerCity = r.Device != null && r.Device.User != null ? r.Device.User.City : null,
                        customerPhone = r.Device != null && r.Device.User != null ? r.Device.User.PhoneNumber : null,
                        processingDecision = r.Device != null ? r.Device.ProcessingDecision : null,
                        lifecycleStatus = r.Device != null ? r.Device.LifecycleStatus : null,
                        processingLifecycleStatus = r.Device != null ? r.Device.ProcessingLifecycleStatus : null
                    })
                    .ToListAsync();

                return Ok(requests);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        
    }
}