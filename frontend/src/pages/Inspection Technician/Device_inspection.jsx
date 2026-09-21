import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiSearch,
    FiBell,
    FiLogOut,
    FiCheckCircle,
    FiX,
    FiFilter,
    FiCpu,
    FiClock,
    FiAlertCircle,
    FiAlertTriangle,
    FiCheckSquare,
    FiActivity,
    FiGrid,
    FiList,
    FiRefreshCw,
    FiSmartphone,
    FiFileText,
    FiTruck,
    FiMaximize2,
    FiShield,
    FiCheck,
    FiUser,
    FiMapPin,
    FiSliders,
    FiTrash2,
    FiDownload,
    FiPrinter,
    FiCamera,
    FiPlus,
    FiUploadCloud,
    FiEye,
    FiImage
} from "react-icons/fi";
import { FaQrcode, FaCheckDouble, FaLeaf } from "react-icons/fa";
import "./Device_inspection.css";

function DeviceInspection() {
    const navigate = useNavigate();
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

    // Notifications State & Dropdown
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [notifLoading, setNotifLoading] = useState(false);

    // Inspection Modal State
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [activeModalTab, setActiveModalTab] = useState("overview"); // 'overview' | 'diagnostics' | 'routing'
    const [processingId, setProcessingId] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

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
            { name: "Internal Battery (if wireless)", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Recharges OK" }
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
        default: [
            { name: "Power / Boot", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Power sequence normal" },
            { name: "Battery / Power Supply", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Voltage stable" },
            { name: "Main Circuit Board", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "No visible burns/corrosion" },
            { name: "Input / Output Ports", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Ports functional" },
            { name: "Display / Indicators", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Indicators active" },
            { name: "Audio Output", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Sound functional" },
            { name: "Control Buttons / Switches", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Switches responsive" },
            { name: "Wireless / Connectivity", defaultStatus: "Working", defaultScore: 100, defaultRemarks: "Signal OK" }
        ]
    };

    const getCategoryKey = (device) => {
        if (!device) return "default";
        const str = `${device.categoryName || ""} ${device.brand || ""} ${device.model || ""}`.toLowerCase();
        
        if (str.includes("mobile") || str.includes("smartphone") || str.includes("phone")) return "mobile";
        if (str.includes("laptop") || str.includes("notebook") || str.includes("macbook")) return "laptop";
        if (str.includes("desktop") || str.includes("cpu") || str.includes("computer")) return "desktop";
        if (str.includes("tablet") || str.includes("ipad")) return "tablet";
        if (str.includes("monitor")) return "monitor";
        if (str.includes("television") || str.includes("tv")) return "tv";
        if (str.includes("printer")) return "printer";
        if (str.includes("scanner")) return "scanner";
        if (str.includes("ups") || str.includes("backup power")) return "ups";
        if (str.includes("router") || str.includes("modem") || str.includes("network")) return "router";
        if (str.includes("keyboard") || str.includes("mouse") || str.includes("peripheral")) return "peripherals";
        if (str.includes("audio") || str.includes("speaker") || str.includes("headphone")) return "audio";
        if (str.includes("camera") || str.includes("dslr")) return "camera";
        if (str.includes("gaming") || str.includes("console") || str.includes("playstation") || str.includes("xbox")) return "gaming";
        return "default";
    };

    // Sanitizer helper: Disallows special characters
    const sanitizeText = (str) => {
        if (!str) return "";
        return str.replace(/[^a-zA-Z0-9\s,.\-()]/g, "");
    };

    // Diagnostic Form State inside Inspection Modal
    const [physicalCondition, setPhysicalCondition] = useState("Good");
    const [screenIntegrity, setScreenIntegrity] = useState("Intact");
    const [powerTest, setPowerTest] = useState("Pass");
    const [batteryHealth, setBatteryHealth] = useState("85%");
    const [qualityGrade, setQualityGrade] = useState("Grade A");
    const [wasteDestination, setWasteDestination] = useState("Refurbishment Center");
    const [diagnosticNotes, setDiagnosticNotes] = useState("");
    const [hardwareTests, setHardwareTests] = useState([]);
    const [generalInspectionPhotos, setGeneralInspectionPhotos] = useState([]);
    const [previewImageModal, setPreviewImageModal] = useState(null);
    const [submittedAttempt, setSubmittedAttempt] = useState(false);

    // Multi-photo Upload Handler with File Type & Size Validations
    const handlePartPhotosAdd = (testIdx, e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        let error = "";
        for (let file of files) {
            if (!file.type.startsWith("image/")) {
                error = `File "${file.name}" is not a valid image. Please select JPG, PNG, or WEBP image files.`;
                break;
            }
            if (file.size > 5 * 1024 * 1024) {
                error = `Image "${file.name}" exceeds the 5MB size limit. Please choose a smaller image file.`;
                break;
            }
        }

        if (error) {
            setErrorMsg(error);
            setTimeout(() => setErrorMsg(""), 6000);
            return;
        }

        const newPhotos = [];
        let loadedCount = 0;

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newPhotos.push({
                    id: Date.now() + Math.random(),
                    name: file.name,
                    dataUrl: reader.result
                });
                loadedCount++;
                if (loadedCount === files.length) {
                    setHardwareTests((prev) => {
                        const updated = [...prev];
                        const currentPhotos = updated[testIdx].photos || [];
                        updated[testIdx] = {
                            ...updated[testIdx],
                            photos: [...currentPhotos, ...newPhotos]
                        };
                        return updated;
                    });
                }
            };
            reader.readAsDataURL(file);
        });
        e.target.value = "";
    };

    const handleRemovePartPhoto = (testIdx, photoId) => {
        setHardwareTests((prev) => {
            const updated = [...prev];
            const currentPhotos = updated[testIdx].photos || [];
            updated[testIdx] = {
                ...updated[testIdx],
                photos: currentPhotos.filter((p) => p.id !== photoId)
            };
            return updated;
        });
    };

    // Handler for general inspected parts evidence photos upload
    const handleGeneralPhotosAdd = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        let error = "";
        for (let file of files) {
            if (!file.type.startsWith("image/")) {
                error = `File "${file.name}" is not a valid image. Please select JPG, PNG, or WEBP image files.`;
                break;
            }
            if (file.size > 5 * 1024 * 1024) {
                error = `Image "${file.name}" exceeds the 5MB size limit. Please choose a smaller image file.`;
                break;
            }
        }

        if (error) {
            setErrorMsg(error);
            setTimeout(() => setErrorMsg(""), 6000);
            return;
        }

        const newPhotos = [];
        let loadedCount = 0;

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newPhotos.push({
                    id: Date.now() + Math.random(),
                    name: file.name,
                    caption: file.name.replace(/\.[^/.]+$/, ""),
                    dataUrl: reader.result
                });
                loadedCount++;
                if (loadedCount === files.length) {
                    setGeneralInspectionPhotos((prev) => [...prev, ...newPhotos]);
                }
            };
            reader.readAsDataURL(file);
        });
        e.target.value = "";
    };

    const handleRemoveGeneralPhoto = (photoId) => {
        setGeneralInspectionPhotos((prev) => prev.filter((p) => p.id !== photoId));
    };

    const handleGeneralPhotoCaptionChange = (photoId, caption) => {
        setGeneralInspectionPhotos((prev) =>
            prev.map((p) => (p.id === photoId ? { ...p, caption: sanitizeText(caption) } : p))
        );
    };

    // Initialize category hardware tests when selectedDevice changes
    useEffect(() => {
        if (selectedDevice) {
            setGeneralInspectionPhotos([]);
            const catKey = getCategoryKey(selectedDevice);
            const schema = HARDWARE_DIAGNOSTIC_SCHEMAS[catKey] || HARDWARE_DIAGNOSTIC_SCHEMAS.default;
            const isNonFunctional = (selectedDevice.working || "").toLowerCase() === "no" || (selectedDevice.condition || "").toLowerCase() === "non-functional";
            
            const initialTests = schema.map((item) => ({
                component: item.name,
                result: isNonFunctional ? "Not Working" : item.defaultStatus,
                score: isNonFunctional ? 0 : item.defaultScore,
                remarks: isNonFunctional ? "Defective / Not working" : item.defaultRemarks,
                photos: []
            }));

            setHardwareTests(initialTests);
            setSubmittedAttempt(false);
            setErrorMsg("");
            recalculateSummary(initialTests);

            // Record InspectionStartedAt timestamp in backend when starting inspection
            axios.post(`https://localhost:7102/api/DeviceInspection/start/${selectedDevice.deviceId}`)
                .catch(() => {});

            // Fetch any previously saved backend InspectionResult items for this device
            axios.get(`https://localhost:7102/api/DeviceInspection/results/${selectedDevice.deviceId}`)
                .then((res) => {
                    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                        const savedMap = {};
                        res.data.forEach((r) => {
                            if (r.component) {
                                savedMap[r.component.toLowerCase().trim()] = r;
                            }
                        });

                        const mergedTests = initialTests.map((t) => {
                            const match = savedMap[t.component.toLowerCase().trim()];
                            if (match) {
                                return {
                                    component: t.component,
                                    result: match.result || t.result,
                                    score: match.score !== null && match.score !== undefined ? match.score : t.score,
                                    remarks: match.remarks || t.remarks,
                                    photos: (match.photos || []).map((p, pIdx) => ({
                                        id: p.inspectionPhotoId || pIdx,
                                        dataUrl: p.photoPath?.startsWith("http") || p.photoPath?.startsWith("/uploads")
                                            ? (p.photoPath.startsWith("http") ? p.photoPath : `https://localhost:7102${p.photoPath}`)
                                            : p.photoPath,
                                        name: p.photoType || "Inspection Photo"
                                    }))
                                };
                            }
                            return t;
                        });
                        setHardwareTests(mergedTests);
                        recalculateSummary(mergedTests);
                    }
                })
                .catch((err) => {
                    console.log("No previous inspection results found for device:", err?.message);
                });
        }
    }, [selectedDevice]);

    const recalculateSummary = (tests) => {
        if (!tests || tests.length === 0) return;
        const totalScore = tests.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
        const avg = Math.round(totalScore / tests.length);
        if (avg >= 85) {
            setQualityGrade("Grade A");
            setWasteDestination("Refurbishment Center");
        } else if (avg >= 65) {
            setQualityGrade("Grade B");
            setWasteDestination("Refurbishment Center");
        } else if (avg >= 45) {
            setQualityGrade("Grade C");
            setWasteDestination("Refurbishment Center");
        } else {
            setQualityGrade("Grade D");
            setWasteDestination("Recycling Center");
        }
    };

    const updateTestItem = (index, newResult, newScore, newRemarks) => {
        setHardwareTests((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                result: newResult,
                score: newScore,
                remarks: newRemarks
            };
            recalculateSummary(updated);
            return updated;
        });
    };

    const markAllTests = (status, score, remarks) => {
        setHardwareTests((prev) => {
            const updated = prev.map((t) => ({
                ...t,
                result: status,
                score: score,
                remarks: remarks
            }));
            recalculateSummary(updated);
            return updated;
        });
    };

    // Quick Receipt Modal State
    const [confirmModalItem, setConfirmModalItem] = useState(null);
    const [receiptNotes, setReceiptNotes] = useState("");
    const [handoverInstructionModal, setHandoverInstructionModal] = useState(null);

    // User Profile
    const [techName, setTechName] = useState(() => {
        return localStorage.getItem("firstName") ||
               localStorage.getItem("userName") ||
               localStorage.getItem("username") ||
               localStorage.getItem("name") ||
               "Inspection Officer";
    });
    const [profilePhoto, setProfilePhoto] = useState(() => {
        return localStorage.getItem("profilePhoto") || localStorage.getItem("userPhoto") || null;
    });

    const userInitial = (techName || "I").charAt(0).toUpperCase();

    const getMediaUrl = (photoPath, folder = "uploads/devices/FrontPhotos") => {
        if (!photoPath) return null;
        if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) return photoPath;
        const clean = photoPath.replace(/\\/g, "/").replace(/^\/+/, "");
        if (clean.includes("/")) return `https://localhost:7102/${clean}`;
        return `https://localhost:7102/${folder}/${clean}`;
    };

    const getRemainingTimeText = (deadlineStr) => {
        if (!deadlineStr) return null;
        const deadline = new Date(deadlineStr);
        const now = new Date();
        const diffMs = deadline - now;

        if (diffMs <= 0) {
            const overdueHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
            if (overdueHours < 1) return { text: "Overdue (just now)", isOverdue: true, isUrgent: true };
            const days = Math.floor(overdueHours / 24);
            const hrs = overdueHours % 24;
            const timeStr = days > 0 ? `${days}d ${hrs}h` : `${hrs}h`;
            return { text: `Overdue by ${timeStr}`, isOverdue: true, isUrgent: true };
        }

        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;

        if (days > 0) {
            return { text: `Time Left: ${days}d ${remainingHours}h`, isOverdue: false, isUrgent: days < 1 };
        } else if (hours > 0) {
            return { text: `Time Left: ${hours}h ${mins}m`, isOverdue: false, isUrgent: true };
        } else {
            return { text: `Time Left: ${mins}m`, isOverdue: false, isUrgent: true };
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found, redirecting to login.");
            navigate("/login");
            return;
        }
        fetchInspectionDevices(token);
        fetchNotifications(token);

        axios.get("https://localhost:7102/api/Technician/myprofile", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
            const data = res.data || {};
            const fName = data.firstName || data.FirstName || "";
            const lName = data.lastName || data.LastName || "";
            const fullName = `${fName} ${lName}`.trim() || data.name || data.Name;
            const photo = data.photo || data.Photo || data.profilePhoto || data.ProfilePhoto || data.photoPath;

            if (fullName) {
                setTechName(fullName);
                if (fName) localStorage.setItem("firstName", fName);
            }
            if (photo) {
                setProfilePhoto(photo);
                localStorage.setItem("profilePhoto", photo);
            }
        })
        .catch(() => {});
    }, [navigate]);

    const fetchInspectionDevices = async (token) => {
        const authToken = token || localStorage.getItem("token");
        if (!authToken) {
            navigate("/login");
            return;
        }
        setLoading(true);
        setErrorMsg("");
        try {
            // Fetch live deliveries & inspection items for technician
            const response = await axios.get("https://localhost:7102/api/Inspection/my-deliveries", {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setDevices(response.data || []);
        } catch (err) {
            console.error("Error fetching inspection devices:", err);
            if (err.response?.status === 401) {
                console.warn("Session expired or unauthorized (401). Redirecting to login...");
                localStorage.removeItem("token");
                navigate("/login");
            } else {
                setErrorMsg("Failed to load live inspection queue from server.");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async (token) => {
        const authToken = token || localStorage.getItem("token");
        if (!authToken) return;
        try {
            setNotifLoading(true);
            const response = await axios.get("https://localhost:7102/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setNotifications(response.data || []);
        } catch (err) {
            console.error("Error fetching notifications:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
            }
        } finally {
            setNotifLoading(false);
        }
    };

    const handleMarkAsRead = async (notifId, e) => {
        if (e) e.stopPropagation();
        const token = localStorage.getItem("token");
        try {
            await axios.put(`https://localhost:7102/api/Notificationcon/mark_asread/${notifId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications((prev) =>
                prev.map((n) => (n.notificationId === notifId ? { ...n, isRead: true } : n))
            );
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    };

    const handleMarkAllAsRead = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.get("https://localhost:7102/api/Notificationcon/mark_asread", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const handleClearAllNotifications = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.get("https://localhost:7102/api/Notificationcon/clearall", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications([]);
        } catch (err) {
            console.error("Failed to clear notifications:", err);
        }
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // Filter Logic - Only show devices accepted by technician
    const acceptedDevices = devices.filter((item) => {
        const reqStat = String(item.requestStatus || "").toLowerCase();
        const lifeStat = String(item.lifecycleStatus || "").toLowerCase();
        return reqStat === "accepted" || reqStat === "inprogress" || reqStat === "completed" || lifeStat === "inspected";
    });

    const filteredDevices = acceptedDevices.filter((item) => {
        const reqStat = String(item.requestStatus || "").toLowerCase();
        const delStat = String(item.deliveryStatus || "").toLowerCase();
        const lifeStat = String(item.lifecycleStatus || "").toLowerCase();

        const isInspectedOrCompleted =
            lifeStat === "inspected" ||
            reqStat === "completed" ||
            delStat === "completed" ||
            Boolean(item.deliveryDeviceVerified);

        if (activeTab === "Awaiting Inspection" && isInspectedOrCompleted) return false;
        if (activeTab === "Handover Verification" && delStat !== "intransit" && delStat !== "pending") return false;
        if (activeTab === "Completed" && !isInspectedOrCompleted) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            String(item.deviceId).includes(q) ||
            (item.brand || "").toLowerCase().includes(q) ||
            (item.model || "").toLowerCase().includes(q) ||
            (item.categoryName || "").toLowerCase().includes(q) ||
            (item.customerName || "").toLowerCase().includes(q)
        );
    });

    // Metric Counts
    const totalAssigned = acceptedDevices.length;
    const awaitingInspectionCount = acceptedDevices.filter((d) => {
        const reqStat = String(d.requestStatus || "").toLowerCase();
        const delStat = String(d.deliveryStatus || "").toLowerCase();
        const lifeStat = String(d.lifecycleStatus || "").toLowerCase();
        const isDone = lifeStat === "inspected" || reqStat === "completed" || delStat === "completed" || Boolean(d.deliveryDeviceVerified);
        return !isDone;
    }).length;
    const verificationCount = acceptedDevices.filter((d) => {
        const delStat = String(d.deliveryStatus || "").toLowerCase();
        return delStat === "intransit" || delStat === "pending";
    }).length;
    const completedCount = acceptedDevices.filter((d) => {
        const reqStat = String(d.requestStatus || "").toLowerCase();
        const delStat = String(d.deliveryStatus || "").toLowerCase();
        const lifeStat = String(d.lifecycleStatus || "").toLowerCase();
        return lifeStat === "inspected" || reqStat === "completed" || delStat === "completed" || Boolean(d.deliveryDeviceVerified);
    }).length;

    // Submit Inspection Action with Live Form Validations
    const handleSubmitInspection = async () => {
        if (!selectedDevice) return;
        setSubmittedAttempt(true);

        // Validation 1: Check for any empty remarks in hardware diagnostic matrix
        const emptyRemarkIndex = hardwareTests.findIndex((t) => !t.remarks || t.remarks.trim() === "");
        if (emptyRemarkIndex !== -1) {
            const componentName = hardwareTests[emptyRemarkIndex].component;
            setErrorMsg(`Validation Error: Diagnostic remarks for "${componentName}" cannot be empty.`);
            setActiveModalTab("diagnostics");
            return;
        }

        // Validation 2: Check overall diagnostic notes length > 4
        if (!diagnosticNotes || diagnosticNotes.trim().length <= 4) {
            setErrorMsg("Validation Error: Technical Diagnostic Notes & Remarks length must be greater than 4 characters.");
            setActiveModalTab("diagnostics");
            return;
        }

        const token = localStorage.getItem("token");
        const reqId = selectedDevice.inspectionRequestId;
        setProcessingId(selectedDevice.deviceId);
        setErrorMsg("");

        try {
            // Build payload for backend storage using InspectionResult, InspectionCriteria & InspectionPhoto tables
            const payload = {
                deviceId: selectedDevice.deviceId,
                inspectionRequestId: reqId || null,
                physicalCondition,
                screenIntegrity,
                powerTest,
                batteryHealth,
                qualityGrade,
                wasteDestination,
                diagnosticNotes,
                tests: hardwareTests.map((t) => ({
                    component: t.component,
                    result: t.result,
                    score: Number(t.score) || 0,
                    remarks: t.remarks || "",
                    photosBase64: (t.photos || []).map((p) => p.dataUrl || p.photoPath).filter(Boolean)
                }))
            };

            // Call DeviceInspection controller submit endpoint
            await axios.post("https://localhost:7102/api/DeviceInspection/submit", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Also trigger inspection accept status update if request ID exists
            if (reqId) {
                try {
                    await axios.post(`https://localhost:7102/api/Inspection/accept/${reqId}`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } catch (e) {
                    console.log("Inspection request status updated via DeviceInspection submission.");
                }
            }

            setSuccessMsg(`Device #${selectedDevice.deviceId} (${selectedDevice.brand} ${selectedDevice.model}) inspection report saved successfully! Destination set to ${wasteDestination}.`);
            setTimeout(() => setSuccessMsg(""), 5000);

            // Update local state
            setDevices((prev) =>
                prev.map((item) =>
                    item.deviceId === selectedDevice.deviceId
                        ? { ...item, requestStatus: "Accepted", deliveryStatus: "Delivered", deliveryDeviceVerified: true }
                        : item
                )
            );
            setSelectedDevice(null);
        } catch (err) {
            console.error("Inspection submit error:", err);
            setErrorMsg("Error submitting inspection report. Please try again.");
        } finally {
            setProcessingId(null);
        }
    };

    // Confirm Handover Receipt Action
    const handleConfirmReceipt = async () => {
        if (!confirmModalItem) return;
        setSubmittedAttempt(true);

        if (!receiptNotes || receiptNotes.trim().length <= 4) {
            setErrorMsg("Validation Error: Verification Notes must be greater than 4 characters.");
            return;
        }

        const token = localStorage.getItem("token");
        const caId = confirmModalItem.collectionAssignmentId;
        if (!caId) return;

        setProcessingId(confirmModalItem.deviceId);
        try {
            const response = await axios.post(`https://localhost:7102/api/Inspection/confirm-receipt/${caId}`, {
                notes: receiptNotes || "Handover verified & accepted by technician"
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccessMsg(`Handover receipt confirmed for Device #${confirmModalItem.deviceId}!`);
            setTimeout(() => setSuccessMsg(""), 4000);

            const item = confirmModalItem;
            setDevices((prev) =>
                prev.map((d) =>
                    d.deviceId === item.deviceId
                        ? { ...d, deliveryStatus: "Delivered", deliveryDeviceVerified: true }
                        : d
                )
            );

            const rawDeadline = response?.data?.inspectionDeadline;
            const formattedDeadline = rawDeadline
                ? new Date(rawDeadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

            setHandoverInstructionModal({
                device: item,
                deadline: formattedDeadline
            });

            setConfirmModalItem(null);
            setReceiptNotes("");
        } catch (err) {
            console.error("Confirm receipt error:", err);
            setErrorMsg("Failed to confirm receipt.");
        } finally {
            setProcessingId(null);
        }
    };

    // Download Device Specifications PDF
    const handleDownloadDevicePdf = (deviceItem) => {
        const dev = deviceItem || selectedDevice;
        if (!dev) return;

        const printWin = window.open("", "_blank");
        if (!printWin) {
            alert("Please allow popups in your browser to download the device PDF.");
            return;
        }

        const dateStr = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>EcoCycle_Device_Details_DEV_${dev.deviceId}.pdf</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                    * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
                    body { margin: 0; padding: 24px; background: #ffffff; color: #0f172a; }
                    .report-container { max-width: 800px; margin: 0 auto; border: 2px solid #059669; border-radius: 16px; padding: 28px; background: #ffffff; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 18px; margin-bottom: 20px; }
                    .brand { font-size: 24px; font-weight: 800; color: #059669; letter-spacing: -0.5px; }
                    .sub-brand { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
                    .doc-title { text-align: right; }
                    .doc-title h2 { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
                    .doc-title p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600; }
                    
                    .hero-banner { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; }
                    .hero-dev-title { font-size: 20px; font-weight: 800; color: #065f46; margin: 0 0 4px 0; }
                    .hero-dev-meta { font-size: 12px; color: #047857; font-weight: 600; }

                    .section-title { font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 1px; margin: 22px 0 10px 0; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; }
                    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }
                    
                    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
                    .info-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
                    .info-val { font-size: 13px; font-weight: 800; color: #0f172a; word-break: break-word; }

                    .stamp-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
                    .stamp-box { border: 1.5px dashed #059669; border-radius: 6px; padding: 4px 10px; text-align: center; color: #059669; }
                    .stamp-title { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
                    .stamp-sub { font-size: 7.5px; font-weight: 700; margin-top: 1px; }
                    .signature-box { text-align: right; }
                    .sig-line { width: 120px; border-bottom: 1px solid #0f172a; margin-bottom: 2px; display: inline-block; }
                    .sig-name { font-size: 10px; font-weight: 800; color: #0f172a; }
                    .sig-role { font-size: 8.5px; color: #64748b; font-weight: 600; }

                    .footer-notice { margin-top: 10px; font-size: 8px; text-align: center; color: #94a3b8; font-weight: 600; border-top: 1px solid #f1f5f9; padding-top: 6px; }

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
                            <div class="sub-brand">Device Information & Technical Specification Sheet</div>
                        </div>
                        <div class="doc-title">
                            <h2>Device Specification Details</h2>
                            <p>Generated: ${dateStr}</p>
                        </div>
                    </div>

                    <div class="hero-banner">
                        <h1 class="hero-dev-title">${dev.brand} ${dev.model}</h1>
                        <div class="hero-dev-meta">Device Record ID: <strong>#DEV-${String(dev.deviceId).padStart(3, "0")}</strong> • Category: <strong>${dev.categoryName || "E-Waste"}</strong></div>
                    </div>

                    <div class="section-title">1. Device Master Specifications (Device Table)</div>
                    <div class="grid-4">
                        <div class="info-card">
                            <div class="info-label">Brand & Model</div>
                            <div class="info-val">${dev.brand} ${dev.model}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Model Number</div>
                            <div class="info-val">${dev.modelNumber || "N/A"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Serial Number</div>
                            <div class="info-val">${dev.serialNumber || "N/A"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Device Category</div>
                            <div class="info-val">${dev.categoryName || "E-Waste"}</div>
                        </div>
                    </div>

                    <div class="grid-4" style="margin-top: 10px;">
                        <div class="info-card">
                            <div class="info-label">Quantity & Weight</div>
                            <div class="info-val">${dev.weight || 1} kg (${dev.quantity || 1} unit)</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Declared Condition</div>
                            <div class="info-val">${dev.condition || "Used"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Working State</div>
                            <div class="info-val">${dev.working || "Functional"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Processing Preference</div>
                            <div class="info-val">${dev.processingPreference || "Eco Recycling"}</div>
                        </div>
                    </div>

                    <div class="section-title">2. Hardware Inspection & Physical Health Data</div>
                    <div class="grid-4">
                        <div class="info-card">
                            <div class="info-label">Physical Damage</div>
                            <div class="info-val">${dev.physicalDamage || "None"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Display Condition</div>
                            <div class="info-val">${dev.displayCondition || "N/A"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Battery Condition</div>
                            <div class="info-val">${dev.batteryCondition || "N/A"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Accessories & Charger</div>
                            <div class="info-val">Acc: ${dev.accessories || "No"} | Chg: ${dev.charger || "No"}</div>
                        </div>
                    </div>

                    ${(dev.frontPhoto || dev.backPhoto || dev.damagePhoto || dev.labelPhoto) ? `
                        <div class="section-title">3. Device Photo Evidence (Uploaded Files)</div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 10px;">
                            ${dev.frontPhoto ? `
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; text-align: center;">
                                    <span style="display: block; font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Front View Photo</span>
                                    <img src="${getMediaUrl(dev.frontPhoto, "uploads/devices/FrontPhotos")}" alt="Front Photo" style="max-width: 100%; max-height: 180px; border-radius: 8px; object-fit: cover; border: 1px solid #cbd5e1;" />
                                </div>
                            ` : ""}
                            ${dev.backPhoto ? `
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; text-align: center;">
                                    <span style="display: block; font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Back View Photo</span>
                                    <img src="${getMediaUrl(dev.backPhoto, "uploads/devices/BackPhotos")}" alt="Back Photo" style="max-width: 100%; max-height: 180px; border-radius: 8px; object-fit: cover; border: 1px solid #cbd5e1;" />
                                </div>
                            ` : ""}
                            ${dev.damagePhoto ? `
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; text-align: center;">
                                    <span style="display: block; font-size: 10px; font-weight: 800; color: #dc2626; text-transform: uppercase; margin-bottom: 6px;">Damage / Broken Photo</span>
                                    <img src="${getMediaUrl(dev.damagePhoto, "uploads/devices/DamagePhotos")}" alt="Damage Photo" style="max-width: 100%; max-height: 180px; border-radius: 8px; object-fit: cover; border: 1px solid #cbd5e1;" />
                                </div>
                            ` : ""}
                            ${dev.labelPhoto ? `
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; text-align: center;">
                                    <span style="display: block; font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Serial / Label Photo</span>
                                    <img src="${getMediaUrl(dev.labelPhoto, "uploads/devices/LabelPhotos")}" alt="Serial Label Photo" style="max-width: 100%; max-height: 180px; border-radius: 8px; object-fit: cover; border: 1px solid #cbd5e1;" />
                                </div>
                            ` : ""}
                        </div>
                    ` : ""}

                    <div class="stamp-row">
                        <div class="stamp-box">
                            <div class="stamp-title">ECOCYCLE REGISTERED</div>
                            <div class="stamp-sub">Official Master Record</div>
                        </div>
                        <div class="signature-box">
                            <div class="sig-line"></div>
                            <div class="sig-name">System Master Record</div>
                            <div class="sig-role">EcoCycle Device Database</div>
                        </div>
                    </div>

                    <div class="footer-notice">
                        Official Device Master Specification Record • EcoCycle E-Waste Management System (Device ID: #DEV-${dev.deviceId}).
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

    return (
        <div className="device-inspection-container">
            <Sidebar />

            <main className="inspection-main-content">
                {/* Ambient Background Glows */}
                <div className="ambient-glow ambient-glow--1"></div>
                <div className="ambient-glow ambient-glow--2"></div>

                {/* Header Bar matching technician_delivery.jsx */}
                <div className="tech-header-bar">
                    <div className="tech-header-actions">
                        {/* Search Input */}
                        <div className="search-box-v2" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            <FiSearch className="search-icon" style={{ position: "absolute", left: "0.85rem", color: "#94a3b8", fontSize: "0.95rem" }} />
                            <input
                                type="text"
                                placeholder="Search brand, model, S/N, citizen..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(sanitizeText(e.target.value))}
                                style={{
                                    padding: "0.45rem 1rem 0.45rem 2.3rem",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "10px",
                                    background: "#ffffff",
                                    fontSize: "0.8rem",
                                    color: "#0f172a",
                                    width: "220px",
                                    outline: "none",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                                }}
                            />
                        </div>

                        <button className="tech-refresh-btn" onClick={() => fetchInspectionDevices()}>
                            <FiRefreshCw className={loading ? "spin-icon" : ""} /> Refresh
                        </button>

                        {/* Notification Bell */}
                        <div className="notif-bell-container" style={{ position: "relative" }}>
                            <button
                                className="tech-refresh-btn"
                                style={{ position: "relative" }}
                                title={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
                                onClick={() => navigate("/technician-notification")}
                            >
                                <FiBell style={{ fontSize: "1.1rem" }} />
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: "absolute",
                                        top: "-4px",
                                        right: "-4px",
                                        background: "#ef4444",
                                        color: "#ffffff",
                                        fontSize: "0.65rem",
                                        fontWeight: 800,
                                        width: "18px",
                                        height: "18px",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}>
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Floating Dropdown */}
                            {showNotifDropdown && (
                                <div className="notif-dropdown-menu">
                                    <div className="notif-dropdown-header">
                                        <div className="notif-title-row">
                                            <FiBell className="header-icon" />
                                            <h4>Notifications</h4>
                                            {unreadCount > 0 && (
                                                <span className="unread-chip">{unreadCount} New</span>
                                            )}
                                        </div>
                                        <div className="notif-header-actions">
                                            {unreadCount > 0 && (
                                                <button className="text-action-btn" onClick={handleMarkAllAsRead} title="Mark all read">
                                                    <FaCheckDouble /> Read All
                                                </button>
                                            )}
                                            {notifications.length > 0 && (
                                                <button className="text-action-btn text-action-btn--danger" onClick={handleClearAllNotifications} title="Clear all">
                                                    <FiTrash2 /> Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="notif-dropdown-body">
                                        {notifLoading ? (
                                            <div className="notif-loading-state">
                                                <FiRefreshCw className="spin-icon" /> Loading alerts...
                                            </div>
                                        ) : notifications.length > 0 ? (
                                            notifications.map((n) => (
                                                <div
                                                    key={n.notificationId}
                                                    className={`notif-item ${!n.isRead ? "notif-item--unread" : ""}`}
                                                    onClick={(e) => handleMarkAsRead(n.notificationId, e)}
                                                >
                                                    <div className="notif-item-icon">
                                                        {n.title.toLowerCase().includes("overdue") || n.title.toLowerCase().includes("reject") ? (
                                                            <FiAlertCircle className="icon-danger" />
                                                        ) : (
                                                            <FiCheckCircle className="icon-success" />
                                                        )}
                                                    </div>
                                                    <div className="notif-item-content">
                                                        <span className="notif-item-title">{n.title}</span>
                                                        <p className="notif-item-msg">{n.message}</p>
                                                        <span className="notif-item-time">
                                                            {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    </div>
                                                    {!n.isRead && (
                                                        <button
                                                            className="mark-read-dot-btn"
                                                            onClick={(e) => handleMarkAsRead(n.notificationId, e)}
                                                            title="Mark as read"
                                                        >
                                                            <span className="blue-dot"></span>
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="notif-empty-state">
                                                <FiCheckCircle className="empty-icon" />
                                                <p>No notifications at this time</p>
                                                <span>System alerts will appear here</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="tech-user-avatar" title={techName} style={{ cursor: "pointer" }} onClick={() => navigate("/technician-profile")}>
                            {profilePhoto ? (
                                <img
                                    src={getMediaUrl(profilePhoto, "uploads/technicians/ProfilePhotos")}
                                    alt={techName}
                                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        setProfilePhoto(null);
                                        try { localStorage.removeItem("profilePhoto"); } catch (err) {}
                                    }}
                                />
                            ) : (
                                userInitial
                            )}
                        </div>
                    </div>
                </div>

                {/* Notifications & Status Banner Toast */}
                {successMsg && (
                    <div className="alert-banner alert-banner--success">
                        <FiCheckCircle className="alert-icon" />
                        <span>{successMsg}</span>
                        <button className="close-alert" onClick={() => setSuccessMsg("")}><FiX /></button>
                    </div>
                )}

                {/* KPI Summary Cards Grid */}
                <div className="tech-kpi-grid">
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon all"><FiCheckSquare /></div>
                        <div className="tech-kpi-info">
                            <h3>{loading ? "..." : totalAssigned}</h3>
                            <p>Assigned Queue</p>
                        </div>
                    </div>
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon transit"><FiClock /></div>
                        <div className="tech-kpi-info">
                            <h3>{loading ? "..." : awaitingInspectionCount}</h3>
                            <p>Awaiting Diagnostic</p>
                        </div>
                    </div>
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon delivered"><FiTruck /></div>
                        <div className="tech-kpi-info">
                            <h3>{loading ? "..." : verificationCount}</h3>
                            <p>Handover Verification</p>
                        </div>
                    </div>
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon weight"><FiShield /></div>
                        <div className="tech-kpi-info">
                            <h3>{loading ? "..." : completedCount}</h3>
                            <p>Inspected &amp; Processed</p>
                        </div>
                    </div>
                </div>

                {/* Main Inspection Controls Header */}
                <div className="control-bar-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.2rem", color: "#0f172a" }}>Live Inspection Queue</h3>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>Perform technical diagnostics and verify device hardware condition</p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap", marginLeft: "auto" }}>
                        <div className="filter-pills">
                            {["All", "Awaiting Inspection", "Handover Verification", "Completed"].map((tab) => (
                                <button
                                    key={tab}
                                    className={`pill-btn ${activeTab === tab ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="view-toggle">
                            <button
                                className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
                                onClick={() => setViewMode("table")}
                                title="Table View"
                            >
                                <FiList />
                            </button>
                            <button
                                className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                                onClick={() => setViewMode("grid")}
                                title="Grid View"
                            >
                                <FiGrid />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Inspection Device Items Container */}
                {loading ? (
                    <div className="loading-container">
                        <FiRefreshCw className="spin-icon-lg" />
                        <p>Loading live device inspection queue...</p>
                    </div>
                ) : filteredDevices.length === 0 ? (
                    <div className="empty-inspection-state">
                        <FiCheckSquare className="empty-state-icon" />
                        <h3>No Device Inspection Records Found</h3>
                        <p>There are no devices matching your selected filter criteria.</p>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="device-cards-grid">
                        {filteredDevices.map((item) => {
                            const isVerified = item.deliveryDeviceVerified || String(item.deliveryStatus || "").toLowerCase() === "delivered";
                            return (
                                <div key={item.deviceId} className="device-card-v2">
                                    <div className="card-top-header">
                                        <span className="device-id-badge">#DEV-{String(item.deviceId).padStart(3, "0")}</span>
                                        <span className={`status-pill ${isVerified ? "status-pill--completed" : "status-pill--progress"}`}>
                                            <span className="status-beacon"></span>
                                            {isVerified ? "Delivered to Center" : (item.deliveryStatus || "En Route")}
                                        </span>
                                    </div>

                                    <div className="card-body">
                                        <div className="device-title-group">
                                            <FiSmartphone className="device-type-icon" />
                                            <div>
                                                <h4>{item.brand} {item.model}</h4>
                                                <span className="cat-text">{item.categoryName || "E-Waste Device"}</span>
                                            </div>
                                        </div>

                                        <div className="spec-meta-grid">
                                            <div className="meta-box">
                                                <span className="meta-lbl">Citizen</span>
                                                <span className="meta-val">{item.customerName}</span>
                                            </div>
                                            <div className="meta-box">
                                                <span className="meta-lbl">Condition</span>
                                                <span className="meta-val">{item.condition || "Used"}</span>
                                            </div>
                                            <div className="meta-box">
                                                <span className="meta-lbl">Preference</span>
                                                <span className="meta-val">{item.processingPreference || "Eco Recycling"}</span>
                                            </div>
                                            <div className="meta-box">
                                                <span className="meta-lbl">Agent</span>
                                                <span className="meta-val">{item.collectionAgentName || "Assigned Agent"}</span>
                                            </div>
                                        </div>

                                        {/* Inspection Deadline Banner */}
                                        {isVerified && (() => {
                                            const timeInfo = getRemainingTimeText(item.inspectionDeadline);
                                            const isCompleted = String(item.lifecycleStatus || "").toLowerCase() === "inspected";
                                            if (isCompleted) return null;
                                            return (
                                                <div style={{
                                                    marginTop: "0.75rem",
                                                    background: timeInfo?.isOverdue ? "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)" : timeInfo?.isUrgent ? "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)" : "linear-gradient(135deg, #fffbe6 0%, #fef3c7 100%)",
                                                    border: `1px solid ${timeInfo?.isOverdue ? "#fca5a5" : timeInfo?.isUrgent ? "#fdba74" : "#fde68a"}`,
                                                    borderRadius: "10px",
                                                    padding: "0.55rem 0.75rem",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    gap: "0.5rem"
                                                }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <FiClock style={{ color: timeInfo?.isOverdue ? "#dc2626" : timeInfo?.isUrgent ? "#ea580c" : "#d97706", fontSize: "0.95rem" }} />
                                                        <div>
                                                            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: timeInfo?.isOverdue ? "#991b1b" : timeInfo?.isUrgent ? "#c2410c" : "#b45309", textTransform: "uppercase", letterSpacing: "0.3px" }}>Inspection Deadline</div>
                                                            <div style={{ fontSize: "0.775rem", fontWeight: 800, color: timeInfo?.isOverdue ? "#7f1d1d" : timeInfo?.isUrgent ? "#7c2d12" : "#78350f" }}>
                                                                {item.inspectionDeadline
                                                                    ? new Date(item.inspectionDeadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                                                                    : "Within 72 Hours of Acceptance"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {timeInfo && (
                                                        <span style={{
                                                            padding: "0.2rem 0.55rem",
                                                            borderRadius: "9999px",
                                                            background: timeInfo.isOverdue ? "#ef4444" : timeInfo.isUrgent ? "#ea580c" : "#d97706",
                                                            color: "#ffffff",
                                                            fontSize: "0.675rem",
                                                            fontWeight: 800,
                                                            whiteSpace: "nowrap"
                                                        }}>
                                                            {timeInfo.text}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div className="card-actions-footer">
                                        {String(item.lifecycleStatus || "").toLowerCase() === "inspected" ? (
                                            <span className="inspected-status-badge" style={{ width: "100%", justifyContent: "center" }}>
                                                <FiCheckCircle /> Inspection Completed
                                            </span>
                                        ) : isVerified ? (() => {
                                            const timeInfo = getRemainingTimeText(item.inspectionDeadline);
                                            const isOverdue = timeInfo?.isOverdue || (item.inspectionDeadline && new Date(item.inspectionDeadline) < new Date());
                                            if (isOverdue) {
                                                return (
                                                    <span className="overdue-status-badge" style={{ width: "100%", boxSizing: "border-box", justifyContent: "center", background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", padding: "0.55rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                                                        <FiAlertTriangle /> Inspection Deadline Expired
                                                    </span>
                                                );
                                            }
                                            return (
                                                <button
                                                    className="action-btn action-btn--primary"
                                                    onClick={() => setSelectedDevice(item)}
                                                    style={{ width: "100%", justifyContent: "center" }}
                                                >
                                                    <FiActivity /> Start Technical Inspection
                                                </button>
                                            );
                                        })() : (
                                            <span className="pending-status-badge" style={{ width: "100%", justifyContent: "center" }}>
                                                <FiClock /> Awaiting Delivery Handover
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Table View */
                    <div className="glass-table-wrapper">
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>Device ID</th>
                                    <th>Brand &amp; Model</th>
                                    <th>Category</th>
                                    <th>Citizen Name</th>
                                    <th>Delivery Status</th>
                                    <th>Inspection Status</th>
                                    <th>Inspection Deadline</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDevices.map((item) => {
                                    const isVerified = item.deliveryDeviceVerified || String(item.deliveryStatus || "").toLowerCase() === "delivered";
                                    const isInspected = String(item.lifecycleStatus || "").toLowerCase() === "inspected";
                                    return (
                                        <tr key={item.deviceId} className="table-row-hover">
                                            <td className="id-cell">#DEV-{String(item.deviceId).padStart(3, "0")}</td>
                                            <td>
                                                <div className="user-profile-cell">
                                                    {getMediaUrl(item.frontPhoto) ? (
                                                        <img
                                                            src={getMediaUrl(item.frontPhoto)}
                                                            alt={`${item.brand} ${item.model}`}
                                                            className="device-table-img-thumb"
                                                            onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
                                                        />
                                                    ) : (
                                                        <span className="user-avatar-mini">{item.brand ? item.brand.charAt(0) : "D"}</span>
                                                    )}
                                                    <span className="user-name">{item.brand} {item.model}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="material-chip">
                                                    <FiCpu /> {item.categoryName || "E-Waste"}
                                                </span>
                                            </td>
                                            <td>{item.customerName}</td>
                                            <td>
                                                <span className={`status-pill ${isVerified ? "status-pill--completed" : "status-pill--progress"}`}>
                                                    <span className="status-beacon"></span>
                                                    {isVerified ? "Delivered" : (item.deliveryStatus || "Pending")}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-pill ${isInspected ? "status-pill--completed" : "status-pill--assigned"}`}>
                                                    <span className="status-beacon"></span>
                                                    {isInspected ? "Inspected" : (item.requestStatus || "Assigned")}
                                                </span>
                                            </td>
                                            <td>
                                                {isVerified && !isInspected ? (() => {
                                                    const timeInfo = getRemainingTimeText(item.inspectionDeadline);
                                                    return (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                                            <span style={{
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "0.3rem",
                                                                fontSize: "0.75rem",
                                                                fontWeight: 700,
                                                                color: timeInfo?.isOverdue ? "#dc2626" : timeInfo?.isUrgent ? "#ea580c" : "#b45309",
                                                                background: timeInfo?.isOverdue ? "#fef2f2" : timeInfo?.isUrgent ? "#fff7ed" : "#fffbe6",
                                                                padding: "0.25rem 0.6rem",
                                                                borderRadius: "8px",
                                                                border: `1px solid ${timeInfo?.isOverdue ? "#fca5a5" : timeInfo?.isUrgent ? "#fdba74" : "#fde68a"}`
                                                            }}>
                                                                <FiClock /> {item.inspectionDeadline ? new Date(item.inspectionDeadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "72 Hours"}
                                                            </span>
                                                            {timeInfo && (
                                                                <span style={{
                                                                    fontSize: "0.7rem",
                                                                    fontWeight: 800,
                                                                    color: timeInfo.isOverdue ? "#dc2626" : timeInfo.isUrgent ? "#ea580c" : "#d97706",
                                                                    paddingLeft: "0.25rem"
                                                                }}>
                                                                    {timeInfo.text}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })() : (
                                                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{isInspected ? "Completed" : "N/A (Awaiting Handover)"}</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="table-action-group">
                                                    {isInspected ? (
                                                        <span className="inspected-status-badge-sm">
                                                            <FiCheckCircle /> Inspected
                                                        </span>
                                                    ) : isVerified ? (() => {
                                                        const timeInfo = getRemainingTimeText(item.inspectionDeadline);
                                                        const isOverdue = timeInfo?.isOverdue || (item.inspectionDeadline && new Date(item.inspectionDeadline) < new Date());
                                                        if (isOverdue) {
                                                            return (
                                                                <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "0.75rem", background: "#fef2f2", border: "1px solid #fca5a5", padding: "0.3rem 0.6rem", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                                    <FiAlertTriangle /> Deadline Expired
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <button
                                                                className="table-btn table-btn--primary"
                                                                onClick={() => setSelectedDevice(item)}
                                                            >
                                                                <FiSliders /> Inspect
                                                            </button>
                                                        );
                                                    })() : (
                                                        <span className="pending-status-badge-sm">
                                                            <FiClock /> Awaiting Handover
                                                        </span>
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
            </main>

            {/* Perform Inspection Modal */}
            {selectedDevice && (
                <div className="modal-backdrop">
                    <div className="inspection-modal-card">
                        <div className="modal-header" style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "1.25rem 1.5rem" }}>
                            <div>
                                <h3 style={{ color: "#0f172a", margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                                    Inspect Device
                                </h3>
                                <p style={{ color: "#64748b", margin: "0.2rem 0 0", fontSize: "0.8rem" }}>
                                    {selectedDevice.brand} {selectedDevice.model} — Listed by {selectedDevice.customerName}
                                </p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <button className="close-modal-btn" onClick={() => setSelectedDevice(null)}><FiX /></button>
                            </div>
                        </div>

                        {/* Modal Tabs */}
                        <div className="modal-tabs">
                            <button
                                className={`modal-tab-btn ${activeModalTab === "overview" ? "active" : ""}`}
                                onClick={() => setActiveModalTab("overview")}
                            >
                                <FiFileText /> Specs Overview
                            </button>
                            <button
                                className={`modal-tab-btn ${activeModalTab === "diagnostics" ? "active" : ""}`}
                                onClick={() => setActiveModalTab("diagnostics")}
                            >
                                <FiSliders /> Hardware Diagnostic
                            </button>
                            <button
                                className={`modal-tab-btn ${activeModalTab === "routing" ? "active" : ""}`}
                                onClick={() => setActiveModalTab("routing")}
                            >
                                <FaLeaf /> Destination Routing
                            </button>
                        </div>

                        <div className="modal-body-scroll">
                            {errorMsg && (
                                <div className="modal-error-alert">
                                    <FiAlertCircle className="modal-error-icon" />
                                    <div className="modal-error-text">
                                        <strong>Validation Error:</strong> {errorMsg.replace("Validation Error: ", "")}
                                    </div>
                                    <button type="button" className="modal-error-close" onClick={() => setErrorMsg("")}>
                                        <FiX />
                                    </button>
                                </div>
                            )}

                            {activeModalTab === "overview" && (
                                <div className="overview-tab-content">
                                    <div className="detail-grid-4">
                                        <div className="detail-box">
                                            <span className="lbl">Brand &amp; Model</span>
                                            <span className="val">{selectedDevice.brand} {selectedDevice.model}</span>
                                        </div>
                                        <div className="detail-box">
                                            <span className="lbl">Category</span>
                                            <span className="val">{selectedDevice.categoryName || "E-Waste"}</span>
                                        </div>
                                        <div className="detail-box">
                                            <span className="lbl">Weight &amp; Quantity</span>
                                            <span className="val">{selectedDevice.weight || 1} kg ({selectedDevice.quantity || 1} unit)</span>
                                        </div>
                                        <div className="detail-box">
                                            <span className="lbl">Condition</span>
                                            <span className="val">{selectedDevice.condition || "Used"}</span>
                                        </div>
                                        <div className="detail-box">
                                            <span className="lbl">Working State</span>
                                            <span className="val">{selectedDevice.working || "Functional"}</span>
                                        </div>
                                        <div className="detail-box">
                                            <span className="lbl">Citizen Preference</span>
                                            <span className="val">{selectedDevice.processingPreference || "Eco Recycling"}</span>
                                        </div>
                                        <div className="detail-box">
                                            <span className="lbl">Pickup Date</span>
                                            <span className="val">{selectedDevice.pickupDate ? new Date(selectedDevice.pickupDate).toLocaleDateString() : "Scheduled"}</span>
                                        </div>
                                        <div className="detail-box">
                                            <span className="lbl">Time Slot</span>
                                            <span className="val">{selectedDevice.timeSlot || "Standard"}</span>
                                        </div>
                                        <div className="detail-box" style={{ background: "linear-gradient(135deg, #fffbe6 0%, #fef3c7 100%)", border: "1px solid #fde68a" }}>
                                            <span className="lbl" style={{ color: "#b45309", fontWeight: 700 }}><FiClock /> Inspection Deadline</span>
                                            <span className="val" style={{ color: "#78350f", fontWeight: 800 }}>
                                                {selectedDevice.inspectionDeadline
                                                    ? new Date(selectedDevice.inspectionDeadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                                                    : "Within 72 Hours"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeModalTab === "diagnostics" && (() => {
                                const totalScore = hardwareTests.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
                                const avgScore = hardwareTests.length > 0 ? Math.round(totalScore / hardwareTests.length) : 100;
                                const categoryKey = getCategoryKey(selectedDevice);

                                return (
                                    <div className="diagnostics-tab-content">
                                        {/* Physical Visual Inspection Section */}
                                        <div style={{ marginBottom: "1.2rem", background: "#f8fafc", padding: "0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                            <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.6rem" }}>
                                                1. Physical Visual Inspection
                                            </span>
                                            <div className="form-group-row">
                                                <div className="form-field">
                                                    <label>Physical Casing Condition</label>
                                                    <select value={physicalCondition} onChange={(e) => setPhysicalCondition(e.target.value)}>
                                                        <option value="Excellent">Excellent (No scratches)</option>
                                                        <option value="Good">Good (Minor scuffs)</option>
                                                        <option value="Fair">Fair (Noticeable wear)</option>
                                                        <option value="Damaged">Damaged (Cracked/Dented)</option>
                                                    </select>
                                                </div>

                                                <div className="form-field">
                                                    <label>Screen & Body Integrity</label>
                                                    <select value={screenIntegrity} onChange={(e) => setScreenIntegrity(e.target.value)}>
                                                        <option value="Intact">Intact / No Cracks</option>
                                                        <option value="Minor Scratches">Minor Scratches</option>
                                                        <option value="Cracked Screen">Cracked Screen / Body Dent</option>
                                                        <option value="Display Fault">Display Fault / Major Damage</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hardware Diagnostic Matrix Section */}
                                        <div className="hardware-diag-section">
                                            <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                2. Hardware Diagnostic Testing Matrix ({hardwareTests.length} Tests for {categoryKey.toUpperCase()})
                                            </span>

                                            <div className="diag-header-summary">
                                                <div className="diag-score-badge-box">
                                                    <span className="lbl">Hardware Diagnostic Score</span>
                                                    <div className="score-main-val">
                                                        <span className={`score-number ${avgScore >= 85 ? "score--high" : avgScore >= 65 ? "score--mid" : avgScore >= 45 ? "score--fair" : "score--low"}`}>
                                                            {avgScore}%
                                                        </span>
                                                        <span className="score-status-tag">
                                                            {avgScore >= 85 ? "✓ Grade A (Prime Refurbish)" : avgScore >= 65 ? "✓ Grade B (Standard Refurbish)" : avgScore >= 45 ? "⚠ Grade C (Parts Harvest)" : "✕ Grade D (Recycle)"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="diag-quick-actions">
                                                    <button type="button" className="diag-btn diag-btn--pass" onClick={() => markAllTests("Working", 100, "Tested OK")}>
                                                        <FiCheckCircle /> Mark All Working
                                                    </button>
                                                    <button type="button" className="diag-btn diag-btn--fair" onClick={() => markAllTests("Fair", 60, "Capacity / Wear Note")}>
                                                        <FiAlertCircle /> Mark All Fair
                                                    </button>
                                                    <button type="button" className="diag-btn diag-btn--fail" onClick={() => markAllTests("Not Working", 0, "Component Faulty")}>
                                                        <FiX /> Mark All Faulty
                                                    </button>
                                                </div>

                                                {/* Hardware Component Testing Table */}
                                                <div className="hardware-test-table-wrap">
                                                    <table className="hardware-test-table">
                                                        <thead>
                                                            <tr>
                                                                <th style={{ width: "25%" }}>Hardware Component</th>
                                                                <th style={{ width: "35%" }}>Test Result</th>
                                                                <th style={{ width: "10%", textAlign: "center" }}>Score (%)</th>
                                                                <th style={{ width: "30%" }}>Technician Remarks</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {hardwareTests.map((test, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="comp-name-td">
                                                                        <div className="comp-name-inner">
                                                                            <span className="comp-icon"><FiCpu /></span>
                                                                            <span className="comp-title">{test.component}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="comp-status-td">
                                                                        <div className="status-toggle-group">
                                                                            <button
                                                                                type="button"
                                                                                className={`diag-status-toggle-btn toggle-working ${test.result === "Working" ? "active" : ""}`}
                                                                                onClick={() => updateTestItem(idx, "Working", 100, test.remarks === "Defective / Not working" ? "Working fine" : test.remarks)}
                                                                            >
                                                                                ✓ Working
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className={`diag-status-toggle-btn toggle-fair ${test.result === "Fair" ? "active" : ""}`}
                                                                                onClick={() => updateTestItem(idx, "Fair", 60, test.remarks)}
                                                                            >
                                                                                ⚠ Fair
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className={`diag-status-toggle-btn toggle-faulty ${test.result === "Not Working" ? "active" : ""}`}
                                                                                onClick={() => updateTestItem(idx, "Not Working", 0, test.remarks === "No issue" || test.remarks === "Working fine" ? "Component not detected / broken" : test.remarks)}
                                                                            >
                                                                                ✕ Not Working
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                    <td className="comp-score-td">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            className="score-input-box"
                                                                            value={test.score}
                                                                            onChange={(e) => updateTestItem(idx, test.result, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)), test.remarks)}
                                                                        />
                                                                    </td>
                                                                    <td className="comp-remarks-td">
                                                                        <input
                                                                            type="text"
                                                                            className={`remarks-input-box ${submittedAttempt && (!test.remarks || !test.remarks.trim()) ? "input-validation-error" : ""}`}
                                                                            placeholder="e.g. No issue / Capacity reduced"
                                                                            value={test.remarks || ""}
                                                                            onChange={(e) => updateTestItem(idx, test.result, test.score, sanitizeText(e.target.value))}
                                                                        />
                                                                        {submittedAttempt && (!test.remarks || !test.remarks.trim()) && (
                                                                            <span className="live-field-error">
                                                                                Remarks cannot be empty (no special characters)
                                                                            </span>
                                                                        )}
                                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                                                                            <label className="attach-photo-btn inline-part-photo-btn" title={`Upload photos for ${test.component} (JPG, PNG, WEBP - Max 5MB)`}>
                                                                                <FiCamera /> {(test.photos || []).length > 0 ? `+ Add Photo (${test.photos.length})` : "+ Upload Photo"}
                                                                                <input
                                                                                    type="file"
                                                                                    multiple
                                                                                    accept="image/*"
                                                                                    onChange={(e) => handlePartPhotosAdd(idx, e)}
                                                                                    hidden
                                                                                />
                                                                            </label>
                                                                            <div className="part-photos-container" style={{ display: "inline-flex", gap: "0.25rem" }}>
                                                                                {(test.photos || []).map((photo) => (
                                                                                    <div key={photo.id} className="part-photo-item">
                                                                                        <img
                                                                                            src={photo.dataUrl}
                                                                                            alt={photo.name}
                                                                                            className="part-photo-img"
                                                                                            onClick={() => setPreviewImageModal(photo.dataUrl)}
                                                                                            title={`Click to view ${photo.name}`}
                                                                                        />
                                                                                        <button
                                                                                            type="button"
                                                                                            className="part-photo-del-btn"
                                                                                            onClick={() => handleRemovePartPhoto(idx, photo.id)}
                                                                                            title="Remove Photo"
                                                                                        >
                                                                                            <FiX />
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-field full-width" style={{ marginTop: "1rem" }}>
                                            <label>Technical Diagnostic Notes &amp; Remarks</label>
                                            <textarea
                                                rows="2"
                                                className={`diag-notes-textarea ${submittedAttempt && (!diagnosticNotes || diagnosticNotes.trim().length <= 4) ? "textarea-validation-error" : ""}`}
                                                placeholder="Enter any additional hardware testing notes or refurbishment advice..."
                                                value={diagnosticNotes}
                                                onChange={(e) => setDiagnosticNotes(sanitizeText(e.target.value))}
                                            ></textarea>
                                            {submittedAttempt && (!diagnosticNotes || diagnosticNotes.trim().length <= 4) && (
                                                <span className="live-field-error">
                                                    Technical Diagnostic Notes &amp; Remarks length must be greater than 4 characters (no special characters allowed)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {activeModalTab === "routing" && (
                                <div className="routing-tab-content">
                                    <div className="form-field full-width">
                                        <label>Overall Quality Grade</label>
                                        <select value={qualityGrade} onChange={(e) => setQualityGrade(e.target.value)}>
                                            <option value="Grade A">Grade A — Prime Refurbish Condition</option>
                                            <option value="Grade B">Grade B — Standard Refurbish Condition</option>
                                            <option value="Grade C">Grade C — Useful Spare Parts Harvest</option>
                                            <option value="Grade D">Grade D — End-of-Life Material Recycling</option>
                                        </select>
                                    </div>

                                    <div className="form-field full-width">
                                        <label>Recommended Destination Hub</label>
                                        <div className="destination-radio-group">
                                            <label className={`radio-card ${wasteDestination === "Refurbishment Center" ? "selected" : ""}`}>
                                                <input
                                                    type="radio"
                                                    name="destination"
                                                    value="Refurbishment Center"
                                                    checked={wasteDestination === "Refurbishment Center"}
                                                    onChange={(e) => setWasteDestination(e.target.value)}
                                                />
                                                <div className="radio-content">
                                                    <h5>Refurbishment Facility</h5>
                                                    <p>Route reusable hardware for restoration, cleanup &amp; resale</p>
                                                </div>
                                            </label>

                                            <label className={`radio-card ${wasteDestination === "Recycling Center" ? "selected" : ""}`}>
                                                <input
                                                    type="radio"
                                                    name="destination"
                                                    value="Recycling Center"
                                                    checked={wasteDestination === "Recycling Center"}
                                                    onChange={(e) => setWasteDestination(e.target.value)}
                                                />
                                                <div className="radio-content">
                                                    <h5>E-Waste Recycling Center</h5>
                                                    <p>Route non-functional components for eco-friendly material extraction</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn--secondary"
                                style={{ color: "#059669", borderColor: "#a7f3d0", background: "#ecfdf5", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                                onClick={() => handleDownloadDevicePdf(selectedDevice)}
                            >
                                <FiDownload /> Download device details
                            </button>
                            <button className="btn btn--secondary" onClick={() => { setSelectedDevice(null); setSubmittedAttempt(false); }}>Cancel</button>
                            <button
                                className="btn btn--primary"
                                onClick={handleSubmitInspection}
                                disabled={processingId === selectedDevice.deviceId}
                            >
                                {processingId === selectedDevice.deviceId ? (
                                    <><FiRefreshCw className="spin-icon" /> Submitting Report...</>
                                ) : (
                                    <><FiCheckCircle /> Complete &amp; Route Device</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Confirm Receipt Modal */}
            {confirmModalItem && (
                <div className="modal-backdrop">
                    <div className="inspection-modal-card confirm-modal-card">
                        <div className="modal-header" style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "1.25rem 1.5rem" }}>
                            <div>
                                <h3 style={{ color: "#0f172a", margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>Confirm Device Receipt</h3>
                                <p style={{ color: "#64748b", margin: "0.2rem 0 0", fontSize: "0.8rem" }}>
                                    Verify physical handover for Device #{confirmModalItem.deviceId} ({confirmModalItem.brand} {confirmModalItem.model})
                                </p>
                            </div>
                            <button className="close-modal-btn" onClick={() => { setConfirmModalItem(null); setSubmittedAttempt(false); }}><FiX /></button>
                        </div>

                        <div className="modal-body-scroll">
                            {errorMsg && (
                                <div className="modal-error-alert">
                                    <FiAlertCircle className="modal-error-icon" />
                                    <div className="modal-error-text">
                                        <strong>Validation Error:</strong> {errorMsg.replace("Validation Error: ", "")}
                                    </div>
                                    <button type="button" className="modal-error-close" onClick={() => setErrorMsg("")}>
                                        <FiX />
                                    </button>
                                </div>
                            )}

                            <div className="form-field full-width">
                                <label>Verification Notes / Observations</label>
                                <textarea
                                    rows="3"
                                    className={`diag-notes-textarea ${submittedAttempt && (!receiptNotes || receiptNotes.trim().length <= 4) ? "textarea-validation-error" : ""}`}
                                    placeholder="Enter physical verification notes (e.g. Serial match verified, package intact)..."
                                    value={receiptNotes}
                                    onChange={(e) => setReceiptNotes(sanitizeText(e.target.value))}
                                ></textarea>
                                {submittedAttempt && (!receiptNotes || receiptNotes.trim().length <= 4) && (
                                    <span className="live-field-error">
                                        Verification Notes length must be greater than 4 characters (no special characters allowed)
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn--secondary" onClick={() => setConfirmModalItem(null)}>Cancel</button>
                            <button
                                className="btn btn--success"
                                onClick={handleConfirmReceipt}
                                disabled={processingId === confirmModalItem.deviceId}
                            >
                                {processingId === confirmModalItem.deviceId ? "Confirming..." : "Confirm & Accept Handover"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Photo Lightbox Modal */}
            {previewImageModal && (
                <div className="part-lightbox-overlay" onClick={() => setPreviewImageModal(null)}>
                    <div className="part-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="part-lightbox-close" onClick={() => setPreviewImageModal(null)}>
                            <FiX />
                        </button>
                        <img src={previewImageModal} alt="Enlarged Component Evidence" className="part-lightbox-img" />
                    </div>
                </div>
            )}

            {/* Handover Success & Inspection Deadline / Instructions Modal */}
            {handoverInstructionModal && (
                <div className="modal-backdrop" style={{ zIndex: 9999 }}>
                    <div className="inspection-modal-card" style={{ maxWidth: "580px", borderRadius: "20px", padding: "0", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
                        <div className="modal-header" style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#ffffff", padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", color: "#ffffff" }}>
                                    <FiCheckCircle />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#ffffff" }}>Device Handover Accepted!</h3>
                                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#a7f3d0", opacity: 0.9 }}>
                                        Entry added to inspection queue for Device #{handoverInstructionModal.device.deviceId}
                                    </p>
                                </div>
                            </div>
                            <button
                                className="close-modal-btn"
                                onClick={() => setHandoverInstructionModal(null)}
                                style={{ color: "#ffffff", background: "rgba(255, 255, 255, 0.15)", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="modal-body-scroll" style={{ padding: "1.5rem", background: "#f8fafc" }}>
                            {/* Device Info Summary */}
                            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <span style={{ fontSize: "0.725rem", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        Accepted Device
                                    </span>
                                    <h4 style={{ margin: "0.2rem 0 0 0", fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                                        {handoverInstructionModal.device.brand} {handoverInstructionModal.device.model}
                                    </h4>
                                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                        Category: {handoverInstructionModal.device.categoryName || "E-Waste Device"}
                                    </span>
                                </div>
                                <span style={{ padding: "0.35rem 0.85rem", borderRadius: "9999px", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", fontSize: "0.75rem", fontWeight: 700 }}>
                                    #DEV-{String(handoverInstructionModal.device.deviceId).padStart(3, "0")}
                                </span>
                            </div>

                            {/* Inspection Deadline Card */}
                            <div style={{ background: "linear-gradient(135deg, #fffbe6 0%, #fef3c7 100%)", border: "1px solid #fde68a", borderRadius: "14px", padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#f59e0b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>
                                    <FiClock />
                                </div>
                                <div>
                                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        Technician Inspection Deadline
                                    </div>
                                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#78350f", margin: "0.15rem 0" }}>
                                        {handoverInstructionModal.deadline}
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "#92400e" }}>
                                        Complete technical testing and destination routing before deadline.
                                    </div>
                                </div>
                            </div>

                            {/* Inspection Guidelines / Instructions */}
                            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1.25rem" }}>
                                <h4 style={{ margin: "0 0 0.85rem 0", fontSize: "0.9rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <FiFileText style={{ color: "#059669" }} /> Technical Inspection Instructions
                                </h4>
                                <ol style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.825rem", color: "#334155", display: "flex", flexDirection: "column", gap: "0.65rem", lineHeight: "1.45" }}>
                                    <li>
                                        <strong>Physical &amp; Cosmetic Audit:</strong> Verify serial number, casing integrity, screen glass, and check for unreported water or physical damages.
                                    </li>
                                    <li>
                                        <strong>Hardware Diagnostic Test:</strong> Test motherboard response, battery health, charging port status, and overall component functionality.
                                    </li>
                                    <li>
                                        <strong>Environmental Routing Decision:</strong> Determine the optimal final pathway: <em>Eco Recycling</em>, <em>Refurbishment</em>, or <em>Part Salvage</em>.
                                    </li>
                                    <li>
                                        <strong>Report Submission:</strong> Log technical scores, technician comments, and upload component evidence photos.
                                    </li>
                                </ol>
                            </div>
                        </div>

                        <div className="modal-footer" style={{ padding: "1rem 1.5rem", background: "#ffffff", borderTop: "1px solid #e2e8f0", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                            {(() => {
                                const deadStr = handoverInstructionModal.device?.inspectionDeadline || handoverInstructionModal.deadline;
                                const timeInfo = getRemainingTimeText(deadStr);
                                const isOverdue = timeInfo?.isOverdue || (deadStr && new Date(deadStr) < new Date());

                                if (isOverdue) {
                                    return (
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", justifyContent: "space-between" }}>
                                            <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "0.825rem", background: "#fef2f2", border: "1px solid #fca5a5", padding: "0.5rem 0.8rem", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                                                <FiAlertTriangle /> Inspection Deadline Expired — Contact Admin for Extension
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setHandoverInstructionModal(null)}
                                                style={{ padding: "0.6rem 1.25rem", borderRadius: "10px", background: "#64748b", border: "none", color: "#ffffff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    );
                                }

                                return (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const dev = handoverInstructionModal.device;
                                            setHandoverInstructionModal(null);
                                            if (dev) setSelectedDevice(dev);
                                        }}
                                        style={{ padding: "0.6rem 1.25rem", borderRadius: "10px", background: "#059669", border: "none", color: "#ffffff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                                    >
                                        Acknowledge &amp; Start Inspection
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DeviceInspection;
