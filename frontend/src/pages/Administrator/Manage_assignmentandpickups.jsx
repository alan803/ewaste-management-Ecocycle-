import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import {
    FiSearch,
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
    FiCheckSquare,
    FiUserCheck
} from "react-icons/fi";
import "./Manage_assignmentandpickups.css";

function Manage_assignmentandpickups() {
    const [technicianAssignments, setTechnicianAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError("");
            const token = localStorage.getItem("token");

            // Fetch Technician Inspection Assignments
            const techRes = await axios.get(
                "https://localhost:7102/api/Inspection/admin/assignments",
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setTechnicianAssignments(techRes.data || []);
        } catch (err) {
            console.error("Error fetching technician assignments:", err);
            setError("Failed to load technician assignment details.");
        } finally {
            setLoading(false);
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
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "N/A";
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
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
            case "completed":
                return (
                    <span className="status-pill status-pill--completed">
                        <span className="status-beacon"></span>
                        Completed
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

    const getLifecycleInfo = (status) => {
        const raw = status || "Pending";
        const normalized = raw.toLowerCase().trim();

        switch (normalized) {
            case "pending":
                return { label: "Pending", className: "status-btn--pending", icon: <FiClock /> };
            case "pickupscheduled":
            case "inspectionassigned":
            case "inspectionaccepted":
                return { label: "Pickup Scheduled", className: "status-btn--scheduled", icon: <FiCalendar /> };
            case "pickedup":
                return { label: "Picked Up", className: "status-btn--pickedup", icon: <FiPackage /> };
            case "atinspectioncenter":
                return { label: "At Inspection Center", className: "status-btn--atcenter", icon: <FiMapPin /> };
            case "inspectioninprogress":
                return { label: "Inspection In Progress", className: "status-btn--in-progress", icon: <FiRefreshCw className="spin-icon" /> };
            case "inspectioncompleted":
                return { label: "Inspection Completed", className: "status-btn--completed", icon: <FiCheckCircle /> };
            case "completed":
                return { label: "Completed", className: "status-btn--completed", icon: <FiCheckCircle /> };
            default:
                return {
                    label: raw.replace(/([A-Z])/g, ' $1').trim(),
                    className: "status-btn--default",
                    icon: <FiCheckCircle />
                };
        }
    };

    // Filter technician assignments
    const filteredTechnician = technicianAssignments.filter((item) => {
        const query = searchQuery.toLowerCase();
        const brand = item.brand || item.Brand || "";
        const model = item.model || item.Model || "";
        const category = item.category || item.Category || "";
        const userName = item.userName || item.UserName || "";
        const technicianName = item.technicianName || item.TechnicianName || "";
        const technicianEmail = item.technicianEmail || item.TechnicianEmail || "";
        const status = item.status || item.Status || "";
        const rejectionReason = item.rejectionReason || item.RejectionReason || "";

        const matchesSearch =
            brand.toLowerCase().includes(query) ||
            model.toLowerCase().includes(query) ||
            category.toLowerCase().includes(query) ||
            userName.toLowerCase().includes(query) ||
            technicianName.toLowerCase().includes(query) ||
            technicianEmail.toLowerCase().includes(query) ||
            status.toLowerCase().includes(query) ||
            rejectionReason.toLowerCase().includes(query);

        const statusLower = status.toLowerCase();
        const techId = item.technicianId || item.TechnicianId;
        const matchesStatus =
            activeFilter === "All" ||
            (activeFilter === "Waiting" && (statusLower === "waiting" || (!techId && statusLower !== "rejected" && statusLower !== "declined"))) ||
            statusLower === activeFilter.toLowerCase() ||
            (activeFilter === "Rejected" && (statusLower === "rejected" || statusLower === "declined"));

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
                            <span className="command-badge">
                                <span className="live-dot"></span> SYSTEM ONLINE
                            </span>
                            <h1>Technician Assignments & Inspections</h1>
                        </div>
                        <p className="command-subtitle">
                            Track assigned device inspection requests, technician response deadlines, inspection reports, and device lifecycle progress
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search technician, device, owner or status..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span className="search-shortcut">⌘K</span>
                        </div>

                        <div className="topbar-actions">
                            <button className="glass-btn notification-btn" title="Refresh Data" onClick={fetchAllData}>
                                <FiRefreshCw className={loading ? "spin-icon" : ""} />
                                <span className="pulse-ping"></span>
                            </button>

                            <div className="user-profile-chip">
                                <div className="avatar-gradient">A</div>
                                <div className="user-info-text">
                                    <span className="name">Admin User</span>
                                    <span className="role">Super Admin</span>
                                </div>
                            </div>

                            <Link to="/logout" className="logout-btn-v2" title="Logout">
                                <FiLogOut />
                                <span>Exit</span>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Content Section */}
                <section className="content-section">
                    <div className="panel-card table-panel">
                        <div className="panel-header">
                            <div>
                                <h3 className="panel-title">Technician Inspection Allocations</h3>
                                <p className="panel-subtitle">
                                    View and monitor device inspection dispatches, assigned technicians, response deadlines, and inspection progress
                                </p>
                            </div>
                            <div className="panel-actions">
                                <div className="filter-pill-group">
                                    {["All", "Waiting", "Assigned", "Accepted", "Rejected", "Completed"].map((tab) => {
                                        const count = tab === "All"
                                            ? technicianAssignments.length
                                            : technicianAssignments.filter(t => {
                                                const s = (t.status || t.Status || "").toLowerCase();
                                                const techId = t.technicianId || t.TechnicianId;
                                                if (tab === "Waiting") {
                                                    return s === "waiting" || (!techId && s !== "rejected" && s !== "declined");
                                                }
                                                return tab === "Rejected" ? (s === "rejected" || s === "declined") : s === tab.toLowerCase();
                                            }).length;

                                        return (
                                            <button
                                                key={tab}
                                                className={`pill-btn ${activeFilter === tab ? "pill-btn--active" : ""}`}
                                                onClick={() => setActiveFilter(tab)}
                                            >
                                                {tab} ({count})
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="loading-state">
                                <div className="loading-spinner"></div>
                                <p>Loading inspection assignments...</p>
                            </div>
                        ) : error ? (
                            <div className="error-state">
                                <p>{error}</p>
                            </div>
                        ) : filteredTechnician.length === 0 ? (
                            <div className="no-data-state">
                                <FiFilter className="no-data-icon" />
                                <p>No technician inspection assignments matching "{activeFilter}".</p>
                            </div>
                        ) : (
                            <div className="glass-table-wrapper">
                                <table className="glass-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Device Details</th>
                                            <th>Citizen / Owner</th>
                                            <th>Technician &amp; Reassignments</th>
                                            <th>Deadlines</th>
                                            <th>Status &amp; Rejection</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTechnician.map((item, index) => {
                                            const lifecycle = getLifecycleInfo(item.lifecycleStatus || item.LifecycleStatus);
                                            const rejection = item.rejectionReason || item.RejectionReason;
                                            const isRejected = (item.status || item.Status || "").toLowerCase() === "rejected" || (item.status || item.Status || "").toLowerCase() === "declined";
                                            const reassignCount = item.reassignmentCount ?? item.ReassignmentCount ?? 0;

                                            return (
                                                <tr
                                                    key={item.inspectionRequestId || item.InspectionRequestId || index}
                                                    className="table-row-hover"
                                                    style={{ background: isRejected ? "rgba(254, 226, 226, 0.3)" : "inherit" }}
                                                >
                                                    <td style={{ fontWeight: "700", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                                                        {index + 1}
                                                    </td>
                                                    <td>
                                                        <div className="user-info">
                                                            <span className="user-name">
                                                                {item.brand || item.Brand} {item.model || item.Model}
                                                            </span>
                                                            <span className="user-email">
                                                                Cat: {item.category || item.Category || "N/A"} | Req #{item.inspectionRequestId || item.InspectionRequestId}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="contact-cell">
                                                        <div className="user-info">
                                                            <span className="user-name">{item.userName || item.UserName || "N/A"}</span>
                                                            <span className="user-email">Device #{item.deviceId || item.DeviceId}</span>
                                                        </div>
                                                    </td>
                                                    <td className="contact-cell">
                                                        {item.technicianName || item.TechnicianName ? (
                                                            <div className="user-info">
                                                                <span className="user-name">{item.technicianName || item.TechnicianName}</span>
                                                                <span className="user-email">{item.technicianEmail || item.TechnicianEmail || `ID: #${item.technicianId || item.TechnicianId}`}</span>
                                                                {reassignCount > 0 && (
                                                                    <span className="reassign-count-badge">
                                                                        Reassigned {reassignCount}x
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="user-info">
                                                                <span className="user-name">Unassigned</span>
                                                                <span className="user-email">Ph: N/A</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="contact-cell">
                                                        <div className="deadline-cell-group">
                                                            <div className="deadline-item">
                                                                <FiClock style={{ color: "var(--primary-dark)", flexShrink: 0 }} />
                                                                <span><strong>Assigned:</strong> {formatShortDate(item.assignedAt || item.AssignedAt)}</span>
                                                            </div>
                                                            <div className="deadline-item-sub">
                                                                <span>Resp. Deadline: {formatShortDate(item.responseDeadline || item.ResponseDeadline)}</span>
                                                            </div>
                                                            <div className="deadline-item-sub">
                                                                <span>Insp. Deadline: {formatShortDate(item.inspectionDeadline || item.InspectionDeadline)}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                                            {getStatusBadge(item.status || item.Status)}
                                                            {rejection ? (
                                                                <div className="rejection-note-card" title={rejection}>
                                                                    <FiAlertTriangle style={{ color: "#e11d48", flexShrink: 0, marginTop: "0.1rem" }} />
                                                                    <span><strong>Reason:</strong> {rejection}</span>
                                                                </div>
                                                            ) : (
                                                                <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                                                                    Lifecycle: {lifecycle.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                className="action-btn action-btn--view"
                                                                onClick={() => setSelectedAssignment(item)}
                                                                title="View Details"
                                                            >
                                                                <FiEye />
                                                            </button>
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

                {/* Details View Modal */}
                {selectedAssignment && (
                    <div className="modal-overlay" onClick={() => setSelectedAssignment(null)}>
                        <div className="device-modal-card" style={{ maxWidth: "680px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                        {selectedAssignment.brand || selectedAssignment.Brand}{" "}
                                        {selectedAssignment.model || selectedAssignment.Model}
                                    </h2>
                                    <p className="panel-subtitle" style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                                        Inspection Request ID: #{selectedAssignment.inspectionRequestId || selectedAssignment.InspectionRequestId} | Device ID: #{selectedAssignment.deviceId || selectedAssignment.DeviceId}
                                    </p>
                                </div>
                                <button className="modal-close-btn" onClick={() => setSelectedAssignment(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="device-details-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                                <div className="detail-item">
                                    <label>CATEGORY</label>
                                    <span>{selectedAssignment.category || selectedAssignment.Category || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>CITIZEN / OWNER</label>
                                    <span>{selectedAssignment.userName || selectedAssignment.UserName || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>ASSIGNED TECHNICIAN</label>
                                    <span>{selectedAssignment.technicianName || selectedAssignment.TechnicianName || "Unassigned"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>TECHNICIAN EMAIL</label>
                                    <span>{selectedAssignment.technicianEmail || selectedAssignment.TechnicianEmail || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>TECHNICIAN ID</label>
                                    <span>
                                        {selectedAssignment.technicianId || selectedAssignment.TechnicianId
                                            ? `#${selectedAssignment.technicianId || selectedAssignment.TechnicianId}`
                                            : "N/A"}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <label>ASSIGNMENT STATUS</label>
                                    <span>{selectedAssignment.status || selectedAssignment.Status || "Pending"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>LIFECYCLE STATUS</label>
                                    <span>
                                        {getLifecycleInfo(selectedAssignment.lifecycleStatus || selectedAssignment.LifecycleStatus).label}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <label>REASSIGNMENT COUNT</label>
                                    <span>{selectedAssignment.reassignmentCount ?? selectedAssignment.ReassignmentCount ?? 0}</span>
                                </div>
                                <div className="detail-item">
                                    <label>ASSIGNED AT</label>
                                    <span>{formatDate(selectedAssignment.assignedAt || selectedAssignment.AssignedAt)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>RESPONSE DEADLINE</label>
                                    <span>{formatDate(selectedAssignment.responseDeadline || selectedAssignment.ResponseDeadline)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>INSPECTION DEADLINE</label>
                                    <span>{formatDate(selectedAssignment.inspectionDeadline || selectedAssignment.InspectionDeadline)}</span>
                                </div>
                            </div>

                            {(selectedAssignment.rejectionReason || selectedAssignment.RejectionReason) && (
                                <div className="assignment-rejection-box" style={{ background: "#fff1f2", border: "1px solid #fecdd3", padding: "1rem", borderRadius: "12px", marginTop: "1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                                    <FiAlertTriangle style={{ color: "#e11d48", fontSize: "1.3rem", marginTop: "0.1rem", flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#e11d48", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            REJECTION REASON (TECHNICIAN)
                                        </div>
                                        <p style={{ fontSize: "0.9rem", color: "#9f1239", margin: "0.25rem 0 0 0", fontWeight: 600 }}>
                                            "{selectedAssignment.rejectionReason || selectedAssignment.RejectionReason}"
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
            </div>
        </div>
    );
}

export default Manage_assignmentandpickups;