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
import "./Manage_collectionagent.css";

function Manage_collectionagent() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [rejectModalAgent, setRejectModalAgent] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectReasonError, setRejectReasonError] = useState("");
    const [rejectReasonTouched, setRejectReasonTouched] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPendingAgents();
    }, []);

    const fetchPendingAgents = async () => {
        try {
            const response = await axios.get(
                "https://localhost:7102/api/CollectionAgent/All"
            );

            setAgents(response.data || []);
        } catch (error) {
            console.error("Error fetching collection agents:", error);
            setError("Failed to load collection agent requests.");
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

    const openRejectModal = (agent) => {
        setRejectModalAgent(agent);
        setRejectReason("");
        setRejectReasonError("");
        setRejectReasonTouched(false);
    };

    const handleViewDetails = async (agent) => {
        const agentId = agent.collectionAgentId || agent.id;
        setSelectedAgent(agent);
        try {
            const response = await axios.get(
                `https://localhost:7102/api/CollectionAgent/${agentId}`
            );
            if (response.data) {
                setSelectedAgent(response.data);
            }
        } catch (err) {
            console.error("Error fetching collection agent details:", err);
        }
    };

    const acceptAgent = async (agentId) => {
        setActionLoadingId(agentId);
        try {
            await axios.post(
                `https://localhost:7102/api/CollectionAgent/Accept/${agentId}`
            );

            setAgents(prevAgents =>
                prevAgents.map(agent =>
                    (agent.collectionAgentId || agent.id) === agentId
                        ? { ...agent, status: "Active" }
                        : agent
                )
            );
            if (selectedAgent && (selectedAgent.collectionAgentId || selectedAgent.id) === agentId) {
                setSelectedAgent(prev => ({ ...prev, status: "Active" }));
            }
        } catch (error) {
            console.error("Error accepting collection agent:", error.response?.data || error.message);
            alert(error.response?.data?.message || "Failed to accept collection agent.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const confirmRejectAgent = async () => {
        if (!rejectModalAgent) return;

        const err = validateRejectionReason(rejectReason);
        setRejectReasonTouched(true);
        setRejectReasonError(err);
        if (err) {
            return;
        }

        const agentId = rejectModalAgent.collectionAgentId || rejectModalAgent.id;
        setActionLoadingId(agentId);

        try {
            await axios.post(
                `https://localhost:7102/api/CollectionAgent/Reject/${agentId}`,
                null,
                {
                    params: { reason: rejectReason.trim() }
                }
            );

            setAgents(prevAgents =>
                prevAgents.map(agent =>
                    (agent.collectionAgentId || agent.id) === agentId
                        ? { ...agent, status: "Rejected" }
                        : agent
                )
            );
            if (selectedAgent && (selectedAgent.collectionAgentId || selectedAgent.id) === agentId) {
                setSelectedAgent(prev => ({ ...prev, status: "Rejected" }));
            }
            setRejectModalAgent(null);
            setRejectReason("");
            setRejectReasonError("");
            setRejectReasonTouched(false);
        } catch (error) {
            console.error("Error rejecting collection agent:", error.response?.data || error.message);
            alert(error.response?.data?.message || "Failed to reject collection agent.");
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

    const getPhotoSrc = (agent) => {
        if (!agent?.profilePicture) return null;
        if (agent.profilePicture.startsWith("http")) return agent.profilePicture;
        return `https://localhost:7102/uploads/profile/${agent.profilePicture}`;
    };

    const getAadhaarProofPath = (agent) => {
        if (!agent?.adhaarProof) return null;
        if (agent.adhaarProof.startsWith("http")) return agent.adhaarProof;
        return `https://localhost:7102/uploads/aadhaar/${agent.adhaarProof}`;
    };

    const getInsurancePath = (agent) => {
        if (!agent?.vehicleInsurance) return null;
        if (agent.vehicleInsurance.startsWith("http")) return agent.vehicleInsurance;
        return `https://localhost:7102/uploads/insurance/${agent.vehicleInsurance}`;
    };

    const getPollutionPath = (agent) => {
        if (!agent?.vehiclePollution) return null;
        if (agent.vehiclePollution.startsWith("http")) return agent.vehiclePollution;
        return `https://localhost:7102/uploads/pollution/${agent.vehiclePollution}`;
    };

    const getVehiclePhotoPath = (agent) => {
        if (!agent?.vehiclePhoto) return null;
        if (agent.vehiclePhoto.startsWith("http")) return agent.vehiclePhoto;
        return `https://localhost:7102/uploads/vehicle/${agent.vehiclePhoto}`;
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

    const filteredAgents = agents.filter((agent) => {
        const fullName = `${agent.firstName || ""} ${agent.lastName || ""}`.trim();
        const matchesSearch =
            fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (agent.login?.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (agent.phone?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (agent.city?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (agent.vehicleType?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (agent.vehicleNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase());

        const statusStr = (agent.status || "").toLowerCase();
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
                            <h1>Manage Collection Agent Signups</h1>
                        </div>
                        <p className="command-subtitle">
                            Manage and oversee pending collection agent registration approvals
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search collection agents..."
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
                                <h3 className="panel-title">Collection Agent Requests</h3>
                                <p className="panel-subtitle">View and manage pending collection agent registrations</p>
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
                                <p>Loading collection agent requests...</p>
                            </div>
                        ) : error ? (
                            <div className="error-state">
                                <p>{error}</p>
                            </div>
                        ) : filteredAgents.length === 0 ? (
                            <div className="no-data-state">
                                <FiFilter className="no-data-icon" />
                                <p>No collection agent requests matching your criteria.</p>
                            </div>
                        ) : (
                            <div className="glass-table-wrapper">
                                <table className="glass-table">
                                    <thead>
                                        <tr>
                                            <th>Collection Agent</th>
                                            <th>Email</th>
                                            <th>Phone / Vehicle</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAgents.map((agent) => {
                                            const photoSrc = getPhotoSrc(agent);
                                            const fullName = `${agent.firstName || ""} ${agent.lastName || ""}`.trim() || "N/A";
                                            const agentId = agent.collectionAgentId || agent.id;
                                            const isActionLoading = actionLoadingId === agentId;

                                            return (
                                                <tr key={agentId} className="table-row-hover">
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
                                                                {agent.firstName?.charAt(0) || "C"}
                                                            </div>
                                                            <div className="user-info">
                                                                <span className="user-name">
                                                                    {fullName}
                                                                </span>
                                                                <span className="user-email">{agent.login?.email || "No email"}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="contact-cell">{agent.login?.email || "N/A"}</td>
                                                    <td className="phone-cell">
                                                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{agent.phone || "N/A"}</div>
                                                        {agent.vehicleType && (
                                                            <div style={{ fontSize: "0.775rem", color: "#64748b" }}>{agent.vehicleType} {agent.vehicleNumber ? `(${agent.vehicleNumber})` : ""}</div>
                                                        )}
                                                    </td>
                                                    <td>{getStatusBadge(agent.status)}</td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                className="action-btn action-btn--view"
                                                                onClick={() => handleViewDetails(agent)}
                                                                title="View Details"
                                                            >
                                                                <FiEye />
                                                            </button>
                                                            {agent.status?.toLowerCase() === "pending" && (
                                                                <>
                                                                    <button
                                                                        className="action-btn action-btn--approve"
                                                                        onClick={() => acceptAgent(agentId)}
                                                                        disabled={isActionLoading}
                                                                        title="Approve"
                                                                    >
                                                                        <FiCheck />
                                                                    </button>
                                                                    <button
                                                                        className="action-btn action-btn--reject"
                                                                        onClick={() => openRejectModal(agent)}
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

                {/* Collection Agent Details Modal */}
                {selectedAgent && (
                    <div className="modal-overlay" onClick={() => setSelectedAgent(null)}>
                        <div className="device-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "950px", width: "95%" }}>
                            <div className="modal-header">
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                    {getPhotoSrc(selectedAgent) ? (
                                        <img
                                            src={getPhotoSrc(selectedAgent)}
                                            alt="Profile"
                                            className="user-avatar-img"
                                            style={{ width: "50px", height: "50px", borderRadius: "12px", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <div className="user-avatar-mini" style={{ width: "50px", height: "50px", borderRadius: "12px", fontSize: "1.2rem" }}>
                                            {selectedAgent.firstName?.charAt(0) || "C"}
                                        </div>
                                    )}
                                    <div>
                                        <h2>{selectedAgent.firstName} {selectedAgent.lastName}</h2>
                                        <p className="panel-subtitle">Agent ID: #{selectedAgent.collectionAgentId || selectedAgent.id} | Email: {selectedAgent.login?.email || "N/A"}</p>
                                    </div>
                                </div>
                                <button className="modal-close-btn" onClick={() => setSelectedAgent(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="device-details-grid">
                                <div className="detail-item">
                                    <label>First Name</label>
                                    <span>{selectedAgent.firstName || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Last Name</label>
                                    <span>{selectedAgent.lastName || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Email Address</label>
                                    <span>{selectedAgent.login?.email || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Phone Number</label>
                                    <span>{selectedAgent.phone || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Alternate Phone</label>
                                    <span>{selectedAgent.alternatePhone || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Date of Birth</label>
                                    <span>{formatDate(selectedAgent.dob)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Gender</label>
                                    <span>{selectedAgent.gender || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Aadhaar Number</label>
                                    <span>{selectedAgent.adhaarNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Address</label>
                                    <span>{selectedAgent.address || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>City</label>
                                    <span>{selectedAgent.city || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>District</label>
                                    <span>{selectedAgent.district || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>State</label>
                                    <span>{selectedAgent.state || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Pin Code</label>
                                    <span>{selectedAgent.pincode || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Vehicle Type</label>
                                    <span>{selectedAgent.vehicleType || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Vehicle Number</label>
                                    <span>{selectedAgent.vehicleNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>License Number</label>
                                    <span>{selectedAgent.licenseNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Bank Account Holder</label>
                                    <span>{selectedAgent.accountHolder || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Bank Name</label>
                                    <span>{selectedAgent.bankName || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Account Number</label>
                                    <span>{selectedAgent.accountNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>IFSC Code</label>
                                    <span>{selectedAgent.ifscCode || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Status</label>
                                    <span>{getStatusBadge(selectedAgent.status)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Registration Date</label>
                                    <span>{formatDate(selectedAgent.createdAt)}</span>
                                </div>
                            </div>

                            {(getAadhaarProofPath(selectedAgent) || getInsurancePath(selectedAgent) || getPollutionPath(selectedAgent) || getVehiclePhotoPath(selectedAgent) || getPhotoSrc(selectedAgent)) && (
                                <div className="device-photos-section">
                                    <h4>Uploaded Verification Documents</h4>
                                    <div className="photos-grid">
                                        {getAadhaarProofPath(selectedAgent) && (
                                            <div className="photo-card">
                                                <a
                                                    href={getAadhaarProofPath(selectedAgent)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                >
                                                    Aadhaar Proof ↗
                                                </a>
                                            </div>
                                        )}
                                        {getInsurancePath(selectedAgent) && (
                                            <div className="photo-card">
                                                <a
                                                    href={getInsurancePath(selectedAgent)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                >
                                                    Vehicle Insurance ↗
                                                </a>
                                            </div>
                                        )}
                                        {getPollutionPath(selectedAgent) && (
                                            <div className="photo-card">
                                                <a
                                                    href={getPollutionPath(selectedAgent)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                >
                                                    Vehicle Pollution Cert ↗
                                                </a>
                                            </div>
                                        )}
                                        {getVehiclePhotoPath(selectedAgent) && (
                                            <div className="photo-card">
                                                <a
                                                    href={getVehiclePhotoPath(selectedAgent)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="document-link-btn"
                                                >
                                                    Vehicle Photo ↗
                                                </a>
                                            </div>
                                        )}
                                        {getPhotoSrc(selectedAgent) && (
                                            <div className="photo-card">
                                                <a
                                                    href={getPhotoSrc(selectedAgent)}
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
                {rejectModalAgent && (
                    <div className="modal-overlay" onClick={() => setRejectModalAgent(null)}>
                        <div className="device-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", width: "90%" }}>
                            <div className="modal-header">
                                <h2>Reject Application</h2>
                                <button className="modal-close-btn" onClick={() => setRejectModalAgent(null)}>
                                    <FiX />
                                </button>
                            </div>
                            <div style={{ padding: "1.5rem 0" }}>
                                <p style={{ marginBottom: "1rem", color: "#64748b", fontSize: "0.95rem" }}>
                                    Please provide a reason for rejecting <strong>{rejectModalAgent.firstName} {rejectModalAgent.lastName}</strong>. This reason will be emailed to the applicant.
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
                                    onClick={() => setRejectModalAgent(null)}
                                    style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="action-btn action-btn--reject"
                                    onClick={confirmRejectAgent}
                                    disabled={actionLoadingId === (rejectModalAgent.collectionAgentId || rejectModalAgent.id)}
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

export default Manage_collectionagent;