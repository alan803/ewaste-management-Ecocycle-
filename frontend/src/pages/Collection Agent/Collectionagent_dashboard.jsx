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
    FiAlertTriangle,
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
            const response = await axios.get("https://ecocycle.runasp.net/api/CollectionAgent/todays-pickup", {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            console.log("Today's Pickups Reminder Data:", response.data);
            if (response.data) {
                const rawPickups = response.data.pickups || [];
                const acceptedOnly = rawPickups.filter(p => {
                    const s = (p?.status || "").toLowerCase();
                    return s === "accepted" || s === "pickupstarted" || s === "en route";
                });
                const filteredData = {
                    ...response.data,
                    totalPickups: acceptedOnly.length,
                    pickups: acceptedOnly
                };
                setTodaysReminder(filteredData);
                if (acceptedOnly.length > 0) {
                    setShowReminderModal(true);
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

    const fetchAssignedPickups = async (token) => {
        const authToken = token || localStorage.getItem("token");
        fetchUnreadNotificationsCount();
        fetchTodaysReminder(authToken);
        try {
            setLoading(true);
            setError("");
            const response = await axios.get("https://ecocycle.runasp.net/api/CollectionAssignment/my-assignments", {
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

            const activePickups = sorted.filter(p => {
                const s = (p?.status || "").toLowerCase();
                return s === "accepted" || s === "pickupstarted" || s === "en route";
            });

            if (activePickups.length > 0) {
                setTodaysReminder(prev => prev && prev.pickups?.length > 0 ? prev : {
                    date: new Date().toISOString().split('T')[0],
                    totalPickups: activePickups.length,
                    pickups: activePickups.map(ap => ({
                        assignmentId: ap.collectionAssignmentId,
                        deviceId: ap.deviceId,
                        brand: ap.brand,
                        model: ap.model,
                        categoryName: ap.categoryName,
                        quantity: ap.quantity || 1,
                        weight: ap.weight || "N/A",
                        pickupDate: ap.pickupDate,
                        timeSlot: ap.timeSlot,
                        address: ap.address,
                        landmark: ap.landmark,
                        city: ap.city,
                        district: ap.district,
                        state: ap.state,
                        pincode: ap.pincode,
                        customerName: ap.customerName,
                        customerPhone: ap.customerPhone,
                        status: ap.status,
                        extensionCount: ap.extensionCount || 0,
                        responseDeadline: ap.responseDeadline,
                        acceptedAt: ap.acceptedAt,
                        completionDeadline: ap.completionDeadline
                    }))
                });
                setShowReminderModal(true);
            }
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
            const res = await axios.post(
                `https://ecocycle.runasp.net/api/CollectionAssignment/accept/${assignmentId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            const acceptedAtDate = res.data?.acceptedAt || new Date().toISOString();
            const compDeadline = res.data?.completionDeadline || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
            
            setPickups(prev =>
                prev.map(p => (p.collectionAssignmentId === assignmentId ? { 
                    ...p, 
                    status: "Accepted",
                    acceptedAt: acceptedAtDate,
                    completionDeadline: compDeadline
                } : p))
            );
            if (selectedPickup?.collectionAssignmentId === assignmentId) {
                setSelectedPickup(prev => prev ? { 
                    ...prev, 
                    status: "Accepted",
                    acceptedAt: acceptedAtDate,
                    completionDeadline: compDeadline
                } : null);
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
                `https://ecocycle.runasp.net/api/Pickup/start/${assignmentId}`,
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
                `https://ecocycle.runasp.net/api/CollectionAssignment/reject/${rejectionTarget.collectionAssignmentId}`,
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

    const safePickups = Array.isArray(pickups) ? pickups : [];

    const filteredPickups = safePickups.filter((item) => {
        if (!item) return false;
        const matchesSearch =
            (item.brand || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
            (item.model || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
            (item.customerName || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
            (item.customerPhone || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
            (item.address || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
            (item.city || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
            (item.technicianName || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
            (item.technicianPhone || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
            (item.inspectionCenterName || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
            (item.recyclingCenterName || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
            (item.recyclingCenterPhone || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
            (item.categoryName || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
            (item.condition || "").toLowerCase().includes((searchQuery || "").toLowerCase()) ||
            (item.rejectionReason || "").toLowerCase().includes((searchQuery || "").toLowerCase());

        const statusLower = (item.status || "").toLowerCase();
        const activeTabLower = (activeTab || "").toLowerCase();

        let matchesTab = true;
        if (activeTab === "Refurbishment Center") {
            matchesTab = item.assignmentType === "TechnicianToRefurbishmentCenter";
        } else if (activeTab === "Recycling Center") {
            matchesTab = item.assignmentType === "TechnicianToRecyclingCenter";
        } else if (activeTabLower === "assigned" || activeTabLower === "pending") {
            matchesTab = statusLower === "assigned" || statusLower === "pending";
        } else if (activeTabLower === "accepted") {
            matchesTab = statusLower === "accepted";
        } else if (activeTabLower === "rejected" || activeTabLower === "declined" || activeTabLower === "expired") {
            matchesTab = statusLower === "rejected" || statusLower === "declined" || statusLower === "expired" || statusLower === "failed" || statusLower === "cancelled";
        } else if (activeTabLower === "pickupstarted" || activeTabLower === "en route") {
            matchesTab = statusLower === "pickupstarted" || statusLower === "en route";
        } else if (activeTabLower === "completed") {
            matchesTab = statusLower === "completed" || statusLower === "deliveredtocenter" || statusLower === "delivered" || statusLower === "pickedup";
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

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });
        } catch {
            return dateStr;
        }
    };

    const formatScheduleTime = (item) => {
        const rawDate = item?.pickupDate || item?.assignedAt || item?.createdAt;
        const dateFormatted = formatDate(rawDate);
        const slot = item?.timeSlot || item?.pickupTimeSlot;
        if (slot) {
            return `${dateFormatted} (${slot})`;
        }
        return dateFormatted;
    };

    const getStatusBadge = (itemOrStatus) => {
        let s = "";
        let delStat = "";
        let lcs = "";

        if (typeof itemOrStatus === "object" && itemOrStatus !== null) {
            s = String(itemOrStatus.status || "").toLowerCase();
            delStat = String(itemOrStatus.deliveryStatus || "").toLowerCase();
            lcs = String(itemOrStatus.lifecycleStatus || "").toLowerCase();
        } else {
            s = String(itemOrStatus || "").toLowerCase();
        }

        if (s === "handoverrejected" || delStat === "handoverrejected" || lcs === "handoverrejected") {
            return (
                <span className="pro-badge badge-declined" style={{ background: "#fef2f2", color: "#dc2626", border: "1.5px solid #fca5a5", fontWeight: 700 }}>
                    <FiAlertTriangle /> Verification Rejected
                </span>
            );
        }

        if (s === "deliveredtocenter" || delStat === "delivered" || delStat === "completed") {
            return <span className="pro-badge badge-completed"><FiCheckCircle /> Delivered to Hub</span>;
        }

        if (s === "awaitingtechnicianapproval" || delStat === "pendingverification" || lcs === "handoverpendingverification") {
            return <span className="pro-badge badge-pending" style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}><FiClock /> Handover Verification</span>;
        }

        switch (s) {
            case "pickedup":
                return <span className="pro-badge badge-enroute" style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}><FiTruck /> Collected - In Transit</span>;
            case "pickupstarted":
            case "en route":
            case "outfordelivery":
                return <span className="pro-badge badge-enroute"><FiTruck /> En Route</span>;
            case "accepted":
                return <span className="pro-badge badge-accepted"><FiCheck /> Accepted</span>;
            case "rejected":
            case "declined":
            case "expired":
            case "cancelled":
            case "failed":
                return <span className="pro-badge badge-expired"><FiAlertTriangle /> Expired</span>;
            case "assigned":
            case "pending":
            default:
                return <span className="pro-badge badge-pending"><FiClock /> Pending</span>;
        }
    };

    const totalCount = safePickups.length;
    // Helper to format clean device title without duplicate brand name
    const getDeviceTitle = (item) => {
        const brand = (item?.brand || "").trim();
        const model = (item?.model || "").trim();
        if (!brand && !model) return "E-Waste Device";
        if (!brand) return model;
        if (!model) return brand;
        if (model.toLowerCase().startsWith(brand.toLowerCase())) {
            return model;
        }
        return `${brand} ${model}`;
    };

    const refurbCount = safePickups.filter(p => p.assignmentType === "TechnicianToRefurbishmentCenter").length;
    const recycleCount = safePickups.filter(p => p.assignmentType === "TechnicianToRecyclingCenter").length;
    const totalUnits = safePickups.reduce((acc, p) => acc + (p?.quantity || 1), 0);
    const completedCount = safePickups.filter(p => {
        const s = (p?.status || "").toLowerCase();
        return s === "completed" || s === "deliveredtocenter" || s === "delivered" || s === "pickedup";
    }).length;
    const assignedCount = safePickups.filter(p => {
        const s = (p?.status || "").toLowerCase();
        return s === "assigned" || s === "pending";
    }).length;
    const pendingCount = assignedCount;
    const acceptedCount = safePickups.filter(p => (p?.status || "").toLowerCase() === "accepted").length;
    const rejectedCount = safePickups.filter(p => {
        const s = (p?.status || "").toLowerCase();
        return s === "expired" || s === "rejected" || s === "declined" || s === "failed" || s === "cancelled";
    }).length;
    const activeCount = safePickups.filter(p => {
        const s = (p?.status || "").toLowerCase();
        return s === "accepted" || s === "pickupstarted" || s === "en route";
    }).length;

    const collectionPickupsToComplete = safePickups.filter(p => {
        const s = (p?.status || "").toLowerCase();
        return s === "accepted" || s === "pickupstarted" || s === "en route";
    });

    const reminderList = (todaysReminder?.pickups && todaysReminder.pickups.length > 0)
        ? todaysReminder.pickups.filter(p => {
            const s = (p?.status || "").toLowerCase();
            return s === "accepted" || s === "pickupstarted" || s === "en route";
        })
        : collectionPickupsToComplete.map(ap => ({
            assignmentId: ap.collectionAssignmentId,
            deviceId: ap.deviceId,
            brand: ap.brand,
            model: ap.model,
            categoryName: ap.categoryName,
            quantity: ap.quantity || 1,
            weight: ap.weight || "N/A",
            pickupDate: ap.pickupDate,
            timeSlot: ap.timeSlot,
            address: ap.address,
            landmark: ap.landmark,
            city: ap.city,
            district: ap.district,
            state: ap.state,
            pincode: ap.pincode,
            customerName: ap.customerName,
            customerPhone: ap.customerPhone,
            status: ap.status,
            extensionCount: ap.extensionCount || 0,
            responseDeadline: ap.responseDeadline,
            acceptedAt: ap.acceptedAt,
            completionDeadline: ap.completionDeadline
        }));

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

                {/* Top Collection Pickup Alert Banner matching Inspection Technician Dashboard */}
                {collectionPickupsToComplete.length > 0 && (
                    <div
                        className="reminder-alert-banner"
                        style={{
                            margin: "1rem 0 1.25rem 0",
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
                                    Scheduled Collection Pickup Alert
                                    <span style={{ background: "#ef4444", color: "#ffffff", padding: "0.15rem 0.55rem", borderRadius: "20px", fontSize: "0.7rem", fontWeight: 800 }}>
                                        {collectionPickupsToComplete.length} Pickups Due
                                    </span>
                                </div>
                                <div style={{ color: "#78350f", fontSize: "0.825rem", marginTop: "0.2rem" }}>
                                    You have {collectionPickupsToComplete.length} scheduled e-waste collection pickup(s) requiring completion. Click to view pickup schedule &amp; deadlines!
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Metric Summary Cards Grid */}
                <div className="agent-kpi-grid">
                    <div className="agent-kpi-card">
                        <div className="agent-kpi-top">
                            <div className="agent-kpi-icon emerald">
                                <FiTruck />
                            </div>
                            <span className="agent-kpi-badge">Total Tasks</span>
                        </div>
                        <div>
                            <h3 className="agent-kpi-val">{totalCount} Tasks</h3>
                            <div className="agent-kpi-lbl">Assigned Devices</div>
                        </div>
                    </div>

                    <div className="agent-kpi-card">
                        <div className="agent-kpi-top">
                            <div className="agent-kpi-icon teal">
                                <FiCheckCircle />
                            </div>
                            <span className="agent-kpi-badge teal-pill">Delivered</span>
                        </div>
                        <div>
                            <h3 className="agent-kpi-val">{completedCount} Completed</h3>
                            <div className="agent-kpi-lbl">Delivered to Centers</div>
                        </div>
                    </div>

                    <div className="agent-kpi-card">
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

                    <div className="agent-kpi-card">
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
                        className="agent-kpi-card" 
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
                            <div className="agent-kpi-lbl">Click to view reminders</div>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="pro-filter-card" style={{ marginBottom: "1.5rem" }}>
                    <div className="pro-tabs-list">
                        {[
                            { id: "All", label: "All", count: totalCount },
                            { id: "Refurbishment Center", label: "Refurbishment Center", count: refurbCount },
                            { id: "Recycling Center", label: "Recycling Center", count: recycleCount },
                            { id: "Pending", label: "Pending", count: pendingCount },
                            { id: "Accepted", label: "Accepted", count: acceptedCount },
                            { id: "Rejected", label: "Rejected", count: rejectedCount }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                className={`pro-tab-item ${activeTab === tab.id ? "active" : ""}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span>{tab.label}</span>
                                <span className="pro-tab-count">{tab.count}</span>
                            </button>
                        ))}
                    </div>

                    <div className="pro-search-row">
                        <div className="pro-search-input">
                            <FiSearch className="srch-icon" />
                            <input
                                type="text"
                                placeholder="Search by customer, phone, brand..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button className="clear-srch" onClick={() => setSearchQuery("")}>
                                    <FiX />
                                </button>
                            )}
                        </div>

                        <div className="view-toggle">
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

                {/* Full-Width Assigned Pickups Panel */}
                <div className="agent-panel-card">
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
                            /* Professional White Cards Grid */
                            <div className="pro-cards-grid">
                                {filteredPickups.map((item) => {
                                    const statusLower = (item.status || "").toLowerCase();
                                    const isExpired = statusLower === "expired" || statusLower === "rejected" || statusLower === "declined" || statusLower === "cancelled" || statusLower === "failed";
                                    const isPending = !isExpired && (statusLower === "assigned" || statusLower === "pending");
                                    const isAccepted = !isExpired && statusLower === "accepted";
                                    const isEnRoute = !isExpired && (statusLower === "pickupstarted" || statusLower === "en route");

                                    return (
                                        <div key={item.collectionAssignmentId || item.id} className={`pro-pickup-card ${isExpired ? "pro-pickup-card--expired" : ""}`}>
                                            {/* Card Header Row with Route Badge on Left and Status on Right */}
                                            <div className="pro-card-header">
                                                <div>
                                                    {item.assignmentType === "TechnicianToRefurbishmentCenter" ? (
                                                        <span className="t-route-chip refurb">Tech ➔ Refurbisher</span>
                                                    ) : item.assignmentType === "TechnicianToRecyclingCenter" ? (
                                                        <span className="t-route-chip recycler">Tech ➔ Recycler</span>
                                                    ) : (item.assignmentType === "TechnicianToTechnician" || item.isReassignedFromTech || item.isReassignmentPickup) ? (
                                                        <span className="t-route-chip tech">Tech ➔ Tech</span>
                                                    ) : (
                                                        <span className="t-route-chip citizen">Citizen ➔ Tech</span>
                                                    )}
                                                </div>
                                                <div style={{ flexShrink: 0 }}>
                                                    {getStatusBadge(item)}
                                                </div>
                                            </div>

                                            {/* Item Title & Tags */}
                                            <div className="pro-card-body">
                                                <h3 className="pro-item-title">
                                                    {getDeviceTitle(item)}
                                                </h3>
                                                <div className="pro-tags-wrap">
                                                    <span className="pro-tag category">{item.categoryName || "E-Waste"}</span>
                                                    <span className="pro-tag qty">Qty: {item.quantity || 1}</span>
                                                    {item.condition && (
                                                        <span className="pro-tag condition">{item.condition}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Route Details - based on assignmentType */}
                                            <div className="pro-card-details">
                                                {item.assignmentType === "TechnicianToRefurbishmentCenter" ? (
                                                    <>
                                                        <div className="pro-info-row">
                                                            <FiUser className="icn" />
                                                            <span className="bold-txt" style={{ color: "#7e22ce" }}>Collect From: {item.technicianName || item.inspectionCenterName || "Technician Hub"}</span>
                                                        </div>
                                                        {item.technicianPhone && (
                                                            <div className="pro-info-row">
                                                                <FiPhoneCall className="icn" />
                                                                <a href={`tel:${item.technicianPhone}`} className="tel-link">{item.technicianPhone}</a>
                                                            </div>
                                                        )}
                                                        <div className="pro-info-row">
                                                            <FiMapPin className="icn pin" />
                                                            <span className="addr-txt">{item.deliveredAddress || item.technicianAddress || "Inspection Center Address"}</span>
                                                        </div>
                                                        <div className="pro-info-row delivery-row">
                                                            <FiTruck className="icn delivery-icn" />
                                                            <span className="delivery-txt"><strong>Deliver To:</strong> {item.refurbishmentCenterName || "Refurbishment Center"}</span>
                                                        </div>
                                                    </>
                                                ) : item.assignmentType === "TechnicianToRecyclingCenter" ? (
                                                    <>
                                                        <div className="pro-info-row">
                                                            <FiUser className="icn" />
                                                            <span className="bold-txt" style={{ color: "#0369a1" }}>Collect From: {item.technicianName || item.inspectionCenterName || "Technician Hub"}</span>
                                                        </div>
                                                        {item.technicianPhone && (
                                                            <div className="pro-info-row">
                                                                <FiPhoneCall className="icn" />
                                                                <a href={`tel:${item.technicianPhone}`} className="tel-link">{item.technicianPhone}</a>
                                                            </div>
                                                        )}
                                                        <div className="pro-info-row">
                                                            <FiMapPin className="icn pin" />
                                                            <span className="addr-txt">{item.deliveredAddress || item.technicianAddress || "Inspection Center Address"}</span>
                                                        </div>
                                                        <div className="pro-info-row delivery-row">
                                                            <FiTruck className="icn delivery-icn" />
                                                            <span className="delivery-txt"><strong>Deliver To:</strong> {item.recyclingCenterName || "Recycling Center"}</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="pro-info-row">
                                                            <FiUser className="icn" />
                                                            <span className="bold-txt">{item.customerName || "Citizen Customer"}</span>
                                                        </div>
                                                        {item.customerPhone && (
                                                            <div className="pro-info-row">
                                                                <FiPhoneCall className="icn" />
                                                                <a href={`tel:${item.customerPhone}`} className="tel-link">{item.customerPhone}</a>
                                                            </div>
                                                        )}
                                                        <div className="pro-info-row">
                                                            <FiMapPin className="icn pin" />
                                                            <span className="addr-txt">{item.address || "Address N/A"}{item.city ? `, ${item.city}` : ""} {item.pincode ? `(${item.pincode})` : ""}</span>
                                                        </div>
                                                        {(item.technicianName || item.inspectionCenterName) && (
                                                            <div className="pro-info-row delivery-row">
                                                                <FiTruck className="icn delivery-icn" />
                                                                <span className="delivery-txt"><strong>Deliver To:</strong> {item.technicianName || "Inspection Tech"} ({item.inspectionCenterName || item.technicianCenterName || "Hub"})</span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                <div className="pro-info-row">
                                                    <FiCalendar className="icn" />
                                                    <span>Pickup: {formatScheduleTime(item)}</span>
                                                </div>

                                                {item.completionDeadline && (statusLower === "accepted" || statusLower === "pickupstarted" || statusLower === "en route" || statusLower === "pickedup") && (() => {
                                                    const isOverdue = new Date(item.completionDeadline) < new Date();
                                                    return (
                                                        <div style={{
                                                            fontSize: "0.76rem",
                                                            color: isOverdue ? "#b91c1c" : "#0369a1",
                                                            background: isOverdue ? "#fef2f2" : "#f0f9ff",
                                                            border: isOverdue ? "1px solid #fecdd3" : "1px solid #bae6fd",
                                                            padding: "0.35rem 0.55rem",
                                                            borderRadius: "6px",
                                                            marginTop: "0.45rem",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            gap: "0.3rem"
                                                        }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                <FiClock style={{ color: isOverdue ? "#e11d48" : "#0284c7", flexShrink: 0 }} />
                                                                <span><strong>Deadline:</strong> {new Date(item.completionDeadline).toLocaleDateString()}</span>
                                                            </div>
                                                            <span style={{
                                                                fontSize: "0.68rem",
                                                                fontWeight: 800,
                                                                background: isOverdue ? "#fee2e2" : "#e0f2fe",
                                                                color: isOverdue ? "#991b1b" : "#0369a1",
                                                                padding: "0.1rem 0.4rem",
                                                                borderRadius: "4px",
                                                                flexShrink: 0
                                                            }}>
                                                                {isOverdue ? "Overdue" : "5-Day SLA"}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Properly Aligned Action Buttons */}
                                            <div className="pro-card-actions">
                                                {isExpired ? (
                                                    <div className="status-expired-pill" style={{ flex: "1 1 auto" }}>
                                                        <FiAlertTriangle /> Expired / Cancelled
                                                    </div>
                                                ) : isPending ? (
                                                    <button
                                                        className="btn-pro-accept"
                                                        disabled={processingId === item.collectionAssignmentId}
                                                        onClick={() => handleAccept(item.collectionAssignmentId)}
                                                    >
                                                        <FiCheck /> Accept Task
                                                    </button>
                                                ) : isAccepted ? (
                                                    <button
                                                        className="btn-pro-start"
                                                        disabled={processingId === item.collectionAssignmentId}
                                                        onClick={() => handleStartPickup(item.collectionAssignmentId)}
                                                    >
                                                        <FiTruck /> Start Pickup
                                                    </button>
                                                ) : isEnRoute ? (
                                                    <div className="btn-pro-enroute" style={{ flex: "1 1 auto" }}>
                                                        <FiTruck /> En Route
                                                    </div>
                                                ) : null}

                                                <button
                                                    className="btn-pro-details"
                                                    onClick={() => setSelectedPickup(item)}
                                                >
                                                    <FiInfo /> Details
                                                </button>

                                                {!isExpired && (item.customerPhone || item.technicianPhone) && (
                                                    <a
                                                        href={`tel:${item.customerPhone || item.technicianPhone}`}
                                                        className="btn-pro-call"
                                                        title="Call"
                                                    >
                                                        <FiPhoneCall />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                        <div className="pro-table-wrapper">
                            <table className="pro-pickups-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "9%" }}>Task</th>
                                        <th style={{ width: "23%" }}>E-Waste Item</th>
                                        <th style={{ width: "18%" }}>Customer / Route</th>
                                        <th style={{ width: "20%" }}>Pickup Location</th>
                                        <th style={{ width: "15%" }}>Scheduled Slot</th>
                                        <th style={{ width: "10%" }}>Status</th>
                                        <th style={{ width: "5%", textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPickups.map((item, index) => {
                                        const statusLower = (item.status || "").toLowerCase();
                                        const isExpired = statusLower === "expired" || statusLower === "rejected" || statusLower === "declined" || statusLower === "cancelled" || statusLower === "failed";
                                        const isPending = !isExpired && (statusLower === "assigned" || statusLower === "pending");
                                        const isAccepted = !isExpired && statusLower === "accepted";
                                        const isEnRoute = !isExpired && (statusLower === "pickupstarted" || statusLower === "en route");

                                        return (
                                            <tr key={item.collectionAssignmentId} className={isExpired ? "table-row-expired" : ""}>
                                                <td className="t-task-id">
                                                    <div className="t-task-col-wrapper">
                                                        <span className="t-id-badge">{index + 1}</span>
                                                        {item.assignmentType === "TechnicianToRefurbishmentCenter" ? (
                                                            <span className="t-route-chip refurb">Tech ➔ Refurbisher</span>
                                                        ) : item.assignmentType === "TechnicianToRecyclingCenter" ? (
                                                            <span className="t-route-chip recycler">Tech ➔ Recycler</span>
                                                        ) : (item.assignmentType === "TechnicianToTechnician" || item.isReassignedFromTech || item.isReassignmentPickup) ? (
                                                            <span className="t-route-chip tech">Tech ➔ Tech</span>
                                                        ) : (
                                                            <span className="t-route-chip citizen">Citizen ➔ Tech</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="t-item-title">{getDeviceTitle(item)}</div>
                                                    <div className="t-item-tags">
                                                        <span className="t-tag category">{item.categoryName || "E-Waste"}</span>
                                                        <span className="t-tag qty">Qty: {item.quantity || 1}</span>
                                                        {item.condition && <span className="t-tag condition">{item.condition}</span>}
                                                    </div>
                                                </td>
                                                <td>
                                                    {item.assignmentType === "TechnicianToRefurbishmentCenter" ? (
                                                        <div className="t-cust-box">
                                                            <div className="t-cust-name tech-refurb">{item.technicianName || item.inspectionCenterName || "Technician Hub"}</div>
                                                            {item.technicianPhone && <a href={`tel:${item.technicianPhone}`} className="t-cust-phone"><FiPhoneCall /> {item.technicianPhone}</a>}
                                                            <div className="t-dest-label">➔ {item.refurbishmentCenterName || "Refurbishment Center"}</div>
                                                        </div>
                                                    ) : item.assignmentType === "TechnicianToRecyclingCenter" ? (
                                                        <div className="t-cust-box">
                                                            <div className="t-cust-name tech-recycle">{item.technicianName || item.inspectionCenterName || "Technician Hub"}</div>
                                                            {item.technicianPhone && <a href={`tel:${item.technicianPhone}`} className="t-cust-phone"><FiPhoneCall /> {item.technicianPhone}</a>}
                                                            <div className="t-dest-label">➔ {item.recyclingCenterName || "Recycling Center"}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="t-cust-box">
                                                            <div className="t-cust-name">{item.customerName || "Citizen"}</div>
                                                            {item.customerPhone && <a href={`tel:${item.customerPhone}`} className="t-cust-phone"><FiPhoneCall /> {item.customerPhone}</a>}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="t-address-wrap">
                                                        <FiMapPin className="t-pin-icn" />
                                                        <span className="t-addr-txt">
                                                            {(item.assignmentType === "TechnicianToRefurbishmentCenter" || item.assignmentType === "TechnicianToRecyclingCenter")
                                                                ? (item.deliveredAddress || item.technicianAddress || "Inspection Center Address")
                                                                : `${item.address || "Address N/A"}${item.city ? `, ${item.city}` : ""}`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="t-date-badge">
                                                        <FiCalendar className="t-cal-icn" />
                                                        <span>{formatScheduleTime(item)}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {getStatusBadge(item)}
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div className="t-actions">
                                                        {isPending && (
                                                            <button
                                                                className="btn-pro-accept sm"
                                                                disabled={processingId === item.collectionAssignmentId}
                                                                onClick={() => handleAccept(item.collectionAssignmentId)}
                                                            >
                                                                <FiCheck /> Accept
                                                            </button>
                                                        )}
                                                        {isAccepted && (
                                                            <button
                                                                className="btn-pro-start sm"
                                                                disabled={processingId === item.collectionAssignmentId}
                                                                onClick={() => handleStartPickup(item.collectionAssignmentId)}
                                                            >
                                                                <FiTruck /> Start
                                                            </button>
                                                        )}
                                                        {isEnRoute && (
                                                            <div className="btn-pro-enroute sm">
                                                                <FiTruck /> En Route
                                                            </div>
                                                        )}
                                                        {isPending && (
                                                            <button
                                                                type="button"
                                                                className="btn-pro-details sm"
                                                                style={{ color: "#dc2626", borderColor: "#fecaca" }}
                                                                onClick={() => setRejectionTarget(item)}
                                                                disabled={processingId === item.collectionAssignmentId}
                                                            >
                                                                <FiX /> Decline
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn-pro-details sm"
                                                            onClick={() => setSelectedPickup(item)}
                                                        >
                                                            <FiInfo /> Details
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
                </div>
            </main>

            {/* Task Details Modal (Matching Pickups.jsx) */}
            {selectedPickup && (
                <div className="pro-modal-overlay" onClick={() => setSelectedPickup(null)}>
                    <div className="pro-modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="pro-modal-header">
                            <div>
                                <h2>Details</h2>
                                <span className="sub-txt">Collection Assignment</span>
                            </div>
                            <button className="pro-close-btn" onClick={() => setSelectedPickup(null)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="pro-modal-body">
                            {selectedPickup.completionDeadline && (
                                <div style={{
                                    background: "#f0fdf4",
                                    border: "1px solid #bbf7d0",
                                    padding: "0.65rem 0.85rem",
                                    borderRadius: "9px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "0.85rem",
                                    flexWrap: "wrap",
                                    gap: "0.4rem"
                                }}>
                                    <div>
                                        <div style={{ fontSize: "0.675rem", fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                            Logistics Completion Deadline
                                        </div>
                                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#14532d", marginTop: "0.1rem" }}>
                                            Must be delivered by: {new Date(selectedPickup.completionDeadline).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <span style={{ background: "#dcfce7", color: "#15803d", fontWeight: 800, fontSize: "0.7rem", padding: "0.2rem 0.55rem", borderRadius: "10px", border: "1px solid #86efac" }}>
                                        5-Day Completion SLA
                                    </span>
                                </div>
                            )}

                            {/* COLLECT FROM -> DELIVER TO ROUTING FLOW */}
                            <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "11px", border: "1px solid #e2e8f0", marginBottom: "0.85rem" }}>
                                {selectedPickup.assignmentType === "TechnicianToRefurbishmentCenter" ? (
                                    <>
                                        <div style={{ background: "#f3e8ff", border: "1px solid #d8b4fe", padding: "0.75rem", borderRadius: "9px" }}>
                                            <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#7e22ce", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                COLLECT FROM (TECHNICIAN HUB)
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#581c87", fontSize: "0.825rem", marginTop: "0.15rem" }}>
                                                Technician / Hub: {selectedPickup.technicianName || selectedPickup.inspectionCenterName || "Inspection Technician"} {selectedPickup.technicianPhone ? `(Ph: ${selectedPickup.technicianPhone})` : ""}
                                            </div>
                                            <div style={{ color: "#7e22ce", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                                                <strong>Inspection Center address:</strong> {selectedPickup.deliveredAddress || selectedPickup.technicianAddress || "EcoCycle Central Inspection Center"}
                                            </div>
                                            <div style={{ color: "#9333ea", fontSize: "0.725rem", marginTop: "0.15rem" }}>
                                                <strong>Pickup date / time slot:</strong> {selectedPickup.pickupDate ? new Date(selectedPickup.pickupDate).toLocaleDateString() : "Scheduled"} • {selectedPickup.timeSlot || "Standard Slot"}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: "center", fontSize: "1.1rem", fontWeight: 800, color: "#9333ea", margin: "0.25rem 0" }}>
                                            ↓
                                        </div>

                                        <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", padding: "0.75rem", borderRadius: "9px" }}>
                                            <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#6b21a8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                DELIVER TO (REFURBISHMENT CENTER)
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#3b0764", fontSize: "0.825rem", marginTop: "0.15rem" }}>
                                                Facility: {selectedPickup.refurbishmentCenterName || "Refurbishment Center"} {selectedPickup.refurbishmentCenterPhone ? `(Ph: ${selectedPickup.refurbishmentCenterPhone})` : ""}
                                            </div>
                                            {selectedPickup.refurbishmentCenterOwner && (
                                                <div style={{ color: "#581c87", fontSize: "0.75rem", marginTop: "0.1rem" }}>
                                                    <strong>Contact Person:</strong> {selectedPickup.refurbishmentCenterOwner}
                                                </div>
                                            )}
                                            <div style={{ color: "#6b21a8", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                                                <strong>Refurbishment Center address:</strong> {selectedPickup.refurbishmentCenterAddress || selectedPickup.deliveredAddress || "Refurbishment Center Address"}
                                            </div>
                                        </div>
                                    </>
                                ) : selectedPickup.assignmentType === "TechnicianToRecyclingCenter" ? (
                                    <>
                                        <div style={{ background: "#e0f2fe", border: "1px solid #bae6fd", padding: "0.75rem", borderRadius: "9px" }}>
                                            <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                COLLECT FROM (TECHNICIAN HUB)
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#0c4a6e", fontSize: "0.825rem", marginTop: "0.15rem" }}>
                                                Technician / Hub: {selectedPickup.technicianName || selectedPickup.inspectionCenterName || "Inspection Technician"} {selectedPickup.technicianPhone ? `(Ph: ${selectedPickup.technicianPhone})` : ""}
                                            </div>
                                            <div style={{ color: "#0369a1", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                                                <strong>Inspection Center address:</strong> {selectedPickup.deliveredAddress || selectedPickup.technicianAddress || "EcoCycle Central Inspection Center"}
                                            </div>
                                            <div style={{ color: "#0284c7", fontSize: "0.725rem", marginTop: "0.15rem" }}>
                                                <strong>Pickup date / time slot:</strong> {selectedPickup.pickupDate ? new Date(selectedPickup.pickupDate).toLocaleDateString() : "Scheduled"} • {selectedPickup.timeSlot || "Standard Slot"}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: "center", fontSize: "1.1rem", fontWeight: 800, color: "#0284c7", margin: "0.25rem 0" }}>
                                            ↓
                                        </div>

                                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.75rem", borderRadius: "9px" }}>
                                            <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                DELIVER TO (RECYCLING CENTER)
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#14532d", fontSize: "0.825rem", marginTop: "0.15rem" }}>
                                                Facility: {selectedPickup.recyclingCenterName || "Recycling Facility"} {selectedPickup.recyclingCenterPhone ? `(Ph: ${selectedPickup.recyclingCenterPhone})` : ""}
                                            </div>
                                            {selectedPickup.recyclingCenterOwner && (
                                                <div style={{ color: "#166534", fontSize: "0.75rem", marginTop: "0.1rem" }}>
                                                    <strong>Contact Person:</strong> {selectedPickup.recyclingCenterOwner}
                                                </div>
                                            )}
                                            <div style={{ color: "#15803d", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                                                <strong>Recycling Center address:</strong> {selectedPickup.recyclingCenterAddress || selectedPickup.deliveredAddress || "Recycling Facility Address"}
                                            </div>
                                        </div>
                                    </>
                                ) : (selectedPickup.assignmentType === "TechnicianToTechnician" || selectedPickup.isReassignedFromTech || selectedPickup.isReassignmentPickup) ? (
                                    <>
                                        <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", padding: "0.75rem", borderRadius: "9px" }}>
                                            <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                COLLECT FROM (PENALIZED TECHNICIAN CENTER)
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#9a3412", fontSize: "0.825rem", marginTop: "0.15rem" }}>
                                                Technician / Hub: {selectedPickup.customerName || selectedPickup.priorTechnicianName || "Penalized Hub"} {selectedPickup.customerPhone ? `(Ph: ${selectedPickup.customerPhone})` : ""}
                                            </div>
                                            <div style={{ color: "#c2410c", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                                                <strong>Penalized Center address:</strong> {selectedPickup.address}
                                                {selectedPickup.landmark && ` (Landmark: ${selectedPickup.landmark})`}
                                                {[selectedPickup.city, selectedPickup.district, selectedPickup.state, selectedPickup.pincode].filter(Boolean).length > 0 &&
                                                    `, ${[selectedPickup.city, selectedPickup.district, selectedPickup.state, selectedPickup.pincode].filter(Boolean).join(", ")}`}
                                            </div>
                                            <div style={{ color: "#ea580c", fontSize: "0.725rem", marginTop: "0.15rem" }}>
                                                <strong>Pickup date / time slot:</strong> {selectedPickup.pickupDate ? new Date(selectedPickup.pickupDate).toLocaleDateString() : "Scheduled"} • {selectedPickup.timeSlot || "Standard Slot"}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: "center", fontSize: "1.1rem", fontWeight: 800, color: "#ea580c", margin: "0.25rem 0" }}>
                                            ↓
                                        </div>

                                        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.75rem", borderRadius: "9px" }}>
                                            <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                DELIVER TO (NEW INSPECTION HUB)
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#1e40af", fontSize: "0.825rem", marginTop: "0.15rem" }}>
                                                Technician / Inspection Center: {selectedPickup.technicianName || "Inspection Technician"} ({selectedPickup.inspectionCenterName || selectedPickup.technicianCenterName || "EcoCycle Central Inspection Hub"}) {selectedPickup.technicianPhone ? `(Ph: ${selectedPickup.technicianPhone})` : ""}
                                            </div>
                                            <div style={{ color: "#1e3a8a", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                                                <strong>Technician/center address:</strong> {selectedPickup.deliveredAddress || selectedPickup.technicianAddress || "EcoCycle Central E-Waste Facility & Inspection Hub"}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.75rem", borderRadius: "9px" }}>
                                            <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#047857", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                COLLECT FROM (CITIZEN)
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#065f46", fontSize: "0.825rem", marginTop: "0.15rem" }}>
                                                Customer: {formatName(selectedPickup.customerName)} (Ph: {selectedPickup.customerPhone || "N/A"})
                                            </div>
                                            <div style={{ color: "#047857", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                                                <strong>Customer pickup address:</strong> {selectedPickup.address}
                                                {selectedPickup.landmark && ` (Landmark: ${selectedPickup.landmark})`}
                                                {[selectedPickup.city, selectedPickup.district, selectedPickup.state, selectedPickup.pincode].filter(Boolean).length > 0 &&
                                                    `, ${[selectedPickup.city, selectedPickup.district, selectedPickup.state, selectedPickup.pincode].filter(Boolean).join(", ")}`}
                                            </div>
                                            <div style={{ color: "#059669", fontSize: "0.725rem", marginTop: "0.15rem" }}>
                                                <strong>Pickup date / time slot:</strong> {selectedPickup.pickupDate ? new Date(selectedPickup.pickupDate).toLocaleDateString() : "Scheduled"} • {selectedPickup.timeSlot || "Standard Slot"}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: "center", fontSize: "1.1rem", fontWeight: 800, color: "#059669", margin: "0.25rem 0" }}>
                                            ↓
                                        </div>

                                        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.75rem", borderRadius: "9px" }}>
                                            <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                DELIVER TO (INSPECTION HUB)
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#1e40af", fontSize: "0.825rem", marginTop: "0.15rem" }}>
                                                Technician / Inspection Center: {selectedPickup.technicianName || "Inspection Technician"} ({selectedPickup.inspectionCenterName || selectedPickup.technicianCenterName || "EcoCycle Central Inspection Hub"}) {selectedPickup.technicianPhone ? `(Ph: ${selectedPickup.technicianPhone})` : ""}
                                            </div>
                                            <div style={{ color: "#1e3a8a", fontSize: "0.75rem", marginTop: "0.15rem" }}>
                                                <strong>Technician/center address:</strong> {selectedPickup.deliveredAddress || selectedPickup.technicianAddress || "EcoCycle Central E-Waste Facility & Inspection Hub"}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Device Info */}
                            <div className="pro-section-box">
                                <h4 className="sec-heading"><FiPackage /> E-Waste Specifications</h4>
                                <div className="sec-grid">
                                    <div className="sec-item">
                                        <span className="lbl">Brand & Model</span>
                                        <span className="val">{selectedPickup.brand} {selectedPickup.model}</span>
                                    </div>
                                    <div className="sec-item">
                                        <span className="lbl">Category</span>
                                        <span className="val">{selectedPickup.categoryName}</span>
                                    </div>
                                    <div className="sec-item">
                                        <span className="lbl">Quantity</span>
                                        <span className="val">{selectedPickup.quantity || 1} Unit(s)</span>
                                    </div>
                                    <div className="sec-item">
                                        <span className="lbl">Condition</span>
                                        <span className="val">{selectedPickup.condition || "Standard"}</span>
                                    </div>
                                    <div className="sec-item">
                                        <span className="lbl">Functional</span>
                                        <span className="val">{selectedPickup.working ? "Yes (Working)" : "Non-Functional / E-Waste"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pro-modal-footer">
                            {selectedPickup.customerPhone && (
                                <a href={`tel:${selectedPickup.customerPhone}`} className="btn-call-modal">
                                    <FiPhoneCall /> Call Customer
                                </a>
                            )}
                            <button className="btn-close-modal" onClick={() => setSelectedPickup(null)}>
                                Close
                            </button>
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
                                        Date: <strong>{todaysReminder?.date ? new Date(todaysReminder.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong> &bull; Total Scheduled: <strong>{reminderList.length} Pickups</strong>
                                    </p>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setShowReminderModal(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="reminder-modal-body">
                            {reminderList.length > 0 ? (
                                <>
                                    <div className="reminder-alert-banner">
                                        <FiAlertCircle className="reminder-alert-icon" />
                                        <span>
                                            You have <strong>{reminderList.length}</strong> pickup assignment(s) scheduled for today. Please review the details below before heading out!
                                        </span>
                                    </div>

                                    <div className="reminder-pickups-list">
                                        {reminderList.map((pickup, idx) => (
                                            <div key={pickup.assignmentId || idx} className="reminder-pickup-card" style={{ border: pickup.extensionCount > 0 ? "1.5px solid #f59e0b" : "1px solid #e2e8f0" }}>
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
                                                        <FiCalendar className="item-icn" />
                                                        <div>
                                                            <div className="item-lbl">Scheduled Date</div>
                                                            <div className="item-val">
                                                                {pickup.pickupDate
                                                                    ? new Date(pickup.pickupDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                                                    : todaysReminder?.date
                                                                    ? new Date(todaysReminder.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                                                                    : "Scheduled Today"}
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