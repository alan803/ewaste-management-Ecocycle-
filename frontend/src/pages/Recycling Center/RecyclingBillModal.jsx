import React, { useRef } from "react";
import { FiX, FiPrinter, FiCheck, FiDownload } from "react-icons/fi";
import "./RecyclingBillModal.css";

function RecyclingBillModal({ isOpen, onClose, certificateData, selectedRequest }) {
    const billRef = useRef(null);

    if (!isOpen) return null;

    const data = certificateData || {};
    const dev = selectedRequest || {};

    // Center details
    const companyName = (
        data.centerName ||
        localStorage.getItem("centerName") ||
        localStorage.getItem("userName") ||
        "ECOCYCLE RECYCLING & MATERIAL RECOVERY FACILITY"
    ).toUpperCase();

    // Client/Customer name
    const clientName = (
        data.ownerName ||
        data.customerName ||
        dev.customerName ||
        "Valued Citizen & Eco Partner"
    );

    const deviceName = `${dev.brand || "Electronic"} ${dev.model || "Hardware Asset"}`;
    const deviceId = dev.deviceId || dev.id || "DEV-2026";
    const reqId = dev.id ? `REQ-${dev.id.toString().padStart(6, "0")}` : "REQ-000020";
    const manifestNo = `MNF-${(dev.id || "20").toString().padStart(6, "0")}`;
    const location = `${localStorage.getItem("city") || "Central Processing Hub"}, ${localStorage.getItem("state") || "India"}`;
    const paymentTxnId = data.paymentTransactionId || dev.paymentTransactionId || "ESCROW-REC-SETTLED";
    const paymentMethod = data.paymentMethod || "EcoCycle Escrow (Razorpay)";

    // Date calculations
    const today = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthYear = `${months[today.getMonth()]} ${today.getFullYear()}`;
    const dateFormatted = `${String(today.getDate()).padStart(2, "0")} ${months[today.getMonth()]} ${today.getFullYear()}`;

    // Material yields (Earnings)
    const rawMaterials = data.recoveredMaterials || [
        { materialName: "Copper Winding & Wiring", quantity: 0.8, pricePerUnit: 650 },
        { materialName: "Aluminum Alloy Frame", quantity: 1.2, pricePerUnit: 220 },
        { materialName: "Gold/Silver PCB Motherboard", quantity: 0.5, pricePerUnit: 1800 },
        { materialName: "High-Grade ABS Plastics", quantity: 0.9, pricePerUnit: 85 },
        { materialName: "Ferrous Metal & Steel Casing", quantity: 0.3, pricePerUnit: 45 }
    ];

    const earningsList = rawMaterials.map((m, idx) => {
        const qty = parseFloat(m.quantity) || 0;
        const rate = parseFloat(m.pricePerUnit) || 0;
        const amount = Math.round(qty * rate) || Math.round((idx + 1) * 350);
        return {
            sNo: idx + 1,
            name: m.materialName,
            qty: qty.toFixed(2),
            rate: rate,
            amount: amount
        };
    });

    const totalRecoveryValue = earningsList.reduce((acc, curr) => acc + curr.amount, 0) || (data.totalMaterialValue || 3700);
    const totalMassKg = (data.totalRecoveredWeightKg || dev.weightKg || "3.70");

    // Standalone PDF Download / Print
    const handleDownloadOrPrint = () => {
        const printWin = window.open("", "_blank");
        if (!printWin) {
            window.print();
            return;
        }

        const earningsRowsHtml = earningsList.map(e => `
            <tr>
                <td style="text-align: center; border: 1px solid #000000; padding: 6px 8px;">${e.sNo}</td>
                <td style="border: 1px solid #000000; padding: 6px 10px; font-weight: 700;">${e.name}</td>
                <td style="text-align: center; border: 1px solid #000000; padding: 6px 8px; font-family: monospace;">${e.qty} kg</td>
                <td style="text-align: right; border: 1px solid #000000; padding: 6px 8px; font-family: monospace;">₹${e.rate.toLocaleString("en-IN")}</td>
                <td style="text-align: right; border: 1px solid #000000; padding: 6px 10px; font-family: monospace; font-weight: 700;">₹${e.amount.toLocaleString("en-IN")}</td>
            </tr>
        `).join("");

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>EcoCycle_Settlement_Bill_${reqId}.pdf</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 10mm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #000000;
        }
        body {
            background: #ffffff;
            padding: 10px;
            display: flex;
            justify-content: center;
        }
        .bill-card {
            width: 100%;
            max-width: 900px;
            border: 2px solid #000000;
            background: #ffffff;
            padding: 14px;
        }
        .header-box {
            border: 1.5px solid #000000;
            text-align: center;
            padding: 6px 4px;
            margin-bottom: 8px;
        }
        .comp-title {
            font-size: 15px;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .bill-sub {
            font-size: 12px;
            font-weight: 700;
            border-top: 1px solid #000000;
            margin-top: 4px;
            padding-top: 3px;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border: 1.5px solid #000000;
            padding: 8px 12px;
            margin-bottom: 12px;
            font-size: 11px;
            line-height: 1.65;
        }
        .table-box {
            border: 1.5px solid #000000;
            margin-bottom: 14px;
        }
        .table-title {
            text-align: center;
            font-weight: 800;
            font-size: 12px;
            padding: 5px;
            border-bottom: 1.5px solid #000000;
            background: #f8fafc;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }
        th {
            border: 1px solid #000000;
            padding: 6px 8px;
            font-weight: 800;
            background: #ffffff;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
            font-size: 11px;
        }
        .sum-box {
            display: flex;
            border: 1.5px solid #000000;
            margin-bottom: 6px;
            height: 28px;
            align-items: center;
        }
        .sum-label {
            width: 55%;
            font-weight: 800;
            padding: 0 8px;
            border-right: 1.5px solid #000000;
            text-transform: uppercase;
            font-size: 10.5px;
        }
        .sum-val {
            width: 45%;
            text-align: right;
            padding: 0 8px;
            font-weight: 800;
            font-family: monospace;
            font-size: 11.5px;
        }
        .sign-row {
            display: flex;
            justify-content: space-between;
            margin-top: 14px;
            padding-top: 8px;
            border-top: 1px solid #000000;
            font-size: 10.5px;
        }
    </style>
</head>
<body>
    <div class="bill-card">
        <div class="header-box">
            <div class="comp-title">${companyName}</div>
            <div class="bill-sub">Recycling Settlement Bill &amp; Recovery Slip for ${currentMonthYear}</div>
        </div>

        <div class="meta-grid">
            <div>
                <div><strong>Client / Name:</strong> ${clientName}</div>
                <div><strong>Device Spec:</strong> ${deviceName}</div>
                <div><strong>Device ID:</strong> DEV #${deviceId} &bull; ${reqId}</div>
                <div><strong>Facility Location:</strong> ${location}</div>
            </div>
            <div>
                <div><strong>Department:</strong> Industrial E-Waste Recovery &amp; Dismantling</div>
                <div><strong>Payment Method:</strong> ${paymentMethod}</div>
                <div><strong>Settlement Txn ID:</strong> ${paymentTxnId}</div>
                <div><strong>Manifest / Voucher No:</strong> ${manifestNo}</div>
            </div>
        </div>

        <!-- Full-Width Recovered Material Yield Table -->
        <div class="table-box">
            <div class="table-title">Recovered Material Yield (Earnings)</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 40px; text-align: center;">Serial No.</th>
                        <th style="text-align: left;">Material Recovery Head</th>
                        <th style="width: 90px; text-align: center;">Quantity (kg)</th>
                        <th style="width: 90px; text-align: right;">Rate (₹/kg)</th>
                        <th style="width: 100px; text-align: right;">Amount (Rs.)</th>
                    </tr>
                </thead>
                <tbody>
                    ${earningsRowsHtml}
                </tbody>
            </table>
        </div>

        <!-- Summary Boxes Row -->
        <div class="summary-grid">
            <div>
                <div class="sum-box" style="background: #f0fdf4;">
                    <div class="sum-label" style="color: #166534;">TOTAL RECOVERY SETTLEMENT</div>
                    <div class="sum-val" style="color: #166534; font-size: 13px;">₹${totalRecoveryValue.toLocaleString("en-IN")}</div>
                </div>
                <div class="sum-box">
                    <div class="sum-label">TOTAL RECOVERED MASS</div>
                    <div class="sum-val">${totalMassKg} kg</div>
                </div>
            </div>
            <div>
                <div class="sum-box">
                    <div class="sum-label">PAYMENT STATUS</div>
                    <div class="sum-val" style="color: #059669;">VERIFIED &amp; PAID</div>
                </div>
                <div class="sum-box">
                    <div class="sum-label">VOUCHER ISSUE DATE</div>
                    <div class="sum-val">${dateFormatted}</div>
                </div>
            </div>
        </div>

        <div class="sign-row">
            <div>Authorized Plant Officer: <strong>${companyName}</strong></div>
            <div>Verified Beneficiary: <strong>${clientName}</strong></div>
            <div>EcoCycle Escrow Stamp: <strong>CPCB COMPLIANT</strong></div>
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
        printWin.document.write(html);
        printWin.document.close();
    };

    return (
        <div className="recyc-bill-modal-overlay" onClick={onClose}>
            <div className="recyc-bill-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Modal Topbar */}
                <div className="recyc-bill-modal-topbar no-print">
                    <div className="bill-topbar-title">
                        <FiCheck className="bill-check-icon" /> Official Recycling Settlement Bill &amp; Recovery Voucher
                    </div>
                    <button className="bill-modal-close-btn" onClick={onClose} title="Close">
                        <FiX />
                    </button>
                </div>

                {/* Printable Bill Canvas Sheet */}
                <div className="recyc-bill-sheet-wrap" ref={billRef}>
                    <div className="recyc-salary-bill-card">
                        {/* Company Header Box */}
                        <div className="bill-header-row">
                            <div className="bill-company-name">{companyName}</div>
                            <div className="bill-subheading">
                                Recycling Settlement Bill &amp; Recovery Slip for {currentMonthYear}
                            </div>
                        </div>

                        {/* Upper 2-Column Metadata Grid */}
                        <div className="bill-meta-info-grid">
                            <div className="bill-meta-col-left">
                                <div className="meta-line">
                                    <span className="meta-k">Name:</span>
                                    <span className="meta-v">{clientName}</span>
                                </div>
                                <div className="meta-line">
                                    <span className="meta-k">Designation / Spec:</span>
                                    <span className="meta-v">{deviceName}</span>
                                </div>
                                <div className="meta-line">
                                    <span className="meta-k">Location / Facility:</span>
                                    <span className="meta-v">{location}</span>
                                </div>
                                <div className="meta-line">
                                    <span className="meta-k">Device Asset ID:</span>
                                    <span className="meta-v font-mono">DEV #{deviceId} &bull; {reqId}</span>
                                </div>
                            </div>

                            <div className="bill-meta-col-right">
                                <div className="meta-line">
                                    <span className="meta-k">Department:</span>
                                    <span className="meta-v">Industrial E-Waste Material Disassembly</span>
                                </div>
                                <div className="meta-line">
                                    <span className="meta-k">Bank / Channel:</span>
                                    <span className="meta-v">{paymentMethod}</span>
                                </div>
                                <div className="meta-line">
                                    <span className="meta-k">Settlement Txn ID:</span>
                                    <span className="meta-v font-mono">{paymentTxnId}</span>
                                </div>
                                <div className="meta-line">
                                    <span className="meta-k">Manifest Number:</span>
                                    <span className="meta-v font-mono">{manifestNo}</span>
                                </div>
                            </div>
                        </div>

                        {/* Full-Width Recovered Material Yield Table */}
                        <div className="bill-table-wrapper" style={{ marginBottom: "14px" }}>
                            <div className="bill-table-heading">Recovered Material Yield (Earnings)</div>
                            <table className="bill-data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "42px", textAlign: "center" }}>Serial No.</th>
                                        <th style={{ textAlign: "left" }}>Material Recovery Head</th>
                                        <th style={{ width: "95px", textAlign: "center" }}>Quantity (kg)</th>
                                        <th style={{ width: "95px", textAlign: "right" }}>Rate (₹/kg)</th>
                                        <th style={{ width: "110px", textAlign: "right" }}>Amount (Rs.)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {earningsList.map((item) => (
                                        <tr key={item.sNo}>
                                            <td style={{ textAlign: "center" }}>{item.sNo}</td>
                                            <td style={{ fontWeight: 700 }}>{item.name}</td>
                                            <td style={{ textAlign: "center", fontFamily: "monospace" }}>{item.qty} kg</td>
                                            <td style={{ textAlign: "right", fontFamily: "monospace" }}>₹{item.rate.toLocaleString("en-IN")}</td>
                                            <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>
                                                ₹{item.amount.toLocaleString("en-IN")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Bottom Summary Boxes Grid */}
                        <div className="bill-summary-boxes-grid">
                            {/* Left Summary Box Group */}
                            <div className="bill-summary-col">
                                <div className="bill-box-row highlight-green">
                                    <div className="box-title">TOTAL RECOVERY SETTLEMENT</div>
                                    <div className="box-value net-pay">₹{totalRecoveryValue.toLocaleString("en-IN")}</div>
                                </div>
                                <div className="bill-box-row">
                                    <div className="box-title">TOTAL RECOVERED MASS</div>
                                    <div className="box-value">{totalMassKg} kg</div>
                                </div>
                            </div>

                            {/* Right Summary Box Group */}
                            <div className="bill-summary-col">
                                <div className="bill-box-row">
                                    <div className="box-title">PAYMENT STATUS</div>
                                    <div className="box-value text-green">VERIFIED &amp; PAID</div>
                                </div>
                                <div className="bill-box-row">
                                    <div className="box-title">VOUCHER ISSUE DATE</div>
                                    <div className="box-value">{dateFormatted}</div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Signatures / Verification Row */}
                        <div className="bill-bottom-signature-row">
                            <div>Authorized Facility Directorate: <strong>{companyName}</strong></div>
                            <div>Beneficiary Signature: <strong>{clientName}</strong></div>
                            <div>Compliance Standard: <strong>CPCB ZERO-LANDFILL</strong></div>
                        </div>
                    </div>
                </div>

                {/* Modal Actions */}
                <div className="recyc-bill-modal-actions no-print">
                    <button className="btn-action primary" onClick={handleDownloadOrPrint}>
                        <FiDownload /> Download Bill (PDF)
                    </button>
                    <button className="btn-action glass" onClick={handleDownloadOrPrint}>
                        <FiPrinter /> Print Bill
                    </button>
                    <button className="btn-action glass" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RecyclingBillModal;
