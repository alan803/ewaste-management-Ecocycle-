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
    FiTag,
    FiTrendingUp
} from "react-icons/fi";
import { FaLeaf, FaCoins, FaGem, FaRecycle, FaQrcode } from "react-icons/fa";
import "./Manage_materialrecovery.css";

const API_BASE = "https://ecocycle.runasp.net/api";

function ManageMaterialRecovery() {
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [streamFilter, setStreamFilter] = useState("All"); // 'All' | 'Precious' | 'BaseMetals' | 'Polymers' | 'Glass'
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

    // Modals
    const [selectedItem, setSelectedItem] = useState(null);
    const [showManifestModal, setShowManifestModal] = useState(false);
    const [showSlipModal, setShowSlipModal] = useState(false);

    const slipRef = useRef();

    useEffect(() => {
        fetchProcesses();
    }, []);

    const normalizeDeviceMaterials = (item) => {
        if (Array.isArray(item.recoveredMaterials) && item.recoveredMaterials.length > 0) {
            return item.recoveredMaterials.map(m => ({
                materialName: m.materialName,
                quantity: Number(m.quantity || 0),
                unit: m.unit || "kg",
                pricePerUnit: Number(m.pricePerUnit || 0)
            }));
        }

        const cat = (item.categoryName || "").toLowerCase();
        const w = Number(item.weight) || 15;

        if (cat.includes("laptop") || cat.includes("computer") || cat.includes("pc")) {
            return [
                { materialName: "Aluminium Cast & Trim", quantity: Number((w * 0.22).toFixed(2)), unit: "kg", pricePerUnit: 180 },
                { materialName: "Copper Coils & Wiring", quantity: Number((w * 0.12).toFixed(2)), unit: "kg", pricePerUnit: 750 },
                { materialName: "Gold / Precious PCB Traces", quantity: Number((w * 0.28).toFixed(2)), unit: "kg", pricePerUnit: 1250 },
                { materialName: "Structural Steel Chassis", quantity: Number((w * 0.15).toFixed(2)), unit: "kg", pricePerUnit: 65 },
                { materialName: "Recyclable Polymer ABS", quantity: Number((w * 0.10).toFixed(2)), unit: "kg", pricePerUnit: 80 }
            ];
        } else if (cat.includes("mobile") || cat.includes("phone") || cat.includes("tablet")) {
            return [
                { materialName: "Gold / Precious PCB Traces", quantity: Number((w * 0.35).toFixed(2)), unit: "kg", pricePerUnit: 1250 },
                { materialName: "Display Glass Substrate", quantity: Number((w * 0.25).toFixed(2)), unit: "kg", pricePerUnit: 40 },
                { materialName: "Lithium Battery Cells", quantity: Number((w * 0.20).toFixed(2)), unit: "kg", pricePerUnit: 350 },
                { materialName: "Recyclable Polymer ABS", quantity: Number((w * 0.12).toFixed(2)), unit: "kg", pricePerUnit: 80 },
                { materialName: "Copper Coils & Wiring", quantity: Number((w * 0.08).toFixed(2)), unit: "kg", pricePerUnit: 750 }
            ];
        } else if (cat.includes("tv") || cat.includes("monitor") || cat.includes("display")) {
            return [
                { materialName: "Display Glass Substrate", quantity: Number((w * 0.40).toFixed(2)), unit: "kg", pricePerUnit: 40 },
                { materialName: "Recyclable Polymer ABS", quantity: Number((w * 0.25).toFixed(2)), unit: "kg", pricePerUnit: 80 },
                { materialName: "Structural Steel Chassis", quantity: Number((w * 0.20).toFixed(2)), unit: "kg", pricePerUnit: 65 },
                { materialName: "Gold / Precious PCB Traces", quantity: Number((w * 0.10).toFixed(2)), unit: "kg", pricePerUnit: 1250 },
                { materialName: "Copper Coils & Wiring", quantity: Number((w * 0.05).toFixed(2)), unit: "kg", pricePerUnit: 750 }
            ];
        } else {
            return [
                { materialName: "Structural Steel Chassis", quantity: Number((w * 0.35).toFixed(2)), unit: "kg", pricePerUnit: 65 },
                { materialName: "Recyclable Polymer ABS", quantity: Number((w * 0.25).toFixed(2)), unit: "kg", pricePerUnit: 80 },
                { materialName: "Copper Coils & Wiring", quantity: Number((w * 0.15).toFixed(2)), unit: "kg", pricePerUnit: 750 },
                { materialName: "Gold / Precious PCB Traces", quantity: Number((w * 0.12).toFixed(2)), unit: "kg", pricePerUnit: 1250 }
            ];
        }
    };

    const fetchProcesses = async () => {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/RecyclingProcess/all-processes`, { headers });
            if (res.data && Array.isArray(res.data)) {
                const formatted = res.data.map(item => {
                    const mats = normalizeDeviceMaterials(item);
                    const totalW = mats.reduce((s, m) => s + Number(m.quantity || 0), 0);
                    const totalV = mats.reduce((s, m) => s + (Number(m.quantity || 0) * Number(m.pricePerUnit || 0)), 0);

                    return {
                        ...item,
                        recoveredMaterials: mats,
                        process: {
                            ...(item.process || {}),
                            totalRecoveredWeight: item.process?.totalRecoveredWeight || Number(totalW.toFixed(2)),
                            totalMaterialValue: item.process?.totalMaterialValue || totalV
                        }
                    };
                });
                setProcesses(formatted);
            }
        } catch (err) {
            console.error("Failed fetching all-processes, falling back:", err);
            try {
                const fallbackRes = await axios.get(`${API_BASE}/AllocateRecyclingCenter/admin/requests`, { headers });
                if (fallbackRes.data && Array.isArray(fallbackRes.data)) {
                    setProcesses(fallbackRes.data.map(item => {
                        const mats = normalizeDeviceMaterials(item);
                        const totalW = mats.reduce((s, m) => s + Number(m.quantity || 0), 0);
                        const totalV = mats.reduce((s, m) => s + (Number(m.quantity || 0) * Number(m.pricePerUnit || 0)), 0);

                        return {
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
                            recyclingCenterCity: item.recyclingCenterCity || "City Hub",
                            recoveredMaterials: mats,
                            process: {
                                status: item.status,
                                totalRecoveredWeight: Number(totalW.toFixed(2)),
                                totalMaterialValue: totalV,
                                processingCost: 400
                            }
                        };
                    }));
                }
            } catch (fbErr) {
                console.error("Error fetching fallback:", fbErr);
            }
        } finally {
            setLoading(false);
        }
    };

    // Calculate Global Stream Aggregates dynamically from processes data
    const streamAggregates = useMemo(() => {
        const streamMap = {};

        processes.forEach(p => {
            const mats = p.recoveredMaterials || [];
            mats.forEach(m => {
                const rawName = (m.materialName || "Other Material").trim();
                let standardKey = rawName;
                let type = "Base Metal";
                let icon = "generic";

                const lower = rawName.toLowerCase();
                if (lower.includes("copper")) {
                    standardKey = "Copper Coils & Wiring";
                    type = "Base Metal";
                    icon = "copper";
                } else if (lower.includes("alumin")) {
                    standardKey = "Aluminium Cast & Trim";
                    type = "Base Metal";
                    icon = "alu";
                } else if (lower.includes("pcb") || lower.includes("gold") || lower.includes("precious") || lower.includes("circuit") || lower.includes("e-scrap")) {
                    standardKey = "Gold / Precious PCB Traces";
                    type = "Precious";
                    icon = "gold";
                } else if (lower.includes("plastic") || lower.includes("polymer") || lower.includes("abs")) {
                    standardKey = "Recyclable Polymer ABS";
                    type = "Polymer";
                    icon = "plastic";
                } else if (lower.includes("glass") || lower.includes("display") || lower.includes("panel")) {
                    standardKey = "Display Glass Substrate";
                    type = "Glass";
                    icon = "glass";
                } else if (lower.includes("steel") || lower.includes("iron") || lower.includes("chassis") || lower.includes("frame")) {
                    standardKey = "Structural Steel Chassis";
                    type = "Base Metal";
                    icon = "silver";
                } else if (lower.includes("battery") || lower.includes("lithium")) {
                    standardKey = "Lithium Battery Cells";
                    type = "Hazardous/Cell";
                    icon = "copper";
                }

                const qty = Number(m.quantity || 0);
                const rate = Number(m.pricePerUnit || 0);
                const val = qty * rate;

                if (!streamMap[standardKey]) {
                    streamMap[standardKey] = {
                        name: standardKey,
                        type,
                        icon,
                        totalQuantity: 0,
                        unit: m.unit || "kg",
                        pricePerUnit: rate,
                        totalValuation: 0,
                        deviceCount: 0
                    };
                }

                streamMap[standardKey].totalQuantity += qty;
                streamMap[standardKey].totalValuation += val;
                streamMap[standardKey].deviceCount += 1;
                if (rate > 0) {
                    streamMap[standardKey].pricePerUnit = rate;
                }
            });
        });

        return Object.values(streamMap).sort((a, b) => b.totalValuation - a.totalValuation);
    }, [processes]);

    // Analytics KPIs
    const totalValuation = useMemo(() => {
        const total = processes.reduce((sum, p) => {
            if (p.process?.totalMaterialValue) return sum + Number(p.process.totalMaterialValue);
            const mats = Array.isArray(p.recoveredMaterials) ? p.recoveredMaterials : [];
            const matSum = mats.reduce((s, m) => s + (Number(m.quantity || 0) * Number(m.pricePerUnit || 0)), 0);
            return sum + (matSum || (p.status === "Completed" ? 1850 : 0));
        }, 0);
        return total.toLocaleString("en-IN", { maximumFractionDigits: 0 });
    }, [processes]);

    const totalWeightRecovered = useMemo(() => {
        const total = processes.reduce((sum, p) => {
            if (p.process?.totalRecoveredWeight) return sum + Number(p.process.totalRecoveredWeight);
            const mats = Array.isArray(p.recoveredMaterials) ? p.recoveredMaterials : [];
            const matSum = mats.reduce((s, m) => s + Number(m.quantity || 0), 0);
            return sum + (matSum || (p.status === "Completed" ? Number(p.weight || 15) * 0.85 : 0));
        }, 0);
        return total.toFixed(1);
    }, [processes]);

    const totalFacilityCount = useMemo(() => {
        const unique = new Set(processes.map(p => p.recyclingCenterName).filter(Boolean));
        return unique.size || 1;
    }, [processes]);

    // Filter Logic
    const filteredProcesses = useMemo(() => {
        return processes.filter(item => {
            const mats = Array.isArray(item.recoveredMaterials) ? item.recoveredMaterials : [];
            const matsText = mats.map(m => m.materialName).join(" ").toLowerCase();

            // Stream Category Filter
            if (streamFilter === "Precious") {
                const hasPrecious = /gold|silver|palladium|platinum|pcb|circuit/i.test(matsText);
                if (!hasPrecious) return false;
            } else if (streamFilter === "BaseMetals") {
                const hasBase = /copper|aluminium|aluminum|steel|iron|brass|chassis|coil/i.test(matsText);
                if (!hasBase) return false;
            } else if (streamFilter === "Polymers") {
                const hasPoly = /plastic|polymer|abs|polycarbonate/i.test(matsText);
                if (!hasPoly) return false;
            } else if (streamFilter === "Glass") {
                const hasGlass = /glass|display|lens|optic/i.test(matsText);
                if (!hasGlass) return false;
            }

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            const devName = `${item.brand || ""} ${item.model || ""}`.toLowerCase();
            const catName = String(item.categoryName || "").toLowerCase();
            const serial = String(item.serialNumber || "").toLowerCase();
            const facility = String(item.recyclingCenterName || "").toLowerCase();

            return (
                devName.includes(q) ||
                catName.includes(q) ||
                serial.includes(q) ||
                facility.includes(q) ||
                matsText.includes(q)
            );
        }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }, [processes, searchQuery, streamFilter]);

    const getCategoryIcon = (categoryName) => {
        const cat = (categoryName || "").toLowerCase();
        if (cat.includes("laptop") || cat.includes("computer") || cat.includes("pc")) return <FiCpu />;
        if (cat.includes("mobile") || cat.includes("phone") || cat.includes("tablet")) return <FiSmartphone />;
        if (cat.includes("tv") || cat.includes("display") || cat.includes("monitor")) return <FiTv />;
        return <FiBox />;
    };

    const handlePrintSlip = () => {
        window.print();
    };

    return (
        <div className="admin-inspection-page">
            <Navbar />

            <div className="admin-inspection-main">
                {/* Topbar Header */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <div className="command-brand">
                            <h1>Material Recovery Manifest</h1>
                        </div>
                        <p className="command-subtitle">
                            Monitor recovered raw material streams, quantities, smelter yields, and commercial valuations
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search material, device, facility, serial..."
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

                {/* Top Analytics Metrics */}
                <div className="admin-metrics-grid">
                    <div className="admin-metric-card">
                        <div className="admin-metric-icon active" style={{ background: "#ecfdf5", color: "#059669" }}>
                            <FiDollarSign />
                        </div>
                        <div className="admin-metric-info">
                            <h3>₹{totalValuation}</h3>
                            <p>Total Recovery Valuation</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon done" style={{ background: "#e0f2fe", color: "#0284c7" }}>
                            <FaLeaf />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{totalWeightRecovered} kg</h3>
                            <p>Total Mass Recovered</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon alert" style={{ background: "#fef3c7", color: "#d97706" }}>
                            <FiLayers />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{streamAggregates.length} Streams</h3>
                            <p>Active Material Streams</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon total" style={{ background: "#f1f5f9", color: "#475569" }}>
                            <FiPackage />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{totalFacilityCount} Facilities</h3>
                            <p>Contributing Recyclers</p>
                        </div>
                    </div>
                </div>

                {/* Secondary Raw Material Streams Overview */}
                <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Secondary Raw Material Streams</h3>
                            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "2px 0 0 0" }}>High-yield metals, engineering polymers, and precious fractions catalog</p>
                        </div>
                        <Link to="/manage-materialprices" className="mmr-rates-link-btn">
                            <FiTag /> Configure Baseline Market Rates &rarr;
                        </Link>
                    </div>

                    <div className="mmr-streams-grid">
                        {streamAggregates.map((stream, idx) => (
                            <div key={idx} className="mmr-stream-card">
                                <div>
                                    <div className="stream-card-top">
                                        <div className={`stream-icon-box stream-icon-${stream.icon}`}>
                                            {stream.type === "Precious" ? <FaGem /> : <FaRecycle />}
                                        </div>
                                        <span className="cat-tag-pill" style={{ fontSize: "0.68rem" }}>{stream.type}</span>
                                    </div>
                                    <h4 className="stream-card-title">{stream.name}</h4>
                                    <span className="stream-card-type">{stream.deviceCount} {stream.deviceCount === 1 ? "device dismantled" : "devices dismantled"}</span>
                                </div>

                                <div className="stream-card-stats">
                                    <div>
                                        <div className="stat-qty">{Number(stream.totalQuantity).toFixed(2)} {stream.unit}</div>
                                        <div className="stat-rate">Rate: ₹{Number(stream.pricePerUnit).toLocaleString("en-IN")}/{stream.unit}</div>
                                    </div>
                                    <div className="stat-val">
                                        ₹{Number(stream.totalValuation).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Material Manifest Queue & Table */}
                <div className="panel-card">
                    <div className="panel-header">
                        <div>
                            <h2 className="panel-title">Device Material Recovery Manifests</h2>
                            <p className="panel-subtitle">Itemized logs of segregated raw materials, weights, and commercial recovery yields</p>
                        </div>

                        <div className="panel-actions" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                            {/* Filter Pill Group */}
                            <div className="filter-pill-group">
                                {[
                                    { id: "All", label: "All Items" },
                                    { id: "Precious", label: "Precious Metals" },
                                    { id: "BaseMetals", label: "Base Metals" },
                                    { id: "Polymers", label: "Polymers" },
                                    { id: "Glass", label: "Glass & Optics" }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        className={`pill-btn ${streamFilter === tab.id ? "pill-btn--active" : ""}`}
                                        onClick={() => setStreamFilter(tab.id)}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* View Toggle */}
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
                            <div className="spinner"></div>
                            <p>Loading material recovery manifests...</p>
                        </div>
                    ) : filteredProcesses.length === 0 ? (
                        <div className="no-data-state">
                            <FiLayers className="no-data-icon" />
                            <h3>No material recovery records found</h3>
                            <p>There are no items matching your search query.</p>
                        </div>
                    ) : viewMode === "table" ? (
                        /* TABLE VIEW */
                        <div className="glass-table-wrapper">
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Device / Equipment</th>
                                        <th>Facility Hub</th>
                                        <th>Recovered Fractions Manifest</th>
                                        <th>Total Mass Yield</th>
                                        <th>Estimated Value</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProcesses.map((item) => {
                                        const mats = Array.isArray(item.recoveredMaterials) ? item.recoveredMaterials : [];
                                        const totalWeight = item.process?.totalRecoveredWeight || (mats.length > 0 ? mats.reduce((s, m) => s + Number(m.quantity || 0), 0) : (item.weight * 0.85).toFixed(2));
                                        const totalVal = item.process?.totalMaterialValue || (mats.length > 0 ? mats.reduce((s, m) => s + (Number(m.quantity || 0) * Number(m.pricePerUnit || 0)), 0) : 1850);

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
                                                            <div className="user-email">Req #{item.requestId} &bull; {item.weight || 15} kg original</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Facility */}
                                                <td>
                                                    <div className="user-info">
                                                        <span className="user-name">{item.recyclingCenterName}</span>
                                                        <span className="user-email">{item.recyclingCenterCity}</span>
                                                    </div>
                                                </td>

                                                {/* Fractions Manifest Badges */}
                                                <td>
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", maxWidth: "340px" }}>
                                                        {mats.length > 0 ? mats.slice(0, 3).map((m, mIdx) => (
                                                            <span key={mIdx} className="mat-badge-stream">
                                                                {m.materialName}: <strong>{m.quantity} {m.unit || "kg"}</strong>
                                                            </span>
                                                        )) : (
                                                            <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" }}>Yield pending</span>
                                                        )}
                                                        {mats.length > 3 && (
                                                            <span className="tag-pill" style={{ background: "#f1f5f9" }}>+{mats.length - 3} more</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Mass Yield */}
                                                <td>
                                                    <div className="user-info">
                                                        <strong style={{ color: "#059669", fontSize: "0.9rem" }}>{Number(totalWeight).toFixed(2)} kg</strong>
                                                        <span className="user-email">{Math.min(100, Math.round((totalWeight / (item.weight || 15)) * 100))}% recovery rate</span>
                                                    </div>
                                                </td>

                                                {/* Valuation */}
                                                <td>
                                                    <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>₹{Number(totalVal).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
                                                </td>

                                                {/* Status */}
                                                <td>
                                                    <span style={{ padding: "0.3rem 0.65rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700, background: item.status === "Completed" ? "#ecfdf5" : "#e0f2fe", color: item.status === "Completed" ? "#047857" : "#0369a1", border: "1px solid", borderColor: item.status === "Completed" ? "#a7f3d0" : "#bae6fd", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                        <FiCheckCircle /> {item.status === "Completed" ? "Yield Verified" : "Processing"}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td>
                                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                                        <button
                                                            className="action-icon-btn view-btn"
                                                            title="View Material Recovery Manifest"
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setShowManifestModal(true);
                                                            }}
                                                        >
                                                            <FiEye />
                                                        </button>
                                                        <button
                                                            className="action-icon-btn download-btn"
                                                            title="Print Commercial Consignment Slip"
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setShowSlipModal(true);
                                                            }}
                                                        >
                                                            <FiPrinter />
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
                        /* GRID VIEW */
                        <div className="admin-grid-container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
                            {filteredProcesses.map((item) => {
                                const mats = Array.isArray(item.recoveredMaterials) ? item.recoveredMaterials : [];
                                const totalWeight = item.process?.totalRecoveredWeight || (mats.length > 0 ? mats.reduce((s, m) => s + Number(m.quantity || 0), 0) : (item.weight * 0.85).toFixed(2));
                                const totalVal = item.process?.totalMaterialValue || (mats.length > 0 ? mats.reduce((s, m) => s + (Number(m.quantity || 0) * Number(m.pricePerUnit || 0)), 0) : 1850);

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
                                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669", background: "#ecfdf5", padding: "2px 8px", borderRadius: "6px" }}>
                                                ₹{Number(totalVal).toLocaleString("en-IN")}
                                            </span>
                                        </div>

                                        <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "10px", fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748b" }}>Facility:</span>
                                                <strong style={{ color: "#0f172a" }}>{item.recyclingCenterName}</strong>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748b" }}>Recovered Weight:</span>
                                                <strong style={{ color: "#059669" }}>{Number(totalWeight).toFixed(2)} kg</strong>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ color: "#64748b" }}>Fractions:</span>
                                                <strong style={{ color: "#0f172a" }}>{mats.length} streams</strong>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                                            <button
                                                className="btn-card-primary"
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setShowManifestModal(true);
                                                }}
                                                style={{ flex: 1, padding: "0.5rem", justifyContent: "center", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", fontWeight: 600, borderRadius: "8px", cursor: "pointer" }}
                                            >
                                                <FiEye /> Manifest
                                            </button>
                                            <button
                                                className="btn-card-success"
                                                onClick={() => {
                                                    setSelectedItem(item);
                                                    setShowSlipModal(true);
                                                }}
                                                style={{ flex: 1, padding: "0.5rem", justifyContent: "center", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", fontWeight: 600, borderRadius: "8px", cursor: "pointer" }}
                                            >
                                                <FiPrinter /> Slip
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* MATERIAL RECOVERY MANIFEST MODAL */}
            {showManifestModal && selectedItem && (
                <div className="admin-modal-backdrop" onClick={() => setShowManifestModal(false)}>
                    <div className="admin-modal-card mmr-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                <div className="admin-cat-icon-box" style={{ background: "#ecfdf5", color: "#059669", width: "42px", height: "42px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                                    <FiDollarSign />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>Material Recovery Manifest</h3>
                                    <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "2px 0 0 0" }}>Separated material streams, weights, purity grades, and smelter valuations for Device #{selectedItem.deviceId}</p>
                                </div>
                            </div>
                            <button className="admin-modal-close" onClick={() => setShowManifestModal(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="admin-modal-body">
                            {/* Device & Facility Hero */}
                            <div className="mmr-modal-hero">
                                <div>
                                    <span className="hero-label">Equipment Under Recovery</span>
                                    <h3 className="hero-title">{selectedItem.brand} {selectedItem.model}</h3>
                                    <div className="hero-tags">
                                        <span className="tag-pill">{selectedItem.categoryName || "E-Waste"}</span>
                                        <span className="tag-pill">Original: {selectedItem.weight || 15} kg</span>
                                        <span className="tag-pill qr-tag">QR: {selectedItem.deviceQrToken || `ECOQR-${selectedItem.deviceId}`}</span>
                                    </div>
                                </div>

                                <div>
                                    <span className="hero-label">Demanufacturing Facility</span>
                                    <h3 className="hero-title">{selectedItem.recyclingCenterName}</h3>
                                    <div className="hero-tags">
                                        <span className="tag-pill"><FiMapPin /> {selectedItem.recyclingCenterCity}</span>
                                        <span className="tag-pill"><FiUser /> Customer: {selectedItem.customerName}</span>
                                    </div>
                                </div>

                                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                    <span className="hero-label">Recovery Verification</span>
                                    <span style={{ padding: "0.35rem 0.75rem", borderRadius: "9999px", background: "#ecfdf5", color: "#047857", fontWeight: 700, fontSize: "0.8rem", border: "1px solid #a7f3d0", marginTop: "6px" }}>
                                        <FiCheckCircle /> Certified Recycled
                                    </span>
                                </div>
                            </div>

                            {/* Itemized Materials Table */}
                            <div className="mmr-manifest-table-wrap">
                                <table className="mmr-manifest-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Secondary Material Stream</th>
                                            <th>Recovered Quantity</th>
                                            <th>Baseline Market Rate</th>
                                            <th>Yield Valuation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.isArray(selectedItem.recoveredMaterials) && selectedItem.recoveredMaterials.length > 0 ? (
                                            selectedItem.recoveredMaterials.map((mat, idx) => (
                                                <tr key={idx}>
                                                    <td style={{ color: "#64748b", fontWeight: 600 }}>{idx + 1}</td>
                                                    <td>
                                                        <strong style={{ color: "#0f172a" }}>{mat.materialName}</strong>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontWeight: 700, color: "#059669" }}>{mat.quantity} {mat.unit || "kg"}</span>
                                                    </td>
                                                    <td>₹{mat.pricePerUnit} / {mat.unit || "kg"}</td>
                                                    <td>
                                                        <strong style={{ color: "#0f172a" }}>₹{(mat.quantity * mat.pricePerUnit).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>
                                                    No individual fractions recorded. Default disassembly scheduled.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th colSpan={2}>Total Separated Recovery:</th>
                                            <th style={{ color: "#059669" }}>{selectedItem.process?.totalRecoveredWeight || (selectedItem.weight * 0.85).toFixed(2)} kg</th>
                                            <th>--</th>
                                            <th style={{ color: "#0f172a" }}>₹{Number(selectedItem.process?.totalMaterialValue || 1850).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        <div className="admin-modal-footer">
                            <button className="btn-modal-cancel" onClick={() => setShowManifestModal(false)}>
                                Close
                            </button>
                            <button
                                className="btn-modal-confirm"
                                onClick={() => {
                                    setShowManifestModal(false);
                                    setShowSlipModal(true);
                                }}
                            >
                                <FiPrinter style={{ marginRight: "6px" }} /> Print Consignment Slip
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* COMMERCIAL CONSIGNMENT & RECOVERY SLIP MODAL */}
            {showSlipModal && selectedItem && (
                <div className="admin-modal-backdrop" onClick={() => setShowSlipModal(false)}>
                    <div className="admin-modal-card mmr-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header no-print">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                <div className="admin-cat-icon-box" style={{ background: "#ecfdf5", color: "#059669" }}>
                                    <FiPrinter />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0 }}>Secondary Raw Material Consignment Slip</h3>
                                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>Commercial smelter manifest &amp; material transfer document</p>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button className="btn-modal-confirm" onClick={handlePrintSlip}>
                                    <FiPrinter style={{ marginRight: "4px" }} /> Print / PDF
                                </button>
                                <button className="admin-modal-close" onClick={() => setShowSlipModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                        </div>

                        <div className="admin-modal-body">
                            <div className="consignment-slip-frame" ref={slipRef}>
                                <div className="slip-border">
                                    <div className="slip-header">
                                        <div>
                                            <h2 style={{ margin: 0, color: "#065f46", fontSize: "1.4rem", fontWeight: 900 }}>EcoCycle Materials Manifest</h2>
                                            <p style={{ margin: "2px 0 0 0", fontSize: "0.75rem", color: "#059669", fontWeight: 700 }}>CERTIFIED SECONDARY RAW MATERIALS DISPATCH SLIP</p>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block" }}>MANIFEST NO:</span>
                                            <strong style={{ fontFamily: "monospace", fontSize: "1.05rem" }}>CSN-REC-{selectedItem.requestId}-{new Date().getFullYear()}</strong>
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "#f8fafc", padding: "1rem", borderRadius: "8px", margin: "1rem 0", fontSize: "0.82rem" }}>
                                        <div>
                                            <div><strong>Equipment:</strong> {selectedItem.brand} {selectedItem.model}</div>
                                            <div><strong>Category:</strong> {selectedItem.categoryName}</div>
                                            <div><strong>Device Token:</strong> {selectedItem.deviceQrToken || `ECOQR-${selectedItem.deviceId}`}</div>
                                        </div>
                                        <div>
                                            <div><strong>Origin Facility:</strong> {selectedItem.recyclingCenterName}</div>
                                            <div><strong>Location:</strong> {selectedItem.recyclingCenterCity}</div>
                                            <div><strong>Dispatch Date:</strong> {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                                        </div>
                                    </div>

                                    <div className="mmr-manifest-table-wrap">
                                        <table className="mmr-manifest-table">
                                            <thead>
                                                <tr>
                                                    <th>Material Stream</th>
                                                    <th>Net Weight</th>
                                                    <th>Market Rate</th>
                                                    <th>Consignment Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.isArray(selectedItem.recoveredMaterials) && selectedItem.recoveredMaterials.length > 0 ? (
                                                    selectedItem.recoveredMaterials.map((m, idx) => (
                                                        <tr key={idx}>
                                                            <td><strong>{m.materialName}</strong></td>
                                                            <td>{m.quantity} {m.unit || "kg"}</td>
                                                            <td>₹{m.pricePerUnit}/{m.unit || "kg"}</td>
                                                            <td>₹{(m.quantity * m.pricePerUnit).toLocaleString("en-IN")}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} style={{ textAlign: "center", color: "#64748b" }}>Standard recovery fractions attached.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <th>Total Yield:</th>
                                                    <th>{selectedItem.process?.totalRecoveredWeight || (selectedItem.weight * 0.85).toFixed(2)} kg</th>
                                                    <th>--</th>
                                                    <th>₹{Number(selectedItem.process?.totalMaterialValue || 1850).toLocaleString("en-IN")}</th>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px dashed #cbd5e1", fontSize: "0.8rem" }}>
                                        <div>
                                            <FaQrcode style={{ fontSize: "2rem", color: "#0f172a" }} />
                                            <div style={{ fontSize: "0.65rem", color: "#64748b" }}>SCAN TO VERIFY TRANSFER</div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ width: "180px", borderBottom: "1px solid #0f172a", marginBottom: "4px" }}></div>
                                            <strong>Authorized Dispatch Officer</strong>
                                            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>EcoCycle Recovery Authority</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="admin-modal-footer no-print">
                            <button className="btn-modal-cancel" onClick={() => setShowSlipModal(false)}>
                                Close
                            </button>
                            <button className="btn-modal-confirm" onClick={handlePrintSlip}>
                                <FiPrinter style={{ marginRight: "4px" }} /> Print Consignment Slip
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageMaterialRecovery;
