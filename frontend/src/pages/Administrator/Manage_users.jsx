import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import {
    FiSearch,
    FiLogOut,
    FiEye,
    FiCheck,
    FiX,
    FiFilter,
    FiUserCheck,
    FiUserX,
    FiUsers,
    FiShield,
    FiAlertTriangle,
    FiRefreshCw,
    FiGrid,
    FiList
} from "react-icons/fi";
import "./Manage_users.css";

function Manage_users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

    // Deactivate Modal state & live validation
    const [showDeactivate, setShowDeactivate] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [reason, setReason] = useState("");
    const [reasonError, setReasonError] = useState("");
    const [reasonTouched, setReasonTouched] = useState(false);
    const [deactivating, setDeactivating] = useState(false);

    // View Profile Detail Modal state
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [viewUser, setViewUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                "https://ecocycle.runasp.net/api/User/alluser"
            );
            setUsers(response.data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
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

    const openDeactivateModal = (user) => {
        setSelectedUser(user);
        setReason("");
        setReasonError("");
        setReasonTouched(false);
        setShowDeactivate(false);
        setShowDeactivate(true);
    };

    const openDetailModal = (user) => {
        setViewUser(user);
        setShowDetailModal(true);
    };

    const deactivateuser = async () => {
        const err = validateReason(reason);
        setReasonTouched(true);
        setReasonError(err);

        if (err) {
            return;
        }

        setDeactivating(true);
        try {
            const response = await axios.post(
                `https://ecocycle.runasp.net/api/User/deactivate/${selectedUser.userId}`,
                null,
                {
                    params: {
                        reason: reason.trim()
                    }
                }
            );

            setShowDeactivate(false);
            setSelectedUser(null);
            setReason("");
            setReasonError("");
            setReasonTouched(false);
            fetchUsers();
        } catch (error) {
            console.error("Error deactivating user:", error);
            // alert(
            //     error.response?.data?.message ||
            //     "Error deactivating user."
            // );
        } finally {
            setDeactivating(false);
        }
    };

    const activateuser = async (id) => {
        try {
            const response = await axios.post(
                `https://ecocycle.runasp.net/api/User/activate/${id}`
            );

            // alert(response.data.message || "User activated successfully.");
            fetchUsers();
        } catch (error) {
            console.error("Error activating user:", error);
            // alert("Error activating user.");
        }
    };

    // Statistics
    const totalUsersCount = users.length;
    const activeUsersCount = users.filter(u => u.status === "Active").length;
    const inactiveUsersCount = users.filter(u => u.status === "Inactive").length;

    // Filter users
    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            (user.firstName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (user.lastName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (user.login?.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (user.phoneNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (user.city?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (user.state?.toLowerCase() || "").includes(searchQuery.toLowerCase());

        const matchesStatus =
            activeFilter === "All" ||
            (user.status?.toLowerCase() || "") === activeFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    const getAvatarSrc = (user) => {
        if (!user) return null;
        const pic = user.profileImage || user.profilePicture || user.profilePic || user.image || user.avatarUrl;
        if (!pic) return null;
        if (pic.startsWith("http://") || pic.startsWith("https://") || pic.startsWith("data:")) {
            return pic;
        }
        if (pic.startsWith("/uploads/")) {
            return `https://ecocycle.runasp.net${pic}`;
        }
        return `https://ecocycle.runasp.net/uploads/profile/${pic}`;
    };

    const getInitials = (firstName, lastName) => {
        const f = firstName ? firstName.charAt(0).toUpperCase() : "";
        const l = lastName ? lastName.charAt(0).toUpperCase() : "";
        return `${f}${l}` || "U";
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            return new Date(dateStr).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            });
        } catch (e) {
            return dateStr;
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
                            <h1>Manage Registered Users</h1>
                        </div>
                        <p className="command-subtitle">
                            Oversee citizen user accounts, view details, and manage user statuses
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
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

                {/* Header Metrics */}
                <div className="stats-overview-grid">
                    <div className="stat-card-v2">
                        <div className="stat-icon-wrapper indigo">
                            <FiUsers />
                        </div>
                        <div className="stat-content">
                            <h4>Total Users</h4>
                            <p className="stat-value">{totalUsersCount}</p>
                        </div>
                    </div>

                    <div className="stat-card-v2">
                        <div className="stat-icon-wrapper emerald">
                            <FiUserCheck />
                        </div>
                        <div className="stat-content">
                            <h4>Active Accounts</h4>
                            <p className="stat-value">{activeUsersCount}</p>
                        </div>
                    </div>

                    <div className="stat-card-v2">
                        <div className="stat-icon-wrapper amber">
                            <FiUserX />
                        </div>
                        <div className="stat-content">
                            <h4>Inactive Accounts</h4>
                            <p className="stat-value">{inactiveUsersCount}</p>
                        </div>
                    </div>
                </div>

                {/* Main Table Panel */}
                <section className="panel-card">
                    <div className="panel-header">
                        <div>
                            <h3 className="panel-title">Users List</h3>
                            <p className="panel-subtitle">View and manage registered user accounts</p>
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
                            <p>Loading user accounts...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="no-data-state">
                            <FiFilter className="no-data-icon" />
                            <p>No user accounts matching your criteria.</p>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="admin-cards-grid">
                            {filteredUsers.map((user) => {
                                const avatarSrc = getAvatarSrc(user);
                                const isActive = user.status === "Active";

                                return (
                                    <div key={user.userId} className="admin-pickup-card">
                                        <div>
                                            <div className="admin-card-header">
                                                <div className="admin-card-top-row">
                                                    <div className="admin-cat-icon-box" style={{ background: "#ecfdf5", color: "#059669" }}>
                                                        <FiUsers />
                                                    </div>
                                                    <div>{getStatusBadge(user.status)}</div>
                                                </div>
                                                <div className="admin-card-title-group">
                                                    <h4 className="admin-card-brand-name">{user.firstName} {user.lastName}</h4>
                                                    <p className="admin-card-cat-sub">
                                                        ID #{user.userId} &bull; Citizen User
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="admin-card-body">
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.2rem" }}>
                                                    <div className="admin-detail-row">
                                                        <FiUserCheck className="detail-icon" style={{ color: "#3b82f6" }} />
                                                        <div>
                                                            <div className="detail-label">Email Address</div>
                                                            <div className="detail-val">{user.login?.email || user.email || "N/A"}</div>
                                                        </div>
                                                    </div>

                                                    <div className="admin-detail-row">
                                                        <FiShield className="detail-icon" style={{ color: "#059669" }} />
                                                        <div>
                                                            <div className="detail-label">Phone Number</div>
                                                            <div className="detail-val">{user.phoneNumber || "N/A"}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px dashed #e2e8f0" }}>
                                            <button
                                                onClick={() => openDetailModal(user)}
                                                title="View Profile Details"
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

                                            {isActive ? (
                                                <button
                                                    onClick={() => openDeactivateModal(user)}
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
                                                    <FiX style={{ fontSize: "0.95rem" }} />
                                                    <span>Deactivate</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => activateuser(user.userId)}
                                                    title="Activate Account"
                                                    style={{
                                                        flex: 1,
                                                        height: "40px",
                                                        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                                                        color: "#ffffff",
                                                        border: "none",
                                                        borderRadius: "10px",
                                                        fontSize: "0.825rem",
                                                        fontWeight: 700,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "0.4rem",
                                                        cursor: "pointer",
                                                        boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)"
                                                    }}
                                                >
                                                    <FiCheck style={{ fontSize: "0.95rem" }} />
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
                                        <th>USER</th>
                                        <th>CONTACT</th>
                                        <th>PHONE</th>
                                        <th>STATUS</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => {
                                        const avatarSrc = getAvatarSrc(user);
                                        const isActive = user.status === "Active";

                                        return (
                                            <tr key={user.userId} className="table-row-hover">
                                                {/* USER COLUMN */}
                                                <td>
                                                    <div className="user-profile-cell">
                                                        {avatarSrc ? (
                                                            <img
                                                                src={avatarSrc}
                                                                alt={`${user.firstName} ${user.lastName}`}
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
                                                            style={{ display: avatarSrc ? "none" : "flex" }}
                                                        >
                                                            {getInitials(user.firstName, user.lastName)}
                                                        </div>
                                                        <div className="user-info">
                                                            <span className="user-name">
                                                                {user.firstName} {user.lastName}
                                                            </span>
                                                            <span className="user-email">
                                                                {user.login?.email || user.email || "No email"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* CONTACT COLUMN */}
                                                <td className="contact-cell">
                                                    {user.login?.email || user.email || "N/A"}
                                                </td>

                                                {/* PHONE COLUMN */}
                                                <td className="phone-cell">
                                                    {user.phoneNumber || "N/A"}
                                                </td>

                                                {/* STATUS COLUMN */}
                                                <td>
                                                    {getStatusBadge(user.status)}
                                                </td>

                                                {/* ACTIONS COLUMN */}
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="action-btn action-btn--view"
                                                            onClick={() => openDetailModal(user)}
                                                            title="View User Details"
                                                        >
                                                            <FiEye />
                                                        </button>

                                                        {isActive ? (
                                                            <button
                                                                className="action-btn-text action-btn-text--deactivate"
                                                                onClick={() => openDeactivateModal(user)}
                                                            >
                                                                Deactivate
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="action-btn-text action-btn-text--activate"
                                                                onClick={() => activateuser(user.userId)}
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
                {showDeactivate && selectedUser && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <div className="modal-header">
                                <h3>
                                    <FiAlertTriangle style={{ color: "var(--rose)" }} /> Deactivate User Account
                                </h3>
                                <button
                                    className="modal-close-btn"
                                    onClick={() => {
                                        setShowDeactivate(false);
                                        setSelectedUser(null);
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
                                        {getAvatarSrc(selectedUser) ? (
                                            <img
                                                src={getAvatarSrc(selectedUser)}
                                                alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
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
                                            style={{ display: getAvatarSrc(selectedUser) ? "none" : "flex" }}
                                        >
                                            {getInitials(selectedUser.firstName, selectedUser.lastName)}
                                        </div>
                                        <div className="user-info">
                                            <span className="user-name">
                                                {selectedUser.firstName} {selectedUser.lastName}
                                            </span>
                                            <span className="user-email">
                                                {selectedUser.login?.email || selectedUser.email}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="warning-callout">
                                    <FiAlertTriangle style={{ minWidth: "16px", marginTop: "2px" }} />
                                    <span>
                                        Deactivating this user will suspend their account access and send an official notification email.
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
                                        setSelectedUser(null);
                                        setReason("");
                                        setReasonError("");
                                        setReasonTouched(false);
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="btn-danger"
                                    onClick={deactivateuser}
                                    disabled={!reason.trim() || !!reasonError || deactivating}
                                >
                                    {deactivating ? "Deactivating..." : "Deactivate & Send Email"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW FULL PROFILE DETAIL MODAL */}
                {showDetailModal && viewUser && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <div className="modal-header">
                                <h3>
                                    <FiShield style={{ color: "var(--primary)" }} /> User Details
                                </h3>
                                <button
                                    className="modal-close-btn"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setViewUser(null);
                                    }}
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="user-summary-box">
                                    <div className="user-profile-cell">
                                        {getAvatarSrc(viewUser) ? (
                                            <img
                                                src={getAvatarSrc(viewUser)}
                                                alt={`${viewUser.firstName} ${viewUser.lastName}`}
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
                                            style={{ display: getAvatarSrc(viewUser) ? "none" : "flex" }}
                                        >
                                            {getInitials(viewUser.firstName, viewUser.lastName)}
                                        </div>
                                        <div className="user-info">
                                            <span className="user-name" style={{ fontSize: "1.05rem" }}>
                                                {viewUser.firstName} {viewUser.lastName}
                                            </span>
                                            <span className="user-email">
                                                {viewUser.login?.email || viewUser.email || "No email"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>User ID</label>
                                        <span>#USR-{viewUser.userId}</span>
                                    </div>

                                    <div className="detail-item">
                                        <label>Account Status</label>
                                        <span style={{ color: viewUser.status === "Active" ? "#047857" : "#e11d48" }}>
                                            {viewUser.status}
                                        </span>
                                    </div>

                                    <div className="detail-item">
                                        <label>Gender</label>
                                        <span style={{ textTransform: "capitalize" }}>{viewUser.gender || "N/A"}</span>
                                    </div>

                                    <div className="detail-item">
                                        <label>Date of Birth</label>
                                        <span>{formatDate(viewUser.dateOfBirth)}</span>
                                    </div>

                                    <div className="detail-item">
                                        <label>Phone Number</label>
                                        <span>{viewUser.phoneNumber || "N/A"}</span>
                                    </div>

                                    <div className="detail-item">
                                        <label>Registered Date</label>
                                        <span>{formatDate(viewUser.createdAt)}</span>
                                    </div>

                                    <div className="detail-item full-width-detail">
                                        <label>Email Address</label>
                                        <span>{viewUser.login?.email || viewUser.email || "N/A"}</span>
                                    </div>

                                    <div className="detail-item">
                                        <label>City</label>
                                        <span>{viewUser.city || "N/A"}</span>
                                    </div>

                                    <div className="detail-item">
                                        <label>District</label>
                                        <span>{viewUser.district || "N/A"}</span>
                                    </div>

                                    <div className="detail-item">
                                        <label>State</label>
                                        <span>{viewUser.state || "N/A"}</span>
                                    </div>

                                    <div className="detail-item">
                                        <label>Pincode</label>
                                        <span>{viewUser.pincode || "N/A"}</span>
                                    </div>

                                    <div className="detail-item full-width-detail">
                                        <label>Full Address</label>
                                        <span>{viewUser.address || "N/A"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    className="btn-secondary"
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setViewUser(null);
                                    }}
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

export default Manage_users;