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

        [HttpPost("auto-allocate/{deviceId}")]
        public async Task<IActionResult> AutoAllocate(int deviceId)
        {
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
                        .FirstOrDefaultAsync(x =>
                            x.DeviceId == deviceId &&
                            x.Status != "Rejected"
                        );

                CollectionAgent? agent = null;
                CollectionAssignment assignment;

                // =========================================================
                // EXISTING ASSIGNMENT
                // =========================================================

                if (existingAssignment != null)
                {
                    // -----------------------------------------------------
                    // EXISTING WAITING ASSIGNMENT
                    // -----------------------------------------------------

                    if (existingAssignment.Status == "Waiting")
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

                    assignment = new CollectionAssignment
                    {
                        DeviceId =
                            deviceId,

                        CollectionAgentId =
                            agent?.CollectionAgentId,

                        Status =
                            agent != null
                                ? "Assigned"
                                : "Waiting",

                        AssignedAt =
                            agent != null
                                ? DateTime.Now
                                : null,

                        CreatedAt =
                            DateTime.Now,

                        UpdatedAt =
                            DateTime.Now
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

                // =========================================================
                // INSERT NOTIFICATION WHEN AGENT IS ACTUALLY ASSIGNED
                // =========================================================

                if (agent != null)
                {
                    if (agent.LoginId > 0)
                    {
                        var notification = new Notification
                        {
                            LoginId =agent.LoginId,

                            Title ="New Pickup Request Assigned",

                            Message =$"A new pickup request for {device.Brand} {device.Model} has been assigned to you.",

                            Isread =
                                false,

                            Status =
                                true,

                            CreatedAt =
                                DateTime.Now
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

                if (agent != null &&
                    agent.Login != null &&
                    !string.IsNullOrWhiteSpace(agent.Login.Email))
                {
                    string fullAddress =
                        device.Address +
                        (string.IsNullOrWhiteSpace(device.User?.City)
                            ? ""
                            : $", {device.User.City}") +
                        (string.IsNullOrWhiteSpace(device.User?.District)
                            ? ""
                            : $", {device.User.District}") +
                        (string.IsNullOrWhiteSpace(device.User?.State)
                            ? ""
                            : $", {device.User.State}") +
                        (string.IsNullOrWhiteSpace(device.User?.Pincode)
                            ? ""
                            : $" - {device.User.Pincode}");

                    string subject =
                        "EcoCycle - New Collection Pickup Request Assigned";

                    string body = $@"
<html>
<body>

<h2>New Collection Pickup Request Assigned</h2>

<p>
Dear {agent.FirstName} {agent.LastName},
</p>

<p>
A new e-waste collection pickup request has been assigned to you.
</p>

<h3>Pickup & Device Details</h3>

<p>
<strong>Assignment ID:</strong>
{assignment.CollectionAssignmentId}
</p>

<p>
<strong>Device ID:</strong>
{device.DeviceId}
</p>

<p>
<strong>Category:</strong>
{device.Category?.CategoryName ?? "E-Waste"}
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
<strong>Quantity:</strong>
{device.Quantity}
</p>

<p>
<strong>Condition:</strong>
{device.Condition}
</p>

<h3>Customer & Location Information</h3>

<p>
<strong>Customer:</strong>
{device.User?.FirstName} {device.User?.LastName}
</p>

<p>
<strong>Phone:</strong>
{device.User?.PhoneNumber}
</p>

<p>
<strong>Pickup Address:</strong>
{fullAddress}
</p>

<p>
<strong>Landmark:</strong>
{device.Landmark ?? "N/A"}
</p>

<p>
<strong>Pickup Date:</strong>
{device.PickupDate:dd-MM-yyyy}
</p>

<p>
<strong>Time Slot:</strong>
{device.TimeSlot}
</p>

<p>
Please log in to your EcoCycle collection agent account
and respond to this pickup request.
</p>

<br />

<p>
Regards,<br />
<strong>EcoCycle Admin Team</strong>
</p>

</body>
</html>";

                    await SendEmailAsync(
                        agent.Login.Email,
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
                var assignments = await db.CollectionAssignments
                    .Include(x => x.Device)
                        .ThenInclude(d => d.Category)
                    .Include(x => x.Device)
                        .ThenInclude(d => d.User)
                    .Where(x =>
                        x.CollectionAgentId == agent.CollectionAgentId &&
                        x.Device.Status != "Inactive" &&
                        x.Device.Status != "Deleted" &&
                        (
                            x.Status == "Assigned" ||
                            x.Status == "Accepted" ||
                            x.Status == "PickupStarted"
                        )
                    )
                    .OrderBy(x => x.Device.PickupDate)
                    .Select(x => new
                    {
                        collectionAssignmentId = x.CollectionAssignmentId,
                        deviceId = x.DeviceId,
                        collectionAgentId = x.CollectionAgentId,
                        status = x.Status,
                        rejectionReason = x.RejectionReason,
                        assignedAt = x.AssignedAt,
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
                        lifecycleStatus = x.Device.LifecycleStatus
                    })
                    .ToListAsync();

                return Ok(assignments);
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
            try
            {
                var assignment = await db.CollectionAssignments
                    .FirstOrDefaultAsync(x => x.CollectionAssignmentId == assignmentId);

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
                        message = "This request cannot be accepted."
                    });
                }

                assignment.Status = "Accepted";
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

                var newAssignment = new CollectionAssignment
                {
                    DeviceId = assignment.DeviceId,

                    CollectionAgentId =
                        newAgent.CollectionAgentId,

                    Status = "Assigned",

                    AssignedAt = DateTime.Now,

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

                // =========================================================
                // 6. SEND EMAIL TO NEW AGENT
                // =========================================================

                if (newAgent.Login != null &&
                    !string.IsNullOrWhiteSpace(newAgent.Login.Email))
                {
                    string fullAddress =
                        assignment.Device.Address +
                        (string.IsNullOrWhiteSpace(assignment.Device.User?.City)
                            ? ""
                            : $", {assignment.Device.User.City}") +
                        (string.IsNullOrWhiteSpace(assignment.Device.User?.District)
                            ? ""
                            : $", {assignment.Device.User.District}") +
                        (string.IsNullOrWhiteSpace(assignment.Device.User?.State)
                            ? ""
                            : $", {assignment.Device.User.State}") +
                        (string.IsNullOrWhiteSpace(assignment.Device.User?.Pincode)
                            ? ""
                            : $" - {assignment.Device.User.Pincode}");

                    string subject =
                        "EcoCycle - Collection Pickup Request Reassigned";

                    string body = $@"
<html>
<body>

<h2>Collection Pickup Request Reassigned</h2>

<p>
Dear {newAgent.FirstName} {newAgent.LastName},
</p>

<p>
A collection pickup request has been automatically reassigned to you
because the previous collection agent rejected the request.
</p>

<h3>Pickup & Device Details</h3>

<p>
<strong>Assignment ID:</strong>
{newAssignment.CollectionAssignmentId}
</p>

<p>
<strong>Device ID:</strong>
{assignment.DeviceId}
</p>

<p>
<strong>Category:</strong>
{assignment.Device.Category?.CategoryName ?? "E-Waste"}
</p>

<p>
<strong>Brand:</strong>
{assignment.Device.Brand}
</p>

<p>
<strong>Model:</strong>
{assignment.Device.Model}
</p>

<p>
<strong>Quantity:</strong>
{assignment.Device.Quantity}
</p>

<p>
<strong>Condition:</strong>
{assignment.Device.Condition}
</p>

<h3>Customer & Location</h3>

<p>
<strong>Customer:</strong>
{assignment.Device.User?.FirstName}
{assignment.Device.User?.LastName}
</p>

<p>
<strong>Phone:</strong>
{assignment.Device.User?.PhoneNumber}
</p>

<p>
<strong>Pickup Address:</strong>
{fullAddress}
</p>

<p>
<strong>Landmark:</strong>
{assignment.Device.Landmark ?? "N/A"}
</p>

<p>
<strong>Pickup Date:</strong>
{assignment.Device.PickupDate:dd-MM-yyyy}
</p>

<p>
<strong>Time Slot:</strong>
{assignment.Device.TimeSlot}
</p>

<p>
Please log in to your EcoCycle collection agent account
and respond to this pickup request.
</p>

<br />

<p>
Regards,<br />
<strong>EcoCycle Admin Team</strong>
</p>

</body>
</html>";

                    await SendEmailAsync(
                        newAgent.Login.Email,
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
            try
            {
                var assignments = await db.CollectionAssignments
                    .Include(x => x.Device)
                        .ThenInclude(d => d.Category)
                    .Include(x => x.Device)
                        .ThenInclude(d => d.User)
                    .Include(x => x.CollectionAgent)
                        .ThenInclude(a => a.Login)
                    .OrderByDescending(x => x.CreatedAt)
                    .Select(x => new
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
                        status = x.Status,
                        assignedAt = x.AssignedAt,
                        acceptedAt = x.AcceptedAt,
                        pickupStartedAt = x.PickupStartedAt,
                        pickedUpAt = x.PickedUpAt,
                        deliveredAt = x.DeliveredAt,
                        rejectionReason = x.RejectionReason,
                        createdAt = x.CreatedAt,
                        pickupDate = x.Device.PickupDate,
                        timeSlot = x.Device.TimeSlot,
                        pickupInstructions = x.Device.PickupInstructions,
                        lifecycleStatus = x.Device.LifecycleStatus
                    })
                    .ToListAsync();

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

                assignment.CollectionAgentId =
                    agent.CollectionAgentId;

                assignment.Status =
                    "Assigned";

                assignment.AssignedAt =
                    DateTime.Now;

                assignment.UpdatedAt =
                    DateTime.Now;

                assignment.RejectionReason =
                    null;

                // Update device lifecycle status
                assignment.Device.LifecycleStatus =
                    "CollectionAssigned";

                await db.SaveChangesAsync();

                if (agent != null && agent.LoginId > 0)
                {
                    var notification = new Notification
                    {
                        LoginId = agent.LoginId,
                        Title = "New Pickup Request Assigned",
                        Message = $"A new pickup request for {assignment.Device.Brand} {assignment.Device.Model} has been assigned to you.",
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

                if (agent.Login != null &&
                    !string.IsNullOrWhiteSpace(agent.Login.Email))
                {
                    var device = assignment.Device;

                    string fullAddress =
                        device.Address +
                        (string.IsNullOrWhiteSpace(device.User?.City)
                            ? ""
                            : $", {device.User.City}") +
                        (string.IsNullOrWhiteSpace(device.User?.District)
                            ? ""
                            : $", {device.User.District}") +
                        (string.IsNullOrWhiteSpace(device.User?.State)
                            ? ""
                            : $", {device.User.State}") +
                        (string.IsNullOrWhiteSpace(device.User?.Pincode)
                            ? ""
                            : $" - {device.User.Pincode}");

                    string subject =
                        "EcoCycle - Collection Pickup Request Assigned";

                    string body = $@"
<html>
<body style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>

<h2 style='color: #059669;'>
    New Collection Request Assigned
</h2>

<p>
Dear {agent.FirstName} {agent.LastName},
</p>

<p>
A collection pickup request has been manually assigned to you
by the EcoCycle Admin.
</p>

<h3>Pickup & Device Details</h3>

<p>
<strong>Assignment ID:</strong>
{assignment.CollectionAssignmentId}
</p>

<p>
<strong>Device ID:</strong>
{device.DeviceId}
</p>

<p>
<strong>Category:</strong>
{device.Category?.CategoryName ?? "E-Waste"}
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
<strong>Quantity:</strong>
{device.Quantity}
</p>

<p>
<strong>Condition:</strong>
{device.Condition}
</p>

<h3>Customer & Location Information</h3>

<p>
<strong>Customer:</strong>
{device.User?.FirstName} {device.User?.LastName}
</p>

<p>
<strong>Phone:</strong>
{device.User?.PhoneNumber}
</p>

<p>
<strong>Pickup Address:</strong>
{fullAddress}
</p>

<p>
<strong>Landmark:</strong>
{device.Landmark ?? "N/A"}
</p>

<p>
<strong>Pickup Date:</strong>
{device.PickupDate:dd-MM-yyyy}
</p>

<p>
<strong>Time Slot:</strong>
{device.TimeSlot ?? "Standard Slot"}
</p>

<br />

<p>
Please log in to your EcoCycle collection agent account
and respond to this pickup request.
</p>

<br />

<p>
Regards,<br />
<strong>EcoCycle Admin Team</strong>
</p>

</body>
</html>";

                    await SendEmailAsync(
                        agent.Login.Email,
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