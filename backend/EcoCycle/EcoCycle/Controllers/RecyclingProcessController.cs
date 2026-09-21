using EcoCycle.API.Data;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcoCycle.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecyclingProcessController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RecyclingProcessController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Get components for a specific device based on DeviceModel -> DeviceModelComponent -> ComponentType
        [HttpGet("components/{deviceId}")]
        public async Task<IActionResult> GetDeviceComponents(int deviceId)
        {
            try
            {
                await EnsureComponentTypesSeededAsync();

                var device = await _context.Device
                    .Include(d => d.Category)
                    .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

                if (device == null)
                {
                    return NotFound(new { message = "Device not found." });
                }

                DeviceModel? deviceModel = null;

                // 1. Check if device already has DeviceModelId linked
                if (device.DeviceModelId.HasValue)
                {
                    deviceModel = await _context.DeviceModel
                        .Include(dm => dm.DeviceModelComponents)
                            .ThenInclude(dmc => dmc.ComponentType)
                        .FirstOrDefaultAsync(dm => dm.DeviceModelId == device.DeviceModelId.Value);
                }

                // 2. Exact match by Brand + Model (+ ModelNumber)
                if (deviceModel == null)
                {
                    string brandClean = (device.Brand ?? "").Trim().ToLower();
                    string modelClean = (device.Model ?? "").Trim().ToLower();
                    string modelNumClean = (device.ModelNumber ?? "").Trim().ToLower();

                    if (!string.IsNullOrWhiteSpace(modelNumClean))
                    {
                        deviceModel = await _context.DeviceModel
                            .Include(dm => dm.DeviceModelComponents)
                                .ThenInclude(dmc => dmc.ComponentType)
                            .FirstOrDefaultAsync(dm =>
                                dm.Brand.ToLower() == brandClean &&
                                dm.Model.ToLower() == modelClean &&
                                dm.ModelNumber != null && dm.ModelNumber.ToLower() == modelNumClean);
                    }

                    if (deviceModel == null && !string.IsNullOrWhiteSpace(brandClean) && !string.IsNullOrWhiteSpace(modelClean))
                    {
                        deviceModel = await _context.DeviceModel
                            .Include(dm => dm.DeviceModelComponents)
                                .ThenInclude(dmc => dmc.ComponentType)
                            .FirstOrDefaultAsync(dm =>
                                dm.Brand.ToLower() == brandClean &&
                                dm.Model.ToLower() == modelClean);
                    }

                    if (deviceModel != null)
                    {
                        device.DeviceModelId = deviceModel.DeviceModelId;
                        await _context.SaveChangesAsync();
                    }
                }

                // 3. Create dedicated DeviceModel if none exists yet
                if (deviceModel == null)
                {
                    deviceModel = new DeviceModel
                    {
                        CategoryId = device.CategoryId,
                        Brand = string.IsNullOrWhiteSpace(device.Brand) ? "Generic" : device.Brand.Trim(),
                        Model = string.IsNullOrWhiteSpace(device.Model) ? "Electronic Device" : device.Model.Trim(),
                        ModelNumber = device.ModelNumber,
                        Weight = device.Weight,
                        IsActive = true,
                        CreatedAt = DateTime.Now
                    };

                    _context.DeviceModel.Add(deviceModel);
                    await _context.SaveChangesAsync();

                    device.DeviceModelId = deviceModel.DeviceModelId;
                    await _context.SaveChangesAsync();
                }

                // 4. Ensure components are mapped specifically to this DeviceModelId
                if (!deviceModel.DeviceModelComponents.Any())
                {
                    string catName = device.Category?.CategoryName ?? "";
                    await EnsureDeviceModelComponentsAsync(deviceModel, catName);
                }

                // 5. Return ONLY components mapped to this DeviceModelId
                var componentsResult = deviceModel.DeviceModelComponents
                    .Where(dmc => dmc.ComponentType != null)
                    .Select(dmc => new
                    {
                        componentTypeId = dmc.ComponentTypeId,
                        name = dmc.ComponentType!.ComponentName,
                        handling = dmc.ComponentType.HandlingType,
                        isHazardous = dmc.ComponentType.IsHazardous,
                        description = dmc.ComponentType.Description ?? "Component mapped to device model.",
                        estimatedMassRatio = getEstimatedMassRatio(dmc.ComponentType.ComponentName)
                    }).ToList();

                return Ok(new
                {
                    deviceId = device.DeviceId,
                    deviceModelId = deviceModel.DeviceModelId,
                    brand = device.Brand,
                    model = device.Model,
                    modelNumber = device.ModelNumber,
                    categoryName = device.Category?.CategoryName,
                    totalWeightKg = device.Weight > 0 ? device.Weight : 15,
                    components = componentsResult
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching device components.", error = ex.Message });
            }
        }

        private static double getEstimatedMassRatio(string? compName)
        {
            if (string.IsNullOrEmpty(compName)) return 0.15;
            string lower = compName.ToLower();
            if (lower.Contains("battery")) return 0.22;
            if (lower.Contains("pcb") || lower.Contains("circuit") || lower.Contains("processor")) return 0.18;
            if (lower.Contains("glass") || lower.Contains("display") || lower.Contains("crt")) return 0.28;
            if (lower.Contains("copper") || lower.Contains("cabling") || lower.Contains("wire")) return 0.12;
            if (lower.Contains("aluminium") || lower.Contains("heatsink")) return 0.10;
            return 0.10;
        }

        // 2. Active material market prices
        [HttpGet("material-prices")]
        public IActionResult GetMaterialPrices()
        {
            var prices = new List<object>
            {
                new { materialName = "Copper Wire / Coils", unit = "kg", pricePerUnit = 750.00, category = "Base Metal" },
                new { materialName = "Aluminium Alloys", unit = "kg", pricePerUnit = 220.00, category = "Base Metal" },
                new { materialName = "Structural Steel & Iron", unit = "kg", pricePerUnit = 65.00, category = "Ferrous Metal" },
                new { materialName = "Recyclable Polymer Plastics", unit = "kg", pricePerUnit = 80.00, category = "Plastics" },
                new { materialName = "Display Glass Substrate", unit = "kg", pricePerUnit = 40.00, category = "Glass" },
                new { materialName = "High-Grade PCB / E-Scrap", unit = "kg", pricePerUnit = 1250.00, category = "Precious Metal Bearing" },
                new { materialName = "Recovered Fine Gold", unit = "kg", pricePerUnit = 6500000.00, category = "Precious Metal" },
                new { materialName = "Recovered Fine Silver", unit = "kg", pricePerUnit = 85000.00, category = "Precious Metal" },
                new { materialName = "Lithium Battery Cells", unit = "kg", pricePerUnit = 350.00, category = "Specialized Recovery" }
            };

            return Ok(prices);
        }

        // 3. Get existing process details & saved progress
        [HttpGet("process-details/{requestId}")]
        public async Task<IActionResult> GetProcessDetails(int requestId)
        {
            try
            {
                var request = await _context.RecyclingCenterRequests
                    .Include(r => r.Device)
                        .ThenInclude(d => d.Category)
                    .Include(r => r.Device)
                        .ThenInclude(d => d.User)
                    .Include(r => r.RecyclingCenter)
                    .FirstOrDefaultAsync(r => r.RecyclingCenterRequestId == requestId);

                if (request == null)
                {
                    return NotFound(new { message = "Recycling request not found." });
                }

                var process = await _context.RecyclingProcesses
                    .FirstOrDefaultAsync(p => p.RecyclingCenterRequestId == requestId);

                var recoveredMaterialsList = process != null
                    ? (await _context.RecoveredMaterials
                        .Where(rm => rm.RecyclingProccessId == process.RecyclingProcessId)
                        .Select(rm => new
                        {
                            rm.RecoveredMaterialId,
                            rm.MaterialName,
                            rm.Quantity,
                            rm.Unit,
                            rm.PricePerUnit,
                            rm.EstimatedValue
                        })
                        .ToListAsync()).Cast<object>().ToList()
                    : new List<object>();

                return Ok(new
                {
                    requestId = request.RecyclingCenterRequestId,
                    deviceId = request.DeviceId,
                    status = request.Status,
                    device = new
                    {
                        brand = request.Device?.Brand,
                        model = request.Device?.Model,
                        modelNumber = request.Device?.ModelNumber,
                        serialNumber = request.Device?.SerialNumber ?? "SN-" + request.DeviceId.ToString("D6"),
                        categoryName = request.Device?.Category?.CategoryName,
                        quantity = request.Device?.Quantity ?? 1,
                        weight = request.Device?.Weight ?? 15,
                        customerName = request.Device?.User != null ? $"{request.Device.User.FirstName} {request.Device.User.LastName}".Trim() : "Customer",
                        customerCity = request.Device?.User?.City ?? "City Hub",
                        deviceQrToken = request.Device?.DeviceQrToken ?? $"QR-ECO-{request.DeviceId}"
                    },
                    center = request.RecyclingCenter != null ? new
                    {
                        centerId = request.RecyclingCenter.RecyclingCenterId,
                        centerName = request.RecyclingCenter.CenterName,
                        city = request.RecyclingCenter.City,
                        state = request.RecyclingCenter.State,
                        hazardousWasteHandling = request.RecyclingCenter.HazardousWasteHandling,
                        recyclingProcesses = request.RecyclingCenter.RecyclingProcesses
                    } : null,
                    process = process != null ? new
                    {
                        recyclingProcessId = process.RecyclingProcessId,
                        status = process.Status,
                        startedAt = process.StartedAt,
                        completedAt = process.CompletedAt,
                        totalRecoveredWeight = process.TotalRecoveredWeight,
                        totalMaterialValue = process.TotalMaterialValue,
                        processingCost = process.ProcessingCost ?? 400.00m,
                        netRecoveryValue = process.NetRecoveryValue,
                        hazardousWasteWeight = process.HazardousWasteWeight,
                        hazardousWasteDetails = process.HazardousWasteDetails,
                        disposalMethod = process.DisposalMethod,
                        notes = process.Notes
                    } : null,
                    recoveredMaterials = recoveredMaterialsList
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error loading process details.", error = ex.Message });
            }
        }

        // 4. Start recycling process (Update request status to Processing)
        [HttpPost("start/{requestId}")]
        public async Task<IActionResult> StartProcess(int requestId)
        {
            try
            {
                var request = await _context.RecyclingCenterRequests
                    .Include(r => r.Device)
                    .FirstOrDefaultAsync(r => r.RecyclingCenterRequestId == requestId);

                if (request == null)
                    return NotFound(new { message = "Request not found." });

                request.Status = "Processing";
                request.UpdatedAt = DateTime.Now;

                if (request.Device != null)
                {
                    request.Device.LifecycleStatus = "In Recycling";
                }

                var process = await _context.RecyclingProcesses
                    .FirstOrDefaultAsync(p => p.RecyclingCenterRequestId == requestId);

                if (process == null)
                {
                    process = new RecyclingProcess
                    {
                        RecyclingCenterRequestId = requestId,
                        Status = "Processing",
                        StartedAt = DateTime.Now,
                        ProcessingCost = 400.00m,
                        CreatedAt = DateTime.Now
                    };
                    _context.RecyclingProcesses.Add(process);
                }
                else
                {
                    process.Status = "Processing";
                    process.UpdatedAt = DateTime.Now;
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Recycling process started successfully.",
                    status = request.Status,
                    recyclingProcessId = process.RecyclingProcessId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error starting process.", error = ex.Message });
            }
        }

        // 5. Save process materials & progress
        [HttpPost("save-progress")]
        public async Task<IActionResult> SaveProgress([FromBody] SaveProcessProgressDto dto)
        {
            try
            {
                var request = await _context.RecyclingCenterRequests
                    .Include(r => r.Device)
                    .FirstOrDefaultAsync(r => r.RecyclingCenterRequestId == dto.RequestId);

                if (request == null)
                    return NotFound(new { message = "Request not found." });

                var process = await _context.RecyclingProcesses
                    .FirstOrDefaultAsync(p => p.RecyclingCenterRequestId == dto.RequestId);

                if (process == null)
                {
                    process = new RecyclingProcess
                    {
                        RecyclingCenterRequestId = dto.RequestId,
                        Status = request.Status,
                        StartedAt = DateTime.Now,
                        CreatedAt = DateTime.Now
                    };
                    _context.RecyclingProcesses.Add(process);
                    await _context.SaveChangesAsync();
                }

                process.ProcessingCost = dto.ProcessingCost ?? 400.00m;
                process.HazardousWasteDetails = dto.HazardousWasteDetails;
                process.Notes = dto.Notes;
                process.UpdatedAt = DateTime.Now;

                // Update Recovered Materials
                var existingMaterials = await _context.RecoveredMaterials
                    .Where(rm => rm.RecyclingProccessId == process.RecyclingProcessId)
                    .ToListAsync();

                _context.RecoveredMaterials.RemoveRange(existingMaterials);

                decimal totalWeight = 0;
                decimal totalValue = 0;

                if (dto.RecoveredMaterials != null && dto.RecoveredMaterials.Any())
                {
                    foreach (var item in dto.RecoveredMaterials)
                    {
                        decimal itemValue = item.Quantity * item.PricePerUnit;
                        totalWeight += item.Quantity;
                        totalValue += itemValue;

                        _context.RecoveredMaterials.Add(new RecoveredMaterials
                        {
                            RecyclingProccessId = process.RecyclingProcessId,
                            MaterialName = item.MaterialName,
                            Quantity = item.Quantity,
                            Unit = string.IsNullOrWhiteSpace(item.Unit) ? "kg" : item.Unit,
                            PricePerUnit = item.PricePerUnit,
                            EstimatedValue = itemValue,
                            CreatedAt = DateTime.Now
                        });
                    }
                }

                process.TotalRecoveredWeight = totalWeight;
                process.TotalMaterialValue = totalValue;
                process.NetRecoveryValue = totalValue - (process.ProcessingCost ?? 400.00m);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Recycling process progress and materials saved.",
                    totalRecoveredWeight = totalWeight,
                    totalMaterialValue = totalValue,
                    netRecoveryValue = process.NetRecoveryValue
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error saving process progress.", error = ex.Message });
            }
        }

        // 6. Complete recycling process & issue certificate
        [HttpPost("complete")]
        public async Task<IActionResult> CompleteProcess([FromBody] CompleteProcessDto dto)
        {
            try
            {
                var request = await _context.RecyclingCenterRequests
                    .Include(r => r.Device)
                        .ThenInclude(d => d.Category)
                    .Include(r => r.Device)
                        .ThenInclude(d => d.User)
                    .Include(r => r.RecyclingCenter)
                    .FirstOrDefaultAsync(r => r.RecyclingCenterRequestId == dto.RequestId);

                if (request == null)
                    return NotFound(new { message = "Recycling request not found." });

                // Persistence of status
                request.Status = "Completed";
                request.UpdatedAt = DateTime.Now;

                if (request.Device != null)
                {
                    request.Device.LifecycleStatus = "Recycled";
                    request.Device.Status = "Completed";
                }

                var process = await _context.RecyclingProcesses
                    .FirstOrDefaultAsync(p => p.RecyclingCenterRequestId == dto.RequestId);

                if (process == null)
                {
                    process = new RecyclingProcess
                    {
                        RecyclingCenterRequestId = dto.RequestId,
                        StartedAt = DateTime.Now.AddHours(-2),
                        CreatedAt = DateTime.Now
                    };
                    _context.RecyclingProcesses.Add(process);
                }

                process.Status = "Completed";
                process.CompletedAt = DateTime.Now;
                process.ProcessingCost = dto.ProcessingCost ?? 400.00m;
                process.Notes = dto.Notes ?? "Recycling process completed successfully with certified material recovery.";
                process.UpdatedAt = DateTime.Now;

                // Save materials if provided
                if (dto.RecoveredMaterials != null && dto.RecoveredMaterials.Any())
                {
                    var existingMaterials = await _context.RecoveredMaterials
                        .Where(rm => rm.RecyclingProccessId == process.RecyclingProcessId)
                        .ToListAsync();
                    _context.RecoveredMaterials.RemoveRange(existingMaterials);

                    decimal totalWeight = 0;
                    decimal totalValue = 0;

                    foreach (var item in dto.RecoveredMaterials)
                    {
                        decimal itemValue = item.Quantity * item.PricePerUnit;
                        totalWeight += item.Quantity;
                        totalValue += itemValue;

                        _context.RecoveredMaterials.Add(new RecoveredMaterials
                        {
                            RecyclingProccessId = process.RecyclingProcessId,
                            MaterialName = item.MaterialName,
                            Quantity = item.Quantity,
                            Unit = string.IsNullOrWhiteSpace(item.Unit) ? "kg" : item.Unit,
                            PricePerUnit = item.PricePerUnit,
                            EstimatedValue = itemValue,
                            CreatedAt = DateTime.Now
                        });
                    }

                    process.TotalRecoveredWeight = totalWeight;
                    process.TotalMaterialValue = totalValue;
                    process.NetRecoveryValue = totalValue - (process.ProcessingCost ?? 400.00m);
                }

                await _context.SaveChangesAsync();

                string certificateId = $"ECO-REC-{DateTime.Now.Year}-{request.RecyclingCenterRequestId:D6}";

                return Ok(new
                {
                    message = "Recycling process completed successfully! Certificate generated.",
                    requestId = request.RecyclingCenterRequestId,
                    status = "Completed",
                    certificate = new
                    {
                        certificateId = certificateId,
                        issueDate = DateTime.Now.ToString("dd MMM yyyy"),
                        deviceId = request.DeviceId,
                        brand = request.Device?.Brand,
                        model = request.Device?.Model,
                        categoryName = request.Device?.Category?.CategoryName,
                        ownerName = request.Device?.User != null ? $"{request.Device.User.FirstName} {request.Device.User.LastName}".Trim() : "Customer",
                        centerName = request.RecyclingCenter?.CenterName ?? "EcoCycle Certified Center",
                        originalWeightKg = request.Device?.Weight ?? 15,
                        totalRecoveredWeightKg = process.TotalRecoveredWeight ?? 0,
                        totalMaterialValue = process.TotalMaterialValue ?? 0,
                        verificationUrl = $"https://localhost:5173/verify-certificate/{certificateId}"
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error completing recycling process.", error = ex.Message });
            }
        }

        private async Task EnsureComponentTypesSeededAsync()
        {
            if (!await _context.ComponentTypes.AnyAsync())
            {
                var defaults = new List<ComponentType>
                {
                    new ComponentType { ComponentName = "Lithium-Ion Battery", HandlingType = "Battery Recycling", Description = "Rechargeable lithium cell requiring dry thermal isolation storage.", IsHazardous = true },
                    new ComponentType { ComponentName = "Printed Circuit Board (PCB)", HandlingType = "Precious Metal Recovery", Description = "Contains lead solder joints, copper traces, and gold contact pins.", IsHazardous = true },
                    new ComponentType { ComponentName = "Power Supply Unit (PSU)", HandlingType = "Electrical Safety & Isolation", Description = "High-voltage capacitors and transformer coils requiring discharged isolation.", IsHazardous = true },
                    new ComponentType { ComponentName = "Display Glass Substrate", HandlingType = "Glass Recycling", Description = "Leaded display glass panel requiring specialized encapsulation.", IsHazardous = true },
                    new ComponentType { ComponentName = "Mercury CCFL Backlight Lamp", HandlingType = "Chemical Neutralization", Description = "Contains mercury vapor requiring sealed hazardous gas extraction.", IsHazardous = true },
                    new ComponentType { ComponentName = "Copper Coils & Wiring", HandlingType = "Metal Recovery", Description = "High-purity recyclable copper wiring harness and motor coils.", IsHazardous = false },
                    new ComponentType { ComponentName = "Aluminium Heat Sink & Trim", HandlingType = "Metal Recovery", Description = "Clean thermal conduction aluminium alloy for direct foundry re-smelting.", IsHazardous = false },
                    new ComponentType { ComponentName = "Recyclable Polymer Plastics", HandlingType = "Polymer Granulation", Description = "Flame-retardant structural plastic casing ready for pelletization.", IsHazardous = false },
                    new ComponentType { ComponentName = "Structural Steel Frame", HandlingType = "Ferrous Scrap Recycling", Description = "Heavy steel chassis, frame, and mounting plates for direct smelting.", IsHazardous = false },
                    new ComponentType { ComponentName = "LED Backlight Assembly", HandlingType = "Optoelectronic Recovery", Description = "Low-voltage semiconductor light strip assembly.", IsHazardous = false },
                    new ComponentType { ComponentName = "Camera Module & Optics", HandlingType = "Precision Component Recovery", Description = "Optical sensor, glass lens, and micro-actuator assembly.", IsHazardous = false }
                };
                await _context.ComponentTypes.AddRangeAsync(defaults);
                await _context.SaveChangesAsync();
            }
        }

        private async Task EnsureDeviceModelComponentsAsync(DeviceModel deviceModel, string categoryName)
        {
            await EnsureComponentTypesSeededAsync();
            var allTypes = await _context.ComponentTypes.ToListAsync();
            string cat = categoryName.ToLower();

            List<string> targetNames;
            if (cat.Contains("tv") || cat.Contains("display") || cat.Contains("television") || cat.Contains("monitor"))
            {
                targetNames = new List<string>
                {
                    "Printed Circuit Board (PCB)",
                    "Power Supply Unit (PSU)",
                    "Display Glass Substrate",
                    "LED Backlight Assembly",
                    "Copper Coils & Wiring",
                    "Aluminium Heat Sink & Trim",
                    "Recyclable Polymer Plastics"
                };
            }
            else if (cat.Contains("mobile") || cat.Contains("phone") || cat.Contains("smartphone") || cat.Contains("tablet"))
            {
                targetNames = new List<string>
                {
                    "Lithium-Ion Battery",
                    "Printed Circuit Board (PCB)",
                    "Display Glass Substrate",
                    "Camera Module & Optics",
                    "Recyclable Polymer Plastics"
                };
            }
            else if (cat.Contains("laptop") || cat.Contains("computer") || cat.Contains("pc") || cat.Contains("workstation"))
            {
                targetNames = new List<string>
                {
                    "Lithium-Ion Battery",
                    "Printed Circuit Board (PCB)",
                    "Display Glass Substrate",
                    "Copper Coils & Wiring",
                    "Aluminium Heat Sink & Trim",
                    "Structural Steel Frame",
                    "Recyclable Polymer Plastics"
                };
            }
            else if (cat.Contains("fridge") || cat.Contains("refrigerator") || cat.Contains("wash") || cat.Contains("appliance"))
            {
                targetNames = new List<string>
                {
                    "Power Supply Unit (PSU)",
                    "Printed Circuit Board (PCB)",
                    "Copper Coils & Wiring",
                    "Aluminium Heat Sink & Trim",
                    "Structural Steel Frame",
                    "Recyclable Polymer Plastics"
                };
            }
            else
            {
                targetNames = new List<string>
                {
                    "Printed Circuit Board (PCB)",
                    "Power Supply Unit (PSU)",
                    "Copper Coils & Wiring",
                    "Structural Steel Frame",
                    "Recyclable Polymer Plastics"
                };
            }

            var selectedTypes = allTypes.Where(t => targetNames.Contains(t.ComponentName)).ToList();
            if (!selectedTypes.Any()) selectedTypes = allTypes.Take(5).ToList();

            foreach (var ct in selectedTypes)
            {
                _context.DeviceModelComponents.Add(new DeviceModelComponent
                {
                    DeviceModelId = deviceModel.DeviceModelId,
                    ComponentTypeId = ct.ComponentTypeId,
                    IsExpected = true,
                    CreatedAt = DateTime.Now
                });
            }

            await _context.SaveChangesAsync();

            // Reload DeviceModelComponents
            await _context.Entry(deviceModel)
                .Collection(dm => dm.DeviceModelComponents)
                .Query()
                .Include(dmc => dmc.ComponentType)
                .LoadAsync();
        }
    }

    public class SaveProcessProgressDto
    {
        public int RequestId { get; set; }
        public decimal? ProcessingCost { get; set; }
        public string? HazardousWasteDetails { get; set; }
        public string? Notes { get; set; }
        public List<RecoveredMaterialItemDto>? RecoveredMaterials { get; set; }
    }

    public class CompleteProcessDto
    {
        public int RequestId { get; set; }
        public decimal? ProcessingCost { get; set; }
        public string? Notes { get; set; }
        public List<RecoveredMaterialItemDto>? RecoveredMaterials { get; set; }
    }

    public class RecoveredMaterialItemDto
    {
        public string MaterialName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "kg";
        public decimal PricePerUnit { get; set; }
    }
}
