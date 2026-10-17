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
    FiArrowLeft,
    FiBell,
    FiBox,
    FiChevronDown,
    FiInfo,
    FiUser
} from "react-icons/fi";
import "./refurbishment_profile.css";

function RefurbishmentProfile() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [activeTab, setActiveTab] = useState("personal");

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
        fetchUnreadNotifCount(token);
    }, [navigate]);

    const fetchUnreadNotifCount = async (token) => {
        try {
            const authToken = token || localStorage.getItem("token");
            const res = await axios.get("https://ecocycle.runasp.net/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            const list = Array.isArray(res.data) ? res.data : [];
            const unread = list.filter(n => {
                const isR = n.isRead !== undefined ? n.isRead : (n.isread !== undefined ? n.isread : n.Isread);
                return !isR;
            }).length;
            setUnreadNotifCount(unread);
        } catch {
            setUnreadNotifCount(0);
        }
    };

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

    const profileTabs = [
        { id: "personal", label: "Personal Information", icon: <FiShield /> },
        { id: "address", label: "Facility Address", icon: <FiMapPin /> },
        { id: "operations", label: "Operations & Capacity", icon: <FiTool /> },
        { id: "legal", label: "Legal & Compliance", icon: <FiAward /> },
        { id: "documents", label: "Document Vault", icon: <FiFileText /> },
        { id: "security", label: "Security & Password", icon: <FiKey /> }
    ];

    return (
        <div className="refurb-dashboard-layout refurb-profile-layout">
            <Sidebar />

            <main className="refurb-main-content refurb-profile-main">
                {/* Header Top Bar Ribbon */}
                <div className="refurb-header-ribbon">
                    <div>
                        <h1 className="refurb-welcome-title">Facility Profile &amp; Settings</h1>
                        <p className="refurb-welcome-sub">Refurbishment Center Operations &bull; Credentials &amp; Verification Details</p>
                    </div>

                    <div className="refurb-header-actions">
                        <button
                            type="button"
                            onClick={() => navigate("/refurbishmentcenter_notification")}
                            title="Notifications"
                            className="notif-bell-btn"
                        >
                            <FiBell style={{ color: "#475569", fontSize: "1.1rem" }} />
                            {unreadNotifCount > 0 && (
                                <span className="notif-badge">
                                    {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                                </span>
                            )}
                        </button>
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

                {/* 1. Horizontal Profile Navigation Tabs */}
                <div className="fc-profile-tabs-bar">
                    {profileTabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            className={`fc-tab-item ${activeTab === tab.id ? "active" : ""}`}
                            onClick={() => {
                                if (tab.id !== "security") {
                                    handleResetPasswordForm();
                                }
                                setActiveTab(tab.id);
                            }}
                        >
                            <span className="fc-tab-icon">{tab.icon}</span>
                            <span className="fc-tab-label">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* 2. Main Profile Card */}
                <div className="fc-profile-card-container">
                    {/* TAB 1: Personal Information */}
                    {activeTab === "personal" && (
                        <div className="fc-main-card">
                            <div className="fc-card-header">
                                <div
                                    className="fc-topbar-avatar-wrap"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Change facility picture"
                                >
                                    {profileImagePreview ? (
                                        <img
                                            src={profileImagePreview}
                                            alt={centerName}
                                            className="fc-topbar-avatar-img"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = "none";
                                                e.target.nextSibling.style.display = "flex";
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className="fc-topbar-avatar-fallback"
                                        style={{ display: profileImagePreview ? "none" : "flex" }}
                                    >
                                        {avatarInitial}
                                    </div>
                                    <button
                                        type="button"
                                        className="fc-topbar-cam-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                        title="Change facility picture"
                                    >
                                        <FiCamera />
                                    </button>
                                </div>
                                <div className="fc-card-title-wrap">
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                                        <h2 className="fc-card-title" style={{ margin: 0 }}>{centerName || "Personal Information"}</h2>
                                        <span className="fc-facility-tag">RC-{profile?.RefurbishmentCenterId || "019"}</span>
                                    </div>
                                    <p className="fc-card-subtitle">
                                        Update your refurbishment facility details, contact information, and operational collection preferences.
                                    </p>
                                </div>
                            </div>

                            <div className="fc-form-body">
                                <div className="fc-grid-2">
                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">First name / Center Name</label>
                                        <input
                                            type="text"
                                            className="fc-outline-input"
                                            value={isEditing ? editForm.centerName : centerName}
                                            onChange={(e) => handleFormInputChange("centerName", e.target.value)}
                                            placeholder="Refurbishment Center Name"
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">Last name / Owner Name</label>
                                        <input
                                            type="text"
                                            className="fc-outline-input"
                                            value={isEditing ? editForm.ownerName : ownerName}
                                            onChange={(e) => handleFormInputChange("ownerName", e.target.value)}
                                            placeholder="Managing Owner / Director"
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>

                                <div className="fc-field-box">
                                    <label className="fc-floating-label">Email Address (Login ID)</label>
                                    <div className="fc-input-with-icon">
                                        <input
                                            type="text"
                                            className="fc-outline-input locked"
                                            value={email}
                                            disabled
                                            title="Registered authentication email address is locked."
                                        />
                                        <FiLock className="fc-field-lock-icon" />
                                    </div>
                                </div>

                                <div className="fc-grid-2">
                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">Phone Number</label>
                                        <div className="fc-phone-input-wrap">
                                            <div className="fc-country-code-btn" title="Country code (+91)">
                                                <span style={{ fontSize: "1.1rem" }}>🇮🇳</span>
                                                <span className="fc-code-txt">(+91)</span>
                                                <FiChevronDown style={{ fontSize: "0.8rem", color: "#64748b" }} />
                                            </div>
                                            <input
                                                type="text"
                                                className="fc-outline-input fc-phone-field"
                                                value={isEditing ? editForm.phoneNumber : phone}
                                                onChange={(e) => handleFormInputChange("phoneNumber", e.target.value)}
                                                placeholder="Phone number"
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    </div>

                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">Experience / Established Since</label>
                                        <div className="fc-date-input-wrap">
                                            <FiCalendar className="fc-date-icon" />
                                            <input
                                                type={isEditing ? "number" : "text"}
                                                className="fc-outline-input fc-date-field"
                                                value={isEditing ? editForm.experienceYears : `${experienceYears} Years in Operation`}
                                                onChange={(e) => handleFormInputChange("experienceYears", e.target.value)}
                                                placeholder="Years in industry"
                                                disabled={!isEditing}
                                            />
                                            <FiChevronDown className="fc-date-chevron" />
                                        </div>
                                    </div>
                                </div>

                                <div className="fc-choice-section">
                                    <label className="fc-floating-label" style={{ marginBottom: "0.6rem" }}>
                                        Logistics Collection Service Mode
                                    </label>
                                    <div className="fc-choice-grid">
                                        <div
                                            className={`fc-choice-card ${(isEditing ? editForm.pickupAvailable : pickupAvailable) === "Yes" ? "selected" : ""}`}
                                            onClick={() => {
                                                if (isEditing) handleFormInputChange("pickupAvailable", "Yes");
                                            }}
                                            style={{ cursor: isEditing ? "pointer" : "default" }}
                                        >
                                            {(isEditing ? editForm.pickupAvailable : pickupAvailable) === "Yes" && (
                                                <div className="fc-choice-check">
                                                    <FiCheck />
                                                </div>
                                            )}
                                            <div className="fc-choice-icon-wrap">
                                                <FiTruck />
                                            </div>
                                            <div className="fc-choice-label">Pickup Available</div>
                                        </div>

                                        <div
                                            className={`fc-choice-card ${(isEditing ? editForm.pickupAvailable : pickupAvailable) !== "Yes" ? "selected" : ""}`}
                                            onClick={() => {
                                                if (isEditing) handleFormInputChange("pickupAvailable", "No");
                                            }}
                                            style={{ cursor: isEditing ? "pointer" : "default" }}
                                        >
                                            {(isEditing ? editForm.pickupAvailable : pickupAvailable) !== "Yes" && (
                                                <div className="fc-choice-check">
                                                    <FiCheck />
                                                </div>
                                            )}
                                            <div className="fc-choice-icon-wrap">
                                                <FiBox />
                                            </div>
                                            <div className="fc-choice-label">Drop-off Only</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="fc-info-note">
                                    <FiInfo className="fc-note-icon" />
                                    <p>
                                        In order to access inbound device allocation quotas and dispatch tracking, please ensure your account details remain verified and accurate. Verified by EcoCycle Operations. For more details <span className="fc-link">click here</span>.
                                    </p>
                                </div>

                                <div className="fc-card-actions">
                                    {isEditing ? (
                                        <>
                                            <button
                                                type="button"
                                                className="fc-btn-save"
                                                onClick={handleSaveChanges}
                                                disabled={saving}
                                            >
                                                <FiSave /> {saving ? "Saving..." : "Save"}
                                            </button>
                                            <button
                                                type="button"
                                                className="fc-btn-cancel"
                                                onClick={handleCancelEdit}
                                                disabled={saving}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            className="fc-btn-save"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <FiEdit3 /> Edit Personal Information
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Facility Address */}
                    {activeTab === "address" && (
                        <div className="fc-main-card">
                            <div className="fc-card-header">
                                <div className="fc-shield-icon-badge">
                                    <FiMapPin />
                                </div>
                                <div className="fc-card-title-wrap">
                                    <h2 className="fc-card-title">Facility Address &amp; Location</h2>
                                    <p className="fc-card-subtitle">
                                        Physical workshop address for inbound logistics drop-off and inspection transfer receiving.
                                    </p>
                                </div>
                            </div>

                            <div className="fc-form-body">
                                <div className="fc-grid-2">
                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">Building / Shop No.</label>
                                        <input
                                            type="text"
                                            className="fc-outline-input"
                                            value={isEditing ? editForm.buildingNumber : buildingNo}
                                            onChange={(e) => handleFormInputChange("buildingNumber", e.target.value)}
                                            placeholder="Building Number"
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">Street / Area</label>
                                        <input
                                            type="text"
                                            className="fc-outline-input"
                                            value={isEditing ? editForm.street : street}
                                            onChange={(e) => handleFormInputChange("street", e.target.value)}
                                            placeholder="Street Name"
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>

                                <div className="fc-grid-2">
                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">City / Town</label>
                                        <input
                                            type="text"
                                            className="fc-outline-input"
                                            value={isEditing ? editForm.city : city}
                                            onChange={(e) => handleFormInputChange("city", e.target.value)}
                                            placeholder="City"
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">District</label>
                                        <input
                                            type="text"
                                            className="fc-outline-input"
                                            value={isEditing ? editForm.district : district}
                                            onChange={(e) => handleFormInputChange("district", e.target.value)}
                                            placeholder="District"
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>

                                <div className="fc-grid-2">
                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">State</label>
                                        <input
                                            type="text"
                                            className="fc-outline-input"
                                            value={isEditing ? editForm.state : state}
                                            onChange={(e) => handleFormInputChange("state", e.target.value)}
                                            placeholder="State"
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">Postal Pincode</label>
                                        <input
                                            type="text"
                                            className="fc-outline-input"
                                            value={isEditing ? editForm.pincode : pincode}
                                            onChange={(e) => handleFormInputChange("pincode", e.target.value)}
                                            placeholder="Pincode"
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>

                                <div className="fc-info-note">
                                    <FiInfo className="fc-note-icon" />
                                    <p>
                                        Accurate geographical coordinates ensure minimal transit latency for collection agent dispatches.
                                    </p>
                                </div>

                                <div className="fc-card-actions">
                                    {isEditing ? (
                                        <>
                                            <button
                                                type="button"
                                                className="fc-btn-save"
                                                onClick={handleSaveChanges}
                                                disabled={saving}
                                            >
                                                <FiSave /> {saving ? "Saving..." : "Save"}
                                            </button>
                                            <button
                                                type="button"
                                                className="fc-btn-cancel"
                                                onClick={handleCancelEdit}
                                                disabled={saving}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            className="fc-btn-save"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <FiEdit3 /> Edit Facility Address
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: Operations & Capacity */}
                    {activeTab === "operations" && (
                        <div className="fc-main-card">
                            <div className="fc-card-header">
                                <div className="fc-shield-icon-badge">
                                    <FiTool />
                                </div>
                                <div className="fc-card-title-wrap">
                                    <h2 className="fc-card-title">Operations &amp; Technical Capacity</h2>
                                    <p className="fc-card-subtitle">
                                        Staffing count, years of industry experience, and electronic device categories serviced.
                                    </p>
                                </div>
                            </div>

                            <div className="fc-form-body">
                                <div className="fc-grid-2">
                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">Technician Staff Count</label>
                                        <input
                                            type={isEditing ? "number" : "text"}
                                            className="fc-outline-input"
                                            value={isEditing ? editForm.technicianCount : `${technicianCount} Certified Technicians`}
                                            onChange={(e) => handleFormInputChange("technicianCount", e.target.value)}
                                            placeholder="Technician count"
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">Industry Experience (Years)</label>
                                        <input
                                            type={isEditing ? "number" : "text"}
                                            className="fc-outline-input"
                                            value={isEditing ? editForm.experienceYears : `${experienceYears} Years`}
                                            onChange={(e) => handleFormInputChange("experienceYears", e.target.value)}
                                            placeholder="Years of experience"
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>

                                <div className="fc-field-box">
                                    <label className="fc-floating-label">Device Categories Handled</label>
                                    <input
                                        type="text"
                                        className="fc-outline-input"
                                        value={isEditing ? editForm.deviceTypes : deviceTypes}
                                        onChange={(e) => handleFormInputChange("deviceTypes", e.target.value)}
                                        placeholder="Comma separated device types (e.g. Laptops, Mobiles, Tablets)"
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="fc-field-box">
                                    <label className="fc-floating-label">Refurbishment Services Provided</label>
                                    <input
                                        type="text"
                                        className="fc-outline-input"
                                        value={isEditing ? editForm.services : services}
                                        onChange={(e) => handleFormInputChange("services", e.target.value)}
                                        placeholder="Comma separated services (e.g. Screen Replacement, Battery Repair)"
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="fc-info-note">
                                    <FiInfo className="fc-note-icon" />
                                    <p>
                                        Capacity quotas determine daily device allocation limits assigned to your center by administrators.
                                    </p>
                                </div>

                                <div className="fc-card-actions">
                                    {isEditing ? (
                                        <>
                                            <button
                                                type="button"
                                                className="fc-btn-save"
                                                onClick={handleSaveChanges}
                                                disabled={saving}
                                            >
                                                <FiSave /> {saving ? "Saving..." : "Save"}
                                            </button>
                                            <button
                                                type="button"
                                                className="fc-btn-cancel"
                                                onClick={handleCancelEdit}
                                                disabled={saving}
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            className="fc-btn-save"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <FiEdit3 /> Edit Operations &amp; Capacity
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: Legal & Compliance */}
                    {activeTab === "legal" && (
                        <div className="fc-main-card">
                            <div className="fc-card-header">
                                <div className="fc-shield-icon-badge">
                                    <FiAward />
                                </div>
                                <div className="fc-card-title-wrap">
                                    <h2 className="fc-card-title">Legal &amp; Compliance Credentials</h2>
                                    <p className="fc-card-subtitle">
                                        Government authorized registration, GSTIN identification, and pollution board certifications.
                                    </p>
                                </div>
                            </div>

                            <div className="fc-form-body">
                                <div className="fc-field-box">
                                    <label className="fc-floating-label">
                                        Business Registration Number (Verified)
                                    </label>
                                    <div className="fc-input-with-icon">
                                        <input
                                            type="text"
                                            className="fc-outline-input locked"
                                            value={regNo}
                                            disabled
                                            title="Verified government business registration number."
                                        />
                                        <FiShield className="fc-field-lock-icon" style={{ color: "#16a34a" }} />
                                    </div>
                                </div>

                                <div className="fc-grid-2">
                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">GST Identification Number</label>
                                        <div className="fc-input-with-icon">
                                            <input
                                                type="text"
                                                className="fc-outline-input locked"
                                                value={gstNo}
                                                disabled
                                                title="GST identification number."
                                            />
                                            <FiShield className="fc-field-lock-icon" style={{ color: "#16a34a" }} />
                                        </div>
                                    </div>

                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">Operating License Number</label>
                                        <div className="fc-input-with-icon">
                                            <input
                                                type="text"
                                                className="fc-outline-input locked"
                                                value={licenseNo}
                                                disabled
                                                title="State authorized e-waste refurbish license number."
                                            />
                                            <FiShield className="fc-field-lock-icon" style={{ color: "#16a34a" }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="fc-info-note">
                                    <FiInfo className="fc-note-icon" />
                                    <p>
                                        Legal compliance credentials are authenticated by state pollution control boards and platform compliance officers. To request administrative revisions, please contact support.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: Document Vault */}
                    {activeTab === "documents" && (
                        <div className="fc-main-card">
                            <div className="fc-card-header">
                                <div className="fc-shield-icon-badge">
                                    <FiFileText />
                                </div>
                                <div className="fc-card-title-wrap">
                                    <h2 className="fc-card-title">Verification Document Vault</h2>
                                    <p className="fc-card-subtitle">
                                        Official licenses, identity proofs, and facility photographs uploaded during facility onboarding.
                                    </p>
                                </div>
                            </div>

                            <div className="fc-docs-grid">
                                {documentsList.map((doc, idx) => {
                                    const url = getMediaUrl(doc.filename, doc.folder);
                                    const hasFile = Boolean(url);

                                    return (
                                        <div className="fc-doc-tile" key={idx}>
                                            <div className="fc-doc-top">
                                                <div className="fc-doc-icon-box">
                                                    {doc.icon}
                                                </div>
                                                <h4 className="fc-doc-title">{doc.title}</h4>
                                            </div>

                                            <div className="fc-doc-bottom">
                                                {hasFile ? (
                                                    <span className="fc-doc-status-badge verified">
                                                        <FiCheckCircle /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="fc-doc-status-badge missing">
                                                        Not Uploaded
                                                    </span>
                                                )}

                                                {hasFile && (
                                                    <button
                                                        type="button"
                                                        className="fc-doc-btn-view"
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
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="fc-info-note" style={{ marginTop: "1.5rem" }}>
                                <FiInfo className="fc-note-icon" />
                                <p>
                                    All uploaded documents are encrypted and archived under EcoCycle compliance regulations.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* TAB 6: Security & Password */}
                    {activeTab === "security" && (
                        <div className="fc-main-card">
                            <div className="fc-card-header">
                                <div className="fc-shield-icon-badge">
                                    <FiKey />
                                </div>
                                <div className="fc-card-title-wrap">
                                    <h2 className="fc-card-title">Security &amp; Password</h2>
                                    <p className="fc-card-subtitle">
                                        {passwordStep === 1
                                            ? "Verify your current account password to proceed with updating your credentials."
                                            : "Enter and confirm your new secure password for future logins."}
                                    </p>
                                </div>
                            </div>

                            {/* Password Error Alert */}
                            {passwordError && (
                                <div style={{
                                    background: "#fef2f2",
                                    border: "1px solid #fecaca",
                                    color: "#dc2626",
                                    padding: "0.75rem 1rem",
                                    borderRadius: "10px",
                                    fontSize: "0.825rem",
                                    fontWeight: "600",
                                    marginBottom: "1rem",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem"
                                }}>
                                    <FiAlertCircle style={{ flexShrink: 0 }} />
                                    <span>{passwordError}</span>
                                </div>
                            )}

                            {passwordStep === 1 ? (
                                <form onSubmit={handleVerifyCurrentPassword} className="fc-form-body">
                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">Current Password</label>
                                        <div className="fc-input-with-icon">
                                            <input
                                                type={showCurrentPassword ? "text" : "password"}
                                                className="fc-outline-input"
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
                                                    fontSize: "1.1rem"
                                                }}
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                tabIndex="-1"
                                            >
                                                {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                        {passwordFormErrors.currentPassword && (
                                            <span style={{ color: "#ef4444", fontSize: "0.775rem", fontWeight: "600", marginTop: "0.3rem" }}>
                                                {passwordFormErrors.currentPassword}
                                            </span>
                                        )}
                                    </div>

                                    <div className="fc-card-actions">
                                        <button
                                            type="submit"
                                            className="fc-btn-save"
                                            disabled={passwordLoading}
                                        >
                                            {passwordLoading ? "Verifying..." : "Verify Current Password"}
                                        </button>
                                        <button
                                            type="button"
                                            className="fc-btn-cancel"
                                            onClick={handleResetPasswordForm}
                                            disabled={passwordLoading}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleUpdateNewPassword} className="fc-form-body">
                                    <div style={{
                                        background: "#f0fdf4",
                                        border: "1px solid #bbf7d0",
                                        color: "#16a34a",
                                        padding: "0.65rem 0.85rem",
                                        borderRadius: "10px",
                                        fontSize: "0.8rem",
                                        fontWeight: "600",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.4rem"
                                    }}>
                                        <FiCheckCircle style={{ flexShrink: 0 }} />
                                        <span>Current password verified! Please set your new credentials below.</span>
                                    </div>

                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">New Password</label>
                                        <div className="fc-input-with-icon">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                className="fc-outline-input"
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
                                                    fontSize: "1.1rem"
                                                }}
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                tabIndex="-1"
                                            >
                                                {showNewPassword ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                        {passwordFormErrors.newPassword && (
                                            <span style={{ color: "#ef4444", fontSize: "0.775rem", fontWeight: "600", marginTop: "0.3rem" }}>
                                                {passwordFormErrors.newPassword}
                                            </span>
                                        )}
                                    </div>

                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">Confirm New Password</label>
                                        <div className="fc-input-with-icon">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                className="fc-outline-input"
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
                                                    fontSize: "1.1rem"
                                                }}
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                tabIndex="-1"
                                            >
                                                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                        {passwordFormErrors.confirmPassword && (
                                            <span style={{ color: "#ef4444", fontSize: "0.775rem", fontWeight: "600", marginTop: "0.3rem" }}>
                                                {passwordFormErrors.confirmPassword}
                                            </span>
                                        )}
                                    </div>

                                    <div className="fc-card-actions">
                                        <button
                                            type="submit"
                                            className="fc-btn-save"
                                            disabled={passwordLoading}
                                        >
                                            {passwordLoading ? "Updating..." : "Update Password"}
                                        </button>
                                        <button
                                            type="button"
                                            className="fc-btn-cancel"
                                            onClick={handleResetPasswordForm}
                                            disabled={passwordLoading}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </main>

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
