using Microsoft.AspNetCore.Http;
using System;
using System.ComponentModel.DataAnnotations;

namespace EcoCycle.Data.DTOs
{
    public class DeviceAdd
    {
        // =========================================================
        // DEVICE INFORMATION
        // =========================================================

        [Required]
        public int CategoryId { get; set; }

        [Required]
        [StringLength(100)]
        public string Brand { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Model { get; set; } = string.Empty;

        [StringLength(100)]
        public string? ModelNumber { get; set; }

        [StringLength(100)]
        public string? SerialNumber { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Required]
        public int Weight { get; set; }

        // =========================================================
        // DEVICE CONDITION
        // =========================================================

        [Required]
        [StringLength(30)]
        public string Condition { get; set; } = string.Empty;

        [StringLength(30)]
        public string? Working { get; set; }

        [StringLength(500)]
        public string? PhysicalDamage { get; set; }

        [StringLength(50)]
        public string? DisplayCondition { get; set; }

        [StringLength(50)]
        public string? BatteryCondition { get; set; }

        [StringLength(30)]
        public string? Accessories { get; set; }

        [StringLength(30)]
        public string? Charger { get; set; }


        // =========================================================
        // DEVICE PHOTOS
        // =========================================================

        public IFormFile? FrontPhoto { get; set; }

        public IFormFile? BackPhoto { get; set; }

        public IFormFile? DamagePhoto { get; set; }

        public IFormFile? LabelPhoto { get; set; }


        // =========================================================
        // PROCESSING PREFERENCE
        // =========================================================

        [Required]
        [StringLength(30)]
        public string ProcessingPreference { get; set; } = string.Empty;


        // =========================================================
        // PICKUP DETAILS
        // =========================================================

        // true  = use registered address
        // false = use different address
        public bool UseRegisteredAddress { get; set; } = true;

        // Required only when UseRegisteredAddress = false
        [StringLength(500)]
        public string? Address { get; set; }

        [StringLength(150)]
        public string? Landmark { get; set; }

        [Required]
        public DateTime PickupDate { get; set; }

        [Required]
        [StringLength(30)]
        public string TimeSlot { get; set; } = string.Empty;

        [StringLength(500)]
        public string? PickupInstructions { get; set; }


        // =========================================================
        // OWNERSHIP
        // =========================================================

        [Required]
        [StringLength(30)]
        public string Ownership { get; set; } = string.Empty;

        [Required]
        public bool OwnershipConfirmed { get; set; }

        [Required]
        public bool TermsAccepted { get; set; }
    }
}