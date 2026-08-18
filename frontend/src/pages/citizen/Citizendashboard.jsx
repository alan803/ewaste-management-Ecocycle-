import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiTruck,
    FiAward,
    FiZap,
    FiRefreshCw,
    FiPlusCircle,
    FiClock,
    FiUser,
    FiUserCheck,
    FiPhone,
    FiEye,
    FiDroplet,
    FiSun,
    FiDatabase,
    FiBell,
    FiLogOut,
    FiArrowUpRight,
    FiCalendar,
    FiCheckCircle,
    FiAlertCircle,
    FiActivity,
    FiHeart,
    FiFeather,
    FiCpu,
    FiSmartphone,
    FiBatteryCharging,
    FiTv,
    FiShield,
    FiSearch,
    FiChevronDown,
    FiMoreVertical,
    FiBox,
    FiMapPin,
    FiFileText,
    FiInfo,
    FiX
} from "react-icons/fi";
import "./Citizendashboard.css";

function CitizenDashboard() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [inspectionRequests, setInspectionRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [selectedPickupDetails, setSelectedPickupDetails] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found in localStorage, redirecting to login.");
            navigate("/");
            return;
        }
        fetchProfile(token);
        fetchMyPickupRequests(token);
    }, [navigate]);

    const fetchProfile = async (token) => {
        try {
            const response = await axios.get("https://localhost:7102/api/User/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data || {};
            setProfile(data);

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
            console.error("Dashboard profile fetch error:", err);
        }
    };

    const fetchMyPickupRequests = async (token) => {
        try {
            setLoadingRequests(true);
            const response = await axios.get("https://localhost:7102/api/Inspection/my-pickup-requests", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInspectionRequests(response.data || []);
        } catch (err) {
            console.error("Error fetching inspection requests:", err);
        } finally {
            setLoadingRequests(false);
        }
    };

    const userName = profile?.firstName 
        ? `${profile.firstName} ${profile.lastName || ""}`.trim()
        : localStorage.getItem("firstName") ||
          localStorage.getItem("userName") ||
          localStorage.getItem("username") ||
          localStorage.getItem("name") ||
          "Citizen Champion";

    // Filter to only show devices where Collection Agent has accepted for delivery
    const acceptedDeliveryRequests = inspectionRequests.filter(req => {
        if (req.collectionAgentAccepted === true) return true;
        const cas = String(req.collectionAssignmentStatus || "").toLowerCase();
        if (cas === "accepted" || cas === "completed" || cas === "intransit" || cas === "pickedup" || cas === "delivered") return true;
        const reqStatus = String(req.requestStatus || "").toLowerCase();
        if (reqStatus === "accepted" || reqStatus === "completed" || reqStatus === "in inspection") return true;
        return false;
    });

    const activeCount = acceptedDeliveryRequests.filter(r => r.requestStatus !== "Completed" && r.requestStatus !== "Rejected").length;

    const totalRecycledWeight = acceptedDeliveryRequests
        .reduce((sum, r) => sum + ((Number(r.weight) || 0) * (Number(r.quantity) || 1)), 0);

    const capitalizeWords = (str) => {
        if (!str) return "";
        return str
            .toLowerCase()
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const getStatusBadge = (status) => {
        const s = String(status || "").toLowerCase().replace(/\s+/g, "");
        if (s === "completed") {
            return <span className="status-pill status-completed">Completed</span>;
        } else if (s === "assigned" || s === "inspectorassigned") {
            return <span className="status-pill status-assigned">Inspector Assigned</span>;
        } else if (s === "accepted" || s === "ininspection" || s === "inprogress") {
            return <span className="status-pill status-progress">In Inspection</span>;
        } else if (s === "rejected" || s === "cancelled") {
            return <span className="status-pill status-cancelled">Rejected</span>;
        } else {
            return <span className="status-pill status-scheduled">Scheduled</span>;
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };

    return (
        <div className="citizen-dashboard-layout">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="citizen-main-content">
                {/* Title & User Header Ribbon */}
                <div className="vd-ribbon" style={{ marginBottom: "1.75rem" }}>
                    <h1 className="vd-page-heading">Citizen Eco Dashboard</h1>

                    <div className="vd-top-actions">
                        <button className="vd-circle-btn" title="Notifications" style={{ position: "relative" }}>
                            <FiBell />
                            <span style={{ position: "absolute", top: "10px", right: "10px", width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444" }}></span>
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

                {/* KPI Summary Cards Grid */}
                <div className="vd-kpi-grid">
                    {/* KPI 1 */}
                    <div className="vd-kpi-card">
                        <div className="vd-kpi-header">
                            <div className="vd-kpi-icon-circle teal">
                                <FiRefreshCw />
                            </div>
                            <FiMoreVertical style={{ color: "#a0aec0", cursor: "pointer" }} />
                        </div>
                        <div>
                            <span className="vd-kpi-label">E-Waste Recycled</span>
                            <div className="vd-kpi-body">
                                <h3 className="vd-kpi-number">{totalRecycledWeight} kg</h3>
                            </div>
                        </div>
                    </div>

                    {/* KPI 2 - Total Pickup Requests */}
                    <div className="vd-kpi-card">
                        <div className="vd-kpi-header">
                            <div className="vd-kpi-icon-circle purple">
                                <FiTruck />
                            </div>
                            <FiMoreVertical style={{ color: "#a0aec0", cursor: "pointer" }} />
                        </div>
                        <div>
                            <span className="vd-kpi-label">Pickup Requests</span>
                            <div className="vd-kpi-body">
                                <h3 className="vd-kpi-number">{acceptedDeliveryRequests.length}</h3>
                                <span className="vd-kpi-badge">+{activeCount} Active</span>
                            </div>
                        </div>
                    </div>

                    {/* KPI 3 */}
                    <div className="vd-kpi-card">
                        <div className="vd-kpi-header">
                            <div className="vd-kpi-icon-circle amber">
                                <FiAward />
                            </div>
                            <FiMoreVertical style={{ color: "#a0aec0", cursor: "pointer" }} />
                        </div>
                        <div>
                            <span className="vd-kpi-label">Eco Reward Balance</span>
                            <div className="vd-kpi-body">
                                <h3 className="vd-kpi-number">1,250 pts</h3>
                                <span className="vd-kpi-badge" style={{ background: "#fef3c7", color: "#b45309" }}>+150 pts</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main 2-Column Dashboard Grid */}
                <div className="vd-dashboard-grid">
                    {/* Left Column (Main Panel) */}
                    <div>
                        {/* E-Waste Category Cards */}
                        <div className="panel-card">
                            <div className="panel-header">
                                <div>
                                    <h2 className="panel-title">Recycle E-Waste By Category</h2>
                                    <p className="panel-subtitle">Select an electronic item category to schedule an instant eco-pickup</p>
                                </div>
                            </div>

                            <div className="category-cards-grid">
                                <Link to="/citizen/pickup?cat=computers" className="category-card">
                                    <div className="cat-icon-badge">
                                        <FiCpu />
                                    </div>
                                    <div className="cat-info">
                                        <h3>Computers & Laptops</h3>
                                        <p>Desktops, Laptops, Monitors & CPUs</p>
                                        <span className="cat-points-tag">+100 pts / unit</span>
                                    </div>
                                </Link>

                                <Link to="/citizen/pickup?cat=mobiles" className="category-card">
                                    <div className="cat-icon-badge">
                                        <FiSmartphone />
                                    </div>
                                    <div className="cat-info">
                                        <h3>Mobiles & Tablets</h3>
                                        <p>Smartphones, Tablets & Chargers</p>
                                        <span className="cat-points-tag">+50 pts / unit</span>
                                    </div>
                                </Link>

                                <Link to="/citizen/pickup?cat=power" className="category-card">
                                    <div className="cat-icon-badge">
                                        <FiBatteryCharging />
                                    </div>
                                    <div className="cat-info">
                                        <h3>Batteries & Power</h3>
                                        <p>Li-Ion Batteries, UPS Units, Adapters</p>
                                        <span className="cat-points-tag">+30 pts / kg</span>
                                    </div>
                                </Link>

                                <Link to="/citizen/pickup?cat=appliances" className="category-card">
                                    <div className="cat-icon-badge">
                                        <FiTv />
                                    </div>
                                    <div className="cat-info">
                                        <h3>Home Electronics</h3>
                                        <p>TVs, Audio Gear, Microwaves, Printers</p>
                                        <span className="cat-points-tag">+120 pts / unit</span>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Recent Pickups Table Card with Full Scheduled Details */}
                        <div className="panel-card">
                            <div className="panel-header">
                                <div>
                                    <h2 className="panel-title">My Scheduled Pickup Requests</h2>
                                    <p className="panel-subtitle">Scheduled pickup slots, address locations & inspection statuses</p>
                                </div>
                                <Link to="/view-device" className="panel-action-link">
                                    View Devices <FiArrowUpRight />
                                </Link>
                            </div>

                            <div className="glass-table-wrapper">
                                {loadingRequests ? (
                                    <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                                        Loading your pickup requests...
                                    </div>
                                ) : acceptedDeliveryRequests.length === 0 ? (
                                    <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", color: "#64748b" }}>
                                        <FiBox style={{ fontSize: "2rem", color: "#94a3b8", marginBottom: "0.5rem" }} />
                                        <p style={{ margin: 0, fontWeight: 600 }}>No pickup requests accepted for delivery yet.</p>
                                        <p style={{ margin: "0.25rem 0 1rem", fontSize: "0.85rem", color: "#94a3b8" }}>Requests will appear here once accepted by a collection agent.</p>
                                        <Link to="/add-device" className="profile-btn save" style={{ textDecoration: "none", display: "inline-flex", padding: "0.55rem 1.25rem" }}>
                                            + Schedule Pickup
                                        </Link>
                                    </div>
                                ) : (
                                     <table className="glass-table">
                                        <thead>
                                            <tr>
                                                <th>Request Tag</th>
                                                <th>Device & Item</th>
                                                <th>Scheduled Slot</th>
                                                <th>Pickup Address</th>
                                                <th>Inspector</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {acceptedDeliveryRequests.map((req) => (
                                                <tr key={req.deviceId} style={{ cursor: "pointer" }} onClick={() => setSelectedPickupDetails(req)}>
                                                    <td>
                                                        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#635bff", fontFamily: "monospace" }}>
                                                            #DEV-{req.deviceId}
                                                        </div>
                                                        {req.inspectionRequestId && (
                                                            <div style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 500, marginTop: "0.15rem" }}>
                                                                #INSP-{req.inspectionRequestId}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}>
                                                            {capitalizeWords(`${req.brand || ""} ${req.model || ""}`.trim()) || "E-Waste Item"}
                                                        </div>
                                                        <div style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "0.15rem" }}>
                                                            {req.categoryName || "Device"} • {req.quantity || 1} unit(s)
                                                        </div>
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
                                                        <div style={{ fontWeight: 500, fontSize: "0.85rem", color: "#334155", maxWidth: "170px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={req.address}>
                                                            {capitalizeWords(req.address)}
                                                        </div>
                                                        {req.landmark && (
                                                            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>
                                                                Near: {capitalizeWords(req.landmark)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {req.technicianName && req.technicianName !== "Not Assigned" ? (
                                                            <div>
                                                                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>
                                                                    {capitalizeWords(req.technicianName)}
                                                                </div>
                                                                {req.technicianPhone && (
                                                                    <div style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "0.15rem" }}>
                                                                        {req.technicianPhone}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: "0.775rem", color: "#94a3b8", fontWeight: 500 }}>
                                                                Pending Assignment
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>{getStatusBadge(req.requestStatus)}</td>
                                                    <td>
                                                        <button 
                                                            className="table-view-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedPickupDetails(req);
                                                            }}
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Live Scheduled Pickup Details Side Panel) */}
                    <div className="vd-appointments-panel">
                        <div>
                            <h3 className="vd-panel-header-title">Scheduled Pickup Slots</h3>

                            <div className="vd-appt-list">
                                {acceptedDeliveryRequests.length === 0 ? (
                                    <div style={{ padding: "1.5rem 0", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                                        No active pickup schedules.
                                    </div>
                                ) : (
                                    acceptedDeliveryRequests.slice(0, 5).map((pick) => (
                                        <div 
                                            key={pick.deviceId} 
                                            className="vd-appt-item" 
                                            style={{ cursor: "pointer" }}
                                            onClick={() => setSelectedPickupDetails(pick)}
                                        >
                                            <div className="vd-appt-user">
                                                <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                                                    <FiTruck />
                                                </div>
                                                <div>
                                                    <div className="vd-appt-name">{pick.brand} {pick.model}</div>
                                                    <div className="vd-appt-loc" style={{ fontSize: "0.75rem" }}>
                                                        {pick.address ? (pick.address.length > 22 ? pick.address.substring(0, 22) + "..." : pick.address) : "Home Pickup"}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="vd-appt-time">
                                                <span className="vd-appt-day">{formatDate(pick.pickupDate)}</span>
                                                <span className="vd-appt-hour">{pick.timeSlot}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <Link to="/citizen/pickup" className="vd-see-more-btn">
                            Book New Pickup Schedule →
                        </Link>
                    </div>
                </div>
            </main>

            {/* Scheduled Pickup Details Modal */}
            {selectedPickupDetails && (
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
                        borderRadius: "16px",
                        width: "100%",
                        maxWidth: "540px",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                        overflow: "hidden"
                    }}>
                        <div style={{
                            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                            color: "#ffffff",
                            padding: "1.25rem 1.5rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                <FiTruck style={{ fontSize: "1.4rem" }} />
                                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Scheduled Pickup Details</h3>
                            </div>
                            <button 
                                onClick={() => setSelectedPickupDetails(null)}
                                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#ffffff", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <FiX />
                            </button>
                        </div>

                        <div style={{ padding: "1.5rem", maxHeight: "75vh", overflowY: "auto" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
                                <div>
                                    <span className="id-badge">#DEV-{selectedPickupDetails.deviceId}</span>
                                    {selectedPickupDetails.inspectionRequestId && (
                                        <span className="id-badge" style={{ marginLeft: "0.5rem", background: "#e0f2fe", color: "#0369a1" }}>#INSP-{selectedPickupDetails.inspectionRequestId}</span>
                                    )}
                                </div>
                                {getStatusBadge(selectedPickupDetails.requestStatus)}
                            </div>

                            <div style={{ display: "grid", gap: "1rem" }}>
                                {/* Device & Category */}
                                <div style={{ background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>E-Waste Item</div>
                                    <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0f172a", marginTop: "0.15rem" }}>
                                        {selectedPickupDetails.brand} {selectedPickupDetails.model}
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 600, marginTop: "0.2rem" }}>
                                        Category: {selectedPickupDetails.categoryName} • {selectedPickupDetails.quantity} Unit(s) ({selectedPickupDetails.condition})
                                    </div>
                                </div>

                                {/* Schedule Date & Time Slot */}
                                <div style={{ background: "#f0fdf4", padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 600, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <FiClock /> Scheduled Date & Time
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#065f46", marginTop: "0.2rem" }}>
                                        {formatDate(selectedPickupDetails.pickupDate)}
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: "#047857", fontWeight: 500, marginTop: "0.1rem" }}>
                                        Time Slot: {selectedPickupDetails.timeSlot}
                                    </div>
                                </div>

                                {/* Pickup Address & Landmark */}
                                <div style={{ background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <FiMapPin /> Pickup Location
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1e293b", marginTop: "0.2rem" }}>
                                        {selectedPickupDetails.address}
                                    </div>
                                    {selectedPickupDetails.landmark && (
                                        <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "0.2rem" }}>
                                             Landmark: {selectedPickupDetails.landmark}
                                        </div>
                                    )}
                                </div>

                                {/* Instructions & Preference */}
                                {(selectedPickupDetails.pickupInstructions || selectedPickupDetails.processingPreference) && (
                                    <div style={{ background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                        <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                            <FiFileText /> Special Notes & Processing
                                        </div>
                                        {selectedPickupDetails.processingPreference && (
                                            <div style={{ fontSize: "0.825rem", color: "#334155", marginTop: "0.2rem" }}>
                                                <strong>Preference:</strong> {selectedPickupDetails.processingPreference}
                                            </div>
                                        )}
                                        {selectedPickupDetails.pickupInstructions && (
                                            <div style={{ fontSize: "0.825rem", color: "#334155", marginTop: "0.2rem" }}>
                                                <strong>Instructions:</strong> {selectedPickupDetails.pickupInstructions}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Assigned Officer */}
                                <div style={{ background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Assigned Inspector</div>
                                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginTop: "0.15rem" }}>
                                        {selectedPickupDetails.technicianName}
                                    </div>
                                    {selectedPickupDetails.technicianPhone && (
                                        <div style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: 500, marginTop: "0.15rem" }}>
                                            Contact: {selectedPickupDetails.technicianPhone}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", textAlign: "right" }}>
                            <button 
                                onClick={() => setSelectedPickupDetails(null)}
                                className="profile-btn save"
                                style={{ padding: "0.55rem 1.25rem" }}
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CitizenDashboard;