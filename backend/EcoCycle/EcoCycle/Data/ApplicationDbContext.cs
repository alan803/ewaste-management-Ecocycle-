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
        public DbSet<Payout> Payouts { get; set; }
        public DbSet<EcoCycleTransaction> EcoCycleTransactions { get; set; }
        public DbSet<MaterialPrice> MaterialPrices { get; set; }
        public DbSet<RefurbishmentProcess> RefurbishmentProcesses { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // =========================
            // DEVICE
            // =========================

            modelBuilder.Entity<Device>()
                .HasOne(d => d.DeviceModel)
                .WithMany()
                .HasForeignKey(d => d.DeviceModelId)
                .OnDelete(DeleteBehavior.SetNull);


            // =========================
            // INSPECTION
            // =========================

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

            modelBuilder.Entity<Inspection>()
                .Property(i => i.OverallScore)
                .HasPrecision(18, 2);


            // =========================
            // REFURBISHMENT REQUEST
            // =========================

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

            // =========================
            // REFURBISHMENT PROCESS
            // =========================

            modelBuilder.Entity<RefurbishmentProcess>()
                .HasOne(rp => rp.RefurbishmentRequest)
                .WithMany()
                .HasForeignKey(rp => rp.RefurbishmentRequestId)
                .OnDelete(DeleteBehavior.Cascade);


            // =========================
            // RECYCLING CENTER REQUEST
            // =========================

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


            // =========================
            // COLLECTION ASSIGNMENT
            // =========================

            modelBuilder.Entity<CollectionAssignment>()
                .HasOne(ca => ca.RecyclingCenter)
                .WithMany()
                .HasForeignKey(ca => ca.RecyclingCenterId)
                .OnDelete(DeleteBehavior.NoAction);


            // =========================
            // INSPECTION RESULT
            // =========================

            modelBuilder.Entity<InspectionResult>()
                .HasOne(ir => ir.Inspection)
                .WithMany(i => i.Results)
                .HasForeignKey(ir => ir.InspectionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<InspectionResult>()
                .Property(ir => ir.Score)
                .HasPrecision(18, 2);


            // =========================
            // INSPECTION PHOTO
            // =========================

            modelBuilder.Entity<InspectionPhoto>()
                .HasOne(ip => ip.InspectionResult)
                .WithMany(ir => ir.Photos)
                .HasForeignKey(ip => ip.InspectionResultId)
                .OnDelete(DeleteBehavior.Cascade);


            // =========================
            // TECHNICIAN PENALTY
            // =========================

            modelBuilder.Entity<TechnicianPenalty>()
                .HasOne(tp => tp.Technician)
                .WithMany()
                .HasForeignKey(tp => tp.TechnicianId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<TechnicianPenalty>()
                .Property(t => t.PenaltyAmount)
                .HasPrecision(18, 2);


            // =========================
            // PAYMENT
            // =========================

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


            // =========================
            // MATERIAL PRICE
            // =========================

            modelBuilder.Entity<MaterialPrice>()
                .HasOne(mp => mp.ComponentType)
                .WithMany(ct => ct.MaterialPrices)
                .HasForeignKey(mp => mp.ComponentTypeId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<MaterialPrice>()
                .Property(mp => mp.PricePerKg)
                .HasPrecision(18, 2);


            // =========================
            // RECOVERED MATERIALS
            // =========================

            modelBuilder.Entity<RecoveredMaterials>()
                .Property(r => r.EstimatedValue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<RecoveredMaterials>()
                .Property(r => r.PricePerUnit)
                .HasPrecision(18, 2);

            modelBuilder.Entity<RecoveredMaterials>()
                .Property(r => r.Quantity)
                .HasPrecision(18, 3);


            // =========================
            // RECYCLING PROCESS
            // =========================

            modelBuilder.Entity<RecyclingProcess>()
                .Property(r => r.HazardousWasteWeight)
                .HasPrecision(18, 3);

            modelBuilder.Entity<RecyclingProcess>()
                .Property(r => r.NetRecoveryValue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<RecyclingProcess>()
                .Property(r => r.ProcessingCost)
                .HasPrecision(18, 2);

            modelBuilder.Entity<RecyclingProcess>()
                .Property(r => r.TotalMaterialValue)
                .HasPrecision(18, 2);

            modelBuilder.Entity<RecyclingProcess>()
                .Property(r => r.TotalRecoveredWeight)
                .HasPrecision(18, 3);

            // =========================
            // PAYOUT
            // =========================

            modelBuilder.Entity<Payout>()
                .HasOne(p => p.Device)
                .WithMany()
                .HasForeignKey(p => p.DeviceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Payout>()
                .HasOne(p => p.Receiver)
                .WithMany()
                .HasForeignKey(p => p.ReceiverLoginId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Payout>()
                .Property(p => p.Amount)
                .HasPrecision(18, 2);

            // =========================
            // ECOCYCLE TRANSACTION
            // =========================

            modelBuilder.Entity<EcoCycleTransaction>()
                .Property(t => t.Amount)
                .HasPrecision(18, 2);
        }
    }
}
