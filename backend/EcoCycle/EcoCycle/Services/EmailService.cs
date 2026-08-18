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
    }
}