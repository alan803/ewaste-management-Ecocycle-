import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import {
    FiRefreshCw,
    FiBell,
    FiSearch,
    FiCpu,
    FiRotateCcw,
    FiClock,
    FiCheckCircle,
    FiAlertTriangle,
    FiBox,
    FiX,
    FiEye,
    FiPhone,
    FiMapPin,
    FiActivity,
    FiCheck,
    FiGrid,
    FiList
} from "react-icons/fi";
import "./Manage_recyclingallocation.css";

function ManageRefurbishmentAllocation() {
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
            const reqRes = await axios.get("https://ecocycle.runasp.net/api/AllocateRefurbishmentCenter/admin/requests", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(reqRes.data || []);
        } catch (err) {
            console.error("Error fetching refurbishment allocation requests:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReallocateCenter = async (item) => {
        if (!item || !item.deviceId) return;

        const token = localStorage.getItem("token");
        try {
            setReallocatingId(item.deviceId);
            const url = `https://ecocycle.runasp.net/api/AllocateRefurbishmentCenter/manual-allocate/${item.deviceId}`;

            await axios.post(url, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            fetchData(token);
        } catch (err) {
            console.error("Error reallocating refurbishment center:", err);
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
        const centerName = String(item.refurbishmentCenterName || "").toLowerCase();
        const centerEmail = String(item.refurbishmentCenterEmail || "").toLowerCase();
        const custName = String(item.customerName || "").toLowerCase();
        const city = String(item.customerCity || item.refurbishmentCenterCity || "").toLowerCase();

        return (
            devName.includes(q) ||
            centerName.includes(q) ||
            centerEmail.includes(q) ||
            custName.includes(q) ||
            city.includes(q) ||
            sLower.includes(q)
        );
    });

    const getStatusBadge = (statusStr) => {
        const s = (statusStr || "").toLowerCase();
        const style = {
            padding: "0.25rem 0.75rem",
            fontSize: "0.775rem",
            fontWeight: 700,
            borderRadius: "9999px",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            whiteSpace: "nowrap"
        };

        if (s === "accepted" || s === "processing") {
            return <span style={{ ...style, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}>&bull; Accepted</span>;
        } else if (s === "assigned") {
            return <span style={{ ...style, background: "#f0fdf4", color: "#16a34a", border: "1px solid #dcfce7" }}>&bull; Assigned</span>;
        } else if (s === "waiting") {
            return <span style={{ ...style, background: "#fffbeb", color: "#d97706", border: "1px solid #fef3c7" }}>&bull; Waiting</span>;
        } else if (s === "expired" || s === "rejected") {
            return <span style={{ ...style, background: "#fef2f2", color: "#dc2626", border: "1px solid #fee2e2" }}>&bull; {s === "expired" ? "Expired" : "Rejected"}</span>;
        } else {
            return <span style={{ ...style, background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}>&bull; {statusStr || "Pending"}</span>;
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
                            <h1>Manage Refurbishment Allocations</h1>
                        </div>
                        <p className="command-subtitle">
                            Track and manage all refurbishment center allocation requests, response deadlines, and center assignments
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search refurbishment center, device, customer..."
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
                        <div className="metric-icon-box blue" style={{ background: "#f5f3ff", color: "#7c3aed" }}>
                            <FiRotateCcw />
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
                            <div className="metric-lbl">Assigned Centers</div>
                        </div>
                    </div>

                    <div className="metric-card-v2">
                        <div className="metric-icon-box emerald">
                            <FiCheckCircle />
                        </div>
                        <div>
                            <div className="metric-val">{acceptedCount}</div>
                            <div className="metric-lbl">Center Accepted</div>
                        </div>
                    </div>
                </div>

                {/* Content Panel */}
                <section className="content-section">
                    <div className="panel-card table-panel">
                        <div className="panel-header">
                            <div>
                                <h3 className="panel-title">Refurbishment Center Requests &amp; Deadlines</h3>
                                <p className="panel-subtitle">
                                    Monitor response deadlines and re-allocate centers when requests expire or remain unassigned
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
                                <p>Loading refurbishment center requests...</p>
                            </div>
                        ) : filteredRequests.length === 0 ? (
                            <div className="no-data-state">
                                <FiBox className="no-data-icon" />
                                <p>No refurbishment center allocation requests found under "{activeTab}".</p>
                            </div>
                        ) : viewMode === "grid" ? (
                            <div className="admin-cards-grid">
                                {filteredRequests.map((item, idx) => {
                                    const isCanReallocate = !["accepted", "processing", "rejected", "waiting"].includes((item.status || "").toLowerCase());
                                    return (
                                        <div className="admin-pickup-card" key={item.refurbishmentRequestId || idx}>
                                            <div>
                                                <div className="admin-card-header">
                                                    <div className="admin-card-top-row">
                                                        <div className="admin-cat-icon-box" style={{ background: "#f5f3ff", color: "#7c3aed" }}>
                                                            <FiRotateCcw />
                                                        </div>
                                                        <div>{getStatusBadge(item.status)}</div>
                                                    </div>
                                                    <div className="admin-card-title-group">
                                                        <h4 className="admin-card-brand-name">{item.brand} {item.model}</h4>
                                                        <p className="admin-card-cat-sub">
                                                            Req #{item.refurbishmentRequestId} &bull; {item.categoryName || "E-Waste"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="admin-card-body">
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.2rem" }}>
                                                        <div className="admin-detail-row">
                                                            <FiBox className="detail-icon" style={{ color: "#3b82f6" }} />
                                                            <div>
                                                                <div className="detail-label">Origin Citizen</div>
                                                                <div className="detail-val">{item.customerName || "Citizen"}</div>
                                                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Device #{item.deviceId}</div>
                                                            </div>
                                                        </div>

                                                        <div className="admin-detail-row">
                                                            <FiMapPin className="detail-icon" style={{ color: "#7c3aed" }} />
                                                            <div>
                                                                <div className="detail-label">Refurbishment Center</div>
                                                                <div className="detail-val">{item.refurbishmentCenterName || "Unassigned Center"}</div>
                                                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.refurbishmentCenterCity || "City N/A"}</div>
                                                            </div>
                                                        </div>

                                                        <div className="admin-detail-row">
                                                            <FiClock className="detail-icon" style={{ color: "#d97706" }} />
                                                            <div>
                                                                <div className="detail-label">Response Deadline</div>
                                                                <div className="detail-val" style={{ fontSize: "0.8rem", color: "#d97706" }}>
                                                                    {getDeadlineText(item.responseDeadline)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px dashed #e2e8f0" }}>
                                                <button
                                                    onClick={() => setSelectedRequest(item)}
                                                    title="View Allocation Details"
                                                    style={{
                                                        flex: 1,
                                                        height: "40px",
                                                        background: "#ffffff",
                                                        color: "#334155",
                                                        border: "1px solid #cbd5e1",
                                                        borderRadius: "10px",
                                                        fontSize: "0.825rem",
                                                        fontWeight: 700,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "0.4rem",
                                                        cursor: "pointer",
                                                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                                                    }}
                                                >
                                                    <FiEye style={{ fontSize: "0.95rem" }} />
                                                    <span>View</span>
                                                </button>

                                                {isCanReallocate && (
                                                    <button
                                                        onClick={() => handleReallocateCenter(item)}
                                                        disabled={reallocatingId === item.deviceId}
                                                        title="Auto-allocate Refurbishment Center"
                                                        style={{
                                                            flex: 1,
                                                            height: "40px",
                                                            background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                                                            color: "#ffffff",
                                                            border: "none",
                                                            borderRadius: "10px",
                                                            fontSize: "0.825rem",
                                                            fontWeight: 700,
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            gap: "0.4rem",
                                                            boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)",
                                                            cursor: reallocatingId === item.deviceId ? "not-allowed" : "pointer",
                                                            opacity: reallocatingId === item.deviceId ? 0.7 : 1
                                                        }}
                                                    >
                                                        <FiCpu className={reallocatingId === item.deviceId ? "spin-icon" : ""} style={{ fontSize: "0.95rem" }} />
                                                        <span>{reallocatingId === item.deviceId ? "Allocating..." : "Reassign"}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="glass-table-wrapper">
                                <table className="glass-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "32px", textAlign: "center" }}>#</th>
                                            <th>DEVICE</th>
                                            <th>CITIZEN</th>
                                            <th>REFURBISHMENT CENTER</th>
                                            <th>DEADLINES</th>
                                            <th>STATUS</th>
                                            <th style={{ textAlign: "center", width: "130px" }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRequests.map((item, idx) => (
                                            <tr key={item.refurbishmentRequestId || idx} className="table-row-hover">
                                                <td style={{ fontWeight: "700", color: "#475569", fontSize: "0.825rem", textAlign: "center" }}>
                                                    {idx + 1}
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                                        <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.85rem" }}>{item.brand} {item.model}</span>
                                                        <span style={{ fontSize: "0.725rem", color: "#64748b", marginTop: "0.1rem" }}>
                                                            {item.categoryName || "E-Waste"} &bull; Req #{item.refurbishmentRequestId}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                                        <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.85rem" }}>{item.customerName || "Citizen"}</span>
                                                        <span style={{ fontSize: "0.725rem", color: "#64748b", marginTop: "0.1rem" }}>Device #{item.deviceId}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                                        <span style={{ fontWeight: 700, color: item.refurbishmentCenterName ? "#0f172a" : "#b45309", fontSize: "0.85rem" }}>
                                                            {item.refurbishmentCenterName || "Unassigned Center"}
                                                        </span>
                                                        {item.refurbishmentCenterEmail && (
                                                            <span style={{ fontSize: "0.725rem", color: "#7c3aed", marginTop: "0.05rem", fontWeight: 600 }}>
                                                                {item.refurbishmentCenterEmail}
                                                            </span>
                                                        )}
                                                        <span style={{ fontSize: "0.725rem", color: "#64748b", marginTop: "0.1rem" }}>
                                                            {item.refurbishmentCenterPhone || (item.refurbishmentCenterCity ? `${item.refurbishmentCenterCity}, ${item.refurbishmentCenterState}` : "Unassigned")}
                                                            {item.reassignmentCount > 0 ? ` • Reassigned ${item.reassignmentCount}x` : ""}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                                                        <span style={{ fontSize: "0.775rem", color: "#15803d", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                                            <FiClock /> Assigned: {formatDate(item.assignedAt)}
                                                        </span>
                                                        <span style={{ fontSize: "0.725rem", color: "#2563eb", fontWeight: 600 }}>
                                                            {getDeadlineText(item.responseDeadline)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                                                        <div>{getStatusBadge(item.status)}</div>
                                                        <span style={{ fontSize: "0.725rem", color: "#64748b" }}>
                                                            {item.lifecycleStatus || "RefurbishmentCenterAssigned"}
                                                        </span>
                                                        {item.rejectionReason && (
                                                            <span style={{ fontSize: "0.7rem", color: "#dc2626", fontWeight: 600 }}>
                                                                Reason: {item.rejectionReason}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ width: "130px", textAlign: "center" }}>
                                                    <div className="action-buttons" style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center", justifyContent: "center" }}>
                                                        <button
                                                            style={{
                                                                background: "#ffffff",
                                                                border: "1px solid #cbd5e1",
                                                                borderRadius: "8px",
                                                                padding: "0.35rem 0.5rem",
                                                                cursor: "pointer",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                color: "#334155",
                                                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                                                            }}
                                                            onClick={() => setSelectedRequest(item)}
                                                            title="View Allocation Details"
                                                        >
                                                            <FiEye style={{ fontSize: "1rem" }} />
                                                        </button>

                                                        {!["accepted", "processing", "rejected", "waiting"].includes((item.status || "").toLowerCase()) && (
                                                            <button
                                                                style={{
                                                                    background: "#fffbebf0",
                                                                    color: "#b45309",
                                                                    border: "1px solid #fde68a",
                                                                    padding: "0.35rem 0.65rem",
                                                                    borderRadius: "8px",
                                                                    fontWeight: 700,
                                                                    fontSize: "0.775rem",
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "0.25rem",
                                                                    cursor: reallocatingId === item.deviceId ? "not-allowed" : "pointer",
                                                                    whiteSpace: "nowrap",
                                                                    opacity: reallocatingId === item.deviceId ? 0.7 : 1
                                                                }}
                                                                onClick={() => handleReallocateCenter(item)}
                                                                disabled={reallocatingId === item.deviceId}
                                                                title="Auto-allocate Refurbishment Center"
                                                            >
                                                                <FiCpu className={reallocatingId === item.deviceId ? "spin-icon" : ""} />
                                                                <span>{reallocatingId === item.deviceId ? "Allocating..." : "Reassign"}</span>
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

                {/* Details View Modal */}
                {selectedRequest && (
                    <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
                        <div className="device-modal-card" style={{ maxWidth: "680px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header" style={{ background: "#ffffff", padding: "0 0 1rem 0", borderBottom: "1px solid #f1f5f9", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
                                        {[selectedRequest.brand, selectedRequest.model].filter(Boolean).join(" ") || selectedRequest.categoryName || "Refurbishment Allocation Request"}
                                    </h2>
                                    <p className="panel-subtitle" style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                                        Request ID: #{selectedRequest.refurbishmentRequestId} | Device ID: #{selectedRequest.deviceId}
                                    </p>
                                </div>
                                <button className="modal-close-btn" onClick={() => setSelectedRequest(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="device-details-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                                <div className="detail-item">
                                    <label>CATEGORY</label>
                                    <span>{selectedRequest.categoryName || selectedRequest.category || "E-Waste"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>CITIZEN / OWNER</label>
                                    <span>{selectedRequest.customerName || selectedRequest.userName || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>CUSTOMER CITY</label>
                                    <span>{selectedRequest.customerCity || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>CUSTOMER PHONE</label>
                                    <span>{selectedRequest.customerPhone || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>REFURBISHMENT CENTER</label>
                                    <span>{selectedRequest.refurbishmentCenterName || "Unassigned"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>CENTER EMAIL</label>
                                    <span style={{ color: "#7c3aed", fontWeight: 600 }}>{selectedRequest.refurbishmentCenterEmail || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>CENTER PHONE</label>
                                    <span>{selectedRequest.refurbishmentCenterPhone || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>ALLOCATION STATUS</label>
                                    <span>{selectedRequest.status || "Waiting"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>QUANTITY</label>
                                    <span>{selectedRequest.quantity || 1} unit(s)</span>
                                </div>
                                <div className="detail-item">
                                    <label>PROCESSING DECISION</label>
                                    <span>{selectedRequest.processingDecision || "Refurbishment"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>REASSIGNMENT COUNT</label>
                                    <span>{selectedRequest.reassignmentCount ?? 0}</span>
                                </div>
                                <div className="detail-item">
                                    <label>ASSIGNED AT</label>
                                    <span>{formatDate(selectedRequest.assignedAt)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>RESPONSE DEADLINE</label>
                                    <span>{formatDate(selectedRequest.responseDeadline)}</span>
                                </div>
                            </div>

                            {selectedRequest.rejectionReason && (
                                <div className="assignment-rejection-box" style={{ background: "#fff1f2", border: "1px solid #fecdd3", padding: "1rem", borderRadius: "12px", marginTop: "1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                                    <FiAlertTriangle style={{ color: "#e11d48", fontSize: "1.3rem", marginTop: "0.1rem", flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#e11d48", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            REJECTION REASON (REFURBISHMENT CENTER)
                                        </div>
                                        <p style={{ fontSize: "0.9rem", color: "#9f1239", margin: "0.25rem 0 0 0", fontWeight: 600 }}>
                                            "{selectedRequest.rejectionReason}"
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
                                    onClick={() => setSelectedRequest(null)}
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

export default ManageRefurbishmentAllocation;
