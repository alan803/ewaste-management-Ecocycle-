import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import {
    FiPackage,
    FiCheckCircle,
    FiClock,
    FiUser,
    FiPhone,
    FiSearch,
    FiGrid,
    FiList,
    FiCpu,
    FiSmartphone,
    FiBatteryCharging,
    FiTv,
    FiBox,
    FiMapPin,
    FiX,
    FiRefreshCw,
    FiTruck,
    FiNavigation,
    FiUserCheck,
    FiAlertTriangle,
    FiShield,
    FiCheck,
    FiCalendar,
    FiXCircle,
    FiEye
} from "react-icons/fi";
import "./Manage_pickup.css";

function ManagePickup() {
    const [assignments, setAssignments] = useState([]);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [reassignModalTarget, setReassignModalTarget] = useState(null);
    const [selectedNewAgentId, setSelectedNewAgentId] = useState("");
    const [reassigning, setReassigning] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetchData(token);
    }, []);

    const fetchData = async (authToken) => {
        const token = authToken || localStorage.getItem("token");
        try {
            setLoading(true);
            const [assignRes, agentRes] = await Promise.all([
                axios.get("https://localhost:7102/api/CollectionAssignment/admin/all-assignments", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get("https://localhost:7102/api/CollectionAgent/All", {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: [] }))
            ]);

            setAssignments(assignRes.data || []);
            setAgents(agentRes.data || []);
        } catch (err) {
            console.error("Error fetching admin pickup assignments:", err);
            showToast("Failed to load pickup assignments", "error");
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg, type = "success") => {
        setToastMessage({ msg, type });
        setTimeout(() => setToastMessage(null), 4000);
    };

    const handleReassignAgent = async () => {
        if (!selectedNewAgentId || !reassignModalTarget) return;
        const token = localStorage.getItem("token");
        try {
            setReassigning(true);
            await axios.post(
                "https://localhost:7102/api/CollectionAssignment/reassign",
                {
                    collectionAssignmentId: reassignModalTarget.collectionAssignmentId,
                    newCollectionAgentId: parseInt(selectedNewAgentId, 10)
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showToast("Collection Agent reassigned successfully!");
            setReassignModalTarget(null);
            setSelectedNewAgentId("");
            fetchData(token);
        } catch (err) {
            console.error("Error reassigning agent:", err);
            showToast(err.response?.data?.message || "Failed to reassign agent", "error");
        } finally {
            setReassigning(false);
        }
    };

    // Filter Pickups logic
    const totalPickups = assignments.length;
    const activePickups = assignments.filter(a => {
        const s = String(a.status || "").toLowerCase();
        return s === "pickupstarted" || s === "en route" || s === "outfordelivery";
    }).length;

    const completedPickups = assignments.filter(a => {
        const s = String(a.status || "").toLowerCase();
        return s === "completed" || s === "pickedup" || s === "deliveredtocenter";
    }).length;

    const pendingScheduled = assignments.filter(a => {
        const s = String(a.status || "").toLowerCase();
        return s === "scheduled" || s === "assigned" || s === "accepted";
    }).length;

    const filteredAssignments = assignments.filter(item => {
        const status = String(item.status || "").toLowerCase();

        if (activeTab === "Pending" && status !== "scheduled" && status !== "assigned" && status !== "accepted") return false;
        if (activeTab === "PickupStarted" && status !== "pickupstarted" && status !== "en route") return false;
        if (activeTab === "Completed" && status !== "completed" && status !== "pickedup" && status !== "deliveredtocenter") return false;
        if (activeTab === "Expired" && status !== "expired" && status !== "cancelled") return false;

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
        const s = String(item.status || "").toLowerCase();

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

        if (s === "completed" || s === "pickedup" || s === "deliveredtocenter") {
            return <span style={{ ...badgeStyle, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}><FiCheckCircle /> Pickup Completed</span>;
        } else if (s === "pickupstarted" || s === "en route") {
            return <span style={{ ...badgeStyle, background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}><FiTruck /> Agent Pickup Started</span>;
        } else if (s === "expired" || s === "cancelled") {
            return <span style={{ ...badgeStyle, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}><FiAlertTriangle /> Expired / Cancelled</span>;
        } else {
            return <span style={{ ...badgeStyle, background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}><FiClock /> Scheduled</span>;
        }
    };

    const getAgentPhoto = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith("http://") || photoPath.startsWith("https://") || photoPath.startsWith("data:")) return photoPath;
        if (photoPath.startsWith("/uploads/")) return `https://localhost:7102${photoPath}`;
        if (photoPath.startsWith("uploads/")) return `https://localhost:7102/${photoPath}`;
        const cleanPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
        return `https://localhost:7102/uploads/profile${cleanPath}`;
    };

    const getProofPhoto = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith("http://") || photoPath.startsWith("https://") || photoPath.startsWith("data:")) return photoPath;
        if (photoPath.startsWith("/uploads/")) return `https://localhost:7102${photoPath}`;
        if (photoPath.startsWith("uploads/")) return `https://localhost:7102/${photoPath}`;
        const cleanPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
        return `https://localhost:7102/uploads/pickups${cleanPath}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return dateStr;
        }
    };

    const capitalizeWords = (str) => {
        if (!str) return "";
        return str
            .toLowerCase()
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    return (
        <div className="admin-pickup-page">
            {/* Sidebar Navigation */}
            <Navbar />

            {/* Main Content Area */}
            <div className="admin-pickup-main">
                {/* Header Top Bar */}
                <div className="admin-top-bar">
                    <div className="admin-page-title">
                        <h1><FiPackage style={{ color: "#059669" }} /> Manage Device Pickups</h1>
                        <p>Track, manage, and reassign citizen e-waste collection agent pickup requests.</p>
                    </div>

                    <div className="admin-bar-actions">
                        <button
                            className="btn-admin-refresh"
                            onClick={() => fetchData()}
                            title="Sync pickup assignments"
                        >
                            <FiRefreshCw /> Refresh Data
                        </button>
                        <div className="admin-profile-chip">A</div>
                    </div>
                </div>

                {/* Toast Alert Notice */}
                {toastMessage && (
                    <div style={{
                        marginBottom: "1.5rem",
                        padding: "0.85rem 1.2rem",
                        borderRadius: "14px",
                        background: toastMessage.type === "error" ? "#fef2f2" : "#ecfdf5",
                        color: toastMessage.type === "error" ? "#991b1b" : "#065f46",
                        border: `1px solid ${toastMessage.type === "error" ? "#fecaca" : "#a7f3d0"}`,
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}>
                        <span>{toastMessage.msg}</span>
                        <button onClick={() => setToastMessage(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}><FiX /></button>
                    </div>
                )}

                {/* Analytics Metrics Cards Grid */}
                <div className="admin-metrics-grid">
                    <div className="admin-metric-card">
                        <div className="admin-metric-icon total"><FiPackage /></div>
                        <div className="admin-metric-info">
                            <h3>{totalPickups}</h3>
                            <p>Total Pickup Tasks</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon active"><FiTruck /></div>
                        <div className="admin-metric-info">
                            <h3>{activePickups}</h3>
                            <p>En Route Pickups</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon done"><FiCheckCircle /></div>
                        <div className="admin-metric-info">
                            <h3>{completedPickups}</h3>
                            <p>Completed Pickups</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon alert"><FiClock /></div>
                        <div className="admin-metric-info">
                            <h3>{pendingScheduled}</h3>
                            <p>Pending / Scheduled</p>
                        </div>
                    </div>
                </div>

                {/* Control & Filter Bar */}
                <div className="admin-filter-bar">
                    <div className="admin-search-input-box">
                        <FiSearch style={{ color: "#94a3b8" }} />
                        <input
                            type="text"
                            placeholder="Search device, customer name, agent, city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                                <FiX />
                            </button>
                        )}
                    </div>

                    <div className="admin-tab-group">
                        <button
                            className={`admin-tab-btn ${activeTab === "All" ? "active" : ""}`}
                            onClick={() => setActiveTab("All")}
                        >
                            All <span className="admin-count-pill">{totalPickups}</span>
                        </button>
                        <button
                            className={`admin-tab-btn ${activeTab === "Pending" ? "active" : ""}`}
                            onClick={() => setActiveTab("Pending")}
                        >
                            Scheduled <span className="admin-count-pill">{pendingScheduled}</span>
                        </button>
                        <button
                            className={`admin-tab-btn ${activeTab === "PickupStarted" ? "active" : ""}`}
                            onClick={() => setActiveTab("PickupStarted")}
                        >
                            En Route <span className="admin-count-pill">{activePickups}</span>
                        </button>
                        <button
                            className={`admin-tab-btn ${activeTab === "Completed" ? "active" : ""}`}
                            onClick={() => setActiveTab("Completed")}
                        >
                            Completed <span className="admin-count-pill">{completedPickups}</span>
                        </button>
                    </div>

                    <div className="admin-view-toggle">
                        <button
                            className={`admin-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                            onClick={() => setViewMode("grid")}
                            title="Grid View"
                        >
                            <FiGrid />
                        </button>
                        <button
                            className={`admin-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                            onClick={() => setViewMode("table")}
                            title="Table View"
                        >
                            <FiList />
                        </button>
                    </div>
                </div>

                {/* Content Area: Grid Feed or Table View */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "4rem 1rem", background: "#ffffff", borderRadius: "22px", border: "1px solid #e2e8f0" }}>
                        <FiRefreshCw style={{ fontSize: "2.5rem", color: "#059669", animation: "spin 1.5s linear infinite" }} />
                        <p style={{ color: "#64748b", marginTop: "1rem", fontWeight: 700 }}>Loading pickup tasks...</p>
                    </div>
                ) : filteredAssignments.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "4rem 1rem", background: "#ffffff", borderRadius: "22px", border: "1px solid #e2e8f0" }}>
                        <FiBox style={{ fontSize: "3rem", color: "#cbd5e1" }} />
                        <h3 style={{ color: "#0f172a", marginTop: "1rem", fontWeight: 800 }}>No Pickups Found</h3>
                        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No pickup tasks match your search or filter selection.</p>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="admin-cards-grid">
                        {filteredAssignments.map((item) => (
                            <div key={item.collectionAssignmentId || item.deviceId} className="admin-pickup-card">
                                <div className="admin-card-header">
                                    <div className="admin-card-top-row">
                                        <div className="admin-cat-icon-box">
                                            {getCategoryIcon(item.categoryName)}
                                        </div>
                                        <div>
                                            {getStatusBadge(item)}
                                        </div>
                                    </div>
                                    <div className="admin-card-title-group">
                                        <h3 className="admin-card-brand-name">{item.brand} {item.model}</h3>
                                        <p className="admin-card-cat-sub">{item.categoryName} &bull; {item.quantity || 1} Unit(s)</p>
                                    </div>
                                </div>

                                <div className="admin-card-body">
                                    {/* Assigned Collection Agent Box */}
                                    <div className="admin-agent-chip-box">
                                        <div className="admin-agent-chip-left">
                                            <div className="admin-agent-avatar">
                                                {item.collectionAgentPhoto ? (
                                                    <img src={getAgentPhoto(item.collectionAgentPhoto)} alt={item.collectionAgentName} />
                                                ) : (
                                                    (item.collectionAgentName || "A").charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <span className="admin-agent-name">{item.collectionAgentName || "Unassigned"}</span>
                                                <span className="admin-agent-sub">Collection Agent</span>
                                            </div>
                                        </div>

                                        {item.collectionAgentPhone && (
                                            <a href={`tel:${item.collectionAgentPhone}`} className="btn-admin-call" title="Call Agent">
                                                <FiPhone />
                                            </a>
                                        )}
                                    </div>

                                    {/* Customer & Address Details */}
                                    <div className="admin-customer-box">
                                        <div><strong>Customer:</strong> {item.customerName} ({item.customerPhone || "N/A"})</div>
                                        <div style={{ marginTop: "4px" }}>
                                            <FiMapPin style={{ color: "#d97706", marginRight: "4px" }} />
                                            {item.address || "Pickup address"}, {item.city}
                                        </div>
                                    </div>
                                </div>

                                <div className="admin-card-footer">
                                    <button
                                        className="btn-admin-action-track"
                                        onClick={() => setSelectedAssignment(item)}
                                    >
                                        <FiNavigation /> Track Live
                                    </button>

                                    {!["completed", "pickedup", "deliveredtocenter"].includes(String(item.status || "").toLowerCase()) && (
                                        <button
                                            className="btn-admin-action-reassign"
                                            onClick={() => {
                                                setReassignModalTarget(item);
                                                setSelectedNewAgentId(item.collectionAgentId || "");
                                            }}
                                            title="Reassign Agent"
                                        >
                                            <FiUserCheck /> Reassign
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Table View */
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Task / Device</th>
                                    <th>Customer</th>
                                    <th>Collection Agent</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAssignments.map((item) => {
                                    const isDone = ["completed", "pickedup", "deliveredtocenter"].includes(String(item.status || "").toLowerCase());
                                    return (
                                        <tr key={item.collectionAssignmentId || item.deviceId}>
                                            <td>
                                                <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.brand} {item.model}</div>
                                                <div style={{ fontSize: "0.775rem", color: "#64748b" }}>{item.categoryName} &bull; ID #{item.collectionAssignmentId}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.customerName}</div>
                                                <div style={{ fontSize: "0.775rem", color: "#64748b" }}>{item.city}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.collectionAgentName || "Unassigned"}</div>
                                                <div style={{ fontSize: "0.775rem", color: "#64748b" }}>{item.collectionAgentPhone}</div>
                                            </td>
                                            <td>{getStatusBadge(item)}</td>
                                            <td>
                                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                                    <button
                                                        className="btn-admin-action-track"
                                                        style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem" }}
                                                        onClick={() => setSelectedAssignment(item)}
                                                    >
                                                        <FiNavigation /> Track
                                                    </button>

                                                    {!isDone && (
                                                        <button
                                                            className="btn-admin-action-reassign"
                                                            style={{ padding: "0.45rem 0.85rem", fontSize: "0.8rem" }}
                                                            onClick={() => {
                                                                setReassignModalTarget(item);
                                                                setSelectedNewAgentId(item.collectionAgentId || "");
                                                            }}
                                                        >
                                                            <FiUserCheck /> Reassign
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

            {/* Live Pickup Tracking Stepper Modal (Matching Citizen Live Tracking) */}
            {selectedAssignment && (
                <div className="admin-modal-overlay" onClick={() => setSelectedAssignment(null)}>
                    <div className="admin-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", borderRadius: "20px", overflow: "hidden", padding: 0 }}>
                        {/* Modal Header */}
                        <div style={{
                            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                            color: "#ffffff",
                            padding: "1.25rem 1.5rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{ background: "rgba(255,255,255,0.2)", padding: "0.5rem", borderRadius: "10px", display: "flex" }}>
                                    <FiTruck style={{ fontSize: "1.4rem" }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Pickup Tracking & Details</h3>
                                    <span style={{ fontSize: "0.75rem", opacity: 0.9 }}>
                                        #{selectedAssignment.deviceId || selectedAssignment.collectionAssignmentId} &bull; {selectedAssignment.brand} {selectedAssignment.model} &bull; {selectedAssignment.categoryName}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedAssignment(null)}
                                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#ffffff", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <FiX />
                            </button>
                        </div>

                        {/* Modal Content Body */}
                        <div style={{ padding: "1.5rem", maxHeight: "75vh", overflowY: "auto" }}>
                            {/* Assigned Collection Agent Banner */}
                            <div style={{
                                background: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                borderRadius: "14px",
                                padding: "1rem",
                                marginBottom: "1.25rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                    {selectedAssignment.collectionAgentPhoto ? (
                                        <img 
                                            src={getAgentPhoto(selectedAssignment.collectionAgentPhoto)} 
                                            alt="Agent Profile" 
                                            style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} 
                                        />
                                    ) : (
                                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#059669", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.15rem" }}>
                                            {(selectedAssignment.collectionAgentName || "A").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontSize: "0.725rem", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Collection Agent</div>
                                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#065f46" }}>
                                            {capitalizeWords(selectedAssignment.collectionAgentName) || "Agent Assigned"}
                                        </div>
                                        {selectedAssignment.vehicleNumber && (
                                            <div style={{ fontSize: "0.775rem", color: "#047857", fontWeight: 600, marginTop: "0.1rem" }}>
                                                Vehicle: {selectedAssignment.vehicleNumber} ({selectedAssignment.vehicleType || "Pickup Van"})
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedAssignment.collectionAgentPhone && (
                                    <a 
                                        href={`tel:${selectedAssignment.collectionAgentPhone}`}
                                        style={{
                                            background: "#059669",
                                            color: "#ffffff",
                                            padding: "0.5rem 1rem",
                                            borderRadius: "10px",
                                            textDecoration: "none",
                                            fontSize: "0.825rem",
                                            fontWeight: 700,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.4rem",
                                            boxShadow: "0 2px 5px rgba(5,150,105,0.3)"
                                        }}
                                    >
                                        <FiPhone /> Call Agent
                                    </a>
                                )}
                            </div>

                            {/* Pickup Stepper Timeline */}
                            <div style={{ marginBottom: "1.25rem" }}>
                                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", fontWeight: 700, color: "#1e293b" }}>
                                    Pickup Progress Timeline
                                </h4>
                                <div className="pk-timeline">
                                    {(() => {
                                        const cas = String(selectedAssignment.status || "").toLowerCase();
                                        const isCancelled = cas === "cancelled" || cas === "expired";

                                        const isAccepted = cas === "accepted" || cas === "pickupstarted" || cas === "en route" || cas === "pickedup" || cas === "intransit" || cas === "deliveredtocenter" || cas === "completed";
                                        const isPickupStarted = cas === "pickupstarted" || cas === "en route" || cas === "pickedup" || cas === "intransit" || cas === "deliveredtocenter" || cas === "completed";
                                        const isCompleted = cas === "completed" || cas === "deliveredtocenter" || cas === "pickedup";

                                        if (isCancelled) {
                                            return (
                                                <>
                                                    {/* Step 1: Created */}
                                                    <div className="pk-timeline-step completed">
                                                        <div className="pk-timeline-dot">
                                                            <FiCheck style={{ fontSize: "0.7rem" }} />
                                                        </div>
                                                        <div className="pk-step-title">Pickup Request Created</div>
                                                        <div className="pk-step-desc">Item registered in EcoCycle portal</div>
                                                        <div className="pk-step-time">{formatDate(selectedAssignment.createdAt)}</div>
                                                    </div>

                                                    {/* Step 2: Cancelled */}
                                                    <div className="pk-timeline-step cancelled">
                                                        <div className="pk-timeline-dot pk-dot-cancelled" style={{ background: "#ef4444", borderColor: "#fca5a5", color: "#ffffff" }}>
                                                            <FiX style={{ fontSize: "0.75rem" }} />
                                                        </div>
                                                        <div className="pk-step-title" style={{ color: "#dc2626" }}>Pickup Allocation Expired / Cancelled</div>
                                                        <div className="pk-step-desc">The pickup allocation cycle was cancelled or expired.</div>
                                                    </div>
                                                </>
                                            );
                                        }

                                        return (
                                            <>
                                                {/* Step 1: Created */}
                                                <div className="pk-timeline-step completed">
                                                    <div className="pk-timeline-dot">
                                                        <FiCheck style={{ fontSize: "0.7rem" }} />
                                                    </div>
                                                    <div className="pk-step-title">Pickup Request Created</div>
                                                    <div className="pk-step-desc">Item registered in EcoCycle portal</div>
                                                    <div className="pk-step-time">{formatDate(selectedAssignment.createdAt)}</div>
                                                </div>

                                                {/* Step 2: Agent Accepted */}
                                                <div className={`pk-timeline-step ${isAccepted ? "completed" : "active"}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isAccepted ? <FiCheck style={{ fontSize: "0.7rem" }} /> : null}
                                                    </div>
                                                    <div className="pk-step-title">Collection Agent Assigned & Accepted</div>
                                                    <div className="pk-step-desc">
                                                        {selectedAssignment.collectionAgentName 
                                                            ? `Agent: ${capitalizeWords(selectedAssignment.collectionAgentName)} (${selectedAssignment.collectionAgentPhone || "Phone available"})`
                                                            : "Collection agent accepted task"}
                                                    </div>
                                                    {selectedAssignment.assignedAt && (
                                                        <div className="pk-step-time">{formatDate(selectedAssignment.assignedAt)}</div>
                                                    )}
                                                </div>

                                                {/* Step 3: Pickup Started / En Route */}
                                                <div className={`pk-timeline-step ${isCompleted ? "completed" : isPickupStarted ? "active" : ""}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isCompleted ? <FiCheck style={{ fontSize: "0.7rem" }} /> : isPickupStarted ? <FiTruck style={{ fontSize: "0.7rem" }} /> : null}
                                                    </div>
                                                    <div className="pk-step-title">Pickup Started & Agent En Route</div>
                                                    <div className="pk-step-desc">
                                                        {isPickupStarted 
                                                            ? "Collection agent is en route to customer pickup address" 
                                                            : `Scheduled for pickup on ${formatDate(selectedAssignment.pickupDate)} (${selectedAssignment.timeSlot || "Scheduled slot"})`}
                                                    </div>
                                                    {(selectedAssignment.startedAt || selectedAssignment.pickupStartedAt) && (
                                                        <div className="pk-step-time">{formatDate(selectedAssignment.startedAt || selectedAssignment.pickupStartedAt)}</div>
                                                    )}
                                                </div>

                                                {/* Step 4: Pickup Finished & Item Collected */}
                                                <div className={`pk-timeline-step ${isCompleted ? "completed" : ""}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isCompleted ? <FiCheck style={{ fontSize: "0.7rem" }} /> : null}
                                                    </div>
                                                    <div className="pk-step-title">Pickup Completed & Item Collected</div>
                                                    <div className="pk-step-desc">
                                                        {isCompleted 
                                                            ? "E-waste device verified and collected successfully from citizen by agent" 
                                                            : "Final pickup completion upon agent arrival at customer location"}
                                                    </div>
                                                    {(selectedAssignment.pickedUpAt || selectedAssignment.deliveredAt || selectedAssignment.completedAt) && (
                                                        <div className="pk-step-time">{formatDate(selectedAssignment.pickedUpAt || selectedAssignment.deliveredAt || selectedAssignment.completedAt)}</div>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Pickup Address & Verification Record Cards */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.85rem" }}>
                                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1rem" }}>
                                    <div style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                        Pickup Location (Citizen)
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: "0.925rem", color: "#0f172a", marginTop: "0.2rem" }}>
                                        {selectedAssignment.customerName} ({selectedAssignment.customerPhone || "Phone registered"})
                                    </div>
                                    <div style={{ fontSize: "0.825rem", color: "#334155", marginTop: "0.2rem" }}>
                                        <FiMapPin style={{ color: "#d97706", marginRight: "4px" }} />
                                        {selectedAssignment.address}, {selectedAssignment.city}
                                    </div>
                                    {selectedAssignment.landmark && (
                                        <div style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "0.15rem" }}>
                                            Landmark: {selectedAssignment.landmark}
                                        </div>
                                    )}
                                    <div style={{ fontSize: "0.775rem", color: "#2563eb", fontWeight: 600, marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                        <FiCalendar /> Scheduled: {formatDate(selectedAssignment.pickupDate)} ({selectedAssignment.timeSlot})
                                    </div>
                                </div>

                                {/* Pickup Verification & Handover Record from Pickup Table */}
                                {(selectedAssignment.deviceVerified || selectedAssignment.proofPhotoPath || selectedAssignment.agentNotes || selectedAssignment.failureReason) && (
                                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "14px", padding: "1rem" }}>
                                        <div style={{ fontSize: "0.725rem", color: "#166534", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "0.4rem" }}>
                                            Pickup Verification Record (Pickup ID #{selectedAssignment.pickupId || selectedAssignment.collectionAssignmentId})
                                        </div>
                                        
                                        {selectedAssignment.deviceVerified && (
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#dcfce7", color: "#15803d", padding: "0.3rem 0.65rem", borderRadius: "8px", fontSize: "0.775rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                                                <FiCheckCircle /> Device Barcode / QR Code Verified
                                            </div>
                                        )}

                                        {selectedAssignment.agentNotes && (
                                            <div style={{ fontSize: "0.825rem", color: "#166534", marginTop: "0.3rem" }}>
                                                <strong>Agent Notes:</strong> {selectedAssignment.agentNotes}
                                            </div>
                                        )}

                                        {selectedAssignment.failureReason && (
                                            <div style={{ fontSize: "0.825rem", color: "#b91c1c", marginTop: "0.3rem" }}>
                                                <strong>Issue / Note:</strong> {selectedAssignment.failureReason}
                                            </div>
                                        )}

                                        {selectedAssignment.proofPhotoPath && (
                                            <div style={{ marginTop: "0.6rem" }}>
                                                <a 
                                                    href={getProofPhoto(selectedAssignment.proofPhotoPath)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{
                                                        background: "#059669",
                                                        color: "#ffffff",
                                                        padding: "0.45rem 0.85rem",
                                                        borderRadius: "8px",
                                                        fontSize: "0.775rem",
                                                        fontWeight: 700,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "0.4rem",
                                                        textDecoration: "none",
                                                        boxShadow: "0 2px 6px rgba(5,150,105,0.2)",
                                                        transition: "all 0.2s ease"
                                                    }}
                                                >
                                                    <FiEye style={{ fontSize: "0.9rem" }} /> View Handover Proof Photo ↗
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", textAlign: "right" }}>
                            <button 
                                onClick={() => setSelectedAssignment(null)}
                                style={{
                                    padding: "0.55rem 1.25rem",
                                    borderRadius: "10px",
                                    background: "#059669",
                                    color: "#ffffff",
                                    border: "none",
                                    fontWeight: 700,
                                    fontSize: "0.85rem",
                                    cursor: "pointer"
                                }}
                            >
                                Close Tracking
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reassign Collection Agent Modal */}
            {reassignModalTarget && (
                <div className="admin-modal-overlay" onClick={() => setReassignModalTarget(null)}>
                    <div className="admin-modal-dialog" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div className="admin-modal-title-box">
                                <h2>Reassign Collection Agent</h2>
                                <p className="admin-modal-subtitle">{reassignModalTarget.brand} {reassignModalTarget.model}</p>
                            </div>
                            <button className="btn-admin-close-modal" style={{ padding: "0.5rem", borderRadius: "50%" }} onClick={() => setReassignModalTarget(null)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="admin-modal-body" style={{ padding: "1.75rem 1.5rem" }}>
                            <p style={{ fontSize: "0.875rem", color: "#475569", margin: "0 0 1rem 0" }}>
                                Select a new approved collection agent to take over this e-waste pickup dispatch task:
                            </p>

                            <select
                                value={selectedNewAgentId}
                                onChange={(e) => setSelectedNewAgentId(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "0.85rem 1rem",
                                    borderRadius: "12px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "0.9rem",
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    background: "#ffffff",
                                    outline: "none"
                                }}
                            >
                                <option value="">-- Select Collection Agent --</option>
                                {agents.map(ag => (
                                    <option key={ag.agentId || ag.id} value={ag.agentId || ag.id}>
                                        {ag.firstName} {ag.lastName} ({ag.city || ag.phoneNumber || "Agent"})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="admin-modal-footer">
                            <button className="btn-admin-close-modal" onClick={() => setReassignModalTarget(null)}>
                                Cancel
                            </button>
                            <button
                                className="btn-admin-action-track"
                                style={{ padding: "0.65rem 1.4rem" }}
                                onClick={handleReassignAgent}
                                disabled={reassigning || !selectedNewAgentId}
                            >
                                {reassigning ? "Saving..." : "Confirm Reassign"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManagePickup;
