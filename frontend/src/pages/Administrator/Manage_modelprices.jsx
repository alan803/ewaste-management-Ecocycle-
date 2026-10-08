import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import {
    FiSmartphone,
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
    FiRotateCcw,
    FiSliders,
    FiRefreshCw
} from "react-icons/fi";
import "./Manage_modelprices.css";

function ManageModelPrices() {
    const [models, setModels] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("high-to-low");
    const [viewMode, setViewMode] = useState("table");
    const [showAddForm, setShowAddForm] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Condition Simulator
    const [simulatedCondition, setSimulatedCondition] = useState(80);

    // Inline Add Form State & Validation
    const [newRecord, setNewRecord] = useState({
        categoryId: "",
        brand: "",
        model: "",
        modelNumber: "",
        weight: "",
        referenceMarketPrice: ""
    });
    const [inlineErrors, setInlineErrors] = useState({});

    // Modal State & Validation
    const [showModal, setShowModal] = useState(false);
    const [deleteModalItem, setDeleteModalItem] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        deviceModelId: 0,
        categoryId: "",
        brand: "",
        model: "",
        modelNumber: "",
        weight: "",
        referenceMarketPrice: ""
    });
    const [modalErrors, setModalErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const token = localStorage.getItem("token");

    const getHeaders = () => ({
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [modelsRes, catsRes] = await Promise.all([
                axios.get("https://localhost:7102/api/DeviceModel/GetAdminAll", getHeaders()).catch(() =>
                    axios.get("https://localhost:7102/api/DeviceModel/GetAll")
                ),
                axios.get("https://localhost:7102/api/DeviceCategory/GetAll")
            ]);

            setModels(modelsRes.data || []);
            const cats = catsRes.data || [];
            setCategories(cats);

            if (cats.length > 0 && !newRecord.categoryId) {
                setNewRecord(prev => ({ ...prev, categoryId: String(cats[0].categoryId) }));
            }
            setErrorMsg("");
        } catch (err) {
            console.error("Error fetching price master data:", err);
            setErrorMsg("Failed to load device model price master.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleAddForm = () => {
        if (!showAddForm) {
            setNewRecord({
                categoryId: categories.length > 0 ? String(categories[0].categoryId) : "",
                brand: "",
                model: "",
                modelNumber: "",
                weight: "0.5",
                referenceMarketPrice: "15000"
            });
            setInlineErrors({});
        }
        setShowAddForm(prev => !prev);
    };

    // Live validation logic for Add Form & Modal
    const validateField = (field, value, setErrors) => {
        let err = "";

        if (field === "categoryId") {
            if (!value) err = "Please select a device category.";
        }

        if (field === "brand") {
            if (!value || !value.trim()) err = "Brand name is required.";
        }

        if (field === "model") {
            if (!value || !value.trim()) err = "Model name is required.";
        }

        if (field === "referenceMarketPrice") {
            if (value === "" || value === null || value === undefined) {
                err = "Reference price is required.";
            } else if (parseFloat(value) < 0) {
                err = "Price cannot be negative.";
            } else if (parseFloat(value) === 0) {
                err = "Price must be greater than ₹0.";
            } else if (parseFloat(value) > 1000000) {
                err = "Price cannot exceed ₹10,00,000.";
            }
        }

        if (field === "weight" && value !== "") {
            const w = parseFloat(value);
            if (isNaN(w) || w <= 0) err = "Weight must be positive.";
        }

        setErrors(prev => {
            const next = { ...prev };
            if (err) next[field] = err;
            else delete next[field];
            return next;
        });

        return !err;
    };

    const handleInlineFieldChange = (field, value) => {
        setNewRecord(prev => ({ ...prev, [field]: value }));
        validateField(field, value, setInlineErrors);
    };

    const handleInlineSubmit = async (e) => {
        e.preventDefault();

        const v1 = validateField("categoryId", newRecord.categoryId, setInlineErrors);
        const v2 = validateField("brand", newRecord.brand, setInlineErrors);
        const v3 = validateField("model", newRecord.model, setInlineErrors);
        const v4 = validateField("referenceMarketPrice", newRecord.referenceMarketPrice, setInlineErrors);

        if (!v1 || !v2 || !v3 || !v4) return;

        try {
            setSaving(true);
            const payload = {
                categoryId: parseInt(newRecord.categoryId),
                brand: newRecord.brand.trim(),
                model: newRecord.model.trim(),
                modelNumber: newRecord.modelNumber ? newRecord.modelNumber.trim() : null,
                weight: newRecord.weight ? parseFloat(newRecord.weight) : null,
                referenceMarketPrice: parseFloat(newRecord.referenceMarketPrice) || 0
            };

            await axios.post("https://localhost:7102/api/DeviceModel/Create", payload, getHeaders());

            setShowAddForm(false);
            fetchData();
        } catch (err) {
            console.error("Error creating model:", err);
            setErrorMsg(err.response?.data?.message || "Failed to add device model.");
            setTimeout(() => setErrorMsg(""), 4000);
        } finally {
            setSaving(false);
        }
    };

    const handleOpenEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            deviceModelId: item.deviceModelId,
            categoryId: String(item.categoryId),
            brand: item.brand || "",
            model: item.model || "",
            modelNumber: item.modelNumber || "",
            weight: item.weight !== null && item.weight !== undefined ? String(item.weight) : "",
            referenceMarketPrice: item.referenceMarketPrice !== null && item.referenceMarketPrice !== undefined ? String(item.referenceMarketPrice) : ""
        });
        setModalErrors({});
        setShowModal(true);
    };

    const handleModalFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        validateField(field, value, setModalErrors);
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const v1 = validateField("categoryId", formData.categoryId, setModalErrors);
        const v2 = validateField("brand", formData.brand, setModalErrors);
        const v3 = validateField("model", formData.model, setModalErrors);
        const v4 = validateField("referenceMarketPrice", formData.referenceMarketPrice, setModalErrors);

        if (!v1 || !v2 || !v3 || !v4) return;

        try {
            setSaving(true);
            const payload = {
                categoryId: parseInt(formData.categoryId),
                brand: formData.brand.trim(),
                model: formData.model.trim(),
                modelNumber: formData.modelNumber ? formData.modelNumber.trim() : null,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                referenceMarketPrice: parseFloat(formData.referenceMarketPrice) || 0,
                isActive: editingItem ? editingItem.isActive : true
            };

            if (editingItem) {
                await axios.put(`https://localhost:7102/api/DeviceModel/Update/${formData.deviceModelId}`, payload, getHeaders());
            } else {
                await axios.post("https://localhost:7102/api/DeviceModel/Create", payload, getHeaders());
            }

            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error("Error saving model:", err);
            setErrorMsg(err.response?.data?.message || "Failed to save device model.");
            setTimeout(() => setErrorMsg(""), 4000);
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

        try {
            setSaving(true);
            try {
                await axios.delete(`https://localhost:7102/api/DeviceModel/Delete/${item.deviceModelId}`, getHeaders());
            } catch {
                try {
                    await axios.delete(`https://localhost:7102/api/DeviceModel/${item.deviceModelId}`, getHeaders());
                } catch {
                    // Fallback
                }
            }
            setModels(prev => prev.map(m => m.deviceModelId === item.deviceModelId ? { ...m, isActive: false } : m));
            setDeleteModalItem(null);
        } catch (err) {
            console.error("Error deactivating model:", err);
            setErrorMsg(err.response?.data?.message || "Failed to deactivate model.");
            setDeleteModalItem(null);
            setTimeout(() => setErrorMsg(""), 4000);
        } finally {
            setSaving(false);
        }
    };

    const handleRestore = async (item) => {
        try {
            setSaving(true);
            try {
                await axios.put(`https://localhost:7102/api/DeviceModel/Restore/${item.deviceModelId}`, {}, getHeaders());
            } catch {
                try {
                    await axios.put(`https://localhost:7102/api/DeviceModel/ToggleStatus/${item.deviceModelId}`, {}, getHeaders());
                } catch {
                    // Fallback
                }
            }
            setModels(prev => prev.map(m => m.deviceModelId === item.deviceModelId ? { ...m, isActive: true } : m));
        } catch (err) {
            console.error("Error restoring model:", err);
            setErrorMsg("Failed to restore device model to Active.");
            setTimeout(() => setErrorMsg(""), 3500);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (item) => {
        const updatedStatus = !item.isActive;
        try {
            try {
                await axios.put(`https://localhost:7102/api/DeviceModel/ToggleStatus/${item.deviceModelId}`, {}, getHeaders());
            } catch {
                // Fallback
            }
            setModels(prev => prev.map(m => m.deviceModelId === item.deviceModelId ? { ...m, isActive: updatedStatus } : m));
        } catch (err) {
            console.error("Error toggling status:", err);
            setErrorMsg("Failed to change model status.");
            setTimeout(() => setErrorMsg(""), 3500);
        }
    };

    // Filter & Sort Logic
    const filteredModels = useMemo(() => {
        return models
            .filter(item => {
                const query = searchQuery.toLowerCase().trim();
                const matchesSearch =
                    (item.model || "").toLowerCase().includes(query) ||
                    (item.brand || "").toLowerCase().includes(query) ||
                    (item.modelNumber || "").toLowerCase().includes(query) ||
                    (item.categoryName || "").toLowerCase().includes(query) ||
                    (item.referenceMarketPrice !== undefined && String(item.referenceMarketPrice).includes(query));

                const matchesCat = categoryFilter === "all" || String(item.categoryId) === String(categoryFilter);
                const matchesStatus = statusFilter === "all" ? true :
                    statusFilter === "active" ? (item.isActive !== false) : (item.isActive === false);

                return matchesSearch && matchesCat && matchesStatus;
            })
            .sort((a, b) => {
                const priceA = parseFloat(a.referenceMarketPrice) || 0;
                const priceB = parseFloat(b.referenceMarketPrice) || 0;
                if (sortOrder === "high-to-low") return priceB - priceA;
                if (sortOrder === "low-to-high") return priceA - priceB;
                if (sortOrder === "name-asc") return (a.model || "").localeCompare(b.model || "");
                if (sortOrder === "newest") {
                    const dateA = new Date(a.updatedAt || a.createdAt || 0);
                    const dateB = new Date(b.updatedAt || b.createdAt || 0);
                    return dateB - dateA;
                }
                return 0;
            });
    }, [models, searchQuery, categoryFilter, statusFilter, sortOrder]);

    // KPI Calculations
    const totalModelsCount = models.length;
    const activeCount = models.filter(m => m.isActive !== false).length;
    const inactiveCount = models.filter(m => m.isActive === false).length;
    const avgPrice = models.length > 0
        ? (models.reduce((sum, p) => sum + (parseFloat(p.referenceMarketPrice) || 0), 0) / models.length).toFixed(0)
        : "0";
    const maxPrice = models.length > 0
        ? Math.max(...models.map(p => parseFloat(p.referenceMarketPrice) || 0))
        : 0;

    return (
        <div className="matprice-container manage-page">
            <Navbar />

            <main className="matprice-main admin-main-container">
                {/* Floating Glass Topbar Header */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <div className="command-brand">
                            <h1 style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <FiSmartphone style={{ color: "#059669" }} />
                                Device Model Price Master
                            </h1>
                        </div>
                        <p className="command-subtitle">Maintain standardized benchmark market prices (₹) and condition factor valuations for electronic models.</p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by brand, model name, model number, category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span className="search-shortcut">⌘K</span>
                        </div>

                        <div className="topbar-actions">
                            <button className="glass-btn notification-btn" title="Refresh Catalog" onClick={fetchData}>
                                <FiRefreshCw className={loading ? "spin-icon" : ""} />
                            </button>
                            <button className="glass-btn notification-btn" title="System Alerts">
                                <FiBell />
                                <span className="pulse-ping"></span>
                            </button>
                            <button className="btn-add-price" onClick={toggleAddForm}>
                                <FiPlus /> {showAddForm ? "Close Form" : "Add New Model Rate"}
                            </button>
                        </div>
                    </div>
                </header>

                {errorMsg && (
                    <div style={{ background: "#ffe4e6", border: "1px solid #fca5a5", color: "#9f1239", padding: "0.75rem 1.15rem", borderRadius: "12px", marginBottom: "1.1rem", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <FiAlertCircle /> {errorMsg}
                    </div>
                )}

                {/* KPI Cards Grid */}
                <div className="matprice-kpi-grid">
                    <div className="matprice-kpi-card">
                        <div className="matprice-kpi-icon kpi-icon--emerald">
                            <FiLayers />
                        </div>
                        <div>
                            <div className="matprice-kpi-val">{totalModelsCount}</div>
                            <div className="matprice-kpi-label">Total Master Models</div>
                        </div>
                    </div>

                    <div className="matprice-kpi-card">
                        <div className="matprice-kpi-icon kpi-icon--blue">
                            <FiCheckCircle />
                        </div>
                        <div>
                            <div className="matprice-kpi-val">{activeCount}</div>
                            <div className="matprice-kpi-label">Active Master Rates</div>
                        </div>
                    </div>

                    <div className="matprice-kpi-card">
                        <div className="matprice-kpi-icon kpi-icon--purple">
                            <FiTrendingUp />
                        </div>
                        <div>
                            <div className="matprice-kpi-val">₹{Number(avgPrice).toLocaleString()}</div>
                            <div className="matprice-kpi-label">Average Benchmark Price</div>
                        </div>
                    </div>

                    <div className="matprice-kpi-card">
                        <div className="matprice-kpi-icon kpi-icon--amber">
                            <FiDollarSign />
                        </div>
                        <div>
                            <div className="matprice-kpi-val">₹{maxPrice.toLocaleString()}</div>
                            <div className="matprice-kpi-label">Top Tier Flagship Rate</div>
                        </div>
                    </div>
                </div>

                {/* Add Device Model to Table Form (Collapsible Card) */}
                {showAddForm && (
                    <div className="matprice-add-card">
                        <div className="matprice-add-card-header">
                            <h3>
                                <FiPlus style={{ color: "#059669" }} />
                                Add Device Model Price to Table
                            </h3>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Input device model specifications and benchmark market value</span>
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

                        <form onSubmit={handleInlineSubmit} noValidate>
                            <div className="matprice-form-grid">
                                {/* Row 1: Category (1 col), Brand (1 col), Model Name (1 col), Reference Price (1 col) */}
                                <div className="matprice-form-group">
                                    <label>Category *</label>
                                    <select
                                        className={`matprice-form-input ${inlineErrors.categoryId ? "input-error" : ""}`}
                                        value={newRecord.categoryId}
                                        onChange={(e) => handleInlineFieldChange("categoryId", e.target.value)}
                                        required
                                    >
                                        <option value="">-- Select Category --</option>
                                        {categories.map(c => (
                                             <option key={c.categoryId} value={c.categoryId}>
                                                 {c.categoryName}
                                             </option>
                                         ))}
                                    </select>
                                    {inlineErrors.categoryId && (
                                        <span className="error-message"><FiAlertCircle /> {inlineErrors.categoryId}</span>
                                    )}
                                </div>

                                <div className="matprice-form-group">
                                    <label>Brand Name *</label>
                                    <input
                                        type="text"
                                        className={`matprice-form-input ${inlineErrors.brand ? "input-error" : ""}`}
                                        placeholder="e.g. Samsung, Apple, Dell"
                                        value={newRecord.brand}
                                        onChange={(e) => handleInlineFieldChange("brand", e.target.value)}
                                        required
                                    />
                                    {inlineErrors.brand && (
                                        <span className="error-message"><FiAlertCircle /> {inlineErrors.brand}</span>
                                    )}
                                </div>

                                <div className="matprice-form-group">
                                    <label>Model Name *</label>
                                    <input
                                        type="text"
                                        className={`matprice-form-input ${inlineErrors.model ? "input-error" : ""}`}
                                        placeholder="e.g. Galaxy S23, iPhone 14"
                                        value={newRecord.model}
                                        onChange={(e) => handleInlineFieldChange("model", e.target.value)}
                                        required
                                    />
                                    {inlineErrors.model && (
                                        <span className="error-message"><FiAlertCircle /> {inlineErrors.model}</span>
                                    )}
                                </div>

                                <div className="matprice-form-group">
                                    <label>Reference Market Price (₹) *</label>
                                    <input
                                        type="number"
                                        step="any"
                                        min="0"
                                        className={`matprice-form-input ${inlineErrors.referenceMarketPrice ? "input-error" : ""}`}
                                        placeholder="e.g. 35000"
                                        value={newRecord.referenceMarketPrice}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val !== "" && parseFloat(val) < 0) return;
                                            handleInlineFieldChange("referenceMarketPrice", val);
                                        }}
                                        required
                                    />
                                    {inlineErrors.referenceMarketPrice && (
                                        <span className="error-message"><FiAlertCircle /> {inlineErrors.referenceMarketPrice}</span>
                                    )}
                                </div>

                                {/* Row 2: Model Number, Weight, Condition %, Submit Button */}
                                <div className="matprice-form-group">
                                    <label>Model / Part Number (Optional)</label>
                                    <input
                                        type="text"
                                        className="matprice-form-input"
                                        placeholder="e.g. SM-S911B, A2890"
                                        value={newRecord.modelNumber}
                                        onChange={(e) => handleInlineFieldChange("modelNumber", e.target.value)}
                                    />
                                </div>

                                <div className="matprice-form-group">
                                    <label>Avg. Weight (kg)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        min="0"
                                        className={`matprice-form-input ${inlineErrors.weight ? "input-error" : ""}`}
                                        placeholder="e.g. 0.17 for phone, 1.4 for laptop"
                                        value={newRecord.weight}
                                        onChange={(e) => handleInlineFieldChange("weight", e.target.value)}
                                    />
                                    {inlineErrors.weight && (
                                        <span className="error-message"><FiAlertCircle /> {inlineErrors.weight}</span>
                                    )}
                                </div>

                                <div className="matprice-form-group">
                                    <label>Valuation Condition Benchmark</label>
                                    <select
                                        className="matprice-form-input"
                                        value={simulatedCondition}
                                        onChange={(e) => setSimulatedCondition(Number(e.target.value))}
                                    >
                                        <option value="80">80% Inspection Score (Standard)</option>
                                        <option value="90">90% Inspection Score (Excellent)</option>
                                        <option value="70">70% Inspection Score (Good)</option>
                                        <option value="50">50% Inspection Score (Fair)</option>
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
                            <h2 className="panel-title">Device Models &amp; Price Master Queue</h2>
                            <p className="panel-subtitle">Standardized benchmark valuations, condition matrix, and catalog inventory</p>
                        </div>

                        <div className="panel-actions" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                            {/* Filter Pill Group matching Manage_recyclingprocess */}
                            <div className="filter-pill-group">
                                <button
                                    type="button"
                                    className={`pill-btn ${statusFilter === "all" ? "pill-btn--active" : ""}`}
                                    onClick={() => setStatusFilter("all")}
                                >
                                    All ({models.length})
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
                                    Inactive ({inactiveCount})
                                </button>
                            </div>

                            <select
                                className="matprice-select"
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                style={{ height: "34px", padding: "0 2rem 0 0.85rem", borderRadius: "20px", fontSize: "0.775rem", fontWeight: 600 }}
                            >
                                <option value="all">All Categories</option>
                                {categories.map(c => (
                                    <option key={c.categoryId} value={String(c.categoryId)}>
                                        {c.categoryName}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="matprice-select"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                style={{ height: "34px", padding: "0 2rem 0 0.85rem", borderRadius: "20px", fontSize: "0.775rem", fontWeight: 600 }}
                            >
                                <option value="high-to-low">Price: High ➔ Low</option>
                                <option value="low-to-high">Price: Low ➔ High</option>
                                <option value="name-asc">Model: A ➔ Z</option>
                                <option value="newest">Recently Updated</option>
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

                {/* Material / Model Prices View (Table / Grid) */}
                {loading ? (
                    <div className="matprice-table-panel" style={{ textAlign: "center", padding: "3rem 0", color: "#64748b" }}>
                        Loading device model pricing master...
                    </div>
                ) : filteredModels.length === 0 ? (
                    <div className="matprice-table-panel" style={{ textAlign: "center", padding: "3rem 0", color: "#64748b" }}>
                        No device model records found matching your filters.
                    </div>
                ) : viewMode === "grid" ? (
                    /* Grid / Card View matching Material Prices */
                    <div className="matprice-grid-view">
                        {filteredModels.map((item) => {
                            const refPrice = parseFloat(item.referenceMarketPrice) || 0;
                            const adjustedVal = Math.round(refPrice * (simulatedCondition / 100));
                            const isActive = item.isActive !== false;

                            return (
                                <div className="matprice-card-item" key={item.deviceModelId}>
                                    <div className="matprice-card-header">
                                        <div>
                                            <h4 className="matprice-card-title">{item.brand} {item.model}</h4>
                                            <span className="matprice-card-id">ID #{item.deviceModelId} &bull; {item.categoryName || "Device"}</span>
                                        </div>
                                        <span
                                            className={`matprice-status-pill ${isActive ? "status-pill--active" : "status-pill--inactive"}`}
                                            style={{ cursor: "pointer" }}
                                            onClick={() => handleToggleStatus(item)}
                                            title="Click to toggle status"
                                        >
                                            {isActive ? <FiCheckCircle /> : <FiXCircle />}
                                            {isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>

                                    <div className="matprice-card-body">
                                        <div className="matprice-card-rate">
                                            <span className="rate-label">Reference Market Price (100%)</span>
                                            <span className="rate-value">₹{refPrice.toLocaleString()}</span>
                                        </div>

                                        <div className="matprice-card-meta">
                                            <div className="meta-row">
                                                <span className="meta-label">
                                                    Tech Valuation (Grade {simulatedCondition >= 90 ? "A" : simulatedCondition >= 75 ? "B" : simulatedCondition >= 60 ? "C" : "D"} • {simulatedCondition}%):
                                                </span>
                                                <span className="matprice-rate-cell" style={{ fontSize: "0.95rem", color: "#047857" }}>
                                                    ₹{adjustedVal.toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="meta-row" style={{ marginTop: "0.5rem" }}>
                                                <span className="meta-label">Model / Specs:</span>
                                                <span className="meta-value">
                                                    {item.modelNumber ? `${item.modelNumber} • ` : ""}{item.weight ? `${item.weight} kg` : "Standard Weight"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="matprice-card-footer">
                                        <button className="btn-card-action edit" onClick={() => handleOpenEditModal(item)}>
                                            <FiEdit2 /> Edit Price
                                        </button>
                                        {isActive ? (
                                            <button className="btn-card-action danger" onClick={() => handleDelete(item)}>
                                                <FiTrash2 /> Delete
                                            </button>
                                        ) : (
                                            <button className="btn-card-action restore" onClick={() => handleRestore(item)} title="Restore Model to Active">
                                                <FiRotateCcw /> Restore
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Table View matching Material Prices */
                    <div className="matprice-table-panel">
                        <table className="matprice-table">
                            <thead>
                                <tr>
                                    <th>Device Model Details</th>
                                    <th>Category</th>
                                    <th>Model / Part No.</th>
                                    <th>Avg. Weight</th>
                                    <th>Reference Market Price</th>
                                    <th>
                                        Technician Inspection Valuation
                                        <small style={{ display: "block", fontSize: "0.72rem", color: "#059669", fontWeight: 700 }}>
                                            {simulatedCondition === 100
                                                ? "(100% Benchmark)"
                                                : `(Grade ${simulatedCondition >= 90 ? "A" : simulatedCondition >= 75 ? "B" : simulatedCondition >= 60 ? "C" : "D"} • ${simulatedCondition}% Inspection)`}
                                        </small>
                                    </th>
                                    <th>Status</th>
                                    <th>Last Updated</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredModels.map((item) => {
                                    const refPrice = parseFloat(item.referenceMarketPrice) || 0;
                                    const adjustedVal = Math.round(refPrice * (simulatedCondition / 100));
                                    const isActive = item.isActive !== false;

                                    return (
                                        <tr key={item.deviceModelId}>
                                            <td>
                                                <div className="matprice-material-name">{item.brand} {item.model}</div>
                                                <div className="matprice-card-id">ID #{item.deviceModelId}</div>
                                            </td>
                                            <td>
                                                <span className="matprice-handling-tag handling-tag--standard">
                                                    <FiLayers /> {item.categoryName || "General Device"}
                                                </span>
                                            </td>
                                            <td>
                                                <code style={{ background: "#f1f5f9", padding: "0.2rem 0.45rem", borderRadius: "6px", fontSize: "0.82rem", color: "#334155" }}>
                                                    {item.modelNumber || "N/A"}
                                                </code>
                                            </td>
                                            <td style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>
                                                {item.weight !== null && item.weight !== undefined ? `${item.weight} kg` : "—"}
                                            </td>
                                            <td>
                                                <span className="matprice-rate-cell">₹{refPrice.toLocaleString()}</span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                    <span className="matprice-rate-cell" style={{ color: "#047857", background: "rgba(16, 185, 129, 0.1)", padding: "0.25rem 0.55rem", borderRadius: "8px", fontWeight: 800 }}>
                                                        ₹{adjustedVal.toLocaleString()}
                                                    </span>
                                                    <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>
                                                        Based on Tech Inspection
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className={`matprice-status-pill ${isActive ? "status-pill--active" : "status-pill--inactive"}`}
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => handleToggleStatus(item)}
                                                    title="Click to toggle status"
                                                >
                                                    {isActive ? <FiCheckCircle /> : <FiXCircle />}
                                                    {isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                                    <FiCalendar />
                                                    {item.updatedAt
                                                        ? new Date(item.updatedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
                                                        : "Default"}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="matprice-actions" style={{ justifyContent: "flex-end" }}>
                                                    <button
                                                        className="btn-icon-action edit"
                                                        onClick={() => handleOpenEditModal(item)}
                                                        title="Edit Benchmark Market Price"
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                    {isActive ? (
                                                        <button
                                                            className="btn-icon-action danger"
                                                            onClick={() => handleDelete(item)}
                                                            title="Delete / Deactivate Model"
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="btn-icon-action restore"
                                                            onClick={() => handleRestore(item)}
                                                            title="Restore Model to Active"
                                                        >
                                                            <FiRotateCcw />
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

                {/* Edit Modal matching Material Prices */}
                {showModal && (
                    <div className="matprice-modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="matprice-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="matprice-modal-header">
                                <h3>{editingItem ? `Update Benchmark Price — ${editingItem.brand} ${editingItem.model}` : "Add New Device Model"}</h3>
                                <button className="matprice-modal-close" onClick={() => setShowModal(false)}>
                                    <FiX />
                                </button>
                            </div>

                            <form onSubmit={handleSave} noValidate>
                                <div className="matprice-form-group">
                                    <label>Device Category *</label>
                                    <select
                                        className={`matprice-form-input ${modalErrors.categoryId ? "input-error" : ""}`}
                                        value={formData.categoryId}
                                        onChange={(e) => handleModalFieldChange("categoryId", e.target.value)}
                                        required
                                    >
                                        <option value="">-- Select Category --</option>
                                        {categories.map(c => (
                                            <option key={c.categoryId} value={c.categoryId}>
                                                {c.categoryName}
                                            </option>
                                        ))}
                                    </select>
                                    {modalErrors.categoryId && (
                                        <span className="error-message"><FiAlertCircle /> {modalErrors.categoryId}</span>
                                    )}
                                </div>

                                <div className="matprice-form-row">
                                    <div className="matprice-form-group">
                                        <label>Brand Name *</label>
                                        <input
                                            type="text"
                                            className={`matprice-form-input ${modalErrors.brand ? "input-error" : ""}`}
                                            placeholder="e.g. Samsung, Apple, Dell"
                                            value={formData.brand}
                                            onChange={(e) => handleModalFieldChange("brand", e.target.value)}
                                            required
                                        />
                                        {modalErrors.brand && (
                                            <span className="error-message"><FiAlertCircle /> {modalErrors.brand}</span>
                                        )}
                                    </div>

                                    <div className="matprice-form-group">
                                        <label>Model Name *</label>
                                        <input
                                            type="text"
                                            className={`matprice-form-input ${modalErrors.model ? "input-error" : ""}`}
                                            placeholder="e.g. Galaxy S23, iPhone 14"
                                            value={formData.model}
                                            onChange={(e) => handleModalFieldChange("model", e.target.value)}
                                            required
                                        />
                                        {modalErrors.model && (
                                            <span className="error-message"><FiAlertCircle /> {modalErrors.model}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="matprice-form-group">
                                    <label>Reference Market Price (₹) *</label>
                                    <input
                                        type="number"
                                        step="any"
                                        min="0"
                                        className={`matprice-form-input ${modalErrors.referenceMarketPrice ? "input-error" : ""}`}
                                        placeholder="e.g. 35000"
                                        value={formData.referenceMarketPrice}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val !== "" && parseFloat(val) < 0) return;
                                            handleModalFieldChange("referenceMarketPrice", val);
                                        }}
                                        required
                                    />
                                    {modalErrors.referenceMarketPrice && (
                                        <span className="error-message"><FiAlertCircle /> {modalErrors.referenceMarketPrice}</span>
                                    )}
                                </div>

                                <div className="matprice-form-row">
                                    <div className="matprice-form-group">
                                        <label>Model / Part Number</label>
                                        <input
                                            type="text"
                                            className="matprice-form-input"
                                            placeholder="e.g. SM-S911B"
                                            value={formData.modelNumber}
                                            onChange={(e) => handleModalFieldChange("modelNumber", e.target.value)}
                                        />
                                    </div>
                                    <div className="matprice-form-group">
                                        <label>Avg. Weight (kg)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            min="0"
                                            className={`matprice-form-input ${modalErrors.weight ? "input-error" : ""}`}
                                            placeholder="e.g. 0.17"
                                            value={formData.weight}
                                            onChange={(e) => handleModalFieldChange("weight", e.target.value)}
                                        />
                                        {modalErrors.weight && (
                                            <span className="error-message"><FiAlertCircle /> {modalErrors.weight}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="matprice-modal-footer">
                                    <button type="button" className="btn-modal-cancel" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-modal-submit" disabled={saving}>
                                        <FiSave /> {saving ? "Saving..." : editingItem ? "Update Benchmark Price" : "Save Model"}
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
                                <h3>Deactivate Device Model</h3>
                                <button className="matprice-modal-close" onClick={() => setDeleteModalItem(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <div style={{ padding: "0.85rem 0 1.5rem 0", color: "#334155", fontSize: "0.95rem", fontWeight: 600 }}>
                                Are you sure you want to deactivate <strong>"{deleteModalItem.brand} {deleteModalItem.model}"</strong>? Its status will be set to Inactive.
                            </div>

                            <div className="matprice-modal-footer">
                                <button type="button" className="btn-modal-cancel" onClick={() => setDeleteModalItem(null)}>
                                    Cancel
                                </button>
                                <button type="button" className="btn-modal-danger" onClick={confirmDelete} disabled={saving}>
                                    {saving ? "Deactivating..." : "Deactivate"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default ManageModelPrices;
