using EcoCycle.API.Data;
using EcoCycle.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EcoCycle.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ComponentTypeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ComponentTypeController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            await SeedInitialComponentTypesIfEmptyAsync();

            var list = await _context.ComponentTypes
                .Select(c => new
                {
                    c.ComponentTypeId,
                    c.ComponentName,
                    c.HandlingType,
                    c.Description,
                    c.IsHazardous,
                    c.CreatedAt
                })
                .ToListAsync();

            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var comp = await _context.ComponentTypes.FindAsync(id);
            if (comp == null)
            {
                return NotFound(new { message = "ComponentType not found." });
            }

            return Ok(new
            {
                comp.ComponentTypeId,
                comp.ComponentName,
                comp.HandlingType,
                comp.Description,
                comp.IsHazardous,
                comp.CreatedAt
            });
        }

        [HttpGet("hazardous")]
        public async Task<IActionResult> GetHazardousOnly()
        {
            await SeedInitialComponentTypesIfEmptyAsync();

            var list = await _context.ComponentTypes
                .Where(c => c.IsHazardous)
                .Select(c => new
                {
                    c.ComponentTypeId,
                    c.ComponentName,
                    c.HandlingType,
                    c.Description,
                    c.IsHazardous,
                    c.CreatedAt
                })
                .ToListAsync();

            return Ok(list);
        }

        public class CreateComponentTypeDto
        {
            public string ComponentName { get; set; } = string.Empty;
            public string HandlingType { get; set; } = "Standard Recycling";
            public string? Description { get; set; }
            public bool IsHazardous { get; set; } = false;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateComponentTypeDto dto)
        {
            try
            {
                if (dto == null || string.IsNullOrWhiteSpace(dto.ComponentName))
                {
                    return BadRequest(new { message = "Material / Component name is required." });
                }

                var comp = new ComponentType
                {
                    ComponentName = dto.ComponentName.Trim(),
                    HandlingType = string.IsNullOrWhiteSpace(dto.HandlingType) ? "Standard Processing" : dto.HandlingType.Trim(),
                    Description = dto.Description?.Trim() ?? $"{dto.ComponentName.Trim()} raw material recovered for processing",
                    IsHazardous = dto.IsHazardous,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ComponentTypes.Add(comp);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    comp.ComponentTypeId,
                    comp.ComponentName,
                    comp.HandlingType,
                    comp.Description,
                    comp.IsHazardous,
                    comp.CreatedAt
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating component type: " + ex.Message });
            }
        }

        private async Task SeedInitialComponentTypesIfEmptyAsync()
        {
            try
            {
                if (!await _context.ComponentTypes.AnyAsync())
                {
                    var defaults = new List<ComponentType>
                    {
                        new ComponentType
                        {
                            ComponentName = "Lithium-Ion Battery Cell",
                            HandlingType = "Thermal Neutralization & Dry Storage",
                            Description = "High energy density battery cell requiring thermal isolation and non-flammable dry storage.",
                            IsHazardous = true
                        },
                        new ComponentType
                        {
                            ComponentName = "Printed Circuit Board (PCB)",
                            HandlingType = "Hydrometallurgical Acid Stripping",
                            Description = "Contains lead solder joints, beryllium copper contacts, and precious gold pins.",
                            IsHazardous = true
                        },
                        new ComponentType
                        {
                            ComponentName = "CRT Leaded Glass Funnel",
                            HandlingType = "Vitrification & Lead Separation",
                            Description = "Heavy lead oxide glass funnel requiring closed furnace encapsulation.",
                            IsHazardous = true
                        },
                        new ComponentType
                        {
                            ComponentName = "Mercury CCFL Backlight Tube",
                            HandlingType = "Vapor Capture Decontamination",
                            Description = "Elemental mercury vapor in glass backlight tubes requiring vacuum extraction.",
                            IsHazardous = true
                        },
                        new ComponentType
                        {
                            ComponentName = "Processor Micro-Wafer & Chipset",
                            HandlingType = "Chemical Precious Metal Extraction",
                            Description = "Gold bonding wires with epoxy encapsulation and silicon substrate.",
                            IsHazardous = true
                        },
                        new ComponentType
                        {
                            ComponentName = "Insulated Copper Cabling Harness",
                            HandlingType = "Granulation & Electrostatic Separation",
                            Description = "PVC-sheathed copper wire harness with halogen plastic casing.",
                            IsHazardous = true
                        },
                        new ComponentType
                        {
                            ComponentName = "Aluminium Heatsink Assembly",
                            HandlingType = "Direct Foundry Alloy Smelting",
                            Description = "Clean thermal conduction metal ready for direct foundry re-smelting.",
                            IsHazardous = false
                        },
                        new ComponentType
                        {
                            ComponentName = "Structural Steel & Polymer Housing",
                            HandlingType = "Magnetic Shredding & Pelletization",
                            Description = "Recyclable structural steel shell and halogen-free housing plastic.",
                            IsHazardous = false
                        }
                    };

                    await _context.ComponentTypes.AddRangeAsync(defaults);
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error seeding ComponentTypes: " + ex.Message);
            }
        }
    }
}
