import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { QRCodeCanvas } from "qrcode.react";
import { FaQrcode } from "react-icons/fa";
import {
    FiTruck,
    FiAward,
    FiRefreshCw,
    FiPlusCircle,
    FiClock,
    FiUser,
    FiUserCheck,
    FiPhone,
    FiEye,
    FiBell,
    FiChevronDown,
    FiCalendar,
    FiCheckCircle,
    FiAlertCircle,
    FiCpu,
    FiSmartphone,
    FiBatteryCharging,
    FiTv,
    FiBox,
    FiMapPin,
    FiFileText,
    FiInfo,
    FiX,
    FiSearch,
    FiGrid,
    FiList,
    FiCheck,
    FiNavigation,
    FiXCircle
} from "react-icons/fi";
import {
    validate_pickupdate,
    validate_timeslot,
    validate_custom_address
} from "../../utils/validation";
import "./Citizendashboard.css";
import "./Pickupdetails.css";

function Pickupdetails() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [pickupRequests, setPickupRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
    const [selectedPickup, setSelectedPickup] = useState(null);
    const [qrModalTarget, setQrModalTarget] = useState(null);
    const [cancelPickupDevice, setCancelPickupDevice] = useState(null);
    const [requestAgainDevice, setRequestAgainDevice] = useState(null);
    const [newPickupDate, setNewPickupDate] = useState("");
    const [newTimeSlot, setNewTimeSlot] = useState("Morning (09:00 AM - 12:00 PM)");
    const [newPickupAddress, setNewPickupAddress] = useState("");
    const [requestAgainErrors, setRequestAgainErrors] = useState({
        pickupDate: "",
        timeSlot: "",
        address: ""
    });
    const [isSubmittingRequestAgain, setIsSubmittingRequestAgain] = useState(false);
    const [actionSuccessMessage, setActionSuccessMessage] = useState("");
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    const triggerToastMessage = (msg, duration = 4500) => {
        setActionSuccessMessage(msg);
        setTimeout(() => setActionSuccessMessage(""), duration);
    };

    const fetchNotifications = async (token) => {
        const authToken = token || localStorage.getItem("token");
        if (!authToken) return;
        try {
            const [notifRes, devRes] = await Promise.all([
                axios.get("https://ecocycle.runasp.net/api/Notificationcon/my_notifications", {
                    headers: { Authorization: `Bearer ${authToken}` }
                }),
                axios.get("https://ecocycle.runasp.net/api/Device/MyDevices", {
                    headers: { Authorization: `Bearer ${authToken}` }
                }).catch(() => ({ data: [] }))
            ]);
            const raw = notifRes.data || [];
            const citizenDevices = Array.isArray(devRes.data) ? devRes.data : [];

            let currentLoginId = localStorage.getItem("loginId");
            if (!currentLoginId && authToken) {
                try {
                    const payload = JSON.parse(atob(authToken.split(".")[1]));
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

    const markAllNotificationsAsRead = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.get("https://ecocycle.runasp.net/api/Notificationcon/mark_asread", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true, isread: true })));
        } catch (err) {
            console.error("Error marking notifications as read:", err);
        }
    };

    const isDeviceCollectedFromUser = (req) => {
        if (!req) return false;
        const cas = String(req.collectionAssignmentStatus || "").toLowerCase();
        const lcs = String(req.lifecycleStatus || "").toLowerCase();
        const delStat = String(req.deliveryStatus || "").toLowerCase();

        return (
            req.pickedUpAt != null ||
            req.pickupVerified === true ||
            String(req.pickupStatus || "").toLowerCase() === "completed" ||
            ["completed", "pickedup", "outfordelivery", "intransit", "awaitingtechnicianapproval", "deliveredtocenter", "delivered"].includes(cas) ||
            ["pickedup", "collected", "intransit", "handoverpendingverification", "atinspectioncenter", "delivered", "inspected", "inspectioncompleted", "recycled", "refurbished"].includes(lcs) ||
            ["intransit", "pendingverification", "delivered"].includes(delStat)
        );
    };

    const isPickupCancelled = (req) => {
        if (!req) return false;
        const cas = String(req.collectionAssignmentStatus || "").toLowerCase();
        const status = String(req.status || "").toLowerCase();
        const lcs = String(req.lifecycleStatus || "").toLowerCase();
        return cas === "cancelled" || status === "cancelled" || lcs === "pickupcancelled";
    };

    const isPickupOverdue = (req) => {
        if (!req || !req.pickupDate) return false;
        // Never show overdue effect for devices already collected from the user or cancelled
        if (isDeviceCollectedFromUser(req) || isPickupCancelled(req)) return false;
        try {
            const pDate = new Date(req.pickupDate);
            if (isNaN(pDate.getTime())) return false;
            pDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const cas = String(req.collectionAssignmentStatus || "").toLowerCase();
            const reqStatus = String(req.requestStatus || "").toLowerCase();
            const isDone = cas === "completed" || cas === "delivered" || cas === "deliveredtocenter" || cas === "pickedup" || cas === "intransit" || reqStatus === "completed" || reqStatus === "rejected";
            return pDate < today && !isDone;
        } catch {
            return false;
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found in localStorage, redirecting to login.");
            navigate("/");
            return;
        }
        fetchProfile(token);
        fetchPickupRequests(token);
        fetchNotifications(token);
    }, [navigate]);

    const cancelPickup = async () => 
    {
        if (!cancelPickupDevice?.deviceId) {
            triggerToastMessage("Device ID is missing.");
            return;
        }

        try 
        {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/");
                return;
            }

            const response = await axios.post(
                `https://ecocycle.runasp.net/api/Pickup/cancelpickup/${cancelPickupDevice.deviceId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Close modal
            setCancelPickupDevice(null);

            // Close details modal also if it is open
            setSelectedPickup(null);

            // Reload pickup data and notifications
            await fetchPickupRequests(token);
            await fetchNotifications(token);

        } 
        catch (err) 
        {
            console.error("Cancel pickup error:", err);

            const message =
                err.response?.data?.message ||
                "Failed to cancel pickup request.";

            triggerToastMessage(message);
        }
    };

    const handleOpenRequestAgain = (device) => {
        if (!device) return;
        setRequestAgainDevice(device);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const defaultDate = tomorrow.toISOString().split("T")[0];
        const defaultSlot = device.timeSlot || "Morning (09:00 AM - 12:00 PM)";
        const defaultAddress = device.address || profile?.address || "";

        setNewPickupDate(defaultDate);
        setNewTimeSlot(defaultSlot);
        setNewPickupAddress(defaultAddress);
        setRequestAgainErrors({
            pickupDate: validate_pickupdate(defaultDate),
            timeSlot: validate_timeslot(defaultSlot),
            address: validate_custom_address(defaultAddress)
        });
    };

    const handleDateChange = (val) => {
        setNewPickupDate(val);
        setRequestAgainErrors(prev => ({
            ...prev,
            pickupDate: validate_pickupdate(val)
        }));
    };

    const handleTimeSlotChange = (val) => {
        setNewTimeSlot(val);
        setRequestAgainErrors(prev => ({
            ...prev,
            timeSlot: validate_timeslot(val)
        }));
    };

    const handleAddressChange = (val) => {
        setNewPickupAddress(val);
        setRequestAgainErrors(prev => ({
            ...prev,
            address: validate_custom_address(val)
        }));
    };

    const requestPickupAgain = async () => {
        if (!requestAgainDevice?.deviceId) {
            triggerToastMessage("Device ID is missing.");
            return;
        }

        const dateErr = validate_pickupdate(newPickupDate);
        const slotErr = validate_timeslot(newTimeSlot);
        const addressErr = validate_custom_address(newPickupAddress);

        if (dateErr || slotErr || addressErr) {
            setRequestAgainErrors({
                pickupDate: dateErr,
                timeSlot: slotErr,
                address: addressErr
            });
            triggerToastMessage("Please fix validation errors before submitting.");
            return;
        }

        try {
            setIsSubmittingRequestAgain(true);
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/");
                return;
            }

            await axios.post(
                `https://ecocycle.runasp.net/api/Pickup/request-again/${requestAgainDevice.deviceId}`,
                {
                    pickupDate: newPickupDate,
                    timeSlot: newTimeSlot,
                    address: newPickupAddress
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setRequestAgainDevice(null);
            setSelectedPickup(null);
            triggerToastMessage("Pickup request submitted again successfully.");
            await fetchPickupRequests(token);
        } catch (err) {
            console.error("Request pickup again error:", err);
            const message = err.response?.data?.message || "Failed to request pickup again.";
            triggerToastMessage(message);
        } finally {
            setIsSubmittingRequestAgain(false);
        }
    };
    const fetchProfile = async (token) => {
        try {
            const response = await axios.get("https://ecocycle.runasp.net/api/User/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data || {};
            setProfile(data);

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
            console.error("Pickupdetails profile fetch error:", err);
        }
    };

    const fetchPickupRequests = async (token) => {
        try {
            setLoading(true);
            const response = await axios.get("https://ecocycle.runasp.net/api/Inspection/my-pickup-requests", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPickupRequests(response.data || []);
        } catch (err) {
            console.error("Error fetching pickup requests:", err);
        } finally {
            setLoading(false);
        }
    };

    const userName = profile?.firstName 
        ? `${profile.firstName} ${profile.lastName || ""}`.trim()
        : localStorage.getItem("firstName") ||
          localStorage.getItem("userName") ||
          localStorage.getItem("username") ||
          localStorage.getItem("name") ||
          "Citizen Champion";

    // Include ALL citizen pickup requests in the feed (even if collected from user or in transit)
    const allRequests = pickupRequests;

    // KPI Metrics calculation
    const collectedCount = allRequests.filter(r => {
        const isCancelled = isPickupCancelled(r);
        if (isCancelled) return false;
        return isDeviceCollectedFromUser(r);
    }).length;

    const inTransitCount = allRequests.filter(r => {
        const cas = String(r.collectionAssignmentStatus || "").toLowerCase();
        const lcs = String(r.lifecycleStatus || "").toLowerCase();
        const delStat = String(r.deliveryStatus || "").toLowerCase();
        const isDeliveredToTech = delStat === "delivered" || cas === "deliveredtocenter" || lcs === "atinspectioncenter";
        const isCancelled = isPickupCancelled(r);
        if (isCancelled || isDeliveredToTech) return false;
        
        return isDeviceCollectedFromUser(r);
    }).length;

    const completedCount = allRequests.filter(r => {
        const cas = String(r.collectionAssignmentStatus || "").toLowerCase();
        const lcs = String(r.lifecycleStatus || "").toLowerCase();
        const delStat = String(r.deliveryStatus || "").toLowerCase();
        return delStat === "delivered" || cas === "deliveredtocenter" || lcs === "atinspectioncenter";
    }).length;

    const cancelledCount = allRequests.filter(r => isPickupCancelled(r)).length;

    const totalWeight = allRequests.reduce((sum, r) => sum + ((Number(r.weight) || 0) * (Number(r.quantity) || 1)), 0);

    // Tab Filtered & Search Filtered requests
    const filteredRequests = allRequests.filter(req => {
        // Tab filter
        const cas = String(req.collectionAssignmentStatus || "").toLowerCase();
        const lcs = String(req.lifecycleStatus || "").toLowerCase();
        const delStat = String(req.deliveryStatus || "").toLowerCase();

        const isCancelled = isPickupCancelled(req);
        const isDeliveredToTech = delStat === "delivered" || cas === "deliveredtocenter" || lcs === "atinspectioncenter";
        const isCitizenPickupDone = isDeviceCollectedFromUser(req);

        if (activeTab === "Collected") {
            if (isCancelled || !isCitizenPickupDone) return false;
        }

        if (activeTab === "InTransit") {
            if (isCancelled || isDeliveredToTech) return false;
            if (!isCitizenPickupDone && delStat !== "intransit" && delStat !== "pending" && cas !== "intransit" && cas !== "pickedup" && cas !== "completed") return false;
        }

        if (activeTab === "Delivered") {
            if (!isDeliveredToTech) return false;
        }

        if (activeTab === "Accepted") {
            if (cas !== "accepted" && req.collectionAgentAccepted !== true && !isCitizenPickupDone) return false;
        }

        if (activeTab === "Cancelled") {
            if (!isCancelled) return false;
        }

        // Search query filter
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const devName = `${req.brand || ""} ${req.model || ""}`.toLowerCase();
        const catName = String(req.categoryName || "").toLowerCase();
        const agentName = String(req.collectionAgentName || "").toLowerCase();
        const address = String(req.address || "").toLowerCase();
        const devId = String(req.deviceId || "").toLowerCase();

        return (
            devName.includes(q) ||
            catName.includes(q) ||
            agentName.includes(q) ||
            address.includes(q) ||
            devId.includes(q)
        );
    });


    const capitalizeWords = (str) => {
        if (!str) return "";
        return str
            .toLowerCase()
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };

    const getCategoryIcon = (categoryName) => {
        const cat = (categoryName || "").toLowerCase();
        if (cat.includes("computer") || cat.includes("laptop")) return <FiCpu />;
        if (cat.includes("mobile") || cat.includes("phone")) return <FiSmartphone />;
        if (cat.includes("battery") || cat.includes("power")) return <FiBatteryCharging />;
        if (cat.includes("appliance") || cat.includes("tv")) return <FiTv />;
        return <FiBox />;
    };

    const getDeliveryStatusBadge = (req) => {
        const badgeStyle = {
            padding: "0.25rem 0.55rem",
            fontSize: "0.725rem",
            fontWeight: 600,
            borderRadius: "9999px",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            whiteSpace: "nowrap"
        };

        if (isPickupCancelled(req)) {
            return <span className="status-pill status-cancelled" style={{ ...badgeStyle, background: "#fee2e2", color: "#dc2626", borderColor: "#fca5a5" }}>Cancelled</span>;
        }
        if (isPickupOverdue(req)) {
            return <span className="status-pill status-overdue" style={{ ...badgeStyle, background: "#fff7ed", color: "#c2410c", borderColor: "#ffedd5" }}><FiAlertCircle style={{ fontSize: "0.75rem", flexShrink: 0 }} /> Overdue</span>;
        }
        const cas = String(req.collectionAssignmentStatus || req.status || "").toLowerCase();
        const delStat = String(req.deliveryStatus || "").toLowerCase();
        const lcs = String(req.lifecycleStatus || "").toLowerCase();

        if (delStat === "delivered" || cas === "deliveredtocenter" || lcs === "atinspectioncenter" || req.deliveredAt != null) {
            return <span className="status-pill status-completed" style={{ ...badgeStyle, background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" }}><FiCheckCircle style={{ fontSize: "0.75rem", flexShrink: 0 }} /> Delivered to Hub</span>;
        } else if (delStat === "pendingverification" || delStat === "handoverpendingverification" || cas === "awaitingtechnicianapproval" || lcs === "handoverpendingverification") {
            return <span className="status-pill status-progress" style={{ ...badgeStyle, background: "#fef3c7", color: "#b45309", borderColor: "#fde68a" }}><FiClock style={{ fontSize: "0.75rem", flexShrink: 0 }} /> Handover Verification</span>;
        } else if (delStat === "intransit" || cas === "intransit" || lcs === "intransit" || cas === "outfordelivery") {
            return <span className="status-pill status-progress" style={{ ...badgeStyle, background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }}><FiTruck style={{ fontSize: "0.75rem", flexShrink: 0 }} /> In Transit to Hub</span>;
        } else if (isDeviceCollectedFromUser(req)) {
            return <span className="status-pill status-progress" style={{ ...badgeStyle, background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" }}><FiCheckCircle style={{ fontSize: "0.75rem", flexShrink: 0 }} /> Picked Up</span>;
        } else if (cas === "pickupstarted" || cas === "en route" || cas === "enroute" || lcs === "enroute") {
            return <span className="status-pill status-progress" style={{ ...badgeStyle, background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }}><FiTruck style={{ fontSize: "0.75rem", flexShrink: 0 }} /> Agent En Route</span>;
        } else if (cas === "accepted" || lcs === "collectionassigned" || req.collectionAgentAccepted === true || Boolean(req.collectionAgentName)) {
            return <span className="status-pill status-assigned" style={{ ...badgeStyle, background: "#f0fdf4", color: "#15803d", borderColor: "#bbf7d0" }}><FiCheckCircle style={{ fontSize: "0.75rem", flexShrink: 0 }} /> Accepted</span>;
        } else {
            return <span className="status-pill status-scheduled" style={{ ...badgeStyle, background: "#f8fafc", color: "#475569", borderColor: "#e2e8f0" }}><FiCalendar style={{ fontSize: "0.75rem", flexShrink: 0 }} /> Scheduled</span>;
        }
    };

    const getAgentPhoto = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith("http") || photoPath.startsWith("data:")) return photoPath;
        return `https://ecocycle.runasp.net/uploads/profile/${photoPath}`;
    };

    return (
        <div className="vd-page-layout">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="vd-main-content">

{/* Main Control Header Panel */}
                <div className="control-bar-panel">
                    <div>
                        <h3 style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif", fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.2rem", color: "#0f172a" }}>Pickup Details &amp; Logistics Tracking</h3>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>Track accepted e-waste</p>
                    </div>

                    <div className="control-panel-right-group">
                        <div className="vd-inline-search">
                            <FiSearch style={{ color: "#94a3b8", fontSize: "0.85rem" }} />
                            <input
                                type="text"
                                placeholder="Search brand, category, agent..."
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
                            {["All", "Accepted", "Collected", "InTransit", "Delivered", "Cancelled"].map((tab) => {
                                const labelMap = {
                                    All: `All (${allRequests.length})`,
                                    Accepted: "Accepted",
                                    Collected: `Collected (${collectedCount})`,
                                    InTransit: `In Transit (${inTransitCount})`,
                                    Delivered: `Delivered (${completedCount})`,
                                    Cancelled: `Cancelled (${cancelledCount})`
                                };
                                return (
                                    <button
                                        key={tab}
                                        className={`pill-btn ${activeTab === tab ? "active" : ""}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {labelMap[tab] || tab}
                                    </button>
                                );
                            })}
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

                {/* Main Devices Container */}
                {loading ? (
                    <div style={{ padding: "3.5rem 1.5rem", textAlign: "center", color: "#64748b", background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                        <FiRefreshCw className="spin-animation" style={{ fontSize: "2rem", color: "#059669", marginBottom: "0.5rem" }} />
                        <p style={{ fontWeight: 600, margin: 0 }}>Loading accepted pickup requests...</p>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div style={{ padding: "3.5rem 1.5rem", textAlign: "center", color: "#64748b", background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                        <FiBox style={{ fontSize: "2.5rem", color: "#cbd5e1", marginBottom: "0.75rem" }} />
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>No Accepted Pickup Devices Found</h3>
                        <p style={{ margin: "0.35rem 0 1.25rem", fontSize: "0.875rem", color: "#64748b" }}>
                            {searchQuery 
                                ? `No devices matched "${searchQuery}"`
                                : "There are currently no devices accepted by a collection agent for delivery."}
                        </p>
                        <Link to="/add-device" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.45rem", background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#ffffff", padding: "0.6rem 1.35rem", borderRadius: "10px", fontWeight: 700, fontSize: "0.85rem", boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)" }}>
                            <FiPlusCircle /> Schedule E-Waste Pickup
                        </Link>
                    </div>
                ) : viewMode === "grid" ? (

                        /* GRID VIEW */
                        <div className="pk-grid">
                            {filteredRequests.map((req) => {
                                const agentPhoto = getAgentPhoto(req.collectionAgentPhoto);
                                const overdue = isPickupOverdue(req);
                                return (
                                    <div key={req.deviceId} className={`pk-card ${overdue ? "is-overdue" : ""}`}>
                                        <div>
                                            <div className="pk-card-header">
                                                <div className="pk-card-title-group">
                                                    <div className="pk-category-icon">
                                                        {getCategoryIcon(req.categoryName)}
                                                    </div>
                                                    <div>
                                                        <h3 className="pk-device-name">
                                                            {capitalizeWords(`${req.brand || ""} ${req.model || ""}`.trim()) || "E-Waste Item"}
                                                        </h3>
                                                    </div>
                                                </div>
                                                {getDeliveryStatusBadge(req)}
                                            </div>

                                            {/* Collection Agent Profile Box */}
                                            <div className="pk-agent-box">
                                                {agentPhoto ? (
                                                    <img src={agentPhoto} alt="Agent" className="pk-agent-avatar" />
                                                ) : (
                                                    <div className="pk-agent-avatar" style={!req.collectionAgentName ? { background: "#cbd5e1", color: "#64748b" } : {}}>
                                                        {req.collectionAgentName ? req.collectionAgentName.charAt(0).toUpperCase() : <FiUser />}
                                                    </div>
                                                )}
                                                <div className="pk-agent-info">
                                                    <div className="pk-agent-name">
                                                        {req.collectionAgentName ? capitalizeWords(req.collectionAgentName) : "Pending Allocation"}
                                                    </div>
                                                    {req.collectionAgentPhone ? (
                                                        <a href={`tel:${req.collectionAgentPhone}`} className="pk-agent-phone" style={{ textDecoration: "none" }}>
                                                            <FiPhone style={{ fontSize: "0.75rem" }} /> {req.collectionAgentPhone}
                                                        </a>
                                                    ) : (
                                                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                                                            {req.collectionAgentName ? "Contact Pending" : "Awaiting Agent Allocation"}
                                                        </span>
                                                    )}
                                                    {req.vehicleNumber && (
                                                        <div className="pk-vehicle-tag">
                                                            {req.vehicleNumber} {req.vehicleType ? `(${req.vehicleType})` : ""}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="pk-card-details-grid">
                                                <div className="pk-detail-item">
                                                    <span className="pk-detail-label">Request Tag</span>
                                                    <span className="pk-detail-val" style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#475569" }}>
                                                        {req.deviceQrToken || (req.inspectionRequestId ? `#INSP-${req.inspectionRequestId}` : `#DEV-${req.deviceId}`)}
                                                    </span>
                                                </div>
                                                <div className="pk-detail-item">
                                                    <span className="pk-detail-label">Scheduled Date</span>
                                                    <span className="pk-detail-val" style={{ color: overdue ? "#dc2626" : "inherit" }}>
                                                        {formatDate(req.pickupDate)}
                                                    </span>
                                                </div>
                                                <div className="pk-detail-item">
                                                    <span className="pk-detail-label">Time Slot</span>
                                                    <span className="pk-detail-val">
                                                        {req.timeSlot || "Scheduled Slot"}
                                                    </span>
                                                </div>
                                                <div className="pk-detail-item">
                                                    <span className="pk-detail-label">Location</span>
                                                    <span className="pk-detail-val" title={req.address}>
                                                        {capitalizeWords(req.address)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div className="pk-card-footer">
                                            <div className="pk-footer-meta">
                                                <span>{req.acceptedAt ? `Accepted: ${formatDate(req.acceptedAt)}` : `Created: ${formatDate(req.createdAt)}`}</span>
                                            </div>
                                            {(() => {
                                                const isCancelled = isPickupCancelled(req);
                                                const canCancel = !isCancelled && !isDeviceCollectedFromUser(req);

                                                return (
                                                    <div className="pk-footer-actions">
                                                        {canCancel && (
                                                            <button 
                                                                className="pk-action-btn pk-btn-cancel"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setCancelPickupDevice(req);
                                                                }}
                                                                title="Cancel Pickup"
                                                            >
                                                                <FiXCircle /> Cancel
                                                            </button>
                                                        )}
                                                        <button 
                                                            className="pk-action-btn pk-btn-qr"
                                                            style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setQrModalTarget(req);
                                                            }}
                                                            title="Device Barcode / QR Code"
                                                        >
                                                            <FaQrcode /> Device QR
                                                        </button>
                                                        <button 
                                                            className="pk-action-btn pk-btn-track"
                                                            onClick={() => setSelectedPickup(req)}
                                                        >
                                                            Track & Details
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* TABLE VIEW */
                        <div className="glass-table-wrapper">
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Tag ID</th>
                                        <th>Device & Category</th>
                                        <th>Collection Agent</th>
                                        <th>Vehicle Info</th>
                                        <th>Scheduled Slot</th>
                                        <th>Pickup Address</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.map((req) => {
                                        const overdue = isPickupOverdue(req);
                                        return (
                                            <tr key={req.deviceId} className={overdue ? "pk-table-row-overdue" : ""} style={{ cursor: "pointer" }} onClick={() => setSelectedPickup(req)}>
                                            <td>
                                                {req.inspectionRequestId && (
                                                    <div style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 500 }}>
                                                        #INSP-{req.inspectionRequestId}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}>
                                                    {capitalizeWords(`${req.brand || ""} ${req.model || ""}`.trim()) || "E-Waste Item"}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: req.collectionAgentName ? "#0f172a" : "#94a3b8" }}>
                                                    {req.collectionAgentName ? capitalizeWords(req.collectionAgentName) : "Pending Allocation"}
                                                </div>
                                                {req.collectionAgentPhone ? (
                                                    <a href={`tel:${req.collectionAgentPhone}`} onClick={(e) => e.stopPropagation()} style={{ fontSize: "0.775rem", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
                                                        <FiPhone style={{ fontSize: "0.7rem", marginRight: "0.2rem" }} />
                                                        {req.collectionAgentPhone}
                                                    </a>
                                                ) : (
                                                    <div style={{ fontSize: "0.725rem", color: "#94a3b8" }}>
                                                        {req.collectionAgentName ? "Contact Pending" : "Awaiting Assignment"}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {req.vehicleNumber ? (
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: "0.825rem", color: "#1e293b" }}>
                                                            {req.vehicleNumber}
                                                        </div>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                                            {req.vehicleType || "Vehicle"}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Standard Delivery</span>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>
                                                    {formatDate(req.pickupDate)}
                                                </div>
                                                <div style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "0.15rem" }}>
                                                    {req.timeSlot || "Scheduled Slot"}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 500, fontSize: "0.85rem", color: "#334155", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={req.address}>
                                                    {capitalizeWords(req.address)}
                                                </div>
                                                {req.landmark && (
                                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                                        Near: {capitalizeWords(req.landmark)}
                                                    </div>
                                                )}
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                {(() => {
                                                    const isCancelled = isPickupCancelled(req);
                                                    const canCancel = !isCancelled && !isDeviceCollectedFromUser(req);

                                                    return (
                                                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                                                            <button 
                                                                className="table-view-btn"
                                                                onClick={() => setSelectedPickup(req)}
                                                            >
                                                                View Details
                                                            </button>
                                                            <button 
                                                                className="table-view-btn"
                                                                style={{ background: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setQrModalTarget(req);
                                                                }}
                                                                title="Device Barcode / QR Code"
                                                            >
                                                                <FaQrcode /> Barcode / QR
                                                            </button>
                                                            {canCancel && (
                                                                <button 
                                                                    className="table-view-btn"
                                                                    style={{ background: "#fee2e2", color: "#dc2626", borderColor: "#fca5a5", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                                                                    onClick={() => setCancelPickupDevice(req)}
                                                                >
                                                                    <FiXCircle /> Cancel
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </td>

                                        </tr>
                                    ); })}
                                </tbody>
                            </table>
                        </div>
                    )}
            </main>

            {/* Detailed Pickup & Tracking Modal */}
            {selectedPickup && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    background: "rgba(15, 23, 42, 0.6)",
                    backdropFilter: "blur(4px)",
                    zIndex: 1000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1.5rem"
                }}>
                    <div style={{
                        background: "#ffffff",
                        borderRadius: "20px",
                        width: "100%",
                        maxWidth: "600px",
                        maxHeight: "85vh",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        overflow: "hidden"
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                            color: "#ffffff",
                            padding: "1.25rem 1.5rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexShrink: 0
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{ background: "rgba(255,255,255,0.2)", padding: "0.5rem", borderRadius: "10px", display: "flex" }}>
                                    <FiTruck style={{ fontSize: "1.4rem" }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Collection Delivery Details</h3>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                                        <span style={{ fontSize: "0.75rem", opacity: 0.9 }}>{selectedPickup.brand} {selectedPickup.model}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedPickup(null)}
                                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#ffffff", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <FiX />
                            </button>
                        </div>

                        {/* Modal Content Body */}
                        <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto" }}>
                            {/* Assigned Collection Agent Banner */}
                            {(() => {
                                const cas = String(selectedPickup.collectionAssignmentStatus || selectedPickup.assignmentStatus || selectedPickup.status || "").toLowerCase();
                                const lcs = String(selectedPickup.lifecycleStatus || "").toLowerCase();
                                const isPickupStarted = cas === "pickupstarted" || cas === "enroute" || lcs === "enroute" || lcs === "pickupstarted" || selectedPickup.pickupStartedAt != null || selectedPickup.startedAt != null;
                                const isAccepted = selectedPickup.collectionAgentAccepted === true || ["accepted", "pickupstarted", "enroute", "completed", "pickedup", "outfordelivery", "intransit", "awaitingtechnicianapproval", "delivered", "deliveredtocenter"].includes(cas);
                                const hasAgent = Boolean(selectedPickup.collectionAgentName);

                                if (isAccepted) {
                                    return (
                                        <div style={{
                                            background: "#f0fdf4",
                                            border: "1px solid #bbf7d0",
                                            borderRadius: "14px",
                                            padding: "1rem",
                                            marginBottom: "1.25rem",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                                {getAgentPhoto(selectedPickup.collectionAgentPhoto) ? (
                                                    <img 
                                                        src={getAgentPhoto(selectedPickup.collectionAgentPhoto)} 
                                                        alt="Agent Profile" 
                                                        style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} 
                                                    />
                                                ) : (
                                                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#059669", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.15rem" }}>
                                                        {(selectedPickup.collectionAgentName || "CA").charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontSize: "0.725rem", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
                                                        {isPickupStarted && !isDeviceCollectedFromUser(selectedPickup) ? "Collection Agent (En Route for Pickup)" : "Collection Agent (Accepted)"}
                                                    </div>
                                                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#065f46" }}>
                                                        {capitalizeWords(selectedPickup.collectionAgentName)}
                                                    </div>
                                                    {selectedPickup.vehicleNumber && (
                                                        <div style={{ fontSize: "0.775rem", color: "#047857", fontWeight: 600, marginTop: "0.1rem" }}>
                                                            Vehicle: {selectedPickup.vehicleNumber} ({selectedPickup.vehicleType || "Pickup Van"})
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {selectedPickup.collectionAgentPhone && (
                                                <a 
                                                    href={`tel:${selectedPickup.collectionAgentPhone}`}
                                                    style={{
                                                        background: "#059669",
                                                        color: "#ffffff",
                                                        padding: "0.5rem 1rem",
                                                        borderRadius: "10px",
                                                        textDecoration: "none",
                                                        fontSize: "0.825rem",
                                                        fontWeight: 700,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.4rem",
                                                        boxShadow: "0 2px 5px rgba(5,150,105,0.3)"
                                                    }}
                                                >
                                                    <FiPhone /> Call Agent
                                                </a>
                                            )}
                                        </div>
                                    );
                                } else if (hasAgent) {
                                    return (
                                        <div style={{
                                            background: "#fff7ed",
                                            border: "1px solid #fed7aa",
                                            borderRadius: "14px",
                                            padding: "1rem",
                                            marginBottom: "1.25rem",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#ea580c", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.15rem" }}>
                                                    {(selectedPickup.collectionAgentName || "CA").charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: "0.725rem", color: "#c2410c", fontWeight: 700, textTransform: "uppercase" }}>Collection Agent (Awaiting Acceptance)</div>
                                                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#9a3412" }}>
                                                        {capitalizeWords(selectedPickup.collectionAgentName)}
                                                    </div>
                                                    <div style={{ fontSize: "0.775rem", color: "#c2410c", marginTop: "0.1rem" }}>
                                                        Agent allocated; awaiting response acceptance.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div style={{
                                            background: "#f8fafc",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "14px",
                                            padding: "1rem",
                                            marginBottom: "1.25rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.85rem"
                                        }}>
                                            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#e2e8f0", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                                                <FiUser />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Collection Agent</div>
                                                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#334155" }}>
                                                    Pending Agent Allocation
                                                </div>
                                                <div style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "0.1rem" }}>
                                                    An EcoCycle collection agent will be assigned shortly for your scheduled pickup.
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            })()}


                            {/* Delivery Progress Timeline */}


                            <div style={{ marginBottom: "1.25rem" }}>
                                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", fontWeight: 700, color: "#1e293b" }}>
                                    Delivery Progress Timeline
                                </h4>
                                <div className="pk-timeline">
                                    {(() => {
                                        const cas = String(selectedPickup.collectionAssignmentStatus || selectedPickup.assignmentStatus || selectedPickup.status || "").toLowerCase();
                                        const lcs = String(selectedPickup.lifecycleStatus || "").toLowerCase();
                                        const delStat = String(selectedPickup.deliveryStatus || "").toLowerCase();
                                        const isCancelled = isPickupCancelled(selectedPickup);

                                        // Step 2: Agent Accepted
                                        const isAccepted = selectedPickup.collectionAgentAccepted === true || ["accepted", "pickupstarted", "enroute", "completed", "pickedup", "outfordelivery", "intransit", "awaitingtechnicianapproval", "delivered", "deliveredtocenter"].includes(cas);

                                        // Pickup Started (En Route to Customer)
                                        const isPickupStarted = cas === "pickupstarted" || cas === "enroute" || lcs === "enroute" || lcs === "pickupstarted" || selectedPickup.pickupStartedAt != null || selectedPickup.startedAt != null;

                                        // An agent is assigned (allocated) even if not accepted yet
                                        const isAgentAssigned = Boolean(selectedPickup.collectionAgentName) || cas === "assigned" || cas === "pending";

                                        // Step 3: Citizen Pickup Completed
                                        const isCitizenPickupDone = selectedPickup.pickedUpAt != null || ["completed", "pickedup", "outfordelivery", "intransit", "awaitingtechnicianapproval", "delivered", "deliveredtocenter"].includes(cas) || ["pickedup", "collected", "intransit", "handoverpendingverification", "atinspectioncenter", "delivered"].includes(lcs);

                                        // Step 4: Transit Active or Completed
                                        const isTransitActiveOrDone = delStat === "intransit" || delStat === "pendingverification" || delStat === "delivered" || selectedPickup.deliveryStartedAt != null || cas === "intransit" || cas === "deliveredtocenter" || lcs === "intransit" || lcs === "atinspectioncenter";
                                        const isTransitCompleted = delStat === "pendingverification" || delStat === "delivered" || cas === "deliveredtocenter" || lcs === "atinspectioncenter";

                                        // Step 5: Handover Verification Requested
                                        const isHandoverRequested = delStat === "pendingverification" || delStat === "delivered" || cas === "awaitingtechnicianapproval" || cas === "deliveredtocenter" || lcs === "handoverpendingverification" || lcs === "atinspectioncenter";

                                        // Step 6: Delivered & Verified by Technician
                                        const isDeliveredToTech = delStat === "delivered" || cas === "deliveredtocenter" || lcs === "atinspectioncenter" || selectedPickup.deliveredAt != null;

                                        if (isCancelled) {
                                            return (
                                                <>
                                                    {/* Step 1: Created */}
                                                    <div className="pk-timeline-step completed">
                                                        <div className="pk-timeline-dot">
                                                            <FiCheck style={{ fontSize: "0.7rem" }} />
                                                        </div>
                                                        <div className="pk-step-title">Pickup Request Created</div>
                                                        <div className="pk-step-desc">Item registered in EcoCycle portal</div>
                                                        <div className="pk-step-time">{formatDate(selectedPickup.createdAt)}</div>
                                                    </div>

                                                    {/* Step 2: Cancelled */}
                                                    <div className="pk-timeline-step cancelled">
                                                        <div className="pk-timeline-dot pk-dot-cancelled" style={{ background: "#ef4444", borderColor: "#fca5a5", color: "#ffffff" }}>
                                                            <FiX style={{ fontSize: "0.75rem" }} />
                                                        </div>
                                                        <div className="pk-step-title" style={{ color: "#dc2626" }}>Pickup Request Cancelled</div>
                                                        <div className="pk-step-desc">The pickup allocation cycle was cancelled.</div>
                                                    </div>
                                                </>
                                            );
                                        }

                                        const techCenter = selectedPickup.assignedTechnicianCenterName || selectedPickup.technicianCenterName || "EcoCycle Regional Hub";
                                        const techName = selectedPickup.assignedTechnicianName || selectedPickup.technicianName || "Inspection Officer";

                                        return (
                                            <>
                                                {/* Step 1: Created */}
                                                <div className="pk-timeline-step completed">
                                                    <div className="pk-timeline-dot">
                                                        <FiCheck style={{ fontSize: "0.7rem" }} />
                                                    </div>
                                                    <div className="pk-step-title">Pickup Request Created</div>
                                                    <div className="pk-step-desc">Item registered in EcoCycle portal</div>
                                                    <div className="pk-step-time">{formatDate(selectedPickup.createdAt)}</div>
                                                </div>

                                                {/* Step 2: Agent Assigned & Accepted */}
                                                <div className={`pk-timeline-step ${isAccepted ? "completed" : isAgentAssigned ? "active" : ""}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isAccepted ? <FiCheck style={{ fontSize: "0.7rem" }} /> : isAgentAssigned ? <FiUser style={{ fontSize: "0.7rem" }} /> : null}
                                                    </div>
                                                    <div className="pk-step-title">Collection Agent Allocation & Acceptance</div>
                                                    <div className="pk-step-desc">
                                                        {isAccepted 
                                                            ? `Agent: ${capitalizeWords(selectedPickup.collectionAgentName)} (${selectedPickup.collectionAgentPhone || "Ph: Available"}) accepted task`
                                                            : isAgentAssigned
                                                            ? `Agent: ${capitalizeWords(selectedPickup.collectionAgentName)} assigned — awaiting agent acceptance`
                                                            : "Awaiting collection agent assignment"}
                                                    </div>
                                                    {selectedPickup.acceptedAt && isAccepted && (
                                                        <div className="pk-step-time">{formatDate(selectedPickup.acceptedAt)}</div>
                                                    )}
                                                </div>

                                                {/* Step 3: Agent Pickup from Your Address */}
                                                <div className={`pk-timeline-step ${isCitizenPickupDone ? "completed" : (isPickupStarted || isAccepted) ? "active" : ""}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isCitizenPickupDone ? <FiCheck style={{ fontSize: "0.7rem" }} /> : (isPickupStarted || isAccepted) ? <FiTruck style={{ fontSize: "0.7rem" }} /> : null}
                                                    </div>
                                                    <div className="pk-step-title">Agent Pickup from Your Address</div>
                                                    <div className="pk-step-desc">
                                                        {isCitizenPickupDone 
                                                            ? "Collection agent collected device from your address" 
                                                            : isPickupStarted
                                                            ? "Collection agent is currently en route to your address for pickup"
                                                            : isAccepted
                                                            ? `Scheduled for pickup on ${formatDate(selectedPickup.pickupDate)} (${selectedPickup.timeSlot || "Scheduled slot"})`
                                                            : "Scheduled upon agent acceptance"}
                                                    </div>
                                                    {selectedPickup.pickedUpAt ? (
                                                        <div className="pk-step-time">Picked Up: {formatDate(selectedPickup.pickedUpAt)}</div>
                                                    ) : (selectedPickup.pickupStartedAt || selectedPickup.startedAt) ? (
                                                        <div className="pk-step-time">Started: {formatDate(selectedPickup.pickupStartedAt || selectedPickup.startedAt)}</div>
                                                    ) : null}
                                                </div>

                                                {/* Step 4: In Transit to Inspection Center */}
                                                <div className={`pk-timeline-step ${isTransitCompleted || isHandoverRequested || isDeliveredToTech ? "completed" : (isCitizenPickupDone || isTransitActiveOrDone ? "active" : "")}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isTransitCompleted || isHandoverRequested || isDeliveredToTech ? <FiCheck style={{ fontSize: "0.7rem" }} /> : (isCitizenPickupDone || isTransitActiveOrDone ? <FiTruck style={{ fontSize: "0.7rem" }} /> : null)}
                                                    </div>
                                                    <div className="pk-step-title">In Transit to Inspection Center</div>
                                                    <div className="pk-step-desc">
                                                        {isTransitCompleted || isHandoverRequested || isDeliveredToTech
                                                            ? `E-waste device transported to ${techCenter}`
                                                            : isCitizenPickupDone || isTransitActiveOrDone
                                                            ? `Device collected from your address; in transit to ${techCenter}`
                                                            : `Destination: ${techCenter}`}
                                                    </div>
                                                    {selectedPickup.deliveryStartedAt && (
                                                        <div className="pk-step-time">Departed: {formatDate(selectedPickup.deliveryStartedAt)}</div>
                                                    )}
                                                </div>

                                                {/* Step 5: Handover & Technician Verification */}
                                                <div className={`pk-timeline-step ${isDeliveredToTech ? "completed" : isHandoverRequested ? "active" : ""}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isDeliveredToTech ? <FiCheck style={{ fontSize: "0.7rem" }} /> : isHandoverRequested ? <FiClock style={{ fontSize: "0.7rem" }} /> : null}
                                                    </div>
                                                    <div className="pk-step-title">Technician Delivery Handover</div>
                                                    <div className="pk-step-desc">
                                                        {isDeliveredToTech
                                                            ? `Handover verified and accepted by Technician ${techName}`
                                                            : isHandoverRequested
                                                            ? `Collection Agent arrived at ${techCenter}; verification requested to Technician ${techName}`
                                                            : `Awaiting arrival at ${techCenter}`}
                                                    </div>
                                                </div>

                                                {/* Step 6: Delivered & Ready for Inspection */}
                                                <div className={`pk-timeline-step ${isDeliveredToTech ? "completed" : ""}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isDeliveredToTech ? <FiCheck style={{ fontSize: "0.7rem" }} /> : null}
                                                    </div>
                                                    <div className="pk-step-title">Delivered & Verified at Inspection Hub</div>
                                                    <div className="pk-step-desc">
                                                        {isDeliveredToTech 
                                                            ? `Device safely stored at ${techCenter} for technical diagnostics.` 
                                                            : "Pending final receipt & verification by Inspection Officer"}
                                                    </div>
                                                    {isDeliveredToTech && selectedPickup.deliveredAt && (
                                                        <div className="pk-step-time">Delivered: {formatDate(selectedPickup.deliveredAt)}</div>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}
                                 </div>
                            </div>

                            {/* Stage 2: Technician -> Refurbishment/Recycling Center Progress (Separated) */}
                            {selectedPickup.centerAssignmentId && (
                                <div style={{
                                    marginBottom: "1.25rem",
                                    background: "#f0fdfa",
                                    border: "1px solid #ccfbf1",
                                    borderRadius: "14px",
                                    padding: "1rem"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <FiRefreshCw style={{ color: "#0f766e", fontSize: "1rem" }} />
                                            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#134e4a" }}>
                                                Stage 2: Facility Transfer &amp; Recovery
                                            </span>
                                        </div>
                                        <span style={{
                                            fontSize: "0.725rem",
                                            fontWeight: 700,
                                            padding: "0.2rem 0.6rem",
                                            borderRadius: "9999px",
                                            background: String(selectedPickup.centerAssignmentStatus).toLowerCase() === "deliveredtocenter" || selectedPickup.centerDeliveredAt ? "#dcfce7" : "#e0f2fe",
                                            color: String(selectedPickup.centerAssignmentStatus).toLowerCase() === "deliveredtocenter" || selectedPickup.centerDeliveredAt ? "#166534" : "#0369a1"
                                        }}>
                                            {String(selectedPickup.centerAssignmentStatus).toLowerCase() === "deliveredtocenter" || selectedPickup.centerDeliveredAt ? "Delivered to Center" : (selectedPickup.centerAssignmentStatus || "In Progress")}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: "0.775rem", color: "#0f766e" }}>
                                        Following technical inspection, device was allocated for transfer to {selectedPickup.centerAssignmentType === "TechnicianToRefurbishmentCenter" ? "Refurbishment Center" : "Recycling Center"}
                                        {selectedPickup.centerAgentName ? ` via collection agent ${capitalizeWords(selectedPickup.centerAgentName)}.` : "."}
                                    </p>
                                    {selectedPickup.centerDeliveredAt && (
                                        <div style={{ fontSize: "0.725rem", color: "#115e59", marginTop: "0.3rem", fontWeight: 600 }}>
                                            Center Delivery Recorded: {formatDate(selectedPickup.centerDeliveredAt)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", flexShrink: 0 }}>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                {(() => {
                                    const isCancelled = isPickupCancelled(selectedPickup);
                                    const canCancel = !isCancelled && !isDeviceCollectedFromUser(selectedPickup);

                                    return (
                                        <>
                                            {canCancel && (
                                                <button 
                                                    className="table-view-btn"
                                                    style={{ background: "#fee2e2", color: "#dc2626", borderColor: "#fca5a5", padding: "0.55rem 1.1rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                                                    onClick={() => setCancelPickupDevice(selectedPickup)}
                                                >
                                                    <FiXCircle /> Cancel Pickup
                                                </button>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                            <button 
                                onClick={() => setSelectedPickup(null)}
                                className="profile-btn save"
                                style={{ padding: "0.55rem 1.35rem" }}
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Pickup Design Modal */}
            {cancelPickupDevice && (
                <div className="vd-modal-overlay" onClick={() => setCancelPickupDevice(null)}>
                    <div className="vd-confirm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
                        <div className="vd-confirm-icon-wrapper" style={{ background: "#fff7ed", borderColor: "#fed7aa" }}>
                            <FiXCircle style={{ fontSize: "1.8rem", color: "#ea580c" }} />
                        </div>
                        <h3 className="vd-confirm-title">Cancel Pickup Schedule</h3>
                        <p className="vd-confirm-text">
                            Are you sure you want to cancel the scheduled pickup for <strong>{cancelPickupDevice.brand} {cancelPickupDevice.model}</strong>?
                        </p>

                        <div style={{ textAlign: "left", marginBottom: "1.25rem" }}>
                            <label style={{ fontSize: "0.775rem", fontWeight: 700, color: "#4a5568" }}>Reason for Cancellation (Optional)</label>
                            <select className="vd-design-input">
                                <option>Schedule conflict</option>
                                <option>Device no longer available</option>
                                <option>Want to change pickup location</option>
                                <option>Other reason</option>
                            </select>
                        </div>

                        <div className="vd-confirm-actions">
                            <button
                                onClick={() => setCancelPickupDevice(null)}
                                className="vd-confirm-cancel-btn"
                            >
                                Keep Pickup
                            </button>
                            <button
                                onClick={cancelPickup}
                                className="vd-btn-cancel-pickup"
                                style={{ padding: "0.65rem 1.25rem" }}
                            >
                                <FiXCircle /> Confirm Cancellation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Pickup Again Design Modal */}
            {requestAgainDevice && (
                <div className="vd-modal-overlay" onClick={() => !isSubmittingRequestAgain && setRequestAgainDevice(null)}>
                    <div className="vd-confirm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                            <div className="vd-confirm-icon-wrapper" style={{ margin: 0, width: "48px", height: "48px", background: "#eef2ff", borderColor: "#e0e7ff" }}>
                                <FiRefreshCw style={{ fontSize: "1.4rem", color: "#059669" }} />
                            </div>
                            <div>
                                <h3 className="vd-confirm-title" style={{ margin: 0 }}>Request Pickup Again</h3>
                                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                    {requestAgainDevice.brand} {requestAgainDevice.model}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: "grid", gap: "0.85rem", marginBottom: "1.5rem" }}>
                            <div>
                                <label style={{ fontSize: "0.775rem", fontWeight: 700, color: "#4a5568" }}>Select New Pickup Date *</label>
                                <input 
                                    type="date" 
                                    className={`vd-design-input ${requestAgainErrors.pickupDate ? "input-error" : ""}`}
                                    value={newPickupDate}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    style={requestAgainErrors.pickupDate ? { borderColor: "#e53e3e" } : {}}
                                />
                                {requestAgainErrors.pickupDate && (
                                    <span style={{ color: "#e53e3e", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
                                        {requestAgainErrors.pickupDate}
                                    </span>
                                )}
                            </div>
                            <div>
                                <label style={{ fontSize: "0.775rem", fontWeight: 700, color: "#4a5568" }}>Preferred Time Slot *</label>
                                <select 
                                    className={`vd-design-input ${requestAgainErrors.timeSlot ? "input-error" : ""}`}
                                    value={newTimeSlot}
                                    onChange={(e) => handleTimeSlotChange(e.target.value)}
                                    style={requestAgainErrors.timeSlot ? { borderColor: "#e53e3e" } : {}}
                                >
                                    <option value="">Select Time Slot</option>
                                    <option value="Morning (09:00 AM - 12:00 PM)">Morning (09:00 AM - 12:00 PM)</option>
                                    <option value="Afternoon (01:00 PM - 04:00 PM)">Afternoon (01:00 PM - 04:00 PM)</option>
                                    <option value="Evening (04:00 PM - 07:00 PM)">Evening (04:00 PM - 07:00 PM)</option>
                                </select>
                                {requestAgainErrors.timeSlot && (
                                    <span style={{ color: "#e53e3e", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
                                        {requestAgainErrors.timeSlot}
                                    </span>
                                )}
                            </div>
                            <div>
                                <label style={{ fontSize: "0.775rem", fontWeight: 700, color: "#4a5568" }}>Pickup Address *</label>
                                <input 
                                    type="text" 
                                    className={`vd-design-input ${requestAgainErrors.address ? "input-error" : ""}`}
                                    value={newPickupAddress} 
                                    onChange={(e) => handleAddressChange(e.target.value)}
                                    style={requestAgainErrors.address ? { borderColor: "#e53e3e" } : {}}
                                    placeholder="Enter pickup address (letters, spaces, commas)"
                                />
                                {requestAgainErrors.address && (
                                    <span style={{ color: "#e53e3e", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>
                                        {requestAgainErrors.address}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="vd-confirm-actions" style={{ justifyContent: "flex-end" }}>
                            <button
                                disabled={isSubmittingRequestAgain}
                                onClick={() => setRequestAgainDevice(null)}
                                className="vd-confirm-cancel-btn"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={isSubmittingRequestAgain}
                                onClick={requestPickupAgain}
                                className="vd-btn-request-again"
                                style={{ padding: "0.65rem 1.25rem" }}
                            >
                                <FiRefreshCw /> {isSubmittingRequestAgain ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Design Toast Notification */}
            {actionSuccessMessage && (
                <div className="pk-toast-notification">
                    <div className="pk-toast-notification-icon">
                        <FiCheckCircle />
                    </div>
                    <div>
                        <div style={{ fontSize: "0.7rem", color: "#34d399", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>SUCCESS</div>
                        <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "#f8fafc" }}>{actionSuccessMessage}</span>
                    </div>
                    <button 
                        type="button" 
                        className="pk-toast-notification-close" 
                        onClick={() => setActionSuccessMessage("")}
                    >
                        <FiX />
                    </button>
                </div>
            )}

            {/* Device Barcode & QR Code Modal Dialog */}
            {qrModalTarget && (
                <div className="pro-modal-overlay" onClick={() => setQrModalTarget(null)} style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(6px)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
                    <div className="pro-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ background: "#ffffff", borderRadius: "16px", maxWidth: "440px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                        <div style={{ padding: "1.25rem 1.5rem", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>Device Barcode & QR Code</h3>
                                <p style={{ margin: "0.2rem 0 0", fontSize: "0.775rem", color: "#94a3b8" }}>
                                    #{qrModalTarget.deviceId} &bull; {qrModalTarget.brand} {qrModalTarget.model}
                                </p>
                            </div>
                            <button onClick={() => setQrModalTarget(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#ffffff", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <FiX />
                            </button>
                        </div>

                        <div style={{ padding: "1.5rem", textAlign: "center" }}>
                            <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "14px", border: "1px solid #e2e8f0", display: "inline-block", marginBottom: "1.25rem" }}>
                                <QRCodeCanvas
                                    value={qrModalTarget.deviceQrToken || `ECOQR-DEV-${qrModalTarget.deviceId}`}
                                    size={180}
                                    bgColor={"#ffffff"}
                                    fgColor={"#0f172a"}
                                    level={"H"}
                                />
                            </div>

                            <div style={{ fontFamily: "monospace", fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", background: "#f1f5f9", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", letterSpacing: "0.08em", display: "inline-block", marginBottom: "1rem" }}>
                                {qrModalTarget.deviceQrToken || `ECOQR-DEV-${qrModalTarget.deviceId}`}
                            </div>

                            <div style={{ fontSize: "0.825rem", color: "#475569", background: "#eff6ff", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #bfdbfe", textAlign: "left", display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                                <FiInfo style={{ color: "#2563eb", fontSize: "1rem", flexShrink: 0, marginTop: "0.1rem" }} />
                                <div>
                                    <strong>Pickup Verification:</strong> Present this Barcode / QR Code to the EcoCycle Collection Agent when they arrive at your address to verify e-waste device handover.
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", textAlign: "right" }}>
                            <button className="profile-btn cancel" onClick={() => setQrModalTarget(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Pickupdetails;
