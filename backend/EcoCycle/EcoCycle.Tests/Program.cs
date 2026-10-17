using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using EcoCycle.API.Data;
using EcoCycle.API.Models;
using EcoCycle.API.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using PickupController = EcoCycle.API.Controllers.Pickup;

namespace EcoCycle.Tests
{
    public class TestHostEnvironment : IWebHostEnvironment
    {
        public string WebRootPath { get; set; } = Directory.GetCurrentDirectory();
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string ApplicationName { get; set; } = "EcoCycle.Tests";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
        public string ContentRootPath { get; set; } = Directory.GetCurrentDirectory();
        public string EnvironmentName { get; set; } = "Development";
    }

    class Program
    {
        static async Task<int> Main(string[] args)
        {
            Console.WriteLine("=================================================================");
            Console.WriteLine("    EcoCycle AI: Comprehensive OTP Recipient & Isolation Test Suite");
            Console.WriteLine("=================================================================\n");

            var connString = "Server=(localdb)\\MSSQLLocalDB;Database=EcoCycleDB;Trusted_Connection=True;TrustServerCertificate=True;";
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlServer(connString)
                .Options;

            using var db = new ApplicationDbContext(options);

            var configDict = new Dictionary<string, string?>
            {
                { "ConnectionStrings:DefaultConnection", connString },
                { "EmailSettings:Email", "test@ecocycle.com" },
                { "EmailSettings:AppPassword", "dummy-pass" }
            };
            var config = new ConfigurationBuilder().AddInMemoryCollection(configDict).Build();
            var emailService = new EmailService(config);
            var env = new TestHostEnvironment();

            int passedCount = 0;
            int totalTests = 6;

            try
            {
                // Ensure Roles exist
                if (!await db.Roles.AnyAsync(r => r.RoleId == 1))
                {
                    db.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Roles ON; INSERT INTO Roles (RoleId, RoleName) VALUES (1, 'Citizen'); SET IDENTITY_INSERT Roles OFF;");
                }
                if (!await db.Roles.AnyAsync(r => r.RoleId == 2))
                {
                    db.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Roles ON; INSERT INTO Roles (RoleId, RoleName) VALUES (2, 'CollectionAgent'); SET IDENTITY_INSERT Roles OFF;");
                }
                if (!await db.Roles.AnyAsync(r => r.RoleId == 3))
                {
                    db.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Roles ON; INSERT INTO Roles (RoleId, RoleName) VALUES (3, 'Technician'); SET IDENTITY_INSERT Roles OFF;");
                }
                if (!await db.Roles.AnyAsync(r => r.RoleId == 5))
                {
                    db.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Roles ON; INSERT INTO Roles (RoleId, RoleName) VALUES (5, 'RecyclingCenter'); SET IDENTITY_INSERT Roles OFF;");
                }
                if (!await db.Roles.AnyAsync(r => r.RoleId == 6))
                {
                    db.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Roles ON; INSERT INTO Roles (RoleId, RoleName) VALUES (6, 'RefurbishmentCenter'); SET IDENTITY_INSERT Roles OFF;");
                }

                // -------------------------------------------------------------
                // TEST SETUP: Seed or confirm Alan (UserId=1, LoginId=2) and Sus Mathew (UserId=2, LoginId=7)
                // -------------------------------------------------------------
                // Login 2
                var login2 = await db.Login.FirstOrDefaultAsync(l => l.LoginId == 2);
                if (login2 == null)
                {
                    db.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Login ON; INSERT INTO Login (LoginId, Email, PasswordHash, RoleId) VALUES (2, 'alan.varghese@example.com', 'hashed123', 1); SET IDENTITY_INSERT Login OFF;");
                }
                // Login 7
                var login7 = await db.Login.FirstOrDefaultAsync(l => l.LoginId == 7);
                if (login7 == null)
                {
                    db.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Login ON; INSERT INTO Login (LoginId, Email, PasswordHash, RoleId) VALUES (7, 'sus.mathew@example.com', 'hashed123', 1); SET IDENTITY_INSERT Login OFF;");
                }

                // User 1 (Alan Varghese, LoginId=2)
                var user1 = await db.Users.FirstOrDefaultAsync(u => u.UserId == 1);
                if (user1 == null)
                {
                    db.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Users ON; INSERT INTO Users (UserId, LoginId, FirstName, LastName, PhoneNumber, Address, State, District, City, Pincode, Gender, DateOfBirth, AccountHolder, BankName, AccountNumber, IFSCCode, Status, CreatedAt) VALUES (1, 2, 'Alan', 'Varghese', '9876543210', '123 Alan St', 'Kerala', 'Ernakulam', 'Kochi', '682001', 'Male', '1995-05-15', 'Alan Varghese', 'State Bank of India', '12345678901', 'SBIN0001234', 'Active', GETDATE()); SET IDENTITY_INSERT Users OFF;");
                }

                // User 2 (Sus Mathew, LoginId=7)
                var user2 = await db.Users.FirstOrDefaultAsync(u => u.UserId == 2);
                if (user2 == null)
                {
                    db.Database.ExecuteSqlRaw("SET IDENTITY_INSERT Users ON; INSERT INTO Users (UserId, LoginId, FirstName, LastName, PhoneNumber, Address, State, District, City, Pincode, Gender, DateOfBirth, AccountHolder, BankName, AccountNumber, IFSCCode, Status, CreatedAt) VALUES (2, 7, 'Sus', 'Mathew', '9876543211', '456 Sus Rd', 'Kerala', 'Kottayam', 'Pala', '686575', 'Female', '1998-08-20', 'Sus Mathew', 'Federal Bank', '98765432109', 'FDRL0005678', 'Active', GETDATE()); SET IDENTITY_INSERT Users OFF;");
                }

                // Category 4 for Laptops/Devices if not exists
                if (!await db.DeviceCategory.AnyAsync(c => c.CategoryId == 4))
                {
                    db.Database.ExecuteSqlRaw("SET IDENTITY_INSERT DeviceCategory ON; INSERT INTO DeviceCategory (CategoryId, CategoryName, Description, BasePrice) VALUES (4, 'Laptop', 'Laptops & Notebooks', 5000); SET IDENTITY_INSERT DeviceCategory OFF;");
                }

                // Device for Sus Mathew (UserId = 2, ASUS VivoBook 15)
                var susDevice = await db.Device.FirstOrDefaultAsync(d => d.UserId == 2 && d.Brand == "ASUS" && d.Model == "VivoBook 15");
                if (susDevice == null)
                {
                    susDevice = new Device
                    {
                        UserId = 2,
                        CategoryId = 4,
                        Brand = "ASUS",
                        Model = "VivoBook 15",
                        ModelNumber = "X1502",
                        SerialNumber = "SUSASUS1502",
                        Quantity = 1,
                        Weight = 2,
                        Condition = "Working",
                        Working = "Yes",
                        ProcessingPreference = "Recycle",
                        Address = "456 Sus Rd, Pala",
                        PickupDate = DateTime.Today,
                        TimeSlot = "10:00 - 12:00",
                        Ownership = "First Owner",
                        OwnershipConfirmed = true,
                        TermsAccepted = true,
                        Status = "Accepted",
                        LifecycleStatus = "EnRoute",
                        DeviceQrToken = "QR_SUS_VIVOBOOK_15"
                    };
                    db.Device.Add(susDevice);
                    await db.SaveChangesAsync();
                }

                // Device for Alan Varghese (UserId = 1, HP Pavilion)
                var alanDevice = await db.Device.FirstOrDefaultAsync(d => d.UserId == 1 && d.Brand == "HP" && d.Model == "Pavilion");
                if (alanDevice == null)
                {
                    alanDevice = new Device
                    {
                        UserId = 1,
                        CategoryId = 4,
                        Brand = "HP",
                        Model = "Pavilion",
                        ModelNumber = "HP15-EG",
                        SerialNumber = "ALANHP15",
                        Quantity = 1,
                        Weight = 2,
                        Condition = "Working",
                        Working = "Yes",
                        ProcessingPreference = "Recycle",
                        Address = "123 Alan St, Kochi",
                        PickupDate = DateTime.Today,
                        TimeSlot = "10:00 - 12:00",
                        Ownership = "First Owner",
                        OwnershipConfirmed = true,
                        TermsAccepted = true,
                        Status = "Accepted",
                        LifecycleStatus = "EnRoute",
                        DeviceQrToken = "QR_ALAN_HP_PAVILION"
                    };
                    db.Device.Add(alanDevice);
                    await db.SaveChangesAsync();
                }

                // Collection Agent
                var agent = await db.CollectionAgents.Include(a => a.Login).FirstOrDefaultAsync();
                int agentLoginId = agent?.LoginId ?? 25;

                // Assignment for Sus Mathew's ASUS VivoBook 15
                var susAssignment = await db.CollectionAssignments
                    .FirstOrDefaultAsync(ca => ca.DeviceId == susDevice.DeviceId && ca.AssignmentType == "CustomerToTechnician");
                if (susAssignment == null)
                {
                    susAssignment = new CollectionAssignment
                    {
                        DeviceId = susDevice.DeviceId,
                        CollectionAgentId = agent?.CollectionAgentId ?? 7,
                        AssignmentType = "CustomerToTechnician",
                        SourceType = "Customer",
                        DestinationType = "Technician Center",
                        Status = "PickupStarted",
                        AssignedAt = DateTime.Now,
                        CreatedAt = DateTime.Now
                    };
                    db.CollectionAssignments.Add(susAssignment);
                    await db.SaveChangesAsync();
                }

                // Assignment for Alan Varghese's HP Pavilion
                var alanAssignment = await db.CollectionAssignments
                    .FirstOrDefaultAsync(ca => ca.DeviceId == alanDevice.DeviceId && ca.AssignmentType == "CustomerToTechnician");
                if (alanAssignment == null)
                {
                    alanAssignment = new CollectionAssignment
                    {
                        DeviceId = alanDevice.DeviceId,
                        CollectionAgentId = agent?.CollectionAgentId ?? 7,
                        AssignmentType = "CustomerToTechnician",
                        SourceType = "Customer",
                        DestinationType = "Technician Center",
                        Status = "PickupStarted",
                        AssignedAt = DateTime.Now,
                        CreatedAt = DateTime.Now
                    };
                    db.CollectionAssignments.Add(alanAssignment);
                    await db.SaveChangesAsync();
                }

                // Helper to build Controller with mock user
                PickupController CreateController(int callerLoginId, string role = "CollectionAgent")
                {
                    var ctrl = new PickupController(db, emailService, env);
                    var claims = new List<Claim>
                    {
                        new Claim(ClaimTypes.NameIdentifier, callerLoginId.ToString()),
                        new Claim("sub", callerLoginId.ToString()),
                        new Claim(ClaimTypes.Role, role)
                    };
                    var identity = new ClaimsIdentity(claims, "TestAuth");
                    var principal = new ClaimsPrincipal(identity);
                    ctrl.ControllerContext = new ControllerContext
                    {
                        HttpContext = new DefaultHttpContext { User = principal }
                    };
                    return ctrl;
                }

                var controller = CreateController(agentLoginId);

                // =============================================================
                // TEST 1 — Sus Mathew
                // =============================================================
                Console.WriteLine("-----------------------------------------------------------------");
                Console.WriteLine("TEST 1: Sus Mathew OTP Recipient Resolution");
                Console.WriteLine("-----------------------------------------------------------------");
                Console.WriteLine($"Resolving ASUS VivoBook 15 (DeviceId: {susDevice.DeviceId})...");
                Console.WriteLine($"Registered Device Owner UserId: {susDevice.UserId}");
                var resolvedUser = await db.Users.FirstOrDefaultAsync(u => u.UserId == susDevice.UserId);
                Console.WriteLine($"Resolved User Name: {resolvedUser?.FirstName} {resolvedUser?.LastName}, LoginId: {resolvedUser?.LoginId}");

                if (resolvedUser?.UserId == 2 && resolvedUser?.LoginId == 7)
                {
                    Console.WriteLine("  [PASS] Verified UserId = 2 maps strictly to LoginId = 7.");
                }
                else
                {
                    throw new Exception($"Failed: Expected UserId 2 to map to LoginId 7, got LoginId {resolvedUser?.LoginId}");
                }

                // Request customer handover OTP
                int alanNotifCountBefore = await db.Notification.CountAsync(n => n.LoginId == 2);

                var sendOtpResult = await controller.SendHandoverOtp(susAssignment.CollectionAssignmentId!.Value);
                if (sendOtpResult is not OkObjectResult okResult1)
                {
                    throw new Exception($"Test 1 failed: SendHandoverOtp returned non-OK result: {sendOtpResult}");
                }

                dynamic resData1 = okResult1.Value!;
                int returnedLoginId1 = (int)resData1.GetType().GetProperty("recipientLoginId")!.GetValue(resData1);
                string returnedEmail1 = (string)resData1.GetType().GetProperty("recipientEmail")!.GetValue(resData1);
                string returnedRole1 = (string)resData1.GetType().GetProperty("recipientRole")!.GetValue(resData1);

                Console.WriteLine($"  Returned Recipient LoginId: {returnedLoginId1}");
                Console.WriteLine($"  Returned Recipient Email: {returnedEmail1}");
                Console.WriteLine($"  Returned Recipient Role: {returnedRole1}");

                if (returnedLoginId1 != 7)
                {
                    throw new Exception($"Test 1 failed: Recipient LoginId is {returnedLoginId1}, but expected 7 (Sus Mathew)!");
                }
                if (!returnedEmail1.Contains("sus.mathew@example.com"))
                {
                    throw new Exception($"Test 1 failed: Recipient Email is '{returnedEmail1}', expected 'sus.mathew@example.com'!");
                }

                // Verify Notification table
                var latestSusNotif = await db.Notification
                    .Where(n => n.LoginId == 7)
                    .OrderByDescending(n => n.NotificationId)
                    .FirstOrDefaultAsync();

                if (latestSusNotif == null || latestSusNotif.Title != "Handover Verification OTP" || !latestSusNotif.Message.Contains("ASUS"))
                {
                    throw new Exception("Test 1 failed: Notification record not found for LoginId = 7 or message mismatch!");
                }

                int alanNotifCountAfter = await db.Notification.CountAsync(n => n.LoginId == 2);
                if (alanNotifCountAfter != alanNotifCountBefore)
                {
                    throw new Exception("Test 1 failed: Alan Varghese (LoginId = 2) received a notification for Sus Mathew's device!");
                }

                Console.WriteLine($"  [PASS] Sus Mathew's OTP was correctly delivered to LoginId = 7 and {returnedEmail1}.");
                Console.WriteLine($"  [PASS] Alan Varghese (LoginId = 2) notification count remained unchanged ({alanNotifCountBefore}).");
                passedCount++;

                // =============================================================
                // TEST 2 — Alan Varghese
                // =============================================================
                Console.WriteLine("\n-----------------------------------------------------------------");
                Console.WriteLine("TEST 2: Alan Varghese OTP Recipient Resolution");
                Console.WriteLine("-----------------------------------------------------------------");
                var sendAlanResult = await controller.SendHandoverOtp(alanAssignment.CollectionAssignmentId!.Value);
                if (sendAlanResult is not OkObjectResult okResult2)
                {
                    throw new Exception($"Test 2 failed: SendHandoverOtp returned non-OK: {sendAlanResult}");
                }

                dynamic resData2 = okResult2.Value!;
                int returnedLoginId2 = (int)resData2.GetType().GetProperty("recipientLoginId")!.GetValue(resData2);
                string returnedEmail2 = (string)resData2.GetType().GetProperty("recipientEmail")!.GetValue(resData2);

                Console.WriteLine($"  Returned Recipient LoginId: {returnedLoginId2}");
                Console.WriteLine($"  Returned Recipient Email: {returnedEmail2}");

                if (returnedLoginId2 != 2)
                {
                    throw new Exception($"Test 2 failed: Recipient LoginId is {returnedLoginId2}, expected 2 (Alan Varghese)!");
                }

                var latestAlanNotif = await db.Notification
                    .Where(n => n.LoginId == 2)
                    .OrderByDescending(n => n.NotificationId)
                    .FirstOrDefaultAsync();

                if (latestAlanNotif == null || !latestAlanNotif.Message.Contains("HP Pavilion"))
                {
                    throw new Exception("Test 2 failed: Alan's notification for HP Pavilion was not found under LoginId = 2!");
                }

                Console.WriteLine("  [PASS] Alan's own device pickup OTP was correctly saved under LoginId = 2.");
                passedCount++;

                // =============================================================
                // TEST 3 — Technician Handover
                // =============================================================
                Console.WriteLine("\n-----------------------------------------------------------------");
                Console.WriteLine("TEST 3: Technician-Targeted Handover Workflow");
                Console.WriteLine("-----------------------------------------------------------------");
                var tech = await db.Technician.Include(t => t.Login).FirstOrDefaultAsync();
                int techLoginId = tech?.LoginId ?? 12;

                var inspReq = await db.InspectionRequest.FirstOrDefaultAsync(ir => ir.DeviceId == susDevice.DeviceId);
                if (inspReq == null)
                {
                    inspReq = new InspectionRequest
                    {
                        DeviceId = susDevice.DeviceId,
                        TechnicianId = tech?.TechnicianId ?? 1,
                        Status = "Accepted",
                        AssignedAt = DateTime.Now,
                        ResponseDeadline = DateTime.Now.AddDays(1),
                        CreatedAt = DateTime.Now
                    };
                    db.InspectionRequest.Add(inspReq);
                    await db.SaveChangesAsync();
                }

                var techOtpResult = await controller.SendHandoverOtp(susAssignment.CollectionAssignmentId!.Value, target: "technician");
                if (techOtpResult is not OkObjectResult okTechResult)
                {
                    throw new Exception($"Test 3 failed: Technician OTP returned non-OK: {techOtpResult}");
                }

                dynamic resTechData = okTechResult.Value!;
                int techReturnedLoginId = (int)resTechData.GetType().GetProperty("recipientLoginId")!.GetValue(resTechData);
                string techRole = (string)resTechData.GetType().GetProperty("recipientRole")!.GetValue(resTechData);

                Console.WriteLine($"  Returned Role: {techRole}");
                Console.WriteLine($"  Returned LoginId: {techReturnedLoginId} (Expected: {techLoginId})");

                if (techReturnedLoginId != techLoginId || techReturnedLoginId == 7 || techReturnedLoginId == 0)
                {
                    throw new Exception($"Test 3 failed: Technician OTP went to wrong login: {techReturnedLoginId}");
                }
                if (techRole != "Technician")
                {
                    throw new Exception($"Test 3 failed: Expected role 'Technician', got '{techRole}'");
                }

                var techNotif = await db.Notification
                    .Where(n => n.LoginId == techLoginId && n.Title == "Technician Handover Verification OTP")
                    .OrderByDescending(n => n.NotificationId)
                    .FirstOrDefaultAsync();

                if (techNotif == null)
                {
                    throw new Exception("Test 3 failed: Technician notification was not inserted into Notification table!");
                }

                Console.WriteLine($"  [PASS] Technician handover OTP correctly targeted technician account (LoginId: {techLoginId}).");
                passedCount++;

                // =============================================================
                // TEST 4 — Center Handover Workflows
                // =============================================================
                Console.WriteLine("\n-----------------------------------------------------------------");
                Console.WriteLine("TEST 4: Center Handover Workflows (Recycling & Refurbishment)");
                Console.WriteLine("-----------------------------------------------------------------");
                var recycler = await db.RecyclingCenter.Include(r => r.Login).FirstOrDefaultAsync();
                if (recycler == null)
                {
                    var rcLogin = new Login { Email = "recycler@ecocycle.com", PasswordHash = "123", RoleId = 5 };
                    db.Login.Add(rcLogin);
                    await db.SaveChangesAsync();
                    recycler = new RecyclingCenter
                    {
                        LoginId = rcLogin.LoginId,
                        CenterName = "Green Planet Recyclers",
                        OwnerName = "George Eco",
                        PhoneNumber = "9998887771",
                        BusinessRegistrationNumber = "BRN123",
                        RecyclerRegistrationNumber = "RRN123",
                        BuildingNumber = "B-1",
                        Street = "Industrial Estate",
                        District = "Ernakulam",
                        City = "Kochi",
                        State = "Kerala",
                        Pincode = "682020",
                        ExperienceYears = 5
                    };
                    db.RecyclingCenter.Add(recycler);
                    await db.SaveChangesAsync();
                }

                var rcAssignment = new CollectionAssignment
                {
                    DeviceId = susDevice.DeviceId,
                    CollectionAgentId = agent?.CollectionAgentId ?? 7,
                    RecyclingCenterId = recycler.RecyclingCenterId,
                    AssignmentType = "TechnicianToRecyclingCenter",
                    SourceType = "Technician Center",
                    DestinationType = "Recycling Center",
                    Status = "PickupStarted",
                    AssignedAt = DateTime.Now,
                    CreatedAt = DateTime.Now
                };
                db.CollectionAssignments.Add(rcAssignment);
                await db.SaveChangesAsync();

                var rcOtpResult = await controller.SendHandoverOtp(rcAssignment.CollectionAssignmentId!.Value, target: "recycler");
                if (rcOtpResult is not OkObjectResult okRcResult)
                {
                    throw new Exception($"Test 4 (Recycler) failed: returned non-OK: {rcOtpResult}");
                }
                dynamic resRcData = okRcResult.Value!;
                int rcLoginId = (int)resRcData.GetType().GetProperty("recipientLoginId")!.GetValue(resRcData);
                string rcRole = (string)resRcData.GetType().GetProperty("recipientRole")!.GetValue(resRcData);

                Console.WriteLine($"  Recycler Returned Role: {rcRole}, LoginId: {rcLoginId}");
                if (rcRole != "Recycling Center" || rcLoginId != recycler.LoginId)
                {
                    throw new Exception($"Test 4 failed: Recycler OTP went to {rcLoginId}, expected {recycler.LoginId}");
                }

                var refurb = await db.RefurbishmentCenter.Include(r => r.Login).FirstOrDefaultAsync();
                if (refurb == null)
                {
                    var rfLogin = new Login { Email = "refurb@ecocycle.com", PasswordHash = "123", RoleId = 6 };
                    db.Login.Add(rfLogin);
                    await db.SaveChangesAsync();
                    refurb = new RefurbishmentCenter
                    {
                        LoginId = rfLogin.LoginId,
                        CenterName = "Apex Refurbishing Hub",
                        OwnerName = "Priya Tech",
                        PhoneNumber = "9998887772",
                        BusinessRegistrationNumber = "BRN456",
                        BuildingNumber = "B-2",
                        Street = "Tech Park",
                        District = "Ernakulam",
                        City = "Kochi",
                        State = "Kerala",
                        Pincode = "682030",
                        ExperienceYears = 5
                    };
                    db.RefurbishmentCenter.Add(refurb);
                    await db.SaveChangesAsync();
                }

                var rfAssignment = new CollectionAssignment
                {
                    DeviceId = susDevice.DeviceId,
                    CollectionAgentId = agent?.CollectionAgentId ?? 7,
                    RefurbishmentCenterId = refurb.RefurbishmentCenterId,
                    AssignmentType = "TechnicianToRefurbishmentCenter",
                    SourceType = "Technician Center",
                    DestinationType = "Refurbishment Center",
                    Status = "PickupStarted",
                    AssignedAt = DateTime.Now,
                    CreatedAt = DateTime.Now
                };
                db.CollectionAssignments.Add(rfAssignment);
                await db.SaveChangesAsync();

                var rfOtpResult = await controller.SendHandoverOtp(rfAssignment.CollectionAssignmentId!.Value, target: "refurbisher");
                if (rfOtpResult is not OkObjectResult okRfResult)
                {
                    throw new Exception($"Test 4 (Refurbisher) failed: returned non-OK: {rfOtpResult}");
                }
                dynamic resRfData = okRfResult.Value!;
                int rfLoginId = (int)resRfData.GetType().GetProperty("recipientLoginId")!.GetValue(resRfData);
                string rfRole = (string)resRfData.GetType().GetProperty("recipientRole")!.GetValue(resRfData);

                Console.WriteLine($"  Refurbisher Returned Role: {rfRole}, LoginId: {rfLoginId}");
                if (rfRole != "Refurbishment Center" || rfLoginId != refurb.LoginId)
                {
                    throw new Exception($"Test 4 failed: Refurbisher OTP went to {rfLoginId}, expected {refurb.LoginId}");
                }

                Console.WriteLine("  [PASS] Center handover workflows correctly targeted recycling and refurbishment centers.");
                passedCount++;

                // =============================================================
                // TEST 5 — OTP Verification, Resend Invalidation & Notification Isolation
                // =============================================================
                Console.WriteLine("\n-----------------------------------------------------------------");
                Console.WriteLine("TEST 5: OTP Verification, Resend Invalidation & Notification Isolation");
                Console.WriteLine("-----------------------------------------------------------------");

                // Step 1: Send Initial OTP for Sus Mathew
                var step1Res = await controller.SendHandoverOtp(susAssignment.CollectionAssignmentId!.Value);
                var notif1 = await db.Notification
                    .Where(n => n.LoginId == 7 && n.Title == "Handover Verification OTP")
                    .OrderByDescending(n => n.NotificationId)
                    .FirstOrDefaultAsync();
                string otp1 = Regex.Match(notif1?.Message ?? "", @"\b\d{4}\b").Value;
                Console.WriteLine($"  Generated OTP 1 for Sus Mathew: {otp1}");

                // Also create an unread notification for Alan Varghese (LoginId = 2) for device verification
                var alanUnreadNotif = new Notification
                {
                    LoginId = 2,
                    Title = "Handover Verification OTP",
                    Message = $"Your verification OTP for ASUS VivoBook 15 is 9999.",
                    Isread = false,
                    Status = true,
                    CreatedAt = DateTime.Now
                };
                db.Notification.Add(alanUnreadNotif);
                await db.SaveChangesAsync();

                // Step 2: Resend OTP for Sus Mathew
                var step2Res = await controller.SendHandoverOtp(susAssignment.CollectionAssignmentId!.Value);
                var notif2 = await db.Notification
                    .Where(n => n.LoginId == 7 && n.Title == "Handover Verification OTP")
                    .OrderByDescending(n => n.NotificationId)
                    .FirstOrDefaultAsync();
                string otp2 = Regex.Match(notif2?.Message ?? "", @"\b\d{4}\b").Value;
                Console.WriteLine($"  Generated Resent OTP 2 for Sus Mathew: {otp2}");

                // Confirm old notification for Sus was marked superseded
                var reloadedNotif1 = await db.Notification.FindAsync(notif1!.NotificationId);
                if (reloadedNotif1?.Isread != true || !reloadedNotif1.Message.Contains("[Superseded"))
                {
                    throw new Exception("Test 5 failed: Previous OTP notification was not marked as superseded!");
                }
                Console.WriteLine("  [PASS] Previous OTP notification was marked [Superseded - Expired].");

                // Step 3: Try to verify with OLD code (otp1)
                var oldCodeVerifyRes = await controller.VerifyHandoverOtp(susAssignment.CollectionAssignmentId!.Value, new PickupController.VerifyOtpDto { Otp = otp1 });
                if (oldCodeVerifyRes is not BadRequestObjectResult)
                {
                    throw new Exception("Test 5 failed: Verification with superseded OTP code unexpectedly succeeded!");
                }
                Console.WriteLine("  [PASS] Verification with superseded OTP code 1 was rejected.");

                // Step 4: Verify with NEW code (otp2)
                var newCodeVerifyRes = await controller.VerifyHandoverOtp(susAssignment.CollectionAssignmentId!.Value, new PickupController.VerifyOtpDto { Otp = otp2 });
                if (newCodeVerifyRes is not OkObjectResult)
                {
                    throw new Exception($"Test 5 failed: Verification with active OTP code 2 failed: {newCodeVerifyRes}");
                }
                Console.WriteLine("  [PASS] Active OTP code 2 was verified successfully.");

                // Step 5: Verify cannot reuse OTP2
                var reuseVerifyRes = await controller.VerifyHandoverOtp(susAssignment.CollectionAssignmentId!.Value, new PickupController.VerifyOtpDto { Otp = otp2 });
                if (reuseVerifyRes is not BadRequestObjectResult)
                {
                    throw new Exception("Test 5 failed: OTP code reuse was not blocked!");
                }
                Console.WriteLine("  [PASS] Replay attack blocked: verified OTP was invalidated and cannot be reused.");

                // Step 6: Verify Notification Isolation:
                // Sus Mathew's notification (notif2) must now be read (Isread == true)
                var reloadedNotif2 = await db.Notification.FindAsync(notif2!.NotificationId);
                if (reloadedNotif2?.Isread != true)
                {
                    throw new Exception("Test 5 failed: Sus Mathew's notification was not marked as read upon verification!");
                }

                // Alan Varghese's notification (LoginId = 2) MUST STILL BE UNREAD (Isread == false)
                var reloadedAlanNotif = await db.Notification.FindAsync(alanUnreadNotif.NotificationId);
                if (reloadedAlanNotif?.Isread != false)
                {
                    throw new Exception("Test 5 failed: Isolation breach! Alan Varghese's notification was modified by Sus Mathew's verification!");
                }
                Console.WriteLine("  [PASS] Notification Isolation Verified: Alan Varghese (LoginId = 2) unread notification remained unread (Isread == false) when Sus Mathew (LoginId = 7) verified her OTP.");
                passedCount++;

                // =============================================================
                // TEST 6 — Error Handling & Validation
                // =============================================================
                Console.WriteLine("\n-----------------------------------------------------------------");
                Console.WriteLine("TEST 6: Error Handling & Inconsistent Workflow Validation");
                Console.WriteLine("-----------------------------------------------------------------");

                // Scenario A: Stage B Assignment requesting customer OTP without target
                var inconsistentRes = await controller.SendHandoverOtp(rcAssignment.CollectionAssignmentId!.Value);
                if (inconsistentRes is not BadRequestObjectResult)
                {
                    throw new Exception("Test 6A failed: Stage B assignment did not reject missing target parameter!");
                }
                Console.WriteLine("  [PASS] Missing target parameter on Stage B assignment returned BadRequest.");

                // Scenario B: Non-existent Assignment
                var nonExistentRes = await controller.SendHandoverOtp(999999);
                if (nonExistentRes is not NotFoundObjectResult)
                {
                    throw new Exception("Test 6B failed: Non-existent assignment did not return NotFound!");
                }
                Console.WriteLine("  [PASS] Non-existent assignment returned NotFound.");

                // Scenario C: Invalid target parameter
                var invalidTargetRes = await controller.SendHandoverOtp(susAssignment.CollectionAssignmentId!.Value, target: "space_shuttle");
                if (invalidTargetRes is not BadRequestObjectResult)
                {
                    throw new Exception("Test 6C failed: Invalid target parameter did not return BadRequest!");
                }
                Console.WriteLine("  [PASS] Invalid target parameter returned BadRequest.");

                // Scenario D: Unauthorized verification attempt (caller is not the assigned agent)
                var unauthController = CreateController(callerLoginId: 9999, role: "CollectionAgent");
                var unauthVerifyRes = await unauthController.VerifyHandoverOtp(susAssignment.CollectionAssignmentId!.Value, new PickupController.VerifyOtpDto { Otp = "1234" });
                if (unauthVerifyRes is not ObjectResult unauthObj || unauthObj.StatusCode != 403)
                {
                    throw new Exception($"Test 6D failed: Unauthorized caller was not returned 403 Forbidden! Result: {unauthVerifyRes}");
                }
                Console.WriteLine("  [PASS] Unauthorized user verification attempt was rejected with 403 Forbidden.");
                passedCount++;

                // Clean up any test records created specifically for this run
                db.Notification.Remove(alanUnreadNotif);
                await db.SaveChangesAsync();

                Console.WriteLine("\n=================================================================");
                Console.WriteLine($"    ALL {passedCount}/{totalTests} TESTS PASSED SUCCESSFULLY!");
                Console.WriteLine("=================================================================");
                return 0;
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"\n[TEST SUITE FAILURE]: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                Console.ResetColor();
                return 1;
            }
        }
    }
}
