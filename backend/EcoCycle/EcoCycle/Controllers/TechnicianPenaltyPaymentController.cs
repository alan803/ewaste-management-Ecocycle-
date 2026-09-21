using EcoCycle.API.Data;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Razorpay.Api;
using System.Security.Cryptography;
using System.Text;

namespace EcoCycle.API.Controllers
{
    public class VerifyPenaltyPaymentRequest
    {
        public int PaymentId { get; set; }
        public string RazorpayPaymentId { get; set; } = string.Empty;
        public string RazorpayOrderId { get; set; } = string.Empty;
        public string RazorpaySignature { get; set; } = string.Empty;
    }

    [Route("api/[controller]")]
    [ApiController]
    public class TechnicianPenaltyPaymentController : ControllerBase
    {
        private readonly ApplicationDbContext db;
        private readonly RazorpaySettings razorpaySettings;

        public TechnicianPenaltyPaymentController(
            ApplicationDbContext db,
            IOptions<RazorpaySettings> razorpaySettings)
        {
            this.db = db;
            this.razorpaySettings = razorpaySettings.Value;
        }

        [HttpGet("my-penalties")]
        [Authorize]
        public async Task<IActionResult> GetMyPenalties()
        {
            var loginIdClaim = User.FindFirst("LoginId")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(loginIdClaim, out int loginId))
                return Unauthorized("Invalid token.");

            var tech = await db.Technician.FirstOrDefaultAsync(t => t.LoginId == loginId);
            if (tech == null)
                return NotFound("Technician profile not found.");

            var penalties = await db.technicianPenalties
                .Include(p => p.Device)
                    .ThenInclude(d => d!.Category)
                .Where(p => p.TechnicianId == tech.TechnicianId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    technicianPenaltyId = p.TechnicianPenaltyId,
                    technicianId = p.TechnicianId,
                    deviceId = p.DeviceId,
                    deviceTitle = p.Device != null ? $"{p.Device.Brand} {p.Device.Model}" : "Device",
                    categoryName = p.Device != null && p.Device.Category != null ? p.Device.Category.CategoryName : "E-Waste",
                    penaltyAmount = p.PenaltyAmount,
                    reason = p.Reason,
                    status = p.Status,
                    createdAt = p.CreatedAt,
                    resolvedAt = p.ResolvedAt
                })
                .ToListAsync();

            return Ok(penalties);
        }

        [HttpPost("create-order/{penaltyId}")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateOrder(int penaltyId)
        {
            var penalty = await db.technicianPenalties
                .Include(p => p.Technician)
                .FirstOrDefaultAsync(p =>
                    p.TechnicianPenaltyId == penaltyId);

            if (penalty == null)
                return NotFound("Penalty not found.");

            if (penalty.Status == "Paid")
                return BadRequest("Penalty is already paid.");

            // Check whether this penalty is already paid in Payments table
            var existingPayment = await db.Payments
                .FirstOrDefaultAsync(p =>
                    p.PaymentType == "TechnicianPenalty" &&
                    p.ReferenceId == penaltyId &&
                    p.PaymentStatus == "Paid");

            if (existingPayment != null)
                return BadRequest("This penalty has already been paid.");

            // Create Razorpay client
            RazorpayClient client = new RazorpayClient(
                razorpaySettings.KeyId,
                razorpaySettings.KeySecret);

            // Razorpay expects amount in paise
            int amountInPaise = (int)(penalty.PenaltyAmount * 100);

            Dictionary<string, object> options = new Dictionary<string, object>
            {
                { "amount", amountInPaise },
                { "currency", "INR" },
                { "receipt", $"PENALTY_{penaltyId}" }
            };

            Order order = client.Order.Create(options);
            string orderId = order["id"].ToString();

            // Create central Payment record
            var payment = new EcoCycle.API.Models.Payment
            {
                PaymentType = "TechnicianPenalty",
                ReferenceId = penaltyId,
                PayerType = "Technician",
                PayerLoginId = penalty.Technician?.LoginId,
                ReceiverType = "EcoCycle",
                ReceiverLoginId = null,
                Amount = penalty.PenaltyAmount,
                Currency = "INR",
                TransactionType = "Incoming",
                PaymentStatus = "Processing",
                RazorpayOrderId = orderId,
                CreatedAt = DateTime.Now
            };

            db.Payments.Add(payment);
            await db.SaveChangesAsync();

            return Ok(new
            {
                paymentId = payment.PaymentId,
                penaltyId = penalty.TechnicianPenaltyId,
                orderId = orderId,
                amount = amountInPaise,
                currency = "INR",
                keyId = razorpaySettings.KeyId,
                description = "EcoCycle Technician Penalty"
            });
        }

        [HttpPost("verify")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyPayment([FromBody] VerifyPenaltyPaymentRequest request)
        {
            if (request == null || request.PaymentId <= 0)
                return BadRequest("Invalid payment verification payload.");

            var payment = await db.Payments
                .FirstOrDefaultAsync(p => p.PaymentId == request.PaymentId);

            if (payment == null)
                return NotFound("Payment record not found.");

            if (payment.PaymentStatus == "Paid")
                return Ok(new { message = "Payment is already marked as paid.", paymentId = payment.PaymentId, status = "Paid" });

            // Use orderId stored on server rather than trusting browser
            string serverOrderId = payment.RazorpayOrderId ?? request.RazorpayOrderId;
            if (string.IsNullOrEmpty(serverOrderId))
            {
                return BadRequest("Server order ID missing for payment verification.");
            }

            // Server-side HMAC SHA256 signature verification
            string payload = $"{serverOrderId}|{request.RazorpayPaymentId}";
            string generatedSignature = ComputeHmacSha256(payload, razorpaySettings.KeySecret);

            if (!string.Equals(generatedSignature, request.RazorpaySignature, StringComparison.OrdinalIgnoreCase))
            {
                payment.PaymentStatus = "Failed";
                payment.FailedAt = DateTime.Now;
                payment.FailureReason = "Razorpay signature verification failed.";
                payment.UpdatedAt = DateTime.Now;
                await db.SaveChangesAsync();

                return BadRequest(new { message = "Payment verification failed: Invalid signature." });
            }

            // Update central Payment record
            payment.PaymentStatus = "Paid";
            payment.RazorpayPaymentId = request.RazorpayPaymentId;
            payment.RazorpaySignature = request.RazorpaySignature;
            payment.PaidAt = DateTime.Now;
            payment.UpdatedAt = DateTime.Now;

            // Update TechnicianPenalty record status
            if (payment.ReferenceId.HasValue)
            {
                var penalty = await db.technicianPenalties
                    .FirstOrDefaultAsync(p => p.TechnicianPenaltyId == payment.ReferenceId.Value);

                if (penalty != null)
                {
                    penalty.Status = "Paid";
                    penalty.ResolvedAt = DateTime.Now;
                }
            }

            await db.SaveChangesAsync();

            return Ok(new
            {
                message = "Payment verified and penalty updated to Paid successfully.",
                paymentId = payment.PaymentId,
                penaltyId = payment.ReferenceId,
                status = "Paid"
            });
        }

        private static string ComputeHmacSha256(string data, string secret)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            byte[] hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
        }
    }
}