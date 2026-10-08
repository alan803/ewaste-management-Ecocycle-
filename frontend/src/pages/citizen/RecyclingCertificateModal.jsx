import React, { useRef } from "react";
import { FiCheck, FiShield, FiDownload, FiAward } from "react-icons/fi";
import { FaLeaf, FaQrcode, FaTools } from "react-icons/fa";
import "./RecyclingCertificateModal.css";

function RecyclingCertificateModal({ isOpen, onClose, certificateData, selectedRequest }) {
    const certRef = useRef(null);

    if (!isOpen || (!certificateData && !selectedRequest)) return null;

    const dev = selectedRequest || certificateData || {};
    const cert = certificateData || {};

    const isRefurb = Boolean(
        dev.isRefurbishmentCompleted ||
        String(dev.completedCenterType || "").toLowerCase().includes("refurbish") ||
        String(dev.processingDecision || "").toLowerCase().includes("refurbish") ||
        String(dev.pathway || "").toLowerCase().includes("refurbish") ||
        String(dev.lifecycleStatus || "").toLowerCase().includes("refurbish") ||
        String(dev.processingLifecycleStatus || "").toLowerCase().includes("refurbish") ||
        String(cert.certificateId || dev.certificateId || "").includes("REF")
    );

    const certId = (
        cert.certificateId ||
        dev.certificateId ||
        (isRefurb 
            ? `ECO-REF-${dev.deviceId || dev.id || "23"}-${Math.floor(10000 + Math.random() * 90000)}`
            : `ECO-REC-${dev.deviceId || dev.id || "23"}-${Math.floor(10000 + Math.random() * 90000)}`)
    );

    let clientName = (
        cert.ownerName ||
        cert.customerName ||
        dev.customerName ||
        dev.citizenName ||
        dev.userName ||
        dev.userFullName ||
        localStorage.getItem("fullName") ||
        (localStorage.getItem("firstName") ? `${localStorage.getItem("firstName")} ${localStorage.getItem("lastName") || ""}`.trim() : "") ||
        localStorage.getItem("userName") ||
        localStorage.getItem("username") ||
        localStorage.getItem("name") ||
        "Citizen User"
    );
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

    const rawBrand = (dev.brand || cert.brand || "").trim();
    const rawModel = (dev.model || cert.model || "").trim();
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

    const categoryName = dev.categoryName || cert.categoryName || dev.category || "Electronic Equipment";
    const serialNumber = dev.serialNumber || cert.serialNumber || `SN-${dev.deviceId || dev.id || "23"}`;
    const intakeCondition = dev.condition || cert.condition || dev.physicalCondition || "Good";
    const weightVal = dev.totalRecoveredWeight || dev.weightKg || dev.weight || "1.2";

    const facilityName = (
        dev.completedCenterName ||
        dev.refurbishmentCenterName ||
        dev.recyclingCenterName ||
        cert.centerName ||
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
        cert.totalRepairCost ||
        2500
    );

    const ddcCode = `ECO-DDC-${dev.deviceId || dev.id || "23"}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
    const qualityGrade = dev.qcScore || dev.qualityGrade || "Grade A (Pristine)";
    const warrantyDuration = dev.warrantyDuration || "6 Months EcoCycle Warranty";

    // Direct High-Resolution Print / Download Handler
    const handleDownloadOrPrintPDF = () => {
        const printWin = window.open("", "_blank");
        if (!printWin) {
            window.print();
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
            align-items: flex-end;
            gap: 1.5rem;
            border-bottom: 2px solid ${themeColor};
            padding-bottom: 1rem;
            margin-bottom: 1.75rem;
        }
        .cert-brand {
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
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
        .cert-qr-box {
            display: flex;
            align-items: center;
            justify-content: center;
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
                <!-- Certificate Header -->
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

    return (
        <div className="recyc-cert-modal-overlay" onClick={onClose}>
            <div className="recyc-cert-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Modal Topbar */}
                <div className="recyc-cert-modal-topbar no-print">
                    <div className="cert-topbar-title">
                        <FiCheck className="cert-check-icon" style={{ color: isRefurb ? "#7c3aed" : "#059669" }} />
                        {isRefurb ? "Official Certificate of Refurbishment & Circular Reuse" : "Official Certificate of E-Waste Recycling"}
                    </div>
                </div>

                {/* Main Certificate Render Frame matching screenshot */}
                <div className="recyc-techazar-cert-wrap">
                    <div className={`cert-document-frame ${isRefurb ? "refurb-theme" : "recycling-theme"}`} ref={certRef}>
                        <div className="cert-border-outer">
                            <div className="cert-border-inner">
                                {/* Header */}
                                <div className="cert-header">
                                    <div className="cert-brand">
                                        <div className="cert-brand-top">
                                            {isRefurb ? (
                                                <FaLeaf className="cert-leaf-icon" />
                                            ) : (
                                                <FaLeaf className="cert-leaf-icon" />
                                            )}
                                            <span className="cert-brand-title">EcoCycle</span>
                                        </div>
                                        <span className="cert-brand-sub">
                                            {isRefurb 
                                                ? "SUSTAINABLE E-WASTE MANAGEMENT & CIRCULAR REFURBISHMENT PLATFORM" 
                                                : "SUSTAINABLE E-WASTE MANAGEMENT & ZERO-LANDFILL AUTHORITY"}
                                        </span>
                                    </div>
                                    <div className="cert-id-tag">
                                        <span>CERTIFICATE ID</span>
                                        <strong>{certId}</strong>
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="cert-title-section">
                                    <h1>
                                        {isRefurb 
                                            ? "CERTIFICATE OF SUSTAINABLE HARDWARE REFURBISHMENT" 
                                            : "CERTIFICATE OF SUSTAINABLE E-WASTE RECYCLING"}
                                    </h1>
                                    <p className="cert-subtitle">
                                        {isRefurb 
                                            ? "NIST SP 800-88 Data Sanitization • Multi-Point Diagnostics • Circular Reuse Guarantee" 
                                            : "Zero-Landfill Protocol • CPCB Authorized Facility • Circular Recovery Guarantee"}
                                    </p>
                                </div>

                                {/* Declaration */}
                                <p className="cert-declaration">
                                    {isRefurb ? (
                                        <>
                                            This is to certify that the electronic equipment specified below was responsibly collected, sanitized, thoroughly diagnosed, component-serviced, and verified in full compliance with the <strong>E-Waste (Management) Rules 2022</strong>, NIST SP 800-88 Rev. 1 Standards, and Central Pollution Control Board (CPCB) guidelines. All functional testing benchmarks have been achieved with <strong>Certified Circular Reuse Guarantee</strong>.
                                        </>
                                    ) : (
                                        <>
                                            This is to certify that the electronic equipment specified below was responsibly collected, sanitized, demanufactured, and recycled in full compliance with the <strong>E-Waste (Management) Rules 2022</strong>, ISO 14001 Standards, and Central Pollution Control Board (CPCB) guidelines with Zero-Landfill impact.
                                        </>
                                    )}
                                </p>

                                {/* Specifications Matrix */}
                                <div className="cert-details-grid">
                                    <div className="cert-col">
                                        <div className="cert-field">
                                            <span className="field-lbl">Equipment Model:</span>
                                            <span className="field-val"><strong>{deviceModel}</strong></span>
                                        </div>
                                        <div className="cert-field">
                                            <span className="field-lbl">Category:</span>
                                            <span className="field-val">{categoryName}</span>
                                        </div>
                                        <div className="cert-field">
                                            <span className="field-lbl">Intake Condition:</span>
                                            <span className="field-val">{intakeCondition}</span>
                                        </div>
                                    </div>

                                    <div className="cert-col">
                                        <div className="cert-field">
                                            <span className="field-lbl">Registered Citizen:</span>
                                            <span className="field-val"><strong>{formattedClientName}</strong></span>
                                        </div>
                                        <div className="cert-field">
                                            <span className="field-lbl">{isRefurb ? "Refurbishment Center:" : "Recycling Center:"}</span>
                                            <span className="field-val"><strong>{facilityName}</strong></span>
                                        </div>
                                        <div className="cert-field">
                                            <span className="field-lbl">Date of Certification:</span>
                                            <span className="field-val">{certDate}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quality Assurance & Verification Badges */}
                                <div className="cert-material-summary">
                                    <h4>{isRefurb ? "QUALITY ASSURANCE & WARRANTY VERIFICATION" : "ENVIRONMENTAL IMPACT & COMPLIANCE VERIFICATION"}</h4>
                                    <div className="cert-mat-badges">
                                        <span className="cert-mat-badge">
                                            Data Sanitization: <strong>NIST SP 800-88 ({ddcCode})</strong>
                                        </span>
                                        <span className="cert-mat-badge">
                                            Quality Grade: <strong>{qualityGrade}</strong>
                                        </span>
                                        <span className="cert-mat-badge">
                                            Warranty Coverage: <strong>{warrantyDuration}</strong>
                                        </span>
                                        <span className="cert-mat-badge">
                                            Functional Diagnostics: <strong>100% Bench Passed</strong>
                                        </span>
                                    </div>
                                </div>

                                {/* Footer / Stamp / Signatures */}
                                <div className="cert-footer">
                                    <div className="cert-qr-block">
                                        <FaQrcode className="cert-qr-icon" />
                                        <span>SCAN TO VERIFY<br />ON ECOCYCLE HUB</span>
                                    </div>

                                    <div className="cert-stamp-block">
                                        <div className="stamp-circle">
                                            <span>ECOCYCLE</span>
                                            <strong>CERTIFIED</strong>
                                            <span>{isRefurb ? "CIRCULAR REUSE" : "RESPONSIBLE RECYCLING"}</span>
                                        </div>
                                    </div>

                                    <div className="cert-sign-block">
                                        <div className="sign-line"></div>
                                        <strong>{isRefurb ? "Senior QC Lead" : "Authorized Environmental Officer"}</strong>
                                        <span>{isRefurb ? "EcoCycle Refurbishment Authority" : "EcoCycle Recycling Authority"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="recyc-cert-modal-actions no-print">
                    <button 
                        className="btn-action primary" 
                        style={{ background: isRefurb ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" : "linear-gradient(135deg, #059669 0%, #047857 100%)" }}
                        onClick={handleDownloadOrPrintPDF}
                    >
                        <FiDownload /> Download Certificate (PDF)
                    </button>
                    <button className="btn-action glass" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RecyclingCertificateModal;
