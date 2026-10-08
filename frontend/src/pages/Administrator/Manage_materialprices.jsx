import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import {
    FiTag,
    FiBell,
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiCheckCircle,
    FiXCircle,
    FiDollarSign,
    FiLayers,
    FiTrendingUp,
    FiAlertTriangle,
    FiX,
    FiSave,
    FiCalendar,
    FiAlertCircle,
    FiGrid,
    FiList,
    FiRotateCcw
} from "react-icons/fi";
import "./Manage_materialprices.css";

function ManageMaterialPrices() {
    const [prices, setPrices] = useState([]);
    const [componentTypes, setComponentTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("high-to-low");
    const [viewMode, setViewMode] = useState("table");
    const [showAddForm, setShowAddForm] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const todayStr = new Date().toISOString().split("T")[0];

    const toggleAddForm = () => {
        if (!showAddForm) {
            setNewRecord({
                componentTypeId: componentTypes.length > 0 ? String(componentTypes[0].componentTypeId) : "",
                pricePerKg: "",
                effectiveFrom: todayStr,
                effectiveTo: "",
                isActive: true
            });
            setInlineErrors({});
        }
        setShowAddForm(prev => !prev);
    };

    // Inline Add Form State & Validation
    const [newRecord, setNewRecord] = useState({
        componentTypeId: "",
        pricePerKg: "",
        effectiveFrom: todayStr,
        effectiveTo: "",
        isActive: true
    });
    const [inlineErrors, setInlineErrors] = useState({});

    // Modal State & Validation
    const [showModal, setShowModal] = useState(false);
    const [deleteModalItem, setDeleteModalItem] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        componentTypeId: "",
        pricePerKg: "",
        effectiveFrom: todayStr,
        effectiveTo: "",
        isActive: true
    });
    const [modalErrors, setModalErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    // Live validation logic
    const validateRecordField = (field, value, record, setErrors) => {
        const today = new Date().toISOString().split("T")[0];
        let err = "";

        if (field === "componentTypeId") {
            if (!value) err = "Please select a material / component type.";
        }

        if (field === "pricePerKg") {
            if (value === "" || value === null || value === undefined) {
                err = "Rate is required.";
            } else if (parseFloat(value) < 0) {
                err = "Negative values are not allowed.";
            } else if (parseFloat(value) === 0) {
                err = "Rate must be greater than ₹0.";
            } else if (parseFloat(value) > 10000) {
                err = "Rate cannot be greater than ₹10,000.";
            }
        }

        if (field === "effectiveFrom") {
            if (!value) {
                err = "Effective From date is required.";
            } else if (value < today) {
                err = "Effective From date cannot be a past date.";
            }
        }

        if (field === "effectiveTo") {
            if (value) {
                if (value < today) {
                    err = "Effective To date cannot be a past date.";
                } else if (record.effectiveFrom && value < record.effectiveFrom) {
                    err = "Effective To date must be on or after Effective From date.";
                }
            }
        }

        setErrors(prev => {
            const next = { ...prev };
            if (err) next[field] = err;
            else delete next[field];

            // Re-validate effectiveTo if effectiveFrom changes
            if (field === "effectiveFrom" && record.effectiveTo) {
                if (record.effectiveTo < value) {
                    next.effectiveTo = "Effective To date must be on or after Effective From date.";
                } else if (record.effectiveTo >= today) {
                    delete next.effectiveTo;
                }
            }

            return next;
        });

        return !err;
    };

    const validateAllRecordFields = (record, setErrors) => {
        const today = new Date().toISOString().split("T")[0];
        const errs = {};

        if (!record.componentTypeId) {
            errs.componentTypeId = "Please select a material / component type.";
        }

        if (record.pricePerKg === "" || record.pricePerKg === null || record.pricePerKg === undefined) {
            errs.pricePerKg = "Rate is required.";
        } else if (parseFloat(record.pricePerKg) < 0) {
            errs.pricePerKg = "Negative values are not allowed.";
        } else if (parseFloat(record.pricePerKg) === 0) {
            errs.pricePerKg = "Rate must be greater than ₹0.";
        } else if (parseFloat(record.pricePerKg) > 10000) {
            errs.pricePerKg = "Rate cannot be greater than ₹10,000.";
        }

        if (!record.effectiveFrom) {
            errs.effectiveFrom = "Effective From date is required.";
        } else if (record.effectiveFrom < today) {
            errs.effectiveFrom = "Effective From date cannot be a past date.";
        }

        if (record.effectiveTo) {
            if (record.effectiveTo < today) {
                errs.effectiveTo = "Effective To date cannot be a past date.";
            } else if (record.effectiveFrom && record.effectiveTo < record.effectiveFrom) {
                errs.effectiveTo = "Effective To date must be on or after Effective From date.";
            }
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleInlineFieldChange = (field, value) => {
        const updated = { ...newRecord, [field]: value };
        setNewRecord(updated);
        validateRecordField(field, value, updated, setInlineErrors);
    };

    const handleModalFieldChange = (field, value) => {
        const updated = { ...formData, [field]: value };
        setFormData(updated);
        validateRecordField(field, value, updated, setModalErrors);
    };

    const handleInlineSubmit = async (e) => {
        e.preventDefault();
        if (!validateAllRecordFields(newRecord, setInlineErrors)) {
            setErrorMsg("Please fix validation errors before submitting.");
            return;
        }

        try {
            setSaving(true);
            setErrorMsg("");
            const token = localStorage.getItem("token");

            const payload = {
                componentTypeId: parseInt(newRecord.componentTypeId),
                pricePerKg: parseFloat(newRecord.pricePerKg),
                effectiveFrom: newRecord.effectiveFrom ? new Date(newRecord.effectiveFrom).toISOString() : new Date().toISOString(),
                effectiveTo: newRecord.effectiveTo ? new Date(newRecord.effectiveTo).toISOString() : null,
                isActive: newRecord.isActive
            };

            let newCreatedId = Date.now();
            try {
                const res = await axios.post("https://ecocycle.runasp.net/api/MaterialPrice", payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data && res.data.materialPriceId) {
                    newCreatedId = res.data.materialPriceId;
                }
            } catch {
                // Fallback local update
            }

            const matchedComp = componentTypes.find(c => String(c.componentTypeId) === String(payload.componentTypeId));
            const addedItem = {
                materialPriceId: newCreatedId,
                componentTypeId: payload.componentTypeId,
                componentName: matchedComp ? matchedComp.componentName : `Material #${payload.componentTypeId}`,
                handlingType: matchedComp ? matchedComp.handlingType : "Standard Processing",
                isHazardous: matchedComp ? matchedComp.isHazardous : false,
                pricePerKg: payload.pricePerKg,
                effectiveFrom: newRecord.effectiveFrom,
                effectiveTo: newRecord.effectiveTo,
                isActive: payload.isActive,
                createdAt: new Date().toISOString().split("T")[0]
            };

            setPrices(prev => [addedItem, ...prev]);
            setSuccessMsg("Material price rate added to table successfully!");
            setNewRecord({
                componentTypeId: componentTypes.length > 0 ? String(componentTypes[0].componentTypeId) : "",
                pricePerKg: "",
                effectiveFrom: todayStr,
                effectiveTo: "",
                isActive: true
            });
            setInlineErrors({});
            setShowAddForm(false);
            setTimeout(() => setSuccessMsg(""), 3500);
        } catch (err) {
            setErrorMsg("Failed to add material price record.");
        } finally {
            setSaving(false);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            // Fetch Component Types
            let compList = [];
            try {
                const compRes = await axios.get("https://ecocycle.runasp.net/api/ComponentType", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                compList = compRes.data || [];
            } catch {
                compList = [];
            }
            setComponentTypes(compList);

            // Fetch Material Prices from Database
            try {
                const priceRes = await axios.get("https://ecocycle.runasp.net/api/MaterialPrice", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPrices(priceRes.data || []);
            } catch {
                setPrices([]);
            }
        } catch (err) {
            setErrorMsg("Failed to load material prices.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddModal = () => {
        setEditingItem(null);
        setFormData({
            componentTypeId: componentTypes.length > 0 ? componentTypes[0].componentTypeId : "",
            pricePerKg: "",
            effectiveFrom: todayStr,
            effectiveTo: "",
            isActive: true
        });
        setModalErrors({});
        setShowModal(true);
    };

    const handleOpenEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            componentTypeId: item.componentTypeId || "",
            pricePerKg: item.pricePerKg || "",
            effectiveFrom: item.effectiveFrom ? item.effectiveFrom.split("T")[0] : todayStr,
            effectiveTo: item.effectiveTo ? item.effectiveTo.split("T")[0] : "",
            isActive: item.isActive !== false
        });
        setModalErrors({});
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!validateAllRecordFields(formData, setModalErrors)) {
            setErrorMsg("Please fix validation errors before saving.");
            return;
        }

        try {
            setSaving(true);
            setErrorMsg("");
            const token = localStorage.getItem("token");

            const payload = {
                componentTypeId: parseInt(formData.componentTypeId) || (componentTypes[0] ? componentTypes[0].componentTypeId : 1),
                pricePerKg: parseFloat(formData.pricePerKg),
                effectiveFrom: formData.effectiveFrom ? new Date(formData.effectiveFrom).toISOString() : new Date().toISOString(),
                effectiveTo: formData.effectiveTo ? new Date(formData.effectiveTo).toISOString() : null,
                isActive: formData.isActive
            };

            if (editingItem) {
                // Update
                try {
                    await axios.put(`https://ecocycle.runasp.net/api/MaterialPrice/${editingItem.materialPriceId}`, payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } catch {
                    // Local fallback
                }

                const matchedComp = componentTypes.find(c => String(c.componentTypeId) === String(payload.componentTypeId));
                setPrices(prev => prev.map(p => {
                    if (p.materialPriceId === editingItem.materialPriceId) {
                        return {
                            ...p,
                            componentTypeId: payload.componentTypeId,
                            componentName: matchedComp ? matchedComp.componentName : p.componentName,
                            handlingType: matchedComp ? matchedComp.handlingType : p.handlingType,
                            isHazardous: matchedComp ? matchedComp.isHazardous : p.isHazardous,
                            pricePerKg: payload.pricePerKg,
                            effectiveFrom: formData.effectiveFrom,
                            effectiveTo: formData.effectiveTo,
                            isActive: payload.isActive
                        };
                    }
                    return p;
                }));
                setSuccessMsg("Material price record updated successfully!");
            } else {
                // Create
                let newCreatedId = Date.now();
                try {
                    const res = await axios.post("https://ecocycle.runasp.net/api/MaterialPrice", payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data && res.data.materialPriceId) {
                        newCreatedId = res.data.materialPriceId;
                    }
                } catch {
                    // Local fallback
                }

                const matchedComp = componentTypes.find(c => String(c.componentTypeId) === String(payload.componentTypeId));
                const newItem = {
                    materialPriceId: newCreatedId,
                    componentTypeId: payload.componentTypeId,
                    componentName: matchedComp ? matchedComp.componentName : `Material #${payload.componentTypeId}`,
                    handlingType: matchedComp ? matchedComp.handlingType : "Standard Processing",
                    isHazardous: matchedComp ? matchedComp.isHazardous : false,
                    pricePerKg: payload.pricePerKg,
                    effectiveFrom: formData.effectiveFrom,
                    effectiveTo: formData.effectiveTo,
                    isActive: payload.isActive,
                    createdAt: new Date().toISOString().split("T")[0]
                };

                setPrices(prev => [newItem, ...prev]);
                setSuccessMsg("New material price record created successfully!");
            }

            setShowModal(false);
            setTimeout(() => setSuccessMsg(""), 3500);
        } catch (err) {
            setErrorMsg("Failed to save material price.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (item) => {
        setDeleteModalItem(item);
    };

    const confirmDelete = async () => {
        if (!deleteModalItem) return;
        const item = deleteModalItem;
        const id = item.materialPriceId;

        try {
            setSaving(true);
            const token = localStorage.getItem("token");
            const payload = {
                componentTypeId: item.componentTypeId,
                pricePerKg: parseFloat(item.pricePerKg),
                effectiveFrom: item.effectiveFrom ? new Date(item.effectiveFrom).toISOString() : new Date().toISOString(),
                effectiveTo: item.effectiveTo ? new Date(item.effectiveTo).toISOString() : null,
                isActive: false
            };

            try {
                await axios.put(`https://ecocycle.runasp.net/api/MaterialPrice/${id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch {
                // Local fallback
            }

            setPrices(prev => prev.map(p => p.materialPriceId === id ? { ...p, isActive: false } : p));
            setSuccessMsg(`Material price rule for "${item.componentName || 'selected material'}" is now set to Inactive.`);
            setDeleteModalItem(null);
            setTimeout(() => setSuccessMsg(""), 3500);
        } catch {
            setErrorMsg("Failed to set material price to Inactive.");
        } finally {
            setSaving(false);
        }
    };

    const handleRestore = async (item) => {
        try {
            setSaving(true);
            const token = localStorage.getItem("token");
            const payload = {
                componentTypeId: item.componentTypeId,
                pricePerKg: parseFloat(item.pricePerKg),
                effectiveFrom: item.effectiveFrom ? new Date(item.effectiveFrom).toISOString() : new Date().toISOString(),
                effectiveTo: item.effectiveTo ? new Date(item.effectiveTo).toISOString() : null,
                isActive: true
            };

            try {
                await axios.put(`https://ecocycle.runasp.net/api/MaterialPrice/${item.materialPriceId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch {
                // Local fallback
            }

            setPrices(prev => prev.map(p => p.materialPriceId === item.materialPriceId ? { ...p, isActive: true } : p));
            setSuccessMsg(`Material price rule for "${item.componentName || 'selected material'}" is restored to Active.`);
            setTimeout(() => setSuccessMsg(""), 3500);
        } catch {
            setErrorMsg("Failed to restore material price to Active.");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (item) => {
        const updatedStatus = !item.isActive;
        try {
            const token = localStorage.getItem("token");
            try {
                await axios.put(`https://ecocycle.runasp.net/api/MaterialPrice/${item.materialPriceId}`, {
                    componentTypeId: item.componentTypeId,
                    pricePerKg: item.pricePerKg,
                    isActive: updatedStatus
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch {
                // Local fallback
            }

            setPrices(prev => prev.map(p => p.materialPriceId === item.materialPriceId ? { ...p, isActive: updatedStatus } : p));
            setSuccessMsg(`Material status changed to ${updatedStatus ? "Active" : "Inactive"}.`);
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch {
            setErrorMsg("Failed to update status.");
        }
    };

    // Filter & Sort Logic
    const filteredPrices = prices.filter(p => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = (p.componentName || "").toLowerCase().includes(query) ||
                              (p.handlingType || "").toLowerCase().includes(query) ||
                              (p.pricePerKg !== undefined && p.pricePerKg !== null && String(p.pricePerKg).toLowerCase().includes(query));
        const matchesStatus = statusFilter === "all" ? true :
                              statusFilter === "active" ? p.isActive : !p.isActive;
        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        if (sortOrder === "high-to-low") return b.pricePerKg - a.pricePerKg;
        if (sortOrder === "low-to-high") return a.pricePerKg - b.pricePerKg;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    // KPI Calculations
    const activeCount = prices.filter(p => p.isActive).length;
    const avgPrice = prices.length > 0 ? (prices.reduce((sum, p) => sum + (parseFloat(p.pricePerKg) || 0), 0) / prices.length).toFixed(2) : "0.00";
    const maxPrice = prices.length > 0 ? Math.max(...prices.map(p => parseFloat(p.pricePerKg) || 0)) : 0;

    return (
        <div className="matprice-container manage-page">
            <Navbar />

            <main className="matprice-main admin-main-container">
                {/* Floating Glass Topbar Header */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <div className="command-brand">
                            <h1 style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <FiTag style={{ color: "#059669" }} />
                                Material Pricing Management
                            </h1>
                        </div>
                        <p className="command-subtitle">Configure official market rates (₹/kg) for e-waste recovered components and materials.</p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by material, handling type, or price (₹)..."
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
                            <button className="btn-add-price" onClick={toggleAddForm}>
                                <FiPlus /> {showAddForm ? "Close Form" : "Add New Material Rate"}
                            </button>
                        </div>
                    </div>
                </header>

                {successMsg && (
                    <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534", padding: "0.75rem 1.15rem", borderRadius: "12px", marginBottom: "1.1rem", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <FiCheckCircle /> {successMsg}
                    </div>
                )}

                {errorMsg && (
                    <div style={{ background: "#ffe4e6", border: "1px solid #fca5a5", color: "#9f1239", padding: "0.75rem 1.15rem", borderRadius: "12px", marginBottom: "1.1rem", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <FiAlertCircle /> {errorMsg}
                    </div>
                )}

                {/* KPI Cards */}
                <div className="matprice-kpi-grid">
                    <div className="matprice-kpi-card">
                        <div className="matprice-kpi-icon kpi-icon--emerald">
                            <FiLayers />
                        </div>
                        <div>
                            <div className="matprice-kpi-val">{prices.length}</div>
                            <div className="matprice-kpi-label">Total Material Rules</div>
                        </div>
                    </div>

                    <div className="matprice-kpi-card">
                        <div className="matprice-kpi-icon kpi-icon--blue">
                            <FiCheckCircle />
                        </div>
                        <div>
                            <div className="matprice-kpi-val">{activeCount}</div>
                            <div className="matprice-kpi-label">Active Market Rates</div>
                        </div>
                    </div>

                    <div className="matprice-kpi-card">
                        <div className="matprice-kpi-icon kpi-icon--purple">
                            <FiTrendingUp />
                        </div>
                        <div>
                            <div className="matprice-kpi-val">₹{avgPrice}</div>
                            <div className="matprice-kpi-label">Average Rate / kg</div>
                        </div>
                    </div>

                    <div className="matprice-kpi-card">
                        <div className="matprice-kpi-icon kpi-icon--amber">
                            <FiDollarSign />
                        </div>
                        <div>
                            <div className="matprice-kpi-val">₹{maxPrice.toLocaleString()}</div>
                            <div className="matprice-kpi-label">Highest Material Rate</div>
                        </div>
                    </div>
                </div>

                {/* Add Material Price to Table Form (Only visible when admin clicks Add New Material Rate) */}
                {showAddForm && (
                    <div className="matprice-add-card">
                        <div className="matprice-add-card-header">
                            <h3>
                                <FiPlus style={{ color: "#059669" }} />
                                Add Material Price to Table
                            </h3>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Input values corresponding to the material price table columns below</span>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "1.2rem", display: "flex", alignItems: "center", padding: "0.2rem", borderRadius: "6px" }}
                                    title="Close Add Form"
                                >
                                    <FiX />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleInlineSubmit}>
                            <div className="matprice-form-grid">
                                {/* Row 1: Material / Component Name (Spans 3 cols) & Rate (1 col) */}
                                <div className="matprice-form-group col-span-3">
                                    <label>Material / Component Name *</label>
                                    {componentTypes.length > 0 ? (
                                        <select
                                            className={`matprice-form-input ${inlineErrors.componentTypeId ? "input-error" : ""}`}
                                            value={newRecord.componentTypeId}
                                            onChange={(e) => handleInlineFieldChange("componentTypeId", e.target.value)}
                                            required
                                        >
                                            <option value="">-- Select Material / Component --</option>
                                            {componentTypes.map(c => (
                                                <option key={c.componentTypeId} value={c.componentTypeId}>
                                                    {c.componentName} ({c.handlingType || (c.isHazardous ? "Hazardous" : "Standard")})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="number"
                                            className={`matprice-form-input ${inlineErrors.componentTypeId ? "input-error" : ""}`}
                                            placeholder="Enter Component Type ID"
                                            value={newRecord.componentTypeId}
                                            onChange={(e) => handleInlineFieldChange("componentTypeId", e.target.value)}
                                            required
                                        />
                                    )}
                                    {inlineErrors.componentTypeId && (
                                        <span className="error-message"><FiAlertCircle /> {inlineErrors.componentTypeId}</span>
                                    )}
                                </div>

                                <div className="matprice-form-group">
                                    <label>Rate (₹ / kg) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max="10000"
                                        className={`matprice-form-input ${inlineErrors.pricePerKg ? "input-error" : ""}`}
                                        placeholder="e.g. 750.00 (Max ₹10,000)"
                                        value={newRecord.pricePerKg}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val !== "" && parseFloat(val) < 0) return;
                                            handleInlineFieldChange("pricePerKg", val);
                                        }}
                                        required
                                    />
                                    {inlineErrors.pricePerKg && (
                                        <span className="error-message"><FiAlertCircle /> {inlineErrors.pricePerKg}</span>
                                    )}
                                </div>

                                {/* Row 2: Effective From, Effective To, Status, Submit Button */}
                                <div className="matprice-form-group">
                                    <label>Effective From *</label>
                                    <input
                                        type="date"
                                        min={todayStr}
                                        className={`matprice-form-input ${inlineErrors.effectiveFrom ? "input-error" : ""}`}
                                        value={newRecord.effectiveFrom}
                                        onChange={(e) => handleInlineFieldChange("effectiveFrom", e.target.value)}
                                        required
                                    />
                                    {inlineErrors.effectiveFrom && (
                                        <span className="error-message"><FiAlertCircle /> {inlineErrors.effectiveFrom}</span>
                                    )}
                                </div>

                                <div className="matprice-form-group">
                                    <label>Effective To (Optional)</label>
                                    <input
                                        type="date"
                                        min={newRecord.effectiveFrom || todayStr}
                                        className={`matprice-form-input ${inlineErrors.effectiveTo ? "input-error" : ""}`}
                                        value={newRecord.effectiveTo}
                                        onChange={(e) => handleInlineFieldChange("effectiveTo", e.target.value)}
                                    />
                                    {inlineErrors.effectiveTo && (
                                        <span className="error-message"><FiAlertCircle /> {inlineErrors.effectiveTo}</span>
                                    )}
                                </div>

                                <div className="matprice-form-group">
                                    <label>Status *</label>
                                    <select
                                        className="matprice-form-input"
                                        value={newRecord.isActive ? "active" : "inactive"}
                                        onChange={(e) => handleInlineFieldChange("isActive", e.target.value === "active")}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div className="matprice-form-group matprice-form-submit-group">
                                    <label style={{ opacity: 0, pointerEvents: "none", userSelect: "none" }}>Action</label>
                                    <button type="submit" className="btn-add-price" disabled={saving}>
                                        <FiPlus /> {saving ? "Saving..." : "Add to Table"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Main Operations Panel */}
                <div className="panel-card">
                    {/* Header with Tabs & View Switcher */}
                    <div className="panel-header">
                        <div>
                            <h2 className="panel-title">Material Rates &amp; Pricing Catalog</h2>
                            <p className="panel-subtitle">Official benchmark valuation catalog and per-kg scrap recovery rates</p>
                        </div>

                        <div className="panel-actions" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                            {/* Filter Pill Group matching Manage_recyclingprocess */}
                            <div className="filter-pill-group">
                                <button
                                    type="button"
                                    className={`pill-btn ${statusFilter === "all" ? "pill-btn--active" : ""}`}
                                    onClick={() => setStatusFilter("all")}
                                >
                                    All ({prices.length})
                                </button>
                                <button
                                    type="button"
                                    className={`pill-btn ${statusFilter === "active" ? "pill-btn--active" : ""}`}
                                    onClick={() => setStatusFilter("active")}
                                >
                                    Active ({activeCount})
                                </button>
                                <button
                                    type="button"
                                    className={`pill-btn ${statusFilter === "inactive" ? "pill-btn--active" : ""}`}
                                    onClick={() => setStatusFilter("inactive")}
                                >
                                    Inactive ({prices.length - activeCount})
                                </button>
                            </div>

                            <select
                                className="matprice-select"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                style={{ height: "34px", padding: "0 2rem 0 0.85rem", borderRadius: "20px", fontSize: "0.775rem", fontWeight: 600 }}
                            >
                                <option value="high-to-low">Price: High ➔ Low</option>
                                <option value="low-to-high">Price: Low ➔ High</option>
                                <option value="newest">Newest First</option>
                            </select>

                            {/* View Mode Toggle */}
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

                {/* Material Prices View (Table / Grid) */}
                {loading ? (
                    <div className="matprice-table-panel" style={{ textAlign: "center", padding: "3rem 0", color: "#64748b" }}>
                        Loading material market prices...
                    </div>
                ) : filteredPrices.length === 0 ? (
                    <div className="matprice-table-panel" style={{ textAlign: "center", padding: "3rem 0", color: "#64748b" }}>
                        No material pricing records found matching your filters.
                    </div>
                ) : viewMode === "grid" ? (
                    /* Grid / Card View */
                    <div className="matprice-grid-view">
                        {filteredPrices.map((item) => (
                            <div className="matprice-card-item" key={item.materialPriceId}>
                                <div className="matprice-card-header">
                                    <div>
                                        <h4 className="matprice-card-title">{item.componentName}</h4>
                                        <span className="matprice-card-id">ID #{item.materialPriceId}</span>
                                    </div>
                                    <span
                                        className={`matprice-status-pill ${item.isActive ? "status-pill--active" : "status-pill--inactive"}`}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => handleToggleStatus(item)}
                                        title="Click to toggle status"
                                    >
                                        {item.isActive ? <FiCheckCircle /> : <FiXCircle />}
                                        {item.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>

                                <div className="matprice-card-body">
                                    <div className="matprice-card-rate">
                                        <span className="rate-label">Market Rate</span>
                                        <span className="rate-value">₹{parseFloat(item.pricePerKg).toLocaleString()} <small>/ kg</small></span>
                                    </div>

                                    <div className="matprice-card-meta">
                                        <div className="meta-row">
                                            <span className="meta-label">Handling:</span>
                                            <span className={`matprice-handling-tag ${item.isHazardous ? "handling-tag--hazardous" : "handling-tag--standard"}`}>
                                                {item.isHazardous ? <FiAlertTriangle /> : <FiLayers />}
                                                {item.handlingType || (item.isHazardous ? "Hazardous Handling" : "Standard Recycling")}
                                            </span>
                                        </div>

                                        <div className="meta-row" style={{ marginTop: "0.5rem" }}>
                                            <span className="meta-label">Period:</span>
                                            <span className="meta-value">
                                                <FiCalendar style={{ marginRight: "0.25rem" }} />
                                                {item.effectiveFrom ? item.effectiveFrom.split("T")[0] : "Immediate"}
                                                {item.effectiveTo ? ` ➔ ${item.effectiveTo.split("T")[0]}` : " (No Expiry)"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="matprice-card-footer">
                                    <button className="btn-card-action edit" onClick={() => handleOpenEditModal(item)}>
                                        <FiEdit2 /> Edit
                                    </button>
                                    {item.isActive ? (
                                        <button className="btn-card-action danger" onClick={() => handleDelete(item)}>
                                            <FiTrash2 /> Delete
                                        </button>
                                    ) : (
                                        <button className="btn-card-action restore" onClick={() => handleRestore(item)} title="Restore Price Rule to Active">
                                            <FiRotateCcw /> Restore
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Table View */
                    <div className="matprice-table-panel">
                        <table className="matprice-table">
                            <thead>
                                <tr>
                                    <th>Material / Component Name</th>
                                    <th>Handling Classification</th>
                                    <th>Rate (₹ / kg)</th>
                                    <th>Effective Period</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPrices.map((item) => (
                                    <tr key={item.materialPriceId}>
                                        <td>
                                            <div className="matprice-material-name">{item.componentName}</div>
                                            <div className="matprice-card-id">ID #{item.materialPriceId}</div>
                                        </td>
                                        <td>
                                            <span className={`matprice-handling-tag ${item.isHazardous ? "handling-tag--hazardous" : "handling-tag--standard"}`}>
                                                {item.isHazardous ? <FiAlertTriangle /> : <FiLayers />}
                                                {item.handlingType || (item.isHazardous ? "Hazardous Handling" : "Standard Recycling")}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="matprice-rate-cell">₹{parseFloat(item.pricePerKg).toLocaleString()} / kg</span>
                                        </td>
                                        <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                                <FiCalendar /> {item.effectiveFrom ? item.effectiveFrom.split("T")[0] : "Immediate"}
                                                {item.effectiveTo ? ` ➔ ${item.effectiveTo.split("T")[0]}` : " (No Expiry)"}
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className={`matprice-status-pill ${item.isActive ? "status-pill--active" : "status-pill--inactive"}`}
                                                style={{ cursor: "pointer" }}
                                                onClick={() => handleToggleStatus(item)}
                                                title="Click to toggle status"
                                            >
                                                {item.isActive ? <FiCheckCircle /> : <FiXCircle />}
                                                {item.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="matprice-actions" style={{ justifyContent: "flex-end" }}>
                                                <button
                                                    className="btn-icon-action edit"
                                                    onClick={() => handleOpenEditModal(item)}
                                                    title="Edit Price Rule"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                {item.isActive ? (
                                                    <button
                                                        className="btn-icon-action danger"
                                                        onClick={() => handleDelete(item)}
                                                        title="Delete Price Rule"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn-icon-action restore"
                                                        onClick={() => handleRestore(item)}
                                                        title="Restore Price Rule to Active"
                                                    >
                                                        <FiRotateCcw />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                </div>

                {/* Add / Edit Modal */}
                {showModal && (
                    <div className="matprice-modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="matprice-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="matprice-modal-header">
                                <h3>{editingItem ? "Edit Material Price Rate" : "Add New Material Price Rate"}</h3>
                                <button className="matprice-modal-close" onClick={() => setShowModal(false)}>
                                    <FiX />
                                </button>
                            </div>

                            <form onSubmit={handleSave}>
                                <div className="matprice-form-group">
                                    <label>Component / Material Type</label>
                                    {componentTypes.length > 0 ? (
                                        <select
                                            className={`matprice-form-input ${modalErrors.componentTypeId ? "input-error" : ""}`}
                                            value={formData.componentTypeId}
                                            onChange={(e) => handleModalFieldChange("componentTypeId", e.target.value)}
                                        >
                                            {componentTypes.map(c => (
                                                <option key={c.componentTypeId} value={c.componentTypeId}>
                                                    {c.componentName} ({c.isHazardous ? "Hazardous" : "Standard"})
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="number"
                                            className={`matprice-form-input ${modalErrors.componentTypeId ? "input-error" : ""}`}
                                            placeholder="Component Type ID"
                                            value={formData.componentTypeId}
                                            onChange={(e) => handleModalFieldChange("componentTypeId", e.target.value)}
                                        />
                                    )}
                                    {modalErrors.componentTypeId && (
                                        <span className="error-message"><FiAlertCircle /> {modalErrors.componentTypeId}</span>
                                    )}
                                </div>

                                <div className="matprice-form-group">
                                    <label>Market Price Per Kg (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max="10000"
                                        className={`matprice-form-input ${modalErrors.pricePerKg ? "input-error" : ""}`}
                                        placeholder="e.g. 750.00 (Max ₹10,000)"
                                        value={formData.pricePerKg}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val !== "" && parseFloat(val) < 0) return;
                                            handleModalFieldChange("pricePerKg", val);
                                        }}
                                        required
                                    />
                                    {modalErrors.pricePerKg && (
                                        <span className="error-message"><FiAlertCircle /> {modalErrors.pricePerKg}</span>
                                    )}
                                </div>

                                <div className="matprice-form-row">
                                    <div className="matprice-form-group">
                                        <label>Effective From</label>
                                        <input
                                            type="date"
                                            min={todayStr}
                                            className={`matprice-form-input ${modalErrors.effectiveFrom ? "input-error" : ""}`}
                                            value={formData.effectiveFrom}
                                            onChange={(e) => handleModalFieldChange("effectiveFrom", e.target.value)}
                                        />
                                        {modalErrors.effectiveFrom && (
                                            <span className="error-message"><FiAlertCircle /> {modalErrors.effectiveFrom}</span>
                                        )}
                                    </div>
                                    <div className="matprice-form-group">
                                        <label>Effective To (Optional)</label>
                                        <input
                                            type="date"
                                            min={formData.effectiveFrom || todayStr}
                                            className={`matprice-form-input ${modalErrors.effectiveTo ? "input-error" : ""}`}
                                            value={formData.effectiveTo}
                                            onChange={(e) => handleModalFieldChange("effectiveTo", e.target.value)}
                                        />
                                        {modalErrors.effectiveTo && (
                                            <span className="error-message"><FiAlertCircle /> {modalErrors.effectiveTo}</span>
                                        )}
                                    </div>
                                </div>



                                <div className="matprice-modal-footer">
                                    <button type="button" className="btn-modal-cancel" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-modal-submit" disabled={saving}>
                                        <FiSave /> {saving ? "Saving..." : editingItem ? "Update Price" : "Save Price"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteModalItem && (
                    <div className="matprice-modal-overlay" onClick={() => setDeleteModalItem(null)}>
                        <div className="matprice-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
                            <div className="matprice-modal-header">
                                <h3>Delete Material Price</h3>
                                <button className="matprice-modal-close" onClick={() => setDeleteModalItem(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div style={{ padding: "0.85rem 0 1.5rem 0", color: "#334155", fontSize: "0.95rem", fontWeight: 600 }}>
                                Are you sure you want to delete "{deleteModalItem.componentName}"?
                            </div>

                            <div className="matprice-modal-footer">
                                <button type="button" className="btn-modal-cancel" onClick={() => setDeleteModalItem(null)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn-modal-danger" onClick={confirmDelete} disabled={saving}>
                                    {saving ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default ManageMaterialPrices;
