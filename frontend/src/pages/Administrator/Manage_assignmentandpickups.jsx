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
    FiUser,
    FiClock,
    FiCalendar,
    FiPackage,
    FiMapPin,
    FiRefreshCw,
    FiCheckCircle,
    FiAlertTriangle,
    FiUserCheck,
    FiUserX,
    FiRotateCcw,
    FiTag,
    FiAlertCircle
} from "react-icons/fi";
import "./Manage_assignmentandpickups.css";

function Manage_assignmentandpickups() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAllAssignments();
    }, []);

    const fetchAllAssignments = async () => {
        try {
            setLoading(true);
            setError("");
            const token = localStorage.getItem("token");
            const response = await axios.get(
                "https://localhost:7102/api/Inspection/admin/assignments",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setAssignments(response.data || []);
        } catch (err) {
            setError("Failed to load assignment and pickup details.");
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

    const getStatusBadge = (status) => {
        const s = (status || "").toLowerCase().trim();
        switch (s) {
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
                    <span className="status-pill status-pill--completed">
                        <span className="status-beacon"></span>
                        Accepted
                    </span>
                );
            case "rejected":
                return (
                    <span className="status-pill status-pill--rejected">
                        <span className="status-beacon"></span>
                        Rejected
                    </span>
                );
            case "completed":
                return (
                    <span className="status-pill status-pill--completed">
                        <span className="status-beacon"></span>
                        Completed
                    </span>
                );
            default:
                return <span className="status-pill">{status || "Pending"}</span>;
        }
    };

    const getLifecycleInfo = (status) => {
        if (!status) return { label: "Pending", className: "status-btn--pending", icon: <FiClock /> };
        const raw = status.trim();
        const lower = raw.toLowerCase();

        switch (lower) {
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

    const filteredAssignments = assignments.filter((item) => {
        const brand = item.brand || item.Brand || "";
        const model = item.model || item.Model || "";
        const category = item.category || item.Category || "";
        const userName = item.userName || item.UserName || "";
        const technicianName = item.technicianName || item.TechnicianName || "";
        const technicianEmail = item.technicianEmail || item.TechnicianEmail || "";
        const status = item.status || item.Status || "";
        const lifecycleStatus = item.lifecycleStatus || item.LifecycleStatus || "";
        const rejectionReason = item.rejectionReason || item.RejectionReason || "";

        const query = searchQuery.toLowerCase();
        const matchesSearch =
            brand.toLowerCase().includes(query) ||
            model.toLowerCase().includes(query) ||
            category.toLowerCase().includes(query) ||
            userName.toLowerCase().includes(query) ||
            technicianName.toLowerCase().includes(query) ||
            technicianEmail.toLowerCase().includes(query) ||
            status.toLowerCase().includes(query) ||
            lifecycleStatus.toLowerCase().includes(query) ||
            rejectionReason.toLowerCase().includes(query);

        const matchesStatus =
            activeFilter === "All" ||
            status.toLowerCase() === activeFilter.toLowerCase();

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
                            <h1>Manage Assignments & Pickups</h1>
                        </div>
                        <p className="command-subtitle">
                            Track technician inspection requests, deadlines, responses, and device pickup status
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search assignments, technicians, devices..."
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

                            <Link to="/logout" className="logout-btn-v2" title="Logout">
                                <FiLogOut />
                                <span>Exit</span>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <section className="content-section">
                    <div className="panel-card table-panel">
                        <div className="panel-header">
                            <div>
                                <h3 className="panel-title">Inspection Assignments</h3>
                                <p className="panel-subtitle">
                                    View and manage assigned device inspection requests and pickup schedules
                                </p>
                            </div>
                            <div className="panel-actions">
                                <div className="filter-pill-group">
                                    {["All", "Assigned", "Accepted", "Rejected", "Completed"].map((tab) => (
                                        <button
                                            key={tab}
                                            className={`pill-btn ${activeFilter === tab ? "pill-btn--active" : ""}`}
                                            onClick={() => setActiveFilter(tab)}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="loading-state">
                                <div className="loading-spinner"></div>
                                <p>Loading assignment and pickup details...</p>
                            </div>
                        ) : error ? (
                            <div className="error-state">
                                <p>{error}</p>
                            </div>
                        ) : filteredAssignments.length === 0 ? (
                            <div className="no-data-state">
                                <FiFilter className="no-data-icon" />
                                <p>No inspection assignments matching your criteria.</p>
                            </div>
                        ) : (
                            <div className="glass-table-wrapper">
                                <table className="glass-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Device Details</th>
                                            <th>Citizen / Owner</th>
                                            <th>Technician</th>
                                            <th>Deadlines</th>
                                            <th>Reassignments</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAssignments.map((item, index) => {
                                            const lifecycle = getLifecycleInfo(item.lifecycleStatus || item.LifecycleStatus);
                                            const rejection = item.rejectionReason || item.RejectionReason;

                                            return (
                                                <tr key={item.inspectionRequestId || item.InspectionRequestId || index} className="table-row-hover">
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
                                                            </div>
                                                        ) : (
                                                            <span className="badge-tag" style={{ background: "#fef3c7", color: "#92400e" }}>
                                                                Unassigned
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="contact-cell">
                                                        <div className="deadline-cell-group">
                                                            <div className="deadline-item">
                                                                <FiClock style={{ color: "var(--primary-dark)" }} />
                                                                <span><strong>Assigned:</strong> {formatDate(item.assignedAt || item.AssignedAt)}</span>
                                                            </div>
                                                            <div className="deadline-item-sub">
                                                                <strong>Resp. Deadline:</strong> {formatDate(item.responseDeadline || item.ResponseDeadline)}
                                                            </div>
                                                            <div className="deadline-item-sub">
                                                                <strong>Insp. Deadline:</strong> {formatDate(item.inspectionDeadline || item.InspectionDeadline)}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                                            <span className="badge-tag badge-tag--reassign">
                                                                Count: {item.reassignmentCount ?? item.ReassignmentCount ?? 0}
                                                            </span>
                                                            {rejection && (
                                                                <div className="rejection-note-cell" title={rejection}>
                                                                    <FiAlertTriangle /> Rejection Note
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                                            {getStatusBadge(item.status || item.Status)}
                                                            <button
                                                                className={`action-btn action-btn--lifecycle ${lifecycle.className}`}
                                                                disabled
                                                                style={{ height: "26px", fontSize: "0.7rem", padding: "0 0.5rem" }}
                                                                title={`Lifecycle: ${lifecycle.label}`}
                                                            >
                                                                {lifecycle.icon}
                                                                <span>{lifecycle.label}</span>
                                                            </button>
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

                {/* Assignment Details Modal */}
                {selectedAssignment && (
                    <div className="modal-overlay" onClick={() => setSelectedAssignment(null)}>
                        <div className="device-modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h2>
                                        {selectedAssignment.brand || selectedAssignment.Brand}{" "}
                                        {selectedAssignment.model || selectedAssignment.Model}
                                    </h2>
                                    <p className="panel-subtitle">
                                        Inspection Request ID: #{selectedAssignment.inspectionRequestId || selectedAssignment.InspectionRequestId} | Device ID: #{selectedAssignment.deviceId || selectedAssignment.DeviceId}
                                    </p>
                                </div>
                                <button className="modal-close-btn" onClick={() => setSelectedAssignment(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="device-details-grid">
                                <div className="detail-item">
                                    <label>Category</label>
                                    <span>{selectedAssignment.category || selectedAssignment.Category || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Citizen / Owner</label>
                                    <span>{selectedAssignment.userName || selectedAssignment.UserName || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Assigned Technician</label>
                                    <span>{selectedAssignment.technicianName || selectedAssignment.TechnicianName || "Unassigned"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Technician Email</label>
                                    <span>{selectedAssignment.technicianEmail || selectedAssignment.TechnicianEmail || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Technician ID</label>
                                    <span>
                                        {selectedAssignment.technicianId || selectedAssignment.TechnicianId
                                            ? `#${selectedAssignment.technicianId || selectedAssignment.TechnicianId}`
                                            : "N/A"}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <label>Assignment Status</label>
                                    <span>{selectedAssignment.status || selectedAssignment.Status || "Pending"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Lifecycle Status</label>
                                    <span>
                                        {getLifecycleInfo(selectedAssignment.lifecycleStatus || selectedAssignment.LifecycleStatus).label}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <label>Reassignment Count</label>
                                    <span>{selectedAssignment.reassignmentCount ?? selectedAssignment.ReassignmentCount ?? 0}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Assigned At</label>
                                    <span>{formatDate(selectedAssignment.assignedAt || selectedAssignment.AssignedAt)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Response Deadline</label>
                                    <span>{formatDate(selectedAssignment.responseDeadline || selectedAssignment.ResponseDeadline)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Inspection Deadline</label>
                                    <span>{formatDate(selectedAssignment.inspectionDeadline || selectedAssignment.InspectionDeadline)}</span>
                                </div>
                            </div>

                            {(selectedAssignment.rejectionReason || selectedAssignment.RejectionReason) && (
                                <div className="assignment-rejection-box">
                                    <FiAlertTriangle />
                                    <div>
                                        <div className="assignment-rejection-title">Rejection Reason</div>
                                        <p className="assignment-rejection-text">
                                            {selectedAssignment.rejectionReason || selectedAssignment.RejectionReason}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="modal-footer-actions">
                                <button
                                    className="action-btn action-btn--view"
                                    style={{ width: "auto", padding: "0 1.25rem", height: "40px", borderRadius: "10px", fontWeight: "700" }}
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