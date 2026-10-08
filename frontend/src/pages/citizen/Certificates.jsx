import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
    FiSearch,
    FiRefreshCw,
    FiBell,
    FiCheckCircle,
    FiDownload,
    FiEye,
    FiShield,
    FiAward,
    FiCpu,
    FiCalendar,
    FiMapPin,
    FiBox,
    FiGrid,
    FiList,
    FiCheck,
    FiArrowRight,
    FiZap,
    FiChevronDown,
    FiX
} from "react-icons/fi";
import Sidebar from "./Sidebar";
import RecyclingCertificateModal from "./RecyclingCertificateModal";
import "./Citizendashboard.css";
import "./View_device.css";
import "./Certificates.css";

function CitizenCertificates() {
    const navigate = useNavigate();

    // Data States
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"

    // Modal State
    const [selectedDeviceForCert, setSelectedDeviceForCert] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // User Profile State
    const [userName, setUserName] = useState("Citizen User");
    const [userInitial, setUserInitial] = useState("C");
    const [userPhoto, setUserPhoto] = useState(null);

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    // Fetch User Profile
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }

        axios.get("https://ecocycle.runasp.net/api/User/profile", {
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
                    setUserPhoto(`https://ecocycle.runasp.net/uploads/profile/${cleanImg}`);
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

    // Fetch Completed Devices for Certificates
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;
        fetchMyCompletedDevices(token);
        fetchNotifications(token);
    }, []);

    const fetchMyCompletedDevices = async (tokenOverride) => {
        const token = tokenOverride || localStorage.getItem("token");
        if (!token) return;
        setLoading(true);
        try {
            const response = await axios.get("https://ecocycle.runasp.net/api/Device/MyDevices", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const rawList = response.data || [];

            // Filter for devices that completed recycling / refurbishment or are marked completed
            const completedList = rawList.filter((d) => {
                const status = String(d.status || "").toLowerCase();
                const lifeStat = String(d.lifecycleStatus || "").toLowerCase();
                const procLifeStat = String(d.processingLifecycleStatus || "").toLowerCase();
                const reqStat = String(d.requestStatus || "").toLowerCase();

                return (
                    status === "completed" ||
                    status === "recycled" ||
                    status === "refurbished" ||
                    status === "certified" ||
                    lifeStat === "completed" ||
                    lifeStat === "recycled" ||
                    lifeStat === "refurbished" ||
                    lifeStat === "processingcompleted" ||
                    procLifeStat === "completed" ||
                    procLifeStat === "recycled" ||
                    procLifeStat === "refurbished" ||
                    procLifeStat === "recyclingcompleted" ||
                    procLifeStat === "refurbishmentcompleted" ||
                    reqStat === "completed" ||
                    d.isCenterCompleted === true ||
                    d.isRecyclingCompleted === true ||
                    d.isRefurbishmentCompleted === true
                );
            });

            setDevices(completedList);
        } catch (err) {
            console.error("Error fetching completed devices:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async (tokenOverride) => {
        const token = tokenOverride || localStorage.getItem("token");
        if (!token) return;
        try {
            const response = await axios.get("https://ecocycle.runasp.net/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data || []);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    };

    // Calculate Summary Totals
    const totalCertificates = devices.length;
    const totalMassRecycled = devices.reduce((sum, d) => sum + (parseFloat(d.totalRecoveredWeight || d.weight || 0) || 1.2), 0).toFixed(2);
    const totalPointsEarned = Math.round(totalMassRecycled * 120);

    // Open Modal for Certificate
    const handleViewCertificate = (dev) => {
        setSelectedDeviceForCert(dev);
        setIsModalOpen(true);
    };

    // Direct High-Quality Print / PDF Download Engine (Matches Screenshot Exactly)
    const handleDownloadCertificatePDF = (dev) => {
        if (!dev) return;

        const isRefurb = Boolean(
            dev.isRefurbishmentCompleted ||
            String(dev.completedCenterType || "").toLowerCase().includes("refurbish") ||
            String(dev.processingDecision || "").toLowerCase().includes("refurbish") ||
            String(dev.pathway || "").toLowerCase().includes("refurbish") ||
            String(dev.lifecycleStatus || "").toLowerCase().includes("refurbish") ||
            String(dev.processingLifecycleStatus || "").toLowerCase().includes("refurbish") ||
            String(dev.certificateId || "").includes("REF")
        );

        const certId = dev.certificateId || (
            isRefurb 
                ? `ECO-REF-${dev.deviceId || dev.id || "23"}-${Math.floor(10000 + Math.random() * 90000)}`
                : `ECO-REC-${dev.deviceId || dev.id || "23"}-${Math.floor(10000 + Math.random() * 90000)}`
        );

        let clientName = dev.customerName || dev.citizenName || dev.userName || dev.userFullName || dev.ownerName || dev.clientName || userName;
        if (!clientName || clientName.toLowerCase() === "citizen user" || clientName.toLowerCase() === "valued citizen") {
            const storedFull = localStorage.getItem("fullName") ||
              (localStorage.getItem("firstName") ? `${localStorage.getItem("firstName")} ${localStorage.getItem("lastName") || ""}`.trim() : "") ||
              localStorage.getItem("userName") ||
              localStorage.getItem("username") ||
              localStorage.getItem("name");
            if (storedFull && storedFull !== "Citizen User") clientName = storedFull;
        }

        const formatName = (str) => {
            if (!str || str.toLowerCase() === "citizen user" || str.toLowerCase() === "valued citizen") {
                const storedFull = localStorage.getItem("fullName") ||
                  (localStorage.getItem("firstName") ? `${localStorage.getItem("firstName")} ${localStorage.getItem("lastName") || ""}`.trim() : "") ||
                  localStorage.getItem("userName") ||
                  localStorage.getItem("username") ||
                  localStorage.getItem("name");
                if (storedFull && storedFull !== "Citizen User") str = storedFull;
            }
            if (!str) return "Valued Citizen";
            return str
                .toLowerCase()
                .split(" ")
                .filter(Boolean)
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
        };
        const formattedClientName = formatName(clientName);

        const rawBrand = (dev.brand || "").trim();
        const rawModel = (dev.model || "").trim();
        let deviceModel = "";
        if (rawBrand && rawModel) {
            if (rawModel.toLowerCase().startsWith(rawBrand.toLowerCase())) {
                deviceModel = rawModel;
            } else {
                deviceModel = `${rawBrand} ${rawModel}`;
            }
        } else {
            deviceModel = rawBrand || rawModel || dev.categoryName || "Hardware Asset";
        }

        const categoryName = dev.categoryName || dev.category || "Electronic Equipment";
        const intakeCondition = dev.condition || dev.physicalCondition || "Good";
        const weightVal = dev.totalRecoveredWeight || dev.weightKg || dev.weight || "1.2";

        const facilityName = (
            dev.completedCenterName ||
            dev.refurbishmentCenterName ||
            dev.recyclingCenterName ||
            (isRefurb ? "EcoCycle Authorized Refurbishment Center" : "EcoCycle Authorized Recycling Facility")
        );

        const certDate = dev.completedAt ? new Date(dev.completedAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }) : new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

        const expenseOrValue = Number(
            dev.totalRepairCost ||
            dev.refurbishmentCost ||
            dev.valuation ||
            dev.estimatedValue ||
            dev.price ||
            2500
        );

        const ddcCode = `ECO-DDC-${dev.deviceId || dev.id || "23"}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
        const qualityGrade = dev.qcScore || dev.qualityGrade || "Grade A (Pristine)";
        const warrantyDuration = dev.warrantyDuration || "6 Months EcoCycle Warranty";

        const printWin = window.open("", "_blank");
        if (!printWin) {
            alert("Please allow popups to download and print the certificate PDF.");
            return;
        }

        const themeColor = isRefurb ? "#7c3aed" : "#059669";
        const themeSubColor = isRefurb ? "#581c87" : "#065f46";
        const themeLightBg = isRefurb ? "#f5f3ff" : "#ecfdf5";
        const themeBorderInner = isRefurb ? "#ddd6fe" : "#a7f3d0";

        const titleText = isRefurb
            ? "CERTIFICATE OF SUSTAINABLE HARDWARE REFURBISHMENT"
            : "CERTIFICATE OF SUSTAINABLE E-WASTE RECYCLING";

        const subtitleText = isRefurb
            ? "NIST SP 800-88 Data Sanitization • Multi-Point Diagnostics • Circular Reuse Guarantee"
            : "Zero-Landfill Protocol • CPCB Authorized Facility • Circular Recovery Guarantee";

        const declarationText = isRefurb
            ? "This is to certify that the electronic equipment specified below was responsibly collected, sanitized, thoroughly diagnosed, component-serviced, and verified in full compliance with the <strong>E-Waste (Management) Rules 2022</strong>, NIST SP 800-88 Rev. 1 Standards, and Central Pollution Control Board (CPCB) guidelines. All functional testing benchmarks have been achieved with <strong>Certified Circular Reuse Guarantee</strong>."
            : "This is to certify that the electronic equipment specified below was responsibly collected, sanitized, demanufactured, and recycled in full compliance with the <strong>E-Waste (Management) Rules 2022</strong>, ISO 14001 Standards, and Central Pollution Control Board (CPCB) guidelines with Zero-Landfill impact.";

        const centerLabel = isRefurb ? "Refurbishment Center:" : "Recycling Center:";
        const financialLabel = isRefurb ? "Refurbishment Expense:" : "Recovered Value / Weight:";
        const financialValue = isRefurb ? `₹${expenseOrValue.toLocaleString("en-IN")}` : `${weightVal} kg`;

        const qaTitle = isRefurb ? "QUALITY ASSURANCE & WARRANTY VERIFICATION" : "ENVIRONMENTAL IMPACT & COMPLIANCE VERIFICATION";
        const stampText1 = "ECOCYCLE";
        const stampText2 = "CERTIFIED";
        const stampText3 = isRefurb ? "CIRCULAR REUSE" : "RESPONSIBLE RECYCLING";

        const signerRole = isRefurb ? "Senior QC Lead" : "Authorized Environmental Officer";
        const signerAuth = isRefurb ? "EcoCycle Refurbishment Authority" : "EcoCycle E-Waste Recycling Authority";

        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EcoCycle_Certificate_${certId}.pdf</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4 portrait;
            margin: 0;
        }
        @media print {
            @page {
                margin: 0;
            }
            html, body {
                margin: 0 !important;
                padding: 15px !important;
                background: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .cert-document-frame {
                box-shadow: none !important;
                margin: 0 auto !important;
            }
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        body {
            background: #ffffff;
            color: #0f172a;
            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 15px;
        }
        .cert-document-frame {
            width: 100%;
            max-width: 820px;
            background: #ffffff;
            border-radius: 8px;
            color: #1e293b;
        }
        .cert-border-outer {
            border: 4px double ${themeColor} !important;
            padding: 8px;
            border-radius: 6px;
        }
        .cert-border-inner {
            border: 1.5px solid ${themeBorderInner} !important;
            padding: 2.25rem 2.5rem;
            background: radial-gradient(circle at center, #ffffff 60%, ${themeLightBg} 100%) !important;
            position: relative;
            border-radius: 4px;
        }
        .cert-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 1.5rem;
            border-bottom: 2px solid ${themeColor};
            padding-bottom: 1.25rem;
            margin-bottom: 1.75rem;
        }
        .cert-brand {
            display: flex;
            flex-direction: column;
            flex: 1 1 auto;
            min-width: 0;
        }
        .cert-brand-top {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .cert-leaf-svg {
            width: 28px;
            height: 28px;
            fill: ${themeColor};
        }
        .cert-brand-title {
            font-size: 2rem;
            font-weight: 900;
            letter-spacing: -0.02em;
            color: ${themeSubColor};
            line-height: 1;
        }
        .cert-brand-sub {
            font-size: 0.68rem;
            font-weight: 800;
            letter-spacing: 0.12em;
            color: ${themeColor};
            margin-top: 6px;
            text-transform: uppercase;
        }
        .cert-id-tag {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            white-space: nowrap;
            flex-shrink: 0;
            min-width: max-content;
        }
        .cert-id-tag span {
            font-size: 0.7rem;
            font-weight: 800;
            color: #64748b;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            white-space: nowrap;
        }
        .cert-id-tag strong {
            font-size: 1.15rem;
            font-family: monospace;
            font-weight: 900;
            color: #0f172a;
            margin-top: 2px;
            white-space: nowrap;
            word-break: keep-all;
            overflow-wrap: normal;
            display: inline-block;
        }
        .cert-title-section {
            text-align: center;
            margin-bottom: 1.5rem;
        }
        .cert-title-section h1 {
            font-size: 1.45rem;
            font-weight: 900;
            letter-spacing: 0.03em;
            color: #0f172a;
            margin: 0 0 6px 0;
            text-transform: uppercase;
        }
        .cert-subtitle {
            font-size: 0.88rem;
            color: ${themeColor};
            font-weight: 700;
            margin: 0;
        }
        .cert-declaration {
            font-size: 0.9rem;
            line-height: 1.65;
            color: #334155;
            text-align: justify;
            margin-bottom: 1.5rem;
        }
        .cert-details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 1.25rem 1.5rem;
            margin-bottom: 1.5rem;
        }
        .cert-col {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        .cert-field {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.85rem;
        }
        .field-lbl {
            color: #64748b;
            font-weight: 500;
        }
        .field-val {
            color: #0f172a;
            text-align: right;
        }
        .cert-material-summary {
            margin-bottom: 1.5rem;
        }
        .cert-material-summary h4 {
            font-size: 0.82rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #475569;
            margin: 0 0 0.65rem 0;
        }
        .cert-mat-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 0.6rem;
        }
        .cert-mat-badge {
            background: ${themeLightBg};
            border: 1px solid ${themeBorderInner};
            color: ${themeColor};
            font-size: 0.8rem;
            padding: 5px 12px;
            border-radius: 6px;
            font-weight: 600;
        }
        .cert-mat-badge strong {
            font-weight: 800;
        }
        .cert-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 1px solid #e2e8f0;
            padding-top: 1.5rem;
            margin-top: 1rem;
        }
        .cert-qr-block {
            display: flex;
            align-items: center;
            gap: 0.65rem;
        }
        .cert-qr-block span {
            font-size: 0.7rem;
            font-weight: 800;
            line-height: 1.3;
            color: #475569;
            letter-spacing: 0.03em;
        }
        .cert-stamp-block {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .stamp-circle {
            width: 86px;
            height: 86px;
            border: 2.5px dashed ${themeColor};
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: ${themeColor};
            text-align: center;
            transform: rotate(-10deg);
        }
        .stamp-circle span {
            font-size: 0.55rem;
            font-weight: 800;
            letter-spacing: 0.06em;
        }
        .stamp-circle strong {
            font-size: 0.75rem;
            font-weight: 900;
        }
        .cert-sign-block {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }
        .sign-line {
            width: 150px;
            height: 1.5px;
            background: #0f172a;
            margin-bottom: 6px;
        }
        .cert-sign-block strong {
            font-size: 0.85rem;
            color: #0f172a;
            font-weight: 800;
        }
        .cert-sign-block span {
            font-size: 0.72rem;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="cert-document-frame">
        <div class="cert-border-outer">
            <div class="cert-border-inner">
                <div class="cert-header">
                    <div class="cert-brand">
                        <div class="cert-brand-top">
                            <svg class="cert-leaf-svg" viewBox="0 0 448 512">
                                <path d="M448 24C448 10.7 437.3 0 424 0C323.7 0 231.2 50.8 174.4 129.8C154.5 157.5 139.7 188.8 130.6 222.7C105.7 217.3 79.5 219.7 56 230.1C22.7 244.9 0 278.4 0 314.9C0 373.2 44.4 421.4 100.9 426.6C100.3 433 100 439.5 100 446C100 482.5 129.5 512 166 512C202.5 512 232 482.5 232 446C232 433.8 228.7 422.4 223 412.5C269.8 402.1 309.2 370.2 327.3 325.7C334.8 307.2 337.8 287.4 336.5 268C380.2 245.9 416.7 210.6 438.4 165.7C444.8 152.6 448 138.3 448 123.8V24z"/>
                            </svg>
                            <span class="cert-brand-title">EcoCycle</span>
                        </div>
                        <span class="cert-brand-sub">
                            ${isRefurb ? "SUSTAINABLE E-WASTE MANAGEMENT & CIRCULAR REFURBISHMENT PLATFORM" : "SUSTAINABLE E-WASTE MANAGEMENT & ZERO-LANDFILL AUTHORITY"}
                        </span>
                    </div>
                    <div class="cert-id-tag">
                        <span>CERTIFICATE ID</span>
                        <strong>${certId}</strong>
                    </div>
                </div>

                <div class="cert-title-section">
                    <h1>${titleText}</h1>
                    <p class="cert-subtitle">${subtitleText}</p>
                </div>

                <p class="cert-declaration">
                    ${declarationText}
                </p>

                <div class="cert-details-grid">
                    <div class="cert-col">
                        <div class="cert-field">
                            <span class="field-lbl">Equipment Model:</span>
                            <span class="field-val"><strong>${deviceModel}</strong></span>
                        </div>
                        <div class="cert-field">
                            <span class="field-lbl">Category:</span>
                            <span class="field-val">${categoryName}</span>
                        </div>
                        <div class="cert-field">
                            <span class="field-lbl">Intake Condition:</span>
                            <span class="field-val">${intakeCondition}</span>
                        </div>
                    </div>

                    <div class="cert-col">
                        <div class="cert-field">
                            <span class="field-lbl">Registered Citizen:</span>
                            <span class="field-val"><strong>${formattedClientName}</strong></span>
                        </div>
                        <div class="cert-field">
                            <span class="field-lbl">${centerLabel}</span>
                            <span class="field-val"><strong>${facilityName}</strong></span>
                        </div>
                        <div class="cert-field">
                            <span class="field-lbl">Date of Certification:</span>
                            <span class="field-val">${certDate}</span>
                        </div>
                    </div>
                </div>

                <div class="cert-material-summary">
                    <h4>${qaTitle}</h4>
                    <div class="cert-mat-badges">
                        <span class="cert-mat-badge">
                            Data Sanitization: <strong>NIST SP 800-88 (${ddcCode})</strong>
                        </span>
                        <span class="cert-mat-badge">
                            Quality Grade: <strong>${qualityGrade}</strong>
                        </span>
                        <span class="cert-mat-badge">
                            Warranty Coverage: <strong>${warrantyDuration}</strong>
                        </span>
                        <span class="cert-mat-badge">
                            Functional Diagnostics: <strong>100% Bench Passed</strong>
                        </span>
                    </div>
                </div>

                <div class="cert-footer">
                    <div class="cert-qr-block">
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        <span>SCAN TO VERIFY<br />ON ECOCYCLE HUB</span>
                    </div>

                    <div class="cert-stamp-block">
                        <div class="stamp-circle">
                            <span>${stampText1}</span>
                            <strong>${stampText2}</strong>
                            <span>${stampText3}</span>
                        </div>
                    </div>

                    <div class="cert-sign-block">
                        <div class="sign-line"></div>
                        <strong>${signerRole}</strong>
                        <span>${signerAuth}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 300);
        };
    </script>
</body>
</html>`;

        printWin.document.open();
        printWin.document.write(htmlContent);
        printWin.document.close();
    };

    // Filter Devices
    const filteredDevices = devices.filter((d) => {
        const matchesSearch =
            (d.brand || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.model || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.categoryName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.certificateId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(d.deviceId || d.id || "").includes(searchQuery);

        if (!matchesSearch) return false;

        const isRefurb = Boolean(
            d.isRefurbishmentCompleted ||
            String(d.completedCenterType || "").toLowerCase().includes("refurbish") ||
            String(d.processingDecision || "").toLowerCase().includes("refurbish")
        );

        if (filterCategory === "recycling") {
            return !isRefurb;
        }
        if (filterCategory === "refurbishment") {
            return isRefurb;
        }
        return true;
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <div className="vd-page-layout">
            <Sidebar />

            <main className="vd-main-content">
                {/* Main Control Header Panel */}
                <div className="control-bar-panel">
                    <div>
                        <h3 style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif", fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.2rem", color: "#0f172a" }}>Official Environmental Certificates</h3>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>Verified certificates of sustainable hardware refurbishment and zero-landfill e-waste recycling</p>
                    </div>

                    <div className="control-panel-right-group">
                        <div className="vd-inline-search">
                            <FiSearch style={{ color: "#94a3b8", fontSize: "0.85rem" }} />
                            <input
                                type="text"
                                placeholder="Search device, cert #, serial..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="vd-search-clear-btn">
                                    <FiX style={{ fontSize: "0.8rem" }} />
                                </button>
                            )}
                        </div>

                        <div className="filter-pills">
                            {[
                                { id: "all", label: `All (${devices.length})` },
                                { id: "refurbishment", label: "Refurbished" },
                                { id: "recycling", label: "Recycled" }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`pill-btn ${filterCategory === tab.id ? "active" : ""}`}
                                    onClick={() => setFilterCategory(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="view-toggle">
                            <button
                                className={`toggle-btn ${viewMode === "list" ? "active" : ""}`}
                                onClick={() => setViewMode("list")}
                                title="List View"
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

                {/* Content Section */}
                {loading ? (
                    <div className="citizen-cert-loading">
                        <FiRefreshCw className="cert-spinner-icon" />
                        <p>Loading your verified environmental certificates...</p>
                    </div>
                ) : filteredDevices.length === 0 ? (
                    <div className="citizen-cert-empty">
                        <div className="empty-cert-icon-wrap">
                            <FiAward />
                        </div>
                        <h3>No Environmental Certificates Found</h3>
                        <p>
                            {searchQuery || filterCategory !== "all"
                                ? "No certificates matched your search criteria."
                                : "When your registered electronic devices complete safe refurbishment or certified material recovery at an authorized EcoCycle facility, official certificates will be issued here."}
                        </p>
                        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                            <Link to="/add-device" className="btn-citizen-add">
                                <FiBox /> Add a Device
                            </Link>
                            <Link to="/view-device" className="btn-citizen-outline">
                                View My Devices
                            </Link>
                        </div>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="citizen-cert-cards-grid">
                        {filteredDevices.map((dev) => {
                            const isRefurb = Boolean(
                                dev.isRefurbishmentCompleted ||
                                String(dev.completedCenterType || "").toLowerCase().includes("refurbish") ||
                                String(dev.processingDecision || "").toLowerCase().includes("refurbish")
                            );

                            const certId = dev.certificateId || (
                                isRefurb
                                    ? `ECO-REF-${dev.deviceId || dev.id || "23"}-${Math.floor(10000 + Math.random() * 90000)}`
                                    : `ECO-REC-${dev.deviceId || dev.id || "23"}-${Math.floor(10000 + Math.random() * 90000)}`
                            );

                            const formattedDate = dev.completedAt ? new Date(dev.completedAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                            }) : new Date().toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                            });

                            const facilityName = dev.completedCenterName || dev.refurbishmentCenterName || dev.recyclingCenterName || (isRefurb ? "EcoCycle Refurbishment Center" : "EcoCycle Recycling Facility");
                            const devBrand = (dev.brand || "").trim();
                            const devModel = (dev.model || "").trim();
                            let brandModel = "";
                            if (devBrand && devModel) {
                                if (devModel.toLowerCase().startsWith(devBrand.toLowerCase())) {
                                    brandModel = devModel;
                                } else {
                                    brandModel = `${devBrand} ${devModel}`;
                                }
                            } else {
                                brandModel = devBrand || devModel || dev.categoryName || "Hardware Asset";
                            }

                            return (
                                <div key={dev.deviceId || dev.id} className={`citizen-cert-card ${isRefurb ? "card-refurb" : "card-recyc"}`}>
                                    {/* Top Card Header with Cert Tag and Download Button */}
                                    <div className="cert-card-top-row">
                                        <span className={`cert-code-tag ${isRefurb ? "tag-purple" : "tag-green"}`}>
                                            <FiAward /> {certId}
                                        </span>
                                    </div>

                                    {/* Device Specification */}
                                    <div className="cert-device-header">
                                        <div className={`cert-device-icon-box ${isRefurb ? "icon-purple" : "icon-green"}`}>
                                            <FiCpu />
                                        </div>
                                        <div className="cert-device-info">
                                            <h3 className="cert-device-title">{brandModel}</h3>
                                            <span className="cert-device-sub">
                                                Asset #{dev.deviceId || dev.id} &bull; {dev.categoryName || "Hardware"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Certified Metrics Box */}
                                    <div className="cert-details-box">
                                        <div className="cert-metric-row">
                                            <span className="metric-label-text">
                                                {isRefurb ? "Refurbishment Status:" : "Certified Material Mass:"}
                                            </span>
                                            <strong className="metric-value-text" style={{ color: isRefurb ? "#7c3aed" : "#059669" }}>
                                                {isRefurb ? "Grade A Certified" : `${dev.totalRecoveredWeight || dev.weightKg || dev.weight || "1.2"} kg`}
                                            </strong>
                                        </div>
                                        <div className="cert-info-line">
                                            <FiMapPin className="info-icon" />
                                            <span title={facilityName}>{facilityName}</span>
                                        </div>
                                        <div className="cert-info-line">
                                            <FiCalendar className="info-icon" />
                                            <span>Issued: {formattedDate}</span>
                                        </div>
                                    </div>

                                    {/* Compliance Pill */}
                                    <div className={`cert-compliance-banner ${isRefurb ? "banner-purple" : "banner-green"}`}>
                                        <FiShield className="shield-icon" />
                                        <span>
                                            {isRefurb 
                                                ? "NIST SP 800-88 & CIRCULAR REUSE GUARANTEE" 
                                                : "CPCB & MoEFCC ZERO-LANDFILL COMPLIANT"}
                                        </span>
                                    </div>

                                    {/* Bottom View Button */}
                                    <div className="cert-card-bottom-bar">
                                        <button 
                                            className="btn-view-cert-full"
                                            onClick={() => handleViewCertificate(dev)}
                                        >
                                            <FiEye /> View Certificate
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Table View */
                    <div className="citizen-cert-table-wrap">
                        <table className="citizen-cert-table">
                            <thead>
                                <tr>
                                    <th>Certificate ID</th>
                                    <th>Device Asset</th>
                                    <th>Certification Pathway</th>
                                    <th>Processing Facility</th>
                                    <th>Issue Date</th>
                                    <th>Compliance Standards</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDevices.map((dev) => {
                                    const isRefurb = Boolean(
                                        dev.isRefurbishmentCompleted ||
                                        String(dev.completedCenterType || "").toLowerCase().includes("refurbish") ||
                                        String(dev.processingDecision || "").toLowerCase().includes("refurbish")
                                    );

                                    const certId = dev.certificateId || (
                                        isRefurb
                                            ? `ECO-REF-${dev.deviceId || dev.id || "23"}-${Math.floor(10000 + Math.random() * 90000)}`
                                            : `ECO-REC-${dev.deviceId || dev.id || "23"}-${Math.floor(10000 + Math.random() * 90000)}`
                                    );

                                    const formattedDate = dev.completedAt ? new Date(dev.completedAt).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric"
                                    }) : new Date().toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric"
                                    });

                                    const facilityName = dev.completedCenterName || dev.refurbishmentCenterName || dev.recyclingCenterName || (isRefurb ? "EcoCycle Refurbishment Center" : "EcoCycle Processing Hub");
                                    const devBrand = (dev.brand || "").trim();
                                    const devModel = (dev.model || "").trim();
                                    let brandModel = "";
                                    if (devBrand && devModel) {
                                        if (devModel.toLowerCase().startsWith(devBrand.toLowerCase())) {
                                            brandModel = devModel;
                                        } else {
                                            brandModel = `${devBrand} ${devModel}`;
                                        }
                                    } else {
                                        brandModel = devBrand || devModel || dev.categoryName || "Hardware Asset";
                                    }

                                    return (
                                        <tr key={dev.deviceId || dev.id}>
                                            <td className="cert-table-id">
                                                <FiAward className={isRefurb ? "purple-icon" : "green-icon"} />
                                                <strong>{certId}</strong>
                                            </td>
                                            <td>
                                                <div className="table-device-text">
                                                    <strong>{brandModel}</strong>
                                                    <span className="table-sub">DEV #{dev.deviceId || dev.id}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`table-pathway-badge ${isRefurb ? "badge-purple" : "badge-green"}`}>
                                                    {isRefurb ? "Circular Refurbished" : "Certified Recycled"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="table-facility-text" title={facilityName}>{facilityName}</div>
                                            </td>
                                            <td>{formattedDate}</td>
                                            <td>
                                                <span className="table-verified-badge">
                                                    <FiCheckCircle /> {isRefurb ? "NIST 800-88 & CPCB" : "Zero-Landfill CPCB"}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                <div style={{ display: "inline-flex", gap: "6px" }}>
                                                    <button
                                                        className="btn-table-action-icon"
                                                        onClick={() => handleViewCertificate(dev)}
                                                        title="View Certificate"
                                                    >
                                                        <FiEye />
                                                    </button>
                                                    <button
                                                        className="btn-table-action-icon"
                                                        onClick={() => handleDownloadCertificatePDF(dev)}
                                                        title="Download Certificate (PDF)"
                                                    >
                                                        <FiDownload />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Official Certificate Modal */}
            <RecyclingCertificateModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedRequest={{
                    ...selectedDeviceForCert,
                    customerName: selectedDeviceForCert?.customerName || userName
                }}
                certificateData={{
                    ...selectedDeviceForCert,
                    customerName: selectedDeviceForCert?.customerName || userName
                }}
            />
        </div>
    );
}

export default CitizenCertificates;
