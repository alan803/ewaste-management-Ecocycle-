import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { FiTruck, FiUser, FiLogOut, FiPackage, FiCheckCircle } from "react-icons/fi";
import "./Navbar.css";

function Navbar({ isOnDuty, setIsOnDuty }) {
    const location = useLocation();
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            fetchProfile(token);
        }
    }, []);

    const fetchProfile = async (token) => {
        try {
            const response = await axios.get("https://localhost:7102/api/User/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(response.data || {});
        } catch (err) {
            console.error("Error fetching agent profile for Navbar:", err);
        }
    };

    const agentName = profile?.firstName 
        ? `${profile.firstName} ${profile.lastName || ""}`.trim()
        : localStorage.getItem("firstName") || "Agent Officer";

    const isActive = (path) => location.pathname === path;

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

                <nav>
                    <ul className="agent-nav-menu">
                        <li>
                            <Link 
                                to="/collectionagent/dashboard" 
                                className={`agent-nav-item ${isActive("/collectionagent/dashboard") || isActive("/collectionagent") ? "active" : ""}`}
                            >
                                <FiTruck />
                                <span>My Pickups</span>
                            </Link>
                        </li>
                        <li>
                            <Link 
                                to="/manage-userprofile" 
                                className={`agent-nav-item ${isActive("/manage-userprofile") ? "active" : ""}`}
                            >
                                <FiUser />
                                <span>My Profile</span>
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>

            <div className="agent-nav-right">
                {/* On-Duty / Offline toggle pill */}
                {setIsOnDuty && (
                    <div 
                        className="duty-toggle-btn"
                        onClick={() => setIsOnDuty(!isOnDuty)}
                        title="Click to toggle On-Duty / Offline status"
                    >
                        <div className={`duty-dot ${!isOnDuty ? "off" : ""}`}></div>
                        <span className="duty-label">{isOnDuty ? "On-Duty" : "Offline"}</span>
                    </div>
                )}

                {/* Profile Link Pill */}
                <Link to="/manage-userprofile" className="agent-user-badge">
                    <div className="agent-user-avatar">
                        {agentName.charAt(0).toUpperCase()}
                    </div>
                    <span className="agent-user-name">{agentName}</span>
                </Link>

                {/* Logout Button */}
                <Link to="/logout" className="logout-icon-btn" title="Sign Out">
                    <FiLogOut />
                </Link>
            </div>
        </header>
    );
}

export default Navbar;
