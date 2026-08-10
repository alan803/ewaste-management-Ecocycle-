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
    FiSmartphone,
    FiCpu,
    FiPackage,
    FiCalendar,
    FiClock,
    FiMapPin,
    FiRefreshCw,
    FiCheckCircle,
    FiDollarSign,
    FiRotateCcw,
    FiTrash2
} from "react-icons/fi";
import "./Manage_device.css";

function Manage_device() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [allocatingId, setAllocatingId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
    fetchAllDevices();
}, []);

    const fetchPendingDevices = async () => 
    {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                "https://localhost:7102/api/Device/Pending",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log("Pending Devices:", response.data);
            setDevices(response.data);
        } catch (err) {
            console.error("Error fetching pending devices:", err);
            setError("Failed to load device requests.");
        } finally {
            setLoading(false);
        }
    };
    
    const fetchAllDevices = async () => 
    {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                "https://localhost:7102/api/Device/All",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log("All Devices:", response.data);
            setDevices(response.data);
            setError("");

        } catch (err) {
            console.error("Error fetching all devices:", err);
            setError("Failed to load all devices.");
        } finally {
            setLoading(false);
        }
    };

    const acceptDevice = async (deviceId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `https://localhost:7102/api/Device/accept/${deviceId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setDevices(prevDevices =>
                prevDevices.map(d =>
                    d.deviceId === deviceId
                        ? { ...d, status: "Accepted" }
                        : d
                )
            );
        } catch (err) {
            console.error("Error accepting device:", err);
        }
    };

    const rejectDevice = async (deviceId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `https://localhost:7102/api/Device/reject/${deviceId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setDevices(prevDevices =>
                prevDevices.map(d =>
                    d.deviceId === deviceId
                        ? { ...d, status: "Rejected" }
                        : d
                )
            );
        } catch (err) {
            console.error("Error rejecting device:", err);
        }
    };

    const allocateTechnician = async (deviceId) => {
        try {
            setAllocatingId(deviceId);
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `https://localhost:7102/api/Inspection/create/${deviceId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            console.log("Allocation response:", response.data);
            await fetchAllDevices();
        } catch (err) {
            console.error("Error allocating technician:", err);
        } finally {
            setAllocatingId(null);
        }
    };
    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case "pending":
                return <span className="status-pill status-pill--pending"><span className="status-beacon"></span>Pending</span>;
            case "accepted":
            case "active":
            case "approved":
                return <span className="status-pill status-pill--completed"><span className="status-beacon"></span>Accepted</span>;
            case "rejected":
                return <span className="status-pill status-pill--rejected"><span className="status-beacon"></span>Rejected</span>;
            default:
                return <span className="status-pill">{status || "Pending"}</span>;
        }
    };

    const getLifecycleInfo = (device) => {
        if (!device) return { label: "Pending", isAllocated: false, icon: <FiClock />, className: "status-btn--pending" };
        const rawStatus = device.lifecycleStatus || device.LifecycleStatus || "Pending";
        const status = rawStatus.trim();
        const lower = status.toLowerCase();

        switch (lower) {
            case "pending":
                return {
                    statusKey: "Pending",
                    label: "Pending",
                    isAllocated: false,
                    icon: <FiClock />,
                    className: "status-btn--pending"
                };
            case "pickupscheduled":
            case "inspectionassigned":
            case "inspectionaccepted":
                return {
                    statusKey: "PickupScheduled",
                    label: "Pickup Scheduled",
                    isAllocated: true,
                    icon: <FiCalendar />,
                    className: "status-btn--scheduled"
                };
            case "pickedup":
                return {
                    statusKey: "PickedUp",
                    label: "Picked Up",
                    isAllocated: true,
                    icon: <FiPackage />,
                    className: "status-btn--pickedup"
                };
            case "atinspectioncenter":
                return {
                    statusKey: "AtInspectionCenter",
                    label: "At Inspection Center",
                    isAllocated: true,
                    icon: <FiMapPin />,
                    className: "status-btn--atcenter"
                };
            case "inspectioninprogress":
                return {
                    statusKey: "InspectionInProgress",
                    label: "Inspection In Progress",
                    isAllocated: true,
                    icon: <FiRefreshCw className="spin-icon" />,
                    className: "status-btn--in-progress"
                };
            case "inspectioncompleted":
                return {
                    statusKey: "InspectionCompleted",
                    label: "Inspection Completed",
                    isAllocated: true,
                    icon: <FiCheckCircle />,
                    className: "status-btn--completed"
                };
            case "offerpending":
                return {
                    statusKey: "OfferPending",
                    label: "Offer Pending",
                    isAllocated: true,
                    icon: <FiClock />,
                    className: "status-btn--offer-pending"
                };
            case "offeraccepted":
                return {
                    statusKey: "OfferAccepted",
                    label: "Offer Accepted",
                    isAllocated: true,
                    icon: <FiCheckCircle />,
                    className: "status-btn--offer-accepted"
                };
            case "paymentpending":
                return {
                    statusKey: "PaymentPending",
                    label: "Payment Pending",
                    isAllocated: true,
                    icon: <FiDollarSign />,
                    className: "status-btn--payment-pending"
                };
            case "paymentcompleted":
                return {
                    statusKey: "PaymentCompleted",
                    label: "Payment Completed",
                    isAllocated: true,
                    icon: <FiCheckCircle />,
                    className: "status-btn--payment-completed"
                };
            case "processing":
                return {
                    statusKey: "Processing",
                    label: "Processing",
                    isAllocated: true,
                    icon: <FiCpu />,
                    className: "status-btn--processing"
                };
            case "refurbishment":
                return {
                    statusKey: "Refurbishment",
                    label: "Refurbishment",
                    isAllocated: true,
                    icon: <FiRotateCcw />,
                    className: "status-btn--refurbishment"
                };
            case "recycling":
                return {
                    statusKey: "Recycling",
                    label: "Recycling",
                    isAllocated: true,
                    icon: <FiTrash2 />,
                    className: "status-btn--recycling"
                };
            case "completed":
                return {
                    statusKey: "Completed",
                    label: "Completed",
                    isAllocated: true,
                    icon: <FiCheckCircle />,
                    className: "status-btn--completed"
                };
            default:
                const isAllocated = lower !== "pending" && lower !== "none" && lower !== "";
                return {
                    statusKey: status,
                    label: status.replace(/([A-Z])/g, ' $1').trim(),
                    isAllocated: isAllocated,
                    icon: <FiCheckCircle />,
                    className: "status-btn--default"
                };
        }
    };

    const renderLifecycleAction = (device, isModal = false) => {
        const info = getLifecycleInfo(device);
        const hasTechnicianAllocated = info.isAllocated || device.technicianId || device.isAllocated;

        if (!hasTechnicianAllocated) {
            return (
                <button
                    className={`action-btn action-btn--allocate ${isModal ? "modal-allocate-btn" : ""}`}
                    onClick={() => allocateTechnician(device.deviceId)}
                    disabled={allocatingId === device.deviceId}
                    title="Allocate Technician for Inspection"
                >
                    <FiCpu className={allocatingId === device.deviceId ? "spin-icon" : ""} />
                    <span>{allocatingId === device.deviceId ? "Allocating..." : isModal ? "Allocate Technician" : "Allocate"}</span>
                </button>
            );
        }

        return (
            <button
                className={`action-btn action-btn--lifecycle ${info.className} ${isModal ? "modal-lifecycle-btn" : ""}`}
                disabled
                title={`Lifecycle Status: ${info.label}`}
            >
                {info.icon}
                <span>{info.label}</span>
            </button>
        );
    };

    const filteredDevices = devices.filter((d) => {
        const matchesSearch =
            (d.brand?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.model?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.modelNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.serialNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.condition?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.processingPreference?.toLowerCase() || "").includes(searchQuery.toLowerCase());

        const matchesStatus =
            activeFilter === "All" ||
            (d.status?.toLowerCase() || "pending") === activeFilter.toLowerCase();

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
                            <h1>Manage Pending Devices</h1>
                        </div>
                        <p className="command-subtitle">
                            Manage and oversee e-waste device submissions and requests
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search devices by brand, model..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
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

                {/* Content Area */}
                <section className="content-section">
                    <div className="panel-card table-panel">
                        <div className="panel-header">
                            <div>
                                <h3 className="panel-title">Device Submissions</h3>
                                <p className="panel-subtitle">View and manage pending e-waste device registrations</p>
                            </div>
                            <div className="panel-actions">
                                <div className="filter-pill-group">
                                    {["All", "Pending", "Accepted", "Rejected"].map((tab) => (
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
                                <p>Loading device requests...</p>
                            </div>
                        ) : error ? (
                            <div className="error-state">
                                <p>{error}</p>
                            </div>
                        ) : filteredDevices.length === 0 ? (
                            <div className="no-data-state">
                                <FiFilter className="no-data-icon" />
                                <p>No device requests matching your criteria.</p>
                            </div>
                        ) : (
                            <div className="glass-table-wrapper">
                                <table className="glass-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Device</th>
                                            <th>Model / Serial No</th>
                                            <th>Condition</th>
                                            <th>Preference</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDevices.map((d, index) => (
                                            <tr key={d.deviceId} className="table-row-hover">
                                                <td style={{ fontWeight: "700", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                                                    {index + 1}
                                                </td>
                                                <td>
                                                    <div className="user-info">
                                                        <span className="user-name">
                                                            {d.brand} {d.model}
                                                        </span>
                                                        <span className="user-email">Qty: {d.quantity || 1}</span>
                                                    </div>
                                                </td>
                                                <td className="contact-cell">
                                                    <div><strong>Model No:</strong> {d.modelNumber || "N/A"}</div>
                                                    <div className="device-sub-text"><strong>S/N:</strong> {d.serialNumber || "N/A"}</div>
                                                </td>
                                                <td className="phone-cell">
                                                    <span className="badge-tag">{d.condition || "N/A"}</span>
                                                    {d.working && <div className="device-sub-text">Working: {d.working}</div>}
                                                </td>
                                                <td>
                                                    <span className="badge-tag">{d.processingPreference || "Standard"}</span>
                                                </td>
                                                <td>{getStatusBadge(d.status)}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="action-btn action-btn--view"
                                                            onClick={() => setSelectedDevice(d)}
                                                            title="View Details"
                                                        >
                                                            <FiEye />
                                                        </button>
                                                        {(!d.status || d.status.toLowerCase() === "pending") && (
                                                            <>
                                                                <button
                                                                    className="action-btn action-btn--approve"
                                                                    onClick={() => acceptDevice(d.deviceId)}
                                                                    title="Approve"
                                                                >
                                                                    <FiCheck />
                                                                </button>
                                                                <button
                                                                    className="action-btn action-btn--reject"
                                                                    onClick={() => rejectDevice(d.deviceId)}
                                                                    title="Reject"
                                                                >
                                                                    <FiX />
                                                                </button>
                                                            </>
                                                        )}
                                                        {/* Active / Accepted Device */}
                                                        {(d.status?.toLowerCase() === "active" ||
                                                        d.status?.toLowerCase() === "accepted" ||
                                                        d.status?.toLowerCase() === "approved") && (
                                                            renderLifecycleAction(d, false)
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>

                {/* Device Details Modal */}
                {selectedDevice && (
                    <div className="modal-overlay" onClick={() => setSelectedDevice(null)}>
                        <div className="device-modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h2>{selectedDevice.brand} {selectedDevice.model}</h2>
                                    <p className="panel-subtitle">Device Submission ID: #{selectedDevice.deviceId}</p>
                                </div>
                                <button className="modal-close-btn" onClick={() => setSelectedDevice(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="device-details-grid">
                                <div className="detail-item">
                                    <label>Brand</label>
                                    <span>{selectedDevice.brand || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Model</label>
                                    <span>{selectedDevice.model || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Model Number</label>
                                    <span>{selectedDevice.modelNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Serial Number</label>
                                    <span>{selectedDevice.serialNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Quantity</label>
                                    <span>{selectedDevice.quantity || 1}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Condition</label>
                                    <span>{selectedDevice.condition || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Working State</label>
                                    <span>{selectedDevice.working || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Preference</label>
                                    <span>{selectedDevice.processingPreference || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Pickup Date</label>
                                    <span>{selectedDevice.pickupDate || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Time Slot</label>
                                    <span>{selectedDevice.timeSlot || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Landmark / Address</label>
                                    <span>{selectedDevice.landmark || selectedDevice.address || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Ownership</label>
                                    <span>{selectedDevice.ownership || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Lifecycle Status</label>
                                    <span>{getLifecycleInfo(selectedDevice).label}</span>
                                </div>
                            </div>

                            {selectedDevice.physicalDamage && (
                                <div style={{ marginBottom: "1.25rem" }}>
                                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Physical Damage Notes</label>
                                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "var(--secondary)" }}>{selectedDevice.physicalDamage}</p>
                                </div>
                            )}

                            {(selectedDevice.frontPhoto || selectedDevice.backPhoto || selectedDevice.damagePhoto || selectedDevice.labelPhoto) && (
                                <div className="device-photos-section">
                                    <h4>Uploaded Photos</h4>
                                    <div className="photos-grid">
                                        {selectedDevice.frontPhoto && (
                                            <div className="photo-card">
                                                <img
                                                    src={`https://localhost:7102/uploads/devices/FrontPhotos/${selectedDevice.frontPhoto}`}
                                                    alt="Front"
                                                />
                                                <span>Front</span>
                                            </div>
                                        )}
                                        {selectedDevice.backPhoto && (
                                            <div className="photo-card">
                                                <img
                                                    src={`https://localhost:7102/uploads/devices/BackPhotos/${selectedDevice.backPhoto}`}
                                                    alt="Back"
                                                />
                                                <span>Back</span>
                                            </div>
                                        )}

                                        {selectedDevice.damagePhoto && (
                                            <div className="photo-card">
                                                <img
                                                    src={`https://localhost:7102/uploads/devices/DamagePhotos/${selectedDevice.damagePhoto}`}
                                                    alt="Damage"
                                                />
                                                <span>Damage</span>
                                            </div>
                                        )}

                                        {selectedDevice.labelPhoto && (
                                            <div className="photo-card">
                                                <img
                                                    src={`https://localhost:7102/uploads/devices/LabelPhotos/${selectedDevice.labelPhoto}`}
                                                    alt="Label"
                                                />
                                                <span>Label</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Manage_device;