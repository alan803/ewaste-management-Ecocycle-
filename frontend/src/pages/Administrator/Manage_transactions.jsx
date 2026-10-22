import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import {
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
    FiArrowUpRight,
    FiArrowDownLeft,
    FiTrendingUp,
    FiTrendingDown,
    FiLock,
    FiCopy,
    FiDownload,
    FiFileText,
    FiCreditCard,
    FiTruck,
    FiTool,
    FiArrowRight
} from "react-icons/fi";
import { FaLeaf, FaBalanceScale, FaWarehouse, FaRupeeSign } from "react-icons/fa";
import "./Manage_transactions.css";

const API_BASE = "https://ecocycle.runasp.net/api";

// Helper for INR currency formatting
const formatINR = (num) => {
    const n = Number(num) || 0;
    return n.toLocaleString("en-IN", {
        minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
        maximumFractionDigits: 2
    });
};

function ManageTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters matching Manage_recyclingprocess
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All"); // 'All' | 'Incoming' | 'Outgoing' | 'EcoCycle' | 'Ledger'
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

    // Modal States
    const [selectedTx, setSelectedTx] = useState(null);
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [copiedId, setCopiedId] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        try {
            setRefreshing(true);
            const [txRes, sumRes] = await Promise.all([
                axios.get(`${API_BASE}/Settlement/all-transactions`, { headers }),
                axios.get(`${API_BASE}/Settlement/ecocycle-financial-summary`, { headers })
            ]);

            if (txRes.data && txRes.data.transactions) {
                setTransactions(txRes.data.transactions);
            }
            if (sumRes.data) {
                setSummary(sumRes.data);
            }
        } catch (err) {
            console.error("Failed fetching transactions:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Quick Metrics
    const totalCount = transactions.length;
    const incomingList = transactions.filter(t => t.direction === "Incoming" || t.direction === "Credit");
    const outgoingList = transactions.filter(t => t.direction === "Outgoing" || t.direction === "Debit");
    const ledgerList = transactions.filter(t => t.category === "Ledger");

    const incomingCount = incomingList.length;
    const outgoingCount = outgoingList.length;
    const ledgerCount = ledgerList.length;

    const totalInflow = summary?.totalInflow ?? incomingList.reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalOutflow = summary?.totalOutflow ?? outgoingList.reduce((acc, t) => acc + (t.amount || 0), 0);
    const escrowBalance = summary?.currentEscrowBalance ?? Math.max(0, totalInflow - totalOutflow);
    const platformProfit = summary?.platformRetainedProfit ?? 0;

    // Filter Data
    const filteredTransactions = useMemo(() => {
        return transactions.filter(item => {
            const isIncoming = item.direction === "Incoming" || item.direction === "Credit";
            const isOutgoing = item.direction === "Outgoing" || item.direction === "Debit";
            const isLedger = item.category === "Ledger";

            if (activeTab === "Incoming" && !isIncoming) return false;
            if (activeTab === "Outgoing" && !isOutgoing) return false;
            if (activeTab === "Ledger" && !isLedger) return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            const id = String(item.id || "").toLowerCase();
            const rpId = String(item.razorpayPaymentId || "").toLowerCase();
            const rpOrd = String(item.razorpayOrderId || "").toLowerCase();
            const desc = String(item.description || "").toLowerCase();
            const payer = String(item.payer || "").toLowerCase();
            const receiver = String(item.receiver || "").toLowerCase();
            const model = String(item.deviceModel || "").toLowerCase();
            const devId = String(item.deviceId || "").toLowerCase();
            const type = String(item.transactionType || "").toLowerCase();

            return (
                id.includes(q) ||
                rpId.includes(q) ||
                rpOrd.includes(q) ||
                desc.includes(q) ||
                payer.includes(q) ||
                receiver.includes(q) ||
                model.includes(q) ||
                devId.includes(q) ||
                type.includes(q)
            );
        }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }, [transactions, activeTab, searchQuery]);

    const handleCopy = (text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });
        } catch {
            return dateStr;
        }
    };

    const getCategoryIcon = (categoryName) => {
        const cat = (categoryName || "").toLowerCase();
        if (cat.includes("laptop") || cat.includes("computer") || cat.includes("pc")) return <FiCpu />;
        if (cat.includes("mobile") || cat.includes("phone") || cat.includes("tablet")) return <FiSmartphone />;
        if (cat.includes("tv") || cat.includes("display") || cat.includes("monitor")) return <FiTv />;
        return <FiBox />;
    };

    const getStatusBadge = (item) => {
        const status = (item.status || "").toLowerCase();
        const isPaid = status === "paid" || status === "completed" || status === "success";

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

        if (isPaid) {
            return (
                <span style={{ ...badgeStyle, background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}>
                    <FiCheckCircle /> Settled &bull; Paid
                </span>
            );
        } else {
            return (
                <span style={{ ...badgeStyle, background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                    <FiClock /> {item.status || "Pending"}
                </span>
            );
        }
    };

    const exportCSV = () => {
        const headers = ["ID", "Category", "Type", "Direction", "Amount (INR)", "Status", "Payer", "Receiver", "Device ID", "Model", "Gateway Ref", "Date"];
        const rows = filteredTransactions.map(t => [
            t.id,
            t.category,
            t.transactionType,
            t.direction,
            t.amount,
            t.status,
            `"${t.payer || ''}"`,
            `"${t.receiver || ''}"`,
            t.deviceId || '',
            `"${t.deviceModel || ''}"`,
            t.razorpayPaymentId || '',
            new Date(t.date).toLocaleString()
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ecocycle_financial_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="admin-inspection-page">
            {/* Sidebar Navigation */}
            <Navbar />

            {/* Main Content Area */}
            <div className="admin-inspection-main">
                {/* Floating Glass Topbar Header matching Manage_recyclingprocess */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <div className="command-brand">
                            <h1>Financial Transactions &amp;  Control</h1>
                        </div>
                        <p className="command-subtitle">
                            Monitor incoming center settlements, multi-stakeholder disbursements,  balances, and EcoCycle platform revenue
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search transaction, Razorpay ID, model, beneficiary..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span className="search-shortcut">⌘K</span>
                        </div>

                        <div className="topbar-actions">
                            <button 
                                className="glass-btn notification-btn" 
                                title="Export Audit CSV"
                                onClick={exportCSV}
                                style={{ color: "#059669" }}
                            >
                                <FiDownload />
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

                {/* Analytics Metric Cards Grid matching Manage_recyclingprocess */}
                <div className="admin-metrics-grid">
                    <div className="admin-metric-card">
                        <div className="admin-metric-icon in-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
                            <FiArrowDownLeft />
                        </div>
                        <div className="admin-metric-info">
                            <h3>₹{formatINR(totalInflow)}</h3>
                            <p>Total Settlements Inflow</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon out-icon" style={{ background: "#fef2f2", color: "#e11d48" }}>
                            <FiArrowUpRight />
                        </div>
                        <div className="admin-metric-info">
                            <h3>₹{formatINR(totalOutflow)}</h3>
                            <p>Total Outgoing Payouts</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon active" style={{ background: "#e0f2fe", color: "#0284c7" }}>
                            <FaBalanceScale />
                        </div>
                        <div className="admin-metric-info">
                            <h3>₹{formatINR(escrowBalance)}</h3>
                            <p>Active Balance</p>
                        </div>
                    </div>

                    <div className="admin-metric-card">
                        <div className="admin-metric-icon done" style={{ background: "#fef3c7", color: "#d97706" }}>
                            <FaLeaf />
                        </div>
                        <div className="admin-metric-info">
                            <h3>₹{formatINR(platformProfit)}</h3>
                            <p>EcoCycle Retained Margin</p>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* SECTION 1: ECOCYCLE MONEY DETAILS ONLY (DEDICATED SECTION) */}
                {/* ========================================================================= */}
                <div className="panel-card" style={{ marginBottom: "1.75rem", border: "1px solid #cbd5e1" }}>
                    <div className="panel-header" style={{ paddingBottom: "1rem" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <div className="admin-cat-icon-box" style={{ background: "#ecfdf5", color: "#059669", width: "34px", height: "34px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <FaLeaf />
                                </div>
                                <h2 className="panel-title">EcoCycle Platform Money Details &amp; Treasury</h2>
                            </div>
                            <p className="panel-subtitle">Dedicated isolation of platform retained profit, capital inflow streams, and disbursement allocations</p>
                        </div>

                        <div className="panel-actions">
                            <span className="cat-tag-pill" style={{ background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0", fontWeight: 700 }}>
                                <FiLock /> 100% Fully Backed  Vault
                            </span>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "1.25rem", padding: "1.25rem", background: "#f8fafc", borderRadius: "12px" }}>
                        {/* Inbound Capital Box */}
                        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>
                                    <FiArrowDownLeft style={{ color: "#059669" }} /> Inbound Capital Streams
                                </div>
                                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669", background: "#ecfdf5", padding: "2px 8px", borderRadius: "999px" }}>Inflow</span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem" }}>
                                    <span style={{ color: "#64748b" }}>Center Buyouts (Refurb &amp; Recycling):</span>
                                    <strong style={{ color: "#0f172a" }}>₹{formatINR(summary?.inflowBreakdown?.centerSettlements || (totalInflow * 0.95))}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem" }}>
                                    <span style={{ color: "#64748b" }}>Compliance Penalties:</span>
                                    <strong style={{ color: "#0f172a" }}>₹{formatINR(summary?.inflowBreakdown?.penalties || 0)}</strong>
                                </div>
                            </div>

                            <div style={{ marginTop: "auto", paddingTop: "0.65rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Total Inflow Captured:</span>
                                <strong style={{ color: "#059669", fontSize: "1.05rem" }}>₹{formatINR(totalInflow)}</strong>
                            </div>
                        </div>

                        {/* Outbound Capital Box */}
                        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>
                                    <FiArrowUpRight style={{ color: "#e11d48" }} /> Disbursement Allocations
                                </div>
                                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e11d48", background: "#fef2f2", padding: "2px 8px", borderRadius: "999px" }}>Outflow</span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem" }}>
                                    <span style={{ color: "#64748b" }}>Citizen Residual Payouts:</span>
                                    <strong style={{ color: "#0f172a" }}>₹{formatINR(summary?.outflowBreakdown?.citizens || 0)}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem" }}>
                                    <span style={{ color: "#64748b" }}>Technician Diagnostics:</span>
                                    <strong style={{ color: "#0f172a" }}>₹{formatINR(summary?.outflowBreakdown?.technicians || 0)}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem" }}>
                                    <span style={{ color: "#64748b" }}>Logistics &amp; Transport Agents:</span>
                                    <strong style={{ color: "#0f172a" }}>₹{formatINR(summary?.outflowBreakdown?.agents || 0)}</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem" }}>
                                    <span style={{ color: "#64748b" }}>Center Processing Fees:</span>
                                    <strong style={{ color: "#0f172a" }}>₹{formatINR(summary?.outflowBreakdown?.centers || 0)}</strong>
                                </div>
                            </div>

                            <div style={{ marginTop: "auto", paddingTop: "0.65rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Total Distributed:</span>
                                <strong style={{ color: "#e11d48", fontSize: "1.05rem" }}>₹{formatINR(totalOutflow)}</strong>
                            </div>
                        </div>

                        {/* Treasury Health Box */}
                        <div style={{ background: "#ffffff", border: "1px solid #bae6fd", borderRadius: "12px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>
                                    <FaBalanceScale style={{ color: "#0284c7" }} /> Treasury &amp; Retained Margin
                                </div>
                                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0284c7", background: "#e0f2fe", padding: "2px 8px", borderRadius: "999px" }}>Audited</span>
                            </div>

                            <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "10px", textAlign: "center" }}>
                                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>EcoCycle Retained Platform Net</span>
                                <h3 style={{ margin: "4px 0 0 0", fontSize: "1.75rem", color: "#d97706", fontWeight: 800 }}>₹{formatINR(platformProfit)}</h3>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem" }}>
                                <span style={{ color: "#64748b" }}>Active  Liquidity:</span>
                                <strong style={{ color: "#0284c7" }}>₹{formatINR(escrowBalance)}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.825rem" }}>
                                <span style={{ color: "#64748b" }}>Settled Hardware:</span>
                                <strong style={{ color: "#0f172a" }}>{summary?.totalSettledDevices || 0} Units</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* SECTION 2: ALL TRANSACTIONS OPERATIONS PANEL & TOGGLE */}
                {/* ========================================================================= */}
                <div className="panel-card">
                    {/* Header with Tabs & View Switcher matching Manage_recyclingprocess */}
                    <div className="panel-header">
                        <div>
                            <h2 className="panel-title">All Transactions &amp; Settlement Log</h2>
                            <p className="panel-subtitle">Comprehensive double-entry records of all incoming center buyouts and outgoing payouts</p>
                        </div>

                        <div className="panel-actions" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                            {/* Filter Pill Group */}
                            <div className="filter-pill-group">
                                {[
                                    { id: "All", label: "All", count: totalCount },
                                    { id: "Incoming", label: "Incoming", count: incomingCount },
                                    { id: "Outgoing", label: "Outgoing", count: outgoingCount }
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

                            {/* View Mode Toggle */}
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

                    {/* Content Section: Loading, Empty, Table or Grid */}
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading financial transactions ledger...</p>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="no-data-state">
                            <FiLayers className="no-data-icon" />
                            <h3>No transactions found</h3>
                            <p>There are no transaction records matching your active filter or search criteria.</p>
                        </div>
                    ) : viewMode === "table" ? (
                        /* TABLE VIEW - COMPACT RESPONSIVE */
                        <div className="glass-table-wrapper tx-table-wrapper">
                            <table className="glass-table tx-compact-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "14%" }}>Transaction / ID</th>
                                        <th style={{ width: "13%" }}>Flow &amp; Type</th>
                                        <th style={{ width: "16%" }}>Sender (Payer)</th>
                                        <th style={{ width: "17%" }}>Beneficiary (Receiver)</th>
                                        <th style={{ width: "14%" }}>Device / Hardware</th>
                                        <th style={{ width: "11%" }}>Amount</th>
                                        <th style={{ width: "10%" }}>Status</th>
                                        <th style={{ width: "5%", textAlign: "center" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map((item) => {
                                        const isIncoming = item.direction === "Incoming" || item.direction === "Credit";

                                        return (
                                            <tr key={item.id} className="table-row-hover">
                                                {/* Transaction ID & Date */}
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <div 
                                                            className="admin-cat-icon-box tx-mini-icon-box" 
                                                            style={{ 
                                                                background: isIncoming ? "#ecfdf5" : "#fef2f2", 
                                                                color: isIncoming ? "#059669" : "#e11d48"
                                                            }}
                                                        >
                                                            {isIncoming ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div className="user-name tx-tbl-id" style={{ fontFamily: "monospace" }}>{item.id}</div>
                                                            <div className="user-email tx-tbl-date">{formatDate(item.date)} &bull; {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Flow & Type */}
                                                <td>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                        <span 
                                                            className="cat-tag-pill tx-mini-pill" 
                                                            style={{ 
                                                                background: isIncoming ? "#ecfdf5" : "#fef2f2", 
                                                                color: isIncoming ? "#047857" : "#be123c",
                                                                borderColor: isIncoming ? "#a7f3d0" : "#fecdd3"
                                                            }}
                                                        >
                                                            {isIncoming ? "INCOMING" : "OUTGOING"}
                                                        </span>
                                                        <span className="tx-tbl-sub">{item.transactionType}</span>
                                                    </div>
                                                </td>

                                                {/* Sender / Payer */}
                                                <td>
                                                    <div className="user-info">
                                                        <span className="user-name tx-tbl-main">{item.payer || "Payer"}</span>
                                                        <span className="user-email tx-tbl-sub">{item.payerType || "Source"}</span>
                                                    </div>
                                                </td>

                                                {/* Beneficiary / Receiver */}
                                                <td>
                                                    <div className="user-info">
                                                        <span className="user-name tx-tbl-main" style={{ color: "#0f172a", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                                            <FiUserCheck style={{ color: "#10b981", flexShrink: 0 }} /> {item.receiver || "Beneficiary"}
                                                        </span>
                                                        <span className="user-email tx-tbl-sub">{item.receiverType || "Destination"}</span>
                                                    </div>
                                                </td>

                                                {/* Device / Hardware */}
                                                <td>
                                                    {item.deviceId ? (
                                                        <div className="user-info">
                                                            <span className="user-name tx-tbl-main">
                                                                {item.deviceModel || `Device #${item.deviceId}`}
                                                            </span>
                                                            <span className="user-email tx-tbl-sub">Ref #{item.deviceId} &bull; {item.deviceCategory || "E-Waste"}</span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontStyle: "italic" }}> Pool</span>
                                                    )}
                                                </td>

                                                {/* Amount */}
                                                <td>
                                                    <div className="user-info">
                                                        <span className="user-name tx-tbl-amt" style={{ color: isIncoming ? "#059669" : "#e11d48", fontWeight: 800 }}>
                                                            {isIncoming ? "+" : "-"} ₹{formatINR(item.amount)}
                                                        </span>
                                                        <span className="user-email tx-tbl-sub">{item.currency || "INR"}</span>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td>
                                                    {getStatusBadge(item)}
                                                </td>

                                                {/* Actions */}
                                                <td style={{ textAlign: "center" }}>
                                                    <button
                                                        className="action-icon-btn view-btn tx-mini-btn"
                                                        title="View Transaction Voucher Slip"
                                                        onClick={() => {
                                                            setSelectedTx(item);
                                                            setShowVoucherModal(true);
                                                        }}
                                                    >
                                                        <FiFileText />
                                                    </button>
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
                            {filteredTransactions.map((item) => {
                                const isIncoming = item.direction === "Incoming" || item.direction === "Credit";

                                return (
                                    <div 
                                        key={item.id} 
                                        className="admin-grid-card tx-grid-card" 
                                        style={{ 
                                            background: "#ffffff", 
                                            border: "1px solid #e2e8f0", 
                                            borderRadius: "14px", 
                                            padding: "1.25rem", 
                                            display: "flex", 
                                            flexDirection: "column", 
                                            gap: "1rem", 
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.02)" 
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", minWidth: 0, flex: "1 1 auto" }}>
                                                <div 
                                                    className="admin-cat-icon-box"
                                                    style={{ 
                                                        background: isIncoming ? "#ecfdf5" : "#fef2f2", 
                                                        color: isIncoming ? "#059669" : "#e11d48",
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    {isIncoming ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a", fontWeight: 700, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.id}</h4>
                                                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.transactionType}</span>
                                                </div>
                                            </div>
                                            <div style={{ flexShrink: 0 }}>
                                                {getStatusBadge(item)}
                                            </div>
                                        </div>

                                        <div style={{ background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "10px", fontSize: "0.825rem", display: "flex", flexDirection: "column", gap: "7px", border: "1px solid #f1f5f9" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                                                <span style={{ color: "#64748b", flexShrink: 0, fontWeight: 500 }}>Amount:</span>
                                                <strong style={{ color: isIncoming ? "#059669" : "#e11d48", fontSize: "0.95rem", textAlign: "right" }}>
                                                    {isIncoming ? "+" : "-"} ₹{formatINR(item.amount)}
                                                </strong>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                                                <span style={{ color: "#64748b", flexShrink: 0, fontWeight: 500 }}>Payer:</span>
                                                <strong style={{ color: "#0f172a", textAlign: "right", wordBreak: "break-word", lineHeight: 1.35 }}>{item.payer}</strong>
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                                                <span style={{ color: "#64748b", flexShrink: 0, fontWeight: 500 }}>Beneficiary:</span>
                                                <strong style={{ color: "#0f172a", textAlign: "right", wordBreak: "break-word", lineHeight: 1.35 }}>{item.receiver}</strong>
                                            </div>
                                            {item.deviceId && (
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                                                    <span style={{ color: "#64748b", flexShrink: 0, fontWeight: 500 }}>Device:</span>
                                                    <strong style={{ color: "#0284c7", textAlign: "right", wordBreak: "break-word", lineHeight: 1.35 }}>#{item.deviceId} {item.deviceModel}</strong>
                                                </div>
                                            )}
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                                                <span style={{ color: "#64748b", flexShrink: 0, fontWeight: 500 }}>Date:</span>
                                                <span style={{ color: "#334155", textAlign: "right" }}>{formatDate(item.date)}</span>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                                            <button
                                                className="btn-card-primary"
                                                onClick={() => {
                                                    setSelectedTx(item);
                                                    setShowVoucherModal(true);
                                                }}
                                                style={{ 
                                                    flex: 1, 
                                                    padding: "0.55rem", 
                                                    justifyContent: "center", 
                                                    display: "flex", 
                                                    alignItems: "center", 
                                                    gap: "6px", 
                                                    fontSize: "0.825rem", 
                                                    fontWeight: 600, 
                                                    borderRadius: "8px", 
                                                    cursor: "pointer",
                                                    background: "#f0fdf4",
                                                    color: "#059669",
                                                    border: "1px solid #bbf7d0"
                                                }}
                                            >
                                                <FiFileText /> View Voucher Slip
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ========================================================================= */}
            {/* CLASSIC BORDERED TRANSACTION DISBURSEMENT DOCUMENT SLIP */}
            {/* ========================================================================= */}
            {showVoucherModal && selectedTx && (
                <div className="admin-modal-backdrop" onClick={() => setShowVoucherModal(false)}>
                    <div className="admin-modal-card classic-slip-modal-card" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Printable Classic Slip Table Structure */}
                        <div className="classic-slip-document printable-slip" id="printable-voucher-slip">
                            <table className="classic-slip-table">
                                <thead>
                                    <tr>
                                        <th colSpan="4" className="slip-main-title">
                                            ECOCYCLE  SYSTEM
                                        </th>
                                    </tr>
                                    <tr>
                                        <th colSpan="4" className="slip-sub-title">
                                            Transaction &amp; Payment Disbursement Slip — Voucher #{selectedTx.id}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Stakeholder & Metadata Info Block */}
                                    <tr>
                                        <td className="lbl-cell" style={{ width: "22%" }}>Transaction ID:</td>
                                        <td className="val-cell" style={{ width: "28%" }}><strong>{selectedTx.id}</strong></td>
                                        <td className="lbl-cell" style={{ width: "22%" }}>Issue Date &amp; Time:</td>
                                        <td className="val-cell" style={{ width: "28%" }}>
                                            {new Date(selectedTx.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="lbl-cell">Beneficiary Name:</td>
                                        <td className="val-cell"><strong>{selectedTx.receiver}</strong></td>
                                        <td className="lbl-cell">Payer (Source):</td>
                                        <td className="val-cell">{selectedTx.payer || "EcoCycle  Pool"}</td>
                                    </tr>
                                    <tr>
                                        <td className="lbl-cell">Beneficiary Role:</td>
                                        <td className="val-cell">{selectedTx.receiverType || "Stakeholder Beneficiary"}</td>
                                        <td className="lbl-cell">Payer Role:</td>
                                        <td className="val-cell">{selectedTx.payerType || "Central "}</td>
                                    </tr>
                                    <tr>
                                        <td className="lbl-cell">Reference Device:</td>
                                        <td className="val-cell">
                                            {selectedTx.deviceId ? `${selectedTx.deviceModel || "Hardware"} (Device #${selectedTx.deviceId})` : "N/A (Central Treasury)"}
                                        </td>
                                        <td className="lbl-cell"> Account:</td>
                                        <td className="val-cell">EC-ESCROW-POOL-MAIN</td>
                                    </tr>

                                    {/* Section Header */}
                                    <tr>
                                        <th colSpan="4" className="slip-section-th">
                                            DISBURSEMENT PARTICULARS &amp; SETTLEMENT BREAKDOWN
                                        </th>
                                    </tr>

                                    {/* Table Column Subheaders */}
                                    <tr className="slip-col-headers">
                                        <th style={{ width: "10%", textAlign: "center" }}>Serial No.</th>
                                        <th style={{ width: "50%" }}>Particulars / Purpose Head</th>
                                        <th style={{ width: "20%" }}>Flow &amp; Type</th>
                                        <th style={{ width: "20%", textAlign: "right" }}>Amount (Rs.)</th>
                                    </tr>

                                    {/* Line Item */}
                                    <tr>
                                        <td style={{ textAlign: "center" }}>1</td>
                                        <td>
                                            <div style={{ fontWeight: "bold" }}>
                                                {selectedTx.transactionType === "UserValuation" && "Citizen Fair Device Valuation Payout"}
                                                {selectedTx.transactionType === "CollectionFee" && "Doorstep Collection & Transit Logistics Service"}
                                                {selectedTx.transactionType === "InspectionFee" && "Technical Diagnostics, Testing & Safety Isolation"}
                                                {selectedTx.transactionType === "ProcessingFee" && "Refurbishment Parts & Repair Operation Expense"}
                                                {selectedTx.transactionType === "CenterDeviceSettlement" && "Refurbishment Center Device Buyout Settlement"}
                                                {selectedTx.transactionType === "RecyclingFee" && "Material Recovery & Processing Operation Settlement"}
                                                {!["UserValuation", "CollectionFee", "InspectionFee", "ProcessingFee", "CenterDeviceSettlement", "RecyclingFee"].includes(selectedTx.transactionType) && (selectedTx.transactionType || "Escrow Payout Disbursal")}
                                            </div>
                                            <div style={{ fontSize: "11px", color: "#333", marginTop: "2px" }}>
                                                {selectedTx.description || "Audited transaction cleared and recorded on EcoCycle Escrow Ledger."}
                                            </div>
                                        </td>
                                        <td>
                                            <div>{selectedTx.transactionType}</div>
                                            <div style={{ fontSize: "11px", color: "#333" }}>{selectedTx.direction}</div>
                                        </td>
                                        <td style={{ textAlign: "right", fontWeight: "bold" }}>
                                            {formatINR(selectedTx.amount)}
                                        </td>
                                    </tr>

                                    {/* Financial Totals & Status */}
                                    <tr>
                                        <td className="lbl-cell" style={{ fontWeight: "bold" }}>TOTAL AMOUNT / PM:</td>
                                        <td className="val-cell" style={{ fontWeight: "bold", fontSize: "14px" }}>
                                            Rs. {formatINR(selectedTx.amount)}
                                        </td>
                                        <td className="lbl-cell" style={{ fontWeight: "bold" }}>PAYMENT STATUS:</td>
                                        <td className="val-cell" style={{ fontWeight: "bold" }}>
                                            {selectedTx.status === "Pending" ? "ESCROW HELD" : "PAID / SETTLED"}
                                        </td>
                                    </tr>

                                    <tr>
                                        <td className="lbl-cell" style={{ fontWeight: "bold" }}>AMOUNT IN WORDS:</td>
                                        <td colSpan="3" className="val-cell" style={{ fontStyle: "italic", fontWeight: "bold" }}>
                                            {numToWords(selectedTx.amount)}
                                        </td>
                                    </tr>

                                    <tr>
                                        <td className="lbl-cell">GATEWAY / UTR REF:</td>
                                        <td colSpan="3" className="val-cell" style={{ fontFamily: "monospace", fontSize: "12px" }}>
                                            {selectedTx.razorpayPaymentId || `POUT_ECO_${selectedTx.id}_${Date.now()}`}
                                        </td>
                                    </tr>

                                    <tr>
                                        <td className="lbl-cell">BATCH RECONCILIATION:</td>
                                        <td colSpan="3" className="val-cell" style={{ fontFamily: "monospace", fontSize: "12px" }}>
                                            {selectedTx.razorpayOrderId || `BATCH_${selectedTx.deviceId || selectedTx.rawId || 'MAIN'}_SETTLED`}
                                        </td>
                                    </tr>

                                    <tr>
                                        <td className="lbl-cell">AUTHENTICATION:</td>
                                        <td colSpan="3" className="val-cell" style={{ fontSize: "11px" }}>
                                            256-Bit SHA-256 System Generated Document • No Physical Signature Required
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Modal Action Controls */}
                        <div className="classic-slip-actions no-print">
                            <button className="classic-btn classic-btn-print" onClick={() => window.print()}>
                                Print Slip
                            </button>
                            <button className="classic-btn classic-btn-close" onClick={() => setShowVoucherModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Number to Words Converter for INR Currency
function numToWords(num) {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n) => {
        if (n === 0) return '';
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
        if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
        if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
        return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
    };

    const val = Math.round(Number(num) || 0);
    if (val === 0) return 'Zero Rupees Only';
    return inWords(val).trim() + ' Rupees Only';
}

export default ManageTransactions;
