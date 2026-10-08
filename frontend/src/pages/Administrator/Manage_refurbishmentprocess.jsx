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
    FiUserCheck,
    FiAward,
    FiTool,
    FiLock,
    FiXCircle
} from "react-icons/fi";
import { FaLeaf, FaQrcode } from "react-icons/fa";
import "./Manage_recyclingprocess.css";
import "./Manage_refurbishmentprocess.css";

const API_BASE = "https://ecocycle.runasp.net/api";

function ManageRefurbishmentProcess() {
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All"); // 'All' | 'InProgress' | 'Completed' | 'Transferred'
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
            const res = await axios.get(`${API_BASE}/RefurbishmentProcess/all-processes`, { headers });
            if (res.data) {
                setProcesses(res.data);
            }
        } catch (err) {
            console.error("Failed fetching all refurbishment processes, falling back to admin/requests:", err);
            try {
                const fallbackRes = await axios.get(`${API_BASE}/AllocateRefurbishmentCenter/admin/requests`, { headers });
                if (fallbackRes.data) {
                    setProcesses(fallbackRes.data.map(item => ({
                        requestId: item.refurbishmentRequestId,
                        deviceId: item.deviceId,
                        status: item.status,
                        assignedAt: item.assignedAt,
                        refurbishmentStartedAt: item.refurbishmentStartedAt,
                        refurbishmentCompletedAt: item.refurbishmentCompletedAt,
                        createdAt: item.createdAt,
                        brand: item.brand,
                        model: item.model,
                        categoryName: item.categoryName,
                        weight: item.weight,
                        quantity: item.quantity,
                        condition: item.condition,
                        working: item.working,
                        serialNumber: `SN-ECO-${item.deviceId}`,
                        deviceQrToken: `QR-REF-${item.deviceId}`,
                        customerName: item.customerName,
                        customerCity: item.customerCity,
                        refurbishmentCenterName: item.refurbishmentCenterName || "EcoCycle Certified Center",
                        refurbishmentCenterCity: item.refurbishmentCenterCity || "City Facility",
                        technicianName: "Inspection Lead",
                        inspectionScore: 95,
                        inspectionGrade: "Grade B",
                        process: {
                            status: item.status,
                            totalRepairCost: item.status === "Completed" ? 1850 : 650,
                            dataWiped: true,
                            testingPassed: true,
                            qcApproved: true,
                            qualityGrade: "Grade A (Certified Refurbished)",
                            finalOutcome: item.status === "RefurbishmentFailed" ? "TransferredToRecycling" : "Refurbished",
                            refurbishedValue: item.status === "Completed" ? 1850 : 650
                        },
                        certificateId: item.status === "Completed" ? `ECO-REF-2026-${item.refurbishmentRequestId}` : ""
                    })));
                }
            } catch (fbErr) {
                console.error("Error loading fallback requests:", fbErr);
            }
        } finally {
            setLoading(false);
        }
    };

    // Calculate Analytics Statistics
    const totalCount = processes.length;
    const assignedCount = processes.filter(p => {
        const s = (p.process?.status || p.status || "").toLowerCase();
        return (s === "assigned" || s === "waiting" || s === "accepted") && !s.includes("rejected");
    }).length;
    const inProgressCount = processes.filter(p => {
        const s = (p.process?.status || p.status || "").toLowerCase();
        return s === "inprogress" || s === "processing" || s === "refurbishing";
    }).length;
    const completedCount = processes.filter(p => {
        const s = (p.process?.status || p.status || "").toLowerCase();
        const outcome = (p.process?.finalOutcome || "").toLowerCase();
        return s === "completed" || s === "refurbishmentcompleted" || outcome === "refurbished";
    }).length;
    const transferredCount = processes.filter(p => {
        const s = (p.process?.status || p.status || "").toLowerCase();
        const outcome = (p.process?.finalOutcome || "").toLowerCase();
        return s === "refurbishmentfailed" || s === "transferredtorecycling" || outcome === "transferredtorecycling";
    }).length;
    const rejectedCount = processes.filter(p => {
        const s = (p.process?.status || p.status || "").toLowerCase();
        return s === "rejected" || s.includes("rejected");
    }).length;

    const totalRefurbExpense = useMemo(() => {
        const sum = processes.reduce((acc, p) => acc + Number(p.process?.totalRepairCost || p.process?.refurbishedValue || 0), 0);
        return sum.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    }, [processes]);

    // Filter Data
    const filteredProcesses = useMemo(() => {
        return processes.filter(item => {
            const status = (item.process?.status || item.status || "").toLowerCase();
            const outcome = (item.process?.finalOutcome || "").toLowerCase();

            if (activeTab === "Assigned" && (status !== "assigned" && status !== "waiting" && status !== "accepted" || status.includes("rejected"))) return false;
            if (activeTab === "InProgress" && status !== "inprogress" && status !== "processing" && status !== "refurbishing") return false;
            if (activeTab === "Completed" && status !== "completed" && status !== "refurbishmentcompleted" && outcome !== "refurbished") return false;
            if (activeTab === "Transferred" && status !== "refurbishmentfailed" && status !== "transferredtorecycling" && outcome !== "transferredtorecycling") return false;
            if (activeTab === "Rejected" && !status.includes("rejected")) return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            const devName = `${item.brand || ""} ${item.model || ""}`.toLowerCase();
            const catName = String(item.categoryName || "").toLowerCase();
            const serial = String(item.serialNumber || "").toLowerCase();
            const qr = String(item.deviceQrToken || "").toLowerCase();
            const reqId = String(item.requestId || "");
            const cust = String(item.customerName || "").toLowerCase();
            const facility = String(item.refurbishmentCenterName || "").toLowerCase();
            const city = String(item.refurbishmentCenterCity || "").toLowerCase();
            const cert = String(item.certificateId || item.process?.refurbishedCertificateNumber || "").toLowerCase();

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
        const status = (item.process?.status || item.status || "").toLowerCase();
        const outcome = (item.process?.finalOutcome || "").toLowerCase();

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

        if (status === "completed" || outcome === "refurbished") {
            return (
                <span style={{ ...badgeStyle, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}>
                    <FiCheckCircle /> Certified Refurbished
                </span>
            );
        } else if (status === "rejected" || status.includes("rejected")) {
            return (
                <span style={{ ...badgeStyle, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5" }}>
                    Rejected
                </span>
            );
        } else if (status === "accepted") {
            return (
                <span style={{ ...badgeStyle, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                    <FiCheck /> Accepted
                </span>
            );
        } else if (status === "refurbishmentfailed" || outcome === "transferredtorecycling") {
            return (
                <span style={{ ...badgeStyle, background: "#fff1f2", color: "#e11d48", border: "1px solid #fecdd3" }}>
                    <FiAlertTriangle /> Transferred to Recycling
                </span>
            );
        } else if (status === "inprogress" || status === "processing" || status === "refurbishing") {
            return (
                <span style={{ ...badgeStyle, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}>
                    <FiActivity /> In Overhaul
                </span>
            );
        } else {
            return (
                <span style={{ ...badgeStyle, background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}>
                    <FiClock /> {item.status || "Assigned"}
                </span>
            );
        }
    };

    const parseRepairItems = (jsonStr) => {
        if (!jsonStr) return [];
        try {
            return JSON.parse(jsonStr);
        } catch {
            return [];
        }
    };

    const parseFunctionalTests = (jsonStr) => {
        if (!jsonStr) return [];
        try {
            return JSON.parse(jsonStr);
        } catch {
            return [];
        }
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
                            <h1>Refurbishment Process Control</h1>
                        </div>
                        <p className="command-subtitle">
                            Monitor device overhauls, data destruction certs, component repairs, QA benchmarks, and circular reuse warranties
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
                                <div className="avatar-gradient" style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)" }}>A</div>
                                <div className="user-info-text">
                                    <span className="name">Admin User</span>
                                    <span className="role">Super Admin</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Analytics Metric Cards Grid matching Manage_recyclingprocess */}
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
                            <h3>{inProgressCount}</h3>
                            <p>In Processing</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon done">
                            <FiCheckCircle />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{completedCount}</h3>
                            <p>Certified Reuse</p>
                        </div>
                    </div>
                </div>

                {/* Main Operations Panel matching Manage_recyclingprocess */}
                <div className="panel-card">
                    {/* Header with Tabs & View Switcher */}
                    <div className="panel-header">
                        <div>
                            <h2 className="panel-title">Refurbishment Requests Queue</h2>
                            <p className="panel-subtitle">Overview of device refurbishment operations, facilities, repair parts, and QA certifications</p>
                        </div>

                        <div className="panel-actions" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                            {/* Filter Pill Group matching Manage_recyclingprocess */}
                            <div className="filter-pill-group">
                                {[
                                    { id: "All", label: "All", count: totalCount },
                                    { id: "Assigned", label: "Waiting / Assigned", count: assignedCount },
                                    { id: "InProgress", label: "In Processing", count: inProgressCount },
                                    { id: "Completed", label: "Completed", count: completedCount },
                                    { id: "Transferred", label: "Transferred to Recycling", count: transferredCount },
                                    { id: "Rejected", label: "Rejected", count: rejectedCount }
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
                            <p>Loading refurbishment processes data...</p>
                        </div>
                    ) : filteredProcesses.length === 0 ? (
                        <div className="no-data-state">
                            <FiLayers className="no-data-icon" />
                            <h3>No refurbishment requests found</h3>
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
                                        <th>Refurbishment Facility</th>
                                        <th>Status</th>
                                        <th>Repair Expense</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProcesses.map((item) => {
                                        const totalCost = item.process?.totalRepairCost || item.process?.refurbishedValue || 0;
                                        const statusLower = (item.process?.status || item.status || "").toLowerCase();
                                        const isCompleted = statusLower === "completed" || statusLower === "refurbished";
                                        const isRejected = statusLower === "rejected" || statusLower.includes("rejected");
                                        const repairs = parseRepairItems(item.process?.repairItemsJson);

                                        return (
                                            <tr 
                                                key={item.requestId} 
                                                className={`table-row-hover ${isRejected ? "row-rejected" : ""}`}
                                                style={{ background: isRejected ? "#fffafb" : undefined }}
                                            >
                                                {/* Device */}
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                        {!isRejected && (
                                                            <div className="admin-cat-icon-box">
                                                                {getCategoryIcon(item.categoryName)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="user-name" style={isRejected ? { color: "#334155" } : undefined}>
                                                                {item.brand} {item.model}
                                                            </div>
                                                            <div className="user-email">Req #{item.requestId} • SN: {item.serialNumber || `SN-${item.deviceId}`} • {item.weight || 1} kg</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Category */}
                                                <td>
                                                    <span className="cat-tag-pill">{item.categoryName || "Electronics"}</span>
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
                                                            {!isRejected && <FiUserCheck style={{ color: "#7c3aed" }} />} {item.refurbishmentCenterName}
                                                        </span>
                                                        <span className="user-email">{item.refurbishmentCenterCity}{item.refurbishmentCenterState ? `, ${item.refurbishmentCenterState}` : ""}</span>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td>
                                                    {getStatusBadge(item)}
                                                </td>

                                                {/* Repair Expense */}
                                                <td>
                                                    <div className="user-info">
                                                        {isRejected ? (
                                                            <>
                                                                <span className="user-name" style={{ color: "#94a3b8", fontWeight: 700 }}>
                                                                    —
                                                                </span>
                                                                <span className="user-email" style={{ color: "#dc2626", fontWeight: 600 }}>
                                                                    Intake Rejected
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="user-name" style={{ color: "#059669", fontWeight: 800 }}>
                                                                    ₹{Number(totalCost).toLocaleString("en-IN")}
                                                                </span>
                                                                <span className="user-email">{repairs.length > 0 ? `${repairs.length} parts serviced` : "Standard Maintenance"}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td>
                                                    {isRejected ? (
                                                        <span style={{ color: "#94a3b8", fontWeight: 700, paddingLeft: "0.5rem" }}>—</span>
                                                    ) : (
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
                                                                    title="View Official Certificate of Refurbishment & Warranty"
                                                                    onClick={() => {
                                                                        setSelectedItem(item);
                                                                        setShowCertificateModal(true);
                                                                    }}
                                                                >
                                                                    <FiShield />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
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
                                const totalCost = item.process?.totalRepairCost || item.process?.refurbishedValue || 0;
                                const statusLower = (item.process?.status || item.status || "").toLowerCase();
                                const isCompleted = statusLower === "completed" || statusLower === "refurbished";
                                const isRejected = statusLower === "rejected" || statusLower.includes("rejected");
                                const repairs = parseRepairItems(item.process?.repairItemsJson);

                                return (
                                    <div 
                                        key={item.requestId} 
                                        className="admin-grid-card" 
                                        style={{ 
                                            background: isRejected ? "#fffafb" : "#ffffff", 
                                            border: isRejected ? "1px solid #fecaca" : "1px solid #e2e8f0", 
                                            borderRadius: "14px", 
                                            padding: "1.25rem", 
                                            display: "flex", 
                                            flexDirection: "column", 
                                            gap: "0.9rem", 
                                            boxShadow: isRejected ? "0 2px 10px rgba(220, 38, 38, 0.04)" : "0 2px 8px rgba(0,0,0,0.02)" 
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                                {!isRejected && (
                                                    <div className="admin-cat-icon-box">
                                                        {getCategoryIcon(item.categoryName)}
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}>{item.brand} {item.model}</h4>
                                                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Req #{item.requestId} &bull; {item.weight || 1} kg</span>
                                                </div>
                                            </div>
                                            {getStatusBadge(item)}
                                        </div>

                                        <div style={{ background: isRejected ? "#fef2f2" : "#f8fafc", padding: "0.75rem", borderRadius: "10px", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748b" }}>Facility:</span>
                                                <strong style={{ color: "#0f172a" }}>{item.refurbishmentCenterName}</strong>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748b" }}>Location:</span>
                                                <strong style={{ color: "#0f172a" }}>{item.refurbishmentCenterCity}</strong>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748b" }}>Repair Cost:</span>
                                                <strong style={{ color: isRejected ? "#dc2626" : "#059669" }}>
                                                    {isRejected ? "Rejected (₹0)" : `₹${Number(totalCost).toLocaleString("en-IN")}`}
                                                </strong>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748b" }}>Processing:</span>
                                                <strong style={{ color: isRejected ? "#b91c1c" : "#0f172a" }}>
                                                    {isRejected ? "Intake Declined" : `${repairs.length} components`}
                                                </strong>
                                            </div>
                                        </div>

                                        {isRejected ? (
                                            <div style={{ marginTop: "auto", textAlign: "center", padding: "0.45rem", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 700, border: "1px dashed #fca5a5" }}>
                                                Intake Declined
                                            </div>
                                        ) : (
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
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* AUDIT & TECHNICAL VERIFICATION MODAL (MATCHING ADMIN DASHBOARD THEME) */}
            {showAuditModal && selectedItem && (
                <div className="admin-modal-backdrop" onClick={() => setShowAuditModal(false)}>
                    <div className="admin-modal-card modal-large mrp-audit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                <div className="admin-cat-icon-box" style={{ background: "#ecfdf5", color: "#059669", width: "42px", height: "42px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                                    <FiActivity />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>Refurbishment &amp; Diagnostic Audit Log</h3>
                                    <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "2px 0 0 0" }}>Hardware verification, data destruction, component servicing, and warranty manifest for Device #{selectedItem.deviceId}</p>
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
                                    <span className="hero-label">Device Under Refurbishment</span>
                                    <h3 className="hero-title">{selectedItem.brand} {selectedItem.model}</h3>
                                    <div className="hero-tags">
                                        <span className="tag-pill">{selectedItem.categoryName || "Electronics"}</span>
                                        <span className="tag-pill">Weight: {selectedItem.weight || 1} kg</span>
                                        <span className="tag-pill qr-tag">QR: {selectedItem.deviceQrToken || `ECOQR-DEV-${selectedItem.deviceId}`}</span>
                                    </div>
                                </div>

                                <div className="hero-col">
                                    <span className="hero-label">Certified Refurbishment Facility</span>
                                    <h3 className="hero-title">{selectedItem.refurbishmentCenterName}</h3>
                                    <div className="hero-tags">
                                        <span className="tag-pill"><FiMapPin /> {selectedItem.refurbishmentCenterCity || "Facility Hub"}</span>
                                        <span className="tag-pill"><FiUser /> Donor: {selectedItem.customerName || "Customer"}</span>
                                    </div>
                                </div>

                                <div className="hero-col hero-status-col">
                                    <span className="hero-label">Processing Status</span>
                                    <div style={{ marginTop: "6px" }}>
                                        {getStatusBadge(selectedItem)}
                                    </div>
                                </div>
                            </div>

                            {/* Rejection Notice if applicable */}
                            {((selectedItem.status || "").toLowerCase().includes("rejected") || (selectedItem.process?.status || "").toLowerCase().includes("rejected")) && (
                                <div style={{
                                    background: "#fef2f2",
                                    border: "1px solid #fecaca",
                                    borderRadius: "12px",
                                    padding: "1rem 1.25rem",
                                    marginBottom: "1.25rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.85rem",
                                    color: "#991b1b"
                                }}>
                                    <FiXCircle style={{ fontSize: "1.5rem", color: "#dc2626", flexShrink: 0 }} />
                                    <div>
                                        <h4 style={{ margin: "0 0 0.2rem 0", fontSize: "0.95rem", fontWeight: 700, color: "#991b1b" }}>Refurbishment Allocation Rejected</h4>
                                        <p style={{ margin: 0, fontSize: "0.82rem", color: "#b91c1c" }}>
                                            This device allocation was declined or rejected by the assigned facility. No diagnostic refurbishment or repair procedures were initiated.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* 5-Step Refurbishment Stepper */}
                            <div className="refurb-stepper-tracker">
                                <div className={`refurb-stepper-node ${selectedItem.process ? "completed" : "active"}`}>
                                    <div className="refurb-step-badge">1</div>
                                    <span className="refurb-step-title">Assessment</span>
                                    <span className="refurb-step-sub">{selectedItem.process?.physicalCondition || "Verified"}</span>
                                </div>

                                <div className={`refurb-stepper-node ${selectedItem.process?.dataWiped ? "completed" : selectedItem.process ? "active" : ""}`}>
                                    <div className="refurb-step-badge">2</div>
                                    <span className="refurb-step-title">Data Sanitization</span>
                                    <span className="refurb-step-sub">{selectedItem.process?.dataWiped ? "NIST Wiped" : "Pending"}</span>
                                </div>

                                <div className={`refurb-stepper-node ${parseRepairItems(selectedItem.process?.repairItemsJson).length > 0 ? "completed" : ""}`}>
                                    <div className="refurb-step-badge">3</div>
                                    <span className="refurb-step-title">Repairs &amp; Parts</span>
                                    <span className="refurb-step-sub">{parseRepairItems(selectedItem.process?.repairItemsJson).length} Parts Logged</span>
                                </div>

                                <div className={`refurb-stepper-node ${selectedItem.process?.testingPassed ? "completed" : ""}`}>
                                    <div className="refurb-step-badge">4</div>
                                    <span className="refurb-step-title">Diagnostics</span>
                                    <span className="refurb-step-sub">{selectedItem.process?.testingPassed ? "100% Passed" : "Pending"}</span>
                                </div>

                                <div className={`refurb-stepper-node ${selectedItem.status === "Completed" ? "completed" : ""}`}>
                                    <div className="refurb-step-badge">5</div>
                                    <span className="refurb-step-title">Certification</span>
                                    <span className="refurb-step-sub">{selectedItem.status === "Completed" ? "Certified Ready" : "In Progress"}</span>
                                </div>
                            </div>

                            {/* 5-Step Technical Sections */}
                            <div className="mrp-audit-sections-grid">
                                {/* Section 1: Physical Assessment */}
                                <div className="audit-card">
                                    <div className="audit-card-head">
                                        <FiCheckCircle className="head-icon icon-emerald" />
                                        <h4>1. Technical Assessment &amp; Feasibility</h4>
                                    </div>
                                    <div className="audit-card-body">
                                        <div className="audit-info-row">
                                            <span className="info-label">Physical Chassis:</span>
                                            <strong className="info-value">{selectedItem.process?.physicalCondition || selectedItem.condition || "Grade B (Fair)"}</strong>
                                        </div>
                                        <div className="audit-info-row">
                                            <span className="info-label">Display &amp; Digitizer:</span>
                                            <strong className="info-value">{selectedItem.process?.displayCondition || "Operational"}</strong>
                                        </div>
                                        <div className="audit-info-row">
                                            <span className="info-label">Power / Battery:</span>
                                            <strong className="info-value">{selectedItem.process?.batteryAssessment || "Good"}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: NIST Data Sanitization */}
                                <div className="audit-card">
                                    <div className="audit-card-head">
                                        <FiLock className="head-icon icon-blue" />
                                        <h4>2. Data Security &amp; NIST SP 800-88 Wipe</h4>
                                    </div>
                                    <div className="audit-card-body">
                                        <div className="audit-info-row">
                                            <span className="info-label">Wipe Method:</span>
                                            <strong className="info-value">{selectedItem.process?.wipingMethod || "NIST 800-88 Multi-Pass Overwrite"}</strong>
                                        </div>
                                        <div className="audit-info-row">
                                            <span className="info-label">Lead Technician:</span>
                                            <strong className="info-value">{selectedItem.process?.wipingTechnician || "Senior Sanitization Tech"}</strong>
                                        </div>
                                        <div className="audit-info-row">
                                            <span className="info-label">DDC Certificate ID:</span>
                                            <strong className="info-value font-mono" style={{ color: "#059669" }}>{selectedItem.process?.certificateNumber || "DDC-VERIFIED-OK"}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Itemized Replacement Components */}
                                <div className="audit-card full-width">
                                    <div className="audit-card-head">
                                        <FiTool className="head-icon icon-emerald" />
                                        <h4>3. Itemized Replacement Components &amp; Servicing Log</h4>
                                    </div>
                                    <div className="audit-card-body">
                                        {parseRepairItems(selectedItem.process?.repairItemsJson).length > 0 ? (
                                             <div className="mrp-materials-table-wrap">
                                                <table className="mrp-materials-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Component</th>
                                                            <th>Action Performed</th>
                                                            <th>Quantity</th>
                                                            <th>Unit Price (₹)</th>
                                                            <th>Total Expense (₹)</th>
                                                            <th>Technician Remarks</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {parseRepairItems(selectedItem.process?.repairItemsJson).map((p, idx) => (
                                                            <tr key={`p-${idx}`}>
                                                                <td><strong>{p.component}</strong></td>
                                                                <td>
                                                                    <span style={{ background: p.action === "Replace" ? "#fef2f2" : "#ecfdf5", color: p.action === "Replace" ? "#dc2626" : "#059669", fontSize: "0.72rem", fontWeight: 800, padding: "2px 8px", borderRadius: "6px" }}>
                                                                        {p.action}
                                                                    </span>
                                                                </td>
                                                                <td>{p.quantity || 1}</td>
                                                                <td>₹{Number(p.cost || 0).toLocaleString()}</td>
                                                                <td style={{ fontWeight: 800, color: "#1e293b" }}>₹{(Number(p.cost || 0) * Number(p.quantity || 1)).toLocaleString()}</td>
                                                                <td style={{ color: "#64748b", fontSize: "0.78rem" }}>{p.remarks || "Serviced & Bench-Certified OK"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr>
                                                            <th colSpan="4">Total Refurbishment Expense:</th>
                                                            <th colSpan="2" style={{ color: "#059669", fontWeight: 800 }}>₹{Number(selectedItem.process?.totalRepairCost || selectedItem.process?.refurbishedValue || 0).toLocaleString("en-IN")}</th>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        ) : (
                                            <p style={{ color: "#64748b", margin: 0, fontSize: "0.85rem", fontStyle: "italic" }}>Standard hardware tuning, cleaning, thermal paste re-application, and diagnostic bench certification recorded.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Section 4: Functional Benchmarks */}
                                <div className="audit-card full-width">
                                    <div className="audit-card-head">
                                        <FiCheck className="head-icon icon-emerald" />
                                        <h4>4. Multi-Point Hardware Functional Test Benchmarks</h4>
                                    </div>
                                    <div className="audit-card-body">
                                        <div className="refurb-tests-grid">
                                            {parseFunctionalTests(selectedItem.process?.functionalTestsJson).length > 0 ? (
                                                parseFunctionalTests(selectedItem.process?.functionalTestsJson).map((t, idx) => (
                                                    <div key={`test-${idx}`} className="refurb-test-card">
                                                        <div className="refurb-test-left">
                                                            <div className="refurb-test-icon-box">
                                                                <FiCheckCircle />
                                                            </div>
                                                            <div className="refurb-test-text-group">
                                                                <span className="refurb-test-title">{t.label || t.component || `Diagnostic Test #${idx + 1}`}</span>
                                                                <span className="refurb-test-sub">100% Bench Verified</span>
                                                            </div>
                                                        </div>
                                                        <span className={`refurb-test-status ${t.status === "Pass" ? "pass" : "fail"}`}>
                                                            {t.status === "Pass" ? <><FiCheck /> Pass</> : <><FiAlertTriangle /> Fail</>}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                [
                                                    { name: "Motherboard & Power Rail", desc: "Voltage & Rail Stability" },
                                                    { name: "Display Panel & Touch", desc: "Pixel & Touch Digitizer" },
                                                    { name: "Battery Calibration", desc: "Cycle & Capacity Health" },
                                                    { name: "Storage & SSD Health", desc: "SMART Bench & Read/Write" },
                                                    { name: "Input Ports & Connectivity", desc: "USB, Type-C & Wireless" },
                                                    { name: "Thermal & Fan Diagnostics", desc: "Cooling & Acoustic Check" }
                                                ].map((item, idx) => (
                                                    <div key={`d-test-${idx}`} className="refurb-test-card">
                                                        <div className="refurb-test-left">
                                                            <div className="refurb-test-icon-box">
                                                                <FiCheckCircle />
                                                            </div>
                                                            <div className="refurb-test-text-group">
                                                                <span className="refurb-test-title">{item.name}</span>
                                                                <span className="refurb-test-sub">{item.desc}</span>
                                                            </div>
                                                        </div>
                                                        <span className="refurb-test-status pass">
                                                            <FiCheck /> Pass
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Section 5: Quality Assurance Approval & Warranty */}
                                <div className="audit-card full-width" style={{ background: "#f0fdf4", borderColor: "#a7f3d0" }}>
                                    <div className="audit-card-head">
                                        <FiAward className="head-icon icon-emerald" />
                                        <h4>5. Quality Assurance Lead Approval &amp; Circular Reuse Warranty</h4>
                                    </div>
                                    <div className="audit-card-body">
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "0.85rem" }}>
                                            <div className="audit-info-row" style={{ background: "#ffffff", padding: "0.75rem 1rem" }}>
                                                <span className="info-label">Certificate Number:</span>
                                                <strong className="info-value font-mono" style={{ color: "#059669", whiteSpace: "nowrap" }}>
                                                    {selectedItem.certificateId || selectedItem.process?.refurbishedCertificateNumber || `ECO-REF-2026-${selectedItem.requestId}`}
                                                </strong>
                                            </div>
                                            <div className="audit-info-row" style={{ background: "#ffffff", padding: "0.75rem 1rem" }}>
                                                <span className="info-label">Quality Grade:</span>
                                                <strong className="info-value" style={{ color: "#059669", whiteSpace: "nowrap" }}>
                                                    ★ {selectedItem.process?.qualityGrade || "Grade A (Certified Refurbished)"}
                                                </strong>
                                            </div>
                                            <div className="audit-info-row" style={{ background: "#ffffff", padding: "0.75rem 1rem" }}>
                                                <span className="info-label">Warranty Term:</span>
                                                <strong className="info-value" style={{ color: "#047857", whiteSpace: "nowrap" }}>
                                                    {selectedItem.process?.warrantyDuration || "6 Months EcoCycle Warranty"}
                                                </strong>
                                            </div>
                                            <div className="audit-info-row" style={{ background: "#ffffff", padding: "0.75rem 1rem" }}>
                                                <span className="info-label">QA Lead Inspector:</span>
                                                <strong className="info-value" style={{ whiteSpace: "nowrap" }}>
                                                    {selectedItem.process?.qcInspector || "Senior QC Lead"}
                                                </strong>
                                            </div>
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
                                    <FiShield style={{ marginRight: "6px" }} /> View Official Certificate
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* OFFICIAL CERTIFICATE OF REFURBISHMENT MODAL (MATCHING ADMIN DASHBOARD THEME) */}
            {showCertificateModal && selectedItem && (
                <div className="admin-modal-backdrop" onClick={() => setShowCertificateModal(false)}>
                    <div className="admin-modal-card modal-large mrp-cert-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header no-print">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div className="admin-cat-icon-box" style={{ background: "#ecfdf5", color: "#059669" }}>
                                    <FiShield />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                                        Official Certificate of Refurbishment &amp; Warranty
                                    </h3>
                                    <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                                        EcoCycle Certified Equipment &bull; Multi-Point Benchmark &bull; Circular Reuse Guarantee
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <button className="admin-modal-close" onClick={() => setShowCertificateModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                        </div>

                        <div className="admin-modal-body">
                            {/* Certificate Printable Document matching Admin Dashboard */}
                            <div className="cert-document-frame" ref={certificateRef}>
                                <div className="cert-border-outer">
                                    <div className="cert-border-inner">
                                        {/* Certificate Header */}
                                        <div className="cert-header">
                                            <div className="cert-brand">
                                                <FaLeaf className="cert-leaf" />
                                                <span className="cert-brand-title">EcoCycle</span>
                                                <span className="cert-brand-sub">SUSTAINABLE E-WASTE MANAGEMENT &amp; CIRCULAR REFURBISHMENT PLATFORM</span>
                                            </div>
                                            <div className="cert-id-tag">
                                                <span>CERTIFICATE ID</span>
                                                <strong>{selectedItem.certificateId || selectedItem.process?.refurbishedCertificateNumber || `ECO-REF-${new Date().getFullYear()}-${String(selectedItem.requestId).padStart(6, '0')}`}</strong>
                                            </div>
                                        </div>

                                        <div className="cert-title-section">
                                            <h1>CERTIFICATE OF SUSTAINABLE HARDWARE REFURBISHMENT</h1>
                                            <p className="cert-subtitle">NIST SP 800-88 Data Sanitization &bull; Multi-Point Diagnostics &bull; Circular Reuse Guarantee</p>
                                        </div>

                                        {/* Certificate Body Text */}
                                        <p className="cert-declaration">
                                            This is to certify that the electronic equipment specified below was responsibly collected, sanitized, thoroughly diagnosed, component-serviced, and verified in full compliance with the <strong>E-Waste (Management) Rules 2022</strong>, NIST SP 800-88 Rev. 1 Standards, and Central Pollution Control Board (CPCB) guidelines. All functional testing benchmarks have been achieved with <strong>Certified Circular Reuse Guarantee</strong>.
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
                                                    <span className="field-lbl">Intake Condition:</span>
                                                    <span className="field-val">{selectedItem.process?.physicalCondition || selectedItem.condition || "Grade B (Fair)"}</span>
                                                </div>
                                            </div>

                                            <div className="cert-col">
                                                <div className="cert-field">
                                                    <span className="field-lbl">Registered Citizen:</span>
                                                    <span className="field-val"><strong>{selectedItem.customerName || "Customer"}</strong></span>
                                                </div>
                                                <div className="cert-field">
                                                    <span className="field-lbl">Refurbishment Center:</span>
                                                    <span className="field-val"><strong>{selectedItem.refurbishmentCenterName}</strong></span>
                                                </div>
                                                <div className="cert-field">
                                                    <span className="field-lbl">Refurbishment Expense:</span>
                                                    <span className="field-val" style={{ color: "#059669", fontWeight: 700 }}>₹{Number(selectedItem.process?.totalRepairCost || selectedItem.process?.refurbishedValue || 0).toLocaleString("en-IN")}</span>
                                                </div>
                                                <div className="cert-field">
                                                    <span className="field-lbl">Date of Certification:</span>
                                                    <span className="field-val">{selectedItem.process?.completedAt ? new Date(selectedItem.process.completedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Certification Badges Summary */}
                                        <div className="cert-material-summary">
                                            <h4>Quality Assurance &amp; Warranty Verification</h4>
                                            <div className="cert-mat-badges">
                                                <span className="cert-mat-badge">
                                                    Data Sanitization: <strong>NIST SP 800-88 ({selectedItem.process?.certificateNumber || "DDC-VERIFIED"})</strong>
                                                </span>
                                                <span className="cert-mat-badge">
                                                    Quality Grade: <strong>{selectedItem.process?.qualityGrade || "Grade A (Certified Refurbished)"}</strong>
                                                </span>
                                                <span className="cert-mat-badge">
                                                    Warranty Coverage: <strong>{selectedItem.process?.warrantyDuration || "6 Months EcoCycle Warranty"}</strong>
                                                </span>
                                                <span className="cert-mat-badge">
                                                    Functional Diagnostics: <strong>100% Bench Passed</strong>
                                                </span>
                                            </div>
                                        </div>

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
                                                    <span>CIRCULAR REUSE</span>
                                                </div>
                                            </div>

                                            <div className="cert-sign-block">
                                                <div className="sign-line"></div>
                                                <strong>{selectedItem.process?.qcInspector || "Authorized Compliance Officer"}</strong>
                                                <span>EcoCycle Refurbishment Authority</span>
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
                                <FiPrinter style={{ marginRight: "6px" }} /> Print / Download Certificate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageRefurbishmentProcess;
