using EcoCycle.API.Data;
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
                    m.IsActive
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
                    m.IsActive
                })
                .ToListAsync();

            return Ok(models);
        }

        private async Task SeedInitialModelsIfEmptyAsync()
        {
            try
            {
                if (!await _context.DeviceModel.AnyAsync())
                {
                    var categories = await _context.DeviceCategory.ToListAsync();
                    if (!categories.Any()) return;

                    var catMobile = categories.FirstOrDefault(c => c.CategoryName.Contains("Mobile", StringComparison.OrdinalIgnoreCase) || c.CategoryName.Contains("Phone", StringComparison.OrdinalIgnoreCase) || c.CategoryName.Contains("Smart", StringComparison.OrdinalIgnoreCase)) ?? categories.First();
                    var catLaptop = categories.FirstOrDefault(c => c.CategoryName.Contains("Laptop", StringComparison.OrdinalIgnoreCase) || c.CategoryName.Contains("Computer", StringComparison.OrdinalIgnoreCase)) ?? categories.First();
                    var catTablet = categories.FirstOrDefault(c => c.CategoryName.Contains("Tablet", StringComparison.OrdinalIgnoreCase)) ?? catMobile;
                    var catTV = categories.FirstOrDefault(c => c.CategoryName.Contains("TV", StringComparison.OrdinalIgnoreCase) || c.CategoryName.Contains("Television", StringComparison.OrdinalIgnoreCase) || c.CategoryName.Contains("Monitor", StringComparison.OrdinalIgnoreCase)) ?? categories.Last();

                    var initialModels = new List<DeviceModel>
                    {
                        // Smartphones / Mobile Phones
                        new DeviceModel { CategoryId = catMobile.CategoryId, Brand = "Apple", Model = "iPhone 13 Pro", ModelNumber = "A2638", Weight = 0.204m },
                        new DeviceModel { CategoryId = catMobile.CategoryId, Brand = "Apple", Model = "iPhone 14 Pro Max", ModelNumber = "A2894", Weight = 0.240m },
                        new DeviceModel { CategoryId = catMobile.CategoryId, Brand = "Samsung", Model = "Galaxy S21 Ultra", ModelNumber = "SM-G998B", Weight = 0.227m },
                        new DeviceModel { CategoryId = catMobile.CategoryId, Brand = "Samsung", Model = "Galaxy Note 20", ModelNumber = "SM-N980F", Weight = 0.192m },
                        new DeviceModel { CategoryId = catMobile.CategoryId, Brand = "OnePlus", Model = "OnePlus 11", ModelNumber = "CPH2449", Weight = 0.205m },
                        new DeviceModel { CategoryId = catMobile.CategoryId, Brand = "Xiaomi", Model = "Redmi Note 12 Pro", ModelNumber = "22101316G", Weight = 0.187m },

                        // Laptops & Computers
                        new DeviceModel { CategoryId = catLaptop.CategoryId, Brand = "Apple", Model = "MacBook Pro 14\"", ModelNumber = "A2442", Weight = 1.600m },
                        new DeviceModel { CategoryId = catLaptop.CategoryId, Brand = "Apple", Model = "MacBook Air M2", ModelNumber = "A2681", Weight = 1.240m },
                        new DeviceModel { CategoryId = catLaptop.CategoryId, Brand = "Dell", Model = "XPS 15 9520", ModelNumber = "XPS9520", Weight = 1.920m },
                        new DeviceModel { CategoryId = catLaptop.CategoryId, Brand = "Dell", Model = "Inspiron 15 3511", ModelNumber = "INS3511", Weight = 1.850m },
                        new DeviceModel { CategoryId = catLaptop.CategoryId, Brand = "HP", Model = "Pavilion 15", ModelNumber = "15-EG0000", Weight = 1.750m },
                        new DeviceModel { CategoryId = catLaptop.CategoryId, Brand = "HP", Model = "Spectre x360", ModelNumber = "14-EF0000", Weight = 1.360m },
                        new DeviceModel { CategoryId = catLaptop.CategoryId, Brand = "Lenovo", Model = "ThinkPad X1 Carbon", ModelNumber = "20XW", Weight = 1.130m },
                        new DeviceModel { CategoryId = catLaptop.CategoryId, Brand = "Asus", Model = "ROG Zephyrus G14", ModelNumber = "GA402", Weight = 1.650m },

                        // Tablets
                        new DeviceModel { CategoryId = catTablet.CategoryId, Brand = "Apple", Model = "iPad Pro 11\"", ModelNumber = "A2377", Weight = 0.466m },
                        new DeviceModel { CategoryId = catTablet.CategoryId, Brand = "Samsung", Model = "Galaxy Tab S8", ModelNumber = "SM-X700", Weight = 0.503m },

                        // TV / Display
                        new DeviceModel { CategoryId = catTV.CategoryId, Brand = "Samsung", Model = "Crystal 4K UHD 55\"", ModelNumber = "UA55AUE60", Weight = 14.200m },
                        new DeviceModel { CategoryId = catTV.CategoryId, Brand = "LG", Model = "OLED C2 55\"", ModelNumber = "OLED55C2", Weight = 14.400m },
                        new DeviceModel { CategoryId = catTV.CategoryId, Brand = "Sony", Model = "Bravia 55X80K", ModelNumber = "KD-55X80K", Weight = 15.900m }
                    };

                    await _context.DeviceModel.AddRangeAsync(initialModels);
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error seeding initial DeviceModel data: " + ex.Message);
            }
        }
    }
}
