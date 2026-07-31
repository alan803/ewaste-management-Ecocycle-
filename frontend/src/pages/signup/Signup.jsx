import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Signup.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };
    const [ setServerError] = useState("");
    const [form_dta, set_form_dta] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm_password: "",
    phoneNumber: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
    gender: "",
    dateOfBirth: "",
    roleId: 1
});
    const[error,seterror]=useState({
        firstname_er:"",
        lastname_er:"",
        email_er:"",
        password_er:"",
        confirm_password_er:"",
        phone_er:"",
        address_er:"",
        state_er:"",
        city_er:"",
        pincode_er:"",
        gender_er:"",
        dob_er:"",
    });
    function handleInputChange(e){
        const {name,value}=e.target;
        set_form_dta({
            ...form_dta,
            [name]:value
        });
        if(name==="firstName")
        {
            seterror({
                ...error,
                firstname_er:validate_first_name(value)
            });
        }
        if(name==="lastName")
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
        if(name==="password")
        {
            seterror({
                ...error,
                password_er:validate_password(value)
            });
        }
        if(name==="confirm_password")
        {
            seterror({
                ...error,
                confirm_password_er:validate_confirm_password(value)
            });
        }
        if(name==="phoneNumber")
        {
            seterror({
                ...error,
                phone_er:validate_phone(value)
            });
        }
        if(name==="address")
        {
            seterror({
                ...error,
                address_er:validate_address(value)
            });
        }
        if(name==="state")
        {
            seterror({
                ...error,
                state_er:validate_state(value)
            });
        }
        if(name==="city")
        {
            seterror({
                ...error,
                city_er:validate_city(value)
            });
        }
        if(name==="pincode")
        {
            seterror({
                ...error,
                pincode_er:validate_pincode(value)
            });
        }
        if(name==="gender")
        {
            seterror({
                ...error,
                gender_er:validate_gender(value)
            });
        }
        if(name==="dateOfBirth")
        {
            seterror({
                ...error,
                dob_er:validate_dob(value)
            });
        }
    }
    function validate_first_name(value)
    {
        if(value==="")
        {
            return"Full name is required";
        }
        else if(!/^[A-Za-z\s]+$/.test(value) || value.length<3)
        {
            return"Full name must be at least 3 characters long and contain only letters and spaces.";
        }
        return "";
    }
    function validate_last_name(value)
    {
        if(value==="")
        {
            return"Last name is required";
        }
        else if(!/^[A-Za-z\s]+$/.test(value) || value.length<3)
        {
            return"Last name must be at least 3 characters long and contain only letters and spaces.";
        }
        return "";
    }
    function validate_email(value)
    {
        if(value==="")
        {
            return"Email is required";
        }
        else if(!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(value))
        {
            return"Email must be a valid Gmail address.";
        }
        return "";
    }
    function validate_password(value)
    {
        if(value==="")
        {
            return"Password is required";
        }
        else if(value.length<8 || value.length>15 ||!/^[a-zA-Z0-9@#$%^&*!~(),.?":{}|<>\s]+$/.test(value))
        {
            return"Password must be 8-15 characters long and can contain only letters, numbers, and special characters";
        }
        return "";
    }
    function validate_confirm_password(value)
    {
        if(value==="")
        {
            return"Confirm password is required";
        }
        if(value!==form_dta.password)
        {
            return"Passwords do not match";
        }
        return "";
    }
    function validate_phone(value)
    {
        if(value==="")
        {
            return"Phone number is required";
        }
        if(!/^[6-9]\d{9}$/.test(value))
        {
            return"Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9";
        }
        if(/(\d)\1{4}/.test(value))
        {
            return"Phone number cannot contain 5 or more consecutive identical digits.";
        }
        return "";
    }
    function validate_address(value)
    {
        if(value==="")
        {
            return"Address is required";
        }
        if(value.length<5 || !/^[a-zA-Z\s,.-]+$/.test(value))
        {
            return"Address should be at least 5 characters long and contain only alphabets, spaces, commas, and hyphens";
        }
        return "";
    }
    function validate_state(value)
    {
        if(value==="")
        {
            return"State is required";
        }
        if(value.length<2 || !/^[a-zA-Z\s]+$/.test(value))
        {
            return"State should be at least 2 characters long and contain only alphabets and spaces";
        }
        return "";
    }
    function validate_city(value)
    {
        if(value==="")
        {
            return"City is required";
        }
        if(value.length<2 || !/^[a-zA-Z\s]+$/.test(value))
        {
            return"City should be at least 2 characters long and contain only alphabets and spaces";
        }
        return "";
    }
    function validate_pincode(value)
    {
        if(value==="")
        {
            return"PIN code is required";
        }
        if(!/^[1-9][0-9]{5}$/.test(value))
        {
            return"Please enter a valid 6-digit PIN code.";
        }
        if(value.startsWith('0'))
        {
            return"PIN code cannot start with 0.";
        }
        if(/^(\d)\1{5}$/.test(value))
        {
            return"PIN code cannot have all identical digits.";
        }
        return "";
    }
    function validate_gender(value)
    {
        if(value==="")
        {
            return"Gender is required";
        }
        return "";
    }
    function validate_dob(value)
    {
        if(value==="")
        {
            return"Date of birth is required";
        }
        const today = new Date();
        const dob = new Date(value);
        const age=today.getFullYear()-dob.getFullYear();
        if(dob > today)
        {
            return"Date of birth cannot be in the future.";
        }
        else if(age<18)
        {
            return"You must be at least 18 years old to sign up.";
        }
        return "";
    }
    async function signup_validation(e){
        e.preventDefault();
        const newErrors={
            firstname_er:validate_first_name(form_dta.firstName),
            lastname_er:validate_last_name(form_dta.lastName),
            email_er:validate_email(form_dta.email),
            password_er:validate_password(form_dta.password),
            confirm_password_er:validate_confirm_password(form_dta.confirm_password),
            phone_er:validate_phone(form_dta.phoneNumber),
            address_er:validate_address(form_dta.address),
            state_er:validate_state(form_dta.state),
            city_er:validate_city(form_dta.city),
            pincode_er:validate_pincode(form_dta.pincode),
            gender_er:validate_gender(form_dta.gender),
            dob_er:validate_dob(form_dta.dateOfBirth),
        };
        seterror(newErrors);
        if(Object.values(newErrors).some(err=>err !==""))
        {
            return;
        }
        try 
        {
            const response =await axios.post(
                "https://localhost:7102/api/User/Register",
                form_dta
            );
            navigate("/login");
        }
        catch(error)
        {
            if(error.response)
            {
                const { field, message } = error.response.data;

                seterror(prev => ({
                    ...prev,
                    [field]: message
                }));
            }
        }
    }
    return(
        <div className="signup">
            {/* Illustration Side */}
            <div className="signup-visual">
                <div className="signup-visual-content">
                    <span className="signup-brand">ECOCYCLE</span>
                    <h2>Join the movement</h2>
                    <p>
                        Create your account to start recycling electronics responsibly,
                        track pickups, and contribute to a cleaner planet.
                    </p>
                    <SignupIllustration />
                </div>

                <div className="signup-blob signup-blob--1" />
                <div className="signup-blob signup-blob--2" />
                <div className="signup-blob signup-blob--3" />
            </div>

            {/* Form Side */}
            <div className="signup-panel">
                <div className="signup-card">
                    <div className="signup-header">
                        <div className="signup-eyebrow">CREATE ACCOUNT</div>
                        <h1>Sign up</h1>
                        <p>Fill in your details to get started</p>
                    </div>

                    <form className="signup-form" onSubmit={signup_validation}>
                        <div className="signup-form-grid">
                            {/* Left Column */}
                            <div className="signup-form-column">
                                <div className="signup-field">
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
                                <div className="signup-field">
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

                                <div className="signup-field">
                                    <label>Email</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your email"
                                        name="email"
                                        value={form_dta.email}
                                        onChange={handleInputChange}
                                        className={error.email_er ? "input-error" : ""}
                                    />
                                    {error.email_er && <div className="error-message">{error.email_er}</div>}
                                </div>

                                <div className="signup-field">
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
                                        {error.password_er && <div className="error-message">{error.password_er}</div>}
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={togglePasswordVisibility}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>

                                <div className="signup-field">
                                    <label>Confirm Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Re-enter your password"
                                            name="confirm_password"
                                            value={form_dta.confirm_password}
                                            onChange={handleInputChange}
                                            className={error.confirm_password_er ? "input-error" : ""}
                                        />
                                        {error.confirm_password_er && <div className="error-message">{error.confirm_password_er}</div>}
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={toggleConfirmPasswordVisibility}
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>

                                <div className="signup-field">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        placeholder="Enter your phone number"
                                        name="phoneNumber"
                                        value={form_dta.phoneNumber}
                                        onChange={handleInputChange}
                                        className={error.phone_er ? "input-error" : ""}
                                    />
                                    {error.phone_er && <div className="error-message">{error.phone_er}</div>}
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="signup-form-column">
                                <div className="signup-field">
                                    <label>Address</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your address"
                                        name="address"
                                        value={form_dta.address}
                                        onChange={handleInputChange}
                                        className={error.address_er ? "input-error" : ""}
                                    />
                                    {error.address_er && <div className="error-message">{error.address_er}</div>}
                                </div>

                                <div className="signup-field">
                                    <label>State</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your state"
                                        name="state"
                                        value={form_dta.state}
                                        onChange={handleInputChange}
                                        className={error.state_er ? "input-error" : ""}
                                    />
                                    {error.state_er && <div className="error-message">{error.state_er}</div>}
                                </div>

                                <div className="signup-field">
                                    <label>City</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your city"
                                        name="city"
                                        value={form_dta.city}
                                        onChange={handleInputChange}
                                        className={error.city_er ? "input-error" : ""}
                                    />
                                    {error.city_er && <div className="error-message">{error.city_er}</div>}
                                </div>

                                <div className="signup-field">
                                    <label>PIN Code</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your PIN code"
                                        name="pincode"
                                        value={form_dta.pincode}
                                        onChange={handleInputChange}
                                        className={error.pincode_er ? "input-error" : ""}
                                    />
                                    {error.pincode_er && <div className="error-message">{error.pincode_er}</div>}
                                </div>

                                <div className="signup-field">
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
                                    </select>
                                    {error.gender_er && <div className="error-message">{error.gender_er}</div>}
                                </div>

                                <div className="signup-field">
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

                        <button type="submit" className="signup-btn">
                            Create Account
                        </button>
                    </form>

                    <div className="google-divider">
                        <span>or</span>
                    </div>

                    <button className="google-btn">
                        <img src="https://www.google.com/favicon.ico" alt="Google" width="20" height="20" />
                        Sign up with Google
                    </button>

                    <div className="signup-links">
                        <p>
                            Already have an account?{" "}
                            <a href="/login">Sign in</a>
                        </p>
                        <p>
                            <a href="/" className="signup-back">← Back to home</a>
                        </p>
                        <p><a href="/signup/collection-agent">Sign up as Collection Agent</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Signup;