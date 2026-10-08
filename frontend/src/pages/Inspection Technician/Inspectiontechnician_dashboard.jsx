import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiSearch,
    FiBell,
    FiLogOut,
    FiEye,
    FiCheck,
    FiX,
    FiFilter,
    FiCpu,
    FiClock,
    FiAlertCircle,
    FiAlertTriangle,
    FiCheckSquare,
    FiActivity,
    FiGrid,
    FiList,
    FiRefreshCw,
    FiSmartphone,
    FiFileText,
    FiTruck,
    FiUser,
    FiCheckCircle
} from "react-icons/fi";
import "./Inspectiontechnician_dashboard.css";

function Inspectiontechnician_dashboard() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [viewMode, setViewMode] = useState("table"); // "table" or "grid"
    
    // Modal State
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [activeModalTab, setActiveModalTab] = useState("overview");
    const [rejectionTarget, setRejectionTarget] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [processingId, setProcessingId] = useState(null);

    // Diagnostic form inside modal
    const [diagnosticNotes, setDiagnosticNotes] = useState("");
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [deliveries, setDeliveries] = useState([]);

    const navigate = useNavigate();

    // Helper to format image paths
    const getMediaUrl = (filename, folderName = "ProfilePhotos") => {
        if (!filename) return null;
        if (filename.startsWith("data:") || filename.startsWith("blob:") || filename.startsWith("http://") || filename.startsWith("https://")) {
            return filename;
        }
        const cleanName = filename.replace(/^uploads[\\/]/, "").replace(/^[\\/]/, "");
        if (cleanName.includes("/") || cleanName.includes("\\")) {
            return `https://ecocycle.runasp.net/uploads/${cleanName.replace("\\", "/")}`;
        }
        return `https://ecocycle.runasp.net/uploads/technicians/${folderName}/${cleanName}`;
    };

    const [techName, setTechName] = useState(() => {
        return localStorage.getItem("firstName") ||
               localStorage.getItem("userName") ||
               localStorage.getItem("username") ||
               localStorage.getItem("name") ||
               "Inspection Officer";
    });
    const [profilePhoto, setProfilePhoto] = useState(() => {
        return localStorage.getItem("profilePhoto") || localStorage.getItem("userPhoto") || null;
    });

    const userInitial = (techName || "I").charAt(0).toUpperCase();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found in localStorage, redirecting to login.");
            navigate("/");
            return;
        }
        fetchInspectionRequests();
        fetchUnreadNotificationsCount();

        // Fetch Technician Profile for accurate avatar & name
        axios.get("https://ecocycle.runasp.net/api/Technician/myprofile", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
            const data = res.data || {};
            const fName = data.firstName || data.FirstName || "";
            const lName = data.lastName || data.LastName || "";
            const fullName = `${fName} ${lName}`.trim() || data.name || data.Name;
            const photo = data.photo || data.Photo || data.profilePhoto || data.ProfilePhoto || data.photoPath;

            if (fullName) {
                setTechName(fullName);
                if (fName) localStorage.setItem("firstName", fName);
            }
            if (photo) {
                setProfilePhoto(photo);
                localStorage.setItem("profilePhoto", photo);
            }
        })
        .catch(() => {});
    }, []);

    const fetchUnreadNotificationsCount = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;
            const response = await axios.get(
                "https://ecocycle.runasp.net/api/Notificationcon/my_notifications",
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

    const fetchInspectionRequests = async () => {
        setLoading(true);
        fetchUnreadNotificationsCount();
        try {
            const token = localStorage.getItem("token");
            const techId = localStorage.getItem("technicianId") ||
                           localStorage.getItem("userId") ||
                           localStorage.getItem("loginId") || 1;
            
            const response = await axios.get(
                `https://ecocycle.runasp.net/api/Inspection/technicain/${techId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log("Technician Inspection Requests:", response.data);

response.data.forEach((req) => {
    console.log(
        "Request ID:",
        req.inspectionRequestId,
        "STATUS:",
        req.status,
        "STATUS LOWER:",
        req.status?.toLowerCase()
    );
});
            const rawList = response.data || [];
            const activeList = rawList.filter(r => {
                const s = String(r.status || "").toLowerCase();
                return s !== "reassigned" && s !== "penalized" && s !== "cancelled";
            });
            setRequests(activeList);
            setError("");

            // Also fetch live deliveries / inspection queue
            let liveDeliveries = [];
            try {
                const delRes = await axios.get("https://ecocycle.runasp.net/api/Inspection/my-deliveries", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                liveDeliveries = delRes.data || [];
                setDeliveries(liveDeliveries);
            } catch (delErr) {
                console.warn("Could not fetch my-deliveries:", delErr);
            }

            const checkIsInspectionCompleted = (item) => {
                if (!item) return true;
                const delStat = String(item.deliveryStatus || "").toLowerCase();
                const st = String(item.status || "").toLowerCase();
                const reqStat = String(item.requestStatus || "").toLowerCase();
                const lifeStat = String(item.lifecycleStatus || "").toLowerCase();

                const isCompletedOrInactive = (
                    lifeStat === "inspected" ||
                    lifeStat === "completed" ||
                    reqStat === "completed" ||
                    st === "completed" ||
                    st === "inspected" ||
                    delStat === "completed" ||
                    delStat === "inspected" ||
                    Boolean(item.isInspected) ||
                    Boolean(item.inspectionCompleted) ||
                    Boolean(item.qualityGrade) ||
                    st === "rejected" ||
                    st === "declined" ||
                    st === "cancelled" ||
                    st === "reassigned" ||
                    st === "penalized" ||
                    st === "expired" ||
                    reqStat === "reassigned" ||
                    reqStat === "penalized" ||
                    reqStat === "expired" ||
                    lifeStat === "reassigned" ||
                    lifeStat === "penalized" ||
                    lifeStat === "expired" ||
                    delStat === "rejected" ||
                    delStat === "declined" ||
                    delStat === "cancelled" ||
                    delStat === "reassigned" ||
                    delStat === "penalized" ||
                    delStat === "expired"
                );
                if (isCompletedOrInactive) return true;

                // Deadline Expired Check (If deadline passed, do not show alert modal)
                const deadlineVal = item.inspectionDeadline || item.deadline || item.device?.inspectionDeadline;
                const effectiveDeadline = deadlineVal
                    ? new Date(deadlineVal)
                    : (item.assignedAt ? new Date(new Date(item.assignedAt).getTime() + 3 * 24 * 60 * 60 * 1000) : null);

                if (effectiveDeadline && effectiveDeadline < new Date()) {
                    return true;
                }

                return false;
            };

            const checkIsReceivedByTechnician = (item) => {
                if (!item) return false;
                const delStat = String(item.deliveryStatus || "").toLowerCase();
                const st = String(item.status || "").toLowerCase();
                const reqStat = String(item.requestStatus || "").toLowerCase();
                const lifeStat = String(item.lifecycleStatus || "").toLowerCase();

                return (
                    st === "deliveredtocenter" ||
                    st === "delivered" ||
                    delStat === "delivered" ||
                    delStat === "deliveredtocenter" ||
                    lifeStat === "atinspectioncenter" ||
                    lifeStat === "receivedatcenter" ||
                    reqStat === "deliveredtocenter" ||
                    reqStat === "receivedatcenter" ||
                    Boolean(item.deliveredAt) ||
                    Boolean(item.receivedAt)
                );
            };

            const itemsToComplete = [
                ...liveDeliveries,
                ...rawList.filter(r => !liveDeliveries.some(d => d.deviceId === r.deviceId || d.inspectionRequestId === r.inspectionRequestId))
            ].filter(item => checkIsReceivedByTechnician(item) && !checkIsInspectionCompleted(item));

            if (itemsToComplete.length > 0) {
                setShowReminderModal(true);
            }
        } catch (err) {
            console.error("Error fetching inspection requests:", err);
            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
                localStorage.clear();
                navigate("/");
            } else {
                setError(err.response?.data?.message || "Failed to load assigned inspection requests.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId) => {
        try {
            setProcessingId(requestId);
            setError("");
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `https://ecocycle.runasp.net/api/Inspection/accept/${requestId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setRequests(prev =>
                prev.map(r => r.inspectionRequestId === requestId ? { ...r, status: "Accepted" } : r)
            );
            if (selectedRequest?.inspectionRequestId === requestId) {
                setSelectedRequest(prev => prev ? { ...prev, status: "Accepted" } : null);
            }
        } catch (err) {
            console.error("Error accepting request:", err);
            const msg = err.response?.data?.message || err.response?.data?.error || "Error accepting request.";
            setError(msg);
            alert(msg);
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectSubmit = async (e) => {
        e.preventDefault();
        if (!rejectionTarget) return;

        try {
            setProcessingId(rejectionTarget.inspectionRequestId);
            setError("");
            const token = localStorage.getItem("token");
            
            const response = await axios.post(
                `https://ecocycle.runasp.net/api/Inspection/reject/${rejectionTarget.inspectionRequestId}`,
                JSON.stringify(rejectionReason || "Unable to inspect at this time."),
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            setRequests(prev => prev.map(r => r.inspectionRequestId === rejectionTarget.inspectionRequestId ? { ...r, status: "Rejected", rejectionReason: rejectionReason || "Unable to inspect at this time." } : r));
            setRejectionTarget(null);
            setRejectionReason("");
            if (selectedRequest?.inspectionRequestId === rejectionTarget.inspectionRequestId) {
                setSelectedRequest(prev => prev ? { ...prev, status: "Rejected", rejectionReason: rejectionReason || "Unable to inspect at this time." } : null);
            }
        } catch (err) {
            console.error("Error rejecting request:", err);
            const msg = err.response?.data?.message || err.response?.data?.error || "Error rejecting request.";
            setError(msg);
            alert(msg);
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case "assigned":
                return <span className="pill pill-blue">Assigned</span>;
            case "accepted":
                return <span className="pill pill-green">Accepted</span>;
            case "inprogress":
            case "in progress":
                return <span className="pill pill-amber">In Evaluation</span>;
            case "rejected":
                return <span className="pill pill-red">Declined</span>;
            case "expired":
                return <span className="pill pill-red" style={{ backgroundColor: "#ef4444", color: "white" }}>Expired</span>;
            case "completed":
                return <span className="pill pill-green" style={{ backgroundColor: "#059669", color: "white" }}>Completed</span>;
            default:
                return <span className="pill pill-gray">{status || "Assigned"}</span>;
        }
    };

    const filteredRequests = requests.filter((r) => {
        const d = r.device || {};
        const matchesSearch =
            (d.brand?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.model?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.modelNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.serialNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.condition?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.category?.categoryName?.toLowerCase() || "").includes(searchQuery.toLowerCase());

        const st = (r.status || "").toLowerCase();
        const matchesStatus =
            activeFilter === "All" ||
            (activeFilter === "Assigned" && st === "assigned") ||
            (activeFilter === "Accepted" && st === "accepted") ||
            (activeFilter === "InProgress" && (st === "inprogress" || st === "in progress")) ||
            (activeFilter === "Rejected" && (st === "rejected" || st === "declined")) ||
            st === activeFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    const getRemainingTimeText = (deadlineStr) => {
        if (!deadlineStr) return null;
        const deadline = new Date(deadlineStr);
        const now = new Date();
        const diffMs = deadline - now;

        if (diffMs <= 0) {
            const overdueHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
            if (overdueHours < 1) return { text: "Overdue (just now)", isOverdue: true, isUrgent: true };
            const days = Math.floor(overdueHours / 24);
            const hrs = overdueHours % 24;
            const timeStr = days > 0 ? `${days}d ${hrs}h` : `${hrs}h`;
            return { text: `Overdue by ${timeStr}`, isOverdue: true, isUrgent: true };
        }

        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;

        if (days > 0) {
            return { text: `Time Left: ${days}d ${remainingHours}h`, isOverdue: false, isUrgent: days < 1 };
        } else if (hours > 0) {
            return { text: `Time Left: ${hours}h ${mins}m`, isOverdue: false, isUrgent: true };
        } else {
            return { text: `Time Left: ${mins}m`, isOverdue: false, isUrgent: true };
        }
    };

    const checkIsInspectionCompleted = (item) => {
        if (!item) return true;
        const delStat = String(item.deliveryStatus || "").toLowerCase();
        const st = String(item.status || "").toLowerCase();
        const reqStat = String(item.requestStatus || "").toLowerCase();
        const lifeStat = String(item.lifecycleStatus || "").toLowerCase();

        const isCompletedOrInactive = (
            lifeStat === "inspected" ||
            lifeStat === "completed" ||
            reqStat === "completed" ||
            st === "completed" ||
            st === "inspected" ||
            delStat === "completed" ||
            delStat === "inspected" ||
            Boolean(item.isInspected) ||
            Boolean(item.inspectionCompleted) ||
            Boolean(item.qualityGrade) ||
            st === "rejected" ||
            st === "declined" ||
            st === "cancelled" ||
            st === "reassigned" ||
            st === "penalized" ||
            st === "expired" ||
            reqStat === "reassigned" ||
            reqStat === "penalized" ||
            reqStat === "expired" ||
            lifeStat === "reassigned" ||
            lifeStat === "penalized" ||
            lifeStat === "expired" ||
            delStat === "rejected" ||
            delStat === "declined" ||
            delStat === "cancelled" ||
            delStat === "reassigned" ||
            delStat === "penalized" ||
            delStat === "expired"
        );
        if (isCompletedOrInactive) return true;

        // Deadline Expired Check (If deadline passed, do not show alert modal)
        const deadlineVal = item.inspectionDeadline || item.deadline || item.device?.inspectionDeadline;
        const effectiveDeadline = deadlineVal
            ? new Date(deadlineVal)
            : (item.assignedAt ? new Date(new Date(item.assignedAt).getTime() + 3 * 24 * 60 * 60 * 1000) : null);

        if (effectiveDeadline && effectiveDeadline < new Date()) {
            return true;
        }

        return false;
    };

    const checkIsReceivedByTechnician = (item) => {
        if (!item) return false;
        const delStat = String(item.deliveryStatus || "").toLowerCase();
        const st = String(item.status || "").toLowerCase();
        const reqStat = String(item.requestStatus || "").toLowerCase();
        const lifeStat = String(item.lifecycleStatus || "").toLowerCase();

        return (
            st === "deliveredtocenter" ||
            st === "delivered" ||
            delStat === "delivered" ||
            delStat === "deliveredtocenter" ||
            lifeStat === "atinspectioncenter" ||
            lifeStat === "receivedatcenter" ||
            reqStat === "deliveredtocenter" ||
            reqStat === "receivedatcenter" ||
            Boolean(item.deliveredAt) ||
            Boolean(item.receivedAt)
        );
    };

    const inspectionDevicesToComplete = [
        ...deliveries,
        ...requests.filter(r => !deliveries.some(d => d.deviceId === r.deviceId || d.inspectionRequestId === r.inspectionRequestId))
    ].filter(item => checkIsReceivedByTechnician(item) && !checkIsInspectionCompleted(item));

    const totalCount = requests.length;
    const pendingActionCount = requests.filter(r => r.status?.toLowerCase() === "assigned").length;
    const acceptedCount = requests.filter(r => r.status?.toLowerCase() === "accepted").length;
    const inProgressCount = requests.filter(r => r.status?.toLowerCase() === "inprogress" || r.status?.toLowerCase() === "in progress").length;
    const rejectedCount = requests.filter(r => r.status?.toLowerCase() === "rejected" || r.status?.toLowerCase() === "declined").length;
    const urgentCount = [
        ...deliveries,
        ...requests
    ].filter(r => {
        const dead = r.inspectionDeadline || r.deadline || r.device?.inspectionDeadline || (r.assignedAt ? new Date(new Date(r.assignedAt).getTime() + 3 * 86400000) : null);
        return dead && new Date(dead) < new Date(Date.now() + 86400000) && !checkIsInspectionCompleted(r);
    }).length;

    return (
        <div className="clean-dashboard-app">
            <Sidebar />
            
            <div className="clean-main-container">
                {/* Header */}
                <header className="clean-topbar">
                    <div className="topbar-title-area">
                        <h1>Inspection Dashboard</h1>
                        <p>Manage and inspect assigned e-waste device submissions</p>
                    </div>

                    <div className="tech-header-actions">
                        {/* Search Input */}
                        <div className="search-box-v2" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            <FiSearch className="search-icon" style={{ position: "absolute", left: "0.85rem", color: "#94a3b8", fontSize: "0.95rem" }} />
                            <input
                                type="text"
                                placeholder="Search brand, model, S/N, citizen..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    padding: "0.45rem 1rem 0.45rem 2.3rem",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "10px",
                                    background: "#ffffff",
                                    fontSize: "0.8rem",
                                    color: "#0f172a",
                                    width: "220px",
                                    outline: "none",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                                }}
                            />
                        </div>

                        <button className="tech-refresh-btn" onClick={() => fetchInspectionRequests()}>
                            <FiRefreshCw className={loading ? "spin-icon" : ""} /> Refresh
                        </button>

                        {/* Notification Bell */}
                        <button
                            className="tech-refresh-btn"
                            style={{ position: "relative" }}
                            title={`Notifications ${unreadNotifCount > 0 ? `(${unreadNotifCount} unread)` : ""}`}
                            onClick={() => navigate("/technician-notification")}
                        >
                            <FiBell style={{ fontSize: "1.1rem" }} />
                            {unreadNotifCount > 0 && (
                                <span style={{
                                    position: "absolute",
                                    top: "-4px",
                                    right: "-4px",
                                    background: "#ef4444",
                                    color: "#ffffff",
                                    fontSize: "0.65rem",
                                    fontWeight: 800,
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                                </span>
                            )}
                        </button>

                        <div className="tech-user-avatar" title={techName} style={{ cursor: "pointer" }} onClick={() => navigate("/technician-profile")}>
                            {profilePhoto ? (
                                <img
                                    src={getMediaUrl(profilePhoto, "ProfilePhotos")}
                                    alt={techName}
                                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        setProfilePhoto(null);
                                        try { localStorage.removeItem("profilePhoto"); } catch (err) {}
                                    }}
                                />
                            ) : (
                                userInitial
                            )}
                        </div>
                    </div>
                </header>

                {/* Top Inspection Alert Banner */}
                {inspectionDevicesToComplete.length > 0 && (
                    <div
                        className="reminder-alert-banner"
                        style={{
                            marginBottom: "1.25rem",
                            cursor: "pointer",
                            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
                            border: "1.5px solid #f59e0b",
                            padding: "1rem 1.25rem",
                            borderRadius: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "0.75rem",
                            boxShadow: "0 4px 12px rgba(245, 158, 11, 0.12)"
                        }}
                        onClick={() => setShowReminderModal(true)}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                            <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "#fef3c7", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <FiBell className="reminder-bell-ring" style={{ fontSize: "1.35rem", color: "#d97706" }} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, color: "#92400e", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    Technical Device Inspection Alert
                                    <span style={{ background: "#ef4444", color: "#ffffff", padding: "0.15rem 0.55rem", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 800 }}>
                                        {inspectionDevicesToComplete.length} Devices Pending
                                    </span>
                                </div>
                                <div style={{ color: "#78350f", fontSize: "0.825rem", marginTop: "0.2rem" }}>
                                    You have {inspectionDevicesToComplete.length} device(s) delivered to center requiring technical inspection completion. Click to view deadlines!
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Metric Cards */}
                <div className="summary-cards-grid">
                    <div
                        className="summary-card"
                        style={{ cursor: "pointer" }}
                        onClick={() => setActiveFilter("All")}
                    >
                        <div className="card-info">
                            <span className="card-label">Total Assigned</span>
                            <span className="card-value">{totalCount}</span>
                            <span className="card-subtext">All active & processed</span>
                        </div>
                        <div className="card-icon icon-blue"><FiCheckSquare /></div>
                    </div>

                    <div
                        className="summary-card"
                        style={{ cursor: "pointer" }}
                        onClick={() => setActiveFilter("Assigned")}
                        title="Click to filter pending review"
                    >
                        <div className="card-info">
                            <span className="card-label">Action Required</span>
                            <span className="card-value">{pendingActionCount}</span>
                            <span className="card-subtext">Pending acceptance</span>
                        </div>
                        <div className="card-icon icon-amber"><FiAlertCircle /></div>
                    </div>

                    <div
                        className="summary-card"
                        style={{ cursor: "pointer" }}
                        onClick={() => setActiveFilter("Accepted")}
                        title="Click to filter accepted requests"
                    >
                        <div className="card-info">
                            <span className="card-label">Accepted Requests</span>
                            <span className="card-value">{acceptedCount}</span>
                            <span className="card-subtext">Ready for inspection</span>
                        </div>
                        <div className="card-icon icon-green"><FiCheckCircle /></div>
                    </div>

                    <div
                        className="summary-card"
                        style={{ cursor: "pointer" }}
                        onClick={() => setActiveFilter("Rejected")}
                        title="Click to filter rejected requests"
                    >
                        <div className="card-info">
                            <span className="card-label">Declined Requests</span>
                            <span className="card-value">{rejectedCount}</span>
                            <span className="card-subtext">Rejected submissions</span>
                        </div>
                        <div className="card-icon icon-red"><FiX /></div>
                    </div>

                    <div className="summary-card">
                        <div className="card-info">
                            <span className="card-label">Urgent Deadlines</span>
                            <span className="card-value">{urgentCount}</span>
                            <span className="card-subtext">Expires within 24 hours</span>
                        </div>
                        <div className="card-icon icon-red"><FiClock /></div>
                    </div>
                </div>

                {/* Delivery Verification Banner */}
                <div style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 100%)", borderRadius: "14px", padding: "0.9rem 1.25rem", color: "#ffffff", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <FiTruck style={{ fontSize: "1.5rem" }} />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Verify Incoming Field Agent Deliveries</div>
                            <div style={{ fontSize: "0.8rem", color: "#a7f3d0" }}>Scan device QR tags or confirm physical receipt when Collection Agents arrive at your hub.</div>
                        </div>
                    </div>
                    <button
                        type="button"
                        style={{ background: "#ffffff", color: "#047857", border: "none", padding: "0.45rem 0.95rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
                        onClick={() => navigate("/technician-delivery")}
                    >
                        <FiCheckSquare /> Open Deliveries Hub ↗
                    </button>
                </div>

                {/* Inspection Queue Panel */}
                <section className="queue-section">
                    <div className="queue-card">
                        {/* Toolbar */}
                        <div className="queue-toolbar">
                            <div>
                                <h3 className="queue-heading">Assigned Submissions</h3>
                                <p className="queue-desc">Review device specifications, accept/decline tasks, and perform evaluations</p>
                            </div>

                            <div className="queue-controls">
                                <div className="filter-pills">
                                    {[
                                        { key: "All", label: `All (${totalCount})` },
                                        { key: "Assigned", label: `Pending (${pendingActionCount})` },
                                        { key: "Accepted", label: `Accepted (${acceptedCount})` },
                                        { key: "InProgress", label: `In Evaluation (${inProgressCount})` },
                                        { key: "Rejected", label: `Declined (${rejectedCount})` }
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            className={`pill-btn ${activeFilter === tab.key ? "active" : ""}`}
                                            onClick={() => setActiveFilter(tab.key)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="view-toggle">
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
                                        title="Grid View"
                                    >
                                        <FiGrid />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content Body */}
                        {loading ? (
                            <div className="state-box">
                                <div className="spinner"></div>
                                <p>Loading inspection requests...</p>
                            </div>
                        ) : error ? (
                            <div className="state-box error-box">
                                <p>{error}</p>
                                <button className="retry-btn" onClick={fetchInspectionRequests}>Retry</button>
                            </div>
                        ) : filteredRequests.length === 0 ? (
                            <div className="state-box">
                                <FiFilter className="empty-icon" />
                                <p>No inspection requests match your criteria.</p>
                            </div>
                        ) : viewMode === "table" ? (
                            /* TABLE VIEW */
                            <div className="table-wrapper">
                                <table className="clean-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Device Details</th>
                                            <th>Model & S/N</th>
                                            <th>Declared Condition</th>
                                            <th>Deadline</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRequests.map((req, index) => {
                                            const dev = req.device || {};
                                            return (
                                                <tr key={req.inspectionRequestId}>
                                                    <td style={{ fontWeight: 700, color: "#64748b" }}>{index + 1}</td>
                                                    <td>
                                                        <div className="device-name-cell">
                                                            <span className="dev-name">{dev.brand} {dev.model}</span>
                                                            <span className="dev-meta">Category: {dev.category?.categoryName || "Electronics"} | Qty: {dev.quantity || 1}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div><strong>Model:</strong> {dev.modelNumber || "N/A"}</div>
                                                        <div className="dev-meta"><strong>S/N:</strong> {dev.serialNumber || "N/A"}</div>
                                                    </td>
                                                    <td>
                                                        <span className="tag">{dev.condition || "Standard"}</span>
                                                    </td>
                                                    <td>
                                                        <div className="deadline-text">
                                                            <FiClock />
                                                            <span>{req.inspectionDeadline ? new Date(req.inspectionDeadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : (req.assignedAt ? new Date(new Date(req.assignedAt).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "3 Days")}</span>
                                                        </div>
                                                    </td>
                                                    <td>{getStatusBadge(req.status)}</td>
                                                    <td>
                                                        <div
                                                            className="action-row"
                                                            style={{
                                                                display: "flex",
                                                                gap: "10px",
                                                                alignItems: "center"
                                                            }}
                                                        >
                                                            <button
                                                                type="button"
                                                                className="btn btn-dark"
                                                                onClick={() => {
                                                                    setSelectedRequest(req);
                                                                    setActiveModalTab("overview");
                                                                }}
                                                            >
                                                                <FiEye /> View
                                                            </button>

                                                            {req.status?.toLowerCase() === "assigned" && (() => {
                                                                const dead = req.inspectionDeadline || (req.assignedAt ? new Date(new Date(req.assignedAt).getTime() + 3 * 86400000) : null);
                                                                const isReqOverdue = dead && new Date(dead) < new Date();
                                                                if (isReqOverdue) {
                                                                    return (
                                                                        <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "0.75rem", background: "#fef2f2", border: "1px solid #fca5a5", padding: "0.3rem 0.6rem", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                                            <FiAlertTriangle /> Deadline Expired
                                                                        </span>
                                                                    );
                                                                }
                                                                return (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleAccept(req.inspectionRequestId)}
                                                                            disabled={processingId === req.inspectionRequestId}
                                                                            style={{
                                                                                display: "inline-flex",
                                                                                alignItems: "center",
                                                                                gap: "5px",
                                                                                backgroundColor: "green",
                                                                                color: "white",
                                                                                border: "none",
                                                                                padding: "8px 12px",
                                                                                borderRadius: "5px",
                                                                                cursor: "pointer"
                                                                            }}
                                                                        >
                                                                            <FiCheck /> Accept
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                console.log("DECLINE BUTTON CLICKED", req);
                                                                                setRejectionTarget(req);
                                                                            }}
                                                                            disabled={processingId === req.inspectionRequestId}
                                                                            style={{
                                                                                display: "inline-flex",
                                                                                alignItems: "center",
                                                                                gap: "5px",
                                                                                backgroundColor: "red",
                                                                                color: "white",
                                                                                border: "none",
                                                                                padding: "8px 12px",
                                                                                borderRadius: "5px",
                                                                                cursor: "pointer"
                                                                            }}
                                                                        >
                                                                            <FiX /> Decline
                                                                        </button>
                                                                    </>
                                                                );
                                                            })()}

                                                            {(req.status?.toLowerCase() === "accepted" || req.status?.toLowerCase() === "inprogress" || req.status?.toLowerCase() === "in progress") && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => navigate(`/technician_inspection/${req.deviceId}`)}
                                                                    style={{
                                                                        display: "inline-flex",
                                                                        alignItems: "center",
                                                                        gap: "5px",
                                                                        backgroundColor: "#059669",
                                                                        color: "white",
                                                                        border: "none",
                                                                        padding: "7px 12px",
                                                                        borderRadius: "5px",
                                                                        cursor: "pointer",
                                                                        fontWeight: 600,
                                                                        fontSize: "0.8rem"
                                                                    }}
                                                                >
                                                                    <FiCheckCircle /> Inspect
                                                                </button>
                                                            )}

                                                            {(req.status?.toLowerCase() === "rejected" || req.status?.toLowerCase() === "declined") && (
                                                                <span style={{ fontSize: "0.75rem", color: "#e11d48", fontWeight: 700, background: "#fff1f2", padding: "0.25rem 0.55rem", borderRadius: "5px", border: "1px solid #fecdd3" }} title={req.rejectionReason || "Declined"}>
                                                                    Declined
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            /* GRID VIEW */
                            <div className="grid-cards">
                                {filteredRequests.map((req) => {
                                    const dev = req.device || {};
                                    return (
                                        <div key={req.inspectionRequestId} className="grid-card">
                                            <div className="grid-card-header">
                                                <span className="id-badge">ID #{req.inspectionRequestId}</span>
                                                {getStatusBadge(req.status)}
                                            </div>

                                            <div className="grid-card-body">
                                                <h4 className="device-title">{dev.brand} {dev.model}</h4>
                                                <p className="device-sub">{dev.category?.categoryName || "Hardware"} • Qty: {dev.quantity || 1}</p>

                                                <div className="spec-list">
                                                    <div className="spec-item">
                                                        <span>Model No:</span>
                                                        <strong>{dev.modelNumber || "N/A"}</strong>
                                                    </div>
                                                    <div className="spec-item">
                                                        <span>Serial No:</span>
                                                        <strong>{dev.serialNumber || "N/A"}</strong>
                                                    </div>
                                                    <div className="spec-item">
                                                        <span>Condition:</span>
                                                        <strong>{dev.condition || "Standard"}</strong>
                                                    </div>
                                                    <div className="spec-item">
                                                        <span>Deadline:</span>
                                                        <strong>{req.inspectionDeadline ? new Date(req.inspectionDeadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : (req.assignedAt ? new Date(new Date(req.assignedAt).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "3 Days")}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid-card-footer">
                                                <button
                                                    className="btn btn-dark"
                                                    style={{ flex: 1, minWidth: 0 }}
                                                    onClick={() => {
                                                        setSelectedRequest(req);
                                                        setActiveModalTab("overview");
                                                    }}
                                                >
                                                    <FiEye /> View
                                                </button>

                                                {req.status?.toLowerCase() === "assigned" && (() => {
                                                    const dead = req.inspectionDeadline || (req.assignedAt ? new Date(new Date(req.assignedAt).getTime() + 3 * 86400000) : null);
                                                    const isReqOverdue = dead && new Date(dead) < new Date();
                                                    if (isReqOverdue) {
                                                        return (
                                                            <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "0.75rem", background: "#fef2f2", border: "1px solid #fca5a5", padding: "0.35rem 0.6rem", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "0.3rem", flex: 2, justifyContent: "center" }}>
                                                                <FiAlertTriangle /> Deadline Expired
                                                            </span>
                                                        );
                                                    }
                                                    return (
                                                        <>
                                                            <button
                                                                className="btn btn-success"
                                                                style={{ flex: 1, minWidth: 0 }}
                                                                onClick={() => handleAccept(req.inspectionRequestId)}
                                                                disabled={processingId === req.inspectionRequestId}
                                                            >
                                                                <FiCheck /> Accept
                                                            </button>
                                                            <button
                                                                className="btn btn-danger"
                                                                style={{ flex: 1, minWidth: 0 }}
                                                                onClick={() => setRejectionTarget(req)}
                                                                disabled={processingId === req.inspectionRequestId}
                                                            >
                                                                <FiX /> Decline
                                                            </button>
                                                        </>
                                                    );
                                                })()}

                                                {(req.status?.toLowerCase() === "accepted" || req.status?.toLowerCase() === "inprogress" || req.status?.toLowerCase() === "in progress") && (
                                                    <button
                                                        className="btn btn-success"
                                                        style={{ flex: 1, minWidth: 0, background: "#059669", color: "white" }}
                                                        onClick={() => navigate(`/technician_inspection/${req.deviceId}`)}
                                                    >
                                                        <FiCheckCircle /> Inspect
                                                    </button>
                                                )}

                                                {(req.status?.toLowerCase() === "rejected" || req.status?.toLowerCase() === "declined") && (
                                                    <span style={{ fontSize: "0.75rem", color: "#e11d48", fontWeight: 700, background: "#fff1f2", padding: "0.35rem 0.6rem", borderRadius: "6px", border: "1px solid #fecdd3", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                                                        Declined
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* Inspection Details Modal */}
                {selectedRequest && (
                    <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
                        <div className="clean-modal insp-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h2>{selectedRequest.device?.brand} {selectedRequest.device?.model}</h2>
                                </div>
                                <button className="close-btn" onClick={() => setSelectedRequest(null)}>
                                    <FiX />
                                </button>
                            </div>

                            {/* Modal Tabs */}
                            <div className="modal-tabs">
                                <button
                                    className={`tab-item ${activeModalTab === "overview" ? "active" : ""}`}
                                    onClick={() => setActiveModalTab("overview")}
                                >
                                    Overview & Specs
                                </button>
                                <button
                                    className={`tab-item ${activeModalTab === "photos" ? "active" : ""}`}
                                    onClick={() => setActiveModalTab("photos")}
                                >
                                    Uploaded Photos
                                </button>
                            </div>

                            <div className="modal-content">
                                {activeModalTab === "overview" && (
                                    <>
                                        <div className="details-grid">
                                            <div className="detail-item">
                                                <label>Brand & Model</label>
                                                <span>{selectedRequest.device?.brand} {selectedRequest.device?.model}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Model Number</label>
                                                <span>{selectedRequest.device?.modelNumber || "N/A"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Serial Number</label>
                                                <span>{selectedRequest.device?.serialNumber || "N/A"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Purchase Date</label>
                                                <span>{selectedRequest.device?.purchaseDate ? new Date(selectedRequest.device?.purchaseDate).toLocaleDateString("en-IN") : "N/A"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Quantity</label>
                                                <span>{selectedRequest.device?.quantity || 1} Unit(s)</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Condition</label>
                                                <span>{selectedRequest.device?.condition || "N/A"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Working State</label>
                                                <span>{selectedRequest.device?.working || "N/A"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Preference</label>
                                                <span>{selectedRequest.device?.processingPreference || "Standard"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <label>Pickup Location</label>
                                                <span>{selectedRequest.device?.landmark || selectedRequest.device?.address || "N/A"}</span>
                                            </div>
                                        </div>

                                        {/* Collection Agent Handover & Receipt Verification Box */}
                                        <div style={{ marginTop: "1.25rem", padding: "1rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
                                            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                <FiCheckSquare style={{ color: "#059669" }} /> Collection Agent Handover & Receipt Verification
                                            </h4>
                                            <div style={{ fontSize: "0.8rem", color: "#475569", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                                <div><strong>Device Tag Code:</strong> <span style={{ color: "#059669", fontWeight: 700 }}>#EC-{selectedRequest.device?.deviceId}</span></div>
                                                <div><strong>Delivery Status:</strong> {(selectedRequest.device?.lifecycleStatus === "ReceivedAtCenter" || selectedRequest.device?.lifecycleStatus === "AtInspectionCenter" || selectedRequest.device?.lifecycleStatus === "Inspected" || selectedRequest.device?.lifecycleStatus?.includes("Refurbish") || selectedRequest.device?.lifecycleStatus?.includes("Recycl") || selectedRequest.status === "Completed") ? <span style={{ color: "#16a34a", fontWeight: 700 }}>Delivered</span> : <span style={{ color: "#2563eb", fontWeight: 700 }}>In Transit</span>}</div>
                                                <div><strong>Condition:</strong> {selectedRequest.status === "Completed" || selectedRequest.device?.lifecycleStatus === "Inspected" ? <span style={{ color: "#059669", fontWeight: 700 }}>✓ Inspected</span> : <span style={{ color: "#d97706", fontWeight: 700 }}>Pending Inspection</span>}</div>
                                                <div><strong>Inspection Started:</strong> {selectedRequest.status === "Completed" || selectedRequest.device?.lifecycleStatus === "Inspected" ? <span style={{ color: "#059669", fontWeight: 700 }}>Yes (Completed)</span> : selectedRequest.status === "InProgress" ? <span style={{ color: "#2563eb", fontWeight: 700 }}>Yes (In Progress)</span> : <span style={{ color: "#64748b", fontWeight: 700 }}>No</span>}</div>
                                            </div>
                                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    style={{ fontSize: "0.8rem", padding: "0.45rem 0.85rem" }}
                                                    onClick={() => {
                                                        setSelectedRequest(null);
                                                        navigate("/technician-delivery");
                                                    }}
                                                >
                                                    <FiTruck /> Open Delivery Verification Hub ↗
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {activeModalTab === "diagnostic" && (
                                    <div className="diagnostic-form">
                                        <label>Technician Evaluation Notes</label>
                                        <textarea
                                            placeholder="Enter hardware condition, component testing result, or evaluation notes..."
                                            value={diagnosticNotes}
                                            onChange={(e) => setDiagnosticNotes(e.target.value)}
                                            rows={5}
                                        ></textarea>
                                    </div>
                                )}

                                {activeModalTab === "photos" && (
                                    <div className="photos-grid">
                                        {selectedRequest.device?.frontPhoto && (
                                            <div className="photo-card">
                                                <img src={`https://ecocycle.runasp.net/uploads/devices/FrontPhotos/${selectedRequest.device.frontPhoto}`} alt="Front" />
                                                <span>Front View</span>
                                            </div>
                                        )}
                                        {selectedRequest.device?.backPhoto && (
                                            <div className="photo-card">
                                                <img src={`https://ecocycle.runasp.net/uploads/devices/BackPhotos/${selectedRequest.device.backPhoto}`} alt="Back" />
                                                <span>Back View</span>
                                            </div>
                                        )}
                                        {selectedRequest.device?.damagePhoto && (
                                            <div className="photo-card">
                                                <img src={`https://ecocycle.runasp.net/uploads/devices/DamagePhotos/${selectedRequest.device.damagePhoto}`} alt="Damage" />
                                                <span>Damage Area</span>
                                            </div>
                                        )}
                                        {selectedRequest.device?.labelPhoto && (
                                            <div className="photo-card">
                                                <img src={`https://ecocycle.runasp.net/uploads/devices/LabelPhotos/${selectedRequest.device.labelPhoto}`} alt="Label" />
                                                <span>Serial Label</span>
                                            </div>
                                        )}
                                        {!selectedRequest.device?.frontPhoto && !selectedRequest.device?.backPhoto && !selectedRequest.device?.damagePhoto && !selectedRequest.device?.labelPhoto && (
                                            <p className="no-photos">No photos uploaded for this device.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                {selectedRequest.status?.toLowerCase() === "assigned" && (() => {
                                    const selectedDead = selectedRequest.inspectionDeadline || (selectedRequest.assignedAt ? new Date(new Date(selectedRequest.assignedAt).getTime() + 3 * 86400000) : null);
                                    const isSelectedOverdue = selectedDead && new Date(selectedDead) < new Date();
                                    if (isSelectedOverdue) {
                                        return (
                                            <div style={{ color: "#dc2626", fontWeight: 700, fontSize: "0.85rem", background: "#fef2f2", border: "1px solid #fca5a5", padding: "0.5rem 1rem", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.4rem", boxSizing: "border-box" }}>
                                                <FiAlertTriangle /> Inspection Deadline Expired
                                            </div>
                                        );
                                    }
                                    return (
                                        <>
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleAccept(selectedRequest.inspectionRequestId)}
                                                disabled={processingId === selectedRequest.inspectionRequestId}
                                            >
                                                <FiCheck /> Accept Inspection Task
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => setRejectionTarget(selectedRequest)}
                                                disabled={processingId === selectedRequest.inspectionRequestId}
                                            >
                                                <FiX /> Decline Request
                                            </button>
                                        </>
                                    );
                                })()}
                                <button className="btn btn-secondary" onClick={() => setSelectedRequest(null)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Decline Modal */}
                {rejectionTarget && (
                    <div className="modal-overlay" onClick={() => setRejectionTarget(null)}>
                        <div className="clean-modal insp-modal" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h2>Decline Request</h2>
                                    <p className="modal-sub">Inspection Request #{rejectionTarget.inspectionRequestId}</p>
                                </div>
                                <button className="close-btn" onClick={() => setRejectionTarget(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <form onSubmit={handleRejectSubmit}>
                                <div style={{ padding: "1.25rem 1.5rem" }}>
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
                                        disabled={processingId === rejectionTarget.inspectionRequestId}
                                    >
                                        Decline Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Today's Inspection Reminder Modal */}
                {showReminderModal && (
                    <div className="modal-overlay" onClick={() => setShowReminderModal(false)} style={{ zIndex: 9999 }}>
                        <div className="clean-modal insp-modal reminder-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", color: "#ffffff" }}>
                                        <FiBell />
                                    </div>
                                    <div>
                                        <h2 style={{ color: "#ffffff", margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>Pending Technical Device Inspection Alert</h2>
                                        <p className="modal-sub" style={{ color: "rgba(255,255,255,0.85)", margin: "0.15rem 0 0 0", fontSize: "0.8rem" }}>
                                            Date: <strong>{new Date().toLocaleDateString([], { dateStyle: "medium" })}</strong> &bull; Devices Awaiting Inspection: <strong>{inspectionDevicesToComplete.length} Items</strong>
                                        </p>
                                    </div>
                                </div>
                                <button className="close-btn" onClick={() => setShowReminderModal(false)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="reminder-modal-body" style={{ padding: "1.25rem 1.5rem" }}>
                                {inspectionDevicesToComplete.length > 0 ? (
                                    <>
                                        <div className="reminder-alert-banner" style={{ background: "#fff7ed", border: "1px solid #ffedd5", color: "#9a3412", padding: "0.85rem 1rem", borderRadius: "12px", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                            <FiAlertCircle className="reminder-alert-icon" style={{ color: "#ea580c", fontSize: "1.3rem" }} />
                                            <span style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
                                                You have <strong>{inspectionDevicesToComplete.length}</strong> device(s) delivered to center with active technical inspection completion deadlines. Please complete testing &amp; destination routing!
                                            </span>
                                        </div>

                                        <div className="reminder-pickups-list">
                                            {inspectionDevicesToComplete.map((item, idx) => {
                                                const itemInspDeadline = item.inspectionDeadline || item.deadline || item.device?.inspectionDeadline;
                                                const timeInfo = getRemainingTimeText(itemInspDeadline);
                                                const devCode = (item.deviceId || item.device?.deviceId) ? `#DEV-${String(item.deviceId || item.device?.deviceId).padStart(3, "0")}` : `#REQ-${item.inspectionRequestId || idx + 1}`;
                                                const brandName = item.brand || item.device?.brand || "E-Waste";
                                                const modelName = item.model || item.device?.model || "Device";
                                                const categoryName = item.categoryName || item.category?.categoryName || item.device?.category?.categoryName || item.device?.category || "E-Waste Device";
                                                const customer = item.customerName || item.citizenName || (item.device?.user ? `${item.device.user.firstName} ${item.device.user.lastName}`.trim() : "N/A");
                                                const itemCondition = item.condition || item.device?.condition || "Standard";
                                                const itemPref = item.preference || item.processingPreference || item.device?.processingPreference || "Standard";
                                                const agent = item.collectionAgentName || item.agentName || item.collectorName || "Field Agent";

                                                return (
                                                    <div key={item.deviceId || item.inspectionRequestId || idx} className="reminder-pickup-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1.15rem", marginBottom: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                                                        <div className="reminder-card-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                                                            <span className="reminder-badge-num" style={{ background: "#f1f5f9", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                                                                {devCode}
                                                            </span>
                                                            <span className="pill pill-green" style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", padding: "0.2rem 0.65rem", borderRadius: "20px", fontSize: "0.725rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                                ● Received at Center
                                                            </span>
                                                        </div>

                                                        <h3 style={{ margin: "0 0 0.15rem 0", fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                                                            {brandName} {modelName}
                                                        </h3>
                                                        <div style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "0.85rem" }}>
                                                            {categoryName}
                                                        </div>

                                                        <div className="reminder-card-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", background: "#f8fafc", padding: "0.75rem", borderRadius: "10px", marginBottom: "0.85rem" }}>
                                                            <div>
                                                                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Citizen</div>
                                                                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.825rem" }}>{customer}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Condition</div>
                                                                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.825rem" }}>{itemCondition}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Preference</div>
                                                                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.825rem" }}>{itemPref}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Agent</div>
                                                                <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.825rem" }}>{agent}</div>
                                                            </div>
                                                        </div>

                                                        {(() => {
                                                            const deadlineVal = itemInspDeadline;
                                                            const effectiveDeadline = deadlineVal
                                                                ? new Date(deadlineVal)
                                                                : new Date(new Date(item.deliveredAt || item.assignedAt || item.createdAt || Date.now()).getTime() + 3 * 24 * 60 * 60 * 1000);
                                                            const cardTimeInfo = getRemainingTimeText(effectiveDeadline);
                                                            const isOverdue = cardTimeInfo?.isOverdue || effectiveDeadline < new Date();

                                                            return (
                                                                <>
                                                                    <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: "12px", padding: "0.75rem 0.9rem", marginBottom: "0.85rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                                                                        <div>
                                                                            <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: "0.15rem" }}>
                                                                                INSPECTION DEADLINE
                                                                            </div>
                                                                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 800, color: "#9a3412", fontSize: "0.85rem" }}>
                                                                                <FiClock /> {effectiveDeadline.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                                                                            </div>
                                                                        </div>
                                                                        {cardTimeInfo && (
                                                                            <span style={{
                                                                                background: cardTimeInfo.isOverdue ? "#ef4444" : "#ea580c",
                                                                                color: "#ffffff",
                                                                                padding: "0.3rem 0.8rem",
                                                                                borderRadius: "20px",
                                                                                fontSize: "0.75rem",
                                                                                fontWeight: 800,
                                                                                boxShadow: "0 2px 4px rgba(234, 88, 12, 0.2)"
                                                                            }}>
                                                                                {cardTimeInfo.text}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {isOverdue ? (
                                                                        <div style={{ width: "100%", boxSizing: "border-box", background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", padding: "0.65rem 1rem", borderRadius: "10px", fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                                                            <FiAlertTriangle /> Inspection Deadline Expired
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setShowReminderModal(false);
                                                                                navigate("/technician/device-inspection");
                                                                            }}
                                                                            style={{ width: "100%", background: "#0f172a", color: "#ffffff", border: "none", padding: "0.65rem 1rem", borderRadius: "10px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                                                                        >
                                                                            <FiActivity /> Start Technical Inspection
                                                                        </button>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="reminder-empty-state" style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                                        <FiCheckCircle style={{ fontSize: "3rem", color: "#10b981", marginBottom: "0.75rem" }} />
                                        <h3 style={{ margin: "0 0 0.3rem 0", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>No Pending Device Inspections</h3>
                                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>All delivered devices have completed technical testing and routing!</p>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer" style={{ padding: "1rem 1.5rem", background: "#ffffff", borderTop: "1px solid #e2e8f0", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowReminderModal(false)}
                                    style={{ padding: "0.55rem 1.15rem", borderRadius: "10px", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={() => {
                                        setShowReminderModal(false);
                                        navigate("/technician/device-inspection");
                                    }}
                                    style={{ padding: "0.55rem 1.25rem", borderRadius: "10px", background: "#059669", border: "none", color: "#ffffff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                                >
                                    <FiActivity /> Acknowledge &amp; Go to Inspections
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Inspectiontechnician_dashboard;