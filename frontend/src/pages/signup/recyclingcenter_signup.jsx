import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash, FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./recyclingcenter_signup.css";
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
    validate_street
} from "../../utils/validation";

function RecyclingCenter_signup() {
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
        "Capabilities & E-Waste",
        "Operational Details",
        "Documents",
        "Login Details"
    ];

    const [form_dta, set_form_dta] = useState({
        // Basic Information
        centerName: "",
        ownerName: "",
        email: "",
        phoneNumber: "",

        // Business Information
        businessRegistrationNumber: "",
        gstNumber: "",
        experienceYears: "",
        recyclerRegistrationNumber: "",

        // Address
        buildingNumber: "",
        street: "",
        district: "",
        state: "",
        pincode: "",
        city: "",

        // E-Waste Types
        deviceTypes: [],

        // Recycling Capabilities
        recyclingProcesses: [],

        // Operational Details
        pickupAvailable: "",
        hazardousWasteHandling: "",

        // Materials
        recoveredMaterials: [],

        // Hazardous Waste
        hazardousWasteTypes: [],

        // Documents
        businessRegistrationCertificate: null,
        recyclerRegistrationCertificate: null,
        consentToOperate: null,
        hazardousWasteAuthorization: null,
        addressProof: null,
        centerPhoto: null,
        authorizedPersonId: null,

        // Login
        password: "",
        confirmPassword: ""
    });

    const [error, seterror] = useState({
        centerName_er: "",
        ownerName_er: "",
        email_er: "",
        phoneNumber_er: "",

        businessRegistrationNumber_er: "",
        gstNumber_er: "",
        experienceYears_er: "",
        recyclerRegistrationNumber_er: "",

        buildingNumber_er: "",
        street_er: "",
        district_er: "",
        state_er: "",
        pincode_er: "",
        city_er: "",

        deviceTypes_er: "",
        recyclingProcesses_er: "",

        pickupAvailable_er: "",
        hazardousWasteHandling_er: "",
        recoveredMaterials_er: "",
        hazardousWasteTypes_er: "",

        businessRegistrationCertificate_er: "",
        recyclerRegistrationCertificate_er: "",
        consentToOperate_er: "",
        hazardousWasteAuthorization_er: "",
        addressProof_er: "",
        centerPhoto_er: "",
        authorizedPersonId_er: "",

        password_er: "",
        confirmPassword_er: ""
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

    const fetchPincodeData = async (pincode) => {
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
            ) {
                const postOffice = result.PostOffice[0];

                console.log("Post Office Data:", postOffice);

                const state = postOffice.State || "";
                const district = postOffice.District || "";

                // Use Name, Block, or District for city
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

    const validate_recyclerRegistrationNumber = (value) => {
        if (!value || value.trim() === "") {
            return "Recycler registration number is required";
        }
        if (value.length < 4 || value.length > 25) {
            return "Registration number must be 4-25 characters long";
        }
        if (!/^[a-zA-Z0-9/-]+$/.test(value)) {
            return "Only letters, numbers, hyphen (-), and slash (/) are allowed";
        }
        return "";
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
                experienceYears_er: validate_years(form_dta.experienceYears),
                recyclerRegistrationNumber_er: validate_recyclerRegistrationNumber(
                    form_dta.recyclerRegistrationNumber
                )
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

        // Step 2 - Address Details
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

        // Step 3 - Capabilities & E-Waste
        if (currentStep === 3) {
            const errors = {
                deviceTypes_er:
                    form_dta.deviceTypes.length === 0
                        ? "Please select at least one device type"
                        : "",
                recyclingProcesses_er:
                    form_dta.recyclingProcesses.length === 0
                        ? "Please select at least one recycling process"
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
                pickupAvailable_er:
                    form_dta.pickupAvailable
                        ? ""
                        : "Pickup availability is required",
                hazardousWasteHandling_er:
                    form_dta.hazardousWasteHandling
                        ? ""
                        : "Hazardous waste handling capability is required",
                recoveredMaterials_er:
                    form_dta.recoveredMaterials.length === 0
                        ? "Please select at least one recovered material"
                        : "",
                hazardousWasteTypes_er:
                    form_dta.hazardousWasteHandling === "Yes" &&
                    form_dta.hazardousWasteTypes.length === 0
                        ? "Please select at least one hazardous waste type"
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

        // Step 5 - Documents
        if (currentStep === 5) {
            const errors = {
                businessRegistrationCertificate_er:
                    validateDocument(form_dta.businessRegistrationCertificate),

                recyclerRegistrationCertificate_er:
                    validateDocument(form_dta.recyclerRegistrationCertificate),

                consentToOperate_er:
                    validateDocument(form_dta.consentToOperate),

                hazardousWasteAuthorization_er:
                    form_dta.hazardousWasteHandling === "Yes"
                        ? validateDocument(form_dta.hazardousWasteAuthorization)
                        : "",

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

            if (
                name === "businessRegistrationCertificate" ||
                name === "recyclerRegistrationCertificate" ||
                name === "consentToOperate" ||
                name === "hazardousWasteAuthorization" ||
                name === "addressProof" ||
                name === "authorizedPersonId"
            ) {
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

        if (name === "businessRegistrationNumber") {
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
        if (name === "recyclerRegistrationNumber") {
            seterror(prev => ({
                ...prev,
                recyclerRegistrationNumber_er: validate_recyclerRegistrationNumber(value)
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
        if (name === "experienceYears") {
            seterror(prev => ({
                ...prev,
                experienceYears_er: validate_years(value)
            }));
        }
        if (name === "password") {
            seterror(prev => ({
                ...prev,
                password_er: validate_password(value),
                confirmPassword_er: form_dta.confirmPassword
                    ? validate_confirm_password(form_dta.confirmPassword, value)
                    : prev.confirmPassword_er
            }));
            return;
        }

        if (name === "confirmPassword") {
            seterror(prev => ({
                ...prev,
                confirmPassword_er: validate_confirm_password(value, form_dta.password)
            }));
            return;
        }
    }

    const handleCheckboxChange = (e, category) => {
        const { value, checked } = e.target;

        set_form_dta(prev => {
            const updatedValues = checked
                ? [...prev[category], value]
                : prev[category].filter(item => item !== value);

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
    async function recyclingCenter_validation(e)
    {
        e.preventDefault();

        const newErrors = {
            // Basic Information
            centerName_er: validate_centrename(form_dta.centerName),
            ownerName_er: validate_first_name(form_dta.ownerName),
            email_er: validate_email(form_dta.email),
            phoneNumber_er: validate_phone(form_dta.phoneNumber),

            // Business Information
            businessRegistrationNumber_er:
                validate_businessRegistrationNumber(
                    form_dta.businessRegistrationNumber
                ),

            gstNumber_er:
                form_dta.gstNumber
                    ? validate_gst(form_dta.gstNumber)
                    : "",

            experienceYears_er:
                validate_years(form_dta.experienceYears),

            recyclerRegistrationNumber_er:
                validate_recyclerRegistrationNumber(
                    form_dta.recyclerRegistrationNumber
                ),

            // Address Details
            buildingNumber_er:
                validate_buildingno(form_dta.buildingNumber),

            street_er:
                validate_street(form_dta.street),

            pincode_er:
                validate_pincode(form_dta.pincode),

            state_er:
                validate_state(form_dta.state),

            district_er:
                validate_district(form_dta.district),

            city_er:
                validate_city(form_dta.city),

            // Capabilities
            deviceTypes_er:
                form_dta.deviceTypes.length === 0
                    ? "Please select at least one device type"
                    : "",

            recyclingProcesses_er:
                form_dta.recyclingProcesses.length === 0
                    ? "Please select at least one recycling process"
                    : "",

            // Operational Details
            pickupAvailable_er:
                form_dta.pickupAvailable
                    ? ""
                    : "Pickup availability is required",

            hazardousWasteHandling_er:
                form_dta.hazardousWasteHandling
                    ? ""
                    : "Hazardous waste handling capability is required",

            recoveredMaterials_er:
                form_dta.recoveredMaterials.length === 0
                    ? "Please select at least one recovered material"
                    : "",

            hazardousWasteTypes_er:
                form_dta.hazardousWasteHandling === "Yes" &&
                form_dta.hazardousWasteTypes.length === 0
                    ? "Please select at least one hazardous waste type"
                    : "",

            // Documents
            businessRegistrationCertificate_er:
                validateDocument(
                    form_dta.businessRegistrationCertificate
                ),

            recyclerRegistrationCertificate_er:
                validateDocument(
                    form_dta.recyclerRegistrationCertificate
                ),

            consentToOperate_er:
                validateDocument(form_dta.consentToOperate),

            hazardousWasteAuthorization_er:
                form_dta.hazardousWasteHandling === "Yes"
                    ? validateDocument(
                        form_dta.hazardousWasteAuthorization
                    )
                    : "",

            addressProof_er:
                validateDocument(form_dta.addressProof),

            centerPhoto_er:
                validateFile(form_dta.centerPhoto),

            authorizedPersonId_er:
                validateDocument(form_dta.authorizedPersonId),

            // Login Details
            password_er:
                form_dta.password.trim() === ""
                    ? "Password is required"
                    : validate_password(form_dta.password),

            confirmPassword_er:
                form_dta.confirmPassword.trim() === ""
                    ? "Please confirm your password"
                    : validate_confirm_password(
                        form_dta.confirmPassword,
                        form_dta.password
                    )
        };

        // Store validation errors
        seterror(newErrors);

        // Stop submission if there are validation errors
        if (Object.values(newErrors).some(err => err !== ""))
        {
            return;
        }

        // Create FormData
        const formData = new FormData();

        Object.keys(form_dta).forEach((key) =>
        {
            const value = form_dta[key];

            // Skip null / undefined values
            if (value === null || value === undefined)
            {
                return;
            }

            // Handle arrays
            if (Array.isArray(value))
            {
                value.forEach(item =>
                {
                    formData.append(key, item);
                });

                return;
            }

            // Handle files and normal values
            formData.append(key, value);
        });

        try
        {
            await axios.post(
                "https://localhost:7102/api/RecyclingCenter/Register",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setIsSubmitted(true);
        }
        catch (error)
        {
            console.error("Registration failed:", error);

            if (error.response)
            {
                console.error(
                    "Server response:",
                    error.response.data
                );
            }

            alert("Registration failed. Please try again.");
        }
    }
    
    return (
        <div className="refurbishmentcenter-signup">
            <div className="refurbishmentcenter-visual">
                <div className="refurbishmentcenter-visual-content">
                    <span className="refurbishmentcenter-brand">ECOCYCLE</span>
                    <h2>Register Recycling Center</h2>
                    <p>
                        Join EcoCycle as an authorized recycling center to process e-waste,
                        recover valuable raw materials, and drive circular economy solutions.
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
                                    Your Recycling Center account has been created. <strong>Please note that your account needs to be verified and approved by the Administrator before you can log in.</strong>
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
                        <div className="refurbishmentcenter-eyebrow">RECYCLING CENTER REGISTRATION</div>
                        <h1>Sign Up</h1>
                        <p>Fill in your center details to get started</p>
                        <div className="role-signup-select-wrapper header-role-select">
                            <label htmlFor="recycling-role-select">Select Registration Role:</label>
                            <select
                                id="recycling-role-select"
                                className="role-signup-select"
                                value="/signup/recyclingcenter_signup"
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

                    <form className="refurbishmentcenter-form" onSubmit={recyclingCenter_validation}>
                        {currentStep === 0 && (
                            <div className="form-section">
                                <h3>Basic Information</h3>
                                <div className="refurbishmentcenter-form-grid">
                                    <div className="refurbishmentcenter-form-column">
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
                                    </div>
                                    <div className="refurbishmentcenter-form-column">
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
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="form-section">
                                <h3>Business Information</h3>
                                <div className="refurbishmentcenter-form-grid">
                                    <div className="refurbishmentcenter-form-column">
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
                                    </div>
                                    <div className="refurbishmentcenter-form-column">
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
                                            <label>Recycler Registration Number</label>
                                            <input
                                                type="text"
                                                placeholder="Enter registration number eg:CPCB/REC/2023/102"
                                                name="recyclerRegistrationNumber"
                                                value={form_dta.recyclerRegistrationNumber}
                                                onChange={handleInputChange}
                                                className={error.recyclerRegistrationNumber_er ? "input-error" : ""}
                                            />
                                            {error.recyclerRegistrationNumber_er && <div className="error-message">{error.recyclerRegistrationNumber_er}</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="form-section">
                                <h3>Address Details</h3>
                                <div className="refurbishmentcenter-form-grid">
                                    <div className="refurbishmentcenter-form-column">
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
                                    </div>
                                    <div className="refurbishmentcenter-form-column">
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
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="form-section">
                                <h3>Capabilities & E-Waste</h3>
                                <div className="refurbishmentcenter-field">
                                    <label>Device Types Accepted</label>
                                    <div
                                        className={
                                            error.deviceTypes_er
                                                ? "checkbox-grid checkbox-error"
                                                : "checkbox-grid"
                                        }
                                    >
                                        {[
                                            "IT & Telecom Equipment",
                                            "Consumer Electronics",
                                            "Large Household Appliances",
                                            "Small Household Appliances",
                                            "Lighting Equipment",
                                            "Electrical Tools",
                                            "Medical Devices",
                                            "Solar Panels"
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

                                <div className="refurbishmentcenter-field" style={{ marginTop: '0.75rem' }}>
                                    <label>Recycling Processes</label>
                                    <div
                                        className={
                                            error.recyclingProcesses_er
                                                ? "checkbox-grid checkbox-error"
                                                : "checkbox-grid"
                                        }
                                    >
                                        {[
                                            "Disassembly & Manual Sorting",
                                            "Mechanical Shredding",
                                            "Magnetic & Eddy Current Separation",
                                            "Hydrometallurgical Recovery",
                                            "Pyrometallurgical Processing",
                                            "Precious Metal Refining",
                                            "PCB Processing",
                                            "Plastics Granulation"
                                        ].map((proc) => (
                                            <label className="checkbox-item" key={proc}>
                                                <input
                                                    type="checkbox"
                                                    value={proc}
                                                    checked={form_dta.recyclingProcesses.includes(proc)}
                                                    onChange={(e) =>
                                                        handleCheckboxChange(e, "recyclingProcesses")
                                                    }
                                                />
                                                <span>{proc}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {error.recyclingProcesses_er && (
                                        <div className="error-message">
                                            {error.recyclingProcesses_er}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="form-section">
                                <h3>Operational Details & Materials</h3>
                                <div className="refurbishmentcenter-form-grid">
                                    <div className="refurbishmentcenter-form-column">
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

                                    <div className="refurbishmentcenter-form-column">
                                        <div className="refurbishmentcenter-field">
                                            <label>Hazardous Waste Handling</label>
                                            <select
                                                name="hazardousWasteHandling"
                                                value={form_dta.hazardousWasteHandling}
                                                onChange={handleInputChange}
                                                className={error.hazardousWasteHandling_er ? "input-error" : ""}
                                            >
                                                <option value="">Select</option>
                                                <option value="Yes">Yes</option>
                                                <option value="No">No</option>
                                            </select>
                                            {error.hazardousWasteHandling_er && <div className="error-message">{error.hazardousWasteHandling_er}</div>}
                                        </div>
                                    </div>
                                </div>

                                <div className="refurbishmentcenter-field" style={{ marginTop: '0.75rem' }}>
                                    <label>Recovered Materials</label>
                                    <div
                                        className={
                                            error.recoveredMaterials_er
                                                ? "checkbox-grid checkbox-error"
                                                : "checkbox-grid"
                                        }
                                    >
                                        {[
                                            "Copper",
                                            "Aluminum",
                                            "Gold & Silver",
                                            "Rare Earth Metals",
                                            "Plastics (ABS/PC)",
                                            "Glass",
                                            "Ferrous Metals",
                                            "Lithium & Cobalt"
                                        ].map((mat) => (
                                            <label className="checkbox-item" key={mat}>
                                                <input
                                                    type="checkbox"
                                                    value={mat}
                                                    checked={form_dta.recoveredMaterials.includes(mat)}
                                                    onChange={(e) =>
                                                        handleCheckboxChange(e, "recoveredMaterials")
                                                    }
                                                />
                                                <span>{mat}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {error.recoveredMaterials_er && (
                                        <div className="error-message">
                                            {error.recoveredMaterials_er}
                                        </div>
                                    )}
                                </div>

                                {form_dta.hazardousWasteHandling === "Yes" && (
                                    <div className="refurbishmentcenter-field" style={{ marginTop: '0.75rem' }}>
                                        <label>Hazardous Waste Types</label>
                                        <div
                                            className={
                                                error.hazardousWasteTypes_er
                                                    ? "checkbox-grid checkbox-error"
                                                    : "checkbox-grid"
                                            }
                                        >
                                            {[
                                                "Lead-Acid Batteries",
                                                "Lithium-ion Batteries",
                                                "Cathode Ray Tubes (CRT)",
                                                "Mercury Switches & Lamps",
                                                "Capacitors containing PCBs",
                                                "Refrigerants & CFCs",
                                                "Cadmium Components"
                                            ].map((haz) => (
                                                <label className="checkbox-item" key={haz}>
                                                    <input
                                                        type="checkbox"
                                                        value={haz}
                                                        checked={form_dta.hazardousWasteTypes.includes(haz)}
                                                        onChange={(e) =>
                                                            handleCheckboxChange(e, "hazardousWasteTypes")
                                                        }
                                                    />
                                                    <span>{haz}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {error.hazardousWasteTypes_er && (
                                            <div className="error-message">
                                                {error.hazardousWasteTypes_er}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {currentStep === 5 && (
                            <div className="form-section">
                                <h3>Documents</h3>
                                <div className="refurbishmentcenter-form-grid">
                                    <div className="refurbishmentcenter-form-column">
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
                                            <label>Recycler Registration Certificate</label>
                                            <input
                                                type="file"
                                                name="recyclerRegistrationCertificate"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleInputChange}
                                                className={error.recyclerRegistrationCertificate_er ? "input-error" : ""}
                                            />
                                            {error.recyclerRegistrationCertificate_er && <div className="error-message">{error.recyclerRegistrationCertificate_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>Consent to Operate (CTO)</label>
                                            <input
                                                type="file"
                                                name="consentToOperate"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleInputChange}
                                                className={error.consentToOperate_er ? "input-error" : ""}
                                            />
                                            {error.consentToOperate_er && <div className="error-message">{error.consentToOperate_er}</div>}
                                        </div>
                                        {form_dta.hazardousWasteHandling === "Yes" && (
                                            <div className="refurbishmentcenter-field">
                                                <label>Hazardous Waste Authorization</label>
                                                <input
                                                    type="file"
                                                    name="hazardousWasteAuthorization"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={handleInputChange}
                                                    className={error.hazardousWasteAuthorization_er ? "input-error" : ""}
                                                />
                                                {error.hazardousWasteAuthorization_er && <div className="error-message">{error.hazardousWasteAuthorization_er}</div>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="refurbishmentcenter-form-column">
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
                                        <div className="refurbishmentcenter-field">
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
                            </div>
                        )}

                        {currentStep === 6 && (
                            <div className="form-section">
                                <h3>Login Details</h3>
                                <div className="refurbishmentcenter-form-grid">
                                    {/* PASSWORD */}
                                    <div className="refurbishmentcenter-form-column">
                                        <div className="refurbishmentcenter-field">
                                            <label>Password</label>
                                            <div className="password-input-wrapper">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Create password"
                                                    name="password"
                                                    value={form_dta.password}
                                                    onChange={handleInputChange}
                                                    className={
                                                        touched.password && error.password_er
                                                            ? "input-error"
                                                            : ""
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    className="password-toggle-btn"
                                                    onClick={togglePasswordVisibility}
                                                    aria-label={
                                                        showPassword
                                                            ? "Hide password"
                                                            : "Show password"
                                                    }
                                                >
                                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                </button>
                                            </div>
                                            {touched.password && error.password_er && (
                                                <div className="error-message">
                                                    {error.password_er}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* CONFIRM PASSWORD */}
                                    <div className="refurbishmentcenter-form-column">
                                        <div className="refurbishmentcenter-field">
                                            <label>Confirm Password</label>
                                            <div className="password-input-wrapper">
                                                <input
                                                    type={
                                                        showConfirmPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    placeholder="Confirm password"
                                                    name="confirmPassword"
                                                    value={form_dta.confirmPassword}
                                                    onChange={handleInputChange}
                                                    className={
                                                        touched.confirmPassword &&
                                                        error.confirmPassword_er
                                                            ? "input-error"
                                                            : ""
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    className="password-toggle-btn"
                                                    onClick={toggleConfirmPasswordVisibility}
                                                    aria-label={
                                                        showConfirmPassword
                                                            ? "Hide password"
                                                            : "Show password"
                                                    }
                                                >
                                                    {showConfirmPassword
                                                        ? <FaEyeSlash />
                                                        : <FaEye />}
                                                </button>
                                            </div>
                                            {touched.confirmPassword &&
                                                error.confirmPassword_er && (
                                                    <div className="error-message">
                                                        {error.confirmPassword_er}
                                                    </div>
                                                )}
                                        </div>
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

export default RecyclingCenter_signup;
