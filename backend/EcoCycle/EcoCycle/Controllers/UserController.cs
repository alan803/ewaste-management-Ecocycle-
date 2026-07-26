using EcoCycle.API.Data;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace EcoCycle.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext db;
        public UserController(ApplicationDbContext db)
        {
            this.db = db;
        }
        [HttpPost("Register")]
        public IActionResult Register(User user)
        {
            if (db.Users.Any(u => u.Email == user.Email))
            {
                return BadRequest(
                    new
                    {
                        field="email_er",
                        message="Email is already registered"
                    });
            }
            if(db.Users.Any(u=>u.PhoneNumber == user.PhoneNumber))
            {
                return BadRequest(
                    new
                    {
                        field="phone_er",
                        message = "Phone number is already registered"
                    }
                    );
            }
                var passwordHasher = new PasswordHasher<User>();
                user.Password = passwordHasher.HashPassword(user, user.Password);

                db.Users.Add(user);
                db.SaveChanges();

                return Ok("User Registered Successfully");
         }
        [HttpPost("Login")]
        public IActionResult Login(Login login)
        {
            var user = db.Users.Include(u=>u.Role).FirstOrDefault(u => u.Email == login.Email);
            if (user==null)
            {
                return BadRequest(new
                {
                    field = "email_er",
                    Message = "Email not registered"
                });
            }
            var passwordHasher = new PasswordHasher<User>();

            var result = passwordHasher.VerifyHashedPassword(
            user,
            user.Password,
            login.Password);
            if(result==PasswordVerificationResult.Failed)
            {
                return BadRequest(new {
                    field = "password_er",
                    message = "Incorrect password"
                });
            }
            return Ok(new
            {
                userId = user.UserId,
                firstName = user.FirstName,
                roleId = user.RoleId,
                role = user.Role.name
            });
        }
     }
 }