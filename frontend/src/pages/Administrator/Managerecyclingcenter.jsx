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
    FiCpu,
    FiPackage,
    FiGrid,
    FiList
} from "react-icons/fi";
import "./Manage_users.css";

function Managerecyclingcenter() {
    const [centers, setCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

    // Deactivate Modal state & live validation
    const [showDeactivate, setShowDeactivate] = useState(false);
    const [selectedCenter, setSelectedCenter] = useState(null);
    const [reason, setReason] = useState("");
    const [reasonError, setReasonError] = useState("");
    const [reasonTouched, setReasonTouched] = useState(false);
    const [deactivating, setDeactivating] = useState(false);

    // View Profile Detail Modal state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [viewCenter, setViewCenter] = useState(null);

    const [fetchError, setFetchError] = useState("");

    useEffect(() => {
        fetchCenters();
    }, []);

    // Status check helper functions that handle whitespace and case variations
    const isPendingStatus = (status) => {
        const s = (status || "").toString().trim().toLowerCase();
        return s === "pending" || s.startsWith("pending") || s.includes("request");
    };

    const isActiveStatus = (status) => {
        const s = (status || "").toString().trim().toLowerCase();
        return s === "active" || s === "approved" || s.startsWith("active");
    };

    const isInactiveStatus = (status) => {
        const s = (status || "").toString().trim().toLowerCase();
        return s === "inactive" || s === "rejected" || s.startsWith("inactive");
    };

    const fetchCenters = async () => {
        setLoading(true);
        setFetchError("");
        try {
            let response;
            try {
                response = await axios.get(
                    "https://ecocycle.runasp.net/api/RecyclingCenter/All"
                );
            } catch (e) {
                response = await axios.get(
                    "https://ecocycle.runasp.net/api/RecyclingCenter/alluser"
                );
            }
            setCenters(response.data || []);
        } catch (error) {
            console.error("Error fetching recycling centers:", error.response?.data || error.message);
            setFetchError(error.response?.data?.message || "Failed to load recycling center accounts.");
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

    const openDeactivateModal = (center) => {
        setSelectedCenter(center);
        setReason("");
        setReasonError("");
        setReasonTouched(false);
        setShowDeactivate(true);
    };

    const openDetailModal = (center) => {
        setViewCenter(center);
        setShowDetailModal(true);
    };

    const deactivateCenter = async () => {
        const err = validateReason(reason);
        setReasonTouched(true);
        setReasonError(err);

        if (err) {
            return;
        }

        setDeactivating(true);
        try {
            await axios.post(
                `https://ecocycle.runasp.net/api/RecyclingCenter/deactivate/${selectedCenter.recyclingCenterId}`,
                null,
                {
                    params: {
                        reason: reason.trim()
                    }
                }
            );

            setShowDeactivate(false);
            setSelectedCenter(null);
            setReason("");
            setReasonError("");
            setReasonTouched(false);
            fetchCenters();
        } catch (error) {
            console.error("Error deactivating recycling center:", error);
        } finally {
            setDeactivating(false);
        }
    };

    const activateCenter = async (id) => {
        try {
            await axios.post(
                `https://ecocycle.runasp.net/api/RecyclingCenter/activate/${id}`
            );
            fetchCenters();
        } catch (error) {
            console.error("Error activating recycling center:", error);
        }
    };

    const acceptCenter = async (id) => {
        try {
            await axios.post(
                `https://ecocycle.runasp.net/api/RecyclingCenter/Accept/${id}`
            );
            fetchCenters();
        } catch (error) {
            console.error("Error accepting recycling center:", error);
            alert(error.response?.data?.message || "Failed to accept recycling center.");
        }
    };

    // Live Rejection Modal state & validation
    const [rejectModalCenter, setRejectModalCenter] = useState(null);
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

    const openRejectModal = (center) => {
        setRejectModalCenter(center);
        setRejectReason("");
        setRejectReasonError("");
        setRejectReasonTouched(false);
    };

    const confirmRejectCenter = async () => {
        const err = validateRejectionReason(rejectReason);
        setRejectReasonTouched(true);
        setRejectReasonError(err);
        if (err || !rejectModalCenter) return;

        setRejecting(true);
        const centerId = rejectModalCenter.recyclingCenterId || rejectModalCenter.id;
        try {
            await axios.post(
                `https://ecocycle.runasp.net/api/RecyclingCenter/Reject/${centerId}`,
                null,
                { params: { reason: rejectReason.trim() } }
            );
            setRejectModalCenter(null);
            setRejectReason("");
            fetchCenters();
        } catch (error) {
            console.error("Error rejecting recycling center:", error);
            alert(error.response?.data?.message || "Failed to reject recycling center.");
        } finally {
            setRejecting(false);
        }
    };

    // Statistics across all registered centers
    const totalCentersCount = centers.length;
    const pendingCentersCount = centers.filter(c => isPendingStatus(c.status)).length;
    const activeCentersCount = centers.filter(c => isActiveStatus(c.status)).length;
    const inactiveCentersCount = centers.filter(c => isInactiveStatus(c.status)).length;

    // Filter recycling centers
    const filteredCenters = centers.filter((center) => {
        const matchesSearch =
            (center.centerName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (center.ownerName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (center.login?.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (center.phoneNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (center.city?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (center.state?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (center.recyclerRegistrationNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (center.gstNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase());

        const matchesStatus =
            activeFilter === "All" ||
            (activeFilter === "Pending" && isPendingStatus(center.status)) ||
            (activeFilter === "Active" && isActiveStatus(center.status)) ||
            (activeFilter === "Inactive" && isInactiveStatus(center.status));

        return matchesSearch && matchesStatus;
    });

    const getPhotoSrc = (center) => {
        if (!center?.centerPhoto) return null;
        if (center.centerPhoto.startsWith("http")) return center.centerPhoto;
        return `https://ecocycle.runasp.net/uploads/recycling/Center Photo/${center.centerPhoto}`;
    };

    const getInitials = (centerName, ownerName) => {
        if (centerName) {
            const parts = centerName.trim().split(" ");
            if (parts.length >= 2) {
                return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
            }
            return centerName.substring(0, 2).toUpperCase();
        }
        if (ownerName) {
            return ownerName.substring(0, 2).toUpperCase();
        }
        return "RC";
    };

    const getStatusBadge = (status) => {
        if (isPendingStatus(status)) {
            return (
                <span className="status-pill status-pill--pending">
                    <span className="status-beacon"></span>Pending
                </span>
            );
        }
        if (isInactiveStatus(status)) {
            return (
                <span className="status-pill status-pill--rejected">
                    <span className="status-beacon"></span>Inactive
                </span>
            );
        }
        return (
            <span className="status-pill status-pill--completed">
                <span className="status-beacon"></span>Active
            </span>
        );
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
                            <h1>Manage Recycling Centers</h1>
                        </div>
                        <p className="command-subtitle">
                            Oversee recycling center accounts, view details, and manage active status
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search recycling centers..."
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
                            <FiRefreshCw />
                        </div>
                        <div className="stat-content">
                            <h4>Total Centers</h4>
                            <p className="stat-value">{totalCentersCount}</p>
                        </div>
                    </div>

                    <div className="stat-card-v2">
                        <div className="stat-icon-wrapper amber" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#d97706" }}>
                            <FiShield />
                        </div>
                        <div className="stat-content">
                            <h4>Pending Requests</h4>
                            <p className="stat-value">{pendingCentersCount}</p>
                        </div>
                    </div>

                    <div className="stat-card-v2">
                        <div className="stat-icon-wrapper emerald">
                            <FiUserCheck />
                        </div>
                        <div className="stat-content">
                            <h4>Active Accounts</h4>
                            <p className="stat-value">{activeCentersCount}</p>
                        </div>
                    </div>

                    <div className="stat-card-v2">
                        <div className="stat-icon-wrapper rose" style={{ background: "rgba(225, 29, 72, 0.1)", color: "#e11d48" }}>
                            <FiUserX />
                        </div>
                        <div className="stat-content">
                            <h4>Inactive Accounts</h4>
                            <p className="stat-value">{inactiveCentersCount}</p>
                        </div>
                    </div>
                </div>

                {/* Main Table Panel */}
                <section className="panel-card">
                    <div className="panel-header">
                        <div>
                            <h3 className="panel-title">Recycling Centers List</h3>
                            <p className="panel-subtitle">View and manage recycling center accounts</p>
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
                            <p>Loading recycling center accounts...</p>
                        </div>
                    ) : filteredCenters.length === 0 ? (
                        <div className="no-data-state">
                            <FiFilter className="no-data-icon" />
                            <p>No recycling centers matching your criteria.</p>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="admin-cards-grid">
                            {filteredCenters.map((center) => {
                                const photoSrc = getPhotoSrc(center);
                                const isActive = isActiveStatus(center.status);
                                const isPending = isPendingStatus(center.status);

                                return (
                                    <div key={center.recyclingCenterId} className="admin-pickup-card">
                                        <div>
                                            <div className="admin-card-header">
                                                <div className="admin-card-top-row">
                                                    <div className="admin-agent-avatar" style={{ width: "42px", height: "42px", fontSize: "1rem" }}>
                                                        {photoSrc ? (
                                                            <img src={photoSrc} alt={center.centerName} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                                                        ) : (
                                                            center.centerName?.charAt(0) || "R"
                                                        )}
                                                    </div>
                                                    <div>{getStatusBadge(center.status)}</div>
                                                </div>
                                                <div className="admin-card-title-group">
                                                    <h4 className="admin-card-brand-name">{center.centerName || "N/A"}</h4>
                                                    <p className="admin-card-cat-sub">
                                                        Center ID #{center.recyclingCenterId} &bull; Owner: {center.ownerName || "N/A"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="admin-card-body">
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.2rem" }}>
                                                    <div className="admin-detail-row">
                                                        <FiUser className="detail-icon" style={{ color: "#3b82f6" }} />
                                                        <div>
                                                            <div className="detail-label">Owner Name</div>
                                                            <div className="detail-val">{center.ownerName || "N/A"}</div>
                                                        </div>
                                                    </div>

                                                    <div className="admin-detail-row">
                                                        <FiMapPin className="detail-icon" style={{ color: "#059669" }} />
                                                        <div>
                                                            <div className="detail-label">Phone & Location</div>
                                                            <div className="detail-val">{center.phoneNumber || "N/A"}</div>
                                                            {center.city && (
                                                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                                                    {center.city}{center.state ? `, ${center.state}` : ""}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px dashed #e2e8f0" }}>
                                            <button
                                                onClick={() => openDetailModal(center)}
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
                                                        onClick={() => acceptCenter(center.recyclingCenterId || center.id)}
                                                        title="Approve Account"
                                                    >
                                                        <FiCheck style={{ strokeWidth: 2.5 }} />
                                                    </button>
                                                    <button
                                                        className="action-btn action-btn--reject"
                                                        onClick={() => openRejectModal(center)}
                                                        title="Reject Account"
                                                    >
                                                        <FiX style={{ strokeWidth: 2.5 }} />
                                                    </button>
                                                </>
                                            ) : isActive ? (
                                                <button
                                                    onClick={() => openDeactivateModal(center)}
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
                                                    onClick={() => activateCenter(center.recyclingCenterId)}
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
                                        <th>RECYCLING CENTER</th>
                                        <th>OWNER</th>
                                        <th>PHONE</th>
                                        <th>LOCATION</th>
                                        <th>STATUS</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCenters.map((center) => {
                                        const photoSrc = getPhotoSrc(center);
                                        const isActive = isActiveStatus(center.status);
                                        const isPending = isPendingStatus(center.status);

                                        return (
                                            <tr key={center.recyclingCenterId} className="table-row-hover">
                                                {/* CENTER COLUMN */}
                                                <td>
                                                    <div className="user-profile-cell">
                                                        {photoSrc ? (
                                                            <img
                                                                src={photoSrc}
                                                                alt={center.centerName}
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
                                                            {getInitials(center.centerName, center.ownerName)}
                                                        </div>
                                                        <div className="user-info">
                                                            <span className="user-name">
                                                                {center.centerName}
                                                            </span>
                                                            <span className="user-email">
                                                                {center.login?.email || "No email"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* OWNER COLUMN */}
                                                <td className="contact-cell">
                                                    {center.ownerName || "N/A"}
                                                </td>

                                                {/* PHONE COLUMN */}
                                                <td className="phone-cell">
                                                    {center.phoneNumber || "N/A"}
                                                </td>

                                                {/* LOCATION COLUMN */}
                                                <td className="contact-cell">
                                                    {center.city ? `${center.city}${center.state ? `, ${center.state}` : ""}` : center.state || "N/A"}
                                                </td>

                                                {/* STATUS COLUMN */}
                                                <td>
                                                    {getStatusBadge(center.status)}
                                                </td>

                                                {/* ACTIONS COLUMN */}
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="action-btn action-btn--view"
                                                            onClick={() => openDetailModal(center)}
                                                            title="View Details"
                                                        >
                                                            <FiEye />
                                                        </button>

                                                        {isPending ? (
                                                            <>
                                                                <button
                                                                    className="action-btn action-btn--approve"
                                                                    onClick={() => acceptCenter(center.recyclingCenterId || center.id)}
                                                                    title="Approve Account"
                                                                >
                                                                    <FiCheck style={{ strokeWidth: 2.5 }} />
                                                                </button>
                                                                <button
                                                                    className="action-btn action-btn--reject"
                                                                    onClick={() => openRejectModal(center)}
                                                                    title="Reject Account"
                                                                >
                                                                    <FiX style={{ strokeWidth: 2.5 }} />
                                                                </button>
                                                            </>
                                                        ) : isActive ? (
                                                            <button
                                                                className="action-btn-text action-btn-text--deactivate"
                                                                onClick={() => openDeactivateModal(center)}
                                                            >
                                                                Deactivate
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="action-btn-text action-btn-text--activate"
                                                                onClick={() => activateCenter(center.recyclingCenterId)}
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
                {showDeactivate && selectedCenter && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <div className="modal-header">
                                <h3>
                                    <FiAlertTriangle style={{ color: "var(--rose)" }} /> Deactivate Recycling Center
                                </h3>
                                <button
                                    className="modal-close-btn"
                                    onClick={() => {
                                        setShowDeactivate(false);
                                        setSelectedCenter(null);
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
                                        {getPhotoSrc(selectedCenter) ? (
                                            <img
                                                src={getPhotoSrc(selectedCenter)}
                                                alt=""
                                                className="user-avatar-img"
                                            />
                                        ) : (
                                            <div className="user-avatar-mini">
                                                {getInitials(selectedCenter.centerName, selectedCenter.ownerName)}
                                            </div>
                                        )}
                                        <div className="user-info">
                                            <span className="user-name">
                                                {selectedCenter.centerName}
                                            </span>
                                            <span className="user-email">
                                                {selectedCenter.login?.email}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="warning-callout">
                                    <FiAlertTriangle style={{ minWidth: "16px", marginTop: "2px" }} />
                                    <span>
                                        Deactivating this recycling center will suspend their account access and send an official notification email.
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
                                        setSelectedCenter(null);
                                        setReason("");
                                        setReasonError("");
                                        setReasonTouched(false);
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="btn-danger"
                                    onClick={deactivateCenter}
                                    disabled={!reason.trim() || !!reasonError || deactivating}
                                >
                                    {deactivating ? "Deactivating..." : "Deactivate & Send Email"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW FULL PROFILE DETAIL MODAL */}
                {showDetailModal && viewCenter && (
                    <div className="modal-overlay" style={{ alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
                        <div className="modal-card" style={{ maxWidth: "1100px", width: "100%", borderRadius: "20px", background: "#ffffff", boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.35)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
                            {/* Fixed Modal Header */}
                            <div className="modal-header" style={{ padding: "1.25rem 1.75rem", background: "#ffffff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                    <FiShield style={{ color: "#2563eb", fontSize: "1.35rem" }} /> Recycling Center Profile & Details
                                </h3>
                                <button
                                    className="modal-close-btn"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setViewCenter(null);
                                    }}
                                    style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b" }}
                                >
                                    <FiX style={{ fontSize: "1.1rem" }} />
                                </button>
                            </div>

                            {/* Scrollable Modal Body */}
                            <div className="modal-body" style={{ padding: "1.5rem 1.75rem", overflowY: "auto", flex: 1 }}>
                                {/* Top Center Profile Summary Bar */}
                                <div className="user-summary-box" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", borderRadius: "14px", padding: "1.25rem 1.5rem", border: "1px solid #cbd5e1", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div className="user-profile-cell" style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                                        {getPhotoSrc(viewCenter) ? (
                                            <img
                                                src={getPhotoSrc(viewCenter)}
                                                alt=""
                                                className="user-avatar-img"
                                                style={{ width: "60px", height: "60px", borderRadius: "14px", objectFit: "cover", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                                            />
                                        ) : (
                                            <div className="user-avatar-mini" style={{ width: "60px", height: "60px", borderRadius: "14px", fontSize: "1.35rem", fontWeight: 700 }}>
                                                {getInitials(viewCenter.centerName, viewCenter.ownerName)}
                                            </div>
                                        )}
                                        <div className="user-info">
                                            <span className="user-name" style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                                                {viewCenter.centerName}
                                            </span>
                                            <span className="user-email" style={{ fontSize: "0.875rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                                                {viewCenter.login?.email || "N/A"}
                                                <span style={{ padding: "0.15rem 0.5rem", borderRadius: "6px", background: "#e2e8f0", color: "#334155", fontWeight: 700, fontSize: "0.75rem" }}>
                                                    ID: #RC-{viewCenter.recyclingCenterId}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        {getStatusBadge(viewCenter.status)}
                                    </div>
                                </div>

                                {/* 2-COLUMN SIDE-BY-SIDE GRID */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: "1.5rem" }}>
                                    {/* LEFT SIDE: Center Information & Processes */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                        {/* Center Information Card */}
                                        <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", borderRadius: "16px", padding: "1.35rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", paddingBottom: "0.6rem", borderBottom: "1px solid #f1f5f9" }}>
                                                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                                                    <FiRefreshCw />
                                                </div>
                                                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", margin: 0, letterSpacing: "0.02em" }}>
                                                    Center Information
                                                </h4>
                                            </div>

                                            <div className="detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                                <div className="detail-item" style={{ gridColumn: "span 2" }}>
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Center Name</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewCenter.centerName || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Owner Name</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewCenter.ownerName || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Phone Number</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewCenter.phoneNumber || "N/A"}</span>
                                                </div>
                                                <div className="detail-item" style={{ gridColumn: "span 2" }}>
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Email Address</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewCenter.login?.email || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Business Reg. No.</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>{viewCenter.businessRegistrationNumber || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Recycler Reg. No.</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>{viewCenter.recyclerRegistrationNumber || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>GST Number</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a", fontFamily: "monospace" }}>{viewCenter.gstNumber || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Experience</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewCenter.experienceYears !== undefined && viewCenter.experienceYears !== null ? `${viewCenter.experienceYears} Years` : "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Pickup Available</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewCenter.pickupAvailable || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Hazardous Waste Handling</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewCenter.hazardousWasteHandling || "N/A"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Processes & Material Capabilities Card */}
                                        <div style={{ background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", borderRadius: "16px", padding: "1.35rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", paddingBottom: "0.6rem", borderBottom: "1px solid #f1f5f9" }}>
                                                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#f3e8ff", color: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                                                    <FiPackage />
                                                </div>
                                                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", margin: 0, letterSpacing: "0.02em" }}>
                                                    Processes & Materials Capabilities
                                                </h4>
                                            </div>

                                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                                <div>
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.4rem" }}>Device Types Accepted</label>
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                                        {viewCenter.deviceTypes ? (
                                                            viewCenter.deviceTypes.split(",").map((item, idx) => (
                                                                <span key={idx} style={{ padding: "0.3rem 0.6rem", borderRadius: "8px", background: "#eff6ff", color: "#1d4ed8", fontSize: "0.8rem", fontWeight: 600 }}>
                                                                    {item.trim()}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span style={{ fontSize: "0.925rem", color: "#64748b" }}>N/A</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.4rem" }}>Recycling Processes</label>
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                                        {viewCenter.recyclingProcesses ? (
                                                            viewCenter.recyclingProcesses.split(",").map((item, idx) => (
                                                                <span key={idx} style={{ padding: "0.3rem 0.6rem", borderRadius: "8px", background: "#f0fdf4", color: "#15803d", fontSize: "0.8rem", fontWeight: 600 }}>
                                                                    {item.trim()}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span style={{ fontSize: "0.925rem", color: "#64748b" }}>N/A</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {viewCenter.recoveredMaterials && (
                                                    <div>
                                                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.4rem" }}>Recovered Materials</label>
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                                            {viewCenter.recoveredMaterials.split(",").map((item, idx) => (
                                                                <span key={idx} style={{ padding: "0.3rem 0.6rem", borderRadius: "8px", background: "#fff7ed", color: "#c2410c", fontSize: "0.8rem", fontWeight: 600 }}>
                                                                    {item.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {viewCenter.hazardousWasteTypes && (
                                                    <div>
                                                        <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.4rem" }}>Hazardous Waste Types</label>
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                                                            {viewCenter.hazardousWasteTypes.split(",").map((item, idx) => (
                                                                <span key={idx} style={{ padding: "0.3rem 0.6rem", borderRadius: "8px", background: "#fef2f2", color: "#b91c1c", fontSize: "0.8rem", fontWeight: 600 }}>
                                                                    {item.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT SIDE: Address & Verification Documents */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                        {/* Address & Location Card */}
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
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Building Number</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewCenter.buildingNumber || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Street</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewCenter.street || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>City</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewCenter.city || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>District</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewCenter.district || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>State</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewCenter.state || "N/A"}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>Pincode</label>
                                                    <span style={{ fontSize: "0.925rem", fontWeight: 600, color: "#0f172a" }}>{viewCenter.pincode || "N/A"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Verification Documents Card */}
                                        {(viewCenter.businessRegistrationCertificate || viewCenter.recyclerRegistrationCertificate || viewCenter.consentToOperate || viewCenter.hazardousWasteAuthorization || viewCenter.addressProof || viewCenter.authorizedPersonId || viewCenter.centerPhoto) && (
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
                                                    {viewCenter.businessRegistrationCertificate && (
                                                        <a
                                                            href={`https://ecocycle.runasp.net/uploads/recycling/buisness registration certificate/${viewCenter.businessRegistrationCertificate}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="document-link-btn"
                                                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "10px", background: "#ffffff", color: "#2563eb", fontSize: "0.825rem", fontWeight: 700, textDecoration: "none", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}
                                                        >
                                                            Business Reg Cert ↗
                                                        </a>
                                                    )}
                                                    {viewCenter.recyclerRegistrationCertificate && (
                                                        <a
                                                            href={`https://ecocycle.runasp.net/uploads/recycling/recycler registration certificate/${viewCenter.recyclerRegistrationCertificate}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="document-link-btn"
                                                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "10px", background: "#ffffff", color: "#2563eb", fontSize: "0.825rem", fontWeight: 700, textDecoration: "none", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}
                                                        >
                                                            Recycler Reg Cert ↗
                                                        </a>
                                                    )}
                                                    {viewCenter.consentToOperate && (
                                                        <a
                                                            href={`https://ecocycle.runasp.net/uploads/recycling/Consent To Operate/${viewCenter.consentToOperate}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="document-link-btn"
                                                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "10px", background: "#ffffff", color: "#2563eb", fontSize: "0.825rem", fontWeight: 700, textDecoration: "none", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}
                                                        >
                                                            Consent To Operate ↗
                                                        </a>
                                                    )}
                                                    {viewCenter.hazardousWasteAuthorization && (
                                                        <a
                                                            href={`https://ecocycle.runasp.net/uploads/recycling/Hazardous Waste Authorization/${viewCenter.hazardousWasteAuthorization}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="document-link-btn"
                                                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "10px", background: "#ffffff", color: "#2563eb", fontSize: "0.825rem", fontWeight: 700, textDecoration: "none", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}
                                                        >
                                                            Hazardous Waste Auth ↗
                                                        </a>
                                                    )}
                                                    {viewCenter.addressProof && (
                                                        <a
                                                            href={`https://ecocycle.runasp.net/uploads/recycling/Address Proof/${viewCenter.addressProof}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="document-link-btn"
                                                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "10px", background: "#ffffff", color: "#2563eb", fontSize: "0.825rem", fontWeight: 700, textDecoration: "none", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}
                                                        >
                                                            Address Proof ↗
                                                        </a>
                                                    )}
                                                    {viewCenter.authorizedPersonId && (
                                                        <a
                                                            href={`https://ecocycle.runasp.net/uploads/recycling/AuthorizedPersonId/${viewCenter.authorizedPersonId}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="document-link-btn"
                                                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "10px", background: "#ffffff", color: "#2563eb", fontSize: "0.825rem", fontWeight: 700, textDecoration: "none", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}
                                                        >
                                                            Authorized Person ID ↗
                                                        </a>
                                                    )}
                                                    {viewCenter.centerPhoto && (
                                                        <a
                                                            href={`https://ecocycle.runasp.net/uploads/recycling/Center Photo/${viewCenter.centerPhoto}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="document-link-btn"
                                                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "10px", background: "#ffffff", color: "#2563eb", fontSize: "0.825rem", fontWeight: 700, textDecoration: "none", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}
                                                        >
                                                            Center Photo ↗
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Fixed Modal Footer */}
                            <div className="modal-footer" style={{ padding: "1rem 1.75rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexShrink: 0 }}>
                                <button
                                    className="btn-secondary"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setViewCenter(null);
                                    }}
                                    style={{ padding: "0.6rem 1.5rem", borderRadius: "10px", fontWeight: 600 }}
                                >
                                    Close
                                </button>
                                {isPendingStatus(viewCenter.status) && (
                                    <>
                                        <button
                                            onClick={() => {
                                                const id = viewCenter.recyclingCenterId || viewCenter.id;
                                                setShowDetailModal(false);
                                                setViewCenter(null);
                                                acceptCenter(id);
                                            }}
                                            style={{
                                                padding: "0.6rem 1.25rem",
                                                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                                                color: "#ffffff",
                                                border: "none",
                                                borderRadius: "10px",
                                                fontWeight: 700,
                                                fontSize: "0.875rem",
                                                cursor: "pointer"
                                            }}
                                        >
                                            Approve Center
                                        </button>
                                        <button
                                            onClick={() => {
                                                const id = viewCenter.recyclingCenterId || viewCenter.id;
                                                const target = viewCenter;
                                                setShowDetailModal(false);
                                                setViewCenter(null);
                                                openRejectModal(target);
                                            }}
                                            style={{
                                                padding: "0.6rem 1.25rem",
                                                background: "#fef2f2",
                                                color: "#dc2626",
                                                border: "1px solid #fca5a5",
                                                borderRadius: "10px",
                                                fontWeight: 700,
                                                fontSize: "0.875rem",
                                                cursor: "pointer"
                                            }}
                                        >
                                            Reject Center
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* REJECTION REASON MODAL */}
                {rejectModalCenter && (
                    <div className="modal-overlay">
                        <div className="modal-card modal-card--deactivate" style={{ maxWidth: "520px", padding: 0, overflow: "hidden" }}>
                            <div className="modal-header" style={{ padding: "1.25rem 1.5rem", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                                        <FiX />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#ffffff" }}>
                                            Reject Recycling Center Request
                                        </h3>
                                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
                                            {rejectModalCenter.centerName || "Selected Center"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setRejectModalCenter(null)}
                                    style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center" }}
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div style={{ padding: "1.5rem" }}>
                                <p style={{ fontSize: "0.875rem", color: "#475569", marginTop: 0, marginBottom: "1rem", lineHeight: 1.5 }}>
                                    Please specify the official reason for rejecting this recycling center application.
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
                                    onClick={() => setRejectModalCenter(null)}
                                    style={{ padding: "0.55rem 1.25rem", borderRadius: "8px", fontWeight: 600 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmRejectCenter}
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

export default Managerecyclingcenter;
