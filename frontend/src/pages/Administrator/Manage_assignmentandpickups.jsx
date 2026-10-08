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
    FiCheckSquare,
    FiUserCheck,
    FiCpu,
    FiGrid,
    FiList
} from "react-icons/fi";
import "./Manage_assignmentandpickups.css";

function Manage_assignmentandpickups() {
    const [technicianAssignments, setTechnicianAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [viewMode, setViewMode] = useState("table");
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    // Allocation States
    const [allocatingId, setAllocatingId] = useState(null);
    const [manualAllocatingDevice, setManualAllocatingDevice] = useState(null);
    const [activeTechnicians, setActiveTechnicians] = useState([]);
    const [selectedTechId, setSelectedTechId] = useState("");
    const [manualAllocatingLoading, setManualAllocatingLoading] = useState(false);
    const [manualAllocatingMessage, setManualAllocatingMessage] = useState("");
    const [techSearchQuery, setTechSearchQuery] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        fetchAllData();
    }, []);

    const allocateTechnician = async (deviceId) => {
        try {
            setAllocatingId(deviceId);
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `https://ecocycle.runasp.net/api/Inspection/create/${deviceId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            console.log("Allocation response:", response.data);

            const isWaiting = response.data?.status === "Waiting" ||
                !response.data?.technicianId ||
                (response.data?.message && (
                    response.data.message.includes("no suitable") ||
                    response.data.message.includes("waiting") ||
                    response.data.message.includes("No available")
                ));

            const updatedAssignments = await fetchAllData();

            if (isWaiting) {
                const list = (updatedAssignments && updatedAssignments.length > 0) ? updatedAssignments : technicianAssignments;
                const targetAssignment = list.find(a => (a.deviceId || a.DeviceId) === deviceId);
                if (targetAssignment) {
                    setManualAllocatingDevice(targetAssignment);
                    fetchActiveTechnicians();
                    setManualAllocatingMessage("No technician could be automatically allocated. Please select one manually.");
                }
            }
        } catch (err) {
            console.error("Error allocating technician:", err);
            alert(err.response?.data?.message || "Failed to allocate technician.");
        } finally {
            setAllocatingId(null);
        }
    };

    const fetchActiveTechnicians = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("https://ecocycle.runasp.net/api/Technician/All", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const activeOnly = (response.data || []).filter(t => (t.status || t.Status) === "Active");
            setActiveTechnicians(activeOnly.length > 0 ? activeOnly : response.data || []);
        } catch (err) {
            console.error("Error fetching active technicians:", err);
        }
    };

    const allocateTechnicianManually = async (deviceId, techId = null) => {
        try {
            setAllocatingId(deviceId);
            setManualAllocatingLoading(true);
            setManualAllocatingMessage("");
            const token = localStorage.getItem("token");

            const url = techId 
                ? `https://ecocycle.runasp.net/api/Inspection/manual-allocate/${deviceId}/${techId}`
                : `https://ecocycle.runasp.net/api/Inspection/manual-allocate/${deviceId}`;

            const response = await axios.post(
                url,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log("Manual allocation response:", response.data);
            setManualAllocatingMessage(response.data?.message || "Technician allocated successfully.");

            setTimeout(() => {
                setManualAllocatingDevice(null);
                setSelectedTechId("");
                setManualAllocatingMessage("");
                fetchAllData();
            }, 1200);

        } catch (err) {
            console.error("Error manually allocating technician:", err);
            setManualAllocatingMessage(err.response?.data?.message || "Failed to manually allocate technician.");
        } finally {
            setAllocatingId(null);
            setManualAllocatingLoading(false);
        }
    };

    const filteredTechniciansForModal = activeTechnicians.filter(tech => {
        if (!techSearchQuery) return true;
        const q = techSearchQuery.toLowerCase();
        const name = `${tech.firstName || tech.FirstName || ""} ${tech.lastName || tech.LastName || ""}`.toLowerCase();
        const city = (tech.city || tech.City || "").toLowerCase();
        const district = (tech.district || tech.District || "").toLowerCase();
        const state = (tech.state || tech.State || "").toLowerCase();
        const spec = (tech.specialization || tech.Specialization || "").toLowerCase();
        const email = (tech.email || tech.Email || tech.login?.email || "").toLowerCase();
        return name.includes(q) || city.includes(q) || district.includes(q) || state.includes(q) || spec.includes(q) || email.includes(q);
    });

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError("");
            const token = localStorage.getItem("token");

            // Fetch Technician Inspection Assignments
            const techRes = await axios.get(
                "https://ecocycle.runasp.net/api/Inspection/admin/assignments",
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            const data = techRes.data || [];
            setTechnicianAssignments(data);
            return data;
        } catch (err) {
            console.error("Error fetching technician assignments:", err);
            setError("Failed to load technician assignment details.");
            return [];
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

    const isInspectionCompleted = (item) => {
        if (!item) return false;
        const s = (item.status || item.Status || "").toLowerCase().trim();
        const lcs = (item.lifecycleStatus || item.LifecycleStatus || "").toLowerCase().trim();
        return s === "completed" || s === "inspectioncompleted" || lcs === "completed" || lcs === "inspectioncompleted" || lcs === "inspected";
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
            case "expired":
                return (
                    <span className="status-pill" style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }}>
                        <span className="status-beacon" style={{ background: "#b91c1c" }}></span>
                        Expired
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
                                    {["All", "Waiting", "Assigned", "Accepted", "Expired", "Rejected", "Completed"].map((tab) => {
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
                        ) : viewMode === "table" ? (
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

                                            const devId = item.deviceId || item.DeviceId;
                                            const reqId = item.inspectionRequestId || item.InspectionRequestId;

                                            // Check if another assignment for the same device exists that is active or newer
                                            const hasActiveOrNewerAssignment = technicianAssignments.some((other) => {
                                                const sameDevice = (other.deviceId || other.DeviceId) === devId;
                                                const notSelf = (other.inspectionRequestId || other.InspectionRequestId) !== reqId;
                                                const otherReqId = other.inspectionRequestId || other.InspectionRequestId;
                                                const otherStatus = (other.status || other.Status || "").toLowerCase();
                                                const isActive = ["assigned", "accepted", "inprogress", "completed"].includes(otherStatus);
                                                const isNewer = Boolean(otherReqId && reqId && otherReqId > reqId);
                                                return sameDevice && notSelf && (isActive || isNewer);
                                            });

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
                                                                <span>Insp. Deadline: {isInspectionCompleted(item) ? "N/A (Completed)" : formatShortDate(item.inspectionDeadline || item.InspectionDeadline)}</span>
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
                                                        <div className="action-buttons" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                                            <button
                                                                className="action-btn action-btn--view"
                                                                onClick={() => setSelectedAssignment(item)}
                                                                title="View Details"
                                                            >
                                                                <FiEye />
                                                            </button>

                                                            {!hasActiveOrNewerAssignment && (
                                                                (item.status || item.Status || "").toLowerCase() === "waiting" ||
                                                                (!(item.technicianId || item.TechnicianId) && !["completed", "accepted", "rejected", "declined"].includes((item.status || item.Status || "").toLowerCase()))
                                                            ) ? (
                                                                <button
                                                                    className="action-btn action-btn--allocate"
                                                                    style={{ background: "#fffbebf0", color: "#b45309", border: "1px solid #fde68a", padding: "0.4rem 0.75rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}
                                                                    onClick={() => {
                                                                        setManualAllocatingDevice(item);
                                                                        fetchActiveTechnicians();
                                                                    }}
                                                                    disabled={allocatingId === (item.deviceId || item.DeviceId)}
                                                                    title="Manually Allocate Agent / Technician"
                                                                >
                                                                    <FiCpu className={allocatingId === (item.deviceId || item.DeviceId) ? "spin-icon" : ""} />
                                                                    <span>{allocatingId === (item.deviceId || item.DeviceId) ? "Allocating..." : "Allocate Manually"}</span>
                                                                </button>
                                                            ) : !hasActiveOrNewerAssignment && (item.status || item.Status || "").toLowerCase() === "expired" ? (
                                                                <div style={{ display: "flex", gap: "0.4rem" }}>
                                                                    <button
                                                                        className="action-btn action-btn--allocate"
                                                                        onClick={() => allocateTechnician(item.deviceId || item.DeviceId)}
                                                                        disabled={allocatingId === (item.deviceId || item.DeviceId)}
                                                                        title="Auto Allocate Agent / Technician"
                                                                        style={{ background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", padding: "0.4rem 0.75rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}
                                                                    >
                                                                        <FiCpu className={allocatingId === (item.deviceId || item.DeviceId) ? "spin-icon" : ""} />
                                                                        <span>{allocatingId === (item.deviceId || item.DeviceId) ? "Allocating..." : "Auto Allocate"}</span>
                                                                    </button>
                                                                    <button
                                                                        className="action-btn action-btn--allocate"
                                                                        style={{ background: "#fffbebf0", color: "#b45309", border: "1px solid #fde68a", padding: "0.4rem 0.75rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}
                                                                        onClick={() => {
                                                                            setManualAllocatingDevice(item);
                                                                            fetchActiveTechnicians();
                                                                        }}
                                                                        disabled={allocatingId === (item.deviceId || item.DeviceId)}
                                                                        title="Manually Allocate Agent / Technician"
                                                                    >
                                                                        <FiCpu className={allocatingId === (item.deviceId || item.DeviceId) ? "spin-icon" : ""} />
                                                                        <span>Allocate Manually</span>
                                                                    </button>
                                                                </div>
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
                                {filteredTechnician.map((item, index) => {
                                    const lifecycle = getLifecycleInfo(item.lifecycleStatus || item.LifecycleStatus);
                                    const rawStatus = (item.status || item.Status || "").toLowerCase();
                                    const isWaiting = rawStatus === "waiting" || !(item.technicianId || item.TechnicianId);

                                    return (
                                        <div key={item.inspectionRequestId || item.InspectionRequestId || index} className="admin-pickup-card">
                                            <div>
                                                <div className="admin-card-header">
                                                    <div className="admin-card-top-row">
                                                        <div className="admin-cat-icon-box">
                                                            <FiCpu />
                                                        </div>
                                                        {getStatusBadge(item.status || item.Status, item.technicianId || item.TechnicianId)}
                                                    </div>
                                                    <div className="admin-card-title-group">
                                                        <span className="admin-card-brand-name">
                                                            {item.brand || item.Brand} {item.model || item.Model}
                                                        </span>
                                                        <span className="admin-card-sub-info">
                                                            Req #{item.inspectionRequestId || item.InspectionRequestId} &bull; Device #{item.deviceId || item.DeviceId}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="admin-card-body-details">
                                                    <div className="admin-detail-row">
                                                        <FiPackage className="detail-icon" />
                                                        <div>
                                                            <div className="detail-label">Citizen / Owner</div>
                                                            <div className="detail-val">{item.userName || item.UserName || "Citizen"}</div>
                                                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Category: {item.category || item.Category || "E-Waste"}</div>
                                                        </div>
                                                    </div>

                                                    <div className="admin-detail-row">
                                                        <FiUserCheck className="detail-icon" />
                                                        <div>
                                                            <div className="detail-label">Assigned Technician</div>
                                                            <div className="detail-val">{item.technicianName || item.TechnicianName || "Unassigned"}</div>
                                                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.technicianEmail || item.TechnicianEmail || "N/A"}</div>
                                                        </div>
                                                    </div>

                                                    <div className="admin-detail-row">
                                                        <FiClock className="detail-icon" />
                                                        <div>
                                                            <div className="detail-label">Lifecycle Status</div>
                                                            <div style={{ marginTop: "0.25rem" }}>
                                                                <button className={`action-btn action-btn--lifecycle ${lifecycle.className}`} disabled style={{ cursor: "default" }}>
                                                                    {lifecycle.icon}
                                                                    <span>{lifecycle.label}</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="admin-card-actions" style={{ display: "flex", gap: "0.4rem", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed #e2e8f0" }}>
                                                <button
                                                    className="action-btn action-btn--view"
                                                    style={{ flex: 1 }}
                                                    onClick={() => setSelectedAssignment(item)}
                                                >
                                                    <FiEye />
                                                    <span>View</span>
                                                </button>
                                                {isWaiting ? (
                                                    <button
                                                        className="action-btn action-btn--allocate"
                                                        style={{ flex: 1, background: "#fffbebf0", color: "#b45309", border: "1px solid #fde68a" }}
                                                        onClick={() => {
                                                            setManualAllocatingDevice(item);
                                                            fetchActiveTechnicians();
                                                        }}
                                                        disabled={allocatingId === (item.deviceId || item.DeviceId)}
                                                    >
                                                        <FiCpu className={allocatingId === (item.deviceId || item.DeviceId) ? "spin-icon" : ""} />
                                                        <span>Allocate Manually</span>
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
                        <div className="device-modal-card" style={{ maxWidth: "680px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header" style={{ background: "#ffffff", padding: "0 0 1rem 0", borderBottom: "1px solid #f1f5f9", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>
                                        {[selectedAssignment.brand || selectedAssignment.Brand, selectedAssignment.model || selectedAssignment.Model].filter(Boolean).join(" ") || selectedAssignment.category || selectedAssignment.Category || "Device Inspection Request"}
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
                                    <label>PROCESSING LIFECYCLE</label>
                                    <span style={{ color: "#0284c7", fontWeight: 700 }}>
                                        {selectedAssignment.processingLifecycleStatus || selectedAssignment.ProcessingLifecycleStatus || "Pending Center Allocation"}
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
                                    <span>{isInspectionCompleted(selectedAssignment) ? "N/A (Completed)" : formatDate(selectedAssignment.inspectionDeadline || selectedAssignment.InspectionDeadline)}</span>
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

                {/* Manual Technician Allocation Modal */}
                {manualAllocatingDevice && (
                    <div className="modal-overlay" onClick={() => setManualAllocatingDevice(null)}>
                        <div className="device-modal-card" style={{ maxWidth: "640px", width: "92%" }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                        Manually Allocate Technician
                                    </h2>
                                    <p className="panel-subtitle" style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                                        Re-allocate an active technician for expired device inspection #{manualAllocatingDevice.inspectionRequestId || manualAllocatingDevice.InspectionRequestId} (Device #{manualAllocatingDevice.deviceId || manualAllocatingDevice.DeviceId}: {manualAllocatingDevice.brand || manualAllocatingDevice.Brand} {manualAllocatingDevice.model || manualAllocatingDevice.Model})
                                    </p>
                                </div>
                                <button className="modal-close-btn" onClick={() => setManualAllocatingDevice(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div style={{ marginTop: "1rem" }}>
                                {manualAllocatingMessage && (
                                    <div style={{ padding: "0.85rem 1.15rem", borderRadius: "10px", background: manualAllocatingMessage.includes("Failed") ? "#fff1f2" : "#f0fdf4", color: manualAllocatingMessage.includes("Failed") ? "#e11d48" : "#15803d", fontWeight: 600, fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                                        {manualAllocatingMessage}
                                    </div>
                                )}

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (selectedTechId) {
                                            allocateTechnicianManually(manualAllocatingDevice.deviceId || manualAllocatingDevice.DeviceId, selectedTechId);
                                        }
                                    }}
                                    style={{ background: "#f8fafc", padding: "1.15rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                            Select Active Technician
                                        </div>
                                        <span style={{ fontSize: "0.75rem", background: "#e0f2fe", color: "#0369a1", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 700 }}>
                                            {filteredTechniciansForModal.length} Available
                                        </span>
                                    </div>

                                    {/* Technician Search Bar */}
                                    <div style={{ position: "relative", marginBottom: "1rem", width: "100%", boxSizing: "border-box" }}>
                                        <FiSearch style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "1rem", zIndex: 1 }} />
                                        <input
                                            type="text"
                                            placeholder="Search by technician name, city, district, state, specialization..."
                                            value={techSearchQuery}
                                            onChange={(e) => setTechSearchQuery(e.target.value)}
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

                                    {/* Interactive Custom Card List */}
                                    <div style={{ maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem", paddingRight: "0.3rem" }}>
                                        {filteredTechniciansForModal.length === 0 ? (
                                            <div style={{ textAlign: "center", padding: "2rem 1rem", background: "#ffffff", borderRadius: "10px", border: "1px dashed #cbd5e1", color: "#64748b", fontSize: "0.875rem" }}>
                                                No technicians match "{techSearchQuery}".
                                            </div>
                                        ) : (
                                            filteredTechniciansForModal.map(tech => {
                                                const id = String(tech.technicianId || tech.TechnicianId);
                                                const name = `${tech.firstName || tech.FirstName || ""} ${tech.lastName || tech.LastName || ""}`.trim();
                                                const city = tech.city || tech.City || "";
                                                const district = tech.district || tech.District || "";
                                                const state = tech.state || tech.State || "";
                                                const pin = tech.pinCode || tech.PinCode || "";
                                                const locParts = [city, district, state].filter(Boolean);
                                                const locString = locParts.length > 0 ? (pin ? `${locParts.join(", ")} - ${pin}` : locParts.join(", ")) : "Location N/A";
                                                const spec = tech.specialization || tech.Specialization || tech.inspectionCenterName || tech.InspectionCenterName || "";
                                                const isSelected = String(selectedTechId) === id;

                                                return (
                                                    <div
                                                        key={id}
                                                        onClick={() => setSelectedTechId(id)}
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
                                                            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: isSelected ? "#0284c7" : "#e2e8f0", color: isSelected ? "#ffffff" : "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem", flexShrink: 0 }}>
                                                                {name.charAt(0).toUpperCase() || "T"}
                                                            </div>
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                                                    <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.925rem" }}>{name}</span>
                                                                    {spec && (
                                                                        <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "0.15rem 0.55rem", borderRadius: "6px", fontSize: "0.725rem", fontWeight: 700 }}>
                                                                            {spec}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#64748b", fontSize: "0.8rem" }}>
                                                                    <FiMapPin style={{ color: "#0284c7", flexShrink: 0 }} />
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
                                        disabled={manualAllocatingLoading || !selectedTechId}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "10px",
                                            background: selectedTechId ? "#0284c7" : "#cbd5e1",
                                            color: "#ffffff",
                                            border: "none",
                                            fontWeight: 700,
                                            fontSize: "0.9rem",
                                            cursor: selectedTechId ? "pointer" : "not-allowed",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "0.5rem",
                                            boxShadow: selectedTechId ? "0 4px 12px rgba(2,132,199,0.2)" : "none",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        <FiCpu /> Assign Selected Technician
                                    </button>
                                </form>
                            </div>

                            <div className="modal-footer-actions" style={{ marginTop: "1rem" }}>
                                <button
                                    type="button"
                                    className="action-btn--cancel"
                                    onClick={() => setManualAllocatingDevice(null)}
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

export default Manage_assignmentandpickups;