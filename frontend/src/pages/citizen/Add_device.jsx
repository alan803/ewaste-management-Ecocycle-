import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Citizendashboard.css";
import "./View_device.css";
import "./Add_device.css";
import Sidebar from "./Sidebar";
import axios from "axios";
import { FiCheck, FiArrowLeft, FiArrowRight, FiSearch, FiBell, FiChevronDown, FiCalendar, FiCheckCircle, FiAlertCircle, FiImage, FiUploadCloud, FiShield, FiAward, FiTruck, FiCpu, FiBox } from "react-icons/fi";
import {
    validate_brand,
    validate_modelname,
    validate_modelnumber,
    validate_serialnumber,
    validate_quantity,
    validate_condition,
    validate_physicaldamage,
    validateFile,
    validate_address,
    validate_pickupdate,
    validate_specialization,
    validate_confirmation,
    validate_timeslot,
    validate_custom_address,
    validate_pickup_instructions,
    validate_weight
} from "../../utils/validation";

function Add_device() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const stepTitles = ["Device Info", "Condition", "Photos", "Pickup Details", "Confirmation"];

    const getLocalDateString = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const todayStr = getLocalDateString(new Date());

    const validate_purchasedate = (val) => {
        if (!val) return "";
        if (val > todayStr) {
            return "Purchase date cannot be in the future.";
        }
        return "";
    };

    const todayObj = new Date();
    const minDateStr = getLocalDateString(todayObj);

    const maxDateObj = new Date();
    maxDateObj.setDate(todayObj.getDate() + 10);
    const maxDateStr = getLocalDateString(maxDateObj);

    const [userProfile, setUserProfile] = useState(null);
    const [profileImage, setProfileImage] = useState(null);

    const [successMessage, setSuccessMessage] = useState("");
    const [submissionError, setSubmissionError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.get("https://ecocycle.runasp.net/api/User/profile", {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => {
                const data = res.data || {};
                setUserProfile(data);
                const img = data.profilePicture || data.profileImage;
                if (img) {
                    if (img.startsWith("http") || img.startsWith("data:")) {
                        setProfileImage(img);
                    } else {
                        setProfileImage(`https://ecocycle.runasp.net/uploads/profile/${img}`);
                    }
                } else {
                    const savedImage = localStorage.getItem("citizen_profile_image");
                    if (savedImage) setProfileImage(savedImage);
                }
            })
            .catch(err => console.error("Error fetching user profile:", err));

            axios.get("https://ecocycle.runasp.net/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(res => setNotifications(res.data || []))
            .catch(err => console.error("Error fetching notifications:", err));
        }
    }, []);

    const totalNotifCount = notifications.filter(n => !n.isRead && !n.isread).length;

    const [form_data, set_formdata] = useState({
        categoryId: "",
        brand: "",
        model: "",
        modelNumber: "",
        serialNumber: "",
        purchaseDate: "",
        quantity: 1,
        weight:"",

        condition: "",
        working: "",
        physicalDamage: "",
        displayCondition: "",
        batteryCondition: "",
        accessories: "",
        charger: "",

        frontPhoto: null,
        backPhoto: null,
        damagePhoto: null,
        labelPhoto: null,

        processingPreference: "",

        useRegisteredAddress: true,
        address: "",
        landmark: "",
        pickupDate: "",
        timeSlot: "",
        pickupInstructions: "",

        ownership: "",
        ownershipConfirmed: false,
        termsAccepted: false
    });

    const [error, seterror] = useState({
        categoryId_er: "",
        brand_er: "",
        model_er: "",
        modelNumber_er: "",
        serialNumber_er: "",
        purchaseDate_er: "",
        quantity_er: "",
        weight_er:"",
        condition_er: "",
        working_er: "",
        physicalDamage_er: "",
        displayCondition_er: "",
        batteryCondition_er: "",
        accessories_er: "",
        charger_er: "",

        frontPhoto_er: "",
        backPhoto_er: "",
        damagePhoto_er: "",
        labelPhoto_er: "",

        processingPreference_er: "",

        address_er: "",
        landmark_er: "",
        pickupDate_er: "",
        timeSlot_er: "",
        pickupInstructions_er: "",

        ownership_er: "",
        ownershipConfirmed_er: "",
        termsAccepted_er: ""
    });

    const [touched, setTouched] = useState({});
    const [categories, setCategories] = useState([]);
    const [deviceModels, setDeviceModels] = useState([]);
    const [selectedBrandOption, setSelectedBrandOption] = useState("");
    const [selectedModelOption, setSelectedModelOption] = useState("");

    useEffect(() => {
        axios.get("https://ecocycle.runasp.net/api/DeviceCategory/GetAll")
            .then((response) => {
                setCategories(response.data);
            })
            .catch((error) => {
                console.error("Error fetching categories", error);
            });

        axios.get("https://ecocycle.runasp.net/api/DeviceModel/GetAll")
            .then((response) => {
                setDeviceModels(response.data || []);
            })
            .catch((error) => {
                console.error("Error fetching device models", error);
            });
    }, []);

    // Filter models by selected Category
    const categoryFilteredModels = form_data.categoryId
        ? deviceModels.filter(m => String(m.categoryId) === String(form_data.categoryId))
        : deviceModels;

    // Filter distinct Brand list
    const availableBrands = Array.from(
        new Set(categoryFilteredModels.map(m => m.brand))
    ).filter(Boolean).sort();

    // Filter Models for selected Brand
    const availableModels = selectedBrandOption && selectedBrandOption !== "Other"
        ? categoryFilteredModels.filter(m => m.brand.toLowerCase() === selectedBrandOption.toLowerCase())
        : [];

    function handleBrandSelectChange(e) {
        const val = e.target.value;
        setSelectedBrandOption(val);
        setSelectedModelOption("");

        if (val === "Other") {
            set_formdata(prev => ({
                ...prev,
                brand: "",
                model: "",
                modelNumber: "",
                weight: ""
            }));
            seterror(prev => ({
                ...prev,
                brand_er: "Brand is required",
                model_er: "",
                modelNumber_er: "",
                weight_er: ""
            }));
        } else if (val) {
            set_formdata(prev => ({
                ...prev,
                brand: val,
                model: "",
                modelNumber: "",
                weight: ""
            }));
            seterror(prev => ({
                ...prev,
                brand_er: validate_brand(val),
                model_er: "",
                modelNumber_er: "",
                weight_er: ""
            }));
        } else {
            set_formdata(prev => ({
                ...prev,
                brand: "",
                model: "",
                modelNumber: "",
                weight: ""
            }));
            seterror(prev => ({ ...prev, brand_er: "" }));
        }
    }

    function handleModelSelectChange(e) {
        const val = e.target.value;
        setSelectedModelOption(val);

        if (val === "Other") {
            set_formdata(prev => ({
                ...prev,
                model: "",
                modelNumber: "",
                weight: ""
            }));
            seterror(prev => ({
                ...prev,
                model_er: "Model name is required",
                modelNumber_er: "",
                weight_er: ""
            }));
        } else if (val) {
            const matched = availableModels.find(m => m.model === val);
            const autoModelNum = matched?.modelNumber || "";
            const autoWeight = matched?.weight !== null && matched?.weight !== undefined ? String(matched.weight) : "";

            set_formdata(prev => ({
                ...prev,
                model: val,
                modelNumber: autoModelNum,
                weight: autoWeight
            }));

            seterror(prev => ({
                ...prev,
                model_er: validate_modelname(val),
                modelNumber_er: validate_modelnumber(autoModelNum),
                weight_er: validate_weight(autoWeight)
            }));
        } else {
            set_formdata(prev => ({
                ...prev,
                model: "",
                modelNumber: "",
                weight: ""
            }));
            seterror(prev => ({ ...prev, model_er: "" }));
        }
    }

    function handleInputChange(e) {
        const { name, value, type, checked, files } = e.target;

        setTouched(prev => ({
            ...prev,
            [name]: true
        }));

        if (name === "categoryId") {
            setSelectedBrandOption("");
            setSelectedModelOption("");
            set_formdata(prev => ({
                ...prev,
                categoryId: value,
                brand: "",
                model: "",
                modelNumber: "",
                weight: ""
            }));
            seterror(prev => ({
                ...prev,
                categoryId_er: validate_condition(value),
                brand_er: "",
                model_er: "",
                modelNumber_er: "",
                weight_er: ""
            }));
            return;
        }

        if (name === "useRegisteredAddress") {
            const isRegistered = value === "true";
            set_formdata(prev => ({
                ...prev,
                useRegisteredAddress: isRegistered
            }));
            if (isRegistered) {
                seterror(prev => ({
                    ...prev,
                    address_er: ""
                }));
            }
        } else if (type === "checkbox") {
            set_formdata(prev => ({
                ...prev,
                [name]: checked
            }));
        } else if (type === "file") {
            set_formdata(prev => ({
                ...prev,
                [name]: files[0] || null
            }));
        } else {
            set_formdata(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Live validations
        if (name === "address") seterror(prev => ({ ...prev, address_er: validate_custom_address(value) }));
        if (name === "brand") seterror(prev => ({ ...prev, brand_er: validate_brand(value) }));
        if (name === "model") seterror(prev => ({ ...prev, model_er: validate_modelname(value) }));
        if (name === "modelNumber") seterror(prev => ({ ...prev, modelNumber_er: validate_modelnumber(value) }));
        if (name === "serialNumber") seterror(prev => ({ ...prev, serialNumber_er: validate_serialnumber(value) }));
        if (name === "purchaseDate") seterror(prev => ({ ...prev, purchaseDate_er: validate_purchasedate(value) }));
        if (name === "quantity") seterror(prev => ({ ...prev, quantity_er: validate_quantity(value) }));
        if(name==="weight") seterror(prev => ({ ...prev, weight_er: validate_weight(value) }));
        if (name === "condition") seterror(prev => ({ ...prev, condition_er: validate_condition(value) }));
        if (name === "physicalDamage") seterror(prev => ({ ...prev, physicalDamage_er: validate_physicaldamage(value) }));
        if (name === "displayCondition") seterror(prev => ({ ...prev, displayCondition_er: validate_condition(value) }));
        if (name === "batteryCondition") seterror(prev => ({ ...prev, batteryCondition_er: validate_condition(value) }));
        if (name === "landmark") seterror(prev => ({ ...prev, landmark_er: validate_address(value) }));
        if (name === "pickupDate") seterror(prev => ({ ...prev, pickupDate_er: validate_pickupdate(value) }));
        if (name === "timeSlot") seterror(prev => ({ ...prev, timeSlot_er: validate_timeslot(value) }));
        if (name === "pickupInstructions") seterror(prev => ({ ...prev, pickupInstructions_er: validate_pickup_instructions(value) }));
        if (name === "ownership") seterror(prev => ({ ...prev, ownership_er: validate_confirmation(value) }));
        if (name === "ownershipConfirmed") seterror(prev => ({ ...prev, ownershipConfirmed_er: checked ? "" : "Please confirm ownership" }));
        if (name === "termsAccepted") seterror(prev => ({ ...prev, termsAccepted_er: checked ? "" : "Please accept terms and conditions" }));
        if (name === "frontPhoto") seterror(prev => ({ ...prev, frontPhoto_er: validateFile(files[0]) }));
        if (name === "backPhoto") seterror(prev => ({ ...prev, backPhoto_er: validateFile(files[0]) }));
        if (name === "damagePhoto") seterror(prev => ({ ...prev, damagePhoto_er: validateFile(files[0]) }));
        if (name === "labelPhoto") seterror(prev => ({ ...prev, labelPhoto_er: validateFile(files[0]) }));
    }

    function handleNextStep(e) {
        if (e) e.preventDefault();
        let stepErrors = {};

        if (currentStep === 0) {
            stepErrors = {
                categoryId_er: validate_condition(form_data.categoryId),
                brand_er: validate_brand(form_data.brand),
                model_er: validate_modelname(form_data.model),
                modelNumber_er: validate_modelnumber(form_data.modelNumber),
                serialNumber_er: validate_serialnumber(form_data.serialNumber),
                purchaseDate_er: validate_purchasedate(form_data.purchaseDate),
                quantity_er: validate_quantity(form_data.quantity),
                weight_er: validate_weight(form_data.weight),
            };
        } else if (currentStep === 1) {
            stepErrors = {
                condition_er: validate_condition(form_data.condition),
                working_er: validate_confirmation(form_data.working),
                physicalDamage_er: validate_physicaldamage(form_data.physicalDamage),
                displayCondition_er: validate_condition(form_data.displayCondition),
                batteryCondition_er: validate_condition(form_data.batteryCondition),
                accessories_er: validate_confirmation(form_data.accessories),
                charger_er: validate_confirmation(form_data.charger)
            };
        } else if (currentStep === 2) {
            stepErrors = {
                frontPhoto_er: validateFile(form_data.frontPhoto),
                backPhoto_er: validateFile(form_data.backPhoto),
                damagePhoto_er: validateFile(form_data.damagePhoto),
                labelPhoto_er: validateFile(form_data.labelPhoto)
            };
        } else if (currentStep === 3) {
            stepErrors = {
                processingPreference_er: validate_confirmation(form_data.processingPreference),
                address_er: !form_data.useRegisteredAddress ? validate_custom_address(form_data.address) : "",
                landmark_er: validate_address(form_data.landmark),
                pickupDate_er: validate_pickupdate(form_data.pickupDate),
                timeSlot_er: validate_timeslot(form_data.timeSlot),
                pickupInstructions_er: validate_pickup_instructions(form_data.pickupInstructions)
            };
        }

        seterror(prev => ({ ...prev, ...stepErrors }));

        if (!Object.values(stepErrors).some(err => err !== "")) {
            setCurrentStep(prev => prev + 1);
        }
    }

    function handlePrevStep(e) {
        if (e) e.preventDefault();
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }

    async function validate_devicesignup(e) {
        e.preventDefault();
        const newErrors = {
            categoryId_er: validate_condition(form_data.categoryId),
            brand_er: validate_brand(form_data.brand),
            model_er: validate_modelname(form_data.model),
            modelNumber_er: validate_modelnumber(form_data.modelNumber),
            serialNumber_er: validate_serialnumber(form_data.serialNumber),
            purchaseDate_er: validate_purchasedate(form_data.purchaseDate),
            quantity_er: validate_quantity(form_data.quantity),
            weight_er: validate_weight(form_data.weight),
            condition_er: validate_condition(form_data.condition),
            working_er: validate_confirmation(form_data.working),
            physicalDamage_er: validate_physicaldamage(form_data.physicalDamage),
            displayCondition_er: validate_condition(form_data.displayCondition),
            batteryCondition_er: validate_condition(form_data.batteryCondition),
            accessories_er: validate_confirmation(form_data.accessories),
            charger_er: validate_confirmation(form_data.charger),
            frontPhoto_er: validateFile(form_data.frontPhoto),
            backPhoto_er: validateFile(form_data.backPhoto),
            damagePhoto_er: validateFile(form_data.damagePhoto),
            labelPhoto_er: validateFile(form_data.labelPhoto),
            processingPreference_er: validate_confirmation(form_data.processingPreference),
            address_er: !form_data.useRegisteredAddress ? validate_custom_address(form_data.address) : "",
            landmark_er: validate_address(form_data.landmark),
            pickupDate_er: validate_pickupdate(form_data.pickupDate),
            timeSlot_er: validate_timeslot(form_data.timeSlot),
            pickupInstructions_er: validate_pickup_instructions(form_data.pickupInstructions),
            ownership_er: validate_confirmation(form_data.ownership),
            ownershipConfirmed_er: form_data.ownershipConfirmed ? "" : "Please confirm ownership",
            termsAccepted_er: form_data.termsAccepted ? "" : "Please accept terms and conditions"
        };

        seterror(newErrors);

        if (Object.values(newErrors).some(err => err !== "")) {
            return;
        }

        try {
            setIsSubmitting(true);
            setSubmissionError("");
            setSuccessMessage("");
            const formData = new FormData();
            Object.keys(form_data).forEach(key => {
                if (form_data[key] !== null && form_data[key] !== "") {
                    if (key === "weight") {
                        const numWeight = parseFloat(form_data[key]);
                        const intWeight = !isNaN(numWeight) ? Math.max(1, Math.round(numWeight)) : 1;
                        formData.append(key, intWeight.toString());
                    } else {
                        formData.append(key, form_data[key]);
                    }
                }
            });

            const token = localStorage.getItem("token");

            const response = await axios.post(
                "https://ecocycle.runasp.net/api/Device/Register",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const msg = response.data?.message || "Device added successfully!";
            setSuccessMessage(msg);
            navigate("/view-device");
        } catch (error) {
            console.error("Submission error:", error.response?.data || error);
            let errorMsg = "Failed to add device. Please try again.";
            const resData = error.response?.data;
            if (resData) {
                if (typeof resData === "string") {
                    errorMsg = resData;
                } else if (resData.message) {
                    errorMsg = resData.message;
                } else if (resData.title) {
                    errorMsg = resData.title;
                    if (resData.errors) {
                        const firstErrKey = Object.keys(resData.errors)[0];
                        if (firstErrKey) {
                            errorMsg += `: ${firstErrKey} - ${resData.errors[firstErrKey].join(", ")}`;
                        }
                    }
                } else if (resData.errors) {
                    const firstErrKey = Object.keys(resData.errors)[0];
                    if (firstErrKey) {
                        errorMsg = `${firstErrKey}: ${resData.errors[firstErrKey].join(", ")}`;
                    }
                }
            }
            setSubmissionError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    }

    const userName = userProfile?.firstName 
        ? `${userProfile.firstName} ${userProfile.lastName || ""}`.trim()
        : localStorage.getItem("firstName") ||
          localStorage.getItem("userName") ||
          localStorage.getItem("username") ||
          localStorage.getItem("name") ||
          "Citizen Champion";

    const renderStepActions = () => (
        <div className="step-actions-bar">
            {currentStep > 0 && (
                <button type="button" className="btn-prev" onClick={handlePrevStep}>
                    <FiArrowLeft /> Previous
                </button>
            )}

            {currentStep < stepTitles.length - 1 ? (
                <button type="button" className="btn-next" onClick={handleNextStep}>
                    Next <FiArrowRight />
                </button>
            ) : (
                <button type="submit" className="btn-submit-device" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : <>Submit Request <FiCheck /></>}
                </button>
            )}
        </div>
    );

    return (
        <div className="citizen-dashboard-layout">
            <Sidebar />

            <main className="citizen-main-content">
                {/* Main Header Panel Card */}
                <div className="control-bar-panel">
                    <div>
                        <h3 style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif", fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.2rem", color: "#0f172a" }}>Register E-Waste Device</h3>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>Submit electronic items for certified diagnostic evaluation, refurbishment, or sustainable recycling</p>
                    </div>

                    <div className="control-panel-right-group">
                        <Link 
                            to="/view-device" 
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.45rem",
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                color: "#0f172a",
                                padding: "0.5rem 0.95rem",
                                borderRadius: "8px",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                textDecoration: "none",
                                transition: "all 0.2s ease"
                            }}
                        >
                            <FiBox style={{ color: "#059669" }} /> My Registered Devices
                        </Link>
                    </div>
                </div>

                <div className="post-device-container">
                    {/* Vertical Progression Stepper (Left Side) */}
                    <div className="vertical-step-wrapper">
                        <div className="vertical-step-title">Registration Steps</div>
                        <div className="vertical-step-list">
                            {stepTitles.map((title, idx) => (
                                <div
                                    key={idx}
                                    className={`vertical-step-item ${currentStep === idx ? "active" : ""} ${currentStep > idx ? "completed" : ""}`}
                                    onClick={() => idx < currentStep && setCurrentStep(idx)}
                                >
                                    <div className="step-dot">
                                        {currentStep > idx ? <FiCheck /> : idx + 1}
                                    </div>
                                    <div className="step-text-group">
                                        <span className="step-number-tag">Step 0{idx + 1}</span>
                                        <span className="step-label">{title}</span>
                                    </div>
                                    {idx < stepTitles.length - 1 && <div className="step-line-connector"></div>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={validate_devicesignup} className="post-device-form">
                        {successMessage && (
                            <div style={{ background: "#ecfdf5", color: "#047857", padding: "0.75rem 1rem", borderRadius: "12px", border: "1px solid #a7f3d0", fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <FiCheckCircle style={{ fontSize: "1.1rem" }} />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        {submissionError && (
                            <div style={{ background: "#fff1f2", color: "#e11d48", padding: "0.75rem 1rem", borderRadius: "12px", border: "1px solid #fecdd3", fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <FiAlertCircle style={{ fontSize: "1.1rem" }} />
                                <span>{submissionError}</span>
                            </div>
                        )}

                        {/* STEP 1: Device Information */}
                        {currentStep === 0 && (
                            <div className="form-step-card">
                                <div className="form-card-header">
                                    <div className="form-card-header-left">
                                        <span className="form-step-badge">Step 1 of 5</span>
                                        <h2>Device Information</h2>
                                        <p className="form-step-subtitle">Select category, brand, and hardware specifications.</p>
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    {/* Category */}
                                    <div className="form-field-group">
                                        <label>Device Category *</label>
                                        <select
                                            name="categoryId"
                                            value={form_data.categoryId}
                                            onChange={handleInputChange}
                                            className={error.categoryId_er ? "input-error" : ""}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map((cat) => (
                                                <option key={cat.categoryId} value={cat.categoryId}>
                                                    {cat.categoryName}
                                                </option>
                                            ))}
                                        </select>
                                        {error.categoryId_er && <span className="error">{error.categoryId_er}</span>}
                                    </div>

                                    {/* Brand */}
                                    <div className="form-field-group">
                                        <label>Brand *</label>
                                        <select
                                            name="brandSelect"
                                            value={selectedBrandOption}
                                            onChange={handleBrandSelectChange}
                                            className={error.brand_er && !selectedBrandOption ? "input-error" : ""}
                                        >
                                            <option value="">Select Brand</option>
                                            {availableBrands.map((b) => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                            <option value="Other">Other / Custom Brand...</option>
                                        </select>

                                        {(selectedBrandOption === "Other" || (!selectedBrandOption && form_data.brand)) && (
                                            <div style={{ marginTop: "0.35rem" }}>
                                                <input
                                                    type="text"
                                                    name="brand"
                                                    value={form_data.brand}
                                                    onChange={handleInputChange}
                                                    placeholder="Type custom brand name"
                                                    className={error.brand_er ? "input-error" : ""}
                                                />
                                            </div>
                                        )}
                                        {error.brand_er && <span className="error">{error.brand_er}</span>}
                                    </div>

                                    {/* Model */}
                                    <div className="form-field-group">
                                        <label>Model *</label>
                                        <select
                                            name="modelSelect"
                                            value={selectedModelOption}
                                            onChange={handleModelSelectChange}
                                            disabled={!selectedBrandOption}
                                            className={error.model_er && !selectedModelOption ? "input-error" : ""}
                                        >
                                            <option value="">
                                                {!selectedBrandOption ? "Select Brand First" : "Select Model"}
                                            </option>
                                            {availableModels.map((m) => (
                                                <option key={m.deviceModelId || m.model} value={m.model}>
                                                    {m.model} {m.modelNumber ? `(${m.modelNumber})` : ""} {m.weight ? `- ${m.weight} kg` : ""}
                                                </option>
                                            ))}
                                            {selectedBrandOption && <option value="Other">Other / Custom Model...</option>}
                                        </select>

                                        {(selectedModelOption === "Other" || (!selectedModelOption && form_data.model && selectedBrandOption === "Other")) && (
                                            <div style={{ marginTop: "0.35rem" }}>
                                                <input
                                                    type="text"
                                                    name="model"
                                                    value={form_data.model}
                                                    onChange={handleInputChange}
                                                    placeholder="Type custom model name"
                                                    className={error.model_er ? "input-error" : ""}
                                                />
                                            </div>
                                        )}
                                        {error.model_er && <span className="error">{error.model_er}</span>}
                                    </div>

                                    {/* Model Number */}
                                    <div className="form-field-group">
                                        <label>Model Number</label>
                                        <input
                                            type="text"
                                            name="modelNumber"
                                            value={form_data.modelNumber}
                                            onChange={handleInputChange}
                                            placeholder="Optional (Auto-filled or Custom)"
                                            className={error.modelNumber_er ? "input-error" : ""}
                                        />
                                        {error.modelNumber_er && <span className="error">{error.modelNumber_er}</span>}
                                    </div>

                                    {/* Serial Number */}
                                    <div className="form-field-group">
                                        <label>Serial Number</label>
                                        <input
                                            type="text"
                                            name="serialNumber"
                                            value={form_data.serialNumber}
                                            onChange={handleInputChange}
                                            placeholder="Optional hardware serial"
                                            className={error.serialNumber_er ? "input-error" : ""}
                                        />
                                        {error.serialNumber_er && <span className="error">{error.serialNumber_er}</span>}
                                    </div>

                                    {/* Date of Purchase */}
                                    <div className="form-field-group">
                                        <label>Date of Purchase</label>
                                        <input
                                            type="date"
                                            name="purchaseDate"
                                            value={form_data.purchaseDate}
                                            onChange={handleInputChange}
                                            max={todayStr}
                                            className={error.purchaseDate_er ? "input-error" : ""}
                                        />
                                        {error.purchaseDate_er && <span className="error">{error.purchaseDate_er}</span>}
                                    </div>

                                    {/* Quantity */}
                                    <div className="form-field-group">
                                        <label>Quantity *</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={form_data.quantity}
                                            onChange={handleInputChange}
                                            min="1"
                                            className={error.quantity_er ? "input-error" : ""}
                                        />
                                        {error.quantity_er && <span className="error">{error.quantity_er}</span>}
                                    </div>

                                    {/* Weight */}
                                    <div className="form-field-group">
                                        <label>Weight (in kg) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="weight"
                                            value={form_data.weight}
                                            onChange={handleInputChange}
                                            placeholder="e.g. 0.25 (Auto-filled or Custom)"
                                            min="0.01"
                                            className={error.weight_er ? "input-error" : ""}
                                        />
                                        {error.weight_er && <span className="error">{error.weight_er}</span>}
                                    </div>
                                </div>

                                {renderStepActions()}
                            </div>
                        )}

                        {/* STEP 2: Device Condition */}
                        {currentStep === 1 && (
                            <div className="form-step-card">
                                <div className="form-card-header">
                                    <div className="form-card-header-left">
                                        <span className="form-step-badge">Step 2 of 5</span>
                                        <h2>Device Condition & Diagnostics</h2>
                                        <p className="form-step-subtitle">Tell us about the working status and physical condition.</p>
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    {/* Overall Condition */}
                                    <div className="form-field-group form-grid-full">
                                        <label>Overall Condition *</label>
                                        <div className="pill-radio-group">
                                            {["Excellent", "Good", "Fair", "Poor", "Non-functional"].map((cond) => (
                                                <label key={cond} className={`pill-radio-label ${form_data.condition === cond ? "selected" : ""}`}>
                                                    <input
                                                        type="radio"
                                                        name="condition"
                                                        value={cond}
                                                        checked={form_data.condition === cond}
                                                        onChange={handleInputChange}
                                                    />
                                                    {cond}
                                                </label>
                                            ))}
                                        </div>
                                        {error.condition_er && <span className="error">{error.condition_er}</span>}
                                    </div>

                                    {/* Working */}
                                    <div className="form-field-group">
                                        <label>Is the device working?</label>
                                        <div className="pill-radio-group">
                                            {["Yes", "No", "Partially"].map((opt) => (
                                                <label key={opt} className={`pill-radio-label ${form_data.working === opt ? "selected" : ""}`}>
                                                    <input
                                                        type="radio"
                                                        name="working"
                                                        value={opt}
                                                        checked={form_data.working === opt}
                                                        onChange={handleInputChange}
                                                    />
                                                    {opt}
                                                </label>
                                            ))}
                                        </div>
                                        {error.working_er && <span className="error">{error.working_er}</span>}
                                    </div>

                                    {/* Accessories */}
                                    <div className="form-field-group">
                                        <label>Accessories Available?</label>
                                        <div className="pill-radio-group">
                                            {["Yes", "No"].map((opt) => (
                                                <label key={opt} className={`pill-radio-label ${form_data.accessories === opt ? "selected" : ""}`}>
                                                    <input
                                                        type="radio"
                                                        name="accessories"
                                                        value={opt}
                                                        checked={form_data.accessories === opt}
                                                        onChange={handleInputChange}
                                                    />
                                                    {opt}
                                                </label>
                                            ))}
                                        </div>
                                        {error.accessories_er && <span className="error">{error.accessories_er}</span>}
                                    </div>

                                    {/* Screen Display */}
                                    <div className="form-field-group">
                                        <label>Screen / Display Condition</label>
                                        <select
                                            name="displayCondition"
                                            value={form_data.displayCondition}
                                            onChange={handleInputChange}
                                            className={error.displayCondition_er ? "input-error" : ""}
                                        >
                                            <option value="">Select Condition</option>
                                            <option value="Good">Good</option>
                                            <option value="Minor Damage">Minor Damage</option>
                                            <option value="Cracked">Cracked</option>
                                            <option value="Broken">Broken</option>
                                            <option value="Not Applicable">Not Applicable</option>
                                        </select>
                                        {error.displayCondition_er && <span className="error">{error.displayCondition_er}</span>}
                                    </div>

                                    {/* Battery Condition */}
                                    <div className="form-field-group">
                                        <label>Battery Condition</label>
                                        <select
                                            name="batteryCondition"
                                            value={form_data.batteryCondition}
                                            onChange={handleInputChange}
                                            className={error.batteryCondition_er ? "input-error" : ""}
                                        >
                                            <option value="">Select Condition</option>
                                            <option value="Good">Good</option>
                                            <option value="Average">Average</option>
                                            <option value="Poor">Poor</option>
                                            <option value="Not Applicable">Not Applicable</option>
                                        </select>
                                        {error.batteryCondition_er && <span className="error">{error.batteryCondition_er}</span>}
                                    </div>

                                    {/* Charger */}
                                    <div className="form-field-group">
                                        <label>Charger Available?</label>
                                        <div className="pill-radio-group">
                                            {["Yes", "No", "Not Applicable"].map((opt) => (
                                                <label key={opt} className={`pill-radio-label ${form_data.charger === opt ? "selected" : ""}`}>
                                                    <input
                                                        type="radio"
                                                        name="charger"
                                                        value={opt}
                                                        checked={form_data.charger === opt}
                                                        onChange={handleInputChange}
                                                    />
                                                    {opt}
                                                </label>
                                            ))}
                                        </div>
                                        {error.charger_er && <span className="error">{error.charger_er}</span>}
                                    </div>

                                    {/* Physical Damage */}
                                    <div className="form-field-group form-grid-full">
                                        <label>Physical Damage / Wear Description</label>
                                        <textarea
                                            name="physicalDamage"
                                            value={form_data.physicalDamage}
                                            onChange={handleInputChange}
                                            placeholder="Describe any scratches, cracks, dents, or visible flaws..."
                                            className={error.physicalDamage_er ? "input-error" : ""}
                                        ></textarea>
                                        {error.physicalDamage_er && <span className="error">{error.physicalDamage_er}</span>}
                                    </div>
                                </div>

                                {renderStepActions()}
                            </div>
                        )}

                        {/* STEP 3: Device Photos */}
                        {currentStep === 2 && (
                            <div className="form-step-card">
                                <div className="form-card-header">
                                    <div className="form-card-header-left">
                                        <span className="form-step-badge">Step 3 of 5</span>
                                        <h2>Device Photos</h2>
                                        <p className="form-step-subtitle">Upload clear photos to accelerate valuation and inspection.</p>
                                    </div>
                                </div>

                                <div className="photo-upload-grid">
                                    <div className={`photo-upload-box ${form_data.frontPhoto ? "has-file" : ""}`}>
                                        <input
                                            type="file"
                                            name="frontPhoto"
                                            accept="image/*"
                                            onChange={handleInputChange}
                                            className="photo-upload-input"
                                        />
                                        <FiImage className="photo-upload-icon" />
                                        <span className="photo-upload-label">Front Photo *</span>
                                        {form_data.frontPhoto ? (
                                            <span className="photo-file-name">{form_data.frontPhoto.name}</span>
                                        ) : (
                                            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Click to upload</span>
                                        )}
                                        {error.frontPhoto_er && <span className="error">{error.frontPhoto_er}</span>}
                                    </div>

                                    <div className={`photo-upload-box ${form_data.backPhoto ? "has-file" : ""}`}>
                                        <input
                                            type="file"
                                            name="backPhoto"
                                            accept="image/*"
                                            onChange={handleInputChange}
                                            className="photo-upload-input"
                                        />
                                        <FiImage className="photo-upload-icon" />
                                        <span className="photo-upload-label">Back Photo *</span>
                                        {form_data.backPhoto ? (
                                            <span className="photo-file-name">{form_data.backPhoto.name}</span>
                                        ) : (
                                            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Click to upload</span>
                                        )}
                                        {error.backPhoto_er && <span className="error">{error.backPhoto_er}</span>}
                                    </div>

                                    <div className={`photo-upload-box ${form_data.damagePhoto ? "has-file" : ""}`}>
                                        <input
                                            type="file"
                                            name="damagePhoto"
                                            accept="image/*"
                                            onChange={handleInputChange}
                                            className="photo-upload-input"
                                        />
                                        <FiImage className="photo-upload-icon" />
                                        <span className="photo-upload-label">Damage View</span>
                                        {form_data.damagePhoto ? (
                                            <span className="photo-file-name">{form_data.damagePhoto.name}</span>
                                        ) : (
                                            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Optional</span>
                                        )}
                                        {error.damagePhoto_er && <span className="error">{error.damagePhoto_er}</span>}
                                    </div>

                                    <div className={`photo-upload-box ${form_data.labelPhoto ? "has-file" : ""}`}>
                                        <input
                                            type="file"
                                            name="labelPhoto"
                                            accept="image/*"
                                            onChange={handleInputChange}
                                            className="photo-upload-input"
                                        />
                                        <FiImage className="photo-upload-icon" />
                                        <span className="photo-upload-label">Serial / Label</span>
                                        {form_data.labelPhoto ? (
                                            <span className="photo-file-name">{form_data.labelPhoto.name}</span>
                                        ) : (
                                            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Optional</span>
                                        )}
                                        {error.labelPhoto_er && <span className="error">{error.labelPhoto_er}</span>}
                                    </div>
                                </div>

                                {renderStepActions()}
                            </div>
                        )}

                        {/* STEP 4: Processing & Pickup Details */}
                        {currentStep === 3 && (
                            <div className="form-step-card">
                                <div className="form-card-header">
                                    <div className="form-card-header-left">
                                        <span className="form-step-badge">Step 4 of 5</span>
                                        <h2>Processing & Pickup Logistics</h2>
                                        <p className="form-step-subtitle">Choose how you'd like your device handled and schedule a collection slot.</p>
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    {/* Preference */}
                                    <div className="form-field-group form-grid-full">
                                        <label>Processing Preference *</label>
                                        <div className="preference-grid">
                                            <label className={`preference-card ${form_data.processingPreference === "valuation" ? "selected" : ""}`}>
                                                <div className="preference-card-top">
                                                    <span className="preference-card-title">Request Valuation</span>
                                                    <input
                                                        type="radio"
                                                        name="processingPreference"
                                                        value="valuation"
                                                        checked={form_data.processingPreference === "valuation"}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <p className="preference-card-desc">Receive an estimated monetary offer and revenue share upon technical inspection.</p>
                                            </label>

                                            <label className={`preference-card ${form_data.processingPreference === "recycling" ? "selected" : ""}`}>
                                                <div className="preference-card-top">
                                                    <span className="preference-card-title">Responsible Recycling</span>
                                                    <input
                                                        type="radio"
                                                        name="processingPreference"
                                                        value="recycling"
                                                        checked={form_data.processingPreference === "recycling"}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                                <p className="preference-card-desc">Zero-landfill certified recycling with an official Green Impact Certificate.</p>
                                            </label>
                                        </div>
                                        {error.processingPreference_er && <span className="error">{error.processingPreference_er}</span>}
                                    </div>

                                    {/* Address Option */}
                                    <div className="form-field-group form-grid-full">
                                        <label>Pickup Address Option</label>
                                        <div className="pill-radio-group">
                                            <label className={`pill-radio-label ${form_data.useRegisteredAddress ? "selected" : ""}`}>
                                                <input
                                                    type="radio"
                                                    name="useRegisteredAddress"
                                                    value="true"
                                                    checked={form_data.useRegisteredAddress === true}
                                                    onChange={handleInputChange}
                                                />
                                                Use registered profile address
                                            </label>
                                            <label className={`pill-radio-label ${!form_data.useRegisteredAddress ? "selected" : ""}`}>
                                                <input
                                                    type="radio"
                                                    name="useRegisteredAddress"
                                                    value="false"
                                                    checked={form_data.useRegisteredAddress === false}
                                                    onChange={handleInputChange}
                                                />
                                                Use custom pickup address
                                            </label>
                                        </div>
                                    </div>

                                    {!form_data.useRegisteredAddress && (
                                        <div className="form-field-group form-grid-full">
                                            <label>Custom Pickup Address *</label>
                                            <textarea
                                                name="address"
                                                value={form_data.address}
                                                onChange={handleInputChange}
                                                placeholder="Enter flat/house no., street, city, pin code..."
                                                className={error.address_er ? "input-error" : ""}
                                            ></textarea>
                                            {error.address_er && <span className="error">{error.address_er}</span>}
                                        </div>
                                    )}

                                    {/* Landmark */}
                                    <div className="form-field-group">
                                        <label>Landmark (Optional)</label>
                                        <input
                                            type="text"
                                            name="landmark"
                                            value={form_data.landmark}
                                            onChange={handleInputChange}
                                            placeholder="Nearby building or landmark"
                                            className={error.landmark_er ? "input-error" : ""}
                                        />
                                        {error.landmark_er && <span className="error">{error.landmark_er}</span>}
                                    </div>

                                    {/* Date */}
                                    <div className="form-field-group">
                                        <label>Preferred Pickup Date *</label>
                                        <input
                                            type="date"
                                            name="pickupDate"
                                            min={minDateStr}
                                            max={maxDateStr}
                                            value={form_data.pickupDate}
                                            onChange={handleInputChange}
                                            className={error.pickupDate_er ? "input-error" : ""}
                                        />
                                        {error.pickupDate_er && <span className="error">{error.pickupDate_er}</span>}
                                    </div>

                                    {/* Time Slot */}
                                    <div className="form-field-group">
                                        <label>Preferred Time Slot *</label>
                                        <select
                                            name="timeSlot"
                                            value={form_data.timeSlot}
                                            onChange={handleInputChange}
                                            className={error.timeSlot_er ? "input-error" : ""}
                                        >
                                            <option value="">Select Time Slot</option>
                                            <option value="9AM-12PM">9:00 AM - 12:00 PM (Morning)</option>
                                            <option value="12PM-3PM">12:00 PM - 3:00 PM (Afternoon)</option>
                                            <option value="3PM-6PM">3:00 PM - 6:00 PM (Evening)</option>
                                        </select>
                                        {error.timeSlot_er && <span className="error">{error.timeSlot_er}</span>}
                                    </div>

                                    {/* Instructions */}
                                    <div className="form-field-group form-grid-full">
                                        <label>Pickup Instructions (Optional)</label>
                                        <textarea
                                            name="pickupInstructions"
                                            value={form_data.pickupInstructions}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Call 10 mins before arrival, gate access code..."
                                            className={error.pickupInstructions_er ? "input-error" : ""}
                                        ></textarea>
                                        {error.pickupInstructions_er && <span className="error">{error.pickupInstructions_er}</span>}
                                    </div>
                                </div>

                                {renderStepActions()}
                            </div>
                        )}

                        {/* STEP 5: Ownership Confirmation */}
                        {currentStep === 4 && (
                            <div className="form-step-card">
                                <div className="form-card-header">
                                    <div className="form-card-header-left">
                                        <span className="form-step-badge">Step 5 of 5</span>
                                        <h2>Review & Confirm Submission</h2>
                                        <p className="form-step-subtitle">Verify device specifications and declare legal ownership.</p>
                                    </div>
                                </div>

                                <div className="review-summary-card">
                                    <div className="review-summary-title">Summary Review</div>
                                    <div className="review-grid">
                                        <div className="review-item">
                                            <span className="review-key">Device & Brand</span>
                                            <span className="review-val">{form_data.brand || "N/A"} - {form_data.model || "Custom Model"}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-key">Category & Qty</span>
                                            <span className="review-val">{categories.find(c => String(c.categoryId) === String(form_data.categoryId))?.categoryName || "E-Waste"} (Qty: {form_data.quantity || 1})</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-key">Condition</span>
                                            <span className="review-val">{form_data.condition || "Not Specified"} {form_data.working ? `(${form_data.working})` : ""}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-key">Preference</span>
                                            <span className="review-val" style={{ textTransform: "capitalize", color: "#059669" }}>{form_data.processingPreference || "Valuation"}</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-key">Pickup Schedule</span>
                                            <span className="review-val">{form_data.pickupDate || "Date TBD"} ({form_data.timeSlot || "Slot TBD"})</span>
                                        </div>
                                        <div className="review-item">
                                            <span className="review-key">Weight</span>
                                            <span className="review-val">{form_data.weight ? `${form_data.weight} kg` : "N/A"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-field-group form-grid-full">
                                        <label>Device Ownership *</label>
                                        <div className="pill-radio-group">
                                            <label className={`pill-radio-label ${form_data.ownership === "Personal" ? "selected" : ""}`}>
                                                <input
                                                    type="radio"
                                                    name="ownership"
                                                    value="Personal"
                                                    checked={form_data.ownership === "Personal"}
                                                    onChange={handleInputChange}
                                                />
                                                Personal Device
                                            </label>
                                            <label className={`pill-radio-label ${form_data.ownership === "Business" ? "selected" : ""}`}>
                                                <input
                                                    type="radio"
                                                    name="ownership"
                                                    value="Business"
                                                    checked={form_data.ownership === "Business"}
                                                    onChange={handleInputChange}
                                                />
                                                Business / Corporate Device
                                            </label>
                                        </div>
                                        {error.ownership_er && <span className="error">{error.ownership_er}</span>}
                                    </div>

                                    <div className="form-grid-full">
                                        <label className="checkbox-card">
                                            <input
                                                type="checkbox"
                                                name="ownershipConfirmed"
                                                checked={form_data.ownershipConfirmed}
                                                onChange={handleInputChange}
                                                className={error.ownershipConfirmed_er ? "input-error" : ""}
                                            />
                                            <span>I confirm that I am the legal owner or authorized custodian to surrender this electronic hardware to EcoCycle for processing.</span>
                                        </label>
                                        {error.ownershipConfirmed_er && <span className="error">{error.ownershipConfirmed_er}</span>}

                                        <label className="checkbox-card">
                                            <input
                                                type="checkbox"
                                                name="termsAccepted"
                                                checked={form_data.termsAccepted}
                                                onChange={handleInputChange}
                                                className={error.termsAccepted_er ? "input-error" : ""}
                                            />
                                            <span>I agree to EcoCycle Environmental Terms & Services and verify all data provided is genuine.</span>
                                        </label>
                                        {error.termsAccepted_er && <span className="error">{error.termsAccepted_er}</span>}
                                    </div>
                                </div>

                                {renderStepActions()}
                            </div>
                        )}
                    </form>
                </div>
            </main>
        </div>
    );
}

export default Add_device;