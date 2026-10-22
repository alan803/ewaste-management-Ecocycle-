using EcoCycle.API.Data;
using EcoCycle.API.Data.DTOs;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Mail;

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
                    bool canDisburse = true;
                    string reason = "";

                    if (payout.ReceiverType == "User" || payout.ReceiverType == "Citizen")
                    {
                        var u = usersList.FirstOrDefault(x => x.LoginId == payout.ReceiverLoginId);
                        if (u == null || string.IsNullOrWhiteSpace(u.AccountNumber) || string.IsNullOrWhiteSpace(u.IFSCCode))
                        {
                            reason = "Direct Escrow Balance / Linked UPI Payout.";
                        }
                    }

                    if (canDisburse && payout.Amount > 0)
                    {
                        payout.PayoutStatus = "Paid";
                        payout.PaidAt = DateTime.Now;
                        payout.UpdatedAt = DateTime.Now;
                        payout.FailureReason = null;
                        payout.RazorpayPayoutId = $"POUT_RAZOR_{payout.PayoutId}_{DateTime.UtcNow.Ticks}";
                        payout.PayoutBatchId = batchId;
                        processedCount++;
                        totalPaidNow += payout.Amount;

                        string devName = $"{device.Brand} {device.Model}".Trim();
                        if (string.IsNullOrWhiteSpace(devName)) devName = $"Device #{deviceId}";

                        // 1. Send push / DB Notification to recipient
                        string notifTitle = payout.ReceiverType == "User" || payout.ReceiverType == "Citizen"
                            ? $"Payout Credited: ₹{payout.Amount:N2}"
                            : $"{payout.PayoutType ?? "Payment"} Disbursed: ₹{payout.Amount:N2}";

                        string notifMsg = payout.ReceiverType == "User" || payout.ReceiverType == "Citizen"
                            ? $"Congratulations! Your fair valuation payout of ₹{payout.Amount:N2} for {devName} (DEV #{deviceId}) has been successfully settled and transferred."
                            : $"EcoCycle Payout of ₹{payout.Amount:N2} for {devName} (DEV #{deviceId}) has been successfully settled and transferred.";

                        _context.Notification.Add(new Notification
                        {
                            LoginId = payout.ReceiverLoginId,
                            Title = notifTitle,
                            Message = notifMsg,
                            Isread = false,
                            Status = true,
                            CreatedAt = DateTime.Now
                        });

                        // 2. Dispatch official HTML payment advice email
                        try
                        {
                            string recipientEmail = "";
                            string recipientName = "Valued Stakeholder";
                            string roleLabel = payout.ReceiverType;

                            if (payout.ReceiverType == "User" || payout.ReceiverType == "Citizen")
                            {
                                var userObj = usersList.FirstOrDefault(x => x.LoginId == payout.ReceiverLoginId);
                                if (userObj != null)
                                {
                                    recipientName = $"{userObj.FirstName} {userObj.LastName}".Trim();
                                    var loginObj = await _context.Login.FirstOrDefaultAsync(l => l.LoginId == userObj.LoginId);
                                    recipientEmail = loginObj?.Email ?? "";
                                    roleLabel = "Citizen User (Device Owner)";
                                }
                            }
                            else if (payout.ReceiverType == "CollectionAgent")
                            {
                                var agentObj = await _context.CollectionAgents.Include(x => x.Login).FirstOrDefaultAsync(x => x.LoginId == payout.ReceiverLoginId);
                                if (agentObj != null)
                                {
                                    recipientName = $"{agentObj.FirstName} {agentObj.LastName}".Trim();
                                    recipientEmail = agentObj.Login?.Email ?? "";
                                    roleLabel = "Collection Agent (Logistics Partner)";
                                }
                            }
                            else if (payout.ReceiverType == "Technician")
                            {
                                var techObj = await _context.Technician.Include(x => x.Login).FirstOrDefaultAsync(x => x.LoginId == payout.ReceiverLoginId);
                                if (techObj != null)
                                {
                                    recipientName = $"{techObj.FirstName} {techObj.LastName}".Trim();
                                    recipientEmail = techObj.Login?.Email ?? "";
                                    roleLabel = "Inspection Technician";
                                }
                            }
                            else if (payout.ReceiverType == "RefurbishmentCenter" || payout.ReceiverType == "RecyclingCenter" || payout.ReceiverType == "Center")
                            {
                                var rf = await _context.RefurbishmentCenter.FirstOrDefaultAsync(x => x.LoginId == payout.ReceiverLoginId);
                                if (rf != null)
                                {
                                    recipientName = rf.CenterName;
                                    roleLabel = "Refurbishment Facility";
                                }
                                else
                                {
                                    var rc = await _context.RecyclingCenter.FirstOrDefaultAsync(x => x.LoginId == payout.ReceiverLoginId);
                                    if (rc != null)
                                    {
                                        recipientName = rc.CenterName;
                                        roleLabel = "Recycling Facility";
                                    }
                                }
                            }

                            // Direct fallback to master Login record if email is still blank
                            if (string.IsNullOrWhiteSpace(recipientEmail) && payout.ReceiverLoginId > 0)
                            {
                                var directLogin = await _context.Login.FirstOrDefaultAsync(l => l.LoginId == payout.ReceiverLoginId);
                                if (directLogin != null && !string.IsNullOrWhiteSpace(directLogin.Email))
                                {
                                    recipientEmail = directLogin.Email;
                                    if (string.IsNullOrWhiteSpace(recipientName) || recipientName == "Valued Stakeholder")
                                    {
                                        recipientName = directLogin.Email.Split('@')[0];
                                    }
                                }
                            }

                            if (!string.IsNullOrWhiteSpace(recipientEmail))
                            {
                                string emailSub = $"EcoCycle Payment Disbursed: ₹{payout.Amount:N2} for Device #{deviceId}";
                                string htmlBody = GeneratePayoutEmailHtml(
                                    string.IsNullOrWhiteSpace(recipientName) ? "EcoCycle Partner" : recipientName,
                                    roleLabel,
                                    payout.Amount,
                                    deviceId,
                                    device.Brand ?? "Device",
                                    device.Model ?? "Hardware Asset",
                                    payout.RazorpayPayoutId ?? $"POUT_RAZOR_{payout.PayoutId}",
                                    payout.PayoutType ?? "Settlement Payout"
                                );
                                await SendEmailAsync(recipientEmail, emailSub, htmlBody);
                            }
                        }
                        catch (Exception exEmail)
                        {
                            _logger.LogWarning(exEmail, "Failed triggering payout email to receiver {ReceiverLoginId}", payout.ReceiverLoginId);
                        }
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

        /// <summary>
        /// Explicitly dispatch in-app notifications and disbursement advice emails to all stakeholders who received a payout for a device
        /// </summary>
        [HttpPost("send-payout-notifications/{deviceId}")]
        public async Task<IActionResult> SendPayoutNotifications(int deviceId)
        {
            try
            {
                var device = await _context.Device
                    .Include(d => d.User)
                    .ThenInclude(u => u.Login)
                    .FirstOrDefaultAsync(d => d.DeviceId == deviceId);

                if (device == null)
                {
                    return NotFound(new { message = $"Device #{deviceId} not found." });
                }

                var payouts = await _context.Payouts
                    .Where(p => p.DeviceId == deviceId && p.Amount > 0)
                    .ToListAsync();

                if (!payouts.Any())
                {
                    return BadRequest(new { message = $"No payouts found for Device #{deviceId}." });
                }

                var notifiedList = new List<object>();

                var users = await _context.Users.Include(u => u.Login).ToListAsync();
                var agents = await _context.CollectionAgents.Include(a => a.Login).ToListAsync();
                var techs = await _context.Technician.Include(t => t.Login).ToListAsync();

                foreach (var p in payouts)
                {
                    string recipientName = "User";
                    string recipientEmail = "";
                    string role = p.ReceiverType;

                    if (p.ReceiverType == "User" || p.ReceiverType == "Citizen")
                    {
                        var u = users.FirstOrDefault(x => x.LoginId == p.ReceiverLoginId);
                        if (u != null)
                        {
                            recipientName = $"{u.FirstName} {u.LastName}".Trim();
                            recipientEmail = u.Login?.Email ?? "";
                            role = "Citizen User (Device Owner)";
                        }
                    }
                    else if (p.ReceiverType == "CollectionAgent")
                    {
                        var a = agents.FirstOrDefault(x => x.LoginId == p.ReceiverLoginId);
                        if (a != null)
                        {
                            recipientName = $"{a.FirstName} {a.LastName}".Trim();
                            recipientEmail = a.Login?.Email ?? "";
                            role = "Collection Agent (Logistics Partner)";
                        }
                    }
                    else if (p.ReceiverType == "Technician")
                    {
                        var t = techs.FirstOrDefault(x => x.LoginId == p.ReceiverLoginId);
                        if (t != null)
                        {
                            recipientName = $"{t.FirstName} {t.LastName}".Trim();
                            recipientEmail = t.Login?.Email ?? "";
                            role = "Inspection Technician";
                        }
                    }
                    else if (p.ReceiverType == "RefurbishmentCenter" || p.ReceiverType == "RecyclingCenter" || p.ReceiverType == "Center")
                    {
                        var rf = await _context.RefurbishmentCenter.FirstOrDefaultAsync(x => x.LoginId == p.ReceiverLoginId);
                        if (rf != null)
                        {
                            recipientName = rf.CenterName;
                            role = "Refurbishment Facility";
                        }
                        else
                        {
                            var rc = await _context.RecyclingCenter.FirstOrDefaultAsync(x => x.LoginId == p.ReceiverLoginId);
                            if (rc != null)
                            {
                                recipientName = rc.CenterName;
                                role = "Recycling Facility";
                            }
                        }
                    }

                    // Direct fallback to master Login record if email is still blank
                    if (string.IsNullOrWhiteSpace(recipientEmail) && p.ReceiverLoginId > 0)
                    {
                        var directLogin = await _context.Login.FirstOrDefaultAsync(l => l.LoginId == p.ReceiverLoginId);
                        if (directLogin != null && !string.IsNullOrWhiteSpace(directLogin.Email))
                        {
                            recipientEmail = directLogin.Email;
                            if (string.IsNullOrWhiteSpace(recipientName) || recipientName == "User")
                            {
                                recipientName = directLogin.Email.Split('@')[0];
                            }
                        }
                    }

                    // 1. Create In-App Notification if not already present
                    bool hasNotif = await _context.Notification.AnyAsync(n =>
                        n.LoginId == p.ReceiverLoginId &&
                        n.Message != null &&
                        n.Message.Contains($"#{deviceId}") &&
                        n.Title.Contains("Payout"));

                    if (!hasNotif && p.ReceiverLoginId > 0)
                    {
                        _context.Notification.Add(new Notification
                        {
                            LoginId = p.ReceiverLoginId,
                            Title = $"{p.PayoutType ?? "Payment"} Disbursed: ₹{p.Amount:N2}",
                            Message = $"EcoCycle Payout of ₹{p.Amount:N2} for Device #{deviceId} ({device.Brand} {device.Model}) has been successfully settled and transferred.",
                            Isread = false,
                            Status = true,
                            CreatedAt = DateTime.Now
                        });
                    }

                    // 2. Send Email
                    string emailDeliveryStatus = "No Email Configured";
                    if (!string.IsNullOrWhiteSpace(recipientEmail))
                    {
                        string emailSub = $"EcoCycle Payment Disbursed: ₹{p.Amount:N2} for Device #{deviceId}";
                        string htmlBody = GeneratePayoutEmailHtml(
                            recipientName,
                            role,
                            p.Amount,
                            deviceId,
                            device.Brand ?? "Device",
                            device.Model ?? "Hardware Asset",
                            p.RazorpayPayoutId ?? $"POUT_RAZOR_{p.PayoutId}",
                            p.PayoutType ?? "Settlement Payout"
                        );
                        bool sent = await SendEmailAsync(recipientEmail, emailSub, htmlBody);
                        emailDeliveryStatus = sent ? "Dispatched" : "SMTP Delivery Error";
                    }

                    notifiedList.Add(new
                    {
                        payoutId = p.PayoutId,
                        role,
                        recipientName,
                        recipientEmail,
                        amount = p.Amount,
                        status = emailDeliveryStatus
                    });
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Dispatched payout notifications and emails to {notifiedList.Count} recipient(s).",
                    recipients = notifiedList
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending payout notifications for device {DeviceId}", deviceId);
                return StatusCode(500, new { message = "Error sending notifications.", details = ex.Message });
            }
        }

        private static async Task<bool> SendEmailAsync(string recipientEmail, string subject, string body)
        {
            if (string.IsNullOrWhiteSpace(recipientEmail)) return false;
            try
            {
                using (MailMessage mail = new MailMessage())
                {
                    mail.From = new MailAddress("drogbqdidier7@gmail.com", "EcoCycle Finance & Settlements");
                    mail.To.Add(recipientEmail);
                    mail.Subject = subject;
                    mail.Body = body;
                    mail.IsBodyHtml = true;

                    using (SmtpClient smtp = new SmtpClient("smtp.gmail.com", 587))
                    {
                        smtp.UseDefaultCredentials = false;
                        smtp.EnableSsl = true;
                        smtp.Credentials = new NetworkCredential("drogbqdidier7@gmail.com", "gxgy cclr rght awid");
                        smtp.DeliveryMethod = SmtpDeliveryMethod.Network;
                        await smtp.SendMailAsync(mail);
                    }
                }
                Console.WriteLine($"[Payout Email Notice] Successfully delivered email to {recipientEmail}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Payout Email Notice] Could not deliver email to {recipientEmail}: {ex.Message}");
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
