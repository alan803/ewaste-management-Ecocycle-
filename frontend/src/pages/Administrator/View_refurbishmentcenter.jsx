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
    FiRefreshCw,
    FiUsers,
    FiTruck
} from "react-icons/fi";
import "./View_refurbishmentcenter.css";

function View_refurbishmentcenter() {
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
                `https://localhost:7102/api/RefurbishmentCenter/${id}`
            );
            console.log("Refurbishment center details:", response.data);
            setAgent(response.data);
        } catch (error) {
            console.error("Error fetching refurbishment center:", error);
            setError("Failed to load refurbishment center details.");
        } finally {
            setLoading(false);
        }
    };

    const acceptAgent = async () => {
        setActionLoading("accept");
        try {
            await axios.post(
                `https://localhost:7102/api/RefurbishmentCenter/Accept/${id}`
            );
            setAgent(prev => ({ ...prev, status: "Active" }));
            navigate("/manage-refurbishmentcenter");
        } catch (error) {
            console.error("Error accepting refurbishment center:", error);
        } finally {
            setActionLoading("");
        }
    };

    const rejectAgent = async () => {
        setActionLoading("reject");
        try {
            await axios.post(
                `https://localhost:7102/api/RefurbishmentCenter/Reject/${id}`
            );
            setAgent(prev => ({ ...prev, status: "Rejected" }));
            navigate("/manage-refurbishmentcenter");
        } catch (error) {
            console.error("Error rejecting refurbishment center:", error);
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
                        <p>Loading Refurbishment Center details...</p>
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
                        <p>Refurbishment Center not found.</p>
                    </div>
                </div>
            </div>
        );
    }

    const photoName = agent.centerPhoto;
    const photoUrl = photoName
        ? photoName.startsWith("http")
            ? photoName
            : `https://localhost:7102/uploads/refurbishment/center-photo/${photoName}`
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
                            <h1>Refurbishment Center Details</h1>
                        </div>
                        <p className="command-subtitle">
                            View and manage refurbishment center profile information
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
                        </div>
                    </div>
                </header>

                {/* Back Button */}
                <div className="back-nav">
                    <button onClick={() => navigate("/manage-refurbishmentcenter")} className="back-btn">
                        <FiArrowLeft />
                        <span>Back to Refurbishment Centers</span>
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
                                    <label>License Number</label>
                                    <span>{agent.licenseNumber || "N/A"}</span>
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

                        {/* Services & Operational Details */}
                        <div className="detail-card info-card">
                            <div className="card-header">
                                <div className="header-icon">
                                    <FiRefreshCw />
                                </div>
                                <h3 className="card-title">Services & Operational Details</h3>
                            </div>
                            <div className="info-grid">
                                <div className="info-item full-width">
                                    <label>Device Types Handled</label>
                                    <span>{agent.deviceTypes || "N/A"}</span>
                                </div>
                                <div className="info-item full-width">
                                    <label>Refurbishment Services</label>
                                    <span>{agent.services || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Technician Count</label>
                                    <span>{agent.technicianCount !== undefined ? `${agent.technicianCount}` : "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Pickup Available</label>
                                    <span>{agent.pickupAvailable || "N/A"}</span>
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
                                                href={`https://localhost:7102/uploads/refurbishment/business-registration/${agent.businessRegistrationCertificate}`}
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

                                {/* Trade License */}
                                <div className="document-item">
                                    <div className="document-icon">
                                        <FiAward />
                                    </div>
                                    <div className="document-info">
                                        <h4>Trade License</h4>
                                        {agent.tradeLicense ? (
                                            <a
                                                href={`https://localhost:7102/uploads/refurbishment/trade-license/${agent.tradeLicense}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="document-view-btn"
                                            >
                                                View License
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
                                                href={`https://localhost:7102/uploads/refurbishment/address-proof/${agent.addressProof}`}
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
                                                href={`https://localhost:7102/uploads/refurbishment/authorized-person-id/${agent.authorizedPersonId}`}
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

export default View_refurbishmentcenter;
