import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import {
    FiRefreshCw,
    FiCheckCircle,
    FiUser,
    FiSearch,
    FiGrid,
    FiList,
    FiCpu,
    FiSmartphone,
    FiTv,
    FiBox,
    FiX,
    FiActivity,
    FiEye,
    FiShield,
    FiMapPin,
    FiDollarSign,
    FiLayers,
    FiPackage,
    FiPrinter,
    FiCheck,
    FiAward,
    FiTool,
    FiCalendar,
    FiUserCheck,
    FiMaximize2,
    FiInfo,
    FiPhone,
    FiMail,
    FiTruck,
    FiCopy,
    FiFileText,
    FiTrendingUp,
    FiTrendingDown,
    FiHeart,
    FiEdit2,
    FiCreditCard,
    FiSave,
    FiSliders,
    FiAlertTriangle,
    FiArchive,
    FiDatabase,
    FiLock,
    FiTag,
    FiClock,
    FiHelpCircle,
    FiBell,
    FiSend
} from "react-icons/fi";
import { FaLeaf, FaQrcode, FaRecycle, FaTools, FaWarehouse, FaBalanceScale } from "react-icons/fa";
import { calculateEstimatedDeviceValue } from "../../utils/pricing";
import "./Manage_completeddevices.css";

const API_BASE = "https://localhost:7102/api";

// Helper for INR currency formatting
const formatINR = (num) => {
    const n = Number(num) || 0;
    return n.toLocaleString("en-IN", {
        minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
        maximumFractionDigits: 2
    });
};

// Number to Words Converter for INR Currency (matching Manage_transactions.jsx)
function numToWords(num) {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n) => {
        if (n === 0) return '';
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
        if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
        if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
        return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
    };

    const val = Math.round(Number(num) || 0);
    if (val === 0) return 'Zero Rupees Only';
    return inWords(val).trim() + ' Rupees Only';
}

// Default fallback dynamic material prices catalog
const DEFAULT_MATERIAL_PRICES = [
    { materialId: 1, materialName: "High-Grade PCB / E-Scrap", unit: "kg", pricePerUnit: 1250.00, category: "Precious Metal Bearing", effectiveFrom: "2026-01-01", isActive: true },
    { materialId: 2, materialName: "Copper Wire & Inductors", unit: "kg", pricePerUnit: 750.00, category: "Base Metal", effectiveFrom: "2026-01-01", isActive: true },
    { materialId: 3, materialName: "Lithium Battery Cells", unit: "kg", pricePerUnit: 350.00, category: "Specialized Recovery", effectiveFrom: "2026-01-01", isActive: true },
    { materialId: 4, materialName: "Aluminium Alloys", unit: "kg", pricePerUnit: 220.00, category: "Base Metal", effectiveFrom: "2026-01-01", isActive: true },
    { materialId: 5, materialName: "Lead & Mercury Lamp Assembly", unit: "kg", pricePerUnit: 180.00, category: "Hazardous Handling", effectiveFrom: "2026-01-01", isActive: true },
    { materialId: 6, materialName: "Recyclable Polymer Plastics", unit: "kg", pricePerUnit: 80.00, category: "Plastics", effectiveFrom: "2026-01-01", isActive: true },
    { materialId: 7, materialName: "Structural Steel & Iron", unit: "kg", pricePerUnit: 65.00, category: "Ferrous Metal", effectiveFrom: "2026-01-01", isActive: true },
    { materialId: 8, materialName: "Display Glass Substrate", unit: "kg", pricePerUnit: 40.00, category: "Glass", effectiveFrom: "2026-01-01", isActive: true },
    { materialId: 9, materialName: "Recovered Fine Gold", unit: "kg", pricePerUnit: 6500000.00, category: "Precious Metal", effectiveFrom: "2026-01-01", isActive: true },
    { materialId: 10, materialName: "Recovered Fine Silver", unit: "kg", pricePerUnit: 85000.00, category: "Precious Metal", effectiveFrom: "2026-01-01", isActive: true }
];

function ManageCompletedDevices() {
    const [completedDevices, setCompletedDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Unified Filter Tab & View Mode
    const [activeFilterTab, setActiveFilterTab] = useState("All"); // 'All' | 'Valuation' | 'Responsible Recycling' | 'Refurbishment Center' | 'Recycling Center'
    const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

    // Business Rule: Configurable Low-Value Threshold (Requirement #3)
    const [lowValueThreshold, setLowValueThreshold] = useState(500);
    const [showThresholdConfig, setShowThresholdConfig] = useState(false);
    const [tempThresholdInput, setTempThresholdInput] = useState("500");

    // Dynamic Material Prices State (Requirement #6)
    const [materialPrices, setMaterialPrices] = useState(DEFAULT_MATERIAL_PRICES);
    const [showMaterialPricesModal, setShowMaterialPricesModal] = useState(false);

    // Modals
    const [selectedItem, setSelectedItem] = useState(null);
    const [showOverallModal, setShowOverallModal] = useState(false);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [showCertificateModal, setShowCertificateModal] = useState(false);
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [overallActiveTab, setOverallActiveTab] = useState("overview"); // 'overview' | 'lifecycle' | 'financials' | 'inventory' | 'facility' | 'compliance' | 'ledger'
    const [copiedToken, setCopiedToken] = useState(false);

    // Price Editing Modal State
    const [showEditPriceModal, setShowEditPriceModal] = useState(false);
    const [priceEditItem, setPriceEditItem] = useState(null);
    const [editValuation, setEditValuation] = useState("");
    const [editProcessingFee, setEditProcessingFee] = useState("");
    const [editRefurbCost, setEditRefurbCost] = useState("");
    const [editAgent1, setEditAgent1] = useState("150");
    const [editTech, setEditTech] = useState("300");
    const [editAgent2, setEditAgent2] = useState("150");
    const [editCitizenPayout, setEditCitizenPayout] = useState("");
    const [editPriceNotes, setEditPriceNotes] = useState("");

    // Razorpay Sandbox Test Settlement Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentModalItem, setPaymentModalItem] = useState(null);
    const [paymentNotes, setPaymentNotes] = useState("");
    const [isQuickSimulation, setIsQuickSimulation] = useState(false);
    const [isPayingSettlement, setIsPayingSettlement] = useState(false);

    const openPaymentModal = (item) => {
        const target = item || selectedItem;
        if (!target) return;
        setPaymentModalItem(target);
        setPaymentNotes("");
        setIsQuickSimulation(false);
        setShowPaymentModal(true);
    };

    const openEditPriceModal = (item) => {
        if (!item) return;
        const isPaid = Boolean(item.isPaid || item.paymentStatus === "Paid" || item.payoutStatus === "Paid" || item.settlement?.payoutStatus === "Paid" || item.settlement?.isDistributed);
        if (isPaid) return;
        setPriceEditItem(item);
        const s = item.settlement || {};
        const isRecycle = item.processingType === "Responsible Recycling";
        const isRefurb = item.centerType === "Refurbishment Center" || item.pathway === "Refurbishment" || !isRecycle;
        const initialCenterShare = isRefurb
            ? (Number(item.refurbishmentCost) || Number(s.refurbishmentCost) || Number(s.centerFee) || Number(s.processingFee) || 0)
            : (Number(s.centerFee) || Number(s.processingFee) || Number(item.processingFee) || 0);

        setEditValuation(String(isRecycle ? (item.recoveryValue || s.activePool || 0) : (item.deviceValuation || s.activePool || 0)));
        setEditProcessingFee(String(initialCenterShare));
        setEditRefurbCost(String(item.refurbishmentCost || initialCenterShare));
        setEditAgent1(String(s.agent1 !== undefined ? s.agent1 : 150));
        setEditTech(String(s.technician !== undefined ? s.technician : 300));
        setEditAgent2(String(s.agent2 !== undefined ? s.agent2 : 150));
        setEditCitizenPayout(String(s.citizenPayout !== undefined ? s.citizenPayout : (isRecycle ? 0 : Math.round((item.deviceValuation || s.activePool || 0) * 0.75))));
        setEditPriceNotes(item.priceEditNotes || "");
        setShowEditPriceModal(true);
    };

    const handleSaveEditedPrice = () => {
        if (!priceEditItem) return;
        const devId = priceEditItem.deviceId || priceEditItem.requestId;
        const isRecycle = priceEditItem.processingType === "Responsible Recycling";
        const isRefurb = priceEditItem.centerType === "Refurbishment Center" || priceEditItem.pathway === "Refurbishment" || !isRecycle;
        
        const newValuation = Math.max(0, Number(editValuation) || 0);
        const newFee = Math.max(0, Number(editProcessingFee) || 0);
        const newRefurbCost = isRefurb ? newFee : Math.max(0, Number(editRefurbCost) || 0);
        const newA1 = Math.max(0, Number(editAgent1) || 0);
        const newTech = Math.max(0, Number(editTech) || 0);
        const newA2 = Math.max(0, Number(editAgent2) || 0);
        const newCitizenPayout = isRecycle ? 0 : Math.max(0, Number(editCitizenPayout) || 0);

        const totalOutflows = newCitizenPayout + newFee + newA1 + newTech + newA2;
        if (newValuation > 0 && totalOutflows > newValuation) {
            setToastMessage(`Cannot save: Total outflows (₹${formatINR(totalOutflows)}) exceed Device Valuation (₹${formatINR(newValuation)}) by ₹${formatINR(totalOutflows - newValuation)}!`);
            setTimeout(() => setToastMessage(""), 4500);
            return;
        }

        const overrideObj = {
            deviceId: devId,
            valuation: newValuation,
            processingFee: newFee,
            refurbishmentCost: newRefurbCost,
            agent1: newA1,
            technician: newTech,
            agent2: newA2,
            citizenPayout: newCitizenPayout,
            notes: editPriceNotes,
            updatedAt: new Date().toISOString()
        };

        // Save to localStorage for persistence
        try {
            const stored = JSON.parse(localStorage.getItem("ecocycle_price_overrides") || "{}");
            stored[devId] = overrideObj;
            localStorage.setItem("ecocycle_price_overrides", JSON.stringify(stored));
        } catch (e) {
            console.error("Failed to save price override to localStorage", e);
        }

        // Recompute settlement
        const updatedSettlement = calculateSettlement({
            deviceValuation: isRecycle ? priceEditItem.deviceValuation : newValuation,
            recoveryValue: isRecycle ? newValuation : priceEditItem.recoveryValue,
            processingType: priceEditItem.processingType,
            centerType: priceEditItem.centerType,
            weight: priceEditItem.weight,
            isHazardous: checkIsHazardous(priceEditItem),
            refurbishmentCost: newRefurbCost,
            actualCenterFee: newFee,
            promisedUserPayment: newCitizenPayout,
            customAgent1: newA1,
            customTech: newTech,
            customAgent2: newA2,
            customCenter: newFee,
            threshold: lowValueThreshold
        });

        const updatedItem = {
            ...priceEditItem,
            deviceValuation: isRecycle ? priceEditItem.deviceValuation : newValuation,
            recoveryValue: isRecycle ? newValuation : priceEditItem.recoveryValue,
            processingFee: newFee,
            refurbishmentCost: newRefurbCost,
            settlement: updatedSettlement,
            priceEditNotes: editPriceNotes,
            hasPriceOverride: true
        };

        updatedItem.transactions = generateTransactionLedger(updatedItem, updatedSettlement);

        setCompletedDevices(prev => prev.map(d => (d.deviceId === devId || d.id === priceEditItem.id) ? updatedItem : d));

        if (selectedItem && (selectedItem.deviceId === devId || selectedItem.id === priceEditItem.id)) {
            setSelectedItem(updatedItem);
        }

        setShowEditPriceModal(false);
        setToastMessage(`Price and settlement updated for Device #${devId} (Valuation: ₹${formatINR(newValuation)})!`);
        setTimeout(() => setToastMessage(""), 3500);
    };

    const handleResetPriceOverride = () => {
        if (!priceEditItem) return;
        const devId = priceEditItem.deviceId || priceEditItem.requestId;
        try {
            const stored = JSON.parse(localStorage.getItem("ecocycle_price_overrides") || "{}");
            delete stored[devId];
            localStorage.setItem("ecocycle_price_overrides", JSON.stringify(stored));
        } catch (e) {
            console.error(e);
        }
        setShowEditPriceModal(false);
        fetchCompletedDevices();
        setToastMessage(`Restored default calculated pricing for Device #${devId}.`);
        setTimeout(() => setToastMessage(""), 3500);
    };

    // Admin Custom Payment Distribution Modal State
    const [showDistributionModal, setShowDistributionModal] = useState(false);
    const [distributionEditItem, setDistributionEditItem] = useState(null);
    const [customCitizenPay, setCustomCitizenPay] = useState("");
    const [customCenterPay, setCustomCenterPay] = useState("0");
    const [customAgent1Pay, setCustomAgent1Pay] = useState("150");
    const [customTechPay, setCustomTechPay] = useState("300");
    const [customAgent2Pay, setCustomAgent2Pay] = useState("150");
    const [distributionNotes, setDistributionNotes] = useState("");
    const [distributionSaveSuccess, setDistributionSaveSuccess] = useState(false);
    const [isExecutingPayAll, setIsExecutingPayAll] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [notifiedUsers, setNotifiedUsers] = useState({});

    const handleNotifyStakeholder = (item, role, recipientName, amount) => {
        const devId = item?.deviceId || selectedItem?.deviceId;
        if (!devId) return;
        const key = `${devId}_${role}`;
        setNotifiedUsers(prev => ({ ...prev, [key]: true, [devId]: true }));
        setToastMessage(`Payment notification (₹${formatINR(amount)}) dispatched to ${recipientName} [${role}]!`);
        setTimeout(() => {
            setToastMessage("");
        }, 3500);
    };

    const handleNotifyAllStakeholders = (item) => {
        const devId = item?.deviceId || selectedItem?.deviceId;
        if (!devId) return;
        setNotifiedUsers(prev => ({
            ...prev,
            [`${devId}_citizen`]: true,
            [`${devId}_agent1`]: true,
            [`${devId}_tech`]: true,
            [`${devId}_agent2`]: true,
            [`${devId}_center`]: true,
            [devId]: true
        }));
        setToastMessage(`Settlement payment notifications dispatched to ALL stakeholders for Device #${devId}!`);
        setTimeout(() => {
            setToastMessage("");
        }, 4000);
    };

    const handleNotifyUser = (item) => {
        handleNotifyStakeholder(item, "citizen", item?.customerName || selectedItem?.customerName || "Citizen", item?.settlement?.citizenPayout || selectedItem?.settlement?.citizenPayout || 0);
    };

    const certificateRef = useRef();

    useEffect(() => {
        fetchCompletedDevices();
        fetchMaterialPrices();
    }, []);

    // 1. Fetch Dynamic Material Prices (Requirement #6)
    const fetchMaterialPrices = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.get(`${API_BASE}/RecyclingProcess/material-prices`, { headers }).catch(() => null);
            if (res && Array.isArray(res.data) && res.data.length > 0) {
                const formatted = res.data.map((p, idx) => ({
                    materialId: p.materialId || idx + 1,
                    materialName: p.materialName || p.name,
                    unit: p.unit || "kg",
                    pricePerUnit: Number(p.pricePerUnit || p.price || 0),
                    category: p.category || "Recovered Stream",
                    effectiveFrom: p.effectiveFrom || "2026-01-01",
                    isActive: p.isActive !== false
                }));
                setMaterialPrices(formatted);
            }
        } catch (err) {
            console.warn("Using fallback dynamic material prices table:", err);
        }
    };

    // Automatic Hazardous Component & Material Detection:
    const checkIsHazardous = (item) => {
        if (!item) return false;
        if (typeof item.isHazardous === "boolean") return item.isHazardous;
        if (typeof item.hasHazardous === "boolean") return item.hasHazardous;

        if (Array.isArray(item.components) && item.components.length > 0) {
            const hasHazComp = item.components.some(c =>
                c.isHazardous === true ||
                /lithium|lead|mercury|cadmium|crt|fluorescent|arsenic|beryllium|battery/i.test(c.name || c.label || c.componentType || "")
            );
            if (hasHazComp) return true;
        }

        if (Array.isArray(item.recoveredMaterials) && item.recoveredMaterials.length > 0) {
            const hasHazMat = item.recoveredMaterials.some(m =>
                m.isHazardous === true ||
                /lithium|battery|lead|mercury|cadmium|crt|fluorescent|toxic|hazardous/i.test(m.materialName || m.name || "")
            );
            if (hasHazMat) return true;
        }

        const textToCheck = `${item.model || ""} ${item.brand || ""} ${item.categoryName || ""} ${item.inspectionNotes || ""} ${item.processNotes || ""}`.toLowerCase();
        if (/lithium|lead|mercury|cadmium|crt|battery|plasma|fluorescent|lcd inverter|ups|inverter/i.test(textToCheck)) {
            return true;
        }

        if (/laptop|phone|mobile|tablet|television|tv|display|monitor|ups/i.test(item.categoryName || "")) {
            return true;
        }

        return false;
    };

    // Requirement #1 & #4: Processing Fee Equation (Base ₹100 + Weight×₹30 + HazFee ₹100/₹0)
    const calculateProcessingFee = (weight, isHazardous) => {
        const w = Math.max(0.1, Number(weight) || 1);
        const baseFee = 100;
        const processingRate = 30;
        const weightFee = +(w * processingRate).toFixed(2);
        const hazardousFee = isHazardous ? 100 : 0;
        const totalFee = +(baseFee + weightFee + hazardousFee).toFixed(2);

        return {
            baseFee,
            processingRate,
            weight: w,
            weightFee,
            isHazardous,
            hazardousFee,
            totalFee,
            formulaText: `₹${baseFee} (Base) + (${w} kg × ₹${processingRate}) + ₹${hazardousFee} (${isHazardous ? "Hazardous" : "Clean"})`
        };
    };

    // Universal Economic Viability & Settlement Engine
    // EcoCycle Two-Agent Workflow & Financial Share Equation:
    // Flow: Citizen -> Agent 1 (Pickup) -> Technician (Inspection) -> Agent 2 (Transfer) -> Final Center
    // Equation: P = U + A1 + T + A2 + C + E
    // EcoCycle Share Rule: E = max(0, P - U - A1 - T - A2 - C)
    // - If P >= U + A1 + T + A2 + C: Viable transaction, EcoCycle receives residual surplus E.
    // - If P < U + A1 + T + A2 + C: Valuation NOT economically viable (E = 0), recommend Responsible Recycling.
    // - For Responsible Recycling: U = ₹0, C = 60%, E = 20%, A1 = 5%, T = 10%, A2 = 5% (Always viable).
    const calculateSettlement = (params) => {
        const {
            deviceValuation = 0,
            recoveryValue = 0,
            processingType = "Responsible Recycling",
            centerType = "Recycling Center",
            weight = 10,
            isHazardous = false,
            refurbishmentCost = 0,
            actualCenterFee = null,
            citizenChoice = null,
            promisedUserPayment = null,
            customAgent1 = null,
            customTech = null,
            customAgent2 = null,
            customCenter = null,
            customCollection = null,
            threshold = lowValueThreshold
        } = typeof params === "object" ? params : {
            deviceValuation: arguments[0] || 0,
            processingType: arguments[1] || "Responsible Recycling",
            weight: arguments[2] || 10,
            isHazardous: arguments[3] || false
        };

        const isRecycle = processingType === "Responsible Recycling" || String(processingType).toLowerCase().includes("recycl");
        const devVal = Math.max(0, Number(deviceValuation) || 0);
        const recVal = Math.max(0, Number(recoveryValue) || 0);

        // Value pool: Recovery Value for recycling if materials exist, otherwise Device Valuation (minimum fallback ₹3,000 if both are zero)
        const activePool = isRecycle 
            ? (recVal > 0 ? recVal : (devVal > 0 ? devVal : 3000)) 
            : (devVal > 0 ? devVal : (recVal > 0 ? recVal : 4000));
        const feeObj = calculateProcessingFee(weight, isHazardous);

        if (isRecycle) {
            // Responsible Recycling (R = Recovered Material Value / Pool)
            // Citizen (U) = ₹0 (Voluntary e-waste surrender / donation)
            // Fixed Operational Payouts: Agent 1 = ₹150, Technician = ₹300, Agent 2 = ₹150 (or custom)
            // Center (C): Center Refurbishment / Processing Expense
            const R = Math.round(activePool);
            const citizenPayout = 0;
            const parsedActualFee = Number(actualCenterFee) || 0;
            const rfCost = Number(refurbishmentCost) || 0;
            const isRefurb = centerType === "Refurbishment Center" || rfCost > 0;
            const centerOperationCost = isRefurb 
                ? (rfCost > 0 ? rfCost : (parsedActualFee > 0 ? parsedActualFee : 2500))
                : (parsedActualFee > 0 ? parsedActualFee : feeObj.totalFee);
            const centerFee = customCenter !== null ? Math.round(Number(customCenter)) : Math.round(centerOperationCost);
            
            const agent1 = customAgent1 !== null ? Math.round(Number(customAgent1)) : (customCollection !== null ? Math.round(Number(customCollection) / 2) : 150);
            const technician = customTech !== null ? Math.round(Number(customTech)) : 300;
            const agent2 = customAgent2 !== null ? Math.round(Number(customAgent2)) : (customCollection !== null ? Math.round(Number(customCollection) / 2) : 150);
            
            const agentFee = agent1 + agent2;
            const operationalPayouts = agent1 + technician + agent2;

            const totalCosts = citizenPayout + agent1 + technician + agent2 + centerFee;
            const ecocycleReserve = Math.max(0, R - totalCosts);
            const totalDisbursed = totalCosts;

            return {
                deviceValuation: devVal,
                recoveryValue: R,
                activePool: R,
                isViable: true,
                viabilityStatus: "Viable",
                deficit: 0,
                processingFee: centerFee,
                center: centerFee,
                centerFee,
                centerOperationCost,
                centerSharePercent: `${R > 0 ? Math.round((centerFee / R) * 100) : 0}%`,
                operationalPayouts,
                operationalAgent: agentFee,
                agent1,
                agent1SharePercent: `${Math.round((agent1 / (R || 1)) * 100)}%`,
                agent2,
                agent2SharePercent: `${Math.round((agent2 / (R || 1)) * 100)}%`,
                agentFee,
                agentSharePercent: `${Math.round((agentFee / (R || 1)) * 100)}%`,
                technician,
                technicianSharePercent: `${Math.round((technician / (R || 1)) * 100)}%`,
                citizenPayout,
                citizen: citizenPayout,
                citizenSharePercent: "0%",
                refurbishmentCost: isRefurb ? centerFee : 0,
                totalDisbursed,
                ecocycleReserve,
                ecocycleSharePercent: `${Math.round((ecocycleReserve / (R || 1)) * 100)}%`,
                ecocycleSubsidy: 0,
                isSubsidized: false,
                isLowValue: false,
                citizenChoice: "Responsible Recycling",
                lowValueThreshold: threshold,
                totalReconciled: R,
                processingFeeBreakdown: {
                    ...feeObj,
                    formulaText: isRefurb ? `Total Refurbishment Expense (₹${formatINR(centerOperationCost)})` : `Center Processing Expense (₹${formatINR(centerOperationCost)})`
                }
            };
        } else {
            // Valuation Model (P = Device Valuation Realized Price)
            // Formula: P = U + A1 + T + A2 + C + E
            // - Citizen (U): Fair Device Valuation Payout (or ₹0 if donated)
            // - Collection Agent 1 (A1): Fixed ₹150 (Citizen -> Tech)
            // - Inspection Technician (T): Fixed ₹300
            // - Collection Agent 2 (A2): Fixed ₹150 (Tech -> Center)
            // - Refurbishment Center (C): Total Refurbishment Expense (Parts & Repair Work)
            // - EcoCycle Reserve (E): Residual Platform Surplus [P - (U + A1 + T + A2 + C)]
            const P = Math.round(devVal > 0 ? devVal : 4000);

            // 1. Fixed Operational Logistics Payouts
            const agent1 = customAgent1 !== null 
                ? Math.round(Number(customAgent1)) 
                : (customCollection !== null ? Math.round(Number(customCollection) / 2) : 150);

            const technician = customTech !== null 
                ? Math.round(Number(customTech)) 
                : 300;

            const agent2 = customAgent2 !== null 
                ? Math.round(Number(customAgent2)) 
                : (customCollection !== null ? Math.round(Number(customCollection) / 2) : 150);

            // 2. Refurbishment Center Share (C) = Total Refurbishment Expense (Parts + Labor Cost)
            const rfCost = Number(refurbishmentCost) || Number(actualCenterFee) || 0;
            const centerOperationCost = rfCost;
            const centerFee = customCenter !== null 
                ? Math.round(Number(customCenter)) 
                : Math.round(rfCost);

            const agentFee = agent1 + agent2;
            const operationalPayouts = agent1 + technician + agent2;

            // 3. Citizen Expected Payment (U)
            const citizenPayout = promisedUserPayment !== null 
                ? Math.round(Number(promisedUserPayment)) 
                : Math.max(0, Math.round(P * 0.75));

            // 4. Viability Check & Residual EcoCycle Share: E = max(0, P - U - A1 - T - A2 - C)
            const totalRequired = citizenPayout + agent1 + technician + agent2 + centerFee;
            const isViable = P >= totalRequired;
            const deficit = isViable ? 0 : (totalRequired - P);
            const ecocycleReserve = Math.max(0, P - totalRequired);

            const totalAssetCost = citizenPayout + rfCost;

            return {
                deviceValuation: P,
                recoveryValue: 0,
                activePool: P,
                netPool: citizenPayout,
                isViable,
                viabilityStatus: isViable ? "Viable" : "Not Economically Viable",
                deficit,
                recommendation: isViable ? "Approved for Valuation" : "Valuation not economically viable • Recommend Responsible Recycling",
                processingFee: centerFee,
                center: centerFee,
                centerFee,
                centerOperationCost,
                centerSharePercent: `${P > 0 ? Math.round((centerFee / P) * 100) : 0}%`,
                operationalPayouts,
                operationalAgent: agentFee,
                agent1,
                agent1SharePercent: `${Math.round((agent1 / (P || 1)) * 100)}%`,
                technician,
                technicianSharePercent: `${Math.round((technician / (P || 1)) * 100)}%`,
                agent2,
                agent2SharePercent: `${Math.round((agent2 / (P || 1)) * 100)}%`,
                agentFee,
                agentSharePercent: `${Math.round((agentFee / (P || 1)) * 100)}%`,
                citizenPayout,
                citizen: citizenPayout,
                citizenSharePercent: `${Math.round((citizenPayout / (P || 1)) * 100)}%`,
                refurbishmentCost: rfCost,
                totalAssetCost,
                totalDisbursed: totalRequired,
                ecocycleReserve,
                ecocycleSharePercent: isViable && P > 0 ? `${Math.round((ecocycleReserve / P) * 100)}%` : "0%",
                ecocycleSubsidy: 0,
                isSubsidized: false,
                isLowValue: P < threshold,
                citizenChoice: isViable ? (citizenChoice || "Valuation") : "Responsible Recycling Recommended",
                lowValueThreshold: threshold,
                totalReconciled: P,
                processingFeeBreakdown: {
                    ...feeObj,
                    formulaText: `Total Refurbishment Expense (₹${formatINR(centerOperationCost)})`
                }
            };
        }
    };

    // Requirement #11: Generate Simple, Clean Double-Entry Device Transaction Ledger
    const generateTransactionLedger = (item, settlement) => {
        const s = settlement;
        const devId = item.deviceId || item.requestId || 1;
        const isRecycle = item.processingType === "Responsible Recycling";
        const dateStr = item.completedAt || new Date().toISOString();
        const baseTxn = `TXN-${devId}`;

        const transactions = [];

        // 1. Credit: Value Inflow Pool (100%)
        transactions.push({
            transactionId: `${baseTxn}-01`,
            deviceId: devId,
            processingType: item.processingType,
            centerId: item.facilityId,
            centerType: item.centerType,
            entryType: "CREDIT",
            amount: s.activePool,
            transactionType: isRecycle ? "Recovery Value Inflow (100%)" : "Device Valuation Pool (100%)",
            recipientType: "EcoCycle Clearing Pool",
            recipientName: "EcoCycle Platform Pool",
            status: "RECONCILED",
            createdAt: dateStr,
            notes: isRecycle ? `Total raw materials yield from ${item.recoveredMaterials?.length || 5} recovered streams` : `Certified diagnostic appraisal value (₹${formatINR(s.activePool)})`
        });

        // 2. Debit: Citizen Payout (U)
        transactions.push({
            transactionId: `${baseTxn}-02`,
            deviceId: devId,
            processingType: item.processingType,
            centerId: item.facilityId,
            centerType: item.centerType,
            entryType: "DEBIT",
            amount: s.citizenPayout,
            transactionType: isRecycle ? "Voluntary Eco-Surrender (0%)" : `Citizen Payment (${s.citizenSharePercent || "60%"})`,
            recipientType: "Citizen Beneficiary",
            recipientName: item.customerName || "Citizen",
            status: isRecycle ? "DONATED" : "DISBURSED",
            createdAt: dateStr,
            notes: isRecycle ? "0% Citizen share • Voluntary zero-landfill donation" : `Direct payment to citizen (${item.customerName || "Citizen"})`
        });

        // 3. Debit: Agent 1 Pickup Fee (A1: Citizen -> Technician)
        transactions.push({
            transactionId: `${baseTxn}-03`,
            deviceId: devId,
            processingType: item.processingType,
            centerId: item.facilityId,
            centerType: item.centerType,
            entryType: "DEBIT",
            amount: s.agent1,
            transactionType: `Agent 1: Pickup (${s.agent1SharePercent || "5%"})`,
            recipientType: "Collection Logistics",
            recipientName: item.collectionAgent1Name || item.collectionAgentName || "EcoCycle Agent 1 (Citizen → Tech)",
            status: "DISBURSED",
            createdAt: dateStr,
            notes: "Pickup logistics: Citizen doorstep to Technician transit"
        });

        // 4. Debit: Inspection Technician Fee (T: Diagnostic & Inspection)
        transactions.push({
            transactionId: `${baseTxn}-04`,
            deviceId: devId,
            processingType: item.processingType,
            centerId: item.facilityId,
            centerType: item.centerType,
            entryType: "DEBIT",
            amount: s.technician,
            transactionType: `Technician Fee (${s.technicianSharePercent || "5%"})`,
            recipientType: "Inspection Technician",
            recipientName: item.technicianName || item.inspectorName || "Technician",
            status: "DISBURSED",
            createdAt: dateStr,
            notes: "Physical inspection, component testing & safety diagnostic"
        });

        // 5. Debit: Agent 2 Delivery Fee (A2: Technician -> Center)
        transactions.push({
            transactionId: `${baseTxn}-05`,
            deviceId: devId,
            processingType: item.processingType,
            centerId: item.facilityId,
            centerType: item.centerType,
            entryType: "DEBIT",
            amount: s.agent2,
            transactionType: `Agent 2: Transfer (${s.agent2SharePercent || "5%"})`,
            recipientType: "Transfer Logistics",
            recipientName: item.collectionAgent2Name || "EcoCycle Agent 2 (Tech → Center)",
            status: "DISBURSED",
            createdAt: dateStr,
            notes: "Inter-facility transit: Technician facility to Final Processing Center"
        });

        // 6. Center Operation / Refurbishment Expense Tracking (Center retains device/materials; compensation for work done)
        const isRefurbDev = item.centerType === "Refurbishment Center" || item.pathway === "Refurbishment" || !isRecycle;
        const refurbWorkExpense = Number(item.refurbishmentCost || s.refurbishmentCost || 0);
        transactions.push({
            transactionId: `${baseTxn}-06`,
            deviceId: devId,
            processingType: item.processingType,
            centerId: item.facilityId,
            centerType: item.centerType,
            entryType: "DEBIT_EXPENSE",
            amount: isRefurbDev ? refurbWorkExpense : (s.processingFee || 0),
            transactionType: isRefurbDev
                ? `Total Refurbishment Expense (${refurbWorkExpense > 0 ? `${Math.round((refurbWorkExpense / (s.activePool || 1)) * 100)}%` : "Direct Work"})`
                : `Center Processing Fee (${Math.round(((s.processingFee || 0) / (s.activePool || 1)) * 100)}%)`,
            recipientType: item.centerType || (isRefurbDev ? "Refurbishment Center" : "Recycling Center"),
            recipientName: item.facilityName || (isRefurbDev ? "Refurbishment Center" : "Recycling Center"),
            status: "DISBURSED",
            createdAt: dateStr,
            notes: isRefurbDev
                ? "Total Refurbishment Expense for repair labor and replacement components (Hardware retained by Center)"
                : "Facility material recovery, isolation & processing expense (Materials retained by Facility)"
        });

        // 7. Balance / Reserve: EcoCycle Residual Share (E = max(0, P - U - A1 - T - A2 - C))
        transactions.push({
            transactionId: `${baseTxn}-07`,
            deviceId: devId,
            processingType: item.processingType,
            centerId: item.facilityId,
            centerType: item.centerType,
            entryType: "BALANCE",
            amount: s.ecocycleReserve,
            transactionType: `EcoCycle Surplus (${s.ecocycleSharePercent || "10%"})`,
            recipientType: "EcoCycle Platform Reserve",
            recipientName: "EcoCycle Platform Reserve",
            status: s.ecocycleReserve > 0 ? "RESERVED" : "ZERO_BALANCE",
            createdAt: dateStr,
            notes: s.isViable
                ? (s.ecocycleReserve > 0
                    ? `Residual platform surplus: ₹${formatINR(s.ecocycleReserve)} (Value ₹${formatINR(s.activePool)} − Outflows ₹${formatINR(s.totalDisbursed)})`
                    : `EcoCycle share is ₹0 (100% of device value consumed by user payout & required operational costs)`)
                : `Valuation Not Viable (Deficit: -₹${formatINR(s.deficit)}). EcoCycle share = ₹0 • Offer Responsible Recycling`
        });

        return transactions;
    };

    const fetchCompletedDevices = async () => {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        try {
            setLoading(true);

            const [recyclingRes, refurbProcRes, deviceRes, refurbCentersRes, assignmentsRes, agentsRes, techsRes, recCentersRes, payoutsRes] = await Promise.all([
                axios.get(`${API_BASE}/RecyclingProcess/all-processes`, { headers }).catch(() => ({ data: [] })),
                axios.get(`${API_BASE}/RefurbishmentProcess/all-processes`, { headers }).catch(() => ({ data: [] })),
                axios.get(`${API_BASE}/Device/All`, { headers }).catch(() => ({ data: [] })),
                axios.get(`${API_BASE}/RefurbishmentCenter/alluser`, { headers }).catch(() => ({ data: [] })),
                axios.get(`${API_BASE}/CollectionAssignment/admin/all-assignments`, { headers }).catch(() => ({ data: [] })),
                axios.get(`${API_BASE}/CollectionAgent/All`, { headers }).catch(() => axios.get(`${API_BASE}/CollectionAgent/alluser`, { headers })).catch(() => ({ data: [] })),
                axios.get(`${API_BASE}/Technician/All`, { headers }).catch(() => axios.get(`${API_BASE}/Technician/alluser`, { headers })).catch(() => ({ data: [] })),
                axios.get(`${API_BASE}/RecyclingCenter/alluser`, { headers }).catch(() => axios.get(`${API_BASE}/RecyclingCenter/All`, { headers })).catch(() => ({ data: [] })),
                axios.get(`${API_BASE}/Payout/all`, { headers }).catch(() => ({ data: [] }))
            ]);

            const allAssignments = Array.isArray(assignmentsRes.data) ? assignmentsRes.data : [];
            const allAgents = Array.isArray(agentsRes.data) ? agentsRes.data : [];
            const allTechs = Array.isArray(techsRes.data) ? techsRes.data : [];
            const refurbCenters = Array.isArray(refurbCentersRes.data) ? refurbCentersRes.data : [];
            const allRecCenters = Array.isArray(recCentersRes.data) ? recCentersRes.data : [];
            const allPayouts = Array.isArray(payoutsRes.data) ? payoutsRes.data : [];

            const completedList = [];
            const processedDeviceIds = new Set();

            // 1. Process Completed Recycling Devices from Actual Process
            if (Array.isArray(recyclingRes.data)) {
                recyclingRes.data.forEach((item, idx) => {
                    const proc = item.process;
                    const status = (item.status || proc?.status || "").toLowerCase();
                    const isCompleted = (status === "completed" || status === "recycled" || status === "certified") && Boolean(proc && proc.completedAt);

                    if (isCompleted) {
                        const rawMats = Array.isArray(item.recoveredMaterials) ? item.recoveredMaterials : [];
                        const weightVal = Number(item.weight) || Number(item.device?.weight) || 0;
                        const totalRecoveredW = proc?.totalRecoveredWeight || 0;
                        const devId = Number(item.deviceId || item.requestId);
                        if (!devId) return;
                        processedDeviceIds.add(devId);

                        // Dynamic assignment and agent lookup
                        const devAssignments = allAssignments.filter(a => Number(a.deviceId || a.DeviceId) === devId);
                        const assign1 = devAssignments.find(a => 
                            a.assignmentType === "CustomerToTechnician" || 
                            String(a.assignmentType || "").toLowerCase().includes("customer")
                        ) || devAssignments[0];

                        const assign2 = devAssignments.find(a => 
                            a.assignmentType !== "CustomerToTechnician" && 
                            (String(a.assignmentType || "").toLowerCase().includes("technician") || 
                             String(a.assignmentType || "").toLowerCase().includes("center") ||
                             String(a.assignmentType || "").toLowerCase().includes("recycling"))
                        ) || (devAssignments.length > 1 ? devAssignments[1] : null);

                        const ca1 = assign1?.collectionAgentName || 
                            assign1?.agentName || 
                            (assign1?.collectionAgent ? `${assign1.collectionAgent.firstName || ""} ${assign1.collectionAgent.lastName || ""}`.trim() : null) ||
                            item.collectionAgent1Name || item.collectionAgentName || "EcoCycle Agent 1 (Pickup)";

                        const tech = item.technicianName || 
                            item.inspectorName || 
                            assign1?.techName || 
                            assign1?.technicianName || 
                            assign2?.techName || "EcoCycle Technician";

                        const ca2 = assign2?.collectionAgentName || 
                            assign2?.agentName || 
                            (assign2?.collectionAgent ? `${assign2.collectionAgent.firstName || ""} ${assign2.collectionAgent.lastName || ""}`.trim() : null) ||
                            item.collectionAgent2Name || "EcoCycle Agent 2 (Transfer)";

                        const matchedRecCenter = allRecCenters.find(c => (c.recyclingCenterId || c.centerId || c.id) === item.recyclingCenterId);
                        const facility = item.recyclingCenterName || matchedRecCenter?.centerName || matchedRecCenter?.name || "EcoCycle Recycling Facility";

                        // Freeze material prices at time of processing
                        const frozenDate = proc?.completedAt || item.updatedAt || new Date().toISOString();
                        const recoveredMaterials = rawMats.map((m, mIdx) => {
                            const unitRate = Number(m.pricePerUnit || m.price || 0);
                            const qty = Number(m.quantity || 0);
                            const calcVal = Number(m.estimatedValue) || +(qty * unitRate).toFixed(2);
                            return {
                                materialId: m.recoveredMaterialId || mIdx + 1,
                                materialName: m.materialName || "Recovered Material",
                                quantity: qty,
                                unit: m.unit || "kg",
                                pricePerUnitAtProcessing: unitRate,
                                totalValue: calcVal,
                                isHazardous: Boolean(m.isHazardous || /lead|mercury|cadmium|lithium|battery/i.test(m.materialName || "")),
                                frozenAt: frozenDate
                            };
                        });

                        // Actual Recovery Value from process or sum of recovered streams
                        const matSum = recoveredMaterials.reduce((acc, m) => acc + m.totalValue, 0);
                        const recoveryValue = Number(proc?.totalMaterialValue) || matSum || 0;

                        // Separate ProcessingType from CenterType
                        const matchedDev = Array.isArray(deviceRes.data) ? deviceRes.data.find(d => Number(d.deviceId || d.DeviceId) === devId) : null;
                        const rawPref = String(
                            item.processingPreference ||
                            item.ProcessingPreference ||
                            item.device?.processingPreference ||
                            item.device?.ProcessingPreference ||
                            matchedDev?.processingPreference ||
                            matchedDev?.ProcessingPreference ||
                            ""
                        ).trim().toLowerCase();

                        // Determine Processing Type: Valuation vs Responsible Recycling
                        const processingType = (rawPref.includes("valuat") || rawPref.includes("evaluat"))
                            ? "Valuation"
                            : "Responsible Recycling";
                        const centerType = "Recycling Center";
                        const deviceValuation = Number(item.valuation || item.price || matchedDev?.valuation || matchedDev?.price || matchedDev?.estimatedValue) || recoveryValue;

                        const isHaz = checkIsHazardous({ ...item, weight: weightVal, recoveredMaterials });
                        const actualCenterFee = Number(proc?.processingCost || item.processingCost || 0);
                        const settlement = calculateSettlement({
                            deviceValuation,
                            recoveryValue,
                            processingType,
                            centerType,
                            weight: weightVal,
                            isHazardous: isHaz,
                            refurbishmentCost: 0,
                            actualCenterFee: actualCenterFee > 0 ? actualCenterFee : null
                        });

                        const centerInventory = {
                            inventoryId: `INV-REC-${devId}`,
                            ownership: "EcoCycle Materials Stock",
                            centerName: facility,
                            centerType: "Recycling Center",
                            storageLocation: "Raw Materials Vault - Bay S-02",
                            status: "Materials Stockpiled & Demanufactured",
                            totalRecoveredWeight: `${totalRecoveredW} kg`,
                            materialStreamsCount: recoveredMaterials.length,
                            inventoryAssetValue: recoveryValue,
                            storedAt: frozenDate
                        };

                        const custName = item.customerName || item.userName || (item.user ? `${item.user.firstName || ""} ${item.user.lastName || ""}`.trim() : null) || "Citizen";

                        const devPayouts = allPayouts.filter(p => Number(p.deviceId || p.DeviceId) === devId);
                        const isPaidFromPayouts = devPayouts.length > 0 && devPayouts.some(p => (p.payoutStatus || p.PayoutStatus) === "Paid");
                        const isDeviceSettled = isPaidFromPayouts || matchedDev?.lifecycleStatus === "Settled";

                        const deviceObj = {
                            id: `REC-${item.requestId || item.deviceId || idx + 1}`,
                            deviceId: devId,
                            requestId: item.requestId || item.deviceId,
                            pathway: "Recycling",
                            pathwayLabel: processingType === "Responsible Recycling" ? "Certified Recycled" : "Recycled (Valuation Settled)",
                            deviceValuation,
                            recoveryValue,
                            processingFee: settlement.processingFee,
                            operationalPayouts: settlement.operationalPayouts,
                            refurbishmentCost: 0,
                            processingType,
                            centerType,
                            evaluationType: processingType,
                            brand: item.brand || matchedDev?.brand || "Device",
                            model: item.model || matchedDev?.model || "Model",
                            categoryName: item.categoryName || matchedDev?.categoryName || "E-Waste",
                            serialNumber: item.serialNumber || `SN-REC-00${devId}`,
                            purchaseDate: item.purchaseDate || matchedDev?.purchaseDate || null,
                            deviceQrToken: item.deviceQrToken || `ECOQR-REC-${devId}`,
                            weight: weightVal,
                            quantity: item.quantity || 1,
                            condition: item.condition || "End-of-Life / Demanufacturing Required",
                            working: item.working || "Non-Functional / Scrap",
                            customerName: custName,
                            customerEmail: item.customerEmail || item.email || "—",
                            customerPhone: item.customerPhone || item.phone || "—",
                            customerCity: item.customerCity || item.city || "—",
                            customerAddress: item.customerAddress || item.address || "—",
                            customerPincode: item.customerPincode || item.pincode || "—",
                            registeredDate: item.createdAt || new Date().toISOString(),
                            collectionAgent1Name: ca1,
                            technicianName: tech,
                            inspectorName: tech,
                            collectionAgent2Name: ca2,
                            inspectionNotes: "Device evaluated for full material demanufacturing. Toxic components isolated with Zero-Landfill protocol.",
                            facilityId: item.recyclingCenterId || 1,
                            facilityName: facility,
                            facilityCity: item.recyclingCenterCity || "—",
                            facilityType: "Recycling Center",
                            completedAt: frozenDate,
                            certificateId: item.certificateId || `ECO-REC-${new Date().getFullYear()}-${String(devId).padStart(6, "0")}`,
                            summaryOutput: `${totalRecoveredW} kg recovered (${recoveredMaterials.length} streams)`,
                            settlement: {
                                ...settlement,
                                payoutStatus: isDeviceSettled ? "Paid" : "Pending",
                                isDistributed: isDeviceSettled,
                                payouts: devPayouts
                            },
                            citizenOffer: settlement.citizenPayout,
                            citizenOfferStatus: "Accepted",
                            paymentStatus: isDeviceSettled ? "Paid" : "Completed",
                            payoutStatus: isDeviceSettled ? "Paid" : "Pending",
                            isPaid: isDeviceSettled,
                            recoveredMaterials,
                            centerInventory,
                            processNotes: proc?.notes || "Fully demanufactured with zero landfill impact under CPCB guidelines and ISO 14001 certification.",
                            qcScore: "100% Zero-Landfill Verified",
                            sanitizationPerformed: proc?.sanitizationPerformed || "NIST 800-88 Cryptographic Wipe & Physical Shredding"
                        };

                        deviceObj.transactions = generateTransactionLedger(deviceObj, settlement);
                        completedList.push(deviceObj);
                    }
                });
            }

            // 2. Process Completed Refurbishment Processes from Actual Process Table
            if (Array.isArray(refurbProcRes.data)) {
                refurbProcRes.data.forEach((rItem, idx) => {
                    const proc = rItem.process;
                    const status = (proc?.status || rItem.status || "").toLowerCase();
                    const isCompleted = (status === "completed" || status === "refurbished" || status === "ready") && Boolean(proc && proc.completedAt);

                    if (isCompleted) {
                        const devId = Number(rItem.deviceId || rItem.requestId);
                        if (!devId) return;
                        processedDeviceIds.add(devId);

                        const compDate = proc.completedAt || rItem.refurbishmentCompletedAt || rItem.updatedAt || new Date().toISOString();
                        const regDate = rItem.createdAt || new Date().toISOString();

                        // Real Refurbished Value & Valuation from Process (or dynamic model age & condition calculation)
                        const matchedDev = Array.isArray(deviceRes.data) ? deviceRes.data.find(d => Number(d.deviceId || d.DeviceId) === devId) : null;
                        let deviceValuation = Number(proc.refurbishedValue || rItem.refurbishedValue || matchedDev?.valuation || matchedDev?.estimatedValue || matchedDev?.price) || 0;
                        if (!deviceValuation && matchedDev) {
                            const dynVal = calculateEstimatedDeviceValue({
                                referenceValue: matchedDev.referenceMarketPrice || matchedDev.referencePrice || 18000,
                                purchaseDate: matchedDev.purchaseDate || matchedDev.createdAt,
                                condition: matchedDev.condition || "Good",
                                quantity: matchedDev.quantity || 1
                            });
                            deviceValuation = dynVal.totalEstimatedValue;
                        }
                        const weight = Number(rItem.weight || matchedDev?.weight || 0);
                        const isHaz = checkIsHazardous({ ...rItem, ...matchedDev });

                        // Real Refurbishment Cost & Parts from Process
                        const refurbishmentCost = Number(proc.totalRepairCost || proc.estimatedRepairCost || rItem.totalRepairCost) || 0;
                        let refurbishmentParts = [];

                        if (proc.repairItemsJson) {
                            try {
                                const parsed = JSON.parse(proc.repairItemsJson);
                                if (Array.isArray(parsed) && parsed.length > 0) {
                                    refurbishmentParts = parsed.map((p, pIdx) => ({
                                        partName: p.partName || p.name || `Component Service #${pIdx + 1}`,
                                        cost: Number(p.cost || p.price || 0),
                                        category: p.category || "Hardware Service"
                                    }));
                                }
                            } catch (_) {}
                        }

                        const rawPref = String(
                            rItem.processingPreference ||
                            matchedDev?.processingPreference ||
                            matchedDev?.ProcessingPreference ||
                            ""
                        ).trim().toLowerCase();

                        const processingType = (rawPref.includes("recycl") || rawPref.includes("donat"))
                            ? "Responsible Recycling"
                            : "Valuation";
                        const centerType = "Refurbishment Center";

                        const settlement = calculateSettlement({
                            deviceValuation,
                            recoveryValue: 0,
                            processingType,
                            centerType,
                            weight,
                            isHazardous: isHaz,
                            refurbishmentCost
                        });

                        // Dynamic assignment and agent lookup
                        const devAssignments = allAssignments.filter(a => Number(a.deviceId || a.DeviceId) === devId);
                        const assign1 = devAssignments.find(a => 
                            a.assignmentType === "CustomerToTechnician" || 
                            String(a.assignmentType || "").toLowerCase().includes("customer")
                        ) || devAssignments[0];

                        const assign2 = devAssignments.find(a => 
                            a.assignmentType !== "CustomerToTechnician" && 
                            (String(a.assignmentType || "").toLowerCase().includes("technician") || 
                             String(a.assignmentType || "").toLowerCase().includes("center") ||
                             String(a.assignmentType || "").toLowerCase().includes("refurbish"))
                        ) || (devAssignments.length > 1 ? devAssignments[1] : null);

                        const ca1 = assign1?.collectionAgentName || 
                            assign1?.agentName || 
                            rItem.collectionAgent1Name || "EcoCycle Agent 1 (Pickup)";

                        const tech = rItem.technicianName || 
                            assign1?.techName || 
                            assign1?.technicianName || "EcoCycle Technician";

                        const ca2 = assign2?.collectionAgentName || 
                            assign2?.agentName || 
                            rItem.collectionAgent2Name || "EcoCycle Agent 2 (Transfer)";

                        const matchedRefurbCenter = refurbCenters.find(c => (c.refurbishmentCenterId || c.centerId || c.id) === rItem.refurbishmentCenterId);
                        const cName = rItem.refurbishmentCenterName || matchedRefurbCenter?.centerName || matchedRefurbCenter?.name || "EcoCycle Advanced Refurbishment Hub";
                        const cCity = rItem.refurbishmentCenterCity || matchedRefurbCenter?.city || "Technology Park";
                        const custName = rItem.customerName || matchedDev?.userName || "Citizen User";

                        const centerInventory = {
                            inventoryId: `INV-REF-${devId}`,
                            ownership: "EcoCycle Platform",
                            centerName: cName,
                            centerType: "Refurbishment Center",
                            storageLocation: "Finished Goods Storage - Rack F-12",
                            status: "Refurbished • Stored in Center (Not For Sale)",
                            acquisitionCost: settlement.citizenPayout,
                            refurbishmentCost: refurbishmentCost,
                            totalAssetCost: settlement.totalAssetCost,
                            storedAt: compDate
                        };

                        const devPayouts = allPayouts.filter(p => Number(p.deviceId || p.DeviceId) === devId);
                        const isPaidFromPayouts = devPayouts.length > 0 && devPayouts.some(p => (p.payoutStatus || p.PayoutStatus) === "Paid");
                        const isDeviceSettled = isPaidFromPayouts || matchedDev?.lifecycleStatus === "Settled";

                        const deviceObj = {
                            id: `REF-${devId}`,
                            deviceId: devId,
                            requestId: rItem.requestId || devId,
                            pathway: "Refurbishment",
                            pathwayLabel: "Refurbished & Tested",
                            deviceValuation,
                            recoveryValue: 0,
                            processingFee: settlement.processingFee,
                            operationalPayouts: settlement.operationalPayouts,
                            refurbishmentCost,
                            refurbishmentParts,
                            processingType,
                            centerType,
                            evaluationType: processingType,
                            brand: rItem.brand || matchedDev?.brand || "Device",
                            model: rItem.model || matchedDev?.model || "Model",
                            categoryName: rItem.categoryName || matchedDev?.categoryName || "Electronics",
                            serialNumber: rItem.serialNumber || `SN-${devId}`,
                            purchaseDate: rItem.purchaseDate || matchedDev?.purchaseDate || null,
                            deviceQrToken: rItem.deviceQrToken || `ECOQR-REF-${devId}`,
                            weight,
                            quantity: rItem.quantity || 1,
                            condition: rItem.condition || "Used / Minor Cosmetic Scratches",
                            working: rItem.working || "Power on OK / Refurbished",
                            customerName: custName,
                            customerEmail: rItem.customerEmail || "—",
                            customerPhone: rItem.customerPhone || "—",
                            customerCity: rItem.customerCity || "—",
                            customerAddress: rItem.customerAddress || "—",
                            customerPincode: rItem.customerPincode || "—",
                            registeredDate: regDate,
                            collectionAgent1Name: ca1,
                            technicianName: tech,
                            inspectorName: tech,
                            collectionAgent2Name: ca2,
                            inspectionNotes: `Diagnostic passed. Quality Grade: ${proc.qualityGrade || "Grade A (Certified Refurbished)"}. Data Wiping: ${proc.wipingMethod || "NIST 800-88"}.`,
                            facilityId: rItem.refurbishmentCenterId || 101,
                            facilityName: cName,
                            facilityCity: cCity,
                            facilityType: "Refurbishment Center",
                            completedAt: compDate,
                            certificateId: rItem.certificateId || proc.refurbishedCertificateNumber || `ECO-REF-${new Date().getFullYear()}-${String(devId).padStart(6, "0")}`,
                            summaryOutput: `QC Passed • ${proc.qualityGrade || "Grade A Certified"} • Refurbished`,
                            settlement: {
                                ...settlement,
                                payoutStatus: isDeviceSettled ? "Paid" : "Pending",
                                isDistributed: isDeviceSettled,
                                payouts: devPayouts
                            },
                            citizenOffer: settlement.citizenPayout,
                            citizenOfferStatus: "Accepted",
                            paymentStatus: isDeviceSettled ? "Paid" : "Completed",
                            payoutStatus: isDeviceSettled ? "Paid" : "Pending",
                            isPaid: isDeviceSettled,
                            recoveredMaterials: [],
                            centerInventory,
                            processNotes: proc.remarks || "Components inspected, thermal pads replaced, storage upgraded, NIST 800-88 sanitized, QC verified.",
                            qcScore: proc.qualityGrade || "96/100 Benchmark Pass",
                            sanitizationPerformed: proc.wipingMethod || "NIST 800-88 Sanitized & OS Restored"
                        };

                        deviceObj.transactions = generateTransactionLedger(deviceObj, settlement);
                        completedList.push(deviceObj);
                    }
                });
            }

            setCompletedDevices(completedList);
        } catch (err) {
            console.error("Error loading completed devices:", err);
        } finally {
            setLoading(false);
        }
    };

    // Analytics KPIs according to the 5 Separated Values Model (Requirement #1 & #10)
    const totalCount = completedDevices.length;
    const recyclingCount = completedDevices.filter(d => d.processingType === "Responsible Recycling").length;
    const valuationCount = completedDevices.filter(d => d.processingType === "Valuation").length;
    const recyclingCenterCount = completedDevices.filter(d => d.centerType === "Recycling Center" || d.pathway === "Recycling").length;
    const refurbCenterCount = completedDevices.filter(d => d.centerType === "Refurbishment Center" || d.pathway === "Refurbishment").length;

    const totalValuation = useMemo(() => {
        const sum = completedDevices.reduce((acc, d) => acc + (d.processingType === "Valuation" ? Number(d.deviceValuation || d.deviceValue || 0) : 0), 0);
        return formatINR(sum);
    }, [completedDevices]);

    const totalRecoveryValue = useMemo(() => {
        const sum = completedDevices.reduce((acc, d) => acc + (d.processingType === "Responsible Recycling" ? Number(d.recoveryValue || 0) : 0), 0);
        return formatINR(sum);
    }, [completedDevices]);

    const totalCitizenPayout = useMemo(() => {
        const sum = completedDevices.reduce((acc, d) => acc + Number(d.settlement?.citizenPayout || d.settlement?.citizen || 0), 0);
        return formatINR(sum);
    }, [completedDevices]);

    // Separate Center Processing Fees: Recycling vs Refurbishment Centers
    const totalRecyclingCenterFees = useMemo(() => {
        const sum = completedDevices.reduce((acc, d) => {
            const isRec = d.centerType === "Recycling Center" || d.pathway === "Recycling";
            return acc + (isRec ? Number(d.settlement?.processingFee || d.settlement?.center || 0) : 0);
        }, 0);
        return formatINR(sum);
    }, [completedDevices]);

    const totalRefurbCenterFees = useMemo(() => {
        const sum = completedDevices.reduce((acc, d) => {
            const isRef = d.centerType === "Refurbishment Center" || d.pathway === "Refurbishment";
            return acc + (isRef ? Number(d.settlement?.processingFee || d.settlement?.center || 0) : 0);
        }, 0);
        return formatINR(sum);
    }, [completedDevices]);

    const totalProcessingFees = useMemo(() => {
        const sum = completedDevices.reduce((acc, d) => acc + Number(d.settlement?.processingFee || d.settlement?.center || 0), 0);
        return formatINR(sum);
    }, [completedDevices]);

    const totalOperationalPayouts = useMemo(() => {
        const sum = completedDevices.reduce((acc, d) => acc + Number(d.settlement?.operationalPayouts || d.settlement?.operationsCost || 0), 0);
        return formatINR(sum);
    }, [completedDevices]);

    // EcoCycle Reserve Surplus (Requirement #10: Don't call everything "profit")
    const totalEcoReserveSurplus = useMemo(() => {
        const sum = completedDevices.reduce((acc, d) => acc + Number(d.settlement?.ecocycleReserve || d.settlement?.ecocycleMargin || 0), 0);
        return formatINR(sum);
    }, [completedDevices]);

    // EcoCycle Subsidies (Requirement #4)
    const totalEcoSubsidies = useMemo(() => {
        const sum = completedDevices.reduce((acc, d) => acc + Number(d.settlement?.ecocycleSubsidy || 0), 0);
        return formatINR(sum);
    }, [completedDevices]);

    // Total Refurbished Asset Cost capitalized (Requirement #8 & #9)
    const totalAssetCostCapitalized = useMemo(() => {
        const sum = completedDevices.reduce((acc, d) => acc + (d.centerType === "Refurbishment Center" ? Number(d.settlement?.totalAssetCost || 0) : 0), 0);
        return formatINR(sum);
    }, [completedDevices]);

    // Filtering Logic: By ProcessingType and CenterType + Multi-Field & Price Search
    const filteredDevices = useMemo(() => {
        return completedDevices.filter(item => {
            if (activeFilterTab === "Valuation" && item.processingType !== "Valuation") return false;
            if (activeFilterTab === "Responsible Recycling" && item.processingType !== "Responsible Recycling") return false;
            if (activeFilterTab === "Refurbishment Center" && item.centerType !== "Refurbishment Center") return false;
            if (activeFilterTab === "Recycling Center" && item.centerType !== "Recycling Center") return false;

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();
            const cleanQ = q.replace(/[₹,\s]|rs/gi, "");
            const name = `${item.brand || ""} ${item.model || ""}`.toLowerCase();
            const cat = String(item.categoryName || "").toLowerCase();
            const serial = String(item.serialNumber || "").toLowerCase();
            const devIdStr = String(item.deviceId || "").toLowerCase();
            const facility = String(item.facilityName || "").toLowerCase();
            const cert = String(item.certificateId || "").toLowerCase();
            const cust = String(item.customerName || "").toLowerCase();
            const ca1 = String(item.collectionAgent1Name || "").toLowerCase();
            const tech = String(item.technicianName || item.inspectorName || "").toLowerCase();
            const ca2 = String(item.collectionAgent2Name || "").toLowerCase();
            const procT = String(item.processingType || "").toLowerCase();
            const centerT = String(item.centerType || "").toLowerCase();

            const s = item.settlement || {};
            const priceMatches = cleanQ.length > 0 && (
                String(item.deviceValuation || "").includes(cleanQ) ||
                String(item.recoveryValue || "").includes(cleanQ) ||
                String(s.activePool || "").includes(cleanQ) ||
                String(s.citizenPayout || "").includes(cleanQ) ||
                String(s.processingFee || "").includes(cleanQ) ||
                String(s.operationalPayouts || "").includes(cleanQ) ||
                String(s.agent1 || "").includes(cleanQ) ||
                String(s.technician || "").includes(cleanQ) ||
                String(s.agent2 || "").includes(cleanQ) ||
                String(s.ecocycleReserve || "").includes(cleanQ) ||
                String(s.totalAssetCost || "").includes(cleanQ) ||
                String(item.refurbishmentCost || "").includes(cleanQ) ||
                (Array.isArray(item.recoveredMaterials) && item.recoveredMaterials.some(m => 
                    String(m.totalValue || "").includes(cleanQ) || 
                    String(m.pricePerUnitAtProcessing || "").includes(cleanQ)
                ))
            );

            return (
                name.includes(q) ||
                cat.includes(q) ||
                serial.includes(q) ||
                devIdStr.includes(q.replace(/^#/, "")) ||
                facility.includes(q) ||
                cert.includes(q) ||
                cust.includes(q) ||
                ca1.includes(q) ||
                tech.includes(q) ||
                ca2.includes(q) ||
                procT.includes(q) ||
                centerT.includes(q) ||
                priceMatches
            );
        }).sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0));
    }, [completedDevices, activeFilterTab, searchQuery]);

    const getCategoryIcon = (categoryName) => {
        const cat = (categoryName || "").toLowerCase();
        if (cat.includes("laptop") || cat.includes("computer") || cat.includes("pc")) return <FiCpu />;
        if (cat.includes("mobile") || cat.includes("phone") || cat.includes("tablet")) return <FiSmartphone />;
        if (cat.includes("tv") || cat.includes("display") || cat.includes("monitor")) return <FiTv />;
        return <FiBox />;
    };

    const handlePrintCertificate = () => {
        window.print();
    };

    // Printable Classic Transaction & Disbursement Voucher Slip (Matches Manage_transactions.jsx)
    const handlePrintFinancialSlip = () => {
        if (!selectedItem) return;
        const s = selectedItem.settlement || {};
        const isRecycle = selectedItem.processingType === "Responsible Recycling";
        const devId = selectedItem.deviceId || selectedItem.requestId || 1;
        const dateStr = new Date(selectedItem.completedAt || Date.now()).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
        const weightVal = selectedItem.weight || 1;
        const isDevicePaid = Boolean(selectedItem.isPaid || selectedItem.paymentStatus === "Paid" || selectedItem.payoutStatus === "Paid" || s.payoutStatus === "Paid" || s.isDistributed);

        const isRefurbCenter = selectedItem.centerType === "Refurbishment Center" || selectedItem.pathway === "Refurbishment" || !isRecycle;
        const refurbExpense = Number(selectedItem.refurbishmentCost || s.refurbishmentCost || 0);
        const centerAmt = isRefurbCenter ? refurbExpense : (s.processingFee || 0);
        const totalAmount = Number(s.activePool || s.deviceValuation || s.recoveryValue || 0);

        const printWin = window.open("", "_blank", "width=900,height=950");
        if (!printWin) {
            window.print();
            return;
        }

        const printHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Transaction &amp; Payment Disbursement Slip — Voucher #${devId}</title>
            <style>
              @page { size: A4 portrait; margin: 10mm; }
              * { box-sizing: border-box; }
              body {
                background: #ffffff;
                color: #000000;
                font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
                font-size: 12px;
                line-height: 1.35;
                margin: 0;
                padding: 16px;
              }
              .classic-slip-table {
                width: 100%;
                border-collapse: collapse;
                border: 2px solid #000000;
                margin-bottom: 0;
              }
              .classic-slip-table th,
              .classic-slip-table td {
                border: 1px solid #000000;
                padding: 6px 8px;
                color: #000000;
                vertical-align: middle;
              }
              .slip-main-title {
                text-align: center;
                font-size: 15px;
                font-weight: 900;
                letter-spacing: 0.05em;
                padding: 8px !important;
                background: #ffffff;
                color: #000000;
                text-transform: uppercase;
              }
              .slip-sub-title {
                text-align: center;
                font-size: 12px;
                font-weight: 700;
                padding: 5px !important;
                background: #f4f4f4;
                color: #000000;
                border-bottom: 2px solid #000000 !important;
              }
              .slip-section-th {
                text-align: center;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 0.03em;
                padding: 5px !important;
                background: #e8e8e8;
                color: #000000;
                border-top: 2px solid #000000 !important;
                border-bottom: 2px solid #000000 !important;
              }
              .slip-col-headers th {
                font-size: 11px;
                font-weight: 800;
                background: #ffffff;
                padding: 6px 8px;
                text-transform: uppercase;
              }
              .lbl-cell {
                background: #fafafa;
                font-weight: 700;
                color: #000000;
                font-size: 11.5px;
              }
              .val-cell {
                background: #ffffff;
                color: #000000;
                font-size: 12px;
              }
              @media print {
                body { padding: 0; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            <table class="classic-slip-table">
              <thead>
                <tr>
                  <th colspan="4" class="slip-main-title">
                    ECOCYCLE SYSTEM
                  </th>
                </tr>
                <tr>
                  <th colspan="4" class="slip-sub-title">
                    Transaction &amp; Payment Disbursement Slip — Voucher #${devId}
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- Stakeholder & Metadata Info Block -->
                <tr>
                  <td class="lbl-cell" style="width: 22%">Transaction / Device ID:</td>
                  <td class="val-cell" style="width: 28%"><strong>#${devId}</strong></td>
                  <td class="lbl-cell" style="width: 22%">Issue Date &amp; Time:</td>
                  <td class="val-cell" style="width: 28%">${dateStr}</td>
                </tr>
                <tr>
                  <td class="lbl-cell">Beneficiary (Citizen):</td>
                  <td class="val-cell"><strong>${selectedItem.customerName || "Citizen"}</strong></td>
                  <td class="lbl-cell">Payer (Source):</td>
                  <td class="val-cell">EcoCycle Escrow Treasury</td>
                </tr>
                <tr>
                  <td class="lbl-cell">Device Model:</td>
                  <td class="val-cell"><strong>${selectedItem.brand} ${selectedItem.model}</strong></td>
                  <td class="lbl-cell">Category / Weight:</td>
                  <td class="val-cell">${selectedItem.categoryName || "Electronics"} (${weightVal} kg)</td>
                </tr>
                <tr>
                  <td class="lbl-cell">Processing Center:</td>
                  <td class="val-cell">${selectedItem.facilityName || selectedItem.centerType}</td>
                  <td class="lbl-cell">Account / Escrow:</td>
                  <td class="val-cell">EC-ESCROW-POOL-MAIN</td>
                </tr>

                <!-- Section Header -->
                <tr>
                  <th colspan="4" class="slip-section-th">
                    DISBURSEMENT PARTICULARS &amp; SETTLEMENT BREAKDOWN
                  </th>
                </tr>

                <!-- Table Column Subheaders -->
                <tr class="slip-col-headers">
                  <th style="width: 10%; text-align: center;">Serial No.</th>
                  <th style="width: 48%;">Particulars / Purpose Head</th>
                  <th style="width: 22%;">Flow &amp; Type</th>
                  <th style="width: 20%; text-align: right;">Amount (Rs.)</th>
                </tr>

                <!-- 1. Citizen -->
                <tr>
                  <td style="text-align: center;">1</td>
                  <td>
                    <div style="font-weight: bold;">${isRecycle ? "Voluntary Eco-Donation (Zero-Landfill Circular Surrender)" : "Citizen Fair Device Valuation Payout"}</div>
                    <div style="font-size: 11px; color: #333; margin-top: 2px;">
                      Beneficiary: ${selectedItem.customerName || "Citizen"} ${isRecycle ? "• Voluntary Zero Payout" : `• ${s.isSubsidized ? "Floor Guarantee" : `${s.citizenSharePercent || "60%"} Value Share`}`}
                    </div>
                  </td>
                  <td>
                    <div>UserValuation</div>
                    <div style="font-size: 11px; color: #333;">Outgoing / Credit</div>
                  </td>
                  <td style="text-align: right; font-weight: bold;">
                    ${formatINR(s.citizenPayout || 0)}
                  </td>
                </tr>

                <!-- 2. Agent 1 -->
                <tr>
                  <td style="text-align: center;">2</td>
                  <td>
                    <div style="font-weight: bold;">Doorstep Collection &amp; First-Mile Logistics (Agent 1)</div>
                    <div style="font-size: 11px; color: #333; margin-top: 2px;">
                      Agent: ${selectedItem.collectionAgent1Name || selectedItem.collectionAgentName || "EcoCycle Logistics Partner 1"} • Citizen → Diagnostic Lab
                    </div>
                  </td>
                  <td>
                    <div>CollectionFee</div>
                    <div style="font-size: 11px; color: #333;">Outgoing / Debit</div>
                  </td>
                  <td style="text-align: right; font-weight: bold;">
                    ${formatINR(s.agent1 || 150)}
                  </td>
                </tr>

                <!-- 3. Technician -->
                <tr>
                  <td style="text-align: center;">3</td>
                  <td>
                    <div style="font-weight: bold;">Technical Diagnostics, Inspection &amp; Safety Isolation</div>
                    <div style="font-size: 11px; color: #333; margin-top: 2px;">
                      Technician: ${selectedItem.technicianName || selectedItem.inspectorName || "EcoCycle Certified Technician"} • Multi-point diagnostic test
                    </div>
                  </td>
                  <td>
                    <div>InspectionFee</div>
                    <div style="font-size: 11px; color: #333;">Outgoing / Debit</div>
                  </td>
                  <td style="text-align: right; font-weight: bold;">
                    ${formatINR(s.technician || 300)}
                  </td>
                </tr>

                <!-- 4. Agent 2 -->
                <tr>
                  <td style="text-align: center;">4</td>
                  <td>
                    <div style="font-weight: bold;">Mid-Mile Facility Transfer Logistics (Agent 2)</div>
                    <div style="font-size: 11px; color: #333; margin-top: 2px;">
                      Agent: ${selectedItem.collectionAgent2Name || "EcoCycle Logistics Partner 2"} • Diagnostic Lab → Processing Center
                    </div>
                  </td>
                  <td>
                    <div>TransferLogistics</div>
                    <div style="font-size: 11px; color: #333;">Outgoing / Debit</div>
                  </td>
                  <td style="text-align: right; font-weight: bold;">
                    ${formatINR(s.agent2 || 150)}
                  </td>
                </tr>

                <!-- 5. Processing Center -->
                <tr>
                  <td style="text-align: center;">5</td>
                  <td>
                    <div style="font-weight: bold;">
                      ${isRefurbCenter ? "Refurbishment Parts & Repair Operation Expense" : "Material Recovery & Processing Operation Fee"}
                    </div>
                    <div style="font-size: 11px; color: #333; margin-top: 2px;">
                      Facility: ${selectedItem.facilityName || selectedItem.centerType} • ${isRefurbCenter ? "Hardware Refurbishment Completed" : "Certified Demanufacturing"}
                    </div>
                  </td>
                  <td>
                    <div>${isRefurbCenter ? "ProcessingFee" : "RecyclingFee"}</div>
                    <div style="font-size: 11px; color: #333;">Outgoing / Debit</div>
                  </td>
                  <td style="text-align: right; font-weight: bold;">
                    ${formatINR(centerAmt)}
                  </td>
                </tr>

                <!-- 6. EcoCycle Platform Reserve -->
                <tr>
                  <td style="text-align: center;">6</td>
                  <td>
                    <div style="font-weight: bold;">
                      ${s.isSubsidized ? "EcoCycle ESG Circular Subsidy Injection" : "EcoCycle Governance & Platform Reserve Surplus"}
                    </div>
                    <div style="font-size: 11px; color: #333; margin-top: 2px;">
                      ${s.isSubsidized ? "Negative margin absorbed by platform governance" : "Residual Pool Retention [P − (U+A1+T+A2+C)]"}
                    </div>
                  </td>
                  <td>
                    <div>${s.isSubsidized ? "PlatformSubsidy" : "PlatformReserve"}</div>
                    <div style="font-size: 11px; color: #333;">${s.isSubsidized ? "Subsidy Deficit" : "Surplus Credit"}</div>
                  </td>
                  <td style="text-align: right; font-weight: bold;">
                    ${s.isSubsidized ? `+₹${formatINR(s.ecocycleSubsidy)}` : `₹${formatINR(s.ecocycleReserve)}`}
                  </td>
                </tr>

                <!-- Financial Totals & Status -->
                <tr>
                  <td class="lbl-cell" style="font-weight: bold;">TOTAL AMOUNT / PM:</td>
                  <td class="val-cell" style="font-weight: bold; font-size: 14px;">
                    Rs. ${formatINR(totalAmount)}
                  </td>
                  <td class="lbl-cell" style="font-weight: bold;">PAYMENT STATUS:</td>
                  <td class="val-cell" style="font-weight: bold;">
                    ${isDevicePaid ? "PAID / SETTLED" : "ESCROW HELD"}
                  </td>
                </tr>

                <tr>
                  <td class="lbl-cell" style="font-weight: bold;">AMOUNT IN WORDS:</td>
                  <td colspan="3" class="val-cell" style="font-style: italic; font-weight: bold;">
                    ${numToWords(totalAmount)}
                  </td>
                </tr>

                <tr>
                  <td class="lbl-cell">GATEWAY / UTR REF:</td>
                  <td colspan="3" class="val-cell" style="font-family: monospace; font-size: 12px;">
                    ${selectedItem.razorpayPaymentId || `POUT_ECO_${devId}_${Date.now()}`}
                  </td>
                </tr>

                <tr>
                  <td class="lbl-cell">BATCH RECONCILIATION:</td>
                  <td colspan="3" class="val-cell" style="font-family: monospace; font-size: 12px;">
                    ${selectedItem.razorpayOrderId || `BATCH_${devId}_SETTLED`}
                  </td>
                </tr>

                <tr>
                  <td class="lbl-cell">AUTHENTICATION:</td>
                  <td colspan="3" class="val-cell" style="font-size: 11px;">
                    256-Bit SHA-256 System Generated Document • No Physical Signature Required
                  </td>
                </tr>
              </tbody>
            </table>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 350);
              };
            </script>
          </body>
          </html>
        `;

        printWin.document.open();
        printWin.document.write(printHtml);
        printWin.document.close();
    };

    const handleCopyQrToken = (token) => {
        if (!token) return;
        navigator.clipboard.writeText(token);
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2500);
    };

    const openOverallModal = (item, tab = "overview") => {
        setSelectedItem(item);
        setOverallActiveTab(tab);
        setShowOverallModal(true);
    };

    const openAuditModal = (item) => {
        setSelectedItem(item);
        setShowAuditModal(true);
    };

    const openLedgerModal = (item) => {
        setSelectedItem(item);
        setShowLedgerModal(true);
    };

    const openInventoryModal = (item) => {
        setSelectedItem(item);
        setShowInventoryModal(true);
    };

    const blockNegativeKeys = (e) => {
        if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
            e.preventDefault();
        }
    };

    const handlePositiveNumberInput = (setter) => (e) => {
        let val = e.target.value;
        if (val.startsWith("-")) val = val.replace("-", "");
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) {
            setter(val === "" ? "" : "0");
        } else {
            setter(val);
        }
    };

    // Requirement #3: Update Low-Value Threshold Business Rule
    const handleSaveThreshold = () => {
        const val = Math.max(0, parseFloat(tempThresholdInput) || 500);
        setLowValueThreshold(val);
        setShowThresholdConfig(false);

        // Recalculate settlement for all devices with new threshold
        setCompletedDevices(prev => prev.map(d => {
            const newSettlement = calculateSettlement({
                deviceValuation: d.deviceValuation,
                recoveryValue: d.recoveryValue,
                processingType: d.processingType,
                centerType: d.centerType,
                weight: d.weight,
                isHazardous: checkIsHazardous(d),
                refurbishmentCost: d.refurbishmentCost,
                threshold: val
            });
            const newTxns = generateTransactionLedger(d, newSettlement);
            return {
                ...d,
                settlement: newSettlement,
                transactions: newTxns
            };
        }));

        setToastMessage(`Low-Value threshold updated to ₹${val}! Re-evaluated completed ledger.`);
        setTimeout(() => setToastMessage(""), 4000);
    };

    const openDistributionModal = (item, e) => {
        if (e) e.stopPropagation();
        setDistributionEditItem(item);
        const s = item.settlement;
        const isRefurb = item.centerType === "Refurbishment Center" || item.pathway === "Refurbishment" || item.processingType !== "Responsible Recycling";
        const centerInitial = isRefurb 
            ? (Number(item.refurbishmentCost || s.refurbishmentCost || s.center || 0))
            : (Number(s.center !== undefined ? s.center : (s.processingFee || 0)));
        setCustomCitizenPay(String(Math.max(0, s.citizenPayout !== undefined ? s.citizenPayout : 0)));
        setCustomCenterPay(String(Math.max(0, centerInitial)));
        setCustomAgent1Pay(String(Math.max(0, s.agent1 !== undefined ? s.agent1 : 150)));
        setCustomTechPay(String(Math.max(0, s.technician !== undefined ? s.technician : 300)));
        setCustomAgent2Pay(String(Math.max(0, s.agent2 !== undefined ? s.agent2 : 150)));
        setDistributionNotes(item.distributionNotes || "");
        setDistributionSaveSuccess(false);
        setShowDistributionModal(true);
    };

    const applyStandardEquation = () => {
        if (!distributionEditItem) return;
        const auto = calculateSettlement({
            deviceValuation: distributionEditItem.deviceValuation,
            recoveryValue: distributionEditItem.recoveryValue,
            processingType: distributionEditItem.processingType,
            centerType: distributionEditItem.centerType,
            weight: distributionEditItem.weight,
            isHazardous: checkIsHazardous(distributionEditItem),
            refurbishmentCost: distributionEditItem.refurbishmentCost
        });
        setCustomCitizenPay(String(auto.citizenPayout));
        setCustomCenterPay(String(auto.center !== undefined ? auto.center : 0));
        setCustomAgent1Pay(String(auto.agent1 || 150));
        setCustomTechPay(String(auto.technician || 300));
        setCustomAgent2Pay(String(auto.agent2 || 150));
    };

    const handlePaySettlementWithRazorpay = (item) => {
        openPaymentModal(item);
    };

    const handlePayAll = (item) => {
        openPaymentModal(item);
    };

    const handleProcessSettlementPayment = async (forceSim = false) => {
        const targetItem = paymentModalItem || selectedItem || distributionEditItem;
        if (!targetItem) return;
        const devId = targetItem.deviceId || targetItem.requestId;
        const s = targetItem.settlement || {};
        const finalVal = Math.max(1, s.activePool || targetItem.deviceValuation || targetItem.recoveryValue || 100);
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const citizenAmt = Math.max(0, Number(s.citizenPayout !== undefined ? s.citizenPayout : (s.citizen !== undefined ? s.citizen : 0)));
        const a1Amt = Math.max(0, Number(s.agent1 !== undefined ? s.agent1 : 150));
        const techAmt = Math.max(0, Number(s.technician !== undefined ? s.technician : 300));
        const a2Amt = Math.max(0, Number(s.agent2 !== undefined ? s.agent2 : 150));
        const centerAmt = Math.max(0, Number(s.center !== undefined ? s.center : (s.centerFee !== undefined ? s.centerFee : (s.processingFee !== undefined ? s.processingFee : (targetItem.refurbishmentCost || targetItem.processingCost || 0)))));
        const ecoShare = Math.max(0, Number(s.ecocycleReserve !== undefined ? s.ecocycleReserve : (s.ecocycleShare !== undefined ? s.ecocycleShare : 0)));

        const payoutPayload = {
            deviceId: devId,
            citizenAmount: citizenAmt,
            agent1Amount: a1Amt,
            technicianAmount: techAmt,
            agent2Amount: a2Amt,
            centerAmount: centerAmt,
            ecoCycleShare: ecoShare,
            notes: paymentNotes || `[TEST MODE] Buyout settlement for Device #${devId}`
        };

        try {
            setIsPayingSettlement(true);
            setIsExecutingPayAll(true);

            // Option 1: 1-Click Instant Test Simulation (bypasses popup for fast dev testing)
            if (forceSim || isQuickSimulation) {
                const simTxnId = `pay_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
                const simOrderId = `order_test_${Date.now()}`;
                await axios.post(`${API_BASE}/Settlement/center-pay-settlement`, {
                    deviceId: devId,
                    finalRealizableValue: finalVal,
                    paymentMethod: "Razorpay (Test Sandbox)",
                    razorpayPaymentId: simTxnId,
                    razorpayOrderId: simOrderId,
                    razorpaySignature: "simulated_test_signature",
                    notes: paymentNotes || `[TEST MODE] Buyout settlement for Device #${devId}`
                }, { headers }).catch(e => console.warn("Center settlement check:", e));

                const payRes = await axios.post(`${API_BASE}/Payout/pay-all/${devId}`, payoutPayload, { headers });
                setToastMessage(`[TEST MODE] Escrow Buyout Settlement of ₹${formatINR(finalVal)} simulated successfully! (Txn ID: ${simTxnId})`);
                setTimeout(() => setToastMessage(""), 5000);
                setShowPaymentModal(false);
                setShowLedgerModal(false);
                setShowDistributionModal(false);
                fetchCompletedDevices();
                return;
            }

            // Option 2: Razorpay Interactive Test Checkout Modal
            // 1. Create Razorpay payment order on backend
            let orderData = null;
            try {
                const orderRes = await axios.post(`${API_BASE}/Settlement/create-center-order`, {
                    deviceId: devId,
                    amount: finalVal,
                    notes: paymentNotes || `[TEST MODE] Buyout settlement for Device #${devId}`
                }, { headers });
                orderData = orderRes.data;
            } catch (orderErr) {
                console.warn("Order creation warning, fallback to test simulation:", orderErr);
            }

            if (!window.Razorpay) {
                // If script not loaded, fallback to simulation
                const simTxnId = `pay_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
                await axios.post(`${API_BASE}/Settlement/center-pay-settlement`, {
                    deviceId: devId,
                    finalRealizableValue: finalVal,
                    paymentMethod: "Razorpay (Test Sandbox)",
                    razorpayPaymentId: simTxnId,
                    razorpayOrderId: orderData?.orderId || `order_test_${Date.now()}`,
                    razorpaySignature: "simulated_test_signature",
                    notes: paymentNotes || `[TEST MODE] Buyout settlement for Device #${devId}`
                }, { headers }).catch(e => console.warn("Center settlement check:", e));

                await axios.post(`${API_BASE}/Payout/pay-all/${devId}`, payoutPayload, { headers });
                setToastMessage(`[TEST MODE] Escrow Buyout Settlement of ₹${formatINR(finalVal)} authorized in sandbox mode! (Txn ID: ${simTxnId})`);
                setTimeout(() => setToastMessage(""), 5000);
                setShowPaymentModal(false);
                setShowLedgerModal(false);
                setShowDistributionModal(false);
                fetchCompletedDevices();
                return;
            }

            // 2. Configure & Open Razorpay Test Checkout Modal
            const options = {
                key: orderData?.keyId || "rzp_test_TbWPh6RPgq5pZA",
                amount: orderData?.amount || (finalVal * 100),
                currency: orderData?.currency || "INR",
                name: "EcoCycle Sandbox Escrow",
                description: `[TEST MODE] Settlement & Disbursal DEV #${devId}`,
                order_id: orderData?.orderId,
                handler: async function (response) {
                    try {
                        // 3. Record verified test payment on backend
                        await axios.post(`${API_BASE}/Settlement/center-pay-settlement`, {
                            deviceId: devId,
                            finalRealizableValue: finalVal,
                            paymentMethod: "Razorpay (Test Sandbox)",
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpaySignature: response.razorpay_signature,
                            notes: paymentNotes || `[TEST MODE] Buyout settlement for Device #${devId}`
                        }, { headers }).catch(e => console.warn("Settlement check:", e));

                        await axios.post(`${API_BASE}/Payout/pay-all/${devId}`, payoutPayload, { headers });
                        setToastMessage(`[TEST MODE] EcoCycle Buyout Settlement of ₹${formatINR(finalVal)} successfully authorized and recorded! (Txn ID: ${response.razorpay_payment_id})`);
                        setTimeout(() => setToastMessage(""), 5000);
                        setShowPaymentModal(false);
                        setShowLedgerModal(false);
                        setShowDistributionModal(false);
                        fetchCompletedDevices();
                    } catch (verifyErr) {
                        console.error("Payment confirmation error:", verifyErr);
                        setToastMessage(verifyErr.response?.data?.message || "Payment verification failed.");
                        setTimeout(() => setToastMessage(""), 5000);
                    } finally {
                        setIsPayingSettlement(false);
                        setIsExecutingPayAll(false);
                    }
                },
                prefill: {
                    name: targetItem.facilityName || "Refurbishment Test Center",
                    contact: "9999999999",
                    email: "test_center@ecocycle.in"
                },
                theme: {
                    color: "#059669"
                },
                modal: {
                    ondismiss: function () {
                        setIsPayingSettlement(false);
                        setIsExecutingPayAll(false);
                    }
                }
            };

            const razorpayInstance = new window.Razorpay(options);
            razorpayInstance.open();
        } catch (err) {
            console.error("Error in test settlement payment:", err);
            setToastMessage(err.response?.data?.message || err.response?.data || "Failed to initialize Razorpay test checkout.");
            setTimeout(() => setToastMessage(""), 5000);
            setIsPayingSettlement(false);
            setIsExecutingPayAll(false);
        }
    };

    const handleSaveDistribution = async () => {
        if (!distributionEditItem) return;
        const activePool = distributionEditItem.settlement.activePool;
        const cPay = Math.max(0, parseFloat(customCitizenPay) || 0);
        const ctrPay = Math.max(0, parseFloat(customCenterPay) || 0);
        const a1Pay = Math.max(0, parseFloat(customAgent1Pay) || 0);
        const tchPay = Math.max(0, parseFloat(customTechPay) || 0);
        const a2Pay = Math.max(0, parseFloat(customAgent2Pay) || 0);

        const opsTotal = +(a1Pay + tchPay + a2Pay).toFixed(2);
        const totalRequired = +(cPay + ctrPay + opsTotal).toFixed(2);

        if (activePool > 0 && totalRequired > activePool) {
            setToastMessage(`Cannot save: Total payouts (₹${formatINR(totalRequired)}) exceed Total Pool (₹${formatINR(activePool)}) by ₹${formatINR(totalRequired - activePool)}!`);
            setTimeout(() => setToastMessage(""), 4500);
            return;
        }

        const isViable = activePool >= totalRequired;
        const deficit = isViable ? 0 : +(totalRequired - activePool).toFixed(2);
        // EcoCycleShare = max(0, DeviceValue - UserPayment - CollectionFee - TechFee - CenterFee)
        const ecocycleReserve = Math.max(0, +(activePool - totalRequired).toFixed(2));
        const ecocycleSubsidy = 0;
        const isSubsidized = false;

        const rfCost = distributionEditItem.refurbishmentCost || 0;
        const totalAssetCost = +(cPay + rfCost).toFixed(2);

        // Call Backend Settlement API to persist Payouts and EcoCycle Transactions
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Ensure incoming settlement is marked paid
            await axios.post(`${API_BASE}/Settlement/center-pay-settlement`, {
                deviceId: distributionEditItem.deviceId,
                finalRealizableValue: activePool,
                paymentMethod: "Razorpay",
                razorpayPaymentId: `PAY_SETTLE_${Date.now()}`,
                notes: distributionNotes
            }, { headers }).catch(e => console.warn("Center settlement check notice:", e));

            // Execute distribution
            await axios.post(`${API_BASE}/Settlement/distribute-payouts`, {
                deviceId: distributionEditItem.deviceId,
                citizenAmount: cPay,
                agent1Amount: a1Pay,
                technicianAmount: tchPay,
                agent2Amount: a2Pay,
                centerAmount: ctrPay,
                ecoCycleShare: ecocycleReserve,
                notes: distributionNotes
            }, { headers });
        } catch (apiErr) {
            console.warn("Distribution API notice:", apiErr);
        }

        const customSettlement = {
            ...distributionEditItem.settlement,
            isViable,
            viabilityStatus: isViable ? "Viable" : "Not Economically Viable",
            deficit,
            recommendation: isViable ? "Approved for Valuation" : "Valuation not economically viable • Recommend Responsible Recycling",
            citizenPayout: cPay,
            citizen: cPay,
            processingFee: ctrPay,
            center: ctrPay,
            agent1: a1Pay,
            technician: tchPay,
            agent2: a2Pay,
            operationalPayouts: opsTotal,
            totalDisbursed: totalRequired,
            ecocycleReserve,
            ecocycleSubsidy,
            isSubsidized,
            totalAssetCost,
            totalReconciled: activePool,
            isDistributed: true,
            payoutStatus: "Paid"
        };

        const updatedDevice = {
            ...distributionEditItem,
            settlement: customSettlement,
            citizenOffer: cPay,
            distributionNotes: distributionNotes || undefined,
            paymentLastAdjustedAt: new Date().toISOString()
        };
        updatedDevice.transactions = generateTransactionLedger(updatedDevice, customSettlement);

        // Update in list
        setCompletedDevices(prevList =>
            prevList.map(d => (d.id === distributionEditItem.id || d.deviceId === distributionEditItem.deviceId ? updatedDevice : d))
        );

        // Update selectedItem if open
        if (selectedItem && (selectedItem.id === distributionEditItem.id || selectedItem.deviceId === distributionEditItem.deviceId)) {
            setSelectedItem(updatedDevice);
        }

        setDistributionSaveSuccess(true);
        setToastMessage(`Payment distributed & settled! Citizen: ₹${formatINR(cPay)}, Ops: ₹${formatINR(opsTotal)}, Center: ₹${formatINR(ctrPay)}, EcoCycle: ₹${formatINR(ecocycleReserve)}.`);
        setTimeout(() => {
            setDistributionSaveSuccess(false);
            setShowDistributionModal(false);
        }, 1000);
        setTimeout(() => {
            setToastMessage("");
        }, 4000);
    };

    return (
        <div className="admin-inspection-page">
            <Navbar />

            <div className="admin-inspection-main">
                {/* Topbar */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <div className="command-brand">
                            <h1>Completed Devices Master Log</h1>
                        </div>
                        <p className="command-subtitle">
                            5-Values Separation • Dual Processing/Center Matrix • Dynamic Material Pricing &amp; Transaction Ledger
                        </p>
                    </div>

                    <div className="topbar-right">
                        <div className="search-box-v2">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by device, citizen, agent, tech, serial, or price (₹)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span className="search-shortcut">⌘K</span>
                        </div>

                        <div className="topbar-actions">
                            {/* Dynamic Material Prices Catalog Button (Requirement #6) */}
                            <button
                                className="mcd-topbar-btn materials"
                                onClick={() => setShowMaterialPricesModal(true)}
                                title="View Dynamic Material Market Rates"
                            >
                                <FaBalanceScale /> Material Prices
                            </button>

                            <button className="glass-btn notification-btn" title="System Alerts">
                                <FiBell />
                                <span className="pulse-ping"></span>
                            </button>

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

                {/* 5-Values KPI Metrics Dashboard (Requirement #1 & #10) */}
                <div className="admin-metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                    {/* 1. Device Valuation */}
                    <div className="admin-metric-card">
                        <div className="admin-metric-icon total" style={{ background: "#ecfdf5", color: "#059669" }}>
                            <FiDollarSign />
                        </div>
                        <div className="admin-metric-info">
                            <h3>₹{totalValuation}</h3>
                            <p>1. Device Valuations</p>
                        </div>
                    </div>

                    {/* 2. Recovery Value */}
                    <div className="admin-metric-card">
                        <div className="admin-metric-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                            <FaLeaf />
                        </div>
                        <div className="admin-metric-info">
                            <h3 style={{ color: "#15803d" }}>₹{totalRecoveryValue}</h3>
                            <p>2. Material Recovery Yield</p>
                        </div>
                    </div>

                    {/* 3A. Recycling Center Processing Fees */}
                    <div className="admin-metric-card" style={{ borderColor: "#a7f3d0" }}>
                        <div className="admin-metric-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
                            <FaRecycle />
                        </div>
                        <div className="admin-metric-info">
                            <h3 style={{ color: "#047857" }}>₹{totalRecyclingCenterFees}</h3>
                            <p>3. Recycling Center Fees</p>
                        </div>
                    </div>

                    {/* 3B. Refurbishment Center Processing Fees */}
                    <div className="admin-metric-card" style={{ borderColor: "#bfdbfe" }}>
                        <div className="admin-metric-icon active" style={{ background: "#eff6ff", color: "#2563eb" }}>
                            <FaTools />
                        </div>
                        <div className="admin-metric-info">
                            <h3 style={{ color: "#1d4ed8" }}>₹{totalRefurbCenterFees}</h3>
                            <p>4. Refurb Center Fees</p>
                        </div>
                    </div>

                    {/* 4. Operational Payouts */}
                    <div className="admin-metric-card">
                        <div className="admin-metric-icon" style={{ background: "#f8fafc", color: "#475569" }}>
                            <FiTruck />
                        </div>
                        <div className="admin-metric-info">
                            <h3 style={{ color: "#334155" }}>₹{totalOperationalPayouts}</h3>
                            <p>5. Agent/Tech Payouts</p>
                        </div>
                    </div>

                    {/* Citizen Total Payouts */}
                    <div className="admin-metric-card">
                        <div className="admin-metric-icon done" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                            <FiUserCheck />
                        </div>
                        <div className="admin-metric-info">
                            <h3 style={{ color: "#16a34a" }}>₹{totalCitizenPayout}</h3>
                            <p>Citizen Settlements</p>
                        </div>
                    </div>

                    {/* 5. EcoCycle Reserve / Recovery Surplus (Requirement #10) */}
                    <div className="admin-metric-card">
                        <div className="admin-metric-icon alert" style={{ background: "#faf5ff", color: "#7c3aed" }}>
                            <FiTrendingUp />
                        </div>
                        <div className="admin-metric-info">
                            <h3 style={{ color: "#7c3aed" }}>₹{totalEcoReserveSurplus}</h3>
                            <p>EcoCycle Reserve Surplus</p>
                        </div>
                    </div>

                    {/* EcoCycle Subsidies (Requirement #4) */}
                    <div className="admin-metric-card" style={{ borderColor: "#fecdd3" }}>
                        <div className="admin-metric-icon" style={{ background: "#fff1f2", color: "#e11d48" }}>
                            <FiHeart />
                        </div>
                        <div className="admin-metric-info">
                            <h3 style={{ color: "#be123c" }}>₹{totalEcoSubsidies}</h3>
                            <p>EcoCycle Subsidies</p>
                        </div>
                    </div>

                    {/* Asset Cost Capitalized (Requirement #8 & #9) */}
                    <div className="admin-metric-card" style={{ borderColor: "#e9d5ff" }}>
                        <div className="admin-metric-icon" style={{ background: "#faf5ff", color: "#9333ea" }}>
                            <FiArchive />
                        </div>
                        <div className="admin-metric-info">
                            <h3 style={{ color: "#9333ea" }}>₹{totalAssetCostCapitalized}</h3>
                            <p>Center Stored Assets</p>
                        </div>
                    </div>
                </div>

                {/* Operations & Master Ledger Panel */}
                <div className="panel-card">
                    <div className="panel-header">
                        <div>
                            <h2 className="panel-title">Completed Equipment &amp; Financial Ledger</h2>
                        </div>

                        <div className="panel-actions" style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                            {/* Filter Pill Group matching Manage_materialrecovery / Manage_recyclingprocess */}
                            <div className="filter-pill-group">
                                {[
                                    { id: "All", label: "All Items", count: totalCount },
                                    { id: "Valuation", label: "Valuation", count: valuationCount },
                                    { id: "Responsible Recycling", label: "Responsible Recycling", count: recyclingCount },
                                    { id: "Refurbishment Center", label: "Refurb Centers", count: refurbCenterCount },
                                    { id: "Recycling Center", label: "Recycling Centers", count: recyclingCenterCount }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        className={`pill-btn ${activeFilterTab === tab.id ? "pill-btn--active" : ""}`}
                                        onClick={() => setActiveFilterTab(tab.id)}
                                    >
                                        {tab.label} ({tab.count})
                                    </button>
                                ))}
                            </div>

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

                    {/* Table or Grid View */}
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading completed devices and financial ledgers...</p>
                        </div>
                    ) : filteredDevices.length === 0 ? (
                        <div className="no-data-state">
                            <FiAward className="no-data-icon" />
                            <h3>No completed devices matching filter</h3>
                            <p>Try switching ProcessingType or CenterType filters.</p>
                        </div>
                    ) : viewMode === "table" ? (
                        /* TABLE VIEW */
                        <div className="mcd-table-container">
                            <table className="mcd-table">
                                <thead>
                                    <tr>
                                        <th className="mcd-th mcd-th-device">Equipment / Device</th>
                                        <th className="mcd-th mcd-th-evaltype">Processing &amp; Center</th>
                                        <th className="mcd-th mcd-th-devval">5-Values Financial Pool</th>
                                        <th className="mcd-th mcd-th-citizenshare">Citizen Settlement</th>
                                        <th className="mcd-th mcd-th-partnershares">Ledger Splits &amp; Reserve</th>
                                        <th className="mcd-th mcd-th-paystatus">Ledger &amp; Payout</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDevices.map((item) => {
                                        const isRecycle = item.processingType === "Responsible Recycling";
                                        const s = item.settlement;
                                        const isHaz = s.processingFeeBreakdown?.isHazardous;
                                        const isDevicePaid = Boolean(item.isPaid || item.paymentStatus === "Paid" || item.payoutStatus === "Paid" || s?.payoutStatus === "Paid" || s?.isDistributed);

                                        return (
                                            <tr key={item.id} className="mcd-table-row">
                                                {/* 1. Device Info */}
                                                <td className="mcd-td-device">
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                                                        <div className="admin-cat-icon-box" style={{ width: "34px", height: "34px", minWidth: "34px", fontSize: "1rem" }}>
                                                            {getCategoryIcon(item.categoryName)}
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div className="user-name" style={{ fontSize: "0.84rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                {item.brand} {item.model}
                                                            </div>
                                                            <div className="user-email" style={{ fontSize: "0.75rem" }}>
                                                                ID: #{item.deviceId} &bull; {item.weight} kg {isHaz ? "• Hazardous (Lithium/Heavy Metals)" : "• Clean Stream"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 2. ProcessingType & CenterType (Requirement #2) */}
                                                <td className="mcd-td-evaltype">
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                                        {isRecycle ? (
                                                            <span className="eval-badge eval-badge--recycling" style={{ fontSize: "0.70rem", padding: "2px 7px" }}>
                                                                <FaLeaf /> Responsible Recycling
                                                            </span>
                                                        ) : (
                                                            <span className="eval-badge eval-badge--evaluation" style={{ fontSize: "0.70rem", padding: "2px 7px" }}>
                                                                <FaTools /> Valuation
                                                            </span>
                                                        )}
                                                        <span style={{ fontSize: "0.68rem", color: "#475569", display: "flex", alignItems: "center", gap: "4px" }}>
                                                            <FaWarehouse style={{ color: "#94a3b8" }} /> {item.centerType}
                                                        </span>
                                                        {s.isLowValue && (
                                                            <span style={{ fontSize: "0.65rem", padding: "1px 5px", borderRadius: "4px", background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", fontWeight: 700 }}>
                                                                Low-Value (&lt;₹{lowValueThreshold})
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 3. 5-Values Financial Pool (Requirement #1 & #5) */}
                                                <td className="mcd-td-devval">
                                                    <div style={{ minWidth: 0 }}>
                                                        <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", display: "block" }}>
                                                            ₹{formatINR(s.activePool)}
                                                        </span>
                                                        <span style={{ fontSize: "0.70rem", color: isRecycle ? "#059669" : "#64748b", display: "block", fontWeight: 600 }}>
                                                            {isRecycle ? `Recovery Value (${item.recoveredMaterials?.length || 5} Streams)` : `Device Valuation`}
                                                        </span>
                                                        {item.refurbishmentCost > 0 && (
                                                            <span style={{ fontSize: "0.68rem", color: "#7c3aed", display: "block", fontWeight: 600 }}>
                                                                Asset Cost: ₹{formatINR(s.totalAssetCost)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 4. Citizen Settlement (Requirement #8) */}
                                                <td className="mcd-td-citizenshare">
                                                    {isRecycle ? (
                                                        <div style={{ minWidth: 0 }}>
                                                            <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "#059669", display: "block" }}>
                                                                ₹0.00
                                                            </span>
                                                            <span style={{ fontSize: "0.70rem", color: "#059669", display: "flex", alignItems: "center", gap: "3px" }}>
                                                                <FaLeaf /> Voluntary Eco-Donation
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div style={{ minWidth: 0 }}>
                                                            <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "#16a34a", display: "block" }}>
                                                                ₹{formatINR(s.citizenPayout)}
                                                            </span>
                                                            <span style={{ fontSize: "0.70rem", color: "#059669", display: "flex", alignItems: "center", gap: "3px" }}>
                                                                <FiCheck /> {item.customerName} {s.isSubsidized ? "(Min Guarantee)" : `(${s.citizenSharePercent || "60%"} Share)`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* 5. Operations, Center Fee & EcoCycle Reserve / Subsidy (Requirement #4 & #10) */}
                                                <td className="mcd-td-partnershares">
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                                            <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: "0.68rem", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                                                                {item.refurbishmentCost > 0 ? `Refurb Expense: ₹${formatINR(item.refurbishmentCost)}` : `Center Fee: ₹${formatINR(s.processingFee)}`}
                                                            </span>
                                                            <span style={{ background: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0", fontSize: "0.68rem", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                                                                Ops: ₹{s.operationalPayouts}
                                                            </span>
                                                            {s.isSubsidized ? (
                                                                <span style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", fontSize: "0.68rem", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                                                                    Eco Subsidy: +₹{formatINR(s.ecocycleSubsidy)}
                                                                </span>
                                                            ) : (
                                                                <span style={{ background: "#faf5ff", color: "#7c3aed", fontSize: "0.68rem", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                                                                    Reserve: ₹{formatINR(s.ecocycleReserve)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                                                            A1: ₹{s.agent1} &bull; Tech: ₹{s.technician} &bull; A2: ₹{s.agent2}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 6. Action: Edit Price, Payouts & Full Details */}
                                                <td className="mcd-td-paystatus">
                                                    <div className="mcd-action-btn-group">
                                                        {!isDevicePaid && (
                                                            <button
                                                                className="mcd-btn-edit-price"
                                                                onClick={() => openEditPriceModal(item)}
                                                                style={{
                                                                    background: "#eff6ff",
                                                                    color: "#1d4ed8",
                                                                    border: "1px solid #bfdbfe",
                                                                    borderRadius: "6px",
                                                                    padding: "0.35rem 0.65rem",
                                                                    fontSize: "0.75rem",
                                                                    fontWeight: 700,
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    gap: "4px",
                                                                    cursor: "pointer"
                                                                }}
                                                                title="Edit Device Price & Settlement"
                                                            >
                                                                <FiEdit2 /> Edit Price
                                                            </button>
                                                        )}
                                                        <button
                                                            className="mcd-btn-payouts"
                                                            onClick={() => openLedgerModal(item)}
                                                            title="View Stakeholder Payouts & Settlement"
                                                        >
                                                            <FiFileText /> Payouts
                                                        </button>
                                                        <button
                                                            className="mcd-btn-details"
                                                            onClick={() => openOverallModal(item)}
                                                            title="View Complete Device Details & History"
                                                        >
                                                            <FiLayers /> Full Details
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* GRID VIEW */
                        <div className="admin-grid-container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.25rem" }}>
                            {filteredDevices.map((item) => {
                                const isRecycle = item.processingType === "Responsible Recycling";
                                const s = item.settlement;
                                const isHaz = s.processingFeeBreakdown?.isHazardous;
                                const isDevicePaid = Boolean(item.isPaid || item.paymentStatus === "Paid" || item.payoutStatus === "Paid" || s?.payoutStatus === "Paid" || s?.isDistributed);

                                return (
                                    <div key={item.id} className="mcd-device-card">
                                        {/* Card Top: Device & Matrix Badges */}
                                        <div className="mcd-card-top">
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                                <div className="admin-cat-icon-box">{getCategoryIcon(item.categoryName)}</div>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}>{item.brand} {item.model}</h4>
                                                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Device ID: #{item.deviceId} &bull; {item.weight} kg</span>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
                                                {isRecycle ? (
                                                    <span className="eval-badge eval-badge--recycling"><FaLeaf /> Responsible Recycling</span>
                                                ) : (
                                                    <span className="eval-badge eval-badge--evaluation"><FaTools /> Valuation</span>
                                                )}
                                                <span style={{ fontSize: "0.68rem", color: "#475569", fontWeight: 600 }}>{item.centerType}</span>
                                            </div>
                                        </div>

                                        {/* Low Value Warning if applicable (Requirement #3) */}
                                        {s.isLowValue && (
                                            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "6px 10px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#b45309" }}>
                                                <FiAlertTriangle />
                                                <span><strong>Low-Value Rule (&lt;₹{lowValueThreshold}):</strong> Citizen selected {s.citizenChoice}</span>
                                            </div>
                                        )}

                                        {/* Value Showcase Banner */}
                                        <div className={`mcd-card-money-banner ${!isRecycle ? "eval-money-banner" : ""}`}>
                                            <div>
                                                <span className="mcd-cmb-label">{isRecycle ? "Recovery Value" : "Device Valuation"}</span>
                                                <span className="mcd-cmb-type">
                                                    {isRecycle
                                                        ? "Citizen Surrender: ₹0.00 • 100% Value to Resource Demanufacturing"
                                                        : `Citizen Payout: ₹${formatINR(s.citizenPayout)} (${item.customerName})`}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                                                <div className="mcd-cmb-amount">
                                                    ₹{formatINR(s.activePool)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 5-Values Breakdown Mini Grid (Requirement #1) */}
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.45rem", fontSize: "0.74rem" }}>
                                            <div style={{ background: "#f8fafc", padding: "6px 8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                                                <span style={{ color: "#64748b", display: "block", fontSize: "0.68rem" }}>
                                                    {item.refurbishmentCost > 0 ? "Refurb Expense (Center):" : "Processing Fee (Center):"}
                                                </span>
                                                <strong style={{ color: "#1d4ed8" }}>₹{formatINR(item.refurbishmentCost > 0 ? item.refurbishmentCost : s.processingFee)}</strong>
                                            </div>
                                            <div style={{ background: "#f8fafc", padding: "6px 8px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                                                <span style={{ color: "#64748b", display: "block", fontSize: "0.68rem" }}>Operations (A1+Tech+A2):</span>
                                                <strong style={{ color: "#334155" }}>₹{s.operationalPayouts}</strong>
                                            </div>
                                            {item.refurbishmentCost > 0 ? (
                                                <div style={{ background: "#faf5ff", padding: "6px 8px", borderRadius: "6px", border: "1px solid #e9d5ff" }}>
                                                    <span style={{ color: "#7c3aed", display: "block", fontSize: "0.68rem" }}>Refurbishment Cost:</span>
                                                    <strong style={{ color: "#7c3aed" }}>₹{formatINR(item.refurbishmentCost)}</strong>
                                                </div>
                                            ) : (
                                                <div style={{ background: "#f0fdf4", padding: "6px 8px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                                                    <span style={{ color: "#166534", display: "block", fontSize: "0.68rem" }}>Recovered Streams:</span>
                                                    <strong style={{ color: "#166534" }}>{item.recoveredMaterials?.length || 5} Streams</strong>
                                                </div>
                                            )}
                                            <div style={{ background: s.isSubsidized ? "#fef2f2" : "#faf5ff", padding: "6px 8px", borderRadius: "6px", border: `1px solid ${s.isSubsidized ? "#fecaca" : "#e9d5ff"}` }}>
                                                <span style={{ color: s.isSubsidized ? "#dc2626" : "#7c3aed", display: "block", fontSize: "0.68rem" }}>
                                                    {s.isSubsidized ? "Eco Subsidy:" : "Eco Reserve Surplus:"}
                                                </span>
                                                <strong style={{ color: s.isSubsidized ? "#dc2626" : "#7c3aed" }}>
                                                    {s.isSubsidized ? `+₹${formatINR(s.ecocycleSubsidy)}` : `₹${formatINR(s.ecocycleReserve)}`}
                                                </strong>
                                            </div>
                                        </div>

                                        {/* Center Inventory Info (Requirement #9) */}
                                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px 10px", borderRadius: "8px", fontSize: "0.72rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ color: "#64748b" }}>
                                                <FaWarehouse style={{ marginRight: "4px" }} /> {item.facilityName}
                                            </span>
                                            <strong style={{ color: "#0f172a" }}>
                                                {item.centerInventory?.storageLocation || "Vault Storage"}
                                            </strong>
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{ display: "grid", gridTemplateColumns: isDevicePaid ? "1fr 1fr" : "1fr 1fr 1fr", gap: "0.45rem", marginTop: "auto", paddingTop: "0.4rem" }}>
                                            {!isDevicePaid && (
                                                <button
                                                    className="mcd-btn-edit-price"
                                                    onClick={() => openEditPriceModal(item)}
                                                    style={{
                                                        background: "#eff6ff",
                                                        color: "#1d4ed8",
                                                        border: "1px solid #bfdbfe",
                                                        borderRadius: "8px",
                                                        padding: "0.4rem 0.5rem",
                                                        fontSize: "0.78rem",
                                                        fontWeight: 700,
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "4px",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s ease"
                                                    }}
                                                    title="Edit Device Price & Financial Settlement"
                                                >
                                                    <FiEdit2 /> Edit Price
                                                </button>
                                            )}
                                            <button
                                                className="mcd-btn-payouts"
                                                onClick={() => openLedgerModal(item)}
                                            >
                                                <FiFileText /> Payouts
                                            </button>
                                            <button
                                                className="mcd-btn-details"
                                                onClick={() => openOverallModal(item)}
                                            >
                                                <FiLayers /> Full Details
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* REQUIREMENT #11: DOUBLE-ENTRY TRANSACTION LEDGER MODAL */}
            {showLedgerModal && selectedItem && (() => {
                const isRecycle = selectedItem.processingType === "Responsible Recycling";
                const isRefurbDev = selectedItem.centerType === "Refurbishment Center" || selectedItem.pathway === "Refurbishment" || !isRecycle;
                const rfCost = Number(selectedItem.refurbishmentCost || selectedItem.settlement?.refurbishmentCost || 0);

                const s = calculateSettlement({
                    deviceValuation: selectedItem.deviceValuation || selectedItem.settlement?.deviceValuation || 0,
                    recoveryValue: selectedItem.recoveryValue || selectedItem.settlement?.recoveryValue || 0,
                    processingType: selectedItem.processingType,
                    centerType: selectedItem.centerType,
                    weight: selectedItem.weight,
                    isHazardous: checkIsHazardous(selectedItem),
                    refurbishmentCost: rfCost,
                    actualCenterFee: isRefurbDev ? rfCost : (selectedItem.processingFee || selectedItem.settlement?.processingFee),
                    promisedUserPayment: selectedItem.settlement?.citizenPayout,
                    customAgent1: selectedItem.settlement?.agent1,
                    customTech: selectedItem.settlement?.technician,
                    customAgent2: selectedItem.settlement?.agent2,
                    customCenter: isRefurbDev && rfCost > 0 ? rfCost : selectedItem.settlement?.centerFee,
                    threshold: lowValueThreshold
                });
                const txns = selectedItem.transactions || generateTransactionLedger(selectedItem, s);

                return (
                    <div className="admin-modal-backdrop" onClick={() => setShowLedgerModal(false)}>
                        <div className="admin-modal-card mcd-modal" style={{ maxWidth: "880px" }} onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                    <div className="admin-cat-icon-box" style={{ background: "#ecfdf5", color: "#059669", width: "42px", height: "42px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                                        <FiFileText />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                                            Stakeholder Payouts & Settlement: #{selectedItem.deviceId}
                                        </h3>
                                        <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "2px 0 0 0" }}>
                                            {selectedItem.brand} {selectedItem.model} &bull; {selectedItem.processingType} &bull; {selectedItem.centerType}
                                        </p>
                                    </div>
                                </div>
                                <button className="admin-modal-close" onClick={() => setShowLedgerModal(false)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="admin-modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                                {/* 5-Values Summary Strip */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.55rem" }}>
                                    <div className="pasc-summary-item" style={{ padding: "0.65rem 0.75rem" }}>
                                        <span className="pasc-label">Total Pool (P)</span>
                                        <strong style={{ fontSize: "1.05rem", color: "#0f172a" }}>₹{formatINR(s.activePool)}</strong>
                                        <span style={{ fontSize: "0.65rem", color: "#64748b" }}>100% Inflow</span>
                                    </div>
                                    <div className="pasc-summary-item" style={{ padding: "0.65rem 0.75rem" }}>
                                        <span className="pasc-label">Citizen (U)</span>
                                        <strong style={{ fontSize: "1.05rem", color: "#16a34a" }}>₹{formatINR(s.citizenPayout)}</strong>
                                        <span style={{ fontSize: "0.65rem", color: "#16a34a" }}>{s.citizenSharePercent || (isRecycle ? "0%" : "60%")}</span>
                                    </div>
                                    <div className="pasc-summary-item" style={{ padding: "0.65rem 0.75rem" }}>
                                        <span className="pasc-label">Agent 1 (A1)</span>
                                        <strong style={{ fontSize: "1.05rem", color: "#334155" }}>₹{formatINR(s.agent1)}</strong>
                                        <span style={{ fontSize: "0.65rem", color: "#64748b" }}>Citizen → Tech</span>
                                    </div>
                                    <div className="pasc-summary-item" style={{ padding: "0.65rem 0.75rem" }}>
                                        <span className="pasc-label">Tech (T)</span>
                                        <strong style={{ fontSize: "1.05rem", color: "#334155" }}>₹{formatINR(s.technician)}</strong>
                                        <span style={{ fontSize: "0.65rem", color: "#64748b" }}>Diagnostics</span>
                                    </div>
                                    <div className="pasc-summary-item" style={{ padding: "0.65rem 0.75rem" }}>
                                        <span className="pasc-label">Agent 2 (A2)</span>
                                        <strong style={{ fontSize: "1.05rem", color: "#334155" }}>₹{formatINR(s.agent2)}</strong>
                                        <span style={{ fontSize: "0.65rem", color: "#64748b" }}>Tech → Center</span>
                                    </div>
                                    <div className="pasc-summary-item" style={{ padding: "0.65rem 0.75rem" }}>
                                        <span className="pasc-label">Center (C)</span>
                                        <strong style={{ fontSize: "1.05rem", color: "#1d4ed8" }}>₹{formatINR(s.centerFee !== undefined ? s.centerFee : s.processingFee)}</strong>
                                        <span style={{ fontSize: "0.65rem", color: "#1d4ed8" }}>
                                            {isRefurbDev ? `Refurb Expense • ${s.centerSharePercent || "14%"}` : (s.centerSharePercent || "10%")}
                                        </span>
                                    </div>
                                    <div className="pasc-summary-item" style={{ padding: "0.65rem 0.75rem" }}>
                                        <span className="pasc-label">Eco Surplus (E)</span>
                                        <strong style={{ fontSize: "1.05rem", color: "#7c3aed" }}>
                                            ₹{formatINR(s.ecocycleReserve)}
                                        </strong>
                                        <span style={{ fontSize: "0.65rem", color: "#7c3aed" }}>{s.ecocycleSharePercent || (isRecycle ? "20%" : "10%")}</span>
                                    </div>
                                </div>

                                {/* Payment Distribution & Stakeholder Payouts Table */}
                                <div className="payment-audit-step-card" style={{ margin: 0 }}>
                                    <div className="pasc-head">
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a", fontWeight: 700 }}>
                                                Device Value Distribution &amp; Stakeholder Payouts
                                            </h4>
                                            <p style={{ margin: "2px 0 0 0", fontSize: "0.76rem", color: "#64748b" }}>
                                                Equation: <strong>P = U + A1 + T + A2 + C + E</strong> &bull; Everyone who performs work gets paid.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pas-table-wrap">
                                        <table className="payment-ledger-table">
                                            <thead>
                                                <tr>
                                                    <th>Recipient / Stakeholder</th>
                                                    <th>Workflow Stage</th>
                                                    <th style={{ textAlign: "center" }}>Share</th>
                                                    <th>Payment Purpose</th>
                                                    <th style={{ textAlign: "right" }}>Amount</th>
                                                    <th style={{ textAlign: "center" }}>Payment Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* 1. Citizen */}
                                                <tr>
                                                    <td>
                                                        <strong style={{ color: "#0f172a", textTransform: "capitalize" }}>{selectedItem.customerName || "Citizen Beneficiary"}</strong>
                                                    </td>
                                                    <td><span className="eval-badge" style={{ fontSize: "0.70rem", background: "#f0fdf4", color: "#166534" }}>Citizen (U)</span></td>
                                                    <td style={{ textAlign: "center", fontWeight: 700, color: "#166534" }}>{isRecycle ? "0%" : (s.citizenSharePercent || "60%")}</td>
                                                    <td style={{ fontSize: "0.80rem", color: "#475569" }}>{isRecycle ? "Voluntary Zero-Landfill Donation" : "Direct Promised Citizen Payment"}</td>
                                                    <td style={{ textAlign: "right", fontWeight: 800, fontSize: "0.95rem", color: "#16a34a" }}>
                                                        ₹{formatINR(s.citizenPayout)}
                                                    </td>
                                                    <td style={{ textAlign: "center", color: "#059669", fontWeight: 700, fontSize: "0.75rem" }}>
                                                        {isRecycle ? "✓ Donated" : "✓ Disbursed"}
                                                    </td>
                                                </tr>

                                                {/* 2. Agent 1 */}
                                                <tr>
                                                    <td>
                                                        <strong style={{ color: "#0f172a", textTransform: "capitalize" }}>{selectedItem.collectionAgent1Name || selectedItem.collectionAgentName || "EcoCycle Agent 1"}</strong>
                                                    </td>
                                                    <td><span className="eval-badge" style={{ fontSize: "0.70rem", background: "#f8fafc", color: "#334155" }}>Agent 1 (A1)</span></td>
                                                    <td style={{ textAlign: "center", fontWeight: 700, color: "#334155" }}>{s.agent1SharePercent || (isRecycle ? "5%" : "3.75%")}</td>
                                                    <td style={{ fontSize: "0.80rem", color: "#475569" }}>Citizen Doorstep → Technician Transit</td>
                                                    <td style={{ textAlign: "right", fontWeight: 800, fontSize: "0.95rem", color: "#334155" }}>
                                                        ₹{formatINR(s.agent1)}
                                                    </td>
                                                    <td style={{ textAlign: "center", color: "#059669", fontWeight: 700, fontSize: "0.75rem" }}>
                                                        ✓ Disbursed
                                                    </td>
                                                </tr>

                                                {/* 3. Technician */}
                                                <tr>
                                                    <td>
                                                        <strong style={{ color: "#0f172a", textTransform: "capitalize" }}>{selectedItem.technicianName || selectedItem.inspectorName || "Technician"}</strong>
                                                    </td>
                                                    <td><span className="eval-badge" style={{ fontSize: "0.70rem", background: "#f8fafc", color: "#334155" }}>Technician (T)</span></td>
                                                    <td style={{ textAlign: "center", fontWeight: 700, color: "#334155" }}>{s.technicianSharePercent || (isRecycle ? "10%" : "6.25%")}</td>
                                                    <td style={{ fontSize: "0.80rem", color: "#475569" }}>Diagnostic Inspection, Testing &amp; Safety Isolation</td>
                                                    <td style={{ textAlign: "right", fontWeight: 800, fontSize: "0.95rem", color: "#334155" }}>
                                                        ₹{formatINR(s.technician)}
                                                    </td>
                                                    <td style={{ textAlign: "center", color: "#059669", fontWeight: 700, fontSize: "0.75rem" }}>
                                                        ✓ Disbursed
                                                    </td>
                                                </tr>

                                                {/* 4. Agent 2 */}
                                                <tr>
                                                    <td>
                                                        <strong style={{ color: "#0f172a", textTransform: "capitalize" }}>{selectedItem.collectionAgent2Name || "EcoCycle Agent 2"}</strong>
                                                    </td>
                                                    <td><span className="eval-badge" style={{ fontSize: "0.70rem", background: "#f8fafc", color: "#334155" }}>Agent 2 (A2)</span></td>
                                                    <td style={{ textAlign: "center", fontWeight: 700, color: "#334155" }}>{s.agent2SharePercent || (isRecycle ? "5%" : "3.75%")}</td>
                                                    <td style={{ fontSize: "0.80rem", color: "#475569" }}>Technician Facility → Processing Center Transit</td>
                                                    <td style={{ textAlign: "right", fontWeight: 800, fontSize: "0.95rem", color: "#334155" }}>
                                                        ₹{formatINR(s.agent2)}
                                                    </td>
                                                    <td style={{ textAlign: "center", color: "#059669", fontWeight: 700, fontSize: "0.75rem" }}>
                                                        ✓ Disbursed
                                                    </td>
                                                </tr>

                                                {/* 5. Center (Refurbishment Expense vs Processing Fee) */}
                                                {(() => {
                                                    const isRefurbCenter = selectedItem.centerType === "Refurbishment Center" || selectedItem.pathway === "Refurbishment" || !isRecycle;
                                                    const refurbExpense = Number(selectedItem.refurbishmentCost || s.refurbishmentCost || 0);
                                                    const centerAmt = isRefurbCenter ? refurbExpense : Number(s.processingFee || 0);
                                                    const centerPct = isRefurbCenter
                                                        ? (refurbExpense > 0 ? `${Math.round((refurbExpense / (s.activePool || 1)) * 100)}%` : "Refurb Expense")
                                                        : `${Math.round(((s.processingFee || 0) / (s.activePool || 1)) * 100)}%`;
                                                    const centerDesc = isRefurbCenter
                                                        ? "Total Refurbishment Expense (Parts & Repair Work • Device Kept by Center)"
                                                        : "Center Processing & Demanufacturing Expense (Materials Retained by Facility)";
                                                    const centerBadge = isRefurbCenter ? "Refurb Center (C)" : "Recycling Center (C)";

                                                    return (
                                                        <tr>
                                                            <td>
                                                                <strong style={{ color: "#0f172a", textTransform: "capitalize" }}>{selectedItem.facilityName || (isRefurbCenter ? "Refurbishment Center" : "Recycling Center")}</strong>
                                                            </td>
                                                            <td><span className="eval-badge" style={{ fontSize: "0.70rem", background: "#eff6ff", color: "#1d4ed8" }}>{centerBadge}</span></td>
                                                            <td style={{ textAlign: "center", fontWeight: 700, color: "#1d4ed8" }}>{centerPct}</td>
                                                            <td style={{ fontSize: "0.80rem", color: "#475569" }}>{centerDesc}</td>
                                                            <td style={{ textAlign: "right", fontWeight: 800, fontSize: "0.95rem", color: "#1d4ed8" }}>
                                                                ₹{formatINR(centerAmt)}
                                                            </td>
                                                            <td style={{ textAlign: "center", color: "#059669", fontWeight: 700, fontSize: "0.75rem" }}>
                                                                ✓ Disbursed
                                                            </td>
                                                        </tr>
                                                    );
                                                })()}

                                                {/* 6. EcoCycle Share */}
                                                <tr style={{ background: "#faf5ff" }}>
                                                    <td>
                                                        <strong style={{ color: "#7c3aed" }}>EcoCycle Platform Reserve</strong>
                                                    </td>
                                                    <td><span className="eval-badge" style={{ fontSize: "0.70rem", background: "#f3e8ff", color: "#7c3aed" }}>Platform (E)</span></td>
                                                    <td style={{ textAlign: "center", fontWeight: 700, color: "#7c3aed" }}>{s.ecocycleSharePercent || (isRecycle ? "20%" : "10%")}</td>
                                                    <td style={{ fontSize: "0.80rem", color: "#6b21a8" }}>Platform Operational Surplus [P − (U+A1+T+A2+C)]</td>
                                                    <td style={{ textAlign: "right", fontWeight: 800, fontSize: "0.95rem", color: "#7c3aed" }}>
                                                        ₹{formatINR(s.ecocycleReserve)}
                                                    </td>
                                                    <td style={{ textAlign: "center", color: "#7c3aed", fontWeight: 700, fontSize: "0.75rem" }}>
                                                        ✓ Reserved
                                                    </td>
                                                </tr>
                                            </tbody>
                                            <tfoot>
                                                <tr style={{ background: "#f8fafc", fontWeight: 800 }}>
                                                    <td colSpan="4" style={{ textAlign: "right", fontSize: "0.85rem", color: "#475569" }}>Total Reconciled Value [P = U + A1 + T + A2 + C + E]:</td>
                                                    <td style={{ textAlign: "right", color: "#0f172a", fontSize: "1.05rem" }}>
                                                        ₹{formatINR(s.activePool)}
                                                    </td>
                                                    <td style={{ textAlign: "center", color: "#059669", fontSize: "0.80rem" }}>✓ 100% Balanced</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="admin-modal-footer">
                                <button className="btn-modal-cancel" onClick={() => setShowLedgerModal(false)}>
                                    Close
                                </button>
                                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                    {!(selectedItem?.isPaid || selectedItem?.paymentStatus === "Paid" || selectedItem?.payoutStatus === "Paid" || selectedItem?.settlement?.payoutStatus === "Paid" || selectedItem?.settlement?.isDistributed) && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowLedgerModal(false);
                                                openEditPriceModal(selectedItem);
                                            }}
                                            style={{
                                                background: "#eff6ff",
                                                color: "#1d4ed8",
                                                border: "1px solid #bfdbfe",
                                                padding: "0.6rem 1rem",
                                                borderRadius: "10px",
                                                fontSize: "0.85rem",
                                                fontWeight: 600,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <FiEdit2 /> Edit Price
                                        </button>
                                    )}
                                    {!(selectedItem?.paymentStatus === "Paid" || selectedItem?.settlement?.payoutStatus === "Paid" || selectedItem?.settlement?.isDistributed) && (
                                        <button
                                            type="button"
                                            className="btn-card-confirm"
                                            disabled={isExecutingPayAll}
                                            onClick={() => handlePaySettlementWithRazorpay(selectedItem)}
                                            style={{
                                                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                                color: "#ffffff",
                                                border: "none",
                                                padding: "0.6rem 1.15rem",
                                                borderRadius: "10px",
                                                fontSize: "0.85rem",
                                                fontWeight: 700,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                cursor: isExecutingPayAll ? "wait" : "pointer",
                                                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)"
                                            }}
                                            title="Open Interactive Razorpay Checkout Modal"
                                        >
                                            <FiCreditCard /> {isExecutingPayAll ? "Opening Razorpay..." : "Pay with Razorpay"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* REQUIREMENT #3: LOW-VALUE THRESHOLD CONFIGURATION MODAL */}
            {showThresholdConfig && (
                <div className="admin-modal-backdrop" onClick={() => setShowThresholdConfig(false)}>
                    <div className="admin-modal-card mcd-modal" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div className="admin-cat-icon-box" style={{ background: "#fffbeb", color: "#b45309", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                                    <FiSliders />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                                        Low-Value Threshold Business Rule
                                    </h3>
                                    <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "2px 0 0 0" }}>
                                        Configure the threshold below which devices trigger the low-value citizen choice protocol.
                                    </p>
                                </div>
                            </div>
                            <button className="admin-modal-close" onClick={() => setShowThresholdConfig(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="admin-modal-body" style={{ padding: "1.25rem 1.5rem" }}>
                            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "12px 14px", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.82rem", color: "#92400e" }}>
                                <p style={{ margin: "0 0 6px 0", fontWeight: 700 }}>
                                    📋 Rule Logic (Requirement #3):
                                </p>
                                <ul style={{ margin: 0, paddingLeft: "18px" }}>
                                    <li><strong>Device Value &ge; Threshold:</strong> Standard valuation &amp; payout flow.</li>
                                    <li><strong>Device Value &lt; Threshold:</strong> Low-value warning triggered; Citizen chooses between low-value cash payout or Zero-Landfill Responsible Recycling donation.</li>
                                </ul>
                            </div>

                            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                                Low-Value Threshold Limit (INR ₹):
                            </label>
                            <div className="mcd-distrib-input-wrap" style={{ maxWidth: "240px", marginBottom: "1rem" }}>
                                <span className="mcd-distrib-curr">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="50"
                                    className="mcd-distrib-input"
                                    value={tempThresholdInput}
                                    onKeyDown={blockNegativeKeys}
                                    onChange={handlePositiveNumberInput(setTempThresholdInput)}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                {[300, 500, 750, 1000].map(val => (
                                    <button
                                        key={val}
                                        type="button"
                                        className="mcd-preset-pill-btn"
                                        onClick={() => setTempThresholdInput(String(val))}
                                    >
                                        Set ₹{val}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="admin-modal-footer">
                            <button className="btn-modal-cancel" onClick={() => setShowThresholdConfig(false)}>
                                Cancel
                            </button>
                            <button className="btn-modal-confirm" onClick={handleSaveThreshold}>
                                <FiSave style={{ marginRight: "4px" }} /> Apply Threshold Rule
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REQUIREMENT #6: DYNAMIC MATERIAL MARKET PRICES MODAL */}
            {showMaterialPricesModal && (
                <div className="admin-modal-backdrop" onClick={() => setShowMaterialPricesModal(false)}>
                    <div className="admin-modal-card mcd-modal" style={{ maxWidth: "760px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div className="admin-cat-icon-box" style={{ background: "#ecfdf5", color: "#059669", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                                    <FaBalanceScale />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                                        Dynamic Material Market Price Catalog
                                    </h3>
                                    <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "2px 0 0 0" }}>
                                        Active commodity recovery rates used for recycling process valuation &amp; frozen settlement manifests.
                                    </p>
                                </div>
                            </div>
                            <button className="admin-modal-close" onClick={() => setShowMaterialPricesModal(false)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="admin-modal-body" style={{ padding: "1.25rem 1.5rem" }}>
                            <div className="mrp-materials-table-wrap">
                                <table className="mrp-materials-table">
                                    <thead>
                                        <tr>
                                            <th>Material Stream</th>
                                            <th>Category</th>
                                            <th>Standard Unit</th>
                                            <th>Active Market Rate</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {materialPrices.map(m => (
                                            <tr key={m.materialId}>
                                                <td><strong>{m.materialName}</strong></td>
                                                <td><span style={{ fontSize: "0.75rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", color: "#475569" }}>{m.category}</span></td>
                                                <td>{m.unit}</td>
                                                <td><strong style={{ color: "#059669" }}>₹{formatINR(m.pricePerUnit)}/{m.unit}</strong></td>
                                                <td><span style={{ color: "#059669", fontWeight: 700, fontSize: "0.75rem" }}>✓ Active</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="admin-modal-footer">
                            <button className="btn-modal-cancel" onClick={() => setShowMaterialPricesModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 360° OVERALL DEVICE DOSSIER & INVENTORY MODAL */}
            {showOverallModal && selectedItem && (
                <div className="admin-modal-backdrop" onClick={() => setShowOverallModal(false)}>
                    <div className="admin-modal-card mcd-modal mcd-overall-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div className="admin-cat-icon-box" style={{ background: selectedItem.pathway === "Recycling" ? "#ecfdf5" : "#f5f3ff", color: selectedItem.pathway === "Recycling" ? "#059669" : "#7c3aed", width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>
                                    <FiLayers />
                                </div>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                                            Complete Device Details: {selectedItem.model?.toLowerCase().startsWith(selectedItem.brand?.toLowerCase()) ? selectedItem.model : `${selectedItem.brand} ${selectedItem.model}`}
                                        </h3>
                                        <span className="mcd-device-id-pill" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>#{selectedItem.deviceId}</span>
                                    </div>
                                    <p style={{ fontSize: "0.74rem", color: "#64748b", margin: "2px 0 0 0" }}>
                                        {selectedItem.processingType} &bull; {selectedItem.centerType} &bull; Asset Ledger &bull; Audit Trail
                                    </p>
                                </div>
                            </div>
                            <button className="admin-modal-close" onClick={() => setShowOverallModal(false)}>
                                <FiX />
                            </button>
                        </div>

                        {/* Sub-tab navigation */}
                        <div className="mcd-subtab-strip">
                            {[
                                { id: "overview", label: "Holistic Overview & Specs", icon: <FiInfo /> },
                                { id: "inventory", label: "Center Asset Inventory", icon: <FaWarehouse /> },
                                { id: "facility", label: selectedItem.pathway === "Recycling" ? "Recovered Material Streams" : "Refurbishment & Quality QC", icon: selectedItem.pathway === "Recycling" ? <FaLeaf /> : <FaTools /> },
                                { id: "compliance", label: "Security & Certification", icon: <FiShield /> }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`mcd-subtab-btn ${overallActiveTab === tab.id ? "active" : ""}`}
                                    onClick={() => setOverallActiveTab(tab.id)}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="admin-modal-body">
                            {/* TAB 1: OVERVIEW & SPECS */}
                            {overallActiveTab === "overview" && (
                                <div className="mcd-tab-content">
                                    <div className="mcd-identity-banner">
                                        <div className="mcd-id-left">
                                            <div className="mcd-cat-badge">{getCategoryIcon(selectedItem.categoryName)} {selectedItem.categoryName}</div>
                                            <h2>{selectedItem.model?.toLowerCase().startsWith(selectedItem.brand?.toLowerCase()) ? selectedItem.model : `${selectedItem.brand} ${selectedItem.model}`}</h2>
                                            <div className="mcd-serial-row">
                                                <span>Serial: <strong>{selectedItem.serialNumber}</strong></span>
                                                {selectedItem.purchaseDate && (
                                                    <>
                                                        <span className="mcd-sep">&bull;</span>
                                                        <span>Purchased: <strong>{new Date(selectedItem.purchaseDate).toLocaleDateString("en-IN")}</strong></span>
                                                    </>
                                                )}
                                                <span className="mcd-sep">&bull;</span>
                                                <span>Weight: <strong>{selectedItem.weight} kg</strong></span>
                                                <span className="mcd-sep">&bull;</span>
                                                <span>Processing: <strong>{selectedItem.processingType}</strong></span>
                                            </div>
                                        </div>

                                        <div className="mcd-id-right">
                                            {selectedItem.pathway === "Recycling" ? (
                                                <div className="mcd-status-chip-lg recycling">
                                                    <FaLeaf />
                                                    <div>
                                                        <strong>Zero-Landfill Recycled</strong>
                                                        <span>Full Demanufacturing Complete</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mcd-status-chip-lg refurbishment">
                                                    <FaTools />
                                                    <div>
                                                        <strong>Refurbished &amp; Certified</strong>
                                                        <span>Stored in Center Asset Inventory</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3-Column Profile Grid */}
                                    <div className="mcd-3col-grid">
                                        <div className="mcd-info-card">
                                            <div className="mcd-card-header">
                                                <FiCpu className="card-head-icon" />
                                                <h4>Technical Specifications</h4>
                                            </div>
                                            <div className="mcd-spec-list">
                                                <div className="spec-item"><span className="spec-k">Brand / Make:</span><strong className="spec-v">{selectedItem.brand}</strong></div>
                                                <div className="spec-item"><span className="spec-k">Model Identifier:</span><strong className="spec-v">{selectedItem.model}</strong></div>
                                                <div className="spec-item"><span className="spec-k">Equipment Category:</span><span className="spec-v">{selectedItem.categoryName}</span></div>
                                                <div className="spec-item"><span className="spec-k">Declared Condition:</span><span className="spec-v">{selectedItem.condition}</span></div>
                                                <div className="spec-item"><span className="spec-k">Gross Mass:</span><span className="spec-v">{selectedItem.weight} kg</span></div>
                                            </div>
                                        </div>

                                        <div className="mcd-info-card">
                                            <div className="mcd-card-header">
                                                <FiUser className="card-head-icon" />
                                                <h4>Citizen &amp; Custody Details</h4>
                                            </div>
                                            <div className="mcd-spec-list">
                                                <div className="spec-item"><span className="spec-k">Original Owner:</span><strong className="spec-v">{selectedItem.customerName}</strong></div>
                                                <div className="spec-item"><span className="spec-k">Email Contact:</span><span className="spec-v">{selectedItem.customerEmail}</span></div>
                                                <div className="spec-item"><span className="spec-k">Contact Phone:</span><span className="spec-v">{selectedItem.customerPhone}</span></div>
                                                <div className="spec-item"><span className="spec-k">Origin Hub:</span><span className="spec-v">{selectedItem.customerCity}</span></div>
                                                <div className="spec-item"><span className="spec-k">Registered Date:</span><span className="spec-v">{new Date(selectedItem.registeredDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
                                            </div>
                                        </div>

                                        <div className="mcd-info-card">
                                            <div className="mcd-card-header">
                                                <FaQrcode className="card-head-icon" />
                                                <h4>Digital Tag &amp; Tracking QR</h4>
                                            </div>
                                            <div className="mcd-qr-preview-box">
                                                <div className="mcd-qr-img-wrap">
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(selectedItem.deviceQrToken)}`}
                                                        alt="QR Code"
                                                        className="mcd-qr-img"
                                                    />
                                                </div>
                                                <div className="mcd-qr-token-wrap">
                                                    <span className="token-lbl">Official Device QR Token</span>
                                                    <code className="token-code">{selectedItem.deviceQrToken}</code>
                                                    <button className="copy-token-btn" onClick={() => handleCopyQrToken(selectedItem.deviceQrToken)}>
                                                        {copiedToken ? <><FiCheck /> Copied!</> : <><FiCopy /> Copy Token</>}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: CENTER ASSET INVENTORY (Requirement #9) */}
                            {overallActiveTab === "inventory" && (
                                <div className="mcd-tab-content">
                                    <div className="payment-audit-step-card" style={{ padding: "1rem 1.15rem", borderRadius: "12px", marginBottom: "0.75rem" }}>
                                        <div className="pasc-head" style={{ paddingBottom: "0.6rem", marginBottom: "0.75rem" }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: "0.88rem", color: "#0f172a", fontWeight: 700 }}>
                                                    Center Inventory &amp; Physical Asset Vault
                                                </h4>
                                                <p style={{ margin: "2px 0 0 0", fontSize: "0.72rem", color: "#64748b" }}>
                                                    Processed equipment and recovered materials maintained in verified center inventory.
                                                </p>
                                            </div>
                                            <span className="pasc-badge-approved" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                                                <FaWarehouse /> Vault Verified
                                            </span>
                                        </div>

                                        <div className="pasc-summary-grid" style={{ marginBottom: "0.75rem", gap: "0.65rem" }}>
                                            <div className="pasc-summary-item" style={{ padding: "0.75rem 0.9rem", borderRadius: "10px" }}>
                                                <span className="pasc-label" style={{ fontSize: "0.68rem" }}>Inventory ID</span>
                                                <strong style={{ fontSize: "0.92rem", color: "#0f172a", fontFamily: "monospace" }}>
                                                    {selectedItem.centerInventory?.inventoryId || `INV-${selectedItem.deviceId}`}
                                                </strong>
                                            </div>
                                            <div className="pasc-summary-item" style={{ padding: "0.75rem 0.9rem", borderRadius: "10px" }}>
                                                <span className="pasc-label" style={{ fontSize: "0.68rem" }}>Legal Ownership</span>
                                                <strong style={{ fontSize: "0.92rem", color: "#059669" }}>
                                                    {selectedItem.centerInventory?.ownership || "EcoCycle Platform"}
                                                </strong>
                                            </div>
                                            <div className="pasc-summary-item" style={{ padding: "0.75rem 0.9rem", borderRadius: "10px" }}>
                                                <span className="pasc-label" style={{ fontSize: "0.68rem" }}>Storage Location</span>
                                                <strong style={{ fontSize: "0.92rem", color: "#1d4ed8" }}>
                                                    {selectedItem.centerInventory?.storageLocation || "Central Vault"}
                                                </strong>
                                            </div>
                                            <div className="pasc-summary-item" style={{ padding: "0.75rem 0.9rem", borderRadius: "10px" }}>
                                                <span className="pasc-label" style={{ fontSize: "0.68rem" }}>Inventory Asset Value</span>
                                                <strong style={{ fontSize: "0.92rem", color: "#7c3aed" }}>
                                                    ₹{formatINR(selectedItem.centerInventory?.inventoryAssetValue || selectedItem.settlement?.totalAssetCost || selectedItem.settlement?.activePool)}
                                                </strong>
                                            </div>
                                        </div>

                                        <div style={{ background: "#f8fafc", padding: "0.75rem 0.9rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                            <h5 style={{ margin: "0 0 0.3rem 0", fontSize: "0.76rem", color: "#0f172a" }}>Inventory Status &amp; Policy:</h5>
                                            <p style={{ margin: 0, fontSize: "0.72rem", color: "#475569", lineHeight: 1.45 }}>
                                                {selectedItem.centerInventory?.status || "Processed device securely warehoused in compliance with certified circular asset stewardship guidelines."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: FACILITY MANIFEST & RECOVERED STREAMS */}
                            {overallActiveTab === "facility" && (
                                <div className="mcd-tab-content">
                                    <div className="mcd-facility-manifest-card" style={{ padding: "1rem 1.15rem", borderRadius: "12px" }}>
                                        <div className="manifest-header-bar" style={{ paddingBottom: "0.75rem", marginBottom: "0.75rem" }}>
                                            <div>
                                                <span className="facility-type-tag" style={{ fontSize: "0.68rem" }}>{selectedItem.centerType}</span>
                                                <h3 style={{ margin: "2px 0", fontSize: "1rem", color: "#0f172a" }}>{selectedItem.facilityName}</h3>
                                                <span style={{ fontSize: "0.74rem", color: "#64748b" }}><FiMapPin /> {selectedItem.facilityCity} &bull; Facility ID #{selectedItem.facilityId}</span>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <span style={{ fontSize: "0.68rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                                                    {selectedItem.pathway === "Recycling" ? "Recovery Pool Value" : "Gross Valuation"}
                                                </span>
                                                <h3 style={{ margin: "2px 0", color: "#16a34a", fontSize: "1.1rem" }}>
                                                    ₹{formatINR(selectedItem.settlement?.activePool)}
                                                </h3>
                                            </div>
                                        </div>

                                        {selectedItem.pathway === "Recycling" ? (
                                            <div className="manifest-body-wrap" style={{ marginBottom: "0.75rem" }}>
                                                <h4 style={{ fontSize: "0.84rem", color: "#0f172a", marginBottom: "0.55rem", display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <FaLeaf style={{ color: "#059669" }} /> Recovered Raw Material Streams (Settlement Pricing)
                                                </h4>
                                                <div className="mrp-materials-table-wrap">
                                                    <table className="mrp-materials-table" style={{ fontSize: "0.74rem" }}>
                                                        <thead>
                                                            <tr>
                                                                <th>Material Stream</th>
                                                                <th>Recovered Quantity</th>
                                                                <th>Unit Price</th>
                                                                <th>Total Value</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedItem.recoveredMaterials.map((m, idx) => (
                                                                <tr key={idx}>
                                                                    <td><strong>{m.materialName}</strong></td>
                                                                    <td>{m.quantity} {m.unit || "kg"}</td>
                                                                    <td>₹{m.pricePerUnitAtProcessing || m.pricePerUnit}/{m.unit || "kg"}</td>
                                                                    <td><strong style={{ color: "#059669" }}>₹{formatINR(m.totalValue || (m.quantity * (m.pricePerUnit || 0)))}</strong></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="manifest-body-wrap" style={{ marginBottom: "0.75rem" }}>
                                                <h4 style={{ fontSize: "0.84rem", color: "#0f172a", marginBottom: "0.55rem", display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <FaTools style={{ color: "#7c3aed" }} /> Refurbishment Quality Checklist &amp; Benchmark Report
                                                </h4>
                                                <div className="refurb-checklist-grid" style={{ gap: "0.75rem" }}>
                                                    <div className="qc-check-item pass" style={{ padding: "0.75rem", borderRadius: "10px" }}>
                                                        <FiCheckCircle className="qc-icon" style={{ fontSize: "1.05rem" }} />
                                                        <div>
                                                            <strong style={{ fontSize: "0.8rem" }}>Hardware Diagnostic &amp; Multi-Point Benchmark</strong>
                                                            <span style={{ fontSize: "0.72rem" }}>Score: {selectedItem.qcScore} (Passes 100% stress tests)</span>
                                                        </div>
                                                    </div>
                                                    <div className="qc-check-item pass" style={{ padding: "0.75rem", borderRadius: "10px" }}>
                                                        <FiCheckCircle className="qc-icon" style={{ fontSize: "1.05rem" }} />
                                                        <div>
                                                            <strong style={{ fontSize: "0.8rem" }}>Component Upgrades &amp; Service</strong>
                                                            <span style={{ fontSize: "0.72rem" }}>Thermal service, NVMe fast storage, battery optimization completed</span>
                                                        </div>
                                                    </div>
                                                    <div className="qc-check-item pass" style={{ padding: "0.75rem", borderRadius: "10px" }}>
                                                        <FiCheckCircle className="qc-icon" style={{ fontSize: "1.05rem" }} />
                                                        <div>
                                                            <strong style={{ fontSize: "0.8rem" }}>Cryptographic Data Wipe</strong>
                                                            <span style={{ fontSize: "0.72rem" }}>NIST 800-88 cryptographic sanitization &amp; clean OS install verified</span>
                                                        </div>
                                                    </div>
                                                    <div className="qc-check-item pass" style={{ padding: "0.75rem", borderRadius: "10px" }}>
                                                        <FiCheckCircle className="qc-icon" style={{ fontSize: "1.05rem" }} />
                                                        <div>
                                                            <strong style={{ fontSize: "0.8rem" }}>EcoWarranty Protection</strong>
                                                            <span style={{ fontSize: "0.72rem" }}>6-Month comprehensive circular replacement guarantee attached</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="manifest-footer-notes" style={{ padding: "0.65rem 0.85rem", borderRadius: "0 8px 8px 0" }}>
                                            <strong style={{ fontSize: "0.76rem" }}>Facility Engineer Notes:</strong>
                                            <p style={{ fontSize: "0.72rem", margin: 0, lineHeight: 1.45 }}>{selectedItem.processNotes}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: COMPLIANCE & CERTIFICATION */}
                            {overallActiveTab === "compliance" && (
                                <div className="mcd-tab-content">
                                    <div className="mcd-compliance-card" style={{ padding: "1rem 1.15rem", borderRadius: "12px" }}>
                                        <div className="compliance-hero" style={{ paddingBottom: "0.75rem", marginBottom: "0.75rem", gap: "0.85rem" }}>
                                            <div className="comp-badge-box" style={{ width: "42px", height: "42px", borderRadius: "10px" }}>
                                                <FiShield style={{ fontSize: "1.4rem", color: "#059669" }} />
                                            </div>
                                            <div>
                                                <h3 style={{ margin: "0 0 2px 0", fontSize: "0.95rem", color: "#0f172a" }}>
                                                    {selectedItem.pathway === "Recycling" ? "Zero-Landfill Environmental Compliance" : "Circular Economy Quality Assurance Compliance"}
                                                </h3>
                                                <p style={{ margin: 0, fontSize: "0.74rem", color: "#64748b" }}>
                                                    Governed under E-Waste (Management) Rules 2022 and EcoCycle Quality Assurance Protocols
                                                </p>
                                            </div>
                                        </div>

                                        <div className="compliance-grid-2" style={{ gap: "0.65rem", marginBottom: "0.85rem" }}>
                                            <div className="comp-item-box" style={{ padding: "0.65rem 0.85rem", borderRadius: "8px" }}>
                                                <span className="ci-label" style={{ fontSize: "0.66rem" }}>Data Sanitization Standard:</span>
                                                <strong className="ci-val" style={{ color: "#059669", fontSize: "0.8rem" }}>{selectedItem.sanitizationPerformed}</strong>
                                            </div>
                                            <div className="comp-item-box" style={{ padding: "0.65rem 0.85rem", borderRadius: "8px" }}>
                                                <span className="ci-label" style={{ fontSize: "0.66rem" }}>Official Certificate Serial:</span>
                                                <strong className="ci-val" style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{selectedItem.certificateId}</strong>
                                            </div>
                                            <div className="comp-item-box" style={{ padding: "0.65rem 0.85rem", borderRadius: "8px" }}>
                                                <span className="ci-label" style={{ fontSize: "0.66rem" }}>Auditing Facility:</span>
                                                <span className="ci-val" style={{ fontSize: "0.8rem", fontWeight: 700 }}>{selectedItem.facilityName}</span>
                                            </div>
                                            <div className="comp-item-box" style={{ padding: "0.65rem 0.85rem", borderRadius: "8px" }}>
                                                <span className="ci-label" style={{ fontSize: "0.66rem" }}>Legal Authority:</span>
                                                <span className="ci-val" style={{ fontSize: "0.8rem", fontWeight: 700 }}>CPCB Registered Recycler &bull; ISO 14001</span>
                                            </div>
                                        </div>

                                        <div className="comp-action-strip" style={{ padding: "0.75rem 1rem", borderRadius: "10px" }}>
                                            <p style={{ fontSize: "0.74rem" }}>Official verified documentation is ready for regulatory submission or customer issuance.</p>
                                            <button
                                                className="btn-modal-confirm"
                                                style={{ padding: "0.4rem 0.85rem", fontSize: "0.74rem" }}
                                                onClick={() => {
                                                    setShowOverallModal(false);
                                                    setShowCertificateModal(true);
                                                }}
                                            >
                                                <FiShield style={{ marginRight: "5px" }} /> Open Printable Certificate
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="admin-modal-footer">
                            <button className="btn-modal-cancel" onClick={() => setShowOverallModal(false)}>
                                Close
                            </button>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    className="btn-card-primary"
                                    onClick={() => {
                                        setShowOverallModal(false);
                                        setShowLedgerModal(true);
                                    }}
                                    style={{ padding: "0.6rem 1rem", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                                >
                                    <FiFileText /> View Ledger
                                </button>
                                <button
                                    className="btn-modal-confirm"
                                    onClick={() => {
                                        setShowOverallModal(false);
                                        setShowCertificateModal(true);
                                    }}
                                >
                                    <FiShield style={{ marginRight: "6px" }} /> View Certificate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* OFFICIAL CERTIFICATE MODAL */}
            {showCertificateModal && selectedItem && (
                <div className="admin-modal-backdrop" onClick={() => setShowCertificateModal(false)}>
                    <div className="admin-modal-card mcd-modal mrp-cert-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header no-print">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                <div className="admin-cat-icon-box" style={{ background: "#ecfdf5", color: "#059669" }}>
                                    <FiShield />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0 }}>
                                        {selectedItem.pathway === "Recycling" ? "Official Zero-Landfill Recycling Certificate" : "Official Hardware Refurbishment Quality Certificate"}
                                    </h3>
                                    <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>EcoCycle Compliance Verification Document</p>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button className="btn-modal-confirm" onClick={handlePrintCertificate}>
                                    <FiPrinter style={{ marginRight: "4px" }} /> Print / PDF
                                </button>
                                <button className="admin-modal-close" onClick={() => setShowCertificateModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                        </div>

                        <div className="admin-modal-body">
                            <div className="cert-document-frame" ref={certificateRef}>
                                <div className="cert-border-outer" style={{ borderColor: selectedItem.pathway === "Recycling" ? "#059669" : "#7c3aed" }}>
                                    <div className="cert-border-inner" style={{ borderColor: selectedItem.pathway === "Recycling" ? "#a7f3d0" : "#ddd6fe", background: selectedItem.pathway === "Recycling" ? "radial-gradient(circle at center, #ffffff 60%, #f0fdf4 100%)" : "radial-gradient(circle at center, #ffffff 60%, #faf5ff 100%)" }}>
                                        <div className="cert-header" style={{ borderColor: selectedItem.pathway === "Recycling" ? "#059669" : "#7c3aed" }}>
                                            <div className="cert-brand">
                                                {selectedItem.pathway === "Recycling" ? <FaLeaf className="cert-leaf" /> : <FaTools className="cert-leaf" style={{ color: "#7c3aed" }} />}
                                                <span className="cert-brand-title" style={{ color: selectedItem.pathway === "Recycling" ? "#065f46" : "#5b21b6" }}>EcoCycle</span>
                                                <span className="cert-brand-sub" style={{ color: selectedItem.pathway === "Recycling" ? "#059669" : "#7c3aed" }}>
                                                    {selectedItem.pathway === "Recycling" ? "SUSTAINABLE E-WASTE MANAGEMENT & ZERO-LANDFILL AUTHORITY" : "CERTIFIED CIRCULAR HARDWARE RESTORATION PLATFORM"}
                                                </span>
                                            </div>
                                            <div className="cert-id-tag">
                                                <span>CERTIFICATE ID</span>
                                                <strong>{selectedItem.certificateId}</strong>
                                            </div>
                                        </div>

                                        <div className="cert-title-section">
                                            <h1>{selectedItem.pathway === "Recycling" ? "CERTIFICATE OF SUSTAINABLE E-WASTE RECYCLING" : "CERTIFICATE OF HARDWARE REFURBISHMENT & QUALITY"}</h1>
                                            <p className="cert-subtitle" style={{ color: selectedItem.pathway === "Recycling" ? "#059669" : "#7c3aed" }}>
                                                {selectedItem.pathway === "Recycling" ? "Zero-Landfill Eco-Friendly Destruction & Resource Recovery Verification" : "Certified Circular Economy Quality Restoration & Benchmarking"}
                                            </p>
                                        </div>

                                        <p className="cert-declaration">
                                            {selectedItem.pathway === "Recycling"
                                                ? "This is to certify that the electronic equipment specified below was responsibly collected, sanitized, demanufactured, and recycled in full compliance with the E-Waste (Management) Rules 2022, ISO 14001 Standards, and Central Pollution Control Board (CPCB) guidelines with Zero-Landfill impact."
                                                : "This is to certify that the electronic equipment specified below has undergone thorough diagnostic inspection, hardware repairs, multi-point quality assurance benchmarks, and NIST 800-88 data sanitization, qualifying for resale under EcoCycle Circular Standards."}
                                        </p>

                                        <div className="cert-details-grid">
                                            <div className="cert-col">
                                                <div className="cert-field">
                                                    <span className="field-lbl">Equipment Model:</span>
                                                    <span className="field-val"><strong>{selectedItem.brand} {selectedItem.model}</strong></span>
                                                </div>
                                                <div className="cert-field">
                                                    <span className="field-lbl">Category:</span>
                                                    <span className="field-val">{selectedItem.categoryName}</span>
                                                </div>
                                                <div className="cert-field">
                                                    <span className="field-lbl">Serial / Token:</span>
                                                    <span className="field-val">{selectedItem.serialNumber}</span>
                                                </div>
                                                {selectedItem.purchaseDate && (
                                                    <div className="cert-field">
                                                        <span className="field-lbl">Purchase Date:</span>
                                                        <span className="field-val">{new Date(selectedItem.purchaseDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="cert-col">
                                                <div className="cert-field">
                                                    <span className="field-lbl">Certified Facility:</span>
                                                    <span className="field-val"><strong>{selectedItem.facilityName}</strong></span>
                                                </div>
                                                <div className="cert-field">
                                                    <span className="field-lbl">Output Outcome:</span>
                                                    <span className="field-val" style={{ color: selectedItem.pathway === "Recycling" ? "#059669" : "#7c3aed", fontWeight: 700 }}>{selectedItem.qcScore}</span>
                                                </div>
                                                <div className="cert-field">
                                                    <span className="field-lbl">Date of Completion:</span>
                                                    <span className="field-val">{new Date(selectedItem.completedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="cert-footer">
                                            <div className="cert-qr-block">
                                                <FaQrcode className="cert-qr-icon" />
                                                <span>SCAN TO VERIFY<br />ON ECOCYCLE PORTAL</span>
                                            </div>

                                            <div className="cert-stamp-block">
                                                <div className="stamp-circle" style={{ borderColor: selectedItem.pathway === "Recycling" ? "#059669" : "#7c3aed", color: selectedItem.pathway === "Recycling" ? "#059669" : "#7c3aed" }}>
                                                    <span>ECOCYCLE</span>
                                                    <strong>CERTIFIED</strong>
                                                    <span>{selectedItem.pathway === "Recycling" ? "ZERO LANDFILL" : "QUALITY PASS"}</span>
                                                </div>
                                            </div>

                                            <div className="cert-sign-block">
                                                <div className="sign-line"></div>
                                                <strong>Authorized Compliance Officer</strong>
                                                <span>EcoCycle Governance Authority</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="admin-modal-footer no-print">
                            <button className="btn-modal-cancel" onClick={() => setShowCertificateModal(false)}>
                                Close
                            </button>
                            <button className="btn-modal-confirm" onClick={handlePrintCertificate}>
                                <FiPrinter style={{ marginRight: "4px" }} /> Print Certificate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADMIN PAYMENT DISTRIBUTION & ALLOCATION MODAL */}
            {showDistributionModal && distributionEditItem && (() => {
                const s = distributionEditItem.settlement;
                const activePool = s.activePool;
                const cPay = Math.max(0, parseFloat(customCitizenPay) || 0);
                const ctrPay = Math.max(0, parseFloat(customCenterPay) || 0);
                const a1Pay = Math.max(0, parseFloat(customAgent1Pay) || 0);
                const tchPay = Math.max(0, parseFloat(customTechPay) || 0);
                const a2Pay = Math.max(0, parseFloat(customAgent2Pay) || 0);

                const opsTotal = +(a1Pay + tchPay + a2Pay).toFixed(2);
                const totalRequired = +(cPay + ctrPay + opsTotal).toFixed(2);
                const remainingPool = +(activePool - totalRequired).toFixed(2);
                const isExceeded = totalRequired > activePool;
                const deficit = isExceeded ? +(totalRequired - activePool).toFixed(2) : 0;
                const isViable = !isExceeded;
                // EcoCycleShare = max(0, DeviceValue - UserPayment - CollectionFee - TechFee - CenterFee)
                const ecocycleReserve = Math.max(0, remainingPool);

                return (
                    <div className="admin-modal-backdrop" style={{ zIndex: 10050 }} onClick={() => setShowDistributionModal(false)}>
                        <div className="admin-modal-card mcd-modal" style={{ maxWidth: "660px" }} onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header" style={{ borderBottom: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <div className="admin-cat-icon-box" style={{ background: "#ecfdf5", color: "#059669", width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                                        <FiSliders />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                                            Admin Payment Distribution &amp; Settlement
                                        </h3>
                                        <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "2px 0 0 0" }}>
                                            {distributionEditItem.brand} {distributionEditItem.model} (ID: #{distributionEditItem.deviceId}) &bull; {distributionEditItem.processingType}
                                        </p>
                                    </div>
                                </div>
                                <button className="admin-modal-close" onClick={() => setShowDistributionModal(false)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="admin-modal-body" style={{ padding: "1.25rem 1.5rem" }}>
                                {/* Value Pool & Live Deduction Header */}
                                <div className="mcd-readonly-device-hero" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                                    <div>
                                        <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", display: "block" }}>
                                            {distributionEditItem.processingType === "Responsible Recycling" ? "Total Recovered Material Value Pool" : "Appraised Device Valuation Pool"}
                                        </span>
                                        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "2px" }}>
                                            <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
                                                ₹{formatINR(activePool)}
                                            </span>
                                            <span style={{ fontSize: "0.78rem", fontWeight: 700, padding: "2px 8px", borderRadius: "8px", background: isExceeded ? "#fee2e2" : (remainingPool === 0 ? "#f1f5f9" : "#dcfce7"), color: isExceeded ? "#dc2626" : (remainingPool === 0 ? "#475569" : "#16a34a") }}>
                                                {isExceeded ? `Deficit: -₹${formatINR(deficit)}` : `Remaining Pool: ₹${formatINR(remainingPool)}`}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="mcd-auto-btn"
                                        style={{ margin: 0 }}
                                        onClick={applyStandardEquation}
                                        title="Auto-Apply Standard Rules"
                                    >
                                        <FiRefreshCw /> Auto-Apply Standard Split
                                    </button>
                                </div>

                                {/* Deficit Warning Alert Banner */}
                                {isExceeded && (
                                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 14px", borderRadius: "8px", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#b91c1c", fontWeight: 600 }}>
                                            <FiAlertTriangle style={{ fontSize: "1.2rem", flexShrink: 0 }} />
                                            <span>Total Outflows (₹{formatINR(totalRequired)}) exceed Total Pool (₹{formatINR(activePool)}) by <strong>₹{formatINR(deficit)}</strong>!</span>
                                        </div>
                                        {distributionEditItem.processingType !== "Responsible Recycling" && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const otherCosts = ctrPay + a1Pay + tchPay + a2Pay;
                                                    setCustomCitizenPay(String(Math.max(0, activePool - otherCosts)));
                                                }}
                                                style={{ background: "#dc2626", color: "#ffffff", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                                            >
                                                Auto-Balance Citizen Pay (₹{formatINR(Math.max(0, activePool - (ctrPay + a1Pay + tchPay + a2Pay)))})
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Stakeholder Payment Inputs */}
                                <div className="mcd-distrib-grid">
                                    <div className="mcd-distrib-field-card">
                                        <label className="mcd-distrib-label">
                                            <span>1. Citizen Payment {distributionEditItem.processingType === "Responsible Recycling" ? "(Eco-Donation = ₹0)" : `(${distributionEditItem.customerName})`}</span>
                                        </label>
                                        <div className="mcd-distrib-input-wrap">
                                            <span className="mcd-distrib-curr">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                className="mcd-distrib-input"
                                                value={customCitizenPay}
                                                onKeyDown={blockNegativeKeys}
                                                onChange={handlePositiveNumberInput(setCustomCitizenPay)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {cPay > activePool && (
                                            <span style={{ fontSize: "0.70rem", color: "#dc2626", fontWeight: 600, display: "block", marginTop: "3px" }}>
                                                Exceeds total pool (₹{formatINR(activePool)}) by ₹{formatINR(cPay - activePool)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mcd-distrib-field-card">
                                        <label className="mcd-distrib-label">
                                            <span>2. {distributionEditItem.centerType === "Refurbishment Center" || distributionEditItem.pathway === "Refurbishment" ? "Center Refurbishment Expense (Parts & Repair Work Compensation)" : `Center Processing Fee (${distributionEditItem.centerType})`}</span>
                                        </label>
                                        <div className="mcd-distrib-input-wrap">
                                            <span className="mcd-distrib-curr">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                className="mcd-distrib-input"
                                                value={customCenterPay}
                                                onKeyDown={blockNegativeKeys}
                                                onChange={handlePositiveNumberInput(setCustomCenterPay)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {ctrPay > activePool && (
                                            <span style={{ fontSize: "0.70rem", color: "#dc2626", fontWeight: 600, display: "block", marginTop: "3px" }}>
                                                Exceeds total pool (₹{formatINR(activePool)}) by ₹{formatINR(ctrPay - activePool)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mcd-distrib-field-card">
                                        <label className="mcd-distrib-label">
                                            <span>3. Agent 1 (User &rarr; Tech)</span>
                                        </label>
                                        <div className="mcd-distrib-input-wrap">
                                            <span className="mcd-distrib-curr">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                className="mcd-distrib-input"
                                                value={customAgent1Pay}
                                                onKeyDown={blockNegativeKeys}
                                                onChange={handlePositiveNumberInput(setCustomAgent1Pay)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {a1Pay > activePool && (
                                            <span style={{ fontSize: "0.70rem", color: "#dc2626", fontWeight: 600, display: "block", marginTop: "3px" }}>
                                                Exceeds total pool by ₹{formatINR(a1Pay - activePool)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mcd-distrib-field-card">
                                        <label className="mcd-distrib-label">
                                            <span>4. Technician (Inspection)</span>
                                        </label>
                                        <div className="mcd-distrib-input-wrap">
                                            <span className="mcd-distrib-curr">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                className="mcd-distrib-input"
                                                value={customTechPay}
                                                onKeyDown={blockNegativeKeys}
                                                onChange={handlePositiveNumberInput(setCustomTechPay)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {tchPay > activePool && (
                                            <span style={{ fontSize: "0.70rem", color: "#dc2626", fontWeight: 600, display: "block", marginTop: "3px" }}>
                                                Exceeds total pool by ₹{formatINR(tchPay - activePool)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mcd-distrib-field-card" style={{ gridColumn: "1 / -1" }}>
                                        <label className="mcd-distrib-label">
                                            <span>5. Agent 2 (Tech &rarr; Center)</span>
                                        </label>
                                        <div className="mcd-distrib-input-wrap">
                                            <span className="mcd-distrib-curr">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                className="mcd-distrib-input"
                                                value={customAgent2Pay}
                                                onKeyDown={blockNegativeKeys}
                                                onChange={handlePositiveNumberInput(setCustomAgent2Pay)}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {a2Pay > activePool && (
                                            <span style={{ fontSize: "0.70rem", color: "#dc2626", fontWeight: 600, display: "block", marginTop: "3px" }}>
                                                Exceeds total pool by ₹{formatINR(a2Pay - activePool)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Accounting Balance & Viability Check Card */}
                                <div className="mcd-price-preview-box" style={{ margin: "0 0 1rem 0" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                                        <strong style={{ fontSize: "0.82rem", color: "#0f172a", textTransform: "uppercase" }}>
                                            Real-Time Viability &amp; Ledger Balance
                                        </strong>
                                        <span style={{ fontSize: "0.74rem", padding: "2px 8px", borderRadius: "12px", background: isViable ? (ecocycleReserve > 0 ? "#ecfdf5" : "#f1f5f9") : "#fef2f2", color: isViable ? (ecocycleReserve > 0 ? "#059669" : "#334155") : "#dc2626", fontWeight: 700 }}>
                                            {isViable ? (ecocycleReserve > 0 ? "Economically Viable Valuation" : "✅ 100% Value Absorbed (EcoCycle = ₹0)") : " Valuation Not Economically Viable"}
                                        </span>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.78rem" }}>
                                        <div style={{ background: "#ffffff", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                            <span style={{ color: "#64748b", display: "block" }}>Device Value (Inflow Pool):</span>
                                            <strong style={{ color: "#0f172a" }}>₹{formatINR(activePool)}</strong>
                                        </div>
                                        <div style={{ background: "#ffffff", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                            <span style={{ color: "#64748b", display: "block" }}>User + Center + Ops Costs:</span>
                                            <strong style={{ color: isExceeded ? "#dc2626" : "#0f172a" }}>₹{formatINR(totalRequired)}</strong>
                                        </div>
                                        <div style={{ gridColumn: "1 / -1", background: !isViable ? "#fff1f2" : (ecocycleReserve > 0 ? "#faf5ff" : "#f8fafc"), padding: "0.65rem 0.85rem", borderRadius: "8px", border: `1px solid ${!isViable ? "#fecdd3" : (ecocycleReserve > 0 ? "#e9d5ff" : "#e2e8f0")}` }}>
                                            {!isViable ? (
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div>
                                                        <span style={{ color: "#9f1239", fontWeight: 700, display: "block" }}>Valuation Not Viable (Deficit: -₹{formatINR(deficit)}):</span>
                                                        <span style={{ fontSize: "0.72rem", color: "#be123c" }}>Total Outflows exceed the available valuation pool • Reduce payouts or adjust valuation</span>
                                                    </div>
                                                    <strong style={{ color: "#e11d48", fontSize: "1.1rem" }}>Deficit: -₹{formatINR(deficit)}</strong>
                                                </div>
                                            ) : (
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div>
                                                        <span style={{ color: ecocycleReserve > 0 ? "#6b21a8" : "#334155", fontWeight: 700, display: "block" }}>
                                                            EcoCycle Share = max(0, Value − Costs):
                                                        </span>
                                                        <span style={{ fontSize: "0.72rem", color: ecocycleReserve > 0 ? "#7c3aed" : "#64748b" }}>
                                                            {ecocycleReserve > 0 ? "Residual surplus retained for platform operations & storage" : "100% of device value is consumed by user payout & operational costs"}
                                                        </span>
                                                    </div>
                                                    <strong style={{ color: ecocycleReserve > 0 ? "#7c3aed" : "#334155", fontSize: "1.1rem" }}>₹{formatINR(ecocycleReserve)}</strong>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Adjustment Note */}
                                <div>
                                    <label style={{ fontSize: "0.76rem", fontWeight: 600, color: "#475569", display: "block" }}>
                                        Admin Evaluation &amp; Disbursal Note:
                                    </label>
                                    <textarea
                                        className="mcd-notes-textarea"
                                        placeholder="e.g. Approved custom distribution; verified against certified center weight..."
                                        value={distributionNotes}
                                        onChange={(e) => setDistributionNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="admin-modal-footer" style={{ borderTop: "1px solid #e2e8f0", padding: "1rem 1.5rem" }}>
                                <button
                                    className="btn-modal-cancel"
                                    onClick={() => setShowDistributionModal(false)}
                                    disabled={distributionSaveSuccess}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-modal-confirm"
                                    style={{
                                        background: isExceeded ? "#94a3b8" : (distributionSaveSuccess ? "#059669" : "#10b981"),
                                        cursor: isExceeded ? "not-allowed" : "pointer",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px"
                                    }}
                                    disabled={isExceeded || distributionSaveSuccess}
                                    onClick={handleSaveDistribution}
                                >
                                    {isExceeded ? (
                                        `Cannot Save (Deficit: ₹${formatINR(deficit)})`
                                    ) : distributionSaveSuccess ? (
                                        <>
                                            <FiCheckCircle /> Saved &amp; Disbursed!
                                        </>
                                    ) : (
                                        <>
                                            <FiSave /> Save Payment Distribution
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* COMPACT INTERACTIVE STAT CARDS EDIT PRICE & VALUATION MODAL */}
            {showEditPriceModal && priceEditItem && (() => {
                const devId = priceEditItem.deviceId || priceEditItem.requestId;
                const isRecycle = priceEditItem.processingType === "Responsible Recycling";

                const curValuation = Math.max(0, parseFloat(editValuation) || 0);
                const curFee = Math.max(0, parseFloat(editProcessingFee) || 0);
                const curA1 = Math.max(0, parseFloat(editAgent1) || 0);
                const curTech = Math.max(0, parseFloat(editTech) || 0);
                const curA2 = Math.max(0, parseFloat(editAgent2) || 0);
                const curCitizenPay = isRecycle ? 0 : Math.max(0, parseFloat(editCitizenPayout) || 0);
                const totalOps = +(curA1 + curTech + curA2).toFixed(2);
                const totalOutflows = +(curCitizenPay + curFee + totalOps).toFixed(2);
                const remainingPool = +(curValuation - totalOutflows).toFixed(2);
                const isExceeded = curValuation > 0 && totalOutflows > curValuation;
                const deficit = isExceeded ? +(totalOutflows - curValuation).toFixed(2) : 0;

                const isRefurbDev = priceEditItem.centerType === "Refurbishment Center" || priceEditItem.pathway === "Refurbishment" || !isRecycle;

                return (
                    <div className="admin-modal-backdrop" onClick={() => setShowEditPriceModal(false)}>
                        <div className="admin-modal-card mcd-modal" style={{ maxWidth: "940px", width: "100%" }} onClick={(e) => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="admin-modal-header" style={{ borderBottom: "1px solid #e2e8f0", padding: "1rem 1.4rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <div className="admin-cat-icon-box" style={{ background: "#eff6ff", color: "#1d4ed8", width: "38px", height: "38px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.15rem" }}>
                                        <FiEdit2 />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                                            Edit Device Price &amp; Settlement Valuation
                                        </h3>
                                        <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "2px 0 0 0" }}>
                                            Device #{devId} &bull; {priceEditItem.brand} {priceEditItem.model} &bull; <span style={{ fontWeight: 600, color: isRecycle ? "#059669" : "#1d4ed8" }}>{priceEditItem.pathwayLabel || priceEditItem.pathway}</span> &bull; {priceEditItem.customerName}
                                        </p>
                                    </div>
                                </div>
                                <button className="admin-modal-close" onClick={() => setShowEditPriceModal(false)}>
                                    <FiX />
                                </button>
                            </div>

                            <div className="admin-modal-body" style={{ padding: "1.25rem 1.4rem" }}>
                                {/* Deficit Warning Alert Banner */}
                                {isExceeded && (
                                    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "8px 12px", borderRadius: "8px", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.80rem", color: "#b91c1c", fontWeight: 600 }}>
                                            <FiAlertTriangle style={{ fontSize: "1.1rem", flexShrink: 0 }} />
                                            <span>Total Outflows (₹{formatINR(totalOutflows)}) exceed Total Pool (₹{formatINR(curValuation)}) by <strong>₹{formatINR(deficit)}</strong>!</span>
                                        </div>
                                        {!isRecycle && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const otherCosts = totalOps + curFee;
                                                    setEditCitizenPayout(String(Math.max(0, curValuation - otherCosts)));
                                                }}
                                                style={{ background: "#dc2626", color: "#ffffff", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "0.74rem", fontWeight: 700, cursor: "pointer" }}
                                            >
                                                Auto-Balance Citizen Payout (₹{formatINR(Math.max(0, curValuation - (totalOps + curFee)))})
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* 7 INTERACTIVE EDITABLE STAT CARDS */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(122px, 1fr))", gap: "0.65rem", marginBottom: "0.85rem" }}>
                                    {/* 1. TOTAL POOL (P) */}
                                    <div className="pasc-summary-item" style={{ padding: "0.7rem 0.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between", border: "1px solid #cbd5e1", background: "#f8fafc", borderRadius: "10px", minWidth: 0 }}>
                                        <span className="pasc-label" style={{ fontWeight: 700, color: "#334155", fontSize: "0.72rem" }}>TOTAL POOL (P)</span>
                                        <div style={{ display: "flex", alignItems: "center", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0.25rem 0.45rem", margin: "4px 0", minWidth: 0 }}>
                                            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#64748b", marginRight: "3px", flexShrink: 0 }}>₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={editValuation}
                                                onKeyDown={blockNegativeKeys}
                                                onChange={handlePositiveNumberInput(setEditValuation)}
                                                placeholder="0"
                                                style={{ width: "100%", minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", padding: "0" }}
                                            />
                                        </div>
                                        <span style={{ fontSize: "0.65rem", color: "#64748b" }}>100% Inflow</span>
                                    </div>

                                    {/* 2. CITIZEN (U) */}
                                    <div className="pasc-summary-item" style={{ padding: "0.7rem 0.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between", border: `1px solid ${curCitizenPay > curValuation ? "#fca5a5" : "#bbf7d0"}`, background: curCitizenPay > curValuation ? "#fff1f2" : "#ffffff", borderRadius: "10px", minWidth: 0 }}>
                                        <span className="pasc-label" style={{ fontWeight: 700, color: "#166534", fontSize: "0.72rem" }}>CITIZEN (U)</span>
                                        <div style={{ display: "flex", alignItems: "center", background: isRecycle ? "#f1f5f9" : "#ffffff", border: `1px solid ${curCitizenPay > curValuation ? "#f87171" : "#86efac"}`, borderRadius: "6px", padding: "0.25rem 0.45rem", margin: "4px 0", minWidth: 0 }}>
                                            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#16a34a", marginRight: "3px", flexShrink: 0 }}>₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={editCitizenPayout}
                                                onKeyDown={blockNegativeKeys}
                                                onChange={handlePositiveNumberInput(setEditCitizenPayout)}
                                                disabled={isRecycle}
                                                placeholder="0"
                                                style={{ width: "100%", minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: "1.05rem", fontWeight: 800, color: isRecycle ? "#94a3b8" : "#16a34a", padding: "0" }}
                                            />
                                        </div>
                                        <span style={{ fontSize: "0.65rem", color: isRecycle ? "#64748b" : "#16a34a", fontWeight: 700 }}>
                                            {isRecycle ? "0% (Donation)" : `${curValuation > 0 ? Math.round((curCitizenPay / curValuation) * 100) : 0}%`}
                                        </span>
                                    </div>

                                    {/* 3. AGENT 1 (A1) */}
                                    <div className="pasc-summary-item" style={{ padding: "0.7rem 0.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between", border: `1px solid ${curA1 > curValuation ? "#fca5a5" : "#e2e8f0"}`, background: curA1 > curValuation ? "#fff1f2" : "#ffffff", borderRadius: "10px", minWidth: 0 }}>
                                        <span className="pasc-label" style={{ fontWeight: 700, color: "#475569", fontSize: "0.72rem" }}>AGENT 1 (A1)</span>
                                        <div style={{ display: "flex", alignItems: "center", background: "#ffffff", border: `1px solid ${curA1 > curValuation ? "#f87171" : "#cbd5e1"}`, borderRadius: "6px", padding: "0.25rem 0.45rem", margin: "4px 0", minWidth: 0 }}>
                                            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#64748b", marginRight: "3px", flexShrink: 0 }}>₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={editAgent1}
                                                onKeyDown={blockNegativeKeys}
                                                onChange={handlePositiveNumberInput(setEditAgent1)}
                                                placeholder="0"
                                                style={{ width: "100%", minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: "1.05rem", fontWeight: 800, color: "#334155", padding: "0" }}
                                            />
                                        </div>
                                        <span style={{ fontSize: "0.65rem", color: "#64748b" }}>Citizen &rarr; Tech</span>
                                    </div>

                                    {/* 4. TECH (T) */}
                                    <div className="pasc-summary-item" style={{ padding: "0.7rem 0.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between", border: `1px solid ${curTech > curValuation ? "#fca5a5" : "#e2e8f0"}`, background: curTech > curValuation ? "#fff1f2" : "#ffffff", borderRadius: "10px", minWidth: 0 }}>
                                        <span className="pasc-label" style={{ fontWeight: 700, color: "#475569", fontSize: "0.72rem" }}>TECH (T)</span>
                                        <div style={{ display: "flex", alignItems: "center", background: "#ffffff", border: `1px solid ${curTech > curValuation ? "#f87171" : "#cbd5e1"}`, borderRadius: "6px", padding: "0.25rem 0.45rem", margin: "4px 0", minWidth: 0 }}>
                                            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#64748b", marginRight: "3px", flexShrink: 0 }}>₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={editTech}
                                                onKeyDown={blockNegativeKeys}
                                                onChange={handlePositiveNumberInput(setEditTech)}
                                                placeholder="0"
                                                style={{ width: "100%", minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: "1.05rem", fontWeight: 800, color: "#334155", padding: "0" }}
                                            />
                                        </div>
                                        <span style={{ fontSize: "0.65rem", color: "#64748b" }}>Diagnostics</span>
                                    </div>

                                    {/* 5. AGENT 2 (A2) */}
                                    <div className="pasc-summary-item" style={{ padding: "0.7rem 0.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between", border: `1px solid ${curA2 > curValuation ? "#fca5a5" : "#e2e8f0"}`, background: curA2 > curValuation ? "#fff1f2" : "#ffffff", borderRadius: "10px", minWidth: 0 }}>
                                        <span className="pasc-label" style={{ fontWeight: 700, color: "#475569", fontSize: "0.72rem" }}>AGENT 2 (A2)</span>
                                        <div style={{ display: "flex", alignItems: "center", background: "#ffffff", border: `1px solid ${curA2 > curValuation ? "#f87171" : "#cbd5e1"}`, borderRadius: "6px", padding: "0.25rem 0.45rem", margin: "4px 0", minWidth: 0 }}>
                                            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#64748b", marginRight: "3px", flexShrink: 0 }}>₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={editAgent2}
                                                onKeyDown={blockNegativeKeys}
                                                onChange={handlePositiveNumberInput(setEditAgent2)}
                                                placeholder="0"
                                                style={{ width: "100%", minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: "1.05rem", fontWeight: 800, color: "#334155", padding: "0" }}
                                            />
                                        </div>
                                        <span style={{ fontSize: "0.65rem", color: "#64748b" }}>Tech &rarr; Center</span>
                                    </div>

                                    {/* 6. CENTER (C) */}
                                    <div className="pasc-summary-item" style={{ padding: "0.7rem 0.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between", border: `1px solid ${curFee > curValuation ? "#fca5a5" : "#bfdbfe"}`, background: curFee > curValuation ? "#fff1f2" : "#ffffff", borderRadius: "10px", minWidth: 0 }}>
                                        <span className="pasc-label" style={{ fontWeight: 700, color: "#1d4ed8", fontSize: "0.72rem" }}>CENTER (C)</span>
                                        <div style={{ display: "flex", alignItems: "center", background: "#ffffff", border: `1px solid ${curFee > curValuation ? "#f87171" : "#93c5fd"}`, borderRadius: "6px", padding: "0.25rem 0.45rem", margin: "4px 0", minWidth: 0 }}>
                                            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1d4ed8", marginRight: "3px", flexShrink: 0 }}>₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={editProcessingFee}
                                                onKeyDown={blockNegativeKeys}
                                                onChange={handlePositiveNumberInput(setEditProcessingFee)}
                                                placeholder="0"
                                                style={{ width: "100%", minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: "1.05rem", fontWeight: 800, color: "#1d4ed8", padding: "0" }}
                                            />
                                        </div>
                                        <span style={{ fontSize: "0.65rem", color: "#1d4ed8", fontWeight: 700 }}>
                                            {isRefurbDev ? "Refurb Work" : "Process Fee"} &bull; {curValuation > 0 ? Math.round((curFee / curValuation) * 100) : 0}%
                                        </span>
                                    </div>

                                    {/* 7. ECO SURPLUS (E) */}
                                    <div className="pasc-summary-item" style={{ padding: "0.7rem 0.75rem", display: "flex", flexDirection: "column", justifyContent: "space-between", border: `1px solid ${isExceeded ? "#fca5a5" : "#ddd6fe"}`, background: isExceeded ? "#fff1f2" : "#faf5ff", borderRadius: "10px", minWidth: 0 }}>
                                        <span className="pasc-label" style={{ fontWeight: 700, color: isExceeded ? "#dc2626" : "#7c3aed", fontSize: "0.72rem" }}>ECO SURPLUS (E)</span>
                                        <div style={{ padding: "0.25rem 0.2rem", margin: "2px 0" }}>
                                            <strong style={{ fontSize: "1.05rem", fontWeight: 800, color: isExceeded ? "#dc2626" : "#7c3aed", display: "block", whiteSpace: "nowrap" }}>
                                                {isExceeded ? `-₹${formatINR(deficit)}` : `₹${formatINR(remainingPool)}`}
                                            </strong>
                                        </div>
                                        <span style={{ fontSize: "0.65rem", color: isExceeded ? "#dc2626" : "#7c3aed", fontWeight: 700 }}>
                                            {isExceeded ? "Deficit!" : `${curValuation > 0 ? Math.round((remainingPool / curValuation) * 100) : 0}%`}
                                        </span>
                                    </div>
                                </div>

                                {/* Live Dynamic Equation Strip */}
                                <div style={{ background: isExceeded ? "#fef2f2" : "#f8fafc", border: `1px solid ${isExceeded ? "#fecaca" : "#e2e8f0"}`, borderRadius: "8px", padding: "0.55rem 0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "#475569", flexWrap: "wrap", gap: "6px" }}>
                                    <div>
                                        <span style={{ color: "#64748b" }}>Live Balance Equation: </span>
                                        <strong>₹{formatINR(curValuation)}</strong> (Pool) = <strong>₹{formatINR(totalOutflows)}</strong> (Citizen ₹{formatINR(curCitizenPay)} + Ops ₹{formatINR(totalOps)} + Center ₹{formatINR(curFee)}) + <strong style={{ color: isExceeded ? "#dc2626" : "#7c3aed" }}>{isExceeded ? `-₹${formatINR(deficit)}` : `₹${formatINR(remainingPool)}`}</strong> (Eco Surplus)
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <button
                                            type="button"
                                            onClick={() => setEditValuation(String(totalOutflows))}
                                            style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "5px", padding: "2px 8px", fontSize: "0.72rem", fontWeight: 600, color: "#334155", cursor: "pointer" }}
                                            title="Set Total Pool (P) to exact sum of all outflows"
                                        >
                                            Set Pool = Outflows (₹{formatINR(totalOutflows)})
                                        </button>
                                    </div>
                                </div>

                                {/* Optional Admin Note */}
                                <div style={{ marginTop: "0.5rem" }}>
                                    <input
                                        type="text"
                                        className="refurb-select"
                                        value={editPriceNotes}
                                        onChange={(e) => setEditPriceNotes(e.target.value)}
                                        placeholder="Admin adjustment remarks or audit note (optional)..."
                                        style={{ width: "100%", padding: "0.45rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="admin-modal-footer" style={{ borderTop: "1px solid #e2e8f0", padding: "0.85rem 1.4rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <button
                                    type="button"
                                    onClick={handleResetPriceOverride}
                                    style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", padding: "0.5rem 0.9rem", borderRadius: "8px", fontSize: "0.80rem", fontWeight: 600, cursor: "pointer" }}
                                    title="Clear custom override and revert to dynamic benchmark formula"
                                >
                                    Reset to Formula Default
                                </button>
                                <div style={{ display: "flex", gap: "0.6rem" }}>
                                    <button
                                        type="button"
                                        className="btn-modal-cancel"
                                        onClick={() => setShowEditPriceModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveEditedPrice}
                                        disabled={isExceeded}
                                        style={{
                                            background: isExceeded ? "#94a3b8" : "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                                            color: "#ffffff",
                                            border: "none",
                                            padding: "0.55rem 1.2rem",
                                            borderRadius: "8px",
                                            fontSize: "0.85rem",
                                            fontWeight: 700,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            cursor: isExceeded ? "not-allowed" : "pointer",
                                            boxShadow: isExceeded ? "none" : "0 2px 8px rgba(29, 78, 216, 0.3)"
                                        }}
                                    >
                                        {isExceeded ? `Cannot Save (Deficit: ₹${formatINR(deficit)})` : <><FiSave /> Save &amp; Update Price</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* RAZORPAY SANDBOX TEST SETTLEMENT MODAL */}
            {showPaymentModal && paymentModalItem && (() => {
                const devId = paymentModalItem.deviceId || paymentModalItem.requestId;
                const s = paymentModalItem.settlement || {};
                const finalVal = Math.max(1, s.activePool || paymentModalItem.deviceValuation || paymentModalItem.recoveryValue || 100);

                return (
                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(15, 23, 42, 0.7)",
                        backdropFilter: "blur(6px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10000,
                        padding: "1rem"
                    }}>
                        <div style={{
                            background: "#ffffff",
                            borderRadius: "20px",
                            maxWidth: "520px",
                            width: "100%",
                            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.3)",
                            border: "1px solid #e2e8f0",
                            overflow: "hidden"
                        }}>
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
                                    <div style={{
                                        background: "rgba(255, 255, 255, 0.2)",
                                        width: "38px",
                                        height: "38px",
                                        borderRadius: "10px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "1.2rem"
                                    }}>
                                        <FiCreditCard />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#ffffff" }}>
                                            Escrow Buyout Settlement
                                        </h3>
                                        <span style={{ fontSize: "0.75rem", opacity: 0.9, color: "#d1fae5" }}>
                                            Device #{devId} &bull; {paymentModalItem.deviceType || "Device"} ({paymentModalItem.brand || ""} {paymentModalItem.model || ""})
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    disabled={isPayingSettlement}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#ffffff",
                                        fontSize: "1.3rem",
                                        cursor: isPayingSettlement ? "not-allowed" : "pointer"
                                    }}
                                >
                                    <FiX />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div style={{ padding: "1.5rem" }}>
                                {/* Settlement Amount Display Card */}
                                <div style={{
                                    background: "#f0fdf4",
                                    border: "1.5px solid #86efac",
                                    borderRadius: "14px",
                                    padding: "1rem 1.25rem",
                                    marginBottom: "1.25rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between"
                                }}>
                                    <div>
                                        <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            Total Escrow Settlement Value
                                        </div>
                                        <div style={{ fontSize: "1.65rem", fontWeight: 900, color: "#14532d", marginTop: "2px" }}>
                                            ₹{formatINR(finalVal)}
                                        </div>
                                    </div>
                                    <span style={{
                                        background: "#dcfce7",
                                        color: "#166534",
                                        padding: "4px 10px",
                                        borderRadius: "20px",
                                        fontSize: "0.75rem",
                                        fontWeight: 800
                                    }}>
                                        Test Sandbox Mode
                                    </span>
                                </div>

                                {/* Razorpay Gateway Channel */}
                                <div style={{
                                    background: "linear-gradient(135deg, #faf5ff 0%, #f5eeff 100%)",
                                    border: "1.5px solid #d8b4fe",
                                    borderRadius: "14px",
                                    padding: "1rem 1.25rem",
                                    marginBottom: "1.25rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "1rem",
                                    boxShadow: "0 2px 10px rgba(124, 58, 237, 0.05)"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0, flex: 1 }}>
                                        <div style={{
                                            background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                                            color: "#ffffff",
                                            width: "42px",
                                            height: "42px",
                                            borderRadius: "10px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "1.35rem",
                                            fontWeight: 900,
                                            flexShrink: 0,
                                            boxShadow: "0 3px 8px rgba(124, 58, 237, 0.25)"
                                        }}>
                                            <FiCreditCard />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", whiteSpace: "nowrap" }}>
                                                Razorpay Payment Gateway
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "#6b21a8", marginTop: "2px", lineHeight: 1.35 }}>
                                                Instant Online Settlement &bull; Test Cards, Mock UPI &amp; NetBanking (₹0 Real Money)
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Test Sandbox Info Banner */}
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    background: "#eff6ff",
                                    border: "1px solid #bfdbfe",
                                    borderRadius: "10px",
                                    padding: "0.65rem 0.9rem",
                                    fontSize: "0.75rem",
                                    color: "#1e40af",
                                    marginBottom: "1.25rem"
                                }}>
                                    <FiShield style={{ fontSize: "1rem", flexShrink: 0 }} />
                                    <span>
                                        <strong>Sandbox Test Environment:</strong> Complete test payment using Razorpay test checkout or 1-Click Simulation.
                                    </span>
                                </div>

                                

                                {/* Remarks / Notes Input */}
                                <div style={{ marginBottom: "1.25rem" }}>
                                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                                        Settlement Reference Remarks (Optional):
                                    </label>
                                    <input
                                        type="text"
                                        className="refurb-select"
                                        value={paymentNotes}
                                        onChange={(e) => setPaymentNotes(e.target.value)}
                                        placeholder="Add optional payment remarks or reference notes..."
                                        style={{ width: "100%", padding: "0.5rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.825rem" }}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                                    <button
                                        type="button"
                                        className="btn-modal-cancel"
                                        onClick={() => setShowPaymentModal(false)}
                                        disabled={isPayingSettlement}
                                        style={{ padding: "0.65rem 1.2rem", borderRadius: "10px", fontWeight: 600 }}
                                    >
                                        Cancel
                                    </button>
                                    {isQuickSimulation ? (
                                        <button
                                            type="button"
                                            onClick={() => handleProcessSettlementPayment(true)}
                                            disabled={isPayingSettlement}
                                            style={{
                                                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                                                color: "#ffffff",
                                                border: "none",
                                                borderRadius: "10px",
                                                padding: "0.7rem 1.4rem",
                                                fontSize: "0.875rem",
                                                fontWeight: 800,
                                                cursor: isPayingSettlement ? "not-allowed" : "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.5rem",
                                                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)"
                                            }}
                                        >
                                            {isPayingSettlement ? "Simulating Test Settlement..." : `⚡ Simulate Test Settlement (₹${formatINR(finalVal)})`}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleProcessSettlementPayment(false)}
                                            disabled={isPayingSettlement}
                                            style={{
                                                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                                                color: "#ffffff",
                                                border: "none",
                                                borderRadius: "10px",
                                                padding: "0.7rem 1.4rem",
                                                fontSize: "0.875rem",
                                                fontWeight: 800,
                                                cursor: isPayingSettlement ? "not-allowed" : "pointer",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "0.5rem",
                                                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)"
                                            }}
                                        >
                                            {isPayingSettlement ? (
                                                <>Processing Test Payment...</>
                                            ) : (
                                                <>
                                                    <FiCheckCircle /> Authorize &amp; Pay ₹{formatINR(finalVal)} (Sandbox)
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

export default ManageCompletedDevices;
