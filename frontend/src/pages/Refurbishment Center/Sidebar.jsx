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
    FiShield
} from "react-icons/fi";
import "./Sidebar.css";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const isActive = (path) => {
        const p = location.pathname;
        if ((path === "/refurbishmentcenter_dashboard" || path === "/refurbishment_dashboard" || path === "/refurbishmententer_dashboard") && 
            (p === "/refurbishmentcenter_dashboard" || p === "/refurbishment_dashboard" || p === "/refurbishmententer_dashboard")) {
            return true;
        }
        if (path !== "/refurbishmentcenter_dashboard" && p.startsWith(path)) return true;
        return false;
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const navItems = [
        { path: "/refurbishmentcenter_dashboard", label: "Refurbish Dashboard", icon: <FiCpu /> },
        { path: "/refurbishment_profile", label: "Center Profile", icon: <FiUser /> }
    ];

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
                <div>
                    {/* Brand Header */}
                    <Link to="/refurbishmentcenter_dashboard" className="refurb-sidebar-brand">
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
                                {navItems.map((item) => (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            className={`refurb-sidebar-link ${isActive(item.path) ? "active" : ""}`}
                                            onClick={() => setIsMobileOpen(false)}
                                        >
                                            <span className="refurb-sidebar-icon">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="refurb-nav-group">
                            <span className="refurb-group-title">Account</span>
                            <ul className="refurb-sidebar-ul">
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="refurb-sidebar-link refurb-logout-btn"
                                    >
                                        <span className="refurb-sidebar-icon"><FiLogOut /></span>
                                        <span>Sign Out</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Facility Status Widget */}
                <div className="refurb-status-card">
                    <div className="refurb-status-header">
                        <span>REPAIR BENCH #04</span>
                        <FiActivity style={{ color: "#a78bfa" }} />
                    </div>
                    <div className="refurb-status-name">QC Testing Line</div>
                    <div className="refurb-status-sub">● Facility Operational (6 Techs)</div>
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
