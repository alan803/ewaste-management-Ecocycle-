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
        public DbSet<RecyclingCenter> RecyclingCenter { get; set; }
        public DbSet<DeviceCategory> DeviceCategory { get; set; }
        public DbSet<Device> Device { get; set; }
        public DbSet<InspectionRequest> InspectionRequest { get; set; }
        public DbSet<Inspection> Inspection { get; set; }
        public DbSet<CollectionAssignment> CollectionAssignments { get; set; }
        public DbSet<UserPushToken> UserPushTokens { get; set; }
        public DbSet<AllocationRejection> AllocationRejections { get; set; }
        public DbSet<Notification> Notification { get; set; }
        public DbSet<DeviceModel> DeviceModel { get; set; }
        public DbSet<Pickup> Pickups { get; set; }
        public DbSet<Delivery> Deliveries { get; set; }
        public DbSet<RecyclingCenterRequest> RecyclingCenterRequests { get; set; }
        public DbSet<InspectionResult> InspectionResult { get; set; }
        public DbSet<InspectionPhoto> InspectionPhoto { get; set; }
        public DbSet<RefurbishmentRequest> RefurbishmentRequests { get; set; }
        public DbSet<RecyclingProcess> RecyclingProcesses { get; set; }
        public DbSet<RecoveredMaterials> RecoveredMaterials { get; set; }
        public DbSet<ComponentType> ComponentTypes { get; set; }
        public DbSet<DeviceModelComponent> DeviceModelComponents { get; set; }

        public DbSet<TechnicianPenalty> technicianPenalties { get; set; }

        public DbSet<Payment> Payments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Device>()
                .HasOne(d => d.DeviceModel)
                .WithMany()
                .HasForeignKey(d => d.DeviceModelId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Inspection>()
                .HasOne(i => i.Device)
                .WithMany()
                .HasForeignKey(i => i.DeviceId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Inspection>()
                .HasOne(i => i.Technician)
                .WithMany()
                .HasForeignKey(i => i.TechnicianId)
                .OnDelete(DeleteBehavior.NoAction);


            modelBuilder.Entity<RefurbishmentRequest>()
                .HasOne(rr => rr.Device)
                .WithMany()
                .HasForeignKey(rr => rr.DeviceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RefurbishmentRequest>()
                .HasOne(rr => rr.RefurbishmentCenter)
                .WithMany()
                .HasForeignKey(rr => rr.RefurbishmentCenterId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<RecyclingCenterRequest>()
                .HasOne(rr => rr.Device)
                .WithMany()
                .HasForeignKey(rr => rr.DeviceId)
                .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<RecyclingCenterRequest>()
                .HasOne(rr => rr.RecyclingCenter)
                .WithMany()
                .HasForeignKey(rr => rr.RecyclingCenterId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<CollectionAssignment>()
                .HasOne(ca => ca.RecyclingCenter)
                .WithMany()
                .HasForeignKey(ca => ca.RecyclingCenterId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<InspectionResult>()
                .HasOne(ir => ir.Inspection)
                .WithMany(i => i.Results)
                .HasForeignKey(ir => ir.InspectionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<InspectionPhoto>()
                .HasOne(ip => ip.InspectionResult)
                .WithMany(ir => ir.Photos)
                .HasForeignKey(ip => ip.InspectionResultId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<InspectionResult>()
                .Property(ir => ir.Score)
                .HasPrecision(18, 2);

            modelBuilder.Entity<TechnicianPenalty>()
                .HasOne(tp => tp.Technician)
                .WithMany()
                .HasForeignKey(tp => tp.TechnicianId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Payer)
                .WithMany()
                .HasForeignKey(p => p.PayerLoginId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Receiver)
                .WithMany()
                .HasForeignKey(p => p.ReceiverLoginId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasPrecision(18, 2);
        }
    }
}