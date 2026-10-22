using EcoCycle.API.Data;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Mail;

namespace EcoCycle.Controllers
{
    [Route("api/[controller]")]
    [Route("api/Refurbishmentallocate")]
    [ApiController]
    public class AllocateRefurbishmentCenterController : ControllerBase
    {
        private readonly ApplicationDbContext db;

        public AllocateRefurbishmentCenterController(ApplicationDbContext db)
        {
            this.db = db;
        }

        private async Task CheckAndUpdateExpiredRefurbishmentRequests()
        {
            var now = DateTime.Now;
            var expiredRequests = await db.RefurbishmentRequests
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

                    using (SmtpClient smtp = new SmtpClient("smtp.gmail.com", 587))
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

        private async Task SendCenterAllocationEmail(RefurbishmentCenter center, Device device, DateTime? responseDeadline)
        {
            try
            {
                var login = center.Login ?? await db.Login.FirstOrDefaultAsync(l => l.LoginId == center.LoginId);
                if (login == null || string.IsNullOrWhiteSpace(login.Email)) return;

                string deviceName = $"{device.Brand} {device.Model}".Trim();
                string deadlineStr = responseDeadline.HasValue ? responseDeadline.Value.ToString("f") : "24 Hours";

                string subject = $"[EcoCycle] New Refurbishment Device Allocation Request - Device #{device.DeviceId}";
                string body = $@"
                    <div style='font-family: Arial, sans-serif; padding: 20px; color: #333;'>
                        <h2 style='color: #7c3aed;'>New Refurbishment Allocation Assigned</h2>
                        <p>Dear <strong>{center.CenterName}</strong>,</p>
                        <p>A new inspected e-waste device has been allocated to your refurbishment center for diagnostics, repair, and refurbishment.</p>
                        
                        <table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>
                            <tr style='background: #f3f4f6;'><td style='padding: 10px; border: 1px solid #ddd;'><strong>Device ID:</strong></td><td style='padding: 10px; border: 1px solid #ddd;'>#{device.DeviceId}</td></tr>
                            <tr><td style='padding: 10px; border: 1px solid #ddd;'><strong>Device Name:</strong></td><td style='padding: 10px; border: 1px solid #ddd;'>{deviceName}</td></tr>
                            <tr style='background: #f3f4f6;'><td style='padding: 10px; border: 1px solid #ddd;'><strong>Category:</strong></td><td style='padding: 10px; border: 1px solid #ddd;'>{device.Category?.CategoryName ?? "Electronics"}</td></tr>
                            <tr><td style='padding: 10px; border: 1px solid #ddd;'><strong>Quantity:</strong></td><td style='padding: 10px; border: 1px solid #ddd;'>{device.Quantity}</td></tr>
                            <tr style='background: #f3f4f6;'><td style='padding: 10px; border: 1px solid #ddd;'><strong>Response Deadline:</strong></td><td style='padding: 10px; border: 1px solid #ddd;'>{deadlineStr}</td></tr>
                        </table>

                        <p style='margin-top: 20px;'>Please log into your EcoCycle Refurbishment Center portal to review and accept or reject this request before the deadline.</p>
                        <p>Thank you,<br/><strong>EcoCycle Administration Team</strong></p>
                    </div>";

                await SendEmailAsync(login.Email, subject, body);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Email Notice] Error sending refurbishment allocation email: {ex.Message}");
            }
        }

        private async Task SendCenterAllocationNotificationAndEmail(RefurbishmentCenter center, Device device, DateTime? responseDeadline)
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
                        Title = "New Device Allocated for Refurbishment",
                        Message = $"Device '{deviceName}' (#{device.DeviceId}) has been allocated to your refurbishment center. Please respond before deadline: {deadlineStr}.",
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
                Console.WriteLine($"[Notification Notice] Error creating refurbishment allocation notification: {ex.Message}");
            }

            await SendCenterAllocationEmail(center, device, responseDeadline);
        }

        private async Task<RefurbishmentCenter?> FindRefurbishmentCenter(Device device, int? excludeCenterId = null)
        {
            if (device.User == null)
            {
                return null;
            }

            var centers = await db.RefurbishmentCenter.Include(c => c.Login).Where(c => c.Status == "Active" || c.Status == "Approved").ToListAsync();

            if (excludeCenterId.HasValue)
            {
                centers = centers
                    .Where(c => c.RefurbishmentCenterId != excludeCenterId.Value)
                    .ToList();
            }

            if (!centers.Any())
            {
                return null;
            }

            var workload = await db.RefurbishmentRequests
                .Where(r => r.Status == "Assigned" ||
                            r.Status == "Accepted" ||
                            r.Status == "InProgress" ||
                            r.Status == "Waiting")
                .GroupBy(r => r.RefurbishmentCenterId)
                .Select(g => new
                {
                    RefurbishmentCenterId = g.Key,
                    Workload = g.Count()
                })
                .ToListAsync();

            var sameDistrict = centers.Where(c => !string.IsNullOrWhiteSpace(c.District) &&
                !string.IsNullOrWhiteSpace(device.User.District) &&
                c.District.Trim().Equals(device.User.District.Trim(), StringComparison.OrdinalIgnoreCase)
            ).ToList();

            if (sameDistrict.Any())
            {
                centers = sameDistrict;
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
                    workload.FirstOrDefault(w => w.RefurbishmentCenterId == c.RefurbishmentCenterId)?.Workload ?? 0)
                .FirstOrDefault();

            return bestCenter;
        }

        private async Task<CollectionAgent?> FindBestCollectionAgentForRefurbishment(
            Technician technician,
            RefurbishmentCenter refurbishmentCenter)
        {
            var agents = await db.CollectionAgents
                .Where(a => a.Status == "Active" || a.Status == "Approved")
                .ToListAsync();

            if (!agents.Any())
            {
                return null;
            }

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
                    int workload = workloadDictionary.TryGetValue(agent.CollectionAgentId, out int count) ? count : 0;
                    int score = 0;

                    if (!string.IsNullOrWhiteSpace(agent.District) &&
                        !string.IsNullOrWhiteSpace(technician.District) &&
                        agent.District.Trim().Equals(technician.District.Trim(), StringComparison.OrdinalIgnoreCase))
                    {
                        score += 40;
                    }

                    if (!string.IsNullOrWhiteSpace(agent.State) &&
                        !string.IsNullOrWhiteSpace(technician.State) &&
                        agent.State.Trim().Equals(technician.State.Trim(), StringComparison.OrdinalIgnoreCase))
                    {
                        score += 30;
                    }

                    if (!string.IsNullOrWhiteSpace(agent.District) &&
                        !string.IsNullOrWhiteSpace(refurbishmentCenter.District) &&
                        agent.District.Trim().Equals(refurbishmentCenter.District.Trim(), StringComparison.OrdinalIgnoreCase))
                    {
                        score += 40;
                    }

                    if (!string.IsNullOrWhiteSpace(agent.State) &&
                        !string.IsNullOrWhiteSpace(refurbishmentCenter.State) &&
                        agent.State.Trim().Equals(refurbishmentCenter.State.Trim(), StringComparison.OrdinalIgnoreCase))
                    {
                        score += 30;
                    }

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
        public async Task<IActionResult> AllocateRefurbishmentCenter(int deviceId)
        {
            await CheckAndUpdateExpiredRefurbishmentRequests();

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

            var existingRequest = await db.RefurbishmentRequests
                .Where(x => x.DeviceId == deviceId && x.Status != "Rejected" && x.Status != "Cancelled")
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            RefurbishmentCenter? center = null;
            RefurbishmentRequest request;

            if (existingRequest != null)
            {
                bool isExpired = string.Equals(existingRequest.Status, "Expired", StringComparison.OrdinalIgnoreCase) ||
                                 (existingRequest.ResponseDeadline.HasValue && existingRequest.ResponseDeadline.Value < DateTime.Now);
                bool isWaiting = string.Equals(existingRequest.Status, "Waiting", StringComparison.OrdinalIgnoreCase);

                if (isExpired)
                {
                    existingRequest.Status = "Expired";
                    existingRequest.UpdatedAt = DateTime.Now;

                    center = await FindRefurbishmentCenter(device);
                    if (center == null)
                    {
                        var waitingReq = new RefurbishmentRequest
                        {
                            DeviceId = device.DeviceId,
                            RefurbishmentCenterId = 0,
                            Status = "Waiting",
                            ReassignmentCount = existingRequest.ReassignmentCount + 1,
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
                        };
                        db.RefurbishmentRequests.Add(waitingReq);
                        await db.SaveChangesAsync();

                        return Ok(new
                        {
                            message = "Refurbishment center request is currently waiting, but no suitable refurbishment center is available.",
                            refurbishmentRequestId = waitingReq.RefurbishmentRequestId,
                            status = "Waiting"
                        });
                    }

                    request = new RefurbishmentRequest
                    {
                        DeviceId = device.DeviceId,
                        RefurbishmentCenterId = center.RefurbishmentCenterId,
                        Status = "Assigned",
                        AssignedAt = DateTime.Now,
                        ResponseDeadline = DateTime.Now.AddHours(24),
                        ReassignmentCount = existingRequest.ReassignmentCount + 1,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };
                    db.RefurbishmentRequests.Add(request);

                    await db.SaveChangesAsync();
                }
                else if (isWaiting)
                {
                    center = await FindRefurbishmentCenter(device);
                    if (center == null)
                    {
                        return Ok(new
                        {
                            message = "Refurbishment center request is currently waiting, but no suitable refurbishment center is available.",
                            refurbishmentRequestId = existingRequest.RefurbishmentRequestId,
                            status = "Waiting"
                        });
                    }

                    request = existingRequest;
                    request.RefurbishmentCenterId = center.RefurbishmentCenterId;
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
                        message = "An active refurbishment center request already exists for this device."
                    });
                }
            }
            else
            {
                center = await FindRefurbishmentCenter(device);

                if (center != null)
                {
                    request = new RefurbishmentRequest
                    {
                        DeviceId = device.DeviceId,
                        RefurbishmentCenterId = center.RefurbishmentCenterId,
                        Status = "Assigned",
                        AssignedAt = DateTime.Now,
                        ResponseDeadline = DateTime.Now.AddHours(24),
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };
                }
                else
                {
                    var fallbackCenter = await db.RefurbishmentCenter.FirstOrDefaultAsync();
                    request = new RefurbishmentRequest
                    {
                        DeviceId = device.DeviceId,
                        RefurbishmentCenterId = fallbackCenter?.RefurbishmentCenterId ?? 0,
                        Status = "Waiting",
                        AssignedAt = null,
                        ResponseDeadline = null,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };
                }

                db.RefurbishmentRequests.Add(request);
                await db.SaveChangesAsync();
            }

            if (center != null && request.Status == "Assigned")
            {
                device.ProcessingLifecycleStatus = "CenterAllocationPending";
                device.LifecycleStatus = "RefurbishmentCenterAssigned";
                await db.SaveChangesAsync();
                await SendCenterAllocationNotificationAndEmail(center, device, request.ResponseDeadline);
            }
            else if (request.Status == "Waiting")
            {
                device.ProcessingLifecycleStatus = "CenterAllocationWaiting";
                device.LifecycleStatus = "RefurbishmentCenterPending";
                await db.SaveChangesAsync();
            }

            return Ok(new
            {
                message = center == null
                    ? "Refurbishment center request created but no suitable refurbishment center is currently available."
                    : "Refurbishment center allocated successfully",
                deviceId = device.DeviceId,
                refurbishmentRequestId = request.RefurbishmentRequestId,
                refurbishmentCenterId = center?.RefurbishmentCenterId,
                status = request.Status,
                assignedAt = request.AssignedAt,
                responseDeadline = request.ResponseDeadline
            });
        }

        [HttpPost("manual-allocate/{deviceId}")]
        [HttpPost("manual-allocate/{deviceId}/{refurbishmentCenterId}")]
        public async Task<IActionResult> ManualAllocate(int deviceId, int? refurbishmentCenterId = null)
        {
            await CheckAndUpdateExpiredRefurbishmentRequests();

            var device = await db.Device
                .Include(d => d.Category)
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

            if (device == null)
            {
                return NotFound(new { message = "Device not found." });
            }

            RefurbishmentCenter? center = null;
            if (refurbishmentCenterId.HasValue && refurbishmentCenterId.Value > 0)
            {
                center = await db.RefurbishmentCenter
                    .FirstOrDefaultAsync(c => c.RefurbishmentCenterId == refurbishmentCenterId.Value);

                if (center == null)
                {
                    return NotFound(new { message = "Specified refurbishment center not found." });
                }
            }
            else
            {
                center = await FindRefurbishmentCenter(device);
                if (center == null)
                {
                    center = await db.RefurbishmentCenter.FirstOrDefaultAsync(c => c.Status == "Active" || c.Status == "Approved");
                }
            }

            if (center == null)
            {
                return BadRequest(new { message = "No active refurbishment center found in system." });
            }

            return await AssignCenterToDevice(device, center);
        }

        [HttpPost("reallocate/{deviceId}")]
        public async Task<IActionResult> ReallocateRefurbishmentCenter(int deviceId)
        {
            await CheckAndUpdateExpiredRefurbishmentRequests();

            var device = await db.Device
                .Include(d => d.Category)
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

            if (device == null)
            {
                return NotFound(new { message = "Device not found." });
            }

            var previousRequests = await db.RefurbishmentRequests
                .Where(r => r.DeviceId == deviceId)
                .ToListAsync();

            var previousCenterIds = previousRequests
                .Where(r => r.RefurbishmentCenterId > 0)
                .Select(r => r.RefurbishmentCenterId)
                .Distinct()
                .ToList();

            var candidateCenters = await db.RefurbishmentCenter
                .Where(c => (c.Status == "Active" || c.Status == "Approved") && !previousCenterIds.Contains(c.RefurbishmentCenterId))
                .ToListAsync();

            RefurbishmentCenter? bestCenter = null;
            if (candidateCenters.Any())
            {
                bestCenter = candidateCenters.FirstOrDefault();
            }
            else
            {
                bestCenter = await FindRefurbishmentCenter(device);
            }

            if (bestCenter == null)
            {
                var waitingRequest = new RefurbishmentRequest
                {
                    DeviceId = device.DeviceId,
                    RefurbishmentCenterId = 0,
                    Status = "Waiting",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };
                db.RefurbishmentRequests.Add(waitingRequest);
                device.LifecycleStatus = "RefurbishmentCenterPending";
                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "No other refurbishment center available. Set to waiting status.",
                    status = "Waiting"
                });
            }

            return await AssignCenterToDevice(device, bestCenter);
        }

        private async Task<IActionResult> AssignCenterToDevice(Device device, RefurbishmentCenter center)
        {
            var existingRequest = await db.RefurbishmentRequests
                .Where(x => x.DeviceId == device.DeviceId && x.Status != "Rejected" && x.Status != "Cancelled")
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            RefurbishmentRequest request;
            if (existingRequest != null)
            {
                bool isExpired = string.Equals(existingRequest.Status, "Expired", StringComparison.OrdinalIgnoreCase) ||
                                 (existingRequest.ResponseDeadline.HasValue && existingRequest.ResponseDeadline.Value < DateTime.Now);

                if (isExpired)
                {
                    existingRequest.Status = "Expired";
                    existingRequest.UpdatedAt = DateTime.Now;

                    request = new RefurbishmentRequest
                    {
                        DeviceId = device.DeviceId,
                        RefurbishmentCenterId = center.RefurbishmentCenterId,
                        Status = "Assigned",
                        AssignedAt = DateTime.Now,
                        ResponseDeadline = DateTime.Now.AddHours(24),
                        ReassignmentCount = existingRequest.ReassignmentCount + 1,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };
                    db.RefurbishmentRequests.Add(request);
                }
                else
                {
                    request = existingRequest;
                    request.RefurbishmentCenterId = center.RefurbishmentCenterId;
                    request.Status = "Assigned";
                    request.AssignedAt = DateTime.Now;
                    request.ResponseDeadline = DateTime.Now.AddHours(24);
                    request.UpdatedAt = DateTime.Now;
                }
            }
            else
            {
                request = new RefurbishmentRequest
                {
                    DeviceId = device.DeviceId,
                    RefurbishmentCenterId = center.RefurbishmentCenterId,
                    Status = "Assigned",
                    AssignedAt = DateTime.Now,
                    ResponseDeadline = DateTime.Now.AddHours(24),
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };
                db.RefurbishmentRequests.Add(request);
            }

            device.LifecycleStatus = "RefurbishmentCenterAssigned";
            device.ProcessingLifecycleStatus = "CenterAllocationPending";
            await db.SaveChangesAsync();

            if (center != null && request.Status == "Assigned")
            {
                await SendCenterAllocationNotificationAndEmail(center, device, request.ResponseDeadline);
            }

            return Ok(new
            {
                message = $"Successfully assigned refurbishment center {center.CenterName}.",
                refurbishmentRequestId = request.RefurbishmentRequestId,
                refurbishmentCenterId = center.RefurbishmentCenterId,
                status = request.Status
            });
        }

        [HttpGet("admin/requests")]
        public async Task<IActionResult> GetAllRefurbishmentRequests()
        {
            await CheckAndUpdateExpiredRefurbishmentRequests();

            var requests = await db.RefurbishmentRequests
                .Include(r => r.Device)
                    .ThenInclude(d => d.User)
                .Include(r => r.Device)
                    .ThenInclude(d => d.Category)
                .Include(r => r.RefurbishmentCenter)
                    .ThenInclude(c => c.Login)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    refurbishmentRequestId = r.RefurbishmentRequestId,
                    deviceId = r.DeviceId,
                    refurbishmentCenterId = r.RefurbishmentCenterId,
                    refurbishmentCenterName = r.RefurbishmentCenter != null ? r.RefurbishmentCenter.CenterName : null,
                    refurbishmentCenterCity = r.RefurbishmentCenter != null ? r.RefurbishmentCenter.City : null,
                    refurbishmentCenterState = r.RefurbishmentCenter != null ? r.RefurbishmentCenter.State : null,
                    refurbishmentCenterPhone = r.RefurbishmentCenter != null ? r.RefurbishmentCenter.PhoneNumber : null,
                    refurbishmentCenterEmail = r.RefurbishmentCenter != null && r.RefurbishmentCenter.Login != null ? r.RefurbishmentCenter.Login.Email : null,
                    status = r.Status,
                    assignedAt = r.AssignedAt,
                    responseDeadline = r.ResponseDeadline,
                    respondedAt = r.RespondedAt,
                    refurbishmentStartedAt = r.RefurbishmentStartedAt,
                    processDeadline = r.ProcessDeadline,
                    refurbishmentCompletedAt = r.RefurbishmentCompletedAt,
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

        [Authorize]
        [HttpGet("my-requests")]
        public async Task<IActionResult> GetMyRefurbishmentRequests()
        {
            await CheckAndUpdateExpiredRefurbishmentRequests();

            try
            {
                var loginIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (loginIdClaim == null || !int.TryParse(loginIdClaim.Value, out int loginId))
                {
                    return Unauthorized(new { message = "User identity not found." });
                }

                var center = await db.RefurbishmentCenter.FirstOrDefaultAsync(c => c.LoginId == loginId || c.RefurbishmentCenterId == loginId);
                if (center == null)
                {
                    center = await db.RefurbishmentCenter.FirstOrDefaultAsync();
                }

                if (center == null)
                {
                    return Ok(new List<object>());
                }

                var requests = await db.RefurbishmentRequests
                    .Include(r => r.Device)
                        .ThenInclude(d => d.User)
                    .Include(r => r.Device)
                        .ThenInclude(d => d.Category)
                    .Where(r => r.RefurbishmentCenterId == center.RefurbishmentCenterId)
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new
                    {
                        refurbishmentRequestId = r.RefurbishmentRequestId,
                        deviceId = r.DeviceId,
                        refurbishmentCenterId = r.RefurbishmentCenterId,
                        status = r.Status,
                        assignedAt = r.AssignedAt,
                        responseDeadline = r.ResponseDeadline,
                        respondedAt = r.RespondedAt,
                        refurbishmentStartedAt = r.RefurbishmentStartedAt,
                        processDeadline = r.ProcessDeadline,
                        refurbishmentCompletedAt = r.RefurbishmentCompletedAt,
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

        [HttpPut("accept/{requestId}")]
        public async Task<IActionResult> AcceptRequest(int requestId)
        {
            await CheckAndUpdateExpiredRefurbishmentRequests();

            var request = await db.RefurbishmentRequests
                .Include(r => r.Device)
                    .ThenInclude(d => d.User)
                .Include(r => r.Device)
                    .ThenInclude(d => d.Category)
                .Include(r => r.RefurbishmentCenter)
                .FirstOrDefaultAsync(r => r.RefurbishmentRequestId == requestId);

            if (request == null)
            {
                return NotFound(new { message = "Request not found." });
            }

            if (request.Status != "Assigned" && request.Status != "Waiting")
            {
                return BadRequest(new { message = "This request cannot be accepted in its current status." });
            }

            if (request.RefurbishmentCenter == null)
            {
                return BadRequest(new { message = "No refurbishment center is associated with this request." });
            }

            var inspectionRequest = await db.InspectionRequest
                .Include(i => i.Technician)
                    .ThenInclude(t => t.Login)
                .Include(i => i.Device)
                .Where(i => i.DeviceId == request.DeviceId && i.Status != "Rejected" && i.Status != "Cancelled")
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefaultAsync();

            var technician = inspectionRequest?.Technician ?? await db.Technician.FirstOrDefaultAsync();

            request.Status = "Accepted";
            request.RespondedAt = DateTime.Now;
            request.RefurbishmentStartedAt = DateTime.Now;
            request.ProcessDeadline = DateTime.Now.AddDays(10);
            request.UpdatedAt = DateTime.Now;

            if (request.Device != null)
            {
                request.Device.LifecycleStatus = "RefurbishmentCenterAccepted";
                request.Device.ProcessingLifecycleStatus = "CenterAccepted";
            }

            var existingAssignment = await db.CollectionAssignments
                .FirstOrDefaultAsync(a =>
                    a.DeviceId == request.DeviceId &&
                    a.AssignmentType == "TechnicianToRefurbishmentCenter" &&
                    a.Status != "Rejected" &&
                    a.Status != "Cancelled");

            if (existingAssignment != null)
            {
                await db.SaveChangesAsync();
                return Ok(new
                {
                    message = "Refurbishment center accepted the device. A collection assignment already exists.",
                    refurbishmentRequestId = request.RefurbishmentRequestId,
                    status = request.Status
                });
            }

            CollectionAgent? agent = null;
            if (technician != null)
            {
                agent = await FindBestCollectionAgentForRefurbishment(technician, request.RefurbishmentCenter);
            }

            var assignment = new CollectionAssignment
            {
                DeviceId = request.DeviceId,
                CollectionAgentId = agent?.CollectionAgentId,
                RefurbishmentCenterId = request.RefurbishmentCenterId,
                AssignmentType = "TechnicianToRefurbishmentCenter",
                SourceType = "Technician Center",
                DestinationType = "Refurbishment Center",
                Status = agent != null ? "Assigned" : "Waiting",
                AssignedAt = agent != null ? DateTime.Now : null,
                ResponseDeadline = agent != null ? DateTime.Now.AddHours(24) : null,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            db.CollectionAssignments.Add(assignment);
            await db.SaveChangesAsync();

            // Notifications to Agent and Technician
            if (agent != null && agent.LoginId > 0)
            {
                var notification = new Notification
                {
                    LoginId = agent.LoginId,
                    Title = "New Refurbishment Center Pickup Assignment",
                    Message = $"Device #{request.DeviceId} must be collected from Technician and delivered to {request.RefurbishmentCenter.CenterName}.",
                    Isread = false,
                    Status = true,
                    CreatedAt = DateTime.Now
                };
                db.Notification.Add(notification);
            }

            if (technician != null && technician.LoginId > 0)
            {
                var techNotification = new Notification
                {
                    LoginId = technician.LoginId,
                    Title = "Collection Agent Allocated for Refurbishment Dispatch",
                    Message = $"Refurbishment center {request.RefurbishmentCenter.CenterName} accepted device #{request.DeviceId}. Agent has been assigned for pickup.",
                    Isread = false,
                    Status = true,
                    CreatedAt = DateTime.Now
                };
                db.Notification.Add(techNotification);
            }

            await db.SaveChangesAsync();

            return Ok(new
            {
                message = "Refurbishment request accepted successfully and transport logistics scheduled.",
                refurbishmentRequestId = request.RefurbishmentRequestId,
                status = request.Status,
                collectionAssignmentId = assignment.CollectionAssignmentId
            });
        }

        [HttpPut("reject/{requestId}")]
        public async Task<IActionResult> RejectRequest(int requestId, [FromQuery] string? reason = null)
        {
            await CheckAndUpdateExpiredRefurbishmentRequests();

            var request = await db.RefurbishmentRequests
                .Include(r => r.Device)
                .Include(r => r.RefurbishmentCenter)
                .FirstOrDefaultAsync(r => r.RefurbishmentRequestId == requestId);

            if (request == null)
            {
                return NotFound(new { message = "Request not found." });
            }

            request.Status = "Rejected";
            request.RejectionReason = reason ?? "Capacity exceeded / specifications incompatible";
            request.RespondedAt = DateTime.Now;
            request.UpdatedAt = DateTime.Now;
            request.ReassignmentCount++;

            if (request.Device != null)
            {
                request.Device.LifecycleStatus = "RefurbishmentCenterPending";
            }

            await db.SaveChangesAsync();

            // Attempt auto re-allocation
            if (request.Device != null)
            {
                var device = await db.Device.Include(d => d.User).FirstOrDefaultAsync(d => d.DeviceId == request.DeviceId);
                if (device != null)
                {
                    var nextCenter = await FindRefurbishmentCenter(device, request.RefurbishmentCenterId);
                    if (nextCenter != null)
                    {
                        var nextReq = new RefurbishmentRequest
                        {
                            DeviceId = device.DeviceId,
                            RefurbishmentCenterId = nextCenter.RefurbishmentCenterId,
                            Status = "Assigned",
                            AssignedAt = DateTime.Now,
                            ResponseDeadline = DateTime.Now.AddHours(24),
                            ReassignmentCount = request.ReassignmentCount + 1,
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
                        };
                        db.RefurbishmentRequests.Add(nextReq);
                        device.LifecycleStatus = "RefurbishmentCenterAssigned";
                        await db.SaveChangesAsync();
                        await SendCenterAllocationNotificationAndEmail(nextCenter, device, nextReq.ResponseDeadline);
                    }
                }
            }

            return Ok(new
            {
                message = "Refurbishment request rejected.",
                refurbishmentRequestId = request.RefurbishmentRequestId,
                status = "Rejected"
            });
        }
    }
}
