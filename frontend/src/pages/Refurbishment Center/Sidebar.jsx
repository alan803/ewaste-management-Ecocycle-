import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FiCpu,
    FiTool,
    FiCheckSquare,
    FiUser,
    FiLogOut,
    FiBox,
    FiMenu,
    FiX,
    FiActivity,
    FiShield,
    FiBell,
    FiTruck,
    FiBarChart2
} from "react-icons/fi";
import "./Sidebar.css";

function Sidebar({ isLocked = false, onBlockedNav }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const isActive = (path) => {
        const p = location.pathname;
        if ((path === "/refurbishmentcenter_dashboard" || path === "/refurbishment_dashboard" || path === "/refurbishmententer_dashboard") && 
            (p === "/refurbishmentcenter_dashboard" || p === "/refurbishment_dashboard" || p === "/refurbishmententer_dashboard")) {
            return true;
        }
        if ((path === "/refurbishment_delivery" || path === "/refurbishmentcenter_delivery") && 
            (p === "/refurbishment_delivery" || p === "/refurbishmentcenter_delivery" || p.startsWith("/refurbishment_delivery") || p.startsWith("/refurbishmentcenter_delivery"))) {
            return true;
        }
        if ((path === "/refurbished_devices" || path === "/refurbished-devices" || path === "/refurbishment_repaired") && 
            (p === "/refurbished_devices" || p === "/refurbished-devices" || p === "/refurbishment_repaired" || p.startsWith("/refurbished_devices") || p.startsWith("/refurbished-devices"))) {
            return true;
        }
        if ((path === "/refurbishment_analytics" || path === "/refurbishment-analytics" || path === "/refurbishmentcenter_analytics") && 
            (p === "/refurbishment_analytics" || p === "/refurbishment-analytics" || p === "/refurbishmentcenter_analytics" || p.startsWith("/refurbishment_analytics") || p.startsWith("/refurbishment-analytics"))) {
            return true;
        }
        if (path !== "/refurbishmentcenter_dashboard" && path !== "/refurbishment_delivery" && path !== "/refurbished_devices" && path !== "/refurbishment_analytics" && p.startsWith(path)) return true;
        return false;
    };

    const handleNavClick = (e, targetPath) => {
        if (isLocked) {
            e.preventDefault();
            if (onBlockedNav) {
                onBlockedNav(targetPath);
            }
            return false;
        }
        setIsMobileOpen(false);
    };

    const handleLogout = (e) => {
        if (isLocked) {
            e.preventDefault();
            if (onBlockedNav) {
                onBlockedNav("/login");
            }
            return false;
        }
        localStorage.clear();
        navigate("/login");
    };

    return (
        <>
            {/* Mobile Sidebar Toggle Button */}
            <button
                className="refurb-mobile-toggle"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Toggle Sidebar Navigation"
            >
                {isMobileOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* Sidebar Navigation */}
            <aside className={`refurb-sidebar-aside ${isMobileOpen ? "open" : ""}`}>
                <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden" }}>
                    {/* Brand Header */}
                    <Link 
                        to="/refurbishmentcenter_dashboard" 
                        className="refurb-sidebar-brand"
                        onClick={(e) => handleNavClick(e, "/refurbishmentcenter_dashboard")}
                    >
                        <div className="refurb-brand-badge">
                            <FiCpu />
                        </div>
                        <div>
                            <h1 className="refurb-brand-title">EcoCycle</h1>
                            <span className="refurb-brand-sub">Refurbish Center</span>
                        </div>
                    </Link>

                    {/* Navigation Items */}
                    <div className="refurb-sidebar-scroll">
                        <div className="refurb-nav-group">
                            <span className="refurb-group-title">Facility Menu</span>
                            <ul className="refurb-sidebar-ul">
                                <li>
                                    <Link
                                        to="/refurbishmentcenter_dashboard"
                                        className={`refurb-sidebar-link ${isActive("/refurbishmentcenter_dashboard") ? "active" : ""} ${isLocked && !isActive("/refurbishmentcenter_dashboard") ? "nav-locked" : ""}`}
                                        onClick={(e) => handleNavClick(e, "/refurbishmentcenter_dashboard")}
                                    >
                                        <span className="refurb-sidebar-icon"><FiBox /></span>
                                        <span>Inbound Queue</span>
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="/refurbishment_delivery"
                                        className={`refurb-sidebar-link ${isActive("/refurbishment_delivery") ? "active" : ""} ${isLocked && !isActive("/refurbishment_delivery") ? "nav-locked" : ""}`}
                                        onClick={(e) => handleNavClick(e, "/refurbishment_delivery")}
                                    >
                                        <span className="refurb-sidebar-icon"><FiTruck /></span>
                                        <span>Inbound Deliveries</span>
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="/refurbishment_perform"
                                        className={`refurb-sidebar-link ${isActive("/refurbishment_perform") ? "active" : ""} ${isLocked && !isActive("/refurbishment_perform") ? "nav-locked" : ""}`}
                                        onClick={(e) => handleNavClick(e, "/refurbishment_perform")}
                                    >
                                        <span className="refurb-sidebar-icon"><FiTool /></span>
                                        <span>Refurbish Process</span>
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="/refurbished_devices"
                                        className={`refurb-sidebar-link ${isActive("/refurbished_devices") ? "active" : ""} ${isLocked && !isActive("/refurbished_devices") ? "nav-locked" : ""}`}
                                        onClick={(e) => handleNavClick(e, "/refurbished_devices")}
                                    >
                                        <span className="refurb-sidebar-icon"><FiCheckSquare /></span>
                                        <span>Repaired Devices</span>
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="/refurbishment_analytics"
                                        className={`refurb-sidebar-link ${isActive("/refurbishment_analytics") ? "active" : ""} ${isLocked && !isActive("/refurbishment_analytics") ? "nav-locked" : ""}`}
                                        onClick={(e) => handleNavClick(e, "/refurbishment_analytics")}
                                    >
                                        <span className="refurb-sidebar-icon"><FiBarChart2 /></span>
                                        <span>Analytics &amp; Reports</span>
                                    </Link>
                                </li>

                                <li>
                                    <Link
                                        to="/refurbishment_profile"
                                        className={`refurb-sidebar-link ${isActive("/refurbishment_profile") ? "active" : ""} ${isLocked && !isActive("/refurbishment_profile") ? "nav-locked" : ""}`}
                                        onClick={(e) => handleNavClick(e, "/refurbishment_profile")}
                                    >
                                        <span className="refurb-sidebar-icon"><FiUser /></span>
                                        <span>Center Profile</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div className="refurb-nav-group">
                            <span className="refurb-group-title">Account</span>
                            <ul className="refurb-sidebar-ul">
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className={`refurb-sidebar-link refurb-logout-btn ${isLocked ? "nav-locked" : ""}`}
                                    >
                                        <span className="refurb-sidebar-icon"><FiLogOut /></span>
                                        <span>Sign Out</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                
            </aside>

            {/* Mobile Drawer Overlay */}
            {isMobileOpen && (
                <div 
                    className="refurb-sidebar-overlay" 
                    onClick={() => setIsMobileOpen(false)}
                ></div>
            )}
        </>
    );
}

export default Sidebar;
