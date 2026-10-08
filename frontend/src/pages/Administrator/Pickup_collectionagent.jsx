import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import {
    FiSearch,
    FiBell,
    FiLogOut,
    FiEye,
    FiX,
    FiFilter,
    FiClock,
    FiCalendar,
    FiPackage,
    FiMapPin,
    FiRefreshCw,
    FiCheckCircle,
    FiAlertTriangle,
    FiTruck,
    FiCpu,
    FiUserCheck,
    FiRotateCcw,
    FiGrid,
    FiList
} from "react-icons/fi";
import "./Pickup_collectionagent.css";

function Pickup_collectionagent() {
    const [collectionAssignments, setCollectionAssignments] = useState([]);
    const [activeAgents, setActiveAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [viewMode, setViewMode] = useState("table");
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [locationModalTarget, setLocationModalTarget] = useState(null);

    // Manual Allocation Modal State
    const [reassigningAssignment, setReassigningAssignment] = useState(null);
    const [selectedAgentId, setSelectedAgentId] = useState("");
    const [reassigningLoading, setReassigningLoading] = useState(false);
    const [reassigningLoadingId, setReassigningLoadingId] = useState(null);
    const [failedAutoAllocations, setFailedAutoAllocations] = useState([]);
    const [reassignMessage, setReassignMessage] = useState("");
    const [agentSearchQuery, setAgentSearchQuery] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        fetchAllData();
        fetchActiveAgents();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError("");
            const token = localStorage.getItem("token");

            const collectionRes = await axios.get(
                "https://localhost:7102/api/CollectionAssignment/admin/all-assignments?assignmentType=all",
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setCollectionAssignments(collectionRes.data || []);
        } catch (err) {
            console.error("Error fetching collection assignments:", err);
            setError("Failed to load collection assignment details.");
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveAgents = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("https://localhost:7102/api/CollectionAgent/alluser", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const activeOnly = (response.data || []).filter(a => a.status === "Active" || a.Status === "Active");
            setActiveAgents(activeOnly.length > 0 ? activeOnly : response.data || []);
        } catch (err) {
            console.error("Error fetching active collection agents:", err);
        }
    };

    const handleAutoReassign = async (assignmentId) => {
        try {
            setReassigningLoading(true);
            setReassigningLoadingId(assignmentId);
            setReassignMessage("");
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `https://localhost:7102/api/CollectionAssignment/auto-reassign/${assignmentId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const isWaiting = response.data?.status === "Waiting" ||
                (response.data?.message && (
                    response.data.message.includes("No alternative") ||
                    response.data.message.includes("waiting") ||
                    response.data.message.includes("No available")
                ));

            if (isWaiting) {
                setFailedAutoAllocations(prev => [...new Set([...prev, assignmentId])]);
                fetchActiveAgents();
            } else {
                setReassignMessage(response.data?.message || "Reassigned successfully.");
                setTimeout(() => {
                    setReassigningAssignment(null);
                    setReassignMessage("");
                    fetchAllData();
                }, 1200);
            }
        } catch (err) {
            console.error("Error auto-reassigning agent:", err);
            setFailedAutoAllocations(prev => [...new Set([...prev, assignmentId])]);
            fetchActiveAgents();
        } finally {
            setReassigningLoading(false);
            setReassigningLoadingId(null);
        }
    };

    const handleManualReassign = async (e) => {
        e.preventDefault();
        if (!reassigningAssignment || !selectedAgentId) return;

        try {
            setReassigningLoading(true);
            setReassignMessage("");
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `https://localhost:7102/api/CollectionAssignment/reassign/${reassigningAssignment.collectionAssignmentId}/${selectedAgentId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setReassignMessage(response.data?.message || "Reassigned successfully.");
            setTimeout(() => {
                setReassigningAssignment(null);
                setSelectedAgentId("");
                setReassignMessage("");
                fetchAllData();
            }, 1200);
        } catch (err) {
            console.error("Error manually reassigning agent:", err);
            setReassignMessage(err.response?.data?.message || "Failed to reassign agent.");
        } finally {
            setReassigningLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "N/A";
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return "N/A";
        }
    };

    const formatShortDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            let cleanStr = typeof dateString === "string" ? dateString.split("T")[0] : dateString;
            const date = new Date(cleanStr);
            if (isNaN(date.getTime())) return "N/A";
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });
        } catch {
            return "N/A";
        }
    };

    const getStatusBadge = (status) => {
        const s = (status || "").toLowerCase().trim();
        switch (s) {
            case "waiting":
                return (
                    <span className="status-pill status-pill--pending">
                        <span className="status-beacon"></span>
                        Waiting
                    </span>
                );
            case "assigned":
            case "pending":
                return (
                    <span className="status-pill status-pill--assigned">
                        <span className="status-beacon"></span>
                        Assigned
                    </span>
                );
            case "accepted":
                return (
                    <span className="status-pill status-pill--progress">
                        <span className="status-beacon"></span>
                        Accepted
                    </span>
                );
            case "pickupstarted":
                return (
                    <span className="status-pill status-pill--progress">
                        <span className="status-beacon"></span>
                        En Route
                    </span>
                );
            case "pickedup":
            case "delivered":
            case "completed":
            case "deliveredtocenter":
                return (
                    <span className="status-pill status-pill--completed">
                        <span className="status-beacon"></span>
                        Completed
                    </span>
                );
            case "expired":
                return (
                    <span className="status-pill" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" }}>
                        <span className="status-beacon" style={{ background: "#dc2626" }}></span>
                        Expired
                    </span>
                );
            case "rejected":
            case "declined":
                return (
                    <span className="status-pill" style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" }}>
                        <span className="status-beacon" style={{ background: "#dc2626" }}></span>
                        Rejected
                    </span>
                );
            default:
                return <span className="status-pill">{status}</span>;
        }
    };

    // Filter collection assignments
    const filteredCollection = collectionAssignments.filter((item) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            (item.brand || "").toLowerCase().includes(query) ||
            (item.model || "").toLowerCase().includes(query) ||
            (item.categoryName || "").toLowerCase().includes(query) ||
            (item.customerName || "").toLowerCase().includes(query) ||
            (item.customerPhone || "").toLowerCase().includes(query) ||
            (item.collectionAgentName || "").toLowerCase().includes(query) ||
            (item.collectionAgentEmail || "").toLowerCase().includes(query) ||
            (item.city || "").toLowerCase().includes(query) ||
            (item.status || "").toLowerCase().includes(query) ||
            (item.rejectionReason || "").toLowerCase().includes(query);

        const statusLower = (item.status || "").toLowerCase();
        const matchesStatus =
            activeFilter === "All" ||
            (activeFilter === "Completed" && (statusLower === "completed" || statusLower === "delivered" || statusLower === "deliveredtocenter" || statusLower === "pickedup")) ||
            (activeFilter === "Rejected" && (statusLower === "rejected" || statusLower === "declined")) ||
            statusLower === activeFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="admin-dashboard-v2">
            <Navbar />
            <div className="admin-main-container">
                {/* Background Ambient Mesh Glow */}
                <div className="ambient-glow ambient-glow--1"></div>
                <div className="ambient-glow ambient-glow--2"></div>

                {/* Top Floating Glass Header */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <div className="command-brand">
                            <h1>Collection Agent Pickups</h1>
                        </div>
                        <p className="command-subtitle">
                            Track collection agent dispatches, citizen pickup requests, agent allocations, and live pickup status
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search agent, customer, material or location..."
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

                {/* Content Panel */}
                <section className="content-section">
                    <div className="panel-card table-panel">
                        <div className="panel-header">
                            <div>
                                <h3 className="panel-title">Collection Agent Pickup Allocations</h3>
                                <p className="panel-subtitle">
                                    View all e-waste device collection dispatches, citizen addresses, assigned collection agents, rejected requests, and live pickup status
                                </p>
                            </div>
                            <div className="panel-actions">
                                <div className="filter-pill-group">
                                    {["All", "Assigned", "Accepted", "PickupStarted", "Completed", "Rejected"].map((tab) => {
                                        const count = tab === "All"
                                            ? collectionAssignments.length
                                            : collectionAssignments.filter(c => {
                                                const s = (c.status || "").toLowerCase();
                                                if (tab === "Completed") return s === "completed" || s === "delivered" || s === "deliveredtocenter" || s === "pickedup";
                                                if (tab === "Rejected") return s === "rejected" || s === "declined";
                                                return s === tab.toLowerCase();
                                            }).length;

                                        return (
                                            <button
                                                key={tab}
                                                className={`pill-btn ${activeFilter === tab ? "pill-btn--active" : ""}`}
                                                onClick={() => setActiveFilter(tab)}
                                            >
                                                {tab === "PickupStarted" ? "En Route" : tab} ({count})
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
                                <p>Loading collection agent pickups...</p>
                            </div>
                        ) : error ? (
                            <div className="error-state">
                                <p>{error}</p>
                            </div>
                        ) : filteredCollection.length === 0 ? (
                            <div className="no-data-state">
                                <FiFilter className="no-data-icon" />
                                <p>No collection agent pickups matching "{activeFilter}".</p>
                            </div>
                        ) : viewMode === "table" ? (
                            <div className="glass-table-wrapper">
                                <table className="glass-table">
                                     <thead>
                                         <tr>
                                            <th className="col-num">#</th>
                                            <th className="col-device">Device Details</th>
                                            <th className="col-sender">Sender / Origin</th>
                                            <th className="col-agent">Collection Agent</th>
                                            <th className="col-schedule">Pickup Schedule</th>
                                            <th className="col-status">Status</th>
                                            <th className="col-actions">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCollection.map((item, index) => {
                                            // Find highest collection assignment ID for this device & journey type
                                            const itemJourney = item.assignmentType || "CustomerToTechnician";
                                            const deviceAssignments = collectionAssignments.filter(ca => ca.deviceId === item.deviceId && (ca.assignmentType || "CustomerToTechnician") === itemJourney);
                                            const latestAssignmentId = deviceAssignments.length > 0 
                                                ? Math.max(...deviceAssignments.map(ca => ca.collectionAssignmentId || 0))
                                                : item.collectionAssignmentId;
                                            
                                            const isLatestAssignment = (item.collectionAssignmentId || 0) === latestAssignmentId;

                                            const statusLower = (item.status || "").toLowerCase();
                                            const isRejected = statusLower === "rejected" || statusLower === "declined";
                                            const isCancelled = statusLower === "cancelled";
                                            const isExpired = statusLower === "expired";
                                            const isWaiting = statusLower === "waiting" || !item.collectionAgentId || item.collectionAgentName === "Unassigned";
                                            const isCompletedOrDelivered = statusLower === "completed" || statusLower === "delivered" || statusLower === "deliveredtocenter" || statusLower === "pickedup";
                                            const isAccepted = statusLower.includes("accept") || statusLower === "pickupstarted" || statusLower === "intransit" || statusLower === "outfordelivery" || statusLower === "atinspectioncenter";

                                            // Can allocate if this is the LATEST assignment for the device and is unassigned/rejected/cancelled/expired
                                            const canAllocate = isLatestAssignment && (isWaiting || isRejected || isCancelled || isExpired) && !isCompletedOrDelivered && !isAccepted;
                                            const canReassign = isLatestAssignment && !canAllocate && !isCompletedOrDelivered && !isAccepted;

                                            return (
                                                <tr
                                                    key={item.collectionAssignmentId || index}
                                                    className={`table-row-hover ${isExpired ? "table-row-expired" : ""}`}
                                                    style={{ background: isExpired ? "#fff8f8" : isRejected ? "rgba(254, 226, 226, 0.3)" : "inherit" }}
                                                >
                                                    <td className="col-num" style={{ fontWeight: "700", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                                                        {index + 1}
                                                    </td>
                                                    <td className="col-device">
                                                        <div className="user-info">
                                                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                                                                <span className="user-name">
                                                                    {item.brand} {item.model}
                                                                </span>
                                                                {item.assignmentType === "TechnicianToRecyclingCenter" ? (
                                                                    <span style={{ background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd", fontSize: "0.7rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "12px", whiteSpace: "nowrap" }}>
                                                                        Tech ➔ Recycler
                                                                    </span>
                                                                ) : (item.assignmentType === "TechnicianToTechnician" || item.isReassignedFromTech || item.isReassignmentPickup) ? (
                                                                    <span style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #ffedd5", fontSize: "0.7rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "12px", whiteSpace: "nowrap" }}>
                                                                        Tech ➔ Tech
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", fontSize: "0.7rem", fontWeight: 700, padding: "0.1rem 0.45rem", borderRadius: "12px", whiteSpace: "nowrap" }}>
                                                                        Citizen ➔ Tech
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="user-email">
                                                                Cat: {item.categoryName || "E-Waste"} | Assign #{item.collectionAssignmentId}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="col-sender contact-cell">
                                                        {item.assignmentType === "TechnicianToRecyclingCenter" ? (
                                                            <div className="user-info">
                                                                <span className="user-name" style={{ color: "#0369a1", fontWeight: 700 }}>
                                                                    Tech: {item.technicianName || item.inspectionCenterName || "Technician Hub"}
                                                                </span>
                                                                <span className="user-email">
                                                                    To: {item.recyclingCenterName || "Recycling Center"} • Ph: {item.technicianPhone || "N/A"}
                                                                </span>
                                                            </div>
                                                        ) : (item.assignmentType === "TechnicianToTechnician" || item.isReassignedFromTech || item.isReassignmentPickup) ? (
                                                            <div className="user-info">
                                                                <span className="user-name" style={{ color: "#c2410c", fontWeight: 700 }}>
                                                                    Penalized Tech: {item.customerName || item.priorTechnicianName || "Technician Hub"}
                                                                </span>
                                                                <span className="user-email">
                                                                    To Tech: {item.technicianName || "New Tech"} • Ph: {item.customerPhone || "N/A"}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="user-info">
                                                                <span className="user-name">{item.customerName || "Citizen"}</span>
                                                                <span className="user-email">Device #{item.deviceId} • Ph: {item.customerPhone || "N/A"}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="col-agent contact-cell">
                                                        {item.collectionAgentName && item.collectionAgentName !== "Unassigned" ? (
                                                            <div className="user-info">
                                                                <span className="user-name" title={item.collectionAgentName} style={{ color: isRejected ? "#dc2626" : "inherit" }}>
                                                                    {item.collectionAgentName}
                                                                </span>
                                                                <span className="user-email" title={item.collectionAgentEmail || item.collectionAgentPhone || ""}>
                                                                    {item.collectionAgentEmail || `Ph: ${item.collectionAgentPhone || "N/A"}`}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="user-info">
                                                                <span className="user-name" style={{ color: "#d97706", fontWeight: 700 }}>Waiting for Agent</span>
                                                                <span className="user-email">Ph: N/A</span>
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="col-schedule contact-cell">
                                                        <div className="deadline-cell-group">
                                                            <div className="deadline-item">
                                                                <FiCalendar style={{ color: "var(--primary-dark)", flexShrink: 0 }} />
                                                                <span><strong>Date:</strong> {formatShortDate(item.pickupDate)}</span>
                                                            </div>
                                                            <div className="deadline-item-sub">
                                                                <span>Slot: {item.timeSlot || "Standard Slot"}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="col-status">
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                                            {getStatusBadge(item.status)}
                                                            {item.rejectionReason ? (
                                                                <div className="rejection-note-card" title={item.rejectionReason}>
                                                                    <FiAlertTriangle style={{ color: "#e11d48", flexShrink: 0, marginTop: "0.1rem" }} />
                                                                    <span><strong>Reason:</strong> {item.rejectionReason}</span>
                                                                </div>
                                                            ) : isRejected ? (
                                                                <div className="rejection-note-cell">
                                                                    <FiAlertTriangle /> Rejected by Agent
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    <td className="col-actions" style={{ whiteSpace: "nowrap" }}>
                                                        <div className="action-buttons" style={{ display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "center", whiteSpace: "nowrap" }}>
                                                            <button
                                                                className="action-btn action-btn--view"
                                                                onClick={() => setSelectedAssignment(item)}
                                                                title="View Assignment Details"
                                                            >
                                                                <FiEye />
                                                            </button>

                                                            {canAllocate ? (
                                                                failedAutoAllocations.includes(item.collectionAssignmentId) ? (
                                                                    <button
                                                                        className="action-btn action-btn--allocate-manual"
                                                                        onClick={() => {
                                                                            setReassigningAssignment(item);
                                                                            fetchActiveAgents();
                                                                        }}
                                                                        title="Manually Select Collection Agent"
                                                                        style={{ whiteSpace: "nowrap" }}
                                                                    >
                                                                        <FiUserCheck />
                                                                        <span>Allocate Manually</span>
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        className="action-btn action-btn--allocate-primary"
                                                                        onClick={() => handleAutoReassign(item.collectionAssignmentId)}
                                                                        disabled={reassigningLoadingId === item.collectionAssignmentId}
                                                                        title="Allocate Collection Agent"
                                                                    >
                                                                        <FiCpu className={reassigningLoadingId === item.collectionAssignmentId ? "spin-icon" : ""} style={{ fontSize: "1rem" }} />
                                                                        <span>Allocate</span>
                                                                    </button>
                                                                )
                                                            ) : canReassign ? (
                                                                <button
                                                                    className="action-btn action-btn--allocate-manual"
                                                                    onClick={() => {
                                                                        setReassigningAssignment(item);
                                                                        fetchActiveAgents();
                                                                    }}
                                                                    title="Reassign Collection Agent"
                                                                    style={{ whiteSpace: "nowrap" }}
                                                                >
                                                                    <FiUserCheck />
                                                                    <span>Reassign Agent</span>
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="admin-cards-grid">
                                {filteredCollection.map((item, index) => {
                                    const itemJourney = item.assignmentType || "CustomerToTechnician";
                                    const deviceAssignments = collectionAssignments.filter(ca => ca.deviceId === item.deviceId && (ca.assignmentType || "CustomerToTechnician") === itemJourney);
                                    const latestAssignmentId = deviceAssignments.length > 0 
                                        ? Math.max(...deviceAssignments.map(ca => ca.collectionAssignmentId || 0))
                                        : item.collectionAssignmentId;
                                    
                                    const isLatestAssignment = (item.collectionAssignmentId || 0) === latestAssignmentId;

                                    const statusLower = (item.status || "").toLowerCase();
                                    const isRejected = statusLower === "rejected" || statusLower === "declined";
                                    const isCancelled = statusLower === "cancelled";
                                    const isExpired = statusLower === "expired";
                                    const isWaiting = statusLower === "waiting" || !item.collectionAgentId || item.collectionAgentName === "Unassigned";
                                    const isCompletedOrDelivered = statusLower === "completed" || statusLower === "delivered" || statusLower === "deliveredtocenter" || statusLower === "pickedup";
                                    const isAccepted = statusLower.includes("accept") || statusLower === "pickupstarted" || statusLower === "intransit" || statusLower === "outfordelivery" || statusLower === "atinspectioncenter";

                                    const canAllocate = isLatestAssignment && (isWaiting || isRejected || isCancelled || isExpired) && !isCompletedOrDelivered && !isAccepted;
                                    const canReassign = isLatestAssignment && !canAllocate && !isCompletedOrDelivered && !isAccepted;

                                    return (
                                        <div key={item.collectionAssignmentId || index} className="admin-pickup-card">
                                            <div>
                                                <div className="admin-card-header">
                                                    <div className="admin-card-top-row">
                                                        <div className="admin-cat-icon-box">
                                                            <FiTruck />
                                                        </div>
                                                        {getStatusBadge(item.status)}
                                                    </div>
                                                    <div className="admin-card-title-group">
                                                        <span className="admin-card-brand-name">{item.brand} {item.model}</span>
                                                        <span className="admin-card-sub-info">
                                                            Assign #{item.collectionAssignmentId} • Device #{item.deviceId}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="admin-card-body-details">
                                                    <div className="admin-detail-row">
                                                        <FiPackage className="detail-icon" />
                                                        <div>
                                                            <div className="detail-label">Journey Type</div>
                                                            <div className="detail-val" style={{ fontWeight: 700 }}>
                                                                {item.assignmentType === "TechnicianToRecyclingCenter" ? "Tech ➔ Recycler" : (item.assignmentType === "TechnicianToTechnician" || item.isReassignedFromTech || item.isReassignmentPickup) ? "Tech ➔ Tech" : "Citizen ➔ Tech"}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="admin-detail-row">
                                                        <FiMapPin className="detail-icon" />
                                                        <div>
                                                            <div className="detail-label">Sender / Origin</div>
                                                            <div className="detail-val" style={{ fontWeight: 700 }}>{item.customerName || item.technicianName || "Citizen"}</div>
                                                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Ph: {item.customerPhone || item.technicianPhone || "N/A"}</div>
                                                        </div>
                                                    </div>

                                                    <div className="admin-detail-row">
                                                        <FiUserCheck className="detail-icon" />
                                                        <div>
                                                            <div className="detail-label">Collection Agent</div>
                                                            <div className="detail-val" style={{ fontWeight: 700 }}>{item.collectionAgentName || "Waiting for Agent"}</div>
                                                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.collectionAgentEmail || "N/A"}</div>
                                                        </div>
                                                    </div>

                                                    <div className="admin-detail-row">
                                                        <FiCalendar className="detail-icon" />
                                                        <div>
                                                            <div className="detail-label">Pickup Schedule</div>
                                                            <div className="detail-val">{formatShortDate(item.pickupDate)} ({item.timeSlot || "Standard"})</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="admin-card-actions" style={{ display: "flex", gap: "0.4rem", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #e2e8f0" }}>
                                                <button
                                                    className="action-btn action-btn--view"
                                                    onClick={() => setSelectedAssignment(item)}
                                                >
                                                    <FiEye />
                                                    <span>View</span>
                                                </button>
                                                {canAllocate ? (
                                                    failedAutoAllocations.includes(item.collectionAssignmentId) ? (
                                                        <button
                                                            className="action-btn action-btn--allocate-manual"
                                                            onClick={() => {
                                                                setReassigningAssignment(item);
                                                                fetchActiveAgents();
                                                            }}
                                                        >
                                                            <FiUserCheck />
                                                            <span>Allocate Manually</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="action-btn action-btn--allocate"
                                                            onClick={() => handleAutoReassign(item.collectionAssignmentId)}
                                                            disabled={reassigningLoadingId === item.collectionAssignmentId}
                                                        >
                                                            <FiRefreshCw className={reassigningLoadingId === item.collectionAssignmentId ? "spin-icon" : ""} />
                                                            <span>Allocate</span>
                                                        </button>
                                                    )
                                                ) : canReassign ? (
                                                    <button
                                                        className="action-btn action-btn--allocate-manual"
                                                        onClick={() => {
                                                            setReassigningAssignment(item);
                                                            fetchActiveAgents();
                                                        }}
                                                    >
                                                        <FiUserCheck />
                                                        <span>Reassign</span>
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* Details View Modal */}
                {selectedAssignment && (
                    <div className="modal-overlay" onClick={() => setSelectedAssignment(null)}>
                        <div className="device-modal-card" style={{ maxWidth: "700px", width: "92%" }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header" style={{ background: "#ffffff", padding: "0 0 1rem 0", borderBottom: "1px solid #f1f5f9", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
                                        {[selectedAssignment.brand, selectedAssignment.model].filter(Boolean).join(" ") || selectedAssignment.categoryName || "Collection Pickup Request"}
                                    </h2>
                                    <p className="panel-subtitle" style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                                        Collection Assignment ID: #{selectedAssignment.collectionAssignmentId} | Device ID: #{selectedAssignment.deviceId}
                                    </p>
                                </div>
                                <button className="modal-close-btn" onClick={() => setSelectedAssignment(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="device-details-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                                <div className="detail-item">
                                    <label>CATEGORY</label>
                                    <span>{selectedAssignment.categoryName || "E-Waste"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>CITIZEN / OWNER</label>
                                    <span>{selectedAssignment.customerName || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>ASSIGNED AGENT</label>
                                    <span>{selectedAssignment.collectionAgentName || "Unassigned"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>AGENT EMAIL</label>
                                    <span>{selectedAssignment.collectionAgentEmail || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>AGENT PHONE</label>
                                    <span>{selectedAssignment.collectionAgentPhone || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>ASSIGNMENT STATUS</label>
                                    <span>{selectedAssignment.status || "Assigned"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>PROCESSING LIFECYCLE</label>
                                    <span style={{ color: "#0284c7", fontWeight: 700 }}>
                                        {selectedAssignment.processingLifecycleStatus || "Center Allocation / Dispatch Pending"}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <label>QUANTITY & CONDITION</label>
                                    <span>{selectedAssignment.quantity} Unit(s) • {selectedAssignment.condition || "Standard"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>TIME SLOT</label>
                                    <span>{selectedAssignment.timeSlot || "Standard Slot"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>ASSIGNED AT</label>
                                    <span>{formatDate(selectedAssignment.assignedAt)}</span>
                                </div>

                                {/* COLLECT FROM & DELIVER TO ROUTING FLOW */}
                                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                                    {/* COLLECT FROM */}
                                    <div style={{ background: (selectedAssignment.assignmentType === "TechnicianToTechnician" || selectedAssignment.isReassignedFromTech || selectedAssignment.isReassignmentPickup) ? "#fff7ed" : "#f0fdf4", border: (selectedAssignment.assignmentType === "TechnicianToTechnician" || selectedAssignment.isReassignedFromTech || selectedAssignment.isReassignmentPickup) ? "1px solid #ffedd5" : "1px solid #bbf7d0", padding: "1.1rem 1.25rem", borderRadius: "14px" }}>
                                        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: (selectedAssignment.assignmentType === "TechnicianToTechnician" || selectedAssignment.isReassignedFromTech || selectedAssignment.isReassignmentPickup) ? "#c2410c" : "#047857", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                                            <FiMapPin style={{ fontSize: "0.95rem" }} /> COLLECT FROM ({selectedAssignment.assignmentType === "TechnicianToRecyclingCenter" ? "TECHNICIAN" : (selectedAssignment.assignmentType === "TechnicianToTechnician" || selectedAssignment.isReassignedFromTech || selectedAssignment.isReassignmentPickup) ? "PENALIZED TECHNICIAN HUB" : "CITIZEN"})
                                        </div>
                                        {selectedAssignment.assignmentType === "TechnicianToRecyclingCenter" ? (
                                            <>
                                                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#065f46" }}>
                                                    Technician: {selectedAssignment.technicianName || selectedAssignment.inspectionCenterName || "Inspection Hub"} {selectedAssignment.technicianPhone ? `(Ph: ${selectedAssignment.technicianPhone})` : ""}
                                                </div>
                                                <div style={{ fontSize: "0.875rem", color: "#047857", marginTop: "0.25rem", lineHeight: 1.45, fontWeight: 500 }}>
                                                    <strong>Inspection center address:</strong> {selectedAssignment.deliveredAddress || (selectedAssignment.technicianAddress ? `${selectedAssignment.technicianAddress}, ${selectedAssignment.technicianCity || ""} ${selectedAssignment.technicianDistrict || ""} ${selectedAssignment.technicianState || ""}` : "EcoCycle Inspection Facility")}
                                                </div>
                                            </>
                                        ) : (selectedAssignment.assignmentType === "TechnicianToTechnician" || selectedAssignment.isReassignedFromTech || selectedAssignment.isReassignmentPickup) ? (
                                            <>
                                                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#9a3412" }}>
                                                    Penalized Technician / Hub: {selectedAssignment.customerName || selectedAssignment.priorTechnicianName || "Inspection Hub"} {selectedAssignment.customerPhone ? `(Ph: ${selectedAssignment.customerPhone})` : ""}
                                                </div>
                                                <div style={{ fontSize: "0.875rem", color: "#c2410c", marginTop: "0.25rem", lineHeight: 1.45, fontWeight: 500 }}>
                                                    <strong>Penalized center address:</strong> {selectedAssignment.address}
                                                    {selectedAssignment.landmark ? ` (Landmark: ${selectedAssignment.landmark})` : ""}
                                                    {[selectedAssignment.city, selectedAssignment.district, selectedAssignment.state, selectedAssignment.pincode].filter(Boolean).length > 0 ? `, ${[selectedAssignment.city, selectedAssignment.district, selectedAssignment.state, selectedAssignment.pincode].filter(Boolean).join(", ")}` : ""}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#065f46" }}>
                                                    Customer: {selectedAssignment.customerName || "Citizen"} {selectedAssignment.customerPhone ? `(Ph: ${selectedAssignment.customerPhone})` : ""}
                                                </div>
                                                <div style={{ fontSize: "0.875rem", color: "#047857", marginTop: "0.25rem", lineHeight: 1.45, fontWeight: 500 }}>
                                                    <strong>Customer pickup address:</strong> {selectedAssignment.address}
                                                    {selectedAssignment.landmark ? ` (Landmark: ${selectedAssignment.landmark})` : ""}
                                                    {[selectedAssignment.city, selectedAssignment.district, selectedAssignment.state, selectedAssignment.pincode].filter(Boolean).length > 0 ? `, ${[selectedAssignment.city, selectedAssignment.district, selectedAssignment.state, selectedAssignment.pincode].filter(Boolean).join(", ")}` : ""}
                                                </div>
                                            </>
                                        )}
                                        <div style={{ fontSize: "0.825rem", color: "#059669", marginTop: "0.35rem", fontWeight: 600 }}>
                                            <strong>Pickup date / time slot:</strong> {formatDate(selectedAssignment.pickupDate)} • {selectedAssignment.timeSlot || "Standard Slot"}
                                        </div>
                                    </div>

                                    {/* ROUTING ARROW */}
                                    <div style={{ textAlign: "center", color: (selectedAssignment.assignmentType === "TechnicianToTechnician" || selectedAssignment.isReassignedFromTech || selectedAssignment.isReassignmentPickup) ? "#ea580c" : "#059669", fontSize: "1.5rem", fontWeight: 800, margin: "-0.3rem 0" }}>
                                        ↓
                                    </div>

                                    {/* DELIVER TO */}
                                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "1.1rem 1.25rem", borderRadius: "14px" }}>
                                        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                                            <FiTruck style={{ fontSize: "0.95rem" }} /> DELIVER TO ({selectedAssignment.assignmentType === "TechnicianToRecyclingCenter" ? "RECYCLING CENTER" : (selectedAssignment.assignmentType === "TechnicianToTechnician" || selectedAssignment.isReassignedFromTech || selectedAssignment.isReassignmentPickup) ? "NEW INSPECTION HUB" : "INSPECTION HUB"})
                                        </div>
                                        {selectedAssignment.assignmentType === "TechnicianToRecyclingCenter" ? (
                                            <>
                                                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e40af" }}>
                                                    Recycling Center: {selectedAssignment.recyclingCenterName || "Recycling Facility"} {selectedAssignment.recyclingCenterOwner ? `(${selectedAssignment.recyclingCenterOwner})` : ""} {selectedAssignment.recyclingCenterPhone ? `• Ph: ${selectedAssignment.recyclingCenterPhone}` : ""}
                                                </div>
                                                <div style={{ fontSize: "0.875rem", color: "#1e3a8a", marginTop: "0.25rem", lineHeight: 1.45, fontWeight: 500 }}>
                                                    <strong>Recycling center address:</strong> {selectedAssignment.recyclingCenterAddress || "Designated Recycling Facility"}
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e40af" }}>
                                                    Technician / Inspection Center: {selectedAssignment.technicianName ? selectedAssignment.technicianName : "EcoCycle Inspection Team"} {selectedAssignment.inspectionCenterName ? `(${selectedAssignment.inspectionCenterName})` : "(Central Processing Hub)"} {selectedAssignment.technicianPhone ? `• Ph: ${selectedAssignment.technicianPhone}` : ""}
                                                </div>
                                                <div style={{ fontSize: "0.875rem", color: "#1e3a8a", marginTop: "0.25rem", lineHeight: 1.45, fontWeight: 500 }}>
                                                    <strong>Technician/center address:</strong> {selectedAssignment.deliveredAddress || (selectedAssignment.technicianAddress ? `${selectedAssignment.technicianAddress}, ${selectedAssignment.technicianCity || ""} ${selectedAssignment.technicianDistrict || ""} ${selectedAssignment.technicianState || ""} ${selectedAssignment.technicianPincode || ""}` : "EcoCycle Central E-Waste Processing Facility & Inspection Center")}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {selectedAssignment.pickupInstructions && (
                                    <div className="detail-item" style={{ gridColumn: "1 / -1", marginTop: "0.5rem" }}>
                                        <label>PICKUP INSTRUCTIONS</label>
                                        <span>{selectedAssignment.pickupInstructions}</span>
                                    </div>
                                )}
                            </div>



                            {selectedAssignment.rejectionReason && (
                                <div className="assignment-rejection-box" style={{ background: "#fff1f2", border: "1px solid #fecdd3", padding: "1rem", borderRadius: "12px", marginTop: "1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                                    <FiAlertTriangle style={{ color: "#e11d48", fontSize: "1.3rem", marginTop: "0.1rem", flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#e11d48", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            REJECTION REASON (COLLECTION AGENT)
                                        </div>
                                        <p style={{ fontSize: "0.9rem", color: "#9f1239", margin: "0.25rem 0 0 0", fontWeight: 600 }}>
                                            "{selectedAssignment.rejectionReason}"
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="modal-footer-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                                <button
                                    className="btn btn-secondary"
                                    style={{
                                        padding: "0.6rem 1.4rem",
                                        borderRadius: "10px",
                                        fontWeight: "700",
                                        fontSize: "0.875rem",
                                        background: "#ffffff",
                                        color: "#0f172a",
                                        border: "1px solid #cbd5e1",
                                        cursor: "pointer"
                                    }}
                                    onClick={() => setSelectedAssignment(null)}
                                >
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Manual Allocation Modal */}
                {reassigningAssignment && (
                    <div className="modal-overlay" onClick={() => setReassigningAssignment(null)}>
                        <div className="device-modal-card" style={{ maxWidth: "680px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h2>Allocate / Reassign Collection Agent</h2>
                                    <p className="panel-subtitle">
                                        Assignment #ASSIGN-{reassigningAssignment.collectionAssignmentId} • {reassigningAssignment.brand} {reassigningAssignment.model}
                                    </p>
                                </div>
                                <button className="modal-close-btn" onClick={() => setReassigningAssignment(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div style={{ padding: "1.25rem 0 0.5rem 0" }}>
                                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "0.85rem 1.15rem", borderRadius: "12px", marginBottom: "1.25rem", color: "#b45309", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                    <FiClock style={{ fontSize: "1.1rem", flexShrink: 0 }} />
                                    <span><strong>Collection Request Status:</strong> {reassigningAssignment.status || "Waiting for collection agent assignment."}</span>
                                </div>

                                {reassigningAssignment.rejectionReason && (
                                    <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", padding: "0.85rem 1.15rem", borderRadius: "12px", marginBottom: "1.25rem", color: "#9f1239", fontSize: "0.875rem", display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                                        <FiAlertTriangle style={{ color: "#e11d48", fontSize: "1.2rem", flexShrink: 0, marginTop: "0.1rem" }} />
                                        <div>
                                            <strong>Rejected Agent ({reassigningAssignment.collectionAgentName}):</strong> "{reassigningAssignment.rejectionReason}"
                                        </div>
                                    </div>
                                )}

                                {reassignMessage && (
                                    <div style={{ padding: "0.85rem 1.15rem", borderRadius: "10px", background: reassignMessage.includes("Failed") ? "#fff1f2" : "#f0fdf4", color: reassignMessage.includes("Failed") ? "#e11d48" : "#15803d", fontWeight: 600, fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                                        {reassignMessage}
                                    </div>
                                )}

                                {/* Auto Reassign Option */}
                                <div style={{ marginBottom: "1.25rem", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1rem", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: "0.9rem", color: "#166534", fontWeight: 700 }}>Auto-Allocate Agent</h4>
                                        <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.775rem", color: "#15803d" }}>Find best matching agent based on workload &amp; location</p>
                                    </div>
                                    <button
                                        onClick={() => handleAutoReassign(reassigningAssignment.collectionAssignmentId)}
                                        disabled={reassigningLoading}
                                        className="action-btn action-btn--auto"
                                        style={{ padding: "0.55rem 1.1rem", fontSize: "0.85rem" }}
                                    >
                                        <FiCpu className={reassigningLoading ? "spin-icon" : ""} />
                                        <span>Auto Allocate</span>
                                    </button>
                                </div>

                                <form onSubmit={handleManualReassign} style={{ background: "#f8fafc", padding: "1.15rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                            Or Select Active Collection Agent Manually
                                        </div>
                                        <span style={{ fontSize: "0.75rem", background: "#e0f2fe", color: "#0369a1", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 700 }}>
                                            {activeAgents.filter(a => {
                                                const q = agentSearchQuery.toLowerCase().trim();
                                                if (!q) return true;
                                                const name = `${a.firstName || a.FirstName || ""} ${a.lastName || a.LastName || ""}`.toLowerCase();
                                                const city = (a.city || a.City || "").toLowerCase();
                                                const district = (a.district || a.District || "").toLowerCase();
                                                const state = (a.state || a.State || "").toLowerCase();
                                                return name.includes(q) || city.includes(q) || district.includes(q) || state.includes(q);
                                            }).length} Available
                                        </span>
                                    </div>

                                    {/* Agent Search Input */}
                                    <div style={{ position: "relative", marginBottom: "1rem", width: "100%", boxSizing: "border-box" }}>
                                        <FiSearch style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "1rem", zIndex: 1 }} />
                                        <input
                                            type="text"
                                            placeholder="Search collection agent by name, city, district, state..."
                                            value={agentSearchQuery}
                                            onChange={(e) => setAgentSearchQuery(e.target.value)}
                                            style={{
                                                width: "100%",
                                                boxSizing: "border-box",
                                                padding: "0.7rem 0.9rem 0.7rem 2.5rem",
                                                borderRadius: "10px",
                                                border: "1px solid #cbd5e1",
                                                fontSize: "0.875rem",
                                                outline: "none",
                                                background: "#ffffff",
                                                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
                                            }}
                                        />
                                    </div>

                                    {/* Interactive Agent List */}
                                    <div style={{ maxHeight: "260px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem", paddingRight: "0.3rem" }}>
                                        {activeAgents.filter(a => {
                                            const q = agentSearchQuery.toLowerCase().trim();
                                            if (!q) return true;
                                            const name = `${a.firstName || a.FirstName || ""} ${a.lastName || a.LastName || ""}`.toLowerCase();
                                            const city = (a.city || a.City || "").toLowerCase();
                                            const district = (a.district || a.District || "").toLowerCase();
                                            const state = (a.state || a.State || "").toLowerCase();
                                            return name.includes(q) || city.includes(q) || district.includes(q) || state.includes(q);
                                        }).length === 0 ? (
                                            <div style={{ textAlign: "center", padding: "2rem 1rem", background: "#ffffff", borderRadius: "10px", border: "1px dashed #cbd5e1", color: "#64748b", fontSize: "0.875rem" }}>
                                                No agents match "{agentSearchQuery}".
                                            </div>
                                        ) : (
                                            activeAgents.filter(a => {
                                                const q = agentSearchQuery.toLowerCase().trim();
                                                if (!q) return true;
                                                const name = `${a.firstName || a.FirstName || ""} ${a.lastName || a.LastName || ""}`.toLowerCase();
                                                const city = (a.city || a.City || "").toLowerCase();
                                                const district = (a.district || a.District || "").toLowerCase();
                                                const state = (a.state || a.State || "").toLowerCase();
                                                return name.includes(q) || city.includes(q) || district.includes(q) || state.includes(q);
                                            }).map(agent => {
                                                const id = String(agent.collectionAgentId || agent.CollectionAgentId);
                                                const name = `${agent.firstName || agent.FirstName || ""} ${agent.lastName || agent.LastName || ""}`.trim();
                                                const city = agent.city || agent.City || "";
                                                const district = agent.district || agent.District || "";
                                                const state = agent.state || agent.State || "";
                                                const pin = agent.pinCode || agent.PinCode || "";
                                                const locParts = [city, district, state].filter(Boolean);
                                                const locString = locParts.length > 0 ? (pin ? `${locParts.join(", ")} - ${pin}` : locParts.join(", ")) : "Active Agent";
                                                const isSelected = String(selectedAgentId) === id;

                                                return (
                                                    <div
                                                        key={id}
                                                        onClick={() => setSelectedAgentId(id)}
                                                        style={{
                                                            padding: "0.85rem 1rem",
                                                            borderRadius: "12px",
                                                            border: isSelected ? "2px solid #0284c7" : "1px solid #e2e8f0",
                                                            background: isSelected ? "#f0f9ff" : "#ffffff",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            gap: "1rem",
                                                            transition: "all 0.15s ease",
                                                            boxShadow: isSelected ? "0 4px 12px rgba(2,132,199,0.12)" : "0 1px 3px rgba(0,0,0,0.02)"
                                                        }}
                                                    >
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                                            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: isSelected ? "#0284c7" : "#ecfdf5", color: isSelected ? "#ffffff" : "#047857", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem", flexShrink: 0 }}>
                                                                {name.charAt(0).toUpperCase() || "A"}
                                                            </div>
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                                                <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.925rem" }}>{name}</span>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#64748b", fontSize: "0.8rem" }}>
                                                                    <FiMapPin style={{ color: "#059669", flexShrink: 0 }} />
                                                                    <span>{locString}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: "flex", alignItems: "center" }}>
                                                            {isSelected ? (
                                                                <FiCheckCircle style={{ color: "#0284c7", fontSize: "1.3rem" }} />
                                                            ) : (
                                                                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #cbd5e1" }}></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={reassigningLoading || !selectedAgentId}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "10px",
                                            background: selectedAgentId ? "#0284c7" : "#cbd5e1",
                                            color: "#ffffff",
                                            border: "none",
                                            fontWeight: 700,
                                            fontSize: "0.9rem",
                                            cursor: selectedAgentId ? "pointer" : "not-allowed",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "0.5rem",
                                            boxShadow: selectedAgentId ? "0 4px 12px rgba(2,132,199,0.2)" : "none",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        <FiCpu className={reassigningLoading ? "spin-icon" : ""} />
                                        <span>{reassigningLoading ? "Allocating Agent..." : "Assign Selected Agent"}</span>
                                    </button>
                                </form>
                            </div>

                            <div className="modal-footer-actions" style={{ marginTop: "1rem" }}>
                                <button
                                    type="button"
                                    className="action-btn--cancel"
                                    onClick={() => setReassigningAssignment(null)}
                                >
                                    <FiX /> Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default Pickup_collectionagent;
