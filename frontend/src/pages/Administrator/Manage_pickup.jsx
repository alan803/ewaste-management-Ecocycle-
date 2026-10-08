import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import {
    FiPackage,
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
    FiTruck,
    FiNavigation,
    FiUserCheck,
    FiAlertTriangle,
    FiShield,
    FiCheck,
    FiCalendar,
    FiXCircle,
    FiEye,
    FiLogOut
} from "react-icons/fi";
import "./Manage_pickup.css";

function ManagePickup() {
    const [assignments, setAssignments] = useState([]);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [reassignModalTarget, setReassignModalTarget] = useState(null);
    const [selectedNewAgentId, setSelectedNewAgentId] = useState("");
    const [reassigning, setReassigning] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetchData(token);
    }, []);

    const getAuthHeaders = (authToken) => {
        const token = authToken || localStorage.getItem("token");
        if (token && token !== "null" && token !== "undefined") {
            return { Authorization: `Bearer ${token}` };
        }
        return {};
    };

    const fetchData = async (authToken) => {
        const headers = getAuthHeaders(authToken);
        const config = Object.keys(headers).length > 0 ? { headers } : {};
        try {
            setLoading(true);
            const [assignRes, agentRes] = await Promise.all([
                axios.get("https://ecocycle.runasp.net/api/CollectionAssignment/admin/all-assignments", config),
                axios.get("https://ecocycle.runasp.net/api/CollectionAgent/All", config).catch(() => ({ data: [] }))
            ]);

            setAssignments(assignRes.data || []);
            setAgents(agentRes.data || []);
        } catch (err) {
            console.error("Error fetching admin pickup assignments:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReassignAgent = async () => {
        if (!selectedNewAgentId || !reassignModalTarget) return;
        const headers = getAuthHeaders();
        const config = Object.keys(headers).length > 0 ? { headers } : {};
        try {
            setReassigning(true);
            await axios.post(
                "https://ecocycle.runasp.net/api/CollectionAssignment/reassign",
                {
                    collectionAssignmentId: reassignModalTarget.collectionAssignmentId,
                    newCollectionAgentId: parseInt(selectedNewAgentId, 10)
                },
                config
            );

            setReassignModalTarget(null);
            setSelectedNewAgentId("");
            fetchData(token);
        } catch (err) {
            console.error("Error reassigning agent:", err);
        } finally {
            setReassigning(false);
        }
    };

    // Filter Pickups logic
    const totalPickups = assignments.length;
    const activePickups = assignments.filter(a => {
        const s = String(a.status || "").toLowerCase();
        const delStat = String(a.deliveryStatus || "").toLowerCase();
        const lcs = String(a.lifecycleStatus || "").toLowerCase();
        const isDelivered = delStat === "delivered" || s === "deliveredtocenter" || lcs === "atinspectioncenter";
        const isCancelled = s === "expired" || s === "cancelled";
        if (isCancelled || isDelivered) return false;

        return s === "pickupstarted" || s === "en route" || s === "outfordelivery" || s === "completed" || s === "pickedup" || delStat === "intransit" || delStat === "pending" || delStat === "pendingverification";
    }).length;

    const completedPickups = assignments.filter(a => {
        const s = String(a.status || "").toLowerCase();
        const delStat = String(a.deliveryStatus || "").toLowerCase();
        const lcs = String(a.lifecycleStatus || "").toLowerCase();
        return delStat === "delivered" || s === "deliveredtocenter" || lcs === "atinspectioncenter";
    }).length;

    const pendingScheduled = assignments.filter(a => {
        const s = String(a.status || "").toLowerCase();
        return s === "scheduled" || s === "assigned" || s === "accepted";
    }).length;

    const hasAgentStartedPickup = (item) => {
        if (!item) return false;
        const cas = String(item.status || "").toLowerCase();
        const delStat = String(item.deliveryStatus || "").toLowerCase();
        const lcs = String(item.lifecycleStatus || "").toLowerCase();

        if (item.pickupStartedAt || item.startedAt || item.pickupPickedUpAt || item.pickedUpAt) return true;

        const startedStatuses = [
            "pickupstarted",
            "en route",
            "pickedup",
            "completed",
            "intransit",
            "outfordelivery",
            "delivered",
            "deliveredtocenter",
            "pendingverification",
            "awaitingtechnicianapproval",
            "atinspectioncenter"
        ];

        return startedStatuses.includes(cas) || startedStatuses.includes(delStat) || startedStatuses.includes(lcs);
    };

    const location = useLocation();
    const typeQuery = new URLSearchParams(location.search).get("type");

    const filteredAssignments = assignments.filter(item => {
        if (!hasAgentStartedPickup(item)) return false;

        const status = String(item.status || "").toLowerCase();
        const delStat = String(item.deliveryStatus || "").toLowerCase();
        const lcs = String(item.lifecycleStatus || "").toLowerCase();
        const itemType = String(item.assignmentType || "").toLowerCase();

        if (typeQuery) {
            const reqType = typeQuery.toLowerCase();
            if (reqType.includes("customer") && itemType.includes("recycling")) return false;
            if (reqType.includes("recycling") && !itemType.includes("recycling")) return false;
        }

        const isDelivered = delStat === "delivered" || status === "deliveredtocenter" || lcs === "atinspectioncenter";
        const isCancelled = status === "expired" || status === "cancelled";
        const isCitizenPickupDone = item.pickedUpAt != null || ["completed", "pickedup", "outfordelivery", "intransit", "awaitingtechnicianapproval", "delivered", "deliveredtocenter"].includes(status);

        if (activeTab === "Pending" && status !== "scheduled" && status !== "assigned" && status !== "accepted") return false;
        if (activeTab === "PickupStarted") {
            if (isCancelled || isDelivered) return false;
            if (!isCitizenPickupDone && status !== "pickupstarted" && status !== "en route" && delStat !== "intransit" && delStat !== "pending") return false;
        }
        if (activeTab === "Completed" && !isDelivered) return false;
        if (activeTab === "Expired" && !isCancelled) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const devName = `${item.brand || ""} ${item.model || ""}`.toLowerCase();
        const catName = String(item.categoryName || "").toLowerCase();
        const agentName = String(item.collectionAgentName || "").toLowerCase();
        const customer = String(item.customerName || "").toLowerCase();
        const address = String(item.address || "").toLowerCase();

        return (
            devName.includes(q) ||
            catName.includes(q) ||
            agentName.includes(q) ||
            customer.includes(q) ||
            address.includes(q)
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
        const cas = String(item?.status || "").toLowerCase();
        const delStat = String(item?.deliveryStatus || "").toLowerCase();
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

        if (delStat === "delivered" || cas === "deliveredtocenter" || lcs === "atinspectioncenter") {
            return <span style={{ ...badgeStyle, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}><FiCheckCircle /> Delivered to Hub</span>;
        } else if (delStat === "pendingverification" || cas === "awaitingtechnicianapproval" || lcs === "handoverpendingverification") {
            return <span style={{ ...badgeStyle, background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}><FiClock /> Handover Verification</span>;
        } else if (cas === "completed" || cas === "pickedup" || cas === "intransit" || delStat === "intransit") {
            return <span style={{ ...badgeStyle, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}><FiTruck /> In Transit to Hub</span>;
        } else if (cas === "pickupstarted" || cas === "en route") {
            return <span style={{ ...badgeStyle, background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}><FiNavigation /> Agent En Route</span>;
        } else if (cas === "accepted") {
            return <span style={{ ...badgeStyle, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}><FiUserCheck /> Agent Accepted</span>;
        } else if (cas === "assigned" || cas === "pending") {
            return <span style={{ ...badgeStyle, background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}><FiClock /> Agent Assigned (Pending)</span>;
        } else if (cas === "expired" || delStat === "expired") {
            return <span style={{ ...badgeStyle, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}><FiAlertTriangle /> Expired</span>;
        } else if (cas === "cancelled" || delStat === "cancelled") {
            return <span style={{ ...badgeStyle, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}><FiAlertTriangle /> Cancelled</span>;
        } else if (cas === "rejected" || cas === "declined" || delStat === "rejected") {
            return <span style={{ ...badgeStyle, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}><FiAlertTriangle /> Rejected</span>;
        } else {
            return <span style={{ ...badgeStyle, background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}><FiClock /> Scheduled</span>;
        }
    };

    const getAgentPhoto = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith("http://") || photoPath.startsWith("https://") || photoPath.startsWith("data:")) return photoPath;
        if (photoPath.startsWith("/uploads/")) return `https://ecocycle.runasp.net${photoPath}`;
        if (photoPath.startsWith("uploads/")) return `https://ecocycle.runasp.net/${photoPath}`;
        const cleanPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
        return `https://ecocycle.runasp.net/uploads/profile${cleanPath}`;
    };

    const getProofPhoto = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith("http://") || photoPath.startsWith("https://") || photoPath.startsWith("data:")) return photoPath;
        if (photoPath.startsWith("/uploads/")) return `https://ecocycle.runasp.net${photoPath}`;
        if (photoPath.startsWith("uploads/")) return `https://ecocycle.runasp.net/${photoPath}`;
        const cleanPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
        return `https://ecocycle.runasp.net/uploads/pickups${cleanPath}`;
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
        <div className="admin-pickup-page">
            {/* Sidebar Navigation */}
            <Navbar />

            {/* Main Content Area */}
            <div className="admin-pickup-main">
                {/* Floating Glass Header */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <div className="command-brand">
                            <h1>Manage Device Pickups</h1>
                        </div>
                        <p className="command-subtitle">
                            Track, manage, and reassign citizen e-waste collection agent pickup requests
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search pickup, agent, customer..."
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
                            <FiPackage />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{totalPickups}</h3>
                            <p>Total Pickups</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon active">
                            <FiNavigation />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{activePickups}</h3>
                            <p>En Route / Active</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon done">
                            <FiCheckCircle />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{completedPickups}</h3>
                            <p>Delivered to Hub</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon alert">
                            <FiClock />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{pendingScheduled}</h3>
                            <p>Pending Scheduled</p>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <section className="content-section">
                    <div className="panel-card table-panel">
                        <div className="panel-header">
                            <div>
                                <h3 className="panel-title">Device Pickups &amp; Dispatches</h3>
                                <p className="panel-subtitle">
                                    Track, manage, and reassign citizen e-waste collection agent pickup requests
                                </p>
                            </div>
                            <div className="panel-actions">
                                <div className="filter-pill-group">
                                    {[
                                        { id: "All", label: "All" },
                                        { id: "Pending", label: "Scheduled" },
                                        { id: "PickupStarted", label: "En Route" },
                                        { id: "Completed", label: "Completed" }
                                    ].map((tab) => {
                                        const count = tab.id === "All"
                                            ? totalPickups
                                            : tab.id === "Pending"
                                            ? pendingScheduled
                                            : tab.id === "PickupStarted"
                                            ? activePickups
                                            : completedPickups;

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
                                <p>Loading pickup tasks...</p>
                            </div>
                        ) : filteredAssignments.length === 0 ? (
                            <div className="no-data-state">
                                <FiBox className="no-data-icon" />
                                <p>No pickup tasks matching "{activeTab}".</p>
                            </div>
                        ) : viewMode === "grid" ? (
                            <div className="admin-cards-grid">
                                {filteredAssignments.map((item, index) => {
                                    const trackingId = `TRK-PKP-${item.collectionAssignmentId || item.deviceId}`;
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

                                            {hasAgentStartedPickup(item) && (
                                                <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px dashed #e2e8f0" }}>
                                                    <button
                                                        onClick={() => setSelectedAssignment(item)}
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
                                        {filteredAssignments.map((item, index) => {
                                            const isDone = ["completed", "pickedup", "deliveredtocenter"].includes(String(item.status || "").toLowerCase());
                                            const trackingId = `TRK-PKP-${item.collectionAssignmentId || item.deviceId}`;
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
                                                        <div className="action-buttons" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                                            {hasAgentStartedPickup(item) ? (
                                                                <button
                                                                    className="btn-track-live"
                                                                    onClick={() => setSelectedAssignment(item)}
                                                                    title="Track Pickup Status"
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

            {/* Live Pickup Tracking Stepper Modal (Matching Citizen Live Tracking) */}
            {selectedAssignment && (
                <div className="admin-modal-overlay" onClick={() => setSelectedAssignment(null)}>
                    <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", borderRadius: "20px", overflow: "hidden", padding: 0 }}>
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
                                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Pickup Tracking & Details</h3>
                                    <span style={{ fontSize: "0.75rem", opacity: 0.9 }}>
                                        #{selectedAssignment.deviceId || selectedAssignment.collectionAssignmentId} &bull; {selectedAssignment.brand} {selectedAssignment.model} &bull; {selectedAssignment.categoryName}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedAssignment(null)}
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
                                        TRK-PKP-{selectedAssignment.collectionAssignmentId || selectedAssignment.deviceId}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Current Tracking Status</div>
                                    <div style={{ marginTop: "0.2rem" }}>
                                        {getStatusBadge(selectedAssignment)}
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
                                    {selectedAssignment.collectionAgentPhoto ? (
                                        <img 
                                            src={getAgentPhoto(selectedAssignment.collectionAgentPhoto)} 
                                            alt="Agent Profile" 
                                            style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} 
                                        />
                                    ) : (
                                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#059669", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.15rem" }}>
                                            {(selectedAssignment.collectionAgentName || "A").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontSize: "0.725rem", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Collection Agent</div>
                                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#065f46" }}>
                                            {capitalizeWords(selectedAssignment.collectionAgentName) || "Agent Assigned"}
                                        </div>
                                        {selectedAssignment.vehicleNumber && (
                                            <div style={{ fontSize: "0.775rem", color: "#047857", fontWeight: 600, marginTop: "0.1rem" }}>
                                                Vehicle: {selectedAssignment.vehicleNumber} ({selectedAssignment.vehicleType || "Pickup Van"})
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedAssignment.collectionAgentPhone && (
                                    <a 
                                        href={`tel:${selectedAssignment.collectionAgentPhone}`}
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

                            {/* Pickup Stepper Timeline */}
                             <div style={{ marginBottom: "1.25rem" }}>
                                 <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", fontWeight: 700, color: "#1e293b" }}>
                                     Pickup &amp; Delivery Progress Timeline
                                 </h4>
                                  <div className="pk-timeline">
                                      {(() => {
                                          const cas = String(selectedAssignment.status || "").toLowerCase();
                                          const lcs = String(selectedAssignment.lifecycleStatus || "").toLowerCase();
                                          const delStat = String(selectedAssignment.deliveryStatus || "").toLowerCase();
                                          const isCancelled = cas === "cancelled" || cas === "expired";

                                          // Step 2: Agent Accepted
                                          const isAccepted = ["accepted", "pickupstarted", "pickedup", "outfordelivery", "intransit", "awaitingtechnicianapproval", "delivered", "deliveredtocenter", "completed"].includes(cas) || selectedAssignment.collectionAgentName != null;

                                          // Step 3: Pickup Started & Pickup Completed
                                          const isPickupStarted = cas === "pickupstarted" || cas === "en route" || selectedAssignment.pickupStartedAt != null || selectedAssignment.startedAt != null;
                                          const actualPickupTime = selectedAssignment.pickupPickedUpAt || selectedAssignment.pickedUpAt;
                                          const isCitizenPickupDone = Boolean(actualPickupTime) || cas === "completed" || cas === "pickedup" || lcs === "pickedup" || String(selectedAssignment.pickupStatus || "").toLowerCase() === "completed";

                                          // Step 4: Delivered to Inspection Center Hub
                                          const isDelivered = delStat === "delivered" || cas === "deliveredtocenter" || lcs === "atinspectioncenter" || Boolean(selectedAssignment.deliveredAt || selectedAssignment.deliveryDeliveredAt);

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
                                                          <div className="pk-step-time">{formatDate(selectedAssignment.createdAt)}</div>
                                                      </div>

                                                      {/* Step 2: Cancelled */}
                                                      <div className="pk-timeline-step cancelled">
                                                          <div className="pk-timeline-dot pk-dot-cancelled" style={{ background: "#ef4444", borderColor: "#fca5a5", color: "#ffffff" }}>
                                                              <FiX style={{ fontSize: "0.75rem" }} />
                                                          </div>
                                                           <div className="pk-step-title" style={{ color: "#dc2626" }}>
                                                               {cas === "expired" ? "Pickup Allocation Expired" : "Pickup Allocation Cancelled"}
                                                           </div>
                                                           <div className="pk-step-desc">
                                                               {cas === "expired" ? "The pickup deadline passed before collection completion." : "The pickup request was cancelled."}
                                                           </div>
                                                      </div>
                                                  </>
                                              );
                                          }

                                          return (
                                              <>
                                                  {/* Step 1: Pickup Request Created */}
                                                  <div className="pk-timeline-step completed">
                                                      <div className="pk-timeline-dot">
                                                          <FiCheck style={{ fontSize: "0.7rem" }} />
                                                      </div>
                                                      <div className="pk-step-title">Pickup Request Created</div>
                                                      <div className="pk-step-desc">Item registered in EcoCycle portal</div>
                                                      <div className="pk-step-time">{formatDate(selectedAssignment.createdAt)}</div>
                                                  </div>

                                                  {/* Step 2: Collection Agent Assigned & Accepted */}
                                                  <div className={`pk-timeline-step ${isAccepted ? "completed" : "active"}`}>
                                                      <div className="pk-timeline-dot">
                                                          {isAccepted ? <FiCheck style={{ fontSize: "0.7rem" }} /> : null}
                                                      </div>
                                                      <div className="pk-step-title">Collection Agent Assigned & Accepted</div>
                                                      <div className="pk-step-desc">
                                                          {selectedAssignment.collectionAgentName 
                                                              ? `Agent: ${capitalizeWords(selectedAssignment.collectionAgentName)} (${selectedAssignment.collectionAgentPhone || "Phone available"})`
                                                              : "Collection agent assigned to task"}
                                                      </div>
                                                      <div className="pk-step-time">
                                                          {formatDate(selectedAssignment.assignedAt || selectedAssignment.acceptedAt || selectedAssignment.createdAt)}
                                                      </div>
                                                  </div>

                                                  {/* Step 3: Device Picked Up & Collected */}
                                                  <div className={`pk-timeline-step ${isCitizenPickupDone ? "completed" : isAccepted ? "active" : ""}`}>
                                                      <div className="pk-timeline-dot">
                                                          {isCitizenPickupDone ? <FiCheck style={{ fontSize: "0.7rem" }} /> : isAccepted ? <FiClock style={{ fontSize: "0.7rem" }} /> : null}
                                                      </div>
                                                      <div className="pk-step-title">Device Picked Up & Collected</div>
                                                      <div className="pk-step-desc">
                                                          Collection agent collected device from pickup address
                                                      </div>
                                                      <div className="pk-step-time">
                                                          {actualPickupTime ? `Picked Up: ${formatDate(actualPickupTime)}` : "Pending Doorstep Pickup"}
                                                      </div>
                                                  </div>

                                                  {/* Step 4: Delivered to Inspection Center Hub */}
                                                  <div className={`pk-timeline-step ${isDelivered ? "completed" : isCitizenPickupDone ? "active" : ""}`}>
                                                      <div className="pk-timeline-dot">
                                                          {isDelivered ? <FiCheck style={{ fontSize: "0.7rem" }} /> : isCitizenPickupDone ? <FiClock style={{ fontSize: "0.7rem" }} /> : null}
                                                      </div>
                                                      <div className="pk-step-title">
                                                          {selectedAssignment.assignmentType === "TechnicianToRecyclingCenter"
                                                              ? "Delivered to Recycling Center"
                                                              : "Delivered to Inspection Center Hub"}
                                                      </div>
                                                      <div className="pk-step-desc">
                                                          {isDelivered ? "E-Waste item successfully received at inspection hub" : "In transit to inspection center hub"}
                                                      </div>
                                                      <div className="pk-step-time">
                                                          {isDelivered ? `Delivered: ${formatDate(selectedAssignment.deliveredAt || selectedAssignment.deliveryDeliveredAt)}` : "Pending Hub Arrival"}
                                                      </div>
                                                  </div>
                                              </>
                                          );
                                      })()}
                                  </div>
                             </div>

                             {/* Pickup Address & Verification Record Cards */}
                             <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.85rem" }}>
                                 <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1rem" }}>
                                     <div style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                         {selectedAssignment.assignmentType === "TechnicianToRecyclingCenter" ? "Pickup Location (Tech Facility)" : "Pickup Location (Citizen)"}
                                     </div>
                                     <div style={{ fontWeight: 700, fontSize: "0.925rem", color: "#0f172a", marginTop: "0.2rem" }}>
                                         {selectedAssignment.assignmentType === "TechnicianToRecyclingCenter"
                                             ? `${selectedAssignment.technicianName || "Technician"} (${selectedAssignment.inspectionCenterName || "Center Hub"})`
                                             : `${selectedAssignment.customerName} (${selectedAssignment.customerPhone || "Phone registered"})`}
                                     </div>
                                     <div style={{ fontSize: "0.825rem", color: "#334155", marginTop: "0.2rem" }}>
                                         <FiMapPin style={{ color: "#d97706", marginRight: "4px" }} />
                                         {selectedAssignment.assignmentType === "TechnicianToRecyclingCenter"
                                             ? (selectedAssignment.deliveredAddress || selectedAssignment.address || "Technician Center Address")
                                             : `${selectedAssignment.address}, ${selectedAssignment.city}`}
                                     </div>
                                     {selectedAssignment.landmark && (
                                         <div style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "0.15rem" }}>
                                             Landmark: {selectedAssignment.landmark}
                                         </div>
                                     )}
                                     <div style={{ fontSize: "0.775rem", color: "#2563eb", fontWeight: 600, marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                         <FiCalendar /> Scheduled: {formatDate(selectedAssignment.pickupDate)} ({selectedAssignment.timeSlot || "Standard Slot"})
                                     </div>
                                 </div>

                                  {/* Destination Location Card for TechnicianToRecyclingCenter */}
                                  {selectedAssignment.assignmentType === "TechnicianToRecyclingCenter" && (
                                      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "14px", padding: "1rem", marginTop: "0.85rem" }}>
                                          <div style={{ fontSize: "0.725rem", color: "#166534", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                              Destination Location (Recycling Center)
                                          </div>
                                          <div style={{ fontWeight: 700, fontSize: "0.925rem", color: "#14532d", marginTop: "0.2rem" }}>
                                              {selectedAssignment.recyclingCenterName || "Recycling Facility"} {selectedAssignment.recyclingCenterPhone ? `(Ph: ${selectedAssignment.recyclingCenterPhone})` : ""}
                                          </div>
                                          {selectedAssignment.recyclingCenterOwner && (
                                              <div style={{ fontSize: "0.825rem", color: "#166534", marginTop: "0.1rem" }}>
                                                  Contact Person: {selectedAssignment.recyclingCenterOwner}
                                              </div>
                                          )}
                                          <div style={{ fontSize: "0.825rem", color: "#15803d", marginTop: "0.2rem" }}>
                                              <FiMapPin style={{ color: "#16a34a", marginRight: "4px" }} />
                                              {selectedAssignment.recyclingCenterAddress || "Recycling Facility Address"}
                                          </div>
                                      </div>
                                  )}

                                {/* Pickup Verification & Handover Record from Pickup Table */}
                                {(selectedAssignment.deviceVerified || selectedAssignment.proofPhotoPath || selectedAssignment.agentNotes || selectedAssignment.failureReason) && (
                                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "14px", padding: "1rem" }}>
                                        <div style={{ fontSize: "0.725rem", color: "#166534", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "0.4rem" }}>
                                            Pickup Verification Record (Pickup ID #{selectedAssignment.pickupId || selectedAssignment.collectionAssignmentId})
                                        </div>
                                        
                                        {selectedAssignment.deviceVerified && (
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#dcfce7", color: "#15803d", padding: "0.3rem 0.65rem", borderRadius: "8px", fontSize: "0.775rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                                                <FiCheckCircle /> Device Barcode / QR Code Verified
                                            </div>
                                        )}

                                        {selectedAssignment.agentNotes && (
                                            <div style={{ fontSize: "0.825rem", color: "#166534", marginTop: "0.3rem" }}>
                                                <strong>Agent Notes:</strong> {selectedAssignment.agentNotes}
                                            </div>
                                        )}

                                        {selectedAssignment.failureReason && (
                                            <div style={{ fontSize: "0.825rem", color: "#b91c1c", marginTop: "0.3rem" }}>
                                                <strong>Issue / Note:</strong> {selectedAssignment.failureReason}
                                            </div>
                                        )}

                                        {selectedAssignment.proofPhotoPath && (
                                            <div style={{ marginTop: "0.6rem" }}>
                                                <a 
                                                    href={getProofPhoto(selectedAssignment.proofPhotoPath)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{
                                                        background: "#059669",
                                                        color: "#ffffff",
                                                        padding: "0.45rem 0.85rem",
                                                        borderRadius: "8px",
                                                        fontSize: "0.775rem",
                                                        fontWeight: 700,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "0.4rem",
                                                        textDecoration: "none",
                                                        boxShadow: "0 2px 6px rgba(5,150,105,0.2)",
                                                        transition: "all 0.2s ease"
                                                    }}
                                                >
                                                    <FiEye style={{ fontSize: "0.9rem" }} /> View Handover Proof Photo ↗
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", textAlign: "right" }}>
                            <button 
                                onClick={() => setSelectedAssignment(null)}
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

            {/* Reassign Collection Agent Modal */}
            {reassignModalTarget && (
                <div className="admin-modal-overlay" onClick={() => setReassignModalTarget(null)}>
                    <div className="admin-modal-dialog" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div className="admin-modal-title-box">
                                <h2>Reassign Collection Agent</h2>
                                <p className="admin-modal-subtitle">{reassignModalTarget.brand} {reassignModalTarget.model}</p>
                            </div>
                            <button className="btn-admin-close-modal" style={{ padding: "0.5rem", borderRadius: "50%" }} onClick={() => setReassignModalTarget(null)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="admin-modal-body" style={{ padding: "1.75rem 1.5rem" }}>
                            <p style={{ fontSize: "0.875rem", color: "#475569", margin: "0 0 1rem 0" }}>
                                Select a new approved collection agent to take over this e-waste pickup dispatch task:
                            </p>

                            <select
                                value={selectedNewAgentId}
                                onChange={(e) => setSelectedNewAgentId(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.85rem 1rem",
                                    borderRadius: "12px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "0.9rem",
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    background: "#ffffff",
                                    outline: "none"
                                }}
                            >
                                <option value="">-- Select Collection Agent --</option>
                                {agents.map(ag => (
                                    <option key={ag.agentId || ag.id} value={ag.agentId || ag.id}>
                                        {ag.firstName} {ag.lastName} ({ag.city || ag.phoneNumber || "Agent"})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="admin-modal-footer">
                            <button className="btn-admin-close-modal" onClick={() => setReassignModalTarget(null)}>
                                Cancel
                            </button>
                            <button
                                className="btn-admin-action-track"
                                style={{ padding: "0.65rem 1.4rem" }}
                                onClick={handleReassignAgent}
                                disabled={reassigning || !selectedNewAgentId}
                            >
                                {reassigning ? "Saving..." : "Confirm Reassign"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManagePickup;
