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
        public Notificationcon(ApplicationDbContext db,IWebHostEnvironment env)
        {
            this.db = db;
            this.env = env;
        }
        [HttpGet("my_notifications")]
        [Authorize]
        public async Task<IActionResult> GetMyNotifications()
        {
            var loginIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (loginIdClaim == null)
            {
                return Unauthorized();
            }

            int loginId = int.Parse(loginIdClaim.Value);

            // Auto-check and persist Overdue Pickup notifications for Citizens
            var user = await db.Users.FirstOrDefaultAsync(u => u.LoginId == loginId);
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
                        n.LoginId == loginId &&
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

            var notifications = await db.Notification
                .Where(n => n.LoginId == loginId && n.Status)
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
            var loginIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (loginIdClaim == null)
            {
                return Unauthorized();
            }

            int loginId = int.Parse(loginIdClaim.Value);
            var notification = await db.Notification
                .FirstOrDefaultAsync(n =>
                n.NotificationId == notificationId &&
                n.LoginId == loginId);
            if (notification == null)
            {
                return NotFound(new
                {
                    message = "Notification not found."
                });
            }

            notification.Isread = true;

            await db.SaveChangesAsync();

            return Ok(new
            {
                message = "Notification marked as read."
            });
        }
        [HttpGet("mark_asread")]
        [Authorize]
        public async Task<IActionResult> MarkAsRead()
        {
            var loginIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (loginIdClaim == null)
            {
                return Unauthorized();
            }

            int loginId = int.Parse(loginIdClaim.Value);

            var notifications = await db.Notification
                .Where(n => n.LoginId == loginId && !n.Isread)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.Isread = true;
            }

            await db.SaveChangesAsync();

            return Ok(new
            {
                message = "Notifications marked as read."
            });
        }
        [HttpPut("delete_selected/{notificationId}")]
        [Authorize]
        public async Task<IActionResult> deleteselected(int notificationId)
        {
            var loginIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (loginIdClaim == null)
            {
                return Unauthorized();
            }

            int loginId = int.Parse(loginIdClaim.Value);
            var notification = await db.Notification
                .FirstOrDefaultAsync(n =>
                n.NotificationId == notificationId &&
                n.LoginId == loginId);
            if (notification == null)
            {
                return NotFound(new
                {
                    message = "Notification not found."
                });
            }

            notification.Status = false;

            await db.SaveChangesAsync();

            return Ok(new
            {
                message = "Notification deleted."
            });
        }
        [HttpGet("clearall")]
        [Authorize]
        public async Task<IActionResult> ClearAll()
        {
            var loginIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (loginIdClaim == null)
            {
                return Unauthorized();
            }

            int loginId = int.Parse(loginIdClaim.Value);

            var notifications = await db.Notification
                .Where(n => n.LoginId == loginId && n.Status)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.Status = false;
            }

            await db.SaveChangesAsync();

            return Ok(new
            {
                message = "All notifications cleared."
            });
        }
    }
}