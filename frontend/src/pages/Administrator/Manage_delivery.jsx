import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import {
    FiTruck,
    FiBell,
    FiCheckCircle,
    FiClock,
    FiUser,
    FiPhone,
    FiSearch,
    FiGrid,
    FiList,
    FiCpu,
    FiSmartphone,
    FiBatteryCharging,
    FiTv,
    FiBox,
    FiMapPin,
    FiX,
    FiRefreshCw,
    FiNavigation,
    FiShield,
    FiCheck,
    FiCalendar,
    FiXCircle,
    FiEye,
    FiAlertTriangle,
    FiUserCheck,
    FiLogOut
} from "react-icons/fi";
import "./Manage_delivery.css";

function ManageDelivery() {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'
    const [selectedDelivery, setSelectedDelivery] = useState(null);

    const location = useLocation();
    const typeQuery = new URLSearchParams(location.search).get("type");

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetchDeliveries(token);
    }, []);

    const getAuthHeaders = (authToken) => {
        const token = authToken || localStorage.getItem("token");
        if (token && token !== "null" && token !== "undefined") {
            return { Authorization: `Bearer ${token}` };
        }
        return {};
    };

    const fetchDeliveries = async (authToken) => {
        const headers = getAuthHeaders(authToken);
        const config = Object.keys(headers).length > 0 ? { headers } : {};
        try {
            setLoading(true);
            const response = await axios.get("https://localhost:7102/api/CollectionAssignment/admin/all-assignments", config);
            setDeliveries(response.data || []);
        } catch (err) {
            console.error("Error fetching admin deliveries:", err);
        } finally {
            setLoading(false);
        }
    };

    // Metrics calculation
    const totalDeliveries = deliveries.length;
    const inTransitCount = deliveries.filter(d => {
        const delStat = String(d.deliveryStatus || "").toLowerCase();
        const cas = String(d.status || "").toLowerCase();
        return delStat === "intransit" || delStat === "outfordelivery" || delStat === "pendingverification" || delStat === "awaitingapproval" || cas === "outfordelivery" || cas === "pickupstarted" || cas === "awaitingtechnicianapproval" || cas === "en route";
    }).length;

    const deliveredCount = deliveries.filter(d => {
        const delStat = String(d.deliveryStatus || "").toLowerCase();
        const cas = String(d.status || "").toLowerCase();
        return delStat === "delivered" || delStat === "completed" || delStat === "deliveredtocenter" || cas === "deliveredtocenter" || d.deliveryDeviceVerified === true;
    }).length;

    const totalWeight = deliveries.reduce((sum, d) => sum + ((Number(d.weight) || 0) * (Number(d.quantity) || 1)), 0);

    const hasAgentStartedDelivery = (item) => {
        if (!item) return false;
        const delStat = String(item.deliveryStatus || "").toLowerCase();
        const cas = String(item.status || "").toLowerCase();
        const lcs = String(item.lifecycleStatus || "").toLowerCase();

        if (item.deliveryStartedAt || item.deliveryDeliveredAt) return true;

        const startedDeliveryStatuses = [
            "outfordelivery",
            "intransit",
            "pendingverification",
            "awaitingapproval",
            "awaitingtechnicianapproval",
            "delivered",
            "completed",
            "deliveredtocenter"
        ];

        if (startedDeliveryStatuses.includes(delStat)) return true;
        if (["outfordelivery", "deliveredtocenter", "delivered"].includes(cas)) return true;
        if (["handoverpendingverification", "atinspectioncenter"].includes(lcs)) return true;

        return false;
    };

    const filteredDeliveries = deliveries.filter(item => {
        if (!hasAgentStartedDelivery(item)) return false;

        const delStat = String(item.deliveryStatus || "").toLowerCase();
        const cas = String(item.status || "").toLowerCase();
        const itemType = String(item.assignmentType || "").toLowerCase();

        if (typeQuery) {
            const reqType = typeQuery.toLowerCase();
            if (reqType.includes("customer") && itemType.includes("recycling")) return false;
            if (reqType.includes("recycling") && !itemType.includes("recycling")) return false;
        }

        if (activeTab === "InTransit" && delStat !== "intransit" && delStat !== "outfordelivery" && delStat !== "pendingverification" && delStat !== "awaitingapproval" && cas !== "outfordelivery" && cas !== "pickupstarted" && cas !== "awaitingtechnicianapproval" && cas !== "en route") return false;
        if (activeTab === "Delivered" && delStat !== "delivered" && delStat !== "completed" && delStat !== "deliveredtocenter" && cas !== "deliveredtocenter" && !item.deliveryDeviceVerified) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const devName = `${item.brand || ""} ${item.model || ""}`.toLowerCase();
        const catName = String(item.categoryName || "").toLowerCase();
        const agentName = String(item.collectionAgentName || "").toLowerCase();
        const centerName = String(item.inspectionCenterName || "").toLowerCase();
        const techName = String(item.technicianName || "").toLowerCase();

        return (
            devName.includes(q) ||
            catName.includes(q) ||
            agentName.includes(q) ||
            centerName.includes(q) ||
            techName.includes(q)
        );
    });

    const getCategoryIcon = (categoryName) => {
        const cat = (categoryName || "").toLowerCase();
        if (cat.includes("computer") || cat.includes("laptop")) return <FiCpu />;
        if (cat.includes("mobile") || cat.includes("phone")) return <FiSmartphone />;
        if (cat.includes("battery") || cat.includes("power")) return <FiBatteryCharging />;
        if (cat.includes("appliance") || cat.includes("tv")) return <FiTv />;
        return <FiBox />;
    };

    const getStatusBadge = (item) => {
        const delStat = String(item?.deliveryStatus || "").toLowerCase();
        const cas = String(item?.status || "").toLowerCase();
        const lcs = String(item?.lifecycleStatus || "").toLowerCase();

        const badgeStyle = {
            padding: "0.22rem 0.55rem",
            fontSize: "0.725rem",
            fontWeight: 600,
            borderRadius: "9999px",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            whiteSpace: "nowrap"
        };

        if (delStat === "delivered" || delStat === "completed" || delStat === "deliveredtocenter" || cas === "deliveredtocenter" || item?.deliveryDeviceVerified === true) {
            return <span style={{ ...badgeStyle, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}><FiCheckCircle /> Delivered to Center</span>;
        } else if (delStat === "handoverrejected" || cas === "handoverrejected" || lcs === "handoverrejected") {
            return <span style={{ ...badgeStyle, background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" }}><FiAlertTriangle /> Handover Rejected</span>;
        } else if (delStat === "pendingverification" || delStat === "awaitingapproval" || cas === "awaitingtechnicianapproval" || lcs === "handoverpendingverification") {
            return <span style={{ ...badgeStyle, background: "#fffbe1", color: "#d97706", border: "1px solid #fde68a" }}><FiClock /> Awaiting Verification</span>;
        } else if (delStat === "intransit" || delStat === "outfordelivery" || cas === "outfordelivery" || cas === "pickupstarted" || cas === "en route") {
            return <span style={{ ...badgeStyle, background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}><FiNavigation /> En Route to Center</span>;
        } else if (cas === "accepted") {
            return <span style={{ ...badgeStyle, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}><FiUserCheck /> Agent Accepted</span>;
        } else if (cas === "assigned" || cas === "pending") {
            return <span style={{ ...badgeStyle, background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}><FiClock /> Agent Assigned (Pending)</span>;
        } else if (delStat === "expired" || cas === "expired") {
            return <span style={{ ...badgeStyle, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}><FiAlertTriangle /> Expired</span>;
        } else if (delStat === "cancelled" || cas === "cancelled") {
            return <span style={{ ...badgeStyle, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}><FiAlertTriangle /> Cancelled</span>;
        } else if (delStat === "failed" || cas === "failed") {
            return <span style={{ ...badgeStyle, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}><FiAlertTriangle /> Delivery Failed</span>;
        } else {
            return <span style={{ ...badgeStyle, background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}><FiClock /> Delivery Pending</span>;
        }
    };

    const getAgentPhoto = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith("http://") || photoPath.startsWith("https://") || photoPath.startsWith("data:")) return photoPath;
        if (photoPath.startsWith("/uploads/")) return `https://localhost:7102${photoPath}`;
        if (photoPath.startsWith("uploads/")) return `https://localhost:7102/${photoPath}`;
        const cleanPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
        return `https://localhost:7102/uploads/profile${cleanPath}`;
    };

    const getProofPhoto = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith("http://") || photoPath.startsWith("https://") || photoPath.startsWith("data:")) return photoPath;
        if (photoPath.startsWith("/uploads/")) return `https://localhost:7102${photoPath}`;
        if (photoPath.startsWith("uploads/")) return `https://localhost:7102/${photoPath}`;
        const cleanPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
        return `https://localhost:7102/uploads/pickups${cleanPath}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return dateStr;
        }
    };

    const capitalizeWords = (str) => {
        if (!str) return "";
        return str
            .toLowerCase()
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    return (
        <div className="admin-deliv-page">
            {/* Sidebar Navigation */}
            <Navbar />

            {/* Main Content Area */}
            <div className="admin-deliv-main">
                {/* Floating Glass Header */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <div className="command-brand">
                            <h1>Manage Center Deliveries</h1>
                        </div>
                        <p className="command-subtitle">
                            Monitor e-waste delivery dispatches en route to inspection facilities in real-time
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search delivery, agent, center..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span className="search-shortcut">⌘K</span>
                        </div>

                        <div className="topbar-actions">
                            <button className="glass-btn notification-btn" title="System Alerts">
                                <FiBell />
                                <span className="pulse-ping"></span>
                            </button>

                            <div className="user-profile-chip">
                                <div className="avatar-gradient">A</div>
                                <div className="user-info-text">
                                    <span className="name">Admin User</span>
                                    <span className="role">Super Admin</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Analytics Metric Cards Grid */}
                <div className="admin-metrics-grid">
                    <div className="admin-metric-card">
                        <div className="admin-metric-icon total">
                            <FiBox />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{totalDeliveries}</h3>
                            <p>Total Shipments</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon active">
                            <FiNavigation />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{inTransitCount}</h3>
                            <p>En Route to Center</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon done">
                            <FiCheckCircle />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{deliveredCount}</h3>
                            <p>Delivered to Center</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon alert">
                            <FiTruck />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{totalWeight.toFixed(1)} kg</h3>
                            <p>Total Dispatch Volume</p>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <section className="content-section">
                    <div className="panel-card table-panel">
                        <div className="panel-header">
                            <div>
                                <h3 className="panel-title">Center Dispatches &amp; Deliveries</h3>
                                <p className="panel-subtitle">
                                    Monitor e-waste delivery dispatches en route to inspection facilities in real-time
                                </p>
                            </div>
                            <div className="panel-actions">
                                <div className="filter-pill-group">
                                    {[
                                        { id: "All", label: "All Shipments" },
                                        { id: "InTransit", label: "En Route" },
                                        { id: "Delivered", label: "Delivered" }
                                    ].map((tab) => {
                                        const count = tab.id === "All"
                                            ? totalDeliveries
                                            : tab.id === "InTransit"
                                            ? inTransitCount
                                            : deliveredCount;

                                        return (
                                            <button
                                                key={tab.id}
                                                className={`pill-btn ${activeTab === tab.id ? "pill-btn--active" : ""}`}
                                                onClick={() => setActiveTab(tab.id)}
                                            >
                                                {tab.label} ({count})
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="admin-view-toggle">
                                    <button
                                        className={`admin-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                                        onClick={() => setViewMode("grid")}
                                        title="Grid View"
                                    >
                                        <FiGrid />
                                    </button>
                                    <button
                                        className={`admin-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                                        onClick={() => setViewMode("table")}
                                        title="Table View"
                                    >
                                        <FiList />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="loading-state">
                                <div className="loading-spinner"></div>
                                <p>Loading delivery feed...</p>
                            </div>
                        ) : filteredDeliveries.length === 0 ? (
                            <div className="no-data-state">
                                <FiBox className="no-data-icon" />
                                <p>No delivery dispatches matching "{activeTab}".</p>
                            </div>
                        ) : viewMode === "grid" ? (
                            <div className="admin-cards-grid">
                                {filteredDeliveries.map((item, index) => {
                                    const trackingId = `TRK-DEL-${item.collectionAssignmentId || item.deviceId}`;
                                    return (
                                        <div className="admin-pickup-card" key={item.collectionAssignmentId || item.deviceId || index}>
                                            <div>
                                                <div className="admin-card-header">
                                                    <div className="admin-card-top-row">
                                                        <div className="admin-cat-icon-box">
                                                            {getCategoryIcon(item.categoryName)}
                                                        </div>
                                                        <div>{getStatusBadge(item)}</div>
                                                    </div>
                                                    <div className="admin-card-title-group">
                                                        <h4 className="admin-card-brand-name">{item.brand} {item.model}</h4>
                                                        <p className="admin-card-cat-sub">
                                                            {trackingId} &bull; {item.categoryName || "E-Waste"} ({item.quantity || 1} units)
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="admin-card-body">
                                                    <div className="admin-agent-chip-box">
                                                        <div className="admin-agent-chip-left">
                                                            <div className="admin-agent-avatar">
                                                                {item.collectionAgentPhoto ? (
                                                                    <img src={getAgentPhoto(item.collectionAgentPhoto)} alt={item.collectionAgentName} />
                                                                ) : (
                                                                    (item.collectionAgentName || "A").charAt(0).toUpperCase()
                                                                )}
                                                            </div>
                                                            <div>
                                                                <span className="admin-agent-name">
                                                                    {capitalizeWords(item.collectionAgentName) || "Assigned Agent"}
                                                                </span>
                                                                <span className="admin-agent-sub">
                                                                    {item.collectionAgentPhone || "Ph: N/A"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {item.collectionAgentPhone && item.collectionAgentPhone !== "Ph: N/A" && (
                                                            <a href={`tel:${item.collectionAgentPhone}`} className="btn-admin-call" title="Call Agent">
                                                                <FiPhone />
                                                            </a>
                                                        )}
                                                    </div>

                                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", marginTop: "0.6rem" }}>
                                                        <div className="admin-detail-row">
                                                            <FiUser className="detail-icon" style={{ color: "#3b82f6" }} />
                                                            <div>
                                                                <div className="detail-label">
                                                                    {item.assignmentType === "TechnicianToRecyclingCenter" ? "Origin (Technician Hub)" : "Origin Customer"}
                                                                </div>
                                                                <div className="detail-val">
                                                                    {item.assignmentType === "TechnicianToRecyclingCenter"
                                                                        ? (item.technicianName || item.inspectionCenterName || "Technician Hub")
                                                                        : (item.customerName || "N/A")}
                                                                </div>
                                                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                                                    {item.assignmentType === "TechnicianToRecyclingCenter"
                                                                        ? (item.deliveredAddress || item.technicianAddress || item.city || "Inspection Center Address")
                                                                        : (item.city || "City N/A")}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="admin-detail-row">
                                                            <FiMapPin className="detail-icon" style={{ color: "#059669" }} />
                                                            <div>
                                                                <div className="detail-label">
                                                                    {item.assignmentType === "TechnicianToRecyclingCenter" ? "Destination (Recycling Center)" : "Destination Hub"}
                                                                </div>
                                                                <div className="detail-val">
                                                                    {item.assignmentType === "TechnicianToRecyclingCenter"
                                                                        ? (item.recyclingCenterName || "Recycling Facility")
                                                                        : (item.inspectionCenterName || "Central Hub")}
                                                                </div>
                                                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                                                    {item.assignmentType === "TechnicianToRecyclingCenter"
                                                                        ? (item.recyclingCenterAddress || "Recycling Facility Address")
                                                                        : `Tech: ${item.technicianName || "N/A"}`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {hasAgentStartedDelivery(item) && (
                                                <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px dashed #e2e8f0" }}>
                                                    <button
                                                        onClick={() => setSelectedDelivery(item)}
                                                        title="Track Live Status"
                                                        style={{
                                                            width: "100%",
                                                            height: "42px",
                                                            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                                                            color: "#ffffff",
                                                            border: "none",
                                                            borderRadius: "10px",
                                                            fontSize: "0.875rem",
                                                            fontWeight: 700,
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            gap: "0.55rem",
                                                            boxShadow: "0 4px 14px rgba(5, 150, 105, 0.28)",
                                                            cursor: "pointer",
                                                            transition: "all 0.2s ease"
                                                        }}
                                                    >
                                                        <FiNavigation style={{ fontSize: "1rem" }} />
                                                        <span>Track Live Status</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="glass-table-wrapper">
                                <table className="glass-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Tracking ID</th>
                                            <th>Device / Shipment</th>
                                            <th>Collection Agent</th>
                                            <th>Origin Customer</th>
                                            <th>Destination Hub</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDeliveries.map((item, index) => {
                                            const trackingId = `TRK-DEL-${item.collectionAssignmentId || item.deviceId}`;
                                            return (
                                                <tr key={item.collectionAssignmentId || item.deviceId || index} className="table-row-hover">
                                                    <td style={{ fontWeight: "700", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                                                        {index + 1}
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            background: "#f1f5f9",
                                                            color: "#0f172a",
                                                            border: "1px solid #cbd5e1",
                                                            padding: "0.2rem 0.5rem",
                                                            borderRadius: "6px",
                                                            fontSize: "0.725rem",
                                                            fontWeight: 700,
                                                            fontFamily: "monospace",
                                                            letterSpacing: "0.02em",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "0.25rem"
                                                        }}>
                                                            <FiNavigation style={{ color: "#059669" }} />
                                                            {trackingId}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="user-info">
                                                            <span className="user-name">
                                                                {item.brand} {item.model}
                                                            </span>
                                                            <span className="user-email">
                                                                {item.categoryName} &bull; {item.quantity || 1} Unit(s) | Task #{item.collectionAssignmentId}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="contact-cell">
                                                        <div className="user-info">
                                                            <span className="user-name">{item.collectionAgentName || "Assigned Agent"}</span>
                                                            <span className="user-email">{item.collectionAgentPhone || "Ph: N/A"}</span>
                                                        </div>
                                                    </td>
                                                    <td className="contact-cell">
                                                        <div className="user-info">
                                                            <span className="user-name">
                                                                {item.assignmentType === "TechnicianToRecyclingCenter"
                                                                    ? (item.technicianName || item.inspectionCenterName || "Technician Hub")
                                                                    : item.customerName}
                                                            </span>
                                                            <span className="user-email">
                                                                {item.assignmentType === "TechnicianToRecyclingCenter"
                                                                    ? (item.deliveredAddress || item.technicianAddress || item.city)
                                                                    : item.city}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="contact-cell">
                                                        <div className="user-info">
                                                            <span className="user-name">
                                                                {item.assignmentType === "TechnicianToRecyclingCenter"
                                                                    ? (item.recyclingCenterName || "Recycling Facility")
                                                                    : (item.inspectionCenterName || "Central Hub")}
                                                            </span>
                                                            <span className="user-email">
                                                                {item.assignmentType === "TechnicianToRecyclingCenter"
                                                                    ? (item.recyclingCenterAddress || "Recycling Facility Address")
                                                                    : `Technician: ${item.technicianName || "N/A"}`}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>{getStatusBadge(item)}</td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            {hasAgentStartedDelivery(item) ? (
                                                                <button
                                                                    className="btn-track-live"
                                                                    onClick={() => setSelectedDelivery(item)}
                                                                    title="Track Delivery Status"
                                                                >
                                                                    <FiNavigation />
                                                                    <span>Track</span>
                                                                </button>
                                                            ) : (
                                                                <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>—</span>
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
                </section>
            </div>

            {/* Live Delivery Tracking Stepper Modal (Matching Manage_pickup.jsx & Citizen Live Tracking) */}
            {selectedDelivery && (
                <div className="deliv-modal-overlay" onClick={() => setSelectedDelivery(null)}>
                    <div className="deliv-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px", borderRadius: "20px", overflow: "hidden", padding: 0 }}>
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
                                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Delivery Live Tracking</h3>
                                    <span style={{ fontSize: "0.775rem", opacity: 0.95, fontFamily: "monospace" }}>
                                        TRK-DEL-{selectedDelivery.collectionAssignmentId || selectedDelivery.deviceId} &bull; {selectedDelivery.brand} {selectedDelivery.model}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedDelivery(null)}
                                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#ffffff", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <FiX />
                            </button>
                        </div>

                        {/* Modal Content Body */}
                        <div style={{ padding: "1.5rem", maxHeight: "75vh", overflowY: "auto" }}>
                            {/* Tracking Summary Reference Card */}
                            <div style={{
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "14px",
                                padding: "1rem 1.2rem",
                                marginBottom: "1.25rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: "0.75rem"
                            }}>
                                <div>
                                    <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tracking ID</div>
                                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", fontFamily: "monospace", marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <FiNavigation style={{ color: "#059669" }} />
                                        TRK-DEL-{selectedDelivery.collectionAssignmentId || selectedDelivery.deviceId}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Current Tracking Status</div>
                                    <div style={{ marginTop: "0.2rem" }}>
                                        {getStatusBadge(selectedDelivery)}
                                    </div>
                                </div>
                            </div>
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
                                    {selectedDelivery.collectionAgentPhoto ? (
                                        <img 
                                            src={getAgentPhoto(selectedDelivery.collectionAgentPhoto)} 
                                            alt="Agent Profile" 
                                            style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} 
                                        />
                                    ) : (
                                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#059669", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.15rem" }}>
                                            {(selectedDelivery.collectionAgentName || "A").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontSize: "0.725rem", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Collection Agent</div>
                                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#065f46" }}>
                                            {capitalizeWords(selectedDelivery.collectionAgentName) || "Agent Assigned"}
                                        </div>
                                        {selectedDelivery.vehicleNumber && (
                                            <div style={{ fontSize: "0.775rem", color: "#047857", fontWeight: 600, marginTop: "0.1rem" }}>
                                                Vehicle: {selectedDelivery.vehicleNumber} ({selectedDelivery.vehicleType || "Pickup Van"})
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedDelivery.collectionAgentPhone && (
                                    <a 
                                        href={`tel:${selectedDelivery.collectionAgentPhone}`}
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
                                    {(() => {
                                        const delStat = String(selectedDelivery.deliveryStatus || "").toLowerCase();
                                        const cas = String(selectedDelivery.status || "").toLowerCase();
                                        const lcs = String(selectedDelivery.lifecycleStatus || "").toLowerCase();

                                        const isHandoverRejected = delStat === "handoverrejected" || cas === "handoverrejected" || lcs === "handoverrejected";
                                        const isCancelled = delStat === "failed" || delStat === "cancelled" || cas === "cancelled" || cas === "expired";

                                        const isDelivered = delStat === "delivered" || delStat === "deliveredtocenter" || delStat === "completed" || cas === "deliveredtocenter" || selectedDelivery.deliveryDeviceVerified || selectedDelivery.deliveryDeliveredAt != null;

                                        const isDeliveryStarted = delStat === "intransit" || delStat === "outfordelivery" || cas === "outfordelivery" || selectedDelivery.deliveryStartedAt != null;

                                        const isInTransit = isDelivered || isHandoverRejected || isDeliveryStarted;

                                        const isAccepted = isInTransit || isDelivered || isHandoverRejected || cas === "accepted" || selectedDelivery.pickedUpAt != null || selectedDelivery.assignedAt != null;

                                        if (isCancelled) {
                                            return (
                                                <>
                                                    {/* Step 1: Created */}
                                                    <div className="pk-timeline-step completed">
                                                        <div className="pk-timeline-dot">
                                                            <FiCheck style={{ fontSize: "0.7rem" }} />
                                                        </div>
                                                        <div className="pk-step-title">Delivery Dispatch Registered</div>
                                                        <div className="pk-step-desc">Delivery item registered in EcoCycle portal</div>
                                                        <div className="pk-step-time">{formatDate(selectedDelivery.createdAt)}</div>
                                                    </div>

                                                    {/* Step 2: Cancelled */}
                                                    <div className="pk-timeline-step cancelled">
                                                        <div className="pk-timeline-dot pk-dot-cancelled" style={{ background: "#ef4444", borderColor: "#fca5a5", color: "#ffffff" }}>
                                                            <FiX style={{ fontSize: "0.75rem" }} />
                                                        </div>
                                                        <div className="pk-step-title" style={{ color: "#dc2626" }}>Delivery Failed / Cancelled</div>
                                                        <div className="pk-step-desc">{selectedDelivery.deliveryFailureReason || "The delivery dispatch cycle was cancelled or failed."}</div>
                                                    </div>
                                                </>
                                            );
                                        }

                                        return (
                                            <>
                                                {/* Step 1: Created */}
                                                <div className="pk-timeline-step completed">
                                                    <div className="pk-timeline-dot">
                                                        <FiCheck style={{ fontSize: "0.7rem" }} />
                                                    </div>
                                                    <div className="pk-step-title">Delivery Dispatch Registered</div>
                                                    <div className="pk-step-desc">Delivery item registered in EcoCycle portal</div>
                                                    <div className="pk-step-time">{formatDate(selectedDelivery.createdAt)}</div>
                                                </div>

                                                {/* Step 2: Agent Assigned */}
                                                <div className={`pk-timeline-step ${isAccepted ? "completed" : "active"}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isAccepted ? <FiCheck style={{ fontSize: "0.7rem" }} /> : null}
                                                    </div>
                                                    <div className="pk-step-title">Collection Agent Assigned & Ready</div>
                                                    <div className="pk-step-desc">
                                                        {selectedDelivery.collectionAgentName 
                                                            ? `Agent: ${capitalizeWords(selectedDelivery.collectionAgentName)} (${selectedDelivery.collectionAgentPhone || "Phone available"})`
                                                            : "Collection agent assigned"}
                                                    </div>
                                                    {(selectedDelivery.assignedAt || selectedDelivery.acceptedAt || selectedDelivery.createdAt) && (
                                                        <div className="pk-step-time">{formatDate(selectedDelivery.assignedAt || selectedDelivery.acceptedAt || selectedDelivery.createdAt)}</div>
                                                    )}
                                                </div>

                                                {/* Step 3: En Route for Delivery */}
                                                <div className={`pk-timeline-step ${isDelivered || isHandoverRejected ? "completed" : isDeliveryStarted ? "active" : ""}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isDelivered || isHandoverRejected ? <FiCheck style={{ fontSize: "0.7rem" }} /> : isDeliveryStarted ? <FiTruck style={{ fontSize: "0.7rem" }} /> : null}
                                                    </div>
                                                    <div className="pk-step-title">
                                                        {isDelivered || isHandoverRejected
                                                            ? "Transit Completed"
                                                            : isDeliveryStarted
                                                            ? "En Route for Delivery (Active Live Tracking)"
                                                            : "Pending Delivery Start"}
                                                    </div>
                                                    <div className="pk-step-desc">
                                                        {isDelivered || isHandoverRejected
                                                            ? "Collection agent completed delivery transit" 
                                                            : isDeliveryStarted
                                                            ? `Collection agent started delivery en route on ${formatDate(selectedDelivery.deliveryStartedAt || selectedDelivery.deliveryDeliveredAt)}`
                                                            : "Delivery dispatch pending transit start (Awaiting agent to start delivery)"}
                                                    </div>
                                                    {selectedDelivery.deliveryStartedAt && (
                                                        <div className="pk-step-time">
                                                            {`Delivery Started: ${formatDate(selectedDelivery.deliveryStartedAt)}`}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Step 4: Delivered or Handover Rejected */}
                                                {isHandoverRejected ? (
                                                    <div className="pk-timeline-step cancelled">
                                                        <div className="pk-timeline-dot pk-dot-cancelled" style={{ background: "#ef4444", borderColor: "#fca5a5", color: "#ffffff" }}>
                                                            <FiX style={{ fontSize: "0.75rem" }} />
                                                        </div>
                                                        <div className="pk-step-title" style={{ color: "#dc2626" }}>Handover Rejected by Destination</div>
                                                        <div className="pk-step-desc">
                                                            {selectedDelivery.deliveryFailureReason || selectedDelivery.rejectionReason || "Handover verification was rejected at destination."}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`pk-timeline-step ${isDelivered ? "completed" : ""}`}>
                                                        <div className="pk-timeline-dot">
                                                            {isDelivered ? <FiCheck style={{ fontSize: "0.7rem" }} /> : null}
                                                        </div>
                                                        <div className="pk-step-title">Delivered & Verified at Destination Facility</div>
                                                        <div className="pk-step-desc">
                                                            {isDelivered 
                                                                ? "E-waste device delivered & physically verified at destination facility" 
                                                                : "Final delivery handover pending arrival at facility"}
                                                        </div>
                                                        {(selectedDelivery.deliveryDeliveredAt || selectedDelivery.deliveredAt || selectedDelivery.completedAt) && (
                                                            <div className="pk-step-time">{formatDate(selectedDelivery.deliveryDeliveredAt || selectedDelivery.deliveredAt || selectedDelivery.completedAt)}</div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Pickup Address & Delivery Destination Cards */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.85rem" }}>
                                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1rem" }}>
                                    <div style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                        {selectedDelivery.assignmentType === "TechnicianToRecyclingCenter" ? "Pickup Location (Tech Facility)" : "Pickup Location (Citizen)"}
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: "0.925rem", color: "#0f172a", marginTop: "0.2rem" }}>
                                        {selectedDelivery.assignmentType === "TechnicianToRecyclingCenter"
                                            ? `${selectedDelivery.technicianName || "Technician"} (${selectedDelivery.inspectionCenterName || "Center Hub"})`
                                            : `${selectedDelivery.customerName} (${selectedDelivery.customerPhone || "Phone registered"})`}
                                    </div>
                                    <div style={{ fontSize: "0.825rem", color: "#334155", marginTop: "0.2rem" }}>
                                        <FiMapPin style={{ color: "#d97706", marginRight: "4px" }} />
                                        {selectedDelivery.assignmentType === "TechnicianToRecyclingCenter"
                                            ? (selectedDelivery.deliveredAddress || selectedDelivery.address || "Technician Center Address")
                                            : `${selectedDelivery.address}, ${selectedDelivery.city}`}
                                    </div>
                                    {selectedDelivery.landmark && (
                                        <div style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "0.15rem" }}>
                                            Landmark: {selectedDelivery.landmark}
                                        </div>
                                    )}
                                    <div style={{ fontSize: "0.775rem", color: "#2563eb", fontWeight: 600, marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                        <FiCalendar /> Scheduled: {formatDate(selectedDelivery.pickupDate)} ({selectedDelivery.timeSlot})
                                    </div>
                                </div>

                                {/* Delivery Destination (Technician / Facility Location) */}
                                <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "14px", padding: "1rem" }}>
                                    <div style={{ fontSize: "0.725rem", color: "#0369a1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                        {selectedDelivery.assignmentType === "TechnicianToRecyclingCenter" ? "Destination (Recycling Center)" : "Destination (Inspection Facility)"}
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: "0.925rem", color: "#0c4a6e", marginTop: "0.2rem" }}>
                                        {selectedDelivery.assignmentType === "TechnicianToRecyclingCenter"
                                            ? (selectedDelivery.recyclingCenterName || selectedDelivery.inspectionCenterName || "EcoCycle Recycling Facility")
                                            : (selectedDelivery.inspectionCenterName || selectedDelivery.technicianCenterName || "EcoCycle Inspection Facility")}
                                    </div>
                                    {selectedDelivery.technicianName && selectedDelivery.assignmentType !== "TechnicianToRecyclingCenter" && (
                                        <div style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: 600, marginTop: "0.1rem" }}>
                                            Technician: {selectedDelivery.technicianName} ({selectedDelivery.technicianPhone || "Staff"})
                                        </div>
                                    )}
                                    {(selectedDelivery.deliveredAddress || selectedDelivery.technicianAddress || selectedDelivery.deliveryAddress || selectedDelivery.recyclingCenterAddress) && (
                                        <div style={{ fontSize: "0.825rem", color: "#0369a1", marginTop: "0.25rem" }}>
                                            <FiMapPin style={{ color: "#0284c7", marginRight: "4px" }} />
                                            {selectedDelivery.assignmentType === "TechnicianToRecyclingCenter"
                                                ? (selectedDelivery.recyclingCenterAddress || selectedDelivery.deliveredAddress || "Recycling Facility Address")
                                                : (selectedDelivery.deliveredAddress || selectedDelivery.technicianAddress || selectedDelivery.deliveryAddress)}
                                        </div>
                                    )}
                                </div>

                                {/* Delivery Record & Verification Details (STRICTLY FROM DELIVERIES TABLE) */}
                                {(selectedDelivery.deliveryDeviceVerified || selectedDelivery.deliveryAgentNotes || selectedDelivery.deliveryFailureReason || selectedDelivery.deliveryStatus) && (
                                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "14px", padding: "1rem" }}>
                                        <div style={{ fontSize: "0.725rem", color: "#166534", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "0.4rem" }}>
                                            Inspection Center Delivery Record (Delivery ID #{selectedDelivery.deliveryId || "N/A"})
                                        </div>

                                        <div style={{ fontSize: "0.8rem", color: "#065f46", fontWeight: 600, marginBottom: "0.3rem" }}>
                                            Delivery Status: <strong>{selectedDelivery.deliveryStatus || "Pending"}</strong>
                                        </div>
                                        
                                        {selectedDelivery.deliveryDeviceVerified ? (
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#dcfce7", color: "#15803d", padding: "0.3rem 0.65rem", borderRadius: "8px", fontSize: "0.775rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                                                <FiCheckCircle /> Inspection Center Device Verified
                                            </div>
                                        ) : (
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#f1f5f9", color: "#64748b", padding: "0.3rem 0.65rem", borderRadius: "8px", fontSize: "0.775rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                                                <FiClock /> Device Verification Pending at Center
                                            </div>
                                        )}

                                        {selectedDelivery.deliveryAgentNotes && (
                                            <div style={{ fontSize: "0.825rem", color: "#166534", marginTop: "0.3rem" }}>
                                                <strong>Delivery Agent Notes:</strong> {selectedDelivery.deliveryAgentNotes}
                                            </div>
                                        )}

                                        {selectedDelivery.deliveryFailureReason && (
                                            <div style={{ fontSize: "0.825rem", color: "#b91c1c", marginTop: "0.3rem" }}>
                                                <strong>Delivery Issue / Note:</strong> {selectedDelivery.deliveryFailureReason}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", textAlign: "right" }}>
                            <button 
                                onClick={() => setSelectedDelivery(null)}
                                style={{
                                    padding: "0.55rem 1.25rem",
                                    borderRadius: "10px",
                                    background: "#059669",
                                    color: "#ffffff",
                                    border: "none",
                                    fontWeight: 700,
                                    fontSize: "0.85rem",
                                    cursor: "pointer"
                                }}
                            >
                                Close Tracking
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageDelivery;
