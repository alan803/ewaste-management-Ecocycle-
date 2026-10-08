import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import {
    FiRefreshCw,
    FiBell,
    FiCheckCircle,
    FiClock,
    FiUser,
    FiSearch,
    FiGrid,
    FiList,
    FiCpu,
    FiSmartphone,
    FiTv,
    FiBox,
    FiX,
    FiActivity,
    FiEye,
    FiShield,
    FiCalendar,
    FiMapPin,
    FiDollarSign,
    FiLayers,
    FiPackage,
    FiPrinter,
    FiCheck,
    FiAlertTriangle,
    FiUserCheck
} from "react-icons/fi";
import { FaLeaf, FaQrcode } from "react-icons/fa";
import "./Manage_recyclingprocess.css";

const API_BASE = "https://localhost:7102/api";

function ManageRecyclingProcess() {
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All"); // 'All' | 'Assigned' | 'Processing' | 'Completed'
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

    // Modal States
    const [selectedItem, setSelectedItem] = useState(null);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [showCertificateModal, setShowCertificateModal] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const certificateRef = useRef();

    useEffect(() => {
        fetchProcesses();
    }, []);

    const fetchProcesses = async () => {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/RecyclingProcess/all-processes`, { headers });
            if (res.data) {
                setProcesses(res.data);
            }
        } catch (err) {
            console.error("Failed fetching all-processes, falling back to admin/requests:", err);
            try {
                const fallbackRes = await axios.get(`${API_BASE}/AllocateRecyclingCenter/admin/requests`, { headers });
                if (fallbackRes.data) {
                    setProcesses(fallbackRes.data.map(item => ({
                        requestId: item.recyclingCenterRequestId,
                        deviceId: item.deviceId,
                        status: item.status,
                        assignedAt: item.assignedAt,
                        createdAt: item.createdAt,
                        brand: item.brand,
                        model: item.model,
                        categoryName: item.categoryName,
                        weight: item.weight,
                        quantity: item.quantity,
                        serialNumber: `SN-${item.deviceId}`,
                        deviceQrToken: `QR-ECO-${item.deviceId}`,
                        customerName: item.customerName,
                        customerCity: item.customerCity,
                        recyclingCenterName: item.recyclingCenterName || "EcoCycle Certified Center",
                        recyclingCenterCity: item.recyclingCenterCity || "City Facility",
                        recoveredMaterials: [],
                        process: {
                            status: item.status,
                            totalRecoveredWeight: item.status === "Completed" ? (item.weight * 0.85) : 0,
                            totalMaterialValue: item.status === "Completed" ? 1850 : 0,
                            processingCost: 400
                        }
                    })));
                }
            } catch (fbErr) {
                console.error("Error fetching fallback data:", fbErr);
            }
        } finally {
            setLoading(false);
        }
    };

    // Calculate Analytics Statistics
    const totalCount = processes.length;
    const assignedCount = processes.filter(p => {
        const s = (p.status || "").toLowerCase();
        return s === "assigned" || s === "waiting";
    }).length;
    const processingCount = processes.filter(p => (p.status || "").toLowerCase() === "processing" || (p.process?.status || "").toLowerCase() === "processing").length;
    const completedCount = processes.filter(p => (p.status || "").toLowerCase() === "completed" || (p.process?.status || "").toLowerCase() === "completed").length;

    const totalWeightRecovered = useMemo(() => {
        const w = processes.reduce((acc, p) => acc + Number(p.process?.totalRecoveredWeight || (p.status === "Completed" ? p.weight * 0.85 : 0)), 0);
        return w.toFixed(1);
    }, [processes]);

    const totalValueRecovered = useMemo(() => {
        const v = processes.reduce((acc, p) => acc + Number(p.process?.totalMaterialValue || 0), 0);
        return v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    }, [processes]);

    // Filter Data
    const filteredProcesses = useMemo(() => {
        return processes.filter(item => {
            const status = (item.process?.status || item.status || "").toLowerCase();

            if (activeTab === "Assigned" && status !== "assigned" && status !== "waiting") return false;
            if (activeTab === "Processing" && status !== "processing") return false;
            if (activeTab === "Completed" && status !== "completed") return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            const devName = `${item.brand || ""} ${item.model || ""}`.toLowerCase();
            const catName = String(item.categoryName || "").toLowerCase();
            const serial = String(item.serialNumber || "").toLowerCase();
            const qr = String(item.deviceQrToken || "").toLowerCase();
            const reqId = String(item.requestId || "");
            const cust = String(item.customerName || "").toLowerCase();
            const facility = String(item.recyclingCenterName || "").toLowerCase();
            const city = String(item.recyclingCenterCity || "").toLowerCase();
            const cert = String(item.certificateId || "").toLowerCase();

            return (
                devName.includes(q) ||
                catName.includes(q) ||
                serial.includes(q) ||
                qr.includes(q) ||
                reqId.includes(q) ||
                cust.includes(q) ||
                facility.includes(q) ||
                city.includes(q) ||
                cert.includes(q)
            );
        }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }, [processes, activeTab, searchQuery]);

    const getCategoryIcon = (categoryName) => {
        const cat = (categoryName || "").toLowerCase();
        if (cat.includes("laptop") || cat.includes("computer") || cat.includes("pc")) return <FiCpu />;
        if (cat.includes("mobile") || cat.includes("phone") || cat.includes("tablet")) return <FiSmartphone />;
        if (cat.includes("tv") || cat.includes("display") || cat.includes("monitor")) return <FiTv />;
        return <FiBox />;
    };

    const getStatusBadge = (item) => {
        const isCompleted = item.status === "Completed" || item.process?.status === "Completed";
        const isProcessing = item.status === "Processing" || item.process?.status === "Processing";

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

        if (isCompleted) {
            return (
                <span style={{ ...badgeStyle, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}>
                    <FiCheckCircle /> Certified Recycled
                </span>
            );
        } else if (isProcessing) {
            return (
                <span style={{ ...badgeStyle, background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}>
                    <FiActivity /> In Disassembly
                </span>
            );
        } else {
            return (
                <span style={{ ...badgeStyle, background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                    <FiClock /> {item.status || "Assigned"}
                </span>
            );
        }
    };

    const getDeadlineBadge = (item) => {
        const isCompleted = item.status === "Completed" || item.process?.status === "Completed";
        if (isCompleted) {
            return (
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "0.25rem 0.6rem", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <FiCheckCircle /> SLA Met
                </span>
            );
        }

        const deadlineStr = item.processDeadline || item.process?.completionDeadline || item.responseDeadline;
        if (!deadlineStr) {
            const isProcessing = item.status === "Processing" || item.process?.status === "Processing";
            return (
                <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                    {isProcessing ? "10-Day SLA Active" : "Pending Intake"}
                </span>
            );
        }

        try {
            const deadlineDate = new Date(deadlineStr);
            const now = new Date();
            const diffMs = deadlineDate.getTime() - now.getTime();
            const isOverdue = diffMs <= 0;

            if (isOverdue) {
                return (
                    <div style={{ display: "inline-flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", padding: "0.2rem 0.55rem", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                            <FiAlertTriangle /> Overdue
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "#991b1b", marginTop: "2px", fontWeight: 600 }}>
                            {deadlineDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                    </div>
                );
            }

            const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
            const days = Math.floor(totalHours / 24);
            const hours = totalHours % 24;

            return (
                <div style={{ display: "inline-flex", flexDirection: "column" }}>
                    <span style={{ 
                        fontSize: "0.75rem", 
                        fontWeight: 700, 
                        color: days <= 1 ? "#d97706" : "#2563eb", 
                        background: days <= 1 ? "#fffbeb" : "#eff6ff", 
                        border: `1px solid ${days <= 1 ? "#fde68a" : "#bfdbfe"}`, 
                        padding: "0.2rem 0.55rem", 
                        borderRadius: "6px", 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "0.3rem" 
                    }}>
                        <FiClock /> {days > 0 ? `${days}d ${hours}h left` : `${hours}h left`}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px" }}>
                        {deadlineDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                </div>
            );
        } catch {
            return <span style={{ fontSize: "0.75rem", color: "#64748b" }}>—</span>;
        }
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

    const parseJsonArray = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === "string") {
            try {
                const parsed = JSON.parse(val);
                if (Array.isArray(parsed)) return parsed;
                if (parsed && typeof parsed === "object") {
                    if (Array.isArray(parsed.components)) return parsed.components;
                    return Object.entries(parsed).map(([k, v]) => (typeof v === "object" ? { name: k, ...v } : { name: k, value: v }));
                }
                return [];
            } catch {
                return [];
            }
        }
        if (typeof val === "object" && val !== null) {
            return Object.values(val);
        }
        return [];
    };

    const parseHazardousEvidence = (raw) => {
        if (!raw) return [];
        let data = raw;
        if (typeof raw === "string") {
            try {
                data = JSON.parse(raw);
            } catch {
                if (raw.startsWith("data:") || raw.startsWith("http") || raw.startsWith("/")) {
                    return [{ name: "Hazardous Photo Evidence", photo: raw }];
                }
                return [];
            }
        }

        if (!data) return [];

        // Case 1: Standard Array
        if (Array.isArray(data)) {
            return data.map((item, idx) => {
                if (typeof item === "string") return { name: `Component #${idx + 1}`, photo: item };
                return {
                    name: item?.name || item?.componentName || `Component #${idx + 1}`,
                    photo: item?.photo || item?.photoPath || item?.preview || null
                };
            }).filter(item => item && item.photo);
        }

        // Case 2: Object with components and photos mapping
        if (typeof data === "object") {
            const result = [];
            const photosObj = data.photos || {};
            const componentsList = Array.isArray(data.components) ? data.components : [];

            if (photosObj && typeof photosObj === "object" && !Array.isArray(photosObj)) {
                Object.entries(photosObj).forEach(([compName, photoVal]) => {
                    if (photoVal) {
                        result.push({
                            name: compName,
                            photo: typeof photoVal === "string" ? photoVal : photoVal?.photo || null
                        });
                    }
                });
            }

            componentsList.forEach((comp, idx) => {
                if (comp && comp.photo && !result.some(r => r.name === comp.name)) {
                    result.push({
                        name: comp.name || `Hazardous Component #${idx + 1}`,
                        photo: comp.photo
                    });
                }
            });

            if (result.length === 0) {
                Object.entries(data).forEach(([key, val]) => {
                    if (key !== "components" && key !== "photos" && typeof val === "string" && (val.startsWith("data:") || val.startsWith("http") || val.startsWith("/"))) {
                        result.push({ name: key, photo: val });
                    }
                });
            }

            return result;
        }

        return [];
    };

    const handlePrintCertificate = () => {
        window.print();
    };

    return (
        <div className="admin-inspection-page">
            {/* Sidebar Navigation */}
            <Navbar />

            {/* Main Content Area */}
            <div className="admin-inspection-main">
                {/* Floating Glass Topbar Header */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <div className="command-brand">
                            <h1>Recycling Process Control</h1>
                        </div>
                        <p className="command-subtitle">
                            Monitor device demanufacturing, material yields, hazardous isolation, and zero-landfill certificates
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search device, serial, QR, center..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span className="search-shortcut">⌘K</span>
                        </div>

                        <div className="topbar-actions">
                            <button className="glass-btn notification-btn" title="System Alerts">
                                <FiBell />
                                <span className="pulse-ping"></span>
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

                {/* Analytics Metric Cards Grid */}
                <div className="admin-metrics-grid">
                    <div className="admin-metric-card">
                        <div className="admin-metric-icon total">
                            <FiLayers />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{totalCount}</h3>
                            <p>Total Pipeline</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon alert">
                            <FiClock />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{assignedCount}</h3>
                            <p>Waiting / Assigned</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon active">
                            <FiActivity />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{processingCount}</h3>
                            <p>In Disassembly</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon done">
                            <FiCheckCircle />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{completedCount}</h3>
                            <p>Completed / Certified</p>
                        </div>
                    </div>
                </div>

                {/* Main Operations Panel */}
                <div className="panel-card">
                    {/* Header with Tabs & View Switcher */}
                    <div className="panel-header">
                        <div>
                            <h2 className="panel-title">Recycling Requests Queue</h2>
                            <p className="panel-subtitle">Overview of device recycling operations, facilities, and recovery yields</p>
                        </div>

                        <div className="panel-actions" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                            {/* Filter Pill Group matching Manage_inspection */}
                            <div className="filter-pill-group">
                                {[
                                    { id: "All", label: "All", count: totalCount },
                                    { id: "Assigned", label: "Waiting / Assigned", count: assignedCount },
                                    { id: "Processing", label: "In Processing", count: processingCount },
                                    { id: "Completed", label: "Completed", count: completedCount }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        className={`pill-btn ${activeTab === tab.id ? "pill-btn--active" : ""}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        {tab.label} ({tab.count})
                                    </button>
                                ))}
                            </div>

                            {/* View Mode Toggle */}
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

                    {/* Content Section: Loading, Empty, Table or Grid */}
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading recycling processes data...</p>
                        </div>
                    ) : filteredProcesses.length === 0 ? (
                        <div className="no-data-state">
                            <FiLayers className="no-data-icon" />
                            <h3>No recycling requests found</h3>
                            <p>There are no items matching your selected criteria or search term.</p>
                        </div>
                    ) : viewMode === "table" ? (
                        /* TABLE VIEW */
                        <div className="glass-table-wrapper">
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Device / Item</th>
                                        <th>Category</th>
                                        <th>Customer</th>
                                        <th>Recycling Facility</th>
                                        <th>Status</th>
                                        <th>SLA / Deadline</th>
                                        <th>Recovered Yield</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProcesses.map((item) => {
                                        const isCompleted = item.status === "Completed" || item.process?.status === "Completed";
                                        const totalWeight = item.process?.totalRecoveredWeight || (isCompleted ? item.weight * 0.85 : 0);
                                        const totalVal = item.process?.totalMaterialValue || (isCompleted ? 1850 : 0);
                                        const mats = item.recoveredMaterials || [];

                                        return (
                                            <tr key={item.requestId} className="table-row-hover">
                                                {/* Device */}
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                        <div className="admin-cat-icon-box">
                                                            {getCategoryIcon(item.categoryName)}
                                                        </div>
                                                        <div>
                                                            <div className="user-name">{item.brand} {item.model}</div>
                                                            <div className="user-email">Req #{item.requestId} • SN: {item.serialNumber || `SN-${item.deviceId}`} • {item.weight || 15} kg</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Category */}
                                                <td>
                                                    <span className="cat-tag-pill">{item.categoryName || "E-Waste"}</span>
                                                </td>

                                                {/* Customer */}
                                                <td>
                                                    <div className="user-info">
                                                        <span className="user-name">{item.customerName || "Customer"}</span>
                                                        <span className="user-email">{item.customerCity || "City Hub"}</span>
                                                    </div>
                                                </td>

                                                {/* Facility */}
                                                <td>
                                                    <div className="user-info">
                                                        <span className="user-name" style={{ color: "#0f172a", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                                            <FiUserCheck style={{ color: "#10b981" }} /> {item.recyclingCenterName}
                                                        </span>
                                                        <span className="user-email">{item.recyclingCenterCity}{item.recyclingCenterState ? `, ${item.recyclingCenterState}` : ""}</span>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td>
                                                    {getStatusBadge(item)}
                                                </td>

                                                {/* SLA / Deadline */}
                                                <td>
                                                    {getDeadlineBadge(item)}
                                                </td>

                                                {/* Recovered Yield & Value */}
                                                <td>
                                                    {totalWeight > 0 ? (
                                                        <div className="user-info">
                                                            <span className="user-name" style={{ color: "#059669" }}>
                                                                {Number(totalWeight).toFixed(2)} kg <span style={{ fontSize: "0.75rem", color: "#64748b" }}>({Math.min(100, Math.round((totalWeight / (item.weight || 15)) * 100))}%)</span>
                                                            </span>
                                                            <span className="user-email">₹{Number(totalVal).toLocaleString("en-IN")} valuation</span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: "0.775rem", color: "#94a3b8", fontStyle: "italic" }}>Yield pending</span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td>
                                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                                        <button
                                                            className="action-icon-btn view-btn"
                                                            title="View Details & Process Audit Log"
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setShowAuditModal(true);
                                                            }}
                                                        >
                                                            <FiEye />
                                                        </button>

                                                        {isCompleted && (
                                                            <button
                                                                className="action-icon-btn download-btn"
                                                                title="View Official Zero-Landfill Certificate"
                                                                onClick={() => {
                                                                    setSelectedItem(item);
                                                                    setShowCertificateModal(true);
                                                                }}
                                                            >
                                                                <FiShield />
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
                    ) : (
                        /* GRID VIEW */
                        <div className="admin-grid-container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
                            {filteredProcesses.map((item) => {
                                const isCompleted = item.status === "Completed" || item.process?.status === "Completed";
                                const totalWeight = item.process?.totalRecoveredWeight || (isCompleted ? item.weight * 0.85 : 0);
                                const totalVal = item.process?.totalMaterialValue || (isCompleted ? 1850 : 0);

                                return (
                                    <div key={item.requestId} className="admin-grid-card" style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.9rem", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                                <div className="admin-cat-icon-box">{getCategoryIcon(item.categoryName)}</div>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}>{item.brand} {item.model}</h4>
                                                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Req #{item.requestId} &bull; {item.weight || 15} kg</span>
                                                </div>
                                            </div>
                                            {getStatusBadge(item)}
                                        </div>

                                        <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "10px", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748b" }}>Facility:</span>
                                                <strong style={{ color: "#0f172a" }}>{item.recyclingCenterName}</strong>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748b" }}>Location:</span>
                                                <strong style={{ color: "#0f172a" }}>{item.recyclingCenterCity}</strong>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748b" }}>SLA Deadline:</span>
                                                {getDeadlineBadge(item)}
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748b" }}>Recovered Mass:</span>
                                                <strong style={{ color: "#059669" }}>{totalWeight > 0 ? `${Number(totalWeight).toFixed(2)} kg` : "In Progress"}</strong>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748b" }}>Material Valuation:</span>
                                                <strong style={{ color: "#059669" }}>₹{Number(totalVal).toLocaleString("en-IN")}</strong>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                                            <button
                                                className="btn-card-primary"
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setShowAuditModal(true);
                                                }}
                                                style={{ flex: 1, padding: "0.5rem", justifyContent: "center", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", fontWeight: 600, borderRadius: "8px", cursor: "pointer" }}
                                            >
                                                <FiEye /> Process Audit
                                            </button>
                                            {isCompleted && (
                                                <button
                                                    className="btn-card-success"
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setShowCertificateModal(true);
                                                    }}
                                                    style={{ flex: 1, padding: "0.5rem", justifyContent: "center", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", fontWeight: 600, borderRadius: "8px", cursor: "pointer" }}
                                                >
                                                    <FiShield /> Certificate
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* AUDIT & DISASSEMBLY VERIFICATION MODAL */}
            {showAuditModal && selectedItem && (
                <div className="admin-modal-backdrop" onClick={() => setShowAuditModal(false)}>
                    <div className="admin-modal-card modal-large mrp-audit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                <div className="admin-cat-icon-box" style={{ background: "#ecfdf5", color: "#059669", width: "42px", height: "42px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                                    <FiActivity />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>Recycling &amp; Disassembly Audit Log</h3>
                                    <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "2px 0 0 0" }}>Hardware verification, data sanitization, hazardous isolation, and material manifest for Device #{selectedItem.deviceId}</p>
                                </div>
                            </div>
                            <button className="admin-modal-close" onClick={() => setShowAuditModal(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="admin-modal-body">
                            {/* Device & Facility Hero Summary Card */}
                            <div className="mrp-audit-hero">
                                <div className="hero-col">
                                    <span className="hero-label">Device Under Recycling</span>
                                    <h3 className="hero-title">{selectedItem.brand} {selectedItem.model}</h3>
                                    <div className="hero-tags">
                                        <span className="tag-pill">{selectedItem.categoryName || "E-Waste"}</span>
                                        <span className="tag-pill">Original Weight: {selectedItem.weight || 15} kg</span>
                                        <span className="tag-pill qr-tag">QR: {selectedItem.deviceQrToken || `ECOQR-DEV-${selectedItem.deviceId}`}</span>
                                    </div>
                                </div>

                                <div className="hero-col">
                                    <span className="hero-label">Certified Recycling Facility</span>
                                    <h3 className="hero-title">{selectedItem.recyclingCenterName}</h3>
                                    <div className="hero-tags">
                                        <span className="tag-pill"><FiMapPin /> {selectedItem.recyclingCenterCity || "Facility Hub"}</span>
                                        <span className="tag-pill"><FiUser /> Customer: {selectedItem.customerName || "Customer"}</span>
                                    </div>
                                </div>

                                <div className="hero-col hero-status-col">
                                    <span className="hero-label">Processing Status</span>
                                    <div style={{ marginTop: "6px" }}>
                                        {getStatusBadge(selectedItem)}
                                    </div>
                                </div>
                            </div>

                            {/* 6-Step Disassembly & Verification Audit Sections */}
                            <div className="mrp-audit-sections-grid">
                                {/* Section 1: Physical Inspection */}
                                <div className="audit-card">
                                    <div className="audit-card-head">
                                        <FiCheckCircle className="head-icon icon-emerald" />
                                        <h4>1. Physical Inspection &amp; Part Integrity</h4>
                                    </div>
                                    <div className="audit-card-body">
                                        <div className="audit-info-row">
                                            <span className="info-label">Visible Exterior Damage:</span>
                                            <strong className="info-value">{selectedItem.process?.visibleDamage || "None / Minor Wear"}</strong>
                                        </div>
                                        <div className="audit-info-row">
                                            <span className="info-label">Missing Hardware Parts:</span>
                                            <strong className="info-value">{selectedItem.process?.missingParts || "None (All parts intact)"}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Data Sanitization */}
                                <div className="audit-card">
                                    <div className="audit-card-head">
                                        <FiShield className="head-icon icon-blue" />
                                        <h4>2. Data Security &amp; Storage Sanitization</h4>
                                    </div>
                                    <div className="audit-card-body">
                                        <div className="audit-info-row">
                                            <span className="info-label">Data Storage Present:</span>
                                            <strong className="info-value">{selectedItem.process?.dataFound || "No"}</strong>
                                        </div>
                                        <div className="audit-info-row">
                                            <span className="info-label">Sanitization Performed:</span>
                                            <strong className="info-value" style={{ color: selectedItem.process?.sanitizationPerformed === "Not Required" ? "#64748b" : "#059669" }}>
                                                {selectedItem.process?.sanitizationPerformed || "Not Required"}
                                            </strong>
                                        </div>
                                        <div className="audit-info-row">
                                            <span className="info-label">Sanitization Method:</span>
                                            <strong className="info-value">{selectedItem.process?.sanitizationMethod || "Physical Destruction"}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Hazardous Isolation & Photo Evidence */}
                                <div className="audit-card full-width">
                                    <div className="audit-card-head">
                                        <FiAlertTriangle className="head-icon icon-amber" />
                                        <h4>3. Hazardous Components Isolation &amp; Environmental Protection</h4>
                                    </div>
                                    <div className="audit-card-body">
                                        <div className="hazardous-grid">
                                            <div className="hazardous-box">
                                                <span className="h-label">Battery Condition</span>
                                                <strong className="h-val">{selectedItem.process?.batteryCondition || "Intact / Terminals Taped"}</strong>
                                            </div>
                                            <div className="hazardous-box">
                                                <span className="h-label">Isolated Storage Bay</span>
                                                <strong className="h-val">{selectedItem.process?.hazardousStorageArea || "Flammable Sealed Cabinet #B2"}</strong>
                                            </div>
                                            <div className="hazardous-box">
                                                <span className="h-label">Hazardous Waste Weight</span>
                                                <strong className="h-val">{selectedItem.process?.hazardousWasteWeight ? `${selectedItem.process.hazardousWasteWeight} kg` : "0.45 kg"}</strong>
                                            </div>
                                            <div className="hazardous-box full-span">
                                                <span className="h-label">Disposal &amp; Treatment Protocol</span>
                                                <strong className="h-val">{selectedItem.process?.disposalMethod || "Neutralization at Authorized Hazardous Waste Treatment Facility (TSDF)"}</strong>
                                            </div>
                                        </div>

                                        {/* Hazardous Isolation Photos */}
                                        {selectedItem.process?.hazardousComponentsJson && (
                                            <div className="photo-evidence-wrap">
                                                <span className="photo-title"><FiEye /> Mandatory Photographic Evidence of Isolated Hazardous Materials:</span>
                                                <div className="photo-gallery">
                                                    {parseHazardousEvidence(selectedItem.process.hazardousComponentsJson).map((item, idx) => (
                                                        item.photo ? (
                                                            <div key={idx} className="evidence-photo-card" onClick={() => setSelectedPhoto(item.photo)}>
                                                                <img src={item.photo} alt={`Isolated ${item.name || "Hazardous part"}`} />
                                                                <span className="photo-caption">{item.name || `Component #${idx + 1}`}</span>
                                                            </div>
                                                        ) : null
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Section 4: Recovered Raw Material Fractions */}
                                <div className="audit-card full-width">
                                    <div className="audit-card-head">
                                        <FaLeaf className="head-icon icon-emerald" />
                                        <h4>4. Separated Recovered Raw Material Fractions</h4>
                                    </div>
                                    <div className="audit-card-body">
                                        {Array.isArray(selectedItem.recoveredMaterials) && selectedItem.recoveredMaterials.length > 0 ? (
                                            <div className="mrp-materials-table-wrap">
                                                <table className="mrp-materials-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Material Stream</th>
                                                            <th>Quantity (kg)</th>
                                                            <th>Market Rate (₹/unit)</th>
                                                            <th>Estimated Valuation</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedItem.recoveredMaterials.map((mat, mIdx) => (
                                                            <tr key={mIdx}>
                                                                <td><strong>{mat.materialName}</strong></td>
                                                                <td>{mat.quantity} {mat.unit || "kg"}</td>
                                                                <td>₹{mat.pricePerUnit}</td>
                                                                <td>₹{(mat.quantity * mat.pricePerUnit).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr>
                                                            <th>Total Material Recovery:</th>
                                                            <th>{selectedItem.process?.totalRecoveredWeight || (selectedItem.weight ? (selectedItem.weight * 0.85).toFixed(2) : 0)} kg</th>
                                                            <th>--</th>
                                                            <th>₹{Number(selectedItem.process?.totalMaterialValue || 1850).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</th>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        ) : (
                                            <p style={{ color: "#64748b", margin: 0, fontSize: "0.85rem", fontStyle: "italic" }}>Standard secondary raw materials scheduled for recovery upon disassembly.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Section 5: Dispatch & Zero-Landfill Destination */}
                                <div className="audit-card">
                                    <div className="audit-card-head">
                                        <FiPackage className="head-icon icon-emerald" />
                                        <h4>5. Packaging &amp; Smelter Dispatch</h4>
                                    </div>
                                    <div className="audit-card-body">
                                        <div className="audit-info-row">
                                            <span className="info-label">Packaging Container:</span>
                                            <strong className="info-value">{selectedItem.process?.packagingContainer || "Anti-Static Wooden Pallet Box"}</strong>
                                        </div>
                                        <div className="audit-info-row">
                                            <span className="info-label">Dispatch Destination:</span>
                                            <strong className="info-value">{selectedItem.process?.dispatchDestination || "National Smelting & Polymer Refining Plant"}</strong>
                                        </div>
                                        <div className="audit-info-row">
                                            <span className="info-label">Residual Non-Recyclable Waste:</span>
                                            <strong className="info-value">{selectedItem.process?.residualWasteWeight || 0.15} kg (Zero Landfill)</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 6: Official Audit Log Details */}
                                <div className="audit-card">
                                    <div className="audit-card-head">
                                        <FiCheck className="head-icon icon-emerald" />
                                        <h4>6. Audit Verification Log</h4>
                                    </div>
                                    <div className="audit-card-body">
                                        <div className="audit-info-row">
                                            <span className="info-label">Audit Reference ID:</span>
                                            <strong className="info-value" style={{ fontFamily: "monospace", color: "#059669" }}>AUD-{selectedItem.requestId}-REC</strong>
                                        </div>
                                        <div className="audit-info-row">
                                            <span className="info-label">Facility Technician:</span>
                                            <strong className="info-value">Certified Recycling Engineer</strong>
                                        </div>
                                        <div className="audit-info-row">
                                            <span className="info-label">Audit Timestamp:</span>
                                            <strong className="info-value">{selectedItem.process?.completedAt ? new Date(selectedItem.process.completedAt).toLocaleString("en-IN") : "In Progress"}</strong>
                                        </div>
                                        <div className="audit-info-row">
                                            <span className="info-label">Process Notes:</span>
                                            <strong className="info-value">{selectedItem.process?.notes || "Complies with E-Waste (Management) Rules 2022 & CPCB guidelines."}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="admin-modal-footer">
                            <button className="btn-modal-cancel" onClick={() => setShowAuditModal(false)}>
                                Close
                            </button>
                            {(selectedItem.status === "Completed" || selectedItem.process?.status === "Completed") && (
                                <button
                                    className="btn-modal-confirm"
                                    onClick={() => {
                                        setShowAuditModal(false);
                                        setShowCertificateModal(true);
                                    }}
                                >
                                    <FiShield style={{ marginRight: "6px" }} /> View Zero-Landfill Certificate
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* EPA ZERO-LANDFILL CERTIFICATE MODAL */}
            {showCertificateModal && selectedItem && (
                <div className="admin-modal-backdrop" onClick={() => setShowCertificateModal(false)}>
                    <div className="admin-modal-card modal-large mrp-cert-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header no-print">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div className="admin-cat-icon-box" style={{ background: "#ecfdf5", color: "#059669" }}>
                                    <FiShield />
                                </div>
                                <div>
                                    <h3>Official Recycling &amp; Recovery Certificate</h3>
                                    <p>Standard Green E-Waste Destruction &amp; Recovery Compliance Document</p>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <button className="admin-modal-close" onClick={() => setShowCertificateModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                        </div>

                        <div className="admin-modal-body">
                            {/* Certificate Printable Document */}
                            <div className="cert-document-frame" ref={certificateRef}>
                                <div className="cert-border-outer">
                                    <div className="cert-border-inner">
                                        {/* Certificate Header */}
                                        <div className="cert-header">
                                            <div className="cert-brand">
                                                <FaLeaf className="cert-leaf" />
                                                <span className="cert-brand-title">EcoCycle</span>
                                                <span className="cert-brand-sub">SUSTAINABLE E-WASTE MANAGEMENT PLATFORM</span>
                                            </div>
                                            <div className="cert-id-tag">
                                                <span>CERTIFICATE ID</span>
                                                <strong>{selectedItem.certificateId || `ECO-REC-${new Date().getFullYear()}-${String(selectedItem.requestId).padStart(6, '0')}`}</strong>
                                            </div>
                                        </div>

                                        <div className="cert-title-section">
                                            <h1>CERTIFICATE OF SUSTAINABLE E-WASTE RECYCLING</h1>
                                            <p className="cert-subtitle">Zero-Landfill Eco-Friendly Destruction &amp; Resource Recovery Verification</p>
                                        </div>

                                        {/* Certificate Body Text */}
                                        <p className="cert-declaration">
                                            This is to certify that the electronic equipment specified below was responsibly collected, sanitized, demanufactured, and recycled in full compliance with the <strong>E-Waste (Management) Rules 2022</strong>, ISO 14001 Environmental Management Standards, and Central Pollution Control Board (CPCB) guidelines. All hazardous components have been securely isolated and treated with <strong>Zero-Landfill Impact</strong>.
                                        </p>

                                        {/* Specifications Matrix */}
                                        <div className="cert-details-grid">
                                            <div className="cert-col">
                                                <div className="cert-field">
                                                    <span className="field-lbl">Equipment Model:</span>
                                                    <span className="field-val"><strong>{selectedItem.brand} {selectedItem.model}</strong></span>
                                                </div>
                                                <div className="cert-field">
                                                    <span className="field-lbl">Category:</span>
                                                    <span className="field-val">{selectedItem.categoryName}</span>
                                                </div>
                                                <div className="cert-field">
                                                    <span className="field-lbl">Serial / Device Token:</span>
                                                    <span className="field-val">{selectedItem.serialNumber || `SN-${selectedItem.deviceId}`}</span>
                                                </div>
                                                {selectedItem.purchaseDate && (
                                                    <div className="cert-field">
                                                        <span className="field-lbl">Purchase Date:</span>
                                                        <span className="field-val">{new Date(selectedItem.purchaseDate).toLocaleDateString("en-IN")}</span>
                                                    </div>
                                                )}
                                                <div className="cert-field">
                                                    <span className="field-lbl">Original Weight:</span>
                                                    <span className="field-val">{selectedItem.weight || 15} kg</span>
                                                </div>
                                            </div>

                                            <div className="cert-col">
                                                <div className="cert-field">
                                                    <span className="field-lbl">Registered Owner:</span>
                                                    <span className="field-val"><strong>{selectedItem.customerName || "Customer"}</strong></span>
                                                </div>
                                                <div className="cert-field">
                                                    <span className="field-lbl">Recycling Facility:</span>
                                                    <span className="field-val"><strong>{selectedItem.recyclingCenterName}</strong></span>
                                                </div>
                                                <div className="cert-field">
                                                    <span className="field-lbl">Total Recovered Mass:</span>
                                                    <span className="field-val" style={{ color: "#059669", fontWeight: 700 }}>{selectedItem.process?.totalRecoveredWeight || (selectedItem.weight * 0.85).toFixed(2)} kg</span>
                                                </div>
                                                <div className="cert-field">
                                                    <span className="field-lbl">Date of Completion:</span>
                                                    <span className="field-val">{selectedItem.process?.completedAt ? new Date(selectedItem.process.completedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Material Yield Breakdown */}
                                        {Array.isArray(selectedItem.recoveredMaterials) && selectedItem.recoveredMaterials.length > 0 && (
                                            <div className="cert-material-summary">
                                                <h4>Recovered Secondary Raw Materials</h4>
                                                <div className="cert-mat-badges">
                                                    {selectedItem.recoveredMaterials.map((m, idx) => (
                                                        <span key={idx} className="cert-mat-badge">
                                                            {m.materialName}: <strong>{m.quantity} {m.unit || "kg"}</strong>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Certificate Footer / Stamp / Signatures */}
                                        <div className="cert-footer">
                                            <div className="cert-qr-block">
                                                <FaQrcode className="cert-qr-icon" />
                                                <span>SCAN TO VERIFY<br />ON ECOCYCLE HUB</span>
                                            </div>

                                            <div className="cert-stamp-block">
                                                <div className="stamp-circle">
                                                    <span>ECOCYCLE</span>
                                                    <strong>CERTIFIED</strong>
                                                    <span>ZERO LANDFILL</span>
                                                </div>
                                            </div>

                                            <div className="cert-sign-block">
                                                <div className="sign-line"></div>
                                                <strong>Authorized Compliance Officer</strong>
                                                <span>EcoCycle Recycling Authority</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="admin-modal-footer no-print">
                            <button className="btn-modal-cancel" onClick={() => setShowCertificateModal(false)}>
                                Close
                            </button>
                            <button className="btn-modal-confirm" onClick={handlePrintCertificate}>
                                <FiPrinter style={{ marginRight: "4px" }} /> Print Certificate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Lightbox Modal */}
            {selectedPhoto && (
                <div className="mrp-lightbox-backdrop" onClick={() => setSelectedPhoto(null)}>
                    <div className="mrp-lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img src={selectedPhoto} alt="Hazardous isolation inspection photo" />
                        <button className="mrp-lightbox-close" onClick={() => setSelectedPhoto(null)}>
                            <FiX />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageRecyclingProcess;
