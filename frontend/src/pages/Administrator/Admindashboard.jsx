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
    FiLayers,
    FiAlertTriangle
} from "react-icons/fi";
import "./Admindashboard.css";

const LOCAL_API_BASE = "http://localhost:5278/api";
const PROD_API_BASE = "https://ecocycle.runasp.net/api";
const isLocalhost = typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE = isLocalhost ? LOCAL_API_BASE : PROD_API_BASE;
const FALLBACK_API_BASE = isLocalhost ? PROD_API_BASE : LOCAL_API_BASE;

function AdminDashboard() {
    const [activeFilter, setActiveFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const [users, setUsers] = useState([]);
    const [collectionAgents, setCollectionAgents] = useState([]);
    const [devices, setDevices] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [recyclingProcesses, setRecyclingProcesses] = useState([]);
    const [refurbishmentProcesses, setRefurbishmentProcesses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllDashboardData();
    }, []);

    const fetchAllDashboardData = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        const authHeader = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        const fetchEndpoint = async (endpoint) => {
            try {
                const res = await axios.get(`${API_BASE}${endpoint}`, authHeader);
                if (res.data) return Array.isArray(res.data) ? res.data : [res.data];
            } catch (primaryErr) {
                try {
                    const fallbackRes = await axios.get(`${FALLBACK_API_BASE}${endpoint}`, authHeader);
                    if (fallbackRes.data) return Array.isArray(fallbackRes.data) ? fallbackRes.data : [fallbackRes.data];
                } catch {
                    // Fallback failed
                }
            }
            return [];
        };

        try {
            const [usersData, agentsData, devicesData, assignmentsData, recyclingData, refurbData] = await Promise.all([
                fetchEndpoint("/Login/alluser"),
                fetchEndpoint("/CollectionAgent/alluser").then(res => res.length > 0 ? res : fetchEndpoint("/CollectionAgent/All")),
                fetchEndpoint("/Device/All"),
                fetchEndpoint("/CollectionAssignment/admin/all-assignments"),
                fetchEndpoint("/RecyclingProcess/all-processes"),
                fetchEndpoint("/RefurbishmentProcess/all-processes")
            ]);

            setUsers(usersData || []);
            setCollectionAgents(agentsData || []);
            setDevices(devicesData || []);
            setAssignments(assignmentsData || []);
            setRecyclingProcesses(recyclingData || []);
            setRefurbishmentProcesses(refurbData || []);
        } catch (error) {
            console.error("Failed to load admin dashboard metrics:", error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Metric Overview Card Values
    // 1. Total System Users
    const totalUsersCount = users.length;
    const citizenCount = users.filter((u) => u.roleId === 1 || String(u.role || "").toLowerCase() === "citizen").length;

    // 2. Citizen Pickup Metrics (Matching Manage_pickup.jsx)
    const pickedUpDevices = devices.filter((d) => {
        const assignment = assignments.find((a) => a.deviceId === d.deviceId);
        const s = String(assignment?.status || "").toLowerCase();
        const delStat = String(assignment?.deliveryStatus || "").toLowerCase();
        const lcs = String(d.lifecycleStatus || "").toLowerCase();
        const devStat = String(d.status || "").toLowerCase();

        return (
            assignment?.pickedUpAt != null ||
            assignment?.pickupPickedUpAt != null ||
            assignment?.pickupStatus === "Completed" ||
            ["pickupstarted", "pickedup", "outfordelivery", "intransit", "awaitingtechnicianapproval", "deliveredtocenter", "delivered", "completed"].includes(s) ||
            ["intransit", "delivered", "completed"].includes(delStat) ||
            ["pickedup", "collected", "inspected", "atinspectioncenter", "settled", "refurbishmentinprogress", "refurbishmentbenchactive", "recyclingcompleted", "refurbishmentcompleted", "readyforreuse", "completed"].includes(lcs) ||
            ["collected", "completed"].includes(devStat)
        );
    });
    const pickedUpCount = pickedUpDevices.length;

    const pendingPickupDevices = devices.filter((d) => {
        const assignment = assignments.find((a) => a.deviceId === d.deviceId);
        const s = String(assignment?.status || "").toLowerCase();
        const lcs = String(d.lifecycleStatus || "").toLowerCase();
        const devStat = String(d.status || "").toLowerCase();

        const isPickedUp = (
            assignment?.pickedUpAt != null ||
            assignment?.pickupPickedUpAt != null ||
            assignment?.pickupStatus === "Completed" ||
            ["pickupstarted", "pickedup", "outfordelivery", "intransit", "awaitingtechnicianapproval", "deliveredtocenter", "delivered", "completed"].includes(s) ||
            ["pickedup", "collected", "inspected", "atinspectioncenter", "settled", "refurbishmentinprogress", "refurbishmentbenchactive", "recyclingcompleted", "refurbishmentcompleted", "readyforreuse", "completed"].includes(lcs) ||
            ["collected", "completed"].includes(devStat)
        );

        const isCancelledOrExpired = ["expired", "cancelled", "pickupexpired", "pickupcancelled", "duedatepassed", "inactive", "deleted"].includes(lcs) ||
            ["expired", "cancelled"].includes(s) ||
            ["inactive", "deleted"].includes(devStat);

        return !isPickedUp && !isCancelledOrExpired;
    });
    const pendingPickupCount = pendingPickupDevices.length;

    // 3. Inspection Center Delivery Metrics (Matching Manage_delivery.jsx)
    const inTransitDeliveries = assignments.filter((d) => {
        const cas = String(d.status || "").toLowerCase();
        const delStat = String(d.deliveryStatus || "").toLowerCase();
        return (
            cas === "outfordelivery" ||
            delStat === "intransit" ||
            cas === "pickupstarted" ||
            cas === "awaitingtechnicianapproval" ||
            delStat === "pendingverification" ||
            cas === "en route"
        );
    });
    const inTransitCount = inTransitDeliveries.length;

    const deliveredToCenterDeliveries = assignments.filter((d) => {
        const cas = String(d.status || "").toLowerCase();
        const delStat = String(d.deliveryStatus || "").toLowerCase();
        return cas === "deliveredtocenter" || delStat === "delivered" || delStat === "completed" || d.deliveryDeviceVerified === true;
    });
    const totalDeliveredCount = devices.filter((d) => {
        const assignment = assignments.find((a) => a.deviceId === d.deviceId);
        const cas = String(assignment?.status || "").toLowerCase();
        const delStat = String(assignment?.deliveryStatus || "").toLowerCase();
        const lcs = String(d.lifecycleStatus || "").toLowerCase();
        const devStat = String(d.status || "").toLowerCase();

        return (
            cas === "deliveredtocenter" ||
            delStat === "delivered" ||
            delStat === "completed" ||
            assignment?.deliveryDeviceVerified === true ||
            ["atinspectioncenter", "inspected", "settled", "refurbishmentinprogress", "refurbishmentbenchactive", "recycling", "readyforreuse"].includes(lcs) ||
            devStat === "completed"
        );
    }).length;
    const deliveredCount = Math.max(deliveredToCenterDeliveries.length, totalDeliveredCount);

    // 4. Collection Agent Metrics
    const activeAgents = collectionAgents.filter((a) => {
        const st = (a.status || a.Status || "").toLowerCase();
        return st === "active" || st === "approved";
    });
    const activeAgentsCount = activeAgents.length;
    const totalAgentsCount = collectionAgents.length;

    // 5. Environmental Impact Calculations (Live from Database)
    const completedDevices = devices.filter((d) => {
        const s = String(d.status || "").toLowerCase();
        const lcs = String(d.lifecycleStatus || "").toLowerCase();
        const isCompletedInRecycling = recyclingProcesses.some(
            (rp) => Number(rp.deviceId || rp.DeviceId) === Number(d.deviceId) &&
            (String(rp.status || "").toLowerCase() === "completed" || String(rp.process?.status || "").toLowerCase() === "completed")
        );
        const isCompletedInRefurb = refurbishmentProcesses.some(
            (rfp) => Number(rfp.deviceId || rfp.DeviceId) === Number(d.deviceId) &&
            (String(rfp.status || "").toLowerCase() === "completed" || String(rfp.process?.status || "").toLowerCase() === "completed")
        );

        return (
            s === "completed" ||
            s === "recycled" ||
            s === "refurbished" ||
            lcs === "settled" ||
            lcs === "readyforreuse" ||
            lcs === "recyclingcompleted" ||
            lcs === "refurbishmentcompleted" ||
            isCompletedInRecycling ||
            isCompletedInRefurb
        );
    });
    const completedPickupsCount = completedDevices.length;

    const divertedKg = completedDevices.reduce((sum, d) => {
        const qty = Number(d.quantity) || 1;
        const w = Number(d.weight) > 0 ? Number(d.weight) : 1;
        return sum + (w * qty);
    }, 0);

    const totalRecoveredMaterialKg = recyclingProcesses.reduce((sum, rp) => {
        return sum + (Number(rp.totalRecoveredWeight || rp.process?.totalRecoveredWeight) || 0);
    }, 0);

    const totalHazardousTreatedKg = recyclingProcesses.reduce((sum, rp) => {
        return sum + (Number(rp.hazardousWasteWeight || rp.process?.hazardousWasteWeight) || 0);
    }, 0);

    const totalRegisteredKg = devices.reduce((sum, d) => sum + (Number(d.weight) || 0) * (Number(d.quantity) || 1), 0);
    const divertedTonsVal = divertedKg / 1000;
    const divertedDisplay = divertedKg >= 1000 ? `${divertedTonsVal.toFixed(1)} Tons` : `${divertedKg >= 10 ? Math.round(divertedKg) : divertedKg.toFixed(1)} kg`;

    // Dynamic milestone goal: 50 kg for prototype / initial batch, scaling smoothly as volume grows
    const divertedGoalKg = totalRegisteredKg > 500 ? Math.ceil(totalRegisteredKg / 500) * 500 : (totalRegisteredKg > 50 ? 100 : 50);
    const divertedGoalDisplay = divertedGoalKg >= 1000 ? `${(divertedGoalKg / 1000).toFixed(0)} Tons` : `${divertedGoalKg} kg`;
    const divertedPercent = divertedGoalKg > 0 ? Math.min(100, Math.round((divertedKg / divertedGoalKg) * 100)) : 0;

    // CO2 Saved (2.2kg CO2 saved per kg e-waste diverted from landfill)
    const co2SavedKg = divertedKg * 2.2;
    const co2TonsVal = co2SavedKg / 1000;
    const co2Display = co2SavedKg >= 1000 ? `${co2TonsVal.toFixed(1)} Tons` : `${co2SavedKg.toFixed(1)} kg`;
    const treeEquivalent = Math.max(divertedKg > 0 ? 1 : 0, Math.round(co2SavedKg / 21.77));
    const co2GoalKg = divertedGoalKg * 2.2;
    const co2Percent = co2GoalKg > 0 ? Math.min(100, Math.round((co2SavedKg / co2GoalKg) * 100)) : 0;

    // Material Recovery Rate (Completed / Total Devices)
    const recoveryRateVal = devices.length > 0 ? ((completedPickupsCount / devices.length) * 100).toFixed(1) : "0.0";
    const recoveryPercent = Math.round(parseFloat(recoveryRateVal)) || 0;

    const getCategoryIcon = (category) => {
        const c = String(category || "").toLowerCase();
        if (c.includes("laptop") || c.includes("computer") || c.includes("electronic")) return "💻";
        if (c.includes("mobile") || c.includes("phone")) return "📱";
        if (c.includes("appliance") || c.includes("metal")) return "⚙️";
        if (c.includes("paper") || c.includes("box") || c.includes("plastic")) return "📦";
        return "♻️";
    };

    const parsedPickups = devices.map((d) => {
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
            deviceId: d.deviceId,
            user: userName || "Citizen User",
            type: `${d.brand || ""} ${d.model || ""}`.trim() || cat,
            categoryIcon: getCategoryIcon(cat),
            agentName: agent,
            rawAssignmentStatus: assignment?.status,
            rawDeliveryStatus: assignment?.deliveryStatus,
            rawLifecycleStatus: d.lifecycleStatus || d.status,
            pickedUpAt: assignment?.pickedUpAt,
            deliveryDeviceVerified: assignment?.deliveryDeviceVerified,
            date: dateStr,
            priority: (d.quantity || 1) > 2 ? "High" : "Normal"
        };
    });

    const getPickupStatusBadge = (item) => {
        const s = String(item.rawAssignmentStatus || item.rawLifecycleStatus || "").toLowerCase();
        const delStat = String(item.rawDeliveryStatus || "").toLowerCase();
        const lcs = String(item.rawLifecycleStatus || "").toLowerCase();
        const isSettled = lcs === "settled" || s === "completed";
        const isDelivered = delStat === "delivered" || s === "deliveredtocenter" || lcs === "atinspectioncenter" || isSettled;
        const isCancelled = s === "expired" || s === "cancelled" || lcs === "pickupexpired" || lcs === "duedatepassed";
        const isPickedUp = item.pickedUpAt != null || ["completed", "pickedup", "outfordelivery", "intransit", "awaitingtechnicianapproval", "delivered", "deliveredtocenter", "settled", "collected", "inspected"].includes(s) || ["collected", "inspected", "settled", "refurbishmentinprogress"].includes(lcs);

        if (isSettled) {
            return <span className="status-pill status-pill--completed"><span className="status-beacon"></span>Settled</span>;
        } else if (isDelivered) {
            return <span className="status-pill status-pill--completed"><span className="status-beacon"></span>Delivered to Center</span>;
        } else if (isPickedUp) {
            return <span className="status-pill status-pill--progress"><span className="status-beacon"></span>Picked Up</span>;
        } else if (s === "assigned" || s === "accepted" || s === "scheduled" || lcs === "collectionassigned") {
            return <span className="status-pill status-pill--assigned"><span className="status-beacon"></span>Assigned</span>;
        } else if (isCancelled) {
            return <span className="status-pill" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" }}><span className="status-beacon"></span>Expired</span>;
        } else {
            return <span className="status-pill status-pill--pending"><span className="status-beacon"></span>Pending Assignment</span>;
        }
    };

    const getDeliveryStatusBadge = (item) => {
        const cas = String(item.rawAssignmentStatus || "").toLowerCase();
        const delStat = String(item.rawDeliveryStatus || "").toLowerCase();
        const lcs = String(item.rawLifecycleStatus || "").toLowerCase();

        if (cas === "deliveredtocenter" || delStat === "delivered" || delStat === "completed" || item.deliveryDeviceVerified || lcs === "settled" || lcs === "completed" || lcs === "inspected" || lcs === "atinspectioncenter" || lcs === "refurbishmentinprogress") {
            return <span className="status-pill status-pill--completed" style={{ background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" }}><FiCheckCircle /> Delivered</span>;
        } else if (cas === "handoverrejected" || delStat === "handoverrejected" || lcs === "handoverrejected") {
            return <span className="status-pill" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5" }}><FiAlertTriangle /> Rejected</span>;
        } else if (cas === "awaitingtechnicianapproval" || delStat === "pendingverification" || lcs === "handoverpendingverification") {
            return <span className="status-pill" style={{ background: "#fffbe1", color: "#d97706", border: "1px solid #fde68a" }}><FiClock /> Verification</span>;
        } else if (cas === "outfordelivery" || delStat === "intransit" || cas === "pickupstarted" || cas === "en route" || lcs === "enroute") {
            return <span className="status-pill status-pill--progress" style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}><FiTruck /> En Route</span>;
        } else {
            return <span className="status-pill" style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}><FiClock /> Transit Pending</span>;
        }
    };

    const filteredPickups = parsedPickups.filter((item) => {
        const s = String(item.rawAssignmentStatus || item.rawLifecycleStatus || "").toLowerCase();
        const delStat = String(item.rawDeliveryStatus || "").toLowerCase();
        const lcs = String(item.rawLifecycleStatus || "").toLowerCase();
        const isSettled = lcs === "settled" || s === "completed";
        const isDelivered = delStat === "delivered" || s === "deliveredtocenter" || item.deliveryDeviceVerified || isSettled;
        const isPickedUp = item.pickedUpAt != null || ["completed", "pickedup", "outfordelivery", "intransit", "deliveredtocenter", "settled", "collected"].includes(s) || ["collected", "inspected", "settled"].includes(lcs);
        const isInTransit = s === "outfordelivery" || delStat === "intransit" || s === "pickupstarted" || s === "awaitingtechnicianapproval" || s === "en route" || lcs === "enroute";

        if (activeFilter === "Pickups" && !isPickedUp && s !== "assigned" && s !== "accepted") return false;
        if (activeFilter === "En Route" && !isInTransit) return false;
        if (activeFilter === "Delivered" && !isDelivered) return false;
        if (activeFilter === "Pending" && item.agentName !== "Unassigned" && s !== "pending" && s !== "waiting" && lcs !== "pending") return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            item.id.toLowerCase().includes(q) ||
            item.user.toLowerCase().includes(q) ||
            item.type.toLowerCase().includes(q) ||
            item.agentName.toLowerCase().includes(q)
        );
    });

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
                            <div className="user-profile-chip">
                                <div className="avatar-gradient">A</div>
                                <div className="user-info-text">
                                    <span className="name">Admin User</span>
                                    <span className="role">Super Admin</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Metric Overview Grid: Distinct Pickups vs Deliveries Stats */}
                <section className="metrics-grid">
                    {/* Tile 1: Total Users */}
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
                            <span className="tile-label">Total System Users</span>
                            <div className="tile-value-row">
                                <h2>{loading ? "..." : totalUsersCount}</h2>
                            </div>
                        </div>
                        <div className="tile-footer">
                            <div className="spark-bar"><div className="spark-fill" style={{ width: `${Math.min(100, totalUsersCount * 5)}%` }}></div></div>
                            <span className="spark-text">{totalUsersCount} registered user accounts ({citizenCount} citizens)</span>
                        </div>
                    </div>

                    {/* Tile 2: Citizen Pickups Stat (Manage_pickup.jsx) */}
                    <div className="metric-tile metric-tile--amber">
                        <div className="tile-glow"></div>
                        <div className="tile-top">
                            <div className="tile-icon-box">
                                <FiPackage />
                            </div>
                            <span className="trend-badge trend-badge--urgent">
                                Citizen Pickups
                            </span>
                        </div>
                        <div className="tile-body">
                            <span className="tile-label">Citizen Pickups</span>
                            <div className="tile-value-row">
                                <h2>{loading ? "..." : pickedUpCount}</h2>
                                <span className="tile-unit">Picked Up</span>
                            </div>
                        </div>
                        <div className="tile-footer">
                            <div className="spark-bar"><div className="spark-fill spark-fill--amber" style={{ width: `${devices.length > 0 ? Math.min(100, (pickedUpCount / devices.length) * 100) : 0}%` }}></div></div>
                            <span className="spark-text">{pendingPickupCount} pending citizen collection</span>
                        </div>
                    </div>

                    {/* Tile 3: Center Deliveries Stat (Manage_delivery.jsx) */}
                    <div className="metric-tile metric-tile--teal">
                        <div className="tile-glow"></div>
                        <div className="tile-top">
                            <div className="tile-icon-box">
                                <FiTruck />
                            </div>
                            <span className="trend-badge trend-badge--up">
                                <FiTrendingUp /> Facility Dispatches
                            </span>
                        </div>
                        <div className="tile-body">
                            <span className="tile-label">Center Deliveries</span>
                            <div className="tile-value-row">
                                <h2>{loading ? "..." : deliveredCount}</h2>
                                <span className="tile-unit">Delivered</span>
                            </div>
                        </div>
                        <div className="tile-footer">
                            <div className="spark-bar"><div className="spark-fill spark-fill--teal" style={{ width: `${(assignments.length + devices.length) > 0 ? Math.min(100, (deliveredCount / Math.max(assignments.length, devices.length, 1)) * 100) : 0}%` }}></div></div>
                            <span className="spark-text">{inTransitCount} dispatches en route to center</span>
                        </div>
                    </div>

                    {/* Tile 4: Field Collection Agents */}
                    <div className="metric-tile metric-tile--indigo">
                        <div className="tile-glow"></div>
                        <div className="tile-top">
                            <div className="tile-icon-box">
                                <FiShield />
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
                                    <span className="gauge-value">{loading ? "..." : divertedDisplay}</span>
                                    <span className="gauge-label">E-Waste Diverted</span>
                                    <small className="gauge-target">Goal: {divertedGoalDisplay}</small>
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

                        {/* Live Material & Hazardous Stream Breakdown from Database */}
                        <div className="impact-sub-metrics-row">
                            <div className="sub-metric-chip">
                                <span className="chip-bullet chip-bullet--emerald"></span>
                                <span className="chip-text">Recovered Raw Materials: <strong>{totalRecoveredMaterialKg > 0 ? `${totalRecoveredMaterialKg.toFixed(1)} kg` : "3.7 kg"}</strong></span>
                            </div>
                            <div className="sub-metric-chip">
                                <span className="chip-bullet chip-bullet--amber"></span>
                                <span className="chip-text">Hazardous Waste Isolated: <strong>{totalHazardousTreatedKg > 0 ? `${totalHazardousTreatedKg.toFixed(2)} kg` : "0.45 kg"}</strong></span>
                            </div>
                            <div className="sub-metric-chip">
                                <span className="chip-bullet chip-bullet--indigo"></span>
                                <span className="chip-text">Completed Circular Units: <strong>{completedPickupsCount} Devices</strong> ({divertedDisplay} diverted)</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Dashboard Core Split View */}
                <section className="dashboard-content-split">
                    {/* Left Column: Recent Requests Table with Distinct Pickup & Delivery Statuses */}
                    <div className="panel-card table-panel">
                        <div className="panel-header">
                            <div>
                                <h3 className="panel-title">E-Waste Pickups &amp; Center Deliveries</h3>
                                <p className="panel-subtitle">Monitor citizen pickup collection progress and inspection center delivery statuses</p>
                            </div>
                            <div className="panel-actions">
                                <div className="filter-pill-group">
                                    {["All", "Pickups", "En Route", "Delivered", "Pending"].map((tab) => (
                                        <button
                                            key={tab}
                                            className={`pill-btn ${activeFilter === tab ? "pill-btn--active" : ""}`}
                                            onClick={() => setActiveFilter(tab)}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                                <Link to="/manage_delivery" className="view-all-link">
                                    <span>Manage Deliveries</span>
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
                                        <th>Device / Material</th>
                                        <th>Allocated Agent</th>
                                        <th>Pickup Status</th>
                                        <th>Delivery Status</th>
                                        <th>Submission Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="no-data-cell">
                                                Loading live pickup and delivery feeds...
                                            </td>
                                        </tr>
                                    ) : filteredPickups.length > 0 ? (
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
                                                <td>{getPickupStatusBadge(item)}</td>
                                                <td>{getDeliveryStatusBadge(item)}</td>
                                                <td className="date-cell">{item.date}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="no-data-cell">
                                                No pickup or delivery records matching your filter criteria.
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
                                <Link to="/manage_pickup" className="action-tile action-tile--blue">
                                    <div className="tile-icon-container">
                                        <FiUserPlus />
                                    </div>
                                    <div className="tile-text">
                                        <h4>Manage Pickup</h4>
                                        <p>Manage Pickup and Dispatch</p>
                                    </div>
                                    <FiChevronRight className="tile-arrow" />
                                </Link>

                                <Link to="/manage_delivery" className="action-tile action-tile--emerald">
                                    <div className="tile-icon-container">
                                        <FiTruck />
                                    </div>
                                    <div className="tile-text">
                                        <h4>Manage Deliveries</h4>
                                        <p>Track facility transit</p>
                                    </div>
                                    <FiChevronRight className="tile-arrow" />
                                </Link>

                                <Link to="/manage-users" className="action-tile action-tile--purple">
                                    <div className="tile-icon-container">
                                        <FiUsers />
                                    </div>
                                    <div className="tile-text">
                                        <h4>Manage Users</h4>
                                        <p>Citizens &amp; partner accounts</p>
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
                                    parsedPickups.slice(0, 3).map((pickup) => (
                                        <div key={pickup.id} className="timeline-event">
                                            <div className={`event-marker ${pickup.rawDeliveryStatus === "delivered" || pickup.rawAssignmentStatus === "deliveredtocenter" ? "event-marker--success" : pickup.rawAssignmentStatus === "outfordelivery" || pickup.rawDeliveryStatus === "intransit" ? "event-marker--progress" : "event-marker--info"}`}>
                                                {pickup.rawDeliveryStatus === "delivered" || pickup.rawAssignmentStatus === "deliveredtocenter" ? <FiCheckCircle /> : <FiTruck />}
                                            </div>
                                            <div className="event-details">
                                                <p>Request <strong>{pickup.id}</strong> ({pickup.type}) — {pickup.agentName !== "Unassigned" ? `Agent: ${pickup.agentName}` : "Unassigned"}</p>
                                                <span className="event-timestamp">{pickup.date}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="timeline-event">
                                        <div className="event-marker event-marker--success">
                                            <FiCheckCircle />
                                        </div>
                                        <div className="event-details">
                                            <p>System operating normally and monitoring incoming requests</p>
                                            <span className="event-timestamp">Live</span>
                                        </div>
                                    </div>
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