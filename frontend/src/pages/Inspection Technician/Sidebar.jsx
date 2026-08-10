import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FiHome,
    FiClipboard,
    FiFileText,
    FiUser,
    FiSettings,
    FiLogOut,
    FiCpu,
    FiMenu,
    FiX,
    FiCheckCircle
} from "react-icons/fi";
import "./Sidebar.css";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [userName, setUserName] = useState("Technician");
    const [userInitial, setUserInitial] = useState("T");

    React.useEffect(() => {
        const userStr = localStorage.getItem("user") || localStorage.getItem("userInfo");
        if (userStr) {
            try {
                const u = JSON.parse(userStr);
                const name = `${u.firstName || u.name || "Technician"} ${u.lastName || ""}`.trim();
                if (name) {
                    setUserName(name);
                    setUserInitial(name.charAt(0).toUpperCase());
                }
            } catch (e) {
                console.error("Error parsing user info in Sidebar", e);
            }
        }
    }, []);

    const isActive = (path) => {
        if (path === "/technician_dashboard" && location.pathname === "/technician_dashboard") return true;
        if (path !== "/technician_dashboard" && location.pathname.startsWith(path)) return true;
        return false;
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const menuItems = [
        { path: "/technician_dashboard", label: "Dashboard", icon: <FiHome /> },
        { path: "/technician/inspections", label: "Assigned Devices", icon: <FiClipboard /> },
        { path: "/technician/reports", label: "Inspection Reports", icon: <FiFileText /> }
    ];

    const accountItems = [
        { path: "/technician/profile", label: "My Profile", icon: <FiUser /> },
        { path: "/technician/settings", label: "Settings", icon: <FiSettings /> }
    ];

    return (
        <>
            {/* Mobile Nav Toggle */}
            <button
                className={`clean-mobile-toggle ${isMobileOpen ? "open" : ""}`}
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Toggle Navigation"
            >
                {isMobileOpen ? <FiX /> : <FiMenu />}
            </button>

            {/* Sidebar Navigation */}
            <aside className={`clean-sidebar ${isMobileOpen ? "open" : ""}`}>
                <div className="sidebar-top-section">
                    {/* Brand Logo */}
                    <div className="sidebar-brand">
                        <Link to="/technician_dashboard" className="brand-link">
                            <div className="brand-logo-icon">
                                <FiCpu />
                            </div>
                            <div className="brand-text">
                                <span className="brand-name">EcoCycle</span>
                                <span className="brand-role">Technician Portal</span>
                            </div>
                        </Link>
                    </div>

                    {/* Active Status Badge */}
                    <div className="status-badge-chip">
                        <span className="status-dot"></span>
                        <span>Active Technician</span>
                        <FiCheckCircle className="verified-icon" />
                    </div>

                    {/* Main Navigation */}
                    <nav className="sidebar-nav">
                        <div className="nav-section">
                            <span className="nav-section-title">Menu</span>
                            <ul className="nav-menu">
                                {menuItems.map((item) => (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            className={`nav-link ${isActive(item.path) ? "active" : ""}`}
                                            onClick={() => setIsMobileOpen(false)}
                                        >
                                            <span className="nav-icon">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="nav-section">
                            <span className="nav-section-title">Account</span>
                            <ul className="nav-menu">
                                {accountItems.map((item) => (
                                    <li key={item.path}>
                                        <Link
                                            to={item.path}
                                            className={`nav-link ${isActive(item.path) ? "active" : ""}`}
                                            onClick={() => setIsMobileOpen(false)}
                                        >
                                            <span className="nav-icon">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </nav>
                </div>

                {/* Footer User Info & Logout */}
                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar">{userInitial}</div>
                        <div className="user-info">
                            <span className="user-name">{userName}</span>
                            <span className="user-role">Certified Inspector</span>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout} title="Log Out">
                        <FiLogOut />
                    </button>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>
            )}
        </>
    );
}

export default Sidebar;
