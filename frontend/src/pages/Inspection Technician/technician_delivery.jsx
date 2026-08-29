import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiTruck,
    FiCheckCircle,
    FiClock,
    FiUser,
    FiPhone,
    FiBell,
    FiSearch,
    FiGrid,
    FiList,
    FiCpu,
    FiSmartphone,
    FiBatteryCharging,
    FiTv,
    FiBox,
    FiMapPin,
    FiInfo,
    FiX,
    FiAlertCircle,
    FiNavigation,
    FiShield,
    FiRefreshCw
} from "react-icons/fi";
import "./technician_delivery.css";

function TechnicianDelivery() {
    const navigate = useNavigate();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    // Profile info from localStorage
    const techName = localStorage.getItem("firstName") ||
                     localStorage.getItem("userName") ||
                     localStorage.getItem("username") ||
                     localStorage.getItem("name") ||
                     "Inspection Officer";

    const userInitial = techName.charAt(0).toUpperCase();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found, redirecting to login.");
            navigate("/");
            return;
        }
        fetchMyDeliveries(token);
        fetchNotifications(token);
    }, [navigate]);

    const fetchMyDeliveries = async (token) => {
        const authToken = token || localStorage.getItem("token");
        if (!authToken) return;
        try {
            setLoading(true);
            const response = await axios.get("https://localhost:7102/api/Inspection/my-deliveries", {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setDeliveries(response.data || []);
        } catch (err) {
            console.error("Error fetching technician deliveries:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async (token) => {
        const authToken = token || localStorage.getItem("token");
        if (!authToken) return;
        try {
            const response = await axios.get("https://localhost:7102/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setNotifications(response.data || []);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    };

    const markAllNotificationsAsRead = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.get("https://localhost:7102/api/Notificationcon/mark_asread", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true, isread: true })));
        } catch (err) {
            console.error("Error marking notifications read:", err);
        }
    };

    // KPI Metrics calculation
    const inTransitCount = deliveries.filter(d => {
        const cas = String(d.status || "").toLowerCase();
        const delStat = String(d.deliveryStatus || "").toLowerCase();
        return cas === "outfordelivery" || delStat === "intransit" || cas === "pickupstarted";
    }).length;

    const deliveredCount = deliveries.filter(d => {
        const cas = String(d.status || "").toLowerCase();
        const delStat = String(d.deliveryStatus || "").toLowerCase();
        return cas === "deliveredtocenter" || delStat === "delivered";
    }).length;

    const scheduledCount = deliveries.filter(d => {
        const cas = String(d.status || "").toLowerCase();
        return cas === "scheduled" || cas === "assigned" || cas === "accepted";
    }).length;

    const totalWeight = deliveries.reduce((sum, d) => sum + ((Number(d.weight) || 0) * (Number(d.quantity) || 1)), 0);

    // Tab & Search Filtered Deliveries
    const filteredDeliveries = deliveries.filter(item => {
        const cas = String(item.status || "").toLowerCase();
        const delStat = String(item.deliveryStatus || "").toLowerCase();

        if (activeTab === "InTransit" && cas !== "outfordelivery" && delStat !== "intransit" && cas !== "pickupstarted") return false;
        if (activeTab === "Delivered" && cas !== "deliveredtocenter" && delStat !== "delivered") return false;
        if (activeTab === "Scheduled" && cas !== "scheduled" && cas !== "assigned" && cas !== "accepted") return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const devName = `${item.brand || ""} ${item.model || ""}`.toLowerCase();
        const catName = String(item.categoryName || "").toLowerCase();
        const agentName = String(item.collectionAgentName || "").toLowerCase();
        const customer = String(item.customerName || "").toLowerCase();
        const address = String(item.address || "").toLowerCase();

        return (
            devName.includes(q) ||
            catName.includes(q) ||
            agentName.includes(q) ||
            customer.includes(q) ||
            address.includes(q)
        );
    });

    const getCategoryIcon = (categoryName) => {
        const cat = (categoryName || "").toLowerCase();
        if (cat.includes("computer") || cat.includes("laptop")) return <FiCpu />;
        if (cat.includes("mobile") || cat.includes("phone")) return <FiSmartphone />;
        if (cat.includes("battery") || cat.includes("power")) return <FiBatteryCharging />;
        if (cat.includes("appliance") || cat.includes("tv")) return <FiTv />;
        return <FiBox />;
    };

    const getStatusBadge = (item) => {
        const cas = String(item.status || "").toLowerCase();
        const delStat = String(item.deliveryStatus || "").toLowerCase();

        const badgeStyle = {
            padding: "0.35rem 0.75rem",
            fontSize: "0.775rem",
            fontWeight: 700,
            borderRadius: "9999px",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            whiteSpace: "nowrap"
        };

        if (cas === "deliveredtocenter" || delStat === "delivered") {
            return <span style={{ ...badgeStyle, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}><FiCheckCircle /> Delivered to Center</span>;
        } else if (cas === "outfordelivery" || delStat === "intransit") {
            return <span style={{ ...badgeStyle, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}><FiTruck /> En Route to Center</span>;
        } else if (cas === "completed" || cas === "pickedup") {
            return <span style={{ ...badgeStyle, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}><FiCheckCircle /> Pickup Completed</span>;
        } else if (cas === "pickupstarted" || cas === "en route") {
            return <span style={{ ...badgeStyle, background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}><FiTruck /> Agent Pickup Started</span>;
        } else {
            return <span style={{ ...badgeStyle, background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}><FiClock /> Scheduled</span>;
        }
    };

    const getAgentPhoto = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith("http") || photoPath.startsWith("data:")) return photoPath;
        return `https://localhost:7102/uploads/profile/${photoPath}`;
    };

    const unreadNotifCount = notifications.filter(n => !(n.isRead || n.isread)).length;

    return (
        <div className="tech-delivery-page">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="tech-main-container">
                {/* Header Top Bar */}
                <div className="tech-header-bar">
                    

                    <div className="tech-header-actions">
                        <button
                            className="tech-refresh-btn"
                            onClick={() => fetchMyDeliveries()}
                            title="Sync live delivery feed"
                        >
                            <FiRefreshCw /> Refresh Feed
                        </button>

                        {/* Notification Bell Dropdown */}
                        <div style={{ position: "relative" }}>
                            <button
                                style={{
                                    background: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "14px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#475569",
                                    fontSize: "1.2rem",
                                    cursor: "pointer",
                                    position: "relative",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                                }}
                                onClick={() => {
                                    setShowNotifDropdown(!showNotifDropdown);
                                    if (!showNotifDropdown && unreadNotifCount > 0) {
                                        markAllNotificationsAsRead();
                                    }
                                }}
                            >
                                <FiBell />
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
                                        justifyContent: "center",
                                        border: "2px solid #ffffff"
                                    }}>
                                        {unreadNotifCount}
                                    </span>
                                )}
                            </button>

                            {showNotifDropdown && (
                                <div style={{
                                    position: "absolute",
                                    right: 0,
                                    top: "52px",
                                    width: "330px",
                                    background: "#ffffff",
                                    borderRadius: "18px",
                                    boxShadow: "0 14px 36px rgba(0,0,0,0.14)",
                                    border: "1px solid #e2e8f0",
                                    zIndex: 100,
                                    padding: "1.1rem"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.55rem" }}>
                                        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>Delivery Notices</h4>
                                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>{notifications.length} Total</span>
                                    </div>
                                    <div style={{ maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                        {notifications.length === 0 ? (
                                            <p style={{ fontSize: "0.825rem", color: "#64748b", textAlign: "center", margin: "1rem 0" }}>No notifications yet.</p>
                                        ) : (
                                            notifications.map((n, idx) => (
                                                <div key={idx} style={{ padding: "0.65rem 0.8rem", background: "#f8fafc", borderRadius: "12px", borderLeft: "3px solid #059669" }}>
                                                    <div style={{ fontSize: "0.825rem", fontWeight: 800, color: "#0f172a" }}>{n.title || n.Title || "Notification"}</div>
                                                    <div style={{ fontSize: "0.775rem", color: "#475569", marginTop: "0.2rem", lineHeight: 1.4 }}>{n.message || n.Message}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Profile Avatar */}
                        <div className="tech-user-avatar">
                            {userInitial}
                        </div>
                    </div>
                </div>

                {/* KPI Summary Cards Grid */}
                <div className="tech-kpi-grid">
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon all"><FiBox /></div>
                        <div className="tech-kpi-info">
                            <h3>{deliveries.length}</h3>
                            <p>Assigned Deliveries</p>
                        </div>
                    </div>

                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon transit"><FiTruck /></div>
                        <div className="tech-kpi-info">
                            <h3>{inTransitCount}</h3>
                            <p>En Route (In Transit)</p>
                        </div>
                    </div>

                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon delivered"><FiCheckCircle /></div>
                        <div className="tech-kpi-info">
                            <h3>{deliveredCount}</h3>
                            <p>Delivered to Center</p>
                        </div>
                    </div>

                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon weight"><FiShield /></div>
                        <div className="tech-kpi-info">
                            <h3>{totalWeight.toFixed(1)} kg</h3>
                            <p>Total E-Waste Weight</p>
                        </div>
                    </div>
                </div>

                {/* Filter & Control Bar */}
                <div className="tech-controls-bar">
                    <div className="tech-search-box">
                        <FiSearch style={{ color: "#94a3b8" }} />
                        <input
                            type="text"
                            placeholder="Search by device, agent, customer name or city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                                <FiX />
                            </button>
                        )}
                    </div>

                    <div className="tech-filter-tabs">
                        <button
                            className={`tech-tab-btn ${activeTab === "All" ? "active" : ""}`}
                            onClick={() => setActiveTab("All")}
                        >
                            All Shipments <span className="tech-badge-count">{deliveries.length}</span>
                        </button>
                        <button
                            className={`tech-tab-btn ${activeTab === "InTransit" ? "active" : ""}`}
                            onClick={() => setActiveTab("InTransit")}
                        >
                            En Route <span className="tech-badge-count">{inTransitCount}</span>
                        </button>
                        <button
                            className={`tech-tab-btn ${activeTab === "Delivered" ? "active" : ""}`}
                            onClick={() => setActiveTab("Delivered")}
                        >
                            Delivered <span className="tech-badge-count">{deliveredCount}</span>
                        </button>
                        <button
                            className={`tech-tab-btn ${activeTab === "Scheduled" ? "active" : ""}`}
                            onClick={() => setActiveTab("Scheduled")}
                        >
                            Scheduled <span className="tech-badge-count">{scheduledCount}</span>
                        </button>
                    </div>

                    <div className="tech-view-toggle">
                        <button
                            className={`tech-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                            onClick={() => setViewMode("grid")}
                            title="Grid View"
                        >
                            <FiGrid />
                        </button>
                        <button
                            className={`tech-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                            onClick={() => setViewMode("table")}
                            title="Table View"
                        >
                            <FiList />
                        </button>
                    </div>
                </div>

                {/* Content Area: Grid View or Table View */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "4rem 1rem", background: "#ffffff", borderRadius: "22px", border: "1px solid #e2e8f0" }}>
                        <FiTruck style={{ fontSize: "2.5rem", color: "#059669", animation: "spin 1.5s linear infinite" }} />
                        <p style={{ color: "#64748b", marginTop: "1rem", fontWeight: 700 }}>Syncing incoming delivery feed...</p>
                    </div>
                ) : filteredDeliveries.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "4rem 1rem", background: "#ffffff", borderRadius: "22px", border: "1px solid #e2e8f0" }}>
                        <FiBox style={{ fontSize: "3rem", color: "#cbd5e1" }} />
                        <h3 style={{ color: "#0f172a", marginTop: "1rem", fontWeight: 800 }}>No Deliveries Found</h3>
                        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No e-waste shipments match your current filter selection.</p>
                    </div>
                ) : viewMode === "grid" ? (
                    /* Grid Cards View */
                    <div className="tech-grid">
                        {filteredDeliveries.map((item) => (
                            <div key={item.deviceId} className="tech-card">
                                <div className="tech-card-header">
                                    <div className="tech-card-top-row">
                                        <div className="tech-cat-icon">
                                            {getCategoryIcon(item.categoryName)}
                                        </div>
                                        <div className="tech-badge-wrapper">
                                            {getStatusBadge(item)}
                                        </div>
                                    </div>
                                    <div className="tech-card-title-group">
                                        <h3 className="tech-card-brand-name">{item.brand} {item.model}</h3>
                                        <p className="tech-card-cat-name">{item.categoryName} &bull; {item.quantity || 1} Unit(s)</p>
                                    </div>
                                </div>

                                <div className="tech-card-body">
                                    {/* Collection Agent Info */}
                                    <div className="tech-agent-box">
                                        <div className="tech-agent-left">
                                            <div className="tech-agent-avatar">
                                                {item.collectionAgentPhoto ? (
                                                    <img src={getAgentPhoto(item.collectionAgentPhoto)} alt={item.collectionAgentName} />
                                                ) : (
                                                    (item.collectionAgentName || "A").charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <span className="tech-agent-name">{item.collectionAgentName || "Assigned Agent"}</span>
                                                <span className="tech-agent-sub">Collection Agent</span>
                                            </div>
                                        </div>

                                        {item.collectionAgentPhone && (
                                            <a href={`tel:${item.collectionAgentPhone}`} className="tech-btn-call" title="Call Collection Agent">
                                                <FiPhone />
                                            </a>
                                        )}
                                    </div>

                                    {/* Origin Customer Address Box */}
                                    <div className="tech-origin-box">
                                        <div><strong>Origin Customer:</strong> {item.customerName}</div>
                                        <div style={{ marginTop: "3px" }}><FiMapPin style={{ color: "#d97706", marginRight: "4px" }} /> {item.address || "Pickup address"}, {item.city}</div>
                                    </div>

                                    {/* Specs Pills */}
                                    <div className="tech-specs-row">
                                        <span className="tech-spec-tag">Weight: {item.weight || 1} kg</span>
                                        <span className="tech-spec-tag">Condition: {item.condition || "Standard"}</span>
                                        <span className="tech-spec-tag">{item.working ? "Working" : "Non-Functional"}</span>
                                    </div>
                                </div>

                                <div className="tech-card-footer">
                                    <button
                                        className="btn-tech-track"
                                        onClick={() => setSelectedDelivery(item)}
                                    >
                                        <FiNavigation /> Track Delivery
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Table View */
                    <div className="tech-table-wrapper">
                        <table className="tech-table">
                            <thead>
                                <tr>
                                    <th>Task / Device</th>
                                    <th>Category</th>
                                    <th>Collection Agent</th>
                                    <th>Origin Customer</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDeliveries.map((item) => (
                                    <tr key={item.deviceId}>
                                        <td>
                                            <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.brand} {item.model}</div>
                                            <div style={{ fontSize: "0.775rem", color: "#64748b" }}>Device #{item.deviceId}</div>
                                        </td>
                                        <td>{item.categoryName} ({item.quantity || 1} unit)</td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.collectionAgentName || "Assigned Agent"}</div>
                                            <div style={{ fontSize: "0.775rem", color: "#64748b" }}>{item.collectionAgentPhone}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.customerName}</div>
                                            <div style={{ fontSize: "0.775rem", color: "#64748b" }}>{item.city || item.address}</div>
                                        </td>
                                        <td>{getStatusBadge(item)}</td>
                                        <td>
                                            <button
                                                className="btn-tech-track"
                                                style={{ padding: "0.45rem 0.9rem", fontSize: "0.825rem" }}
                                                onClick={() => setSelectedDelivery(item)}
                                            >
                                                <FiNavigation /> Track
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delivery Tracking Modal Dialog */}
            {selectedDelivery && (
                <div className="tech-modal-overlay" onClick={() => setSelectedDelivery(null)}>
                    <div className="tech-modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="tech-modal-header">
                            <div className="tech-modal-title-box">
                                <h2>Delivery Tracking</h2>
                                <p className="tech-modal-subtitle">{selectedDelivery.brand} {selectedDelivery.model} &bull; {selectedDelivery.categoryName}</p>
                            </div>
                            <button className="btn-tech-close-modal" style={{ padding: "0.5rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedDelivery(null)}>
                                <FiX style={{ fontSize: "1.2rem" }} />
                            </button>
                        </div>

                        <div className="tech-modal-body">
                            {/* Live Delivery Progress Timeline */}
                            <div>
                                <div className="tech-timeline">
                                    <div className="tech-timeline-step completed">
                                        <div className="tech-timeline-node"><FiCheckCircle /></div>
                                        <div className="tech-timeline-content">
                                            <h5>1. Request Scheduled & Assigned</h5>
                                            <p>Customer created e-waste pickup request & assigned to collection agent {selectedDelivery.collectionAgentName}.</p>
                                        </div>
                                    </div>

                                    <div className={`tech-timeline-step ${["pickupstarted", "outfordelivery", "deliveredtocenter", "completed"].includes((selectedDelivery.status || "").toLowerCase()) ? "completed" : "active"}`}>
                                        <div className="tech-timeline-node"><FiTruck /></div>
                                        <div className="tech-timeline-content">
                                            <h5>2. Agent Pickup Started</h5>
                                            <p>Collection agent en route to customer pickup address.</p>
                                        </div>
                                    </div>

                                    <div className={`tech-timeline-step ${["completed", "outfordelivery", "deliveredtocenter"].includes((selectedDelivery.status || "").toLowerCase()) ? "completed" : ""}`}>
                                        <div className="tech-timeline-node"><FiCheckCircle /></div>
                                        <div className="tech-timeline-content">
                                            <h5>3. E-Waste Collected</h5>
                                            <p>Agent verified device specs with customer and confirmed pickup handover.</p>
                                        </div>
                                    </div>

                                    <div className={`tech-timeline-step ${["outfordelivery", "deliveredtocenter"].includes((selectedDelivery.status || "").toLowerCase()) || selectedDelivery.deliveryStatus === "InTransit" ? "active" : selectedDelivery.deliveryStatus === "Delivered" ? "completed" : ""}`}>
                                        <div className="tech-timeline-node"><FiNavigation /></div>
                                        <div className="tech-timeline-content">
                                            <h5>4. En Route to Inspection Center</h5>
                                            <p>Collection agent in transit to deliver e-waste to your inspection hub ({selectedDelivery.inspectionCenterName}).</p>
                                        </div>
                                    </div>

                                    <div className={`tech-timeline-step ${selectedDelivery.status === "DeliveredToCenter" || selectedDelivery.deliveryStatus === "Delivered" ? "completed" : ""}`}>
                                        <div className="tech-timeline-node"><FiCheckCircle /></div>
                                        <div className="tech-timeline-content">
                                            <h5>5. Delivered & Handover Verified</h5>
                                            <p>Technician verified 4-digit OTP email code and received device at inspection center.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Route Summary Box */}
                            <div className="tech-route-box">
                                <div className="tech-route-item">
                                    <FiMapPin style={{ color: "#ef4444", fontSize: "1.25rem", flexShrink: 0, marginTop: "2px" }} />
                                    <div>
                                        <div style={{ fontSize: "0.775rem", fontWeight: 800, color: "#64748b", letterSpacing: "0.03em" }}>ORIGIN (PICKUP ADDRESS)</div>
                                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>{selectedDelivery.customerName}</div>
                                        <div style={{ fontSize: "0.85rem", color: "#475569" }}>{selectedDelivery.address}, {selectedDelivery.city}</div>
                                    </div>
                                </div>

                                <div className="tech-route-item">
                                    <FiNavigation style={{ color: "#059669", fontSize: "1.25rem", flexShrink: 0, marginTop: "2px" }} />
                                    <div>
                                        <div style={{ fontSize: "0.775rem", fontWeight: 800, color: "#64748b", letterSpacing: "0.03em" }}>DESTINATION (INSPECTION HUB)</div>
                                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>{selectedDelivery.inspectionCenterName}</div>
                                        <div style={{ fontSize: "0.85rem", color: "#475569" }}>{selectedDelivery.technicianAddress || "EcoCycle Inspection Facility"}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="tech-modal-footer">
                            <button className="btn-tech-close-modal" onClick={() => setSelectedDelivery(null)}>
                                Close Tracking
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TechnicianDelivery;
