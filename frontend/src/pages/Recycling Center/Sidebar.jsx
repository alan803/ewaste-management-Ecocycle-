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
    FiChevronRight
} from "react-icons/fi";
import "./Sidebar.css";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (path) => {
        const p = location.pathname;
        if ((path === "/recyclingcenter_dashboard" || path === "/recycling_dashboard" || path === "/recyclingenter_dashboard") && 
            (p === "/recyclingcenter_dashboard" || p === "/recycling_dashboard" || p === "/recyclingenter_dashboard")) {
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

    const handleLogout = () => {
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
                    <Link to="/recyclingcenter_dashboard" className="admin-sb-logo-link" onClick={closeMobileMenu}>
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
                                    onClick={closeMobileMenu}
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
                                    onClick={closeMobileMenu}
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
                                    to="/recycle_profile"
                                    className={`admin-sb-link ${isActive("/recycle_profile") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
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
