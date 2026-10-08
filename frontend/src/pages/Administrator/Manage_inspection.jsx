import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import {
    FiClipboard,
    FiBell,
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
    FiX,
    FiRefreshCw,
    FiUserCheck,
    FiAlertTriangle,
    FiEye,
    FiLogOut,
    FiActivity,
    FiAward,
    FiCheck,
    FiMail,
    FiMapPin,
    FiShield,
    FiDownload
} from "react-icons/fi";
import "./Manage_inspection.css";

function ManageInspection() {
    const [assignments, setAssignments] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [penalties, setPenalties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [inspectionDetails, setInspectionDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [reassignModalTarget, setReassignModalTarget] = useState(null);
    const [selectedNewTechId, setSelectedNewTechId] = useState("");
    const [reassigning, setReassigning] = useState(false);
    const [allocatingId, setAllocatingId] = useState(null);
    const [allocationFeedback, setAllocationFeedback] = useState(null);

    const handleAllocateTechnicianAuto = async (item) => {
        const token = localStorage.getItem("token");
        const status = String(item.status || "").toLowerCase();

        if (status === "waiting") {
            setReassignModalTarget(item);
            setSelectedNewTechId("");
            return;
        }

        try {
            setAllocatingId(item.deviceId);
            setAllocationFeedback(null);

            const response = await axios.post(
                `https://localhost:7102/api/Inspection/manual-allocate/${item.deviceId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const msg = response.data?.message || "";
            const isWaiting = response.data?.status === "Waiting" || msg.toLowerCase().includes("no eligible active technician");

            if (!isWaiting) {
                setAllocationFeedback({ type: "success", text: msg || "Technician allocated successfully!" });
                setTimeout(() => setAllocationFeedback(null), 3500);
                await fetchData(token);
            } else {
                await fetchData(token);
                setReassignModalTarget(item);
                setSelectedNewTechId("");
            }
        } catch (err) {
            console.error("Error auto-allocating technician:", err);
            await fetchData(token);
            setReassignModalTarget(item);
            setSelectedNewTechId("");
        } finally {
            setAllocatingId(null);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetchData(token);
    }, []);

    const fetchData = async (authToken) => {
        const token = authToken || localStorage.getItem("token");
        try {
            setLoading(true);
            const [assignRes, techRes, penRes] = await Promise.all([
                axios.get("https://localhost:7102/api/Inspection/admin/assignments", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get("https://localhost:7102/api/Technician/All", {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: [] })),
                axios.get("https://localhost:7102/api/Inspection/technician-penalties", {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => ({ data: [] }))
            ]);

            setAssignments(assignRes.data || []);
            setTechnicians(techRes.data || []);
            setPenalties(penRes.data || []);
        } catch (err) {
            console.error("Error fetching admin inspection assignments:", err);
        } finally {
            setLoading(false);
        }
    };

    const [extendingId, setExtendingId] = useState(null);

    const handleGrantExtension = async (deviceId, hours = 24) => {
        const token = localStorage.getItem("token");
        try {
            setExtendingId(deviceId);
            await axios.post(`https://localhost:7102/api/Inspection/admin/extend-deadline/${deviceId}?hours=${hours}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData(token);
        } catch (err) {
            console.error("Error extending inspection deadline:", err);
            alert("Failed to extend deadline. Please try again.");
        } finally {
            setExtendingId(null);
        }
    };

    const handleReassignTechnician = async (techIdToUse = null) => {
        const targetTechId = techIdToUse || selectedNewTechId;
        if (!reassignModalTarget) return;
        
        const token = localStorage.getItem("token");
        try {
            setReassigning(true);
            let url = `https://localhost:7102/api/Inspection/manual-allocate/${reassignModalTarget.deviceId}`;
            if (targetTechId && targetTechId !== "auto") {
                url += `/${targetTechId}`;
            }

            await axios.post(url, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setReassignModalTarget(null);
            setSelectedNewTechId("");
            fetchData(token);
        } catch (err) {
            console.error("Error reassigning technician:", err);
        } finally {
            setReassigning(false);
        }
    };

    const handleViewDetails = async (item) => {
        setSelectedAssignment(item);
        setLoadingDetails(true);
        setInspectionDetails(null);

        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`https://localhost:7102/api/DeviceInspection/results/${item.deviceId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInspectionDetails(res.data);
        } catch (err) {
            console.error("Error loading inspection results:", err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const isInspectionCompleted = (item) => {
        if (!item) return false;
        const s = String(item.status || "").toLowerCase();
        const lcs = String(item.lifecycleStatus || "").toLowerCase();
        return s === "completed" || lcs === "inspected" || Boolean(item.isInspected);
    };

    const getMediaUrl = (photoPath, defaultFolder = "uploads/inspections/photos") => {
        if (!photoPath) return null;
        if (photoPath.startsWith("data:") || photoPath.startsWith("blob:")) return photoPath;
        if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) return photoPath;
        const clean = photoPath.replace(/\\/g, "/").replace(/^\/+/, "");
        if (clean.includes("/")) return `https://localhost:7102/${clean}`;
        return `https://localhost:7102/${defaultFolder}/${clean}`;
    };

    const handleDownloadReportPdf = async (item, existingResults = null, existingDetails = null) => {
        if (!item) return;

        let details = existingDetails;
        let results = existingResults;

        if (!details || !results) {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(`https://localhost:7102/api/DeviceInspection/results/${item.deviceId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                details = res.data || {};
                if (Array.isArray(details)) {
                    results = details;
                } else if (details && Array.isArray(details.results)) {
                    results = details.results;
                } else if (details && Array.isArray(details.$values)) {
                    results = details.$values;
                } else {
                    results = [];
                }
            } catch (e) {
                console.error("Could not load inspection results for PDF", e);
                results = [];
                details = {};
            }
        }

        // Collect component photos
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

        let overallScore = details?.overallScore;
        if (overallScore === undefined || overallScore === null) {
            if (results && results.length > 0) {
                const sumScore = results.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
                overallScore = Math.round(sumScore / results.length);
            } else {
                overallScore = 100;
            }
        }

        const techName = details?.technicianName || item.technicianName || "Certified Hardware Inspector";
        const techEmail = details?.technicianDetails?.email || item.technicianEmail || "N/A";
        const techCenter = details?.technicianDetails?.shopName || "EcoCycle Regional Hub";
        const overallCondition = details?.overallCondition || item.condition || "Grade A";
        const recommendedAction = details?.recommendedAction || "Approved Inspection";
        const techRemarks = details?.technicianRemarks || "";

        printWin.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>EcoCycle_Official_Inspection_Report_DEV_${item.deviceId}.pdf</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700&display=swap');
                    * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; }
                    body { margin: 0; padding: 24px; background: #ffffff; color: #0f172a; }
                    .report-container { max-width: 840px; margin: 0 auto; border: 2px solid #059669; border-radius: 16px; padding: 28px; background: #ffffff; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 18px; margin-bottom: 20px; }
                    .brand { font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 800; color: #059669; letter-spacing: -0.5px; }
                    .sub-brand { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
                    .doc-title { text-align: right; }
                    .doc-title h2 { margin: 0; font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; }
                    .doc-title p { margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 600; }
                    
                    .hero-banner { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 14px; padding: 18px 22px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: center; }
                    .hero-dev-title { font-size: 22px; font-weight: 800; color: #047857; margin: 0 0 4px 0; }
                    .hero-dev-meta { font-size: 12px; color: #065f46; font-weight: 600; }
                    .hero-badge-group { text-align: right; }
                    .hero-badge { background: #059669; color: #ffffff; padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 800; text-transform: uppercase; display: inline-block; }
                    .hero-score { font-size: 12px; font-weight: 800; color: #047857; margin-top: 5px; display: block; }

                    .section-title { font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase; letter-spacing: 1px; margin: 22px 0 10px 0; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; }
                    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }
                    
                    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
                    .info-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
                    .info-val { font-size: 13px; font-weight: 800; color: #0f172a; word-break: break-word; }

                    .notes-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 16px; margin-top: 10px; }
                    .notes-title { font-size: 11px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; margin-bottom: 4px; }
                    .notes-text { font-size: 12px; color: #1e3a8a; margin: 0; line-height: 1.45; }

                    .diag-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
                    .diag-table th { background: #f1f5f9; text-align: left; color: #475569; font-weight: 800; padding: 8px 12px; border: 1px solid #cbd5e1; }
                    .diag-table td { padding: 8px 12px; border: 1px solid #e2e8f0; vertical-align: middle; }

                    .stamp-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 28px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
                    .stamp-box { border: 2px dashed #059669; border-radius: 8px; padding: 8px 16px; text-align: center; color: #059669; }
                    .stamp-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
                    .stamp-sub { font-size: 8.5px; font-weight: 700; margin-top: 2px; }
                    .signature-box { text-align: right; }
                    .sig-line { width: 160px; border-bottom: 1px dashed #0f172a; margin-bottom: 4px; display: inline-block; }
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
                            <h2>Inspection Report</h2>
                            <p>Generated Date: ${dateStr}</p>
                        </div>
                    </div>

                    <div class="hero-banner">
                        <div>
                            <h1 class="hero-dev-title">${item.brand} ${item.model}</h1>
                            <div class="hero-dev-meta">
                                Device ID: <strong>#DEV-${String(item.deviceId).padStart(3, "0")}</strong> • Category: <strong>${item.category || "E-Waste"}</strong> • Citizen Owner: <strong>${item.userName || "Citizen"}</strong>
                            </div>
                        </div>
                        <div class="hero-badge-group">
                            <div class="hero-badge">${overallCondition}</div>
                            <span class="hero-score">Health Score: ${overallScore}%</span>
                        </div>
                    </div>

                    <div class="section-title">1. Master Device & Customer Information</div>
                    <div class="grid-4">
                        <div class="info-card">
                            <div class="info-label">Brand & Model</div>
                            <div class="info-val">${item.brand} ${item.model}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Inspection Request ID</div>
                            <div class="info-val">#REQ-${item.inspectionRequestId}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Category</div>
                            <div class="info-val">${item.category || "E-Waste"}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Citizen Owner</div>
                            <div class="info-val">${item.userName || "N/A"}</div>
                        </div>
                    </div>

                    <div class="section-title">2. Technician & Evaluation Summary</div>
                    <div class="grid-4">
                        <div class="info-card">
                            <div class="info-label">Assigned Inspector</div>
                            <div class="info-val">${techName}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Inspector Contact</div>
                            <div class="info-val">${techEmail}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Inspection Center</div>
                            <div class="info-val">${techCenter}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-label">Recommended Action</div>
                            <div class="info-val" style="color: #059669;">${recommendedAction}</div>
                        </div>
                    </div>

                    ${techRemarks ? `
                        <div class="notes-box">
                            <div class="notes-title">Inspector Remarks & Diagnostic Notes</div>
                            <p class="notes-text">${techRemarks}</p>
                        </div>
                    ` : ""}

                    <div class="section-title">3. Hardware Component Diagnostic Matrix</div>
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
                                        <td style="font-weight: 800; color: #0f172a;">
                                            ${r.component}
                                        </td>
                                        <td style="font-weight: 800; color: ${r.result === "Working" || r.result === "Passed" ? "#059669" : r.result === "Fair" || r.result === "Needs Minor Repair" ? "#d97706" : "#dc2626"};">
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
                            Standard category evaluation recorded. Diagnostic checks completed with positive verification.
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
                            <div class="sig-name">${techName}</div>
                            <div class="sig-role">Certified Hardware Inspection Officer</div>
                        </div>
                    </div>

                    <div class="footer-notice">
                        Official Technical Inspection Evaluation Certificate • EcoCycle E-Waste Platform (Device Record: #DEV-${item.deviceId}).
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

    // Filter Inspections logic
    const totalInspections = assignments.length;
    
    const waitingCount = assignments.filter(a => {
        const s = String(a.status || "").toLowerCase();
        return s === "waiting" || s === "assigned";
    }).length;

    const inProgressCount = assignments.filter(a => {
        const s = String(a.status || "").toLowerCase();
        const lcs = String(a.lifecycleStatus || "").toLowerCase();
        if (s === "completed" || lcs === "inspected" || Boolean(a.isInspected)) return false;
        return s === "accepted" || s === "inprogress";
    }).length;

    const completedCount = assignments.filter(a => {
        const s = String(a.status || "").toLowerCase();
        const lcs = String(a.lifecycleStatus || "").toLowerCase();
        return s === "completed" || lcs === "inspected" || Boolean(a.isInspected);
    }).length;

    const expiredRejectedCount = assignments.filter(a => {
        const s = String(a.status || "").toLowerCase();
        return s === "expired" || s === "rejected" || s === "cancelled" || s === "reassigned";
    }).length;

    const overdueCount = assignments.filter(a => {
        const s = String(a.status || "").toLowerCase();
        const lcs = String(a.lifecycleStatus || "").toLowerCase();
        const isDone = s === "completed" || lcs === "inspected" || Boolean(a.isInspected);
        return a.isInspectionOverdue && !isDone;
    }).length;

    const penalizedCount = assignments.filter(a => {
        const s = String(a.status || "").toLowerCase();
        const lcs = String(a.lifecycleStatus || "").toLowerCase();
        return s === "penalized" || lcs === "inspectionpenalized";
    }).length;

    const filteredAssignments = assignments.filter(item => {
        const status = String(item.status || "").toLowerCase();
        const lcs = String(item.lifecycleStatus || "").toLowerCase();
        const isDone = status === "completed" || lcs === "inspected" || Boolean(item.isInspected);

        if (activeTab === "Waiting" && status !== "waiting" && status !== "assigned") return false;
        if (activeTab === "InProgress" && (isDone || (status !== "accepted" && status !== "inprogress"))) return false;
        if (activeTab === "Completed" && !isDone) return false;
        if (activeTab === "Expired" && status !== "expired" && status !== "rejected" && status !== "cancelled" && status !== "reassigned") return false;
        if (activeTab === "Overdue" && (!item.isInspectionOverdue || isDone)) return false;
        if (activeTab === "Penalized" && status !== "penalized" && lcs !== "inspectionpenalized") return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const devName = `${item.brand || ""} ${item.model || ""}`.toLowerCase();
        const catName = String(item.category || "").toLowerCase();
        const techName = String(item.technicianName || "").toLowerCase();
        const techEmail = String(item.technicianEmail || "").toLowerCase();
        const customer = String(item.userName || "").toLowerCase();

        return (
            devName.includes(q) ||
            catName.includes(q) ||
            techName.includes(q) ||
            techEmail.includes(q) ||
            customer.includes(q)
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
        const status = String(item.status || "").toLowerCase();
        const lcs = String(item.lifecycleStatus || "").toLowerCase();
        const isDone = status === "completed" || lcs === "inspected" || Boolean(item.isInspected);

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

        if (status === "penalized" || lcs === "inspectionpenalized") {
            return <span style={{ ...badgeStyle, background: "#fff7ed", color: "#c2410c", border: "1px solid #fdba74" }}><FiAlertTriangle /> Fine Applied - Penalized</span>;
        } else if (item.isInspectionOverdue && !isDone) {
            return <span style={{ ...badgeStyle, background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" }}><FiAlertTriangle /> Inspection Overdue</span>;
        } else if (isDone) {
            return <span style={{ ...badgeStyle, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}><FiCheckCircle /> Inspected</span>;
        } else if (status === "inprogress" || status === "accepted") {
            return <span style={{ ...badgeStyle, background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }}><FiActivity /> Inspection In Progress</span>;
        } else if (status === "assigned") {
            return <span style={{ ...badgeStyle, background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}><FiUserCheck /> Technician Assigned</span>;
        } else if (status === "expired" || status === "rejected") {
            return <span style={{ ...badgeStyle, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}><FiAlertTriangle /> {status === "expired" ? "Request Expired" : "Rejected"}</span>;
        } else if (status === "reassigned") {
            return <span style={{ ...badgeStyle, background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" }}><FiRefreshCw /> Reassigned (History)</span>;
        } else {
            return <span style={{ ...badgeStyle, background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}><FiClock /> Waiting Allocation</span>;
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
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return dateStr;
        }
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
                            <h1>Manage Device Inspections</h1>
                        </div>
                        <p className="command-subtitle">
                            Track, manage, and reassign technician inspection requests for e-waste items
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search device, technician, customer..."
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
                            <FiClipboard />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{totalInspections}</h3>
                            <p>Total Inspections</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon alert">
                            <FiClock />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{waitingCount}</h3>
                            <p>Waiting / Assigned</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon active">
                            <FiActivity />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{inProgressCount}</h3>
                            <p>In Inspection</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon done">
                            <FiCheckCircle />
                        </div>
                        <div className="admin-metric-info">
                            <h3>{completedCount}</h3>
                            <p>Completed / Inspected</p>
                        </div>
                    </div>
                </div>

                {/* Main Operations Panel */}
                <div className="panel-card">
                    <div className="panel-header">
                        <div>
                            <h2 className="panel-title">Inspection Requests Queue</h2>
                            <p className="panel-subtitle">Overview of device hardware inspection status and assigned technicians</p>
                        </div>

                        <div className="panel-actions" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                            <div className="filter-pill-group">
                                {[
                                    { id: "All", label: "All", count: totalInspections },
                                    { id: "Waiting", label: "Waiting", count: waitingCount },
                                    { id: "InProgress", label: "In Progress", count: inProgressCount },
                                    { id: "Completed", label: "Completed", count: completedCount },
                                    { id: "Expired", label: "Expired / Reassigned", count: expiredRejectedCount },
                                    { id: "Overdue", label: "Overdue", count: overdueCount },
                                    { id: "Penalized", label: "Penalized (Fine Applied)", count: penalizedCount }
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

                    {/* Content Display: Table Mode vs Grid Mode */}
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading inspection requests data...</p>
                        </div>
                    ) : filteredAssignments.length === 0 ? (
                        <div className="no-data-state">
                            <FiClipboard className="no-data-icon" />
                            <h3>No inspection requests found</h3>
                            <p>There are no items matching your selected criteria or search term.</p>
                        </div>
                    ) : viewMode === "table" ? (
                        <div className="glass-table-wrapper">
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Device / Item</th>
                                        <th>Category</th>
                                        <th>Customer</th>
                                        <th>Assigned Technician</th>
                                        <th>Status</th>
                                        <th>Reassigned</th>
                                        <th>Deadline</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAssignments.map((item) => (
                                        <tr key={item.inspectionRequestId} className="table-row-hover">
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                    <div className="admin-cat-icon-box">
                                                        {getCategoryIcon(item.category)}
                                                    </div>
                                                    <div>
                                                        <div className="user-name">{item.brand} {item.model}</div>
                                                        <div className="user-email">Req #{item.inspectionRequestId} • Device #{item.deviceId}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="cat-tag-pill">{item.category || "E-Waste"}</span>
                                            </td>
                                            <td>
                                                <div className="user-info">
                                                    <span className="user-name">{item.userName || "Citizen"}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {item.technicianName ? (
                                                    <div className="user-info">
                                                        <span className="user-name" style={{ color: "#0f172a", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                                            <FiUserCheck style={{ color: "#10b981" }} /> {item.technicianName}
                                                        </span>
                                                        <span className="user-email">{item.technicianEmail || "N/A"}</span>
                                                    </div>
                                                ) : (
                                                    <span className="unassigned-chip"><FiClock /> Unassigned</span>
                                                )}
                                            </td>
                                            <td>{getStatusBadge(item)}</td>
                                            <td>
                                                {item.reassignmentCount > 0 ? (
                                                    <span className="reassign-pill">{item.reassignmentCount}x Reassigned</span>
                                                ) : (
                                                    <span style={{ fontSize: "0.775rem", color: "#94a3b8" }}>—</span>
                                                )}
                                            </td>
                                            <td>
                                                <span style={{ fontSize: "0.8rem", color: item.isInspectionOverdue ? "#dc2626" : "#475569", fontWeight: item.isInspectionOverdue ? 700 : 500 }}>
                                                    {formatDate(item.inspectionDeadline || item.responseDeadline)}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                                    <button
                                                        className="action-icon-btn view-btn"
                                                        title="View Details & Inspection Report"
                                                        onClick={() => handleViewDetails(item)}
                                                    >
                                                        <FiEye />
                                                    </button>
                                                    {item.isInspectionOverdue && !isInspectionCompleted(item) && (
                                                        <button
                                                            className="action-icon-btn"
                                                            title={item.extensionCount >= 2 ? "Maximum 2 extensions reached. Penalty applies if incomplete." : `Grant 24-Hour Inspection Extension (${item.extensionCount || 0}/2)`}
                                                            style={item.extensionCount >= 2 ? { background: "#f1f5f9", color: "#94a3b8", border: "1px solid #cbd5e1", cursor: "not-allowed" } : { background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}
                                                            disabled={extendingId === item.deviceId || item.extensionCount >= 2}
                                                            onClick={() => handleGrantExtension(item.deviceId, 24)}
                                                        >
                                                            <FiClock />
                                                        </button>
                                                    )}
                                                    {isInspectionCompleted(item) ? (
                                                        <button
                                                            className="action-icon-btn download-btn"
                                                            title="Download Official PDF Report"
                                                            onClick={() => handleDownloadReportPdf(item)}
                                                        >
                                                            <FiDownload />
                                                        </button>
                                                    ) : String(item.status || "").toLowerCase() === "waiting" ? (
                                                        <button
                                                            className="action-icon-btn reassign-btn"
                                                            title="Allocate Manually"
                                                            style={{ background: "#fffbebf0", color: "#b45309", border: "1px solid #fde68a" }}
                                                            onClick={() => {
                                                                setReassignModalTarget(item);
                                                                setSelectedNewTechId("");
                                                            }}
                                                        >
                                                            <FiCpu />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className={`action-icon-btn ${item.status?.toLowerCase() === "penalized" || String(item.lifecycleStatus).toLowerCase() === "inspectionpenalized" ? "reassign-penalized-btn" : "reassign-btn"}`}
                                                            title={item.status?.toLowerCase() === "penalized" || String(item.lifecycleStatus).toLowerCase() === "inspectionpenalized" ? "Allocate Technician" : "Reassign Technician"}
                                                            style={item.status?.toLowerCase() === "penalized" || String(item.lifecycleStatus).toLowerCase() === "inspectionpenalized" ? { background: "#fff7ed", color: "#c2410c", border: "1px solid #fdba74" } : {}}
                                                            disabled={allocatingId === item.deviceId}
                                                            onClick={() => handleAllocateTechnicianAuto(item)}
                                                        >
                                                            <FiCpu className={allocatingId === item.deviceId ? "spin-icon" : ""} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="admin-cards-grid">
                            {filteredAssignments.map((item) => (
                                <div key={item.inspectionRequestId} className="admin-pickup-card">
                                    <div>
                                        <div className="admin-card-header">
                                            <div className="admin-card-top-row">
                                                <div className="admin-cat-icon-box">
                                                    {getCategoryIcon(item.category)}
                                                </div>
                                                {getStatusBadge(item)}
                                            </div>
                                            <div className="admin-card-title-group">
                                                <span className="admin-card-brand-name">{item.brand} {item.model}</span>
                                                <span className="admin-card-sub-info">
                                                    Req #{item.inspectionRequestId} • Category: {item.category || "E-Waste"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="admin-card-body-details">
                                            <div className="admin-detail-row">
                                                <FiUser className="detail-icon" />
                                                <div>
                                                    <div className="detail-label">Customer</div>
                                                    <div className="detail-val">{item.userName || "Citizen Owner"}</div>
                                                </div>
                                            </div>

                                            <div className="admin-detail-row">
                                                <FiUserCheck className="detail-icon" style={{ color: item.technicianName ? "#10b981" : "#f59e0b" }} />
                                                <div>
                                                    <div className="detail-label">Assigned Technician</div>
                                                    <div className="detail-val">
                                                        {item.technicianName ? item.technicianName : "Waiting Allocation"}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="admin-detail-row" style={item.isInspectionOverdue ? { background: "#fef2f2", padding: "0.4rem 0.6rem", borderRadius: "8px", border: "1px solid #fecaca" } : {}}>
                                                <FiClock className="detail-icon" style={{ color: item.isInspectionOverdue ? "#dc2626" : "#64748b" }} />
                                                <div>
                                                    <div className="detail-label" style={{ color: item.isInspectionOverdue ? "#dc2626" : "#94a3b8" }}>
                                                        {item.isInspectionOverdue ? "Inspection Overdue" : "Inspection Deadline"}
                                                    </div>
                                                    <div className="detail-val" style={{ color: item.isInspectionOverdue ? "#991b1b" : "#1e293b" }}>
                                                        {formatDate(item.inspectionDeadline || item.responseDeadline)}
                                                        {item.extensionCount > 0 && (
                                                            <span style={{ marginLeft: "0.4rem", fontSize: "0.725rem", padding: "0.1rem 0.4rem", borderRadius: "6px", background: item.extensionCount >= 2 ? "#fee2e2" : "#fef3c7", color: item.extensionCount >= 2 ? "#b91c1c" : "#b45309", fontWeight: 800 }}>
                                                                {item.extensionCount}/2 Ext
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {item.reassignmentCount > 0 && (
                                                <div className="admin-detail-row">
                                                    <FiRefreshCw className="detail-icon" style={{ color: "#8b5cf6" }} />
                                                    <div>
                                                        <div className="detail-label">Reassignment History</div>
                                                        <div className="detail-val" style={{ color: "#7c3aed" }}>
                                                            Reassigned {item.reassignmentCount} time(s)
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="admin-card-actions">
                                        <button
                                            className="btn-card-action btn-card-primary"
                                            onClick={() => handleViewDetails(item)}
                                        >
                                            <FiEye /> View Report
                                        </button>

                                        {item.isInspectionOverdue && !isInspectionCompleted(item) && (
                                            <button
                                                className="btn-card-action btn-card-warning"
                                                disabled={extendingId === item.deviceId || item.extensionCount >= 2}
                                                onClick={() => handleGrantExtension(item.deviceId, 24)}
                                                style={item.extensionCount >= 2 ? { opacity: 0.6, cursor: "not-allowed", background: "#f1f5f9", color: "#64748b", border: "1px solid #cbd5e1" } : {}}
                                            >
                                                <FiClock /> {extendingId === item.deviceId ? "Extending..." : item.extensionCount >= 2 ? "Max Ext (2/2)" : `+24h Ext (${item.extensionCount || 0}/2)`}
                                            </button>
                                        )}

                                        {isInspectionCompleted(item) ? (
                                            <button
                                                className="btn-card-action btn-card-download"
                                                onClick={() => handleDownloadReportPdf(item)}
                                            >
                                                <FiDownload /> Download PDF
                                            </button>
                                        ) : String(item.status || "").toLowerCase() === "waiting" ? (
                                            <button
                                                className="btn-card-action btn-card-warning"
                                                style={{ background: "#fffbebf0", color: "#b45309", border: "1px solid #fde68a", fontWeight: 700 }}
                                                onClick={() => {
                                                    setReassignModalTarget(item);
                                                    setSelectedNewTechId("");
                                                }}
                                            >
                                                <FiCpu /> Allocate Manually
                                            </button>
                                        ) : (
                                            <button
                                                className={`btn-card-action ${item.status?.toLowerCase() === "penalized" || String(item.lifecycleStatus).toLowerCase() === "inspectionpenalized" ? "btn-card-warning" : "btn-card-secondary"}`}
                                                style={item.status?.toLowerCase() === "penalized" || String(item.lifecycleStatus).toLowerCase() === "inspectionpenalized" ? { background: "#fff7ed", color: "#c2410c", border: "1px solid #fdba74", fontWeight: 700 } : {}}
                                                disabled={allocatingId === item.deviceId}
                                                onClick={() => handleAllocateTechnicianAuto(item)}
                                            >
                                                <FiCpu className={allocatingId === item.deviceId ? "spin-icon" : ""} /> {allocatingId === item.deviceId ? "Allocating..." : item.status?.toLowerCase() === "penalized" || String(item.lifecycleStatus).toLowerCase() === "inspectionpenalized" ? "Allocate Tech" : "Reassign"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Reassign Technician Modal */}
            {reassignModalTarget && (
                <div className="admin-modal-backdrop" onClick={() => setReassignModalTarget(null)}>
                    <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div>
                                <h3>Reassign Inspection Technician</h3>
                                <p>Select a qualified hardware technician for Device #{reassignModalTarget.deviceId}</p>
                            </div>
                            <button className="admin-modal-close" onClick={() => setReassignModalTarget(null)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="admin-modal-body">
                            {(reassignModalTarget.status?.toLowerCase() === "penalized" || String(reassignModalTarget.lifecycleStatus).toLowerCase() === "inspectionpenalized") && (
                                <div style={{ background: "#fff7ed", border: "1px solid #fdba74", padding: "0.85rem 1.15rem", borderRadius: "12px", marginBottom: "1rem", color: "#c2410c", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                    <FiAlertTriangle style={{ fontSize: "1.2rem", flexShrink: 0 }} />
                                    <span><strong>Fine Imposed:</strong> Previous technician defaulted on deadline. Reallocate a new active technician (technicians with unpaid fines are automatically excluded).</span>
                                </div>
                            )}
                            <div className="modal-item-summary">
                                <div className="modal-item-title">
                                    {reassignModalTarget.brand} {reassignModalTarget.model}
                                </div>
                                <div className="modal-item-meta">
                                    Category: {reassignModalTarget.category || "E-Waste"} • Customer: {reassignModalTarget.userName}
                                </div>
                                {reassignModalTarget.technicianName && (
                                    <div className="modal-item-meta" style={{ color: "#d97706", marginTop: "0.25rem" }}>
                                        Currently Assigned: {reassignModalTarget.technicianName} ({reassignModalTarget.technicianEmail})
                                    </div>
                                )}
                            </div>

                            <div className="form-group-v2">
                                <label>Select Technician</label>
                                <select
                                    value={selectedNewTechId}
                                    onChange={(e) => setSelectedNewTechId(e.target.value)}
                                >
                                    <option value="">-- Choose Active Technician --</option>
                                    <option value="auto">⚡ Auto-Select Best Available (Lowest Workload)</option>
                                    {(() => {
                                        const penalizedSet = new Set(
                                            (penalties || [])
                                                .filter(p => String(p.status).toLowerCase() === "pending" || String(p.status).toLowerCase() === "unpaid")
                                                .map(p => p.technicianId)
                                        );

                                        return technicians.map((t) => {
                                            const isPenalized = penalizedSet.has(t.technicianId);
                                            return (
                                                <option key={t.technicianId} value={t.technicianId} disabled={isPenalized}>
                                                    {t.firstName} {t.lastName} ({t.specialization || "Certified Tech"}) — {t.inspectionCenterName || "Hub Center"} {isPenalized ? "⚠️ (Unpaid Fine - Excluded)" : ""}
                                                </option>
                                            );
                                        });
                                    })()}
                                </select>
                            </div>

                            <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.8rem", color: "#64748b" }}>
                                <p style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <FiShield style={{ color: "#10b981" }} />
                                    Reassigning will update the request status to <strong>Assigned</strong> and automatically notify the chosen technician via system alert & email.
                                </p>
                            </div>
                        </div>

                        <div className="admin-modal-footer">
                            <button
                                className="btn-modal-cancel"
                                onClick={() => setReassignModalTarget(null)}
                                disabled={reassigning}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-modal-confirm"
                                onClick={() => handleReassignTechnician()}
                                disabled={reassigning || (!selectedNewTechId)}
                            >
                                {reassigning ? "Processing..." : "Confirm Reassignment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Inspection Report View Modal */}
            {selectedAssignment && (
                <div className="admin-modal-backdrop" onClick={() => setSelectedAssignment(null)}>
                    <div className="admin-modal-card modal-large" style={{ maxWidth: "740px", width: "92%", padding: "1.5rem" }} onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header" style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "0.85rem", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.2, fontFamily: "'Space Grotesk', sans-serif" }}>
                                    {[selectedAssignment.brand, selectedAssignment.model].filter(Boolean).join(" ") || selectedAssignment.category || "Inspection Report"}
                                </h3>
                                <p style={{ fontSize: "0.825rem", color: "#64748b", margin: "0.3rem 0 0 0", fontWeight: 500 }}>
                                    Inspection Request ID: #{selectedAssignment.inspectionRequestId} | Device ID: #{selectedAssignment.deviceId}
                                </p>
                            </div>
                            <button className="admin-modal-close" onClick={() => setSelectedAssignment(null)} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                <FiX />
                            </button>
                        </div>

                        <div className="admin-modal-body" style={{ padding: 0 }}>
                            {loadingDetails ? (
                                <div className="loading-state" style={{ padding: "3rem 0" }}>
                                    <div className="spinner"></div>
                                    <p>Retrieving diagnostic report...</p>
                                </div>
                            ) : (
                                <div className="report-detail-container">
                                    {/* Overall Score & Grade Summary Banner */}
                                    <div className="report-summary-banner" style={{ padding: "1.15rem 1.35rem", borderRadius: "14px", marginBottom: "1.25rem" }}>
                                        <div className="report-score-box">
                                            <div className="report-score-val" style={{ fontSize: "2rem" }}>
                                                {inspectionDetails?.overallScore !== undefined && inspectionDetails?.overallScore !== null
                                                    ? `${inspectionDetails.overallScore}%`
                                                    : (selectedAssignment.status === "Completed" ? "100%" : "Pending")}
                                            </div>
                                            <div className="report-score-lbl">Overall Health Score</div>
                                        </div>

                                        <div className="report-grade-box">
                                            <div className="report-badge-pill grade-pill">
                                                <FiAward /> Grade: {inspectionDetails?.overallCondition || selectedAssignment.condition || "Standard"}
                                            </div>
                                            <div className="report-badge-pill action-pill">
                                                <FiBox /> Decision: {inspectionDetails?.recommendedAction || "Inspection Evaluation"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inspection Metadata Grid */}
                                    <div className="report-meta-grid" style={{ marginBottom: "1.25rem" }}>
                                        <div className="report-meta-card">
                                            <h4>Device & Owner Info</h4>
                                            <div className="meta-line"><span>Device Item:</span> <strong>{selectedAssignment.brand} {selectedAssignment.model}</strong></div>
                                            <div className="meta-line"><span>Category:</span> <strong>{selectedAssignment.category || "E-Waste"}</strong></div>
                                            <div className="meta-line"><span>Citizen Owner:</span> <strong>{selectedAssignment.userName || "N/A"}</strong></div>
                                            <div className="meta-line"><span>Request Status:</span> <strong style={{ color: selectedAssignment.status === "Completed" ? "#047857" : "#0369a1" }}>{selectedAssignment.status}</strong></div>
                                        </div>

                                        <div className="report-meta-card">
                                            <h4>Inspector Diagnostics</h4>
                                            <div className="meta-line"><span>Technician:</span> <strong>{inspectionDetails?.technicianName || selectedAssignment.technicianName || "Unassigned"}</strong></div>
                                            <div className="meta-line"><span>Email:</span> <strong>{inspectionDetails?.technicianDetails?.email || selectedAssignment.technicianEmail || "N/A"}</strong></div>
                                            <div className="meta-line"><span>Center / Hub:</span> <strong>{inspectionDetails?.technicianDetails?.shopName || "EcoCycle Regional Hub"}</strong></div>
                                            <div className="meta-line"><span>Completed At:</span> <strong>{formatDate(inspectionDetails?.inspectionCompletedAt || selectedAssignment.respondedAt)}</strong></div>
                                        </div>
                                    </div>

                                    {/* Technician Diagnostic Notes */}
                                    {inspectionDetails?.technicianRemarks ? (
                                        <div className="report-notes-box" style={{ padding: "0.9rem 1.1rem", marginBottom: "1.25rem" }}>
                                            <h4 style={{ fontSize: "0.825rem", margin: "0 0 0.35rem 0", color: "#1e40af", fontWeight: 700 }}>TECHNICIAN DIAGNOSTIC NOTES</h4>
                                            <p style={{ fontSize: "0.85rem", color: "#1e3a8a", margin: 0, lineHeight: 1.45 }}>{inspectionDetails.technicianRemarks}</p>
                                        </div>
                                    ) : null}

                                    {/* Component Tests Table */}
                                    {inspectionDetails?.results && inspectionDetails.results.length > 0 ? (
                                        <div className="report-tests-section">
                                            <h4 style={{ fontSize: "0.875rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "#0f172a" }}>HARDWARE COMPONENT TEST BREAKDOWN</h4>
                                            <table className="report-tests-table">
                                                <thead>
                                                    <tr>
                                                        <th>Component</th>
                                                        <th>Result</th>
                                                        <th>Score</th>
                                                        <th>Remarks</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {inspectionDetails.results.map((res, idx) => (
                                                        <tr key={idx}>
                                                            <td><strong>{res.component}</strong></td>
                                                            <td>
                                                                <span className={`result-tag result-${String(res.result).toLowerCase().replace(/\s+/g, '')}`}>
                                                                    {res.result}
                                                                </span>
                                                            </td>
                                                            <td>{res.score}%</td>
                                                            <td>{res.remarks || "—"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : selectedAssignment.rejectionReason ? (
                                        <div className="assignment-rejection-box" style={{ background: "#fff1f2", border: "1px solid #fecdd3", padding: "0.85rem 1rem", borderRadius: "12px", display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
                                            <FiAlertTriangle style={{ color: "#e11d48", fontSize: "1.2rem", marginTop: "0.1rem", flexShrink: 0 }} />
                                            <div>
                                                <div style={{ fontSize: "0.725rem", fontWeight: 800, color: "#e11d48", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                    REJECTION REASON (TECHNICIAN)
                                                </div>
                                                <p style={{ fontSize: "0.85rem", color: "#9f1239", margin: "0.2rem 0 0 0", fontWeight: 600 }}>
                                                    "{selectedAssignment.rejectionReason}"
                                                </p>
                                            </div>
                                        </div>
                                    ) : !inspectionDetails?.inspectionId ? (
                                        <div className="no-data-state" style={{ padding: "1.5rem 1rem", background: "#f8fafc", borderRadius: "12px", border: "1px border #e2e8f0" }}>
                                            <FiAlertTriangle className="no-data-icon" style={{ fontSize: "2rem" }} />
                                            <h4 style={{ margin: "0.3rem 0", fontSize: "0.95rem", color: "#334155" }}>Pending Diagnostic Inspection Report</h4>
                                            <p style={{ margin: 0, fontSize: "0.825rem", color: "#64748b" }}>
                                                The assigned technician has not yet submitted the hardware inspection diagnostic report for this device item.
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        <div className="admin-modal-footer" style={{ borderTop: "1px solid #f1f5f9", marginTop: "1.25rem", paddingTop: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                {isInspectionCompleted(selectedAssignment) && (
                                    <button
                                        className="btn-card-action btn-card-download"
                                        style={{ padding: "0.55rem 1.2rem", borderRadius: "10px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", cursor: "pointer" }}
                                        onClick={() => handleDownloadReportPdf(selectedAssignment, inspectionDetails?.results, inspectionDetails)}
                                    >
                                        <FiDownload /> Download Official PDF
                                    </button>
                                )}
                            </div>
                            <button
                                className="btn-modal-cancel"
                                style={{ padding: "0.55rem 1.4rem", borderRadius: "10px", fontWeight: "700", background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1", cursor: "pointer" }}
                                onClick={() => setSelectedAssignment(null)}
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

export default ManageInspection;
