import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Add_device.css";
import Sidebar from "./Sidebar";
import axios from "axios";
import { FiCheck, FiArrowLeft, FiArrowRight, FiSearch, FiBell, FiChevronDown, FiCalendar, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
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

    const [userProfile, setUserProfile] = useState(null);
    const [profileImage, setProfileImage] = useState(null);

    const [successMessage, setSuccessMessage] = useState("");
    const [submissionError, setSubmissionError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.get("https://localhost:7102/api/User/profile", {
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
                        setProfileImage(`https://localhost:7102/uploads/profile/${img}`);
                    }
                } else {
                    const savedImage = localStorage.getItem("citizen_profile_image");
                    if (savedImage) setProfileImage(savedImage);
                }
            })
            .catch(err => console.error("Error loading user profile in Add_device:", err));
        }
    }, []);

    const [form_data, set_formdata] = useState({
        categoryId: "",
        brand: "",
        model: "",
        modelNumber: "",
        serialNumber: "",
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

    useEffect(() => {
        axios.get("https://localhost:7102/api/DeviceCategory/GetAll")
            .then((response) => {
                setCategories(response.data);
            })
            .catch((error) => {
                console.error("Error fetching categories", error);
            });
    }, []);

    function handleInputChange(e) {
        const { name, value, type, checked, files } = e.target;

        setTouched(prev => ({
            ...prev,
            [name]: true
        }));

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
                    formData.append(key, form_data[key]);
                }
            });

            const token = localStorage.getItem("token");

            const response = await axios.post(
                "https://localhost:7102/api/Device/Register",
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
            setSubmissionError(error.response?.data?.message || "Failed to add device. Please try again.");
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

    return (
        <div className="citizen-dashboard-layout">
            <Sidebar />

            <main className="citizen-main-content">
                {/* Title & User Header Ribbon */}
                <div className="vd-ribbon" style={{ marginBottom: "1.5rem" }}>
                    <h1 className="vd-page-heading">Post E-Waste Device</h1>

                    <div className="vd-top-actions">
                        <button className="vd-circle-btn" title="Notifications" style={{ position: "relative" }}>
                            <FiBell />
                            <span style={{ position: "absolute", top: "10px", right: "10px", width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444" }}></span>
                        </button>

                        <Link 
                            to="/manage-userprofile" 
                            className="vd-user-profile-pill" 
                            style={{ textDecoration: "none", cursor: "pointer" }}
                            title="View & Edit Profile"
                        >
                            {profileImage ? (
                                <img src={profileImage} alt="User Avatar" className="vd-user-avatar" style={{ objectFit: "cover" }} />
                            ) : (
                                <div className="vd-user-avatar">{userName.charAt(0).toUpperCase()}</div>
                            )}
                            <div className="vd-user-info">
                                <span className="vd-user-name">{userName}</span>
                            </div>
                            <FiChevronDown style={{ color: "#718096", fontSize: "0.9rem", marginLeft: "0.2rem" }} />
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
                            <div style={{ background: "#ecfdf5", color: "#047857", padding: "0.85rem 1.15rem", borderRadius: "12px", border: "1px solid #a7f3d0", fontWeight: 700, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <FiCheckCircle style={{ fontSize: "1.1rem" }} />
                                <span>{successMessage}</span>
                            </div>
                        )}

                        {submissionError && (
                            <div style={{ background: "#fff1f2", color: "#e11d48", padding: "0.85rem 1.15rem", borderRadius: "12px", border: "1px solid #fecdd3", fontWeight: 700, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <FiAlertCircle style={{ fontSize: "1.1rem" }} />
                                <span>{submissionError}</span>
                            </div>
                        )}

                        {/* STEP 1: Device Information */}
                        {currentStep === 0 && (
                            <div className="form-step-card">
                                <h2>1. Device Information</h2>

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

                                <label>Brand *</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={form_data.brand}
                                    onChange={handleInputChange}
                                    placeholder="Enter brand"
                                    className={error.brand_er ? "input-error" : ""}
                                />
                                {error.brand_er && <span className="error">{error.brand_er}</span>}

                                <label>Model *</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={form_data.model}
                                    onChange={handleInputChange}
                                    placeholder="Enter model"
                                    className={error.model_er ? "input-error" : ""}
                                />
                                {error.model_er && <span className="error">{error.model_er}</span>}

                                <label>Model Number</label>
                                <input
                                    type="text"
                                    name="modelNumber"
                                    value={form_data.modelNumber}
                                    onChange={handleInputChange}
                                    placeholder="Optional"
                                    className={error.modelNumber_er ? "input-error" : ""}
                                />
                                {error.modelNumber_er && <span className="error">{error.modelNumber_er}</span>}

                                <label>Serial Number</label>
                                <input
                                    type="text"
                                    name="serialNumber"
                                    value={form_data.serialNumber}
                                    onChange={handleInputChange}
                                    placeholder="Optional"
                                    className={error.serialNumber_er ? "input-error" : ""}
                                />
                                {error.serialNumber_er && <span className="error">{error.serialNumber_er}</span>}

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
                                <label>Weight (in kg) *</label>
                                <input
                                    type="number"
                                    name="weight"
                                    value={form_data.weight}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 2"
                                    min="1"
                                    className={error.weight_er ? "input-error" : ""}
                                />
                                {error.weight_er && <span className="error">{error.weight_er}</span>}
                            </div>
                        )}

                        {/* STEP 2: Device Condition */}
                        {currentStep === 1 && (
                            <div className="form-step-card">
                                <h2>2. Device Condition</h2>

                                <label>Overall Condition *</label>
                                <div className="radio-group">
                                    {["Excellent", "Good", "Fair", "Poor", "Non-functional"].map((cond) => (
                                        <label key={cond}>
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

                                <label>Is the device working?</label>
                                <div className="radio-group">
                                    {["Yes", "No", "Partially"].map((opt) => (
                                        <label key={opt}>
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

                                <label>Physical Damage</label>
                                <textarea
                                    name="physicalDamage"
                                    value={form_data.physicalDamage}
                                    onChange={handleInputChange}
                                    placeholder="Describe any visible damage"
                                    className={error.physicalDamage_er ? "input-error" : ""}
                                ></textarea>
                                {error.physicalDamage_er && <span className="error">{error.physicalDamage_er}</span>}

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

                                <label>Accessories Available?</label>
                                <div className="radio-group">
                                    {["Yes", "No"].map((opt) => (
                                        <label key={opt}>
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

                                <label>Charger Available?</label>
                                <div className="radio-group">
                                    {["Yes", "No", "Not Applicable"].map((opt) => (
                                        <label key={opt}>
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
                        )}

                        {/* STEP 3: Device Photos */}
                        {currentStep === 2 && (
                            <div className="form-step-card">
                                <h2>3. Device Photos</h2>

                                <label>Front Photo *</label>
                                <input
                                    type="file"
                                    name="frontPhoto"
                                    accept="image/*"
                                    onChange={handleInputChange}
                                    className={error.frontPhoto_er ? "input-error" : ""}
                                />
                                {error.frontPhoto_er && <span className="error">{error.frontPhoto_er}</span>}

                                <label>Back Photo *</label>
                                <input
                                    type="file"
                                    name="backPhoto"
                                    accept="image/*"
                                    onChange={handleInputChange}
                                    className={error.backPhoto_er ? "input-error" : ""}
                                />
                                {error.backPhoto_er && <span className="error">{error.backPhoto_er}</span>}

                                <label>Damage Photo</label>
                                <input
                                    type="file"
                                    name="damagePhoto"
                                    accept="image/*"
                                    onChange={handleInputChange}
                                    className={error.damagePhoto_er ? "input-error" : ""}
                                />
                                {error.damagePhoto_er && <span className="error">{error.damagePhoto_er}</span>}

                                <label>Device Label / Serial Number</label>
                                <input
                                    type="file"
                                    name="labelPhoto"
                                    accept="image/*"
                                    onChange={handleInputChange}
                                    className={error.labelPhoto_er ? "input-error" : ""}
                                />
                                {error.labelPhoto_er && <span className="error">{error.labelPhoto_er}</span>}
                            </div>
                        )}

                        {/* STEP 4: Processing & Pickup Details */}
                        {currentStep === 3 && (
                            <div className="form-step-card">
                                <h2>4. Processing & Pickup Details</h2>

                                <label>Processing Preference *</label>
                                <div className="preference">
                                    <label>
                                        <input
                                            type="radio"
                                            name="processingPreference"
                                            value="valuation"
                                            checked={form_data.processingPreference === "valuation"}
                                            onChange={handleInputChange}
                                        />
                                        <strong>Request Valuation</strong>
                                        <small>Get a valuation/offer for your device.</small>
                                    </label>

                                    <label>
                                        <input
                                            type="radio"
                                            name="processingPreference"
                                            value="recycling"
                                            checked={form_data.processingPreference === "recycling"}
                                            onChange={handleInputChange}
                                        />
                                        <strong>Responsible Recycling</strong>
                                        <small>Recycle your device responsibly.</small>
                                    </label>
                                </div>
                                {error.processingPreference_er && <span className="error">{error.processingPreference_er}</span>}

                                <label>Pickup Address Option</label>
                                <div className="radio-group">
                                    <label>
                                        <input
                                            type="radio"
                                            name="useRegisteredAddress"
                                            value="true"
                                            checked={form_data.useRegisteredAddress === true}
                                            onChange={handleInputChange}
                                        />
                                        Use my registered address
                                    </label>

                                    <label>
                                        <input
                                            type="radio"
                                            name="useRegisteredAddress"
                                            value="false"
                                            checked={form_data.useRegisteredAddress === false}
                                            onChange={handleInputChange}
                                        />
                                        Use a different address
                                    </label>
                                </div>

                                {!form_data.useRegisteredAddress && (
                                    <>
                                        <label>Address *</label>
                                        <textarea
                                            name="address"
                                            value={form_data.address}
                                            onChange={handleInputChange}
                                            placeholder="Enter pickup address"
                                            className={error.address_er ? "input-error" : ""}
                                        ></textarea>
                                        {error.address_er && <span className="error">{error.address_er}</span>}
                                    </>
                                )}

                                <label>Landmark</label>
                                <input
                                    type="text"
                                    name="landmark"
                                    value={form_data.landmark}
                                    onChange={handleInputChange}
                                    placeholder="Enter landmark"
                                    className={error.landmark_er ? "input-error" : ""}
                                />
                                {error.landmark_er && <span className="error">{error.landmark_er}</span>}

                                <label>Preferred Pickup Date *</label>
                                <input
                                    type="date"
                                    name="pickupDate"
                                    value={form_data.pickupDate}
                                    onChange={handleInputChange}
                                    className={error.pickupDate_er ? "input-error" : ""}
                                />
                                {error.pickupDate_er && <span className="error">{error.pickupDate_er}</span>}

                                <label>Preferred Time Slot *</label>
                                <select
                                    name="timeSlot"
                                    value={form_data.timeSlot}
                                    onChange={handleInputChange}
                                    className={error.timeSlot_er ? "input-error" : ""}
                                >
                                    <option value="">Select Time Slot</option>
                                    <option value="9AM-12PM">9:00 AM - 12:00 PM</option>
                                    <option value="12PM-3PM">12:00 PM - 3:00 PM</option>
                                    <option value="3PM-6PM">3:00 PM - 6:00 PM</option>
                                </select>
                                {error.timeSlot_er && <span className="error">{error.timeSlot_er}</span>}

                                <label>Pickup Instructions</label>
                                <textarea
                                    name="pickupInstructions"
                                    value={form_data.pickupInstructions}
                                    onChange={handleInputChange}
                                    placeholder="Optional instructions"
                                    className={error.pickupInstructions_er ? "input-error" : ""}
                                ></textarea>
                                {error.pickupInstructions_er && <span className="error">{error.pickupInstructions_er}</span>}
                            </div>
                        )}

                        {/* STEP 5: Ownership Confirmation */}
                        {currentStep === 4 && (
                            <div className="form-step-card">
                                <h2>5. Ownership & Confirmation</h2>

                                <label>Device Ownership *</label>
                                <div className="radio-group">
                                    <label>
                                        <input
                                            type="radio"
                                            name="ownership"
                                            value="Personal"
                                            checked={form_data.ownership === "Personal"}
                                            onChange={handleInputChange}
                                        />
                                        Personal
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="ownership"
                                            value="Business"
                                            checked={form_data.ownership === "Business"}
                                            onChange={handleInputChange}
                                        />
                                        Business
                                    </label>
                                </div>
                                {error.ownership_er && <span className="error">{error.ownership_er}</span>}

                                <label className="checkbox">
                                    <input
                                        type="checkbox"
                                        name="ownershipConfirmed"
                                        checked={form_data.ownershipConfirmed}
                                        onChange={handleInputChange}
                                        className={error.ownershipConfirmed_er ? "input-error" : ""}
                                    />
                                    I confirm that I am the owner or authorized person to submit this device to EcoCycle.
                                </label>
                                {error.ownershipConfirmed_er && <span className="error">{error.ownershipConfirmed_er}</span>}

                                <label className="checkbox">
                                    <input
                                        type="checkbox"
                                        name="termsAccepted"
                                        checked={form_data.termsAccepted}
                                        onChange={handleInputChange}
                                        className={error.termsAccepted_er ? "input-error" : ""}
                                    />
                                    I agree to the EcoCycle Terms & Services and confirm that the information provided is accurate.
                                </label>
                                {error.termsAccepted_er && <span className="error">{error.termsAccepted_er}</span>}
                            </div>
                        )}

                        {/* Step Navigation Action Buttons */}
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
                    </form>
                </div>
            </main>
        </div>
    );
}

export default Add_device;