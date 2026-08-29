using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace EcoCycle.API.Services
{
    public class EmailService
    {
        private readonly IConfiguration configuration;

        public EmailService(IConfiguration configuration)
        {
            this.configuration = configuration;
        }

        // Send OTP email
        public async Task SendOtpEmail(
            string recipientEmail,
            string otp)
        {
            var email = new MimeMessage();

            email.From.Add(
                new MailboxAddress(
                    "EcoCycle",
                    configuration["EmailSettings:Email"]
                )
            );

            email.To.Add(
                MailboxAddress.Parse(recipientEmail)
            );

            email.Subject = "EcoCycle - Password Reset OTP";

            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif;'>

                    <h2>EcoCycle Password Reset</h2>

                    <p>Hello,</p>

                    <p>
                        We received a request to reset your EcoCycle password.
                    </p>

                    <p>
                        Your One-Time Password (OTP) is:
                    </p>

                    <div style='
                        font-size:32px;
                        font-weight:bold;
                        letter-spacing:8px;
                        margin:20px 0;
                        color:#198754;'>
                        {otp}
                    </div>

                    <p>
                        Please enter this OTP in the EcoCycle website
                        to continue resetting your password.
                    </p>

                    <p>
                        <strong>This OTP will expire after 5 minutes.</strong>
                    </p>

                    <p>
                        If you did not request a password reset,
                        you can safely ignore this email.
                    </p>

                    <p>
                        Regards,<br/>
                        EcoCycle Team
                    </p>

                </body>
                </html>
            ";

            email.Body = new BodyBuilder
            {
                HtmlBody = body
            }.ToMessageBody();

            using var smtp = new SmtpClient();

            await smtp.ConnectAsync(
                "smtp.gmail.com",
                587,
                SecureSocketOptions.StartTls
            );

            await smtp.AuthenticateAsync(
                configuration["EmailSettings:Email"],
                configuration["EmailSettings:AppPassword"]
            );

            await smtp.SendAsync(email);

            await smtp.DisconnectAsync(true);
        }

        // Send Handover OTP email
        public async Task SendHandoverOtpEmail(
            string recipientEmail,
            string otp,
            string deviceName)
        {
            var email = new MimeMessage();

            email.From.Add(
                new MailboxAddress(
                    "EcoCycle",
                    configuration["EmailSettings:Email"]
                )
            );

            email.To.Add(
                MailboxAddress.Parse(recipientEmail)
            );

            email.Subject = $"EcoCycle - Pickup Handover Verification OTP for {deviceName}";

            var body = $@"
                <html>
                <body style='font-family: Arial, sans-serif;'>

                    <h2>EcoCycle E-Waste Pickup Verification</h2>

                    <p>Hello,</p>

                    <p>
                        Your collection agent has arrived for the pickup of <strong>{deviceName}</strong>.
                    </p>

                    <p>
                        Your One-Time Password (OTP) for device handover verification is:
                    </p>

                    <div style='
                        font-size:32px;
                        font-weight:bold;
                        letter-spacing:8px;
                        margin:20px 0;
                        color:#10b981;'>
                        {otp}
                    </div>

                    <p>
                        <strong>This OTP is valid for 30 seconds only.</strong>
                    </p>

                    <p>
                        Please share this code with the collection agent on-site to complete the handover.
                    </p>

                    <p>
                        Regards,<br/>
                        EcoCycle Operations Team
                    </p>

                </body>
                </html>
            ";

            email.Body = new BodyBuilder
            {
                HtmlBody = body
            }.ToMessageBody();

            using var smtp = new SmtpClient();

            await smtp.ConnectAsync(
                "smtp.gmail.com",
                587,
                SecureSocketOptions.StartTls
            );

            await smtp.AuthenticateAsync(
                configuration["EmailSettings:Email"],
                configuration["EmailSettings:AppPassword"]
            );

            await smtp.SendAsync(email);

            await smtp.DisconnectAsync(true);
        }

        // Send general HTML email
        public async Task SendEmailAsync(
            string recipientEmail,
            string subject,
            string htmlBody)
        {
            if (string.IsNullOrWhiteSpace(recipientEmail)) return;

            try
            {
                var email = new MimeMessage();
                email.From.Add(
                    new MailboxAddress(
                        "EcoCycle",
                        configuration["EmailSettings:Email"]
                    )
                );

                email.To.Add(MailboxAddress.Parse(recipientEmail));
                email.Subject = subject;

                email.Body = new BodyBuilder
                {
                    HtmlBody = htmlBody
                }.ToMessageBody();

                using var smtp = new SmtpClient();
                await smtp.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
                await smtp.AuthenticateAsync(
                    configuration["EmailSettings:Email"],
                    configuration["EmailSettings:AppPassword"]
                );
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService Exception]: {ex.Message}");
            }
        }
    }
}