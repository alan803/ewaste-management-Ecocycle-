import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash, FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CollectionAgent_signup.css";
import {
    validate_first_name,
    validate_last_name,
    validate_email,
    validate_phone,
    alternate_validate_phone,
    validate_dob,
    validate_gender,
    validate_adhaarNumber,
    validateFile,
    validateDocument,
    validate_address,
    validate_state,
    validate_district,
    validate_city,
    validate_pincode,
    validate_vehicleType,
    validate_vehicleNumber,
    validate_licenseNumber,
    validate_vehicleInsurance,
    validate_vehiclePollution,
    validate_accountHolder,
    validate_bankName,
    validate_accountNumber,
    validate_ifscCode,
    validate_password_simple as validate_password,
    validate_confirm_password
} from "../../utils/validation";

function CollectionAgent_signup()
{
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [pincodeLoading, setPincodeLoading] = useState(false);
    const [pincodeError, setPincodeError] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const sections = [
        "Personal Details",
        "Identity Verification",
        "Address Details",
        "Vehicle Details",
        "Bank Details",
        "Login Details"
    ];

    const[form_dta, set_form_dta] = useState({
            firstname: "",
            lastname: "",
            email: "",
            phone: "",
            alternatePhone: "",
            ProfilePicture: "",
            dob: "",
            gender: "",
            adhaarNumber: "",
            adhaarProof: "",
            address: "",
            pincode: "",
            state: "",
            district: "",
            city: "",
            vehicleType: "",
            vehicleNumber: "",
            vehicleInsurance: "",
            vehiclePollution: "",
            vehiclePhoto: "",
            licenseNumber: "",
            accountHolder: "",
            bankName: "",
            accountNumber: "",
            ifscCode: "",
            password: "",
            confirmPassword: ""
        });

    const[error,seterror]=useState({
            firstname_er:"",
            lastname_er:"",
            email_er:"",
            phone_er:"",
            alternatePhone_er:"",
            ProfilePicture_er:"",
            dob_er:"",
            gender_er:"",
            adhaarNumber_er:"",
            adhaarProof_er:"",
            address_er:"",
            pincode_er:"",
            district_er:"",
            city_er:"",
            vehicleType_er:"",
            vehicleNumber_er:"",
            vehicleInsurance_er:"",
            vehiclePollution_er:"",
            vehiclePhoto_er: "",
            licenseNumber_er:"",
            accountHolder_er:"",
            bankName_er:"",
            accountNumber_er:"",
            ifscCode_er:"",
            password_er:"",
            confirmPassword_er:""
        });

    const[touched, setTouched] = useState({});

    // Fetch location data when PIN code changes
    useEffect(() => {
        if (form_dta.pincode && form_dta.pincode.length === 6) {
            fetchPincodeData(form_dta.pincode);
        } else {
            setPincodeError("");
            // Clear location fields when PIN is invalid
            set_form_dta(prev => ({
                ...prev,
                state: "",
                district: "",
                city: ""
            }));
        }
    }, [form_dta.pincode]);

    const fetchPincodeData = async (pincode) => {
        setPincodeLoading(true);
        setPincodeError("");
        
        try {
            const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
            
            if (response.data && response.data[0].Status === "Success") {
                const data = response.data[0].PostOffice[0];
                
                // Auto-populate state, district, city
                set_form_dta(prev => ({
                    ...prev,
                    state: data.State,
                    district: data.District,
                    city: data.Block || data.District
                }));
            } else {
                setPincodeError("Invalid PIN code");
                set_form_dta(prev => ({
                    ...prev,
                    state: "",
                    district: "",
                    city: ""
                }));
            }
        } catch (err) {
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
        if(currentStep === 0)
        {
            const errors = {
                firstname_er: validate_first_name(form_dta.firstname),
                lastname_er: validate_last_name(form_dta.lastname),
                email_er: validate_email(form_dta.email),
                phone_er: validate_phone(form_dta.phone),
                alternatePhone_er: alternate_validate_phone(form_dta.alternatePhone),
                ProfilePicture_er: validateFile(form_dta.ProfilePicture),
                dob_er: validate_dob(form_dta.dob),
                gender_er: validate_gender(form_dta.gender)
            };

            seterror(prev => ({
                ...prev,
                ...errors
            }));

            if(Object.values(errors).some(e => e !== ""))
                return;
        }

        if(currentStep === 1)
        {
            const errors = {
                adhaarNumber_er: validate_adhaarNumber(form_dta.adhaarNumber),
                adhaarProof_er: validateFile(form_dta.adhaarProof)
            };

            seterror(prev => ({
                ...prev,
                ...errors
            }));

            if(Object.values(errors).some(e => e !== ""))
                return;
        }

        if(currentStep === 2)
        {
            const errors = {
                address_er: validate_address(form_dta.address),
                pincode_er: validate_pincode(form_dta.pincode),
                district_er: validate_district(form_dta.district)
            };

            seterror(prev => ({
                ...prev,
                ...errors
            }));

            if(Object.values(errors).some(e => e !== ""))
                return;
        }

        if(currentStep === 3)
        {
            const errors = {
                vehicleType_er: validate_vehicleType(form_dta.vehicleType),
                vehicleNumber_er: validate_vehicleNumber(form_dta.vehicleNumber),
                licenseNumber_er: validate_licenseNumber(form_dta.licenseNumber),
                vehicleInsurance_er: validate_vehicleInsurance(form_dta.vehicleInsurance),
                vehiclePollution_er: validate_vehiclePollution(form_dta.vehiclePollution),
                vehiclePhoto_er: validateFile(form_dta.vehiclePhoto)
            };

            seterror(prev => ({
                ...prev,
                ...errors
            }));

            if(Object.values(errors).some(e => e !== ""))
                return;
        }

        if(currentStep === 4)
        {
            const errors = {
                accountHolder_er: validate_accountHolder(form_dta.accountHolder),
                bankName_er: validate_bankName(form_dta.bankName),
                accountNumber_er: validate_accountNumber(form_dta.accountNumber),
                ifscCode_er: validate_ifscCode(form_dta.ifscCode)
            };

            seterror(prev => ({
                ...prev,
                ...errors
            }));

            if(Object.values(errors).some(e => e !== ""))
                return;
        }

        if (currentStep < sections.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    function handleInputChange(e)
        {
            const {name,value,files}=e.target;

            // Mark field as touched
            setTouched(prev => ({
                ...prev,
                [name]: true
            }));

            if(name==="pincode")
            {
                // Allow only numbers and max 6 digits
                const numericValue = value.replace(/\D/g, "").slice(0, 6);
                set_form_dta({
                    ...form_dta,
                    [name]: numericValue
                });
                seterror({
                    ...error,
                    pincode_er: validate_pincode(numericValue)
                });
                return;
            }

            // Handle file inputs
            if (files)
            {
                const file = files[0];

                // Save file in state
                set_form_dta(prev => ({
                    ...prev,
                    [name]: file
                }));

                // Validate based on file type
                if (name === "ProfilePicture")
                {
                    seterror(prev => ({
                        ...prev,
                        ProfilePicture_er:
                            touched.ProfilePicture || file
                                ? validateFile(file)
                                : ""
                    }));
                }

                if (name === "adhaarProof")
                {
                    seterror(prev => ({
                        ...prev,
                        adhaarProof_er: validateDocument(file)
                    }));
                }

                if (name === "vehicleInsurance")
                {
                    seterror(prev => ({
                        ...prev,
                        vehicleInsurance_er: validate_vehicleInsurance(file)
                    }));
                }

                if (name === "vehiclePollution")
                {
                    seterror(prev => ({
                        ...prev,
                        vehiclePollution_er: validate_vehiclePollution(file)
                    }));
                }

                if (name === "vehiclePhoto")
                {
                    seterror(prev => ({
                        ...prev,
                        vehiclePhoto_er: validateFile(file)
                    }));
                }

                return;
            }

            set_form_dta({
                ...form_dta,
                [name]:value
            });
            if(name==="firstname")
            {
                seterror({
                    ...error,
                    firstname_er:validate_first_name(value)
                });
            }
            if(name==="lastname")
            {
                seterror({
                    ...error,
                    lastname_er:validate_last_name(value)
                });
            }
            if(name==="email")
            {
                seterror({
                    ...error,
                    email_er:validate_email(value)
                });
            }
            if(name==="phone")
            {
                seterror({
                    ...error,
                    phone_er:validate_phone(value)
                });
            }
            if(name==="alternatePhone")
            {
                seterror({
                    ...error,
                    alternatePhone_er:alternate_validate_phone(value)
                });
            }
            if(name==="dob")
            {
                seterror({
                    ...error,
                    dob_er:validate_dob(value)
                });
            }
            if(name==="gender")
            {
                seterror({
                    ...error,
                    gender_er:validate_gender(value)
                });
            }
            if(name==="adhaarNumber")
            {
                seterror({
                    ...error,
                    adhaarNumber_er:validate_adhaarNumber(value)
                });
            }
            if(name==="address")
            {
                seterror({
                    ...error,
                    address_er:validate_address(value)
                });
            }
            if(name==="district")
            {
                seterror({
                    ...error,
                    district_er:validate_district(value)
                });
            }
            if(name === "vehicleType")
            {
                seterror(prev => ({
                    ...prev,
                    vehicleType_er: validate_vehicleType(value)
                }));
            }
            if(name === "vehicleNumber")
            {
                seterror(prev => ({
                    ...prev,
                    vehicleNumber_er: validate_vehicleNumber(value)
                }));
            }
            if(name === "licenseNumber")
            {
                seterror(prev => ({
                    ...prev,
                    licenseNumber_er: validate_licenseNumber(value)
                }));
            }
            if(name === "vehicleInsurance")
            {
                if(files)
                {
                    const file = files[0];
                    set_form_dta({
                        ...form_dta,
                        [name]: file
                    });
                    seterror(prev => ({
                        ...prev,
                        vehicleInsurance_er: validate_vehicleInsurance(file)
                    }));
                }
            }
            if(name === "vehiclePollution")
            {
                if(files)
                {
                    const file = files[0];
                    set_form_dta({
                        ...form_dta,
                        [name]: file
                    });
                    seterror(prev => ({
                        ...prev,
                        vehiclePollution_er: validate_vehiclePollution(file)
                    }));
                }
            }
            if(name === "accountHolder")
            {
                seterror(prev => ({
                    ...prev,
                    accountHolder_er: validate_accountHolder(value)
                }));
            }
            if(name === "bankName")
            {
                seterror(prev => ({
                    ...prev,
                    bankName_er: validate_bankName(value)
                }));
            }
            if(name === "accountNumber")
            {
                seterror(prev => ({
                    ...prev,
                    accountNumber_er: validate_accountNumber(value)
                }));
            }
            if(name === "ifscCode")
            {
                seterror(prev => ({
                    ...prev,
                    ifscCode_er: validate_ifscCode(value)
                }));
            }
            if(name === "password")
            {
                seterror(prev => ({
                    ...prev,
                    password_er:
                        touched.password || value
                            ? validate_password(value)
                            : ""
                }));
            }
            if(name === "confirmPassword")
            {
                seterror(prev => ({
                    ...prev,
                    confirmPassword_er:
                        touched.confirmPassword || value
                            ? validate_confirm_password(value, form_dta.password)
                            : ""
                }));
            }
            if(name === "adhaarProof")
            {
                if(files)
                {
                    const file = files[0];

                    set_form_dta({
                        ...form_dta,
                        [name]: file
                    });

                    seterror(prev => ({
                        ...prev,
                        adhaarProof_er: validateFile(file)
                    }));
                }
            }
        }
        async function collectionagent_validation(e)
        {
            e.preventDefault();

            const newErrors = {
                firstname_er: validate_first_name(form_dta.firstname),
                lastname_er: validate_last_name(form_dta.lastname),
                email_er: validate_email(form_dta.email),
                phone_er: validate_phone(form_dta.phone),
                alternatePhone_er:alternate_validate_phone(form_dta.alternatePhone),
                ProfilePicture_er: validateFile(form_dta.ProfilePicture),
                dob_er: validate_dob(form_dta.dob),
                gender_er: validate_gender(form_dta.gender),
                adhaarNumber_er: validate_adhaarNumber(form_dta.adhaarNumber),
                adhaarProof_er: validateDocument(form_dta.adhaarProof),
                address_er:validate_address(form_dta.address),
                district_er:validate_district(form_dta.district),
                pincode_er:validate_pincode(form_dta.pincode),
                vehicleType_er: validate_vehicleType(form_dta.vehicleType),
                vehicleNumber_er:validate_vehicleNumber(form_dta.vehicleNumber),
                licenseNumber_er:validate_licenseNumber(form_dta.licenseNumber),
                vehicleInsurance_er: validate_vehicleInsurance(form_dta.vehicleInsurance),
                vehiclePollution_er: validate_vehiclePollution(form_dta.vehiclePollution),
                vehiclePhoto_er: validateFile(form_dta.vehiclePhoto),
                accountHolder_er: validate_accountHolder(form_dta.accountHolder),
                bankName_er: validate_bankName(form_dta.bankName),
                accountNumber_er: validate_accountNumber(form_dta.accountNumber),
                ifscCode_er: validate_ifscCode(form_dta.ifscCode),
                password_er:
                    form_dta.password === ""
                        ? "Password is required"
                        : validate_password(form_dta.password),
                confirmPassword_er:
                    form_dta.confirmPassword === ""
                        ? "Please confirm your password"
                        : validate_confirm_password(form_dta.confirmPassword, form_dta.password)
            };
            const formData = new FormData();
            Object.keys(form_dta).forEach((key) => {
                formData.append(key, form_dta[key]);
            });
            seterror(newErrors);

            if (Object.values(newErrors).some(err => err !== ""))
            {
                return;
            }
            try
            {
                await axios.post(
                    "https://localhost:7102/api/CollectionAgent/Register",
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
                alert("Registration failed. Please try again.");
            }
        }
    return (
        <div className="collectionagent-signup">
            <div className="collectionagent-visual">
                <div className="collectionagent-visual-content">
                    <span className="collectionagent-brand">ECOCYCLE</span>
                    <h2>Join as Collection Agent</h2>
                    <p>
                        Register as a collection agent to help recycle electronics,
                        earn rewards, and contribute to a cleaner environment.
                    </p>
                </div>
                <div className="collectionagent-blob collectionagent-blob--1" />
                <div className="collectionagent-blob collectionagent-blob--2" />
                <div className="collectionagent-blob collectionagent-blob--3" />
            </div>

            <div className="collectionagent-panel">
                <div className="collectionagent-card">
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
                                    Account Verification Pending
                                </p>
                                <p style={{ margin: "0.5rem 0 0 0", color: "#475569", fontSize: "0.9rem", lineHeight: 1.6 }}>
                                    Your Collection Agent account has been created. <strong>Please note that your account needs to be verified and approved by the Administrator before you can log in.</strong>
                                </p>
                            </div>
                            <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "2rem", lineHeight: 1.5 }}>
                                Thank you for registering with EcoCycle. Please wait for admin approval. You can return to the login page to sign in once approved.
                            </p>
                            <button
                                type="button"
                                className="collectionagent-btn"
                                onClick={() => navigate("/login")}
                                style={{ maxWidth: "220px", margin: "0 auto", display: "block", textTransform: "none" }}
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <>
                    <div className="collectionagent-header">
                        <div className="collectionagent-eyebrow">AGENT REGISTRATION</div>
                        <h1>Sign Up</h1>
                        <p>Fill in your details to get started</p>
                        <div className="role-signup-select-wrapper header-role-select">
                            <label htmlFor="agent-role-select">Select Registration Role:</label>
                            <select
                                id="agent-role-select"
                                className="role-signup-select"
                                value="/signup/collection-agent"
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

                    <form className="collectionagent-form" onSubmit={collectionagent_validation}>
                        {currentStep === 0 && (
                        <div className="form-section">
                            <h3>Personal Details</h3>
                            <div className="collectionagent-form-grid">
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>First Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your first name"
                                            name="firstname"
                                            value={form_dta.firstname}
                                            onChange={handleInputChange}
                                            className={error.firstname_er ? "input-error" : ""}
                                        />
                                        {error.firstname_er && <div className="error-message">{error.firstname_er}</div>}
                                    </div>
                                    <div className="collectionagent-field">
                                        <label>Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your last name"
                                            name="lastname"
                                            value={form_dta.lastname}
                                            onChange={handleInputChange}
                                            className={error.lastname_er ? "input-error" : ""}
                                        />
                                        {error.lastname_er && <div className="error-message">{error.lastname_er}</div>}
                                    </div>
                                    <div className="collectionagent-field">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            name="email"
                                            value={form_dta.email}
                                            onChange={handleInputChange}
                                            className={error.email_er ? "input-error" : ""}
                                        />
                                        {error.email_er && <div className="error-message">{error.email_er}</div>}
                                    </div>
                                </div>
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="Enter your phone number"
                                            name="phone"
                                            value={form_dta.phone}
                                            onChange={handleInputChange}
                                            className={error.phone_er ? "input-error" : ""}
                                        />
                                        {error.phone_er && <div className="error-message">{error.phone_er}</div>}
                                    </div>
                                    <div className="collectionagent-field">
                                        <label>Alternate Phone</label>
                                        <input
                                            type="tel"
                                            placeholder="Alternate phone number"
                                            name="alternatePhone"
                                            value={form_dta.alternatePhone}
                                            onChange={handleInputChange}
                                            className={error.alternatePhone_er ? "input-error" : ""}
                                        />
                                        {error.alternatePhone_er && <div className="error-message">{error.alternatePhone_er}</div>}
                                    </div>
                                    <div className="collectionagent-field">
                                        <label>Profile Picture</label>
                                        <input
                                            type="file"
                                            name="ProfilePicture"
                                            accept="image/jpeg,image/png"
                                            onChange={handleInputChange}
                                            className={error.ProfilePicture_er ? "input-error" : ""}
                                        />
                                        {error.ProfilePicture_er && <div className="error-message">{error.ProfilePicture_er}</div>}
                                    </div>
                                </div>
                            </div>
                            <div className="collectionagent-form-grid">
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>Date of Birth</label>
                                        <input
                                            type="date"
                                            name="dob"
                                            value={form_dta.dob}
                                            onChange={handleInputChange}
                                            className={error.dob_er ? "input-error" : ""}
                                        />
                                        {error.dob_er && <div className="error-message">{error.dob_er}</div>}
                                    </div>
                                </div>
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>Gender</label>
                                        <select
                                            name="gender"
                                            value={form_dta.gender}
                                            onChange={handleInputChange}
                                            className={error.gender_er ? "input-error" : ""}
                                        >
                                            <option value="">Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                        {error.gender_er && <div className="error-message">{error.gender_er}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                        {currentStep === 1 && (
                        <div className="form-section">
                            <h3>Identity Verification</h3>
                            <div className="collectionagent-form-grid">
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>Aadhaar Number</label>
                                        <input
                                            type="text"
                                            placeholder="Enter Aadhaar number"
                                            name="adhaarNumber"
                                            value={form_dta.adhaarNumber}
                                            onChange={handleInputChange}
                                            className={error.adhaarNumber_er ? "input-error" : ""}
                                        />
                                        {error.adhaarNumber_er && <div className="error-message">{error.adhaarNumber_er}</div>}
                                    </div>
                                </div>
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>Aadhaar Proof</label>
                                        <input
                                            type="file"
                                            name="adhaarProof"
                                            accept="image/jpeg,image/png,application/pdf"
                                            onChange={handleInputChange}
                                            className={error.adhaarProof_er ? "input-error" : ""}
                                        />
                                        {error.adhaarProof_er && <div className="error-message">{error.adhaarProof_er}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                        {currentStep === 2 && (
                        <div className="form-section">
                            <h3>Address Details</h3>
                            <div className="collectionagent-form-grid">
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>Address</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your full address"
                                            name="address"
                                            value={form_dta.address}
                                            onChange={handleInputChange}
                                            className={error.address_er ? "input-error" : ""}
                                        />
                                        {error.address_er && <div className="error-message">{error.address_er}</div>}
                                    </div>
                                    <div className="collectionagent-field">
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
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>State</label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={form_dta.state}
                                            onChange={handleInputChange}
                                            readOnly
                                            className="readonly-field"
                                        />
                                    </div>
                                    <div className="collectionagent-field">
                                        <label>District</label>
                                        <input
                                            type="text"
                                            name="district"
                                            value={form_dta.district}
                                            onChange={handleInputChange}
                                            readOnly
                                            className="readonly-field"
                                        />
                                    </div>
                                    <div className="collectionagent-field">
                                        <label>City/Taluk</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={form_dta.city}
                                            onChange={handleInputChange}
                                            readOnly
                                            className="readonly-field"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                        {currentStep === 3 && (
                        <div className="form-section">
                            <h3>Vehicle Details</h3>
                            <div className="collectionagent-form-grid">
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>Vehicle Type</label>
                                        <select
                                            name="vehicleType"
                                            value={form_dta.vehicleType}
                                            onChange={handleInputChange}
                                            className={error.vehicleType_er ? "input-error" : ""}
                                        >
                                            <option value="">Select vehicle type</option>
                                            <option value="Bike">Bike</option>
                                            <option value="Scooter">Scooter</option>
                                            <option value="Van">Van</option>
                                            <option value="Mini Truck">Mini Truck</option>
                                        </select>
                                        {error.vehicleType_er && <div className="error-message">{error.vehicleType_er}</div>}
                                    </div>
                                    <div className="collectionagent-field">
                                        <label>Vehicle Number</label>
                                        <input
                                            type="text"
                                            placeholder="Enter vehicle number"
                                            name="vehicleNumber"
                                            value={form_dta.vehicleNumber}
                                            onChange={handleInputChange}
                                            className={error.vehicleNumber_er ? "input-error" : ""}
                                        />
                                        {error.vehicleNumber_er && <div className="error-message">{error.vehicleNumber_er}</div>}
                                    </div>
                                </div>
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>Driving License Number</label>
                                        <input
                                            type="text"
                                            placeholder="Enter license number"
                                            name="licenseNumber"
                                            value={form_dta.licenseNumber}
                                            onChange={handleInputChange}
                                            className={error.licenseNumber_er ? "input-error" : ""}
                                        />
                                        {error.licenseNumber_er && <div className="error-message">{error.licenseNumber_er}</div>}
                                    </div>
                                    <div className="collectionagent-field">
                                        <label>Vehicle Insurance</label>
                                        <input
                                            type="file"
                                            name="vehicleInsurance"
                                            accept="image/jpeg,image/png,application/pdf"
                                            onChange={handleInputChange}
                                            className={error.vehicleInsurance_er ? "input-error" : ""}
                                        />
                                        {error.vehicleInsurance_er && <div className="error-message">{error.vehicleInsurance_er}</div>}
                                    </div>
                                    <div className="collectionagent-field">
                                        <label>Vehicle Pollution Certificate</label>
                                        <input
                                            type="file"
                                            name="vehiclePollution"
                                            accept="image/jpeg,image/png,application/pdf"
                                            onChange={handleInputChange}
                                            className={error.vehiclePollution_er ? "input-error" : ""}
                                        />
                                        {error.vehiclePollution_er && <div className="error-message">{error.vehiclePollution_er}</div>}
                                    </div>
                                    <div className="collectionagent-field">
                                        <label>Vehicle Photo</label>
                                        <input
                                            type="file"
                                            name="vehiclePhoto"
                                            accept="image/jpeg,image/png,application/pdf"
                                            onChange={handleInputChange}
                                            className={error.vehiclePhoto_er ? "input-error" : ""}
                                        />
                                        {error.vehiclePhoto_er && <div className="error-message">{error.vehiclePhoto_er}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                        {currentStep === 4 && (
                        <div className="form-section">
                            <h3>Bank Details</h3>
                            <div className="collectionagent-form-grid">
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>Account Holder Name</label>
                                        <input
                                            type="text"
                                            placeholder="Account holder name"
                                            name="accountHolder"
                                            value={form_dta.accountHolder}
                                            onChange={handleInputChange}
                                            className={error.accountHolder_er ? "input-error" : ""}
                                        />
                                        {error.accountHolder_er && <div className="error-message">{error.accountHolder_er}</div>}
                                    </div>
                                    <div className="collectionagent-field">
                                        <label>Bank Name</label>
                                        <input
                                            type="text"
                                            placeholder="Bank name"
                                            name="bankName"
                                            value={form_dta.bankName}
                                            onChange={handleInputChange}
                                            className={error.bankName_er ? "input-error" : ""}
                                        />
                                        {error.bankName_er && <div className="error-message">{error.bankName_er}</div>}
                                    </div>
                                </div>
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>Account Number</label>
                                        <input
                                            type="text"
                                            placeholder="Bank account number"
                                            name="accountNumber"
                                            value={form_dta.accountNumber}
                                            onChange={handleInputChange}
                                            className={error.accountNumber_er ? "input-error" : ""}
                                        />
                                        {error.accountNumber_er && <div className="error-message">{error.accountNumber_er}</div>}
                                    </div>
                                    <div className="collectionagent-field">
                                        <label>IFSC Code</label>
                                        <input
                                            type="text"
                                            placeholder="IFSC code"
                                            name="ifscCode"
                                            value={form_dta.ifscCode}
                                            onChange={handleInputChange}
                                            className={error.ifscCode_er ? "input-error" : ""}
                                        />
                                        {error.ifscCode_er && <div className="error-message">{error.ifscCode_er}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                        {currentStep === 5 && (
                        <div className="form-section">
                            <h3>Login Details</h3>
                            <div className="collectionagent-form-grid">
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>Password</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your password"
                                                name="password"
                                                value={form_dta.password}
                                                onChange={handleInputChange}
                                                className={error.password_er ? "input-error" : ""}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle-btn"
                                                onClick={togglePasswordVisibility}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                        {error.password_er && <div className="error-message">{error.password_er}</div>}
                                    </div>
                                </div>
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>Confirm Password</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm your password"
                                                name="confirmPassword"
                                                value={form_dta.confirmPassword}
                                                onChange={handleInputChange}
                                                className={error.confirmPassword_er ? "input-error" : ""}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle-btn"
                                                onClick={toggleConfirmPasswordVisibility}
                                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                            >
                                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                        {error.confirmPassword_er && <div className="error-message">{error.confirmPassword_er}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                        <div className="form-navigation">
                            {currentStep > 0 && (
                                <button type="button" className="nav-btn nav-btn--prev" onClick={handlePrevious}>
                                    Previous
                                </button>
                            )}
                            {currentStep < sections.length - 1 ? (
                                <button type="button" className="nav-btn nav-btn--next" onClick={handleNext}>
                                    Next
                                </button>
                            ) : (
                                <button type="submit" className="collectionagent-btn">
                                    Submit Application
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

                    <div className="collectionagent-links">
                        <p>
                            Already have an account?{" "}
                            <a href="/login">Sign in</a>
                        </p>
                        <p>
                            <a href="/" className="collectionagent-back">← Back to home</a>
                        </p>
                    </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
export default CollectionAgent_signup