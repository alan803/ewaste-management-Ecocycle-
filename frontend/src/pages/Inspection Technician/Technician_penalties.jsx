import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import TechSidebar from "./Sidebar";
import {
    FiAlertTriangle,
    FiCheckCircle,
    FiClock,
    FiShield,
    FiRefreshCw,
    FiSearch,
    FiGrid,
    FiList,
    FiSlash,
    FiCreditCard,
    FiSmartphone,
    FiBell,
    FiCheckSquare,
    FiX,
    FiCalendar
} from "react-icons/fi";
import "./Device_inspection.css";
import "./Inspection_report.css";
import "./Technician_penalties.css";

function TechnicianPenalties() {
    const [penalties, setPenalties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [viewMode, setViewMode] = useState("grid");
    const [payingId, setPayingId] = useState(null);
    const [paymentSuccessMsg, setPaymentSuccessMsg] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);

    // Technician info state
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
    const navigate = useNavigate();

    useEffect(() => {
        fetchMyPenalties();
        fetchNotifications();
        fetchProfileInfo();
    }, []);

    const fetchProfileInfo = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await axios.get("https://ecocycle.runasp.net/api/Technician/myprofile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data || {};
            const name = `${data.firstName || data.FirstName || ""} ${data.lastName || data.LastName || ""}`.trim();
            const photo = data.photo || data.Photo || data.profilePhoto || data.photoPath;
            if (name) setTechName(name);
            if (photo) setProfilePhoto(photo);
        } catch (e) { }
    };

    const fetchNotifications = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await axios.get("https://ecocycle.runasp.net/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const list = Array.isArray(res.data) ? res.data : [];
            const unread = list.filter((n) => !n.isRead).length;
            setUnreadCount(unread);
        } catch (e) { }
    };

    const fetchMyPenalties = async (isManualRefresh = false) => {
        if (isManualRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.get("https://ecocycle.runasp.net/api/TechnicianPenaltyPayment/my-penalties", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = Array.isArray(response.data) ? response.data : (response.data.$values || []);
            setPenalties(data);
        } catch (err) {
            console.error("Error fetching technician penalties:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handlePayPenalty = async (item) => {
        if (!item || !item.technicianPenaltyId) return;
        setPayingId(item.technicianPenaltyId);
        setPaymentSuccessMsg("");

        try {
            const token = localStorage.getItem("token");
            // 1. Create Razorpay payment order on backend
            const res = await axios.post(
                `https://ecocycle.runasp.net/api/TechnicianPenaltyPayment/create-order/${item.technicianPenaltyId}`,
                {},
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );

            const data = res.data;

            // 2. Configure Razorpay Checkout
            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency || "INR",
                name: "EcoCycle",
                description: data.description || `Technician Penalty #PEN-${item.technicianPenaltyId}`,
                order_id: data.orderId,
                handler: async function (response) {
                    try {
                        setPayingId(item.technicianPenaltyId);
                        // 3. Verify Razorpay payment signature on backend
                        const verifyRes = await axios.post(
                            "https://ecocycle.runasp.net/api/TechnicianPenaltyPayment/verify",
                            {
                                paymentId: data.paymentId,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpaySignature: response.razorpay_signature
                            }
                        );

                        setPaymentSuccessMsg(
                            verifyRes.data?.message || `Fine #PEN-${item.technicianPenaltyId} paid successfully! Account compliance restored.`
                        );
                        // Refresh penalties state
                        fetchMyPenalties(true);
                    } catch (verifyErr) {
                        console.error("Payment verification error:", verifyErr);
                        alert(
                            verifyErr.response?.data?.message || "Payment verification failed. Please contact EcoCycle support."
                        );
                    } finally {
                        setPayingId(null);
                    }
                },
                theme: {
                    color: "#10b981"
                },
                modal: {
                    ondismiss: function () {
                        setPayingId(null);
                    }
                }
            };

            if (!window.Razorpay) {
                alert("Razorpay SDK failed to load. Please refresh the page and try again.");
                setPayingId(null);
                return;
            }

            const razorpayInstance = new window.Razorpay(options);
            razorpayInstance.open();
        } catch (err) {
            console.error("Error creating payment order:", err);
            alert(
                err.response?.data?.message || err.response?.data || "Failed to initialize Razorpay checkout. Please try again."
            );
            setPayingId(null);
        }
    };

    // Calculate metrics
    const totalCount = penalties.length;
    const pendingPenalties = penalties.filter(p => String(p.status).toLowerCase() === "pending" || String(p.status).toLowerCase() === "unpaid");
    const paidPenalties = penalties.filter(p => String(p.status).toLowerCase() === "paid");
    const cancelledPenalties = penalties.filter(p => {
        const s = String(p.status).toLowerCase();
        return s === "cancelled" || s === "waived";
    });

    const pendingAmount = pendingPenalties.reduce((sum, p) => sum + (Number(p.penaltyAmount) || 0), 0);
    const paidAmount = paidPenalties.reduce((sum, p) => sum + (Number(p.penaltyAmount) || 0), 0);

    // Filtering logic
    const filteredPenalties = penalties.filter(item => {
        const statusLower = String(item.status).toLowerCase();

        if (activeTab === "pending" && (statusLower !== "pending" && statusLower !== "unpaid")) return false;
        if (activeTab === "paid" && statusLower !== "paid") return false;
        if (activeTab === "waived" && statusLower !== "cancelled" && statusLower !== "waived") return false;

        if (!searchQuery.trim()) return true;

        const q = searchQuery.toLowerCase();
        const penIdStr = `#PEN-${item.technicianPenaltyId}`.toLowerCase();
        const devIdStr = `#DEV-${String(item.deviceId).padStart(3, "0")}`.toLowerCase();
        const deviceTitle = String(item.deviceTitle || "").toLowerCase();
        const reasonStr = String(item.reason || "").toLowerCase();

        return penIdStr.includes(q) || devIdStr.includes(q) || deviceTitle.includes(q) || reasonStr.includes(q);
    });

    // Formatting helper
    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const getMediaUrl = (photoPath, defaultFolder = "uploads/technicians/ProfilePhotos") => {
        if (!photoPath) return null;
        if (photoPath.startsWith("data:") || photoPath.startsWith("blob:") || photoPath.startsWith("http://") || photoPath.startsWith("https://")) return photoPath;
        const clean = photoPath.replace(/\\/g, "/").replace(/^\/+/, "");
        if (clean.includes("/")) return `https://ecocycle.runasp.net/${clean}`;
        return `https://ecocycle.runasp.net/${defaultFolder}/${clean}`;
    };

    const getStatusBadge = (statusStr) => {
        const s = String(statusStr || "Pending").toLowerCase();
        if (s === "paid") {
            return (
                <span className="inspected-status-badge" style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", padding: "0.25rem 0.65rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <FiCheckCircle /> Fine Paid
                </span>
            );
        }
        if (s === "cancelled" || s === "waived") {
            return (
                <span className="inspected-status-badge" style={{ background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", padding: "0.25rem 0.65rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <FiSlash /> Fine Waived
                </span>
            );
        }
        return (
            <span className="inspected-status-badge" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "0.25rem 0.65rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                <FiClock /> Fee Pending
            </span>
        );
    };

    return (
        <div className="device-inspection-container">
            <TechSidebar />

            <main className="inspection-main-content">
                {/* Ambient Background Glows */}
                <div className="ambient-glow ambient-glow--1"></div>
                <div className="ambient-glow ambient-glow--2"></div>

                {/* Top Header Bar EXACT SAME design as Inspection_report.jsx */}
                <div className="tech-header-bar">
                    <div className="tech-header-actions">
                        {/* Search Input */}
                        <div className="search-box-v2" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            <FiSearch className="search-icon" style={{ position: "absolute", left: "0.85rem", color: "#94a3b8", fontSize: "0.95rem" }} />
                            <input
                                type="text"
                                placeholder="Search penalty ID, device, reason..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
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

                        <button className="tech-refresh-btn" onClick={() => fetchMyPenalties(true)}>
                            <FiRefreshCw className={refreshing ? "spin-icon" : ""} /> Refresh
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
                        </div>

                        {/* Technician Avatar */}
                        <div className="tech-user-avatar" title={techName}>
                            {profilePhoto ? (
                                <img
                                    src={getMediaUrl(profilePhoto)}
                                    alt={techName}
                                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        setProfilePhoto(null);
                                    }}
                                />
                            ) : (
                                userInitial
                            )}
                        </div>
                    </div>
                </div>

                {/* KPI Summary Cards Grid EXACT SAME design as Inspection_report.jsx */}
                <div className="tech-kpi-grid">
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon all"><FiAlertTriangle /></div>
                        <div className="tech-kpi-info">
                            <h3>{loading ? "..." : `₹${pendingAmount}`}</h3>
                            <p>Pending Fine Amount</p>
                        </div>
                    </div>
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon delivered"><FiCheckCircle /></div>
                        <div className="tech-kpi-info">
                            <h3>{loading ? "..." : `₹${paidAmount}`}</h3>
                            <p>Resolved / Paid Fines</p>
                        </div>
                    </div>
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon transit"><FiSlash /></div>
                        <div className="tech-kpi-info">
                            <h3>{loading ? "..." : cancelledPenalties.length}</h3>
                            <p>Waived / Cancelled</p>
                        </div>
                    </div>
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon weight"><FiShield /></div>
                        <div className="tech-kpi-info">
                            <h3>{loading ? "..." : totalCount}</h3>
                            <p>Total Compliance Notices</p>
                        </div>
                    </div>
                </div>

                {/* Control Bar Panel EXACT SAME design as Inspection_report.jsx */}
                <div className="control-bar-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.2rem", color: "#0f172a" }}>
                            System User Penalty & Compliance Queue
                        </h3>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                            Overview of issued fines, enforcement policy reasons, and resolution status
                        </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap", marginLeft: "auto" }}>
                        <div className="filter-pills">
                            <button
                                className={`pill-btn ${activeTab === "all" ? "active" : ""}`}
                                onClick={() => setActiveTab("all")}
                            >
                                All ({totalCount})
                            </button>
                            <button
                                className={`pill-btn ${activeTab === "pending" ? "active" : ""}`}
                                onClick={() => setActiveTab("pending")}
                            >
                                Pending ({pendingPenalties.length})
                            </button>
                            <button
                                className={`pill-btn ${activeTab === "paid" ? "active" : ""}`}
                                onClick={() => setActiveTab("paid")}
                            >
                                Paid / Resolved ({paidPenalties.length})
                            </button>
                            <button
                                className={`pill-btn ${activeTab === "waived" ? "active" : ""}`}
                                onClick={() => setActiveTab("waived")}
                            >
                                Waived / Cancelled ({cancelledPenalties.length})
                            </button>
                        </div>

                        <div className="view-toggle">
                            <button
                                className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                                onClick={() => setViewMode("grid")}
                                title="Grid View"
                            >
                                <FiGrid />
                            </button>
                            <button
                                className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
                                onClick={() => setViewMode("table")}
                                title="Table View"
                            >
                                <FiList />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Success Toast Banner */}
                {paymentSuccessMsg && (
                    <div className="payment-success-banner">
                        <FiCheckCircle className="banner-success-icon" />
                        <div>
                            <h4>Payment Verified Successfully!</h4>
                            <p>{paymentSuccessMsg}</p>
                        </div>
                        <button className="close-banner-btn" onClick={() => setPaymentSuccessMsg("")}>
                            <FiX />
                        </button>
                    </div>
                )}

                {/* Content Display: Grid Mode vs Table Mode */}
                {loading ? (
                    <div className="tech-loading-card">
                        <FiRefreshCw className="spin-icon" style={{ fontSize: "2.5rem", color: "#10b981" }} />
                        <h3>Loading Penalty & Compliance Records...</h3>
                        <p>Fetching fine status, penalty amounts, and payment verification details.</p>
                    </div>
                ) : filteredPenalties.length === 0 ? (
                    <div className="tech-empty-card">
                        <FiCheckCircle style={{ fontSize: "3rem", color: "#10b981", marginBottom: "1rem" }} />
                        <h3>No Penalty Records Found</h3>
                        <p>
                            {searchQuery || activeTab !== "all"
                                ? "No penalties match your search criteria or selected filter."
                                : "Your inspection technician account is in 100% good standing with zero policy violations!"}
                        </p>
                    </div>
                ) : viewMode === "grid" ? (
                    /* Cards Grid View matching EXACT card design of Inspection_report.jsx / Device_inspection.jsx */
                    <div className="device-cards-grid">
                        {filteredPenalties.map((item) => {
                            const statusLower = String(item.status).toLowerCase();
                            const isPending = statusLower === "pending" || statusLower === "unpaid";
                            const isPaid = statusLower === "paid";

                            return (
                                <div key={item.technicianPenaltyId} className="device-card-v2">
                                    <div className="card-top-header">
                                        <span className="device-id-badge">#DEV-{String(item.deviceId).padStart(3, "0")}</span>
                                        {getStatusBadge(item.status)}
                                    </div>

                                    <div className="card-body" style={{ padding: 0 }}>
                                        <div className="device-title-group">
                                            <div className="device-icon-box" style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}>
                                                <FiSmartphone />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>{item.deviceTitle || `Device #${item.deviceId}`}</h4>
                                                <span className="cat-text">{item.categoryName || "E-Waste Hardware"}</span>
                                            </div>
                                        </div>

                                        <div className="spec-meta-grid">
                                            <div className="meta-box">
                                                <span className="meta-lbl">FINE AMOUNT</span>
                                                <span className="meta-val" style={{ color: isPending ? "#dc2626" : "#059669", fontSize: "0.95rem", fontWeight: 800 }}>₹{item.penaltyAmount}</span>
                                            </div>
                                            <div className="meta-box">
                                                <span className="meta-lbl">PENALTY REF</span>
                                                <span className="meta-val" style={{ color: "#dc2626" }}>#PEN-{item.technicianPenaltyId}</span>
                                            </div>
                                            <div className="meta-box" style={{ gridColumn: "span 2" }}>
                                                <span className="meta-lbl">VIOLATION REASON</span>
                                                <span className="meta-val" style={{ fontWeight: 600, fontSize: "0.775rem", lineHeight: 1.4, color: "#334155" }}>{item.reason}</span>
                                            </div>
                                            <div className="meta-box">
                                                <span className="meta-lbl">ISSUED DATE</span>
                                                <span className="meta-val">{formatDate(item.createdAt)}</span>
                                            </div>
                                            <div className="meta-box">
                                                <span className="meta-lbl">RESOLUTION</span>
                                                <span className="meta-val">{item.resolvedAt ? formatDate(item.resolvedAt) : "Pending Fee"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-actions-footer" style={{ marginTop: "0.5rem" }}>
                                        {isPending ? (
                                            <button
                                                className="action-btn action-btn--primary"
                                                style={{ width: "100%", justifyContent: "center", background: "#0f172a", color: "#ffffff", padding: "0.65rem 1rem", fontSize: "0.85rem", borderRadius: "8px" }}
                                                onClick={() => handlePayPenalty(item)}
                                                disabled={payingId === item.technicianPenaltyId}
                                            >
                                                {payingId === item.technicianPenaltyId ? (
                                                    <>
                                                        <FiRefreshCw className="spin-icon" />
                                                        <span>Processing Payment...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiCreditCard />
                                                        <span>Pay Fine Now (₹{item.penaltyAmount})</span>
                                                    </>
                                                )}
                                            </button>
                                        ) : isPaid ? (
                                            <div className="settled-status-bar bar-paid" style={{ width: "100%", textAlign: "center", padding: "0.5rem", borderRadius: "8px", background: "#ecfdf5", color: "#059669", fontWeight: 700, fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                                                <FiCheckCircle />
                                                <span>Fine Fully Settled & Paid</span>
                                            </div>
                                        ) : (
                                            <div className="settled-status-bar bar-waived" style={{ width: "100%", textAlign: "center", padding: "0.5rem", borderRadius: "8px", background: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                                                <FiSlash />
                                                <span>Fine Waived / Cancelled</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Table View */
                    <div className="glass-table-wrapper">
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>Penalty ID</th>
                                    <th>Device Info</th>
                                    <th>Category</th>
                                    <th>Fine Amount</th>
                                    <th className="col-reason">Violation Reason</th>
                                    <th>Status</th>
                                    <th>Issued Date</th>
                                    <th style={{ textAlign: "right" }}>Actions / Resolution</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPenalties.map((item) => {
                                    const statusLower = String(item.status).toLowerCase();
                                    const isPending = statusLower === "pending" || statusLower === "unpaid";
                                    const isPaid = statusLower === "paid";

                                    return (
                                        <tr key={item.technicianPenaltyId}>
                                            <td>
                                                <span className="device-id-badge" style={{ background: "#fee2e2", color: "#dc2626", borderColor: "#fecaca" }}>#PEN-{item.technicianPenaltyId}</span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <span style={{ fontWeight: 800, color: "#0f172a" }}>
                                                        <FiSmartphone style={{ verticalAlign: "middle", marginRight: "4px", color: "#059669" }} />
                                                        {item.deviceTitle || `Device #${item.deviceId}`}
                                                    </span>
                                                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Device #DEV-{String(item.deviceId).padStart(3, "0")}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="cat-text" style={{ background: "#e0f2fe", color: "#0284c7", padding: "0.15rem 0.5rem", borderRadius: "4px", border: "1px solid #bae6fd", fontWeight: 700 }}>{item.categoryName || "E-Waste"}</span>
                                            </td>
                                            <td>
                                                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: isPending ? "#dc2626" : "#059669" }}>₹{item.penaltyAmount}</span>
                                            </td>
                                            <td className="col-reason">
                                                <span className="table-reason-text">{item.reason}</span>
                                            </td>
                                            <td>{getStatusBadge(item.status)}</td>
                                            <td>
                                                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
                                                    {formatDate(item.createdAt)}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                {isPending ? (
                                                    <button
                                                        className="action-btn action-btn--primary"
                                                        style={{ background: "#0f172a", color: "#ffffff", padding: "0.4rem 0.85rem", borderRadius: "6px", fontSize: "0.775rem" }}
                                                        onClick={() => handlePayPenalty(item)}
                                                        disabled={payingId === item.technicianPenaltyId}
                                                    >
                                                        {payingId === item.technicianPenaltyId ? (
                                                            <FiRefreshCw className="spin-icon" />
                                                        ) : (
                                                            <FiCreditCard />
                                                        )}
                                                        <span>Pay Fine</span>
                                                    </button>
                                                ) : isPaid ? (
                                                    <span style={{ fontSize: "0.775rem", color: "#059669", fontWeight: 700 }}>
                                                        Paid on {formatDate(item.resolvedAt)}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: "0.775rem", color: "#475569", fontWeight: 700 }}>
                                                        Waived / Cancelled
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}

export default TechnicianPenalties;
