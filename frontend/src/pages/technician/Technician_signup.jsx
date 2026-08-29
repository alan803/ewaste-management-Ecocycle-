import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash, FaClock } from "react-icons/fa";
import { FiMapPin } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Technician_signup.css";
import{
    validate_first_name,
    validate_last_name,
    validate_dob,
    validate_email,
    validate_password,
    validate_confirm_password,
    validate_phone,
    validate_address,
    validate_state,
    validate_city,
    validate_district,
    validate_pincode,
    validate_gender,
    validateFile,
    validate_adhaarNumber,
    validate_licenseNumber,
    validateDocument,
    validate_centrename,
    validate_employeeId,
    validate_jobTitle,
    validate_dateOfJoining,
    validate_experience,
    validate_specialization,
    validate_issuingInstitute,
    validate_certificateNumber,
    validate_certificateIssueDate,
    validate_certificateExpiryDate,
    validate_governmentIdType,
    validate_passport,
    validate_panCard,
    validate_employeeIdCard,
} from "../../utils/validation.js"
function Technician_signup()
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
        "Shop Address Details",
        "Employment Details",
        "Certification Details",
        "Identity Verification",
        "Login Details"
    ];

    const[form_dta,set_form_dta]=useState({
        firstName:"",
        lastName:"",
        dateOfBirth:"",
        gender:"",
        phoneNumber:"",
        email:"",
        profilePhoto:"",
        address:"",
        city:"",
        district:"",
        state:"",
        pinCode:"",
        inspectionCenterName:"",
        employeeId:"",
        jobTitle:"",
        dateOfJoining:"",
        experienceYears:"",
        workEmail:"",
        workPhone:"",
        specialization:"",
        issuingInstitute:"",
        certificateNumber:"",
        certificateIssueDate:"",
        certificateExpiryDate:"",
        governmentIdType:"",
        governmentIdNumber:"",
        governmentIdFile:"",
        employeeIdCard:"",
        technicalCertificate:"",
        resume:"",
        password:"",
        confirmPassword:""
    });
    const[error,seterror]=useState({
        firstName_er:"",
        lastName_er:"",
        dateOfBirth_er:"",
        gender_er:"",
        phoneNumber_er:"",
        email_er:"",
        profilePhoto_er:"",
        address_er:"",
        city_er:"",
        district_er:"",
        state_er:"",
        pinCode_er:"",
        inspectionCenterName_er:"",
        employeeId_er:"",
        jobTitle_er:"",
        dateOfJoining_er:"",
        experienceYears_er:"",
        workEmail_er:"",
        workPhone_er:"",
        specialization_er:"",
        issuingInstitute_er:"",
        certificateNumber_er:"",
        certificateIssueDate_er:"",
        certificateExpiryDate_er:"",
        governmentIdType_er:"",
        governmentIdNumber_er:"",
        governmentIdFile_er:"",
        employeeIdCard_er:"",
        technicalCertificate_er:"",
        resume_er:"",
        password_er:"",
        confirmPassword_er:""
    });

    const[touched, setTouched] = useState({});
    const validateGovernmentId = (type, number) => 
    {
        if (type === "Aadhaar") {
            return validate_adhaarNumber(number);
        }

        if (type === "PAN") {
            return validate_panCard(number);
        }

        if (type === "Driving Licence") {
            return validate_licenseNumber(number);
        }

        if (type === "Passport") {
            return validate_passport(number);
        }

        return "";
    };

    // Fetch location data when PIN code changes
    useEffect(() => {
        if (form_dta.pinCode && form_dta.pinCode.length === 6) {
            fetchPincodeData(form_dta.pinCode);
        } else {
            setPincodeError("");
            set_form_dta(prev => ({
                ...prev,
                state: "",
                district: "",
                city: ""
            }));
        }
    }, [form_dta.pinCode]);

    const fetchPincodeData = async (pincode) => {
        setPincodeLoading(true);
        setPincodeError("");
        
        try {
            const response = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
            
            if (response.data && response.data[0].Status === "Success") {
                const data = response.data[0].PostOffice[0];
                
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
                firstName_er: validate_first_name(form_dta.firstName),
                lastName_er: validate_last_name(form_dta.lastName),
                email_er: validate_email(form_dta.email),
                phoneNumber_er: validate_phone(form_dta.phoneNumber),
                profilePhoto_er: validateFile(form_dta.profilePhoto),
                dateOfBirth_er: validate_dob(form_dta.dateOfBirth),
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
                address_er: validate_address(form_dta.address),
                pinCode_er: validate_pincode(form_dta.pinCode),
                district_er: validate_district(form_dta.district)
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
                inspectionCenterName_er: validate_centrename(form_dta.inspectionCenterName),
                employeeId_er: validate_employeeId(form_dta.employeeId),
                jobTitle_er: validate_jobTitle(form_dta.jobTitle),
                dateOfJoining_er: validate_dateOfJoining(form_dta.dateOfJoining),
                experienceYears_er: validate_experience(form_dta.experienceYears),
                specialization_er: validate_specialization(form_dta.specialization)
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
                issuingInstitute_er: validate_issuingInstitute(form_dta.issuingInstitute),
                certificateNumber_er: validate_certificateNumber(form_dta.certificateNumber),
                certificateIssueDate_er: validate_certificateIssueDate(form_dta.certificateIssueDate),
                certificateExpiryDate_er: validate_certificateExpiryDate(form_dta.certificateExpiryDate, form_dta.certificateIssueDate)
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
                governmentIdType_er: validate_governmentIdType(form_dta.governmentIdType),
                governmentIdNumber_er: form_dta.governmentIdType === "Aadhaar" 
                    ? validate_adhaarNumber(form_dta.governmentIdNumber)
                    : form_dta.governmentIdType === "PAN"
                    ? validate_panCard(form_dta.governmentIdNumber)
                    : form_dta.governmentIdType === "Driving Licence"
                    ? validate_licenseNumber(form_dta.governmentIdNumber)
                    : form_dta.governmentIdType === "Passport"
                    ? validate_passport(form_dta.governmentIdNumber)
                    : "",
                governmentIdFile_er: validateDocument(form_dta.governmentIdFile),
                employeeIdCard_er: validate_employeeIdCard(form_dta.employeeIdCard),
                technicalCertificate_er: validateDocument(form_dta.technicalCertificate)
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

        setTouched(prev => ({
            ...prev,
            [name]: true
        }));

        if(name==="pinCode")
        {
            const numericValue = value.replace(/\D/g, "").slice(0, 6);
            set_form_dta({
                ...form_dta,
                [name]: numericValue
            });
            seterror({
                ...error,
                pinCode_er: validate_pincode(numericValue)
            });
            return;
        }

        if (files)
        {
            const file = files[0];
            set_form_dta(prev => ({
                ...prev,
                [name]: file
            }));

            if (name === "profilePhoto")
            {
                seterror(prev => ({
                    ...prev,
                    profilePhoto_er:
                        touched.profilePhoto || file
                            ? validateFile(file)
                            : ""
                }));
            }

            if (name === "governmentIdFile" || name === "technicalCertificate")
            {
                seterror(prev => ({
                    ...prev,
                    [`${name}_er`]: validateDocument(file)
                }));
            }

            if (name === "employeeIdCard")
            {
                seterror(prev => ({
                    ...prev,
                    employeeIdCard_er: validate_employeeIdCard(file)
                }));
            }

            return;
        }

        set_form_dta({
            ...form_dta,
            [name]:value
        });

        if(name==="firstName")
        {
            seterror({
                ...error,
                firstName_er:validate_first_name(value)
            });
        }
        if(name==="lastName")
        {
            seterror({
                ...error,
                lastName_er:validate_last_name(value)
            });
        }
        if(name==="email")
        {
            seterror({
                ...error,
                email_er:validate_email(value)
            });
        }
        if(name==="phoneNumber")
        {
            seterror({
                ...error,
                phoneNumber_er:validate_phone(value)
            });
        }
        if(name==="dateOfBirth")
        {
            seterror({
                ...error,
                dateOfBirth_er:validate_dob(value)
            });
        }
        if(name==="gender")
        {
            seterror({
                ...error,
                gender_er:validate_gender(value)
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
        if(name==="inspectionCenterName")
        {
            seterror(prev => ({
                ...prev,
                inspectionCenterName_er: validate_centrename(value)
            }));
        }
        if(name==="employeeId")
        {
            seterror(prev => ({
                ...prev,
                employeeId_er: validate_employeeId(value)
            }));
        }
        if(name==="jobTitle")
        {
            seterror(prev => ({
                ...prev,
                jobTitle_er: validate_jobTitle(value)
            }));
        }
        if(name==="dateOfJoining")
        {
            seterror(prev => ({
                ...prev,
                dateOfJoining_er: validate_dateOfJoining(value)
            }));
        }
        if(name==="experienceYears")
        {
            seterror(prev => ({
                ...prev,
                experienceYears_er: validate_experience(value)
            }));
        }
        if(name==="specialization")
        {
            seterror(prev => ({
                ...prev,
                specialization_er: validate_specialization(value)
            }));
        }
        if(name==="issuingInstitute")
        {
            seterror(prev => ({
                ...prev,
                issuingInstitute_er: validate_issuingInstitute(value)
            }));
        }
        if(name==="certificateNumber")
        {
            seterror(prev => ({
                ...prev,
                certificateNumber_er: validate_certificateNumber(value)
            }));
        }
        if (name === "certificateIssueDate")
        {
            seterror(prev => ({
                ...prev,
                certificateIssueDate_er: validate_certificateIssueDate(value),
                certificateExpiryDate_er: validate_certificateExpiryDate(
                    form_dta.certificateExpiryDate,
                    value
                )
            }));
        }
        if(name==="certificateExpiryDate")
        {
            seterror(prev => ({
                ...prev,
                certificateExpiryDate_er: validate_certificateExpiryDate(value, form_dta.certificateIssueDate)
            }));
        }if (name === "governmentIdType")
        {
            seterror(prev => ({
                ...prev,
                governmentIdType_er: validate_governmentIdType(value),
                governmentIdNumber_er: validateGovernmentId(
                    value,
                    form_dta.governmentIdNumber
                )
            }));
        }
        if (name === "governmentIdNumber")
        {
            seterror(prev => ({
                ...prev,
                governmentIdNumber_er: validateGovernmentId(
                    form_dta.governmentIdType,
                    value
                )
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
    }

    async function technician_validation(e)
    {
        e.preventDefault();

        const newErrors = {
            firstName_er: validate_first_name(form_dta.firstName),
            lastName_er: validate_last_name(form_dta.lastName),
            email_er: validate_email(form_dta.email),
            phoneNumber_er: validate_phone(form_dta.phoneNumber),
            profilePhoto_er: validateFile(form_dta.profilePhoto),
            dateOfBirth_er: validate_dob(form_dta.dateOfBirth),
            gender_er: validate_gender(form_dta.gender),
            address_er:validate_address(form_dta.address),
            district_er:validate_district(form_dta.district),
            pinCode_er:validate_pincode(form_dta.pinCode),
            inspectionCenterName_er: validate_centrename(form_dta.inspectionCenterName),
            employeeId_er: validate_employeeId(form_dta.employeeId),
            jobTitle_er: validate_jobTitle(form_dta.jobTitle),
            dateOfJoining_er: validate_dateOfJoining(form_dta.dateOfJoining),
            experienceYears_er: validate_experience(form_dta.experienceYears),
            specialization_er: validate_specialization(form_dta.specialization),
            issuingInstitute_er: validate_issuingInstitute(form_dta.issuingInstitute),
            certificateNumber_er: validate_certificateNumber(form_dta.certificateNumber),
            certificateIssueDate_er: validate_certificateIssueDate(form_dta.certificateIssueDate),
            certificateExpiryDate_er: validate_certificateExpiryDate(form_dta.certificateExpiryDate, form_dta.certificateIssueDate),
            governmentIdType_er: validate_governmentIdType(
                form_dta.governmentIdType
            ),

            governmentIdNumber_er: validateGovernmentId(
                form_dta.governmentIdType,
                form_dta.governmentIdNumber
            ),
            governmentIdFile_er: validateDocument(form_dta.governmentIdFile),
            employeeIdCard_er: validate_employeeIdCard(form_dta.employeeIdCard),
            technicalCertificate_er: validateDocument(form_dta.technicalCertificate),
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
            const response =await axios.post(
                "https://localhost:7102/api/Technician/Register",
                formData
            );
            if (response.status === 200 || response.status === 201) {
                setIsSubmitted(true);
            }
        }
        catch(error)
        {
            console.error("Registration failed",error);
            alert("Registration failed. Please try again.");
        }
    }
    return (
        <div className="technician-signup">
            <div className="technician-visual">
                <div className="technician-visual-content">
                    <span className="technician-brand">ECOCYCLE</span>
                    <h2>Join as Technician</h2>
                    <p>
                        Register as a technician to inspect and repair electronics,
                        earn rewards, and contribute to a cleaner environment.
                    </p>
                </div>
                <div className="technician-blob technician-blob--1" />
                <div className="technician-blob technician-blob--2" />
                <div className="technician-blob technician-blob--3" />
            </div>

            <div className="technician-panel">
                <div className="technician-card">
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
                                    Your Inspection Technician account has been created. <strong>Please note that your account needs to be verified and approved by the Administrator before you can log in.</strong>
                                </p>
                            </div>
                            <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "2rem", lineHeight: 1.5 }}>
                                Thank you for registering with EcoCycle. Please wait for admin approval. You can return to the login page to sign in once approved.
                            </p>
                            <button
                                type="button"
                                className="nav-btn submit-btn"
                                onClick={() => navigate("/login")}
                                style={{ maxWidth: "220px", margin: "0 auto", display: "block", textTransform: "none" }}
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="technician-header">
                        <div className="technician-eyebrow">TECHNICIAN REGISTRATION</div>
                        <h1>Sign Up</h1>
                        <p>Fill in your details to get started</p>
                        <div className="role-signup-select-wrapper header-role-select">
                            <label htmlFor="tech-role-select">Select Registration Role:</label>
                            <select
                                id="tech-role-select"
                                className="role-signup-select"
                                value="/technician_signup"
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

                    <form className="technician-form" onSubmit={technician_validation}>
                        {currentStep === 0 && (
                        <div className="form-section">
                            <h3>Personal Details</h3>
                            <div className="technician-form-grid">
                                <div className="technician-form-column">
                                    <div className="technician-field">
                                        <label>First Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your first name"
                                            name="firstName"
                                            value={form_dta.firstName}
                                            onChange={handleInputChange}
                                            className={error.firstName_er ? "input-error" : ""}
                                        />
                                        {error.firstName_er && <div className="error-message">{error.firstName_er}</div>}
                                    </div>
                                    <div className="technician-field">
                                        <label>Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your last name"
                                            name="lastName"
                                            value={form_dta.lastName}
                                            onChange={handleInputChange}
                                            className={error.lastName_er ? "input-error" : ""}
                                        />
                                        {error.lastName_er && <div className="error-message">{error.lastName_er}</div>}
                                    </div>
                                </div>
                                <div className="technician-form-column">
                                    <div className="technician-field">
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="Enter your phone number"
                                            name="phoneNumber"
                                            value={form_dta.phoneNumber}
                                            onChange={handleInputChange}
                                            className={error.phoneNumber_er ? "input-error" : ""}
                                        />
                                        {error.phoneNumber_er && <div className="error-message">{error.phoneNumber_er}</div>}
                                    </div>
                                    <div className="technician-field">
                                        <label>Profile Photo</label>
                                        <input
                                            type="file"
                                            name="profilePhoto"
                                            accept="image/jpeg,image/png"
                                            onChange={handleInputChange}
                                            className={error.profilePhoto_er ? "input-error" : ""}
                                        />
                                        {error.profilePhoto_er && <div className="error-message">{error.profilePhoto_er}</div>}
                                    </div>
                                </div>
                            </div>

                            {/* Full Width Email Field */}
                            <div className="technician-form-grid">
                                <div className="technician-field technician-email-full">
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

                            <div className="technician-form-grid">
                                <div className="technician-form-column">
                                    <div className="technician-field">
                                        <label>Date of Birth</label>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            value={form_dta.dateOfBirth}
                                            onChange={handleInputChange}
                                            className={error.dateOfBirth_er ? "input-error" : ""}
                                        />
                                        {error.dateOfBirth_er && <div className="error-message">{error.dateOfBirth_er}</div>}
                                    </div>
                                </div>
                                <div className="technician-form-column">
                                    <div className="technician-field">
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
                            <h3>Shop / Inspection Center Address Details</h3>
                            <div className="shop-location-banner">
                                <div className="shop-location-icon-wrapper">
                                    <FiMapPin />
                                </div>
                                <div className="shop-location-content">
                                    <div className="shop-location-header">
                                        <span className="shop-location-title">Inspection Center Location</span>
                                    </div>
                                    <div className="shop-location-text">
                                        Please enter the physical address of your <strong>Shop / Inspection Facility</strong>. Collection agents will deliver assigned e-waste items to this location for testing.
                                    </div>
                                </div>
                            </div>
                            <div className="technician-form-grid">
                                <div className="technician-form-column">
                                    <div className="technician-field">
                                        <label>Shop / Facility Address</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your full shop / inspection facility address"
                                            name="address"
                                            value={form_dta.address}
                                            onChange={handleInputChange}
                                            className={error.address_er ? "input-error" : ""}
                                        />
                                        {error.address_er && <div className="error-message">{error.address_er}</div>}
                                    </div>
                                    <div className="technician-field">
                                        <label>Shop PIN Code</label>
                                        <input
                                            type="text"
                                            placeholder="Enter 6-digit shop PIN code"
                                            name="pinCode"
                                            value={form_dta.pinCode}
                                            onChange={handleInputChange}
                                            maxLength={6}
                                            className={error.pinCode_er || pincodeError ? "input-error" : ""}
                                        />
                                        {pincodeLoading && <div className="loading-text">Fetching shop location...</div>}
                                        {pincodeError && <div className="error-message">{pincodeError}</div>}
                                        {error.pinCode_er && <div className="error-message">{error.pinCode_er}</div>}
                                    </div>
                                </div>
                                <div className="technician-form-column">
                                    <div className="technician-field">
                                        <label>Shop State</label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={form_dta.state}
                                            onChange={handleInputChange}
                                            readOnly
                                            className="readonly-field"
                                        />
                                    </div>
                                    <div className="technician-field">
                                        <label>Shop District</label>
                                        <input
                                            type="text"
                                            name="district"
                                            value={form_dta.district}
                                            onChange={handleInputChange}
                                            readOnly
                                            className="readonly-field"
                                        />
                                    </div>
                                    <div className="technician-field">
                                        <label>Shop City / Town</label>
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

                        {currentStep === 2 && (
                        <div className="form-section">
                            <h3>Employment Details</h3>
                            <div className="technician-form-grid">
                                <div className="technician-form-column">
                                    <div className="technician-field">
                                        <label>Shop / Inspection Center Name</label>
                                        <input
                                            type="text"
                                            placeholder="Enter shop / inspection center name"
                                            name="inspectionCenterName"
                                            value={form_dta.inspectionCenterName}
                                            onChange={handleInputChange}
                                            className={error.inspectionCenterName_er ? "input-error" : ""}
                                        />
                                        {error.inspectionCenterName_er && <div className="error-message">{error.inspectionCenterName_er}</div>}
                                    </div>
                                    <div className="technician-field">
                                        <label>Employee ID</label>
                                        <input
                                            type="text"
                                            placeholder="Enter employee ID"
                                            name="employeeId"
                                            value={form_dta.employeeId}
                                            onChange={handleInputChange}
                                            className={error.employeeId_er ? "input-error" : ""}
                                        />
                                        {error.employeeId_er && <div className="error-message">{error.employeeId_er}</div>}
                                    </div>
                                    <div className="technician-field">
                                        <label>Job Title</label>
                                        <input
                                            type="text"
                                            placeholder="Enter job title"
                                            name="jobTitle"
                                            value={form_dta.jobTitle}
                                            onChange={handleInputChange}
                                            className={error.jobTitle_er ? "input-error" : ""}
                                        />
                                        {error.jobTitle_er && <div className="error-message">{error.jobTitle_er}</div>}
                                    </div>
                                </div>
                                <div className="technician-form-column">
                                    <div className="technician-field">
                                        <label>Date of Joining</label>
                                        <input
                                            type="date"
                                            name="dateOfJoining"
                                            value={form_dta.dateOfJoining}
                                            onChange={handleInputChange}
                                            className={error.dateOfJoining_er ? "input-error" : ""}
                                        />
                                        {error.dateOfJoining_er && <div className="error-message">{error.dateOfJoining_er}</div>}
                                    </div>
                                    <div className="technician-field">
                                        <label>Years of Experience</label>
                                        <input
                                            type="number"
                                            placeholder="Enter years of experience"
                                            name="experienceYears"
                                            value={form_dta.experienceYears}
                                            onChange={handleInputChange}
                                            min="0"
                                            className={error.experienceYears_er ? "input-error" : ""}
                                        />
                                        {error.experienceYears_er && <div className="error-message">{error.experienceYears_er}</div>}
                                    </div>
                                    <div className="technician-field">
                                        <label>Specialization</label>
                                        <select
                                            name="specialization"
                                            value={form_dta.specialization}
                                            onChange={handleInputChange}
                                            className={error.specialization_er ? "input-error" : ""}
                                        >
                                            <option value="">Select specialization</option>
                                            <option value="Mobile Devices">Mobile Devices</option>
                                            <option value="Laptops & PCs">Laptops & PCs</option>
                                            <option value="Home Appliances">Home Appliances</option>
                                            <option value="Industrial Electronics">Industrial Electronics</option>
                                            <option value="Networking Equipment">Networking Equipment</option>
                                        </select>
                                        {error.specialization_er && <div className="error-message">{error.specialization_er}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                        {currentStep === 3 && (
                        <div className="form-section">
                            <h3>Certification Details</h3>
                            <div className="technician-form-grid">
                                <div className="technician-form-column">
                                    <div className="technician-field">
                                        <label>Issuing Institute</label>
                                        <input
                                            type="text"
                                            placeholder="Enter issuing institute"
                                            name="issuingInstitute"
                                            value={form_dta.issuingInstitute}
                                            onChange={handleInputChange}
                                            className={error.issuingInstitute_er ? "input-error" : ""}
                                        />
                                        {error.issuingInstitute_er && <div className="error-message">{error.issuingInstitute_er}</div>}
                                    </div>
                                    <div className="technician-field">
                                        <label>Certificate Number</label>
                                        <input
                                            type="text"
                                            placeholder="Enter certificate number"
                                            name="certificateNumber"
                                            value={form_dta.certificateNumber}
                                            onChange={handleInputChange}
                                            className={error.certificateNumber_er ? "input-error" : ""}
                                        />
                                        {error.certificateNumber_er && <div className="error-message">{error.certificateNumber_er}</div>}
                                    </div>
                                </div>
                                <div className="technician-form-column">
                                    <div className="technician-field">
                                        <label>Certificate Issue Date</label>
                                        <input
                                            type="date"
                                            name="certificateIssueDate"
                                            value={form_dta.certificateIssueDate}
                                            onChange={handleInputChange}
                                            className={error.certificateIssueDate_er ? "input-error" : ""}
                                        />
                                        {error.certificateIssueDate_er && <div className="error-message">{error.certificateIssueDate_er}</div>}
                                    </div>
                                    <div className="technician-field">
                                        <label>Certificate Expiry Date (Optional)</label>
                                        <input
                                            type="date"
                                            name="certificateExpiryDate"
                                            value={form_dta.certificateExpiryDate}
                                            onChange={handleInputChange}
                                            className={error.certificateExpiryDate_er ? "input-error" : ""}
                                        />
                                        {error.certificateExpiryDate_er && <div className="error-message">{error.certificateExpiryDate_er}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                        {currentStep === 4 && (
                        <div className="form-section">
                            <h3>Identity Verification</h3>
                            <div className="technician-form-grid">
                                <div className="technician-form-column">
                                    <div className="technician-field">
                                        <label>Government ID Type</label>
                                        <select
                                            name="governmentIdType"
                                            value={form_dta.governmentIdType}
                                            onChange={handleInputChange}
                                            className={error.governmentIdType_er ? "input-error" : ""}
                                        >
                                            <option value="">Select ID type</option>
                                            <option value="Aadhaar">Aadhaar</option>
                                            <option value="PAN">PAN Card</option>
                                            <option value="Driving Licence">Driving Licence</option>
                                            <option value="Passport">Passport</option>
                                        </select>
                                        {error.governmentIdType_er && <div className="error-message">{error.governmentIdType_er}</div>}
                                    </div>
                                    <div className="technician-field">
                                        <label>Government ID Number</label>
                                        <input
                                            type="text"
                                            placeholder="Enter ID number"
                                            name="governmentIdNumber"
                                            value={form_dta.governmentIdNumber}
                                            onChange={handleInputChange}
                                            className={error.governmentIdNumber_er ? "input-error" : ""}
                                        />
                                        {error.governmentIdNumber_er && <div className="error-message">{error.governmentIdNumber_er}</div>}
                                    </div>
                                </div>
                                <div className="technician-form-column">
                                    <div className="technician-field">
                                        <label>Government ID Upload</label>
                                        <input
                                            type="file"
                                            name="governmentIdFile"
                                            accept="image/jpeg,image/png,application/pdf"
                                            onChange={handleInputChange}
                                            className={error.governmentIdFile_er ? "input-error" : ""}
                                        />
                                        {error.governmentIdFile_er && <div className="error-message">{error.governmentIdFile_er}</div>}
                                    </div>
                                    <div className="technician-field">
                                        <label>Employee ID Card Upload</label>
                                        <input
                                            type="file"
                                            name="employeeIdCard"
                                            accept="image/jpeg,image/png,application/pdf"
                                            onChange={handleInputChange}
                                            className={error.employeeIdCard_er ? "input-error" : ""}
                                        />
                                        {error.employeeIdCard_er && <div className="error-message">{error.employeeIdCard_er}</div>}
                                    </div>
                                    <div className="technician-field">
                                        <label>Technical Certificate Upload</label>
                                        <input
                                            type="file"
                                            name="technicalCertificate"
                                            accept="image/jpeg,image/png,application/pdf"
                                            onChange={handleInputChange}
                                            className={error.technicalCertificate_er ? "input-error" : ""}
                                        />
                                        {error.technicalCertificate_er && <div className="error-message">{error.technicalCertificate_er}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}

                        {currentStep === 5 && (
                        <div className="form-section">
                            <h3>Login Details</h3>
                            <div className="technician-form-grid">
                                <div className="technician-form-column">
                                    <div className="technician-field">
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
                                <div className="technician-form-column">
                                    <div className="technician-field">
                                        <label>Confirm Password</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Re-enter your password"
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
                                <button type="button" className="nav-btn prev-btn" onClick={handlePrevious}>
                                    Previous
                                </button>
                            )}
                            {currentStep < sections.length - 1 ? (
                                <button type="button" className="nav-btn next-btn" onClick={handleNext}>
                                    Next
                                </button>
                            ) : (
                                <button type="submit" className="nav-btn submit-btn">
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

                    <div className="technician-footer">
                        <p>Already have an account? <a href="/login">Sign in</a></p>
                        <p><a href="/">← Back to home</a></p>
                    </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Technician_signup;