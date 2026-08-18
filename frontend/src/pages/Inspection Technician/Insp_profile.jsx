import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    validate_password,
    validate_confirm_password
} from "../../utils/validation";
import {
    FiUser,
    FiMail,
    FiPhone,
    FiMapPin,
    FiCalendar,
    FiShield,
    FiCpu,
    FiAward,
    FiCheck,
    FiCamera,
    FiEdit3,
    FiSave,
    FiX,
    FiCheckCircle,
    FiFileText,
    FiEye,
    FiEyeOff,
    FiKey,
    FiLock,
    FiExternalLink,
    FiRefreshCw,
    FiAlertCircle,
    FiBriefcase,
    FiBell,
    FiLogOut
} from "react-icons/fi";
import "./Insp_profile.css";

function Insp_profile() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    // Profile Photo Upload State
    const [selectedFile, setSelectedFile] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        dob: "",
        gender: "",
        address: "",
        city: "",
        district: "",
        state: "",
        pincode: "",
        specialization: "",
        experienceYears: 0
    });

    // Password Change UI & Verification state
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [passwordStep, setPasswordStep] = useState(1); // 1 = Current Password, 2 = New & Confirm Passwords
    const [currentPasswordInput, setCurrentPasswordInput] = useState("");
    const [newPasswordInput, setNewPasswordInput] = useState("");
    const [confirmPasswordInput, setConfirmPasswordInput] = useState("");

    const [passwordFormErrors, setPasswordFormErrors] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

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
        setPasswordFormErrors({
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
        });
        setPasswordLoading(false);
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    // Live validation input handlers using validation.js
    const handleCurrentPasswordChange = (val) => {
        setCurrentPasswordInput(val);
        if (passwordError) setPasswordError("");
        setPasswordFormErrors(prev => ({
            ...prev,
            currentPassword: val ? "" : "Current password is required"
        }));
    };

    const handleNewPasswordChange = (val) => {
        setNewPasswordInput(val);
        if (passwordError) setPasswordError("");
        const err = validate_password(val, true);
        const confirmErr = confirmPasswordInput ? validate_confirm_password(confirmPasswordInput, val, true) : "";
        setPasswordFormErrors(prev => ({
            ...prev,
            newPassword: err,
            confirmPassword: confirmErr
        }));
    };

    const handleConfirmPasswordChange = (val) => {
        setConfirmPasswordInput(val);
        if (passwordError) setPasswordError("");
        const err = validate_confirm_password(val, newPasswordInput, true);
        setPasswordFormErrors(prev => ({
            ...prev,
            confirmPassword: err
        }));
    };

    // Step 1: Verify current password with backend
    const handleVerifyCurrentPassword = async (e) => {
        e?.preventDefault();
        if (!currentPasswordInput) {
            setPasswordFormErrors(prev => ({ ...prev, currentPassword: "Current password is required" }));
            return;
        }

        setPasswordLoading(true);
        setPasswordError("");

        const token = localStorage.getItem("token");

        try {
            const response = await axios.post(
                "https://localhost:7102/api/Technician/verify-password",
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
                setPasswordFormErrors({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                });
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
        const newErr = validate_password(newPasswordInput, false);
        const confirmErr = validate_confirm_password(confirmPasswordInput, newPasswordInput, false);

        if (newErr || confirmErr) {
            setPasswordFormErrors({
                currentPassword: "",
                newPassword: newErr,
                confirmPassword: confirmErr
            });
            return;
        }

        setPasswordLoading(true);
        setPasswordError("");

        const token = localStorage.getItem("token");

        try {
            const response = await axios.post(
                "https://localhost:7102/api/Technician/change-password",
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

    // Document Modal State
    const [activeDoc, setActiveDoc] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found, redirecting to login.");
            navigate("/");
            return;
        }
        loadProfile(token);
        fetchUnreadNotificationsCount(token);
    }, [navigate]);

    const fetchUnreadNotificationsCount = async (token) => {
        try {
            const response = await axios.get(
                "https://localhost:7102/api/Notificationcon/my_notifications",
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            if (Array.isArray(response.data)) {
                const unread = response.data.filter((n) => !n.isRead).length;
                setUnreadNotifCount(unread);
            }
        } catch (err) {
            console.error("Error fetching notification count:", err);
        }
    };

    const getMediaUrl = (filename, folderName = "") => {
        if (!filename) return null;
        if (filename.startsWith("http://") || filename.startsWith("https://") || filename.startsWith("blob:")) {
            return filename;
        }
        const cleanName = filename.replace(/^uploads[\\/]/, "").replace(/^[\\/]/, "");
        if (cleanName.includes("/") || cleanName.includes("\\")) {
            return `https://localhost:7102/uploads/${cleanName.replace("\\", "/")}`;
        }

        let folder = folderName;
        if (!folder || folder === "profile" || folder === "Profile") folder = "ProfilePhotos";

        return `https://localhost:7102/uploads/technicians/${folder}/${cleanName}`;
    };

    const loadProfile = async (tokenOverride) => {
        try {
            setLoading(true);
            setError("");

            const token = tokenOverride || localStorage.getItem("token");
            if (!token) {
                navigate("/");
                return;
            }

            const response = await axios.get(
                "https://localhost:7102/api/Technician/myprofile",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = response.data || {};
            console.log("Inspection Technician Profile Data:", data);
            setProfile(data);

            const fName = data.FirstName || data.firstName || "";
            const lName = data.LastName || data.lastName || "";

            let dobStr = "";
            const rawDob = data.DateOfBirth || data.dateOfBirth;
            if (rawDob) {
                try {
                    dobStr = new Date(rawDob).toISOString().split("T")[0];
                } catch {
                    dobStr = String(rawDob).split("T")[0];
                }
            }

            setEditForm({
                firstName: fName,
                lastName: lName,
                phoneNumber: data.PhoneNumber || data.phoneNumber || "",
                dob: dobStr,
                gender: data.Gender || data.gender || "Male",
                address: data.Address || data.address || "",
                city: data.City || data.city || "",
                district: data.District || data.district || "",
                state: data.State || data.state || "",
                pincode: data.PinCode || data.pinCode || data.pincode || "",
                specialization: data.Specialization || data.specialization || "E-Waste Hardware Testing",
                experienceYears: data.ExperienceYears || data.experienceYears || 3
            });

            const img = data.ProfilePhoto || data.profilePhoto;
            if (img) {
                setProfileImagePreview(getMediaUrl(img, "ProfilePhotos"));
            }
        } catch (err) {
            console.error("Unable to load technician profile:", err);
            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
                localStorage.clear();
                setTimeout(() => navigate("/"), 2000);
            } else {
                setError(
                    err.response?.data?.message ||
                        "Failed to retrieve technician profile details from server."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // Profile Photo Selection Handler
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file (JPG, PNG, WEBP).");
            return;
        }

        setSelectedFile(file);
        const previewUrl = URL.createObjectURL(file);
        setProfileImagePreview(previewUrl);
        setIsEditing(true);
    };

    const handleFormInputChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setSelectedFile(null);
        setError("");
        setSuccessMessage("");
        const img = profile?.ProfilePhoto || profile?.profilePhoto;
        if (img) {
            setProfileImagePreview(getMediaUrl(img, "profile"));
        } else {
            setProfileImagePreview(null);
        }
    };

    // Save Profile Changes Handler
    const handleSaveChanges = async () => {
        setSaving(true);
        setError("");
        setSuccessMessage("");

        const token = localStorage.getItem("token");

        const formData = new FormData();
        formData.append("FirstName", editForm.firstName);
        formData.append("LastName", editForm.lastName);
        formData.append("PhoneNumber", editForm.phoneNumber);
        if (editForm.dob) formData.append("DateOfBirth", editForm.dob);
        formData.append("Gender", editForm.gender);
        formData.append("Address", editForm.address);
        formData.append("City", editForm.city);
        formData.append("District", editForm.district);
        formData.append("State", editForm.state);
        formData.append("PinCode", editForm.pincode);
        formData.append("Specialization", editForm.specialization);
        formData.append("ExperienceYears", editForm.experienceYears);

        if (selectedFile) {
            formData.append("ProfilePhoto", selectedFile);
        }

        try {
            await axios.post(
                "https://localhost:7102/api/Technician/update-profile",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setSuccessMessage("Technician profile updated successfully!");
            setIsEditing(false);
            setSelectedFile(null);

            if (editForm.firstName) {
                localStorage.setItem("firstName", editForm.firstName);
            }

            await loadProfile(token);
            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            console.error("Profile update error:", err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || "Failed to update profile changes.";
            setError(errMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
    };

    if (loading) {
        return (
            <div className="tech-profile-layout">
                <Sidebar />
                <div className="tech-profile-main">
                    <div className="tech-skeleton-card">
                        <div className="tech-skeleton-line" style={{ width: "40%", height: "30px" }}></div>
                        <div className="tech-skeleton-line" style={{ width: "60%" }}></div>
                        <div className="tech-skeleton-line" style={{ width: "100%", height: "140px", marginTop: "1rem" }}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="tech-profile-layout">
                <Sidebar />
                <div className="tech-profile-main">
                    <div className="tech-error-container">
                        <div className="tech-error-icon">
                            <FiAlertCircle />
                        </div>
                        <h2 className="tech-error-title">Profile Load Error</h2>
                        <p className="tech-error-msg">{error}</p>
                        <button className="tech-retry-btn" onClick={() => loadProfile()}>
                            <FiRefreshCw style={{ marginRight: "6px" }} /> Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const name = `${profile?.FirstName || profile?.firstName || editForm.firstName} ${profile?.LastName || profile?.lastName || editForm.lastName}`.trim() || "Inspection Officer";
    const email = profile?.Email || profile?.email || "N/A";
    const phone = profile?.PhoneNumber || profile?.phoneNumber || editForm.phoneNumber || "N/A";
    const dob = (profile?.DateOfBirth || profile?.dateOfBirth) ? new Date(profile.DateOfBirth || profile.dateOfBirth).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A";
    const gender = profile?.Gender || profile?.gender || editForm.gender || "N/A";

    const employeeId = profile?.EmployeeId || profile?.employeeId || "TECH-1082";
    const centerName = profile?.InspectionCenterName || profile?.inspectionCenterName || "EcoCycle Primary Diagnostics Hub";
    const jobTitle = profile?.JobTitle || profile?.jobTitle || "Senior Hardware Inspector";
    const expYears = profile?.ExperienceYears ?? profile?.experienceYears ?? editForm.experienceYears ?? 3;
    const specialization = profile?.Specialization || profile?.specialization || editForm.specialization || "E-Waste Testing & Refurbishment";

    const certNo = profile?.CertificateNumber || profile?.certificateNumber || "CERT-EV-8849";
    const certInstitute = profile?.IssuingInstitute || profile?.issuingInstitute || "National E-Waste Compliance Institute";

    const certIssueDate = (profile?.CertificateIssueDate || profile?.certificateIssueDate)
        ? new Date(profile.CertificateIssueDate || profile.certificateIssueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : "N/A";

    const certExpiryDate = (profile?.CertificateExpiryDate || profile?.certificateExpiryDate)
        ? new Date(profile.CertificateExpiryDate || profile.certificateExpiryDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : "Lifetime / No Expiry";

    const govIdType = profile?.GovernmentIdType || profile?.governmentIdType || "Aadhaar Card";
    const govIdNo = profile?.GovernmentIdNumber || profile?.governmentIdNumber || "XXXX-XXXX-8921";

    const address = profile?.Address || profile?.address || editForm.address || "N/A";
    const city = profile?.City || profile?.city || editForm.city || "N/A";
    const district = profile?.District || profile?.district || editForm.district || "N/A";
    const state = profile?.State || profile?.state || editForm.state || "N/A";
    const pincode = profile?.PinCode || profile?.pinCode || profile?.pincode || editForm.pincode || "N/A";

    const avatarInitial = name.charAt(0).toUpperCase();

    let govIdFolder = "GovernmentIds";
    if (govIdType.toLowerCase().includes("aadhaar")) govIdFolder = "GovernmentIds/Aadhaar";
    else if (govIdType.toLowerCase().includes("pan")) govIdFolder = "GovernmentIds/PAN";
    else if (govIdType.toLowerCase().includes("licence") || govIdType.toLowerCase().includes("license")) govIdFolder = "GovernmentIds/DrivingLicence";
    else if (govIdType.toLowerCase().includes("passport")) govIdFolder = "GovernmentIds/Passport";

    const documentsList = [
        {
            title: "Government Identification Proof",
            filename: profile?.GovernmentIdFile || profile?.governmentIdFile,
            folder: govIdFolder,
            icon: <FiShield />
        },
        {
            title: "Employee ID Card",
            filename: profile?.EmployeeIdCard || profile?.employeeIdCard,
            folder: "EmployeeIdCards",
            icon: <FiAward />
        },
        {
            title: "Technical Qualification Certificate",
            filename: profile?.TechnicalCertificate || profile?.technicalCertificate,
            folder: "TechnicalCertificates",
            icon: <FiCpu />
        }
    ];

    return (
        <div className="tech-profile-layout">
            <Sidebar />

            <div className="tech-profile-main">
                {/* Dedicated Technician Header Topbar */}
                <header className="tech-header-topbar">
                    <div className="tech-topbar-left">
                        <div className="tech-topbar-icon-badge">
                            <FiCpu />
                        </div>
                        <div className="tech-topbar-title-group">
                            <h1>Technician Profile & Credentials</h1>
                            <p>EcoCycle Diagnostic Station • Certified Inspection Officer</p>
                        </div>
                    </div>

                    <div className="tech-topbar-right">
                        <Link to="/technician-notification" className="tech-notif-bell-btn" title="Notification Inbox">
                            <FiBell />
                            {unreadNotifCount > 0 && <span className="tech-notif-badge-dot"></span>}
                        </Link>

                        <div className="tech-user-pill">
                            <div className="tech-user-pill-avatar">{avatarInitial}</div>
                            <div className="tech-user-pill-info">
                                <span className="tech-user-pill-name">{name.split(" ")[0]}</span>
                                <span className="tech-user-pill-role">Inspector</span>
                            </div>
                        </div>

                        <button className="tech-signout-btn" onClick={handleLogout} title="Sign Out">
                            <FiLogOut />
                        </button>
                    </div>
                </header>

                {/* Hidden File Input for Avatar Photo Upload */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    style={{ display: "none" }}
                />

                {/* Success Banner */}
                {successMessage && (
                    <div className="tech-success-alert">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <FiCheckCircle style={{ fontSize: "1.2rem" }} />
                            <span>{successMessage}</span>
                        </div>
                        <button onClick={() => setSuccessMessage("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>
                            <FiX />
                        </button>
                    </div>
                )}

                {/* Error Banner */}
                {error && profile && (
                    <div className="tech-success-alert" style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#ef4444" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <FiAlertCircle style={{ fontSize: "1.2rem" }} />
                            <span>{error}</span>
                        </div>
                        <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}>
                            <FiX />
                        </button>
                    </div>
                )}

                {/* Technician Profile Hero Card */}
                <div className="tech-hero-card">
                    <div className="tech-hero-banner">
                        <div className="tech-hero-banner-pattern"></div>
                    </div>
                    <div className="tech-hero-body">
                        <div className="tech-hero-profile-wrap">
                            <div className="tech-avatar-frame">
                                {profileImagePreview ? (
                                    <img
                                        src={profileImagePreview}
                                        alt={name}
                                        className="tech-avatar-img"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.style.display = "none";
                                            e.target.nextSibling.style.display = "flex";
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="tech-avatar-fallback"
                                    style={{ display: profileImagePreview ? "none" : "flex" }}
                                >
                                    {avatarInitial}
                                </div>

                                {/* Camera Upload Button Overlay */}
                                <button
                                    type="button"
                                    className="tech-avatar-camera-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Upload new profile picture"
                                >
                                    <FiCamera />
                                </button>
                            </div>

                            <div className="tech-hero-info">
                                <div className="tech-hero-name-row">
                                    <h2 className="tech-hero-name">{name}</h2>
                                    
                                </div>
                                <div className="tech-hero-subtext">
                                    <span className="tech-subtext-item">
                                        <FiMail /> {email}
                                    </span>
                                    <span className="tech-subtext-item">
                                        <FiPhone /> {phone}
                                    </span>
                                    <span className="tech-subtext-item">
                                        <FiMapPin /> {city}, {state}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="tech-hero-actions">
                            {!isEditing ? (
                                <button
                                    type="button"
                                    className="tech-edit-btn"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <FiEdit3 /> Edit Profile
                                </button>
                            ) : (
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button
                                        type="button"
                                        className="tech-save-btn"
                                        onClick={handleSaveChanges}
                                        disabled={saving}
                                    >
                                        <FiSave /> {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button
                                        type="button"
                                        className="tech-cancel-btn"
                                        onClick={handleCancelEdit}
                                        disabled={saving}
                                    >
                                        <FiX /> Cancel
                                    </button>
                                </div>
                            )}

                            {!showPasswordSection && (
                                <button
                                    type="button"
                                    className="tech-change-pwd-btn"
                                    onClick={() => {
                                        handleResetPasswordForm();
                                        setShowPasswordSection(true);
                                    }}
                                >
                                    <FiKey /> Change Password
                                </button>
                            )}

                            <div className="tech-id-badge-btn">
                                <FiAward />
                                <span>Employee ID: {employeeId}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Change Password Simple Card UI */}
                {showPasswordSection && (
                    <div className="password-change-card">
                        <div className="password-card-header">
                            <div className="password-card-title-group">
                                <FiKey className="password-card-icon" />
                                <h3 className="tech-card-title">
                                    {passwordStep === 1 ? "Verify Current Password" : "Set New Password"}
                                </h3>
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
                                    Enter your current password to proceed:
                                </p>

                                <div className="password-field-item">
                                    <label className="password-field-label">
                                        <FiLock className="field-icon" /> Current Password
                                    </label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            className="tech-input"
                                            placeholder="Enter current password"
                                            value={currentPasswordInput}
                                            onChange={(e) => handleCurrentPasswordChange(e.target.value)}
                                            autoFocus
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
                                    {passwordFormErrors.currentPassword && (
                                        <span style={{ color: "#ef4444", fontSize: "0.775rem", fontWeight: "600", marginTop: "0.25rem", display: "block" }}>
                                            {passwordFormErrors.currentPassword}
                                        </span>
                                    )}
                                </div>

                                <div className="password-actions-group">
                                    <button
                                        type="button"
                                        className="tech-cancel-btn"
                                        style={{ flex: 1, justifyContent: "center" }}
                                        onClick={handleResetPasswordForm}
                                        disabled={passwordLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="tech-save-btn"
                                        style={{ flex: 1.2, justifyContent: "center" }}
                                        disabled={passwordLoading}
                                    >
                                        {passwordLoading ? "Verifying..." : "Verify Password"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            /* STEP 2: Current password verified -> Enter New Password & Confirm Password */
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
                                            className="tech-input"
                                            placeholder="Enter new password"
                                            value={newPasswordInput}
                                            onChange={(e) => handleNewPasswordChange(e.target.value)}
                                            autoFocus
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
                                    {passwordFormErrors.newPassword && (
                                        <span style={{ color: "#ef4444", fontSize: "0.775rem", fontWeight: "600", marginTop: "0.25rem", display: "block" }}>
                                            {passwordFormErrors.newPassword}
                                        </span>
                                    )}
                                </div>

                                {/* Field 2: Confirm New Password */}
                                <div className="password-field-item">
                                    <label className="password-field-label">
                                        <FiLock className="field-icon" /> Confirm New Password
                                    </label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="tech-input"
                                            placeholder="Re-enter new password"
                                            value={confirmPasswordInput}
                                            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
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
                                    {passwordFormErrors.confirmPassword && (
                                        <span style={{ color: "#ef4444", fontSize: "0.775rem", fontWeight: "600", marginTop: "0.25rem", display: "block" }}>
                                            {passwordFormErrors.confirmPassword}
                                        </span>
                                    )}
                                </div>

                                <div className="password-actions-group">
                                    <button
                                        type="button"
                                        className="tech-cancel-btn"
                                        style={{ flex: 1, justifyContent: "center" }}
                                        onClick={handleResetPasswordForm}
                                        disabled={passwordLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="tech-save-btn"
                                        style={{ flex: 1.2, justifyContent: "center" }}
                                        disabled={passwordLoading}
                                    >
                                        {passwordLoading ? "Updating..." : "Update Password"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* Hide lower sections when password is updating */}
                {!showPasswordSection && (
                    <>

                {/* Diagnostic Metrics Ribbon */}
                <div className="tech-metrics-grid">
                    <div className="tech-metric-card">
                        <div className="tech-metric-icon emerald">
                            <FiCpu />
                        </div>
                        <div className="tech-metric-text">
                            <div className="tech-metric-label">Diagnostic Hub</div>
                            <div className="tech-metric-val">{centerName}</div>
                        </div>
                    </div>

                    <div className="tech-metric-card">
                        <div className="tech-metric-icon blue">
                            <FiAward />
                        </div>
                        <div className="tech-metric-text">
                            <div className="tech-metric-label">Experience</div>
                            <div className="tech-metric-val">{expYears} Years</div>
                        </div>
                    </div>

                    <div className="tech-metric-card">
                        <div className="tech-metric-icon purple">
                            <FiBriefcase />
                        </div>
                        <div className="tech-metric-text">
                            <div className="tech-metric-label">Specialization</div>
                            <div className="tech-metric-val">{specialization}</div>
                        </div>
                    </div>

                    <div className="tech-metric-card">
                        <div className="tech-metric-icon amber">
                            <FiShield />
                        </div>
                        <div className="tech-metric-text">
                            <div className="tech-metric-label">Certification</div>
                            <div className="tech-metric-val">{certNo}</div>
                        </div>
                    </div>
                </div>

                {/* Details Section Grid */}
                <div className="tech-details-grid">
                    {/* Personal Information (Editable) */}
                    <div className="tech-card">
                        <div className="tech-card-header">
                            <div className="tech-card-title-group">
                                <div className="tech-card-icon emerald">
                                    <FiUser />
                                </div>
                                <div>
                                    <h3 className="tech-card-title">Personal Information</h3>
                                    <p className="tech-card-subtitle">Basic identity and contact profile</p>
                                </div>
                            </div>
                        </div>

                        <div className="tech-info-list">
                            <div className="tech-info-item">
                                <span className="tech-info-label">First Name</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="tech-input"
                                        value={editForm.firstName}
                                        onChange={(e) => handleFormInputChange("firstName", e.target.value)}
                                        placeholder="First Name"
                                    />
                                ) : (
                                    <span className="tech-info-value">{editForm.firstName || name}</span>
                                )}
                            </div>

                            <div className="tech-info-item">
                                <span className="tech-info-label">Last Name</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="tech-input"
                                        value={editForm.lastName}
                                        onChange={(e) => handleFormInputChange("lastName", e.target.value)}
                                        placeholder="Last Name"
                                    />
                                ) : (
                                    <span className="tech-info-value">{editForm.lastName || "N/A"}</span>
                                )}
                            </div>

                            <div className="tech-info-item">
                                <span className="tech-info-label">Email Address</span>
                                <input
                                    type="text"
                                    className="tech-input locked"
                                    value={email}
                                    disabled
                                    title="Email address is linked to your login account and cannot be modified."
                                />
                            </div>

                            <div className="tech-info-item">
                                <span className="tech-info-label">Phone Number</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="tech-input"
                                        value={editForm.phoneNumber}
                                        onChange={(e) => handleFormInputChange("phoneNumber", e.target.value)}
                                        placeholder="Phone Number"
                                    />
                                ) : (
                                    <span className="tech-info-value mono">{phone}</span>
                                )}
                            </div>

                            <div className="tech-info-item">
                                <span className="tech-info-label">Date of Birth</span>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        className="tech-input"
                                        value={editForm.dob}
                                        onChange={(e) => handleFormInputChange("dob", e.target.value)}
                                    />
                                ) : (
                                    <span className="tech-info-value">{dob}</span>
                                )}
                            </div>

                            <div className="tech-info-item">
                                <span className="tech-info-label">Gender</span>
                                {isEditing ? (
                                    <select
                                        className="tech-input"
                                        value={editForm.gender}
                                        onChange={(e) => handleFormInputChange("gender", e.target.value)}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                ) : (
                                    <span className="tech-info-value">{gender}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Residential & Hub Location (Editable) */}
                    <div className="tech-card">
                        <div className="tech-card-header">
                            <div className="tech-card-title-group">
                                <div className="tech-card-icon blue">
                                    <FiMapPin />
                                </div>
                                <div>
                                    <h3 className="tech-card-title">Residential & Hub Station</h3>
                                    <p className="tech-card-subtitle">Registered residential and primary testing station</p>
                                </div>
                            </div>
                        </div>

                        <div className="tech-info-list">
                            <div className="tech-info-item full-width">
                                <span className="tech-info-label">Street Address</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="tech-input"
                                        value={editForm.address}
                                        onChange={(e) => handleFormInputChange("address", e.target.value)}
                                        placeholder="Street Address"
                                    />
                                ) : (
                                    <span className="tech-info-value">{address}</span>
                                )}
                            </div>

                            <div className="tech-info-item">
                                <span className="tech-info-label">City / Hub</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="tech-input"
                                        value={editForm.city}
                                        onChange={(e) => handleFormInputChange("city", e.target.value)}
                                        placeholder="City"
                                    />
                                ) : (
                                    <span className="tech-info-value">{city}</span>
                                )}
                            </div>

                            <div className="tech-info-item">
                                <span className="tech-info-label">District</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="tech-input"
                                        value={editForm.district}
                                        onChange={(e) => handleFormInputChange("district", e.target.value)}
                                        placeholder="District"
                                    />
                                ) : (
                                    <span className="tech-info-value">{district}</span>
                                )}
                            </div>

                            <div className="tech-info-item">
                                <span className="tech-info-label">State</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="tech-input"
                                        value={editForm.state}
                                        onChange={(e) => handleFormInputChange("state", e.target.value)}
                                        placeholder="State"
                                    />
                                ) : (
                                    <span className="tech-info-value">{state}</span>
                                )}
                            </div>

                            <div className="tech-info-item">
                                <span className="tech-info-label">Pincode</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="tech-input"
                                        value={editForm.pincode}
                                        onChange={(e) => handleFormInputChange("pincode", e.target.value)}
                                        placeholder="Pincode"
                                    />
                                ) : (
                                    <span className="tech-info-value mono">{pincode}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Diagnostic Station & Role (Locked Admin Verified) */}
                    <div className="tech-card" style={{ background: "#fafafa" }}>
                        <div className="tech-card-header">
                            <div className="tech-card-title-group">
                                <div className="tech-card-icon purple">
                                    <FiBriefcase />
                                </div>
                                <div>
                                    <h3 className="tech-card-title">Diagnostic Center & Role</h3>
                                    <p className="tech-card-subtitle">Assigned testing facility and designation (Admin verified)</p>
                                </div>
                            </div>
                        </div>

                        <div className="tech-info-list">
                            <div className="tech-info-item">
                                <span className="tech-info-label">Employee ID</span>
                                <input
                                    type="text"
                                    className="tech-input locked mono"
                                    value={employeeId}
                                    disabled
                                    title="Employee ID is assigned by Admin and cannot be edited."
                                />
                            </div>

                            <div className="tech-info-item">
                                <span className="tech-info-label">Job Title</span>
                                <input
                                    type="text"
                                    className="tech-input locked"
                                    value={jobTitle}
                                    disabled
                                    title="Designation is verified by Admin."
                                />
                            </div>

                            <div className="tech-info-item full-width">
                                <span className="tech-info-label">Inspection Center Name</span>
                                <input
                                    type="text"
                                    className="tech-input locked"
                                    value={centerName}
                                    disabled
                                    title="Testing center is assigned by EcoCycle Administration."
                                />
                            </div>

                            <div className="tech-info-item">
                                <span className="tech-info-label">Primary Specialization</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="tech-input"
                                        value={editForm.specialization}
                                        onChange={(e) => handleFormInputChange("specialization", e.target.value)}
                                    />
                                ) : (
                                    <span className="tech-info-value">{specialization}</span>
                                )}
                            </div>

                            <div className="tech-info-item">
                                <span className="tech-info-label">Experience (Years)</span>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        className="tech-input"
                                        value={editForm.experienceYears}
                                        onChange={(e) => handleFormInputChange("experienceYears", e.target.value)}
                                    />
                                ) : (
                                    <span className="tech-info-value">{expYears} Years</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Certifications & Identification (Locked Admin Verified) */}
                    <div className="tech-card" style={{ background: "#fafafa" }}>
                        <div className="tech-card-header">
                            <div className="tech-card-title-group">
                                <div className="tech-card-icon amber">
                                    <FiShield />
                                </div>
                                <div>
                                    <h3 className="tech-card-title">Certifications & Gov. ID</h3>
                                    <p className="tech-card-subtitle">Verified technical license and identification</p>
                                </div>
                            </div>
                        </div>

                        <div className="tech-info-list">
                            <div className="tech-info-item">
                                <span className="tech-info-label">Government ID Type</span>
                                <input
                                    type="text"
                                    className="tech-input locked"
                                    value={govIdType}
                                    disabled
                                    title="Government ID type is verified during onboarding."
                                />
                            </div>

                            <div className="tech-info-item">
                                <span className="tech-info-label">Government ID Number</span>
                                <input
                                    type="text"
                                    className="tech-input locked mono"
                                    value={govIdNo}
                                    disabled
                                    title="Government ID number is government-verified."
                                />
                            </div>

                            <div className="tech-info-item full-width">
                                <span className="tech-info-label">Certificate Number</span>
                                <input
                                    type="text"
                                    className="tech-input locked mono"
                                    value={certNo}
                                    disabled
                                    title="Technical certificate number is verified."
                                />
                            </div>

                            <div className="tech-info-item full-width">
                                <span className="tech-info-label">Issuing Institute</span>
                                <input
                                    type="text"
                                    className="tech-input locked"
                                    value={certInstitute}
                                    disabled
                                    title="Issuing institute is verified during onboarding."
                                />
                            </div>

                            <div className="tech-info-item">
                                <span className="tech-info-label">Certificate Issue Date</span>
                                <input
                                    type="text"
                                    className="tech-input locked"
                                    value={certIssueDate}
                                    disabled
                                    title="Technical certificate issue date is verified."
                                />
                            </div>

                            <div className="tech-info-item">
                                <span className="tech-info-label">Certificate Expiry Date</span>
                                <input
                                    type="text"
                                    className="tech-input locked"
                                    value={certExpiryDate}
                                    disabled
                                    title="Technical certificate expiry date is verified."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Document Verification Vault */}
                <div className="tech-vault-card">
                    <div className="tech-card-header" style={{ marginBottom: "0.5rem" }}>
                        <div className="tech-card-title-group">
                            <div className="tech-card-icon slate">
                                <FiShield />
                            </div>
                            <div>
                                <h3 className="tech-card-title">Verification Vault & Uploaded Proofs</h3>
                                <p className="tech-card-subtitle">
                                    Official qualification documents submitted during technician onboarding (Admin Verified)
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="tech-vault-grid">
                        {documentsList.map((doc, idx) => {
                            const url = getMediaUrl(doc.filename, doc.folder);
                            const hasFile = Boolean(url);

                            return (
                                <div className="tech-doc-tile" key={idx}>
                                    <div className="tech-doc-left">
                                        <div className="tech-doc-icon-wrap">
                                            {doc.icon}
                                        </div>
                                        <div className="tech-doc-meta">
                                            <h4 className="tech-doc-name">{doc.title}</h4>
                                            {hasFile ? (
                                                <span className="tech-doc-status">
                                                    <FiCheckCircle /> Verified File Attached
                                                </span>
                                            ) : (
                                                <span className="tech-doc-status missing">
                                                    Not Provided
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {hasFile && (
                                        <button
                                            type="button"
                                            className="tech-doc-view-btn"
                                            onClick={() =>
                                                setActiveDoc({
                                                    title: doc.title,
                                                    url: url,
                                                    filename: doc.filename
                                                })
                                            }
                                        >
                                            <FiEye /> View
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                    </>
                )}
            </div>

            {/* Document Preview Lightbox Modal */}
            {activeDoc && (
                <div className="tech-modal-overlay" onClick={() => setActiveDoc(null)}>
                    <div
                        className="tech-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="tech-modal-header">
                            <h3 className="tech-modal-title">{activeDoc.title}</h3>
                            <button
                                type="button"
                                className="tech-modal-close"
                                onClick={() => setActiveDoc(null)}
                            >
                                <FiX />
                            </button>
                        </div>
                        <div className="tech-modal-body">
                            {activeDoc.url.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? (
                                <img
                                    src={activeDoc.url}
                                    alt={activeDoc.title}
                                    className="tech-modal-img"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.alt = "Failed to load document preview.";
                                    }}
                                />
                            ) : (
                                <div style={{ textAlign: "center", padding: "2rem" }}>
                                    <FiFileText style={{ fontSize: "3rem", color: "#059669" }} />
                                    <p style={{ marginTop: "1rem", color: "#475569" }}>
                                        Document File: <strong>{activeDoc.filename}</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="tech-modal-footer">
                            <a
                                href={activeDoc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tech-save-btn"
                                style={{ background: "#059669", color: "#ffffff", textDecoration: "none" }}
                            >
                                <FiExternalLink /> Open Original Document
                            </a>
                            <button
                                type="button"
                                className="tech-cancel-btn"
                                onClick={() => setActiveDoc(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Insp_profile;
