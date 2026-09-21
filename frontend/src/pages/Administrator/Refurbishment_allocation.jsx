import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import {
    FiRefreshCw,
    FiSearch,
    FiCpu,
    FiRotateCcw,
    FiClock,
    FiCheckCircle,
    FiAlertTriangle,
    FiBox,
    FiX,
    FiEye,
    FiActivity,
    FiGrid,
    FiList
} from "react-icons/fi";
import "./Manage_recyclingallocation.css";

function RefurbishmentAllocation() {
    const [devices, setDevices] = useState([]);
    const [activeCenters, setActiveCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("table");

    // Allocation Modal State
    const [allocatingDevice, setAllocatingDevice] = useState(null);
    const [selectedCenterId, setSelectedCenterId] = useState("auto");
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState("");

    // Details Modal State
    const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);

    useEffect(() => {
        fetchRefurbishmentData();
    }, []);

    const fetchRefurbishmentData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [devRes, centerRes] = await Promise.all([
                axios.get("https://localhost:7102/api/Device/All", { headers }).catch(() => ({ data: [] })),
                axios.get("https://localhost:7102/api/RefurbishmentCenter/alluser", { headers }).catch(() => ({ data: [] }))
            ]);

            // Filter ONLY devices directed explicitly to refurbishment
            const allDevs = devRes.data || [];
            const refurbishmentDevs = allDevs.filter(d => {
                const decision = String(d.processingDecision || d.ProcessingDecision || d.processingPreference || d.ProcessingPreference || "").trim().toLowerCase();
                return decision.includes("refurbish");
            });

            setDevices(refurbishmentDevs);
            setActiveCenters(centerRes.data || []);
        } catch (err) {
            console.error("Error fetching refurbishment allocation data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmAllocation = async () => {
        if (!allocatingDevice) return;
        setModalLoading(true);
        setModalError("");
        try {
            const token = localStorage.getItem("token");
            const url = `https://localhost:7102/api/Device/allocate-center/${allocatingDevice.deviceId}`;
            await axios.post(url, {
                centerId: selectedCenterId,
                centerType: "refurbishment"
            }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});

            setAllocatingDevice(null);
            await fetchRefurbishmentData();
        } catch (err) {
            console.error("Error allocating refurbishment center:", err);
            setModalError(err.response?.data?.message || "Failed to allocate refurbishment center.");
        } finally {
            setModalLoading(false);
        }
    };

    // Metrics for refurbishment devices
    const totalRefurbDevs = devices.length;
    const waitingDevs = devices.filter(d => {
        const lcs = (d.lifecycleStatus || "").toLowerCase();
        return lcs === "refurbishmentcenterpending" || lcs === "waiting";
    }).length;
    const assignedDevs = devices.filter(d => {
        const lcs = (d.lifecycleStatus || "").toLowerCase();
        return lcs === "refurbishmentcenterassigned" || lcs === "refurbishment";
    }).length;
    const acceptedDevs = devices.filter(d => {
        const lcs = (d.lifecycleStatus || "").toLowerCase();
        return lcs === "refurbishmentcenteraccepted";
    }).length;

    // Filtered devices list
    const filteredDevices = devices.filter(item => {
        const lcs = (item.lifecycleStatus || "").toLowerCase();
        const isWaiting = lcs === "refurbishmentcenterpending" || lcs === "waiting";
        const isAssigned = lcs === "refurbishmentcenterassigned" || lcs === "refurbishment";
        const isAccepted = lcs === "refurbishmentcenteraccepted";

        if (activeTab === "waiting" && !isWaiting) return false;
        if (activeTab === "assigned" && !isAssigned) return false;
        if (activeTab === "accepted" && !isAccepted) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const devName = `${item.brand || ""} ${item.model || ""}`.toLowerCase();
        const catName = String(item.categoryName || "").toLowerCase();
        const userLoc = String(item.userLocation || item.userCity || "").toLowerCase();

        return devName.includes(q) || catName.includes(q) || userLoc.includes(q);
    });

    return (
        <div className="admin-alloc-page">
            <Navbar />

            <div className="admin-alloc-main">
                {/* Header */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <div className="command-brand">
                            <h1>Refurbishment Center Allocation</h1>
                        </div>
                        <p className="command-subtitle">
                            Track and manage all e-waste devices awaiting refurbishment center assignment and track responses from centers
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search refurbishment device, brand, location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span className="search-shortcut">⌘K</span>
                        </div>

                        <div className="topbar-actions">
                            <button className="glass-btn notification-btn" onClick={fetchRefurbishmentData} title="Sync data">
                                <FiRefreshCw className={loading ? "spin-icon" : ""} />
                            </button>

                            <div className="user-profile-chip">
                                <div className="avatar-gradient">A</div>
                                <div className="user-info-text">
                                    <span className="name">Admin User</span>
                                    <span className="role">Super Admin</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Metric Summary Cards */}
                <div className="metrics-grid-v2">
                    <div className="metric-card-v2">
                        <div className="metric-icon-box purple">
                            <FiCpu />
                        </div>
                        <div>
                            <div className="metric-val">{totalRefurbDevs}</div>
                            <div className="metric-lbl">Refurbishment Devices</div>
                        </div>
                    </div>

                    <div className="metric-card-v2">
                        <div className="metric-icon-box amber">
                            <FiAlertTriangle />
                        </div>
                        <div>
                            <div className="metric-val">{waitingDevs}</div>
                            <div className="metric-lbl">Waiting (Manual Fallback)</div>
                        </div>
                    </div>

                    <div className="metric-card-v2">
                        <div className="metric-icon-box blue">
                            <FiClock />
                        </div>
                        <div>
                            <div className="metric-val">{assignedDevs}</div>
                            <div className="metric-lbl">Refurbishment Center Assigned</div>
                        </div>
                    </div>

                    <div className="metric-card-v2">
                        <div className="metric-icon-box emerald">
                            <FiCheckCircle />
                        </div>
                        <div>
                            <div className="metric-val">{acceptedDevs}</div>
                            <div className="metric-lbl">Refurbishment Center Accepted</div>
                        </div>
                    </div>
                </div>

                {/* Section 1: Refurbishment Facility Allocation Queue */}
                <section className="content-section">
                    <div className="panel-card table-panel">
                        <div className="panel-header">
                            <div>
                                <h3 className="panel-title">Refurbishment Allocation Queue</h3>
                                <p className="panel-subtitle">
                                    Devices directed for refurbishment ready for center assignment
                                </p>
                            </div>

                            <div className="panel-actions" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                                <div className="filter-pill-group">
                                    {[
                                        { id: "All", label: `All (${totalRefurbDevs})` },
                                        { id: "waiting", label: `Waiting Manual (${waitingDevs})` },
                                        { id: "assigned", label: `Assigned (${assignedDevs})` },
                                        { id: "accepted", label: `Accepted (${acceptedDevs})` }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            className={`pill-btn ${activeTab === tab.id ? "pill-btn--active" : ""}`}
                                            onClick={() => setActiveTab(tab.id)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
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
                        </div>

                        {loading ? (
                            <div className="loading-state">
                                <div className="loading-spinner"></div>
                                <p>Loading refurbishment devices queue...</p>
                            </div>
                        ) : filteredDevices.length === 0 ? (
                            <div className="no-data-state">
                                <FiBox className="no-data-icon" />
                                <p>No refurbishment devices found under "{activeTab}".</p>
                            </div>
                        ) : viewMode === "table" ? (
                            <div className="glass-table-wrapper">
                                <table className="glass-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Device Details</th>
                                            <th>Inspection Decision</th>
                                            <th>Target Center</th>
                                            <th>Allocation Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDevices.map((d, idx) => {
                                            const lcs = (d.lifecycleStatus || "").toLowerCase();
                                            const isWaiting = lcs === "refurbishmentcenterpending" || lcs === "waiting";
                                            const isAllocated = lcs === "refurbishmentcenterassigned" || lcs === "refurbishment" || lcs === "refurbishmentcenteraccepted";

                                            return (
                                                <tr key={d.deviceId || idx} className="table-row-hover">
                                                    <td style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: "0.875rem" }}>
                                                        {idx + 1}
                                                    </td>
                                                    <td>
                                                        <div className="user-info">
                                                            <span className="user-name">{d.brand} {d.model}</span>
                                                            <span className="user-email">#{d.deviceId} &bull; {d.categoryName || "E-Waste"}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="user-info">
                                                            <span className="user-name" style={{ color: "#9333ea" }}>
                                                                {d.processingDecision || d.processingPreference || "Refurbishment"}
                                                            </span>
                                                            <span className="user-email">Condition: {d.condition || "Inspected"}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ padding: "0.3rem 0.65rem", borderRadius: "9999px", background: "#faf5ff", color: "#9333ea", border: "1px solid #e9d5ff", fontSize: "0.775rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                            <FiCpu /> Refurbishment Center
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {isWaiting ? (
                                                            <span style={{ padding: "0.3rem 0.65rem", borderRadius: "9999px", background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", fontSize: "0.775rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                                <FiClock /> Waiting Manual
                                                            </span>
                                                        ) : isAllocated ? (
                                                            <span style={{ padding: "0.3rem 0.65rem", borderRadius: "9999px", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", fontSize: "0.775rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                                <FiCheckCircle /> Assigned
                                                            </span>
                                                        ) : (
                                                            <span style={{ padding: "0.3rem 0.65rem", borderRadius: "9999px", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", fontSize: "0.775rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                                <FiClock /> Pending Allocation
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button
                                                                className="action-btn action-btn--allocate"
                                                                style={{ background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", display: "inline-flex", alignItems: "center", gap: "0.35rem", fontWeight: 700, padding: "0.45rem 0.85rem", borderRadius: "10px", cursor: "pointer" }}
                                                                onClick={() => {
                                                                    setAllocatingDevice(d);
                                                                    setSelectedCenterId("auto");
                                                                }}
                                                            >
                                                                <FiRotateCcw />
                                                                <span>{isAllocated ? "Re-Allocate Center" : "Allocate Refurbishment Center"}</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="admin-cards-grid">
                                {filteredDevices.map((d, idx) => {
                                    const lcs = (d.lifecycleStatus || "").toLowerCase();
                                    const isWaiting = lcs === "refurbishmentcenterpending" || lcs === "waiting";
                                    const isAllocated = lcs === "refurbishmentcenterassigned" || lcs === "refurbishment" || lcs === "refurbishmentcenteraccepted";

                                    return (
                                        <div key={d.deviceId || idx} className="admin-pickup-card">
                                            <div>
                                                <div className="admin-card-header">
                                                    <div className="admin-card-top-row">
                                                        <div className="admin-cat-icon-box" style={{ background: "#faf5ff", color: "#9333ea" }}>
                                                            <FiCpu />
                                                        </div>
                                                        {isWaiting ? (
                                                            <span style={{ padding: "0.3rem 0.65rem", borderRadius: "9999px", background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", fontSize: "0.775rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                                <FiClock /> Waiting Manual
                                                            </span>
                                                        ) : isAllocated ? (
                                                            <span style={{ padding: "0.3rem 0.65rem", borderRadius: "9999px", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", fontSize: "0.775rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                                <FiCheckCircle /> Assigned
                                                            </span>
                                                        ) : (
                                                            <span style={{ padding: "0.3rem 0.65rem", borderRadius: "9999px", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", fontSize: "0.775rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                                <FiClock /> Pending Allocation
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="admin-card-title-group">
                                                        <span className="admin-card-brand-name">{d.brand || "Device"} {d.model || ""}</span>
                                                        <span className="admin-card-sub-info">
                                                            Device #{d.deviceId} &bull; {d.categoryName || "E-Waste"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="admin-card-body-details">
                                                    <div className="admin-detail-row">
                                                        <FiCpu className="detail-icon" style={{ color: "#9333ea" }} />
                                                        <div>
                                                            <div className="detail-label">Decision & Condition</div>
                                                            <div className="detail-val" style={{ color: "#9333ea", fontWeight: 700 }}>{d.processingDecision || d.processingPreference || "Refurbishment"}</div>
                                                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Condition: {d.condition || "Inspected"}</div>
                                                        </div>
                                                    </div>

                                                    <div className="admin-detail-row">
                                                        <FiRotateCcw className="detail-icon" />
                                                        <div>
                                                            <div className="detail-label">Target Facility</div>
                                                            <div className="detail-val">Refurbishment Center</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px dashed #e2e8f0" }}>
                                                <button
                                                    onClick={() => {
                                                        setAllocatingDevice(d);
                                                        setSelectedCenterId("auto");
                                                    }}
                                                    title={isAllocated ? "Re-Allocate Center" : "Allocate Refurbishment Center"}
                                                    style={{
                                                        width: "100%",
                                                        height: "42px",
                                                        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                                                        color: "#ffffff",
                                                        border: "none",
                                                        borderRadius: "10px",
                                                        fontSize: "0.85rem",
                                                        fontWeight: 700,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "0.55rem",
                                                        boxShadow: "0 4px 14px rgba(5, 150, 105, 0.28)",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s ease"
                                                    }}
                                                >
                                                    <FiRotateCcw style={{ fontSize: "1rem" }} />
                                                    <span>{isAllocated ? "Re-Allocate Center" : "Allocate Refurbishment Center"}</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* Allocation Modal */}
                {allocatingDevice && (
                    <div className="alloc-modal-overlay" onClick={() => setAllocatingDevice(null)}>
                        <div className="alloc-modal-dialog" style={{ maxWidth: "600px", padding: "1.5rem" }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                                    Allocate Refurbishment Center
                                </h3>
                                <button onClick={() => setAllocatingDevice(null)} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FiX />
                                </button>
                            </div>

                            <div style={{ marginBottom: "1rem" }}>
                                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem" }}>
                                    Select Active Refurbishment Center
                                </label>
                                <select
                                    value={selectedCenterId}
                                    onChange={(e) => setSelectedCenterId(e.target.value)}
                                    style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.875rem" }}
                                >
                                    <option value="auto">✨ Auto-Allocate Best Available Center</option>
                                    {activeCenters.map(c => {
                                        const cId = c.refurbishmentCenterId || c.id;
                                        const cName = c.centerName || c.name || "Refurbishment Center";
                                        return (
                                            <option key={cId} value={cId}>
                                                {cName} ({c.city || c.state || "Hub"})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {modalError && <div style={{ color: "#dc2626", fontSize: "0.8rem", marginBottom: "1rem" }}>{modalError}</div>}

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                                <button onClick={() => setAllocatingDevice(null)} style={{ padding: "0.55rem 1.25rem", borderRadius: "10px", background: "#ffffff", border: "1px solid #cbd5e1", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                                <button onClick={handleConfirmAllocation} style={{ padding: "0.55rem 1.35rem", borderRadius: "10px", background: "#10b981", color: "#ffffff", border: "none", fontWeight: 700, cursor: "pointer" }} disabled={modalLoading}>
                                    {modalLoading ? "Allocating..." : "Confirm Allocation"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RefurbishmentAllocation;
