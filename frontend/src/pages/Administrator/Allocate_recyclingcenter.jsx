import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import {
    FiRefreshCw,
    FiSearch,
    FiCpu,
    FiTrash2,
    FiClock,
    FiCheckCircle,
    FiAlertTriangle,
    FiBox,
    FiX,
    FiMapPin,
    FiGrid,
    FiList,
    FiEye,
    FiCalendar,
    FiPackage,
    FiTruck,
    FiRotateCcw,
    FiDollarSign
} from "react-icons/fi";
import "./Manage_recyclingallocation.css";

function AllocateRecyclingCenter() {
    const [devices, setDevices] = useState([]);
    const [activeCenters, setActiveCenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All"); // 'All' | 'waiting' | 'assigned' | 'accepted'
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'
    const [allocatingId, setAllocatingId] = useState(null);
    const [selectedDevice, setSelectedDevice] = useState(null);

    // Manual Allocation Modal State
    const [allocatingDevice, setAllocatingDevice] = useState(null);
    const [selectedCenterId, setSelectedCenterId] = useState("");
    const [centerSearchQuery, setCenterSearchQuery] = useState("");
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState("");

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            let cleanStr = typeof dateString === "string" ? dateString.split("T")[0] : dateString;
            const date = new Date(cleanStr);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric"
            });
        } catch {
            return dateString;
        }
    };

    const getLifecycleInfo = (device) => {
        if (!device) return { label: "Pending", isAllocated: false, icon: <FiClock />, className: "status-btn--pending" };

        const rawStatus = device.lifecycleStatus || device.LifecycleStatus || "Pending";
        const status = rawStatus.trim();
        const lower = status.toLowerCase();
        const mainStatus = (device.status || device.Status || "").toLowerCase();

        switch (lower) {
            case "pending":
                if (mainStatus === "pending") {
                    return {
                        statusKey: "ApprovalPending",
                        label: "Approval Pending",
                        isAllocated: false,
                        icon: <FiClock />,
                        className: "status-btn--pending"
                    };
                }
                return {
                    statusKey: "AllocationPending",
                    label: "Allocation Pending",
                    isAllocated: false,
                    icon: <FiClock />,
                    className: "status-btn--pending"
                };
            case "inspectionpending":
                return {
                    statusKey: "InspectionPending",
                    label: "Inspection Pending",
                    isAllocated: false,
                    icon: <FiClock />,
                    className: "status-btn--pending"
                };
            case "collectionpending":
            case "waiting":
                return {
                    statusKey: "CollectionPending",
                    label: "Collection Pending",
                    isAllocated: false,
                    icon: <FiClock />,
                    className: "status-btn--pending"
                };
            case "inspectionpenalized":
            case "penalized":
                return {
                    statusKey: "InspectionPenalized",
                    label: "Fine Imposed — Inspection Penalized",
                    isAllocated: false,
                    icon: <FiAlertTriangle />,
                    className: "status-btn--cancelled"
                };
            case "pickupexpired":
            case "inspectionexpired":
            case "duedatepassed":
            case "expired":
                return {
                    statusKey: "Expired",
                    label: "Expired",
                    isAllocated: false,
                    icon: <FiClock />,
                    className: "status-btn--cancelled"
                };
            case "pickupcancelled":
            case "cancelled":
                return {
                    statusKey: "PickupCancelled",
                    label: "Pickup Cancelled",
                    isAllocated: false,
                    icon: <FiClock />,
                    className: "status-btn--cancelled"
                };
            case "collectionassigned":
                return {
                    statusKey: "CollectionAssigned",
                    label: "Collection Assigned",
                    isAllocated: true,
                    icon: <FiCpu />,
                    className: "status-btn--scheduled"
                };
            case "collectionaccepted":
                return {
                    statusKey: "CollectionAccepted",
                    label: "Collection Accepted",
                    isAllocated: true,
                    icon: <FiCheckCircle />,
                    className: "status-btn--scheduled"
                };
            case "pickupscheduled":
                return {
                    statusKey: "PickupScheduled",
                    label: "Pickup Scheduled",
                    isAllocated: true,
                    icon: <FiCalendar />,
                    className: "status-btn--scheduled"
                };
            case "pickupstarted":
            case "pickedup":
                return {
                    statusKey: "PickedUp",
                    label: "Picked Up",
                    isAllocated: true,
                    icon: <FiPackage />,
                    className: "status-btn--pickedup"
                };
            case "intransit":
                return {
                    statusKey: "InTransit",
                    label: "In Transit",
                    isAllocated: true,
                    icon: <FiTruck />,
                    className: "status-btn--in-progress"
                };
            case "delivered":
            case "infacility":
            case "atinspectioncenter":
                return {
                    statusKey: "AtInspectionCenter",
                    label: "At Inspection Center",
                    isAllocated: true,
                    icon: <FiMapPin />,
                    className: "status-btn--atcenter"
                };
            case "inspectionassigned":
                return {
                    statusKey: "InspectionAssigned",
                    label: "Inspection Assigned",
                    isAllocated: true,
                    icon: <FiCpu />,
                    className: "status-btn--scheduled"
                };
            case "inspectionaccepted":
                return {
                    statusKey: "InspectionAccepted",
                    label: "Inspection Accepted",
                    isAllocated: true,
                    icon: <FiCheckCircle />,
                    className: "status-btn--scheduled"
                };
            case "inspectioninprogress":
                return {
                    statusKey: "InspectionInProgress",
                    label: "Inspection In Progress",
                    isAllocated: true,
                    icon: <FiRefreshCw className="spin-icon" />,
                    className: "status-btn--in-progress"
                };
            case "inspectioncompleted":
                return {
                    statusKey: "InspectionCompleted",
                    label: "Inspection Completed",
                    isAllocated: true,
                    icon: <FiCheckCircle />,
                    className: "status-btn--completed"
                };
            case "offerpending":
                return {
                    statusKey: "OfferPending",
                    label: "Offer Pending",
                    isAllocated: true,
                    icon: <FiClock />,
                    className: "status-btn--offer-pending"
                };
            case "offeraccepted":
                return {
                    statusKey: "OfferAccepted",
                    label: "Offer Accepted",
                    isAllocated: true,
                    icon: <FiCheckCircle />,
                    className: "status-btn--offer-accepted"
                };
            case "paymentpending":
                return {
                    statusKey: "PaymentPending",
                    label: "Payment Pending",
                    isAllocated: true,
                    icon: <FiDollarSign />,
                    className: "status-btn--payment-pending"
                };
            case "paymentcompleted":
                return {
                    statusKey: "PaymentCompleted",
                    label: "Payment Completed",
                    isAllocated: true,
                    icon: <FiCheckCircle />,
                    className: "status-btn--payment-completed"
                };
            case "processing":
                return {
                    statusKey: "Processing",
                    label: "Processing",
                    isAllocated: true,
                    icon: <FiCpu />,
                    className: "status-btn--processing"
                };
            case "refurbishment":
                return {
                    statusKey: "Refurbishment",
                    label: "Refurbishment",
                    isAllocated: true,
                    icon: <FiRotateCcw />,
                    className: "status-btn--refurbishment"
                };
            case "recycling":
                return {
                    statusKey: "Recycling",
                    label: "Recycling",
                    isAllocated: true,
                    icon: <FiTrash2 />,
                    className: "status-btn--recycling"
                };
            case "completed":
                return {
                    statusKey: "Completed",
                    label: "Completed",
                    isAllocated: true,
                    icon: <FiCheckCircle />,
                    className: "status-btn--completed"
                };
            default:
                const unallocatedList = ["pending", "inspectionpending", "collectionpending", "waiting", "none", "", "pickupcancelled", "cancelled"];
                const isAllocated = !unallocatedList.includes(lower);
                const formattedLabel = status.replace(/([A-Z])/g, ' $1').trim();
                return {
                    statusKey: status,
                    label: formattedLabel,
                    isAllocated: isAllocated,
                    icon: isAllocated ? <FiCheckCircle /> : <FiClock />,
                    className: isAllocated ? "status-btn--default" : "status-btn--pending"
                };
        }
    };

    const filteredCentersForModal = activeCenters.filter(center => {
        if (!centerSearchQuery.trim()) return true;
        const q = centerSearchQuery.toLowerCase();
        const name = (center.centerName || center.name || "").toLowerCase();
        const city = (center.city || center.City || "").toLowerCase();
        const district = (center.district || center.District || "").toLowerCase();
        const state = (center.state || center.State || "").toLowerCase();
        const owner = (center.ownerName || center.OwnerName || center.email || "").toLowerCase();
        return name.includes(q) || city.includes(q) || district.includes(q) || state.includes(q) || owner.includes(q);
    });

    useEffect(() => {
        fetchRecyclingDevices();
    }, []);

    const fetchRecyclingDevices = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            const [devRes, centerRes, allocRes] = await Promise.all([
                axios.get("https://ecocycle.runasp.net/api/Device/All", { headers }).catch(() => ({ data: [] })),
                axios.get("https://ecocycle.runasp.net/api/RecyclingCenter/alluser", { headers }).catch(() => ({ data: [] })),
                axios.get("https://ecocycle.runasp.net/api/AllocateRecyclingCenter/admin/requests", { headers }).catch(() => ({ data: [] }))
            ]);

            // Filter ONLY devices where inspection was completed by technician AND decision is Recycling
            const preInspectionStatuses = [
                "pending",
                "approvalpending",
                "allocationpending",
                "inspectionpending",
                "collectionpending",
                "collectionassigned",
                "collectionaccepted",
                "pickupscheduled",
                "pickupstarted",
                "pickedup",
                "intransit",
                "delivered",
                "infacility",
                "atinspectioncenter",
                "inspectionassigned",
                "inspectionaccepted",
                "inspectioninprogress",
                "penalized",
                "inspectionpenalized",
                "expired",
                "pickupexpired",
                "inspectionexpired",
                "pickupcancelled",
                "cancelled"
            ];

            const allDevs = devRes.data || [];
            const recyclingDevs = allDevs.filter(d => {
                const lcs = String(d.lifecycleStatus || d.LifecycleStatus || "").trim().toLowerCase();
                const techDecision = String(d.processingDecision || d.ProcessingDecision || "").trim().toLowerCase();

                // Exclude devices that have not completed technician inspection
                if (preInspectionStatuses.includes(lcs)) {
                    return false;
                }

                // If technician decision exists, it must be Recycling
                if (techDecision) {
                    return techDecision.includes("recycl");
                }

                // Fallback check for post-inspection recycling lifecycle statuses
                const postInspectionRecyclingStatuses = [
                    "inspected",
                    "pendingcenterallocation",
                    "recyclingcenterpending",
                    "recyclingcenterassigned",
                    "recyclingcenteraccepted",
                    "in recycling",
                    "recycled"
                ];

                return postInspectionRecyclingStatuses.includes(lcs);
            });

            // Build a set of deviceIds that already have an active allocation request
            // (Assigned or Accepted means center is already allocated — no button needed)
            const allocRequests = allocRes.data || [];
            const allocatedDeviceIds = new Set(
                allocRequests
                    .filter(r => {
                        const s = (r.status || "").toLowerCase();
                        return s === "assigned" || s === "accepted";
                    })
                    .map(r => r.deviceId)
            );

            // Mark each device with a synthesized _isAllocated flag
            setDevices(recyclingDevs.map(d => ({ ...d, _isAllocated: allocatedDeviceIds.has(d.deviceId) })));
            setActiveCenters(centerRes.data || []);
        } catch (err) {
            console.error("Error fetching recycling devices:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoAllocate = async (deviceId) => {
        try {
            setAllocatingId(deviceId);
            const token = localStorage.getItem("token");
            await axios.post(
                `https://ecocycle.runasp.net/api/AllocateRecyclingCenter/allocate/${deviceId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchRecyclingDevices();
        } catch (err) {
            console.error("Error auto-allocating recycling center:", err);
        } finally {
            setAllocatingId(null);
        }
    };

    const handleManualAllocate = async () => {
        if (!allocatingDevice) return;
        setModalLoading(true);
        setModalError("");
        try {
            const token = localStorage.getItem("token");
            const endpoint = selectedCenterId === "auto"
                ? `https://ecocycle.runasp.net/api/AllocateRecyclingCenter/allocate/${allocatingDevice.deviceId}`
                : `https://ecocycle.runasp.net/api/AllocateRecyclingCenter/manual-allocate/${allocatingDevice.deviceId}/${selectedCenterId}`;

            await axios.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
            setAllocatingDevice(null);
            await fetchRecyclingDevices();
        } catch (err) {
            console.error("Error manually assigning recycling center:", err);
            setModalError(err.response?.data?.message || "Failed to assign recycling center.");
        } finally {
            setModalLoading(false);
        }
    };

    // Metrics for recycling devices
    const totalRecyclingDevs = devices.length;
    const waitingDevs = devices.filter(d => {
        const rcrs = (d.recyclingCenterRequestStatus || "").toLowerCase();
        const lcs = (d.lifecycleStatus || "").toLowerCase();
        return rcrs === "waiting" || lcs === "recyclingcenterpending" || rcrs === "expired" || lcs === "recyclingcenterexpired";
    }).length;
    const assignedDevs = devices.filter(d => {
        const lcs = (d.lifecycleStatus || "").toLowerCase();
        return lcs === "recyclingcenterassigned";
    }).length;
    const acceptedDevs = devices.filter(d => {
        const lcs = (d.lifecycleStatus || "").toLowerCase();
        return lcs === "recyclingcenteraccepted";
    }).length;

    // Filtered devices list
    const filteredDevices = devices.filter(item => {
        const rcrs = (item.recyclingCenterRequestStatus || "").toLowerCase();
        const lcs = (item.lifecycleStatus || "").toLowerCase();
        const isWaiting = rcrs === "waiting" || lcs === "recyclingcenterpending" || rcrs === "expired" || lcs === "recyclingcenterexpired";
        const isAssigned = lcs === "recyclingcenterassigned";
        const isAccepted = lcs === "recyclingcenteraccepted";

        if (activeTab === "waiting" && !isWaiting) return false;
        if (activeTab === "assigned" && !isAssigned) return false;
        if (activeTab === "accepted" && !isAccepted) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const devName = `${item.brand || ""} ${item.model || ""}`.toLowerCase();
        const catName = String(item.categoryName || "").toLowerCase();
        const userLoc = String(item.userLocation || item.userCity || "").toLowerCase();

        return devName.includes(q) || catName.includes(q) || userLoc.includes(q);
    });

    return (
        <div className="admin-alloc-page">
            <Navbar />

            <div className="admin-alloc-main">
                {/* Header */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <div className="command-brand">
                            <h1>Recycling Center Allocation</h1>
                        </div>
                        <p className="command-subtitle">
                            Allocate e-waste devices directed for Recycling &amp; Material Recovery Facilities
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search recycling device, brand, location..."
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

                {/* Metric Summary Cards */}
                <div className="metrics-grid-v2">
                    <div className="metric-card-v2">
                        <div className="metric-icon-box blue">
                            <FiRefreshCw />
                        </div>
                        <div>
                            <div className="metric-val">{totalRecyclingDevs}</div>
                            <div className="metric-lbl">Recycling Devices</div>
                        </div>
                    </div>

                    <div className="metric-card-v2">
                        <div className="metric-icon-box amber">
                            <FiAlertTriangle />
                        </div>
                        <div>
                            <div className="metric-val">{waitingDevs}</div>
                            <div className="metric-lbl">Waiting (Manual Fallback)</div>
                        </div>
                    </div>

                    <div className="metric-card-v2">
                        <div className="metric-icon-box blue">
                            <FiClock />
                        </div>
                        <div>
                            <div className="metric-val">{assignedDevs}</div>
                            <div className="metric-lbl">Center Assigned</div>
                        </div>
                    </div>

                    <div className="metric-card-v2">
                        <div className="metric-icon-box emerald">
                            <FiCheckCircle />
                        </div>
                        <div>
                            <div className="metric-val">{acceptedDevs}</div>
                            <div className="metric-lbl">Center Accepted</div>
                        </div>
                    </div>
                </div>

                {/* Recycling Facility Allocation Queue */}
                <section className="content-section">
                    <div className="panel-card table-panel">
                        <div className="panel-header">
                            <div>
                                <h3 className="panel-title">Recycling Allocation Queue</h3>
                                <p className="panel-subtitle">
                                    Devices directed for recycling ready for automated or manual center assignment
                                </p>
                            </div>

                            <div className="panel-actions">
                                <div className="filter-pill-group">
                                    {[
                                        { id: "All", label: `All (${totalRecyclingDevs})` },
                                        { id: "waiting", label: `Waiting Manual (${waitingDevs})` },
                                        { id: "assigned", label: `Assigned (${assignedDevs})` },
                                        { id: "accepted", label: `Accepted (${acceptedDevs})` }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            className={`pill-btn ${activeTab === tab.id ? "pill-btn--active" : ""}`}
                                            onClick={() => setActiveTab(tab.id)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="admin-view-toggle">
                                    <button
                                        className={`admin-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                                        onClick={() => setViewMode("grid")}
                                        title="Grid View"
                                    >
                                        <FiGrid />
                                    </button>
                                    <button
                                        className={`admin-toggle-btn ${viewMode === "table" ? "active" : ""}`}
                                        onClick={() => setViewMode("table")}
                                        title="Table View"
                                    >
                                        <FiList />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="loading-state">
                                <div className="loading-spinner"></div>
                                <p>Loading recycling devices queue...</p>
                            </div>
                        ) : filteredDevices.length === 0 ? (
                            <div className="no-data-state">
                                <FiBox className="no-data-icon" />
                                <p>No recycling devices found under "{activeTab}".</p>
                            </div>
                        ) : viewMode === "grid" ? (
                            <div className="admin-cards-grid">
                                {filteredDevices.map((d, idx) => {
                                    const rcrs = (d.recyclingCenterRequestStatus || "").toLowerCase();
                                    const lcs = (d.lifecycleStatus || "").toLowerCase();
                                    const isWaiting = rcrs === "waiting" || lcs === "recyclingcenterpending" || rcrs === "expired" || lcs === "recyclingcenterexpired";
                                    const isAllocated = d._isAllocated || lcs === "recyclingcenterassigned" || lcs === "recyclingcenteraccepted";

                                    return (
                                        <div className="admin-pickup-card" key={d.deviceId || idx}>
                                            <div>
                                                <div className="admin-card-header">
                                                    <div className="admin-card-top-row">
                                                        <div className="admin-cat-icon-box" style={{ background: "#ecfdf5", color: "#059669" }}>
                                                            <FiRefreshCw />
                                                        </div>
                                                        <div>
                                                            {isWaiting ? (
                                                                <span style={{ padding: "0.22rem 0.6rem", borderRadius: "9999px", background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", fontSize: "0.725rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                                                    <FiClock /> Waiting Manual
                                                                </span>
                                                            ) : isAllocated ? (
                                                                <span style={{ padding: "0.22rem 0.6rem", borderRadius: "9999px", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", fontSize: "0.725rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                                                    <FiCheckCircle /> Center Assigned
                                                                </span>
                                                            ) : (
                                                                <span style={{ padding: "0.22rem 0.6rem", borderRadius: "9999px", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", fontSize: "0.725rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                                                    <FiClock /> Pending Allocation
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="admin-card-title-group">
                                                        <h4 className="admin-card-brand-name">{d.brand} {d.model}</h4>
                                                        <p className="admin-card-cat-sub">
                                                            #DEV-{String(d.deviceId).padStart(3, "0")} &bull; {d.categoryName || "E-Waste"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="admin-card-body">
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.2rem" }}>
                                                        <div className="admin-detail-row">
                                                            <FiRefreshCw className="detail-icon" style={{ color: "#2563eb" }} />
                                                            <div>
                                                                <div className="detail-label">Inspection Decision</div>
                                                                <div className="detail-val" style={{ color: "#1d4ed8", textTransform: "capitalize" }}>
                                                                    {d.processingDecision || d.processingPreference || "Recycling Facility"}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="admin-detail-row">
                                                            <FiBox className="detail-icon" style={{ color: "#8b5cf6" }} />
                                                            <div>
                                                                <div className="detail-label">Condition & Grade</div>
                                                                <div className="detail-val">{d.condition || "Inspected"}</div>
                                                            </div>
                                                        </div>

                                                        <div className="admin-detail-row">
                                                            <FiMapPin className="detail-icon" style={{ color: "#059669" }} />
                                                            <div>
                                                                <div className="detail-label">Target Center</div>
                                                                <div className="detail-val">
                                                                    {d.recyclingCenterName || (isAllocated ? "Recycling Facility" : "Unassigned Center")}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px dashed #e2e8f0", display: "flex", gap: "0.5rem" }}>
                                                <button
                                                    className="action-btn action-btn--view"
                                                    onClick={() => setSelectedDevice(d)}
                                                    title="View Details"
                                                    style={{
                                                        width: "42px",
                                                        height: "42px",
                                                        minWidth: "42px",
                                                        borderRadius: "10px",
                                                        background: "#ffffff",
                                                        border: "1px solid #cbd5e1",
                                                        color: "#0284c7",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        cursor: "pointer",
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <FiEye style={{ fontSize: "1.1rem" }} />
                                                </button>

                                                {isWaiting || !isAllocated ? (
                                                    <button
                                                        onClick={() => {
                                                            setAllocatingDevice(d);
                                                            setSelectedCenterId(activeCenters.length > 0 ? String(activeCenters[0].recyclingCenterId || activeCenters[0].id || "") : "");
                                                        }}
                                                        title="Allocate Recycling Center"
                                                        style={{
                                                            flex: 1,
                                                            height: "42px",
                                                            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                                                            color: "#ffffff",
                                                            border: "none",
                                                            borderRadius: "10px",
                                                            fontSize: "0.85rem",
                                                            fontWeight: 700,
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            gap: "0.5rem",
                                                            boxShadow: "0 4px 14px rgba(5, 150, 105, 0.28)",
                                                            cursor: "pointer",
                                                            transition: "all 0.2s ease"
                                                        }}
                                                    >
                                                        <FiCpu style={{ fontSize: "1rem" }} />
                                                        <span>Allocate Recycling Center</span>
                                                    </button>
                                                ) : (
                                                    <div style={{
                                                        flex: 1,
                                                        textAlign: "center",
                                                        padding: "0.55rem",
                                                        borderRadius: "10px",
                                                        background: "#ecfdf5",
                                                        color: "#047857",
                                                        fontWeight: 700,
                                                        fontSize: "0.825rem",
                                                        border: "1px solid #a7f3d0",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "0.4rem"
                                                    }}>
                                                        <FiCheckCircle /> Assigned to Center
                                                    </div>
                                                )}
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
                                            <th>Device Details</th>
                                            <th>Inspection Decision</th>
                                            <th>Target Center</th>
                                            <th>Allocation Status</th>
                                            <th style={{ textAlign: "center" }}>Details</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDevices.map((d, idx) => {
                                            const rcrs = (d.recyclingCenterRequestStatus || "").toLowerCase();
                                            const lcs = (d.lifecycleStatus || "").toLowerCase();
                                            const isWaiting = rcrs === "waiting" || lcs === "recyclingcenterpending" || rcrs === "expired" || lcs === "recyclingcenterexpired";
                                            // Use _isAllocated from actual allocation request data (more reliable than lifecycleStatus)
                                            const isAllocated = d._isAllocated || lcs === "recyclingcenterassigned" || lcs === "recyclingcenteraccepted";

                                            return (
                                                <tr key={d.deviceId || idx} className="table-row-hover">
                                                    <td style={{ fontWeight: "700", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                                                        {idx + 1}
                                                    </td>
                                                    <td>
                                                        <div className="user-info">
                                                            <span className="user-name">{d.brand} {d.model}</span>
                                                            <span className="user-email">#{d.deviceId} &bull; {d.categoryName || "E-Waste"}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="user-info">
                                                            <span className="user-name" style={{ color: "#1d4ed8" }}>
                                                                {d.processingDecision || d.processingPreference || "Recycling"}
                                                            </span>
                                                            <span className="user-email">Condition: {d.condition || "Inspected"}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ padding: "0.3rem 0.65rem", borderRadius: "9999px", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontSize: "0.775rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                            <FiRefreshCw /> Recycling Facility
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {isWaiting ? (
                                                            <span style={{ padding: "0.3rem 0.65rem", borderRadius: "9999px", background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", fontSize: "0.775rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                                <FiClock /> Waiting Manual
                                                            </span>
                                                        ) : isAllocated ? (
                                                            <span style={{ padding: "0.3rem 0.65rem", borderRadius: "9999px", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", fontSize: "0.775rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                                <FiCheckCircle /> Assigned
                                                            </span>
                                                        ) : (
                                                            <span style={{ padding: "0.3rem 0.65rem", borderRadius: "9999px", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", fontSize: "0.775rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                                <FiClock /> Pending Allocation
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        <button
                                                            className="action-btn action-btn--view"
                                                            onClick={() => setSelectedDevice(d)}
                                                            title="View Details"
                                                            style={{
                                                                background: "#ffffff",
                                                                border: "1px solid #cbd5e1",
                                                                borderRadius: "8px",
                                                                padding: "0.45rem 0.65rem",
                                                                cursor: "pointer",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                color: "#0284c7",
                                                                boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
                                                            }}
                                                        >
                                                            <FiEye style={{ fontSize: "1rem" }} />
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            {isAllocated ? (
                                                                <span style={{ padding: "0.35rem 0.75rem", borderRadius: "9999px", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", fontSize: "0.775rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                                                    <FiCheckCircle /> No Action Needed
                                                                </span>
                                                            ) : isWaiting ? (
                                                                <button
                                                                    className="action-btn action-btn--allocate"
                                                                    style={{ background: "#fffbebf0", color: "#b45309", border: "1px solid #fde68a", display: "inline-flex", alignItems: "center", gap: "0.35rem", fontWeight: 700, padding: "0.45rem 0.85rem", borderRadius: "10px", cursor: "pointer" }}
                                                                    onClick={() => {
                                                                        setAllocatingDevice(d);
                                                                        setSelectedCenterId(activeCenters.length > 0 ? String(activeCenters[0].recyclingCenterId || activeCenters[0].id || "") : "");
                                                                        setCenterSearchQuery("");
                                                                        setModalError("");
                                                                    }}
                                                                    disabled={allocatingId === d.deviceId}
                                                                >
                                                                    <FiCpu />
                                                                    <span>Allocate Manually</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    className="action-btn action-btn--allocate"
                                                                    style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", display: "inline-flex", alignItems: "center", gap: "0.35rem", fontWeight: 700, padding: "0.45rem 0.85rem", borderRadius: "10px", cursor: "pointer" }}
                                                                    onClick={() => handleAutoAllocate(d.deviceId)}
                                                                    disabled={allocatingId === d.deviceId}
                                                                >
                                                                    <FiTrash2 className={allocatingId === d.deviceId ? "spin-icon" : ""} />
                                                                    <span>{allocatingId === d.deviceId ? "Allocating..." : "Allocate Recycling Center"}</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>

                {/* Device Details Modal */}
                {selectedDevice && (
                    <div className="modal-overlay" onClick={() => setSelectedDevice(null)}>
                        <div className="device-modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h2>{selectedDevice.brand} {selectedDevice.model}</h2>
                                    <p className="panel-subtitle">Device Submission ID: #{selectedDevice.deviceId}</p>
                                </div>
                                <button className="modal-close-btn" onClick={() => setSelectedDevice(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="device-details-grid">
                                <div className="detail-item">
                                    <label>Brand</label>
                                    <span>{selectedDevice.brand || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Model</label>
                                    <span>{selectedDevice.model || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Model Number</label>
                                    <span>{selectedDevice.modelNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Serial Number</label>
                                    <span>{selectedDevice.serialNumber || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Purchase Date</label>
                                    <span>{selectedDevice.purchaseDate ? formatDate(selectedDevice.purchaseDate) : "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Quantity</label>
                                    <span>{selectedDevice.quantity || 1}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Condition</label>
                                    <span>{selectedDevice.condition || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Working State</label>
                                    <span>{selectedDevice.working || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Preference</label>
                                    <span>{selectedDevice.processingPreference || selectedDevice.processingDecision || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Pickup Date</label>
                                    <span>{formatDate(selectedDevice.pickupDate)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Time Slot</label>
                                    <span>{selectedDevice.timeSlot || "N/A"}</span>
                                </div>
                                <div className="detail-item detail-item--span-2">
                                    <label>Device Location</label>
                                    <span>
                                        {selectedDevice.userLocation || 
                                         [selectedDevice.userCity, selectedDevice.userDistrict, selectedDevice.userState, selectedDevice.userPincode].filter(Boolean).join(", ") || 
                                         selectedDevice.address || 
                                         "N/A"}
                                    </span>
                                </div>
                                <div className="detail-item detail-item--span-2">
                                    <label>Landmark / Pickup Address</label>
                                    <span>{selectedDevice.address ? (selectedDevice.landmark ? `${selectedDevice.address} (Near: ${selectedDevice.landmark})` : selectedDevice.address) : "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Ownership</label>
                                    <span>{selectedDevice.ownership || "N/A"}</span>
                                </div>
                                <div className="detail-item detail-item--full">
                                    <label>Lifecycle Status</label>
                                    <span style={{ display: "flex", marginTop: "0.25rem", flexWrap: "wrap" }}>
                                        <button
                                            className={`action-btn action-btn--lifecycle ${getLifecycleInfo(selectedDevice).className}`}
                                            style={{ cursor: "default" }}
                                            disabled
                                        >
                                            {getLifecycleInfo(selectedDevice).icon}
                                            <span>{getLifecycleInfo(selectedDevice).label}</span>
                                        </button>
                                    </span>
                                </div>
                            </div>

                            {selectedDevice.physicalDamage && (
                                <div style={{ marginBottom: "1.25rem" }}>
                                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Physical Damage Notes</label>
                                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "var(--secondary)" }}>{selectedDevice.physicalDamage}</p>
                                </div>
                            )}

                            {(selectedDevice.frontPhoto || selectedDevice.backPhoto || selectedDevice.damagePhoto || selectedDevice.labelPhoto) && (
                                <div className="device-photos-section">
                                    <h4>Uploaded Photos</h4>
                                    <div className="photos-grid">
                                        {selectedDevice.frontPhoto && (
                                            <div className="photo-card">
                                                <img
                                                    src={`https://ecocycle.runasp.net/uploads/devices/FrontPhotos/${selectedDevice.frontPhoto}`}
                                                    alt="Front"
                                                />
                                                <span>Front</span>
                                            </div>
                                        )}
                                        {selectedDevice.backPhoto && (
                                            <div className="photo-card">
                                                <img
                                                    src={`https://ecocycle.runasp.net/uploads/devices/BackPhotos/${selectedDevice.backPhoto}`}
                                                    alt="Back"
                                                />
                                                <span>Back</span>
                                            </div>
                                        )}

                                        {selectedDevice.damagePhoto && (
                                            <div className="photo-card">
                                                <img
                                                    src={`https://ecocycle.runasp.net/uploads/devices/DamagePhotos/${selectedDevice.damagePhoto}`}
                                                    alt="Damage"
                                                />
                                                <span>Damage</span>
                                            </div>
                                        )}

                                        {selectedDevice.labelPhoto && (
                                            <div className="photo-card">
                                                <img
                                                    src={`https://ecocycle.runasp.net/uploads/devices/LabelPhotos/${selectedDevice.labelPhoto}`}
                                                    alt="Label"
                                                />
                                                <span>Label</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Manual Allocation Modal */}
                {allocatingDevice && (
                    <div className="modal-overlay" onClick={() => setAllocatingDevice(null)}>
                        <div className="device-modal-card" style={{ maxWidth: "650px", width: "92%" }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header" style={{ background: "#ffffff", padding: "0 0 1rem 0", borderBottom: "1px solid #f1f5f9", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.3 }}>Manually Allocate Recycling Center</h2>
                                    <p className="panel-subtitle" style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                                        Device #{allocatingDevice.deviceId} • {allocatingDevice.brand} {allocatingDevice.model}
                                    </p>
                                </div>
                                <button className="modal-close-btn" onClick={() => setAllocatingDevice(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div style={{ padding: "0.5rem 0 0.5rem 0" }}>
                                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "0.85rem 1.15rem", borderRadius: "12px", marginBottom: "1.25rem", color: "#b45309", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                    <FiClock style={{ fontSize: "1.1rem", flexShrink: 0 }} />
                                    <span><strong>Allocation Request Status:</strong> Waiting for manual recycling center assignment.</span>
                                </div>

                                {modalError && (
                                    <div style={{ padding: "0.85rem 1.15rem", borderRadius: "10px", background: "#fff1f2", color: "#e11d48", fontWeight: 600, fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                                        {modalError}
                                    </div>
                                )}

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (selectedCenterId) {
                                            handleManualAllocate();
                                        }
                                    }}
                                    style={{ background: "#f8fafc", padding: "1.15rem", borderRadius: "14px", border: "1px solid #e2e8f0" }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                                        <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0284c7", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                            Select Active Recycling Center
                                        </div>
                                        <span style={{ fontSize: "0.75rem", background: "#e0f2fe", color: "#0369a1", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 700 }}>
                                            {filteredCentersForModal.length} Available
                                        </span>
                                    </div>

                                    {/* Recycling Center Search Bar */}
                                    <div style={{ position: "relative", marginBottom: "1rem", width: "100%", boxSizing: "border-box" }}>
                                        <FiSearch style={{ position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: "1rem", zIndex: 1 }} />
                                        <input
                                            type="text"
                                            placeholder="Search by center name, city, district, state..."
                                            value={centerSearchQuery}
                                            onChange={(e) => setCenterSearchQuery(e.target.value)}
                                            style={{
                                                width: "100%",
                                                boxSizing: "border-box",
                                                padding: "0.7rem 0.9rem 0.7rem 2.5rem",
                                                borderRadius: "10px",
                                                border: "1px solid #cbd5e1",
                                                fontSize: "0.875rem",
                                                outline: "none",
                                                background: "#ffffff",
                                                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
                                            }}
                                        />
                                    </div>

                                    {/* Interactive Custom Card List */}
                                    <div style={{ maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem", paddingRight: "0.3rem" }}>
                                        {filteredCentersForModal.length === 0 ? (
                                            <div style={{ textAlign: "center", padding: "2rem 1rem", background: "#ffffff", borderRadius: "10px", border: "1px dashed #cbd5e1", color: "#64748b", fontSize: "0.875rem" }}>
                                                No recycling centers match "{centerSearchQuery}".
                                            </div>
                                        ) : (
                                            filteredCentersForModal.map(center => {
                                                const id = String(center.recyclingCenterId || center.id);
                                                const name = center.centerName || center.name || "Recycling Center";
                                                const city = center.city || center.City || "";
                                                const district = center.district || center.District || "";
                                                const state = center.state || center.State || "";
                                                const pin = center.pinCode || center.PinCode || "";
                                                const locParts = [city, district, state].filter(Boolean);
                                                const locString = locParts.length > 0 ? (pin ? `${locParts.join(", ")} - ${pin}` : locParts.join(", ")) : "Location N/A";
                                                const isSelected = String(selectedCenterId) === id;

                                                return (
                                                    <div
                                                        key={id}
                                                        onClick={() => setSelectedCenterId(id)}
                                                        style={{
                                                            padding: "0.85rem 1rem",
                                                            borderRadius: "12px",
                                                            border: isSelected ? "2px solid #0284c7" : "1px solid #e2e8f0",
                                                            background: isSelected ? "#f0f9ff" : "#ffffff",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            gap: "1rem",
                                                            transition: "all 0.15s ease",
                                                            boxShadow: isSelected ? "0 4px 12px rgba(2,132,199,0.12)" : "0 1px 3px rgba(0,0,0,0.02)"
                                                        }}
                                                    >
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                                            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: isSelected ? "#0284c7" : "#e2e8f0", color: isSelected ? "#ffffff" : "#475569", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem", flexShrink: 0 }}>
                                                                {name.charAt(0).toUpperCase() || "R"}
                                                            </div>
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                                                    <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.925rem" }}>{name}</span>
                                                                </div>
                                                                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#64748b", fontSize: "0.8rem" }}>
                                                                    <FiMapPin style={{ color: "#0284c7", flexShrink: 0 }} />
                                                                    <span>{locString}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: "flex", alignItems: "center" }}>
                                                            {isSelected ? (
                                                                <FiCheckCircle style={{ color: "#0284c7", fontSize: "1.3rem" }} />
                                                            ) : (
                                                                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #cbd5e1" }}></div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={modalLoading || !selectedCenterId}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            borderRadius: "10px",
                                            background: selectedCenterId ? "#0284c7" : "#cbd5e1",
                                            color: "#ffffff",
                                            border: "none",
                                            fontWeight: 700,
                                            fontSize: "0.9rem",
                                            cursor: selectedCenterId ? "pointer" : "not-allowed",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "0.5rem",
                                            boxShadow: selectedCenterId ? "0 4px 12px rgba(2,132,199,0.2)" : "none",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        <FiCpu /> {modalLoading ? "Allocating..." : "Assign Selected Recycling Center"}
                                    </button>
                                </form>
                            </div>

                            <div className="modal-footer-actions" style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    style={{
                                        padding: "0.55rem 1.25rem",
                                        borderRadius: "10px",
                                        background: "#ffffff",
                                        border: "1px solid #cbd5e1",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.35rem",
                                        color: "#475569"
                                    }}
                                    onClick={() => setAllocatingDevice(null)}
                                >
                                    <FiX /> Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AllocateRecyclingCenter;

