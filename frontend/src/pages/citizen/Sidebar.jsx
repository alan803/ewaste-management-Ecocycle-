import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FiHome,
    FiCalendar,
    FiUser,
    FiAward,
    FiLogOut,
    FiRefreshCw,
    FiMenu,
    FiX,
    FiPlusCircle,
    FiBox,
    FiFileText,
    FiShield,
    FiChevronRight,
    FiBell
} from "react-icons/fi";
import "./Sidebar.css";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [showImpactCard, setShowImpactCard] = useState(true);
    const [userName, setUserName] = useState("Citizen");
    const [userImage, setUserImage] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const cachedName = 
            localStorage.getItem("citizen_fullName") ||
            (localStorage.getItem("firstName") ? `${localStorage.getItem("firstName")} ${localStorage.getItem("lastName") || ""}`.trim() : null) ||
            localStorage.getItem("userName") ||
            localStorage.getItem("username") ||
            localStorage.getItem("name") ||
            "Citizen";
        setUserName(cachedName);

        const cachedImage = 
            localStorage.getItem("citizen_profile_image") ||
            localStorage.getItem("profilePicture") ||
            localStorage.getItem("profileImage");
        if (cachedImage) {
            setUserImage(cachedImage);
        }

        const fetchUserProfile = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;
            try {
                const response = await axios.get("https://localhost:7102/api/User/profile", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = response.data || {};
                const fullName = data.firstName ? `${data.firstName} ${data.lastName || ""}`.trim() : "";
                if (fullName) {
                    setUserName(fullName);
                    localStorage.setItem("citizen_fullName", fullName);
                }
                const img = data.profilePicture || data.profileImage;
                if (img) {
                    const fullImgUrl = (img.startsWith("http") || img.startsWith("data:"))
                        ? img
                        : `https://localhost:7102/uploads/profile/${img}`;
                    setUserImage(fullImgUrl);
                    localStorage.setItem("citizen_profile_image", fullImgUrl);
                }
            } catch (err) {
                console.error("Sidebar profile fetch error:", err);
            }
        };

        const fetchNotifications = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;
            try {
                const response = await axios.get("https://localhost:7102/api/Notificationcon/my_notifications", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const notifs = response.data || [];
                const unread = notifs.filter(n => !n.isRead && !n.isread).length;
                setUnreadCount(unread);
            } catch (err) {
                console.error("Sidebar notifications fetch error:", err);
            }
        };

        fetchUserProfile();
        fetchNotifications();

        const notifTimer = setInterval(fetchNotifications, 15000);
        return () => clearInterval(notifTimer);
    }, [location.pathname]);

    const isActive = (path) => {
        if (path === "/citizen" && location.pathname === "/citizen") return true;
        if (path !== "/citizen" && location.pathname.startsWith(path)) return true;
        return false;
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const mainNavItems = [
        { path: "/citizen", label: "Dashboard", icon: <FiHome /> },
        { path: "/add-device", label: "Add Device", icon: <FiPlusCircle /> },
        { path: "/view-device", label: "My Devices", icon: <FiBox /> },
        { path: "/pickupuser", label: "Pickup Details", icon: <FiCalendar /> }
    ];

    const reportsNavItems = [
        { path: "/citizen/reports", label: "Inspection Reports", icon: <FiFileText /> },
        { path: "/citizen/certificates", label: "Eco Certificates", icon: <FiAward /> }
    ];

    const accountNavItems = [
        { path: "/manage-userprofile", label: "My Profile", icon: <FiUser /> }
    ];

    const getInitial = (nameStr) => {
        return nameStr ? nameStr.charAt(0).toUpperCase() : "C";
    };

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
                <div className="sidebar-top-container">
                    {/* Brand Header */}
                    <div className="sidebar-header">
                        <Link to="/citizen" className="sidebar-logo">
                            <div className="logo-icon-badge">
                                <FiRefreshCw className="logo-spin-icon" />
                            </div>
                            <div className="logo-text-group">
                                <span className="logo-title">EcoCycle</span>
                                <span className="logo-subtitle">Citizen Portal</span>
                            </div>
                        </Link>
                        <button
                            type="button"
                            className="sidebar-notif-btn"
                            title={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
                            onClick={() => {
                                setIsMobileOpen(false);
                                navigate("/technician-notification");
                            }}
                        >
                            <FiBell />
                            {unreadCount > 0 && (
                                <span className="sidebar-notif-badge">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <div className="sidebar-scroll-container">
                        <nav className="sidebar-nav">
                            {/* Main Hub Section */}
                            <div className="sidebar-section">
                                <span className="sidebar-section-title">Main Hub</span>
                                <ul className="sidebar-menu">
                                    {mainNavItems.map((item) => (
                                        <li key={item.path}>
                                            <Link
                                                to={item.path}
                                                className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
                                                onClick={() => setIsMobileOpen(false)}
                                            >
                                                <span className="sidebar-link-icon">{item.icon}</span>
                                                <span className="sidebar-link-text">{item.label}</span>
                                                {item.badge && (
                                                    <span className="sidebar-link-badge notif-badge">{item.badge}</span>
                                                )}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Reports & Impact Section */}
                            <div className="sidebar-section">
                                <span className="sidebar-section-title">Tracking & Impact</span>
                                <ul className="sidebar-menu">
                                    {reportsNavItems.map((item) => (
                                        <li key={item.path}>
                                            <Link
                                                to={item.path}
                                                className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
                                                onClick={() => setIsMobileOpen(false)}
                                            >
                                                <span className="sidebar-link-icon">{item.icon}</span>
                                                <span className="sidebar-link-text">{item.label}</span>
                                                {item.badge && (
                                                    <span className="sidebar-link-badge notif-badge">{item.badge}</span>
                                                )}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Account Settings Section */}
                            <div className="sidebar-section">
                                <span className="sidebar-section-title">Settings</span>
                                <ul className="sidebar-menu">
                                    {accountNavItems.map((item) => (
                                        <li key={item.path}>
                                            <Link
                                                to={item.path}
                                                className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
                                                onClick={() => setIsMobileOpen(false)}
                                            >
                                                <span className="sidebar-link-icon">{item.icon}</span>
                                                <span className="sidebar-link-text">{item.label}</span>
                                                {item.badge && (
                                                    <span className="sidebar-link-badge notif-badge">{item.badge}</span>
                                                )}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </nav>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="sidebar-bottom-container">
                    {/* Eco Impact Mini Card */}
                    {showImpactCard && (
                        <div className="sidebar-impact-card">
                            <div className="impact-card-top">
                                <div className="impact-badge">
                                    <FiShield className="impact-shield-icon" />
                                    <span>Gold Recycler</span>
                                </div>
                                <button
                                    type="button"
                                    className="impact-close-btn"
                                    onClick={() => setShowImpactCard(false)}
                                    title="Dismiss"
                                >
                                    <FiX />
                                </button>
                            </div>
                            <p className="impact-desc">CPCB & RoHS certified e-waste recovery process.</p>
                            <Link to="/citizen/certificates" className="impact-action-link">
                                View Green Proof <FiChevronRight />
                            </Link>
                        </div>
                    )}

                    {/* User Profile Mini Bar */}
                    <div className="sidebar-user-card">
                        <Link to="/manage-userprofile" className="sidebar-user-info" title="Manage Profile">
                            <div className="sidebar-avatar-wrapper">
                                {userImage ? (
                                    <img src={userImage} alt="User Avatar" className="sidebar-avatar-img" />
                                ) : (
                                    <div className="sidebar-avatar-placeholder">
                                        {getInitial(userName)}
                                    </div>
                                )}
                                <span className="sidebar-status-dot" title="Active"></span>
                            </div>
                            <div className="sidebar-user-details">
                                <span className="sidebar-user-name">{userName}</span>
                            </div>
                        </Link>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="sidebar-quick-logout"
                            title="Log Out"
                        >
                            <FiLogOut />
                        </button>
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
