import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiTruck,
    FiCheckCircle,
    FiClock,
    FiUser,
    FiPhone,
    FiBell,
    FiSearch,
    FiGrid,
    FiList,
    FiCpu,
    FiSmartphone,
    FiBatteryCharging,
    FiTv,
    FiBox,
    FiMapPin,
    FiX,
    FiRefreshCw,
    FiNavigation,
    FiShield,
    FiActivity
} from "react-icons/fi";
import "./Sidebar.css";
import "./Recycling_perform.css";
import "./recycling_delivery.css";

function RecyclingDelivery() {
    const navigate = useNavigate();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    // Profile state
    const [centerName, setCenterName] = useState(() => {
        return localStorage.getItem("centerName") ||
               localStorage.getItem("userName") ||
               localStorage.getItem("username") ||
               "Recycling Center";
    });
    const [profilePhoto, setProfilePhoto] = useState(() => {
        return localStorage.getItem("profilePhoto") || null;
    });

    const userInitial = (centerName || "R").charAt(0).toUpperCase();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchMyDeliveries(token);
        fetchUnreadNotifCount(token);
        fetchCenterProfile(token);
    }, [navigate]);

    const getMediaUrl = (filename, folderName = "ProfilePhotos") => {
        if (!filename) return null;
        if (filename.startsWith("data:") || filename.startsWith("blob:") || filename.startsWith("http://") || filename.startsWith("https://")) {
            return filename;
        }
        const cleanName = filename.replace(/^uploads[\\/]/, "").replace(/^[\\/]/, "");
        if (cleanName.includes("/") || cleanName.includes("\\")) {
            return `https://ecocycle.runasp.net/uploads/${cleanName.replace("\\", "/")}`;
        }
        return `https://ecocycle.runasp.net/uploads/recyclingcenter/${folderName}/${cleanName}`;
    };

    const fetchCenterProfile = async (token) => {
        try {
            const res = await axios.get("https://ecocycle.runasp.net/api/RecyclingCenter/myprofile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data || {};
            const name = data.centerName || data.name || "";
            const photo = data.photo || data.profilePhoto || data.photoPath;
            if (name) {
                setCenterName(name);
                localStorage.setItem("centerName", name);
            }
            if (photo) {
                setProfilePhoto(photo);
                localStorage.setItem("profilePhoto", photo);
            }
        } catch {
            // Profile fetch optional
        }
    };

    const fetchUnreadNotifCount = async (token) => {
        try {
            const res = await axios.get("https://ecocycle.runasp.net/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${token || localStorage.getItem("token")}` }
            });
            const list = Array.isArray(res.data) ? res.data : [];
            setUnreadNotifCount(list.filter(n => !n.isRead && !n.isread).length);
        } catch {
            setUnreadNotifCount(0);
        }
    };

    const fetchMyDeliveries = async (token) => {
        const authToken = token || localStorage.getItem("token");
        if (!authToken) return;
        try {
            setLoading(true);
            const [allocRes, assignRes] = await Promise.all([
                axios.get("https://ecocycle.runasp.net/api/AllocateRecyclingCenter/my-requests", {
                    headers: { Authorization: `Bearer ${authToken}` }
                }).catch(() => ({ data: [] })),
                axios.get("https://ecocycle.runasp.net/api/CollectionAssignment/admin/all-assignments", {
                    headers: { Authorization: `Bearer ${authToken}` }
                }).catch(() => ({ data: [] }))
            ]);

            const allocList = allocRes.data || [];
            const assignList = assignRes.data || [];

            // Combine or merge collection assignment shipment details with recycling requests
            const assignMap = new Map();
            assignList.forEach(a => {
                if (a.deviceId) {
                    assignMap.set(a.deviceId, a);
                }
            });

            const combined = allocList.map(item => {
                const matchedAssign = assignMap.get(item.deviceId) || {};
                const itemWeight = item.weight ? parseFloat(item.weight) : (matchedAssign.weight ? parseFloat(matchedAssign.weight) : 0);

                return {
                    recyclingCenterRequestId: item.recyclingCenterRequestId || item.id,
                    collectionAssignmentId: matchedAssign.collectionAssignmentId || item.collectionAssignmentId || item.recyclingCenterRequestId,
                    deviceId: item.deviceId,
                    brand: item.brand || matchedAssign.brand || "E-Waste",
                    model: item.model || matchedAssign.model || "Device",
                    categoryName: item.categoryName || matchedAssign.categoryName || "Electronics",
                    quantity: item.quantity || matchedAssign.quantity || 1,
                    weight: itemWeight > 0 ? itemWeight : 1.5,
                    status: matchedAssign.status || item.status || "Assigned",
                    deliveryStatus: matchedAssign.deliveryStatus || (item.status === "Completed" ? "delivered" : "intransit"),
                    lifecycleStatus: item.lifecycleStatus || matchedAssign.lifecycleStatus || "allocatedtorecycling",
                    collectionAgentName: matchedAssign.collectionAgentName || "Assigned Collection Agent",
                    collectionAgentPhone: matchedAssign.collectionAgentPhone || "",
                    collectionAgentPhoto: matchedAssign.collectionAgentPhoto || null,
                    vehicleNumber: matchedAssign.vehicleNumber || "",
                    technicianName: matchedAssign.technicianName || "Inspection Technician Hub",
                    inspectionCenterName: matchedAssign.inspectionCenterName || "Technician Hub",
                    technicianAddress: matchedAssign.technicianAddress || matchedAssign.deliveredAddress || "Inspection Center Address",
                    recyclingCenterName: item.centerName || matchedAssign.recyclingCenterName || centerName,
                    recyclingCenterAddress: item.centerAddress || matchedAssign.recyclingCenterAddress || "Recycling Facility Address",
                    createdAt: item.createdAt || matchedAssign.createdAt,
                    pickupStartedAt: matchedAssign.pickupStartedAt || matchedAssign.startedAt,
                    deliveredAt: matchedAssign.deliveredAt || item.updatedAt
                };
            });

            // If allocList was empty, fallback to assignList items where assignmentType is TechnicianToRecyclingCenter
            if (combined.length === 0 && assignList.length > 0) {
                const filteredTechToRec = assignList.filter(a => a.assignmentType === "TechnicianToRecyclingCenter" || a.recyclingCenterName);
                filteredTechToRec.forEach(item => {
                    const itemWeight = item.weight ? parseFloat(item.weight) : 1.5;
                    combined.push({
                        recyclingCenterRequestId: item.collectionAssignmentId,
                        collectionAssignmentId: item.collectionAssignmentId,
                        deviceId: item.deviceId,
                        brand: item.brand || "E-Waste",
                        model: item.model || "Device",
                        categoryName: item.categoryName || "Electronics",
                        quantity: item.quantity || 1,
                        weight: itemWeight,
                        status: item.status || "Assigned",
                        deliveryStatus: item.deliveryStatus || "intransit",
                        lifecycleStatus: item.lifecycleStatus || "allocatedtorecycling",
                        collectionAgentName: item.collectionAgentName || "Assigned Agent",
                        collectionAgentPhone: item.collectionAgentPhone || "",
                        collectionAgentPhoto: item.collectionAgentPhoto || null,
                        vehicleNumber: item.vehicleNumber || "",
                        technicianName: item.technicianName || item.inspectionCenterName || "Technician Hub",
                        inspectionCenterName: item.inspectionCenterName || "Technician Hub",
                        technicianAddress: item.technicianAddress || item.deliveredAddress || "Inspection Hub",
                        recyclingCenterName: item.recyclingCenterName || centerName,
                        recyclingCenterAddress: item.recyclingCenterAddress || "Recycling Facility",
                        createdAt: item.createdAt,
                        pickupStartedAt: item.pickupStartedAt || item.startedAt,
                        deliveredAt: item.deliveredAt
                    });
                });
            }

            setDeliveries(combined);
        } catch (err) {
            console.error("Error fetching recycling center deliveries:", err);
        } finally {
            setLoading(false);
        }
    };

    const hasAgentStartedDelivery = (item) => {
        if (!item) return false;
        const delStat = String(item.deliveryStatus || "").toLowerCase();
        const cas = String(item.status || "").toLowerCase();
        const lcs = String(item.lifecycleStatus || "").toLowerCase();

        if (item.pickupStartedAt || item.deliveredAt) return true;

        const startedDeliveryStatuses = [
            "pickupstarted",
            "en route",
            "pickedup",
            "outfordelivery",
            "intransit",
            "pendingverification",
            "awaitingapproval",
            "awaitingtechnicianapproval",
            "delivered",
            "completed",
            "deliveredtocenter"
        ];

        return startedDeliveryStatuses.includes(delStat) || startedDeliveryStatuses.includes(cas) || startedDeliveryStatuses.includes(lcs);
    };

    // Filter deliveries so ONLY started deliveries are displayed on the page
    const filteredDeliveries = deliveries.filter(item => {
        if (!hasAgentStartedDelivery(item)) return false;

        const cas = String(item.status || "").toLowerCase();
        const delStat = String(item.deliveryStatus || "").toLowerCase();

        const isDelivered = cas === "deliveredtocenter" || delStat === "delivered" || cas === "completed";
        const isInTransit = !isDelivered;

        if (activeTab === "In Transit" && !isInTransit) return false;
        if (activeTab === "Delivered to Center" && !isDelivered) return false;
        if (activeTab === "Completed" && !isDelivered) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const devName = `${item.brand || ""} ${item.model || ""}`.toLowerCase();
        const catName = String(item.categoryName || "").toLowerCase();
        const agentName = String(item.collectionAgentName || "").toLowerCase();
        const techName = String(item.technicianName || "").toLowerCase();

        return (
            devName.includes(q) ||
            catName.includes(q) ||
            agentName.includes(q) ||
            techName.includes(q)
        );
    });

    const inTransitCount = deliveries.filter(d => {
        if (!hasAgentStartedDelivery(d)) return false;
        const cas = String(d.status || "").toLowerCase();
        const delStat = String(d.deliveryStatus || "").toLowerCase();
        return cas !== "deliveredtocenter" && delStat !== "delivered" && cas !== "completed";
    }).length;

    const deliveredCount = deliveries.filter(d => {
        const cas = String(d.status || "").toLowerCase();
        const delStat = String(d.deliveryStatus || "").toLowerCase();
        return cas === "deliveredtocenter" || delStat === "delivered" || cas === "completed";
    }).length;

    const totalWeight = deliveries.reduce((sum, d) => sum + ((Number(d.weight) || 0) * (Number(d.quantity) || 1)), 0);

    const getCategoryIcon = (categoryName) => {
        const cat = (categoryName || "").toLowerCase();
        if (cat.includes("computer") || cat.includes("laptop")) return <FiCpu />;
        if (cat.includes("mobile") || cat.includes("phone") || cat.includes("tablet")) return <FiSmartphone />;
        if (cat.includes("battery") || cat.includes("charger")) return <FiBatteryCharging />;
        if (cat.includes("display") || cat.includes("tv") || cat.includes("monitor")) return <FiTv />;
        return <FiBox />;
    };

    const getStatusBadge = (item) => {
        const delStat = String(item.deliveryStatus || "").toLowerCase();
        const cas = String(item.status || "").toLowerCase();

        if (delStat === "delivered" || cas === "deliveredtocenter" || cas === "completed") {
            return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>
                    <FiCheckCircle /> Received at Facility
                </span>
            );
        }

        return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#dbeafe", color: "#1e40af" }}>
                <FiTruck /> In Transit to Recycling Center
            </span>
        );
    };

    const getAgentPhoto = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith("data:") || photoPath.startsWith("blob:") || photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
            return photoPath;
        }
        let clean = photoPath.replace(/\\/g, "/").replace(/^\/+/, "");
        if (clean.startsWith("uploads/")) {
            return `https://ecocycle.runasp.net/${clean}`;
        }
        return `https://ecocycle.runasp.net/uploads/profile/${clean}`;
    };

    const getTimelineSteps = (item) => {
        if (!item) return [];
        const cas = String(item.status || "").toLowerCase();
        const delStat = String(item.deliveryStatus || "").toLowerCase();

        const isDelivered = delStat === "delivered" || cas === "deliveredtocenter" || cas === "completed";
        const isStarted = hasAgentStartedDelivery(item);

        return [
            {
                title: "1. Recycling Allocation Confirmed",
                desc: item.createdAt ? `Allocated on ${new Date(item.createdAt).toLocaleDateString("en-GB")}` : "Recycling allocation confirmed",
                completed: true,
                current: false
            },
            {
                title: "2. Handover & Pickup from Technician Hub",
                desc: `Dispatched from ${item.technicianName || item.inspectionCenterName || "Technician Hub"}`,
                completed: isStarted,
                current: isStarted && !isDelivered
            },
            {
                title: "3. In Transit to Recycling Center",
                desc: isStarted ? `En route by agent ${item.collectionAgentName || "Assigned Agent"}` : "Awaiting agent collection",
                completed: isStarted,
                current: isStarted && !isDelivered
            },
            {
                title: "4. Received at Recycling Facility",
                desc: isDelivered ? `Verified & received at ${item.recyclingCenterName || "Recycling Facility"}` : "Pending arrival at recycling center",
                completed: isDelivered,
                current: isDelivered
            }
        ];
    };

    return (
        <div className="rec-delivery-page">
            <Sidebar />

            <div className="rec-main-container">
                {/* Header Bar */}
                <div className="rec-header-bar">
                    <div className="rec-header-actions">
                        <div className="search-box-v2" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            <FiSearch className="search-icon" style={{ position: "absolute", left: "0.85rem", color: "#94a3b8", fontSize: "0.95rem" }} />
                            <input
                                type="text"
                                placeholder="Search device, agent, category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    padding: "0.45rem 1rem 0.45rem 2.3rem",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "10px",
                                    background: "#ffffff",
                                    fontSize: "0.8rem",
                                    color: "#0f172a",
                                    width: "240px",
                                    outline: "none",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                                }}
                            />
                        </div>

                        <button className="rec-refresh-btn" onClick={() => fetchMyDeliveries()}>
                            <FiRefreshCw /> Refresh
                        </button>

                        <button
                            className="rec-refresh-btn"
                            style={{ position: "relative" }}
                            title={`Notifications ${unreadNotifCount > 0 ? `(${unreadNotifCount} unread)` : ""}`}
                            onClick={() => navigate("/recyclingcenter_notification")}
                        >
                            <FiBell style={{ fontSize: "1.1rem" }} />
                            {unreadNotifCount > 0 && (
                                <span style={{
                                    position: "absolute",
                                    top: "-4px",
                                    right: "-4px",
                                    background: "#ef4444",
                                    color: "#ffffff",
                                    fontSize: "0.65rem",
                                    fontWeight: 800,
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                                </span>
                            )}
                        </button>

                        <div className="rec-user-avatar" title={centerName} style={{ cursor: "pointer" }} onClick={() => navigate("/recycle_profile")}>
                            {profilePhoto ? (
                                <img
                                    src={getMediaUrl(profilePhoto, "ProfilePhotos")}
                                    alt={centerName}
                                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                                    onError={() => setProfilePhoto(null)}
                                />
                            ) : (
                                userInitial
                            )}
                        </div>
                    </div>
                </div>

                {/* Hero Dispatch Banner Card */}
                <div className="rec-hero-banner">
                    <div className="rec-hero-content">
                        <h2><FiTruck /> Recycling Center Inbound Shipments</h2>
                        <p>Track live agent dispatches and incoming e-waste deliveries transferred from inspection hubs to your recycling center.</p>
                    </div>
                </div>

                {/* KPI Summary Cards Grid */}
                <div className="rec-kpi-grid">
                    <div className="rec-kpi-card">
                        <div className="rec-kpi-icon all"><FiBox /></div>
                        <div className="rec-kpi-info">
                            <h3>{deliveries.length}</h3>
                            <p>Total Allocated Shipments</p>
                        </div>
                    </div>
                    <div className="rec-kpi-card">
                        <div className="rec-kpi-icon transit"><FiTruck /></div>
                        <div className="rec-kpi-info">
                            <h3>{inTransitCount}</h3>
                            <p>In Transit to Facility</p>
                        </div>
                    </div>
                    <div className="rec-kpi-card">
                        <div className="rec-kpi-icon delivered"><FiCheckCircle /></div>
                        <div className="rec-kpi-info">
                            <h3>{deliveredCount}</h3>
                            <p>Received at Center</p>
                        </div>
                    </div>
                    <div className="rec-kpi-card">
                        <div className="rec-kpi-icon weight"><FiCpu /></div>
                        <div className="rec-kpi-info">
                            <h3>{totalWeight.toFixed(1)} kg</h3>
                            <p>Total E-Waste Weight</p>
                        </div>
                    </div>
                </div>

                {/* Main Controls Panel */}
                <div className="control-bar-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.2rem", color: "#0f172a" }}>Facility Inbound Dispatches</h3>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>Live tracking for agent collection transfers from inspection hubs</p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap", marginLeft: "auto" }}>
                        <div className="filter-pills">
                            {["All", "In Transit", "Delivered to Center", "Completed"].map((tab) => (
                                <button
                                    key={tab}
                                    className={`pill-btn ${activeTab === tab ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="view-toggle-btns">
                            <button className={`view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")} title="Grid View">
                                <FiGrid />
                            </button>
                            <button className={`view-btn ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")} title="Table View">
                                <FiList />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading recycling center shipments...</p>
                    </div>
                ) : filteredDeliveries.length === 0 ? (
                    <div className="no-data-state">
                        <FiBox className="no-data-icon" />
                        <p>No active shipments found matching "{activeTab}".</p>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="rec-cards-grid">
                        {filteredDeliveries.map((item, index) => {
                            const trackingId = `TRK-REC-${item.recyclingCenterRequestId || item.collectionAssignmentId || item.deviceId}`;
                            return (
                                <div className="rec-delivery-card" key={item.recyclingCenterRequestId || item.collectionAssignmentId || index}>
                                    <div>
                                        <div className="rec-card-top-row">
                                            <div className="rec-cat-icon-box">
                                                {getCategoryIcon(item.categoryName)}
                                            </div>
                                            <div>{getStatusBadge(item)}</div>
                                        </div>

                                        <h4 className="rec-card-brand-name">{item.brand} {item.model}</h4>
                                        <p className="rec-card-cat-sub">
                                            {trackingId} &bull; {item.categoryName || "Electronics"} ({item.quantity || 1} units)
                                        </p>

                                        {/* Agent Chip */}
                                        <div className="rec-agent-chip-box">
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                                <div className="rec-agent-avatar">
                                                    {item.collectionAgentPhoto ? (
                                                        <img src={getAgentPhoto(item.collectionAgentPhoto)} alt="Agent" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                                                    ) : (
                                                        (item.collectionAgentName || "A").charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="rec-agent-name">{item.collectionAgentName || "Assigned Agent"}</span>
                                                    <span className="rec-agent-sub">{item.collectionAgentPhone || "Ph: N/A"}</span>
                                                </div>
                                            </div>
                                            {item.collectionAgentPhone && (
                                                <a href={`tel:${item.collectionAgentPhone}`} className="btn-rec-call" title="Call Agent">
                                                    <FiPhone />
                                                </a>
                                            )}
                                        </div>

                                        {/* Origin & Destination Details */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
                                            <div className="rec-detail-row">
                                                <FiUser className="detail-icon" style={{ color: "#3b82f6" }} />
                                                <div>
                                                    <div className="detail-label">Origin (Technician Hub)</div>
                                                    <div className="detail-val">{item.technicianName || item.inspectionCenterName || "Technician Hub"}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.technicianAddress}</div>
                                                </div>
                                            </div>

                                            <div className="rec-detail-row">
                                                <FiMapPin className="detail-icon" style={{ color: "#059669" }} />
                                                <div>
                                                    <div className="detail-label">Destination (Recycling Facility)</div>
                                                    <div className="detail-val">{item.recyclingCenterName || centerName}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.recyclingCenterAddress}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button - Live Tracking */}
                                    <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px dashed #e2e8f0" }}>
                                        <button
                                            onClick={() => setSelectedDelivery(item)}
                                            title="Track Live Delivery Status"
                                            style={{
                                                width: "100%",
                                                height: "42px",
                                                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                                                color: "#ffffff",
                                                border: "none",
                                                borderRadius: "10px",
                                                fontSize: "0.875rem",
                                                fontWeight: 700,
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "0.55rem",
                                                boxShadow: "0 4px 14px rgba(5, 150, 105, 0.28)",
                                                cursor: "pointer",
                                                transition: "all 0.2s ease"
                                            }}
                                        >
                                            <FiNavigation style={{ fontSize: "1rem" }} />
                                            <span>Track Live Status</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="glass-table-wrapper">
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Tracking ID</th>
                                    <th>Device / Shipment</th>
                                    <th>Collection Agent</th>
                                    <th>Origin Hub</th>
                                    <th>Destination Center</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDeliveries.map((item, index) => {
                                    const trackingId = `TRK-REC-${item.recyclingCenterRequestId || item.collectionAssignmentId || item.deviceId}`;
                                    return (
                                        <tr key={item.recyclingCenterRequestId || item.collectionAssignmentId || index} className="table-row-hover">
                                            <td style={{ fontWeight: 700, color: "#64748b" }}>{index + 1}</td>
                                            <td>
                                                <span style={{ background: "#f1f5f9", color: "#0f172a", border: "1px solid #cbd5e1", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.725rem", fontWeight: 700, fontFamily: "monospace", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                                    <FiNavigation style={{ color: "#059669" }} />
                                                    {trackingId}
                                                </span>
                                            </td>
                                            <td>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.brand} {item.model}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.categoryName} &bull; {item.quantity} Unit(s)</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.collectionAgentName || "Assigned Agent"}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.collectionAgentPhone || "Ph: N/A"}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.technicianName || item.inspectionCenterName || "Technician Hub"}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.technicianAddress}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.recyclingCenterName || centerName}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.recyclingCenterAddress}</div>
                                                </div>
                                            </td>
                                            <td>{getStatusBadge(item)}</td>
                                            <td>
                                                <button
                                                    className="btn-track-live"
                                                    onClick={() => setSelectedDelivery(item)}
                                                    title="Track Live Status"
                                                >
                                                    <FiNavigation />
                                                    <span>Track</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Live Delivery Tracking Stepper Modal */}
            {selectedDelivery && (
                <div className="rec-modal-overlay" onClick={() => setSelectedDelivery(null)}>
                    <div className="rec-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px", borderRadius: "20px", overflow: "hidden", padding: 0 }}>
                        {/* Modal Header */}
                        <div style={{
                            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                            color: "#ffffff",
                            padding: "1.25rem 1.5rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{ background: "rgba(255,255,255,0.2)", padding: "0.5rem", borderRadius: "10px", display: "flex" }}>
                                    <FiTruck style={{ fontSize: "1.4rem" }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Recycling Center Live Tracking</h3>
                                    <span style={{ fontSize: "0.775rem", opacity: 0.95, fontFamily: "monospace" }}>
                                        TRK-REC-{selectedDelivery.recyclingCenterRequestId || selectedDelivery.deviceId} &bull; {selectedDelivery.brand} {selectedDelivery.model}
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedDelivery(null)}
                                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#ffffff", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <FiX />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: "1.5rem", maxHeight: "75vh", overflowY: "auto" }}>
                            {/* Summary Card */}
                            <div style={{
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "14px",
                                padding: "1rem 1.2rem",
                                marginBottom: "1.25rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: "0.75rem"
                            }}>
                                <div>
                                    <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tracking ID</div>
                                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", fontFamily: "monospace", marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <FiNavigation style={{ color: "#059669" }} />
                                        TRK-REC-{selectedDelivery.recyclingCenterRequestId || selectedDelivery.deviceId}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Status</div>
                                    <div style={{ marginTop: "0.2rem" }}>
                                        {getStatusBadge(selectedDelivery)}
                                    </div>
                                </div>
                            </div>

                            {/* Agent Banner */}
                            <div style={{
                                background: "#f0fdf4",
                                border: "1px solid #bbf7d0",
                                borderRadius: "14px",
                                padding: "1rem",
                                marginBottom: "1.25rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                    {selectedDelivery.collectionAgentPhoto ? (
                                        <img 
                                            src={getAgentPhoto(selectedDelivery.collectionAgentPhoto)} 
                                            alt="Agent Profile" 
                                            style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} 
                                        />
                                    ) : (
                                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#059669", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.15rem" }}>
                                            {(selectedDelivery.collectionAgentName || "A").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontSize: "0.725rem", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Collection Transfer Agent</div>
                                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#065f46" }}>
                                            {selectedDelivery.collectionAgentName || "Assigned Agent"}
                                        </div>
                                        {selectedDelivery.vehicleNumber && (
                                            <div style={{ fontSize: "0.775rem", color: "#047857", fontWeight: 600, marginTop: "0.1rem" }}>
                                                Vehicle: {selectedDelivery.vehicleNumber}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedDelivery.collectionAgentPhone && (
                                    <a 
                                        href={`tel:${selectedDelivery.collectionAgentPhone}`}
                                        style={{
                                            background: "#059669",
                                            color: "#ffffff",
                                            padding: "0.5rem 1rem",
                                            borderRadius: "10px",
                                            textDecoration: "none",
                                            fontSize: "0.825rem",
                                            fontWeight: 700,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.4rem",
                                            boxShadow: "0 2px 5px rgba(5,150,105,0.3)"
                                        }}
                                    >
                                        <FiPhone /> Call Agent
                                    </a>
                                )}
                            </div>

                            {/* Stepper Timeline */}
                            <div style={{ marginBottom: "1rem" }}>
                                <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.875rem", fontWeight: 700, color: "#1e293b" }}>
                                    Recycling Center Transfer Progress Timeline
                                </h4>
                                <div className="rec-timeline">
                                    {getTimelineSteps(selectedDelivery).map((step, sIdx) => (
                                        <div key={sIdx} className={`rec-timeline-step ${step.completed ? "completed" : ""} ${step.current ? "current" : ""}`}>
                                            <div className="rec-timeline-dot">
                                                {step.completed ? <FiCheckCircle /> : (sIdx + 1)}
                                            </div>
                                            <div className="rec-timeline-content">
                                                <h5>{step.title}</h5>
                                                <p>{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RecyclingDelivery;
