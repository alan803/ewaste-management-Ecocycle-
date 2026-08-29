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
    const [manualAllocatingDevice, setManualAllocatingDevice] = useState(null);
    const [activeTechnicians, setActiveTechnicians] = useState([]);
    const [selectedTechId, setSelectedTechId] = useState("");
    const [manualAllocatingLoading, setManualAllocatingLoading] = useState(false);
    const [manualAllocatingMessage, setManualAllocatingMessage] = useState("");
    const [techSearchQuery, setTechSearchQuery] = useState("");
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            let cleanStr = typeof dateString === "string" ? dateString.split("T")[0] : dateString;
            const date = new Date(cleanStr);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });
        } catch {
            return dateString;
        }
    };

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

    const fetchActiveTechnicians = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("https://localhost:7102/api/Technician/All", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const activeOnly = (response.data || []).filter(t => (t.status || t.Status) === "Active");
            setActiveTechnicians(activeOnly.length > 0 ? activeOnly : response.data || []);
        } catch (err) {
            console.error("Error fetching active technicians:", err);
        }
    };

    const allocateTechnicianManually = async (deviceId, techId = null) => {
        try {
            setAllocatingId(deviceId);
            setManualAllocatingLoading(true);
            setManualAllocatingMessage("");
            const token = localStorage.getItem("token");

            const url = techId 
                ? `https://localhost:7102/api/Inspection/manual-allocate/${deviceId}/${techId}`
                : `https://localhost:7102/api/Inspection/manual-allocate/${deviceId}`;

            const response = await axios.post(
                url,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log("Manual allocation response:", response.data);
            setManualAllocatingMessage(response.data?.message || "Technician allocated successfully.");

            setTimeout(() => {
                setManualAllocatingDevice(null);
                setSelectedTechId("");
                setManualAllocatingMessage("");
                fetchAllDevices();
            }, 1200);

        } catch (err) {
            console.error("Error manually allocating technician:", err);
            setManualAllocatingMessage(err.response?.data?.message || "Failed to manually allocate technician.");
        } finally {
            setAllocatingId(null);
            setManualAllocatingLoading(false);
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
        const mainStatus = (device.status || device.Status || "").toLowerCase();

        switch (lower) {
            case "pending":
                if (mainStatus === "pending") {
                    return {
                        statusKey: "ApprovalPending",
                        label: "Approval Pending",
                        isAllocated: false,
                        icon: <FiClock />,
                        className: "status-btn--pending"
                    };
                }
                return {
                    statusKey: "AllocationPending",
                    label: "Allocation Pending",
                    isAllocated: false,
                    icon: <FiClock />,
                    className: "status-btn--pending"
                };
            case "inspectionpending":
                return {
                    statusKey: "InspectionPending",
                    label: "Inspection Pending",
                    isAllocated: false,
                    icon: <FiClock />,
                    className: "status-btn--pending"
                };
            case "collectionpending":
            case "waiting":
                return {
                    statusKey: "CollectionPending",
                    label: "Collection Pending",
                    isAllocated: false,
                    icon: <FiClock />,
                    className: "status-btn--pending"
                };
            case "pickupexpired":
            case "inspectionexpired":
            case "duedatepassed":
            case "expired":
                return {
                    statusKey: "Expired",
                    label: "Expired",
                    isAllocated: false,
                    icon: <FiClock />,
                    className: "status-btn--cancelled"
                };
            case "pickupcancelled":
            case "cancelled":
                return {
                    statusKey: "PickupCancelled",
                    label: "Pickup Cancelled",
                    isAllocated: false,
                    icon: <FiClock />,
                    className: "status-btn--cancelled"
                };
            case "collectionassigned":
                return {
                    statusKey: "CollectionAssigned",
                    label: "Collection Assigned",
                    isAllocated: true,
                    icon: <FiCpu />,
                    className: "status-btn--scheduled"
                };
            case "collectionaccepted":
                return {
                    statusKey: "CollectionAccepted",
                    label: "Collection Accepted",
                    isAllocated: true,
                    icon: <FiCheckCircle />,
                    className: "status-btn--scheduled"
                };
            case "pickupscheduled":
                return {
                    statusKey: "PickupScheduled",
                    label: "Pickup Scheduled",
                    isAllocated: true,
                    icon: <FiCalendar />,
                    className: "status-btn--scheduled"
                };
            case "pickupstarted":
            case "pickedup":
                return {
                    statusKey: "PickedUp",
                    label: "Picked Up",
                    isAllocated: true,
                    icon: <FiPackage />,
                    className: "status-btn--pickedup"
                };
            case "intransit":
                return {
                    statusKey: "InTransit",
                    label: "In Transit",
                    isAllocated: true,
                    icon: <FiTruck />,
                    className: "status-btn--in-progress"
                };
            case "delivered":
            case "infacility":
            case "atinspectioncenter":
                return {
                    statusKey: "AtInspectionCenter",
                    label: "At Inspection Center",
                    isAllocated: true,
                    icon: <FiMapPin />,
                    className: "status-btn--atcenter"
                };
            case "inspectionassigned":
                return {
                    statusKey: "InspectionAssigned",
                    label: "Inspection Assigned",
                    isAllocated: true,
                    icon: <FiCpu />,
                    className: "status-btn--scheduled"
                };
            case "inspectionaccepted":
                return {
                    statusKey: "InspectionAccepted",
                    label: "Inspection Accepted",
                    isAllocated: true,
                    icon: <FiCheckCircle />,
                    className: "status-btn--scheduled"
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
                const unallocatedList = ["pending", "inspectionpending", "collectionpending", "waiting", "none", "", "pickupcancelled", "cancelled"];
                const isAllocated = !unallocatedList.includes(lower);
                const formattedLabel = status.replace(/([A-Z])/g, ' $1').trim();
                return {
                    statusKey: status,
                    label: formattedLabel,
                    isAllocated: isAllocated,
                    icon: isAllocated ? <FiCheckCircle /> : <FiClock />,
                    className: isAllocated ? "status-btn--default" : "status-btn--pending"
                };
        }
    };

    const renderLifecycleAction = (device, isModal = false) => {
        const info = getLifecycleInfo(device);
        const hasTechnicianAllocated = info.isAllocated || device.technicianId || device.isAllocated;
        const isAllocationRequested = !!(device.allocationRequested || device.AllocationRequested);

        if (!hasTechnicianAllocated && isAllocationRequested) {
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

    const filteredTechniciansForModal = activeTechnicians.filter(tech => {
        const query = techSearchQuery.toLowerCase().trim();
        if (!query) return true;
        const name = `${tech.firstName || tech.FirstName || ""} ${tech.lastName || tech.LastName || ""}`.toLowerCase();
        const city = (tech.city || tech.City || "").toLowerCase();
        const district = (tech.district || tech.District || "").toLowerCase();
        const state = (tech.state || tech.State || "").toLowerCase();
        const pincode = (tech.pinCode || tech.PinCode || "").toLowerCase();
        const spec = (tech.specialization || tech.Specialization || "").toLowerCase();
        const center = (tech.inspectionCenterName || tech.InspectionCenterName || "").toLowerCase();
        const phone = (tech.phoneNumber || tech.PhoneNumber || "").toLowerCase();

        return name.includes(query) || city.includes(query) || district.includes(query) || state.includes(query) || pincode.includes(query) || spec.includes(query) || center.includes(query) || phone.includes(query);
    });

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
                                            <th>Lifecycle Status</th>
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
                                                    <button
                                                        className={`action-btn action-btn--lifecycle ${getLifecycleInfo(d).className}`}
                                                        style={{ cursor: "default" }}
                                                        disabled
                                                        title={`Lifecycle Status: ${getLifecycleInfo(d).label}`}
                                                    >
                                                        {getLifecycleInfo(d).icon}
                                                        <span>{getLifecycleInfo(d).label}</span>
                                                    </button>
                                                </td>
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
                                                        {/* Active / Accepted / Requested Device -> Allocate vs Allocate Manually vs Lifecycle Status */}
                                                        {(d.status?.toLowerCase() === "active" ||
                                                          d.status?.toLowerCase() === "accepted" ||
                                                          d.status?.toLowerCase() === "approved" ||
                                                          d.status?.toLowerCase() === "requested" ||
                                                          d.status?.toLowerCase() === "devicerequested" ||
                                                          d.status?.toLowerCase() === "pickupcancelled" ||
                                                          d.status?.toLowerCase() === "cancelled" ||
                                                          (d.lifecycleStatus || "").toLowerCase() === "pickupcancelled") && 
                                                          (d.allocationRequested || d.AllocationRequested || d.status?.toLowerCase() === "accepted" || d.status?.toLowerCase() === "active" || d.status?.toLowerCase() === "requested" || d.status?.toLowerCase() === "approved") && (
                                                            <>
                                                                {d.inspectionRequestStatus?.toLowerCase() === "waiting" ? (
                                                                    <button
                                                                        className="action-btn action-btn--allocate"
                                                                        style={{ background: "#fffbebf0", color: "#b45309", border: "1px solid #fde68a" }}
                                                                        onClick={() => {
                                                                            setManualAllocatingDevice(d);
                                                                            fetchActiveTechnicians();
                                                                        }}
                                                                        disabled={allocatingId === d.deviceId}
                                                                        title="Manually Allocate Technician"
                                                                    >
                                                                        <FiCpu className={allocatingId === d.deviceId ? "spin-icon" : ""} />
                                                                        <span>
                                                                            {allocatingId === d.deviceId ? "Allocating..." : "Allocate Manually"}
                                                                        </span>
                                                                    </button>
                                                                ) : (
                                                                    !getLifecycleInfo(d).isAllocated && (
                                                                        <button
                                                                            className="action-btn action-btn--allocate"
                                                                            onClick={() => allocateTechnician(d.deviceId)}
                                                                            disabled={allocatingId === d.deviceId}
                                                                            title="Allocate Technician for Inspection"
                                                                        >
                                                                            <FiCpu className={allocatingId === d.deviceId ? "spin-icon" : ""} />
                                                                            <span>
                                                                                {allocatingId === d.deviceId ? "Allocating..." : "Allocate"}
                                                                            </span>
                                                                        </button>
                                                                    )
                                                                )}
                                                            </>
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
                                    <span>{formatDate(selectedDevice.pickupDate)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Time Slot</label>
                                    <span>{selectedDevice.timeSlot || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Device Location</label>
                                    <span>
                                        {selectedDevice.userLocation || 
                                         [selectedDevice.userCity, selectedDevice.userDistrict, selectedDevice.userState, selectedDevice.userPincode].filter(Boolean).join(", ") || 
                                         selectedDevice.address || 
                                         "N/A"}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <label>Landmark / Pickup Address</label>
                                    <span>{selectedDevice.address ? (selectedDevice.landmark ? `${selectedDevice.address} (Near: ${selectedDevice.landmark})` : selectedDevice.address) : "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Ownership</label>
                                    <span>{selectedDevice.ownership || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Lifecycle Status</label>
                                    <span style={{ display: "flex", marginTop: "0.25rem" }}>
                                        <button
                                            className={`action-btn action-btn--lifecycle ${getLifecycleInfo(selectedDevice).className}`}
                                            style={{ cursor: "default" }}
                                            disabled
                                        >
                                            {getLifecycleInfo(selectedDevice).icon}
                                            <span>{getLifecycleInfo(selectedDevice).label}</span>
                                        </button>
                                    </span>
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

                {/* Manual Allocation Modal */}
                {manualAllocatingDevice && (
                    <div className="modal-overlay" onClick={() => setManualAllocatingDevice(null)}>
                        <div className="device-modal-card" style={{ maxWidth: "680px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h2>Manually Allocate Technician</h2>
                                    <p className="panel-subtitle">
                                        Device #{manualAllocatingDevice.deviceId} • {manualAllocatingDevice.brand} {manualAllocatingDevice.model}
                                    </p>
                                </div>
                                <button className="modal-close-btn" onClick={() => setManualAllocatingDevice(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div style={{ padding: "1.25rem 0 0.5rem 0" }}>
                                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "0.85rem 1.15rem", borderRadius: "12px", marginBottom: "1.25rem", color: "#b45309", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                    <FiClock style={{ fontSize: "1.1rem", flexShrink: 0 }} />
                                    <span><strong>Inspection Request Status:</strong> Waiting for technician assignment.</span>
                                </div>

                                {manualAllocatingMessage && (
                                    <div style={{ padding: "0.85rem 1.15rem", borderRadius: "10px", background: manualAllocatingMessage.includes("Failed") ? "#fff1f2" : "#f0fdf4", color: manualAllocatingMessage.includes("Failed") ? "#e11d48" : "#15803d", fontWeight: 600, fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                                        {manualAllocatingMessage}
                                    </div>
                                )}

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (selectedTechId) {
                                            allocateTechnicianManually(manualAllocatingDevice.deviceId, selectedTechId);
                                        }
                                    }}
                                    style={{ background: "#f8fafc", padding: "1.15rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                            Select Active Technician
                                        </div>
                                        <span style={{ fontSize: "0.75rem", background: "#e0f2fe", color: "#0369a1", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 700 }}>
                                            {filteredTechniciansForModal.length} Available
                                        </span>
                                    </div>

                                    {/* Technician Search Bar */}
                                    <div style={{ position: "relative", marginBottom: "1rem", width: "100%", boxSizing: "border-box" }}>
                                        <FiSearch style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "1rem", zIndex: 1 }} />
                                        <input
                                            type="text"
                                            placeholder="Search by technician name, city, district, state, specialization..."
                                            value={techSearchQuery}
                                            onChange={(e) => setTechSearchQuery(e.target.value)}
                                            style={{
                                                width: "100%",
                                                boxSizing: "border-box",
                                                padding: "0.7rem 0.9rem 0.7rem 2.5rem",
                                                borderRadius: "10px",
                                                border: "1px solid #cbd5e1",
                                                fontSize: "0.875rem",
                                                outline: "none",
                                                background: "#ffffff",
                                                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
                                            }}
                                        />
                                    </div>

                                    {/* Interactive Custom Card List */}
                                    <div style={{ maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem", paddingRight: "0.3rem" }}>
                                        {filteredTechniciansForModal.length === 0 ? (
                                            <div style={{ textAlign: "center", padding: "2rem 1rem", background: "#ffffff", borderRadius: "10px", border: "1px dashed #cbd5e1", color: "#64748b", fontSize: "0.875rem" }}>
                                                No technicians match "{techSearchQuery}".
                                            </div>
                                        ) : (
                                            filteredTechniciansForModal.map(tech => {
                                                const id = String(tech.technicianId || tech.TechnicianId);
                                                const name = `${tech.firstName || tech.FirstName || ""} ${tech.lastName || tech.LastName || ""}`.trim();
                                                const city = tech.city || tech.City || "";
                                                const district = tech.district || tech.District || "";
                                                const state = tech.state || tech.State || "";
                                                const pin = tech.pinCode || tech.PinCode || "";
                                                const locParts = [city, district, state].filter(Boolean);
                                                const locString = locParts.length > 0 ? (pin ? `${locParts.join(", ")} - ${pin}` : locParts.join(", ")) : "Location N/A";
                                                const spec = tech.specialization || tech.Specialization || tech.inspectionCenterName || tech.InspectionCenterName || "";
                                                const isSelected = String(selectedTechId) === id;

                                                return (
                                                    <div
                                                        key={id}
                                                        onClick={() => setSelectedTechId(id)}
                                                        style={{
                                                            padding: "0.85rem 1rem",
                                                            borderRadius: "12px",
                                                            border: isSelected ? "2px solid #0284c7" : "1px solid #e2e8f0",
                                                            background: isSelected ? "#f0f9ff" : "#ffffff",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            gap: "1rem",
                                                            transition: "all 0.15s ease",
                                                            boxShadow: isSelected ? "0 4px 12px rgba(2,132,199,0.12)" : "0 1px 3px rgba(0,0,0,0.02)"
                                                        }}
                                                    >
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                                            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: isSelected ? "#0284c7" : "#e2e8f0", color: isSelected ? "#ffffff" : "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem", flexShrink: 0 }}>
                                                                {name.charAt(0).toUpperCase() || "T"}
                                                            </div>
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                                                    <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.925rem" }}>{name}</span>
                                                                    {spec && (
                                                                        <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "0.15rem 0.55rem", borderRadius: "6px", fontSize: "0.725rem", fontWeight: 700 }}>
                                                                            {spec}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#64748b", fontSize: "0.8rem" }}>
                                                                    <FiMapPin style={{ color: "#0284c7", flexShrink: 0 }} />
                                                                    <span>{locString}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: "flex", alignItems: "center" }}>
                                                            {isSelected ? (
                                                                <FiCheckCircle style={{ color: "#0284c7", fontSize: "1.3rem" }} />
                                                            ) : (
                                                                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #cbd5e1" }}></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={manualAllocatingLoading || !selectedTechId}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "10px",
                                            background: selectedTechId ? "#0284c7" : "#cbd5e1",
                                            color: "#ffffff",
                                            border: "none",
                                            fontWeight: 700,
                                            fontSize: "0.9rem",
                                            cursor: selectedTechId ? "pointer" : "not-allowed",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "0.5rem",
                                            boxShadow: selectedTechId ? "0 4px 12px rgba(2,132,199,0.2)" : "none",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        <FiCpu /> Assign Selected Technician
                                    </button>
                                </form>
                            </div>

                            <div className="modal-footer-actions" style={{ marginTop: "1rem" }}>
                                <button
                                    type="button"
                                    className="action-btn--cancel"
                                    onClick={() => setManualAllocatingDevice(null)}
                                >
                                    <FiX /> Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Manage_device;