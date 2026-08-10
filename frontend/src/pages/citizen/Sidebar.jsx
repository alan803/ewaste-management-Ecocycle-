import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FiHome,
    FiCalendar,
    FiClock,
    FiUser,
    FiAward,
    FiSettings,
    FiLogOut,
    FiRefreshCw,
    FiMenu,
    FiX,
    FiPlusCircle,
    FiBox,
    FiArrowUpRight
} from "react-icons/fi";
import "./Sidebar.css";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const isActive = (path) => {
        if (path === "/citizen" && location.pathname === "/citizen") return true;
        if (path !== "/citizen" && location.pathname.startsWith(path)) return true;
        return false;
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const menuNavItems = [
        { path: "/citizen", label: "Dashboard", icon: <FiHome /> },
        { path: "/add-device", label: "Add Device", icon: <FiPlusCircle /> },
        { path: "/view-device", label: "My Devices", icon: <FiBox /> },
        { path: "/citizen/pickup", label: "Schedule Pickup", icon: <FiCalendar /> },
        { path: "/citizen/history", label: "Pickup History", icon: <FiClock /> },
        { path: "/citizen/rewards", label: "Eco Rewards", icon: <FiAward /> }
    ];

    const accountNavItems = [
        { path: "/manage-userprofile", label: "My Profile", icon: <FiUser /> }
    ];

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className={`citizen-mobile-toggle ${isMobileOpen ? "open" : ""}`}
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Toggle Navigation"
            >
                {isMobileOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* Sidebar Navigation */}
            <aside className={`citizen-sidebar ${isMobileOpen ? "open" : ""}`}>
                <div>
                    {/* Brand Header */}
                    <div className="sidebar-header">
                        <Link to="/citizen" className="sidebar-logo">
                            <div className="logo-icon-badge">
                                <FiRefreshCw />
                            </div>
                            <div className="logo-text-group">
                                <span className="logo-title">EcoCycle</span>
                                <span className="logo-subtitle">Citizen Portal</span>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="sidebar-scroll-container">
                        <nav className="sidebar-nav">
                            <div className="sidebar-section">
                                <span className="sidebar-section-title">Menu</span>
                                <ul className="sidebar-menu">
                                    {menuNavItems.map((item) => (
                                        <li key={item.path}>
                                            <Link
                                                to={item.path}
                                                className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
                                                onClick={() => setIsMobileOpen(false)}
                                            >
                                                <span className="sidebar-link-icon">{item.icon}</span>
                                                <span>{item.label}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="sidebar-section">
                                <span className="sidebar-section-title">My Account</span>
                                <ul className="sidebar-menu">
                                    {accountNavItems.map((item) => (
                                        <li key={item.path}>
                                            <Link
                                                to={item.path}
                                                className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
                                                onClick={() => setIsMobileOpen(false)}
                                            >
                                                <span className="sidebar-link-icon">{item.icon}</span>
                                                <span>{item.label}</span>
                                            </Link>
                                        </li>
                                    ))}
                                    <li>
                                        <button
                                            onClick={handleLogout}
                                            className="sidebar-link sidebar-logout-btn"
                                        >
                                            <span className="sidebar-link-icon"><FiLogOut /></span>
                                            <span>Log out</span>
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </nav>
                    </div>
                </div>

                {/* Bottom Eco Promo Card */}
                <div className="sidebar-promo-card">
                    <div className="sidebar-promo-title">
                        <span>Eco Impact Reward</span>
                        <FiArrowUpRight style={{ fontSize: "1.1rem" }} />
                    </div>
                    <div className="sidebar-promo-desc">
                        Recycle 3 old electronics this month to earn 500 bonus Eco Points!
                    </div>
                    <div className="sidebar-promo-actions">
                        <span style={{ cursor: "pointer", opacity: 0.8 }}>Dismiss</span>
                        <Link to="/citizen/rewards" className="sidebar-promo-btn">View Rewards</Link>
                    </div>
                </div>
            </aside>

            {/* Mobile Drawer Overlay */}
            {isMobileOpen && (
                <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>
            )}
        </>
    );
}

export default Sidebar;
