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

        public Notificationcon(ApplicationDbContext db, IWebHostEnvironment env)
        {
            this.db = db;
            this.env = env;
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

        private async Task<List<int>> GetValidLoginIdsAsync(int loginId)
        {
            var ids = new HashSet<int> { loginId };

            var rc = await db.RecyclingCenter.FirstOrDefaultAsync(c => c.LoginId == loginId || c.RecyclingCenterId == loginId);
            if (rc == null)
            {
                rc = await db.RecyclingCenter.FirstOrDefaultAsync();
            }
            if (rc != null)
            {
                if (rc.LoginId > 0) ids.Add(rc.LoginId);
                if (rc.RecyclingCenterId > 0) ids.Add(rc.RecyclingCenterId);
            }

            var rfc = await db.RefurbishmentCenter.FirstOrDefaultAsync(c => c.LoginId == loginId || c.RefurbishmentCenterId == loginId);
            if (rfc != null)
            {
                if (rfc.LoginId > 0) ids.Add(rfc.LoginId);
                if (rfc.RefurbishmentCenterId > 0) ids.Add(rfc.RefurbishmentCenterId);
            }

            var tech = await db.Technician.FirstOrDefaultAsync(t => t.LoginId == loginId || t.TechnicianId == loginId);
            if (tech != null)
            {
                if (tech.LoginId > 0) ids.Add(tech.LoginId);
                if (tech.TechnicianId > 0) ids.Add(tech.TechnicianId);
            }

            var agent = await db.CollectionAgents.FirstOrDefaultAsync(a => a.LoginId == loginId || a.CollectionAgentId == loginId);
            if (agent != null)
            {
                if (agent.LoginId > 0) ids.Add(agent.LoginId);
                if (agent.CollectionAgentId > 0) ids.Add(agent.CollectionAgentId);
            }

            var user = await db.Users.FirstOrDefaultAsync(u => u.LoginId == loginId || u.UserId == loginId);
            if (user != null)
            {
                if (user.LoginId > 0) ids.Add(user.LoginId);
                if (user.UserId > 0) ids.Add(user.UserId);
            }

            return ids.ToList();
        }

        [HttpGet("my_notifications")]
        [Authorize]
        public async Task<IActionResult> GetMyNotifications()
        {
            int loginId = GetCurrentLoginId();
            if (loginId == 0)
            {
                return Unauthorized(new { message = "Invalid login session." });
            }

            var validLoginIds = await GetValidLoginIdsAsync(loginId);

            // Auto-check and persist Overdue Pickup notifications for Citizens
            var user = await db.Users.FirstOrDefaultAsync(u => validLoginIds.Contains(u.LoginId) || validLoginIds.Contains(u.UserId));
            if (user != null)
            {
                var today = DateTime.Today;
                var overdueDevices = await db.Device
                    .Include(d => d.CollectionAssignments)
                    .Where(d => d.UserId == user.UserId &&
                                d.PickupDate.Date < today &&
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

                    string notifTitle = "Overdue Pickup Alert";
                    string notifMsg = $"The scheduled pickup date ({device.PickupDate:dd MMM yyyy}) for your device {device.Brand} {device.Model} has passed. Please check your pickup details or contact support.";

                    bool alreadyNotified = await db.Notification.AnyAsync(n =>
                        validLoginIds.Contains(n.LoginId) &&
                        n.Title == notifTitle &&
                        n.Message.Contains(device.Brand) &&
                        n.Message.Contains(device.Model) &&
                        n.Status);

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

            // Auto-check and persist Recycling Center allocation notifications
            var recyclingCenter = await db.RecyclingCenter.FirstOrDefaultAsync(c => validLoginIds.Contains(c.LoginId) || validLoginIds.Contains(c.RecyclingCenterId));
            if (recyclingCenter == null)
            {
                recyclingCenter = await db.RecyclingCenter.FirstOrDefaultAsync();
            }

            if (recyclingCenter != null)
            {
                if (recyclingCenter.LoginId > 0 && !validLoginIds.Contains(recyclingCenter.LoginId))
                {
                    validLoginIds.Add(recyclingCenter.LoginId);
                }
                if (recyclingCenter.RecyclingCenterId > 0 && !validLoginIds.Contains(recyclingCenter.RecyclingCenterId))
                {
                    validLoginIds.Add(recyclingCenter.RecyclingCenterId);
                }

                var centerRequests = await db.RecyclingCenterRequests
                    .Include(r => r.Device)
                    .Where(r => r.RecyclingCenterId == recyclingCenter.RecyclingCenterId && (r.Status == "Assigned" || r.Status == "Accepted"))
                    .ToListAsync();

                bool hasNewRCNotif = false;
                foreach (var req in centerRequests)
                {
                    string deviceName = req.Device != null ? $"{req.Device.Brand} {req.Device.Model}".Trim() : $"Device #{req.DeviceId}";
                    string notifTitle = "New Device Allocated for Recycling";

                    bool alreadyNotified = await db.Notification.AnyAsync(n =>
                        validLoginIds.Contains(n.LoginId) &&
                        n.Title == notifTitle &&
                        n.Message.Contains(deviceName) &&
                        n.Status);

                    if (!alreadyNotified)
                    {
                        db.Notification.Add(new Notification
                        {
                            LoginId = recyclingCenter.LoginId > 0 ? recyclingCenter.LoginId : loginId,
                            Title = notifTitle,
                            Message = $"Device '{deviceName}' (#{req.DeviceId}) has been allocated to your recycling center. Please respond before deadline.",
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

            var notifications = await db.Notification
                .Where(n => validLoginIds.Contains(n.LoginId) && n.Status)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    notificationId = n.NotificationId,
                    title = n.Title,
                    message = n.Message,
                    isRead = n.Isread,
                    status = n.Status,
                    createdAt = n.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpPut("mark_asread/{notificationId}")]
        [Authorize]
        public async Task<IActionResult> markasread(int notificationId)
        {
            int loginId = GetCurrentLoginId();
            if (loginId == 0) return Unauthorized();

            var validLoginIds = await GetValidLoginIdsAsync(loginId);

            var notification = await db.Notification
                .FirstOrDefaultAsync(n =>
                    n.NotificationId == notificationId &&
                    validLoginIds.Contains(n.LoginId));

            if (notification == null)
            {
                return NotFound(new { message = "Notification not found." });
            }

            notification.Isread = true;
            await db.SaveChangesAsync();

            return Ok(new { message = "Notification marked as read." });
        }

        [HttpGet("mark_asread")]
        [Authorize]
        public async Task<IActionResult> MarkAsRead()
        {
            int loginId = GetCurrentLoginId();
            if (loginId == 0) return Unauthorized();

            var validLoginIds = await GetValidLoginIdsAsync(loginId);

            var notifications = await db.Notification
                .Where(n => validLoginIds.Contains(n.LoginId) && !n.Isread)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.Isread = true;
            }

            await db.SaveChangesAsync();

            return Ok(new { message = "Notifications marked as read." });
        }

        [HttpPut("delete_selected/{notificationId}")]
        [Authorize]
        public async Task<IActionResult> deleteselected(int notificationId)
        {
            int loginId = GetCurrentLoginId();
            if (loginId == 0) return Unauthorized();

            var validLoginIds = await GetValidLoginIdsAsync(loginId);

            var notification = await db.Notification
                .FirstOrDefaultAsync(n =>
                    n.NotificationId == notificationId &&
                    validLoginIds.Contains(n.LoginId));

            if (notification == null)
            {
                return NotFound(new { message = "Notification not found." });
            }

            notification.Status = false;
            await db.SaveChangesAsync();

            return Ok(new { message = "Notification deleted." });
        }

        [HttpGet("clearall")]
        [Authorize]
        public async Task<IActionResult> ClearAll()
        {
            int loginId = GetCurrentLoginId();
            if (loginId == 0) return Unauthorized();

            var validLoginIds = await GetValidLoginIdsAsync(loginId);

            var notifications = await db.Notification
                .Where(n => validLoginIds.Contains(n.LoginId) && n.Status)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.Status = false;
            }

            await db.SaveChangesAsync();

            return Ok(new { message = "All notifications cleared." });
        }
    }
}