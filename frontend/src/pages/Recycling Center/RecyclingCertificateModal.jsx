import React, { useRef } from "react";
import { FiX, FiPrinter, FiCheck, FiShield, FiDownload } from "react-icons/fi";
import logo from "../../assets/images/n_logo.png";
import "./RecyclingCertificateModal.css";

// Golden "Green AWARD" Seal with Ribbons SVG Component
const GreenAwardBadge = () => (
    <div className="green-award-seal-wrap">
        <svg viewBox="0 0 200 240" className="green-award-svg">
            <defs>
                {/* Gold Gradients */}
                <linearGradient id="goldGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="25%" stopColor="#eab308" />
                    <stop offset="50%" stopColor="#ca8a04" />
                    <stop offset="75%" stopColor="#fef08a" />
                    <stop offset="100%" stopColor="#a16207" />
                </linearGradient>

                <linearGradient id="goldRibbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#eab308" />
                    <stop offset="40%" stopColor="#ca8a04" />
                    <stop offset="100%" stopColor="#854d0e" />
                </linearGradient>

                <radialGradient id="goldInnerSunburst" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef9c3" />
                    <stop offset="45%" stopColor="#fde047" />
                    <stop offset="80%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#a16207" />
                </radialGradient>

                <filter id="goldBadgeShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#78350f" floodOpacity="0.3" />
                </filter>
            </defs>

            {/* Ribbon Tails */}
            <g id="ribbons" filter="url(#goldBadgeShadow)">
                <polygon
                    points="60,110 32,205 60,185 88,205 78,110"
                    fill="url(#goldRibbonGrad)"
                />
                <polygon
                    points="140,110 122,205 150,185 178,205 150,110"
                    fill="url(#goldRibbonGrad)"
                />
            </g>

            {/* Main Badge Medallion */}
            <g id="badge-outer" filter="url(#goldBadgeShadow)">
                <circle cx="100" cy="100" r="76" fill="url(#goldGradientMain)" />
                <circle cx="100" cy="100" r="72" fill="#ca8a04" stroke="#fef08a" strokeWidth="2" strokeDasharray="6,4" />
                <circle cx="100" cy="100" r="68" fill="url(#goldGradientMain)" stroke="#854d0e" strokeWidth="1.5" />
                <circle cx="100" cy="100" r="62" fill="#a16207" />
                <circle cx="100" cy="100" r="60" fill="url(#goldInnerSunburst)" stroke="#fef08a" strokeWidth="1.5" />

                {/* Sunburst Radial Ray Lines */}
                {[...Array(24)].map((_, i) => (
                    <line
                        key={i}
                        x1="100"
                        y1="100"
                        x2={100 + 58 * Math.cos((i * 15 * Math.PI) / 180)}
                        y2={100 + 58 * Math.sin((i * 15 * Math.PI) / 180)}
                        stroke="#eab308"
                        strokeWidth="1.2"
                        opacity="0.6"
                    />
                ))}

                {/* Inner Gold Disc */}
                <circle cx="100" cy="100" r="48" fill="url(#goldInnerSunburst)" stroke="#ca8a04" strokeWidth="1" />

                {/* Text: "Green" */}
                <text
                    x="100"
                    y="88"
                    textAnchor="middle"
                    fill="#1e293b"
                    fontFamily="'Great Vibes', 'Alex Brush', cursive"
                    fontSize="30"
                    fontWeight="normal"
                    style={{ textShadow: "0 1px 1px rgba(255,255,255,0.7)" }}
                >
                    Green
                </text>

                {/* Text: "AWARD" */}
                <text
                    x="100"
                    y="118"
                    textAnchor="middle"
                    fill="#0f172a"
                    fontFamily="'Impact', 'Arial Black', 'Montserrat', sans-serif"
                    fontSize="21"
                    fontWeight="900"
                    letterSpacing="0.08em"
                    style={{ textShadow: "0 1px 2px rgba(255,255,255,0.8)" }}
                >
                    AWARD
                </text>
            </g>
        </svg>
    </div>
);

// EcoCycle Project Brand Group for Footer
const EcoCycleBrandGroup = ({ centerName }) => (
    <div className="ecocycle-brand-group">
        <div className="ecocycle-logo-box">
            <img src={logo} alt="EcoCycle Logo" className="ecocycle-img-logo" />
        </div>
        <div className="ecocycle-brand-details">
            <div className="ecocycle-title">
                ECOCYCLE<span className="brand-tm">™</span>
            </div>
            <div className="ecocycle-subtitle">
                {centerName || "EcoCycle Authorized E-Waste Processing Facility"}
            </div>
        </div>
    </div>
);

// Official Regulatory Compliance Pill
const RegulatoryAuthPill = () => (
    <div className="ecocycle-auth-badge">
        <div className="auth-label">Authorised by</div>
        <div className="auth-compliance-pill">
            <FiShield className="auth-shield-icon" />
            <div className="auth-compliance-text">
                <strong>CPCB &amp; MoEFCC</strong>
                <span>E-Waste (Management) Rules</span>
            </div>
        </div>
    </div>
);

function RecyclingCertificateModal({ isOpen, onClose, certificateData, selectedRequest }) {
    const certRef = useRef(null);

    if (!isOpen || !certificateData) return null;

    const cert = certificateData || {};
    
    // Project & Request Dynamic Values
    const activeCenterName = (
        cert.centerName ||
        localStorage.getItem("centerName") ||
        localStorage.getItem("userName") ||
        "EcoCycle Authorized Recycling Center"
    );

    const weightKg = (
        cert.totalRecoveredWeightKg ||
        cert.originalWeightKg ||
        selectedRequest?.weightKg ||
        "1.0"
    );

    const formatName = (str) => {
        if (!str) return "Valued Citizen & Eco Partner";
        return str
            .toLowerCase()
            .split(" ")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    };

    const clientName = (
        cert.ownerName ||
        cert.customerName ||
        selectedRequest?.customerName ||
        "Valued Citizen & Eco Partner"
    );
    const formattedClientName = formatName(clientName);

    const deviceModel = (
        selectedRequest?.brand && selectedRequest?.model
            ? `${selectedRequest.brand} ${selectedRequest.model}`
            : selectedRequest?.categoryName || ""
    );

    const rawDate = cert.issueDate || new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

    const manifestId = (
        selectedRequest?.id
            ? `MNF-${selectedRequest.id.toString().padStart(6, "0")}`
            : "MNF-000020"
    );

    const ssNo = `SS-${selectedRequest?.deviceId || selectedRequest?.id || "22"}`;

    const certNo = cert.certificateId || `ECO-REC-${new Date().getFullYear()}-${(selectedRequest?.id || "1024").toString().padStart(6, "0")}`;
    const authNo = `CPCB/EW-MGT/AUTH/${new Date().getFullYear()}/${(selectedRequest?.deviceId || "8492")}`;

    // Reliable Standalone PDF Download & Print Engine
    const handleDownloadOrPrintPDF = () => {
        const printWin = window.open("", "_blank");
        if (!printWin) {
            // If popups are blocked in the browser, fallback to standard window.print()
            window.print();
            return;
        }

        const clientWithDevice = `${formattedClientName}${deviceModel ? ` (${deviceModel})` : ""}`;

        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EcoCycle_E-Waste_Recycling_Certificate_${certNo}.pdf</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Poppins:wght@400;500;600;700;800;900&family=Outfit:wght@600;800;900&family=Caveat:wght@700&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
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
            color: #1e293b;
            font-family: 'Poppins', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 10mm;
        }
        .cert-card {
            width: 277mm;
            height: 190mm;
            background: #fbfbf9;
            border: 8px solid #eceae3;
            border-radius: 4px;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .cert-canvas-body {
            flex: 1;
            position: relative;
            padding: 34px 44px 18px 44px;
            background-color: #faf8f5;
            background-image: radial-gradient(#e5e0d8 0.75px, transparent 0.75px);
            background-size: 12px 12px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .cert-watermark-lines {
            position: absolute;
            top: 0;
            left: 0;
            width: 48%;
            height: 100%;
            pointer-events: none;
            background: repeating-linear-gradient(
                -45deg,
                rgba(217, 180, 130, 0.15),
                rgba(217, 180, 130, 0.15) 1.5px,
                transparent 1.5px,
                transparent 9px
            );
            opacity: 0.85;
            z-index: 1;
        }
        .cert-header-left {
            position: relative;
            z-index: 2;
        }
        .cert-calligraphy-headline {
            font-family: 'Great Vibes', cursive;
            font-size: 64px;
            color: #1a1a1a;
            line-height: 0.95;
            font-weight: normal;
        }
        .cert-headline-sub {
            font-family: 'Poppins', sans-serif;
            font-size: 20px;
            font-weight: 500;
            color: #4a5568;
            margin: 4px 0 0 2px;
        }
        .cert-badge-right {
            position: absolute;
            top: 18px;
            right: 36px;
            z-index: 3;
            width: 140px;
            height: 170px;
        }
        .cert-body-content {
            position: relative;
            z-index: 2;
            margin-top: 10px;
            width: 100%;
        }
        .cert-sentence {
            font-size: 14px;
            line-height: 2.1;
            color: #334155;
            font-weight: 500;
        }
        .cert-underline {
            display: inline-block;
            border-bottom: 1.5px solid #475569;
            padding: 0 10px;
            font-weight: 700;
            color: #0f172a;
            vertical-align: baseline;
            line-height: 1.2;
            text-align: center;
        }
        .cert-underline.weight-val {
            min-width: 65px;
            color: #008744;
            font-size: 15px;
            font-weight: 800;
        }
        .cert-underline.date-val { min-width: 95px; }
        .cert-underline.ss-val { min-width: 95px; }
        .cert-underline.auth-ss-val { min-width: 70px; }
        
        .cert-entity-underline-row {
            width: 100%;
            border-bottom: 1.5px solid #475569;
            padding: 2px 6px 4px 6px;
            margin: 6px 0 12px 0;
            min-height: 26px;
            display: flex;
            align-items: center;
        }
        .cert-entity-name {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 0.02em;
            text-transform: capitalize;
        }
        .cert-appreciation-sentence {
            font-size: 13.5px;
            line-height: 1.6;
            color: #475569;
            font-weight: 500;
            margin-top: 10px;
        }
        .cert-meta-signature-row {
            position: relative;
            z-index: 2;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 14px;
            padding-top: 8px;
        }
        .cert-meta-left {
            display: flex;
            align-items: center;
            gap: 24px;
        }
        .cert-meta-field {
            display: flex;
            align-items: baseline;
            gap: 6px;
        }
        .meta-label {
            font-size: 12.5px;
            font-weight: 700;
            color: #1e293b;
            white-space: nowrap;
        }
        .meta-underline {
            border-bottom: 1.5px solid #475569;
            padding: 0 8px 1px 8px;
            font-size: 12px;
            font-weight: 600;
            font-family: 'Courier New', monospace;
            color: #334155;
            min-width: 110px;
            display: inline-block;
        }
        .cert-signature-right {
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 150px;
        }
        .ceo-signature-line {
            border-bottom: 1.5px solid #475569;
            width: 100%;
            text-align: center;
            padding-bottom: 2px;
            min-height: 26px;
            display: flex;
            align-items: flex-end;
            justify-content: center;
        }
        .ceo-handwritten-sig {
            font-family: 'Caveat', cursive;
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            line-height: 1;
        }
        .ceo-signature-label {
            font-size: 11px;
            font-weight: 700;
            color: #1e293b;
            margin-top: 4px;
            letter-spacing: 0.05em;
        }
        .cert-green-footer {
            background: #008744 !important;
            color: #ffffff !important;
            padding: 14px 44px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
        }
        .footer-left-col {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .ecocycle-title {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: 0.06em;
            font-family: 'Outfit', sans-serif;
            color: #ffffff;
        }
        .ecocycle-subtitle {
            font-size: 11.5px;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.95);
        }
        .footer-address-line {
            font-size: 10.5px;
            color: rgba(255, 255, 255, 0.88);
            line-height: 1.35;
        }
        .footer-right-col {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
        }
        .auth-label {
            font-size: 10.5px;
            font-style: italic;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.95);
        }
        .auth-compliance-pill {
            background: #ffffff;
            color: #008744;
            border-radius: 6px;
            padding: 4px 10px;
            display: flex;
            flex-direction: column;
            line-height: 1.1;
        }
        .auth-compliance-pill strong {
            font-size: 10.5px;
            font-weight: 800;
            color: #008744;
        }
        .auth-compliance-pill span {
            font-size: 8.5px;
            color: #475569;
            font-weight: 600;
        }
        .footer-contact-line {
            font-size: 11.5px;
            font-weight: 600;
            color: #ffffff;
        }
    </style>
</head>
<body>
    <div class="cert-card">
        <div class="cert-canvas-body">
            <div class="cert-watermark-lines"></div>
            
            <div class="cert-header-left">
                <h1 class="cert-calligraphy-headline">Certificate</h1>
                <h2 class="cert-headline-sub">of E-waste Recycling</h2>
            </div>

            <div class="cert-badge-right">
                <svg viewBox="0 0 200 240" style="width:100%;height:100%;">
                    <defs>
                        <linearGradient id="goldGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#fef08a" />
                            <stop offset="25%" stop-color="#eab308" />
                            <stop offset="50%" stop-color="#ca8a04" />
                            <stop offset="75%" stop-color="#fef08a" />
                            <stop offset="100%" stop-color="#a16207" />
                        </linearGradient>
                        <linearGradient id="goldRibbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stop-color="#eab308" />
                            <stop offset="40%" stop-color="#ca8a04" />
                            <stop offset="100%" stop-color="#854d0e" />
                        </linearGradient>
                        <radialGradient id="goldInnerSunburst" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stop-color="#fef9c3" />
                            <stop offset="45%" stop-color="#fde047" />
                            <stop offset="80%" stop-color="#eab308" />
                            <stop offset="100%" stop-color="#a16207" />
                        </radialGradient>
                    </defs>
                    <g id="ribbons">
                        <polygon points="60,110 32,205 60,185 88,205 78,110" fill="url(#goldRibbonGrad)" />
                        <polygon points="140,110 122,205 150,185 178,205 150,110" fill="url(#goldRibbonGrad)" />
                    </g>
                    <g id="badge-outer">
                        <circle cx="100" cy="100" r="76" fill="url(#goldGradientMain)" />
                        <circle cx="100" cy="100" r="72" fill="#ca8a04" stroke="#fef08a" stroke-width="2" stroke-dasharray="6,4" />
                        <circle cx="100" cy="100" r="68" fill="url(#goldGradientMain)" stroke="#854d0e" stroke-width="1.5" />
                        <circle cx="100" cy="100" r="62" fill="#a16207" />
                        <circle cx="100" cy="100" r="60" fill="url(#goldInnerSunburst)" stroke="#fef08a" stroke-width="1.5" />
                        <circle cx="100" cy="100" r="48" fill="url(#goldInnerSunburst)" stroke="#ca8a04" stroke-width="1" />
                        <text x="100" y="88" text-anchor="middle" fill="#1e293b" font-family="'Great Vibes', cursive" font-size="30">Green</text>
                        <text x="100" y="118" text-anchor="middle" fill="#0f172a" font-family="'Impact', sans-serif" font-size="21" font-weight="900" letter-spacing="0.08em">AWARD</text>
                    </g>
                </svg>
            </div>

            <div class="cert-body-content">
                <p class="cert-sentence">
                    This is to certify that <span class="cert-underline weight-val">${weightKg}</span> KG of E-waste that was collected from
                </p>
                <div class="cert-entity-underline-row">
                    <span class="cert-entity-name">${clientWithDevice}</span>
                </div>
                <p class="cert-sentence">
                    dated on <span class="cert-underline date-val">${rawDate}</span> against manifest number S.S.No: <span class="cert-underline ss-val">${manifestId}</span> &amp; <span class="cert-underline auth-ss-val">${ssNo}</span> has been recycled in an environmentally friendly manner.
                </p>
                <p class="cert-appreciation-sentence">
                    We appreciate your efforts to promote a clean and environmentally friendly environment.
                </p>
            </div>

            <div class="cert-meta-signature-row">
                <div class="cert-meta-left">
                    <div class="cert-meta-field">
                        <span class="meta-label">Certification No</span>
                        <span class="meta-underline">${certNo}</span>
                    </div>
                    <div class="cert-meta-field">
                        <span class="meta-label">Authorization no</span>
                        <span class="meta-underline">${authNo}</span>
                    </div>
                </div>
                <div class="cert-signature-right">
                    <div class="ceo-signature-line">
                        <span class="ceo-handwritten-sig">${activeCenterName}</span>
                    </div>
                    <div class="ceo-signature-label">AUTHORIZED SIGNATURE</div>
                </div>
            </div>
        </div>

        <div class="cert-green-footer">
            <div class="footer-left-col">
                <div class="ecocycle-title">ECOCYCLE™</div>
                <div class="ecocycle-subtitle">${activeCenterName}</div>
                <div class="footer-address-line">EcoCycle National Circular Economy &amp; Zero-Landfill Material Recovery Network</div>
            </div>
            <div class="footer-right-col">
                <div class="auth-label">Authorised by</div>
                <div class="auth-compliance-pill">
                    <strong>CPCB &amp; MoEFCC</strong>
                    <span>E-Waste (Management) Rules</span>
                </div>
                <div class="footer-contact-line">www.ecocycle.org | support@ecocycle.org</div>
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
                {/* Top Control Bar */}
                <div className="recyc-cert-modal-topbar no-print">
                    <div className="cert-topbar-title">
                        <FiCheck className="cert-check-icon" /> Official Certificate of E-waste Recycling
                    </div>
                    <button className="cert-modal-close-btn" onClick={onClose} title="Close">
                        <FiX />
                    </button>
                </div>

                {/* Printable Certificate Sheet */}
                <div className="recyc-techazar-cert-wrap" ref={certRef}>
                    <div className="recyc-techazar-cert">
                        {/* Certificate Main Canvas Body */}
                        <div className="cert-canvas-body">
                            {/* Subtle diagonal watermark lines */}
                            <div className="cert-watermark-lines"></div>

                            {/* Top Left Header */}
                            <div className="cert-header-left">
                                <h1 className="cert-calligraphy-headline">Certificate</h1>
                                <h2 className="cert-headline-sub">of E-waste Recycling</h2>
                            </div>

                            {/* Top Right: Gold Green Award Badge */}
                            <div className="cert-badge-right">
                                <GreenAwardBadge />
                            </div>

                            {/* Attestation Body Text Lines */}
                            <div className="cert-body-content">
                                <p className="cert-sentence line-1">
                                    This is to certify that <span className="cert-underline weight-val">{weightKg}</span> KG of E-waste that was collected from
                                </p>

                                <div className="cert-entity-underline-row">
                                    <span className="cert-entity-name">
                                        {formattedClientName}{deviceModel ? ` (${deviceModel})` : ""}
                                    </span>
                                </div>

                                <p className="cert-sentence line-2">
                                    dated on <span className="cert-underline date-val">{rawDate}</span> against manifest number S.S.No: <span className="cert-underline ss-val">{manifestId}</span> &amp; <span className="cert-underline auth-ss-val">{ssNo}</span> has been recycled in an environmentally friendly manner.
                                </p>

                                <p className="cert-appreciation-sentence">
                                    We appreciate your efforts to promote a clean and environmentally friendly environment.
                                </p>
                            </div>

                            {/* Meta & Signatures Row */}
                            <div className="cert-meta-signature-row">
                                <div className="cert-meta-left">
                                    <div className="cert-meta-field">
                                        <span className="meta-label">Certification No</span>
                                        <span className="meta-underline">{certNo}</span>
                                    </div>
                                    <div className="cert-meta-field">
                                        <span className="meta-label">Authorization no</span>
                                        <span className="meta-underline">{authNo}</span>
                                    </div>
                                </div>

                                <div className="cert-signature-right">
                                    <div className="ceo-signature-line">
                                        <span className="ceo-handwritten-sig">{activeCenterName}</span>
                                    </div>
                                    <div className="ceo-signature-label">AUTHORIZED SIGNATURE</div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Green Footer Banner with Project Identity */}
                        <div className="cert-green-footer">
                            <div className="footer-left-col">
                                <EcoCycleBrandGroup centerName={activeCenterName} />
                                <div className="footer-address-line">
                                    EcoCycle National Circular Economy &amp; Zero-Landfill Material Recovery Network
                                </div>
                            </div>

                            <div className="footer-right-col">
                                <RegulatoryAuthPill />
                                <div className="footer-contact-line">
                                    <span className="footer-site">www.ecocycle.org</span> | <span className="footer-email">support@ecocycle.org</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Action Footer */}
                <div className="recyc-cert-modal-actions no-print">
                    <button className="btn-action primary" onClick={handleDownloadOrPrintPDF}>
                        <FiDownload /> Download Certificate (PDF)
                    </button>
                    <button className="btn-action glass" onClick={handleDownloadOrPrintPDF}>
                        <FiPrinter /> Print
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
