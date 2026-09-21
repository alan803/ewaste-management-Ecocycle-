using System.IdentityModel.Tokens.Jwt;
using EcoCycle.API.Data;
using EcoCycle.API.Models;
using EcoCycle.Data.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;
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

        private static string GenerateComplexQrToken(int deviceId)
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var bytes = RandomNumberGenerator.GetBytes(8);
            var code = new char[8];
            for (int i = 0; i < 8; i++)
            {
                code[i] = chars[bytes[i] % chars.Length];
            }
            return $"ECOQR-DEV-{deviceId}-{new string(code)}";
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

                DeviceModel? matchedModel = null;
                if (!string.IsNullOrWhiteSpace(dev.ModelNumber))
                {
                    matchedModel = await db.DeviceModel
                        .FirstOrDefaultAsync(m =>
                            m.CategoryId == dev.CategoryId &&
                            m.Brand.ToLower() == dev.Brand.Trim().ToLower() &&
                            m.Model.ToLower() == dev.Model.Trim().ToLower() &&
                            m.ModelNumber != null && m.ModelNumber.ToLower() == dev.ModelNumber.Trim().ToLower());
                }

                if (matchedModel == null)
                {
                    matchedModel = await db.DeviceModel
                        .FirstOrDefaultAsync(m =>
                            m.CategoryId == dev.CategoryId &&
                            m.Brand.ToLower() == dev.Brand.Trim().ToLower() &&
                            m.Model.ToLower() == dev.Model.Trim().ToLower());
                }

                if (matchedModel == null)
                {
                    matchedModel = await db.DeviceModel
                        .FirstOrDefaultAsync(m =>
                            m.Brand.ToLower() == dev.Brand.Trim().ToLower() &&
                            m.Model.ToLower() == dev.Model.Trim().ToLower());
                }

                var device = new Device
                {
                    UserId = user.UserId,
                    CategoryId = dev.CategoryId,
                    DeviceModelId = matchedModel?.DeviceModelId,

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

                device.DeviceQrToken = GenerateComplexQrToken(device.DeviceId);
                await db.SaveChangesAsync();

                await transaction.CommitAsync();
                return Ok(new
                {
                    message = "Device registered successfully.",
                    deviceId = device.DeviceId,
                    deviceQrToken = device.DeviceQrToken,
                    status = device.Status
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
            var today = DateTime.Today;

            // 1. Auto-repair any devices mistakenly marked as DueDatePassed despite having active inspection/collection
            var corruptedList = await db.Device
                .Include(d => d.InspectionRequests)
                .Include(d => d.CollectionAssignments)
                .Where(d => d.LifecycleStatus == "DueDatePassed")
                .ToListAsync();

            if (corruptedList.Any())
            {
                bool fixedAny = false;
                foreach (var d in corruptedList)
                {
                    if (!string.IsNullOrEmpty(d.ProcessingDecision) || d.InspectionRequests.Any(ir => ir.Status == "Accepted" || ir.Status == "Completed"))
                    {
                        d.LifecycleStatus = "Inspected";
                        fixedAny = true;
                    }
                    else if (d.CollectionAssignments.Any(ca => ca.Status == "DeliveredToCenter"))
                    {
                        d.LifecycleStatus = "AtInspectionCenter";
                        fixedAny = true;
                    }
                    else if (d.CollectionAssignments.Any(ca => ca.Status == "Assigned" || ca.Status == "Accepted" || ca.Status == "PickupStarted"))
                    {
                        d.LifecycleStatus = "CollectionAssigned";
                        fixedAny = true;
                    }
                }
                if (fixedAny)
                {
                    await db.SaveChangesAsync();
                }
            }

            // 2. Only mark DueDatePassed for devices strictly in Pending with no inspection/collection activity
            var activeOrCompletedStatuses = new[]
            {
                "inspected", "inspectioncompleted", "inspectionassigned", "inspectionaccepted", "inspectioninprogress",
                "atinspectioncenter", "collectionassigned", "collectionpending", "pickedup", "enroute",
                "handoverpendingverification", "recyclingcenteraccepted", "refurbishmentcenteraccepted",
                "completed", "delivered", "recycled", "refurbished", "duedatepassed", "pickupcancelled", "cancelled"
            };

            var overdueCandidateList = await db.Device
                .Include(d => d.InspectionRequests)
                .Include(d => d.CollectionAssignments)
                .Where(d => d.PickupDate < today 
                    && d.Status != "Inactive" 
                    && d.Status != "Deleted"
                    && d.Status != "Accepted"
                    && string.IsNullOrEmpty(d.ProcessingDecision))
                .ToListAsync();

            var trulyOverdue = overdueCandidateList.Where(d =>
            {
                string lcs = (d.LifecycleStatus ?? "").ToLower().Trim();
                if (activeOrCompletedStatuses.Contains(lcs)) return false;
                if (d.InspectionRequests != null && d.InspectionRequests.Any(ir => ir.Status != "Rejected" && ir.Status != "Cancelled")) return false;
                if (d.CollectionAssignments != null && d.CollectionAssignments.Any(ca => ca.Status != "Rejected" && ca.Status != "Cancelled")) return false;
                return true;
            }).ToList();

            if (trulyOverdue.Any())
            {
                foreach (var d in trulyOverdue)
                {
                    d.LifecycleStatus = "DueDatePassed";
                }
                await db.SaveChangesAsync();
            }

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
                    d.ProcessingDecision,
                    d.ProcessingDecisionAt,
                    d.Ownership,
                    d.OwnershipConfirmed,
                    d.TermsAccepted,
                    d.Status,
                    d.LifecycleStatus,
                    d.ProcessingLifecycleStatus,
                    d.AllocationRequested,
                    d.CreatedAt,
                    userName = d.User != null ? (d.User.FirstName + " " + d.User.LastName) : null,
                    userAddress = d.User != null ? d.User.Address : null,
                    userCity = d.User != null ? d.User.City : null,
                    userDistrict = d.User != null ? d.User.District : null,
                    userState = d.User != null ? d.User.State : null,
                    userPincode = d.User != null ? d.User.Pincode : null,
                    userLocation = d.User != null 
                        ? (d.User.Address + ", " + d.User.City + ", " + d.User.District + ", " + d.User.State + (string.IsNullOrWhiteSpace(d.User.Pincode) ? "" : " - " + d.User.Pincode)) 
                        : null,
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
                        .FirstOrDefault() ?? d.InspectionRequests.OrderByDescending(x => x.InspectionRequestId).Select(x => x.TechnicianId).FirstOrDefault(),
                    recyclingCenterRequestStatus = db.RecyclingCenterRequests
                        .Where(x => x.DeviceId == d.DeviceId && x.Status != "Rejected")
                        .OrderByDescending(x => x.RecyclingCenterRequestId)
                        .Select(x => x.Status)
                        .FirstOrDefault() ?? db.RecyclingCenterRequests.Where(x => x.DeviceId == d.DeviceId).OrderByDescending(x => x.RecyclingCenterRequestId).Select(x => x.Status).FirstOrDefault(),
                    recyclingCenterId = db.RecyclingCenterRequests
                        .Where(x => x.DeviceId == d.DeviceId && x.Status != "Rejected")
                        .OrderByDescending(x => x.RecyclingCenterRequestId)
                        .Select(x => x.RecyclingCenterId)
                        .FirstOrDefault() ?? db.RecyclingCenterRequests.Where(x => x.DeviceId == d.DeviceId).OrderByDescending(x => x.RecyclingCenterRequestId).Select(x => x.RecyclingCenterId).FirstOrDefault()
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
            device.AllocationRequested = false;
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

            var today = DateTime.Today;
            var activeOrCompletedStatusesUser = new[]
            {
                "inspected", "inspectioncompleted", "inspectionassigned", "inspectionaccepted", "inspectioninprogress",
                "atinspectioncenter", "collectionassigned", "collectionpending", "pickedup", "enroute",
                "handoverpendingverification", "recyclingcenteraccepted", "refurbishmentcenteraccepted",
                "completed", "delivered", "recycled", "refurbished", "duedatepassed", "pickupcancelled", "cancelled"
            };

            var overdueCandidateListUser = await db.Device
                .Include(d => d.InspectionRequests)
                .Include(d => d.CollectionAssignments)
                .Where(d => d.UserId == user.UserId
                    && d.PickupDate < today 
                    && d.Status != "Inactive" 
                    && d.Status != "Deleted"
                    && d.Status != "Accepted"
                    && string.IsNullOrEmpty(d.ProcessingDecision))
                .ToListAsync();

            var trulyOverdueUser = overdueCandidateListUser.Where(d =>
            {
                string lcs = (d.LifecycleStatus ?? "").ToLower().Trim();
                if (activeOrCompletedStatusesUser.Contains(lcs)) return false;
                if (d.InspectionRequests != null && d.InspectionRequests.Any(ir => ir.Status != "Rejected" && ir.Status != "Cancelled")) return false;
                if (d.CollectionAssignments != null && d.CollectionAssignments.Any(ca => ca.Status != "Rejected" && ca.Status != "Cancelled")) return false;
                return true;
            }).ToList();

            if (trulyOverdueUser.Any())
            {
                foreach (var d in trulyOverdueUser)
                {
                    d.LifecycleStatus = "DueDatePassed";
                }
                await db.SaveChangesAsync();
            }

            var devicesList = await db.Device
                .Where(x => x.UserId == user.UserId)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            var result = new List<object>();
            var defaultTech = await db.Technician.FirstOrDefaultAsync();

            foreach (var d in devicesList)
            {
                var inspReq = await db.InspectionRequest
                    .Include(ir => ir.Technician)
                    .Where(ir => ir.DeviceId == d.DeviceId)
                    .OrderByDescending(ir => ir.CreatedAt)
                    .FirstOrDefaultAsync();

                var tech = inspReq?.Technician ?? defaultTech;
                string? techName = tech != null ? $"{tech.FirstName} {tech.LastName}".Trim() : "EcoCycle Lead Technician";
                
                // User Location (From Address)
                string userCity = !string.IsNullOrWhiteSpace(user.City) ? user.City : (!string.IsNullOrWhiteSpace(user.District) ? user.District : "Kochi");
                string userPincode = !string.IsNullOrWhiteSpace(user.Pincode) ? user.Pincode : "682001";
                string userAddrCore = !string.IsNullOrWhiteSpace(d.Address) ? d.Address : user.Address;
                string userLandmarkCore = !string.IsNullOrWhiteSpace(d.Landmark) ? d.Landmark : "";

                List<string> uParts = new List<string>();
                if (!string.IsNullOrWhiteSpace(userAddrCore)) uParts.Add(userAddrCore);
                if (!string.IsNullOrWhiteSpace(userLandmarkCore)) uParts.Add($"Landmark: {userLandmarkCore}");
                if (!string.IsNullOrWhiteSpace(userCity)) uParts.Add($"City: {userCity}");
                if (!string.IsNullOrWhiteSpace(userPincode)) uParts.Add($"PIN: {userPincode}");

                string userAddressFormatted = string.Join(", ", uParts);

                // Technician Location (To Address)
                string techCenterName = tech != null && !string.IsNullOrWhiteSpace(tech.InspectionCenterName)
                    ? tech.InspectionCenterName
                    : "EcoCycle Regional Inspection Center";

                string techAddrCore = tech != null && !string.IsNullOrWhiteSpace(tech.Address) ? tech.Address : "EcoCycle Industrial Hub";
                string techCity = tech != null && !string.IsNullOrWhiteSpace(tech.City) ? tech.City : "Ernakulam";
                string techPin = tech != null && !string.IsNullOrWhiteSpace(tech.PinCode) ? tech.PinCode : "682030";

                List<string> tParts = new List<string>();
                if (!string.IsNullOrWhiteSpace(techAddrCore)) tParts.Add(techAddrCore);
                if (!string.IsNullOrWhiteSpace(techCity)) tParts.Add($"City: {techCity}");
                if (!string.IsNullOrWhiteSpace(techPin)) tParts.Add($"PIN: {techPin}");

                string techCenterAddress = string.Join(", ", tParts);
                string techFullLocation = $"{techCenterName} ({techCenterAddress})";

                result.Add(new
                {
                    d.DeviceId,
                    d.UserId,
                    d.Brand,
                    d.Model,
                    d.Condition,
                    d.Working,
                    d.Weight,
                    Address = userAddressFormatted,
                    d.Landmark,
                    Pincode = userPincode,
                    City = userCity,
                    userFullLocation = userAddressFormatted,
                    userCity,
                    userPincode,
                    d.PickupDate,
                    d.TimeSlot,
                    d.Status,
                    d.LifecycleStatus,
                    d.AllocationRequested,
                    d.FrontPhoto,
                    d.BackPhoto,
                    d.DamagePhoto,
                    d.LabelPhoto,
                    d.SerialNumber,
                    d.ModelNumber,
                    DeviceQrToken = !string.IsNullOrEmpty(d.DeviceQrToken) ? d.DeviceQrToken : $"ECOQR-DEV-{d.DeviceId}",
                    d.CreatedAt,
                    assignedTechnicianName = techName,
                    assignedTechnicianCenter = techFullLocation,
                    assignedTechnicianCenterName = techCenterName,
                    assignedTechnicianCenterAddress = techCenterAddress,
                    techCity,
                    techPincode = techPin
                });
            }

            return Ok(result);
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

        [HttpPost("request-allocation/{id}")]
        public async Task<IActionResult> RequestAllocation(int id)
        {
            var device = await db.Device.FirstOrDefaultAsync(x => x.DeviceId == id);

            if (device == null)
            {
                return NotFound(new { message = "Device not found." });
            }

            device.AllocationRequested = true;

            await db.SaveChangesAsync();

            return Ok(new
            {
                message = "Allocation request submitted successfully.",
                deviceId = device.DeviceId,
                allocationRequested = device.AllocationRequested
            });
        }

    }
}