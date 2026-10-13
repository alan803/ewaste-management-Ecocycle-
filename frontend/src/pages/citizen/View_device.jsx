import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiSearch,
    FiPlusCircle,
    FiEye,
    FiCpu,
    FiSmartphone,
    FiBatteryCharging,
    FiTv,
    FiClock,
    FiCheckCircle,
    FiAlertTriangle,
    FiRefreshCw,
    FiMapPin,
    FiCalendar,
    FiBox,
    FiGrid,
    FiList,
    FiX,
    FiBell,
    FiChevronDown,
    FiShield,
    FiTrash2,
    FiRotateCcw,
    FiXCircle,
    FiPrinter,
    FiTag,
    FiDollarSign,
    FiPercent,
    FiAward,
    FiTrendingUp,
    FiInfo,
    FiHelpCircle,
    FiTruck
} from "react-icons/fi";
import "./Citizendashboard.css";
import "./View_device.css";

function View_device() {
    const navigate = useNavigate();
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [activePhotoModal, setActivePhotoModal] = useState(null);
    const [confirmDeleteDevice, setConfirmDeleteDevice] = useState(null);
    const [cancelPickupDevice, setCancelPickupDevice] = useState(null);
    const [requestAgainDevice, setRequestAgainDevice] = useState(null);
    const [stickerModalDevice, setStickerModalDevice] = useState(null);
    const [actionSuccessMessage, setActionSuccessMessage] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [allocationModalDevice, setAllocationModalDevice] = useState(null);
    const [allocationModalStep, setAllocationModalStep] = useState(1);
    const [submittingAllocationId, setSubmittingAllocationId] = useState(null);
    const [notifications, setNotifications] = useState([]);

    const triggerToastMessage = (msg) => {
        setActionSuccessMessage(msg);
        setTimeout(() => setActionSuccessMessage(""), 3500);
    };

    const handleRequestAllocation = (device) => {
        setAllocationModalStep(1);
        setAllocationModalDevice(device);
    };

    const handlePrintSticker = (device) => {
        if (!device) return;
        const printWindow = window.open("", "_blank", "width=650,height=650");
        if (!printWindow) {
            alert("Please allow popup windows to print your device pickup tag sticker.");
            return;
        }

        const deviceIdVal = device.deviceId || device.id;
        const deviceCode = `#EC-${deviceIdVal}`;
        const devQrToken = device.deviceQrToken || device.DeviceQrToken || `ECOQR-DEV-${deviceIdVal}`;
        const serialNo = device.serialNumber || `EC-SN-${deviceIdVal}`;
        const userCityVal = device.userCity || device.city || "Kochi";
        const userPinVal = device.userPincode || device.pincode || "682001";
        const techPinVal = device.techPincode || "682030";
        
        const fromAddress = `${device.address || device.landmark || "Citizen Pickup Location"}, ${userCityVal} - PIN: ${userPinVal}`;
        const toAddress = device.assignedTechnicianCenter 
            ? `${device.assignedTechnicianCenter} - PIN: ${techPinVal}`
            : `${device.assignedTechnicianCenterName || "EcoCycle Regional Inspection Center"}, ${device.assignedTechnicianCenterAddress || "Industrial Facility Hub"} - PIN: ${techPinVal}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(devQrToken)}`;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>EcoCycle Shipping Tag Sticker - ${deviceCode}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; background: #ffffff; text-align: center; color: #0f172a; }
                    .sticker-box { border: 2px solid #0f172a; border-radius: 12px; padding: 18px; max-width: 480px; margin: 0 auto; text-align: left; background: #ffffff; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
                    .sticker-header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
                    .sticker-brand { font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #0f172a; }
                    .sticker-code { font-size: 22px; font-weight: 900; color: #059669; font-family: monospace; }
                    .badge { background: #0f172a; color: #ffffff; font-size: 10px; font-weight: 800; padding: 5px 10px; border-radius: 4px; letter-spacing: 0.5px; }
                    .grid { display: flex; gap: 16px; align-items: center; margin-bottom: 14px; }
                    .qr-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px; background: #ffffff; text-align: center; width: 120px; flex-shrink: 0; }
                    .qr-img { width: 110px; height: 110px; display: block; margin: 0 auto; }
                    .qr-label { font-size: 9px; font-weight: 800; color: #64748b; margin-top: 4px; letter-spacing: 0.5px; }
                    .details { font-size: 13px; color: #334155; line-height: 1.6; flex-grow: 1; }
                    .details-row { display: flex; margin-bottom: 3px; }
                    .details-label { width: 95px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
                    .details-val { font-weight: 700; color: #0f172a; }
                    .manifest-section { border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 14px; }
                    .manifest-block { padding: 8px 12px; font-size: 12px; }
                    .from-block { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
                    .to-block { background: #f0fdf4; }
                    .block-title { font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 2px; }
                    .from-title { color: #475569; }
                    .to-title { color: #059669; }
                    .block-text { font-weight: 700; color: #0f172a; line-height: 1.4; }
                    .footer { border-top: 1.5px solid #0f172a; padding-top: 8px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; font-weight: 600; }
                    .notice { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; margin-top: 12px; font-size: 11px; color: #475569; text-align: center; }
                </style>
            </head>
            <body>
                <div class="sticker-box">
                    <div class="sticker-header">
                        <div>
                            <div class="sticker-brand">EcoCycle Logistics Manifest</div>
                            <div class="sticker-code">${deviceCode}</div>
                        </div>
                    </div>

                    <div class="grid">
                        <div class="qr-box">
                            <img src="${qrUrl}" class="qr-img" alt="Scan QR Code" />
                            <div class="qr-label">SCAN HANDOVER</div>
                        </div>
                        <div class="details">
                            <div class="details-row"><span class="details-label">Item:</span><span class="details-val">${device.brand} ${device.model}</span></div>
                            <div class="details-row"><span class="details-label">Serial No:</span><span class="details-val" style="font-family: monospace; color: #2563eb;">${serialNo}</span></div>
                            <div class="details-row"><span class="details-label">Condition:</span><span class="details-val">${device.condition || "Declared"} (${device.working || "N/A"})</span></div>
                        </div>
                    </div>

                    <div class="manifest-section">
                        <div class="manifest-block from-block">
                            <div class="block-title from-title">SHIP FROM (ORIGIN):</div>
                            <div class="block-text">${fromAddress}</div>
                        </div>
                        <div class="manifest-block to-block">
                            <div class="block-title to-title">SHIP TO (DESTINATION):</div>
                            <div class="block-text">${toAddress}</div>
                        </div>
                    </div>

                    <div class="footer">
                        <div>Manifest Tag ID: <strong>${deviceCode}</strong></div>
                        <div>EcoCycle Logistics System</div>
                    </div>
                    <div class="notice">
                        Official E-Waste Tag: Attach securely to physical device prior to collection agent pickup.
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const executeAllocationRequest = async () => {
        if (!allocationModalDevice) return;
        const deviceId = allocationModalDevice.deviceId || allocationModalDevice.id;
        const targetDev = allocationModalDevice;
        const token = localStorage.getItem("token");
        try {
            setSubmittingAllocationId(deviceId);
            await axios.post(
                `https://ecocycle.runasp.net/api/Device/request-allocation/${deviceId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setDevices(prev =>
                prev.map(d =>
                    (d.deviceId || d.id) === deviceId ? { ...d, allocationRequested: true, AllocationRequested: true } : d
                )
            );

            triggerToastMessage("Allocation request submitted! Print your device tag sticker below.");
            setAllocationModalDevice(null);
            setStickerModalDevice({ ...targetDev, allocationRequested: true, AllocationRequested: true });
        } catch (err) {
            console.error("Error requesting allocation:", err);
            const msg = err.response?.data?.message || "Failed to submit allocation request.";
            triggerToastMessage(msg);
        } finally {
            setSubmittingAllocationId(null);
        }
    };

    useEffect(() => {
        loadMyDevices();
        fetchUserProfile();
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const [notifRes, devRes] = await Promise.all([
                axios.get("https://ecocycle.runasp.net/api/Notificationcon/my_notifications", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get("https://ecocycle.runasp.net/api/Device/MyDevices", {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: [] }))
            ]);
            const raw = notifRes.data || [];
            const citizenDevices = Array.isArray(devRes.data) ? devRes.data : [];

            let currentLoginId = localStorage.getItem("loginId");
            if (!currentLoginId && token) {
                try {
                    const payload = JSON.parse(atob(token.split(".")[1]));
                    currentLoginId = payload.sub || payload.nameid || payload.LoginId;
                } catch (e) {}
            }
            const currentUserName = (localStorage.getItem("citizen_fullName") || localStorage.getItem("firstName") || "").toLowerCase().trim();

            const notifs = raw.filter(n => {
                const notifLoginId = n.loginId ?? n.LoginId;
                if (notifLoginId && currentLoginId && String(notifLoginId) !== String(currentLoginId)) return false;
                const msg = (n.message ?? n.Message ?? "").toLowerCase();
                const title = (n.title ?? n.Title ?? "").toLowerCase();

                if (currentUserName && currentUserName.length > 2 && msg.startsWith("hello ")) {
                    const firstWords = msg.replace("hello ", "").split(/[,.!]/)[0].trim();
                    if (firstWords && !currentUserName.includes(firstWords.split(" ")[0]) && !firstWords.includes(currentUserName.split(" ")[0])) return false;
                }

                const devIdMatch = msg.match(/(?:device\s*#|device\s*id\s*#?|#)(\d+)/i) || title.match(/(?:device\s*#|#)(\d+)/i);
                if (devIdMatch) {
                    const matchedDevId = parseInt(devIdMatch[1], 10);
                    const userOwnsDevice = citizenDevices.some(d => (d.deviceId ?? d.DeviceId ?? d.id) === matchedDevId);
                    if (!userOwnsDevice) return false;
                } else if (citizenDevices.length === 0) {
                    const isDeviceNotif = title.includes("inspection") || title.includes("handover") || title.includes("pickup") || title.includes("device") || msg.includes("handover") || msg.includes("inspection") || msg.includes("pickup");
                    if (isDeviceNotif) return false;
                }

                return true;
            });
            setNotifications(notifs);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    };

    const totalNotifCount = notifications.filter(n => !n.isRead && !n.isread).length;

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const response = await axios.get("https://ecocycle.runasp.net/api/User/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data || {};
            setUserProfile(data);
            const img = data.profilePicture || data.profileImage;
            if (img) {
                if (img.startsWith("http") || img.startsWith("data:")) {
                    setProfileImage(img);
                } else {
                    setProfileImage(`https://ecocycle.runasp.net/uploads/profile/${img}`);
                }
            } else {
                const savedImage = localStorage.getItem("citizen_profile_image");
                if (savedImage) setProfileImage(savedImage);
            }
        } catch (err) {
            console.error("Error loading user profile in View_device:", err);
        }
    };

    const loadMyDevices = async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            let response;
            try {
                response = await axios.get("https://ecocycle.runasp.net/api/Device/MyDevices", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            } catch (err) {
                response = await axios.get("https://ecocycle.runasp.net/api/Device/all", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }
            setDevices(response.data || []);
        } catch (err) {
            console.error("Error fetching devices:", err);
            setError("Failed to load your registered devices. Please verify your login session.");
        } finally {
            setLoading(false);
        }
    };

    const executeDeleteDevice = async () => {
        if (!confirmDeleteDevice) return;
        setIsDeleting(true);
        const deviceId = confirmDeleteDevice.deviceId || confirmDeleteDevice.id;
        const token = localStorage.getItem("token");

        try {
            await axios.post(
                `https://ecocycle.runasp.net/api/Device/Delete/${deviceId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Mark device as inactive/deleted or remove if permanently deleted
            setDevices(prev =>
                prev.map(d =>
                    (d.deviceId || d.id) === deviceId ? { ...d, status: "Inactive" } : d
                )
            );

            if (selectedDevice && (selectedDevice.deviceId || selectedDevice.id) === deviceId) {
                setSelectedDevice(null);
            }
            setConfirmDeleteDevice(null);
        } catch (err) {
            console.error("Error deleting device:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const restoreDevice = async (targetDevice) => {
        if (!targetDevice) return;
        const deviceId = targetDevice.deviceId || targetDevice.id;
        const token = localStorage.getItem("token");

        try {
            const response = await axios.post(
                `https://ecocycle.runasp.net/api/Device/Restore/${deviceId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const newStatus = response.data?.status || "Active";

            setDevices(prev =>
                prev.map(d =>
                    (d.deviceId || d.id) === deviceId ? { ...d, status: newStatus } : d
                )
            );

            if (selectedDevice && (selectedDevice.deviceId || selectedDevice.id) === deviceId) {
                setSelectedDevice(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            console.error("Error restoring device:", err);
        }
    };

    const userName = userProfile?.firstName 
        ? `${userProfile.firstName} ${userProfile.lastName || ""}`.trim()
        : localStorage.getItem("firstName") ||
          localStorage.getItem("userName") ||
          localStorage.getItem("username") ||
          localStorage.getItem("name") ||
          "Citizen Champion";

    const isDeviceCompleted = (item) => {
        if (!item) return false;
        if (item.isCenterCompleted || item.isRecyclingCompleted || item.isRefurbishmentCompleted) return true;
        const statusLower = (item.status || "").toLowerCase();
        const lifeLower = (item.lifecycleStatus || "").toLowerCase();
        const procLower = (item.processingLifecycleStatus || "").toLowerCase();
        const rcStatus = (item.recyclingStatus || "").toLowerCase();
        const rfStatus = (item.refurbishmentStatus || "").toLowerCase();

        return (
            statusLower === "completed" ||
            statusLower === "recycled" ||
            statusLower === "refurbished" ||
            lifeLower === "completed" ||
            lifeLower === "recycled" ||
            lifeLower === "refurbished" ||
            lifeLower === "processingcompleted" ||
            procLower === "completed" ||
            procLower === "recycled" ||
            procLower === "refurbished" ||
            procLower === "recyclingcompleted" ||
            procLower === "refurbishmentcompleted" ||
            rcStatus === "completed" ||
            rfStatus === "completed"
        );
    };

    const isAcceptedStatus = (status, item = null) => {
        if (item && isDeviceCompleted(item)) return false;
        const s = (status || "").toLowerCase().trim();
        const lcs = (item?.lifecycleStatus || "").toLowerCase().trim();
        return s === "accepted" || s === "approved" || s === "active" || lcs === "accepted" || lcs === "approved";
    };

    const getDeviceTitle = (brand, model) => {
        const b = (brand || "").trim();
        const m = (model || "").trim();
        if (!b) return m || "Electronic Device";
        if (!m) return b;
        if (m.toLowerCase().startsWith(b.toLowerCase())) return m;
        return `${b} ${m}`;
    };

    const getStatusStyle = (status, item = null) => {
        const statusLower = (status || "pending").toLowerCase();
        const lifeLower = (item?.lifecycleStatus || "").toLowerCase();
        const procLower = (item?.processingLifecycleStatus || "").toLowerCase();
        
        if (statusLower === "inactive" || statusLower === "deleted") {
            return {
                bg: "rgba(254, 242, 242, 0.95)",
                color: "#dc2626",
                dot: "#ef4444",
                label: "Deleted"
            };
        }
        if (statusLower === "rejected") {
            return {
                bg: "rgba(254, 242, 242, 0.95)",
                color: "#b91c1c",
                dot: "#ef4444",
                label: "Rejected"
            };
        }

        if (isDeviceCompleted(item) || statusLower === "completed" || statusLower === "recycled" || statusLower === "refurbished") {
            const isRecycle = item?.isRecyclingCompleted || 
                              statusLower === "recycled" || 
                              lifeLower === "recycled" || 
                              procLower.includes("recyc") || 
                              (item?.completedCenterType && item.completedCenterType.toLowerCase().includes("recycl"));

            const isRefurb = item?.isRefurbishmentCompleted || 
                             statusLower === "refurbished" || 
                             lifeLower === "refurbished" || 
                             procLower.includes("refurb") || 
                             (item?.completedCenterType && item.completedCenterType.toLowerCase().includes("refurb"));

            if (isRecycle) {
                return {
                    bg: "rgba(236, 253, 245, 0.95)",
                    color: "#059669",
                    dot: "#10b981",
                    label: "Recycled"
                };
            }
            if (isRefurb) {
                return {
                    bg: "rgba(239, 246, 255, 0.95)",
                    color: "#2563eb",
                    dot: "#3b82f6",
                    label: "Refurbished"
                };
            }
            return {
                bg: "rgba(236, 253, 245, 0.95)",
                color: "#059669",
                dot: "#10b981",
                label: "Completed"
            };
        }

        if (statusLower === "pending") {
            return {
                bg: "rgba(255, 251, 235, 0.95)",
                color: "#b45309",
                dot: "#f59e0b",
                label: "Pending"
            };
        }

        return {
            bg: "rgba(240, 253, 244, 0.95)",
            color: "#15803d",
            dot: "#22c55e",
            label: "Accepted"
        };
    };

    const getCategoryConfig = (brand, model) => {
        const text = `${brand || ""} ${model || ""}`.toLowerCase();
        if (text.includes("phone") || text.includes("mobile") || text.includes("iphone") || text.includes("galaxy") || text.includes("ipad")) {
            return {
                icon: <FiSmartphone />,
                name: "Mobile Device"
            };
        }
        if (text.includes("battery") || text.includes("ups") || text.includes("power") || text.includes("charger")) {
            return {
                icon: <FiBatteryCharging />,
                name: "Battery & Power"
            };
        }
        if (text.includes("tv") || text.includes("monitor") || text.includes("display") || text.includes("screen")) {
            return {
                icon: <FiTv />,
                name: "Display & Electronics"
            };
        }
        return {
            icon: <FiCpu />,
            name: "Computer & Hardware"
        };
    };

    const getPhotoUrl = (photoName, folderName) => {
        if (!photoName) return null;
        if (photoName.startsWith("http")) return photoName;
        return `https://ecocycle.runasp.net/uploads/devices/${folderName}/${photoName}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return dateString;
            return d.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });
        } catch {
            return dateString;
        }
    };

    const isPickupOverdue = (item) => {
        if (!item || !item.pickupDate) return false;
        try {
            const pDate = new Date(item.pickupDate);
            if (isNaN(pDate.getTime())) return false;
            pDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const statusLower = (item.status || "").toLowerCase();
            const isDone = isDeviceCompleted(item) || statusLower === "completed" || statusLower === "rejected" || statusLower === "inactive" || statusLower === "deleted";
            return pDate < today && !isDone;
        } catch {
            return false;
        }
    };

    const filteredDevices = devices.filter((item) => {
        const brandModel = `${item.brand || ""} ${item.model || ""}`.trim().toLowerCase();
        const serialNo = (item.serialNumber || "").toLowerCase();
        const modelNo = (item.modelNumber || "").toLowerCase();
        const address = (item.address || "").toLowerCase();
        const condition = (item.condition || "").toLowerCase();
        const centerName = (item.completedCenterName || item.recyclingCenterName || item.refurbishmentCenterName || "").toLowerCase();
        const query = searchQuery.toLowerCase();

        const matchesSearch =
            brandModel.includes(query) ||
            serialNo.includes(query) ||
            modelNo.includes(query) ||
            address.includes(query) ||
            condition.includes(query) ||
            centerName.includes(query);

        const statusStr = (item.status || "").toLowerCase();
        const completed = isDeviceCompleted(item);

        const matchesStatus =
            activeFilter === "All"
                ? statusStr !== "inactive" && statusStr !== "deleted"
                : activeFilter === "Pending"
                ? statusStr === "pending" && !completed
                : activeFilter === "Accepted"
                ? (statusStr === "accepted" || statusStr === "approved" || statusStr === "active") && !completed
                : activeFilter === "Rejected"
                ? statusStr === "rejected"
                : activeFilter === "Completed"
                ? completed
                : activeFilter === "Deleted"
                ? statusStr === "inactive" || statusStr === "deleted"
                : true;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="vd-page-layout">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="vd-main-content">

{/* Main Control Header Panel */}
                <div className="control-bar-panel">
                    <div>
                        <h3 style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif", fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.2rem", color: "#0f172a" }}>My Registered Devices</h3>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>View, manage, inspect, and track all electronic assets registered in your citizen account</p>
                    </div>

                    <div className="control-panel-right-group">
                        <div className="vd-inline-search">
                            <FiSearch style={{ color: "#94a3b8", fontSize: "0.85rem" }} />
                            <input
                                type="text"
                                placeholder="Search brand, model, serial..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="vd-search-clear-btn">
                                    <FiX style={{ fontSize: "0.8rem" }} />
                                </button>
                            )}
                        </div>

                        <div className="filter-pills">
                            {["All", "Pending", "Accepted", "Rejected", "Completed", "Deleted"].map((tab) => (
                                <button
                                    key={tab}
                                    className={`pill-btn ${activeFilter === tab ? "active" : ""}`}
                                    onClick={() => setActiveFilter(tab)}
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

                {/* Devices Display */}
                {loading ? (
                    <div className="vd-state-card">
                        <div className="loading-spinner" style={{ margin: "0 auto 1rem auto" }}></div>
                        <p style={{ color: "#718096", fontSize: "0.925rem" }}>Loading registered electronic devices...</p>
                    </div>
                ) : error ? (
                    <div className="vd-state-card">
                        <FiAlertTriangle style={{ fontSize: "2.5rem", color: "#d97706", marginBottom: "0.85rem" }} />
                        <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1a202c", marginBottom: "0.5rem" }}>Failed to Load Data</h3>
                        <p style={{ color: "#718096", marginBottom: "1.25rem", fontSize: "0.9rem" }}>{error}</p>
                        <button onClick={loadMyDevices} style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#ffffff", border: "none", padding: "0.6rem 1.25rem", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>
                            <FiRefreshCw /> Retry
                        </button>
                    </div>
                ) : filteredDevices.length === 0 ? (
                    <div className="vd-state-card">
                        <div className="vd-empty-icon">
                            <FiBox />
                        </div>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1a202c", marginBottom: "0.4rem" }}>No Devices Match Selection</h3>
                        <p style={{ color: "#718096", fontSize: "0.9rem", maxWidth: "400px", margin: "0 auto 1.5rem auto", lineHeight: 1.6 }}>
                            {searchQuery || activeFilter !== "All"
                                ? "No electronic devices match your current search query or active status filter."
                                : "You haven't submitted any electronic devices for eco-recycling yet."}
                        </p>
                        <Link to="/add-device" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#ffffff", padding: "0.65rem 1.25rem", borderRadius: "10px", fontWeight: 700, textDecoration: "none" }}>
                            <FiPlusCircle /> Submit Your First Device
                        </Link>
                    </div>
                ) : viewMode === "grid" ? (
                    /* GRID VIEW */
                    <div className="vd-devices-grid">
                        {filteredDevices.map((item, index) => {
                            const frontPhotoUrl = getPhotoUrl(item.frontPhoto, "FrontPhotos");
                            const deviceId = item.deviceId || item.id || index;
                            const status = getStatusStyle(item.status, item);
                            const category = getCategoryConfig(item.brand, item.model);
                            const title = getDeviceTitle(item.brand, item.model);

                            return (
                                <div key={deviceId} className="vd-device-card">
                                    <div>
                                        {/* Card Photo Header */}
                                        <div className="vd-card-media">
                                            {frontPhotoUrl ? (
                                                <img
                                                    src={frontPhotoUrl}
                                                    alt={title}
                                                    className="vd-card-img"
                                                    onError={(e) => {
                                                        e.target.style.display = "none";
                                                        if (e.target.nextSibling) {
                                                            e.target.nextSibling.style.display = "flex";
                                                        }
                                                    }}
                                                />
                                            ) : null}

                                            {/* Photo Fallback */}
                                            <div className="vd-card-media-fallback" style={{ display: frontPhotoUrl ? "none" : "flex" }}>
                                                <div style={{ fontSize: "1.85rem", marginBottom: "0.25rem", color: "#059669" }}>
                                                    {category.icon}
                                                </div>
                                                <span style={{ fontSize: "0.775rem", fontWeight: 600, color: "#64748b" }}>{category.name}</span>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="vd-card-body">
                                            <h3 className="vd-card-title">{title}</h3>
                                            <span className="vd-card-sub">
                                                {item.modelNumber ? `Model: ${item.modelNumber}` : (item.serialNumber ? `SN: ${item.serialNumber}` : "Registered Electronics")}
                                            </span>

                                            <div className="vd-chip-row">
                                                <span className="vd-chip">Condition: <strong>{item.condition || "N/A"}</strong></span>
                                                <span className="vd-chip">Working: <strong>{item.working || "N/A"}</strong></span>
                                                {item.weight && <span className="vd-chip">Weight: <strong>{item.weight} kg</strong></span>}
                                                {item.quantity && <span className="vd-chip">Qty: <strong>{item.quantity}</strong></span>}
                                            </div>

                                            {(item.completedCenterName || item.recyclingCenterName || item.refurbishmentCenterName) && (
                                                <div className={`vd-center-banner ${isDeviceCompleted(item) ? "completed" : ""}`}>
                                                    <div className="vd-center-banner-header">
                                                        <FiCheckCircle style={{ color: isDeviceCompleted(item) ? "#16a34a" : "#059669", flexShrink: 0 }} />
                                                        <span>{item.completedCenterType || "Processing Center"}: <strong>{item.completedCenterName || item.recyclingCenterName || item.refurbishmentCenterName}</strong></span>
                                                    </div>
                                                    {item.completedCenterCity && (
                                                        <div className="vd-center-banner-location">
                                                            <FiMapPin style={{ fontSize: "0.72rem", flexShrink: 0 }} />
                                                            <span>Location: {item.completedCenterCity}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="vd-card-footer">
                                        <button onClick={() => setSelectedDevice(item)} className="vd-btn-inspect">
                                            <FiEye className="vd-btn-inspect-icon" /> Inspect
                                        </button>
                                        {!isDeviceCompleted(item) && !item.allocationRequested && !item.AllocationRequested && isAcceptedStatus(item.status, item) && (
                                            <button
                                                onClick={() => handleRequestAllocation(item)}
                                                className="vd-btn-alloc"
                                                title="Request Allocation"
                                            >
                                                <FiCpu style={{ fontSize: "0.8rem", flexShrink: 0 }} /> <span>Request Allocation</span>
                                            </button>
                                        )}
                                        {!isDeviceCompleted(item) && (item.allocationRequested || item.AllocationRequested) && isAcceptedStatus(item.status, item) && (
                                            <button
                                                onClick={() => setStickerModalDevice(item)}
                                                className="vd-btn-sticker"
                                                title="Print Shipping Sticker"
                                            >
                                                <FiPrinter /> Tag Sticker
                                            </button>
                                        )}
                                        {(item.status || "").toLowerCase() === "inactive" || (item.status || "").toLowerCase() === "deleted" ? (
                                            <button
                                                onClick={() => restoreDevice(item)}
                                                className="vd-btn-restore"
                                                title="Restore Device"
                                            >
                                                <FiRotateCcw /> Restore
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDeleteDevice(item)}
                                                className="vd-btn-delete"
                                                title="Delete Device"
                                            >
                                                <FiTrash2 /> Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 ) : (
                     /* TABLE VIEW */
                     <div className="vd-table-panel">
                         <table className="vd-table">
                             <thead>
                                 <tr>
                                     <th>Tag ID</th>
                                     <th>Brand &amp; Model</th>
                                     <th>Weight</th>
                                     <th>Condition</th>
                                     <th>Center &amp; Status</th>
                                     <th>Action</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {filteredDevices.map((item, index) => {
                                     const deviceId = item.deviceId || item.id || index;
                                     const status = getStatusStyle(item.status, item);
                                     return (
                                         <tr key={deviceId}>
                                             <td>
                                                 <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#059669" }}>#DEV-{deviceId}</span>
                                             </td>
                                             <td>
                                                 <div style={{ fontWeight: 700, color: "#1a202c" }}>{getDeviceTitle(item.brand, item.model)}</div>
                                                 <div style={{ fontSize: "0.775rem", color: "#718096" }}>
                                                     {item.modelNumber ? `Model: ${item.modelNumber}` : (item.serialNumber ? `SN: ${item.serialNumber}` : "Electronics")}
                                                 </div>
                                             </td>
                                             <td>
                                                 <strong style={{ color: "#1a202c" }}>{item.weight ? `${item.weight} kg` : "N/A"}</strong>
                                             </td>
                                             <td>
                                                 <strong style={{ color: "#1a202c" }}>{item.condition || "N/A"}</strong>
                                                 <div style={{ fontSize: "0.75rem", color: "#718096" }}>{item.working ? `Working: ${item.working}` : ""}</div>
                                             </td>
                                             <td>
                                                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", alignItems: "flex-start" }}>
                                                      <span className="vd-card-status-badge" style={{ position: "static", display: "inline-flex", background: status.bg, color: status.color }}>
                                                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: status.dot }}></span>
                                                          {status.label}
                                                      </span>
                                                      {(item.completedCenterName || item.recyclingCenterName || item.refurbishmentCenterName) && (
                                                          <span style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 600 }}>
                                                              Center: {item.completedCenterName || item.recyclingCenterName || item.refurbishmentCenterName}
                                                          </span>
                                                      )}
                                                  </div>
                                             </td>
                                             <td>
                                                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                                      <button
                                                          onClick={() => setSelectedDevice(item)}
                                                          className="vd-btn-table-inspect"
                                                      >
                                                          <FiEye /> Inspect
                                                       </button>
                                                       {!isDeviceCompleted(item) && !item.allocationRequested && !item.AllocationRequested && isAcceptedStatus(item.status, item) && (
                                                           <button
                                                               onClick={() => handleRequestAllocation(item)}
                                                               style={{
                                                                   background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                                                                   color: "#ffffff",
                                                                   border: "none",
                                                                   padding: "0.35rem 0.65rem",
                                                                   borderRadius: "6px",
                                                                   fontWeight: 700,
                                                                   fontSize: "0.75rem",
                                                                   display: "inline-flex",
                                                                   alignItems: "center",
                                                                   gap: "0.3rem",
                                                                   cursor: "pointer"
                                                               }}
                                                               title="Request Allocation"
                                                           >
                                                               <FiCpu /> Request Allocation
                                                           </button>
                                                       )}
                                                      {(item.status || "").toLowerCase() === "inactive" || (item.status || "").toLowerCase() === "deleted" ? (
                                                          <button
                                                              onClick={() => restoreDevice(item)}
                                                              className="vd-btn-table-restore"
                                                              title="Restore Device"
                                                          >
                                                              <FiRotateCcw /> Restore
                                                          </button>
                                                      ) : (
                                                          <button
                                                              onClick={() => setConfirmDeleteDevice(item)}
                                                              className="vd-btn-table-delete"
                                                              title="Delete Device"
                                                          >
                                                              <FiTrash2 /> Delete
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
             </main>

            {/* Device Details Glass Modal */}
            {selectedDevice && (
                <div className="vd-modal-overlay" onClick={() => setSelectedDevice(null)}>
                    <div className="vd-modal-content" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="vd-modal-header">
                            <div className="vd-modal-header-info">
                                <span className="vd-modal-tag">Device Specification &amp; Status</span>
                                <h2 className="vd-modal-title">
                                    {getDeviceTitle(selectedDevice.brand, selectedDevice.model)}
                                </h2>
                            </div>
                            <button 
                                type="button" 
                                className="vd-modal-close-icon" 
                                onClick={() => setSelectedDevice(null)}
                                title="Close Modal"
                            >
                                <FiX />
                            </button>
                        </div>

                        {/* Status Strip */}
                        <div className="vd-modal-status-card">
                            <div className="vd-modal-status-label">
                                <span className="vd-modal-status-caption">Current Status:</span>
                                {(() => {
                                    const st = getStatusStyle(selectedDevice.status, selectedDevice);
                                    return (
                                        <span className="vd-modal-status-pill" style={{ background: st.bg, color: st.color }}>
                                            <span className="vd-modal-status-dot" style={{ background: st.dot }}></span>
                                            {st.label}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Center Processing Details Panel */}
                        {(selectedDevice.completedCenterName || selectedDevice.recyclingCenterName || selectedDevice.refurbishmentCenterName || isDeviceCompleted(selectedDevice)) && (
                            <div className="vd-modal-fulfillment-card">
                                <div className="vd-modal-fulfillment-header">
                                    <FiCheckCircle style={{ color: "#16a34a" }} /> Center Processing &amp; Fulfillment
                                </div>
                                <div className="vd-modal-fulfillment-grid">
                                    <div className="vd-modal-fulfillment-item">
                                        <span className="vd-modal-label">PROCESSING CENTER</span>
                                        <strong>{selectedDevice.completedCenterName || selectedDevice.recyclingCenterName || selectedDevice.refurbishmentCenterName || "EcoCycle Processing Hub"}</strong>
                                    </div>
                                    <div className="vd-modal-fulfillment-item">
                                        <span className="vd-modal-label">CENTER TYPE</span>
                                        <strong>{selectedDevice.completedCenterType || (selectedDevice.isRecyclingCompleted ? "Recycling Center" : "Refurbishment Center")}</strong>
                                    </div>
                                    {selectedDevice.completedCenterCity && (
                                        <div className="vd-modal-fulfillment-item">
                                            <span className="vd-modal-label">LOCATION</span>
                                            <strong>{selectedDevice.completedCenterCity}</strong>
                                        </div>
                                    )}
                                    {selectedDevice.completedAt && (
                                        <div className="vd-modal-fulfillment-item">
                                            <span className="vd-modal-label">COMPLETED DATE</span>
                                            <strong>{formatDate(selectedDevice.completedAt)}</strong>
                                        </div>
                                    )}
                                    {selectedDevice.certificateId && (
                                        <div className="vd-modal-fulfillment-item vd-modal-fulfillment-full">
                                            <span className="vd-modal-label">GREEN RECYCLING CERTIFICATE</span>
                                            <strong className="vd-modal-cert-id">{selectedDevice.certificateId}</strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Specs Grid */}
                        <div className="vd-modal-specs-grid">
                            <div className="vd-modal-spec-card">
                                <span className="vd-modal-spec-label">Brand</span>
                                <strong className="vd-modal-spec-val">{selectedDevice.brand || "N/A"}</strong>
                            </div>
                            <div className="vd-modal-spec-card">
                                <span className="vd-modal-spec-label">Model</span>
                                <strong className="vd-modal-spec-val">{selectedDevice.model || "N/A"}</strong>
                            </div>
                            <div className="vd-modal-spec-card">
                                <span className="vd-modal-spec-label">Condition</span>
                                <strong className="vd-modal-spec-val">{selectedDevice.condition || "N/A"}</strong>
                            </div>
                            <div className="vd-modal-spec-card">
                                <span className="vd-modal-spec-label">Working State</span>
                                <strong className="vd-modal-spec-val">{selectedDevice.working || "N/A"}</strong>
                            </div>
                            <div className="vd-modal-spec-card">
                                <span className="vd-modal-spec-label">Serial Number</span>
                                <strong className="vd-modal-spec-val">{selectedDevice.serialNumber || "N/A"}</strong>
                            </div>
                            <div className="vd-modal-spec-card">
                                <span className="vd-modal-spec-label">Purchase Date</span>
                                <strong className="vd-modal-spec-val">{selectedDevice.purchaseDate ? formatDate(selectedDevice.purchaseDate) : "N/A"}</strong>
                            </div>
                            <div className="vd-modal-spec-card">
                                <span className="vd-modal-spec-label">Device Weight</span>
                                <strong className="vd-modal-spec-val">{selectedDevice.weight ? `${selectedDevice.weight} kg` : "N/A"}</strong>
                            </div>
                            <div className="vd-modal-spec-card">
                                <span className="vd-modal-spec-label">Processing Preference</span>
                                <strong className="vd-modal-spec-val" style={{ textTransform: "capitalize" }}>{selectedDevice.processingPreference || "Valuation"}</strong>
                            </div>
                        </div>

                        {/* Photos */}
                        {(selectedDevice.frontPhoto || selectedDevice.backPhoto || selectedDevice.damagePhoto || selectedDevice.labelPhoto) && (
                            <div className="vd-modal-photos-section">
                                <h4 className="vd-modal-section-title">Inspection Photos</h4>
                                <div className="vd-modal-photos-grid">
                                    {selectedDevice.frontPhoto && (
                                        <div onClick={() => setActivePhotoModal(getPhotoUrl(selectedDevice.frontPhoto, "FrontPhotos"))} className="vd-modal-photo-card">
                                            <img src={getPhotoUrl(selectedDevice.frontPhoto, "FrontPhotos")} alt="Front" className="vd-modal-photo-img" />
                                            <span className="vd-modal-photo-tag">Front View</span>
                                        </div>
                                    )}
                                    {selectedDevice.backPhoto && (
                                        <div onClick={() => setActivePhotoModal(getPhotoUrl(selectedDevice.backPhoto, "BackPhotos"))} className="vd-modal-photo-card">
                                            <img src={getPhotoUrl(selectedDevice.backPhoto, "BackPhotos")} alt="Back" className="vd-modal-photo-img" />
                                            <span className="vd-modal-photo-tag">Rear View</span>
                                        </div>
                                    )}
                                    {selectedDevice.damagePhoto && (
                                        <div onClick={() => setActivePhotoModal(getPhotoUrl(selectedDevice.damagePhoto, "DamagePhotos"))} className="vd-modal-photo-card">
                                            <img src={getPhotoUrl(selectedDevice.damagePhoto, "DamagePhotos")} alt="Damage" className="vd-modal-photo-img" />
                                            <span className="vd-modal-photo-tag">Damage View</span>
                                        </div>
                                    )}
                                    {selectedDevice.labelPhoto && (
                                        <div onClick={() => setActivePhotoModal(getPhotoUrl(selectedDevice.labelPhoto, "LabelPhotos"))} className="vd-modal-photo-card">
                                            <img src={getPhotoUrl(selectedDevice.labelPhoto, "LabelPhotos")} alt="Label" className="vd-modal-photo-img" />
                                            <span className="vd-modal-photo-tag">Label View</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Modal Action Bar */}
                        <div className="vd-modal-actions-bar">
                            <div className="vd-modal-actions-left">
                                {!isDeviceCompleted(selectedDevice) && (selectedDevice.allocationRequested || selectedDevice.AllocationRequested) ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const dev = selectedDevice;
                                            setSelectedDevice(null);
                                            setStickerModalDevice(dev);
                                        }}
                                        className="vd-modal-action-btn vd-modal-btn-sticker"
                                    >
                                        <FiPrinter /> Pickup Tag Sticker
                                    </button>
                                ) : !isDeviceCompleted(selectedDevice) && isAcceptedStatus(selectedDevice.status, selectedDevice) ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const dev = selectedDevice;
                                            setSelectedDevice(null);
                                            handleRequestAllocation(dev);
                                        }}
                                        className="vd-modal-action-btn vd-modal-btn-alloc"
                                    >
                                        <FiCpu /> Request Allocation
                                    </button>
                                ) : null}
                            </div>

                            <div className="vd-modal-actions-right">
                                {(selectedDevice.status || "").toLowerCase() === "inactive" || (selectedDevice.status || "").toLowerCase() === "deleted" ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const dev = selectedDevice;
                                            setSelectedDevice(null);
                                            restoreDevice(dev);
                                        }}
                                        className="vd-modal-action-btn vd-modal-btn-restore"
                                    >
                                        <FiRotateCcw /> Restore Record
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const dev = selectedDevice;
                                            setSelectedDevice(null);
                                            setConfirmDeleteDevice(dev);
                                        }}
                                        className="vd-modal-action-btn vd-modal-btn-delete"
                                    >
                                        <FiTrash2 /> Delete Record
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setSelectedDevice(null)}
                                    className="vd-modal-action-btn vd-modal-btn-close"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Lightbox Modal */}
            {activePhotoModal && (
                <div onClick={() => setActivePhotoModal(null)} style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.85)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10000,
                    padding: "1rem"
                }}>
                    <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
                        <img src={activePhotoModal} alt="Expanded Inspection" style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: "12px", objectFit: "contain" }} />
                        <button onClick={() => setActivePhotoModal(null)} style={{ position: "absolute", top:"-15px", right: "-15px", background: "#ffffff", border: "none", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontWeight: 800 }}>✕</button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Glass Modal */}
            {confirmDeleteDevice && (
                <div className="vd-modal-overlay" onClick={() => !isDeleting && setConfirmDeleteDevice(null)}>
                    <div className="vd-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="vd-confirm-icon-wrapper">
                            <FiTrash2 style={{ fontSize: "1.8rem", color: "#dc2626" }} />
                        </div>
                        <h3 className="vd-confirm-title">Confirm Device Deletion</h3>
                        <p className="vd-confirm-text">
                            Are you sure you want to delete <strong>{confirmDeleteDevice.brand} {confirmDeleteDevice.model}</strong>
                        </p>
                        <div className="vd-confirm-actions">
                            <button
                                disabled={isDeleting}
                                onClick={() => setConfirmDeleteDevice(null)}
                                className="vd-confirm-cancel-btn"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isDeleting}
                                onClick={executeDeleteDevice}
                                className="vd-confirm-delete-btn"
                            >
                                {isDeleting ? "Deleting..." : <><FiTrash2 /> Confirm Delete</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Allocation Request Information Modal (Multi-Step: Process Steps -> Price & Payment Share) */}
            {allocationModalDevice && (
                <div className="vd-modal-overlay" onClick={() => setAllocationModalDevice(null)}>
                    <div className="vd-confirm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "580px", width: "90%", padding: "1.75rem", textAlign: "left", borderRadius: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
                            <div>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1a202c", margin: 0 }}>
                                    {allocationModalStep === 1 ? "How Allocation Works" : "Price and Payment Share"}
                                </h3>
                                <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, marginTop: "0.2rem" }}>
                                    Step {allocationModalStep} of 2 &bull; {allocationModalDevice.brand} {allocationModalDevice.model}
                                </div>
                            </div>
                            <button
                                onClick={() => setAllocationModalDevice(null)}
                                style={{ background: "none", border: "none", fontSize: "1.25rem", color: "#a0aec0", cursor: "pointer" }}
                            >
                                <FiX />
                            </button>
                        </div>

                        {allocationModalStep === 1 ? (
                            /* STEP 1: Process Steps */
                            <>
                                <p style={{ color: "#4a5568", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.1rem", fontWeight: 500, textAlign: "left" }}>
                                    When you request allocation, your device will go through these simple steps:
                                </p>

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem", textAlign: "left" }}>
                                    <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", background: "#f8fafc", padding: "0.75rem 0.9rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                        <div style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0, marginTop: "2px" }}>1</div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: "#1a202c", fontSize: "0.875rem" }}>Allocation Request</div>
                                            <div style={{ color: "#64748b", fontSize: "0.825rem", marginTop: "0.15rem", lineHeight: 1.4 }}>You submit your pickup request with your preferred date and time.</div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", background: "#f8fafc", padding: "0.75rem 0.9rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                        <div style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0, marginTop: "2px" }}>2</div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: "#1a202c", fontSize: "0.875rem" }}>Admin Review &amp; Allocation</div>
                                            <div style={{ color: "#64748b", fontSize: "0.825rem", marginTop: "0.15rem", lineHeight: 1.4 }}>Our admin team reviews your request and assigns a suitable Collection Agent and Technician.</div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", background: "#f8fafc", padding: "0.75rem 0.9rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                        <div style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0, marginTop: "2px" }}>3</div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: "#1a202c", fontSize: "0.875rem" }}>Device Pickup</div>
                                            <div style={{ color: "#64748b", fontSize: "0.825rem", marginTop: "0.15rem", lineHeight: 1.4 }}>The assigned collection agent collects your device from your selected address.</div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", background: "#f8fafc", padding: "0.75rem 0.9rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                        <div style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0, marginTop: "2px" }}>4</div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: "#1a202c", fontSize: "0.875rem" }}>Inspection &amp; Valuation</div>
                                            <div style={{ color: "#64748b", fontSize: "0.825rem", marginTop: "0.15rem", lineHeight: 1.4 }}>The device is delivered to our facility, where the assigned technician inspects its condition and assesses its value.</div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", background: "#f8fafc", padding: "0.75rem 0.9rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                        <div style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0, marginTop: "2px" }}>5</div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: "#1a202c", fontSize: "0.875rem" }}>Processing &amp; Settlement</div>
                                            <div style={{ color: "#64748b", fontSize: "0.825rem", marginTop: "0.15rem", lineHeight: 1.4 }}>Based on the inspection, your device is sent for refurbishment or recycling with payment or certificate issued.</div>
                                        </div>
                                    </div>
                                </div>

                                <p style={{ color: "#4a5568", fontSize: "0.875rem", marginBottom: "1.25rem", textAlign: "center", fontWeight: 600 }}>
                                    Click "Next" to view payment share details.
                                </p>

                                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                                    <button
                                        onClick={() => setAllocationModalDevice(null)}
                                        style={{ background: "#f1f5f9", color: "#475569", border: "none", padding: "0.6rem 1.25rem", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => setAllocationModalStep(2)}
                                        style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#ffffff", border: "none", padding: "0.6rem 1.5rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        ) : (
                            /* STEP 2: Payment Share Details */
                            <>
                                <p style={{ color: "#4a5568", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.1rem", fontWeight: 500, textAlign: "left" }}>
                                    Review the payment share and distribution for your device processing:
                                </p>

                                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.1rem", marginBottom: "1.25rem" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.85rem", color: "#475569", lineHeight: 1.55 }}>
                                        <div style={{ background: "#ffffff", padding: "0.9rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                            <strong style={{ color: "#1a202c", fontSize: "0.9rem", display: "block", marginBottom: "0.35rem" }}>Option A: Request Valuation (Refurbishment)</strong>
                                            Operating costs for collection, inspection, and logistics are reserved first. You receive <strong>70%</strong> of the remaining net value, while <strong>15%</strong> goes to the Recycling Center and <strong>15%</strong> to EcoCycle.
                                        </div>

                                        <div style={{ background: "#ffffff", padding: "0.9rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                            <strong style={{ color: "#1a202c", fontSize: "0.9rem", display: "block", marginBottom: "0.35rem" }}>Option B: Responsible Recycling (Donation)</strong>
                                            Voluntary recycling donation (no cash payout). 100% of material recovery value funds recycling operations, and you receive an official Green Recycling Certificate.
                                        </div>
                                    </div>
                                </div>

                                <p style={{ color: "#4a5568", fontSize: "0.875rem", marginBottom: "1.25rem", textAlign: "center", fontWeight: 600 }}>
                                    Click "Request Allocation" to start the process.
                                </p>

                                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                                    <button
                                        onClick={() => setAllocationModalStep(1)}
                                        style={{ background: "#f1f5f9", color: "#475569", border: "none", padding: "0.6rem 1.25rem", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={executeAllocationRequest}
                                        disabled={submittingAllocationId === (allocationModalDevice.deviceId || allocationModalDevice.id)}
                                        style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#ffffff", border: "none", padding: "0.6rem 1.5rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                                    >
                                        {submittingAllocationId === (allocationModalDevice.deviceId || allocationModalDevice.id) ? "Submitting..." : "Request Allocation"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Official Printable Pickup Tag Sticker Modal */}
            {stickerModalDevice && (
                <div className="vd-modal-overlay" onClick={() => setStickerModalDevice(null)}>
                    <div className="vd-confirm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px", width: "95%", padding: "1.5rem", borderRadius: "20px", background: "#ffffff" }}>
                        
                        {/* Header Ribbon */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ color: "#059669" }}>🏷️</span> Official E-Waste Pickup Tag Sticker
                            </h3>
                            <button onClick={() => setStickerModalDevice(null)} style={{ background: "none", border: "none", fontSize: "1.2rem", color: "#64748b", cursor: "pointer" }}>
                                <FiX />
                            </button>
                        </div>

                        {/* Instruction Notice */}
                        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "12px", padding: "0.85rem 1rem", marginBottom: "1.25rem", textAlign: "left" }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#065f46", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                                📌 Important Pickup Preparation Instruction
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#047857", lineHeight: 1.45 }}>
                                Please print or write down this official pickup tag and <strong>stick it securely onto your e-waste device surface</strong> before the Collection Agent arrives. The agent will scan this QR tag during physical handover.
                            </div>
                        </div>

                        {/* Printable Sticker Box Container */}
                        <div style={{ border: "2px solid #0f172a", borderRadius: "14px", padding: "1.25rem", background: "#ffffff", textAlign: "left", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
                            
                            {/* Sticker Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #0f172a", paddingBottom: "0.6rem", marginBottom: "0.85rem" }}>
                                <div>
                                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0f172a", letterSpacing: "1.2px", textTransform: "uppercase" }}>ECOCYCLE LOGISTICS MANIFEST</div>
                                    <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#059669", fontFamily: "monospace" }}>
                                        #EC-{stickerModalDevice.deviceId || stickerModalDevice.id}
                                    </div>
                                </div>
                            </div>

                            {/* Sticker Content Grid: QR Code + Details */}
                            {(() => {
                                const tokenVal = stickerModalDevice.deviceQrToken || stickerModalDevice.DeviceQrToken || `ECOQR-DEV-${stickerModalDevice.deviceId || stickerModalDevice.id}`;
                                const uCity = stickerModalDevice.userCity || stickerModalDevice.city || "Kochi";
                                const uPin = stickerModalDevice.userPincode || stickerModalDevice.pincode || "682001";
                                const tPin = stickerModalDevice.techPincode || "682030";

                                const fromAddrStr = `${stickerModalDevice.address || stickerModalDevice.landmark || "Citizen Pickup Location"}, ${uCity} - PIN: ${uPin}`;
                                const toAddrStr = stickerModalDevice.assignedTechnicianCenter 
                                    ? `${stickerModalDevice.assignedTechnicianCenter} - PIN: ${tPin}`
                                    : `${stickerModalDevice.assignedTechnicianCenterName || "EcoCycle Regional Inspection Center"}, ${stickerModalDevice.assignedTechnicianCenterAddress || "Industrial Facility Hub"} - PIN: ${tPin}`;

                                return (
                                    <>
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "1rem", alignItems: "center", marginBottom: "0.85rem" }}>
                                            
                                            {/* QR Code */}
                                            <div style={{ background: "#ffffff", padding: "0.4rem", border: "1px solid #cbd5e1", borderRadius: "8px", textAlign: "center" }}>
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(tokenVal)}`}
                                                    alt="Pickup QR Code"
                                                    style={{ width: "100%", height: "105px", objectFit: "contain" }}
                                                />
                                                <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "#64748b", marginTop: "2px", letterSpacing: "0.5px" }}>SCAN HANDOVER</div>
                                            </div>

                                            {/* Details List */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.825rem", color: "#334155" }}>
                                                <div style={{ display: "flex" }}><span style={{ width: "90px", fontSize: "0.7rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>ITEM:</span><span style={{ color: "#0f172a", fontWeight: 700 }}>{stickerModalDevice.brand} {stickerModalDevice.model}</span></div>
                                                <div style={{ display: "flex" }}><span style={{ width: "90px", fontSize: "0.7rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>SERIAL NO:</span><span style={{ fontFamily: "monospace", fontWeight: 700, color: "#2563eb" }}>{stickerModalDevice.serialNumber || `EC-SN-${stickerModalDevice.deviceId || stickerModalDevice.id}`}</span></div>
                                                {stickerModalDevice.purchaseDate && (
                                                    <div style={{ display: "flex" }}><span style={{ width: "90px", fontSize: "0.7rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>PURCHASED:</span><span style={{ color: "#0f172a", fontWeight: 700 }}>{formatDate(stickerModalDevice.purchaseDate)}</span></div>
                                                )}
                                                <div style={{ display: "flex" }}><span style={{ width: "90px", fontSize: "0.7rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>CONDITION:</span><span style={{ color: "#0f172a", fontWeight: 700 }}>{stickerModalDevice.condition || "Declared"} ({stickerModalDevice.working || "N/A"})</span></div>
                                            </div>
                                        </div>

                                        {/* FROM & TO Addresses */}
                                        <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden", marginBottom: "0.85rem" }}>
                                            <div style={{ background: "#f8fafc", padding: "0.55rem 0.75rem", borderBottom: "1px solid #e2e8f0", fontSize: "0.775rem" }}>
                                                <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#475569", letterSpacing: "0.8px", textTransform: "uppercase" }}>FROM:</div>
                                                <div style={{ color: "#0f172a", fontWeight: 700, marginTop: "0.15rem" }}>{fromAddrStr}</div>
                                            </div>

                                            <div style={{ background: "#f0fdf4", padding: "0.55rem 0.75rem", fontSize: "0.775rem" }}>
                                                <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#059669", letterSpacing: "0.8px", textTransform: "uppercase" }}>TO:</div>
                                                <div style={{ color: "#065f46", fontWeight: 700, marginTop: "0.15rem" }}>{toAddrStr}</div>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}

                            {/* Sticker Footer Notice */}
                            <div style={{ borderTop: "1.5px solid #0f172a", paddingTop: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.725rem", color: "#64748b", fontWeight: 600 }}>
                                <div>Manifest Tag ID: <strong>#EC-{stickerModalDevice.deviceId || stickerModalDevice.id}</strong></div>
                                <div>EcoCycle Logistics System</div>
                            </div>
                        </div>

                        {/* Print & Download Actions */}
                        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.25rem" }}>
                            <button
                                type="button"
                                style={{ background: "#f1f5f9", color: "#475569", border: "none", padding: "0.6rem 1rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}
                                onClick={() => setStickerModalDevice(null)}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#ffffff", border: "none", padding: "0.6rem 1.25rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                                onClick={() => handlePrintSticker(stickerModalDevice)}
                            >
                                <FiPrinter /> Print / Download Tag Sticker
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default View_device;