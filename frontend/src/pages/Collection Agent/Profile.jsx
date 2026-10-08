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
    FiNavigation,
    FiUploadCloud,
    FiActivity,
    FiCopy,
    FiLayers,
    FiCheckSquare,
    FiClock,
    FiInfo,
    FiTag
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
    const [copiedField, setCopiedField] = useState("");
    const [activeTab, setActiveTab] = useState("personal"); // "personal", "vehicle", "banking", "documents"

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

    // Password Change Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordStep, setPasswordStep] = useState(1);
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

    const handleCopy = (text, fieldKey) => {
        if (!text || text === "N/A") return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldKey);
        setTimeout(() => setCopiedField(""), 2000);
    };

    const handleClosePasswordModal = () => {
        setShowPasswordModal(false);
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
                "https://ecocycle.runasp.net/api/CollectionAgent/verify-password",
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
                "https://ecocycle.runasp.net/api/CollectionAgent/change-password",
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
            handleClosePasswordModal();
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
        fetchUnreadNotificationsCount(token);
    }, [navigate]);

    const fetchUnreadNotificationsCount = async (token) => {
        try {
            const response = await axios.get(
                "https://ecocycle.runasp.net/api/Notificationcon/my_notifications",
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
            return `https://ecocycle.runasp.net/uploads/${cleanName.replace(/\\/g, "/")}`;
        }
        return folderName
            ? `https://ecocycle.runasp.net/uploads/${folderName}/${cleanName}`
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
                "https://ecocycle.runasp.net/api/CollectionAgent/myprofile",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = response.data || {};
            console.log("Collection Agent Profile Data:", data);
            setProfile(data);

            let fName = data.FirstName || data.firstName || "";
            let lName = data.LastName || data.lastName || "";
            if (!fName && (data.Name || data.name)) {
                const parts = (data.Name || data.name).split(" ");
                fName = parts[0] || "";
                lName = parts.slice(1).join(" ") || "";
            }

            let dobStr = "";
            const rawDob = data.dob || data.DOB;
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
        setSelectedInsuranceFile(null);
        setSelectedPollutionFile(null);
        setSelectedVehiclePhotoFile(null);
        setError("");
        setSuccessMessage("");
        const img = profile?.Profilepicture || profile?.profilepicture || profile?.profilePicture;
        if (img) {
            setProfileImagePreview(getMediaUrl(img, "profile"));
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

        if (selectedFile) formData.append("ProfilePicture", selectedFile);
        if (selectedInsuranceFile) formData.append("VehicleInsurance", selectedInsuranceFile);
        if (selectedPollutionFile) formData.append("VehiclePollution", selectedPollutionFile);
        if (selectedVehiclePhotoFile) formData.append("VehiclePhoto", selectedVehiclePhotoFile);

        try {
            const response = await axios.post(
                "https://ecocycle.runasp.net/api/CollectionAgent/update-profile",
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

    if (loading) {
        return (
            <div className="agent-dashboard-layout">
                <Sidebar />
                <div className="agent-main-content">
                    <Navbar
                        hasSidebar={true}
                        pageTitle="Agent Profile & Credentials"
                        pageSubtitle="EcoCycle Field Operations • Verified Collection Agent Account"
                        pageIcon={<FiUser />}
                        unreadNotifCount={unreadNotifCount}
                    />
                    <div style={{ marginTop: "2rem" }}>
                        <div className="agent-panel-card" style={{ padding: "3.5rem", textAlign: "center" }}>
                            <div className="pro-spinner"></div>
                            <p style={{ marginTop: "1.25rem", color: "#64748b", fontWeight: 600 }}>
                                Loading agent profile and verified credentials...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="agent-dashboard-layout">
                <Sidebar />
                <div className="agent-main-content">
                    <Navbar
                        hasSidebar={true}
                        pageTitle="Agent Profile & Credentials"
                        pageSubtitle="EcoCycle Field Operations • Verified Collection Agent Account"
                        pageIcon={<FiUser />}
                        unreadNotifCount={unreadNotifCount}
                    />
                    <div className="agent-panel-card" style={{ maxWidth: "480px", margin: "3rem auto", textAlign: "center", padding: "2.5rem 2rem" }}>
                        <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem auto", fontSize: "1.5rem" }}>
                            <FiAlertCircle />
                        </div>
                        <h2 style={{ fontFamily: "var(--agent-font-heading)", fontSize: "1.25rem", color: "#0f172a", margin: "0 0 0.5rem 0" }}>Profile Unavailable</h2>
                        <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1.5rem" }}>{error}</p>
                        <button className="pro-btn-primary" onClick={() => loadProfile()}>
                            <FiRefreshCw /> Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Read profile fields
    const name = profile?.Name || profile?.name || `${editForm.firstName} ${editForm.lastName}`.trim() || "Field Agent";
    const email = profile?.Email || profile?.email || "N/A";
    const phone = profile?.Phone || profile?.phone || "N/A";
    const altPhone = profile?.Alternate_phone || profile?.alternate_phone || profile?.alternatePhone || "N/A";
    const dob = profile?.dob || profile?.DOB || "N/A";
    const gender = profile?.gender || profile?.Gender || "N/A";

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
            title: "Driving License",
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

    const agentId = profile?.CollectionAgentId || profile?.collectionAgentId || "042";
    const docsCount = documentsList.filter(d => Boolean(getMediaUrl(d.filename, d.folder))).length;

    return (
        <div className="agent-dashboard-layout">
            <Sidebar />

            <main className="agent-main-content">
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

                {/* Success Alert Notice */}
                {successMessage && (
                    <div className="pro-notice success">
                        <div className="pro-notice-left">
                            <FiCheckCircle className="pro-notice-icon" />
                            <span>{successMessage}</span>
                        </div>
                        <button type="button" className="pro-notice-close" onClick={() => setSuccessMessage("")}>
                            <FiX />
                        </button>
                    </div>
                )}

                {/* Error Alert Notice */}
                {error && profile && (
                    <div className="pro-notice danger">
                        <div className="pro-notice-left">
                            <FiAlertCircle className="pro-notice-icon" />
                            <span>{error}</span>
                        </div>
                        <button type="button" className="pro-notice-close" onClick={() => setError("")}>
                            <FiX />
                        </button>
                    </div>
                )}

                {/* Master Layout: Left Sticky Profile Card (320px) + Right Main Content Area */}
                <div className="pro-master-layout">
                    {/* LEFT COLUMN: Modern Agent Identity Card */}
                    <div className="pro-left-card">
                        <div className="agent-panel-card pro-agent-profile-summary">
                            <div className="pro-summary-cover">
                                <div className="pro-summary-pattern"></div>
                            </div>

                            <div className="pro-summary-body">
                                <div className="pro-summary-avatar-wrap">
                                    {profileImagePreview ? (
                                        <img
                                            src={profileImagePreview}
                                            alt={name}
                                            className="pro-summary-avatar"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = "none";
                                                if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className="pro-summary-avatar-fallback"
                                        style={{ display: profileImagePreview ? "none" : "flex" }}
                                    >
                                        {avatarInitial}
                                    </div>
                                    <div className="pro-summary-badge" title="Verified Agent">
                                        <FiCheck />
                                    </div>
                                    <button
                                        type="button"
                                        className="pro-summary-cam-btn"
                                        onClick={() => fileInputRef.current?.click()}
                                        title="Change photo"
                                    >
                                        <FiCamera />
                                    </button>
                                </div>

                                <div className="pro-summary-names">
                                    <h2 className="pro-summary-name">{name}</h2>
                                    <div className="pro-summary-badges-row">
                                        <span className="pro-badge badge-completed">
                                            <FiCheckCircle /> Verified Officer
                                        </span>
                                        <span className="pro-badge badge-enroute">
                                            <FiActivity /> Active
                                        </span>
                                    </div>
                                </div>

                                <div className="pro-summary-id-card">
                                    <div className="pro-id-left">
                                        <FiAward className="pro-id-icon" />
                                        <div>
                                            <span className="pro-id-lbl">Official ID</span>
                                            <span className="pro-id-num">CA-{agentId}</span>
                                        </div>
                                    </div>
                                    <div className="pro-id-right">
                                        <span className="pro-id-type">{vehicleType}</span>
                                    </div>
                                </div>

                                {/* Quick Contact Rows */}
                                <div className="pro-summary-quick-info">
                                    <div className="pro-quick-row">
                                        <div className="pro-quick-icon emerald">
                                            <FiMail />
                                        </div>
                                        <div className="pro-quick-meta">
                                            <span className="pro-quick-lbl">Email Address</span>
                                            <span className="pro-quick-val" title={email}>{email}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="pro-quick-copy"
                                            onClick={() => handleCopy(email, "email-left")}
                                            title="Copy Email"
                                        >
                                            {copiedField === "email-left" ? <FiCheck style={{ color: "#059669" }} /> : <FiCopy />}
                                        </button>
                                    </div>

                                    <div className="pro-quick-row">
                                        <div className="pro-quick-icon blue">
                                            <FiPhone />
                                        </div>
                                        <div className="pro-quick-meta">
                                            <span className="pro-quick-lbl">Contact Phone</span>
                                            <span className="pro-quick-val mono">{phone}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="pro-quick-copy"
                                            onClick={() => handleCopy(phone, "phone-left")}
                                            title="Copy Phone"
                                        >
                                            {copiedField === "phone-left" ? <FiCheck style={{ color: "#059669" }} /> : <FiCopy />}
                                        </button>
                                    </div>

                                    <div className="pro-quick-row">
                                        <div className="pro-quick-icon purple">
                                            <FiMapPin />
                                        </div>
                                        <div className="pro-quick-meta">
                                            <span className="pro-quick-lbl">Primary Region</span>
                                            <span className="pro-quick-val">{city ? `${city}, ${state}` : state}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Primary Action Buttons */}
                                <div className="pro-summary-actions">
                                    {!isEditing ? (
                                        <button
                                            type="button"
                                            className="pro-btn-primary"
                                            style={{ width: "100%", justifyContent: "center" }}
                                            onClick={() => setIsEditing(true)}
                                        >
                                            <FiEdit3 /> Edit Profile Details
                                        </button>
                                    ) : (
                                        <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
                                            <button
                                                type="button"
                                                className="pro-btn-primary"
                                                style={{ flex: 1, justifyContent: "center" }}
                                                onClick={handleSaveChanges}
                                                disabled={saving}
                                            >
                                                <FiSave /> {saving ? "Saving..." : "Save"}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                style={{ flex: 1, justifyContent: "center" }}
                                                onClick={handleCancelEdit}
                                                disabled={saving}
                                            >
                                                <FiX /> Cancel
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        style={{ width: "100%", justifyContent: "center" }}
                                        onClick={() => setShowPasswordModal(true)}
                                    >
                                        <FiKey /> Security & Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Interactive Tabs & Information Workspace */}
                    <div className="pro-right-content">
                        {/* Tab Switcher (Matching Dashboard Design) */}
                        <div className="pro-filter-card" style={{ marginBottom: "1.25rem" }}>
                            <div className="pro-tabs-list">
                                <button
                                    type="button"
                                    className={`pro-tab-item ${activeTab === "personal" ? "active" : ""}`}
                                    onClick={() => setActiveTab("personal")}
                                >
                                    <FiUser /> Personal & Station
                                </button>
                                <button
                                    type="button"
                                    className={`pro-tab-item ${activeTab === "vehicle" ? "active" : ""}`}
                                    onClick={() => setActiveTab("vehicle")}
                                >
                                    <FiTruck /> EV Vehicle & Logistics
                                </button>
                                <button
                                    type="button"
                                    className={`pro-tab-item ${activeTab === "banking" ? "active" : ""}`}
                                    onClick={() => setActiveTab("banking")}
                                >
                                    <FiCreditCard /> Banking & Direct Payout
                                </button>
                                <button
                                    type="button"
                                    className={`pro-tab-item ${activeTab === "documents" ? "active" : ""}`}
                                    onClick={() => setActiveTab("documents")}
                                >
                                    <FiShield /> Document Vault
                                    <span className="pro-tab-count">{docsCount}/4</span>
                                </button>
                            </div>
                        </div>

                        {/* TAB 1: PERSONAL & STATION DETAILS */}
                        {activeTab === "personal" && (
                            <div className="agent-panel-card">
                                <div className="agent-panel-header">
                                    <div>
                                        <h3 className="agent-panel-title">Personal & Contact Credentials</h3>
                                        <p className="agent-panel-subtitle">Official verified details for field agent identity</p>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="pro-edit-form-grid">
                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">First Name</label>
                                            <input
                                                type="text"
                                                className="pro-input-field"
                                                value={editForm.firstName}
                                                onChange={(e) => handleFormInputChange("firstName", e.target.value)}
                                                placeholder="First Name"
                                            />
                                        </div>

                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">Last Name</label>
                                            <input
                                                type="text"
                                                className="pro-input-field"
                                                value={editForm.lastName}
                                                onChange={(e) => handleFormInputChange("lastName", e.target.value)}
                                                placeholder="Last Name"
                                            />
                                        </div>

                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">Primary Mobile Phone</label>
                                            <input
                                                type="text"
                                                className="pro-input-field mono"
                                                value={editForm.phone}
                                                onChange={(e) => handleFormInputChange("phone", e.target.value)}
                                                placeholder="Primary Phone"
                                            />
                                        </div>

                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">Alternate Phone</label>
                                            <input
                                                type="text"
                                                className="pro-input-field mono"
                                                value={editForm.alternatePhone}
                                                onChange={(e) => handleFormInputChange("alternatePhone", e.target.value)}
                                                placeholder="Alternate Phone"
                                            />
                                        </div>

                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">Date of Birth</label>
                                            <input
                                                type="date"
                                                className="pro-input-field"
                                                value={editForm.dob}
                                                onChange={(e) => handleFormInputChange("dob", e.target.value)}
                                            />
                                        </div>

                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">Gender</label>
                                            <select
                                                className="pro-input-field"
                                                value={editForm.gender}
                                                onChange={(e) => handleFormInputChange("gender", e.target.value)}
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div className="pro-edit-field full-width">
                                            <label className="pro-edit-label">Residential / Station Address</label>
                                            <input
                                                type="text"
                                                className="pro-input-field"
                                                value={editForm.address}
                                                onChange={(e) => handleFormInputChange("address", e.target.value)}
                                                placeholder="Street Address"
                                            />
                                        </div>

                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">City / Town</label>
                                            <input
                                                type="text"
                                                className="pro-input-field"
                                                value={editForm.city}
                                                onChange={(e) => handleFormInputChange("city", e.target.value)}
                                                placeholder="City"
                                            />
                                        </div>

                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">District</label>
                                            <input
                                                type="text"
                                                className="pro-input-field"
                                                value={editForm.district}
                                                onChange={(e) => handleFormInputChange("district", e.target.value)}
                                                placeholder="District"
                                            />
                                        </div>

                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">State</label>
                                            <input
                                                type="text"
                                                className="pro-input-field"
                                                value={editForm.state}
                                                onChange={(e) => handleFormInputChange("state", e.target.value)}
                                                placeholder="State"
                                            />
                                        </div>

                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">Postal Pincode</label>
                                            <input
                                                type="text"
                                                className="pro-input-field mono"
                                                value={editForm.pincode}
                                                onChange={(e) => handleFormInputChange("pincode", e.target.value)}
                                                placeholder="Pincode"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    /* Clean High-End Row Display */
                                    <div className="pro-keyval-list">
                                        <div className="pro-keyval-row">
                                            <div className="pro-keyval-left">
                                                <FiUser className="pro-keyval-icon" />
                                                <span className="pro-keyval-label">Full Legal Name</span>
                                            </div>
                                            <div className="pro-keyval-val font-bold">{name}</div>
                                        </div>

                                        <div className="pro-keyval-row">
                                            <div className="pro-keyval-left">
                                                <FiMail className="pro-keyval-icon" />
                                                <span className="pro-keyval-label">Account Email</span>
                                            </div>
                                            <div className="pro-keyval-val">
                                                <span>{email}</span>
                                                <span className="pro-tag qty" style={{ marginLeft: "8px" }}><FiLock /> Locked</span>
                                            </div>
                                        </div>

                                        <div className="pro-keyval-row">
                                            <div className="pro-keyval-left">
                                                <FiPhone className="pro-keyval-icon" />
                                                <span className="pro-keyval-label">Primary Mobile Phone</span>
                                            </div>
                                            <div className="pro-keyval-val mono">{phone}</div>
                                        </div>

                                        <div className="pro-keyval-row">
                                            <div className="pro-keyval-left">
                                                <FiPhone className="pro-keyval-icon" />
                                                <span className="pro-keyval-label">Alternate Phone</span>
                                            </div>
                                            <div className="pro-keyval-val mono">{altPhone}</div>
                                        </div>

                                        <div className="pro-keyval-row">
                                            <div className="pro-keyval-left">
                                                <FiCalendar className="pro-keyval-icon" />
                                                <span className="pro-keyval-label">Date of Birth</span>
                                            </div>
                                            <div className="pro-keyval-val">{dob}</div>
                                        </div>

                                        <div className="pro-keyval-row">
                                            <div className="pro-keyval-left">
                                                <FiUser className="pro-keyval-icon" />
                                                <span className="pro-keyval-label">Gender</span>
                                            </div>
                                            <div className="pro-keyval-val">{gender}</div>
                                        </div>

                                        <div className="pro-keyval-row">
                                            <div className="pro-keyval-left">
                                                <FiMapPin className="pro-keyval-icon" />
                                                <span className="pro-keyval-label">Station Address</span>
                                            </div>
                                            <div className="pro-keyval-val">{address || "N/A"}</div>
                                        </div>

                                        <div className="pro-keyval-row">
                                            <div className="pro-keyval-left">
                                                <FiNavigation className="pro-keyval-icon" />
                                                <span className="pro-keyval-label">Region & Pincode</span>
                                            </div>
                                            <div className="pro-keyval-val">
                                                {city}, {district}, {state} - <span className="mono">{pincode}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: EV VEHICLE & LOGISTICS */}
                        {activeTab === "vehicle" && (
                            <div className="agent-panel-card">
                                <div className="agent-panel-header">
                                    <div>
                                        <h3 className="agent-panel-title">Assigned EV Vehicle & Transport</h3>
                                        <p className="agent-panel-subtitle">Zero-emission transport unit registration and driving authorization</p>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="pro-edit-form-grid">
                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">Vehicle Classification</label>
                                            <select
                                                className="pro-input-field"
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
                                        </div>

                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">Vehicle Registration Number</label>
                                            <input
                                                type="text"
                                                className="pro-input-field mono"
                                                value={editForm.vehicleNumber}
                                                onChange={(e) => handleFormInputChange("vehicleNumber", e.target.value)}
                                                placeholder="Vehicle Number"
                                            />
                                        </div>

                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">Driving License Number</label>
                                            <input
                                                type="text"
                                                className="pro-input-field mono"
                                                value={editForm.licenseNumber}
                                                onChange={(e) => handleFormInputChange("licenseNumber", e.target.value)}
                                                placeholder="Driving License Number"
                                            />
                                        </div>

                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">
                                                Aadhaar Card Number <span className="pro-tag qty" style={{ fontSize: "0.68rem" }}><FiLock /> Locked</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="pro-input-field locked mono"
                                                value={adhaarNo}
                                                disabled
                                            />
                                        </div>

                                        {/* Upload supporting vehicle documents */}
                                        <div className="pro-edit-field full-width" style={{ marginTop: "0.5rem" }}>
                                            <div className="pro-upload-strip">
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.75rem" }}>
                                                    <FiUploadCloud style={{ color: "#059669", fontSize: "1.1rem" }} />
                                                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                                                        Update Vehicle Verification Documents (Optional)
                                                    </span>
                                                </div>
                                                <div className="pro-upload-grid-compact">
                                                    <div>
                                                        <label className="pro-data-label" style={{ fontSize: "0.72rem" }}>Vehicle Insurance Doc</label>
                                                        <input
                                                            type="file"
                                                            accept="image/*,application/pdf"
                                                            onChange={(e) => setSelectedInsuranceFile(e.target.files[0] || null)}
                                                            style={{ fontSize: "0.75rem", width: "100%" }}
                                                        />
                                                        {selectedInsuranceFile && <span className="pro-file-tag">✓ {selectedInsuranceFile.name}</span>}
                                                    </div>
                                                    <div>
                                                        <label className="pro-data-label" style={{ fontSize: "0.72rem" }}>Pollution Certificate</label>
                                                        <input
                                                            type="file"
                                                            accept="image/*,application/pdf"
                                                            onChange={(e) => setSelectedPollutionFile(e.target.files[0] || null)}
                                                            style={{ fontSize: "0.75rem", width: "100%" }}
                                                        />
                                                        {selectedPollutionFile && <span className="pro-file-tag">✓ {selectedPollutionFile.name}</span>}
                                                    </div>
                                                    <div>
                                                        <label className="pro-data-label" style={{ fontSize: "0.72rem" }}>EV Vehicle Photo</label>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => setSelectedVehiclePhotoFile(e.target.files[0] || null)}
                                                            style={{ fontSize: "0.75rem", width: "100%" }}
                                                        />
                                                        {selectedVehiclePhotoFile && <span className="pro-file-tag">✓ {selectedVehiclePhotoFile.name}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pro-keyval-list">
                                        <div className="pro-keyval-row">
                                            <div className="pro-keyval-left">
                                                <FiTruck className="pro-keyval-icon" />
                                                <span className="pro-keyval-label">EV Fleet Model</span>
                                            </div>
                                            <div className="pro-keyval-val font-bold">
                                                {vehicleType}
                                                <span className="pro-tag qty" style={{ marginLeft: "8px" }}>Zero Emission</span>
                                            </div>
                                        </div>

                                        <div className="pro-keyval-row">
                                            <div className="pro-keyval-left">
                                                <FiTag className="pro-keyval-icon" />
                                                <span className="pro-keyval-label">Registration Number</span>
                                            </div>
                                            <div className="pro-keyval-val mono font-bold">{vehicleNo}</div>
                                        </div>

                                        <div className="pro-keyval-row">
                                            <div className="pro-keyval-left">
                                                <FiShield className="pro-keyval-icon" />
                                                <span className="pro-keyval-label">Driving License Number</span>
                                            </div>
                                            <div className="pro-keyval-val mono font-bold">{licenseNo}</div>
                                        </div>

                                        <div className="pro-keyval-row">
                                            <div className="pro-keyval-left">
                                                <FiLock className="pro-keyval-icon" />
                                                <span className="pro-keyval-label">Aadhaar Identification Number</span>
                                            </div>
                                            <div className="pro-keyval-val mono">
                                                {adhaarNo}
                                                <span className="pro-tag qty" style={{ marginLeft: "8px" }}>Govt. Verified</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 3: BANKING & DIRECT PAYOUT */}
                        {activeTab === "banking" && (
                            <div className="agent-panel-card">
                                <div className="agent-panel-header">
                                    <div>
                                        <h3 className="agent-panel-title">Banking & Settlement Accounts</h3>
                                        <p className="agent-panel-subtitle">Direct deposit account for daily collection incentives and payouts</p>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="pro-edit-form-grid">
                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">Account Holder Name</label>
                                            <input
                                                type="text"
                                                className="pro-input-field"
                                                value={editForm.accountHolder}
                                                onChange={(e) => handleFormInputChange("accountHolder", e.target.value)}
                                                placeholder="Account Holder Name"
                                            />
                                        </div>

                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">Bank Name</label>
                                            <input
                                                type="text"
                                                className="pro-input-field"
                                                value={editForm.bankName}
                                                onChange={(e) => handleFormInputChange("bankName", e.target.value)}
                                                placeholder="Bank Name"
                                            />
                                        </div>

                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">IFSC Code</label>
                                            <input
                                                type="text"
                                                className="pro-input-field mono"
                                                value={editForm.ifsc}
                                                onChange={(e) => handleFormInputChange("ifsc", e.target.value)}
                                                placeholder="IFSC Code"
                                            />
                                        </div>

                                        <div className="pro-edit-field">
                                            <label className="pro-edit-label">Bank Account Number</label>
                                            <input
                                                type="text"
                                                className="pro-input-field mono"
                                                value={editForm.accountNo}
                                                onChange={(e) => handleFormInputChange("accountNo", e.target.value)}
                                                placeholder="Bank Account Number"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pro-keyval-list">
                                        <div className="pro-keyval-row">
                                            <div className="pro-keyval-left">
                                                <FiUser className="pro-keyval-icon" />
                                                <span className="pro-keyval-label">Beneficiary Account Holder</span>
                                            </div>
                                            <div className="pro-keyval-val font-bold">{accountHolder}</div>
                                        </div>

                                        <div className="pro-keyval-row">
                                            <div className="pro-keyval-left">
                                                <FiCreditCard className="pro-keyval-icon" />
                                                <span className="pro-keyval-label">Settlement Bank</span>
                                            </div>
                                            <div className="pro-keyval-val font-bold">{bankName}</div>
                                        </div>

                                        <div className="pro-keyval-row">
                                            <div className="pro-keyval-left">
                                                <FiActivity className="pro-keyval-icon" />
                                                <span className="pro-keyval-label">Bank IFSC Code</span>
                                            </div>
                                            <div className="pro-keyval-val mono font-bold">{ifsc}</div>
                                        </div>

                                        <div className="pro-keyval-row">
                                            <div className="pro-keyval-left">
                                                <FiLock className="pro-keyval-icon" />
                                                <span className="pro-keyval-label">Bank Account Number</span>
                                            </div>
                                            <div className="pro-keyval-val mono">
                                                <span>{showAccountNo ? accountNo : maskedAccountNo}</span>
                                                <button
                                                    type="button"
                                                    className="pro-toggle-reveal"
                                                    style={{ marginLeft: "12px" }}
                                                    onClick={() => setShowAccountNo(!showAccountNo)}
                                                >
                                                    {showAccountNo ? <FiEyeOff /> : <FiEye />}
                                                    <span>{showAccountNo ? "Hide" : "Reveal"}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 4: VERIFIED DOCUMENT VAULT */}
                        {activeTab === "documents" && (
                            <div className="agent-panel-card">
                                <div className="agent-panel-header">
                                    <div>
                                        <h3 className="agent-panel-title">Official Document Vault</h3>
                                        <p className="agent-panel-subtitle">Submitted proof documents verified by EcoCycle Administration</p>
                                    </div>
                                </div>

                                <div className="pro-doc-vault-grid">
                                    {documentsList.map((doc, idx) => {
                                        const url = getMediaUrl(doc.filename, doc.folder);
                                        const hasFile = Boolean(url);

                                        return (
                                            <div key={idx} className="pro-doc-vault-card">
                                                <div className="pro-doc-vault-top">
                                                    <div className="agent-kpi-icon teal" style={{ width: "38px", height: "38px", fontSize: "1.1rem", flexShrink: 0 }}>
                                                        {doc.icon}
                                                    </div>
                                                    <div className="pro-doc-vault-meta">
                                                        <div className="pro-doc-vault-title">
                                                            {doc.title}
                                                        </div>
                                                        <div className="pro-doc-vault-sub">
                                                            {hasFile ? "Official Verification Record" : "File Not Uploaded"}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pro-doc-vault-bottom">
                                                    {hasFile ? (
                                                        <a
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="pro-btn-primary"
                                                            style={{ width: "100%", justifyContent: "center", textDecoration: "none", padding: "0.45rem 0.85rem", fontSize: "0.78rem" }}
                                                        >
                                                            <FiExternalLink /> View Document
                                                        </a>
                                                    ) : (
                                                        <div style={{ width: "100%", textAlign: "center", fontSize: "0.76rem", color: "#94a3b8", fontWeight: 600, padding: "0.3rem 0" }}>
                                                            Document Not Available
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="modal-backdrop" onClick={handleClosePasswordModal}>
                    <div className="pro-modal-box" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="pro-modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <FiKey style={{ color: "#059669", fontSize: "1.1rem" }} />
                                <h3 className="pro-modal-title">
                                    {passwordStep === 1 ? "Verify Current Password" : "Create New Password"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                className="pro-modal-close-btn"
                                onClick={handleClosePasswordModal}
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="pro-modal-content" style={{ padding: "1.25rem 1.5rem" }}>
                            {passwordError && (
                                <div className="pro-notice danger" style={{ margin: "0 0 1rem 0" }}>
                                    <div className="pro-notice-left">
                                        <FiAlertCircle className="pro-notice-icon" />
                                        <span>{passwordError}</span>
                                    </div>
                                </div>
                            )}

                            {passwordStep === 1 ? (
                                <form onSubmit={handleVerifyCurrentPassword}>
                                    <p style={{ fontSize: "0.83rem", color: "#475569", margin: "0 0 1rem 0" }}>
                                        Please enter your current account password to proceed with updating your credentials.
                                    </p>

                                    <div className="pro-data-block">
                                        <span className="pro-data-label">
                                            <FiLock /> Current Password
                                        </span>
                                        <div className="pro-pass-input-wrap">
                                            <input
                                                type={showCurrentPassword ? "text" : "password"}
                                                className="pro-input-field"
                                                style={{ paddingRight: "2.4rem" }}
                                                placeholder="Enter current password"
                                                value={currentPasswordInput}
                                                onChange={(e) => handleCurrentPasswordChange(e.target.value)}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                className="pro-eye-btn"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                tabIndex="-1"
                                            >
                                                {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                        {passwordFormErrors.currentPassword && (
                                            <span className="pro-error-text">
                                                {passwordFormErrors.currentPassword}
                                            </span>
                                        )}
                                    </div>

                                    <div className="pro-modal-footer" style={{ border: "none", padding: "1.25rem 0 0 0" }}>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleClosePasswordModal}
                                            disabled={passwordLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="pro-btn-primary"
                                            disabled={passwordLoading}
                                        >
                                            {passwordLoading ? "Verifying..." : "Verify Password"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleUpdateNewPassword}>
                                    <div className="pro-notice success" style={{ margin: "0 0 1rem 0" }}>
                                        <div className="pro-notice-left">
                                            <FiCheckCircle className="pro-notice-icon" />
                                            <span>Current password verified. Enter your new password below.</span>
                                        </div>
                                    </div>

                                    <div className="pro-data-block">
                                        <span className="pro-data-label">
                                            <FiLock /> New Password
                                        </span>
                                        <div className="pro-pass-input-wrap">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                className="pro-input-field"
                                                style={{ paddingRight: "2.4rem" }}
                                                placeholder="Enter new strong password"
                                                value={newPasswordInput}
                                                onChange={(e) => handleNewPasswordChange(e.target.value)}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                className="pro-eye-btn"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                tabIndex="-1"
                                            >
                                                {showNewPassword ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                        {passwordFormErrors.newPassword && (
                                            <span className="pro-error-text">
                                                {passwordFormErrors.newPassword}
                                            </span>
                                        )}
                                    </div>

                                    <div className="pro-data-block" style={{ marginTop: "0.85rem" }}>
                                        <span className="pro-data-label">
                                            <FiLock /> Confirm New Password
                                        </span>
                                        <div className="pro-pass-input-wrap">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                className="pro-input-field"
                                                style={{ paddingRight: "2.4rem" }}
                                                placeholder="Confirm new password"
                                                value={confirmPasswordInput}
                                                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="pro-eye-btn"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                tabIndex="-1"
                                            >
                                                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                            </button>
                                        </div>
                                        {passwordFormErrors.confirmPassword && (
                                            <span className="pro-error-text">
                                                {passwordFormErrors.confirmPassword}
                                            </span>
                                        )}
                                    </div>

                                    <div className="pro-modal-footer" style={{ border: "none", padding: "1.25rem 0 0 0" }}>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleClosePasswordModal}
                                            disabled={passwordLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="pro-btn-primary"
                                            disabled={passwordLoading}
                                        >
                                            {passwordLoading ? "Updating..." : "Update Password"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;