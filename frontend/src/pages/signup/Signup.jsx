import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Signup.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    validate_first_name,
    validate_last_name,
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
    validate_dob
} from "../../utils/validation";

function SignupIllustration() {
    return (
        <svg
            className="signup-illustration"
            viewBox="0 0 520 480"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <circle cx="260" cy="240" r="180" fill="rgba(255,255,255,0.12)" />
            <circle cx="260" cy="240" r="130" fill="rgba(255,255,255,0.1)" />

            {/* User Profile Card */}
            <rect x="160" y="120" width="200" height="240" rx="16" fill="rgba(255,255,255,0.95)" />
            <rect x="160" y="120" width="200" height="60" rx="16" fill="#1e8a55" />
            <rect x="160" y="160" width="200" height="20" fill="#1e8a55" />

            {/* Profile Circle */}
            <circle cx="260" cy="180" r="35" fill="#c8e6d4" />
            <circle cx="260" cy="175" r="20" fill="#1e8a55" opacity="0.6" />
            <path d="M245 195 Q260 210 275 195" stroke="#1e8a55" strokeWidth="2" fill="none" />

            {/* Form Lines */}
            <rect x="185" y="230" width="150" height="8" rx="4" fill="#e8f5ee" />
            <rect x="185" y="250" width="120" height="8" rx="4" fill="#e8f5ee" />
            <rect x="185" y="270" width="130" height="8" rx="4" fill="#e8f5ee" />
            <rect x="185" y="290" width="100" height="8" rx="4" fill="#e8f5ee" />
            <rect x="185" y="310" width="140" height="8" rx="4" fill="#e8f5ee" />

            {/* Checkmark Badge */}
            <circle cx="340" cy="130" r="24" fill="#4ade80" />
            <path d="M332 130 L338 136 L348 124" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* Floating Elements */}
            <circle cx="120" cy="200" r="20" fill="rgba(255,255,255,0.3)" />
            <circle cx="400" cy="280" r="16" fill="rgba(255,255,255,0.25)" />
            <rect x="100" y="320" width="40" height="40" rx="8" fill="rgba(255,255,255,0.2)" transform="rotate(15 100 320)" />
            <rect x="380" y="100" width="35" height="35" rx="7" fill="rgba(255,255,255,0.2)" transform="rotate(-20 380 100)" />

            {/* Connection Lines */}
            <path d="M180 180 L120 200" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M340 180 L400 280" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="4 4" />
        </svg>
    );
}

function Signup() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const sections = [
        "Personal Information",
        "Address Details",
        "Login Details"
    ];

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const [pincodeLoading, setPincodeLoading] = useState(false);
    const [pincodeError, setPincodeError] = useState("");
    const [form_dta, set_form_dta] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirm_password: "",
        phoneNumber: "",
        address: "",
        pincode: "",
        state: "",
        district: "",
        city: "",
        gender: "",
        dateOfBirth: "",
        roleId: 1
    });

    const [error, seterror] = useState({
        firstname_er: "",
        lastname_er: "",
        email_er: "",
        password_er: "",
        confirm_password_er: "",
        phone_er: "",
        address_er: "",
        pincode_er: "",
        state_er: "",
        district_er: "",
        city_er: "",
        gender_er: "",
        dob_er: "",
    });

    const [touched, setTouched] = useState({});

    // Fetch location data when PIN code changes
    useEffect(() => {
        if (form_dta.pincode && form_dta.pincode.length === 6) {
            fetchPincodeData(form_dta.pincode);
        } else {
            setPincodeError("");
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

                set_form_dta(prev => ({
                    ...prev,
                    state: data.State,
                    district: data.District,
                    city: data.Block || data.District
                }));

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

    const handleNext = () => {
        // Step 0 - Personal Information
        if (currentStep === 0) {
            const errors = {
                firstname_er: validate_first_name(form_dta.firstName),
                lastname_er: validate_last_name(form_dta.lastName),
                phone_er: validate_phone(form_dta.phoneNumber),
                gender_er: validate_gender(form_dta.gender),
                dob_er: validate_dob(form_dta.dateOfBirth)
            };

            seterror(prev => ({
                ...prev,
                ...errors
            }));

            if (Object.values(errors).some(msg => msg !== "")) {
                return;
            }

            setCurrentStep(prev => prev + 1);
            return;
        }

        // Step 1 - Address Details
        if (currentStep === 1) {
            if (pincodeLoading) {
                setPincodeError("Please wait while location details are being fetched");
                return;
            }

            if (pincodeError) {
                return;
            }

            const errors = {
                address_er: validate_address(form_dta.address),
                pincode_er: validate_pincode(form_dta.pincode),
                state_er: validate_state(form_dta.state),
                district_er: validate_district(form_dta.district),
                city_er: validate_city(form_dta.city)
            };

            seterror(prev => ({
                ...prev,
                ...errors
            }));

            if (Object.values(errors).some(msg => msg !== "")) {
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
        const { name, value } = e.target;

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
            seterror(prev => ({
                ...prev,
                pincode_er: validate_pincode(numericValue)
            }));
            return;
        }

        set_form_dta(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === "firstName") {
            seterror(prev => ({
                ...prev,
                firstname_er: validate_first_name(value)
            }));
        }
        if (name === "lastName") {
            seterror(prev => ({
                ...prev,
                lastname_er: validate_last_name(value)
            }));
        }
        if (name === "email") {
            seterror(prev => ({
                ...prev,
                email_er: validate_email(value)
            }));
        }
        if (name === "password") {
            seterror(prev => ({
                ...prev,
                password_er: validate_password(value)
            }));
        }
        if (name === "confirm_password") {
            seterror(prev => ({
                ...prev,
                confirm_password_er: validate_confirm_password(value, form_dta.password)
            }));
        }
        if (name === "phoneNumber") {
            seterror(prev => ({
                ...prev,
                phone_er: validate_phone(value)
            }));
        }
        if (name === "address") {
            seterror(prev => ({
                ...prev,
                address_er: validate_address(value)
            }));
        }
        if (name === "gender") {
            seterror(prev => ({
                ...prev,
                gender_er: validate_gender(value)
            }));
        }
        if (name === "dateOfBirth") {
            seterror(prev => ({
                ...prev,
                dob_er: validate_dob(value)
            }));
        }
    }

    async function signup_validation(e) {
        e.preventDefault();
        const newErrors = {
            firstname_er: validate_first_name(form_dta.firstName),
            lastname_er: validate_last_name(form_dta.lastName),
            email_er: validate_email(form_dta.email),
            password_er: validate_password(form_dta.password),
            confirm_password_er: validate_confirm_password(form_dta.confirm_password, form_dta.password),
            phone_er: validate_phone(form_dta.phoneNumber),
            address_er: validate_address(form_dta.address),
            pincode_er: validate_pincode(form_dta.pincode),
            district_er: validate_district(form_dta.district),
            gender_er: validate_gender(form_dta.gender),
            dob_er: validate_dob(form_dta.dateOfBirth),
        };
        seterror(newErrors);
        if (Object.values(newErrors).some(err => err !== "")) {
            return;
        }
        try {
            const response = await axios.post(
                "https://ecocycle.runasp.net/api/User/Register",
                form_dta
            );
            navigate("/login");
        } catch (error) {
            if (error.response) {
                const { field, message } = error.response.data;

                seterror(prev => ({
                    ...prev,
                    [field]: message
                }));
            } else {
                navigate("/login");
            }
        }
    }

    return (
        <div className="refurbishmentcenter-signup">
            {/* Visual Side */}
            <div className="refurbishmentcenter-visual">
                <div className="refurbishmentcenter-visual-content">
                    <span className="refurbishmentcenter-brand">ECOCYCLE</span>
                    <h2>Join the movement</h2>
                    <p>
                        Create your account to start recycling electronics responsibly,
                        track pickups, and contribute to a cleaner planet.
                    </p>
                    <SignupIllustration />
                </div>

                <div className="refurbishmentcenter-blob refurbishmentcenter-blob--1" />
                <div className="refurbishmentcenter-blob refurbishmentcenter-blob--2" />
                <div className="refurbishmentcenter-blob refurbishmentcenter-blob--3" />
            </div>

            {/* Form Side */}
            <div className="refurbishmentcenter-panel">
                <div className="refurbishmentcenter-card">

                    <div className="refurbishmentcenter-header">
                        <div className="refurbishmentcenter-eyebrow">CREATE ACCOUNT</div>
                        <h1>Sign Up</h1>
                        <p>Fill in your details to get started</p>
                        <div className="role-signup-select-wrapper header-role-select">
                            <label htmlFor="role-select">Select Registration Role:</label>
                            <select
                                id="role-select"
                                className="role-signup-select"
                                value="/signup"
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

                    <form className="refurbishmentcenter-form" onSubmit={signup_validation}>
                        {currentStep === 0 && (
                            <div className="form-section">
                                <h3>Personal Information</h3>
                                <div className="refurbishmentcenter-form-grid">
                                    {/* 1st Field (Odd of 5 fields) - Full width spanning sum of both columns */}
                                    <div className="refurbishmentcenter-field full-width-field" style={{ gridColumn: "1 / -1" }}>
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="Enter 10-digit mobile number"
                                            name="phoneNumber"
                                            value={form_dta.phoneNumber}
                                            onChange={handleInputChange}
                                            className={error.phone_er ? "input-error" : ""}
                                        />
                                        {error.phone_er && <div className="error-message">{error.phone_er}</div>}
                                    </div>

                                    {/* Remaining 4 fields in 2 equal columns */}
                                    <div className="refurbishmentcenter-form-column">
                                        <div className="refurbishmentcenter-field">
                                            <label>First Name</label>
                                            <input
                                                type="text"
                                                placeholder="Enter your first name"
                                                name="firstName"
                                                value={form_dta.firstName}
                                                onChange={handleInputChange}
                                                className={error.firstname_er ? "input-error" : ""}
                                            />
                                            {error.firstname_er && <div className="error-message">{error.firstname_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>Gender</label>
                                            <select
                                                name="gender"
                                                value={form_dta.gender}
                                                onChange={handleInputChange}
                                                className={error.gender_er ? "input-error" : ""}
                                            >
                                                <option value="">Select gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                            {error.gender_er && <div className="error-message">{error.gender_er}</div>}
                                        </div>
                                    </div>

                                    <div className="refurbishmentcenter-form-column">
                                        <div className="refurbishmentcenter-field">
                                            <label>Last Name</label>
                                            <input
                                                type="text"
                                                placeholder="Enter your last name"
                                                name="lastName"
                                                value={form_dta.lastName}
                                                onChange={handleInputChange}
                                                className={error.lastname_er ? "input-error" : ""}
                                            />
                                            {error.lastname_er && <div className="error-message">{error.lastname_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>Date of Birth</label>
                                            <input
                                                type="date"
                                                name="dateOfBirth"
                                                value={form_dta.dateOfBirth}
                                                onChange={handleInputChange}
                                                className={error.dob_er ? "input-error" : ""}
                                            />
                                            {error.dob_er && <div className="error-message">{error.dob_er}</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="form-section">
                                <h3>Address Details</h3>
                                <div className="refurbishmentcenter-form-grid">
                                    {/* 1st Field (Odd of 5 fields) - Full width spanning sum of both columns */}
                                    <div className="refurbishmentcenter-field full-width-field" style={{ gridColumn: "1 / -1" }}>
                                        <label>Address</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your street address"
                                            name="address"
                                            value={form_dta.address}
                                            onChange={handleInputChange}
                                            className={error.address_er ? "input-error" : ""}
                                        />
                                        {error.address_er && <div className="error-message">{error.address_er}</div>}
                                    </div>

                                    {/* Remaining 4 fields in 2 equal columns */}
                                    <div className="refurbishmentcenter-form-column">
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
                                            <label>District</label>
                                            <input
                                                type="text"
                                                name="district"
                                                value={form_dta.district}
                                                readOnly
                                                className={error.district_er ? "input-error" : "readonly-field"}
                                            />
                                            {error.district_er && <div className="error-message">{error.district_er}</div>}
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
                                                className={error.state_er ? "input-error" : "readonly-field"}
                                            />
                                            {error.state_er && <div className="error-message">{error.state_er}</div>}
                                        </div>
                                        <div className="refurbishmentcenter-field">
                                            <label>City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={form_dta.city}
                                                readOnly
                                                className={error.city_er ? "input-error" : "readonly-field"}
                                            />
                                            {error.city_er && <div className="error-message">{error.city_er}</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="form-section">
                                <h3>Login & Account Details</h3>
                                <div className="refurbishmentcenter-form-grid">
                                    {/* 1st Field (Odd of 3 fields) - Full width spanning sum of both columns */}
                                    <div className="refurbishmentcenter-field full-width-field" style={{ gridColumn: "1 / -1" }}>
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="Enter your email address"
                                            name="email"
                                            value={form_dta.email}
                                            onChange={handleInputChange}
                                            className={error.email_er ? "input-error" : ""}
                                        />
                                        {error.email_er && <div className="error-message">{error.email_er}</div>}
                                    </div>

                                    {/* Remaining 2 fields in 2 columns */}
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

                                    <div className="refurbishmentcenter-form-column">
                                        <div className="refurbishmentcenter-field">
                                            <label>Confirm Password</label>
                                            <div className="password-input-wrapper">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Re-enter password"
                                                    name="confirm_password"
                                                    value={form_dta.confirm_password}
                                                    onChange={handleInputChange}
                                                    className={error.confirm_password_er ? "input-error" : ""}
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
                                            {error.confirm_password_er && <div className="error-message">{error.confirm_password_er}</div>}
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
                                    Create Account
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
                </div>
            </div>
        </div>
    );
}

export default Signup;