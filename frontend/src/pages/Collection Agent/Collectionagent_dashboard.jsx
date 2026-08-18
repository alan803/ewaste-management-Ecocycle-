import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import {
    FiTruck,
    FiCheckCircle,
    FiClock,
    FiMapPin,
    FiPhoneCall,
    FiPackage,
    FiNavigation,
    FiInfo,
    FiX,
    FiBox,
    FiCheck,
    FiRefreshCw,
    FiSearch,
    FiAlertCircle,
    FiBell,
    FiList,
    FiGrid,
    FiUser,
    FiCalendar,
    FiTag,
    FiLayers
} from "react-icons/fi";
import "./Collectionagent_dashboard.css";

function CollectionAgentDashboard() {
    const navigate = useNavigate();
    const [isOnDuty, setIsOnDuty] = useState(true);
    const [activeTab, setActiveTab] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pickups, setPickups] = useState([]);
    const [selectedPickup, setSelectedPickup] = useState(null);
    const [viewMode, setViewMode] = useState("table"); // "table" or "grid"

    // Accept / Reject Modal State
    const [rejectionTarget, setRejectionTarget] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [processingId, setProcessingId] = useState(null);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found, redirecting to login.");
            navigate("/");
            return;
        }
        fetchAssignedPickups(token);
        fetchUnreadNotificationsCount();
    }, [navigate]);

    const fetchUnreadNotificationsCount = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const response = await axios.get(
                "https://localhost:7102/api/Notificationcon/my_notifications",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            if (Array.isArray(response.data)) {
                const unread = response.data.filter((n) => !n.isRead).length;
                setUnreadNotifCount(unread);
            }
        } catch (err) {
            console.error("Error fetching unread notification count:", err);
        }
    };

    const fetchAssignedPickups = async (token) => {
        const authToken = token || localStorage.getItem("token");
        fetchUnreadNotificationsCount();
        try {
            setLoading(true);
            setError("");
            const response = await axios.get("https://localhost:7102/api/CollectionAssignment/my-assignments", {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            console.log("Collection Agent Assignments:", response.data);
            setPickups(response.data || []);
        } catch (err) {
            console.error("Error fetching collection assignments:", err);
            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
                localStorage.clear();
                navigate("/");
            } else {
                setError(err.response?.data?.message || "Failed to load assigned pickup requests.");
                setPickups([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (assignmentId) => {
        try {
            setProcessingId(assignmentId);
            const token = localStorage.getItem("token");
            await axios.post(
                `https://localhost:7102/api/CollectionAssignment/accept/${assignmentId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setPickups(prev =>
                prev.map(p => (p.collectionAssignmentId === assignmentId ? { ...p, status: "Accepted" } : p))
            );
            if (selectedPickup?.collectionAssignmentId === assignmentId) {
                setSelectedPickup(prev => prev ? { ...prev, status: "Accepted" } : null);
            }
        } catch (err) {
            console.error("Error accepting assignment:", err);
            alert("Failed to accept collection request.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectSubmit = async (e) => {
        e.preventDefault();
        if (!rejectionTarget) return;

        try {
            setProcessingId(rejectionTarget.collectionAssignmentId);
            const token = localStorage.getItem("token");

            await axios.post(
                `https://localhost:7102/api/CollectionAssignment/reject/${rejectionTarget.collectionAssignmentId}`,
                JSON.stringify(rejectionReason || "Unable to collect at this time."),
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            setPickups(prev => prev.filter(p => p.collectionAssignmentId !== rejectionTarget.collectionAssignmentId));
            if (selectedPickup?.collectionAssignmentId === rejectionTarget.collectionAssignmentId) {
                setSelectedPickup(null);
            }
            setRejectionTarget(null);
            setRejectionReason("");
        } catch (err) {
            console.error("Error rejecting assignment:", err);
            const msg = err.response?.data?.message || err.response?.data?.error || "Error rejecting collection assignment.";
            alert(msg);
        } finally {
            setProcessingId(null);
        }
    };

    const agentName = localStorage.getItem("firstName") ||
                      localStorage.getItem("userName") ||
                      localStorage.getItem("username") ||
                      localStorage.getItem("name") ||
                      "Collection Agent";

    const filteredPickups = pickups.filter((item) => {
        const matchesSearch =
            (item.brand || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.model || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.customerPhone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.address || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.categoryName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.condition || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.rejectionReason || "").toLowerCase().includes(searchQuery.toLowerCase());

        const statusLower = (item.status || "").toLowerCase();
        const activeTabLower = activeTab.toLowerCase();

        let matchesTab = true;
        if (activeTabLower === "assigned") {
            matchesTab = statusLower === "assigned" || statusLower === "pending";
        } else if (activeTabLower === "accepted") {
            matchesTab = statusLower === "accepted";
        } else if (activeTabLower === "pickupstarted" || activeTabLower === "en route") {
            matchesTab = statusLower === "pickupstarted" || statusLower === "en route";
        } else if (activeTabLower === "completed") {
            matchesTab = statusLower === "completed";
        } else if (activeTabLower === "rejected" || activeTabLower === "declined") {
            matchesTab = statusLower === "rejected" || statusLower === "declined";
        }

        return matchesSearch && matchesTab;
    });

    const getStatusBadge = (status) => {
        switch ((status || "").toLowerCase()) {
            case "completed":
                return <span className="agent-status-badge collected"><FiCheckCircle /> Completed</span>;
            case "pickupstarted":
            case "en route":
                return <span className="agent-status-badge en-route"><FiTruck /> En Route</span>;
            case "accepted":
                return <span className="agent-status-badge accepted"><FiCheck /> Accepted</span>;
            case "rejected":
            case "declined":
                return <span className="agent-status-badge rejected"><FiX /> Declined</span>;
            case "assigned":
            case "pending":
            default:
                return <span className="agent-status-badge pending"><FiClock /> Assigned</span>;
        }
    };

    const totalCount = pickups.length;
    const totalUnits = pickups.reduce((acc, p) => acc + (p.quantity || 1), 0);
    const assignedCount = pickups.filter(p => {
        const s = (p.status || "").toLowerCase();
        return s === "assigned" || s === "pending";
    }).length;
    const activeCount = pickups.filter(p => {
        const s = (p.status || "").toLowerCase();
        return s === "accepted" || s === "pickupstarted" || s === "en route";
    }).length;

    return (
        <div className="agent-dashboard-layout">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Dashboard */}
            <main className="agent-main-content">
                {/* Embedded Dashboard Topbar */}
                <Navbar 
                    hasSidebar={true}
                    isOnDuty={isOnDuty} 
                    setIsOnDuty={setIsOnDuty}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onRefresh={() => fetchAssignedPickups()}
                    loading={loading}
                    unreadNotifCount={unreadNotifCount}
                    assignedCount={assignedCount}
                />

                {/* Metric Summary Cards Grid */}
                <div className="agent-kpi-grid">
                    <div className="agent-kpi-card emerald-accent">
                        <div className="agent-kpi-top">
                            <div className="agent-kpi-icon emerald">
                                <FiTruck />
                            </div>
                            <span className="agent-kpi-badge">Active</span>
                        </div>
                        <div>
                            <h3 className="agent-kpi-val">{totalCount} Tasks</h3>
                            <div className="agent-kpi-lbl">Assigned Devices</div>
                        </div>
                    </div>

                    <div className="agent-kpi-card blue-accent">
                        <div className="agent-kpi-top">
                            <div className="agent-kpi-icon blue">
                                <FiPackage />
                            </div>
                            <span className="agent-kpi-badge blue-pill">Total Units</span>
                        </div>
                        <div>
                            <h3 className="agent-kpi-val">{totalUnits} Units</h3>
                            <div className="agent-kpi-lbl">E-Waste Quantity</div>
                        </div>
                    </div>

                    <div className="agent-kpi-card amber-accent">
                        <div className="agent-kpi-top">
                            <div className="agent-kpi-icon amber">
                                <FiClock />
                            </div>
                            <span className="agent-kpi-badge amber-pill">Action Required</span>
                        </div>
                        <div>
                            <h3 className="agent-kpi-val">{assignedCount} Pending</h3>
                            <div className="agent-kpi-lbl">Newly Assigned</div>
                        </div>
                    </div>

                    <div className="agent-kpi-card purple-accent">
                        <div className="agent-kpi-top">
                            <div className="agent-kpi-icon purple">
                                <FiNavigation />
                            </div>
                            <span className="agent-kpi-badge purple-pill">In Route</span>
                        </div>
                        <div>
                            <h3 className="agent-kpi-val">{activeCount} Active</h3>
                            <div className="agent-kpi-lbl">Accepted / En Route</div>
                        </div>
                    </div>
                </div>

                {/* Full-Width Assigned Pickups Panel */}
                <div className="agent-panel-card">
                    <div className="agent-panel-header">
                        <div>
                            <h2 className="agent-panel-title">My Assigned Pickups</h2>
                            <p className="agent-panel-subtitle">Manage allocated citizen e-waste collection requests</p>
                        </div>

                        <div className="panel-controls-row">
                            <div className="agent-tab-pills">
                                {["All", "Assigned", "Accepted", "PickupStarted"].map((tab) => (
                                    <button
                                        key={tab}
                                        className={`agent-tab-btn ${activeTab === tab ? "active" : ""}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab === "PickupStarted" ? "En Route" : tab} ({
                                            tab === "All"
                                                ? pickups.length
                                                : pickups.filter(p => {
                                                    const s = (p.status || "").toLowerCase();
                                                    if (tab === "Assigned") return s === "assigned" || s === "pending";
                                                    return s === tab.toLowerCase();
                                                }).length
                                        })
                                    </button>
                                ))}
                            </div>

                            {/* Table / Grid View Toggle */}
                            <div className="view-toggle-wrap">
                                <button
                                    className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
                                    onClick={() => setViewMode("table")}
                                    title="Table View"
                                >
                                    <FiList />
                                </button>
                                <button
                                    className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                                    onClick={() => setViewMode("grid")}
                                    title="Grid Card View"
                                >
                                    <FiGrid />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="agent-content-body">
                        {loading ? (
                            <div className="state-box">
                                <div className="spinner"></div>
                                <p>Loading assigned pickup tasks...</p>
                            </div>
                        ) : error ? (
                            <div className="state-box error-box">
                                <FiAlertCircle className="state-icon-red" />
                                <p>{error}</p>
                                <button
                                    onClick={() => fetchAssignedPickups()}
                                    className="btn btn-secondary"
                                    style={{ marginTop: "0.75rem" }}
                                >
                                    Retry
                                </button>
                            </div>
                        ) : filteredPickups.length === 0 ? (
                            <div className="state-box empty-box">
                                <FiBox className="state-icon-gray" />
                                <p className="empty-title">
                                    No assigned devices match "{activeTab}".
                                </p>
                                <p className="empty-sub">
                                    {searchQuery ? "Try altering your search query." : "When new pickups are assigned, they will appear here."}
                                </p>
                            </div>
                        ) : viewMode === "grid" ? (
                            <div className="pickup-cards-grid">
                                {filteredPickups.map((task) => {
                                    const statusLower = (task.status || "").toLowerCase();
                                    const canAccept = statusLower === "assigned" || statusLower === "pending";
                                    const canDecline = statusLower === "assigned" || statusLower === "pending" || statusLower === "accepted";
                                    const nameInitial = (task.customerName || "C").charAt(0).toUpperCase();

                                    return (
                                        <div key={task.collectionAssignmentId} className={`pickup-card-item card-status-${statusLower}`}>
                                            <div className="card-status-bar"></div>
                                            <div>
                                                <div className="card-item-top">
                                                    <div>
                                                        <span className="card-id-tag">
                                                            #{task.collectionAssignmentId}
                                                        </span>
                                                        <h3 className="card-device-title">{task.brand} {task.model}</h3>
                                                    </div>
                                                    {getStatusBadge(task.status)}
                                                </div>

                                                <div className="card-citizen-box">
                                                    <div className="citizen-avatar">{nameInitial}</div>
                                                    <div>
                                                        <div className="info-text-bold">{task.customerName || "Citizen"}</div>
                                                        <a href={`tel:${task.customerPhone}`} className="info-text-phone">
                                                            <FiPhoneCall /> {task.customerPhone || "N/A"}
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="card-device-tags">
                                                    <span className="category-chip">
                                                        <FiTag /> {task.categoryName || "E-Waste"}
                                                    </span>
                                                    <span className="condition-chip">
                                                        {task.condition || "Standard"}
                                                    </span>
                                                    <span className="qty-chip">
                                                        <FiLayers /> Qty: {task.quantity || 1}
                                                    </span>
                                                </div>

                                                <div className="card-location-box">
                                                    <FiMapPin className="info-icon-green" />
                                                    <div>
                                                        <div className="loc-address">{task.address}</div>
                                                        {(task.city || task.district) && (
                                                            <div className="loc-sub">{[task.city, task.district, task.state].filter(Boolean).join(", ")}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="card-slot-chip">
                                                    <FiClock />
                                                    <span>{task.pickupDate ? new Date(task.pickupDate).toLocaleDateString() : "Scheduled"} • ({task.timeSlot || "Standard Slot"})</span>
                                                </div>
                                            </div>

                                            <div className="card-actions-row">
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={() => setSelectedPickup(task)}
                                                    style={{ flex: 1, justifyContent: "center" }}
                                                >
                                                    <FiInfo /> Details
                                                </button>

                                                {canAccept && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAccept(task.collectionAssignmentId)}
                                                        disabled={processingId === task.collectionAssignmentId}
                                                        className="btn btn-success"
                                                        style={{ flex: 1, justifyContent: "center" }}
                                                    >
                                                        <FiCheck /> Accept
                                                    </button>
                                                )}

                                                {canDecline && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setRejectionTarget(task)}
                                                        disabled={processingId === task.collectionAssignmentId}
                                                        className="btn btn-danger"
                                                        style={{ flex: 1, justifyContent: "center" }}
                                                    >
                                                        <FiX /> Decline
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="agent-table-wrapper">
                                <table className="agent-table">
                                    <thead>
                                        <tr>
                                            <th>Citizen & Contact</th>
                                            <th>Device Details</th>
                                            <th>Pickup Location</th>
                                            <th>Scheduled Slot</th>
                                            <th style={{ minWidth: "230px" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPickups.map((task) => {
                                            const statusLower = (task.status || "").toLowerCase();
                                            const canAccept = statusLower === "assigned" || statusLower === "pending";
                                            const canDecline = statusLower === "assigned" || statusLower === "pending" || statusLower === "accepted";
                                            const nameInitial = (task.customerName || "C").charAt(0).toUpperCase();

                                            return (
                                                <tr key={task.collectionAssignmentId} className={`table-row-status-${statusLower}`}>
                                                    <td>
                                                        <div className="citizen-cell-wrap">
                                                            <div className="citizen-avatar-sm">{nameInitial}</div>
                                                            <div>
                                                                <div className="cell-title">{task.customerName || "Citizen"}</div>
                                                                <a href={`tel:${task.customerPhone}`} className="cell-phone-pill">
                                                                    <FiPhoneCall /> {task.customerPhone || "N/A"}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="cell-title-lg">{task.brand} {task.model}</div>
                                                        <div className="cell-device-meta">
                                                            <span className="category-chip">
                                                                <FiTag /> {task.categoryName || "E-Waste"}
                                                            </span>
                                                            <span className="condition-chip">
                                                                {task.condition || "Standard"}
                                                            </span>
                                                            <span className="qty-chip">
                                                                Qty: {task.quantity || 1}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="cell-address">
                                                            <FiMapPin className="pin-icon" />
                                                            <span className="address-bold">{task.address}</span>
                                                        </div>
                                                        {(task.city || task.district) && (
                                                            <div className="cell-sub-loc">
                                                                {[task.city, task.district, task.state].filter(Boolean).join(", ")}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="cell-date-pill">
                                                            <FiCalendar className="calendar-icon" />
                                                            <span>{task.pickupDate ? new Date(task.pickupDate).toLocaleDateString() : "Scheduled"}</span>
                                                        </div>
                                                        <div className="cell-slot-badge-wrap">
                                                            <span className="slot-chip">
                                                                <FiClock /> {task.timeSlot || "Standard Slot"}
                                                            </span>
                                                            {getStatusBadge(task.status)}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="cell-actions-flex">
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary"
                                                                onClick={() => setSelectedPickup(task)}
                                                                title="View Pickup Details"
                                                            >
                                                                <FiInfo /> Details
                                                            </button>

                                                            {canAccept && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAccept(task.collectionAssignmentId)}
                                                                    disabled={processingId === task.collectionAssignmentId}
                                                                    className="btn btn-success"
                                                                >
                                                                    <FiCheck /> Accept
                                                                </button>
                                                            )}

                                                            {canDecline && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setRejectionTarget(task)}
                                                                    disabled={processingId === task.collectionAssignmentId}
                                                                    className="btn btn-danger"
                                                                >
                                                                    <FiX /> Decline
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
                    </div>
                </div>
            </main>

            {/* Task Details Modal */}
            {selectedPickup && (
                <div className="modal-overlay" onClick={() => setSelectedPickup(null)}>
                    <div className="clean-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>Pickup Assignment </h2>
                                <p className="modal-sub">{selectedPickup.brand} {selectedPickup.model}</p>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedPickup(null)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="modal-content">
                            <div className="modal-top-meta">
                                <div>
                                    <span className="modal-meta-lbl">Scheduled Slot</span>
                                    <div className="modal-meta-val">
                                        {selectedPickup.pickupDate ? new Date(selectedPickup.pickupDate).toLocaleDateString() : "Scheduled"} ({selectedPickup.timeSlot || "Slot N/A"})
                                    </div>
                                </div>
                                {getStatusBadge(selectedPickup.status)}
                            </div>

                            <div className="modal-grid-box">
                                <div className="modal-info-card">
                                    <div className="info-card-lbl">Citizen Contact</div>
                                    <div className="info-card-val">
                                        {selectedPickup.customerName || "N/A"}
                                    </div>
                                    <div className="info-card-phone">
                                        <FiPhoneCall /> {selectedPickup.customerPhone || "N/A"}
                                    </div>
                                </div>

                                <div className="modal-info-card">
                                    <div className="info-card-lbl flex-lbl">
                                        <FiMapPin /> Pickup Location
                                    </div>
                                    <div className="info-card-address">
                                        {selectedPickup.address}
                                    </div>
                                    {selectedPickup.landmark && (
                                        <div className="info-card-sub">
                                            Landmark: {selectedPickup.landmark}
                                        </div>
                                    )}
                                    {(selectedPickup.city || selectedPickup.district || selectedPickup.state || selectedPickup.pincode) && (
                                        <div className="info-card-sub">
                                            {[selectedPickup.city, selectedPickup.district, selectedPickup.state, selectedPickup.pincode].filter(Boolean).join(", ")}
                                        </div>
                                    )}
                                </div>

                                <div className="modal-info-card">
                                    <div className="info-card-lbl">Device Details</div>
                                    <div className="info-card-val">
                                        {selectedPickup.brand} {selectedPickup.model}
                                    </div>
                                    <div className="info-card-green">
                                        Category: {selectedPickup.categoryName} • Quantity: {selectedPickup.quantity} • Condition: {selectedPickup.condition || "Standard"}
                                    </div>
                                    {selectedPickup.working && (
                                        <div className="info-card-sub">
                                            Working State: {selectedPickup.working}
                                        </div>
                                    )}
                                </div>

                                {selectedPickup.pickupInstructions && (
                                    <div className="modal-info-card">
                                        <div className="info-card-lbl">Pickup Instructions</div>
                                        <div className="info-card-notes">
                                            {selectedPickup.pickupInstructions}
                                        </div>
                                    </div>
                                )}

                                {(selectedPickup.status?.toLowerCase() === "rejected" || selectedPickup.status?.toLowerCase() === "declined" || selectedPickup.rejectionReason) && (
                                    <div className="modal-danger-card">
                                        <div className="danger-lbl">
                                            <FiAlertCircle /> Reason for Rejection
                                        </div>
                                        <div className="danger-val">
                                            {selectedPickup.rejectionReason || "No specific reason provided."}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Decline Modal */}
            {rejectionTarget && (
                <div className="modal-overlay" onClick={() => setRejectionTarget(null)}>
                    <div className="clean-modal" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>Decline Request</h2>
                                <p className="modal-sub">Assignment #{rejectionTarget.collectionAssignmentId}</p>
                            </div>
                            <button className="close-btn" onClick={() => setRejectionTarget(null)}>
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={handleRejectSubmit}>
                            <div style={{ margin: "1rem 0" }}>
                                <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.5rem" }}>
                                    Reason for declining request:
                                </label>
                                <textarea
                                    className="clean-textarea"
                                    placeholder="Enter reason for declining..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    required
                                    rows={4}
                                ></textarea>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setRejectionTarget(null)}>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-danger"
                                    disabled={processingId === rejectionTarget.collectionAssignmentId}
                                >
                                    Decline Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CollectionAgentDashboard;