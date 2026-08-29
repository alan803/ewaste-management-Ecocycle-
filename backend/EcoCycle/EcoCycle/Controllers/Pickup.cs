using EcoCycle.API.Data;
using EcoCycle.API.Models;
using EcoCycle.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcoCycle.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class Pickup : ControllerBase
    {
        private readonly ApplicationDbContext db;
        private readonly EmailService emailService;
        private readonly IWebHostEnvironment env;

        public Pickup(ApplicationDbContext db, EmailService emailService, IWebHostEnvironment env)
        {
            this.db = db;
            this.emailService = emailService;
            this.env = env;
        }

        public class CompletePickupRequestDto
        {
            public string? ProofPhotoBase64 { get; set; }
            public string? AgentNotes { get; set; }
            public string? FailureReason { get; set; }
        }

        [HttpPost("start/{assignmentId}")]
        public async Task<IActionResult> StartPickup(int assignmentId)
        {
            try
            {
                var assignment = await db.CollectionAssignments
                    .Include(x => x.Device)
                        .ThenInclude(d => d.User)
                            .ThenInclude(u => u.Login)
                    .Include(x => x.CollectionAgent)
                    .FirstOrDefaultAsync(x => x.CollectionAssignmentId == assignmentId);

                if (assignment == null)
                {
                    return NotFound(new { message = "Collection assignment not found." });
                }

                // Update status of collection assignment to PickupStarted
                assignment.Status = "PickupStarted";
                assignment.PickupStartedAt = DateTime.Now;
                assignment.UpdatedAt = DateTime.Now;

                if (assignment.Device != null)
                {
                    assignment.Device.LifecycleStatus = "EnRoute";
                }

                // Update or Create record in Pickup table
                var pickupRecord = await db.Pickups
                    .FirstOrDefaultAsync(x => x.CollectionAssignmentId == assignmentId);

                if (pickupRecord == null)
                {
                    pickupRecord = new EcoCycle.API.Models.Pickup
                    {
                        CollectionAssignmentId = assignmentId,
                        Status = "PickupStarted",
                        StartedAt = DateTime.Now,
                        CreatedAt = DateTime.Now
                    };
                    db.Pickups.Add(pickupRecord);
                }
                else
                {
                    pickupRecord.Status = "PickupStarted";
                    pickupRecord.StartedAt = DateTime.Now;
                }

                await db.SaveChangesAsync();

                // Send Notification & Email to the device owner (User)
                var device = assignment.Device;
                var owner = device?.User;
                var ownerLogin = owner?.Login;
                var agent = assignment.CollectionAgent;

                string agentName = agent != null
                    ? $"{agent.FirstName} {agent.LastName}".Trim()
                    : "EcoCycle Field Officer";

                if (string.IsNullOrWhiteSpace(agentName))
                {
                    agentName = "EcoCycle Field Officer";
                }

                string deviceName = device != null
                    ? $"{device.Brand} {device.Model}".Trim()
                    : "E-Waste Item";

                // 1. Send In-App Notification to device owner
                if (owner != null && owner.LoginId > 0)
                {
                    var notification = new Notification
                    {
                        LoginId = owner.LoginId,
                        Title = "E-Waste Collection Agent En Route",
                        Message = $"Your e-waste pickup for {deviceName} has been started by agent {agentName}. The agent is on the way to your pickup address.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };
                    db.Notification.Add(notification);
                    await db.SaveChangesAsync();
                }

                // 2. Send Email to device owner
                string recipientEmail = ownerLogin?.Email;
                if (!string.IsNullOrWhiteSpace(recipientEmail))
                {
                    string customerName = owner != null
                        ? $"{owner.FirstName} {owner.LastName}".Trim()
                        : "Valued Customer";

                    string pickupAddress = device?.Address ?? owner?.Address ?? "Your registered pickup address";

                    string htmlEmailBody = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;'>
                            <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; font-family: sans-serif;'>
                                <div style='text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px;'>
                                    <h2 style='color: #10b981; margin: 0;'>EcoCycle E-Waste Management</h2>
                                    <p style='color: #64748b; margin: 4px 0 0 0; font-size: 14px;'>Pickup Dispatched • Collection Agent En Route</p>
                                </div>
                                <div style='color: #0f172a;'>
                                    <p>Hello <strong>{customerName}</strong>,</p>
                                    <p>Good news! Your e-waste collection agent has started the pickup process for your request.</p>
                                    
                                    <div style='background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0;'>
                                        <h4 style='margin: 0 0 10px 0; color: #1d4ed8;'>Pickup Request Details</h4>
                                        <p style='margin: 4px 0;'><strong>Device:</strong> {deviceName}</p>
                                        <p style='margin: 4px 0;'><strong>Collection Agent:</strong> {agentName}</p>
                                        <p style='margin: 4px 0;'><strong>Pickup Address:</strong> {pickupAddress}</p>
                                    </div>

                                    <h4 style='color: #0f172a; margin-top: 20px;'>Important Instructions for Handover:</h4>
                                    <ol style='color: #475569; padding-left: 20px; line-height: 1.6;'>
                                        <li>Please ensure the device ({deviceName}) is ready for handover.</li>
                                        <li>Keep your registered phone handy to share the verification OTP with the agent.</li>
                                        <li>The agent will inspect and verify the device before confirming handover.</li>
                                    </ol>

                                    <p style='margin-top: 24px;'>Thank you for choosing <strong>EcoCycle</strong> for responsible e-waste recycling!</p>
                                    
                                    <p style='color: #64748b; font-size: 13px; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px;'>
                                        Best regards,<br/>
                                        <strong>EcoCycle Field Dispatch Team</strong>
                                    </p>
                                </div>
                            </div>
                        </body>
                        </html>
                    ";

                    _ = emailService.SendEmailAsync(
                        recipientEmail,
                        $"EcoCycle: Pickup Started for {deviceName}",
                        htmlEmailBody
                    );
                }

                return Ok(new
                {
                    message = "Pickup started successfully. Notification and email sent to owner.",
                    status = assignment.Status,
                    pickupId = pickupRecord.PickupId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error starting pickup.",
                    error = ex.Message
                });
            }
        }

        private static readonly System.Collections.Concurrent.ConcurrentDictionary<int, (string Otp, DateTime SentAt)> OtpStore = new();

        public class VerifyOtpDto
        {
            public string Otp { get; set; } = string.Empty;
        }

        [HttpPost("send-otp/{assignmentId}")]
        public async Task<IActionResult> SendHandoverOtp(int assignmentId, [FromQuery] string? target = null)
        {
            try
            {
                var assignment = await db.CollectionAssignments
                    .Include(x => x.Device)
                        .ThenInclude(d => d.User)
                            .ThenInclude(u => u.Login)
                    .FirstOrDefaultAsync(x => x.CollectionAssignmentId == assignmentId);

                if (assignment == null)
                {
                    return NotFound(new { message = "Collection assignment not found." });
                }

                string? recipientEmail = null;

                if (string.Equals(target, "technician", StringComparison.OrdinalIgnoreCase))
                {
                    // Send OTP to Technician for delivery handover
                    var inspReq = await db.InspectionRequest
                        .Include(ir => ir.Technician)
                            .ThenInclude(t => t.Login)
                        .Where(ir => ir.DeviceId == assignment.DeviceId && ir.Technician != null)
                        .OrderByDescending(ir => ir.CreatedAt)
                        .FirstOrDefaultAsync();

                    var tech = inspReq?.Technician;
                    if (tech == null)
                    {
                        tech = await db.Technician
                            .Include(t => t.Login)
                            .Where(t => t.Status == "Approved" || t.Status == "Active")
                            .OrderBy(t => t.TechnicianId)
                            .FirstOrDefaultAsync();
                    }

                    recipientEmail = tech?.Login?.Email;
                    if (string.IsNullOrWhiteSpace(recipientEmail) && tech != null && tech.LoginId > 0)
                    {
                        var loginObj = await db.Login.FirstOrDefaultAsync(l => l.LoginId == tech.LoginId);
                        recipientEmail = loginObj?.Email;
                    }
                }
                else
                {
                    // Send OTP to Customer for pickup handover
                    var user = assignment.Device?.User;
                    recipientEmail = user?.Login?.Email;
                    if (string.IsNullOrWhiteSpace(recipientEmail) && user != null && user.LoginId > 0)
                    {
                        var loginObj = await db.Login.FirstOrDefaultAsync(l => l.LoginId == user.LoginId);
                        recipientEmail = loginObj?.Email;
                    }
                }

                if (string.IsNullOrWhiteSpace(recipientEmail))
                {
                    return BadRequest(new { message = "Recipient email address not found for handover OTP." });
                }

                var random = new Random();
                string generatedOtp = random.Next(1000, 9999).ToString();

                OtpStore[assignmentId] = (generatedOtp, DateTime.Now);

                string deviceName = assignment.Device != null
                    ? $"{assignment.Device.Brand} {assignment.Device.Model}".Trim()
                    : "E-Waste Device";

                await emailService.SendHandoverOtpEmail(recipientEmail, generatedOtp, deviceName);

                return Ok(new
                {
                    message = $"Handover OTP sent successfully to {recipientEmail}.",
                    recipientEmail = recipientEmail,
                    expiresInSeconds = 30
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error sending OTP email.", error = ex.Message });
            }
        }

        [HttpPost("verify-otp/{assignmentId}")]
        public async Task<IActionResult> VerifyHandoverOtp(int assignmentId, [FromBody] VerifyOtpDto dto)
        {
            try
            {
                if (dto == null || string.IsNullOrWhiteSpace(dto.Otp))
                {
                    return BadRequest(new { message = "OTP code is required." });
                }

                if (!OtpStore.TryGetValue(assignmentId, out var storedData))
                {
                    return BadRequest(new { message = "No active OTP request found. Please click 'Send OTP'." });
                }

                var secondsElapsed = (DateTime.Now - storedData.SentAt).TotalSeconds;
                if (secondsElapsed > 30)
                {
                    OtpStore.TryRemove(assignmentId, out _);
                    return BadRequest(new { message = "OTP has expired (30-second validity period ended). Please click 'Resend OTP'." });
                }

                if (!string.Equals(storedData.Otp.Trim(), dto.Otp.Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { message = "Invalid OTP code. Please check the code sent to recipient email." });
                }

                // Verification successful
                return Ok(new { message = "Handover OTP verified successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error verifying OTP.", error = ex.Message });
            }
        }

        [HttpPost("complete/{assignmentId}")]
        public async Task<IActionResult> CompletePickup(int assignmentId, [FromBody] CompletePickupRequestDto? dto)
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

                assignment.Status = "Completed";
                assignment.UpdatedAt = DateTime.Now;

                if (assignment.Device != null)
                {
                    assignment.Device.LifecycleStatus = "Collected";
                    assignment.Device.Status = "Collected";
                }

                string? savedPhotoPath = null;
                if (!string.IsNullOrWhiteSpace(dto?.ProofPhotoBase64))
                {
                    try
                    {
                        string base64Data = dto.ProofPhotoBase64;
                        string extension = ".jpg";
                        if (base64Data.Contains("data:image/png;base64,")) { extension = ".png"; base64Data = base64Data.Replace("data:image/png;base64,", ""); }
                        else if (base64Data.Contains("data:image/jpeg;base64,")) { extension = ".jpg"; base64Data = base64Data.Replace("data:image/jpeg;base64,", ""); }

                        byte[] imageBytes = Convert.FromBase64String(base64Data);
                        string uploadsFolder = Path.Combine(env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", "pickups");
                        if (!Directory.Exists(uploadsFolder))
                        {
                            Directory.CreateDirectory(uploadsFolder);
                        }

                        string uniqueFileName = $"{Guid.NewGuid()}{extension}";
                        string filePath = Path.Combine(uploadsFolder, uniqueFileName);
                        await System.IO.File.WriteAllBytesAsync(filePath, imageBytes);
                        savedPhotoPath = $"/uploads/pickups/{uniqueFileName}";
                    }
                    catch (Exception imgEx)
                    {
                        Console.WriteLine($"[Pickup Complete Photo Save Error]: {imgEx.Message}");
                    }
                }

                // Create or update Pickup record
                var pickupRecord = await db.Pickups.FirstOrDefaultAsync(p => p.CollectionAssignmentId == assignmentId);
                if (pickupRecord == null)
                {
                    pickupRecord = new EcoCycle.API.Models.Pickup
                    {
                        CollectionAssignmentId = assignmentId,
                        Status = "Completed",
                        DeviceVerified = true,
                        StartedAt = assignment.PickupStartedAt ?? DateTime.Now.AddHours(-1),
                        PickedUpAt = DateTime.Now,
                        ProofPhotoPath = savedPhotoPath,
                        AgentNotes = dto?.AgentNotes,
                        FailureReason = dto?.FailureReason,
                        CreatedAt = DateTime.Now
                    };
                    db.Pickups.Add(pickupRecord);
                }
                else
                {
                    pickupRecord.Status = "Completed";
                    pickupRecord.DeviceVerified = true;
                    pickupRecord.PickedUpAt = DateTime.Now;
                    if (!string.IsNullOrEmpty(savedPhotoPath)) pickupRecord.ProofPhotoPath = savedPhotoPath;
                    if (!string.IsNullOrEmpty(dto?.AgentNotes)) pickupRecord.AgentNotes = dto.AgentNotes;
                    if (!string.IsNullOrEmpty(dto?.FailureReason)) pickupRecord.FailureReason = dto.FailureReason;
                }

                // Create Delivery record in Pending status so delivery process is initialized
                var delivery = await db.Deliveries.FirstOrDefaultAsync(d => d.CollectionAssignmentId == assignmentId);
                if (delivery == null)
                {
                    delivery = new Delivery
                    {
                        CollectionAssignmentId = assignmentId,
                        Status = "Pending",
                        ProofPhotoPath = savedPhotoPath,
                        CreatedAt = DateTime.Now
                    };
                    db.Deliveries.Add(delivery);
                }

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Pickup completed successfully.",
                    status = assignment.Status,
                    pickupId = pickupRecord.PickupId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error completing pickup.", error = ex.Message });
            }
        }

        [HttpPost("start-delivery/{assignmentId}")]
        public async Task<IActionResult> StartDelivery(int assignmentId)
        {
            try
            {
                var assignment = await db.CollectionAssignments
                    .Include(x => x.Device)
                    .Include(x => x.CollectionAgent)
                    .FirstOrDefaultAsync(x => x.CollectionAssignmentId == assignmentId);

                if (assignment == null)
                {
                    return NotFound(new { message = "Collection assignment not found." });
                }

                var delivery = await db.Deliveries
                    .FirstOrDefaultAsync(d => d.CollectionAssignmentId == assignmentId);

                if (delivery == null)
                {
                    delivery = new Delivery
                    {
                        CollectionAssignmentId = assignmentId,
                        Status = "InTransit",
                        StartedAt = DateTime.Now,
                        CreatedAt = DateTime.Now
                    };
                    db.Deliveries.Add(delivery);
                }
                else
                {
                    delivery.Status = "InTransit";
                    delivery.StartedAt = DateTime.Now;
                }

                assignment.Status = "OutForDelivery";
                assignment.UpdatedAt = DateTime.Now;

                if (assignment.Device != null)
                {
                    assignment.Device.LifecycleStatus = "InTransit";
                }

                await db.SaveChangesAsync();

                // Find assigned technician for this device to send Notification & Email
                var inspReq = await db.InspectionRequest
                    .Include(ir => ir.Technician)
                        .ThenInclude(t => t.Login)
                    .Where(ir => ir.DeviceId == assignment.DeviceId && ir.Technician != null)
                    .OrderByDescending(ir => ir.CreatedAt)
                    .FirstOrDefaultAsync();

                var tech = inspReq?.Technician;
                if (tech == null)
                {
                    tech = await db.Technician
                        .Include(t => t.Login)
                        .Where(t => t.Status == "Approved" || t.Status == "Active")
                        .OrderBy(t => t.TechnicianId)
                        .FirstOrDefaultAsync();
                }

                var agent = assignment.CollectionAgent;
                string agentName = agent != null ? $"{agent.FirstName} {agent.LastName}".Trim() : "EcoCycle Field Officer";
                string deviceName = assignment.Device != null ? $"{assignment.Device.Brand} {assignment.Device.Model}".Trim() : "E-Waste Item";

                if (tech != null)
                {
                    // 1. Send In-App Notification to technician
                    if (tech.LoginId > 0)
                    {
                        var notification = new Notification
                        {
                            LoginId = tech.LoginId,
                            Title = "Delivery Dispatched - Collection Agent En Route",
                            Message = $"Collection agent {agentName} has started transit for device {deviceName} (Assignment #{assignmentId}) to your inspection center.",
                            Isread = false,
                            Status = true,
                            CreatedAt = DateTime.Now
                        };
                        db.Notification.Add(notification);
                        await db.SaveChangesAsync();
                    }

                    // 2. Send Email to technician
                    string? techEmail = tech.Login?.Email;
                    if (!string.IsNullOrWhiteSpace(techEmail))
                    {
                        string techName = $"{tech.FirstName} {tech.LastName}".Trim();
                        string centerName = !string.IsNullOrWhiteSpace(tech.InspectionCenterName) ? tech.InspectionCenterName : "EcoCycle Inspection Center";

                        string htmlEmailBody = $@"
                            <html>
                            <body style='font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;'>
                                <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;'>
                                    <div style='text-align: center; border-bottom: 2px solid #059669; padding-bottom: 16px; margin-bottom: 20px;'>
                                        <h2 style='color: #059669; margin: 0;'>EcoCycle E-Waste Delivery Notice</h2>
                                        <p style='color: #64748b; margin: 4px 0 0 0; font-size: 14px;'>Delivery Dispatched • Collection Agent En Route</p>
                                    </div>
                                    <div style='color: #0f172a;'>
                                        <p>Hello <strong>{techName}</strong>,</p>
                                        <p>Collection agent <strong>{agentName}</strong> has started transit to deliver collected e-waste to your center (<strong>{centerName}</strong>).</p>

                                        <div style='background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0;'>
                                            <h4 style='margin: 0 0 10px 0; color: #1d4ed8;'>Delivery Details</h4>
                                            <p style='margin: 4px 0;'><strong>Device:</strong> {deviceName}</p>
                                            <p style='margin: 4px 0;'><strong>Collection Agent:</strong> {agentName}</p>
                                            <p style='margin: 4px 0;'><strong>Assignment ID:</strong> #{assignmentId}</p>
                                        </div>

                                        <h4 style='color: #0f172a; margin-top: 20px;'>Important Instructions for Delivery Handover:</h4>
                                        <ol style='color: #475569; padding-left: 20px; line-height: 1.6;'>
                                            <li>Be ready to receive the e-waste device ({deviceName}) at your inspection center.</li>
                                            <li>Provide the 4-digit verification OTP sent to your registered email when the agent arrives.</li>
                                            <li>Inspect the device condition and confirm receipt with the collection agent.</li>
                                        </ol>

                                        <p style='margin-top: 24px;'>Best regards,<br/><strong>EcoCycle Logistics & Dispatch Team</strong></p>
                                    </div>
                                </div>
                            </body>
                            </html>
                        ";

                        _ = emailService.SendEmailAsync(
                            techEmail,
                            $"EcoCycle: Delivery Started for {deviceName} (Assignment #{assignmentId})",
                            htmlEmailBody
                        );
                    }
                }

                return Ok(new
                {
                    message = "Delivery started successfully. Notification and email sent to technician.",
                    status = assignment.Status,
                    deliveryStatus = delivery.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error starting delivery.", error = ex.Message });
            }
        }

        [HttpPost("deliver/{assignmentId}")]
        public async Task<IActionResult> CompleteDelivery(int assignmentId)
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

                var delivery = await db.Deliveries
                    .FirstOrDefaultAsync(d => d.CollectionAssignmentId == assignmentId);

                if (delivery == null)
                {
                    delivery = new Delivery
                    {
                        CollectionAssignmentId = assignmentId,
                        Status = "Delivered",
                        StartedAt = DateTime.Now.AddMinutes(-30),
                        DeliveredAt = DateTime.Now,
                        CreatedAt = DateTime.Now
                    };
                    db.Deliveries.Add(delivery);
                }
                else
                {
                    delivery.Status = "Delivered";
                    delivery.DeliveredAt = DateTime.Now;
                }

                assignment.Status = "DeliveredToCenter";
                assignment.UpdatedAt = DateTime.Now;

                if (assignment.Device != null)
                {
                    assignment.Device.LifecycleStatus = "AtInspectionCenter";
                }

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Device delivered to inspection center successfully.",
                    status = assignment.Status,
                    deliveryStatus = delivery.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error completing delivery to inspection center.", error = ex.Message });
            }
        }
    }
}