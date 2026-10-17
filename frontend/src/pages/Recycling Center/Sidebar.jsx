import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaLeaf } from "react-icons/fa";
import {
    FiRefreshCw,
    FiUser,
    FiLogOut,
    FiMenu,
    FiX,
    FiLayers,
    FiZap,
    FiChevronRight,
    FiTruck,
    FiBarChart2
} from "react-icons/fi";
import "./Sidebar.css";

function Sidebar({ isLocked = false, onBlockedNav }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (path) => {
        const p = location.pathname;
        if ((path === "/recyclingcenter_dashboard" || path === "/recycling_dashboard" || path === "/recyclingenter_dashboard") && 
            (p === "/recyclingcenter_dashboard" || p === "/recycling_dashboard" || p === "/recyclingenter_dashboard")) {
            return true;
        }
        if ((path === "/recycling_analytics" || path === "/recyclingcenter_analytics" || path === "/recycling/analytics") &&
            (p === "/recycling_analytics" || p === "/recyclingcenter_analytics" || p.startsWith("/recycling_analytics") || p.startsWith("/recyclingcenter_analytics") || p.startsWith("/recycling/analytics"))) {
            return true;
        }
        if ((path === "/recycle_profile" || path === "/recyclingcenter_profile") && 
            (p === "/recycle_profile" || p === "/recyclingcenter_profile" || p === "/recycling/profile" || p === "/recyclingcenter/profile")) {
            return true;
        }
        if ((path === "/recyclingcenter_notification" || path === "/recyclingcenter/notifications") &&
            (p.includes("notification"))) {
            return true;
        }
        if (path !== "/recyclingcenter_dashboard" && p.startsWith(path)) return true;
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
        setMobileOpen(false);
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

    const closeMobileMenu = () => {
        setMobileOpen(false);
    };

    return (
        <>
            {/* Mobile Menu Toggle Button */}
            <button className="admin-sb-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle sidebar">
                {mobileOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* Backdrop overlay for mobile */}
            {mobileOpen && <div className="admin-sb-backdrop" onClick={closeMobileMenu}></div>}

            <aside className={`admin-sidebar ${mobileOpen ? "open" : ""}`}>
                {/* Brand Header */}
                <div className="admin-sb-header">
                    <Link to="/recyclingcenter_dashboard" className="admin-sb-logo-link" onClick={(e) => handleNavClick(e, "/recyclingcenter_dashboard")}>
                        <div className="admin-sb-logo-icon">
                            <FaLeaf />
                        </div>
                        <div className="admin-sb-logo-text">
                            <span className="admin-sb-brand-name">EcoCycle</span>
                            <span className="admin-sb-brand-tag">RECYCLING CENTER</span>
                        </div>
                    </Link>
                </div>

                {/* Navigation Links */}
                <nav className="admin-sb-nav">
                    <div className="admin-sb-section">
                        <ul className="admin-sb-menu">
                            <li className="admin-sb-item">
                                <Link
                                    to="/recyclingcenter_dashboard"
                                    className={`admin-sb-link ${isActive("/recyclingcenter_dashboard") ? "active" : ""}`}
                                    onClick={(e) => handleNavClick(e, "/recyclingcenter_dashboard")}
                                >
                                    <div className="admin-sb-icon-box icon-box--emerald">
                                        <FiLayers />
                                    </div>
                                    <span className="admin-sb-link-text">Recycling Queue</span>
                                    {isActive("/recyclingcenter_dashboard") && <FiChevronRight className="admin-sb-chevron" />}
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/recycling_perform"
                                    className={`admin-sb-link ${isActive("/recycling_perform") ? "active" : ""}`}
                                    onClick={(e) => handleNavClick(e, "/recycling_perform")}
                                >
                                    <div className="admin-sb-icon-box icon-box--teal">
                                        <FiZap />
                                    </div>
                                    <span className="admin-sb-link-text">Perform Recycling</span>
                                    {isActive("/recycling_perform") && <FiChevronRight className="admin-sb-chevron" />}
                                </Link>
                            </li>

                            <li className="admin-sb-item">
                                <Link
                                    to="/recycling_delivery"
                                    className={`admin-sb-link ${isActive("/recycling_delivery") ? "active" : ""}`}
                                    onClick={(e) => handleNavClick(e, "/recycling_delivery")}
                                >
                                    <div className="admin-sb-icon-box icon-box--blue">
                                        <FiTruck />
                                    </div>
                                    <span className="admin-sb-link-text">Inbound Deliveries</span>
                                    {isActive("/recycling_delivery") && <FiChevronRight className="admin-sb-chevron" />}
                                </Link>
                            </li>

                            <li className="admin-sb-item">
                                <Link
                                    to="/recycling_analytics"
                                    className={`admin-sb-link ${isActive("/recycling_analytics") ? "active" : ""}`}
                                    onClick={(e) => handleNavClick(e, "/recycling_analytics")}
                                >
                                    <div className="admin-sb-icon-box icon-box--amber">
                                        <FiBarChart2 />
                                    </div>
                                    <span className="admin-sb-link-text">Analytics &amp; Reports</span>
                                    {isActive("/recycling_analytics") && <FiChevronRight className="admin-sb-chevron" />}
                                </Link>
                            </li>

                            <li className="admin-sb-item">
                                <Link
                                    to="/recycle_profile"
                                    className={`admin-sb-link ${isActive("/recycle_profile") ? "active" : ""}`}
                                    onClick={(e) => handleNavClick(e, "/recycle_profile")}
                                >
                                    <div className="admin-sb-icon-box icon-box--purple">
                                        <FiUser />
                                    </div>
                                    <span className="admin-sb-link-text">Facility Profile</span>
                                    {isActive("/recycle_profile") && <FiChevronRight className="admin-sb-chevron" />}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </nav>

                {/* Footer Section */}
                <div className="admin-sb-footer">
                    <button type="button" onClick={handleLogout} className="admin-sb-link admin-sb-link--logout">
                        <div className="admin-sb-icon-box icon-box--rose">
                            <FiLogOut />
                        </div>
                        <span className="admin-sb-link-text">Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;
