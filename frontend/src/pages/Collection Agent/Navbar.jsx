import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FiTruck,
    FiUser,
    FiLogOut,
    FiSearch,
    FiRefreshCw,
    FiBell,
    FiCheckCircle,
    FiPackage,
    FiX
} from "react-icons/fi";

import "./Navbar.css";

function Navbar({
    hasSidebar = false,
    showWelcome = true,
    pageTitle,
    pageSubtitle,
    pageIcon,
    isOnDuty,
    setIsOnDuty,
    searchQuery,
    setSearchQuery,
    onRefresh,
    loading,
    unreadNotifCount: propUnreadNotifCount,
    assignedCount = 0
}) {
    const location = useLocation();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [fetchedUnreadCount, setFetchedUnreadCount] = useState(0);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            fetchProfile(token);
            fetchNotifications(token);
        }
    }, []);

    const fetchNotifications = async (token) => {
        try {
            const response = await axios.get("https://ecocycle.runasp.net/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const notificationsData = Array.isArray(response.data) ? response.data : [];
            const unread = notificationsData.filter((n) => !n.isRead && !n.isread).length;
            setFetchedUnreadCount(unread);
        } catch (err) {
            try {
                const response = await axios.get("https://ecocycle.runasp.net/api/Notification/mynotifications", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const notificationsData = Array.isArray(response.data) ? response.data : [];
                const unread = notificationsData.filter((n) => !n.isRead && !n.isread).length;
                setFetchedUnreadCount(unread);
            } catch (fallbackErr) {
                console.error("Error fetching notifications in Navbar:", fallbackErr);
            }
        }
    };

    const finalUnreadCount = (propUnreadNotifCount !== undefined && propUnreadNotifCount !== null && propUnreadNotifCount > 0)
        ? propUnreadNotifCount
        : fetchedUnreadCount;

    const fetchProfile = async (token) => {
        try {
            const response = await axios.get("https://ecocycle.runasp.net/api/CollectionAgent/myprofile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(response.data || {});
        } catch (err) {
            console.error("Error fetching agent profile for Navbar:", err);
        }
    };

    const getMediaUrl = (filename, folderName = "") => {
        if (!filename) return null;
        if (filename.startsWith("http://") || filename.startsWith("https://") || filename.startsWith("blob:")) {
            return filename;
        }
        const cleanName = filename.replace(/^uploads[\\/]/, "").replace(/^[\\/]/, "");
        if (cleanName.includes("/") || cleanName.includes("\\")) {
            return `https://ecocycle.runasp.net/uploads/${cleanName.replace(/\\/g, "/")}`;
        }
        return folderName
            ? `https://ecocycle.runasp.net/uploads/${folderName}/${cleanName}`
            : `https://ecocycle.runasp.net/uploads/${cleanName}`;
    };

    const rawPic = profile?.Profilepicture || profile?.profilepicture || profile?.profilePicture || profile?.profile_picture;
    const profilePicUrl = getMediaUrl(rawPic, "profile");

    const agentName = (profile?.Name || profile?.name || profile?.FirstName || profile?.firstName)
        ? (profile.Name || profile.name || `${profile.FirstName || profile.firstName || ""} ${profile.LastName || profile.lastName || ""}`).trim()
        : localStorage.getItem("firstName") ||
          localStorage.getItem("userName") ||
          localStorage.getItem("username") ||
          "Field Officer";

    const avatarInitial = agentName.charAt(0).toUpperCase();

    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        navigate("/login");
    };

    const isActive = (path) => {
        if (path === "/collectionagent/dashboard" && (location.pathname === "/collectionagent/dashboard" || location.pathname === "/collectionagent")) return true;
        return location.pathname === path;
    };

    // If used inside a layout with sidebar, render as top dashboard header bar
    if (hasSidebar) {
        return (
            <header className="agent-dashboard-topbar">
                {pageTitle ? (
                    <div className="agent-profile-page-title">
                        {pageIcon && (
                            <div className="agent-title-icon-badge">
                                {pageIcon}
                            </div>
                        )}
                        <div>
                            <h1 className="topbar-title">{pageTitle}</h1>
                            {pageSubtitle && <p className="topbar-subtitle">{pageSubtitle}</p>}
                        </div>
                    </div>
                ) : showWelcome ? (
                    <div className="topbar-welcome-area">
                        <h1 className="topbar-title">Welcome back, {agentName}</h1>
                        <p className="topbar-subtitle">Collection Agent Dashboard • EcoCycle Field Dispatch Network</p>
                    </div>
                ) : null}

                <div className="agent-nav-right">
                    {/* Search Bar Input */}
                    {setSearchQuery !== undefined && (
                        <div className="agent-nav-search-wrap">
                            <FiSearch className="nav-search-icon" />
                            <input
                                type="text"
                                placeholder="Search assigned devices..."
                                value={searchQuery || ""}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="nav-search-clear"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <FiX />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Notifications Bell */}
                    <button
                        type="button"
                        className="agent-nav-action-btn"
                        title={`Notifications ${finalUnreadCount > 0 ? `(${finalUnreadCount} unread)` : ""}`}
                        onClick={() => navigate("/technician-notification")}
                    >
                        <FiBell />
                        {finalUnreadCount > 0 ? (
                            <span className="nav-notif-badge">
                                {finalUnreadCount > 9 ? "9+" : finalUnreadCount}
                            </span>
                        ) : assignedCount > 0 ? (
                            <span className="nav-dot-badge"></span>
                        ) : null}
                    </button>

                    {/* Profile Link Pill */}
                    <Link to="/agent-profile" className="agent-user-badge">
                        <div className="agent-user-avatar">
                            {profilePicUrl ? (
                                <img
                                    src={profilePicUrl}
                                    alt={agentName}
                                    className="agent-avatar-img"
                                    onError={(e) => {
                                        e.target.style.display = "none";
                                        if (e.target.nextSibling) {
                                            e.target.nextSibling.style.display = "flex";
                                        }
                                    }}
                                />
                            ) : null}
                            <span style={{ display: profilePicUrl ? "none" : "flex" }}>
                                {avatarInitial}
                            </span>
                        </div>
                        <div className="agent-user-text">
                            <span className="agent-user-name">{agentName}</span>
                            <span className="agent-user-role">Field Officer</span>
                        </div>
                    </Link>

                    {/* Logout Button */}
                    <button onClick={handleLogout} className="logout-icon-btn" title="Sign Out">
                        <FiLogOut />
                    </button>
                </div>
            </header>
        );
    }

    // Standalone top navigation bar (for pages without sidebar)
    return (
        <header className="agent-navbar">
            <div className="agent-nav-left">
                <Link to="/collectionagent/dashboard" className="agent-nav-brand">
                    <div className="agent-nav-logo">
                        <FiTruck />
                    </div>
                    <div>
                        <h1 className="agent-nav-title">EcoCycle</h1>
                        <span className="agent-nav-subtitle">Collection Agent Portal</span>
                    </div>
                </Link>

                <nav className="agent-nav-links-wrap">
                    <ul className="agent-nav-menu">
                        <li>
                            <Link
                                to="/collectionagent/dashboard"
                                className={`agent-nav-item ${isActive("/collectionagent/dashboard") ? "active" : ""}`}
                            >
                                <FiTruck />
                                <span>My Pickups</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/collectionagent/pickups"
                                className={`agent-nav-item ${isActive("/collectionagent/pickups") ? "active" : ""}`}
                            >
                                <FiPackage />
                                <span>All Agent Pickups</span>
                            </Link>
                        </li>

                        <li>
                            <Link
                                to="/technician-notification"
                                className={`agent-nav-item ${isActive("/technician-notification") ? "active" : ""}`}
                            >
                                <FiBell />
                                <span>Notifications</span>
                                {unreadNotifCount > 0 && (
                                    <span className="nav-notif-pill">{unreadNotifCount}</span>
                                )}
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/agent-profile"
                                className={`agent-nav-item ${isActive("/agent-profile") ? "active" : ""}`}
                            >
                                <FiUser />
                                <span>My Profile</span>
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>

            <div className="agent-nav-right">
                {/* Search Bar Input */}
                {setSearchQuery !== undefined && (
                    <div className="agent-nav-search-wrap">
                        <FiSearch className="nav-search-icon" />
                        <input
                            type="text"
                            placeholder="Search assigned devices..."
                            value={searchQuery || ""}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="nav-search-clear"
                                onClick={() => setSearchQuery("")}
                            >
                                <FiX />
                            </button>
                        )}
                    </div>
                )}

                {/* Notifications Bell */}
                <button
                    type="button"
                    className="agent-nav-action-btn"
                    title={`Notifications ${finalUnreadCount > 0 ? `(${finalUnreadCount} unread)` : ""}`}
                    onClick={() => navigate("/technician-notification")}
                >
                    <FiBell />
                    {finalUnreadCount > 0 ? (
                        <span className="nav-notif-badge">
                            {finalUnreadCount > 9 ? "9+" : finalUnreadCount}
                        </span>
                    ) : assignedCount > 0 ? (
                        <span className="nav-dot-badge"></span>
                    ) : null}
                </button>

                {/* Profile Link Pill */}
                <Link to="/agent-profile" className="agent-user-badge">
                    <div className="agent-user-avatar">
                        {profilePicUrl ? (
                            <img
                                src={profilePicUrl}
                                alt={agentName}
                                className="agent-avatar-img"
                                onError={(e) => {
                                    e.target.style.display = "none";
                                    if (e.target.nextSibling) {
                                        e.target.nextSibling.style.display = "flex";
                                    }
                                }}
                            />
                        ) : null}
                        <span style={{ display: profilePicUrl ? "none" : "flex" }}>
                            {avatarInitial}
                        </span>
                    </div>
                    <div className="agent-user-text">
                        <span className="agent-user-name">{agentName}</span>
                        <span className="agent-user-role">Field Officer</span>
                    </div>
                </Link>

                {/* Logout Button */}
                <button onClick={handleLogout} className="logout-icon-btn" title="Sign Out">
                    <FiLogOut />
                </button>
            </div>
        </header>
    );
}

export default Navbar;
