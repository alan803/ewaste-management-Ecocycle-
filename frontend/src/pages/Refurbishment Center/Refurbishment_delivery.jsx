import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
    FiNavigation,
    FiShield,
    FiActivity,
    FiTool,
    FiAlertTriangle,
    FiCheckSquare
} from "react-icons/fi";
import "./Sidebar.css";
import "./Refurbishmentcenter_dashboard.css";
import "./Refurbishment_delivery.css";

function RefurbishmentDelivery() {
    const navigate = useNavigate();
    const location = useLocation();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [imgError, setImgError] = useState(false);

    // Profile state
    const [centerName, setCenterName] = useState(() => {
        return localStorage.getItem("refurbishmentCenterName") ||
               localStorage.getItem("centerName") ||
               localStorage.getItem("userName") ||
               localStorage.getItem("username") ||
               "Refurbishment Center";
    });
    const [centerId, setCenterId] = useState(() => {
        return localStorage.getItem("refurbishmentCenterId") || localStorage.getItem("centerId") || null;
    });
    const [profilePhoto, setProfilePhoto] = useState(() => {
        return localStorage.getItem("refurbishmentProfilePhoto") || localStorage.getItem("profilePhoto") || null;
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

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const q = params.get("device") || params.get("deviceId") || params.get("q") || params.get("id");
        if (q) {
            setSearchQuery(q);
        }
    }, [location.search]);

    const getMediaUrl = (filename, folderName = "center-photo") => {
        if (!filename) return null;
        if (filename.startsWith("data:") || filename.startsWith("blob:") || filename.startsWith("http://") || filename.startsWith("https://")) {
            return filename;
        }
        const cleanName = filename.replace(/^uploads[\\/]/, "").replace(/^[\\/]/, "");
        if (cleanName.includes("/") || cleanName.includes("\\")) {
            return `https://ecocycle.runasp.net/uploads/${cleanName.replace("\\", "/")}`;
        }
        return `https://ecocycle.runasp.net/uploads/refurbishment/${folderName}/${cleanName}`;
    };

    const fetchCenterProfile = async (token) => {
        try {
            const res = await axios.get("https://ecocycle.runasp.net/api/RefurbishmentCenter/myprofile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data || {};
            const name = data.CenterName || data.centerName || data.OwnerName || data.ownerName || data.name || "";
            const photo = data.CenterPhoto || data.centerPhoto || data.ShopPhoto || data.shopPhoto || data.ProfileImage || data.profileImage || data.photo || data.profilePhoto;
            const id = data.RefurbishmentCenterId || data.refurbishmentCenterId || data.centerId || data.id;
            if (name) {
                setCenterName(name);
                localStorage.setItem("refurbishmentCenterName", name);
            }
            if (photo) {
                setProfilePhoto(photo);
                localStorage.setItem("refurbishmentProfilePhoto", photo);
            }
            if (id) {
                setCenterId(id);
                localStorage.setItem("refurbishmentCenterId", id);
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
            const unread = list.filter(n => {
                const isR = n.isRead !== undefined ? n.isRead : (n.isread !== undefined ? n.isread : n.Isread);
                return !isR;
            }).length;
            setUnreadNotifCount(unread);
        } catch {
            setUnreadNotifCount(0);
        }
    };

    const fetchMyDeliveries = async (token) => {
        const authToken = token || localStorage.getItem("token");
        if (!authToken) return;
        try {
            setLoading(true);

            let currentCenterId = centerId || localStorage.getItem("refurbishmentCenterId") || localStorage.getItem("centerId");
            let currentCenterName = centerName || localStorage.getItem("refurbishmentCenterName") || localStorage.getItem("centerName");

            const [allocRes, assignRes, profRes] = await Promise.all([
                axios.get("https://ecocycle.runasp.net/api/AllocateRefurbishmentCenter/my-requests", {
                    headers: { Authorization: `Bearer ${authToken}` }
                }).catch(() => ({ data: [] })),
                axios.get("https://ecocycle.runasp.net/api/CollectionAssignment/admin/all-assignments", {
                    headers: { Authorization: `Bearer ${authToken}` }
                }).catch(() => ({ data: [] })),
                axios.get("https://ecocycle.runasp.net/api/RefurbishmentCenter/myprofile", {
                    headers: { Authorization: `Bearer ${authToken}` }
                }).catch(() => ({ data: {} }))
            ]);

            if (profRes && profRes.data) {
                const pData = profRes.data;
                if (pData.refurbishmentCenterId) {
                    currentCenterId = pData.refurbishmentCenterId;
                    setCenterId(currentCenterId);
                    localStorage.setItem("refurbishmentCenterId", currentCenterId);
                }
                if (pData.centerName) {
                    currentCenterName = pData.centerName;
                    setCenterName(currentCenterName);
                    localStorage.setItem("refurbishmentCenterName", currentCenterName);
                }
            }

            let allocList = Array.isArray(allocRes.data) ? allocRes.data : [];
            // If my-requests returned empty, fallback to admin/requests filtered by center
            if (allocList.length === 0) {
                try {
                    const adminReqRes = await axios.get("https://ecocycle.runasp.net/api/AllocateRefurbishmentCenter/admin/requests", {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    const allAdmin = Array.isArray(adminReqRes.data) ? adminReqRes.data : [];
                    if (currentCenterId) {
                        const filtered = allAdmin.filter(r => String(r.refurbishmentCenterId) === String(currentCenterId));
                        allocList = filtered.length > 0 ? filtered : allAdmin;
                    } else {
                        allocList = allAdmin;
                    }
                } catch {
                    allocList = [];
                }
            }

            const rawAssignList = Array.isArray(assignRes.data) ? assignRes.data : [];

            // FILTER: Keep delivery assignments destined to this Refurbishment Center
            const techToRefurbAssignments = rawAssignList.filter(a => {
                const aType = String(a.assignmentType || "").toLowerCase();
                if (aType !== "techniciantorefurbishmentcenter") return false;

                const assignCenterId = a.refurbishmentCenterId || a.destinationCenterId;
                const assignCenterName = (a.refurbishmentCenterName || "").trim().toLowerCase();
                const myCenterName = (currentCenterName || "").trim().toLowerCase();

                // If center ID is available on both, verify match
                if (currentCenterId && assignCenterId) {
                    if (String(assignCenterId) !== String(currentCenterId)) return false;
                }

                // If center name is available on assignment, verify match against current center name
                if (myCenterName && myCenterName !== "refurbishment center" && assignCenterName && assignCenterName !== "refurbishment center") {
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

            // Map latest TechnicianToRefurbishmentCenter assignment by deviceId
            const latestAssignByDevice = new Map();
            const sortedTechAssigns = [...techToRefurbAssignments].sort((a, b) => (a.collectionAssignmentId || 0) - (b.collectionAssignmentId || 0));
            sortedTechAssigns.forEach(a => {
                const key = a.deviceId || a.collectionAssignmentId;
                latestAssignByDevice.set(key, a);
            });

            const combined = [];
            const processedDeviceIds = new Set();

            // 1. Add all assignments destined to this facility
            latestAssignByDevice.forEach(item => {
                const allocReq = item.deviceId ? allocByDevice.get(item.deviceId) : null;
                const itemWeight = item.weight ? parseFloat(item.weight) : (allocReq?.weight ? parseFloat(allocReq.weight) : 1.5);
                const itemDeliveredAt = item.deliveredAt || item.deliveryDeliveredAt || (item.status === "DeliveredToCenter" ? item.updatedAt : null);
                const itemPickedUpAt = item.pickedUpAt || item.pickupPickedUpAt || null;

                if (item.deviceId) processedDeviceIds.add(item.deviceId);

                combined.push({
                    refurbishmentRequestId: allocReq?.refurbishmentRequestId || allocReq?.id || item.collectionAssignmentId,
                    collectionAssignmentId: item.collectionAssignmentId,
                    deviceId: item.deviceId,
                    brand: item.brand || allocReq?.brand || "E-Waste",
                    model: item.model || allocReq?.model || "Device",
                    categoryName: item.categoryName || allocReq?.categoryName || "Electronics",
                    quantity: item.quantity || allocReq?.quantity || 1,
                    weight: itemWeight > 0 ? itemWeight : 1.5,
                    status: item.status || allocReq?.status || "Assigned",
                    deliveryStatus: item.deliveryStatus || (item.status === "DeliveredToCenter" ? "delivered" : (itemPickedUpAt || item.status === "Completed" ? "intransit" : "pending")),
                    pickupStatus: item.pickupStatus || (itemPickedUpAt || item.status === "Completed" ? "completed" : ""),
                    lifecycleStatus: item.lifecycleStatus || allocReq?.lifecycleStatus || "allocatedtorefurbishment",
                    collectionAgentName: item.collectionAgentName || "Assigned Agent",
                    collectionAgentPhone: item.collectionAgentPhone || "",
                    collectionAgentPhoto: item.collectionAgentPhoto || null,
                    vehicleNumber: item.vehicleNumber || "",
                    technicianName: item.technicianName || item.inspectionCenterName || "Technician Hub",
                    inspectionCenterName: item.inspectionCenterName || item.technicianName || "Technician Hub",
                    technicianAddress: item.technicianAddress || item.deliveredAddress || item.address || "Inspection Hub",
                    refurbishmentCenterName: item.refurbishmentCenterName || allocReq?.refurbishmentCenterName || allocReq?.centerName || currentCenterName,
                    refurbishmentCenterAddress: item.refurbishmentCenterAddress || allocReq?.refurbishmentCenterAddress || allocReq?.centerAddress || "Refurbishment Facility",
                    customerName: allocReq?.customerName || item.customerName || "Customer",
                    customerCity: allocReq?.customerCity || item.city || "Hub",
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

            // 2. Also ensure every allocated device for this center is visible even if assignment is pending dispatch
            allocList.forEach(allocReq => {
                if (allocReq.deviceId && processedDeviceIds.has(allocReq.deviceId)) return;
                if (allocReq.deviceId) processedDeviceIds.add(allocReq.deviceId);

                const itemWeight = allocReq.weight ? parseFloat(allocReq.weight) : 1.5;
                combined.push({
                    refurbishmentRequestId: allocReq.refurbishmentRequestId || allocReq.id,
                    collectionAssignmentId: null,
                    deviceId: allocReq.deviceId,
                    brand: allocReq.brand || "E-Waste",
                    model: allocReq.model || "Device",
                    categoryName: allocReq.categoryName || allocReq.category || "Electronics",
                    quantity: allocReq.quantity || 1,
                    weight: itemWeight > 0 ? itemWeight : 1.5,
                    status: allocReq.status || "Assigned",
                    deliveryStatus: "pending",
                    pickupStatus: "pending",
                    lifecycleStatus: allocReq.lifecycleStatus || "allocatedtorefurbishment",
                    collectionAgentName: "Pending Assignment",
                    collectionAgentPhone: "",
                    collectionAgentPhoto: null,
                    vehicleNumber: "",
                    technicianName: "Inspection Technician Hub",
                    inspectionCenterName: "Inspection Hub",
                    technicianAddress: allocReq.customerCity || "Inspection Hub",
                    refurbishmentCenterName: allocReq.refurbishmentCenterName || allocReq.centerName || currentCenterName,
                    refurbishmentCenterAddress: allocReq.refurbishmentCenterAddress || allocReq.centerAddress || "Refurbishment Facility",
                    customerName: allocReq.customerName || "Customer",
                    customerCity: allocReq.customerCity || "Hub",
                    createdAt: allocReq.createdAt,
                    assignedAt: allocReq.assignedAt,
                    acceptedAt: allocReq.respondedAt,
                    pickupStartedAt: null,
                    pickedUpAt: null,
                    deliveryStartedAt: null,
                    deliveredAt: null,
                    deliveryDeliveredAt: null,
                    deliveryDeviceVerified: false
                });
            });

            setDeliveries(combined);
        } catch (err) {
            console.error("Error fetching refurbishment center deliveries:", err);
        } finally {
            setLoading(false);
        }
    };

    const checkIsExpired = (item) => {
        if (!item) return false;
        const cas = String(item.status || "").toLowerCase();
        const lcs = String(item.lifecycleStatus || "").toLowerCase();
        return cas === "expired" || lcs === "pickupexpired" || lcs === "expired";
    };

    const checkIsDelivered = (item) => {
        if (!item) return false;
        const delStat = String(item.deliveryStatus || "").toLowerCase();
        const cas = String(item.status || "").toLowerCase();
        const lcs = String(item.lifecycleStatus || "").toLowerCase();
        return (
            delStat === "delivered" ||
            cas === "deliveredtocenter" ||
            cas === "delivered" ||
            Boolean(item.deliveryDeliveredAt) ||
            Boolean(item.deliveredAt) ||
            lcs === "atrefurbishmentcenter" ||
            lcs === "refurbished" ||
            lcs === "refurbishmentinprogress" ||
            lcs === "readyforreuse"
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
        if (!item || checkIsDelivered(item) || checkIsPendingVerification(item) || checkIsExpired(item)) return false;
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

    // Filter deliveries by tab and search
    const filteredDeliveries = deliveries.filter(item => {
        const isDelivered = checkIsDelivered(item);
        const isInTransit = checkIsInTransit(item);

        if (activeTab === "In Transit" && !isInTransit) return false;
        if (activeTab === "Delivered to Center" && !isDelivered) return false;
        if (activeTab === "Completed" && !isDelivered) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const devName = `${item.brand || ""} ${item.model || ""}`.toLowerCase();
        const catName = String(item.categoryName || "").toLowerCase();
        const agentName = String(item.collectionAgentName || "").toLowerCase();
        const techName = String(item.technicianName || "").toLowerCase();
        const trackingId = `trk-ref-${item.collectionAssignmentId || item.deviceId || item.refurbishmentRequestId}`.toLowerCase();
        const devId = String(item.deviceId || "");

        return (
            devName.includes(q) ||
            catName.includes(q) ||
            agentName.includes(q) ||
            techName.includes(q) ||
            trackingId.includes(q) ||
            devId.includes(q)
        );
    });

    const inTransitCount = deliveries.filter(d => checkIsInTransit(d)).length;

    const deliveredCount = deliveries.filter(d => checkIsDelivered(d)).length;

    const totalWeight = deliveries.reduce((sum, d) => sum + ((Number(d.weight) || 0) * (Number(d.quantity) || 1)), 0);

    const getCategoryIcon = (categoryName) => {
        const cat = (categoryName || "").toLowerCase();
        if (cat.includes("computer") || cat.includes("laptop") || cat.includes("pc")) return <FiCpu />;
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
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#ede9fe", color: "#6d28d9" }}>
                    <FiTruck /> In Transit to Facility
                </span>
            );
        }

        if (checkIsExpired(item)) {
            return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#fee2e2", color: "#b91c1c" }}>
                    <FiAlertTriangle /> Pickup Expired (Awaiting Reassignment)
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

        // Step 1: Refurbishment Allocation Confirmed
        const step1 = {
            title: "1. Refurbishment Allocation Confirmed",
            desc: allocDateStr ? `Allocated on ${allocDateStr}` : "Refurbishment allocation confirmed",
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
        } else if (checkIsExpired(item)) {
            step2 = {
                title: "2. Handover & Pickup from Technician Hub",
                desc: `Agent pickup window expired; queued in system for reassignment from ${item.technicianName || item.inspectionCenterName || "Technician Hub"}`,
                completed: false,
                current: true
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

        // Step 3: In Transit to Refurbishment Facility
        let step3;
        if (isDelivered || isPendingVerification) {
            step3 = {
                title: "3. In Transit to Refurbishment Facility",
                desc: `En route by agent ${item.collectionAgentName || "Assigned Agent"}`,
                completed: true,
                current: false
            };
        } else if (isInTransitToCenter) {
            step3 = {
                title: "3. In Transit to Refurbishment Facility",
                desc: `En route to facility by agent ${item.collectionAgentName || "Assigned Agent"}${item.vehicleNumber ? ` (${item.vehicleNumber})` : ""}`,
                completed: false,
                current: true
            };
        } else {
            step3 = {
                title: "3. In Transit to Refurbishment Facility",
                desc: "Awaiting agent collection from Technician Hub",
                completed: false,
                current: false
            };
        }

        // Step 4: Received at Refurbishment Facility
        let step4;
        if (isDelivered) {
            step4 = {
                title: "4. Received at Refurbishment Facility",
                desc: `Verified & received at ${item.refurbishmentCenterName || centerName || "Refurbishment Facility"}${deliveredDateStr ? ` on ${deliveredDateStr}` : ""}`,
                completed: true,
                current: false
            };
        } else if (isPendingVerification) {
            step4 = {
                title: "4. Received at Refurbishment Facility",
                desc: `Agent arrived at facility; pending handover verification`,
                completed: false,
                current: true
            };
        } else {
            step4 = {
                title: "4. Received at Refurbishment Facility",
                desc: `In transit to ${item.refurbishmentCenterName || centerName || "Refurbishment Facility"}`,
                completed: false,
                current: false
            };
        }

        return [step1, step2, step3, step4];
    };

    return (
        <div className="refurb-dashboard-layout refurb-delivery-page">
            <Sidebar />

            <main className="refurb-main-content refurb-main-container">
                {/* Header Ribbon */}
                <div className="refurb-header-ribbon">
                    <div>
                        <h1 className="refurb-welcome-title">Inbound Deliveries &amp; Logistics</h1>
                        <p className="refurb-welcome-sub">Refurbishment Center Operations &bull; Live Inbound Device Shipments &amp; Handover Tracking</p>
                    </div>

                    <div className="refurb-header-actions">
                        <button
                            onClick={() => navigate("/refurbishmentcenter_notification")}
                            title="Notifications"
                            className="notif-bell-btn"
                        >
                            <FiBell style={{ color: "#475569", fontSize: "1.1rem" }} />
                            {unreadNotifCount > 0 && (
                                <span className="notif-badge">
                                    {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                                </span>
                            )}
                        </button>

                        <Link to="/refurbishment_profile" className="refurb-profile-pill" title={`Facility Profile - ${centerName}`}>
                            {profilePhoto && !imgError ? (
                                <img
                                    src={getMediaUrl(profilePhoto)}
                                    alt={centerName}
                                    className="refurb-shop-img"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="refurb-avatar">
                                    {userInitial}
                                </div>
                            )}
                            <span className="refurb-pill-name">{centerName}</span>
                        </Link>
                    </div>
                </div>

                {/* KPI Summary Cards Grid */}
                <div className="refurb-kpi-grid">
                    <div className="refurb-kpi-card">
                        <div className="refurb-kpi-icon all"><FiBox /></div>
                        <div className="refurb-kpi-info">
                            <h3>{deliveries.length}</h3>
                            <p>Total Allocated Shipments</p>
                        </div>
                    </div>
                    <div className="refurb-kpi-card">
                        <div className="refurb-kpi-icon transit"><FiTruck /></div>
                        <div className="refurb-kpi-info">
                            <h3>{inTransitCount}</h3>
                            <p>In Transit to Facility</p>
                        </div>
                    </div>
                    <div className="refurb-kpi-card">
                        <div className="refurb-kpi-icon delivered"><FiCheckCircle /></div>
                        <div className="refurb-kpi-info">
                            <h3>{deliveredCount}</h3>
                            <p>Received at Facility</p>
                        </div>
                    </div>
                    <div className="refurb-kpi-card">
                        <div className="refurb-kpi-icon weight"><FiCpu /></div>
                        <div className="refurb-kpi-info">
                            <h3>{totalWeight.toFixed(1)} kg</h3>
                            <p>Total Refurbishment Weight</p>
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
                        <div className="refurb-delivery-search">
                            <FiSearch className="refurb-search-icon" />
                            <input
                                type="text"
                                placeholder="Search device, agent, ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="refurb-search-clear"
                                    onClick={() => setSearchQuery("")}
                                    title="Clear search"
                                >
                                    <FiX />
                                </button>
                            )}
                        </div>

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
                        <p>Loading refurbishment center shipments...</p>
                    </div>
                ) : filteredDeliveries.length === 0 ? (
                    <div className="empty-repaired-state">
                        <div className="empty-icon-wrap">
                            <FiCheckSquare />
                        </div>
                        <h4 className="empty-title">No Deliveries Found</h4>
                        <p className="empty-desc">
                            {searchQuery
                                ? `No shipments matching "${searchQuery}". Try a different keyword.`
                                : `No active shipments found matching "${activeTab}".`}
                        </p>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="refurb-cards-grid">
                        {filteredDeliveries.map((item, index) => {
                            const trackingId = `TRK-REF-${item.collectionAssignmentId || item.deviceId || item.refurbishmentRequestId}`;
                            return (
                                <div className="refurb-delivery-card" key={item.collectionAssignmentId || item.deviceId || index}>
                                    <div>
                                        <div className="refurb-card-top-row">
                                            <div className="refurb-cat-icon-box">
                                                {getCategoryIcon(item.categoryName)}
                                            </div>
                                            <div>{getStatusBadge(item)}</div>
                                        </div>

                                        <h4 className="refurb-card-brand-name">{item.brand} {item.model}</h4>
                                        <p className="refurb-card-cat-sub">
                                            {trackingId} &bull; {item.categoryName || "Electronics"} ({item.quantity || 1} units)
                                        </p>

                                        {/* Agent Chip */}
                                        <div className="refurb-agent-chip-box">
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                                <div className="refurb-agent-avatar">
                                                    {item.collectionAgentPhoto ? (
                                                        <img src={getAgentPhoto(item.collectionAgentPhoto)} alt="Agent" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                                                    ) : (
                                                        (item.collectionAgentName || "A").charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="refurb-agent-name">{item.collectionAgentName || "Assigned Agent"}</span>
                                                    <span className="refurb-agent-sub">{item.collectionAgentPhone || "Ph: N/A"}</span>
                                                </div>
                                            </div>
                                            {item.collectionAgentPhone && (
                                                <a href={`tel:${item.collectionAgentPhone}`} className="btn-refurb-call" title="Call Agent">
                                                    <FiPhone />
                                                </a>
                                            )}
                                        </div>

                                        {/* Origin & Destination Details */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
                                            <div className="refurb-detail-row">
                                                <FiUser className="detail-icon" style={{ color: "#3b82f6" }} />
                                                <div>
                                                    <div className="detail-label">Origin (Technician Hub)</div>
                                                    <div className="detail-val">{item.technicianName || item.inspectionCenterName || "Technician Hub"}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.technicianAddress}</div>
                                                </div>
                                            </div>

                                            <div className="refurb-detail-row">
                                                <FiMapPin className="detail-icon" style={{ color: "#7c3aed" }} />
                                                <div>
                                                    <div className="detail-label">Destination (Refurbishment Facility)</div>
                                                    <div className="detail-val">{item.refurbishmentCenterName || centerName}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.refurbishmentCenterAddress}</div>
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
                                                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                                                color: "#ffffff",
                                                border: "none",
                                                borderRadius: "10px",
                                                fontSize: "0.875rem",
                                                fontWeight: 700,
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "0.55rem",
                                                boxShadow: "0 4px 14px rgba(124, 58, 237, 0.28)",
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
                                    const trackingId = `TRK-REF-${item.collectionAssignmentId || item.deviceId || item.refurbishmentRequestId}`;
                                    return (
                                        <tr key={item.collectionAssignmentId || item.deviceId || index} className="table-row-hover">
                                            <td style={{ fontWeight: 700, color: "#64748b" }}>{index + 1}</td>
                                            <td>
                                                <span style={{ background: "#f5f3ff", color: "#6d28d9", border: "1px solid #ddd6fe", padding: "0.2rem 0.5rem", borderRadius: "6px", fontSize: "0.725rem", fontWeight: 700, fontFamily: "monospace", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                                    <FiNavigation style={{ color: "#7c3aed" }} />
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
                                                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.refurbishmentCenterName || centerName}</div>
                                                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.refurbishmentCenterAddress}</div>
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
            </main>

            {/* Live Delivery Tracking Stepper Modal */}
            {selectedDelivery && (
                <div className="refurb-modal-overlay" onClick={() => setSelectedDelivery(null)}>
                    <div className="refurb-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px", borderRadius: "20px", overflow: "hidden", padding: 0 }}>
                        {/* Modal Header */}
                        <div style={{
                            background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
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
                                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Refurbishment Center Live Tracking</h3>
                                    <span style={{ fontSize: "0.775rem", opacity: 0.95, fontFamily: "monospace" }}>
                                        TRK-REF-{selectedDelivery.collectionAssignmentId || selectedDelivery.deviceId} &bull; {selectedDelivery.brand} {selectedDelivery.model}
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
                                        <FiNavigation style={{ color: "#7c3aed" }} />
                                        TRK-REF-{selectedDelivery.collectionAssignmentId || selectedDelivery.deviceId}
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
                                background: "#f5f3ff",
                                border: "1px solid #ddd6fe",
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
                                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#7c3aed", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.15rem" }}>
                                            {(selectedDelivery.collectionAgentName || "A").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontSize: "0.725rem", color: "#6d28d9", fontWeight: 700, textTransform: "uppercase" }}>Collection Transfer Agent</div>
                                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#4c1d95" }}>
                                            {selectedDelivery.collectionAgentName || "Assigned Agent"}
                                        </div>
                                        {selectedDelivery.vehicleNumber && (
                                            <div style={{ fontSize: "0.775rem", color: "#6d28d9", fontWeight: 600, marginTop: "0.1rem" }}>
                                                Vehicle: {selectedDelivery.vehicleNumber}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedDelivery.collectionAgentPhone && (
                                    <a 
                                        href={`tel:${selectedDelivery.collectionAgentPhone}`}
                                        style={{
                                            background: "#7c3aed",
                                            color: "#ffffff",
                                            padding: "0.5rem 1rem",
                                            borderRadius: "10px",
                                            textDecoration: "none",
                                            fontSize: "0.825rem",
                                            fontWeight: 700,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.4rem",
                                            boxShadow: "0 2px 5px rgba(124,58,237,0.3)"
                                        }}
                                    >
                                        <FiPhone /> Call Agent
                                    </a>
                                )}
                            </div>

                            {/* Stepper Timeline */}
                            <div style={{ marginBottom: "1rem" }}>
                                <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.875rem", fontWeight: 700, color: "#1e293b" }}>
                                    Refurbishment Center Transfer Progress Timeline
                                </h4>
                                <div className="refurb-timeline">
                                    {getTimelineSteps(selectedDelivery).map((step, sIdx) => (
                                        <div key={sIdx} className={`refurb-timeline-step ${step.completed ? "completed" : ""} ${step.current ? "current" : ""}`}>
                                            <div className="refurb-timeline-dot">
                                                {step.completed ? <FiCheckCircle /> : step.current ? <FiClock /> : (sIdx + 1)}
                                            </div>
                                            <div className="refurb-timeline-content">
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
                                    background: "#7c3aed",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "10px",
                                    padding: "0.55rem 1.4rem",
                                    fontSize: "0.875rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    boxShadow: "0 2px 6px rgba(124,58,237,0.25)",
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

export default RefurbishmentDelivery;
