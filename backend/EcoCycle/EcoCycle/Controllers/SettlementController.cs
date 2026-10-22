using EcoCycle.API.Data;
using EcoCycle.API.Data.DTOs;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Razorpay.Api;
using System.Net;
using System.Net.Mail;
using System.Security.Claims;
using PaymentEntity = EcoCycle.API.Models.Payment;

namespace EcoCycle.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettlementController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SettlementController> _logger;
        private readonly RazorpaySettings _razorpaySettings;

        public SettlementController(
            ApplicationDbContext context,
            ILogger<SettlementController> logger,
            IOptions<RazorpaySettings> razorpaySettings)
        {
            _context = context;
            _logger = logger;
            _razorpaySettings = razorpaySettings.Value;
        }

        /// <summary>
        /// Get detailed settlement & multi-stakeholder payout breakdown for a device
        /// </summary>
        [HttpGet("breakdown/{deviceId}")]
        public async Task<IActionResult> GetSettlementBreakdown(int deviceId)
        {
            try
            {
                var device = await _context.Device
                    .Include(d => d.User)
                    .Include(d => d.Category)
                    .Include(d => d.DeviceModel)
                    .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

                if (device == null)
                {
                    return NotFound(new { message = $"Device with ID {deviceId} not found." });
                }

                // 1. Fetch Inspection & Technician
                var inspection = await _context.Inspection
                    .Include(i => i.Technician)
                    .ThenInclude(t => t.Login)
                    .Where(i => i.DeviceId == deviceId)
                    .OrderByDescending(i => i.InspectionCompletedAt ?? i.InspectionStartedAt ?? DateTime.MinValue)
                    .FirstOrDefaultAsync();

                // 2. Fetch Collection Assignments (Agent 1: Citizen to Tech/Hub, Agent 2: Hub to Center)
                var assignments = await _context.CollectionAssignments
                    .Include(a => a.CollectionAgent)
                    .ThenInclude(ca => ca.Login)
                    .Where(a => a.DeviceId == deviceId)
                    .OrderBy(a => a.CreatedAt)
                    .ToListAsync();

                var agent1Assignment = assignments.FirstOrDefault();
                var agent2Assignment = assignments.Count > 1 ? assignments.Skip(1).FirstOrDefault() : null;

                // 3. Fetch Center Requests & Processing Details
                var refurbRequest = await _context.RefurbishmentRequests
                    .Include(r => r.RefurbishmentCenter)
                    .ThenInclude(rc => rc.Login)
                    .FirstOrDefaultAsync(r => r.DeviceId == deviceId);

                var refurbProcess = refurbRequest != null
                    ? await _context.RefurbishmentProcesses.FirstOrDefaultAsync(p => p.RefurbishmentRequestId == refurbRequest.RefurbishmentRequestId)
                    : null;

                var recycleRequest = await _context.RecyclingCenterRequests
                    .Include(r => r.RecyclingCenter)
                    .ThenInclude(rc => rc.Login)
                    .FirstOrDefaultAsync(r => r.DeviceId == deviceId);

                var recycleProcess = recycleRequest != null
                    ? await _context.RecyclingProcesses.FirstOrDefaultAsync(p => p.RecyclingCenterRequestId == recycleRequest.RecyclingCenterRequestId)
                    : null;

                // 4. Determine Realized Value from Center
                decimal realizedValue = 0m;
                string centerType = "None";
                string centerName = "Unknown";
                int? centerLoginId = null;
                decimal centerProcessingCost = 400m;

                if (refurbProcess != null && refurbRequest != null)
                {
                    centerType = "Refurbishment Center";
                    centerName = refurbRequest.RefurbishmentCenter?.CenterName ?? "Refurbishment Center";
                    centerLoginId = refurbRequest.RefurbishmentCenter?.LoginId;
                    realizedValue = (refurbProcess.RefurbishedValue ?? 0m) > 0 
                        ? (refurbProcess.RefurbishedValue ?? 0m)
                        : ((refurbProcess.TotalRepairCost ?? 0m) > 0 ? (refurbProcess.TotalRepairCost ?? 0m) : 0m);
                    if ((refurbProcess.TotalRepairCost ?? 0m) > 0)
                    {
                        centerProcessingCost = refurbProcess.TotalRepairCost ?? 400m;
                    }
                }
                else if (recycleProcess != null && recycleRequest != null)
                {
                    centerType = "Recycling Center";
                    centerName = recycleRequest.RecyclingCenter?.CenterName ?? "Recycling Center";
                    centerLoginId = recycleRequest.RecyclingCenter?.LoginId;
                    realizedValue = (recycleProcess.TotalMaterialValue ?? 0m) > 0 
                        ? (recycleProcess.TotalMaterialValue ?? 0m)
                        : ((recycleProcess.NetRecoveryValue ?? 0m) > 0 ? (recycleProcess.NetRecoveryValue ?? 0m) : 0m);
                    if ((recycleProcess.ProcessingCost ?? 0m) > 0)
                    {
                        centerProcessingCost = recycleProcess.ProcessingCost ?? 400m;
                    }
                }

                // 5. Fetch Incoming Payment from Center
                var incomingPayment = await _context.Payments
                    .Where(p => p.ReferenceId == deviceId && 
                                (p.PaymentType == "CenterDeviceSettlement" || p.PaymentType == "RefurbishmentFee" || p.PaymentType == "RecyclingFee") && 
                                p.TransactionType == "Incoming")
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefaultAsync();

                if (incomingPayment != null && incomingPayment.Amount > 0)
                {
                    realizedValue = incomingPayment.Amount;
                }

                // 6. Fetch Existing Outgoing Payouts
                var payouts = await _context.Payouts
                    .Where(p => p.DeviceId == deviceId)
                    .ToListAsync();

                bool isDistributed = payouts.Any(p => p.PayoutStatus == "Paid");

                // 7. Calculate Multi-Stakeholder Standard Breakdown
                // Rule: Collection Agent fixed ₹150, Technician fixed ₹300, Center gets 0 payout share (they keep the repaired device/components) but their operation cost is displayed.
                decimal agent1Fee = 150m;
                decimal techFee = 300m;
                decimal agent2Fee = agent2Assignment != null ? 150m : 0m;
                decimal centerOperationCost = centerProcessingCost > 0 ? centerProcessingCost : 0m;
                decimal centerPayoutShare = 0m; // Center keeps device/materials, no payout share needed

                decimal totalOperationalCosts = agent1Fee + techFee + agent2Fee;
                bool isViable = realizedValue >= totalOperationalCosts;
                decimal shortfall = isViable ? 0m : (totalOperationalCosts - realizedValue);

                decimal citizenAmount = 0m;
                decimal ecoCycleShare = 0m;

                if (isViable)
                {
                    decimal surplus = realizedValue - totalOperationalCosts;
                    // Citizen receives 80% of remaining surplus (or standard fair valuation), EcoCycle retains 20%
                    citizenAmount = Math.Round(surplus * 0.80m, 2);
                    ecoCycleShare = Math.Round(surplus - citizenAmount, 2);
                }
                else
                {
                    // Low value / insufficient scenario
                    citizenAmount = 0m;
                    ecoCycleShare = 0m;
                }

                return Ok(new
                {
                    deviceId = device.DeviceId,
                    deviceBrand = device.Brand,
                    deviceModel = device.Model,
                    deviceCondition = device.Condition,
                    lifecycleStatus = device.LifecycleStatus,
                    status = device.Status,
                    
                    // Center Details & Realized Value
                    centerType,
                    centerName,
                    centerLoginId,
                    centerOperationCost,
                    finalRealizableValue = realizedValue,
                    
                    // Incoming Payment Status
                    incomingPayment = incomingPayment != null ? new
                    {
                        paymentId = incomingPayment.PaymentId,
                        amount = incomingPayment.Amount,
                        status = incomingPayment.PaymentStatus,
                        paidAt = incomingPayment.PaidAt,
                        razorpayPaymentId = incomingPayment.RazorpayPaymentId,
                        payerType = incomingPayment.PayerType
                    } : null,
                    isPaymentReceived = incomingPayment != null && incomingPayment.PaymentStatus == "Paid",

                    // Viability Assessment
                    isViable,
                    shortfall,
                    viabilityStatus = isViable ? "Viable" : "Insufficient Value / Not Viable",
                    
                    // Operational Costs & Distribution Formula
                    totalOperationalCosts,
                    suggestedDistribution = new
                    {
                        citizenAmount,
                        agent1Amount = agent1Fee,
                        technicianAmount = techFee,
                        agent2Amount = agent2Fee,
                        centerAmount = centerPayoutShare,
                        centerOperationCost,
                        ecoCycleShare,
                        total = realizedValue
                    },

                    // Stakeholder Metadata
                    stakeholders = new
                    {
                        citizen = new
                        {
                            userId = device.User?.UserId,
                            loginId = device.User?.LoginId,
                            name = $"{device.User?.FirstName} {device.User?.LastName}".Trim(),
                            phone = device.User?.PhoneNumber,
                            accountHolder = device.User?.AccountHolder,
                            bankName = device.User?.BankName,
                            accountNumber = device.User?.AccountNumber,
                            ifscCode = device.User?.IFSCCode,
                            hasBankDetails = !string.IsNullOrWhiteSpace(device.User?.AccountNumber) && !string.IsNullOrWhiteSpace(device.User?.IFSCCode)
                        },
                        agent1 = agent1Assignment?.CollectionAgent != null ? new
                        {
                            agentId = agent1Assignment.CollectionAgent.CollectionAgentId,
                            loginId = agent1Assignment.CollectionAgent.LoginId,
                            name = $"{agent1Assignment.CollectionAgent.FirstName} {agent1Assignment.CollectionAgent.LastName}".Trim(),
                            phone = agent1Assignment.CollectionAgent.Phone,
                            bankName = agent1Assignment.CollectionAgent.BankName,
                            accountNumber = agent1Assignment.CollectionAgent.AccountNumber
                        } : null,
                        technician = inspection?.Technician != null ? new
                        {
                            technicianId = inspection.Technician.TechnicianId,
                            loginId = inspection.Technician.LoginId,
                            name = $"{inspection.Technician.FirstName} {inspection.Technician.LastName}".Trim(),
                            phone = inspection.Technician.PhoneNumber
                        } : null,
                        agent2 = agent2Assignment?.CollectionAgent != null ? new
                        {
                            agentId = agent2Assignment.CollectionAgent.CollectionAgentId,
                            loginId = agent2Assignment.CollectionAgent.LoginId,
                            name = $"{agent2Assignment.CollectionAgent.FirstName} {agent2Assignment.CollectionAgent.LastName}".Trim(),
                            phone = agent2Assignment.CollectionAgent.Phone
                        } : null,
                        center = new
                        {
                            type = centerType,
                            name = centerName,
                            loginId = centerLoginId
                        }
                    },

                    // Outgoing Payouts History
                    isDistributed,
                    payouts = payouts.Select(p => new
                    {
                        payoutId = p.PayoutId,
                        receiverType = p.ReceiverType,
                        receiverLoginId = p.ReceiverLoginId,
                        payoutType = p.PayoutType,
                        amount = p.Amount,
                        status = p.PayoutStatus,
                        batchId = p.PayoutBatchId,
                        paidAt = p.PaidAt
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting settlement breakdown for device {DeviceId}", deviceId);
                return StatusCode(500, new { message = "An error occurred while calculating settlement breakdown.", details = ex.Message });
            }
        }

        /// <summary>
        /// Creates a Razorpay Order for Center Buyout Settlement
        /// </summary>
        [HttpPost("create-center-order")]
        public async Task<IActionResult> CreateCenterSettlementOrder([FromBody] CreateCenterSettlementOrderDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var device = await _context.Device
                    .Include(d => d.DeviceModel)
                    .FirstOrDefaultAsync(d => d.DeviceId == dto.DeviceId);

                if (device == null)
                {
                    return NotFound(new { message = $"Device with ID {dto.DeviceId} not found." });
                }

                int amountInPaise = (int)Math.Round(dto.Amount * 100);

                // Create Razorpay client
                RazorpayClient client = new RazorpayClient(
                    _razorpaySettings.KeyId,
                    _razorpaySettings.KeySecret);

                var options = new Dictionary<string, object>
                {
                    { "amount", amountInPaise },
                    { "currency", "INR" },
                    { "receipt", $"SETTLE_DEV_{dto.DeviceId}_{DateTime.UtcNow.Ticks}" }
                };

                Order order = client.Order.Create(options);
                string orderId = order["id"].ToString();

                return Ok(new
                {
                    keyId = _razorpaySettings.KeyId,
                    orderId = orderId,
                    amount = amountInPaise,
                    currency = "INR",
                    deviceId = dto.DeviceId,
                    description = $"EcoCycle Escrow Buyout Settlement for Device #{dto.DeviceId} ({device.Brand} {device.Model ?? device.DeviceModel?.Model})"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Razorpay settlement order for device {DeviceId}", dto.DeviceId);
                return StatusCode(500, new { message = "Failed to initialize Razorpay checkout order.", details = ex.Message });
            }
        }

        /// <summary>
        /// Center pays the settlement (Final Realized Value) to EcoCycle
        /// </summary>
        [HttpPost("center-pay-settlement")]
        public async Task<IActionResult> CenterPaySettlement([FromBody] CenterSettlementPaymentDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var device = await _context.Device.FirstOrDefaultAsync(d => d.DeviceId == dto.DeviceId);
                if (device == null)
                {
                    return NotFound(new { message = $"Device with ID {dto.DeviceId} not found." });
                }

                // Identify Center from current authenticated user or reference
                var loginIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                int? payerLoginId = null;
                string payerType = "Center";

                if (int.TryParse(loginIdClaim, out int parsedLoginId))
                {
                    payerLoginId = parsedLoginId;
                    var rc = await _context.RecyclingCenter.FirstOrDefaultAsync(r => r.LoginId == parsedLoginId);
                    var rfc = await _context.RefurbishmentCenter.FirstOrDefaultAsync(r => r.LoginId == parsedLoginId);
                    if (rc != null) payerType = "RecyclingCenter";
                    else if (rfc != null) payerType = "RefurbishmentCenter";
                }

                // Check or Create Incoming Payment Record
                var payment = await _context.Payments
                    .FirstOrDefaultAsync(p => p.ReferenceId == dto.DeviceId && 
                                              p.PaymentType == "CenterDeviceSettlement" && 
                                              p.TransactionType == "Incoming");

                if (payment != null && payment.PaymentStatus == "Paid")
                {
                    return Ok(new
                    {
                        success = true,
                        alreadyPaid = true,
                        message = $"Center settlement for Device #{dto.DeviceId} is already recorded and paid.",
                        paymentId = payment.PaymentId,
                        amount = payment.Amount,
                        razorpayPaymentId = payment.RazorpayPaymentId
                    });
                }

                if (payment == null)
                {
                    payment = new PaymentEntity
                    {
                        PaymentType = "CenterDeviceSettlement",
                        ReferenceId = dto.DeviceId,
                        PayerType = payerType,
                        PayerLoginId = payerLoginId,
                        ReceiverType = "EcoCycle",
                        ReceiverLoginId = null,
                        Amount = dto.FinalRealizableValue,
                        Currency = "INR",
                        TransactionType = "Incoming",
                        PaymentStatus = "Paid",
                        RazorpayPaymentId = dto.RazorpayPaymentId ?? $"PAY_SIM_{DateTime.UtcNow.Ticks}",
                        RazorpayOrderId = dto.RazorpayOrderId ?? $"ORD_{dto.DeviceId}_{DateTime.UtcNow.Ticks}",
                        RazorpaySignature = dto.RazorpaySignature,
                        PaidAt = DateTime.Now,
                        CreatedAt = DateTime.Now
                    };
                    _context.Payments.Add(payment);
                }
                else
                {
                    payment.Amount = dto.FinalRealizableValue;
                    payment.PaymentStatus = "Paid";
                    payment.PaidAt = DateTime.Now;
                    payment.RazorpayPaymentId = dto.RazorpayPaymentId ?? payment.RazorpayPaymentId ?? $"PAY_SIM_{DateTime.UtcNow.Ticks}";
                    payment.UpdatedAt = DateTime.Now;
                }

                // Record in EcoCycle Transaction Ledger
                var transaction = new EcoCycleTransaction
                {
                    DeviceId = dto.DeviceId,
                    TransactionType = "CenterDeviceSettlement",
                    Direction = "Credit",
                    Amount = dto.FinalRealizableValue,
                    Status = "Completed",
                    Description = $"Settlement payment received from {payerType} for Device #{dto.DeviceId}. Final Realizable Value: ₹{dto.FinalRealizableValue:N2}.",
                    CreatedAt = DateTime.Now
                };
                _context.EcoCycleTransactions.Add(transaction);

                // Update Refurbishment or Recycling Process realized values if linked
                var refurbRequest = await _context.RefurbishmentRequests.FirstOrDefaultAsync(r => r.DeviceId == dto.DeviceId);
                if (refurbRequest != null)
                {
                    var rp = await _context.RefurbishmentProcesses.FirstOrDefaultAsync(p => p.RefurbishmentRequestId == refurbRequest.RefurbishmentRequestId);
                    if (rp != null)
                    {
                        rp.RefurbishedValue = dto.FinalRealizableValue;
                    }
                }

                var recycleRequest = await _context.RecyclingCenterRequests.FirstOrDefaultAsync(r => r.DeviceId == dto.DeviceId);
                if (recycleRequest != null)
                {
                    var recp = await _context.RecyclingProcesses.FirstOrDefaultAsync(p => p.RecyclingCenterRequestId == recycleRequest.RecyclingCenterRequestId);
                    if (recp != null)
                    {
                        recp.TotalMaterialValue = dto.FinalRealizableValue;
                    }
                }

                // Add Notification for Admin
                var adminLogin = await _context.Login
                    .Include(l => l.Role)
                    .FirstOrDefaultAsync(l => l.Role.Name == "Admin" || l.Role.Name == "Administrator");
                if (adminLogin != null)
                {
                    var notification = new Notification
                    {
                        LoginId = adminLogin.LoginId,
                        Title = "Center Settlement Received",
                        Message = $"Settlement of ₹{dto.FinalRealizableValue:N2} for Device #{dto.DeviceId} ({device.Brand} {device.Model}) has been successfully paid to EcoCycle. Ready for payout distribution.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    };
                    _context.Notification.Add(notification);
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Center settlement payment received successfully by EcoCycle.",
                    paymentId = payment.PaymentId,
                    amount = payment.Amount,
                    status = payment.PaymentStatus,
                    paidAt = payment.PaidAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing center settlement for device {DeviceId}", dto.DeviceId);
                return StatusCode(500, new { message = "An error occurred while recording center settlement.", details = ex.Message });
            }
        }

        /// <summary>
        /// Admin confirms & distributes payouts to Citizen, Agents, Tech, and Center
        /// </summary>
        [HttpPost("distribute-payouts")]
        public async Task<IActionResult> DistributePayouts([FromBody] DistributePayoutsDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var device = await _context.Device
                    .Include(d => d.User)
                    .FirstOrDefaultAsync(d => d.DeviceId == dto.DeviceId);

                if (device == null)
                {
                    return NotFound(new { message = $"Device with ID {dto.DeviceId} not found." });
                }

                // 1. Verify that Incoming Center Settlement Payment is Paid
                var incomingPayment = await _context.Payments
                    .Where(p => p.ReferenceId == dto.DeviceId && 
                                (p.PaymentType == "CenterDeviceSettlement" || p.PaymentType == "RefurbishmentFee" || p.PaymentType == "RecyclingFee") && 
                                p.TransactionType == "Incoming")
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefaultAsync();

                if (incomingPayment == null || incomingPayment.PaymentStatus != "Paid")
                {
                    return BadRequest(new { 
                        message = "Cannot distribute payouts because EcoCycle has not received the settlement payment from the Center yet. Payment must be 'Paid' first." 
                    });
                }

                // 2. Fetch Stakeholder Logins
                // Citizen
                int citizenLoginId = device.User?.LoginId ?? 0;

                // Technician
                var inspection = await _context.Inspection
                    .Include(i => i.Technician)
                    .Where(i => i.DeviceId == dto.DeviceId)
                    .OrderByDescending(i => i.InspectionCompletedAt ?? i.InspectionStartedAt ?? DateTime.MinValue)
                    .FirstOrDefaultAsync();
                int techLoginId = inspection?.Technician?.LoginId ?? 0;

                // Collection Agents
                var assignments = await _context.CollectionAssignments
                    .Include(a => a.CollectionAgent)
                    .Where(a => a.DeviceId == dto.DeviceId)
                    .OrderBy(a => a.CreatedAt)
                    .ToListAsync();

                int agent1LoginId = assignments.FirstOrDefault()?.CollectionAgent?.LoginId ?? 0;
                int agent2LoginId = assignments.Count > 1 ? assignments.Skip(1).FirstOrDefault()?.CollectionAgent?.LoginId ?? 0 : 0;

                // Robust Center Lookup (Refurbishment or Recycling Center)
                int centerLoginId = 0;
                string centerType = "RefurbishmentCenter";

                var refurbRequest = await _context.RefurbishmentRequests
                    .Include(r => r.RefurbishmentCenter)
                    .Where(r => r.DeviceId == dto.DeviceId && r.Status != "Rejected")
                    .OrderByDescending(r => r.RefurbishmentRequestId)
                    .FirstOrDefaultAsync();

                if (refurbRequest == null)
                {
                    refurbRequest = await _context.RefurbishmentRequests
                        .Include(r => r.RefurbishmentCenter)
                        .Where(r => r.DeviceId == dto.DeviceId)
                        .OrderByDescending(r => r.RefurbishmentRequestId)
                        .FirstOrDefaultAsync();
                }

                var recycleRequest = await _context.RecyclingCenterRequests
                    .Include(r => r.RecyclingCenter)
                    .Where(r => r.DeviceId == dto.DeviceId && r.Status != "Rejected")
                    .OrderByDescending(r => r.RecyclingCenterRequestId)
                    .FirstOrDefaultAsync();

                if (recycleRequest == null)
                {
                    recycleRequest = await _context.RecyclingCenterRequests
                        .Include(r => r.RecyclingCenter)
                        .Where(r => r.DeviceId == dto.DeviceId)
                        .OrderByDescending(r => r.RecyclingCenterRequestId)
                        .FirstOrDefaultAsync();
                }

                if (refurbRequest != null && refurbRequest.RefurbishmentCenterId > 0)
                {
                    centerType = "RefurbishmentCenter";
                    if (refurbRequest.RefurbishmentCenter?.LoginId > 0)
                    {
                        centerLoginId = refurbRequest.RefurbishmentCenter.LoginId;
                    }
                    else
                    {
                        var rc = await _context.RefurbishmentCenter.FirstOrDefaultAsync(c => c.RefurbishmentCenterId == refurbRequest.RefurbishmentCenterId);
                        centerLoginId = rc?.LoginId ?? 0;
                    }
                }
                else if (recycleRequest != null && (recycleRequest.RecyclingCenterId ?? 0) > 0)
                {
                    centerType = "RecyclingCenter";
                    if (recycleRequest.RecyclingCenter?.LoginId > 0)
                    {
                        centerLoginId = recycleRequest.RecyclingCenter.LoginId;
                    }
                    else
                    {
                        var rc = await _context.RecyclingCenter.FirstOrDefaultAsync(c => c.RecyclingCenterId == recycleRequest.RecyclingCenterId);
                        centerLoginId = rc?.LoginId ?? 0;
                    }
                }

                // Fallback to active process tables if request lookup is unassigned
                if (centerLoginId == 0)
                {
                    var refurbProc = await _context.RefurbishmentProcesses
                        .Include(p => p.RefurbishmentRequest)
                        .ThenInclude(r => r.RefurbishmentCenter)
                        .FirstOrDefaultAsync(p => p.RefurbishmentRequest.DeviceId == dto.DeviceId);
                    if (refurbProc?.RefurbishmentRequest?.RefurbishmentCenter?.LoginId > 0)
                    {
                        centerLoginId = refurbProc.RefurbishmentRequest.RefurbishmentCenter.LoginId;
                        centerType = "RefurbishmentCenter";
                    }
                    else
                    {
                        var recycleProc = await _context.RecyclingProcesses
                            .Include(p => p.RecyclingCenterRequest)
                            .ThenInclude(r => r.RecyclingCenter)
                            .FirstOrDefaultAsync(p => p.RecyclingCenterRequest.DeviceId == dto.DeviceId);
                        if (recycleProc?.RecyclingCenterRequest?.RecyclingCenter?.LoginId > 0)
                        {
                            centerLoginId = recycleProc.RecyclingCenterRequest.RecyclingCenter.LoginId;
                            centerType = "RecyclingCenter";
                        }
                    }
                }

                // Fallback to any active center in system if single facility is operating
                if (centerLoginId == 0)
                {
                    var firstRefurbCenter = await _context.RefurbishmentCenter.FirstOrDefaultAsync();
                    if (firstRefurbCenter != null)
                    {
                        centerLoginId = firstRefurbCenter.LoginId;
                        centerType = "RefurbishmentCenter";
                    }
                    else
                    {
                        var firstRecycleCenter = await _context.RecyclingCenter.FirstOrDefaultAsync();
                        if (firstRecycleCenter != null)
                        {
                            centerLoginId = firstRecycleCenter.LoginId;
                            centerType = "RecyclingCenter";
                        }
                    }
                }

                string batchId = $"BATCH_{dto.DeviceId}_{DateTime.UtcNow.Ticks}";
                var createdPayouts = new List<Payout>();

                // 3. Create Outgoing Payouts
                // A. Citizen
                if (citizenLoginId > 0 && dto.CitizenAmount > 0)
                {
                    var p = new Payout
                    {
                        DeviceId = dto.DeviceId,
                        ReceiverType = "User",
                        ReceiverLoginId = citizenLoginId,
                        PayoutType = "UserValuation",
                        Amount = dto.CitizenAmount,
                        Currency = "INR",
                        PayoutStatus = "Paid",
                        PayoutBatchId = batchId,
                        PaidAt = DateTime.Now,
                        CreatedAt = DateTime.Now
                    };
                    _context.Payouts.Add(p);
                    createdPayouts.Add(p);

                    // Notify Citizen
                    _context.Notification.Add(new Notification
                    {
                        LoginId = citizenLoginId,
                        Title = "E-Waste Recycling Payout Processed",
                        Message = $"Congratulations! ₹{dto.CitizenAmount:N2} has been credited to your bank account for recycling Device #{dto.DeviceId} ({device.Brand} {device.Model}).",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    });
                }

                // B. Collection Agent 1
                if (agent1LoginId > 0 && dto.Agent1Amount > 0)
                {
                    var p = new Payout
                    {
                        DeviceId = dto.DeviceId,
                        ReceiverType = "CollectionAgent",
                        ReceiverLoginId = agent1LoginId,
                        PayoutType = "CollectionFee",
                        Amount = dto.Agent1Amount,
                        Currency = "INR",
                        PayoutStatus = "Paid",
                        PayoutBatchId = batchId,
                        PaidAt = DateTime.Now,
                        CreatedAt = DateTime.Now
                    };
                    _context.Payouts.Add(p);
                    createdPayouts.Add(p);

                    _context.Notification.Add(new Notification
                    {
                        LoginId = agent1LoginId,
                        Title = "Pickup Fee Payout Credited",
                        Message = $"Pickup fee of ₹{dto.Agent1Amount:N2} for Device #{dto.DeviceId} has been settled and paid out.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    });
                }

                // C. Technician
                if (techLoginId > 0 && dto.TechnicianAmount > 0)
                {
                    var p = new Payout
                    {
                        DeviceId = dto.DeviceId,
                        ReceiverType = "Technician",
                        ReceiverLoginId = techLoginId,
                        PayoutType = "InspectionFee",
                        Amount = dto.TechnicianAmount,
                        Currency = "INR",
                        PayoutStatus = "Paid",
                        PayoutBatchId = batchId,
                        PaidAt = DateTime.Now,
                        CreatedAt = DateTime.Now
                    };
                    _context.Payouts.Add(p);
                    createdPayouts.Add(p);

                    _context.Notification.Add(new Notification
                    {
                        LoginId = techLoginId,
                        Title = "Inspection Fee Payout Credited",
                        Message = $"Inspection compensation of ₹{dto.TechnicianAmount:N2} for Device #{dto.DeviceId} has been settled.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    });
                }

                // D. Collection Agent 2
                if (agent2LoginId > 0 && dto.Agent2Amount > 0)
                {
                    var p = new Payout
                    {
                        DeviceId = dto.DeviceId,
                        ReceiverType = "CollectionAgent",
                        ReceiverLoginId = agent2LoginId,
                        PayoutType = "CollectionFee",
                        Amount = dto.Agent2Amount,
                        Currency = "INR",
                        PayoutStatus = "Paid",
                        PayoutBatchId = batchId,
                        PaidAt = DateTime.Now,
                        CreatedAt = DateTime.Now
                    };
                    _context.Payouts.Add(p);
                    createdPayouts.Add(p);

                    _context.Notification.Add(new Notification
                    {
                        LoginId = agent2LoginId,
                        Title = "Transfer Logistics Payout Credited",
                        Message = $"Transfer logistics fee of ₹{dto.Agent2Amount:N2} for Device #{dto.DeviceId} has been paid.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    });
                }

                // E. Center Processing Fee
                if (centerLoginId > 0 && dto.CenterAmount > 0)
                {
                    var p = new Payout
                    {
                        DeviceId = dto.DeviceId,
                        ReceiverType = centerType,
                        ReceiverLoginId = centerLoginId,
                        PayoutType = "ProcessingFee",
                        Amount = dto.CenterAmount,
                        Currency = "INR",
                        PayoutStatus = "Paid",
                        PayoutBatchId = batchId,
                        PaidAt = DateTime.Now,
                        CreatedAt = DateTime.Now
                    };
                    _context.Payouts.Add(p);
                    createdPayouts.Add(p);

                    _context.Notification.Add(new Notification
                    {
                        LoginId = centerLoginId,
                        Title = "Processing Fee Settled",
                        Message = $"Processing fee of ₹{dto.CenterAmount:N2} for Device #{dto.DeviceId} has been settled.",
                        Isread = false,
                        Status = true,
                        CreatedAt = DateTime.Now
                    });
                }

                // 4. Record in EcoCycle Transaction Ledger (Debits & Platform Share)
                decimal totalDistributed = dto.CitizenAmount + dto.Agent1Amount + dto.TechnicianAmount + dto.Agent2Amount + dto.CenterAmount;
                decimal ecoCycleShare = Math.Max(0m, incomingPayment.Amount - totalDistributed);

                _context.EcoCycleTransactions.Add(new EcoCycleTransaction
                {
                    DeviceId = dto.DeviceId,
                    TransactionType = "MultiStakeholderPayout",
                    Direction = "Debit",
                    Amount = totalDistributed,
                    Status = "Completed",
                    Description = $"Distributed payouts (Batch: {batchId}) for Device #{dto.DeviceId}. Total Paid: ₹{totalDistributed:N2}, EcoCycle Share: ₹{ecoCycleShare:N2}.",
                    CreatedAt = DateTime.Now
                });

                // Prepare email recipients for stakeholders who received money (> 0)
                var recipientsToEmail = new List<(string Email, string Name, string Role, decimal Amount, string PayoutType)>();

                if (citizenLoginId > 0 && dto.CitizenAmount > 0)
                {
                    var uLogin = await _context.Login.FirstOrDefaultAsync(l => l.LoginId == citizenLoginId);
                    if (uLogin != null && !string.IsNullOrWhiteSpace(uLogin.Email))
                    {
                        string cName = device.User != null ? $"{device.User.FirstName} {device.User.LastName}".Trim() : "Citizen User";
                        recipientsToEmail.Add((uLogin.Email, cName, "Citizen User (Device Owner)", dto.CitizenAmount, "User Valuation Payout"));
                    }
                }

                if (agent1LoginId > 0 && dto.Agent1Amount > 0)
                {
                    var a1 = await _context.CollectionAgents.Include(a => a.Login).FirstOrDefaultAsync(a => a.LoginId == agent1LoginId);
                    string email = a1?.Login?.Email;
                    if (string.IsNullOrWhiteSpace(email))
                    {
                        var directLogin = await _context.Login.FirstOrDefaultAsync(l => l.LoginId == agent1LoginId);
                        email = directLogin?.Email;
                    }
                    if (!string.IsNullOrWhiteSpace(email))
                    {
                        string a1Name = a1 != null ? $"{a1.FirstName} {a1.LastName}".Trim() : "Collection Agent";
                        recipientsToEmail.Add((email, a1Name, "Collection Agent (Logistics Partner)", dto.Agent1Amount, "Pickup Fee Payout"));
                    }
                }

                if (techLoginId > 0 && dto.TechnicianAmount > 0)
                {
                    var tch = await _context.Technician.Include(t => t.Login).FirstOrDefaultAsync(t => t.LoginId == techLoginId);
                    string email = tch?.Login?.Email;
                    if (string.IsNullOrWhiteSpace(email))
                    {
                        var directLogin = await _context.Login.FirstOrDefaultAsync(l => l.LoginId == techLoginId);
                        email = directLogin?.Email;
                    }
                    if (!string.IsNullOrWhiteSpace(email))
                    {
                        string tchName = tch != null ? $"{tch.FirstName} {tch.LastName}".Trim() : "Inspection Technician";
                        recipientsToEmail.Add((email, tchName, "Inspection Technician", dto.TechnicianAmount, "Inspection Fee Payout"));
                    }
                }

                if (agent2LoginId > 0 && dto.Agent2Amount > 0)
                {
                    var a2 = await _context.CollectionAgents.Include(a => a.Login).FirstOrDefaultAsync(a => a.LoginId == agent2LoginId);
                    string email = a2?.Login?.Email;
                    if (string.IsNullOrWhiteSpace(email))
                    {
                        var directLogin = await _context.Login.FirstOrDefaultAsync(l => l.LoginId == agent2LoginId);
                        email = directLogin?.Email;
                    }
                    if (!string.IsNullOrWhiteSpace(email))
                    {
                        string a2Name = a2 != null ? $"{a2.FirstName} {a2.LastName}".Trim() : "Collection Agent";
                        recipientsToEmail.Add((email, a2Name, "Collection Agent (Logistics Partner)", dto.Agent2Amount, "Transfer Logistics Fee Payout"));
                    }
                }

                if (centerLoginId > 0 && dto.CenterAmount > 0)
                {
                    var cLogin = await _context.Login.FirstOrDefaultAsync(l => l.LoginId == centerLoginId);
                    if (cLogin != null && !string.IsNullOrWhiteSpace(cLogin.Email))
                    {
                        recipientsToEmail.Add((cLogin.Email, "Facility Center", centerType, dto.CenterAmount, "Processing Fee Payout"));
                    }
                }

                // 5. Update Device Status
                device.LifecycleStatus = "Settled";
                device.Status = "Completed";

                await _context.SaveChangesAsync();

                // 6. Send official Email Advisories to users receiving money
                var emailDeliveryReports = new List<object>();
                if (recipientsToEmail.Any())
                {
                    string devBrand = device.Brand ?? "Electronic Device";
                    string devModel = device.Model ?? "";
                    int devId = dto.DeviceId;
                    foreach (var recipient in recipientsToEmail)
                    {
                        try
                        {
                            string emailSub = $"EcoCycle Payment Disbursed: ₹{recipient.Amount:N2} for Device #{devId}";
                            string htmlBody = GeneratePayoutEmailHtml(
                                recipient.Name,
                                recipient.Role,
                                recipient.Amount,
                                devId,
                                devBrand,
                                devModel,
                                $"TXN_{devId}_{DateTime.UtcNow.Ticks}",
                                recipient.PayoutType
                            );
                            bool sent = await SendEmailAsync(recipient.Email, emailSub, htmlBody);
                            emailDeliveryReports.Add(new
                            {
                                email = recipient.Email,
                                name = recipient.Name,
                                role = recipient.Role,
                                amount = recipient.Amount,
                                status = sent ? "Dispatched" : "SMTP Delivery Error"
                            });
                        }
                        catch (Exception emailEx)
                        {
                            Console.WriteLine($"[DistributePayouts Email] Error sending to {recipient.Email}: {emailEx.Message}");
                            emailDeliveryReports.Add(new
                            {
                                email = recipient.Email,
                                name = recipient.Name,
                                role = recipient.Role,
                                amount = recipient.Amount,
                                status = $"Failed: {emailEx.Message}"
                            });
                        }
                    }
                }

                return Ok(new
                {
                    success = true,
                    message = "Multi-stakeholder payouts distributed successfully.",
                    batchId,
                    totalDistributed,
                    ecoCycleShare,
                    recipients = emailDeliveryReports,
                    payoutCount = createdPayouts.Count,
                    payouts = createdPayouts.Select(p => new
                    {
                        p.PayoutId,
                        p.ReceiverType,
                        p.ReceiverLoginId,
                        p.PayoutType,
                        p.Amount,
                        p.PayoutStatus,
                        p.PaidAt
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error distributing payouts for device {DeviceId}", dto.DeviceId);
                return StatusCode(500, new { message = "An error occurred while distributing payouts.", details = ex.Message });
            }
        }

        /// <summary>
        /// Reset devices back to their pre-processing state at Refurbishment / Recycling Centers
        /// </summary>
        [HttpPost("reset-devices-pre-processing")]
        public async Task<IActionResult> ResetDevicesPreProcessing([FromBody] List<int>? deviceIds)
        {
            try
            {
                var targetIds = deviceIds != null && deviceIds.Any() ? deviceIds : new List<int> { 22, 23 };

                foreach (var devId in targetIds)
                {
                    var device = await _context.Device.FirstOrDefaultAsync(d => d.DeviceId == devId);
                    if (device == null) continue;

                    // 1. Reset Refurbishment Requests & Processes
                    var refurbRequests = await _context.RefurbishmentRequests
                        .Where(r => r.DeviceId == devId)
                        .ToListAsync();

                    foreach (var rr in refurbRequests)
                    {
                        rr.Status = "Accepted";
                        rr.RefurbishmentStartedAt = null;
                        rr.RefurbishmentCompletedAt = null;
                        rr.RespondedAt = DateTime.Now.AddDays(-1);
                        rr.UpdatedAt = DateTime.Now;

                        var refurbProcs = await _context.RefurbishmentProcesses
                            .Where(p => p.RefurbishmentRequestId == rr.RefurbishmentRequestId)
                            .ToListAsync();
                        if (refurbProcs.Any())
                        {
                            _context.RefurbishmentProcesses.RemoveRange(refurbProcs);
                        }
                    }

                    // 2. Reset Recycling Requests & Processes & Recovered Materials
                    var recycleRequests = await _context.RecyclingCenterRequests
                        .Where(r => r.DeviceId == devId)
                        .ToListAsync();

                    foreach (var rc in recycleRequests)
                    {
                        rc.Status = "Accepted";
                        rc.ProcessStartDate = null;
                        rc.ProcessDeadline = null;
                        rc.RespondedAt = DateTime.Now.AddDays(-1);
                        rc.UpdatedAt = DateTime.Now;

                        var recProcs = await _context.RecyclingProcesses
                            .Where(p => p.RecyclingCenterRequestId == rc.RecyclingCenterRequestId)
                            .ToListAsync();

                        foreach (var rp in recProcs)
                        {
                            var mats = await _context.RecoveredMaterials
                                .Where(m => m.RecyclingProccessId == rp.RecyclingProcessId)
                                .ToListAsync();
                            if (mats.Any())
                            {
                                _context.RecoveredMaterials.RemoveRange(mats);
                            }
                        }

                        if (recProcs.Any())
                        {
                            _context.RecyclingProcesses.RemoveRange(recProcs);
                        }
                    }

                    // 3. Reset Device Status
                    if (refurbRequests.Any())
                    {
                        device.LifecycleStatus = "AllocatedToRefurbishment";
                        device.Status = "InProgress";
                        device.ProcessingLifecycleStatus = "Assigned";
                        device.ProcessingDecision = "Refurbishment";
                    }
                    else if (recycleRequests.Any())
                    {
                        device.LifecycleStatus = "AllocatedToRecycling";
                        device.Status = "InProgress";
                        device.ProcessingLifecycleStatus = "Assigned";
                        device.ProcessingDecision = "Recycling Center";
                    }

                    // 4. Remove Settlement Payments, Payouts, Ledger Transactions
                    var settlementPayments = await _context.Payments
                        .Where(p => p.ReferenceId == devId && 
                                    (p.PaymentType == "CenterDeviceSettlement" || p.PaymentType == "RefurbishmentFee" || p.PaymentType == "RecyclingFee"))
                        .ToListAsync();
                    if (settlementPayments.Any())
                    {
                        _context.Payments.RemoveRange(settlementPayments);
                    }

                    var payouts = await _context.Payouts
                        .Where(p => p.DeviceId == devId)
                        .ToListAsync();
                    if (payouts.Any())
                    {
                        _context.Payouts.RemoveRange(payouts);
                    }

                    var transactions = await _context.EcoCycleTransactions
                        .Where(t => t.DeviceId == devId)
                        .ToListAsync();
                    if (transactions.Any())
                    {
                        _context.EcoCycleTransactions.RemoveRange(transactions);
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Successfully reset devices [{string.Join(", ", targetIds)}] back to pre-processing state.",
                    resetDeviceIds = targetIds
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting devices pre-processing");
                return StatusCode(500, new { message = "Error resetting devices.", details = ex.Message });
            }
        }

        /// <summary>
        /// Get all incoming payments, outgoing payouts, and EcoCycle transactions with full details
        /// </summary>
        [HttpGet("all-transactions")]
        public async Task<IActionResult> GetAllTransactions([FromQuery] string? filterType = null, [FromQuery] string? search = null)
        {
            try
            {
                // Fetch reference lookups
                var users = await _context.Users.ToListAsync();
                var technicians = await _context.Technician.ToListAsync();
                var agents = await _context.CollectionAgents.ToListAsync();
                var refurbCenters = await _context.RefurbishmentCenter.ToListAsync();
                var recycleCenters = await _context.RecyclingCenter.ToListAsync();
                var devices = await _context.Device
                    .Include(d => d.Category)
                    .Include(d => d.DeviceModel)
                    .ToListAsync();

                string ResolveActorName(string? type, int? loginId)
                {
                    if (string.Equals(type, "EcoCycle", StringComparison.OrdinalIgnoreCase))
                        return "EcoCycle Escrow Pool";

                    if (!loginId.HasValue || loginId <= 0)
                        return type ?? "System";

                    if (string.Equals(type, "User", StringComparison.OrdinalIgnoreCase) || string.Equals(type, "Citizen", StringComparison.OrdinalIgnoreCase))
                    {
                        var u = users.FirstOrDefault(x => x.LoginId == loginId.Value);
                        return u != null ? $"{u.FirstName} {u.LastName}".Trim() + " (Citizen)" : $"Citizen #{loginId}";
                    }
                    if (string.Equals(type, "Technician", StringComparison.OrdinalIgnoreCase))
                    {
                        var t = technicians.FirstOrDefault(x => x.LoginId == loginId.Value);
                        return t != null ? $"{t.FirstName} {t.LastName}".Trim() + " (Technician)" : $"Technician #{loginId}";
                    }
                    if (string.Equals(type, "CollectionAgent", StringComparison.OrdinalIgnoreCase))
                    {
                        var a = agents.FirstOrDefault(x => x.LoginId == loginId.Value);
                        return a != null ? $"{a.FirstName} {a.LastName}".Trim() + " (Collection Agent)" : $"Agent #{loginId}";
                    }
                    if (string.Equals(type, "RefurbishmentCenter", StringComparison.OrdinalIgnoreCase))
                    {
                        var r = refurbCenters.FirstOrDefault(x => x.LoginId == loginId.Value);
                        return r != null ? $"{r.CenterName} (Refurbishment)" : $"Refurb Center #{loginId}";
                    }
                    if (string.Equals(type, "RecyclingCenter", StringComparison.OrdinalIgnoreCase))
                    {
                        var r = recycleCenters.FirstOrDefault(x => x.LoginId == loginId.Value);
                        return r != null ? $"{r.CenterName} (Recycling)" : $"Recycle Center #{loginId}";
                    }

                    return $"{type} #{loginId}";
                }

                // 1. Fetch Incoming Payments
                var payments = await _context.Payments.OrderByDescending(p => p.CreatedAt).ToListAsync();

                // 2. Fetch Outgoing Payouts
                var payouts = await _context.Payouts.OrderByDescending(p => p.CreatedAt).ToListAsync();

                var unifiedList = new List<object>();

                // Map Payments (Incoming)
                foreach (var p in payments)
                {
                    var dev = p.ReferenceId.HasValue ? devices.FirstOrDefault(d => d.DeviceId == p.ReferenceId.Value) : null;
                    string desc = p.PaymentType switch
                    {
                        "CenterDeviceSettlement" => $"Center Buyout Settlement for Device #{p.ReferenceId}",
                        "TechnicianPenalty" => $"Technician Compliance Penalty Fine #PEN-{p.ReferenceId}",
                        "RefurbishmentFee" => $"Refurbishment Processing Settlement for Device #{p.ReferenceId}",
                        "RecyclingFee" => $"Recycling Material Recovery Settlement for Device #{p.ReferenceId}",
                        _ => $"{p.PaymentType} Payment #{p.PaymentId}"
                    };

                    unifiedList.Add(new
                    {
                        id = $"PAY-{p.PaymentId}",
                        rawId = p.PaymentId,
                        category = "Payment",
                        transactionType = p.PaymentType,
                        direction = p.TransactionType ?? "Incoming",
                        amount = p.Amount,
                        currency = p.Currency ?? "INR",
                        status = p.PaymentStatus,
                        payer = ResolveActorName(p.PayerType, p.PayerLoginId),
                        payerType = p.PayerType,
                        receiver = ResolveActorName(p.ReceiverType, p.ReceiverLoginId),
                        receiverType = p.ReceiverType,
                        deviceId = p.ReferenceId,
                        deviceModel = dev != null ? $"{dev.Brand} {dev.Model ?? dev.DeviceModel?.Model}" : null,
                        deviceCategory = dev?.Category?.CategoryName ?? "Electronics",
                        gateway = "Razorpay",
                        razorpayPaymentId = p.RazorpayPaymentId,
                        razorpayOrderId = p.RazorpayOrderId,
                        description = desc,
                        date = p.PaidAt ?? p.CreatedAt,
                        isEcoCycleFlow = true
                    });
                }

                // Map Payouts (Outgoing)
                foreach (var po in payouts)
                {
                    var dev = devices.FirstOrDefault(d => d.DeviceId == po.DeviceId);
                    string desc = po.PayoutType switch
                    {
                        "UserValuation" => $"Citizen Residual Value Payout for Device #{po.DeviceId}",
                        "CollectionFee" => $"Collection & Transport Logistics Compensation for Device #{po.DeviceId}",
                        "InspectionFee" => $"Technician Diagnostic Inspection Compensation for Device #{po.DeviceId}",
                        "ProcessingFee" => $"Center Material Recovery/Repair Compensation for Device #{po.DeviceId}",
                        _ => $"{po.PayoutType} Payout #{po.PayoutId}"
                    };

                    unifiedList.Add(new
                    {
                        id = $"PO-{po.PayoutId}",
                        rawId = po.PayoutId,
                        category = "Payout",
                        transactionType = po.PayoutType,
                        direction = "Outgoing",
                        amount = po.Amount,
                        currency = po.Currency ?? "INR",
                        status = po.PayoutStatus,
                        payer = "EcoCycle Escrow Pool",
                        payerType = "EcoCycle",
                        receiver = ResolveActorName(po.ReceiverType, po.ReceiverLoginId),
                        receiverType = po.ReceiverType,
                        deviceId = po.DeviceId,
                        deviceModel = dev != null ? $"{dev.Brand} {dev.Model ?? dev.DeviceModel?.Model}" : null,
                        deviceCategory = dev?.Category?.CategoryName ?? "Electronics",
                        gateway = "EcoCycle Escrow Payout Engine",
                        razorpayPaymentId = po.RazorpayPayoutId ?? po.PayoutBatchId,
                        razorpayOrderId = po.PayoutBatchId,
                        description = desc,
                        date = po.PaidAt ?? po.CreatedAt,
                        isEcoCycleFlow = true
                    });
                }

                // Filter & Sort
                var sorted = unifiedList.OrderByDescending(x => ((dynamic)x).date).ToList();

                return Ok(new
                {
                    success = true,
                    totalCount = sorted.Count,
                    transactions = sorted
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all transactions");
                return StatusCode(500, new { message = "Failed to fetch transactions.", details = ex.Message });
            }
        }

        /// <summary>
        /// Get high-level financial health, escrow reserves, and EcoCycle-only money metrics
        /// </summary>
        [HttpGet("ecocycle-financial-summary")]
        public async Task<IActionResult> GetEcoCycleFinancialSummary()
        {
            try
            {
                var payments = await _context.Payments.ToListAsync();
                var payouts = await _context.Payouts.ToListAsync();
                var ledgerEntries = await _context.EcoCycleTransactions.OrderByDescending(t => t.CreatedAt).Take(20).ToListAsync();
                var devices = await _context.Device.ToListAsync();

                // Completed Inflows
                var completedInflows = payments.Where(p => p.PaymentStatus == "Paid" || p.PaymentStatus == "Completed" || p.PaymentStatus == "Success").ToList();
                decimal totalInflow = completedInflows.Sum(p => p.Amount);

                decimal centerSettlementInflow = completedInflows.Where(p => p.PaymentType == "CenterDeviceSettlement" || p.PaymentType == "RefurbishmentFee" || p.PaymentType == "RecyclingFee").Sum(p => p.Amount);
                decimal penaltyInflow = completedInflows.Where(p => p.PaymentType == "TechnicianPenalty" || p.PaymentType == "CollectionAgentPenalty").Sum(p => p.Amount);

                // Completed Outflows
                var completedPayouts = payouts.Where(p => p.PayoutStatus == "Paid" || p.PayoutStatus == "Completed" || p.PayoutStatus == "Success").ToList();
                decimal totalOutflow = completedPayouts.Sum(p => p.Amount);

                decimal citizenOutflow = completedPayouts.Where(p => p.PayoutType == "UserValuation").Sum(p => p.Amount);
                decimal technicianOutflow = completedPayouts.Where(p => p.PayoutType == "InspectionFee").Sum(p => p.Amount);
                decimal agentOutflow = completedPayouts.Where(p => p.PayoutType == "CollectionFee").Sum(p => p.Amount);
                decimal centerOutflow = completedPayouts.Where(p => p.PayoutType == "ProcessingFee").Sum(p => p.Amount);

                // Pending amounts
                decimal pendingPayouts = payouts.Where(p => p.PayoutStatus == "Pending" || p.PayoutStatus == "Processing").Sum(p => p.Amount);

                // Current Escrow Pool Balance
                decimal currentEscrowBalance = Math.Max(0m, totalInflow - totalOutflow);

                // Calculate Platform Retained Share across all settled devices
                decimal platformRetainedProfit = 0m;
                var settledDeviceIds = devices.Where(d => d.LifecycleStatus == "Settled" || d.Status == "Completed").Select(d => d.DeviceId).ToList();

                foreach (var devId in settledDeviceIds)
                {
                    decimal devInflow = payments.Where(p => p.ReferenceId == devId && p.PaymentStatus == "Paid").Sum(p => p.Amount);
                    decimal devOutflow = payouts.Where(p => p.DeviceId == devId && p.PayoutStatus == "Paid").Sum(p => p.Amount);
                    if (devInflow > devOutflow)
                    {
                        platformRetainedProfit += (devInflow - devOutflow);
                    }
                }

                // Add penalty revenue to platform retained profit
                platformRetainedProfit += penaltyInflow;

                return Ok(new
                {
                    success = true,
                    totalInflow,
                    totalOutflow,
                    currentEscrowBalance,
                    platformRetainedProfit,
                    totalSettledDevices = settledDeviceIds.Count,
                    inflowBreakdown = new
                    {
                        centerSettlements = centerSettlementInflow,
                        penalties = penaltyInflow,
                        other = totalInflow - centerSettlementInflow - penaltyInflow
                    },
                    outflowBreakdown = new
                    {
                        citizens = citizenOutflow,
                        technicians = technicianOutflow,
                        agents = agentOutflow,
                        centers = centerOutflow
                    },
                    pendingPayouts,
                    recentLedger = ledgerEntries.Select(t => new
                    {
                        t.TransactionId,
                        t.DeviceId,
                        t.TransactionType,
                        t.Direction,
                        t.Amount,
                        t.Status,
                        t.Description,
                        t.CreatedAt
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating EcoCycle financial summary");
                return StatusCode(500, new { message = "Failed to calculate financial summary.", details = ex.Message });
            }
        }

        private static async Task<bool> SendEmailAsync(string recipientEmail, string subject, string htmlMessage)
        {
            if (string.IsNullOrWhiteSpace(recipientEmail)) return false;

            try
            {
                using var client = new SmtpClient("smtp.gmail.com", 587)
                {
                    EnableSsl = true,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential("drogbqdidier7@gmail.com", "gxgy cclr rght awid")
                };

                using var mail = new MailMessage
                {
                    From = new MailAddress("drogbqdidier7@gmail.com", "EcoCycle Settlements & Disbursal"),
                    Subject = subject,
                    Body = htmlMessage,
                    IsBodyHtml = true
                };

                mail.To.Add(recipientEmail.Trim());
                await client.SendMailAsync(mail);
                Console.WriteLine($"[Settlement Email Notice] Successfully delivered email to {recipientEmail}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Settlement Email Notice] Could not deliver email to {recipientEmail}: {ex.Message}");
                return false;
            }
        }

        private static string GeneratePayoutEmailHtml(string recipientName, string role, decimal amount, int deviceId, string brand, string model, string transactionId, string payoutType)
        {
            string devLabel = $"{brand} {model}".Trim();
            if (string.IsNullOrWhiteSpace(devLabel)) devLabel = $"Hardware Asset #{deviceId}";

            return $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <title>EcoCycle Payment Advice</title>
                </head>
                <body style='font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;'>
                    <table align='center' border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);'>
                        <tr>
                            <td style='background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 28px 24px; text-align: center;'>
                                <h1 style='color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;'>EcoCycle Payment Disbursed</h1>
                                <p style='color: #d1fae5; margin: 6px 0 0; font-size: 13px; font-weight: 600;'>Official Settlement Advice &bull; Device #{deviceId}</p>
                            </td>
                        </tr>
                        <tr>
                            <td style='padding: 28px 24px;'>
                                <p style='font-size: 15px; margin: 0 0 14px;'>Hello <strong>{recipientName}</strong>,</p>
                                <p style='font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;'>
                                    We are delighted to confirm that your payout for <strong>{devLabel}</strong> (Device #{deviceId}) has been successfully authorized and disbursed.
                                </p>

                                <div style='background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;'>
                                    <div style='font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 0.08em;'>Disbursed Amount</div>
                                    <div style='font-size: 34px; font-weight: 900; color: #065f46; margin: 4px 0;'>₹{amount:N2}</div>
                                    <div style='font-size: 12px; font-weight: 700; color: #10b981;'>✓ Credited &bull; Direct Escrow Settlement</div>
                                </div>

                                <table width='100%' style='border-collapse: collapse; margin-bottom: 20px; font-size: 13px;'>
                                    <tr style='border-bottom: 1px solid #f1f5f9;'>
                                        <td style='padding: 10px 0; color: #64748b; font-weight: 600;'>Beneficiary:</td>
                                        <td style='padding: 10px 0; color: #0f172a; font-weight: 700; text-align: right;'>{recipientName} ({role})</td>
                                    </tr>
                                    <tr style='border-bottom: 1px solid #f1f5f9;'>
                                        <td style='padding: 10px 0; color: #64748b; font-weight: 600;'>Payout Purpose:</td>
                                        <td style='padding: 10px 0; color: #0f172a; font-weight: 700; text-align: right;'>{payoutType}</td>
                                    </tr>
                                    <tr style='border-bottom: 1px solid #f1f5f9;'>
                                        <td style='padding: 10px 0; color: #64748b; font-weight: 600;'>Device Model:</td>
                                        <td style='padding: 10px 0; color: #0f172a; font-weight: 700; text-align: right;'>{devLabel}</td>
                                    </tr>
                                    <tr style='border-bottom: 1px solid #f1f5f9;'>
                                        <td style='padding: 10px 0; color: #64748b; font-weight: 600;'>Transaction Ref:</td>
                                        <td style='padding: 10px 0; font-family: monospace; font-weight: 700; color: #0f172a; text-align: right;'>{transactionId}</td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 10px 0; color: #64748b; font-weight: 600;'>Disbursement Time:</td>
                                        <td style='padding: 10px 0; color: #0f172a; font-weight: 700; text-align: right;'>{DateTime.Now:dd MMM yyyy, hh:mm tt}</td>
                                    </tr>
                                </table>

                                <p style='font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 10px;'>
                                    Your participation supports verified zero-landfill electronic recycling and ethical refurbished hardware reuse in India.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style='background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;'>
                                &copy; {DateTime.Now.Year} EcoCycle E-Waste Platform &bull; Automated Settlement Notification &bull; Do not reply
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            ";
        }
    }
}

