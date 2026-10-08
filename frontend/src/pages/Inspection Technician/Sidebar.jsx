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
    FiCheckCircle,
    FiTruck,
    FiCheckSquare,
    FiBell,
    FiAlertTriangle
} from "react-icons/fi";
import "./Sidebar.css";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [userName, setUserName] = useState(() => {
        return localStorage.getItem("firstName") ||
               localStorage.getItem("userName") ||
               localStorage.getItem("username") ||
               localStorage.getItem("name") ||
               "Technician";
    });
    const [profilePhoto, setProfilePhoto] = useState(() => {
        return localStorage.getItem("profilePhoto") || localStorage.getItem("userPhoto") || null;
    });

    const userInitial = (userName || "T").charAt(0).toUpperCase();

    const getMediaUrl = (filename, folderName = "ProfilePhotos") => {
        if (!filename) return null;
        if (filename.startsWith("data:") || filename.startsWith("blob:") || filename.startsWith("http://") || filename.startsWith("https://")) {
            return filename;
        }
        const cleanName = filename.replace(/^uploads[\\/]/, "").replace(/^[\\/]/, "");
        if (cleanName.includes("/") || cleanName.includes("\\")) {
            return `https://ecocycle.runasp.net/uploads/${cleanName.replace("\\", "/")}`;
        }
        return `https://ecocycle.runasp.net/uploads/technicians/${folderName}/${cleanName}`;
    };

    React.useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            fetch("https://ecocycle.runasp.net/api/Technician/myprofile", {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data) {
                    const fName = data.firstName || data.FirstName || "";
                    const lName = data.lastName || data.LastName || "";
                    const fullName = `${fName} ${lName}`.trim() || data.name || data.Name;
                    const photo = data.photo || data.Photo || data.profilePhoto || data.ProfilePhoto || data.photoPath;

                    if (fullName) setUserName(fullName);
                    if (photo) {
                        setProfilePhoto(photo);
                        localStorage.setItem("profilePhoto", photo);
                    }
                }
            })
            .catch(() => {});
        }
    }, []);

    const isActive = (path) => {
        if (path === "/technician_dashboard" && (location.pathname === "/technician_dashboard" || location.pathname === "/technician/inspect")) return true;
        if (path !== "/technician_dashboard" && location.pathname.startsWith(path)) return true;
        return false;
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    const mainMenuItems = [
        { path: "/technician_dashboard", label: "Dashboard", icon: <FiHome /> }
    ];

    const inspectionItems = [
        { path: "/technician/device-inspection", label: "Device Inspection", icon: <FiCheckSquare /> },
        { path: "/technician/deliveries", label: "Track Deliveries", icon: <FiTruck /> },
        { path: "/technician/reports", label: "Inspection Reports", icon: <FiFileText /> },
        { path: "/technician/penalties", label: "My Penalties", icon: <FiAlertTriangle /> }
    ];

    const accountItems = [
        { path: "/technician/profile", label: "My Profile", icon: <FiUser /> }
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

                    {/* Main Navigation */}
                    <nav className="sidebar-nav">
                        <div className="nav-section">
                            <span className="nav-section-title">Menu</span>
                            <ul className="nav-menu">
                                {mainMenuItems.map((item) => (
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

                        {/* Device Inspection Section */}
                        <div className="nav-section">
                            <span className="nav-section-title">Device Inspection</span>
                            <ul className="nav-menu">
                                {inspectionItems.map((item) => (
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
                        <div className="user-avatar" style={{ overflow: "hidden", borderRadius: "50%" }}>
                            {profilePhoto ? (
                                <img
                                    src={getMediaUrl(profilePhoto, "ProfilePhotos")}
                                    alt={userName}
                                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        setProfilePhoto(null);
                                    }}
                                />
                            ) : (
                                userInitial
                            )}
                        </div>
                        <div className="user-info">
                            <span className="user-name" title={userName}>{userName}</span>
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
