import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    FiSearch,
    FiRefreshCw,
    FiAlertTriangle,
    FiCheckCircle,
    FiClock,
    FiDollarSign,
    FiUser,
    FiSmartphone,
    FiMail,
    FiSlash,
    FiShield,
    FiSend,
    FiActivity,
    FiClipboard,
    FiGrid,
    FiList,
    FiUserCheck,
    FiX
} from "react-icons/fi";
import Navbar from "./Navbar";
import "./Manage_penalties.css";

function ManagePenalties() {
    const [penalties, setPenalties] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("table");
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const [reassignModalTarget, setReassignModalTarget] = useState(null);
    const [selectedNewTechId, setSelectedNewTechId] = useState("");
    const [reassigning, setReassigning] = useState(false);

    const [cancelModalTarget, setCancelModalTarget] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelSuccessMsg, setCancelSuccessMsg] = useState("");

    useEffect(() => {
        fetchPenalties();
    }, []);

    const fetchPenalties = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const [penRes, agentPenRes, techRes] = await Promise.all([
                axios.get("https://ecocycle.runasp.net/api/Inspection/technician-penalties", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get("https://ecocycle.runasp.net/api/CollectionAssignment/agent-penalties", {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: [] })),
                axios.get("https://ecocycle.runasp.net/api/Technician/All", {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: [] }))
            ]);

            const techData = penRes.data;
            const techList = (Array.isArray(techData) ? techData : (techData.$values || techData.results || [])).map(item => ({
                ...item,
                isAgent: false,
                roleLabel: "Technician",
                penaltyId: item.technicianPenaltyId,
                displayRef: `#PEN-TECH-${item.technicianPenaltyId}`,
                userFullName: item.technicianName,
                userEmail: item.technicianEmail,
                userPhone: item.technicianPhone
            }));

            const agentData = agentPenRes.data;
            const agentList = (Array.isArray(agentData) ? agentData : (agentData.$values || agentData.results || [])).map(item => ({
                ...item,
                isAgent: true,
                roleLabel: "Collection Agent",
                penaltyId: item.agentPenaltyId,
                displayRef: `#PEN-AGENT-${item.agentPenaltyId}`,
                userFullName: item.agentName,
                userEmail: item.agentEmail,
                userPhone: item.agentPhone,
                inspectionCenter: item.serviceArea || "Service Area"
            }));

            setPenalties([...techList, ...agentList]);
            setTechnicians(techRes.data || []);
        } catch (err) {
            console.error("Error fetching user penalties:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReassignTechnician = async (techIdToUse = null) => {
        const targetTechId = techIdToUse || selectedNewTechId;
        if (!reassignModalTarget) return;

        const token = localStorage.getItem("token");
        try {
            setReassigning(true);
            let url = `https://ecocycle.runasp.net/api/Inspection/manual-allocate/${reassignModalTarget.deviceId}`;
            if (targetTechId && targetTechId !== "auto") {
                url += `/${targetTechId}`;
            }

            const res = await axios.post(url, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(res.data?.message || `New technician assigned for Device #DEV-${reassignModalTarget.deviceId}!`);
            setReassignModalTarget(null);
            setSelectedNewTechId("");
            fetchPenalties();
        } catch (err) {
            console.error("Error reassigning technician:", err);
            alert(err.response?.data?.message || "Failed to reassign technician.");
        } finally {
            setReassigning(false);
        }
    };

    const handleUpdateStatus = async (item, newStatus) => {
        const targetId = item.penaltyId || item.technicianPenaltyId || item.agentPenaltyId;
        setActionLoadingId(item.displayRef || targetId);
        try {
            const token = localStorage.getItem("token");
            const endpoint = item.isAgent
                ? `https://ecocycle.runasp.net/api/CollectionAssignment/agent-penalties/${targetId}/status`
                : `https://ecocycle.runasp.net/api/Inspection/technician-penalties/${targetId}/status`;

            await axios.put(
                endpoint,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            fetchPenalties();
        } catch (err) {
            console.error("Failed to update penalty status:", err);
            alert("Failed to update penalty status. Please try again.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleConfirmCancelPenalty = async () => {
        if (!cancelModalTarget) return;
        setCancelling(true);
        try {
            const token = localStorage.getItem("token");
            const targetId = cancelModalTarget.penaltyId || cancelModalTarget.technicianPenaltyId || cancelModalTarget.agentPenaltyId;
            const endpoint = cancelModalTarget.isAgent
                ? `https://ecocycle.runasp.net/api/CollectionAssignment/agent-penalties/${targetId}/cancel`
                : `https://ecocycle.runasp.net/api/Inspection/technician-penalties/${targetId}/cancel`;

            const res = await axios.post(
                endpoint,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCancelSuccessMsg(res.data?.message || `Fine ${cancelModalTarget.displayRef} cancelled successfully!`);
            fetchPenalties();
            setTimeout(() => {
                setCancelModalTarget(null);
                setCancelSuccessMsg("");
            }, 1600);
        } catch (err) {
            console.error("Failed to cancel penalty:", err);
            alert(err.response?.data?.message || "Failed to cancel penalty. Please try again.");
        } finally {
            setCancelling(false);
        }
    };

    // Filter Logic
    const filteredPenalties = penalties.filter((item) => {
        const statusClean = String(item.status || "").toLowerCase();
        if (activeTab === "Pending" && statusClean !== "pending") return false;
        if (activeTab === "Paid" && (statusClean !== "paid" && statusClean !== "resolved")) return false;
        if (activeTab === "Waived" && (statusClean !== "waived" && statusClean !== "cancelled")) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            String(item.displayRef || item.penaltyId).toLowerCase().includes(q) ||
            String(item.deviceId).includes(q) ||
            (item.userFullName || item.technicianName || "").toLowerCase().includes(q) ||
            (item.userEmail || item.technicianEmail || "").toLowerCase().includes(q) ||
            (item.roleLabel || "").toLowerCase().includes(q) ||
            (item.brand || "").toLowerCase().includes(q) ||
            (item.model || "").toLowerCase().includes(q) ||
            (item.serialNumber || "").toLowerCase().includes(q)
        );
    });

    // KPI Summary Calculations
    const totalCount = penalties.length;
    const pendingCount = penalties.filter((p) => String(p.status).toLowerCase() === "pending").length;
    const paidCount = penalties.filter((p) => String(p.status).toLowerCase() === "paid" || String(p.status).toLowerCase() === "resolved").length;
    const waivedCount = penalties.filter((p) => String(p.status).toLowerCase() === "waived" || String(p.status).toLowerCase() === "cancelled").length;
    const totalPendingAmount = penalties
        .filter((p) => String(p.status).toLowerCase() === "pending")
        .reduce((sum, curr) => sum + (Number(curr.penaltyAmount) || 0), 0);

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });
        } catch {
            return dateStr;
        }
    };

    const getStatusBadge = (statusStr) => {
        const s = String(statusStr || "").toLowerCase();
        const badgeStyle = {
            padding: "0.35rem 0.75rem",
            fontSize: "0.775rem",
            fontWeight: 700,
            borderRadius: "9999px",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            whiteSpace: "nowrap"
        };

        if (s === "pending") {
            return <span style={{ ...badgeStyle, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}><FiClock /> Pending</span>;
        } else if (s === "paid" || s === "resolved") {
            return <span style={{ ...badgeStyle, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}><FiCheckCircle /> Paid</span>;
        } else if (s === "waived" || s === "cancelled") {
            return <span style={{ ...badgeStyle, background: "#f1f5f9", color: "#64748b", border: "1px solid #cbd5e1" }}><FiSlash /> Waived</span>;
        } else {
            return <span style={{ ...badgeStyle, background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" }}>{statusStr}</span>;
        }
    };

    return (
        <div className="admin-inspection-page">
            {/* Sidebar Navigation */}
            <Navbar />

            {/* Main Content Area */}
            <main className="admin-inspection-main">
                {/* Floating Glass Topbar Header matching Manage_inspection.jsx */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <div className="command-brand">
                            <h1>Manage Fines & Penalties</h1>
                        </div>
                        <p className="command-subtitle">
                            Monitor, enforce, waive, and track policy violation fines across all platform users & technicians
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search penalty ID, user, email, device #DEV..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span className="search-shortcut">⌘K</span>
                        </div>

                        <div className="topbar-actions">
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

                {/* Analytics Metric Cards Grid matching Manage_inspection.jsx */}
                <div className="admin-metrics-grid">
                    <div className="admin-metric-card">
                        <div className="admin-metric-icon alert">
                            <FiDollarSign />
                        </div>
                        <div className="admin-metric-info">
                            <h3>₹{totalPendingAmount}</h3>
                            <p>Pending Fine Amount</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon total">
                            <FiClock />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{pendingCount}</h3>
                            <p>Pending Fines</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon done">
                            <FiCheckCircle />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{paidCount}</h3>
                            <p>Paid / Resolved Fines</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon active">
                            <FiShield />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{totalCount}</h3>
                            <p>Total Penalties Issued</p>
                        </div>
                    </div>
                </div>

                {/* Main Operations Panel matching Manage_inspection.jsx */}
                <div className="panel-card">
                    <div className="panel-header">
                        <div>
                            <h2 className="panel-title">System User Penalty & Compliance Queue</h2>
                            <p className="panel-subtitle">Overview of issued fines, enforcement policy reasons, and resolution status</p>
                        </div>

                        <div className="panel-actions" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                            <div className="filter-pill-group">
                                {[
                                    { id: "All", label: "All", count: totalCount },
                                    { id: "Pending", label: "Pending", count: pendingCount },
                                    { id: "Paid", label: "Paid / Resolved", count: paidCount },
                                    { id: "Waived", label: "Waived / Cancelled", count: waivedCount }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        className={`pill-btn ${activeTab === tab.id ? "pill-btn--active" : ""}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        {tab.label} ({tab.count})
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

                    {/* Content Display: Table Mode vs Grid Mode */}
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#64748b" }}>
                            <FiRefreshCw className="spin-icon" style={{ fontSize: "2.5rem", color: "#10b981", marginBottom: "1rem" }} />
                            <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>Loading User Penalties...</h3>
                            <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem" }}>Checking compliance fine records and enforcement notices.</p>
                        </div>
                    ) : filteredPenalties.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#64748b" }}>
                            <FiCheckCircle style={{ fontSize: "3rem", color: "#10b981", marginBottom: "1rem" }} />
                            <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#0f172a" }}>No Penalty Records Found</h3>
                            <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem" }}>All system users are currently compliant within permitted policy guidelines.</p>
                        </div>
                    ) : viewMode === "table" ? (
                        <div className="glass-table-wrapper">
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Penalty ID</th>
                                        <th>User Details</th>
                                        <th>Role</th>
                                        <th>Device Record</th>
                                        <th>Fine Amount</th>
                                        <th className="col-reason">Violation Reason</th>
                                        <th>Status</th>
                                        <th>Issued Date</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPenalties.map((item, idx) => {
                                        const statusLower = String(item.status).toLowerCase();
                                        const isPending = statusLower === "pending";
                                        const itemKey = item.displayRef || `pen-${idx}`;

                                        return (
                                            <tr key={itemKey} className="table-row-hover">
                                                <td>
                                                    <span className="penalty-id-pill">{item.displayRef || `#PEN-${item.penaltyId}`}</span>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                                        <span style={{ fontWeight: 800, color: "#0f172a" }}>{item.userFullName || item.technicianName || "User"}</span>
                                                        <span style={{ fontSize: "0.775rem", color: "#64748b" }}>
                                                            <FiMail style={{ verticalAlign: "middle", marginRight: "3px" }} />
                                                            {item.userEmail || item.technicianEmail || "N/A"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`user-role-badge ${item.isAgent ? 'agent' : 'technician'}`} style={{
                                                        background: item.isAgent ? "#e0e7ff" : "#d1fae5",
                                                        color: item.isAgent ? "#4338ca" : "#065f46",
                                                        border: `1px solid ${item.isAgent ? "#c7d2fe" : "#a7f3d0"}`,
                                                        padding: "0.25rem 0.6rem",
                                                        borderRadius: "6px",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 700
                                                    }}>
                                                        {item.roleLabel || (item.isAgent ? "Collection Agent" : "Technician")}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                                        <span style={{ fontWeight: 800, color: "#0f172a" }}>
                                                            <FiSmartphone style={{ verticalAlign: "middle", marginRight: "4px", color: "#059669" }} />
                                                            #DEV-{String(item.deviceId).padStart(3, "0")}
                                                        </span>
                                                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.brand} {item.model}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="penalty-amount-badge">₹{item.penaltyAmount}</span>
                                                </td>
                                                <td className="col-reason">
                                                    <span style={{ fontSize: "0.8rem", color: "#334155", lineHeight: 1.4, display: "block" }}>
                                                        {item.reason}
                                                    </span>
                                                </td>
                                                <td>{getStatusBadge(item.status)}</td>
                                                <td>
                                                    <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
                                                        {formatDate(item.createdAt)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="table-action-group" style={{ justifyContent: "flex-end", gap: "0.35rem" }}>
                                                        {isPending ? (
                                                            <button
                                                                className="table-btn table-btn--secondary"
                                                                style={{ background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3", padding: "0.35rem 0.75rem" }}
                                                                onClick={() => {
                                                                    setCancelModalTarget(item);
                                                                    setCancelSuccessMsg("");
                                                                }}
                                                                disabled={actionLoadingId === item.displayRef || actionLoadingId === item.penaltyId}
                                                                title="Cancel fine, clear penalty and send notification"
                                                            >
                                                                {actionLoadingId === item.displayRef || actionLoadingId === item.penaltyId ? (
                                                                    <FiRefreshCw className="spin-icon" />
                                                                ) : (
                                                                    <FiSlash />
                                                                )}
                                                                <span>Cancel Fine</span>
                                                            </button>
                                                        ) : (
                                                            <span style={{ fontSize: "0.775rem", color: "#64748b", fontWeight: 700 }}>
                                                                {item.status}
                                                            </span>
                                                        )}
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
                            {filteredPenalties.map((item, idx) => {
                                const statusLower = String(item.status).toLowerCase();
                                const isPending = statusLower === "pending";
                                const itemKey = item.displayRef || `pen-grid-${idx}`;

                                return (
                                    <div key={itemKey} className="admin-pickup-card">
                                        <div>
                                            <div className="admin-card-header">
                                                <div className="admin-card-top-row">
                                                    <div className="admin-cat-icon-box" style={{ background: "#fee2e2", color: "#dc2626" }}>
                                                        <FiAlertTriangle />
                                                    </div>
                                                    {getStatusBadge(item.status)}
                                                </div>
                                                <div className="admin-card-title-group">
                                                    <span className="admin-card-brand-name">{item.brand || "Device"} {item.model || ""}</span>
                                                    <span className="admin-card-sub-info">
                                                        {item.displayRef || `Penalty #PEN-${item.penaltyId}`} • Device #DEV-{String(item.deviceId).padStart(3, "0")}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="admin-card-body-details">
                                                <div className="admin-detail-row">
                                                    <FiUser className="detail-icon" />
                                                    <div>
                                                        <div className="detail-label">User / {item.roleLabel || "Technician"}</div>
                                                        <div className="detail-val" style={{ fontWeight: 800 }}>{item.userFullName || item.technicianName}</div>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.userEmail || item.technicianEmail}</div>
                                                    </div>
                                                </div>

                                                <div className="admin-detail-row">
                                                    <FiDollarSign className="detail-icon" style={{ color: "#dc2626" }} />
                                                    <div>
                                                        <div className="detail-label">Penalty Fine Amount</div>
                                                        <div className="detail-val" style={{ color: "#dc2626", fontWeight: 800, fontSize: "1.1rem" }}>
                                                            ₹{item.penaltyAmount}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="admin-detail-row" style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: "8px", padding: "0.5rem 0.75rem" }}>
                                                    <FiAlertTriangle className="detail-icon" style={{ color: "#e53e3e" }} />
                                                    <div>
                                                        <div className="detail-label" style={{ color: "#c53030" }}>Violation Reason</div>
                                                        <div className="detail-val" style={{ color: "#742a2a", fontSize: "0.8rem", fontWeight: 600 }}>
                                                            {item.reason}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="admin-detail-row">
                                                    <FiClock className="detail-icon" />
                                                    <div>
                                                        <div className="detail-label">Issued Date</div>
                                                        <div className="detail-val">{formatDate(item.createdAt)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="admin-card-actions" style={{ display: "flex", gap: "0.4rem", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #e2e8f0" }}>
                                            {isPending ? (
                                                <button
                                                    className="table-btn table-btn--secondary"
                                                    style={{ flex: 1, justifyContent: "center", background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3", padding: "0.5rem 0.85rem", fontWeight: 700 }}
                                                    onClick={() => {
                                                        setCancelModalTarget(item);
                                                        setCancelSuccessMsg("");
                                                    }}
                                                    disabled={actionLoadingId === item.displayRef || actionLoadingId === item.penaltyId}
                                                    title="Cancel fine, clear penalty and send notification"
                                                >
                                                    {actionLoadingId === item.displayRef || actionLoadingId === item.penaltyId ? (
                                                        <FiRefreshCw className="spin-icon" />
                                                    ) : (
                                                        <FiSlash />
                                                    )}
                                                    <span>Cancel Fine</span>
                                                </button>
                                            ) : (
                                                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, textAlign: "center", display: "block", width: "100%" }}>
                                                    Fine {item.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Reassign Technician Modal */}
            {reassignModalTarget && (
                <div className="admin-modal-backdrop" onClick={() => setReassignModalTarget(null)}>
                    <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div>
                                <h3>Reallocate Inspection Technician</h3>
                                <p>Select a new hardware technician for penalized Device #{reassignModalTarget.deviceId}</p>
                            </div>
                            <button className="admin-modal-close" onClick={() => setReassignModalTarget(null)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="admin-modal-body">
                            <div className="modal-item-summary" style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1.25rem" }}>
                                <div className="modal-item-title" style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>
                                    {reassignModalTarget.brand} {reassignModalTarget.model}
                                </div>
                                <div className="modal-item-meta" style={{ fontSize: "0.825rem", color: "#64748b", marginTop: "0.25rem" }}>
                                    Penalty #PEN-{reassignModalTarget.technicianPenaltyId} • Device #DEV-{String(reassignModalTarget.deviceId).padStart(3, "0")}
                                </div>
                            </div>

                            <div className="form-group-v2" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <label style={{ fontWeight: 700, fontSize: "0.875rem", color: "#334155" }}>Select New Active Technician</label>
                                <select
                                    value={selectedNewTechId}
                                    onChange={(e) => setSelectedNewTechId(e.target.value)}
                                    className="admin-select-v2"
                                    style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem", fontWeight: 600 }}
                                >
                                    <option value="">-- Choose Active Technician --</option>
                                    <option value="auto">⚡ Auto-Select Best Available (Lowest Workload)</option>
                                    {(() => {
                                        const penalizedSet = new Set(
                                            penalties
                                                .filter(p => String(p.status).toLowerCase() === "pending" || String(p.status).toLowerCase() === "unpaid")
                                                .map(p => p.technicianId)
                                        );

                                        return technicians
                                            .filter(t => String(t.status || "").toLowerCase() === "active")
                                            .map(t => {
                                                const isPenalized = penalizedSet.has(t.technicianId);
                                                return (
                                                    <option key={t.technicianId} value={t.technicianId} disabled={isPenalized}>
                                                        {t.firstName} {t.lastName} ({t.specialization || "General Hardware"}) {isPenalized ? "⚠️ (Unpaid Fine - Excluded)" : ""}
                                                    </option>
                                                );
                                            });
                                    })()}
                                </select>
                            </div>
                        </div>

                        <div className="admin-modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                            <button
                                className="table-btn table-btn--secondary"
                                onClick={() => setReassignModalTarget(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="table-btn table-btn--success"
                                disabled={reassigning || !selectedNewTechId}
                                onClick={() => handleReassignTechnician()}
                            >
                                {reassigning ? "Assigning..." : "Confirm Reallocation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Professional Fine Cancellation Modal */}
            {cancelModalTarget && (
                <div className="admin-modal-backdrop" onClick={() => { if (!cancelling) setCancelModalTarget(null); }}>
                    <div className="admin-modal-card penalty-cancel-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px", width: "90%" }}>
                        <div className="admin-modal-header" style={{ borderBottom: "1px solid #fee2e2", paddingBottom: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{ background: "#fef2f2", color: "#dc2626", padding: "0.65rem", borderRadius: "12px", border: "1px solid #fecaca", display: "flex" }}>
                                    <FiSlash style={{ fontSize: "1.4rem" }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: "#0f172a", fontSize: "1.2rem", fontWeight: 700 }}>
                                        Cancel Fine Notice
                                    </h3>
                                    <p style={{ margin: "0.2rem 0 0", color: "#64748b", fontSize: "0.825rem" }}>
                                        Policy Waiver & Account Restoration &bull; Ref #PEN-{cancelModalTarget.technicianPenaltyId}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { if (!cancelling) setCancelModalTarget(null); }}
                                style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}
                            >
                                <FiX />
                            </button>
                        </div>

                        {cancelSuccessMsg ? (
                            <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "12px", padding: "1.25rem", margin: "1.25rem 0", display: "flex", alignItems: "center", gap: "0.75rem", color: "#047857" }}>
                                <FiCheckCircle style={{ fontSize: "1.8rem", color: "#059669", flexShrink: 0 }} />
                                <div>
                                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem" }}>Cancellation Complete!</h4>
                                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.825rem", color: "#065f46" }}>{cancelSuccessMsg}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="admin-modal-body" style={{ marginTop: "1.25rem" }}>
                                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1.25rem" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.85rem" }}>
                                        <div>
                                            <span style={{ color: "#64748b", fontSize: "0.725rem", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>TECHNICIAN / USER</span>
                                            <span style={{ fontWeight: 800, color: "#0f172a" }}>{cancelModalTarget.technicianName}</span>
                                            <div style={{ fontSize: "0.775rem", color: "#64748b" }}>{cancelModalTarget.technicianEmail}</div>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", fontSize: "0.725rem", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>FINE AMOUNT DUE</span>
                                            <span style={{ fontWeight: 800, color: "#dc2626", fontSize: "1.1rem" }}>₹{cancelModalTarget.penaltyAmount || 100}</span>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px dashed #cbd5e1" }}>
                                        <span style={{ color: "#64748b", fontSize: "0.725rem", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>ASSOCIATED DEVICE</span>
                                        <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.875rem" }}>
                                            #{cancelModalTarget.deviceId ? `DEV-${String(cancelModalTarget.deviceId).padStart(3, "0")}` : "N/A"} &bull; {cancelModalTarget.brand} {cancelModalTarget.model}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "10px", padding: "0.85rem 1rem", fontSize: "0.825rem", color: "#9f1239", lineHeight: 1.45, display: "flex", gap: "0.5rem" }}>
                                    <FiAlertTriangle style={{ flexShrink: 0, marginTop: "0.15rem", color: "#e11d48" }} />
                                    <div>
                                        <strong>Waiver Action Notice:</strong> Cancelling this fine will permanently clear penalty #PEN-{cancelModalTarget.technicianPenaltyId}, restore account login access for {cancelModalTarget.technicianName}, and automatically send email + in-app notification notices.
                                    </div>
                                </div>

                                <div className="admin-modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                                    <button
                                        className="table-btn table-btn--secondary"
                                        onClick={() => setCancelModalTarget(null)}
                                        disabled={cancelling}
                                        style={{ padding: "0.6rem 1.2rem", borderRadius: "8px", fontWeight: 700 }}
                                    >
                                        Keep Fine
                                    </button>

                                    <button
                                        className="table-btn"
                                        style={{ background: "#dc2626", color: "#ffffff", border: "none", padding: "0.6rem 1.25rem", borderRadius: "8px", fontWeight: 700, boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)", display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}
                                        disabled={cancelling}
                                        onClick={handleConfirmCancelPenalty}
                                    >
                                        {cancelling ? (
                                            <>
                                                <FiRefreshCw className="spin-icon" /> Cancelling Fine...
                                            </>
                                        ) : (
                                            <>
                                                <FiSlash /> Confirm Cancel Fine
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManagePenalties;
