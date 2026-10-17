import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiCpu,
    FiTool,
    FiCheckSquare,
    FiCheckCircle,
    FiClock,
    FiShield,
    FiPackage,
    FiBox,
    FiSearch,
    FiGrid,
    FiList,
    FiEye,
    FiBell,
    FiX,
    FiAward,
    FiPrinter,
    FiDownload,
    FiSmartphone,
    FiTv,
    FiBatteryCharging,
    FiUser,
    FiMapPin,
    FiPhone,
    FiDollarSign,
    FiRotateCcw,
    FiCheck,
    FiArrowRight
} from "react-icons/fi";
import { FaLeaf, FaQrcode } from "react-icons/fa";
import "./Refurbished_devices.css";

function RefurbishedDevices() {
    const navigate = useNavigate();
    const certificateRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [imgError, setImgError] = useState(false);

    // Modals
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [certDevice, setCertDevice] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchData(token);
        fetchUnreadCount(token);

        const interval = setInterval(() => {
            fetchUnreadCount(token);
        }, 15000);
        return () => clearInterval(interval);
    }, [navigate]);

    const fetchUnreadCount = async (token) => {
        try {
            const authToken = token || localStorage.getItem("token");
            const res = await axios.get("https://ecocycle.runasp.net/api/Notificationcon/my_notifications", {
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

            // Fetch Profile
            let profileData = null;
            try {
                const profileRes = await axios.get("https://ecocycle.runasp.net/api/RefurbishmentCenter/myprofile", {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                profileData = profileRes.data;
            } catch {
                try {
                    const userProfileRes = await axios.get("https://ecocycle.runasp.net/api/User/profile", {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    profileData = userProfileRes.data;
                } catch {
                    profileData = null;
                }
            }
            setProfile(profileData);

            // Fetch strictly from the database / API tables
            const [procRes, myReqRes, adminReqRes] = await Promise.all([
                axios.get("https://ecocycle.runasp.net/api/RefurbishmentProcess/all-processes", {
                    headers: { Authorization: `Bearer ${authToken}` }
                }).catch(() => ({ data: [] })),
                axios.get("https://ecocycle.runasp.net/api/AllocateRefurbishmentCenter/my-requests", {
                    headers: { Authorization: `Bearer ${authToken}` }
                }).catch(() => ({ data: [] })),
                axios.get("https://ecocycle.runasp.net/api/AllocateRefurbishmentCenter/admin/requests", {
                    headers: { Authorization: `Bearer ${authToken}` }
                }).catch(() => ({ data: [] }))
            ]);

            const allProcesses = Array.isArray(procRes.data) ? procRes.data : [];
            const myRequests = Array.isArray(myReqRes.data) ? myReqRes.data : [];
            const adminRequests = Array.isArray(adminReqRes.data) ? adminReqRes.data : [];

            // Consolidate actual database records into a map
            const recordMap = new Map();

            // 1. Add center's assigned requests
            myRequests.forEach(item => {
                const key = String(item.deviceId || item.refurbishmentRequestId || item.id || "");
                if (key) recordMap.set(key, item);
            });

            // 2. Add admin requests if missing
            adminRequests.forEach(item => {
                const key = String(item.deviceId || item.refurbishmentRequestId || item.id || "");
                if (key && !recordMap.has(key)) {
                    recordMap.set(key, item);
                }
            });

            // 3. Enrich with allProcesses (contains detailed process lifecycle data)
            allProcesses.forEach(item => {
                const key = String(item.deviceId || item.requestId || "");
                if (key) {
                    if (recordMap.has(key)) {
                        recordMap.set(key, { ...recordMap.get(key), ...item });
                    } else {
                        recordMap.set(key, item);
                    }
                }
            });

            const combinedList = Array.from(recordMap.values());

            // Filter by logged-in refurbishment center if center ID is known
            const cId = profileData?.RefurbishmentCenterId || profileData?.refurbishmentCenterId || profileData?.id;
            let centerFiltered = combinedList;
            if (cId) {
                const matched = combinedList.filter(item => {
                    const itemCenterId = item.refurbishmentCenterId || item.centerId;
                    return !itemCenterId || itemCenterId === cId;
                });
                if (matched.length > 0) {
                    centerFiltered = matched;
                }
            }

            // Strictly filter ONLY completed / repaired records from the database table
            const completedItems = centerFiltered.filter(item => {
                const s = String(item.process?.status || item.status || "").toLowerCase().trim();
                const outcome = String(item.process?.finalOutcome || item.finalOutcome || "").toLowerCase().trim();
                const hasCompletedDate = Boolean(item.refurbishmentCompletedAt || item.process?.completedAt);
                const isFailed = s === "rejected" || s === "refurbishmentfailed" || outcome === "transferredtorecycling";

                if (isFailed) return false;

                return (
                    s === "completed" || 
                    s === "refurbished" || 
                    s === "refurbishmentcompleted" || 
                    s === "certified" || 
                    s === "ready" ||
                    outcome === "refurbished" ||
                    hasCompletedDate
                );
            });

            // Standardize ONLY real records from database - ZERO mock/static data
            const mapped = completedItems.map((item, idx) => {
                const devId = item.deviceId || item.refurbishmentRequestId || item.id || (idx + 1);
                const reqId = item.refurbishmentRequestId || item.requestId || item.id || devId;
                
                const procObj = item.process || allProcesses.find(p => (p.deviceId || p.requestId) === devId)?.process || {};

                // Parse components replaced from actual JSON or array if present
                let componentsReplaced = [];
                if (procObj.repairItemsJson) {
                    try {
                        const parsed = JSON.parse(procObj.repairItemsJson);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            componentsReplaced = parsed.map(p => p.partName || p.name || p.part || "").filter(Boolean);
                        }
                    } catch {}
                }
                if (componentsReplaced.length === 0 && Array.isArray(procObj.componentsReplaced)) {
                    componentsReplaced = procObj.componentsReplaced;
                }

                const gradeRaw = procObj.qualityGrade || item.qualityGrade || item.inspectionGrade || item.condition || "";
                let gradeFormatted = "—";
                if (gradeRaw.toUpperCase().includes("A")) gradeFormatted = "Grade A";
                else if (gradeRaw.toUpperCase().includes("B")) gradeFormatted = "Grade B";
                else if (gradeRaw.toUpperCase().includes("C")) gradeFormatted = "Grade C";
                else if (gradeRaw) gradeFormatted = gradeRaw;

                const repairCost = Number(procObj.totalRepairCost || item.totalRepairCost || item.repairCost || 0);
                const refurbValue = Number(procObj.refurbishedValue || item.refurbishedValue || item.valuation || item.price || 0);
                const certId = procObj.refurbishedCertificateNumber || procObj.certificateId || item.certificateId || (procObj.status === "Completed" ? `ECO-REF-${devId}` : "—");

                return {
                    id: reqId,
                    deviceId: devId,
                    certificateId: certId,
                    serialNumber: item.serialNumber || procObj.serialNumber || "—",
                    qrToken: item.deviceQrToken || procObj.deviceQrToken || `ECOQR-DEV-${devId}`,
                    brand: item.brand || "—",
                    model: item.model || "Device",
                    categoryName: item.categoryName || item.category || "—",
                    qualityGrade: gradeFormatted,
                    qualityGradeFull: gradeRaw || gradeFormatted,
                    repairCost: repairCost,
                    refurbishedValue: refurbValue,
                    startedAt: item.refurbishmentStartedAt || item.processStartDate || item.assignedAt,
                    completedAt: item.refurbishmentCompletedAt || procObj.completedAt || item.completedAt || null,
                    componentsReplaced: componentsReplaced,
                    dataWiped: Boolean(procObj.dataWiped),
                    testingPassed: Boolean(procObj.testingPassed),
                    qcApproved: Boolean(procObj.qcApproved),
                    technicianName: item.technicianName || procObj.technicianName || "—",
                    warrantyMonths: procObj.warrantyDuration || item.warrantyMonths || "—",
                    customerName: item.customerName || "—",
                    customerCity: item.customerCity || "—",
                    remarks: procObj.remarks || procObj.notes || item.remarks || "—"
                };
            });

            // Set purely to real table records - zero static data
            setDevices(mapped);
        } catch (err) {
            console.error("Error loading repaired devices from database:", err);
            setDevices([]);
        } finally {
            setLoading(false);
        }
    };

    const facilityName = profile?.CenterName || profile?.centerName 
        ? (profile.CenterName || profile.centerName)
        : profile?.OwnerName || profile?.ownerName || localStorage.getItem("firstName") || "Refurbishment Center";

    const getMediaUrl = (filename, folderName = "center-photo") => {
        if (!filename) return null;
        if (filename.startsWith("http://") || filename.startsWith("https://") || filename.startsWith("blob:") || filename.startsWith("data:")) {
            return filename;
        }
        const cleanName = filename.replace(/^uploads[\\/]/, "").replace(/^[\\/]/, "");
        if (cleanName.includes("/") || cleanName.includes("\\")) {
            return `https://ecocycle.runasp.net/uploads/${cleanName.replace("\\", "/")}`;
        }
        return `https://ecocycle.runasp.net/uploads/refurbishment/${folderName}/${cleanName}`;
    };

    const rawPhoto = profile?.CenterPhoto || profile?.centerPhoto || profile?.ShopPhoto || profile?.shopPhoto || profile?.ProfileImage || profile?.profileImage || profile?.Photo || profile?.photo;
    const shopPhotoUrl = rawPhoto ? getMediaUrl(rawPhoto) : null;
    const userInitial = (facilityName || "R").charAt(0).toUpperCase();

    const getCategoryIcon = (categoryName) => {
        const cat = (categoryName || "").toLowerCase();
        if (cat.includes("laptop") || cat.includes("computer") || cat.includes("pc")) return <FiCpu />;
        if (cat.includes("mobile") || cat.includes("phone") || cat.includes("tablet")) return <FiSmartphone />;
        if (cat.includes("tv") || cat.includes("display") || cat.includes("monitor")) return <FiTv />;
        if (cat.includes("battery") || cat.includes("power")) return <FiBatteryCharging />;
        return <FiBox />;
    };

    // Filter Logic
    const filteredDevices = devices.filter((item) => {
        // Tab Filter
        if (activeTab === "Grade A" && item.qualityGrade !== "Grade A") return false;
        if (activeTab === "Grade B" && item.qualityGrade !== "Grade B") return false;
        if (activeTab === "Smartphones" && !item.categoryName.toLowerCase().includes("phone") && !item.categoryName.toLowerCase().includes("mobile") && !item.categoryName.toLowerCase().includes("tablet")) return false;
        if (activeTab === "Computers" && !item.categoryName.toLowerCase().includes("computer") && !item.categoryName.toLowerCase().includes("laptop") && !item.categoryName.toLowerCase().includes("pc")) return false;
        if (activeTab === "Other" && (item.categoryName.toLowerCase().includes("phone") || item.categoryName.toLowerCase().includes("laptop") || item.categoryName.toLowerCase().includes("computer"))) return false;

        // Search Query Filter
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase().trim();
        const title = `${item.brand} ${item.model}`.toLowerCase();
        const sn = String(item.serialNumber || "").toLowerCase();
        const cert = String(item.certificateId || "").toLowerCase();
        const cat = String(item.categoryName || "").toLowerCase();
        const devId = String(item.deviceId || "");

        return title.includes(q) || sn.includes(q) || cert.includes(q) || cat.includes(q) || devId.includes(q);
    });

    // Dynamic KPI Metrics strictly computed from authentic database records
    const totalCount = devices.length;
    const gradeACount = devices.filter(d => (d.qualityGrade || "").toUpperCase().includes("A")).length;
    const totalValue = devices.reduce((sum, d) => sum + (Number(d.refurbishedValue) || 0), 0);
    const totalCost = devices.reduce((sum, d) => sum + (Number(d.repairCost) || 0), 0);

    // Compute dynamic turnaround time in days from actual database timestamps
    const turnaroundList = devices
        .filter(d => d.startedAt && d.completedAt)
        .map(d => {
            const diffMs = new Date(d.completedAt).getTime() - new Date(d.startedAt).getTime();
            return Math.max(0.1, diffMs / (1000 * 60 * 60 * 24));
        });
    const avgTurnaround = turnaroundList.length > 0
        ? (turnaroundList.reduce((a, b) => a + b, 0) / turnaroundList.length).toFixed(1)
        : (devices.length > 0 ? "1.0" : "0");

    const handlePrintCertificate = () => {
        window.print();
    };

    return (
        <div className="refurb-dashboard-layout refurbished-devices-page">
            <Sidebar />

            <main className="refurb-main-content">
                {/* Header Top Bar Ribbon */}
                <div className="refurb-header-ribbon">
                    <div>
                        <h1 className="refurb-welcome-title">Repaired &amp; Certified Devices</h1>
                        <p className="refurb-welcome-sub">
                            Refurbishment Center Operations &bull; Quality Inspection, Certified Renewed Inventory &amp; Digital Passports
                        </p>
                    </div>

                    <div className="refurb-header-actions">
                        <button
                            type="button"
                            onClick={() => navigate("/refurbishmentcenter_notification")}
                            title="Notifications"
                            className="notif-bell-btn"
                        >
                            <FiBell style={{ color: "#475569", fontSize: "1.1rem" }} />
                            {unreadNotifCount > 0 && (
                                <span className="notif-badge">
                                    {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                                </span>
                            )}
                        </button>

                        <Link to="/refurbishment_profile" className="refurb-profile-pill" title={`Facility Profile - ${facilityName}`}>
                            {shopPhotoUrl && !imgError ? (
                                <img
                                    src={shopPhotoUrl}
                                    alt={facilityName}
                                    className="refurb-shop-img"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="refurb-avatar">
                                    {userInitial}
                                </div>
                            )}
                            <span className="refurb-pill-name">{facilityName}</span>
                        </Link>
                    </div>
                </div>

                {/* KPI Metrics Summary Grid (Fully computed dynamically from table data) */}
                <div className="refurb-kpi-grid">
                    <div className="refurb-kpi-card refurb-kpi-card--emerald">
                        <div className="refurb-kpi-top">
                            <div className="refurb-kpi-icon-wrap emerald">
                                <FiCheckSquare />
                            </div>
                            <span className="refurb-kpi-badge emerald">100% Tested</span>
                        </div>
                        <div className="refurb-kpi-body">
                            <div className="refurb-kpi-val-row">
                                <h3 className="refurb-kpi-val">{totalCount}</h3>
                                <span className="refurb-kpi-unit">Devices</span>
                            </div>
                            <div className="refurb-kpi-lbl">Total Repaired &amp; Certified</div>
                        </div>
                    </div>

                    <div className="refurb-kpi-card refurb-kpi-card--purple">
                        <div className="refurb-kpi-top">
                            <div className="refurb-kpi-icon-wrap purple">
                                <FiAward />
                            </div>
                            <span className="refurb-kpi-badge purple">Pristine</span>
                        </div>
                        <div className="refurb-kpi-body">
                            <div className="refurb-kpi-val-row">
                                <h3 className="refurb-kpi-val">{gradeACount}</h3>
                                <span className="refurb-kpi-unit">Grade A</span>
                            </div>
                            <div className="refurb-kpi-lbl">Certified Grade A Units</div>
                        </div>
                    </div>

                    <div className="refurb-kpi-card refurb-kpi-card--blue">
                        <div className="refurb-kpi-top">
                            <div className="refurb-kpi-icon-wrap blue">
                                <FiDollarSign />
                            </div>
                            <span className="refurb-kpi-badge blue">Recovered</span>
                        </div>
                        <div className="refurb-kpi-body">
                            <div className="refurb-kpi-val-row">
                                <h3 className="refurb-kpi-val">
                                    {totalValue >= 1000 ? `₹${(totalValue / 1000).toFixed(1)}k` : `₹${totalValue.toLocaleString()}`}
                                </h3>
                                <span className="refurb-kpi-unit">INR</span>
                            </div>
                            <div className="refurb-kpi-lbl">Total Value Recovered</div>
                        </div>
                    </div>

                    <div className="refurb-kpi-card refurb-kpi-card--amber">
                        <div className="refurb-kpi-top">
                            <div className="refurb-kpi-icon-wrap amber">
                                <FiClock />
                            </div>
                            <span className="refurb-kpi-badge amber">Turnaround</span>
                        </div>
                        <div className="refurb-kpi-body">
                            <div className="refurb-kpi-val-row">
                                <h3 className="refurb-kpi-val">{avgTurnaround}</h3>
                                <span className="refurb-kpi-unit">Days</span>
                            </div>
                            <div className="refurb-kpi-lbl">Avg. Turnaround Time</div>
                        </div>
                    </div>
                </div>

                {/* Main Controls Panel (Exact same filter design & controls as dashboard) */}
                <div className="control-bar-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.2rem", color: "#0f172a" }}>
                            Certified Repaired Devices
                        </h3>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                            Inventory of fully restored electronics with issued warranty passports
                        </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap", marginLeft: "auto" }}>
                        {/* Search Bar */}
                        <div className="refurb-delivery-search">
                            <FiSearch className="refurb-search-icon" />
                            <input
                                type="text"
                                placeholder="Search device, serial, cert ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="refurb-search-clear"
                                    onClick={() => setSearchQuery("")}
                                    title="Clear search"
                                >
                                    <FiX />
                                </button>
                            )}
                        </div>

                        {/* Filter Pills */}
                        <div className="filter-pills">
                            {["All", "Grade A", "Grade B", "Smartphones", "Computers", "Other"].map((tab) => (
                                <button
                                    key={tab}
                                    className={`pill-btn ${activeTab === tab ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* View Mode Toggle */}
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

                {/* Content Section */}
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading certified repaired inventory...</p>
                    </div>
                ) : filteredDevices.length === 0 ? (
                    <div className="empty-repaired-state">
                        <div className="empty-icon-wrap">
                            <FiCheckSquare />
                        </div>
                        <h4 className="empty-title">No Repaired Devices Found</h4>
                        <p className="empty-desc">
                            {searchQuery
                                ? `No certified devices matching "${searchQuery}". Try a different keyword.`
                                : "No completed refurbishment records in this category yet. Devices appear here once repair workflows are submitted."}
                        </p>
                    </div>
                ) : viewMode === "grid" ? (
                    /* Cards Grid View - Strict Table Data Only */
                    <div className="refurb-cards-grid">
                        {filteredDevices.map((device) => (
                            <div className="refurb-item-card" key={device.id}>
                                <div>
                                    {/* Card Top Row */}
                                    <div className="refurb-card-top-row">
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                            <div className="refurb-cat-icon-box">
                                                {getCategoryIcon(device.categoryName)}
                                            </div>
                                            <div>
                                                <h4 className="refurb-card-brand-name">{device.brand} {device.model}</h4>
                                                <p className="refurb-card-cat-sub">{device.categoryName}</p>
                                            </div>
                                        </div>
                                        <span className={`grade-badge ${device.qualityGrade === "Grade A" ? "grade-a" : "grade-b"}`}>
                                            <FiAward /> {device.qualityGrade}
                                        </span>
                                    </div>

                                    {/* Identifiers Chips */}
                                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                                        {device.serialNumber && device.serialNumber !== "—" && (
                                            <span className="spec-chip highlight">{device.serialNumber}</span>
                                        )}
                                        <span className="spec-chip">Dev #{device.deviceId}</span>
                                        {device.warrantyMonths && device.warrantyMonths !== "—" && (
                                            <span className="spec-chip">Warranty: {device.warrantyMonths}</span>
                                        )}
                                    </div>

                                    {/* Replaced Components (Rendered only when authentic data exists) */}
                                    {(device.componentsReplaced.length > 0 || device.dataWiped) && (
                                        <div style={{ marginTop: "0.75rem" }}>
                                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                                                Restoration Highlights:
                                            </span>
                                            <div className="components-tags-wrap">
                                                {device.componentsReplaced.map((comp, idx) => (
                                                    <span className="comp-tag" key={idx}>{comp}</span>
                                                ))}
                                                {device.dataWiped && (
                                                    <span className="comp-tag" style={{ background: "#dcfce7", color: "#15803d" }}>
                                                        ✓ Data Wiped
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Realized Value Box */}
                                    <div className="device-value-box">
                                        <div>
                                            <span className="device-value-lbl">Certified Value</span>
                                            <div className="device-value-amt">₹{device.refurbishedValue.toLocaleString()}</div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <span className="device-value-lbl">Repair Cost</span>
                                            <div className="device-cost-amt">₹{device.repairCost.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="refurb-card-actions" style={{ marginTop: "1.1rem" }}>
                                    <button
                                        type="button"
                                        className="btn-cert-view"
                                        style={{ flex: 1 }}
                                        onClick={() => setCertDevice(device)}
                                        title="View Certificate"
                                    >
                                        <FiAward /> View Certificate
                                    </button>
                                    <button
                                        type="button"
                                        className="refurb-btn-view"
                                        onClick={() => setSelectedDevice(device)}
                                        title="Detailed QC Report"
                                    >
                                        <FiEye /> Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Table View - Strict Table Data Only */
                    <div className="refurb-panel-card" style={{ padding: 0, overflow: "hidden" }}>
                        <div className="refurb-table-wrapper">
                            <table className="refurb-table">
                                <thead>
                                    <tr>
                                        <th>Device &amp; Identifiers</th>
                                        <th>Category</th>
                                        <th>Quality Grade</th>
                                        <th>Restoration Work</th>
                                        <th>Recovered Value</th>
                                        <th>Cert Number</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDevices.map((device) => (
                                        <tr key={device.id}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                                                    <div className="refurb-cat-icon-box" style={{ width: "32px", height: "32px", fontSize: "1rem" }}>
                                                        {getCategoryIcon(device.categoryName)}
                                                    </div>
                                                    <div>
                                                        <span style={{ fontWeight: 800, color: "#0f172a", display: "block" }}>
                                                            {device.brand} {device.model}
                                                        </span>
                                                        <span style={{ fontSize: "0.725rem", color: "#7c3aed", fontWeight: 700 }}>
                                                            {device.serialNumber ? `${device.serialNumber} • ` : ""}Dev #{device.deviceId}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: "#334155", fontSize: "0.8rem" }}>
                                                    {device.categoryName || "—"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`grade-badge ${device.qualityGrade === "Grade A" ? "grade-a" : "grade-b"}`}>
                                                    <FiAward /> {device.qualityGrade}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", maxWidth: "220px" }}>
                                                    {device.componentsReplaced.length > 0 ? (
                                                        device.componentsReplaced.slice(0, 2).map((c, i) => (
                                                            <span className="comp-tag" key={i}>{c}</span>
                                                        ))
                                                    ) : (
                                                        <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 800, color: "#059669", fontSize: "0.9rem" }}>
                                                    ₹{Number(device.refurbishedValue || 0).toLocaleString()}
                                                </div>
                                                <div style={{ fontSize: "0.725rem", color: "#64748b" }}>
                                                    Cost: ₹{Number(device.repairCost || 0).toLocaleString()}
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontFamily: "monospace", fontSize: "0.75rem", background: "#f5f3ff", color: "#7c3aed", padding: "0.2rem 0.45rem", borderRadius: "4px", border: "1px solid #ddd6fe" }}>
                                                    {device.certificateId || "—"}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                <div style={{ display: "inline-flex", gap: "0.45rem", alignItems: "center" }}>
                                                    <button
                                                        type="button"
                                                        className="refurb-action-btn primary"
                                                        onClick={() => setCertDevice(device)}
                                                        title="View Certificate"
                                                        style={{ background: "#7c3aed", color: "#ffffff", borderColor: "#7c3aed" }}
                                                    >
                                                        <FiAward /> Certificate
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="refurb-action-btn view-details"
                                                        onClick={() => setSelectedDevice(device)}
                                                        title="QC Details"
                                                    >
                                                        <FiEye /> Details
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Official Refurbishment Certificate Modal */}
            {certDevice && (
                <div className="refurb-modal-overlay" onClick={() => setCertDevice(null)}>
                    <div
                        className="refurb-modal-card"
                        style={{ maxWidth: "680px", borderRadius: "16px", overflow: "hidden" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="refurb-modal-header" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                <FiAward style={{ fontSize: "1.3rem" }} />
                                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                                    EcoCycle Official Certificate of Refurbishment
                                </h3>
                            </div>
                            <button
                                type="button"
                                className="refurb-modal-x-btn"
                                onClick={() => setCertDevice(null)}
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="refurb-modal-body" style={{ padding: "1.5rem" }}>
                            {/* Certificate Inner Frame */}
                            <div className="cert-border-outer" ref={certificateRef}>
                                <div className="cert-border-inner">
                                    <div className="cert-watermark">ECOCYCLE</div>

                                    {/* Header */}
                                    <div className="cert-header">
                                        <FaLeaf style={{ color: "#7c3aed", fontSize: "1.75rem" }} />
                                        <h2 className="cert-brand-title">EcoCycle Platform</h2>
                                        <p className="cert-brand-sub">Certified Hardware Circularity &bull; ISO 14001 Standards</p>
                                    </div>

                                    <h3 className="cert-main-title">Certificate of Refurbishment</h3>
                                    <p className="cert-body-text">
                                        This document confirms that the electronic equipment specified below has undergone complete hardware restoration, multi-point diagnostic stress testing, sanitized data wiping, and satisfies quality benchmark certification.
                                    </p>

                                    {/* Specs Grid */}
                                    <div className="cert-details-grid">
                                        <div className="cert-detail-item">
                                            <span className="cert-detail-lbl">Equipment Model</span>
                                            <span className="cert-detail-val">{certDevice.brand} {certDevice.model}</span>
                                        </div>
                                        <div className="cert-detail-item">
                                            <span className="cert-detail-lbl">Quality Classification</span>
                                            <span className="cert-detail-val" style={{ color: "#7c3aed" }}>{certDevice.qualityGradeFull || certDevice.qualityGrade}</span>
                                        </div>
                                        <div className="cert-detail-item">
                                            <span className="cert-detail-lbl">Device Serial Number</span>
                                            <span className="cert-detail-val" style={{ fontFamily: "monospace" }}>{certDevice.serialNumber || `Dev #${certDevice.deviceId}`}</span>
                                        </div>
                                        <div className="cert-detail-item">
                                            <span className="cert-detail-lbl">Issued Certificate ID</span>
                                            <span className="cert-detail-val" style={{ fontFamily: "monospace", color: "#059669" }}>{certDevice.certificateId}</span>
                                        </div>
                                        <div className="cert-detail-item">
                                            <span className="cert-detail-lbl">Data Sanitization Standard</span>
                                            <span className="cert-detail-val">{certDevice.dataWiped ? "Verified Sanitize (DoD/NIST)" : "Hardware Refurbished"}</span>
                                        </div>
                                        <div className="cert-detail-item">
                                            <span className="cert-detail-lbl">Hardware Warranty</span>
                                            <span className="cert-detail-val">{certDevice.warrantyMonths && certDevice.warrantyMonths !== "—" ? `${certDevice.warrantyMonths} Active Warranty` : "Standard EcoCycle Coverage"}</span>
                                        </div>
                                    </div>

                                    {/* Footer with Seal, QR & Signature */}
                                    <div className="cert-footer-row">
                                        <div className="cert-stamp-box">
                                            <span>CERTIFIED</span>
                                            <span style={{ fontSize: "0.85rem" }}>★ ★ ★</span>
                                            <span>REFURBISHED</span>
                                        </div>

                                        <div className="cert-qr-wrap">
                                            <div className="cert-qr-box">
                                                <FaQrcode />
                                            </div>
                                            <span style={{ fontSize: "0.65rem", color: "#64748b", fontFamily: "monospace" }}>
                                                {certDevice.qrToken}
                                            </span>
                                        </div>

                                        <div className="cert-signature-box">
                                            <div className="cert-sig-line"></div>
                                            <div className="cert-sig-title">{facilityName}</div>
                                            <div className="cert-sig-sub">Authorized Operations Lead</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="refurb-modal-footer">
                            <button
                                type="button"
                                className="refurb-modal-close-btn"
                                onClick={() => setCertDevice(null)}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                className="btn-cert-view"
                                onClick={handlePrintCertificate}
                            >
                                <FiPrinter /> Print Certificate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Comprehensive QC & Repair Details Modal */}
            {selectedDevice && (
                <div className="refurb-modal-overlay" onClick={() => setSelectedDevice(null)}>
                    <div className="refurb-modal-card refurb-details-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="refurb-modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{ background: "rgba(255,255,255,0.2)", padding: "0.5rem", borderRadius: "10px", display: "flex", color: "#fff" }}>
                                    {getCategoryIcon(selectedDevice.categoryName)}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#ffffff" }}>
                                        {selectedDevice.brand} {selectedDevice.model}
                                    </h3>
                                    <div style={{ margin: "0.2rem 0 0 0", fontSize: "0.775rem", opacity: 0.95, display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                        <span>Serial: <strong>{selectedDevice.serialNumber}</strong></span>
                                        <span>&bull;</span>
                                        <span>Dev ID: <strong>#{selectedDevice.deviceId}</strong></span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDevice(null)}
                                className="refurb-modal-x-btn"
                                title="Close"
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="refurb-modal-body">
                            <div className="refurb-spec-grid">
                                <div className="refurb-spec-item">
                                    <span className="refurb-spec-label">Category</span>
                                    <span className="refurb-spec-val">{selectedDevice.categoryName || "—"}</span>
                                </div>
                                <div className="refurb-spec-item">
                                    <span className="refurb-spec-label">Quality Grade</span>
                                    <span className="refurb-spec-val" style={{ color: "#7c3aed", fontWeight: 700 }}>
                                        {selectedDevice.qualityGradeFull || selectedDevice.qualityGrade || "—"}
                                    </span>
                                </div>
                                <div className="refurb-spec-item">
                                    <span className="refurb-spec-label">Realized Value</span>
                                    <span className="refurb-spec-val" style={{ color: "#059669", fontWeight: 800 }}>
                                        ₹{Number(selectedDevice.refurbishedValue || 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="refurb-spec-item">
                                    <span className="refurb-spec-label">Total Repair Cost</span>
                                    <span className="refurb-spec-val">₹{Number(selectedDevice.repairCost || 0).toLocaleString()}</span>
                                </div>
                                <div className="refurb-spec-item">
                                    <span className="refurb-spec-label">Testing Status</span>
                                    <span className="refurb-spec-val" style={{ color: selectedDevice.testingPassed ? "#16a34a" : "#64748b" }}>
                                        {selectedDevice.testingPassed ? "✓ Tested & Passed" : "Pending Testing"}
                                    </span>
                                </div>
                                <div className="refurb-spec-item">
                                    <span className="refurb-spec-label">Data Sanitization</span>
                                    <span className="refurb-spec-val" style={{ color: selectedDevice.dataWiped ? "#16a34a" : "#64748b" }}>
                                        {selectedDevice.dataWiped ? "✓ Data Wiped" : "Not Required / None"}
                                    </span>
                                </div>
                                <div className="refurb-spec-item">
                                    <span className="refurb-spec-label">Technician</span>
                                    <span className="refurb-spec-val">{selectedDevice.technicianName || "—"}</span>
                                </div>
                                <div className="refurb-spec-item">
                                    <span className="refurb-spec-label">Warranty Coverage</span>
                                    <span className="refurb-spec-val">{selectedDevice.warrantyMonths && selectedDevice.warrantyMonths !== "—" ? `${selectedDevice.warrantyMonths} Coverage` : "—"}</span>
                                </div>
                            </div>

                            {/* Components Replaced Box */}
                            {selectedDevice.componentsReplaced && selectedDevice.componentsReplaced.length > 0 && (
                                <div style={{ marginTop: "1rem", padding: "0.85rem 1rem", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                    <span style={{ fontSize: "0.725rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                                        Components Serviced / Replaced:
                                    </span>
                                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                                        {selectedDevice.componentsReplaced.map((c, i) => (
                                            <span className="comp-tag" key={i} style={{ fontSize: "0.775rem", padding: "0.25rem 0.6rem" }}>
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Remarks */}
                            {selectedDevice.remarks && selectedDevice.remarks !== "—" && (
                                <div style={{ marginTop: "0.85rem", padding: "0.85rem 1rem", background: "#f5f3ff", borderRadius: "10px", border: "1px solid #ddd6fe" }}>
                                    <span style={{ fontSize: "0.725rem", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase" }}>
                                        Inspection &amp; QA Benchmark Remarks:
                                    </span>
                                    <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.825rem", color: "#334155" }}>
                                        {selectedDevice.remarks}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="refurb-modal-footer">
                            <button
                                type="button"
                                className="refurb-modal-close-btn"
                                onClick={() => setSelectedDevice(null)}
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                className="btn-cert-view"
                                onClick={() => {
                                    const dev = selectedDevice;
                                    setSelectedDevice(null);
                                    setCertDevice(dev);
                                }}
                            >
                                <FiAward /> View Certificate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RefurbishedDevices;
