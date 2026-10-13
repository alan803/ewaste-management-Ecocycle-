using EcoCycle.API.Data;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace EcoCycle.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class Notificationcon : ControllerBase
    {
        private readonly ApplicationDbContext db;
        private readonly IWebHostEnvironment env;
        private readonly ILogger<Notificationcon> logger;

        public Notificationcon(ApplicationDbContext db, IWebHostEnvironment env, ILogger<Notificationcon> logger)
        {
            this.db = db;
            this.env = env;
            this.logger = logger;
        }

        private int GetCurrentLoginId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)
                ?? User.FindFirst("sub")
                ?? User.FindFirst("nameid");

            if (claim != null && int.TryParse(claim.Value, out int id))
            {
                return id;
            }
            return 0;
        }

        [HttpGet("my_notifications")]
        [Authorize]
        public async Task<IActionResult> GetMyNotifications()
        {
            int loginId = 0;
            try
            {
                loginId = GetCurrentLoginId();
                if (loginId == 0)
                {
                    return Unauthorized(new { message = "Invalid login session." });
                }

                // Auto-check and persist Overdue Pickup notifications for Citizens ONLY
                try
                {
                    var user = await db.Users.FirstOrDefaultAsync(u => u.LoginId == loginId);
                    if (user != null)
                    {
                        var today = DateTime.Today;
                        var overdueDevices = await db.Device
                            .Include(d => d.CollectionAssignments)
                            .Where(d => d.UserId == user.UserId &&
                                        d.PickupDate < today &&
                                        d.Status != "Completed" &&
                                        d.Status != "Inactive" &&
                                        d.Status != "Deleted")
                            .ToListAsync();

                        bool hasNewOverdueNotif = false;
                        foreach (var device in overdueDevices)
                        {
                            bool isCompleted = device.CollectionAssignments != null &&
                                              device.CollectionAssignments.Any(ca =>
                                                  string.Equals(ca.Status, "Completed", StringComparison.OrdinalIgnoreCase) ||
                                                  string.Equals(ca.Status, "Delivered", StringComparison.OrdinalIgnoreCase));
                            if (isCompleted) continue;

                            string brand = !string.IsNullOrWhiteSpace(device.Brand) ? device.Brand.Trim() : "Device";
                            string model = !string.IsNullOrWhiteSpace(device.Model) ? device.Model.Trim() : "";
                            string deviceLabel = string.IsNullOrWhiteSpace(model) ? brand : $"{brand} {model}";
                            string notifTitle = "Overdue Pickup Alert";
                            string notifMsg = $"The scheduled pickup date ({device.PickupDate:dd MMM yyyy}) for your device {deviceLabel} has passed. Please check your pickup details or contact support.";

                            bool alreadyNotified = await db.Notification.AnyAsync(n =>
                                n.LoginId == loginId &&
                                n.Title == notifTitle &&
                                n.Message != null &&
                                n.Message.Contains(deviceLabel) &&
                                (n.Status == true || n.Status == null));

                            if (!alreadyNotified)
                            {
                                db.Notification.Add(new Notification
                                {
                                    LoginId = loginId,
                                    Title = notifTitle,
                                    Message = notifMsg,
                                    Isread = false,
                                    Status = true,
                                    CreatedAt = DateTime.Now
                                });
                                hasNewOverdueNotif = true;
                            }
                        }

                        if (hasNewOverdueNotif)
                        {
                            await db.SaveChangesAsync();
                        }
                    }
                }
                catch (Exception exOverdue)
                {
                    logger.LogWarning(exOverdue, "Failed auto-checking overdue notifications for LoginId {LoginId}", loginId);
                }

                // Auto-check and persist Recycling Center allocation notifications ONLY if logged in as Recycling Center
                try
                {
                    var recyclingCenter = await db.RecyclingCenter.FirstOrDefaultAsync(c => c.LoginId == loginId);
                    if (recyclingCenter != null)
                    {
                        var centerRequests = await db.RecyclingCenterRequests
                            .Include(r => r.Device)
                            .Where(r => r.RecyclingCenterId == recyclingCenter.RecyclingCenterId && (r.Status == "Assigned" || r.Status == "Accepted"))
                            .ToListAsync();

                        bool hasNewRCNotif = false;
                        foreach (var req in centerRequests)
                        {
                            string b = req.Device?.Brand?.Trim() ?? "";
                            string m = req.Device?.Model?.Trim() ?? "";
                            string deviceName = (!string.IsNullOrWhiteSpace(b) || !string.IsNullOrWhiteSpace(m))
                                ? $"{b} {m}".Trim()
                                : $"Device #{req.DeviceId}";
                            string notifTitle = "New Device Allocated for Recycling";
                            string notifMsg = $"Device '{deviceName}' (#{req.DeviceId}) has been allocated to your recycling center. Please respond before deadline.";

                            bool alreadyNotified = await db.Notification.AnyAsync(n =>
                                n.LoginId == loginId &&
                                n.Title == notifTitle &&
                                n.Message != null &&
                                n.Message.Contains($"#{req.DeviceId}") &&
                                (n.Status == true || n.Status == null));

                            if (!alreadyNotified)
                            {
                                db.Notification.Add(new Notification
                                {
                                    LoginId = loginId,
                                    Title = notifTitle,
                                    Message = notifMsg,
                                    Isread = false,
                                    Status = true,
                                    CreatedAt = req.AssignedAt ?? req.CreatedAt
                                });
                                hasNewRCNotif = true;
                            }
                        }

                        if (hasNewRCNotif)
                        {
                            await db.SaveChangesAsync();
                        }
                    }
                }
                catch (Exception exRc)
                {
                    logger.LogWarning(exRc, "Failed auto-checking recycling center notifications for LoginId {LoginId}", loginId);
                }

                var notifications = await db.Notification
                    .Where(n => n.LoginId == loginId && (n.Status == true || n.Status == null))
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => new
                    {
                        notificationId = n.NotificationId,
                        title = n.Title ?? "",
                        message = n.Message ?? "",
                        isRead = n.Isread ?? false,
                        status = n.Status ?? true,
                        createdAt = n.CreatedAt ?? DateTime.UtcNow
                    })
                    .ToListAsync();

                return Ok(notifications);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error loading notifications for LoginId {LoginId}", loginId);
                return StatusCode(500, new { message = "Error loading notifications" });
            }
        }

        [HttpPut("mark_asread/{notificationId}")]
        [HttpPost("mark_asread/{notificationId}")]
        [Authorize]
        public async Task<IActionResult> markasread(int notificationId)
        {
            int loginId = GetCurrentLoginId();
            if (loginId == 0) return Unauthorized(new { message = "Invalid session." });

            try
            {
                var notification = await db.Notification
                    .FirstOrDefaultAsync(n =>
                        n.NotificationId == notificationId &&
                        n.LoginId == loginId);

                if (notification == null)
                {
                    return NotFound(new { message = "Notification not found." });
                }

                notification.Isread = true;
                await db.SaveChangesAsync();

                return Ok(new { message = "Notification marked as read.", notificationId });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error marking notification {NotificationId} as read for LoginId {LoginId}", notificationId, loginId);
                return StatusCode(500, new { message = "Error updating notification" });
            }
        }

        [HttpGet("mark_asread")]
        [HttpPut("mark_asread")]
        [HttpPost("mark_asread")]
        [Authorize]
        public async Task<IActionResult> MarkAsRead()
        {
            int loginId = GetCurrentLoginId();
            if (loginId == 0) return Unauthorized(new { message = "Invalid session." });

            try
            {
                var notifications = await db.Notification
                    .Where(n => n.LoginId == loginId && (n.Isread == false || n.Isread == null))
                    .ToListAsync();

                foreach (var notification in notifications)
                {
                    notification.Isread = true;
                }

                await db.SaveChangesAsync();

                return Ok(new { message = "All unread notifications marked as read.", count = notifications.Count });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error marking all notifications as read for LoginId {LoginId}", loginId);
                return StatusCode(500, new { message = "Error updating notifications" });
            }
        }

        [HttpPut("delete_selected/{notificationId}")]
        [HttpDelete("delete_selected/{notificationId}")]
        [HttpPost("delete_selected/{notificationId}")]
        [Authorize]
        public async Task<IActionResult> deleteselected(int notificationId)
        {
            int loginId = GetCurrentLoginId();
            if (loginId == 0) return Unauthorized(new { message = "Invalid session." });

            try
            {
                var notification = await db.Notification
                    .FirstOrDefaultAsync(n =>
                        n.NotificationId == notificationId &&
                        n.LoginId == loginId);

                if (notification == null)
                {
                    return NotFound(new { message = "Notification not found." });
                }

                notification.Status = false;
                await db.SaveChangesAsync();

                return Ok(new { message = "Notification deleted.", notificationId });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error deleting notification {NotificationId} for LoginId {LoginId}", notificationId, loginId);
                return StatusCode(500, new { message = "Error deleting notification" });
            }
        }

        [HttpGet("clearall")]
        [HttpDelete("clearall")]
        [HttpPost("clearall")]
        [Authorize]
        public async Task<IActionResult> ClearAll()
        {
            int loginId = GetCurrentLoginId();
            if (loginId == 0) return Unauthorized(new { message = "Invalid session." });

            try
            {
                var notifications = await db.Notification
                    .Where(n => n.LoginId == loginId && (n.Status == true || n.Status == null))
                    .ToListAsync();

                foreach (var notification in notifications)
                {
                    notification.Status = false;
                }

                await db.SaveChangesAsync();

                return Ok(new { message = "All notifications cleared.", count = notifications.Count });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error clearing notifications for LoginId {LoginId}", loginId);
                return StatusCode(500, new { message = "Error clearing notifications" });
            }
        }
    }
}