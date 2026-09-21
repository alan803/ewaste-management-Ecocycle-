import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
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
    FiTruck,
    FiCreditCard,
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
    FiNavigation
} from "react-icons/fi";
import "./Profile.css";

function Profile() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showAccountNo, setShowAccountNo] = useState(false);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    // Profile & Vehicle File Upload State
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedInsuranceFile, setSelectedInsuranceFile] = useState(null);
    const [selectedPollutionFile, setSelectedPollutionFile] = useState(null);
    const [selectedVehiclePhotoFile, setSelectedVehiclePhotoFile] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        alternatePhone: "",
        dob: "",
        gender: "",
        address: "",
        city: "",
        district: "",
        state: "",
        pincode: "",
        accountHolder: "",
        bankName: "",
        accountNo: "",
        ifsc: "",
        vehicleType: "",
        vehicleNumber: "",
        licenseNumber: ""
    });

    // Password Change UI & Verification state (same concept as Insp_profile.jsx)
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
                "https://localhost:7102/api/CollectionAgent/verify-password",
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
                "https://localhost:7102/api/CollectionAgent/change-password",
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

    // Modal state for viewing document preview
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
            return `https://localhost:7102/uploads/${cleanName.replace(/\\/g, "/")}`;
        }
        return folderName
            ? `https://localhost:7102/uploads/${folderName}/${cleanName}`
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
                "https://localhost:7102/api/CollectionAgent/myprofile",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = response.data || {};
            console.log("Collection Agent Profile Data:", data);
            setProfile(data);

            // Extract First and Last Name
            let fName = data.FirstName || data.firstName || "";
            let lName = data.LastName || data.lastName || "";
            if (!fName && (data.Name || data.name)) {
                const parts = (data.Name || data.name).split(" ");
                fName = parts[0] || "";
                lName = parts.slice(1).join(" ") || "";
            }

            // Extract DOB string (YYYY-MM-DD format for date input)
            let dobStr = "";
            const rawDob = data.dob || data.DOB;
            if (rawDob) {
                try {
                    dobStr = new Date(rawDob).toISOString().split("T")[0];
                } catch {
                    dobStr = String(rawDob).split("T")[0];
                }
            }

            // Populate Edit Form State
            setEditForm({
                firstName: fName,
                lastName: lName,
                phone: data.Phone || data.phone || "",
                alternatePhone: data.Alternate_phone || data.alternate_phone || data.alternatePhone || "",
                dob: dobStr,
                gender: data.gender || data.Gender || "Male",
                address: data.address || data.Address || "",
                city: data.city || data.City || "",
                district: data.district || data.District || "",
                state: data.state || data.State || "",
                pincode: data.pincode || data.Pincode || "",
                accountHolder: data.accoundholder || data.accountHolder || data.AccountHolder || fName,
                bankName: data.bankname || data.bankName || data.BankName || "",
                accountNo: data.account_no || data.accountNumber || data.AccountNumber || "",
                ifsc: data.ifsc_code || data.ifscCode || data.IFSCCode || "",
                vehicleType: data.vehicletype || data.vehicleType || data.VehicleType || "E-Three Wheeler Cargo",
                vehicleNumber: data.vehicleno || data.vehicleNumber || data.VehicleNumber || "",
                licenseNumber: data.licensenumber || data.licenseNumber || data.LicenseNumber || ""
            });

            // Set Avatar Preview
            const img = data.Profilepicture || data.profilepicture || data.profilePicture;
            if (img) {
                setProfileImagePreview(getMediaUrl(img, "profile"));
            }

        } catch (err) {
            console.error("Unable to load profile:", err);
            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
                localStorage.clear();
                setTimeout(() => navigate("/"), 2000);
            } else {
                setError(
                    err.response?.data?.message ||
                        "Failed to retrieve profile details from server."
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Profile Picture File Change Handler (Same upload flow as Manage_userprofile)
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic image type validation
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
        setSelectedInsuranceFile(null);
        setSelectedPollutionFile(null);
        setSelectedVehiclePhotoFile(null);
        setError("");
        setSuccessMessage("");
        // Reset image preview to loaded profile picture
        const img = profile?.Profilepicture || profile?.profilepicture || profile?.profilePicture;
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
        formData.append("Phone", editForm.phone);
        formData.append("AlternatePhone", editForm.alternatePhone);
        if (editForm.dob) formData.append("DOB", editForm.dob);
        formData.append("Gender", editForm.gender);
        formData.append("Address", editForm.address);
        formData.append("City", editForm.city);
        formData.append("District", editForm.district);
        formData.append("State", editForm.state);
        formData.append("Pincode", editForm.pincode);
        formData.append("AccountHolder", editForm.accountHolder);
        formData.append("BankName", editForm.bankName);
        formData.append("AccountNumber", editForm.accountNo);
        formData.append("IFSCCode", editForm.ifsc);
        formData.append("VehicleType", editForm.vehicleType);
        formData.append("VehicleNumber", editForm.vehicleNumber);
        formData.append("LicenseNumber", editForm.licenseNumber);

        if (selectedFile) {
            formData.append("ProfilePicture", selectedFile);
        }
        if (selectedInsuranceFile) {
            formData.append("VehicleInsurance", selectedInsuranceFile);
        }
        if (selectedPollutionFile) {
            formData.append("VehiclePollution", selectedPollutionFile);
        }
        if (selectedVehiclePhotoFile) {
            formData.append("VehiclePhoto", selectedVehiclePhotoFile);
        }

        try {
            const response = await axios.post(
                "https://localhost:7102/api/CollectionAgent/update-profile",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setSuccessMessage("Profile updated successfully!");
            setIsEditing(false);
            setSelectedFile(null);
            setSelectedInsuranceFile(null);
            setSelectedPollutionFile(null);
            setSelectedVehiclePhotoFile(null);

            // Also update localStorage name if returned
            if (editForm.firstName) {
                localStorage.setItem("firstName", editForm.firstName);
            }

            // Reload profile data
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

    if (loading) {
        return (
            <div className="agent-profile-layout">
                <Sidebar />
                <div className="agent-profile-main">
                    <Navbar
                        hasSidebar={true}
                        pageTitle="Agent Profile & Credentials"
                        pageSubtitle="EcoCycle Field Operations • Verified Collection Agent Account"
                        pageIcon={<FiUser />}
                        unreadNotifCount={unreadNotifCount}
                    />
                    <div style={{ marginTop: "1.5rem" }}>
                        <div className="agent-skeleton-card">
                            <div className="agent-skeleton-line" style={{ width: "40%", height: "30px" }}></div>
                            <div className="agent-skeleton-line" style={{ width: "60%" }}></div>
                            <div className="agent-skeleton-line" style={{ width: "100%", height: "120px", marginTop: "1rem" }}></div>
                            <div className="agent-skeleton-line" style={{ width: "80%" }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="agent-profile-layout">
                <Sidebar />
                <div className="agent-profile-main">
                    <Navbar
                        hasSidebar={true}
                        pageTitle="Agent Profile & Credentials"
                        pageSubtitle="EcoCycle Field Operations • Verified Collection Agent Account"
                        pageIcon={<FiUser />}
                        unreadNotifCount={unreadNotifCount}
                    />
                    <div className="agent-error-container">
                        <div className="agent-error-icon">
                            <FiAlertCircle />
                        </div>
                        <h2 className="agent-error-title">Profile Load Error</h2>
                        <p className="agent-error-msg">{error}</p>
                        <button
                            className="agent-retry-btn"
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
    const name = profile?.Name || profile?.name || `${editForm.firstName} ${editForm.lastName}`.trim() || "Field Officer";
    const email = profile?.Email || profile?.email || "N/A";
    const phone = profile?.Phone || profile?.phone || "N/A";
    const altPhone = profile?.Alternate_phone || profile?.alternate_phone || profile?.alternatePhone || "N/A";
    const dob = profile?.dob || profile?.DOB || "N/A";
    const gender = profile?.gender || profile?.Gender || "N/A";

    // 🔒 Strictly Locked / Read-Only Fields (EV Logistics & Vehicle Details)
    const adhaarNo = profile?.adharnumber || profile?.adhaarNumber || profile?.AdhaarNumber || "N/A";
    const adhaarProof = profile?.adharproof || profile?.adhaarProof || profile?.AdhaarProof;

    const address = profile?.address || profile?.Address || "N/A";
    const state = profile?.state || profile?.State || "N/A";
    const district = profile?.district || profile?.District || "N/A";
    const city = profile?.city || profile?.City || "N/A";
    const pincode = profile?.pincode || profile?.Pincode || "N/A";

    const vehicleType = profile?.vehicletype || profile?.vehicleType || profile?.VehicleType || "E-Three Wheeler Cargo";
    const vehicleNo = profile?.vehicleno || profile?.vehicleNumber || profile?.VehicleNumber || "N/A";
    const vehiclePollution = profile?.vehicelpollution || profile?.vehiclePollution || profile?.VehiclePollution;
    const vehicleInsurance = profile?.vehicleinsurance || profile?.vehicleInsurance || profile?.VehicleInsurance;
    const vehiclePhoto = profile?.vehiclephoto || profile?.vehiclePhoto || profile?.VehiclePhoto;
    const licenseNo = profile?.licensenumber || profile?.licenseNumber || profile?.LicenseNumber || "N/A";

    const accountHolder = profile?.accoundholder || profile?.accountHolder || profile?.AccountHolder || name;
    const bankName = profile?.bankname || profile?.bankName || profile?.BankName || "N/A";
    const accountNo = profile?.account_no || profile?.accountNumber || profile?.AccountNumber || "N/A";
    const ifsc = profile?.ifsc_code || profile?.ifscCode || profile?.IFSCCode || "N/A";

    const avatarInitial = name.charAt(0).toUpperCase();

    // Mask account number for security
    const maskedAccountNo = accountNo !== "N/A" && accountNo.length > 4
        ? "•".repeat(accountNo.length - 4) + accountNo.slice(-4)
        : accountNo;

    const documentsList = [
        {
            title: "Aadhaar Card Proof",
            filename: adhaarProof,
            folder: "aadhaar",
            icon: <FiShield />,
            type: "identity"
        },
        {
            title: "Driving License / Insurance",
            filename: vehicleInsurance,
            folder: "insurance",
            icon: <FiFileText />,
            type: "insurance"
        },
        {
            title: "Pollution Certificate",
            filename: vehiclePollution,
            folder: "pollution",
            icon: <FiCheckCircle />,
            type: "pollution"
        },
        {
            title: "EV Vehicle Photo",
            filename: vehiclePhoto,
            folder: "vehicle",
            icon: <FiTruck />,
            type: "vehicle"
        }
    ];

    return (
        <div className="agent-profile-layout">
            <Sidebar />

            <div className="agent-profile-main">
                <Navbar
                    hasSidebar={true}
                    pageTitle="Agent Profile & Credentials"
                    pageSubtitle="EcoCycle Field Operations • Verified Collection Agent Account"
                    pageIcon={<FiUser />}
                    unreadNotifCount={unreadNotifCount}
                />

                {/* Hidden File Input for Avatar Photo Upload */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    style={{ display: "none" }}
                />

                {/* Success Message Banner */}
                {successMessage && (
                    <div className="agent-success-alert">
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

                {/* Error Banner if update failed */}
                {error && profile && (
                    <div className="agent-success-alert" style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#ef4444" }}>
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

                {/* Hero Header Card */}
                <div className="agent-hero-card">
                    <div className="agent-hero-banner">
                        <div className="agent-hero-banner-pattern"></div>
                    </div>
                    <div className="agent-hero-body">
                        <div className="agent-hero-profile-wrap">
                            <div className="agent-avatar-frame">
                                {profileImagePreview ? (
                                    <img
                                        src={profileImagePreview}
                                        alt={name}
                                        className="agent-avatar-img"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.style.display = "none";
                                            e.target.nextSibling.style.display = "flex";
                                        }}
                                    />
                                ) : null}
                                <div
                                    className="agent-avatar-fallback"
                                    style={{ display: profileImagePreview ? "none" : "flex" }}
                                >
                                    {avatarInitial}
                                </div>
                                <div className="agent-verified-badge" title="Verified Agent">
                                    <FiCheck />
                                </div>

                                {/* Camera Upload Button Overlay */}
                                <button
                                    type="button"
                                    className="agent-avatar-camera-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Upload new profile picture"
                                >
                                    <FiCamera />
                                </button>
                            </div>

                            <div className="agent-hero-info">
                                <div className="agent-hero-name-row">
                                    <h2 className="agent-hero-name">{name}</h2>
                                    
                                </div>
                                <div className="agent-hero-subtext">
                                    <span className="agent-subtext-item">
                                        <FiMail /> {email}
                                    </span>
                                    <span className="agent-subtext-item">
                                        <FiPhone /> {phone}
                                    </span>
                                    <span className="agent-subtext-item">
                                        <FiMapPin /> {city}, {state}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="agent-hero-actions">
                            {!isEditing ? (
                                <button
                                    type="button"
                                    className="agent-edit-btn"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <FiEdit3 /> Edit Profile
                                </button>
                            ) : (
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button
                                        type="button"
                                        className="agent-save-btn"
                                        onClick={handleSaveChanges}
                                        disabled={saving}
                                    >
                                        <FiSave /> {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                    <button
                                        type="button"
                                        className="agent-cancel-btn"
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
                                    className="agent-edit-btn"
                                    style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #cbd5e1" }}
                                    onClick={() => {
                                        handleResetPasswordForm();
                                        setShowPasswordSection(true);
                                    }}
                                >
                                    <FiKey /> Change Password
                                </button>
                            )}

                            <div className="agent-id-badge-btn" style={{ marginLeft: "0.5rem" }}>
                                <FiAward />
                                <span>Agent ID: CA-{profile?.CollectionAgentId || "042"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Change Password Simple Card UI */}
                {showPasswordSection && (
                    <div className="password-change-card">
                        <div className="password-card-header">
                            <div className="password-card-title-group">
                                <FiKey style={{ color: "#059669", fontSize: "1.15rem" }} />
                                <h3 className="agent-card-title" style={{ margin: 0, fontSize: "1rem", fontWeight: "700" }}>
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
                            <form onSubmit={handleVerifyCurrentPassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <p style={{ fontSize: "0.825rem", color: "#475569", margin: "0 0 0.4rem 0" }}>
                                    Enter your current password to proceed:
                                </p>

                                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.775rem", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>
                                        <FiLock style={{ color: "#059669" }} /> Current Password
                                    </label>
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            className="agent-input"
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
                                        className="agent-cancel-btn"
                                        style={{ flex: 1, justifyContent: "center" }}
                                        onClick={handleResetPasswordForm}
                                        disabled={passwordLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="agent-save-btn"
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
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.775rem", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>
                                        <FiLock style={{ color: "#059669" }} /> New Password
                                    </label>
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            className="agent-input"
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
                                        <FiLock style={{ color: "#059669" }} /> Confirm New Password
                                    </label>
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="agent-input"
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
                                        className="agent-cancel-btn"
                                        style={{ flex: 1, justifyContent: "center" }}
                                        onClick={handleResetPasswordForm}
                                        disabled={passwordLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="agent-save-btn"
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

                {/* Quick Metrics Ribbon */}
                <div className="agent-metrics-grid">
                    <div className="agent-metric-card">
                        <div className="agent-metric-icon emerald">
                            <FiTruck />
                        </div>
                        <div className="agent-metric-text">
                            <div className="agent-metric-label">Assigned Vehicle</div>
                            <div className="agent-metric-val">{vehicleNo}</div>
                        </div>
                    </div>

                    <div className="agent-metric-card">
                        <div className="agent-metric-icon blue">
                            <FiShield />
                        </div>
                        <div className="agent-metric-text">
                            <div className="agent-metric-label">Driving License</div>
                            <div className="agent-metric-val">{licenseNo}</div>
                        </div>
                    </div>

                    <div className="agent-metric-card">
                        <div className="agent-metric-icon purple">
                            <FiNavigation />
                        </div>
                        <div className="agent-metric-text">
                            <div className="agent-metric-label">Primary Zone</div>
                            <div className="agent-metric-val">{city}</div>
                        </div>
                    </div>

                    <div className="agent-metric-card">
                        <div className="agent-metric-icon amber">
                            <FiCreditCard />
                        </div>
                        <div className="agent-metric-text">
                            <div className="agent-metric-label">Settlement Bank</div>
                            <div className="agent-metric-val">{bankName}</div>
                        </div>
                    </div>
                </div>

                {/* Profile Details Cards Grid */}
                <div className="agent-details-grid">
                    {/* Personal Information Card (Editable) */}
                    <div className="agent-card">
                        <div className="agent-card-header">
                            <div className="agent-card-title-group">
                                <div className="agent-card-icon emerald">
                                    <FiUser />
                                </div>
                                <div>
                                    <h3 className="agent-card-title">Personal Details</h3>
                                    <p className="agent-card-subtitle">Basic identity and contact information</p>
                                </div>
                            </div>
                        </div>

                        <div className="agent-info-list">
                            <div className="agent-info-item">
                                <span className="agent-info-label">First Name</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="agent-input"
                                        value={editForm.firstName}
                                        onChange={(e) => handleFormInputChange("firstName", e.target.value)}
                                        placeholder="First Name"
                                    />
                                ) : (
                                    <span className="agent-info-value">{editForm.firstName || name}</span>
                                )}
                            </div>

                            <div className="agent-info-item">
                                <span className="agent-info-label">Last Name</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="agent-input"
                                        value={editForm.lastName}
                                        onChange={(e) => handleFormInputChange("lastName", e.target.value)}
                                        placeholder="Last Name"
                                    />
                                ) : (
                                    <span className="agent-info-value">{editForm.lastName || "N/A"}</span>
                                )}
                            </div>

                            <div className="agent-info-item">
                                <span className="agent-info-label">Email Address</span>
                                <input
                                    type="text"
                                    className="agent-input locked"
                                    value={email}
                                    disabled
                                    title="Email address is linked to your account and cannot be modified."
                                />
                            </div>

                            <div className="agent-info-item">
                                <span className="agent-info-label">Primary Phone</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="agent-input"
                                        value={editForm.phone}
                                        onChange={(e) => handleFormInputChange("phone", e.target.value)}
                                        placeholder="Primary Phone"
                                    />
                                ) : (
                                    <span className="agent-info-value mono">{phone}</span>
                                )}
                            </div>

                            <div className="agent-info-item">
                                <span className="agent-info-label">Alternate Phone</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="agent-input"
                                        value={editForm.alternatePhone}
                                        onChange={(e) => handleFormInputChange("alternatePhone", e.target.value)}
                                        placeholder="Alternate Phone"
                                    />
                                ) : (
                                    <span className="agent-info-value mono">{altPhone}</span>
                                )}
                            </div>

                            <div className="agent-info-item">
                                <span className="agent-info-label">Date of Birth</span>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        className="agent-input"
                                        value={editForm.dob}
                                        onChange={(e) => handleFormInputChange("dob", e.target.value)}
                                    />
                                ) : (
                                    <span className="agent-info-value">{dob}</span>
                                )}
                            </div>

                            <div className="agent-info-item">
                                <span className="agent-info-label">Gender</span>
                                {isEditing ? (
                                    <select
                                        className="agent-input"
                                        value={editForm.gender}
                                        onChange={(e) => handleFormInputChange("gender", e.target.value)}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                ) : (
                                    <span className="agent-info-value">{gender}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Address & Service Region Card (Editable) */}
                    <div className="agent-card">
                        <div className="agent-card-header">
                            <div className="agent-card-title-group">
                                <div className="agent-card-icon blue">
                                    <FiMapPin />
                                </div>
                                <div>
                                    <h3 className="agent-card-title">Service Address & Zone</h3>
                                    <p className="agent-card-subtitle">Registered residential and dispatch location</p>
                                </div>
                            </div>
                        </div>

                        <div className="agent-info-list">
                            <div className="agent-info-item full-width">
                                <span className="agent-info-label">Street Address</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="agent-input"
                                        value={editForm.address}
                                        onChange={(e) => handleFormInputChange("address", e.target.value)}
                                        placeholder="Street Address"
                                    />
                                ) : (
                                    <span className="agent-info-value">{address}</span>
                                )}
                            </div>

                            <div className="agent-info-item">
                                <span className="agent-info-label">City / Town</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="agent-input"
                                        value={editForm.city}
                                        onChange={(e) => handleFormInputChange("city", e.target.value)}
                                        placeholder="City"
                                    />
                                ) : (
                                    <span className="agent-info-value">{city}</span>
                                )}
                            </div>

                            <div className="agent-info-item">
                                <span className="agent-info-label">District</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="agent-input"
                                        value={editForm.district}
                                        onChange={(e) => handleFormInputChange("district", e.target.value)}
                                        placeholder="District"
                                    />
                                ) : (
                                    <span className="agent-info-value">{district}</span>
                                )}
                            </div>

                            <div className="agent-info-item">
                                <span className="agent-info-label">State</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="agent-input"
                                        value={editForm.state}
                                        onChange={(e) => handleFormInputChange("state", e.target.value)}
                                        placeholder="State"
                                    />
                                ) : (
                                    <span className="agent-info-value">{state}</span>
                                )}
                            </div>

                            <div className="agent-info-item">
                                <span className="agent-info-label">Pincode</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="agent-input"
                                        value={editForm.pincode}
                                        onChange={(e) => handleFormInputChange("pincode", e.target.value)}
                                        placeholder="Pincode"
                                    />
                                ) : (
                                    <span className="agent-info-value mono">{pincode}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* EV Vehicle & Operational Logistics Card */}
                    <div className="agent-card">
                        <div className="agent-card-header">
                            <div className="agent-card-title-group">
                                <div className="agent-card-icon purple">
                                    <FiTruck />
                                </div>
                                <div>
                                    <h3 className="agent-card-title">
                                        EV Logistics & Vehicle
                                    </h3>
                                    <p className="agent-card-subtitle">Assigned electric vehicle details and license</p>
                                </div>
                            </div>
                        </div>

                        <div className="agent-info-list">
                            <div className="agent-info-item">
                                <span className="agent-info-label">Vehicle Category</span>
                                {isEditing ? (
                                    <select
                                        className="agent-input"
                                        value={editForm.vehicleType}
                                        onChange={(e) => handleFormInputChange("vehicleType", e.target.value)}
                                    >
                                        <option value="E-Three Wheeler Cargo">E-Three Wheeler Cargo</option>
                                        <option value="Bike">Bike</option>
                                        <option value="Scooter">Scooter</option>
                                        <option value="Van">Van</option>
                                        <option value="Mini Truck">Mini Truck</option>
                                        <option value="Pickup Truck">Pickup Truck</option>
                                    </select>
                                ) : (
                                    <span className="agent-info-value">{vehicleType}</span>
                                )}
                            </div>

                            <div className="agent-info-item">
                                <span className="agent-info-label">Vehicle Reg. Number</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="agent-input mono"
                                        value={editForm.vehicleNumber}
                                        onChange={(e) => handleFormInputChange("vehicleNumber", e.target.value)}
                                        placeholder="Vehicle Number"
                                    />
                                ) : (
                                    <span className="agent-info-value mono">{vehicleNo}</span>
                                )}
                            </div>

                            <div className="agent-info-item full-width">
                                <span className="agent-info-label">Driving License Number</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="agent-input mono"
                                        value={editForm.licenseNumber}
                                        onChange={(e) => handleFormInputChange("licenseNumber", e.target.value)}
                                        placeholder="Driving License Number"
                                    />
                                ) : (
                                    <span className="agent-info-value mono">{licenseNo}</span>
                                )}
                            </div>

                            <div className="agent-info-item full-width">
                                <span className="agent-info-label">Aadhaar Number</span>
                                <input
                                    type="text"
                                    className="agent-input locked mono"
                                    value={adhaarNo}
                                    disabled
                                    title="Aadhaar identification number is government-verified and cannot be modified."
                                />
                            </div>

                            {isEditing && (
                                <div className="agent-info-item full-width" style={{ marginTop: "0.5rem", borderTop: "1px dashed #cbd5e1", paddingTop: "0.85rem" }}>
                                    <span className="agent-info-label" style={{ fontWeight: "700", color: "#0f172a", marginBottom: "0.5rem" }}>
                                        Update Vehicle Documents (Optional)
                                    </span>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
                                        <div>
                                            <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "#475569", display: "block", marginBottom: "0.25rem" }}>
                                                Vehicle Insurance
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*,application/pdf"
                                                onChange={(e) => setSelectedInsuranceFile(e.target.files[0] || null)}
                                                style={{ fontSize: "0.75rem" }}
                                            />
                                            {selectedInsuranceFile && <span style={{ fontSize: "0.7rem", color: "#059669", display: "block", marginTop: "2px" }}>✓ {selectedInsuranceFile.name}</span>}
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "#475569", display: "block", marginBottom: "0.25rem" }}>
                                                Pollution Certificate
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*,application/pdf"
                                                onChange={(e) => setSelectedPollutionFile(e.target.files[0] || null)}
                                                style={{ fontSize: "0.75rem" }}
                                            />
                                            {selectedPollutionFile && <span style={{ fontSize: "0.7rem", color: "#059669", display: "block", marginTop: "2px" }}>✓ {selectedPollutionFile.name}</span>}
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "#475569", display: "block", marginBottom: "0.25rem" }}>
                                                EV Vehicle Photo
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setSelectedVehiclePhotoFile(e.target.files[0] || null)}
                                                style={{ fontSize: "0.75rem" }}
                                            />
                                            {selectedVehiclePhotoFile && <span style={{ fontSize: "0.7rem", color: "#059669", display: "block", marginTop: "2px" }}>✓ {selectedVehiclePhotoFile.name}</span>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bank Account Details (Editable) */}
                    <div className="agent-card">
                        <div className="agent-card-header">
                            <div className="agent-card-title-group">
                                <div className="agent-card-icon amber">
                                    <FiCreditCard />
                                </div>
                                <div>
                                    <h3 className="agent-card-title">Banking & Settlement</h3>
                                    <p className="agent-card-subtitle">Payout account for collection incentives</p>
                                </div>
                            </div>
                        </div>

                        <div className="agent-info-list">
                            <div className="agent-info-item full-width">
                                <span className="agent-info-label">Account Holder Name</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="agent-input"
                                        value={editForm.accountHolder}
                                        onChange={(e) => handleFormInputChange("accountHolder", e.target.value)}
                                        placeholder="Account Holder Name"
                                    />
                                ) : (
                                    <span className="agent-info-value">{accountHolder}</span>
                                )}
                            </div>

                            <div className="agent-info-item">
                                <span className="agent-info-label">Bank Name</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="agent-input"
                                        value={editForm.bankName}
                                        onChange={(e) => handleFormInputChange("bankName", e.target.value)}
                                        placeholder="Bank Name"
                                    />
                                ) : (
                                    <span className="agent-info-value">{bankName}</span>
                                )}
                            </div>

                            <div className="agent-info-item">
                                <span className="agent-info-label">IFSC Code</span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="agent-input"
                                        value={editForm.ifsc}
                                        onChange={(e) => handleFormInputChange("ifsc", e.target.value)}
                                        placeholder="IFSC Code"
                                    />
                                ) : (
                                    <span className="agent-info-value mono">{ifsc}</span>
                                )}
                            </div>

                            <div className="agent-info-item full-width">
                                <span className="agent-info-label">
                                    Bank Account Number
                                    {!isEditing && (
                                        <button
                                            type="button"
                                            className="agent-mask-toggle"
                                            onClick={() => setShowAccountNo(!showAccountNo)}
                                            title={showAccountNo ? "Hide account number" : "Show account number"}
                                        >
                                            {showAccountNo ? <FiEyeOff /> : <FiEye />}
                                            <span style={{ marginLeft: "4px" }}>
                                                {showAccountNo ? "Hide" : "Show"}
                                            </span>
                                        </button>
                                    )}
                                </span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="agent-input mono"
                                        value={editForm.accountNo}
                                        onChange={(e) => handleFormInputChange("accountNo", e.target.value)}
                                        placeholder="Bank Account Number"
                                    />
                                ) : (
                                    <span className="agent-info-value mono">
                                        {showAccountNo ? accountNo : maskedAccountNo}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Document Verification Vault */}
                <div className="agent-vault-card">
                    <div className="agent-card-header" style={{ marginBottom: "0.5rem" }}>
                        <div className="agent-card-title-group">
                            <div className="agent-card-icon slate">
                                <FiShield />
                            </div>
                            <div>
                                <h3 className="agent-card-title">Document Vault & Verification Certificates</h3>
                                <p className="agent-card-subtitle">
                                    Uploaded proof documents submitted during onboarding verification (Admin Verified)
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="agent-vault-grid">
                        {documentsList.map((doc, idx) => {
                            const url = getMediaUrl(doc.filename, doc.folder);
                            const hasFile = Boolean(url);

                            return (
                                <div className="agent-doc-tile" key={idx}>
                                    <div className="agent-doc-left">
                                        <div className="agent-doc-icon-wrap">
                                            {doc.icon}
                                        </div>
                                        <div className="agent-doc-meta">
                                            <h4 className="agent-doc-name">{doc.title}</h4>
                                            {hasFile ? (
                                                <span className="agent-doc-status">
                                                    <FiCheckCircle style={{ flexShrink: 0 }} /> Verified File
                                                </span>
                                            ) : (
                                                <span className="agent-doc-status missing">
                                                    Not Provided
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {hasFile && (
                                        <button
                                            type="button"
                                            className="agent-doc-view-btn"
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
                <div className="agent-modal-overlay" onClick={() => setActiveDoc(null)}>
                    <div
                        className="agent-modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="agent-modal-header">
                            <h3 className="agent-modal-title">{activeDoc.title}</h3>
                            <button
                                type="button"
                                className="agent-modal-close"
                                onClick={() => setActiveDoc(null)}
                            >
                                <FiX />
                            </button>
                        </div>
                        <div className="agent-modal-body">
                            {activeDoc.url.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? (
                                <img
                                    src={activeDoc.url}
                                    alt={activeDoc.title}
                                    className="agent-modal-img"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.alt = "Failed to load document image preview.";
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
                        <div className="agent-modal-footer">
                            <a
                                href={activeDoc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="agent-save-btn"
                                style={{ background: "#059669", color: "#ffffff", textDecoration: "none" }}
                            >
                                <FiExternalLink /> Open Original Document
                            </a>
                            <button
                                type="button"
                                className="agent-cancel-btn"
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

export default Profile;