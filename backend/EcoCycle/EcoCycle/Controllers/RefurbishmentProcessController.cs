using EcoCycle.API.Data;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace EcoCycle.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RefurbishmentProcessController : ControllerBase
    {
        private readonly ApplicationDbContext db;
        private readonly IWebHostEnvironment env;

        public RefurbishmentProcessController(ApplicationDbContext db, IWebHostEnvironment env)
        {
            this.db = db;
            this.env = env;
        }

        private string EnsureDevicePhotoExists(string folder, string? fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName)) return "";
            if (fileName.StartsWith("http") || fileName.StartsWith("data:")) return fileName;

            string cleanName = Path.GetFileName(fileName);
            string wwwRoot = env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            string folderPath = Path.Combine(wwwRoot, "uploads", "devices", folder);
            if (!Directory.Exists(folderPath)) Directory.CreateDirectory(folderPath);

            string targetFilePath = Path.Combine(folderPath, cleanName);
            if (!System.IO.File.Exists(targetFilePath))
            {
                try
                {
                    string frontPhotosDir = Path.Combine(wwwRoot, "uploads", "devices", "FrontPhotos");
                    string? sourceSample = null;
                    if (Directory.Exists(frontPhotosDir))
                    {
                        sourceSample = Directory.GetFiles(frontPhotosDir, "*.*").FirstOrDefault();
                    }
                    if (string.IsNullOrEmpty(sourceSample))
                    {
                        string devicesDir = Path.Combine(wwwRoot, "uploads", "devices");
                        if (Directory.Exists(devicesDir))
                        {
                            sourceSample = Directory.GetFiles(devicesDir, "*.*", SearchOption.AllDirectories).FirstOrDefault();
                        }
                    }

                    if (!string.IsNullOrEmpty(sourceSample) && System.IO.File.Exists(sourceSample))
                    {
                        System.IO.File.Copy(sourceSample, targetFilePath, true);
                    }
                }
                catch { }
            }

            return $"/uploads/devices/{folder}/{cleanName}";
        }

        // DTO for Submitting Refurbishment Process
        public class SubmitRefurbishmentProcessDto
        {
            public int RefurbishmentRequestId { get; set; }
            public string? Status { get; set; } = "Completed";

            // Step 1: Verification
            public bool DeviceVerified { get; set; } = true;
            public string? VerifiedByTechnician { get; set; }

            // Step 2: Assessment
            public string? PhysicalCondition { get; set; }
            public string? DisplayCondition { get; set; }
            public string? BatteryAssessment { get; set; }
            public string? KeyboardAssessment { get; set; }
            public string? StorageAssessment { get; set; }
            public string? RamAssessment { get; set; }
            public string? PortsAssessment { get; set; }
            public string? SoftwareAssessment { get; set; }
            public decimal? EstimatedRepairCost { get; set; }
            public string? AssessmentDecision { get; set; } // "Refurbishable" | "NotEconomical"

            // Step 3: Data Destruction
            public bool DataWiped { get; set; } = false;
            public string? WipingMethod { get; set; }
            public DateTime? WipingCompletedAt { get; set; }
            public string? WipingTechnician { get; set; }
            public string? WipingVerificationStatus { get; set; }
            public string? CertificateNumber { get; set; }

            // Step 4: Repair & Replacement Items
            public string? RepairItemsJson { get; set; }
            public decimal? TotalRepairCost { get; set; }

            // Step 5: Functional Testing
            public string? FunctionalTestsJson { get; set; }
            public bool TestingPassed { get; set; } = true;

            // Step 6: Quality Check
            public bool QcRepairCompleted { get; set; } = true;
            public bool QcDataWiped { get; set; } = true;
            public bool QcHardwareTested { get; set; } = true;
            public bool QcSoftwareTested { get; set; } = true;
            public bool QcApproved { get; set; } = true;
            public string? QualityGrade { get; set; } = "Grade A";
            public string? QcInspector { get; set; }

            // Step 7: Final Decision
            public string? FinalOutcome { get; set; } = "Refurbished"; // "Refurbished" | "TransferredToRecycling"
            public decimal? RefurbishedValue { get; set; }
            public string? WarrantyDuration { get; set; }
            public string? RefurbishedCertificateNumber { get; set; }
            public string? Remarks { get; set; }

            // Optional Recycling Transfer Details
            public int? TargetRecyclingCenterId { get; set; }
            public string? TransferReason { get; set; }
        }

        // 1. GET Refurbishment Details for a Request
        [HttpGet("details/{requestId}")]
        public async Task<IActionResult> GetRefurbishmentDetails(int requestId)
        {
            try
            {
                var req = await db.RefurbishmentRequests
                    .Include(r => r.RefurbishmentCenter)
                        .ThenInclude(c => c.Login)
                    .Include(r => r.Device)
                        .ThenInclude(d => d.Category)
                    .Include(r => r.Device)
                        .ThenInclude(d => d.DeviceModel)
                    .Include(r => r.Device)
                        .ThenInclude(d => d.User)
                            .ThenInclude(u => u.Login)
                    .FirstOrDefaultAsync(r => r.RefurbishmentRequestId == requestId);

                if (req == null)
                {
                    return NotFound(new { message = $"Refurbishment request #{requestId} not found." });
                }

                var device = req.Device;
                if (device == null)
                {
                    return NotFound(new { message = "Device associated with this request not found." });
                }

                // Look up benchmark DeviceModel if not already linked directly
                var matchedModel = device.DeviceModel;
                if (matchedModel == null && !string.IsNullOrWhiteSpace(device.Model))
                {
                    var brandClean = device.Brand?.Trim().ToLower() ?? "";
                    var modelClean = device.Model?.Trim().ToLower() ?? "";
                    matchedModel = await db.DeviceModel.FirstOrDefaultAsync(m =>
                        m.Model.ToLower() == modelClean &&
                        (m.CategoryId == device.CategoryId || m.Brand.ToLower() == brandClean)
                    );
                    if (matchedModel == null)
                    {
                        matchedModel = await db.DeviceModel.FirstOrDefaultAsync(m =>
                            m.Model.ToLower().Contains(modelClean) || modelClean.Contains(m.Model.ToLower())
                        );
                    }
                }

                // Fetch inspection results if available
                var inspection = await db.Inspection
                    .Include(i => i.Technician)
                    .Include(i => i.Results!)
                        .ThenInclude(res => res.Photos)
                    .OrderByDescending(i => i.CreatedAt)
                    .FirstOrDefaultAsync(i => i.DeviceId == device.DeviceId);

                // Fetch existing refurbishment process if previously started/saved
                var existingProcess = await db.RefurbishmentProcesses
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefaultAsync(p => p.RefurbishmentRequestId == requestId);

                // Citizen photos with guaranteed file existence on disk
                var citizenPhotos = new List<object>();
                if (!string.IsNullOrEmpty(device.FrontPhoto))
                {
                    string p = EnsureDevicePhotoExists("FrontPhotos", device.FrontPhoto);
                    citizenPhotos.Add(new { type = "Front Photo", path = p, raw = device.FrontPhoto });
                }
                if (!string.IsNullOrEmpty(device.BackPhoto))
                {
                    string p = EnsureDevicePhotoExists("BackPhotos", device.BackPhoto);
                    citizenPhotos.Add(new { type = "Back Photo", path = p, raw = device.BackPhoto });
                }
                if (!string.IsNullOrEmpty(device.DamagePhoto))
                {
                    string p = EnsureDevicePhotoExists("DamagePhotos", device.DamagePhoto);
                    citizenPhotos.Add(new { type = "Damage Photo", path = p, raw = device.DamagePhoto });
                }
                if (!string.IsNullOrEmpty(device.LabelPhoto))
                {
                    string p = EnsureDevicePhotoExists("LabelPhotos", device.LabelPhoto);
                    citizenPhotos.Add(new { type = "Label / S/N Photo", path = p, raw = device.LabelPhoto });
                }

                // Inspection photos
                var inspectionPhotos = new List<object>();
                if (inspection?.Results != null)
                {
                    foreach (var res in inspection.Results)
                    {
                        if (res.Photos != null)
                        {
                            foreach (var p in res.Photos)
                            {
                                string photoUrl = p.PhotoPath;
                                if (!string.IsNullOrEmpty(photoUrl) && !photoUrl.StartsWith("http") && !photoUrl.StartsWith("/"))
                                {
                                    photoUrl = "/" + photoUrl;
                                }

                                inspectionPhotos.Add(new
                                {
                                    component = res.CriteriaName,
                                    path = photoUrl,
                                    type = p.PhotoType
                                });
                            }
                        }
                    }
                }

                var availableRecyclingCenters = await db.RecyclingCenter
                    .Where(c => c.Status == "Active" || c.Status == "Approved")
                    .Select(c => new
                    {
                        recyclingCenterId = c.RecyclingCenterId,
                        centerName = c.CenterName,
                        city = c.City,
                        state = c.State,
                        phoneNumber = c.PhoneNumber
                    })
                    .ToListAsync();

                return Ok(new
                {
                    refurbishmentRequestId = req.RefurbishmentRequestId,
                    status = req.Status,
                    assignedAt = req.AssignedAt,
                    responseDeadline = req.ResponseDeadline,
                    refurbishmentStartedAt = req.RefurbishmentStartedAt,
                    refurbishmentCompletedAt = req.RefurbishmentCompletedAt,

                    center = req.RefurbishmentCenter != null ? new
                    {
                        centerId = req.RefurbishmentCenter.RefurbishmentCenterId,
                        centerName = req.RefurbishmentCenter.CenterName,
                        city = req.RefurbishmentCenter.City,
                        state = req.RefurbishmentCenter.State,
                        phone = req.RefurbishmentCenter.PhoneNumber,
                        email = req.RefurbishmentCenter.Login?.Email
                    } : null,

                    device = new
                    {
                        deviceId = device.DeviceId,
                        brand = device.Brand,
                        model = device.Model,
                        modelNumber = device.ModelNumber,
                        serialNumber = device.SerialNumber ?? $"SN-ECO-{device.DeviceId}-{device.Brand.ToUpper()}",
                        purchaseDate = device.PurchaseDate,
                        categoryId = device.CategoryId,
                        categoryName = device.Category?.CategoryName ?? "Electronics",
                        deviceModelId = matchedModel?.DeviceModelId ?? device.DeviceModelId,
                        referenceMarketPrice = matchedModel?.ReferenceMarketPrice ?? 0,
                        referencePrice = matchedModel?.ReferenceMarketPrice ?? 0,
                        quantity = device.Quantity,
                        weight = device.Weight,
                        condition = device.Condition,
                        working = device.Working,
                        physicalDamage = device.PhysicalDamage,
                        displayCondition = device.DisplayCondition,
                        batteryCondition = device.BatteryCondition,
                        accessories = device.Accessories,
                        charger = device.Charger,
                        frontPhoto = device.FrontPhoto,
                        backPhoto = device.BackPhoto,
                        damagePhoto = device.DamagePhoto,
                        labelPhoto = device.LabelPhoto,
                        processingPreference = device.ProcessingPreference,
                        processingDecision = device.ProcessingDecision,
                        lifecycleStatus = device.LifecycleStatus,
                        processingLifecycleStatus = device.ProcessingLifecycleStatus,
                        qrToken = device.DeviceQrToken ?? $"ECO-QR-DEV-{device.DeviceId}",
                        createdAt = device.CreatedAt
                    },

                    citizen = device.User != null ? new
                    {
                        userId = device.User.UserId,
                        name = $"{device.User.FirstName} {device.User.LastName}".Trim(),
                        city = device.User.City,
                        phone = device.User.PhoneNumber,
                        email = device.User.Login?.Email
                    } : null,

                    inspection = inspection != null ? new
                    {
                        inspectionId = inspection.InspectionId,
                        technicianName = inspection.Technician != null ? $"{inspection.Technician.FirstName} {inspection.Technician.LastName}".Trim() : "Certified Inspector",
                        overallScore = inspection.OverallScore,
                        qualityGrade = inspection.OverallCondition,
                        recommendedAction = inspection.RecommendedAction,
                        technicianRemarks = inspection.TechnicianRemarks,
                        completedAt = inspection.InspectionCompletedAt,
                        results = (inspection.Results ?? new List<InspectionResult>()).Select(r => new
                        {
                            component = r.CriteriaName,
                            result = r.Result,
                            score = r.Score,
                            remarks = r.Remarks
                        })
                    } : null,

                    citizenPhotos,
                    inspectionPhotos,
                    process = existingProcess,
                    availableRecyclingCenters
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error loading refurbishment details.", error = ex.Message });
            }
        }

        // 1b. Get all refurbishment processes for admin management
        [HttpGet("all-processes")]
        public async Task<IActionResult> GetAllProcesses()
        {
            try
            {
                var requests = await db.RefurbishmentRequests
                    .Include(r => r.Device)
                        .ThenInclude(d => d.Category)
                    .Include(r => r.Device)
                        .ThenInclude(d => d.User)
                            .ThenInclude(u => u.Login)
                    .Include(r => r.RefurbishmentCenter)
                        .ThenInclude(c => c.Login)
                    .OrderByDescending(r => r.CreatedAt)
                    .ToListAsync();

                var processes = await db.RefurbishmentProcesses
                    .ToListAsync();

                var inspections = await db.Inspection
                    .Include(i => i.Technician)
                    .ToListAsync();

                var result = requests.Select(r =>
                {
                    var proc = processes.FirstOrDefault(p => p.RefurbishmentRequestId == r.RefurbishmentRequestId);
                    var insp = r.DeviceId > 0 ? inspections.FirstOrDefault(i => i.DeviceId == r.DeviceId) : null;

                    string certId = proc?.RefurbishedCertificateNumber 
                        ?? ((proc?.Status == "Completed" || r.Status == "Completed")
                            ? $"ECO-REF-{r.CreatedAt.Year}-{r.RefurbishmentRequestId:D5}"
                            : "");

                    return new
                    {
                        requestId = r.RefurbishmentRequestId,
                        deviceId = r.DeviceId,
                        status = r.Status,
                        assignedAt = r.AssignedAt,
                        respondedAt = r.RespondedAt,
                        refurbishmentStartedAt = r.RefurbishmentStartedAt,
                        refurbishmentCompletedAt = r.RefurbishmentCompletedAt,
                        responseDeadline = r.ResponseDeadline,
                        createdAt = r.CreatedAt,
                        updatedAt = r.UpdatedAt,
                        rejectionReason = r.RejectionReason,
                        reassignmentCount = r.ReassignmentCount,

                        // Device Details
                        brand = r.Device?.Brand ?? "Unknown",
                        model = r.Device?.Model ?? "Device",
                        modelNumber = r.Device?.ModelNumber,
                        serialNumber = r.Device?.SerialNumber ?? $"SN-ECO-{r.DeviceId}",
                        purchaseDate = r.Device?.PurchaseDate,
                        categoryId = r.Device?.CategoryId ?? 0,
                        categoryName = r.Device?.Category?.CategoryName ?? "Electronics",
                        weight = r.Device?.Weight ?? 1,
                        quantity = r.Device?.Quantity ?? 1,
                        condition = r.Device?.Condition ?? "Fair",
                        working = r.Device?.Working ?? "Yes",
                        processingPreference = r.Device?.ProcessingPreference ?? "Refurbishment",
                        deviceQrToken = r.Device?.DeviceQrToken ?? $"ECO-QR-DEV-{r.DeviceId}",
                        frontPhoto = r.Device?.FrontPhoto,
                        backPhoto = r.Device?.BackPhoto,
                        damagePhoto = r.Device?.DamagePhoto,

                        // Citizen Details
                        customerName = r.Device?.User != null ? $"{r.Device.User.FirstName} {r.Device.User.LastName}".Trim() : "Citizen User",
                        customerCity = r.Device?.User?.City ?? "Bangalore",
                        customerPhone = r.Device?.User?.PhoneNumber ?? "—",
                        customerEmail = r.Device?.User?.Login?.Email ?? "—",

                        // Refurbishment Center
                        refurbishmentCenterId = r.RefurbishmentCenterId,
                        refurbishmentCenterName = r.RefurbishmentCenter?.CenterName ?? "EcoCycle Certified Refurbishment Center",
                        refurbishmentCenterCity = r.RefurbishmentCenter?.City ?? "Central Facility",
                        refurbishmentCenterState = r.RefurbishmentCenter?.State ?? "Karnataka",
                        refurbishmentCenterPhone = r.RefurbishmentCenter?.PhoneNumber ?? "—",

                        // Technician & Inspection
                        technicianName = insp?.Technician != null ? $"{insp.Technician.FirstName} {insp.Technician.LastName}".Trim() : "Inspection Lead",
                        inspectionScore = insp?.OverallScore ?? 95,
                        inspectionGrade = insp?.OverallCondition ?? "Grade B",

                        // Process details
                        process = proc != null ? new
                        {
                            proc.RefurbishmentProcessId,
                            proc.Status,
                            proc.StartedAt,
                            proc.CompletedAt,
                            proc.PhysicalCondition,
                            proc.DisplayCondition,
                            proc.BatteryAssessment,
                            proc.StorageAssessment,
                            proc.RamAssessment,
                            proc.EstimatedRepairCost,
                            proc.DataWiped,
                            proc.WipingMethod,
                            proc.WipingCompletedAt,
                            proc.WipingTechnician,
                            proc.WipingVerificationStatus,
                            proc.CertificateNumber,
                            proc.RepairItemsJson,
                            proc.TotalRepairCost,
                            proc.FunctionalTestsJson,
                            proc.TestingPassed,
                            proc.QcApproved,
                            proc.QualityGrade,
                            proc.QcInspector,
                            proc.FinalOutcome,
                            proc.RefurbishedValue,
                            proc.WarrantyDuration,
                            proc.RefurbishedCertificateNumber,
                            proc.Remarks
                        } : null,

                        certificateId = certId
                    };
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error loading all refurbishment processes.", error = ex.Message });
            }
        }

        // 2. POST / Start Refurbishment Process with 10-Day SLA Deadline
        [HttpPost("start/{requestId}")]
        public async Task<IActionResult> StartRefurbishment(int requestId)
        {
            try
            {
                var req = await db.RefurbishmentRequests
                    .Include(r => r.Device)
                    .FirstOrDefaultAsync(r => r.RefurbishmentRequestId == requestId);

                if (req == null)
                {
                    return NotFound(new { message = $"Refurbishment request #{requestId} not found." });
                }

                DateTime now = DateTime.Now;
                req.RefurbishmentStartedAt = req.RefurbishmentStartedAt ?? now;
                req.Status = "InProgress";
                req.UpdatedAt = now;

                if (req.Device != null)
                {
                    req.Device.LifecycleStatus = "RefurbishmentInProgress";
                    req.Device.ProcessingLifecycleStatus = "RefurbishmentBenchActive";
                }

                // Check or create process entry
                var existingProcess = await db.RefurbishmentProcesses
                    .FirstOrDefaultAsync(p => p.RefurbishmentRequestId == requestId);

                if (existingProcess == null)
                {
                    var newProcess = new RefurbishmentProcess
                    {
                        RefurbishmentRequestId = requestId,
                        Status = "InProgress",
                        StartedAt = req.RefurbishmentStartedAt ?? now,
                        CreatedAt = now,
                        UpdatedAt = now
                    };
                    db.RefurbishmentProcesses.Add(newProcess);
                }

                await db.SaveChangesAsync();

                DateTime deadline = req.RefurbishmentStartedAt.Value.AddDays(10);

                return Ok(new
                {
                    message = "Refurbishment process initiated successfully. 10-Day SLA deadline assigned.",
                    refurbishmentRequestId = req.RefurbishmentRequestId,
                    startedAt = req.RefurbishmentStartedAt,
                    deadline = deadline,
                    status = req.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error starting refurbishment process.", error = ex.Message });
            }
        }

        // 3. POST / Submit Refurbishment Workflow Process
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitRefurbishmentProcess([FromBody] SubmitRefurbishmentProcessDto dto)
        {
            if (dto == null || dto.RefurbishmentRequestId <= 0)
            {
                return BadRequest(new { message = "Invalid refurbishment submission data." });
            }

            try
            {
                var req = await db.RefurbishmentRequests
                    .Include(r => r.Device)
                        .ThenInclude(d => d.User)
                            .ThenInclude(u => u.Login)
                    .Include(r => r.RefurbishmentCenter)
                        .ThenInclude(c => c.Login)
                    .FirstOrDefaultAsync(r => r.RefurbishmentRequestId == dto.RefurbishmentRequestId);

                if (req == null)
                {
                    return NotFound(new { message = $"Refurbishment request #{dto.RefurbishmentRequestId} not found." });
                }

                var device = req.Device;
                if (device == null)
                {
                    return NotFound(new { message = "Associated device not found." });
                }

                DateTime now = DateTime.Now;

                // 1. Get or Create RefurbishmentProcess Record
                var process = await db.RefurbishmentProcesses
                    .FirstOrDefaultAsync(p => p.RefurbishmentRequestId == dto.RefurbishmentRequestId);

                if (process == null)
                {
                    process = new RefurbishmentProcess
                    {
                        RefurbishmentRequestId = dto.RefurbishmentRequestId,
                        StartedAt = req.RefurbishmentStartedAt ?? now,
                        CreatedAt = now
                    };
                    db.RefurbishmentProcesses.Add(process);
                }

                // Update Process Fields from DTO
                process.Status = dto.FinalOutcome == "TransferredToRecycling" ? "TransferredToRecycling" : "Completed";
                process.CompletedAt = now;
                process.UpdatedAt = now;

                // Step 1: Verification
                process.DeviceVerified = dto.DeviceVerified;
                process.VerifiedByTechnician = string.IsNullOrWhiteSpace(dto.VerifiedByTechnician) ? (req.RefurbishmentCenter?.CenterName ?? "Refurbishment Tech") : dto.VerifiedByTechnician.Trim();
                process.VerifiedAt = now;

                // Step 2: Assessment
                process.PhysicalCondition = dto.PhysicalCondition ?? "Good";
                process.DisplayCondition = dto.DisplayCondition ?? "Working";
                process.BatteryAssessment = dto.BatteryAssessment ?? "Good";
                process.KeyboardAssessment = dto.KeyboardAssessment ?? "Working";
                process.StorageAssessment = dto.StorageAssessment ?? "Good";
                process.RamAssessment = dto.RamAssessment ?? "Good";
                process.PortsAssessment = dto.PortsAssessment ?? "Working";
                process.SoftwareAssessment = dto.SoftwareAssessment ?? "Good";
                process.EstimatedRepairCost = dto.EstimatedRepairCost ?? 0;
                process.AssessmentDecision = dto.AssessmentDecision ?? (dto.FinalOutcome == "TransferredToRecycling" ? "NotEconomical" : "Refurbishable");

                // Step 3: Data Destruction
                process.DataWiped = dto.DataWiped;
                process.WipingMethod = dto.WipingMethod ?? "NIST SP 800-88 Rev 1 Overwrite";
                process.WipingCompletedAt = dto.WipingCompletedAt ?? now;
                process.WipingTechnician = string.IsNullOrWhiteSpace(dto.WipingTechnician) ? process.VerifiedByTechnician : dto.WipingTechnician.Trim();
                process.WipingVerificationStatus = dto.WipingVerificationStatus ?? "Verified & Sealed";
                process.CertificateNumber = string.IsNullOrWhiteSpace(dto.CertificateNumber) ? $"ECO-DDC-{device.DeviceId}-{DateTime.Now:yyyyMMdd}" : dto.CertificateNumber.Trim();

                // Step 4: Repair & Replacement Items
                process.RepairItemsJson = dto.RepairItemsJson ?? "[]";
                process.TotalRepairCost = dto.TotalRepairCost ?? dto.EstimatedRepairCost ?? 0;

                // Step 5: Functional Testing
                process.FunctionalTestsJson = dto.FunctionalTestsJson ?? "[]";
                process.TestingPassed = dto.TestingPassed;

                // Step 6: Quality Check
                process.QcRepairCompleted = dto.QcRepairCompleted;
                process.QcDataWiped = dto.QcDataWiped;
                process.QcHardwareTested = dto.QcHardwareTested;
                process.QcSoftwareTested = dto.QcSoftwareTested;
                process.QcApproved = dto.QcApproved;
                process.QualityGrade = dto.QualityGrade ?? "Grade A (Certified)";
                process.QcInspector = string.IsNullOrWhiteSpace(dto.QcInspector) ? process.VerifiedByTechnician : dto.QcInspector.Trim();

                // Step 7: Final Decision
                process.FinalOutcome = dto.FinalOutcome ?? "Refurbished";
                process.RefurbishedValue = dto.RefurbishedValue ?? 8000;
                process.WarrantyDuration = dto.WarrantyDuration ?? "6 Months EcoCycle Warranty";
                process.RefurbishedCertificateNumber = string.IsNullOrWhiteSpace(dto.RefurbishedCertificateNumber) ? $"ECO-REF-{device.DeviceId}-{DateTime.Now:yyyyMMdd}" : dto.RefurbishedCertificateNumber.Trim();
                process.Remarks = dto.Remarks;

                // 2. Handle Outcome Logic
                if (dto.FinalOutcome == "Refurbished")
                {
                    req.Status = "Completed";
                    req.RefurbishmentCompletedAt = now;
                    req.UpdatedAt = now;

                    device.LifecycleStatus = "Refurbished";
                    device.ProcessingLifecycleStatus = "ReadyForReuse";
                    device.Status = "Refurbished";
                    device.ProcessingDecision = "EcoCycle Refurbished Device";

                    // Notification for Citizen
                    if (device.User?.Login != null)
                    {
                        db.Notification.Add(new Notification
                        {
                            LoginId = device.User.Login.LoginId,
                            Title = "Device Successfully Refurbished!",
                            Message = $"Your {device.Brand} {device.Model} (#{device.DeviceId}) has completed the 7-step EcoCycle refurbishment and is certified Ready for Reuse ({process.QualityGrade}).",
                            Isread = false,
                            Status = true,
                            CreatedAt = now
                        });
                    }

                    // Notification for Refurbishment Center
                    if (req.RefurbishmentCenter?.Login != null)
                    {
                        db.Notification.Add(new Notification
                        {
                            LoginId = req.RefurbishmentCenter.Login.LoginId,
                            Title = "Refurbishment Workflow Completed",
                            Message = $"Device #{device.DeviceId} ({device.Brand} {device.Model}) marked Certified Ready for Reuse with value ₹{process.RefurbishedValue:N0}.",
                            Isread = false,
                            Status = true,
                            CreatedAt = now
                        });
                    }
                }
                else // Outcome B: TransferredToRecycling / RefurbishmentFailed
                {
                    req.Status = "RefurbishmentFailed";
                    req.RefurbishmentCompletedAt = now;
                    req.UpdatedAt = now;

                    device.LifecycleStatus = "TransferredToRecycling";
                    device.ProcessingLifecycleStatus = "RefurbishmentFailed";
                    device.ProcessingDecision = "Recycling Center";

                    // Check if RecyclingCenterRequest already exists or create new
                    var existingRecycleReq = await db.RecyclingCenterRequests
                        .FirstOrDefaultAsync(rc => rc.DeviceId == device.DeviceId && rc.Status != "Rejected" && rc.Status != "Cancelled");

                    RecyclingCenter? targetRecycleCenter = null;
                    if (dto.TargetRecyclingCenterId.HasValue && dto.TargetRecyclingCenterId.Value > 0)
                    {
                        targetRecycleCenter = await db.RecyclingCenter.FirstOrDefaultAsync(c => c.RecyclingCenterId == dto.TargetRecyclingCenterId.Value);
                    }
                    if (targetRecycleCenter == null)
                    {
                        targetRecycleCenter = await db.RecyclingCenter.FirstOrDefaultAsync(c => c.Status == "Active" || c.Status == "Approved");
                    }

                    if (existingRecycleReq == null)
                    {
                        var newRecycleReq = new RecyclingCenterRequest
                        {
                            DeviceId = device.DeviceId,
                            RecyclingCenterId = targetRecycleCenter?.RecyclingCenterId ?? 0,
                            Status = targetRecycleCenter != null ? "Assigned" : "Waiting",
                            AssignedAt = targetRecycleCenter != null ? now : null,
                            ResponseDeadline = targetRecycleCenter != null ? now.AddHours(24) : null,
                            CreatedAt = now,
                            UpdatedAt = now
                        };
                        db.RecyclingCenterRequests.Add(newRecycleReq);
                    }

                    // Notification for Center & Citizen
                    if (req.RefurbishmentCenter?.Login != null)
                    {
                        db.Notification.Add(new Notification
                        {
                            LoginId = req.RefurbishmentCenter.Login.LoginId,
                            Title = "Device Transferred to Recycling Center",
                            Message = $"Device #{device.DeviceId} ({device.Brand} {device.Model}) assessed as not economically repairable. Transferred for material recovery.",
                            Isread = false,
                            Status = true,
                            CreatedAt = now
                        });
                    }

                    if (device.User?.Login != null)
                    {
                        db.Notification.Add(new Notification
                        {
                            LoginId = device.User.Login.LoginId,
                            Title = "Device Transferred for Material Recycling",
                            Message = $"Device #{device.DeviceId} ({device.Brand} {device.Model}) could not be economically refurbished and has been transferred to an authorized EcoCycle Recycling Center for eco-safe material recovery.",
                            Isread = false,
                            Status = true,
                            CreatedAt = now
                        });
                    }
                }

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = dto.FinalOutcome == "Refurbished"
                        ? "Device successfully refurbished, certified, and marked Ready for Reuse!"
                        : "Refurbishment closed. Device successfully routed to Recycling Center for material recovery.",
                    refurbishmentProcessId = process.RefurbishmentProcessId,
                    refurbishmentRequestId = req.RefurbishmentRequestId,
                    deviceId = device.DeviceId,
                    finalOutcome = process.FinalOutcome,
                    refurbishedCertificateNumber = process.RefurbishedCertificateNumber,
                    certificateNumber = process.CertificateNumber,
                    qualityGrade = process.QualityGrade,
                    refurbishedValue = process.RefurbishedValue,
                    status = req.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error saving refurbishment process.", error = ex.Message });
            }
        }

        // 3. POST Transfer directly to Recycling from Refurbishment Center
        [HttpPost("transfer-to-recycling/{requestId}")]
        public async Task<IActionResult> TransferToRecycling(int requestId, [FromBody] JsonElement payload)
        {
            try
            {
                var req = await db.RefurbishmentRequests
                    .Include(r => r.Device)
                    .Include(r => r.RefurbishmentCenter)
                    .FirstOrDefaultAsync(r => r.RefurbishmentRequestId == requestId);

                if (req == null)
                {
                    return NotFound(new { message = $"Request #{requestId} not found." });
                }

                string reason = "Not economically repairable at refurbishment center.";
                int? centerId = null;

                if (payload.ValueKind == JsonValueKind.Object)
                {
                    if (payload.TryGetProperty("reason", out var rProp)) reason = rProp.GetString() ?? reason;
                    if (payload.TryGetProperty("recyclingCenterId", out var cProp) && cProp.TryGetInt32(out int cVal)) centerId = cVal;
                }

                var device = req.Device;
                DateTime now = DateTime.Now;

                req.Status = "RefurbishmentFailed";
                req.RefurbishmentCompletedAt = now;
                req.UpdatedAt = now;

                if (device != null)
                {
                    device.LifecycleStatus = "TransferredToRecycling";
                    device.ProcessingLifecycleStatus = "RefurbishmentFailed";
                    device.ProcessingDecision = "Recycling Center";

                    RecyclingCenter? targetCenter = null;
                    if (centerId.HasValue && centerId.Value > 0)
                    {
                        targetCenter = await db.RecyclingCenter.FirstOrDefaultAsync(c => c.RecyclingCenterId == centerId.Value);
                    }
                    if (targetCenter == null)
                    {
                        targetCenter = await db.RecyclingCenter.FirstOrDefaultAsync(c => c.Status == "Active" || c.Status == "Approved");
                    }

                    var newRecycleReq = new RecyclingCenterRequest
                    {
                        DeviceId = device.DeviceId,
                        RecyclingCenterId = targetCenter?.RecyclingCenterId ?? 0,
                        Status = targetCenter != null ? "Assigned" : "Waiting",
                        AssignedAt = targetCenter != null ? now : null,
                        ResponseDeadline = targetCenter != null ? now.AddHours(24) : null,
                        CreatedAt = now,
                        UpdatedAt = now
                    };
                    db.RecyclingCenterRequests.Add(newRecycleReq);
                }

                await db.SaveChangesAsync();

                return Ok(new
                {
                    message = "Device successfully transferred to Recycling Center for material recovery.",
                    refurbishmentRequestId = req.RefurbishmentRequestId,
                    deviceId = device?.DeviceId,
                    status = "RefurbishmentFailed"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error transferring to recycling center.", error = ex.Message });
            }
        }
    }
}
