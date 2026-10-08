import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
    FiSearch,
    FiRefreshCw,
    FiBell,
    FiCheckCircle,
    FiFileText,
    FiDownload,
    FiEye,
    FiX,
    FiCpu,
    FiGrid,
    FiList,
    FiAlertCircle,
    FiSmartphone,
    FiShield,
    FiActivity,
    FiCamera,
    FiAward,
    FiUserCheck,
    FiMail,
    FiHome,
    FiPhone,
    FiChevronDown
} from "react-icons/fi";
import Sidebar from "./Sidebar";
import "./Citizendashboard.css";
import "./View_device.css";
import "./Device_report.css";

function CitizenDeviceReport() {
    const navigate = useNavigate();

    // Data & UI States
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportResults, setReportResults] = useState([]);
    const [inspectingTechnicianName, setInspectingTechnicianName] = useState(null);
    const [inspectingTechnicianDetails, setInspectingTechnicianDetails] = useState(null);
    const [resultsLoading, setResultsLoading] = useState(false);
    const [previewImageModal, setPreviewImageModal] = useState(null);

    // User Info State
    const [userName, setUserName] = useState("Citizen User");
    const [userInitial, setUserInitial] = useState("C");
    const [userPhoto, setUserPhoto] = useState(null);

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [notifLoading, setNotifLoading] = useState(false);

    // Sanitization Helper
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
        if (clean.includes("/")) return `https://localhost:7102/${clean}`;
        return `https://localhost:7102/${defaultFolder}/${clean}`;
    };

    // Fetch Citizen Profile Info & Photo matching Citizendashboard.jsx
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        axios.get("https://localhost:7102/api/User/profile", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
            const data = res.data || {};
            const name = `${data.firstName || data.FirstName || ""} ${data.lastName || data.LastName || ""}`.trim() || data.username || data.name || "Citizen User";
            setUserName(name);
            setUserInitial(name.charAt(0).toUpperCase());

            const img = data.profilePicture || data.profileImage || data.userPhoto || data.photo || data.profilePhoto;
            if (img) {
                if (img.startsWith("http") || img.startsWith("data:")) {
                    setUserPhoto(img);
                } else {
                    const cleanImg = img.replace(/^uploads[\\/]/, "").replace(/^profile[\\/]/, "").replace(/^[\\/]/, "");
                    setUserPhoto(`https://localhost:7102/uploads/profile/${cleanImg}`);
                }
            } else {
                const savedImage = localStorage.getItem("citizen_profile_image") || localStorage.getItem("userPhoto");
                if (savedImage) setUserPhoto(savedImage);
            }
        })
        .catch((err) => {
            console.error("Error fetching user profile:", err);
        });
    }, [navigate]);

    // Fetch Citizen Devices & Filter Inspected Devices
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;
        fetchMyInspectedDevices(token);
        fetchNotifications(token);
    }, []);

    const fetchMyInspectedDevices = async (tokenOverride) => {
        const token = tokenOverride || localStorage.getItem("token");
        if (!token) return;
        setLoading(true);
        try {
            const response = await axios.get("https://localhost:7102/api/Device/MyDevices", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const rawList = response.data || [];
            // Filter ONLY for devices where technician has completed the inspection
            const inspectedList = rawList.filter((d) => {
                const lifeStat = String(d.lifecycleStatus || "").toLowerCase();
                const status = String(d.status || "").toLowerCase();
                const reqStat = String(d.requestStatus || "").toLowerCase();

                return (
                    lifeStat === "inspected" ||
                    status === "inspected" ||
                    reqStat === "completed" ||
                    status === "completed"
                );
            });

            setDevices(inspectedList);
        } catch (err) {
            console.error("Error fetching citizen inspected devices:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async (tokenOverride) => {
        const token = tokenOverride || localStorage.getItem("token");
        if (!token) return;
        try {
            setNotifLoading(true);
            const response = await axios.get("https://localhost:7102/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data || []);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setNotifLoading(false);
        }
    };

    // When opening a report view modal, fetch its detailed hardware component diagnostic results & technician details
    useEffect(() => {
        if (selectedReport) {
            setResultsLoading(true);
            axios.get(`https://localhost:7102/api/DeviceInspection/results/${selectedReport.deviceId}`)
                .then((res) => {
                    const data = res.data;
                    if (Array.isArray(data)) {
                        setReportResults(data);
                        setInspectingTechnicianName(null);
                        setInspectingTechnicianDetails(null);
                    } else if (data) {
                        setReportResults(data.results || []);
                        setInspectingTechnicianName(data.technicianName || null);
                        setInspectingTechnicianDetails(data.technicianDetails || null);
                    }
                })
                .catch((err) => {
                    console.error("Error fetching detailed report results:", err);
                    setReportResults([]);
                    setInspectingTechnicianName(null);
                    setInspectingTechnicianDetails(null);
                })
                .finally(() => {
                    setResultsLoading(false);
                });
        } else {
            setReportResults([]);
            setInspectingTechnicianName(null);
            setInspectingTechnicianDetails(null);
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
            (item.categoryName || "").toLowerCase().includes(q)
        );
    });

    // Metric Counts
    const totalReports = devices.length;
    const refurbishCount = devices.filter((d) => String(d.processingPreference || "").toLowerCase().includes("refurbish")).length;
    const recyclingCount = devices.filter((d) => String(d.processingPreference || "").toLowerCase().includes("recycl")).length;
    const gradeACount = devices.filter((d) => String(d.condition || "").toLowerCase().includes("grade a")).length;

    // Detailed Printable PDF Report Generator (Includes Technician Name, Gmail, & Diagnostic Shop)
    const handleDownloadReportPdf = async (dev, existingResults = null) => {
        if (!dev) return;

        let results = existingResults;
        let techDetails = inspectingTechnicianDetails;
        let techName = inspectingTechnicianName || dev.technicianName || null;

        if (!results || results.length === 0 || !techDetails) {
            try {
                const res = await axios.get(`https://localhost:7102/api/DeviceInspection/results/${dev.deviceId}`);
                const data = res.data;
                if (Array.isArray(data)) {
                    results = data;
                } else if (data) {
                    results = data.results || [];
                    if (data.technicianName) techName = data.technicianName;
                    if (data.technicianDetails) techDetails = data.technicianDetails;
                }
            } catch (e) {
                console.error("Could not load inspection results for PDF", e);
                results = [];
            }
        }

        const finalTechnicianName = techDetails?.name || techName || "Certified Hardware Inspector";
        const finalTechnicianEmail = techDetails?.email || "technician@ecocycle.org";
        const finalTechnicianShop = techDetails?.shopName || "EcoCycle Primary Diagnostics Center";
        const finalTechnicianPhone = techDetails?.phone || "N/A";

        // Collect all corresponding component part photos
        const componentPhotos = [];
        if (results && results.length > 0) {
            results.forEach((r) => {
                if (r.photos && Array.isArray(r.photos) && r.photos.length > 0) {
                    r.photos.forEach((p) => {
                        if (p.photoPath) {
                            componentPhotos.push({
                                component: r.component || p.photoType || "Hardware Component",
                                url: getMediaUrl(p.photoPath)
                            });
                        }
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
        if (results && results.length > 0) {
            const sumScore = results.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
            avgScore = Math.round(sumScore / results.length);
        }

        printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>EcoCycle_Inspection_Certificate_DEV_${dev.deviceId}.pdf</title>
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
                    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }
                    
                    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
                    .info-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
                    .info-val { font-size: 12px; font-weight: 800; color: #0f172a; word-break: break-all; }

                    .diag-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                    .diag-table th { background: #f1f5f9; text-align: left; color: #475569; font-weight: 800; padding: 8px 12px; border: 1px solid #cbd5e1; }
                    .diag-table td { padding: 8px 12px; border: 1px solid #e2e8f0; vertical-align: middle; }

                    .stamp-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
                    .stamp-box { border: 2px dashed #059669; border-radius: 8px; padding: 8px 16px; text-align: center; color: #059669; }
                    .stamp-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
                    .stamp-sub { font-size: 8.5px; font-weight: 700; margin-top: 2px; }
                    .signature-box { text-align: right; }
                    .sig-line { width: 160px; border-bottom: 1px dashed #0f172a; margin-bottom: 4px; display: inline-block; }
                    .sig-name { font-size: 12px; font-weight: 800; color: #0f172a; }
                    .sig-role { font-size: 9px; color: #059669; font-weight: 700; text-transform: uppercase; }

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
                                Device ID: <strong>#DEV-${String(dev.deviceId).padStart(3, "0")}</strong> • Category: <strong>${dev.categoryName || "E-Waste"}</strong> • Owner: <strong>${userName}</strong>
                            </div>
                        </div>
                        <div class="hero-badge-group">
                            <div class="hero-badge">${dev.condition || "Grade A"}</div>
                            <span class="hero-score">Diagnostic Score: ${avgScore}%</span>
                        </div>
                    </div>

                    <div class="section-title">1. Certified Inspection Technician & Workshop Details</div>
                    <div class="grid-4">
                        <div class="info-card">
                            <div class="info-label">Technician Name</div>
                            <div class="info-val" style="color: #059669;">${finalTechnicianName}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Gmail / Email</div>
                            <div class="info-val" style="color: #2563eb;">${finalTechnicianEmail}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Workshop / Diagnostics Hub</div>
                            <div class="info-val" style="color: #0f172a;">${finalTechnicianShop}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Contact Phone</div>
                            <div class="info-val">${finalTechnicianPhone}</div>
                        </div>
                    </div>

                    <div class="section-title">2. Master Device & Specification Details</div>
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
                            <div class="info-label">Assigned Quality Grade</div>
                            <div class="info-val" style="color: #059669;">${dev.condition || "Grade A"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Processing Decision</div>
                            <div class="info-val" style="color: #2563eb;">${dev.processingPreference || "Refurbishment Center"}</div>
                        </div>
                    </div>

                    <div class="section-title">3. Detailed Hardware Diagnostic Component Matrix</div>
                    ${(results && results.length > 0) ? `
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
                                ${results.map(r => `
                                    <tr>
                                        <td style="font-weight: 800; color: #0f172a;">${r.component}</td>
                                        <td style="font-weight: 800; color: ${r.result === "Working" ? "#059669" : r.result === "Fair" ? "#d97706" : "#dc2626"};">
                                            ${r.result}
                                        </td>
                                        <td style="text-align: center; font-weight: 800;">${r.score}%</td>
                                        <td style="color: #334155;">${r.remarks || "Tested OK. No issues noted."}</td>
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
                        <div class="section-title">4. Hardware Component Part Photos Evidence</div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 10px;">
                            ${componentPhotos.map(p => `
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; text-align: center;">
                                    <span style="display: block; font-size: 10px; font-weight: 800; color: #059669; text-transform: uppercase; margin-bottom: 6px;">${p.component} - Evidence Photo</span>
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
                            <div class="sig-name">${finalTechnicianName}</div>
                            <div class="sig-role">Certified Hardware Inspection Officer</div>
                            <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">${finalTechnicianShop}</div>
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
        <div className="vd-page-layout">
            <Sidebar />

            <main className="vd-main-content">

{/* Main Control Header Panel */}
                <div className="control-bar-panel">
                    <div>
                        <h3 style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif", fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.2rem", color: "#0f172a" }}>My Inspection Reports</h3>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>Review certified technician diagnostic evaluation reports and download official PDF certificates</p>
                    </div>

                    <div className="control-panel-right-group">
                        <div className="vd-inline-search">
                            <FiSearch style={{ color: "#94a3b8", fontSize: "0.85rem" }} />
                            <input
                                type="text"
                                placeholder="Search brand, model, serial..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(sanitizeText(e.target.value))}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="vd-search-clear-btn">
                                    <FiX style={{ fontSize: "0.8rem" }} />
                                </button>
                            )}
                        </div>

                        <div className="filter-pills">
                            {["All", "Refurbishment", "Recycling"].map((tab) => {
                                const labelMap = {
                                    All: `All (${totalReports})`,
                                    Refurbishment: `Refurbishment (${refurbishCount})`,
                                    Recycling: `Recycling (${recyclingCount})`
                                };
                                return (
                                    <button
                                        key={tab}
                                        className={`pill-btn ${activeTab === tab ? "active" : ""}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {labelMap[tab] || tab}
                                    </button>
                                );
                            })}
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

                {/* Device Reports Content */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
                        <FiRefreshCw className="spin-icon" style={{ fontSize: "2rem", marginBottom: "0.5rem" }} />
                        <p>Loading your certified inspection reports...</p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "3rem 1.5rem", textAlign: "center", color: "#64748b" }}>
                        <FiFileText style={{ fontSize: "2.5rem", color: "#94a3b8", marginBottom: "0.5rem" }} />
                        <h3 style={{ margin: "0 0 0.4rem 0", color: "#0f172a" }}>No Inspection Reports Available</h3>
                        <p style={{ margin: 0, fontSize: "0.875rem" }}>When your submitted devices undergo technician inspection, their official certificates will appear here.</p>
                    </div>
                ) : viewMode === "grid" ? (
                    /* Cards Grid View */
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
                                            <span className="meta-val">{item.processingPreference || "Refurbish Hub"}</span>
                                        </div>
                                        <div className="meta-box">
                                            <span className="meta-lbl">Weight</span>
                                            <span className="meta-val">{item.weight || 1} kg</span>
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
                                        style={{ width: "100%", justifyContent: "center" }}
                                        onClick={() => handleDownloadReportPdf(item)}
                                        title="Download Certified Detailed PDF Report"
                                    >
                                        <FiDownload /> Download Report PDF
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Table View */
                    <div className="glass-table-wrapper">
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>Device ID</th>
                                    <th>Brand &amp; Model</th>
                                    <th>Category</th>
                                    <th>Quality Grade</th>
                                    <th>Destination Hub</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.map((item) => (
                                    <tr key={item.deviceId} className="table-row-hover">
                                        <td className="id-cell">#DEV-{String(item.deviceId).padStart(3, "0")}</td>
                                        <td>
                                            <span style={{ fontWeight: 700, color: "#0f172a" }}>{item.brand} {item.model}</span>
                                        </td>
                                        <td>
                                            <span style={{ background: "#f1f5f9", padding: "0.25rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700 }}>
                                                <FiCpu /> {item.categoryName || "E-Waste"}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ color: "#059669", fontWeight: 800 }}>
                                                <FiCheckCircle /> {item.condition || "Grade A"}
                                            </span>
                                        </td>
                                        <td>{item.processingPreference || "Refurbishment Hub"}</td>
                                        <td>
                                            <button
                                                className="btn btn--primary"
                                                style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                                                onClick={() => handleDownloadReportPdf(item)}
                                                title="Download Detailed Inspection PDF"
                                            >
                                                <FiDownload /> Download PDF
                                            </button>
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
                        <div className="inspection-modal-card">
                            <div className="modal-header">
                                <div>
                                    <h3>Device Inspection Report Details</h3>
                                    <p>Device Record #{selectedReport.deviceId} • {selectedReport.brand} {selectedReport.model}</p>
                                </div>
                                <button className="close-modal-btn" onClick={() => setSelectedReport(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="modal-body-scroll">
                                {/* Summary Hero Box */}
                                <div className="report-summary-hero">
                                    <div className="hero-left">
                                        <h4>{selectedReport.brand} {selectedReport.model}</h4>
                                        <p>Category: <strong>{selectedReport.categoryName || "E-Waste"}</strong> • Serial: <strong>{selectedReport.serialNumber || "N/A"}</strong></p>
                                    </div>
                                    <div className="hero-right" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
                                        <span className="grade-badge">{selectedReport.condition || "Grade A"}</span>
                                        <span className="hub-tag">{selectedReport.processingPreference || "Refurbishment Hub"}</span>
                                    </div>
                                </div>

                                {/* Section 1: Technician Details */}
                                <div className="modal-section-title">
                                    <FiUserCheck /> 1. Certified Inspection Technician &amp; Diagnostic Workshop
                                </div>
                                <div className="spec-meta-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                                    <div className="meta-box">
                                        <span className="meta-lbl">Technician Name</span>
                                        <span className="meta-val" style={{ color: "#059669" }}>
                                            {inspectingTechnicianDetails?.name || inspectingTechnicianName || selectedReport.technicianName || "Certified Inspector"}
                                        </span>
                                    </div>
                                    <div className="meta-box">
                                        <span className="meta-lbl">Gmail / Email</span>
                                        <span className="meta-val" style={{ color: "#2563eb", wordBreak: "break-all" }}>
                                            {inspectingTechnicianDetails?.email || "technician@ecocycle.org"}
                                        </span>
                                    </div>
                                    <div className="meta-box">
                                        <span className="meta-lbl">Workshop / Center</span>
                                        <span className="meta-val">
                                            {inspectingTechnicianDetails?.shopName || "EcoCycle Primary Diagnostics Center"}
                                        </span>
                                    </div>
                                    <div className="meta-box">
                                        <span className="meta-lbl">Contact Phone</span>
                                        <span className="meta-val">
                                            {inspectingTechnicianDetails?.phone || "N/A"}
                                        </span>
                                    </div>
                                </div>

                                {/* Section 2: Master Device Specifications */}
                                <div className="modal-section-title" style={{ marginTop: "1.2rem" }}>
                                    <FiCpu /> 2. Master Device Specifications
                                </div>
                                <div className="spec-meta-grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                                    <div className="meta-box">
                                        <span className="meta-lbl">Citizen Owner</span>
                                        <span className="meta-val">{userName}</span>
                                    </div>
                                    <div className="meta-box">
                                        <span className="meta-lbl">Purchase Date</span>
                                        <span className="meta-val">{selectedReport.purchaseDate ? new Date(selectedReport.purchaseDate).toLocaleDateString("en-IN") : "N/A"}</span>
                                    </div>
                                    <div className="meta-box">
                                        <span className="meta-lbl">Weight &amp; Quantity</span>
                                        <span className="meta-val">{selectedReport.weight || 1} kg ({selectedReport.quantity || 1} unit)</span>
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

                                {/* Section 3: Hardware Component Diagnostic Matrix */}
                                <div className="modal-section-title" style={{ marginTop: "1.2rem" }}>
                                    <FiFileText /> 3. Hardware Component Evaluation Table
                                </div>
                                {resultsLoading ? (
                                    <div style={{ textAlign: "center", padding: "1.5rem", color: "#64748b" }}>
                                        <FiRefreshCw className="spin-icon" /> Loading component diagnostic results...
                                    </div>
                                ) : reportResults.length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "1rem", color: "#94a3b8", fontSize: "0.85rem" }}>
                                        Standard category evaluation recorded. All core hardware tests passed specifications.
                                    </div>
                                ) : (
                                    <div className="hardware-test-table-wrap">
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
                                                {reportResults.map((resItem, idx) => (
                                                    <tr key={idx}>
                                                        <td>
                                                            <strong style={{ color: "#0f172a" }}>{resItem.component}</strong>
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
                                                                                cursor: "pointer"
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
                                                            <span style={{ color: resItem.result === "Working" ? "#059669" : "#d97706", fontWeight: 800 }}>
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

                                {/* Section 4: Hardware Component Evidence Photos Grid */}
                                {reportResults && reportResults.some((r) => r.photos && r.photos.length > 0) && (
                                    <>
                                        <div className="modal-section-title" style={{ marginTop: "1.2rem" }}>
                                            <FiCamera /> 4. Hardware Component Evidence Photos
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginTop: "0.5rem" }}>
                                            {reportResults.flatMap((r) =>
                                                (r.photos || []).map((p, pIdx) => (
                                                    <div
                                                        key={pIdx}
                                                        onClick={() => setPreviewImageModal(getMediaUrl(p.photoPath))}
                                                        style={{
                                                            background: "#f8fafc",
                                                            border: "1px solid #e2e8f0",
                                                            borderRadius: "8px",
                                                            padding: "0.5rem",
                                                            textAlign: "center",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        <span style={{ display: "block", fontSize: "0.7rem", fontWeight: 800, color: "#059669", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                                                            {p.photoType || r.component}
                                                        </span>
                                                        <img
                                                            src={getMediaUrl(p.photoPath)}
                                                            alt={r.component}
                                                            style={{ width: "100%", height: "110px", borderRadius: "6px", objectFit: "cover", border: "1px solid #cbd5e1" }}
                                                        />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
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

export default CitizenDeviceReport;
