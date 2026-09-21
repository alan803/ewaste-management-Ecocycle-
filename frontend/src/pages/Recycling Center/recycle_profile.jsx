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
    FiBell
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
                "https://localhost:7102/api/RecyclingCenter/verify-password",
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
                "https://localhost:7102/api/RecyclingCenter/change-password",
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
            const res = await axios.get("https://localhost:7102/api/Notificationcon/my_notifications", {
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
            return `https://localhost:7102/uploads/${cleanName.replace("\\", "/")}`;
        }
        return folderName
            ? `https://localhost:7102/uploads/recycling/${folderName}/${cleanName}`
            : `https://localhost:7102/uploads/${cleanName}`;
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
                "https://localhost:7102/api/RecyclingCenter/myprofile",
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
                "https://localhost:7102/api/RecyclingCenter/update-profile",
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
                    <div className="loading-container">
                        <FiRefreshCw className="spin-icon" style={{ fontSize: "1.8rem", color: "#10b981" }} />
                        <p>Loading facility profile...</p>
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
                    <div className="empty-container">
                        <FiAlertCircle style={{ fontSize: "2.5rem", color: "#ef4444" }} />
                        <h4>Profile Load Error</h4>
                        <p>{error}</p>
                        <button
                            className="btn btn-emerald"
                            style={{ marginTop: "1rem" }}
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

    return (
        <div className="recyc-dashboard-shell">
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

                        <Link to="/recycle_profile" className="profile-chip">
                            <div className="profile-avatar">
                                {avatarInitial}
                            </div>
                            <span className="profile-name">{centerName}</span>
                        </Link>
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

                {/* Hero Facility Header Banner Card */}
                <div className="recyc-hero-card">
                    <div className="recyc-hero-banner"></div>

                    <div className="recyc-hero-content">
                        <div className="recyc-hero-profile-group">
                            <div className="recyc-avatar-frame">
                                {profileImagePreview ? (
                                    <img
                                        src={profileImagePreview}
                                        alt={centerName}
                                        className="recyc-avatar-img"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.style.display = "none";
                                            e.target.nextSibling.style.display = "flex";
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="recyc-avatar-fallback"
                                    style={{ display: profileImagePreview ? "none" : "flex" }}
                                >
                                    {avatarInitial}
                                </div>
                                <div className="recyc-verified-badge" title="Certified Recycling Center">
                                    <FiCheck />
                                </div>

                                <button
                                    type="button"
                                    className="recyc-avatar-camera-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Upload facility picture"
                                >
                                    <FiCamera />
                                </button>
                            </div>

                            <div className="recyc-hero-info">
                                <div className="recyc-flat-title-row">
                                    <h2 className="recyc-flat-name">{centerName}</h2>
                                    <span className="recyc-facility-code">
                                        Facility ID: RC-{profile?.RecyclingCenterId || "005"}
                                    </span>
                                </div>
                                <div className="recyc-flat-subtext">
                                    <span className="recyc-subtext-item">
                                        <FiMail /> {email}
                                    </span>
                                    <span className="recyc-subtext-item">
                                        <FiPhone /> {phone}
                                    </span>
                                    <span className="recyc-subtext-item">
                                        <FiMapPin /> {city}, {state}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="recyc-hero-actions">
                            {!isEditing ? (
                                <button
                                    type="button"
                                    className="btn btn-emerald"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <FiEdit3 /> Edit Profile
                                </button>
                            ) : (
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button
                                        type="button"
                                        className="btn btn-emerald"
                                        onClick={handleSaveChanges}
                                        disabled={saving}
                                    >
                                        <FiSave /> {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-ghost"
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
                                    className="btn btn-ghost"
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
                </div>

                {/* Change Password Card UI (Step 1 & Step 2 Flow) */}
                {showPasswordSection && (
                    <div className="recyc-password-panel">
                        <div className="recyc-password-card-header">
                            <div className="recyc-password-card-title-group">
                                <FiKey style={{ color: "#059669", fontSize: "1.15rem" }} />
                                <h3 className="panel-title" style={{ margin: 0 }}>
                                    {passwordStep === 1 ? "Verify Current Password" : "Set New Password"}
                                </h3>
                                <span className="recyc-step-badge">Step {passwordStep} of 2</span>
                            </div>
                            <button
                                type="button"
                                className="modal-close-icon"
                                style={{ background: "#f1f5f9", color: "#0f172a" }}
                                onClick={handleResetPasswordForm}
                                title="Close Password Form"
                            >
                                <FiX />
                            </button>
                        </div>

                        {/* Error Alert Message */}
                        {passwordError && (
                            <div className="recyc-notice-banner info" style={{ background: "#fef2f2", color: "#dc2626", borderColor: "#fca5a5", marginBottom: "1rem" }}>
                                <FiAlertCircle />
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
                                    <label className="form-label">
                                        <FiLock style={{ color: "#059669" }} /> Current Password
                                    </label>
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            className="form-textarea"
                                            style={{ paddingRight: "2.5rem", height: "42px" }}
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
                                        className="btn btn-ghost"
                                        style={{ flex: 1, justifyContent: "center" }}
                                        onClick={handleResetPasswordForm}
                                        disabled={passwordLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-emerald"
                                        style={{ flex: 1.2, justifyContent: "center" }}
                                        disabled={passwordLoading}
                                    >
                                        {passwordLoading ? "Verifying..." : "Verify Password"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            /* STEP 2: Enter New Password and Confirm Password */
                            <form onSubmit={handleUpdateNewPassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <p style={{ fontSize: "0.825rem", color: "#475569", margin: "0 0 0.4rem 0" }}>
                                    Password verified! Enter your new password below:
                                </p>

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    <label className="form-label">
                                        <FiLock style={{ color: "#059669" }} /> New Password
                                    </label>
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            className="form-textarea"
                                            style={{ paddingRight: "2.5rem", height: "42px" }}
                                            placeholder="Enter new password (8-15 chars)"
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

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    <label className="form-label">
                                        <FiCheckCircle style={{ color: "#059669" }} /> Confirm New Password
                                    </label>
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="form-textarea"
                                            style={{ paddingRight: "2.5rem", height: "42px" }}
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
                                        className="btn btn-ghost"
                                        style={{ flex: 1, justifyContent: "center" }}
                                        onClick={handleResetPasswordForm}
                                        disabled={passwordLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-emerald"
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

                {/* Structured Multi-Card Grid */}
                <div className="recyc-profile-grid">
                    {/* Card 1: Facility & Contact Overview */}
                    <div className="recyc-main-panel">
                        <div className="recyc-card-header">
                            <div className="recyc-card-icon-wrapper">
                                <FiRefreshCw />
                            </div>
                            <h3 className="panel-title" style={{ margin: 0 }}>Facility Information</h3>
                        </div>

                        {!isEditing ? (
                            <div className="recyc-details-list">
                                <div className="recyc-detail-item">
                                    <span className="recyc-detail-label">Center Name</span>
                                    <span className="recyc-detail-value bold">{centerName}</span>
                                </div>
                                <div className="recyc-detail-item">
                                    <span className="recyc-detail-label">Authorized Owner</span>
                                    <span className="recyc-detail-value">{ownerName}</span>
                                </div>
                                <div className="recyc-detail-item">
                                    <span className="recyc-detail-label">Registered Email</span>
                                    <span className="recyc-detail-value">{email}</span>
                                </div>
                                <div className="recyc-detail-item">
                                    <span className="recyc-detail-label">Phone Contact</span>
                                    <span className="recyc-detail-value">{phone}</span>
                                </div>
                                <div className="recyc-detail-item">
                                    <span className="recyc-detail-label">Experience</span>
                                    <span className="recyc-detail-value">{experienceYears} Years</span>
                                </div>
                                <div className="recyc-detail-item">
                                    <span className="recyc-detail-label">Pickup Service</span>
                                    <span className="recyc-pill pill-completed">{pickupAvailable}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="recyc-edit-form-grid">
                                <div className="recyc-form-group">
                                    <label>Center Name</label>
                                    <input
                                        type="text"
                                        className="recyc-form-input"
                                        value={editForm.centerName}
                                        onChange={(e) => handleFormInputChange("centerName", e.target.value)}
                                    />
                                </div>
                                <div className="recyc-form-group">
                                    <label>Owner Name</label>
                                    <input
                                        type="text"
                                        className="recyc-form-input"
                                        value={editForm.ownerName}
                                        onChange={(e) => handleFormInputChange("ownerName", e.target.value)}
                                    />
                                </div>
                                <div className="recyc-form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="text"
                                        className="recyc-form-input"
                                        value={editForm.phoneNumber}
                                        onChange={(e) => handleFormInputChange("phoneNumber", e.target.value)}
                                    />
                                </div>
                                <div className="recyc-form-group">
                                    <label>Experience (Years)</label>
                                    <input
                                        type="number"
                                        className="recyc-form-input"
                                        value={editForm.experienceYears}
                                        onChange={(e) => handleFormInputChange("experienceYears", e.target.value)}
                                    />
                                </div>
                                <div className="recyc-form-group">
                                    <label>Pickup Service Available</label>
                                    <select
                                        className="recyc-form-input"
                                        value={editForm.pickupAvailable}
                                        onChange={(e) => handleFormInputChange("pickupAvailable", e.target.value)}
                                    >
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card 2: Regulatory Registrations (Locked Read-Only) */}
                    <div className="recyc-main-panel">
                        <div className="recyc-card-header">
                            <div className="recyc-card-icon-wrapper">
                                <FiShield />
                            </div>
                            <h3 className="panel-title" style={{ margin: 0 }}>Regulatory Compliance</h3>
                        </div>

                        <div className="recyc-details-list">
                            <div className="recyc-detail-item">
                                <span className="recyc-detail-label">Business Reg No</span>
                                <span className="recyc-detail-value lock-badge">
                                    <FiLock /> {busRegNo}
                                </span>
                            </div>
                            <div className="recyc-detail-item">
                                <span className="recyc-detail-label">Recycler Reg No</span>
                                <span className="recyc-detail-value lock-badge">
                                    <FiLock /> {recyclerRegNo}
                                </span>
                            </div>
                            <div className="recyc-detail-item">
                                <span className="recyc-detail-label">GST No</span>
                                <span className="recyc-detail-value lock-badge">
                                    <FiLock /> {gstNo}
                                </span>
                            </div>
                            <div className="recyc-detail-item">
                                <span className="recyc-detail-label">Hazardous Waste Auth</span>
                                <span className="recyc-pill pill-completed">{hazardousWasteHandling === "Yes" ? "Authorized" : "N/A"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Location Address */}
                    <div className="recyc-main-panel">
                        <div className="recyc-card-header">
                            <div className="recyc-card-icon-wrapper">
                                <FiMapPin />
                            </div>
                            <h3 className="panel-title" style={{ margin: 0 }}>Facility Location</h3>
                        </div>

                        {!isEditing ? (
                            <div className="recyc-details-list">
                                <div className="recyc-detail-item">
                                    <span className="recyc-detail-label">Building / Premises</span>
                                    <span className="recyc-detail-value">{buildingNo}</span>
                                </div>
                                <div className="recyc-detail-item">
                                    <span className="recyc-detail-label">Street / Area</span>
                                    <span className="recyc-detail-value">{street}</span>
                                </div>
                                <div className="recyc-detail-item">
                                    <span className="recyc-detail-label">City &amp; District</span>
                                    <span className="recyc-detail-value">{city}, {district}</span>
                                </div>
                                <div className="recyc-detail-item">
                                    <span className="recyc-detail-label">State &amp; Pincode</span>
                                    <span className="recyc-detail-value">{state} - {pincode}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="recyc-edit-form-grid">
                                <div className="recyc-form-group">
                                    <label>Building Number</label>
                                    <input
                                        type="text"
                                        className="recyc-form-input"
                                        value={editForm.buildingNumber}
                                        onChange={(e) => handleFormInputChange("buildingNumber", e.target.value)}
                                    />
                                </div>
                                <div className="recyc-form-group">
                                    <label>Street</label>
                                    <input
                                        type="text"
                                        className="recyc-form-input"
                                        value={editForm.street}
                                        onChange={(e) => handleFormInputChange("street", e.target.value)}
                                    />
                                </div>
                                <div className="recyc-form-group">
                                    <label>City</label>
                                    <input
                                        type="text"
                                        className="recyc-form-input"
                                        value={editForm.city}
                                        onChange={(e) => handleFormInputChange("city", e.target.value)}
                                    />
                                </div>
                                <div className="recyc-form-group">
                                    <label>District</label>
                                    <input
                                        type="text"
                                        className="recyc-form-input"
                                        value={editForm.district}
                                        onChange={(e) => handleFormInputChange("district", e.target.value)}
                                    />
                                </div>
                                <div className="recyc-form-group">
                                    <label>State</label>
                                    <input
                                        type="text"
                                        className="recyc-form-input"
                                        value={editForm.state}
                                        onChange={(e) => handleFormInputChange("state", e.target.value)}
                                    />
                                </div>
                                <div className="recyc-form-group">
                                    <label>Pincode</label>
                                    <input
                                        type="text"
                                        className="recyc-form-input"
                                        value={editForm.pincode}
                                        onChange={(e) => handleFormInputChange("pincode", e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card 4: Operations, Processes & Materials */}
                    <div className="recyc-main-panel">
                        <div className="recyc-card-header">
                            <div className="recyc-card-icon-wrapper">
                                <FiCpu />
                            </div>
                            <h3 className="panel-title" style={{ margin: 0 }}>Capabilities</h3>
                        </div>

                        {!isEditing ? (
                            <div className="recyc-details-list">
                                <div className="recyc-detail-item">
                                    <span className="recyc-detail-label">Accepted Device Types</span>
                                    <span className="recyc-detail-value">{deviceTypes}</span>
                                </div>
                                <div className="recyc-detail-item">
                                    <span className="recyc-detail-label">Recycling Processes</span>
                                    <span className="recyc-detail-value">{recyclingProcesses}</span>
                                </div>
                                <div className="recyc-detail-item">
                                    <span className="recyc-detail-label">Recovered Materials</span>
                                    <span className="recyc-detail-value">{recoveredMaterials || "N/A"}</span>
                                </div>
                                <div className="recyc-detail-item">
                                    <span className="recyc-detail-label">Hazardous Waste Types</span>
                                    <span className="recyc-detail-value">{hazardousWasteTypes || "N/A"}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="recyc-edit-form-grid">
                                <div className="recyc-form-group">
                                    <label>Accepted Device Types</label>
                                    <input
                                        type="text"
                                        className="recyc-form-input"
                                        value={editForm.deviceTypes}
                                        onChange={(e) => handleFormInputChange("deviceTypes", e.target.value)}
                                    />
                                </div>
                                <div className="recyc-form-group">
                                    <label>Recycling Processes</label>
                                    <input
                                        type="text"
                                        className="recyc-form-input"
                                        value={editForm.recyclingProcesses}
                                        onChange={(e) => handleFormInputChange("recyclingProcesses", e.target.value)}
                                    />
                                </div>
                                <div className="recyc-form-group">
                                    <label>Recovered Materials Output</label>
                                    <input
                                        type="text"
                                        className="recyc-form-input"
                                        value={editForm.recoveredMaterials}
                                        onChange={(e) => handleFormInputChange("recoveredMaterials", e.target.value)}
                                    />
                                </div>
                                <div className="recyc-form-group">
                                    <label>Hazardous Waste Types</label>
                                    <input
                                        type="text"
                                        className="recyc-form-input"
                                        value={editForm.hazardousWasteTypes}
                                        onChange={(e) => handleFormInputChange("hazardousWasteTypes", e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Documents & Compliance Credentials Section */}
                <div className="recyc-documents-panel">
                    <div className="panel-header-row">
                        <div>
                            <h2 className="panel-title">Verified Compliance Documents &amp; Licenses</h2>
                            <p className="panel-subtitle">Government compliance certificates and facility operational permits</p>
                        </div>
                    </div>

                    <div className="recyc-documents-grid">
                        {documentsList.map((doc, idx) => {
                            const url = getMediaUrl(doc.filename, doc.folder);
                            return (
                                <div key={idx} className="recyc-doc-card">
                                    <div className="recyc-doc-icon-badge">
                                        {doc.icon}
                                    </div>
                                    <div className="recyc-doc-details">
                                        <h4 className="recyc-doc-title">{doc.title}</h4>
                                        <p className="recyc-doc-status">
                                            {url ? (
                                                <span className="recyc-pill pill-completed"><FiCheckCircle /> Uploaded</span>
                                            ) : (
                                                <span className="recyc-pill pill-expired"><FiAlertCircle /> Pending</span>
                                            )}
                                        </p>
                                    </div>
                                    {url && (
                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            onClick={() => setActiveDoc({ title: doc.title, url })}
                                        >
                                            <FiEye /> View
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Modal Document Viewer */}
                {activeDoc && (
                    <div className="recyc-modal-backdrop" onClick={() => setActiveDoc(null)}>
                        <div className="recyc-modal-content" style={{ maxWidth: "800px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
                            <div className="recyc-modal-header">
                                <h3>{activeDoc.title}</h3>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <a
                                        href={activeDoc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="modal-close-icon"
                                        title="Open in new tab"
                                    >
                                        <FiExternalLink />
                                    </a>
                                    <button
                                        type="button"
                                        className="modal-close-icon"
                                        onClick={() => setActiveDoc(null)}
                                    >
                                        <FiX />
                                    </button>
                                </div>
                            </div>
                            <div className="recyc-modal-body" style={{ padding: "1rem" }}>
                                {activeDoc.url.toLowerCase().endsWith(".pdf") ? (
                                    <iframe
                                        src={activeDoc.url}
                                        title={activeDoc.title}
                                        style={{ width: "100%", height: "550px", border: "none", borderRadius: "12px" }}
                                    />
                                ) : (
                                    <img
                                        src={activeDoc.url}
                                        alt={activeDoc.title}
                                        style={{ width: "100%", maxHeight: "550px", objectFit: "contain", borderRadius: "12px" }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default RecycleProfile;
