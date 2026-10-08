using EcoCycle.API.Data;
using EcoCycle.API.Data.DTOs;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcoCycle.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DeviceModelController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DeviceModelController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            await SeedInitialModelsIfEmptyAsync();

            var models = await _context.DeviceModel
                .Include(m => m.Category)
                .Where(m => m.IsActive)
                .OrderBy(m => m.Category != null ? m.Category.CategoryName : "")
                .ThenBy(m => m.Brand)
                .ThenBy(m => m.Model)
                .Select(m => new
                {
                    m.DeviceModelId,
                    m.CategoryId,
                    CategoryName = m.Category != null ? m.Category.CategoryName : "Electronics",
                    m.Brand,
                    m.Model,
                    m.ModelNumber,
                    m.Weight,
                    m.ReferenceMarketPrice,
                    m.IsActive,
                    m.CreatedAt,
                    m.UpdatedAt
                })
                .ToListAsync();

            return Ok(models);
        }

        [HttpGet("GetAdminAll")]
        public async Task<IActionResult> GetAdminAll()
        {
            await SeedInitialModelsIfEmptyAsync();

            var models = await _context.DeviceModel
                .Include(m => m.Category)
                .OrderBy(m => m.Category != null ? m.Category.CategoryName : "")
                .ThenBy(m => m.Brand)
                .ThenBy(m => m.Model)
                .Select(m => new
                {
                    m.DeviceModelId,
                    m.CategoryId,
                    CategoryName = m.Category != null ? m.Category.CategoryName : "Electronics",
                    m.Brand,
                    m.Model,
                    m.ModelNumber,
                    m.Weight,
                    m.ReferenceMarketPrice,
                    m.IsActive,
                    m.CreatedAt,
                    m.UpdatedAt
                })
                .ToListAsync();

            return Ok(models);
        }

        [HttpGet("GetByCategory/{categoryId}")]
        public async Task<IActionResult> GetByCategory(int categoryId)
        {
            await SeedInitialModelsIfEmptyAsync();

            var models = await _context.DeviceModel
                .Include(m => m.Category)
                .Where(m => m.CategoryId == categoryId && m.IsActive)
                .OrderBy(m => m.Brand)
                .ThenBy(m => m.Model)
                .Select(m => new
                {
                    m.DeviceModelId,
                    m.CategoryId,
                    CategoryName = m.Category != null ? m.Category.CategoryName : null,
                    m.Brand,
                    m.Model,
                    m.ModelNumber,
                    m.Weight,
                    m.ReferenceMarketPrice,
                    m.IsActive,
                    m.CreatedAt,
                    m.UpdatedAt
                })
                .ToListAsync();

            return Ok(models);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var model = await _context.DeviceModel
                .Include(m => m.Category)
                .FirstOrDefaultAsync(m => m.DeviceModelId == id);

            if (model == null)
            {
                return NotFound(new { message = "Device model not found." });
            }

            return Ok(new
            {
                model.DeviceModelId,
                model.CategoryId,
                CategoryName = model.Category?.CategoryName,
                model.Brand,
                model.Model,
                model.ModelNumber,
                model.Weight,
                model.ReferenceMarketPrice,
                model.IsActive,
                model.CreatedAt,
                model.UpdatedAt
            });
        }

        [HttpPut("UpdatePrice/{id}")]
        public async Task<IActionResult> UpdatePrice(int id, [FromBody] UpdateModelPriceDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { message = "Invalid price payload." });
            }

            if (dto.ReferenceMarketPrice < 0)
            {
                return BadRequest(new { message = "Reference market price cannot be negative." });
            }

            var model = await _context.DeviceModel.FindAsync(id);
            if (model == null)
            {
                return NotFound(new { message = "Device model not found." });
            }

            var oldPrice = model.ReferenceMarketPrice;
            model.ReferenceMarketPrice = dto.ReferenceMarketPrice;
            model.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Reference market price for {model.Brand} {model.Model} updated from ₹{oldPrice:N0} to ₹{model.ReferenceMarketPrice:N0}.",
                deviceModelId = model.DeviceModelId,
                brand = model.Brand,
                model = model.Model,
                referenceMarketPrice = model.ReferenceMarketPrice,
                updatedAt = model.UpdatedAt
            });
        }

        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] DeviceModelCreateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Brand) || string.IsNullOrWhiteSpace(dto.Model) || dto.CategoryId <= 0)
            {
                return BadRequest(new { message = "Category, Brand, and Model name are required." });
            }

            var categoryExists = await _context.DeviceCategory.AnyAsync(c => c.CategoryId == dto.CategoryId);
            if (!categoryExists)
            {
                return BadRequest(new { message = "Selected category does not exist." });
            }

            var duplicate = await _context.DeviceModel.FirstOrDefaultAsync(m =>
                m.CategoryId == dto.CategoryId &&
                m.Brand.ToLower() == dto.Brand.Trim().ToLower() &&
                m.Model.ToLower() == dto.Model.Trim().ToLower()
            );

            if (duplicate != null)
            {
                return BadRequest(new { message = $"A model '{dto.Brand} {dto.Model}' already exists in this category." });
            }

            var newModel = new DeviceModel
            {
                CategoryId = dto.CategoryId,
                Brand = dto.Brand.Trim(),
                Model = dto.Model.Trim(),
                ModelNumber = string.IsNullOrWhiteSpace(dto.ModelNumber) ? null : dto.ModelNumber.Trim(),
                Weight = dto.Weight,
                ReferenceMarketPrice = dto.ReferenceMarketPrice > 0 ? dto.ReferenceMarketPrice : 5000m,
                IsActive = true,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            await _context.DeviceModel.AddAsync(newModel);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Device model '{newModel.Brand} {newModel.Model}' added successfully with Reference Price ₹{newModel.ReferenceMarketPrice:N0}.",
                model = newModel
            });
        }

        [HttpPut("Update/{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DeviceModelUpdateDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Brand) || string.IsNullOrWhiteSpace(dto.Model))
            {
                return BadRequest(new { message = "Brand and Model are required." });
            }

            var model = await _context.DeviceModel.FindAsync(id);
            if (model == null)
            {
                return NotFound(new { message = "Device model not found." });
            }

            model.CategoryId = dto.CategoryId > 0 ? dto.CategoryId : model.CategoryId;
            model.Brand = dto.Brand.Trim();
            model.Model = dto.Model.Trim();
            model.ModelNumber = string.IsNullOrWhiteSpace(dto.ModelNumber) ? null : dto.ModelNumber.Trim();
            model.Weight = dto.Weight;
            model.ReferenceMarketPrice = dto.ReferenceMarketPrice >= 0 ? dto.ReferenceMarketPrice : model.ReferenceMarketPrice;
            model.IsActive = dto.IsActive;
            model.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Device model '{model.Brand} {model.Model}' updated successfully.",
                model
            });
        }

        [HttpDelete("{id}")]
        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var model = await _context.DeviceModel.FindAsync(id);
            if (model == null)
            {
                return NotFound(new { message = "Device model not found." });
            }

            // Soft-delete or toggle active status
            model.IsActive = false;
            model.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Device model '{model.Brand} {model.Model}' deactivated successfully." });
        }

        [HttpPut("Restore/{id}")]
        public async Task<IActionResult> Restore(int id)
        {
            var model = await _context.DeviceModel.FindAsync(id);
            if (model == null)
            {
                return NotFound(new { message = "Device model not found." });
            }

            model.IsActive = true;
            model.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Device model '{model.Brand} {model.Model}' restored successfully." });
        }

        [HttpPut("ToggleStatus/{id}")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var model = await _context.DeviceModel.FindAsync(id);
            if (model == null)
            {
                return NotFound(new { message = "Device model not found." });
            }

            model.IsActive = !model.IsActive;
            model.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Device model '{model.Brand} {model.Model}' status changed to {(model.IsActive ? "Active" : "Inactive")}.", isActive = model.IsActive });
        }

        private async Task SeedInitialModelsIfEmptyAsync()
        {
            try
            {
                var categories = await _context.DeviceCategory.ToListAsync();
                if (!categories.Any()) return;

                var catMobile = categories.FirstOrDefault(c => c.CategoryName.Contains("Mobile", StringComparison.OrdinalIgnoreCase) || c.CategoryName.Contains("Phone", StringComparison.OrdinalIgnoreCase) || c.CategoryName.Contains("Smart", StringComparison.OrdinalIgnoreCase)) ?? categories.First();
                var catLaptop = categories.FirstOrDefault(c => c.CategoryName.Contains("Laptop", StringComparison.OrdinalIgnoreCase) || c.CategoryName.Contains("Computer", StringComparison.OrdinalIgnoreCase)) ?? categories.First();
                var catTablet = categories.FirstOrDefault(c => c.CategoryName.Contains("Tablet", StringComparison.OrdinalIgnoreCase)) ?? catMobile;
                var catTV = categories.FirstOrDefault(c => c.CategoryName.Contains("TV", StringComparison.OrdinalIgnoreCase) || c.CategoryName.Contains("Television", StringComparison.OrdinalIgnoreCase) || c.CategoryName.Contains("Monitor", StringComparison.OrdinalIgnoreCase)) ?? categories.Last();

                if (!await _context.DeviceModel.AnyAsync())
                {
                    var initialModels = new List<DeviceModel>
                    {
                        // Smartphones / Mobile Phones
                        new DeviceModel { CategoryId = catMobile.CategoryId, Brand = "Apple", Model = "iPhone 13 Pro", ModelNumber = "A2638", Weight = 0.204m, ReferenceMarketPrice = 45000m },
                        new DeviceModel { CategoryId = catMobile.CategoryId, Brand = "Apple", Model = "iPhone 14 Pro Max", ModelNumber = "A2894", Weight = 0.240m, ReferenceMarketPrice = 65000m },
                        new DeviceModel { CategoryId = catMobile.CategoryId, Brand = "Samsung", Model = "Galaxy S23", ModelNumber = "SM-S911B", Weight = 0.168m, ReferenceMarketPrice = 35000m },
                        new DeviceModel { CategoryId = catMobile.CategoryId, Brand = "Samsung", Model = "Galaxy S21 Ultra", ModelNumber = "SM-G998B", Weight = 0.227m, ReferenceMarketPrice = 38000m },
                        new DeviceModel { CategoryId = catMobile.CategoryId, Brand = "Samsung", Model = "Galaxy Note 20", ModelNumber = "SM-N980F", Weight = 0.192m, ReferenceMarketPrice = 25000m },
                        new DeviceModel { CategoryId = catMobile.CategoryId, Brand = "OnePlus", Model = "OnePlus 11", ModelNumber = "CPH2449", Weight = 0.205m, ReferenceMarketPrice = 30000m },
                        new DeviceModel { CategoryId = catMobile.CategoryId, Brand = "Xiaomi", Model = "Redmi Note 12 Pro", ModelNumber = "22101316G", Weight = 0.187m, ReferenceMarketPrice = 16000m },

                        // Laptops & Computers
                        new DeviceModel { CategoryId = catLaptop.CategoryId, Brand = "Apple", Model = "MacBook Pro 14\"", ModelNumber = "A2442", Weight = 1.600m, ReferenceMarketPrice = 75000m },
                        new DeviceModel { CategoryId = catLaptop.CategoryId, Brand = "Apple", Model = "MacBook Air M2", ModelNumber = "A2681", Weight = 1.240m, ReferenceMarketPrice = 55000m },
                        new DeviceModel { CategoryId = catLaptop.CategoryId, Brand = "Dell", Model = "XPS 15 9520", ModelNumber = "XPS9520", Weight = 1.920m, ReferenceMarketPrice = 60000m },
                        new DeviceModel { CategoryId = catLaptop.CategoryId, Brand = "Dell", Model = "Inspiron 15 3511", ModelNumber = "INS3511", Weight = 1.850m, ReferenceMarketPrice = 35000m },
                        new DeviceModel { CategoryId = catLaptop.CategoryId, Brand = "HP", Model = "Pavilion 15", ModelNumber = "15-EG0000", Weight = 1.750m, ReferenceMarketPrice = 32000m },
                        new DeviceModel { CategoryId = catLaptop.CategoryId, Brand = "HP", Model = "Spectre x360", ModelNumber = "14-EF0000", Weight = 1.360m, ReferenceMarketPrice = 48000m },
                        new DeviceModel { CategoryId = catLaptop.CategoryId, Brand = "Lenovo", Model = "ThinkPad X1 Carbon", ModelNumber = "20XW", Weight = 1.130m, ReferenceMarketPrice = 45000m },
                        new DeviceModel { CategoryId = catLaptop.CategoryId, Brand = "Asus", Model = "ROG Zephyrus G14", ModelNumber = "GA402", Weight = 1.650m, ReferenceMarketPrice = 50000m },

                        // Tablets
                        new DeviceModel { CategoryId = catTablet.CategoryId, Brand = "Apple", Model = "iPad Pro 11\"", ModelNumber = "A2377", Weight = 0.466m, ReferenceMarketPrice = 42000m },
                        new DeviceModel { CategoryId = catTablet.CategoryId, Brand = "Samsung", Model = "Galaxy Tab S8", ModelNumber = "SM-X700", Weight = 0.503m, ReferenceMarketPrice = 35000m },

                        // TV / Display
                        new DeviceModel { CategoryId = catTV.CategoryId, Brand = "Samsung", Model = "Crystal 4K UHD 55\"", ModelNumber = "UA55AUE60", Weight = 14.200m, ReferenceMarketPrice = 28000m },
                        new DeviceModel { CategoryId = catTV.CategoryId, Brand = "LG", Model = "OLED C2 55\"", ModelNumber = "OLED55C2", Weight = 14.400m, ReferenceMarketPrice = 42000m },
                        new DeviceModel { CategoryId = catTV.CategoryId, Brand = "Sony", Model = "Bravia 55X80K", ModelNumber = "KD-55X80K", Weight = 15.900m, ReferenceMarketPrice = 36000m }
                    };

                    await _context.DeviceModel.AddRangeAsync(initialModels);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    // Check if Galaxy S23 exists, if not add it
                    var s23 = await _context.DeviceModel.FirstOrDefaultAsync(m => m.Brand.ToLower() == "samsung" && m.Model.ToLower() == "galaxy s23");
                    if (s23 == null)
                    {
                        await _context.DeviceModel.AddAsync(new DeviceModel
                        {
                            CategoryId = catMobile.CategoryId,
                            Brand = "Samsung",
                            Model = "Galaxy S23",
                            ModelNumber = "SM-S911B",
                            Weight = 0.168m,
                            ReferenceMarketPrice = 35000m,
                            IsActive = true,
                            CreatedAt = DateTime.Now,
                            UpdatedAt = DateTime.Now
                        });
                        await _context.SaveChangesAsync();
                    }

                    // Backfill reference market prices if any model is still 0
                    var zeroPriced = await _context.DeviceModel.Where(m => m.ReferenceMarketPrice == 0).ToListAsync();
                    if (zeroPriced.Any())
                    {
                        foreach (var m in zeroPriced)
                        {
                            var bLower = m.Brand.ToLower();
                            var mLower = m.Model.ToLower();

                            if (mLower.Contains("iphone 14") || mLower.Contains("macbook pro")) m.ReferenceMarketPrice = 65000m;
                            else if (mLower.Contains("iphone 13") || mLower.Contains("xps") || mLower.Contains("ipad pro")) m.ReferenceMarketPrice = 45000m;
                            else if (mLower.Contains("galaxy s23") || mLower.Contains("galaxy tab")) m.ReferenceMarketPrice = 35000m;
                            else if (mLower.Contains("oneplus") || mLower.Contains("thinkpad") || mLower.Contains("pavilion")) m.ReferenceMarketPrice = 30000m;
                            else if (mLower.Contains("tv") || mLower.Contains("oled") || mLower.Contains("bravia")) m.ReferenceMarketPrice = 36000m;
                            else if (mLower.Contains("redmi")) m.ReferenceMarketPrice = 16000m;
                            else m.ReferenceMarketPrice = 15000m;

                            m.UpdatedAt = DateTime.Now;
                        }
                        await _context.SaveChangesAsync();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error seeding initial DeviceModel data: " + ex.Message);
            }
        }
    }
}
