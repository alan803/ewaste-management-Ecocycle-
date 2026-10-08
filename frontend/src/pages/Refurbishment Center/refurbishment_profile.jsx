import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    validate_password,
    validate_confirm_password
} from "../../utils/validation";
import {
    FiCpu,
    FiMail,
    FiPhone,
    FiMapPin,
    FiCalendar,
    FiShield,
    FiTool,
    FiCheckCircle,
    FiRefreshCw,
    FiFileText,
    FiEye,
    FiEyeOff,
    FiKey,
    FiExternalLink,
    FiAlertCircle,
    FiX,
    FiAward,
    FiCheck,
    FiCamera,
    FiLock,
    FiEdit3,
    FiSave,
    FiTruck,
    FiUsers,
    FiBriefcase,
    FiArrowLeft
} from "react-icons/fi";
import "./refurbishment_profile.css";

function RefurbishmentProfile() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Profile Picture Upload State
    const [selectedFile, setSelectedFile] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        centerName: "",
        ownerName: "",
        phoneNumber: "",
        experienceYears: "",
        technicianCount: "",
        buildingNumber: "",
        street: "",
        city: "",
        district: "",
        state: "",
        pincode: "",
        deviceTypes: "",
        services: "",
        pickupAvailable: "Yes"
    });

    // Password Change UI & Verification state (same 2-step concept as Collection Agent)
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

    // Modal state for viewing document preview
    const [activeDoc, setActiveDoc] = useState(null);

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
                "https://ecocycle.runasp.net/api/RefurbishmentCenter/verify-password",
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
                "https://ecocycle.runasp.net/api/RefurbishmentCenter/change-password",
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

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found, redirecting to login.");
            navigate("/");
            return;
        }
        loadProfile(token);
    }, [navigate]);

    const getMediaUrl = (filename, folderName = "") => {
        if (!filename) return null;
        if (filename.startsWith("http://") || filename.startsWith("https://") || filename.startsWith("blob:")) {
            return filename;
        }
        const cleanName = filename.replace(/^uploads[\\/]/, "").replace(/^[\\/]/, "");
        if (cleanName.includes("/") || cleanName.includes("\\")) {
            return `https://ecocycle.runasp.net/uploads/${cleanName.replace("\\", "/")}`;
        }
        return folderName
            ? `https://ecocycle.runasp.net/uploads/refurbishment/${folderName}/${cleanName}`
            : `https://ecocycle.runasp.net/uploads/${cleanName}`;
    };

    const loadProfile = async (tokenOverride) => {
        try {
            if (profile) setRefreshing(true);
            else setLoading(true);
            setError("");

            const token = tokenOverride || localStorage.getItem("token");
            if (!token) {
                navigate("/");
                return;
            }

            const response = await axios.get(
                "https://ecocycle.runasp.net/api/RefurbishmentCenter/myprofile",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = response.data || {};
            console.log("Refurbishment Center Profile Data:", data);
            setProfile(data);

            // Populate Edit Form State
            setEditForm({
                centerName: data.CenterName || data.centerName || "",
                ownerName: data.OwnerName || data.ownerName || "",
                phoneNumber: data.PhoneNumber || data.phoneNumber || data.Phone || "",
                experienceYears: data.ExperienceYears ?? data.experienceYears ?? 0,
                technicianCount: data.TechnicianCount ?? data.technicianCount ?? 0,
                buildingNumber: data.BuildingNumber || data.buildingNumber || "",
                street: data.Street || data.street || "",
                city: data.City || data.city || "",
                district: data.District || data.district || "",
                state: data.State || data.state || "",
                pincode: data.Pincode || data.pincode || "",
                deviceTypes: data.DeviceTypes || data.deviceTypes || "",
                services: data.Services || data.services || "",
                pickupAvailable: data.PickupAvailable || data.pickupAvailable || "Yes"
            });

            // Set Center Photo Preview
            const img = data.CenterPhoto || data.centerPhoto;
            if (img) {
                setProfileImagePreview(getMediaUrl(img, "center-photo"));
            }

        } catch (err) {
            console.error("Unable to load refurbishment center profile:", err);
            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
                localStorage.clear();
                setTimeout(() => navigate("/"), 2000);
            } else {
                setError(
                    err.response?.data?.message ||
                        "Failed to retrieve refurbishment center details from server."
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

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
        const img = profile?.CenterPhoto || profile?.centerPhoto;
        if (img) {
            setProfileImagePreview(getMediaUrl(img, "center-photo"));
        } else {
            setProfileImagePreview(null);
        }
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        setError("");
        setSuccessMessage("");

        const token = localStorage.getItem("token");

        const formData = new FormData();
        formData.append("CenterName", editForm.centerName);
        formData.append("OwnerName", editForm.ownerName);
        formData.append("PhoneNumber", editForm.phoneNumber);
        formData.append("ExperienceYears", editForm.experienceYears);
        formData.append("TechnicianCount", editForm.technicianCount);
        formData.append("BuildingNumber", editForm.buildingNumber);
        formData.append("Street", editForm.street);
        formData.append("City", editForm.city);
        formData.append("District", editForm.district);
        formData.append("State", editForm.state);
        formData.append("Pincode", editForm.pincode);
        formData.append("DeviceTypes", editForm.deviceTypes);
        formData.append("Services", editForm.services);
        formData.append("PickupAvailable", editForm.pickupAvailable);

        if (selectedFile) {
            formData.append("CenterPhoto", selectedFile);
        }

        try {
            await axios.post(
                "https://ecocycle.runasp.net/api/RefurbishmentCenter/update-profile",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setSuccessMessage("Refurbishment Center profile updated successfully!");
            setIsEditing(false);
            setSelectedFile(null);

            if (editForm.centerName) {
                localStorage.setItem("firstName", editForm.centerName);
            }

            await loadProfile(token);

            setTimeout(() => setSuccessMessage(""), 4000);
        } catch (err) {
            console.error("Profile update error:", err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || "Failed to update facility profile.";
            setError(errMsg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="refurb-profile-layout">
                <Sidebar />
                <div className="refurb-profile-main">
                    <div style={{ padding: "1.5rem" }}>
                        <div className="refurb-skeleton-card">
                            <div className="refurb-skeleton-line" style={{ width: "40%", height: "30px" }}></div>
                            <div className="refurb-skeleton-line" style={{ width: "60%" }}></div>
                            <div className="refurb-skeleton-line" style={{ width: "100%", height: "120px", marginTop: "1rem" }}></div>
                            <div className="refurb-skeleton-line" style={{ width: "80%" }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="refurb-profile-layout">
                <Sidebar />
                <div className="refurb-profile-main">
                    <div className="refurb-error-container">
                        <div className="refurb-error-icon">
                            <FiAlertCircle />
                        </div>
                        <h2 className="refurb-error-title">Profile Load Error</h2>
                        <p className="refurb-error-msg">{error}</p>
                        <button
                            className="refurb-retry-btn"
                            onClick={() => loadProfile()}
                        >
                            <FiRefreshCw style={{ marginRight: "6px" }} /> Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Read profile fields
    const centerName = profile?.CenterName || profile?.centerName || editForm.centerName || "EcoCycle Refurbishment Center";
    const ownerName = profile?.OwnerName || profile?.ownerName || editForm.ownerName || "N/A";
    const email = profile?.Email || profile?.email || "N/A";
    const phone = profile?.PhoneNumber || profile?.phoneNumber || profile?.Phone || "N/A";

    // 🔒 Admin Verified Read-Only Fields
    const regNo = profile?.BusinessRegistrationNumber || profile?.businessRegistrationNumber || "N/A";
    const gstNo = profile?.GstNumber || profile?.gstNumber || "N/A";
    const licenseNo = profile?.LicenseNumber || profile?.licenseNumber || "N/A";

    const buildingNo = profile?.BuildingNumber || profile?.buildingNumber || "N/A";
    const street = profile?.Street || profile?.street || "N/A";
    const city = profile?.City || profile?.city || "N/A";
    const district = profile?.District || profile?.district || "N/A";
    const state = profile?.State || profile?.state || "N/A";
    const pincode = profile?.Pincode || profile?.pincode || "N/A";

    const experienceYears = profile?.ExperienceYears ?? profile?.experienceYears ?? 0;
    const technicianCount = profile?.TechnicianCount ?? profile?.technicianCount ?? 0;
    const deviceTypes = profile?.DeviceTypes || profile?.deviceTypes || "Laptops, Mobiles, Tablets";
    const services = profile?.Services || profile?.services || "Screen Replacement, Battery Repair, Component Refurbish";
    const pickupAvailable = profile?.PickupAvailable || profile?.pickupAvailable || "Yes";

    const busRegCert = profile?.BusinessRegistrationCertificate || profile?.businessRegistrationCertificate;
    const tradeLic = profile?.TradeLicense || profile?.tradeLicense;
    const addrProof = profile?.AddressProof || profile?.addressProof;
    const centerPhotoFile = profile?.CenterPhoto || profile?.centerPhoto;
    const authPersonId = profile?.AuthorizedPersonId || profile?.authorizedPersonId;

    const avatarInitial = centerName.charAt(0).toUpperCase();

    const documentsList = [
        {
            title: "Business Registration Cert",
            filename: busRegCert,
            folder: "business-registration",
            icon: <FiShield />,
            type: "business"
        },
        {
            title: "Trade License Certificate",
            filename: tradeLic,
            folder: "trade-license",
            icon: <FiFileText />,
            type: "license"
        },
        {
            title: "Facility Address Proof",
            filename: addrProof,
            folder: "address-proof",
            icon: <FiMapPin />,
            type: "address"
        },
        {
            title: "Refurbish Center Photo",
            filename: centerPhotoFile,
            folder: "center-photo",
            icon: <FiCpu />,
            type: "photo"
        },
        {
            title: "Authorized Person Gov ID",
            filename: authPersonId,
            folder: "authorized-person-id",
            icon: <FiCheckCircle />,
            type: "identity"
        }
    ];

    return (
        <div className="refurb-profile-layout">
            <Sidebar />

            <div className="refurb-profile-main">
                {/* Header Top Bar Ribbon */}
                <div className="refurb-profile-top-nav">
                    <div className="refurb-profile-page-title">
                        <div className="refurb-title-icon-badge">
                            <FiCpu />
                        </div>
                        <div>
                            <h1>Facility Profile & Credentials</h1>
                            <p>EcoCycle E-Waste Operations • Certified Refurbishment Center Facility</p>
                        </div>
                    </div>

                </div>

                {/* Hidden File Input for Photo Upload */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    style={{ display: "none" }}
                />

                {/* Success Message Banner */}
                {successMessage && (
                    <div className="refurb-success-alert">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <FiCheckCircle style={{ fontSize: "1.2rem" }} />
                            <span>{successMessage}</span>
                        </div>
                        <button
                            onClick={() => setSuccessMessage("")}
                            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
                        >
                            <FiX />
                        </button>
                    </div>
                )}

                {/* Error Banner */}
                {error && profile && (
                    <div className="refurb-success-alert" style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#ef4444" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <FiAlertCircle style={{ fontSize: "1.2rem" }} />
                            <span>{error}</span>
                        </div>
                        <button
                            onClick={() => setError("")}
                            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
                        >
                            <FiX />
                        </button>
                    </div>
                )}

                {/* Flat Simple Profile Header (No Cover Banner) */}
                <div className="refurb-flat-profile-header">
                    <div className="refurb-flat-header-left">
                        <div className="refurb-avatar-frame">
                            {profileImagePreview ? (
                                <img
                                    src={profileImagePreview}
                                    alt={centerName}
                                    className="refurb-avatar-img"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = "none";
                                        e.target.nextSibling.style.display = "flex";
                                    }}
                                />
                            ) : null}
                            <div
                                className="refurb-avatar-fallback"
                                style={{ display: profileImagePreview ? "none" : "flex" }}
                            >
                                {avatarInitial}
                            </div>
                            <div className="refurb-verified-badge" title="Certified Refurbishment Center">
                                <FiCheck />
                            </div>

                            <button
                                type="button"
                                className="refurb-avatar-camera-btn"
                                onClick={() => fileInputRef.current?.click()}
                                title="Upload facility picture"
                            >
                                <FiCamera />
                            </button>
                        </div>

                        <div className="refurb-flat-header-info">
                            <div className="refurb-flat-title-row">
                                <h2 className="refurb-flat-name">{centerName}</h2>
                                <span className="refurb-status-pill active">
                                    <span className="refurb-status-dot"></span>
                                    Operational Active
                                </span>
                                <span className="refurb-id-tag">
                                    Facility ID: RC-{profile?.RefurbishmentCenterId || "019"}
                                </span>
                            </div>
                            <div className="refurb-flat-subtext">
                                <span className="refurb-subtext-item">
                                    <FiMail /> {email}
                                </span>
                                <span className="refurb-subtext-item">
                                    <FiPhone /> {phone}
                                </span>
                                <span className="refurb-subtext-item">
                                    <FiMapPin /> {city}, {state}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="refurb-flat-header-actions">
                        {!isEditing ? (
                            <button
                                type="button"
                                className="refurb-edit-btn"
                                onClick={() => setIsEditing(true)}
                            >
                                <FiEdit3 /> Edit Profile
                            </button>
                        ) : (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    type="button"
                                    className="refurb-save-btn"
                                    onClick={handleSaveChanges}
                                    disabled={saving}
                                >
                                    <FiSave /> {saving ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    type="button"
                                    className="refurb-cancel-btn"
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
                                className="refurb-change-pwd-btn"
                                onClick={() => {
                                    handleResetPasswordForm();
                                    setShowPasswordSection(true);
                                }}
                            >
                                <FiKey /> Change Password
                            </button>
                        )}
                    </div>
                </div>

                {/* Change Password Card UI (Step 1 & Step 2 Flow Same as Collection Agent) */}
                {showPasswordSection && (
                    <div className="refurb-password-change-card">
                        <div className="refurb-password-card-header">
                            <div className="refurb-password-card-title-group">
                                <FiKey style={{ color: "#7c3aed", fontSize: "1.15rem" }} />
                                <h3 className="refurb-card-title" style={{ margin: 0, fontSize: "1rem", fontWeight: "700" }}>
                                    {passwordStep === 1 ? "Verify Current Password" : "Set New Password"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                className="refurb-password-close-btn"
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
                            <form onSubmit={handleVerifyCurrentPassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <p style={{ fontSize: "0.825rem", color: "#475569", margin: "0 0 0.4rem 0" }}>
                                    Enter your current facility account password to proceed:
                                </p>

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.775rem", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>
                                        <FiLock style={{ color: "#7c3aed" }} /> Current Password
                                    </label>
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            className="refurb-input"
                                            style={{ paddingRight: "2.5rem" }}
                                            placeholder="Enter current password"
                                            value={currentPasswordInput}
                                            onChange={(e) => handleCurrentPasswordChange(e.target.value)}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            style={{
                                                position: "absolute",
                                                right: "0.75rem",
                                                background: "transparent",
                                                border: "none",
                                                color: "#94a3b8",
                                                cursor: "pointer",
                                                fontSize: "1.05rem"
                                            }}
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

                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
                                    <button
                                        type="button"
                                        className="refurb-cancel-btn"
                                        style={{ flex: 1, justifyContent: "center" }}
                                        onClick={handleResetPasswordForm}
                                        disabled={passwordLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="refurb-save-btn"
                                        style={{ flex: 1.2, justifyContent: "center" }}
                                        disabled={passwordLoading}
                                    >
                                        {passwordLoading ? "Verifying..." : "Verify Password"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleUpdateNewPassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                {/* STEP 2: Current password verified -> Enter New Password & Confirm Password */}
                                <div style={{
                                    background: "#f5f3ff",
                                    border: "1px solid #ddd6fe",
                                    color: "#6d28d9",
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
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.775rem", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>
                                        <FiLock style={{ color: "#7c3aed" }} /> New Password
                                    </label>
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            className="refurb-input"
                                            style={{ paddingRight: "2.5rem" }}
                                            placeholder="Enter new password"
                                            value={newPasswordInput}
                                            onChange={(e) => handleNewPasswordChange(e.target.value)}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            style={{
                                                position: "absolute",
                                                right: "0.75rem",
                                                background: "transparent",
                                                border: "none",
                                                color: "#94a3b8",
                                                cursor: "pointer",
                                                fontSize: "1.05rem"
                                            }}
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
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.775rem", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>
                                        <FiLock style={{ color: "#7c3aed" }} /> Confirm New Password
                                    </label>
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="refurb-input"
                                            style={{ paddingRight: "2.5rem" }}
                                            placeholder="Re-enter new password"
                                            value={confirmPasswordInput}
                                            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            style={{
                                                position: "absolute",
                                                right: "0.75rem",
                                                background: "transparent",
                                                border: "none",
                                                color: "#94a3b8",
                                                cursor: "pointer",
                                                fontSize: "1.05rem"
                                            }}
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

                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
                                    <button
                                        type="button"
                                        className="refurb-cancel-btn"
                                        style={{ flex: 1, justifyContent: "center" }}
                                        onClick={handleResetPasswordForm}
                                        disabled={passwordLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="refurb-save-btn"
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

                {/* Main Profile Content (hidden when password updating) */}
                {!showPasswordSection && (
                    <>
                        {/* Quick Metrics Ribbon */}
                        <div className="refurb-metrics-grid">
                            <div className="refurb-metric-card">
                                <div className="refurb-metric-icon purple">
                                    <FiUsers />
                                </div>
                                <div className="refurb-metric-text">
                                    <div className="refurb-metric-label">Staff Technicians</div>
                                    <div className="refurb-metric-val">{technicianCount} Techs</div>
                                </div>
                            </div>

                            <div className="refurb-metric-card">
                                <div className="refurb-metric-icon emerald">
                                    <FiBriefcase />
                                </div>
                                <div className="refurb-metric-text">
                                    <div className="refurb-metric-label">Industry Experience</div>
                                    <div className="refurb-metric-val">{experienceYears} Years</div>
                                </div>
                            </div>

                            <div className="refurb-metric-card">
                                <div className="refurb-metric-icon blue">
                                    <FiShield />
                                </div>
                                <div className="refurb-metric-text">
                                    <div className="refurb-metric-label">Operating License</div>
                                    <div className="refurb-metric-val">{licenseNo}</div>
                                </div>
                            </div>

                            <div className="refurb-metric-card">
                                <div className="refurb-metric-icon amber">
                                    <FiTruck />
                                </div>
                                <div className="refurb-metric-text">
                                    <div className="refurb-metric-label">Pickup Logistics</div>
                                    <div className="refurb-metric-val">{pickupAvailable === "Yes" ? "Available" : "Not Offered"}</div>
                                </div>
                            </div>
                        </div>

                        {/* Profile Details Cards Grid */}
                        <div className="refurb-details-grid">
                            {/* Personal & Contact Details */}
                            <div className="refurb-card">
                                <div className="refurb-card-header">
                                    <div className="refurb-card-title-group">
                                        <div className="refurb-card-icon purple">
                                            <FiCpu />
                                        </div>
                                        <div>
                                            <h3 className="refurb-card-title">Facility Identity & Contact</h3>
                                            <p className="refurb-card-subtitle">Registered center and owner contact details</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="refurb-info-list">
                                    <div className="refurb-info-item full-width">
                                        <span className="refurb-info-label">Center Name</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="refurb-input"
                                                value={editForm.centerName}
                                                onChange={(e) => handleFormInputChange("centerName", e.target.value)}
                                                placeholder="Refurbishment Center Name"
                                            />
                                        ) : (
                                            <span className="refurb-info-value">{centerName}</span>
                                        )}
                                    </div>

                                    <div className="refurb-info-item">
                                        <span className="refurb-info-label">Owner / Managing Person</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="refurb-input"
                                                value={editForm.ownerName}
                                                onChange={(e) => handleFormInputChange("ownerName", e.target.value)}
                                                placeholder="Owner Name"
                                            />
                                        ) : (
                                            <span className="refurb-info-value">{ownerName}</span>
                                        )}
                                    </div>

                                    <div className="refurb-info-item">
                                        <span className="refurb-info-label">Contact Phone</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="refurb-input"
                                                value={editForm.phoneNumber}
                                                onChange={(e) => handleFormInputChange("phoneNumber", e.target.value)}
                                                placeholder="Phone Number"
                                            />
                                        ) : (
                                            <span className="refurb-info-value mono">{phone}</span>
                                        )}
                                    </div>

                                    <div className="refurb-info-item full-width">
                                        <span className="refurb-info-label">Email Address (Login ID)</span>
                                        <input
                                            type="text"
                                            className="refurb-input locked"
                                            value={email}
                                            disabled
                                            title="Registered email address cannot be changed directly."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Location & Facility Address */}
                            <div className="refurb-card">
                                <div className="refurb-card-header">
                                    <div className="refurb-card-title-group">
                                        <div className="refurb-card-icon blue">
                                            <FiMapPin />
                                        </div>
                                        <div>
                                            <h3 className="refurb-card-title">Facility Location</h3>
                                            <p className="refurb-card-subtitle">Physical address of refurbishment workshop</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="refurb-info-list">
                                    <div className="refurb-info-item">
                                        <span className="refurb-info-label">Building / Shop No.</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="refurb-input"
                                                value={editForm.buildingNumber}
                                                onChange={(e) => handleFormInputChange("buildingNumber", e.target.value)}
                                                placeholder="Building Number"
                                            />
                                        ) : (
                                            <span className="refurb-info-value">{buildingNo}</span>
                                        )}
                                    </div>

                                    <div className="refurb-info-item">
                                        <span className="refurb-info-label">Street / Area</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="refurb-input"
                                                value={editForm.street}
                                                onChange={(e) => handleFormInputChange("street", e.target.value)}
                                                placeholder="Street Name"
                                            />
                                        ) : (
                                            <span className="refurb-info-value">{street}</span>
                                        )}
                                    </div>

                                    <div className="refurb-info-item">
                                        <span className="refurb-info-label">City / Town</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="refurb-input"
                                                value={editForm.city}
                                                onChange={(e) => handleFormInputChange("city", e.target.value)}
                                                placeholder="City"
                                            />
                                        ) : (
                                            <span className="refurb-info-value">{city}</span>
                                        )}
                                    </div>

                                    <div className="refurb-info-item">
                                        <span className="refurb-info-label">District</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="refurb-input"
                                                value={editForm.district}
                                                onChange={(e) => handleFormInputChange("district", e.target.value)}
                                                placeholder="District"
                                            />
                                        ) : (
                                            <span className="refurb-info-value">{district}</span>
                                        )}
                                    </div>

                                    <div className="refurb-info-item">
                                        <span className="refurb-info-label">State</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="refurb-input"
                                                value={editForm.state}
                                                onChange={(e) => handleFormInputChange("state", e.target.value)}
                                                placeholder="State"
                                            />
                                        ) : (
                                            <span className="refurb-info-value">{state}</span>
                                        )}
                                    </div>

                                    <div className="refurb-info-item">
                                        <span className="refurb-info-label">Pincode</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="refurb-input"
                                                value={editForm.pincode}
                                                onChange={(e) => handleFormInputChange("pincode", e.target.value)}
                                                placeholder="Pincode"
                                            />
                                        ) : (
                                            <span className="refurb-info-value mono">{pincode}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Operations & Capacity */}
                            <div className="refurb-card">
                                <div className="refurb-card-header">
                                    <div className="refurb-card-title-group">
                                        <div className="refurb-card-icon emerald">
                                            <FiTool />
                                        </div>
                                        <div>
                                            <h3 className="refurb-card-title">Operations & Capacity</h3>
                                            <p className="refurb-card-subtitle">Technical capability and services offered</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="refurb-info-list">
                                    <div className="refurb-info-item">
                                        <span className="refurb-info-label">Technician Count</span>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                className="refurb-input"
                                                value={editForm.technicianCount}
                                                onChange={(e) => handleFormInputChange("technicianCount", e.target.value)}
                                                placeholder="Technicians count"
                                            />
                                        ) : (
                                            <span className="refurb-info-value">{technicianCount} Members</span>
                                        )}
                                    </div>

                                    <div className="refurb-info-item">
                                        <span className="refurb-info-label">Experience (Years)</span>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                className="refurb-input"
                                                value={editForm.experienceYears}
                                                onChange={(e) => handleFormInputChange("experienceYears", e.target.value)}
                                                placeholder="Years of experience"
                                            />
                                        ) : (
                                            <span className="refurb-info-value">{experienceYears} Years</span>
                                        )}
                                    </div>

                                    <div className="refurb-info-item full-width">
                                        <span className="refurb-info-label">Device Types Handled</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="refurb-input"
                                                value={editForm.deviceTypes}
                                                onChange={(e) => handleFormInputChange("deviceTypes", e.target.value)}
                                                placeholder="Comma separated device types"
                                            />
                                        ) : (
                                            <span className="refurb-info-value">{deviceTypes}</span>
                                        )}
                                    </div>

                                    <div className="refurb-info-item full-width">
                                        <span className="refurb-info-label">Services Provided</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="refurb-input"
                                                value={editForm.services}
                                                onChange={(e) => handleFormInputChange("services", e.target.value)}
                                                placeholder="Comma separated services"
                                            />
                                        ) : (
                                            <span className="refurb-info-value">{services}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Legal & Compliance (Read-Only Admin Verified) */}
                            <div className="refurb-card" style={{ background: "#fafafa" }}>
                                <div className="refurb-card-header">
                                    <div className="refurb-card-title-group">
                                        <div className="refurb-card-icon amber">
                                            <FiShield />
                                        </div>
                                        <div>
                                            <h3 className="refurb-card-title">Legal & Compliance</h3>
                                            <p className="refurb-card-subtitle">Verified tax and registration records (Admin verified)</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="refurb-info-list">
                                    <div className="refurb-info-item full-width">
                                        <span className="refurb-info-label">Business Registration Number</span>
                                        <input
                                            type="text"
                                            className="refurb-input locked mono"
                                            value={regNo}
                                            disabled
                                            title="Verified government business registration number."
                                        />
                                    </div>

                                    <div className="refurb-info-item">
                                        <span className="refurb-info-label">GST Number</span>
                                        <input
                                            type="text"
                                            className="refurb-input locked mono"
                                            value={gstNo}
                                            disabled
                                            title="GST identification number."
                                        />
                                    </div>

                                    <div className="refurb-info-item">
                                        <span className="refurb-info-label">Operating License No.</span>
                                        <input
                                            type="text"
                                            className="refurb-input locked mono"
                                            value={licenseNo}
                                            disabled
                                            title="State authorized e-waste refurbish license number."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Document Vault Section */}
                        <div className="refurb-vault-card">
                            <div className="refurb-card-header" style={{ marginBottom: "0.5rem" }}>
                                <div className="refurb-card-title-group">
                                    <div className="refurb-card-icon slate">
                                        <FiShield />
                                    </div>
                                    <div>
                                        <h3 className="refurb-card-title">Verification Document Vault</h3>
                                        <p className="refurb-card-subtitle">
                                            Uploaded certificates and proof files submitted during onboarding verification
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="refurb-vault-grid">
                                {documentsList.map((doc, idx) => {
                                    const url = getMediaUrl(doc.filename, doc.folder);
                                    const hasFile = Boolean(url);

                                    return (
                                        <div className="refurb-doc-tile" key={idx}>
                                            <div className="refurb-doc-tile-top">
                                                <div className="refurb-doc-icon-wrap">
                                                    {doc.icon}
                                                </div>
                                                <h4 className="refurb-doc-name">{doc.title}</h4>
                                            </div>

                                            <div className="refurb-doc-tile-bottom">
                                                {hasFile ? (
                                                    <span className="refurb-doc-status verified">
                                                        <FiCheckCircle /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="refurb-doc-status missing">
                                                        Not Uploaded
                                                    </span>
                                                )}

                                                {hasFile && (
                                                    <button
                                                        type="button"
                                                        className="refurb-doc-view-btn"
                                                        onClick={() =>
                                                            setActiveDoc({
                                                                title: doc.title,
                                                                url: url,
                                                                filename: doc.filename
                                                            })
                                                        }
                                                    >
                                                        <FiEye /> View Document
                                                    </button>
                                                )}
                                            </div>
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
                <div className="refurb-modal-overlay" onClick={() => setActiveDoc(null)}>
                    <div
                        className="refurb-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="refurb-modal-header">
                            <h3 className="refurb-modal-title">{activeDoc.title}</h3>
                            <button
                                type="button"
                                className="refurb-modal-close"
                                onClick={() => setActiveDoc(null)}
                            >
                                <FiX />
                            </button>
                        </div>
                        <div className="refurb-modal-body">
                            {activeDoc.url.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? (
                                <img
                                    src={activeDoc.url}
                                    alt={activeDoc.title}
                                    className="refurb-modal-img"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.alt = "Failed to load document image preview.";
                                    }}
                                />
                            ) : (
                                <div style={{ textAlign: "center", padding: "2rem" }}>
                                    <FiFileText style={{ fontSize: "3rem", color: "#7c3aed" }} />
                                    <p style={{ marginTop: "1rem", color: "#475569" }}>
                                        Document File: <strong>{activeDoc.filename}</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="refurb-modal-footer">
                            <a
                                href={activeDoc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="refurb-save-btn"
                                style={{ background: "#7c3aed", color: "#ffffff", textDecoration: "none" }}
                            >
                                <FiExternalLink /> Open Original Document
                            </a>
                            <button
                                type="button"
                                className="refurb-cancel-btn"
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

export default RefurbishmentProfile;
