import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FiTruck,
    FiHome,
    FiPackage,
    FiUser,
    FiLogOut,
    FiMenu,
    FiX,
    FiZap,
    FiCheckCircle,
    FiShield
} from "react-icons/fi";
import axios from "axios";
import "./Sidebar.css";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.get("https://localhost:7102/api/CollectionAgent/myprofile", {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then((res) => {
                if (res.data) {
                    setProfile(res.data);
                }
            })
            .catch(() => {});
        }
    }, []);

    const agentName = profile?.name || 
        profile?.firstName || 
        localStorage.getItem("firstName") || 
        localStorage.getItem("userName") || 
        localStorage.getItem("username") || 
        "Collection Agent";

    const profilePhoto = profile?.photo || profile?.profilePhoto || profile?.photoPath || localStorage.getItem("profilePhoto");

    const userInitial = (agentName || "A").charAt(0).toUpperCase();

    const getMediaUrl = (filename) => {
        if (!filename) return null;
        if (filename.startsWith("http://") || filename.startsWith("https://") || filename.startsWith("blob:")) {
            return filename;
        }
        const cleanName = filename.replace(/^uploads[\\/]/, "").replace(/^[\\/]/, "");
        if (cleanName.includes("/") || cleanName.includes("\\")) {
            return `https://localhost:7102/uploads/${cleanName.replace(/\\/g, "/")}`;
        }
        return `https://localhost:7102/uploads/${cleanName}`;
    };

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

    const accountNavItems = [
        { path: "/agent-profile", label: "My Profile", icon: <FiUser /> }
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

                <div className="agent-sidebar-bottom">
                    {/* Bottom Vehicle Status Card */}
                    <div className="agent-vehicle-card">
                        <div className="agent-vehicle-header">
                            <span className="agent-fleet-lbl">EV FLEET UNIT</span>
                            <span className="agent-fleet-badge"><FiZap /> Active</span>
                        </div>
                        <div className="agent-vehicle-name">{profile?.vehicleNumber || "E-Truck #KA-05-4092"}</div>
                        <div className="agent-vehicle-sub">
                            <span className="agent-bat-dot"></span>
                            <span>Battery 92% • Active Duty</span>
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
