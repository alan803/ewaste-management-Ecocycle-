namespace EcoCycle.API.Data.DTOs
{
    public class DeviceModelCreateDto
    {
        public int CategoryId { get; set; }
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string? ModelNumber { get; set; }
        public decimal? Weight { get; set; }
        public decimal ReferenceMarketPrice { get; set; }
    }

    public class DeviceModelUpdateDto
    {
        public int CategoryId { get; set; }
        public string Brand { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string? ModelNumber { get; set; }
        public decimal? Weight { get; set; }
        public decimal ReferenceMarketPrice { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateModelPriceDto
    {
        public decimal ReferenceMarketPrice { get; set; }
    }
}
