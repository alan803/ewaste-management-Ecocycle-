import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FiRefreshCw,
    FiUser,
    FiLogOut,
    FiMenu,
    FiX,
    FiActivity,
    FiCheckSquare,
    FiShield
} from "react-icons/fi";
import "./Sidebar.css";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const isActive = (path) => {
        const p = location.pathname;
        if ((path === "/recyclingcenter_dashboard" || path === "/recycling_dashboard" || path === "/recyclingenter_dashboard") && 
            (p === "/recyclingcenter_dashboard" || p === "/recycling_dashboard" || p === "/recyclingenter_dashboard")) {
            return true;
        }
        if ((path === "/recycle_profile" || path === "/recyclingcenter_profile") && 
            (p === "/recycle_profile" || p === "/recyclingcenter_profile" || p === "/recycling/profile")) {
            return true;
        }
        if (path !== "/recyclingcenter_dashboard" && p.startsWith(path)) return true;
        return false;
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const navItems = [
        { path: "/recyclingcenter_dashboard", label: "Recycling Dashboard", icon: <FiRefreshCw /> },
        { path: "/recycle_profile", label: "Facility Profile", icon: <FiUser /> }
    ];

    return (
        <>
            {/* Mobile Sidebar Toggle Button */}
            <button
                className="recyc-mobile-toggle"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Toggle Sidebar Navigation"
            >
                {isMobileOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* Sidebar Navigation */}
            <aside className={`recyc-sidebar-aside ${isMobileOpen ? "open" : ""}`}>
                <div>
                    {/* Brand Header */}
                    <Link to="/recyclingcenter_dashboard" className="recyc-sidebar-brand">
                        <div className="recyc-brand-badge">
                            <FiRefreshCw />
                        </div>
                        <div>
                            <h1 className="recyc-brand-title">EcoCycle</h1>
                            <span className="recyc-brand-sub">Recycling Facility</span>
                        </div>
                    </Link>

                    {/* Navigation Items */}
                    <div className="recyc-sidebar-scroll">
                        <div className="recyc-nav-group">
                            <span className="recyc-group-title">Facility Menu</span>
                            <ul className="recyc-sidebar-ul">
                                {navItems.map((item) => (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            className={`recyc-sidebar-link ${isActive(item.path) ? "active" : ""}`}
                                            onClick={() => setIsMobileOpen(false)}
                                        >
                                            <span className="recyc-sidebar-icon">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="recyc-nav-group">
                            <span className="recyc-group-title">Account</span>
                            <ul className="recyc-sidebar-ul">
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="recyc-sidebar-link recyc-logout-btn"
                                    >
                                        <span className="recyc-sidebar-icon"><FiLogOut /></span>
                                        <span>Sign Out</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Plant Status Widget */}
                <div className="recyc-status-card">
                    <div className="recyc-status-header">
                        <span>SMELTING & SHREDDING LINE</span>
                        <FiActivity style={{ color: "#2dd4bf" }} />
                    </div>
                    <div className="recyc-status-name">Eco Shredder #02</div>
                    <div className="recyc-status-sub">● Plant Operational (High Throughput)</div>
                </div>
            </aside>

            {/* Mobile Drawer Overlay */}
            {isMobileOpen && (
                <div 
                    className="recyc-sidebar-overlay" 
                    onClick={() => setIsMobileOpen(false)}
                ></div>
            )}
        </>
    );
}

export default Sidebar;
