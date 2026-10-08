using EcoCycle.API.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class CollectionAssignment
{
    [Key]
    public int? CollectionAssignmentId { get; set; }

    [Required]
    public int DeviceId { get; set; }

    [ForeignKey(nameof(DeviceId))]
    public Device Device { get; set; } = null!;

    public int? CollectionAgentId { get; set; }

    [ForeignKey(nameof(CollectionAgentId))]
    public CollectionAgent? CollectionAgent { get; set; }

    /// <summary>
    /// Populated for AssignmentType = "TechnicianToRecyclingCenter".
    /// Identifies which recycling center is receiving the device.
    /// </summary>
    public int? RecyclingCenterId { get; set; }

    [ForeignKey(nameof(RecyclingCenterId))]
    public RecyclingCenter? RecyclingCenter { get; set; }

    /// <summary>
    /// Populated for AssignmentType = "TechnicianToRefurbishmentCenter".
    /// Identifies which refurbishment center is receiving the device.
    /// </summary>
    public int? RefurbishmentCenterId { get; set; }

    [ForeignKey(nameof(RefurbishmentCenterId))]
    public RefurbishmentCenter? RefurbishmentCenter { get; set; }

    [Required]
    [StringLength(50)]
    public string AssignmentType { get; set; } = "CustomerToTechnician";

    [StringLength(100)]
    public string? SourceType { get; set; }

    [StringLength(100)]
    public string? DestinationType { get; set; }

    [Required]
    [StringLength(30)]
    public string Status { get; set; } = "Assigned";

    public DateTime? AssignedAt { get; set; }

    public DateTime? ResponseDeadline { get; set; }

    public int ExtensionCount { get; set; } = 0;

    public DateTime? RespondedAt { get; set; }

    public DateTime? AcceptedAt { get; set; }

    public DateTime? CompletionDeadline { get; set; }

    public DateTime? PickupStartedAt { get; set; }

    public DateTime? PickedUpAt { get; set; }

    public DateTime? DeliveredAt { get; set; }

    [StringLength(500)]
    public string? RejectionReason { get; set; }

    [NotMapped]
    public int? TechnicianId { get; set; }

    [NotMapped]
    public Technician? Technician { get; set; }

    [NotMapped]
    public string? DeliveredAddress { get; set; }

    [NotMapped]
    public string? TechnicianCenterName { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }
}