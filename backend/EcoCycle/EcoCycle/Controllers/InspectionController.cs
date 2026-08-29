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
                        InspectionDeadline = DateTime.Now.AddDays(3),
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

                    request = existingRequest;
                    request.TechnicianId = technician.TechnicianId;
                    request.Status = "Assigned";
                    request.AssignedAt = DateTime.Now;
                    request.ResponseDeadline = DateTime.Now.AddHours(24);
                    request.InspectionDeadline = DateTime.Now.AddDays(3);
                    request.UpdatedAt = DateTime.Now;
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
                    request.InspectionDeadline = DateTime.Now.AddDays(3);
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
                        <strong>Inspection Deadline:</strong>
                        {request.InspectionDeadline:dd-MM-yyyy hh:mm tt}
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

            var technicians = await db.Technician
                .Include(t => t.Login)
                .Where(t => t.Status == "Active")
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
        private async Task CheckAndUpdateExpiredInspectionRequests()
        {
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

        [HttpGet("technicain/{technicianId}")]
        public async Task<IActionResult> GetTechnicianRequests(
            int technicianId)
        {
            await CheckAndUpdateExpiredInspectionRequests();

            var tech = await db.Technician
                .FirstOrDefaultAsync(
                    t => t.TechnicianId == technicianId ||
                         t.LoginId == technicianId);

            int targetTechId =
                tech != null
                    ? tech.TechnicianId
                    : technicianId;


            var requests = await db.InspectionRequest

                .Include(x => x.Device)
                    .ThenInclude(d => d.Category)

                .Include(x => x.Device)
                    .ThenInclude(d => d.User)

                .Where(x =>
                    x.TechnicianId == targetTechId &&

                    x.Device.Status != "Inactive" &&
                    x.Device.Status != "Deleted" &&

                    (
                        x.Status == "Assigned" ||
                        x.Status == "Accepted" ||
                        x.Status == "InProgress"
                    ))

                .OrderBy(x => x.InspectionDeadline)

                .ToListAsync();


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
                var loginIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
                if (loginIdClaim == null)
                {
                    return Unauthorized(new { message = "User identity not found." });
                }

                if (!int.TryParse(loginIdClaim.Value, out int loginId))
                {
                    return Unauthorized(new { message = "Invalid user identity." });
                }

                var tech = await db.Technician
                    .Include(t => t.Login)
                    .FirstOrDefaultAsync(t => t.LoginId == loginId || t.TechnicianId == loginId);

                if (tech == null)
                {
                    return NotFound(new { message = "Technician account not found." });
                }

                int targetTechId = tech.TechnicianId;

                // Find inspection requests assigned to this technician
                var inspRequests = await db.InspectionRequest
                    .Include(x => x.Device)
                        .ThenInclude(d => d.Category)
                    .Include(x => x.Device)
                        .ThenInclude(d => d.User)
                    .Include(x => x.Device)
                        .ThenInclude(d => d.CollectionAssignments)
                            .ThenInclude(ca => ca.CollectionAgent)
                    .Where(x => x.TechnicianId == targetTechId && x.Device.Status != "Inactive" && x.Device.Status != "Deleted")
                    .OrderByDescending(x => x.CreatedAt)
                    .ToListAsync();

                var result = new List<object>();
                foreach (var x in inspRequests)
                {
                    var dev = x.Device;
                    if (dev == null) continue;

                    var latestCa = dev.CollectionAssignments.OrderByDescending(ca => ca.CreatedAt).FirstOrDefault();

                    Delivery? delObj = null;
                    if (latestCa != null)
                    {
                        try
                        {
                            delObj = await db.Deliveries.FirstOrDefaultAsync(d => d.CollectionAssignmentId == latestCa.CollectionAssignmentId);
                        }
                        catch { }
                    }

                    string caStatus = latestCa?.Status ?? "Scheduled";
                    string delStatus = delObj != null ? delObj.Status : (caStatus == "Completed" ? "Pending" : caStatus == "OutForDelivery" ? "InTransit" : caStatus == "DeliveredToCenter" ? "Delivered" : "Pending");

                    result.Add(new
                    {
                        deviceId = dev.DeviceId,
                        inspectionRequestId = x.InspectionRequestId,
                        collectionAssignmentId = latestCa?.CollectionAssignmentId,

                        brand = dev.Brand,
                        model = dev.Model,
                        categoryName = dev.Category?.CategoryName ?? "E-Waste",
                        quantity = dev.Quantity,
                        weight = dev.Weight,
                        condition = dev.Condition,
                        working = dev.Working,
                        processingPreference = dev.ProcessingPreference,

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
                        lifecycleStatus = dev.LifecycleStatus,
                        requestStatus = x.Status,

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
                        createdAt = dev.CreatedAt
                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving technician deliveries.", error = ex.Message });
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

                request.RespondedAt =
                    DateTime.Now;

                request.UpdatedAt =
                    DateTime.Now;

                var existingAssignment =
                    await db.CollectionAssignments
                    .FirstOrDefaultAsync(
                        x => x.DeviceId == request.DeviceId && x.Status != "Rejected" && x.Status != "Cancelled"
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
            <a href=""https://localhost:7102"" style=""background: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 8px; display: inline-block;"">[ Start Pickup ]</a>
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
                        InspectionDeadline = null,
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
                    InspectionDeadline = DateTime.Now.AddDays(3),
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
        <strong>Inspection Deadline:</strong>
        {newRequest.InspectionDeadline:dd-MM-yyyy hh:mm tt}
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
            // =========================================================

            var technicians = await db.Technician
                .Include(t => t.Login)
                .Where(t => (t.Status == "Active" || t.Status == "Approved") &&
                            t.TechnicianId != excludedTechnicianId &&
                            !rejectedTechIds.Contains(t.TechnicianId) &&
                            !rejectedLoginIds.Contains(t.LoginId))
                .ToListAsync();

            if (!technicians.Any())
            {
                // Fallback: any active/approved technician if all non-rejected ones are excluded
                technicians = await db.Technician
                    .Include(t => t.Login)
                    .Where(t => t.Status == "Active" || t.Status == "Approved")
                    .ToListAsync();
            }

            if (!technicians.Any())
            {
                // Ultimate fallback: any technician in system
                technicians = await db.Technician
                    .Include(t => t.Login)
                    .ToListAsync();
            }

            if (!technicians.Any())
            {
                Console.WriteLine("NO TECHNICIANS IN DATABASE");
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

            var assignments = await db.InspectionRequest
                .Include(x => x.Device)
                    .ThenInclude(d => d.Category)
                .Include(x => x.Device)
                    .ThenInclude(d => d.User)
                .Include(x => x.Technician)
                    .ThenInclude(t => t.Login)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new
                {
                    inspectionRequestId = x.InspectionRequestId,

                    deviceId = x.DeviceId,
                    brand = x.Device.Brand,
                    model = x.Device.Model,
                    category = x.Device.Category.CategoryName,

                    userName = x.Device.User.FirstName+" "+x.Device.User.LastName,

                    technicianId = x.TechnicianId,
                    technicianName = x.Technician != null
                        ? x.Technician.FirstName + " " + x.Technician.LastName
                        : null,

                    technicianEmail = x.Technician != null
                        ? x.Technician.Login.Email
                        : null,

                    status = x.Status,

                    assignedAt = x.AssignedAt,
                    responseDeadline = x.ResponseDeadline,
                    inspectionDeadline = x.InspectionDeadline,

                    rejectionReason = x.RejectionReason,
                    reassignmentCount = x.ReassignmentCount,

                    lifecycleStatus = x.Device.LifecycleStatus
                })
                .ToListAsync();

            return Ok(assignments);
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

                // Update LifecycleStatus in DB for devices whose scheduled pickup date has passed
                bool hasUpdates = false;
                var today = DateTime.Today;
                foreach (var d in devices)
                {
                    var latestCa = d.CollectionAssignments.OrderByDescending(ca => ca.CreatedAt).FirstOrDefault();
                    string caStatus = latestCa?.Status?.ToLower() ?? "";
                    bool isDone = caStatus == "completed" || caStatus == "delivered" || caStatus == "pickedup";

                    if (!isDone && d.LifecycleStatus != "PickupCancelled" && d.LifecycleStatus != "DueDatePassed")
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
                    var latestAssignment = d.CollectionAssignments.OrderByDescending(ca => ca.CreatedAt).FirstOrDefault();

                    bool isAgentAccepted = latestAssignment != null && (
                        string.Equals(latestAssignment.Status, "Accepted", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(latestAssignment.Status, "Completed", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(latestAssignment.Status, "PickedUp", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(latestAssignment.Status, "InTransit", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(latestAssignment.Status, "Delivered", StringComparison.OrdinalIgnoreCase)
                    );

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
                        technicianName = latestInsp?.Technician != null ? $"{latestInsp.Technician.FirstName} {latestInsp.Technician.LastName}" : "Pending Assignment",
                        technicianPhone = latestInsp?.Technician?.PhoneNumber,
                        collectionAgentAccepted = isAgentAccepted,
                        collectionAssignmentStatus = latestAssignment != null ? latestAssignment.Status : null,
                        collectionAgentName = latestAssignment?.CollectionAgent != null ? $"{latestAssignment.CollectionAgent.FirstName} {latestAssignment.CollectionAgent.LastName}" : null,
                        collectionAgentPhone = latestAssignment?.CollectionAgent != null ? (latestAssignment.CollectionAgent.Phone ?? latestAssignment.CollectionAgent.AlternatePhone) : null,
                        collectionAgentAltPhone = latestAssignment?.CollectionAgent?.AlternatePhone,
                        collectionAgentPhoto = latestAssignment?.CollectionAgent?.ProfilePicture,
                        vehicleNumber = latestAssignment?.CollectionAgent?.VehicleNumber,
                        vehicleType = latestAssignment?.CollectionAgent?.VehicleType,
                        deviceQrToken = !string.IsNullOrEmpty(d.DeviceQrToken) ? d.DeviceQrToken : $"ECOQR-DEV-{d.DeviceId}",
                        acceptedAt = latestAssignment?.AcceptedAt,
                        pickedUpAt = latestAssignment?.PickedUpAt,
                        deliveredAt = latestAssignment?.DeliveredAt
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
                technician = await db.Technician
                    .Include(t => t.Login)
                    .Where(t => t.Status == "Active")
                    .OrderBy(t => db.InspectionRequest.Count(ir => ir.TechnicianId == t.TechnicianId && (ir.Status == "Assigned" || ir.Status == "Accepted" || ir.Status == "InProgress")))
                    .FirstOrDefaultAsync();

                if (technician == null)
                {
                    return BadRequest(new { message = "No active technician available for manual allocation." });
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

            return await AssignTechnicianToDevice(device, technician);
        }

        private async Task<IActionResult> AssignTechnicianToDevice(Device device, Technician technician)
        {
            var existingRequest = await db.InspectionRequest
                .Where(x => x.DeviceId == device.DeviceId && x.Status != "Rejected" && x.Status != "Cancelled")
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            InspectionRequest request;
            if (existingRequest != null)
            {
                bool isExpired = string.Equals(existingRequest.Status, "Expired", StringComparison.OrdinalIgnoreCase) ||
                                 (existingRequest.ResponseDeadline.HasValue && existingRequest.ResponseDeadline.Value < DateTime.Now);

                if (isExpired)
                {
                    existingRequest.Status = "Expired";
                    existingRequest.UpdatedAt = DateTime.Now;

                    request = new InspectionRequest
                    {
                        DeviceId = device.DeviceId,
                        TechnicianId = technician.TechnicianId,
                        Status = "Assigned",
                        AssignedAt = DateTime.Now,
                        ResponseDeadline = DateTime.Now.AddHours(24),
                        InspectionDeadline = DateTime.Now.AddDays(3),
                        ReassignmentCount = existingRequest.ReassignmentCount + 1,
                        CreatedAt = DateTime.Now,
                        UpdatedAt = DateTime.Now
                    };
                    db.InspectionRequest.Add(request);
                }
                else
                {
                    request = existingRequest;
                    request.TechnicianId = technician.TechnicianId;
                    request.Status = "Assigned";
                    request.AssignedAt = DateTime.Now;
                    request.ResponseDeadline = DateTime.Now.AddHours(24);
                    request.InspectionDeadline = DateTime.Now.AddDays(3);
                    request.UpdatedAt = DateTime.Now;
                }
            }
            else
            {
                request = new InspectionRequest
                {
                    DeviceId = device.DeviceId,
                    TechnicianId = technician.TechnicianId,
                    Status = "Assigned",
                    AssignedAt = DateTime.Now,
                    ResponseDeadline = DateTime.Now.AddHours(24),
                    InspectionDeadline = DateTime.Now.AddDays(3),
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };
                db.InspectionRequest.Add(request);
            }

            device.LifecycleStatus = "InspectionAssigned";
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
    }
}