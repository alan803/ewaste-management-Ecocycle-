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
    FiAward
} from "react-icons/fi";
import "./View_technician.css";

function View_technician() {
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
                `https://localhost:7102/api/Technician/${id}`
            );
            console.log("Technician details:", response.data);
            setAgent(response.data);
        } catch (error) {
            console.error("Error fetching technician:", error);
            setError("Failed to load technician details.");
        } finally {
            setLoading(false);
        }
    };

    const acceptAgent = async () => {
        setActionLoading("accept");
        try {
            await axios.post(
                `https://localhost:7102/api/Technician/Accept/${id}`
            );
            setAgent(prev => ({ ...prev, status: "Active" }));
            navigate("/manage-technicians");
        } catch (error) {
            console.error("Error accepting technician:", error);
        } finally {
            setActionLoading("");
        }
    };

    const rejectAgent = async () => {
        setActionLoading("reject");
        try {
            await axios.post(
                `https://localhost:7102/api/Technician/Reject/${id}`
            );
            setAgent(prev => ({ ...prev, status: "Rejected" }));
            navigate("/manage-technicians");
        } catch (error) {
            console.error("Error rejecting technician:", error);
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
                        <p>Loading Technician details...</p>
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
                        <p>Technician not found.</p>
                    </div>
                </div>
            </div>
        );
    }

    const photoName = agent.profilePhoto || agent.profilePicture;
    const photoUrl = photoName
        ? photoName.startsWith("http")
            ? photoName
            : `https://localhost:7102/uploads/technicians/ProfilePhotos/${photoName}`
        : null;

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
                            <h1>Technician Details</h1>
                        </div>
                        <p className="command-subtitle">
                            View and manage technician profile information
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
                    <button onClick={() => navigate("/manage-technicians")} className="back-btn">
                        <FiArrowLeft />
                        <span>Back to Technicians</span>
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

                    {/* Information Cards Column */}
                    <div className="info-cards-column">
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
                                    <span>{agent.phoneNumber || agent.phone || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Date of Birth</label>
                                    <span>{agent.dateOfBirth ? new Date(agent.dateOfBirth).toLocaleDateString() : "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Gender</label>
                                    <span>{agent.gender || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Employee ID</label>
                                    <span>{agent.employeeId || "N/A"}</span>
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
                                    <span>{agent.pinCode || agent.pincode || "N/A"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Professional Information */}
                        <div className="detail-card info-card">
                            <div className="card-header">
                                <div className="header-icon">
                                    <FiBriefcase />
                                </div>
                                <h3 className="card-title">Professional Information</h3>
                            </div>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Inspection Center</label>
                                    <span>{agent.inspectionCenterName || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Job Title</label>
                                    <span>{agent.jobTitle || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Date of Joining</label>
                                    <span>{agent.dateOfJoining ? new Date(agent.dateOfJoining).toLocaleDateString() : "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Experience (Years)</label>
                                    <span>{agent.experienceYears !== undefined ? `${agent.experienceYears} Years` : "N/A"}</span>
                                </div>
                                <div className="info-item full-width">
                                    <label>Specialization</label>
                                    <span>{agent.specialization || "N/A"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Certification & Govt ID */}
                        <div className="detail-card info-card">
                            <div className="card-header">
                                <div className="header-icon">
                                    <FiAward />
                                </div>
                                <h3 className="card-title">Certification & Govt ID</h3>
                            </div>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Issuing Institute</label>
                                    <span>{agent.issuingInstitute || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Certificate Number</label>
                                    <span>{agent.certificateNumber || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Certificate Issue Date</label>
                                    <span>{agent.certificateIssueDate ? new Date(agent.certificateIssueDate).toLocaleDateString() : "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Certificate Expiry Date</label>
                                    <span>{agent.certificateExpiryDate ? new Date(agent.certificateExpiryDate).toLocaleDateString() : "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Government ID Type</label>
                                    <span>{agent.governmentIdType || "N/A"}</span>
                                </div>
                                <div className="info-item">
                                    <label>Government ID Number</label>
                                    <span>{agent.governmentIdNumber || "N/A"}</span>
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
                                {/* Govt ID File */}
                                <div className="document-item">
                                    <div className="document-icon">
                                        <FiShield />
                                    </div>
                                    <div className="document-info">
                                        <h4>{agent.governmentIdType || "Government"} ID Document</h4>
                                        {agent.governmentIdFile ? (
                                            <a
                                                href={`https://localhost:7102/uploads/technicians/GovernmentIds/${
                                                    agent.governmentIdType === "Driving Licence"
                                                        ? "DrivingLicence"
                                                        : agent.governmentIdType
                                                }/${agent.governmentIdFile}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="document-view-btn"
                                            >
                                                View {agent.governmentIdType}
                                            </a>
                                        ) : (
                                            <span className="document-missing">Not uploaded</span>
                                        )}
                                    </div>
                                </div>

                                {/* Employee ID Card */}
                                <div className="document-item">
                                    <div className="document-icon">
                                        <FiFileText />
                                    </div>
                                    <div className="document-info">
                                        <h4>Employee ID Card</h4>
                                        {agent.employeeIdCard ? (
                                            <a
                                                href={`https://localhost:7102/uploads/technicians/EmployeeIdCards/${agent.employeeIdCard}`}
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

                                {/* Technical Certificate */}
                                <div className="document-item">
                                    <div className="document-icon">
                                        <FiAward />
                                    </div>
                                    <div className="document-info">
                                        <h4>Technical Certificate</h4>
                                        {agent.technicalCertificate ? (
                                            <a
                                                href={`https://localhost:7102/uploads/technicians/TechnicalCertificates/${agent.technicalCertificate}`}
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

                                {/* Resume */}
                                {/* <div className="document-item">
                                    <div className="document-icon">
                                        <FiFileText />
                                    </div>
                                    <div className="document-info">
                                        <h4>Resume / CV</h4>
                                        {agent.resume ? (
                                            <a
                                                href={`https://localhost:7102/uploads/technicians/Resumes/${agent.resume}`}
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
                                </div> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default View_technician;