using EcoCycle.API.Data;
using EcoCycle.API.Data.DTOs;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcoCycle.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PayoutController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PayoutController> _logger;

        public PayoutController(ApplicationDbContext context, ILogger<PayoutController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get all payouts for all devices
        /// </summary>
        [HttpGet("all")]
        public async Task<IActionResult> GetAllPayouts()
        {
            try
            {
                var payouts = await _context.Payouts
                    .OrderByDescending(p => p.CreatedAt)
                    .ToListAsync();
                return Ok(payouts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all payouts");
                return StatusCode(500, new { message = "Error retrieving payouts.", details = ex.Message });
            }
        }

        /// <summary>
        /// Get all payouts and distribution summary for a specific device
        /// </summary>
        [HttpGet("device/{deviceId}")]
        public async Task<IActionResult> GetDevicePayouts(int deviceId)
        {
            try
            {
                var device = await _context.Device
                    .Include(d => d.User)
                    .Include(d => d.DeviceModel)
                    .Include(d => d.Category)
                    .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

                if (device == null)
                {
                    return NotFound(new { message = $"Device with ID {deviceId} not found." });
                }

                // Incoming Settlement Payment (Center -> EcoCycle)
                var incomingPayment = await _context.Payments
                    .Where(p => p.ReferenceId == deviceId &&
                                (p.PaymentType == "CenterDeviceSettlement" || p.PaymentType == "RefurbishmentFee" || p.PaymentType == "RecyclingFee" || p.PaymentType == "CenterSettlement") &&
                                p.TransactionType == "Incoming")
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefaultAsync();

                // Existing Payouts for this device
                var payouts = await _context.Payouts
                    .Include(p => p.Receiver)
                    .Where(p => p.DeviceId == deviceId)
                    .OrderBy(p => p.PayoutId)
                    .ToListAsync();

                // Resolve Receiver Names and Bank Details status
                var users = await _context.Users.ToListAsync();
                var agents = await _context.CollectionAgents.ToListAsync();
                var technicians = await _context.Technician.ToListAsync();
                var refurbCenters = await _context.RefurbishmentCenter.ToListAsync();
                var recycleCenters = await _context.RecyclingCenter.ToListAsync();

                var payoutItems = payouts.Select(p =>
                {
                    string recipientName = "Unknown";
                    bool hasBankDetails = false;
                    string bankSummary = "Not Provided";

                    if (p.ReceiverType == "User" || p.ReceiverType == "Citizen")
                    {
                        var u = users.FirstOrDefault(x => x.LoginId == p.ReceiverLoginId);
                        if (u != null)
                        {
                            recipientName = $"{u.FirstName} {u.LastName}".Trim();
                            hasBankDetails = !string.IsNullOrWhiteSpace(u.AccountNumber) && !string.IsNullOrWhiteSpace(u.IFSCCode);
                            bankSummary = hasBankDetails ? $"{u.BankName} (A/C: ****{u.AccountNumber.Substring(Math.Max(0, u.AccountNumber.Length - 4))})" : "Bank Details Not Added";
                        }
                    }
                    else if (p.ReceiverType == "CollectionAgent")
                    {
                        var a = agents.FirstOrDefault(x => x.LoginId == p.ReceiverLoginId);
                        if (a != null)
                        {
                            recipientName = $"{a.FirstName} {a.LastName}".Trim();
                            hasBankDetails = !string.IsNullOrWhiteSpace(a.AccountNumber);
                            bankSummary = hasBankDetails ? $"{a.BankName} (A/C: ****{a.AccountNumber.Substring(Math.Max(0, a.AccountNumber.Length - 4))})" : "Bank Details Not Added";
                        }
                    }
                    else if (p.ReceiverType == "Technician")
                    {
                        var t = technicians.FirstOrDefault(x => x.LoginId == p.ReceiverLoginId);
                        if (t != null)
                        {
                            recipientName = $"{t.FirstName} {t.LastName}".Trim();
                            hasBankDetails = true; // Registered internal technician
                            bankSummary = "Official Payroll / Direct Deposit";
                        }
                    }
                    else if (p.ReceiverType == "RefurbishmentCenter" || p.ReceiverType == "Refurbishment Center")
                    {
                        var r = refurbCenters.FirstOrDefault(x => x.LoginId == p.ReceiverLoginId)
                             ?? refurbCenters.FirstOrDefault(x => x.RefurbishmentCenterId == p.ReceiverLoginId);
                        if (r != null)
                        {
                            recipientName = r.CenterName;
                            hasBankDetails = true;
                            bankSummary = "Commercial Center Escrow Account";
                        }
                    }
                    else if (p.ReceiverType == "RecyclingCenter" || p.ReceiverType == "Recycling Center")
                    {
                        var r = recycleCenters.FirstOrDefault(x => x.LoginId == p.ReceiverLoginId)
                             ?? recycleCenters.FirstOrDefault(x => x.RecyclingCenterId == p.ReceiverLoginId);
                        if (r != null)
                        {
                            recipientName = r.CenterName;
                            hasBankDetails = true;
                            bankSummary = "Commercial Center Escrow Account";
                        }
                    }

                    return new
                    {
                        payoutId = p.PayoutId,
                        deviceId = p.DeviceId,
                        receiverType = p.ReceiverType,
                        receiverLoginId = p.ReceiverLoginId,
                        receiverName = recipientName,
                        payoutType = p.PayoutType,
                        amount = p.Amount,
                        currency = p.Currency,
                        payoutStatus = p.PayoutStatus,
                        payoutBatchId = p.PayoutBatchId,
                        razorpayPayoutId = p.RazorpayPayoutId,
                        failureReason = p.FailureReason,
                        hasBankDetails,
                        bankSummary,
                        createdAt = p.CreatedAt,
                        paidAt = p.PaidAt
                    };
                }).ToList();

                decimal totalIncoming = incomingPayment?.Amount ?? 0m;
                decimal totalDistributed = payouts.Where(p => p.PayoutStatus == "Paid" || p.PayoutStatus == "Processing").Sum(p => p.Amount);
                decimal pendingDistribution = payouts.Where(p => p.PayoutStatus == "Pending").Sum(p => p.Amount);
                decimal ecoCycleRetainedShare = Math.Max(0m, totalIncoming - (totalDistributed + pendingDistribution));

                return Ok(new
                {
                    deviceId,
                    deviceTitle = $"{device.Brand} {device.Model ?? device.DeviceModel?.Model}",
                    incomingPayment = incomingPayment != null ? new
                    {
                        paymentId = incomingPayment.PaymentId,
                        amount = incomingPayment.Amount,
                        status = incomingPayment.PaymentStatus,
                        paidAt = incomingPayment.PaidAt,
                        razorpayPaymentId = incomingPayment.RazorpayPaymentId
                    } : null,
                    isPaymentReceived = incomingPayment != null && incomingPayment.PaymentStatus == "Paid",
                    totalIncoming,
                    totalDistributed,
                    pendingDistribution,
                    ecoCycleRetainedShare,
                    payoutCount = payoutItems.Count,
                    payouts = payoutItems
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching payouts for device {DeviceId}", deviceId);
                return StatusCode(500, new { message = "Error retrieving payout records.", details = ex.Message });
            }
        }

        /// <summary>
        /// Admin "Pay All" action: executes individual payouts for all eligible stakeholders atomically
        /// </summary>
        [HttpPost("pay-all/{deviceId}")]
        public async Task<IActionResult> PayAll(int deviceId, [FromBody] DistributePayoutsDto? dto)
        {
            try
            {
                var device = await _context.Device
                    .Include(d => d.User)
                    .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

                if (device == null)
                {
                    return NotFound(new { message = $"Device with ID {deviceId} not found." });
                }

                // 1. Verify that Incoming Center Settlement Payment is Paid
                var incomingPayment = await _context.Payments
                    .Where(p => p.ReferenceId == deviceId &&
                                (p.PaymentType == "CenterDeviceSettlement" || p.PaymentType == "RefurbishmentFee" || p.PaymentType == "RecyclingFee" || p.PaymentType == "CenterSettlement") &&
                                p.TransactionType == "Incoming")
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefaultAsync();

                if (incomingPayment == null || incomingPayment.PaymentStatus != "Paid")
                {
                    return BadRequest(new
                    {
                        message = "Cannot execute payouts: Settlement payment has not been received into EcoCycle Escrow yet. Center Payment must be 'Paid' first."
                    });
                }

                // 2. Fetch or Create Payout rows
                var existingPayouts = await _context.Payouts
                    .Where(p => p.DeviceId == deviceId)
                    .ToListAsync();

                // If all existing payouts are already Paid, prevent duplicate payout execution
                if (existingPayouts.Any() && existingPayouts.All(p => p.PayoutStatus == "Paid"))
                {
                    return Ok(new
                    {
                        success = true,
                        alreadySettled = true,
                        message = $"All stakeholder payouts for Device #{deviceId} have already been disbursed and settled.",
                        batchId = existingPayouts.FirstOrDefault()?.PayoutBatchId,
                        totalDisbursed = existingPayouts.Sum(p => p.Amount)
                    });
                }

                string batchId = $"PAYALL_{deviceId}_{DateTime.UtcNow.Ticks}";

                // If payouts do not exist yet, create them from DTO or standard calculation
                if (!existingPayouts.Any())
                {
                    // Fetch stakeholder Logins
                    int citizenLoginId = device.User?.LoginId ?? 0;

                    var inspection = await _context.Inspection
                        .Include(i => i.Technician)
                        .Where(i => i.DeviceId == deviceId)
                        .OrderByDescending(i => i.InspectionCompletedAt ?? i.InspectionStartedAt ?? DateTime.MinValue)
                        .FirstOrDefaultAsync();
                    int techLoginId = inspection?.Technician?.LoginId ?? 0;

                    var assignments = await _context.CollectionAssignments
                        .Include(a => a.CollectionAgent)
                        .Where(a => a.DeviceId == deviceId)
                        .OrderBy(a => a.CreatedAt)
                        .ToListAsync();

                    int agent1LoginId = assignments.FirstOrDefault()?.CollectionAgent?.LoginId ?? 0;
                    int agent2LoginId = assignments.Count > 1 ? assignments.Skip(1).FirstOrDefault()?.CollectionAgent?.LoginId ?? 0 : 0;

                    // Robust Center Lookup (Refurbishment or Recycling Center)
                    int centerLoginId = 0;
                    string centerType = "RefurbishmentCenter";

                    var refurbRequest = await _context.RefurbishmentRequests
                        .Include(r => r.RefurbishmentCenter)
                        .Where(r => r.DeviceId == deviceId && r.Status != "Rejected")
                        .OrderByDescending(r => r.RefurbishmentRequestId)
                        .FirstOrDefaultAsync();

                    if (refurbRequest == null)
                    {
                        refurbRequest = await _context.RefurbishmentRequests
                            .Include(r => r.RefurbishmentCenter)
                            .Where(r => r.DeviceId == deviceId)
                            .OrderByDescending(r => r.RefurbishmentRequestId)
                            .FirstOrDefaultAsync();
                    }

                    var recycleRequest = await _context.RecyclingCenterRequests
                        .Include(r => r.RecyclingCenter)
                        .Where(r => r.DeviceId == deviceId && r.Status != "Rejected")
                        .OrderByDescending(r => r.RecyclingCenterRequestId)
                        .FirstOrDefaultAsync();

                    if (recycleRequest == null)
                    {
                        recycleRequest = await _context.RecyclingCenterRequests
                            .Include(r => r.RecyclingCenter)
                            .Where(r => r.DeviceId == deviceId)
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
                            .FirstOrDefaultAsync(p => p.RefurbishmentRequest.DeviceId == deviceId);
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
                                .FirstOrDefaultAsync(p => p.RecyclingCenterRequest.DeviceId == deviceId);
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

                    decimal a1Amt = dto != null && dto.Agent1Amount >= 0 ? dto.Agent1Amount : 150m;
                    decimal techAmt = dto != null && dto.TechnicianAmount >= 0 ? dto.TechnicianAmount : 300m;
                    decimal a2Amt = dto != null && agent2LoginId > 0 ? dto.Agent2Amount : (agent2LoginId > 0 ? 150m : 0m);

                    decimal centerAmt = 0m;
                    if (dto != null && dto.CenterAmount > 0)
                    {
                        centerAmt = dto.CenterAmount;
                    }
                    else if (dto == null)
                    {
                        var refurbProc = await _context.RefurbishmentProcesses
                            .Include(p => p.RefurbishmentRequest)
                            .FirstOrDefaultAsync(p => p.RefurbishmentRequest.DeviceId == deviceId);
                        if (refurbProc?.EstimatedRepairCost > 0)
                        {
                            centerAmt = refurbProc.EstimatedRepairCost.Value;
                        }
                        else
                        {
                            var recycleProc = await _context.RecyclingProcesses
                                .Include(p => p.RecyclingCenterRequest)
                                .FirstOrDefaultAsync(p => p.RecyclingCenterRequest.DeviceId == deviceId);
                            if (recycleProc?.ProcessingCost > 0)
                            {
                                centerAmt = recycleProc.ProcessingCost.Value;
                            }
                        }
                    }

                    decimal citizenAmt = 0m;
                    if (dto != null)
                    {
                        // Explicitly honor the passed citizen amount (e.g. ₹0 for donations / responsible recycling)
                        citizenAmt = Math.Max(0m, dto.CitizenAmount);
                    }
                    else if ((incomingPayment?.Amount ?? 0m) > 0)
                    {
                        // Only fallback when no DTO payload is provided at all
                        citizenAmt = Math.Max(0m, (incomingPayment.Amount) - (a1Amt + techAmt + a2Amt + centerAmt));
                    }

                    // A. Citizen (Only create payout if citizen amount > 0)
                    if (citizenLoginId > 0 && citizenAmt > 0)
                    {
                        var pCitizen = new Payout
                        {
                            DeviceId = deviceId,
                            ReceiverType = "User",
                            ReceiverLoginId = citizenLoginId,
                            PayoutType = "UserValuation",
                            Amount = citizenAmt,
                            Currency = "INR",
                            PayoutStatus = "Pending",
                            PayoutBatchId = batchId,
                            CreatedAt = DateTime.Now
                        };
                        _context.Payouts.Add(pCitizen);
                        existingPayouts.Add(pCitizen);
                    }

                    // B. Agent 1
                    if (agent1LoginId > 0 && a1Amt > 0)
                    {
                        var pA1 = new Payout
                        {
                            DeviceId = deviceId,
                            ReceiverType = "CollectionAgent",
                            ReceiverLoginId = agent1LoginId,
                            PayoutType = "CollectionFee",
                            Amount = a1Amt,
                            Currency = "INR",
                            PayoutStatus = "Pending",
                            PayoutBatchId = batchId,
                            CreatedAt = DateTime.Now
                        };
                        _context.Payouts.Add(pA1);
                        existingPayouts.Add(pA1);
                    }

                    // C. Technician
                    if (techLoginId > 0 && techAmt > 0)
                    {
                        var pTech = new Payout
                        {
                            DeviceId = deviceId,
                            ReceiverType = "Technician",
                            ReceiverLoginId = techLoginId,
                            PayoutType = "InspectionFee",
                            Amount = techAmt,
                            Currency = "INR",
                            PayoutStatus = "Pending",
                            PayoutBatchId = batchId,
                            CreatedAt = DateTime.Now
                        };
                        _context.Payouts.Add(pTech);
                        existingPayouts.Add(pTech);
                    }

                    // D. Agent 2
                    if (agent2LoginId > 0 && a2Amt > 0)
                    {
                        var pA2 = new Payout
                        {
                            DeviceId = deviceId,
                            ReceiverType = "CollectionAgent",
                            ReceiverLoginId = agent2LoginId,
                            PayoutType = "CollectionFee",
                            Amount = a2Amt,
                            Currency = "INR",
                            PayoutStatus = "Pending",
                            PayoutBatchId = batchId,
                            CreatedAt = DateTime.Now
                        };
                        _context.Payouts.Add(pA2);
                        existingPayouts.Add(pA2);
                    }

                    // E. Center
                    if (centerLoginId > 0 && centerAmt > 0)
                    {
                        var pCenter = new Payout
                        {
                            DeviceId = deviceId,
                            ReceiverType = centerType,
                            ReceiverLoginId = centerLoginId,
                            PayoutType = "ProcessingFee",
                            Amount = centerAmt,
                            Currency = "INR",
                            PayoutStatus = "Pending",
                            PayoutBatchId = batchId,
                            CreatedAt = DateTime.Now
                        };
                        _context.Payouts.Add(pCenter);
                        existingPayouts.Add(pCenter);
                    }

                    await _context.SaveChangesAsync();
                }

                // 3. Process individual payouts
                var usersList = await _context.Users.ToListAsync();
                int processedCount = 0;
                int pendingBankCount = 0;
                decimal totalPaidNow = 0m;

                foreach (var payout in existingPayouts.Where(p => p.PayoutStatus == "Pending" || p.PayoutStatus == "Failed"))
                {
                    // Check bank details readiness
                    bool canDisburse = true;
                    string reason = "";

                    if (payout.ReceiverType == "User" || payout.ReceiverType == "Citizen")
                    {
                        var u = usersList.FirstOrDefault(x => x.LoginId == payout.ReceiverLoginId);
                        if (u == null || string.IsNullOrWhiteSpace(u.AccountNumber) || string.IsNullOrWhiteSpace(u.IFSCCode))
                        {
                            canDisburse = false;
                            reason = "Awaiting Citizen Bank Account / UPI Details.";
                            payout.FailureReason = reason;
                            pendingBankCount++;
                        }
                    }

                    if (canDisburse)
                    {
                        payout.PayoutStatus = "Paid";
                        payout.PaidAt = DateTime.Now;
                        payout.UpdatedAt = DateTime.Now;
                        payout.FailureReason = null;
                        payout.RazorpayPayoutId = $"POUT_RAZOR_{payout.PayoutId}_{DateTime.UtcNow.Ticks}";
                        payout.PayoutBatchId = batchId;
                        processedCount++;
                        totalPaidNow += payout.Amount;

                        // Send push / DB Notification to recipient
                        _context.Notification.Add(new Notification
                        {
                            LoginId = payout.ReceiverLoginId,
                            Title = $"{payout.PayoutType} Disbursed",
                            Message = $"EcoCycle Payout of ₹{payout.Amount:N2} for Device #{deviceId} has been successfully settled and transferred.",
                            Isread = false,
                            Status = true,
                            CreatedAt = DateTime.Now
                        });
                    }
                }

                // 4. Record EcoCycle Transaction Ledger Debit
                if (totalPaidNow > 0)
                {
                    decimal totalOutflows = existingPayouts.Where(p => p.PayoutStatus == "Paid").Sum(p => p.Amount);
                    decimal ecoCycleSurplus = Math.Max(0m, incomingPayment.Amount - totalOutflows);

                    _context.EcoCycleTransactions.Add(new EcoCycleTransaction
                    {
                        DeviceId = deviceId,
                        TransactionType = "PayAllMultiStakeholderDisbursal",
                        Direction = "Debit",
                        Amount = totalPaidNow,
                        Status = "Completed",
                        Description = $"Pay All executed: Disbursed ₹{totalPaidNow:N2} across {processedCount} stakeholders (Batch #{batchId}). EcoCycle Platform Surplus retained: ₹{ecoCycleSurplus:N2}.",
                        CreatedAt = DateTime.Now
                    });
                }

                // 5. Update device status if all done
                bool allComplete = existingPayouts.All(p => p.PayoutStatus == "Paid");
                if (allComplete)
                {
                    device.LifecycleStatus = "Settled";
                    device.Status = "Completed";
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = processedCount > 0 
                        ? $"Pay All processed successfully: {processedCount} payouts disbursed (₹{totalPaidNow:N2})." + (pendingBankCount > 0 ? $" {pendingBankCount} pending citizen bank details." : "")
                        : (pendingBankCount > 0 ? "Payouts queued. Waiting for citizen bank details before final transfer." : "All payouts are already settled."),
                    batchId,
                    processedCount,
                    pendingBankCount,
                    totalPaidNow,
                    allComplete,
                    payouts = existingPayouts.Select(p => new
                    {
                        p.PayoutId,
                        p.ReceiverType,
                        p.ReceiverLoginId,
                        p.PayoutType,
                        p.Amount,
                        p.PayoutStatus,
                        p.PaidAt,
                        p.FailureReason
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing Pay All for device {DeviceId}", deviceId);
                return StatusCode(500, new { message = "An error occurred while executing Pay All disbursal.", details = ex.Message });
            }
        }

        /// <summary>
        /// Retry an individual pending or failed payout
        /// </summary>
        [HttpPost("retry/{payoutId}")]
        public async Task<IActionResult> RetryPayout(int payoutId)
        {
            try
            {
                var payout = await _context.Payouts.FirstOrDefaultAsync(p => p.PayoutId == payoutId);
                if (payout == null)
                {
                    return NotFound(new { message = $"Payout with ID {payoutId} not found." });
                }

                if (payout.PayoutStatus == "Paid")
                {
                    return BadRequest(new { message = "Payout is already paid." });
                }

                // Check citizen bank details if user
                if (payout.ReceiverType == "User" || payout.ReceiverType == "Citizen")
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.LoginId == payout.ReceiverLoginId);
                    if (user == null || string.IsNullOrWhiteSpace(user.AccountNumber) || string.IsNullOrWhiteSpace(user.IFSCCode))
                    {
                        return BadRequest(new { message = "Citizen has not provided bank details yet. Cannot disburse payout." });
                    }
                }

                payout.PayoutStatus = "Paid";
                payout.PaidAt = DateTime.Now;
                payout.UpdatedAt = DateTime.Now;
                payout.FailureReason = null;
                payout.RazorpayPayoutId = $"POUT_RETRY_{payout.PayoutId}_{DateTime.UtcNow.Ticks}";

                _context.Notification.Add(new Notification
                {
                    LoginId = payout.ReceiverLoginId,
                    Title = $"{payout.PayoutType} Disbursed (Retry)",
                    Message = $"Your payout of ₹{payout.Amount:N2} for Device #{payout.DeviceId} has been transferred to your bank account.",
                    Isread = false,
                    Status = true,
                    CreatedAt = DateTime.Now
                });

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Payout #{payoutId} of ₹{payout.Amount:N2} settled successfully.",
                    payout
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrying payout {PayoutId}", payoutId);
                return StatusCode(500, new { message = "Error retrying payout.", details = ex.Message });
            }
        }

        /// <summary>
        /// Admin action: Delete/Reset all payout records for a specific device (allowing payout re-execution)
        /// </summary>
        [HttpDelete("device/{deviceId}")]
        [HttpPost("reset/{deviceId}")]
        public async Task<IActionResult> DeleteDevicePayouts(int deviceId)
        {
            try
            {
                var payouts = await _context.Payouts.Where(p => p.DeviceId == deviceId).ToListAsync();
                if (!payouts.Any())
                {
                    return Ok(new { success = true, message = $"No payout records found for Device #{deviceId}." });
                }

                int count = payouts.Count;
                _context.Payouts.RemoveRange(payouts);

                // Reset device lifecycle status if needed
                var device = await _context.Device.FirstOrDefaultAsync(d => d.DeviceId == deviceId);
                if (device != null && device.LifecycleStatus == "Settled")
                {
                    device.LifecycleStatus = "Completed";
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    deletedCount = count,
                    message = $"Successfully deleted {count} payout record(s) for Device #{deviceId}."
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting payouts for device {DeviceId}", deviceId);
                return StatusCode(500, new { message = "Error deleting payout records.", details = ex.Message });
            }
        }
    }
}
