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
    FiCheckCircle
} from "react-icons/fi";
import "./Manage_users.css";

function Managetechnician() {
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

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

    const [fetchError, setFetchError] = useState("");

    useEffect(() => {
        fetchTechnicians();
    }, []);

    const fetchTechnicians = async () => {
        setLoading(true);
        setFetchError("");
        try {
            const response = await axios.get(
                "https://localhost:7102/api/Technician/alluser"
            );
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

    const openDetailModal = (tech) => {
        setViewTech(tech);
        setShowDetailModal(true);
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
                `https://localhost:7102/api/Technician/deactivate/${selectedTech.technicianId}`,
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
                `https://localhost:7102/api/Technician/activate/${id}`
            );
            fetchTechnicians();
        } catch (error) {
            console.error("Error activating technician:", error);
        }
    };

    // Exclude pending accounts (pending accounts belong in Account Approvals)
    const nonPendingTechnicians = technicians.filter(
        t => t.status?.toLowerCase() !== "pending"
    );

    // Statistics
    const totalTechCount = nonPendingTechnicians.length;
    const activeTechCount = nonPendingTechnicians.filter(
        t => t.status === "Active" || t.status === "Approved"
    ).length;
    const inactiveTechCount = nonPendingTechnicians.filter(
        t => t.status === "Inactive" || t.status === "Rejected"
    ).length;

    // Filter technicians
    const filteredTechnicians = nonPendingTechnicians.filter((tech) => {
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

        const matchesStatus =
            activeFilter === "All" ||
            (activeFilter === "Active" && (tech.status === "Active" || tech.status === "Approved")) ||
            (activeFilter === "Inactive" && (tech.status === "Inactive" || tech.status === "Rejected"));

        return matchesSearch && matchesStatus;
    });

    const getPhotoSrc = (tech) => {
        if (!tech?.profilePhoto) return null;
        if (tech.profilePhoto.startsWith("http")) return tech.profilePhoto;
        return `https://localhost:7102/uploads/technicians/ProfilePhotos/${tech.profilePhoto}`;
    };

    const getGovernmentIdPath = (tech) => {
        if (!tech?.governmentIdFile) return null;
        if (tech.governmentIdFile.startsWith("http")) return tech.governmentIdFile;
        let folder = "GovernmentIds";
        if (tech.governmentIdType === "Aadhaar") folder = "GovernmentIds/Aadhaar";
        else if (tech.governmentIdType === "PAN") folder = "GovernmentIds/PAN";
        else if (tech.governmentIdType === "Driving Licence") folder = "GovernmentIds/DrivingLicence";
        else if (tech.governmentIdType === "Passport") folder = "GovernmentIds/Passport";
        return `https://localhost:7102/uploads/technicians/${folder}/${tech.governmentIdFile}`;
    };

    const getEmployeeIdCardPath = (tech) => {
        if (!tech?.employeeIdCard) return null;
        if (tech.employeeIdCard.startsWith("http")) return tech.employeeIdCard;
        return `https://localhost:7102/uploads/technicians/EmployeeIdCards/${tech.employeeIdCard}`;
    };

    const getTechnicalCertificatePath = (tech) => {
        if (!tech?.technicalCertificate) return null;
        if (tech.technicalCertificate.startsWith("http")) return tech.technicalCertificate;
        return `https://localhost:7102/uploads/technicians/TechnicalCertificates/${tech.technicalCertificate}`;
    };

    const getResumePath = (tech) => {
        if (!tech?.resume) return null;
        if (tech.resume.startsWith("http")) return tech.resume;
        return `https://localhost:7102/uploads/technicians/Resumes/${tech.resume}`;
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
                            <span className="command-badge">
                                <span className="live-dot"></span> SYSTEM ONLINE
                            </span>
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

                            <Link to="/logout" className="logout-btn-v2" title="Logout">
                                <FiLogOut />
                                <span>Exit</span>
                            </Link>
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
                        <div className="stat-icon-wrapper emerald">
                            <FiUserCheck />
                        </div>
                        <div className="stat-content">
                            <h4>Active Accounts</h4>
                            <p className="stat-value">{activeTechCount}</p>
                        </div>
                    </div>

                    <div className="stat-card-v2">
                        <div className="stat-icon-wrapper amber">
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
                                {["All", "Active", "Inactive"].map((tab) => (
                                    <button
                                        key={tab}
                                        className={`pill-btn ${activeFilter === tab ? "pill-btn--active" : ""}`}
                                        onClick={() => setActiveFilter(tab)}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <button className="refresh-icon-btn" onClick={fetchTechnicians} title="Refresh Data">
                                <FiRefreshCw />
                            </button>
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

                                                        {isActive ? (
                                                            <button
                                                                className="action-btn-text action-btn-text--deactivate"
                                                                onClick={() => openDeactivateModal(tech)}
                                                            >
                                                                Deactivate
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="action-btn-text action-btn-text--activate"
                                                                onClick={() => activateTechnician(tech.technicianId)}
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
                    <div className="modal-overlay" style={{ alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
                        <div className="modal-card" style={{ maxWidth: "1100px", width: "100%", borderRadius: "20px", background: "#ffffff", boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.35)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
                            {/* Fixed Modal Header */}
                            <div className="modal-header" style={{ padding: "1.25rem 1.75rem", background: "#ffffff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                    <FiShield style={{ color: "#2563eb", fontSize: "1.35rem" }} /> Technician Profile & Details
                                </h3>
                                <button
                                    className="modal-close-btn"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setViewTech(null);
                                    }}
                                    style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}
                                >
                                    <FiX style={{ fontSize: "1.1rem" }} />
                                </button>
                            </div>

                            {/* Scrollable Modal Body */}
                            <div className="modal-body" style={{ padding: "1.5rem 1.75rem", overflowY: "auto", flex: 1 }}>
                                {/* Top Profile Summary Bar */}
                                <div className="user-summary-box" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", borderRadius: "14px", padding: "1.25rem 1.5rem", border: "1px solid #cbd5e1", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div className="user-profile-cell" style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                                        {getPhotoSrc(viewTech) ? (
                                            <img
                                                src={getPhotoSrc(viewTech)}
                                                alt=""
                                                className="user-avatar-img"
                                                style={{ width: "60px", height: "60px", borderRadius: "14px", objectFit: "cover", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                                            />
                                        ) : (
                                            <div className="user-avatar-mini" style={{ width: "60px", height: "60px", borderRadius: "14px", fontSize: "1.35rem", fontWeight: 700 }}>
                                                {getInitials(viewTech.firstName, viewTech.lastName)}
                                            </div>
                                        )}
                                        <div className="user-info">
                                            <span className="user-name" style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                                                {`${viewTech.firstName || ""} ${viewTech.lastName || ""}`.trim() || "Technician Profile"}
                                            </span>
                                            <span className="user-email" style={{ fontSize: "0.875rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                                                {viewTech.login?.email || "N/A"}
                                                <span style={{ padding: "0.15rem 0.5rem", borderRadius: "6px", background: "#e2e8f0", color: "#334155", fontWeight: 700, fontSize: "0.75rem" }}>
                                                    ID: #TECH-{viewTech.technicianId}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        {getStatusBadge(viewTech.status)}
                                    </div>
                                </div>

                                {/* 2-COLUMN SIDE-BY-SIDE GRID */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: "1.5rem" }}>
                                    {/* LEFT SIDE: Personal & Employment Details */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                        {/* Personal Details Card */}
                                        <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", borderRadius: "16px", padding: "1.35rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", paddingBottom: "0.6rem", borderBottom: "1px solid #f1f5f9" }}>
                                                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                                                    <FiUser />
                                                </div>
                                                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", margin: 0, letterSpacing: "0.02em" }}>
                                                    Personal & Account Information
                                                </h4>
                                            </div>

                                            <div className="detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>First Name</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewTech.firstName || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Last Name</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewTech.lastName || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Phone Number</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewTech.phoneNumber || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Gender</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewTech.gender || "N/A"}</span>
                                                </div>
                                                <div className="detail-item" style={{ gridColumn: "span 2" }}>
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Email Address</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewTech.login?.email || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Date of Birth</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{formatDate(viewTech.dateOfBirth)}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Registration Date</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{formatDate(viewTech.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Employment & Work Details Card */}
                                        <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", borderRadius: "16px", padding: "1.35rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", paddingBottom: "0.6rem", borderBottom: "1px solid #f1f5f9" }}>
                                                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#f3e8ff", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                                                    <FiBriefcase />
                                                </div>
                                                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", margin: 0, letterSpacing: "0.02em" }}>
                                                    Employment & Center Details
                                                </h4>
                                            </div>

                                            <div className="detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                                <div className="detail-item" style={{ gridColumn: "span 2" }}>
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Inspection Center Name</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewTech.inspectionCenterName || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Employee ID</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>{viewTech.employeeId || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Job Title</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewTech.jobTitle || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Date of Joining</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{formatDate(viewTech.dateOfJoining)}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Experience Years</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewTech.experienceYears !== undefined && viewTech.experienceYears !== null ? `${viewTech.experienceYears} Years` : "N/A"}</span>
                                                </div>
                                                <div className="detail-item" style={{ gridColumn: "span 2" }}>
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Specialization</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewTech.specialization || "N/A"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT SIDE: Address, Certifications & Documents */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                        {/* Address Card */}
                                        <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", borderRadius: "16px", padding: "1.35rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", paddingBottom: "0.6rem", borderBottom: "1px solid #f1f5f9" }}>
                                                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#fffbeb", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                                                    <FiMapPin />
                                                </div>
                                                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", margin: 0, letterSpacing: "0.02em" }}>
                                                    Address & Location
                                                </h4>
                                            </div>

                                            <div className="detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                                <div className="detail-item" style={{ gridColumn: "span 2" }}>
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Street Address</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewTech.address || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>City</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewTech.city || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>District</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewTech.district || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>State</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewTech.state || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Pin Code</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewTech.pinCode || "N/A"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Certification & ID Info Card */}
                                        <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", borderRadius: "16px", padding: "1.35rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", paddingBottom: "0.6rem", borderBottom: "1px solid #f1f5f9" }}>
                                                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                                                    <FiAward />
                                                </div>
                                                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", margin: 0, letterSpacing: "0.02em" }}>
                                                    Certification & Government ID
                                                </h4>
                                            </div>

                                            <div className="detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                                <div className="detail-item" style={{ gridColumn: "span 2" }}>
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Issuing Institute</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewTech.issuingInstitute || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Certificate No.</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>{viewTech.certificateNumber || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Issue Date</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{formatDate(viewTech.certificateIssueDate)}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Expiry Date</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{formatDate(viewTech.certificateExpiryDate)}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Gov ID Type</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewTech.governmentIdType || "N/A"}</span>
                                                </div>
                                                <div className="detail-item" style={{ gridColumn: "span 2" }}>
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Gov ID Number</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>{viewTech.governmentIdNumber || "N/A"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Verification Documents Card */}
                                        {(getGovernmentIdPath(viewTech) || getEmployeeIdCardPath(viewTech) || getTechnicalCertificatePath(viewTech) || getResumePath(viewTech) || getPhotoSrc(viewTech)) && (
                                            <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", borderRadius: "16px", padding: "1.35rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", paddingBottom: "0.6rem", borderBottom: "1px solid #f1f5f9" }}>
                                                    <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#ecfeff", color: "#06b6d4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                                                        <FiFileText />
                                                    </div>
                                                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", margin: 0, letterSpacing: "0.02em" }}>
                                                        Verification Documents
                                                    </h4>
                                                </div>

                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                                                    {getGovernmentIdPath(viewTech) && (
                                                        <a
                                                            href={getGovernmentIdPath(viewTech)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="document-link-btn"
                                                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "10px", background: "#ffffff", color: "#2563eb", fontSize: "0.825rem", fontWeight: 700, textDecoration: "none", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}
                                                        >
                                                            {viewTech.governmentIdType || "Gov ID"} Doc ↗
                                                        </a>
                                                    )}
                                                    {getEmployeeIdCardPath(viewTech) && (
                                                        <a
                                                            href={getEmployeeIdCardPath(viewTech)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="document-link-btn"
                                                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "10px", background: "#ffffff", color: "#2563eb", fontSize: "0.825rem", fontWeight: 700, textDecoration: "none", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}
                                                        >
                                                            Employee ID Card ↗
                                                        </a>
                                                    )}
                                                    {getTechnicalCertificatePath(viewTech) && (
                                                        <a
                                                            href={getTechnicalCertificatePath(viewTech)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="document-link-btn"
                                                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "10px", background: "#ffffff", color: "#2563eb", fontSize: "0.825rem", fontWeight: 700, textDecoration: "none", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}
                                                        >
                                                            Technical Cert ↗
                                                        </a>
                                                    )}
                                                    {getResumePath(viewTech) && (
                                                        <a
                                                            href={getResumePath(viewTech)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="document-link-btn"
                                                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "10px", background: "#ffffff", color: "#2563eb", fontSize: "0.825rem", fontWeight: 700, textDecoration: "none", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}
                                                        >
                                                            Resume / CV ↗
                                                        </a>
                                                    )}
                                                    {getPhotoSrc(viewTech) && (
                                                        <a
                                                            href={getPhotoSrc(viewTech)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="document-link-btn"
                                                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "10px", background: "#ffffff", color: "#2563eb", fontSize: "0.825rem", fontWeight: 700, textDecoration: "none", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}
                                                        >
                                                            Profile Photo ↗
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Modal Footer */}
                            <div className="modal-footer" style={{ padding: "1rem 1.75rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
                                <button
                                    className="btn-secondary"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setViewTech(null);
                                    }}
                                    style={{ padding: "0.6rem 1.5rem", borderRadius: "10px", fontWeight: 600 }}
                                >
                                    Close
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