import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
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

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found in localStorage, redirecting to login.");
            navigate("/");
            return;
        }
        fetchProfile(token);
        fetchPickupRequests(token);
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
            console.error("Pickupdetails profile fetch error:", err);
        }
    };

    const fetchPickupRequests = async (token) => {
        try {
            setLoading(true);
            const response = await axios.get("https://localhost:7102/api/Inspection/my-pickup-requests", {
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

    // Filter to strictly devices accepted by Collection Agent for delivery
    const acceptedRequests = pickupRequests.filter(req => {
        if (req.collectionAgentAccepted === true) return true;
        const cas = String(req.collectionAssignmentStatus || "").toLowerCase();
        if (["accepted", "completed", "intransit", "pickedup", "delivered"].includes(cas)) return true;
        const reqStatus = String(req.requestStatus || "").toLowerCase();
        if (["accepted", "completed", "in inspection"].includes(reqStatus)) return true;
        return false;
    });

    // KPI Metrics calculation
    const inTransitCount = acceptedRequests.filter(r => {
        const cas = String(r.collectionAssignmentStatus || "").toLowerCase();
        return cas === "intransit" || cas === "pickedup";
    }).length;

    const completedCount = acceptedRequests.filter(r => {
        const cas = String(r.collectionAssignmentStatus || "").toLowerCase();
        return cas === "completed" || cas === "delivered";
    }).length;

    const totalWeight = acceptedRequests.reduce((sum, r) => sum + ((Number(r.weight) || 0) * (Number(r.quantity) || 1)), 0);

    // Tab Filtered & Search Filtered requests
    const filteredRequests = acceptedRequests.filter(req => {
        // Tab filter
        const cas = String(req.collectionAssignmentStatus || "").toLowerCase();
        if (activeTab === "InTransit" && cas !== "intransit" && cas !== "pickedup") return false;
        if (activeTab === "Delivered" && cas !== "completed" && cas !== "delivered") return false;
        if (activeTab === "Accepted" && cas !== "accepted" && cas !== "assigned") return false;

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
        const cat = String(categoryName || "").toLowerCase();
        if (cat.includes("computer") || cat.includes("laptop")) return <FiCpu />;
        if (cat.includes("mobile") || cat.includes("phone")) return <FiSmartphone />;
        if (cat.includes("battery") || cat.includes("power")) return <FiBatteryCharging />;
        if (cat.includes("appliance") || cat.includes("tv")) return <FiTv />;
        return <FiBox />;
    };

    const getDeliveryStatusBadge = (req) => {
        const cas = String(req.collectionAssignmentStatus || "").toLowerCase();
        if (cas === "completed" || cas === "delivered") {
            return <span className="status-pill status-completed">Delivered</span>;
        } else if (cas === "intransit" || cas === "pickedup") {
            return <span className="status-pill status-progress">In Transit</span>;
        } else if (cas === "accepted") {
            return <span className="status-pill status-assigned">Agent Accepted</span>;
        } else {
            return <span className="status-pill status-scheduled">Scheduled</span>;
        }
    };

    const getAgentPhoto = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith("http") || photoPath.startsWith("data:")) return photoPath;
        return `https://localhost:7102/uploads/profile/${photoPath}`;
    };

    return (
        <div className="pickup-details-page">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="citizen-main-content">
                {/* Title & User Header Ribbon */}
                <div className="vd-ribbon" style={{ marginBottom: "1.75rem" }}>
                    <div>
                        <h1 className="vd-page-heading">Accepted Pickup Details</h1>
                        <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.875rem" }}>
                            Track e-waste devices accepted by collection agents for delivery & recycling
                        </p>
                    </div>

                    <div className="vd-top-actions">
                        <button 
                            className="vd-circle-btn" 
                            title="Refresh Data"
                            onClick={() => {
                                const token = localStorage.getItem("token");
                                if (token) fetchPickupRequests(token);
                            }}
                        >
                            <FiRefreshCw className={loading ? "spin-animation" : ""} />
                        </button>

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
                    {/* KPI 1 - Total Accepted */}
                    <div className="vd-kpi-card">
                        <div className="vd-kpi-header">
                            <div className="vd-kpi-icon-circle teal">
                                <FiTruck />
                            </div>
                            <span className="vd-kpi-badge">Active Agent</span>
                        </div>
                        <div>
                            <span className="vd-kpi-label">Accepted For Delivery</span>
                            <div className="vd-kpi-body">
                                <h3 className="vd-kpi-number">{acceptedRequests.length}</h3>
                                <span className="vd-kpi-badge">Items</span>
                            </div>
                        </div>
                    </div>

                    {/* KPI 2 - In Transit */}
                    <div className="vd-kpi-card">
                        <div className="vd-kpi-header">
                            <div className="vd-kpi-icon-circle purple">
                                <FiNavigation />
                            </div>
                            <span className="vd-kpi-badge" style={{ background: "#fef3c7", color: "#b45309" }}>Live</span>
                        </div>
                        <div>
                            <span className="vd-kpi-label">In Transit / Picked Up</span>
                            <div className="vd-kpi-body">
                                <h3 className="vd-kpi-number">{inTransitCount}</h3>
                                <span className="vd-kpi-badge" style={{ background: "#eff6ff", color: "#1d4ed8" }}>En Route</span>
                            </div>
                        </div>
                    </div>

                    {/* KPI 3 - Completed */}
                    <div className="vd-kpi-card">
                        <div className="vd-kpi-header">
                            <div className="vd-kpi-icon-circle amber" style={{ background: "#ecfdf5", color: "#059669" }}>
                                <FiCheckCircle />
                            </div>
                        </div>
                        <div>
                            <span className="vd-kpi-label">Delivered To Facility</span>
                            <div className="vd-kpi-body">
                                <h3 className="vd-kpi-number">{completedCount}</h3>
                                <span className="vd-kpi-badge" style={{ background: "#ecfdf5", color: "#047857" }}>Completed</span>
                            </div>
                        </div>
                    </div>

                    {/* KPI 4 - Total Weight */}
                    <div className="vd-kpi-card">
                        <div className="vd-kpi-header">
                            <div className="vd-kpi-icon-circle teal" style={{ background: "#f3e8ff", color: "#7c3aed" }}>
                                <FiBox />
                            </div>
                        </div>
                        <div>
                            <span className="vd-kpi-label">Total Delivery Weight</span>
                            <div className="vd-kpi-body">
                                <h3 className="vd-kpi-number">{totalWeight} kg</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter, Search & View Controls Bar */}
                <div className="pk-controls-bar">
                    <div className="pk-search-box">
                        <FiSearch style={{ color: "#64748b", fontSize: "1.1rem" }} />
                        <input 
                            type="text" 
                            placeholder="Search by brand, category, agent, or address..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <FiX style={{ cursor: "pointer", color: "#94a3b8" }} onClick={() => setSearchQuery("")} />
                        )}
                    </div>

                    <div className="pk-filter-tabs">
                        <button 
                            className={`pk-tab-btn ${activeTab === "All" ? "active" : ""}`}
                            onClick={() => setActiveTab("All")}
                        >
                            All Accepted ({acceptedRequests.length})
                        </button>
                        <button 
                            className={`pk-tab-btn ${activeTab === "Accepted" ? "active" : ""}`}
                            onClick={() => setActiveTab("Accepted")}
                        >
                            Agent Accepted
                        </button>
                        <button 
                            className={`pk-tab-btn ${activeTab === "InTransit" ? "active" : ""}`}
                            onClick={() => setActiveTab("InTransit")}
                        >
                            In Transit ({inTransitCount})
                        </button>
                        <button 
                            className={`pk-tab-btn ${activeTab === "Delivered" ? "active" : ""}`}
                            onClick={() => setActiveTab("Delivered")}
                        >
                            Delivered ({completedCount})
                        </button>
                    </div>

                    <div className="pk-view-toggle">
                        <button 
                            className={`pk-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                            onClick={() => setViewMode("grid")}
                            title="Grid View"
                        >
                            <FiGrid />
                        </button>
                        <button 
                            className={`pk-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                            onClick={() => setViewMode("table")}
                            title="Table View"
                        >
                            <FiList />
                        </button>
                    </div>
                </div>

                {/* Main Devices Container */}
                <div className="panel-card" style={{ padding: "1.5rem" }}>
                    <div className="panel-header" style={{ marginBottom: "1rem" }}>
                        <div>
                            <h2 className="panel-title">Devices Accepted by Collection Agent</h2>
                            <p className="panel-subtitle">
                                Collection agent assignment details, vehicle info & live delivery progress
                            </p>
                        </div>
                        <Link to="/add-device" className="panel-action-link" style={{ fontSize: "0.85rem" }}>
                            + Add New Device
                        </Link>
                    </div>

                    {loading ? (
                        <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "#64748b" }}>
                            <FiRefreshCw className="spin-animation" style={{ fontSize: "2rem", color: "#059669", marginBottom: "0.5rem" }} />
                            <p style={{ fontWeight: 600, margin: 0 }}>Loading accepted pickup requests...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "#64748b" }}>
                            <FiBox style={{ fontSize: "2.5rem", color: "#cbd5e1", marginBottom: "0.75rem" }} />
                            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>No Accepted Pickup Devices Found</h3>
                            <p style={{ margin: "0.35rem 0 1.25rem", fontSize: "0.875rem", color: "#64748b" }}>
                                {searchQuery 
                                    ? `No devices matched "${searchQuery}"`
                                    : "There are currently no devices accepted by a collection agent for delivery."}
                            </p>
                            <Link to="/add-device" className="profile-btn save" style={{ textDecoration: "none", display: "inline-flex", padding: "0.6rem 1.35rem" }}>
                                + Schedule E-Waste Pickup
                            </Link>
                        </div>
                    ) : viewMode === "grid" ? (
                        /* GRID VIEW */
                        <div className="pk-grid">
                            {filteredRequests.map((req) => {
                                const agentPhoto = getAgentPhoto(req.collectionAgentPhoto);
                                return (
                                    <div key={req.deviceId} className="pk-card">
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
                                                        <div className="pk-device-meta">
                                                            {req.categoryName || "Device"} • {req.quantity || 1} Unit(s) ({req.weight || 0} kg)
                                                        </div>
                                                    </div>
                                                </div>
                                                {getDeliveryStatusBadge(req)}
                                            </div>

                                            {/* Collection Agent Profile Box */}
                                            <div className="pk-agent-box">
                                                {agentPhoto ? (
                                                    <img src={agentPhoto} alt="Agent" className="pk-agent-avatar" />
                                                ) : (
                                                    <div className="pk-agent-avatar">
                                                        {(req.collectionAgentName || "CA").charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="pk-agent-info">
                                                    <div className="pk-agent-name">
                                                        {capitalizeWords(req.collectionAgentName) || "Collection Agent"}
                                                    </div>
                                                    {req.collectionAgentPhone ? (
                                                        <a href={`tel:${req.collectionAgentPhone}`} className="pk-agent-phone" style={{ textDecoration: "none" }}>
                                                            <FiPhone style={{ fontSize: "0.75rem" }} /> {req.collectionAgentPhone}
                                                        </a>
                                                    ) : (
                                                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Contact Pending</span>
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
                                                    <span className="pk-detail-val" style={{ color: "#635bff", fontFamily: "monospace" }}>
                                                        #DEV-{req.deviceId}
                                                    </span>
                                                </div>
                                                <div className="pk-detail-item">
                                                    <span className="pk-detail-label">Scheduled Date</span>
                                                    <span className="pk-detail-val">
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

                                        <div className="pk-card-footer">
                                            <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                                                {req.acceptedAt ? `Accepted: ${formatDate(req.acceptedAt)}` : `Created: ${formatDate(req.createdAt)}`}
                                            </span>
                                            <div style={{ display: "flex", gap: "0.4rem" }}>
                                                <button 
                                                    className="table-view-btn"
                                                    style={{ background: "#fee2e2", color: "#dc2626", borderColor: "#fca5a5" }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                    }}
                                                >
                                                    Cancel Pickup
                                                </button>
                                                <button 
                                                    className="table-view-btn"
                                                    onClick={() => setSelectedPickup(req)}
                                                    style={{ background: "#059669", color: "#ffffff", borderColor: "#059669" }}
                                                >
                                                    Track & Details
                                                </button>
                                            </div>
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
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.map((req) => (
                                        <tr key={req.deviceId} style={{ cursor: "pointer" }} onClick={() => setSelectedPickup(req)}>
                                            <td>
                                                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#635bff", fontFamily: "monospace" }}>
                                                    #DEV-{req.deviceId}
                                                </div>
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
                                                <div style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "0.15rem" }}>
                                                    {req.categoryName || "Device"} • {req.quantity || 1} unit(s) ({req.weight || 0} kg)
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>
                                                    {capitalizeWords(req.collectionAgentName) || "Agent Assigned"}
                                                </div>
                                                {req.collectionAgentPhone && (
                                                    <a href={`tel:${req.collectionAgentPhone}`} onClick={(e) => e.stopPropagation()} style={{ fontSize: "0.775rem", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
                                                        <FiPhone style={{ fontSize: "0.7rem", marginRight: "0.2rem" }} />
                                                        {req.collectionAgentPhone}
                                                    </a>
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
                                            <td>{getDeliveryStatusBadge(req)}</td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <div style={{ display: "flex", gap: "0.35rem" }}>
                                                    <button 
                                                        className="table-view-btn"
                                                        onClick={() => setSelectedPickup(req)}
                                                    >
                                                        View Details
                                                    </button>
                                                    <button 
                                                        className="table-view-btn"
                                                        style={{ background: "#fee2e2", color: "#dc2626", borderColor: "#fca5a5" }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
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
                            justifyContent: "space-between"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{ background: "rgba(255,255,255,0.2)", padding: "0.5rem", borderRadius: "10px", display: "flex" }}>
                                    <FiTruck style={{ fontSize: "1.4rem" }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Collection Delivery Details</h3>
                                    <span style={{ fontSize: "0.75rem", opacity: 0.9 }}>#DEV-{selectedPickup.deviceId} • {selectedPickup.brand} {selectedPickup.model}</span>
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
                        <div style={{ padding: "1.5rem", maxHeight: "75vh", overflowY: "auto" }}>
                            {/* Assigned Collection Agent Banner */}
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
                                        <div style={{ fontSize: "0.725rem", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Collection Agent</div>
                                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#065f46" }}>
                                            {capitalizeWords(selectedPickup.collectionAgentName) || "Agent Assigned"}
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

                            {/* Delivery Progress Timeline */}
                            <div style={{ marginBottom: "1.25rem" }}>
                                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", fontWeight: 700, color: "#1e293b" }}>
                                    Delivery Progress Timeline
                                </h4>
                                <div className="pk-timeline">
                                    {/* Step 1: Created */}
                                    <div className="pk-timeline-step completed">
                                        <div className="pk-timeline-dot">
                                            <FiCheck style={{ fontSize: "0.7rem" }} />
                                        </div>
                                        <div className="pk-step-title">Pickup Request Created</div>
                                        <div className="pk-step-desc">Item registered in EcoCycle portal</div>
                                        <div className="pk-step-time">{formatDate(selectedPickup.createdAt)}</div>
                                    </div>

                                    {/* Step 2: Inspection */}
                                    <div className="pk-timeline-step completed">
                                        <div className="pk-timeline-dot">
                                            <FiCheck style={{ fontSize: "0.7rem" }} />
                                        </div>
                                        <div className="pk-step-title">Technician Inspection Approved</div>
                                        <div className="pk-step-desc">Inspector: {selectedPickup.technicianName || "Approved"}</div>
                                    </div>

                                    {/* Step 3: Collection Agent Accepted */}
                                    <div className="pk-timeline-step completed">
                                        <div className="pk-timeline-dot">
                                            <FiCheck style={{ fontSize: "0.7rem" }} />
                                        </div>
                                        <div className="pk-step-title">Collection Agent Accepted Delivery</div>
                                        <div className="pk-step-desc">Assigned Agent: {capitalizeWords(selectedPickup.collectionAgentName)}</div>
                                        {selectedPickup.acceptedAt && (
                                            <div className="pk-step-time">{formatDate(selectedPickup.acceptedAt)}</div>
                                        )}
                                    </div>

                                    {/* Step 4: Picked Up / In Transit */}
                                    {(() => {
                                        const cas = String(selectedPickup.collectionAssignmentStatus || "").toLowerCase();
                                        const isPickedUp = cas === "intransit" || cas === "pickedup" || cas === "completed" || cas === "delivered";
                                        return (
                                            <div className={`pk-timeline-step ${isPickedUp ? "completed" : "active"}`}>
                                                <div className="pk-timeline-dot">
                                                    {isPickedUp ? <FiCheck style={{ fontSize: "0.7rem" }} /> : null}
                                                </div>
                                                <div className="pk-step-title">Picked Up / En Route</div>
                                                <div className="pk-step-desc">
                                                    {isPickedUp ? "Item collected by agent and in transit" : "Awaiting agent pickup at scheduled slot"}
                                                </div>
                                                {selectedPickup.pickedUpAt && (
                                                    <div className="pk-step-time">{formatDate(selectedPickup.pickedUpAt)}</div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* Step 5: Delivered */}
                                    {(() => {
                                        const cas = String(selectedPickup.collectionAssignmentStatus || "").toLowerCase();
                                        const isDelivered = cas === "completed" || cas === "delivered";
                                        return (
                                            <div className={`pk-timeline-step ${isDelivered ? "completed" : ""}`}>
                                                <div className="pk-timeline-dot">
                                                    {isDelivered ? <FiCheck style={{ fontSize: "0.7rem" }} /> : null}
                                                </div>
                                                <div className="pk-step-title">Delivered to Processing Center</div>
                                                <div className="pk-step-desc">
                                                    {isDelivered ? "Item safely handed over to facility" : "Final delivery step upon arrival"}
                                                </div>
                                                {selectedPickup.deliveredAt && (
                                                    <div className="pk-step-time">{formatDate(selectedPickup.deliveredAt)}</div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <button 
                                className="table-view-btn"
                                style={{ background: "#fee2e2", color: "#dc2626", borderColor: "#fca5a5", padding: "0.55rem 1.25rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                                onClick={(e) => e.preventDefault()}
                            >
                                <FiXCircle /> Cancel Pickup
                            </button>
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
        </div>
    );
}

export default Pickupdetails;
