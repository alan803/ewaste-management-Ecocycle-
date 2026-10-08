import React, { useEffect, useState, useRef } from "react";
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
    FiLayers,
    FiRotateCcw,
    FiTool,
    FiCpu,
    FiGrid,
    FiList,
    FiMapPin,
    FiPhone,
    FiSmartphone,
    FiTv,
    FiBatteryCharging,
    FiPrinter,
    FiAward
} from "react-icons/fi";
import { FaLeaf, FaQrcode } from "react-icons/fa";
import "./Refurbishmentcenter_dashboard.css";

function RefurbishmentCenterDashboard() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'
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
                const profileRes = await axios.get("https://localhost:7102/api/RefurbishmentCenter/myprofile", {
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
                const myReqRes = await axios.get("https://localhost:7102/api/AllocateRefurbishmentCenter/my-requests", {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                fetchedList = myReqRes.data || [];
            } catch {
                try {
                    const adminReqRes = await axios.get("https://localhost:7102/api/AllocateRefurbishmentCenter/admin/requests", {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    fetchedList = adminReqRes.data || [];
                } catch {
                    fetchedList = [];
                }
            }

            if (profileData && (profileData.refurbishmentCenterId || profileData.id) && fetchedList.length > 0) {
                const cId = profileData.refurbishmentCenterId || profileData.id;
                const filtered = fetchedList.filter(r => r.refurbishmentCenterId === cId);
                if (filtered.length > 0) {
                    fetchedList = filtered;
                }
            }

            if (fetchedList && fetchedList.length > 0) {
                const mapped = fetchedList.map((item, idx) => ({
                    id: item.refurbishmentRequestId || item.id || (idx + 401),
                    deviceId: item.deviceId || 100 + idx,
                    batchTitle: `${item.brand || "E-Waste"} ${item.model || "Device"}`,
                    brand: item.brand || "E-Waste",
                    model: item.model || "Device",
                    categoryName: item.categoryName || item.category || "Electronics",
                    weight: item.weight && Number(item.weight) > 0 ? `${item.weight} kg` : `${(item.quantity || 1) * 3} kg`,
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
                    processStartDate: item.refurbishmentStartedAt || item.processStartDate,
                    processDeadline: item.processDeadline,
                    status: item.status || "Assigned",
                    processingDecision: item.processingDecision || "Refurbishment Center",
                    lifecycleStatus: item.lifecycleStatus,
                    processingLifecycleStatus: item.processingLifecycleStatus,
                    rejectionReason: item.rejectionReason || null
                }));
                setRequests(mapped);
            } else {
                setRequests([]);
            }
        } catch (err) {
            console.error("Error loading refurbishment dashboard data:", err);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const facilityName = profile?.CenterName || profile?.centerName 
        ? (profile.CenterName || profile.centerName)
        : profile?.OwnerName || profile?.ownerName || localStorage.getItem("firstName") || "Refurbishment Facility";

    const handleAcceptRequest = async (requestId) => {
        try {
            setProcessingId(requestId);
            const token = localStorage.getItem("token");
            await axios.put(`https://localhost:7102/api/AllocateRefurbishmentCenter/accept/${requestId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const now = new Date();
            const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            updateRequestStatus(requestId, "Accepted", null, now.toISOString(), sevenDaysLater.toISOString());
            showNotice("success", "Device allocation request accepted! Refurbishment workflow initiated.");
        } catch (err) {
            console.error("Error accepting request:", err);
            const now = new Date();
            const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            updateRequestStatus(requestId, "Accepted", null, now.toISOString(), sevenDaysLater.toISOString());
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
            const reasonText = rejectionReason.trim() || "Unable to refurbish device at this facility.";

            await axios.put(
                `https://localhost:7102/api/AllocateRefurbishmentCenter/reject/${rejectionTarget.id}?reason=${encodeURIComponent(reasonText)}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            updateRequestStatus(rejectionTarget.id, "Rejected", reasonText);
            setRejectionTarget(null);
            setRejectionReason("");
            showNotice("info", "Request rejected and queued for reassignment.");
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

    const updateRequestStatus = (reqId, newStatus, reason = null, startDate = null, deadline = null) => {
        setRequests(prev =>
            prev.map(r => (r.id === reqId ? {
                ...r,
                status: newStatus,
                rejectionReason: reason || r.rejectionReason,
                processStartDate: startDate || r.processStartDate,
                processDeadline: deadline || r.processDeadline
            } : r))
        );
        if (selectedRequest && selectedRequest.id === reqId) {
            setSelectedRequest(prev => ({
                ...prev,
                status: newStatus,
                rejectionReason: reason || prev.rejectionReason,
                processStartDate: startDate || prev.processStartDate,
                processDeadline: deadline || prev.processDeadline
            }));
        }
    };

    const showNotice = (type, text) => {
        setActionMsg({ type, text });
        setTimeout(() => setActionMsg({ type: "", text: "" }), 3500);
    };



    const getDeadlineBadge = (req) => {
        const status = (req.status || "").toLowerCase();
        if (status === "accepted" || status === "processing" || status === "repairing" || status === "in diagnosis") {
            if (!req.processDeadline) return null;
            try {
                const d = new Date(req.processDeadline);
                const now = new Date();
                const diffMs = d.getTime() - now.getTime();
                if (diffMs <= 0) {
                    return <span className="refurb-stage-badge diagnosis">Limit Passed</span>;
                }
                const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                return <span className="refurb-stage-badge repairing">{days > 0 ? `${days}d ${hours}h left` : `${hours}h left`}</span>;
            } catch {
                return null;
            }
        }
        if (!req.responseDeadline) return null;
        if (status !== "assigned" && status !== "waiting") return null;
        try {
            const d = new Date(req.responseDeadline);
            const now = new Date();
            const diffMs = d.getTime() - now.getTime();
            if (diffMs <= 0) {
                return <span className="refurb-stage-badge diagnosis">Deadline Passed</span>;
            }
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            return <span className="refurb-stage-badge testing">{hours}h {mins}m left</span>;
        } catch {
            return null;
        }
    };

    const getCategoryIcon = (category) => {
        const c = (category || "").toLowerCase();
        if (c.includes("computer") || c.includes("laptop") || c.includes("pc")) return <FiCpu />;
        if (c.includes("mobile") || c.includes("phone") || c.includes("tablet")) return <FiSmartphone />;
        if (c.includes("battery") || c.includes("charger")) return <FiBatteryCharging />;
        if (c.includes("display") || c.includes("tv") || c.includes("monitor")) return <FiTv />;
        return <FiBox />;
    };

    const getStatusBadge = (status) => {
        const s = (status || "").toLowerCase();
        if (s === "accepted" || s === "repairing" || s === "processing") {
            return <span className="refurb-stage-badge repairing"><FiTool /> In Refurbishment</span>;
        }
        if (s === "certified ready" || s === "completed" || s === "refurbished") {
            return <span className="refurb-stage-badge certified"><FiCheckSquare /> Certified Ready</span>;
        }
        if (s === "rejected" || s === "expired") {
            return <span className="refurb-stage-badge diagnosis"><FiAlertTriangle /> {s === "rejected" ? "Rejected" : "Expired"}</span>;
        }
        return <span className="refurb-stage-badge testing"><FiClock /> Assigned</span>;
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
        else if (activeTab === "Processing") matchesTab = s === "accepted" || s === "repairing" || s === "processing";
        else if (activeTab === "Completed") matchesTab = s === "certified ready" || s === "completed" || s === "refurbished";
        else if (activeTab === "Rejected") matchesTab = s === "rejected" || s === "expired";

        return matchesSearch && matchesTab;
    });

    const totalUnits = requests.length;
    const assignedCount = requests.filter(r => (r.status || "").toLowerCase() === "assigned" || (r.status || "").toLowerCase() === "waiting").length;
    const processingCount = requests.filter(r => (r.status || "").toLowerCase() === "accepted" || (r.status || "").toLowerCase() === "repairing" || (r.status || "").toLowerCase() === "processing").length;
    const completedCount = requests.filter(r => (r.status || "").toLowerCase() === "certified ready" || (r.status || "").toLowerCase() === "completed" || (r.status || "").toLowerCase() === "refurbished").length;
    const rejectedCount = requests.filter(r => (r.status || "").toLowerCase() === "rejected" || (r.status || "").toLowerCase() === "expired").length;

    return (
        <div className="refurb-dashboard-layout">
            <Sidebar />

            <main className="refurb-main-content">
                {/* Header Ribbon */}
                <div className="refurb-header-ribbon">
                    <div>
                        <h1 className="refurb-welcome-title">Welcome, {facilityName}!</h1>
                        <p className="refurb-welcome-sub">Refurbishment Center Operations &bull; Inbound Device Queue</p>
                    </div>

                    <div className="refurb-header-actions">
                        <div className="search-bar" style={{ display: "flex", alignItems: "center", background: "#f1f5f9", padding: "0.4rem 0.8rem", borderRadius: "10px", gap: "0.5rem" }}>
                            <FiSearch style={{ color: "#64748b" }} />
                            <input
                                type="text"
                                placeholder="Search device, ID, customer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ border: "none", background: "transparent", outline: "none", fontSize: "0.85rem", width: "200px" }}
                            />
                        </div>

                        <button
                            onClick={() => navigate("/refurbishmentcenter_notification")}
                            title="Notifications"
                            style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
                        >
                            <FiBell style={{ color: "#475569" }} />
                            {unreadNotifCount > 0 && (
                                <span style={{ position: "absolute", top: "-4px", right: "-4px", background: "#ef4444", color: "#fff", fontSize: "0.65rem", padding: "2px 5px", borderRadius: "9999px", fontWeight: 700 }}>
                                    {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                                </span>
                            )}
                        </button>

                        <Link to="/manage-userprofile" className="refurb-profile-pill">
                            <div className="refurb-avatar">
                                {facilityName.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{facilityName}</span>
                                <span style={{ fontSize: "0.725rem", color: "#7c3aed", fontWeight: 600 }}>Refurbishment Facility</span>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Toast Notification Banner */}
                {actionMsg.text && (
                    <div style={{ background: actionMsg.type === "success" ? "#ecfdf5" : "#eff6ff", border: `1px solid ${actionMsg.type === "success" ? "#a7f3d0" : "#bfdbfe"}`, color: actionMsg.type === "success" ? "#065f46" : "#1e40af", padding: "0.75rem 1rem", borderRadius: "12px", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
                        <FiCheckCircle />
                        <span>{actionMsg.text}</span>
                    </div>
                )}

                {/* KPI Metrics Grid */}
                <div className="refurb-kpi-grid">
                    <div className="refurb-kpi-card">
                        <div className="refurb-kpi-top">
                            <div className="refurb-kpi-icon purple">
                                <FiCpu />
                            </div>
                            <span className="refurb-kpi-badge">Total Queue</span>
                        </div>
                        <div>
                            <h3 className="refurb-kpi-val">{totalUnits} Units</h3>
                            <div className="refurb-kpi-lbl">Total Refurbishment Items</div>
                        </div>
                    </div>

                    <div className="refurb-kpi-card">
                        <div className="refurb-kpi-top">
                            <div className="refurb-kpi-icon amber">
                                <FiClock />
                            </div>
                            <span className="refurb-kpi-badge">Pending</span>
                        </div>
                        <div>
                            <h3 className="refurb-kpi-val">{assignedCount} Batches</h3>
                            <div className="refurb-kpi-lbl">Awaiting Acceptance</div>
                        </div>
                    </div>

                    <div className="refurb-kpi-card">
                        <div className="refurb-kpi-top">
                            <div className="refurb-kpi-icon blue">
                                <FiTool />
                            </div>
                            <span className="refurb-kpi-badge">Processing</span>
                        </div>
                        <div>
                            <h3 className="refurb-kpi-val">{processingCount} Units</h3>
                            <div className="refurb-kpi-lbl">Under Refurbishment</div>
                        </div>
                    </div>

                    <div className="refurb-kpi-card">
                        <div className="refurb-kpi-top">
                            <div className="refurb-kpi-icon emerald">
                                <FiCheckSquare />
                            </div>
                            <span className="refurb-kpi-badge">Certified</span>
                        </div>
                        <div>
                            <h3 className="refurb-kpi-val">{completedCount} Ready</h3>
                            <div className="refurb-kpi-lbl">Certified &amp; Renewed</div>
                        </div>
                    </div>
                </div>

                {/* Inbound Refurbishment Queue Panel */}
                <div className="refurb-panel-card">
                    <div className="refurb-panel-header">
                        <div>
                            <h2 className="refurb-panel-title">Inbound Refurbishment Queue</h2>
                            <p className="refurb-panel-subtitle">
                                Review assigned devices, accept or reject incoming allocation requests, and manage refurbishment workflow
                            </p>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap", marginLeft: "auto" }}>
                            <div className="refurb-tab-pills">
                                {["All", "Assigned", "Processing", "Completed", "Rejected"].map((tab) => (
                                    <button
                                        key={tab}
                                        className={`refurb-tab-btn ${activeTab === tab ? "active" : ""}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="view-toggle-btns">
                                <button
                                    className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                                    onClick={() => setViewMode("grid")}
                                    title="Grid View"
                                >
                                    <FiGrid />
                                </button>
                                <button
                                    className={`view-btn ${viewMode === "table" ? "active" : ""}`}
                                    onClick={() => setViewMode("table")}
                                    title="Table View"
                                >
                                    <FiList />
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
                            <FiRefreshCw className="spin-icon" style={{ fontSize: "1.8rem", color: "#7c3aed", marginBottom: "0.5rem" }} />
                            <p>Loading refurbishment queue...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
                            <FiBox style={{ fontSize: "2.5rem", color: "#cbd5e1", marginBottom: "0.5rem" }} />
                            <h4 style={{ margin: "0 0 0.25rem 0", color: "#334155" }}>No devices found</h4>
                            <p style={{ margin: 0, fontSize: "0.85rem" }}>
                                {searchQuery ? `No matches for "${searchQuery}"` : `No items under "${activeTab}" category.`}
                            </p>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="refurb-cards-grid">
                            {filteredRequests.map((req) => {
                                const s = (req.status || "").toLowerCase();
                                const isAssigned = s === "assigned" || s === "waiting";
                                const isRejected = s === "rejected" || s === "cancelled";
                                return (
                                    <div className="refurb-item-card" key={req.id}>
                                        <div>
                                            <div className="refurb-card-top-row">
                                                <div className="refurb-cat-icon-box">
                                                    {getCategoryIcon(req.categoryName)}
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                                    {getStatusBadge(req.status)}
                                                    {getDeadlineBadge(req)}
                                                </div>
                                            </div>

                                            <h4 className="refurb-card-brand-name">{req.batchTitle}</h4>
                                            <p className="refurb-card-cat-sub">
                                                #{req.id} &bull; Dev #{req.deviceId} &bull; {req.categoryName} &bull; {req.quantity} units ({req.weight})
                                            </p>

                                            {/* Customer Chip */}
                                            <div className="refurb-agent-chip-box">
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                                    <div className="refurb-agent-avatar">
                                                        {(req.customerName || "C").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="refurb-agent-name">{req.customerName || "Customer"}</span>
                                                        <span className="refurb-agent-sub">{req.customerPhone || "Ph: N/A"} &bull; {req.customerCity || "Hub"}</span>
                                                    </div>
                                                </div>
                                                {req.customerPhone && (
                                                    <a href={`tel:${req.customerPhone}`} className="btn-refurb-call" title="Call Customer">
                                                        <FiPhone />
                                                    </a>
                                                )}
                                            </div>

                                            {/* Device & Location Details */}
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
                                                <div className="refurb-detail-row">
                                                    <FiTool className="detail-icon" style={{ color: "#7c3aed" }} />
                                                    <div>
                                                        <div className="detail-label">Condition &amp; Health</div>
                                                        <div className="detail-val">{req.condition || "Inspected"} &bull; Working: {req.working || "Yes"}</div>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Damage: {req.physicalDamage || "None"} &bull; Disp: {req.displayCondition || "Standard"}</div>
                                                    </div>
                                                </div>

                                                <div className="refurb-detail-row">
                                                    <FiMapPin className="detail-icon" style={{ color: "#059669" }} />
                                                    <div>
                                                        <div className="detail-label">Allocation &amp; Location</div>
                                                        <div className="detail-val">{req.customerCity || "City Hub"}</div>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Decision: {req.processingDecision || "Refurbishment Center"}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="refurb-card-actions">
                                            {isAssigned ? (
                                                <>
                                                    <button
                                                        className="refurb-btn-accept"
                                                        onClick={() => handleAcceptRequest(req.id)}
                                                        disabled={processingId === req.id}
                                                    >
                                                        <FiCheck /> {processingId === req.id ? "Accepting..." : "Accept"}
                                                    </button>
                                                    <button
                                                        className="refurb-btn-reject"
                                                        onClick={() => {
                                                            setRejectionTarget(req);
                                                            setRejectionReason("");
                                                        }}
                                                        disabled={processingId === req.id}
                                                    >
                                                        <FiX /> Reject
                                                    </button>
                                                    <button
                                                        className="refurb-btn-view"
                                                        onClick={() => setSelectedRequest(req)}
                                                        title="View Details"
                                                    >
                                                        <FiEye /> View
                                                    </button>
                                                </>
                                            ) : isRejected ? (
                                                <button
                                                    className="refurb-btn-view"
                                                    style={{ width: "100%", justifyContent: "center" }}
                                                    onClick={() => setSelectedRequest(req)}
                                                    title="View Details"
                                                >
                                                    <FiEye /> View Details
                                                </button>
                                            ) : (
                                                <>
                                                    {!(s === "completed" || s === "certified ready" || s === "refurbished") && (
                                                        <button
                                                            className="refurb-btn-accept"
                                                            style={{ flex: 1.5, background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", color: "#fff", borderColor: "#7c3aed" }}
                                                            onClick={() => navigate(`/refurbishment_perform/${req.id}`)}
                                                        >
                                                            <FiTool /> Refurbish Device
                                                        </button>
                                                    )}
                                                    <button
                                                        className="refurb-btn-view"
                                                        style={{ flex: 1, justifyContent: "center" }}
                                                        onClick={() => setSelectedRequest(req)}
                                                        title="View Details"
                                                    >
                                                        <FiEye /> Details
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="refurb-table-wrapper">
                            <table className="refurb-table">
                                <thead>
                                    <tr>
                                        <th>Request ID</th>
                                        <th>Device &amp; Category</th>
                                        <th>Customer &amp; Location</th>
                                        <th>Status &amp; Deadline</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.map((req) => {
                                        const s = (req.status || "").toLowerCase();
                                        const isAssigned = s === "assigned" || s === "waiting";
                                        const isRejected = s === "rejected" || s === "cancelled";

                                        return (
                                            <tr key={req.id}>
                                                <td>
                                                    <span style={{ fontWeight: 800, color: "#7c3aed", display: "block" }}>{req.id}</span>
                                                    <span style={{ fontSize: "0.725rem", color: "#64748b" }}>Dev {req.deviceId}</span>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{req.batchTitle}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                                        {req.categoryName} &bull; Qty: {req.quantity} ({req.condition})
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: "#334155" }}>{req.customerName}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{req.customerCity}</div>
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-start" }}>
                                                        {getStatusBadge(req.status)}
                                                        {getDeadlineBadge(req)}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
                                                        {isAssigned && (
                                                            <>
                                                                <button
                                                                    className="refurb-action-btn success"
                                                                    onClick={() => handleAcceptRequest(req.id)}
                                                                    disabled={processingId === req.id}
                                                                >
                                                                    <FiCheck /> {processingId === req.id ? "Accepting..." : "Accept"}
                                                                </button>
                                                                <button
                                                                    className="refurb-action-btn"
                                                                    style={{ background: "#fff1f2", color: "#e11d48", borderColor: "#fecdd3" }}
                                                                    onClick={() => {
                                                                        setRejectionTarget(req);
                                                                        setRejectionReason("");
                                                                    }}
                                                                    disabled={processingId === req.id}
                                                                >
                                                                    <FiX /> Reject
                                                                </button>
                                                            </>
                                                        )}

                                                        {!isAssigned && !isRejected && !(s === "completed" || s === "certified ready" || s === "refurbished") && (
                                                            <button
                                                                className="refurb-action-btn"
                                                                style={{ background: "#7c3aed", color: "#fff", borderColor: "#7c3aed" }}
                                                                onClick={() => navigate(`/refurbishment_perform/${req.id}`)}
                                                                title="Refurbish Process"
                                                            >
                                                                <FiTool /> Refurbish
                                                            </button>
                                                        )}

                                                        <button
                                                            className="refurb-action-btn"
                                                            onClick={() => setSelectedRequest(req)}
                                                            title="View Details"
                                                        >
                                                            <FiEye /> View Details
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
                </div>
            </main>

            {/* View Details Modal */}
            {selectedRequest && (
                <div className="refurb-modal-overlay" onClick={() => setSelectedRequest(null)}>
                    <div className="refurb-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="refurb-modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>{selectedRequest.batchTitle}</h3>
                                <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.8rem", opacity: 0.9 }}>
                                    Request ID: #{selectedRequest.id} &bull; Device ID: #{selectedRequest.deviceId}
                                </p>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", fontSize: "1.2rem" }}>
                                <FiX />
                            </button>
                        </div>
                        <div className="refurb-modal-body">
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                                <div>
                                    <label style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Category</label>
                                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>{selectedRequest.categoryName}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Brand &amp; Model</label>
                                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>{selectedRequest.brand} {selectedRequest.model}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Quantity &amp; Weight</label>
                                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>Qty: {selectedRequest.quantity} ({selectedRequest.weight})</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Working Status</label>
                                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>{selectedRequest.working}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Physical Damage</label>
                                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>{selectedRequest.physicalDamage}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Display &amp; Battery</label>
                                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>Disp: {selectedRequest.displayCondition} | Batt: {selectedRequest.batteryCondition}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Customer Name</label>
                                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>{selectedRequest.customerName} ({selectedRequest.customerPhone})</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>City Location</label>
                                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>{selectedRequest.customerCity}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Processing Decision</label>
                                    <div style={{ fontWeight: 700, color: "#7c3aed", fontSize: "0.875rem" }}>{selectedRequest.processingDecision}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Request Status</label>
                                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>{selectedRequest.status}</div>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: "0.85rem 1.25rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                            <button className="refurb-action-btn" onClick={() => setSelectedRequest(null)}>
                                Close
                            </button>
                            {!["rejected", "cancelled", "completed", "certified ready", "refurbished"].includes((selectedRequest.status || "").toLowerCase()) && (
                                <button
                                    className="refurb-action-btn"
                                    style={{ background: "#7c3aed", color: "#fff", borderColor: "#7c3aed" }}
                                    onClick={() => {
                                        const rId = selectedRequest.id;
                                        setSelectedRequest(null);
                                        navigate(`/refurbishment_perform/${rId}`);
                                    }}
                                >
                                    <FiTool /> Open Refurbishment Process
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectionTarget && (
                <div className="refurb-modal-overlay" onClick={() => setRejectionTarget(null)}>
                    <div className="refurb-modal-card" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="refurb-modal-header" style={{ background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Reject Refurbishment Request</h3>
                                <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.8rem", opacity: 0.9 }}>
                                    Request #{rejectionTarget.id} &bull; {rejectionTarget.batchTitle}
                                </p>
                            </div>
                            <button onClick={() => setRejectionTarget(null)} style={{ background: "transparent", border: "none", color: "#ffffff", cursor: "pointer", fontSize: "1.2rem" }}>
                                <FiX />
                            </button>
                        </div>
                        <form onSubmit={handleRejectSubmit} style={{ padding: "1.25rem" }}>
                            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>Reason for Rejection</label>
                            <textarea
                                rows="3"
                                placeholder="State why your facility cannot refurbish this item..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                required
                                style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }}
                            />
                            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                                <button type="button" className="refurb-action-btn" onClick={() => setRejectionTarget(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="refurb-action-btn" style={{ background: "#e11d48", color: "#fff", borderColor: "#e11d48" }} disabled={processingId === rejectionTarget.id}>
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

export default RefurbishmentCenterDashboard;