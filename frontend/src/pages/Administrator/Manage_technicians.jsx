import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import {
    FiSearch,
    FiBell,
    FiLogOut,
    FiEye,
    FiCheck,
    FiX,
    FiFilter,
    FiUser,
    FiBriefcase,
    FiMapPin,
    FiAward,
    FiFileText,
    FiShield
} from "react-icons/fi";
import "./Manage_technicians.css";

function Manage_technicians() {
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [selectedTechnician, setSelectedTechnician] = useState(null);
    const [rejectModalTechnician, setRejectModalTechnician] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectReasonError, setRejectReasonError] = useState("");
    const [rejectReasonTouched, setRejectReasonTouched] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPendingTechnicians();
    }, []);

    const fetchPendingTechnicians = async () => {
        try {
            const response = await axios.get(
                "https://localhost:7102/api/Technician/All"
            );

            setTechnicians(response.data || []);
        } catch (error) {
            console.error("Error fetching technicians:", error);
            setError("Failed to load technician requests.");
        } finally {
            setLoading(false);
        }
    };

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
        setRejectModalTechnician(tech);
        setRejectReason("");
        setRejectReasonError("");
        setRejectReasonTouched(false);
    };

    const handleViewDetails = async (tech) => {
        const techId = tech.technicianId || tech.id;
        setSelectedTechnician(tech);
        try {
            const response = await axios.get(
                `https://localhost:7102/api/Technician/${techId}`
            );
            if (response.data) {
                setSelectedTechnician(response.data);
            }
        } catch (err) {
            console.error("Error fetching technician details:", err);
        }
    };

    const acceptTechnician = async (technicianId) => {
        setActionLoadingId(technicianId);
        try {
            await axios.post(
                `https://localhost:7102/api/Technician/Accept/${technicianId}`
            );

            setTechnicians(prevTechnicians =>
                prevTechnicians.map(technician =>
                    (technician.technicianId || technician.id) === technicianId
                        ? { ...technician, status: "Active" }
                        : technician
                )
            );
            if (selectedTechnician && (selectedTechnician.technicianId || selectedTechnician.id) === technicianId) {
                setSelectedTechnician(prev => ({ ...prev, status: "Active" }));
            }
        } catch (error) {
            console.error("Error accepting technician:", error);
            console.error("Backend response:", error.response?.data);

            alert(
                error.response?.data?.message ||
                "Failed to accept technician"
            );
        } finally {
            setActionLoadingId(null);
        }
    };

    const confirmRejectTechnician = async () => {
        if (!rejectModalTechnician) return;

        const err = validateRejectionReason(rejectReason);
        setRejectReasonTouched(true);
        setRejectReasonError(err);
        if (err) {
            return;
        }

        const techId = rejectModalTechnician.technicianId || rejectModalTechnician.id;
        setActionLoadingId(techId);

        try {
            await axios.post(
                `https://localhost:7102/api/Technician/Reject/${techId}`,
                null,
                {
                    params: { reason: rejectReason.trim() }
                }
            );

            setTechnicians(prevTechnicians =>
                prevTechnicians.map(technician =>
                    (technician.technicianId || technician.id) === techId
                        ? { ...technician, status: "Rejected" }
                        : technician
                )
            );
            if (selectedTechnician && (selectedTechnician.technicianId || selectedTechnician.id) === techId) {
                setSelectedTechnician(prev => ({ ...prev, status: "Rejected" }));
            }
            setRejectModalTechnician(null);
            setRejectReason("");
            setRejectReasonError("");
            setRejectReasonTouched(false);
        } catch (error) {
            console.error("Error rejecting technician:", error);
            console.error("Backend response:", error.response?.data);

            alert(
                error.response?.data?.message ||
                "Failed to reject technician"
            );
        } finally {
            setActionLoadingId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return <span className="status-pill status-pill--pending"><span className="status-beacon"></span>Pending</span>;
            case "active":
            case "approved":
                return <span className="status-pill status-pill--completed"><span className="status-beacon"></span>Active</span>;
            case "rejected":
                return <span className="status-pill status-pill--rejected"><span className="status-beacon"></span>Rejected</span>;
            case "inactive":
                return <span className="status-pill"><span className="status-beacon"></span>Inactive</span>;
            default:
                return <span className="status-pill">{status || "Unknown"}</span>;
        }
    };

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

    const filteredTechnicians = technicians.filter((technician) => {
        const fullName = `${technician.firstName || ""} ${technician.lastName || ""}`.trim();
        const matchesSearch =
            fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (technician.login?.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (technician.phoneNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (technician.inspectionCenterName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (technician.employeeId?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (technician.city?.toLowerCase() || "").includes(searchQuery.toLowerCase());

        const statusStr = (technician.status || "").toLowerCase();
        const matchesStatus =
            activeFilter === "All" ||
            (activeFilter === "Pending" && statusStr === "pending") ||
            (activeFilter === "Approved" && (statusStr === "active" || statusStr === "approved")) ||
            (activeFilter === "Rejected" && statusStr === "rejected");

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
                            <h1>Manage Technician Signups</h1>
                        </div>
                        <p className="command-subtitle">
                            Manage and oversee pending technician registration approvals
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

                {/* Content Area */}
                <section className="content-section">
                    <div className="panel-card table-panel">
                        <div className="panel-header">
                            <div>
                                <h3 className="panel-title">Technician Requests</h3>
                                <p className="panel-subtitle">View and manage pending technician registrations</p>
                            </div>
                            <div className="panel-actions">
                                <div className="filter-pill-group">
                                    {["All", "Pending", "Approved", "Rejected"].map((tab) => (
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
                                <p>Loading technician requests...</p>
                            </div>
                        ) : error ? (
                            <div className="error-state">
                                <p>{error}</p>
                            </div>
                        ) : filteredTechnicians.length === 0 ? (
                            <div className="no-data-state">
                                <FiFilter className="no-data-icon" />
                                <p>No technician requests matching your criteria.</p>
                            </div>
                        ) : (
                            <div className="glass-table-wrapper">
                                <table className="glass-table">
                                    <thead>
                                        <tr>
                                            <th>Technician</th>
                                            <th>Email</th>
                                            <th>Phone / Center</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTechnicians.map((technician) => {
                                            const photoSrc = getPhotoSrc(technician);
                                            const fullName = `${technician.firstName || ""} ${technician.lastName || ""}`.trim() || "N/A";
                                            const techId = technician.technicianId || technician.id;
                                            const isActionLoading = actionLoadingId === techId;

                                            return (
                                                <tr key={techId} className="table-row-hover">
                                                    <td>
                                                        <div className="user-profile-cell">
                                                            {photoSrc ? (
                                                                <img
                                                                    src={photoSrc}
                                                                    alt="Profile"
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
                                                                {technician.firstName?.charAt(0) || "T"}
                                                            </div>
                                                            <div className="user-info">
                                                                <span className="user-name">
                                                                    {fullName}
                                                                </span>
                                                                <span className="user-email">{technician.login?.email || "No email"}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="contact-cell">{technician.login?.email || "N/A"}</td>
                                                    <td className="phone-cell">
                                                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{technician.phoneNumber || "N/A"}</div>
                                                        {technician.inspectionCenterName && (
                                                            <div style={{ fontSize: "0.775rem", color: "#64748b" }}>{technician.inspectionCenterName}</div>
                                                        )}
                                                    </td>
                                                    <td>{getStatusBadge(technician.status)}</td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                className="action-btn action-btn--view"
                                                                onClick={() => handleViewDetails(technician)}
                                                                title="View Details"
                                                            >
                                                                <FiEye />
                                                            </button>
                                                            {technician.status?.toLowerCase() === "pending" && (
                                                                <>
                                                                    <button
                                                                        className="action-btn action-btn--approve"
                                                                        onClick={() => acceptTechnician(techId)}
                                                                        disabled={isActionLoading}
                                                                        title="Approve"
                                                                    >
                                                                        <FiCheck />
                                                                    </button>
                                                                    <button
                                                                        className="action-btn action-btn--reject"
                                                                        onClick={() => openRejectModal(technician)}
                                                                        disabled={isActionLoading}
                                                                        title="Reject"
                                                                    >
                                                                        <FiX />
                                                                    </button>
                                                                </>
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

                {/* Technician Details Modal */}
                {selectedTechnician && (
                    <div className="modal-overlay" onClick={() => setSelectedTechnician(null)}>
                        <div className="device-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "950px", width: "95%" }}>
                            <div className="modal-header">
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                    {getPhotoSrc(selectedTechnician) ? (
                                        <img
                                            src={getPhotoSrc(selectedTechnician)}
                                            alt="Profile"
                                            className="user-avatar-img"
                                            style={{ width: "50px", height: "50px", borderRadius: "12px", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <div className="user-avatar-mini" style={{ width: "50px", height: "50px", borderRadius: "12px", fontSize: "1.2rem" }}>
                                            {selectedTechnician.firstName?.charAt(0) || "T"}
                                        </div>
                                    )}
                                    <div>
                                        <h2>{selectedTechnician.firstName} {selectedTechnician.lastName}</h2>
                                        <p className="panel-subtitle">Technician ID: #{selectedTechnician.technicianId || selectedTechnician.id} | Email: {selectedTechnician.login?.email || "N/A"}</p>
                                    </div>
                                </div>
                                <button className="modal-close-btn" onClick={() => setSelectedTechnician(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="device-details-grid">
                                <div className="detail-item">
                                    <label>First Name</label>
                                    <span>{selectedTechnician.firstName || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Last Name</label>
                                    <span>{selectedTechnician.lastName || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Email Address</label>
                                    <span>{selectedTechnician.login?.email || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Phone Number</label>
                                    <span>{selectedTechnician.phoneNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Date of Birth</label>
                                    <span>{formatDate(selectedTechnician.dateOfBirth)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Gender</label>
                                    <span>{selectedTechnician.gender || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Employee ID</label>
                                    <span>{selectedTechnician.employeeId || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Inspection Center</label>
                                    <span>{selectedTechnician.inspectionCenterName || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Job Title</label>
                                    <span>{selectedTechnician.jobTitle || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Date of Joining</label>
                                    <span>{formatDate(selectedTechnician.dateOfJoining)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Experience</label>
                                    <span>{selectedTechnician.experienceYears !== undefined && selectedTechnician.experienceYears !== null ? `${selectedTechnician.experienceYears} Years` : "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Specialization</label>
                                    <span>{selectedTechnician.specialization || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Issuing Institute</label>
                                    <span>{selectedTechnician.issuingInstitute || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Certificate Number</label>
                                    <span>{selectedTechnician.certificateNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Cert Issue Date</label>
                                    <span>{formatDate(selectedTechnician.certificateIssueDate)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Cert Expiry Date</label>
                                    <span>{formatDate(selectedTechnician.certificateExpiryDate)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Government ID Type</label>
                                    <span>{selectedTechnician.governmentIdType || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Government ID Number</label>
                                    <span>{selectedTechnician.governmentIdNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Address</label>
                                    <span>{selectedTechnician.address || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>City</label>
                                    <span>{selectedTechnician.city || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>District</label>
                                    <span>{selectedTechnician.district || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>State</label>
                                    <span>{selectedTechnician.state || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Pin Code</label>
                                    <span>{selectedTechnician.pinCode || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Status</label>
                                    <span>{getStatusBadge(selectedTechnician.status)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Registration Date</label>
                                    <span>{formatDate(selectedTechnician.createdAt)}</span>
                                </div>
                            </div>

                            {(getGovernmentIdPath(selectedTechnician) || getEmployeeIdCardPath(selectedTechnician) || getTechnicalCertificatePath(selectedTechnician) || getResumePath(selectedTechnician) || getPhotoSrc(selectedTechnician)) && (
                                <div className="device-photos-section">
                                    <h4>Uploaded Verification Documents</h4>
                                    <div className="photos-grid">
                                        {getGovernmentIdPath(selectedTechnician) && (
                                            <div className="photo-card">
                                                <a
                                                    href={getGovernmentIdPath(selectedTechnician)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                >
                                                    {selectedTechnician.governmentIdType || "Govt"} ID Doc ↗
                                                </a>
                                            </div>
                                        )}
                                        {getEmployeeIdCardPath(selectedTechnician) && (
                                            <div className="photo-card">
                                                <a
                                                    href={getEmployeeIdCardPath(selectedTechnician)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                >
                                                    Employee ID Card ↗
                                                </a>
                                            </div>
                                        )}
                                        {getTechnicalCertificatePath(selectedTechnician) && (
                                            <div className="photo-card">
                                                <a
                                                    href={getTechnicalCertificatePath(selectedTechnician)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                >
                                                    Technical Cert ↗
                                                </a>
                                            </div>
                                        )}
                                        {getResumePath(selectedTechnician) && (
                                            <div className="photo-card">
                                                <a
                                                    href={getResumePath(selectedTechnician)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                >
                                                    Resume / CV ↗
                                                </a>
                                            </div>
                                        )}
                                        {getPhotoSrc(selectedTechnician) && (
                                            <div className="photo-card">
                                                <a
                                                    href={getPhotoSrc(selectedTechnician)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                >
                                                    Profile Photo ↗
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Rejection Reason Modal */}
                {rejectModalTechnician && (
                    <div className="modal-overlay" onClick={() => setRejectModalTechnician(null)}>
                        <div className="device-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", width: "90%" }}>
                            <div className="modal-header">
                                <h2>Reject Application</h2>
                                <button className="modal-close-btn" onClick={() => setRejectModalTechnician(null)}>
                                    <FiX />
                                </button>
                            </div>
                            <div style={{ padding: "1.5rem 0" }}>
                                <p style={{ marginBottom: "1rem", color: "#64748b", fontSize: "0.95rem" }}>
                                    Please provide a reason for rejecting <strong>{rejectModalTechnician.firstName} {rejectModalTechnician.lastName}</strong>. This reason will be emailed to the applicant.
                                </p>
                                <textarea
                                    rows={4}
                                    placeholder="Enter reason for rejection (at least 10 characters, no special characters)..."
                                    value={rejectReason}
                                    onChange={handleRejectReasonChange}
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "8px",
                                        border: rejectReasonTouched && rejectReasonError ? "1px solid #ef4444" : "1px solid #cbd5e1",
                                        fontSize: "0.95rem",
                                        fontFamily: "inherit",
                                        resize: "vertical"
                                    }}
                                />
                                {rejectReasonTouched && rejectReasonError && (
                                    <span style={{ color: "#ef4444", fontSize: "0.825rem", marginTop: "0.4rem", display: "block" }}>
                                        {rejectReasonError}
                                    </span>
                                )}
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                                <button
                                    className="pill-btn"
                                    onClick={() => setRejectModalTechnician(null)}
                                    style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="action-btn action-btn--reject"
                                    onClick={confirmRejectTechnician}
                                    disabled={actionLoadingId === (rejectModalTechnician.technicianId || rejectModalTechnician.id)}
                                    style={{
                                        width: "auto",
                                        minWidth: "150px",
                                        padding: "0.6rem 1.25rem",
                                        height: "auto",
                                        borderRadius: "8px",
                                        fontWeight: 600,
                                        fontSize: "0.875rem",
                                        whiteSpace: "nowrap",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer"
                                    }}
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Manage_technicians;