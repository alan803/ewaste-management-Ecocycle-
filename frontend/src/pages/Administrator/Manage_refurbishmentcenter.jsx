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
import "./Manage_refurbishmentcenter.css";

function Manage_refurbishmentcenter() {
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [selectedCenter, setSelectedCenter] = useState(null);
    const [rejectModalCenter, setRejectModalCenter] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectReasonError, setRejectReasonError] = useState("");
    const [rejectReasonTouched, setRejectReasonTouched] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPendingCenters();
    }, []);

    const fetchPendingCenters = async () => {
        try {
            const response = await axios.get(
                "https://localhost:7102/api/RefurbishmentCenter/All"
            );

            setCenters(response.data || []);
        } catch (error) {
            console.error("Error fetching refurbishment centers:", error);
            setError("Failed to load refurbishment center requests.");
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

    const openRejectModal = (center) => {
        setRejectModalCenter(center);
        setRejectReason("");
        setRejectReasonError("");
        setRejectReasonTouched(false);
    };

    const handleViewDetails = async (center) => {
        const centerId = center.refurbishmentCenterId || center.id;
        setSelectedCenter(center);
        try {
            const response = await axios.get(
                `https://localhost:7102/api/RefurbishmentCenter/${centerId}`
            );
            if (response.data) {
                setSelectedCenter(response.data);
            }
        } catch (err) {
            console.error("Error fetching center details:", err);
        }
    };

    const acceptCenter = async (centerId) => {
        setActionLoadingId(centerId);
        try {
            await axios.post(
                `https://localhost:7102/api/RefurbishmentCenter/Accept/${centerId}`
            );

            setCenters(prevCenters =>
                prevCenters.map(center =>
                    (center.refurbishmentCenterId || center.id) === centerId
                        ? { ...center, status: "Active" }
                        : center
                )
            );
            if (selectedCenter && (selectedCenter.refurbishmentCenterId || selectedCenter.id) === centerId) {
                setSelectedCenter(prev => ({ ...prev, status: "Active" }));
            }
        } catch (error) {
            console.error("Error accepting refurbishment center:", error);
        } finally {
            setActionLoadingId(null);
        }
    };

    const confirmRejectCenter = async () => {
        if (!rejectModalCenter) return;

        const err = validateRejectionReason(rejectReason);
        setRejectReasonTouched(true);
        setRejectReasonError(err);
        if (err) {
            return;
        }

        const centerId = rejectModalCenter.refurbishmentCenterId || rejectModalCenter.id;
        setActionLoadingId(centerId);

        try {
            await axios.post(
                `https://localhost:7102/api/RefurbishmentCenter/Reject/${centerId}`,
                null,
                {
                    params: { reason: rejectReason.trim() }
                }
            );

            setCenters(prevCenters =>
                prevCenters.map(center =>
                    (center.refurbishmentCenterId || center.id) === centerId
                        ? { ...center, status: "Rejected" }
                        : center
                )
            );
            if (selectedCenter && (selectedCenter.refurbishmentCenterId || selectedCenter.id) === centerId) {
                setSelectedCenter(prev => ({ ...prev, status: "Rejected" }));
            }
            setRejectModalCenter(null);
            setRejectReason("");
            setRejectReasonError("");
            setRejectReasonTouched(false);
        } catch (error) {
            console.error("Error rejecting refurbishment center:", error);
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

    const getPhotoSrc = (center) => {
        if (!center?.centerPhoto) return null;
        if (center.centerPhoto.startsWith("http")) return center.centerPhoto;
        return `https://localhost:7102/uploads/refurbishment/center-photo/${center.centerPhoto}`;
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

    const filteredCenters = centers.filter((center) => {
        const matchesSearch =
            (center.centerName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (center.ownerName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (center.login?.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (center.phoneNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (center.city?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (center.state?.toLowerCase() || "").includes(searchQuery.toLowerCase());

        const statusStr = (center.status || "").toLowerCase();
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
                            <h1>Manage Refurbishment Center Signups</h1>
                        </div>
                        <p className="command-subtitle">
                            Manage and oversee pending refurbishment center registration approvals
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search refurbishment centers..."
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
                                <h3 className="panel-title">Refurbishment Center Requests</h3>
                                <p className="panel-subtitle">View and manage pending refurbishment center registrations</p>
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
                                <p>Loading refurbishment center requests...</p>
                            </div>
                        ) : error ? (
                            <div className="error-state">
                                <p>{error}</p>
                            </div>
                        ) : filteredCenters.length === 0 ? (
                            <div className="no-data-state">
                                <FiFilter className="no-data-icon" />
                                <p>No refurbishment center requests matching your criteria.</p>
                            </div>
                        ) : (
                            <div className="glass-table-wrapper">
                                <table className="glass-table">
                                    <thead>
                                        <tr>
                                            <th>Center</th>
                                            <th>Email</th>
                                            <th>Phone / Location</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCenters.map((center) => {
                                            const photoSrc = getPhotoSrc(center);
                                            const centerId = center.refurbishmentCenterId || center.id;
                                            const isActionLoading = actionLoadingId === centerId;

                                            return (
                                                <tr key={centerId} className="table-row-hover">
                                                    <td>
                                                        <div className="user-profile-cell">
                                                            {photoSrc ? (
                                                                <img
                                                                    src={photoSrc}
                                                                    alt="Center"
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
                                                                {center.centerName?.charAt(0) || "R"}
                                                            </div>
                                                            <div className="user-info">
                                                                <span className="user-name">
                                                                    {center.centerName || "N/A"}
                                                                </span>
                                                                <span className="user-email">{center.ownerName ? `Owner: ${center.ownerName}` : (center.login?.email || "No email")}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="contact-cell">{center.login?.email || "N/A"}</td>
                                                    <td className="phone-cell">
                                                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{center.phoneNumber || "N/A"}</div>
                                                        {center.city && (
                                                            <div style={{ fontSize: "0.775rem", color: "#64748b" }}>
                                                                {center.city}{center.state ? `, ${center.state}` : ""}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>{getStatusBadge(center.status)}</td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                className="action-btn action-btn--view"
                                                                onClick={() => handleViewDetails(center)}
                                                                title="View Details"
                                                            >
                                                                <FiEye />
                                                            </button>
                                                            {center.status?.toLowerCase() === "pending" && (
                                                                <>
                                                                    <button
                                                                        className="action-btn action-btn--approve"
                                                                        onClick={() => acceptCenter(centerId)}
                                                                        disabled={isActionLoading}
                                                                        title="Approve"
                                                                    >
                                                                        <FiCheck />
                                                                    </button>
                                                                    <button
                                                                        className="action-btn action-btn--reject"
                                                                        onClick={() => openRejectModal(center)}
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

                {/* Refurbishment Center Details Modal */}
                {selectedCenter && (
                    <div className="modal-overlay" onClick={() => setSelectedCenter(null)}>
                        <div className="device-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "950px", width: "95%" }}>
                            <div className="modal-header">
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                    {getPhotoSrc(selectedCenter) ? (
                                        <img
                                            src={getPhotoSrc(selectedCenter)}
                                            alt="Center"
                                            className="user-avatar-img"
                                            style={{ width: "50px", height: "50px", borderRadius: "12px", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <div className="user-avatar-mini" style={{ width: "50px", height: "50px", borderRadius: "12px", fontSize: "1.2rem" }}>
                                            {selectedCenter.centerName?.charAt(0) || "R"}
                                        </div>
                                    )}
                                    <div>
                                        <h2>{selectedCenter.centerName}</h2>
                                        <p className="panel-subtitle">Center ID: #{selectedCenter.refurbishmentCenterId || selectedCenter.id} | Email: {selectedCenter.login?.email || "N/A"}</p>
                                    </div>
                                </div>
                                <button className="modal-close-btn" onClick={() => setSelectedCenter(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="device-details-grid">
                                <div className="detail-item">
                                    <label>Center Name</label>
                                    <span>{selectedCenter.centerName || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Owner Name</label>
                                    <span>{selectedCenter.ownerName || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Email Address</label>
                                    <span>{selectedCenter.login?.email || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Phone Number</label>
                                    <span>{selectedCenter.phoneNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Business Reg. No.</label>
                                    <span>{selectedCenter.businessRegistrationNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>License Number</label>
                                    <span>{selectedCenter.licenseNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>GST Number</label>
                                    <span>{selectedCenter.gstNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Experience</label>
                                    <span>{selectedCenter.experienceYears !== undefined && selectedCenter.experienceYears !== null ? `${selectedCenter.experienceYears} Years` : "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Technician Count</label>
                                    <span>{selectedCenter.technicianCount !== undefined && selectedCenter.technicianCount !== null ? `${selectedCenter.technicianCount}` : "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Building Number</label>
                                    <span>{selectedCenter.buildingNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Street Address</label>
                                    <span>{selectedCenter.street || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>City</label>
                                    <span>{selectedCenter.city || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>District</label>
                                    <span>{selectedCenter.district || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>State</label>
                                    <span>{selectedCenter.state || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Pin Code</label>
                                    <span>{selectedCenter.pincode || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Device Types Handled</label>
                                    <span>{selectedCenter.deviceTypes || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Refurbishment Services</label>
                                    <span>{selectedCenter.services || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Pickup Available</label>
                                    <span>{selectedCenter.pickupAvailable || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Status</label>
                                    <span>{getStatusBadge(selectedCenter.status)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Registration Date</label>
                                    <span>{formatDate(selectedCenter.createdAt)}</span>
                                </div>
                            </div>

                            {(selectedCenter.businessRegistrationCertificate || selectedCenter.tradeLicense || selectedCenter.addressProof || selectedCenter.authorizedPersonId || getPhotoSrc(selectedCenter)) && (
                                <div className="device-photos-section">
                                    <h4>Uploaded Verification Documents</h4>
                                    <div className="photos-grid">
                                        {selectedCenter.businessRegistrationCertificate && (
                                            <div className="photo-card">
                                                <a
                                                    href={`https://localhost:7102/uploads/refurbishment/business-registration/${selectedCenter.businessRegistrationCertificate}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                >
                                                    Business Reg Cert ↗
                                                </a>
                                            </div>
                                        )}
                                        {selectedCenter.tradeLicense && (
                                            <div className="photo-card">
                                                <a
                                                    href={`https://localhost:7102/uploads/refurbishment/trade-license/${selectedCenter.tradeLicense}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                >
                                                    Trade License ↗
                                                </a>
                                            </div>
                                        )}
                                        {selectedCenter.addressProof && (
                                            <div className="photo-card">
                                                <a
                                                    href={`https://localhost:7102/uploads/refurbishment/address-proof/${selectedCenter.addressProof}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                >
                                                    Address Proof ↗
                                                </a>
                                            </div>
                                        )}
                                        {selectedCenter.authorizedPersonId && (
                                            <div className="photo-card">
                                                <a
                                                    href={`https://localhost:7102/uploads/refurbishment/authorized-person-id/${selectedCenter.authorizedPersonId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                >
                                                    Authorized Person ID ↗
                                                </a>
                                            </div>
                                        )}
                                        {getPhotoSrc(selectedCenter) && (
                                            <div className="photo-card">
                                                <a
                                                    href={getPhotoSrc(selectedCenter)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                >
                                                    Center Photo ↗
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
                {rejectModalCenter && (
                    <div className="modal-overlay" onClick={() => setRejectModalCenter(null)}>
                        <div className="device-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", width: "90%" }}>
                            <div className="modal-header">
                                <h2>Reject Application</h2>
                                <button className="modal-close-btn" onClick={() => setRejectModalCenter(null)}>
                                    <FiX />
                                </button>
                            </div>
                            <div style={{ padding: "1.5rem 0" }}>
                                <p style={{ marginBottom: "1rem", color: "#64748b", fontSize: "0.95rem" }}>
                                    Please provide a reason for rejecting <strong>{rejectModalCenter.centerName}</strong>. This reason will be emailed to the applicant.
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
                                    onClick={() => setRejectModalCenter(null)}
                                    style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="action-btn action-btn--reject"
                                    onClick={confirmRejectCenter}
                                    disabled={actionLoadingId === (rejectModalCenter.refurbishmentCenterId || rejectModalCenter.id)}
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

export default Manage_refurbishmentcenter;
