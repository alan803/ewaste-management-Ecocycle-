import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import {
    FiSearch,
    FiBell,
    FiLogOut,
    FiArrowLeft,
    FiCheck,
    FiX,
    FiUser,
    FiMapPin,
    FiBriefcase,
    FiShield,
    FiFileText,
    FiAward,
    FiHome,
    FiCpu,
    FiRefreshCw,
    FiTruck,
    FiAlertTriangle
} from "react-icons/fi";
import "./View_recyclingagent.css";

function View_recyclingagent() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState("");

    useEffect(() => {
        fetchAgent();
    }, [id]);

    const fetchAgent = async () => {
        try {
            const response = await axios.get(
                `https://localhost:7102/api/RecyclingCenter/${id}`
            );
            console.log("Recycling center details:", response.data);
            setAgent(response.data);
        } catch (error) {
            console.error("Error fetching recycling center:", error);
            setError("Failed to load recycling center details.");
        } finally {
            setLoading(false);
        }
    };

    const acceptAgent = async () => {
        setActionLoading("accept");
        try {
            await axios.post(
                `https://localhost:7102/api/RecyclingCenter/Accept/${id}`
            );
            setAgent(prev => ({ ...prev, status: "Active" }));
            navigate("/manage-recyclingcenter");
        } catch (error) {
            console.error("Error accepting recycling center:", error);
        } finally {
            setActionLoading("");
        }
    };

    const rejectAgent = async () => {
        setActionLoading("reject");
        try {
            await axios.post(
                `https://localhost:7102/api/RecyclingCenter/Reject/${id}`
            );
            setAgent(prev => ({ ...prev, status: "Rejected" }));
            navigate("/manage-recyclingcenter");
        } catch (error) {
            console.error("Error rejecting recycling center:", error);
        } finally {
            setActionLoading("");
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return <span className="status-badge status-badge--pending"><span className="status-dot"></span>Pending</span>;
            case "approved":
            case "active":
                return <span className="status-badge status-badge--approved"><span className="status-dot"></span>Active</span>;
            case "rejected":
                return <span className="status-badge status-badge--rejected"><span className="status-dot"></span>Rejected</span>;
            default:
                return <span className="status-badge">{status || "Unknown"}</span>;
        }
    };

    if (loading) {
        return (
            <div className="admin-dashboard-v2">
                <Navbar />
                <div className="admin-main-container">
                    <div className="ambient-glow ambient-glow--1"></div>
                    <div className="ambient-glow ambient-glow--2"></div>
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading Recycling Center details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-dashboard-v2">
                <Navbar />
                <div className="admin-main-container">
                    <div className="ambient-glow ambient-glow--1"></div>
                    <div className="ambient-glow ambient-glow--2"></div>
                    <div className="error-state">
                        <p>{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="admin-dashboard-v2">
                <Navbar />
                <div className="admin-main-container">
                    <div className="ambient-glow ambient-glow--1"></div>
                    <div className="ambient-glow ambient-glow--2"></div>
                    <div className="no-data-state">
                        <p>Recycling Center not found.</p>
                    </div>
                </div>
            </div>
        );
    }

    const photoName = agent.centerPhoto;
    const photoUrl = photoName
        ? photoName.startsWith("http")
            ? photoName
            : `https://localhost:7102/uploads/recycling/Center Photo/${photoName}`
        : null;

    const fullAddress = [agent.buildingNumber, agent.street].filter(Boolean).join(", ");

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
                            <h1>Recycling Center Details</h1>
                        </div>
                        <p className="command-subtitle">
                            View and manage recycling center profile information
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search..."
                                disabled
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

                {/* Back Button */}
                <div className="back-nav">
                    <button onClick={() => navigate("/manage-recyclingcenter")} className="back-btn">
                        <FiArrowLeft />
                        <span>Back to Recycling Centers</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="technician-detail-grid">
                    {/* Profile Card */}
                    <div className="detail-card profile-card">
                        <div className="profile-header">
                            {photoUrl ? (
                                <img
                                    src={photoUrl}
                                    alt="Center"
                                    className="profile-avatar-large"
                                />
                            ) : (
                                <div className="profile-avatar-large profile-avatar-placeholder">
                                    <FiHome />
                                </div>
                            )}
                            <div className="profile-info">
                                <h2 className="profile-name">
                                    {agent.centerName}
                                </h2>
                                <p className="profile-email">{agent.ownerName} ({agent.login?.email})</p>
                                {getStatusBadge(agent.status)}
                            </div>
                        </div>

                        <div className="profile-actions">
                            {agent.status?.toLowerCase() === "pending" && (
                                <>
                                    <button
                                        className="action-btn action-btn--accept"
                                        onClick={acceptAgent}
                                        disabled={actionLoading === "accept"}
                                    >
                                        {actionLoading === "accept" ? "Processing..." : (
                                            <>
                                                <FiCheck />
                                                <span>Accept</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        className="action-btn action-btn--reject"
                                        onClick={rejectAgent}
                                        disabled={actionLoading === "reject"}
                                    >
                                        {actionLoading === "reject" ? "Processing..." : (
                                            <>
                                                <FiX />
                                                <span>Reject</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Information Cards Column */}
                    <div className="info-cards-column">
                        {/* Business & Center Information */}
                        <div className="detail-card info-card">
                            <div className="card-header">
                                <div className="header-icon">
                                    <FiBriefcase />
                                </div>
                                <h3 className="card-title">Business & Center Information</h3>
                            </div>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Center Name</label>
                                    <span>{agent.centerName}</span>
                                </div>
                                <div className="info-item">
                                    <label>Owner Name</label>
                                    <span>{agent.ownerName}</span>
                                </div>
                                <div className="info-item">
                                    <label>Email</label>
                                    <span>{agent.login?.email}</span>
                                </div>
                                <div className="info-item">
                                    <label>Phone Number</label>
                                    <span>{agent.phoneNumber || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Business Reg. No.</label>
                                    <span>{agent.businessRegistrationNumber || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Recycler Reg. No.</label>
                                    <span>{agent.recyclerRegistrationNumber || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>GST Number</label>
                                    <span>{agent.gstNumber || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Experience (Years)</label>
                                    <span>{agent.experienceYears !== undefined ? `${agent.experienceYears} Years` : "N/A"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="detail-card info-card">
                            <div className="card-header">
                                <div className="header-icon">
                                    <FiMapPin />
                                </div>
                                <h3 className="card-title">Address Information</h3>
                            </div>
                            <div className="info-grid">
                                <div className="info-item full-width">
                                    <label>Building / Street Address</label>
                                    <span>{fullAddress || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>City</label>
                                    <span>{agent.city || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>District</label>
                                    <span>{agent.district || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>State</label>
                                    <span>{agent.state || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Pincode</label>
                                    <span>{agent.pincode || "N/A"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Capabilities & Operational Details */}
                        <div className="detail-card info-card">
                            <div className="card-header">
                                <div className="header-icon">
                                    <FiRefreshCw />
                                </div>
                                <h3 className="card-title">Capabilities & Operational Details</h3>
                            </div>
                            <div className="info-grid">
                                <div className="info-item full-width">
                                    <label>Device Types Handled</label>
                                    <span>{agent.deviceTypes || "N/A"}</span>
                                </div>
                                <div className="info-item full-width">
                                    <label>Recycling Processes</label>
                                    <span>{agent.recyclingProcesses || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Pickup Available</label>
                                    <span>{agent.pickupAvailable || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Hazardous Waste Handling</label>
                                    <span>{agent.hazardousWasteHandling || "N/A"}</span>
                                </div>
                                <div className="info-item full-width">
                                    <label>Recovered Materials</label>
                                    <span>{agent.recoveredMaterials || "N/A"}</span>
                                </div>
                                <div className="info-item full-width">
                                    <label>Hazardous Waste Types</label>
                                    <span>{agent.hazardousWasteTypes || "N/A"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="detail-card info-card documents-card">
                            <div className="card-header">
                                <div className="header-icon">
                                    <FiFileText />
                                </div>
                                <h3 className="card-title">Verification Documents</h3>
                            </div>
                            <div className="documents-grid">
                                {/* Business Reg Cert */}
                                <div className="document-item">
                                    <div className="document-icon">
                                        <FiShield />
                                    </div>
                                    <div className="document-info">
                                        <h4>Business Registration Cert</h4>
                                        {agent.businessRegistrationCertificate ? (
                                            <a
                                                href={`https://localhost:7102/uploads/recycling/buisness registration certificate/${agent.businessRegistrationCertificate}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="document-view-btn"
                                            >
                                                View Certificate
                                            </a>
                                        ) : (
                                            <span className="document-missing">Not uploaded</span>
                                        )}
                                    </div>
                                </div>

                                {/* Recycler Reg Cert */}
                                <div className="document-item">
                                    <div className="document-icon">
                                        <FiAward />
                                    </div>
                                    <div className="document-info">
                                        <h4>Recycler Registration Cert</h4>
                                        {agent.recyclerRegistrationCertificate ? (
                                            <a
                                                href={`https://localhost:7102/uploads/recycling/recycler registration certificate/${agent.recyclerRegistrationCertificate}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="document-view-btn"
                                            >
                                                View Certificate
                                            </a>
                                        ) : (
                                            <span className="document-missing">Not uploaded</span>
                                        )}
                                    </div>
                                </div>

                                {/* Consent to Operate */}
                                <div className="document-item">
                                    <div className="document-icon">
                                        <FiFileText />
                                    </div>
                                    <div className="document-info">
                                        <h4>Consent to Operate</h4>
                                        {agent.consentToOperate ? (
                                            <a
                                                href={`https://localhost:7102/uploads/recycling/Consent To Operate/${agent.consentToOperate}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="document-view-btn"
                                            >
                                                View Document
                                            </a>
                                        ) : (
                                            <span className="document-missing">Not uploaded</span>
                                        )}
                                    </div>
                                </div>

                                {/* Hazardous Waste Authorization */}
                                <div className="document-item">
                                    <div className="document-icon">
                                        <FiAlertTriangle />
                                    </div>
                                    <div className="document-info">
                                        <h4>Hazardous Waste Authorization</h4>
                                        {agent.hazardousWasteAuthorization ? (
                                            <a
                                                href={`https://localhost:7102/uploads/recycling/Hazardous Waste Authorization/${agent.hazardousWasteAuthorization}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="document-view-btn"
                                            >
                                                View Authorization
                                            </a>
                                        ) : (
                                            <span className="document-missing">Not uploaded</span>
                                        )}
                                    </div>
                                </div>

                                {/* Address Proof */}
                                <div className="document-item">
                                    <div className="document-icon">
                                        <FiMapPin />
                                    </div>
                                    <div className="document-info">
                                        <h4>Address Proof</h4>
                                        {agent.addressProof ? (
                                            <a
                                                href={`https://localhost:7102/uploads/recycling/Address Proof/${agent.addressProof}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="document-view-btn"
                                            >
                                                View Document
                                            </a>
                                        ) : (
                                            <span className="document-missing">Not uploaded</span>
                                        )}
                                    </div>
                                </div>

                                {/* Authorized Person ID */}
                                <div className="document-item">
                                    <div className="document-icon">
                                        <FiUser />
                                    </div>
                                    <div className="document-info">
                                        <h4>Authorized Person ID</h4>
                                        {agent.authorizedPersonId ? (
                                            <a
                                                href={`https://localhost:7102/uploads/recycling/AuthorizedPersonId/${agent.authorizedPersonId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="document-view-btn"
                                            >
                                                View ID Document
                                            </a>
                                        ) : (
                                            <span className="document-missing">Not uploaded</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default View_recyclingagent;
