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
    const [todaysReminder, setTodaysReminder] = useState(null);
    const [showReminderModal, setShowReminderModal] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found, redirecting to login.");
            navigate("/");
            return;
        }
        fetchAssignedPickups(token);
        fetchUnreadNotificationsCount();
        fetchTodaysReminder(token);
    }, [navigate]);

    const fetchTodaysReminder = async (token) => {
        const authToken = token || localStorage.getItem("token");
        if (!authToken) return;
        try {
            const response = await axios.get("https://localhost:7102/api/CollectionAgent/todays-pickup", {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            console.log("Today's Pickups Reminder Data:", response.data);
            if (response.data) {
                setTodaysReminder(response.data);
                const isFreshLogin = sessionStorage.getItem("justLoggedInCollectionAgent");
                if (isFreshLogin) {
                    if (response.data.pickups && response.data.pickups.length > 0) {
                        setShowReminderModal(true);
                    }
                    sessionStorage.removeItem("justLoggedInCollectionAgent");
                }
            }
        } catch (err) {
            console.error("Error fetching today's pickups reminder:", err);
        }
    };

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
        fetchTodaysReminder(authToken);
        try {
            setLoading(true);
            setError("");
            const response = await axios.get("https://localhost:7102/api/CollectionAssignment/my-assignments", {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            console.log("Collection Agent Assignments:", response.data);
            const raw = response.data || [];
            const sorted = [...raw].sort((a, b) => {
                const idA = a.collectionAssignmentId || a.CollectionAssignmentId || 0;
                const idB = b.collectionAssignmentId || b.CollectionAssignmentId || 0;
                const dateA = new Date(a.assignedAt || a.AssignedAt || a.createdAt || a.CreatedAt || 0).getTime();
                const dateB = new Date(b.assignedAt || b.AssignedAt || b.createdAt || b.CreatedAt || 0).getTime();
                if (dateA !== dateB) return dateB - dateA;
                return idB - idA;
            });
            setPickups(sorted);
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
            const msg = err.response?.data?.message || err.response?.data?.error || "Failed to accept collection request.";
            alert(msg);
            fetchAssignedPickups();
        } finally {
            setProcessingId(null);
        }
    };

    const handleStartPickup = async (assignmentId) => {
        try {
            setProcessingId(assignmentId);
            const token = localStorage.getItem("token");
            await axios.post(
                `https://localhost:7102/api/Pickup/start/${assignmentId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPickups(prev =>
                prev.map(p => (p.collectionAssignmentId === assignmentId ? { ...p, status: "PickupStarted" } : p))
            );
            if (selectedPickup?.collectionAssignmentId === assignmentId) {
                setSelectedPickup(prev => prev ? { ...prev, status: "PickupStarted" } : null);
            }
        } catch (err) {
            console.error("Error starting pickup:", err);
            const msg = err.response?.data?.message || err.response?.data?.error || "Failed to start pickup.";
            alert(msg);
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
    }).sort((a, b) => {
        const idA = a.collectionAssignmentId || a.CollectionAssignmentId || 0;
        const idB = b.collectionAssignmentId || b.CollectionAssignmentId || 0;
        const dateA = new Date(a.assignedAt || a.AssignedAt || a.createdAt || a.CreatedAt || 0).getTime();
        const dateB = new Date(b.assignedAt || b.AssignedAt || b.createdAt || b.CreatedAt || 0).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return idB - idA;
    });

    const formatName = (str) => {
        if (!str) return "Citizen";
        return str
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
    };

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
            case "expired":
                return <span className="agent-status-badge rejected" style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" }}><FiClock /> Expired</span>;
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

                    <div 
                        className="agent-kpi-card rose-accent" 
                        style={{ cursor: "pointer" }}
                        onClick={() => setShowReminderModal(true)}
                        title="Click to view Today's Pickups Reminder"
                    >
                        <div className="agent-kpi-top">
                            <div className="agent-kpi-icon rose">
                                <FiBell className="reminder-bell-ring" />
                            </div>
                            <span className="agent-kpi-badge rose-pill">Today's Schedule</span>
                        </div>
                        <div>
                            <h3 className="agent-kpi-val">{todaysReminder?.totalPickups || 0} Pickups</h3>
                            <div className="agent-kpi-lbl">Click to view today's reminder</div>
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
                                    const canStart = statusLower === "accepted";
                                    const canDecline = statusLower === "assigned" || statusLower === "pending";
                                    const formattedName = formatName(task.customerName);

                                    return (
                                        <div key={task.collectionAssignmentId} className={`pickup-card-item card-status-${statusLower}`}>
                                            <div>
                                                <div className="card-item-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                                    <div>
                                                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#64748b", fontSize: "0.8rem" }}>
                                                            #{task.collectionAssignmentId}
                                                        </span>
                                                        <h3 className="card-device-title" style={{ margin: "0.2rem 0 0", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                                                            {task.brand} {task.model}
                                                        </h3>
                                                    </div>
                                                    {getStatusBadge(task.status)}
                                                </div>

                                                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "0.75rem" }}>
                                                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}>
                                                        {formattedName}
                                                    </div>
                                                    {task.customerPhone && (
                                                        <a href={`tel:${task.customerPhone}`} style={{ fontSize: "0.78rem", color: "#2563eb", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.25rem", marginTop: "0.15rem" }}>
                                                            <FiPhoneCall /> {task.customerPhone}
                                                        </a>
                                                    )}
                                                    <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "0.3rem" }}>
                                                        <FiMapPin style={{ color: "#059669", marginRight: "0.25rem" }} />
                                                        {task.address} {task.city ? `, ${task.city}` : ""}
                                                    </div>
                                                </div>

                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "#475569", marginBottom: "0.75rem" }}>
                                                    <span>Category: <strong>{task.categoryName || "E-Waste"}</strong></span>
                                                    <span>Qty: <strong>{task.quantity || 1}</strong></span>
                                                </div>

                                                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                                    <FiClock style={{ color: "#059669" }} />
                                                    <span>{task.pickupDate ? new Date(task.pickupDate).toLocaleDateString() : "Scheduled"} • {task.timeSlot || "Standard Slot"}</span>
                                                </div>
                                            </div>

                                            <div className="card-actions-row" style={{ display: "flex", gap: "0.4rem", marginTop: "auto" }}>
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
                                                {canStart && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartPickup(task.collectionAssignmentId)}
                                                        disabled={processingId === task.collectionAssignmentId}
                                                        className="btn btn-success"
                                                        style={{ flex: 1, justifyContent: "center", background: "#0284c7", borderColor: "#0284c7" }}
                                                    >
                                                        <FiTruck /> Start Pickup
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    onClick={() => setSelectedPickup(task)}
                                                    style={{ flex: 1, justifyContent: "center" }}
                                                >
                                                    <FiInfo /> Details
                                                </button>
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
                                            <th style={{ width: "8%" }}>Task ID</th>
                                            <th style={{ width: "22%" }}>Device Details</th>
                                            <th style={{ width: "24%" }}>Citizen & Address</th>
                                            <th style={{ width: "16%" }}>Scheduled Slot</th>
                                            <th style={{ width: "12%" }}>Status</th>
                                            <th style={{ width: "18%", textAlign: "center" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPickups.map((task) => {
                                            const statusLower = (task.status || "").toLowerCase();
                                            const canAccept = statusLower === "assigned" || statusLower === "pending";
                                            const canStart = statusLower === "accepted";
                                            const canDecline = statusLower === "assigned" || statusLower === "pending";
                                            const formattedName = formatName(task.customerName);

                                            return (
                                                <tr key={task.collectionAssignmentId} className={`table-row-status-${statusLower}`}>
                                                    <td>
                                                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#64748b", fontSize: "0.825rem" }}>
                                                            #{task.collectionAssignmentId}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="cell-title-lg" style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>
                                                            {task.brand} {task.model}
                                                        </div>
                                                        <div style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "0.15rem" }}>
                                                            {task.categoryName || "E-Waste"} • {task.quantity || 1} Unit(s) {task.condition ? `• ${task.condition}` : ""}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}>
                                                            {formattedName}
                                                        </div>
                                                        {task.customerPhone && (
                                                            <a href={`tel:${task.customerPhone}`} style={{ fontSize: "0.775rem", color: "#2563eb", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                                                                <FiPhoneCall style={{ fontSize: "0.7rem" }} /> {task.customerPhone}
                                                            </a>
                                                        )}
                                                        <div style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "0.15rem", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={task.address}>
                                                            {task.address}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>
                                                            {task.pickupDate ? new Date(task.pickupDate).toLocaleDateString() : "Scheduled"}
                                                        </div>
                                                        <div style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "0.15rem" }}>
                                                            {task.timeSlot || "Standard Slot"}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {getStatusBadge(task.status)}
                                                    </td>
                                                    <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                                                        <div style={{ display: "inline-flex", gap: "0.35rem", justifyContent: "center", alignItems: "center" }}>
                                                            {canAccept && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAccept(task.collectionAssignmentId)}
                                                                    disabled={processingId === task.collectionAssignmentId}
                                                                    className="btn btn-success"
                                                                    style={{ padding: "0.4rem 0.65rem", fontSize: "0.78rem", whiteSpace: "nowrap" }}
                                                                >
                                                                    <FiCheck /> Accept
                                                                </button>
                                                            )}
                                                            {canStart && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStartPickup(task.collectionAssignmentId)}
                                                                    disabled={processingId === task.collectionAssignmentId}
                                                                    className="btn btn-success"
                                                                    style={{ padding: "0.4rem 0.65rem", fontSize: "0.78rem", whiteSpace: "nowrap", background: "#0284c7", borderColor: "#0284c7" }}
                                                                >
                                                                    <FiTruck /> Start Pickup
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                className="btn btn-secondary"
                                                                onClick={() => setSelectedPickup(task)}
                                                                title="View Details"
                                                                style={{ padding: "0.4rem 0.65rem", fontSize: "0.78rem", whiteSpace: "nowrap" }}
                                                            >
                                                                <FiInfo /> Details
                                                            </button>
                                                            {canDecline && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setRejectionTarget(task)}
                                                                    disabled={processingId === task.collectionAssignmentId}
                                                                    className="btn btn-danger"
                                                                    style={{ padding: "0.4rem 0.65rem", fontSize: "0.78rem", whiteSpace: "nowrap" }}
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
                                <h2>Pickup Assignment Details</h2>
                                <p className="modal-sub">{selectedPickup.brand} {selectedPickup.model}</p>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedPickup(null)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="modal-content">
                            <div className="modal-top-meta" style={{ marginBottom: "1rem" }}>
                                <div>
                                    <span className="modal-meta-lbl">Scheduled Slot</span>
                                    <div className="modal-meta-val">
                                        {selectedPickup.pickupDate ? new Date(selectedPickup.pickupDate).toLocaleDateString() : "Scheduled"} ({selectedPickup.timeSlot || "Slot N/A"})
                                    </div>
                                </div>
                                {getStatusBadge(selectedPickup.status)}
                            </div>

                            {/* COLLECT FROM -> DELIVER TO ROUTING FLOW */}
                            <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
                                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.85rem", borderRadius: "10px" }}>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#047857", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        COLLECT FROM
                                    </div>
                                    <div style={{ fontWeight: 700, color: "#065f46", fontSize: "0.9rem", marginTop: "0.2rem" }}>
                                        Customer: {formatName(selectedPickup.customerName)} (Ph: {selectedPickup.customerPhone || "N/A"})
                                    </div>
                                    <div style={{ color: "#047857", fontSize: "0.825rem", marginTop: "0.2rem" }}>
                                        <strong>Customer pickup address:</strong> {selectedPickup.address}
                                        {selectedPickup.landmark && ` (Landmark: ${selectedPickup.landmark})`}
                                        {[selectedPickup.city, selectedPickup.district, selectedPickup.state, selectedPickup.pincode].filter(Boolean).length > 0 &&
                                            `, ${[selectedPickup.city, selectedPickup.district, selectedPickup.state, selectedPickup.pincode].filter(Boolean).join(", ")}`}
                                    </div>
                                    <div style={{ color: "#059669", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                                        <strong>Pickup date / time slot:</strong> {selectedPickup.pickupDate ? new Date(selectedPickup.pickupDate).toLocaleDateString() : "Scheduled"} • {selectedPickup.timeSlot || "Standard Slot"}
                                    </div>
                                </div>

                                <div style={{ textAlign: "center", fontSize: "1.35rem", fontWeight: 800, color: "#059669", margin: "0.35rem 0" }}>
                                    ↓
                                </div>

                                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.85rem", borderRadius: "10px" }}>
                                    <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        DELIVER TO
                                    </div>
                                    <div style={{ fontWeight: 700, color: "#1e40af", fontSize: "0.9rem", marginTop: "0.2rem" }}>
                                        Technician / Inspection Center: {selectedPickup.technicianName || "Inspection Technician"} ({selectedPickup.inspectionCenterName || selectedPickup.technicianCenterName || "EcoCycle Central Inspection Hub"}) {selectedPickup.technicianPhone ? `(Ph: ${selectedPickup.technicianPhone})` : ""}
                                    </div>
                                    <div style={{ color: "#1e3a8a", fontSize: "0.825rem", marginTop: "0.2rem" }}>
                                        <strong>Technician/center address:</strong> {selectedPickup.deliveredAddress || selectedPickup.technicianAddress || "EcoCycle Central E-Waste Facility & Inspection Hub"}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-grid-box">
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
                                <p className="modal-sub">Assignment {rejectionTarget.collectionAssignmentId}</p>
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

            {/* Today's Pickups Reminder Modal */}
            {showReminderModal && (
                <div className="modal-overlay" onClick={() => setShowReminderModal(false)}>
                    <div className="clean-modal reminder-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header reminder-header">
                            <div className="reminder-header-title">
                                <div className="reminder-icon-badge">
                                    <FiBell className="reminder-bell-ring" />
                                </div>
                                <div>
                                    <h2>Today's Pickup Reminder</h2>
                                    <p className="modal-sub">
                                        Date: <strong>{todaysReminder?.date || "Today"}</strong> &bull; Total Scheduled: <strong>{todaysReminder?.totalPickups || 0} Pickups</strong>
                                    </p>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setShowReminderModal(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="reminder-modal-body">
                            {todaysReminder && todaysReminder.totalPickups > 0 ? (
                                <>
                                    <div className="reminder-alert-banner">
                                        <FiAlertCircle className="reminder-alert-icon" />
                                        <span>
                                            You have <strong>{todaysReminder.totalPickups}</strong> pickup assignment(s) scheduled for today. Please review the details below before heading out!
                                        </span>
                                    </div>

                                    <div className="reminder-pickups-list">
                                        {todaysReminder.pickups.map((pickup, idx) => (
                                            <div key={pickup.assignmentId || idx} className="reminder-pickup-card">
                                                <div className="reminder-card-top">
                                                    <span className="reminder-badge-num">Pickup {idx + 1}</span>
                                                    <h3 className="reminder-device-name">
                                                        {pickup.brand} {pickup.model}
                                                    </h3>
                                                    <span className={`status-pill status-${pickup.status?.toLowerCase()}`}>
                                                        {pickup.status}
                                                    </span>
                                                </div>

                                                <div className="reminder-card-grid">
                                                    <div className="reminder-detail-item">
                                                        <FiUser className="item-icn" />
                                                        <div>
                                                            <div className="item-lbl">Customer</div>
                                                            <div className="item-val">{pickup.customerName || "N/A"}</div>
                                                        </div>
                                                    </div>

                                                    <div className="reminder-detail-item">
                                                        <FiPhoneCall className="item-icn" />
                                                        <div>
                                                            <div className="item-lbl">Phone Number</div>
                                                            <div className="item-val">
                                                                {pickup.customerPhone ? (
                                                                    <a href={`tel:${pickup.customerPhone}`} className="reminder-phone-link">
                                                                        {pickup.customerPhone}
                                                                    </a>
                                                                ) : (
                                                                    "N/A"
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="reminder-detail-item">
                                                        <FiClock className="item-icn" />
                                                        <div>
                                                            <div className="item-lbl">Time Slot</div>
                                                            <div className="item-val">{pickup.timeSlot || "Flexible"}</div>
                                                        </div>
                                                    </div>

                                                    <div className="reminder-detail-item">
                                                        <FiTag className="item-icn" />
                                                        <div>
                                                            <div className="item-lbl">Category & Weight</div>
                                                            <div className="item-val">
                                                                {pickup.categoryName} ({pickup.quantity} Qty, {pickup.weight} kg)
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="reminder-detail-item full-width" style={{ marginTop: "0.75rem" }}>
                                                    <FiMapPin className="item-icn" />
                                                    <div>
                                                        <div className="item-val address-text">
                                                            <span className="address-street">{pickup.address}</span>
                                                            {pickup.landmark && (
                                                                <div className="address-landmark-text">
                                                                    <strong>Landmark:</strong> {pickup.landmark}
                                                                </div>
                                                            )}
                                                            {(pickup.city || pickup.district || pickup.state || pickup.pincode) && (
                                                                <div className="address-sub-details">
                                                                    {[pickup.city, pickup.district, pickup.state, pickup.pincode ? `PIN: ${pickup.pincode}` : null].filter(Boolean).join(", ")}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="reminder-empty-state">
                                    <FiCheckCircle className="empty-icn" />
                                    <h3>No Pickups Scheduled for Today</h3>
                                    <p>You currently have no pending or active pickup assignments scheduled for today.</p>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowReminderModal(false)}
                            >
                                Dismiss
                            </button>
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => setShowReminderModal(false)}
                            >
                                Acknowledge & Open Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CollectionAgentDashboard;