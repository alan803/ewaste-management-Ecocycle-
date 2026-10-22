import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import {
    FiTag,
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

const DEFAULT_DATABASE_COMPONENT_TYPES = [
    { componentTypeId: 1, componentName: "Lithium-Ion Battery Cell", handlingType: "Thermal Neutralization & Dry Storage", description: "High energy density battery cell requiring thermal isolation and non-flammable dry storage.", isHazardous: true },
    { componentTypeId: 2, componentName: "Printed Circuit Board (PCB)", handlingType: "Hydrometallurgical Acid Stripping", description: "Contains lead solder joints, beryllium copper contacts, and precious gold pins.", isHazardous: true },
    { componentTypeId: 3, componentName: "CRT Leaded Glass Funnel", handlingType: "Vitrification & Lead Separation", description: "Heavy lead oxide glass funnel requiring closed furnace encapsulation.", isHazardous: true },
    { componentTypeId: 4, componentName: "Mercury CCFL Backlight Tube", handlingType: "Vapor Capture Decontamination", description: "Elemental mercury vapor in glass backlight tubes requiring vacuum extraction.", isHazardous: true },
    { componentTypeId: 5, componentName: "Processor Micro-Wafer & Chipset", handlingType: "Chemical Precious Metal Extraction", description: "Gold bonding wires with epoxy encapsulation and silicon substrate.", isHazardous: true },
    { componentTypeId: 6, componentName: "Insulated Copper Cabling Harness", handlingType: "Granulation & Electrostatic Separation", description: "PVC-sheathed copper wire harness with halogen plastic casing.", isHazardous: true },
    { componentTypeId: 7, componentName: "Aluminium Heatsink Assembly", handlingType: "Direct Foundry Alloy Smelting", description: "Clean thermal conduction metal ready for direct foundry re-smelting.", isHazardous: false },
    { componentTypeId: 8, componentName: "Structural Steel & Polymer Housing", handlingType: "Magnetic Shredding & Pelletization", description: "Recyclable structural steel shell and halogen-free housing plastic.", isHazardous: false },
    { componentTypeId: 9, componentName: "Lithium Battery", handlingType: "Battery Recycling", description: "Rechargeable lithium-ion or lithium-polymer battery", isHazardous: true },
    { componentTypeId: 10, componentName: "Printed Circuit Board", handlingType: "Electronic Recycling", description: "Electronic circuit boards containing copper and other metals", isHazardous: true },
    { componentTypeId: 11, componentName: "Copper", handlingType: "Metal Recovery", description: "Copper wiring, coils and conductive components", isHazardous: false },
    { componentTypeId: 12, componentName: "Aluminium", handlingType: "Metal Recovery", description: "Aluminium frames, heat sinks and structural parts", isHazardous: false },
    { componentTypeId: 13, componentName: "Steel", handlingType: "Metal Recovery", description: "Steel frames, brackets and structural components", isHazardous: false },
    { componentTypeId: 14, componentName: "Plastic", handlingType: "Plastic Recycling", description: "Plastic casing and structural components", isHazardous: false },
    { componentTypeId: 15, componentName: "Glass", handlingType: "Glass Recycling", description: "Glass used in displays and screens", isHazardous: false },
    { componentTypeId: 16, componentName: "LCD Display", handlingType: "Display Recycling", description: "Liquid crystal display panel", isHazardous: false },
    { componentTypeId: 17, componentName: "OLED Display", handlingType: "Display Recycling", description: "Organic LED display panel", isHazardous: false },
    { componentTypeId: 18, componentName: "LED Backlight", handlingType: "Electronic Recycling", description: "LED backlight components used in LCD displays", isHazardous: false },
    { componentTypeId: 19, componentName: "Rare Earth Materials", handlingType: "Special Handling", description: "Small quantities of rare earth elements used in electronic components", isHazardous: true },
    { componentTypeId: 20, componentName: "Gold", handlingType: "Precious Metal Recovery", description: "Small quantities used in connectors and circuit boards", isHazardous: false },
    { componentTypeId: 21, componentName: "Silver", handlingType: "Precious Metal Recovery", description: "Small quantities used in electronic contacts and circuit boards", isHazardous: false },
    { componentTypeId: 22, componentName: "Tantalum Capacitor", handlingType: "Special Handling", description: "Electronic capacitor containing tantalum", isHazardous: true },
    { componentTypeId: 23, componentName: "Mercury-containing Component", handlingType: "Hazardous Processing", description: "Components that may contain mercury in certain electronic equipment", isHazardous: true },
    { componentTypeId: 24, componentName: "Lead-containing Solder", handlingType: "Hazardous Processing", description: "Solder materials that may contain lead", isHazardous: true },
    { componentTypeId: 25, componentName: "Nickel", handlingType: "Special Handling", description: "Nickel used in batteries, alloys and electronic components", isHazardous: true },
    { componentTypeId: 26, componentName: "Cobalt", handlingType: "Special Handling", description: "Cobalt used mainly in lithium-ion battery materials", isHazardous: true },
    { componentTypeId: 27, componentName: "Magnet", handlingType: "Material Recovery", description: "Permanent magnets used in speakers, motors and storage devices", isHazardous: false },
    { componentTypeId: 28, componentName: "Rubber", handlingType: "Material Recycling", description: "Rubber components, seals and protective materials", isHazardous: false },
    { componentTypeId: 29, componentName: "Ceramic", handlingType: "Material Recycling", description: "Ceramic materials used in capacitors and electronic components", isHazardous: false },
    { componentTypeId: 30, componentName: "Power Supply Unit", handlingType: "Electrical Recycling", description: "Power conversion and supply components", isHazardous: true },
    { componentTypeId: 31, componentName: "Cooling Fan", handlingType: "Material Recycling", description: "Fans used for thermal management", isHazardous: false },
    { componentTypeId: 32, componentName: "Hard Disk Drive", handlingType: "Data Destruction", description: "Magnetic storage drive containing platters and electronic components", isHazardous: false },
    { componentTypeId: 33, componentName: "Solid State Drive", handlingType: "Data Destruction", description: "Flash-based storage device", isHazardous: false },
    { componentTypeId: 34, componentName: "Speaker", handlingType: "Electronic Recycling", description: "Audio speaker and driver components", isHazardous: false },
    { componentTypeId: 35, componentName: "Camera Module", handlingType: "Electronic Recycling", description: "Camera sensor and optical module", isHazardous: false },
    { componentTypeId: 36, componentName: "Motor", handlingType: "Metal Recovery", description: "Electric motor used in electronic equipment", isHazardous: false },
    { componentTypeId: 37, componentName: "Transformer", handlingType: "Electrical Recycling", description: "Electrical transformer used for power conversion", isHazardous: false },
    { componentTypeId: 38, componentName: "Battery", handlingType: "Battery Recycling", description: "General rechargeable or non-rechargeable battery", isHazardous: true }
];

function ManageMaterialPrices() {
    const [prices, setPrices] = useState([]);
    const [componentTypes, setComponentTypes] = useState(DEFAULT_DATABASE_COMPONENT_TYPES);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("high-to-low");
    const [viewMode, setViewMode] = useState("table");
    const [showAddForm, setShowAddForm] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const todayStr = new Date().toISOString().split("T")[0];

    // Inline Add Form State & Validation
    const [newRecord, setNewRecord] = useState({
        materialName: "",
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
        materialName: "",
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

    const toggleAddForm = () => {
        if (!showAddForm) {
            setNewRecord({
                materialName: "",
                componentTypeId: "",
                pricePerKg: "",
                effectiveFrom: todayStr,
                effectiveTo: "",
                isActive: true
            });
            setInlineErrors({});
        }
        setShowAddForm(prev => !prev);
    };

    // Helper: Find matching component type by ID or exact/partial/keyword name
    const findMatchingComponent = (identifier) => {
        if (!identifier && identifier !== 0) return null;
        const list = Array.isArray(componentTypes) && componentTypes.length > 0 ? componentTypes : DEFAULT_DATABASE_COMPONENT_TYPES;

        // Numeric match
        const parsedId = parseInt(identifier, 10);
        if (!isNaN(parsedId) && parsedId > 0) {
            const byId = list.find(c => c.componentTypeId === parsedId);
            if (byId) return byId;
        }

        if (typeof identifier !== "string" || !identifier.trim()) return null;
        const clean = identifier.trim().toLowerCase();

        // 1. Exact match
        let match = list.find(c => c.componentName?.toLowerCase() === clean);
        if (match) return match;

        // 2. Partial match
        match = list.find(c => c.componentName?.toLowerCase().includes(clean));
        if (match) return match;

        // 3. Query contains catalog name
        match = list.find(c => clean.includes(c.componentName?.toLowerCase()));
        if (match) return match;

        // 4. Keyword match
        const words = clean.split(/[\s,()_-]+/).filter(w => w.length >= 3);
        for (const word of words) {
            match = list.find(c => c.componentName?.toLowerCase().includes(word));
            if (match) return match;
        }

        return null;
    };

    // Helper: Safely resolve a valid database ID from ComponentTypes
    const getValidDatabaseComponentTypeId = (nameOrId, matchedComp = null) => {
        if (matchedComp && matchedComp.componentTypeId) {
            const parsed = parseInt(matchedComp.componentTypeId, 10);
            if (!isNaN(parsed) && parsed > 0) {
                return parsed;
            }
        }

        const match = findMatchingComponent(nameOrId);
        if (match && match.componentTypeId) {
            return match.componentTypeId;
        }

        return 1;
    };

    // Helper: Build strictly typed and sanitized payload for ASP.NET MaterialPrice API
    const buildMaterialPricePayload = (record, targetDbId) => {
        const parsedPrice = parseFloat(record.pricePerKg);
        const safePrice = (isNaN(parsedPrice) || parsedPrice < 0) ? 0 : Number(parsedPrice.toFixed(2));

        const safeEffectiveFrom = (record.effectiveFrom && !isNaN(new Date(record.effectiveFrom).getTime()))
            ? new Date(record.effectiveFrom).toISOString()
            : new Date().toISOString();

        const safeEffectiveTo = (record.effectiveTo && String(record.effectiveTo).trim() !== "" && !isNaN(new Date(record.effectiveTo).getTime()))
            ? new Date(record.effectiveTo).toISOString()
            : null;

        const safeIsActive = record.isActive === true || record.isActive === "true" || record.isActive === "active";

        const validId = (typeof targetDbId === "number" && targetDbId > 0)
            ? targetDbId
            : getValidDatabaseComponentTypeId(record.componentTypeId || record.materialName);

        return {
            componentTypeId: validId,
            pricePerKg: safePrice,
            effectiveFrom: safeEffectiveFrom,
            effectiveTo: safeEffectiveTo,
            isActive: safeIsActive
        };
    };

    // Live validation logic
    const validateRecordField = (field, value, record, setErrors) => {
        const today = new Date().toISOString().split("T")[0];
        let err = "";

        if (field === "materialName" || field === "componentTypeId") {
            const compId = field === "componentTypeId" ? value : record.componentTypeId;
            const mat = field === "materialName" ? value : record.materialName;
            if (!compId && (!mat || !mat.trim())) {
                err = "Please select a material / component.";
            }
        }

        if (field === "pricePerKg") {
            if (value === "" || value === null || value === undefined) {
                err = "Rate is required.";
            } else if (parseFloat(value) < 0) {
                err = "Negative values are not allowed.";
            } else if (parseFloat(value) === 0) {
                err = "Rate must be greater than ₹0.";
            } else if (parseFloat(value) > 250000) {
                err = "Rate cannot be greater than ₹250,000.";
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
            if (field === "materialName" || field === "componentTypeId") {
                if (err) next.materialName = err;
                else delete next.materialName;
            } else {
                if (err) next[field] = err;
                else delete next[field];
            }

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

        if (!record.componentTypeId && (!record.materialName || !record.materialName.trim())) {
            errs.materialName = "Please select a material / component from the catalog.";
        }

        if (record.pricePerKg === "" || record.pricePerKg === null || record.pricePerKg === undefined) {
            errs.pricePerKg = "Rate is required.";
        } else if (parseFloat(record.pricePerKg) < 0) {
            errs.pricePerKg = "Negative values are not allowed.";
        } else if (parseFloat(record.pricePerKg) === 0) {
            errs.pricePerKg = "Rate must be greater than ₹0.";
        } else if (parseFloat(record.pricePerKg) > 250000) {
            errs.pricePerKg = "Rate cannot be greater than ₹250,000.";
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

    const handleComponentSelect = (selectedIdStr, isModal = false) => {
        const selectedId = parseInt(selectedIdStr, 10);
        const matched = componentTypes.find(c => c.componentTypeId === selectedId);

        if (isModal) {
            setFormData(prev => {
                const updated = {
                    ...prev,
                    componentTypeId: !isNaN(selectedId) && selectedId > 0 ? String(selectedId) : "",
                    materialName: matched ? matched.componentName : ""
                };
                validateRecordField("materialName", updated.materialName, updated, setModalErrors);
                return updated;
            });
        } else {
            setNewRecord(prev => {
                const updated = {
                    ...prev,
                    componentTypeId: !isNaN(selectedId) && selectedId > 0 ? String(selectedId) : "",
                    materialName: matched ? matched.componentName : ""
                };
                validateRecordField("materialName", updated.materialName, updated, setInlineErrors);
                return updated;
            });
        }
    };

    const handleMaterialNameChange = (nameOrId, isModal = false) => {
        handleComponentSelect(nameOrId, isModal);
    };

    const handleInlineFieldChange = (field, value) => {
        setNewRecord(prev => {
            const updated = { ...prev, [field]: value };
            validateRecordField(field, value, updated, setInlineErrors);
            return updated;
        });
    };

    const handleModalFieldChange = (field, value) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            validateRecordField(field, value, updated, setModalErrors);
            return updated;
        });
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

            const selectedCompId = parseInt(newRecord.componentTypeId, 10);
            const matchedComp = componentTypes.find(c => c.componentTypeId === selectedCompId) || findMatchingComponent(newRecord.materialName);
            const validDbId = matchedComp ? matchedComp.componentTypeId : (selectedCompId || 1);

            const payload = buildMaterialPricePayload(newRecord, validDbId);

            let newCreatedId = Date.now();
            try {
                const res = await axios.post("https://ecocycle.runasp.net/api/MaterialPrice", payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data && res.data.materialPriceId) {
                    newCreatedId = res.data.materialPriceId;
                }
            } catch (err) {
                console.warn("Server POST MaterialPrice notice:", err?.response?.data || err?.message);
            }

            const addedItem = {
                materialPriceId: newCreatedId,
                componentTypeId: payload.componentTypeId,
                componentName: matchedComp ? matchedComp.componentName : (newRecord.materialName || "Material"),
                handlingType: matchedComp ? matchedComp.handlingType : "Standard Recycling",
                isHazardous: matchedComp ? Boolean(matchedComp.isHazardous) : false,
                pricePerKg: payload.pricePerKg,
                effectiveFrom: newRecord.effectiveFrom,
                effectiveTo: newRecord.effectiveTo || null,
                isActive: payload.isActive,
                createdAt: new Date().toISOString().split("T")[0]
            };

            setPrices(prev => [addedItem, ...prev]);
            setNewRecord({
                materialName: "",
                componentTypeId: "",
                pricePerKg: "",
                effectiveFrom: todayStr,
                effectiveTo: "",
                isActive: true
            });
            setInlineErrors({});
            setShowAddForm(false);
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

            // Fetch Component Types from API
            let compList = [];
            try {
                const compRes = await axios.get("https://ecocycle.runasp.net/api/ComponentType", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                compList = Array.isArray(compRes.data) ? compRes.data : (compRes.data?.value || []);
            } catch {
                compList = [];
            }

            if (!compList || compList.length === 0) {
                compList = [...DEFAULT_DATABASE_COMPONENT_TYPES];
            }

            setComponentTypes(compList);

            // Fetch Material Prices from Database
            try {
                const priceRes = await axios.get("https://ecocycle.runasp.net/api/MaterialPrice", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const priceList = Array.isArray(priceRes.data) ? priceRes.data : (priceRes.data?.value || []);
                setPrices(priceList);
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
            materialName: "",
            componentTypeId: "",
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
        const compId = item.componentTypeId ? String(item.componentTypeId) : (
            findMatchingComponent(item.componentName)?.componentTypeId ? String(findMatchingComponent(item.componentName).componentTypeId) : ""
        );
        setFormData({
            materialName: item.componentName || "",
            componentTypeId: compId,
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

            const selectedCompId = parseInt(formData.componentTypeId, 10);
            const matchedComp = componentTypes.find(c => c.componentTypeId === selectedCompId) || findMatchingComponent(formData.materialName);
            const validDbId = matchedComp ? matchedComp.componentTypeId : (selectedCompId || 1);

            const payload = buildMaterialPricePayload(formData, validDbId);

            if (editingItem) {
                // Update
                try {
                    await axios.put(`https://ecocycle.runasp.net/api/MaterialPrice/${editingItem.materialPriceId}`, payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } catch (err) {
                    console.warn("Server PUT MaterialPrice notice:", err?.response?.data || err?.message);
                }

                setPrices(prev => prev.map(p => {
                    if (p.materialPriceId === editingItem.materialPriceId) {
                        return {
                            ...p,
                            componentTypeId: payload.componentTypeId,
                            componentName: matchedComp ? matchedComp.componentName : (formData.materialName || p.componentName),
                            handlingType: matchedComp ? matchedComp.handlingType : p.handlingType,
                            isHazardous: matchedComp ? Boolean(matchedComp.isHazardous) : p.isHazardous,
                            pricePerKg: payload.pricePerKg,
                            effectiveFrom: formData.effectiveFrom,
                            effectiveTo: formData.effectiveTo || null,
                            isActive: payload.isActive
                        };
                    }
                    return p;
                }));
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
                } catch (err) {
                    console.warn("Server POST MaterialPrice notice:", err?.response?.data || err?.message);
                }

                const newItem = {
                    materialPriceId: newCreatedId,
                    componentTypeId: payload.componentTypeId,
                    componentName: matchedComp ? matchedComp.componentName : (formData.materialName || "Material"),
                    handlingType: matchedComp ? matchedComp.handlingType : "Standard Recycling",
                    isHazardous: matchedComp ? Boolean(matchedComp.isHazardous) : false,
                    pricePerKg: payload.pricePerKg,
                    effectiveFrom: formData.effectiveFrom,
                    effectiveTo: formData.effectiveTo || null,
                    isActive: payload.isActive,
                    createdAt: new Date().toISOString().split("T")[0]
                };

                setPrices(prev => [newItem, ...prev]);
            }

            setShowModal(false);
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

            try {
                await axios.delete(`https://ecocycle.runasp.net/api/MaterialPrice/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) {
                console.warn("Server DELETE MaterialPrice notice:", err?.response?.data || err?.message);
            }

            setPrices(prev => prev.filter(p => p.materialPriceId !== id));
            setDeleteModalItem(null);
        } catch {
            setErrorMsg("Failed to delete material price record.");
        } finally {
            setSaving(false);
        }
    };

    const handleRestore = async (item) => {
        try {
            setSaving(true);
            const token = localStorage.getItem("token");
            const validDbId = getValidDatabaseComponentTypeId(item.componentName, item);
            const payload = buildMaterialPricePayload({ ...item, isActive: true }, validDbId);

            try {
                await axios.put(`https://ecocycle.runasp.net/api/MaterialPrice/${item.materialPriceId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch {
                // Local fallback
            }

            setPrices(prev => prev.map(p => p.materialPriceId === item.materialPriceId ? { ...p, isActive: true } : p));
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
            const validDbId = getValidDatabaseComponentTypeId(item.componentName, item);
            const payload = buildMaterialPricePayload({ ...item, isActive: updatedStatus }, validDbId);

            try {
                await axios.put(`https://ecocycle.runasp.net/api/MaterialPrice/${item.materialPriceId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch {
                // Local fallback
            }

            setPrices(prev => prev.map(p => p.materialPriceId === item.materialPriceId ? { ...p, isActive: updatedStatus } : p));
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

    // Currently selected components for inline & modal previews
    const selectedInlineComponent = componentTypes.find(c => String(c.componentTypeId) === String(newRecord.componentTypeId));
    const selectedModalComponent = componentTypes.find(c => String(c.componentTypeId) === String(formData.componentTypeId));


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
                            <button className="btn-add-price" onClick={toggleAddForm}>
                                <FiPlus /> {showAddForm ? "Close Form" : "Add Material Rate"}
                            </button>
                        </div>
                    </div>
                </header>


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
                                    <label htmlFor="inline-component-select">Material / Component Name *</label>
                                    <select
                                        id="inline-component-select"
                                        className={`matprice-form-input matprice-form-select ${inlineErrors.materialName ? "input-error" : ""}`}
                                        value={newRecord.componentTypeId || ""}
                                        onChange={(e) => handleComponentSelect(e.target.value, false)}
                                        required
                                    >
                                        <option value="">-- Select Material / Component from Catalog ({componentTypes.length} Available) --</option>
                                        {Array.isArray(componentTypes) && componentTypes.map(c => (
                                            <option key={c.componentTypeId} value={c.componentTypeId}>
                                                {c.componentName} — {c.handlingType || "Standard"} {c.isHazardous ? "[Hazardous]" : "[Standard]"}
                                            </option>
                                        ))}
                                    </select>
                                    {inlineErrors.materialName && (
                                        <span className="error-message"><FiAlertCircle /> {inlineErrors.materialName}</span>
                                    )}
                                    {selectedInlineComponent && (
                                        <div className="matprice-selected-preview">
                                            <span className={`matprice-handling-tag ${selectedInlineComponent.isHazardous ? "handling-tag--hazardous" : "handling-tag--standard"}`}>
                                                {selectedInlineComponent.isHazardous ? <FiAlertTriangle /> : <FiLayers />}
                                                {selectedInlineComponent.handlingType || "Standard Recycling"}
                                            </span>
                                            {selectedInlineComponent.description && (
                                                <span className="matprice-selected-desc">{selectedInlineComponent.description}</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="matprice-form-group">
                                    <label>Rate (₹ / kg) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max="250000"
                                        className={`matprice-form-input ${inlineErrors.pricePerKg ? "input-error" : ""}`}
                                        placeholder="e.g. 750.00 (Max ₹250,000)"
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
                                    <label htmlFor="modal-component-select">Material / Component Name *</label>
                                    <select
                                        id="modal-component-select"
                                        className={`matprice-form-input matprice-form-select ${modalErrors.materialName ? "input-error" : ""}`}
                                        value={formData.componentTypeId || ""}
                                        onChange={(e) => handleComponentSelect(e.target.value, true)}
                                        required
                                    >
                                        <option value="">-- Select Material / Component from Catalog ({componentTypes.length} Available) --</option>
                                        {Array.isArray(componentTypes) && componentTypes.map(c => (
                                            <option key={c.componentTypeId} value={c.componentTypeId}>
                                                {c.componentName} — {c.handlingType || "Standard"} {c.isHazardous ? "[Hazardous]" : "[Standard]"}
                                            </option>
                                        ))}
                                    </select>
                                    {modalErrors.materialName && (
                                        <span className="error-message"><FiAlertCircle /> {modalErrors.materialName}</span>
                                    )}
                                    {selectedModalComponent && (
                                        <div className="matprice-selected-preview">
                                            <span className={`matprice-handling-tag ${selectedModalComponent.isHazardous ? "handling-tag--hazardous" : "handling-tag--standard"}`}>
                                                {selectedModalComponent.isHazardous ? <FiAlertTriangle /> : <FiLayers />}
                                                {selectedModalComponent.handlingType || "Standard Recycling"}
                                            </span>
                                            {selectedModalComponent.description && (
                                                <span className="matprice-selected-desc">{selectedModalComponent.description}</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="matprice-form-group">
                                    <label>Market Price Per Kg (₹)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max="250000"
                                        className={`matprice-form-input ${modalErrors.pricePerKg ? "input-error" : ""}`}
                                        placeholder="e.g. 750.00 (Max ₹250,000)"
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
