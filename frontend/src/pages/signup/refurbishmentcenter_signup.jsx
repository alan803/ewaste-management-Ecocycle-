import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash, FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./refurbishmentcenter_signup.css";
import {
    validate_centrename,
    validate_first_name,
    validate_email,
    validate_password,
    validate_confirm_password,
    validate_phone,
    validate_address,
    validate_state,
    validate_city,
    validate_district,
    validate_pincode,
    validateFile,
    validateDocument,
    validate_businessRegistrationNumber,
    validate_years,
    validate_gst,
    validate_centerlicense,
    validate_buildingno,
    validate_techniciancount,
    validate_street
} from "../../utils/validation";
function RefurbishmentCenter_signup() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [pincodeLoading, setPincodeLoading] = useState(false);
    const [pincodeError, setPincodeError] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const sections = [
        "Basic Information",
        "Business Information",
        "Address Details",
        "Device Types & Services",
        "Operational Details",
        "Documents",
        "Login Details"
    ];

    const [form_dta, set_form_dta] = useState({
        centerName: "",
        ownerName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phoneNumber: "",
        businessRegistrationNumber: "",
        gstNumber: "",
        experienceYears: "",
        licenseNumber: "",
        buildingNumber: "",
        street: "",
        district: "",
        state: "",
        pincode: "",
        city: "",
        deviceTypes: [],
        services: [],
        technicianCount: "",
        pickupAvailable: "",
        businessRegistrationCertificate: null,
        tradeLicense: null,
        addressProof: null,
        centerPhoto: null,
        authorizedPersonId: null
    });

    const [error, seterror] = useState({
        centerName_er: "",
        ownerName_er: "",
        email_er: "",
        password_er: "",
        confirmPassword_er: "",
        phoneNumber_er: "",
        businessRegistrationNumber_er: "",
        gstNumber_er: "",
        experienceYears_er: "",
        licenseNumber_er: "",
        buildingNumber_er: "",
        street_er: "",
        district_er: "",
        state_er: "",
        pincode_er: "",
        city_er: "",
        deviceTypes_er: "",
        services_er: "",
        technicianCount_er: "",
        pickupAvailable_er: "",
        businessRegistrationCertificate_er: "",
        tradeLicense_er: "",
        addressProof_er: "",
        centerPhoto_er: "",
        authorizedPersonId_er: ""
    });

    const [touched, setTouched] = useState({});

    // Fetch location data when PIN code changes
    useEffect(() => {
    const pincode = form_dta.pincode;

    // Don't fetch until exactly 6 digits are entered
    if (pincode.length !== 6) {
        setPincodeError("");
        setPincodeLoading(false);

        // Only clear location when PIN is incomplete
        set_form_dta(prev => ({
            ...prev,
            state: "",
            district: "",
            city: ""
        }));

        return;
    }

    fetchPincodeData(pincode);
}, [form_dta.pincode]);

    const fetchPincodeData = async (pincode) => 
    {
        setPincodeLoading(true);
        setPincodeError("");

        try {
            const response = await axios.get(
                `https://api.postalpincode.in/pincode/${pincode}`
            );

            console.log("PIN API Response:", response.data);

            const result = response.data?.[0];

            if (
                result?.Status === "Success" &&
                result?.PostOffice?.length > 0
            ) 
            {
                const postOffice = result.PostOffice[0];

                console.log("Post Office Data:", postOffice);

                const state = postOffice.State || "";
                const district = postOffice.District || "";

                // You can use Block, Name, or District for city
                const city =
                    postOffice.Name ||
                    postOffice.Block ||
                    postOffice.District ||
                    "";

                set_form_dta(prev => ({
                    ...prev,
                    state: state,
                    district: district,
                    city: city
                }));

                // Clear location validation errors
                seterror(prev => ({
                    ...prev,
                    state_er: "",
                    district_er: "",
                    city_er: "",
                    pincode_er: ""
                }));

                setPincodeError("");
            } else {
                setPincodeError("Invalid PIN code");

                set_form_dta(prev => ({
                    ...prev,
                    state: "",
                    district: "",
                    city: ""
                }));

                seterror(prev => ({
                    ...prev,
                    state_er: "",
                    district_er: "",
                    city_er: ""
                }));
            }

        } catch (error) {
            console.error("PIN code API error:", error);

            setPincodeError("Failed to fetch location data");

            set_form_dta(prev => ({
                ...prev,
                state: "",
                district: "",
                city: ""
            }));
        } finally {
            setPincodeLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

const handleNext = () => {

    // Step 0 - Basic Information
    if (currentStep === 0) {

        const errors = {
            centerName_er: validate_centrename(form_dta.centerName),
            ownerName_er: validate_first_name(form_dta.ownerName),
            email_er: validate_email(form_dta.email),
            phoneNumber_er: validate_phone(form_dta.phoneNumber)
        };

        seterror(prev => ({
            ...prev,
            ...errors
        }));

        if (Object.values(errors).some(errorMessage => errorMessage !== "")) {
            return;
        }

        setCurrentStep(prev => prev + 1);
        return;
    }


    // Step 1 - Business Information
    if (currentStep === 1) {

        const errors = {
            businessRegistrationNumber_er:
                validate_businessRegistrationNumber(
                    form_dta.businessRegistrationNumber
                ),

            gstNumber_er: validate_gst(form_dta.gstNumber),

            experienceYears_er:
                validate_years(form_dta.experienceYears),

            licenseNumber_er:
                validate_centerlicense(form_dta.licenseNumber)
        };

        seterror(prev => ({
            ...prev,
            ...errors
        }));

        if (Object.values(errors).some(errorMessage => errorMessage !== "")) {
            return;
        }

        setCurrentStep(prev => prev + 1);
        return;
    }


    // Step 2 - Address
    if (currentStep === 2) {

        if (pincodeLoading) {
            setPincodeError("Please wait while location details are being fetched");
            return;
        }

        if (pincodeError) {
            return;
        }

        const errors = {
            buildingNumber_er: validate_buildingno(form_dta.buildingNumber),
            street_er: validate_street(form_dta.street),
            pincode_er: validate_pincode(form_dta.pincode),
            state_er: validate_state(form_dta.state),
            district_er: validate_district(form_dta.district),
            city_er: validate_city(form_dta.city)
        };

        seterror(prev => ({
            ...prev,
            ...errors
        }));

        if (Object.values(errors).some(errorMessage => errorMessage !== "")) {
            return;
        }

        setCurrentStep(prev => prev + 1);
        return;
    }

    // Step 3 - Device Types & Services
    if (currentStep === 3) 
    {

        const errors = {
            deviceTypes_er:
                form_dta.deviceTypes.length === 0
                    ? "Please select at least one device type"
                    : "",

            services_er:
                form_dta.services.length === 0
                    ? "Please select at least one service"
                    : ""
        };

        seterror(prev => ({
            ...prev,
            ...errors
        }));

        if (Object.values(errors).some(errorMessage => errorMessage !== "")) {
            return;
        }

        setCurrentStep(prev => prev + 1);
        return;
    }
    // Step 4 - Operational Details
    if (currentStep === 4) {

        const errors = {

            technicianCount_er:
                validate_techniciancount(form_dta.technicianCount),

            pickupAvailable_er:
                form_dta.pickupAvailable
                    ? ""
                    : "Pickup availability is required",

        };

        seterror(prev => ({
            ...prev,
            ...errors
        }));

        if (Object.values(errors).some(errorMessage => errorMessage !== "")) {
            return;
        }

        setCurrentStep(prev => prev + 1);
        return;
    }


    // Step 5 - Documents
    if (currentStep === 5) {

        const errors = {
            businessRegistrationCertificate_er:
                validateDocument(form_dta.businessRegistrationCertificate),

            tradeLicense_er:
                validateDocument(form_dta.tradeLicense),

            addressProof_er:
                validateDocument(form_dta.addressProof),

            centerPhoto_er:
                validateFile(form_dta.centerPhoto),

            authorizedPersonId_er:
                validateDocument(form_dta.authorizedPersonId)
        };

        seterror(prev => ({
            ...prev,
            ...errors
        }));

        if (Object.values(errors).some(errorMessage => errorMessage !== "")) {
            return;
        }

        setCurrentStep(prev => prev + 1);
        return;
    }


    // Other steps
    if (currentStep < sections.length - 1) {
        setCurrentStep(prev => prev + 1);
    }
};

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    function handleInputChange(e) {
        const { name, value, files } = e.target;

        setTouched(prev => ({
            ...prev,
            [name]: true
        }));

        if (name === "pincode") {
            const numericValue = value.replace(/\D/g, "").slice(0, 6);

            set_form_dta(prev => ({
                ...prev,
                pincode: numericValue
            }));

            setPincodeError("");

            seterror(prev => ({
                ...prev,
                pincode_er:
                    numericValue.length === 6
                        ? ""
                        : validate_pincode(numericValue)
            }));

            return;
        }

        if (files) {
            const file = files[0];
            set_form_dta(prev => ({
                ...prev,
                [name]: file
            }));

            if (name === "centerPhoto") {
                seterror(prev => ({
                    ...prev,
                    centerPhoto_er: touched.centerPhoto || file ? validateFile(file) : ""
                }));
            }

            if (name === "businessRegistrationCertificate" || name === "tradeLicense" || name === "addressProof" || name === "authorizedPersonId") {
                seterror(prev => ({
                    ...prev,
                    [`${name}_er`]: validateDocument(file)
                }));
            }

            return;
        }

        set_form_dta(prev => ({
            ...prev,
            [name]: value
        }));

        if(name==="businessRegistrationNumber")
        {
            seterror(prev => ({
                ...prev,
                businessRegistrationNumber_er: validate_businessRegistrationNumber(value)
            }));
        }
        if (name === "centerName") {
            seterror(prev => ({
                ...prev,
                centerName_er: validate_centrename(value)
            }));
        }
        if (name === "ownerName") {
            seterror(prev => ({
                ...prev,
                ownerName_er: validate_first_name(value)
            }));
        }
        if (name === "email") {
            seterror(prev => ({
                ...prev,
                email_er: validate_email(value)
            }));
        }
        if (name === "phoneNumber") {
            seterror(prev => ({
                ...prev,
                phoneNumber_er: validate_phone(value)
            }));
        }
        if (name === "gstNumber") {
            seterror(prev => ({
                ...prev,
                gstNumber_er: validate_gst(value)
            }));
        }
        if (name === "licenseNumber") {
            seterror(prev => ({
                ...prev,
                licenseNumber_er: validate_centerlicense(value)
            }));
        }
        if (name === "buildingNumber") {
            seterror(prev => ({
                ...prev,
                buildingNumber_er: validate_buildingno(value)
            }));
        }

        if (name === "street") {
            seterror(prev => ({
                ...prev,
                street_er: validate_street(value)
            }));
        }
        if (name === "district") {
            seterror(prev => ({
                ...prev,
                district_er: validate_district(value)
            }));
        }
        if (name === "technicianCount") {
            seterror(prev => ({
                ...prev,
                technicianCount_er: validate_techniciancount(value)
            }));
        }
        if (name === "experienceYears") {
            seterror(prev => ({
                ...prev,
                experienceYears_er: validate_years(value)
            }));
        }
        if (name === "password") {
            set_form_dta(prev => ({
                ...prev,
                password: value
            }));

            seterror(prev => ({
                ...prev,
                password_er:
                    value.trim() === ""
                        ? "Password is required"
                        : validate_password(value),

                // Revalidate confirm password when password changes
                confirmPassword_er:
                    form_dta.confirmPassword.trim() === ""
                        ? ""
                        : validate_confirm_password(
                            form_dta.confirmPassword,
                            value
                        )
            }));

            return;
        }

        if (name === "confirmPassword") {
            seterror(prev => ({
                ...prev,
                confirmPassword_er:
                    value.trim() === ""
                        ? "Please confirm your password"
                        : validate_confirm_password(
                            value,
                            form_dta.password
                        )
            }));

            return;
        }
    }

    const handleCheckboxChange = (e, category) => 
    {
        const { value, checked } = e.target;

        set_form_dta(prev => {
            const updatedValues = checked
                ? [...prev[category], value]
                : prev[category].filter(item => item !== value);

            // Only clear the error when at least one option is selected
            if (updatedValues.length > 0) {
                seterror(prevError => ({
                    ...prevError,
                    [`${category}_er`]: ""
                }));
            }

            return {
                ...prev,
                [category]: updatedValues
            };
        });
    };

    async function refurbishmentCenter_validation(e) {
        e.preventDefault();

        const newErrors = {
            centerName_er: validate_centrename(form_dta.centerName),
            ownerName_er: validate_first_name(form_dta.ownerName),
            email_er: validate_email(form_dta.email),
            phoneNumber_er: validate_phone(form_dta.phoneNumber),
            password_er: form_dta.password.trim() === "" ? "Password is required" : validate_password(form_dta.password),
            confirmPassword_er: form_dta.confirmPassword.trim() === "" ? "Please confirm your password" : validate_confirm_password(form_dta.confirmPassword, form_dta.password),
            businessRegistrationNumber_er: validate_businessRegistrationNumber(form_dta.businessRegistrationNumber),
            gstNumber_er: form_dta.gstNumber ? validate_gst(form_dta.gstNumber) : "",
            experienceYears_er: validate_years(form_dta.experienceYears),
            licenseNumber_er: form_dta.licenseNumber ? validate_centerlicense(form_dta.licenseNumber) : "",
            buildingNumber_er: validate_buildingno(form_dta.buildingNumber),
            street_er: validate_street(form_dta.street),
            pincode_er: validate_pincode(form_dta.pincode),
            state_er: validate_state(form_dta.state),
            district_er: validate_district(form_dta.district),
            city_er: validate_city(form_dta.city),
            deviceTypes_er: form_dta.deviceTypes.length === 0 ? "Please select at least one device type" : "",
            services_er: form_dta.services.length === 0 ? "Please select at least one service" : "",
            technicianCount_er: validate_techniciancount(form_dta.technicianCount),
            pickupAvailable_er: form_dta.pickupAvailable ? "" : "Pickup availability is required",
            businessRegistrationCertificate_er: validateDocument(form_dta.businessRegistrationCertificate),
            tradeLicense_er: validateDocument(form_dta.tradeLicense),
            addressProof_er: validateDocument(form_dta.addressProof),
            centerPhoto_er: validateFile(form_dta.centerPhoto),
            authorizedPersonId_er: validateDocument(form_dta.authorizedPersonId)
        };

        setTouched({
            centerName: true,
            ownerName: true,
            email: true,
            phoneNumber: true,
            password: true,
            confirmPassword: true,
            businessRegistrationNumber: true,
            gstNumber: true,
            experienceYears: true,
            licenseNumber: true,
            buildingNumber: true,
            street: true,
            pincode: true,
            state: true,
            district: true,
            city: true,
            technicianCount: true,
            pickupAvailable: true,
            businessRegistrationCertificate: true,
            tradeLicense: true,
            addressProof: true,
            centerPhoto: true,
            authorizedPersonId: true
        });

        seterror(newErrors);

        const hasErrors = Object.values(newErrors).some((message) => message !== "");

        if (hasErrors) {
            console.log("Validation errors:", newErrors);
            return;
        }

        // Create FormData
        const formData = new FormData();

        formData.append("centerName", form_dta.centerName);
        formData.append("ownerName", form_dta.ownerName);
        formData.append("email", form_dta.email);
        formData.append("password", form_dta.password);
        formData.append("confirmPassword", form_dta.confirmPassword);
        formData.append("phoneNumber", form_dta.phoneNumber);

        formData.append("businessRegistrationNumber", form_dta.businessRegistrationNumber);

        formData.append("gstNumber", form_dta.gstNumber);
        formData.append("experienceYears", form_dta.experienceYears);
        formData.append("licenseNumber", form_dta.licenseNumber);

        formData.append("buildingNumber", form_dta.buildingNumber);
        formData.append("street", form_dta.street);
        formData.append("district", form_dta.district);
        formData.append("state", form_dta.state);
        formData.append("pincode", form_dta.pincode);
        formData.append("city", form_dta.city);

        formData.append("technicianCount", form_dta.technicianCount);
        formData.append("pickupAvailable", form_dta.pickupAvailable);

        // Device Types
        form_dta.deviceTypes.forEach((device) => {
            formData.append("deviceTypes", device);
        });

        // Services
        form_dta.services.forEach((service) => {
            formData.append("services", service);
        });

        // Files
        if (form_dta.businessRegistrationCertificate) {
            formData.append("businessRegistrationCertificate", form_dta.businessRegistrationCertificate);
        }

        if (form_dta.tradeLicense) {
            formData.append("tradeLicense", form_dta.tradeLicense);
        }

        if (form_dta.addressProof) {
            formData.append("addressProof", form_dta.addressProof);
        }

        if (form_dta.centerPhoto) {
            formData.append("centerPhoto", form_dta.centerPhoto);
        }

        if (form_dta.authorizedPersonId) {
            formData.append("authorizedPersonId", form_dta.authorizedPersonId);
        }

        // Debug FormData
        for (const pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }

        try {
            const response = await axios.post(
                "https://ecocycle.runasp.net/api/RefurbishmentCenter/Register",
                formData
            );

            console.log("Registration response:", response.data);

            if (response.status === 200 || response.status === 201) {
                setIsSubmitted(true);
            }
        } catch (error) {
            console.error("Registration failed:", error);

            if (error.response) {
                console.error("Backend response:", error.response.data);
                console.error("Status:", error.response.status);
            } else if (error.request) {
                console.error("No response received from backend");
            } else {
                console.error("Request error:", error.message);
            }

            alert(error.response?.data?.message || "Registration failed. Please try again.");
        }
    }

    return (
        <div className="refurbishmentcenter-signup">
            <div className="refurbishmentcenter-visual">
                <div className="refurbishmentcenter-visual-content">
                    <span className="refurbishmentcenter-brand">ECOCYCLE</span>
                    <h2>Register Refurbishment Center</h2>
                    <p>
                        Join EcoCycle as a refurbishment center to repair electronics,
                        reduce e-waste, and contribute to a sustainable future.
                    </p>
                </div>
                <div className="refurbishmentcenter-blob refurbishmentcenter-blob--1" />
                <div className="refurbishmentcenter-blob refurbishmentcenter-blob--2" />
                <div className="refurbishmentcenter-blob refurbishmentcenter-blob--3" />
            </div>

            <div className="refurbishmentcenter-panel">
                <div className="refurbishmentcenter-card">
                    {isSubmitted ? (
                        <div className="registration-success-container" style={{ textAlign: "center", padding: "2rem 1rem" }}>
                            <div className="success-icon-wrapper" style={{
                                width: "76px",
                                height: "76px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, rgba(234, 179, 8, 0.18), rgba(245, 158, 11, 0.08))",
                                border: "2px solid #eab308",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 1.25rem auto",
                                color: "#eab308",
                                fontSize: "2.25rem"
                            }}>
                                <FaClock />
                            </div>
                            <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem", fontFamily: "'Space Grotesk', sans-serif" }}>
                                Application Submitted Successfully!
                            </h2>
                            <div style={{
                                background: "rgba(234, 179, 8, 0.08)",
                                border: "1px solid rgba(234, 179, 8, 0.3)",
                                borderRadius: "12px",
                                padding: "1.25rem 1.5rem",
                                marginBottom: "1.5rem",
                                textAlign: "left"
                            }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "#a16207", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span>⏳</span> Account Verification Pending
                                </p>
                                <p style={{ margin: "0.5rem 0 0 0", color: "#475569", fontSize: "0.9rem", lineHeight: 1.6 }}>
                                    Your Refurbishment Center account has been created. <strong>Please note that your account needs to be verified and approved by the Administrator before you can log in.</strong>
                                </p>
                            </div>
                            <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "2rem", lineHeight: 1.5 }}>
                                Thank you for registering with EcoCycle. Please wait for admin approval. You can return to the login page to sign in once approved.
                            </p>
                            <button
                                type="button"
                                className="refurbishmentcenter-btn"
                                onClick={() => navigate("/login")}
                                style={{ maxWidth: "220px", margin: "0 auto", display: "block", textTransform: "none" }}
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="refurbishmentcenter-header">
                                <div className="refurbishmentcenter-eyebrow">REFURBISHMENT CENTER REGISTRATION</div>
                                <h1>Sign Up</h1>
                                <p>Fill in your center details to get started</p>
                                <div className="role-signup-select-wrapper header-role-select">
                                    <label htmlFor="refurb-role-select">Select Registration Role:</label>
                                    <select
                                        id="refurb-role-select"
                                        className="role-signup-select"
                                        value="/signup/refurbishmententer_signup"
                                        onChange={(e) => navigate(e.target.value)}
                                    >
                                        <option value="/signup">Individual / Citizen</option>
                                        <option value="/signup/collection-agent">Collection Agent</option>
                                        <option value="/technician_signup">Inspection Technician</option>
                                        <option value="/signup/refurbishmententer_signup">Refurbishment Center</option>
                                        <option value="/signup/recyclingcenter_signup">Recycling Center</option>
                                    </select>
                                </div>
                            </div>

                            <form className="refurbishmentcenter-form" onSubmit={refurbishmentCenter_validation}>
                                {currentStep === 0 && (
                                <div className="form-section">
                                    <h3>Basic Information</h3>
                                    <div className="refurbishmentcenter-form-grid">
                                        <div className="refurbishmentcenter-field">
                                            <label>Center Name</label>
                                            <input
                                                type="text"
                                                placeholder="Enter center name"
                                                name="centerName"
                                                value={form_dta.centerName}
                                                onChange={handleInputChange}
                                                className={error.centerName_er ? "input-error" : ""}
                                            />
                                            {error.centerName_er && <div className="error-message">{error.centerName_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>Phone Number</label>
                                            <input
                                                type="tel"
                                                placeholder="Enter phone number"
                                                name="phoneNumber"
                                                value={form_dta.phoneNumber}
                                                onChange={handleInputChange}
                                                className={error.phoneNumber_er ? "input-error" : ""}
                                            />
                                            {error.phoneNumber_er && <div className="error-message">{error.phoneNumber_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>Owner Name</label>
                                            <input
                                                type="text"
                                                placeholder="Enter owner name"
                                                name="ownerName"
                                                value={form_dta.ownerName}
                                                onChange={handleInputChange}
                                                className={error.ownerName_er ? "input-error" : ""}
                                            />
                                            {error.ownerName_er && <div className="error-message">{error.ownerName_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                placeholder="Enter email"
                                                name="email"
                                                value={form_dta.email}
                                                onChange={handleInputChange}
                                                className={error.email_er ? "input-error" : ""}
                                            />
                                            {error.email_er && <div className="error-message">{error.email_er}</div>}
                                        </div>
                                    </div>
                                </div>
                                )}

                                {currentStep === 1 && (
                                <div className="form-section">
                                    <h3>Business Information</h3>
                                    <div className="refurbishmentcenter-form-grid">
                                        <div className="refurbishmentcenter-field">
                                            <label>Business Registration Number</label>
                                            <input
                                                type="text"
                                                placeholder="Enter registration no eg:KA9876543210123"
                                                name="businessRegistrationNumber"
                                                value={form_dta.businessRegistrationNumber}
                                                onChange={handleInputChange}
                                                className={error.businessRegistrationNumber_er ? "input-error" : ""}
                                            />
                                            {error.businessRegistrationNumber_er && <div className="error-message">{error.businessRegistrationNumber_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>Years of Experience</label>
                                            <input
                                                type="number"
                                                placeholder="Enter years"
                                                name="experienceYears"
                                                value={form_dta.experienceYears}
                                                onChange={handleInputChange}
                                                min="0"
                                                className={error.experienceYears_er ? "input-error" : ""}
                                            />
                                            {error.experienceYears_er && <div className="error-message">{error.experienceYears_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>GST Number</label>
                                            <input
                                                type="text"
                                                placeholder="Enter GST number eg: 22AAAAA0000A1Z5"
                                                name="gstNumber"
                                                value={form_dta.gstNumber}
                                                onChange={handleInputChange}
                                                maxLength={15}
                                                className={error.gstNumber_er ? "input-error" : ""}
                                            />
                                            {error.gstNumber_er && (
                                                <div className="error-message">
                                                    {error.gstNumber_er}
                                                </div>
                                            )}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>License Number</label>
                                            <input
                                                type="text"
                                                placeholder="Enter license number eg:MH123456789012"
                                                name="licenseNumber"
                                                value={form_dta.licenseNumber}
                                                onChange={handleInputChange}
                                                className={error.licenseNumber_er ? "input-error" : ""}
                                            />
                                            {error.licenseNumber_er && <div className="error-message">{error.licenseNumber_er}</div>}
                                        </div>
                                    </div>
                                </div>
                                )}

                                {currentStep === 2 && (
                                <div className="form-section">
                                    <h3>Address Details</h3>
                                    <div className="refurbishmentcenter-form-grid">
                                        <div className="refurbishmentcenter-field">
                                            <label>Building Number</label>
                                            <input
                                                type="text"
                                                placeholder="Enter building number"
                                                name="buildingNumber"
                                                value={form_dta.buildingNumber}
                                                onChange={handleInputChange}
                                                className={error.buildingNumber_er ? "input-error" : ""}
                                            />
                                            {error.buildingNumber_er && <div className="error-message">{error.buildingNumber_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>State</label>
                                            <input
                                                type="text"
                                                name="state"
                                                value={form_dta.state}
                                                readOnly
                                                className={
                                                    error.state_er
                                                        ? "input-error"
                                                        : "readonly-field"
                                                }
                                            />
                                            {error.state_er && (
                                                <div className="error-message">
                                                    {error.state_er}
                                                </div>
                                            )}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>Street</label>
                                            <input
                                                type="text"
                                                placeholder="Enter street"
                                                name="street"
                                                value={form_dta.street}
                                                onChange={handleInputChange}
                                                className={error.street_er ? "input-error" : ""}
                                            />
                                            {error.street_er && <div className="error-message">{error.street_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>District</label>
                                            <input
                                                type="text"
                                                name="district"
                                                value={form_dta.district}
                                                readOnly
                                                className={
                                                    error.district_er
                                                        ? "input-error"
                                                        : "readonly-field"
                                                }
                                            />
                                            {error.district_er && (
                                                <div className="error-message">
                                                    {error.district_er}
                                                </div>
                                            )}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>PIN Code</label>
                                            <input
                                                type="text"
                                                placeholder="Enter 6-digit PIN code"
                                                name="pincode"
                                                value={form_dta.pincode}
                                                onChange={handleInputChange}
                                                maxLength={6}
                                                className={error.pincode_er || pincodeError ? "input-error" : ""}
                                            />
                                            {pincodeLoading && <div className="loading-text">Fetching location...</div>}
                                            {pincodeError && <div className="error-message">{pincodeError}</div>}
                                            {error.pincode_er && <div className="error-message">{error.pincode_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={form_dta.city}
                                                readOnly
                                                className={
                                                    error.city_er
                                                        ? "input-error"
                                                        : "readonly-field"
                                                }
                                            />
                                            {error.city_er && (
                                                <div className="error-message">
                                                    {error.city_er}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                )}

                                {currentStep === 3 && (
                                <div className="form-section">
                                    <h3>Device Types & Services</h3>
                                    <div className="refurbishmentcenter-field">
                                        <label>Device Types</label>

                                        <div
                                            className={
                                                error.deviceTypes_er
                                                    ? "checkbox-grid checkbox-error"
                                                    : "checkbox-grid"
                                            }
                                        >
                                            {[
                                                "Mobile Phones",
                                                "Laptops",
                                                "Desktop Computers",
                                                "Tablets",
                                                "Printers",
                                                "TVs",
                                                "Monitors",
                                                "UPS",
                                                "Networking Devices",
                                                "Other"
                                            ].map((device) => (
                                                <label className="checkbox-item" key={device}>
                                                    <input
                                                        type="checkbox"
                                                        value={device}
                                                        checked={form_dta.deviceTypes.includes(device)}
                                                        onChange={(e) =>
                                                            handleCheckboxChange(e, "deviceTypes")
                                                        }
                                                    />
                                                    <span>{device}</span>
                                                </label>
                                            ))}
                                        </div>

                                        {error.deviceTypes_er && (
                                            <div className="error-message">
                                                {error.deviceTypes_er}
                                            </div>
                                        )}
                                    </div>
                                    <div className="refurbishmentcenter-field">
                                        <label>Services Offered</label>

                                        <div
                                            className={
                                                error.services_er
                                                    ? "checkbox-grid checkbox-error"
                                                    : "checkbox-grid"
                                            }
                                        >
                                            {[
                                                "Screen Replacement",
                                                "Battery Replacement",
                                                "Motherboard Repair",
                                                "Data Recovery",
                                                "Software Installation",
                                                "Component Replacement",
                                                "Cleaning & Maintenance"
                                            ].map((service) => (
                                                <label className="checkbox-item" key={service}>
                                                    <input
                                                        type="checkbox"
                                                        value={service}
                                                        checked={form_dta.services.includes(service)}
                                                        onChange={(e) =>
                                                            handleCheckboxChange(e, "services")
                                                        }
                                                    />
                                                    <span>{service}</span>
                                                </label>
                                            ))}
                                        </div>

                                        {error.services_er && (
                                            <div className="error-message">
                                                {error.services_er}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                )}

                                {currentStep === 4 && (
                                <div className="form-section">
                                    <h3>Operational Details</h3>
                                    <div className="refurbishmentcenter-form-grid">
                                        <div className="refurbishmentcenter-field">
                                            <label>Technician Count</label>
                                            <input
                                                type="number"
                                                placeholder="Enter technician count"
                                                name="technicianCount"
                                                value={form_dta.technicianCount}
                                                onChange={handleInputChange}
                                                min="1"
                                                className={error.technicianCount_er ? "input-error" : ""}
                                            />
                                            {error.technicianCount_er && <div className="error-message">{error.technicianCount_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>Pickup Available</label>
                                            <select
                                                name="pickupAvailable"
                                                value={form_dta.pickupAvailable}
                                                onChange={handleInputChange}
                                                className={error.pickupAvailable_er ? "input-error" : ""}
                                            >
                                                <option value="">Select</option>
                                                <option value="Yes">Yes</option>
                                                <option value="No">No</option>
                                            </select>
                                            {error.pickupAvailable_er && <div className="error-message">{error.pickupAvailable_er}</div>}
                                        </div>
                                    </div>
                                </div>
                                )}

                                {currentStep === 5 && (
                                <div className="form-section">
                                    <h3>Documents</h3>
                                    <div className="refurbishmentcenter-form-grid">
                                        <div className="refurbishmentcenter-field">
                                            <label>Business Registration Certificate</label>
                                            <input
                                                type="file"
                                                name="businessRegistrationCertificate"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleInputChange}
                                                className={error.businessRegistrationCertificate_er ? "input-error" : ""}
                                            />
                                            {error.businessRegistrationCertificate_er && <div className="error-message">{error.businessRegistrationCertificate_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>Trade License</label>
                                            <input
                                                type="file"
                                                name="tradeLicense"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleInputChange}
                                                className={error.tradeLicense_er ? "input-error" : ""}
                                            />
                                            {error.tradeLicense_er && <div className="error-message">{error.tradeLicense_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>Address Proof</label>
                                            <input
                                                type="file"
                                                name="addressProof"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleInputChange}
                                                className={error.addressProof_er ? "input-error" : ""}
                                            />
                                            {error.addressProof_er && <div className="error-message">{error.addressProof_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>Center Photo</label>
                                            <input
                                                type="file"
                                                name="centerPhoto"
                                                accept=".jpg,.jpeg,.png"
                                                onChange={handleInputChange}
                                                className={error.centerPhoto_er ? "input-error" : ""}
                                            />
                                            {error.centerPhoto_er && <div className="error-message">{error.centerPhoto_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field" style={{ gridColumn: "1 / -1" }}>
                                            <label>Authorized Person ID</label>
                                            <input
                                                type="file"
                                                name="authorizedPersonId"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleInputChange}
                                                className={error.authorizedPersonId_er ? "input-error" : ""}
                                            />
                                            {error.authorizedPersonId_er && <div className="error-message">{error.authorizedPersonId_er}</div>}
                                        </div>
                                    </div>
                                </div>
                                )}

                                {currentStep === 6 && (
                                    <div className="form-section">
                                        <h3>Login Details</h3>
                                        <div className="refurbishmentcenter-form-grid">
                                            <div className="refurbishmentcenter-field">
                                                <label>Password</label>
                                                <div className="password-input-wrapper">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Create password"
                                                        name="password"
                                                        value={form_dta.password}
                                                        onChange={handleInputChange}
                                                        className={error.password_er ? "input-error" : ""}
                                                    />
                                                    <button type="button" className="password-toggle-btn" onClick={togglePasswordVisibility} aria-label={showPassword ? "Hide password" : "Show password"}>
                                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                    </button>
                                                </div>
                                                {error.password_er && <div className="error-message">{error.password_er}</div>}
                                            </div>
                                            <div className="refurbishmentcenter-field">
                                                <label>Confirm Password</label>
                                                <div className="password-input-wrapper">
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        placeholder="Confirm password"
                                                        name="confirmPassword"
                                                        value={form_dta.confirmPassword}
                                                        onChange={handleInputChange}
                                                        className={error.confirmPassword_er ? "input-error" : ""}
                                                    />
                                                    <button type="button" className="password-toggle-btn" onClick={toggleConfirmPasswordVisibility} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                                    </button>
                                                </div>
                                                {error.confirmPassword_er && <div className="error-message">{error.confirmPassword_er}</div>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="form-navigation">
                                    {currentStep > 0 && (
                                        <button type="button" className="nav-btn prev-btn" onClick={handlePrevious}>
                                            Previous
                                        </button>
                                    )}
                                    {currentStep < sections.length - 1 ? (
                                        <button type="button" className="nav-btn next-btn" onClick={handleNext}>
                                            Next
                                        </button>
                                    ) : (
                                        <button type="submit" className="refurbishmentcenter-btn">
                                            Register
                                        </button>
                                    )}
                                </div>

                                <div className="step-indicator">
                                    {sections.map((_, index) => (
                                        <div
                                            key={index}
                                            className={`step-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                                        >
                                            {index + 1}
                                        </div>
                                    ))}
                                </div>
                            </form>

                            <div className="refurbishmentcenter-footer">
                                <p>Already have an account? <a href="/login">Sign in</a></p>
                                <p><a href="/" style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>← Back to home</a></p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RefurbishmentCenter_signup;