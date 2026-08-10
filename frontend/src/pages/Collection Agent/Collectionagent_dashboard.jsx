import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiTruck,
    FiCheckCircle,
    FiClock,
    FiMapPin,
    FiPhoneCall,
    FiPackage,
    FiNavigation,
    FiAward,
    FiInfo,
    FiX,
    FiBox,
    FiCheck,
    FiRefreshCw,
    FiUser
} from "react-icons/fi";
import "./Collectionagent_dashboard.css";

function CollectionAgentDashboard() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [isOnDuty, setIsOnDuty] = useState(true);
    const [activeTab, setActiveTab] = useState("All");
    const [loading, setLoading] = useState(true);
    const [pickups, setPickups] = useState([]);
    const [selectedPickup, setSelectedPickup] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found, redirecting to login.");
            navigate("/");
            return;
        }
        fetchAgentProfile(token);
        fetchAssignedPickups(token);
    }, [navigate]);

    const fetchAgentProfile = async (token) => {
        try {
            const response = await axios.get("https://localhost:7102/api/User/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(response.data || {});
        } catch (err) {
            console.error("Error fetching agent profile:", err);
        }
    };

    const fetchAssignedPickups = async (token) => {
        try {
            setLoading(true);
            const response = await axios.get("https://localhost:7102/api/Inspection/admin/assignments", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data && response.data.length > 0) {
                const mapped = response.data.map((item, idx) => ({
                    id: item.inspectionRequestId || (idx + 101),
                    citizenName: item.userName || "Resident Citizen",
                    phone: "+91 98765 43210",
                    items: `${item.brand || "E-Waste"} ${item.model || "Device"}`,
                    address: "Block B, Green Valley Apartments, MG Road",
                    timeSlot: item.timeSlot || "10:00 AM - 01:00 PM",
                    scheduledDate: "Today",
                    status: item.status || (idx % 2 === 0 ? "Pending" : "En Route"),
                    quantity: "2 Units",
                    weight: "12 kg"
                }));
                setPickups(mapped);
            } else {
                setPickups(defaultPickups);
            }
        } catch (err) {
            setPickups(defaultPickups);
        } finally {
            setLoading(false);
        }
    };

    const defaultPickups = [
        {
            id: 201,
            citizenName: "Ananya Sharma",
            phone: "+91 98450 12345",
            items: "Dell Laptop & 24\" LED Monitor",
            address: "#402, Lotus Towers, Indiranagar",
            landmark: "Behind Metro Station Gate 2",
            timeSlot: "10:00 AM - 12:30 PM",
            scheduledDate: "Today",
            status: "En Route",
            quantity: "2 Units",
            weight: "8.5 kg"
        },
        {
            id: 202,
            citizenName: "Rajesh Kumar",
            phone: "+91 97312 88900",
            items: "Samsung Galaxy Smartphones (x3)",
            address: "#12, Green Park Avenue, HSR Layout",
            landmark: "Near BDA Complex",
            timeSlot: "01:00 PM - 03:00 PM",
            scheduledDate: "Today",
            status: "Pending",
            quantity: "3 Units",
            weight: "1.8 kg"
        },
        {
            id: 203,
            citizenName: "Vikram Mehta",
            phone: "+91 91088 55432",
            items: "APC UPS Battery Unit & Adapters",
            address: "#88, Rosewood Residency, Koramangala",
            landmark: "Opposite Forum Mall",
            timeSlot: "03:30 PM - 05:30 PM",
            scheduledDate: "Today",
            status: "Pending",
            quantity: "1 Heavy Unit",
            weight: "14 kg"
        },
        {
            id: 204,
            citizenName: "Priya Nair",
            phone: "+91 99001 77654",
            items: "LG Smart TV (42-inch)",
            address: "#55, Sunrise Enclave, Whitefield",
            landmark: "Next to ITPL Back Gate",
            timeSlot: "09:30 AM - 11:00 AM",
            scheduledDate: "Yesterday",
            status: "Completed",
            quantity: "1 Unit",
            weight: "11 kg"
        }
    ];

    const agentName = profile?.firstName 
        ? `${profile.firstName} ${profile.lastName || ""}`.trim()
        : localStorage.getItem("firstName") || "Ramesh Kumar";

    const updatePickupStatus = (pickupId, newStatus) => {
        setPickups(prev =>
            prev.map(p => (p.id === pickupId ? { ...p, status: newStatus } : p))
        );
        if (selectedPickup && selectedPickup.id === pickupId) {
            setSelectedPickup(prev => ({ ...prev, status: newStatus }));
        }
    };

    const filteredPickups = pickups.filter(p => {
        if (activeTab === "All") return true;
        if (activeTab === "Pending") return p.status === "Pending";
        if (activeTab === "En Route") return p.status === "En Route";
        if (activeTab === "Completed") return p.status === "Completed";
        return true;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case "Completed":
                return <span className="agent-status-badge collected"><FiCheckCircle /> Completed</span>;
            case "En Route":
                return <span className="agent-status-badge en-route"><FiTruck /> En Route</span>;
            case "Pending":
            default:
                return <span className="agent-status-badge pending"><FiClock /> Pending</span>;
        }
    };

    return (
        <div className="agent-dashboard-layout">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Dashboard */}
            <main className="agent-main-content">
                {/* Header Ribbon */}
                <div className="agent-header-ribbon">
                    <div>
                        <h1 className="agent-welcome-title">Welcome back, {agentName}!</h1>
                        <p className="agent-welcome-sub">Vehicle Unit: <strong>E-Truck #KA-05-EV-4092</strong> • Zone South</p>
                    </div>

                    <div className="agent-header-actions">
                        {/* On Duty Status Toggle Button */}
                        <div 
                            className="duty-status-card"
                            onClick={() => setIsOnDuty(!isOnDuty)}
                            title="Click to toggle On Duty status"
                        >
                            <div className={`duty-beacon ${!isOnDuty ? "offline" : ""}`}></div>
                            <span className="duty-text">{isOnDuty ? "ON DUTY" : "OFFLINE"}</span>
                        </div>

                        <Link to="/manage-userprofile" className="agent-profile-pill">
                            <div className="agent-avatar">
                                {agentName.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{agentName}</span>
                                <span style={{ fontSize: "0.725rem", color: "#059669", fontWeight: 600 }}>Field Officer</span>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Metric Summary Cards Grid */}
                <div className="agent-kpi-grid">
                    <div className="agent-kpi-card">
                        <div className="agent-kpi-top">
                            <div className="agent-kpi-icon emerald">
                                <FiTruck />
                            </div>
                            <span className="agent-kpi-badge">+2 Today</span>
                        </div>
                        <div>
                            <h3 className="agent-kpi-val">{pickups.length} Tasks</h3>
                            <div className="agent-kpi-lbl">Assigned Pickups Today</div>
                        </div>
                    </div>

                    <div className="agent-kpi-card">
                        <div className="agent-kpi-top">
                            <div className="agent-kpi-icon blue">
                                <FiPackage />
                            </div>
                            <span className="agent-kpi-badge">Estimated</span>
                        </div>
                        <div>
                            <h3 className="agent-kpi-val">35.3 kg</h3>
                            <div className="agent-kpi-lbl">E-Waste Weight Collected</div>
                        </div>
                    </div>

                    <div className="agent-kpi-card">
                        <div className="agent-kpi-top">
                            <div className="agent-kpi-icon purple">
                                <FiNavigation />
                            </div>
                            <span className="agent-kpi-badge">4 Hubs</span>
                        </div>
                        <div>
                            <h3 className="agent-kpi-val">18.4 km</h3>
                            <div className="agent-kpi-lbl">Today's Route Distance</div>
                        </div>
                    </div>

                    <div className="agent-kpi-card">
                        <div className="agent-kpi-top">
                            <div className="agent-kpi-icon amber">
                                <FiAward />
                            </div>
                            <span className="agent-kpi-badge" style={{ background: "#fef3c7", color: "#b45309" }}>High Rating</span>
                        </div>
                        <div>
                            <h3 className="agent-kpi-val">4.95 ★</h3>
                            <div className="agent-kpi-lbl">Performance Score</div>
                        </div>
                    </div>
                </div>

                {/* 2-Column Dashboard Grid */}
                <div className="agent-grid-layout">
                    {/* Left Column (Pickup Task Table) */}
                    <div>
                        <div className="agent-panel-card">
                            <div className="agent-panel-header">
                                <div>
                                    <h2 className="agent-panel-title">Assigned Pickups</h2>
                                    <p className="agent-panel-subtitle">Manage citizen collection requests and update live pickup status</p>
                                </div>

                                <div className="agent-tab-pills">
                                    {["All", "Pending", "En Route", "Completed"].map((tab) => (
                                        <button
                                            key={tab}
                                            className={`agent-tab-btn ${activeTab === tab ? "active" : ""}`}
                                            onClick={() => setActiveTab(tab)}
                                        >
                                            {tab} ({tab === "All" ? pickups.length : pickups.filter(p => p.status === tab).length})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="agent-table-wrapper">
                                {loading ? (
                                    <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                                        Loading assigned pickup tasks...
                                    </div>
                                ) : filteredPickups.length === 0 ? (
                                    <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", color: "#64748b" }}>
                                        <FiBox style={{ fontSize: "2rem", color: "#94a3b8", marginBottom: "0.5rem" }} />
                                        <p style={{ margin: 0, fontWeight: 600 }}>No pickup tasks matching "{activeTab}".</p>
                                    </div>
                                ) : (
                                    <table className="agent-table">
                                        <thead>
                                            <tr>
                                                <th>Task ID</th>
                                                <th>Citizen & Contact</th>
                                                <th>Items & Weight</th>
                                                <th>Time Slot</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPickups.map((task) => (
                                                <tr key={task.id}>
                                                    <td>
                                                        <span style={{ fontFamily: "monospace", fontWeight: 700, background: "#f1f5f9", padding: "0.25rem 0.6rem", borderRadius: "6px", color: "#0f172a" }}>
                                                            #TASK-{task.id}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{task.citizenName}</div>
                                                        <div style={{ fontSize: "0.775rem", color: "#64748b" }}>{task.phone}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, color: "#334155" }}>{task.items}</div>
                                                        <div style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 600 }}>{task.weight} ({task.quantity})</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#0f172a" }}>{task.timeSlot}</div>
                                                    </td>
                                                    <td>{getStatusBadge(task.status)}</td>
                                                    <td>
                                                        <div style={{ display: "flex", gap: "0.4rem" }}>
                                                            {task.status === "Pending" && (
                                                                <button
                                                                    className="agent-action-btn primary"
                                                                    onClick={() => updatePickupStatus(task.id, "En Route")}
                                                                    title="Start Route to Citizen"
                                                                >
                                                                    <FiTruck /> Start Route
                                                                </button>
                                                            )}
                                                            {task.status === "En Route" && (
                                                                <button
                                                                    className="agent-action-btn success"
                                                                    onClick={() => updatePickupStatus(task.id, "Completed")}
                                                                    title="Mark E-Waste Collected"
                                                                >
                                                                    <FiCheck /> Collected
                                                                </button>
                                                            )}
                                                            <button
                                                                className="agent-action-btn"
                                                                onClick={() => setSelectedPickup(task)}
                                                                title="View Details"
                                                            >
                                                                <FiInfo /> Details
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side Panel: Route Timeline */}
                    <div>
                        <div className="agent-panel-card">
                            <h3 className="agent-panel-title">Today's Route Schedule</h3>
                            <p className="agent-panel-subtitle">Sequential pickup dispatches & hub stops</p>

                            <div className="agent-timeline">
                                <div className="agent-timeline-item">
                                    <div className="agent-timeline-icon done">
                                        <FiCheckCircle />
                                    </div>
                                    <div>
                                        <div className="agent-timeline-title">Depot Departure</div>
                                        <div className="agent-timeline-sub">09:00 AM • Vehicle Ready</div>
                                    </div>
                                </div>

                                <div className="agent-timeline-item">
                                    <div className="agent-timeline-icon done">
                                        <FiCheckCircle />
                                    </div>
                                    <div>
                                        <div className="agent-timeline-title">Priya Nair (Completed)</div>
                                        <div className="agent-timeline-sub">09:45 AM • LG Smart TV Collected</div>
                                    </div>
                                </div>

                                <div className="agent-timeline-item">
                                    <div className="agent-timeline-icon active">
                                        <FiTruck />
                                    </div>
                                    <div>
                                        <div className="agent-timeline-title">Ananya Sharma (Current)</div>
                                        <div className="agent-timeline-sub">10:15 AM • Indiranagar • Laptop & Monitor</div>
                                    </div>
                                </div>

                                <div className="agent-timeline-item">
                                    <div className="agent-timeline-icon">
                                        <FiMapPin />
                                    </div>
                                    <div>
                                        <div className="agent-timeline-title">Rajesh Kumar (Upcoming)</div>
                                        <div className="agent-timeline-sub">01:00 PM • HSR Layout</div>
                                    </div>
                                </div>

                                <div className="agent-timeline-item">
                                    <div className="agent-timeline-icon">
                                        <FiRefreshCw />
                                    </div>
                                    <div>
                                        <div className="agent-timeline-title">Recycling Hub Drop-Off</div>
                                        <div className="agent-timeline-sub">05:30 PM • EcoCycle Central Depot</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Task Details Modal */}
            {selectedPickup && (
                <div className="agent-modal-overlay">
                    <div className="agent-modal-card">
                        <div className="agent-modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                <FiTruck style={{ fontSize: "1.3rem" }} />
                                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Pickup Task #TASK-{selectedPickup.id}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedPickup(null)}
                                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#ffffff", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="agent-modal-body">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
                                <div>
                                    <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Scheduled Slot</span>
                                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>{selectedPickup.scheduledDate} ({selectedPickup.timeSlot})</div>
                                </div>
                                {getStatusBadge(selectedPickup.status)}
                            </div>

                            <div style={{ display: "grid", gap: "1rem" }}>
                                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Citizen Contact</div>
                                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", marginTop: "0.2rem" }}>{selectedPickup.citizenName}</div>
                                    <div style={{ fontSize: "0.875rem", color: "#0284c7", fontWeight: 600, marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <FiPhoneCall /> {selectedPickup.phone}
                                    </div>
                                </div>

                                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <FiMapPin /> Pickup Location
                                    </div>
                                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1e293b", marginTop: "0.25rem" }}>{selectedPickup.address}</div>
                                    {selectedPickup.landmark && (
                                        <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "0.2rem" }}>📍 Landmark: {selectedPickup.landmark}</div>
                                    )}
                                </div>

                                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>E-Waste Items</div>
                                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", marginTop: "0.2rem" }}>{selectedPickup.items}</div>
                                    <div style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 600, marginTop: "0.2rem" }}>Quantity: {selectedPickup.quantity} • Weight: {selectedPickup.weight}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                            {selectedPickup.status === "Pending" ? (
                                <button
                                    className="agent-action-btn primary"
                                    onClick={() => updatePickupStatus(selectedPickup.id, "En Route")}
                                    style={{ padding: "0.6rem 1.25rem", width: "100%", justifyContent: "center" }}
                                >
                                    <FiTruck /> Start Route To Citizen
                                </button>
                            ) : selectedPickup.status === "En Route" ? (
                                <button
                                    className="agent-action-btn success"
                                    onClick={() => updatePickupStatus(selectedPickup.id, "Completed")}
                                    style={{ padding: "0.6rem 1.25rem", width: "100%", justifyContent: "center" }}
                                >
                                    <FiCheck /> Mark E-Waste Item Collected
                                </button>
                            ) : (
                                <div style={{ textAlign: "center", fontSize: "0.85rem", color: "#047857", fontWeight: 700 }}>
                                    ✓ Task Completed
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CollectionAgentDashboard;