import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import { FaLeaf } from "react-icons/fa";
import {
    FiUsers,
    FiPackage,
    FiCheckCircle,
    FiTruck,
    FiSearch,
    FiBell,
    FiLogOut,
    FiUserPlus,
    FiBarChart2,
    FiSettings,
    FiArrowRight,
    FiClock,
    FiTrendingUp,
    FiChevronRight,
    FiZap,
    FiShield,
    FiCpu,
    FiFilter,
    FiEye,
    FiArrowUpRight,
    FiActivity,
    FiLayers
} from "react-icons/fi";
import "./Admindashboard.css";

function AdminDashboard() {
    const [activeFilter, setActiveFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTimeframe, setSelectedTimeframe] = useState("This Week");

    const initialPickups = [
        { id: "#PU001", user: "John Doe", type: "Electronics", categoryIcon: "💻", status: "Pending", date: "Jan 15, 2024", priority: "High" },
        { id: "#PU002", user: "Jane Smith", type: "Plastic", categoryIcon: "♻️", status: "Assigned", date: "Jan 15, 2024", priority: "Normal" },
        { id: "#PU003", user: "Bob Johnson", type: "Metal", categoryIcon: "⚙️", status: "Completed", date: "Jan 14, 2024", priority: "Low" },
        { id: "#PU004", user: "Alice Brown", type: "Paper", categoryIcon: "📦", status: "Pending", date: "Jan 14, 2024", priority: "Normal" },
        { id: "#PU005", user: "Charlie Davis", type: "Electronics", categoryIcon: "📱", status: "In Progress", date: "Jan 13, 2024", priority: "High" },
    ];

    const filteredPickups = initialPickups.filter((item) => {
        const matchesStatus =
            activeFilter === "All" ||
            item.status.toLowerCase() === activeFilter.toLowerCase() ||
            (activeFilter === "In Progress" && item.status === "In Progress");

        const matchesSearch =
            item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.type.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesStatus && matchesSearch;
    });
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(
                "https://localhost:7102/api/Login/alluser"
            );

            setUsers(response.data);
        } catch (error) {
            console.error("Failed to load users:", error);
        } finally {
            setLoadingUsers(false);
        }
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case "Pending":
                return <span className="status-pill status-pill--pending"><span className="status-beacon"></span>Pending</span>;
            case "Assigned":
                return <span className="status-pill status-pill--assigned"><span className="status-beacon"></span>Assigned</span>;
            case "Completed":
                return <span className="status-pill status-pill--completed"><span className="status-beacon"></span>Completed</span>;
            case "In Progress":
                return <span className="status-pill status-pill--progress"><span className="status-beacon"></span>In Progress</span>;
            default:
                return <span className="status-pill">{status}</span>;
        }
    };

    return (
        <div className="admin-dashboard-v2">
            <Navbar />
            <div className="admin-main-container">
                {/* Background Ambient Mesh Glow */}
                <div className="ambient-glow ambient-glow--1"></div>
                <div className="ambient-glow ambient-glow--2"></div>

                {/* Top Floating Glass Header */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <div className="command-brand">
                            <span className="command-badge">
                                <span className="live-dot"></span> SYSTEM ONLINE
                            </span>
                            <h1>EcoCommand Overview</h1>
                        </div>
                        <p className="command-subtitle">
                            Real-time e-waste operational control center &amp; environmental dashboard
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search ID, user or material..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span className="search-shortcut">⌘K</span>
                        </div>

                        <div className="topbar-actions">
                            <button className="glass-btn notification-btn" title="System Alerts">
                                <FiBell />
                                <span className="pulse-ping"></span>
                            </button>

                            <div className="user-profile-chip">
                                <div className="avatar-gradient">A</div>
                                <div className="user-info-text">
                                    <span className="name">Admin User</span>
                                    <span className="role">Super Admin</span>
                                </div>
                            </div>

                            <Link to="/logout" className="logout-btn-v2" title="Logout">
                                <FiLogOut />
                                <span>Exit</span>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Metric Overview Grid */}
                <section className="metrics-grid">
                    <div className="metric-tile metric-tile--emerald">
                        <div className="tile-glow"></div>
                        <div className="tile-top">
                            <div className="tile-icon-box">
                                <FiUsers />
                            </div>
                            <span className="trend-badge trend-badge--up">
                                <FiTrendingUp /> +14.2%
                            </span>
                        </div>
                        <div className="tile-body">
                            <span className="tile-label">Total Registered Users</span>
                            <div className="tile-value-row">
                                <h2>{loadingUsers ? "..." : users.length}</h2>
                                <span className="tile-unit">Citizens &amp; Hubs</span>
                            </div>
                        </div>
                        <div className="tile-footer">
                            <div className="spark-bar"><div className="spark-fill" style={{ width: "78%" }}></div></div>
                            <span className="spark-text">+148 new this week</span>
                        </div>
                    </div>

                    <div className="metric-tile metric-tile--amber">
                        <div className="tile-glow"></div>
                        <div className="tile-top">
                            <div className="tile-icon-box">
                                <FiClock />
                            </div>
                            <span className="trend-badge trend-badge--urgent">
                                Action Needed
                            </span>
                        </div>
                        <div className="tile-body">
                            <span className="tile-label">Pending Pickups</span>
                            <div className="tile-value-row">
                                <h2>45</h2>
                                <span className="tile-unit">Unassigned</span>
                            </div>
                        </div>
                        <div className="tile-footer">
                            <div className="spark-bar"><div className="spark-fill spark-fill--amber" style={{ width: "42%" }}></div></div>
                            <span className="spark-text">Avg response: 18 mins</span>
                        </div>
                    </div>

                    <div className="metric-tile metric-tile--teal">
                        <div className="tile-glow"></div>
                        <div className="tile-top">
                            <div className="tile-icon-box">
                                <FiCheckCircle />
                            </div>
                            <span className="trend-badge trend-badge--up">
                                <FiTrendingUp /> +8.5%
                            </span>
                        </div>
                        <div className="tile-body">
                            <span className="tile-label">Completed Pickups</span>
                            <div className="tile-value-row">
                                <h2>892</h2>
                                <span className="tile-unit">Requests</span>
                            </div>
                        </div>
                        <div className="tile-footer">
                            <div className="spark-bar"><div className="spark-fill spark-fill--teal" style={{ width: "91%" }}></div></div>
                            <span className="spark-text">98.2% satisfaction</span>
                        </div>
                    </div>

                    <div className="metric-tile metric-tile--indigo">
                        <div className="tile-glow"></div>
                        <div className="tile-top">
                            <div className="tile-icon-box">
                                <FiTruck />
                            </div>
                            <span className="trend-badge trend-badge--active">
                                67 Active
                            </span>
                        </div>
                        <div className="tile-body">
                            <span className="tile-label">Field Agents</span>
                            <div className="tile-value-row">
                                <h2>67</h2>
                                <span className="tile-unit">On Route</span>
                            </div>
                        </div>
                        <div className="tile-footer">
                            <div className="spark-bar"><div className="spark-fill spark-fill--indigo" style={{ width: "65%" }}></div></div>
                            <span className="spark-text">Coverage: 94% Districts</span>
                        </div>
                    </div>
                </section>

                {/* Environmental Performance & Material Breakdown Hub */}
                <section className="eco-hub-section">
                    <div className="hub-card eco-impact-card">
                        <div className="hub-card-header">
                            <div className="hub-title-group">
                                <FaLeaf className="hub-title-icon" />
                                <h3>Environmental Savings &amp; Impact</h3>
                            </div>
                            <span className="timeframe-pill">Monthly Audit</span>
                        </div>
                        <div className="impact-widgets-grid">
                            <div className="impact-stat-box">
                                <div className="stat-circle-gauge" style={{ background: "conic-gradient(#10b981 0% 74%, #e2e8f0 74% 100%)" }}>
                                    <div className="gauge-inner">
                                        <span>74%</span>
                                    </div>
                                </div>
                                <div className="gauge-info">
                                    <span className="gauge-value">14.8 Tons</span>
                                    <span className="gauge-label">E-Waste Diverted</span>
                                    <small className="gauge-target">Goal: 20 Tons</small>
                                </div>
                            </div>

                            <div className="impact-stat-box">
                                <div className="stat-circle-gauge" style={{ background: "conic-gradient(#3b82f6 0% 86%, #e2e8f0 86% 100%)" }}>
                                    <div className="gauge-inner">
                                        <span>86%</span>
                                    </div>
                                </div>
                                <div className="gauge-info">
                                    <span className="gauge-value">32.5 Tons</span>
                                    <span className="gauge-label">CO₂ Footprint Saved</span>
                                    <small className="gauge-target">Equivalent to 1.4k trees</small>
                                </div>
                            </div>

                            <div className="impact-stat-box">
                                <div className="stat-circle-gauge" style={{ background: "conic-gradient(#6366f1 0% 98%, #e2e8f0 98% 100%)" }}>
                                    <div className="gauge-inner">
                                        <span>98%</span>
                                    </div>
                                </div>
                                <div className="gauge-info">
                                    <span className="gauge-value">98.4%</span>
                                    <span className="gauge-label">Material Recovery Rate</span>
                                    <small className="gauge-target">Refurbish &amp; Recycle</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Dashboard Core Split View */}
                <section className="dashboard-content-split">
                    {/* Left Column: Recent Requests Table */}
                    <div className="panel-card table-panel">
                        <div className="panel-header">
                            <div>
                                <h3 className="panel-title">Recent Pickup Requests</h3>
                                <p className="panel-subtitle">Monitor and process incoming citizen e-waste submissions</p>
                            </div>
                            <div className="panel-actions">
                                <div className="filter-pill-group">
                                    {["All", "Pending", "Assigned", "In Progress", "Completed"].map((tab) => (
                                        <button
                                            key={tab}
                                            className={`pill-btn ${activeFilter === tab ? "pill-btn--active" : ""}`}
                                            onClick={() => setActiveFilter(tab)}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                <Link to="/admin/pickups" className="view-all-link">
                                    <span>View All</span>
                                    <FiArrowUpRight />
                                </Link>
                            </div>
                        </div>

                        <div className="glass-table-wrapper">
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Request ID</th>
                                        <th>User &amp; Contact</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Submission Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPickups.length > 0 ? (
                                        filteredPickups.map((item) => (
                                            <tr key={item.id} className="table-row-hover">
                                                <td className="id-cell">{item.id}</td>
                                                <td>
                                                    <div className="user-profile-cell">
                                                        <div className="user-avatar-mini">{item.user.charAt(0)}</div>
                                                        <span className="user-name">{item.user}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="material-chip">
                                                        <span className="chip-icon">{item.categoryIcon}</span>
                                                        <span>{item.type}</span>
                                                    </span>
                                                </td>
                                                <td>{getStatusBadge(item.status)}</td>
                                                <td className="date-cell">{item.date}</td>
                                                <td>
                                                    <Link to="/admin/pickups" className="row-action-btn" title="View details">
                                                        <FiEye />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="no-data-cell">
                                                No disposal requests matching your criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Column: Quick Action Tiles & Activity Stream */}
                    <div className="right-sidebar-column">
                        {/* Quick Command Launcher */}
                        <div className="panel-card quick-launcher-panel">
                            <div className="panel-header">
                                <div>
                                    <h3 className="panel-title">Quick Actions</h3>
                                    <p className="panel-subtitle">Instant administrative shortcuts</p>
                                </div>
                            </div>

                            <div className="action-tiles-grid">
                                <Link to="/admin/assign-pickups" className="action-tile action-tile--blue">
                                    <div className="tile-icon-container">
                                        <FiUserPlus />
                                    </div>
                                    <div className="tile-text">
                                        <h4>Assign Pickup</h4>
                                        <p>Dispatch agent to request</p>
                                    </div>
                                    <FiChevronRight className="tile-arrow" />
                                </Link>

                                <Link to="/manage-users" className="action-tile action-tile--emerald">
                                    <div className="tile-icon-container">
                                        <FiUsers />
                                    </div>
                                    <div className="tile-text">
                                        <h4>Manage Users</h4>
                                        <p>Citizens &amp; partner accounts</p>
                                    </div>
                                    <FiChevronRight className="tile-arrow" />
                                </Link>

                                <Link to="/admin/reports" className="action-tile action-tile--purple">
                                    <div className="tile-icon-container">
                                        <FiBarChart2 />
                                    </div>
                                    <div className="tile-text">
                                        <h4>View Reports</h4>
                                        <p>Analytics &amp; waste logs</p>
                                    </div>
                                    <FiChevronRight className="tile-arrow" />
                                </Link>

                                <Link to="/admin/settings" className="action-tile action-tile--slate">
                                    <div className="tile-icon-container">
                                        <FiSettings />
                                    </div>
                                    <div className="tile-text">
                                        <h4>Settings</h4>
                                        <p>System configuration</p>
                                    </div>
                                    <FiChevronRight className="tile-arrow" />
                                </Link>
                            </div>
                        </div>

                        {/* Live Operational Stream */}
                        <div className="panel-card activity-stream-panel">
                            <div className="panel-header">
                                <div className="activity-title-row">
                                    <FiActivity className="pulse-icon-green" />
                                    <h3 className="panel-title">Live Operational Stream</h3>
                                </div>
                                <span className="live-pill">Realtime</span>
                            </div>

                            <div className="timeline-stream">
                                <div className="timeline-event">
                                    <div className="event-marker event-marker--success">
                                        <FiCheckCircle />
                                    </div>
                                    <div className="event-details">
                                        <p>Pickup <strong>#PU003</strong> processed by Recycling Center 1</p>
                                        <span className="event-timestamp">12 mins ago</span>
                                    </div>
                                </div>

                                <div className="timeline-event">
                                    <div className="event-marker event-marker--progress">
                                        <FiTruck />
                                    </div>
                                    <div className="event-details">
                                        <p>Agent <strong>Alex Rivera</strong> accepted request #PU005</p>
                                        <span className="event-timestamp">28 mins ago</span>
                                    </div>
                                </div>

                                <div className="timeline-event">
                                    <div className="event-marker event-marker--info">
                                        <FiUserPlus />
                                    </div>
                                    <div className="event-details">
                                        <p>New technician account registered: <strong>David Vance</strong></p>
                                        <span className="event-timestamp">1 hour ago</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default AdminDashboard;