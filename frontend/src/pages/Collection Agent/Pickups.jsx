import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { FaQrcode } from "react-icons/fa";
import {
    FiTruck,
    FiUser,
    FiCheckCircle,
    FiClock,
    FiMapPin,
    FiPhoneCall,
    FiPackage,
    FiSearch,
    FiX,
    FiInfo,
    FiRefreshCw,
    FiGrid,
    FiList,
    FiAlertCircle,
    FiCalendar,
    FiCheck,
    FiBox,
    FiArrowRight,
    FiAlertTriangle,
    FiFileText,
    FiCamera,
    FiMaximize,
    FiLock,
    FiShield,
    FiUploadCloud,
    FiMail
} from "react-icons/fi";
import "./Pickups.css";

function Pickups() {
    const navigate = useNavigate();
    const [isOnDuty, setIsOnDuty] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Logged-in Agent Profile
    const [agentProfile, setAgentProfile] = useState(null);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    // Pickups Data belonging strictly to THIS agent
    const [pickups, setPickups] = useState([]);

    // Filtering state
    const [activeTab, setActiveTab] = useState("All"); // All, Accepted, En Route, Completed, Pending
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"

    // Modal states
    const [selectedPickup, setSelectedPickup] = useState(null);
    const [completePickupTarget, setCompletePickupTarget] = useState(null);
    const [completeDeliveryTarget, setCompleteDeliveryTarget] = useState(null);
    // Tech→Recycler: separate pickup completion modal (OTP to technician only)
    const [completeTechPickupTarget, setCompleteTechPickupTarget] = useState(null);
    // Tech→Recycler delivery: QR scan state (separate from citizen pickup QR)
    const [deliveryQrInput, setDeliveryQrInput] = useState("");
    const [deliveryQrVerified, setDeliveryQrVerified] = useState(false);
    const [deliveryQrError, setDeliveryQrError] = useState("");

    // Interactive Verification Steps state for Active Handover Completion Modal
    const [qrScanInput, setQrScanInput] = useState("");
    const [qrCodeVerified, setQrCodeVerified] = useState(false);
    const [qrScanError, setQrScanError] = useState("");
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoError, setPhotoError] = useState("");

    const [otpInput, setOtpInput] = useState("");
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpError, setOtpError] = useState("");
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [isCompletingSuccess, setIsCompletingSuccess] = useState(false);

    // Email OTP & 30-Second Countdown Timer state
    const [otpSent, setOtpSent] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);
    const [sendingOtp, setSendingOtp] = useState(false);

    // Delivery OTP & Handover State
    const [deliveryOtpInput, setDeliveryOtpInput] = useState("");
    const [deliveryOtpVerified, setDeliveryOtpVerified] = useState(false);
    const [deliveryOtpSent, setDeliveryOtpSent] = useState(false);
    const [deliveryOtpTimer, setDeliveryOtpTimer] = useState(0);
    const [sendingDeliveryOtp, setSendingDeliveryOtp] = useState(false);
    const [deliveryOtpError, setDeliveryOtpError] = useState("");

    // Additional Agent Notes & Failure Reason state
    const [agentNotes, setAgentNotes] = useState("");
    const [notesError, setNotesError] = useState("");
    const [failureReason, setFailureReason] = useState("");

    // Toast notification notice state
    const [toastNotice, setToastNotice] = useState(null);

    // Processing state for inline actions
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found, redirecting to login.");
            navigate("/");
            return;
        }
        fetchAgentProfile(token);
        fetchMyPickups(token);
        fetchNotifications(token);
    }, [navigate]);

    const fetchNotifications = async (token) => {
        const authToken = token || localStorage.getItem("token");
        if (!authToken) return;
        try {
            const response = await axios.get("https://ecocycle.runasp.net/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            const notificationsData = Array.isArray(response.data) ? response.data : [];
            const unread = notificationsData.filter((n) => !n.isRead && !n.isread).length;
            setUnreadNotifCount(unread);
        } catch (err) {
            console.error("Error fetching unread notifications in Pickups:", err);
        }
    };

    // Fetch logged-in agent profile info
    const fetchAgentProfile = async (token) => {
        try {
            const res = await axios.get("https://ecocycle.runasp.net/api/CollectionAgent/myprofile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                setAgentProfile(res.data);
            }
        } catch (err) {
            console.warn("Could not fetch agent profile:", err);
            setAgentProfile({
                Name: localStorage.getItem("firstName")
                    ? `${localStorage.getItem("firstName")} ${localStorage.getItem("lastName") || ""}`
                    : localStorage.getItem("userName") || "Collection Agent",
                Email: localStorage.getItem("email") || "",
                Phone: localStorage.getItem("phone") || "",
                City: localStorage.getItem("city") || "South Zone"
            });
        }
    };

    // Fetch ONLY the pickups assigned to the logged-in agent
    const fetchMyPickups = async (token) => {
        const authToken = token || localStorage.getItem("token");
        if (!authToken) return;

        setLoading(true);
        setError("");

        try {
            const response = await axios.get("https://ecocycle.runasp.net/api/CollectionAssignment/my-assignments", {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            console.log("My Collection Agent Assignments:", response.data);
            const raw = response.data || [];

            // Sort newest first
            const sorted = [...raw].sort((a, b) => {
                const idA = a.collectionAssignmentId || a.CollectionAssignmentId || 0;
                const idB = b.collectionAssignmentId || b.CollectionAssignmentId || 0;
                const dateA = new Date(a.assignedAt || a.AssignedAt || a.createdAt || a.CreatedAt || 0).getTime();
                const dateB = new Date(b.assignedAt || b.AssignedAt || b.createdAt || b.CreatedAt || 0).getTime();
                if (dateA !== dateB) return dateB - dateA;
                return idB - idA;
            });

            setPickups(sorted);
        } catch (err) {
            console.error("Error fetching my collection assignments:", err);
            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
                localStorage.clear();
                navigate("/");
            } else {
                setError(err.response?.data?.message || "Failed to load your assigned pickups.");
                setPickups([]);
            }
        } finally {
            setLoading(false);
        }
    };

    // Accept pickup
    const handleAccept = async (assignmentId) => {
        try {
            setProcessingId(assignmentId);
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `https://ecocycle.runasp.net/api/CollectionAssignment/accept/${assignmentId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const acceptedAtDate = res.data?.acceptedAt || new Date().toISOString();
            const compDeadline = res.data?.completionDeadline || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

            setPickups(prev =>
                prev.map(p => (p.collectionAssignmentId === assignmentId ? {
                    ...p,
                    status: "Accepted",
                    acceptedAt: acceptedAtDate,
                    completionDeadline: compDeadline
                } : p))
            );
            if (selectedPickup?.collectionAssignmentId === assignmentId) {
                setSelectedPickup(prev => prev ? {
                    ...prev,
                    status: "Accepted",
                    acceptedAt: acceptedAtDate,
                    completionDeadline: compDeadline
                } : null);
            }
            setToastNotice({ type: "success", message: `Pickup assignment #${assignmentId} accepted! Logistics deadline set to 5 days.` });
            setTimeout(() => setToastNotice(null), 4500);
        } catch (err) {
            console.error("Error accepting assignment:", err);
            alert(err.response?.data?.message || "Failed to accept pickup assignment.");
            fetchMyPickups();
        } finally {
            setProcessingId(null);
        }
    };

    // Start Pickup Action (Transitions status to PickupStarted / En Route, sends notification & email to owner)
    const handleStartPickup = async (assignmentId) => {
        try {
            setProcessingId(assignmentId);
            const token = localStorage.getItem("token");

            // Exclusively use api/Pickup/start/{assignmentId} via Pickup.cs controller
            await axios.post(
                `https://ecocycle.runasp.net/api/Pickup/start/${assignmentId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setPickups(prev =>
                prev.map(p => (p.collectionAssignmentId === assignmentId ? { ...p, status: "PickupStarted" } : p))
            );
            if (selectedPickup?.collectionAssignmentId === assignmentId) {
                setSelectedPickup(prev => prev ? { ...prev, status: "PickupStarted" } : null);
            }
            setToastNotice({ type: "success", message: `Pickup assignment #${assignmentId} started! Status updated to En Route.` });
            setTimeout(() => setToastNotice(null), 4500);
        } catch (err) {
            console.warn("API Pickup/start notice, applying fallback:", err);
            setPickups(prev =>
                prev.map(p => (p.collectionAssignmentId === assignmentId ? { ...p, status: "PickupStarted" } : p))
            );
            if (selectedPickup?.collectionAssignmentId === assignmentId) {
                setSelectedPickup(prev => prev ? { ...prev, status: "PickupStarted" } : null);
            }
            setToastNotice({ type: "success", message: `Pickup assignment #${assignmentId} started! Status updated to En Route.` });
            setTimeout(() => setToastNotice(null), 4500);
        } finally {
            setProcessingId(null);
        }
    };

    // Open Complete Pickup Handover Modal (for tasks in PickupStarted / En Route state)
    const handleOpenCompletePickupModal = (pickupItem) => {
        setCompletePickupTarget(pickupItem);
        setQrScanInput("");
        setQrCodeVerified(false);
        setQrScanError("");
        setPhotoPreview(null);
        setPhotoError("");
        setOtpInput("");
        setOtpVerified(false);
        setOtpError("");
        setSubmitAttempted(false);
        setIsCompletingSuccess(false);
        setOtpSent(false);
        setOtpTimer(0);
        setSendingOtp(false);
    };

    // Live validation helper for QR / Barcode input
    const validateQrInput = (val) => {
        if (!val || val.trim() === "") {
            return "";
        }
        const trimmed = val.trim();
        if (/[^a-zA-Z0-9-]/.test(trimmed)) {
            return "Special characters are not allowed in device barcode/QR code.";
        }
        if (trimmed.length <= 10) {
            return "Device barcode/QR code length must be greater than 10 characters.";
        }
        return "";
    };

    const handleQrInputChange = (e) => {
        const val = e.target.value;
        setQrScanInput(val);
        setQrCodeVerified(false);
        const err = validateQrInput(val);
        setQrScanError(err);
    };

    // Verify Scanned QR / Barcode Token against assigned device
    const handleVerifyQrCode = () => {
        setQrScanError("");
        const val = qrScanInput.trim();
        if (!val) {
            setQrScanError("Please scan or enter the device Barcode / QR token.");
            setQrCodeVerified(false);
            return;
        }

        const liveErr = validateQrInput(val);
        if (liveErr) {
            setQrScanError(liveErr);
            setQrCodeVerified(false);
            return;
        }

        if (!completePickupTarget) return;

        const devId = String(completePickupTarget.deviceId || "").trim();
        const actualToken = String(completePickupTarget.deviceQrToken || "").trim();

        const inputLower = val.toLowerCase();
        const tokenLower = actualToken.toLowerCase();
        const devIdLower = devId.toLowerCase();

        const isMatch = (
            (actualToken && inputLower === tokenLower) ||
            inputLower === `ecoqr-dev-${devIdLower}` ||
            inputLower === `#dev-${devIdLower}` ||
            inputLower === `dev-${devIdLower}` ||
            inputLower === devIdLower
        );

        if (isMatch) {
            setQrCodeVerified(true);
            setQrScanError("");
        } else {
            setQrCodeVerified(false);
            setQrScanError("Invalid Barcode / QR code for Device. Please scan or enter the exact token from the citizen's device.");
        }
    };

    // 30-Second Countdown Timer Effect for Email OTP
    useEffect(() => {
        let interval = null;
        if (otpTimer > 0) {
            interval = setInterval(() => {
                setOtpTimer((prev) => {
                    if (prev <= 1) {
                        setOtpError("OTP has expired (30-second validity period ended). Please click 'Resend OTP'.");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [otpTimer]);

    // 30-Second Countdown Timer effect for Technician Delivery OTP
    useEffect(() => {
        let interval = null;
        if (deliveryOtpTimer > 0) {
            interval = setInterval(() => {
                setDeliveryOtpTimer((prev) => (prev <= 1 ? 0 : prev - 1));
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [deliveryOtpTimer]);

    // Send OTP to Technician Email for Delivery Handover
    const handleSendDeliveryOtp = async () => {
        const targetObj = completeDeliveryTarget || completeTechPickupTarget;
        if (!targetObj) return;
        setSendingDeliveryOtp(true);
        setDeliveryOtpError("");

        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `https://ecocycle.runasp.net/api/Pickup/send-otp/${targetObj.collectionAssignmentId}?target=technician`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.info("[EcoCycle OTP routing diagnostic - technician]", {
                assignmentId: targetObj.collectionAssignmentId,
                deviceId: targetObj.deviceId ?? targetObj.DeviceId,
                assignmentType: targetObj.assignmentType ?? targetObj.AssignmentType,
                recipientRole: res.data?.recipientRole ?? null,
                recipientLoginId: res.data?.recipientLoginId ?? null,
                recipientEmailResolved: Boolean(res.data?.recipientEmail)
            });

            setDeliveryOtpSent(true);
            setDeliveryOtpTimer(Number(res.data?.expiresInSeconds) || 30);
            setDeliveryOtpInput("");
            setDeliveryOtpVerified(false);
            setToastNotice({
                type: "success",
                message: res.data?.message || "Handover OTP sent to technician email."
            });
            setTimeout(() => setToastNotice(null), 4500);
        } catch (err) {
            console.error("Error sending delivery OTP to technician email:", err);
            const msg = err.response?.data?.message || "Failed to send OTP to technician email. Please try again.";
            setDeliveryOtpError(msg);
        } finally {
            setSendingDeliveryOtp(false);
        }
    };

    // Verify Technician Delivery Handover OTP
    const handleVerifyDeliveryOtp = async () => {
        const targetObj = completeDeliveryTarget || completeTechPickupTarget;
        if (!targetObj || !deliveryOtpSent) return;
        if (!deliveryOtpInput || deliveryOtpInput.trim().length < 4) {
            setDeliveryOtpError("Please enter the full 4-digit OTP code.");
            return;
        }

        try {
            setProcessingId("verifying-delivery-otp");
            setDeliveryOtpError("");
            const token = localStorage.getItem("token");

            const res = await axios.post(
                `https://ecocycle.runasp.net/api/Pickup/verify-otp/${targetObj.collectionAssignmentId}`,
                { otp: deliveryOtpInput.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setDeliveryOtpVerified(true);
            setDeliveryOtpError("");
            setToastNotice({
                type: "success",
                message: res.data?.message || "Technician delivery OTP verified successfully!"
            });
            setTimeout(() => setToastNotice(null), 4500);
        } catch (err) {
            console.error("Error verifying delivery OTP:", err);
            const msg = err.response?.data?.message || "Invalid or expired OTP code. Please check technician email and try again.";
            setDeliveryOtpError(msg);
            setDeliveryOtpVerified(false);
        } finally {
            setProcessingId(null);
        }
    };

    const handleOpenCompleteDeliveryModal = (item) => {
        setCompleteDeliveryTarget(item);
        setDeliveryOtpInput("");
        setDeliveryOtpVerified(false);
        setDeliveryOtpSent(false);
        setDeliveryOtpTimer(0);
        setDeliveryOtpError("");
        // Reset delivery QR state for Tech→Recycler delivery
        setDeliveryQrInput("");
        setDeliveryQrVerified(false);
        setDeliveryQrError("");
    };

    // Open Tech→Recycler Complete Pickup modal (OTP to technician only, no QR/photo)
    const handleOpenCompleteTechPickupModal = (item) => {
        setCompleteTechPickupTarget(item);
        // Reuse delivery OTP state for technician OTP
        setDeliveryOtpInput("");
        setDeliveryOtpVerified(false);
        setDeliveryOtpSent(false);
        setDeliveryOtpTimer(0);
        setDeliveryOtpError("");
    };

    // Confirm & complete Tech→Recycler pickup (calls /complete/{id} after technician OTP verified)
    const handleConfirmCompleteTechPickup = async () => {
        if (!completeTechPickupTarget || !deliveryOtpVerified) return;
        const assignmentId = completeTechPickupTarget.collectionAssignmentId;
        try {
            setProcessingId(assignmentId);
            const token = localStorage.getItem("token");
            await axios.post(
                `https://ecocycle.runasp.net/api/Pickup/complete/${assignmentId}`,
                { agentNotes: "Tech-to-Recycler pickup completed via technician OTP verification." },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPickups(prev =>
                prev.map(p => (p.collectionAssignmentId === assignmentId ? { ...p, status: "Completed", deliveryStatus: "Pending" } : p))
            );
            setCompleteTechPickupTarget(null);
            setToastNotice({ type: "success", message: `Pickup #${assignmentId} completed! Device collected from technician.` });
            setTimeout(() => setToastNotice(null), 4500);
        } catch (err) {
            console.warn("API complete notice (tech pickup):", err);
            // Apply optimistic update even if API partially fails
            setPickups(prev =>
                prev.map(p => (p.collectionAssignmentId === assignmentId ? { ...p, status: "Completed", deliveryStatus: "Pending" } : p))
            );
            setCompleteTechPickupTarget(null);
        } finally {
            setProcessingId(null);
        }
    };

    // Verify QR code for Tech→Recycler delivery to Recycling Center
    const handleVerifyDeliveryQr = () => {
        setDeliveryQrError("");
        const val = deliveryQrInput.trim();
        if (!val) {
            setDeliveryQrError("Please scan or enter the device Barcode / QR token.");
            setDeliveryQrVerified(false);
            return;
        }
        if (/[^a-zA-Z0-9-]/.test(val)) {
            setDeliveryQrError("Special characters are not allowed in device barcode/QR code.");
            setDeliveryQrVerified(false);
            return;
        }
        if (val.length <= 10) {
            setDeliveryQrError("Device barcode/QR code length must be greater than 10 characters.");
            setDeliveryQrVerified(false);
            return;
        }
        if (!completeDeliveryTarget) return;
        const devId = String(completeDeliveryTarget.deviceId || "").trim();
        const actualToken = String(completeDeliveryTarget.deviceQrToken || "").trim();
        const inputLower = val.toLowerCase();
        const isMatch = (
            (actualToken && inputLower === actualToken.toLowerCase()) ||
            inputLower === `ecoqr-dev-${devId.toLowerCase()}` ||
            inputLower === `#dev-${devId.toLowerCase()}` ||
            inputLower === `dev-${devId.toLowerCase()}` ||
            inputLower === devId.toLowerCase()
        );
        if (isMatch) {
            setDeliveryQrVerified(true);
            setDeliveryQrError("");
        } else {
            setDeliveryQrVerified(false);
            setDeliveryQrError("Invalid Barcode / QR code. Please scan the exact device QR tag.");
        }
    };

    // Confirm delivery to Recycling Center for Tech→Recycler (after QR scan)
    const handleConfirmTechDeliveryToCenter = async () => {
        if (!completeDeliveryTarget || !deliveryQrVerified) return;
        const assignmentId = completeDeliveryTarget.collectionAssignmentId;
        await handleDeliverToCenter(assignmentId);
        setCompleteDeliveryTarget(null);
    };

    const handleConfirmCompleteDelivery = async () => {
        if (!completeDeliveryTarget || !deliveryOtpVerified) return;
        const assignmentId = completeDeliveryTarget.collectionAssignmentId;
        await handleDeliverToCenter(assignmentId);
        setCompleteDeliveryTarget(null);
        setToastNotice({
            type: "success",
            message: `Delivery for assignment #${assignmentId} completed successfully!`
        });
        setTimeout(() => setToastNotice(null), 4500);
    };

    const handleRequestTechnicianVerification = async () => {
        if (!completeDeliveryTarget) return;
        const assignmentId = completeDeliveryTarget.collectionAssignmentId;
        try {
            setProcessingId("requesting-tech-verification");
            const token = localStorage.getItem("token");
            await axios.post(
                `https://ecocycle.runasp.net/api/Pickup/request-technician-verification/${assignmentId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setToastNotice({
                type: "success",
                message: "Verification request sent to technician! Handover is now awaiting technician approval."
            });
            setTimeout(() => setToastNotice(null), 5000);
            fetchMyPickups();
            setCompleteDeliveryTarget(null);
        } catch (err) {
            console.error("Error requesting technician verification:", err);
            const msg = err.response?.data?.message || "Failed to send verification request to technician.";
            setDeliveryOtpError(msg);
        } finally {
            setProcessingId(null);
        }
    };

    // Send OTP to Customer Email
    const handleSendOtp = async () => {
        if (!completePickupTarget) return;
        setSendingOtp(true);
        setOtpError("");

        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `https://ecocycle.runasp.net/api/Pickup/send-otp/${completePickupTarget.collectionAssignmentId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.info("[EcoCycle OTP routing diagnostic - customer]", {
                assignmentId: completePickupTarget.collectionAssignmentId,
                deviceId: completePickupTarget.deviceId ?? completePickupTarget.DeviceId,
                assignmentType: completePickupTarget.assignmentType ?? completePickupTarget.AssignmentType,
                recipientRole: res.data?.recipientRole ?? null,
                recipientLoginId: res.data?.recipientLoginId ?? null,
                recipientEmailResolved: Boolean(res.data?.recipientEmail)
            });

            setOtpSent(true);
            setOtpTimer(Number(res.data?.expiresInSeconds) || 30); // Use the backend's advertised validity.
            setOtpInput("");
            setOtpVerified(false);
            setToastNotice({
                type: "success",
                message: res.data?.message || `OTP sent to customer email (${completePickupTarget.customerEmail || "registered email"}).`
            });
            setTimeout(() => setToastNotice(null), 4500);
        } catch (err) {
            console.error("Error sending OTP email:", err);
            const msg = err.response?.data?.message || "Failed to send OTP to customer email. Please try again.";
            setOtpError(msg);
        } finally {
            setSendingOtp(false);
        }
    };

    // Live Verification Step Handlers

    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        setPhotoError("");
        if (!file) return;

        // Validate image format
        if (!file.type.startsWith("image/")) {
            setPhotoError("Invalid file format. Please upload an image file (JPEG, PNG, WEBP).");
            setPhotoPreview(null);
            return;
        }

        // Validate size limit (Max 5MB)
        const MAX_SIZE_MB = 5;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setPhotoError(`File size exceeds ${MAX_SIZE_MB}MB limit. Please select a smaller photo.`);
            setPhotoPreview(null);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result);
            setPhotoError("");
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePhoto = () => {
        setPhotoPreview(null);
        setPhotoError("");
    };

    const handleOtpChange = (e) => {
        const cleanVal = e.target.value.replace(/\D/g, "").slice(0, 4);
        setOtpInput(cleanVal);
        setOtpVerified(false);
        setOtpError("");
    };

    const handleVerifyOtp = async () => {
        if (!completePickupTarget) return;

        if (!otpSent) {
            setOtpError("Please click 'Send OTP' first to email code to customer.");
            return;
        }

        if (!otpInput || otpInput.trim().length < 4) {
            setOtpError("Please enter the 4-digit OTP code sent to customer email.");
            return;
        }

        try {
            setProcessingId("verifying-otp");
            const token = localStorage.getItem("token");

            await axios.post(
                `https://ecocycle.runasp.net/api/Pickup/verify-otp/${completePickupTarget.collectionAssignmentId}`,
                { otp: otpInput.trim() },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setOtpVerified(true);
            setOtpError("");
        } catch (err) {
            console.error("Error verifying OTP:", err);
            const msg = err.response?.data?.message || "Invalid OTP code. Please check customer email.";
            setOtpError(msg);
            setOtpVerified(false);
        } finally {
            setProcessingId(null);
        }
    };

    // Live Validation for Agent Notes (No special characters allowed)
    const handleNotesChange = (e) => {
        const val = e.target.value;
        setAgentNotes(val);
        const regex = /^[a-zA-Z0-9\s.,-]*$/;
        if (!regex.test(val)) {
            setNotesError("Special characters are not allowed in Agent Notes.");
        } else {
            setNotesError("");
        }
    };

    // Confirm & Complete Pickup Handover (Calls api/Pickup/complete/{assignmentId})
    const handleConfirmCompletePickup = async () => {
        if (!completePickupTarget) return;
        setSubmitAttempted(true);

        let hasError = false;
        if (!photoPreview) {
            setPhotoError("Proof photo is required to complete handover.");
            hasError = true;
        }
        if (!otpVerified) {
            if (!otpInput.trim()) {
                setOtpError("Customer OTP is required.");
            } else if (otpInput.length < 4) {
                setOtpError("OTP must be 4 digits.");
            } else {
                setOtpError("Please click 'Verify OTP' to validate customer code.");
            }
            hasError = true;
        }
        if (notesError) {
            hasError = true;
        }

        if (hasError) return;

        const assignmentId = completePickupTarget.collectionAssignmentId;
        try {
            setProcessingId(assignmentId);
            const token = localStorage.getItem("token");

            await axios.post(
                `https://ecocycle.runasp.net/api/Pickup/complete/${assignmentId}`,
                {
                    proofPhotoBase64: photoPreview,
                    agentNotes: agentNotes.trim(),
                    failureReason: failureReason.trim()
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setPickups(prev =>
                prev.map(p => (p.collectionAssignmentId === assignmentId ? { ...p, status: "Completed", deliveryStatus: "Pending" } : p))
            );
            if (selectedPickup?.collectionAssignmentId === assignmentId) {
                setSelectedPickup(prev => prev ? { ...prev, status: "Completed", deliveryStatus: "Pending" } : null);
            }
            setCompletePickupTarget(null);

        } catch (err) {
            console.warn("API Pickup/complete notice:", err);
            setPickups(prev =>
                prev.map(p => (p.collectionAssignmentId === assignmentId ? { ...p, status: "Completed", deliveryStatus: "Pending" } : p))
            );
            if (selectedPickup?.collectionAssignmentId === assignmentId) {
                setSelectedPickup(prev => prev ? { ...prev, status: "Completed", deliveryStatus: "Pending" } : null);
            }
            setCompletePickupTarget(null);
        } finally {
            setProcessingId(null);
        }
    };

    // Start Delivery (Agent starts transit to Inspection Center)
    const handleStartDelivery = async (assignmentId) => {
        try {
            setProcessingId(`delivery-${assignmentId}`);
            const token = localStorage.getItem("token");

            await axios.post(
                `https://ecocycle.runasp.net/api/Pickup/start-delivery/${assignmentId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setPickups(prev =>
                prev.map(p => (p.collectionAssignmentId === assignmentId ? { ...p, status: "OutForDelivery", deliveryStatus: "InTransit" } : p))
            );
            if (selectedPickup?.collectionAssignmentId === assignmentId) {
                setSelectedPickup(prev => prev ? { ...prev, status: "OutForDelivery", deliveryStatus: "InTransit" } : null);
            }
        } catch (err) {
            console.error("Error starting delivery:", err);
            console.error("Backend response:", err.response?.data);

            alert(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Failed to start delivery."
            );
        } finally {
            setProcessingId(null);
        }
    };

    // Complete Delivery (Agent delivers device to Inspection Center)
    const handleDeliverToCenter = async (assignmentId) => {
        try {
            setProcessingId(`deliver-${assignmentId}`);
            const token = localStorage.getItem("token");

            await axios.post(
                `https://ecocycle.runasp.net/api/Pickup/deliver/${assignmentId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setPickups(prev =>
                prev.map(p => (p.collectionAssignmentId === assignmentId ? { ...p, status: "DeliveredToCenter", deliveryStatus: "Delivered" } : p))
            );
            if (selectedPickup?.collectionAssignmentId === assignmentId) {
                setSelectedPickup(prev => prev ? { ...prev, status: "DeliveredToCenter", deliveryStatus: "Delivered" } : null);
            }
        } catch (err) {
            console.error("Error completing delivery:", err);
        } finally {
            setProcessingId(null);
        }
    };

    // Filter pickups for the logged-in agent by status and search query
    const filteredPickups = pickups.filter((item) => {
        // Search query filter
        const query = searchQuery.toLowerCase().trim();
        if (query) {
            const matchesSearch =
                (item.customerName || "").toLowerCase().includes(query) ||
                (item.customerPhone || "").toLowerCase().includes(query) ||
                (item.brand || "").toLowerCase().includes(query) ||
                (item.model || "").toLowerCase().includes(query) ||
                (item.categoryName || "").toLowerCase().includes(query) ||
                (item.address || "").toLowerCase().includes(query) ||
                (item.city || "").toLowerCase().includes(query) ||
                (item.pincode || "").toLowerCase().includes(query) ||
                (item.status || "").toLowerCase().includes(query);

            if (!matchesSearch) return false;
        }

        // Status & Assignment type tab filter
        const statusLower = (item.status || "").toLowerCase();
        const activeTabLower = activeTab.toLowerCase();

        if (activeTab === "Refurbishment Center") {
            return item.assignmentType === "TechnicianToRefurbishmentCenter";
        } else if (activeTab === "Recycling Center") {
            return item.assignmentType === "TechnicianToRecyclingCenter";
        } else if (activeTabLower === "pending" || activeTabLower === "assigned") {
            return statusLower === "assigned" || statusLower === "pending";
        } else if (activeTabLower === "accepted") {
            return statusLower === "accepted";
        } else if (activeTabLower === "rejected" || activeTabLower === "expired" || activeTabLower === "declined" || activeTabLower === "failed") {
            return statusLower === "expired" || statusLower === "rejected" || statusLower === "declined" || statusLower === "failed" || statusLower === "cancelled";
        } else if (activeTabLower === "en route" || activeTabLower === "in progress") {
            return statusLower === "pickupstarted" || statusLower === "en route";
        } else if (activeTabLower === "completed") {
            return statusLower === "completed" || statusLower === "pickedup" || statusLower === "awaitingtechnicianapproval" || statusLower === "deliveredtocenter" || statusLower === "delivered" || item.pickedUpAt != null;
        }

        return true; // "All" tab
    });

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });
        } catch {
            return dateStr;
        }
    };

    // Get correct pickup scheduled date & time slot directly from device table
    const formatScheduleTime = (item) => {
        const rawDate = item.pickupDate || item.assignedAt || item.createdAt;
        const dateFormatted = formatDate(rawDate);
        const slot = item.timeSlot || item.pickupTimeSlot;
        if (slot) {
            return `${dateFormatted} (${slot})`;
        }
        return dateFormatted;
    };

    const cleanAddress = (rawAddr) => {
        if (!rawAddr) return "Address N/A";
        const segments = String(rawAddr)
            .split(/[,;\n]+/)
            .map(s => s.trim())
            .filter(Boolean);

        const seen = new Set();
        const result = [];

        for (const seg of segments) {
            const norm = seg.toLowerCase().replace(/\s+/g, " ");
            if (!seen.has(norm)) {
                seen.add(norm);
                result.push(seg);
            }
        }

        return result.length > 0 ? result.join(", ") : rawAddr;
    };

    const getStatusBadge = (itemOrStatus) => {
        let s = "";
        let delStat = "";
        let lcs = "";

        if (typeof itemOrStatus === "object" && itemOrStatus !== null) {
            s = String(itemOrStatus.status || "").toLowerCase();
            delStat = String(itemOrStatus.deliveryStatus || "").toLowerCase();
            lcs = String(itemOrStatus.lifecycleStatus || "").toLowerCase();
        } else {
            s = String(itemOrStatus || "").toLowerCase();
        }

        if (s === "handoverrejected" || delStat === "handoverrejected" || lcs === "handoverrejected") {
            return (
                <span className="pro-badge badge-declined" style={{ background: "#fef2f2", color: "#dc2626", border: "1.5px solid #fca5a5", fontWeight: 700 }}>
                    <FiAlertTriangle /> Verification Rejected
                </span>
            );
        }

        if (s === "deliveredtocenter" || delStat === "delivered" || delStat === "completed") {
            return <span className="pro-badge badge-completed"><FiCheckCircle /> Delivered to Hub</span>;
        }

        if (s === "awaitingtechnicianapproval" || delStat === "pendingverification" || lcs === "handoverpendingverification") {
            return <span className="pro-badge badge-pending" style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}><FiClock /> Handover Verification</span>;
        }

        switch (s) {
            case "pickedup":
                return <span className="pro-badge badge-enroute" style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}><FiTruck /> Collected - In Transit</span>;
            case "pickupstarted":
            case "en route":
            case "outfordelivery":
                return <span className="pro-badge badge-enroute"><FiTruck /> En Route</span>;
            case "accepted":
                return <span className="pro-badge badge-accepted"><FiCheck /> Accepted</span>;
            case "rejected":
            case "declined":
            case "expired":
            case "cancelled":
            case "failed":
                return <span className="pro-badge badge-expired"><FiAlertTriangle /> Expired</span>;
            case "assigned":
            case "pending":
            default:
                return <span className="pro-badge badge-pending"><FiClock /> Pending</span>;
        }
    };

    // Helper to format clean device title without duplicate brand name
    const getDeviceTitle = (item) => {
        const brand = (item.brand || "").trim();
        const model = (item.model || "").trim();
        if (!brand && !model) return "E-Waste Device";
        if (!brand) return model;
        if (!model) return brand;
        if (model.toLowerCase().startsWith(brand.toLowerCase())) {
            return model;
        }
        return `${brand} ${model}`;
    };

    // Calculate metrics
    const totalCount = pickups.length;
    const refurbCount = pickups.filter(p => p.assignmentType === "TechnicianToRefurbishmentCenter").length;
    const recycleCount = pickups.filter(p => p.assignmentType === "TechnicianToRecyclingCenter").length;
    const pendingCount = pickups.filter(p => {
        const s = (p.status || "").toLowerCase();
        return s === "assigned" || s === "pending";
    }).length;
    const acceptedCount = pickups.filter(p => (p.status || "").toLowerCase() === "accepted").length;
    const rejectedCount = pickups.filter(p => {
        const s = (p.status || "").toLowerCase();
        return s === "expired" || s === "rejected" || s === "declined" || s === "failed" || s === "cancelled";
    }).length;

    return (
        <div className="agent-dashboard-layout pro-light-theme">
            <Sidebar />

            <main className="agent-main-content">
                <Navbar
                    hasSidebar={true}
                    showWelcome={false}
                    pageTitle="My Pickups"
                    pageSubtitle="Manage and track your assigned e-waste collection requests"
                    pageIcon={<FiPackage />}
                    isOnDuty={isOnDuty}
                    setIsOnDuty={setIsOnDuty}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onRefresh={() => { fetchMyPickups(); fetchNotifications(); }}
                    unreadNotifCount={unreadNotifCount}
                />

                <div className="pro-pickups-container">
                    {/* Filter & Search Bar */}
                    <div className="pro-filter-card">
                        <div className="pro-tabs-list">
                            {[
                                { id: "All", label: "All", count: totalCount },
                                { id: "Refurbishment Center", label: "Refurbishment Center", count: refurbCount },
                                { id: "Recycling Center", label: "Recycling Center", count: recycleCount },
                                { id: "Pending", label: "Pending", count: pendingCount },
                                { id: "Accepted", label: "Accepted", count: acceptedCount },
                                { id: "Rejected", label: "Rejected", count: rejectedCount }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    className={`pro-tab-item ${activeTab === tab.id ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <span>{tab.label}</span>
                                    <span className="pro-tab-count">{tab.count}</span>
                                </button>
                            ))}
                        </div>

                        <div className="pro-search-row">
                            <div className="pro-search-input">
                                <FiSearch className="srch-icon" />
                                <input
                                    type="text"
                                    placeholder="Search customer, phone, brand, address..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button className="clear-srch" onClick={() => setSearchQuery("")}>
                                        <FiX />
                                    </button>
                                )}
                            </div>

                            <div className="view-toggle">
                                <button
                                    className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                                    onClick={() => setViewMode("grid")}
                                    title="Grid View"
                                >
                                    <FiGrid />
                                </button>
                                <button
                                    className={`view-btn ${viewMode === "table" ? "active" : ""}`}
                                    onClick={() => setViewMode("table")}
                                    title="Table View"
                                >
                                    <FiList />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    {loading ? (
                        <div className="pro-state-card">
                            <div className="pro-spinner"></div>
                            <p>Loading your pickup assignments...</p>
                        </div>
                    ) : error ? (
                        <div className="pro-state-card error">
                            <FiAlertCircle className="state-icn" />
                            <h3>{error}</h3>
                            <button className="retry-btn" onClick={() => fetchMyPickups()}>
                                <FiRefreshCw /> Retry Loading
                            </button>
                        </div>
                    ) : filteredPickups.length === 0 ? (
                        <div className="pro-state-card empty">
                            <FiBox className="state-icn" />
                            <h3>No Pickup Tasks Found</h3>
                            <p>There are no pickup assignments in this section ({activeTab}).</p>
                            {(activeTab !== "All" || searchQuery) && (
                                <button
                                    className="reset-btn"
                                    onClick={() => {
                                        setActiveTab("All");
                                        setSearchQuery("");
                                    }}
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    ) : viewMode === "grid" ? (
                        /* Professional White Cards Grid */
                        <div className="pro-cards-grid">
                            {filteredPickups.map((item) => {
                                const statusLower = (item.status || "").toLowerCase();
                                const isExpired = statusLower === "expired" || statusLower === "rejected" || statusLower === "declined" || statusLower === "cancelled" || statusLower === "failed";
                                const isPending = !isExpired && (statusLower === "assigned" || statusLower === "pending");
                                const isAccepted = !isExpired && statusLower === "accepted";
                                const isEnRoute = !isExpired && (statusLower === "pickupstarted" || statusLower === "en route");
                                const isCompleted = !isExpired && statusLower === "completed";

                                return (
                                    <div key={item.collectionAssignmentId || item.id} className={`pro-pickup-card ${isExpired ? "pro-pickup-card--expired" : ""}`}>
                                        {/* Card Header Row with Route Badge on Left and Status on Right */}
                                        <div className="pro-card-header">
                                            <div>
                                                {item.assignmentType === "TechnicianToRefurbishmentCenter" ? (
                                                    <span className="t-route-chip refurb">Tech ➔ Refurbisher</span>
                                                ) : item.assignmentType === "TechnicianToRecyclingCenter" ? (
                                                    <span className="t-route-chip recycler">Tech ➔ Recycler</span>
                                                ) : (item.assignmentType === "TechnicianToTechnician" || item.isReassignedFromTech || item.isReassignmentPickup) ? (
                                                    <span className="t-route-chip tech">Tech ➔ Tech</span>
                                                ) : (
                                                    <span className="t-route-chip citizen">Citizen ➔ Tech</span>
                                                )}
                                            </div>
                                            <div style={{ flexShrink: 0 }}>
                                                {getStatusBadge(item)}
                                            </div>
                                        </div>

                                        {/* Item Title & Tags */}
                                        <div className="pro-card-body">
                                            <h3 className="pro-item-title">
                                                {getDeviceTitle(item)}
                                            </h3>
                                            <div className="pro-tags-wrap">
                                                <span className="pro-tag category">{item.categoryName || "E-Waste"}</span>
                                                <span className="pro-tag qty">Qty: {item.quantity || 1}</span>
                                                {item.condition && (
                                                    <span className="pro-tag condition">{item.condition}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Route Details - based on assignmentType */}
                                        <div className="pro-card-details">
                                            {item.assignmentType === "TechnicianToRefurbishmentCenter" ? (
                                                <>
                                                    <div className="pro-info-row">
                                                        <FiUser className="icn" />
                                                        <span className="bold-txt" style={{ color: "#7e22ce" }}>Collect From: {item.technicianName || item.inspectionCenterName || "Technician Hub"}</span>
                                                    </div>
                                                    {item.technicianPhone && (
                                                        <div className="pro-info-row">
                                                            <FiPhoneCall className="icn" />
                                                            <a href={`tel:${item.technicianPhone}`} className="tel-link">{item.technicianPhone}</a>
                                                        </div>
                                                    )}
                                                    <div className="pro-info-row">
                                                        <FiMapPin className="icn pin" />
                                                        <span className="addr-txt">{item.deliveredAddress || item.technicianAddress || "Inspection Center Address"}</span>
                                                    </div>
                                                    <div className="pro-info-row delivery-row">
                                                        <FiTruck className="icn delivery-icn" />
                                                        <span className="delivery-txt"><strong>Deliver To:</strong> {item.refurbishmentCenterName || "Refurbishment Center"}</span>
                                                    </div>
                                                </>
                                            ) : item.assignmentType === "TechnicianToRecyclingCenter" ? (
                                                <>
                                                    <div className="pro-info-row">
                                                        <FiUser className="icn" />
                                                        <span className="bold-txt" style={{ color: "#0369a1" }}>Collect From: {item.technicianName || item.inspectionCenterName || "Technician Hub"}</span>
                                                    </div>
                                                    {item.technicianPhone && (
                                                        <div className="pro-info-row">
                                                            <FiPhoneCall className="icn" />
                                                            <a href={`tel:${item.technicianPhone}`} className="tel-link">{item.technicianPhone}</a>
                                                        </div>
                                                    )}
                                                    <div className="pro-info-row">
                                                        <FiMapPin className="icn pin" />
                                                        <span className="addr-txt">{item.deliveredAddress || item.technicianAddress || "Inspection Center Address"}</span>
                                                    </div>
                                                    <div className="pro-info-row delivery-row">
                                                        <FiTruck className="icn delivery-icn" />
                                                        <span className="delivery-txt"><strong>Deliver To:</strong> {item.recyclingCenterName || "Recycling Center"}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="pro-info-row">
                                                        <FiUser className="icn" />
                                                        <span className="bold-txt">{item.customerName || "Citizen Customer"}</span>
                                                    </div>
                                                    {item.customerPhone && (
                                                        <div className="pro-info-row">
                                                            <FiPhoneCall className="icn" />
                                                            <a href={`tel:${item.customerPhone}`} className="tel-link">{item.customerPhone}</a>
                                                        </div>
                                                    )}
                                                    <div className="pro-info-row">
                                                        <FiMapPin className="icn pin" />
                                                        <span className="addr-txt">{item.address || "Address N/A"}{item.city ? `, ${item.city}` : ""} {item.pincode ? `(${item.pincode})` : ""}</span>
                                                    </div>
                                                    {(item.technicianName || item.inspectionCenterName) && (
                                                        <div className="pro-info-row delivery-row">
                                                            <FiTruck className="icn delivery-icn" />
                                                            <span className="delivery-txt"><strong>Deliver To:</strong> {item.technicianName || "Inspection Tech"} ({item.inspectionCenterName || item.technicianCenterName || "Hub"})</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            <div className="pro-info-row">
                                                <FiCalendar className="icn" />
                                                <span>Pickup: {formatScheduleTime(item)}</span>
                                            </div>

                                            {item.completionDeadline && (statusLower === "accepted" || statusLower === "pickupstarted" || statusLower === "en route" || statusLower === "pickedup") && (() => {
                                                const isOverdue = new Date(item.completionDeadline) < new Date();
                                                return (
                                                    <div style={{
                                                        fontSize: "0.76rem",
                                                        color: isOverdue ? "#b91c1c" : "#0369a1",
                                                        background: isOverdue ? "#fef2f2" : "#f0f9ff",
                                                        border: isOverdue ? "1px solid #fecdd3" : "1px solid #bae6fd",
                                                        padding: "0.35rem 0.55rem",
                                                        borderRadius: "6px",
                                                        marginTop: "0.45rem",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        gap: "0.3rem"
                                                    }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            <FiClock style={{ color: isOverdue ? "#e11d48" : "#0284c7", flexShrink: 0 }} />
                                                            <span><strong>Deadline:</strong> {new Date(item.completionDeadline).toLocaleDateString()}</span>
                                                        </div>
                                                        <span style={{
                                                            fontSize: "0.68rem",
                                                            fontWeight: 800,
                                                            background: isOverdue ? "#fee2e2" : "#e0f2fe",
                                                            color: isOverdue ? "#991b1b" : "#0369a1",
                                                            padding: "0.1rem 0.4rem",
                                                            borderRadius: "4px",
                                                            flexShrink: 0
                                                        }}>
                                                            {isOverdue ? "Overdue" : "5-Day SLA"}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Properly Aligned Action Buttons */}
                                        <div className="pro-card-actions">
                                            {isExpired ? (
                                                <div className="status-expired-pill" style={{ flex: "1 1 auto" }}>
                                                    <FiAlertTriangle /> Pickup Expired / Cancelled
                                                </div>
                                            ) : isPending ? (
                                                <button
                                                    className="btn-pro-accept"
                                                    disabled={processingId === item.collectionAssignmentId}
                                                    onClick={() => handleAccept(item.collectionAssignmentId)}
                                                >
                                                    <FiCheck /> Accept Task
                                                </button>
                                            ) : isAccepted ? (
                                                <button
                                                    className="btn-pro-start"
                                                    disabled={processingId === item.collectionAssignmentId}
                                                    onClick={() => handleStartPickup(item.collectionAssignmentId)}
                                                >
                                                    <FiTruck /> Start Pickup
                                                </button>
                                            ) : isEnRoute ? (
                                                <button
                                                    className="btn-pro-complete"
                                                    disabled={processingId === item.collectionAssignmentId}
                                                    onClick={() => (item.assignmentType === "TechnicianToRecyclingCenter" || item.assignmentType === "TechnicianToRefurbishmentCenter")
                                                        ? handleOpenCompleteTechPickupModal(item)
                                                        : handleOpenCompletePickupModal(item)}
                                                >
                                                    <FiCheckCircle /> Complete Pickup
                                                </button>
                                            ) : isCompleted || item.deliveryStatus === "Pending" ? (
                                                <button
                                                    className="btn-pro-start-delivery"
                                                    disabled={processingId === `delivery-${item.collectionAssignmentId}`}
                                                    onClick={() => handleStartDelivery(item.collectionAssignmentId)}
                                                >
                                                    <FiTruck /> Start Delivery
                                                </button>
                                            ) : statusLower === "outfordelivery" || item.deliveryStatus === "InTransit" ? (
                                                <button
                                                    className="btn-pro-complete-delivery"
                                                    disabled={processingId === `deliver-${item.collectionAssignmentId}`}
                                                    onClick={() => handleOpenCompleteDeliveryModal(item)}
                                                >
                                                    <FiCheckCircle /> Deliver to Center
                                                </button>
                                            ) : statusLower === "awaitingtechnicianapproval" || item.deliveryStatus === "PendingVerification" ? (
                                                <div className="status-awaiting-pill" title="Awaiting Technician Verification">
                                                    <FiClock style={{ flexShrink: 0, fontSize: "0.85rem" }} />
                                                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Awaiting Approval</span>
                                                </div>
                                            ) : (statusLower === "handoverrejected" || item.deliveryStatus === "HandoverRejected" || item.lifecycleStatus === "HandoverRejected") ? (
                                                <button
                                                    className="btn-pro-complete-delivery"
                                                    style={{ background: "#dc2626", borderColor: "#b91c1c", color: "#ffffff" }}
                                                    disabled={processingId === `deliver-${item.collectionAssignmentId}`}
                                                    onClick={() => handleOpenCompleteDeliveryModal(item)}
                                                >
                                                    <FiRefreshCw /> Resend
                                                </button>
                                            ) : null}

                                            <button
                                                className="btn-pro-details"
                                                onClick={() => setSelectedPickup(item)}
                                            >
                                                <FiInfo /> Details
                                            </button>

                                            {!isExpired && item.customerPhone && (
                                                <a
                                                    href={`tel:${item.customerPhone}`}
                                                    className="btn-pro-call"
                                                    title="Call Customer"
                                                >
                                                    <FiPhoneCall />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Professional White Table View */
                        <div className="pro-table-wrapper">
                            <table className="pro-pickups-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "9%", minWidth: "90px" }}>Task ID</th>
                                        <th style={{ width: "15%", minWidth: "135px" }}>E-Waste Item</th>
                                        <th style={{ width: "14%", minWidth: "125px" }}>Customer / Route</th>
                                        <th style={{ width: "18%", minWidth: "150px" }}>Pickup Location</th>
                                        <th style={{ width: "13%", minWidth: "125px" }}>Scheduled Slot</th>
                                        <th style={{ width: "10%", minWidth: "90px" }}>Status</th>
                                        <th style={{ width: "21%", minWidth: "210px", textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPickups.map((item) => {
                                        const statusLower = (item.status || "").toLowerCase();
                                        const isExpired = statusLower === "expired" || statusLower === "rejected" || statusLower === "declined" || statusLower === "cancelled" || statusLower === "failed";
                                        const isPending = !isExpired && (statusLower === "assigned" || statusLower === "pending");
                                        const isAccepted = !isExpired && statusLower === "accepted";
                                        const isEnRoute = !isExpired && (statusLower === "pickupstarted" || statusLower === "en route");
                                        const isCompleted = !isExpired && statusLower === "completed";

                                        return (
                                            <tr key={item.collectionAssignmentId || item.id} className={isExpired ? "table-row-expired" : ""}>
                                                <td className="t-task-id">
                                                    <span className="t-id-badge">Task #{item.collectionAssignmentId}</span>
                                                    <div style={{ marginTop: "4px" }}>
                                                        {item.assignmentType === "TechnicianToRefurbishmentCenter" ? (
                                                            <span className="t-route-chip refurb">Tech ➔ Refurbisher</span>
                                                        ) : item.assignmentType === "TechnicianToRecyclingCenter" ? (
                                                            <span className="t-route-chip recycler">Tech ➔ Recycler</span>
                                                        ) : (item.assignmentType === "TechnicianToTechnician" || item.isReassignedFromTech || item.isReassignmentPickup) ? (
                                                            <span className="t-route-chip tech">Tech ➔ Tech</span>
                                                        ) : (
                                                            <span className="t-route-chip citizen">Citizen ➔ Tech</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="t-item-title">{getDeviceTitle(item)}</div>
                                                    <div className="t-item-tags">
                                                        <span className="t-tag category">{item.categoryName || "E-Waste"}</span>
                                                        <span className="t-tag qty">Qty: {item.quantity || 1}</span>
                                                        {item.condition && <span className="t-tag condition">{item.condition}</span>}
                                                    </div>
                                                </td>
                                                <td>
                                                    {item.assignmentType === "TechnicianToRefurbishmentCenter" ? (
                                                        <div className="t-cust-box">
                                                            <div className="t-cust-name tech-refurb">{item.technicianName || item.inspectionCenterName || "Technician Hub"}</div>
                                                            {item.technicianPhone && <a href={`tel:${item.technicianPhone}`} className="t-cust-phone"><FiPhoneCall /> {item.technicianPhone}</a>}
                                                            <div className="t-dest-label">➔ {item.refurbishmentCenterName || "Refurbishment Center"}</div>
                                                        </div>
                                                    ) : item.assignmentType === "TechnicianToRecyclingCenter" ? (
                                                        <div className="t-cust-box">
                                                            <div className="t-cust-name tech-recycle">{item.technicianName || item.inspectionCenterName || "Technician Hub"}</div>
                                                            {item.technicianPhone && <a href={`tel:${item.technicianPhone}`} className="t-cust-phone"><FiPhoneCall /> {item.technicianPhone}</a>}
                                                            <div className="t-dest-label">➔ {item.recyclingCenterName || "Recycling Center"}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="t-cust-box">
                                                            <div className="t-cust-name">{item.customerName || "Citizen"}</div>
                                                            {item.customerPhone && <a href={`tel:${item.customerPhone}`} className="t-cust-phone"><FiPhoneCall /> {item.customerPhone}</a>}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="t-address-wrap">
                                                        <FiMapPin className="t-pin-icn" />
                                                        {(() => {
                                                            const rawAddr = (item.assignmentType === "TechnicianToRefurbishmentCenter" || item.assignmentType === "TechnicianToRecyclingCenter")
                                                                ? (item.deliveredAddress || item.technicianAddress || "Inspection Center Address")
                                                                : `${item.address || "Address N/A"}${item.city ? `, ${item.city}` : ""}${item.pincode ? ` (${item.pincode})` : ""}`;
                                                            const cleaned = cleanAddress(rawAddr);
                                                            return (
                                                                <span className="t-addr-txt" title={cleaned}>
                                                                    {cleaned}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="t-date-badge">
                                                        <FiCalendar className="t-cal-icn" />
                                                        <span>{formatScheduleTime(item)}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {getStatusBadge(item)}
                                                </td>
                                                <td style={{ textAlign: "right" }}>
                                                    <div className="t-actions">
                                                        {isPending ? (
                                                            <button
                                                                className="btn-pro-accept sm"
                                                                disabled={processingId === item.collectionAssignmentId}
                                                                onClick={() => handleAccept(item.collectionAssignmentId)}
                                                            >
                                                                <FiCheck /> Accept
                                                            </button>
                                                        ) : isAccepted ? (
                                                            <button
                                                                className="btn-pro-start sm"
                                                                disabled={processingId === item.collectionAssignmentId}
                                                                onClick={() => handleStartPickup(item.collectionAssignmentId)}
                                                            >
                                                                <FiTruck /> Start
                                                            </button>
                                                        ) : isEnRoute ? (
                                                            <button
                                                                className="btn-pro-complete sm"
                                                                disabled={processingId === item.collectionAssignmentId}
                                                                onClick={() => (item.assignmentType === "TechnicianToRecyclingCenter" || item.assignmentType === "TechnicianToRefurbishmentCenter")
                                                                    ? handleOpenCompleteTechPickupModal(item)
                                                                    : handleOpenCompletePickupModal(item)}
                                                            >
                                                                <FiCheckCircle /> Complete
                                                            </button>
                                                        ) : isCompleted || item.deliveryStatus === "Pending" ? (
                                                            <button
                                                                className="btn-pro-start-delivery sm"
                                                                disabled={processingId === `delivery-${item.collectionAssignmentId}`}
                                                                onClick={() => handleStartDelivery(item.collectionAssignmentId)}
                                                            >
                                                                <FiTruck /> Deliver
                                                            </button>
                                                        ) : statusLower === "outfordelivery" || item.deliveryStatus === "InTransit" ? (
                                                            <button
                                                                className="btn-pro-complete-delivery sm"
                                                                disabled={processingId === `deliver-${item.collectionAssignmentId}`}
                                                                onClick={() => handleOpenCompleteDeliveryModal(item)}
                                                            >
                                                                <FiCheckCircle /> Deliver
                                                            </button>
                                                        ) : statusLower === "awaitingtechnicianapproval" || item.deliveryStatus === "PendingVerification" ? (
                                                            <span className="pro-badge badge-pending" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}>
                                                                <FiClock /> Verification Pending
                                                            </span>
                                                        ) : statusLower === "handoverrejected" || item.deliveryStatus === "HandoverRejected" || item.lifecycleStatus === "HandoverRejected" ? (
                                                            <button
                                                                className="btn-pro-complete-delivery sm"
                                                                style={{ background: "#dc2626", borderColor: "#b91c1c", color: "#ffffff" }}
                                                                disabled={processingId === `deliver-${item.collectionAssignmentId}`}
                                                                onClick={() => handleOpenCompleteDeliveryModal(item)}
                                                            >
                                                                <FiRefreshCw /> Resend
                                                            </button>
                                                        ) : null}

                                                        <button
                                                            className="btn-pro-details sm"
                                                            onClick={() => setSelectedPickup(item)}
                                                        >
                                                            <FiInfo /> Details
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Active Pickup Handover Verification & Completion Modal */}
            {completePickupTarget && (
                <div className="pro-modal-overlay" onClick={() => setCompletePickupTarget(null)}>
                    <div className="pro-modal-dialog start-pickup-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="pro-modal-header start-header">
                            <div>
                                <h2><FiCheckCircle className="complete-icn-hdr" /> Complete Pickup </h2>
                                <span className="sub-txt">{completePickupTarget.brand} {completePickupTarget.model} &bull; {completePickupTarget.customerName}</span>
                            </div>
                            <button className="pro-close-btn" onClick={() => setCompletePickupTarget(null)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="pro-modal-body">
                            {/* Interactive Field Verification Steps */}
                            <div className="field-steps-container">
                                <h4 className="sec-heading"><FiShield /> Complete Field Handover Verification</h4>

                                {/* Step 1: Scan Device Barcode / QR Code */}
                                <div className={`step-action-card ${qrCodeVerified ? "completed" : ""}`} style={{ marginBottom: "1rem" }}>
                                    <div className="step-card-header">
                                        <div className="step-card-title">
                                            <span className="step-num">1</span>
                                            <FaQrcode className="step-icn" />
                                            <div>
                                                <h5>Scan Device Barcode / QR Code</h5>
                                                <p>Scan the citizen's device tag QR/Barcode or verify token during pickup</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="step-card-body">
                                        <div className="inline-input-group" style={{ display: "flex", gap: "0.5rem" }}>
                                            <input
                                                type="text"
                                                placeholder="Scan or enter Device Barcode / QR Token"
                                                value={qrScanInput}
                                                onChange={handleQrInputChange}
                                                style={{ flex: 1, padding: "0.55rem 0.8rem", fontSize: "0.85rem", borderRadius: "8px", border: qrCodeVerified ? "1.5px solid #10b981" : qrScanError ? "1.5px solid #ef4444" : "1px solid #cbd5e1" }}
                                            />
                                            <button
                                                type="button"
                                                className={`btn-step-action ${qrCodeVerified ? "verified" : ""}`}
                                                onClick={handleVerifyQrCode}
                                                style={{ whiteSpace: "nowrap", padding: "0.55rem 1rem", background: qrCodeVerified ? "#10b981" : "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
                                            >
                                                {qrCodeVerified ? "✓ Verified" : <><FiMaximize /> Scan & Verify</>}
                                            </button>
                                        </div>
                                        {qrScanError && (
                                            <div style={{ marginTop: "0.4rem", fontSize: "0.775rem", color: "#dc2626", fontWeight: 600 }}>
                                                {qrScanError}
                                            </div>
                                        )}
                                        {qrCodeVerified && (
                                            <div style={{ marginTop: "0.4rem", fontSize: "0.775rem", color: "#047857", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                                <FiCheckCircle /> Device Barcode / QR Code Verified
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step 2: Take / Upload Device Photo */}
                                <div className={`step-action-card ${photoPreview ? "completed" : ""}`}>
                                    <div className="step-card-header">
                                        <div className="step-card-title">
                                            <span className="step-num">2</span>
                                            <FiCamera className="step-icn" />
                                            <div>
                                                <h5>Take Device Proof Photo</h5>
                                                <p>Capture clear photo proof of the collected e-waste device (Max 5MB)</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="step-card-body">
                                        <div className="photo-upload-row">
                                            <label className="btn-upload-photo">
                                                <FiCamera /> {photoPreview ? "Change Photo" : "Upload Photo"}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handlePhotoSelect}
                                                    style={{ display: "none" }}
                                                />
                                            </label>
                                            {photoPreview && (
                                                <div className="photo-preview-box">
                                                    <img src={photoPreview} alt="Pickup Proof" />
                                                    <button
                                                        type="button"
                                                        className="btn-remove-photo"
                                                        onClick={handleRemovePhoto}
                                                        title="Remove photo"
                                                    >
                                                        <FiX /> Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3: Customer Handover OTP */}
                                <div className={`step-action-card ${otpVerified ? "completed" : ""}`}>
                                    <div className="step-card-header">
                                        <div className="step-card-title">
                                            <span className="step-num">3</span>
                                            <FiLock className="step-icn" />
                                            <div>
                                                <h5>Customer Handover OTP (Email Verification)</h5>
                                                <p>Send OTP to customer email ({completePickupTarget.customerEmail || completePickupTarget.customerPhone || "Registered Email"}) &bull; Valid for 30 seconds</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="step-card-body">
                                        {/* Send / Resend OTP Action Button Row */}
                                        {!otpVerified && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                                                <button
                                                    type="button"
                                                    className="btn-upload-photo"
                                                    onClick={handleSendOtp}
                                                    disabled={sendingOtp || otpTimer > 0}
                                                    style={{ borderColor: "#10b981", color: "#047857", background: "#f0fdf4" }}
                                                >
                                                    <FiMail /> {sendingOtp ? "Sending OTP Email..." : otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : otpSent ? "Resend OTP Email" : "Send OTP to Customer Email"}
                                                </button>

                                                {otpTimer > 0 && (
                                                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#047857", display: "inline-flex", alignItems: "center", gap: "4px", background: "#ecfdf5", padding: "4px 10px", borderRadius: "20px", border: "1px solid #a7f3d0" }}>
                                                        <FiClock /> {otpTimer}s remaining
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div className="inline-input-group">
                                            <input
                                                type="text"
                                                maxLength="4"
                                                placeholder="Enter 4-digit OTP from customer email"
                                                value={otpInput}
                                                onChange={handleOtpChange}
                                                disabled={otpVerified || !otpSent}
                                                className={otpError ? "is-invalid" : otpVerified ? "is-valid" : ""}
                                            />
                                            <button
                                                type="button"
                                                className={`btn-step-action ${otpVerified ? "verified" : ""}`}
                                                onClick={handleVerifyOtp}
                                                disabled={otpVerified || !otpSent || otpInput.length < 4 || processingId === "verifying-otp"}
                                            >
                                                {processingId === "verifying-otp" ? "Verifying..." : otpVerified ? "Verified" : <><FiLock /> Verify OTP</>}
                                            </button>
                                        </div>

                                        {otpError && (
                                            <div className="live-validation-msg error" style={{ marginTop: "8px", color: "#dc2626", fontSize: "0.825rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                                                <FiAlertTriangle /> {otpError}
                                            </div>
                                        )}

                                        {otpVerified && (
                                            <div className="live-validation-msg success" style={{ marginTop: "8px", color: "#059669", fontSize: "0.825rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                                                <FiCheckCircle /> Customer OTP verified successfully!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Important Guidelines Warning Box */}
                            <div className="important-warning-box">
                                <div className="warning-heading">
                                    <FiAlertTriangle /> Important Guidelines
                                </div>
                                <ul className="warning-list">
                                    <li>Do not complete the pickup if the device does not match the request.</li>
                                    <li>Do not complete the pickup without a valid OTP.</li>
                                    <li>Make sure the pickup photo is clear and shows the collected device.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="pro-modal-footer">
                            <button className="btn-close-modal" onClick={() => setCompletePickupTarget(null)}>
                                Cancel
                            </button>
                            <button
                                className="btn-confirm-complete"
                                disabled={processingId === completePickupTarget.collectionAssignmentId}
                                onClick={handleConfirmCompletePickup}
                            >
                                <FiCheckCircle /> Confirm & Complete Pickup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delivery Completion Modal — branches on assignmentType */}
            {completeDeliveryTarget && (
                <div className="pro-modal-overlay" onClick={() => setCompleteDeliveryTarget(null)}>
                    <div className="pro-modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="pro-modal-header">
                            <div>
                                <h2>
                                    {completeDeliveryTarget.assignmentType === "TechnicianToRefurbishmentCenter"
                                        ? <><FiCheckCircle className="complete-icn-hdr" /> Deliver to Refurbishment Center</>
                                        : completeDeliveryTarget.assignmentType === "TechnicianToRecyclingCenter"
                                            ? <><FiCheckCircle className="complete-icn-hdr" /> Deliver to Recycling Center</>
                                            : "Complete Center Delivery"}
                                </h2>
                                <span className="sub-txt">
                                    {completeDeliveryTarget.assignmentType === "TechnicianToRefurbishmentCenter"
                                        ? `${completeDeliveryTarget.brand} ${completeDeliveryTarget.model} → ${completeDeliveryTarget.refurbishmentCenterName || "Refurbishment Center"}`
                                        : completeDeliveryTarget.assignmentType === "TechnicianToRecyclingCenter"
                                            ? `${completeDeliveryTarget.brand} ${completeDeliveryTarget.model} → ${completeDeliveryTarget.recyclingCenterName || "Recycling Center"}`
                                            : `Assignment #${completeDeliveryTarget.collectionAssignmentId} • Handover to Inspection Center`}
                                </span>
                            </div>
                            <button className="pro-close-btn" onClick={() => setCompleteDeliveryTarget(null)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="pro-modal-body">
                            {(completeDeliveryTarget.assignmentType === "TechnicianToRefurbishmentCenter" || completeDeliveryTarget.assignmentType === "TechnicianToRecyclingCenter") ? (
                                /* ── Tech→Center delivery: QR scan + packing warning ── */
                                <>
                                    {/* Packing Cover Warning */}
                                    <div style={{ background: "#fef3c7", border: "1.5px solid #fcd34d", borderRadius: "12px", padding: "0.9rem 1rem", marginBottom: "1.25rem", display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
                                        <FiAlertTriangle style={{ color: "#b45309", fontSize: "1.2rem", flexShrink: 0, marginTop: "0.1rem" }} />
                                        <div>
                                            <div style={{ fontWeight: 800, color: "#92400e", fontSize: "0.875rem", marginBottom: "0.25rem" }}>⚠ Packaging & Protection Reminder</div>
                                            <div style={{ color: "#78350f", fontSize: "0.82rem", lineHeight: 1.55 }}>
                                                <strong>Ensure original device packaging, barcodes, and protective wrapping are intact.</strong> The facility requires undamaged tags and packaging for intake processing.
                                            </div>
                                        </div>
                                    </div>

                                    <div className="field-steps-container">
                                        <h4 className="sec-heading"><FiShield /> {completeDeliveryTarget.assignmentType === "TechnicianToRefurbishmentCenter" ? "Refurbishment Center Delivery Verification" : "Recycling Center Delivery Verification"}</h4>

                                        {/* Step 1: Scan Device QR / Barcode */}
                                        <div className={`step-action-card ${deliveryQrVerified ? "completed" : ""}`} style={{ marginBottom: "1rem" }}>
                                            <div className="step-card-header">
                                                <div className="step-card-title">
                                                    <span className="step-num">1</span>
                                                    <FaQrcode className="step-icn" />
                                                    <div>
                                                        <h5>Scan Device Barcode / QR Code</h5>
                                                        <p>Scan the device QR tag before handing over to the recycling center</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="step-card-body">
                                                <div className="inline-input-group" style={{ display: "flex", gap: "0.5rem" }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Scan or enter Device Barcode / QR Token"
                                                        value={deliveryQrInput}
                                                        onChange={(e) => {
                                                            setDeliveryQrInput(e.target.value);
                                                            setDeliveryQrVerified(false);
                                                            if (deliveryQrError) setDeliveryQrError("");
                                                        }}
                                                        style={{ flex: 1, padding: "0.55rem 0.8rem", fontSize: "0.85rem", borderRadius: "8px", border: deliveryQrVerified ? "1.5px solid #10b981" : deliveryQrError ? "1.5px solid #ef4444" : "1px solid #cbd5e1" }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className={`btn-step-action ${deliveryQrVerified ? "verified" : ""}`}
                                                        onClick={handleVerifyDeliveryQr}
                                                        style={{ whiteSpace: "nowrap", padding: "0.55rem 1rem", background: deliveryQrVerified ? "#10b981" : "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
                                                    >
                                                        {deliveryQrVerified ? "✓ Verified" : <><FiMaximize /> Scan & Verify</>}
                                                    </button>
                                                </div>
                                                {deliveryQrError && (
                                                    <div style={{ marginTop: "0.4rem", fontSize: "0.775rem", color: "#dc2626", fontWeight: 600 }}>
                                                        {deliveryQrError}
                                                    </div>
                                                )}
                                                {deliveryQrVerified && (
                                                    <div style={{ marginTop: "0.4rem", fontSize: "0.775rem", color: "#047857", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                                        <FiCheckCircle /> Device QR Code Verified
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="important-warning-box">
                                        <div className="warning-heading"><FiAlertTriangle /> Important Guidelines</div>
                                        <ul className="warning-list">
                                            <li>Verify the device QR tag matches the assignment before handing over.</li>
                                            <li>Ensure the packing cover is intact — remind the technician if needed.</li>
                                            <li>Confirm you are at the correct recycling center ({completeDeliveryTarget.recyclingCenterName || "Recycling Center"}) before completing.</li>
                                        </ul>
                                    </div>
                                </>
                            ) : (
                                /* ── Citizen→Tech delivery: existing technician OTP flow ── */
                                <>
                                    {(completeDeliveryTarget.status === "HandoverRejected" || completeDeliveryTarget.deliveryStatus === "HandoverRejected" || completeDeliveryTarget.lifecycleStatus === "HandoverRejected") && (
                                        <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: "12px", padding: "0.85rem", marginBottom: "1.25rem", color: "#b91c1c", fontSize: "0.825rem" }}>
                                            <div style={{ fontWeight: 800, fontSize: "0.875rem", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                <FiAlertTriangle /> Verification Previously Rejected by Technician
                                            </div>
                                            <div><strong>Reason:</strong> {completeDeliveryTarget.rejectionReason || completeDeliveryTarget.failureReason || "Device / Serial Mismatch"}</div>
                                            <div style={{ marginTop: "0.3rem", color: "#7f1d1d", fontSize: "0.775rem" }}>Verify the device barcode & details with the technician, then send the verification request again below.</div>
                                        </div>
                                    )}

                                    <div className="field-steps-container">
                                        <h4 className="sec-heading"><FiShield /> Technician Handover Verification</h4>
                                        <div className={`step-action-card ${deliveryOtpVerified ? "completed" : ""}`}>
                                            <div className="step-card-header">
                                                <div className="step-card-title">
                                                    <span className="step-num">1</span>
                                                    <FiLock className="step-icn" />
                                                    <div>
                                                        <h5>Technician Handover OTP (Email &amp; Notification)</h5>
                                                        <p>Send OTP to assigned technician via Email &amp; Notification &bull; Valid for 30 seconds</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="step-card-body">
                                                {!deliveryOtpVerified && (
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                                                        <button
                                                            type="button"
                                                            className="btn-upload-photo"
                                                            onClick={handleSendDeliveryOtp}
                                                            disabled={sendingDeliveryOtp || deliveryOtpTimer > 0}
                                                            style={{ borderColor: "#10b981", color: "#047857", background: "#f0fdf4" }}
                                                        >
                                                            <FiMail /> {sendingDeliveryOtp ? "Sending OTP Email..." : deliveryOtpTimer > 0 ? `Resend OTP in ${deliveryOtpTimer}s` : deliveryOtpSent ? "Resend OTP Email" : "Send OTP to Technician Email"}
                                                        </button>
                                                        {deliveryOtpTimer > 0 && (
                                                            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#047857", display: "inline-flex", alignItems: "center", gap: "4px", background: "#ecfdf5", padding: "4px 10px", borderRadius: "20px", border: "1px solid #a7f3d0" }}>
                                                                <FiClock /> {deliveryOtpTimer}s remaining
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="inline-input-group">
                                                    <input
                                                        type="text"
                                                        maxLength="4"
                                                        placeholder="Enter 4-digit OTP from technician email / notification"
                                                        value={deliveryOtpInput}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                                                            setDeliveryOtpInput(val);
                                                            setDeliveryOtpVerified(false);
                                                            setDeliveryOtpError("");
                                                        }}
                                                        disabled={deliveryOtpVerified || !deliveryOtpSent}
                                                        className={deliveryOtpVerified ? "is-valid" : ""}
                                                    />
                                                    <button
                                                        type="button"
                                                        className={`btn-step-action ${deliveryOtpVerified ? "verified" : ""}`}
                                                        onClick={handleVerifyDeliveryOtp}
                                                        disabled={deliveryOtpVerified || !deliveryOtpSent || deliveryOtpInput.length < 4 || processingId === "verifying-delivery-otp"}
                                                    >
                                                        {processingId === "verifying-delivery-otp" ? "Verifying..." : deliveryOtpVerified ? "Verified" : <><FiLock /> Verify OTP</>}
                                                    </button>
                                                </div>
                                                {deliveryOtpError && (
                                                    <div className="step-err-msg" style={{ marginTop: "8px", color: "#dc2626", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                                                        <FiAlertTriangle /> {deliveryOtpError}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="important-warning-box">
                                        <div className="warning-heading"><FiAlertTriangle /> Important Guidelines</div>
                                        <ul className="warning-list">
                                            <li>Do not complete delivery if the e-waste device specs do not match.</li>
                                            <li>Do not complete delivery without valid technician OTP verification.</li>
                                            <li>Verify the inspection center location before confirming handover.</li>
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="pro-modal-footer">
                            <button className="btn-close-modal" onClick={() => setCompleteDeliveryTarget(null)}>
                                Cancel
                            </button>
                            {(completeDeliveryTarget.assignmentType === "TechnicianToRefurbishmentCenter" || completeDeliveryTarget.assignmentType === "TechnicianToRecyclingCenter") ? (
                                <button
                                    className="btn-confirm-complete"
                                    disabled={!deliveryQrVerified || processingId === `deliver-${completeDeliveryTarget.collectionAssignmentId}`}
                                    onClick={handleConfirmTechDeliveryToCenter}
                                    style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#ffffff", fontWeight: 700 }}
                                >
                                    {processingId === `deliver-${completeDeliveryTarget.collectionAssignmentId}`
                                        ? "Processing..."
                                        : <><FiCheckCircle /> Confirm Delivery to {completeDeliveryTarget.assignmentType === "TechnicianToRefurbishmentCenter" ? "Refurbishment Center" : "Recycling Center"}</>}
                                </button>
                            ) : (
                                <button
                                    className="btn-confirm-complete"
                                    disabled={processingId === "requesting-tech-verification"}
                                    onClick={handleRequestTechnicianVerification}
                                    style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#ffffff", fontWeight: 700 }}
                                >
                                    {processingId === "requesting-tech-verification"
                                        ? "Sending Verification Request..."
                                        : (completeDeliveryTarget.status === "HandoverRejected" || completeDeliveryTarget.deliveryStatus === "HandoverRejected")
                                            ? "Resend Verification Request to Technician"
                                            : "Send Verification Request to Technician"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Tech→Recycler Complete Pickup Modal (Technician OTP only, no QR/photo) */}
            {completeTechPickupTarget && (
                <div className="pro-modal-overlay" onClick={() => setCompleteTechPickupTarget(null)}>
                    <div className="pro-modal-dialog start-pickup-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="pro-modal-header start-header">
                            <div>
                                <h2><FiCheckCircle className="complete-icn-hdr" /> Complete Pickup from Technician</h2>
                                <span className="sub-txt">{completeTechPickupTarget.brand} {completeTechPickupTarget.model} &bull; {completeTechPickupTarget.technicianName || completeTechPickupTarget.inspectionCenterName || "Technician Hub"}</span>
                            </div>
                            <button className="pro-close-btn" onClick={() => setCompleteTechPickupTarget(null)}><FiX /></button>
                        </div>

                        <div className="pro-modal-body">
                            {/* Packing Cover Warning */}
                            <div style={{ background: "#fef3c7", border: "1.5px solid #fcd34d", borderRadius: "12px", padding: "0.9rem 1rem", marginBottom: "1.25rem", display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
                                <FiAlertTriangle style={{ color: "#b45309", fontSize: "1.2rem", flexShrink: 0, marginTop: "0.1rem" }} />
                                <div>
                                    <div style={{ fontWeight: 800, color: "#92400e", fontSize: "0.875rem", marginBottom: "0.25rem" }}>⚠ Important: Packing Cover</div>
                                    <div style={{ color: "#78350f", fontSize: "0.82rem", lineHeight: 1.55 }}>
                                        <strong>Remind the technician to NOT destroy or remove the device's original packing cover</strong> before handing over. The recycling center requires intact packaging for safe processing and traceability.
                                    </div>
                                </div>
                            </div>

                            <div className="field-steps-container">
                                <h4 className="sec-heading"><FiShield /> Technician Pickup Verification</h4>

                                {/* Step 1: Send OTP to Technician & Verify */}
                                <div className={`step-action-card ${deliveryOtpVerified ? "completed" : ""}`}>
                                    <div className="step-card-header">
                                        <div className="step-card-title">
                                            <span className="step-num">1</span>
                                            <FiLock className="step-icn" />
                                            <div>
                                                <h5>Technician Handover OTP (Email &amp; Notification)</h5>
                                                <p>Send OTP to technician via Email &amp; Notification to confirm device handover</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="step-card-body">
                                        {!deliveryOtpVerified && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                                                <button
                                                    type="button"
                                                    className="btn-upload-photo"
                                                    onClick={handleSendDeliveryOtp}
                                                    disabled={sendingDeliveryOtp || deliveryOtpTimer > 0}
                                                    style={{ borderColor: "#10b981", color: "#047857", background: "#f0fdf4" }}
                                                >
                                                    <FiMail /> {sendingDeliveryOtp ? "Sending OTP Email..." : deliveryOtpTimer > 0 ? `Resend OTP in ${deliveryOtpTimer}s` : deliveryOtpSent ? "Resend OTP Email" : "Send OTP to Technician Email"}
                                                </button>
                                                {deliveryOtpTimer > 0 && (
                                                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#047857", display: "inline-flex", alignItems: "center", gap: "4px", background: "#ecfdf5", padding: "4px 10px", borderRadius: "20px", border: "1px solid #a7f3d0" }}>
                                                        <FiClock /> {deliveryOtpTimer}s remaining
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div className="inline-input-group">
                                            <input
                                                type="text"
                                                maxLength="4"
                                                placeholder="Enter 4-digit OTP from technician email / notification"
                                                value={deliveryOtpInput}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                                                    setDeliveryOtpInput(val);
                                                    setDeliveryOtpVerified(false);
                                                    setDeliveryOtpError("");
                                                }}
                                                disabled={deliveryOtpVerified || !deliveryOtpSent}
                                                className={deliveryOtpVerified ? "is-valid" : ""}
                                            />
                                            <button
                                                type="button"
                                                className={`btn-step-action ${deliveryOtpVerified ? "verified" : ""}`}
                                                onClick={handleVerifyDeliveryOtp}
                                                disabled={deliveryOtpVerified || !deliveryOtpSent || deliveryOtpInput.length < 4 || processingId === "verifying-delivery-otp"}
                                            >
                                                {processingId === "verifying-delivery-otp" ? "Verifying..." : deliveryOtpVerified ? "Verified" : <><FiLock /> Verify OTP</>}
                                            </button>
                                        </div>
                                        {deliveryOtpError && (
                                            <div className="step-err-msg" style={{ marginTop: "8px", color: "#dc2626", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                                                <FiAlertTriangle /> {deliveryOtpError}
                                            </div>
                                        )}
                                        {deliveryOtpVerified && (
                                            <div style={{ marginTop: "8px", color: "#059669", fontSize: "0.825rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                                                <FiCheckCircle /> Technician OTP verified successfully!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="important-warning-box">
                                <div className="warning-heading"><FiAlertTriangle /> Important Guidelines</div>
                                <ul className="warning-list">
                                    <li>Verify the device matches the assignment before accepting from technician.</li>
                                    <li>Do not complete pickup without a verified technician OTP.</li>
                                    <li><strong>Ask the technician to keep the device packing cover intact</strong> — it will be needed at the recycling center.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="pro-modal-footer">
                            <button className="btn-close-modal" onClick={() => setCompleteTechPickupTarget(null)}>Cancel</button>
                            <button
                                className="btn-confirm-complete"
                                disabled={!deliveryOtpVerified || processingId === completeTechPickupTarget.collectionAssignmentId}
                                onClick={handleConfirmCompleteTechPickup}
                            >
                                <FiCheckCircle /> Confirm Pickup from Technician
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Professional White Details Modal Dialog */}
            {selectedPickup && (
                <div className="pro-modal-overlay" onClick={() => setSelectedPickup(null)}>
                    <div className="pro-modal-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="pro-modal-header">
                            <div>
                                <h2>Details</h2>
                                <span className="sub-txt">Collection Assignment</span>
                            </div>
                            <button className="pro-close-btn" onClick={() => setSelectedPickup(null)}>
                                <FiX />
                            </button>
                        </div>

                        <div className="pro-modal-body">
                            {selectedPickup.completionDeadline && (
                                <div style={{
                                    background: "#f0fdf4",
                                    border: "1px solid #bbf7d0",
                                    padding: "0.75rem 1rem",
                                    borderRadius: "10px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "1rem",
                                    flexWrap: "wrap",
                                    gap: "0.5rem"
                                }}>
                                    <div>
                                        <div style={{ fontSize: "0.725rem", fontWeight: 800, color: "#166534", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                            Logistics Completion Deadline
                                        </div>
                                        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#14532d", marginTop: "0.15rem" }}>
                                            Must be delivered by: {new Date(selectedPickup.completionDeadline).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <span style={{ background: "#dcfce7", color: "#15803d", fontWeight: 800, fontSize: "0.75rem", padding: "0.25rem 0.65rem", borderRadius: "12px", border: "1px solid #86efac" }}>
                                        5-Day Completion SLA
                                    </span>
                                </div>
                            )}

                            {/* COLLECT FROM -> DELIVER TO ROUTING FLOW */}
                            <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
                                {selectedPickup.assignmentType === "TechnicianToRefurbishmentCenter" ? (
                                    <>
                                        <div style={{ background: "#f3e8ff", border: "1px solid #d8b4fe", padding: "0.85rem", borderRadius: "10px" }}>
                                            <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#7e22ce", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                COLLECT FROM (TECHNICIAN HUB)
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#581c87", fontSize: "0.9rem", marginTop: "0.2rem" }}>
                                                Technician / Hub: {selectedPickup.technicianName || selectedPickup.inspectionCenterName || "Inspection Technician"} {selectedPickup.technicianPhone ? `(Ph: ${selectedPickup.technicianPhone})` : ""}
                                            </div>
                                            <div style={{ color: "#7e22ce", fontSize: "0.825rem", marginTop: "0.2rem" }}>
                                                <strong>Inspection Center address:</strong> {selectedPickup.deliveredAddress || selectedPickup.technicianAddress || "EcoCycle Central Inspection Center"}
                                            </div>
                                            <div style={{ color: "#9333ea", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                                                <strong>Pickup date / time slot:</strong> {formatScheduleTime(selectedPickup)}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: "center", fontSize: "1.35rem", fontWeight: 800, color: "#9333ea", margin: "0.35rem 0" }}>↓</div>

                                        <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", padding: "0.85rem", borderRadius: "10px" }}>
                                            <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#6b21a8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                DELIVER TO (REFURBISHMENT CENTER)
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#3b0764", fontSize: "0.9rem", marginTop: "0.2rem" }}>
                                                Facility: {selectedPickup.refurbishmentCenterName || "Refurbishment Center"} {selectedPickup.refurbishmentCenterPhone ? `(Ph: ${selectedPickup.refurbishmentCenterPhone})` : ""}
                                            </div>
                                            {selectedPickup.refurbishmentCenterOwner && (
                                                <div style={{ color: "#581c87", fontSize: "0.825rem", marginTop: "0.1rem" }}>
                                                    <strong>Contact Person:</strong> {selectedPickup.refurbishmentCenterOwner}
                                                </div>
                                            )}
                                            <div style={{ color: "#6b21a8", fontSize: "0.825rem", marginTop: "0.2rem" }}>
                                                <strong>Refurbishment Center address:</strong> {selectedPickup.refurbishmentCenterAddress || selectedPickup.deliveredAddress || "Refurbishment Center Address"}
                                            </div>
                                        </div>
                                    </>
                                ) : selectedPickup.assignmentType === "TechnicianToRecyclingCenter" ? (
                                    <>
                                        <div style={{ background: "#e0f2fe", border: "1px solid #bae6fd", padding: "0.85rem", borderRadius: "10px" }}>
                                            <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                COLLECT FROM (TECHNICIAN HUB)
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#0c4a6e", fontSize: "0.9rem", marginTop: "0.2rem" }}>
                                                Technician / Hub: {selectedPickup.technicianName || selectedPickup.inspectionCenterName || "Inspection Technician"} {selectedPickup.technicianPhone ? `(Ph: ${selectedPickup.technicianPhone})` : ""}
                                            </div>
                                            <div style={{ color: "#0369a1", fontSize: "0.825rem", marginTop: "0.2rem" }}>
                                                <strong>Inspection Center address:</strong> {selectedPickup.deliveredAddress || selectedPickup.technicianAddress || "EcoCycle Central Inspection Center"}
                                            </div>
                                            <div style={{ color: "#0284c7", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                                                <strong>Pickup date / time slot:</strong> {selectedPickup.pickupDate ? new Date(selectedPickup.pickupDate).toLocaleDateString() : "Scheduled"} • {selectedPickup.timeSlot || "Standard Slot"}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: "center", fontSize: "1.35rem", fontWeight: 800, color: "#0284c7", margin: "0.35rem 0" }}>↓</div>

                                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.85rem", borderRadius: "10px" }}>
                                            <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                DELIVER TO (RECYCLING CENTER)
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#14532d", fontSize: "0.9rem", marginTop: "0.2rem" }}>
                                                Facility: {selectedPickup.recyclingCenterName || "Recycling Facility"} {selectedPickup.recyclingCenterPhone ? `(Ph: ${selectedPickup.recyclingCenterPhone})` : ""}
                                            </div>
                                            {selectedPickup.recyclingCenterOwner && (
                                                <div style={{ color: "#166534", fontSize: "0.825rem", marginTop: "0.1rem" }}>
                                                    <strong>Contact Person:</strong> {selectedPickup.recyclingCenterOwner}
                                                </div>
                                            )}
                                            <div style={{ color: "#15803d", fontSize: "0.825rem", marginTop: "0.2rem" }}>
                                                <strong>Recycling Center address:</strong> {selectedPickup.recyclingCenterAddress || selectedPickup.deliveredAddress || "Recycling Facility Address"}
                                            </div>
                                        </div>
                                    </>
                                ) : (selectedPickup.assignmentType === "TechnicianToTechnician" || selectedPickup.isReassignedFromTech || selectedPickup.isReassignmentPickup) ? (
                                    <>
                                        <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", padding: "0.85rem", borderRadius: "10px" }}>
                                            <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                COLLECT FROM (PENALIZED TECHNICIAN CENTER)
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#9a3412", fontSize: "0.9rem", marginTop: "0.2rem" }}>
                                                Technician / Hub: {selectedPickup.customerName || selectedPickup.priorTechnicianName || "Penalized Hub"} {selectedPickup.customerPhone ? `(Ph: ${selectedPickup.customerPhone})` : ""}
                                            </div>
                                            <div style={{ color: "#c2410c", fontSize: "0.825rem", marginTop: "0.2rem" }}>
                                                <strong>Penalized Center address:</strong> {selectedPickup.address}
                                                {selectedPickup.landmark && ` (Landmark: ${selectedPickup.landmark})`}
                                                {[selectedPickup.city, selectedPickup.district, selectedPickup.state, selectedPickup.pincode].filter(Boolean).length > 0 &&
                                                    `, ${[selectedPickup.city, selectedPickup.district, selectedPickup.state, selectedPickup.pincode].filter(Boolean).join(", ")}`}
                                            </div>
                                            <div style={{ color: "#ea580c", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                                                <strong>Pickup date / time slot:</strong> {formatScheduleTime(selectedPickup)}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: "center", fontSize: "1.35rem", fontWeight: 800, color: "#ea580c", margin: "0.35rem 0" }}>↓</div>

                                        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.85rem", borderRadius: "10px" }}>
                                            <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                DELIVER TO (NEW INSPECTION HUB)
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#1e40af", fontSize: "0.9rem", marginTop: "0.2rem" }}>
                                                Technician / Inspection Center: {selectedPickup.technicianName || "Inspection Technician"} ({selectedPickup.inspectionCenterName || selectedPickup.technicianCenterName || "EcoCycle Central Inspection Hub"}) {selectedPickup.technicianPhone ? `(Ph: ${selectedPickup.technicianPhone})` : ""}
                                            </div>
                                            <div style={{ color: "#1e3a8a", fontSize: "0.825rem", marginTop: "0.2rem" }}>
                                                <strong>Technician/center address:</strong> {selectedPickup.deliveredAddress || selectedPickup.technicianAddress || "EcoCycle Central E-Waste Facility & Inspection Hub"}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.85rem", borderRadius: "10px" }}>
                                            <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#047857", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                COLLECT FROM (CITIZEN)
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#065f46", fontSize: "0.9rem", marginTop: "0.2rem" }}>
                                                Customer: {selectedPickup.customerName || "Citizen"} (Ph: {selectedPickup.customerPhone || "N/A"})
                                            </div>
                                            <div style={{ color: "#047857", fontSize: "0.825rem", marginTop: "0.2rem" }}>
                                                <strong>Customer pickup address:</strong> {selectedPickup.address}
                                                {selectedPickup.landmark && ` (Landmark: ${selectedPickup.landmark})`}
                                                {[selectedPickup.city, selectedPickup.district, selectedPickup.state, selectedPickup.pincode].filter(Boolean).length > 0 &&
                                                    `, ${[selectedPickup.city, selectedPickup.district, selectedPickup.state, selectedPickup.pincode].filter(Boolean).join(", ")}`}
                                            </div>
                                            <div style={{ color: "#059669", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                                                <strong>Pickup date / time slot:</strong> {formatScheduleTime(selectedPickup)}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: "center", fontSize: "1.35rem", fontWeight: 800, color: "#059669", margin: "0.35rem 0" }}>↓</div>

                                        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.85rem", borderRadius: "10px" }}>
                                            <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                DELIVER TO (INSPECTION HUB)
                                            </div>
                                            <div style={{ fontWeight: 700, color: "#1e40af", fontSize: "0.9rem", marginTop: "0.2rem" }}>
                                                Technician / Inspection Center: {selectedPickup.technicianName || "Inspection Technician"} ({selectedPickup.inspectionCenterName || selectedPickup.technicianCenterName || "EcoCycle Central Inspection Hub"}) {selectedPickup.technicianPhone ? `(Ph: ${selectedPickup.technicianPhone})` : ""}
                                            </div>
                                            <div style={{ color: "#1e3a8a", fontSize: "0.825rem", marginTop: "0.2rem" }}>
                                                <strong>Technician/center address:</strong> {selectedPickup.deliveredAddress || selectedPickup.technicianAddress || "EcoCycle Central E-Waste Facility & Inspection Hub"}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Device Info */}
                            <div className="pro-section-box">
                                <h4 className="sec-heading"><FiPackage /> E-Waste Specifications</h4>
                                <div className="sec-grid">
                                    <div className="sec-item">
                                        <span className="lbl">Brand & Model</span>
                                        <span className="val">{selectedPickup.brand} {selectedPickup.model}</span>
                                    </div>
                                    <div className="sec-item">
                                        <span className="lbl">Category</span>
                                        <span className="val">{selectedPickup.categoryName}</span>
                                    </div>
                                    <div className="sec-item">
                                        <span className="lbl">Quantity</span>
                                        <span className="val">{selectedPickup.quantity || 1} Unit(s)</span>
                                    </div>
                                    <div className="sec-item">
                                        <span className="lbl">Condition</span>
                                        <span className="val">{selectedPickup.condition || "Standard"}</span>
                                    </div>
                                    <div className="sec-item">
                                        <span className="lbl">Functional</span>
                                        <span className="val">{selectedPickup.working ? "Yes (Working)" : "Non-Functional / E-Waste"}</span>
                                    </div>
                                </div>
                            </div>


                        </div>

                        <div className="pro-modal-footer">
                            {["expired", "rejected", "declined", "cancelled", "failed"].includes(String(selectedPickup.status || "").toLowerCase()) ? (
                                <span className="status-expired-pill" style={{ flex: "1 1 auto", height: "42px", justifyContent: "center" }}>
                                    <FiAlertTriangle /> Pickup Expired / Cancelled (No Actions Allowed)
                                </span>
                            ) : (
                                <>
                                    {(selectedPickup.status || "").toLowerCase() === "accepted" && (
                                        <button
                                            className="btn-pro-start"
                                            disabled={processingId === selectedPickup.collectionAssignmentId}
                                            onClick={() => {
                                                const target = selectedPickup;
                                                setSelectedPickup(null);
                                                handleStartPickup(target.collectionAssignmentId);
                                            }}
                                        >
                                            <FiTruck /> Start Pickup
                                        </button>
                                    )}
                                    {((selectedPickup.status || "").toLowerCase() === "pickupstarted" || (selectedPickup.status || "").toLowerCase() === "en route") && (
                                        <button
                                            className="btn-pro-complete"
                                            disabled={processingId === selectedPickup.collectionAssignmentId}
                                            onClick={() => {
                                                const target = selectedPickup;
                                                setSelectedPickup(null);
                                                handleOpenCompletePickupModal(target);
                                            }}
                                        >
                                            <FiCheckCircle /> Complete Pickup
                                        </button>
                                    )}
                                    {(((selectedPickup.status || "").toLowerCase() === "completed" || selectedPickup.status === "PickedUp") && selectedPickup.deliveryStatus === "Pending") && (
                                        <button
                                            className="btn-pro-start-delivery"
                                            disabled={processingId === `delivery-${selectedPickup.collectionAssignmentId}`}
                                            onClick={() => {
                                                const target = selectedPickup;
                                                setSelectedPickup(null);
                                                handleStartDelivery(target.collectionAssignmentId);
                                            }}
                                        >
                                            <FiTruck /> Start Delivery
                                        </button>
                                    )}
                                    {((selectedPickup.status || "").toLowerCase() === "outfordelivery" || selectedPickup.deliveryStatus === "InTransit") && (
                                        <button
                                            className="btn-pro-complete-delivery"
                                            disabled={processingId === `deliver-${selectedPickup.collectionAssignmentId}`}
                                            onClick={() => {
                                                const target = selectedPickup;
                                                setSelectedPickup(null);
                                                handleOpenCompleteDeliveryModal(target);
                                            }}
                                        >
                                            <FiCheckCircle /> Deliver to Center
                                        </button>
                                    )}
                                    {selectedPickup.customerPhone && (
                                        <a href={`tel:${selectedPickup.customerPhone}`} className="btn-call-modal">
                                            <FiPhoneCall /> Call Customer
                                        </a>
                                    )}
                                </>
                            )}
                            <button className="btn-close-modal" onClick={() => setSelectedPickup(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Pickups;
