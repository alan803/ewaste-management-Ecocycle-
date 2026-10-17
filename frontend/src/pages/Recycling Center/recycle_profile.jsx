import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    validate_password,
    validate_confirm_password
} from "../../utils/validation";
import {
    FiRefreshCw,
    FiMail,
    FiPhone,
    FiMapPin,
    FiShield,
    FiCheckCircle,
    FiFileText,
    FiEye,
    FiEyeOff,
    FiKey,
    FiExternalLink,
    FiAlertCircle,
    FiX,
    FiCheck,
    FiCamera,
    FiLock,
    FiEdit3,
    FiSave,
    FiLayers,
    FiCpu,
    FiTruck,
    FiZap,
    FiUser,
    FiBox,
    FiBell,
    FiCalendar,
    FiChevronDown,
    FiInfo,
    FiAward
} from "react-icons/fi";
import "./recycle_profile.css";

function RecycleProfile() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
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
        buildingNumber: "",
        street: "",
        city: "",
        district: "",
        state: "",
        pincode: "",
        deviceTypes: "",
        recyclingProcesses: "",
        pickupAvailable: "Yes",
        hazardousWasteHandling: "Yes",
        recoveredMaterials: "",
        hazardousWasteTypes: ""
    });

    // Password Change UI & Verification state (2-step verification flow)
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
                "https://ecocycle.runasp.net/api/RecyclingCenter/verify-password",
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
                "https://ecocycle.runasp.net/api/RecyclingCenter/change-password",
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
            const res = await axios.get("https://ecocycle.runasp.net/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${token || localStorage.getItem("token")}` }
            });
            const list = Array.isArray(res.data) ? res.data : [];
            setUnreadNotifCount(list.filter(n => !n.isRead).length);
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
            ? `https://ecocycle.runasp.net/uploads/recycling/${folderName}/${cleanName}`
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
                "https://ecocycle.runasp.net/api/RecyclingCenter/myprofile",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = response.data || {};
            console.log("Recycling Center Profile Data:", data);
            setProfile(data);

            // Populate Edit Form State
            setEditForm({
                centerName: data.CenterName || data.centerName || "",
                ownerName: data.OwnerName || data.ownerName || "",
                phoneNumber: data.PhoneNumber || data.phoneNumber || data.Phone || "",
                experienceYears: data.ExperienceYears ?? data.experienceYears ?? 0,
                buildingNumber: data.BuildingNumber || data.buildingNumber || "",
                street: data.Street || data.street || "",
                city: data.City || data.city || "",
                district: data.District || data.district || "",
                state: data.State || data.state || "",
                pincode: data.Pincode || data.pincode || "",
                deviceTypes: data.DeviceTypes || data.deviceTypes || "",
                recyclingProcesses: data.RecyclingProcesses || data.recyclingProcesses || "",
                pickupAvailable: data.PickupAvailable || data.pickupAvailable || "Yes",
                hazardousWasteHandling: data.HazardousWasteHandling || data.hazardousWasteHandling || "Yes",
                recoveredMaterials: data.RecoveredMaterials || data.recoveredMaterials || "",
                hazardousWasteTypes: data.HazardousWasteTypes || data.hazardousWasteTypes || ""
            });

            // Set Center Photo Preview
            const img = data.CenterPhoto || data.centerPhoto;
            if (img) {
                setProfileImagePreview(getMediaUrl(img, "Center Photo"));
            }

        } catch (err) {
            console.error("Unable to load recycling center profile:", err);
            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
                localStorage.clear();
                setTimeout(() => navigate("/"), 2000);
            } else {
                setError(
                    err.response?.data?.message ||
                        "Failed to retrieve recycling center details from server."
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
            setProfileImagePreview(getMediaUrl(img, "Center Photo"));
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
        formData.append("BuildingNumber", editForm.buildingNumber);
        formData.append("Street", editForm.street);
        formData.append("City", editForm.city);
        formData.append("District", editForm.district);
        formData.append("State", editForm.state);
        formData.append("Pincode", editForm.pincode);
        formData.append("DeviceTypes", editForm.deviceTypes);
        formData.append("RecyclingProcesses", editForm.recyclingProcesses);
        formData.append("PickupAvailable", editForm.pickupAvailable);
        formData.append("HazardousWasteHandling", editForm.hazardousWasteHandling);
        formData.append("RecoveredMaterials", editForm.recoveredMaterials);
        formData.append("HazardousWasteTypes", editForm.hazardousWasteTypes);

        if (selectedFile) {
            formData.append("CenterPhoto", selectedFile);
        }

        try {
            await axios.post(
                "https://ecocycle.runasp.net/api/RecyclingCenter/update-profile",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setSuccessMessage("Recycling Center profile updated successfully!");
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
            <div className="recyc-dashboard-shell">
                <Sidebar />
                <main className="recyc-dashboard-main">
                    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: "1rem" }}>
                        <FiRefreshCw className="spin-icon" style={{ fontSize: "2rem", color: "#059669" }} />
                        <p style={{ color: "#64748b", fontWeight: "600" }}>Loading facility profile...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="recyc-dashboard-shell">
                <Sidebar />
                <main className="recyc-dashboard-main">
                    <div style={{ padding: "2.5rem", textAlign: "center", background: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", margin: "2rem auto", maxWidth: "450px" }}>
                        <FiAlertCircle style={{ fontSize: "2.5rem", color: "#ef4444", marginBottom: "0.75rem" }} />
                        <h4 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#0f172a", margin: "0 0 0.5rem" }}>Profile Load Error</h4>
                        <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1.25rem" }}>{error}</p>
                        <button
                            className="fc-btn-save"
                            onClick={() => loadProfile()}
                        >
                            <FiRefreshCw /> Try Again
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // Read profile fields
    const centerName = profile?.CenterName || profile?.centerName || editForm.centerName || "EcoCycle Recycling Center";
    const ownerName = profile?.OwnerName || profile?.ownerName || editForm.ownerName || "N/A";
    const email = profile?.Email || profile?.email || "N/A";
    const phone = profile?.PhoneNumber || profile?.phoneNumber || profile?.Phone || "N/A";

    // 🔒 Admin Verified Read-Only Fields
    const busRegNo = profile?.BusinessRegistrationNumber || profile?.businessRegistrationNumber || "N/A";
    const recyclerRegNo = profile?.RecyclerRegistrationNumber || profile?.recyclerRegistrationNumber || "N/A";
    const gstNo = profile?.GstNumber || profile?.gstNumber || "N/A";

    const buildingNo = profile?.BuildingNumber || profile?.buildingNumber || "N/A";
    const street = profile?.Street || profile?.street || "N/A";
    const city = profile?.City || profile?.city || "N/A";
    const district = profile?.District || profile?.district || "N/A";
    const state = profile?.State || profile?.state || "N/A";
    const pincode = profile?.Pincode || profile?.pincode || "N/A";

    const experienceYears = profile?.ExperienceYears ?? profile?.experienceYears ?? 0;
    const deviceTypes = profile?.DeviceTypes || profile?.deviceTypes || "E-Waste, Mobiles, PCBs, Batteries";
    const recyclingProcesses = profile?.RecyclingProcesses || profile?.recyclingProcesses || "Shredding, Smelting, Metal Recovery";
    const pickupAvailable = profile?.PickupAvailable || profile?.pickupAvailable || "Yes";
    const hazardousWasteHandling = profile?.HazardousWasteHandling || profile?.hazardousWasteHandling || "Yes";
    const recoveredMaterials = profile?.RecoveredMaterials || profile?.recoveredMaterials || "Copper, Plastics, Gold, Aluminum";
    const hazardousWasteTypes = profile?.HazardousWasteTypes || profile?.hazardousWasteTypes || "Lead, Mercury, Lithium-Ion";

    const busRegCert = profile?.BusinessRegistrationCertificate || profile?.businessRegistrationCertificate;
    const recyclerRegCert = profile?.RecyclerRegistrationCertificate || profile?.recyclerRegistrationCertificate;
    const consentToOperate = profile?.ConsentToOperate || profile?.consentToOperate;
    const hazWasteAuth = profile?.HazardousWasteAuthorization || profile?.hazardousWasteAuthorization;
    const addrProof = profile?.AddressProof || profile?.addressProof;
    const centerPhotoFile = profile?.CenterPhoto || profile?.centerPhoto;
    const authPersonId = profile?.AuthorizedPersonId || profile?.authorizedPersonId;

    const avatarInitial = centerName.charAt(0).toUpperCase();

    const documentsList = [
        {
            title: "Business Registration Cert",
            filename: busRegCert,
            folder: "buisness registration certificate",
            icon: <FiShield />,
            type: "business"
        },
        {
            title: "Recycler Registration Cert",
            filename: recyclerRegCert,
            folder: "recycler registration certificate",
            icon: <FiFileText />,
            type: "license"
        },
        {
            title: "Consent To Operate (CTO)",
            filename: consentToOperate,
            folder: "Consent To Operate",
            icon: <FiCheckCircle />,
            type: "consent"
        },
        {
            title: "Hazardous Waste Authorization",
            filename: hazWasteAuth,
            folder: "Hazardous Waste Authorization",
            icon: <FiZap />,
            type: "hazmat"
        },
        {
            title: "Facility Address Proof",
            filename: addrProof,
            folder: "Address Proof",
            icon: <FiMapPin />,
            type: "address"
        },
        {
            title: "Recycling Facility Photo",
            filename: centerPhotoFile,
            folder: "Center Photo",
            icon: <FiLayers />,
            type: "photo"
        },
        {
            title: "Authorized Person Gov ID",
            filename: authPersonId,
            folder: "AuthorizedPersonId",
            icon: <FiCheckCircle />,
            type: "identity"
        }
    ];

    const profileTabs = [
        { id: "personal", label: "Personal Information", icon: <FiUser /> },
        { id: "address", label: "Facility Address", icon: <FiMapPin /> },
        { id: "operations", label: "Operations & Capacity", icon: <FiCpu /> },
        { id: "legal", label: "Legal & Compliance", icon: <FiShield /> },
        { id: "documents", label: "Document Vault", icon: <FiFileText /> },
        { id: "security", label: "Security & Password", icon: <FiKey /> }
    ];

    return (
        <div className="recyc-dashboard-shell recyc-profile-layout">
            <Sidebar />

            <main className="recyc-dashboard-main">
                {/* Header Topbar */}
                <header className="recyc-dashboard-topbar">
                    <div className="topbar-title-group">
                        <div className="topbar-header-row">
                            <h1>Facility Profile &amp; Credentials</h1>
                        </div>
                        <p className="topbar-subtitle">
                            EcoCycle Industrial E-Waste Operations Center &bull; Certified Facility Overview
                        </p>
                    </div>

                    <div className="topbar-right-group">
                        <button
                            className="icon-button notif-bell-btn"
                            onClick={() => navigate("/recyclingcenter_notification")}
                            title="Notifications"
                        >
                            <FiBell />
                            {unreadNotifCount > 0 && (
                                <span className="notif-badge">{unreadNotifCount > 9 ? "9+" : unreadNotifCount}</span>
                            )}
                        </button>

                    </div>
                </header>

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
                    <div className="recyc-notice-banner success">
                        <FiCheckCircle />
                        <span>{successMessage}</span>
                        <button
                            onClick={() => setSuccessMessage("")}
                            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", marginLeft: "auto" }}
                        >
                            <FiX />
                        </button>
                    </div>
                )}

                {/* Error Banner */}
                {error && profile && (
                    <div className="recyc-notice-banner info" style={{ background: "#fef2f2", color: "#dc2626", borderColor: "#fca5a5" }}>
                        <FiAlertCircle />
                        <span>{error}</span>
                        <button
                            onClick={() => setError("")}
                            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", marginLeft: "auto" }}
                        >
                            <FiX />
                        </button>
                    </div>
                )}

                {/* 1. Horizontal Profile Navigation Tabs Bar */}
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
                                        <span className="fc-facility-tag">RC-{profile?.RecyclingCenterId || "005"}</span>
                                    </div>
                                    <p className="fc-card-subtitle">
                                        Update your recycling facility details, contact information, and operational collection preferences.
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
                                            placeholder="Recycling Center Name"
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
                                            placeholder="Authorized Managing Director / Owner"
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
                                        In order to access inbound recycling e-waste quota allocations and logistics scheduling, please ensure your account details remain verified and accurate. Verified by EcoCycle Operations.
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
                                        Physical industrial recycling plant address for inbound logistics drop-off and scrap transfer receiving.
                                    </p>
                                </div>
                            </div>

                            <div className="fc-form-body">
                                <div className="fc-grid-2">
                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">Building / Premises</label>
                                        <input
                                            type="text"
                                            className="fc-outline-input"
                                            value={isEditing ? editForm.buildingNumber : buildingNo}
                                            onChange={(e) => handleFormInputChange("buildingNumber", e.target.value)}
                                            placeholder="Building Number / Premises"
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
                                            placeholder="Street Name / Industrial Area"
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
                                        Accurate geographical coordinates ensure minimal transit latency for collection agent dispatches and e-waste pickups.
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
                                    <FiCpu />
                                </div>
                                <div className="fc-card-title-wrap">
                                    <h2 className="fc-card-title">Operations &amp; Technical Capacity</h2>
                                    <p className="fc-card-subtitle">
                                        E-waste processing capacity, mechanical processes, recovered material outputs, and hazardous waste handling.
                                    </p>
                                </div>
                            </div>

                            <div className="fc-form-body">
                                <div className="fc-field-box">
                                    <label className="fc-floating-label">Accepted Device Types</label>
                                    <input
                                        type="text"
                                        className="fc-outline-input"
                                        value={isEditing ? editForm.deviceTypes : deviceTypes}
                                        onChange={(e) => handleFormInputChange("deviceTypes", e.target.value)}
                                        placeholder="Comma-separated device categories (e.g. E-Waste, Mobiles, PCBs, Batteries)"
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="fc-field-box">
                                    <label className="fc-floating-label">Recycling &amp; Recovery Processes</label>
                                    <input
                                        type="text"
                                        className="fc-outline-input"
                                        value={isEditing ? editForm.recyclingProcesses : recyclingProcesses}
                                        onChange={(e) => handleFormInputChange("recyclingProcesses", e.target.value)}
                                        placeholder="Processes deployed (e.g. Shredding, Smelting, Metal Recovery)"
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="fc-choice-section">
                                    <label className="fc-floating-label" style={{ marginBottom: "0.6rem" }}>
                                        Hazardous Waste Handling Authorization
                                    </label>
                                    <div className="fc-choice-grid">
                                        <div
                                            className={`fc-choice-card ${(isEditing ? editForm.hazardousWasteHandling : hazardousWasteHandling) === "Yes" ? "selected" : ""}`}
                                            onClick={() => {
                                                if (isEditing) handleFormInputChange("hazardousWasteHandling", "Yes");
                                            }}
                                            style={{ cursor: isEditing ? "pointer" : "default" }}
                                        >
                                            {(isEditing ? editForm.hazardousWasteHandling : hazardousWasteHandling) === "Yes" && (
                                                <div className="fc-choice-check">
                                                    <FiCheck />
                                                </div>
                                            )}
                                            <div className="fc-choice-icon-wrap">
                                                <FiZap />
                                            </div>
                                            <div className="fc-choice-label">Hazardous Waste Authorized</div>
                                        </div>

                                        <div
                                            className={`fc-choice-card ${(isEditing ? editForm.hazardousWasteHandling : hazardousWasteHandling) !== "Yes" ? "selected" : ""}`}
                                            onClick={() => {
                                                if (isEditing) handleFormInputChange("hazardousWasteHandling", "No");
                                            }}
                                            style={{ cursor: isEditing ? "pointer" : "default" }}
                                        >
                                            {(isEditing ? editForm.hazardousWasteHandling : hazardousWasteHandling) !== "Yes" && (
                                                <div className="fc-choice-check">
                                                    <FiCheck />
                                                </div>
                                            )}
                                            <div className="fc-choice-icon-wrap">
                                                <FiShield />
                                            </div>
                                            <div className="fc-choice-label">Non-Hazardous Only</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="fc-grid-2">
                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">Recovered Materials Output</label>
                                        <input
                                            type="text"
                                            className="fc-outline-input"
                                            value={isEditing ? editForm.recoveredMaterials : (recoveredMaterials || "N/A")}
                                            onChange={(e) => handleFormInputChange("recoveredMaterials", e.target.value)}
                                            placeholder="e.g. Copper, Plastics, Gold, Aluminum"
                                            disabled={!isEditing}
                                        />
                                    </div>

                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">Hazardous Waste Scrap Types</label>
                                        <input
                                            type="text"
                                            className="fc-outline-input"
                                            value={isEditing ? editForm.hazardousWasteTypes : (hazardousWasteTypes || "N/A")}
                                            onChange={(e) => handleFormInputChange("hazardousWasteTypes", e.target.value)}
                                            placeholder="e.g. Lead, Mercury, Lithium-Ion"
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>

                                <div className="fc-info-note">
                                    <FiInfo className="fc-note-icon" />
                                    <p>
                                        Authorized handling permits and metallurgical recovery quotas are monitored under state environmental guidelines.
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
                                    <h2 className="fc-card-title">Legal &amp; Regulatory Compliance</h2>
                                    <p className="fc-card-subtitle">
                                        Government authorized registration, state pollution control board certifications, and GSTIN identification.
                                    </p>
                                </div>
                            </div>

                            <div className="fc-form-body">
                                <div className="fc-grid-2">
                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">
                                            Recycler Registration Number (Verified)
                                        </label>
                                        <div className="fc-input-with-icon">
                                            <input
                                                type="text"
                                                className="fc-outline-input locked"
                                                value={recyclerRegNo}
                                                disabled
                                                title="Official Recycler Registration identifier."
                                            />
                                            <FiShield className="fc-field-lock-icon" style={{ color: "#059669" }} />
                                        </div>
                                    </div>

                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">
                                            Business Registration Number (Verified)
                                        </label>
                                        <div className="fc-input-with-icon">
                                            <input
                                                type="text"
                                                className="fc-outline-input locked"
                                                value={busRegNo}
                                                disabled
                                                title="Verified government business registration number."
                                            />
                                            <FiShield className="fc-field-lock-icon" style={{ color: "#059669" }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="fc-grid-2">
                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">GST Identification Number (GSTIN)</label>
                                        <div className="fc-input-with-icon">
                                            <input
                                                type="text"
                                                className="fc-outline-input locked"
                                                value={gstNo}
                                                disabled
                                                title="GST identification number."
                                            />
                                            <FiShield className="fc-field-lock-icon" style={{ color: "#059669" }} />
                                        </div>
                                    </div>

                                    <div className="fc-field-box">
                                        <label className="fc-floating-label">Hazardous Waste Authorization Status</label>
                                        <div className="fc-input-with-icon">
                                            <input
                                                type="text"
                                                className="fc-outline-input locked"
                                                value={hazardousWasteHandling === "Yes" ? "Authorized (SPCB Compliant)" : "Standard Handling"}
                                                disabled
                                                title="Pollution control board authorization status."
                                            />
                                            <FiShield className="fc-field-lock-icon" style={{ color: "#059669" }} />
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
                                        Official licenses, regulatory authorizations, identity proofs, and facility photographs uploaded during onboarding.
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
                                    All uploaded compliance certificates are encrypted and archived under EcoCycle regulatory standards.
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
                                                placeholder="Enter new password (8-15 characters)"
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
                <div className="recyc-modal-overlay" onClick={() => setActiveDoc(null)}>
                    <div
                        className="recyc-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="recyc-modal-header">
                            <h3 className="recyc-modal-title">{activeDoc.title}</h3>
                            <button
                                type="button"
                                className="recyc-modal-close"
                                onClick={() => setActiveDoc(null)}
                            >
                                <FiX />
                            </button>
                        </div>
                        <div className="recyc-modal-body">
                            {activeDoc.url.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? (
                                <img
                                    src={activeDoc.url}
                                    alt={activeDoc.title}
                                    className="recyc-modal-img"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.alt = "Failed to load document image preview.";
                                    }}
                                />
                            ) : activeDoc.url.toLowerCase().endsWith(".pdf") ? (
                                <iframe
                                    src={activeDoc.url}
                                    title={activeDoc.title}
                                    style={{ width: "100%", height: "550px", border: "none", borderRadius: "12px" }}
                                />
                            ) : (
                                <div style={{ textAlign: "center", padding: "2rem" }}>
                                    <FiFileText style={{ fontSize: "3rem", color: "#059669" }} />
                                    <p style={{ marginTop: "1rem", color: "#475569" }}>
                                        Document File: <strong>{activeDoc.filename || activeDoc.title}</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="recyc-modal-footer">
                            <a
                                href={activeDoc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="fc-btn-save"
                                style={{ textDecoration: "none" }}
                            >
                                <FiExternalLink /> Open Original Document
                            </a>
                            <button
                                type="button"
                                className="fc-btn-cancel"
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

export default RecycleProfile;
