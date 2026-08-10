import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import {
    FiSearch,
    FiBell,
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
    FiRefreshCw
} from "react-icons/fi";
import "./Manage_users.css";

function Manage_users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

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
                "https://localhost:7102/api/User/alluser"
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
                `https://localhost:7102/api/User/deactivate/${selectedUser.userId}`,
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
                `https://localhost:7102/api/User/activate/${id}`
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
        if (user.profilePicture) return user.profilePicture;
        if (user.profilePic) return user.profilePic;
        if (user.image) return user.image;
        if (user.avatarUrl) return user.avatarUrl;
        return null;
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
                            <span className="command-badge">
                                <span className="live-dot"></span> SYSTEM ONLINE
                            </span>
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

                            <button className="refresh-icon-btn" onClick={fetchUsers} title="Refresh User Data">
                                <FiRefreshCw />
                            </button>
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
                                                alt=""
                                                className="user-avatar-img"
                                            />
                                        ) : (
                                            <div className="user-avatar-mini">
                                                {getInitials(selectedUser.firstName, selectedUser.lastName)}
                                            </div>
                                        )}
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
                                                alt=""
                                                className="user-avatar-img"
                                            />
                                        ) : (
                                            <div className="user-avatar-mini">
                                                {getInitials(viewUser.firstName, viewUser.lastName)}
                                            </div>
                                        )}
                                        <div className="user-info">
                                            <span className="user-name" style={{ fontSize: "1.05rem" }}>
                                                {viewUser.firstName} {viewUser.lastName}
                                            </span>
                                            <span className="user-email">
                                                {viewUser.login?.email || viewUser.email}
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
                                        <label>Phone Number</label>
                                        <span>{viewUser.phoneNumber || "N/A"}</span>
                                    </div>

                                    <div className="detail-item">
                                        <label>Gender</label>
                                        <span>{viewUser.gender || "N/A"}</span>
                                    </div>

                                    <div className="detail-item">
                                        <label>Date of Birth</label>
                                        <span>{formatDate(viewUser.dateOfBirth)}</span>
                                    </div>

                                    <div className="detail-item">
                                        <label>Pincode</label>
                                        <span>{viewUser.pincode || "N/A"}</span>
                                    </div>

                                    <div className="detail-item">
                                        <label>City</label>
                                        <span>{viewUser.city || "N/A"}</span>
                                    </div>

                                    <div className="detail-item">
                                        <label>District</label>
                                        <span>{viewUser.district || "N/A"}</span>
                                    </div>

                                    <div className="detail-item full-width-detail">
                                        <label>State</label>
                                        <span>{viewUser.state || "N/A"}</span>
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