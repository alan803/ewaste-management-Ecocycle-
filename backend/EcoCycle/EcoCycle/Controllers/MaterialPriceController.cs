using EcoCycle.API.Data;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcoCycle.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MaterialPriceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MaterialPriceController(ApplicationDbContext context)
        {
            _context = context;
        }

        public class CreateMaterialPriceDto
        {
            public int ComponentTypeId { get; set; }
            public decimal PricePerKg { get; set; }
            public DateTime? EffectiveFrom { get; set; }
            public DateTime? EffectiveTo { get; set; }
            public bool IsActive { get; set; } = true;
        }

        public class UpdateMaterialPriceDto
        {
            public int ComponentTypeId { get; set; }
            public decimal PricePerKg { get; set; }
            public DateTime? EffectiveFrom { get; set; }
            public DateTime? EffectiveTo { get; set; }
            public bool IsActive { get; set; }
        }

        // GET: api/MaterialPrice
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var prices = await _context.MaterialPrices
                    .Include(m => m.ComponentType)
                    .OrderByDescending(m => m.CreatedAt)
                    .Select(m => new
                    {
                        m.MaterialPriceId,
                        m.ComponentTypeId,
                        ComponentName = m.ComponentType != null ? m.ComponentType.ComponentName : "Unknown Material",
                        HandlingType = m.ComponentType != null ? m.ComponentType.HandlingType : "Standard",
                        IsHazardous = m.ComponentType != null ? m.ComponentType.IsHazardous : false,
                        m.PricePerKg,
                        m.EffectiveFrom,
                        m.EffectiveTo,
                        m.IsActive,
                        m.CreatedAt,
                        m.UpdatedAt
                    })
                    .ToListAsync();

                return Ok(prices);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching material prices: " + ex.Message });
            }
        }

        // GET: api/MaterialPrice/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var price = await _context.MaterialPrices
                    .Include(m => m.ComponentType)
                    .FirstOrDefaultAsync(m => m.MaterialPriceId == id);

                if (price == null)
                    return NotFound(new { message = "Material price record not found." });

                return Ok(new
                {
                    price.MaterialPriceId,
                    price.ComponentTypeId,
                    ComponentName = price.ComponentType != null ? price.ComponentType.ComponentName : "Unknown Material",
                    HandlingType = price.ComponentType != null ? price.ComponentType.HandlingType : "Standard",
                    IsHazardous = price.ComponentType != null ? price.ComponentType.IsHazardous : false,
                    price.PricePerKg,
                    price.EffectiveFrom,
                    price.EffectiveTo,
                    price.IsActive,
                    price.CreatedAt,
                    price.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching material price detail: " + ex.Message });
            }
        }

        // POST: api/MaterialPrice
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateMaterialPriceDto dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest(new { message = "Invalid material price data." });

                if (dto.PricePerKg <= 0 || dto.PricePerKg > 10000)
                    return BadRequest(new { message = "Price per kg must be greater than 0 and cannot exceed 10,000." });

                var compType = await _context.ComponentTypes.FindAsync(dto.ComponentTypeId);
                if (compType == null)
                    return BadRequest(new { message = "Selected ComponentType does not exist." });

                var newPrice = new MaterialPrice
                {
                    ComponentTypeId = dto.ComponentTypeId,
                    PricePerKg = dto.PricePerKg,
                    EffectiveFrom = dto.EffectiveFrom ?? DateTime.Now,
                    EffectiveTo = dto.EffectiveTo,
                    IsActive = dto.IsActive,
                    CreatedAt = DateTime.Now
                };

                _context.MaterialPrices.Add(newPrice);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetById), new { id = newPrice.MaterialPriceId }, new
                {
                    newPrice.MaterialPriceId,
                    newPrice.ComponentTypeId,
                    ComponentName = compType.ComponentName,
                    newPrice.PricePerKg,
                    newPrice.EffectiveFrom,
                    newPrice.EffectiveTo,
                    newPrice.IsActive,
                    newPrice.CreatedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating material price: " + ex.Message });
            }
        }

        // PUT: api/MaterialPrice/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMaterialPriceDto dto)
        {
            try
            {
                var price = await _context.MaterialPrices.FindAsync(id);
                if (price == null)
                    return NotFound(new { message = "Material price record not found." });

                if (dto.PricePerKg <= 0 || dto.PricePerKg > 10000)
                    return BadRequest(new { message = "Price per kg must be greater than 0 and cannot exceed 10,000." });

                if (dto.ComponentTypeId > 0)
                {
                    var compType = await _context.ComponentTypes.FindAsync(dto.ComponentTypeId);
                    if (compType == null)
                        return BadRequest(new { message = "Selected ComponentType does not exist." });
                    price.ComponentTypeId = dto.ComponentTypeId;
                }

                price.PricePerKg = dto.PricePerKg;
                if (dto.EffectiveFrom.HasValue) price.EffectiveFrom = dto.EffectiveFrom.Value;
                price.EffectiveTo = dto.EffectiveTo;
                price.IsActive = dto.IsActive;
                price.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Material price updated successfully.", priceId = id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating material price: " + ex.Message });
            }
        }

        // DELETE: api/MaterialPrice/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var price = await _context.MaterialPrices.FindAsync(id);
                if (price == null)
                    return NotFound(new { message = "Material price record not found." });

                _context.MaterialPrices.Remove(price);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Material price record deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting material price: " + ex.Message });
            }
        }
    }
}
