import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
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
    FiActivity,
    FiBarChart2
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
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    // Profile state
    const [centerName, setCenterName] = useState(() => {
        return localStorage.getItem("centerName") ||
               localStorage.getItem("userName") ||
               localStorage.getItem("username") ||
               "Recycling Center";
    });
    const [centerId, setCenterId] = useState(() => {
        return localStorage.getItem("recyclingCenterId") || localStorage.getItem("centerId") || null;
    });
    const [profilePhoto, setProfilePhoto] = useState(() => {
        return localStorage.getItem("centerPhoto") || localStorage.getItem("profilePhoto") || null;
    });
    const [imgError, setImgError] = useState(false);

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

    const getMediaUrl = (filename, folderName = "Center Photo") => {
        if (!filename) return null;
        if (filename.startsWith("data:") || filename.startsWith("blob:") || filename.startsWith("http://") || filename.startsWith("https://")) {
            return filename;
        }
        const cleanName = filename.replace(/^uploads[\\/]/, "").replace(/^[\\/]/, "");
        if (cleanName.includes("/") || cleanName.includes("\\")) {
            return `https://ecocycle.runasp.net/uploads/${cleanName.replace(/\\/g, "/")}`;
        }
        return folderName
            ? `https://ecocycle.runasp.net/uploads/recycling/${folderName}/${cleanName}`
            : `https://ecocycle.runasp.net/uploads/${cleanName}`;
    };

    const fetchCenterProfile = async (token) => {
        try {
            const res = await axios.get("https://ecocycle.runasp.net/api/RecyclingCenter/myprofile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data || {};
            const name = data.CenterName || data.centerName || data.OwnerName || data.ownerName || data.name || "";
            const photo = data.CenterPhoto || data.centerPhoto || data.Photo || data.photo || data.profilePhoto || data.photoPath;
            const id = data.recyclingCenterId || data.centerId || data.id;
            if (name) {
                setCenterName(name);
                localStorage.setItem("centerName", name);
            }
            if (photo) {
                setProfilePhoto(photo);
                localStorage.setItem("centerPhoto", photo);
                localStorage.setItem("profilePhoto", photo);
            }
            if (id) {
                setCenterId(id);
                localStorage.setItem("recyclingCenterId", id);
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

            let currentCenterId = centerId || localStorage.getItem("recyclingCenterId") || localStorage.getItem("centerId");
            let currentCenterName = centerName || localStorage.getItem("centerName");

            const [allocRes, assignRes, profRes] = await Promise.all([
                axios.get("https://ecocycle.runasp.net/api/AllocateRecyclingCenter/my-requests", {
                    headers: { Authorization: `Bearer ${authToken}` }
                }).catch(() => ({ data: [] })),
                axios.get("https://ecocycle.runasp.net/api/CollectionAssignment/admin/all-assignments", {
                    headers: { Authorization: `Bearer ${authToken}` }
                }).catch(() => ({ data: [] })),
                axios.get("https://ecocycle.runasp.net/api/RecyclingCenter/myprofile", {
                    headers: { Authorization: `Bearer ${authToken}` }
                }).catch(() => ({ data: {} }))
            ]);

            if (profRes && profRes.data) {
                const pData = profRes.data;
                if (pData.recyclingCenterId) {
                    currentCenterId = pData.recyclingCenterId;
                    setCenterId(currentCenterId);
                    localStorage.setItem("recyclingCenterId", currentCenterId);
                }
                if (pData.centerName) {
                    currentCenterName = pData.centerName;
                    setCenterName(currentCenterName);
                    localStorage.setItem("centerName", currentCenterName);
                }
            }

            const allocList = Array.isArray(allocRes.data) ? allocRes.data : [];
            const rawAssignList = Array.isArray(assignRes.data) ? assignRes.data : [];

            // STRICT FILTER: Keep ONLY delivery assignments destined to this Recycling Center
            // (AssignmentType must be TechnicianToRecyclingCenter, never CustomerToTechnician or Refurbishment)
            const techToRecAssignments = rawAssignList.filter(a => {
                const aType = String(a.assignmentType || "").toLowerCase();
                if (aType !== "techniciantorecyclingcenter") return false;

                // Exclude cancelled / rejected / expired assignments
                const stat = String(a.status || "").toLowerCase();
                if (stat === "expired" || stat === "cancelled" || stat === "rejected") return false;

                const assignCenterId = a.recyclingCenterId || a.destinationCenterId;
                const assignCenterName = (a.recyclingCenterName || "").trim().toLowerCase();
                const myCenterName = (currentCenterName || "").trim().toLowerCase();

                // If center ID is available on both, verify match
                if (currentCenterId && assignCenterId) {
                    if (String(assignCenterId) !== String(currentCenterId)) return false;
                }

                // If center name is available on assignment, verify match against current center name
                if (myCenterName && myCenterName !== "recycling center" && assignCenterName && assignCenterName !== "recycling center") {
                    if (assignCenterName !== myCenterName) return false;
                }

                return true;
            });

            // Lookup map for device allocation request details
            const allocByDevice = new Map();
            allocList.forEach(item => {
                if (item.deviceId) {
                    allocByDevice.set(item.deviceId, item);
                }
            });

            // Map latest TechnicianToRecyclingCenter assignment by deviceId so there is only one delivery per device
            const latestAssignByDevice = new Map();
            const sortedTechAssigns = [...techToRecAssignments].sort((a, b) => (a.collectionAssignmentId || 0) - (b.collectionAssignmentId || 0));
            sortedTechAssigns.forEach(a => {
                const key = a.deviceId || a.collectionAssignmentId;
                latestAssignByDevice.set(key, a);
            });

            const combined = [];
            latestAssignByDevice.forEach(item => {
                const allocReq = item.deviceId ? allocByDevice.get(item.deviceId) : null;
                const itemWeight = item.weight ? parseFloat(item.weight) : (allocReq?.weight ? parseFloat(allocReq.weight) : 1.5);
                const itemDeliveredAt = item.deliveredAt || item.deliveryDeliveredAt || (item.status === "DeliveredToCenter" ? item.updatedAt : null);
                const itemPickedUpAt = item.pickedUpAt || item.pickupPickedUpAt || null;

                combined.push({
                    recyclingCenterRequestId: allocReq?.recyclingCenterRequestId || item.collectionAssignmentId,
                    collectionAssignmentId: item.collectionAssignmentId,
                    deviceId: item.deviceId,
                    brand: item.brand || allocReq?.brand || "E-Waste",
                    model: item.model || allocReq?.model || "Device",
                    categoryName: item.categoryName || allocReq?.categoryName || "Electronics",
                    quantity: item.quantity || allocReq?.quantity || 1,
                    weight: itemWeight > 0 ? itemWeight : 1.5,
                    status: item.status || "Assigned",
                    deliveryStatus: item.deliveryStatus || (item.status === "DeliveredToCenter" ? "delivered" : "intransit"),
                    pickupStatus: item.pickupStatus || "",
                    lifecycleStatus: allocReq?.lifecycleStatus || item.lifecycleStatus || "allocatedtorecycling",
                    collectionAgentName: item.collectionAgentName || "Assigned Agent",
                    collectionAgentPhone: item.collectionAgentPhone || "",
                    collectionAgentPhoto: item.collectionAgentPhoto || null,
                    vehicleNumber: item.vehicleNumber || "",
                    technicianName: item.technicianName || item.inspectionCenterName || "Technician Hub",
                    inspectionCenterName: item.inspectionCenterName || item.technicianName || "Technician Hub",
                    technicianAddress: item.technicianAddress || item.deliveredAddress || item.address || "Inspection Hub",
                    recyclingCenterName: item.recyclingCenterName || allocReq?.centerName || currentCenterName,
                    recyclingCenterAddress: item.recyclingCenterAddress || allocReq?.centerAddress || "Recycling Facility",
                    createdAt: item.createdAt || allocReq?.createdAt,
                    assignedAt: item.assignedAt || allocReq?.assignedAt,
                    acceptedAt: item.acceptedAt,
                    pickupStartedAt: item.pickupStartedAt || item.startedAt,
                    pickedUpAt: itemPickedUpAt,
                    deliveryStartedAt: item.deliveryStartedAt,
                    deliveredAt: itemDeliveredAt,
                    deliveryDeliveredAt: item.deliveryDeliveredAt,
                    deliveryDeviceVerified: item.deliveryDeviceVerified || false
                });
            });

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

        if (item.pickupStartedAt || item.deliveredAt || item.pickedUpAt || item.deliveryDeliveredAt) return true;

        const startedDeliveryStatuses = [
            "assigned",
            "accepted",
            "waiting",
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

    const checkIsDelivered = (item) => {
        if (!item) return false;
        const delStat = String(item.deliveryStatus || "").toLowerCase();
        const cas = String(item.status || "").toLowerCase();
        const lcs = String(item.lifecycleStatus || "").toLowerCase();
        return (
            delStat === "delivered" ||
            cas === "deliveredtocenter" ||
            Boolean(item.deliveryDeliveredAt) ||
            Boolean(item.deliveredAt) ||
            lcs === "atrecyclingcenter" ||
            lcs === "recycled"
        );
    };

    const checkIsPendingVerification = (item) => {
        if (!item || checkIsDelivered(item)) return false;
        const delStat = String(item.deliveryStatus || "").toLowerCase();
        const cas = String(item.status || "").toLowerCase();
        const lcs = String(item.lifecycleStatus || "").toLowerCase();
        return (
            delStat === "pendingverification" ||
            cas === "pendingverification" ||
            cas === "awaitingapproval" ||
            cas === "awaitingtechnicianapproval" ||
            lcs === "pendingverification" ||
            lcs === "awaitingtechnicianapproval"
        );
    };

    const checkIsPickedUp = (item) => {
        if (!item) return false;
        const cas = String(item.status || "").toLowerCase();
        const pickStat = String(item.pickupStatus || "").toLowerCase();
        return (
            checkIsDelivered(item) ||
            checkIsPendingVerification(item) ||
            Boolean(item.pickedUpAt) ||
            Boolean(item.pickupPickedUpAt) ||
            pickStat === "completed" ||
            pickStat === "pickedup" ||
            cas === "completed" ||
            cas === "outfordelivery" ||
            cas === "intransit"
        );
    };

    const checkIsInTransit = (item) => {
        if (!item || checkIsDelivered(item) || checkIsPendingVerification(item)) return false;
        const cas = String(item.status || "").toLowerCase();
        const delStat = String(item.deliveryStatus || "").toLowerCase();
        const lcs = String(item.lifecycleStatus || "").toLowerCase();
        return (
            checkIsPickedUp(item) ||
            delStat === "intransit" ||
            delStat === "outfordelivery" ||
            cas === "intransit" ||
            cas === "outfordelivery" ||
            lcs === "intransit"
        );
    };

    // Filter deliveries so ONLY started deliveries are displayed on the page
    const filteredDeliveries = deliveries.filter(item => {
        if (!hasAgentStartedDelivery(item)) return false;

        const isDelivered = checkIsDelivered(item);
        const isInTransit = !isDelivered;

        if (activeTab === "In Transit" && !isInTransit) return false;
        if (activeTab === "Delivered to Center" && !isDelivered) return false;
        if (activeTab === "Completed" && !isDelivered) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const devName = `${item.brand || ""} ${item.model || ""}`.toLowerCase();
        const catName = String(item.categoryName || "").toLowerCase();
        const agentName = String(item.collectionAgentName || "").toLowerCase();
        const techName = String(item.technicianName || "").toLowerCase();
        const customerName = String(item.customerName || "").toLowerCase();
        const trackingId = `trk-rec-${item.collectionAssignmentId || item.deviceId || item.recyclingCenterRequestId}`.toLowerCase();
        const deviceId = String(item.deviceId || "").toLowerCase();
        const reqId = String(item.recyclingCenterRequestId || "").toLowerCase();

        return (
            devName.includes(q) ||
            catName.includes(q) ||
            agentName.includes(q) ||
            techName.includes(q) ||
            customerName.includes(q) ||
            trackingId.includes(q) ||
            deviceId.includes(q) ||
            reqId.includes(q)
        );
    });

    const inTransitCount = deliveries.filter(d => hasAgentStartedDelivery(d) && !checkIsDelivered(d)).length;

    const deliveredCount = deliveries.filter(d => checkIsDelivered(d)).length;

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
        if (checkIsDelivered(item)) {
            return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>
                    <FiCheckCircle /> Received at Facility
                </span>
            );
        }

        if (checkIsPendingVerification(item)) {
            return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#fef3c7", color: "#b45309" }}>
                    <FiClock /> Handover Pending Verification
                </span>
            );
        }

        if (checkIsInTransit(item)) {
            return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#dbeafe", color: "#1e40af" }}>
                    <FiTruck /> In Transit to Facility
                </span>
            );
        }

        return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#fef3c7", color: "#b45309" }}>
                <FiClock /> Pickup from Hub Pending
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

    const formatDate = (dateVal) => {
        if (!dateVal) return "";
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return "";
            return d.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            });
        } catch {
            return "";
        }
    };

    const formatDateTime = (dateVal) => {
        if (!dateVal) return "";
        try {
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return "";
            return d.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }) + ", " + d.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });
        } catch {
            return "";
        }
    };

    const getTimelineSteps = (item) => {
        if (!item) return [];

        const isDelivered = checkIsDelivered(item);
        const isPendingVerification = checkIsPendingVerification(item);
        const isPickedUpFromHub = checkIsPickedUp(item);
        const isInTransitToCenter = checkIsInTransit(item);

        const cas = String(item.status || "").toLowerCase();
        const pickStat = String(item.pickupStatus || "").toLowerCase();

        const isPickupStarted = isPickedUpFromHub ||
            cas === "pickupstarted" ||
            cas === "en route" ||
            pickStat === "pickupstarted" ||
            Boolean(item.pickupStartedAt);

        const isAssigned = isPickupStarted ||
            cas === "assigned" ||
            cas === "accepted" ||
            Boolean(item.collectionAgentName && item.collectionAgentName !== "Unassigned" && item.collectionAgentName !== "Assigned Collection Agent");

        const allocDateStr = formatDate(item.createdAt || item.assignedAt);
        const pickupDateStr = formatDateTime(item.pickedUpAt) || formatDate(item.pickedUpAt);
        const deliveredDateStr = formatDateTime(item.deliveredAt || item.deliveryDeliveredAt) || formatDate(item.deliveredAt || item.deliveryDeliveredAt);

        // Step 1: Recycling Allocation Confirmed
        const step1 = {
            title: "1. Recycling Allocation Confirmed",
            desc: allocDateStr ? `Allocated on ${allocDateStr}` : "Recycling allocation confirmed",
            completed: true,
            current: false
        };

        // Step 2: Handover & Pickup from Technician Hub
        let step2;
        if (isPickedUpFromHub) {
            step2 = {
                title: "2. Handover & Pickup from Technician Hub",
                desc: `Dispatched from ${item.technicianName || item.inspectionCenterName || "Technician Hub"}${pickupDateStr ? ` on ${pickupDateStr}` : ""}`,
                completed: true,
                current: false
            };
        } else if (isPickupStarted) {
            step2 = {
                title: "2. Handover & Pickup from Technician Hub",
                desc: `Agent ${item.collectionAgentName || "Agent"} en route to Technician Hub for pickup`,
                completed: false,
                current: true
            };
        } else if (isAssigned) {
            step2 = {
                title: "2. Handover & Pickup from Technician Hub",
                desc: `Agent ${item.collectionAgentName || "Agent"} assigned for pickup from Technician Hub`,
                completed: false,
                current: true
            };
        } else {
            step2 = {
                title: "2. Handover & Pickup from Technician Hub",
                desc: `Awaiting agent pickup from ${item.technicianName || item.inspectionCenterName || "Technician Hub"}`,
                completed: false,
                current: false
            };
        }

        // Step 3: In Transit to Recycling Center
        let step3;
        if (isDelivered || isPendingVerification) {
            step3 = {
                title: "3. In Transit to Recycling Center",
                desc: `En route by agent ${item.collectionAgentName || "Assigned Agent"}`,
                completed: true,
                current: false
            };
        } else if (isInTransitToCenter) {
            step3 = {
                title: "3. In Transit to Recycling Center",
                desc: `En route to facility by agent ${item.collectionAgentName || "Assigned Agent"}${item.vehicleNumber ? ` (${item.vehicleNumber})` : ""}`,
                completed: false,
                current: true
            };
        } else {
            step3 = {
                title: "3. In Transit to Recycling Center",
                desc: "Awaiting agent collection from Technician Hub",
                completed: false,
                current: false
            };
        }

        // Step 4: Received at Recycling Facility
        let step4;
        if (isDelivered) {
            step4 = {
                title: "4. Received at Recycling Facility",
                desc: `Verified & received at ${item.recyclingCenterName || centerName || "Recycling Facility"}${deliveredDateStr ? ` on ${deliveredDateStr}` : ""}`,
                completed: true,
                current: false
            };
        } else if (isPendingVerification) {
            step4 = {
                title: "4. Received at Recycling Facility",
                desc: `Agent arrived at facility; pending handover verification`,
                completed: false,
                current: true
            };
        } else {
            step4 = {
                title: "4. Received at Recycling Facility",
                desc: `In transit to ${item.recyclingCenterName || centerName || "Recycling Facility"}`,
                completed: false,
                current: false
            };
        }

        return [step1, step2, step3, step4];
    };

    return (
        <div className="rec-delivery-page">
            <Sidebar />

            <div className="rec-main-container">
                {/* Header Topbar */}
                <header className="recyc-dashboard-topbar">
                    <div className="topbar-title-group">
                        <div className="topbar-header-row">
                            <h1>Inbound Shipments &amp; Logistics</h1>
                        </div>
                        <p className="topbar-subtitle">
                            Live agent collection tracking &amp; incoming e-waste facility transfer verification
                        </p>
                    </div>

                    <div className="topbar-right-group">
                        <div className="search-bar">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search device, ID or customer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>


                        <button
                            className="icon-button notif-bell-btn"
                            onClick={() => navigate("/recyclingcenter_notification")}
                            title="Notifications"
                        >
                            <FiBell />
                            {unreadNotifCount > 0 && (
                                <span className="notif-badge">{unreadNotifCount > 9 ? "9+" : unreadNotifCount}</span>
                            )}
                        </button>

                        <Link to="/recycle_profile" className="profile-chip" title={`Facility Profile - ${centerName}`}>
                            {profilePhoto && !imgError ? (
                                <img
                                    src={getMediaUrl(profilePhoto, "Center Photo")}
                                    alt={centerName}
                                    className="profile-avatar-img"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="profile-avatar">
                                    {(centerName || "R").charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="profile-name">{centerName}</span>
                        </Link>
                    </div>
                </header>

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

                    <div className="panel-controls-right" style={{ marginLeft: "auto" }}>
                        <div className="filter-pills">
                            {[
                                { id: "All", label: "All", count: deliveries.filter(hasAgentStartedDelivery).length },
                                { id: "In Transit", label: "In Transit", count: inTransitCount },
                                { id: "Delivered to Center", label: "Delivered to Center", count: deliveredCount },
                                { id: "Completed", label: "Completed", count: deliveredCount }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`filter-pill-btn ${activeTab === tab.id ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label} ({tab.count})
                                </button>
                            ))}
                        </div>

                        <div className="view-toggle-btns">
                            <button
                                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                                onClick={() => setViewMode("grid")}
                                title="Grid View"
                                style={viewMode === "grid" ? { background: "#059669", color: "#ffffff", boxShadow: "0 2px 8px rgba(5, 150, 105, 0.35)" } : {}}
                            >
                                <FiGrid />
                            </button>
                            <button
                                className={`view-btn ${viewMode === "table" ? "active" : ""}`}
                                onClick={() => setViewMode("table")}
                                title="Table View"
                                style={viewMode === "table" ? { background: "#059669", color: "#ffffff", boxShadow: "0 2px 8px rgba(5, 150, 105, 0.35)" } : {}}
                            >
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
                    <div className="empty-container">
                        <FiBox style={{ fontSize: "2.5rem", color: "#cbd5e1" }} />
                        <h4>No devices found</h4>
                        <p>{searchQuery ? `No matches for "${searchQuery}"` : `No shipments found in "${activeTab}" category.`}</p>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="rec-cards-grid">
                        {filteredDeliveries.map((item, index) => {
                            const trackingId = `TRK-REC-${item.collectionAssignmentId || item.deviceId || item.recyclingCenterRequestId}`;
                            return (
                                <div className="rec-delivery-card" key={item.collectionAssignmentId || item.deviceId || index}>
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
                                    const trackingId = `TRK-REC-${item.collectionAssignmentId || item.deviceId || item.recyclingCenterRequestId}`;
                                    return (
                                        <tr key={item.collectionAssignmentId || item.deviceId || index} className="table-row-hover">
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
                                        TRK-REC-{selectedDelivery.collectionAssignmentId || selectedDelivery.deviceId} &bull; {selectedDelivery.brand} {selectedDelivery.model}
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
                                        TRK-REC-{selectedDelivery.collectionAssignmentId || selectedDelivery.deviceId}
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
                                                {step.completed ? <FiCheckCircle /> : step.current ? <FiClock /> : (sIdx + 1)}
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

                        {/* Modal Footer */}
                        <div style={{
                            padding: "0.85rem 1.5rem",
                            borderTop: "1px solid #e2e8f0",
                            display: "flex",
                            justifyContent: "flex-end",
                            background: "#ffffff"
                        }}>
                            <button
                                onClick={() => setSelectedDelivery(null)}
                                style={{
                                    background: "#059669",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "10px",
                                    padding: "0.55rem 1.4rem",
                                    fontSize: "0.875rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    boxShadow: "0 2px 6px rgba(5,150,105,0.25)",
                                    transition: "background 0.2s ease"
                                }}
                            >
                                Close Tracking
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RecyclingDelivery;
