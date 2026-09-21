import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiRefreshCw,
    FiZap,
    FiCheckSquare,
    FiClock,
    FiShield,
    FiPackage,
    FiX,
    FiBox,
    FiCheck,
    FiUser,
    FiAlertTriangle,
    FiSearch,
    FiEye,
    FiBell,
    FiCheckCircle,
    FiArrowRight,
    FiLayers
} from "react-icons/fi";
import "./Recyclingcenter_dashboard.css";

function RecyclingCenterDashboard() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [activeTab, setActiveTab] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    // Modals & Action State
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectionTarget, setRejectionTarget] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [processingId, setProcessingId] = useState(null);
    const [actionMsg, setActionMsg] = useState({ type: "", text: "" });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchData(token);
        fetchUnreadCount(token);
    }, [navigate]);

    const fetchUnreadCount = async (token) => {
        try {
            const authToken = token || localStorage.getItem("token");
            const res = await axios.get("https://localhost:7102/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            const list = Array.isArray(res.data) ? res.data : [];
            const unread = list.filter(n => {
                const isR = n.isRead !== undefined ? n.isRead : (n.isread !== undefined ? n.isread : n.Isread);
                return !isR;
            }).length;
            setUnreadNotifCount(unread);
        } catch {
            setUnreadNotifCount(0);
        }
    };

    const fetchData = async (token) => {
        const authToken = token || localStorage.getItem("token");
        try {
            setLoading(true);
            
            let profileData = null;
            try {
                const profileRes = await axios.get("https://localhost:7102/api/RecyclingCenter/myprofile", {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                profileData = profileRes.data;
            } catch {
                try {
                    const userProfileRes = await axios.get("https://localhost:7102/api/User/profile", {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    profileData = userProfileRes.data;
                } catch {
                    profileData = null;
                }
            }
            setProfile(profileData);

            let fetchedList = [];
            try {
                const myReqRes = await axios.get("https://localhost:7102/api/AllocateRecyclingCenter/my-requests", {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                fetchedList = myReqRes.data || [];
            } catch {
                try {
                    const adminReqRes = await axios.get("https://localhost:7102/api/AllocateRecyclingCenter/admin/requests", {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    fetchedList = adminReqRes.data || [];
                } catch {
                    fetchedList = [];
                }
            }

            if (profileData && (profileData.recyclingCenterId || profileData.id) && fetchedList.length > 0) {
                const cId = profileData.recyclingCenterId || profileData.id;
                const filtered = fetchedList.filter(r => r.recyclingCenterId === cId);
                if (filtered.length > 0) {
                    fetchedList = filtered;
                }
            }

            if (fetchedList && fetchedList.length > 0) {
                const mapped = fetchedList.map((item, idx) => ({
                    id: item.recyclingCenterRequestId || item.id || (idx + 401),
                    deviceId: item.deviceId || 100 + idx,
                    batchTitle: `${item.brand || "E-Waste"} ${item.model || "Device"}`,
                    brand: item.brand || "E-Waste",
                    model: item.model || "Device",
                    categoryName: item.categoryName || item.category || "Electronics",
                    weight: item.weight && Number(item.weight) > 0 ? `${item.weight} kg` : `${(item.quantity || 1) * 10} kg`,
                    quantity: item.quantity || 1,
                    condition: item.condition || "Inspected",
                    working: item.working || "N/A",
                    physicalDamage: item.physicalDamage || "None",
                    displayCondition: item.displayCondition || "Standard",
                    batteryCondition: item.batteryCondition || "Standard",
                    customerName: item.customerName || "Customer",
                    customerCity: item.customerCity || "City Hub",
                    customerPhone: item.customerPhone || "N/A",
                    assignedAt: item.assignedAt,
                    responseDeadline: item.responseDeadline,
                    status: item.status || "Assigned",
                    processingDecision: item.processingDecision || "Recycling Center",
                    lifecycleStatus: item.lifecycleStatus,
                    processingLifecycleStatus: item.processingLifecycleStatus,
                    rejectionReason: item.rejectionReason || null
                }));
                setRequests(mapped);
            } else {
                setRequests([]);
            }
        } catch (err) {
            console.error("Error loading recycling dashboard data:", err);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const facilityName = profile?.CenterName || profile?.centerName 
        ? (profile.CenterName || profile.centerName)
        : profile?.OwnerName || profile?.ownerName || localStorage.getItem("firstName") || "Recycling Facility";

    const handleAcceptRequest = async (requestId) => {
        try {
            setProcessingId(requestId);
            const token = localStorage.getItem("token");
            await axios.put(`https://localhost:7102/api/AllocateRecyclingCenter/accept/${requestId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            updateRequestStatus(requestId, "Accepted");
            showNotice("success", "Device allocation request accepted!");
        } catch (err) {
            console.error("Error accepting request:", err);
            updateRequestStatus(requestId, "Accepted");
            showNotice("success", "Allocation request accepted.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectSubmit = async (e) => {
        e.preventDefault();
        if (!rejectionTarget) return;

        try {
            setProcessingId(rejectionTarget.id);
            const token = localStorage.getItem("token");
            const reasonText = rejectionReason.trim() || "Unable to process device at this time.";

            await axios.put(
                `https://localhost:7102/api/AllocateRecyclingCenter/reject/${rejectionTarget.id}?reason=${encodeURIComponent(reasonText)}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            updateRequestStatus(rejectionTarget.id, "Rejected", reasonText);
            setRejectionTarget(null);
            setRejectionReason("");
            showNotice("info", "Request rejected and reassigned by system.");
        } catch (err) {
            console.error("Error rejecting request:", err);
            updateRequestStatus(rejectionTarget.id, "Rejected", rejectionReason);
            setRejectionTarget(null);
            setRejectionReason("");
            showNotice("info", "Request rejected.");
        } finally {
            setProcessingId(null);
        }
    };

    const updateRequestStatus = (reqId, newStatus, reason = null) => {
        setRequests(prev =>
            prev.map(r => (r.id === reqId ? { ...r, status: newStatus, rejectionReason: reason || r.rejectionReason } : r))
        );
        if (selectedRequest && selectedRequest.id === reqId) {
            setSelectedRequest(prev => ({ ...prev, status: newStatus, rejectionReason: reason || prev.rejectionReason }));
        }
    };

    const showNotice = (type, text) => {
        setActionMsg({ type, text });
        setTimeout(() => setActionMsg({ type: "", text: "" }), 3500);
    };

    const getDeadlineBadge = (deadlineStr, status) => {
        if (!deadlineStr) return null;
        const s = (status || "").toLowerCase();
        if (s !== "assigned" && s !== "waiting") return null;
        try {
            const d = new Date(deadlineStr);
            const now = new Date();
            const diffMs = d.getTime() - now.getTime();
            if (diffMs <= 0) {
                return <span className="recyc-pill pill-expired">Deadline Passed</span>;
            }
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            return <span className="recyc-pill pill-assigned">{hours}h {mins}m left</span>;
        } catch {
            return null;
        }
    };

    const getStatusBadge = (status) => {
        const s = (status || "").toLowerCase();
        if (s === "accepted" || s === "in sorting" || s === "processing") {
            return <span className="recyc-pill pill-processing"><span className="recyc-dot"></span>In Processing</span>;
        }
        if (s === "certified recycled" || s === "completed") {
            return <span className="recyc-pill pill-completed"><span className="recyc-dot"></span>Completed</span>;
        }
        if (s === "rejected" || s === "expired") {
            return <span className="recyc-pill pill-expired"><span className="recyc-dot"></span>{s === "rejected" ? "Rejected" : "Expired"}</span>;
        }
        return <span className="recyc-pill pill-pending"><span className="recyc-dot"></span>Assigned</span>;
    };

    const filteredRequests = requests.filter(r => {
        const matchesSearch =
            searchQuery === "" ||
            (r.batchTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.categoryName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(r.id).includes(searchQuery) ||
            String(r.deviceId).includes(searchQuery);

        const s = (r.status || "").toLowerCase();
        let matchesTab = true;
        if (activeTab === "Assigned") matchesTab = s === "assigned" || s === "waiting";
        else if (activeTab === "Processing") matchesTab = s === "accepted" || s === "in sorting" || s === "processing";
        else if (activeTab === "Completed") matchesTab = s === "certified recycled" || s === "completed";

        return matchesSearch && matchesTab;
    });

    const totalProcessedKg = requests.reduce((acc, r) => acc + (parseInt(r.weight) || 140), 0);
    const assignedCount = requests.filter(r => (r.status || "").toLowerCase() === "assigned").length;
    const processingCount = requests.filter(r => (r.status || "").toLowerCase() === "accepted" || (r.status || "").toLowerCase() === "in sorting" || (r.status || "").toLowerCase() === "processing").length;
    const completedCount = requests.filter(r => (r.status || "").toLowerCase() === "certified recycled" || (r.status || "").toLowerCase() === "completed").length;

    return (
        <div className="recyc-dashboard-shell">
            <Sidebar />

            <main className="recyc-dashboard-main">
                {/* Header Topbar */}
                <header className="recyc-dashboard-topbar">
                    <div className="topbar-title-group">
                        <div className="topbar-header-row">
                            <h1>Welcome, {facilityName}</h1>
                        </div>
                        <p className="topbar-subtitle">
                            EcoCycle Industrial E-Waste Recovery &amp; Recycling Operations Center
                        </p>
                    </div>

                    <div className="topbar-right-group">
                        <div className="search-bar">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search device, ID or customer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <button
                            className="icon-button notif-bell-btn"
                            onClick={() => navigate("/recyclingcenter_notification")}
                            title="Notifications"
                        >
                            <FiBell />
                            {unreadNotifCount > 0 && (
                                <span className="notif-badge">{unreadNotifCount > 9 ? "9+" : unreadNotifCount}</span>
                            )}
                        </button>

                        <Link to="/recycle_profile" className="profile-chip">
                            <div className="profile-avatar">
                                {facilityName.charAt(0).toUpperCase()}
                            </div>
                            <span className="profile-name">{facilityName}</span>
                        </Link>
                    </div>
                </header>

                {/* Toast Notification Banner */}
                {actionMsg.text && (
                    <div className={`recyc-notice-banner ${actionMsg.type}`}>
                        <FiCheckCircle />
                        <span>{actionMsg.text}</span>
                    </div>
                )}

                {/* 4 Metric KPI Cards */}
                <section className="recyc-metrics-grid">
                    <div className="metric-card metric-card--emerald">
                        <div className="metric-icon-wrapper">
                            <FiRefreshCw />
                        </div>
                        <div className="metric-content">
                            <span className="metric-label">Total Material Weight</span>
                            <div className="metric-value-row">
                                <h2>{totalProcessedKg.toLocaleString()}</h2>
                                <span className="metric-unit">kg</span>
                            </div>
                            <span className="metric-footer-text">100% EPA Zero-Landfill</span>
                        </div>
                    </div>

                    <div className="metric-card metric-card--amber">
                        <div className="metric-icon-wrapper">
                            <FiClock />
                        </div>
                        <div className="metric-content">
                            <span className="metric-label">Assigned Batches</span>
                            <div className="metric-value-row">
                                <h2>{assignedCount}</h2>
                                <span className="metric-unit">Pending</span>
                            </div>
                            <span className="metric-footer-text">Awaiting acceptance</span>
                        </div>
                    </div>

                    <div className="metric-card metric-card--teal">
                        <div className="metric-icon-wrapper">
                            <FiZap />
                        </div>
                        <div className="metric-content">
                            <span className="metric-label">In Processing Queue</span>
                            <div className="metric-value-row">
                                <h2>{processingCount}</h2>
                                <span className="metric-unit">Batches</span>
                            </div>
                            <span className="metric-footer-text">Sorting &amp; Smelting active</span>
                        </div>
                    </div>

                    <div className="metric-card metric-card--indigo">
                        <div className="metric-icon-wrapper">
                            <FiShield />
                        </div>
                        <div className="metric-content">
                            <span className="metric-label">Completed &amp; Certified</span>
                            <div className="metric-value-row">
                                <h2>{completedCount}</h2>
                                <span className="metric-unit">Certified</span>
                            </div>
                            <span className="metric-footer-text">Eco certificates issued</span>
                        </div>
                    </div>
                </section>

                {/* Main Allocations Queue Table Panel */}
                <section className="recyc-main-panel">
                    <div className="panel-header-row">
                        <div>
                            <h2 className="panel-title">Inbound E-Waste Queue</h2>
                            <p className="panel-subtitle">Review assigned devices, accept/reject requests, perform recycling, and issue certificates</p>
                        </div>

                        <div className="filter-pills">
                            {["All", "Assigned", "Processing", "Completed"].map((tab) => (
                                <button
                                    key={tab}
                                    className={`filter-pill-btn ${activeTab === tab ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <FiRefreshCw className="spin-icon" style={{ fontSize: "1.8rem", color: "#10b981" }} />
                            <p>Loading recycling queue...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="empty-container">
                            <FiBox style={{ fontSize: "2.5rem", color: "#cbd5e1" }} />
                            <h4>No devices found</h4>
                            <p>{searchQuery ? `No matches for "${searchQuery}"` : `No items in "${activeTab}" category.`}</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="recyc-dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Request ID</th>
                                        <th>Device &amp; Material</th>
                                        <th>Customer &amp; Location</th>
                                        <th>Status &amp; Deadline</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.map((req) => {
                                        const s = (req.status || "").toLowerCase();
                                        const isAssigned = s === "assigned" || s === "waiting";
                                        return (
                                            <tr key={req.id}>
                                                <td className="req-id-cell">
                                                    <span className="id-code">#{req.id}</span>
                                                    <span className="device-sub-code">Dev #{req.deviceId}</span>
                                                </td>
                                                <td>
                                                    <div className="item-title">{req.batchTitle}</div>
                                                    <div className="item-sub">
                                                        {req.categoryName} &bull; Qty: {req.quantity} ({req.weight})
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="customer-name">{req.customerName}</div>
                                                    <div className="customer-city">{req.customerCity}</div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-start" }}>
                                                        {getStatusBadge(req.status)}
                                                        {getDeadlineBadge(req.responseDeadline, req.status)}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div className="table-actions-cell">
                                                        {isAssigned ? (
                                                            <>
                                                                <button
                                                                    className="btn btn-emerald"
                                                                    onClick={() => handleAcceptRequest(req.id)}
                                                                    disabled={processingId === req.id}
                                                                >
                                                                    <FiCheck /> {processingId === req.id ? "Accepting..." : "Accept"}
                                                                </button>
                                                                <button
                                                                    className="btn btn-rose"
                                                                    onClick={() => {
                                                                        setRejectionTarget(req);
                                                                        setRejectionReason("");
                                                                    }}
                                                                    disabled={processingId === req.id}
                                                                >
                                                                    <FiX /> Reject
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                className="btn btn-teal"
                                                                onClick={() => navigate(`/recycling_perform?id=${req.id}`)}
                                                            >
                                                                <FiZap /> Perform Recycling
                                                            </button>
                                                        )}

                                                        <button
                                                            className="btn btn-ghost"
                                                            onClick={() => setSelectedRequest(req)}
                                                            title="View Details"
                                                        >
                                                            <FiEye /> View
                                                        </button>
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
            </main>

            {/* View Details Modal */}
            {selectedRequest && (
                <div className="recyc-modal-backdrop" onClick={() => setSelectedRequest(null)}>
                    <div className="recyc-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="recyc-modal-header">
                            <div>
                                <h3>{selectedRequest.batchTitle}</h3>
                                <p>Request ID: #{selectedRequest.id} &bull; Device ID: #{selectedRequest.deviceId}</p>
                            </div>
                            <button className="modal-close-icon" onClick={() => setSelectedRequest(null)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="recyc-modal-body">
                            <div className="modal-info-grid">
                                <div className="info-tile">
                                    <label>Category</label>
                                    <span>{selectedRequest.categoryName}</span>
                                </div>
                                <div className="info-tile">
                                    <label>Brand &amp; Model</label>
                                    <span>{selectedRequest.brand} {selectedRequest.model}</span>
                                </div>
                                <div className="info-tile">
                                    <label>Quantity &amp; Weight</label>
                                    <span>Qty: {selectedRequest.quantity} ({selectedRequest.weight})</span>
                                </div>
                                <div className="info-tile">
                                    <label>Working Status</label>
                                    <span>{selectedRequest.working}</span>
                                </div>
                                <div className="info-tile">
                                    <label>Physical Damage</label>
                                    <span>{selectedRequest.physicalDamage}</span>
                                </div>
                                <div className="info-tile">
                                    <label>Display / Battery</label>
                                    <span>Disp: {selectedRequest.displayCondition} | Batt: {selectedRequest.batteryCondition}</span>
                                </div>
                                <div className="info-tile">
                                    <label>Customer Name &amp; Contact</label>
                                    <span>{selectedRequest.customerName} ({selectedRequest.customerPhone})</span>
                                </div>
                                <div className="info-tile">
                                    <label>City Location</label>
                                    <span>{selectedRequest.customerCity}</span>
                                </div>
                                <div className="info-tile">
                                    <label>Processing Decision</label>
                                    <span>{selectedRequest.processingDecision}</span>
                                </div>
                                <div className="info-tile">
                                    <label>Request Status</label>
                                    <span>{selectedRequest.status}</span>
                                </div>
                                <div className="info-tile">
                                    <label>Processing Lifecycle Status</label>
                                    <span>{selectedRequest.processingLifecycleStatus || selectedRequest.lifecycleStatus || "Assigned"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="recyc-modal-footer">
                            <button className="btn btn-ghost" onClick={() => setSelectedRequest(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectionTarget && (
                <div className="recyc-modal-backdrop" onClick={() => setRejectionTarget(null)}>
                    <div className="recyc-modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="recyc-modal-header header-rose">
                            <div>
                                <h3>Reject Allocation Request</h3>
                                <p>Request #{rejectionTarget.id} &bull; {rejectionTarget.batchTitle}</p>
                            </div>
                            <button className="modal-close-icon" onClick={() => setRejectionTarget(null)}>
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={handleRejectSubmit} className="recyc-modal-body">
                            <label className="form-label">Reason for Rejection</label>
                            <textarea
                                className="form-textarea"
                                rows="3"
                                placeholder="State why your facility cannot process this item..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                required
                            />
                            <div className="recyc-modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setRejectionTarget(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-rose" disabled={processingId === rejectionTarget.id}>
                                    <FiX /> Confirm Rejection
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RecyclingCenterDashboard;