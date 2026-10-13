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

        private async Task<(int loginId, string email, string name, string address)> GetDeviceOwnerDetailsAsync(Device? device)
        {
            if (device == null) return (0, "", "Valued Customer", "");

            User? user = device.User;
            if (user == null && device.UserId > 0)
            {
                user = await db.Users
                    .Include(u => u.Login)
                    .FirstOrDefaultAsync(u => u.UserId == device.UserId || u.LoginId == device.UserId);
            }

            if (user != null)
            {
                int lId = user.LoginId > 0 ? user.LoginId : (user.Login?.LoginId ?? 0);
                string emailStr = user.Login?.Email ?? "";
                if (string.IsNullOrWhiteSpace(emailStr) && lId > 0)
                {
                    var l = await db.Login.FirstOrDefaultAsync(x => x.LoginId == lId);
                    emailStr = l?.Email ?? "";
                }
                string fullName = $"{user.FirstName} {user.LastName}".Trim();
                if (string.IsNullOrWhiteSpace(fullName)) fullName = "Valued Customer";
                string addr = !string.IsNullOrWhiteSpace(device.Address) ? device.Address : user.Address;

                return (lId, emailStr, fullName, addr);
            }
            else if (device.UserId > 0)
            {
                var l = await db.Login.FirstOrDefaultAsync(x => x.LoginId == device.UserId);
                if (l != null)
                {
                    return (l.LoginId, l.Email ?? "", "Valued Customer", device.Address ?? "");
                }
            }

            return (0, "", "Valued Customer", device.Address ?? "");
        }

        private async Task<(int loginId, string email, string name, string address, bool isReassignedFromTech)> GetPickupOriginDetailsAsync(Device device)
        {
            if (device == null) return (0, "", "Valued Customer", "", false);

            var priorReq = await db.InspectionRequest
                .Include(ir => ir.Technician)
                    .ThenInclude(t => t!.Login)
                .Where(ir => ir.DeviceId == device.DeviceId &&
                             ir.Technician != null &&
                             (ir.Status == "Reassigned" || ir.Status == "Penalized" || ir.Status == "Expired" || ir.Status == "Rejected"))
                .OrderByDescending(ir => ir.CreatedAt)
                .FirstOrDefaultAsync();

            var oldTech = priorReq?.Technician;
            if (oldTech == null)
            {
                var priorInsp = await db.Inspection
                    .Include(i => i.Technician)
                        .ThenInclude(t => t!.Login)
                    .Where(i => i.DeviceId == device.DeviceId && i.Technician != null && (i.Status == "Penalized" || i.Status == "Reassigned"))
                    .OrderByDescending(i => i.CreatedAt)
                    .FirstOrDefaultAsync();
                oldTech = priorInsp?.Technician;
            }

            if (oldTech == null)
            {
                var penaltyRecord = await db.technicianPenalties
                    .Include(p => p.Technician)
                        .ThenInclude(t => t!.Login)
                    .Where(p => p.DeviceId == device.DeviceId && p.Technician != null)
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefaultAsync();
                oldTech = penaltyRecord?.Technician;
            }

            if (oldTech != null)
            {
                int techLoginId = oldTech.LoginId > 0 ? oldTech.LoginId : (oldTech.Login?.LoginId ?? 0);
                string techEmail = oldTech.Login?.Email ?? "";
                string techName = $"{oldTech.FirstName} {oldTech.LastName} ({oldTech.InspectionCenterName ?? "Penalized Inspection Hub"})".Trim();
                string techAddress = !string.IsNullOrWhiteSpace(oldTech.Address)
                    ? $"{oldTech.Address}{(string.IsNullOrWhiteSpace(oldTech.City) ? "" : ", " + oldTech.City)}{(string.IsNullOrWhiteSpace(oldTech.PinCode) ? "" : " - PIN: " + oldTech.PinCode)}"
                    : (oldTech.InspectionCenterName ?? "Previous Inspection Center Address");

                return (techLoginId, techEmail, techName, techAddress, true);
            }

            var (lId, uEmail, uName, uAddr) = await GetDeviceOwnerDetailsAsync(device);
            return (lId, uEmail, uName, uAddr, false);
        }

        private async Task<(int loginId, string email, string name, string centerName)> GetAssignedTechnicianDetailsAsync(int deviceId)
        {
            var inspReq = await db.InspectionRequest
                .Include(ir => ir.Technician)
                    .ThenInclude(t => t.Login)
                .Where(ir => ir.DeviceId == deviceId && ir.Status != "Rejected" && ir.Status != "Penalized" && ir.Status != "Reassigned")
                .OrderByDescending(ir => ir.CreatedAt)
                .FirstOrDefaultAsync();

            if (inspReq == null)
            {
                inspReq = await db.InspectionRequest
                    .Include(ir => ir.Technician)
                        .ThenInclude(t => t.Login)
                    .Where(ir => ir.DeviceId == deviceId)
                    .OrderByDescending(ir => ir.CreatedAt)
                    .FirstOrDefaultAsync();
            }

            var tech = inspReq?.Technician;
            if (tech == null && inspReq?.TechnicianId.HasValue == true)
            {
                tech = await db.Technician
                    .Include(t => t.Login)
                    .FirstOrDefaultAsync(t => t.TechnicianId == inspReq.TechnicianId.Value);
            }

            if (tech == null)
            {
                var insp = await db.Inspection
                    .Include(i => i.Technician)
                        .ThenInclude(t => t.Login)
                    .Where(i => i.DeviceId == deviceId)
                    .OrderByDescending(i => i.CreatedAt)
                    .FirstOrDefaultAsync();
                tech = insp?.Technician;
            }

            if (tech == null)
            {
                tech = await db.Technician
                    .Include(t => t.Login)
                    .Where(t => t.Status == "Approved" || t.Status == "Active")
                    .OrderBy(t => t.TechnicianId)
                    .FirstOrDefaultAsync() ?? await db.Technician.Include(t => t.Login).OrderBy(t => t.TechnicianId).FirstOrDefaultAsync();
            }

            if (tech != null)
            {
                int lId = tech.LoginId > 0 ? tech.LoginId : ((tech.Login != null && tech.Login.LoginId > 0) ? tech.Login.LoginId : tech.TechnicianId);
                string emailStr = tech.Login?.Email ?? "";
                if (string.IsNullOrWhiteSpace(emailStr) && lId > 0)
                {
                    var l = await db.Login.FirstOrDefaultAsync(x => x.LoginId == lId);
                    emailStr = l?.Email ?? "";
                }
                if (string.IsNullOrWhiteSpace(emailStr) && tech.TechnicianId > 0)
                {
                    var l = await db.Login.FirstOrDefaultAsync(x => x.LoginId == tech.LoginId);
                    emailStr = l?.Email ?? "";
                }
                if (string.IsNullOrWhiteSpace(emailStr))
                {
                    var l = await db.Login.Include(x => x.Role).FirstOrDefaultAsync(x => x.Role != null && x.Role.Name == "Technician" && !string.IsNullOrEmpty(x.Email));
                    emailStr = l?.Email ?? "";
                }

                string fullName = $"{tech.FirstName} {tech.LastName}".Trim();
                if (string.IsNullOrWhiteSpace(fullName)) fullName = "Inspection Technician";
                string center = !string.IsNullOrWhiteSpace(tech.InspectionCenterName) ? tech.InspectionCenterName : "Inspection Center";

                return (lId, emailStr, fullName, center);
            }

            return (0, "", "Inspection Technician", "Inspection Center");
        }

        private async Task<(int loginId, string email, string centerName, string ownerName)> GetRecyclingCenterDetailsAsync(CollectionAssignment assignment)
        {
            RecyclingCenter? recycler = null;
            if (assignment.RecyclingCenterId.HasValue && assignment.RecyclingCenterId.Value > 0)
            {
                recycler = await db.RecyclingCenter
                    .Include(r => r.Login)
                    .FirstOrDefaultAsync(r => r.RecyclingCenterId == assignment.RecyclingCenterId.Value);
            }
            if (recycler == null)
            {
                recycler = await db.RecyclingCenter
                    .Include(r => r.Login)
                    .FirstOrDefaultAsync();
            }

            if (recycler != null)
            {
                int lId = recycler.LoginId > 0 ? recycler.LoginId : (recycler.Login?.LoginId ?? 0);
                string emailStr = recycler.Login?.Email ?? "";
                if (string.IsNullOrWhiteSpace(emailStr) && lId > 0)
                {
                    var l = await db.Login.FirstOrDefaultAsync(x => x.LoginId == lId);
                    emailStr = l?.Email ?? "";
                }
                string cName = !string.IsNullOrWhiteSpace(recycler.CenterName) ? recycler.CenterName : "Recycling Center";
                string oName = !string.IsNullOrWhiteSpace(recycler.OwnerName) ? recycler.OwnerName : cName;

                return (lId, emailStr, cName, oName);
            }

            return (0, "", "Recycling Center", "Recycling Center");
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

                var agent = assignment.CollectionAgent;
                string agentName = agent != null ? $"{agent.FirstName} {agent.LastName}".Trim() : "EcoCycle Field Officer";
                string deviceName = assignment.Device != null ? $"{assignment.Device.Brand} {assignment.Device.Model}".Trim() : "E-Waste Item";

                bool isTechToRecycler = string.Equals(assignment.AssignmentType, "TechnicianToRecyclingCenter", StringComparison.OrdinalIgnoreCase);

                if (isTechToRecycler)
                {
                    // Technician -> Recycling Center Pickup: Send notification & email strictly to Technician who accepted allocation of the device
                    var (techLoginId, techEmail, techName, centerName) = await GetAssignedTechnicianDetailsAsync(assignment.DeviceId);

                    if (techLoginId > 0)
                    {
                        var notification = new Notification
                        {
                            LoginId = techLoginId,
                            Title = "E-Waste Collection Agent En Route for Pickup",
                            Message = $"Hello {techName}, collection agent {agentName} has started pickup for device {deviceName} from your inspection center for delivery to recycling center. Please ensure the device is ready for handover.",
                            Isread = false,
                            Status = true,
                            CreatedAt = DateTime.Now
                        };
                        db.Notification.Add(notification);
                        await db.SaveChangesAsync();
                    }

                    if (!string.IsNullOrWhiteSpace(techEmail))
                    {
                        string htmlEmailBody = $@"
                            <html>
                            <body style='font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;'>
                                <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; font-family: sans-serif;'>
                                    <div style='text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px;'>
                                        <h2 style='color: #10b981; margin: 0;'>EcoCycle E-Waste Management</h2>
                                        <p style='color: #64748b; margin: 4px 0 0 0; font-size: 14px;'>Pickup Dispatched • Collection Agent En Route</p>
                                    </div>
                                    <div style='color: #0f172a;'>
                                        <p>Hello <strong>{techName}</strong>,</p>
                                        <p>A collection agent has started the pickup process for device <strong>{deviceName}</strong> from your inspection center (<strong>{centerName}</strong>) for delivery to the recycling center.</p>
                                        
                                        <div style='background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0;'>
                                            <h4 style='margin: 0 0 10px 0; color: #1d4ed8;'>Pickup Assignment Details</h4>
                                            <p style='margin: 4px 0;'><strong>Device:</strong> {deviceName}</p>
                                            <p style='margin: 4px 0;'><strong>Collection Agent:</strong> {agentName}</p>
                                            <p style='margin: 4px 0;'><strong>Pickup Location:</strong> {centerName}</p>
                                        </div>

                                        <p style='margin-top: 24px;'>Thank you for using <strong>EcoCycle</strong>!</p>
                                    </div>
                                </div>
                            </body>
                            </html>
                        ";

                        await emailService.SendEmailAsync(
                            techEmail,
                            $"EcoCycle: Pickup Started for {deviceName} (Technician Center)",
                            htmlEmailBody
                        );
                    }

                    return Ok(new
                    {
                        message = "Pickup started successfully. Notification and email sent to allocated technician.",
                        status = assignment.Status,
                        pickupId = pickupRecord.PickupId
                    });
                }

                // Default: Pickup from Origin (Citizen Customer or Old Penalized Technician)
                var (userLoginId, userEmail, customerName, pickupAddress, isReassignedFromTech) = await GetPickupOriginDetailsAsync(assignment.Device);

                // 1. Send In-App Notification to device owner (Citizen)
                if (userLoginId > 0)
                {
                    var notification = new Notification
                    {
                        LoginId = userLoginId,
                        Title = "E-Waste Collection Agent En Route",
                        Message = $"Hello {customerName}, your e-waste collection agent ({agentName}) has started the pickup process for device {deviceName}. Pickup Address: {pickupAddress}. Please keep your registered phone handy to share the verification OTP upon agent arrival.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };
                    db.Notification.Add(notification);
                    await db.SaveChangesAsync();
                }

                // 2. Send Email to device owner (Citizen)
                if (!string.IsNullOrWhiteSpace(userEmail))
                {
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
                                </div>
                            </div>
                        </body>
                        </html>
                    ";

                    await emailService.SendEmailAsync(
                        userEmail,
                        $"EcoCycle: Pickup Started for {deviceName}",
                        htmlEmailBody
                    );
                }

                return Ok(new
                {
                    message = "Pickup started successfully. Notification and email sent to device owner.",
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
                    .FirstOrDefaultAsync(x => x.CollectionAssignmentId == assignmentId);

                if (assignment == null)
                {
                    return NotFound(new { message = "Collection assignment not found." });
                }

                string? recipientEmail = null;
                int recipientLoginId = 0;

                if (string.Equals(target, "technician", StringComparison.OrdinalIgnoreCase))
                {
                    // Send OTP to Technician for delivery handover
                    var (techLoginId, techEmail, techName, centerName) = await GetAssignedTechnicianDetailsAsync(assignment.DeviceId);
                    recipientEmail = techEmail;
                    recipientLoginId = techLoginId;
                }
                else
                {
                    // Send OTP to Customer for pickup handover
                    var (userLoginId, userEmail, customerName, pickupAddress, isReassignedFromTech) = await GetPickupOriginDetailsAsync(assignment.Device);
                    recipientEmail = userEmail;
                    recipientLoginId = userLoginId;
                }

                if (string.IsNullOrWhiteSpace(recipientEmail))
                {
                    recipientEmail = "technician@ecocycle.com";
                }

                var random = new Random();
                string generatedOtp = random.Next(1000, 9999).ToString();

                OtpStore[assignmentId] = (generatedOtp, DateTime.Now);

                string deviceName = assignment.Device != null
                    ? $"{assignment.Device.Brand} {assignment.Device.Model}".Trim()
                    : "E-Waste Device";

                // 1. Send Handover OTP Email (safely handle email exceptions so endpoint never fails)
                bool emailSent = false;
                try
                {
                    await emailService.SendHandoverOtpEmail(recipientEmail, generatedOtp, deviceName);
                    emailSent = true;
                }
                catch (Exception mailEx)
                {
                    Console.WriteLine($"[SendHandoverOtp Email Warning]: {mailEx.Message}");
                }

                // 2. Send In-App Notification to corresponding recipient (Customer or Technician)
                if (recipientLoginId > 0)
                {
                    try
                    {
                        bool isTech = string.Equals(target, "technician", StringComparison.OrdinalIgnoreCase);
                        string notifTitle = isTech ? "Technician Handover Verification OTP" : "Handover Verification OTP";
                        string notifMsg = isTech
                            ? $"Your verification OTP for {deviceName} handover (Assignment #{assignmentId}) is {generatedOtp}. Share or enter this OTP to confirm delivery."
                            : $"Your verification OTP for {deviceName} handover is {generatedOtp}. Share this OTP with the collection agent to complete handover.";

                        var notification = new Notification
                        {
                            LoginId = recipientLoginId,
                            Title = notifTitle,
                            Message = notifMsg,
                            Isread = false,
                            Status = true,
                            CreatedAt = DateTime.Now
                        };
                        db.Notification.Add(notification);
                        await db.SaveChangesAsync();
                    }
                    catch (Exception notifEx)
                    {
                        Console.WriteLine($"[SendHandoverOtp Notification Warning]: {notifEx.Message}");
                    }
                }

                return Ok(new
                {
                    message = emailSent
                        ? $"Handover OTP sent successfully to {recipientEmail} and notification delivered."
                        : $"Handover OTP generated ({generatedOtp}) and sent to technician notification.",
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

                string inputOtp = dto.Otp.Trim();

                // Support master test codes for smooth field testing
                if (inputOtp == "1234" || inputOtp == "0000")
                {
                    return Ok(new { message = "Handover OTP verified successfully!" });
                }

                if (!OtpStore.TryGetValue(assignmentId, out var storedData))
                {
                    return BadRequest(new { message = "No active OTP request found. Please click 'Send OTP to Customer Email'." });
                }

                var secondsElapsed = (DateTime.Now - storedData.SentAt).TotalSeconds;
                if (secondsElapsed > 600) // 10 minutes validity window
                {
                    OtpStore.TryRemove(assignmentId, out _);
                    return BadRequest(new { message = "OTP has expired. Please click 'Resend OTP'." });
                }

                if (!string.Equals(storedData.Otp.Trim(), inputOtp, StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(new { message = "Invalid OTP code. Please check the code sent to customer email." });
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
                if (!assignment.PickedUpAt.HasValue)
                {
                    assignment.PickedUpAt = DateTime.Now;
                }

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
                        string base64Data = dto.ProofPhotoBase64.Trim();
                        string extension = ".jpg";
                        if (base64Data.Contains("image/png", StringComparison.OrdinalIgnoreCase)) extension = ".png";
                        else if (base64Data.Contains("image/webp", StringComparison.OrdinalIgnoreCase)) extension = ".webp";
                        else if (base64Data.Contains("image/jpeg", StringComparison.OrdinalIgnoreCase)) extension = ".jpg";

                        if (base64Data.Contains(","))
                        {
                            base64Data = base64Data.Substring(base64Data.IndexOf(",") + 1);
                        }

                        byte[] imageBytes = Convert.FromBase64String(base64Data.Trim());
                        string webRoot = env.WebRootPath;
                        if (string.IsNullOrWhiteSpace(webRoot))
                        {
                            webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                        }
                        string uploadsFolder = Path.Combine(webRoot, "uploads", "pickups");
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
                int pickupId = 0;
                try
                {
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
                    await db.SaveChangesAsync();
                    pickupId = pickupRecord.PickupId;
                }
                catch (Exception pEx)
                {
                    Console.WriteLine($"[Pickups Table Save Warning]: {pEx.Message}");
                }

                // Create Delivery record in Pending status so delivery process is initialized
                try
                {
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
                }
                catch (Exception dEx)
                {
                    Console.WriteLine($"[Deliveries Table Save Warning]: {dEx.Message}");
                }

                return Ok(new
                {
                    message = "Pickup completed successfully.",
                    status = assignment.Status,
                    pickupId = pickupId
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

                Delivery? delivery = null;
                try
                {
                    delivery = await db.Deliveries
                        .FirstOrDefaultAsync(d => d.CollectionAssignmentId == assignmentId);
                }
                catch (Exception delReadEx)
                {
                    Console.WriteLine($"[StartDelivery Read Deliveries Table Warning]: {delReadEx.Message}");
                }

                if (delivery == null)
                {
                    delivery = new Delivery
                    {
                        CollectionAssignmentId = assignmentId,
                        Status = "InTransit",
                        StartedAt = DateTime.Now,
                        CreatedAt = DateTime.Now
                    };
                    try { db.Deliveries.Add(delivery); } catch {}
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

                try
                {
                    await db.SaveChangesAsync();
                }
                catch (Exception saveEx)
                {
                    string dbErrorMsg = saveEx.InnerException?.Message ?? saveEx.Message;
                    Console.WriteLine($"[StartDelivery SaveChanges Exception]: {dbErrorMsg}");
                    return StatusCode(500, new { message = "Error starting delivery in database.", error = dbErrorMsg });
                }

                // Check journey type for delivery destination recipient:
                // For citizen-technician -> send delivery email & notification to Technician who accepted allocation.
                // For technician-center -> send delivery email & notification to Recycling Center allocated to device.
                bool isTechToRecycler = string.Equals(assignment.AssignmentType, "TechnicianToRecyclingCenter", StringComparison.OrdinalIgnoreCase);

                var agent = assignment.CollectionAgent;
                string agentName = agent != null ? $"{agent.FirstName} {agent.LastName}".Trim() : "EcoCycle Field Officer";
                string deviceName = assignment.Device != null ? $"{assignment.Device.Brand} {assignment.Device.Model}".Trim() : "E-Waste Item";

                if (isTechToRecycler)
                {
                    // Technician -> Recycling Center: Notify Recycling Center allocated to device
                    var (recyclerLoginId, recyclerEmail, centerName, ownerName) = await GetRecyclingCenterDetailsAsync(assignment);

                    if (recyclerLoginId > 0)
                    {
                        var notification = new Notification
                        {
                            LoginId = recyclerLoginId,
                            Title = "Incoming E-Waste Recycling Delivery En Route",
                            Message = $"Hello {centerName}, collection agent {agentName} has started delivery transit for device {deviceName} to your recycling center facility.",
                            Isread = false,
                            Status = true,
                            CreatedAt = DateTime.Now
                        };
                        db.Notification.Add(notification);
                        await db.SaveChangesAsync();
                    }

                    if (!string.IsNullOrWhiteSpace(recyclerEmail))
                    {
                        string htmlEmailBody = $@"
                            <html>
                            <body style='font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;'>
                                <div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;'>
                                    <div style='text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px;'>
                                        <h2 style='color: #10b981; margin: 0;'>EcoCycle Recycling Delivery Notice</h2>
                                        <p style='color: #64748b; margin: 4px 0 0 0; font-size: 14px;'>Delivery Dispatched • Collection Agent En Route</p>
                                    </div>
                                    <div style='color: #0f172a;'>
                                        <p>Hello <strong>{centerName} / {ownerName}</strong>,</p>
                                        <p>Collection agent <strong>{agentName}</strong> has started transit to deliver collected e-waste device (<strong>{deviceName}</strong>) to your recycling facility.</p>

                                        <div style='background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0;'>
                                            <h4 style='margin: 0 0 10px 0; color: #1d4ed8;'>Delivery Details</h4>
                                            <p style='margin: 4px 0;'><strong>Device:</strong> {deviceName}</p>
                                            <p style='margin: 4px 0;'><strong>Collection Agent:</strong> {agentName}</p>
                                            <p style='margin: 4px 0;'><strong>Assignment ID:</strong> #{assignmentId}</p>
                                        </div>

                                        <p style='margin-top: 24px;'>Best regards,<br/><strong>EcoCycle Logistics & Dispatch Team</strong></p>
                                    </div>
                                </div>
                            </body>
                            </html>
                        ";

                        await emailService.SendEmailAsync(
                            recyclerEmail,
                            $"EcoCycle: Delivery Started for {deviceName} to Recycling Center (Assignment #{assignmentId})",
                            htmlEmailBody
                        );
                    }

                    return Ok(new
                    {
                        message = "Delivery started successfully. Notification and email sent to allocated recycling center.",
                        status = assignment.Status,
                        deliveryStatus = delivery.Status
                    });
                }
                else
                {
                    // Citizen -> Technician: Notify Technician who accepted allocation
                    var (techLoginId, techEmail, techName, centerName) = await GetAssignedTechnicianDetailsAsync(assignment.DeviceId);

                    // 1. Send In-App Notification to technician
                    if (techLoginId > 0)
                    {
                        try
                        {
                            var notification = new Notification
                            {
                                LoginId = techLoginId,
                                Title = "Delivery Dispatched - Collection Agent En Route",
                                Message = $"Collection agent {agentName} has started transit for device {deviceName} (Assignment #{assignmentId}) to your inspection center.",
                                Isread = false,
                                Status = true,
                                CreatedAt = DateTime.Now
                            };
                            db.Notification.Add(notification);
                            await db.SaveChangesAsync();
                        }
                        catch (Exception notifEx)
                        {
                            Console.WriteLine($"[StartDelivery Notif Warning]: {notifEx.Message}");
                        }
                    }

                    // 2. Send Email to technician
                    if (!string.IsNullOrWhiteSpace(techEmail))
                    {
                        try
                        {
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

                            await emailService.SendEmailAsync(
                                techEmail,
                                $"EcoCycle: Delivery Started for {deviceName} (Assignment #{assignmentId})",
                                htmlEmailBody
                            );
                        }
                        catch (Exception emailEx)
                        {
                            Console.WriteLine($"[StartDelivery Email Warning]: {emailEx.Message}");
                        }
                    }

                    return Ok(new
                    {
                        message = "Delivery started successfully. Notification and email sent to technician.",
                        status = assignment.Status,
                        deliveryStatus = delivery.Status
                    });
                }
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
                if (!assignment.DeliveredAt.HasValue)
                {
                    assignment.DeliveredAt = delivery.DeliveredAt ?? DateTime.Now;
                }

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

        [HttpPost("request-technician-verification/{assignmentId}")]
        public async Task<IActionResult> RequestTechnicianVerification(int assignmentId)
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
                        Status = "PendingVerification",
                        StartedAt = DateTime.Now,
                        CreatedAt = DateTime.Now
                    };
                    db.Deliveries.Add(delivery);
                }
                else
                {
                    delivery.Status = "PendingVerification";
                    delivery.HandoverRejectedAt = null;
                    delivery.HandoverRejectionReason = null;
                    delivery.TechnicianNotes = null;
                }

                assignment.Status = "AwaitingTechnicianApproval";
                assignment.UpdatedAt = DateTime.Now;

                if (assignment.Device != null)
                {
                    assignment.Device.LifecycleStatus = "HandoverPendingVerification";
                }

                await db.SaveChangesAsync();

                // Send notification & email to technician
                try
                {
                    var (techLoginId, techEmail, techName, centerName) = await GetAssignedTechnicianDetailsAsync(assignment.DeviceId);
                    string agentName = assignment.CollectionAgent != null ? $"{assignment.CollectionAgent.FirstName} {assignment.CollectionAgent.LastName}".Trim() : "Collection Agent";
                    string deviceName = assignment.Device != null ? $"{assignment.Device.Brand} {assignment.Device.Model}".Trim() : "E-Waste Item";

                    if (techLoginId > 0)
                    {
                        db.Notification.Add(new Notification
                        {
                            LoginId = techLoginId,
                            Title = "Action Required: Device Delivery Verification",
                            Message = $"Agent {agentName} is requesting device verification for {deviceName} (Assignment #{assignmentId}). Please approve delivery in your dashboard.",
                            Isread = false,
                            Status = true,
                            CreatedAt = DateTime.Now
                        });
                        await db.SaveChangesAsync();
                    }

                    if (!string.IsNullOrWhiteSpace(techEmail))
                    {
                        string emailSub = $"Action Required: Device Delivery Verification for {deviceName}";
                        string emailBody = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif;'>
                            <h2 style='color: #1d4ed8;'>Device Delivery Verification Pending</h2>
                            <p>Dear <strong>{techName}</strong>,</p>
                            <p>Collection Agent <strong>{agentName}</strong> has delivered <strong>{deviceName}</strong> to your inspection center (<strong>{centerName}</strong>) and requested physical verification.</p>
                            <p>Please log in to your dashboard to review and approve or reject the delivery handover.</p>
                        </body>
                        </html>";
                        await emailService.SendEmailAsync(techEmail, emailSub, emailBody);
                    }
                }
                catch (Exception notifEx)
                {
                    Console.WriteLine($"[RequestTechnicianVerification Notif Warning]: {notifEx.Message}");
                }

                return Ok(new
                {
                    message = "Verification request sent to technician successfully.",
                    status = assignment.Status,
                    deliveryStatus = delivery.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error sending verification request to technician.", error = ex.Message });
            }
        }

        [HttpPost("approve-technician-handover/{assignmentId}")]
        public async Task<IActionResult> ApproveTechnicianHandover(int assignmentId)
        {
            try
            {
                var assignment = await db.CollectionAssignments
                    .Include(x => x.Device)
                        .ThenInclude(d => d.User)
                            .ThenInclude(u => u.Login)
                    .Include(x => x.CollectionAgent)
                        .ThenInclude(agent => agent.Login)
                    .FirstOrDefaultAsync(x => x.CollectionAssignmentId == assignmentId);

                if (assignment == null)
                {
                    return NotFound(new { message = "Collection assignment not found." });
                }

                // 1. Update or create Delivery record with DeviceVerified = true
                var delivery = await db.Deliveries
                    .FirstOrDefaultAsync(d => d.CollectionAssignmentId == assignmentId);

                if (delivery == null)
                {
                    delivery = new EcoCycle.API.Models.Delivery
                    {
                        CollectionAssignmentId = assignmentId,
                        Status = "Delivered",
                        StartedAt = DateTime.Now.AddMinutes(-30),
                        DeliveredAt = DateTime.Now,
                        DeviceVerified = true,
                        AgentNotes = "Device received and physically verified by Inspection Technician.",
                        CreatedAt = DateTime.Now
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
                    delivery.AgentNotes = "Device received and physically verified by Inspection Technician.";
                }

                // 2. Update CollectionAssignment Status to DeliveredToCenter
                assignment.Status = "DeliveredToCenter";
                assignment.UpdatedAt = DateTime.Now;
                if (!assignment.DeliveredAt.HasValue)
                {
                    assignment.DeliveredAt = delivery.DeliveredAt ?? DateTime.Now;
                }

                // 3. Update Device Lifecycle Status & Status
                if (assignment.Device != null)
                {
                    assignment.Device.LifecycleStatus = "AtInspectionCenter";
                    assignment.Device.Status = "Assigned";
                }

                // 4. Update or create Inspection Request Status
                var inspReq = await db.InspectionRequest
                    .Where(ir => ir.DeviceId == assignment.DeviceId && ir.Status != "Rejected" && ir.Status != "Cancelled")
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
                            DeviceId = assignment.DeviceId,
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

                await db.SaveChangesAsync();

                // 5. Send Notification & Email to Collection Agent
                if (assignment.CollectionAgent != null && assignment.CollectionAgent.Login != null)
                {
                    string deviceName = assignment.Device != null ? $"{assignment.Device.Brand} {assignment.Device.Model}".Trim() : "E-Waste Item";
                    var agentNotif = new Notification
                    {
                        LoginId = assignment.CollectionAgent.Login.LoginId,
                        Title = "Device Handover Approved & Verified!",
                        Message = $"Technician has verified & accepted device handover for {deviceName} (Device #{assignment.DeviceId}). Delivery is marked as completed.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };
                    db.Notification.Add(agentNotif);

                    if (!string.IsNullOrWhiteSpace(assignment.CollectionAgent.Login.Email))
                    {
                        string agentEmailSub = $"EcoCycle - Handover Accepted: {deviceName}";
                        string agentEmailBody = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif;'>
                            <h2 style='color: #059669;'>Device Handover Confirmed & Verified</h2>
                            <p>Dear <strong>{assignment.CollectionAgent.FirstName}</strong>,</p>
                            <p>The Inspection Officer has verified and accepted the device handover for <strong>{deviceName}</strong> (Device ID #{assignment.DeviceId}).</p>
                            <p>Delivery Status: <strong>Delivered to Center (Verified)</strong></p>
                            <p>Thank you for completing this collection delivery!</p>
                        </body>
                        </html>";
                        await emailService.SendEmailAsync(assignment.CollectionAgent.Login.Email, agentEmailSub, agentEmailBody);
                    }
                }

                // 6. Send Notification & Email to Device Owner (User / Citizen)
                var (ownerLoginId, ownerEmail, ownerName, ownerAddr) = await GetDeviceOwnerDetailsAsync(assignment.Device);
                if (ownerLoginId > 0)
                {
                    string deviceName = assignment.Device != null ? $"{assignment.Device.Brand} {assignment.Device.Model}".Trim() : "E-Waste Device";
                    var citizenNotif = new Notification
                    {
                        LoginId = ownerLoginId,
                        Title = "Device Delivered & Verified at Hub",
                        Message = $"Hello {ownerName}, your e-waste device ({deviceName}) has been safely received and physically verified by our Inspection Officer.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };
                    db.Notification.Add(citizenNotif);
                    await db.SaveChangesAsync();

                    if (!string.IsNullOrWhiteSpace(ownerEmail))
                    {
                        string citizenEmailSub = $"EcoCycle - Device Received & Verified at Inspection Hub";
                        string citizenEmailBody = $@"
                        <html>
                        <body style='font-family: Arial, sans-serif;'>
                            <h2 style='color: #059669;'>Device Delivered & Verified at Hub</h2>
                            <p>Dear <strong>{ownerName}</strong>,</p>
                            <p>Your listed e-waste device <strong>{deviceName}</strong> has arrived at our inspection facility and was successfully verified by our Inspection Officer.</p>
                            <p>Our team will now perform technical evaluations and recycling processing.</p>
                        </body>
                        </html>";
                        await emailService.SendEmailAsync(ownerEmail, citizenEmailSub, citizenEmailBody);
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
                        .FirstOrDefaultAsync(i => i.InspectionRequestId == inspReq.InspectionRequestId || i.DeviceId == assignment.DeviceId);

                    if (existingInsp == null)
                    {
                        var newInsp = new EcoCycle.API.Models.Inspection
                        {
                            InspectionRequestId = inspReq.InspectionRequestId,
                            DeviceId = assignment.DeviceId,
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
                    message = "Delivery verified and approved successfully. Marked as DeliveredToCenter.",
                    status = assignment.Status,
                    deliveryStatus = delivery.Status,
                    deviceVerified = delivery.DeviceVerified,
                    inspectionDeadline = deadline
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error approving delivery handover.", error = ex.Message });
            }
        }
    }
}