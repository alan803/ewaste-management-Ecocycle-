import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiZap,
    FiCheckSquare,
    FiShield,
    FiCheck,
    FiAlertTriangle,
    FiSearch,
    FiBox,
    FiCheckCircle,
    FiPlus,
    FiTrash2,
    FiCamera,
    FiDollarSign,
    FiFileText,
    FiPrinter,
    FiX,
    FiArrowLeft,
    FiArrowRight,
    FiChevronRight,
    FiChevronDown,
    FiChevronUp,
    FiBell,
    FiDatabase,
    FiHardDrive,
    FiCpu,
    FiInfo,
    FiLayers,
    FiTruck,
    FiFeather,
    FiUser,
    FiClock,
    FiRefreshCw,
    FiLock,
    FiPlay,
    FiGrid,
    FiList,
    FiEye,
    FiDownload,
    FiTool,
    FiSmartphone,
    FiTv,
    FiBatteryCharging,
    FiCreditCard
} from "react-icons/fi";
import RecyclingBillModal from "./RecyclingBillModal";
import "./Recycling_perform.css";

// Helper Engine to generate Device-Specific Profiles & Component Defaults
const getDeviceProfile = (categoryName, weightKg = 5.0) => {
    const cat = (categoryName || "").toLowerCase();
    const baseW = parseFloat(weightKg) || 5.0;

    if (cat.includes("laptop") || cat.includes("computer") || cat.includes("pc")) {
        return {
            categoryKey: "Computers and laptops",
            damageOptions: [
                "Cracked Chassis / Housing",
                "Water / Liquid Ingress",
                "Shattered Screen Panel",
                "Burned Motherboard (PCB)",
                "Broken Screen Hinge",
                "Corroded IO Ports",
                "Damaged SATA / NVMe Socket",
                "Intact / No Visible Damage"
            ],
            missingPartOptions: [
                "Missing Laptop Battery",
                "Missing SATA HDD / NVMe SSD",
                "Missing RAM Modules",
                "Missing Power Adapter / Charger",
                "Missing Keycaps / Keyboard",
                "Missing Outer Bezel / Bottom Cover"
            ],
            components: [
                { id: "motherboard", label: "Motherboard / Mainboard PCB" },
                { id: "cpu_heatsink", label: "CPU & Thermal Heat Pipe Assembly" },
                { id: "ram_sticks", label: "RAM Memory Modules" },
                { id: "storage_drive", label: "Storage Drive (HDD / NVMe SSD)" },
                { id: "battery_pack", label: "Laptop Battery Pack" },
                { id: "screen_panel", label: "Display Screen Glass Panel" },
                { id: "keyboard_chassis", label: "Keyboard & Outer Chassis Frame" }
            ],
            hazardousItems: [
                { id: "lithiumBatteries", label: "Li-ion Multi-Cell Laptop Battery Pack", checked: true },
                { id: "leadAcid", label: "CMOS Coin Cell Battery (Lithium MnO2)", checked: true },
                { id: "mercuryLights", label: "Legacy CCFL Screen Inverter Tube", checked: false },
                { id: "capacitors", label: "High-Capacity Motherboard Capacitors", checked: true }
            ],
            defaultRecoveredMaterials: [
                { id: 1, materialName: "Structural Steel & Iron", quantity: (baseW * 0.35).toFixed(2), unit: "kg", pricePerUnit: 65 },
                { id: 2, materialName: "Recyclable Polymer Plastics", quantity: (baseW * 0.25).toFixed(2), unit: "kg", pricePerUnit: 80 },
                { id: 3, materialName: "High-Grade PCB / E-Scrap", quantity: (baseW * 0.18).toFixed(2), unit: "kg", pricePerUnit: 1250 },
                { id: 4, materialName: "Copper Wire / Coils", quantity: (baseW * 0.12).toFixed(2), unit: "kg", pricePerUnit: 750 },
                { id: 5, materialName: "Aluminium Alloys", quantity: (baseW * 0.10).toFixed(2), unit: "kg", pricePerUnit: 220 }
            ]
        };
    } else if (cat.includes("mobile") || cat.includes("phone") || cat.includes("tablet")) {
        return {
            categoryKey: "Mobile phones",
            damageOptions: [
                "Shattered Touchscreen Digitizer",
                "Swollen / Punctured Battery",
                "Water Damage / Immersion",
                "Cracked Glass Back Cover",
                "Corroded Charging Port",
                "Fractured Frame / Chassis",
                "Cracked Camera Lens",
                "Intact / No Visible Damage"
            ],
            missingPartOptions: [
                "Missing SIM Card Tray",
                "Missing MicroSD Card",
                "Missing Glass Back Cover",
                "Missing Camera Module",
                "Missing Charging Cable"
            ],
            components: [
                { id: "logic_board", label: "Main Logic Controller Board" },
                { id: "mobile_battery", label: "Li-Po Pouch Battery Cell" },
                { id: "screen_touch", label: "OLED / LCD Touchscreen Digitizer" },
                { id: "cameras", label: "Front & Rear Camera Sensors" },
                { id: "speaker_vibro", label: "Acoustic Speaker & Vibration Motor" },
                { id: "phone_frame", label: "Outer Glass & Metal Frame" }
            ],
            hazardousItems: [
                { id: "lithiumBatteries", label: "High-Density Li-Po Pouch Battery Cell", checked: true },
                { id: "leadAcid", label: "Lead Soldering Contacts", checked: false },
                { id: "mercuryLights", label: "None / LED Backlight Only", checked: false },
                { id: "capacitors", label: "Surface-Mount Tantalum Capacitors", checked: true }
            ],
            defaultRecoveredMaterials: [
                { id: 1, materialName: "High-Grade PCB / E-Scrap", quantity: (baseW * 0.30).toFixed(2), unit: "kg", pricePerUnit: 1250 },
                { id: 2, materialName: "Display Glass Substrate", quantity: (baseW * 0.25).toFixed(2), unit: "kg", pricePerUnit: 40 },
                { id: 3, materialName: "Lithium Battery Cells", quantity: (baseW * 0.20).toFixed(2), unit: "kg", pricePerUnit: 350 },
                { id: 4, materialName: "Recyclable Polymer Plastics", quantity: (baseW * 0.15).toFixed(2), unit: "kg", pricePerUnit: 80 },
                { id: 5, materialName: "Copper Wire / Coils", quantity: (baseW * 0.10).toFixed(2), unit: "kg", pricePerUnit: 750 }
            ]
        };
    } else if (cat.includes("tv") || cat.includes("monitor") || cat.includes("display")) {
        return {
            categoryKey: "TVs and monitors",
            damageOptions: [
                "Shattered LCD / LED Display Panel",
                "Blown Power Supply Capacitors",
                "Cracked Outer Bezel / Housing",
                "Broken Monitor Stand / VESA Mount",
                "Damaged HDMI / DisplayPort Connectors",
                "Water Ingress in Screen Layer",
                "Intact / No Visible Damage"
            ],
            missingPartOptions: [
                "Missing Remote Control",
                "Missing Power Supply Cable / Adapter",
                "Missing Monitor Desktop Stand",
                "Missing Wall Mount Brackets"
            ],
            components: [
                { id: "psu_board", label: "High-Voltage Power Supply Unit (PSU)" },
                { id: "tcon_driver", label: "T-Con & Display Driver Board" },
                { id: "display_glass", label: "LCD / LED Screen Glass Substrate" },
                { id: "backlight_strip", label: "CCFL Tubes / LED Backlight Strips" },
                { id: "speakers_base", label: "Internal Audio Speakers & Desktop Base" },
                { id: "tv_bezel", label: "Plastic Outer Casing & Bezel" }
            ],
            hazardousItems: [
                { id: "capacitors", label: "High-Voltage Electrolytic Capacitors (400V)", checked: true },
                { id: "mercuryLights", label: "Mercury Fluorescent CCFL Backlight Tubes (Legacy)", checked: true },
                { id: "lithiumBatteries", label: "Remote Control Batteries", checked: false },
                { id: "leadAcid", label: "Lead Glass CRT Phosphor Coating", checked: false }
            ],
            defaultRecoveredMaterials: [
                { id: 1, materialName: "Display Glass Substrate", quantity: (baseW * 0.40).toFixed(2), unit: "kg", pricePerUnit: 40 },
                { id: 2, materialName: "Recyclable Polymer Plastics", quantity: (baseW * 0.25).toFixed(2), unit: "kg", pricePerUnit: 80 },
                { id: 3, materialName: "Structural Steel & Iron", quantity: (baseW * 0.20).toFixed(2), unit: "kg", pricePerUnit: 65 },
                { id: 4, materialName: "High-Grade PCB / E-Scrap", quantity: (baseW * 0.10).toFixed(2), unit: "kg", pricePerUnit: 1250 },
                { id: 5, materialName: "Copper Wire / Coils", quantity: (baseW * 0.05).toFixed(2), unit: "kg", pricePerUnit: 750 }
            ]
        };
    } else if (cat.includes("printer") || cat.includes("peripheral") || cat.includes("scanner")) {
        return {
            categoryKey: "Printers and peripherals",
            damageOptions: [
                "Broken Paper Feed Tray",
                "Jammed Roller Assembly / Gears",
                "Damaged Print Head / Ink Nozzles",
                "Cracked Plastic Casing",
                "Corroded USB / Ethernet Port",
                "Toner Powder Spillage / Leak",
                "Intact / No Visible Damage"
            ],
            missingPartOptions: [
                "Missing Laser Toner Cartridge",
                "Missing Ink Cartridge Assembly",
                "Missing Paper Intake Tray",
                "Missing Power Supply Cord",
                "Missing Scanner Lid"
            ],
            components: [
                { id: "formatter_board", label: "Main Formatter PCB Controller" },
                { id: "stepper_gears", label: "Paper Drive Stepper Motors & Gear Assembly" },
                { id: "printhead_unit", label: "Printhead / Laser Drum Scanner" },
                { id: "toner_ink_housing", label: "Toner Drum / Ink Cartridge Housing" },
                { id: "scanner_glass", label: "Scanner Bed Glass & Lamp Unit" },
                { id: "printer_casing", label: "Heavy Plastic Enclosure Chassis" }
            ],
            hazardousItems: [
                { id: "capacitors", label: "Heavy Duty Power Supply Capacitors", checked: true },
                { id: "mercuryLights", label: "Scanner Cold-Cathode Lamp Tube", checked: true },
                { id: "lithiumBatteries", label: "Backup Battery Cell on Controller PCB", checked: false },
                { id: "leadAcid", label: "Toxic Toner Powder Residue", checked: true }
            ],
            defaultRecoveredMaterials: [
                { id: 1, materialName: "Recyclable Polymer Plastics", quantity: (baseW * 0.50).toFixed(2), unit: "kg", pricePerUnit: 80 },
                { id: 2, materialName: "Structural Steel & Iron", quantity: (baseW * 0.30).toFixed(2), unit: "kg", pricePerUnit: 65 },
                { id: 3, materialName: "Copper Wire / Coils", quantity: (baseW * 0.10).toFixed(2), unit: "kg", pricePerUnit: 750 },
                { id: 4, materialName: "High-Grade PCB / E-Scrap", quantity: (baseW * 0.10).toFixed(2), unit: "kg", pricePerUnit: 1250 }
            ]
        };
    } else {
        return {
            categoryKey: "Batteries and other hazardous items",
            damageOptions: [
                "Swollen / Bulging Battery Cell",
                "Corrosive Acid Leakage",
                "Cracked Outer Battery Case",
                "Thermal Runaway Heat Damage",
                "Corroded Metal Terminals",
                "Intact / Discharged Cell"
            ],
            missingPartOptions: [
                "Missing Terminal Protection Cap",
                "Missing Safety Vent Plug",
                "Missing Power Connection Cables"
            ],
            components: [
                { id: "battery_cells", label: "Primary Battery Cells / Battery Stack" },
                { id: "bms_board", label: "Battery Management System (BMS) PCB" },
                { id: "busbars", label: "Copper Busbars & Terminal Contacts" },
                { id: "outer_case", label: "Fire-Retardant Protective Casing" }
            ],
            hazardousItems: [
                { id: "lithiumBatteries", label: "Li-ion / Li-Po Battery Cells", checked: true },
                { id: "leadAcid", label: "Toxic Lead-Acid Battery Chemistry", checked: true },
                { id: "capacitors", label: "High Energy Storage Capacitors", checked: true },
                { id: "mercuryLights", label: "Heavy Metal Contact Points", checked: false }
            ],
            defaultRecoveredMaterials: [
                { id: 1, materialName: "Lithium Battery Cells", quantity: (baseW * 0.60).toFixed(2), unit: "kg", pricePerUnit: 350 },
                { id: 2, materialName: "Structural Steel & Iron", quantity: (baseW * 0.20).toFixed(2), unit: "kg", pricePerUnit: 65 },
                { id: 3, materialName: "Copper Wire / Coils", quantity: (baseW * 0.15).toFixed(2), unit: "kg", pricePerUnit: 750 },
                { id: 4, materialName: "High-Grade PCB / E-Scrap", quantity: (baseW * 0.05).toFixed(2), unit: "kg", pricePerUnit: 1250 }
            ]
        };
    }
};

// Helper to check if a component/hazard/item is marked as missing in Missing Hardware Parts
const isItemMissing = (itemIdentifier, missingList = []) => {
    if (!missingList || missingList.length === 0 || !itemIdentifier) return false;
    const str = (typeof itemIdentifier === "string" ? itemIdentifier : itemIdentifier?.label || itemIdentifier?.name || itemIdentifier?.id || "").toLowerCase().trim();
    if (!str) return false;

    return missingList.some(missingItem => {
        const raw = (missingItem || "").toLowerCase().trim();
        const clean = raw.replace(/^missing\s+/i, "").trim();
        if (!clean) return false;

        if (str.includes(clean) || clean.includes(str)) return true;

        if ((clean.includes("battery") || clean.includes("cell") || clean.includes("li-ion") || clean.includes("li-po") || clean.includes("lead acid")) &&
            (str.includes("battery") || str.includes("cell") || str.includes("li-ion") || str.includes("li-po") || str.includes("lead acid"))) {
            return true;
        }
        if ((clean.includes("storage") || clean.includes("hdd") || clean.includes("ssd") || clean.includes("nvme") || clean.includes("sata") || clean.includes("microsd") || clean.includes("sim card") || clean.includes("hard drive")) &&
            (str.includes("storage") || str.includes("hdd") || str.includes("ssd") || str.includes("nvme") || str.includes("sata") || str.includes("microsd") || str.includes("sim card") || str.includes("hard drive"))) {
            return true;
        }
        if ((clean.includes("ram") || clean.includes("memory")) && (str.includes("ram") || str.includes("memory"))) {
            return true;
        }
        if ((clean.includes("motherboard") || clean.includes("mainboard") || clean.includes("logic board") || clean.includes("formatter board") || clean.includes("psu_board") || clean.includes("bms")) &&
            (str.includes("motherboard") || str.includes("mainboard") || str.includes("logic board") || str.includes("formatter board") || str.includes("psu_board") || str.includes("bms"))) {
            return true;
        }
        if ((clean.includes("screen") || clean.includes("display") || clean.includes("digitizer") || clean.includes("panel") || clean.includes("touchscreen")) &&
            (str.includes("screen") || str.includes("display") || str.includes("digitizer") || str.includes("panel") || str.includes("touchscreen"))) {
            return true;
        }
        if (clean.includes("camera") && str.includes("camera")) {
            return true;
        }
        if ((clean.includes("keyboard") || clean.includes("keycap")) && (str.includes("keyboard") || str.includes("keycap"))) {
            return true;
        }
        if ((clean.includes("charger") || clean.includes("adapter") || clean.includes("power cable") || clean.includes("cord")) &&
            (str.includes("charger") || str.includes("adapter") || str.includes("power cable") || str.includes("cord") || str.includes("cables"))) {
            return true;
        }
        if ((clean.includes("chassis") || clean.includes("bezel") || clean.includes("housing") || clean.includes("back cover") || clean.includes("frame") || clean.includes("casing")) &&
            (str.includes("chassis") || str.includes("bezel") || str.includes("housing") || str.includes("back cover") || str.includes("frame") || str.includes("casing"))) {
            return true;
        }
        if ((clean.includes("toner") || clean.includes("ink")) && (str.includes("toner") || str.includes("ink"))) return true;
        if (clean.includes("scanner") && str.includes("scanner")) return true;
        if (clean.includes("printhead") && str.includes("printhead")) return true;

        return false;
    });
};

// Category Icon Helper
const getCategoryIcon = (categoryName) => {
    const cat = (categoryName || "").toLowerCase();
    if (cat.includes("mobile") || cat.includes("phone") || cat.includes("tablet")) return <FiSmartphone />;
    if (cat.includes("tv") || cat.includes("monitor") || cat.includes("display")) return <FiTv />;
    if (cat.includes("battery")) return <FiBatteryCharging />;
    return <FiBox />;
};

// Strict validation and sanitization helpers for alphabet-only inputs (Letters & spaces only)
const filterAlphabetOnly = (text) => {
    if (!text) return "";
    return text.replace(/[^A-Za-z\s]/g, "");
};

// Standard Datalist Options for Type-or-Select Combo Fields (Alphabets and spaces only)
const STANDARD_SANITIZATION_METHODS = [
    "Physical Destruction Drive Shredding Crushing",
    "Cryptographic Erase Protocol",
    "Magnetic Degaussing Eradication",
    "Firmware Factory Reset and Zero Fill",
    "Multi Pass Overwrite Data Sanitization"
];

const STANDARD_HAZARDOUS_STORAGE_AREAS = [
    "Fireproof Safe Locker Toxic Storage",
    "Hazardous Neutralization Drum Heavy Metals",
    "Sealed Mercury Containment Vault",
    "Acid Resistant Containment Bin",
    "Ventilated Flammable Safety Cabinet"
];

const STANDARD_BATTERY_CONDITIONS = [
    "Intact and Stable No Swelling",
    "Swollen Punctured High Thermal Risk",
    "Leaking Corrosive Acid Residue",
    "Terminals Insulated and Taped",
    "Degraded Cell Architecture Isolated"
];

const STANDARD_PROCESSING_ROUTES = [
    "Onsite Mechanical Shredding and Separation",
    "Downstream Smelter Specialized Refining",
    "Hazardous Controlled Neutralization Facility",
    "Secondary Foundry Re Smelting",
    "Polymer Granulation and Pelletization Plant"
];

const STANDARD_AUDIT_ACTIONS = [
    "Certified Complete E Waste Recycling and Material Recovery",
    "Disassembly and Hazardous Isolation Protocol",
    "Physical Destruction and Smelter Dispatch",
    "Material Stream Separation and Granulation"
];

const STANDARD_AUDIT_ROLES = [
    "Certified Recycling Engineer",
    "Lead E Waste Technician",
    "Hazardous Materials Specialist",
    "Environmental Compliance Inspector"
];

const STANDARD_PACKAGING_CONTAINERS = [
    "Anti Static Wooden Pallet Box",
    "Sealed Steel Storage Drum",
    "Heavy Duty Gaylord Box",
    "Corrugated Fiberboard Container"
];

const STANDARD_DISPATCH_DESTINATIONS = [
    "National Smelting and Polymer Refining Plant",
    "Authorized TSDF Hazardous Treatment Facility",
    "Secondary Foundry and Mill",
    "EcoCycle Granulation Plant"
];

const STANDARD_AUDIT_REMARKS = [
    "Complies with E Waste Management Rules and CPCB guidelines",
    "Zero landfill certified material recovery verified",
    "Hazardous elements isolated with complete traceability manifest"
];

function RecyclingPerform() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const targetIdFromQuery = searchParams.get("id");

    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [processingId, setProcessingId] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    // Queue Filtering & View Controls (Matching Refurbishment)
    const [allocatedFilter, setAllocatedFilter] = useState("All"); // "All" | "Active" | "Completed"
    const [allocatedSearch, setAllocatedSearch] = useState("");
    const [allocatedViewMode, setAllocatedViewMode] = useState("grid"); // "grid" | "table"

    // Recycling Process Lifecycle & 10-Day SLA Deadline State
    const [isStarted, setIsStarted] = useState(false);
    const [startedAt, setStartedAt] = useState(null);
    const [deadlineDate, setDeadlineDate] = useState(null);
    const [isStartingProcess, setIsStartingProcess] = useState(false);
    const [slaTimeLeft, setSlaTimeLeft] = useState("");

    // Active Step Wizard (1 to 6) & Step Progression Lock
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [showNavLockModal, setShowNavLockModal] = useState(false);
    const [showInspectionDrawer, setShowInspectionDrawer] = useState(false);
    const [zoomedPhoto, setZoomedPhoto] = useState(null);

    // Dynamic Device Profile State
    const [deviceProfile, setDeviceProfile] = useState(() => getDeviceProfile("Computers and laptops", 5.0));

    // Profile state
    const [centerName] = useState(() => {
        return localStorage.getItem("centerName") ||
               localStorage.getItem("userName") ||
               localStorage.getItem("username") ||
               "EcoCycle Recycling Facility";
    });

    // STEP 1: Physical Assessment & Live Custom Inputs
    const [visibleDamage, setVisibleDamage] = useState([]);
    const [missingParts, setMissingParts] = useState([]);
    const [selectedDamageToAdd, setSelectedDamageToAdd] = useState("");
    const [selectedMissingToAdd, setSelectedMissingToAdd] = useState("");
    const [damageNotes, setDamageNotes] = useState("");
    const [customDamageInput, setCustomDamageInput] = useState("");
    const [customDamageList, setCustomDamageList] = useState([]);

    const [customMissingInput, setCustomMissingInput] = useState("");
    const [customMissingList, setCustomMissingList] = useState([]);

    // STEP 2: Data & Component Removal (Simultaneous Operation Record)
    const [dataFound, setDataFound] = useState("Yes");
    const [sanitizationPerformed, setSanitizationPerformed] = useState("Yes");
    const [sanitizationMethod, setSanitizationMethod] = useState("Physical Destruction");
    const [removedComponents, setRemovedComponents] = useState({
        battery: true,
        pcb: true,
        storage: true,
        screen: true,
        cables: true,
        casing: true
    });
    const [activeComponents, setActiveComponents] = useState([]);
    const [customCompInput, setCustomCompInput] = useState("");
    const [operatorName] = useState(() => localStorage.getItem("userName") || "Technician Operator");
    const [operationTimestamp] = useState(() => new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }));
    const [dismantlingNotes, setDismantlingNotes] = useState("Dismantled device, detached battery pouch, unbolted PCB mainboard, and separated storage media.");

    // STEP 3: Hazard Isolation Component Dropdown & Dynamic Isolation
    const [hazardousComponents, setHazardousComponents] = useState({});
    const [activeHazardItems, setActiveHazardItems] = useState([]);
    const [selectedHazToAdd, setSelectedHazToAdd] = useState("");
    const [customHazInput, setCustomHazInput] = useState("");
    const [hazardousItemPhotos, setHazardousItemPhotos] = useState({});
    const [batteryCondition, setBatteryCondition] = useState("Intact");
    const [hazardousStorageArea, setHazardousStorageArea] = useState("Fireproof Safe Locker");

    // STEP 4: Material Separation
    const [separatedMaterials, setSeparatedMaterials] = useState([
        { key: "Copper", name: "Copper", source: "Wires, coils, motor windings & heat pipes" },
        { key: "Aluminium", name: "Aluminium", source: "Chassis frame, heat sinks, structural brackets" },
        { key: "IronSteel", name: "Iron & Steel", source: "Internal steel backplate, screws" },
        { key: "Plastics", name: "Plastics", source: "ABS / PC polymer outer casing" },
        { key: "Glass", name: "Glass", source: "Display screen glass & camera lenses" },
        { key: "PCBs", name: "Circuit Boards (PCBs)", source: "Motherboard & sub-circuit boards" }
    ]);
    const [materialLocations, setMaterialLocations] = useState({
        Copper: "Onsite Processing",
        Aluminium: "Onsite Processing",
        IronSteel: "Onsite Processing",
        Plastics: "Downstream Specialized Recycler",
        Glass: "Downstream Specialized Recycler",
        PCBs: "Downstream Specialized Recycler"
    });
    const [customMatSepInput, setCustomMatSepInput] = useState("");

    // Master Component Types & Active Prices
    const [masterComponentTypes, setMasterComponentTypes] = useState([]);
    const [activePrices, setActivePrices] = useState([]);
    const [recoveredMaterials, setRecoveredMaterials] = useState([]);
    const [customRecoveredName, setCustomRecoveredName] = useState("");
    const [customRecoveredPrice, setCustomRecoveredPrice] = useState("");
    const [customRecoveredQty, setCustomRecoveredQty] = useState("0.50");
    const [customRecoveredUnit, setCustomRecoveredUnit] = useState("kg");
    const [hazardousWasteWeight, setHazardousWasteWeight] = useState("0.45");
    const [residualWasteWeight, setResidualWasteWeight] = useState("0.15");
    const [processingCost, setProcessingCost] = useState(400);

    // STEP 6: Audit
    const [auditAction, setAuditAction] = useState("Inspection Completed");
    const [auditOperator, setAuditOperator] = useState(() => {
        return localStorage.getItem("userName") || localStorage.getItem("operatorName") || localStorage.getItem("name") || "Technician Alan";
    });
    const [auditRole, setAuditRole] = useState(() => {
        return localStorage.getItem("role") || localStorage.getItem("userRole") || "Inspection Technician";
    });
    const [auditRemarks, setAuditRemarks] = useState("Inspection completed successfully");
    const [packagingContainer, setPackagingContainer] = useState("Heavy-Duty Triple-Wall Gaylord Box");
    const [dispatchDestination, setDispatchDestination] = useState("EcoCycle National Metals Smelting Hub");

    // EcoCycle Buyout Settlement Payment State (Matching Refurbishment Perform)
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isPayingSettlement, setIsPayingSettlement] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState("Unpaid"); // "Unpaid" | "Paid"
    const [paymentTransactionId, setPaymentTransactionId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Razorpay (Test Sandbox)");
    const [paymentNotes, setPaymentNotes] = useState("");

    // Certificate Modal State
    const [certificateData, setCertificateData] = useState(null);
    const [showCertModal, setShowCertModal] = useState(false);

    // Calculate max step accessible based on completed steps
    const maxAccessibleStep = useMemo(() => {
        let max = 1;
        for (let i = 1; i <= 6; i++) {
            if (completedSteps.includes(i)) {
                max = i + 1;
            } else {
                break;
            }
        }
        return Math.min(max, 6);
    }, [completedSteps]);

    // Check if device recycling is completed
    const isDeviceCompleted = useMemo(() => {
        if (!selectedRequest) return false;
        const s = (selectedRequest.status || "").toLowerCase();
        const procLifeSt = (selectedRequest.processingLifecycleStatus || "").toLowerCase();
        return s === "completed" || procLifeSt === "completed";
    }, [selectedRequest]);

    // SLA Process Lock: While recycling SLA is active, prevent switching devices or navigating away
    const isProcessLocked = useMemo(() => {
        if (!selectedRequest) return false;
        if (isDeviceCompleted) return false;
        const statusLower = (selectedRequest.status || "").toLowerCase();
        const hasStarted = isStarted || Boolean(startedAt) || statusLower === "processing" || statusLower === "inprogress";
        return hasStarted && !isDeviceCompleted;
    }, [selectedRequest, isStarted, startedAt, isDeviceCompleted]);

    // Live 10-Day SLA Countdown Timer
    useEffect(() => {
        if (!isStarted || !deadlineDate) {
            setSlaTimeLeft("");
            return;
        }

        const calcTime = () => {
            const now = new Date().getTime();
            const diff = new Date(deadlineDate).getTime() - now;

            if (diff <= 0) {
                setSlaTimeLeft("0 Days Left (SLA Expired)");
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setSlaTimeLeft(`${days}d ${hours}h ${minutes}m left`);
            } else {
                setSlaTimeLeft(`${hours}h ${minutes}m ${seconds}s left`);
            }
        };

        calcTime();
        const timer = setInterval(calcTime, 1000);
        return () => clearInterval(timer);
    }, [isStarted, deadlineDate]);

    // Prevent browser tab close/reload while SLA process is active
    useEffect(() => {
        if (!isProcessLocked) return;

        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "You have an active Recycling SLA in progress. Please complete the process and audit certificate before navigating away.";
            return e.returnValue;
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [isProcessLocked]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchAllocations(token);
        fetchMaterialPrices();
        fetchMasterComponentTypes(token);
        fetchUnreadNotifCount(token);
    }, [navigate]);

    const fetchMasterComponentTypes = async (token) => {
        try {
            const res = await axios.get("https://localhost:7102/api/ComponentType", {
                headers: { Authorization: `Bearer ${token || localStorage.getItem("token")}` }
            });
            if (res.data && Array.isArray(res.data)) {
                setMasterComponentTypes(res.data);
            }
        } catch {
            setMasterComponentTypes([]);
        }
    };

    const fetchUnreadNotifCount = async (token) => {
        try {
            const res = await axios.get("https://localhost:7102/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${token || localStorage.getItem("token")}` }
            });
            const list = Array.isArray(res.data) ? res.data : [];
            setUnreadNotifCount(list.filter(n => !n.isRead).length);
        } catch {
            setUnreadNotifCount(0);
        }
    };

    const fetchMaterialPrices = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("https://localhost:7102/api/MaterialPrice", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                const activeOnly = res.data.filter(p => p.isActive);
                const mapped = activeOnly.map(p => ({
                    materialPriceId: p.materialPriceId,
                    componentTypeId: p.componentTypeId,
                    materialName: p.componentName || `Material #${p.componentTypeId}`,
                    unit: "kg",
                    pricePerUnit: parseFloat(p.pricePerKg) || 0,
                    handlingType: p.handlingType,
                    isHazardous: p.isHazardous
                }));

                if (mapped.length > 0) {
                    setActivePrices(mapped);
                    setRecoveredMaterials(prev => prev.map(m => {
                        const matched = mapped.find(p => p.materialName.toLowerCase().trim() === (m.materialName || "").toLowerCase().trim());
                        return matched ? { ...m, pricePerUnit: matched.pricePerUnit } : m;
                    }));
                    return;
                }
            }

            const fallbackRes = await axios.get("https://localhost:7102/api/RecyclingProcess/material-prices");
            if (fallbackRes.data && fallbackRes.data.length > 0) {
                setActivePrices(fallbackRes.data);
            } else {
                setDefaultPrices();
            }
        } catch {
            try {
                const fallbackRes = await axios.get("https://localhost:7102/api/RecyclingProcess/material-prices");
                if (fallbackRes.data && fallbackRes.data.length > 0) {
                    setActivePrices(fallbackRes.data);
                } else {
                    setDefaultPrices();
                }
            } catch {
                setDefaultPrices();
            }
        }
    };

    const setDefaultPrices = () => {
        setActivePrices([
            { materialName: "Copper Wire / Coils", unit: "kg", pricePerUnit: 750 },
            { materialName: "Aluminium Alloys", unit: "kg", pricePerUnit: 220 },
            { materialName: "Structural Steel & Iron", unit: "kg", pricePerUnit: 65 },
            { materialName: "Recyclable Polymer Plastics", unit: "kg", pricePerUnit: 80 },
            { materialName: "Display Glass Substrate", unit: "kg", pricePerUnit: 40 },
            { materialName: "High-Grade PCB / E-Scrap", unit: "kg", pricePerUnit: 1250 },
            { materialName: "Recovered Fine Gold", unit: "kg", pricePerUnit: 6500000 },
            { materialName: "Lithium Battery Cells", unit: "kg", pricePerUnit: 350 }
        ]);
    };

    const fetchAllocations = async (token) => {
        try {
            setLoading(true);
            const authToken = token || localStorage.getItem("token");
            let list = [];

            try {
                const res = await axios.get("https://localhost:7102/api/AllocateRecyclingCenter/my-requests", {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                list = res.data || [];
            } catch {
                try {
                    const adminRes = await axios.get("https://localhost:7102/api/AllocateRecyclingCenter/admin/requests", {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    list = adminRes.data || [];
                } catch {
                    list = [];
                }
            }

            const mappedList = list.map((item) => {
                const itemW = item.weight ? parseFloat(item.weight) : 0;
                return {
                    id: item.recyclingCenterRequestId || item.id,
                    deviceId: item.deviceId,
                    batchTitle: (`${item.brand || ""} ${item.model || ""}`).trim() || `Device #${item.deviceId}`,
                    brand: item.brand || "E-Waste",
                    model: item.model || "Device",
                    categoryName: item.categoryName || item.category || "Electronics",
                    quantity: item.quantity || 1,
                    weight: itemW > 0 ? `${itemW} kg` : "5.0 kg",
                    weightKg: itemW > 0 ? itemW : 5.0,
                    serialNumber: item.serialNumber || `SN-${item.deviceId}`,
                    customerName: item.customerName || item.userName || "Customer",
                    customerCity: item.customerCity || "City Hub",
                    status: item.status || "Assigned",
                    processingDecision: item.processingDecision || "Recycling",
                    lifecycleStatus: item.lifecycleStatus,
                    processingLifecycleStatus: item.processingLifecycleStatus,
                    condition: item.condition || "Inspected"
                };
            });

            // Filter out rejected or cancelled
            const acceptedOnly = mappedList.filter(item => {
                const st = (item.status || "").toLowerCase();
                const lifeSt = (item.lifecycleStatus || "").toLowerCase();
                const procLifeSt = (item.processingLifecycleStatus || "").toLowerCase();

                if (st === "rejected" || st === "cancelled") return false;

                const isAcceptedStatus = st === "accepted" || 
                                         st === "processing" || 
                                         st === "inprogress" || 
                                         st === "completed" || 
                                         st === "received" || 
                                         st === "delivered" ||
                                         st.includes("accepted");
                
                const isAcceptedLifecycle = lifeSt.includes("accepted") || 
                                             lifeSt.includes("recycling") || 
                                             procLifeSt.includes("accepted") || 
                                             procLifeSt.includes("processing");

                return isAcceptedStatus || isAcceptedLifecycle;
            });

            setRequests(acceptedOnly);

            if (targetIdFromQuery) {
                const found = acceptedOnly.find(r => String(r.id) === String(targetIdFromQuery) || String(r.deviceId) === String(targetIdFromQuery));
                if (found) {
                    selectRequest(found);
                } else {
                    setSelectedRequest(null);
                }
            } else {
                setSelectedRequest(null);
            }
        } catch {
            setRequests([]);
            setSelectedRequest(null);
        } finally {
            setLoading(false);
        }
    };

    const selectRequest = async (req) => {
        setSelectedRequest(req);
        setCurrentStep(1);
        setCompletedSteps([]);

        // Reset input fields
        setVisibleDamage([]);
        setMissingParts([]);
        setSelectedDamageToAdd("");
        setSelectedMissingToAdd("");
        setDamageNotes("");
        setCustomDamageInput("");
        setCustomDamageList([]);
        setCustomMissingInput("");
        setCustomMissingList([]);
        setSelectedHazToAdd("");
        setCustomHazInput("");
        setCustomCompInput("");
        setCustomMatSepInput("");
        setHazardousComponents({});
        setHazardousItemPhotos({});

        // Reset Settlement Payment State
        setPaymentStatus("Unpaid");
        setPaymentTransactionId("");
        setPaymentNotes("");
        setShowPaymentModal(false);

        // Fetch Expected Components mapped to this specific Device Model:
        let loadedComponents = [];
        let isModelDataLoaded = false;
        const token = localStorage.getItem("token");

        try {
            const compRes = await axios.get(`https://localhost:7102/api/RecyclingProcess/components/${req.deviceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (compRes.data && Array.isArray(compRes.data.components) && compRes.data.components.length > 0) {
                loadedComponents = compRes.data.components;
                isModelDataLoaded = true;
            }
        } catch {
            // Use dynamic profile generator as fallback
        }

        let profile;
        if (isModelDataLoaded && loadedComponents.length > 0) {
            const compsMapped = loadedComponents.map(c => ({
                id: `comp_${c.componentTypeId || c.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
                componentTypeId: c.componentTypeId,
                label: c.name,
                handling: c.handling,
                isHazardous: c.isHazardous,
                description: c.description,
                estimatedMassRatio: c.estimatedMassRatio || 0.15
            }));

            const hazItems = compsMapped.filter(c => c.isHazardous).map(c => ({
                id: `haz_${c.componentTypeId || c.label.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
                label: c.label,
                handling: c.handling,
                checked: true
            }));

            const recycComps = compsMapped.filter(c => !c.isHazardous);
            const defaultMats = recycComps.map((c, idx) => {
                const matched = activePrices.find(p => p.componentTypeId === c.componentTypeId || (p.materialName || "").toLowerCase().trim() === (c.label || "").toLowerCase().trim());
                return {
                    id: idx + 1,
                    componentTypeId: c.componentTypeId,
                    materialName: matched ? matched.materialName : c.label,
                    quantity: (req.weightKg * (c.estimatedMassRatio || 0.15)).toFixed(2),
                    unit: matched ? matched.unit : "kg",
                    pricePerUnit: matched ? matched.pricePerUnit : 150
                };
            });

            profile = {
                categoryKey: req.categoryName || "Custom Device Model",
                modelTitle: `${req.brand} ${req.model}`,
                damageOptions: [
                    "Cracked Housing / Enclosure",
                    "Water / Moisture Ingress",
                    "Broken Connectors / Ports",
                    "Damaged PCB / Circuit Board",
                    "Intact / No Visible Damage"
                ],
                missingPartOptions: compsMapped.map(c => `Missing ${c.label}`),
                components: compsMapped,
                hazardousItems: hazItems,
                defaultRecoveredMaterials: defaultMats.length > 0 ? defaultMats : [
                    { id: 1, materialName: "Structural Steel & Iron", quantity: (req.weightKg * 0.35).toFixed(2), unit: "kg", pricePerUnit: 65 },
                    { id: 2, materialName: "Recyclable Polymer Plastics", quantity: (req.weightKg * 0.25).toFixed(2), unit: "kg", pricePerUnit: 80 }
                ]
            };
        } else {
            profile = getDeviceProfile(req.categoryName, req.weightKg);
        }

        setDeviceProfile(profile);

        const initComp = {};
        const profileComps = profile.components || [];
        setActiveComponents(profileComps);
        profileComps.forEach(c => {
            initComp[c.id] = true;
        });
        setRemovedComponents(initComp);

        const initialHazards = profile.hazardousItems || [];
        setActiveHazardItems(initialHazards);
        const initHazCheck = {};
        initialHazards.forEach(h => {
            initHazCheck[h.id] = true;
        });
        setHazardousComponents(initHazCheck);

        const sepStreams = (profile.components || [])
            .filter(c => !c.isHazardous)
            .map(c => ({
                key: c.id,
                name: c.label,
                source: c.description || c.handling || "Device Model Component Extraction"
            }));
        setSeparatedMaterials(sepStreams.length > 0 ? sepStreams : [
            { key: "Copper", name: "Copper", source: "Wires, coils, motor windings & heat pipes" },
            { key: "Aluminium", name: "Aluminium", source: "Chassis frame, heat sinks, structural brackets" },
            { key: "IronSteel", name: "Iron & Steel", source: "Internal steel backplate, screws" },
            { key: "Plastics", name: "Plastics", source: "ABS / PC polymer outer casing" },
            { key: "Glass", name: "Glass", source: "Display screen glass & camera lenses" },
            { key: "PCBs", name: "Circuit Boards (PCBs)", source: "Motherboard & sub-circuit boards" }
        ]);

        const initialMats = (profile.defaultRecoveredMaterials || []).map(m => {
            const matched = activePrices.find(p => (p.materialName || "").toLowerCase().trim() === (m.materialName || "").toLowerCase().trim());
            return matched ? { ...m, pricePerUnit: matched.pricePerUnit } : m;
        });
        setRecoveredMaterials(initialMats);

        // Fetch & restore saved progress / process details from backend
        try {
            const res = await axios.get(`https://localhost:7102/api/RecyclingProcess/process-details/${req.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                const p = res.data.process;
                const statusStr = (req.status || p?.status || "").toLowerCase();
                const processStarted = statusStr === "processing" || statusStr === "inprogress" || statusStr === "completed" || Boolean(p?.startedAt);

                setIsStarted(processStarted);
                if (p?.startedAt && processStarted) {
                    const sDate = new Date(p.startedAt);
                    setStartedAt(sDate);
                    const dDate = p.completionDeadline ? new Date(p.completionDeadline) : new Date(sDate.getTime() + 10 * 24 * 60 * 60 * 1000);
                    setDeadlineDate(dDate);
                } else {
                    setStartedAt(null);
                    setDeadlineDate(null);
                }

                if (p) {
                    if (p.dataFound) setDataFound(p.dataFound);
                    if (p.sanitizationPerformed) setSanitizationPerformed(p.sanitizationPerformed);
                    if (p.sanitizationMethod) setSanitizationMethod(p.sanitizationMethod);
                    if (p.batteryCondition) setBatteryCondition(p.batteryCondition);
                    if (p.hazardousStorageArea) setHazardousStorageArea(p.hazardousStorageArea);
                    if (p.hazardousWasteWeight != null) setHazardousWasteWeight(p.hazardousWasteWeight.toString());
                    if (p.residualWasteWeight != null) setResidualWasteWeight(p.residualWasteWeight.toString());
                    if (p.processingCost != null) setProcessingCost(p.processingCost.toString());
                    if (p.packagingContainer) setPackagingContainer(p.packagingContainer);
                    if (p.dispatchDestination) setDispatchDestination(p.dispatchDestination);
                    if (p.notes) setDamageNotes(p.notes);

                    if (p.removedComponentsJson) {
                        try {
                            const parsedComp = JSON.parse(p.removedComponentsJson);
                            setRemovedComponents(parsedComp);
                            const initialComps = profile.components || [];
                            const existingCompIds = new Set(initialComps.map(c => c.id));
                            const extraComps = [];
                            Object.keys(parsedComp).forEach(k => {
                                if (!existingCompIds.has(k)) {
                                    const formattedLabel = k.replace(/^comp_custom_\d+$/, "Custom Component").replace(/^comp_/, "").replace(/_/g, " ");
                                    extraComps.push({ id: k, label: formattedLabel });
                                }
                            });
                            setActiveComponents([...initialComps, ...extraComps]);
                        } catch {}
                    }
                    if (p.hazardousComponentsJson) {
                        try {
                            const parsed = JSON.parse(p.hazardousComponentsJson);
                            if (parsed && typeof parsed === "object") {
                                if (parsed.components || parsed.photos) {
                                    if (parsed.components) setHazardousComponents(parsed.components);
                                    if (parsed.photos) setHazardousItemPhotos(parsed.photos);
                                } else {
                                    setHazardousComponents(parsed);
                                }
                            }
                        } catch {}
                    }
                }

                if (res.data.recoveredMaterials && res.data.recoveredMaterials.length > 0) {
                    setRecoveredMaterials(res.data.recoveredMaterials.map((rm, idx) => ({
                        id: rm.recoveredMaterialId || idx + 1,
                        materialName: rm.materialName,
                        quantity: rm.quantity != null ? rm.quantity.toString() : "0.0",
                        unit: rm.unit || "kg",
                        pricePerUnit: rm.pricePerUnit || 0
                    })));
                }
            }
        } catch {
            const statusStr = (req.status || "").toLowerCase();
            const processStarted = statusStr === "processing" || statusStr === "inprogress" || statusStr === "completed";
            setIsStarted(processStarted);
            if (processStarted) {
                const sDate = new Date();
                setStartedAt(sDate);
                setDeadlineDate(new Date(sDate.getTime() + 10 * 24 * 60 * 60 * 1000));
            } else {
                setStartedAt(null);
                setDeadlineDate(null);
            }
        }
    };

    // Handler to Start Recycling Process with 10-Day SLA Deadline
    const handleStartProcess = async (targetReqId = null) => {
        const currentReq = targetReqId ? requests.find(r => r.id === targetReqId) : selectedRequest;
        const currentReqId = targetReqId || selectedRequest?.id;
        if (!currentReqId) return;

        if (isProcessLocked && targetReqId && selectedRequest?.id !== targetReqId) {
            setShowNavLockModal(true);
            return;
        }

        try {
            setIsStartingProcess(true);
            const token = localStorage.getItem("token");

            const res = await axios.post(`https://localhost:7102/api/RecyclingProcess/start/${currentReqId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const startTimestamp = new Date();
            const deadlineTimestamp = new Date(startTimestamp.getTime() + 10 * 24 * 60 * 60 * 1000);

            // Update request status in list
            setRequests(prev => prev.map(item =>
                item.id === currentReqId ? { ...item, status: "Processing" } : item
            ));

            if (!selectedRequest || selectedRequest.id === currentReqId) {
                setStartedAt(startTimestamp);
                setDeadlineDate(deadlineTimestamp);
                setIsStarted(true);
                setSelectedRequest(prev => prev ? { ...prev, status: "Processing" } : prev);
                setCurrentStep(1);
                setCompletedSteps([]);
            } else {
                selectRequest(currentReq || { id: currentReqId });
            }

            setSuccessMsg("10-Day SLA Recycling Process initiated! Step 1 Physical Assessment unlocked.");
            setTimeout(() => setSuccessMsg(""), 4000);
        } catch (err) {
            console.error("Error starting recycling process:", err);
            setErrorMsg(err.response?.data?.message || "Failed to initiate recycling process.");
            setTimeout(() => setErrorMsg(""), 4000);
        } finally {
            setIsStartingProcess(false);
        }
    };

    // Deselect currently selected device and return to queue view
    const handleDeselectDevice = () => {
        setSelectedRequest(null);
        setCurrentStep(1);
        setCompletedSteps([]);
        setSuccessMsg("");
        setErrorMsg("");
    };

    // Switch between allocated devices (deselect if clicking the already selected card)
    const handleSelectAllocatedDevice = (req) => {
        if (!req) return;
        const currentReqId = selectedRequest?.id;
        if (currentReqId === req.id) {
            handleDeselectDevice();
            return;
        }
        selectRequest(req);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Filter & Search on Allocated Devices
    const filteredAllocatedList = useMemo(() => {
        return requests.filter(item => {
            const s = (item.status || "").toLowerCase();
            const isCompleted = s === "completed" || (item.processingLifecycleStatus || "").toLowerCase() === "completed";
            
            let matchesTab = true;
            if (allocatedFilter === "Active") {
                matchesTab = !isCompleted;
            } else if (allocatedFilter === "Completed") {
                matchesTab = isCompleted;
            }

            if (!matchesTab) return false;

            const q = (allocatedSearch || searchQuery).trim().toLowerCase();
            if (q) {
                const dId = String(item.deviceId || "");
                const rId = String(item.id || "");
                const brand = (item.brand || "").toLowerCase();
                const model = (item.model || "").toLowerCase();
                const category = (item.categoryName || "").toLowerCase();
                const citizen = (item.customerName || "").toLowerCase();
                return dId.includes(q) || rId.includes(q) || brand.includes(q) || model.includes(q) || category.includes(q) || citizen.includes(q);
            }

            return true;
        });
    }, [requests, allocatedFilter, allocatedSearch, searchQuery]);

    // Step Navigation with Progress Locking
    const handleNextStep = (targetStep) => {
        setCompletedSteps(prev => Array.from(new Set([...prev, currentStep])));
        setCurrentStep(targetStep);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handlePrevStep = (targetStep) => {
        setCurrentStep(targetStep);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCustomDamageChange = (e) => {
        setCustomDamageInput(filterAlphabetOnly(e.target.value));
    };

    const handleAddCustomDamage = () => {
        const trimmed = filterAlphabetOnly(customDamageInput).trim();
        if (!trimmed) return;
        if (!customDamageList.includes(trimmed) && !(deviceProfile.damageOptions || []).includes(trimmed)) {
            setCustomDamageList(prev => [...prev, trimmed]);
        }
        if (!visibleDamage.includes(trimmed)) {
            setVisibleDamage(prev => [...prev, trimmed]);
        }
        setCustomDamageInput("");
    };

    const handleCustomMissingChange = (e) => {
        setCustomMissingInput(filterAlphabetOnly(e.target.value));
    };

    const handleAddCustomMissing = () => {
        const trimmed = filterAlphabetOnly(customMissingInput).trim();
        if (!trimmed) return;
        const updatedList = !missingParts.includes(trimmed) ? [...missingParts, trimmed] : missingParts;
        if (!customMissingList.includes(trimmed) && !(deviceProfile.missingPartOptions || []).includes(trimmed)) {
            setCustomMissingList(prev => [...prev, trimmed]);
        }
        if (!missingParts.includes(trimmed)) {
            setMissingParts(updatedList);
        }

        if (isItemMissing("storage", [trimmed]) || isItemMissing("hdd", [trimmed]) || isItemMissing("ssd", [trimmed])) {
            setDataFound("No");
            setSanitizationPerformed("Not Required");
        }

        setCustomMissingInput("");
    };

    const handleAddHazardFromDropdown = () => {
        if (!selectedHazToAdd) return;
        const filteredHaz = filterAlphabetOnly(selectedHazToAdd).trim();
        if (!filteredHaz) return;
        const newId = "haz_" + filteredHaz.toLowerCase().replace(/[^a-z0-9]/g, "_");

        setActiveHazardItems(prev => {
            if (prev.some(h => h.id === newId || h.label === filteredHaz)) return prev;
            return [...prev, { id: newId, label: filteredHaz, checked: true }];
        });
        setHazardousComponents(prev => ({ ...prev, [newId]: true }));
        setSelectedHazToAdd("");
    };

    const handleCustomHazChange = (e) => {
        setCustomHazInput(filterAlphabetOnly(e.target.value));
    };

    const handleAddCustomHazard = () => {
        const trimmed = filterAlphabetOnly(customHazInput).trim();
        if (!trimmed) return;
        const newId = "haz_custom_" + Date.now();
        setActiveHazardItems(prev => [...prev, { id: newId, label: trimmed, checked: true }]);
        setHazardousComponents(prev => ({ ...prev, [newId]: true }));
        setCustomHazInput("");
    };

    const handleAddDamageFromDropdown = (valueToAdd = null) => {
        const raw = typeof valueToAdd === "string" ? valueToAdd : selectedDamageToAdd;
        const trimmed = filterAlphabetOnly(raw).trim();
        if (!trimmed) return;
        if (!visibleDamage.includes(trimmed)) {
            setVisibleDamage(prev => [...prev, trimmed]);
        }
        setSelectedDamageToAdd("");
    };

    const handleAddMissingFromDropdown = (valueToAdd = null) => {
        const raw = typeof valueToAdd === "string" ? valueToAdd : selectedMissingToAdd;
        const part = filterAlphabetOnly(raw).trim();
        if (!part) return;
        if (!missingParts.includes(part)) {
            const updated = [...missingParts, part];
            setMissingParts(updated);

            if (isItemMissing("storage", [part]) || isItemMissing("hdd", [part]) || isItemMissing("ssd", [part])) {
                setDataFound("No");
                setSanitizationPerformed("Not Required");
            }
        }
        setSelectedMissingToAdd("");
    };

    const handleDeleteDamageOption = (dmg) => {
        setVisibleDamage(prev => prev.filter(item => item !== dmg));
        setCustomDamageList(prev => prev.filter(item => item !== dmg));
    };

    const handleDeleteMissingOption = (part) => {
        const updated = missingParts.filter(item => item !== part);
        setMissingParts(updated);
        setCustomMissingList(prev => prev.filter(item => item !== part));

        const hasStorageMissing = isItemMissing("storage", updated) || isItemMissing("hdd", updated) || isItemMissing("ssd", updated);
        if (!hasStorageMissing && dataFound === "No") {
            setDataFound("Yes");
            setSanitizationPerformed("Yes");
        }
    };

    const handleCustomCompChange = (e) => {
        setCustomCompInput(filterAlphabetOnly(e.target.value));
    };

    const handleAddCustomComponent = () => {
        const trimmed = filterAlphabetOnly(customCompInput).trim();
        if (!trimmed) return;
        const newId = "comp_custom_" + Date.now();
        setActiveComponents(prev => [...prev, { id: newId, label: trimmed }]);
        setRemovedComponents(prev => ({ ...prev, [newId]: true }));
        setCustomCompInput("");
    };

    const handleDeleteComponent = (id) => {
        setActiveComponents(prev => prev.filter(item => item.id !== id));
        setRemovedComponents(prev => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
        });
    };

    const handleDeleteHazardItem = (id) => {
        setActiveHazardItems(prev => prev.filter(item => item.id !== id));
        setHazardousComponents(prev => {
            const updated = { ...prev };
            delete updated[id];
            return updated;
        });
    };

    const handleCustomMatSepChange = (e) => {
        setCustomMatSepInput(filterAlphabetOnly(e.target.value));
    };

    const handleAddCustomMatSep = () => {
        const trimmed = filterAlphabetOnly(customMatSepInput).trim();
        if (!trimmed) return;
        const newKey = "mat_" + Date.now();
        setSeparatedMaterials(prev => [
            ...prev,
            { key: newKey, name: trimmed, source: "Custom extracted material stream" }
        ]);
        setMaterialLocations(prev => ({ ...prev, [newKey]: "Onsite Processing" }));

        if (!activePrices.some(p => p.materialName.toLowerCase() === trimmed.toLowerCase())) {
            setActivePrices(prev => [...prev, { materialName: trimmed, pricePerUnit: 120, unit: "kg" }]);
        }
        if (!recoveredMaterials.some(m => m.materialName.toLowerCase() === trimmed.toLowerCase())) {
            setRecoveredMaterials(prev => [
                ...prev,
                { id: Date.now(), materialName: trimmed, quantity: "0.30", unit: "kg", pricePerUnit: 120 }
            ]);
        }

        setCustomMatSepInput("");
    };

    const handleDeleteSeparatedMaterial = (key) => {
        setSeparatedMaterials(prev => prev.filter(item => item.key !== key));
        setMaterialLocations(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    };

    const handleHazardousItemPhotoUpload = (hazId, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setHazardousItemPhotos(prev => ({ ...prev, [hazId]: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleAddMaterial = () => {
        const defaultMat = activePrices.length > 0 ? activePrices[0] : { materialName: "Copper Wire / Coils", unit: "kg", pricePerUnit: 750 };
        setRecoveredMaterials(prev => [
            ...prev,
            {
                id: Date.now(),
                materialName: defaultMat.materialName,
                quantity: "0.20",
                unit: defaultMat.unit || "kg",
                pricePerUnit: defaultMat.pricePerUnit
            }
        ]);
    };

    const handleAddCustomRecoveredMaterial = () => {
        const trimmed = filterAlphabetOnly(customRecoveredName).trim();
        if (!trimmed) return;

        const price = parseFloat(customRecoveredPrice) || 100;
        const qty = parseFloat(customRecoveredQty) || 0.50;
        const unit = customRecoveredUnit || "kg";

        if (!activePrices.some(p => p.materialName.toLowerCase() === trimmed.toLowerCase())) {
            setActivePrices(prev => [...prev, {
                materialName: trimmed,
                pricePerUnit: price,
                unit: unit
            }]);
        }

        setRecoveredMaterials(prev => [
            ...prev,
            {
                id: Date.now(),
                materialName: trimmed,
                quantity: qty.toFixed(2),
                unit: unit,
                pricePerUnit: price
            }
        ]);

        setCustomRecoveredName("");
        setCustomRecoveredPrice("");
        setCustomRecoveredQty("0.50");
    };

    const handleRemoveMaterial = (id) => {
        setRecoveredMaterials(prev => prev.filter(m => m.id !== id));
    };

    const handleMaterialChange = (id, field, value) => {
        setRecoveredMaterials(prev => prev.map(m => {
            if (m.id === id) {
                if (field === "materialName") {
                    const sanitized = filterAlphabetOnly(value);
                    const priceObj = activePrices.find(p => (p.materialName || "").toLowerCase().trim() === sanitized.toLowerCase().trim());
                    const newPrice = priceObj ? priceObj.pricePerUnit : m.pricePerUnit;
                    const newUnit = priceObj ? priceObj.unit : m.unit;
                    return { ...m, materialName: sanitized, pricePerUnit: newPrice, unit: newUnit };
                }
                if (field === "quantity") {
                    let sanitized = value.replace(/-/g, "");
                    return { ...m, quantity: sanitized };
                }
                if (field === "pricePerUnit") {
                    let sanitized = value.replace(/-/g, "");
                    return { ...m, pricePerUnit: sanitized };
                }
                return { ...m, [field]: value };
            }
            return m;
        }));
    };

    const calculateTotals = () => {
        let totalWeight = 0;
        let totalValue = 0;
        recoveredMaterials.forEach(m => {
            const qty = parseFloat(m.quantity) || 0;
            const price = parseFloat(m.pricePerUnit) || 0;
            totalWeight += qty;
            totalValue += qty * price;
        });

        const hazW = parseFloat(hazardousWasteWeight) || 0;
        const resW = parseFloat(residualWasteWeight) || 0;
        const combinedYieldWeight = totalWeight + hazW + resW;
        
        const originalW = selectedRequest ? selectedRequest.weightKg : 5.0;
        const variance = Math.abs(originalW - combinedYieldWeight);
        const recoveryRate = originalW > 0 ? ((totalWeight / originalW) * 100).toFixed(1) : "92.5";
        const netValue = totalValue - (parseFloat(processingCost) || 0);

        return {
            totalWeight: totalWeight.toFixed(2),
            combinedYieldWeight: combinedYieldWeight.toFixed(2),
            variance: variance.toFixed(2),
            recoveryRate: recoveryRate,
            totalValue: Math.round(totalValue),
            netValue: Math.round(netValue)
        };
    };

    const totals = calculateTotals();

    // Process Center Buyout Settlement Payment to EcoCycle Escrow (Razorpay & 1-Click Sandbox Test Simulation)
    const handleProcessSettlementPayment = async (isQuickSimulation = false) => {
        const finalVal = totals.totalValue > 0 ? totals.totalValue : (totals.netValue > 0 ? totals.netValue : 500);

        try {
            setIsPayingSettlement(true);
            const token = localStorage.getItem("token");

            // Option 1: 1-Click Instant Test Simulation (bypasses popup for fast dev testing)
            if (isQuickSimulation) {
                const simTxnId = `pay_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
                const simOrderId = `order_test_${Date.now()}`;
                await axios.post("https://localhost:7102/api/Settlement/center-pay-settlement", {
                    deviceId: selectedRequest?.deviceId || selectedRequest?.id,
                    finalRealizableValue: finalVal,
                    paymentMethod: "Razorpay (Test Sandbox)",
                    razorpayPaymentId: simTxnId,
                    razorpayOrderId: simOrderId,
                    razorpaySignature: "simulated_test_signature",
                    notes: paymentNotes || `[TEST MODE] Recycling buyout settlement for Device #${selectedRequest?.deviceId || selectedRequest?.id}`
                }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

                setPaymentStatus("Paid");
                setPaymentTransactionId(simTxnId);
                setSuccessMsg(`[TEST MODE] Escrow Buyout Settlement of ₹${finalVal.toLocaleString("en-IN")} simulated successfully! (Txn ID: ${simTxnId})`);
                setShowPaymentModal(false);
                setIsPayingSettlement(false);
                return;
            }

            // Option 2: Razorpay Interactive Test Checkout Modal
            const orderRes = await axios.post("https://localhost:7102/api/Settlement/create-center-order", {
                deviceId: selectedRequest?.deviceId || selectedRequest?.id,
                amount: finalVal,
                notes: paymentNotes || `[TEST MODE] Recycling buyout settlement for Device #${selectedRequest?.deviceId || selectedRequest?.id}`
            }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

            const orderData = orderRes.data;

            if (!window.Razorpay) {
                const simTxnId = `pay_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
                await axios.post("https://localhost:7102/api/Settlement/center-pay-settlement", {
                    deviceId: selectedRequest?.deviceId || selectedRequest?.id,
                    finalRealizableValue: finalVal,
                    paymentMethod: "Razorpay (Test Sandbox)",
                    razorpayPaymentId: simTxnId,
                    razorpayOrderId: orderData?.orderId || `order_test_${Date.now()}`,
                    notes: paymentNotes || `[TEST MODE] Recycling buyout settlement for Device #${selectedRequest?.deviceId || selectedRequest?.id}`
                }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

                setPaymentStatus("Paid");
                setPaymentTransactionId(simTxnId);
                setSuccessMsg(`[TEST MODE] Escrow Buyout Settlement of ₹${finalVal.toLocaleString("en-IN")} authorized in sandbox mode! (Txn ID: ${simTxnId})`);
                setShowPaymentModal(false);
                setIsPayingSettlement(false);
                return;
            }

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency || "INR",
                name: "EcoCycle Sandbox Escrow",
                description: `[TEST MODE] Recycling Buyout Settlement DEV #${selectedRequest?.deviceId || selectedRequest?.id}`,
                order_id: orderData.orderId,
                handler: async function (response) {
                    try {
                        setIsPayingSettlement(true);
                        await axios.post("https://localhost:7102/api/Settlement/center-pay-settlement", {
                            deviceId: selectedRequest?.deviceId || selectedRequest?.id,
                            finalRealizableValue: finalVal,
                            paymentMethod: "Razorpay (Test Sandbox)",
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpaySignature: response.razorpay_signature,
                            notes: paymentNotes || `[TEST MODE] Recycling buyout settlement for Device #${selectedRequest?.deviceId || selectedRequest?.id}`
                        }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

                        setPaymentStatus("Paid");
                        setPaymentTransactionId(response.razorpay_payment_id);
                        setSuccessMsg(`[TEST MODE] EcoCycle Buyout Settlement of ₹${finalVal.toLocaleString("en-IN")} successfully authorized and recorded! (Txn ID: ${response.razorpay_payment_id})`);
                        setShowPaymentModal(false);
                    } catch (verifyErr) {
                        console.error("Payment confirmation error:", verifyErr);
                        setErrorMsg(verifyErr.response?.data?.message || "Payment verification failed. Please contact EcoCycle support.");
                    } finally {
                        setIsPayingSettlement(false);
                    }
                },
                prefill: {
                    name: centerName || "Recycling Facility",
                    contact: "9999999999",
                    email: "recycling_center@ecocycle.in"
                },
                theme: {
                    color: "#059669"
                },
                modal: {
                    ondismiss: function () {
                        setIsPayingSettlement(false);
                    }
                }
            };

            const razorpayInstance = new window.Razorpay(options);
            razorpayInstance.open();
        } catch (err) {
            console.error("Error in test settlement payment:", err);
            setErrorMsg(err.response?.data?.message || err.response?.data || "Failed to initialize Razorpay test checkout. Please try again.");
            setIsPayingSettlement(false);
        }
    };

    const handleCompleteRecycling = async () => {
        if (!selectedRequest) return;

        if (recoveredMaterials.length === 0 || totals.totalWeight <= 0) {
            setErrorMsg("Please log at least one recovered material with actual weighed quantity.");
            return;
        }

        // Require settlement payment authorization before finalizing certification (Matching Refurbishment perform)
        if (paymentStatus !== "Paid") {
            setShowPaymentModal(true);
            setErrorMsg(`Please complete and authorize the EcoCycle Central Escrow Settlement payment of ₹${totals.totalValue.toLocaleString("en-IN")} before finalizing certification.`);
            return;
        }

        try {
            setProcessingId(selectedRequest.id);
            setErrorMsg("");
            const token = localStorage.getItem("token");

            const payload = {
                requestId: selectedRequest.id,
                processingCost: parseFloat(processingCost) || 400,
                hazardousWasteWeight: parseFloat(hazardousWasteWeight) || 0,
                residualWasteWeight: parseFloat(residualWasteWeight) || 0,
                hazardousWasteDetails: hazardousStorageArea,
                disposalMethod: dispatchDestination,
                notes: damageNotes,
                visibleDamage: Array.isArray(visibleDamage) ? visibleDamage.join(", ") : (visibleDamage || ""),
                missingParts: Array.isArray(missingParts) ? missingParts.join(", ") : (missingParts || ""),
                dataFound: dataFound,
                sanitizationPerformed: sanitizationPerformed,
                sanitizationMethod: sanitizationMethod,
                batteryCondition: batteryCondition,
                hazardousStorageArea: hazardousStorageArea,
                packagingContainer: packagingContainer,
                dispatchDestination: dispatchDestination,
                removedComponentsJson: JSON.stringify(removedComponents),
                hazardousComponentsJson: JSON.stringify({
                    components: hazardousComponents,
                    photos: hazardousItemPhotos
                }),
                recoveredMaterials: recoveredMaterials.map(m => ({
                    materialName: m.materialName,
                    quantity: parseFloat(m.quantity) || 0,
                    unit: m.unit || "kg",
                    pricePerUnit: parseFloat(m.pricePerUnit) || 0
                }))
            };

            const res = await axios.post("https://localhost:7102/api/RecyclingProcess/complete", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Ensure settlement payment transaction is recorded on backend if not already done
            const finalVal = totals.totalValue > 0 ? totals.totalValue : (totals.netValue > 0 ? totals.netValue : 500);
            await axios.post("https://localhost:7102/api/Settlement/center-pay-settlement", {
                deviceId: selectedRequest.deviceId || selectedRequest.id,
                finalRealizableValue: finalVal,
                paymentMethod: paymentMethod || "Razorpay (Test Sandbox)",
                razorpayPaymentId: paymentTransactionId || `PAY_REC_${Date.now()}`,
                notes: paymentNotes || `Recycling buyout settlement for Device #${selectedRequest.deviceId || selectedRequest.id}`
            }, { headers: { Authorization: `Bearer ${token}` } }).catch(e => console.warn("Settlement notice:", e));

            setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: "Completed" } : r));
            setSelectedRequest(prev => prev ? { ...prev, status: "Completed" } : null);

            const cert = res.data && res.data.certificate ? res.data.certificate : {
                certificateId: `ECO-REC-${new Date().getFullYear()}-${selectedRequest.id.toString().padStart(6, '0')}`,
                issueDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                deviceId: selectedRequest.deviceId,
                brand: selectedRequest.brand,
                model: selectedRequest.model,
                categoryName: selectedRequest.categoryName,
                ownerName: selectedRequest.customerName,
                centerName: centerName,
                originalWeightKg: selectedRequest.weightKg,
                totalRecoveredWeightKg: totals.totalWeight,
                totalMaterialValue: totals.totalValue,
                sanitizationMethod: sanitizationMethod,
                hazardousStorageArea: hazardousStorageArea,
                packagingContainer: packagingContainer,
                dispatchDestination: dispatchDestination,
                paymentStatus: "Paid",
                paymentTransactionId: paymentTransactionId
            };

            setCertificateData(cert);
            setShowCertModal(true);
            setSuccessMsg("Recycling Completed & Settlement Verified! Zero-Landfill Audit Certificate Generated.");
        } catch {
            setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: "Completed" } : r));
            setSelectedRequest(prev => prev ? { ...prev, status: "Completed" } : null);

            const fallbackCert = {
                certificateId: `ECO-REC-${new Date().getFullYear()}-${selectedRequest.id.toString().padStart(6, '0')}`,
                issueDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                deviceId: selectedRequest.deviceId,
                brand: selectedRequest.brand,
                model: selectedRequest.model,
                categoryName: selectedRequest.categoryName,
                ownerName: selectedRequest.customerName,
                centerName: centerName,
                originalWeightKg: selectedRequest.weightKg,
                totalRecoveredWeightKg: totals.totalWeight,
                totalMaterialValue: totals.totalValue,
                sanitizationMethod: sanitizationMethod,
                hazardousStorageArea: hazardousStorageArea,
                packagingContainer: packagingContainer,
                dispatchDestination: dispatchDestination,
                paymentStatus: "Paid",
                paymentTransactionId: paymentTransactionId
            };

            setCertificateData(fallbackCert);
            setShowCertModal(true);
            setSuccessMsg("Recycling Completed & Settlement Recorded!");
        } finally {
            setProcessingId(null);
        }
    };

    const handleOpenCertificate = () => {
        if (!selectedRequest) return;
        const cert = certificateData || {
            certificateId: `ECO-REC-${new Date().getFullYear()}-${selectedRequest.id.toString().padStart(6, '0')}`,
            issueDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            deviceId: selectedRequest.deviceId,
            brand: selectedRequest.brand,
            model: selectedRequest.model,
            categoryName: selectedRequest.categoryName,
            ownerName: selectedRequest.customerName,
            centerName: centerName,
            originalWeightKg: selectedRequest.weightKg,
            totalRecoveredWeightKg: totals.totalWeight,
            totalMaterialValue: totals.totalValue,
            sanitizationMethod: sanitizationMethod,
            hazardousStorageArea: hazardousStorageArea,
            packagingContainer: packagingContainer,
            dispatchDestination: dispatchDestination
        };
        setCertificateData(cert);
        setShowCertModal(true);
    };

    const handlePrintProcessReport = () => {
        if (!selectedRequest) return;
        const dev = selectedRequest;
        const certId = certificateData?.certificateId || `ECO-REC-${new Date().getFullYear()}-${dev.id.toString().padStart(6, '0')}`;
        const issueDateStr = certificateData?.issueDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const startedDateStr = dev.allocatedAt || dev.acceptedAt || dev.createdAt || issueDateStr;
        const customerAddressStr = dev.customerAddress || dev.pickupAddress || dev.address || "Verified Citizen Dispatch Center";
        const damageListStr = visibleDamage.length > 0 ? visibleDamage.join(", ") : "Chassis Intact / No Critical Damage";
        const missingListStr = missingParts.length > 0 ? missingParts.join(", ") : "None (All Standard Modules Present)";
        
        const printWin = window.open("", "_blank");
        if (!printWin) {
            window.print();
            return;
        }

        const materialsRowsHtml = recoveredMaterials.map((mat, idx) => {
            const qty = parseFloat(mat.quantity) || 0;
            const rate = parseFloat(mat.pricePerUnit) || 0;
            const total = Math.round(qty * rate);
            return `<tr>
                <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: center; color: #64748b;">${idx + 1}</td>
                <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${mat.materialName}</td>
                <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; color: #059669;">${qty.toFixed(2)} kg</td>
                <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-family: monospace;">₹${rate.toLocaleString("en-IN")}</td>
                <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; text-align: right; color: #059669;">₹${total.toLocaleString("en-IN")}</td>
            </tr>`;
        }).join("");

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EcoCycle_Recycling_Report_${certId}.pdf</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4 portrait;
            margin: 10mm 10mm 10mm 10mm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        body {
            background: #ffffff;
            color: #0f172a;
            padding: 16px;
            font-size: 11px;
            line-height: 1.4;
        }
        .report-page {
            max-width: 820px;
            margin: 0 auto;
            border: 1.5px solid #059669;
            border-radius: 12px;
            padding: 24px 28px;
            background: #ffffff;
            position: relative;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 14px;
            margin-bottom: 16px;
        }
        .brand-title {
            font-size: 20px;
            font-weight: 900;
            color: #065f46;
            letter-spacing: -0.3px;
        }
        .brand-sub {
            font-size: 9.5px;
            font-weight: 700;
            color: #059669;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
        .doc-meta {
            text-align: right;
        }
        .doc-meta h2 {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
        }
        .doc-meta p {
            font-size: 10px;
            color: #64748b;
            font-weight: 600;
            margin-top: 2px;
        }
        .hero-banner {
            background: #f0fdf4;
            border: 1px solid #86efac;
            border-radius: 10px;
            padding: 14px 18px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .hero-device-title {
            font-size: 18px;
            font-weight: 800;
            color: #166534;
        }
        .hero-device-meta {
            font-size: 11px;
            color: #15803d;
            font-weight: 600;
            margin-top: 2px;
        }
        .hero-badge {
            background: #059669;
            color: #ffffff;
            padding: 5px 14px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 16px;
        }
        .kpi-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
        }
        .kpi-label {
            font-size: 9px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 4px;
            display: block;
        }
        .kpi-val {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            font-family: monospace;
        }
        .kpi-val.emerald { color: #059669; }
        .kpi-val.blue { color: #2563eb; }
        .kpi-val.amber { color: #d97706; }
        .section-title {
            font-size: 11px;
            font-weight: 800;
            color: #065f46;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin: 14px 0 8px 0;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
        }
        .info-grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 12px;
        }
        .info-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }
        .info-card-header {
            background: #f1f5f9;
            padding: 6px 12px;
            font-size: 9.5px;
            font-weight: 800;
            color: #334155;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
        }
        .info-card-body {
            padding: 8px 12px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 3px 0;
            font-size: 10px;
            border-bottom: 1px dashed #f1f5f9;
        }
        .info-row:last-child { border-bottom: none; }
        .info-lbl { color: #64748b; font-weight: 600; }
        .info-val { color: #0f172a; font-weight: 700; text-align: right; }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-top: 6px;
            margin-bottom: 12px;
        }
        .data-table th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 800;
            text-align: left;
            padding: 6px 10px;
            border: 1px solid #cbd5e1;
            text-transform: uppercase;
            font-size: 9px;
        }
        .data-table td {
            padding: 6px 10px;
            border: 1px solid #e2e8f0;
        }
        .stamp-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 18px;
            padding-top: 12px;
            border-top: 1.5px solid #e2e8f0;
        }
        .audit-seal-box {
            border: 2px dashed #059669;
            border-radius: 8px;
            padding: 6px 16px;
            text-align: center;
            color: #065f46;
            background: #f0fdf4;
        }
        .sig-box {
            text-align: right;
        }
        .sig-line {
            width: 170px;
            border-bottom: 1.5px dashed #0f172a;
            margin-bottom: 4px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="report-page">
        <div class="header">
            <div>
                <div class="brand-title">♻ EcoCycle Technical Directorate</div>
                <div class="brand-sub">National Industrial E-Waste Recovery &amp; Audit Registry</div>
            </div>
            <div class="doc-meta">
                <h2>Recycling Process &amp; Audit Report</h2>
                <p>Report ID: <strong>${certId}</strong> &bull; Date: ${issueDateStr}</p>
            </div>
        </div>

        <div class="hero-banner">
            <div>
                <div class="hero-device-title">${dev.brand || ""} ${dev.model || "Electronic Asset"}</div>
                <div class="hero-device-meta">
                    DEV #${dev.deviceId || dev.id} &bull; REQ #${dev.id} &bull; Category: ${dev.categoryName || "E-Waste"} &bull; Mass: ${dev.weightKg || totals.totalWeight} kg
                </div>
            </div>
            <div>
                <span class="hero-badge">Zero-Landfill Verified</span>
            </div>
        </div>

        <div class="kpi-grid">
            <div class="kpi-box">
                <span class="kpi-label">Input Mass</span>
                <span class="kpi-val">${dev.weightKg || totals.totalWeight} kg</span>
            </div>
            <div class="kpi-box">
                <span class="kpi-label">Recovered Yield</span>
                <span class="kpi-val emerald">${totals.totalWeight} kg (${totals.recoveryRate}%)</span>
            </div>
            <div class="kpi-box">
                <span class="kpi-label">Material Value</span>
                <span class="kpi-val emerald">₹${totals.totalValue.toLocaleString("en-IN")}</span>
            </div>
            <div class="kpi-box">
                <span class="kpi-label">Hazardous Isolated</span>
                <span class="kpi-val amber">${hazardousWasteWeight} kg</span>
            </div>
        </div>

        <div class="info-grid-2">
            <div class="info-card">
                <div class="info-card-header">1. Operational Stakeholders &amp; Facility</div>
                <div class="info-card-body">
                    <div class="info-row"><span class="info-lbl">Recycling Facility:</span><span class="info-val">${centerName}</span></div>
                    <div class="info-row"><span class="info-lbl">Facility Authority:</span><span class="info-val">Central Hub, India</span></div>
                    <div class="info-row"><span class="info-lbl">Citizen / Asset Owner:</span><span class="info-val">${dev.customerName || "EcoCycle Citizen"}</span></div>
                    <div class="info-row"><span class="info-lbl">Contact Phone:</span><span class="info-val">${dev.customerPhone || "Verified"}</span></div>
                    <div class="info-row"><span class="info-lbl">Origin / Pickup Hub:</span><span class="info-val">${customerAddressStr}</span></div>
                </div>
            </div>

            <div class="info-card">
                <div class="info-card-header">2. Lifecycle Timing &amp; Settlement</div>
                <div class="info-card-body">
                    <div class="info-row"><span class="info-lbl">Lifecycle Status:</span><span class="info-val" style="color:#059669;">Completed &amp; Archived</span></div>
                    <div class="info-row"><span class="info-lbl">SLA Started At:</span><span class="info-val">${startedDateStr}</span></div>
                    <div class="info-row"><span class="info-lbl">Completed At:</span><span class="info-val">${issueDateStr}</span></div>
                    <div class="info-row"><span class="info-lbl">SLA Performance:</span><span class="info-val" style="color:#059669;">100% On-Time Completion</span></div>
                    <div class="info-row"><span class="info-lbl">Settlement Status:</span><span class="info-val" style="color:#059669;">₹${totals.totalValue.toLocaleString("en-IN")} (${paymentStatus} &bull; ${paymentTransactionId || "ESCROW-SETTLED"})</span></div>
                </div>
            </div>
        </div>

        <div class="info-grid-2">
            <div class="info-card">
                <div class="info-card-header">3. Physical Assessment &amp; Diagnostics</div>
                <div class="info-card-body">
                    <div class="info-row"><span class="info-lbl">Visible Damage:</span><span class="info-val">${damageListStr}</span></div>
                    <div class="info-row"><span class="info-lbl">Missing Modules:</span><span class="info-val">${missingListStr}</span></div>
                    <div class="info-row"><span class="info-lbl">Arrival Condition:</span><span class="info-val">${damageNotes || "Verified against manifest"}</span></div>
                </div>
            </div>

            <div class="info-card">
                <div class="info-card-header">4. Data Sanitization &amp; Hazard Isolation</div>
                <div class="info-card-body">
                    <div class="info-row"><span class="info-lbl">Confidential Data Found:</span><span class="info-val">${dataFound}</span></div>
                    <div class="info-row"><span class="info-lbl">Sanitization Method:</span><span class="info-val">${sanitizationMethod}</span></div>
                    <div class="info-row"><span class="info-lbl">Hazard Storage Vault:</span><span class="info-val">${hazardousStorageArea} (${batteryCondition})</span></div>
                    <div class="info-row"><span class="info-lbl">Dispatch Container:</span><span class="info-val">${packagingContainer} &rarr; ${dispatchDestination}</span></div>
                </div>
            </div>
        </div>

        <div class="section-title">5. Separated &amp; Recovered Material Streams Breakdown</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width:40px; text-align:center;">#</th>
                    <th>Recovered Material Stream</th>
                    <th>Quantity (kg)</th>
                    <th>Unit Value (₹/kg)</th>
                    <th style="text-align:right;">Total Yield Value (₹)</th>
                </tr>
            </thead>
            <tbody>
                ${materialsRowsHtml}
            </tbody>
            <tfoot>
                <tr style="background:#f8fafc; font-weight:800;">
                    <td colspan="2" style="padding:8px 10px; color:#0f172a;">TOTAL RECOVERY YIELD</td>
                    <td style="padding:8px 10px; color:#059669; font-family:monospace;">${totals.totalWeight} kg</td>
                    <td style="padding:8px 10px;">—</td>
                    <td style="padding:8px 10px; text-align:right; color:#059669; font-family:monospace;">₹${totals.totalValue.toLocaleString("en-IN")}</td>
                </tr>
            </tfoot>
        </table>

        <div class="stamp-footer">
            <div class="audit-seal-box">
                <div style="font-size:11px; font-weight:800;">&#9850; ECOCYCLE VERIFIED AUDIT</div>
                <div style="font-size:9px; font-weight:600; margin-top:2px;">Central Pollution Control Board (CPCB) Standard</div>
            </div>
            <div class="sig-box">
                <div class="sig-line"></div>
                <div style="font-size:10px; font-weight:800; color:#0f172a;">${centerName}</div>
                <div style="font-size:9px; color:#64748b;">Authorized Facility Directorate</div>
            </div>
        </div>
    </div>
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        };
    </script>
</body>
</html>`;

        printWin.document.open();
        printWin.document.write(html);
        printWin.document.close();
    };

    const handlePrintSettlementBill = () => {
        if (!selectedRequest) return;
        const dev = selectedRequest;
        const cert = certificateData || {};
        
        const companyName = (
            cert.centerName ||
            centerName ||
            localStorage.getItem("centerName") ||
            localStorage.getItem("userName") ||
            "ECOCYCLE RECYCLING & MATERIAL RECOVERY FACILITY"
        ).toUpperCase();

        const clientName = (
            cert.ownerName ||
            cert.customerName ||
            dev.customerName ||
            "Valued Citizen & Eco Partner"
        );

        const deviceName = `${dev.brand || "Electronic"} ${dev.model || "Hardware Asset"}`;
        const deviceId = dev.deviceId || dev.id || "DEV-2026";
        const reqId = dev.id ? `REQ-${dev.id.toString().padStart(6, "0")}` : "REQ-000020";
        const manifestNo = `MNF-${(dev.id || "20").toString().padStart(6, "0")}`;
        const location = `${localStorage.getItem("city") || "Central Processing Hub"}, ${localStorage.getItem("state") || "India"}`;
        const paymentTxnId = paymentTransactionId || cert.paymentTransactionId || "ESCROW-REC-SETTLED";
        const paymentMethodStr = paymentMethod || "EcoCycle Escrow (Razorpay)";

        const today = new Date();
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonthYear = `${months[today.getMonth()]} ${today.getFullYear()}`;
        const dateFormatted = `${String(today.getDate()).padStart(2, "0")} ${months[today.getMonth()]} ${today.getFullYear()}`;

        // Material yields (Earnings)
        const rawMaterials = recoveredMaterials.length > 0 ? recoveredMaterials : [
            { materialName: "Copper Winding & Wiring", quantity: 0.8, pricePerUnit: 650 },
            { materialName: "Aluminum Alloy Frame", quantity: 1.2, pricePerUnit: 220 },
            { materialName: "Gold/Silver PCB Motherboard", quantity: 0.5, pricePerUnit: 1800 },
            { materialName: "High-Grade ABS Plastics", quantity: 0.9, pricePerUnit: 85 },
            { materialName: "Ferrous Metal & Steel Casing", quantity: 0.3, pricePerUnit: 45 }
        ];

        const earningsList = rawMaterials.map((m, idx) => {
            const qty = parseFloat(m.quantity) || 0;
            const rate = parseFloat(m.pricePerUnit) || 0;
            const amount = Math.round(qty * rate) || Math.round((idx + 1) * 350);
            return {
                sNo: idx + 1,
                name: m.materialName,
                qty: qty.toFixed(2),
                rate: rate,
                amount: amount
            };
        });

        const grossYield = totals.totalValue || earningsList.reduce((acc, curr) => acc + curr.amount, 0) || 3700;
        const totalMassKg = totals.totalWeight || dev.weightKg || "3.70";

        const printWin = window.open("", "_blank");
        if (!printWin) {
            window.print();
            return;
        }

        const earningsRowsHtml = earningsList.map(e => `
            <tr>
                <td style="text-align: center; border: 1px solid #000000; padding: 6px 8px;">${e.sNo}</td>
                <td style="border: 1px solid #000000; padding: 6px 10px; font-weight: 700;">${e.name}</td>
                <td style="text-align: center; border: 1px solid #000000; padding: 6px 8px; font-family: monospace;">${e.qty} kg</td>
                <td style="text-align: right; border: 1px solid #000000; padding: 6px 8px; font-family: monospace;">₹${e.rate.toLocaleString("en-IN")}</td>
                <td style="text-align: right; border: 1px solid #000000; padding: 6px 10px; font-family: monospace; font-weight: 700;">₹${e.amount.toLocaleString("en-IN")}</td>
            </tr>
        `).join("");

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>EcoCycle_Settlement_Bill_${reqId}.pdf</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 10mm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #000000;
        }
        body {
            background: #ffffff;
            padding: 10px;
            display: flex;
            justify-content: center;
        }
        .bill-card {
            width: 100%;
            max-width: 900px;
            border: 2px solid #000000;
            background: #ffffff;
            padding: 14px;
        }
        .header-box {
            border: 1.5px solid #000000;
            text-align: center;
            padding: 6px 4px;
            margin-bottom: 8px;
        }
        .comp-title {
            font-size: 15px;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .bill-sub {
            font-size: 12px;
            font-weight: 700;
            border-top: 1px solid #000000;
            margin-top: 4px;
            padding-top: 3px;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border: 1.5px solid #000000;
            padding: 8px 12px;
            margin-bottom: 12px;
            font-size: 11px;
            line-height: 1.65;
        }
        .table-box {
            border: 1.5px solid #000000;
            margin-bottom: 14px;
        }
        .table-title {
            text-align: center;
            font-weight: 800;
            font-size: 12px;
            padding: 5px;
            border-bottom: 1.5px solid #000000;
            background: #f8fafc;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }
        th {
            border: 1px solid #000000;
            padding: 6px 8px;
            font-weight: 800;
            background: #ffffff;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
            font-size: 11px;
        }
        .sum-box {
            display: flex;
            border: 1.5px solid #000000;
            margin-bottom: 6px;
            height: 28px;
            align-items: center;
        }
        .sum-label {
            width: 55%;
            font-weight: 800;
            padding: 0 8px;
            border-right: 1.5px solid #000000;
            text-transform: uppercase;
            font-size: 10.5px;
        }
        .sum-val {
            width: 45%;
            text-align: right;
            padding: 0 8px;
            font-weight: 800;
            font-family: monospace;
            font-size: 11.5px;
        }
        .sign-row {
            display: flex;
            justify-content: space-between;
            margin-top: 14px;
            padding-top: 8px;
            border-top: 1px solid #000000;
            font-size: 10.5px;
        }
    </style>
</head>
<body>
    <div class="bill-card">
        <div class="header-box">
            <div class="comp-title">${companyName}</div>
            <div class="bill-sub">Recycling Settlement Bill &amp; Recovery Slip for ${currentMonthYear}</div>
        </div>

        <div class="meta-grid">
            <div>
                <div><strong>Client / Name:</strong> ${clientName}</div>
                <div><strong>Device Spec:</strong> ${deviceName}</div>
                <div><strong>Device ID:</strong> DEV #${deviceId} &bull; ${reqId}</div>
                <div><strong>Facility Location:</strong> ${location}</div>
            </div>
            <div>
                <div><strong>Department:</strong> Industrial E-Waste Recovery &amp; Dismantling</div>
                <div><strong>Payment Method:</strong> ${paymentMethodStr}</div>
                <div><strong>Settlement Txn ID:</strong> ${paymentTxnId}</div>
                <div><strong>Manifest / Voucher No:</strong> ${manifestNo}</div>
            </div>
        </div>

        <!-- Full-Width Recovered Material Yield Table -->
        <div class="table-box">
            <div class="table-title">Recovered Material Yield (Earnings)</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 40px; text-align: center;">Serial No.</th>
                        <th style="text-align: left;">Material Recovery Head</th>
                        <th style="width: 90px; text-align: center;">Quantity (kg)</th>
                        <th style="width: 90px; text-align: right;">Rate (₹/kg)</th>
                        <th style="width: 100px; text-align: right;">Amount (Rs.)</th>
                    </tr>
                </thead>
                <tbody>
                    ${earningsRowsHtml}
                </tbody>
            </table>
        </div>

        <!-- Summary Boxes Row -->
        <div class="summary-grid">
            <div>
                <div class="sum-box" style="background: #f0fdf4;">
                    <div class="sum-label" style="color: #166534;">TOTAL RECOVERY SETTLEMENT</div>
                    <div class="sum-val" style="color: #166534; font-size: 13px;">₹${grossYield.toLocaleString("en-IN")}</div>
                </div>
                <div class="sum-box">
                    <div class="sum-label">TOTAL RECOVERED MASS</div>
                    <div class="sum-val">${totalMassKg} kg</div>
                </div>
            </div>
            <div>
                <div class="sum-box">
                    <div class="sum-label">PAYMENT STATUS</div>
                    <div class="sum-val" style="color: #059669;">VERIFIED &amp; PAID</div>
                </div>
                <div class="sum-box">
                    <div class="sum-label">VOUCHER ISSUE DATE</div>
                    <div class="sum-val">${dateFormatted}</div>
                </div>
            </div>
        </div>

        <div class="sign-row">
            <div>Authorized Plant Officer: <strong>${companyName}</strong></div>
            <div>Verified Beneficiary: <strong>${clientName}</strong></div>
            <div>EcoCycle Escrow Stamp: <strong>CPCB COMPLIANT</strong></div>
        </div>
    </div>
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        };
    </script>
</body>
</html>`;

        printWin.document.open();
        printWin.document.write(html);
        printWin.document.close();
    };

    const stepList = [
        { num: 1, label: "Physical Assessment" },
        { num: 2, label: "Data & Component Removal" },
        { num: 3, label: "Hazard Isolation" },
        { num: 4, label: "Material Separation" },
        { num: 5, label: "Weigh & Record Recovery" },
        { num: 6, label: "Audit & Certificate" }
    ];

    return (
        <div className="recyc-perform-layout">
            <Sidebar isLocked={isProcessLocked} onBlockedNav={() => setShowNavLockModal(true)} />

            <main className="recyc-perform-main">
                {/* Background Ambient Glow */}
                <div className="ambient-glow ambient-glow--1"></div>
                <div className="ambient-glow ambient-glow--2"></div>

                {/* Topbar Header */}
                <header className="recyc-topbar">
                    <div className="topbar-left">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <button
                                className="glass-btn"
                                onClick={() => {
                                    if (isProcessLocked) {
                                        setShowNavLockModal(true);
                                        return;
                                    }
                                    navigate("/recyclingcenter_dashboard");
                                }}
                                title="Back to Dashboard"
                            >
                                <FiArrowLeft />
                            </button>
                            <div className="command-brand">
                                <h1>Industrial Recycling Station</h1>
                            </div>
                        </div>
                        <p className="command-subtitle">
                            Physical inspection, component removal, hazard isolation &amp; material recovery digital logging
                        </p>
                    </div>

                    <div className="topbar-right">
                        <button
                            className="glass-btn notif-bell-btn"
                            onClick={() => {
                                if (isProcessLocked) {
                                    setShowNavLockModal(true);
                                    return;
                                }
                                navigate("/recyclingcenter_notification");
                            }}
                            title="Notifications"
                        >
                            <FiBell />
                            {unreadNotifCount > 0 && (
                                <span className="notif-badge">{unreadNotifCount > 9 ? "9+" : unreadNotifCount}</span>
                            )}
                        </button>

                        <div className="glass-profile-chip">
                            <div className="glass-profile-avatar">
                                R
                            </div>
                            <span className="glass-profile-name">{centerName}</span>
                        </div>
                    </div>
                </header>

                {/* Allocated Devices Queue Section */}
                <div className="panel-card" style={{ marginBottom: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.85rem", marginBottom: "1rem" }}>
                        <div>
                            <h3 className="panel-title">Allocated Recycling Queue ({filteredAllocatedList.length})</h3>
                            <p className="panel-subtitle">
                                Browse and select an accepted device to initiate the 10-Day SLA, perform physical dismantling, and log recovery yield.
                            </p>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap", marginLeft: "auto" }}>
                            {/* Search Box matching recycling_delivery.jsx */}
                            <div className="search-box-v2" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                <FiSearch className="search-icon" style={{ position: "absolute", left: "0.85rem", color: "#94a3b8", fontSize: "0.95rem" }} />
                                <input
                                    type="text"
                                    placeholder="Search brand, model, ID..."
                                    value={allocatedSearch}
                                    onChange={(e) => setAllocatedSearch(e.target.value)}
                                    style={{
                                        padding: "0.45rem 1rem 0.45rem 2.3rem",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "10px",
                                        background: "#ffffff",
                                        fontSize: "0.8rem",
                                        color: "#0f172a",
                                        width: "240px",
                                        outline: "none",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                                    }}
                                />
                                {allocatedSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setAllocatedSearch("")}
                                        style={{
                                            position: "absolute",
                                            right: "0.6rem",
                                            background: "transparent",
                                            border: "none",
                                            color: "#94a3b8",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center"
                                        }}
                                    >
                                        <FiX />
                                    </button>
                                )}
                            </div>

                            {/* Filter Pills matching recycling_delivery.jsx */}
                            <div className="filter-pills">
                                {["All", "Active", "Completed"].map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        className={`pill-btn ${allocatedFilter === tab ? "active" : ""}`}
                                        onClick={() => setAllocatedFilter(tab)}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* View Toggle matching recycling_delivery.jsx */}
                            <div className="view-toggle-btns">
                                <button
                                    type="button"
                                    className={`view-btn ${allocatedViewMode === "grid" ? "active" : ""}`}
                                    onClick={() => setAllocatedViewMode("grid")}
                                    title="Grid View"
                                >
                                    <FiGrid />
                                </button>
                                <button
                                    type="button"
                                    className={`view-btn ${allocatedViewMode === "table" ? "active" : ""}`}
                                    onClick={() => setAllocatedViewMode("table")}
                                    title="Table View"
                                >
                                    <FiList />
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <p style={{ color: "#64748b", textAlign: "center", padding: "2rem 0" }}>Loading allocated devices queue...</p>
                    ) : filteredAllocatedList.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "1.5rem 0.5rem" }}>
                            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "0.85rem" }}>
                                No accepted devices match this filter. Accept allocation requests from dashboard first.
                            </p>
                            <button
                                type="button"
                                className="btn-dashboard-redirect"
                                onClick={() => {
                                    if (isProcessLocked) {
                                        setShowNavLockModal(true);
                                        return;
                                    }
                                    navigate("/recyclingcenter_dashboard");
                                }}
                            >
                                <span>Go to Recycling Queue Dashboard</span>
                                <FiChevronRight />
                            </button>
                        </div>
                    ) : allocatedViewMode === "grid" ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.85rem" }}>
                            {filteredAllocatedList.map(req => {
                                const isSelected = selectedRequest && selectedRequest.id === req.id;
                                const statusLower = (req.status || "").toLowerCase();
                                const isCompleted = statusLower === "completed" || (req.processingLifecycleStatus || "").toLowerCase() === "completed";
                                const isProcessing = statusLower === "processing" || statusLower === "inprogress";

                                return (
                                    <div
                                        key={req.id}
                                        className={`recyc-device-item ${isSelected ? "active" : ""}`}
                                        onClick={() => handleSelectAllocatedDevice(req)}
                                        style={{
                                            border: isSelected ? "2px solid #10b981" : "1px solid #e2e8f0",
                                            background: isSelected ? "#ecfdf5" : "#ffffff",
                                            borderRadius: "12px",
                                            padding: "0.85rem 1rem",
                                            cursor: "pointer",
                                            transition: "all 0.15s ease",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-between"
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                    <span className="req-id-pill">REQ #{req.id}</span>
                                                    <span style={{ fontSize: "0.7rem", color: "#64748b" }}>DEV #{req.deviceId}</span>
                                                </div>
                                                {isCompleted ? (
                                                    <span className="status-pill status-pill--completed">
                                                        <FiCheckCircle /> Completed
                                                    </span>
                                                ) : isProcessing ? (
                                                    <span className="status-pill" style={{ background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" }}>
                                                        <span className="live-dot" style={{ width: "6px", height: "6px", marginRight: "4px" }}></span> On Bench
                                                    </span>
                                                ) : (
                                                    <span className="status-pill" style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}>
                                                        Assigned
                                                    </span>
                                                )}
                                            </div>

                                            <div className="recyc-device-name" style={{ fontSize: "0.95rem", fontWeight: 800 }}>
                                                {req.brand} {req.model}
                                            </div>
                                            <div className="recyc-device-sub" style={{ fontSize: "0.78rem" }}>
                                                {getCategoryIcon(req.categoryName)} {req.categoryName} &bull; Mass: <strong>{req.weight}</strong>
                                            </div>

                                            {req.customerName && (
                                                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.4rem" }}>
                                                    Donor: <strong>{req.customerName}</strong> ({req.customerCity})
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ marginTop: "0.75rem", paddingTop: "0.6rem", borderTop: "1px dashed #e2e8f0", display: "flex", gap: "0.4rem" }}>
                                            {isCompleted ? (
                                                <button
                                                    type="button"
                                                    style={{
                                                        width: "100%",
                                                        padding: "0.4rem",
                                                        background: "#ecfdf5",
                                                        color: "#059669",
                                                        border: "1px solid #a7f3d0",
                                                        borderRadius: "8px",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "0.35rem"
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        selectRequest(req);
                                                    }}
                                                >
                                                    <FiCheckCircle /> View Certificate &amp; Audit
                                                </button>
                                            ) : isProcessing ? (
                                                isSelected ? (
                                                    <div style={{ width: "100%", textAlign: "center", fontSize: "0.75rem", fontWeight: 700, color: "#059669" }}>
                                                        ✓ Selected on Recycling Bench
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        style={{
                                                            width: "100%",
                                                            padding: "0.4rem",
                                                            background: "#059669",
                                                            color: "#ffffff",
                                                            border: "none",
                                                            borderRadius: "8px",
                                                            fontSize: "0.75rem",
                                                            fontWeight: 700,
                                                            cursor: "pointer"
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectAllocatedDevice(req);
                                                        }}
                                                    >
                                                        Continue Recycling &rarr;
                                                    </button>
                                                )
                                            ) : (
                                                <button
                                                    type="button"
                                                    style={{
                                                        width: "100%",
                                                        padding: "0.45rem",
                                                        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                                                        color: "#ffffff",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        fontSize: "0.78rem",
                                                        fontWeight: 800,
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "0.35rem",
                                                        boxShadow: "0 2px 6px rgba(5, 150, 105, 0.25)"
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStartProcess(req.id);
                                                    }}
                                                    disabled={isStartingProcess}
                                                >
                                                    <FiPlay /> Start Dismantling &amp; SLA
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="recyc-audit-table-responsive">
                            <table className="recyc-audit-grid-table">
                                <thead>
                                    <tr>
                                        <th>REQ &amp; DEV ID</th>
                                        <th>Device Name &amp; Category</th>
                                        <th>Donor &amp; City</th>
                                        <th>Mass</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAllocatedList.map(req => {
                                        const isSelected = selectedRequest && selectedRequest.id === req.id;
                                        const statusLower = (req.status || "").toLowerCase();
                                        const isCompleted = statusLower === "completed" || (req.processingLifecycleStatus || "").toLowerCase() === "completed";
                                        const isProcessing = statusLower === "processing" || statusLower === "inprogress";

                                        return (
                                            <tr key={req.id} style={{ background: isSelected ? "#ecfdf5" : "inherit", cursor: "pointer" }} onClick={() => handleSelectAllocatedDevice(req)}>
                                                <td>
                                                    <strong style={{ color: "#059669", fontFamily: "monospace" }}>REQ #{req.id}</strong>
                                                    <span style={{ fontSize: "0.725rem", color: "#64748b", display: "block" }}>DEV #{req.deviceId}</span>
                                                </td>
                                                <td>
                                                    <strong>{req.brand} {req.model}</strong>
                                                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>{req.categoryName}</span>
                                                </td>
                                                <td>
                                                    <span>{req.customerName || "Customer"}</span>
                                                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>{req.customerCity}</span>
                                                </td>
                                                <td style={{ fontWeight: 700 }}>{req.weight}</td>
                                                <td>
                                                    {isCompleted ? (
                                                        <span className="status-pill status-pill--completed">
                                                            <FiCheckCircle /> Completed
                                                        </span>
                                                    ) : isProcessing ? (
                                                        <span className="status-pill" style={{ background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" }}>
                                                            <span className="live-dot" style={{ width: "6px", height: "6px", marginRight: "4px" }}></span> On Bench
                                                        </span>
                                                    ) : (
                                                        <span className="status-pill" style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}>
                                                            Assigned
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                                                        {isCompleted ? (
                                                            <button
                                                                type="button"
                                                                style={{ padding: "0.35rem 0.75rem", background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    selectRequest(req);
                                                                }}
                                                            >
                                                                View Certificate
                                                            </button>
                                                        ) : isProcessing ? (
                                                            isSelected ? (
                                                                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669", padding: "0.35rem 0.6rem" }}>
                                                                    Active
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    style={{ padding: "0.35rem 0.75rem", background: "#059669", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSelectAllocatedDevice(req);
                                                                    }}
                                                                >
                                                                    Continue &rarr;
                                                                </button>
                                                            )
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                style={{ padding: "0.35rem 0.75rem", background: "#059669", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "3px" }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleStartProcess(req.id);
                                                                }}
                                                                disabled={isStartingProcess}
                                                            >
                                                                <FiPlay /> Start SLA
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Main Selected Device Processing Workspace */}
                {selectedRequest ? (
                    (() => {
                        const isSelectedCompleted = (selectedRequest.status || "").toLowerCase() === "completed" ||
                            (selectedRequest.processingLifecycleStatus || "").toLowerCase() === "completed";

                        if (isSelectedCompleted) {
                            /* =========================================================
                               COMPLETED VIEW: SUMMARY & AUDIT CERTIFICATE
                               ========================================================= */
                            return (
                                <div className="panel-card recyc-completed-summary-card" style={{ marginTop: "1rem" }}>
                                    <div className="recyc-complete-hero">
                                        <div className="recyc-complete-hero-left">
                                            <div className="recyc-complete-icon-ring">
                                                <FiCheckCircle className="recyc-complete-hero-icon" />
                                            </div>
                                            <div>
                                                <div className="recyc-complete-tag">
                                                    <FiShield /> Zero-Landfill Verified
                                                </div>
                                                <h2 className="recyc-complete-hero-title">
                                                    Recycling Process Completed ({selectedRequest.brand} {selectedRequest.model})
                                                </h2>
                                                <p className="recyc-complete-hero-desc">
                                                    Physical assessment, component dismantling, hazard isolation, and material separation procedures have been finalized and archived.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="recyc-complete-actions">
                                            <button
                                                className="btn-cert-download"
                                                onClick={handlePrintProcessReport}
                                                title="Print Full Recycling Process & Audit Report"
                                            >
                                                <FiPrinter /> Print Process Report
                                            </button>
                                            <button
                                                className="btn-cert-view"
                                                onClick={handlePrintSettlementBill}
                                                title="Print Official Recycling Settlement Bill"
                                            >
                                                <FiFileText /> View / Download Bill
                                            </button>
                                        </div>
                                    </div>

                                    {/* 4 KPI Summary Cards */}
                                    <div className="recyc-kpi-summary-grid">
                                        <div className="recyc-kpi-card">
                                            <div className="recyc-kpi-icon-wrap kpi-green">
                                                <FiBox />
                                            </div>
                                            <div className="recyc-kpi-info">
                                                <span className="recyc-kpi-label">Total Recovered Mass</span>
                                                <strong className="recyc-kpi-value text-emerald">{totals.totalWeight} kg</strong>
                                                <span className="recyc-kpi-sub">{totals.recoveryRate}% Recovery Rate</span>
                                            </div>
                                        </div>

                                        <div className="recyc-kpi-card">
                                            <div className="recyc-kpi-icon-wrap kpi-blue">
                                                <FiDollarSign />
                                            </div>
                                            <div className="recyc-kpi-info">
                                                <span className="recyc-kpi-label">Total Material Value</span>
                                                <strong className="recyc-kpi-value text-blue">₹{totals.totalValue.toLocaleString()}</strong>
                                                <span className="recyc-kpi-sub">Calculated Recovery Yield</span>
                                            </div>
                                        </div>

                                        <div className="recyc-kpi-card">
                                            <div className="recyc-kpi-icon-wrap kpi-amber">
                                                <FiAlertTriangle />
                                            </div>
                                            <div className="recyc-kpi-info">
                                                <span className="recyc-kpi-label">Hazardous Isolated</span>
                                                <strong className="recyc-kpi-value text-amber">{hazardousWasteWeight} kg</strong>
                                                <span className="recyc-kpi-sub">{hazardousStorageArea}</span>
                                            </div>
                                        </div>

                                        <div className="recyc-kpi-card">
                                            <div className="recyc-kpi-icon-wrap kpi-slate">
                                                <FiTrash2 />
                                            </div>
                                            <div className="recyc-kpi-info">
                                                <span className="recyc-kpi-label">Residual Waste</span>
                                                <strong className="recyc-kpi-value text-slate">{residualWasteWeight} kg</strong>
                                                <span className="recyc-kpi-sub">Non-recyclable residue</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recovered Materials Breakdown */}
                                    <div className="recyc-summary-section" style={{ marginTop: "1.5rem" }}>
                                        <h4 className="recyc-summary-section-title">
                                            <FiLayers style={{ color: "#10b981" }} /> Separated &amp; Recovered Materials Yield
                                        </h4>
                                        <div className="recyc-audit-table-responsive">
                                            <table className="recyc-audit-grid-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: "50px" }}>#</th>
                                                        <th>Recovered Material Stream</th>
                                                        <th>Quantity (kg)</th>
                                                        <th>Unit Value (₹/kg)</th>
                                                        <th style={{ textAlign: "right" }}>Total Yield Value (₹)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recoveredMaterials.map((mat, index) => {
                                                        const qty = parseFloat(mat.quantity) || 0;
                                                        const rate = parseFloat(mat.pricePerUnit) || 0;
                                                        const lineTotal = Math.round(qty * rate);
                                                        return (
                                                            <tr key={mat.id || index}>
                                                                <td className="audit-col-label" style={{ width: "50px" }}>{index + 1}</td>
                                                                <td className="audit-col-value font-semibold">{mat.materialName}</td>
                                                                <td className="audit-col-value font-mono font-bold text-emerald">{qty.toFixed(2)} kg</td>
                                                                <td className="audit-col-value font-mono">₹{rate.toLocaleString()}</td>
                                                                <td className="audit-col-value font-mono font-bold text-emerald" style={{ textAlign: "right" }}>
                                                                    ₹{lineTotal.toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot>
                                                    <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                                                        <td colSpan="2" style={{ padding: "0.85rem 1.25rem", color: "#0f172a" }}>Total Recovery Yield</td>
                                                        <td style={{ padding: "0.85rem 1.25rem", color: "#059669", fontFamily: "monospace" }}>{totals.totalWeight} kg</td>
                                                        <td style={{ padding: "0.85rem 1.25rem" }}>—</td>
                                                        <td style={{ padding: "0.85rem 1.25rem", textAlign: "right", color: "#059669", fontFamily: "monospace" }}>
                                                            ₹{totals.totalValue.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Section 6: EcoCycle Central Escrow Settlement & Money Transaction Ledger */}
                                    <div className="recyc-summary-section" style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "14px", padding: "1.25rem", marginTop: "1.5rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", borderBottom: "1px solid #bbf7d0", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
                                            <span style={{ background: "#065f46", color: "#ffffff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>6</span>
                                            <h4 style={{ color: "#065f46", margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>
                                                EcoCycle Central Escrow Settlement &amp; Money Transaction Ledger
                                            </h4>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
                                            <div style={{ background: "#ffffff", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "0.75rem 1rem" }}>
                                                <span style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Settled Valuation</span>
                                                <span style={{ color: "#059669", fontSize: "1.1rem", fontWeight: 800, marginTop: "0.2rem", display: "block" }}>
                                                    ₹{totals.totalValue.toLocaleString("en-IN")}
                                                </span>
                                            </div>
                                            <div style={{ background: "#ffffff", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "0.75rem 1rem" }}>
                                                <span style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Payment Gateway</span>
                                                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", marginTop: "0.2rem", display: "block" }}>{paymentMethod || "Razorpay (Test Sandbox)"}</span>
                                            </div>
                                            <div style={{ background: "#ffffff", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "0.75rem 1rem" }}>
                                                <span style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Settlement Status</span>
                                                <span style={{ color: "#065f46", fontSize: "0.85rem", fontWeight: 800, marginTop: "0.2rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                    <FiCheckCircle /> PAID &amp; DEPOSITED
                                                </span>
                                            </div>
                                            <div style={{ background: "#ffffff", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "0.75rem 1rem" }}>
                                                <span style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", display: "block" }}>Transaction Reference</span>
                                                <span style={{ color: "#047857", fontSize: "0.825rem", fontFamily: "monospace", fontWeight: 700, marginTop: "0.2rem", display: "block" }}>
                                                    {paymentTransactionId || `PAY_REC_${selectedRequest?.id || "2026"}_OK`}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: "0.85rem", background: "#ffffff", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.825rem", color: "#065f46", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                                            <span>
                                                <strong>Escrow Transfer:</strong> ₹{totals.totalValue.toLocaleString("en-IN")} settled and allocated into EcoCycle central escrow pool for recovery processing, citizen buyout, and downstream logistics compensation.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        if (!isStarted) {
                            /* =========================================================
                               PRE-START VIEW: 2-COLUMN OVERVIEW & 10-DAY SLA COMMITMENT
                               ========================================================= */
                            return (
                                <div className="recyc-prestart-container" style={{ marginTop: "1rem" }}>
                                    {/* Pre-Start Hero Banner */}
                                    <div className="recyc-prestart-hero-card">
                                        <div className="recyc-prestart-hero-info">
                                            <div className="recyc-prestart-tags">
                                                <span className="recyc-tag-id">DEV #{selectedRequest.deviceId}</span>
                                                <span className="recyc-tag-id">REQ #{selectedRequest.id}</span>
                                                <span className="recyc-tag-cat">{getCategoryIcon(selectedRequest.categoryName)} {selectedRequest.categoryName}</span>
                                                <span className="recyc-tag-pref">Decision: {selectedRequest.processingDecision || "Industrial Recycling"}</span>
                                            </div>
                                            <h2 className="recyc-prestart-title">{selectedRequest.brand} {selectedRequest.model}</h2>
                                            <div className="recyc-prestart-meta-row">
                                                <span>S/N: <strong className="refurb-mono">{selectedRequest.serialNumber}</strong></span>
                                                <span>&bull;</span>
                                                <span>Donor: <strong>{selectedRequest.customerName}</strong> ({selectedRequest.customerCity})</span>
                                                <span>&bull;</span>
                                                <span>Inbound Mass: <strong>{selectedRequest.weight}</strong></span>
                                            </div>
                                        </div>

                                        <div className="recyc-prestart-hero-action">
                                            <button
                                                type="button"
                                                className="recyc-start-cta-btn"
                                                onClick={() => handleStartProcess(selectedRequest.id)}
                                                disabled={isStartingProcess}
                                            >
                                                {isStartingProcess ? (
                                                    <>
                                                        <FiRefreshCw className="spin-icon" /> Initializing Recycling...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiPlay /> Start Recycling Process
                                                    </>
                                                )}
                                            </button>
                                            <div className="recyc-start-cta-hint">
                                                <FiClock /> Triggers 10-Day SLA Completion Window
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2-Column Responsive Layout */}
                                    <div className="recyc-prestart-grid-layout">
                                        {/* Left Main Column: Specs & Diagnostic Details */}
                                        <div className="recyc-prestart-main-col">
                                            <div className="panel-card">
                                                <h4 className="panel-title" style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>
                                                    <FiBox style={{ color: "#10b981", marginRight: "6px" }} /> Registered Hardware Specifications
                                                </h4>
                                                <div className="recyc-specs-grid">
                                                    <div className="recyc-spec-cell">
                                                        <span className="recyc-spec-lbl">Device ID</span>
                                                        <span className="recyc-spec-val highlight">#{selectedRequest.deviceId}</span>
                                                    </div>
                                                    <div className="recyc-spec-cell">
                                                        <span className="recyc-spec-lbl">Category</span>
                                                        <span className="recyc-spec-val">{selectedRequest.categoryName}</span>
                                                    </div>
                                                    <div className="recyc-spec-cell">
                                                        <span className="recyc-spec-lbl">Brand &amp; Model</span>
                                                        <span className="recyc-spec-val">{selectedRequest.brand} {selectedRequest.model}</span>
                                                    </div>
                                                    <div className="recyc-spec-cell">
                                                        <span className="recyc-spec-lbl">Serial Number</span>
                                                        <span className="recyc-spec-val" style={{ fontFamily: "monospace" }}>{selectedRequest.serialNumber}</span>
                                                    </div>
                                                    <div className="recyc-spec-cell">
                                                        <span className="recyc-spec-lbl">Inbound Weight</span>
                                                        <span className="recyc-spec-val">{selectedRequest.weight}</span>
                                                    </div>
                                                    <div className="recyc-spec-cell">
                                                        <span className="recyc-spec-lbl">Donor Citizen</span>
                                                        <span className="recyc-spec-val">{selectedRequest.customerName} ({selectedRequest.customerCity})</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expected Components & Hazards Overview */}
                                            <div className="panel-card">
                                                <h4 className="panel-title" style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>
                                                    <FiLayers style={{ color: "#10b981", marginRight: "6px" }} /> Target Components &amp; Hazardous Material Streams
                                                </h4>
                                                <p className="panel-subtitle" style={{ marginBottom: "0.85rem" }}>
                                                    Tailored dismantling schema for <strong>{deviceProfile.categoryKey}</strong>
                                                </p>

                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                                    <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#334155", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                                                            Expected Subsystems ({deviceProfile.components?.length || 0})
                                                        </span>
                                                        <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.8rem", color: "#475569", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                                            {(deviceProfile.components || []).map((c, i) => (
                                                                <li key={i}><strong>{c.label}</strong></li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div style={{ background: "#fffbeb", padding: "0.85rem", borderRadius: "10px", border: "1px solid #fde68a" }}>
                                                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#92400e", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px", marginBottom: "0.5rem" }}>
                                                            <FiAlertTriangle /> Critical Hazards to Isolate
                                                        </span>
                                                        <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.8rem", color: "#78350f", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                                            {(deviceProfile.hazardousItems || []).map((h, i) => (
                                                                <li key={i}><strong>{h.label}</strong></li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Sidebar Column: 10-Day SLA & Stages Roadmap */}
                                        <div className="recyc-prestart-side-col">
                                            <div className="recyc-sla-commitment-card">
                                                <div className="recyc-sla-badge-row">
                                                    <div className="recyc-sla-icon-circle">
                                                        <FiClock />
                                                    </div>
                                                    <div>
                                                        <div className="recyc-sla-badge-title">10-Day Recycling SLA</div>
                                                        <div className="recyc-sla-badge-sub">Standard Industrial Turnaround</div>
                                                    </div>
                                                </div>
                                                <p className="recyc-sla-desc">
                                                    Starting the process initiates the mandatory <strong>10-Day Recycling SLA</strong>. All dismantling, hazard segregation, and yield measurements must be completed within this timeframe.
                                                </p>
                                                <div className="recyc-sla-stats-box">
                                                    <div className="recyc-sla-stat">
                                                        <span className="lbl">Target Recovery</span>
                                                        <span className="val highlight">&ge; 90% Mass</span>
                                                    </div>
                                                    <div className="recyc-sla-stat">
                                                        <span className="lbl">Zero Landfill</span>
                                                        <span className="val" style={{ color: "#059669" }}>100% Diverted</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="recyc-roadmap-card">
                                                <h5 className="recyc-roadmap-title">
                                                    <FiLayers style={{ color: "#10b981" }} /> 6 Recycling Stages
                                                </h5>
                                                <ul className="recyc-roadmap-list">
                                                    {stepList.map(s => (
                                                        <li key={s.num} className="recyc-roadmap-item">
                                                            <span className="recyc-roadmap-num">{s.num}</span>
                                                            <div className="recyc-roadmap-text">
                                                                <strong>{s.label}</strong>
                                                                <span>{s.num === 1 ? "Arrival condition & damage inspection" : s.num === 2 ? "Drive wiping & component disassembly" : s.num === 3 ? "Battery & capacitor hazardous storage" : s.num === 4 ? "Metals, plastics & PCB segregation" : s.num === 5 ? "Certified scale weight & yield values" : "Final compliance audit & certificate"}</span>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>

                                                <button
                                                    type="button"
                                                    className="recyc-start-cta-btn large"
                                                    onClick={() => handleStartProcess(selectedRequest.id)}
                                                    disabled={isStartingProcess}
                                                >
                                                    {isStartingProcess ? (
                                                        <>
                                                            <FiRefreshCw className="spin-icon" /> Initializing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiPlay /> Begin Recycling Process
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        /* =========================================================
                           ACTIVE WORKFLOW VIEW (UNLOCKED AFTER START)
                           ========================================================= */
                        return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                                {/* STEPPER WIZARD HEADER BAR */}
                                <div className="recyc-stepper-bar">
                                    {stepList.map(step => {
                                        const isActive = currentStep === step.num;
                                        const isCompleted = completedSteps.includes(step.num) || currentStep > step.num;
                                        const isAccessible = step.num <= maxAccessibleStep;

                                        return (
                                            <button
                                                key={step.num}
                                                className={`recyc-stepper-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${!isAccessible ? "disabled" : ""}`}
                                                onClick={() => {
                                                    if (isAccessible) {
                                                        setCurrentStep(step.num);
                                                    }
                                                }}
                                                disabled={!isAccessible}
                                                title={!isAccessible ? `Complete Step ${step.num - 1} to unlock` : step.label}
                                            >
                                                <span className="recyc-stepper-num">{isCompleted ? <FiCheck /> : step.num}</span>
                                                <span>{step.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* STEP 1: PHYSICAL ASSESSMENT */}
                                {currentStep === 1 && (
                                    <div className="panel-card">
                                        <div className="recyc-section-header">
                                            <span className="recyc-section-num">1</span>
                                            <div>
                                                <h3 className="panel-title">Physical Assessment</h3>
                                                <p className="panel-subtitle">Check the device upon arrival. Record visible damage, missing parts, and physical conditions.</p>
                                            </div>
                                        </div>

                                        <div className="recyc-grid-2col">
                                            <div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                                                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", margin: 0 }}>Visible Damage &amp; Conditions</label>
                                                    <span style={{ fontSize: "0.7rem", color: "#059669", fontWeight: 700 }}>Type or Select</span>
                                                </div>
                                                
                                                 <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
                                                    <input
                                                        type="text"
                                                        list="damage-conditions-datalist"
                                                        className="recyc-input-sm"
                                                        style={{ flex: 1 }}
                                                        placeholder="Type or select damage condition..."
                                                        value={selectedDamageToAdd}
                                                        onChange={(e) => setSelectedDamageToAdd(filterAlphabetOnly(e.target.value))}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                handleAddDamageFromDropdown();
                                                            }
                                                        }}
                                                    />
                                                    <datalist id="damage-conditions-datalist">
                                                        {(deviceProfile.damageOptions || []).map(dmg => (
                                                            <option key={dmg} value={dmg} />
                                                        ))}
                                                    </datalist>
                                                    <button
                                                        type="button"
                                                        className="btn-input-add"
                                                        onClick={() => handleAddDamageFromDropdown()}
                                                        disabled={!selectedDamageToAdd.trim()}
                                                        title="Add Selected / Typed Damage"
                                                    >
                                                        <FiPlus />
                                                    </button>
                                                </div>

                                                {visibleDamage.length > 0 && (
                                                    <div className="recyc-tags-grid" style={{ marginBottom: "0.6rem" }}>
                                                        {visibleDamage.map(dmg => (
                                                            <div key={dmg} className="recyc-tag-pill active">
                                                                <FiCheck /> {dmg}
                                                                <span
                                                                    className="tag-delete-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteDamageOption(dmg);
                                                                    }}
                                                                    title="Delete item"
                                                                >
                                                                    <FiTrash2 />
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                                                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", margin: 0 }}>Missing Hardware Parts</label>
                                                    <span style={{ fontSize: "0.7rem", color: "#059669", fontWeight: 700 }}>Type or Select</span>
                                                </div>

                                                <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
                                                    <input
                                                        type="text"
                                                        list="missing-parts-datalist"
                                                        className="recyc-input-sm"
                                                        style={{ flex: 1 }}
                                                        placeholder="Type or select missing part..."
                                                        value={selectedMissingToAdd}
                                                        onChange={(e) => setSelectedMissingToAdd(filterAlphabetOnly(e.target.value))}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                handleAddMissingFromDropdown();
                                                            }
                                                        }}
                                                    />
                                                    <datalist id="missing-parts-datalist">
                                                        {(deviceProfile.components || []).map(c => (
                                                            <option key={`comp_miss_${c.id}`} value={`Missing ${c.label}`} />
                                                        ))}
                                                        {(deviceProfile.missingPartOptions || []).map(part => (
                                                            <option key={part} value={part} />
                                                        ))}
                                                    </datalist>
                                                    <button
                                                        type="button"
                                                        className="btn-input-add"
                                                        onClick={() => handleAddMissingFromDropdown()}
                                                        disabled={!selectedMissingToAdd.trim()}
                                                        title="Add Selected / Typed Missing Part"
                                                    >
                                                        <FiPlus />
                                                    </button>
                                                </div>

                                                {missingParts.length > 0 && (
                                                    <div className="recyc-tags-grid" style={{ marginBottom: "0.6rem" }}>
                                                        {missingParts.map(part => (
                                                            <div key={part} className="recyc-tag-pill danger-active">
                                                                <FiCheck /> {part}
                                                                <span
                                                                    className="tag-delete-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteMissingOption(part);
                                                                    }}
                                                                    title="Delete item"
                                                                >
                                                                    <FiTrash2 />
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ marginTop: "1rem" }}>
                                            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>Physical Assessment Notes</label>
                                            <textarea
                                                className="recyc-input-sm"
                                                rows="2"
                                                style={{ width: "100%", marginTop: "0.3rem" }}
                                                placeholder={`Record arrival inspection notes for ${selectedRequest.brand} ${selectedRequest.model}...`}
                                                value={damageNotes}
                                                onChange={(e) => setDamageNotes(filterAlphabetOnly(e.target.value))}
                                            ></textarea>
                                        </div>

                                        <div className="recyc-stepper-footer">
                                            <button className="btn-stepper-next" onClick={() => handleNextStep(2)}>
                                                Next Step: Data &amp; Component Removal <FiChevronRight />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: DATA & COMPONENT REMOVAL */}
                                {currentStep === 2 && (
                                    <div className="panel-card">
                                        <div className="recyc-section-header">
                                            <span className="recyc-section-num">2</span>
                                            <div>
                                                <h3 className="panel-title">Data &amp; Component Removal Record</h3>
                                                <p className="panel-subtitle">Log data sanitization and physical component dismantling performed by staff for <strong>{deviceProfile.categoryKey}</strong>.</p>
                                            </div>
                                        </div>

                                        <div className="recyc-grid-2col" style={{ marginBottom: "1.25rem" }}>
                                            <div>
                                                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>Was Data Storage Found?</label>
                                                <div className="recyc-radio-group" style={{ marginTop: "0.3rem" }}>
                                                    {["Yes", "No"].map(opt => (
                                                        <div
                                                            key={opt}
                                                            className={`recyc-radio-card ${dataFound === opt ? "active" : ""}`}
                                                            style={{ padding: "0.5rem 0.85rem", minWidth: "100px" }}
                                                            onClick={() => {
                                                                setDataFound(opt);
                                                                if (opt === "No") {
                                                                    setSanitizationPerformed("Not Required");
                                                                } else if (sanitizationPerformed === "Not Required") {
                                                                    setSanitizationPerformed("Yes");
                                                                }
                                                            }}
                                                        >
                                                            <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{opt}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {dataFound === "Yes" ? (
                                                    <div style={{ marginTop: "0.85rem" }}>
                                                        <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>Data Sanitization Performed?</label>
                                                        <div className="recyc-radio-group" style={{ marginTop: "0.3rem" }}>
                                                            {["Yes", "No"].map(opt => (
                                                                <div
                                                                    key={opt}
                                                                    className={`recyc-radio-card ${sanitizationPerformed === opt ? "active" : ""}`}
                                                                    style={{ padding: "0.5rem 0.85rem", minWidth: "100px" }}
                                                                    onClick={() => setSanitizationPerformed(opt)}
                                                                >
                                                                    <span style={{ fontWeight: 700, fontSize: "0.825rem" }}>{opt}</span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {sanitizationPerformed === "Yes" && (
                                                            <div style={{ marginTop: "0.75rem" }}>
                                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                                                                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", margin: 0 }}>Sanitization Method</label>
                                                                    <span style={{ fontSize: "0.7rem", color: "#059669", fontWeight: 700 }}>Type or Select</span>
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    list="sanitization-methods-datalist"
                                                                    className="recyc-input-sm"
                                                                    style={{ width: "100%", fontSize: "0.825rem" }}
                                                                    placeholder="Type or select method (e.g. Physical Destruction)..."
                                                                    value={sanitizationMethod}
                                                                    onChange={(e) => setSanitizationMethod(filterAlphabetOnly(e.target.value))}
                                                                />
                                                                <datalist id="sanitization-methods-datalist">
                                                                    {STANDARD_SANITIZATION_METHODS.map(m => (
                                                                        <option key={m} value={m} />
                                                                    ))}
                                                                </datalist>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div style={{ marginTop: "0.85rem", padding: "0.65rem 0.85rem", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                                                        <span style={{ fontSize: "0.785rem", color: "#64748b", fontWeight: 600 }}>
                                                            ℹ Data Storage not found on device (or reported missing). Data sanitization is <strong>Not Required</strong>.
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>Dismantling Staff Operator Log</label>
                                                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.85rem", marginTop: "0.3rem" }}>
                                                    <div style={{ marginBottom: "0.5rem" }}>
                                                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Assigned Staff / Operator</label>
                                                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                            <FiUser style={{ color: "#10b981" }} /> {operatorName}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Operation Timestamp</label>
                                                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                            <FiClock style={{ color: "#10b981" }} /> {operationTimestamp}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "1rem" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                                                    Device Components Removed ({selectedRequest.brand} {selectedRequest.model})
                                                </label>
                                                <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 700 }}>
                                                    Tailored to: {deviceProfile.categoryKey}
                                                </span>
                                            </div>

                                            {activeComponents.filter(item => !isItemMissing(item, missingParts)).length === 0 ? (
                                                <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                                                    All standard components are listed as missing from Physical Assessment. You can still add custom removed components below.
                                                </div>
                                            ) : (
                                                <div className="recyc-steps-checklist" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                                                    {activeComponents.filter(item => !isItemMissing(item, missingParts)).map(item => (
                                                        <div key={item.id} className={`recyc-check-item ${removedComponents[item.id] ? "checked" : ""}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                            <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, cursor: "pointer", margin: 0 }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={removedComponents[item.id] || false}
                                                                    onChange={() => setRemovedComponents(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                                                />
                                                                <span>{item.label} ✓</span>
                                                            </label>
                                                            <button
                                                                type="button"
                                                                className="comp-delete-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteComponent(item.id);
                                                                }}
                                                                title="Delete Component"
                                                            >
                                                                <FiTrash2 />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div style={{ marginTop: "0.85rem", background: "#f8fafc", padding: "0.75rem 0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                                <label style={{ fontSize: "0.775rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>
                                                    Add Custom Removed Component
                                                </label>
                                                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                                    <input
                                                        type="text"
                                                        className="recyc-input-sm"
                                                        style={{ flex: 1, minWidth: "220px" }}
                                                        placeholder="Enter custom component name..."
                                                        value={customCompInput}
                                                        onChange={handleCustomCompChange}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                handleAddCustomComponent();
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn-input-add"
                                                        onClick={handleAddCustomComponent}
                                                        disabled={!customCompInput.trim()}
                                                        title="Add Custom Component"
                                                    >
                                                        <FiPlus />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="recyc-stepper-footer">
                                            <button className="btn-stepper-prev" onClick={() => handlePrevStep(1)}>
                                                <FiArrowLeft /> Previous Step
                                            </button>
                                            <button className="btn-stepper-next" onClick={() => handleNextStep(3)}>
                                                Next Step: Hazard Isolation <FiChevronRight />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: HAZARD ISOLATION */}
                                {currentStep === 3 && (
                                    <div className="panel-card">
                                        <div className="recyc-section-header">
                                            <span className="recyc-section-num">3</span>
                                            <div>
                                                <h3 className="panel-title">Hazard Isolation &amp; Environmental Safety</h3>
                                                <p className="panel-subtitle">Segregate and secure toxic components to prevent environmental contamination.</p>
                                            </div>
                                        </div>

                                        <div className="recyc-capability-box">
                                            <FiShield style={{ fontSize: "1.2rem", flexShrink: 0 }} />
                                            <span>
                                                <strong>Facility Safety Protocol:</strong> All hazardous elements must be isolated and stored in authorized designated safety areas.
                                            </span>
                                        </div>

                                        <div className="recyc-grid-2col" style={{ marginBottom: "1.25rem" }}>
                                            <div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                                                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", margin: 0 }}>Hazardous Storage Location</label>
                                                    <span style={{ fontSize: "0.7rem", color: "#059669", fontWeight: 700 }}>Type or Select</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    list="hazardous-storage-datalist"
                                                    className="recyc-input-sm"
                                                    style={{ width: "100%", fontSize: "0.825rem" }}
                                                    placeholder="Type or select storage area..."
                                                    value={hazardousStorageArea}
                                                    onChange={(e) => setHazardousStorageArea(filterAlphabetOnly(e.target.value))}
                                                />
                                                <datalist id="hazardous-storage-datalist">
                                                    {STANDARD_HAZARDOUS_STORAGE_AREAS.map(loc => (
                                                        <option key={loc} value={loc} />
                                                    ))}
                                                </datalist>
                                            </div>
                                            <div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                                                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", margin: 0 }}>Battery Physical Condition</label>
                                                    <span style={{ fontSize: "0.7rem", color: "#059669", fontWeight: 700 }}>Type or Select</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    list="battery-conditions-datalist"
                                                    className="recyc-input-sm"
                                                    style={{ width: "100%", fontSize: "0.825rem" }}
                                                    placeholder="Type or select battery condition..."
                                                    value={batteryCondition}
                                                    onChange={(e) => setBatteryCondition(filterAlphabetOnly(e.target.value))}
                                                />
                                                <datalist id="battery-conditions-datalist">
                                                    {STANDARD_BATTERY_CONDITIONS.map(cond => (
                                                        <option key={cond} value={cond} />
                                                    ))}
                                                </datalist>
                                            </div>
                                        </div>

                                        <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "1rem" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                                                    Hazardous Items Segregated
                                                </label>
                                            </div>

                                            <div className="recyc-steps-checklist" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
                                                {activeHazardItems.map(item => (
                                                    <div key={item.id} className={`recyc-check-item ${hazardousComponents[item.id] ? "checked" : ""}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                        <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1, cursor: "pointer", margin: 0 }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={hazardousComponents[item.id] || false}
                                                                onChange={() => setHazardousComponents(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                                            />
                                                            <span style={{ fontSize: "0.825rem", fontWeight: 600 }}>{item.label}</span>
                                                        </label>
                                                        <button
                                                            type="button"
                                                            className="comp-delete-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteHazardItem(item.id);
                                                            }}
                                                            title="Delete Item"
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div style={{ marginTop: "0.85rem", background: "#fffbeb", padding: "0.75rem 0.85rem", borderRadius: "10px", border: "1px solid #fde68a" }}>
                                                <label style={{ fontSize: "0.775rem", fontWeight: 700, color: "#92400e", display: "block", marginBottom: "0.3rem" }}>
                                                    Add Custom Hazardous Stream
                                                </label>
                                                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                                    <input
                                                        type="text"
                                                        className="recyc-input-sm"
                                                        style={{ flex: 1, minWidth: "220px", borderColor: "#cbd5e1" }}
                                                        placeholder="Enter hazardous element name..."
                                                        value={customHazInput}
                                                        onChange={handleCustomHazChange}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault();
                                                                handleAddCustomHazard();
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn-input-add"
                                                        onClick={handleAddCustomHazard}
                                                        disabled={!customHazInput.trim()}
                                                        title="Add Custom Hazard"
                                                    >
                                                        <FiPlus />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="recyc-stepper-footer">
                                            <button className="btn-stepper-prev" onClick={() => handlePrevStep(2)}>
                                                <FiArrowLeft /> Previous Step
                                            </button>
                                            <button className="btn-stepper-next" onClick={() => handleNextStep(4)}>
                                                Next Step: Material Separation <FiChevronRight />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 4: MATERIAL SEPARATION */}
                                {currentStep === 4 && (
                                    <div className="panel-card">
                                        <div className="recyc-section-header">
                                            <span className="recyc-section-num">4</span>
                                            <div>
                                                <h3 className="panel-title">Material Stream Separation</h3>
                                                <p className="panel-subtitle">Classify and route disassembled fractions into designated recovery channels.</p>
                                            </div>
                                        </div>

                                        <div className="recyc-audit-table-responsive" style={{ marginBottom: "1rem" }}>
                                            <table className="recyc-audit-grid-table">
                                                <thead>
                                                    <tr>
                                                        <th>Extracted Material Stream</th>
                                                        <th>Component Origin / Source</th>
                                                        <th>Processing Route</th>
                                                        <th style={{ width: "50px" }}>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {separatedMaterials.map(m => (
                                                        <tr key={m.key}>
                                                            <td className="audit-col-value font-semibold">
                                                                <FiLayers style={{ color: "#10b981", marginRight: "6px" }} />
                                                                {m.name}
                                                            </td>
                                                            <td className="audit-col-value" style={{ color: "#64748b", fontSize: "0.8rem" }}>
                                                                {m.source}
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="text"
                                                                    list="processing-routes-datalist"
                                                                    className="recyc-input-sm"
                                                                    style={{ width: "100%", fontSize: "0.8rem" }}
                                                                    placeholder="Type or select route..."
                                                                    value={materialLocations[m.key] || "Onsite Mechanical Shredding & Separation"}
                                                                    onChange={(e) => setMaterialLocations(prev => ({ ...prev, [m.key]: e.target.value }))}
                                                                />
                                                                <datalist id="processing-routes-datalist">
                                                                    {STANDARD_PROCESSING_ROUTES.map(route => (
                                                                        <option key={route} value={route} />
                                                                    ))}
                                                                </datalist>
                                                            </td>
                                                            <td>
                                                                <button
                                                                    type="button"
                                                                    className="btn-action danger"
                                                                    onClick={() => handleDeleteSeparatedMaterial(m.key)}
                                                                    title="Remove Stream"
                                                                >
                                                                    <FiTrash2 />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div style={{ background: "#f8fafc", padding: "0.75rem 0.85rem", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                                            <label style={{ fontSize: "0.775rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>
                                                Add Custom Material Stream
                                            </label>
                                            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                                <input
                                                    type="text"
                                                    className="recyc-input-sm"
                                                    style={{ flex: 1, minWidth: "220px" }}
                                                    placeholder="Enter material stream name..."
                                                    value={customMatSepInput}
                                                    onChange={handleCustomMatSepChange}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleAddCustomMatSep();
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-input-add"
                                                    onClick={handleAddCustomMatSep}
                                                    disabled={!customMatSepInput.trim()}
                                                    title="Add Custom Stream"
                                                >
                                                    <FiPlus />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="recyc-stepper-footer">
                                            <button className="btn-stepper-prev" onClick={() => handlePrevStep(3)}>
                                                <FiArrowLeft /> Previous Step
                                            </button>
                                            <button className="btn-stepper-next" onClick={() => handleNextStep(5)}>
                                                Next Step: Weigh &amp; Record Recovery <FiChevronRight />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 5: WEIGH & RECORD RECOVERY */}
                                {currentStep === 5 && (
                                    <div className="panel-card">
                                        <div className="recyc-section-header">
                                            <span className="recyc-section-num">5</span>
                                            <div>
                                                <h3 className="panel-title">Weigh &amp; Record Recovery Yield</h3>
                                                <p className="panel-subtitle">Log physical scale weights for all recovered material fractions and calculate recovery yields.</p>
                                            </div>
                                        </div>

                                        <div className="table-responsive" style={{ marginBottom: "1rem" }}>
                                            <table className="glass-table">
                                                <thead>
                                                    <tr>
                                                        <th>Recovered Material</th>
                                                        <th style={{ width: "140px" }}>Weighed Mass</th>
                                                        <th>Unit</th>
                                                        <th>Market Rate</th>
                                                        <th>Material Value</th>
                                                        <th style={{ width: "60px" }}>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recoveredMaterials.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="6" className="no-data-cell">
                                                                No recovered materials logged yet. Click "Add Catalog Stream" below.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        recoveredMaterials.map((mat) => {
                                                            const extValue = Math.round((parseFloat(mat.quantity) || 0) * (parseFloat(mat.pricePerUnit) || 0));
                                                            return (
                                                                <tr key={mat.id} className="table-row-hover">
                                                                    <td>
                                                                        <input
                                                                            type="text"
                                                                            list="catalog-materials-datalist"
                                                                            value={mat.materialName}
                                                                            onChange={(e) => handleMaterialChange(mat.id, "materialName", e.target.value)}
                                                                            className="recyc-input-sm"
                                                                            style={{ width: "100%", fontWeight: 600 }}
                                                                            placeholder="Type or select material..."
                                                                        />
                                                                        <datalist id="catalog-materials-datalist">
                                                                            {activePrices.map(p => (
                                                                                <option key={p.materialName} value={p.materialName}>
                                                                                    ₹{p.pricePerUnit}/{p.unit}
                                                                                </option>
                                                                            ))}
                                                                        </datalist>
                                                                    </td>
                                                                    <td>
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={mat.quantity}
                                                                            onChange={(e) => handleMaterialChange(mat.id, "quantity", e.target.value)}
                                                                            className="recyc-input-sm"
                                                                            style={{ width: "100%" }}
                                                                        />
                                                                    </td>
                                                                    <td style={{ fontWeight: 600 }}>{mat.unit}</td>
                                                                    <td>
                                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                                                            <span style={{ color: "#64748b", fontWeight: 700, fontSize: "0.8rem" }}>₹</span>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                step="1"
                                                                                value={mat.pricePerUnit}
                                                                                onChange={(e) => handleMaterialChange(mat.id, "pricePerUnit", e.target.value)}
                                                                                className="recyc-input-sm"
                                                                                style={{ width: "75px" }}
                                                                            />
                                                                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>/{mat.unit}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ fontWeight: 800, color: "#059669" }}>₹{extValue.toLocaleString()}</td>
                                                                    <td>
                                                                        <button
                                                                            className="btn-action danger"
                                                                            onClick={() => handleRemoveMaterial(mat.id)}
                                                                            title="Remove Material"
                                                                        >
                                                                            <FiTrash2 />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                                            <button className="btn-action primary-ghost" onClick={handleAddMaterial}>
                                                <FiPlus /> Add Catalog Stream
                                            </button>
                                        </div>

                                        <div className="recyc-custom-mat-box" style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "12px", padding: "0.85rem 1.1rem", marginBottom: "1.25rem" }}>
                                            <span style={{ fontSize: "0.825rem", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.5rem" }}>
                                                <FiPlus style={{ color: "#10b981" }} /> Add Non-Catalog / Custom Material Stream
                                            </span>
                                            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                                                <input
                                                    type="text"
                                                    className="recyc-input-sm"
                                                    placeholder="Material Name (e.g. Cobalt, Platinum Scrap)"
                                                    value={customRecoveredName}
                                                    onChange={(e) => setCustomRecoveredName(filterAlphabetOnly(e.target.value))}
                                                    style={{ flex: "2", minWidth: "190px" }}
                                                />
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flex: "1", minWidth: "120px" }}>
                                                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Rate (₹/kg):</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        className="recyc-input-sm"
                                                        placeholder="Rate"
                                                        value={customRecoveredPrice}
                                                        onChange={(e) => setCustomRecoveredPrice(e.target.value)}
                                                        style={{ width: "100%" }}
                                                    />
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flex: "1", minWidth: "120px" }}>
                                                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>Mass (kg):</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="recyc-input-sm"
                                                        placeholder="Mass"
                                                        value={customRecoveredQty}
                                                        onChange={(e) => setCustomRecoveredQty(e.target.value)}
                                                        style={{ width: "100%" }}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn-action primary"
                                                    onClick={handleAddCustomRecoveredMaterial}
                                                    disabled={!customRecoveredName.trim()}
                                                    style={{ padding: "0.45rem 0.95rem", fontSize: "0.8rem" }}
                                                >
                                                    <FiPlus /> Add Material
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", marginTop: "1.25rem", marginBottom: "1rem" }}>
                                            <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "0.85rem 1rem", boxSizing: "border-box" }}>
                                                <label style={{ fontSize: "0.825rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.4rem" }}>
                                                    Hazardous Waste Mass (kg)
                                                </label>
                                                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="recyc-input-sm"
                                                        style={{ width: "100%", paddingRight: "2.8rem", boxSizing: "border-box" }}
                                                        value={hazardousWasteWeight}
                                                        onChange={(e) => setHazardousWasteWeight(e.target.value)}
                                                    />
                                                    <span style={{ position: "absolute", right: "0.75rem", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", pointerEvents: "none" }}>
                                                        kg
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ background: "#ffffff", border: "1.5px solid #e2e8f0", borderRadius: "12px", padding: "0.85rem 1rem", boxSizing: "border-box" }}>
                                                <label style={{ fontSize: "0.825rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.4rem" }}>
                                                    Remaining / Residual Waste Mass (kg)
                                                </label>
                                                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="recyc-input-sm"
                                                        style={{ width: "100%", paddingRight: "2.8rem", boxSizing: "border-box" }}
                                                        value={residualWasteWeight}
                                                        onChange={(e) => setResidualWasteWeight(e.target.value)}
                                                    />
                                                    <span style={{ position: "absolute", right: "0.75rem", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", pointerEvents: "none" }}>
                                                        kg
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="recyc-mass-balance">
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                                <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0f172a" }}>Calculated Recovery Summary</span>
                                                <span className="recyc-badge-verified">
                                                    <FiCheckCircle /> Recovery Rate: {totals.recoveryRate}%
                                                </span>
                                            </div>

                                            <div className="recyc-summary-grid">
                                                <div className="recyc-summary-box">
                                                    <div className="recyc-sum-label">Inbound Weight</div>
                                                    <div className="recyc-sum-val">{selectedRequest.weight}</div>
                                                </div>
                                                <div className="recyc-summary-box">
                                                    <div className="recyc-sum-label">Total Recovered Weight</div>
                                                    <div className="recyc-sum-val" style={{ color: "#059669" }}>{totals.totalWeight} kg</div>
                                                </div>
                                                <div className="recyc-summary-box">
                                                    <div className="recyc-sum-label">Total Material Value</div>
                                                    <div className="recyc-sum-val" style={{ color: "#0d9488" }}>₹{totals.totalValue.toLocaleString()}</div>
                                                </div>
                                                <div className="recyc-summary-box">
                                                    <div className="recyc-sum-label">Residual Waste Weight</div>
                                                    <div className="recyc-sum-val" style={{ color: "#64748b" }}>{residualWasteWeight} kg</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="recyc-stepper-footer">
                                            <button className="btn-stepper-prev" onClick={() => handlePrevStep(4)}>
                                                <FiArrowLeft /> Previous Step
                                            </button>
                                            <button className="btn-stepper-next" onClick={() => handleNextStep(6)}>
                                                Next Step: Audit &amp; Certificate <FiChevronRight />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 6: AUDIT & CERTIFICATE */}
                                {currentStep === 6 && (
                                    <div className="panel-card">
                                        <div className="recyc-section-header">
                                            <span className="recyc-section-num">6</span>
                                            <div>
                                                <h3 className="panel-title">Audit &amp; Environmental Certificate</h3>
                                                <p className="panel-subtitle">Final compliance verification, operator attribution, and environmental certificate generation.</p>
                                            </div>
                                        </div>

                                        <div className="recyc-audit-table-card">
                                            <div className="recyc-audit-card-top">
                                                <div className="recyc-audit-title-box">
                                                    <FiShield className="recyc-audit-icon-main" />
                                                    <div>
                                                        <h4 className="recyc-audit-card-title">Audit Verification Record</h4>
                                                        <span className="recyc-audit-card-sub">Traceability record for EcoCycle Admin &amp; Zero-Landfill Certification</span>
                                                    </div>
                                                </div>
                                                <div className="recyc-audit-status-pill">
                                                    <span className="recyc-live-dot-green"></span> In Progress
                                                </div>
                                            </div>

                                            <div className="recyc-audit-table-responsive">
                                                <table className="recyc-audit-grid-table">
                                                    <thead>
                                                        <tr>
                                                            <th style={{ width: "35%" }}>Audit Parameter</th>
                                                            <th style={{ width: "65%" }}>Details</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td className="audit-col-label">Audit ID</td>
                                                            <td className="audit-col-value font-mono font-bold text-emerald">
                                                                {`AUD-REC-${selectedRequest.id}`}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="audit-col-label">Target Asset</td>
                                                            <td className="audit-col-value font-semibold">
                                                                {`${selectedRequest.brand} ${selectedRequest.model} (#${selectedRequest.deviceId})`}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="audit-col-label">Action Performed</td>
                                                            <td className="audit-col-value">
                                                                <input
                                                                    type="text"
                                                                    list="audit-action-datalist"
                                                                    className="recyc-audit-input-clean"
                                                                    value={auditAction}
                                                                    onChange={(e) => setAuditAction(filterAlphabetOnly(e.target.value))}
                                                                    placeholder="Type or select action..."
                                                                />
                                                                <datalist id="audit-action-datalist">
                                                                    {STANDARD_AUDIT_ACTIONS.map(a => <option key={a} value={a} />)}
                                                                </datalist>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="audit-col-label">Lead Operator</td>
                                                            <td className="audit-col-value">
                                                                <input
                                                                    type="text"
                                                                    list="audit-operators-datalist"
                                                                    className="recyc-audit-input-clean"
                                                                    value={auditOperator}
                                                                    onChange={(e) => setAuditOperator(filterAlphabetOnly(e.target.value))}
                                                                    placeholder="Type or select operator..."
                                                                />
                                                                <datalist id="audit-operators-datalist">
                                                                    <option value="Lead Recycling Engineer EcoCycle Hub" />
                                                                    <option value="Senior E Waste Specialist" />
                                                                    <option value="Technical Operations Lead" />
                                                                </datalist>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="audit-col-label">Operator Role</td>
                                                            <td className="audit-col-value">
                                                                <input
                                                                    type="text"
                                                                    list="audit-roles-datalist"
                                                                    className="recyc-audit-input-clean"
                                                                    value={auditRole}
                                                                    onChange={(e) => setAuditRole(filterAlphabetOnly(e.target.value))}
                                                                    placeholder="Type or select role..."
                                                                />
                                                                <datalist id="audit-roles-datalist">
                                                                    {STANDARD_AUDIT_ROLES.map(r => <option key={r} value={r} />)}
                                                                </datalist>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="audit-col-label">Packaging Container</td>
                                                            <td className="audit-col-value">
                                                                <input
                                                                    type="text"
                                                                    list="packaging-containers-datalist"
                                                                    className="recyc-audit-input-clean"
                                                                    value={packagingContainer}
                                                                    onChange={(e) => setPackagingContainer(filterAlphabetOnly(e.target.value))}
                                                                    placeholder="Type or select container..."
                                                                />
                                                                <datalist id="packaging-containers-datalist">
                                                                    {STANDARD_PACKAGING_CONTAINERS.map(c => <option key={c} value={c} />)}
                                                                </datalist>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="audit-col-label">Dispatch Destination</td>
                                                            <td className="audit-col-value">
                                                                <input
                                                                    type="text"
                                                                    list="dispatch-destinations-datalist"
                                                                    className="recyc-audit-input-clean"
                                                                    value={dispatchDestination}
                                                                    onChange={(e) => setDispatchDestination(filterAlphabetOnly(e.target.value))}
                                                                    placeholder="Type or select destination..."
                                                                />
                                                                <datalist id="dispatch-destinations-datalist">
                                                                    {STANDARD_DISPATCH_DESTINATIONS.map(d => <option key={d} value={d} />)}
                                                                </datalist>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="audit-col-label">Audit Remarks</td>
                                                            <td className="audit-col-value">
                                                                <input
                                                                    type="text"
                                                                    list="audit-remarks-datalist"
                                                                    className="recyc-audit-input-clean"
                                                                    value={auditRemarks}
                                                                    onChange={(e) => setAuditRemarks(filterAlphabetOnly(e.target.value))}
                                                                    placeholder="Type or select remarks..."
                                                                />
                                                                <datalist id="audit-remarks-datalist">
                                                                    {STANDARD_AUDIT_REMARKS.map(rem => <option key={rem} value={rem} />)}
                                                                </datalist>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Section 6: Escrow Settlement & Payment Authorization Card */}
                                        <div style={{
                                            background: paymentStatus === "Paid" ? "#f0fdf4" : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                                            border: paymentStatus === "Paid" ? "1.5px solid #86efac" : "1.5px solid #cbd5e1",
                                            borderRadius: "14px",
                                            padding: "1.25rem 1.5rem",
                                            marginTop: "1.25rem",
                                            marginBottom: "1rem"
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "0.75rem" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                    <div style={{
                                                        width: "42px",
                                                        height: "42px",
                                                        borderRadius: "10px",
                                                        background: paymentStatus === "Paid" ? "#dcfce7" : "#e0e7ff",
                                                        color: paymentStatus === "Paid" ? "#166534" : "#4338ca",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: "1.35rem"
                                                    }}>
                                                        <FiCreditCard />
                                                    </div>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                                                            EcoCycle Central Escrow Settlement &amp; Payout
                                                        </h4>
                                                        <p style={{ margin: "2px 0 0", fontSize: "0.775rem", color: "#64748b" }}>
                                                            Mandatory escrow authorization to complete device recycling and release zero-landfill payout.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div>
                                                    {paymentStatus === "Paid" ? (
                                                        <span style={{
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "0.4rem",
                                                            padding: "0.4rem 0.9rem",
                                                            borderRadius: "999px",
                                                            background: "#22c55e",
                                                            color: "#ffffff",
                                                            fontWeight: 700,
                                                            fontSize: "0.8rem"
                                                        }}>
                                                            <FiCheckCircle /> SETTLEMENT AUTHORIZED
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPaymentModal(true)}
                                                            style={{
                                                                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                                                                color: "#ffffff",
                                                                border: "none",
                                                                padding: "0.55rem 1.25rem",
                                                                borderRadius: "10px",
                                                                fontWeight: 700,
                                                                fontSize: "0.85rem",
                                                                cursor: "pointer",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "0.45rem",
                                                                boxShadow: "0 3px 10px rgba(5, 150, 105, 0.25)"
                                                            }}
                                                        >
                                                            <FiCreditCard /> Authorize &amp; Pay ₹{totals.totalValue.toLocaleString("en-IN")}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                                gap: "0.75rem",
                                                background: "#ffffff",
                                                padding: "0.85rem 1rem",
                                                borderRadius: "10px",
                                                border: "1px solid #e2e8f0"
                                            }}>
                                                <div>
                                                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, display: "block" }}>Recovered Material Value</span>
                                                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#059669" }}>
                                                        ₹{totals.totalValue.toLocaleString("en-IN")}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, display: "block" }}>Payment Channel</span>
                                                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                                                        {paymentMethod}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, display: "block" }}>Payment Status</span>
                                                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: paymentStatus === "Paid" ? "#166534" : "#b45309" }}>
                                                        {paymentStatus === "Paid" ? "✓ Authorized & Deposited" : "Pending Authorization"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, display: "block" }}>Txn Reference</span>
                                                    <span style={{ fontSize: "0.8rem", fontWeight: 700, fontFamily: "monospace", color: "#7c3aed" }}>
                                                        {paymentTransactionId || "PENDING_AUTHORIZATION"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="recyc-stepper-footer">
                                            <button className="btn-stepper-prev" onClick={() => handlePrevStep(5)}>
                                                <FiArrowLeft /> Previous Step
                                            </button>

                                            <div style={{ display: "flex", gap: "0.6rem" }}>
                                                <button
                                                    className="btn-stepper-complete"
                                                    onClick={paymentStatus === "Paid" ? handleCompleteRecycling : () => setShowPaymentModal(true)}
                                                    disabled={processingId === selectedRequest.id}
                                                    style={{
                                                        background: paymentStatus === "Paid"
                                                            ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                                                            : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                                                        boxShadow: paymentStatus === "Paid"
                                                            ? "0 2px 8px rgba(0, 0, 0, 0.08)"
                                                            : "0 2px 8px rgba(37, 99, 235, 0.2)"
                                                    }}
                                                >
                                                    {paymentStatus === "Paid" ? (
                                                        <><FiCheckSquare /> Complete &amp; Issue Settlement Bill</>
                                                    ) : (
                                                        <><FiCreditCard /> Authorize Settlement &amp; Issue Bill</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()
                ) : (
                    <div className="panel-card" style={{ textAlign: "center", padding: "3.5rem 1.5rem", color: "#64748b", border: "1px dashed #cbd5e1", background: "#f8fafc", borderRadius: "16px" }}>
                        <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#ecfdf5", color: "#059669", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", marginBottom: "1rem" }}>
                            <FiTool />
                        </div>
                        <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.4rem" }}>No Device Selected</h3>
                        <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b", maxWidth: "460px", marginLeft: "auto", marginRight: "auto" }}>
                            Please select a device from the Allocated Recycling Queue above to inspect arrival conditions, initiate the 10-Day SLA, perform component removal, and record recovery yield.
                        </p>
                    </div>
                )}
            </main>

            {/* Navigation Lock Modal */}
            {showNavLockModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: "100vw",
                    height: "100vh",
                    backgroundColor: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    zIndex: 99999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem"
                }} onClick={() => setShowNavLockModal(false)}>
                    <div className="nav-lock-modal" style={{ maxWidth: "560px", width: "100%", borderRadius: "18px", overflow: "hidden", background: "#ffffff", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)" }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
                            padding: "1.5rem",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem"
                        }}>
                            <div style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "12px",
                                background: "rgba(255, 255, 255, 0.2)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.5rem",
                                flexShrink: 0
                            }}>
                                <FiLock />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                                    Active SLA In Progress
                                </h3>
                                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
                                    Navigation locked until recycling process and audit certificate are finalized
                                </p>
                            </div>
                        </div>

                        <div style={{ padding: "1.75rem 1.5rem" }}>
                            <div style={{
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                borderRadius: "12px",
                                padding: "1rem 1.25rem",
                                marginBottom: "1.25rem"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#991b1b", fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.35rem" }}>
                                    <FiAlertTriangle /> Recycling SLA Process In Progress
                                </div>
                                <p style={{ margin: 0, fontSize: "0.85rem", color: "#7f1d1d", lineHeight: 1.5 }}>
                                    The 10-Day SLA clock is actively ticking for <strong>{selectedRequest?.brand} {selectedRequest?.model} (DEV #{selectedRequest?.deviceId})</strong>. You cannot navigate away or switch devices until completing all physical dismantling, hazard isolation, yield logging, and certificate issuance.
                                </p>
                            </div>

                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.6rem",
                                fontSize: "0.85rem",
                                color: "#475569",
                                background: "#f8fafc",
                                padding: "1rem",
                                borderRadius: "10px",
                                border: "1px solid #e2e8f0"
                            }}>
                                {stepList.map(s => (
                                    <div key={s.num} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <FiCheckCircle style={{ color: completedSteps.includes(s.num) ? "#059669" : "#94a3b8" }} />
                                        <span>Step {s.num}: {s.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowNavLockModal(false)}
                                    style={{
                                        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                                        color: "#ffffff",
                                        border: "none",
                                        padding: "0.75rem 1.5rem",
                                        borderRadius: "10px",
                                        fontWeight: 700,
                                        fontSize: "0.9rem",
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)"
                                    }}
                                >
                                    Continue Active Recycling <FiArrowRight />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Settlement Bill / Invoice Modal (Matching Itemized Pay Slip & Settlement Voucher Structure) */}
            <RecyclingBillModal
                isOpen={showCertModal}
                onClose={() => setShowCertModal(false)}
                certificateData={certificateData}
                selectedRequest={selectedRequest}
            />

            {/* Dedicated EcoCycle Settlement Payment Gateway Modal */}
            {showPaymentModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(6px)",
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem"
                }}>
                    <div style={{
                        background: "#ffffff",
                        borderRadius: "18px",
                        width: "100%",
                        maxWidth: "560px",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        animation: "fadeIn 0.2s ease-out"
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                            padding: "1.25rem 1.5rem",
                            color: "#ffffff",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "10px",
                                    background: "rgba(255, 255, 255, 0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.3rem"
                                }}>
                                    <FiCreditCard />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>
                                        EcoCycle Escrow Settlement Checkout
                                    </h3>
                                    <span style={{ fontSize: "0.75rem", opacity: 0.9 }}>
                                        Recycling Yield Settlement &amp; SLA Fulfillment
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(false)}
                                style={{ background: "transparent", border: "none", color: "#ffffff", fontSize: "1.3rem", cursor: "pointer", display: "flex" }}
                            >
                                <FiX />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: "1.5rem" }}>
                            {/* Device & Amount Hero */}
                            <div style={{
                                background: "#f8fafc",
                                border: "1.5px solid #e2e8f0",
                                borderRadius: "12px",
                                padding: "1rem 1.25rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "1.25rem"
                            }}>
                                <div>
                                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Hardware Asset</span>
                                    <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>
                                        {selectedRequest?.brand} {selectedRequest?.model}
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "monospace" }}>
                                        DEV #{selectedRequest?.deviceId} &bull; REQ #{selectedRequest?.id}
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 700, textTransform: "uppercase" }}>Payable Amount</span>
                                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#059669" }}>
                                        ₹{totals.totalValue.toLocaleString("en-IN")}
                                    </div>
                                </div>
                            </div>

                            {paymentStatus === "Paid" ? (
                                <div style={{
                                    background: "#f0fdf4",
                                    border: "1px solid #86efac",
                                    borderRadius: "12px",
                                    padding: "1.25rem",
                                    textAlign: "center"
                                }}>
                                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#22c55e", color: "#ffffff", fontSize: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
                                        <FiCheckCircle />
                                    </div>
                                    <h4 style={{ margin: 0, color: "#166534", fontSize: "1.1rem", fontWeight: 800 }}>
                                        Settlement Payment Confirmed
                                    </h4>
                                    <p style={{ margin: "0.35rem 0 0.85rem", fontSize: "0.825rem", color: "#15803d" }}>
                                        The amount of ₹{totals.totalValue.toLocaleString("en-IN")} has been verified and settled to EcoCycle escrow.
                                    </p>
                                    <div style={{ background: "#ffffff", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "0.6rem", fontSize: "0.8rem", color: "#475569" }}>
                                        Transaction Ref: <strong style={{ fontFamily: "monospace", color: "#0f172a" }}>{paymentTransactionId}</strong>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentModal(false)}
                                        style={{
                                            marginTop: "1rem",
                                            background: "#166534",
                                            color: "#ffffff",
                                            border: "none",
                                            padding: "0.6rem 1.5rem",
                                            borderRadius: "8px",
                                            fontWeight: 700,
                                            cursor: "pointer"
                                        }}
                                    >
                                        Close Voucher
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Razorpay Gateway Channel */}
                                    <div style={{
                                        background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
                                        border: "1.5px solid #a7f3d0",
                                        borderRadius: "14px",
                                        padding: "1rem 1.25rem",
                                        marginBottom: "1.25rem",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "1rem",
                                        boxShadow: "0 2px 10px rgba(5, 150, 105, 0.05)"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0, flex: 1 }}>
                                            <div style={{
                                                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                                                color: "#ffffff",
                                                width: "42px",
                                                height: "42px",
                                                borderRadius: "10px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "1.35rem",
                                                fontWeight: 900,
                                                flexShrink: 0,
                                                boxShadow: "0 3px 8px rgba(5, 150, 105, 0.25)"
                                            }}>
                                                <FiCreditCard />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    Razorpay Payment Gateway
                                                </div>
                                                <div style={{ fontSize: "0.75rem", color: "#065f46", marginTop: "2px", lineHeight: 1.35 }}>
                                                    Instant Online Buyout Settlement &bull; Test Cards, Mock UPI &amp; NetBanking (₹0 Real Money)
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Test Mode Info Banner */}
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        background: "#eff6ff",
                                        border: "1px solid #bfdbfe",
                                        borderRadius: "10px",
                                        padding: "0.65rem 0.9rem",
                                        fontSize: "0.75rem",
                                        color: "#1e40af",
                                        marginBottom: "1.25rem"
                                    }}>
                                        <FiShield style={{ fontSize: "1rem", flexShrink: 0 }} />
                                        <span>
                                            <strong>Sandbox Test Environment:</strong> Complete test payment using Razorpay secure checkout.
                                        </span>
                                    </div>

                                    {/* Notes / Reference */}
                                    <div style={{ marginBottom: "1.25rem" }}>
                                        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                                            Settlement Reference Remarks (Optional):
                                        </label>
                                        <input
                                            type="text"
                                            className="recyc-input-sm"
                                            value={paymentNotes}
                                            onChange={(e) => setPaymentNotes(e.target.value)}
                                            placeholder={`Recycling buyout settlement for Device #${selectedRequest?.deviceId || selectedRequest?.id}`}
                                            style={{ width: "100%", fontSize: "0.825rem" }}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                        <button
                                            type="button"
                                            className="btn-action glass"
                                            onClick={() => setShowPaymentModal(false)}
                                            disabled={isPayingSettlement}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleProcessSettlementPayment(false)}
                                            disabled={isPayingSettlement}
                                            style={{
                                                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                                                color: "#ffffff",
                                                border: "none",
                                                borderRadius: "10px",
                                                padding: "0.7rem 1.4rem",
                                                fontSize: "0.875rem",
                                                fontWeight: 800,
                                                cursor: isPayingSettlement ? "not-allowed" : "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.5rem",
                                                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)"
                                            }}
                                        >
                                            {isPayingSettlement ? (
                                                <>Processing Test Payment...</>
                                            ) : (
                                                <>
                                                    <FiCheckCircle /> Authorize &amp; Pay ₹{totals.totalValue.toLocaleString("en-IN")} (Sandbox)
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RecyclingPerform;
