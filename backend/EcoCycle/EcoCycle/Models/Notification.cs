using System;
using System.ComponentModel.DataAnnotations;
namespace EcoCycle.API.Models
{
    public class Notification
    {
        [Key]
        public int NotificationId { get; set; }
        public int? LoginId { get; set; }
        public string? Title { get; set; }
        public string? Message { get; set; }
        public bool? Isread { get; set; } = false;
        public bool? Status { get; set; } = true;
        public DateTime? CreatedAt { get; set; } = DateTime.Now;
    }
}
