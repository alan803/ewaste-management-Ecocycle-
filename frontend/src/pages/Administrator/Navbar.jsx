import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { FaLeaf, FaLaptop } from "react-icons/fa";
import {
    FiGrid,
    FiUsers,
    FiPackage,
    FiTruck,
    FiMapPin,
    FiBarChart2,
    FiLogOut,
    FiMenu,
    FiX,
    FiUserCheck,
    FiChevronRight,
    FiChevronDown,
    FiUser,
    FiCpu,
    FiTool,
    FiRefreshCw,
    FiClipboard,
    FiList,
    FiCheckCircle,
    FiClock,
    FiShare2,
    FiDollarSign,
    FiAward,
    FiLayers,
    FiBox,
    FiTag,
    FiSmartphone,
    FiAlertCircle
} from "react-icons/fi";
import "./Navbar.css";
import "./AdminCommon.css";

const LOCAL_API_BASE = "http://localhost:5278/api";
const PROD_API_BASE = "https://ecocycle.runasp.net/api";
const API_BASE = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? LOCAL_API_BASE
    : PROD_API_BASE;

function Navbar() {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [pickupDropdownOpen, setPickupDropdownOpen] = useState(false);
    const [deliveryDropdownOpen, setDeliveryDropdownOpen] = useState(false);
    const [allocationsDropdownOpen, setAllocationsDropdownOpen] = useState(false);
    const [centerAllocationsDropdownOpen, setCenterAllocationsDropdownOpen] = useState(false);
    const [processingCenterDropdownOpen, setProcessingCenterDropdownOpen] = useState(false);
    const [unpaidPayoutsCount, setUnpaidPayoutsCount] = useState(() => {
        try {
            const cached = sessionStorage.getItem("ecocycle_unpaid_completed_count");
            return cached !== null ? Number(cached) : 0;
        } catch (_) {
            return 0;
        }
    });

    const checkUnpaidDevices = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const [recyclingRes, refurbProcRes, deviceRes, payoutsRes] = await Promise.all([
                axios.get(`${API_BASE}/RecyclingProcess/all-processes`, { headers }).catch(() => ({ data: [] })),
                axios.get(`${API_BASE}/RefurbishmentProcess/all-processes`, { headers }).catch(() => ({ data: [] })),
                axios.get(`${API_BASE}/Device/All`, { headers }).catch(() => ({ data: [] })),
                axios.get(`${API_BASE}/Payout/all`, { headers }).catch(() => ({ data: [] }))
            ]);

            const allPayouts = Array.isArray(payoutsRes.data) ? payoutsRes.data : [];
            const allDevices = Array.isArray(deviceRes.data) ? deviceRes.data : [];
            const unpaidDeviceIds = new Set();

            // 1. Process Completed Recycling Devices (matching Manage_completeddevices.jsx)
            if (Array.isArray(recyclingRes.data)) {
                recyclingRes.data.forEach((item) => {
                    const proc = item.process;
                    const status = (item.status || proc?.status || "").toLowerCase();
                    const lifecycle = (item.lifecycleStatus || item.device?.lifecycleStatus || "").toLowerCase();
                    const isCompleted = (
                        status === "completed" || 
                        status === "recycled" || 
                        status === "certified" ||
                        status === "settled" ||
                        lifecycle === "settled" ||
                        lifecycle === "completed" ||
                        Boolean(proc && (String(proc.status || "").toLowerCase() === "completed" || proc.completedAt))
                    );

                    if (isCompleted) {
                        const devId = Number(item.deviceId || item.requestId);
                        if (!devId) return;

                        const matchedDev = allDevices.find(d => Number(d.deviceId || d.DeviceId) === devId);
                        const devPayouts = allPayouts.filter(p => Number(p.deviceId || p.DeviceId) === devId);
                        const isPaidFromPayouts = devPayouts.length > 0 && devPayouts.some(p => (p.payoutStatus || p.PayoutStatus) === "Paid");
                        const isDeviceSettled = isPaidFromPayouts || matchedDev?.lifecycleStatus === "Settled" || item.lifecycleStatus === "Settled";

                        if (!isDeviceSettled) {
                            unpaidDeviceIds.add(devId);
                        }
                    }
                });
            }

            // 2. Process Completed Refurbishment Processes (matching Manage_completeddevices.jsx)
            if (Array.isArray(refurbProcRes.data)) {
                refurbProcRes.data.forEach((rItem) => {
                    const proc = rItem.process;
                    const status = (proc?.status || rItem.status || "").toLowerCase();
                    const lifecycle = (rItem.lifecycleStatus || rItem.device?.lifecycleStatus || "").toLowerCase();
                    const isCompleted = (
                        status === "completed" || 
                        status === "refurbished" || 
                        status === "ready" ||
                        status === "settled" ||
                        lifecycle === "settled" ||
                        lifecycle === "completed" ||
                        Boolean(rItem.refurbishmentCompletedAt) ||
                        Boolean(proc && (String(proc.status || "").toLowerCase() === "completed" || proc.completedAt))
                    );

                    if (isCompleted) {
                        const devId = Number(rItem.deviceId || rItem.requestId);
                        if (!devId) return;

                        const matchedDev = allDevices.find(d => Number(d.deviceId || d.DeviceId) === devId);
                        const devPayouts = allPayouts.filter(p => Number(p.deviceId || p.DeviceId) === devId);
                        const isPaidFromPayouts = devPayouts.length > 0 && devPayouts.some(p => (p.payoutStatus || p.PayoutStatus) === "Paid");
                        const isDeviceSettled = isPaidFromPayouts || matchedDev?.lifecycleStatus === "Settled" || rItem.lifecycleStatus === "Settled";

                        if (!isDeviceSettled) {
                            unpaidDeviceIds.add(devId);
                        }
                    }
                });
            }

            const count = unpaidDeviceIds.size;
            setUnpaidPayoutsCount(count);
            try {
                sessionStorage.setItem("ecocycle_unpaid_completed_count", String(count));
            } catch (_) {}
        } catch (err) {
            console.warn("Error checking unpaid completed devices in Navbar:", err);
        }
    };

    useEffect(() => {
        checkUnpaidDevices();
        const handleUpdate = (e) => {
            if (e?.detail?.count !== undefined) {
                setUnpaidPayoutsCount(Number(e.detail.count));
            } else {
                checkUnpaidDevices();
            }
        };
        window.addEventListener("ecocycle-payout-updated", handleUpdate);
        window.addEventListener("focus", checkUnpaidDevices);
        const interval = setInterval(checkUnpaidDevices, 15000);
        return () => {
            window.removeEventListener("ecocycle-payout-updated", handleUpdate);
            window.removeEventListener("focus", checkUnpaidDevices);
            clearInterval(interval);
        };
    }, [location.pathname]);

    const handleOptionClick = () => {
        setPickupDropdownOpen(false);
        closeMobileMenu();
    };

    const handleDeliveryOptionClick = () => {
        setDeliveryDropdownOpen(false);
        closeMobileMenu();
    };

    const handleAllocationsOptionClick = () => {
        setAllocationsDropdownOpen(false);
        closeMobileMenu();
    };

    const handleCenterAllocationsOptionClick = () => {
        setCenterAllocationsDropdownOpen(false);
        closeMobileMenu();
    };

    const handleProcessingCenterOptionClick = () => {
        setProcessingCenterDropdownOpen(false);
        closeMobileMenu();
    };

    const isActive = (path) => {
        if (path === "/admin") {
            return location.pathname === "/admin" || location.pathname === "/admin/";
        }
        return location.pathname === path || location.pathname.startsWith(path + "/");
    };

    const toggleMobileMenu = () => {
        setMobileOpen(!mobileOpen);
    };

    const closeMobileMenu = () => {
        setMobileOpen(false);
    };

    return (
        <>
            {/* Mobile Menu Toggle Button */}
            <button className="admin-sb-mobile-toggle" onClick={toggleMobileMenu} aria-label="Toggle sidebar">
                {mobileOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* Backdrop overlay for mobile */}
            {mobileOpen && <div className="admin-sb-backdrop" onClick={closeMobileMenu}></div>}

            <aside className={`admin-sidebar ${mobileOpen ? "open" : ""}`}>
                {/* Brand Header */}
                <div className="admin-sb-header">
                    <Link to="/admin" className="admin-sb-logo-link" onClick={closeMobileMenu}>
                        <div className="admin-sb-logo-icon">
                            <FaLeaf />
                        </div>
                        <div className="admin-sb-logo-text">
                            <span className="admin-sb-brand-name">EcoCycle</span>
                            <span className="admin-sb-brand-tag">ADMIN HUB</span>
                        </div>
                    </Link>
                </div>

                {/* Navigation Links */}
                <nav className="admin-sb-nav">
                    {/* Dashboard Top Level */}
                    <div className="admin-sb-section">
                        <ul className="admin-sb-menu">
                            <li className="admin-sb-item">
                                <Link
                                    to="/admin"
                                    className={`admin-sb-link ${isActive("/admin") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--emerald">
                                        <FiGrid />
                                    </div>
                                    <span className="admin-sb-link-text">Dashboard</span>
                                    {isActive("/admin") && <FiChevronRight className="admin-sb-chevron" />}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* PART 1: COLLECTION & INSPECTION */}
                    <div className="admin-sb-section">
                        <span className="admin-sb-section-title">PART 1 &bull; COLLECTION &amp; INSPECTION</span>
                        <ul className="admin-sb-menu">
                            <li className="admin-sb-item">
                                <Link
                                    to="/manage-device"
                                    className={`admin-sb-link ${isActive("/manage-device") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--blue">
                                        <FiBox />
                                    </div>
                                    <span className="admin-sb-link-text">Device Requests</span>
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <button
                                    type="button"
                                    className={`admin-sb-link ${isActive("/manage-assignmentandpickups") || isActive("/collectionagent-pickup") || isActive("/admin/pickups") ? "active" : ""}`}
                                    onClick={() => setAllocationsDropdownOpen(!allocationsDropdownOpen)}
                                    style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
                                >
                                    <div className="admin-sb-icon-box icon-box--cyan">
                                        <FiUserCheck />
                                    </div>
                                    <span className="admin-sb-link-text">Allocations</span>
                                    <FiChevronDown className={`admin-sb-chevron-icon ${allocationsDropdownOpen ? "rotate" : ""}`} />
                                </button>
                                {allocationsDropdownOpen && (
                                    <div className="admin-sb-submenu-wrapper">
                                        <ul className="admin-sb-submenu">
                                            <li>
                                                <Link
                                                    to="/manage-assignmentandpickups"
                                                    className={`admin-sb-sublink ${isActive("/manage-assignmentandpickups") ? "active" : ""}`}
                                                    onClick={handleAllocationsOptionClick}
                                                >
                                                    <FiUserCheck className="sublink-icon icon--cyan" />
                                                    <span>Technician Allocation</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    to="/collectionagent-pickup"
                                                    className={`admin-sb-sublink ${isActive("/collectionagent-pickup") || isActive("/admin/pickups") ? "active" : ""}`}
                                                    onClick={handleAllocationsOptionClick}
                                                >
                                                    <FiClipboard className="sublink-icon icon--amber" />
                                                    <span>Collection Agent Allocation</span>
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/manage-inspection"
                                    className={`admin-sb-link ${isActive("/manage-inspection") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--emerald">
                                        <FiCheckCircle />
                                    </div>
                                    <span className="admin-sb-link-text">Inspection Monitoring</span>
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/manage-penalties"
                                    className={`admin-sb-link ${isActive("/manage-penalties") || isActive("/manage-technician-penalties") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--rose" style={{ background: "rgba(225, 29, 72, 0.1)", color: "#e11d48" }}>
                                        <FiDollarSign />
                                    </div>
                                    <span className="admin-sb-link-text">Penalty Management</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* COMMON LOGISTICS & TRANSPORTATION */}
                    <div className="admin-sb-section">
                        <span className="admin-sb-section-title">LOGISTICS &amp; TRANSPORTATION</span>
                        <ul className="admin-sb-menu">
                            {/* PICKUPS (Both Journeys) */}
                            <li className="admin-sb-item">
                                <button
                                    type="button"
                                    className={`admin-sb-link ${isActive("/manage-pickup") ? "active" : ""}`}
                                    onClick={() => setPickupDropdownOpen(!pickupDropdownOpen)}
                                    style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
                                >
                                    <div className="admin-sb-icon-box icon-box--purple">
                                        <FiTruck />
                                    </div>
                                    <span className="admin-sb-link-text">Pickup Logistics</span>
                                    <FiChevronDown className={`admin-sb-chevron-icon ${pickupDropdownOpen ? "rotate" : ""}`} />
                                </button>
                                {pickupDropdownOpen && (
                                    <div className="admin-sb-submenu-wrapper">
                                        <ul className="admin-sb-submenu">
                                            <li>
                                                <Link
                                                    to="/manage-pickup?type=CustomerToTechnician"
                                                    className={`admin-sb-sublink ${isActive("/manage-pickup") && (!location.search || location.search.includes("CustomerToTechnician")) ? "active" : ""}`}
                                                    onClick={handleOptionClick}
                                                >
                                                    <FiUserCheck className="sublink-icon icon--cyan" />
                                                    <span>Customer ➔ Technician</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    to="/manage-pickup?type=TechnicianToRecyclingCenter"
                                                    className={`admin-sb-sublink ${isActive("/manage-pickup") && location.search.includes("TechnicianToRecyclingCenter") ? "active" : ""}`}
                                                    onClick={handleOptionClick}
                                                >
                                                    <FiRefreshCw className="sublink-icon icon--teal" />
                                                    <span>Technician ➔ Center</span>
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </li>

                            {/* DELIVERIES (Both Journeys) */}
                            <li className="admin-sb-item">
                                <button
                                    type="button"
                                    className={`admin-sb-link ${isActive("/manage-delivery") ? "active" : ""}`}
                                    onClick={() => setDeliveryDropdownOpen(!deliveryDropdownOpen)}
                                    style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
                                >
                                    <div className="admin-sb-icon-box icon-box--teal">
                                        <FiMapPin />
                                    </div>
                                    <span className="admin-sb-link-text">Delivery Logistics</span>
                                    <FiChevronDown className={`admin-sb-chevron-icon ${deliveryDropdownOpen ? "rotate" : ""}`} />
                                </button>
                                {deliveryDropdownOpen && (
                                    <div className="admin-sb-submenu-wrapper">
                                        <ul className="admin-sb-submenu">
                                            <li>
                                                <Link
                                                    to="/manage-delivery?type=CustomerToTechnician"
                                                    className={`admin-sb-sublink ${isActive("/manage-delivery") && location.search.includes("CustomerToTechnician") ? "active" : ""}`}
                                                    onClick={handleDeliveryOptionClick}
                                                >
                                                    <FiUserCheck className="sublink-icon icon--cyan" />
                                                    <span>Customer ➔ Technician</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    to="/manage-delivery?type=TechnicianToRecyclingCenter"
                                                    className={`admin-sb-sublink ${isActive("/manage-delivery") && (!location.search || location.search.includes("TechnicianToRecyclingCenter")) ? "active" : ""}`}
                                                    onClick={handleDeliveryOptionClick}
                                                >
                                                    <FiRefreshCw className="sublink-icon icon--teal" />
                                                    <span>Technician ➔ Center</span>
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </li>
                        </ul>
                    </div>

                    {/* PART 2: PROCESSING & RECOVERY */}
                    <div className="admin-sb-section">
                        <span className="admin-sb-section-title">PART 2 &bull; PROCESSING &amp; RECOVERY</span>
                        <ul className="admin-sb-menu">
                            <li className="admin-sb-item">
                                <button
                                    type="button"
                                    className={`admin-sb-link ${isActive("/allocate-recycling") || isActive("/admin/refurbishment-devices") || isActive("/manage-centerallocation") ? "active" : ""}`}
                                    onClick={() => setProcessingCenterDropdownOpen(!processingCenterDropdownOpen)}
                                    style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
                                >
                                    <div className="admin-sb-icon-box icon-box--teal">
                                        <FiShare2 />
                                    </div>
                                    <span className="admin-sb-link-text">Processing Center Allocations</span>
                                    <FiChevronDown className={`admin-sb-chevron-icon ${processingCenterDropdownOpen ? "rotate" : ""}`} />
                                </button>
                                {processingCenterDropdownOpen && (
                                    <div className="admin-sb-submenu-wrapper">
                                        <ul className="admin-sb-submenu">
                                            <li>
                                                <Link
                                                    to="/allocate-recycling"
                                                    className={`admin-sb-sublink ${isActive("/allocate-recycling") ? "active" : ""}`}
                                                    onClick={handleProcessingCenterOptionClick}
                                                >
                                                    <FiRefreshCw className="sublink-icon icon--teal" />
                                                    <span>Recycling Center</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    to="/admin/refurbishment-devices"
                                                    className={`admin-sb-sublink ${isActive("/admin/refurbishment-devices") || isActive("/allocate-refurbishment") ? "active" : ""}`}
                                                    onClick={handleProcessingCenterOptionClick}
                                                >
                                                    <FiCpu className="sublink-icon icon--purple" />
                                                    <span>Refurbishment Center</span>
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </li>
                            <li className="admin-sb-item">
                                <button
                                    type="button"
                                    className={`admin-sb-link ${isActive("/manage-refurbishmentallocation") || isActive("/allocate-refurbishment") || isActive("/manage-recyclingallocation") ? "active" : ""}`}
                                    onClick={() => setCenterAllocationsDropdownOpen(!centerAllocationsDropdownOpen)}
                                    style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
                                >
                                    <div className="admin-sb-icon-box icon-box--purple">
                                        <FiCpu />
                                    </div>
                                    <span className="admin-sb-link-text">Center Allocations</span>
                                    <FiChevronDown className={`admin-sb-chevron-icon ${centerAllocationsDropdownOpen ? "rotate" : ""}`} />
                                </button>
                                {centerAllocationsDropdownOpen && (
                                    <div className="admin-sb-submenu-wrapper">
                                        <ul className="admin-sb-submenu">
                                            <li>
                                                <Link
                                                    to="/manage-recyclingallocation"
                                                    className={`admin-sb-sublink ${isActive("/manage-recyclingallocation") ? "active" : ""}`}
                                                    onClick={handleCenterAllocationsOptionClick}
                                                >
                                                    <FiRefreshCw className="sublink-icon icon--teal" />
                                                    <span>Recycling Allocations</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    to="/manage-refurbishmentallocation"
                                                    className={`admin-sb-sublink ${isActive("/manage-refurbishmentallocation") || isActive("/allocate-refurbishment") ? "active" : ""}`}
                                                    onClick={handleCenterAllocationsOptionClick}
                                                >
                                                    <FiCpu className="sublink-icon icon--purple" />
                                                    <span>Refurbishment Allocations</span>
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/manage-refurbishmentprocess"
                                    className={`admin-sb-link ${isActive("/manage-refurbishmentprocess") || isActive("/manage-refurbishmentprocesses") || isActive("/admin/refurbishment-processes") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--purple">
                                        <FiCpu />
                                    </div>
                                    <span className="admin-sb-link-text">Refurbishment Processes</span>
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/manage-recyclingprocess"
                                    className={`admin-sb-link ${isActive("/manage-recyclingprocess") || isActive("/manage-recyclingprocesses") || isActive("/admin/recycling-processes") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--teal">
                                        <FiRefreshCw />
                                    </div>
                                    <span className="admin-sb-link-text">Recycling Processes</span>
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/manage-materialrecovery"
                                    className={`admin-sb-link ${isActive("/manage-materialrecovery") || isActive("/manage-material-recovery") || isActive("/manage_materialrecovery") || isActive("/admin/material-recovery") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--cyan">
                                        <FiDollarSign />
                                    </div>
                                    <span className="admin-sb-link-text">Material Recovery</span>
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/manage-modelprices"
                                    className={`admin-sb-link ${isActive("/manage-modelprices") || isActive("/manage-model-prices") || isActive("/admin/model-prices") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--blue">
                                        <FiSmartphone />
                                    </div>
                                    <span className="admin-sb-link-text">Device Model Pricing</span>
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/manage-materialprices"
                                    className={`admin-sb-link ${isActive("/manage-materialprices") || isActive("/admin/material-prices") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--emerald">
                                        <FiTag />
                                    </div>
                                    <span className="admin-sb-link-text">Material Pricing</span>
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/manage-completeddevices"
                                    className={`admin-sb-link ${isActive("/manage-completeddevices") || isActive("/manage-completed-devices") || isActive("/admin/completed-devices") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--slate" style={{ position: "relative" }}>
                                        <FiAward />
                                        {unpaidPayoutsCount > 0 && (
                                            <span
                                                className="admin-sb-unpaid-dot"
                                                title={`${unpaidPayoutsCount} completed device${unpaidPayoutsCount > 1 ? "s" : ""} awaiting payout settlement`}
                                            />
                                        )}
                                    </div>
                                    <span className="admin-sb-link-text">Completed Devices</span>
                                    {unpaidPayoutsCount > 0 && (
                                        <span
                                            className="admin-sb-unpaid-pill"
                                            title={`${unpaidPayoutsCount} completed device${unpaidPayoutsCount > 1 ? "s have" : " has"} unpaid stakeholder payouts`}
                                        >
                                            <span className="admin-sb-unpaid-badge-num">{unpaidPayoutsCount}</span>
                                        </span>
                                    )}
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/manage-transactions"
                                    className={`admin-sb-link ${isActive("/manage-transactions") || isActive("/admin/transactions") || isActive("/admin/financials") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--emerald" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                                        <FiDollarSign />
                                    </div>
                                    <span className="admin-sb-link-text">Financials &amp; Escrow</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* MANAGEMENT */}
                    <div className="admin-sb-section">
                        <span className="admin-sb-section-title">MANAGEMENT</span>
                        <ul className="admin-sb-menu">
                            <li className="admin-sb-item">
                                <Link
                                    to="/manage-users"
                                    className={`admin-sb-link ${isActive("/manage-users") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--emerald">
                                        <FiUser />
                                    </div>
                                    <span className="admin-sb-link-text">Citizens</span>
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/manage-collectionagents"
                                    className={`admin-sb-link ${isActive("/manage-collectionagents") || isActive("/manage-collectionagent") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--amber">
                                        <FiTruck />
                                    </div>
                                    <span className="admin-sb-link-text">Collection Agents</span>
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/managetechnicians"
                                    className={`admin-sb-link ${isActive("/managetechnicians") || isActive("/manage-technicians") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--cyan">
                                        <FiTool />
                                    </div>
                                    <span className="admin-sb-link-text">Technicians</span>
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/manage-refurbishment"
                                    className={`admin-sb-link ${isActive("/manage-refurbishment") || isActive("/manage-refurbishmentcenter") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--purple">
                                        <FiCpu />
                                    </div>
                                    <span className="admin-sb-link-text">Refurbishment Centers</span>
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/manage-recyclingcenters"
                                    className={`admin-sb-link ${isActive("/manage-recyclingcenters") || isActive("/manage-recyclingcenter") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--teal">
                                        <FiRefreshCw />
                                    </div>
                                    <span className="admin-sb-link-text">Recycling Centers</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* REPORTS */}
                    <div className="admin-sb-section">
                        <span className="admin-sb-section-title">REPORTS</span>
                        <ul className="admin-sb-menu">
                            <li className="admin-sb-item">
                                <Link
                                    to="/admin/reports?tab=analytics"
                                    className={`admin-sb-link ${location.search.includes("tab=analytics") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--teal">
                                        <FiBarChart2 />
                                    </div>
                                    <span className="admin-sb-link-text">Recovery Analytics</span>
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/admin/reports?tab=financial"
                                    className={`admin-sb-link ${location.search.includes("tab=financial") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--amber">
                                        <FiDollarSign />
                                    </div>
                                    <span className="admin-sb-link-text">Financial Reports</span>
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/admin/reports?tab=certificates"
                                    className={`admin-sb-link ${location.search.includes("tab=certificates") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--purple">
                                        <FiAward />
                                    </div>
                                    <span className="admin-sb-link-text">Certificates</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </nav>

                {/* Footer Section */}
                <div className="admin-sb-footer">
                    <Link to="/logout" className="admin-sb-link admin-sb-link--logout" onClick={closeMobileMenu}>
                        <div className="admin-sb-icon-box icon-box--rose">
                            <FiLogOut />
                        </div>
                        <span className="admin-sb-link-text">Logout</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}

export default Navbar;