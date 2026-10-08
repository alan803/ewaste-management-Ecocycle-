import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import {
    FiRefreshCw,
    FiBell,
    FiSearch,
    FiCpu,
    FiTrash2,
    FiRotateCcw,
    FiClock,
    FiCheckCircle,
    FiAlertTriangle,
    FiBox,
    FiMapPin,
    FiX,
    FiGrid,
    FiList,
    FiUserCheck,
    FiEye,
    FiPhone,
    FiUser,
    FiActivity,
    FiCheck,
    FiShield
} from "react-icons/fi";
import "./Manage_centerallocation.css";

function ManageCenterAllocation() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All"); // 'All' | 'Waiting' | 'Assigned' | 'Accepted' | 'Rejected'
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'
    
    // Details Modal State
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Re-allocation State
    const [reallocatingId, setReallocatingId] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetchData(token);
    }, []);

    const fetchData = async (authToken) => {
        const token = authToken || localStorage.getItem("token");
        try {
            setLoading(true);
            const reqRes = await axios.get("https://localhost:7102/api/AllocateRecyclingCenter/admin/requests", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(reqRes.data || []);
        } catch (err) {
            console.error("Error fetching facility allocation requests:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReallocateCenter = async (item) => {
        if (!item || !item.deviceId) return;

        const token = localStorage.getItem("token");
        try {
            setReallocatingId(item.deviceId);
            const url = `https://localhost:7102/api/AllocateRecyclingCenter/manual-allocate/${item.deviceId}`;

            await axios.post(url, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            fetchData(token);
        } catch (err) {
            console.error("Error reallocating facility:", err);
        } finally {
            setReallocatingId(null);
        }
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

    const getDeadlineText = (deadlineStr) => {
        if (!deadlineStr) return "No Deadline Set";
        try {
            const d = new Date(deadlineStr);
            const now = new Date();
            const diffMs = d.getTime() - now.getTime();
            if (diffMs <= 0) return "Deadline Passed (Expired)";
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            return `${diffHours}h ${diffMins}m remaining`;
        } catch {
            return deadlineStr;
        }
    };

    // Metrics calculation
    const totalRequests = requests.length;
    const waitingCount = requests.filter(r => (r.status || "").toLowerCase() === "waiting").length;
    const assignedCount = requests.filter(r => (r.status || "").toLowerCase() === "assigned").length;
    const acceptedCount = requests.filter(r => (r.status || "").toLowerCase() === "accepted" || (r.status || "").toLowerCase() === "processing").length;
    const rejectedCount = requests.filter(r => (r.status || "").toLowerCase() === "rejected" || (r.status || "").toLowerCase() === "expired").length;

    const filteredRequests = requests.filter(item => {
        const sLower = (item.status || "").toLowerCase();

        if (activeTab === "Waiting" && sLower !== "waiting") return false;
        if (activeTab === "Assigned" && sLower !== "assigned") return false;
        if (activeTab === "Accepted" && (sLower !== "accepted" && sLower !== "processing")) return false;
        if (activeTab === "Rejected" && (sLower !== "rejected" && sLower !== "expired")) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const devName = `${item.brand || ""} ${item.model || ""}`.toLowerCase();
        const centerName = String(item.recyclingCenterName || "").toLowerCase();
        const custName = String(item.customerName || "").toLowerCase();
        const city = String(item.customerCity || item.recyclingCenterCity || "").toLowerCase();

        return (
            devName.includes(q) ||
            centerName.includes(q) ||
            custName.includes(q) ||
            city.includes(q) ||
            sLower.includes(q)
        );
    });

    const getStatusBadge = (statusStr) => {
        const s = (statusStr || "").toLowerCase();
        const style = {
            padding: "0.35rem 0.75rem",
            fontSize: "0.775rem",
            fontWeight: 700,
            borderRadius: "9999px",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            whiteSpace: "nowrap"
        };

        if (s === "accepted" || s === "processing") {
            return <span style={{ ...style, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}><FiCheckCircle /> Facility Accepted</span>;
        } else if (s === "assigned") {
            return <span style={{ ...style, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}><FiClock /> Facility Assigned</span>;
        } else if (s === "waiting") {
            return <span style={{ ...style, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}><FiAlertTriangle /> Waiting (Unassigned)</span>;
        } else if (s === "expired" || s === "rejected") {
            return <span style={{ ...style, background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" }}><FiX /> {s === "expired" ? "Expired" : "Rejected"}</span>;
        } else {
            return <span style={{ ...style, background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}><FiClock /> {statusStr || "Pending"}</span>;
        }
    };

    return (
        <div className="admin-alloc-mgmt-page">
            <Navbar />

            <div className="admin-alloc-mgmt-main">
                {/* Top Floating Glass Header */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <div className="command-brand">
                            <h1>Manage Facility Allocations</h1>
                        </div>
                        <p className="command-subtitle">
                            Track assigned recycling &amp; refurbishment facility requests, response deadlines, and processing status
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search facility, device, owner or status..."
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

                {/* Metric Summary Cards */}
                <div className="metrics-grid-v2">
                    <div className="metric-card-v2">
                        <div className="metric-icon-box blue">
                            <FiActivity />
                        </div>
                        <div>
                            <div className="metric-val">{totalRequests}</div>
                            <div className="metric-lbl">Total Allocation Requests</div>
                        </div>
                    </div>

                    <div className="metric-card-v2">
                        <div className="metric-icon-box amber">
                            <FiAlertTriangle />
                        </div>
                        <div>
                            <div className="metric-val">{waitingCount}</div>
                            <div className="metric-lbl">Waiting (Unassigned)</div>
                        </div>
                    </div>

                    <div className="metric-card-v2">
                        <div className="metric-icon-box blue">
                            <FiClock />
                        </div>
                        <div>
                            <div className="metric-val">{assignedCount}</div>
                            <div className="metric-lbl">Assigned Facilities</div>
                        </div>
                    </div>

                    <div className="metric-card-v2">
                        <div className="metric-icon-box emerald">
                            <FiCheckCircle />
                        </div>
                        <div>
                            <div className="metric-val">{acceptedCount}</div>
                            <div className="metric-lbl">Facility Accepted</div>
                        </div>
                    </div>
                </div>

                {/* Content Panel */}
                <section className="content-section">
                    <div className="panel-card table-panel">
                        <div className="panel-header">
                            <div>
                                <h3 className="panel-title">Facility Allocation Requests &amp; Deadlines</h3>
                                <p className="panel-subtitle">
                                    Monitor response deadlines and re-allocate facilities when requests expire or remain unassigned
                                </p>
                            </div>

                            <div className="panel-actions">
                                <div className="filter-pill-group">
                                    {[
                                        { id: "All", label: `All (${totalRequests})` },
                                        { id: "Waiting", label: `Waiting (${waitingCount})` },
                                        { id: "Assigned", label: `Assigned (${assignedCount})` },
                                        { id: "Accepted", label: `Accepted (${acceptedCount})` },
                                        { id: "Rejected", label: `Expired/Rejected (${rejectedCount})` }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            className={`pill-btn ${activeTab === tab.id ? "pill-btn--active" : ""}`}
                                            onClick={() => setActiveTab(tab.id)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="loading-state">
                                <div className="loading-spinner"></div>
                                <p>Loading facility allocation requests...</p>
                            </div>
                        ) : filteredRequests.length === 0 ? (
                            <div className="no-data-state">
                                <FiBox className="no-data-icon" />
                                <p>No allocation requests found under "{activeTab}".</p>
                            </div>
                        ) : (
                            <div className="glass-table-wrapper">
                                <table className="glass-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Device Details</th>
                                            <th>Customer / Origin</th>
                                            <th>Assigned Facility</th>
                                            <th>Status &amp; Deadline</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRequests.map((item, idx) => (
                                            <tr key={item.recyclingCenterRequestId || idx} className="table-row-hover">
                                                <td style={{ fontWeight: "700", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                                                    {idx + 1}
                                                </td>
                                                <td>
                                                    <div className="user-info">
                                                        <span className="user-name">{item.brand} {item.model}</span>
                                                        <span className="user-email">Device #{item.deviceId} &bull; {item.categoryName || "E-Waste"}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="user-info">
                                                        <span className="user-name">{item.customerName || "Customer"}</span>
                                                        <span className="user-email">{item.customerCity || "Location N/A"}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="user-info">
                                                        <span className="user-name" style={{ color: item.recyclingCenterName ? "#0f172a" : "#b45309" }}>
                                                            {item.recyclingCenterName || "Unassigned Center"}
                                                        </span>
                                                        <span className="user-email">
                                                            {item.recyclingCenterCity ? `${item.recyclingCenterCity}, ${item.recyclingCenterState}` : "Facility Unassigned"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="user-info">
                                                        <div>{getStatusBadge(item.status)}</div>
                                                        {item.responseDeadline && (item.status === "Assigned" || item.status === "Waiting") && (
                                                            <span style={{ fontSize: "0.725rem", color: "#2563eb", fontWeight: 600, marginTop: "0.2rem" }}>
                                                                ⏳ {getDeadlineText(item.responseDeadline)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="action-btn action-btn--view"
                                                            style={{ background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", padding: "0.4rem 0.75rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}
                                                            onClick={() => setSelectedRequest(item)}
                                                            title="View Allocation Details"
                                                        >
                                                            <FiEye />
                                                            <span>Details</span>
                                                        </button>

                                                        {((item.status || "").toLowerCase() === "waiting" || (item.status || "").toLowerCase() === "expired" || (item.status || "").toLowerCase() === "assigned") && (
                                                            <button
                                                                className="action-btn action-btn--allocate"
                                                                style={{
                                                                    background: "#fffbebf0",
                                                                    color: "#b45309",
                                                                    border: "1px solid #fde68a",
                                                                    padding: "0.4rem 0.75rem",
                                                                    borderRadius: "8px",
                                                                    fontWeight: 700,
                                                                    fontSize: "0.8rem",
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "0.35rem",
                                                                    cursor: reallocatingId === item.deviceId ? "not-allowed" : "pointer",
                                                                    opacity: reallocatingId === item.deviceId ? 0.7 : 1
                                                                }}
                                                                onClick={() => handleReallocateCenter(item)}
                                                                disabled={reallocatingId === item.deviceId}
                                                                title="Auto-allocate Facility"
                                                            >
                                                                <FiCpu className={reallocatingId === item.deviceId ? "spin-icon" : ""} />
                                                                <span>{reallocatingId === item.deviceId ? "Allocating..." : "Re-allocate"}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>

                {/* Details Modal */}
                {selectedRequest && (
                    <div className="alloc-modal-overlay" onClick={() => setSelectedRequest(null)}>
                        <div className="alloc-modal-dialog" style={{ maxWidth: "600px", padding: "1.5rem" }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                                        Allocation Request Details
                                    </h3>
                                    <span style={{ fontSize: "0.775rem", color: "#64748b" }}>
                                        Request #{selectedRequest.recyclingCenterRequestId} &bull; Device #{selectedRequest.deviceId}
                                    </span>
                                </div>
                                <button onClick={() => setSelectedRequest(null)} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FiX />
                                </button>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Device Specs</div>
                                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", marginTop: "0.2rem" }}>
                                        {selectedRequest.brand} {selectedRequest.model}
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "0.15rem" }}>
                                        Category: {selectedRequest.categoryName || "E-Waste"} &bull; Qty: {selectedRequest.quantity || 1}
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 600, marginTop: "0.3rem" }}>
                                        Decision: {selectedRequest.processingDecision || "Recycling"}
                                    </div>
                                </div>

                                <div style={{ background: "#f0f9ff", padding: "1rem", borderRadius: "12px", border: "1px solid #bae6fd" }}>
                                    <div style={{ fontSize: "0.725rem", color: "#0369a1", fontWeight: 700, textTransform: "uppercase" }}>Customer Info</div>
                                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0c4a6e", marginTop: "0.2rem" }}>
                                        {selectedRequest.customerName || "Customer"}
                                    </div>
                                    <div style={{ fontSize: "0.8rem", color: "#0284c7", marginTop: "0.15rem" }}>
                                        City: {selectedRequest.customerCity || "N/A"}
                                    </div>
                                    {selectedRequest.customerPhone && (
                                        <div style={{ fontSize: "0.8rem", color: "#0369a1", marginTop: "0.2rem" }}>
                                            Phone: {selectedRequest.customerPhone}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
                                <div style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem" }}>
                                    Facility Assignment Status
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                    <div>{getStatusBadge(selectedRequest.status)}</div>
                                    {selectedRequest.reassignmentCount > 0 && (
                                        <span style={{ fontSize: "0.75rem", background: "#fffbeb", color: "#b45309", padding: "0.2rem 0.55rem", borderRadius: "6px", fontWeight: 700 }}>
                                            Reassigned {selectedRequest.reassignmentCount} time(s)
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: "0.825rem", color: "#334155", marginTop: "0.3rem" }}>
                                    Assigned Facility: <strong>{selectedRequest.recyclingCenterName || "None"}</strong>
                                </div>
                                {selectedRequest.responseDeadline && (
                                    <div style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 600, marginTop: "0.2rem" }}>
                                        Deadline: {formatDate(selectedRequest.responseDeadline)} ({getDeadlineText(selectedRequest.responseDeadline)})
                                    </div>
                                )}
                                {selectedRequest.rejectionReason && (
                                    <div style={{ fontSize: "0.825rem", color: "#dc2626", marginTop: "0.4rem", background: "#fef2f2", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid #fca5a5" }}>
                                        <strong>Rejection Reason:</strong> {selectedRequest.rejectionReason}
                                    </div>
                                )}
                            </div>

                            <div style={{ textAlign: "right" }}>
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    style={{ padding: "0.55rem 1.25rem", borderRadius: "10px", background: "#2563eb", color: "#ffffff", border: "none", fontWeight: 700, cursor: "pointer" }}
                                >
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                )}




            </div>
        </div>
    );
}

export default ManageCenterAllocation;
