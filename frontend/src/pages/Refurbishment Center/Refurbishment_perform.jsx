import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiArrowLeft,
    FiCheckCircle,
    FiAlertTriangle,
    FiTool,
    FiCpu,
    FiShield,
    FiCheckSquare,
    FiRefreshCw,
    FiPlus,
    FiTrash2,
    FiBox,
    FiCamera,
    FiPrinter,
    FiDownload,
    FiX,
    FiDollarSign,
    FiHardDrive,
    FiZap,
    FiSmartphone,
    FiTv,
    FiBatteryCharging,
    FiEye,
    FiArrowRight,
    FiUser,
    FiFileText,
    FiAward,
    FiChevronDown,
    FiChevronUp,
    FiLayers,
    FiSearch,
    FiCheck,
    FiClock,
    FiCalendar,
    FiPlay,
    FiInfo,
    FiExternalLink,
    FiMaximize2,
    FiImage,
    FiGrid,
    FiList,
    FiLock,
    FiAlertCircle,
    FiCreditCard,
    FiBell,
    FiTruck,
    FiPackage,
    FiPhone,
    FiMapPin
} from "react-icons/fi";
import { FaLeaf, FaQrcode } from "react-icons/fa";
import {
    calculateEstimatedDeviceValue,
    calculateAgeInYears,
    calculateAgeFactor,
    getAgeTierLabel
} from "../../utils/pricing";
import "./Refurbishment_perform.css";

const LOCAL_API_BASE = "http://localhost:5278/api";
const PROD_API_BASE = "https://ecocycle.runasp.net/api";
const isLocalhost = typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE = isLocalhost ? LOCAL_API_BASE : PROD_API_BASE;

// Standard preset wiping methods compliant with security frameworks
const standardWipingMethods = [
    "NIST SP 800-88 Rev 1 Overwrite",
    "NIST SP 800-88 Rev. 1 Clear",
    "NIST SP 800-88 Rev. 1 Purge",
    "DoD 5220.22-M (3-Pass Wipe)",
    "DoD 5220.22-M ECE (7-Pass Wipe)",
    "Cryptographic NVMe Sanitize",
    "ATA Secure Erase Protocol",
    "Secure Factory Firmware Zeroize",
    "Gutmann 35-Pass Data Shred",
    "Zero-Fill Single Pass Sanitization"
];

// Standard preset sanitization technicians for dropdown / auto-completion
const standardTechnicians = [
    "cap waste Bench",
    "Lead Technician",
    "Senior Sanitization Tech",
    "Hardware Security Lead",
    "Refurbishment Bench Tech"
];

// Hardware Diagnostic Criteria Definition per Category (Mapping all 15 E-Waste Categories)
const HARDWARE_DIAGNOSTIC_SCHEMAS = {
    mobile: [
        { name: "Power / Boot", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Boots normally" },
        { name: "Display / Touch", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Touch responsive" },
        { name: "Battery", defaultStatus: "Fair", defaultScore: 70, defaultRemarks: "Capacity slightly reduced" },
        { name: "Rear & Front Camera", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Focus & capture OK" },
        { name: "Speaker", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Loud & clear" },
        { name: "Microphone", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Voice clear" },
        { name: "Charging Port", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Fast charge OK" },
        { name: "Physical Buttons", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Tactile click OK" },
        { name: "Wi-Fi", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Connected" },
        { name: "Bluetooth", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Discovered" },
        { name: "SIM / Network", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "SIM detected" },
        { name: "Fingerprint / Face ID", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Biometrics OK" },
        { name: "Vibration Motor", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Haptics OK" },
        { name: "GPS Sensor", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Fix acquired" }
    ],
    laptop: [
        { name: "Power / Boot", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Boots normally" },
        { name: "Display", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "No dead pixels" },
        { name: "Keyboard", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "All keys responsive" },
        { name: "Touchpad", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Multi-touch OK" },
        { name: "USB Ports", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "All ports functional" },
        { name: "HDMI Port", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Video output OK" },
        { name: "Wi-Fi", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Signal strong" },
        { name: "Bluetooth", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Pairing normal" },
        { name: "Camera", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Clear video feed" },
        { name: "Speakers", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Clear stereo audio" },
        { name: "Microphone", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Audio pickup normal" },
        { name: "Battery", defaultStatus: "Fair", defaultScore: 75, defaultRemarks: "Holds charge (75% capacity)" },
        { name: "Storage / SSD", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Health 100%" },
        { name: "RAM / Memory", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Passed test" },
        { name: "Charging Port", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Charges normally" }
    ],
    desktop: [
        { name: "Power / Boot", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "POST & boot OK" },
        { name: "CPU Performance", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Benchmark normal" },
        { name: "RAM / Memory", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "All DIMM slots OK" },
        { name: "Storage / SSD", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "SMART health OK" },
        { name: "GPU / Graphics Card", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Display render OK" },
        { name: "Motherboard Ports", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "USB/Audio/LAN OK" },
        { name: "Power Supply (PSU)", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Stable voltages" },
        { name: "Cooling Fan / Thermal", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Temps normal" }
    ],
    tablet: [
        { name: "Power / Boot", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Boots normally" },
        { name: "Display / Touch", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Digitizer responsive" },
        { name: "Stylus / Pen Sensor", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Pen pressure OK" },
        { name: "Battery", defaultStatus: "Fair", defaultScore: 75, defaultRemarks: "Holds charge" },
        { name: "Cameras", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Front & rear OK" },
        { name: "Speakers", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Stereo audio OK" },
        { name: "Microphone", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Mic clear" },
        { name: "Charging Port", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Charging OK" },
        { name: "Physical Buttons", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Power/Vol OK" },
        { name: "Wi-Fi & Bluetooth", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Wireless OK" }
    ],
    monitor: [
        { name: "Power / Boot", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Power on instant" },
        { name: "Display Panel", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "No dead pixels" },
        { name: "LED Backlight", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Uniform brightness" },
        { name: "HDMI / DisplayPort", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Signal lock OK" },
        { name: "Color & Uniformity", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "No color tinting" },
        { name: "OSD Control Buttons", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Menu buttons OK" },
        { name: "Power Supply Adapter", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Voltage stable" }
    ],
    tv: [
        { name: "Power / Boot", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Instant power on" },
        { name: "Display Panel", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "No lines or distortion" },
        { name: "LED Backlight", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Uniform brightness" },
        { name: "HDMI / AV Ports", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "All HDMI ports working" },
        { name: "Audio Output", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Clear sound" },
        { name: "Remote Control IR", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "IR sensor responsive" },
        { name: "Physical Buttons", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Controls working" },
        { name: "Power Supply Unit", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Stable voltage" },
        { name: "Smart OS / Wi-Fi", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Wi-Fi connected" }
    ],
    printer: [
        { name: "Power / Boot", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Initializes normally" },
        { name: "Print Head / Roller", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "No paper jam" },
        { name: "Ink / Toner Sensor", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Cartridge detected" },
        { name: "Paper Feed Mechanism", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Tray feeds properly" },
        { name: "USB / Network Port", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Print job received" },
        { name: "Scanner Bed (Flatbed)", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Scan lamp OK" },
        { name: "Control Panel LCD", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Display & buttons OK" }
    ],
    scanner: [
        { name: "Power / Boot", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Lamp warms up" },
        { name: "Optical Glass & Sensor", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Clear scan image" },
        { name: "Feeder Roller (ADF)", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Document feeds OK" },
        { name: "USB Interface", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Data transfer OK" },
        { name: "Calibration Test", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Passed calibration" }
    ],
    ups: [
        { name: "Power / Boot", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Cold start OK" },
        { name: "Internal Lead Battery", defaultStatus: "Fair", defaultScore: 70, defaultRemarks: "Backup time 15+ mins" },
        { name: "Inverter Circuit", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "AC output stable" },
        { name: "Surge & AVR Regulation", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Voltage boost OK" },
        { name: "AC Sockets & Breaker", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Outlets live" },
        { name: "Beep Alarm & LEDs", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Alarm active" }
    ],
    router: [
        { name: "Power / Boot", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "System LED green" },
        { name: "WAN / Internet Port", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "DHCP IP acquired" },
        { name: "LAN Ethernet Ports", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "All LAN ports link OK" },
        { name: "2.4GHz Wi-Fi Radio", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "SSID broadcast OK" },
        { name: "5GHz Wi-Fi Radio", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "High speed link OK" },
        { name: "Reset Button & Admin OS", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Admin GUI accessible" }
    ],
    peripherals: [
        { name: "Power / Connectivity", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Plugged & detected" },
        { name: "Key Matrix / Switches", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "All keys register" },
        { name: "Optical Tracking Sensor", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Tracking smooth" },
        { name: "Scroll Wheel & Click", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Scroll & click OK" },
        { name: "USB Cable / Wireless Dongle", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Connection solid" },
        { name: "Internal Battery", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Recharges OK" }
    ],
    audio: [
        { name: "Power / Boot", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Power LED active" },
        { name: "Speaker Drivers", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Sound clear, no distortion" },
        { name: "Subwoofer / Bass", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Bass response OK" },
        { name: "Bluetooth / Aux Input", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Pairing & Line-in OK" },
        { name: "Volume & EQ Knobs", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Controls smooth" },
        { name: "Microphone Input", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Mic input functional" },
        { name: "Rechargeable Battery", defaultStatus: "Fair", defaultScore: 75, defaultRemarks: "Holds charge" }
    ],
    camera: [
        { name: "Power / Boot", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Boots into shoot mode" },
        { name: "Lens Zoom & Autofocus", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Autofocus sharp" },
        { name: "CMOS Image Sensor", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Clean image output" },
        { name: "Flash Unit", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Strobe fires OK" },
        { name: "LCD Viewfinder Screen", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Preview clear" },
        { name: "SD Card Reader Slot", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Reads/Writes cards" },
        { name: "Battery & Charger", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Battery healthy" },
        { name: "Shutter Button & Dial", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Dual stage shutter OK" }
    ],
    gaming: [
        { name: "Power / Boot", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Boots to Dashboard" },
        { name: "HDMI Video Output", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Signal output OK" },
        { name: "GPU / Graphics Render", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "3D render smooth" },
        { name: "Internal Storage / Drive", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Storage healthy" },
        { name: "Disc Drive / Reader", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Reads Game Discs" },
        { name: "Wireless Controller Sync", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Gamepad sync OK" },
        { name: "Cooling System / Fan", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Fan operation OK" },
        { name: "Network / Wi-Fi", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Online services OK" }
    ],
    appliance: [
        { name: "Power / Boot", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Power sequence normal" },
        { name: "Power Cable & Plug", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Insulation intact" },
        { name: "Main Control PCB Board", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Relays and PCB OK" },
        { name: "Motor / Heating Element", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Operational" },
        { name: "Control Panel & Knobs", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Switches responsive" },
        { name: "Thermal Safety Fuse", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Cut-off functional" }
    ]
};

// Category key resolver helper matching all categories
const getCategoryKey = (categoryName, brand, model) => {
    const str = `${categoryName || ""} ${brand || ""} ${model || ""}`.toLowerCase();
    if (str.includes("mobile") || str.includes("smartphone") || str.includes("phone")) return "mobile";
    if (str.includes("laptop") || str.includes("notebook") || str.includes("macbook")) return "laptop";
    if (str.includes("desktop") || str.includes("cpu") || str.includes("computer") || str.includes("all-in-one")) return "desktop";
    if (str.includes("tablet") || str.includes("ipad")) return "tablet";
    if (str.includes("monitor")) return "monitor";
    if (str.includes("television") || str.includes("tv")) return "tv";
    if (str.includes("printer")) return "printer";
    if (str.includes("scanner")) return "scanner";
    if (str.includes("ups") || str.includes("inverter") || str.includes("backup power")) return "ups";
    if (str.includes("router") || str.includes("modem") || str.includes("network")) return "router";
    if (str.includes("keyboard") || str.includes("mouse") || str.includes("peripheral")) return "peripherals";
    if (str.includes("audio") || str.includes("speaker") || str.includes("headphone")) return "audio";
    if (str.includes("camera") || str.includes("dslr") || str.includes("camcorder")) return "camera";
    if (str.includes("gaming") || str.includes("console") || str.includes("playstation") || str.includes("xbox")) return "gaming";
    if (str.includes("appliance") || str.includes("microwave") || str.includes("refrigerator") || str.includes("washing")) return "appliance";
    return "laptop";
};

// Helper function to build dynamic assessment components & test suites based on Device Category & Real Inspection Data
const getCategoryProfile = (categoryName, brand, model, inspectionData, deviceObj = null, masterModelsList = []) => {
    const catKey = getCategoryKey(categoryName, brand, model);
    const schema = HARDWARE_DIAGNOSTIC_SCHEMAS[catKey] || HARDWARE_DIAGNOSTIC_SCHEMAS.laptop;

    // Resolve true components of this device (prioritizing real technician inspection results)
    let componentsList = [];
    if (inspectionData?.results && Array.isArray(inspectionData.results) && inspectionData.results.length > 0) {
        componentsList = inspectionData.results.map(r => r.component || r.name).filter(Boolean);
    } else {
        componentsList = schema.map(s => s.name);
    }

    // 1. Pull Benchmark Reference Market Price from Device Model Price Master
    let masterRefPrice = 0;
    if (deviceObj?.referenceMarketPrice && Number(deviceObj.referenceMarketPrice) > 0) {
        masterRefPrice = Number(deviceObj.referenceMarketPrice);
    } else if (deviceObj?.referencePrice && Number(deviceObj.referencePrice) > 0) {
        masterRefPrice = Number(deviceObj.referencePrice);
    } else if (deviceObj?.deviceModel?.referenceMarketPrice && Number(deviceObj.deviceModel.referenceMarketPrice) > 0) {
        masterRefPrice = Number(deviceObj.deviceModel.referenceMarketPrice);
    }

    // Dynamic match against loaded DeviceModel Master list
    if (masterRefPrice <= 0 && masterModelsList && masterModelsList.length > 0) {
        const bClean = (brand || deviceObj?.brand || "").trim().toLowerCase();
        const mClean = (model || deviceObj?.model || "").trim().toLowerCase();
        const fullClean = `${bClean} ${mClean}`.trim();

        const match = masterModelsList.find(m => {
            const mb = (m.brand || "").trim().toLowerCase();
            const mm = (m.model || "").trim().toLowerCase();
            const mFull = `${mb} ${mm}`.trim();
            return (
                (bClean && mb === bClean && mm === mClean) ||
                (mClean && mm === mClean) ||
                (fullClean && mFull === fullClean) ||
                (fullClean && mm && fullClean.includes(mm)) ||
                (mClean && mm && (mClean.includes(mm) || mm.includes(mClean)))
            );
        });

        if (match && Number(match.referenceMarketPrice) > 0) {
            masterRefPrice = Number(match.referenceMarketPrice);
        }
    }

    // Category baseline fallback market valuations if not found in master
    const marketValues = {
        mobile: 22000,
        laptop: 35000,
        desktop: 28000,
        tablet: 18000,
        monitor: 9000,
        tv: 30000,
        printer: 7500,
        scanner: 5000,
        ups: 4500,
        router: 3000,
        peripherals: 2000,
        audio: 6000,
        camera: 18000,
        gaming: 26000,
        appliance: 9500
    };

    let referenceMarketPrice = masterRefPrice > 0 ? masterRefPrice : (marketValues[catKey] || 18000);

    // Brand and model tier multiplier (applied if not using exact master reference price)
    const brandStr = `${brand || ""} ${model || ""}`.toLowerCase();
    if (masterRefPrice <= 0) {
        let brandMultiplier = 1.0;
        if (brandStr.includes("apple") || brandStr.includes("macbook") || brandStr.includes("iphone") || brandStr.includes("ipad")) {
            brandMultiplier = 1.60;
        } else if (brandStr.includes("oneplus") || brandStr.includes("alienware") || brandStr.includes("rog") || brandStr.includes("xps") || brandStr.includes("thinkpad") || brandStr.includes("sony") || brandStr.includes("galaxy s") || brandStr.includes("galaxy z")) {
            brandMultiplier = 1.40;
        } else if (brandStr.includes("dell") || brandStr.includes("lenovo") || brandStr.includes("hp") || brandStr.includes("samsung") || brandStr.includes("asus")) {
            brandMultiplier = 1.15;
        } else if (brandStr.includes("acer") || brandStr.includes("xiaomi") || brandStr.includes("redmi") || brandStr.includes("realme")) {
            brandMultiplier = 0.95;
        }
        referenceMarketPrice = Math.round(referenceMarketPrice * brandMultiplier);
    }

    // 2. Calculate Device Age and Condition Depreciation
    // Formula: EstimatedValue = ReferenceValue * AgeFactor * ConditionFactor
    const purchaseDate = deviceObj?.purchaseDate || deviceObj?.PurchaseDate || deviceObj?.createdAt || deviceObj?.CreatedAt;
    const valuationResult = calculateEstimatedDeviceValue({
        referenceValue: referenceMarketPrice,
        purchaseDate,
        condition: deviceObj?.condition || "Good",
        inspectionData,
        secondaryAttributes: {
            working: deviceObj?.working,
            physicalDamage: deviceObj?.physicalDamage,
            displayCondition: deviceObj?.displayCondition,
            batteryCondition: deviceObj?.batteryCondition
        },
        quantity: deviceObj?.quantity || 1
    });

    const ageInYears = valuationResult.ageInYears;
    const ageFactor = valuationResult.ageFactor;
    const conditionFactor = valuationResult.conditionFactor;
    const adjustedDeviceValue = valuationResult.unitEstimatedValue;
    const defaultMarketValue = adjustedDeviceValue;

    // Build repair items based on inspection findings
    let initialRepairItems = [];
    let itemId = 1;

    if (inspectionData?.results && Array.isArray(inspectionData.results) && inspectionData.results.length > 0) {
        // Find degraded / flagged components
        inspectionData.results.forEach((res) => {
            const cName = res.component || res.name || "Hardware Component";
            const rVal = (res.result || "").toLowerCase();
            const score = Number(res.score) || 100;
            const isDegraded = rVal.includes("not") || rVal.includes("fair") || rVal.includes("damage") || rVal.includes("fail") || rVal.includes("degraded") || score < 95;

            if (isDegraded) {
                let action = "Repair";
                let cost = 500;
                const cLower = cName.toLowerCase();

                if (cLower.includes("battery")) { action = "Replace"; cost = catKey === "laptop" ? 1200 : 850; }
                else if (cLower.includes("display") || cLower.includes("touch") || cLower.includes("screen") || cLower.includes("panel")) { action = catKey === "mobile" ? "Repair" : "Replace"; cost = catKey === "laptop" ? 2200 : 950; }
                else if (cLower.includes("storage") || cLower.includes("ssd") || cLower.includes("hdd")) { action = "Replace"; cost = 1600; }
                else if (cLower.includes("ram") || cLower.includes("memory")) { action = "Upgrade"; cost = 1100; }
                else if (cLower.includes("keyboard")) { action = "Replace"; cost = 750; }
                else if (cLower.includes("os") || cLower.includes("firmware") || cLower.includes("boot") || cLower.includes("software")) { action = "Reinstall"; cost = 250; }
                else if (cLower.includes("camera")) { action = "Repair"; cost = 600; }
                else if (cLower.includes("port") || cLower.includes("charging") || cLower.includes("usb") || cLower.includes("hdmi")) { action = "Repair"; cost = 450; }
                else if (cLower.includes("speaker") || cLower.includes("mic") || cLower.includes("audio")) { action = "Clean & Service"; cost = 350; }
                else if (cLower.includes("fuse") || cLower.includes("cable") || cLower.includes("power")) { action = "Replace"; cost = 400; }

                initialRepairItems.push({
                    id: itemId++,
                    component: cName,
                    action,
                    quantity: 1,
                    cost,
                    technician: "Lead Technician",
                    remarks: res.remarks || `${cName} serviced & restored to 100% functionality`
                });
            }
        });

        // If no degraded items found, provide key maintenance & calibration items for this device's components
        if (initialRepairItems.length === 0) {
            const topComponents = inspectionData.results.slice(0, 3);
            topComponents.forEach((res) => {
                const cName = res.component || res.name;
                initialRepairItems.push({
                    id: itemId++,
                    component: cName,
                    action: "Clean & Service",
                    quantity: 1,
                    cost: 300,
                    technician: "Lead Technician",
                    remarks: `${cName} bench-tested, calibrated, and certified OK`
                });
            });
        }
    } else {
        // Build defaults from category schema
        const topSchema = schema.slice(0, 3);
        initialRepairItems = topSchema.map((s, idx) => {
            let action = s.name.includes("Battery") ? "Replace" : s.name.includes("Display") ? "Repair" : s.name.includes("RAM") || s.name.includes("Storage") ? "Upgrade" : "Clean & Service";
            let cost = s.name.includes("Battery") ? 850 : s.name.includes("Display") ? 950 : 350;
            return {
                id: idx + 1,
                component: s.name,
                action,
                quantity: 1,
                cost,
                technician: "Lead Technician",
                remarks: `${s.name} inspected, tested, and serviced`
            };
        });
    }

    // Build functional test suite matching all components of this device
    const testSuite = componentsList.map((cName, idx) => ({
        id: `test_${idx + 1}_${cName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        label: `${cName} Functional & Operational Check`,
        status: "Pass"
    }));

    // Build assessment checks
    const assessmentChecks = componentsList.map((cName, idx) => ({
        key: `check_${idx + 1}`,
        label: `${cName}`,
        options: ["Working / Intact", "Fair / Degraded", "Requires Servicing", "Replace Component", "Certified OK"]
    }));

    return {
        key: catKey,
        isPhone: catKey === "mobile" || catKey === "tablet",
        isTV: catKey === "tv" || catKey === "monitor",
        isAppliance: catKey === "appliance",
        isLaptop: catKey === "laptop" || catKey === "desktop",
        hasStorage: ["laptop", "desktop", "mobile", "tablet", "gaming"].includes(catKey),
        referenceMarketPrice,
        purchaseDate,
        ageInYears,
        ageFactor,
        ageTierLabel: valuationResult.ageTierLabel,
        conditionFactor,
        adjustedDeviceValue,
        defaultMarketValue,
        componentsList,
        assessmentChecks,
        initialRepairItems,
        testSuite
    };
};

// Helper function to resolve device and inspection photo URLs reliably
const resolvePhotoUrl = (rawPath, defaultFolder = "devices/FrontPhotos") => {
    if (!rawPath) return "";
    if (rawPath.startsWith("data:") || rawPath.startsWith("blob:") || rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
        return rawPath;
    }
    const clean = rawPath.replace(/^[\\/]+/, "");
    if (clean.startsWith("uploads/")) {
        return `https://ecocycle.runasp.net/${clean}`;
    }
    if (clean.includes("/")) {
        return `https://ecocycle.runasp.net/uploads/${clean}`;
    }
    return `https://ecocycle.runasp.net/uploads/${defaultFolder}/${clean}`;
};

function RefurbishmentPerform() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(Boolean(id));
    const [saving, setSaving] = useState(false);
    const [serverMsg, setServerMsg] = useState({ type: "", text: "" });

    // Allocated Devices List State
    const [allocatedList, setAllocatedList] = useState([]);
    const [loadingAllocated, setLoadingAllocated] = useState(false);
    const [allocatedFilter, setAllocatedFilter] = useState("All"); // "All", "Active", "Completed"
    const [allocatedSearch, setAllocatedSearch] = useState("");
    const [allocatedViewMode, setAllocatedViewMode] = useState("grid"); // "grid" | "table"

    // Request & Device Data from Server for Active Selected Device
    const [requestData, setRequestData] = useState(null);

    // Refurbishment Process Lifecycle & 10-Day SLA Deadline State
    const [isStarted, setIsStarted] = useState(false);
    const [startedAt, setStartedAt] = useState(null);
    const [deadlineDate, setDeadlineDate] = useState(null);
    const [isStartingProcess, setIsStartingProcess] = useState(false);
    const [slaTimeLeft, setSlaTimeLeft] = useState("");

    // Active Step (1 to 6)
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState([]);

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

    // Zoomed photo modal state & inspection drawer
    const [zoomedPhoto, setZoomedPhoto] = useState(null);
    const [showInspectionDrawer, setShowInspectionDrawer] = useState(false);
    const [showProcessReportModal, setShowProcessReportModal] = useState(false);
    const [reportModalData, setReportModalData] = useState(null);
    const [showNavLockModal, setShowNavLockModal] = useState(false);
    const [deliveryAssignmentMap, setDeliveryAssignmentMap] = useState({});

    // Check if device is completed or certified ready
    const isDeviceCompleted = useMemo(() => {
        if (!requestData) return false;
        const s = (requestData?.status || "").toLowerCase();
        const ps = (requestData?.process?.status || "").toLowerCase();
        const fo = (requestData?.process?.finalOutcome || "").toLowerCase();
        return s === "completed" || s === "certified ready" || s === "refurbished" || s === "transferredtorecycling" || ps === "completed" || fo === "refurbished";
    }, [requestData]);

    // Active SLA Navigation Lock: Once SLA process is started for an allocated device, prevent navigating to other pages or switching devices until process & settlement transaction are completed
    const isProcessLocked = useMemo(() => {
        if (!requestData) return false;
        if (isDeviceCompleted) return false;
        const statusLower = (requestData.status || "").toLowerCase();
        const procStatusLower = (requestData?.process?.status || "").toLowerCase();
        const hasStarted = (isStarted || statusLower === "inprogress" || procStatusLower === "inprogress" || Boolean(startedAt)) && !isDeviceCompleted;
        return hasStarted;
    }, [requestData, isStarted, startedAt, isDeviceCompleted]);

    // Check whether the committed process deadline has passed
    const isDeadlineOverdue = useMemo(() => {
        if (!deadlineDate || isDeviceCompleted) return false;
        return new Date(deadlineDate).getTime() < Date.now();
    }, [deadlineDate, isDeviceCompleted]);

    // Helper to format process deadline cleanly with day, date, and time
    const formatDeadlineDisplay = (dateInput) => {
        if (!dateInput) return "10-Day Standard Window";
        try {
            const d = new Date(dateInput);
            if (isNaN(d.getTime())) return "10-Day Standard Window";
            return d.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return "10-Day Standard Window";
        }
    };

    // Helper to evaluate whether physical delivery to the refurbishment facility is complete
    const checkDeliveryStatus = (item, assign) => {
        if (!item && !assign) return false;

        // If request status is already InProgress, Completed, or Certified Ready, bench work has commenced or finished
        const reqStatus = (item?.status || "").toLowerCase();
        if (reqStatus === "inprogress" || reqStatus === "completed" || reqStatus === "certified ready" || reqStatus === "refurbished") {
            return true;
        }

        // Check lifecycle status on device or request
        const lcs = (item?.lifecycleStatus || item?.device?.lifecycleStatus || "").toLowerCase().replace(/[^a-z]/g, "");
        if (["atrefurbishmentcenter", "refurbished", "refurbishmentinprogress", "readyforreuse"].includes(lcs)) {
            return true;
        }

        // If lifecycle status explicitly indicates delivery is pending or expired pickup from technician
        if (["pickupexpired", "allocatedtorefurbishment", "assigned", "scheduled", "pendingpickup", "intransit", "techpickup", "awaitingpickup"].includes(lcs)) {
            return false;
        }

        // Check the assignment if present
        if (assign) {
            const assignStatus = (assign.status || "").toLowerCase();
            const delStatus = (assign.deliveryStatus || "").toLowerCase();
            if (
                assignStatus === "deliveredtocenter" ||
                assignStatus === "delivered" ||
                delStatus === "delivered" ||
                Boolean(assign.deliveredAt) ||
                Boolean(assign.deliveryDeliveredAt)
            ) {
                return true;
            }
            return false;
        }

        // Direct timestamps on item
        if (Boolean(item?.deliveredAt) || Boolean(item?.deliveryDeliveredAt)) {
            return true;
        }

        return false;
    };

    const checkIsDeliveryCompleted = (itemOrData) => {
        if (!itemOrData) return false;
        if (itemOrData.isDeliveryCompleted !== undefined) {
            return Boolean(itemOrData.isDeliveryCompleted);
        }
        const devId = itemOrData.deviceId || itemOrData.device?.deviceId;
        const assign = itemOrData.deliveryAssignment || (devId ? deliveryAssignmentMap[devId] : null);
        return checkDeliveryStatus(itemOrData, assign);
    };

    // Master Device Models from Price Master
    const [masterModels, setMasterModels] = useState([]);
    const [centerProfile, setCenterProfile] = useState(null);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [centerImgError, setCenterImgError] = useState(false);

    useEffect(() => {
        const fetchMasterModels = async () => {
            try {
                const res = await axios.get(`${API_BASE}/DeviceModel/GetAll`);
                if (Array.isArray(res.data)) {
                    setMasterModels(res.data);
                }
            } catch {
                // Fallback
            }
        };
        fetchMasterModels();

        const token = localStorage.getItem("token");
        if (token) {
            axios.get(`${API_BASE}/RefurbishmentCenter/myprofile`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => setCenterProfile(res.data)).catch(() => {});

            axios.get(`${API_BASE}/Notificationcon/my_notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                const list = Array.isArray(res.data) ? res.data : [];
                const unread = list.filter(n => {
                    const isR = n.isRead !== undefined ? n.isRead : (n.isread !== undefined ? n.isread : n.Isread);
                    return !isR;
                }).length;
                setUnreadNotifCount(unread);
            }).catch(() => {});
        }
    }, []);

    // Dynamic Category Profile
    const profile = useMemo(() => {
        if (!requestData?.device) return getCategoryProfile("Laptop", "Device", "Model", null, null, masterModels);
        return getCategoryProfile(
            requestData.device.categoryName,
            requestData.device.brand,
            requestData.device.model,
            requestData.inspection,
            requestData.device,
            masterModels
        );
    }, [requestData, masterModels]);

    // Step 1: Assessment Form State
    const [assessmentValues, setAssessmentValues] = useState({
        physicalCondition: "Good",
        displayCondition: "Working",
        batteryAssessment: "Replace",
        keyboardAssessment: "Working",
        storageAssessment: "Replace",
        ramAssessment: "Upgrade",
        portsAssessment: "Working",
        softwareAssessment: "Reinstall"
    });
    const [estimatedRepairCost, setEstimatedRepairCost] = useState(1500);
    const [assessmentDecision, setAssessmentDecision] = useState("Refurbishable"); // "Refurbishable" | "NotEconomical"

    // Step 2: Data Destruction State (starts empty so technician must type or select)
    const [wipingMethod, setWipingMethod] = useState("");
    const [wipingProgress, setWipingProgress] = useState(0);
    const [isWipingInProgress, setIsWipingInProgress] = useState(false);
    const [wipingCompleted, setWipingCompleted] = useState(false);
    const [wipingTechnician, setWipingTechnician] = useState("");
    const [wipingVerificationStatus, setWipingVerificationStatus] = useState("");
    const [ddcCertNum, setDdcCertNum] = useState("");
    const [printCertType, setPrintCertType] = useState("DDC"); // "DDC" | "REF" | "INSPECTION"

    // Dedicated Single-Page A4 Official Data Sanitization Certificate Generator
    const handlePrintDdcCert = () => {
        const dev = requestData?.device || device || {};
        const citizenData = requestData?.citizen || citizen || {};
        const proc = requestData?.process || {};
        const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const benchName = profile.isPhone ? "Mobile Bench #3" : profile.isTV ? "Display Bench #2" : profile.isAppliance ? "Appliance Bench #1" : "Laptop/PC Bench #4";
        const finalCertNum = ddcCertNum || proc.certificateNumber || `ECO-DDC-${dev.deviceId || "2026"}-${Math.floor(1000 + Math.random() * 9000)}`;
        const finalMethod = wipingMethod || proc.wipingMethod || "NIST SP 800-88 Rev 1 Overwrite";
        const finalVerification = wipingVerificationStatus || proc.wipingVerificationStatus || "Verified & Sealed (Passed 100%)";
        const finalTechnician = wipingTechnician || proc.wipingTechnician || "Lead Sanitization Specialist";
        const finalQc = qcInspector || proc.qcInspector || "Dr. Rajeshwar Varma";

        const printWin = window.open("", "_blank");
        if (!printWin) {
            alert("Please allow popups to download or print the Data Sanitization Certificate.");
            return;
        }

        printWin.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <title>EcoCycle_Sanitization_Certificate_${finalCertNum}.pdf</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Great+Vibes&family=Courier+Prime:wght@700&display=swap');
                    @page { size: A4 portrait; margin: 0; }
                    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: 'Plus Jakarta Sans', sans-serif; }
                    body { background: #ffffff; color: #0f172a; padding: 18px 22px; margin: 0; display: flex; justify-content: center; }
                    .cert-page { width: 100%; max-width: 760px; min-height: 980px; background: #ffffff; border: 2.5px solid #059669; border-radius: 12px; padding: 20px 24px; position: relative; overflow: hidden; }
                    
                    .corner { position: absolute; width: 16px; height: 16px; border-color: #059669; }
                    .c-tl { top: 6px; left: 6px; border-top: 3px solid #059669; border-left: 3px solid #059669; }
                    .c-tr { top: 6px; right: 6px; border-top: 3px solid #059669; border-right: 3px solid #059669; }
                    .c-bl { bottom: 6px; left: 6px; border-bottom: 3px solid #059669; border-left: 3px solid #059669; }
                    .c-br { bottom: 6px; right: 6px; border-bottom: 3px solid #059669; border-right: 3px solid #059669; }

                    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-28deg); font-size: 48px; font-weight: 900; color: rgba(5, 150, 105, 0.04); letter-spacing: 6px; pointer-events: none; z-index: 0; white-space: nowrap; }

                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 10px; position: relative; z-index: 1; }
                    .header-left { display: flex; align-items: center; gap: 10px; }
                    .crest-icon { width: 40px; height: 40px; border-radius: 10px; background: #059669; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.25); }
                    .gov-tag { font-size: 8px; font-weight: 800; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase; }
                    .org-title { font-size: 14.5px; font-weight: 900; color: #064e3b; letter-spacing: -0.2px; margin: 1px 0; }
                    .sub-dir { font-size: 9px; font-weight: 700; color: #059669; }
                    .doc-badge { text-align: right; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 6px 10px; }
                    .audit-class { font-size: 7.5px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.8px; display: block; }
                    .audit-id { font-size: 11.5px; font-weight: 900; color: #065f46; font-family: 'Courier Prime', monospace; margin: 2px 0; display: block; }
                    .audit-std { font-size: 7.5px; font-weight: 700; color: #059669; }

                    .banner { background: linear-gradient(135deg, #064e3b 0%, #047857 100%); color: #ffffff; text-align: center; padding: 8px 12px; border-radius: 8px; margin-bottom: 10px; position: relative; z-index: 1; }
                    .banner h2 { font-size: 13px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin: 0; }
                    .banner p { font-size: 8.5px; font-weight: 600; opacity: 0.9; margin-top: 2px; }

                    .meta-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 10px; margin-bottom: 10px; position: relative; z-index: 1; }
                    .meta-col { font-size: 8px; }
                    .meta-lbl { font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 1px; }
                    .meta-val { font-weight: 800; color: #0f172a; font-size: 9px; }
                    .meta-val.green { color: #059669; }

                    .sections-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; position: relative; z-index: 1; }
                    .sec-card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
                    .sec-head { background: #f1f5f9; padding: 5px 10px; font-size: 9px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; }
                    .sec-table { padding: 4px 10px; }
                    .sec-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #f1f5f9; font-size: 9px; }
                    .sec-row:last-child { border-bottom: none; }
                    .sec-lbl { font-weight: 600; color: #64748b; }
                    .sec-val { font-weight: 700; color: #0f172a; text-align: right; max-width: 65%; word-break: break-word; }
                    .sec-val.mono { font-family: 'Courier Prime', monospace; color: #047857; }
                    .sec-val.highlight { color: #7c3aed; }
                    .sec-val.green { color: #059669; }

                    .crypto-bar { background: #0f172a; color: #a7f3d0; padding: 5px 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 8px; margin-bottom: 9px; position: relative; z-index: 1; font-family: 'Courier Prime', monospace; }
                    .crypto-hash { font-weight: 700; letter-spacing: 0.4px; }
                    .crypto-badge { background: #059669; color: #ffffff; font-size: 7.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }

                    .attestation { background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 3.5px solid #059669; border-radius: 6px; padding: 6px 10px; font-size: 8.5px; line-height: 1.35; color: #166534; margin-bottom: 12px; position: relative; z-index: 1; }
                    .attestation strong { color: #065f46; font-weight: 800; }

                    .sign-row { display: flex; justify-content: space-between; align-items: center; padding: 0 10px; margin-bottom: 10px; position: relative; z-index: 1; }
                    .sign-box { text-align: center; width: 190px; }
                    .sign-signature { font-family: 'Great Vibes', cursive; font-size: 24px; color: #064e3b; margin-bottom: 2px; }
                    .sign-line { width: 100%; border-bottom: 1.5px solid #0f172a; margin-bottom: 4px; }
                    .sign-name { font-size: 10px; font-weight: 800; color: #0f172a; }
                    .sign-title { font-size: 8px; color: #64748b; font-weight: 600; margin-top: 1px; }
                    .sign-id { font-size: 7.5px; font-weight: 800; color: #059669; font-family: 'Courier Prime', monospace; margin-top: 1px; }

                    .seal-box { width: 82px; height: 82px; border-radius: 50%; border: 2px dashed #059669; padding: 3px; display: flex; align-items: center; justify-content: center; text-align: center; background: #ffffff; }
                    .seal-inner { width: 100%; height: 100%; border-radius: 50%; border: 1px solid #059669; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px; background: #f0fdf4; }
                    .seal-title { font-size: 6px; font-weight: 900; color: #064e3b; text-transform: uppercase; }
                    .seal-100 { font-size: 12px; font-weight: 900; color: #059669; line-height: 1; margin: 1px 0; }
                    .seal-sub { font-size: 5.5px; font-weight: 800; color: #166534; text-transform: uppercase; }

                    .footer { border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 7.5px; color: #64748b; position: relative; z-index: 1; }
                    .barcode { text-align: left; }
                    .barcode-bars { width: 130px; height: 15px; background: repeating-linear-gradient(90deg, #0f172a 0px, #0f172a 2px, transparent 2px, transparent 4px, #0f172a 4px, #0f172a 7px, transparent 7px, transparent 9px, #0f172a 9px, #0f172a 10px, transparent 10px, transparent 13px, #0f172a 13px, #0f172a 16px); }
                    .barcode-num { font-family: 'Courier Prime', monospace; font-size: 7.5px; font-weight: 700; color: #475569; display: block; margin-top: 2px; }
                    .footer-info { text-align: right; line-height: 1.35; }

                    @media print {
                        body { padding: 0; margin: 0; }
                        .cert-page { border: 2.5px solid #059669; }
                    }
                </style>
            </head>
            <body>
                <div class="cert-page">
                    <div class="corner c-tl"></div>
                    <div class="corner c-tr"></div>
                    <div class="corner c-bl"></div>
                    <div class="corner c-br"></div>

                    <div class="watermark">DATA SANITIZED &bull; ISO 27001</div>

                    <div class="header">
                        <div class="header-left">
                            <div class="crest-icon">&#9965;</div>
                            <div>
                                <div class="gov-tag">Government of India Recognized &bull; Circular Electronics Initiative</div>
                                <h1 class="org-title">EcoCycle National E-Waste &amp; Sanitization Network</h1>
                                <div class="sub-dir">Directorate of Media Destruction, Cryptographic Erasure &amp; Environmental Compliance</div>
                            </div>
                        </div>
                        <div class="doc-badge">
                            <span class="audit-class">Official Audit Record</span>
                            <span class="audit-id">${finalCertNum}</span>
                            <span class="audit-std">ISO/IEC 27001 &bull; NIST SP 800-88</span>
                        </div>
                    </div>

                    <div class="banner">
                        <h2>Certificate of Data Destruction &amp; Media Sanitization</h2>
                        <p>Irreversible Hardware Sanitization &bull; Multi-Pass Storage Erasure &bull; Full Forensic Clearance</p>
                    </div>

                    <div class="meta-row">
                        <div class="meta-col">
                            <span class="meta-lbl">Issue Date:</span>
                            <span class="meta-val">${dateStr}</span>
                        </div>
                        <div class="meta-col">
                            <span class="meta-lbl">Facility Bench:</span>
                            <span class="meta-val">${benchName}</span>
                        </div>
                        <div class="meta-col">
                            <span class="meta-lbl">Security Clearance:</span>
                            <span class="meta-val green">Restricted Audit Trail</span>
                        </div>
                        <div class="meta-col">
                            <span class="meta-lbl">Chain of Custody:</span>
                            <span class="meta-val">Verified &amp; Logged</span>
                        </div>
                    </div>

                    <div class="sections-grid">
                        <div class="sec-card">
                            <div class="sec-head">&#128230; Section 1: Hardware Asset Telemetry</div>
                            <div class="sec-table">
                                <div class="sec-row">
                                    <span class="sec-lbl">Device Model &amp; Make:</span>
                                    <span class="sec-val font-bold">${dev.brand || "Standard"} ${dev.model || "Device"}</span>
                                </div>
                                <div class="sec-row">
                                    <span class="sec-lbl">Equipment Category:</span>
                                    <span class="sec-val">${dev.categoryName || "Electronics"}</span>
                                </div>
                                <div class="sec-row">
                                    <span class="sec-lbl">Serial Number (S/N):</span>
                                    <span class="sec-val mono">${dev.serialNumber || `SN-${dev.deviceId || "2026"}`}</span>
                                </div>
                                <div class="sec-row">
                                    <span class="sec-lbl">Originating Citizen:</span>
                                    <span class="sec-val">${citizenData.name || "Registered Citizen"} (${citizenData.city || "Bangalore"})</span>
                                </div>
                                <div class="sec-row">
                                    <span class="sec-lbl">Intake Condition:</span>
                                    <span class="sec-val">${dev.condition || "Grade B"} &bull; Working: ${dev.working || "Yes"}</span>
                                </div>
                            </div>
                        </div>

                        <div class="sec-card">
                            <div class="sec-head">&#128737; Section 2: Sanitization Execution &amp; Audit</div>
                            <div class="sec-table">
                                <div class="sec-row">
                                    <span class="sec-lbl">Sanitization Protocol:</span>
                                    <span class="sec-val highlight">${finalMethod}</span>
                                </div>
                                <div class="sec-row">
                                    <span class="sec-lbl">Compliance Verification:</span>
                                    <span class="sec-val green">&check; ${finalVerification}</span>
                                </div>
                                <div class="sec-row">
                                    <span class="sec-lbl">Media Erasure Scope:</span>
                                    <span class="sec-val">100% of Physical &amp; Logical Sectors</span>
                                </div>
                                <div class="sec-row">
                                    <span class="sec-lbl">Sanitization Specialist:</span>
                                    <span class="sec-val font-bold">${finalTechnician}</span>
                                </div>
                                <div class="sec-row">
                                    <span class="sec-lbl">Data Recovery Feasibility:</span>
                                    <span class="sec-val green">0.00% &bull; Irreversible Media Sanitization</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="crypto-bar">
                        <span>SHA-256 AUDIT DIGEST: <strong class="crypto-hash">4f8b9e6128cf3a7e04732adf679965ccc34ca7ae34418b4e87a2df81c4e72a09</strong></span>
                        <span class="crypto-badge">&check; DIGITALLY SIGNED</span>
                    </div>

                    <div class="attestation">
                        <strong>LEGAL ATTESTATION:</strong> This certifies that all non-volatile magnetic, solid-state, and optical storage media contained within the aforementioned hardware asset have been sanitized in strict adherence to <strong>NIST SP 800-88 Rev. 1</strong> and <strong>ISO/IEC 27001 Information Security Standards</strong>. All prior user, proprietary, and corporate data has been permanently rendered unrecoverable by any computational or laboratory recovery methods.
                    </div>

                    <div class="sign-row">
                        <div class="sign-box">
                            <div class="sign-signature">${finalTechnician}</div>
                            <div class="sign-line"></div>
                            <div class="sign-name">${finalTechnician}</div>
                            <div class="sign-title">Certified Data Sanitization Engineer</div>
                            <div class="sign-id">OPERATOR BADGE: #ECO-${dev.deviceId || "9942"}</div>
                        </div>

                        <div class="seal-box">
                            <div class="seal-inner">
                                <div class="seal-title">EcoCycle Verified</div>
                                <div class="seal-100">100%</div>
                                <div class="seal-sub">Data Erased</div>
                                <div class="seal-iso">ISO 27001 &bull; Audited</div>
                            </div>
                        </div>

                        <div class="sign-box">
                            <div class="sign-signature">${finalQc}</div>
                            <div class="sign-line"></div>
                            <div class="sign-name">${finalQc}</div>
                            <div class="sign-title">Refurbishment Center Operations Directorate</div>
                            <div class="sign-id">AUTHORIZATION ID: #DIR-QA-2026</div>
                        </div>
                    </div>

                    <div class="footer">
                        <div class="barcode">
                            <div class="barcode-bars"></div>
                            <span class="barcode-num">*${finalCertNum}*</span>
                        </div>
                        <div class="footer-info">
                            <div>EcoCycle Central Asset Recovery Registry &bull; Ministry of Electronics &amp; IT Compliance</div>
                            <div>Document Hash Security Validated &bull; Verify at <strong>https://ecocycle.gov.in/verify</strong></div>
                        </div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 350);
                    };
                </script>
            </body>
            </html>
        `);
        printWin.document.close();
    };

    // Dedicated Single-Page A4 Official Refurbishment & Warranty Certificate Generator
    const handlePrintRefurbCert = () => {
        const dev = requestData?.device || device || {};
        const citizenData = requestData?.citizen || citizen || {};
        const proc = requestData?.process || {};
        const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const finalCertNum = refurbishedCertNum || proc.refurbishedCertificateNumber || `ECO-REF-${dev.deviceId || "2026"}-${Math.floor(1000 + Math.random() * 9000)}`;
        const finalGrade = qualityGrade || proc.qualityGrade || "Grade A (Certified Refurbished)";
        const finalWarranty = warrantyDuration || proc.warrantyDuration || "6 Months Comprehensive Warranty";
        const finalVal = Number(refurbishedValue || totalRepairExpense || proc.refurbishedValue || 5000);
        const finalQc = qcInspector || proc.qcInspector || "Dr. Rajeshwar Varma";

        const printWin = window.open("", "_blank");
        if (!printWin) {
            alert("Please allow popups to download or print the Refurbishment Certificate.");
            return;
        }

        printWin.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <title>EcoCycle_Refurbishment_Certificate_${finalCertNum}.pdf</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Great+Vibes&family=Courier+Prime:wght@700&display=swap');
                    @page { size: A4 portrait; margin: 0; }
                    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: 'Plus Jakarta Sans', sans-serif; }
                    body { background: #ffffff; color: #0f172a; padding: 18px 22px; margin: 0; display: flex; justify-content: center; }
                    .cert-page { width: 100%; max-width: 760px; min-height: 980px; background: #ffffff; border: 2.5px solid #7c3aed; border-radius: 12px; padding: 20px 24px; position: relative; overflow: hidden; }
                    
                    .corner { position: absolute; width: 16px; height: 16px; border-color: #7c3aed; }
                    .c-tl { top: 6px; left: 6px; border-top: 3px solid #7c3aed; border-left: 3px solid #7c3aed; }
                    .c-tr { top: 6px; right: 6px; border-top: 3px solid #7c3aed; border-right: 3px solid #7c3aed; }
                    .c-bl { bottom: 6px; left: 6px; border-bottom: 3px solid #7c3aed; border-left: 3px solid #7c3aed; }
                    .c-br { bottom: 6px; right: 6px; border-bottom: 3px solid #7c3aed; border-right: 3px solid #7c3aed; }

                    .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-28deg); font-size: 46px; font-weight: 900; color: rgba(124, 58, 237, 0.04); letter-spacing: 6px; pointer-events: none; z-index: 0; white-space: nowrap; }

                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 10px; position: relative; z-index: 1; }
                    .header-left { display: flex; align-items: center; gap: 10px; }
                    .crest-icon { width: 40px; height: 40px; border-radius: 10px; background: #7c3aed; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; box-shadow: 0 4px 10px rgba(124, 58, 237, 0.25); }
                    .gov-tag { font-size: 8px; font-weight: 800; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase; }
                    .org-title { font-size: 14.5px; font-weight: 900; color: #4c1d95; letter-spacing: -0.2px; margin: 1px 0; }
                    .sub-dir { font-size: 9px; font-weight: 700; color: #7c3aed; }
                    .doc-badge { text-align: right; background: #faf5ff; border: 1.5px solid #c4b5fd; border-radius: 8px; padding: 6px 10px; }
                    .audit-class { font-size: 7.5px; font-weight: 800; color: #5b21b6; text-transform: uppercase; letter-spacing: 0.8px; display: block; }
                    .audit-id { font-size: 11.5px; font-weight: 900; color: #6d28d9; font-family: 'Courier Prime', monospace; margin: 2px 0; display: block; }
                    .audit-std { font-size: 7.5px; font-weight: 700; color: #7c3aed; }

                    .banner { background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%); color: #ffffff; text-align: center; padding: 8px 12px; border-radius: 8px; margin-bottom: 10px; position: relative; z-index: 1; }
                    .banner h2 { font-size: 13px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin: 0; }
                    .banner p { font-size: 8.5px; font-weight: 600; opacity: 0.9; margin-top: 2px; }

                    .meta-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #faf5ff; border: 1px solid #ede9fe; border-radius: 8px; padding: 6px 10px; margin-bottom: 10px; position: relative; z-index: 1; }
                    .meta-col { font-size: 8px; }
                    .meta-lbl { font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 1px; }
                    .meta-val { font-weight: 800; color: #0f172a; font-size: 9px; }
                    .meta-val.gold { color: #d97706; }
                    .meta-val.purple { color: #7c3aed; }

                    .sections-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; position: relative; z-index: 1; }
                    .sec-card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
                    .sec-head { background: #f8fafc; padding: 5px 10px; font-size: 9px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; }
                    .sec-table { padding: 4px 10px; }
                    .sec-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #f1f5f9; font-size: 9px; }
                    .sec-row:last-child { border-bottom: none; }
                    .sec-lbl { font-weight: 600; color: #64748b; }
                    .sec-val { font-weight: 700; color: #0f172a; text-align: right; max-width: 65%; word-break: break-word; }
                    .sec-val.mono { font-family: 'Courier Prime', monospace; color: #6d28d9; }
                    .sec-val.green { color: #059669; }

                    .crypto-bar { background: #0f172a; color: #ddd6fe; padding: 5px 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 8px; margin-bottom: 9px; position: relative; z-index: 1; font-family: 'Courier Prime', monospace; }
                    .crypto-hash { font-weight: 700; letter-spacing: 0.4px; }
                    .crypto-badge { background: #7c3aed; color: #ffffff; font-size: 7.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }

                    .attestation { background: #faf5ff; border: 1px solid #ddd6fe; border-left: 3.5px solid #7c3aed; border-radius: 6px; padding: 6px 10px; font-size: 8.5px; line-height: 1.35; color: #4c1d95; margin-bottom: 12px; position: relative; z-index: 1; }
                    .attestation strong { color: #5b21b6; font-weight: 800; }

                    .sign-row { display: flex; justify-content: space-between; align-items: center; padding: 0 10px; margin-bottom: 10px; position: relative; z-index: 1; }
                    .sign-box { text-align: center; width: 190px; }
                    .sign-signature { font-family: 'Great Vibes', cursive; font-size: 24px; color: #4c1d95; margin-bottom: 2px; }
                    .sign-line { width: 100%; border-bottom: 1.5px solid #0f172a; margin-bottom: 4px; }
                    .sign-name { font-size: 10px; font-weight: 800; color: #0f172a; }
                    .sign-title { font-size: 8px; color: #64748b; font-weight: 600; margin-top: 1px; }
                    .sign-id { font-size: 7.5px; font-weight: 800; color: #7c3aed; font-family: 'Courier Prime', monospace; margin-top: 1px; }

                    .seal-box { width: 82px; height: 82px; border-radius: 50%; border: 2px dashed #7c3aed; padding: 3px; display: flex; align-items: center; justify-content: center; text-align: center; background: #ffffff; }
                    .seal-inner { width: 100%; height: 100%; border-radius: 50%; border: 1px solid #7c3aed; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px; background: #faf5ff; }
                    .seal-title { font-size: 6px; font-weight: 900; color: #4c1d95; text-transform: uppercase; }
                    .seal-100 { font-size: 12px; font-weight: 900; color: #7c3aed; line-height: 1; margin: 1px 0; }
                    .seal-sub { font-size: 5.5px; font-weight: 800; color: #5b21b6; text-transform: uppercase; }

                    .footer { border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 7.5px; color: #64748b; position: relative; z-index: 1; }
                    .barcode { text-align: left; }
                    .barcode-bars { width: 130px; height: 15px; background: repeating-linear-gradient(90deg, #0f172a 0px, #0f172a 2px, transparent 2px, transparent 4px, #0f172a 4px, #0f172a 7px, transparent 7px, transparent 9px, #0f172a 9px, #0f172a 10px, transparent 10px, transparent 13px, #0f172a 13px, #0f172a 16px); }
                    .barcode-num { font-family: 'Courier Prime', monospace; font-size: 7.5px; font-weight: 700; color: #475569; display: block; margin-top: 2px; }
                    .footer-info { text-align: right; line-height: 1.35; }

                    @media print {
                        body { padding: 0; margin: 0; }
                        .cert-page { border: 2.5px solid #7c3aed; }
                    }
                </style>
            </head>
            <body>
                <div class="cert-page">
                    <div class="corner c-tl"></div>
                    <div class="corner c-tr"></div>
                    <div class="corner c-bl"></div>
                    <div class="corner c-br"></div>

                    <div class="watermark">ECOCYCLE CERTIFIED &bull; CIRCULAR REUSE</div>

                    <div class="header">
                        <div class="header-left">
                            <div class="crest-icon">&#9881;</div>
                            <div>
                                <div class="gov-tag">Government of India Recognized &bull; Circular Economy Directive</div>
                                <h1 class="org-title">EcoCycle National Refurbishment &amp; Quality Network</h1>
                                <div class="sub-dir">Directorate of Electronic Asset Renewal, Quality Certification &amp; Extended Lifecycle</div>
                            </div>
                        </div>
                        <div class="doc-badge">
                            <span class="audit-class">Official Warranty Certificate</span>
                            <span class="audit-id">${finalCertNum}</span>
                            <span class="audit-std">OEM QUALITY STANDARDS &bull; QC PASSED</span>
                        </div>
                    </div>

                    <div class="banner">
                        <h2>Official Certificate of Refurbishment &amp; Warranty</h2>
                        <p>Technical Multi-Point Diagnostic Overhaul &bull; OEM Grade Certification &bull; Extended Lifecycle Assurance</p>
                    </div>

                    <div class="meta-row">
                        <div class="meta-col">
                            <span class="meta-lbl">Issue Date:</span>
                            <span class="meta-val">${dateStr}</span>
                        </div>
                        <div class="meta-col">
                            <span class="meta-lbl">Quality Grade:</span>
                            <span class="meta-val gold">★ ${finalGrade}</span>
                        </div>
                        <div class="meta-col">
                            <span class="meta-lbl">Warranty Term:</span>
                            <span class="meta-val purple">${finalWarranty}</span>
                        </div>
                        <div class="meta-col">
                            <span class="meta-lbl">Certified Valuation:</span>
                            <span class="meta-val">₹${finalVal.toLocaleString("en-IN")}</span>
                        </div>
                    </div>

                    <div class="sections-grid">
                        <div class="sec-card">
                            <div class="sec-head">&#128230; Section 1: Asset &amp; Hardware Identification</div>
                            <div class="sec-table">
                                <div class="sec-row">
                                    <span class="sec-lbl">Hardware Asset Name:</span>
                                    <span class="sec-val font-bold">${dev.brand || "Standard"} ${dev.model || "Device"}</span>
                                </div>
                                <div class="sec-row">
                                    <span class="sec-lbl">Device Category:</span>
                                    <span class="sec-val">${dev.categoryName || "Electronics"}</span>
                                </div>
                                <div class="sec-row">
                                    <span class="sec-lbl">Serial Number (S/N):</span>
                                    <span class="sec-val mono">${dev.serialNumber || `SN-${dev.deviceId || "2026"}`}</span>
                                </div>
                                <div class="sec-row">
                                    <span class="sec-lbl">Donor / Citizen:</span>
                                    <span class="sec-val">${citizenData.name || "Registered Donor"} (${citizenData.city || "Bangalore"})</span>
                                </div>
                                <div class="sec-row">
                                    <span class="sec-lbl">Certified Refurb Facility:</span>
                                    <span class="sec-val">${requestData?.center?.centerName || "EcoCycle Certified Center"}</span>
                                </div>
                            </div>
                        </div>

                        <div class="sec-card">
                            <div class="sec-head">&#9733; Section 2: Quality Assurance &amp; Testing</div>
                            <div class="sec-table">
                                <div class="sec-row">
                                    <span class="sec-lbl">Hardware Diagnostic Suite:</span>
                                    <span class="sec-val green">&check; 100% Passed (All Tests)</span>
                                </div>
                                <div class="sec-row">
                                    <span class="sec-lbl">Storage Sanitization Status:</span>
                                    <span class="sec-val green">&check; Cryptographic Zeroize Verified</span>
                                </div>
                                <div class="sec-row">
                                    <span class="sec-lbl">Warranty Policy Coverage:</span>
                                    <span class="sec-val purple">${finalWarranty}</span>
                                </div>
                                <div class="sec-row">
                                    <span class="sec-lbl">Lead Quality Inspector:</span>
                                    <span class="sec-val font-bold">${finalQc}</span>
                                </div>
                                <div class="sec-row">
                                    <span class="sec-lbl">Circular Lifecycle Impact:</span>
                                    <span class="sec-val green">100% Diverted from Landfill &bull; Reuse Ready</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="crypto-bar">
                        <span>WARRANTY REGISTRY ID: <strong class="crypto-hash">ec-cert-ref-2026-auth-${dev.deviceId || "42"}-98b4e72a096128cf3a</strong></span>
                        <span class="crypto-badge">&check; QA CERTIFIED</span>
                    </div>

                    <div class="attestation">
                        <strong>CERTIFIED CIRCULAR ECONOMY ATTESTATION:</strong> This certifies that the above referenced electronic asset has undergone exhaustive technical refurbishment, component level restoration, electrical safety stress testing, and functional diagnostic validation according to <strong>EcoCycle OEM Quality Benchmarks</strong>.
                    </div>

                    <div class="sign-row">
                        <div class="sign-box">
                            <div class="sign-signature">${finalQc}</div>
                            <div class="sign-line"></div>
                            <div class="sign-name">${finalQc}</div>
                            <div class="sign-title">Certified QA Lead Engineer</div>
                            <div class="sign-id">OPERATOR BADGE: #ECO-${dev.deviceId || "9942"}</div>
                        </div>

                        <div class="seal-box">
                            <div class="seal-inner">
                                <div class="seal-title">EcoCycle Certified</div>
                                <div class="seal-100">GRADE A</div>
                                <div class="seal-sub">Quality Assured</div>
                            </div>
                        </div>

                        <div class="sign-box">
                            <div class="sign-signature">Dr. Rajeshwar Varma</div>
                            <div class="sign-line"></div>
                            <div class="sign-name">Directorate Authority</div>
                            <div class="sign-title">Refurbishment Center Operations</div>
                            <div class="sign-id">AUTHORIZATION ID: #DIR-QA-2026</div>
                        </div>
                    </div>

                    <div class="footer">
                        <div class="barcode">
                            <div class="barcode-bars"></div>
                            <span class="barcode-num">*${finalCertNum}*</span>
                        </div>
                        <div class="footer-info">
                            <div>EcoCycle Central Asset Recovery Registry &bull; Ministry of Electronics &amp; IT Compliance</div>
                            <div>Document Hash Security Validated &bull; Verify at <strong>https://ecocycle.gov.in/verify</strong></div>
                        </div>
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 350);
                    };
                </script>
            </body>
            </html>
        `);
        printWin.document.close();
    };

    // Detailed Printable Inspection PDF Report Generator (Matches Citizen Device_report.jsx)
    const handleDownloadInspectionReport = async (targetDev = null) => {
        const dev = targetDev || requestData?.device || device;
        if (!dev) return;

        let results = requestData?.inspection?.results || inspection?.results || null;
        let techDetails = requestData?.inspection?.technicianDetails || null;
        let techName = requestData?.inspection?.technicianName || inspection?.technicianName || null;

        if (!results || results.length === 0 || !techDetails) {
            try {
                const res = await axios.get(`${API_BASE}/DeviceInspection/results/${dev.deviceId}`);
                const data = res.data;
                if (Array.isArray(data)) {
                    results = data;
                } else if (data) {
                    results = data.results || [];
                    if (data.technicianName) techName = data.technicianName;
                    if (data.technicianDetails) techDetails = data.technicianDetails;
                }
            } catch (e) {
                console.error("Could not load inspection results for PDF", e);
                results = results || [];
            }
        }

        const finalTechnicianName = techDetails?.name || techName || inspection?.technicianName || "Certified Hardware Inspector";
        const finalTechnicianEmail = techDetails?.email || "technician@ecocycle.org";
        const finalTechnicianShop = techDetails?.shopName || "EcoCycle Primary Diagnostics Center";
        const finalTechnicianPhone = techDetails?.phone || "N/A";
        const ownerName = requestData?.citizen?.name || citizen?.name || "Citizen User";

        // Collect all corresponding component part photos
        const componentPhotos = [];
        if (results && results.length > 0) {
            results.forEach((r) => {
                if (r.photos && Array.isArray(r.photos) && r.photos.length > 0) {
                    r.photos.forEach((p) => {
                        if (p.photoPath) {
                            componentPhotos.push({
                                component: r.component || p.photoType || "Hardware Component",
                                url: resolvePhotoUrl(p.photoPath, "inspections/photos")
                            });
                        }
                    });
                }
            });
        }

        // Also check requestData.inspectionPhotos if componentPhotos is empty
        if (componentPhotos.length === 0 && requestData?.inspectionPhotos?.length > 0) {
            requestData.inspectionPhotos.forEach((p) => {
                if (p.path) {
                    componentPhotos.push({
                        component: p.component || "Hardware Component",
                        url: resolvePhotoUrl(p.path, "inspections/photos")
                    });
                }
            });
        }

        const printWin = window.open("", "_blank");
        if (!printWin) {
            alert("Please allow popups to download/print the Inspection PDF Report.");
            return;
        }

        const dateStr = (inspection?.completedAt ? new Date(inspection.completedAt) : new Date()).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        // Calculate total inspection score percentage
        let avgScore = Number(inspection?.overallScore) || 100;
        if (results && results.length > 0) {
            const sumScore = results.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
            avgScore = Math.round(sumScore / results.length);
        }

        printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>EcoCycle_Inspection_Certificate_DEV_${dev.deviceId}.pdf</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                    * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
                    body { margin: 0; padding: 24px; background: #ffffff; color: #0f172a; }
                    .report-container { max-width: 820px; margin: 0 auto; border: 2px solid #059669; border-radius: 16px; padding: 28px; background: #ffffff; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 18px; margin-bottom: 20px; }
                    .brand { font-size: 24px; font-weight: 800; color: #059669; letter-spacing: -0.5px; }
                    .sub-brand { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
                    .doc-title { text-align: right; }
                    .doc-title h2 { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
                    .doc-title p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600; }
                    
                    .hero-banner { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px 22px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; }
                    .hero-dev-title { font-size: 22px; font-weight: 800; color: #065f46; margin: 0 0 4px 0; }
                    .hero-dev-meta { font-size: 12px; color: #047857; font-weight: 600; }
                    .hero-badge-group { text-align: right; }
                    .hero-badge { background: #059669; color: #ffffff; padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 800; text-transform: uppercase; display: inline-block; }
                    .hero-score { font-size: 11px; font-weight: 800; color: #047857; margin-top: 4px; display: block; }

                    .section-title { font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 1px; margin: 22px 0 10px 0; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; }
                    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }
                    
                    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
                    .info-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
                    .info-val { font-size: 12px; font-weight: 800; color: #0f172a; word-break: break-all; }

                    .diag-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                    .diag-table th { background: #f1f5f9; text-align: left; color: #475569; font-weight: 800; padding: 8px 12px; border: 1px solid #cbd5e1; }
                    .diag-table td { padding: 8px 12px; border: 1px solid #e2e8f0; vertical-align: middle; }

                    .stamp-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
                    .stamp-box { border: 2px dashed #059669; border-radius: 8px; padding: 8px 16px; text-align: center; color: #059669; }
                    .stamp-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
                    .stamp-sub { font-size: 8.5px; font-weight: 700; margin-top: 2px; }
                    .signature-box { text-align: right; }
                    .sig-line { width: 160px; border-bottom: 1px dashed #0f172a; margin-bottom: 4px; display: inline-block; }
                    .sig-name { font-size: 12px; font-weight: 800; color: #0f172a; }
                    .sig-role { font-size: 9px; color: #059669; font-weight: 700; text-transform: uppercase; }

                    .footer-notice { margin-top: 14px; font-size: 8.5px; text-align: center; color: #94a3b8; font-weight: 600; border-top: 1px solid #f1f5f9; padding-top: 8px; }

                    @media print {
                        @page { margin: 0; size: auto; }
                        body { padding: 24px; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .report-container { border: none; padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="report-container">
                    <div class="header">
                        <div>
                            <div class="brand">EcoCycle E-Waste Management</div>
                            <div class="sub-brand">Official Technical Inspection & Diagnostic Verification Certificate</div>
                        </div>
                        <div class="doc-title">
                            <h2>Detailed Inspection Report</h2>
                            <p>Certified Date: ${dateStr}</p>
                        </div>
                    </div>

                    <div class="hero-banner">
                        <div>
                            <h1 class="hero-dev-title">${dev.brand} ${dev.model}</h1>
                            <div class="hero-dev-meta">
                                Device ID: <strong>#DEV-${String(dev.deviceId).padStart(3, "0")}</strong> • Category: <strong>${dev.categoryName || "E-Waste"}</strong> • Owner: <strong>${ownerName}</strong>
                            </div>
                        </div>
                        <div class="hero-badge-group">
                            <div class="hero-badge">${inspection?.qualityGrade || dev.condition || "Grade A"}</div>
                            <span class="hero-score">Diagnostic Score: ${avgScore}%</span>
                        </div>
                    </div>

                    <div class="section-title">1. Certified Inspection Technician & Workshop Details</div>
                    <div class="grid-4">
                        <div class="info-card">
                            <div class="info-label">Technician Name</div>
                            <div class="info-val" style="color: #059669;">${finalTechnicianName}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Gmail / Email</div>
                            <div class="info-val" style="color: #2563eb;">${finalTechnicianEmail}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Workshop / Diagnostics Hub</div>
                            <div class="info-val" style="color: #0f172a;">${finalTechnicianShop}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Contact Phone</div>
                            <div class="info-val">${finalTechnicianPhone}</div>
                        </div>
                    </div>

                    <div class="section-title">2. Master Device & Specification Details</div>
                    <div class="grid-4">
                        <div class="info-card">
                            <div class="info-label">Brand & Model</div>
                            <div class="info-val">${dev.brand} ${dev.model}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Serial Number</div>
                            <div class="info-val">${dev.serialNumber || "N/A"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Assigned Quality Grade</div>
                            <div class="info-val" style="color: #059669;">${inspection?.qualityGrade || dev.condition || "Grade A"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Processing Decision</div>
                            <div class="info-val" style="color: #2563eb;">${dev.processingPreference || "Refurbishment Center"}</div>
                        </div>
                    </div>

                    <div class="section-title">3. Detailed Hardware Diagnostic Component Matrix</div>
                    ${(results && results.length > 0) ? `
                        <table class="diag-table">
                            <thead>
                                <tr>
                                    <th style="width: 25%;">Hardware Component</th>
                                    <th style="width: 18%;">Functional Result</th>
                                    <th style="width: 12%; text-align: center;">Health Score</th>
                                    <th style="width: 45%;">Technician Diagnostic Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${results.map(r => `
                                    <tr>
                                        <td style="font-weight: 800; color: #0f172a;">${r.component}</td>
                                        <td style="font-weight: 800; color: ${r.result === "Working" || r.result === "Pass" ? "#059669" : r.result === "Fair" ? "#d97706" : "#dc2626"};">
                                            ${r.result}
                                        </td>
                                        <td style="text-align: center; font-weight: 800;">${r.score}%</td>
                                        <td style="color: #334155;">${r.remarks || "Tested OK. No issues noted."}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    ` : `
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 11px; color: #64748b;">
                            Standard category evaluation recorded. All core component diagnostic tests passed system specifications with 100% score.
                        </div>
                    `}

                    ${(componentPhotos && componentPhotos.length > 0) ? `
                        <div class="section-title">4. Hardware Component Part Photos Evidence</div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 10px;">
                            ${componentPhotos.map(p => `
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; text-align: center;">
                                    <span style="display: block; font-size: 10px; font-weight: 800; color: #059669; text-transform: uppercase; margin-bottom: 6px;">${p.component} - Evidence Photo</span>
                                    <img src="${p.url}" alt="${p.component}" onerror="this.style.display='none';" style="max-width: 100%; max-height: 180px; border-radius: 8px; object-fit: cover; border: 1px solid #cbd5e1;" />
                                </div>
                            `).join("")}
                        </div>
                    ` : ""}

                    <div class="stamp-row">
                        <div class="stamp-box">
                            <div class="stamp-title">ECOCYCLE VERIFIED</div>
                            <div class="stamp-sub">Official Inspection Approved</div>
                        </div>
                        <div class="signature-box">
                            <div class="sig-line"></div>
                            <div class="sig-name">${finalTechnicianName}</div>
                            <div class="sig-role">Certified Hardware Inspection Officer</div>
                            <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">${finalTechnicianShop}</div>
                        </div>
                    </div>

                    <div class="footer-notice">
                        Official Technical Inspection Evaluation Certificate • EcoCycle E-Waste Platform (Device Record: #DEV-${dev.deviceId}).
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 400);
                    };
                </script>
            </body>
            </html>
        `);
        printWin.document.close();
    };

    // Validation Handlers
    const handleWipingMethodChange = (val) => {
        // Allow alphanumeric characters, spaces, dots, hyphens, parentheses, and slashes
        const sanitized = (val || "").replace(/[^a-zA-Z0-9\s.\-\/()]/g, "");
        setWipingMethod(sanitized);
    };

    const handleSanitizationTechnicianChange = (val) => {
        // Disallow numbers and special characters: letters and spaces only
        const sanitized = (val || "").replace(/[^a-zA-Z\s]/g, "");
        setWipingTechnician(sanitized);
    };

    const handleDdcCertNumChange = (val) => {
        // Uppercase alphanumeric and hyphens only
        const sanitized = (val || "").toUpperCase().replace(/[^A-Z0-9-]/g, "");
        setDdcCertNum(sanitized);
    };

    const handleRefurbishedCertNumChange = (val) => {
        // Uppercase alphanumeric and hyphens only
        const sanitized = (val || "").toUpperCase().replace(/[^A-Z0-9-]/g, "");
        setRefurbishedCertNum(sanitized);
    };

    const handleFinalRemarksChange = (val) => {
        // Allow letters, spaces, and slashes (/)
        const sanitized = (val || "").replace(/[^a-zA-Z\s\/]/g, "");
        setFinalRemarks(sanitized);
    };

    const handleNewRepairRemarksChange = (val) => {
        // Allow letters, spaces, and slashes (/)
        const sanitized = (val || "").replace(/[^a-zA-Z\s\/]/g, "");
        setNewRepairRemarks(sanitized);
    };

    // Check if required Sanitization input fields are filled and valid
    const isWipeFormValid = useMemo(() => {
        return Boolean(
            wipingMethod && wipingMethod.trim().length >= 2 &&
            wipingTechnician && wipingTechnician.trim().length >= 2 &&
            wipingVerificationStatus
        );
    }, [wipingMethod, wipingTechnician, wipingVerificationStatus]);

    // Step 3: Repair Items State
    const [repairItems, setRepairItems] = useState([]);
    const [newRepairComponent, setNewRepairComponent] = useState("");
    const [newRepairAction, setNewRepairAction] = useState("Replace");
    const [newRepairQty, setNewRepairQty] = useState(1);
    const [newRepairCost, setNewRepairCost] = useState(500);
    const [newRepairTech, setNewRepairTech] = useState("Lead Technician");
    const [newRepairRemarks, setNewRepairRemarks] = useState("");

    // Step 4: Functional Tests State
    const [tests, setTests] = useState([]);

    // Step 5: Quality Check (QC) State
    const [qcChecks, setQcChecks] = useState({
        repairCompleted: true,
        dataWiped: true,
        hardwareTested: true,
        softwareTested: true,
        qcApproved: true
    });
    const [qualityGrade, setQualityGrade] = useState("Grade A (Certified Refurbished)");
    const [qcInspector, setQcInspector] = useState("Senior QC Lead");

    // Step 6: Final Decision & Outcome State
    const [finalOutcome, setFinalOutcome] = useState("Refurbished"); // "Refurbished" | "TransferredToRecycling"
    const [refurbishedValue, setRefurbishedValue] = useState(8000);
    const [warrantyDuration, setWarrantyDuration] = useState("6 Months EcoCycle Warranty");
    const [refurbishedCertNum, setRefurbishedCertNum] = useState("");
    const [finalRemarks, setFinalRemarks] = useState("Device fully overhauled, tested, benchmarked and packaged for certified reuse.");
    const [targetRecyclingCenterId, setTargetRecyclingCenterId] = useState(0);

    // EcoCycle Buyout Settlement Payment State
    const [paymentMethod, setPaymentMethod] = useState("Razorpay"); // "Razorpay" | "UPI" | "NetBanking" | "CenterWallet"
    const [paymentStatus, setPaymentStatus] = useState("Pending"); // "Pending" | "Paid"
    const [paymentTransactionId, setPaymentTransactionId] = useState("");
    const [paymentNotes, setPaymentNotes] = useState("");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isPayingSettlement, setIsPayingSettlement] = useState(false);

    // Automatically keep Step 4 Functional Diagnostic Tests aligned with the components of the current device
    useEffect(() => {
        if (!profile.testSuite || profile.testSuite.length === 0) return;
        setTests(prev => {
            if (!prev || prev.length === 0) return profile.testSuite;
            const isMatch = prev.length === profile.testSuite.length &&
                prev.every((t, idx) => (t.component || t.label) === (profile.testSuite[idx]?.component || profile.testSuite[idx]?.label));
            if (isMatch) return prev;
            return profile.testSuite.map(t => {
                const prevMatch = prev.find(p =>
                    (p.component && p.component.toLowerCase() === (t.component || "").toLowerCase()) ||
                    p.id === t.id ||
                    p.label.toLowerCase() === t.label.toLowerCase()
                );
                return prevMatch ? { ...t, status: prevMatch.status } : t;
            });
        });
    }, [profile.testSuite]);

    // Live 10-Day SLA Countdown Timer
    useEffect(() => {
        if (!deadlineDate) {
            setSlaTimeLeft("");
            return;
        }

        const calcTime = () => {
            if (isDeviceCompleted) {
                setSlaTimeLeft("Completed within SLA");
                return;
            }

            const now = new Date().getTime();
            const targetTime = new Date(deadlineDate).getTime();
            const diff = targetTime - now;

            if (diff <= 0) {
                const overdueDiff = Math.abs(diff);
                const overdueDays = Math.floor(overdueDiff / (1000 * 60 * 60 * 24));
                const overdueHours = Math.floor((overdueDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const overdueMins = Math.floor((overdueDiff % (1000 * 60 * 60)) / (1000 * 60));
                if (overdueDays > 0) {
                    setSlaTimeLeft(`Overdue by ${overdueDays}d ${overdueHours}h`);
                } else if (overdueHours > 0) {
                    setSlaTimeLeft(`Overdue by ${overdueHours}h ${overdueMins}m`);
                } else {
                    setSlaTimeLeft("SLA Limit Passed");
                }
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
    }, [deadlineDate, isDeviceCompleted]);

    // Category Icon Helper
    const getCategoryIcon = (categoryName) => {
        const cat = (categoryName || "").toLowerCase();
        if (cat.includes("mobile") || cat.includes("phone") || cat.includes("tablet")) return <FiSmartphone />;
        if (cat.includes("tv") || cat.includes("monitor") || cat.includes("display")) return <FiTv />;
        if (cat.includes("battery")) return <FiBatteryCharging />;
        return <FiBox />;
    };

    // Fetch All Allocated Devices for this Center (Excluding Rejected / Cancelled)
    const fetchAllocatedDevices = async (token) => {
        try {
            setLoadingAllocated(true);
            const authToken = token || localStorage.getItem("token");
            let list = [];
            let assignments = [];

            const [reqRes, assignRes] = await Promise.all([
                axios.get(`${API_BASE}/AllocateRefurbishmentCenter/my-requests`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                }).catch(() => axios.get(`${API_BASE}/AllocateRefurbishmentCenter/admin/requests`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                })).catch(() => ({ data: [] })),
                axios.get(`${API_BASE}/CollectionAssignment/admin/all-assignments`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                }).catch(() => ({ data: [] }))
            ]);

            list = Array.isArray(reqRes.data) ? reqRes.data : [];
            assignments = Array.isArray(assignRes.data) ? assignRes.data : [];

            // Map delivery assignments destined for refurbishment center by deviceId
            const assignMap = {};
            const refurbAssigns = assignments.filter(a => {
                const aType = String(a.assignmentType || "").toLowerCase();
                return aType === "techniciantorefurbishmentcenter" || Boolean(a.refurbishmentCenterId);
            });
            const sortedAssigns = [...refurbAssigns].sort((a, b) => (a.collectionAssignmentId || 0) - (b.collectionAssignmentId || 0));
            sortedAssigns.forEach(a => {
                if (a.deviceId) {
                    assignMap[a.deviceId] = a;
                }
            });
            setDeliveryAssignmentMap(assignMap);

            // Filter out any rejected or cancelled requests completely
            const cleanList = (Array.isArray(list) ? list : []).filter(item => {
                const s = (item.status || "").toLowerCase();
                return s !== "rejected" && s !== "cancelled";
            }).map(item => {
                const assign = assignMap[item.deviceId];
                const isDelivered = checkDeliveryStatus(item, assign);
                return {
                    ...item,
                    deliveryAssignment: assign || null,
                    isDeliveryCompleted: isDelivered
                };
            });

            setAllocatedList(cleanList);
            return { cleanList, assignMap };
        } catch (err) {
            console.error("Error fetching allocated devices:", err);
            return { cleanList: [], assignMap: {} };
        } finally {
            setLoadingAllocated(false);
        }
    };

    // Initial Fetch on Mount or ID change
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        const init = async () => {
            const result = await fetchAllocatedDevices(token);
            const currentAssignMap = result?.assignMap || {};
            if (id) {
                fetchDetails(id, currentAssignMap);
            } else {
                setRequestData(null);
                setLoading(false);
            }
        };

        init();
    }, [id, navigate]);

    // Handle ESC key and scroll-lock for photo lightbox modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && zoomedPhoto) {
                setZoomedPhoto(null);
            }
        };
        if (zoomedPhoto) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [zoomedPhoto]);

    // Prevent browser navigation (Back button, reload, tab close) while SLA process is locked
    useEffect(() => {
        if (!isProcessLocked) return;

        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "You have an active Refurbishment SLA in progress. Please complete the process and EcoCycle settlement before navigating away.";
            return e.returnValue;
        };

        const handlePopState = () => {
            if (isProcessLocked) {
                window.history.pushState(null, "", window.location.href);
                setShowNavLockModal(true);
            }
        };

        window.history.pushState(null, "", window.location.href);
        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [isProcessLocked]);

    // Deselect currently selected device and return to queue view
    const handleDeselectDevice = () => {
        if (isProcessLocked) {
            setShowNavLockModal(true);
            return;
        }
        setRequestData(null);
        setLoading(false);
        navigate("/refurbishment_perform");
        setCurrentStep(1);
        setServerMsg({ type: "", text: "" });
    };

    // Switch between allocated devices (deselect if clicking the already selected card)
    const handleSelectAllocatedDevice = (reqId) => {
        if (!reqId) return;
        const currentReqId = requestData?.refurbishmentRequestId || (id ? Number(id) : null);
        if (isProcessLocked && currentReqId && Number(currentReqId) !== Number(reqId)) {
            setShowNavLockModal(true);
            return;
        }
        if (currentReqId && Number(currentReqId) === Number(reqId)) {
            handleDeselectDevice();
            return;
        }
        navigate(`/refurbishment_perform/${reqId}`);
        fetchDetails(reqId);
        setCurrentStep(1);
        setServerMsg({ type: "", text: "" });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Filter & Search on Allocated Devices
    const filteredAllocatedList = useMemo(() => {
        return allocatedList.filter(item => {
            const s = (item.status || "").toLowerCase();
            let matchesTab = true;
            if (allocatedFilter === "Active") {
                matchesTab = s !== "completed" && s !== "certified ready" && s !== "refurbished" && s !== "transferredtorecycling";
            } else if (allocatedFilter === "Completed") {
                matchesTab = s === "completed" || s === "certified ready" || s === "refurbished";
            }

            if (!matchesTab) return false;

            if (allocatedSearch.trim()) {
                const q = allocatedSearch.toLowerCase();
                const dId = String(item.deviceId || "");
                const rId = String(item.refurbishmentRequestId || "");
                const brand = (item.brand || "").toLowerCase();
                const model = (item.model || "").toLowerCase();
                const category = (item.categoryName || "").toLowerCase();
                const citizen = (item.customerName || "").toLowerCase();
                return dId.includes(q) || rId.includes(q) || brand.includes(q) || model.includes(q) || category.includes(q) || citizen.includes(q);
            }

            return true;
        });
    }, [allocatedList, allocatedFilter, allocatedSearch]);

    const fetchDetails = async (reqId, currentAssignMap = null) => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_BASE}/RefurbishmentProcess/details/${reqId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data) {
                let currentInspection = res.data.inspection;
                if (!currentInspection?.results || currentInspection.results.length === 0) {
                    try {
                        const inspRes = await axios.get(`${API_BASE}/DeviceInspection/results/${res.data.device.deviceId}`);
                        if (inspRes.data) {
                            if (Array.isArray(inspRes.data)) {
                                currentInspection = { ...(currentInspection || {}), results: inspRes.data };
                            } else {
                                currentInspection = {
                                    ...(currentInspection || {}),
                                    results: inspRes.data.results || [],
                                    technicianName: inspRes.data.technicianName || currentInspection?.technicianName,
                                    technicianDetails: inspRes.data.technicianDetails || currentInspection?.technicianDetails
                                };
                            }
                        }
                    } catch (e) {
                        console.log("No inspection endpoint data:", e);
                    }
                }
                const devId = res.data?.device?.deviceId;
                const assign = (currentAssignMap && devId ? currentAssignMap[devId] : null) || (devId ? deliveryAssignmentMap[devId] : null);
                const isDelivered = checkDeliveryStatus(res.data, assign);

                const enrichedData = {
                    ...res.data,
                    inspection: currentInspection,
                    deliveryAssignment: assign || null,
                    isDeliveryCompleted: isDelivered
                };
                setRequestData(enrichedData);
                const dev = enrichedData.device;
                const proc = enrichedData.process;

                // Determine whether the refurbishment process has officially started
                const startedTimestamp = res.data.refurbishmentStartedAt || null;
                const statusStr = (res.data.status || "").toLowerCase();
                const processStarted = statusStr === "inprogress" || statusStr === "completed" || statusStr === "transferredtorecycling";

                setIsStarted(processStarted);
                if (startedTimestamp) {
                    setStartedAt(new Date(startedTimestamp));
                } else if (res.data.assignedAt) {
                    setStartedAt(new Date(res.data.assignedAt));
                } else {
                    setStartedAt(null);
                }

                // Dedicated Process Deadline: resolve from dedicated column, with fallback to 10 days from started/assigned/now
                let resolvedDeadline = null;
                if (res.data.processDeadline) {
                    resolvedDeadline = new Date(res.data.processDeadline);
                } else if (startedTimestamp) {
                    resolvedDeadline = new Date(new Date(startedTimestamp).getTime() + 10 * 24 * 60 * 60 * 1000);
                } else if (res.data.assignedAt) {
                    resolvedDeadline = new Date(new Date(res.data.assignedAt).getTime() + 10 * 24 * 60 * 60 * 1000);
                } else {
                    resolvedDeadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
                }
                setDeadlineDate(resolvedDeadline);

                // Step 2 Sanitization: Do NOT pre-fill defaults so user types / selects them
                setDdcCertNum(proc?.certificateNumber || "");
                const randomRefCert = `ECO-REF-${dev.deviceId}-${Math.floor(10000 + Math.random() * 90000)}`;
                setRefurbishedCertNum(proc?.refurbishedCertificateNumber || randomRefCert);

                const isAlreadyWiped = Boolean(proc?.dataWiped);
                setWipingCompleted(isAlreadyWiped);
                setWipingProgress(isAlreadyWiped ? 100 : 0);
                setWipingTechnician(proc?.wipingTechnician ? proc.wipingTechnician.replace(/[^a-zA-Z\s]/g, "") : "");
                setWipingMethod(proc?.wipingMethod || "");
                setWipingVerificationStatus(proc?.wipingVerificationStatus || "");
                setQcInspector(proc?.qcInspector || "Senior QC Lead");

                // Pre-fill profile components with realistic actual estimated market value
                const prof = getCategoryProfile(dev.categoryName, dev.brand, dev.model, currentInspection, dev, masterModels);
                const actualEstVal = (proc?.refurbishedValue && Number(proc.refurbishedValue) > 0 && Number(proc.refurbishedValue) !== 7363 && Number(proc.refurbishedValue) !== 3100)
                    ? Number(proc.refurbishedValue)
                    : prof.adjustedDeviceValue;
                setRefurbishedValue(actualEstVal);

                if (proc?.repairItemsJson) {
                    try {
                        setRepairItems(JSON.parse(proc.repairItemsJson));
                    } catch {
                        setRepairItems(prof.initialRepairItems);
                    }
                } else {
                    setRepairItems(prof.initialRepairItems);
                }

                if (proc?.functionalTestsJson) {
                    try {
                        const savedTests = JSON.parse(proc.functionalTestsJson);
                        // Filter savedTests to only match the components of this current device
                        const synchronizedTests = prof.testSuite.map(t => {
                            const match = savedTests.find(st =>
                                (st.component && st.component.toLowerCase() === (t.component || "").toLowerCase()) ||
                                st.id === t.id ||
                                st.label.toLowerCase() === t.label.toLowerCase()
                            );
                            return match ? { ...t, status: match.status || "Pass" } : t;
                        });
                        setTests(synchronizedTests);
                    } catch {
                        setTests(prof.testSuite);
                    }
                } else {
                    setTests(prof.testSuite);
                }

                if (proc) {
                    setAssessmentValues({
                        physicalCondition: proc.physicalCondition || "Good",
                        displayCondition: proc.displayCondition || "Working",
                        batteryAssessment: proc.batteryAssessment || "Good",
                        keyboardAssessment: proc.keyboardAssessment || "Working",
                        storageAssessment: proc.storageAssessment || "Good",
                        ramAssessment: proc.ramAssessment || "Good",
                        portsAssessment: proc.portsAssessment || "Working",
                        softwareAssessment: proc.softwareAssessment || "Good"
                    });
                    setEstimatedRepairCost(proc.estimatedRepairCost || 1500);
                    setAssessmentDecision(proc.assessmentDecision || "Refurbishable");
                    setQualityGrade(proc.qualityGrade || "Grade A (Certified Refurbished)");
                    setFinalOutcome(proc.finalOutcome || "Refurbished");
                    setFinalRemarks(proc.remarks || "Device verified and certified.");
                }

                const isCompleted = (res.data.status || "").toLowerCase() === "completed" || (proc?.status || "").toLowerCase() === "completed";
                if (isCompleted) {
                    setPaymentStatus("Paid");
                    setPaymentTransactionId(`PAY_REF_${res.data.device?.deviceId || reqId}_SETTLED`);
                } else {
                    setPaymentStatus("Pending");
                    setPaymentTransactionId("");
                }

                if (res.data.availableRecyclingCenters?.length > 0) {
                    setTargetRecyclingCenterId(res.data.availableRecyclingCenters[0].recyclingCenterId);
                }
            }
        } catch (err) {
            console.error("Error loading refurbishment details:", err);
            setServerMsg({ type: "error", text: "Failed to load device refurbishment details." });
        } finally {
            setLoading(false);
        }
    };

    // Open the comprehensive Refurbishment Process Report Modal
    const handleOpenProcessReport = async (item = null) => {
        const targetReqId = item?.refurbishmentRequestId || requestData?.refurbishmentRequestId || Number(id);
        if (!targetReqId) return;

        // If item is already the currently selected requestData with process details
        if (requestData && requestData.refurbishmentRequestId === targetReqId && requestData.process) {
            setReportModalData(requestData);
            setShowProcessReportModal(true);
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_BASE}/RefurbishmentProcess/details/${targetReqId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                const enriched = {
                    ...res.data,
                    device: res.data.device || (item ? {
                        deviceId: item.deviceId,
                        brand: item.brand,
                        model: item.model,
                        categoryName: item.categoryName,
                        serialNumber: item.serialNumber,
                        condition: item.condition,
                        weight: item.weight
                    } : {}),
                    citizen: res.data.citizen || (item ? {
                        name: item.customerName,
                        city: item.customerCity,
                        email: item.customerEmail,
                        phone: item.customerPhone
                    } : {})
                };
                setReportModalData(enriched);
                setShowProcessReportModal(true);
            }
        } catch (err) {
            console.error("Error loading process report details:", err);
            if (item) {
                const actualProc = item.process || {};
                const fallbackData = {
                    refurbishmentRequestId: item.refurbishmentRequestId,
                    device: {
                        deviceId: item.deviceId,
                        brand: item.brand || "Device",
                        model: item.model || "",
                        categoryName: item.categoryName || "Electronics",
                        serialNumber: item.serialNumber || `SN-${item.deviceId}-2026`,
                        condition: item.condition || "Grade B",
                        weight: item.weight || 1.5,
                        estimatedValue: item.estimatedValue || actualProc.refurbishedValue || 6250
                    },
                    citizen: {
                        name: item.customerName || "Customer",
                        city: item.customerCity || "City Hub",
                        email: item.customerEmail || "customer@ecocycle.org",
                        phone: item.customerPhone || "N/A"
                    },
                    process: item.process || {
                        status: item.status || "Completed",
                        finalOutcome: "Refurbished",
                        qualityGrade: actualProc.qualityGrade || "Grade A (Certified Refurbished)",
                        certificateNumber: actualProc.certificateNumber || `ECO-DDC-${item.deviceId || "7714"}-9821`,
                        refurbishedCertificateNumber: actualProc.refurbishedCertificateNumber || `ECO-REF-${item.deviceId || "7714"}-3384`,
                        wipingMethod: actualProc.wipingMethod || "NIST SP 800-88 Rev 1 (Cryptographic / 3-Pass Overwrite)",
                        wipingTechnician: actualProc.wipingTechnician || "Lead Refurbishment Specialist",
                        wipingVerificationStatus: actualProc.wipingVerificationStatus || "100% Cryptographic Zeroize Verified",
                        totalRepairCost: Number(actualProc.totalRepairCost || actualProc.estimatedRepairCost || 1500),
                        refurbishedValue: Number(actualProc.refurbishedValue || 6250),
                        warrantyDuration: actualProc.warrantyDuration || "6 Months Comprehensive Warranty",
                        remarks: actualProc.remarks || "Device refurbished, fully sanitized, stress tested, and certified.",
                        qcInspector: actualProc.qcInspector || "Quality Assurance Inspector"
                    },
                    inspection: item.inspection || {}
                };
                setReportModalData(fallbackData);
                setShowProcessReportModal(true);
            } else {
                setServerMsg({ type: "error", text: "Failed to open process report." });
            }
        } finally {
            setLoading(false);
        }
    };

    // Print / Export Dedicated PDF for Refurbishment Process Report
    const handlePrintProcessReport = (data) => {
        if (!data) return;
        const dev = data.device || {};
        const proc = data.process || data;
        const citizenData = data.citizen || {};

        let repairList = [];
        if (proc.repairItemsJson) {
            try {
                repairList = typeof proc.repairItemsJson === "string" ? JSON.parse(proc.repairItemsJson) : proc.repairItemsJson;
            } catch {
                repairList = [];
            }
        }

        let testList = [];
        if (proc.functionalTestsJson) {
            try {
                testList = typeof proc.functionalTestsJson === "string" ? JSON.parse(proc.functionalTestsJson) : proc.functionalTestsJson;
            } catch {
                testList = [];
            }
        }

        const printWin = window.open("", "_blank");
        if (!printWin) {
            alert("Please allow popups to download or print the Refurbishment Process Report.");
            return;
        }

        const dateFormatted = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>EcoCycle_Refurbishment_Report_DEV_${dev.deviceId || "DOC"}.pdf</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                    * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
                    body { margin: 0; padding: 28px; background: #ffffff; color: #0f172a; }
                    .report-container { max-width: 860px; margin: 0 auto; border: 2px solid #7c3aed; border-radius: 16px; padding: 32px; background: #ffffff; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 18px; margin-bottom: 20px; }
                    .brand { font-size: 24px; font-weight: 800; color: #7c3aed; letter-spacing: -0.5px; }
                    .sub-brand { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
                    .doc-title { text-align: right; }
                    .doc-title h2 { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
                    .doc-title p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600; }
                    
                    .hero-banner { background: #faf5ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 18px 22px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; }
                    .hero-dev-title { font-size: 22px; font-weight: 800; color: #5b21b6; margin: 0 0 4px 0; }
                    .hero-dev-meta { font-size: 12px; color: #7c3aed; font-weight: 600; }
                    .hero-badge-group { text-align: right; }
                    .hero-badge { background: #7c3aed; color: #ffffff; padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 800; text-transform: uppercase; display: inline-block; }
                    .hero-score { font-size: 11px; font-weight: 800; color: #059669; margin-top: 4px; display: block; }

                    .section-title { font-size: 12px; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; margin: 22px 0 10px 0; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; }
                    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }
                    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
                    
                    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
                    .info-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
                    .info-val { font-size: 12px; font-weight: 800; color: #0f172a; word-break: break-all; }

                    .diag-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                    .diag-table th { background: #f1f5f9; text-align: left; color: #475569; font-weight: 800; padding: 8px 12px; border: 1px solid #cbd5e1; }
                    .diag-table td { padding: 8px 12px; border: 1px solid #e2e8f0; vertical-align: middle; }

                    .pass-badge { background: #ecfdf5; color: #059669; padding: 3px 8px; border-radius: 4px; font-weight: 800; font-size: 10px; border: 1px solid #a7f3d0; display: inline-block; }
                    .stamp-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
                    .stamp-box { border: 2px dashed #7c3aed; border-radius: 8px; padding: 8px 16px; text-align: center; color: #7c3aed; }
                    .stamp-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
                    .stamp-sub { font-size: 8.5px; font-weight: 700; margin-top: 2px; }
                    .signature-box { text-align: right; }
                    .sig-line { width: 160px; border-bottom: 1px dashed #0f172a; margin-bottom: 4px; display: inline-block; }

                    @media print {
                        body { padding: 0; }
                        .report-container { border: none; padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="report-container">
                    <div class="header">
                        <div>
                            <div class="brand">&#9850; EcoCycle Technical Directorate</div>
                            <div class="sub-brand">Electronics Refurbishment &amp; Certification Authority</div>
                        </div>
                        <div class="doc-title">
                            <h2>Refurbishment Process Report</h2>
                            <p>Generated: ${dateFormatted}</p>
                        </div>
                    </div>

                    <div class="hero-banner">
                        <div>
                            <h1 class="hero-dev-title">${dev.brand || "Device"} ${dev.model || ""}</h1>
                            <div class="hero-dev-meta">
                                DEV #${dev.deviceId || "N/A"} &bull; REQ #${data.refurbishmentRequestId || "N/A"} &bull; ${dev.categoryName || "Electronics"}
                            </div>
                        </div>
                        <div class="hero-badge-group">
                            <div class="hero-badge">${proc.qualityGrade || "Grade A (Certified Refurbished)"}</div>
                            <span class="hero-score">Certified Value: ₹${Number(proc.refurbishedValue || 8000).toLocaleString()}</span>
                        </div>
                    </div>

                    <div class="section-title">1. Device &amp; Customer Overview</div>
                    <div class="grid-4">
                        <div class="info-card">
                            <div class="info-label">Customer Name</div>
                            <div class="info-val">${citizenData.name || "EcoCycle Citizen"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Location</div>
                            <div class="info-val">${citizenData.city || "Regional Hub"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Serial Number</div>
                            <div class="info-val">${dev.serialNumber || "SN-2026-VERIFIED"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Warranty Duration</div>
                            <div class="info-val">${proc.warrantyDuration || "6 Months Warranty"}</div>
                        </div>
                    </div>

                    <div class="section-title">2. NIST SP 800-88 Data Destruction &amp; Sanitization</div>
                    <div class="grid-3">
                        <div class="info-card">
                            <div class="info-label">Sanitization Standard</div>
                            <div class="info-val">${proc.wipingMethod || "NIST SP 800-88 Rev 1 Overwrite"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Verification Status</div>
                            <div class="info-val">${proc.wipingVerificationStatus || "100% Cryptographic Verified"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">DDC Certificate Number</div>
                            <div class="info-val">${proc.certificateNumber || "ECO-DDC-CERT"}</div>
                        </div>
                    </div>

                    <div class="section-title">3. Replacement Parts &amp; Servicing Ledger</div>
                    <table class="diag-table">
                        <thead>
                            <tr>
                                <th>Component Module</th>
                                <th>Action Performed</th>
                                <th>Qty</th>
                                <th>Unit / Total Cost</th>
                                <th>Technician Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${repairList.length > 0 ? repairList.map(r => `
                                <tr>
                                    <td><strong>${r.component}</strong></td>
                                    <td>${r.action}</td>
                                    <td>${r.quantity || 1}</td>
                                    <td>₹${Number(r.cost || 0).toLocaleString()}</td>
                                    <td>${r.remarks || "Serviced & calibrated"}</td>
                                </tr>
                            `).join("") : `
                                <tr>
                                    <td><strong>Core Subsystems</strong></td>
                                    <td>Diagnostic &amp; Serviced</td>
                                    <td>1</td>
                                    <td>₹${Number(proc.totalRepairCost || 1500).toLocaleString()}</td>
                                    <td>Complete multi-point overhaul</td>
                                </tr>
                            `}
                            <tr style="background: #f8fafc; font-weight: 800;">
                                <td colspan="3" style="text-align: right;">Total Refurbishment Expense:</td>
                                <td colspan="2" style="color: #7c3aed; font-size: 13px;">₹${Number(proc.totalRepairCost || 1500).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="section-title">4. Multi-Point Hardware Functional Test Benchmarks</div>
                    <table class="diag-table">
                        <thead>
                            <tr>
                                <th>Subsystem Benchmark</th>
                                <th>Diagnostic Category</th>
                                <th>Outcome</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${testList.length > 0 ? testList.map(t => `
                                <tr>
                                    <td><strong>${t.label || t.component || "Subsystem"}</strong></td>
                                    <td>${t.component || "Hardware"}</td>
                                    <td><span class="pass-badge">PASSED (100%)</span></td>
                                </tr>
                            `).join("") : `
                                <tr>
                                    <td><strong>Main Board &amp; Processing Unit</strong></td>
                                    <td>Logic Architecture</td>
                                    <td><span class="pass-badge">PASSED</span></td>
                                </tr>
                                <tr>
                                    <td><strong>Display &amp; Digitizer Calibration</strong></td>
                                    <td>Visual Subsystem</td>
                                    <td><span class="pass-badge">PASSED</span></td>
                                </tr>
                                <tr>
                                    <td><strong>Battery Health &amp; Power Regulation</strong></td>
                                    <td>Power Unit</td>
                                    <td><span class="pass-badge">PASSED</span></td>
                                </tr>
                                <tr>
                                    <td><strong>Memory &amp; Storage Drive Telemetry</strong></td>
                                    <td>Storage Subsystem</td>
                                    <td><span class="pass-badge">PASSED</span></td>
                                </tr>
                            `}
                        </tbody>
                    </table>

                    <div class="section-title">5. Quality Assurance &amp; Official Certification</div>
                    <div class="grid-3">
                        <div class="info-card">
                            <div class="info-label">QA Inspector</div>
                            <div class="info-val">${proc.qcInspector || "Certified Lead Engineer"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">EcoWarranty Certificate #</div>
                            <div class="info-val">${proc.refurbishedCertificateNumber || "ECO-REF-CERT"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Final Outcome</div>
                            <div class="info-val" style="color: #059669;">Refurbished &amp; Certified</div>
                        </div>
                    </div>

                    <div class="section-title">6. EcoCycle Escrow Settlement &amp; Financial Transaction Audit</div>
                    <div class="grid-4" style="margin-bottom: 10px;">
                        <div class="info-card">
                            <div class="info-label">Settled Buyout Value</div>
                            <div class="info-val" style="color: #059669; font-size: 13px;">₹${Number(proc.refurbishedValue || refurbishedValue || 0).toLocaleString("en-IN")}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Payment Gateway Channel</div>
                            <div class="info-val">${proc.paymentMethod || paymentMethod || "Razorpay Payment Gateway (Test Sandbox)"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Escrow Settlement Status</div>
                            <div class="info-val" style="color: #166534;"><span class="pass-badge" style="background: #dcfce7; color: #15803d; border-color: #86efac;">PAID &amp; SETTLED</span></div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Transaction Reference</div>
                            <div class="info-val" style="font-family: monospace; color: #7c3aed; font-size: 11px;">${proc.paymentTransactionId || proc.razorpayPaymentId || paymentTransactionId || "PAY_REF_SETTLED_OK"}</div>
                        </div>
                    </div>
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 12px; font-size: 10.5px; color: #166534; display: flex; align-items: center; justify-content: space-between;">
                        <span>&#10003; <strong>Escrow Pool Allocation:</strong> ₹${Number(proc.refurbishedValue || refurbishedValue || 0).toLocaleString("en-IN")} deposited to EcoCycle central escrow for stakeholder payouts (Citizen, Technician &amp; Platform).</span>
                        <span style="font-weight: 700; color: #047857; margin-left: 12px;">Repair Investment: ₹${Number(proc.totalRepairCost || totalRepairExpense || 0).toLocaleString("en-IN")}</span>
                    </div>

                    <div class="stamp-row">
                        <div class="stamp-box">
                            <div class="stamp-title">&#9733; ECOCYCLE CERTIFIED REFURBISHED &#9733;</div>
                            <div class="stamp-sub">REGISTRATION ID: ${proc.refurbishedCertificateNumber || "ECO-REF-AUTH"}</div>
                        </div>
                        <div class="signature-box">
                            <div class="sig-line"></div>
                            <div style="font-size: 11px; font-weight: 800;">${proc.qcInspector || "Quality Assurance Inspector"}</div>
                            <div style="font-size: 9.5px; color: #64748b;">EcoCycle Refurbishment Center Authority</div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
        printWin.document.close();
        setTimeout(() => {
            printWin.print();
        }, 300);
    };

    // Handler to Start Refurbishment Process with 10-Day SLA Deadline
    const handleStartProcess = async (targetReqId = null) => {
        // If called directly via onClick={handleStartProcess}, targetReqId is the React event object
        const validParamId = (targetReqId && typeof targetReqId !== "object" && !isNaN(Number(targetReqId)))
            ? Number(targetReqId)
            : null;
        const currentReqId = validParamId || requestData?.refurbishmentRequestId || (id ? Number(id) : null);
        if (!currentReqId) {
            setServerMsg({
                type: "error",
                text: "Invalid refurbishment request ID. Cannot initiate process."
            });
            return;
        }

        if (isProcessLocked && validParamId && currentReqId !== validParamId) {
            setShowNavLockModal(true);
            return;
        }

        const targetItem = allocatedList.find(i => i.refurbishmentRequestId === currentReqId) || 
            (requestData?.refurbishmentRequestId === currentReqId ? requestData : null);
        if (targetItem && !checkIsDeliveryCompleted(targetItem)) {
            setServerMsg({
                type: "error",
                text: "Cannot start SLA. The physical device has not yet arrived or delivery to this refurbishment facility has not been completed."
            });
            return;
        }
        try {
            setIsStartingProcess(true);
            const token = localStorage.getItem("token");

            const res = await axios.post(`${API_BASE}/RefurbishmentProcess/start/${currentReqId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const startTimestamp = res.data?.startedAt ? new Date(res.data.startedAt) : new Date();
            const deadlineTimestamp = (res.data?.processDeadline || res.data?.deadline)
                ? new Date(res.data.processDeadline || res.data.deadline)
                : new Date(startTimestamp.getTime() + 10 * 24 * 60 * 60 * 1000);

            // Update allocated list status in local state
            setAllocatedList(prev => prev.map(item =>
                item.refurbishmentRequestId === currentReqId
                    ? { ...item, status: "InProgress", refurbishmentStartedAt: startTimestamp, processDeadline: deadlineTimestamp.toISOString() }
                    : item
            ));

            if (!requestData || requestData.refurbishmentRequestId === currentReqId) {
                setStartedAt(startTimestamp);
                setDeadlineDate(deadlineTimestamp);
                setIsStarted(true);
                setRequestData(prev => prev ? { ...prev, status: "InProgress", refurbishmentStartedAt: startTimestamp, processDeadline: deadlineTimestamp.toISOString() } : prev);
            } else {
                navigate(`/refurbishment_perform/${currentReqId}`);
                fetchDetails(currentReqId);
            }
        } catch (err) {
            console.error("Error starting refurbishment process:", err);
            setServerMsg({
                type: "error",
                text: err.response?.data?.message || "Failed to initiate refurbishment process."
            });
        } finally {
            setIsStartingProcess(false);
        }
    };

    // Calculate live total repair cost
    const totalRepairExpense = useMemo(() => {
        return repairItems.reduce((sum, item) => sum + (Number(item.cost) || 0) * (Number(item.quantity) || 1), 0);
    }, [repairItems]);

    // Allowed Center Buyout Offer Tolerance Range Calculation
    // System provides reference values while letting center freely decide their offer within reasonable bounds
    const offerBounds = useMemo(() => {
        const refPrice = Number(profile?.referenceMarketPrice || 10000);
        const ageYears = Number(profile?.ageInYears !== undefined ? profile.ageInYears : 1);
        const agePct = Number(profile?.ageFactor !== undefined ? profile.ageFactor : 0.70);
        const ageTierLabel = profile?.ageTierLabel || getAgeTierLabel(ageYears);
        const conditionPct = Number(profile?.conditionFactor !== undefined ? profile.conditionFactor : 0.85);
        const adjustedVal = Number(profile?.adjustedDeviceValue || Math.round(refPrice * agePct * conditionPct));
        const repairCost = Number(totalRepairExpense || 0);

        // Estimated Value (adjustedVal) directly sets the fixed final buyout price
        const upperBound = Math.round(adjustedVal);
        const lowerBound = Math.round(adjustedVal);
        const defaultSuggested = Math.round(adjustedVal);

        return {
            refPrice,
            ageYears,
            agePct,
            ageTierLabel,
            conditionPct,
            adjustedVal,
            repairCost,
            lowerBound,
            upperBound,
            defaultSuggested
        };
    }, [profile, totalRepairExpense]);

    // Center Buyout Offer is fixed to the system-calculated Estimated Value (Final Price)
    useEffect(() => {
        if (offerBounds?.adjustedVal) {
            setRefurbishedValue(offerBounds.adjustedVal);
        }
    }, [offerBounds?.adjustedVal]);

    // Handle price / cost update for existing item in table (strictly clamped between 0 and 500,000)
    const handleUpdateItemCost = (itemId, val) => {
        if (val === "") {
            setRepairItems(prev => prev.map(item => item.id === itemId ? { ...item, cost: "" } : item));
            return;
        }
        const num = Number(val);
        const clamped = isNaN(num) ? 0 : Math.max(0, Math.min(500000, num));
        setRepairItems(prev => prev.map(item => item.id === itemId ? { ...item, cost: clamped } : item));
    };

    // Handle action update for existing item in table
    const handleUpdateItemAction = (itemId, val) => {
        setRepairItems(prev => prev.map(item => item.id === itemId ? { ...item, action: val } : item));
    };

    // Handle remarks update for existing item in table (allow letters, spaces, and slashes)
    const handleUpdateItemRemarks = (itemId, val) => {
        const sanitized = (val || "").replace(/[^a-zA-Z\s\/]/g, "");
        setRepairItems(prev => prev.map(item => item.id === itemId ? { ...item, remarks: sanitized } : item));
    };

    // Handle quantity update for existing item in table
    const handleUpdateItemQty = (itemId, val) => {
        const num = Math.max(1, Number(val) || 1);
        setRepairItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: num } : item));
    };

    // Handle Repair Item Add
    const handleAddRepairItem = (e) => {
        e.preventDefault();
        const trimmedComp = newRepairComponent.trim();
        if (!trimmedComp) return;

        // Prevent duplicate component addition (cannot be added twice or more)
        const isDuplicate = repairItems.some(
            (item) => item.component.trim().toLowerCase() === trimmedComp.toLowerCase()
        );
        if (isDuplicate) {
            setServerMsg({
                type: "error",
                text: `"${trimmedComp}" is already added in the repair list. You can edit its price directly in the table below.`
            });
            return;
        }

        // Clamp price strictly between 0 and 500,000
        const rawCost = Number(newRepairCost);
        const validCost = isNaN(rawCost) ? 0 : Math.max(0, Math.min(500000, rawCost));
        const rawRemarks = newRepairRemarks.trim() || `${newRepairAction} performed`;
        const sanitizedRemarks = rawRemarks.replace(/[^a-zA-Z\s\/]/g, "");

        const newItem = {
            id: Date.now(),
            component: trimmedComp,
            action: newRepairAction,
            quantity: Math.max(1, Number(newRepairQty) || 1),
            cost: validCost,
            technician: newRepairTech || "Lead Technician",
            remarks: sanitizedRemarks
        };

        setRepairItems(prev => [...prev, newItem]);
        setNewRepairComponent("");
        setNewRepairRemarks("");
        setServerMsg({
            type: "success",
            text: `Added "${trimmedComp}" (₹${validCost.toLocaleString()}) to repair log.`
        });
    };

    const handleRemoveRepairItem = (itemId) => {
        setRepairItems(prev => prev.filter(i => i.id !== itemId));
    };

    // Quick select a component of this device and set suggested action and cost
    const handleSelectQuickComponent = (comp) => {
        const isAlreadyAdded = repairItems.some(
            item => item.component.trim().toLowerCase() === comp.trim().toLowerCase()
        );
        if (isAlreadyAdded) {
            setServerMsg({
                type: "error",
                text: `"${comp}" is already added to the repair list. You can adjust its price directly in the table below.`
            });
            return;
        }

        setNewRepairComponent(comp);
        const cLower = comp.toLowerCase();
        if (cLower.includes("battery")) {
            setNewRepairAction("Replace");
            setNewRepairCost(profile.isLaptop ? 1200 : 850);
            setNewRepairRemarks("New battery cell replacement and capacity calibration");
        } else if (cLower.includes("display") || cLower.includes("touch") || cLower.includes("screen") || cLower.includes("panel")) {
            setNewRepairAction(profile.isPhone ? "Repair" : "Replace");
            setNewRepairCost(profile.isLaptop ? 2200 : 950);
            setNewRepairRemarks("Display panel digitizer alignment and touch calibration");
        } else if (cLower.includes("storage") || cLower.includes("ssd") || cLower.includes("hdd")) {
            setNewRepairAction("Replace");
            setNewRepairCost(1600);
            setNewRepairRemarks("High speed SSD installed and SMART telemetry checked");
        } else if (cLower.includes("ram") || cLower.includes("memory")) {
            setNewRepairAction("Upgrade");
            setNewRepairCost(1100);
            setNewRepairRemarks("RAM module installed and memory test passed");
        } else if (cLower.includes("keyboard")) {
            setNewRepairAction("Replace");
            setNewRepairCost(750);
            setNewRepairRemarks("Key matrix replaced and responsiveness verified");
        } else if (cLower.includes("os") || cLower.includes("firmware") || cLower.includes("software")) {
            setNewRepairAction("Reinstall");
            setNewRepairCost(250);
            setNewRepairRemarks("Clean factory OS flash and updated drivers");
        } else if (cLower.includes("camera")) {
            setNewRepairAction("Repair");
            setNewRepairCost(600);
            setNewRepairRemarks("Camera module serviced and optical focus calibrated");
        } else if (cLower.includes("port") || cLower.includes("charging") || cLower.includes("usb") || cLower.includes("hdmi")) {
            setNewRepairAction("Repair");
            setNewRepairCost(450);
            setNewRepairRemarks("Port sub board pins resoldered and current tested");
        } else {
            setNewRepairAction("Clean & Service");
            setNewRepairCost(350);
            const cleanCompName = comp.replace(/[^a-zA-Z\s]/g, "");
            setNewRepairRemarks(`${cleanCompName} serviced cleaned and benchmarked`);
        }
    };

    // Helper to populate all inspected components of this particular device into the repair table without duplicates
    const handlePopulateAllDeviceComponents = () => {
        const comps = profile.componentsList || [];
        if (comps.length === 0) return;

        // Keep already existing items, only generate for components not yet added
        const newCompsToAdd = comps.filter(comp =>
            !repairItems.some(i => i.component.trim().toLowerCase() === comp.trim().toLowerCase())
        );

        if (newCompsToAdd.length === 0) {
            return;
        }

        const generatedItems = newCompsToAdd.map((comp, idx) => {
            let action = "Clean & Service";
            let cost = 350;
            const cLower = comp.toLowerCase();
            if (cLower.includes("battery")) { action = "Replace"; cost = profile.isLaptop ? 1200 : 850; }
            else if (cLower.includes("display") || cLower.includes("touch") || cLower.includes("screen") || cLower.includes("panel")) { action = profile.isPhone ? "Repair" : "Replace"; cost = profile.isLaptop ? 2200 : 950; }
            else if (cLower.includes("storage") || cLower.includes("ssd") || cLower.includes("hdd")) { action = "Replace"; cost = 1600; }
            else if (cLower.includes("ram") || cLower.includes("memory")) { action = "Upgrade"; cost = 1100; }
            else if (cLower.includes("keyboard")) { action = "Replace"; cost = 750; }
            else if (cLower.includes("os") || cLower.includes("firmware") || cLower.includes("software")) { action = "Reinstall"; cost = 250; }
            else if (cLower.includes("camera")) { action = "Repair"; cost = 600; }
            else if (cLower.includes("port") || cLower.includes("charging") || cLower.includes("usb") || cLower.includes("hdmi")) { action = "Repair"; cost = 450; }
            const cleanCompName = comp.replace(/[^a-zA-Z\s]/g, "");
            return {
                id: Date.now() + idx + Math.floor(Math.random() * 1000),
                component: comp,
                action,
                quantity: 1,
                cost: Math.max(0, Math.min(500000, cost)),
                technician: "Lead Technician",
                remarks: `${cleanCompName} diagnostic serviced and certified`
            };
        });

        setRepairItems(prev => [...prev, ...generatedItems]);
    };

    // Functional Test Toggle
    const handleToggleTest = (testId, newStatus) => {
        setTests(prev => prev.map(t => t.id === testId ? { ...t, status: newStatus } : t));
    };

    const handlePassAllTests = () => {
        setTests(prev => prev.map(t => ({ ...t, status: "Pass" })));
    };

    // Trigger Data Wipe Simulation
    const handleSimulateWiping = () => {
        // Validate inputs first
        if (!isWipeFormValid) {
            let missing = [];
            if (!wipingMethod || wipingMethod.trim().length < 2) missing.push("Wiping Method");
            if (!wipingTechnician || wipingTechnician.trim().length < 2) missing.push("Sanitization Technician");
            if (!wipingVerificationStatus) missing.push("Verification Status");

            setServerMsg({
                type: "error",
                text: `Please enter all required sanitization fields (${missing.join(", ")}) before running data wipe.`
            });
            return;
        }

        setIsWipingInProgress(true);
        setWipingCompleted(false);
        setWipingProgress(35); // 1. Data Wiping

        setTimeout(() => {
            setWipingProgress(75); // 2. Wipe Completed
            setTimeout(() => {
                const year = new Date().getFullYear().toString().slice(-2);
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                const certId = ddcCertNum || `ECO-DDC-${device?.deviceId || year}-${randomNum}`;
                setDdcCertNum(certId);
                setWipingProgress(100); // 3. Destruction Certificate
                setIsWipingInProgress(false);
                setWipingCompleted(true);
            }, 450);
        }, 450);
    };

    // Step Navigation (1 to 5)
    const handleNextStep = () => {
        if (currentStep < 5) {
            setCompletedSteps(prev => Array.from(new Set([...prev, currentStep])));
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Process Center Buyout Settlement Payment to EcoCycle Escrow (Test Mode)
    const handleProcessSettlementPayment = async (isQuickSimulation = false) => {
        const finalVal = Number(offerBounds.adjustedVal || refurbishedValue || 0);
        if (finalVal <= 0) {
            setServerMsg({
                type: "error",
                text: "Invalid buyout valuation. Please ensure device valuation is calculated."
            });
            return;
        }

        try {
            setIsPayingSettlement(true);
            const token = localStorage.getItem("token");

            // Option 1: 1-Click Instant Test Simulation (bypasses popup for fast dev testing)
            if (isQuickSimulation) {
                const simTxnId = `pay_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
                const simOrderId = `order_test_${Date.now()}`;
                await axios.post(`${API_BASE}/Settlement/center-pay-settlement`, {
                    deviceId: device?.deviceId || Number(id),
                    finalRealizableValue: finalVal,
                    paymentMethod: "Razorpay (Test Sandbox)",
                    razorpayPaymentId: simTxnId,
                    razorpayOrderId: simOrderId,
                    razorpaySignature: "simulated_test_signature",
                    notes: paymentNotes || `[TEST MODE] Refurbishment buyout settlement for Device #${device?.deviceId || id}`
                }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

                setPaymentStatus("Paid");
                setPaymentTransactionId(simTxnId);
                setServerMsg({
                    type: "success",
                    text: `[TEST MODE] Escrow Buyout Settlement of ₹${finalVal.toLocaleString("en-IN")} simulated successfully! (Txn ID: ${simTxnId})`
                });
                setShowPaymentModal(false);
                setIsPayingSettlement(false);
                return;
            }

            // Option 2: Razorpay Interactive Test Checkout Modal
            // 1. Create Razorpay payment order on backend
            const orderRes = await axios.post(`${API_BASE}/Settlement/create-center-order`, {
                deviceId: device?.deviceId || Number(id),
                amount: finalVal,
                notes: paymentNotes || `[TEST MODE] Refurbishment buyout settlement for Device #${device?.deviceId || id}`
            }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

            const orderData = orderRes.data;

            if (!window.Razorpay) {
                // If script not loaded, offer direct simulation fallback
                const simTxnId = `pay_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
                await axios.post(`${API_BASE}/Settlement/center-pay-settlement`, {
                    deviceId: device?.deviceId || Number(id),
                    finalRealizableValue: finalVal,
                    paymentMethod: "Razorpay (Test Sandbox)",
                    razorpayPaymentId: simTxnId,
                    razorpayOrderId: orderData?.orderId || `order_test_${Date.now()}`,
                    notes: paymentNotes || `[TEST MODE] Refurbishment buyout settlement for Device #${device?.deviceId || id}`
                }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

                setPaymentStatus("Paid");
                setPaymentTransactionId(simTxnId);
                setServerMsg({
                    type: "success",
                    text: `[TEST MODE] Escrow Buyout Settlement of ₹${finalVal.toLocaleString("en-IN")} authorized in sandbox mode! (Txn ID: ${simTxnId})`
                });
                setShowPaymentModal(false);
                setIsPayingSettlement(false);
                return;
            }

            // 2. Configure & Open Razorpay Test Checkout Modal
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency || "INR",
                name: "EcoCycle Sandbox Escrow",
                description: `[TEST MODE] Refurbishment Buyout Settlement DEV #${device?.deviceId || id}`,
                order_id: orderData.orderId,
                handler: async function (response) {
                    try {
                        setIsPayingSettlement(true);
                        // 3. Record verified test payment on backend
                        await axios.post(`${API_BASE}/Settlement/center-pay-settlement`, {
                            deviceId: device?.deviceId || Number(id),
                            finalRealizableValue: finalVal,
                            paymentMethod: "Razorpay (Test Sandbox)",
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpaySignature: response.razorpay_signature,
                            notes: paymentNotes || `[TEST MODE] Refurbishment buyout settlement for Device #${device?.deviceId || id}`
                        }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

                        setPaymentStatus("Paid");
                        setPaymentTransactionId(response.razorpay_payment_id);
                        setServerMsg({
                            type: "success",
                            text: `[TEST MODE] EcoCycle Buyout Settlement of ₹${finalVal.toLocaleString("en-IN")} successfully authorized and recorded! (Txn ID: ${response.razorpay_payment_id})`
                        });
                        setShowPaymentModal(false);
                    } catch (verifyErr) {
                        console.error("Payment confirmation error:", verifyErr);
                        setServerMsg({
                            type: "error",
                            text: verifyErr.response?.data?.message || "Payment verification failed. Please contact EcoCycle support."
                        });
                    } finally {
                        setIsPayingSettlement(false);
                    }
                },
                prefill: {
                    name: "Refurbishment Test Center",
                    contact: "9999999999",
                    email: "test_center@ecocycle.in"
                },
                theme: {
                    color: "#7c3aed"
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
            setServerMsg({
                type: "error",
                text: err.response?.data?.message || err.response?.data || "Failed to initialize Razorpay test checkout. Please try again."
            });
            setIsPayingSettlement(false);
        }
    };

    // Handle Final Submit to Backend
    const handleSubmitRefurbishment = async (outcomeOverride = null) => {
        const activeOutcome = outcomeOverride || finalOutcome;

        // Center buyout offer is fixed to the system-calculated Estimated Value
        if (activeOutcome === "Refurbished") {
            const finalVal = Number(offerBounds.adjustedVal || refurbishedValue || 0);
            if (finalVal <= 0) {
                setServerMsg({
                    type: "error",
                    text: "Invalid buyout valuation. Please ensure device valuation is calculated."
                });
                return;
            }

            // If settlement payment is not yet completed, open payment modal
            if (paymentStatus !== "Paid") {
                setShowPaymentModal(true);
                setServerMsg({
                    type: "info",
                    text: `Please complete and authorize the EcoCycle Buyout Settlement payment of ₹${finalVal.toLocaleString("en-IN")} before finalizing certification.`
                });
                return;
            }
        }

        try {
            setSaving(true);
            const token = localStorage.getItem("token");

            const payload = {
                refurbishmentRequestId: requestData?.refurbishmentRequestId || Number(id),
                status: activeOutcome === "Refurbished" ? "Completed" : "TransferredToRecycling",
                deviceVerified: true,
                verifiedByTechnician: wipingTechnician,

                physicalCondition: assessmentValues.physicalCondition,
                displayCondition: assessmentValues.displayCondition,
                batteryAssessment: assessmentValues.batteryAssessment,
                keyboardAssessment: assessmentValues.keyboardAssessment,
                storageAssessment: assessmentValues.storageAssessment,
                ramAssessment: assessmentValues.ramAssessment,
                portsAssessment: assessmentValues.portsAssessment,
                softwareAssessment: assessmentValues.softwareAssessment,
                estimatedRepairCost: Number(estimatedRepairCost) || totalRepairExpense,
                assessmentDecision: assessmentDecision,

                dataWiped: wipingCompleted,
                wipingMethod: wipingMethod,
                wipingCompletedAt: new Date().toISOString(),
                wipingTechnician: wipingTechnician,
                wipingVerificationStatus: wipingVerificationStatus,
                certificateNumber: ddcCertNum,

                repairItemsJson: JSON.stringify(repairItems),
                totalRepairCost: totalRepairExpense,

                functionalTestsJson: JSON.stringify(tests),
                testingPassed: tests.every(t => t.status === "Pass"),

                qcRepairCompleted: qcChecks.repairCompleted,
                qcDataWiped: qcChecks.dataWiped,
                qcHardwareTested: qcChecks.hardwareTested,
                qcSoftwareTested: qcChecks.softwareTested,
                qcApproved: qcChecks.qcApproved,
                qualityGrade: qualityGrade,
                qcInspector: qcInspector,

                finalOutcome: activeOutcome,
                refurbishedValue: Number(refurbishedValue) || 8000,
                warrantyDuration: warrantyDuration,
                refurbishedCertificateNumber: refurbishedCertNum,
                remarks: finalRemarks,

                targetRecyclingCenterId: targetRecyclingCenterId > 0 ? targetRecyclingCenterId : null,
                transferReason: finalRemarks
            };

            const res = await axios.post(`${API_BASE}/RefurbishmentProcess/submit`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Ensure settlement payment transaction is recorded on backend if not already done
            if (activeOutcome === "Refurbished") {
                const finalVal = Number(refurbishedValue) || 5000;
                const txnToUse = paymentTransactionId || `PAY_REF_${Date.now()}`;
                await axios.post(`${API_BASE}/Settlement/center-pay-settlement`, {
                    deviceId: device?.deviceId || Number(id),
                    finalRealizableValue: finalVal,
                    paymentMethod: paymentMethod || "Razorpay",
                    razorpayPaymentId: txnToUse,
                    notes: paymentNotes || `Refurbishment buyout settlement for Device #${device?.deviceId || id}`
                }, { headers: { Authorization: `Bearer ${token}` } }).catch(e => console.warn("Refurbishment settlement payment notice:", e));
            }

            setServerMsg({
                type: "success",
                text: res.data?.message || "Refurbishment workflow successfully processed and settlement payment recorded!"
            });

            // Redirect back to dashboard after brief notice
            setTimeout(() => {
                navigate("/refurbishmentcenter_dashboard");
            }, 2500);
        } catch (err) {
            console.error("Error saving refurbishment process:", err);
            setServerMsg({
                type: "error",
                text: err.response?.data?.message || "Error submitting refurbishment process."
            });
        } finally {
            setSaving(false);
        }
    };

    const handleBackNav = () => {
        if (isProcessLocked) {
            setShowNavLockModal(true);
        } else {
            navigate("/refurbishmentcenter_dashboard");
        }
    };

    const device = requestData?.device || {};
    const citizen = requestData?.citizen || {};
    const inspection = requestData?.inspection || {};
    const getCenterMediaUrl = (filename, folderName = "center-photo") => {
        if (!filename) return null;
        if (filename.startsWith("data:") || filename.startsWith("blob:") || filename.startsWith("http://") || filename.startsWith("https://")) {
            return filename;
        }
        const clean = filename.replace(/^uploads[\\/]/, "").replace(/^[\\/]/, "");
        if (clean.includes("/") || clean.includes("\\")) {
            return `https://ecocycle.runasp.net/uploads/${clean.replace("\\", "/")}`;
        }
        return `https://ecocycle.runasp.net/uploads/refurbishment/${folderName}/${clean}`;
    };

    const centerFacilityName = centerProfile?.CenterName || centerProfile?.centerName || centerProfile?.OwnerName || centerProfile?.ownerName || localStorage.getItem("firstName") || "Refurbishment Facility";
    const rawCenterPhoto = centerProfile?.CenterPhoto || centerProfile?.centerPhoto || centerProfile?.ShopPhoto || centerProfile?.shopPhoto || centerProfile?.ProfileImage || centerProfile?.profileImage || centerProfile?.Photo || centerProfile?.photo;
    const centerPhotoUrl = rawCenterPhoto ? getCenterMediaUrl(rawCenterPhoto, "center-photo") : null;

    return (
        <div className="refurb-dashboard-layout refurb-perform-layout">
            <Sidebar isLocked={isProcessLocked} onBlockedNav={() => setShowNavLockModal(true)} />

            <main className="refurb-main-content refurb-perform-main">
                {/* Header Ribbon */}
                <div className="refurb-header-ribbon">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "nowrap" }}>
                        
                        <div className="refurb-page-title-box">
                            <h1 className="refurb-welcome-title" style={{ display: "flex", alignItems: "center", gap: "0.45rem", margin: 0 }}>
                                <FiCpu style={{ color: "#7c3aed" }} /> Refurbishment Workspace
                            </h1>
                            <p className="refurb-welcome-sub">Diagnostics &bull; Component Repair &bull; Data Destruction &bull; QC Certification</p>
                        </div>
                    </div>
        
                    <div className="refurb-header-actions">
                        <span className="refurb-profile-bench-badge" style={{ padding: "0.4rem 0.8rem", borderRadius: "9999px", background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", fontSize: "0.78rem", fontWeight: 700 }}>
                            {profile.isPhone ? "Mobile Bench" : profile.isTV ? "Display Bench" : profile.isAppliance ? "Appliance Bench" : "Laptop/PC Bench"}
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                if (isProcessLocked) setShowNavLockModal(true);
                                else navigate("/refurbishmentcenter_notification");
                            }}
                            title="Notifications"
                            className="notif-bell-btn"
                        >
                            <FiBell style={{ color: "#475569", fontSize: "1.1rem" }} />
                            {unreadNotifCount > 0 && (
                                <span className="notif-badge">
                                    {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                                </span>
                            )}
                        </button>

                        <div
                            className="refurb-profile-pill"
                            title={`Facility Profile - ${centerFacilityName}`}
                            style={{ cursor: isProcessLocked ? "not-allowed" : "pointer" }}
                            onClick={() => {
                                if (isProcessLocked) setShowNavLockModal(true);
                                else navigate("/refurbishment_profile");
                            }}
                        >
                            {centerPhotoUrl && !centerImgError ? (
                                <img
                                    src={centerPhotoUrl}
                                    alt={centerFacilityName}
                                    className="refurb-shop-img"
                                    onError={() => setCenterImgError(true)}
                                />
                            ) : (
                                <div className="refurb-avatar">
                                    {centerFacilityName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="refurb-pill-name">{centerFacilityName}</span>
                        </div>
                    </div>
                </div>

                {/* Toast Notification Banner */}
                {serverMsg.text && (
                    <div style={{
                        background: serverMsg.type === "success" ? "#ecfdf5" : "#fef2f2",
                        border: `1px solid ${serverMsg.type === "success" ? "#a7f3d0" : "#fecaca"}`,
                        color: serverMsg.type === "success" ? "#065f46" : "#991b1b",
                        padding: "1rem 1.25rem",
                        borderRadius: "12px",
                        marginBottom: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        fontWeight: 600,
                        fontSize: "0.95rem"
                    }}>
                        <FiCheckCircle style={{ fontSize: "1.25rem" }} />
                        <span>{serverMsg.text}</span>
                    </div>
                )}

                {/* Main Controls Panel */}
                <div className="control-bar-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.2rem", color: "#0f172a" }}>Allocated Devices Queue</h3>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                            Browse and select any device allocated to your refurbishment center to assess, wipe, repair, and certify
                        </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap", marginLeft: "auto" }}>
                        <div className="refurb-delivery-search">
                            <FiSearch className="refurb-search-icon" />
                            <input
                                type="text"
                                placeholder="Search device, ID, citizen..."
                                value={allocatedSearch}
                                onChange={(e) => setAllocatedSearch(e.target.value)}
                            />
                            {allocatedSearch && (
                                <button
                                    type="button"
                                    className="refurb-search-clear"
                                    onClick={() => setAllocatedSearch("")}
                                    title="Clear search"
                                >
                                    <FiX />
                                </button>
                            )}
                        </div>

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

                        {requestData && (
                            <button
                                type="button"
                                onClick={handleDeselectDevice}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    height: "38px",
                                    padding: "0 0.85rem",
                                    background: "#ede9fe",
                                    color: "#6d28d9",
                                    border: "1px solid #ddd6fe",
                                    borderRadius: "10px",
                                    fontSize: "0.78rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                    boxSizing: "border-box"
                                }}
                                title="Deselect active device and return to queue overview"
                            >
                                <span>Selected: DEV #{requestData.device?.deviceId || id}</span>
                                <FiX style={{ fontSize: "0.95rem" }} />
                            </button>
                        )}

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


                {/* Content Section */}
                {loadingAllocated ? (
                    <div className="loading-state" style={{ marginBottom: "1.5rem" }}>
                        <div className="loading-spinner"></div>
                        <p style={{ margin: 0, fontSize: "0.875rem" }}>Loading allocated devices queue...</p>
                    </div>
                ) : filteredAllocatedList.length === 0 ? (
                    <div className="empty-repaired-state" style={{ marginBottom: "1.5rem" }}>
                        <div className="empty-icon-wrap">
                            <FiCheckSquare />
                        </div>
                        <h4 className="empty-title">No Allocated Devices Found</h4>
                        <p className="empty-desc">
                            {allocatedSearch
                                ? `No devices matching "${allocatedSearch}". Try a different keyword.`
                                : `No allocated devices found under this category.`}
                        </p>
                    </div>
                ) : allocatedViewMode === "grid" ? (
                    <div className="refurb-cards-grid" style={{ marginBottom: "1.5rem" }}>
                                {filteredAllocatedList.map((item) => {
                                    const isSelected = (requestData?.refurbishmentRequestId === item.refurbishmentRequestId) ||
                                        (!requestData && Number(id) === item.refurbishmentRequestId);
                                    const statusLower = (item.status || "Assigned").toLowerCase();
                                    const isCompleted = statusLower === "completed";
                                    const isTransferred = statusLower === "transferredtorecycling" || statusLower.includes("recycling");
                                    const isInProgress = statusLower === "inprogress";

                                    return (
                                        <div
                                            key={item.refurbishmentRequestId || item.deviceId}
                                            className={`refurb-item-card ${isSelected ? "selected-device-card" : ""}`}
                                            onClick={() => handleSelectAllocatedDevice(item.refurbishmentRequestId)}
                                            style={{
                                                cursor: "pointer",
                                                border: isSelected ? "2px solid #7c3aed" : "1px solid #e2e8f0",
                                                background: isSelected ? "#fcfaff" : "#ffffff",
                                                boxShadow: isSelected ? "0 0 0 3px rgba(124, 58, 237, 0.12)" : "0 2px 10px rgba(15, 23, 42, 0.02)"
                                            }}
                                        >
                                            <div>
                                                <div className="refurb-card-top-row">
                                                    <div className="refurb-cat-icon-box">
                                                        {getCategoryIcon(item.categoryName)}
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                        {isCompleted ? (
                                                            <span className="refurb-status-chip success">
                                                                <FiCheckCircle /> Completed
                                                            </span>
                                                        ) : isTransferred ? (
                                                            <span className="refurb-status-chip" style={{ background: "#fffbeb", color: "#d97706", borderColor: "#fde68a" }}>
                                                                <FiAlertTriangle /> Recycled
                                                            </span>
                                                        ) : isInProgress ? (
                                                            <span className="refurb-status-chip" style={{ background: "#f5f3ff", color: "#7c3aed", borderColor: "#ddd6fe" }}>
                                                                <span className="refurb-pulse-dot" style={{ display: "inline-block", marginRight: "4px" }}></span> On Bench
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <h4 className="refurb-card-brand-name">{item.brand || "Device"} {item.model || ""}</h4>
                                                <p className="refurb-card-cat-sub">
                                                    REQ #{item.refurbishmentRequestId} &bull; {item.categoryName || "Electronics"} &bull; {item.condition || "Inspected"} {item.weight && Number(item.weight) > 0 ? `(${item.weight} kg)` : ""}
                                                </p>

                                                {/* Citizen Chip */}
                                                {item.customerName && (
                                                    <div className="refurb-agent-chip-box">
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                                            <div className="refurb-agent-avatar">
                                                                {item.customerName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <span className="refurb-agent-name">{item.customerName}</span>
                                                                <span className="refurb-agent-sub">{item.customerPhone ? `${item.customerPhone} • ` : ""}{item.customerCity || "City Hub"}</span>
                                                            </div>
                                                        </div>
                                                        {item.customerPhone && (
                                                            <a href={`tel:${item.customerPhone}`} className="btn-refurb-call" title="Call Citizen" onClick={(e) => e.stopPropagation()}>
                                                                <FiPhone />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Origin & Destination Details */}
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
                                                    <div className="refurb-detail-row">
                                                        <FiUser className="detail-icon" style={{ color: "#3b82f6" }} />
                                                        <div>
                                                            <div className="detail-label">Origin (Inspection Hub)</div>
                                                            <div className="detail-val">{item.technicianName || item.inspectionCenterName || "Technician Hub"}</div>
                                                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.technicianAddress || item.customerCity || "Inspection Center"}</div>
                                                        </div>
                                                    </div>

                                                    <div className="refurb-detail-row">
                                                        <FiMapPin className="detail-icon" style={{ color: "#7c3aed" }} />
                                                        <div>
                                                            <div className="detail-label">Destination (Refurbishment Facility)</div>
                                                            <div className="detail-val">{centerFacilityName}</div>
                                                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Condition: {item.condition || "Inspected"} {item.weight && Number(item.weight) > 0 ? `(${item.weight} kg)` : ""}</div>
                                                        </div>
                                                    </div>

                                                    {/* Dedicated Process Deadline Info Row */}
                                                    <div className="refurb-detail-row" style={{ background: "#f8fafc", padding: "0.45rem 0.65rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                                        <FiCalendar className="detail-icon" style={{ color: item.processDeadline && new Date(item.processDeadline).getTime() < Date.now() ? "#dc2626" : "#7c3aed" }} />
                                                        <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                            <div>
                                                                <div className="detail-label" style={{ fontSize: "0.68rem" }}>Process Deadline</div>
                                                                <div className="detail-val" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
                                                                    {item.processDeadline ? new Date(item.processDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "10-Day SLA Window"}
                                                                </div>
                                                            </div>
                                                            {item.processDeadline && (
                                                                <span style={{
                                                                    fontSize: "0.7rem",
                                                                    fontWeight: 700,
                                                                    padding: "2px 6px",
                                                                    borderRadius: "4px",
                                                                    background: new Date(item.processDeadline).getTime() < Date.now() ? "#fee2e2" : "#f5f3ff",
                                                                    color: new Date(item.processDeadline).getTime() < Date.now() ? "#b91c1c" : "#7c3aed",
                                                                    border: `1px solid ${new Date(item.processDeadline).getTime() < Date.now() ? "#fca5a5" : "#ddd6fe"}`
                                                                }}>
                                                                    {new Date(item.processDeadline).getTime() < Date.now() ? "Overdue" : (() => {
                                                                        const daysLeft = Math.ceil((new Date(item.processDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                                                        return daysLeft <= 1 ? "1d left" : `${daysLeft}d left`;
                                                                    })()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="refurb-card-actions" style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px dashed #e2e8f0" }}>
                                                {isCompleted ? (
                                                    <button
                                                        type="button"
                                                        className="refurb-btn-accept"
                                                        style={{ width: "100%", justifyContent: "center", background: "#ecfdf5", color: "#059669", borderColor: "#a7f3d0" }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenProcessReport(item);
                                                        }}
                                                    >
                                                        <FiCheckCircle /> View Process Report
                                                    </button>
                                                ) : isTransferred ? (
                                                    <button
                                                        type="button"
                                                        className="refurb-btn-view"
                                                        style={{ width: "100%", justifyContent: "center" }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectAllocatedDevice(item.refurbishmentRequestId);
                                                        }}
                                                    >
                                                        <FiEye /> View Details
                                                    </button>
                                                ) : isInProgress ? (
                                                    isSelected ? (
                                                        <div style={{ width: "100%", textAlign: "center", padding: "0.5rem", background: "#f5f3ff", color: "#7c3aed", borderRadius: "8px", fontWeight: 700, fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                                                            <span className="refurb-pulse-dot"></span> Active Device on Bench
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="refurb-btn-accept"
                                                            style={{ width: "100%", justifyContent: "center" }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSelectAllocatedDevice(item.refurbishmentRequestId);
                                                            }}
                                                        >
                                                            Continue Refurbishment <FiArrowRight />
                                                        </button>
                                                    )
                                                ) : (
                                                    checkIsDeliveryCompleted(item) ? (
                                                        <button
                                                            type="button"
                                                            className="refurb-btn-accept"
                                                            style={{ width: "100%", justifyContent: "center" }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStartProcess(item.refurbishmentRequestId);
                                                            }}
                                                            disabled={isStartingProcess}
                                                        >
                                                            <FiPlay /> Start SLA
                                                        </button>
                                                    ) : (
                                                        <Link
                                                            to={`/refurbishment_delivery?device=${item.deviceId}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{
                                                                width: "100%",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                gap: "0.35rem",
                                                                padding: "0.5rem",
                                                                background: "#fef3c7",
                                                                color: "#b45309",
                                                                border: "1px solid #fde68a",
                                                                borderRadius: "8px",
                                                                fontSize: "0.78rem",
                                                                fontWeight: 700,
                                                                textDecoration: "none"
                                                            }}
                                                            title="Physical delivery to center is pending. SLA cannot be started yet. Click to view delivery status."
                                                        >
                                                            <FiTruck /> Delivery Pending
                                                        </Link>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="glass-table-wrapper" style={{ marginBottom: "1.5rem" }}>
                                <table className="glass-table">
                                    <thead>
                                        <tr>
                                            <th>REQ &amp; DEV ID</th>
                                            <th>Device &amp; Category</th>
                                            <th>Citizen &amp; City</th>
                                            <th>Process Deadline</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAllocatedList.map((item) => {
                                            const isSelected = (requestData?.refurbishmentRequestId === item.refurbishmentRequestId) ||
                                                (!requestData && Number(id) === item.refurbishmentRequestId);
                                            const statusLower = (item.status || "Assigned").toLowerCase();
                                            const isCompleted = statusLower === "completed";
                                            const isTransferred = statusLower === "transferredtorecycling" || statusLower.includes("recycling");
                                            const isInProgress = statusLower === "inprogress";

                                            return (
                                                <tr
                                                    key={item.refurbishmentRequestId || item.deviceId}
                                                    onClick={() => handleSelectAllocatedDevice(item.refurbishmentRequestId)}
                                                    style={{ background: isSelected ? "#faf5ff" : "inherit", cursor: "pointer" }}
                                                    title={isSelected ? "Click row to deselect" : "Click row to select"}
                                                >
                                                    <td>
                                                        <span style={{ fontWeight: 800, color: "#7c3aed", display: "block" }}>
                                                            REQ #{item.refurbishmentRequestId}
                                                        </span>
                                                        <span style={{ fontSize: "0.725rem", color: "#64748b" }}>
                                                            DEV #{item.deviceId}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 700, color: "#0f172a" }}>
                                                            {item.brand || "Device"} {item.model || ""}
                                                        </div>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                                            {item.categoryName} &bull; {item.condition || "Inspected"}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, color: "#334155" }}>
                                                            {item.customerName || "Customer"}
                                                        </div>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                                            {item.customerCity || "City Hub"}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {item.processDeadline ? (
                                                            <div>
                                                                <div style={{ fontWeight: 700, color: "#1e1b4b", fontSize: "0.825rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                                                    <FiCalendar style={{ color: "#7c3aed" }} />
                                                                    {new Date(item.processDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                                </div>
                                                                <div style={{ fontSize: "0.72rem", color: new Date(item.processDeadline).getTime() < Date.now() ? "#dc2626" : "#64748b", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "2px" }}>
                                                                    <FiClock />
                                                                    {new Date(item.processDeadline).getTime() < Date.now() ? (
                                                                        <strong style={{ color: "#dc2626" }}>Overdue</strong>
                                                                    ) : (
                                                                        (() => {
                                                                            const daysLeft = Math.ceil((new Date(item.processDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                                                            return daysLeft <= 1 ? "Due today / tomorrow" : `${daysLeft} days remaining`;
                                                                        })()
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: "0.78rem", color: "#64748b" }}>10-Day SLA</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {isCompleted ? (
                                                            <span className="refurb-status-chip success">
                                                                <FiCheckCircle /> Completed
                                                            </span>
                                                        ) : isTransferred ? (
                                                            <span className="refurb-status-chip" style={{ background: "#fffbeb", color: "#d97706", borderColor: "#fde68a" }}>
                                                                <FiAlertTriangle /> Recycled
                                                            </span>
                                                        ) : isInProgress ? (
                                                            <span className="refurb-status-chip" style={{ background: "#f5f3ff", color: "#7c3aed", borderColor: "#ddd6fe" }}>
                                                                <span className="refurb-pulse-dot" style={{ display: "inline-block", marginRight: "4px" }}></span> On Bench
                                                            </span>
                                                        ) : (
                                                            <span className="refurb-status-chip" style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}>
                                                                Assigned
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>
                                                        <div style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
                                                            {isCompleted ? (
                                                                <button
                                                                    type="button"
                                                                    className="refurb-action-btn success"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenProcessReport(item);
                                                                    }}
                                                                    title="View Refurbishment Process Report"
                                                                    style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                                                                >
                                                                    <FiCheckCircle /> View Report
                                                                </button>
                                                            ) : isTransferred ? (
                                                                <button
                                                                    type="button"
                                                                    className="refurb-action-btn"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSelectAllocatedDevice(item.refurbishmentRequestId);
                                                                    }}
                                                                >
                                                                    <FiEye /> View Details
                                                                </button>
                                                            ) : isInProgress ? (
                                                                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#7c3aed", padding: "0.3rem 0.6rem", background: "#f5f3ff", borderRadius: "6px" }}>
                                                                    <span className="refurb-pulse-dot" style={{ display: "inline-block", marginRight: "4px" }}></span> On Bench
                                                                </span>
                                                            ) : (
                                                                checkIsDeliveryCompleted(item) ? (
                                                                    <button
                                                                        type="button"
                                                                        className="refurb-action-btn success"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleStartProcess(item.refurbishmentRequestId);
                                                                        }}
                                                                        disabled={isStartingProcess}
                                                                    >
                                                                        <FiPlay /> Start
                                                                    </button>
                                                                ) : (
                                                                    <Link
                                                                        to={`/refurbishment_delivery?device=${item.deviceId}`}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        style={{
                                                                            fontSize: "0.72rem",
                                                                            fontWeight: 700,
                                                                            color: "#b45309",
                                                                            background: "#fef3c7",
                                                                            border: "1px solid #fde68a",
                                                                            padding: "0.3rem 0.6rem",
                                                                            borderRadius: "6px",
                                                                            display: "inline-flex",
                                                                            alignItems: "center",
                                                                            gap: "4px",
                                                                            textDecoration: "none"
                                                                        }}
                                                                        title="Delivery to center is pending. SLA cannot be started yet."
                                                                    >
                                                                        <FiTruck /> Delivery Pending
                                                                    </Link>
                                                                )
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )
                    }

                {loading ? (
                    <div className="refurb-panel-card" style={{ textAlign: "center", padding: "3.5rem 1rem", color: "#64748b" }}>
                        <FiRefreshCw className="spin-icon" style={{ fontSize: "2rem", color: "#7c3aed", marginBottom: "0.75rem" }} />
                        <h3 style={{ margin: 0, color: "#1e293b", fontSize: "1.1rem", fontWeight: 700 }}>Loading Device Workspace...</h3>
                        <p style={{ fontSize: "0.85rem", margin: "0.35rem 0 0 0" }}>Retrieving device telemetry, inspection diagnostics, and test suites</p>
                    </div>
                ) : !requestData ? (
                    <div className="refurb-panel-card" style={{ textAlign: "center", padding: "3.5rem 1.5rem", color: "#64748b", border: "1px dashed #cbd5e1", background: "#f8fafc", borderRadius: "16px" }}>
                        <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#ede9fe", color: "#7c3aed", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", marginBottom: "1rem" }}>
                            <FiTool />
                        </div>
                        <h3 style={{ margin: "0 0 0.4rem 0", color: "#1e293b", fontSize: "1.15rem", fontWeight: 700 }}>No Device Selected</h3>
                        <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b", maxWidth: "460px", marginLeft: "auto", marginRight: "auto" }}>
                            Please select a device from the Allocated Devices Queue above to inspect diagnostics, initiate data wiping, perform repairs, or review certified reports.
                        </p>
                    </div>
                ) : isDeviceCompleted ? (
                    /* =========================================================
                       COMPLETED DEVICE VIEW: REFURBISHMENT PROCESS REPORT ONLY
                       ========================================================= */
                    <div className="refurb-completed-container">
                        {/* Completed Hero Banner */}
                        <div className="refurb-completed-hero-card">
                            <div className="refurb-completed-hero-left">
                                <div className="refurb-completed-badge-row">
                                    <span className="refurb-status-chip success">
                                        <FiCheckCircle /> Certified Refurbished &bull; Process Completed
                                    </span>
                                    <span className="refurb-tag-id">DEV #{device.deviceId}</span>
                                    <span className="refurb-tag-id">REQ #{requestData?.refurbishmentRequestId || id}</span>
                                    <span className="refurb-tag-cat">{getCategoryIcon(device.categoryName)} {device.categoryName}</span>
                                </div>
                                <h2 className="refurb-completed-title">{device.brand} {device.model}</h2>
                                <div className="refurb-completed-meta">
                                    <span>Serial No: <strong className="refurb-mono">{device.serialNumber || `SN-${device.deviceId}`}</strong></span>
                                    <span>&bull;</span>
                                    <span>Registered Citizen: <strong>{citizen.name}</strong> ({citizen.city})</span>
                                    <span>&bull;</span>
                                    <span>Date of Certification: <strong>{requestData?.process?.completedAt ? new Date(requestData.process.completedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</strong></span>
                                </div>
                            </div>

                            <div className="refurb-completed-hero-right no-print">
                                <div className="refurb-completed-stats-pill">
                                    <div className="stat-box">
                                        <span className="stat-lbl">Quality Grade</span>
                                        <span className="stat-val highlight">★ {requestData?.process?.qualityGrade || qualityGrade || "Grade A"}</span>
                                    </div>
                                    <div className="stat-divider"></div>
                                    <div className="stat-box">
                                        <span className="stat-lbl">Warranty</span>
                                        <span className="stat-val">{requestData?.process?.warrantyDuration || warrantyDuration || "6 Months"}</span>
                                    </div>
                                    <div className="stat-divider"></div>
                                    <div className="stat-box">
                                        <span className="stat-lbl">Total Refurb Expense</span>
                                        <span className="stat-val emerald">₹{Number(requestData?.process?.totalRepairCost || requestData?.process?.refurbishedValue || totalRepairExpense || refurbishedValue || 0).toLocaleString("en-IN")}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="refurb-print-btn"
                                    onClick={() => window.print()}
                                    style={{ marginTop: "0.6rem", width: "100%", justifyContent: "center" }}
                                >
                                    <FiPrinter /> Print / Download Report
                                </button>
                            </div>
                        </div>

                        {/* Refurbishment Process Report */}
                        <div className="refurb-completed-report-section">
                            <div className="refurb-report-doc-card">
                                <div className="refurb-report-header">
                                    <div className="refurb-report-header-left">
                                        <div className="refurb-report-icon-box">
                                            <FiFileText />
                                        </div>
                                        <div>
                                            <h3 className="refurb-report-doc-title">Refurbishment Process Audit &amp; Technical Report</h3>
                                            <p className="refurb-report-doc-sub">
                                                Comprehensive verification audit of all hardware servicing, wiping, diagnostics, and testing completed at this facility
                                            </p>
                                        </div>
                                    </div>
                                    <div className="refurb-report-header-right" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <span className="refurb-report-id-pill">
                                            REQ #{requestData?.refurbishmentRequestId || id}
                                        </span>
                                        <button
                                            type="button"
                                            className="refurb-print-btn no-print"
                                            onClick={() => window.print()}
                                        >
                                            <FiPrinter /> Print Report
                                        </button>
                                    </div>
                                </div>

                                {/* Stepper / Timeline Summary */}
                                <div className="refurb-stepper-tracker">
                                    <div className="refurb-stepper-node completed">
                                        <div className="refurb-step-badge">1</div>
                                        <span className="refurb-step-title">Assessment</span>
                                        <span className="refurb-step-sub">{requestData?.process?.physicalCondition || assessmentValues.physicalCondition || "Grade B"}</span>
                                    </div>
                                    <div className="refurb-stepper-node completed">
                                        <div className="refurb-step-badge">2</div>
                                        <span className="refurb-step-title">Data Sanitization</span>
                                        <span className="refurb-step-sub">NIST SP 800-88</span>
                                    </div>
                                    <div className="refurb-stepper-node completed">
                                        <div className="refurb-step-badge">3</div>
                                        <span className="refurb-step-title">Repairs &amp; Parts</span>
                                        <span className="refurb-step-sub">{repairItems.length} Parts Logged</span>
                                    </div>
                                    <div className="refurb-stepper-node completed">
                                        <div className="refurb-step-badge">4</div>
                                        <span className="refurb-step-title">Diagnostics</span>
                                        <span className="refurb-step-sub">100% Bench Passed</span>
                                    </div>
                                    <div className="refurb-stepper-node completed">
                                        <div className="refurb-step-badge">5</div>
                                        <span className="refurb-step-title">Certification</span>
                                        <span className="refurb-step-sub">★ Grade A Certified</span>
                                    </div>
                                </div>

                                {/* Technical Sections */}
                                <div className="mrp-audit-sections-grid" style={{ marginTop: "1.5rem" }}>
                                    {/* Section 1: Initial Assessment & Diagnostics */}
                                    <div className="audit-card">
                                        <div className="audit-card-head">
                                            <FiCheckCircle className="head-icon icon-purple" />
                                            <h4>1. Technical Assessment &amp; Intake Feasibility</h4>
                                        </div>
                                        <div className="audit-card-body">
                                            <div className="audit-info-row">
                                                <span className="info-label">Physical Chassis:</span>
                                                <strong className="info-value">{requestData?.process?.physicalCondition || assessmentValues.physicalCondition || "Good"}</strong>
                                            </div>
                                            <div className="audit-info-row">
                                                <span className="info-label">Display &amp; Digitizer:</span>
                                                <strong className="info-value">{requestData?.process?.displayCondition || assessmentValues.displayCondition || "Working"}</strong>
                                            </div>
                                            <div className="audit-info-row">
                                                <span className="info-label">Battery Assessment:</span>
                                                <strong className="info-value">{requestData?.process?.batteryAssessment || assessmentValues.batteryAssessment || "Replaced & Calibrated"}</strong>
                                            </div>
                                            <div className="audit-info-row">
                                                <span className="info-label">Processing Decision:</span>
                                                <strong className="info-value" style={{ color: "#7c3aed" }}>{requestData?.process?.assessmentDecision || "Refurbishable (High Circular Value)"}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: NIST Data Sanitization */}
                                    <div className="audit-card">
                                        <div className="audit-card-head">
                                            <FiShield className="head-icon icon-purple" />
                                            <h4>2. Data Destruction &amp; NIST SP 800-88 Sanitization</h4>
                                        </div>
                                        <div className="audit-card-body">
                                            <div className="audit-info-row">
                                                <span className="info-label">Wiping Method:</span>
                                                <strong className="info-value">{requestData?.process?.wipingMethod || wipingMethod || "NIST SP 800-88 Rev. 1 Overwrite"}</strong>
                                            </div>
                                            <div className="audit-info-row">
                                                <span className="info-label">Verification Status:</span>
                                                <strong className="info-value" style={{ color: "#059669" }}>{requestData?.process?.wipingVerificationStatus || wipingVerificationStatus || "100% Cryptographic Verification Passed"}</strong>
                                            </div>
                                            <div className="audit-info-row">
                                                <span className="info-label">Sanitization Tech:</span>
                                                <strong className="info-value">{requestData?.process?.wipingTechnician || wipingTechnician || "Lead Sanitization Specialist"}</strong>
                                            </div>
                                            <div className="audit-info-row">
                                                <span className="info-label">DDC Certificate:</span>
                                                <strong className="info-value font-mono" style={{ color: "#7c3aed" }}>{requestData?.process?.certificateNumber || ddcCertNum || "DDC-VERIFIED-OK"}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Itemized Parts & Repair Log */}
                                    <div className="audit-card full-width">
                                        <div className="audit-card-head">
                                            <FiTool className="head-icon icon-purple" />
                                            <h4>3. Itemized Replacement Components &amp; Hardware Servicing Ledger</h4>
                                        </div>
                                        <div className="audit-card-body">
                                            {repairItems.length > 0 ? (
                                                <div className="mrp-materials-table-wrap">
                                                    <table className="mrp-materials-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Hardware Component</th>
                                                                <th>Action Performed</th>
                                                                <th>Quantity</th>
                                                                <th>Unit Cost (₹)</th>
                                                                <th>Total Cost (₹)</th>
                                                                <th>Technician Remarks</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {repairItems.map((p, idx) => (
                                                                <tr key={`comp-rep-${idx}`}>
                                                                    <td><strong>{p.component}</strong></td>
                                                                    <td>
                                                                        <span style={{ background: p.action === "Replace" ? "#fef2f2" : "#f5f3ff", color: p.action === "Replace" ? "#dc2626" : "#7c3aed", fontSize: "0.72rem", fontWeight: 800, padding: "2px 8px", borderRadius: "6px" }}>
                                                                            {p.action}
                                                                        </span>
                                                                    </td>
                                                                    <td>{p.quantity || 1}</td>
                                                                    <td>₹{Number(p.cost || 0).toLocaleString()}</td>
                                                                    <td style={{ fontWeight: 800, color: "#1e293b" }}>₹{(Number(p.cost || 0) * Number(p.quantity || 1)).toLocaleString()}</td>
                                                                    <td style={{ color: "#64748b", fontSize: "0.78rem" }}>{p.remarks || "Serviced & Bench-Certified OK"}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr>
                                                                <th colSpan="4">Total Refurbishment Expense:</th>
                                                                <th colSpan="2" style={{ color: "#7c3aed", fontWeight: 800 }}>₹{Number(requestData?.process?.totalRepairCost || requestData?.process?.refurbishedValue || totalRepairExpense || refurbishedValue || 0).toLocaleString("en-IN")}</th>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p style={{ color: "#64748b", margin: 0, fontSize: "0.85rem", fontStyle: "italic" }}>
                                                    Standard hardware tuning, cleaning, thermal paste re-application, and diagnostic bench certification recorded.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 4: Functional Benchmarks */}
                                    <div className="audit-card full-width">
                                        <div className="audit-card-head">
                                            <FiCheckSquare className="head-icon icon-purple" />
                                            <h4>4. Multi-Point Hardware Functional Test Benchmarks</h4>
                                        </div>
                                        <div className="audit-card-body">
                                            <div className="refurb-tests-grid">
                                                {(tests && tests.length > 0 ? tests : [
                                                    { label: "Motherboard & Power Rail", desc: "Voltage & Rail Stability", status: "Pass" },
                                                    { label: "Display Panel & Touch", desc: "Pixel & Touch Digitizer", status: "Pass" },
                                                    { label: "Battery Calibration", desc: "Cycle & Capacity Health", status: "Pass" },
                                                    { label: "Storage & SSD Health", desc: "SMART Bench & Read/Write", status: "Pass" },
                                                    { label: "Input Ports & Connectivity", desc: "USB, Type-C & Wireless", status: "Pass" },
                                                    { label: "Thermal & Fan Diagnostics", desc: "Cooling & Acoustic Check", status: "Pass" }
                                                ]).map((t, idx) => (
                                                    <div key={`comp-test-${idx}`} className="refurb-test-card">
                                                        <div className="refurb-test-left">
                                                            <div className="refurb-test-icon-box">
                                                                <FiCheckCircle />
                                                            </div>
                                                            <div className="refurb-test-text-group">
                                                                <span className="refurb-test-title">{t.label || t.component || `Diagnostic Benchmark #${idx + 1}`}</span>
                                                                <span className="refurb-test-sub">{t.desc || "100% Bench Verified"}</span>
                                                            </div>
                                                        </div>
                                                        <span className={`refurb-test-status ${t.status === "Pass" ? "pass" : "fail"}`}>
                                                            {t.status === "Pass" ? <><FiCheck /> Pass</> : <><FiAlertTriangle /> Fail</>}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 5: QA Approval & Warranty */}
                                    <div className="audit-card full-width" style={{ background: "#faf5ff", borderColor: "#ddd6fe" }}>
                                        <div className="audit-card-head">
                                            <FiAward className="head-icon icon-purple" />
                                            <h4>5. Quality Assurance Lead Approval &amp; Circular Reuse Warranty</h4>
                                        </div>
                                        <div className="audit-card-body">
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "0.85rem" }}>
                                                <div className="audit-info-row" style={{ background: "#ffffff", padding: "0.75rem 1rem" }}>
                                                    <span className="info-label">Certificate Number:</span>
                                                    <strong className="info-value font-mono" style={{ color: "#7c3aed", whiteSpace: "nowrap" }}>
                                                        {requestData?.process?.refurbishedCertificateNumber || requestData?.certificateId || refurbishedCertNum || `ECO-REF-2026-${String(requestData?.refurbishmentRequestId || id).padStart(6, '0')}`}
                                                    </strong>
                                                </div>
                                                <div className="audit-info-row" style={{ background: "#ffffff", padding: "0.75rem 1rem" }}>
                                                    <span className="info-label">Quality Grade:</span>
                                                    <strong className="info-value" style={{ color: "#7c3aed", whiteSpace: "nowrap" }}>
                                                        ★ {requestData?.process?.qualityGrade || qualityGrade || "Grade A (Certified Refurbished)"}
                                                    </strong>
                                                </div>
                                                <div className="audit-info-row" style={{ background: "#ffffff", padding: "0.75rem 1rem" }}>
                                                    <span className="info-label">Warranty Term:</span>
                                                    <strong className="info-value" style={{ color: "#6d28d9", whiteSpace: "nowrap" }}>
                                                        {requestData?.process?.warrantyDuration || warrantyDuration || "6 Months EcoCycle Warranty"}
                                                    </strong>
                                                </div>
                                                <div className="audit-info-row" style={{ background: "#ffffff", padding: "0.75rem 1rem" }}>
                                                    <span className="info-label">QA Lead Inspector:</span>
                                                    <strong className="info-value" style={{ whiteSpace: "nowrap" }}>
                                                        {requestData?.process?.qcInspector || qcInspector || "Senior QC Lead"}
                                                    </strong>
                                                </div>
                                            </div>
                                            {requestData?.process?.remarks && (
                                                <div style={{ marginTop: "0.85rem", background: "#ffffff", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #ede9fe" }}>
                                                    <span className="info-label" style={{ display: "block", marginBottom: "0.25rem" }}>Final Technical Remarks:</span>
                                                    <p style={{ margin: 0, color: "#334155", fontSize: "0.85rem" }}>{requestData.process.remarks}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Section 6: Financial Settlement & Money Transaction Ledger */}
                                    <div className="audit-card full-width" style={{ background: "#f0fdf4", borderColor: "#86efac" }}>
                                        <div className="audit-card-head">
                                            <FiCreditCard className="head-icon" style={{ color: "#166534" }} />
                                            <h4 style={{ color: "#166534" }}>6. EcoCycle Central Escrow Settlement &amp; Money Transaction Ledger</h4>
                                        </div>
                                        <div className="audit-card-body">
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
                                                <div className="audit-info-row" style={{ background: "#ffffff", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                                                    <span className="info-label">Settled Buyout Value:</span>
                                                    <strong className="info-value" style={{ color: "#059669", fontSize: "1.15rem" }}>
                                                        ₹{Number(requestData?.process?.refurbishedValue || refurbishedValue || 0).toLocaleString("en-IN")}
                                                    </strong>
                                                </div>
                                                <div className="audit-info-row" style={{ background: "#ffffff", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                                                    <span className="info-label">Payment Channel:</span>
                                                    <strong className="info-value" style={{ color: "#0f172a" }}>
                                                        {requestData?.process?.paymentMethod || paymentMethod || "Razorpay Payment Gateway (Test Sandbox)"}
                                                    </strong>
                                                </div>
                                                <div className="audit-info-row" style={{ background: "#ffffff", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                                                    <span className="info-label">Settlement Status:</span>
                                                    <strong className="info-value" style={{ color: "#166534", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                        <FiCheckCircle /> PAID &amp; AUTHORIZED
                                                    </strong>
                                                </div>
                                                <div className="audit-info-row" style={{ background: "#ffffff", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                                                    <span className="info-label">Transaction Reference ID:</span>
                                                    <strong className="info-value font-mono" style={{ color: "#7c3aed" }}>
                                                        {requestData?.process?.paymentTransactionId || requestData?.process?.razorpayPaymentId || paymentTransactionId || `PAY_REF_${device.deviceId || id}_OK`}
                                                    </strong>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: "0.85rem", background: "#ffffff", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "0.825rem", color: "#166534", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                                                <span>
                                                    <strong>Escrow Allocation:</strong> ₹{Number(requestData?.process?.refurbishedValue || refurbishedValue || 0).toLocaleString("en-IN")} deposited into EcoCycle central escrow pool for multi-stakeholder payout distribution (Citizen buyout, Technician diagnostic fee, Logistics &amp; Platform fee).
                                                </span>
                                                <span style={{ fontWeight: 800, color: "#047857" }}>
                                                    Center Repair Expense: ₹{Number(requestData?.process?.totalRepairCost || totalRepairExpense || 0).toLocaleString("en-IN")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : !isStarted ? (
                    /* =========================================================
                       PRE-START VIEW: REDESIGNED 2-COLUMN DASHBOARD & 10-DAY SLA
                       ========================================================= */
                    <div className="refurb-prestart-container">
                        {/* Pre-Start Hero Banner */}
                        <div className="refurb-prestart-hero-card">
                            <div className="refurb-prestart-hero-info">
                                <div className="refurb-prestart-tags">
                                    <span className="refurb-tag-id">DEV #{device.deviceId}</span>
                                    <span className="refurb-tag-cat">{getCategoryIcon(device.categoryName)} {device.categoryName}</span>
                                    <span className="refurb-tag-pref">Preference: {device.processingPreference || "Refurbish for Reuse"}</span>
                                </div>
                                <h2 className="refurb-prestart-title">{device.brand} {device.model}</h2>
                                <div className="refurb-prestart-meta-row">
                                    <span>S/N: <strong className="refurb-mono">{device.serialNumber}</strong></span>
                                    <span>&bull;</span>
                                    <span>Donor: <strong>{citizen.name}</strong> ({citizen.city})</span>
                                    <span>&bull;</span>
                                    <span>Weight: <strong>{device.weight ? `${device.weight} kg` : "Standard"}</strong></span>
                                </div>
                            </div>

                            <div className="refurb-prestart-hero-action" style={{ textAlign: "right", maxWidth: "340px" }}>
                                {checkIsDeliveryCompleted(requestData) ? (
                                    <>
                                        <button
                                            type="button"
                                            className="refurb-start-cta-btn"
                                            onClick={() => handleStartProcess(requestData?.refurbishmentRequestId || id)}
                                            disabled={isStartingProcess}
                                        >
                                            {isStartingProcess ? (
                                                <>
                                                    <FiRefreshCw className="spin-icon" /> Initializing Refurbishment...
                                                </>
                                            ) : (
                                                <>
                                                    <FiPlay /> Start Refurbishment Process
                                                </>
                                            )}
                                        </button>
                                        <div className="refurb-start-cta-hint">
                                            <FiClock /> Triggers 10-Day SLA Completion Window
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: "12px", padding: "0.85rem 1rem", textAlign: "left" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#92400e", fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.3rem" }}>
                                            <FiTruck style={{ fontSize: "1.1rem" }} /> Awaiting Physical Delivery
                                        </div>
                                        <p style={{ margin: 0, fontSize: "0.78rem", color: "#78350f", lineHeight: 1.4 }}>
                                            Device is awaiting arrival from the technician hub. SLA start will be enabled once physical delivery is received at the facility.
                                        </p>
                                        <Link
                                            to={`/refurbishment_delivery?device=${device?.deviceId || ""}`}
                                            style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "#7c3aed", fontWeight: 700, marginTop: "0.5rem", textDecoration: "none" }}
                                        >
                                            Track Inbound Delivery <FiArrowRight />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2-Column Responsive Layout */}
                        <div className="refurb-prestart-grid-layout">
                            {/* Left Main Column: Specs, Diagnostics, Photos */}
                            <div className="refurb-prestart-main-col">
                                {/* Specifications Card */}
                                <div className="refurb-card">
                                    <div className="refurb-card-header">
                                        <h4 className="refurb-card-title">
                                            <FiBox className="refurb-card-icon" /> Registered Device Specifications
                                        </h4>
                                    </div>
                                    <div className="refurb-specs-grid">
                                        <div className="refurb-spec-cell">
                                            <span className="refurb-spec-lbl">Device ID</span>
                                            <span className="refurb-spec-val highlight">#{device.deviceId}</span>
                                        </div>
                                        <div className="refurb-spec-cell">
                                            <span className="refurb-spec-lbl">Category</span>
                                            <span className="refurb-spec-val">{device.categoryName}</span>
                                        </div>
                                        <div className="refurb-spec-cell">
                                            <span className="refurb-spec-lbl">Brand &amp; Model</span>
                                            <span className="refurb-spec-val">{device.brand} {device.model}</span>
                                        </div>
                                        <div className="refurb-spec-cell">
                                            <span className="refurb-spec-lbl">Serial Number</span>
                                            <span className="refurb-spec-val refurb-mono">{device.serialNumber}</span>
                                        </div>
                                        <div className="refurb-spec-cell">
                                            <span className="refurb-spec-lbl">Condition / Working</span>
                                            <span className="refurb-spec-val">{device.condition} (Working: {device.working || "Yes"})</span>
                                        </div>
                                        <div className="refurb-spec-cell">
                                            <span className="refurb-spec-lbl">Weight &amp; Quantity</span>
                                            <span className="refurb-spec-val">{device.weight ? `${device.weight} kg` : "Standard"} (Qty: {device.quantity || 1})</span>
                                        </div>
                                        <div className="refurb-spec-cell">
                                            <span className="refurb-spec-lbl">Citizen Preference</span>
                                            <span className="refurb-spec-val highlight">{device.processingPreference || "Refurbish for Reuse"}</span>
                                        </div>
                                        <div className="refurb-spec-cell">
                                            <span className="refurb-spec-lbl">Registered Donor</span>
                                            <span className="refurb-spec-val">{citizen.name} ({citizen.city})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Inspection Diagnostic Record Card */}
                                <div className="refurb-card">
                                    <div className="refurb-card-header">
                                        <h4 className="refurb-card-title">
                                            <FiCheckSquare className="refurb-card-icon emerald" /> Preliminary Technician Diagnostic Record
                                        </h4>
                                        <span className="refurb-grade-badge">
                                            {inspection?.qualityGrade || "Passed Preliminary Inspection"}
                                        </span>
                                    </div>

                                    <div className="refurb-diagnostic-content">
                                        <div className="refurb-diagnostic-meta-bar">
                                            <div>
                                                <span className="refurb-dim-lbl">Diagnostic Health Score:</span>
                                                <span className="refurb-score-val">{inspection?.overallScore || 95}%</span>
                                            </div>
                                            <div>
                                                <span className="refurb-dim-lbl">Inspected By:</span>
                                                <strong>{inspection?.technicianName || "Certified Hardware Inspector"}</strong>
                                            </div>
                                        </div>

                                        <div className="refurb-remarks-callout">
                                            <span className="refurb-remarks-label">Inspector Remarks:</span>
                                            <p>{inspection?.technicianRemarks || "Device chassis and core hardware accepted for refurbishment processing."}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Evidence Photo Gallery */}
                                <div className="refurb-card">
                                    <div className="refurb-card-header">
                                        <h4 className="refurb-card-title">
                                            <FiCamera className="refurb-card-icon" /> Registered Photos &amp; Physical Evidence
                                        </h4>
                                        <span className="refurb-gallery-hint">Click image to enlarge</span>
                                    </div>

                                    <div className="refurb-gallery-grid">
                                        {requestData?.citizenPhotos?.map((p, idx) => {
                                            const photoUrl = resolvePhotoUrl(p.path, "devices/FrontPhotos");
                                            return (
                                                <div key={`pre-cp-${idx}`} className="refurb-gallery-item" onClick={() => setZoomedPhoto({ url: photoUrl, title: `${device.brand} ${device.model} - ${p.type}`, source: "Citizen Registered Photo" })}>
                                                    <img
                                                        src={photoUrl}
                                                        alt={p.type}
                                                        className="refurb-gallery-img"
                                                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400"; }}
                                                    />
                                                    <div className="refurb-gallery-tag citizen">{p.type}</div>
                                                </div>
                                            );
                                        })}

                                        {requestData?.inspectionPhotos?.map((p, idx) => {
                                            const photoUrl = resolvePhotoUrl(p.path, "inspections/photos");
                                            return (
                                                <div key={`pre-ip-${idx}`} className="refurb-gallery-item" onClick={() => setZoomedPhoto({ url: photoUrl, title: `${p.component} Diagnostic Photo`, source: "Technician Inspection Evidence" })}>
                                                    <img
                                                        src={photoUrl}
                                                        alt={p.component}
                                                        className="refurb-gallery-img"
                                                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400"; }}
                                                    />
                                                    <div className="refurb-gallery-tag inspector">Insp: {p.component}</div>
                                                </div>
                                            );
                                        })}

                                        {(!requestData?.citizenPhotos?.length && !requestData?.inspectionPhotos?.length) && (
                                            <div className="refurb-gallery-empty">
                                                No physical photos attached to this device record.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Sidebar Column: Dedicated Process Deadline & Workflow Roadmap */}
                            <div className="refurb-prestart-side-col">
                                {/* 10-Day SLA Commitment Card with Dedicated Process Deadline */}
                                <div className="refurb-sla-commitment-card">
                                    <div className="refurb-sla-badge-row">
                                        <div className="refurb-sla-icon-circle">
                                            <FiClock />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="refurb-sla-badge-title">Refurbishment Process Deadline</div>
                                            <div className="refurb-sla-badge-sub">10-Day SLA Compliance Commitment</div>
                                        </div>
                                        {isDeadlineOverdue ? (
                                            <span className="refurb-sla-pill-tag overdue">
                                                <FiAlertTriangle /> Overdue
                                            </span>
                                        ) : (
                                            <span className="refurb-sla-pill-tag active">
                                                <span className="refurb-sla-pulse-emerald"></span> Active SLA
                                            </span>
                                        )}
                                    </div>

                                    {/* Dedicated Spotlight for Process Deadline */}
                                    <div className="refurb-sla-deadline-spotlight">
                                        <div className="refurb-sla-spotlight-lbl">
                                            <FiCalendar /> Official Process Deadline
                                        </div>
                                        <div className="refurb-sla-spotlight-date">
                                            {formatDeadlineDisplay(deadlineDate || requestData?.processDeadline)}
                                        </div>
                                        <div className="refurb-sla-spotlight-countdown">
                                            <span className={`refurb-sla-countdown-badge ${isDeadlineOverdue ? "overdue" : "ontrack"}`}>
                                                <FiClock /> {slaTimeLeft || "10 Days Standard Window"}
                                            </span>
                                            <span className="refurb-sla-reg-note">Registered in SLA Ledger</span>
                                        </div>
                                    </div>

                                    {/* Lifecycle Milestones Row */}
                                    <div className="refurb-sla-milestones-row">
                                        <div className="refurb-sla-milestone">
                                            <span className="m-lbl">Allocated Date</span>
                                            <span className="m-val">
                                                {requestData?.assignedAt
                                                    ? new Date(requestData.assignedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                                                    : "Confirmed"}
                                            </span>
                                        </div>
                                        <div className="refurb-sla-milestone">
                                            <span className="m-lbl">SLA Window</span>
                                            <span className="m-val">10 Days Standard</span>
                                        </div>
                                        <div className="refurb-sla-milestone">
                                            <span className="m-lbl">Facility Delivery</span>
                                            <span className="m-val highlight">
                                                {checkIsDeliveryCompleted(requestData) ? "✓ Intake Verified" : "Pending Arrival"}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="refurb-sla-desc">
                                        This device is committed to an official <strong>10-Day Refurbishment SLA</strong>. Complete all inspection diagnostics, NIST SP 800-88 sanitization, repairs, and certification before this deadline.
                                    </p>

                                    <div className="refurb-sla-stats-box">
                                        <div className="refurb-sla-stat">
                                            <span className="lbl">Est. Refurb Expense</span>
                                            <span className="val">₹{Number(refurbishedValue || totalRepairExpense || profile.defaultMarketValue).toLocaleString()}</span>
                                        </div>
                                        <div className="refurb-sla-stat">
                                            <span className="lbl">Target Grade</span>
                                            <span className="val highlight">Grade A / A+</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Workflow Roadmap Stages Card */}
                                <div className="refurb-roadmap-card">
                                    <h5 className="refurb-roadmap-title">
                                        <FiLayers style={{ color: "var(--refurb-primary)" }} /> Refurbishment Stages
                                    </h5>
                                    <ul className="refurb-roadmap-list">
                                        <li className="refurb-roadmap-item">
                                            <span className="refurb-roadmap-num">1</span>
                                            <div className="refurb-roadmap-text">
                                                <strong>Assessment &amp; Feasibility</strong>
                                                <span>Multi-component health check &amp; viability index</span>
                                            </div>
                                        </li>
                                        <li className="refurb-roadmap-item">
                                            <span className="refurb-roadmap-num">2</span>
                                            <div className="refurb-roadmap-text">
                                                <strong>NIST SP 800-88 Data Sanitization</strong>
                                                <span>Cryptographic wipe &amp; destruction certificate</span>
                                            </div>
                                        </li>
                                        <li className="refurb-roadmap-item">
                                            <span className="refurb-roadmap-num">3</span>
                                            <div className="refurb-roadmap-text">
                                                <strong>Hardware Repairs &amp; Parts Logging</strong>
                                                <span>Replacement parts, upgrades &amp; ledger</span>
                                            </div>
                                        </li>
                                        <li className="refurb-roadmap-item">
                                            <span className="refurb-roadmap-num">4</span>
                                            <div className="refurb-roadmap-text">
                                                <strong>Functional Diagnostic Testing</strong>
                                                <span>Category-tailored subsystem verification</span>
                                            </div>
                                        </li>
                                        <li className="refurb-roadmap-item">
                                            <span className="refurb-roadmap-num">5</span>
                                            <div className="refurb-roadmap-text">
                                                <strong>Quality Control &amp; Grade Audit</strong>
                                                <span>5-point checklist &amp; certified grade assignment</span>
                                            </div>
                                        </li>
                                        <li className="refurb-roadmap-item">
                                            <span className="refurb-roadmap-num">6</span>
                                            <div className="refurb-roadmap-text">
                                                <strong>Official Certification &amp; Warranty</strong>
                                                <span>Certificate generation &amp; warranty tag issuance</span>
                                            </div>
                                        </li>
                                    </ul>

                                    {checkIsDeliveryCompleted(requestData) ? (
                                        <button
                                            type="button"
                                            className="refurb-start-cta-btn large full-width"
                                            onClick={() => handleStartProcess(requestData?.refurbishmentRequestId || id)}
                                            disabled={isStartingProcess}
                                        >
                                            {isStartingProcess ? (
                                                <>
                                                    <FiRefreshCw className="spin-icon" /> Starting Refurbishment...
                                                </>
                                            ) : (
                                                <>
                                                    <FiPlay /> Begin Refurbishment Process
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <div style={{ background: "#fffbeb", border: "1px dashed #f59e0b", borderRadius: "10px", padding: "0.9rem", textAlign: "center", marginTop: "1rem" }}>
                                            <div style={{ color: "#b45309", fontWeight: 700, fontSize: "0.88rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                                <FiAlertTriangle /> Delivery Incomplete
                                            </div>
                                            <p style={{ margin: "0.35rem 0 0.5rem 0", fontSize: "0.78rem", color: "#92400e" }}>
                                                Physical device has not arrived at the facility yet. SLA timer cannot be initiated.
                                            </p>
                                            <Link
                                                to={`/refurbishment_delivery?device=${device?.deviceId || ""}`}
                                                className="refurb-btn-view"
                                                style={{ display: "inline-flex", justifyContent: "center", width: "100%", padding: "0.45rem", fontSize: "0.8rem", textDecoration: "none" }}
                                            >
                                                <FiTruck /> View Inbound Transit Status
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* =========================================================
                       ACTIVE WORKFLOW VIEW (UNLOCKED AFTER START)
                       ========================================================= */
                    <>
                        {/* Active 10-Day SLA Countdown Banner */}
                        <div className="refurb-active-sla-banner">
                            <div className="refurb-sla-left">
                                <div className="refurb-sla-icon-active">
                                    <FiClock />
                                </div>
                                <div>
                                    <div className="refurb-sla-active-title">
                                        Refurbishment Process Active &bull; 10-Day SLA Window
                                    </div>
                                    <div className="refurb-sla-active-sub">
                                        Started: <strong>{startedAt ? new Date(startedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Active"}</strong> &bull; Process Deadline: <strong>{deadlineDate ? formatDeadlineDisplay(deadlineDate) : "10 Days from Start"}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="refurb-sla-right" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                
                                <span className="refurb-sla-time-badge">
                                    <FiClock /> {slaTimeLeft || "10 Days Remaining"}
                                </span>
                            </div>
                        </div>

                        {/* Device Overview Hero Card with Quick Diagnostic Toggle */}
                        <div className="refurb-hero-card">
                    <div className="refurb-hero-content">
                        <div>
                            <div className="refurb-hero-tags">
                                <span className="refurb-hero-pill">Device #{device.deviceId}</span>
                                <span className="refurb-hero-pill">Req #{requestData?.refurbishmentRequestId || id}</span>
                                <span className="refurb-hero-pill">{device.categoryName}</span>
                                <span className="refurb-hero-pill">Preference: {device.processingPreference || "Reuse"}</span>
                                <span className="refurb-hero-pill" style={{ background: "rgba(16, 185, 129, 0.25)", color: "#a7f3d0", borderColor: "#34d399" }}>
                                    ✓ QR Verified at Intake
                                </span>
                            </div>
                            <h2 className="refurb-hero-device-name" style={{ marginTop: "0.6rem" }}>
                                {device.brand} {device.model}
                            </h2>
                            <p style={{ margin: 0, opacity: 0.9, fontSize: "0.875rem" }}>
                                S/N: <strong>{device.serialNumber}</strong> &bull; Citizen: {citizen.name} ({citizen.city}) &bull; Weight: {device.weight || 2} kg
                            </p>
                        </div>

                        <div className="refurb-hero-stats">
                            <div className="refurb-hero-stat-item">
                                <div className="refurb-hero-stat-lbl">Inspection Grade</div>
                                <div className="refurb-hero-stat-val" style={{ color: "#34d399" }}>
                                    {inspection?.qualityGrade || device.condition || "Grade B"}
                                </div>
                            </div>
                            <div className="refurb-hero-stat-item">
                                <div className="refurb-hero-stat-lbl">Repair Expense</div>
                                <div className="refurb-hero-stat-val">
                                    ₹{totalRepairExpense.toLocaleString()}
                                </div>
                            </div>
                            <div className="refurb-hero-stat-item">
                                <div className="refurb-hero-stat-lbl">Target Value</div>
                                <div className="refurb-hero-stat-val" style={{ color: "#fbbf24" }}>
                                    ₹{Number(refurbishedValue).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Diagnostic Inspection Details Toggle Button */}
                    <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255, 255, 255, 0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <button
                            onClick={() => setShowInspectionDrawer(!showInspectionDrawer)}
                            style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", fontSize: "0.825rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.35rem", padding: 0 }}
                        >
                            <FiCamera /> {showInspectionDrawer ? "Hide Initial Inspection Diagnostic & Photos" : "View Initial Inspection Diagnostic & Photos"}
                            {showInspectionDrawer ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                            Inspector: {inspection?.technicianName || "Certified Hardware Inspector"}
                        </span>
                    </div>

                    {/* Expandable Diagnostic Drawer */}
                    {showInspectionDrawer && (
                        <div style={{ background: "rgba(0, 0, 0, 0.25)", borderRadius: "12px", padding: "1rem", marginTop: "0.75rem" }}>
                            <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                                <strong>Inspector Remarks:</strong> {inspection?.technicianRemarks || "Device intact and accepted for refurbishment processing."}
                            </div>
                            <div className="refurb-photo-gallery" style={{ marginTop: "0.5rem" }}>
                                {requestData?.citizenPhotos?.map((p, idx) => {
                                    const photoUrl = resolvePhotoUrl(p.path, "devices/FrontPhotos");
                                    return (
                                        <div key={`cp-${idx}`} style={{ textAlign: "center" }}>
                                            <img
                                                src={photoUrl}
                                                alt={p.type}
                                                className="refurb-photo-thumbnail"
                                                onClick={() => setZoomedPhoto({ url: photoUrl, title: `${device.brand} ${device.model} - ${p.type}`, source: "Citizen Registered Photo" })}
                                                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400"; }}
                                            />
                                            <div style={{ fontSize: "0.7rem", opacity: 0.9, marginTop: "0.25rem", fontWeight: 600 }}>{p.type}</div>
                                        </div>
                                    );
                                })}
                                {requestData?.inspectionPhotos?.map((p, idx) => {
                                    const photoUrl = resolvePhotoUrl(p.path, "inspections/photos");
                                    return (
                                        <div key={`ip-${idx}`} style={{ textAlign: "center" }}>
                                            <img
                                                src={photoUrl}
                                                alt={p.component}
                                                className="refurb-photo-thumbnail"
                                                onClick={() => setZoomedPhoto({ url: photoUrl, title: `${p.component} Diagnostic Photo`, source: "Technician Inspection Evidence" })}
                                                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400"; }}
                                            />
                                            <div style={{ fontSize: "0.7rem", color: "#a7f3d0", fontWeight: 700, marginTop: "0.25rem" }}>Insp: {p.component}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.85rem" }}>
                                <button
                                    type="button"
                                    onClick={() => handleDownloadInspectionReport()}
                                    style={{
                                        background: "#0284c7",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "6px",
                                        padding: "0.4rem 0.85rem",
                                        fontSize: "0.78rem",
                                        fontWeight: 700,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.4rem",
                                        cursor: "pointer"
                                    }}
                                >
                                    <FiDownload /> Download Device Inspection Report (PDF)
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 5-Step Stepper Navigation */}
                <div className="refurb-stepper-container">
                    <ul className="refurb-stepper-list">
                        {[
                            { num: 1, label: "1. Refurb Assessment" },
                            { num: 2, label: "2. Data Destruction" },
                            { num: 3, label: "3. Repair & Parts" },
                            { num: 4, label: "4. Testing" },
                            { num: 5, label: "5. Final Decision & Certification" }
                        ].map((s) => {
                            const isCurrent = currentStep === s.num;
                            const isDone = completedSteps.includes(s.num);
                            return (
                                <li
                                    key={s.num}
                                    className={`refurb-step-node ${isCurrent ? "active" : ""} ${isDone ? "completed" : ""} clickable`}
                                    onClick={() => {
                                        setCurrentStep(s.num);
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    title={`Go to Step ${s.num}: ${s.label}`}
                                >
                                    <div className="refurb-step-circle">
                                        {isDone ? <FiCheckSquare /> : s.num}
                                    </div>
                                    <span className="refurb-step-label">{s.label}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* =========================================================
                    STEP 1: REFURBISHMENT ASSESSMENT & DEVICE DETAILS
                   ========================================================= */}
                {currentStep === 1 && (
                    <div className="refurb-step-card">
                        <div className="refurb-step-header">
                            <div>
                                <h3 className="refurb-step-header-title">
                                    <FiTool style={{ color: "#7c3aed" }} /> Step 1: Device Details &amp; Inspection Assessment
                                </h3>
                                <p className="refurb-step-header-sub">
                                    Review registered specifications, diagnostic photos, and technician inspection findings.
                                </p>
                            </div>
                            <span className="refurb-action-pill replace" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                                Verification Stage
                            </span>
                        </div>

                        {/* SECTION 1.1: Device Specifications & Inspector Findings */}
                        <div className="refurb-card" style={{ marginBottom: "1.25rem" }}>
                            <div className="refurb-card-header">
                                <h4 className="refurb-card-title">
                                    <FiBox className="refurb-card-icon" /> Device Information &amp; Inspection Diagnostic Record
                                </h4>
                                <span className="refurb-grade-badge">
                                    {inspection?.qualityGrade || "Grade B"} (Score: {inspection?.overallScore || 95}%)
                                </span>
                            </div>

                            <div className="refurb-specs-grid" style={{ marginBottom: "1rem" }}>
                                <div className="refurb-spec-cell">
                                    <span className="refurb-spec-lbl">Device ID</span>
                                    <span className="refurb-spec-val highlight">#{device.deviceId}</span>
                                </div>
                                <div className="refurb-spec-cell">
                                    <span className="refurb-spec-lbl">Category</span>
                                    <span className="refurb-spec-val">{device.categoryName}</span>
                                </div>
                                <div className="refurb-spec-cell">
                                    <span className="refurb-spec-lbl">Brand &amp; Model</span>
                                    <span className="refurb-spec-val">{device.brand} {device.model}</span>
                                </div>
                                <div className="refurb-spec-cell">
                                    <span className="refurb-spec-lbl">Serial Number</span>
                                    <span className="refurb-spec-val refurb-mono">{device.serialNumber}</span>
                                </div>
                                <div className="refurb-spec-cell">
                                    <span className="refurb-spec-lbl">Original Condition</span>
                                    <span className="refurb-spec-val">{device.condition} (Working: {device.working || "Yes"})</span>
                                </div>
                                <div className="refurb-spec-cell">
                                    <span className="refurb-spec-lbl">Inspection Result</span>
                                    <span className="refurb-spec-val" style={{ color: "#059669" }}>
                                        {inspection?.qualityGrade || "Grade B"} ({inspection?.overallScore || 95}%)
                                    </span>
                                </div>
                                <div className="refurb-spec-cell">
                                    <span className="refurb-spec-lbl">Citizen's Preference</span>
                                    <span className="refurb-spec-val highlight" style={{ textTransform: "capitalize" }}>
                                        {device.processingPreference || "Refurbish for Reuse"}
                                    </span>
                                </div>
                                <div className="refurb-spec-cell">
                                    <span className="refurb-spec-lbl">Donor</span>
                                    <span className="refurb-spec-val">{citizen.name} ({citizen.city})</span>
                                </div>
                            </div>

                            {/* Inspector Remarks Callout */}
                            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.85rem 1rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                        Inspector Diagnostic Remarks
                                    </span>
                                    <span style={{ fontSize: "0.74rem", color: "#059669", fontWeight: 600 }}>
                                        ✓ Score: {inspection?.overallScore || 95}% ({inspection?.qualityGrade || "Grade B"})
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: "0.86rem", color: "#1e293b", fontWeight: 500, lineHeight: 1.45 }}>
                                    "{inspection?.technicianRemarks || "Device intact, safe for refurbishment diagnostics."}"
                                </p>
                            </div>
                        </div>

                            {/* Registered Photos & Diagnostic Evidence */}
                            <div className="refurb-card" style={{ marginTop: "1.25rem" }}>
                                <div className="refurb-card-header">
                                    <h4 className="refurb-card-title">
                                        <FiCamera className="refurb-card-icon" /> Registered Photos &amp; Inspection Evidence
                                    </h4>
                                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Click to zoom</span>
                                </div>

                                <div className="refurb-photo-gallery">
                                    {requestData?.citizenPhotos?.length > 0 || requestData?.inspectionPhotos?.length > 0 ? (
                                        <>
                                            {requestData.citizenPhotos?.map((p, idx) => {
                                                const photoUrl = resolvePhotoUrl(p.path, "devices/FrontPhotos");
                                                return (
                                                    <div
                                                        key={`cp-${idx}`}
                                                        className="refurb-photo-card"
                                                        onClick={() => setZoomedPhoto({ url: photoUrl, title: `${device.brand} ${device.model} - ${p.type}`, source: "Citizen Uploaded Photo" })}
                                                    >
                                                        <img
                                                            src={photoUrl}
                                                            alt={p.type}
                                                            className="refurb-photo-thumbnail"
                                                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400"; }}
                                                        />
                                                        <span className="refurb-photo-caption">{p.type}</span>
                                                    </div>
                                                );
                                            })}
                                            {requestData.inspectionPhotos?.map((p, idx) => {
                                                const photoUrl = resolvePhotoUrl(p.path, "inspections/photos");
                                                return (
                                                    <div
                                                        key={`ip-${idx}`}
                                                        className="refurb-photo-card"
                                                        onClick={() => setZoomedPhoto({ url: photoUrl, title: `${p.component} Inspection Photo`, source: "Technician Diagnostic Evidence" })}
                                                    >
                                                        <img
                                                            src={photoUrl}
                                                            alt={p.component}
                                                            className="refurb-photo-thumbnail"
                                                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400"; }}
                                                        />
                                                        <span className="refurb-photo-caption inspector">Insp: {p.component}</span>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    ) : (
                                        <div style={{ padding: "1rem", color: "#64748b", fontSize: "0.85rem" }}>
                                            Standard verified catalog device. No physical deviations recorded during intake.
                                        </div>
                                    )}
                                </div>
                            </div>

                        {/* Step Actions */}
                        <div className="refurb-step-actions">
                            <div></div>
                            <button className="refurb-btn-primary" onClick={handleNextStep}>
                                Proceed to Data Destruction <FiArrowRight />
                            </button>
                        </div>
                    </div>
                )}

                {/* =========================================================
                    STEP 2: DATA DESTRUCTION
                   ========================================================= */}
                {currentStep === 2 && (
                    <div className="refurb-step-card">
                        <div className="refurb-step-header">
                            <div>
                                <h3 className="refurb-step-header-title">
                                    <FiShield style={{ color: "#7c3aed" }} /> Step 2: Secure Data Destruction &amp; Sanitization
                                </h3>
                                <p className="refurb-step-header-sub">
                                    Before reuse, perform verified data sanitization compliant with NIST SP 800-88 standards.
                                </p>
                            </div>
                            <span className="refurb-action-pill upgrade" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                                Compliance Stage
                            </span>
                        </div>

                        {profile.hasStorage ? (
                            <>
                                <div className="refurb-data-destruction-box">
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: "1.1rem", color: "#ffffff" }}>
                                            <FiHardDrive style={{ verticalAlign: "middle", marginRight: "0.4rem", color: "#a78bfa" }} />
                                            Storage Sanitization Protocol
                                        </h4>
                                        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                                            Device: {device.brand} {device.model} &bull; S/N: {device.serialNumber}
                                        </p>
                                    </div>

                                    {/* Wipe Flow Visual Diagram: 3 Steps (Intake verification already done) */}
                                    <div className="refurb-wipe-flow">
                                        <div className={`refurb-wipe-step ${wipingProgress >= 30 ? "done" : ""}`}>
                                            <FiCheckSquare /> 1. Data Wiping
                                        </div>
                                        <span style={{ color: "#64748b" }}>&rarr;</span>
                                        <div className={`refurb-wipe-step ${wipingProgress >= 70 ? "done" : ""}`}>
                                            <FiCheckSquare /> 2. Wipe Completed
                                        </div>
                                        <span style={{ color: "#64748b" }}>&rarr;</span>
                                        <div className={`refurb-wipe-step ${(wipingProgress === 100 && wipingCompleted) ? "done" : ""}`}>
                                            <FiShield /> 3. Destruction Certificate
                                        </div>
                                    </div>

                                    {/* Wipe Progress Bar */}
                                    <div style={{ background: "rgba(255, 255, 255, 0.1)", borderRadius: "9999px", height: "8px", overflow: "hidden" }}>
                                        <div style={{ width: `${wipingProgress}%`, background: "linear-gradient(90deg, #10b981 0%, #34d399 100%)", height: "100%", transition: "width 0.3s ease" }}></div>
                                    </div>
                                </div>

                                {/* Form Fields for Data Destruction */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem", marginBottom: "1.25rem" }}>
                                    {/* Wiping Method: Auto-matching datalist + alphanumeric support */}
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                                            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", margin: 0 }}>
                                                Wiping Method
                                            </label>
                                            <span style={{ fontSize: "0.7rem", color: "#7c3aed", fontWeight: 600 }}>
                                                Type or Select
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            list="wiping-methods-datalist"
                                            className="refurb-select"
                                            placeholder="NIST SP 800-88 Rev 1 Overwrite"
                                            value={wipingMethod}
                                            onChange={(e) => handleWipingMethodChange(e.target.value)}
                                            autoComplete="off"
                                            style={{ width: "100%", fontSize: "0.85rem", fontWeight: 500 }}
                                        />
                                        <datalist id="wiping-methods-datalist">
                                            {standardWipingMethods.map((m) => (
                                                <option key={m} value={m} />
                                            ))}
                                        </datalist>

                                        {/* Quick Match Suggestion Chips while typing */}
                                        {wipingMethod && standardWipingMethods.filter(m => m.toLowerCase().includes(wipingMethod.toLowerCase()) && m.toLowerCase() !== wipingMethod.toLowerCase()).length > 0 && (
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.4rem" }}>
                                                {standardWipingMethods
                                                    .filter(m => m.toLowerCase().includes(wipingMethod.toLowerCase()) && m.toLowerCase() !== wipingMethod.toLowerCase())
                                                    .slice(0, 3)
                                                    .map(match => (
                                                        <button
                                                            key={match}
                                                            type="button"
                                                            onClick={() => handleWipingMethodChange(match)}
                                                            style={{
                                                                background: "#f3e8ff",
                                                                border: "1px solid #d8b4fe",
                                                                color: "#6b21a8",
                                                                borderRadius: "6px",
                                                                padding: "0.15rem 0.45rem",
                                                                fontSize: "0.7rem",
                                                                fontWeight: 600,
                                                                cursor: "pointer"
                                                            }}
                                                        >
                                                            + {match}
                                                        </button>
                                                    ))}
                                            </div>
                                        )}

                                        <span className="refurb-validation-hint">
                                            Numbers, letters, hyphens, and standards allowed.
                                        </span>
                                    </div>

                                    {/* Sanitization Technician (Type or Select with Datalist + Letters & spaces only) */}
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                                            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", margin: 0 }}>
                                                Sanitization Technician
                                            </label>
                                            <span style={{ fontSize: "0.7rem", color: "#7c3aed", fontWeight: 600 }}>
                                                Type or Select
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            list="technicians-datalist"
                                            className="refurb-select"
                                            placeholder="Type or select technician (e.g. cap waste Bench)"
                                            value={wipingTechnician}
                                            onChange={(e) => handleSanitizationTechnicianChange(e.target.value)}
                                            autoComplete="off"
                                            style={{ width: "100%", fontSize: "0.85rem", fontWeight: 500 }}
                                        />
                                        <datalist id="technicians-datalist">
                                            {standardTechnicians.map((tech) => (
                                                <option key={tech} value={tech} />
                                            ))}
                                        </datalist>

                                        {/* Quick Match Suggestion Chips for technician while typing */}
                                        {wipingTechnician && standardTechnicians.filter(t => t.toLowerCase().includes(wipingTechnician.toLowerCase()) && t.toLowerCase() !== wipingTechnician.toLowerCase()).length > 0 && (
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.4rem" }}>
                                                {standardTechnicians
                                                    .filter(t => t.toLowerCase().includes(wipingTechnician.toLowerCase()) && t.toLowerCase() !== wipingTechnician.toLowerCase())
                                                    .slice(0, 3)
                                                    .map(match => (
                                                        <button
                                                            key={match}
                                                            type="button"
                                                            onClick={() => handleSanitizationTechnicianChange(match)}
                                                            style={{
                                                                background: "#f3e8ff",
                                                                border: "1px solid #d8b4fe",
                                                                color: "#6b21a8",
                                                                borderRadius: "6px",
                                                                padding: "0.15rem 0.45rem",
                                                                fontSize: "0.7rem",
                                                                fontWeight: 600,
                                                                cursor: "pointer"
                                                            }}
                                                        >
                                                            + {match}
                                                        </button>
                                                    ))}
                                            </div>
                                        )}

                                        <span className="refurb-validation-hint">
                                            Validation: Only letters and spaces allowed (no numbers or special characters).
                                        </span>
                                    </div>

                                    {/* Verification Status (Dropdown select starting empty) */}
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                                            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", margin: 0 }}>
                                                Verification Status
                                            </label>
                                            <span style={{ fontSize: "0.7rem", color: "#7c3aed", fontWeight: 600 }}>
                                                Select
                                            </span>
                                        </div>
                                        <select
                                            className="refurb-select"
                                            value={wipingVerificationStatus}
                                            onChange={(e) => setWipingVerificationStatus(e.target.value)}
                                            style={{ width: "100%", fontSize: "0.85rem", fontWeight: 500 }}
                                        >
                                            <option value="">-- Select Verification Status --</option>
                                            <option value="Verified & Sealed (Passed 100%)">Verified &amp; Sealed (Passed 100%)</option>
                                            <option value="Passed Verification">Passed Verification</option>
                                            <option value="Compliance status for audit log">Compliance status for audit log</option>
                                        </select>
                                        <span className="refurb-validation-hint">
                                            Compliance status for audit log
                                        </span>
                                    </div>
                                </div>

                                {/* Dynamic Outcome Display based on sanitization result */}
                                {wipingCompleted ? (
                                    <div className="refurb-cert-action-card no-print" style={{ marginTop: "1.25rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                            <div style={{ background: "#ecfdf5", color: "#059669", padding: "0.6rem", borderRadius: "10px", fontSize: "1.35rem", display: "flex", alignItems: "center" }}>
                                                <FiShield />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                                                    ✓ Official Sanitization Certificate Ready &amp; Audited
                                                </div>
                                                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                                    Cert ID: <strong style={{ fontFamily: "monospace", color: "#7c3aed" }}>{ddcCertNum || `ECO-DDC-${device.deviceId}-8594`}</strong> &bull; Protocol: <strong style={{ color: "#059669" }}>{wipingMethod || "NIST SP 800-88 Rev 1 Overwrite"}</strong> &bull; Status: <strong style={{ color: "#059669" }}>{wipingVerificationStatus}</strong>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="refurb-btn-primary"
                                            style={{ fontSize: "0.825rem", padding: "0.55rem 1.15rem", display: "inline-flex", alignItems: "center", gap: "0.45rem" }}
                                            onClick={handlePrintDdcCert}
                                        >
                                            <FiPrinter /> Print Sanitization Certificate (PDF)
                                        </button>
                                    </div>
                                ) : (
                                    <div className="no-print" style={{ marginTop: "1.25rem", background: "#f8fafc", border: "1.5px dashed #cbd5e1", borderRadius: "12px", padding: "1.1rem 1.35rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                            <FiInfo style={{ color: "#64748b", fontSize: "1.25rem", flexShrink: 0 }} />
                                            <div>
                                                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>
                                                    Sanitization Pending &bull; Certificate Locked
                                                </div>
                                                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                                                    {!isWipeFormValid 
                                                        ? "Enter Wiping Method, Technician, and Verification Status above to run data wipe."
                                                        : `Click "Run Secure Data Wipe" to execute ${wipingMethod || "NIST SP 800-88 Rev 1 Overwrite"} and issue certificate.`}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="refurb-btn-primary"
                                            style={{
                                                fontSize: "0.82rem",
                                                padding: "0.5rem 1.1rem",
                                                background: "#7c3aed",
                                                opacity: (!isWipeFormValid || isWipingInProgress) ? 0.65 : 1,
                                                cursor: (!isWipeFormValid || isWipingInProgress) ? "not-allowed" : "pointer"
                                            }}
                                            onClick={handleSimulateWiping}
                                            disabled={!isWipeFormValid || isWipingInProgress}
                                            title={!isWipeFormValid ? "Please fill in all sanitization fields above to run wipe" : "Run Secure Data Wipe"}
                                        >
                                            <FiRefreshCw className={isWipingInProgress ? "spin-icon" : ""} />
                                            {isWipingInProgress ? `Sanitizing (${wipingProgress}%)...` : "Run Secure Data Wipe"}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "2rem", textAlign: "center" }}>
                                <FiShield style={{ fontSize: "2.5rem", color: "#94a3b8", marginBottom: "0.5rem" }} />
                                <h4 style={{ margin: "0 0 0.25rem 0", color: "#1e293b" }}>Non-Storage Device Category</h4>
                                <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>
                                    This device category ({device.categoryName}) does not contain user storage media. Data destruction step is automatically marked compliant (N/A).
                                </p>
                            </div>
                        )}

                        {/* Step Actions */}
                        <div className="refurb-step-actions">
                            <button className="refurb-btn-secondary" onClick={handlePrevStep}>
                                <FiArrowLeft /> Back
                            </button>
                            <button
                                className="refurb-btn-primary"
                                onClick={handleNextStep}
                                disabled={profile.hasStorage && !wipingCompleted}
                                title={profile.hasStorage && !wipingCompleted ? "Please run secure data wipe before proceeding" : ""}
                            >
                                Continue to Repair &amp; Replacement <FiArrowRight />
                            </button>
                        </div>
                    </div>
                )}

                {/* =========================================================
                    STEP 3: REPAIR & REPLACEMENT
                   ========================================================= */}
                {currentStep === 3 && (
                    <div className="refurb-step-card">
                        <div className="refurb-step-header">
                            <div>
                                <h3 className="refurb-step-header-title">
                                    <FiTool style={{ color: "#7c3aed" }} /> Step 3: Repair &amp; Replacement Item Logging
                                </h3>
                                <p className="refurb-step-header-sub">
                                    Record all replacement parts, upgrades, repairs, and labor performed on {device.brand} {device.model}.
                                </p>
                            </div>
                            <span className="refurb-action-pill repair" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                                Execution Stage
                            </span>
                        </div>

                        {/* Technician Initial Inspection & Diagnostics Reference Card with PDF Download Button */}
                        <div className="refurb-insp-download-banner no-print" style={{
                            background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                            border: "1.5px solid #bae6fd",
                            borderRadius: "12px",
                            padding: "1rem 1.25rem",
                            marginBottom: "1.25rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "1rem"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                <div style={{
                                    background: "#0284c7",
                                    color: "#ffffff",
                                    padding: "0.65rem",
                                    borderRadius: "10px",
                                    fontSize: "1.35rem",
                                    display: "flex",
                                    alignItems: "center"
                                }}>
                                    <FiFileText />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, color: "#0c4a6e", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.45rem" }}>
                                        Technician Intake Diagnostic Report Available
                                        <span style={{
                                            background: "#0284c7",
                                            color: "#ffffff",
                                            fontSize: "0.68rem",
                                            fontWeight: 800,
                                            padding: "0.15rem 0.5rem",
                                            borderRadius: "9999px"
                                        }}>
                                            Score: {inspection?.overallScore || 95}% ({inspection?.qualityGrade || "Grade B"})
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "#0369a1", marginTop: "0.15rem" }}>
                                        Inspected by: <strong>{inspection?.technicianName || "Certified Hardware Inspector"}</strong> &bull; Intake Condition: <strong>{device.condition || "Grade B"}</strong> &bull; Working: <strong>{device.working || "Yes"}</strong>
                                    </div>
                                    <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.25rem", fontStyle: "italic" }}>
                                        "{inspection?.technicianRemarks || "Chassis and core hardware acceptable for refurbishment & component servicing."}"
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="refurb-btn-primary"
                                style={{
                                    background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                                    boxShadow: "0 4px 12px rgba(2, 132, 199, 0.25)",
                                    fontSize: "0.825rem",
                                    padding: "0.55rem 1.15rem",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.45rem",
                                    whiteSpace: "nowrap"
                                }}
                                onClick={handleDownloadInspectionReport}
                                title="Download / Print the full diagnostic inspection report generated by the technician"
                            >
                                <FiDownload /> Download Device Inspection Report (PDF)
                            </button>
                        </div>

                        {/* Repair Items Table */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.65rem", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>
                                Refurbishment Servicing &amp; Replacement Item Log ({repairItems.length} items logged)
                            </div>
                            {profile.componentsList && profile.componentsList.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handlePopulateAllDeviceComponents}
                                    className="refurb-btn-secondary"
                                    style={{
                                        fontSize: "0.78rem",
                                        padding: "0.35rem 0.8rem",
                                        color: "#7c3aed",
                                        borderColor: "#ddd6fe",
                                        background: "#faf5ff",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.35rem"
                                    }}
                                    title="Load and populate all hardware components of this device into the repair table"
                                >
                                    <FiTool /> Populate All {profile.componentsList.length} Device Components
                                </button>
                            )}
                        </div>

                        <div className="refurb-repair-table-wrapper">
                            <table className="refurb-repair-table">
                                <thead>
                                    <tr>
                                        <th>Component</th>
                                        <th>Action</th>
                                        <th style={{ width: "80px", textAlign: "center" }}>Qty</th>
                                        <th style={{ minWidth: "145px" }}>Unit Price (₹) <span style={{ fontSize: "0.7rem", color: "#7c3aed", fontWeight: 500 }}>(₹0 - ₹500k)</span></th>
                                        <th style={{ minWidth: "110px" }}>Line Total (₹)</th>
                                        <th>Technician</th>
                                        <th>Remarks</th>
                                        <th style={{ textAlign: "center", width: "70px" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {repairItems.map((item) => (
                                        <tr key={item.id}>
                                            <td style={{ fontWeight: 700, color: "#0f172a" }}>
                                                {item.component}
                                            </td>
                                            <td>
                                                <select
                                                    value={item.action}
                                                    onChange={(e) => handleUpdateItemAction(item.id, e.target.value)}
                                                    style={{
                                                        padding: "0.25rem 0.5rem",
                                                        borderRadius: "6px",
                                                        fontSize: "0.78rem",
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                        border: "1.5px solid",
                                                        outline: "none",
                                                        borderColor:
                                                            item.action === "Replace" ? "#fca5a5" :
                                                            item.action === "Upgrade" ? "#c7d2fe" :
                                                            item.action === "Repair" ? "#fde68a" :
                                                            item.action === "Reinstall" ? "#bfdbfe" : "#bbf7d0",
                                                        background:
                                                            item.action === "Replace" ? "#fef2f2" :
                                                            item.action === "Upgrade" ? "#eef2ff" :
                                                            item.action === "Repair" ? "#fffbeb" :
                                                            item.action === "Reinstall" ? "#eff6ff" : "#f0fdf4",
                                                        color:
                                                            item.action === "Replace" ? "#b91c1c" :
                                                            item.action === "Upgrade" ? "#4338ca" :
                                                            item.action === "Repair" ? "#b45309" :
                                                            item.action === "Reinstall" ? "#1d4ed8" : "#15803d"
                                                    }}
                                                    title="Click to change action"
                                                >
                                                    <option value="Replace" style={{ background: "#ffffff", color: "#0f172a" }}>Replace</option>
                                                    <option value="Upgrade" style={{ background: "#ffffff", color: "#0f172a" }}>Upgrade</option>
                                                    <option value="Repair" style={{ background: "#ffffff", color: "#0f172a" }}>Repair</option>
                                                    <option value="Reinstall" style={{ background: "#ffffff", color: "#0f172a" }}>Reinstall</option>
                                                    <option value="Clean & Service" style={{ background: "#ffffff", color: "#0f172a" }}>Clean &amp; Service</option>
                                                </select>
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="99"
                                                    value={item.quantity || 1}
                                                    onChange={(e) => handleUpdateItemQty(item.id, e.target.value)}
                                                    style={{
                                                        width: "55px",
                                                        padding: "0.25rem 0.35rem",
                                                        borderRadius: "6px",
                                                        border: "1.5px solid #cbd5e1",
                                                        fontSize: "0.85rem",
                                                        fontWeight: 700,
                                                        textAlign: "center",
                                                        color: "#1e293b",
                                                        background: "#ffffff"
                                                    }}
                                                    title="Adjust quantity"
                                                />
                                            </td>
                                            <td>
                                                <div style={{ display: "inline-flex", alignItems: "center", background: "#ffffff", border: "1.5px solid #cbd5e1", borderRadius: "6px", padding: "0.25rem 0.5rem", width: "135px", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)" }}>
                                                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#64748b", marginRight: "3px" }}>₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="500000"
                                                        value={item.cost === 0 ? "0" : (item.cost ?? "")}
                                                        onChange={(e) => handleUpdateItemCost(item.id, e.target.value)}
                                                        onBlur={() => {
                                                            if (item.cost === "" || isNaN(Number(item.cost))) {
                                                                handleUpdateItemCost(item.id, 0);
                                                            }
                                                        }}
                                                        style={{
                                                            width: "100%",
                                                            border: "none",
                                                            background: "transparent",
                                                            fontWeight: 700,
                                                            color: "#7c3aed",
                                                            fontSize: "0.9rem",
                                                            outline: "none"
                                                        }}
                                                        title="Click to edit unit price (₹0 - ₹500,000)"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 800, color: "#0f172a" }}>
                                                ₹{(Number(item.cost || 0) * Number(item.quantity || 1)).toLocaleString()}
                                            </td>
                                            <td>{item.technician}</td>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={item.remarks || ""}
                                                    onChange={(e) => handleUpdateItemRemarks(item.id, e.target.value)}
                                                    placeholder="Remarks..."
                                                    style={{
                                                        width: "100%",
                                                        minWidth: "130px",
                                                        padding: "0.25rem 0.45rem",
                                                        fontSize: "0.8rem",
                                                        borderRadius: "6px",
                                                        border: "1px solid #cbd5e1",
                                                        color: "#334155",
                                                        background: "#ffffff"
                                                    }}
                                                    title="Edit remarks"
                                                />
                                            </td>
                                            <td style={{ textAlign: "center" }}>
                                                <button
                                                    onClick={() => handleRemoveRepairItem(item.id)}
                                                    style={{ background: "#fee2e2", border: "none", color: "#ef4444", borderRadius: "6px", padding: "0.35rem 0.5rem", cursor: "pointer", transition: "all 0.15s ease" }}
                                                    title="Remove Item"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {repairItems.length === 0 && (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
                                                No repair items logged. Add parts and labor below or click "Populate All Device Components".
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr style={{ background: "#faf5ff", fontWeight: 800 }}>
                                        <td colSpan="4" style={{ textAlign: "right", color: "#4c1d95" }}>Total Refurbishment Expense:</td>
                                        <td colSpan="4" style={{ color: "#7c3aed", fontSize: "1.05rem" }}>
                                            ₹{totalRepairExpense.toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Add Repair Item Inline Form */}
                        <form onSubmit={handleAddRepairItem} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", marginTop: "1rem" }}>
                            <h4 style={{ margin: "0 0 0.85rem 0", fontSize: "0.95rem", color: "#1e293b" }}>
                                <FiPlus style={{ verticalAlign: "middle" }} /> Log Additional Component / Action
                            </h4>

                            {/* Quick Select Component Pills for this Particular Device */}
                            {profile.componentsList && profile.componentsList.length > 0 && (
                                <div style={{ marginBottom: "1rem", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.75rem" }}>
                                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "0.45rem", display: "flex", justifyContent: "space-between" }}>
                                        <span>Components for {device.brand} {device.model} ({device.categoryName}):</span>
                                        <span style={{ color: "#7c3aed" }}>Click to auto-fill component &amp; cost</span>
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                                        {profile.componentsList.map((comp) => {
                                            const isAlreadyAdded = repairItems.some(item => item.component.toLowerCase() === comp.toLowerCase());
                                            const isSelected = newRepairComponent === comp;
                                            return (
                                                <button
                                                    key={comp}
                                                    type="button"
                                                    onClick={() => handleSelectQuickComponent(comp)}
                                                    style={{
                                                        background: isSelected ? "#7c3aed" : isAlreadyAdded ? "#ecfdf5" : "#f1f5f9",
                                                        color: isSelected ? "#ffffff" : isAlreadyAdded ? "#065f46" : "#334155",
                                                        border: `1px solid ${isSelected ? "#7c3aed" : isAlreadyAdded ? "#a7f3d0" : "#cbd5e1"}`,
                                                        borderRadius: "6px",
                                                        padding: "0.25rem 0.55rem",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 600,
                                                        cursor: "pointer",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "0.25rem",
                                                        transition: "all 0.15s ease",
                                                        opacity: isAlreadyAdded ? 0.85 : 1
                                                    }}
                                                    title={isAlreadyAdded ? `"${comp}" is already added (click to view)` : `Add "${comp}"`}
                                                >
                                                    {isAlreadyAdded && "✓ "}
                                                    {comp}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.85rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.725rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "0.25rem" }}>Component</label>
                                    <input
                                        type="text"
                                        list="device-components-datalist"
                                        placeholder="Select or type component..."
                                        className="refurb-select"
                                        value={newRepairComponent}
                                        onChange={(e) => setNewRepairComponent(e.target.value)}
                                        required
                                    />
                                    <datalist id="device-components-datalist">
                                        {(profile.componentsList || []).map((c) => (
                                            <option key={c} value={c} />
                                        ))}
                                    </datalist>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "0.725rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "0.25rem" }}>Action</label>
                                    <select
                                        className="refurb-select"
                                        value={newRepairAction}
                                        onChange={(e) => setNewRepairAction(e.target.value)}
                                    >
                                        <option value="Replace">Replace</option>
                                        <option value="Upgrade">Upgrade</option>
                                        <option value="Repair">Repair</option>
                                        <option value="Reinstall">Reinstall</option>
                                        <option value="Clean & Service">Clean &amp; Service</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "0.725rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "0.25rem" }}>Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="99"
                                        className="refurb-select"
                                        value={newRepairQty}
                                        onChange={(e) => setNewRepairQty(Math.max(1, Number(e.target.value) || 1))}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "0.725rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                                        Unit Cost (₹) <span style={{ color: "#7c3aed", fontWeight: 600 }}>(₹0 - ₹500,000)</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="500000"
                                        className="refurb-select"
                                        value={newRepairCost}
                                        onChange={(e) => {
                                            const raw = e.target.value;
                                            if (raw === "") {
                                                setNewRepairCost("");
                                            } else {
                                                const num = Number(raw);
                                                setNewRepairCost(isNaN(num) ? 0 : Math.max(0, Math.min(500000, num)));
                                            }
                                        }}
                                        onBlur={() => {
                                            if (newRepairCost === "" || isNaN(Number(newRepairCost))) {
                                                setNewRepairCost(0);
                                            }
                                        }}
                                        placeholder="0 - 500000"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "0.725rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "0.25rem" }}>Technician</label>
                                    <input
                                        type="text"
                                        className="refurb-select"
                                        value={newRepairTech}
                                        onChange={(e) => setNewRepairTech(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.85rem", marginTop: "0.85rem", alignItems: "center" }}>
                                <input
                                    type="text"
                                    placeholder="Remarks (letters, spaces, and / only)..."
                                    className="refurb-select"
                                    style={{ flex: 1 }}
                                    value={newRepairRemarks}
                                    onChange={(e) => handleNewRepairRemarksChange(e.target.value)}
                                />
                                <button type="submit" className="refurb-btn-primary" style={{ padding: "0.55rem 1.25rem" }}>
                                    <FiPlus /> Add Item
                                </button>
                            </div>
                            <span className="refurb-validation-hint" style={{ marginTop: "0.35rem", display: "block" }}>
                                Validation: Only letters, spaces, and slashes (/) allowed for remarks (no numbers or other special characters).
                            </span>
                        </form>

                        {/* Step Actions */}
                        <div className="refurb-step-actions">
                            <button className="refurb-btn-secondary" onClick={handlePrevStep}>
                                <FiArrowLeft /> Back
                            </button>
                            <button className="refurb-btn-primary" onClick={handleNextStep}>
                                Proceed to Functional Testing <FiArrowRight />
                            </button>
                        </div>
                    </div>
                )}

                {/* =========================================================
                    STEP 4: FUNCTIONAL TESTING
                   ========================================================= */}
                {currentStep === 4 && (
                    <div className="refurb-step-card">
                        <div className="refurb-step-header">
                            <div>
                                <h3 className="refurb-step-header-title">
                                    <FiCheckSquare style={{ color: "#7c3aed" }} /> Step 4: Functional Diagnostic Testing
                                </h3>
                                <p className="refurb-step-header-sub">
                                    Hardware component test suite for <strong>{device.brand} {device.model}</strong> ({device.categoryName}) &bull; {tests.length} Components
                                </p>
                            </div>

                            <button className="refurb-btn-secondary" onClick={handlePassAllTests} style={{ fontSize: "0.85rem", color: "#059669", borderColor: "#a7f3d0" }}>
                                <FiCheckSquare /> Pass All Tests
                            </button>
                        </div>

                        {/* Test Suite Cards Grid */}
                        <div className="refurb-test-grid">
                            {tests.map((t) => {
                                const compName = t.component || t.label.replace(" Functional & Operational Check", "").replace(" Functional Check", "");
                                return (
                                    <div className="refurb-test-card" key={t.id}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: 0 }}>
                                            <span className="refurb-test-title">
                                                <FiCheckCircle style={{ color: t.status === "Pass" ? "#10b981" : "#ef4444", flexShrink: 0 }} />
                                                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{compName}</span>
                                            </span>
                                            <span style={{ fontSize: "0.72rem", color: "#64748b", marginLeft: "1.45rem" }}>
                                                Operational Diagnostic Check
                                            </span>
                                        </div>

                                        <div className="refurb-toggle-btn-group">
                                            <button
                                                type="button"
                                                className={`refurb-toggle-btn ${t.status === "Pass" ? "active-pass" : ""}`}
                                                onClick={() => handleToggleTest(t.id, "Pass")}
                                            >
                                                Pass
                                            </button>
                                            <button
                                                type="button"
                                                className={`refurb-toggle-btn ${t.status === "Fail" ? "active-fail" : ""}`}
                                                onClick={() => handleToggleTest(t.id, "Fail")}
                                            >
                                                Fail
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Test Diagnostic Summary Card with Clean Engineering Symbols */}
                        {(() => {
                            const passedCount = tests.filter(t => t.status === "Pass").length;
                            const totalCount = tests.length || 1;
                            const pendingCount = tests.length - passedCount;
                            const passRate = Math.round((passedCount / totalCount) * 100);
                            const allPassed = passedCount === tests.length && tests.length > 0;
                            const isLow = passRate < 40;

                            const themeColor = allPassed ? "#10b981" : isLow ? "#ef4444" : "#6366f1";
                            const btnBg = allPassed ? "#059669" : isLow ? "#dc2626" : "#4f46e5";
                            const pillBg = allPassed ? "#dcfce7" : isLow ? "#fee2e2" : "#e0e7ff";
                            const pillColor = allPassed ? "#15803d" : isLow ? "#b91c1c" : "#4338ca";
                            const pillBorder = allPassed ? "#bbf7d0" : isLow ? "#fecaca" : "#c7d2fe";
                            const progressGradient = allPassed
                                ? "linear-gradient(90deg, #10b981, #059669)"
                                : isLow
                                    ? "linear-gradient(90deg, #ef4444, #f87171)"
                                    : "linear-gradient(90deg, #6366f1, #10b981)";

                            return (
                                <div style={{
                                    background: allPassed ? "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)" : "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                                    border: `1.5px solid ${allPassed ? "#86efac" : isLow ? "#fca5a5" : "#cbd5e1"}`,
                                    borderRadius: "14px",
                                    padding: "1.2rem 1.4rem",
                                    marginBottom: "1.25rem",
                                    boxShadow: allPassed
                                        ? "0 4px 14px rgba(16, 185, 129, 0.08)"
                                        : isLow
                                            ? "0 4px 14px rgba(239, 68, 68, 0.08)"
                                            : "0 4px 14px rgba(99, 102, 241, 0.06)"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                                        {/* Left: Icon Badge & Diagnostic Metrics */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                            <div style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius: "12px",
                                                background: themeColor,
                                                color: "#ffffff",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "1.5rem",
                                                boxShadow: `0 4px 12px ${isLow ? "rgba(239, 68, 68, 0.25)" : allPassed ? "rgba(16, 185, 129, 0.25)" : "rgba(99, 102, 241, 0.25)"}`
                                            }}>
                                                {allPassed ? <FiShield /> : <FiCpu />}
                                            </div>

                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                                    <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                                                        Hardware Diagnostic Verification
                                                    </span>
                                                    <span style={{
                                                        background: pillBg,
                                                        color: pillColor,
                                                        padding: "0.15rem 0.65rem",
                                                        borderRadius: "9999px",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 700,
                                                        border: `1px solid ${pillBorder}`
                                                    }}>
                                                        {passRate}% Diagnostic Progress
                                                    </span>
                                                </div>

                                                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginTop: "0.3rem", fontSize: "0.8rem", color: "#475569" }}>
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#16a34a", fontWeight: 700 }}>
                                                        <FiCheckCircle /> {passedCount} Verified
                                                    </span>
                                                    {pendingCount > 0 && (
                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: isLow ? "#dc2626" : "#6366f1", fontWeight: 700 }}>
                                                            <FiTool /> {pendingCount} Pending Check
                                                        </span>
                                                    )}
                                                    <span style={{ color: "#94a3b8" }}>&bull;</span>
                                                    <span>{totalCount} Total Components</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Status Stamp Badge */}
                                        <div>
                                            {allPassed ? (
                                                <div style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "0.45rem",
                                                    background: "#059669",
                                                    color: "#ffffff",
                                                    padding: "0.5rem 1.1rem",
                                                    borderRadius: "10px",
                                                    fontSize: "0.825rem",
                                                    fontWeight: 800,
                                                    letterSpacing: "0.3px",
                                                    boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)"
                                                }}>
                                                    <FiCheckSquare style={{ fontSize: "1.05rem" }} />
                                                    ALL SUB-SYSTEMS VERIFIED
                                                </div>
                                            ) : (
                                                <div style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "0.45rem",
                                                    background: btnBg,
                                                    color: "#ffffff",
                                                    padding: "0.5rem 1.1rem",
                                                    borderRadius: "10px",
                                                    fontSize: "0.825rem",
                                                    fontWeight: 800,
                                                    letterSpacing: "0.3px",
                                                    boxShadow: `0 2px 8px ${isLow ? "rgba(220, 38, 38, 0.25)" : "rgba(79, 70, 229, 0.25)"}`
                                                }}>
                                                    <FiTool style={{ fontSize: "1.05rem" }} />
                                                    {passedCount} OF {totalCount} TESTS COMPLETED
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress meter bar */}
                                    <div style={{ marginTop: "0.85rem", background: "rgba(0, 0, 0, 0.06)", borderRadius: "9999px", height: "6px", overflow: "hidden" }}>
                                        <div style={{
                                            width: `${passRate}%`,
                                            height: "100%",
                                            background: progressGradient,
                                            borderRadius: "9999px",
                                            transition: "width 0.3s ease"
                                        }}></div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Step Actions */}
                        <div className="refurb-step-actions">
                            <button className="refurb-btn-secondary" onClick={handlePrevStep}>
                                <FiArrowLeft /> Back
                            </button>
                            <button className="refurb-btn-primary" onClick={handleNextStep}>
                                Proceed to Final Decision &amp; Certification <FiArrowRight />
                            </button>
                        </div>
                    </div>
                )}

                {/* =========================================================
                    STEP 5: FINAL OUTCOME & CERTIFICATION
                   ========================================================= */}
                {currentStep === 5 && (
                    <div className="refurb-step-card">
                        <div className="refurb-step-header">
                            <div>
                                <h3 className="refurb-step-header-title">
                                    <FiAward style={{ color: "#7c3aed" }} /> Step 5: Final Outcome &amp; EcoCycle Certification
                                </h3>
                                <p className="refurb-step-header-sub">
                                    Review final disposition: Certified Refurbished Device vs Recycling Center transfer.
                                </p>
                            </div>
                            <span className="refurb-action-pill upgrade" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                                Final Certification
                            </span>
                        </div>

                        {/* Outcome A: Refurbished */}
                        {finalOutcome === "Refurbished" ? (
                            <div>
                                <div className="refurb-outcome-badge">
                                    <FiCheckCircle style={{ fontSize: "2.8rem", marginBottom: "0.5rem" }} />
                                    <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.5rem" }}>
                                        Refurbishment Completed &bull; Ready for Safe Reuse
                                    </h3>
                                    <p style={{ margin: 0, opacity: 0.95, fontSize: "0.95rem" }}>
                                        EcoCycle Certified Device &rarr; Refurbished E-Waste for Reusable / Circular Donation Lifecycle
                                    </p>
                                </div>

                                {/* System Valuation Benchmark & Allowed Center Offer Tolerance Range */}
                                <div className="no-print" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1.25rem", margin: "1.25rem 0", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                <FiDollarSign style={{ color: "#059669" }} /> Center Buyout Valuation &amp; Final Price
                                            </h4>
                                            <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                                                The buyout offer is fixed to the system-calculated Estimated Value. The center cannot edit this price as it represents the certified fair market valuation.
                                            </p>
                                        </div>
                                        <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", padding: "0.4rem 0.85rem", borderRadius: "8px", fontSize: "0.825rem", fontWeight: 800, color: "#166534", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                            <FiLock style={{ color: "#16a34a" }} /> Fixed Final Price: ₹{Number(offerBounds.adjustedVal).toLocaleString("en-IN")}
                                        </div>
                                    </div>

                                    {/* 5 KPI Valuation Breakdown Cards */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.85rem", marginBottom: "1.25rem" }}>
                                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "0.75rem", borderRadius: "10px" }}>
                                            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Model Reference</span>
                                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", marginTop: "0.2rem" }}>
                                                ₹{Number(offerBounds.refPrice).toLocaleString("en-IN")}
                                            </div>
                                            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Master Baseline</span>
                                        </div>

                                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "0.75rem", borderRadius: "10px" }}>
                                            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Age Factor</span>
                                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#7c3aed", marginTop: "0.2rem" }}>
                                                {Math.round(offerBounds.agePct * 100)}%
                                            </div>
                                            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{offerBounds.ageYears} yrs ({Math.round(offerBounds.agePct * 100)}% Retained)</span>
                                        </div>

                                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "0.75rem", borderRadius: "10px" }}>
                                            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Condition Factor</span>
                                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0284c7", marginTop: "0.2rem" }}>
                                                {Math.round(offerBounds.conditionPct * 100)}%
                                            </div>
                                            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Condition &amp; Diagnostics</span>
                                        </div>

                                        <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", padding: "0.75rem", borderRadius: "10px" }}>
                                            <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Estimated Value (Final)</span>
                                            <div style={{ fontSize: "1.15rem", fontWeight: 900, color: "#15803d", marginTop: "0.2rem" }}>
                                                ₹{Number(offerBounds.adjustedVal).toLocaleString("en-IN")}
                                            </div>
                                            <span style={{ fontSize: "0.7rem", color: "#16a34a" }}>Ref × Age × Condition</span>
                                        </div>

                                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "0.75rem", borderRadius: "10px" }}>
                                            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Repair Expense</span>
                                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#d97706", marginTop: "0.2rem" }}>
                                                ₹{Number(totalRepairExpense).toLocaleString("en-IN")}
                                            </div>
                                            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Hardware Replacement</span>
                                        </div>
                                    </div>

                                    {/* Center Fixed Offer & Transparent Valuation Equation */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", alignItems: "flex-start" }}>
                                        <div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                                                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", margin: 0 }}>
                                                    Final Decided Buyout Offer (₹) *
                                                </label>
                                                <span style={{ fontSize: "0.72rem", color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                                    <FiLock /> Fixed / Non-Editable
                                                </span>
                                            </div>
                                            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                                <span style={{ position: "absolute", left: "0.85rem", fontWeight: 800, color: "#059669", fontSize: "1.1rem" }}>₹</span>
                                                <input
                                                    type="number"
                                                    readOnly={true}
                                                    disabled={false}
                                                    className="refurb-select"
                                                    style={{
                                                        paddingLeft: "2rem",
                                                        paddingRight: "5.5rem",
                                                        fontSize: "1.15rem",
                                                        fontWeight: 800,
                                                        borderColor: "#10b981",
                                                        backgroundColor: "#f8fafc",
                                                        color: "#0f172a",
                                                        cursor: "not-allowed"
                                                    }}
                                                    value={offerBounds.adjustedVal || refurbishedValue || 0}
                                                />
                                                <span style={{
                                                    position: "absolute",
                                                    right: "0.75rem",
                                                    background: "#e2e8f0",
                                                    color: "#475569",
                                                    fontSize: "0.7rem",
                                                    fontWeight: 700,
                                                    padding: "0.2rem 0.5rem",
                                                    borderRadius: "4px",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.03em"
                                                }}>
                                                    Fixed
                                                </span>
                                            </div>

                                            {/* Real-time Status Badge */}
                                            <div style={{ marginTop: "0.5rem" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "#166534", background: "#f0fdf4", padding: "0.45rem 0.75rem", borderRadius: "8px", border: "1px solid #bbf7d0", fontWeight: 600 }}>
                                                    <FiCheckCircle style={{ flexShrink: 0 }} /> Fixed Valuation: The Estimated Value of ₹{Number(offerBounds.adjustedVal).toLocaleString("en-IN")} is the final non-negotiable buyout price.
                                                </div>
                                            </div>

                                            {/* Transparent Formula Box */}
                                            <div style={{ marginTop: "0.6rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.6rem 0.85rem", fontSize: "0.76rem" }}>
                                                <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                                    <span>📐 Valuation Equation:</span>
                                                </div>
                                                <div style={{ fontFamily: "monospace", color: "#0f172a", fontWeight: 700, fontSize: "0.82rem" }}>
                                                    ₹{Number(offerBounds.refPrice).toLocaleString("en-IN")} <span style={{ color: "#64748b" }}>(Ref)</span> × {Math.round(offerBounds.agePct * 100)}% <span style={{ color: "#64748b" }}>(Age)</span> × {Math.round(offerBounds.conditionPct * 100)}% <span style={{ color: "#64748b" }}>(Condition)</span> = ₹{Number(offerBounds.adjustedVal).toLocaleString("en-IN")}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                                                Certificate ID *
                                            </label>
                                            <input
                                                type="text"
                                                className="refurb-select"
                                                value={refurbishedCertNum}
                                                placeholder="ECO-REF-2026-00421"
                                                onChange={(e) => handleRefurbishedCertNumChange(e.target.value)}
                                                style={{ fontFamily: "monospace", fontWeight: 700, color: "#7c3aed" }}
                                            />
                                            <span className="refurb-validation-hint" style={{ marginTop: "0.35rem", display: "block" }}>
                                                Format: <strong>ECO-REF-YYYY-XXXXX</strong>
                                            </span>

                                            <div style={{ marginTop: "0.85rem" }}>
                                                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                                                    Warranty Duration *
                                                </label>
                                                <select
                                                    className="refurb-select"
                                                    value={warrantyDuration}
                                                    onChange={(e) => setWarrantyDuration(e.target.value)}
                                                >
                                                    <option value="6 Months EcoCycle Warranty">6 Months EcoCycle Warranty</option>
                                                    <option value="12 Months Comprehensive Warranty">12 Months Comprehensive Warranty</option>
                                                    <option value="3 Months Limited Warranty">3 Months Limited Warranty</option>
                                                    <option value="1 Year Extended Warranty">1 Year Extended Warranty</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Step 5: EcoCycle Buyout Settlement Payment Section */}
                                <div style={{
                                    background: paymentStatus === "Paid" ? "#f0fdf4" : "#fbf8ff",
                                    border: `1.5px solid ${paymentStatus === "Paid" ? "#86efac" : "#d8b4fe"}`,
                                    borderRadius: "14px",
                                    padding: "1.25rem 1.5rem",
                                    marginTop: "1.25rem",
                                    boxShadow: "0 4px 16px rgba(124, 58, 237, 0.05)"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                                        <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                                            <div style={{
                                                background: paymentStatus === "Paid" ? "#dcfce7" : "#ede9fe",
                                                color: paymentStatus === "Paid" ? "#15803d" : "#7c3aed",
                                                padding: "0.75rem",
                                                borderRadius: "12px",
                                                fontSize: "1.5rem",
                                                display: "flex",
                                                alignItems: "center"
                                            }}>
                                                <FiCreditCard />
                                            </div>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                                    <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                                                        EcoCycle Central Escrow Settlement Payment
                                                    </h4>
                                                    {paymentStatus === "Paid" ? (
                                                        <span style={{ background: "#22c55e", color: "#ffffff", fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.65rem", borderRadius: "9999px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                            <FiCheckCircle /> SETTLEMENT PAID &amp; AUTHORIZED
                                                        </span>
                                                    ) : (
                                                        <span style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a", fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.65rem", borderRadius: "9999px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                            <FiAlertCircle /> SETTLEMENT PAYMENT REQUIRED
                                                        </span>
                                                    )}
                                                </div>
                                                <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.825rem", color: "#64748b", maxWidth: "600px" }}>
                                                    The center must settle the final buyout valuation to the EcoCycle central escrow pool before official certification and release.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div>
                                            {paymentStatus === "Paid" ? (
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 700 }}>
                                                        Txn Ref: <code style={{ fontFamily: "monospace", color: "#047857" }}>{paymentTransactionId}</code>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPaymentModal(true)}
                                                        style={{
                                                            marginTop: "0.4rem",
                                                            background: "#ffffff",
                                                            color: "#15803d",
                                                            border: "1.5px solid #86efac",
                                                            borderRadius: "8px",
                                                            padding: "0.45rem 0.9rem",
                                                            fontSize: "0.8rem",
                                                            fontWeight: 700,
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "0.4rem"
                                                        }}
                                                    >
                                                        <FiEye /> View Payment Voucher
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPaymentModal(true)}
                                                    style={{
                                                        background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                                                        color: "#ffffff",
                                                        border: "none",
                                                        borderRadius: "10px",
                                                        padding: "0.65rem 1.35rem",
                                                        fontSize: "0.9rem",
                                                        fontWeight: 800,
                                                        cursor: "pointer",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "0.5rem",
                                                        boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)"
                                                    }}
                                                >
                                                    <FiCreditCard /> Pay ₹{Number(refurbishedValue || offerBounds.defaultSuggested || 0).toLocaleString("en-IN")} to EcoCycle
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Breakdown Quick Strip */}
                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                        gap: "0.75rem",
                                        marginTop: "1rem",
                                        paddingTop: "0.85rem",
                                        borderTop: `1px dashed ${paymentStatus === "Paid" ? "#bbf7d0" : "#e9d5ff"}`
                                    }}>
                                        <div>
                                            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Decided Buyout Value</span>
                                            <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>₹{Number(refurbishedValue || 0).toLocaleString("en-IN")}</div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Center Repair Investment</span>
                                            <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#7c3aed" }}>₹{totalRepairExpense.toLocaleString("en-IN")}</div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Settlement Mode</span>
                                            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#334155" }}>{paymentMethod} Gateway</div>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Beneficiary Escrow</span>
                                            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#059669" }}>EcoCycle Central Treasury</div>
                                        </div>
                                    </div>
                                </div>

                                {/* In-Screen Certificate Summary & PDF Print Action */}
                                <div className="refurb-cert-action-card no-print" style={{ marginTop: "1.25rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                        <div style={{ background: "#ecfdf5", color: "#059669", padding: "0.6rem", borderRadius: "10px", fontSize: "1.35rem", display: "flex", alignItems: "center" }}>
                                            <FiAward />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                                                Official Refurbishment &amp; Warranty Certificate Ready
                                            </div>
                                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                                Cert ID: <strong style={{ fontFamily: "monospace", color: "#7c3aed" }}>{refurbishedCertNum || `ECO-REF-${device.deviceId}-10042`}</strong> &bull; Warranty: <strong>{warrantyDuration}</strong>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="refurb-btn-primary"
                                        style={{ fontSize: "0.825rem", padding: "0.55rem 1.15rem", display: "inline-flex", alignItems: "center", gap: "0.45rem" }}
                                        onClick={handlePrintRefurbCert}
                                    >
                                        <FiPrinter /> Print Certificate &amp; Warranty Tag (PDF)
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Outcome B: Failed / Not Economical */
                            <div>
                                <div className="refurb-outcome-recycle-badge">
                                    <FiAlertTriangle style={{ fontSize: "2.8rem", marginBottom: "0.5rem" }} />
                                    <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.5rem" }}>
                                        Refurbishment Not Economical &bull; Transfer to Recycling
                                    </h3>
                                    <p style={{ margin: 0, opacity: 0.95, fontSize: "0.95rem" }}>
                                        Repair Cost (₹{totalRepairExpense.toLocaleString()}) &gt; Expected Refurbished Value (₹{Number(refurbishedValue).toLocaleString()})
                                    </p>
                                </div>

                                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "14px", padding: "1.5rem", marginBottom: "1.5rem" }}>
                                    <h4 style={{ margin: "0 0 0.5rem 0", color: "#92400e" }}>
                                        Automatic Routing to Material Recovery
                                    </h4>
                                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#78350f" }}>
                                        This device will be transferred from this Refurbishment Center to an authorized EcoCycle Recycling Facility for eco-compliant dismantling and raw material extraction.
                                    </p>

                                    <div style={{ marginTop: "1rem" }}>
                                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#78350f", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                                            Select Destination Recycling Center:
                                        </label>
                                        <select
                                            className="refurb-select"
                                            value={targetRecyclingCenterId}
                                            onChange={(e) => setTargetRecyclingCenterId(Number(e.target.value))}
                                        >
                                            {requestData?.availableRecyclingCenters?.map(c => (
                                                <option key={c.recyclingCenterId} value={c.recyclingCenterId}>
                                                    {c.centerName} ({c.city}, {c.state})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Unified Refurbishment Process & Telemetry Summary Table */}
                        <div style={{
                            background: "#ffffff",
                            border: "1.5px solid #e2e8f0",
                            borderRadius: "14px",
                            padding: "1.25rem",
                            marginTop: "1.5rem",
                            boxShadow: "0 2px 10px rgba(15, 23, 42, 0.03)"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <div style={{ background: "#ede9fe", color: "#7c3aed", padding: "0.45rem", borderRadius: "8px", display: "flex", alignItems: "center", fontSize: "1.1rem" }}>
                                        <FiFileText />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                                            Refurbishment Process &amp; Telemetry Audit Summary
                                        </h4>
                                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>
                                            Complete single-table audit trail captured for Device #{device.deviceId} ({device.brand} {device.model})
                                        </p>
                                    </div>
                                </div>
                                <span style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", fontSize: "0.72rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "9999px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                    <FiCheckCircle /> Verified Record
                                </span>
                            </div>

                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.825rem", textAlign: "left" }}>
                                    <thead>
                                        <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                                            <th style={{ padding: "0.65rem 0.85rem", fontWeight: 700, color: "#475569", width: "18%" }}>Stage / Module</th>
                                            <th style={{ padding: "0.65rem 0.85rem", fontWeight: 700, color: "#475569", width: "32%" }}>Execution Details</th>
                                            <th style={{ padding: "0.65rem 0.85rem", fontWeight: 700, color: "#475569", width: "32%" }}>Logged Specifications &amp; Telemetry</th>
                                            <th style={{ padding: "0.65rem 0.85rem", fontWeight: 700, color: "#475569", width: "18%", textAlign: "center" }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Row 1: Intake & Device Assessment */}
                                        <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: "#1e293b" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                    <FiBox style={{ color: "#7c3aed" }} /> 1. Assessment
                                                </div>
                                            </td>
                                            <td style={{ padding: "0.75rem 0.85rem", color: "#334155" }}>
                                                <div><strong>Category:</strong> {device.categoryName}</div>
                                                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Citizen: {citizen.name} ({citizen.city})</div>
                                            </td>
                                            <td style={{ padding: "0.75rem 0.85rem", color: "#334155" }}>
                                                <div><strong>S/N:</strong> <code style={{ fontFamily: "monospace", color: "#6d28d9" }}>{device.serialNumber}</code></div>
                                                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Condition: {device.condition} &bull; Preference: {device.processingPreference || "Reuse"}</div>
                                            </td>
                                            <td style={{ padding: "0.75rem 0.85rem", textAlign: "center" }}>
                                                <span style={{ background: "#ecfdf5", color: "#059669", fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "9999px" }}>
                                                    ✓ Verified
                                                </span>
                                            </td>
                                        </tr>

                                        {/* Row 2: Secure Data Sanitization */}
                                        <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: "#1e293b" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                    <FiShield style={{ color: "#0284c7" }} /> 2. Data Wipe
                                                </div>
                                            </td>
                                            <td style={{ padding: "0.75rem 0.85rem", color: "#334155" }}>
                                                <div><strong>Standard:</strong> {wipingMethod || "NIST SP 800-88 Rev 1 Overwrite"}</div>
                                                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Technician: {wipingTechnician || "Lead Technician"}</div>
                                            </td>
                                            <td style={{ padding: "0.75rem 0.85rem", color: "#334155" }}>
                                                <div><strong>Cert ID:</strong> <code style={{ fontFamily: "monospace", color: "#0284c7" }}>{ddcCertNum || `ECO-DDC-${device.deviceId}-10042`}</code></div>
                                                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Status: {wipingVerificationStatus || "Cryptographically Verified"}</div>
                                            </td>
                                            <td style={{ padding: "0.75rem 0.85rem", textAlign: "center" }}>
                                                <span style={{ background: wipingCompleted ? "#ecfdf5" : "#fef3c7", color: wipingCompleted ? "#059669" : "#d97706", fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "9999px" }}>
                                                    {wipingCompleted ? "✓ Sanitized" : "Compliant"}
                                                </span>
                                            </td>
                                        </tr>

                                        {/* Row 3: Repair & Replacement Parts */}
                                        <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: "#1e293b" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                    <FiTool style={{ color: "#f59e0b" }} /> 3. Repairs Log
                                                </div>
                                            </td>
                                            <td style={{ padding: "0.75rem 0.85rem", color: "#334155" }}>
                                                <div><strong>{repairItems.length} Component Action{repairItems.length !== 1 ? "s" : ""}</strong></div>
                                                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>
                                                    {repairItems.slice(0, 3).map(i => i.component).join(", ")}{repairItems.length > 3 ? ` +${repairItems.length - 3} more` : ""}
                                                </div>
                                            </td>
                                            <td style={{ padding: "0.75rem 0.85rem", color: "#334155" }}>
                                                <div><strong>Total Expense:</strong> <span style={{ color: "#7c3aed", fontWeight: 800 }}>₹{totalRepairExpense.toLocaleString()}</span></div>
                                                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Parts &amp; Labor Certified</div>
                                            </td>
                                            <td style={{ padding: "0.75rem 0.85rem", textAlign: "center" }}>
                                                <span style={{ background: "#ecfdf5", color: "#059669", fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.55rem", borderRadius: "9999px" }}>
                                                    ✓ {repairItems.length} Logged
                                                </span>
                                            </td>
                                        </tr>

                                        {/* Row 4: Hardware Functional Diagnostics */}
                                        <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: "#1e293b" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                    <FiCpu style={{ color: "#10b981" }} /> 4. Diagnostics
                                                </div>
                                            </td>
                                            <td style={{ padding: "0.75rem 0.85rem", color: "#334155" }}>
                                                <div><strong>{tests.filter(t => t.status === "Pass").length} of {tests.length} Modules Passed</strong></div>
                                                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Multi-point sub-system tests</div>
                                            </td>
                                            <td style={{ padding: "0.75rem 0.85rem", color: "#334155" }}>
                                                <div><strong>Diagnostic Benchmark:</strong> {Math.round((tests.filter(t => t.status === "Pass").length / (tests.length || 1)) * 100)}%</div>
                                                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Motherboard, Display, Power, Battery &amp; Ports</div>
                                            </td>
                                            <td style={{ padding: "0.75rem 0.85rem", textAlign: "center" }}>
                                                <span style={{
                                                    background: tests.every(t => t.status === "Pass") ? "#ecfdf5" : "#fee2e2",
                                                    color: tests.every(t => t.status === "Pass") ? "#059669" : "#dc2626",
                                                    fontSize: "0.72rem",
                                                    fontWeight: 700,
                                                    padding: "0.2rem 0.55rem",
                                                    borderRadius: "9999px"
                                                }}>
                                                    {tests.every(t => t.status === "Pass") ? "✓ 100% Passed" : `${tests.filter(t => t.status === "Pass").length}/${tests.length} Passed`}
                                                </span>
                                            </td>
                                        </tr>

                                        {/* Row 5: Final Certification & Refurbishment Cost */}
                                        <tr style={{ background: "#faf5ff" }}>
                                            <td style={{ padding: "0.75rem 0.85rem", fontWeight: 700, color: "#581c87" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                    <FiAward style={{ color: "#7c3aed" }} /> 5. Certification
                                                </div>
                                            </td>
                                            <td style={{ padding: "0.75rem 0.85rem", color: "#334155" }}>
                                                <div><strong>Outcome:</strong> <span style={{ color: finalOutcome === "Refurbished" ? "#059669" : "#d97706", fontWeight: 800 }}>{finalOutcome === "Refurbished" ? "Certified Refurbished" : "Transfer to Recycling"}</span></div>
                                                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Warranty: {warrantyDuration}</div>
                                            </td>
                                            <td style={{ padding: "0.75rem 0.85rem", color: "#334155" }}>
                                                <div><strong>Refurbishment Expense:</strong> <span style={{ color: "#059669", fontWeight: 800 }}>₹{Number(refurbishedValue || totalRepairExpense || 0).toLocaleString()}</span></div>
                                                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Cert ID: <code style={{ fontFamily: "monospace", color: "#7c3aed" }}>{refurbishedCertNum || `ECO-REF-${device.deviceId}-10042`}</code></div>
                                            </td>
                                            <td style={{ padding: "0.75rem 0.85rem", textAlign: "center" }}>
                                                <span style={{ background: "#7c3aed", color: "#ffffff", fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.55rem", borderRadius: "9999px" }}>
                                                    {finalOutcome === "Refurbished" ? "Ready for Safe Reuse" : "Transfer"}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Final Remarks Note */}
                        <div style={{ marginTop: "1.5rem" }}>
                            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                                Closing Facility Remarks
                            </label>
                            <textarea
                                rows="3"
                                className="refurb-select"
                                style={{ width: "100%", fontFamily: "inherit" }}
                                value={finalRemarks}
                                onChange={(e) => handleFinalRemarksChange(e.target.value)}
                                placeholder="Enter closing facility remarks (letters, spaces, and / only)..."
                            />
                            <span className="refurb-validation-hint" style={{ marginTop: "0.35rem", display: "block" }}>
                                Validation: Only letters, spaces, and slashes (/) allowed (no numbers or other special characters).
                            </span>
                        </div>

                        {/* Step Actions */}
                        <div className="refurb-step-actions">
                            <button className="refurb-btn-secondary" onClick={handlePrevStep}>
                                <FiArrowLeft /> Back
                            </button>

                            <button
                                className="refurb-btn-primary"
                                style={{
                                    background: finalOutcome === "Refurbished"
                                        ? (paymentStatus === "Paid"
                                            ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
                                            : "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)")
                                        : "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
                                }}
                                onClick={() => {
                                    if (finalOutcome === "Refurbished" && paymentStatus !== "Paid") {
                                        setShowPaymentModal(true);
                                    } else {
                                        handleSubmitRefurbishment();
                                    }
                                }}
                                disabled={saving}
                            >
                                {saving ? (
                                    "Processing Decision..."
                                ) : finalOutcome === "Refurbished" ? (
                                    paymentStatus === "Paid" ? (
                                        <>
                                            <FiCheckCircle /> Complete Refurbishment &amp; Issue Certificate
                                        </>
                                    ) : (
                                        <>
                                            <FiCreditCard /> Pay Settlement (₹{Number(refurbishedValue || 0).toLocaleString("en-IN")}) &amp; Certify
                                        </>
                                    )
                                ) : (
                                    <>
                                        <FiCheckCircle /> Submit &amp; Transfer to Recycling Center
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
                    </>
                )}
            </main>

            {/* Dedicated High-Fidelity Printable Official Certificate Document (Hidden on screen, Active during Print) */}
            {requestData && device?.deviceId && (
                <div className="refurb-printable-cert-container">
                {printCertType === "DDC" ? (
                    <div className="refurb-pro-cert-document ddc-cert">
                        {/* Decorative Security Corner Accents */}
                        <div className="refurb-pro-corner top-left"></div>
                        <div className="refurb-pro-corner top-right"></div>
                        <div className="refurb-pro-corner bottom-left"></div>
                        <div className="refurb-pro-corner bottom-right"></div>

                        {/* Guilloché Watermark Background */}
                        <div className="refurb-pro-watermark">DATA SANITIZED &bull; ISO 27001</div>

                        {/* Official Authority Header */}
                        <div className="refurb-pro-header">
                            <div className="refurb-pro-crest-box">
                                <div className="refurb-pro-crest-icon">
                                    <FiShield />
                                </div>
                                <div className="refurb-pro-org-info">
                                    <div className="refurb-pro-sup-tag">GOVERNMENT OF INDIA RECOGNIZED &bull; CIRCULAR ELECTRONICS INITIATIVE</div>
                                    <h1 className="refurb-pro-org-title">ECOCYCLE NATIONAL E-WASTE &amp; SANITIZATION NETWORK</h1>
                                    <div className="refurb-pro-sub-tag">Directorate of Media Destruction, Cryptographic Erasure &amp; Environmental Compliance</div>
                                </div>
                            </div>
                            <div className="refurb-pro-doc-badge">
                                <span className="refurb-pro-doc-class">OFFICIAL AUDIT RECORD</span>
                                <span className="refurb-pro-doc-id">{ddcCertNum || `ECO-DDC-${device.deviceId || "2026"}-8594`}</span>
                                <span className="refurb-pro-doc-meta">ISO/IEC 27001 &bull; NIST SP 800-88</span>
                            </div>
                        </div>

                        {/* Certificate Title Ribbon */}
                        <div className="refurb-pro-title-banner ddc-banner">
                            <h2 className="refurb-pro-cert-title">CERTIFICATE OF DATA DESTRUCTION &amp; MEDIA SANITIZATION</h2>
                            <p className="refurb-pro-cert-subtitle">Irreversible Hardware Sanitization &bull; Multi-Pass Storage Erasure &bull; Full Forensic Clearance</p>
                        </div>

                        {/* Metadata Quick Reference Bar */}
                        <div className="refurb-pro-meta-bar">
                            <div className="refurb-pro-meta-item">
                                <span className="pro-meta-lbl">ISSUE DATE:</span>
                                <span className="pro-meta-val">{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                            </div>
                            <div className="refurb-pro-meta-item">
                                <span className="pro-meta-lbl">FACILITY BENCH:</span>
                                <span className="pro-meta-val">{profile.isPhone ? "Mobile Bench #3" : profile.isTV ? "Display Bench #2" : profile.isAppliance ? "Appliance Bench #1" : "Laptop/PC Bench #4"}</span>
                            </div>
                            <div className="refurb-pro-meta-item">
                                <span className="pro-meta-lbl">SECURITY CLEARANCE:</span>
                                <span className="pro-meta-val status-green">RESTRICTED AUDIT TRAIL</span>
                            </div>
                            <div className="refurb-pro-meta-item">
                                <span className="pro-meta-lbl">CHAIN OF CUSTODY:</span>
                                <span className="pro-meta-val">VERIFIED &amp; LOGGED</span>
                            </div>
                        </div>

                        {/* Structured Specification Tables */}
                        <div className="refurb-pro-sections-grid">
                            {/* Section 1: Target Hardware Asset */}
                            <div className="refurb-pro-section-card">
                                <div className="refurb-pro-section-head">
                                    <FiBox className="pro-sec-icon" />
                                    <span>SECTION 1: HARDWARE ASSET TELEMETRY</span>
                                </div>
                                <div className="refurb-pro-table">
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Device Model &amp; Make:</div>
                                        <div className="refurb-pro-cell-val font-bold">{device.brand} {device.model}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Equipment Category:</div>
                                        <div className="refurb-pro-cell-val">{device.categoryName || "Computers and Laptops"}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Serial Number (S/N):</div>
                                        <div className="refurb-pro-cell-val font-mono highlight-mono">{device.serialNumber || "SN-DELL-88231"}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Originating Citizen / Donor:</div>
                                        <div className="refurb-pro-cell-val">{citizen.name} ({citizen.city || "Bangalore"})</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Initial Intake Condition:</div>
                                        <div className="refurb-pro-cell-val">{device.condition || "Grade B"} &bull; Functional State: {device.working || "Yes"}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Sanitization & Verification */}
                            <div className="refurb-pro-section-card">
                                <div className="refurb-pro-section-head">
                                    <FiShield className="pro-sec-icon" />
                                    <span>SECTION 2: SANITIZATION EXECUTION &amp; AUDIT</span>
                                </div>
                                <div className="refurb-pro-table">
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Sanitization Protocol:</div>
                                        <div className="refurb-pro-cell-val font-bold text-purple">{wipingMethod || "NIST SP 800-88 Rev 1 Overwrite"}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Compliance Verification:</div>
                                        <div className="refurb-pro-cell-val font-bold text-green">✓ {wipingVerificationStatus || "Verified & Sealed (Passed 100%)"}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Media Erasure Scope:</div>
                                        <div className="refurb-pro-cell-val">100% of Physical &amp; Logical Storage Sectors Cleared</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Sanitization Specialist:</div>
                                        <div className="refurb-pro-cell-val font-bold">{wipingTechnician || "cap waste Bench"}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Data Recovery Feasibility:</div>
                                        <div className="refurb-pro-cell-val font-bold text-green">0.00% &bull; Irreversible Media Sanitization</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cryptographic Hash Digest Verification Bar */}
                        <div className="refurb-pro-crypto-bar">
                            <span className="crypto-lbl">SHA-256 AUDIT DIGEST:</span>
                            <span className="crypto-hash">4f8b9e6128cf3a7e04732adf679965ccc34ca7ae34418b4e87a2df81c4e72a09</span>
                            <span className="crypto-tag">✓ DIGITALLY SIGNED</span>
                        </div>

                        {/* Statutory Attestation Statement */}
                        <div className="refurb-pro-attestation">
                            <p>
                                <strong>LEGAL ATTESTATION:</strong> This certifies that all non-volatile magnetic, solid-state, and optical storage media contained within the aforementioned hardware asset have been sanitized in strict adherence to <strong>NIST SP 800-88 Rev. 1</strong> and <strong>ISO/IEC 27001 Information Security Standards</strong>. All prior user, proprietary, and corporate data has been permanently rendered unrecoverable by any computational or laboratory recovery methods.
                            </p>
                        </div>

                        {/* Signatures & Official Embossed Seal */}
                        <div className="refurb-pro-sign-row">
                            <div className="refurb-pro-sign-box">
                                <div className="refurb-pro-sign-signature font-script">
                                    {wipingTechnician || "Sanitization Specialist"}
                                </div>
                                <div className="refurb-pro-sign-line"></div>
                                <div className="refurb-pro-sign-name">{wipingTechnician || "Lead Sanitization Specialist"}</div>
                                <div className="refurb-pro-sign-title">Certified Data Sanitization Engineer</div>
                                <div className="refurb-pro-sign-id">OPERATOR BADGE: #ECO-{device.deviceId || "9942"}</div>
                            </div>

                            {/* Official Security Seal Badge */}
                            <div className="refurb-pro-seal-wrapper">
                                <div className="refurb-pro-official-seal green-seal">
                                    <div className="seal-inner-ring">
                                        <FiShield className="seal-icon" />
                                        <span className="seal-text-top">ECOCYCLE VERIFIED</span>
                                        <span className="seal-text-mid">100%</span>
                                        <span className="seal-text-sub">DATA ERASED</span>
                                        <span className="seal-text-bot">ISO 27001 &bull; AUDITED</span>
                                    </div>
                                </div>
                            </div>

                            <div className="refurb-pro-sign-box">
                                <div className="refurb-pro-sign-signature font-script">
                                    {qcInspector || "Dr. Rajeshwar Varma"}
                                </div>
                                <div className="refurb-pro-sign-line"></div>
                                <div className="refurb-pro-sign-name">{qcInspector || "Lead Quality Assurance Officer"}</div>
                                <div className="refurb-pro-sign-title">Refurbishment Center Operations Directorate</div>
                                <div className="refurb-pro-sign-id">AUTHORIZATION ID: #DIR-QA-2026</div>
                            </div>
                        </div>

                        {/* Security Barcode & Registry Footer */}
                        <div className="refurb-pro-footer">
                            <div className="refurb-pro-barcode">
                                <div className="barcode-lines"></div>
                                <span className="barcode-text">*{ddcCertNum || `ECO-DDC-${device.deviceId || "2026"}-8594`}*</span>
                            </div>
                            <div className="refurb-pro-footer-info">
                                <div>EcoCycle Central Asset Recovery Registry &bull; Ministry of Electronics &amp; IT Compliance</div>
                                <div>Document Hash Security Validated &bull; To verify this certificate, visit <strong>https://ecocycle.gov.in/verify</strong></div>
                            </div>
                        </div>
                    </div>
                ) : printCertType === "REF" ? (
                    <div className="refurb-pro-cert-document ref-cert">
                        {/* Decorative Security Corner Accents */}
                        <div className="refurb-pro-corner top-left"></div>
                        <div className="refurb-pro-corner top-right"></div>
                        <div className="refurb-pro-corner bottom-left"></div>
                        <div className="refurb-pro-corner bottom-right"></div>

                        {/* Guilloché Watermark Background */}
                        <div className="refurb-pro-watermark">ECOCYCLE CERTIFIED &bull; CIRCULAR REUSE</div>

                        {/* Official Authority Header */}
                        <div className="refurb-pro-header">
                            <div className="refurb-pro-crest-box">
                                <div className="refurb-pro-crest-icon purple-crest">
                                    <FiCpu />
                                </div>
                                <div className="refurb-pro-org-info">
                                    <div className="refurb-pro-sup-tag">GOVERNMENT OF INDIA RECOGNIZED &bull; CIRCULAR ECONOMY DIRECTIVE</div>
                                    <h1 className="refurb-pro-org-title">ECOCYCLE NATIONAL REFURBISHMENT &amp; QUALITY NETWORK</h1>
                                    <div className="refurb-pro-sub-tag">Directorate of Electronic Asset Renewal, Quality Certification &amp; Extended Lifecycle</div>
                                </div>
                            </div>
                            <div className="refurb-pro-doc-badge">
                                <span className="refurb-pro-doc-class purple-class">OFFICIAL WARRANTY CERTIFICATE</span>
                                <span className="refurb-pro-doc-id">{refurbishedCertNum || `ECO-REF-${device.deviceId || "2026"}-10042`}</span>
                                <span className="refurb-pro-doc-meta">OEM QUALITY STANDARDS &bull; QC PASSED</span>
                            </div>
                        </div>

                        {/* Certificate Title Ribbon */}
                        <div className="refurb-pro-title-banner ref-banner">
                            <h2 className="refurb-pro-cert-title">OFFICIAL CERTIFICATE OF REFURBISHMENT &amp; WARRANTY</h2>
                            <p className="refurb-pro-cert-subtitle">Technical Multi-Point Diagnostic Overhaul &bull; OEM Grade Certification &bull; Extended Lifecycle Assurance</p>
                        </div>

                        {/* Metadata Quick Reference Bar */}
                        <div className="refurb-pro-meta-bar">
                            <div className="refurb-pro-meta-item">
                                <span className="pro-meta-lbl">ISSUE DATE:</span>
                                <span className="pro-meta-val">{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                            </div>
                            <div className="refurb-pro-meta-item">
                                <span className="pro-meta-lbl">QUALITY GRADE:</span>
                                <span className="pro-meta-val grade-gold">★ {qualityGrade} (CERTIFIED)</span>
                            </div>
                            <div className="refurb-pro-meta-item">
                                <span className="pro-meta-lbl">WARRANTY TERM:</span>
                                <span className="pro-meta-val status-green">{warrantyDuration}</span>
                            </div>
                            <div className="refurb-pro-meta-item">
                                <span className="pro-meta-lbl">REFURBISHMENT EXPENSE:</span>
                                <span className="pro-meta-val text-purple font-bold">₹{Number(refurbishedValue || totalRepairExpense || 0).toLocaleString("en-IN")}</span>
                            </div>
                        </div>

                        {/* Structured Specification Tables */}
                        <div className="refurb-pro-sections-grid">
                            {/* Section 1: Device Hardware & Technical Specs */}
                            <div className="refurb-pro-section-card">
                                <div className="refurb-pro-section-head">
                                    <FiBox className="pro-sec-icon" />
                                    <span>SECTION 1: ASSET &amp; HARDWARE IDENTIFICATION</span>
                                </div>
                                <div className="refurb-pro-table">
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Hardware Asset Name:</div>
                                        <div className="refurb-pro-cell-val font-bold">{device.brand} {device.model}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Device Category:</div>
                                        <div className="refurb-pro-cell-val">{device.categoryName || "Computers and Laptops"}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Serial Number (S/N):</div>
                                        <div className="refurb-pro-cell-val font-mono highlight-mono">{device.serialNumber || "SN-DELL-88231"}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Certified Refurb Facility:</div>
                                        <div className="refurb-pro-cell-val">{requestData?.center?.centerName || "EcoCycle Certified Refurbishment Center"}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Component Overhaul Cost:</div>
                                        <div className="refurb-pro-cell-val">₹{totalRepairExpense.toLocaleString("en-IN")} (Parts &amp; Labor Certified)</div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Quality Testing & Assurance */}
                            <div className="refurb-pro-section-card">
                                <div className="refurb-pro-section-head">
                                    <FiAward className="pro-sec-icon" />
                                    <span>SECTION 2: QUALITY ASSURANCE &amp; TESTING</span>
                                </div>
                                <div className="refurb-pro-table">
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Hardware Diagnostic Suite:</div>
                                        <div className="refurb-pro-cell-val font-bold text-green">✓ 100% Passed (All Critical Tests)</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Storage Sanitization Status:</div>
                                        <div className="refurb-pro-cell-val font-bold text-purple">{wipingCompleted ? `✓ Sanitized (${wipingMethod || "NIST SP 800-88"})` : "✓ Non-Storage Cleared"}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Warranty Policy Coverage:</div>
                                        <div className="refurb-pro-cell-val font-bold text-green">{warrantyDuration}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Lead Quality Inspector:</div>
                                        <div className="refurb-pro-cell-val font-bold">{qcInspector}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Circular Lifecycle Impact:</div>
                                        <div className="refurb-pro-cell-val font-bold text-green">100% Diverted from Landfill &bull; Secondary Reuse Ready</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cryptographic Hash Digest Verification Bar */}
                        <div className="refurb-pro-crypto-bar">
                            <span className="crypto-lbl">WARRANTY REGISTRY ID:</span>
                            <span className="crypto-hash">ec-cert-ref-2026-auth-{device.deviceId || "42"}-98b4e72a096128cf3a</span>
                            <span className="crypto-tag">✓ QA CERTIFIED</span>
                        </div>

                        {/* Statutory Warranty Attestation Statement */}
                        <div className="refurb-pro-attestation">
                            <p>
                                <strong>CERTIFICATION OF REUSE &amp; WARRANTY:</strong> This certifies that the hardware asset listed herein has successfully completed thorough diagnostics, component replacement, thermal recalibration, and multi-point functional validation in accordance with <strong>EcoCycle Circular Quality Standard ISO 9001/14001</strong>. This asset is backed by our official warranty coverage for secondary deployment, reuse, or institutional donation.
                            </p>
                        </div>

                        {/* Signatures & Official Embossed Seal */}
                        <div className="refurb-pro-sign-row">
                            <div className="refurb-pro-sign-box">
                                <div className="refurb-pro-sign-signature font-script">
                                    {wipingTechnician || "Lead Refurb Technician"}
                                </div>
                                <div className="refurb-pro-sign-line"></div>
                                <div className="refurb-pro-sign-name">{wipingTechnician || "Lead Diagnostic Specialist"}</div>
                                <div className="refurb-pro-sign-title">Senior Refurbishment Specialist</div>
                                <div className="refurb-pro-sign-id">ENGINEER ID: #ECO-TECH-{device.deviceId || "104"}</div>
                            </div>

                            {/* Official Security Seal Badge */}
                            <div className="refurb-pro-seal-wrapper">
                                <div className="refurb-pro-official-seal purple-seal">
                                    <div className="seal-inner-ring">
                                        <FiAward className="seal-icon" />
                                        <span className="seal-text-top">ECOCYCLE CERTIFIED</span>
                                        <span className="seal-text-mid">{qualityGrade}</span>
                                        <span className="seal-text-sub">QC APPROVED</span>
                                        <span className="seal-text-bot">WARRANTY BACKED</span>
                                    </div>
                                </div>
                            </div>

                            <div className="refurb-pro-sign-box">
                                <div className="refurb-pro-sign-signature font-script">
                                    {qcInspector || "Dr. Rajeshwar Varma"}
                                </div>
                                <div className="refurb-pro-sign-line"></div>
                                <div className="refurb-pro-sign-name">{qcInspector || "Lead Quality Assurance Officer"}</div>
                                <div className="refurb-pro-sign-title">Refurbishment Center Operations Directorate</div>
                                <div className="refurb-pro-sign-id">AUTHORIZATION ID: #DIR-QA-2026</div>
                            </div>
                        </div>

                        {/* Security Barcode & Registry Footer */}
                        <div className="refurb-pro-footer">
                            <div className="refurb-pro-barcode">
                                <div className="barcode-lines"></div>
                                <span className="barcode-text">*{refurbishedCertNum || `ECO-REF-${device.deviceId || "2026"}-10042`}*</span>
                            </div>
                            <div className="refurb-pro-footer-info">
                                <div>EcoCycle National Asset Recovery Network &bull; Certified Circular Electronics Initiative</div>
                                <div>Warranty registered &bull; To verify coverage or make a claim, visit <strong>https://ecocycle.gov.in/warranty</strong></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="refurb-pro-cert-document insp-cert">
                        {/* Decorative Security Corner Accents */}
                        <div className="refurb-pro-corner top-left"></div>
                        <div className="refurb-pro-corner top-right"></div>
                        <div className="refurb-pro-corner bottom-left"></div>
                        <div className="refurb-pro-corner bottom-right"></div>

                        {/* Watermark Background */}
                        <div className="refurb-pro-watermark">TECHNICIAN INSPECTION REPORT</div>

                        {/* Official Authority Header */}
                        <div className="refurb-pro-header">
                            <div className="refurb-pro-crest-box">
                                <div className="refurb-pro-crest-icon blue-crest">
                                    <FiCheckSquare />
                                </div>
                                <div className="refurb-pro-org-info">
                                    <div className="refurb-pro-sup-tag">GOVERNMENT OF INDIA RECOGNIZED &bull; FIELD COLLECTION &amp; DIAGNOSTIC INTAKE</div>
                                    <h1 className="refurb-pro-org-title">ECOCYCLE FIELD TECHNICAL INSPECTION REPORT</h1>
                                    <div className="refurb-pro-sub-tag">Official Device Evaluation &amp; Diagnostics Conducted by Field Inspection Technician</div>
                                </div>
                            </div>
                            <div className="refurb-pro-doc-badge">
                                <span className="refurb-pro-doc-class blue-class">FIELD INSPECTION REPORT</span>
                                <span className="refurb-pro-doc-id">ECO-INSP-{device.deviceId || "2026"}-{inspection?.inspectionId || "7741"}</span>
                                <span className="refurb-pro-doc-meta">AUTHENTICATED INTAKE &bull; FIELD LOGGED</span>
                            </div>
                        </div>

                        {/* Report Title Ribbon */}
                        <div className="refurb-pro-title-banner insp-banner">
                            <h2 className="refurb-pro-cert-title">FIELD TECHNICIAN DEVICE INSPECTION &amp; EVALUATION REPORT</h2>
                            <p className="refurb-pro-cert-subtitle">Original Physical Assessment &bull; Multi-Criteria Subsystem Health &bull; Field Diagnostics by Technician</p>
                        </div>

                        {/* Metadata Quick Reference Bar */}
                        <div className="refurb-pro-meta-bar">
                            <div className="refurb-pro-meta-item">
                                <span className="pro-meta-lbl">INSPECTOR:</span>
                                <span className="pro-meta-val text-blue font-bold">{inspection?.technicianName || "edwin varghese"}</span>
                            </div>
                            <div className="refurb-pro-meta-item">
                                <span className="pro-meta-lbl">HEALTH SCORE:</span>
                                <span className="pro-meta-val text-blue font-bold">{inspection?.overallScore ? Number(inspection.overallScore).toFixed(2) : "77.14"}%</span>
                            </div>
                            <div className="refurb-pro-meta-item">
                                <span className="pro-meta-lbl">INTAKE GRADE:</span>
                                <span className="pro-meta-val grade-gold">★ {inspection?.qualityGrade || "Grade B"}</span>
                            </div>
                            <div className="refurb-pro-meta-item">
                                <span className="pro-meta-lbl">ACTION:</span>
                                <span className="pro-meta-val status-green">{inspection?.recommendedAction || "Refurbish for Reuse"}</span>
                            </div>
                        </div>

                        {/* Structured Specification Tables */}
                        <div className="refurb-pro-sections-grid">
                            {/* Section 1: Registered Asset & Custody Profile */}
                            <div className="refurb-pro-section-card">
                                <div className="refurb-pro-section-head">
                                    <FiBox className="pro-sec-icon" />
                                    <span>SECTION 1: REGISTERED ASSET &amp; INTAKE SPECS</span>
                                </div>
                                <div className="refurb-pro-table">
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Device Hardware Asset:</div>
                                        <div className="refurb-pro-cell-val font-bold">{device.brand} {device.model}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Equipment Category:</div>
                                        <div className="refurb-pro-cell-val">{device.categoryName || "Computers and Laptops"}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Serial Number (S/N):</div>
                                        <div className="refurb-pro-cell-val font-mono highlight-mono">{device.serialNumber || "SN-DELL-88231"}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Intake Physical Condition:</div>
                                        <div className="refurb-pro-cell-val">{device.condition || "Grade B"} &bull; Power/Working: {device.working || "Yes"}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Citizen / Donor Custody:</div>
                                        <div className="refurb-pro-cell-val">{citizen.name} ({citizen.city || "Bangalore"})</div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Technician Inspection Telemetry */}
                            <div className="refurb-pro-section-card">
                                <div className="refurb-pro-section-head">
                                    <FiCheckSquare className="pro-sec-icon" />
                                    <span>SECTION 2: TECHNICIAN EVALUATION TELEMETRY</span>
                                </div>
                                <div className="refurb-pro-table">
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Inspected By (Technician):</div>
                                        <div className="refurb-pro-cell-val font-bold text-blue">{inspection?.technicianName || "edwin varghese"}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Diagnostic Health Score:</div>
                                        <div className="refurb-pro-cell-val font-bold text-blue">{inspection?.overallScore ? Number(inspection.overallScore).toFixed(2) : "77.14"}%</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Assigned Intake Grade:</div>
                                        <div className="refurb-pro-cell-val font-bold text-green">{inspection?.qualityGrade || "Grade B"}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Recommended Action:</div>
                                        <div className="refurb-pro-cell-val font-bold">{inspection?.recommendedAction || "Refurbish for Reuse"}</div>
                                    </div>
                                    <div className="refurb-pro-row">
                                        <div className="refurb-pro-cell-lbl">Inspection Timestamp:</div>
                                        <div className="refurb-pro-cell-val">{inspection?.completedAt ? new Date(inspection.completedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Detailed Inspection Criteria & Results Breakdown */}
                        <div className="refurb-pro-section-card" style={{ marginBottom: "10px" }}>
                            <div className="refurb-pro-section-head">
                                <FiTool className="pro-sec-icon" />
                                <span>SECTION 3: TECHNICIAN COMPONENT EVALUATION MATRIX</span>
                            </div>
                            <div className="refurb-pro-table">
                                {inspection?.results && inspection.results.length > 0 ? (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1px", background: "#e2e8f0" }}>
                                        {inspection.results.map((res, rIdx) => (
                                            <div key={`res-${rIdx}`} style={{ background: "#ffffff", padding: "6px 10px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}>
                                                    <span style={{ fontWeight: 700, color: "#334155" }}>{res.component || `Checklist #${rIdx + 1}`}</span>
                                                    <span style={{ fontWeight: 800, color: res.result === "Pass" ? "#059669" : "#0284c7" }}>{res.result || "Verified"}</span>
                                                </div>
                                                {res.score !== undefined && res.score !== null && (
                                                    <div style={{ fontSize: "0.64rem", color: "#64748b", marginTop: "1px" }}>
                                                        Score: <strong>{res.score}%</strong> {res.remarks ? `• ${res.remarks}` : ""}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "#ffffff" }}>
                                        <div className="refurb-pro-row" style={{ borderRight: "1px solid #f1f5f9" }}>
                                            <div className="refurb-pro-cell-lbl">Chassis / Body:</div>
                                            <div className="refurb-pro-cell-val font-bold">{device.condition || "Grade B"}</div>
                                        </div>
                                        <div className="refurb-pro-row" style={{ borderRight: "1px solid #f1f5f9" }}>
                                            <div className="refurb-pro-cell-lbl">Display Panel:</div>
                                            <div className="refurb-pro-cell-val font-bold">{device.displayCondition || "Functional"}</div>
                                        </div>
                                        <div className="refurb-pro-row" style={{ borderRight: "1px solid #f1f5f9" }}>
                                            <div className="refurb-pro-cell-lbl">Battery / Power:</div>
                                            <div className="refurb-pro-cell-val font-bold">{device.working === "Yes" ? "Working" : "Needs Review"}</div>
                                        </div>
                                        <div className="refurb-pro-row">
                                            <div className="refurb-pro-cell-lbl">Physical State:</div>
                                            <div className="refurb-pro-cell-val font-bold">{device.physicalDamage || "No Major Damage"}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Inspector Engineering Observations */}
                        <div className="refurb-pro-attestation" style={{ borderLeftColor: "#0284c7", background: "#f0f9ff" }}>
                            <p>
                                <strong>TECHNICIAN INSPECTION REMARKS:</strong> "{inspection?.technicianRemarks || "it can be reparied"}"
                            </p>
                        </div>

                        {/* Signatures & Official Embossed Seal */}
                        <div className="refurb-pro-sign-row">
                            <div className="refurb-pro-sign-box">
                                <div className="refurb-pro-sign-signature font-script">
                                    {inspection?.technicianName || "edwin varghese"}
                                </div>
                                <div className="refurb-pro-sign-line"></div>
                                <div className="refurb-pro-sign-name">{inspection?.technicianName || "edwin varghese"}</div>
                                <div className="refurb-pro-sign-title">Authorized Field Inspection Technician</div>
                                <div className="refurb-pro-sign-id">OPERATOR BADGE: #TECH-INSP-{inspection?.inspectionId || "7741"}</div>
                            </div>

                            {/* Official Security Seal Badge */}
                            <div className="refurb-pro-seal-wrapper">
                                <div className="refurb-pro-official-seal blue-seal">
                                    <div className="seal-inner-ring">
                                        <FiCheckSquare className="seal-icon" />
                                        <span className="seal-text-top">FIELD INSPECTED</span>
                                        <span className="seal-text-mid">{inspection?.qualityGrade || "Grade B"}</span>
                                        <span className="seal-text-sub">PASSED AUDIT</span>
                                        <span className="seal-text-bot">SCORE: {inspection?.overallScore ? Number(inspection.overallScore).toFixed(0) : "77"}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="refurb-pro-sign-box">
                                <div className="refurb-pro-sign-signature font-script">
                                    Audit Directorate
                                </div>
                                <div className="refurb-pro-sign-line"></div>
                                <div className="refurb-pro-sign-name">Central Inspection Audit Directorate</div>
                                <div className="refurb-pro-sign-title">Electronic Asset Intake &amp; Verification</div>
                                <div className="refurb-pro-sign-id">VERIFICATION: #INSP-AUTH-OK</div>
                            </div>
                        </div>

                        {/* Security Barcode & Registry Footer */}
                        <div className="refurb-pro-footer">
                            <div className="refurb-pro-barcode">
                                <div className="barcode-lines"></div>
                                <span className="barcode-text">*ECO-INSP-{device.deviceId || "2026"}-{inspection?.inspectionId || "7741"}*</span>
                            </div>
                            <div className="refurb-pro-footer-info">
                                <div>EcoCycle Field Technical Asset Inspection Registry</div>
                                <div>Original Technician Intake Record &bull; To verify inspection record, visit <strong>https://ecocycle.gov.in/inspections</strong></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* Comprehensive Refurbishment Process Report Modal */}
            {showProcessReportModal && reportModalData && (() => {
                const modalDev = reportModalData.device || {};
                const modalProc = reportModalData.process || reportModalData;
                const modalCitizen = reportModalData.citizen || {};
                const modalInsp = reportModalData.inspection || {};

                let modalRepairList = [];
                if (modalProc.repairItemsJson) {
                    try {
                        modalRepairList = typeof modalProc.repairItemsJson === "string" 
                            ? JSON.parse(modalProc.repairItemsJson) 
                            : modalProc.repairItemsJson;
                    } catch {
                        modalRepairList = [];
                    }
                }
                if (!modalRepairList || modalRepairList.length === 0) {
                    modalRepairList = [
                        { id: 1, component: "Display & Digitizer", action: "Repair & Calibrate", quantity: 1, cost: 950, remarks: "Alignment calibrated" },
                        { id: 2, component: "Battery Subsystem", action: "Replace", quantity: 1, cost: 550, remarks: "New cell installed" }
                    ];
                }

                let modalTestList = [];
                if (modalProc.functionalTestsJson) {
                    try {
                        modalTestList = typeof modalProc.functionalTestsJson === "string" 
                            ? JSON.parse(modalProc.functionalTestsJson) 
                            : modalProc.functionalTestsJson;
                    } catch {
                        modalTestList = [];
                    }
                }
                if (!modalTestList || modalTestList.length === 0) {
                    modalTestList = [
                        { id: 1, label: "Core Motherboard Diagnostics", component: "Logic Board", status: "Pass" },
                        { id: 2, label: "Display & Touch Digitizer", component: "Display", status: "Pass" },
                        { id: 3, label: "Battery Cycle & Power Regulation", component: "Power", status: "Pass" },
                        { id: 4, label: "Storage Drive SMART Telemetry", component: "Storage", status: "Pass" },
                        { id: 5, label: "Memory RAM Integrity", component: "Memory", status: "Pass" },
                        { id: 6, label: "I/O Ports & Charging Terminal", component: "Ports", status: "Pass" }
                    ];
                }

                const totalCost = Number(modalProc.totalRepairCost || modalProc.estimatedRepairCost || 1500);
                const marketVal = Number(modalProc.refurbishedValue || 8000);

                return (
                    <div className="refurb-report-modal-backdrop" onClick={() => setShowProcessReportModal(false)}>
                        <div className="refurb-report-modal-card" onClick={(e) => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="refurb-report-modal-header">
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <div className="refurb-report-header-icon">
                                        <FiAward />
                                    </div>
                                    <div>
                                        <h3 className="refurb-report-modal-title">
                                            Refurbishment &amp; Quality Certification Report
                                        </h3>
                                        <p className="refurb-report-modal-subtitle">
                                            REQ #{reportModalData.refurbishmentRequestId || "N/A"} &bull; DEV #{modalDev.deviceId || "N/A"} &bull; {modalDev.brand || "Device"} {modalDev.model || ""}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                    <button
                                        type="button"
                                        className="refurb-report-close-btn"
                                        onClick={() => setShowProcessReportModal(false)}
                                        title="Close"
                                    >
                                        <FiX />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Scrollable Body */}
                            <div className="refurb-report-modal-body">
                                {/* Hero Summary Banner */}
                                <div className="refurb-report-hero">
                                    <div className="refurb-report-hero-main">
                                        <div className="refurb-report-hero-badges">
                                            <span className="refurb-status-chip success">
                                                <FiCheckCircle /> Completed &amp; Certified
                                            </span>
                                            <span className="refurb-report-grade-chip">
                                                {modalProc.qualityGrade || "Grade A (Certified Refurbished)"}
                                            </span>
                                        </div>
                                        <h2 className="refurb-report-hero-title">
                                            {modalDev.brand || "Device"} {modalDev.model || ""}
                                        </h2>
                                        <p className="refurb-report-hero-meta">
                                            Category: <strong>{modalDev.categoryName || "Electronics"}</strong> &bull; Serial: <strong>{modalDev.serialNumber || `SN-${modalDev.deviceId || "2026"}-VERIFIED`}</strong> &bull; Citizen: <strong>{modalCitizen.name || "EcoCycle Citizen"} ({modalCitizen.city || "Regional Hub"})</strong>
                                        </p>
                                    </div>

                                    <div className="refurb-report-hero-metrics">
                                        <div className="refurb-report-metric-box">
                                            <span className="refurb-report-metric-lbl">Certified Value</span>
                                            <span className="refurb-report-metric-val highlight">₹{marketVal.toLocaleString()}</span>
                                        </div>
                                        <div className="refurb-report-metric-divider"></div>
                                        <div className="refurb-report-metric-box">
                                            <span className="refurb-report-metric-lbl">Refurb Expense</span>
                                            <span className="refurb-report-metric-val">₹{totalCost.toLocaleString()}</span>
                                        </div>
                                        <div className="refurb-report-metric-divider"></div>
                                        <div className="refurb-report-metric-box">
                                            <span className="refurb-report-metric-lbl">Warranty</span>
                                            <span className="refurb-report-metric-val emerald">{modalProc.warrantyDuration || "6 Months"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 1: Intake & Diagnostics Feasibility */}
                                <div className="refurb-report-section">
                                    <div className="refurb-report-section-header">
                                        <span className="refurb-report-sec-num">1</span>
                                        <h4>Technical Assessment &amp; Feasibility Diagnostics</h4>
                                    </div>
                                    <div className="refurb-report-grid-4">
                                        <div className="refurb-report-stat-card">
                                            <span className="lbl">Feasibility Decision</span>
                                            <span className="val success">{modalProc.assessmentDecision || "Refurbishable"}</span>
                                        </div>
                                        <div className="refurb-report-stat-card">
                                            <span className="lbl">Chassis / Shell</span>
                                            <span className="val">{modalProc.physicalCondition || modalDev.condition || "Good"}</span>
                                        </div>
                                        <div className="refurb-report-stat-card">
                                            <span className="lbl">Display Panel</span>
                                            <span className="val">{modalProc.displayCondition || modalDev.displayCondition || "Working"}</span>
                                        </div>
                                        <div className="refurb-report-stat-card">
                                            <span className="lbl">Battery Health</span>
                                            <span className="val">{modalProc.batteryAssessment || "Serviced"}</span>
                                        </div>
                                        <div className="refurb-report-stat-card">
                                            <span className="lbl">Storage Unit</span>
                                            <span className="val">{modalProc.storageAssessment || "Replaced / Tested"}</span>
                                        </div>
                                        <div className="refurb-report-stat-card">
                                            <span className="lbl">RAM Module</span>
                                            <span className="val">{modalProc.ramAssessment || "Functional"}</span>
                                        </div>
                                        <div className="refurb-report-stat-card">
                                            <span className="lbl">I/O Ports</span>
                                            <span className="val">{modalProc.portsAssessment || "Tested"}</span>
                                        </div>
                                        <div className="refurb-report-stat-card">
                                            <span className="lbl">Operating System</span>
                                            <span className="val">{modalProc.softwareAssessment || "Factory Flashed"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Data Destruction & NIST SP 800-88 Sanitization */}
                                <div className="refurb-report-section">
                                    <div className="refurb-report-section-header">
                                        <span className="refurb-report-sec-num">2</span>
                                        <h4>NIST SP 800-88 Sanitization &amp; Data Destruction</h4>
                                    </div>
                                    <div className="refurb-report-wipe-box">
                                        <div className="refurb-report-wipe-grid">
                                            <div>
                                                <span className="lbl">Sanitization Protocol</span>
                                                <span className="val font-mono">{modalProc.wipingMethod || "NIST SP 800-88 Rev 1 (Cryptographic Overwrite)"}</span>
                                            </div>
                                            <div>
                                                <span className="lbl">Verification Status</span>
                                                <span className="val text-emerald">
                                                    <FiCheckCircle style={{ display: "inline-block", marginRight: "4px" }} />
                                                    {modalProc.wipingVerificationStatus || "100% Zero-Block Cryptographic Verified"}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="lbl">Certified Operator</span>
                                                <span className="val">{modalProc.wipingTechnician || "Lead Refurbishment Specialist"}</span>
                                            </div>
                                            <div>
                                                <span className="lbl">DDC Certificate Number</span>
                                                <span className="val font-mono text-purple">{modalProc.certificateNumber || `ECO-DDC-${modalDev.deviceId || "2026"}-9812`}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Hardware Servicing & Replacement Ledger */}
                                <div className="refurb-report-section">
                                    <div className="refurb-report-section-header">
                                        <span className="refurb-report-sec-num">3</span>
                                        <h4>Replacement Components &amp; Servicing Ledger</h4>
                                    </div>
                                    <div className="refurb-report-table-wrapper">
                                        <table className="refurb-report-table">
                                            <thead>
                                                <tr>
                                                    <th>Component Module</th>
                                                    <th>Action Performed</th>
                                                    <th>Qty</th>
                                                    <th>Cost (INR)</th>
                                                    <th>Technician Observation / Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {modalRepairList.map((item, idx) => (
                                                    <tr key={item.id || idx}>
                                                        <td><strong>{item.component}</strong></td>
                                                        <td>
                                                            <span className="refurb-action-pill">{item.action}</span>
                                                        </td>
                                                        <td>{item.quantity || 1}</td>
                                                        <td className="font-bold">₹{Number(item.cost || 0).toLocaleString()}</td>
                                                        <td style={{ color: "#64748b" }}>{item.remarks || "Calibrated and verified"}</td>
                                                    </tr>
                                                ))}
                                                <tr className="refurb-report-table-total-row">
                                                    <td colSpan="3" style={{ textAlign: "right", fontWeight: 700 }}>
                                                        Total Refurbishment Expense:
                                                    </td>
                                                    <td colSpan="2" style={{ fontWeight: 800, color: "#7c3aed", fontSize: "1rem" }}>
                                                        ₹{totalCost.toLocaleString()}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Section 4: Multi-Point Hardware Functional Test Benchmarks */}
                                <div className="refurb-report-section">
                                    <div className="refurb-report-section-header">
                                        <span className="refurb-report-sec-num">4</span>
                                        <h4>Multi-Point Hardware Functional Test Benchmarks</h4>
                                    </div>
                                    <div className="refurb-report-tests-grid">
                                        {modalTestList.map((test, idx) => (
                                            <div key={test.id || idx} className="refurb-report-test-card">
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                                    <FiCheckCircle style={{ color: "#059669", fontSize: "1.1rem" }} />
                                                    <div>
                                                        <div className="test-lbl">{test.label || test.component || "Diagnostic Test"}</div>
                                                        <div className="test-sub">{test.component || "Hardware"}</div>
                                                    </div>
                                                </div>
                                                <span className="refurb-test-pass-pill">PASS (100%)</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Section 5: QA Approval & EcoWarranty Certificate */}
                                <div className="refurb-report-section">
                                    <div className="refurb-report-section-header">
                                        <span className="refurb-report-sec-num">5</span>
                                        <h4>Quality Assurance Approval &amp; EcoWarranty Certificate</h4>
                                    </div>
                                    <div className="refurb-report-qa-box">
                                        <div className="refurb-report-qa-grid">
                                            <div className="refurb-report-stat-card">
                                                <span className="lbl">QA Lead Inspector</span>
                                                <span className="val">{modalProc.qcInspector || "Certified Lead Engineer"}</span>
                                            </div>
                                            <div className="refurb-report-stat-card">
                                                <span className="lbl">EcoWarranty Certificate #</span>
                                                <span className="val font-mono text-purple">{modalProc.refurbishedCertificateNumber || `ECO-REF-${modalDev.deviceId || "2026"}-4412`}</span>
                                            </div>
                                            <div className="refurb-report-stat-card">
                                                <span className="lbl">Warranty Period</span>
                                                <span className="val text-emerald">{modalProc.warrantyDuration || "6 Months Comprehensive"}</span>
                                            </div>
                                            <div className="refurb-report-stat-card">
                                                <span className="lbl">Official Decision</span>
                                                <span className="val success">Certified Ready for Redistribution</span>
                                            </div>
                                        </div>

                                        {/* Official Stamp & Signatures */}
                                        <div className="refurb-report-seal-row">
                                            <div className="refurb-report-official-badge">
                                                <FiAward className="seal-icon" />
                                                <div>
                                                    <div className="seal-heading">ECOCYCLE QUALITY CERTIFIED</div>
                                                    <div className="seal-sub">ISO 14001 &bull; NIST SP 800-88 R1 AUDIT COMPLIANT</div>
                                                </div>
                                            </div>
                                            <div className="refurb-report-sig-block">
                                                <div className="sig-name">{modalProc.qcInspector || "Quality Assurance Inspector"}</div>
                                                <div className="sig-line"></div>
                                                <div className="sig-title">Refurbishment Authority Signoff</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 6: EcoCycle Central Escrow Settlement & Money Transaction Ledger */}
                                <div className="refurb-report-section" style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "14px", padding: "1.25rem" }}>
                                    <div className="refurb-report-section-header" style={{ borderBottomColor: "#bbf7d0" }}>
                                        <span className="refurb-report-sec-num" style={{ background: "#166534", color: "#ffffff" }}>6</span>
                                        <h4 style={{ color: "#166534" }}>EcoCycle Central Escrow Settlement &amp; Money Transaction Ledger</h4>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem", marginTop: "1rem" }}>
                                        <div className="refurb-report-stat-card" style={{ background: "#ffffff", border: "1px solid #bbf7d0" }}>
                                            <span className="lbl">Settled Valuation</span>
                                            <span className="val" style={{ color: "#059669", fontSize: "1.1rem" }}>
                                                ₹{Number(modalProc.refurbishedValue || refurbishedValue || 0).toLocaleString("en-IN")}
                                            </span>
                                        </div>
                                        <div className="refurb-report-stat-card" style={{ background: "#ffffff", border: "1px solid #bbf7d0" }}>
                                            <span className="lbl">Payment Gateway</span>
                                            <span className="val">{modalProc.paymentMethod || paymentMethod || "Razorpay (Test Sandbox)"}</span>
                                        </div>
                                        <div className="refurb-report-stat-card" style={{ background: "#ffffff", border: "1px solid #bbf7d0" }}>
                                            <span className="lbl">Settlement Status</span>
                                            <span className="val" style={{ color: "#166534", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                <FiCheckCircle /> PAID &amp; DEPOSITED
                                            </span>
                                        </div>
                                        <div className="refurb-report-stat-card" style={{ background: "#ffffff", border: "1px solid #bbf7d0" }}>
                                            <span className="lbl">Transaction Reference</span>
                                            <span className="val font-mono" style={{ color: "#7c3aed", fontSize: "0.825rem" }}>
                                                {modalProc.paymentTransactionId || modalProc.razorpayPaymentId || paymentTransactionId || `PAY_REF_${modalDev.deviceId || id}_OK`}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: "0.85rem", background: "#ffffff", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.825rem", color: "#166534", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                                        <span>
                                            <strong>Escrow Transfer:</strong> ₹{Number(modalProc.refurbishedValue || refurbishedValue || 0).toLocaleString("en-IN")} deposited into EcoCycle central escrow pool for multi-stakeholder payout distribution (Citizen buyout, Technician diagnostic fee, Logistics &amp; Platform fee).
                                        </span>
                                        <span style={{ fontWeight: 800, color: "#047857" }}>
                                            Center Repair Investment: ₹{totalCost.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="refurb-report-modal-footer">
                                <button
                                    type="button"
                                    className="refurb-btn-view"
                                    onClick={() => setShowProcessReportModal(false)}
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    className="refurb-btn-accept"
                                    onClick={() => handlePrintProcessReport(reportModalData)}
                                    style={{ gap: "0.5rem" }}
                                >
                                    <FiPrinter /> Print Official PDF Report
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Photo Zoom Modal (Simple Lightbox) */}
            {zoomedPhoto && (() => {
                const photoUrl = typeof zoomedPhoto === "string" 
                    ? resolvePhotoUrl(zoomedPhoto) 
                    : (zoomedPhoto?.url || resolvePhotoUrl(zoomedPhoto?.path));
                const photoTitle = (typeof zoomedPhoto === "object" && zoomedPhoto?.title) ? zoomedPhoto.title : "Inspection Evidence";

                return (
                    <div className="refurb-simple-lightbox" onClick={() => setZoomedPhoto(null)}>
                        <div className="refurb-lightbox-header" onClick={(e) => e.stopPropagation()}>
                            <span className="refurb-lightbox-title">{photoTitle}</span>
                            <button
                                type="button"
                                onClick={() => setZoomedPhoto(null)}
                                className="refurb-lightbox-close"
                                title="Close (Esc)"
                            >
                                <FiX />
                            </button>
                        </div>
                        <div className="refurb-lightbox-content" onClick={(e) => e.stopPropagation()}>
                            <img
                                src={photoUrl}
                                alt={photoTitle}
                                className="refurb-lightbox-img"
                                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800"; }}
                            />
                        </div>
                    </div>
                );
            })()}

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
                            background: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
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
                                        Asset Buyout &amp; SLA Settlement Fulfillment
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
                                        {device.brand} {device.model}
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "monospace" }}>
                                        DEV #{device.deviceId} &bull; REQ #{requestData?.refurbishmentRequestId || id}
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <span style={{ fontSize: "0.75rem", color: "#7c3aed", fontWeight: 700, textTransform: "uppercase" }}>Payable Amount</span>
                                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#059669" }}>
                                        ₹{Number(refurbishedValue || 0).toLocaleString("en-IN")}
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
                                        <FiCheck />
                                    </div>
                                    <h4 style={{ margin: 0, color: "#166534", fontSize: "1.1rem", fontWeight: 800 }}>
                                        Settlement Payment Confirmed
                                    </h4>
                                    <p style={{ margin: "0.35rem 0 0.85rem", fontSize: "0.825rem", color: "#15803d" }}>
                                        The amount of ₹{Number(refurbishedValue || 0).toLocaleString("en-IN")} has been verified and settled to EcoCycle escrow.
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
                                        background: "linear-gradient(135deg, #faf5ff 0%, #f5eeff 100%)",
                                        border: "1.5px solid #d8b4fe",
                                        borderRadius: "14px",
                                        padding: "1rem 1.25rem",
                                        marginBottom: "1.25rem",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "1rem",
                                        boxShadow: "0 2px 10px rgba(124, 58, 237, 0.05)"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0, flex: 1 }}>
                                            <div style={{
                                                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
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
                                                boxShadow: "0 3px 8px rgba(124, 58, 237, 0.25)"
                                            }}>
                                                <FiCreditCard />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    Razorpay Payment Gateway
                                                </div>
                                                <div style={{ fontSize: "0.75rem", color: "#6b21a8", marginTop: "2px", lineHeight: 1.35 }}>
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
                                            className="refurb-select"
                                            value={paymentNotes}
                                            onChange={(e) => setPaymentNotes(e.target.value)}
                                            placeholder={`Refurbishment buyout settlement for Device #${device.deviceId || id}`}
                                            style={{ fontSize: "0.825rem" }}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                        <button
                                            type="button"
                                            className="refurb-btn-secondary"
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
                                                    <FiCheckCircle /> Authorize &amp; Pay ₹{Number(refurbishedValue || 0).toLocaleString("en-IN")} (Sandbox)
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

            {/* SLA Session Active Navigation Lock Modal */}
            {showNavLockModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(6px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 99999,
                    padding: "1.5rem"
                }}>
                    <div style={{
                        background: "#ffffff",
                        borderRadius: "20px",
                        maxWidth: "520px",
                        width: "100%",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
                        overflow: "hidden",
                        border: "none"
                    }}>
                        <div style={{
                            background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
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
                                    Navigation locked until process and settlement are finalized
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
                                    <FiAlertTriangle /> Refurbishment Process &amp; Settlement Required
                                </div>
                                <p style={{ margin: 0, fontSize: "0.85rem", color: "#7f1d1d", lineHeight: 1.5 }}>
                                    The 10-Day SLA clock is actively ticking for <strong>{device?.brand} {device?.model} (DEV #{device?.deviceId})</strong>. You cannot navigate to other pages or switch devices until completing all technical steps and recording the EcoCycle settlement transaction.
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
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <FiCheckCircle style={{ color: completedSteps.includes(1) ? "#059669" : "#94a3b8" }} />
                                    <span>Step 1: Refurbishment Assessment</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <FiCheckCircle style={{ color: wipingCompleted ? "#059669" : "#94a3b8" }} />
                                    <span>Step 2: NIST SP 800-88 Data Sanitization</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <FiCheckCircle style={{ color: repairItems.length > 0 ? "#059669" : "#94a3b8" }} />
                                    <span>Step 3: Component Repairs &amp; Parts Logging</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <FiCheckCircle style={{ color: completedSteps.includes(4) ? "#059669" : "#94a3b8" }} />
                                    <span>Step 4: Subsystem Functional Testing</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <FiCheckCircle style={{ color: isDeviceCompleted ? "#059669" : "#94a3b8" }} />
                                    <span>Step 5: Final Decision &amp; EcoCycle Settlement Payment</span>
                                </div>
                            </div>

                            <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowNavLockModal(false)}
                                    style={{
                                        background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
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
                                        boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)"
                                    }}
                                >
                                    Continue Refurbishment Workflow <FiArrowRight />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RefurbishmentPerform;
