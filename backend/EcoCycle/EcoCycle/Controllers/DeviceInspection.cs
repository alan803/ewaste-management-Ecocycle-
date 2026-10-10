using EcoCycle.API.Data;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace EcoCycle.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DeviceInspection : ControllerBase
    {
        private readonly ApplicationDbContext db;
        private readonly IWebHostEnvironment env;

        public DeviceInspection(ApplicationDbContext db, IWebHostEnvironment env)
        {
            this.db = db;
            this.env = env;
        }

        // DTOs
        public class ComponentTestDto
        {
            public string Component { get; set; } = string.Empty;
            public string Result { get; set; } = "Working"; // Working, Fair, Not Working
            public decimal Score { get; set; } = 100;
            public string Remarks { get; set; } = string.Empty;
            public List<string>? PhotosBase64 { get; set; }
        }

        public class SubmitInspectionDto
        {
            public int DeviceId { get; set; }
            public int? InspectionRequestId { get; set; }
            public string PhysicalCondition { get; set; } = "Good";
            public string ScreenIntegrity { get; set; } = "Intact";
            public string PowerTest { get; set; } = "Pass";
            public string BatteryHealth { get; set; } = "85%";
            public string QualityGrade { get; set; } = "Grade A";
            public string WasteDestination { get; set; } = "Refurbishment Center";
            public string DiagnosticNotes { get; set; } = string.Empty;
            public List<ComponentTestDto> Tests { get; set; } = new();
        }

        [HttpPost("start/{deviceId}")]
        public async Task<IActionResult> StartInspection(int deviceId)
        {
            try
            {
                var inspReq = await db.InspectionRequest
                    .OrderByDescending(r => r.CreatedAt)
                    .FirstOrDefaultAsync(r => r.DeviceId == deviceId && r.Status != "Rejected" && r.Status != "Cancelled");

                if (inspReq == null)
                {
                    return NotFound(new { message = $"No active inspection request found for device #{deviceId}." });
                }

                var inspection = await db.Inspection
                    .FirstOrDefaultAsync(i => i.InspectionRequestId == inspReq.InspectionRequestId);

                if (inspection == null)
                {
                    inspection = new Inspection
                    {
                        InspectionRequestId = inspReq.InspectionRequestId,
                        DeviceId = deviceId,
                        TechnicianId = inspReq.TechnicianId ?? 0,
                        Status = "InProgress",
                        InspectionStartedAt = DateTime.Now,
                        InspectionDeadline = DateTime.Now.AddDays(3),
                        CreatedAt = DateTime.Now
                    };
                    db.Inspection.Add(inspection);
                }
                else
                {
                    if (!inspection.InspectionStartedAt.HasValue)
                    {
                        inspection.InspectionStartedAt = DateTime.Now;
                    }
                    inspection.Status = "InProgress";
                    if (!inspection.InspectionDeadline.HasValue)
                    {
                        inspection.InspectionDeadline = DateTime.Now.AddDays(3);
                    }
                    inspection.UpdatedAt = DateTime.Now;
                }

                if (inspReq.Status == "Assigned" || inspReq.Status == "Waiting")
                {
                    inspReq.Status = "Accepted";
                    inspReq.RespondedAt = inspReq.RespondedAt ?? DateTime.Now;
                    inspReq.UpdatedAt = DateTime.Now;
                }

                await db.SaveChangesAsync();

                return Ok(new { message = "Inspection started timestamp recorded.", deviceId, startedAt = inspection.InspectionStartedAt });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error starting inspection.", error = ex.Message });
            }
        }

        [HttpPost("submit")]
        public async Task<IActionResult> SubmitInspectionReport([FromBody] SubmitInspectionDto dto)
        {
            if (dto == null || dto.DeviceId <= 0)
            {
                return BadRequest(new { message = "Invalid inspection payload." });
            }

            try
            {
                var device = await db.Device
                    .Include(d => d.Category)
                    .Include(d => d.User)
                        .ThenInclude(u => u.Login)
                    .FirstOrDefaultAsync(d => d.DeviceId == dto.DeviceId);

                if (device == null)
                {
                    return NotFound(new { message = $"Device #{dto.DeviceId} not found." });
                }

                // 1. Get or Create InspectionRequest
                InspectionRequest? inspReq = null;
                if (dto.InspectionRequestId.HasValue && dto.InspectionRequestId.Value > 0)
                {
                    inspReq = await db.InspectionRequest
                        .FirstOrDefaultAsync(r => r.InspectionRequestId == dto.InspectionRequestId.Value);
                }

                if (inspReq == null)
                {
                    inspReq = await db.InspectionRequest
                        .OrderByDescending(r => r.CreatedAt)
                        .FirstOrDefaultAsync(r => r.DeviceId == dto.DeviceId && r.Status != "Rejected");
                }

                DateTime now = DateTime.Now;

                if (inspReq == null)
                {
                    inspReq = new InspectionRequest
                    {
                        DeviceId = dto.DeviceId,
                        Status = "Accepted",
                        AssignedAt = now,
                        RespondedAt = now,
                        CreatedAt = now,
                        UpdatedAt = now
                    };
                    db.InspectionRequest.Add(inspReq);
                    await db.SaveChangesAsync();
                }

                // 2. Get or Create Inspection
                var inspection = await db.Inspection
                    .FirstOrDefaultAsync(i => i.InspectionRequestId == inspReq.InspectionRequestId);

                if (inspection == null)
                {
                    inspection = new Inspection
                    {
                        InspectionRequestId = inspReq.InspectionRequestId,
                        DeviceId = dto.DeviceId,
                        TechnicianId = inspReq.TechnicianId ?? 0,
                        Status = "Completed",
                        InspectionStartedAt = now,
                        InspectionCompletedAt = now,
                        CreatedAt = now,
                        UpdatedAt = now
                    };
                    db.Inspection.Add(inspection);
                    await db.SaveChangesAsync();
                }

                // Calculate average test score
                decimal totalScore = 0;
                int validTestCount = 0;

                foreach (var test in dto.Tests)
                {
                    if (string.IsNullOrWhiteSpace(test.Component)) continue;

                    string compNameClean = test.Component.Trim();

                    decimal finalScore = test.Score;
                    if (string.Equals(test.Result, "Working", StringComparison.OrdinalIgnoreCase))
                    {
                        finalScore = 100;
                    }
                    else if (string.Equals(test.Result, "Fair", StringComparison.OrdinalIgnoreCase))
                    {
                        finalScore = 60;
                    }
                    else if (string.Equals(test.Result, "Not Working", StringComparison.OrdinalIgnoreCase))
                    {
                        finalScore = 0;
                    }

                    totalScore += finalScore;
                    validTestCount++;

                    // Save InspectionResult linked to InspectionId
                    var resultEntity = new InspectionResult
                    {
                        InspectionId = inspection.InspectionId,
                        CriteriaName = compNameClean,
                        Result = test.Result,
                        Remarks = test.Remarks,
                        Score = finalScore,
                        CreatedAt = now
                    };
                    db.InspectionResult.Add(resultEntity);
                    await db.SaveChangesAsync();

                    // Process & Save Photos into InspectionPhoto
                    if (test.PhotosBase64 != null && test.PhotosBase64.Count > 0)
                    {
                        string wwwRoot = env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                        string uploadsFolder = Path.Combine(wwwRoot, "uploads", "inspections", "photos");
                        if (!Directory.Exists(uploadsFolder))
                        {
                            Directory.CreateDirectory(uploadsFolder);
                        }

                        foreach (var photoStr in test.PhotosBase64)
                        {
                            if (string.IsNullOrWhiteSpace(photoStr)) continue;

                            string photoPath = "";
                            if (photoStr.StartsWith("data:image"))
                            {
                                var parts = photoStr.Split(',');
                                if (parts.Length > 1)
                                {
                                    byte[] imageBytes = Convert.FromBase64String(parts[1]);
                                    string ext = ".jpg";
                                    if (parts[0].Contains("png")) ext = ".png";
                                    else if (parts[0].Contains("webp")) ext = ".webp";

                                    string fileName = $"insp_{inspection.InspectionId}_{Guid.NewGuid()}{ext}";
                                    string fullPath = Path.Combine(uploadsFolder, fileName);
                                    await System.IO.File.WriteAllBytesAsync(fullPath, imageBytes);
                                    photoPath = $"/uploads/inspections/photos/{fileName}";
                                }
                            }
                            else
                            {
                                photoPath = photoStr;
                            }

                            if (!string.IsNullOrEmpty(photoPath))
                            {
                                var photoEntity = new InspectionPhoto
                                {
                                    InspectionResultId = resultEntity.InspectionResultId,
                                    PhotoPath = photoPath,
                                    PhotoType = compNameClean,
                                    Description = $"Part photo for {compNameClean}",
                                    UploadedAt = now
                                };
                                db.InspectionPhoto.Add(photoEntity);
                            }
                        }
                        await db.SaveChangesAsync();
                    }
                }

                // Update Inspection Entity summary fields
                decimal avgOverallScore = validTestCount > 0 ? Math.Round(totalScore / validTestCount, 2) : 100;
                inspection.Status = "Completed";
                if (!inspection.InspectionStartedAt.HasValue) inspection.InspectionStartedAt = now;
                inspection.InspectionCompletedAt = now;
                inspection.OverallScore = avgOverallScore;
                inspection.OverallCondition = dto.QualityGrade;
                inspection.RecommendedAction = dto.WasteDestination;
                inspection.TechnicianRemarks = dto.DiagnosticNotes;
                inspection.UpdatedAt = now;

                // Update InspectionRequest
                inspReq.RespondedAt = inspReq.RespondedAt ?? now;
                inspReq.UpdatedAt = now;
                inspReq.Status = "Completed";

                // Update Device Master Fields & Decision
                device.ProcessingDecision = dto.WasteDestination;
                device.ProcessingDecisionAt = now;
                device.Condition = dto.QualityGrade;
                device.Working = dto.PowerTest == "Pass" ? "Yes" : "No";
                device.PhysicalDamage = dto.PhysicalCondition;
                device.DisplayCondition = dto.ScreenIntegrity;
                device.BatteryCondition = dto.BatteryHealth;
                device.LifecycleStatus = "Inspected";
                device.ProcessingLifecycleStatus = "PendingCenterAllocation";
                device.Status = "Accepted";

                // Create Notification for Citizen
                int citizenLoginId = device.User?.Login?.LoginId ?? device.User?.LoginId ?? 0;
                if (citizenLoginId == 0 && device.UserId > 0)
                {
                    var u = await db.Users.Include(x => x.Login).FirstOrDefaultAsync(x => x.UserId == device.UserId);
                    citizenLoginId = u?.LoginId > 0 ? u.LoginId : (u?.Login?.LoginId ?? 0);
                }
                if (citizenLoginId > 0)
                {
                    var notif = new Notification
                    {
                        LoginId = citizenLoginId,
                        Title = "Device Inspection Completed",
                        Message = $"Inspection completed for your {device.Brand} {device.Model} (Device #{device.DeviceId}). Assigned Grade: {dto.QualityGrade}. Decision: {dto.WasteDestination}.",
                        Isread = false,
                        Status = true,
                        CreatedAt = now
                    };
                    db.Notification.Add(notif);
                }

                // Create Notification for Technician
                int techLoginId = 0;
                if (inspection.TechnicianId > 0)
                {
                    var t = await db.Technician.FirstOrDefaultAsync(tech => tech.TechnicianId == inspection.TechnicianId);
                    techLoginId = t?.LoginId ?? 0;
                }
                else if (inspReq.TechnicianId.HasValue && inspReq.TechnicianId.Value > 0)
                {
                    var t = await db.Technician.FirstOrDefaultAsync(tech => tech.TechnicianId == inspReq.TechnicianId.Value);
                    techLoginId = t?.LoginId ?? 0;
                }
                if (techLoginId > 0)
                {
                    db.Notification.Add(new Notification
                    {
                        LoginId = techLoginId,
                        Title = "Inspection Report Submitted",
                        Message = $"Inspection report for {device.Brand} {device.Model} (Device #{device.DeviceId}) was submitted successfully. Destination: {dto.WasteDestination}.",
                        Isread = false,
                        Status = true,
                        CreatedAt = now
                    });
                }

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Inspection report saved successfully and device status updated!",
                    deviceId = device.DeviceId,
                    inspectionId = inspection.InspectionId,
                    inspectionRequestId = inspReq.InspectionRequestId,
                    processingDecision = device.ProcessingDecision,
                    processingDecisionAt = device.ProcessingDecisionAt,
                    inspectionStartedAt = inspection.InspectionStartedAt,
                    inspectionCompletedAt = inspection.InspectionCompletedAt,
                    qualityGrade = dto.QualityGrade
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error submitting inspection report.", error = ex.Message });
            }
        }

        [HttpGet("results/{deviceId}")]
        public async Task<IActionResult> GetDeviceInspectionResults(int deviceId)
        {
            try
            {
                var inspection = await db.Inspection
                    .Include(i => i.Technician)
                        .ThenInclude(t => t!.Login)
                    .Include(i => i.Results!)
                        .ThenInclude(r => r.Photos)
                    .OrderByDescending(i => i.CreatedAt)
                    .FirstOrDefaultAsync(i => i.DeviceId == deviceId);

                if (inspection == null)
                {
                    var inspReq = await db.InspectionRequest
                        .Include(r => r.Technician)
                            .ThenInclude(t => t!.Login)
                        .OrderByDescending(r => r.CreatedAt)
                        .FirstOrDefaultAsync(r => r.DeviceId == deviceId);

                    if (inspReq == null)
                    {
                        return Ok(new { technicianName = (string?)null, technicianDetails = (object?)null, results = new List<object>() });
                    }

                    string? tName = inspReq.Technician != null ? $"{inspReq.Technician.FirstName} {inspReq.Technician.LastName}".Trim() : null;
                    object? tDetails = inspReq.Technician != null ? new
                    {
                        name = tName,
                        email = inspReq.Technician.Login?.Email ?? "N/A",
                        phone = inspReq.Technician.PhoneNumber ?? "N/A",
                        shopName = !string.IsNullOrWhiteSpace(inspReq.Technician.InspectionCenterName) 
                            ? inspReq.Technician.InspectionCenterName 
                            : "EcoCycle Primary Diagnostics Center",
                        employeeId = inspReq.Technician.EmployeeId ?? "N/A",
                        specialization = inspReq.Technician.Specialization ?? "Certified Hardware Inspector"
                    } : null;

                    return Ok(new
                    {
                        technicianName = tName,
                        technicianDetails = tDetails,
                        technicianId = inspReq.TechnicianId,
                        inspectionStartedAt = (DateTime?)null,
                        inspectionCompletedAt = (DateTime?)null,
                        results = new List<object>()
                    });
                }

                string? techName = null;
                object? techDetails = null;

                if (inspection.Technician != null)
                {
                    techName = $"{inspection.Technician.FirstName} {inspection.Technician.LastName}".Trim();
                    techDetails = new
                    {
                        name = techName,
                        email = inspection.Technician.Login?.Email ?? "N/A",
                        phone = inspection.Technician.PhoneNumber ?? "N/A",
                        shopName = !string.IsNullOrWhiteSpace(inspection.Technician.InspectionCenterName) 
                            ? inspection.Technician.InspectionCenterName 
                            : "EcoCycle Primary Diagnostics Center",
                        employeeId = inspection.Technician.EmployeeId ?? "N/A",
                        specialization = inspection.Technician.Specialization ?? "Certified Hardware Inspector"
                    };
                }

                var responseResults = (inspection.Results ?? new List<InspectionResult>()).Select(r => new
                {
                    inspectionResultId = r.InspectionResultId,
                    component = r.CriteriaName,
                    result = r.Result,
                    score = r.Score,
                    remarks = r.Remarks,
                    photos = (r.Photos ?? new List<InspectionPhoto>()).Select(p => new
                    {
                        inspectionPhotoId = p.InspectionPhotoId,
                        photoPath = p.PhotoPath,
                        photoType = p.PhotoType
                    }).ToList()
                });

                return Ok(new
                {
                    inspectionId = inspection.InspectionId,
                    inspectionRequestId = inspection.InspectionRequestId,
                    technicianName = techName,
                    technicianDetails = techDetails,
                    technicianId = inspection.TechnicianId,
                    inspectionStartedAt = inspection.InspectionStartedAt,
                    inspectionCompletedAt = inspection.InspectionCompletedAt,
                    overallScore = inspection.OverallScore,
                    overallCondition = inspection.OverallCondition,
                    recommendedAction = inspection.RecommendedAction,
                    technicianRemarks = inspection.TechnicianRemarks,
                    results = responseResults
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error loading inspection results.", error = ex.Message });
            }
        }
    }
}
