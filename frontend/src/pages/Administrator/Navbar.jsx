import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaLeaf, FaLaptop } from "react-icons/fa";
import {
    FiGrid,
    FiUsers,
    FiPackage,
    FiTruck,
    FiMapPin,
    FiBarChart2,
    FiShield,
    FiSettings,
    FiLogOut,
    FiMenu,
    FiX,
    FiUserCheck,
    FiUserPlus,
    FiChevronRight,
    FiChevronDown,
    FiUser,
    FiCpu,
    FiTool,
    FiRefreshCw,
    FiClipboard 
} from "react-icons/fi";
import "./Navbar.css";

function Navbar() {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (path) => {
        if (path === "/admin") {
            return location.pathname === "/admin" || location.pathname === "/admin/";
        }
        return location.pathname === path || location.pathname.startsWith(path + "/");
    };

    const isUserMgmtActive =
        isActive("/usermanagement") ||
        isActive("/manage-collectionagent") ||
        isActive("/manage-refurbishmentcenter") ||
        isActive("/manage-technicians") ||
        isActive("/manage-recyclingcenter") ||
        location.pathname.startsWith("/view-");

    const isManageAccountsActive =
        isActive("/manage-users") ||
        isActive("/manage-collectionagents") ||
        isActive("/manage-refurbishmentcenters") ||
        isActive("/manage-recyclingcenters") ||
        isActive("/manage-technicians-list");

    const [userMgmtOpen, setUserMgmtOpen] = useState(false);
    const [manageAccountsOpen, setManageAccountsOpen] = useState(false);

    const toggleMobileMenu = () => {
        setMobileOpen(!mobileOpen);
    };

    const closeMobileMenu = () => {
        setMobileOpen(false);
    };

    const handleSublinkClick = () => {
        setUserMgmtOpen(false);
        closeMobileMenu();
    };

    const handleManageAccountsSublinkClick = () => {
        setManageAccountsOpen(false);
        closeMobileMenu();
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
                    <div className="admin-sb-section">
                        <span className="admin-sb-section-title">Main Control</span>
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

                            {/* User Management Collapsible Section */}
                            <li className={`admin-sb-item admin-sb-has-submenu ${userMgmtOpen ? "expanded" : ""}`}>
                                <div
                                    className={`admin-sb-link ${isUserMgmtActive ? "active" : ""}`}
                                    onClick={() => setUserMgmtOpen(!userMgmtOpen)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="admin-sb-icon-box icon-box--blue">
                                        <FiUserCheck />
                                    </div>
                                    <span className="admin-sb-link-text">Account Approvals</span>
                                    <button
                                        type="button"
                                        className="admin-sb-chevron-btn"
                                        aria-label="Toggle User Management sub-menu"
                                    >
                                        <FiChevronDown className={`admin-sb-chevron-icon ${userMgmtOpen ? "rotate" : ""}`} />
                                    </button>
                                </div>

                                {userMgmtOpen && (
                                    <div className="admin-sb-submenu-wrapper">
                                        {/* Submenu Items List */}
                                        <ul className="admin-sb-submenu">
                                            <li>
                                                <Link
                                                    to="/manage-collectionagent"
                                                    className={`admin-sb-sublink ${isActive("/manage-collectionagent") || location.pathname.startsWith("/view-collectionagent") ? "active" : ""}`}
                                                    onClick={handleSublinkClick}
                                                >
                                                    <FiTruck className="sublink-icon icon--amber" />
                                                    <span>Collection Agent</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    to="/manage-technicians"
                                                    className={`admin-sb-sublink ${isActive("/manage-technicians") || location.pathname.startsWith("/view-technician") ? "active" : ""}`}
                                                    onClick={handleSublinkClick}
                                                >
                                                    <FiTool className="sublink-icon icon--cyan" />
                                                    <span>Technician</span>
                                                </Link>
                                            </li>
                                             <li>
                                                <Link
                                                    to="/manage-recyclingcenter"
                                                    className={`admin-sb-sublink ${isActive("/manage-recyclingcenter") || location.pathname.startsWith("/view-recycling") ? "active" : ""}`}
                                                    onClick={handleSublinkClick}
                                                >
                                                    <FiRefreshCw className="sublink-icon icon--teal" />
                                                    <span>Recycling Center</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    to="/manage-refurbishmentcenter"
                                                    className={`admin-sb-sublink ${isActive("/manage-refurbishmentcenter") || location.pathname.startsWith("/view-refurbishmentcenter") ? "active" : ""}`}
                                                    onClick={handleSublinkClick}
                                                >
                                                    <FiCpu className="sublink-icon icon--purple" />
                                                    <span>Refurbishment Center</span>
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </li>

                            {/* Manage Accounts Collapsible Section */}
                            <li className={`admin-sb-item admin-sb-has-submenu ${manageAccountsOpen ? "expanded" : ""}`}>
                                <div
                                    className={`admin-sb-link ${isManageAccountsActive ? "active" : ""}`}
                                    onClick={() => setManageAccountsOpen(!manageAccountsOpen)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="admin-sb-icon-box icon-box--indigo">
                                        <FiUsers />
                                    </div>
                                    <span className="admin-sb-link-text">Manage Accounts</span>
                                    <button
                                        type="button"
                                        className="admin-sb-chevron-btn"
                                        aria-label="Toggle Manage Accounts sub-menu"
                                    >
                                        <FiChevronDown className={`admin-sb-chevron-icon ${manageAccountsOpen ? "rotate" : ""}`} />
                                    </button>
                                </div>

                                {manageAccountsOpen && (
                                    <div className="admin-sb-submenu-wrapper">
                                        <ul className="admin-sb-submenu">
                                            <li>
                                                <Link
                                                    to="/manage-users"
                                                    className={`admin-sb-sublink ${isActive("/manage-users") ? "active" : ""}`}
                                                    onClick={handleManageAccountsSublinkClick}
                                                >
                                                    <FiUser className="sublink-icon icon--emerald" />
                                                    <span>Citizen</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    to="/managetechnicians"
                                                    className={`admin-sb-sublink ${isActive("/managetechnicians") ? "active" : ""}`}
                                                    onClick={handleManageAccountsSublinkClick}
                                                >
                                                    <FiTool className="sublink-icon icon--cyan" />
                                                    <span>Technician</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    to="/manage-collectionagents"
                                                    className={`admin-sb-sublink ${isActive("/manage-collectionagents") ? "active" : ""}`}
                                                    onClick={handleManageAccountsSublinkClick}
                                                >
                                                    <FiTruck className="sublink-icon icon--amber" />
                                                    <span>Collection Agent</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    to="/manage-recyclingcenters"
                                                    className={`admin-sb-sublink ${isActive("/manage-recyclingcenters") ? "active" : ""}`}
                                                    onClick={handleManageAccountsSublinkClick}
                                                >
                                                    <FiRefreshCw className="sublink-icon icon--teal" />
                                                    <span>Recycling Center</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link
                                                    to="/manage-refurbishment"
                                                    className={`admin-sb-sublink ${isActive("/manage-refurbishment") ? "active" : ""}`}
                                                    onClick={handleManageAccountsSublinkClick}
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
                                <Link
                                    to="/manage-device"
                                    className={`admin-sb-link ${isActive("/manage-device") || isActive("/admin/device") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--purple">
                                        <FaLaptop />
                                    </div>
                                    <span className="admin-sb-link-text">Manage Device</span>
                                    {(isActive("/manage-device") || isActive("/admin/device")) && <FiChevronRight className="admin-sb-chevron" />}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="admin-sb-section">
                        <span className="admin-sb-section-title">Pickup Operations</span>
                        <ul className="admin-sb-menu">
                            <li className="admin-sb-item">
                                <Link
                                    to="/collectionagent-pickup"
                                    className={`admin-sb-link ${isActive("/admin/pickups") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--amber">
                                        <FiPackage />
                                    </div>
                                    <span className="admin-sb-link-text">Pickup Requests</span>
                                    {isActive("/admin/pickups") && <FiChevronRight className="admin-sb-chevron" />}
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/manage-assignmentandpickups"
                                    className={`admin-sb-link ${
                                        isActive("/manage-assignmentandpickups") ? "active" : ""
                                    }`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--cyan">
                                        <FiClipboard />
                                    </div>

                                    <span className="admin-sb-link-text">
                                        Manage Assignments
                                    </span>

                                    {isActive("/manage-assignmentandpickups") && (
                                        <FiChevronRight className="admin-sb-chevron" />
                                    )}
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/admin/tracking"
                                    className={`admin-sb-link ${isActive("/admin/tracking") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--purple">
                                        <FiMapPin />
                                    </div>
                                    <span className="admin-sb-link-text">Pickup Tracking</span>
                                    {isActive("/admin/tracking") && <FiChevronRight className="admin-sb-chevron" />}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="admin-sb-section">
                        <span className="admin-sb-section-title">Analytics &amp; Security</span>
                        <ul className="admin-sb-menu">
                            <li className="admin-sb-item">
                                <Link
                                    to="/admin/reports"
                                    className={`admin-sb-link ${isActive("/admin/reports") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--teal">
                                        <FiBarChart2 />
                                    </div>
                                    <span className="admin-sb-link-text">Reports &amp; Analytics</span>
                                    {isActive("/admin/reports") && <FiChevronRight className="admin-sb-chevron" />}
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/admin/audit"
                                    className={`admin-sb-link ${isActive("/admin/audit") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--slate">
                                        <FiShield />
                                    </div>
                                    <span className="admin-sb-link-text">Audit Logs</span>
                                    {isActive("/admin/audit") && <FiChevronRight className="admin-sb-chevron" />}
                                </Link>
                            </li>
                            <li className="admin-sb-item">
                                <Link
                                    to="/admin/settings"
                                    className={`admin-sb-link ${isActive("/admin/settings") ? "active" : ""}`}
                                    onClick={closeMobileMenu}
                                >
                                    <div className="admin-sb-icon-box icon-box--gray">
                                        <FiSettings />
                                    </div>
                                    <span className="admin-sb-link-text">Settings</span>
                                    {isActive("/admin/settings") && <FiChevronRight className="admin-sb-chevron" />}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </nav>

                {/* Footer Section */}
                <div className="admin-sb-footer">
                    <div className="admin-sb-health-pill">
                        <span className="admin-sb-health-dot"></span>
                        <span className="admin-sb-health-text">v2.4 • System Normal</span>
                    </div>

                    <Link to="/logout" className="admin-sb-link admin-sb-link--logout">
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