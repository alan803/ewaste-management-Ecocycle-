import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FiTruck,
    FiHome,
    FiPackage,
    FiUser,
    FiLogOut,
    FiMenu,
    FiX
} from "react-icons/fi";
import "./Sidebar.css";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const isActive = (path) => {
        if (path === "/collectionagent/dashboard" && (location.pathname === "/collectionagent/dashboard" || location.pathname === "/collectionagent")) return true;
        if (path !== "/collectionagent/dashboard" && location.pathname.startsWith(path)) return true;
        return false;
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const mainNavItems = [
        { path: "/collectionagent/dashboard", label: "Dashboard", icon: <FiHome /> },
        { path: "/collectionagent/pickups", label: "My Pickups", icon: <FiPackage /> }
    ];

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className="agent-mobile-toggle"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Toggle Sidebar Navigation"
            >
                {isMobileOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* Sidebar Container */}
            <aside className={`agent-sidebar-aside ${isMobileOpen ? "open" : ""}`}>
                <div className="agent-sidebar-top">
                    {/* Brand Header */}
                    <Link to="/collectionagent/dashboard" className="agent-sidebar-brand" onClick={() => setIsMobileOpen(false)}>
                        <div className="agent-brand-badge">
                            <FiTruck />
                        </div>
                        <div className="agent-brand-info">
                            <h1 className="agent-brand-title">EcoCycle</h1>
                            <span className="agent-brand-sub">Collection Agent</span>
                        </div>
                    </Link>

                    {/* Navigation Items */}
                    <div className="agent-sidebar-scroll">
                        <div className="agent-nav-group">
                            <span className="agent-group-title">Main Menu</span>
                            <ul className="agent-sidebar-ul">
                                {mainNavItems.map((item) => (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            className={`agent-sidebar-link ${isActive(item.path) ? "active" : ""}`}
                                            onClick={() => setIsMobileOpen(false)}
                                        >
                                            <span className="agent-sidebar-icon">{item.icon}</span>
                                            <span className="agent-link-text">{item.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="agent-nav-group">
                            <span className="agent-group-title">Account</span>
                            <ul className="agent-sidebar-ul">
                                <li>
                                    <Link
                                        to="/agent-profile"
                                        className={`agent-sidebar-link ${isActive("/agent-profile") ? "active" : ""}`}
                                        onClick={() => setIsMobileOpen(false)}
                                    >
                                        <span className="agent-sidebar-icon"><FiUser /></span>
                                        <span className="agent-link-text">My Profile</span>
                                    </Link>
                                </li>
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="agent-sidebar-link agent-logout-btn"
                                    >
                                        <span className="agent-sidebar-icon"><FiLogOut /></span>
                                        <span className="agent-link-text">Sign Out</span>
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
                    className="agent-sidebar-overlay" 
                    onClick={() => setIsMobileOpen(false)}
                ></div>
            )}
        </>
    );
}

export default Sidebar;
