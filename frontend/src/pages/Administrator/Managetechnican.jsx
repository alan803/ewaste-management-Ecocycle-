import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import {
    FiSearch,
    FiBell,
    FiLogOut,
    FiEye,
    FiX,
    FiCheck,
    FiFilter,
    FiUserCheck,
    FiUserX,
    FiShield,
    FiAlertTriangle,
    FiRefreshCw,
    FiUser,
    FiMapPin,
    FiFileText,
    FiTool,
    FiBriefcase,
    FiAward,
    FiCalendar,
    FiCheckCircle,
    FiGrid,
    FiList,
    FiExternalLink,
    FiImage
} from "react-icons/fi";
import "./Manage_users.css";

function Managetechnician() {
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

    // Deactivate Modal state & live validation
    const [showDeactivate, setShowDeactivate] = useState(false);
    const [selectedTech, setSelectedTech] = useState(null);
    const [reason, setReason] = useState("");
    const [reasonError, setReasonError] = useState("");
    const [reasonTouched, setReasonTouched] = useState(false);
    const [deactivating, setDeactivating] = useState(false);

    // View Profile Detail Modal state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [viewTech, setViewTech] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const [fetchError, setFetchError] = useState("");

    useEffect(() => {
        fetchTechnicians();
    }, []);

    const fetchTechnicians = async () => {
        setLoading(true);
        setFetchError("");
        try {
            let response;
            try {
                response = await axios.get(
                    "https://ecocycle.runasp.net/api/Technician/All"
                );
            } catch {
                response = await axios.get(
                    "https://ecocycle.runasp.net/api/Technician/alluser"
                );
            }
            setTechnicians(response.data || []);
        } catch (error) {
            console.error("Error fetching technicians:", error.response?.data || error.message);
            setFetchError(error.response?.data?.message || "Failed to load technician accounts.");
        } finally {
            setLoading(false);
        }
    };

    // Live validation logic for deactivation reason
    const validateReason = (val) => {
        const trimmed = val.trim();
        if (!trimmed) {
            return "Reason for deactivation is required.";
        }
        if (trimmed.length < 5) {
            return "Please provide a more detailed reason (at least 5 characters).";
        }
        if (trimmed.length > 300) {
            return "Reason cannot exceed 300 characters.";
        }
        return "";
    };

    const handleReasonChange = (e) => {
        const val = e.target.value;
        setReason(val);
        setReasonTouched(true);
        setReasonError(validateReason(val));
    };

    const openDeactivateModal = (tech) => {
        setSelectedTech(tech);
        setReason("");
        setReasonError("");
        setReasonTouched(false);
        setShowDeactivate(true);
    };

    const openDetailModal = async (tech) => {
        const techId = tech.technicianId || tech.id;
        setViewTech(tech);
        setShowDetailModal(true);
        try {
            const response = await axios.get(
                `https://ecocycle.runasp.net/api/Technician/${techId}`
            );
            if (response.data) {
                setViewTech(response.data);
            }
        } catch (err) {
            console.error("Error fetching technician full details:", err);
        }
    };

    const deactivateTechnician = async () => {
        const err = validateReason(reason);
        setReasonTouched(true);
        setReasonError(err);

        if (err) {
            return;
        }

        setDeactivating(true);
        try {
            await axios.post(
                `https://ecocycle.runasp.net/api/Technician/deactivate/${selectedTech.technicianId}`,
                null,
                {
                    params: {
                        reason: reason.trim()
                    }
                }
            );

            setShowDeactivate(false);
            setSelectedTech(null);
            setReason("");
            setReasonError("");
            setReasonTouched(false);
            fetchTechnicians();
        } catch (error) {
            console.error("Error deactivating technician:", error);
        } finally {
            setDeactivating(false);
        }
    };

    const activateTechnician = async (id) => {
        try {
            await axios.post(
                `https://ecocycle.runasp.net/api/Technician/activate/${id}`
            );
            fetchTechnicians();
        } catch (error) {
            console.error("Error activating technician:", error);
        }
    };

    const acceptTechnician = async (id) => {
        setActionLoadingId(id);
        try {
            await axios.post(
                `https://ecocycle.runasp.net/api/Technician/Accept/${id}`
            );
            setTechnicians(prev =>
                prev.map(tech =>
                    (tech.technicianId || tech.id) === id
                        ? { ...tech, status: "Active" }
                        : tech
                )
            );
            if (viewTech && (viewTech.technicianId || viewTech.id) === id) {
                setViewTech(prev => ({ ...prev, status: "Active" }));
            }
            fetchTechnicians();
        } catch (error) {
            console.error("Error accepting technician:", error);
            alert(error.response?.data?.message || "Failed to accept technician.");
        } finally {
            setActionLoadingId(null);
        }
    };

    // Live Rejection Modal state & validation
    const [rejectModalTech, setRejectModalTech] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectReasonError, setRejectReasonError] = useState("");
    const [rejectReasonTouched, setRejectReasonTouched] = useState(false);
    const [rejecting, setRejecting] = useState(false);

    const validateRejectionReason = (value) => {
        const trimmed = value.trim();
        if (!trimmed) {
            return "Reason for rejection is required.";
        }
        if (trimmed.length < 10) {
            return "Reason for rejection must be at least 10 characters long.";
        }
        if (!/^[a-zA-Z0-9\s]+$/.test(trimmed)) {
            return "Special characters are not allowed in the rejection reason.";
        }
        return "";
    };

    const handleRejectReasonChange = (e) => {
        const val = e.target.value;
        setRejectReason(val);
        setRejectReasonTouched(true);
        setRejectReasonError(validateRejectionReason(val));
    };

    const openRejectModal = (tech) => {
        setRejectModalTech(tech);
        setRejectReason("");
        setRejectReasonError("");
        setRejectReasonTouched(false);
    };

    const confirmRejectTechnician = async () => {
        const err = validateRejectionReason(rejectReason);
        setRejectReasonTouched(true);
        setRejectReasonError(err);
        if (err || !rejectModalTech) return;

        setRejecting(true);
        const techId = rejectModalTech.technicianId || rejectModalTech.id;
        try {
            await axios.post(
                `https://ecocycle.runasp.net/api/Technician/Reject/${techId}`,
                null,
                { params: { reason: rejectReason.trim() } }
            );
            setRejectModalTech(null);
            setRejectReason("");
            fetchTechnicians();
        } catch (error) {
            console.error("Error rejecting technician:", error);
            alert(error.response?.data?.message || "Failed to reject technician.");
        } finally {
            setRejecting(false);
        }
    };

    // Statistics across all technicians
    const totalTechCount = technicians.length;
    const pendingTechCount = technicians.filter(
        t => (t.status || "").toLowerCase() === "pending"
    ).length;
    const activeTechCount = technicians.filter(
        t => t.status === "Active" || t.status === "Approved"
    ).length;
    const inactiveTechCount = technicians.filter(
        t => t.status === "Inactive" || t.status === "Rejected"
    ).length;

    // Filter technicians
    const filteredTechnicians = technicians.filter((tech) => {
        const fullName = `${tech.firstName || ""} ${tech.lastName || ""}`.trim();

        const matchesSearch =
            fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tech.login?.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (tech.phoneNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (tech.inspectionCenterName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (tech.jobTitle?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (tech.specialization?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (tech.city?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (tech.state?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (tech.employeeId?.toLowerCase() || "").includes(searchQuery.toLowerCase());

        const statusLower = (tech.status || "").toLowerCase();
        const matchesStatus =
            activeFilter === "All" ||
            (activeFilter === "Pending" && statusLower === "pending") ||
            (activeFilter === "Active" && (statusLower === "active" || statusLower === "approved")) ||
            (activeFilter === "Inactive" && (statusLower === "inactive" || statusLower === "rejected"));

        return matchesSearch && matchesStatus;
    });

    const getPhotoSrc = (tech) => {
        if (!tech?.profilePhoto) return null;
        if (tech.profilePhoto.startsWith("http")) return tech.profilePhoto;
        return `https://ecocycle.runasp.net/uploads/technicians/ProfilePhotos/${tech.profilePhoto}`;
    };

    const getGovernmentIdPath = (tech) => {
        if (!tech?.governmentIdFile) return null;
        if (tech.governmentIdFile.startsWith("http")) return tech.governmentIdFile;
        let folder = "GovernmentIds";
        if (tech.governmentIdType === "Aadhaar") folder = "GovernmentIds/Aadhaar";
        else if (tech.governmentIdType === "PAN") folder = "GovernmentIds/PAN";
        else if (tech.governmentIdType === "Driving Licence") folder = "GovernmentIds/DrivingLicence";
        else if (tech.governmentIdType === "Passport") folder = "GovernmentIds/Passport";
        return `https://ecocycle.runasp.net/uploads/technicians/${folder}/${tech.governmentIdFile}`;
    };

    const getEmployeeIdCardPath = (tech) => {
        if (!tech?.employeeIdCard) return null;
        if (tech.employeeIdCard.startsWith("http")) return tech.employeeIdCard;
        return `https://ecocycle.runasp.net/uploads/technicians/EmployeeIdCards/${tech.employeeIdCard}`;
    };

    const getTechnicalCertificatePath = (tech) => {
        if (!tech?.technicalCertificate) return null;
        if (tech.technicalCertificate.startsWith("http")) return tech.technicalCertificate;
        return `https://ecocycle.runasp.net/uploads/technicians/TechnicalCertificates/${tech.technicalCertificate}`;
    };

    const getResumePath = (tech) => {
        if (!tech?.resume) return null;
        if (tech.resume.startsWith("http")) return tech.resume;
        return `https://ecocycle.runasp.net/uploads/technicians/Resumes/${tech.resume}`;
    };

    const getInitials = (firstName, lastName) => {
        const fn = firstName ? firstName.trim().charAt(0) : "";
        const ln = lastName ? lastName.trim().charAt(0) : "";
        if (fn || ln) {
            return `${fn}${ln}`.toUpperCase();
        }
        return "TC";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return dateString;
            return d.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });
        } catch {
            return dateString;
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case "active":
            case "approved":
                return (
                    <span className="status-pill status-pill--completed">
                        <span className="status-beacon"></span>Active
                    </span>
                );
            case "inactive":
            case "rejected":
                return (
                    <span className="status-pill status-pill--rejected">
                        <span className="status-beacon"></span>Inactive
                    </span>
                );
            case "pending":
                return (
                    <span className="status-pill status-pill--pending">
                        <span className="status-beacon"></span>Pending
                    </span>
                );
            default:
                return (
                    <span className="status-pill status-pill--completed">
                        <span className="status-beacon"></span>{status || "Active"}
                    </span>
                );
        }
    };

    return (
        <div className="admin-dashboard-v2">
            <Navbar />

            <div className="admin-main-container">
                {/* Background Ambient Glows */}
                <div className="ambient-glow ambient-glow--1"></div>
                <div className="ambient-glow ambient-glow--2"></div>

                {/* Top Floating Glass Header */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <div className="command-brand">
                            <h1>Manage Technicians</h1>
                        </div>
                        <p className="command-subtitle">
                            Oversee inspection technician accounts, view details, and manage active status
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search technicians..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
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

                {/* Header Metrics */}
                <div className="stats-overview-grid">
                    <div className="stat-card-v2">
                        <div className="stat-icon-wrapper indigo">
                            <FiTool />
                        </div>
                        <div className="stat-content">
                            <h4>Total Technicians</h4>
                            <p className="stat-value">{totalTechCount}</p>
                        </div>
                    </div>

                    <div className="stat-card-v2">
                        <div className="stat-icon-wrapper amber" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#d97706" }}>
                            <FiShield />
                        </div>
                        <div className="stat-content">
                            <h4>Pending Requests</h4>
                            <p className="stat-value">{pendingTechCount}</p>
                        </div>
                    </div>

                    <div className="stat-card-v2">
                        <div className="stat-icon-wrapper emerald">
                            <FiUserCheck />
                        </div>
                        <div className="stat-content">
                            <h4>Active Accounts</h4>
                            <p className="stat-value">{activeTechCount}</p>
                        </div>
                    </div>

                    <div className="stat-card-v2">
                        <div className="stat-icon-wrapper rose" style={{ background: "rgba(225, 29, 72, 0.1)", color: "#e11d48" }}>
                            <FiUserX />
                        </div>
                        <div className="stat-content">
                            <h4>Inactive Accounts</h4>
                            <p className="stat-value">{inactiveTechCount}</p>
                        </div>
                    </div>
                </div>

                {/* Main Table Panel */}
                <section className="panel-card">
                    <div className="panel-header">
                        <div>
                            <h3 className="panel-title">Technicians List</h3>
                            <p className="panel-subtitle">View and manage inspection technician accounts</p>
                        </div>

                        <div className="panel-actions">
                            <div className="filter-pill-group">
                                {["All", "Pending", "Active", "Inactive"].map((tab) => (
                                    <button
                                        key={tab}
                                        className={`pill-btn ${activeFilter === tab ? "pill-btn--active" : ""}`}
                                        onClick={() => setActiveFilter(tab)}
                                    >
                                        {tab}
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
                            <p>Loading technician accounts...</p>
                        </div>
                    ) : filteredTechnicians.length === 0 ? (
                        <div className="no-data-state">
                            <FiFilter className="no-data-icon" />
                            <p>No technicians matching your criteria.</p>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="admin-cards-grid">
                            {filteredTechnicians.map((tech) => {
                                const photoSrc = getPhotoSrc(tech);
                                const fullName = `${tech.firstName || ""} ${tech.lastName || ""}`.trim() || "N/A";
                                const isActive = tech.status === "Active" || tech.status === "Approved";

                                return (
                                    <div key={tech.technicianId} className="admin-pickup-card">
                                        <div>
                                            <div className="admin-card-header">
                                                <div className="admin-card-top-row">
                                                    <div className="admin-agent-avatar" style={{ width: "42px", height: "42px", fontSize: "1rem" }}>
                                                        {photoSrc ? (
                                                            <img src={photoSrc} alt={fullName} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                                                        ) : (
                                                            tech.firstName?.charAt(0) || "T"
                                                        )}
                                                    </div>
                                                    <div>{getStatusBadge(tech.status)}</div>
                                                </div>
                                                <div className="admin-card-title-group">
                                                    <h4 className="admin-card-brand-name">{fullName}</h4>
                                                    <p className="admin-card-cat-sub">
                                                        Tech ID #{tech.technicianId} &bull; {tech.specialization || "Inspection Technician"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="admin-card-body">
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.2rem" }}>
                                                    <div className="admin-detail-row">
                                                        <FiUser className="detail-icon" style={{ color: "#3b82f6" }} />
                                                        <div>
                                                            <div className="detail-label">Email Address</div>
                                                            <div className="detail-val">{tech.login?.email || "N/A"}</div>
                                                        </div>
                                                    </div>

                                                    <div className="admin-detail-row">
                                                        <FiMapPin className="detail-icon" style={{ color: "#059669" }} />
                                                        <div>
                                                            <div className="detail-label">Phone & Location</div>
                                                            <div className="detail-val">{tech.phoneNumber || "N/A"}</div>
                                                            {tech.city && (
                                                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                                                    {tech.city}{tech.state ? `, ${tech.state}` : ""}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px dashed #e2e8f0" }}>
                                            <button
                                                onClick={() => openDetailModal(tech)}
                                                title="View Details"
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

                                            {isPending ? (
                                                <>
                                                    <button
                                                        className="action-btn action-btn--approve"
                                                        onClick={() => acceptTechnician(tech.technicianId || tech.id)}
                                                        title="Approve Account"
                                                    >
                                                        <FiCheck style={{ strokeWidth: 2.5 }} />
                                                    </button>
                                                    <button
                                                        className="action-btn action-btn--reject"
                                                        onClick={() => openRejectModal(tech)}
                                                        title="Reject Account"
                                                    >
                                                        <FiX style={{ strokeWidth: 2.5 }} />
                                                    </button>
                                                </>
                                            ) : isActive ? (
                                                <button
                                                    onClick={() => openDeactivateModal(tech)}
                                                    title="Deactivate Account"
                                                    style={{
                                                        flex: 1,
                                                        height: "40px",
                                                        background: "#fef2f2",
                                                        color: "#dc2626",
                                                        border: "1px solid #fca5a5",
                                                        borderRadius: "10px",
                                                        fontSize: "0.825rem",
                                                        fontWeight: 700,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "0.4rem",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    <span>Deactivate</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => activateTechnician(tech.technicianId || tech.id)}
                                                    title="Activate Account"
                                                    style={{
                                                        flex: 1,
                                                        height: "40px",
                                                        background: "#f0fdf4",
                                                        color: "#166534",
                                                        border: "1px solid #bbf7d0",
                                                        borderRadius: "10px",
                                                        fontSize: "0.825rem",
                                                        fontWeight: 700,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "0.4rem",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    <span>Activate</span>
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
                                        <th>TECHNICIAN</th>
                                        <th>PHONE / CENTER</th>
                                        <th>SPECIALIZATION</th>
                                        <th>LOCATION</th>
                                        <th>STATUS</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTechnicians.map((tech) => {
                                        const photoSrc = getPhotoSrc(tech);
                                        const fullName = `${tech.firstName || ""} ${tech.lastName || ""}`.trim() || "N/A";
                                        const isActive = tech.status === "Active" || tech.status === "Approved";
                                        const isPending = (tech.status || "").toLowerCase() === "pending";

                                        return (
                                            <tr key={tech.technicianId} className="table-row-hover">
                                                {/* TECHNICIAN COLUMN */}
                                                <td>
                                                    <div className="user-profile-cell">
                                                        {photoSrc ? (
                                                            <img
                                                                src={photoSrc}
                                                                alt={fullName}
                                                                className="user-avatar-img"
                                                                onError={(e) => {
                                                                    e.target.style.display = "none";
                                                                    if (e.target.nextSibling) {
                                                                        e.target.nextSibling.style.display = "flex";
                                                                    }
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div
                                                            className="user-avatar-mini"
                                                            style={{ display: photoSrc ? "none" : "flex" }}
                                                        >
                                                            {getInitials(tech.firstName, tech.lastName)}
                                                        </div>
                                                        <div className="user-info">
                                                            <span className="user-name">
                                                                {fullName}
                                                            </span>
                                                            <span className="user-email">
                                                                {tech.login?.email || "No email"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* PHONE / CENTER COLUMN */}
                                                <td className="contact-cell">
                                                    <div style={{ fontWeight: 600, color: "#0f172a" }}>
                                                        {tech.phoneNumber || "N/A"}
                                                    </div>
                                                    {tech.inspectionCenterName && (
                                                        <div style={{ fontSize: "0.775rem", color: "#64748b" }}>
                                                            {tech.inspectionCenterName}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* SPECIALIZATION COLUMN */}
                                                <td className="contact-cell">
                                                    <div style={{ fontWeight: 600, color: "#0f172a" }}>
                                                        {tech.specialization || "N/A"}
                                                    </div>
                                                    {tech.jobTitle && (
                                                        <div style={{ fontSize: "0.775rem", color: "#64748b" }}>
                                                            {tech.jobTitle}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* LOCATION COLUMN */}
                                                <td className="contact-cell">
                                                    {tech.city ? `${tech.city}${tech.state ? `, ${tech.state}` : ""}` : tech.state || "N/A"}
                                                </td>

                                                {/* STATUS COLUMN */}
                                                <td>
                                                    {getStatusBadge(tech.status)}
                                                </td>

                                                {/* ACTIONS COLUMN */}
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="action-btn action-btn--view"
                                                            onClick={() => openDetailModal(tech)}
                                                            title="View Details"
                                                        >
                                                            <FiEye />
                                                        </button>

                                                        {isPending ? (
                                                            <>
                                                                <button
                                                                    className="action-btn action-btn--approve"
                                                                    onClick={() => acceptTechnician(tech.technicianId || tech.id)}
                                                                    title="Approve Account"
                                                                >
                                                                    <FiCheck style={{ strokeWidth: 2.5 }} />
                                                                </button>
                                                                <button
                                                                    className="action-btn action-btn--reject"
                                                                    onClick={() => openRejectModal(tech)}
                                                                    title="Reject Account"
                                                                >
                                                                    <FiX style={{ strokeWidth: 2.5 }} />
                                                                </button>
                                                            </>
                                                        ) : isActive ? (
                                                            <button
                                                                className="action-btn-text action-btn-text--deactivate"
                                                                onClick={() => openDeactivateModal(tech)}
                                                            >
                                                                Deactivate
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="action-btn-text action-btn-text--activate"
                                                                onClick={() => activateTechnician(tech.technicianId || tech.id)}
                                                            >
                                                                Activate
                                                            </button>
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
                </section>

                {/* DEACTIVATE CONFIRMATION MODAL WITH LIVE REASON VALIDATION */}
                {showDeactivate && selectedTech && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <div className="modal-header">
                                <h3>
                                    <FiAlertTriangle style={{ color: "var(--rose)" }} /> Deactivate Technician
                                </h3>
                                <button
                                    className="modal-close-btn"
                                    onClick={() => {
                                        setShowDeactivate(false);
                                        setSelectedTech(null);
                                        setReason("");
                                        setReasonError("");
                                        setReasonTouched(false);
                                    }}
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="user-summary-box">
                                    <div className="user-profile-cell">
                                        {getPhotoSrc(selectedTech) ? (
                                            <img
                                                src={getPhotoSrc(selectedTech)}
                                                alt=""
                                                className="user-avatar-img"
                                            />
                                        ) : (
                                            <div className="user-avatar-mini">
                                                {getInitials(selectedTech.firstName, selectedTech.lastName)}
                                            </div>
                                        )}
                                        <div className="user-info">
                                            <span className="user-name">
                                                {`${selectedTech.firstName || ""} ${selectedTech.lastName || ""}`.trim()}
                                            </span>
                                            <span className="user-email">
                                                {selectedTech.login?.email}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="warning-callout">
                                    <FiAlertTriangle style={{ minWidth: "16px", marginTop: "2px" }} />
                                    <span>
                                        Deactivating this technician will suspend their account access and send an official notification email.
                                    </span>
                                </div>

                                <div className="form-group">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                                        <label style={{ margin: 0 }}>Reason for Deactivation *</label>
                                        <span className={`char-counter ${reason.trim().length > 300 ? "char-limit-exceeded" : ""}`}>
                                            {reason.trim().length}/300 chars
                                        </span>
                                    </div>
                                    <textarea
                                        className={`modal-textarea ${reasonTouched && reasonError ? "is-invalid" : reasonTouched && !reasonError ? "is-valid" : ""}`}
                                        value={reason}
                                        onChange={handleReasonChange}
                                        onBlur={() => {
                                            setReasonTouched(true);
                                            setReasonError(validateReason(reason));
                                        }}
                                        placeholder="Enter official reason for deactivation..."
                                        rows="4"
                                    />
                                    {reasonTouched && reasonError && (
                                        <div className="live-error-msg">
                                            <FiAlertTriangle /> {reasonError}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    className="btn-secondary"
                                    onClick={() => {
                                        setShowDeactivate(false);
                                        setSelectedTech(null);
                                        setReason("");
                                        setReasonError("");
                                        setReasonTouched(false);
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="btn-danger"
                                    onClick={deactivateTechnician}
                                    disabled={!reason.trim() || !!reasonError || deactivating}
                                >
                                    {deactivating ? "Deactivating..." : "Deactivate & Send Email"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW FULL PROFILE DETAIL MODAL */}
                {showDetailModal && viewTech && (
                    <div className="modal-overlay" onClick={() => { setShowDetailModal(false); setViewTech(null); }}>
                        <div className="device-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "950px", width: "95%" }}>
                            <div className="modal-header">
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                    {getPhotoSrc(viewTech) ? (
                                        <img
                                            src={getPhotoSrc(viewTech)}
                                            alt="Profile"
                                            className="user-avatar-img"
                                            style={{ width: "50px", height: "50px", borderRadius: "12px", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <div className="user-avatar-mini" style={{ width: "50px", height: "50px", borderRadius: "12px", fontSize: "1.2rem" }}>
                                            {getInitials(viewTech.firstName, viewTech.lastName)}
                                        </div>
                                    )}
                                    <div>
                                        <h2>{`${viewTech.firstName || ""} ${viewTech.lastName || ""}`.trim() || "Technician Profile"}</h2>
                                        <p className="panel-subtitle">Technician ID: #TECH-{viewTech.technicianId || viewTech.id} | Email: {viewTech.login?.email || "N/A"}</p>
                                    </div>
                                </div>
                                <button
                                    className="modal-close-btn"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setViewTech(null);
                                    }}
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className="device-details-grid">
                                <div className="detail-item">
                                    <label>First Name</label>
                                    <span>{viewTech.firstName || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Last Name</label>
                                    <span>{viewTech.lastName || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Email Address</label>
                                    <span>{viewTech.login?.email || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Phone Number</label>
                                    <span>{viewTech.phoneNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Gender</label>
                                    <span>{viewTech.gender || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Date of Birth</label>
                                    <span>{formatDate(viewTech.dateOfBirth)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Inspection Center Name</label>
                                    <span>{viewTech.inspectionCenterName || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Employee ID</label>
                                    <span>{viewTech.employeeId || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Job Title</label>
                                    <span>{viewTech.jobTitle || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Date of Joining</label>
                                    <span>{formatDate(viewTech.dateOfJoining)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Experience Years</label>
                                    <span>{viewTech.experienceYears !== undefined && viewTech.experienceYears !== null ? `${viewTech.experienceYears} Years` : "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Specialization</label>
                                    <span>{viewTech.specialization || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Street Address</label>
                                    <span>{viewTech.address || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>City</label>
                                    <span>{viewTech.city || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>District</label>
                                    <span>{viewTech.district || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>State</label>
                                    <span>{viewTech.state || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Pin Code</label>
                                    <span>{viewTech.pinCode || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Gov ID Type</label>
                                    <span>{viewTech.governmentIdType || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Gov ID Number</label>
                                    <span>{viewTech.governmentIdNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Issuing Institute</label>
                                    <span>{viewTech.issuingInstitute || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Certificate Number</label>
                                    <span>{viewTech.certificateNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Certificate Issue Date</label>
                                    <span>{formatDate(viewTech.certificateIssueDate)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Certificate Expiry Date</label>
                                    <span>{formatDate(viewTech.certificateExpiryDate)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Status</label>
                                    <span>{getStatusBadge(viewTech.status)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Registration Date</label>
                                    <span>{formatDate(viewTech.createdAt)}</span>
                                </div>
                            </div>

                            {(getGovernmentIdPath(viewTech) || getEmployeeIdCardPath(viewTech) || getTechnicalCertificatePath(viewTech) || getResumePath(viewTech) || getPhotoSrc(viewTech)) && (
                                <div className="device-photos-section">
                                    <h4>
                                        <FiFileText style={{ color: "var(--primary)" }} /> Uploaded Verification Documents
                                    </h4>
                                    <div className="photos-grid">
                                        {getGovernmentIdPath(viewTech) && (
                                            <div className="photo-card">
                                                <a
                                                    href={getGovernmentIdPath(viewTech)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                    title={`View ${viewTech.governmentIdType || "Government ID"}`}
                                                >
                                                    <div className="doc-icon-box">
                                                        <FiShield />
                                                    </div>
                                                    <span>{viewTech.governmentIdType || "Gov ID"} Proof</span>
                                                    <FiExternalLink className="ext-icon" />
                                                </a>
                                            </div>
                                        )}
                                        {getEmployeeIdCardPath(viewTech) && (
                                            <div className="photo-card">
                                                <a
                                                    href={getEmployeeIdCardPath(viewTech)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                    title="View Employee ID Card"
                                                >
                                                    <div className="doc-icon-box">
                                                        <FiFileText />
                                                    </div>
                                                    <span>Employee ID Card</span>
                                                    <FiExternalLink className="ext-icon" />
                                                </a>
                                            </div>
                                        )}
                                        {getTechnicalCertificatePath(viewTech) && (
                                            <div className="photo-card">
                                                <a
                                                    href={getTechnicalCertificatePath(viewTech)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                    title="View Technical Certificate"
                                                >
                                                    <div className="doc-icon-box">
                                                        <FiAward />
                                                    </div>
                                                    <span>Technical Certificate</span>
                                                    <FiExternalLink className="ext-icon" />
                                                </a>
                                            </div>
                                        )}
                                        {getResumePath(viewTech) && (
                                            <div className="photo-card">
                                                <a
                                                    href={getResumePath(viewTech)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                    title="View Resume"
                                                >
                                                    <div className="doc-icon-box">
                                                        <FiFileText />
                                                    </div>
                                                    <span>Resume / CV</span>
                                                    <FiExternalLink className="ext-icon" />
                                                </a>
                                            </div>
                                        )}
                                        {getPhotoSrc(viewTech) && (
                                            <div className="photo-card">
                                                <a
                                                    href={getPhotoSrc(viewTech)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                    title="View Profile Photo"
                                                >
                                                    <div className="doc-icon-box">
                                                        <FiImage />
                                                    </div>
                                                    <span>Profile Photo</span>
                                                    <FiExternalLink className="ext-icon" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid #e2e8f0" }}>
                                <button
                                    className="pill-btn"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setViewTech(null);
                                    }}
                                    style={{ padding: "0.45rem 0.9rem", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem" }}
                                >
                                    Close
                                </button>
                                {(viewTech.status || "").toLowerCase() === "pending" && (
                                    <>
                                        <button
                                            className="action-btn-text action-btn-text--approve"
                                            onClick={() => {
                                                const id = viewTech.technicianId || viewTech.id;
                                                setShowDetailModal(false);
                                                setViewTech(null);
                                                acceptTechnician(id);
                                            }}
                                        >
                                            Approve Account
                                        </button>
                                        <button
                                            className="action-btn-text action-btn-text--reject"
                                            onClick={() => {
                                                const target = viewTech;
                                                setShowDetailModal(false);
                                                setViewTech(null);
                                                openRejectModal(target);
                                            }}
                                        >
                                            Reject Application
                                        </button>
                                    </>
                                )}
                                {((viewTech.status || "").toLowerCase() === "active" || (viewTech.status || "").toLowerCase() === "approved") && (
                                    <button
                                        className="action-btn-text action-btn-text--deactivate"
                                        onClick={() => {
                                            const target = viewTech;
                                            setShowDetailModal(false);
                                            setViewTech(null);
                                            openDeactivateModal(target);
                                        }}
                                        style={{ padding: "0.45rem 0.9rem", borderRadius: "6px", fontSize: "0.8rem" }}
                                    >
                                        Deactivate Account
                                    </button>
                                )}
                                {(viewTech.status || "").toLowerCase() === "inactive" && (
                                    <button
                                        className="action-btn-text action-btn-text--activate"
                                        onClick={() => {
                                            const id = viewTech.technicianId || viewTech.id;
                                            setShowDetailModal(false);
                                            setViewTech(null);
                                            activateTechnician(id);
                                        }}
                                        style={{ padding: "0.45rem 0.9rem", borderRadius: "6px", fontSize: "0.8rem" }}
                                    >
                                        Activate Account
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* REJECTION REASON MODAL */}
                {rejectModalTech && (
                    <div className="modal-overlay">
                        <div className="modal-card modal-card--deactivate" style={{ maxWidth: "520px", padding: 0, overflow: "hidden" }}>
                            <div className="modal-header" style={{ padding: "1.25rem 1.5rem", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                                        <FiX />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#ffffff" }}>
                                            Reject Technician Request
                                        </h3>
                                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
                                            {`${rejectModalTech.firstName || ""} ${rejectModalTech.lastName || ""}`.trim() || "Selected Technician"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setRejectModalTech(null)}
                                    style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center" }}
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div style={{ padding: "1.5rem" }}>
                                <p style={{ fontSize: "0.875rem", color: "#475569", marginTop: 0, marginBottom: "1rem", lineHeight: 1.5 }}>
                                    Please specify the official reason for rejecting this technician application.
                                </p>

                                <div style={{ marginBottom: "0.5rem" }}>
                                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                                        Rejection Reason <span style={{ color: "#ef4444" }}>*</span>
                                    </label>
                                    <textarea
                                        rows="4"
                                        placeholder="Enter detailed rejection reason (minimum 10 characters, letters and numbers only)..."
                                        value={rejectReason}
                                        onChange={handleRejectReasonChange}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "10px",
                                            border: rejectReasonTouched && rejectReasonError ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                                            outline: "none",
                                            fontSize: "0.875rem",
                                            fontFamily: "inherit",
                                            resize: "vertical"
                                        }}
                                    ></textarea>
                                    {rejectReasonTouched && rejectReasonError && (
                                        <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.78rem", color: "#ef4444", fontWeight: 600 }}>
                                            {rejectReasonError}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                                <button
                                    className="btn-secondary"
                                    onClick={() => setRejectModalTech(null)}
                                    style={{ padding: "0.55rem 1.25rem", borderRadius: "8px", fontWeight: 600 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRejectTechnician}
                                    disabled={Boolean(rejecting || rejectReasonError || !rejectReason.trim())}
                                    style={{
                                        padding: "0.55rem 1.25rem",
                                        borderRadius: "8px",
                                        fontWeight: 700,
                                        background: Boolean(rejecting || rejectReasonError || !rejectReason.trim()) ? "#94a3b8" : "#dc2626",
                                        color: "#ffffff",
                                        border: "none",
                                        cursor: Boolean(rejecting || rejectReasonError || !rejectReason.trim()) ? "not-allowed" : "pointer"
                                    }}
                                >
                                    {rejecting ? "Rejecting..." : "Confirm Rejection"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Managetechnician;