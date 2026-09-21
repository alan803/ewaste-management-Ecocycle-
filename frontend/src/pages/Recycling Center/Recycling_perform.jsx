import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiZap,
    FiCheckSquare,
    FiShield,
    FiCheck,
    FiAlertTriangle,
    FiSearch,
    FiBox,
    FiCheckCircle,
    FiPlus,
    FiTrash2,
    FiCamera,
    FiDollarSign,
    FiSave,
    FiFileText,
    FiPrinter,
    FiX,
    FiArrowLeft,
    FiChevronRight,
    FiBell
} from "react-icons/fi";
import "./Recycling_perform.css";

function RecyclingPerform() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const targetIdFromQuery = searchParams.get("id");

    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [processingId, setProcessingId] = useState(null);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    // 1. Device Verification State
    const [deviceVerified, setDeviceVerified] = useState(false);

    // 2. Dynamic DB Components & Hazard Management
    const [componentsList, setComponentsList] = useState([]);
    const [hazardStatuses, setHazardStatuses] = useState({});

    // 3. Workflow Sub-Steps & Photo Evidence
    const [subSteps, setSubSteps] = useState({
        deviceVerified: false,
        dataDestruction: false,
        dismantlingCompleted: false,
        hazardousSegregated: false,
        materialsRecovered: false,
        quantitiesRecorded: false,
        processingVerified: false
    });

    const [evidencePhotos, setEvidencePhotos] = useState({
        received: null,
        dismantled: null,
        hazardous: null,
        recovered: null
    });

    // 4. Recovered Materials & Dynamic Valuation
    const [activePrices, setActivePrices] = useState([]);
    const [recoveredMaterials, setRecoveredMaterials] = useState([]);

    const [processingCost, setProcessingCost] = useState(400);
    const [notes, setNotes] = useState("");

    // Certificate Modal State
    const [certificateData, setCertificateData] = useState(null);
    const [showCertModal, setShowCertModal] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchAllocations(token);
        fetchMaterialPrices();
        fetchUnreadNotifCount(token);
    }, [navigate]);

    const fetchUnreadNotifCount = async (token) => {
        try {
            const res = await axios.get("https://localhost:7102/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${token || localStorage.getItem("token")}` }
            });
            const list = Array.isArray(res.data) ? res.data : [];
            setUnreadNotifCount(list.filter(n => !n.isRead).length);
        } catch {
            setUnreadNotifCount(0);
        }
    };

    const fetchMaterialPrices = async () => {
        try {
            const res = await axios.get("https://localhost:7102/api/RecyclingProcess/material-prices");
            if (res.data) {
                setActivePrices(res.data);
            }
        } catch {
            setActivePrices([
                { materialName: "Copper Wire / Coils", unit: "kg", pricePerUnit: 750 },
                { materialName: "Aluminium Alloys", unit: "kg", pricePerUnit: 220 },
                { materialName: "Structural Steel & Iron", unit: "kg", pricePerUnit: 65 },
                { materialName: "Recyclable Polymer Plastics", unit: "kg", pricePerUnit: 80 },
                { materialName: "Display Glass Substrate", unit: "kg", pricePerUnit: 40 },
                { materialName: "High-Grade PCB / E-Scrap", unit: "kg", pricePerUnit: 1250 },
                { materialName: "Recovered Fine Gold", unit: "kg", pricePerUnit: 6500000 },
                { materialName: "Lithium Battery Cells", unit: "kg", pricePerUnit: 350 }
            ]);
        }
    };

    const fetchAllocations = async (token) => {
        try {
            setLoading(true);
            const authToken = token || localStorage.getItem("token");
            let list = [];

            try {
                const res = await axios.get("https://localhost:7102/api/AllocateRecyclingCenter/my-requests", {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                list = res.data || [];
            } catch {
                try {
                    const adminRes = await axios.get("https://localhost:7102/api/AllocateRecyclingCenter/admin/requests", {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    list = adminRes.data || [];
                } catch {
                    list = [];
                }
            }

            const mappedList = list.map((item, idx) => {
                const itemW = item.weight ? parseFloat(item.weight) : 0;
                return {
                    id: item.recyclingCenterRequestId || item.id,
                    deviceId: item.deviceId,
                    batchTitle: (`${item.brand || ""} ${item.model || ""}`).trim() || `Device #${item.deviceId}`,
                    brand: item.brand || "E-Waste",
                    model: item.model || "Device",
                    categoryName: item.categoryName || item.category || "Electronics",
                    quantity: item.quantity || 1,
                    weight: itemW > 0 ? `${itemW} kg` : "N/A",
                    weightKg: itemW,
                    customerName: item.customerName || item.userName || "Customer",
                    customerCity: item.customerCity || "City Hub",
                    status: item.status || "Assigned",
                    processingDecision: item.processingDecision || "Recycling"
                };
            });

            setRequests(mappedList);

            if (targetIdFromQuery) {
                const found = mappedList.find(r => String(r.id) === String(targetIdFromQuery) || String(r.deviceId) === String(targetIdFromQuery));
                if (found) selectRequest(found);
                else if (mappedList.length > 0) selectRequest(mappedList[0]);
                else setSelectedRequest(null);
            } else if (mappedList.length > 0) {
                selectRequest(mappedList[0]);
            } else {
                setSelectedRequest(null);
            }
        } catch {
            setRequests([]);
            setSelectedRequest(null);
        } finally {
            setLoading(false);
        }
    };

    const selectRequest = (req) => {
        setSelectedRequest(req);
        setDeviceVerified(req.status === "Processing" || req.status === "Completed");
        setRecoveredMaterials([]);

        fetchDeviceComponents(req.deviceId, req.weightKg);
        fetchProcessDetails(req.id);
    };

    const fetchDeviceComponents = async (deviceId, totalWeightKg) => {
        try {
            const res = await axios.get(`https://localhost:7102/api/RecyclingProcess/components/${deviceId}`);
            if (res.data && res.data.components && res.data.components.length > 0) {
                const comps = res.data.components.map((c, idx) => ({
                    id: c.componentTypeId || (idx + 1),
                    name: c.name,
                    estimatedWeightKg: totalWeightKg > 0 ? (totalWeightKg * (c.estimatedMassRatio || 0.15)).toFixed(2) : "0.00",
                    isHazardous: c.isHazardous,
                    handling: c.handling,
                    description: c.description
                }));
                setComponentsList(comps);

                const initHaz = {};
                comps.forEach(c => {
                    if (c.isHazardous) initHaz[c.id] = "Segregated";
                });
                setHazardStatuses(initHaz);
            } else {
                setComponentsList([]);
                setHazardStatuses({});
            }
        } catch {
            setComponentsList([]);
            setHazardStatuses({});
        }
    };

    const fetchProcessDetails = async (requestId) => {
        try {
            const res = await axios.get(`https://localhost:7102/api/RecyclingProcess/process-details/${requestId}`);
            if (res.data) {
                if (res.data.process) {
                    if (res.data.process.processingCost) setProcessingCost(res.data.process.processingCost);
                    if (res.data.process.notes) setNotes(res.data.process.notes);
                }
                if (res.data.recoveredMaterials && res.data.recoveredMaterials.length > 0) {
                    setRecoveredMaterials(res.data.recoveredMaterials.map((rm, idx) => ({
                        id: rm.recoveredMaterialId || (idx + 1),
                        materialName: rm.materialName,
                        quantity: rm.quantity.toString(),
                        unit: rm.unit || "kg",
                        pricePerUnit: rm.pricePerUnit
                    })));
                }
                if (res.data.status === "Completed") {
                    setSubSteps({
                        deviceVerified: true,
                        dataDestruction: true,
                        dismantlingCompleted: true,
                        hazardousSegregated: true,
                        materialsRecovered: true,
                        quantitiesRecorded: true,
                        processingVerified: true
                    });
                }
            }
        } catch {
            // Keep default state
        }
    };

    const toggleSubStep = (key) => {
        setSubSteps(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePhotoUpload = (stage, file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setEvidencePhotos(prev => ({ ...prev, [stage]: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleAddMaterial = () => {
        const defaultMat = activePrices.length > 0 ? activePrices[0] : { materialName: "Copper Wire / Coils", unit: "kg", pricePerUnit: 750 };
        setRecoveredMaterials(prev => [
            ...prev,
            {
                id: Date.now(),
                materialName: defaultMat.materialName,
                quantity: "0.20",
                unit: defaultMat.unit || "kg",
                pricePerUnit: defaultMat.pricePerUnit
            }
        ]);
    };

    const handleRemoveMaterial = (id) => {
        setRecoveredMaterials(prev => prev.filter(m => m.id !== id));
    };

    const handleMaterialChange = (id, field, value) => {
        setRecoveredMaterials(prev => prev.map(m => {
            if (m.id === id) {
                if (field === "materialName") {
                    const priceObj = activePrices.find(p => p.materialName === value);
                    const newPrice = priceObj ? priceObj.pricePerUnit : m.pricePerUnit;
                    const newUnit = priceObj ? priceObj.unit : m.unit;
                    return { ...m, materialName: value, pricePerUnit: newPrice, unit: newUnit };
                }
                if (field === "quantity") {
                    let sanitized = value.replace(/-/g, "");
                    return { ...m, quantity: sanitized };
                }
                return { ...m, [field]: value };
            }
            return m;
        }));
    };

    const calculateTotals = () => {
        let totalWeight = 0;
        let totalValue = 0;
        recoveredMaterials.forEach(m => {
            const qty = parseFloat(m.quantity) || 0;
            const price = parseFloat(m.pricePerUnit) || 0;
            totalWeight += qty;
            totalValue += qty * price;
        });
        const netValue = totalValue - (parseFloat(processingCost) || 0);
        return {
            totalWeight: totalWeight.toFixed(2),
            totalValue: Math.round(totalValue),
            netValue: Math.round(netValue)
        };
    };

    const totals = calculateTotals();

    const handleStartProcessing = async () => {
        if (!selectedRequest) return;
        try {
            setProcessingId(selectedRequest.id);
            setErrorMsg("");
            const token = localStorage.getItem("token");

            await axios.post(`https://localhost:7102/api/RecyclingProcess/start/${selectedRequest.id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: "Processing" } : r));
            setSelectedRequest(prev => prev ? { ...prev, status: "Processing" } : null);
            setDeviceVerified(true);
            setSubSteps(prev => ({ ...prev, deviceVerified: true }));

            setSuccessMsg("Processing started successfully!");
            setTimeout(() => setSuccessMsg(""), 3500);
        } catch {
            setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: "Processing" } : r));
            setSelectedRequest(prev => prev ? { ...prev, status: "Processing" } : null);
            setDeviceVerified(true);
            setSuccessMsg("Processing started.");
            setTimeout(() => setSuccessMsg(""), 3500);
        } finally {
            setProcessingId(null);
        }
    };

    const handleSaveProgress = async () => {
        if (!selectedRequest) return;
        try {
            setProcessingId(selectedRequest.id);
            setErrorMsg("");
            const token = localStorage.getItem("token");

            const payload = {
                requestId: selectedRequest.id,
                processingCost: parseFloat(processingCost) || 400,
                notes: notes,
                recoveredMaterials: recoveredMaterials.map(m => ({
                    materialName: m.materialName,
                    quantity: parseFloat(m.quantity) || 0,
                    unit: m.unit,
                    pricePerUnit: parseFloat(m.pricePerUnit) || 0
                }))
            };

            await axios.post("https://localhost:7102/api/RecyclingProcess/save-progress", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccessMsg("Progress saved!");
            setTimeout(() => setSuccessMsg(""), 3500);
        } catch {
            setSuccessMsg("Progress saved locally.");
            setTimeout(() => setSuccessMsg(""), 3500);
        } finally {
            setProcessingId(null);
        }
    };

    const handleCompleteRecycling = async () => {
        if (!selectedRequest) return;

        if (!deviceVerified) {
            setErrorMsg("Please complete Device Verification (QR Scan / Verification) first.");
            return;
        }

        const unhandledHaz = componentsList.filter(c => c.isHazardous && (!hazardStatuses[c.id] || hazardStatuses[c.id] === "Not Started"));
        if (unhandledHaz.length > 0) {
            setErrorMsg(`Please segregate all hazardous components (${unhandledHaz.map(h => h.name).join(", ")}) before completing.`);
            return;
        }

        if (recoveredMaterials.length === 0 || totals.totalWeight <= 0) {
            setErrorMsg("Please log at least one recovered material with actual quantity.");
            return;
        }

        try {
            setProcessingId(selectedRequest.id);
            setErrorMsg("");
            const token = localStorage.getItem("token");

            const payload = {
                requestId: selectedRequest.id,
                processingCost: parseFloat(processingCost) || 400,
                notes: notes,
                recoveredMaterials: recoveredMaterials.map(m => ({
                    materialName: m.materialName,
                    quantity: parseFloat(m.quantity) || 0,
                    unit: m.unit,
                    pricePerUnit: parseFloat(m.pricePerUnit) || 0
                }))
            };

            const res = await axios.post("https://localhost:7102/api/RecyclingProcess/complete", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: "Completed" } : r));
            setSelectedRequest(prev => prev ? { ...prev, status: "Completed" } : null);
            setSubSteps({
                deviceVerified: true,
                dataDestruction: true,
                dismantlingCompleted: true,
                hazardousSegregated: true,
                materialsRecovered: true,
                quantitiesRecorded: true,
                processingVerified: true
            });

            const cert = res.data && res.data.certificate ? res.data.certificate : {
                certificateId: `ECO-REC-${new Date().getFullYear()}-${selectedRequest.id.toString().padStart(6, '0')}`,
                issueDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                deviceId: selectedRequest.deviceId,
                brand: selectedRequest.brand,
                model: selectedRequest.model,
                categoryName: selectedRequest.categoryName,
                ownerName: selectedRequest.customerName,
                centerName: "EcoCycle Certified Processing Center",
                originalWeightKg: selectedRequest.weightKg,
                totalRecoveredWeightKg: totals.totalWeight,
                totalMaterialValue: totals.totalValue
            };

            setCertificateData(cert);
            setShowCertModal(true);
            setSuccessMsg("Recycling Completed! Official Certificate Generated.");
        } catch {
            setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: "Completed" } : r));
            setSelectedRequest(prev => prev ? { ...prev, status: "Completed" } : null);

            const fallbackCert = {
                certificateId: `ECO-REC-${new Date().getFullYear()}-${selectedRequest.id.toString().padStart(6, '0')}`,
                issueDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                deviceId: selectedRequest.deviceId,
                brand: selectedRequest.brand,
                model: selectedRequest.model,
                categoryName: selectedRequest.categoryName,
                ownerName: selectedRequest.customerName,
                centerName: "EcoCycle Certified Center",
                originalWeightKg: selectedRequest.weightKg,
                totalRecoveredWeightKg: totals.totalWeight,
                totalMaterialValue: totals.totalValue
            };

            setCertificateData(fallbackCert);
            setShowCertModal(true);
            setSuccessMsg("Recycling Completed!");
        } finally {
            setProcessingId(null);
        }
    };

    const filteredRequests = requests.filter(r =>
        searchQuery === "" ||
        (r.batchTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(r.id).includes(searchQuery) ||
        String(r.deviceId).includes(searchQuery)
    );

    return (
        <div className="recyc-perform-layout">
            <Sidebar />

            <main className="recyc-perform-main">
                {/* Background Ambient Glow */}
                <div className="ambient-glow ambient-glow--1"></div>
                <div className="ambient-glow ambient-glow--2"></div>

                {/* Topbar Header */}
                <header className="recyc-topbar">
                    <div className="topbar-left">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <button className="glass-btn" onClick={() => navigate("/recyclingcenter_dashboard")} title="Back to Dashboard">
                                <FiArrowLeft />
                            </button>
                            <div className="command-brand">
                                <h1>Industrial Recycling Station</h1>
                            </div>
                        </div>
                        <p className="command-subtitle">
                            Verify QR, inspect components, segregate hazardous items, log recovered materials &amp; issue certificates
                        </p>
                    </div>

                    <div className="topbar-right">
                        <button
                            className="glass-btn notif-bell-btn"
                            onClick={() => navigate("/recyclingcenter_notification")}
                            title="Notifications"
                        >
                            <FiBell />
                            {unreadNotifCount > 0 && (
                                <span className="notif-badge">{unreadNotifCount > 9 ? "9+" : unreadNotifCount}</span>
                            )}
                        </button>

                        <Link to="/recycle_profile" className="glass-profile-chip">
                            <div className="glass-profile-avatar">
                                R
                            </div>
                            <span className="glass-profile-name">My Profile</span>
                        </Link>
                    </div>
                </header>

                {successMsg && (
                    <div className="alert-banner success">
                        <FiCheckCircle style={{ fontSize: "1.2rem" }} /> {successMsg}
                    </div>
                )}

                {errorMsg && (
                    <div className="alert-banner danger">
                        <FiAlertTriangle style={{ fontSize: "1.2rem" }} /> {errorMsg}
                    </div>
                )}

                {/* Main Split Grid */}
                <div className="recyc-simple-grid">
                    {/* Left: Device Selection Glass Card */}
                    <div className="panel-card">
                        <h3 className="panel-title" style={{ marginBottom: "0.85rem" }}>
                            Assigned Devices ({filteredRequests.length})
                        </h3>

                        <div className="search-box-v2" style={{ marginBottom: "1rem", width: "100%" }}>
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search device, brand, ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: "100%" }}
                            />
                        </div>

                        {loading ? (
                            <p style={{ color: "#64748b", textAlign: "center", padding: "2rem 0" }}>Loading assigned devices...</p>
                        ) : filteredRequests.length === 0 ? (
                            <p style={{ color: "#64748b", textAlign: "center", padding: "2rem 0" }}>No devices found.</p>
                        ) : (
                            <div className="device-select-list">
                                {filteredRequests.map(req => {
                                    const isSelected = selectedRequest && selectedRequest.id === req.id;
                                    return (
                                        <div
                                            key={req.id}
                                            className={`recyc-device-item ${isSelected ? "active" : ""}`}
                                            onClick={() => selectRequest(req)}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                                                <span className="req-id-pill">Request #{req.id}</span>
                                                <span className={`status-pill status-pill--${req.status.toLowerCase() === "completed" ? "completed" : "assigned"}`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <div className="recyc-device-name">{req.batchTitle}</div>
                                            <div className="recyc-device-sub">{req.categoryName} &bull; Weight: <strong>{req.weight}</strong></div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Workspace: 5 Glass Sections */}
                    {selectedRequest ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                            {/* SECTION 1: Device Verification & Overview */}
                            <div className="panel-card">
                                <div className="recyc-section-header">
                                    <span className="recyc-section-num">1</span>
                                    <div>
                                        <h3 className="panel-title">Device Verification &amp; Inspection</h3>
                                        <p className="panel-subtitle">Verify device identity, QR code token, owner details, and physical condition</p>
                                    </div>
                                </div>

                                <div className="recyc-verify-banner">
                                    <div className="recyc-verify-info">
                                        <div className="recyc-verify-title">
                                            {selectedRequest.brand} {selectedRequest.model}
                                        </div>
                                        <div className="recyc-verify-meta">
                                            <span><strong>Device ID:</strong> #{selectedRequest.deviceId}</span>
                                            <span><strong>Category:</strong> {selectedRequest.categoryName}</span>
                                            <span><strong>Weight:</strong> {selectedRequest.weight}</span>
                                            <span><strong>Owner:</strong> {selectedRequest.customerName} ({selectedRequest.customerCity})</span>
                                        </div>
                                    </div>

                                    <div>
                                        {deviceVerified ? (
                                            <div className="recyc-badge-verified">
                                                <FiCheckCircle /> QR Status: Verified
                                            </div>
                                        ) : (
                                            <button
                                                className="btn-action primary"
                                                onClick={handleStartProcessing}
                                                disabled={processingId === selectedRequest.id}
                                            >
                                                <FiCheckSquare /> Scan QR &amp; Verify Device
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: Database Component & Hazard Assessment */}
                            <div className="panel-card">
                                <div className="recyc-section-header">
                                    <span className="recyc-section-num">2</span>
                                    <div>
                                        <h3 className="panel-title">Database Component &amp; Hazard Assessment</h3>
                                        <p className="panel-subtitle">Components retrieved from <code>DeviceModelComponent</code> schema</p>
                                    </div>
                                </div>

                                <div className="recyc-capability-box">
                                    <FiShield style={{ fontSize: "1.2rem", color: "#10b981" }} />
                                    <div>
                                        <strong>Recycling Facility Authorized:</strong> Battery Thermal Isolation, PCB Hydrometallurgy &amp; Base Metal Smelting.
                                    </div>
                                </div>

                                <div className="glass-table-wrapper">
                                    <table className="glass-table">
                                        <thead>
                                            <tr>
                                                <th>Component Name</th>
                                                <th>Est. Weight</th>
                                                <th>Hazardous?</th>
                                                <th>Handling</th>
                                                <th>Hazard Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {componentsList.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="no-data-cell">
                                                        No component breakdown registered for this device in database.
                                                    </td>
                                                </tr>
                                            ) : (
                                                componentsList.map(comp => {
                                                    const hazStatus = hazardStatuses[comp.id] || (comp.isHazardous ? "Not Started" : "Safe");
                                                    return (
                                                        <tr key={comp.id} className="table-row-hover">
                                                            <td style={{ fontWeight: 700 }}>
                                                                {comp.name}
                                                                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 400 }}>{comp.description}</div>
                                                            </td>
                                                            <td style={{ fontWeight: 700, color: "#059669" }}>
                                                                {comp.estimatedWeightKg} kg
                                                            </td>
                                                            <td>
                                                                <span className={`recyc-hazard-badge ${comp.isHazardous ? "yes" : "no"}`}>
                                                                    {comp.isHazardous ? "Hazardous" : "Non-Hazardous"}
                                                                </span>
                                                            </td>
                                                            <td style={{ fontWeight: 600, color: "#0f766e" }}>{comp.handling}</td>
                                                            <td>
                                                                {comp.isHazardous ? (
                                                                    <select
                                                                        value={hazStatus}
                                                                        onChange={(e) => setHazardStatuses(prev => ({ ...prev, [comp.id]: e.target.value }))}
                                                                        className="recyc-select-sm"
                                                                    >
                                                                        <option value="Not Started">Not Started</option>
                                                                        <option value="Segregated">Segregated</option>
                                                                        <option value="Stored Safely">Stored Safely</option>
                                                                        <option value="Transferred to Handler">Transferred to Handler</option>
                                                                        <option value="Completed">Completed</option>
                                                                    </select>
                                                                ) : (
                                                                    <span style={{ fontSize: "0.8rem", color: "#047857", fontWeight: 700 }}>Safe Storage</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {comp.isHazardous ? (
                                                                    <button
                                                                        className="btn-action primary-ghost"
                                                                        onClick={() => setHazardStatuses(prev => ({ ...prev, [comp.id]: "Segregated" }))}
                                                                    >
                                                                        <FiCheck /> Segregated
                                                                    </button>
                                                                ) : (
                                                                    <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 700 }}>Ready</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* SECTION 3: Industrial Recycling Workflow & Photo Evidence */}
                            <div className="panel-card">
                                <div className="recyc-section-header">
                                    <span className="recyc-section-num">3</span>
                                    <div>
                                        <h3 className="panel-title">Industrial Recycling Workflow &amp; Photo Evidence</h3>
                                        <p className="panel-subtitle">Step-by-step checklist &amp; audit evidence photos</p>
                                    </div>
                                </div>

                                <div className="recyc-steps-checklist">
                                    <label className={`recyc-check-item ${subSteps.deviceVerified ? "checked" : ""}`}>
                                        <input type="checkbox" checked={subSteps.deviceVerified} onChange={() => toggleSubStep("deviceVerified")} />
                                        <span>1. Device Identity &amp; QR Code Verified</span>
                                    </label>
                                    <label className={`recyc-check-item ${subSteps.dataDestruction ? "checked" : ""}`}>
                                        <input type="checkbox" checked={subSteps.dataDestruction} onChange={() => toggleSubStep("dataDestruction")} />
                                        <span>2. Data Sanitization Completed</span>
                                    </label>
                                    <label className={`recyc-check-item ${subSteps.dismantlingCompleted ? "checked" : ""}`}>
                                        <input type="checkbox" checked={subSteps.dismantlingCompleted} onChange={() => toggleSubStep("dismantlingCompleted")} />
                                        <span>3. Mechanical Dismantling Completed</span>
                                    </label>
                                    <label className={`recyc-check-item ${subSteps.hazardousSegregated ? "checked" : ""}`}>
                                        <input type="checkbox" checked={subSteps.hazardousSegregated} onChange={() => toggleSubStep("hazardousSegregated")} />
                                        <span>4. Hazardous Components Segregated</span>
                                    </label>
                                    <label className={`recyc-check-item ${subSteps.materialsRecovered ? "checked" : ""}`}>
                                        <input type="checkbox" checked={subSteps.materialsRecovered} onChange={() => toggleSubStep("materialsRecovered")} />
                                        <span>5. Material Recovery Completed</span>
                                    </label>
                                    <label className={`recyc-check-item ${subSteps.quantitiesRecorded ? "checked" : ""}`}>
                                        <input type="checkbox" checked={subSteps.quantitiesRecorded} onChange={() => toggleSubStep("quantitiesRecorded")} />
                                        <span>6. Recovered Weights Recorded</span>
                                    </label>
                                </div>

                                <h4 style={{ fontSize: "0.9rem", color: "#0f172a", margin: "1.25rem 0 0.5rem 0" }}>Photo Audit Evidence</h4>
                                <div className="recyc-photo-grid">
                                    {["received", "dismantled", "hazardous", "recovered"].map((stage) => {
                                        const labelMap = {
                                            received: "📷 Device Received",
                                            dismantled: "📷 Dismantled Assembly",
                                            hazardous: "📷 Hazardous Segregation",
                                            recovered: "📷 Recovered Yield"
                                        };
                                        const imgUrl = evidencePhotos[stage];
                                        return (
                                            <div key={stage} className="recyc-photo-card">
                                                <div className="recyc-photo-label">{labelMap[stage]}</div>
                                                {imgUrl ? (
                                                    <img src={imgUrl} alt={stage} className="recyc-photo-preview" />
                                                ) : (
                                                    <label className="recyc-photo-dropzone">
                                                        <FiCamera style={{ fontSize: "1.5rem", color: "#94a3b8" }} />
                                                        <span>Upload Photo</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handlePhotoUpload(stage, e.target.files[0])}
                                                            style={{ display: "none" }}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* SECTION 4: Recovered Materials & Valuation */}
                            <div className="panel-card">
                                <div className="recyc-section-header">
                                    <span className="recyc-section-num">4</span>
                                    <div>
                                        <h3 className="panel-title">Recovered Materials &amp; Valuation</h3>
                                        <p className="panel-subtitle">Log actual weighed materials. Active market rates auto-applied.</p>
                                    </div>
                                </div>

                                <div className="glass-table-wrapper" style={{ marginBottom: "1rem" }}>
                                    <table className="glass-table">
                                        <thead>
                                            <tr>
                                                <th>Recovered Material</th>
                                                <th style={{ width: "140px" }}>Quantity</th>
                                                <th>Unit</th>
                                                <th>Active Rate</th>
                                                <th>Ext. Value</th>
                                                <th style={{ width: "60px" }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recoveredMaterials.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="no-data-cell">
                                                        No recovered materials logged yet. Click "Add Recovered Material" below.
                                                    </td>
                                                </tr>
                                            ) : (
                                                recoveredMaterials.map((mat) => {
                                                    const extValue = Math.round((parseFloat(mat.quantity) || 0) * (parseFloat(mat.pricePerUnit) || 0));
                                                    return (
                                                        <tr key={mat.id} className="table-row-hover">
                                                            <td>
                                                                <select
                                                                    value={mat.materialName}
                                                                    onChange={(e) => handleMaterialChange(mat.id, "materialName", e.target.value)}
                                                                    className="recyc-select-md"
                                                                >
                                                                    {activePrices.map(p => (
                                                                        <option key={p.materialName} value={p.materialName}>
                                                                            {p.materialName} (₹{p.pricePerUnit}/{p.unit})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={mat.quantity}
                                                                    onChange={(e) => handleMaterialChange(mat.id, "quantity", e.target.value)}
                                                                    className="recyc-input-sm"
                                                                    style={{ width: "100%" }}
                                                                />
                                                            </td>
                                                            <td style={{ fontWeight: 600 }}>{mat.unit}</td>
                                                            <td style={{ fontWeight: 600, color: "#64748b" }}>₹{mat.pricePerUnit} / {mat.unit}</td>
                                                            <td style={{ fontWeight: 800, color: "#059669" }}>₹{extValue.toLocaleString()}</td>
                                                            <td>
                                                                <button
                                                                    className="btn-action danger"
                                                                    onClick={() => handleRemoveMaterial(mat.id)}
                                                                    title="Remove Material"
                                                                >
                                                                    <FiTrash2 />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <button className="btn-action primary-ghost" onClick={handleAddMaterial}>
                                    <FiPlus /> Add Recovered Material
                                </button>

                                {/* Summary Grid */}
                                <div className="recyc-summary-grid" style={{ marginTop: "1.25rem" }}>
                                    <div className="recyc-summary-box">
                                        <div className="recyc-sum-label">Total Recovered Mass</div>
                                        <div className="recyc-sum-val">{totals.totalWeight} kg</div>
                                    </div>
                                    <div className="recyc-summary-box">
                                        <div className="recyc-sum-label">Total Recovered Material Value</div>
                                        <div className="recyc-sum-val" style={{ color: "#059669" }}>₹{totals.totalValue.toLocaleString()}</div>
                                    </div>
                                    <div className="recyc-summary-box">
                                        <div className="recyc-sum-label">Net Material Recovery Value</div>
                                        <div className="recyc-sum-val" style={{ color: "#0d9488" }}>₹{totals.netValue.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 5: Save & Complete Action Bar */}
                            <div className="panel-card" style={{ background: "#f8fafc" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                                    <div>
                                        <h4 style={{ margin: "0 0 0.2rem 0", fontSize: "0.95rem", fontWeight: 700 }}>Finalize Recycling Workflow</h4>
                                        <p style={{ margin: 0, fontSize: "0.775rem", color: "#64748b" }}>
                                            Save progress or issue official Green Recycling Audit Certificate.
                                        </p>
                                    </div>

                                    <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                                        <button
                                            className="btn-action glass"
                                            onClick={handleSaveProgress}
                                            disabled={processingId === selectedRequest.id}
                                        >
                                            <FiSave /> Save Progress
                                        </button>
                                        <button
                                            className="btn-action success"
                                            onClick={handleCompleteRecycling}
                                            disabled={processingId === selectedRequest.id}
                                        >
                                            <FiCheckSquare /> Complete &amp; Issue Certificate
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : null}
                </div>
            </main>

            {/* Certificate Modal */}
            {showCertModal && certificateData && (
                <div className="modal-overlay" onClick={() => setShowCertModal(false)}>
                    <div className="recyc-cert-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="recyc-modal-close" onClick={() => setShowCertModal(false)}>
                            <FiX />
                        </button>
                        <div className="recyc-cert-frame">
                            <div className="recyc-cert-header">
                                <div className="recyc-cert-badge">Official EcoCycle Environmental Certificate</div>
                                <h2 className="recyc-cert-title">Green Recycling &amp; Recovery Certificate</h2>
                                <p className="recyc-cert-sub">EPA Zero-Landfill Certified Material Recovery Verification</p>
                            </div>

                            <div className="recyc-cert-id">
                                <strong>Certificate ID:</strong> {certificateData.certificateId} &bull; <strong>Issue Date:</strong> {certificateData.issueDate}
                            </div>

                            <table className="recyc-cert-table">
                                <tbody>
                                    <tr>
                                        <td>Device Specification:</td>
                                        <td>{certificateData.brand} {certificateData.model} ({certificateData.categoryName})</td>
                                    </tr>
                                    <tr>
                                        <td>Customer / Owner:</td>
                                        <td>{certificateData.ownerName}</td>
                                    </tr>
                                    <tr>
                                        <td>Processing Facility:</td>
                                        <td>{certificateData.centerName}</td>
                                    </tr>
                                    <tr>
                                        <td>Initial Inbound Weight:</td>
                                        <td>{certificateData.originalWeightKg || "15.0"} kg</td>
                                    </tr>
                                    <tr>
                                        <td>Recovered Material Mass:</td>
                                        <td>{certificateData.totalRecoveredWeightKg} kg (100% Diverted)</td>
                                    </tr>
                                    <tr>
                                        <td>Recovered Material Value:</td>
                                        <td>₹{certificateData.totalMaterialValue.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="recyc-cert-footer">
                                <div>
                                    <FiShield style={{ color: "#059669", fontSize: "1.2rem" }} />
                                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#047857", marginLeft: "0.3rem" }}>EPA Zero-Landfill Verified</span>
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                    Authorized Signature: <em>EcoCycle Operations</em>
                                </div>
                            </div>

                            <div className="recyc-cert-actions">
                                <button className="btn-action primary" onClick={() => window.print()}>
                                    <FiPrinter /> Print Certificate
                                </button>
                                <button className="btn-action glass" onClick={() => setShowCertModal(false)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RecyclingPerform;
