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
    FiTag
} from "react-icons/fi";
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
    const [submittingAllocationId, setSubmittingAllocationId] = useState(null);
    const [notifications, setNotifications] = useState([]);

    const triggerToastMessage = (msg) => {
        setActionSuccessMessage(msg);
        setTimeout(() => setActionSuccessMessage(""), 3500);
    };

    const handleRequestAllocation = (device) => {
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
                `https://localhost:7102/api/Device/request-allocation/${deviceId}`,
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
            const response = await axios.get("https://localhost:7102/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data || []);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    };

    const totalNotifCount = notifications.filter(n => !n.isRead && !n.isread).length;

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const response = await axios.get("https://localhost:7102/api/User/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data || {};
            setUserProfile(data);
            const img = data.profilePicture || data.profileImage;
            if (img) {
                if (img.startsWith("http") || img.startsWith("data:")) {
                    setProfileImage(img);
                } else {
                    setProfileImage(`https://localhost:7102/uploads/profile/${img}`);
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
                response = await axios.get("https://localhost:7102/api/Device/MyDevices", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            } catch (err) {
                response = await axios.get("https://localhost:7102/api/Device/all", {
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
                `https://localhost:7102/api/Device/Delete/${deviceId}`,
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
                `https://localhost:7102/api/Device/Restore/${deviceId}`,
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

    const isAcceptedStatus = (status) => {
        const s = (status || "").toLowerCase();
        return s === "accepted" || s === "approved" || s === "active";
    };

    const getStatusStyle = (status, item = null) => {
        const statusLower = (status || "pending").toLowerCase();
        
        if (statusLower === "inactive" || statusLower === "deleted") {
            return {
                bg: "#fef2f2",
                color: "#dc2626",
                dot: "#ef4444",
                label: "Deleted"
            };
        }
        if (statusLower === "rejected") {
            return {
                bg: "#fef2f2",
                color: "#b91c1c",
                dot: "#ef4444",
                label: "Rejected"
            };
        }
        if (statusLower === "pending") {
            return {
                bg: "#fffbeb",
                color: "#b45309",
                dot: "#f59e0b",
                label: "Pending Review"
            };
        }
        if (statusLower === "completed" || statusLower === "recycled" || statusLower === "delivered") {
            return {
                bg: "#eff6ff",
                color: "#1d4ed8",
                dot: "#3b82f6",
                label: "Completed"
            };
        }

        return {
            bg: "#ecfdf5",
            color: "#047857",
            dot: "#10b981",
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
        return `https://localhost:7102/uploads/devices/${folderName}/${photoName}`;
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
            const isDone = statusLower === "completed" || statusLower === "rejected" || statusLower === "inactive" || statusLower === "deleted";
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
        const query = searchQuery.toLowerCase();

        const matchesSearch =
            brandModel.includes(query) ||
            serialNo.includes(query) ||
            modelNo.includes(query) ||
            address.includes(query) ||
            condition.includes(query);

        const statusStr = (item.status || "").toLowerCase();
        const matchesStatus =
            activeFilter === "All"
                ? statusStr !== "inactive" && statusStr !== "deleted"
                : activeFilter === "Pending"
                ? statusStr === "pending"
                : activeFilter === "Accepted"
                ? statusStr === "accepted" || statusStr === "approved" || statusStr === "active"
                : activeFilter === "Rejected"
                ? statusStr === "rejected"
                : activeFilter === "Completed"
                ? statusStr === "completed" || statusStr === "recycled"
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
                {/* Title & User Header Ribbon */}
                <div className="vd-ribbon" style={{ marginBottom: "1.75rem" }}>
                    <div>
                        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1a202c", margin: "0 0 0.25rem 0", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.025em" }}>
                            My Registered Devices
                        </h1>
                        <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, fontWeight: 500 }}>
                            View, manage, and track all electronic devices registered in your account.
                        </p>
                    </div>

                    <div className="vd-top-actions">
                        <button 
                            type="button" 
                            className="vd-circle-btn" 
                            title={`Notifications ${totalNotifCount > 0 ? `(${totalNotifCount} unread)` : ""}`} 
                            onClick={() => navigate("/technician-notification")}
                            style={{ position: "relative" }}
                        >
                            <FiBell />
                            {totalNotifCount > 0 && (
                                <span className="vd-notif-badge-pill" style={{
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
                                    {totalNotifCount > 9 ? "9+" : totalNotifCount}
                                </span>
                            )}
                        </button>

                        <Link 
                            to="/manage-userprofile" 
                            className="vd-user-profile-pill" 
                            style={{ textDecoration: "none", cursor: "pointer" }}
                            title="View & Edit Profile"
                        >
                            {profileImage ? (
                                <img src={profileImage} alt="User Avatar" className="vd-user-avatar" style={{ objectFit: "cover" }} />
                            ) : (
                                <div className="vd-user-avatar">{userName.charAt(0).toUpperCase()}</div>
                            )}
                            <div className="vd-user-info">
                                <span className="vd-user-name">{userName}</span>
                            </div>
                            <FiChevronDown style={{ color: "#718096", fontSize: "0.9rem", marginLeft: "0.2rem" }} />
                        </Link>
                    </div>
                </div>

                {/* Control Toolbar */}
                <div className="vd-controls-card">
                    {/* Search Input */}
                    <div className="vd-search-bar">
                        <FiSearch style={{ color: "#a0aec0" }} />
                        <input
                            type="text"
                            placeholder="Search brand, model, serial number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} style={{ border: "none", background: "none", cursor: "pointer", color: "#a0aec0" }}>
                                <FiX />
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs & View Mode Switcher */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
                        <div className="vd-filter-tabs">
                            {["All", "Pending", "Accepted", "Rejected", "Completed", "Deleted"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveFilter(tab)}
                                    className={`vd-tab-btn ${activeFilter === tab ? "active" : ""}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="pk-view-toggle">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`pk-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                                title="Grid View"
                            >
                                <FiGrid />
                            </button>
                            <button
                                onClick={() => setViewMode("table")}
                                className={`pk-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                                title="Table View"
                            >
                                <FiList />
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
                        <button onClick={loadMyDevices} style={{ background: "#635bff", color: "#ffffff", border: "none", padding: "0.6rem 1.25rem", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>
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
                        <Link to="/add-device" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#635bff", color: "#ffffff", padding: "0.65rem 1.25rem", borderRadius: "10px", fontWeight: 700, textDecoration: "none" }}>
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

                            return (
                                <div key={deviceId} className="vd-device-card">
                                    <div>
                                        {/* Card Photo Header */}
                                        <div className="vd-card-media">
                                            {frontPhotoUrl ? (
                                                <img
                                                    src={frontPhotoUrl}
                                                    alt={`${item.brand} ${item.model}`}
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
                                                <div style={{ fontSize: "1.8rem", marginBottom: "0.2rem" }}>
                                                    {category.icon}
                                                </div>
                                                <span style={{ fontSize: "0.775rem", fontWeight: 600 }}>{category.name}</span>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="vd-card-status-badge" style={{ background: status.bg, color: status.color }}>
                                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: status.dot }}></span>
                                                {status.label}
                                            </div>

                                            {/* Tag ID Badge */}
                                            <div className="vd-card-tag-id"></div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="vd-card-body">
                                            <h3 className="vd-card-title">{item.brand} {item.model}</h3>
                                            <span className="vd-card-sub">
                                                {item.modelNumber ? `Model: ${item.modelNumber}` : (item.serialNumber ? `SN: ${item.serialNumber}` : "Registered Electronics")}
                                            </span>

                                            <div className="vd-chip-row">
                                                <span className="vd-chip">Condition: <strong>{item.condition || "N/A"}</strong></span>
                                                <span className="vd-chip">Working: <strong>{item.working || "N/A"}</strong></span>
                                                {item.weight && <span className="vd-chip">Weight: <strong>{item.weight} kg</strong></span>}
                                                {item.quantity && <span className="vd-chip">Qty: <strong>{item.quantity}</strong></span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="vd-card-footer">
                                        <button onClick={() => setSelectedDevice(item)} className="vd-btn-inspect">
                                            <FiEye className="vd-btn-inspect-icon" /> Inspect
                                        </button>
                                        {(item.allocationRequested || item.AllocationRequested) && (
                                            <button
                                                onClick={() => setStickerModalDevice(item)}
                                                style={{
                                                    background: "#059669",
                                                    color: "#ffffff",
                                                    border: "none",
                                                    padding: "0.45rem 0.85rem",
                                                    borderRadius: "8px",
                                                    fontWeight: 700,
                                                    fontSize: "0.8rem",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "0.35rem",
                                                    cursor: "pointer",
                                                    boxShadow: "0 2px 4px rgba(5, 150, 105, 0.25)"
                                                }}
                                                title="Print Pickup Tag Sticker"
                                            >
                                                <FiPrinter /> Pickup Sticker
                                            </button>
                                        )}
                                        {!item.allocationRequested && !item.AllocationRequested && isAcceptedStatus(item.status) && (
                                            <button
                                                onClick={() => handleRequestAllocation(item)}
                                                style={{
                                                    background: "#635bff",
                                                    color: "#ffffff",
                                                    border: "none",
                                                    padding: "0.45rem 0.85rem",
                                                    borderRadius: "8px",
                                                    fontWeight: 700,
                                                    fontSize: "0.8rem",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "0.35rem",
                                                    cursor: "pointer",
                                                    boxShadow: "0 2px 4px rgba(99, 91, 255, 0.25)"
                                                }}
                                                title="Request Allocation"
                                            >
                                                <FiCpu /> Request Allocation
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
                                    <th>Brand & Model</th>
                                    <th>Weight</th>
                                    <th>Condition</th>
                                    <th>Status</th>
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
                                                <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#635bff" }}>#DEV-{deviceId}</span>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 700, color: "#1a202c" }}>{item.brand} {item.model}</div>
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
                                                 <span className="vd-card-status-badge" style={{ position: "static", display: "inline-flex", background: status.bg, color: status.color }}>
                                                     <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: status.dot }}></span>
                                                     {status.label}
                                                 </span>
                                            </td>
                                            <td>
                                                 <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                                     <button
                                                         onClick={() => setSelectedDevice(item)}
                                                         className="vd-btn-table-inspect"
                                                     >
                                                         <FiEye /> Inspect
                                                     </button>
                                                     {!item.allocationRequested && !item.AllocationRequested && isAcceptedStatus(item.status) && (
                                                         <button
                                                             onClick={() => handleRequestAllocation(item)}
                                                             style={{
                                                                 background: "#635bff",
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
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
                            <div>
                                <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1a202c", margin: "0.3rem 0 0 0" }}>
                                    {selectedDevice.brand} {selectedDevice.model}
                                </h2>
                            </div>
                            <button onClick={() => setSelectedDevice(null)} style={{ border: "none", background: "#edf2f7", borderRadius: "50%", width: "34px", height: "34px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <FiX />
                            </button>
                        </div>

                        {/* Status Strip */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f7fafc", padding: "0.75rem 1rem", borderRadius: "10px", marginBottom: "1.25rem" }}>
                            <span style={{ fontWeight: 700, color: "#4a5568", fontSize: "0.85rem" }}>Current Status</span>
                            {(() => {
                                const st = getStatusStyle(selectedDevice.status, selectedDevice);
                                return (
                                    <span className="vd-card-status-badge" style={{ position: "static", display: "inline-flex", background: st.bg, color: st.color }}>
                                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: st.dot }}></span>
                                        {st.label}
                                    </span>
                                );
                            })()}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem", fontSize: "0.875rem" }}>
                            <div style={{ background: "#f7fafc", padding: "0.85rem", borderRadius: "10px" }}>
                                <span style={{ color: "#718096", fontSize: "0.75rem", display: "block", fontWeight: 700 }}>BRAND</span>
                                <strong>{selectedDevice.brand || "N/A"}</strong>
                            </div>
                            <div style={{ background: "#f7fafc", padding: "0.85rem", borderRadius: "10px" }}>
                                <span style={{ color: "#718096", fontSize: "0.75rem", display: "block", fontWeight: 700 }}>MODEL</span>
                                <strong>{selectedDevice.model || "N/A"}</strong>
                            </div>
                            <div style={{ background: "#f7fafc", padding: "0.85rem", borderRadius: "10px" }}>
                                <span style={{ color: "#718096", fontSize: "0.75rem", display: "block", fontWeight: 700 }}>CONDITION</span>
                                <strong>{selectedDevice.condition || "N/A"}</strong>
                            </div>
                            <div style={{ background: "#f7fafc", padding: "0.85rem", borderRadius: "10px" }}>
                                <span style={{ color: "#718096", fontSize: "0.75rem", display: "block", fontWeight: 700 }}>WORKING STATE</span>
                                <strong>{selectedDevice.working || "N/A"}</strong>
                            </div>
                            <div style={{ background: "#f7fafc", padding: "0.85rem", borderRadius: "10px" }}>
                                <span style={{ color: "#718096", fontSize: "0.75rem", display: "block", fontWeight: 700 }}>WEIGHT</span>
                                <strong>{selectedDevice.weight ? `${selectedDevice.weight} kg` : "N/A"}</strong>
                            </div>
                        </div>

                        

                        {/* Photos */}
                        {(selectedDevice.frontPhoto || selectedDevice.backPhoto || selectedDevice.damagePhoto || selectedDevice.labelPhoto) && (
                            <div>
                                <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1a202c", marginBottom: "0.75rem" }}>Inspection Photos</h4>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.85rem" }}>
                                    {selectedDevice.frontPhoto && (
                                        <div onClick={() => setActivePhotoModal(getPhotoUrl(selectedDevice.frontPhoto, "FrontPhotos"))} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.4rem", textAlign: "center", cursor: "pointer" }}>
                                            <img src={getPhotoUrl(selectedDevice.frontPhoto, "FrontPhotos")} alt="Front" style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "6px", marginBottom: "0.25rem" }} />
                                            <span style={{ fontSize: "0.725rem", color: "#635bff", fontWeight: 700 }}>Front View </span>
                                        </div>
                                    )}
                                    {selectedDevice.backPhoto && (
                                        <div onClick={() => setActivePhotoModal(getPhotoUrl(selectedDevice.backPhoto, "BackPhotos"))} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.4rem", textAlign: "center", cursor: "pointer" }}>
                                            <img src={getPhotoUrl(selectedDevice.backPhoto, "BackPhotos")} alt="Back" style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "6px", marginBottom: "0.25rem" }} />
                                            <span style={{ fontSize: "0.725rem", color: "#635bff", fontWeight: 700 }}>Rear View </span>
                                        </div>
                                    )}
                                    {selectedDevice.damagePhoto && (
                                        <div onClick={() => setActivePhotoModal(getPhotoUrl(selectedDevice.damagePhoto, "DamagePhotos"))} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.4rem", textAlign: "center", cursor: "pointer" }}>
                                            <img src={getPhotoUrl(selectedDevice.damagePhoto, "DamagePhotos")} alt="Damage" style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "6px", marginBottom: "0.25rem" }} />
                                            <span style={{ fontSize: "0.725rem", color: "#635bff", fontWeight: 700 }}>Damage View </span>
                                        </div>
                                    )}
                                    {selectedDevice.labelPhoto && (
                                        <div onClick={() => setActivePhotoModal(getPhotoUrl(selectedDevice.labelPhoto, "LabelPhotos"))} style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.4rem", textAlign: "center", cursor: "pointer" }}>
                                            <img src={getPhotoUrl(selectedDevice.labelPhoto, "LabelPhotos")} alt="Label" style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "6px", marginBottom: "0.25rem" }} />
                                            <span style={{ fontSize: "0.725rem", color: "#635bff", fontWeight: 700 }}>Label View </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Modal Action Bar */}
                        <div style={{ marginTop: "1.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {(selectedDevice.allocationRequested || selectedDevice.AllocationRequested) ? (
                                <button
                                    onClick={() => setStickerModalDevice(selectedDevice)}
                                    style={{
                                        background: "#059669",
                                        color: "#ffffff",
                                        border: "none",
                                        padding: "0.6rem 1.15rem",
                                        borderRadius: "8px",
                                        fontWeight: 700,
                                        fontSize: "0.85rem",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.4rem",
                                        cursor: "pointer"
                                    }}
                                >
                                    <FiPrinter /> Pickup Tag Sticker
                                </button>
                            ) : isAcceptedStatus(selectedDevice.status) ? (
                                <button
                                    onClick={() => handleRequestAllocation(selectedDevice)}
                                    style={{
                                        background: "#635bff",
                                        color: "#ffffff",
                                        border: "none",
                                        padding: "0.6rem 1.15rem",
                                        borderRadius: "8px",
                                        fontWeight: 700,
                                        fontSize: "0.85rem",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.4rem",
                                        cursor: "pointer"
                                    }}
                                >
                                    <FiCpu /> Request Allocation
                                </button>
                            ) : <div></div>}

                            {(selectedDevice.status || "").toLowerCase() === "inactive" || (selectedDevice.status || "").toLowerCase() === "deleted" ? (
                                <button
                                    onClick={() => restoreDevice(selectedDevice)}
                                    className="vd-btn-restore"
                                    style={{ width: "auto", padding: "0.6rem 1.25rem" }}
                                >
                                    <FiRotateCcw /> Restore Device Record
                                </button>
                            ) : (
                                <button
                                    onClick={() => setConfirmDeleteDevice(selectedDevice)}
                                    className="vd-btn-delete"
                                    style={{ width: "auto", padding: "0.6rem 1.25rem" }}
                                >
                                    <FiTrash2 /> Delete Device Record
                                </button>
                            )}
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
            {/* Allocation Request Information Modal */}
            {allocationModalDevice && (
                <div className="vd-modal-overlay" onClick={() => setAllocationModalDevice(null)}>
                    <div className="vd-confirm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px", width: "90%", padding: "1.75rem", textAlign: "left" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1a202c", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span>📦</span> How Allocation Works
                            </h3>
                            <button
                                onClick={() => setAllocationModalDevice(null)}
                                style={{ background: "none", border: "none", fontSize: "1.25rem", color: "#a0aec0", cursor: "pointer" }}
                            >
                                <FiX />
                            </button>
                        </div>

                        <p style={{ color: "#4a5568", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.1rem", fontWeight: 500, textAlign: "left" }}>
                            When you request allocation, your device will go through these simple steps:
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem", textAlign: "left" }}>
                            <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", background: "#f8fafc", padding: "0.75rem 0.9rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                <div style={{ background: "#635bff", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0, marginTop: "2px" }}>1</div>
                                <div>
                                    <div style={{ fontWeight: 700, color: "#1a202c", fontSize: "0.875rem" }}>Allocation Request</div>
                                    <div style={{ color: "#64748b", fontSize: "0.825rem", marginTop: "0.15rem", lineHeight: 1.4 }}>You submit your pickup request with your preferred date and time.</div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", background: "#f8fafc", padding: "0.75rem 0.9rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                <div style={{ background: "#635bff", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0, marginTop: "2px" }}>2</div>
                                <div>
                                    <div style={{ fontWeight: 700, color: "#1a202c", fontSize: "0.875rem" }}>Admin Review &amp; Allocation</div>
                                    <div style={{ color: "#64748b", fontSize: "0.825rem", marginTop: "0.15rem", lineHeight: 1.4 }}>Our admin team reviews your request and assigns a suitable Collection Agent and Technician.</div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", background: "#f8fafc", padding: "0.75rem 0.9rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                <div style={{ background: "#635bff", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0, marginTop: "2px" }}>3</div>
                                <div>
                                    <div style={{ fontWeight: 700, color: "#1a202c", fontSize: "0.875rem" }}>Device Pickup</div>
                                    <div style={{ color: "#64748b", fontSize: "0.825rem", marginTop: "0.15rem", lineHeight: 1.4 }}>The assigned collection agent collects your device from your selected address.</div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", background: "#f8fafc", padding: "0.75rem 0.9rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                <div style={{ background: "#635bff", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0, marginTop: "2px" }}>4</div>
                                <div>
                                    <div style={{ fontWeight: 700, color: "#1a202c", fontSize: "0.875rem" }}>Inspection</div>
                                    <div style={{ color: "#64748b", fontSize: "0.825rem", marginTop: "0.15rem", lineHeight: 1.4 }}>The device is delivered to our facility, where the assigned technician inspects its condition.</div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", background: "#f8fafc", padding: "0.75rem 0.9rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                <div style={{ background: "#635bff", color: "#fff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0, marginTop: "2px" }}>5</div>
                                <div>
                                    <div style={{ fontWeight: 700, color: "#1a202c", fontSize: "0.875rem" }}>Next Processing</div>
                                    <div style={{ color: "#64748b", fontSize: "0.825rem", marginTop: "0.15rem", lineHeight: 1.4 }}>Based on the inspection, your device is sent for refurbishment or recycling.</div>
                                </div>
                            </div>
                        </div>

                        <p style={{ color: "#4a5568", fontSize: "0.875rem", marginBottom: "1.25rem", textAlign: "center", fontWeight: 600 }}>
                            Click "Request Allocation" to start the process.
                        </p>

                        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setAllocationModalDevice(null)}
                                style={{ background: "#f1f5f9", color: "#475569", border: "none", padding: "0.6rem 1.25rem", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeAllocationRequest}
                                disabled={submittingAllocationId === (allocationModalDevice.deviceId || allocationModalDevice.id)}
                                style={{ background: "#635bff", color: "#ffffff", border: "none", padding: "0.6rem 1.5rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                            >
                                {submittingAllocationId === (allocationModalDevice.deviceId || allocationModalDevice.id) ? "Submitting..." : "Request Allocation"}
                            </button>
                        </div>
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