import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiBarChart2,
    FiTrendingUp,
    FiCheckSquare,
    FiCheckCircle,
    FiClock,
    FiDollarSign,
    FiDownload,
    FiPrinter,
    FiSearch,
    FiFilter,
    FiRefreshCw,
    FiCalendar,
    FiBox,
    FiCpu,
    FiSmartphone,
    FiTv,
    FiBatteryCharging,
    FiAward,
    FiShield,
    FiLayers,
    FiTool,
    FiEye,
    FiX,
    FiBell,
    FiFileText,
    FiArrowUpRight,
    FiUser
} from "react-icons/fi";
import { FaLeaf, FaQrcode } from "react-icons/fa";
import "./Refurbishment_analytics.css";

// Helper for Indian Rupee Currency Formatting
const formatINR = (num) => {
    const n = Number(num) || 0;
    return n.toLocaleString("en-IN", {
        maximumFractionDigits: 0
    });
};

function RefurbishmentAnalytics() {
    const navigate = useNavigate();
    const reportPrintRef = useRef(null);

    // Profile & Data States
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [profile, setProfile] = useState(null);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [imgError, setImgError] = useState(false);
    const [allRecords, setAllRecords] = useState([]);

    // Filtering & View States
    const [timePreset, setTimePreset] = useState("all"); // 'all' | '30d' | '90d' | 'year' | 'custom'
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [gradeFilter, setGradeFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [chartMode, setChartMode] = useState("volume"); // 'volume' | 'value'
    const [hoveredPoint, setHoveredPoint] = useState(null);

    // Modals
    const [showReportConfigModal, setShowReportConfigModal] = useState(false);
    const [showPrintStatementModal, setShowPrintStatementModal] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);

    // Report Generator Specific Configurations
    const [reportDatePreset, setReportDatePreset] = useState("all");
    const [reportStartDate, setReportStartDate] = useState("");
    const [reportEndDate, setReportEndDate] = useState("");
    const [reportCategory, setReportCategory] = useState("All");
    const [reportGrade, setReportGrade] = useState("All");
    const [reportLimit, setReportLimit] = useState(0); // 0 means all records

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchAllData(token);
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

    const fetchAllData = async (token) => {
        const authToken = token || localStorage.getItem("token");
        if (!authToken) return;
        try {
            setLoading(true);

            // Fetch profile
            let prof = null;
            try {
                const profRes = await axios.get("https://ecocycle.runasp.net/api/RefurbishmentCenter/myprofile", {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                prof = profRes.data;
            } catch {
                try {
                    const uRes = await axios.get("https://ecocycle.runasp.net/api/User/profile", {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    prof = uRes.data;
                } catch {
                    prof = null;
                }
            }
            setProfile(prof);

            // Fetch live tables from database
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

            // Consolidate into unique dictionary
            const recordMap = new Map();

            myRequests.forEach(item => {
                const key = String(item.deviceId || item.refurbishmentRequestId || item.id || "");
                if (key) recordMap.set(key, item);
            });

            adminRequests.forEach(item => {
                const key = String(item.deviceId || item.refurbishmentRequestId || item.id || "");
                if (key && !recordMap.has(key)) {
                    recordMap.set(key, item);
                }
            });

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

            // Filter by logged-in refurbishment center if ID exists
            const cId = prof?.RefurbishmentCenterId || prof?.refurbishmentCenterId || prof?.id;
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

            // Map and standardize records strictly from database columns
            const standardized = centerFiltered.map((item, idx) => {
                const devId = item.deviceId || item.refurbishmentRequestId || item.id || (idx + 1);
                const reqId = item.refurbishmentRequestId || item.requestId || item.id || devId;
                const procObj = item.process || allProcesses.find(p => (p.deviceId || p.requestId) === devId)?.process || {};

                const statusRaw = String(procObj.status || item.status || "Assigned").trim();
                const statusLower = statusRaw.toLowerCase();
                const outcomeLower = String(procObj.finalOutcome || item.finalOutcome || "").toLowerCase();

                const isCompleted = (
                    statusLower === "completed" ||
                    statusLower === "refurbished" ||
                    statusLower === "refurbishmentcompleted" ||
                    statusLower === "certified" ||
                    statusLower === "ready" ||
                    outcomeLower === "refurbished" ||
                    Boolean(item.refurbishmentCompletedAt || procObj.completedAt)
                );

                const isFailed = (
                    statusLower === "rejected" ||
                    statusLower === "refurbishmentfailed" ||
                    outcomeLower === "transferredtorecycling"
                );

                const isInProgress = (
                    statusLower === "accepted" ||
                    statusLower === "inprogress" ||
                    statusLower === "repairing" ||
                    statusLower === "testing" ||
                    statusLower === "processing"
                );

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
                let gradeClean = "—";
                if (gradeRaw.toUpperCase().includes("A")) gradeClean = "Grade A";
                else if (gradeRaw.toUpperCase().includes("B")) gradeClean = "Grade B";
                else if (gradeRaw.toUpperCase().includes("C")) gradeClean = "Grade C";
                else if (gradeRaw) gradeClean = gradeRaw;

                const repairCost = Number(procObj.totalRepairCost || item.totalRepairCost || item.repairCost || 0);
                const refurbValue = Number(procObj.refurbishedValue || item.refurbishedValue || item.valuation || item.price || 0);
                const netMargin = Math.max(0, refurbValue - repairCost);

                const startedAt = item.refurbishmentStartedAt || item.processStartDate || item.assignedAt || item.createdAt;
                const completedAt = item.refurbishmentCompletedAt || procObj.completedAt || item.completedAt || null;

                let turnaroundDays = null;
                if (startedAt && completedAt) {
                    const diffMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
                    turnaroundDays = Math.max(0.1, +(diffMs / (1000 * 60 * 60 * 24)).toFixed(1));
                }

                const certId = procObj.refurbishedCertificateNumber || procObj.certificateId || item.certificateId || (isCompleted ? `ECO-REF-${devId}` : "—");

                return {
                    id: reqId,
                    deviceId: devId,
                    certificateId: certId,
                    serialNumber: item.serialNumber || procObj.serialNumber || "—",
                    qrToken: item.deviceQrToken || procObj.deviceQrToken || `ECOQR-DEV-${devId}`,
                    brand: item.brand || "—",
                    model: item.model || "Device",
                    categoryName: item.categoryName || item.category || "Other",
                    qualityGrade: gradeClean,
                    qualityGradeFull: gradeRaw || gradeClean,
                    repairCost: repairCost,
                    refurbishedValue: refurbValue,
                    netMargin: netMargin,
                    startedAt: startedAt,
                    completedAt: completedAt,
                    dateRecord: completedAt || startedAt || item.createdAt || new Date().toISOString(),
                    turnaroundDays: turnaroundDays,
                    status: isCompleted ? "Completed" : (isFailed ? "Transferred / Failed" : (isInProgress ? "In Progress" : statusRaw)),
                    isCompleted: isCompleted,
                    isFailed: isFailed,
                    isInProgress: isInProgress,
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

            setAllRecords(standardized);
        } catch (err) {
            console.error("Error loading refurbishment analytics:", err);
            setAllRecords([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAllData();
    };

    const facilityName = profile?.CenterName || profile?.centerName 
        ? (profile.CenterName || profile.centerName)
        : profile?.OwnerName || profile?.ownerName || localStorage.getItem("firstName") || "Refurbishment Center";

    const getMediaUrl = (filename, folderName = "") => {
        if (!filename) return null;
        if (filename.startsWith("http://") || filename.startsWith("https://") || filename.startsWith("blob:")) {
            return filename;
        }
        const cleanName = filename.replace(/^uploads[\\/]/, "").replace(/^[\\/]/, "");
        if (cleanName.includes("/") || cleanName.includes("\\")) {
            return `https://ecocycle.runasp.net/uploads/${cleanName.replace("\\", "/")}`;
        }
        return folderName
            ? `https://ecocycle.runasp.net/uploads/refurbishment/${folderName}/${cleanName}`
            : `https://ecocycle.runasp.net/uploads/${cleanName}`;
    };

    const rawPhoto = profile?.CenterPhoto || profile?.centerPhoto || profile?.ShopPhoto || profile?.shopPhoto || profile?.ProfileImage || profile?.profileImage || profile?.Photo || profile?.photo;
    const shopPhotoUrl = rawPhoto ? getMediaUrl(rawPhoto, "center-photo") : null;

    const facilityCity = profile?.City || profile?.city || "Chathenthara";
    const facilityState = profile?.State || profile?.state || "Kerala";
    const facilityPhone = profile?.PhoneNumber || profile?.phoneNumber || "—";
    const centerRegId = profile?.RefurbishmentCenterId || profile?.refurbishmentCenterId || profile?.id || 1;

    // Helper for time presets
    const filterByTime = (record, preset, customStart, customEnd) => {
        if (!record.dateRecord) return true;
        const d = new Date(record.dateRecord).getTime();
        const now = Date.now();

        if (preset === "30d") return (now - d) <= (30 * 24 * 60 * 60 * 1000);
        if (preset === "90d") return (now - d) <= (90 * 24 * 60 * 60 * 1000);
        if (preset === "year") return (now - d) <= (365 * 24 * 60 * 60 * 1000);
        if (preset === "custom" && customStart && customEnd) {
            const start = new Date(customStart).getTime();
            const end = new Date(customEnd).setHours(23, 59, 59, 999);
            return d >= start && d <= end;
        }
        return true;
    };

    // Filtered Records based on Top Bar Controls
    const filteredRecords = useMemo(() => {
        return allRecords.filter(item => {
            // Time filter
            if (!filterByTime(item, timePreset, startDate, endDate)) return false;

            // Category filter
            if (categoryFilter !== "All") {
                const c = item.categoryName.toLowerCase();
                if (categoryFilter === "Smartphones" && !c.includes("phone") && !c.includes("mobile") && !c.includes("tablet")) return false;
                if (categoryFilter === "Computers" && !c.includes("computer") && !c.includes("laptop") && !c.includes("pc")) return false;
                if (categoryFilter === "Displays" && !c.includes("display") && !c.includes("tv") && !c.includes("monitor")) return false;
                if (categoryFilter === "Other" && (c.includes("phone") || c.includes("computer") || c.includes("laptop") || c.includes("tv"))) return false;
            }

            // Grade filter
            if (gradeFilter !== "All" && item.qualityGrade !== gradeFilter) return false;

            // Search query filter
            if (searchQuery) {
                const q = searchQuery.toLowerCase().trim();
                const match = 
                    `${item.brand} ${item.model}`.toLowerCase().includes(q) ||
                    String(item.serialNumber).toLowerCase().includes(q) ||
                    String(item.certificateId).toLowerCase().includes(q) ||
                    String(item.technicianName).toLowerCase().includes(q) ||
                    String(item.customerName).toLowerCase().includes(q) ||
                    String(item.deviceId).includes(q);
                if (!match) return false;
            }

            return true;
        });
    }, [allRecords, timePreset, startDate, endDate, categoryFilter, gradeFilter, searchQuery]);

    // Key Performance Indicators strictly calculated from filtered database items
    const metrics = useMemo(() => {
        const totalIntake = filteredRecords.length;
        const completed = filteredRecords.filter(r => r.isCompleted);
        const inBench = filteredRecords.filter(r => r.isInProgress);
        const gradeA = completed.filter(r => r.qualityGrade === "Grade A");
        const gradeB = completed.filter(r => r.qualityGrade === "Grade B");
        const gradeC = completed.filter(r => r.qualityGrade === "Grade C");

        const totalGrossValue = completed.reduce((sum, r) => sum + r.refurbishedValue, 0);
        const totalRepairCost = completed.reduce((sum, r) => sum + r.repairCost, 0);
        const totalNetSurplus = Math.max(0, totalGrossValue - totalRepairCost);
        const profitMargin = totalGrossValue > 0 ? Math.round((totalNetSurplus / totalGrossValue) * 100) : 0;
        const restorationRate = totalIntake > 0 ? Math.round((completed.length / totalIntake) * 100) : 0;

        const turnarounds = completed.filter(r => r.turnaroundDays !== null).map(r => r.turnaroundDays);
        const avgTurnaround = turnarounds.length > 0 
            ? +(turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length).toFixed(1)
            : (completed.length > 0 ? 1.5 : 0);

        return {
            totalIntake,
            completedCount: completed.length,
            inBenchCount: inBench.length,
            gradeACount: gradeA.length,
            gradeBCount: gradeB.length,
            gradeCCount: gradeC.length,
            totalGrossValue,
            totalRepairCost,
            totalNetSurplus,
            profitMargin,
            restorationRate,
            avgTurnaround
        };
    }, [filteredRecords]);

    // Trend Timeline Points (Grouped from actual database records)
    const trendData = useMemo(() => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const groups = {};

        filteredRecords.forEach(r => {
            if (r.dateRecord) {
                const d = new Date(r.dateRecord);
                if (!isNaN(d.getTime())) {
                    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                    const label = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
                    const fullLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
                    if (!groups[sortKey]) {
                        groups[sortKey] = {
                            sortKey,
                            label,
                            fullLabel,
                            intake: 0,
                            completed: 0,
                            value: 0,
                            cost: 0
                        };
                    }
                    groups[sortKey].intake += 1;
                    if (r.isCompleted) {
                        groups[sortKey].completed += 1;
                        groups[sortKey].value += (r.refurbishedValue || 0);
                        groups[sortKey].cost += (r.repairCost || 0);
                    }
                }
            }
        });

        const list = Object.keys(groups).sort().map(k => groups[k]);
        if (list.length === 0) {
            const now = new Date();
            const label = `${monthNames[now.getMonth()]} ${String(now.getFullYear()).slice(2)}`;
            const fullLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
            return [{
                sortKey: "current",
                label,
                fullLabel,
                intake: 0,
                completed: 0,
                value: 0,
                cost: 0
            }];
        }
        return list;
    }, [filteredRecords]);

    // Category Distribution Data
    const categoryStats = useMemo(() => {
        const counts = {};
        filteredRecords.forEach(r => {
            const cat = r.categoryName || "Other";
            if (!counts[cat]) {
                counts[cat] = { name: cat, count: 0, value: 0 };
            }
            counts[cat].count += 1;
            counts[cat].value += (r.refurbishedValue || 0);
        });
        const arr = Object.values(counts);
        arr.sort((a, b) => b.count - a.count);
        return arr;
    }, [filteredRecords]);

    // Data for Report Modal based on user's custom limits and date ranges
    const reportData = useMemo(() => {
        let list = allRecords.filter(item => {
            if (!filterByTime(item, reportDatePreset, reportStartDate, reportEndDate)) return false;
            if (reportCategory !== "All" && item.categoryName !== reportCategory) return false;
            if (reportGrade !== "All" && item.qualityGrade !== reportGrade) return false;
            return true;
        });

        if (reportLimit > 0) {
            list = list.slice(0, reportLimit);
        }

        const totalVal = list.reduce((sum, r) => sum + (r.refurbishedValue || 0), 0);
        const totalCost = list.reduce((sum, r) => sum + (r.repairCost || 0), 0);
        const netSurplus = Math.max(0, totalVal - totalCost);
        const gradeACount = list.filter(r => r.qualityGrade === "Grade A").length;

        return {
            records: list,
            count: list.length,
            totalVal,
            totalCost,
            netSurplus,
            gradeACount
        };
    }, [allRecords, reportDatePreset, reportStartDate, reportEndDate, reportCategory, reportGrade, reportLimit]);

    // CSV Report Generator (Direct download functionality requested by user)
    const handleDownloadCSV = () => {
        const targetList = reportData.records.length > 0 ? reportData.records : filteredRecords;
        if (targetList.length === 0) {
            alert("No records available to export for the selected timeframe.");
            return;
        }

        const headers = [
            "Device ID",
            "Request ID",
            "Brand",
            "Model",
            "Category",
            "Quality Grade",
            "Servicing Cost (INR)",
            "Refurbished Value (INR)",
            "Net Surplus (INR)",
            "Status",
            "Date",
            "Technician",
            "Warranty",
            "Certificate Number"
        ];

        const rows = targetList.map(r => [
            `"${r.deviceId}"`,
            `"${r.id}"`,
            `"${r.brand}"`,
            `"${r.model}"`,
            `"${r.categoryName}"`,
            `"${r.qualityGrade}"`,
            r.repairCost,
            r.refurbishedValue,
            r.netMargin,
            `"${r.status}"`,
            `"${r.completedAt ? r.completedAt.slice(0, 10) : (r.startedAt ? r.startedAt.slice(0, 10) : '—')}"`,
            `"${r.technicianName}"`,
            `"${r.warrantyMonths}"`,
            `"${r.certificateId}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [
            headers.join(","),
            ...rows.map(e => e.join(","))
        ].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const filename = `EcoCycle_Refurbishment_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Print / PDF Report Generator
    const handleLaunchPrintStatement = () => {
        setShowReportConfigModal(false);
        setShowPrintStatementModal(true);
    };

    const handleExecutePrint = () => {
        window.print();
    };

    return (
        <div className="refurb-dashboard-layout refurb-analytics-page">
            <Sidebar />

            <main className="refurb-main-content">
                {/* Header Top Bar Ribbon */}
                <div className="refurb-header-ribbon">
                    <div>
                        <h1 className="refurb-welcome-title">Welcome, {facilityName}!</h1>
                        <p className="refurb-welcome-sub">
                            Refurbishment Center Operations &bull; Performance Metrics &amp; Analytics Audits
                        </p>
                    </div>

                    <div className="refurb-header-actions">
                        {/* Time Range Preset Filter */}
                        <div className="refurb-time-pills">
                            {[
                                { key: "all", label: "All Time" },
                                { key: "30d", label: "30 Days" },
                                { key: "90d", label: "Quarter" },
                                { key: "year", label: "Year" }
                            ].map(p => (
                                <button
                                    key={p.key}
                                    type="button"
                                    className={`refurb-time-pill ${timePreset === p.key ? "active" : ""}`}
                                    onClick={() => setTimePreset(p.key)}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        {/* Generate Report CTA Modal Trigger */}
                        <button
                            type="button"
                            className="btn-generate-report-cta"
                            onClick={() => setShowReportConfigModal(true)}
                        >
                            <FiDownload />
                            <span>Download Report</span>
                        </button>

                        {/* Notifications */}
                        <button
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

                        {/* Facility Profile Pill */}
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
                                    {facilityName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="refurb-pill-name">{facilityName}</span>
                        </Link>
                    </div>
                </div>

                {/* Executive KPI Matrix (Computed directly from real database items) */}
                <div className="refurb-analytics-kpis">
                    <div className="refurb-metric-card emerald">
                        <div className="refurb-metric-top">
                            <div className="refurb-metric-icon emerald">
                                <FiCheckSquare />
                            </div>
                            <span className="refurb-metric-badge emerald">
                                {metrics.restorationRate}% Restored
                            </span>
                        </div>
                        <div className="refurb-metric-value-row">
                            <h3 className="refurb-metric-val">{metrics.completedCount}</h3>
                            <span className="refurb-metric-sub">/ {metrics.totalIntake} Units</span>
                        </div>
                        <div className="refurb-metric-lbl">Certified Restorations</div>
                    </div>

                    <div className="refurb-metric-card purple">
                        <div className="refurb-metric-top">
                            <div className="refurb-metric-icon purple">
                                <FiAward />
                            </div>
                            <span className="refurb-metric-badge purple">
                                {metrics.completedCount > 0 ? `${Math.round((metrics.gradeACount / metrics.completedCount) * 100)}% Pristine` : "Benchmark"}
                            </span>
                        </div>
                        <div className="refurb-metric-value-row">
                            <h3 className="refurb-metric-val">{metrics.gradeACount}</h3>
                            <span className="refurb-metric-sub">Units</span>
                        </div>
                        <div className="refurb-metric-lbl">Certified Grade A Units</div>
                    </div>

                    <div className="refurb-metric-card blue">
                        <div className="refurb-metric-top">
                            <div className="refurb-metric-icon blue">
                                <FiDollarSign />
                            </div>
                            <span className="refurb-metric-badge blue">Recovered</span>
                        </div>
                        <div className="refurb-metric-value-row">
                            <h3 className="refurb-metric-val">₹{formatINR(metrics.totalGrossValue)}</h3>
                            <span className="refurb-metric-sub">INR</span>
                        </div>
                        <div className="refurb-metric-lbl">Gross Realized Value</div>
                    </div>

                    <div className="refurb-metric-card amber">
                        <div className="refurb-metric-top">
                            <div className="refurb-metric-icon amber">
                                <FiTool />
                            </div>
                            <span className="refurb-metric-badge amber">Investment</span>
                        </div>
                        <div className="refurb-metric-value-row">
                            <h3 className="refurb-metric-val">₹{formatINR(metrics.totalRepairCost)}</h3>
                            <span className="refurb-metric-sub">INR</span>
                        </div>
                        <div className="refurb-metric-lbl">Repair &amp; Parts Outlay</div>
                    </div>

                    <div className="refurb-metric-card rose">
                        <div className="refurb-metric-top">
                            <div className="refurb-metric-icon rose">
                                <FiClock />
                            </div>
                            <span className="refurb-metric-badge rose">SLA Pace</span>
                        </div>
                        <div className="refurb-metric-value-row">
                            <h3 className="refurb-metric-val">{metrics.avgTurnaround}</h3>
                            <span className="refurb-metric-sub">Days</span>
                        </div>
                        <div className="refurb-metric-lbl">Avg. Turnaround Time</div>
                    </div>
                </div>

                {/* Visual Charts Grid */}
                <div className="refurb-charts-grid">
                    {/* Chart 1: Operations & Volume Throughput Trend */}
                    <div className="refurb-chart-card">
                        <div className="refurb-chart-header">
                            <div className="refurb-chart-title-area">
                                <h3>Refurbishment Operations Throughput</h3>
                                <p>Monthly intake allocation vs verified certified completions</p>
                            </div>
                            <div className="chart-header-controls">
                                <div className="chart-legend-wrap">
                                    <span className="chart-legend-item">
                                        <span className="chart-legend-color indigo"></span>
                                        <span>{chartMode === "volume" ? "Inbound Intake" : "Repair Outlay"}</span>
                                    </span>
                                    <span className="chart-legend-item">
                                        <span className="chart-legend-color purple"></span>
                                        <span>{chartMode === "volume" ? "Certified Restored" : "Realized Value"}</span>
                                    </span>
                                </div>

                                <div className="refurb-time-pills">
                                    <button
                                        type="button"
                                        className={`refurb-time-pill ${chartMode === "volume" ? "active" : ""}`}
                                        onClick={() => setChartMode("volume")}
                                    >
                                        Units
                                    </button>
                                    <button
                                        type="button"
                                        className={`refurb-time-pill ${chartMode === "value" ? "active" : ""}`}
                                        onClick={() => setChartMode("value")}
                                    >
                                        Value (₹)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* SVG Responsive Grouped Column / Throughput Chart */}
                        <div className="refurb-svg-container" style={{ height: "250px" }}>
                            {trendData.length > 0 ? (
                                (() => {
                                    const svgWidth = 580;
                                    const svgHeight = 220;
                                    const yTop = 35;
                                    const yMid = 105;
                                    const yBottom = 175;

                                    const maxValObserved = Math.max(
                                        ...trendData.map(d => chartMode === "volume" ? Math.max(d.intake, d.completed) : Math.max(d.value, d.cost)),
                                        0
                                    );

                                    let yMax;
                                    let yMidVal;
                                    let topLabel;
                                    let midLabel;
                                    let bottomLabel = chartMode === "volume" ? "0" : "₹0";

                                    if (chartMode === "volume") {
                                        yMax = maxValObserved <= 1 ? 2 : (maxValObserved <= 4 ? 4 : Math.ceil(maxValObserved * 1.25));
                                        yMidVal = Math.round(yMax / 2);
                                        topLabel = String(yMax);
                                        midLabel = String(yMidVal);
                                    } else {
                                        yMax = maxValObserved > 0 ? Math.ceil((maxValObserved * 1.25) / 1000) * 1000 : 10000;
                                        yMidVal = Math.round(yMax / 2);
                                        topLabel = `₹${formatINR(yMax)}`;
                                        midLabel = `₹${formatINR(yMidVal)}`;
                                    }

                                    // Dynamic Bar geometry configuration
                                    const totalGroupCount = trendData.length;
                                    const chartAreaLeft = 85;
                                    const chartAreaRight = 545;
                                    const chartAreaWidth = chartAreaRight - chartAreaLeft;
                                    const slotWidth = chartAreaWidth / totalGroupCount;

                                    const barWidth = slotWidth >= 200 ? 38 : (slotWidth >= 100 ? 28 : (slotWidth >= 60 ? 18 : 12));
                                    const barGap = Math.max(4, Math.min(8, Math.round(barWidth / 3)));
                                    const groupWidth = barWidth * 2 + barGap;

                                    return (
                                        <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet">
                                            <defs>
                                                <linearGradient id="intakeBarGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#818cf8" />
                                                    <stop offset="100%" stopColor="#4f46e5" />
                                                </linearGradient>
                                                <linearGradient id="restoredBarGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#c084fc" />
                                                    <stop offset="100%" stopColor="#7c3aed" />
                                                </linearGradient>
                                                <filter id="tooltipShadow" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.18" />
                                                </filter>
                                            </defs>

                                            {/* Grid Lines */}
                                            <line x1="65" y1={yTop} x2="555" y2={yTop} className="chart-grid-line" />
                                            <line x1="65" y1={yMid} x2="555" y2={yMid} className="chart-grid-line" />
                                            <line x1="65" y1={yBottom} x2="555" y2={yBottom} stroke="#cbd5e1" strokeWidth="1" />

                                            {/* Y-Axis Labels */}
                                            <text x="56" y={yTop + 4} className="chart-axis-text" textAnchor="end">
                                                {topLabel}
                                            </text>
                                            <text x="56" y={yMid + 4} className="chart-axis-text" textAnchor="end">
                                                {midLabel}
                                            </text>
                                            <text x="56" y={yBottom + 4} className="chart-axis-text" textAnchor="end">
                                                {bottomLabel}
                                            </text>

                                            {/* Render Columns for each month */}
                                            {trendData.map((d, i) => {
                                                const centerX = chartAreaLeft + slotWidth * (i + 0.5);
                                                const valIntake = chartMode === "volume" ? d.intake : d.cost;
                                                const valRestored = chartMode === "volume" ? d.completed : d.value;

                                                const intakeH = valIntake > 0 ? Math.max(8, (valIntake / yMax) * 140) : 3;
                                                const restoredH = valRestored > 0 ? Math.max(8, (valRestored / yMax) * 140) : 3;

                                                const xIntake = centerX - groupWidth / 2;
                                                const xRestored = xIntake + barWidth + barGap;

                                                const yIntake = yBottom - intakeH;
                                                const yRestored = yBottom - restoredH;

                                                return (
                                                    <g key={i}>
                                                        {/* Inbound Intake Column */}
                                                        <rect
                                                            x={xIntake}
                                                            y={yIntake}
                                                            width={barWidth}
                                                            height={intakeH}
                                                            rx="5"
                                                            fill={valIntake > 0 ? "url(#intakeBarGrad)" : "#e2e8f0"}
                                                            style={{ transition: "all 0.25s ease", cursor: "pointer" }}
                                                            onMouseEnter={() => setHoveredPoint({
                                                                x: centerX,
                                                                y: Math.min(yIntake, yRestored),
                                                                data: d,
                                                                primaryVal: valRestored,
                                                                secondaryVal: valIntake
                                                            })}
                                                            onMouseLeave={() => setHoveredPoint(null)}
                                                        />

                                                        {/* Certified Restored Column */}
                                                        <rect
                                                            x={xRestored}
                                                            y={yRestored}
                                                            width={barWidth}
                                                            height={restoredH}
                                                            rx="5"
                                                            fill={valRestored > 0 ? "url(#restoredBarGrad)" : "#e2e8f0"}
                                                            style={{ transition: "all 0.25s ease", cursor: "pointer" }}
                                                            onMouseEnter={() => setHoveredPoint({
                                                                x: centerX,
                                                                y: Math.min(yIntake, yRestored),
                                                                data: d,
                                                                primaryVal: valRestored,
                                                                secondaryVal: valIntake
                                                            })}
                                                            onMouseLeave={() => setHoveredPoint(null)}
                                                        />

                                                        {/* Value Tag Above Intake Bar */}
                                                        <text
                                                            x={xIntake + barWidth / 2}
                                                            y={valIntake > 0 ? Math.max(yTop + 12, yIntake - 7) : 166}
                                                            textAnchor="middle"
                                                            fill={valIntake > 0 ? "#4f46e5" : "#94a3b8"}
                                                            fontWeight="700"
                                                            fontSize="12"
                                                        >
                                                            {chartMode === "volume" ? d.intake : `₹${formatINR(d.cost)}`}
                                                        </text>

                                                        {/* Value Tag Above Restored Bar */}
                                                        <text
                                                            x={xRestored + barWidth / 2}
                                                            y={valRestored > 0 ? Math.max(yTop + 12, yRestored - 7) : 166}
                                                            textAnchor="middle"
                                                            fill={valRestored > 0 ? "#7c3aed" : "#94a3b8"}
                                                            fontWeight="700"
                                                            fontSize="12"
                                                        >
                                                            {chartMode === "volume" ? d.completed : `₹${formatINR(d.value)}`}
                                                        </text>

                                                        {/* Period / Month Label */}
                                                        <text
                                                            x={centerX}
                                                            y="198"
                                                            className="chart-axis-text"
                                                            textAnchor="middle"
                                                            fontWeight="700"
                                                            fontSize="12"
                                                            fill="#0f172a"
                                                        >
                                                            {d.fullLabel || d.label}
                                                        </text>
                                                    </g>
                                                );
                                            })}

                                            {/* Embedded High-Fidelity SVG Tooltip */}
                                            {hoveredPoint && (
                                                <g
                                                    transform={`translate(${hoveredPoint.x}, ${Math.max(18, hoveredPoint.y - 48)})`}
                                                    pointerEvents="none"
                                                    style={{ transition: "all 0.15s ease" }}
                                                >
                                                    <rect
                                                        x="-80"
                                                        y="-32"
                                                        width="160"
                                                        height="40"
                                                        rx="8"
                                                        fill="#0f172a"
                                                        filter="url(#tooltipShadow)"
                                                    />
                                                    <polygon points="-5,8 5,8 0,13" fill="#0f172a" />
                                                    <text x="0" y="-19" textAnchor="middle" fill="#f8fafc" fontSize="10.5" fontWeight="700">
                                                        {hoveredPoint.data.fullLabel || hoveredPoint.data.label}
                                                    </text>
                                                    <text x="-70" y="-5" fill="#818cf8" fontSize="9.5" fontWeight="600">
                                                        {chartMode === "volume" ? `Intake: ${hoveredPoint.secondaryVal}` : `Cost: ₹${formatINR(hoveredPoint.secondaryVal)}`}
                                                    </text>
                                                    <text x="70" y="-5" textAnchor="end" fill="#c084fc" fontSize="9.5" fontWeight="600">
                                                        {chartMode === "volume" ? `Restored: ${hoveredPoint.primaryVal}` : `Value: ₹${formatINR(hoveredPoint.primaryVal)}`}
                                                    </text>
                                                </g>
                                            )}
                                        </svg>
                                    );
                                })()
                            ) : null}
                        </div>
                    </div>

                    {/* Chart 2: Quality Grade Breakdown Donut */}
                    <div className="refurb-chart-card">
                        <div className="refurb-chart-header">
                            <div className="refurb-chart-title-area">
                                <h3>Quality Grade Verification</h3>
                                <p>Standard QA benchmark distribution</p>
                            </div>
                        </div>

                        <div className="refurb-donut-wrap">
                            <div className="donut-svg-box">
                                <svg width="180" height="180" viewBox="0 0 180 180">
                                    <circle cx="90" cy="90" r="70" fill="none" stroke="#f1f5f9" strokeWidth="22" />
                                    {(() => {
                                        const total = metrics.completedCount || 1;
                                        const circ = 2 * Math.PI * 70;
                                        const pA = (metrics.gradeACount / total) * circ;
                                        const pB = (metrics.gradeBCount / total) * circ;
                                        const pC = (metrics.gradeCCount / total) * circ;

                                        return (
                                            <g transform="rotate(-90 90 90)">
                                                {/* Grade A */}
                                                <circle
                                                    cx="90"
                                                    cy="90"
                                                    r="70"
                                                    fill="none"
                                                    stroke="#7c3aed"
                                                    strokeWidth="22"
                                                    strokeDasharray={`${pA} ${circ}`}
                                                    strokeDashoffset="0"
                                                />
                                                {/* Grade B */}
                                                <circle
                                                    cx="90"
                                                    cy="90"
                                                    r="70"
                                                    fill="none"
                                                    stroke="#3b82f6"
                                                    strokeWidth="22"
                                                    strokeDasharray={`${pB} ${circ}`}
                                                    strokeDashoffset={-pA}
                                                />
                                                {/* Grade C */}
                                                <circle
                                                    cx="90"
                                                    cy="90"
                                                    r="70"
                                                    fill="none"
                                                    stroke="#f59e0b"
                                                    strokeWidth="22"
                                                    strokeDasharray={`${pC} ${circ}`}
                                                    strokeDashoffset={-(pA + pB)}
                                                />
                                            </g>
                                        );
                                    })()}
                                </svg>
                                <div className="donut-center-stat">
                                    <div className="donut-center-num">{metrics.completedCount}</div>
                                    <div className="donut-center-lbl">Restored</div>
                                </div>
                            </div>

                            <div className="donut-legend-list">
                                <div className="donut-legend-item">
                                    <div className="donut-dot-name">
                                        <div className="donut-color-dot" style={{ background: "#7c3aed" }}></div>
                                        <span>Grade A (Pristine)</span>
                                    </div>
                                    <span className="donut-legend-qty">{metrics.gradeACount}</span>
                                </div>
                                <div className="donut-legend-item">
                                    <div className="donut-dot-name">
                                        <div className="donut-color-dot" style={{ background: "#3b82f6" }}></div>
                                        <span>Grade B (Good)</span>
                                    </div>
                                    <span className="donut-legend-qty">{metrics.gradeBCount}</span>
                                </div>
                                <div className="donut-legend-item">
                                    <div className="donut-dot-name">
                                        <div className="donut-color-dot" style={{ background: "#f59e0b" }}></div>
                                        <span>Grade C (Fair)</span>
                                    </div>
                                    <span className="donut-legend-qty">{metrics.gradeCCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Ledger & Itemized Table Section */}
                <div className="refurb-ledger-card">
                    <div className="refurb-ledger-toolbar">
                        <div>
                            <h3 style={{ margin: "0 0 0.15rem 0", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                                Refurbishment Audit Ledger
                            </h3>
                            <p style={{ margin: 0, fontSize: "0.775rem", color: "#64748b" }}>
                                Itemized hardware verification, valuation realization &amp; technician service logs
                            </p>
                        </div>

                        <div className="ledger-filters-wrap">
                            {/* Live Search Input */}
                            <div className="ledger-search-box">
                                <FiSearch style={{ color: "#94a3b8" }} />
                                <input
                                    type="text"
                                    placeholder="Search device, serial, technician..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8" }}
                                    >
                                        <FiX />
                                    </button>
                                )}
                            </div>

                            {/* Category Filter */}
                            <div className="refurb-time-pills">
                                {["All", "Smartphones", "Computers", "Other"].map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        className={`refurb-time-pill ${categoryFilter === cat ? "active" : ""}`}
                                        onClick={() => setCategoryFilter(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table or Empty State */}
                    {loading ? (
                        <div className="loading-state">
                            <div className="loading-spinner"></div>
                            <p>Loading refurbishment analytics ledger...</p>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="empty-repaired-state" style={{ margin: "1.5rem" }}>
                            <div className="empty-icon-wrap">
                                <FiCheckSquare />
                            </div>
                            <h4 className="empty-title">No Audit Records Found</h4>
                            <p className="empty-desc">
                                {searchQuery
                                    ? `No records matching "${searchQuery}". Try a different keyword.`
                                    : "No refurbishment records found for the selected timeframe. Data appears as repair workflows are completed."}
                            </p>
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Device &amp; Identifiers</th>
                                        <th>Category</th>
                                        <th>Quality Grade</th>
                                        <th>Repair Outlay</th>
                                        <th>Certified Valuation</th>
                                        <th>Net Margin</th>
                                        <th>Completion Date</th>
                                        <th>Lead Technician</th>
                                        <th>Certificate ID</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                                    <div style={{
                                                        width: "32px",
                                                        height: "32px",
                                                        borderRadius: "8px",
                                                        background: "#f5f3ff",
                                                        color: "#7c3aed",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: "1rem"
                                                    }}>
                                                        <FiBox />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: "#0f172a" }}>
                                                            {item.brand} {item.model}
                                                        </div>
                                                        <div style={{ fontSize: "0.725rem", color: "#64748b" }}>
                                                            {item.serialNumber !== "—" ? `${item.serialNumber} • ` : ""}Dev #{item.deviceId}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: "#334155" }}>{item.categoryName}</span>
                                            </td>
                                            <td>
                                                <span className={`grade-badge ${item.qualityGrade === "Grade A" ? "grade-a" : "grade-b"}`}>
                                                    <FiAward /> {item.qualityGrade}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 600, color: "#e11d48" }}>
                                                    ₹{formatINR(item.repairCost)}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 800, color: "#059669" }}>
                                                    ₹{formatINR(item.refurbishedValue)}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: 700, color: "#2563eb" }}>
                                                    +₹{formatINR(item.netMargin)}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: "0.775rem", color: "#64748b" }}>
                                                    {item.completedAt ? item.completedAt.slice(0, 10) : (item.startedAt ? item.startedAt.slice(0, 10) : "—")}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: "0.8rem", color: "#334155" }}>
                                                    {item.technicianName}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontFamily: "monospace",
                                                    fontSize: "0.75rem",
                                                    background: "#f5f3ff",
                                                    color: "#7c3aed",
                                                    padding: "0.2rem 0.45rem",
                                                    borderRadius: "4px",
                                                    border: "1px solid #ddd6fe"
                                                }}>
                                                    {item.certificateId}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedDevice(item)}
                                                    style={{
                                                        border: "1px solid #cbd5e1",
                                                        background: "#ffffff",
                                                        color: "#334155",
                                                        borderRadius: "8px",
                                                        padding: "0.35rem 0.7rem",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 700,
                                                        cursor: "pointer",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "0.3rem"
                                                    }}
                                                >
                                                    <FiEye /> Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* ==========================================================================
               Report Generation & Download Modal (Requested user feature!)
               Allows setting custom start/end time, limit, categories, and download options
               ========================================================================== */}
            {showReportConfigModal && (
                <div className="refurb-modal-overlay" onClick={() => setShowReportConfigModal(false)}>
                    <div className="report-config-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="report-modal-header">
                            <div>
                                <h3>
                                    <FiDownload /> Generate &amp; Download Facility Audit Report
                                </h3>
                                <p>Select custom time period, record limits, and export formats</p>
                            </div>
                            <button
                                type="button"
                                className="report-modal-x-btn"
                                onClick={() => setShowReportConfigModal(false)}
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="report-modal-body">
                            {/* 1. Time Period Selector */}
                            <div className="config-section-title">
                                <FiCalendar /> 1. Report Timeframe Scope
                            </div>
                            <div className="limits-pill-group">
                                {[
                                    { key: "all", label: "All Time" },
                                    { key: "30d", label: "Last 30 Days" },
                                    { key: "90d", label: "Last 90 Days" },
                                    { key: "year", label: "Financial Year" },
                                    { key: "custom", label: "Custom Date Range" }
                                ].map(p => (
                                    <button
                                        key={p.key}
                                        type="button"
                                        className={`limit-btn ${reportDatePreset === p.key ? "active" : ""}`}
                                        onClick={() => setReportDatePreset(p.key)}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>

                            {/* Custom Date Range Pickers (From Which Time to Which Limit) */}
                            {reportDatePreset === "custom" && (
                                <div className="date-inputs-row">
                                    <div className="date-field-group">
                                        <label>From Date (Start Time)</label>
                                        <div className="date-input-wrap">
                                            <FiCalendar style={{ color: "#7c3aed" }} />
                                            <input
                                                type="date"
                                                value={reportStartDate}
                                                onChange={(e) => setReportStartDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="date-field-group">
                                        <label>To Date (End Time Limit)</label>
                                        <div className="date-input-wrap">
                                            <FiCalendar style={{ color: "#7c3aed" }} />
                                            <input
                                                type="date"
                                                value={reportEndDate}
                                                onChange={(e) => setReportEndDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. Record Limits Selector */}
                            <div className="config-section-title" style={{ marginTop: "1rem" }}>
                                <FiFilter /> 2. Report Output Record Limit
                            </div>
                            <div className="limits-pill-group">
                                {[
                                    { limit: 0, label: "All Matching (No Limit)" },
                                    { limit: 10, label: "Top 10" },
                                    { limit: 25, label: "Top 25" },
                                    { limit: 50, label: "Top 50" },
                                    { limit: 100, label: "Top 100" }
                                ].map(l => (
                                    <button
                                        key={l.limit}
                                        type="button"
                                        className={`limit-btn ${reportLimit === l.limit ? "active" : ""}`}
                                        onClick={() => setReportLimit(l.limit)}
                                    >
                                        {l.label}
                                    </button>
                                ))}
                            </div>

                            {/* 3. Live Scope Summary Preview */}
                            <div className="report-scope-preview-card">
                                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                                    Report Generation Preview
                                </div>
                                <div className="scope-preview-grid">
                                    <div className="scope-item">
                                        <span className="scope-lbl">Matching Records</span>
                                        <span className="scope-val">{reportData.count} Units</span>
                                    </div>
                                    <div className="scope-item">
                                        <span className="scope-lbl">Total Realized Value</span>
                                        <span className="scope-val" style={{ color: "#059669" }}>₹{formatINR(reportData.totalVal)}</span>
                                    </div>
                                    <div className="scope-item">
                                        <span className="scope-lbl">Total Servicing Cost</span>
                                        <span className="scope-val" style={{ color: "#e11d48" }}>₹{formatINR(reportData.totalCost)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="report-modal-footer">
                            <button
                                type="button"
                                className="btn-report-cancel"
                                onClick={() => setShowReportConfigModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-report-csv"
                                onClick={handleDownloadCSV}
                            >
                                <FiDownload /> Download CSV
                            </button>
                            <button
                                type="button"
                                className="btn-report-print"
                                onClick={handleLaunchPrintStatement}
                            >
                                <FiPrinter /> Print / Save PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==========================================================================
               Official Printable Audit Certificate Statement (Print / PDF View)
               ========================================================================== */}
            {showPrintStatementModal && (
                <div className="refurb-modal-overlay" onClick={() => setShowPrintStatementModal(false)}>
                    <div
                        className="official-audit-statement-wrap printable-audit-section"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Action buttons (hidden when printing) */}
                        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#059669", fontWeight: 700, fontSize: "0.85rem" }}>
                                <FiCheckCircle /> Verified Facility Statement
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    type="button"
                                    className="btn-report-print"
                                    onClick={handleExecutePrint}
                                >
                                    <FiPrinter /> Print / Save as PDF
                                </button>
                                <button
                                    type="button"
                                    className="btn-report-cancel"
                                    onClick={() => setShowPrintStatementModal(false)}
                                >
                                    <FiX /> Close
                                </button>
                            </div>
                        </div>

                        {/* Statement Header */}
                        <div className="audit-doc-header">
                            <div className="audit-doc-logo-title">
                                <div className="audit-logo-icon">
                                    <FiCpu />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>EcoCycle India</h2>
                                    <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                        Electronics Refurbishment &amp; Hardware Circularity Division
                                    </p>
                                </div>
                            </div>

                            <div className="audit-doc-meta">
                                <div><strong>REPORT ID:</strong> ECO-REF-AUD-{centerRegId}</div>
                                <div><strong>DATE:</strong> {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
                                <div>ISO 14001:2015 &bull; CPCB Circularity Guidelines</div>
                            </div>
                        </div>

                        {/* Center Information */}
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem", fontSize: "0.825rem", color: "#334155" }}>
                            <div>
                                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>CERTIFIED REFURBISHMENT FACILITY</span>
                                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>{facilityName}</div>
                                <div>{facilityCity}, {facilityState} &bull; Ph: {facilityPhone}</div>
                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Facility ID: #{centerRegId}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>AUDIT PERIOD &amp; SCOPE</span>
                                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>
                                    {reportDatePreset === "custom" && reportStartDate && reportEndDate
                                        ? `${reportStartDate} to ${reportEndDate}`
                                        : (reportDatePreset === "30d" ? "Past 30 Days" : (reportDatePreset === "90d" ? "Past 90 Days" : "Complete Operating History"))}
                                </div>
                                <div>Total Processed: <strong>{reportData.count} Units</strong></div>
                            </div>
                        </div>

                        {/* Financial & Quality Matrix */}
                        <div className="audit-matrix-grid">
                            <div className="audit-matrix-item">
                                <span className="audit-matrix-lbl">TOTAL UNITS CERTIFIED</span>
                                <span className="audit-matrix-val">{reportData.count}</span>
                            </div>
                            <div className="audit-matrix-item">
                                <span className="audit-matrix-lbl">GROSS VALUATION</span>
                                <span className="audit-matrix-val" style={{ color: "#059669" }}>₹{formatINR(reportData.totalVal)}</span>
                            </div>
                            <div className="audit-matrix-item">
                                <span className="audit-matrix-lbl">SERVICING OUTLAY</span>
                                <span className="audit-matrix-val" style={{ color: "#e11d48" }}>₹{formatINR(reportData.totalCost)}</span>
                            </div>
                            <div className="audit-matrix-item">
                                <span className="audit-matrix-lbl">NET ECONOMIC SURPLUS</span>
                                <span className="audit-matrix-val" style={{ color: "#2563eb" }}>₹{formatINR(reportData.netSurplus)}</span>
                            </div>
                        </div>

                        {/* Audit Ledger Table */}
                        <table className="audit-table">
                            <thead>
                                <tr>
                                    <th>DEVICE MODEL</th>
                                    <th>CATEGORY</th>
                                    <th>GRADE</th>
                                    <th>SERVICING COST</th>
                                    <th>CERTIFIED VALUE</th>
                                    <th>CERTIFICATE ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.records.length > 0 ? (
                                    reportData.records.map(r => (
                                        <tr key={r.id}>
                                            <td><strong>{r.brand} {r.model}</strong></td>
                                            <td>{r.categoryName}</td>
                                            <td>{r.qualityGrade}</td>
                                            <td>₹{formatINR(r.repairCost)}</td>
                                            <td>₹{formatINR(r.refurbishedValue)}</td>
                                            <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{r.certificateId}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: "center", color: "#64748b", padding: "1.5rem" }}>
                                            No records available for the selected audit scope.
                                        </td>
                                    </tr>
                                )}
                                <tr className="audit-table-total-row">
                                    <td colSpan="3">TOTAL RECONCILED:</td>
                                    <td style={{ color: "#e11d48" }}>₹{formatINR(reportData.totalCost)}</td>
                                    <td style={{ color: "#059669" }}>₹{formatINR(reportData.totalVal)}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Document Footer */}
                        <div className="audit-doc-footer">
                            <div className="audit-stamp-ring">
                                <span>ECOCYCLE</span>
                                <span>★ ★ ★</span>
                                <span>AUDITED</span>
                            </div>

                            <div className="audit-sig-block">
                                <div className="audit-sig-line"></div>
                                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>{facilityName}</div>
                                <div style={{ fontSize: "0.725rem", color: "#64748b" }}>Authorized Facility Operations Signatory</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Device Details Modal */}
            {selectedDevice && (
                <div className="refurb-modal-overlay" onClick={() => setSelectedDevice(null)}>
                    <div className="refurb-modal-card refurb-details-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="refurb-modal-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#ffffff" }}>
                                    {selectedDevice.brand} {selectedDevice.model}
                                </h3>
                                <div style={{ margin: "0.2rem 0 0 0", fontSize: "0.775rem", opacity: 0.95 }}>
                                    Serial: {selectedDevice.serialNumber} &bull; Dev #{selectedDevice.deviceId}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDevice(null)}
                                className="refurb-modal-x-btn"
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="refurb-modal-body" style={{ padding: "1.25rem" }}>
                            <div className="refurb-spec-grid">
                                <div className="refurb-spec-item">
                                    <span className="refurb-spec-label">Category</span>
                                    <span className="refurb-spec-val">{selectedDevice.categoryName}</span>
                                </div>
                                <div className="refurb-spec-item">
                                    <span className="refurb-spec-label">Quality Grade</span>
                                    <span className="refurb-spec-val" style={{ color: "#7c3aed", fontWeight: 700 }}>
                                        {selectedDevice.qualityGradeFull}
                                    </span>
                                </div>
                                <div className="refurb-spec-item">
                                    <span className="refurb-spec-label">Certified Valuation</span>
                                    <span className="refurb-spec-val" style={{ color: "#059669", fontWeight: 800 }}>
                                        ₹{formatINR(selectedDevice.refurbishedValue)}
                                    </span>
                                </div>
                                <div className="refurb-spec-item">
                                    <span className="refurb-spec-label">Servicing Cost</span>
                                    <span className="refurb-spec-val" style={{ color: "#e11d48", fontWeight: 700 }}>
                                        ₹{formatINR(selectedDevice.repairCost)}
                                    </span>
                                </div>
                                <div className="refurb-spec-item">
                                    <span className="refurb-spec-label">Data Sanitization</span>
                                    <span className="refurb-spec-val" style={{ color: selectedDevice.dataWiped ? "#16a34a" : "#64748b" }}>
                                        {selectedDevice.dataWiped ? "✓ Wiped & Sanitized" : "None / Standard"}
                                    </span>
                                </div>
                                <div className="refurb-spec-item">
                                    <span className="refurb-spec-label">Testing Status</span>
                                    <span className="refurb-spec-val" style={{ color: selectedDevice.testingPassed ? "#16a34a" : "#64748b" }}>
                                        {selectedDevice.testingPassed ? "✓ Tested & Passed" : "Pending"}
                                    </span>
                                </div>
                            </div>

                            {/* Components Replaced */}
                            {selectedDevice.componentsReplaced && selectedDevice.componentsReplaced.length > 0 && (
                                <div style={{ marginTop: "1rem", padding: "0.85rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                    <span style={{ fontSize: "0.725rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                                        Components Serviced:
                                    </span>
                                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                                        {selectedDevice.componentsReplaced.map((c, i) => (
                                            <span className="comp-tag" key={i} style={{ fontSize: "0.75rem" }}>{c}</span>
                                        ))}
                                    </div>
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RefurbishmentAnalytics;
