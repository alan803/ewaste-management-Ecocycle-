using System.IdentityModel.Tokens.Jwt;
using EcoCycle.API.Data;
using EcoCycle.API.Models;
using EcoCycle.Data.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EcoCycle.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DeviceController : ControllerBase
    {
        private readonly ApplicationDbContext db;
        private readonly IWebHostEnvironment env;

        public DeviceController(
            ApplicationDbContext db,
            IWebHostEnvironment env)
        {
            this.db = db;
            this.env = env;
        }
        private async Task<string?> SaveFile(
            IFormFile? file,
            string folderName)
        {
            if (file == null || file.Length == 0)
                return null;

            string webRootPath = env.WebRootPath;

            if (string.IsNullOrEmpty(webRootPath))
            {
                webRootPath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot"
                );
            }

            string uploadsFolder = Path.Combine(
                webRootPath,
                "uploads",
                "devices",
                folderName
            );

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            string extension =
                Path.GetExtension(file.FileName);

            string fileName =
                Guid.NewGuid().ToString() + extension;

            string filePath =
                Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(
                filePath,
                FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return fileName;
        }

        [HttpPost("Register")]
        public async Task<IActionResult> Register(
            [FromForm] DeviceAdd dev)
        {
            using var transaction =
                await db.Database.BeginTransactionAsync();

            try
            {
                var loginIdClaim =User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (string.IsNullOrEmpty(loginIdClaim))
                {
                    return Unauthorized(new
                    {
                        message = "Login identity not found. Please login again."
                    });
                }

                if (!int.TryParse(loginIdClaim, out int loginId))
                {
                    return Unauthorized(new
                    {
                        message = "Invalid login ID."
                    });
                }

                var user = await db.Users
                .FirstOrDefaultAsync(
                    u => u.LoginId == loginId
                );

                if (user == null)
                {
                    return NotFound(new
                    {
                        message = "User not found."
                    });
                }
                var category = await db.DeviceCategory
                    .FirstOrDefaultAsync(
                        c => c.CategoryId == dev.CategoryId
                    );

                if (category == null)
                {
                    return BadRequest(new
                    {
                        message = "Invalid device category."
                    });
                }
                string finalAddress;

                if (dev.UseRegisteredAddress)
                {
                    finalAddress = user.Address;
                }
                else
                {
                    finalAddress = dev.Address ?? "";
                }

                if (string.IsNullOrWhiteSpace(finalAddress))
                {
                    return BadRequest(new
                    {
                        message = "Pickup address is required."
                    });
                }
                Device device = new Device
                {
                    UserId = user.UserId,

                    CategoryId = dev.CategoryId,

                    Brand = dev.Brand,
                    Model = dev.Model,
                    ModelNumber = dev.ModelNumber,
                    SerialNumber = dev.SerialNumber,
                    Quantity = dev.Quantity,
                    Weight=dev.Weight,

                    Condition = dev.Condition,
                    Working = dev.Working,
                    PhysicalDamage = dev.PhysicalDamage,
                    DisplayCondition = dev.DisplayCondition,
                    BatteryCondition = dev.BatteryCondition,
                    Accessories = dev.Accessories,
                    Charger = dev.Charger,

                    Address = finalAddress,
                    Landmark = dev.Landmark,

                    PickupDate = dev.PickupDate,
                    TimeSlot = dev.TimeSlot,
                    PickupInstructions = dev.PickupInstructions,

                    ProcessingPreference =
                        dev.ProcessingPreference,

                    Ownership = dev.Ownership,
                    OwnershipConfirmed =
                        dev.OwnershipConfirmed,

                    TermsAccepted =
                        dev.TermsAccepted,

                    Status = "Pending",

                    CreatedAt = DateTime.Now
                };
                device.FrontPhoto =
                    await SaveFile(
                        dev.FrontPhoto,
                        "FrontPhotos"
                    );

                device.BackPhoto =
                    await SaveFile(
                        dev.BackPhoto,
                        "BackPhotos"
                    );

                device.DamagePhoto =
                    await SaveFile(
                        dev.DamagePhoto,
                        "DamagePhotos"
                    );

                device.LabelPhoto =
                    await SaveFile(
                        dev.LabelPhoto,
                        "LabelPhotos"
                    );
                db.Device.Add(device);

                await db.SaveChangesAsync();
                await transaction.CommitAsync();
                return Ok(new
                {
                    message =
                        "Device registered successfully.",

                    deviceId =
                        device.DeviceId,

                    status =
                        device.Status
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                Console.WriteLine(
                    "DEVICE REGISTER ERROR: "
                    + ex.ToString()
                );

                return StatusCode(500, new
                {
                    message =
                        "Error registering device.",

                    error =
                        ex.Message
                });
            }
        }
        [HttpGet("Pending")]
        public async Task<IActionResult> GetPendingDevices()
        {
            var devices = await db.Device
                .Where(x => x.Status == "Pending")
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(devices);
        }
        [HttpGet("All")]
        public async Task<IActionResult> GetAllDevices()
        {
            var devices = await db.Device
                .Include(d => d.Category)
                .Include(d => d.User)
                .Include(d => d.InspectionRequests)
                .OrderByDescending(x => x.CreatedAt)
                .Select(d => new
                {
                    d.DeviceId,
                    d.UserId,
                    d.CategoryId,
                    categoryName = d.Category != null ? d.Category.CategoryName : null,
                    d.Brand,
                    d.Model,
                    d.ModelNumber,
                    d.SerialNumber,
                    d.Quantity,
                    d.Weight,
                    d.Condition,
                    d.Working,
                    d.PhysicalDamage,
                    d.DisplayCondition,
                    d.BatteryCondition,
                    d.Accessories,
                    d.Charger,
                    d.FrontPhoto,
                    d.BackPhoto,
                    d.DamagePhoto,
                    d.LabelPhoto,
                    d.Address,
                    d.Landmark,
                    d.PickupDate,
                    d.TimeSlot,
                    d.PickupInstructions,
                    d.ProcessingPreference,
                    d.Ownership,
                    d.OwnershipConfirmed,
                    d.TermsAccepted,
                    d.Status,
                    d.LifecycleStatus,
                    d.CreatedAt,
                    userName = d.User != null ? (d.User.FirstName + " " + d.User.LastName) : null,
                    inspectionRequestId = d.InspectionRequests
                        .Where(x => x.Status != "Rejected")
                        .OrderByDescending(x => x.InspectionRequestId)
                        .Select(x => (int?)x.InspectionRequestId)
                        .FirstOrDefault() ?? d.InspectionRequests.OrderByDescending(x => x.InspectionRequestId).Select(x => (int?)x.InspectionRequestId).FirstOrDefault(),
                    inspectionRequestStatus = d.InspectionRequests
                        .Where(x => x.Status != "Rejected")
                        .OrderByDescending(x => x.InspectionRequestId)
                        .Select(x => x.Status)
                        .FirstOrDefault() ?? d.InspectionRequests.OrderByDescending(x => x.InspectionRequestId).Select(x => x.Status).FirstOrDefault(),
                    technicianId = d.InspectionRequests
                        .Where(x => x.Status != "Rejected")
                        .OrderByDescending(x => x.InspectionRequestId)
                        .Select(x => x.TechnicianId)
                        .FirstOrDefault() ?? d.InspectionRequests.OrderByDescending(x => x.InspectionRequestId).Select(x => x.TechnicianId).FirstOrDefault()
                })
                .ToListAsync();

            return Ok(devices);
        }
        [HttpPost("accept/{id}")]
        public async Task<IActionResult> acceptpendingdevice(int id)
        {
            var device=await db.Device.FirstOrDefaultAsync(x=>x.DeviceId== id);
            if(device==null)
            {
                return NotFound();
            }
            if(device.Status !="Pending")
            {
                return BadRequest(new
                {
                    message = ""
                });
            }
            device.Status = "Accepted";
            await db.SaveChangesAsync();
            return Ok();
        }
        [HttpPost("reject/{id}")]
        public async Task<IActionResult> rejectpendingdevice(int id)
        {
            var device = await db.Device.FirstOrDefaultAsync(x => x.DeviceId == id);
            if (device == null)
            {
                return NotFound();
            }
            if (device.Status != "Pending")
            {
                return BadRequest(new
                {
                    message = ""
                });
            }
            device.Status = "Rejected";
            await db.SaveChangesAsync();
            return Ok();
        }
        [HttpGet("MyDevices")]
        public async Task<IActionResult> GetMyDevices()
        {
            var loginId = int.Parse(
                User.FindFirstValue(ClaimTypes.NameIdentifier)!
            );

            var user = await db.Users
                .FirstOrDefaultAsync(x => x.LoginId == loginId);

            if (user == null)
                return NotFound(new { message = "User not found." });

            var devices = await db.Device
                .Where(x => x.UserId == user.UserId)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(devices);
        }
        [HttpPost("Delete/{id}")]
        public async Task<IActionResult> Deletedevice(int id)
        {
            var device = await db.Device.FirstOrDefaultAsync(x => x.DeviceId == id);
            if (device == null)
            {
                return NotFound(new { message = "Device not found." });
            }

            if (string.Equals(device.Status, "Inactive", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(device.Status, "Deleted", StringComparison.OrdinalIgnoreCase))
            {
                db.Device.Remove(device);
            }
            else
            {
                device.Status = "Inactive";
            }

            await db.SaveChangesAsync();
            return Ok(new { message = "Device status updated to Inactive." });
        }

        [HttpPost("Restore/{id}")]
        public async Task<IActionResult> RestoreDevice(int id)
        {
            var device = await db.Device.FirstOrDefaultAsync(x => x.DeviceId == id);

            if (device == null)
            {
                return NotFound(new { message = "Device not found." });
            }

            if (!string.Equals(device.Status, "Inactive", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(device.Status, "Deleted", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Device is not inactive or deleted." });
            }

            device.Status = "Active";

            await db.SaveChangesAsync();

            return Ok(new
            {
                message = "Device restored successfully.",
                deviceId = device.DeviceId,
                status = device.Status
            });
        }

    }
}