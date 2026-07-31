import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./CollectionAgent_signup.css";

function CollectionAgent_signup()
{
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const sections = [
        "Personal Details",
        "Identity Verification",
        "Address Details",
        "Vehicle Details",
        "Bank Details",
        "Login Details"
    ];

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleNext = () => {
        if (currentStep < sections.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const[form_dta, set_form_dta] = useState({
            firstname: "",
            lastname: "",
            email: "",
            phone: "",
            alternatePhone: "",
            profile_picture: "",
            dob: "",
            gender: "",
            adhaarNumber: "",
            adhaarProof: "",
            addressProof: "",
            address: "",
            state: "",
            district: "",
            city: "",
            pincode: "",
            serviceArea: "",
            vehicleType: "",
            vehicleNumber: "",
            vehicleInsurance: "",
            vehiclePollution: "",
            vehicle_capacity: "",
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
            profile_picture_er:"",
            dob_er:"",
            gender_er:"",
            adhaarNumber_er:"",
            adhaarProof_er:"",
            addressProof_er:"",
            address_er:"",
            state_er:"",
            district_er:"",
            city_er:"",
            pincode_er:"",
            serviceArea_er:"",
            vehicleType_er:"",
            vehicleNumber_er:"",
            vehicleInsurance_er:"",
            vehiclePollution_er:"",
            vehicle_capacity_er:"",
            licenseNumber_er:"",
            accountHolder_er:"",
            bankName_er:"",
            accountNumber_er:"",
            ifscCode_er:"",
            password_er:"",
            confirmPassword_er:""
        });
        function handleInputChange(e)
        {
            const {name,value,files}=e.target;
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
            if (files)
            {
                const file = files[0];

                set_form_dta({
                    ...form_dta,
                    [name]: file
                });

                if (name === "profile_picture")
                {
                    seterror({
                        ...error,
                        profile_picture_er: validateFile(file)
                    });
                }
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
            if(name==="state")
            {
                seterror({
                    ...error,
                    state_er:validate_state(value)
                });
            }
            if(name==="district")
            {
                seterror({
                    ...error,
                    district_er:validate_district(value)
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
            if(name === "serviceArea")
            {
                seterror(prev => ({
                    ...prev,
                    serviceArea_er: validate_serviceArea(value)
                }));
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
            if(name === "vehicle_capacity")
            {
                seterror(prev => ({
                    ...prev,
                    vehicle_capacity_er: validate_vehicle_capacity(value)
                }));
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
                    password_er: validate_password(value)
                }));
            }
            if(name === "confirmPassword")
            {
                seterror(prev => ({
                    ...prev,
                    confirmPassword_er: validate_confirmPassword(value)
                }));
            }
            if(name === "addressProof")
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
                        addressProof_er: validateFile(file)
                    }));
                }
            }
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
        function validate_first_name(value)
        {
            if(value==="")
            {
                return"First name is required";
            }
            else if(!/^[a-zA-Z\s]+$/.test(value) || value.length<3)
            {
                return"First name must be at least 3 characters long and contain only letters and spaces.";
            }
            return"";
        }
        function validate_last_name(value)
        {
            if(value==="")
            {
                return"Last name is required";
            }
            else if(!/^[a-zA-Z\s]+$/.test(value) || value.length<3)
            {
                return"Last name must be at least 3 characters long and contain only letters and spaces.";
            }
            return"";
        }
        function validate_email(value)
        {
            if(value==="")
            {
                return "Email is required";
            }
            else if(!/^[a-zA-Z0-9._%+-]+@gmail.com$/.test(value))
            {
                return "Email must be a valid Gmail address";
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
        function alternate_validate_phone(value)
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
        function validateFile(file)
        {
            if (!file)
            {
                return "Please select a file";
            }

            const allowedTypes = [
                "image/jpeg",
                "image/png"
            ];

            if (!allowedTypes.includes(file.type))
            {
                return "Only JPG, PNG files are allowed";
            }
            if (file.size > 2 * 1024 * 1024)
            {
                return "File size must be less than 2 MB";
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
        function validate_gender(value)
        {
            if(value==="")
            {
                return"Gender is required";
            }
            return "";
        }
        function validate_adhaarNumber(value)
        {
            if(value==="")
            {
                return"Adhaar number is required";
            }
            if(!/^[1-9]\d{11}$/.test(value))
            {
                return"Adhaar number must be 12 digits and start with 1-9";
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
        function validate_district(value)
        {
            if(value==="")
            {
                return"District is required";
            }
            if(value.length<2 || !/^[a-zA-Z\s]+$/.test(value))
            {
                return"District should be at least 2 characters long and contain only alphabets and spaces";
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
        function validate_serviceArea(value)
        {
            if (value.trim() === "")
            {
                return "Service area is required";
            }

            if (!/^[a-zA-Z\s,]+$/.test(value))
            {
                return "Only letters, spaces and commas are allowed.";
            }

            return "";
        }
        function validate_vehicleType(value)
        {
            if(value === "")
            {
                return "Please select a vehicle type.";
            }

            return "";
        }
        function validate_vehicleNumber(value)
        {
            if(value.trim() === "")
            {
                return "Vehicle number is required.";
            }

            const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;

            if(!vehicleRegex.test(value.toUpperCase()))
            {
                return "Enter a valid vehicle number.";
            }
            return "";
        }
        function validate_licenseNumber(value)
        {
            if(value.trim() === "")
            {
                return "Driving license number is required.";
            }

            const licenseRegex = /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/;

            if(!licenseRegex.test(value.toUpperCase()))
            {
                return "Enter a valid driving license number.";
            }

            return "";
        }
        function validate_vehicleInsurance(file)
        {
            if (!file)
            {
                return "Vehicle insurance document is required";
            }
            const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
            if (!allowedTypes.includes(file.type))
            {
                return "Only JPG, PNG, or PDF files are allowed";
            }
            if (file.size > 5 * 1024 * 1024)
            {
                return "File size must be less than 5 MB";
            }
            return "";
        }
        function validate_vehiclePollution(file)
        {
            if (!file)
            {
                return "Vehicle pollution certificate is required";
            }
            const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
            if (!allowedTypes.includes(file.type))
            {
                return "Only JPG, PNG, or PDF files are allowed";
            }
            if (file.size > 5 * 1024 * 1024)
            {
                return "File size must be less than 5 MB";
            }
            return "";
        }
        function validate_vehicle_capacity(value)
        {
            if(value.trim() === "")
            {
                return "Vehicle capacity is required";
            }
            if(!/^\d+$/.test(value))
            {
                return "Vehicle capacity must be a number";
            }
            return "";
        }
        function validate_accountHolder(value)
        {
            if(value.trim() === "")
            {
                return "Account holder name is required";
            }
            if(!/^[a-zA-Z\s]+$/.test(value))
            {
                return "Account holder name should contain only letters and spaces";
            }
            return "";
        }
        function validate_bankName(value)
        {
            if(value.trim() === "")
            {
                return "Bank name is required";
            }
            if(!/^[a-zA-Z\s]+$/.test(value))
            {
                return "Bank name should contain only letters and spaces";
            }
            return "";
        }
        function validate_accountNumber(value)
        {
            if(value.trim() === "")
            {
                return "Account number is required";
            }
            if(!/^\d{9,18}$/.test(value))
            {
                return "Account number must be 9-18 digits";
            }
            return "";
        }
        function validate_ifscCode(value)
        {
            if(value.trim() === "")
            {
                return "IFSC code is required";
            }
            if(!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.toUpperCase()))
            {
                return "Please enter a valid IFSC code";
            }
            return "";
        }
        function validate_password(value)
        {
            if(value === "")
            {
                return "Password is required";
            }
            if(value.length < 6)
            {
                return "Password must be at least 6 characters";
            }
            if(!/[!@#$%^&*(),.?":{}|<>]/.test(value))
            {
                return "Password must contain at least one special character";
            }
            return "";
        }
        function validate_confirmPassword(value)
        {
            if(value === "")
            {
                return "Please confirm your password";
            }
            if(value !== form_dta.password)
            {
                return "Passwords do not match";
            }
            return "";
        }
        function collectionagent_validation(e)
        {
            e.preventDefault();

            const newErrors = {
                firstname_er: validate_first_name(form_dta.firstname),
                lastname_er: validate_last_name(form_dta.lastname),
                email_er: validate_email(form_dta.email),
                phone_er: validate_phone(form_dta.phone),
                alternatePhone_er:alternate_validate_phone(form_dta.alternatePhone),
                profile_picture_er: validateFile(form_dta.profile_picture),
                dob_er: validate_dob(form_dta.dob),
                gender_er: validate_gender(form_dta.gender),
                adhaarNumber_er: validate_adhaarNumber(form_dta.adhaarNumber),
                adhaarProof_er: validateFile(form_dta.adhaarProof),
                addressProof_er: validateFile(form_dta.addressProof),
                address_er:validate_address(form_dta.address),
                state_er:validate_state(form_dta.state),
                district_er:validate_district(form_dta.district),
                city_er:validate_city(form_dta.city),
                pincode_er:validate_pincode(form_dta.pincode),
                serviceArea_er:validate_serviceArea(form_dta.serviceArea),
                vehicleType_er: validate_vehicleType(form_dta.vehicleType),
                vehicleNumber_er:validate_vehicleNumber(form_dta.vehicleNumber),
                licenseNumber_er:validate_licenseNumber(form_dta.licenseNumber),
                vehicleInsurance_er: validate_vehicleInsurance(form_dta.vehicleInsurance),
                vehiclePollution_er: validate_vehiclePollution(form_dta.vehiclePollution),
                vehicle_capacity_er: validate_vehicle_capacity(form_dta.vehicle_capacity),
                accountHolder_er: validate_accountHolder(form_dta.accountHolder),
                bankName_er: validate_bankName(form_dta.bankName),
                accountNumber_er: validate_accountNumber(form_dta.accountNumber),
                ifscCode_er: validate_ifscCode(form_dta.ifscCode),
                password_er: validate_password(form_dta.password),
                confirmPassword_er: validate_confirmPassword(form_dta.confirmPassword)
            };

            seterror(newErrors);

            if (Object.values(newErrors).some(err => err !== ""))
            {
                return;
            }
            navigate("/collectionagent");
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
                    <div className="collectionagent-header">
                        <div className="collectionagent-eyebrow">AGENT REGISTRATION</div>
                        <h1>Sign Up</h1>
                        <p>Fill in your details to get started</p>
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
                                </div>
                                <div className="collectionagent-form-column">
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
                                            name="profile_picture"
                                            accept="image/jpeg,image/png"
                                            onChange={handleInputChange}
                                            className={error.profile_picture_er ? "input-error" : ""}
                                        />
                                        {error.profile_picture_er && <div className="error-message">{error.profile_picture_er}</div>}
                                    </div>
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
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>Address Proof(any home bills)</label>
                                        <input
                                            type="file"
                                            name="addressProof"
                                            accept="image/jpeg,image/png,application/pdf"
                                            onChange={handleInputChange}
                                            className={error.addressProof_er ? "input-error" : ""}
                                        />
                                        {error.addressProof_er && <div className="error-message">{error.addressProof_er}</div>}
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
                                    <div className="collectionagent-field">
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
                                </div>
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>District</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your district"
                                            name="district"
                                            value={form_dta.district}
                                            onChange={handleInputChange}
                                            className={error.district_er ? "input-error" : ""}
                                        />
                                        {error.district_er && <div className="error-message">{error.district_er}</div>}
                                    </div>
                                    <div className="collectionagent-field">
                                        <label>PIN Code</label>
                                        <input
                                            type="text"
                                            placeholder="Enter PIN code"
                                            name="pincode"
                                            value={form_dta.pincode}
                                            onChange={handleInputChange}
                                            className={error.pincode_er ? "input-error" : ""}
                                        />
                                        {error.pincode_er && <div className="error-message">{error.pincode_er}</div>}
                                    </div>
                                    <div className="collectionagent-field">
                                        <label>Service Area</label>
                                        <input
                                            type="text"
                                            placeholder="Service areas"
                                            name="serviceArea"
                                            value={form_dta.serviceArea}
                                            onChange={handleInputChange}
                                            className={error.serviceArea_er ? "input-error" : ""}
                                        />
                                        {error.serviceArea_er && <div className="error-message">{error.serviceArea_er}</div>}
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
                                            <option value="Auto Rickshaw">Auto Rickshaw</option>
                                            <option value="Car">Car</option>
                                            <option value="Van">Van</option>
                                            <option value="Mini Truck">Mini Truck</option>
                                            <option value="Pickup Truck">Pickup Truck</option>
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
                                </div>
                                <div className="collectionagent-form-column">
                                    <div className="collectionagent-field">
                                        <label>Vehicle Capacity</label>
                                        <input
                                            type="text"
                                            placeholder="Enter vehicle capacity"
                                            name="vehicle_capacity"
                                            value={form_dta.vehicle_capacity}
                                            onChange={handleInputChange}
                                            className={error.vehicle_capacity_er ? "input-error" : ""}
                                        />
                                        {error.vehicle_capacity_er && <div className="error-message">{error.vehicle_capacity_er}</div>}
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
                                            {error.confirmPassword_er && <div className="error-message">{error.confirmPassword_er}</div>}
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
                </div>
            </div>
        </div>
    )
}
export default CollectionAgent_signup