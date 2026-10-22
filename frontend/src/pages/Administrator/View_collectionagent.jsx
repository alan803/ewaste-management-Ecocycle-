import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import {
    FiSearch,
    FiLogOut,
    FiArrowLeft,
    FiCheck,
    FiX,
    FiUser,
    FiPhone,
    FiMapPin,
    FiTruck,
    FiCreditCard,
    FiShield,
    FiFileText
} from "react-icons/fi";
import "./View_collectionagent.css";

function View_collectionagent() {

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
                `https://ecocycle.runasp.net/api/CollectionAgent/${id}`
            );

            console.log("Agent details:", response.data);

            setAgent(response.data);

        } catch (error) {
            console.error("Error fetching agent:", error);
            setError("Failed to load collection agent details.");
        } finally {
            setLoading(false);
        }
    };

    const acceptAgent = async () => {
        setActionLoading("accept");
        try {
            const response = await axios.post(
                `https://ecocycle.runasp.net/api/CollectionAgent/Accept/${id}`
            );

            setAgent(prev => ({ ...prev, status: "Approved" }));
            navigate("/manage-collectionagent");

        } catch (error) {
            console.error("Error accepting agent:", error);
        } finally {
            setActionLoading("");
        }
    };

    const rejectAgent = async () => {
        setActionLoading("reject");
        try {
            const response = await axios.post(
                `https://ecocycle.runasp.net/api/CollectionAgent/Reject/${id}`
            );

            setAgent(prev => ({ ...prev, status: "Rejected" }));
            navigate("/manage-collectionagent");

        } catch (error) {
            console.error("Error rejecting agent:", error);
        } finally {
            setActionLoading("");
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return <span className="status-badge status-badge--pending"><span className="status-dot"></span>Pending</span>;
            case "approved":
                return <span className="status-badge status-badge--approved"><span className="status-dot"></span>Approved</span>;
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
                        <p>Loading Collection Agent details...</p>
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
                        <p>Collection Agent not found.</p>
                    </div>
                </div>
            </div>
        );
    }

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
                            <h1>Collection Agent Details</h1>
                        </div>
                        <p className="command-subtitle">
                            View and manage collection agent profile information
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
                    <button onClick={() => navigate("/manage-collectionagent")} className="back-btn">
                        <FiArrowLeft />
                        <span>Back to Collection Agents</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="technician-detail-grid">
                    {/* Profile Card */}
                    <div className="detail-card profile-card">
                        <div className="profile-header">
                            {agent.profilePicture ? (
                                <img
                                    src={`https://ecocycle.runasp.net/uploads/profile/${agent.profilePicture}`}
                                    alt="Profile"
                                    className="profile-avatar-large"
                                />
                            ) : (
                                <div className="profile-avatar-large profile-avatar-placeholder">
                                    <FiUser />
                                </div>
                            )}
                            <div className="profile-info">
                                <h2 className="profile-name">
                                    {agent.firstName} {agent.lastName}
                                </h2>
                                <p className="profile-email">{agent.login?.email}</p>
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

                    {/* Personal Information */}
                    <div className="detail-card info-card">
                        <div className="card-header">
                            <div className="header-icon">
                                <FiUser />
                            </div>
                            <h3 className="card-title">Personal Information</h3>
                        </div>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Full Name</label>
                                <span>{agent.firstName} {agent.lastName}</span>
                            </div>
                            <div className="info-item">
                                <label>Email</label>
                                <span>{agent.login?.email}</span>
                            </div>
                            <div className="info-item">
                                <label>Phone</label>
                                <span>{agent.phone}</span>
                            </div>
                            <div className="info-item">
                                <label>Alternate Phone</label>
                                <span>{agent.alternatePhone || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <label>Date of Birth</label>
                                <span>{agent.dob || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <label>Gender</label>
                                <span>{agent.gender || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <label>Aadhaar Number</label>
                                <span>{agent.adhaarNumber || "N/A"}</span>
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
                                <label>Address</label>
                                <span>{agent.address || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <label>State</label>
                                <span>{agent.state || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <label>District</label>
                                <span>{agent.district || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <label>City</label>
                                <span>{agent.city || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <label>Pincode</label>
                                <span>{agent.pincode || "N/A"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="detail-card info-card">
                        <div className="card-header">
                            <div className="header-icon">
                                <FiTruck />
                            </div>
                            <h3 className="card-title">Vehicle Information</h3>
                        </div>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Vehicle Type</label>
                                <span>{agent.vehicleType || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <label>Vehicle Number</label>
                                <span>{agent.vehicleNumber || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <label>License Number</label>
                                <span>{agent.licenseNumber || "N/A"}</span>
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
                            {/* Aadhaar Proof */}
                            <div className="document-item">
                                <div className="document-icon">
                                    <FiFileText />
                                </div>
                                <div className="document-info">
                                    <h4>Aadhaar Proof</h4>
                                    {agent.adhaarProof ? (
                                        <a
                                            href={`https://ecocycle.runasp.net/uploads/aadhaar/${agent.adhaarProof}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="document-view-btn"
                                        >
                                            View Document
                                        </a>
                                    ) : (
                                        <span className="document-missing">
                                            Not uploaded
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Vehicle Insurance */}
                            <div className="document-item">
                                <div className="document-icon">
                                    <FiShield />
                                </div>
                                <div className="document-info">
                                    <h4>Vehicle Insurance</h4>
                                    {agent.vehicleInsurance ? (
                                        <a
                                            href={`https://ecocycle.runasp.net/uploads/insurance/${agent.vehicleInsurance}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="document-view-btn"
                                        >
                                            View Document
                                        </a>
                                    ) : (
                                        <span className="document-missing">
                                            Not uploaded
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Vehicle Pollution Certificate */}
                            <div className="document-item">
                                <div className="document-icon">
                                    <FiShield />
                                </div>
                                <div className="document-info">
                                    <h4>Pollution Certificate</h4>
                                    {agent.vehiclePollution ? (
                                        <a
                                            href={`https://ecocycle.runasp.net/uploads/pollution/${agent.vehiclePollution}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="document-view-btn"
                                        >
                                            View Document
                                        </a>
                                    ) : (
                                        <span className="document-missing">
                                            Not uploaded
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bank Information */}
                    <div className="detail-card info-card">
                        <div className="card-header">
                            <div className="header-icon">
                                <FiCreditCard />
                            </div>
                            <h3 className="card-title">Bank Information</h3>
                        </div>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Account Holder</label>
                                <span>{agent.accountHolder || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <label>Bank Name</label>
                                <span>{agent.bankName || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <label>Account Number</label>
                                <span>{agent.accountNumber || "N/A"}</span>
                            </div>
                            <div className="info-item">
                                <label>IFSC Code</label>
                                <span>{agent.ifscCode || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default View_collectionagent;