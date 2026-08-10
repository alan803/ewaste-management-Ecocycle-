import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    validate_email,
    validate_phone,
    validate_address,
    validateFile,
    validate_dob,
    validate_gender,
} from "../../utils/validation";
import {
    FiUser,
    FiMail,
    FiPhone,
    FiMapPin,
    FiCalendar,
    FiShield,
    FiBell,
    FiChevronDown,
    FiCheckCircle,
    FiGlobe,
    FiHash,
    FiNavigation,
    FiPlusCircle,
    FiBox,
    FiAward,
    FiRefreshCw,
    FiAlertCircle,
    FiCamera,
    FiLock,
    FiEdit3,
    FiSave,
    FiX,
    FiKey,
    FiEye,
    FiEyeOff
} from "react-icons/fi";
import "./Manage_userprofile.css";

function Manage_userprofile() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [loading, setloading] = useState(true);
    const [error, seterror] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [saving, setSaving] = useState(false);

    // Edit Mode & Form State (Only gender, dateOfBirth, email, phoneNumber, and address are editable)
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        gender: "",
        dateOfBirth: "",
        email: "",
        phoneNumber: "",
        address: ""
    });
    const [formErrors, setFormErrors] = useState({});
    const [selectedFile, setSelectedFile] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);

    // Password Change UI & Verification state
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [passwordStep, setPasswordStep] = useState(1); // 1 = Current Password, 2 = New & Confirm Passwords
    const [currentPasswordInput, setCurrentPasswordInput] = useState("");
    const [newPasswordInput, setNewPasswordInput] = useState("");
    const [confirmPasswordInput, setConfirmPasswordInput] = useState("");

    const [passwordError, setPasswordError] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleResetPasswordForm = () => {
        setShowPasswordSection(false);
        setPasswordStep(1);
        setCurrentPasswordInput("");
        setNewPasswordInput("");
        setConfirmPasswordInput("");
        setPasswordError("");
        setPasswordLoading(false);
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    // Step 1: Verify current password with backend
    const handleVerifyCurrentPassword = async (e) => {
        e?.preventDefault();
        if (!currentPasswordInput) {
            setPasswordError("Please enter your current password.");
            return;
        }

        setPasswordLoading(true);
        setPasswordError("");

        const token = localStorage.getItem("token");

        try {
            const response = await axios.post(
                "https://localhost:7102/api/User/verify-password",
                { currentPassword: currentPasswordInput },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (response.data?.success) {
                setPasswordStep(2);
                setPasswordError("");
            }
        } catch (err) {
            console.error("Password verification error:", err);
            const errMsg = err.response?.data?.message || "Current password is incorrect. Try again.";
            setPasswordError(errMsg);
        } finally {
            setPasswordLoading(false);
        }
    };

    // Step 2: Update password with backend
    const handleUpdateNewPassword = async (e) => {
        e?.preventDefault();
        if (!newPasswordInput) {
            setPasswordError("Please enter a new password.");
            return;
        }
        if (newPasswordInput.length < 6) {
            setPasswordError("New password must be at least 6 characters.");
            return;
        }
        if (newPasswordInput !== confirmPasswordInput) {
            setPasswordError("New password and confirm password do not match. Try again.");
            return;
        }

        setPasswordLoading(true);
        setPasswordError("");

        const token = localStorage.getItem("token");

        try {
            const response = await axios.post(
                "https://localhost:7102/api/User/change-password",
                {
                    currentPassword: currentPasswordInput,
                    newPassword: newPasswordInput,
                    confirmPassword: confirmPasswordInput
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            setSuccessMessage(response.data?.message || "Password updated successfully!");
            handleResetPasswordForm();
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            console.error("Password update error:", err);
            const errMsg = err.response?.data?.message || "Failed to update password. Try again.";
            setPasswordError(errMsg);
        } finally {
            setPasswordLoading(false);
        }
    };

    const normalizeGender = (g) => {
        if (!g) return "";
        const lower = String(g).trim().toLowerCase();
        if (lower === "male") return "Male";
        if (lower === "female") return "Female";
        if (lower === "other") return "Other";
        return g;
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found in localStorage, redirecting to login.");
            navigate("/login");
            return;
        }
        loadprofile();
    }, [navigate]);

    const loadprofile = async () => {
        const token = localStorage.getItem("token");

        try {
            const response = await axios.get(
                "https://localhost:7102/api/User/profile",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            const data = response.data || {};
            setProfile(data);

            // Set initial form state for editable fields
            setEditForm({
                gender: normalizeGender(data.gender),
                dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
                email: data.email || "",
                phoneNumber: data.phoneNumber || "",
                address: data.address || ""
            });

            // Set profile image preview if present
            const img = data.profilePicture || data.profileImage;
            if (img) {
                if (img.startsWith("http") || img.startsWith("data:")) {
                    setProfileImagePreview(img);
                } else {
                    setProfileImagePreview(`https://localhost:7102/uploads/profile/${img}`);
                }
            } else {
                const savedImage = localStorage.getItem("citizen_profile_image");
                if (savedImage) {
                    setProfileImagePreview(savedImage);
                }
            }

            setloading(false);
        } catch (err) {
            console.error("Profile error:", err);
            console.error("Response:", err.response?.data);
            seterror("Failed to load profile.");
            setloading(false);
        }
    };

    const userName = profile?.firstName 
        ? `${profile.firstName} ${profile.lastName || ""}`.trim()
        : localStorage.getItem("firstName") ||
          localStorage.getItem("userName") ||
          localStorage.getItem("username") ||
          localStorage.getItem("name") ||
          "Citizen Champion";

    const getInitial = (nameStr) => {
        return nameStr ? nameStr.charAt(0).toUpperCase() : "C";
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
        } catch {
            return dateStr;
        }
    };

    // Handle Profile Picture File Change
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileErr = validateFile(file);
        if (fileErr) {
            alert(fileErr);
            return;
        }

        setSelectedFile(file);
        const previewUrl = URL.createObjectURL(file);
        setProfileImagePreview(previewUrl);
        setIsEditing(true);
    };

    // Handle Input Field Changes with Live Validation
    const handleInputChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));

        // Validate individual editable field
        let err = "";
        if (field === "gender") err = validate_gender(value);
        if (field === "dateOfBirth") err = validate_dob(value);
        if (field === "email") err = validate_email(value);
        if (field === "phoneNumber") err = validate_phone(value);
        if (field === "address") err = validate_address(value);

        setFormErrors(prev => ({ ...prev, [field]: err }));
    };

    // Validate form prior to save submission
    const validateForm = () => {
        const errors = {
            gender: validate_gender(editForm.gender),
            dateOfBirth: validate_dob(editForm.dateOfBirth),
            email: validate_email(editForm.email),
            phoneNumber: validate_phone(editForm.phoneNumber),
            address: validate_address(editForm.address)
        };

        setFormErrors(errors);
        return !Object.values(errors).some(err => err !== "");
    };

    // Handle Save Profile Changes - Only update values that are updated
    const handleSaveChanges = async () => {
        if (!validateForm()) {
            return;
        }

        setSaving(true);
        seterror("");
        setSuccessMessage("");

        const token = localStorage.getItem("token");

        const currentDob = profile?.dateOfBirth ? profile.dateOfBirth.split("T")[0] : "";
        const currentGender = normalizeGender(profile?.gender);

        const formData = new FormData();
        let hasChanges = false;

        if (editForm.gender !== currentGender) {
            formData.append("Gender", editForm.gender);
            hasChanges = true;
        }
        if (editForm.dateOfBirth !== currentDob) {
            if (editForm.dateOfBirth) {
                formData.append("DateOfBirth", editForm.dateOfBirth);
            }
            hasChanges = true;
        }
        if (editForm.email !== profile?.email) {
            formData.append("Email", editForm.email);
            hasChanges = true;
        }
        if (editForm.phoneNumber !== profile?.phoneNumber) {
            formData.append("PhoneNumber", editForm.phoneNumber);
            hasChanges = true;
        }
        if (editForm.address !== profile?.address) {
            formData.append("Address", editForm.address);
            hasChanges = true;
        }
        if (selectedFile) {
            formData.append("ProfilePicture", selectedFile);
            hasChanges = true;
        }

        if (!hasChanges) {
            setSuccessMessage("No changes to update.");
            setIsEditing(false);
            setSaving(false);
            setTimeout(() => setSuccessMessage(""), 3000);
            return;
        }

        try {
            const response = await axios.put(
                "https://localhost:7102/api/User/profile",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log("Profile update response:", response.data);

            setSelectedFile(null);
            await loadprofile();

            setIsEditing(false);
            setSuccessMessage(
                response.data?.message || "Profile updated successfully."
            );
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            console.error("Profile update error:", err);
            console.error("Response:", err.response?.data);

            const apiError = err.response?.data;

            if (apiError?.field) {
                setFormErrors(prev => ({
                    ...prev,
                    [apiError.field]: apiError.message
                }));
            } else {
                seterror(
                    apiError?.message ||
                    "Failed to update profile."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    // Cancel Editing & Reset Form
    const handleCancelEdit = () => {
        if (profile) {
            setEditForm({
                gender: normalizeGender(profile.gender),
                dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split("T")[0] : "",
                email: profile.email || "",
                phoneNumber: profile.phoneNumber || "",
                address: profile.address || ""
            });
            const img = profile.profilePicture || profile.profileImage;
            if (img) {
                if (img.startsWith("http") || img.startsWith("data:")) {
                    setProfileImagePreview(img);
                } else {
                    setProfileImagePreview(`https://localhost:7102/uploads/profile/${img}`);
                }
            } else {
                const savedImage = localStorage.getItem("citizen_profile_image");
                setProfileImagePreview(savedImage || null);
            }
        }
        setSelectedFile(null);
        setFormErrors({});
        setIsEditing(false);
    };

    return (
        <div className="citizen-dashboard-layout">
            {/* Hidden File Input for Profile Picture */}
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/jpeg,image/png" 
                style={{ display: "none" }} 
            />

            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="citizen-main-content">
                {/* Title & Top Ribbon */}
                <div className="vd-ribbon" style={{ marginBottom: "1.75rem" }}>
                    <h1 className="vd-page-heading">Citizen User Profile</h1>

                    <div className="vd-top-actions">
                        <button className="vd-circle-btn" title="Notifications" style={{ position: "relative" }}>
                            <FiBell />
                            <span style={{ position: "absolute", top: "10px", right: "10px", width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444" }}></span>
                        </button>

                        <div className="vd-user-profile-pill">
                            {profileImagePreview ? (
                                <img src={profileImagePreview} alt="User Avatar" className="vd-user-avatar" style={{ objectFit: "cover" }} />
                            ) : (
                                <div className="vd-user-avatar">{getInitial(userName)}</div>
                            )}
                            <div className="vd-user-info">
                                <span className="vd-user-name">{userName}</span>
                            </div>
                            <FiChevronDown style={{ color: "#718096", fontSize: "0.9rem", marginLeft: "0.2rem" }} />
                        </div>
                    </div>
                </div>

                {/* Success Alert Message */}
                {successMessage && (
                    <div className="profile-success-alert">
                        <FiCheckCircle style={{ fontSize: "1.25rem" }} />
                        <span>{successMessage}</span>
                    </div>
                )}

                {loading ? (
                    <div className="profile-state-container">
                        <div className="profile-spinner"></div>
                        <h3 style={{ fontFamily: "Plus Jakarta Sans, sans-serif", margin: "0.5rem 0 0 0", color: "#2d3748" }}>
                            Loading Profile Information...
                        </h3>
                        <p style={{ color: "#718096", fontSize: "0.875rem", margin: "0.25rem 0 0 0" }}>
                            Fetching your account & address details securely
                        </p>
                    </div>
                ) : error ? (
                    <div className="profile-state-container">
                        <FiAlertCircle style={{ fontSize: "2.5rem", color: "#e53e3e", marginBottom: "0.5rem" }} />
                        <h3 style={{ fontFamily: "Plus Jakarta Sans, sans-serif", margin: "0.5rem 0 0 0", color: "#e53e3e" }}>
                            {error}
                        </h3>
                        <p style={{ color: "#718096", fontSize: "0.875rem", margin: "0.5rem 0 1.25rem 0" }}>
                            Please check your server connection or try logging in again.
                        </p>
                        <button 
                            onClick={loadprofile} 
                            className="sidebar-promo-btn"
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", cursor: "pointer", border: "none" }}
                        >
                            <FiRefreshCw /> Retry Loading
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Profile Header Banner */}
                        <div className="profile-banner-card">
                            <div className="profile-banner-main">
                                {/* Profile Avatar with Camera Upload Overlay */}
                                <div className="profile-avatar-wrapper">
                                    {profileImagePreview ? (
                                        <img src={profileImagePreview} alt="Profile" className="profile-avatar-large profile-avatar-img" />
                                    ) : (
                                        <div className="profile-avatar-large">
                                            {getInitial(userName)}
                                        </div>
                                    )}
                                    <button 
                                        type="button" 
                                        className="avatar-edit-overlay" 
                                        title="Change Profile Picture"
                                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                    >
                                        <FiCamera />
                                    </button>
                                </div>

                                <div className="profile-banner-info">
                                    <h2>{userName}</h2>
                                    <div className="profile-banner-tags">
                                        <span className="profile-tag verified">
                                            <FiCheckCircle /> Verified Eco Citizen
                                        </span>
                                        {profile?.email && (
                                            <span className="profile-tag email">
                                                <FiMail /> {profile.email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Header Edit / Save Actions */}
                            <div className="profile-actions-group">
                                {isEditing ? (
                                    <>
                                        <button 
                                            onClick={handleCancelEdit} 
                                            className="profile-btn secondary"
                                            disabled={saving}
                                        >
                                            <FiX /> Cancel
                                        </button>
                                        <button 
                                            onClick={handleSaveChanges} 
                                            className="profile-btn save"
                                            disabled={saving}
                                        >
                                            <FiSave /> {saving ? "Saving..." : "Save Changes"}
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => setIsEditing(true)} 
                                        className="profile-btn primary"
                                    >
                                        <FiEdit3 /> Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Main 2-Column Grid */}
                        <div className="vd-dashboard-grid">
                            {/* Left Column (Details / Edit Sections) */}
                            <div>
                                {/* Personal Information Card */}
                                <div className="panel-card">
                                    <div className="panel-header">
                                        <div>
                                            <h2 className="panel-title">Personal Identity Details</h2>
                                            <p className="panel-subtitle">Your basic registration information & demographics</p>
                                        </div>
                                    </div>

                                    <div className="profile-details-grid">
                                        {/* Read-Only First Name */}
                                        <div className="profile-field-box readonly-box">
                                            <div className="profile-field-header">
                                                <div className="profile-field-label-group">
                                                    <FiUser className="profile-field-icon" />
                                                    <span>First Name</span>
                                                    <FiLock className="readonly-lock-icon" title="First name cannot be modified" />
                                                </div>
                                            </div>
                                            <p className="profile-field-value">
                                                {profile?.firstName || "Not Specified"}
                                            </p>
                                        </div>

                                        {/* Read-Only Last Name */}
                                        <div className="profile-field-box readonly-box">
                                            <div className="profile-field-header">
                                                <div className="profile-field-label-group">
                                                    <FiUser className="profile-field-icon" />
                                                    <span>Last Name</span>
                                                    <FiLock className="readonly-lock-icon" title="Last name cannot be modified" />
                                                </div>
                                            </div>
                                            <p className="profile-field-value">
                                                {profile?.lastName || "Not Specified"}
                                            </p>
                                        </div>

                                        {/* Editable Gender */}
                                        <div className={`profile-field-box ${isEditing ? "editing" : ""}`}>
                                            <div className="profile-field-header">
                                                <div className="profile-field-label-group">
                                                    <FiUser className="profile-field-icon" />
                                                    <span>Gender</span>
                                                </div>
                                            </div>
                                            {isEditing ? (
                                                <>
                                                    <select 
                                                        className="profile-select"
                                                        value={editForm.gender} 
                                                        onChange={(e) => handleInputChange("gender", e.target.value)}
                                                    >
                                                        <option value="">Select Gender</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                    {formErrors.gender && <span className="profile-field-error">{formErrors.gender}</span>}
                                                </>
                                            ) : (
                                                <p className={`profile-field-value ${!profile?.gender ? "empty" : ""}`}>
                                                    {profile?.gender || "Not Specified"}
                                                </p>
                                            )}
                                        </div>

                                        {/* Editable Date of Birth */}
                                        <div className={`profile-field-box ${isEditing ? "editing" : ""}`}>
                                            <div className="profile-field-header">
                                                <div className="profile-field-label-group">
                                                    <FiCalendar className="profile-field-icon" />
                                                    <span>Date of Birth</span>
                                                </div>
                                            </div>
                                            {isEditing ? (
                                                <>
                                                    <input 
                                                        type="date"
                                                        className="profile-input"
                                                        value={editForm.dateOfBirth}
                                                        onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                                                    />
                                                    {formErrors.dateOfBirth && <span className="profile-field-error">{formErrors.dateOfBirth}</span>}
                                                </>
                                            ) : (
                                                <p className={`profile-field-value ${!profile?.dateOfBirth ? "empty" : ""}`}>
                                                    {formatDate(profile?.dateOfBirth) || "Not Specified"}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Details Card */}
                                <div className="panel-card">
                                    <div className="panel-header">
                                        <div>
                                            <h2 className="panel-title">Contact Channels</h2>
                                            <p className="panel-subtitle">Primary email and phone number linked to notifications</p>
                                        </div>
                                    </div>

                                    <div className="profile-details-grid">
                                        {/* Editable Email */}
                                        <div className={`profile-field-box ${isEditing ? "editing" : ""}`}>
                                            <div className="profile-field-header">
                                                <div className="profile-field-label-group">
                                                    <FiMail className="profile-field-icon" />
                                                    <span>Email Address</span>
                                                </div>
                                            </div>
                                            {isEditing ? (
                                                <>
                                                    <input 
                                                        type="email"
                                                        className="profile-input"
                                                        value={editForm.email}
                                                        placeholder="e.g. user@gmail.com"
                                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                                    />
                                                    {formErrors.email && <span className="profile-field-error">{formErrors.email}</span>}
                                                </>
                                            ) : (
                                                <p className={`profile-field-value ${!profile?.email ? "empty" : ""}`}>
                                                    {profile?.email || "Not Specified"}
                                                </p>
                                            )}
                                        </div>

                                        {/* Editable Phone Number */}
                                        <div className={`profile-field-box ${isEditing ? "editing" : ""}`}>
                                            <div className="profile-field-header">
                                                <div className="profile-field-label-group">
                                                    <FiPhone className="profile-field-icon" />
                                                    <span>Phone Number</span>
                                                </div>
                                            </div>
                                            {isEditing ? (
                                                <>
                                                    <input 
                                                        type="tel"
                                                        className="profile-input"
                                                        value={editForm.phoneNumber}
                                                        placeholder="10-digit mobile number"
                                                        onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                                                    />
                                                    {formErrors.phoneNumber && <span className="profile-field-error">{formErrors.phoneNumber}</span>}
                                                </>
                                            ) : (
                                                <p className={`profile-field-value ${!profile?.phoneNumber ? "empty" : ""}`}>
                                                    {profile?.phoneNumber || "Not Specified"}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Address Details Card */}
                                <div className="panel-card">
                                    <div className="panel-header">
                                        <div>
                                            <h2 className="panel-title">Registered Location & Address</h2>
                                            <p className="panel-subtitle">Default home pickup location for scheduled e-waste collection</p>
                                        </div>
                                    </div>

                                    <div className="profile-details-grid">
                                        {/* Editable Address */}
                                        <div className={`profile-field-box ${isEditing ? "editing" : ""}`} style={{ gridColumn: "1 / -1" }}>
                                            <div className="profile-field-header">
                                                <div className="profile-field-label-group">
                                                    <FiMapPin className="profile-field-icon" />
                                                    <span>Address</span>
                                                </div>
                                            </div>
                                            {isEditing ? (
                                                <>
                                                    <input 
                                                        type="text"
                                                        className="profile-input"
                                                        value={editForm.address}
                                                        placeholder="House No, Street Name, Area"
                                                        onChange={(e) => handleInputChange("address", e.target.value)}
                                                    />
                                                    {formErrors.address && <span className="profile-field-error">{formErrors.address}</span>}
                                                </>
                                            ) : (
                                                <p className={`profile-field-value ${!profile?.address ? "empty" : ""}`}>
                                                    {profile?.address || "No address on file"}
                                                </p>
                                            )}
                                        </div>

                                        {/* Read-Only City */}
                                        <div className="profile-field-box readonly-box">
                                            <div className="profile-field-header">
                                                <div className="profile-field-label-group">
                                                    <FiNavigation className="profile-field-icon" />
                                                    <span>City</span>
                                                    <FiLock className="readonly-lock-icon" title="City cannot be modified" />
                                                </div>
                                            </div>
                                            <p className="profile-field-value">
                                                {profile?.city || "Not Specified"}
                                            </p>
                                        </div>

                                        {/* Read-Only District */}
                                        <div className="profile-field-box readonly-box">
                                            <div className="profile-field-header">
                                                <div className="profile-field-label-group">
                                                    <FiGlobe className="profile-field-icon" />
                                                    <span>District</span>
                                                    <FiLock className="readonly-lock-icon" title="District cannot be modified" />
                                                </div>
                                            </div>
                                            <p className="profile-field-value">
                                                {profile?.district || "Not Specified"}
                                            </p>
                                        </div>

                                        {/* Read-Only State */}
                                        <div className="profile-field-box readonly-box">
                                            <div className="profile-field-header">
                                                <div className="profile-field-label-group">
                                                    <FiGlobe className="profile-field-icon" />
                                                    <span>State</span>
                                                    <FiLock className="readonly-lock-icon" title="State cannot be modified" />
                                                </div>
                                            </div>
                                            <p className="profile-field-value">
                                                {profile?.state || "Not Specified"}
                                            </p>
                                        </div>

                                        {/* Read-Only Pincode */}
                                        <div className="profile-field-box readonly-box">
                                            <div className="profile-field-header">
                                                <div className="profile-field-label-group">
                                                    <FiHash className="profile-field-icon" />
                                                    <span>Pincode</span>
                                                    <FiLock className="readonly-lock-icon" title="Pincode cannot be modified" />
                                                </div>
                                            </div>
                                            <p className="profile-field-value">
                                                {profile?.pincode || "Not Specified"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column (Account Status & Quick Actions) */}
                            <div className="vd-appointments-panel">
                                <div>
                                    <h3 className="vd-panel-header-title">Account Security & Status</h3>

                                    <div style={{ marginBottom: "1.5rem" }}>
                                        <div className="profile-stat-item">
                                            <span className="profile-stat-label">
                                                <FiShield style={{ color: "#059669" }} /> Account Status
                                            </span>
                                            <span className="status-pill status-completed">Active</span>
                                        </div>

                                        <div className="profile-stat-item">
                                            <span className="profile-stat-label">
                                                <FiAward style={{ color: "#d97706" }} /> Eco Level
                                            </span>
                                            <span className="profile-stat-val">Gold Recycler</span>
                                        </div>
                                    </div>

                                    {/* Change Password UI Step 1 (Current Password) -> Step 2 (2 New Password Fields) */}
                                    {!showPasswordSection ? (
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                handleResetPasswordForm();
                                                setShowPasswordSection(true);
                                            }} 
                                            className="profile-btn secondary"
                                            style={{ width: "100%", justifyContent: "center", marginBottom: "1.5rem" }}
                                        >
                                            <FiKey /> Change Password
                                        </button>
                                    ) : (
                                        <div className="password-change-card">
                                            <div className="password-card-header">
                                                <div className="password-card-title-group">
                                                    <FiKey className="password-card-icon" />
                                                    <span>{passwordStep === 1 ? "Verify Current Password" : "Set New Password"}</span>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    className="password-close-btn" 
                                                    onClick={handleResetPasswordForm}
                                                    title="Close Password Form"
                                                >
                                                    <FiX />
                                                </button>
                                            </div>

                                            {/* Error Alert Message */}
                                            {passwordError && (
                                                <div style={{
                                                    background: "#fef2f2",
                                                    border: "1px solid #fecaca",
                                                    color: "#dc2626",
                                                    padding: "0.65rem 0.85rem",
                                                    borderRadius: "10px",
                                                    fontSize: "0.8rem",
                                                    fontWeight: "600",
                                                    marginBottom: "0.85rem",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem"
                                                }}>
                                                    <FiAlertCircle style={{ flexShrink: 0 }} />
                                                    <span>{passwordError}</span>
                                                </div>
                                            )}

                                            {/* STEP 1: Enter Current Password */}
                                            {passwordStep === 1 ? (
                                                <form onSubmit={handleVerifyCurrentPassword} className="password-fields-group">
                                                    <p style={{ fontSize: "0.825rem", color: "#475569", margin: "0 0 0.4rem 0" }}>
                                                        Enter your current password to continue:
                                                    </p>

                                                    <div className="password-field-item">
                                                        <label className="password-field-label">
                                                            <FiLock className="field-icon" /> Current Password
                                                        </label>
                                                        <div className="password-input-wrapper">
                                                            <input 
                                                                type={showCurrentPassword ? "text" : "password"}
                                                                className="profile-input"
                                                                placeholder="Enter current password"
                                                                value={currentPasswordInput}
                                                                onChange={(e) => {
                                                                    setCurrentPasswordInput(e.target.value);
                                                                    if (passwordError) setPasswordError("");
                                                                }}
                                                            />
                                                            <button 
                                                                type="button" 
                                                                className="password-eye-toggle"
                                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                                tabIndex="-1"
                                                            >
                                                                {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="password-actions-group">
                                                        <button 
                                                            type="button" 
                                                            className="profile-btn secondary"
                                                            style={{ flex: 1, padding: "0.55rem 0.85rem", fontSize: "0.8rem", justifyContent: "center" }}
                                                            onClick={handleResetPasswordForm}
                                                            disabled={passwordLoading}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button 
                                                            type="submit" 
                                                            className="profile-btn save"
                                                            style={{ flex: 1.2, padding: "0.55rem 0.85rem", fontSize: "0.8rem", justifyContent: "center" }}
                                                            disabled={passwordLoading}
                                                        >
                                                            {passwordLoading ? "Verifying..." : "Verify Password"}
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                /* STEP 2: Current password is correct -> Show 2 input fields to update password */
                                                <form onSubmit={handleUpdateNewPassword} className="password-fields-group">
                                                    <div style={{
                                                        background: "#ecfdf5",
                                                        border: "1px solid #a7f3d0",
                                                        color: "#047857",
                                                        padding: "0.5rem 0.75rem",
                                                        borderRadius: "8px",
                                                        fontSize: "0.785rem",
                                                        fontWeight: "600",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.4rem",
                                                        marginBottom: "0.35rem"
                                                    }}>
                                                        <FiCheckCircle style={{ flexShrink: 0 }} />
                                                        <span>Current password verified! Enter your new password below.</span>
                                                    </div>

                                                    {/* Field 1: New Password */}
                                                    <div className="password-field-item">
                                                        <label className="password-field-label">
                                                            <FiLock className="field-icon" /> New Password
                                                        </label>
                                                        <div className="password-input-wrapper">
                                                            <input 
                                                                type={showNewPassword ? "text" : "password"}
                                                                className="profile-input"
                                                                placeholder="Enter new password"
                                                                value={newPasswordInput}
                                                                onChange={(e) => {
                                                                    setNewPasswordInput(e.target.value);
                                                                    if (passwordError) setPasswordError("");
                                                                }}
                                                            />
                                                            <button 
                                                                type="button" 
                                                                className="password-eye-toggle"
                                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                                tabIndex="-1"
                                                            >
                                                                {showNewPassword ? <FiEyeOff /> : <FiEye />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Field 2: Confirm New Password */}
                                                    <div className="password-field-item">
                                                        <label className="password-field-label">
                                                            <FiLock className="field-icon" /> Confirm New Password
                                                        </label>
                                                        <div className="password-input-wrapper">
                                                            <input 
                                                                type={showConfirmPassword ? "text" : "password"}
                                                                className="profile-input"
                                                                placeholder="Re-enter new password"
                                                                value={confirmPasswordInput}
                                                                onChange={(e) => {
                                                                    setConfirmPasswordInput(e.target.value);
                                                                    if (passwordError) setPasswordError("");
                                                                }}
                                                            />
                                                            <button 
                                                                type="button" 
                                                                className="password-eye-toggle"
                                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                tabIndex="-1"
                                                            >
                                                                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="password-actions-group">
                                                        <button 
                                                            type="button" 
                                                            className="profile-btn secondary"
                                                            style={{ flex: 1, padding: "0.55rem 0.85rem", fontSize: "0.8rem", justifyContent: "center" }}
                                                            onClick={handleResetPasswordForm}
                                                            disabled={passwordLoading}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button 
                                                            type="submit" 
                                                            className="profile-btn save"
                                                            style={{ flex: 1.2, padding: "0.55rem 0.85rem", fontSize: "0.8rem", justifyContent: "center" }}
                                                            disabled={passwordLoading}
                                                        >
                                                            {passwordLoading ? "Updating..." : "Update Password"}
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    )}

                                    <h3 className="vd-panel-header-title" style={{ marginTop: "1.75rem" }}>Quick Actions</h3>
                                    
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                        <Link 
                                            to="/citizen/pickup" 
                                            className="category-card" 
                                            style={{ margin: 0, padding: "0.85rem 1rem" }}
                                        >
                                            <div className="cat-icon-badge" style={{ width: "36px", height: "36px", fontSize: "1rem" }}>
                                                <FiPlusCircle />
                                            </div>
                                            <div className="cat-info">
                                                <h3 style={{ fontSize: "0.875rem" }}>Schedule Pickup</h3>
                                                <p style={{ margin: 0, fontSize: "0.725rem" }}>Request e-waste collection</p>
                                            </div>
                                        </Link>

                                        <Link 
                                            to="/view-device" 
                                            className="category-card" 
                                            style={{ margin: 0, padding: "0.85rem 1rem" }}
                                        >
                                            <div className="cat-icon-badge" style={{ width: "36px", height: "36px", fontSize: "1rem" }}>
                                                <FiBox />
                                            </div>
                                            <div className="cat-info">
                                                <h3 style={{ fontSize: "0.875rem" }}>My Devices</h3>
                                                <p style={{ margin: 0, fontSize: "0.725rem" }}>View registered items</p>
                                            </div>
                                        </Link>

                                        <Link 
                                            to="/citizen/rewards" 
                                            className="category-card" 
                                            style={{ margin: 0, padding: "0.85rem 1rem" }}
                                        >
                                            <div className="cat-icon-badge" style={{ width: "36px", height: "36px", fontSize: "1rem" }}>
                                                <FiAward />
                                            </div>
                                            <div className="cat-info">
                                                <h3 style={{ fontSize: "0.875rem" }}>Eco Rewards</h3>
                                                <p style={{ margin: 0, fontSize: "0.725rem" }}>Check point balance</p>
                                            </div>
                                        </Link>
                                    </div>
                                </div>

                                <Link to="/citizen" className="vd-see-more-btn" style={{ marginTop: "2rem" }}>
                                    ← Back to Citizen Dashboard
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export default Manage_userprofile;