import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    FiSearch,
    FiRefreshCw,
    FiBell,
    FiCheckCircle,
    FiFileText,
    FiDownload,
    FiX,
    FiCpu,
    FiGrid,
    FiList,
    FiAlertCircle,
    FiSmartphone,
    FiShield,
    FiTrash2,
    FiActivity,
    FiCamera
} from "react-icons/fi";
import { FaCheckDouble } from "react-icons/fa";
import Sidebar from "./Sidebar";
import "./Device_inspection.css";
import "./Inspection_report.css";

function InspectionReport() {
    const navigate = useNavigate();

    // Data & UI States
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportResults, setReportResults] = useState([]);
    const [resultsLoading, setResultsLoading] = useState(false);
    const [previewImageModal, setPreviewImageModal] = useState(null);

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [notifLoading, setNotifLoading] = useState(false);

    // User Info State
    const [techName, setTechName] = useState(() => {
        return localStorage.getItem("firstName") ||
               localStorage.getItem("userName") ||
               localStorage.getItem("username") ||
               localStorage.getItem("name") ||
               "Technician";
    });
    const [profilePhoto, setProfilePhoto] = useState(() => {
        return localStorage.getItem("profilePhoto") || localStorage.getItem("userPhoto") || null;
    });

    const userInitial = (techName || "T").charAt(0).toUpperCase();

    // Fetch Technician Profile for accurate avatar & name
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.get("https://ecocycle.runasp.net/api/Technician/myprofile", {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then((res) => {
                const data = res.data || {};
                const name = `${data.firstName || data.FirstName || ""} ${data.lastName || data.LastName || ""}`.trim();
                const photo = data.photo || data.Photo || data.profilePhoto || data.photoPath;
                if (name) {
                    setTechName(name);
                    localStorage.setItem("firstName", data.firstName || data.FirstName || name);
                }
                if (photo) {
                    setProfilePhoto(photo);
                    localStorage.setItem("profilePhoto", photo);
                }
            })
            .catch(() => {});
        }
    }, []);

    // Sanitization Helper (strips special characters)
    const sanitizeText = (str) => {
        if (!str) return "";
        return str.replace(/[^a-zA-Z0-9\s,.\-()]/g, "");
    };

    // Helper to format image paths
    const getMediaUrl = (photoPath, defaultFolder = "uploads/inspections/photos") => {
        if (!photoPath) return null;
        if (photoPath.startsWith("data:") || photoPath.startsWith("blob:")) return photoPath;
        if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) return photoPath;
        const clean = photoPath.replace(/\\/g, "/").replace(/^\/+/, "");
        if (clean.includes("/")) return `https://ecocycle.runasp.net/${clean}`;
        return `https://ecocycle.runasp.net/${defaultFolder}/${clean}`;
    };

    // Fetch Technician Inspected Devices & Deliveries
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchInspectionDevices(token);
        fetchNotifications(token);
    }, [navigate]);

    const fetchInspectionDevices = async (tokenOverride) => {
        const token = tokenOverride || localStorage.getItem("token");
        if (!token) return;
        setLoading(true);
        try {
            const response = await axios.get("https://ecocycle.runasp.net/api/Inspection/my-deliveries", {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Filter for devices that have been inspected or completed
            const rawList = response.data || [];
            const inspectedOnly = rawList.filter((d) => {
                const lifeStat = String(d.lifecycleStatus || "").toLowerCase();
                const reqStat = String(d.requestStatus || "").toLowerCase();
                return (
                    lifeStat === "inspected" ||
                    reqStat === "completed" ||
                    Boolean(d.inspectionCompletedAt)
                );
            });

            setDevices(inspectedOnly);
        } catch (err) {
            console.error("Error fetching inspection reports:", err);
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async (tokenOverride) => {
        const token = tokenOverride || localStorage.getItem("token");
        if (!token) return;
        try {
            setNotifLoading(true);
            const response = await axios.get("https://ecocycle.runasp.net/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data || []);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setNotifLoading(false);
        }
    };

    const handleMarkAsRead = async (notifId, e) => {
        if (e) e.stopPropagation();
        const token = localStorage.getItem("token");
        try {
            await axios.put(`https://ecocycle.runasp.net/api/Notificationcon/mark_asread/${notifId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications((prev) =>
                prev.map((n) => (n.notificationId === notifId ? { ...n, isRead: true } : n))
            );
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    };

    const handleMarkAllAsRead = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.get("https://ecocycle.runasp.net/api/Notificationcon/mark_asread", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const handleClearAllNotifications = async () => {
        const token = localStorage.getItem("token");
        try {
            await axios.get("https://ecocycle.runasp.net/api/Notificationcon/clearall", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications([]);
        } catch (err) {
            console.error("Failed to clear notifications:", err);
        }
    };

    // When opening a report view modal, fetch its detailed hardware component diagnostic results
    useEffect(() => {
        if (selectedReport) {
            setResultsLoading(true);
            axios.get(`https://ecocycle.runasp.net/api/DeviceInspection/results/${selectedReport.deviceId}`)
                .then((res) => {
                    const data = res.data;
                    let list = [];
                    if (Array.isArray(data)) {
                        list = data;
                    } else if (data && Array.isArray(data.$values)) {
                        list = data.$values;
                    } else if (data && Array.isArray(data.results)) {
                        list = data.results;
                    } else if (data && Array.isArray(data.data)) {
                        list = data.data;
                    }
                    setReportResults(list);
                })
                .catch((err) => {
                    console.error("Error fetching detailed report results:", err);
                    setReportResults([]);
                })
                .finally(() => {
                    setResultsLoading(false);
                });
        } else {
            setReportResults([]);
        }
    }, [selectedReport]);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // Filter Logic
    const filteredReports = devices.filter((item) => {
        const pref = String(item.processingPreference || "").toLowerCase();

        if (activeTab === "Refurbishment" && !pref.includes("refurbish")) return false;
        if (activeTab === "Recycling" && !pref.includes("recycl")) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            String(item.deviceId).includes(q) ||
            (item.brand || "").toLowerCase().includes(q) ||
            (item.model || "").toLowerCase().includes(q) ||
            (item.categoryName || "").toLowerCase().includes(q) ||
            (item.customerName || "").toLowerCase().includes(q)
        );
    });

    // Helper to safely extract arrays from API responses (handles .NET $values wrappers and result objects)
    const extractArray = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === "object") {
            if (Array.isArray(val.results)) return val.results;
            if (Array.isArray(val.$values)) return val.$values;
            if (Array.isArray(val.data)) return val.data;
        }
        return [];
    };

    // Metric Counts
    const totalReports = devices.length;
    const refurbishCount = devices.filter((d) => String(d.processingPreference || "").toLowerCase().includes("refurbish")).length;
    const recyclingCount = devices.filter((d) => String(d.processingPreference || "").toLowerCase().includes("recycl")).length;
    const gradeACount = devices.filter((d) => String(d.condition || "").toLowerCase().includes("grade a")).length;

    // Detailed Printable PDF Report Generator
    const handleDownloadReportPdf = async (dev, existingResults = null) => {
        if (!dev) return;

        let resultsList = extractArray(existingResults);
        if (resultsList.length === 0) {
            try {
                const res = await axios.get(`https://ecocycle.runasp.net/api/DeviceInspection/results/${dev.deviceId}`);
                resultsList = extractArray(res.data);
            } catch (e) {
                console.error("Could not load inspection results for PDF", e);
                resultsList = [];
            }
        }

        // Collect all corresponding component part photos taken during inspection
        const componentPhotos = [];
        resultsList.forEach((r) => {
            const photosList = extractArray(r.photos || r.Photos || r.inspectionPhotos || r.InspectionPhotos);
            photosList.forEach((p) => {
                const path = p.photoPath || p.PhotoPath || p.path || (typeof p === "string" ? p : null);
                if (path) {
                    componentPhotos.push({
                        component: r.component || r.CriteriaName || p.photoType || p.PhotoType || "Hardware Component Inspection",
                        url: getMediaUrl(path)
                    });
                }
            });
        });

        // Also check if dev object has inspection photos attached
        if (dev.inspectionPhotos || dev.photos) {
            const devPhotos = extractArray(dev.inspectionPhotos || dev.photos);
            devPhotos.forEach((p) => {
                const path = p.photoPath || p.PhotoPath || (typeof p === "string" ? p : null);
                if (path && !componentPhotos.some(cp => cp.url === getMediaUrl(path))) {
                    componentPhotos.push({
                        component: p.photoType || "Technician Inspection Evidence",
                        url: getMediaUrl(path)
                    });
                }
            });
        }

        const printWin = window.open("", "_blank");
        if (!printWin) {
            alert("Please allow popups to download/print the Inspection PDF Report.");
            return;
        }

        const dateStr = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        // Calculate total inspection score percentage
        let avgScore = 100;
        if (resultsList && resultsList.length > 0) {
            const sumScore = resultsList.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
            avgScore = Math.round(sumScore / resultsList.length);
        }

        printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>EcoCycle_Detailed_Inspection_Report_DEV_${dev.deviceId}.pdf</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                    * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
                    body { margin: 0; padding: 24px; background: #ffffff; color: #0f172a; }
                    .report-container { max-width: 820px; margin: 0 auto; border: 2px solid #059669; border-radius: 16px; padding: 28px; background: #ffffff; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 18px; margin-bottom: 20px; }
                    .brand { font-size: 24px; font-weight: 800; color: #059669; letter-spacing: -0.5px; }
                    .sub-brand { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
                    .doc-title { text-align: right; }
                    .doc-title h2 { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
                    .doc-title p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600; }
                    
                    .hero-banner { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px 22px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; }
                    .hero-dev-title { font-size: 22px; font-weight: 800; color: #065f46; margin: 0 0 4px 0; }
                    .hero-dev-meta { font-size: 12px; color: #047857; font-weight: 600; }
                    .hero-badge-group { text-align: right; }
                    .hero-badge { background: #059669; color: #ffffff; padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 800; text-transform: uppercase; display: inline-block; }
                    .hero-score { font-size: 11px; font-weight: 800; color: #047857; margin-top: 4px; display: block; }

                    .section-title { font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 1px; margin: 22px 0 10px 0; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; }
                    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }
                    
                    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
                    .info-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
                    .info-val { font-size: 13px; font-weight: 800; color: #0f172a; word-break: break-word; }

                    .diag-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                    .diag-table th { background: #f1f5f9; text-align: left; color: #475569; font-weight: 800; padding: 8px 12px; border: 1px solid #cbd5e1; }
                    .diag-table td { padding: 8px 12px; border: 1px solid #e2e8f0; vertical-align: middle; }

                    .part-thumb { width: 42px; height: 42px; border-radius: 6px; object-fit: cover; border: 1px solid #cbd5e1; vertical-align: middle; margin-right: 6px; }

                    .stamp-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
                    .stamp-box { border: 2px dashed #059669; border-radius: 8px; padding: 8px 16px; text-align: center; color: #059669; }
                    .stamp-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
                    .stamp-sub { font-size: 8.5px; font-weight: 700; margin-top: 2px; }
                    .signature-box { text-align: right; }
                    .sig-line { width: 150px; border-bottom: 1px dashed #0f172a; margin-bottom: 4px; display: inline-block; }
                    .sig-name { font-size: 11px; font-weight: 800; color: #0f172a; }
                    .sig-role { font-size: 9px; color: #64748b; font-weight: 600; }

                    .footer-notice { margin-top: 14px; font-size: 8.5px; text-align: center; color: #94a3b8; font-weight: 600; border-top: 1px solid #f1f5f9; padding-top: 8px; }

                    @media print {
                        @page { margin: 0; size: auto; }
                        body { padding: 24px; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .report-container { border: none; padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="report-container">
                    <div class="header">
                        <div>
                            <div class="brand">EcoCycle E-Waste Management</div>
                            <div class="sub-brand">Official Technical Inspection & Diagnostic Verification Certificate</div>
                        </div>
                        <div class="doc-title">
                            <h2>Detailed Inspection Report</h2>
                            <p>Certified Date: ${dateStr}</p>
                        </div>
                    </div>

                    <div class="hero-banner">
                        <div>
                            <h1 class="hero-dev-title">${dev.brand} ${dev.model}</h1>
                            <div class="hero-dev-meta">
                                Device ID: <strong>#DEV-${String(dev.deviceId).padStart(3, "0")}</strong> • Category: <strong>${dev.categoryName || "E-Waste"}</strong> • Citizen: <strong>${dev.customerName || "Citizen"}</strong>
                            </div>
                        </div>
                        <div class="hero-badge-group">
                            <div class="hero-badge">${dev.condition || "Grade A"}</div>
                            <span class="hero-score">Diagnostic Score: ${avgScore}%</span>
                        </div>
                    </div>

                    <div class="section-title">1. Master Device & Specification Details</div>
                    <div class="grid-4">
                        <div class="info-card">
                            <div class="info-label">Brand & Model</div>
                            <div class="info-val">${dev.brand} ${dev.model}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Serial Number</div>
                            <div class="info-val">${dev.serialNumber || "N/A"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Purchase Date</div>
                            <div class="info-val">${dev.purchaseDate ? new Date(dev.purchaseDate).toLocaleDateString("en-IN") : "N/A"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Quantity & Weight</div>
                            <div class="info-val">${dev.weight || 1} kg (${dev.quantity || 1} unit)</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Declared Power State</div>
                            <div class="info-val">${dev.working || "Functional"}</div>
                        </div>
                    </div>

                    <div class="section-title">2. Technician Health Evaluation & Routing Decision</div>
                    <div class="grid-4">
                        <div class="info-card">
                            <div class="info-label">Assigned Quality Grade</div>
                            <div class="info-val" style="color: #059669;">${dev.condition || "Grade A"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Processing Decision</div>
                            <div class="info-val" style="color: #2563eb;">${dev.processingPreference || "Refurbishment Center"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Physical Condition</div>
                            <div class="info-val">${dev.physicalDamage || "Good"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Screen Integrity</div>
                            <div class="info-val">${dev.displayCondition || "Intact"}</div>
                        </div>
                    </div>

                    <div class="section-title">3. Detailed Hardware Diagnostic Component Matrix</div>
                    ${(resultsList && resultsList.length > 0) ? `
                        <table class="diag-table">
                            <thead>
                                <tr>
                                    <th style="width: 25%;">Hardware Component</th>
                                    <th style="width: 18%;">Functional Result</th>
                                    <th style="width: 12%; text-align: center;">Health Score</th>
                                    <th style="width: 45%;">Technician Diagnostic Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${resultsList.map(r => `
                                    <tr>
                                        <td style="font-weight: 800; color: #0f172a;">
                                            ${r.component || r.CriteriaName}
                                        </td>
                                        <td style="font-weight: 800; color: ${r.result === "Working" || r.result === "Passed" ? "#059669" : r.result === "Fair" || r.result === "Needs Repair" ? "#d97706" : "#dc2626"};">
                                            ${r.result}
                                        </td>
                                        <td style="text-align: center; font-weight: 800;">${r.score}%</td>
                                        <td style="color: #334155;">${r.remarks || "Tested OK. System verified."}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    ` : `
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 11px; color: #64748b;">
                            Standard category evaluation recorded. All core component diagnostic tests passed system specifications with 100% score.
                        </div>
                    `}

                    ${(componentPhotos && componentPhotos.length > 0) ? `
                        <div class="section-title">4. Technician Hardware Inspection Evidence Photos</div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 10px;">
                            ${componentPhotos.map(p => `
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; text-align: center;">
                                    <span style="display: block; font-size: 10px; font-weight: 800; color: #059669; text-transform: uppercase; margin-bottom: 6px;">${p.component} - Inspection Photo</span>
                                    <img src="${p.url}" alt="${p.component}" onerror="this.style.display='none';" style="max-width: 100%; max-height: 180px; border-radius: 8px; object-fit: cover; border: 1px solid #cbd5e1;" />
                                </div>
                            `).join("")}
                        </div>
                    ` : ""}

                    <div class="stamp-row">
                        <div class="stamp-box">
                            <div class="stamp-title">ECOCYCLE VERIFIED</div>
                            <div class="stamp-sub">Official Inspection Approved</div>
                        </div>
                        <div class="signature-box">
                            <div class="sig-line"></div>
                            <div class="sig-name">${techName}</div>
                            <div class="sig-role">Certified Hardware Inspection Officer</div>
                        </div>
                    </div>

                    <div class="footer-notice">
                        Official Technical Inspection Evaluation Certificate • EcoCycle E-Waste Platform (Device Record: #DEV-${dev.deviceId}).
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 400);
                    };
                </script>
            </body>
            </html>
        `);
        printWin.document.close();
    };

    return (
        <div className="device-inspection-container">
            <Sidebar />

            <main className="inspection-main-content">
                {/* Ambient Background Glows */}
                <div className="ambient-glow ambient-glow--1"></div>
                <div className="ambient-glow ambient-glow--2"></div>

                {/* Top Navbar Header Bar EXACT SAME as Device_inspection.jsx */}
                <div className="tech-header-bar">
                    <div className="tech-header-actions">
                        {/* Search Input */}
                        <div className="search-box-v2" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            <FiSearch className="search-icon" style={{ position: "absolute", left: "0.85rem", color: "#94a3b8", fontSize: "0.95rem" }} />
                            <input
                                type="text"
                                placeholder="Search brand, model, S/N, citizen..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(sanitizeText(e.target.value))}
                                style={{
                                    padding: "0.45rem 1rem 0.45rem 2.3rem",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "10px",
                                    background: "#ffffff",
                                    fontSize: "0.8rem",
                                    color: "#0f172a",
                                    width: "220px",
                                    outline: "none",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                                }}
                            />
                        </div>

                        <button className="tech-refresh-btn" onClick={() => fetchInspectionDevices()}>
                            <FiRefreshCw className={loading ? "spin-icon" : ""} /> Refresh
                        </button>

                        {/* Notification Bell */}
                        <div className="notif-bell-container" style={{ position: "relative" }}>
                            <button
                                className="tech-refresh-btn"
                                style={{ position: "relative" }}
                                title={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
                                onClick={() => navigate("/technician-notification")}
                            >
                                <FiBell style={{ fontSize: "1.1rem" }} />
                                {unreadCount > 0 && (
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
                                        justifyContent: "center"
                                    }}>
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Floating Dropdown */}
                            {showNotifDropdown && (
                                <div className="notif-dropdown-menu">
                                    <div className="notif-dropdown-header">
                                        <div className="notif-title-row">
                                            <FiBell className="header-icon" />
                                            <h4>Notifications</h4>
                                            {unreadCount > 0 && (
                                                <span className="unread-chip">{unreadCount} New</span>
                                            )}
                                        </div>
                                        <div className="notif-header-actions">
                                            {unreadCount > 0 && (
                                                <button className="text-action-btn" onClick={handleMarkAllAsRead} title="Mark all read">
                                                    <FaCheckDouble /> Read All
                                                </button>
                                            )}
                                            {notifications.length > 0 && (
                                                <button className="text-action-btn text-action-btn--danger" onClick={handleClearAllNotifications} title="Clear all">
                                                    <FiTrash2 /> Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="notif-dropdown-body">
                                        {notifLoading ? (
                                            <div className="notif-loading-state">
                                                <FiRefreshCw className="spin-icon" /> Loading alerts...
                                            </div>
                                        ) : notifications.length > 0 ? (
                                            notifications.map((n) => (
                                                <div
                                                    key={n.notificationId}
                                                    className={`notif-item ${!n.isRead ? "notif-item--unread" : ""}`}
                                                    onClick={(e) => handleMarkAsRead(n.notificationId, e)}
                                                >
                                                    <div className="notif-item-icon">
                                                        {n.title.toLowerCase().includes("overdue") || n.title.toLowerCase().includes("reject") ? (
                                                            <FiAlertCircle className="icon-danger" />
                                                        ) : (
                                                            <FiCheckCircle className="icon-success" />
                                                        )}
                                                    </div>
                                                    <div className="notif-item-content">
                                                        <span className="notif-item-title">{n.title}</span>
                                                        <p className="notif-item-msg">{n.message}</p>
                                                        <span className="notif-item-time">
                                                            {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    </div>
                                                    {!n.isRead && (
                                                        <button
                                                            className="mark-read-dot-btn"
                                                            onClick={(e) => handleMarkAsRead(n.notificationId, e)}
                                                            title="Mark as read"
                                                        >
                                                            <span className="blue-dot"></span>
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="notif-empty-state">
                                                <FiCheckCircle className="empty-icon" />
                                                <p>No notifications at this time</p>
                                                <span>System alerts will appear here</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="tech-user-avatar" title={techName}>
                            {profilePhoto ? (
                                <img
                                    src={getMediaUrl(profilePhoto, "uploads/technicians/ProfilePhotos")}
                                    alt={techName}
                                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        setProfilePhoto(null);
                                        try { localStorage.removeItem("profilePhoto"); } catch (err) {}
                                    }}
                                />
                            ) : (
                                userInitial
                            )}
                        </div>
                    </div>
                </div>

                {/* KPI Summary Cards Grid */}
                <div className="tech-kpi-grid">
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon all"><FiFileText /></div>
                        <div className="tech-kpi-info">
                            <h3>{loading ? "..." : totalReports}</h3>
                            <p>Total Reports</p>
                        </div>
                    </div>
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon transit"><FiShield /></div>
                        <div className="tech-kpi-info">
                            <h3>{loading ? "..." : gradeACount}</h3>
                            <p>Grade A Devices</p>
                        </div>
                    </div>
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon delivered"><FiCheckCircle /></div>
                        <div className="tech-kpi-info">
                            <h3>{loading ? "..." : refurbishCount}</h3>
                            <p>Refurbish Hub</p>
                        </div>
                    </div>
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon weight"><FiCpu /></div>
                        <div className="tech-kpi-info">
                            <h3>{loading ? "..." : recyclingCount}</h3>
                            <p>Recycling Hub</p>
                        </div>
                    </div>
                </div>

                {/* Main Inspection Controls Header */}
                <div className="control-bar-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.2rem", color: "#0f172a" }}>Inspection Reports History</h3>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>View, download and track certified device inspection reports</p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap", marginLeft: "auto" }}>
                        <div className="filter-pills">
                            <button
                                className={`pill-btn ${activeTab === "All" ? "active" : ""}`}
                                onClick={() => setActiveTab("All")}
                            >
                                All Reports ({totalReports})
                            </button>
                            <button
                                className={`pill-btn ${activeTab === "Refurbishment" ? "active" : ""}`}
                                onClick={() => setActiveTab("Refurbishment")}
                            >
                                Refurbishment ({refurbishCount})
                            </button>
                            <button
                                className={`pill-btn ${activeTab === "Recycling" ? "active" : ""}`}
                                onClick={() => setActiveTab("Recycling")}
                            >
                                Recycling ({recyclingCount})
                            </button>
                        </div>

                        <div className="view-toggle">
                            <button
                                className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
                                onClick={() => setViewMode("table")}
                                title="Table View"
                            >
                                <FiList />
                            </button>
                            <button
                                className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                                onClick={() => setViewMode("grid")}
                                title="Grid View"
                            >
                                <FiGrid />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Device Reports List Content */}
                {loading ? (
                    <div className="loading-container">
                        <FiRefreshCw className="spin-icon-lg" />
                        <p>Loading certified inspection reports...</p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="empty-inspection-state">
                        <FiFileText className="empty-state-icon" />
                        <h3>No Inspected Reports Found</h3>
                        <p>No device inspection evaluation certificates match your selected criteria.</p>
                    </div>
                ) : viewMode === "grid" ? (
                    /* Cards Grid View matching Device_inspection.jsx card structure & font sizing */
                    <div className="device-cards-grid">
                        {filteredReports.map((item) => (
                            <div key={item.deviceId} className="device-card-v2">
                                <div className="card-top-header">
                                    <span className="device-id-badge">#DEV-{String(item.deviceId).padStart(3, "0")}</span>
                                    <span className="inspected-status-badge">
                                        <FiCheckCircle /> Inspection Completed
                                    </span>
                                </div>

                                <div className="card-body">
                                    <div className="device-title-group">
                                        <FiSmartphone className="device-type-icon" />
                                        <div>
                                            <h4>{item.brand} {item.model}</h4>
                                            <span className="cat-text">{item.categoryName || "E-Waste Device"}</span>
                                        </div>
                                    </div>

                                    <div className="spec-meta-grid">
                                        <div className="meta-box">
                                            <span className="meta-lbl">Assigned Grade</span>
                                            <span className="meta-val" style={{ color: "#059669" }}>{item.condition || "Grade A"}</span>
                                        </div>
                                        <div className="meta-box">
                                            <span className="meta-lbl">Destination</span>
                                            <span className="meta-val">{item.processingPreference || "Refurbish"}</span>
                                        </div>
                                        <div className="meta-box">
                                            <span className="meta-lbl">Citizen</span>
                                            <span className="meta-val">{item.customerName}</span>
                                        </div>
                                        <div className="meta-box">
                                            <span className="meta-lbl">Working</span>
                                            <span className="meta-val">{item.working || "Yes"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-actions-footer">
                                    <button
                                        className="action-btn action-btn--primary"
                                        onClick={() => handleDownloadReportPdf(item)}
                                        title="Download Certified Detailed PDF Report"
                                        style={{ width: "100%" }}
                                    >
                                        <FiDownload /> Download PDF
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Glass Table View matching Device_inspection.jsx table typography */
                    <div className="glass-table-wrapper">
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>Device ID</th>
                                    <th>Brand &amp; Model</th>
                                    <th>Category</th>
                                    <th>Quality Grade</th>
                                    <th>Destination Hub</th>
                                    <th>Citizen</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.map((item) => (
                                    <tr key={item.deviceId} className="table-row-hover">
                                        <td className="id-cell">#DEV-{String(item.deviceId).padStart(3, "0")}</td>
                                        <td>
                                            <div className="user-profile-cell">
                                                <span className="user-avatar-mini">{item.brand ? item.brand.charAt(0) : "D"}</span>
                                                <span className="user-name">{item.brand} {item.model}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="material-chip">
                                                <FiCpu /> {item.categoryName || "E-Waste"}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="status-pill status-pill--completed">
                                                <FiCheckCircle /> {item.condition || "Grade A"}
                                            </span>
                                        </td>
                                        <td>{item.processingPreference || "Refurbishment Center"}</td>
                                        <td>{item.customerName}</td>
                                        <td>
                                            <div className="table-action-group">
                                                <button
                                                    className="table-btn table-btn--success"
                                                    onClick={() => handleDownloadReportPdf(item)}
                                                    title="Download Detailed Inspection PDF"
                                                >
                                                    <FiDownload /> PDF
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Detailed Inspection Report View Modal */}
                {selectedReport && (
                    <div className="modal-backdrop">
                        <div className="inspection-modal-card" style={{ maxWidth: "920px" }}>
                            <div className="modal-header">
                                <div>
                                    <h3 style={{ color: "#ffffff", margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>Detailed Inspection Report</h3>
                                   </div>
                                <button className="close-modal-btn" onClick={() => setSelectedReport(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="modal-body-scroll">
                                {/* Summary Hero Box */}
                                {(() => {
                                    let avgScore = 100;
                                    if (Array.isArray(reportResults) && reportResults.length > 0) {
                                        const sum = reportResults.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
                                        avgScore = Math.round(sum / reportResults.length);
                                    }

                                    return (
                                        <div className="report-summary-hero" style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #bbf7d0", borderRadius: "14px", padding: "1.25rem 1.5rem", color: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", boxShadow: "0 4px 15px rgba(5, 150, 105, 0.08)" }}>
                                            <div className="hero-left">
                                                <h4 style={{ color: "#065f46", fontSize: "1.3rem", fontWeight: 800, margin: "0 0 0.35rem 0" }}>{selectedReport.brand} {selectedReport.model}</h4>
                                                <p style={{ color: "#047857", fontSize: "0.825rem", margin: 0, fontWeight: 600 }}>
                                                    Category: <strong>{selectedReport.categoryName || "E-Waste"}</strong> &bull; Citizen: <strong>{selectedReport.customerName || "N/A"}</strong>
                                                </p>
                                            </div>
                                            <div className="hero-right" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem" }}>
                                                <span className="grade-badge" style={{ background: "#059669", color: "#ffffff", fontSize: "0.8rem", fontWeight: 800, padding: "0.4rem 1.1rem", borderRadius: "9999px", textTransform: "uppercase", letterSpacing: "0.5px", boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)" }}>
                                                    {selectedReport.condition || "GRADE D"}
                                                </span>
                                                <span style={{ fontSize: "0.775rem", fontWeight: 800, color: "#047857" }}>
                                                    Diagnostic Score: {avgScore}%
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Section 1: Master Device Specifications */}
                                <div className="modal-section-title">
                                    <FiCpu /> 1. Master Device &amp; Specification Details
                                </div>
                                <div className="spec-meta-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginBottom: "1rem" }}>
                                    <div className="meta-box">
                                        <span className="meta-lbl">Brand &amp; Model</span>
                                        <span className="meta-val">{selectedReport.brand} {selectedReport.model}</span>
                                    </div>
                                    <div className="meta-box">
                                        <span className="meta-lbl">Serial Number</span>
                                        <span className="meta-val">{selectedReport.serialNumber || "N/A"}</span>
                                    </div>
                                    <div className="meta-box">
                                        <span className="meta-lbl">Purchase Date</span>
                                        <span className="meta-val">{selectedReport.purchaseDate ? new Date(selectedReport.purchaseDate).toLocaleDateString("en-IN") : "N/A"}</span>
                                    </div>
                                    <div className="meta-box">
                                        <span className="meta-lbl">Quantity &amp; Weight</span>
                                        <span className="meta-val">{selectedReport.weight || 1} kg ({selectedReport.quantity || 1} unit)</span>
                                    </div>
                                    <div className="meta-box">
                                        <span className="meta-lbl">Declared Power State</span>
                                        <span className="meta-val">{selectedReport.working || "Functional"}</span>
                                    </div>
                                </div>

                                {/* Section 2: Technician Health Evaluation & Routing Decision */}
                                <div className="modal-section-title" style={{ marginTop: "1rem" }}>
                                    <FiShield /> 2. Technician Health Evaluation &amp; Routing Decision
                                </div>
                                <div className="spec-meta-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: "1rem" }}>
                                    <div className="meta-box">
                                        <span className="meta-lbl">Assigned Quality Grade</span>
                                        <span className="meta-val" style={{ color: "#059669" }}>{selectedReport.condition || "Grade A"}</span>
                                    </div>
                                    <div className="meta-box">
                                        <span className="meta-lbl">Processing Decision</span>
                                        <span className="meta-val" style={{ color: "#2563eb" }}>{selectedReport.processingPreference || "Refurbishment"}</span>
                                    </div>
                                    <div className="meta-box">
                                        <span className="meta-lbl">Physical Condition</span>
                                        <span className="meta-val">{selectedReport.physicalDamage || "Good"}</span>
                                    </div>
                                    <div className="meta-box">
                                        <span className="meta-lbl">Screen Integrity</span>
                                        <span className="meta-val">{selectedReport.displayCondition || "Intact"}</span>
                                    </div>
                                </div>

                                {/* Technician Evaluation Remarks Callout Box */}
                                {(selectedReport.technicianNotes || selectedReport.technicianRemarks || selectedReport.remarks || selectedReport.comments) && (
                                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "0.85rem 1.15rem", marginBottom: "1.2rem" }}>
                                        <div style={{ fontSize: "0.725rem", fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.25rem" }}>
                                            TECHNICIAN DIAGNOSTIC EVALUATION REMARKS
                                        </div>
                                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#1e3a8a", lineHeight: 1.5, fontWeight: 600 }}>
                                            "{selectedReport.technicianNotes || selectedReport.technicianRemarks || selectedReport.remarks || selectedReport.comments}"
                                        </p>
                                    </div>
                                )}

                                {/* Section 3: Detailed Hardware Diagnostic Component Matrix */}
                                <div className="modal-section-title" style={{ marginTop: "1rem" }}>
                                    <FiFileText /> 3. Detailed Hardware Diagnostic Component Matrix
                                </div>
                                {resultsLoading ? (
                                    <div style={{ textAlign: "center", padding: "1.5rem", color: "#64748b" }}>
                                        <FiRefreshCw className="spin-icon" /> Loading component diagnostic results...
                                    </div>
                                ) : !Array.isArray(reportResults) || reportResults.length === 0 ? (
                                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem", color: "#64748b", fontSize: "0.85rem", marginBottom: "1.2rem" }}>
                                        Standard category evaluation recorded. All core component diagnostic tests passed system specifications with 100% score.
                                    </div>
                                ) : (
                                    <div className="hardware-test-table-wrap" style={{ marginBottom: "1.2rem" }}>
                                        <table className="hardware-test-table">
                                            <thead>
                                                <tr>
                                                    <th>Hardware Component</th>
                                                    <th>Part Photos</th>
                                                    <th>Test Result</th>
                                                    <th style={{ textAlign: "center" }}>Score (%)</th>
                                                    <th>Technician Diagnostic Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(Array.isArray(reportResults) ? reportResults : []).map((resItem, idx) => (
                                                    <tr key={idx}>
                                                        <td className="comp-name-td">
                                                            <div className="comp-name-inner">
                                                                <span className="comp-icon"><FiCpu /></span>
                                                                <span className="comp-title">{resItem.component}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {resItem.photos && resItem.photos.length > 0 ? (
                                                                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                                                                    {resItem.photos.map((p, pIdx) => (
                                                                        <img
                                                                            key={pIdx}
                                                                            src={getMediaUrl(p.photoPath)}
                                                                            alt={p.photoType || resItem.component}
                                                                            onClick={() => setPreviewImageModal(getMediaUrl(p.photoPath))}
                                                                            style={{
                                                                                width: "36px",
                                                                                height: "36px",
                                                                                borderRadius: "6px",
                                                                                objectFit: "cover",
                                                                                border: "1px solid #cbd5e1",
                                                                                cursor: "pointer",
                                                                                boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
                                                                            }}
                                                                            title="Click to view full resolution"
                                                                        />
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>No photos</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={`status-pill ${resItem.result === "Working" ? "status-pill--completed" : "status-pill--assigned"}`}>
                                                                {resItem.result}
                                                            </span>
                                                        </td>
                                                        <td style={{ textAlign: "center", fontWeight: 800 }}>{resItem.score}%</td>
                                                        <td>{resItem.remarks || "No issue noted"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Section 4: Technician Hardware Inspection Evidence Photos Grid */}
                                {(() => {
                                    const modalPhotos = extractArray(reportResults).flatMap((r, rIdx) => {
                                        const pList = extractArray(r.photos || r.Photos || r.inspectionPhotos || r.InspectionPhotos);
                                        return pList.map((p, pIdx) => ({
                                            id: p.inspectionPhotoId || `${r.inspectionResultId || r.component || rIdx}-${pIdx}`,
                                            title: p.photoType || p.PhotoType || r.component || r.CriteriaName || "Inspection Evidence",
                                            url: getMediaUrl(p.photoPath || p.PhotoPath || p.path)
                                        }));
                                    }).filter(p => Boolean(p.url));

                                    if (modalPhotos.length > 0) {
                                        return (
                                            <>
                                                <div className="modal-section-title" style={{ marginTop: "1rem" }}>
                                                    <FiCamera /> 4. Technician Hardware Inspection Evidence Photos
                                                </div>
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.85rem", marginTop: "0.6rem", marginBottom: "1.2rem" }}>
                                                    {modalPhotos.map((p) => (
                                                        <div
                                                            key={p.id}
                                                            className="photo-card-v2"
                                                            onClick={() => setPreviewImageModal(p.url)}
                                                            style={{
                                                                background: "#ffffff",
                                                                border: "1px solid #e2e8f0",
                                                                borderRadius: "10px",
                                                                padding: "0.6rem",
                                                                textAlign: "center",
                                                                cursor: "pointer",
                                                                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                                                                transition: "transform 0.15s ease"
                                                            }}
                                                        >
                                                            <span style={{ display: "block", fontSize: "0.725rem", fontWeight: 800, color: "#059669", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                                                                {p.title}
                                                            </span>
                                                            <img
                                                                src={p.url}
                                                                alt={p.title}
                                                                style={{ width: "100%", height: "130px", borderRadius: "8px", objectFit: "cover", border: "1px solid #cbd5e1" }}
                                                            />
                                                            <span style={{ display: "block", fontSize: "0.675rem", color: "#64748b", fontWeight: 700, marginTop: "0.35rem" }}>
                                                                🔍 Click to Enlarge
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        );
                                    }

                                    return (
                                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem", color: "#64748b", fontSize: "0.85rem", marginBottom: "1.2rem", textAlign: "center" }}>
                                            <FiCamera style={{ fontSize: "1.2rem", color: "#94a3b8", marginBottom: "0.3rem" }} />
                                            <div>No additional component evidence photos captured during this inspection.</div>
                                        </div>
                                    );
                                })()}

                                {/* Official EcoCycle Verification Stamp & Certified Signature */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px dashed #cbd5e1" }}>
                                    <div style={{ border: "2px dashed #059669", borderRadius: "8px", padding: "0.5rem 1rem", textAlign: "center", color: "#059669" }}>
                                        <div style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>ECOCYCLE VERIFIED</div>
                                        <div style={{ fontSize: "0.65rem", fontWeight: 700, marginTop: "2px" }}>Official Inspection Approved</div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ width: "160px", borderBottom: "1px dashed #0f172a", marginBottom: "4px", display: "inline-block" }}></div>
                                        <div style={{ fontSize: "0.825rem", fontWeight: 800, color: "#0f172a" }}>{techName}</div>
                                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>Certified Hardware Inspection Officer</div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn btn--secondary" onClick={() => setSelectedReport(null)}>
                                    Close
                                </button>
                                <button
                                    className="btn btn--primary"
                                    onClick={() => handleDownloadReportPdf(selectedReport, reportResults)}
                                >
                                    <FiDownload /> Download Official Detailed PDF
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Image Lightbox Modal */}
                {previewImageModal && (
                    <div className="modal-backdrop" onClick={() => setPreviewImageModal(null)} style={{ zIndex: 9999 }}>
                        <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
                            <button
                                className="close-modal-btn"
                                onClick={() => setPreviewImageModal(null)}
                                style={{ position: "absolute", top: "-15px", right: "-15px", background: "#ffffff", borderRadius: "50%", padding: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
                            >
                                <FiX />
                            </button>
                            <img
                                src={previewImageModal}
                                alt="Component Evidence"
                                style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: "12px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default InspectionReport;
