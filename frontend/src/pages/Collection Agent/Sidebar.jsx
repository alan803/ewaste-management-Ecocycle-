import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FiTruck,
    FiCalendar,
    FiUser,
    FiLogOut,
    FiPackage,
    FiNavigation,
    FiMenu,
    FiX,
    FiBox,
    FiCheckCircle,
    FiZap,
    FiBell,
    FiAlertTriangle
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

    const navItems = [
        { path: "/collectionagent/dashboard", label: "My Pickup Tasks", icon: <FiTruck /> },
        { path: "/collectionagent/pickups", label: "All Pickups", icon: <FiPackage /> },
        { path: "/agent-profile", label: "Profile", icon: <FiUser /> }
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
                <div>
                    {/* Brand Header */}
                    <Link to="/collectionagent/dashboard" className="agent-sidebar-brand">
                        <div className="agent-brand-badge">
                            <FiTruck />
                        </div>
                        <div>
                            <h1 className="agent-brand-title">EcoCycle</h1>
                            <span className="agent-brand-sub">Collection Agent</span>
                        </div>
                    </Link>

                    {/* Navigation Items */}
                    <div className="agent-sidebar-scroll">
                        <div className="agent-nav-group">
                            <span className="agent-group-title">Navigation</span>
                            <ul className="agent-sidebar-ul">
                                {navItems.map((item) => (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            className={`agent-sidebar-link ${isActive(item.path) ? "active" : ""}`}
                                            onClick={() => setIsMobileOpen(false)}
                                        >
                                            <span className="agent-sidebar-icon">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="agent-nav-group">
                            <span className="agent-group-title">Account</span>
                            <ul className="agent-sidebar-ul">
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="agent-sidebar-link agent-logout-btn"
                                    >
                                        <span className="agent-sidebar-icon"><FiLogOut /></span>
                                        <span>Sign Out</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Vehicle Status Card */}
                <div className="agent-vehicle-card">
                    <div className="agent-vehicle-header">
                        <span>EV FLEET UNIT</span>
                        <FiZap style={{ color: "#10b981" }} />
                    </div>
                    <div className="agent-vehicle-name">E-Truck #KA-05-4092</div>
                    <div className="agent-vehicle-sub">⚡ Battery 88% • Zone South</div>
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
