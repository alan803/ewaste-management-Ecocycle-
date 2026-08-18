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

    const [users, setUsers] = useState([]);
    const [collectionAgents, setCollectionAgents] = useState([]);
    const [devices, setDevices] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllDashboardData();
    }, []);

    const fetchAllDashboardData = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        try {
            const [usersRes, agentsRes, devicesRes, assignmentsRes] = await Promise.allSettled([
                axios.get("https://localhost:7102/api/Login/alluser"),
                axios.get("https://localhost:7102/api/CollectionAgent/alluser", authHeader)
                    .catch(() => axios.get("https://localhost:7102/api/CollectionAgent/All", authHeader)),
                axios.get("https://localhost:7102/api/Device/All", authHeader),
                axios.get("https://localhost:7102/api/CollectionAssignment/admin/all-assignments", authHeader)
            ]);

            if (usersRes.status === "fulfilled") setUsers(usersRes.value.data || []);
            if (agentsRes.status === "fulfilled") setCollectionAgents(agentsRes.value.data || []);
            if (devicesRes.status === "fulfilled") setDevices(devicesRes.value.data || []);
            if (assignmentsRes.status === "fulfilled") setAssignments(assignmentsRes.value.data || []);
        } catch (error) {
            console.error("Failed to load admin dashboard metrics:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Metric Overview Card Values
    const totalUsersCount = users.length;

    const pendingDevices = devices.filter((d) => {
        const st = (d.lifecycleStatus || d.status || "").toLowerCase();
        return st === "pending" || st === "collectionpending" || st === "waiting" || st === "unassigned";
    });
    const pendingPickupsCount = pendingDevices.length;

    const completedDevices = devices.filter((d) => {
        const st = (d.lifecycleStatus || d.status || "").toLowerCase();
        return st === "completed" || st === "collected" || st === "recycled" || st === "refurbished";
    });
    const completedPickupsCount = completedDevices.length;

    const activeAgents = collectionAgents.filter((a) => {
        const st = (a.status || a.Status || "").toLowerCase();
        return st === "active" || st === "approved";
    });
    const activeAgentsCount = activeAgents.length;
    const totalAgentsCount = collectionAgents.length;

    // Environmental Impact Calculations
    const totalQuantity = devices.reduce((sum, d) => sum + (d.quantity || d.Quantity || 1), 0);
    const completedQuantity = completedDevices.reduce((sum, d) => sum + (d.quantity || d.Quantity || 1), 0);

    // E-Waste Diverted (Avg weight ~12.5kg per device)
    const divertedKg = completedQuantity * 12.5;
    const divertedTonsVal = divertedKg / 1000;
    const divertedTonsDisplay = divertedTonsVal >= 1 ? `${divertedTonsVal.toFixed(1)} Tons` : `${divertedKg.toFixed(0)} kg`;
    const divertedGoalTons = 20;
    const divertedPercent = Math.min(100, Math.round((divertedTonsVal / divertedGoalTons) * 100)) || 0;

    // CO2 Saved (2.2kg CO2 saved per kg e-waste)
    const co2SavedKg = divertedKg * 2.2;
    const co2TonsVal = co2SavedKg / 1000;
    const co2Display = co2TonsVal >= 1 ? `${co2TonsVal.toFixed(1)} Tons` : `${co2SavedKg.toFixed(0)} kg`;
    const treeEquivalent = Math.round(co2SavedKg / 21.77);
    const co2Percent = Math.min(100, Math.round((co2TonsVal / 30) * 100)) || 0;

    // Material Recovery Rate
    const recoveryRateVal = devices.length > 0 ? ((completedPickupsCount / devices.length) * 100).toFixed(1) : "0.0";
    const recoveryPercent = Math.round(parseFloat(recoveryRateVal)) || 0;

    // Default Fallback Pickups if no DB items
    const defaultPickups = [
        { id: "#PU001", user: "John Doe", type: "Electronics", categoryIcon: "💻", agentName: "Unassigned", status: "Pending", date: "Jan 15, 2024", priority: "High" },
        { id: "#PU002", user: "Jane Smith", type: "Plastic", categoryIcon: "♻️", agentName: "Alex Rivera", status: "Assigned", date: "Jan 15, 2024", priority: "Normal" },
        { id: "#PU003", user: "Bob Johnson", type: "Metal", categoryIcon: "⚙️", agentName: "Marcus Vance", status: "Completed", date: "Jan 14, 2024", priority: "Low" },
        { id: "#PU004", user: "Alice Brown", type: "Paper", categoryIcon: "📦", agentName: "Unassigned", status: "Pending", date: "Jan 14, 2024", priority: "Normal" },
        { id: "#PU005", user: "Charlie Davis", type: "Electronics", categoryIcon: "📱", agentName: "Alex Rivera", status: "In Progress", date: "Jan 13, 2024", priority: "High" },
    ];

    const getCategoryIcon = (category) => {
        const c = String(category || "").toLowerCase();
        if (c.includes("laptop") || c.includes("computer") || c.includes("electronic")) return "💻";
        if (c.includes("mobile") || c.includes("phone")) return "📱";
        if (c.includes("appliance") || c.includes("metal")) return "⚙️";
        if (c.includes("paper") || c.includes("box") || c.includes("plastic")) return "📦";
        return "♻️";
    };

    const getDisplayStatus = (rawStatus) => {
        const st = String(rawStatus || "").toLowerCase();
        if (st.includes("assigned")) return "Assigned";
        if (st.includes("progress") || st.includes("pickup") || st.includes("transit") || st.includes("inspection")) return "In Progress";
        if (st.includes("complete") || st.includes("collect") || st.includes("recycled")) return "Completed";
        return "Pending";
    };

    const parsedPickups = (devices.length > 0
        ? devices.map((d) => {
            const cat = d.categoryName || d.category?.categoryName || d.brand || "E-Waste";
            const userName = d.userName || (d.user ? `${d.user.firstName || ""} ${d.user.lastName || ""}`.trim() : "Citizen User");
            const dateStr = d.createdAt
                ? new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Recent";

            // Find matching collection assignment
            const assignment = assignments.find((a) => a.deviceId === d.deviceId);
            let agent = "Unassigned";
            if (assignment && assignment.collectionAgentName && assignment.collectionAgentName !== "Unassigned") {
                agent = assignment.collectionAgentName;
            } else if (d.collectionAgentName && d.collectionAgentName !== "Unassigned") {
                agent = d.collectionAgentName;
            }

            return {
                id: `#PU${String(d.deviceId).padStart(3, "0")}`,
                user: userName || "Citizen User",
                type: `${d.brand || ""} ${d.model || ""}`.trim() || cat,
                categoryIcon: getCategoryIcon(cat),
                agentName: agent,
                status: getDisplayStatus(d.lifecycleStatus || d.status),
                date: dateStr,
                priority: (d.quantity || 1) > 2 ? "High" : "Normal"
            };
        })
        : defaultPickups
    ).filter((item) => item.agentName && item.agentName !== "Unassigned");

    const filteredPickups = parsedPickups.filter((item) => {
        const matchesStatus =
            activeFilter === "All" ||
            item.status.toLowerCase() === activeFilter.toLowerCase() ||
            (activeFilter === "In Progress" && item.status === "In Progress");

        const matchesSearch =
            item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.agentName || "").toLowerCase().includes(searchQuery.toLowerCase());

        return matchesStatus && matchesSearch;
    });

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
                                <FiTrendingUp /> Realtime
                            </span>
                        </div>
                        <div className="tile-body">
                            <span className="tile-label">Total Registered Users</span>
                            <div className="tile-value-row">
                                <h2>{loading ? "..." : totalUsersCount}</h2>
                                <span className="tile-unit">Citizens &amp; Hubs</span>
                            </div>
                        </div>
                        <div className="tile-footer">
                            <div className="spark-bar"><div className="spark-fill" style={{ width: `${Math.min(100, totalUsersCount * 5)}%` }}></div></div>
                            <span className="spark-text">{totalUsersCount} active system accounts</span>
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
                                <h2>{loading ? "..." : pendingPickupsCount}</h2>
                                <span className="tile-unit">Unassigned</span>
                            </div>
                        </div>
                        <div className="tile-footer">
                            <div className="spark-bar"><div className="spark-fill spark-fill--amber" style={{ width: `${Math.min(100, pendingPickupsCount * 10)}%` }}></div></div>
                            <span className="spark-text">{pendingPickupsCount} requests awaiting dispatch</span>
                        </div>
                    </div>

                    <div className="metric-tile metric-tile--teal">
                        <div className="tile-glow"></div>
                        <div className="tile-top">
                            <div className="tile-icon-box">
                                <FiCheckCircle />
                            </div>
                            <span className="trend-badge trend-badge--up">
                                <FiTrendingUp /> Verified
                            </span>
                        </div>
                        <div className="tile-body">
                            <span className="tile-label">Completed Pickups</span>
                            <div className="tile-value-row">
                                <h2>{loading ? "..." : completedPickupsCount}</h2>
                                <span className="tile-unit">Requests</span>
                            </div>
                        </div>
                        <div className="tile-footer">
                            <div className="spark-bar"><div className="spark-fill spark-fill--teal" style={{ width: `${Math.min(100, completedPickupsCount * 10)}%` }}></div></div>
                            <span className="spark-text">{completedPickupsCount} requests successfully processed</span>
                        </div>
                    </div>

                    <div className="metric-tile metric-tile--indigo">
                        <div className="tile-glow"></div>
                        <div className="tile-top">
                            <div className="tile-icon-box">
                                <FiTruck />
                            </div>
                            <span className="trend-badge trend-badge--active">
                                {loading ? "..." : `${activeAgentsCount} Active`}
                            </span>
                        </div>
                        <div className="tile-body">
                            <span className="tile-label">Field Agents</span>
                            <div className="tile-value-row">
                                <h2>{loading ? "..." : activeAgentsCount}</h2>
                                <span className="tile-unit">On Route</span>
                            </div>
                        </div>
                        <div className="tile-footer">
                            <div className="spark-bar"><div className="spark-fill spark-fill--indigo" style={{ width: `${totalAgentsCount > 0 ? (activeAgentsCount / totalAgentsCount) * 100 : 0}%` }}></div></div>
                            <span className="spark-text">{activeAgentsCount} of {totalAgentsCount} agents active in field</span>
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
                            <span className="timeframe-pill">Live Audit</span>
                        </div>
                        <div className="impact-widgets-grid">
                            <div className="impact-stat-box">
                                <div className="stat-circle-gauge" style={{ background: `conic-gradient(#10b981 0% ${divertedPercent}%, #e2e8f0 ${divertedPercent}% 100%)` }}>
                                    <div className="gauge-inner">
                                        <span>{divertedPercent}%</span>
                                    </div>
                                </div>
                                <div className="gauge-info">
                                    <span className="gauge-value">{loading ? "..." : divertedTonsDisplay}</span>
                                    <span className="gauge-label">E-Waste Diverted</span>
                                    <small className="gauge-target">Goal: {divertedGoalTons} Tons</small>
                                </div>
                            </div>

                            <div className="impact-stat-box">
                                <div className="stat-circle-gauge" style={{ background: `conic-gradient(#3b82f6 0% ${co2Percent}%, #e2e8f0 ${co2Percent}% 100%)` }}>
                                    <div className="gauge-inner">
                                        <span>{co2Percent}%</span>
                                    </div>
                                </div>
                                <div className="gauge-info">
                                    <span className="gauge-value">{loading ? "..." : co2Display}</span>
                                    <span className="gauge-label">CO₂ Footprint Saved</span>
                                    <small className="gauge-target">Equivalent to {treeEquivalent} trees</small>
                                </div>
                            </div>

                            <div className="impact-stat-box">
                                <div className="stat-circle-gauge" style={{ background: `conic-gradient(#6366f1 0% ${recoveryPercent}%, #e2e8f0 ${recoveryPercent}% 100%)` }}>
                                    <div className="gauge-inner">
                                        <span>{recoveryPercent}%</span>
                                    </div>
                                </div>
                                <div className="gauge-info">
                                    <span className="gauge-value">{loading ? "..." : `${recoveryRateVal}%`}</span>
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
                                <h3 className="panel-title">Allocated Agent Deliveries &amp; Pickups</h3>
                                <p className="panel-subtitle">Monitor active pickup requests assigned to collection agents</p>
                            </div>
                            <div className="panel-actions">
                                <div className="filter-pill-group">
                                    {["All", "Assigned", "In Progress", "Completed"].map((tab) => (
                                        <button
                                            key={tab}
                                            className={`pill-btn ${activeFilter === tab ? "pill-btn--active" : ""}`}
                                            onClick={() => setActiveFilter(tab)}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                <Link to="/admin/assign-pickups" className="view-all-link">
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
                                        <th>Allocated Agent</th>
                                        <th>Status</th>
                                        <th>Submission Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPickups.length > 0 ? (
                                        filteredPickups.map((item) => (
                                            <tr key={item.id} className="table-row-hover">
                                                <td className="id-cell">{item.id}</td>
                                                <td>
                                                    <div className="user-profile-cell">
                                                        <div className="user-avatar-mini">{item.user.charAt(0).toUpperCase()}</div>
                                                        <span className="user-name">{item.user}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="material-chip">
                                                        <span className="chip-icon">{item.categoryIcon}</span>
                                                        <span>{item.type}</span>
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="agent-allocated-chip">
                                                        <FiTruck className="agent-chip-icon" />
                                                        <span className="agent-name-text">{item.agentName}</span>
                                                    </div>
                                                </td>
                                                <td>{getStatusBadge(item.status)}</td>
                                                <td className="date-cell">{item.date}</td>
                                                
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="no-data-cell">
                                                No assigned collection agent deliveries matching your criteria.
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
                                {parsedPickups.length > 0 ? (
                                    <>
                                        <div className="timeline-event">
                                            <div className="event-marker event-marker--success">
                                                <FiCheckCircle />
                                            </div>
                                            <div className="event-details">
                                                <p>Pickup <strong>{parsedPickups[0].id}</strong> recorded for {parsedPickups[0].user}</p>
                                                <span className="event-timestamp">{parsedPickups[0].date}</span>
                                            </div>
                                        </div>

                                        {activeAgents.length > 0 && (
                                            <div className="timeline-event">
                                                <div className="event-marker event-marker--progress">
                                                    <FiTruck />
                                                </div>
                                                <div className="event-details">
                                                    <p>Field Agent <strong>{activeAgents[0].firstName || activeAgents[0].name || "Agent"}</strong> active in operational area</p>
                                                    <span className="event-timestamp">Active</span>
                                                </div>
                                            </div>
                                        )}

                                        {users.length > 0 && (
                                            <div className="timeline-event">
                                                <div className="event-marker event-marker--info">
                                                    <FiUserPlus />
                                                </div>
                                                <div className="event-details">
                                                    <p>Total system accounts registered: <strong>{users.length} accounts</strong></p>
                                                    <span className="event-timestamp">System verified</span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="timeline-event">
                                            <div className="event-marker event-marker--success">
                                                <FiCheckCircle />
                                            </div>
                                            <div className="event-details">
                                                <p>System operating normally and monitoring incoming requests</p>
                                                <span className="event-timestamp">Live</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default AdminDashboard;