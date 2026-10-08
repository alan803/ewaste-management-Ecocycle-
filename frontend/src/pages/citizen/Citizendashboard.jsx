import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiTruck,
    FiPhone,
    FiCheck,
    FiAward,
    FiZap,
    FiRefreshCw,
    FiPlusCircle,
    FiClock,
    FiUser,
    FiEye,
    FiBell,
    FiArrowUpRight,
    FiCalendar,
    FiCheckCircle,
    FiAlertCircle,
    FiActivity,
    FiCpu,
    FiSmartphone,
    FiBatteryCharging,
    FiTv,
    FiShield,
    FiSearch,
    FiChevronDown,
    FiBox,
    FiMapPin,
    FiFileText,
    FiCreditCard,
    FiLock,
    FiSave,
    FiX
} from "react-icons/fi";
import {
    validate_accountHolder,
    validate_bankName,
    validate_accountNumber,
    validate_ifscCode
} from "../../utils/validation";
import "./Citizendashboard.css";
import "./Pickupdetails.css";

function CitizenDashboard() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [inspectionRequests, setInspectionRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [selectedPickupDetails, setSelectedPickupDetails] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showOverdueBanner, setShowOverdueBanner] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    // Bank Details Prompt State (Mandatory & Non-Dismissible)
    const [showBankModal, setShowBankModal] = useState(false);
    const [bankForm, setBankForm] = useState({
        accountHolder: "",
        bankName: "",
        accountNumber: "",
        confirmAccountNumber: "",
        ifscCode: ""
    });
    const [bankErrors, setBankErrors] = useState({});
    const [bankSaving, setBankSaving] = useState(false);
    const [bankErrorMsg, setBankErrorMsg] = useState("");
    const [showBankBanner, setShowBankBanner] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found in localStorage, redirecting to login.");
            navigate("/");
            return;
        }
        fetchProfile(token);
        fetchMyPickupRequests(token);
        fetchNotifications(token);
    }, [navigate]);

    const fetchNotifications = async (token) => {
        const authToken = token || localStorage.getItem("token");
        if (!authToken) return;
        try {
            const response = await axios.get("https://localhost:7102/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setNotifications(response.data || []);
        } catch (err) {
            console.error("Error fetching citizen notifications:", err);
        }
    };

    const fetchProfile = async (token) => {
        try {
            const response = await axios.get("https://localhost:7102/api/User/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data || {};
            setProfile(data);

            const img = data.profilePicture || data.profileImage;
            if (img) {
                if (img.startsWith("http") || img.startsWith("data:")) {
                    setProfileImage(img);
                } else {
                    setProfileImage(`https://localhost:7102/uploads/profile/${img}`);
                }
            } else {
                const savedImage = localStorage.getItem("citizen_profile_image");
                if (savedImage) setProfileImage(savedImage);
            }

            // Check if Bank Details are missing
            const holder = (data.accountHolder || data.AccountHolder || "").trim();
            const bank = (data.bankName || data.BankName || "").trim();
            const num = (data.accountNumber || data.AccountNumber || "").trim();
            const ifsc = (data.ifscCode || data.IFSCCode || "").trim();

            const isMissingBank = !holder || !bank || !num || !ifsc;
            if (isMissingBank) {
                setShowBankModal(true);
                const defaultHolder = holder || (data.firstName ? `${data.firstName} ${data.lastName || ""}`.trim() : "");
                setBankForm(prev => ({
                    ...prev,
                    accountHolder: defaultHolder,
                    bankName: bank,
                    accountNumber: num,
                    confirmAccountNumber: num,
                    ifscCode: ifsc
                }));
            } else {
                setShowBankModal(false);
                setBankForm({
                    accountHolder: holder,
                    bankName: bank,
                    accountNumber: num,
                    confirmAccountNumber: num,
                    ifscCode: ifsc
                });
            }
        } catch (err) {
            console.error("Dashboard profile fetch error:", err);
        }
    };

    const handleBankInputChange = (field, value) => {
        let finalValue = value;
        if (field === "ifscCode") {
            finalValue = value.toUpperCase();
        }

        setBankForm(prev => ({
            ...prev,
            [field]: finalValue
        }));

        let err = "";
        if (field === "accountHolder") {
            err = validate_accountHolder(finalValue);
        } else if (field === "bankName") {
            err = validate_bankName(finalValue);
        } else if (field === "accountNumber") {
            err = validate_accountNumber(finalValue);
            if (bankForm.confirmAccountNumber && finalValue !== bankForm.confirmAccountNumber) {
                setBankErrors(prev => ({ ...prev, confirmAccountNumber: "Account numbers do not match" }));
            } else if (bankForm.confirmAccountNumber && finalValue === bankForm.confirmAccountNumber) {
                setBankErrors(prev => ({ ...prev, confirmAccountNumber: "" }));
            }
        } else if (field === "confirmAccountNumber") {
            if (!finalValue) {
                err = "Please confirm your account number";
            } else if (finalValue !== bankForm.accountNumber) {
                err = "Account numbers do not match";
            }
        } else if (field === "ifscCode") {
            err = validate_ifscCode(finalValue);
        }

        setBankErrors(prev => ({
            ...prev,
            [field]: err
        }));
        setBankErrorMsg("");
    };

    const handleSaveBankDetails = async (e) => {
        e?.preventDefault();
        const holderErr = validate_accountHolder(bankForm.accountHolder);
        const bankErr = validate_bankName(bankForm.bankName);
        const numErr = validate_accountNumber(bankForm.accountNumber);
        const confirmErr = !bankForm.confirmAccountNumber 
            ? "Please confirm your account number" 
            : (bankForm.confirmAccountNumber !== bankForm.accountNumber ? "Account numbers do not match" : "");
        const ifscErr = validate_ifscCode(bankForm.ifscCode);

        const errs = {
            accountHolder: holderErr,
            bankName: bankErr,
            accountNumber: numErr,
            confirmAccountNumber: confirmErr,
            ifscCode: ifscErr
        };

        setBankErrors(errs);
        if (Object.values(errs).some(err => err !== "")) {
            setBankErrorMsg("Please fix all errors highlighted below before proceeding.");
            return;
        }

        try {
            setBankSaving(true);
            setBankErrorMsg("");
            const token = localStorage.getItem("token");

            const payload = {
                accountHolder: bankForm.accountHolder.trim(),
                bankName: bankForm.bankName.trim(),
                accountNumber: bankForm.accountNumber.trim(),
                ifscCode: bankForm.ifscCode.trim().toUpperCase()
            };

            await axios.post("https://localhost:7102/api/User/bank-details", payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            setProfile(prev => ({
                ...prev,
                accountHolder: payload.accountHolder,
                bankName: payload.bankName,
                accountNumber: payload.accountNumber,
                ifscCode: payload.ifscCode
            }));

            setShowBankModal(false);
        } catch (err) {
            console.error("Error saving bank details:", err);
            const msg = err.response?.data?.message || (typeof err.response?.data === "string" ? err.response.data : "Failed to save bank details. Please check your network or try again.");
            setBankErrorMsg(msg);
        } finally {
            setBankSaving(false);
        }
    };

    const fetchMyPickupRequests = async (token) => {
        try {
            setLoadingRequests(true);
            const response = await axios.get("https://localhost:7102/api/Inspection/my-pickup-requests", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInspectionRequests(response.data || []);
        } catch (err) {
            console.error("Error fetching inspection requests:", err);
        } finally {
            setLoadingRequests(false);
        }
    };

    const userName = profile?.firstName 
        ? `${profile.firstName} ${profile.lastName || ""}`.trim()
        : localStorage.getItem("firstName") ||
          localStorage.getItem("userName") ||
          localStorage.getItem("username") ||
          localStorage.getItem("name") ||
          "Citizen Champion";

    const acceptedDeliveryRequests = inspectionRequests;

    const completedCount = acceptedDeliveryRequests.filter(r => {
        const s = String(r.requestStatus || r.status || "").toLowerCase();
        const c = String(r.collectionAssignmentStatus || "").toLowerCase();
        return s === "completed" || c === "completed" || c === "delivered";
    }).length;

    const totalRecycledWeight = acceptedDeliveryRequests
        .reduce((sum, r) => sum + ((Number(r.weight) || 0) * (Number(r.quantity) || 1)), 0);

    const capitalizeWords = (str) => {
        if (!str) return "";
        return str
            .toLowerCase()
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const getStatusBadge = (status) => {
        const s = String(status || "").toLowerCase().replace(/\s+/g, "");
        if (s === "completed") {
            return <span className="status-pill status-completed">Completed</span>;
        } else if (s === "assigned" || s === "inspectorassigned") {
            return <span className="status-pill status-assigned">Inspector Assigned</span>;
        } else if (s === "accepted" || s === "ininspection" || s === "inprogress") {
            return <span className="status-pill status-progress">In Inspection</span>;
        } else if (s === "rejected" || s === "cancelled") {
            return <span className="status-pill status-cancelled">Rejected</span>;
        } else if (s === "expired" || s === "inspectionexpired") {
            return <span className="status-pill status-cancelled">Expired</span>;
        } else {
            return <span className="status-pill status-scheduled">Scheduled</span>;
        }
    };

        const isDeviceCollectedFromUser = (req) => {
        if (!req) return false;
        const cas = String(req.collectionAssignmentStatus || req.assignmentStatus || req.status || "").toLowerCase();
        const lcs = String(req.lifecycleStatus || "").toLowerCase();
        return (
            req.pickedUpAt != null ||
            ["completed", "pickedup", "outfordelivery", "intransit", "awaitingtechnicianapproval", "delivered", "deliveredtocenter"].includes(cas) ||
            ["pickedup", "collected", "intransit", "handoverpendingverification", "atinspectioncenter", "delivered"].includes(lcs)
        );
    };

    const isPickupCancelled = (req) => {
        if (!req) return false;
        const s = String(req.requestStatus || req.status || req.assignmentStatus || "").toLowerCase();
        const cas = String(req.collectionAssignmentStatus || "").toLowerCase();
        return s === "cancelled" || s === "rejected" || cas === "cancelled" || cas === "rejected";
    };

    const getAgentPhoto = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith("http") || photoPath.startsWith("data:")) return photoPath;
        return `https://localhost:7102/uploads/profile/${photoPath}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const overdueRequests = inspectionRequests.filter(req => {
        if (!req.pickupDate) return false;
        const pDate = new Date(req.pickupDate);
        pDate.setHours(0, 0, 0, 0);
        const isPast = pDate < todayStart;
        const statusLower = String(req.requestStatus || req.status || "").toLowerCase();
        const colStatusLower = String(req.collectionAssignmentStatus || "").toLowerCase();
        const isDone = 
            statusLower === "completed" || 
            statusLower === "rejected" || 
            statusLower === "cancelled" ||
            colStatusLower === "completed" ||
            colStatusLower === "delivered";
        
        if (!isPast || isDone) return false;

        const matchingNotif = notifications.find(n => {
            const titleLower = (n.title || "").toLowerCase();
            const msgLower = (n.message || "").toLowerCase();
            const isOverdue = titleLower.includes("overdue") || msgLower.includes("overdue");
            if (!isOverdue) return false;
            const brandMatch = req.brand ? msgLower.includes(req.brand.toLowerCase()) : false;
            const modelMatch = req.model ? msgLower.includes(req.model.toLowerCase()) : false;
            return brandMatch || modelMatch || true;
        });

        if (matchingNotif && matchingNotif.isRead) {
            return false;
        }

        const overdueNotifs = notifications.filter(n => {
            const titleLower = (n.title || "").toLowerCase();
            const msgLower = (n.message || "").toLowerCase();
            return titleLower.includes("overdue") || msgLower.includes("overdue");
        });
        if (overdueNotifs.length > 0 && overdueNotifs.every(n => n.isRead)) {
            return false;
        }

        return true;
    });

    const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

    // Filter requests by search term & active filter
    const filteredRequests = acceptedDeliveryRequests.filter(r => {
        const matchesSearch = 
            (r.brand && r.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (r.model && r.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (r.categoryName && r.categoryName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (r.address && r.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (String(r.deviceId).includes(searchTerm));

        if (!matchesSearch) return false;

        if (filterStatus === "active") {
            const s = String(r.requestStatus || "").toLowerCase();
            return s !== "completed" && s !== "rejected" && s !== "cancelled";
        } else if (filterStatus === "completed") {
            const s = String(r.requestStatus || "").toLowerCase();
            return s === "completed";
        }
        return true;
    });

    return (
        <div className="citizen-dashboard-layout">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="citizen-main-content">

{/* Bank Account Missing Notice Banner */}
                {profile && (!profile.accountHolder?.trim() || !profile.bankName?.trim() || !profile.accountNumber?.trim() || !profile.ifscCode?.trim()) && showBankBanner && (
                    <div className="citizen-bank-alert-banner">
                        <div className="bank-banner-left">
                            <div className="bank-banner-icon">
                                <FiCreditCard />
                            </div>
                            <div className="bank-banner-text">
                                <h4>Bank Account Required for Recycling Rewards</h4>
                                <p>
                                    Please link your bank account to receive direct payouts, green points, and cashbacks for your submitted e-waste.
                                </p>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                            <button
                                type="button"
                                className="bank-banner-action-btn"
                                onClick={() => setShowBankModal(true)}
                            >
                                <FiPlusCircle /> Add Bank Details
                            </button>
                            <button
                                type="button"
                                className="overdue-alert-close"
                                onClick={() => setShowBankBanner(false)}
                                title="Dismiss banner"
                            >
                                <FiX />
                            </button>
                        </div>
                    </div>
                )}

                {/* Overdue Pickup Alert Banner */}
                {showOverdueBanner && overdueRequests.length > 0 && (
                    <div className="citizen-overdue-alert-banner">
                        <div className="overdue-banner-left">
                            <div className="overdue-alert-icon">
                                <FiAlertCircle />
                            </div>
                            <div>
                                <h4>Overdue Pickup Alert ({overdueRequests.length})</h4>
                                <p>
                                    The scheduled pickup date has passed for:{" "}
                                    <strong>
                                        {overdueRequests.map(r => `${r.brand} ${r.model} (Due: ${formatDate(r.pickupDate)})`).join(", ")}
                                    </strong>
                                    . Please check your pickup details below.
                                </p>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                            <button 
                                type="button" 
                                className="overdue-view-btn"
                                onClick={() => navigate("/technician-notification")}
                            >
                                View Notifications
                            </button>
                            <button type="button" className="overdue-alert-close" onClick={() => setShowOverdueBanner(false)}>
                                <FiX />
                            </button>
                        </div>
                    </div>
                )}

                {/* Hero Welcome & Eco Action Banner */}
                <div className="citizen-hero-card">
                    <div className="citizen-hero-main">
                        <div className="citizen-hero-badge">
                            <FiShield /> EcoCycle Circular Portal • Zero-Landfill Verified
                        </div>
                        <h1 className="citizen-hero-title">
                            Welcome back, {userName}! 
                        </h1>
                        <p className="citizen-hero-sub">
                            Turn your redundant electronics into certified green recovery. Track live pickup dispatches, monitor verified circular processing, and claim your eco rewards.
                        </p>

                        <div className="citizen-hero-metrics">
                            <div className="hero-metric-item">
                                <FiTruck className="hero-metric-icon" />
                                <div className="hero-metric-text">
                                    <span className="hero-metric-val">{acceptedDeliveryRequests.length}</span>
                                    <span className="hero-metric-lbl">Total Pickups</span>
                                </div>
                            </div>
                            <div className="hero-metric-item">
                                <FiAward className="hero-metric-icon" style={{ color: "#7c3aed" }} />
                                <div className="hero-metric-text">
                                    <span className="hero-metric-val">{completedCount}</span>
                                    <span className="hero-metric-lbl">Certified Assets</span>
                                </div>
                            </div>
                            <div className="hero-metric-item">
                                <FiActivity className="hero-metric-icon" style={{ color: "#0284c7" }} />
                                <div className="hero-metric-text">
                                    <span className="hero-metric-val">{totalRecycledWeight.toFixed(1)} kg</span>
                                    <span className="hero-metric-lbl">E-Waste Recovered</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="citizen-hero-actions">
                        <Link to="/add-device" className="btn-hero-primary">
                            <FiPlusCircle /> Schedule E-Waste Pickup
                        </Link>
                        <div className="btn-hero-secondary-group">
                            <Link to="/view-device" className="btn-hero-secondary">
                                <FiBox /> View Devices
                            </Link>
                            <Link to="/citizen/certificates" className="btn-hero-secondary">
                                <FiAward /> Certificates
                            </Link>
                        </div>
                    </div>
                </div>

                {/* E-Waste Category Quick Select */}
                <div className="category-panel-card">
                    <div className="panel-header">
                        <div>
                            <h2 className="panel-title">Recycle E-Waste By Category</h2>
                            <p className="panel-subtitle">Select an electronic device category to schedule an instant doorstep pickup</p>
                        </div>
                        <Link to="/add-device" className="panel-action-link">
                            All Categories <FiArrowUpRight />
                        </Link>
                    </div>

                    <div className="category-cards-grid">
                        <Link to="/add-device" className="category-card">
                            <div className="cat-icon-badge emerald">
                                <FiCpu />
                            </div>
                            <div className="cat-info">
                                <h3>Computers & Laptops</h3>
                                <p>Desktops, Laptops, Monitors & Server Racks</p>
                                <span className="cat-points-tag">+100 pts / unit</span>
                            </div>
                        </Link>

                        <Link to="/add-device" className="category-card">
                            <div className="cat-icon-badge purple">
                                <FiSmartphone />
                            </div>
                            <div className="cat-info">
                                <h3>Smartphones & Tablets</h3>
                                <p>Phones, iPads, Smartwatches & Accessories</p>
                                <span className="cat-points-tag">+50 pts / unit</span>
                            </div>
                        </Link>

                        <Link to="/add-device" className="category-card">
                            <div className="cat-icon-badge blue">
                                <FiBatteryCharging />
                            </div>
                            <div className="cat-info">
                                <h3>Power & Batteries</h3>
                                <p>Li-Ion Packs, Inverters, UPS & Chargers</p>
                                <span className="cat-points-tag">+30 pts / kg</span>
                            </div>
                        </Link>

                        <Link to="/add-device" className="category-card">
                            <div className="cat-icon-badge amber">
                                <FiTv />
                            </div>
                            <div className="cat-info">
                                <h3>Home Electronics</h3>
                                <p>TVs, Audio Gear, Microwaves & Printers</p>
                                <span className="cat-points-tag">+120 pts / unit</span>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Main 2-Column Dashboard Grid */}
                <div className="vd-dashboard-grid">
                    {/* Left Column: Scheduled Pickup Requests Table */}
                    <div className="vd-table-column">
                        <div className="panel-card">
                            <div className="panel-header" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
                                <div>
                                    <h2 className="panel-title">Scheduled Pickup Requests</h2>
                                    <p className="panel-subtitle">Real-time status of your doorstep inspection and pickup dispatches</p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <FiSearch style={{ position: "absolute", left: "0.75rem", color: "#94a3b8", fontSize: "0.85rem" }} />
                                        <input
                                            type="text"
                                            placeholder="Search pickups..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{
                                                padding: "0.45rem 0.75rem 0.45rem 2rem",
                                                border: "1px solid #e2e8f0",
                                                borderRadius: "8px",
                                                fontSize: "0.8rem",
                                                outline: "none",
                                                width: "180px",
                                                color: "#0f172a"
                                            }}
                                        />
                                    </div>
                                    <Link to="/view-device" className="panel-action-link">
                                        View All <FiArrowUpRight />
                                    </Link>
                                </div>
                            </div>

                            <div className="glass-table-wrapper">
                                {loadingRequests ? (
                                    <div style={{ padding: "2.5rem", textAlign: "center", color: "#64748b" }}>
                                        <FiRefreshCw className="spin-icon" style={{ fontSize: "1.5rem", color: "#059669", marginBottom: "0.5rem" }} />
                                        <p style={{ margin: 0, fontWeight: 600 }}>Loading your pickup requests...</p>
                                    </div>
                                ) : filteredRequests.length === 0 ? (
                                    <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "#64748b" }}>
                                        <FiBox style={{ fontSize: "2.2rem", color: "#cbd5e1", marginBottom: "0.5rem" }} />
                                        <p style={{ margin: 0, fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>No pickup requests found</p>
                                        <p style={{ margin: "0.25rem 0 1.25rem", fontSize: "0.825rem", color: "#64748b" }}>Schedule your first e-waste pickup to get started with zero-landfill disposal.</p>
                                        <Link to="/add-device" className="btn-hero-primary" style={{ display: "inline-flex" }}>
                                            <FiPlusCircle /> Schedule Doorstep Pickup
                                        </Link>
                                    </div>
                                ) : (
                                    <table className="glass-table">
                                        <thead>
                                            <tr>
                                                <th>Request Tag</th>
                                                <th>Device & Model</th>
                                                <th>Scheduled Slot</th>
                                                <th>Pickup Location</th>
                                                <th>Inspector</th>
                                                <th>Status</th>
                                                <th style={{ textAlign: "right" }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRequests.map((req) => (
                                                <tr key={req.deviceId} style={{ cursor: "pointer" }} onClick={() => setSelectedPickupDetails(req)}>
                                                    <td>
                                                        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#059669", fontFamily: "var(--font-mono)" }}>
                                                            #DEV-{req.deviceId}
                                                        </div>
                                                        {req.inspectionRequestId && (
                                                            <div style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 500, marginTop: "0.15rem" }}>
                                                                #INSP-{req.inspectionRequestId}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0f172a" }}>
                                                            {capitalizeWords(`${req.brand || ""} ${req.model || ""}`.trim()) || "E-Waste Item"}
                                                        </div>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>
                                                            {req.categoryName || "Device"} • {req.quantity || 1} unit(s)
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>
                                                            {formatDate(req.pickupDate)}
                                                        </div>
                                                        <div style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 600, marginTop: "0.15rem" }}>
                                                            {req.timeSlot || "Scheduled Slot"}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 500, fontSize: "0.825rem", color: "#334155", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={req.address}>
                                                            {capitalizeWords(req.address)}
                                                        </div>
                                                        {req.landmark && (
                                                            <div style={{ fontSize: "0.725rem", color: "#64748b", marginTop: "0.15rem" }}>
                                                                Near: {capitalizeWords(req.landmark)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {req.technicianName && req.technicianName !== "Not Assigned" ? (
                                                            <div>
                                                                <div style={{ fontWeight: 600, fontSize: "0.825rem", color: "#0f172a" }}>
                                                                    {capitalizeWords(req.technicianName)}
                                                                </div>
                                                                {req.technicianPhone && (
                                                                    <div style={{ fontSize: "0.725rem", color: "#0284c7", marginTop: "0.15rem", fontWeight: 500 }}>
                                                                        {req.technicianPhone}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>
                                                                Pending Assignment
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>{getStatusBadge(req.requestStatus)}</td>
                                                    <td style={{ textAlign: "right" }}>
                                                        <button 
                                                            className="table-view-btn"
                                                            style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 0.85rem", fontWeight: 700 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedPickupDetails(req);
                                                            }}
                                                            title="View device pickup & delivery details"
                                                        >
                                                            <FiTruck style={{ fontSize: "0.85rem" }} /> Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Upcoming Pickups & Standards Widget */}
                    <div className="vd-appointments-panel">
                        {/* Upcoming Pickup Slots Widget */}
                        <div className="side-widget-card">
                            <h3 className="side-widget-title">
                                <FiCalendar style={{ color: "#059669" }} /> Scheduled Pickup Slots
                            </h3>

                            <div className="vd-appt-list">
                                {acceptedDeliveryRequests.length === 0 ? (
                                    <div style={{ padding: "1.25rem 0", textAlign: "center", color: "#64748b", fontSize: "0.8rem" }}>
                                        No upcoming pickup schedules.
                                    </div>
                                ) : (
                                    acceptedDeliveryRequests.slice(0, 3).map((pick) => (
                                        <div 
                                            key={pick.deviceId} 
                                            className="vd-appt-item" 
                                            style={{ cursor: "pointer" }}
                                            onClick={() => setSelectedPickupDetails(pick)}
                                        >
                                            <div className="vd-appt-user">
                                                <div className="vd-appt-icon">
                                                    <FiTruck />
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div className="vd-appt-name">{pick.brand} {pick.model}</div>
                                                    <div className="vd-appt-loc">
                                                        {pick.address ? (pick.address.length > 20 ? pick.address.substring(0, 20) + "..." : pick.address) : "Doorstep Pickup"}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="vd-appt-time">
                                                <span className="vd-appt-day">{formatDate(pick.pickupDate)}</span>
                                                <span className="vd-appt-hour">{pick.timeSlot}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <Link to="/add-device" className="vd-see-more-btn">
                                + Book New Pickup Schedule
                            </Link>
                        </div>

                        {/* Eco Verification Standard Mini-Widget */}
                        <div className="eco-standard-card">
                            <div className="eco-standard-header">
                                <FiShield /> NIST & CPCB Standards
                            </div>
                            <p className="eco-standard-text">
                                All processed e-waste devices undergo certified data sanitization and RoHS compliant circular dismantling.
                            </p>
                            <Link to="/citizen/certificates" className="eco-cert-link">
                                View Green Certificates <FiArrowUpRight />
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Collection Delivery Details Modal (Delivery Progress Timeline) */}
            {selectedPickupDetails && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    background: "rgba(15, 23, 42, 0.6)",
                    backdropFilter: "blur(4px)",
                    zIndex: 1000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1.5rem"
                }}>
                    <div style={{
                        background: "#ffffff",
                        borderRadius: "20px",
                        width: "100%",
                        maxWidth: "600px",
                        maxHeight: "85vh",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        overflow: "hidden"
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                            color: "#ffffff",
                            padding: "1.25rem 1.5rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexShrink: 0
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{ background: "rgba(255,255,255,0.2)", padding: "0.5rem", borderRadius: "10px", display: "flex" }}>
                                    <FiTruck style={{ fontSize: "1.4rem" }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Collection Delivery Details</h3>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                                        <span style={{ fontSize: "0.75rem", opacity: 0.9 }}>{selectedPickupDetails.brand} {selectedPickupDetails.model}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedPickupDetails(null)}
                                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#ffffff", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <FiX />
                            </button>
                        </div>

                        {/* Modal Content Body */}
                        <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto" }}>
                            {/* Assigned Collection Agent Banner */}
                            {(() => {
                                const cas = String(selectedPickupDetails.collectionAssignmentStatus || selectedPickupDetails.assignmentStatus || selectedPickupDetails.status || "").toLowerCase();
                                const lcs = String(selectedPickupDetails.lifecycleStatus || "").toLowerCase();
                                const isPickupStarted = cas === "pickupstarted" || cas === "enroute" || lcs === "enroute" || lcs === "pickupstarted" || selectedPickupDetails.pickupStartedAt != null || selectedPickupDetails.startedAt != null;
                                const isAccepted = selectedPickupDetails.collectionAgentAccepted === true || ["accepted", "pickupstarted", "enroute", "completed", "pickedup", "outfordelivery", "intransit", "awaitingtechnicianapproval", "delivered", "deliveredtocenter"].includes(cas);
                                const hasAgent = Boolean(selectedPickupDetails.collectionAgentName);

                                if (isAccepted) {
                                    return (
                                        <div style={{
                                            background: "#f0fdf4",
                                            border: "1px solid #bbf7d0",
                                            borderRadius: "14px",
                                            padding: "1rem",
                                            marginBottom: "1.25rem",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                                {getAgentPhoto(selectedPickupDetails.collectionAgentPhoto) ? (
                                                    <img 
                                                        src={getAgentPhoto(selectedPickupDetails.collectionAgentPhoto)} 
                                                        alt="Agent Profile" 
                                                        style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} 
                                                    />
                                                ) : (
                                                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#059669", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.15rem" }}>
                                                        {(selectedPickupDetails.collectionAgentName || "CA").charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontSize: "0.725rem", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
                                                        {isPickupStarted && !isDeviceCollectedFromUser(selectedPickupDetails) ? "Collection Agent (En Route for Pickup)" : "Collection Agent (Accepted)"}
                                                    </div>
                                                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#065f46" }}>
                                                        {capitalizeWords(selectedPickupDetails.collectionAgentName)}
                                                    </div>
                                                    {selectedPickupDetails.vehicleNumber && (
                                                        <div style={{ fontSize: "0.775rem", color: "#047857", fontWeight: 600, marginTop: "0.1rem" }}>
                                                            Vehicle: {selectedPickupDetails.vehicleNumber} ({selectedPickupDetails.vehicleType || "Pickup Van"})
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {selectedPickupDetails.collectionAgentPhone && (
                                                <a 
                                                    href={`tel:${selectedPickupDetails.collectionAgentPhone}`}
                                                    style={{
                                                        background: "#059669",
                                                        color: "#ffffff",
                                                        padding: "0.5rem 1rem",
                                                        borderRadius: "10px",
                                                        textDecoration: "none",
                                                        fontSize: "0.825rem",
                                                        fontWeight: 700,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.4rem",
                                                        boxShadow: "0 2px 5px rgba(5,150,105,0.3)"
                                                    }}
                                                >
                                                    <FiPhone /> Call Agent
                                                </a>
                                            )}
                                        </div>
                                    );
                                } else if (hasAgent) {
                                    return (
                                        <div style={{
                                            background: "#fff7ed",
                                            border: "1px solid #fed7aa",
                                            borderRadius: "14px",
                                            padding: "1rem",
                                            marginBottom: "1.25rem",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#ea580c", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.15rem" }}>
                                                    {(selectedPickupDetails.collectionAgentName || "CA").charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: "0.725rem", color: "#c2410c", fontWeight: 700, textTransform: "uppercase" }}>Collection Agent (Awaiting Acceptance)</div>
                                                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#9a3412" }}>
                                                        {capitalizeWords(selectedPickupDetails.collectionAgentName)}
                                                    </div>
                                                    <div style={{ fontSize: "0.775rem", color: "#c2410c", marginTop: "0.1rem" }}>
                                                        Agent allocated; awaiting response acceptance.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div style={{
                                            background: "#f8fafc",
                                            border: "1px solid #e2e8f0",
                                            borderRadius: "14px",
                                            padding: "1rem",
                                            marginBottom: "1.25rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.85rem"
                                        }}>
                                            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#e2e8f0", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                                                <FiUser />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "0.725rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Collection Agent</div>
                                                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#334155" }}>
                                                    Pending Agent Allocation
                                                </div>
                                                <div style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "0.1rem" }}>
                                                    An EcoCycle collection agent will be assigned shortly for your scheduled pickup.
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            })()}

                            {/* Delivery Progress Timeline */}
                            <div style={{ marginBottom: "1.25rem" }}>
                                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", fontWeight: 700, color: "#1e293b" }}>
                                    Delivery Progress Timeline
                                </h4>
                                <div className="pk-timeline">
                                    {(() => {
                                        const cas = String(selectedPickupDetails.collectionAssignmentStatus || selectedPickupDetails.assignmentStatus || selectedPickupDetails.status || "").toLowerCase();
                                        const lcs = String(selectedPickupDetails.lifecycleStatus || "").toLowerCase();
                                        const delStat = String(selectedPickupDetails.deliveryStatus || "").toLowerCase();
                                        const isCancelled = isPickupCancelled(selectedPickupDetails);

                                        // Step 2: Agent Accepted
                                        const isAccepted = selectedPickupDetails.collectionAgentAccepted === true || ["accepted", "pickupstarted", "enroute", "completed", "pickedup", "outfordelivery", "intransit", "awaitingtechnicianapproval", "delivered", "deliveredtocenter"].includes(cas);

                                        // Pickup Started (En Route to Customer)
                                        const isPickupStarted = cas === "pickupstarted" || cas === "enroute" || lcs === "enroute" || lcs === "pickupstarted" || selectedPickupDetails.pickupStartedAt != null || selectedPickupDetails.startedAt != null;

                                        // An agent is assigned (allocated) even if not accepted yet
                                        const isAgentAssigned = Boolean(selectedPickupDetails.collectionAgentName) || cas === "assigned" || cas === "pending";

                                        // Step 3: Citizen Pickup Completed
                                        const isCitizenPickupDone = selectedPickupDetails.pickedUpAt != null || ["completed", "pickedup", "outfordelivery", "intransit", "awaitingtechnicianapproval", "delivered", "deliveredtocenter"].includes(cas) || ["pickedup", "collected", "intransit", "handoverpendingverification", "atinspectioncenter", "delivered"].includes(lcs);

                                        // Step 4: Transit Active or Completed
                                        const isTransitActiveOrDone = delStat === "intransit" || delStat === "pendingverification" || delStat === "delivered" || selectedPickupDetails.deliveryStartedAt != null || cas === "intransit" || cas === "deliveredtocenter" || lcs === "intransit" || lcs === "atinspectioncenter";
                                        const isTransitCompleted = delStat === "pendingverification" || delStat === "delivered" || cas === "deliveredtocenter" || lcs === "atinspectioncenter";

                                        // Step 5: Handover Verification Requested
                                        const isHandoverRequested = delStat === "pendingverification" || delStat === "delivered" || cas === "awaitingtechnicianapproval" || cas === "deliveredtocenter" || lcs === "handoverpendingverification" || lcs === "atinspectioncenter";

                                        // Step 6: Delivered & Verified by Technician
                                        const isDeliveredToTech = delStat === "delivered" || cas === "deliveredtocenter" || lcs === "atinspectioncenter" || selectedPickupDetails.deliveredAt != null;

                                        if (isCancelled) {
                                            return (
                                                <>
                                                    {/* Step 1: Created */}
                                                    <div className="pk-timeline-step completed">
                                                        <div className="pk-timeline-dot">
                                                            <FiCheck style={{ fontSize: "0.7rem" }} />
                                                        </div>
                                                        <div className="pk-step-title">Pickup Request Created</div>
                                                        <div className="pk-step-desc">Item registered in EcoCycle portal</div>
                                                        <div className="pk-step-time">{formatDate(selectedPickupDetails.createdAt)}</div>
                                                    </div>

                                                    {/* Step 2: Cancelled */}
                                                    <div className="pk-timeline-step cancelled">
                                                        <div className="pk-timeline-dot pk-dot-cancelled" style={{ background: "#ef4444", borderColor: "#fca5a5", color: "#ffffff" }}>
                                                            <FiX style={{ fontSize: "0.75rem" }} />
                                                        </div>
                                                        <div className="pk-step-title" style={{ color: "#dc2626" }}>Pickup Request Cancelled</div>
                                                        <div className="pk-step-desc">The pickup allocation cycle was cancelled.</div>
                                                    </div>
                                                </>
                                            );
                                        }

                                        const techCenter = selectedPickupDetails.assignedTechnicianCenterName || selectedPickupDetails.technicianCenterName || "EcoCycle Regional Hub";
                                        const techName = selectedPickupDetails.assignedTechnicianName || selectedPickupDetails.technicianName || "Inspection Officer";

                                        return (
                                            <>
                                                {/* Step 1: Created */}
                                                <div className="pk-timeline-step completed">
                                                    <div className="pk-timeline-dot">
                                                        <FiCheck style={{ fontSize: "0.7rem" }} />
                                                    </div>
                                                    <div className="pk-step-title">Pickup Request Created</div>
                                                    <div className="pk-step-desc">Item registered in EcoCycle portal</div>
                                                    <div className="pk-step-time">{formatDate(selectedPickupDetails.createdAt)}</div>
                                                </div>

                                                {/* Step 2: Agent Assigned & Accepted */}
                                                <div className={`pk-timeline-step ${isAccepted ? "completed" : isAgentAssigned ? "active" : ""}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isAccepted ? <FiCheck style={{ fontSize: "0.7rem" }} /> : isAgentAssigned ? <FiUser style={{ fontSize: "0.7rem" }} /> : null}
                                                    </div>
                                                    <div className="pk-step-title">Collection Agent Allocation & Acceptance</div>
                                                    <div className="pk-step-desc">
                                                        {isAccepted 
                                                            ? `Agent: ${capitalizeWords(selectedPickupDetails.collectionAgentName)} (${selectedPickupDetails.collectionAgentPhone || "Ph: Available"}) accepted task`
                                                            : isAgentAssigned
                                                            ? `Agent: ${capitalizeWords(selectedPickupDetails.collectionAgentName)} assigned — awaiting agent acceptance`
                                                            : "Awaiting collection agent assignment"}
                                                    </div>
                                                    {selectedPickupDetails.acceptedAt && isAccepted && (
                                                        <div className="pk-step-time">{formatDate(selectedPickupDetails.acceptedAt)}</div>
                                                    )}
                                                </div>

                                                {/* Step 3: Agent Pickup from Your Address */}
                                                <div className={`pk-timeline-step ${isCitizenPickupDone ? "completed" : (isPickupStarted || isAccepted) ? "active" : ""}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isCitizenPickupDone ? <FiCheck style={{ fontSize: "0.7rem" }} /> : (isPickupStarted || isAccepted) ? <FiTruck style={{ fontSize: "0.7rem" }} /> : null}
                                                    </div>
                                                    <div className="pk-step-title">Agent Pickup from Your Address</div>
                                                    <div className="pk-step-desc">
                                                        {isCitizenPickupDone 
                                                            ? "Collection agent collected device from your address" 
                                                            : isPickupStarted
                                                            ? "Collection agent is currently en route to your address for pickup"
                                                            : isAccepted
                                                            ? `Scheduled for pickup on ${formatDate(selectedPickupDetails.pickupDate)} (${selectedPickupDetails.timeSlot || "Scheduled slot"})`
                                                            : "Scheduled upon agent acceptance"}
                                                    </div>
                                                    {(selectedPickupDetails.pickedUpAt || selectedPickupDetails.pickupStartedAt || selectedPickupDetails.startedAt) && (
                                                        <div className="pk-step-time">{formatDate(selectedPickupDetails.pickedUpAt || selectedPickupDetails.pickupStartedAt || selectedPickupDetails.startedAt)}</div>
                                                    )}
                                                </div>

                                                {/* Step 4: In Transit to Inspection Center */}
                                                <div className={`pk-timeline-step ${isTransitCompleted || isHandoverRequested || isDeliveredToTech ? "completed" : (isCitizenPickupDone || isTransitActiveOrDone ? "active" : "")}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isTransitCompleted || isHandoverRequested || isDeliveredToTech ? <FiCheck style={{ fontSize: "0.7rem" }} /> : (isCitizenPickupDone || isTransitActiveOrDone ? <FiTruck style={{ fontSize: "0.7rem" }} /> : null)}
                                                    </div>
                                                    <div className="pk-step-title">In Transit to Inspection Center</div>
                                                    <div className="pk-step-desc">
                                                        {isTransitCompleted || isHandoverRequested || isDeliveredToTech
                                                            ? `E-waste device transported to ${techCenter}`
                                                            : isCitizenPickupDone || isTransitActiveOrDone
                                                            ? `Device collected from your address; in transit to ${techCenter}`
                                                            : `Destination: ${techCenter}`}
                                                    </div>
                                                    {selectedPickupDetails.deliveryStartedAt && (
                                                        <div className="pk-step-time">{formatDate(selectedPickupDetails.deliveryStartedAt)}</div>
                                                    )}
                                                </div>

                                                {/* Step 5: Handover & Technician Verification */}
                                                <div className={`pk-timeline-step ${isDeliveredToTech ? "completed" : isHandoverRequested ? "active" : ""}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isDeliveredToTech ? <FiCheck style={{ fontSize: "0.7rem" }} /> : isHandoverRequested ? <FiClock style={{ fontSize: "0.7rem" }} /> : null}
                                                    </div>
                                                    <div className="pk-step-title">Technician Delivery Handover</div>
                                                    <div className="pk-step-desc">
                                                        {isDeliveredToTech
                                                            ? `Handover verified and accepted by Technician ${techName}`
                                                            : isHandoverRequested
                                                            ? `Collection Agent arrived at ${techCenter}; verification requested to Technician ${techName}`
                                                            : `Awaiting arrival at ${techCenter}`}
                                                    </div>
                                                </div>

                                                {/* Step 6: Delivered & Ready for Inspection */}
                                                <div className={`pk-timeline-step ${isDeliveredToTech ? "completed" : ""}`}>
                                                    <div className="pk-timeline-dot">
                                                        {isDeliveredToTech ? <FiCheck style={{ fontSize: "0.7rem" }} /> : null}
                                                    </div>
                                                    <div className="pk-step-title">Delivered & Verified at Inspection Hub</div>
                                                    <div className="pk-step-desc">
                                                        {isDeliveredToTech 
                                                            ? `Device safely stored at ${techCenter} for technical diagnostics.` 
                                                            : "Pending final receipt & verification by Inspection Officer"}
                                                    </div>
                                                    {isDeliveredToTech && selectedPickupDetails.deliveredAt && (
                                                        <div className="pk-step-time">{formatDate(selectedPickupDetails.deliveredAt)}</div>
                                                    )}
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                            <button 
                                onClick={() => setSelectedPickupDetails(null)}
                                className="profile-btn save"
                                style={{ padding: "0.55rem 1.35rem" }}
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mandatory Bank Details Setup Modal */}
            {showBankModal && (
                <div className="bank-modal-overlay">
                    <div className="bank-modal-card">
                        <div className="bank-modal-header">
                            <div className="bank-modal-header-icon">
                                <FiCreditCard />
                            </div>
                            <div className="bank-modal-header-text">
                                <h3>Bank Account Details</h3>
                                <p>Required for electronic e-waste recycling payouts & rewards</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveBankDetails}>
                            <div className="bank-modal-body">
                                <div className="bank-modal-info-callout">
                                    <FiShield style={{ flexShrink: 0, fontSize: "1.1rem" }} />
                                    <span>Please enter your official bank details to enable direct payouts. This step is required for verified citizen payout dispatches.</span>
                                </div>

                                {bankErrorMsg && (
                                    <div style={{ background: "#ffe4e6", border: "1px solid #fca5a5", color: "#9f1239", padding: "0.75rem 1rem", borderRadius: "10px", marginBottom: "1.1rem", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <FiAlertCircle style={{ fontSize: "1.15rem", flexShrink: 0 }} /> {bankErrorMsg}
                                    </div>
                                )}

                                {/* Row 1: Account Holder Name & Bank Name */}
                                <div className="bank-form-row">
                                    <div className="bank-form-group">
                                        <label>
                                            Account Holder Name <span className="req">*</span>
                                        </label>
                                        <div className="bank-input-wrap">
                                            <FiUser className="bank-input-icon" />
                                            <input
                                                type="text"
                                                placeholder="Enter account holder name"
                                                value={bankForm.accountHolder}
                                                onChange={(e) => handleBankInputChange("accountHolder", e.target.value)}
                                                className={bankErrors.accountHolder ? "input-has-error" : ""}
                                                disabled={bankSaving}
                                                autoFocus
                                            />
                                        </div>
                                        {bankErrors.accountHolder && (
                                            <span className="bank-field-error">
                                                <FiAlertCircle /> {bankErrors.accountHolder}
                                            </span>
                                        )}
                                    </div>

                                    <div className="bank-form-group">
                                        <label>
                                            Bank Name <span className="req">*</span>
                                        </label>
                                        <div className="bank-input-wrap">
                                            <FiAward className="bank-input-icon" />
                                            <input
                                                type="text"
                                                placeholder="e.g. State Bank of India"
                                                value={bankForm.bankName}
                                                onChange={(e) => handleBankInputChange("bankName", e.target.value)}
                                                className={bankErrors.bankName ? "input-has-error" : ""}
                                                disabled={bankSaving}
                                            />
                                        </div>
                                        {bankErrors.bankName && (
                                            <span className="bank-field-error">
                                                <FiAlertCircle /> {bankErrors.bankName}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Row 2: Account Number & Confirm Account Number */}
                                <div className="bank-form-row">
                                    <div className="bank-form-group">
                                        <label>
                                            Account Number <span className="req">*</span>
                                        </label>
                                        <div className="bank-input-wrap">
                                            <FiCreditCard className="bank-input-icon" />
                                            <input
                                                type="text"
                                                placeholder="Enter 9-18 digit account number"
                                                value={bankForm.accountNumber}
                                                maxLength={18}
                                                onChange={(e) => handleBankInputChange("accountNumber", e.target.value)}
                                                className={bankErrors.accountNumber ? "input-has-error" : ""}
                                                disabled={bankSaving}
                                            />
                                        </div>
                                        {bankErrors.accountNumber && (
                                            <span className="bank-field-error">
                                                <FiAlertCircle /> {bankErrors.accountNumber}
                                            </span>
                                        )}
                                    </div>

                                    <div className="bank-form-group">
                                        <label>
                                            Confirm Account Number <span className="req">*</span>
                                        </label>
                                        <div className="bank-input-wrap">
                                            <FiLock className="bank-input-icon" />
                                            <input
                                                type="text"
                                                placeholder="Re-enter account number"
                                                value={bankForm.confirmAccountNumber}
                                                maxLength={18}
                                                onChange={(e) => handleBankInputChange("confirmAccountNumber", e.target.value)}
                                                className={bankErrors.confirmAccountNumber ? "input-has-error" : ""}
                                                disabled={bankSaving}
                                            />
                                        </div>
                                        {bankErrors.confirmAccountNumber && (
                                            <span className="bank-field-error">
                                                <FiAlertCircle /> {bankErrors.confirmAccountNumber}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Row 3: IFSC Code */}
                                <div className="bank-form-row">
                                    <div className="bank-form-group" style={{ marginBottom: "0.25rem" }}>
                                        <label>
                                            IFSC Code <span className="req">*</span>
                                        </label>
                                        <div className="bank-input-wrap">
                                            <FiCheckCircle className="bank-input-icon" />
                                            <input
                                                type="text"
                                                placeholder="e.g. SBIN0001234"
                                                value={bankForm.ifscCode}
                                                maxLength={11}
                                                style={{ textTransform: "uppercase" }}
                                                onChange={(e) => handleBankInputChange("ifscCode", e.target.value)}
                                                className={bankErrors.ifscCode ? "input-has-error" : ""}
                                                disabled={bankSaving}
                                            />
                                        </div>
                                        {bankErrors.ifscCode && (
                                            <span className="bank-field-error">
                                                <FiAlertCircle /> {bankErrors.ifscCode}
                                            </span>
                                        )}
                                    </div>
                                    <div className="bank-form-group" style={{ display: "flex", alignItems: "flex-end", marginBottom: "0.25rem" }}>
                                        <div style={{ fontSize: "0.78rem", color: "#64748b", background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "10px", padding: "0.65rem 0.9rem", width: "100%", lineHeight: 1.4 }}>
                                            <strong>Note:</strong> IFSC code must be 11 characters (e.g. 4 letters, 0, followed by 6 alphanumeric characters).
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bank-modal-footer">
                                <button
                                    type="submit"
                                    className="bank-btn-submit"
                                    disabled={bankSaving}
                                >
                                    {bankSaving ? (
                                        <>
                                            <FiRefreshCw className="spin-icon" /> Saving Details...
                                        </>
                                    ) : (
                                        <>
                                            <FiSave /> Save Bank Details
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CitizenDashboard;