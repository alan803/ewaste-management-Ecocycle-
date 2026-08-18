using EcoCycle.API.Models;
using Microsoft.EntityFrameworkCore;

namespace EcoCycle.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Login> Login { get; set; }
        public DbSet<CollectionAgent> CollectionAgents { get; set; }
        public DbSet<Technician> Technician { get; set; }
        public DbSet<RefurbishmentCenter> RefurbishmentCenter { get; set; }
        public DbSet<RecyclingCenter> RecyclingCenter {  get; set; }
        public DbSet<DeviceCategory> DeviceCategory {  get; set; }
        public DbSet<Device> Device { get; set; }
        public DbSet<InspectionRequest> InspectionRequest { get; set; }
        public DbSet<CollectionAssignment> CollectionAssignments { get; set; }
        public DbSet<UserPushToken> UserPushTokens { get; set; }
        public DbSet<AllocationRejection> AllocationRejections { get; set; }
        public DbSet<Notification> Notification {  get; set; }
    }
}