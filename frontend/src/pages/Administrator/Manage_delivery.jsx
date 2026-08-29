import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import {
    FiTruck,
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
    FiNavigation,
    FiShield,
    FiCheck,
    FiCalendar,
    FiXCircle,
    FiEye,
    FiAlertTriangle
} from "react-icons/fi";
import "./Manage_delivery.css";

function ManageDelivery() {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
    const [selectedDelivery, setSelectedDelivery] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetchDeliveries(token);
    }, []);

    const fetchDeliveries = async (authToken) => {
        const token = authToken || localStorage.getItem("token");
        try {
            setLoading(true);
            const response = await axios.get("https://localhost:7102/api/CollectionAssignment/admin/all-assignments", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeliveries(response.data || []);
        } catch (err) {
            console.error("Error fetching admin deliveries:", err);
        } finally {
            setLoading(false);
        }
    };

    // Metrics calculation
    const totalDeliveries = deliveries.length;
    const inTransitCount = deliveries.filter(d => {
        const cas = String(d.status || "").toLowerCase();
        const delStat = String(d.deliveryStatus || "").toLowerCase();
        return cas === "outfordelivery" || delStat === "intransit" || cas === "pickupstarted";
    }).length;

    const deliveredCount = deliveries.filter(d => {
        const cas = String(d.status || "").toLowerCase();
        const delStat = String(d.deliveryStatus || "").toLowerCase();
        return cas === "deliveredtocenter" || delStat === "delivered" || delStat === "completed";
    }).length;

    const totalWeight = deliveries.reduce((sum, d) => sum + ((Number(d.weight) || 0) * (Number(d.quantity) || 1)), 0);

    const filteredDeliveries = deliveries.filter(item => {
        const cas = String(item.status || "").toLowerCase();
        const delStat = String(item.deliveryStatus || "").toLowerCase();

        if (activeTab === "InTransit" && cas !== "outfordelivery" && delStat !== "intransit" && cas !== "pickupstarted") return false;
        if (activeTab === "Delivered" && cas !== "deliveredtocenter" && delStat !== "delivered" && delStat !== "completed") return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const devName = `${item.brand || ""} ${item.model || ""}`.toLowerCase();
        const catName = String(item.categoryName || "").toLowerCase();
        const agentName = String(item.collectionAgentName || "").toLowerCase();
        const centerName = String(item.inspectionCenterName || "").toLowerCase();
        const techName = String(item.technicianName || "").toLowerCase();

        return (
            devName.includes(q) ||
            catName.includes(q) ||
            agentName.includes(q) ||
            centerName.includes(q) ||
            techName.includes(q)
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

        if (cas === "deliveredtocenter" || delStat === "delivered" || delStat === "completed") {
            return <span style={{ ...badgeStyle, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}><FiCheckCircle /> Delivered to Center</span>;
        } else if (cas === "outfordelivery" || delStat === "intransit" || cas === "pickupstarted") {
            return <span style={{ ...badgeStyle, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}><FiTruck /> En Route to Center</span>;
        } else if (delStat === "failed" || cas === "failed" || cas === "cancelled") {
            return <span style={{ ...badgeStyle, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}><FiAlertTriangle /> Delivery Failed</span>;
        } else {
            return <span style={{ ...badgeStyle, background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}><FiClock /> Delivery Pending</span>;
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
        <div className="admin-deliv-page">
            {/* Sidebar Navigation */}
            <Navbar />

            {/* Main Content Area */}
            <div className="admin-deliv-main">
                {/* Header Top Bar */}
                <div className="admin-deliv-bar">
                    <div className="admin-deliv-title">
                        <h1><FiTruck style={{ color: "#059669" }} /> Manage Center Deliveries</h1>
                        <p>Monitor e-waste delivery dispatches en route to inspection facilities in real-time.</p>
                    </div>

                    <div className="admin-deliv-actions">
                        <button
                            className="btn-deliv-refresh"
                            onClick={() => fetchDeliveries()}
                            title="Sync live delivery feed"
                        >
                            <FiRefreshCw /> Refresh Data
                        </button>
                        <div className="admin-deliv-avatar">A</div>
                    </div>
                </div>

                {/* KPI Analytics Metrics Grid */}
                <div className="admin-deliv-metrics">
                    <div className="deliv-metric-card">
                        <div className="deliv-metric-icon total"><FiBox /></div>
                        <div className="deliv-metric-info">
                            <h3>{totalDeliveries}</h3>
                            <p>Total Deliveries</p>
                        </div>
                    </div>

                    <div className="deliv-metric-card">
                        <div className="deliv-metric-icon transit"><FiTruck /></div>
                        <div className="deliv-metric-info">
                            <h3>{inTransitCount}</h3>
                            <p>En Route (In Transit)</p>
                        </div>
                    </div>

                    <div className="deliv-metric-card">
                        <div className="deliv-metric-icon delivered"><FiCheckCircle /></div>
                        <div className="deliv-metric-info">
                            <h3>{deliveredCount}</h3>
                            <p>Delivered to Center</p>
                        </div>
                    </div>

                    <div className="deliv-metric-card">
                        <div className="deliv-metric-icon weight"><FiShield /></div>
                        <div className="deliv-metric-info">
                            <h3>{totalWeight.toFixed(1)} kg</h3>
                            <p>Total E-Waste Weight</p>
                        </div>
                    </div>
                </div>

                {/* Control Filter Bar */}
                <div className="deliv-filter-bar">
                    <div className="deliv-search-box">
                        <FiSearch style={{ color: "#94a3b8" }} />
                        <input
                            type="text"
                            placeholder="Search device, agent, inspection center..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                                <FiX />
                            </button>
                        )}
                    </div>

                    <div className="deliv-tabs-group">
                        <button
                            className={`deliv-tab-btn ${activeTab === "All" ? "active" : ""}`}
                            onClick={() => setActiveTab("All")}
                        >
                            All Shipments <span className="deliv-count-pill">{totalDeliveries}</span>
                        </button>
                        <button
                            className={`deliv-tab-btn ${activeTab === "InTransit" ? "active" : ""}`}
                            onClick={() => setActiveTab("InTransit")}
                        >
                            En Route <span className="deliv-count-pill">{inTransitCount}</span>
                        </button>
                        <button
                            className={`deliv-tab-btn ${activeTab === "Delivered" ? "active" : ""}`}
                            onClick={() => setActiveTab("Delivered")}
                        >
                            Delivered <span className="deliv-count-pill">{deliveredCount}</span>
                        </button>
                    </div>

                    <div className="deliv-view-toggle">
                        <button
                            className={`deliv-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                            onClick={() => setViewMode("grid")}
                            title="Grid View"
                        >
                            <FiGrid />
                        </button>
                        <button
                            className={`deliv-toggle-btn ${viewMode === "table" ? "active" : ""}`}
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
                        <p style={{ color: "#64748b", marginTop: "1rem", fontWeight: 700 }}>Loading delivery feed...</p>
                    </div>
                ) : filteredDeliveries.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "4rem 1rem", background: "#ffffff", borderRadius: "22px", border: "1px solid #e2e8f0" }}>
                        <FiBox style={{ fontSize: "3rem", color: "#cbd5e1" }} />
                        <h3 style={{ color: "#0f172a", marginTop: "1rem", fontWeight: 800 }}>No Deliveries Found</h3>
                        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No e-waste delivery dispatches match your filter selection.</p>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="deliv-cards-grid">
                        {filteredDeliveries.map((item) => (
                            <div key={item.collectionAssignmentId || item.deviceId} className="deliv-card">
                                <div className="deliv-card-header">
                                    <div className="deliv-card-top-row">
                                        <div className="deliv-cat-icon">
                                            {getCategoryIcon(item.categoryName)}
                                        </div>
                                        <div>
                                            {getStatusBadge(item)}
                                        </div>
                                    </div>
                                    <div className="deliv-card-title-group">
                                        <h3 className="deliv-card-brand-name">{item.brand} {item.model}</h3>
                                        <p className="deliv-card-cat-sub">{item.categoryName} &bull; {item.quantity || 1} Unit(s)</p>
                                    </div>
                                </div>

                                <div className="deliv-card-body">
                                    {/* Collection Agent Info */}
                                    <div className="deliv-agent-box">
                                        <div className="deliv-agent-left">
                                            <div className="deliv-agent-avatar">
                                                {item.collectionAgentPhoto ? (
                                                    <img src={getAgentPhoto(item.collectionAgentPhoto)} alt={item.collectionAgentName} />
                                                ) : (
                                                    (item.collectionAgentName || "A").charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <span className="deliv-agent-name">{item.collectionAgentName || "Assigned Agent"}</span>
                                                <span className="deliv-agent-sub">Collection Agent</span>
                                            </div>
                                        </div>
                                        {item.collectionAgentPhone && (
                                            <a href={`tel:${item.collectionAgentPhone}`} className="btn-deliv-call" title="Call Agent">
                                                <FiPhone />
                                            </a>
                                        )}
                                    </div>

                                    {/* Route Info */}
                                    <div className="deliv-route-box">
                                        <div><strong>Origin:</strong> {item.customerName} ({item.city})</div>
                                        <div style={{ marginTop: "3px" }}><strong>Destination:</strong> {item.inspectionCenterName || "Central Inspection Hub"}</div>
                                    </div>
                                </div>

                                <div className="deliv-card-footer">
                                    <button
                                        className="btn-deliv-track"
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
                    <div className="deliv-table-wrapper">
                        <table className="deliv-table">
                            <thead>
                                <tr>
                                    <th>Task / Device</th>
                                    <th>Collection Agent</th>
                                    <th>Origin Customer</th>
                                    <th>Destination Inspection Center</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDeliveries.map((item) => (
                                    <tr key={item.collectionAssignmentId || item.deviceId}>
                                        <td>
                                            <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.brand} {item.model}</div>
                                            <div style={{ fontSize: "0.775rem", color: "#64748b" }}>{item.categoryName}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.collectionAgentName || "Assigned Agent"}</div>
                                            <div style={{ fontSize: "0.775rem", color: "#64748b" }}>{item.collectionAgentPhone}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.customerName}</div>
                                            <div style={{ fontSize: "0.775rem", color: "#64748b" }}>{item.city}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.inspectionCenterName || "Inspection Hub"}</div>
                                            <div style={{ fontSize: "0.775rem", color: "#64748b" }}>{item.technicianName}</div>
                                        </td>
                                        <td>{getStatusBadge(item)}</td>
                                        <td>
                                            <button
                                                className="btn-deliv-track"
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

            {/* Live Delivery Tracking Stepper Modal (Matching Manage_pickup.jsx & Citizen Live Tracking) */}
            {selectedDelivery && (
                <div className="deliv-modal-overlay" onClick={() => setSelectedDelivery(null)}>
                    <div className="deliv-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px", borderRadius: "20px", overflow: "hidden", padding: 0 }}>
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
                                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Collection Delivery Details</h3>
                                    <span style={{ fontSize: "0.75rem", opacity: 0.9 }}>
                                        #{selectedDelivery.deviceId || selectedDelivery.collectionAssignmentId} &bull; {selectedDelivery.brand} {selectedDelivery.model} &bull; {selectedDelivery.categoryName}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedDelivery(null)}
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
                                    {selectedDelivery.collectionAgentPhoto ? (
                                        <img 
                                            src={getAgentPhoto(selectedDelivery.collectionAgentPhoto)} 
                                            alt="Agent Profile" 
                                            style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} 
                                        />
                                    ) : (
                                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#059669", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.15rem" }}>
                                            {(selectedDelivery.collectionAgentName || "A").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontSize: "0.725rem", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Collection Agent</div>
                                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#065f46" }}>
                                            {capitalizeWords(selectedDelivery.collectionAgentName) || "Agent Assigned"}
                                        </div>
                                        {selectedDelivery.vehicleNumber && (
                                            <div style={{ fontSize: "0.775rem", color: "#047857", fontWeight: 600, marginTop: "0.1rem" }}>
                                                Vehicle: {selectedDelivery.vehicleNumber} ({selectedDelivery.vehicleType || "Pickup Van"})
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedDelivery.collectionAgentPhone && (
                                    <a 
                                        href={`tel:${selectedDelivery.collectionAgentPhone}`}
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

                            {/* Delivery Progress Timeline */}
                            <div style={{ marginBottom: "1.25rem" }}>
                                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", fontWeight: 700, color: "#1e293b" }}>
                                    Delivery Progress Timeline
                                </h4>
                                <div className="pk-timeline">
                                    {(() => {
                                        const delStat = String(selectedDelivery.deliveryStatus || "").toLowerCase();
                                        const cas = String(selectedDelivery.status || "").toLowerCase();
                                        const isCancelled = delStat === "failed" || delStat === "cancelled" || cas === "cancelled" || cas === "expired";

                                        const isDelivered = delStat === "delivered" || delStat === "deliveredtocenter";
                                        const isInTransit = isDelivered || delStat === "intransit" || delStat === "outfordelivery";
                                        const isAccepted = isInTransit || cas === "accepted" || cas === "pickupstarted" || cas === "pickedup";

                                        if (isCancelled) {
                                            return (
                                                <>
                                                    {/* Step 1: Created */}
                                                    <div className="pk-timeline-step completed">
                                                        <div className="pk-timeline-dot">
                                                            <FiCheck style={{ fontSize: "0.7rem" }} />
                                                        </div>
                                                        <div className="pk-step-title">Delivery Dispatch Registered</div>
                                                        <div className="pk-step-desc">Delivery item registered in EcoCycle portal</div>
                                                        <div className="pk-step-time">{formatDate(selectedDelivery.createdAt)}</div>
                                                    </div>

                                                    {/* Step 2: Cancelled */}
                                                    <div className="pk-timeline-step cancelled">
                                                        <div className="pk-timeline-dot pk-dot-cancelled" style={{ background: "#ef4444", borderColor: "#fca5a5", color: "#ffffff" }}>
                                                            <FiX style={{ fontSize: "0.75rem" }} />
                                                        </div>
                                                        <div className="pk-step-title" style={{ color: "#dc2626" }}>Delivery Failed / Cancelled</div>
                                                        <div className="pk-step-desc">{selectedDelivery.deliveryFailureReason || "The delivery dispatch cycle was cancelled or failed."}</div>
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
                                                    <div className="pk-step-title">Delivery Dispatch Registered</div>
                                                    <div className="pk-step-desc">Delivery item registered in EcoCycle portal</div>
                                                    <div className="pk-step-time">{formatDate(selectedDelivery.createdAt)}</div>
                                                </div>

                                                {/* Step 2: Agent Assigned */}
                                                <div className={`pk-timeline-step ${isAccepted ? "completed" : "active"}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isAccepted ? <FiCheck style={{ fontSize: "0.7rem" }} /> : null}
                                                    </div>
                                                    <div className="pk-step-title">Collection Agent Assigned & Pickup Done</div>
                                                    <div className="pk-step-desc">
                                                        {selectedDelivery.collectionAgentName 
                                                            ? `Agent: ${capitalizeWords(selectedDelivery.collectionAgentName)} (${selectedDelivery.collectionAgentPhone || "Phone available"})`
                                                            : "Collection agent assigned"}
                                                    </div>
                                                    {selectedDelivery.assignedAt && (
                                                        <div className="pk-step-time">{formatDate(selectedDelivery.assignedAt)}</div>
                                                    )}
                                                </div>

                                                {/* Step 3: En Route to Facility */}
                                                <div className={`pk-timeline-step ${isDelivered ? "completed" : isInTransit ? "active" : ""}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isDelivered ? <FiCheck style={{ fontSize: "0.7rem" }} /> : isInTransit ? <FiTruck style={{ fontSize: "0.7rem" }} /> : null}
                                                    </div>
                                                    <div className="pk-step-title">En Route to Inspection Hub (In Transit)</div>
                                                    <div className="pk-step-desc">
                                                        {isInTransit 
                                                            ? "Collection agent is en route delivering device to inspection center" 
                                                            : "Delivery dispatch pending transit start"}
                                                    </div>
                                                    {selectedDelivery.deliveryStartedAt && (
                                                        <div className="pk-step-time">{formatDate(selectedDelivery.deliveryStartedAt)}</div>
                                                    )}
                                                </div>

                                                {/* Step 4: Delivered to Inspection Center */}
                                                <div className={`pk-timeline-step ${isDelivered ? "completed" : ""}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isDelivered ? <FiCheck style={{ fontSize: "0.7rem" }} /> : null}
                                                    </div>
                                                    <div className="pk-step-title">Delivered to Inspection Center</div>
                                                    <div className="pk-step-desc">
                                                        {isDelivered 
                                                            ? "E-waste device delivered successfully to inspection facility" 
                                                            : "Final delivery handover pending arrival at facility"}
                                                    </div>
                                                    {selectedDelivery.deliveryDeliveredAt && (
                                                        <div className="pk-step-time">{formatDate(selectedDelivery.deliveryDeliveredAt)}</div>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Pickup Address & Delivery Destination Cards */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.85rem" }}>
                                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1rem" }}>
                                    <div style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                        Pickup Location (Citizen)
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: "0.925rem", color: "#0f172a", marginTop: "0.2rem" }}>
                                        {selectedDelivery.customerName} ({selectedDelivery.customerPhone || "Phone registered"})
                                    </div>
                                    <div style={{ fontSize: "0.825rem", color: "#334155", marginTop: "0.2rem" }}>
                                        <FiMapPin style={{ color: "#d97706", marginRight: "4px" }} />
                                        {selectedDelivery.address}, {selectedDelivery.city}
                                    </div>
                                    {selectedDelivery.landmark && (
                                        <div style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "0.15rem" }}>
                                            Landmark: {selectedDelivery.landmark}
                                        </div>
                                    )}
                                    <div style={{ fontSize: "0.775rem", color: "#2563eb", fontWeight: 600, marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                        <FiCalendar /> Scheduled: {formatDate(selectedDelivery.pickupDate)} ({selectedDelivery.timeSlot})
                                    </div>
                                </div>

                                {/* Delivery Destination (Technician / Facility Location) */}
                                {(selectedDelivery.technicianName || selectedDelivery.inspectionCenterName || selectedDelivery.deliveredAddress || selectedDelivery.deliveryAddress) && (
                                    <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "14px", padding: "1rem" }}>
                                        <div style={{ fontSize: "0.725rem", color: "#0369a1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                            Delivery Facility Destination
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: "0.925rem", color: "#0c4a6e", marginTop: "0.2rem" }}>
                                            {selectedDelivery.inspectionCenterName || selectedDelivery.technicianCenterName || "EcoCycle Inspection Facility"}
                                        </div>
                                        {selectedDelivery.technicianName && (
                                            <div style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: 600, marginTop: "0.1rem" }}>
                                                Technician: {selectedDelivery.technicianName} ({selectedDelivery.technicianPhone || "Staff"})
                                            </div>
                                        )}
                                        {(selectedDelivery.deliveredAddress || selectedDelivery.technicianAddress || selectedDelivery.deliveryAddress) && (
                                            <div style={{ fontSize: "0.825rem", color: "#0369a1", marginTop: "0.25rem" }}>
                                                <FiMapPin style={{ color: "#0284c7", marginRight: "4px" }} />
                                                {selectedDelivery.deliveredAddress || selectedDelivery.technicianAddress || selectedDelivery.deliveryAddress}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Delivery Record & Verification Details (STRICTLY FROM DELIVERIES TABLE) */}
                                {(selectedDelivery.deliveryDeviceVerified || selectedDelivery.deliveryAgentNotes || selectedDelivery.deliveryFailureReason || selectedDelivery.deliveryStatus) && (
                                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "14px", padding: "1rem" }}>
                                        <div style={{ fontSize: "0.725rem", color: "#166534", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "0.4rem" }}>
                                            Inspection Center Delivery Record (Delivery ID #{selectedDelivery.deliveryId || "N/A"})
                                        </div>

                                        <div style={{ fontSize: "0.8rem", color: "#065f46", fontWeight: 600, marginBottom: "0.3rem" }}>
                                            Delivery Status: <strong>{selectedDelivery.deliveryStatus || "Pending"}</strong>
                                        </div>
                                        
                                        {selectedDelivery.deliveryDeviceVerified ? (
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#dcfce7", color: "#15803d", padding: "0.3rem 0.65rem", borderRadius: "8px", fontSize: "0.775rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                                                <FiCheckCircle /> Inspection Center Device Verified
                                            </div>
                                        ) : (
                                            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#f1f5f9", color: "#64748b", padding: "0.3rem 0.65rem", borderRadius: "8px", fontSize: "0.775rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                                                <FiClock /> Device Verification Pending at Center
                                            </div>
                                        )}

                                        {selectedDelivery.deliveryAgentNotes && (
                                            <div style={{ fontSize: "0.825rem", color: "#166534", marginTop: "0.3rem" }}>
                                                <strong>Delivery Agent Notes:</strong> {selectedDelivery.deliveryAgentNotes}
                                            </div>
                                        )}

                                        {selectedDelivery.deliveryFailureReason && (
                                            <div style={{ fontSize: "0.825rem", color: "#b91c1c", marginTop: "0.3rem" }}>
                                                <strong>Delivery Issue / Note:</strong> {selectedDelivery.deliveryFailureReason}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", textAlign: "right" }}>
                            <button 
                                onClick={() => setSelectedDelivery(null)}
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
        </div>
    );
}

export default ManageDelivery;
