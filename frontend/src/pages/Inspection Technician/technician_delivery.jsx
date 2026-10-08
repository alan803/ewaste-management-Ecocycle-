import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiTruck,
    FiCheckCircle,
    FiClock,
    FiUser,
    FiPhone,
    FiBell,
    FiSearch,
    FiGrid,
    FiList,
    FiCpu,
    FiSmartphone,
    FiBatteryCharging,
    FiTv,
    FiBox,
    FiMapPin,
    FiInfo,
    FiX,
    FiAlertCircle,
    FiAlertTriangle,
    FiNavigation,
    FiShield,
    FiRefreshCw,
    FiCheckSquare,
    FiActivity,
    FiMaximize2,
    FiFileText
} from "react-icons/fi";
import { FaQrcode } from "react-icons/fa";
import "./Device_inspection.css";
import "./technician_delivery.css";

function TechnicianDelivery() {
    const navigate = useNavigate();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("All");
    const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);

    // Receive Device & QR State
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [qrModalItem, setQrModalItem] = useState(null);
    const [qrCodeInput, setQrCodeInput] = useState("");
    const [qrCodeVerified, setQrCodeVerified] = useState(false);
    const [qrScanError, setQrScanError] = useState("");

    const [rejectModalItem, setRejectModalItem] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("Serial number mismatch");
    const [rejectionDescription, setRejectionDescription] = useState("");
    const [rejectionDescriptionError, setRejectionDescriptionError] = useState("");
    const [rejectingLoading, setRejectingLoading] = useState(false);

    const [handoverInstructionModal, setHandoverInstructionModal] = useState(null);
    const [agentPhotoFailed, setAgentPhotoFailed] = useState(false);

    useEffect(() => {
        setAgentPhotoFailed(false);
    }, [selectedDelivery]);

    // Helper to format image paths
    const getMediaUrl = (filename, folderName = "ProfilePhotos") => {
        if (!filename) return null;
        if (filename.startsWith("data:") || filename.startsWith("blob:") || filename.startsWith("http://") || filename.startsWith("https://")) {
            return filename;
        }
        const cleanName = filename.replace(/^uploads[\\/]/, "").replace(/^[\\/]/, "");
        if (cleanName.includes("/") || cleanName.includes("\\")) {
            return `https://localhost:7102/uploads/${cleanName.replace("\\", "/")}`;
        }
        return `https://localhost:7102/uploads/technicians/${folderName}/${cleanName}`;
    };

    // Profile info from localStorage & API
    const [techName, setTechName] = useState(() => {
        return localStorage.getItem("firstName") ||
               localStorage.getItem("userName") ||
               localStorage.getItem("username") ||
               localStorage.getItem("name") ||
               "Inspection Officer";
    });
    const [profilePhoto, setProfilePhoto] = useState(() => {
        return localStorage.getItem("profilePhoto") || localStorage.getItem("userPhoto") || null;
    });

    const userInitial = (techName || "I").charAt(0).toUpperCase();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found, redirecting to login.");
            navigate("/");
            return;
        }
        fetchMyDeliveries(token);
        fetchNotifications(token);

        // Fetch Technician Profile for accurate avatar & photo
        axios.get("https://localhost:7102/api/Technician/myprofile", {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
            const data = res.data || {};
            const fName = data.firstName || data.FirstName || "";
            const lName = data.lastName || data.LastName || "";
            const fullName = `${fName} ${lName}`.trim() || data.name || data.Name;
            const photo = data.photo || data.Photo || data.profilePhoto || data.ProfilePhoto || data.photoPath;

            if (fullName) {
                setTechName(fullName);
                if (fName) localStorage.setItem("firstName", fName);
            }
            if (photo) {
                setProfilePhoto(photo);
                localStorage.setItem("profilePhoto", photo);
            }
        })
        .catch(() => {});
    }, [navigate]);

    const fetchMyDeliveries = async (token) => {
        const authToken = token || localStorage.getItem("token");
        if (!authToken) return;
        try {
            setLoading(true);
            const response = await axios.get("https://localhost:7102/api/Inspection/my-deliveries", {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setDeliveries(response.data || []);
        } catch (err) {
            console.error("Error fetching technician deliveries:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotifications = async (token) => {
        const authToken = token || localStorage.getItem("token");
        if (!authToken) return;
        try {
            const response = await axios.get("https://localhost:7102/api/Notificationcon/my_notifications", {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            setNotifications(response.data || []);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    };

    const handleConfirmReceipt = async (item) => {
        if (!item || !item.collectionAssignmentId) {
            alert("No collection assignment linked to this delivery.");
            return;
        }
        setActionLoadingId(item.deviceId);
        try {
            const token = localStorage.getItem("token");
            let response;
            try {
                response = await axios.post(
                    `https://localhost:7102/api/Pickup/approve-technician-handover/${item.collectionAssignmentId}`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (pickupEx) {
                console.log("Fallback to Inspection/confirm-receipt endpoint:", pickupEx.message);
                response = await axios.post(
                    `https://localhost:7102/api/Inspection/confirm-receipt/${item.collectionAssignmentId}`,
                    { notes: "Device physically received and verified by Inspection Technician." },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            await fetchMyDeliveries();
            if (qrModalItem) setQrModalItem(null);

            const rawDeadline = response?.data?.inspectionDeadline;
            const formattedDeadline = rawDeadline
                ? new Date(rawDeadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

            setHandoverInstructionModal({
                device: item,
                deadline: formattedDeadline
            });
        } catch (err) {
            console.error("Error confirming device receipt:", err);
            alert(err.response?.data?.message || "Failed to verify and accept device delivery.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const validateDescription = (val) => {
        if (!val || val.trim() === "") {
            return "";
        }
        if (/[^a-zA-Z0-9\s.,-]/.test(val)) {
            return "Special characters are not allowed in Description / Additional Notes.";
        }
        if (val.trim().length <= 5) {
            return "Description / Additional Notes length must be greater than 5 characters.";
        }
        return "";
    };

    const handleDescriptionChange = (e) => {
        const val = e.target.value;
        setRejectionDescription(val);
        const err = validateDescription(val);
        setRejectionDescriptionError(err);
    };

    const handleRejectHandover = async () => {
        if (!rejectModalItem || !rejectModalItem.collectionAssignmentId) return;

        if (!rejectionDescription || rejectionDescription.trim() === "") {
            setRejectionDescriptionError("Description / Additional Notes are required.");
            return;
        }

        const liveErr = validateDescription(rejectionDescription);
        if (liveErr) {
            setRejectionDescriptionError(liveErr);
            return;
        }

        setRejectingLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `https://localhost:7102/api/Inspection/reject-handover/${rejectModalItem.collectionAssignmentId}`,
                {
                    reason: rejectionReason,
                    description: rejectionDescription
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchMyDeliveries();
            setRejectModalItem(null);
            setRejectionDescription("");
            setRejectionDescriptionError("");
        } catch (err) {
            console.error("Error rejecting device handover:", err);
            alert(err.response?.data?.message || "Failed to submit handover rejection report.");
        } finally {
            setRejectingLoading(false);
        }
    };

    const validateQrInput = (val) => {
        if (!val || val.trim() === "") return "";
        return "";
    };

    const handleQrInputChange = (e) => {
        const val = e.target.value;
        setQrCodeInput(val);
        setQrCodeVerified(false);
        const err = validateQrInput(val);
        setQrScanError(err);
    };

    const handleVerifyQrCode = (targetItem) => {
        setQrScanError("");
        const item = targetItem || qrModalItem;
        const val = qrCodeInput.trim();
        if (!val) {
            setQrScanError("Please scan or enter the device Barcode / QR token.");
            setQrCodeVerified(false);
            return false;
        }

        const liveErr = validateQrInput(val);
        if (liveErr) {
            setQrScanError(liveErr);
            setQrCodeVerified(false);
            return false;
        }

        if (!item) return false;

        const devId = String(item.deviceId || "").trim();
        const actualToken = String(item.deviceQrToken || "").trim();

        const inputLower = val.toLowerCase();
        const tokenLower = actualToken.toLowerCase();
        const devIdLower = devId.toLowerCase();

        const isMatch = (
            (actualToken && val === actualToken) ||
            (actualToken && inputLower === tokenLower) ||
            inputLower === `ecoqr-dev-${devIdLower}` ||
            inputLower === `#dev-${devIdLower}` ||
            inputLower === `dev-${devIdLower}` ||
            inputLower === `#ec-${devIdLower}` ||
            inputLower === `ec-${devIdLower}` ||
            inputLower === devIdLower
        );

        if (isMatch) {
            setQrCodeVerified(true);
            setQrScanError("");
            return true;
        } else {
            setQrCodeVerified(false);
            const expectedToken = actualToken || `ECOQR-DEV-${devId}`;
            setQrScanError(`Invalid Barcode / QR token`);
            return false;
        }
    };

    const markAllNotificationsAsRead = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.get("https://localhost:7102/api/Notificationcon/mark_asread", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true, isread: true })));
        } catch (err) {
            console.error("Error marking notifications read:", err);
        }
    };

    // KPI Metrics calculation
    const inTransitCount = deliveries.filter(d => {
        const cas = String(d.status || "").toLowerCase();
        const delStat = String(d.deliveryStatus || "").toLowerCase();
        const lifeStat = String(d.lifecycleStatus || "").toLowerCase();
        const isDelivered = cas === "deliveredtocenter" || delStat === "delivered" || lifeStat === "atinspectioncenter" || lifeStat === "inspected" || lifeStat.includes("refurbish") || lifeStat.includes("recycl") || Boolean(d.isInspected);
        if (isDelivered) return false;
        return cas === "outfordelivery" || cas === "pickupstarted" || cas === "pickedup" || cas === "completed" || cas === "awaitingtechnicianapproval" || cas === "intransit" || delStat === "intransit" || delStat === "pending" || delStat === "pendingverification";
    }).length;

    // Filter deliveries to only show items accepted by technician
    const acceptedDeliveries = deliveries.filter((item) => {
        const reqStat = String(item.requestStatus || "").toLowerCase();
        const lifeStat = String(item.lifecycleStatus || "").toLowerCase();
        return reqStat === "accepted" || reqStat === "inprogress" || reqStat === "completed" || lifeStat === "inspected" || Boolean(item.isInspected);
    });

    const deliveredCount = acceptedDeliveries.filter(d => {
        const cas = String(d.status || "").toLowerCase();
        const delStat = String(d.deliveryStatus || "").toLowerCase();
        const lifeStat = String(d.lifecycleStatus || "").toLowerCase();
        return cas === "deliveredtocenter" || delStat === "delivered" || lifeStat === "atinspectioncenter" || lifeStat === "inspected" || lifeStat.includes("refurbish") || lifeStat.includes("recycl") || Boolean(d.isInspected);
    }).length;

    const scheduledCount = acceptedDeliveries.filter(d => {
        const cas = String(d.status || "").toLowerCase();
        const delStat = String(d.deliveryStatus || "").toLowerCase();
        const lifeStat = String(d.lifecycleStatus || "").toLowerCase();
        const isDelivered = cas === "deliveredtocenter" || delStat === "delivered" || lifeStat === "atinspectioncenter" || lifeStat === "inspected" || lifeStat.includes("refurbish") || lifeStat.includes("recycl") || Boolean(d.isInspected);
        if (isDelivered) return false;
        return cas === "scheduled" || cas === "assigned" || cas === "accepted";
    }).length;

    const totalWeight = acceptedDeliveries.reduce((sum, d) => sum + ((Number(d.weight) || 0) * (Number(d.quantity) || 1)), 0);

    // Tab & Search Filtered Deliveries
    const filteredDeliveries = acceptedDeliveries.filter(item => {
        const cas = String(item.status || "").toLowerCase();
        const delStat = String(item.deliveryStatus || "").toLowerCase();
        const lifeStat = String(item.lifecycleStatus || "").toLowerCase();
        const reqStat = String(item.requestStatus || "").toLowerCase();

        const isDelivered = cas === "deliveredtocenter" || delStat === "delivered" || lifeStat === "atinspectioncenter" || lifeStat === "inspected" || lifeStat.includes("refurbish") || lifeStat.includes("recycl") || Boolean(item.isInspected);
        const isInTransit = !isDelivered && (cas === "outfordelivery" || cas === "pickupstarted" || cas === "pickedup" || cas === "completed" || cas === "awaitingtechnicianapproval" || cas === "intransit" || delStat === "intransit" || delStat === "pending" || delStat === "pendingverification");
        const isScheduled = !isDelivered && (cas === "scheduled" || cas === "assigned" || cas === "accepted");

        const isInspectionDone =
            lifeStat === "inspected" ||
            lifeStat === "completed" ||
            reqStat === "completed" ||
            delStat === "completed" ||
            cas === "completed" ||
            cas === "inspected" ||
            Boolean(item.isInspected) ||
            Boolean(item.inspectionCompleted) ||
            Boolean(item.qualityGrade);

        const isVerificationReq = delStat === "pendingverification" || cas === "awaitingtechnicianapproval" || lifeStat === "handoverpendingverification";

        if (activeTab === "Awaiting Inspection" && (isInspectionDone || !isDelivered)) return false;
        if (activeTab === "Handover Verification" && !isVerificationReq && !isInTransit) return false;
        if (activeTab === "Completed" && !isInspectionDone) return false;
        if (activeTab === "InTransit" && !isInTransit) return false;
        if (activeTab === "Delivered" && !isDelivered) return false;
        if (activeTab === "Scheduled" && !isScheduled) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const devName = `${item.brand || ""} ${item.model || ""}`.toLowerCase();
        const catName = String(item.categoryName || "").toLowerCase();
        const agentName = String(item.collectionAgentName || "").toLowerCase();
        const customer = String(item.customerName || "").toLowerCase();
        const address = String(item.address || "").toLowerCase();

        return (
            devName.includes(q) ||
            catName.includes(q) ||
            agentName.includes(q) ||
            customer.includes(q) ||
            address.includes(q)
        );
    });

    const getCategoryIcon = (categoryName) => {
        const cat = (categoryName || "").toLowerCase();
        if (cat.includes("computer") || cat.includes("laptop")) return <FiCpu />;
        if (cat.includes("mobile") || cat.includes("phone") || cat.includes("tablet")) return <FiSmartphone />;
        if (cat.includes("battery") || cat.includes("charger")) return <FiBatteryCharging />;
        if (cat.includes("display") || cat.includes("tv") || cat.includes("monitor")) return <FiTv />;
        return <FiBox />;
    };

    const getStatusBadge = (item) => {
        const delStat = String(item.deliveryStatus || "").toLowerCase();
        const cas = String(item.status || "").toLowerCase();
        const lcs = String(item.lifecycleStatus || "").toLowerCase();

        if (delStat === "delivered" || cas === "deliveredtocenter" || lcs === "atinspectioncenter" || lcs === "inspected" || lcs.includes("refurbish") || lcs.includes("recycl") || Boolean(item.isInspected)) {
            return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>
                    <FiCheckCircle /> Delivered to Center
                </span>
            );
        } else if (delStat === "pendingverification" || cas === "awaitingtechnicianapproval" || lcs === "handoverpendingverification") {
            return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#fef3c7", color: "#b45309" }}>
                    <FiClock /> Handover Verification
                </span>
            );
        } else if (delStat === "handoverrejected" || cas === "handoverrejected" || lcs === "handoverrejected") {
            return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#fef2f2", color: "#b91c1c" }}>
                    <FiAlertCircle /> Handover Rejected
                </span>
            );
        } else if (cas === "failed" || cas === "pickupfailed" || delStat === "failed") {
            return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#fef2f2", color: "#dc2626" }}>
                    <FiAlertTriangle /> Pickup Failed
                </span>
            );
        } else if (item.hasPreviousFailedPickup || ((cas === "scheduled" || cas === "assigned" || cas === "accepted") && item.previousAgentName)) {
            return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                    <FiRefreshCw /> Re-assigned New Agent
                </span>
            );
        } else if (cas === "accepted") {
            return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#f0fdf4", color: "#166534" }}>
                    <FiCheckCircle /> Agent Accepted Slot
                </span>
            );
        } else if (cas === "assigned" || cas === "scheduled" || cas === "pending") {
            return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#fffbeb", color: "#d97706" }}>
                    <FiClock /> Agent Assigned (Pending)
                </span>
            );
        } else if (cas === "pickupstarted" || cas === "pickedup" || cas === "outfordelivery" || cas === "intransit" || delStat === "intransit") {
            return (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#dbeafe", color: "#1e40af" }}>
                    <FiTruck /> In Transit to Hub
                </span>
            );
        }

        return (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.25rem 0.6rem", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, background: "#f8fafc", color: "#475569" }}>
                <FiClock /> Delivery Pending
            </span>
        );
    };

    const getAgentPhoto = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith("data:") || photoPath.startsWith("blob:") || photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
            return photoPath;
        }
        let clean = photoPath.replace(/\\/g, "/").replace(/^\/+/, "");
        if (clean.startsWith("uploads/")) {
            return `https://localhost:7102/${clean}`;
        }
        if (clean.startsWith("profile/")) {
            return `https://localhost:7102/uploads/${clean}`;
        }
        return `https://localhost:7102/uploads/profile/${clean}`;
    };

    const getDeliveryTimelineSteps = (item) => {
        if (!item) return [];
        const cas = String(item.status || "").toLowerCase();
        const delStat = String(item.deliveryStatus || "").toLowerCase();
        const lcs = String(item.lifecycleStatus || "").toLowerCase();
        const reqStat = String(item.requestStatus || "").toLowerCase();

        const isDelivered = delStat === "delivered" || cas === "deliveredtocenter" || lcs === "atinspectioncenter" || lcs === "inspected";
        const isVerificationReq = delStat === "pendingverification" || cas === "awaitingtechnicianapproval" || lcs === "handoverpendingverification";
        const isRejected = delStat === "handoverrejected" || cas === "handoverrejected" || lcs === "handoverrejected";
        const isPickupFailed = cas === "failed" || cas === "pickupfailed" || delStat === "failed";
        const isCollected = (isDelivered || isVerificationReq || isRejected || cas === "completed" || cas === "pickedup" || cas === "outfordelivery" || delStat === "intransit") && !isPickupFailed;

        const hasReassignedAgent = item.hasPreviousFailedPickup || Boolean(item.previousAgentName);

        const isInspectionDone =
            isDelivered && (
                lcs === "inspected" ||
                reqStat === "completed" ||
                cas === "inspected" ||
                Boolean(item.isInspected) ||
                Boolean(item.inspectionCompleted) ||
                Boolean(item.qualityGrade)
            );

        const isInspectionInProgress =
            isDelivered &&
            !isInspectionDone &&
            (reqStat === "inprogress" ||
             cas === "inprogress" ||
             Boolean(item.inspectionStartedAt));

        // Step 1: Pickup Scheduled
        const step1Desc = item.pickupDate 
            ? `Scheduled for ${new Date(item.pickupDate).toLocaleDateString("en-GB")}`
            : "Citizen pickup slot confirmed";

        // Step 2: Collection Agent Assignment & Pickup
        let step2Title = "2. Collected from Citizen";
        let step2Desc = isCollected 
            ? `Picked up by ${item.collectionAgentName || "Agent"}` 
            : `Awaiting agent collection at pickup address`;
        let step2Completed = isCollected;
        let step2Current = !isCollected && !isPickupFailed;
        let step2Error = false;

        if (isPickupFailed) {
            step2Title = "2. Pickup Attempt Failed";
            step2Desc = item.previousFailureReason || item.failureReason || item.rejectionReason || "Collection agent failed pickup attempt. Awaiting agent re-allocation.";
            step2Completed = false;
            step2Current = true;
            step2Error = true;
        } else if (hasReassignedAgent) {
            if (isCollected) {
                step2Title = "2. Collected from Citizen (New Agent)";
                step2Desc = `Picked up by new agent ${item.collectionAgentName || "Agent"} (Re-assigned after previous agent ${item.previousAgentName ? item.previousAgentName : ""} pickup failed)`;
                step2Completed = true;
                step2Current = false;
            } else {
                step2Title = "2. Re-assigned to New Agent";
                step2Desc = `Previous pickup failed${item.previousAgentName ? ` (Previous Agent: ${item.previousAgentName})` : ""}. New agent ${item.collectionAgentName || "Assigned Agent"} allocated. Awaiting collection.`;
                step2Completed = false;
                step2Current = true;
                step2Error = false;
            }
        }

        // Step 3: In Transit to Hub
        let step3Desc = "Waiting for transport to hub";
        if (isCollected) {
            step3Desc = "En route to Inspection Center facility";
        } else if (isPickupFailed) {
            step3Desc = "Pickup failed & pending agent re-allocation";
        } else if (hasReassignedAgent) {
            step3Desc = "New agent assigned; pickup pending at citizen location";
        }

        return [
            {
                title: "1. Pickup Scheduled",
                desc: step1Desc,
                completed: true,
                current: false
            },
            {
                title: step2Title,
                desc: step2Desc,
                completed: step2Completed,
                current: step2Current,
                error: step2Error
            },
            {
                title: "3. In Transit to Hub",
                desc: step3Desc,
                completed: isCollected,
                current: isCollected && !isVerificationReq && !isDelivered && !isRejected
            },
            {
                title: "4. Handover Verification Requested",
                desc: isVerificationReq ? "Agent reached facility & requested technician verification" : isDelivered ? "Handover verification complete" : isRejected ? "Issue reported during handover" : "Awaiting agent arrival at hub",
                completed: isVerificationReq || isDelivered || isRejected,
                current: isVerificationReq,
                error: isRejected
            },
            {
                title: "5. Received & Verified at Hub",
                desc: isDelivered ? `Verified by Technician on ${item.deliveredAt ? new Date(item.deliveredAt).toLocaleDateString("en-GB") : "Today"}` : isRejected ? `Handover issue: ${item.handoverRejectionReason || "Verification failed"}` : "Pending technician barcode scan & verification",
                completed: isDelivered,
                current: isDelivered && !isInspectionDone && !isInspectionInProgress,
                error: isRejected
            },
            {
                title: "6. Technical Inspection & Diagnosis",
                desc: isInspectionDone
                    ? "Technical hardware inspection & quality grading completed"
                    : isInspectionInProgress
                    ? "Hardware inspection & testing currently in-progress"
                    : isDelivered
                    ? "Queued for hardware inspection & testing"
                    : "Pending hub receipt",
                completed: isInspectionDone,
                current: isInspectionInProgress
            }
        ];
    };

    const unreadCount = notifications.filter(n => !n.isRead && !n.isread).length;

    return (
        <div className="tech-delivery-page">
            <Sidebar />

            <div className="tech-main-container">
                {/* Header Bar */}
                <div className="tech-header-bar">
                    <div className="tech-header-actions">
                        {/* Search Input */}
                        <div className="search-box-v2" style={{ position: "relative", display: "flex", alignItems: "center" }}>
                            <FiSearch className="search-icon" style={{ position: "absolute", left: "0.85rem", color: "#94a3b8", fontSize: "0.95rem" }} />
                            <input
                                type="text"
                                placeholder="Search brand, model, agent, citizen..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    padding: "0.45rem 1rem 0.45rem 2.3rem",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "10px",
                                    background: "#ffffff",
                                    fontSize: "0.8rem",
                                    color: "#0f172a",
                                    width: "220px",
                                    outline: "none",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                                }}
                            />
                        </div>

                        <button className="tech-refresh-btn" onClick={() => fetchMyDeliveries()}>
                            <FiRefreshCw /> Refresh
                        </button>

                        {/* Notification Bell */}
                        <button
                            className="tech-refresh-btn"
                            style={{ position: "relative" }}
                            title={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
                            onClick={() => navigate("/technician-notification")}
                        >
                            <FiBell style={{ fontSize: "1.1rem" }} />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: "absolute",
                                    top: "-4px",
                                    right: "-4px",
                                    background: "#ef4444",
                                    color: "#ffffff",
                                    fontSize: "0.65rem",
                                    fontWeight: 800,
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </button>

                        <div className="tech-user-avatar" title={techName} style={{ cursor: "pointer" }} onClick={() => navigate("/technician-profile")}>
                            {profilePhoto ? (
                                <img
                                    src={getMediaUrl(profilePhoto, "ProfilePhotos")}
                                    alt={techName}
                                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        setProfilePhoto(null);
                                        try { localStorage.removeItem("profilePhoto"); } catch (err) {}
                                    }}
                                />
                            ) : (
                                userInitial
                            )}
                        </div>
                    </div>
                </div>

                {/* KPI Summary Cards Grid */}
                <div className="tech-kpi-grid">
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon all"><FiBox /></div>
                        <div className="tech-kpi-info">
                            <h3>{deliveries.length}</h3>
                            <p>Total Assigned Shipments</p>
                        </div>
                    </div>
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon transit"><FiTruck /></div>
                        <div className="tech-kpi-info">
                            <h3>{inTransitCount}</h3>
                            <p>In Transit (Waiting)</p>
                        </div>
                    </div>
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon delivered"><FiCheckCircle /></div>
                        <div className="tech-kpi-info">
                            <h3>{deliveredCount}</h3>
                            <p>Received at Center</p>
                        </div>
                    </div>
                    <div className="tech-kpi-card">
                        <div className="tech-kpi-icon weight"><FiCpu /></div>
                        <div className="tech-kpi-info">
                            <h3>{totalWeight.toFixed(1)} kg</h3>
                            <p>Total E-Waste Volume</p>
                        </div>
                    </div>
                </div>

                {/* Main Inspection Controls Header */}
                <div className="control-bar-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: "1rem", flexWrap: "wrap" }}>
                    <div>
                        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.25rem", fontWeight: 700, margin: "0 0 0.2rem", color: "#0f172a" }}>Center Deliveries Hub</h3>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>Track inbound agent shipments and verify center handovers</p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap", marginLeft: "auto" }}>
                        <div className="filter-pills">
                            {["All", "Awaiting Inspection", "Handover Verification", "Completed"].map((tab) => (
                                <button
                                    key={tab}
                                    className={`pill-btn ${activeTab === tab ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="view-toggle">
                            <button
                                className={`toggle-btn ${viewMode === "table" ? "active" : ""}`}
                                onClick={() => setViewMode("table")}
                                title="Table View"
                            >
                                <FiList />
                            </button>
                            <button
                                className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                                onClick={() => setViewMode("grid")}
                                title="Grid View"
                            >
                                <FiGrid />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area: Grid View or Table View */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "4rem 1rem", background: "#ffffff", borderRadius: "22px", border: "1px solid #e2e8f0" }}>
                        <FiTruck style={{ fontSize: "2.5rem", color: "#059669", animation: "spin 1.5s linear infinite" }} />
                        <p style={{ color: "#64748b", marginTop: "1rem", fontWeight: 700 }}>Syncing incoming delivery feed...</p>
                    </div>
                ) : filteredDeliveries.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "4rem 1rem", background: "#ffffff", borderRadius: "22px", border: "1px solid #e2e8f0" }}>
                        <FiBox style={{ fontSize: "3rem", color: "#cbd5e1" }} />
                        <h3 style={{ color: "#0f172a", marginTop: "1rem", fontWeight: 800 }}>No Deliveries Found</h3>
                        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No e-waste shipments match your current filter selection.</p>
                    </div>
                ) : viewMode === "grid" ? (
                    /* Grid Cards View */
                    <div className="tech-grid">
                        {filteredDeliveries.map((item) => {
                            const reqStat = String(item.requestStatus || "").toLowerCase();
                            const delStat = String(item.deliveryStatus || "").toLowerCase();
                            const lifeStat = String(item.lifecycleStatus || "").toLowerCase();
                            const cas = String(item.status || "").toLowerCase();

                            const isReceived = delStat === "delivered" || cas === "deliveredtocenter" || lifeStat === "atinspectioncenter" || lifeStat === "inspected" || lifeStat.includes("refurbish") || lifeStat.includes("recycl") || Boolean(item.isInspected);

                            const isInspectionDone =
                                lifeStat === "inspected" ||
                                lifeStat === "completed" ||
                                reqStat === "completed" ||
                                delStat === "completed" ||
                                cas === "completed" ||
                                cas === "inspected" ||
                                Boolean(item.isInspected) ||
                                Boolean(item.inspectionCompleted) ||
                                Boolean(item.qualityGrade);

                            const isInspectionInProgress =
                                !isInspectionDone &&
                                (reqStat === "inprogress" ||
                                 cas === "inprogress" ||
                                 Boolean(item.inspectionStartedAt));

                            return (
                                <div key={item.deviceId} className="tech-card">
                                    <div className="tech-card-header">
                                        <div className="tech-card-top-row">
                                            <span style={{ fontFamily: "Space Grotesk", fontWeight: 800, fontSize: "0.85rem", color: "#059669", background: "#ecfdf5", padding: "0.2rem 0.55rem", borderRadius: "6px", border: "1px solid #a7f3d0" }}>
                                                Device #EC-{item.deviceId}
                                            </span>
                                            <div className="tech-badge-wrapper">
                                                {getStatusBadge(item)}
                                            </div>
                                        </div>
                                        <div className="tech-card-title-group" style={{ marginTop: "0.35rem" }}>
                                            <h3 className="tech-card-brand-name">{item.brand} {item.model}</h3>
                                            <p className="tech-card-cat-name">{item.categoryName} &bull; {item.quantity || 1} Unit(s)</p>
                                        </div>
                                    </div>

                                    <div style={{ borderTop: "1px dashed #e2e8f0", margin: "0.35rem 0 0.65rem 0" }}></div>

                                    <div className="tech-card-body">
                                        <div style={{ fontSize: "0.8rem", color: "#475569", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                                            <div><strong>Delivered by:</strong> {item.collectionAgentName || "Collection Agent"}</div>
                                            <div><strong>Received on:</strong> {item.deliveredAt ? new Date(item.deliveredAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                                            <div>
                                                <strong>Condition:</strong>{" "}
                                                {isInspectionDone ? (
                                                    <span style={{ color: "#059669", fontWeight: 700 }}>✓ Inspected {item.qualityGrade ? `(${item.qualityGrade})` : ""}</span>
                                                ) : isInspectionInProgress ? (
                                                    <span style={{ color: "#2563eb", fontWeight: 700 }}>⚡ Inspection In-Progress</span>
                                                ) : (
                                                    <span style={{ color: "#d97706", fontWeight: 700 }}>Pending Inspection</span>
                                                )}
                                            </div>
                                            <div>
                                                <strong>Inspection Started:</strong>{" "}
                                                {isInspectionDone ? (
                                                    <span style={{ color: "#059669", fontWeight: 700 }}>Yes (Completed)</span>
                                                ) : isInspectionInProgress ? (
                                                    <span style={{ color: "#2563eb", fontWeight: 700 }}>Yes</span>
                                                ) : (
                                                    <span style={{ color: "#64748b", fontWeight: 700 }}>No</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Specs Pills */}
                                        <div className="tech-specs-row" style={{ marginTop: "0.4rem" }}>
                                            <span className="tech-spec-tag">Weight: {item.weight || 1} kg</span>
                                            <span className="tech-spec-tag">{item.working ? "Working" : "Non-Functional"}</span>
                                        </div>
                                    </div>

                                     <div className="tech-card-footer">
                                         {isReceived ? (
                                             <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                                 <div style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem", justifyContent: "center" }}>
                                                     <FiCheckCircle /> Received & Verified at Hub
                                                 </div>
                                                 <button
                                                     type="button"
                                                     className="btn-tech-track"
                                                     style={{
                                                         width: "100%",
                                                         background: isInspectionDone ? "linear-gradient(135deg, #059669 0%, #047857 100%)" : "#0f172a",
                                                         border: "none",
                                                         color: "#ffffff",
                                                         fontSize: "0.775rem",
                                                         padding: "0.45rem 0.5rem",
                                                         fontWeight: 700
                                                     }}
                                                     onClick={() => navigate("/technician/device-inspection", { state: { selectedDevice: item } })}
                                                 >
                                                     {isInspectionDone ? (
                                                         <><FiCheckCircle /> Inspection Completed</>
                                                     ) : isInspectionInProgress ? (
                                                         <><FiActivity /> Continue Inspection</>
                                                     ) : (
                                                         <><FiActivity /> Start Technical Inspection</>
                                                     )}
                                                 </button>
                                             </div>
                                         ) : (
                                             (() => {
                                                 const cas = String(item.status || "").toLowerCase();
                                                 const delStat = String(item.deliveryStatus || "").toLowerCase();
                                                 const lcs = String(item.lifecycleStatus || "").toLowerCase();
                                                 const isRejected = delStat === "handoverrejected" || cas === "handoverrejected" || lcs === "handoverrejected";
                                                 const isHandoverRequested = (delStat === "pendingverification" || cas === "awaitingtechnicianapproval" || lcs === "handoverpendingverification") && !isRejected;

                                                 if (isRejected) {
                                                     return (
                                                         <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                                                             <div style={{ padding: "0.4rem", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", color: "#dc2626", fontSize: "0.75rem", fontWeight: 700, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}>
                                                                 <FiAlertCircle /> Handover Rejected by Technician
                                                             </div>
                                                             <button
                                                                 type="button"
                                                                 style={{ width: "100%", padding: "0.4rem", borderRadius: "8px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}
                                                                 onClick={() => setSelectedDelivery(item)}
                                                             >
                                                                 <FiNavigation /> Track Delivery Progress
                                                             </button>
                                                         </div>
                                                     );
                                                 }

                                                 if (isHandoverRequested) {
                                                     return (
                                                         <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                                                             <div style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem", justifyContent: "center" }}>
                                                                 <FiClock /> Verification Requested by Agent
                                                             </div>
                                                             <div style={{ display: "flex", gap: "0.4rem" }}>
                                                                 <button
                                                                     type="button"
                                                                     style={{ flex: 1, padding: "0.55rem 0.5rem", borderRadius: "10px", background: "linear-gradient(135deg, #059669 0%, #047857 100%)", border: "none", color: "#ffffff", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}
                                                                     disabled={actionLoadingId === item.deviceId}
                                                                     onClick={() => {
                                                                         setQrModalItem(item);
                                                                         setQrCodeInput("");
                                                                         setQrCodeVerified(false);
                                                                         setQrScanError("");
                                                                     }}
                                                                 >
                                                                     ✓ Accept Device
                                                                 </button>
                                                                 <button
                                                                     type="button"
                                                                     style={{ flex: 1, padding: "0.55rem 0.5rem", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}
                                                                     onClick={() => {
                                                                         setRejectModalItem(item);
                                                                         setRejectionReason("Serial number mismatch");
                                                                         setRejectionDescription("");
                                                                         setRejectionDescriptionError("");
                                                                     }}
                                                                 >
                                                                     <FiAlertCircle />Report Issue
                                                                 </button>
                                                             </div>
                                                             <button
                                                                 type="button"
                                                                 style={{ width: "100%", padding: "0.4rem", borderRadius: "8px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}
                                                                 onClick={() => setSelectedDelivery(item)}
                                                             >
                                                                 <FiNavigation /> Track Live Delivery Progress
                                                             </button>
                                                         </div>
                                                     );
                                                 }

                                                 return (
                                                     <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                                         <div style={{ textAlign: "center", padding: "0.4rem", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", color: "#64748b", fontSize: "0.775rem", fontWeight: 600 }}>
                                                             <FiClock style={{ marginRight: "0.3rem" }} /> Awaiting Agent Verification Request
                                                         </div>
                                                         <button
                                                             type="button"
                                                             style={{ width: "100%", padding: "0.4rem", borderRadius: "8px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem" }}
                                                             onClick={() => setSelectedDelivery(item)}
                                                         >
                                                             <FiNavigation /> Track Delivery Progress
                                                         </button>
                                                     </div>
                                                 );
                                             })()
                                         )}
                                     </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Table View */
                    <div className="tech-table-wrapper">
                        <table className="tech-table">
                            <thead>
                                <tr>
                                    <th>Device Code / Item</th>
                                    <th>Delivered By</th>
                                    <th>Condition</th>
                                    <th>Status (Delivery → Inspection)</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDeliveries.map((item) => {
                                    const reqStat = String(item.requestStatus || "").toLowerCase();
                                    const delStat = String(item.deliveryStatus || "").toLowerCase();
                                    const lifeStat = String(item.lifecycleStatus || "").toLowerCase();
                                    const cas = String(item.status || "").toLowerCase();

                                    const isReceived = delStat === "delivered" || cas === "deliveredtocenter" || lifeStat === "atinspectioncenter" || lifeStat === "inspected" || lifeStat.includes("refurbish") || lifeStat.includes("recycl") || Boolean(item.isInspected);

                                    const isInspectionDone =
                                        lifeStat === "inspected" ||
                                        lifeStat === "completed" ||
                                        reqStat === "completed" ||
                                        delStat === "completed" ||
                                        cas === "completed" ||
                                        cas === "inspected" ||
                                        Boolean(item.isInspected) ||
                                        Boolean(item.inspectionCompleted) ||
                                        Boolean(item.qualityGrade);

                                    const isInspectionInProgress =
                                        !isInspectionDone &&
                                        (reqStat === "inprogress" ||
                                         cas === "inprogress" ||
                                         Boolean(item.inspectionStartedAt));

                                    return (
                                        <tr key={item.deviceId}>
                                            <td>
                                                <div style={{ fontWeight: 800, color: "#0f172a" }}>{item.brand} {item.model}</div>
                                                <div style={{ fontSize: "0.775rem", color: "#059669", fontWeight: 700 }}>Device #EC-{item.deviceId}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.collectionAgentName || "Collection Agent"}</div>
                                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.collectionAgentPhone}</div>
                                            </td>
                                            <td>
                                                {isInspectionDone ? (
                                                    <>
                                                        <div style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 700 }}>✓ Inspected {item.qualityGrade ? `(${item.qualityGrade})` : ""}</div>
                                                        <div style={{ fontSize: "0.725rem", color: "#059669", fontWeight: 600 }}>Started: Yes (Completed)</div>
                                                    </>
                                                ) : isInspectionInProgress ? (
                                                    <>
                                                        <div style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 700 }}>⚡ Inspection In-Progress</div>
                                                        <div style={{ fontSize: "0.725rem", color: "#2563eb", fontWeight: 600 }}>Started: Yes</div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div style={{ fontSize: "0.8rem", color: "#d97706", fontWeight: 700 }}>Pending Inspection</div>
                                                        <div style={{ fontSize: "0.725rem", color: "#64748b" }}>Started: No</div>
                                                    </>
                                                )}
                                            </td>
                                            <td>{getStatusBadge(item)}</td>
                                            <td>
                                                 {isReceived ? (
                                                     <div style={{ display: "flex", gap: "0.4rem" }}>
                                                         <button
                                                             style={{ padding: "0.4rem 0.65rem", fontSize: "0.775rem", borderRadius: "8px", background: "#ffffff", border: "1px solid #10b981", color: "#059669", fontWeight: 700, cursor: "pointer" }}
                                                             onClick={() => {
                                                                 setQrModalItem(item);
                                                                 setQrCodeInput("");
                                                                 setQrCodeVerified(false);
                                                                 setQrScanError("");
                                                             }}
                                                         >
                                                             Verify Barcode
                                                         </button>
                                                         <button
                                                             style={{ padding: "0.4rem 0.65rem", fontSize: "0.775rem", borderRadius: "8px", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#334155", fontWeight: 700, cursor: "pointer" }}
                                                             onClick={() => setSelectedDelivery(item)}
                                                         >
                                                             Track
                                                         </button>
                                                         <button
                                                             style={{
                                                                 padding: "0.4rem 0.65rem",
                                                                 fontSize: "0.775rem",
                                                                 borderRadius: "8px",
                                                                 background: isInspectionDone ? "linear-gradient(135deg, #059669 0%, #047857 100%)" : "#0f172a",
                                                                 border: "none",
                                                                 color: "#ffffff",
                                                                 fontWeight: 700,
                                                                 cursor: "pointer"
                                                             }}
                                                             onClick={() => navigate("/technician/device-inspection", { state: { selectedDevice: item } })}
                                                         >
                                                             {isInspectionDone ? "✓ Inspection Completed" : isInspectionInProgress ? "Continue Inspection" : "Start Inspection"}
                                                         </button>
                                                     </div>
                                                 ) : (
                                                     (() => {
                                                         const cas = String(item.status || "").toLowerCase();
                                                         const delStat = String(item.deliveryStatus || "").toLowerCase();
                                                         const lcs = String(item.lifecycleStatus || "").toLowerCase();
                                                         const isRejected = delStat === "handoverrejected" || cas === "handoverrejected" || lcs === "handoverrejected";
                                                         const isHandoverRequested = (delStat === "pendingverification" || cas === "awaitingtechnicianapproval" || lcs === "handoverpendingverification") && !isRejected;

                                                         if (isRejected) {
                                                             return (
                                                                 <div style={{ display: "flex", gap: "0.4rem" }}>
                                                                     <div style={{ padding: "0.4rem 0.65rem", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", color: "#dc2626", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                                                         <FiAlertCircle /> Rejected
                                                                     </div>
                                                                     <button
                                                                         style={{ padding: "0.4rem 0.65rem", fontSize: "0.75rem", borderRadius: "8px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", fontWeight: 700, cursor: "pointer" }}
                                                                         onClick={() => setSelectedDelivery(item)}
                                                                     >
                                                                         Track
                                                                     </button>
                                                                 </div>
                                                             );
                                                         }

                                                         if (isHandoverRequested) {
                                                             return (
                                                                 <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                                                     <button
                                                                         style={{ padding: "0.4rem 0.65rem", fontSize: "0.775rem", borderRadius: "8px", background: "#059669", border: "none", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
                                                                         disabled={actionLoadingId === item.deviceId}
                                                                         onClick={() => {
                                                                             setQrModalItem(item);
                                                                             setQrCodeInput("");
                                                                             setQrCodeVerified(false);
                                                                             setQrScanError("");
                                                                         }}
                                                                     >
                                                                         ✓ Accept Device
                                                                     </button>
                                                                     <button
                                                                         style={{ padding: "0.4rem 0.65rem", fontSize: "0.775rem", borderRadius: "8px", background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", fontWeight: 700, cursor: "pointer" }}
                                                                         onClick={() => {
                                                                             setRejectModalItem(item);
                                                                             setRejectionReason("Serial number mismatch");
                                                                             setRejectionDescription("");
                                                                             setRejectionDescriptionError("");
                                                                         }}
                                                                     >
                                                                         Reject / Report Issue
                                                                     </button>
                                                                     <button
                                                                         style={{ padding: "0.4rem 0.65rem", fontSize: "0.775rem", borderRadius: "8px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", fontWeight: 700, cursor: "pointer" }}
                                                                         onClick={() => setSelectedDelivery(item)}
                                                                     >
                                                                         Track
                                                                     </button>
                                                                 </div>
                                                             );
                                                         }

                                                         const isPickupFailed = cas === "failed" || cas === "pickupfailed" || delStat === "failed";
                                                         const hasReassignedAgent = item.hasPreviousFailedPickup || Boolean(item.previousAgentName);

                                                         if (isPickupFailed) {
                                                             return (
                                                                 <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                                     <span style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                                                         <FiAlertTriangle /> Pickup Failed
                                                                     </span>
                                                                     <button
                                                                         style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem", borderRadius: "8px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", fontWeight: 700, cursor: "pointer" }}
                                                                         onClick={() => setSelectedDelivery(item)}
                                                                     >
                                                                         Track
                                                                     </button>
                                                                 </div>
                                                             );
                                                         }

                                                         if (hasReassignedAgent) {
                                                             return (
                                                                 <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                                     <span style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                                                         <FiRefreshCw /> Re-assigned Agent
                                                                     </span>
                                                                     <button
                                                                         style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem", borderRadius: "8px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", fontWeight: 700, cursor: "pointer" }}
                                                                         onClick={() => setSelectedDelivery(item)}
                                                                     >
                                                                         Track
                                                                     </button>
                                                                 </div>
                                                             );
                                                         }

                                                         return (
                                                             <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                                 <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                                                                     Awaiting Agent Pickup & Handover
                                                                 </span>
                                                                 <button
                                                                     style={{ padding: "0.35rem 0.6rem", fontSize: "0.75rem", borderRadius: "8px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", fontWeight: 700, cursor: "pointer" }}
                                                                     onClick={() => setSelectedDelivery(item)}
                                                                 >
                                                                     Track
                                                                 </button>
                                                             </div>
                                                         );
                                                     })()
                                                 )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* QR Scan Verification Modal - Matched to Pickups.jsx */}
            {qrModalItem && (
                <div className="tech-modal-overlay" onClick={() => setQrModalItem(null)}>
                    <div className="tech-modal-content" style={{ maxWidth: "520px", border: "none", overflow: "hidden", padding: 0, borderRadius: "20px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="tech-modal-header">
                            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <FaQrcode style={{ color: "#ffffff" }} /> Scan & Match Device Barcode / QR Code
                            </h3>
                            <button className="tech-modal-close" onClick={() => setQrModalItem(null)}><FiX /></button>
                        </div>
                        <div className="tech-modal-body" style={{ padding: "1.5rem" }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", marginBottom: "0.35rem" }}>
                                    Scan Device Barcode / QR Code
                                </div>
                                <p style={{ margin: "0 0 1rem 0", fontSize: "0.825rem", color: "#64748b", lineHeight: 1.5 }}>
                                    Scan the citizen's device tag QR/Barcode or enter the token to verify before accepting handover. <strong>Reminder:</strong> Keep QR packaging intact for center delivery.
                                </p>

                                <div className="inline-input-group" style={{ display: "flex", gap: "0.5rem" }}>
                                    <input
                                        type="text"
                                        placeholder="Scan or enter Device Barcode / QR Token"
                                        value={qrCodeInput}
                                        onChange={handleQrInputChange}
                                        style={{
                                            flex: 1,
                                            padding: "0.65rem 0.85rem",
                                            fontSize: "0.875rem",
                                            borderRadius: "10px",
                                            border: qrCodeVerified ? "1.5px solid #10b981" : qrScanError ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                                            outline: "none"
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className={`btn-step-action ${qrCodeVerified ? "verified" : ""}`}
                                        onClick={() => handleVerifyQrCode(qrModalItem)}
                                        style={{
                                            whiteSpace: "nowrap",
                                            padding: "0.65rem 1.15rem",
                                            background: qrCodeVerified ? "#10b981" : "#2563eb",
                                            color: "#ffffff",
                                            border: "none",
                                            borderRadius: "10px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.4rem"
                                        }}
                                    >
                                        {qrCodeVerified ? "✓ Verified" : <><FiMaximize2 /> Scan & Verify</>}
                                    </button>
                                </div>

                                {qrScanError && (
                                    <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#dc2626", fontWeight: 600 }}>
                                        {qrScanError}
                                    </div>
                                )}

                                {qrCodeVerified && (
                                    <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#047857", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                        <FiCheckCircle /> Device Barcode / QR Code Verified
                                    </div>
                                )}
                            </div>

                            {/* Footer Action Buttons */}
                            <div style={{ display: "flex", gap: "0.65rem", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
                                <button
                                    type="button"
                                    style={{
                                        flex: 1.2,
                                        padding: "0.75rem",
                                        borderRadius: "10px",
                                        background: qrCodeVerified ? "linear-gradient(135deg, #059669 0%, #047857 100%)" : "#cbd5e1",
                                        border: "none",
                                        color: "#ffffff",
                                        fontSize: "0.875rem",
                                        fontWeight: 700,
                                        cursor: qrCodeVerified ? "pointer" : "default"
                                    }}
                                    disabled={actionLoadingId === qrModalItem.deviceId}
                                    onClick={() => {
                                        if (!qrCodeVerified) {
                                            const isMatched = handleVerifyQrCode(qrModalItem);
                                            if (!isMatched) return;
                                        }
                                        handleConfirmReceipt(qrModalItem);
                                    }}
                                >
                                    {actionLoadingId === qrModalItem.deviceId ? "Verifying..." : "Accept Device"}
                                </button>
                                <button
                                    type="button"
                                    style={{
                                        flex: 1,
                                        padding: "0.75rem",
                                        borderRadius: "10px",
                                        background: "#fef2f2",
                                        border: "1px solid #fca5a5",
                                        color: "#dc2626",
                                        fontSize: "0.875rem",
                                        fontWeight: 700,
                                        cursor: "pointer"
                                    }}
                                    onClick={() => {
                                        const target = qrModalItem;
                                        setQrModalItem(null);
                                        setRejectModalItem(target);
                                        setRejectionReason("Serial number mismatch");
                                        setRejectionDescription("");
                                    }}
                                >
                                    Report Issue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Device Handover Rejection Issue Modal */}
            {rejectModalItem && (
                <div className="tech-modal-overlay" onClick={() => setRejectModalItem(null)}>
                    <div className="tech-modal-content" style={{ maxWidth: "500px", border: "none", overflow: "hidden", padding: 0, borderRadius: "20px" }} onClick={(e) => e.stopPropagation()}>
                        <div className="tech-modal-header">
                            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#ffffff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <FiAlertCircle style={{ color: "#ffffff" }} /> Report Handover Issue
                            </h3>
                            <button className="tech-modal-close" onClick={() => setRejectModalItem(null)}><FiX /></button>
                        </div>
                        <div className="tech-modal-body" style={{ padding: "1.25rem" }}>
                            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "0.85rem", marginBottom: "1rem" }}>
                                <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>{rejectModalItem.brand} {rejectModalItem.model}</div>
                                <div style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 700 }}>Device #EC-{rejectModalItem.deviceId}</div>
                                <div style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "0.2rem" }}>
                                    Handover Agent: <strong>{rejectModalItem.collectionAgentName || "Collection Agent"}</strong> ({rejectModalItem.collectionAgentPhone})
                                </div>
                            </div>

                            <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>
                                Select Issue Reason:
                            </label>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", marginBottom: "1rem" }}>
                                {[
                                    "Wrong device",
                                    "Serial number mismatch",
                                    "Device damaged",
                                    "Missing component",
                                    "Package damaged",
                                    "Other"
                                ].map((reasonOption) => (
                                    <label
                                        key={reasonOption}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem",
                                            fontSize: "0.85rem",
                                            color: "#334155",
                                            padding: "0.45rem 0.75rem",
                                            borderRadius: "8px",
                                            border: rejectionReason === reasonOption ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
                                            background: rejectionReason === reasonOption ? "#fef2f2" : "#ffffff",
                                            cursor: "pointer",
                                            fontWeight: rejectionReason === reasonOption ? 700 : 500
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="handoverRejectionReason"
                                            value={reasonOption}
                                            checked={rejectionReason === reasonOption}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                        />
                                        {reasonOption}
                                    </label>
                                ))}
                            </div>

                            <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                                Description / Additional Notes:
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Provide specific details about why the device was rejected..."
                                value={rejectionDescription}
                                onChange={handleDescriptionChange}
                                style={{
                                    width: "100%",
                                    padding: "0.6rem",
                                    borderRadius: "10px",
                                    border: rejectionDescriptionError ? "1.5px solid #ef4444" : "1px solid #cbd5e1",
                                    fontSize: "0.85rem",
                                    boxSizing: "border-box",
                                    marginBottom: rejectionDescriptionError ? "0.3rem" : "1.25rem",
                                    fontFamily: "inherit"
                                }}
                            />
                            {rejectionDescriptionError && (
                                <div style={{ color: "#dc2626", fontSize: "0.775rem", fontWeight: 600, marginBottom: "0.9rem" }}>
                                    {rejectionDescriptionError}
                                </div>
                            )}

                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    type="button"
                                    onClick={() => setRejectModalItem(null)}
                                    style={{ flex: 1, padding: "0.65rem", borderRadius: "10px", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569", fontWeight: 700, cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={rejectingLoading}
                                    onClick={handleRejectHandover}
                                    style={{ flex: 1.5, padding: "0.65rem", borderRadius: "10px", background: "#dc2626", border: "none", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
                                >
                                    {rejectingLoading ? "Submitting..." : "Submit Issue"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Live Delivery Tracking Stepper Modal */}
            {selectedDelivery && (
                <div className="tech-modal-overlay" onClick={() => setSelectedDelivery(null)}>
                    <div className="tech-modal-content" style={{ maxWidth: "600px", padding: 0, borderRadius: "20px", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#ffffff", padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{ background: "rgba(255,255,255,0.2)", padding: "0.5rem", borderRadius: "10px", display: "flex" }}>
                                    <FiNavigation style={{ fontSize: "1.4rem" }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Live Delivery Tracking</h3>
                                    <span style={{ fontSize: "0.75rem", opacity: 0.9 }}>
                                        #EC-{selectedDelivery.deviceId} &bull; {selectedDelivery.brand} {selectedDelivery.model}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDelivery(null)}
                                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#ffffff", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <FiX />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: "1.5rem", maxHeight: "75vh", overflowY: "auto" }}>
                            {/* Collection Agent Banner */}
                            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "14px", padding: "1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                    {selectedDelivery.collectionAgentPhoto && !agentPhotoFailed ? (
                                        <img
                                            src={getAgentPhoto(selectedDelivery.collectionAgentPhoto)}
                                            alt="Agent Profile"
                                            style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
                                            onError={() => setAgentPhotoFailed(true)}
                                        />
                                    ) : (
                                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#059669", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.15rem" }}>
                                            {(selectedDelivery.collectionAgentName || "A").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontSize: "0.725rem", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Collection Agent</div>
                                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#065f46" }}>
                                            {selectedDelivery.collectionAgentName || "Assigned Agent"}
                                        </div>
                                        <div style={{ fontSize: "0.775rem", color: "#047857", fontWeight: 600, marginTop: "0.1rem" }}>
                                            Destination: {selectedDelivery.inspectionCenterName || "EcoCycle Inspection Hub"}
                                        </div>
                                    </div>
                                </div>

                                {selectedDelivery.collectionAgentPhone && (
                                    <a
                                        href={`tel:${selectedDelivery.collectionAgentPhone}`}
                                        style={{ background: "#059669", color: "#ffffff", padding: "0.5rem 1rem", borderRadius: "10px", textDecoration: "none", fontSize: "0.825rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem" }}
                                    >
                                        <FiPhone /> Call Agent
                                    </a>
                                )}
                            </div>

                            {/* Re-assigned Agent Notification Banner */}
                            {(selectedDelivery.hasPreviousFailedPickup || selectedDelivery.previousAgentName) && (
                                <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "12px", padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.825rem", color: "#1e40af", display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                                    <FiRefreshCw style={{ color: "#2563eb", fontSize: "1.1rem", marginTop: "0.1rem", flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontWeight: 700, color: "#1d4ed8", marginBottom: "0.15rem" }}>
                                            Re-assigned Collection Agent
                                        </div>
                                        <div>
                                            The previous pickup attempt failed{selectedDelivery.previousAgentName ? ` (Previous Agent: ${selectedDelivery.previousAgentName})` : ""}.
                                            A new collection agent (<strong>{selectedDelivery.collectionAgentName || "Assigned Agent"}</strong>) was re-allocated to pick up this device.
                                            {selectedDelivery.previousFailureReason ? ` Failure Reason: "${selectedDelivery.previousFailureReason}"` : ""}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Current Pickup Failed Banner */}
                            {(String(selectedDelivery.status || "").toLowerCase() === "failed" || String(selectedDelivery.status || "").toLowerCase() === "pickupfailed" || String(selectedDelivery.deliveryStatus || "").toLowerCase() === "failed") && (
                                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "12px", padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.825rem", color: "#991b1b", display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                                    <FiAlertTriangle style={{ color: "#dc2626", fontSize: "1.1rem", marginTop: "0.1rem", flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontWeight: 700, color: "#b91c1c", marginBottom: "0.15rem" }}>
                                            Pickup Attempt Failed
                                        </div>
                                        <div>
                                            The collection agent was unable to complete pickup: {selectedDelivery.previousFailureReason || selectedDelivery.failureReason || selectedDelivery.deliveryFailureReason || "Citizen unavailable / pickup slot missed"}. Awaiting administrator re-allocation.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Stepper Timeline */}
                            <div style={{ marginBottom: "1.25rem" }}>
                                <h4 style={{ margin: "0 0 0.85rem 0", fontSize: "0.875rem", fontWeight: 700, color: "#1e293b" }}>
                                    Delivery Progress Pipeline
                                </h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                                    {getDeliveryTimelineSteps(selectedDelivery).map((step, idx) => (
                                        <div key={idx} style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                                <div style={{
                                                    width: "28px",
                                                    height: "28px",
                                                    borderRadius: "50%",
                                                    background: step.error ? "#ef4444" : step.completed ? "#10b981" : step.current ? "#f59e0b" : "#e2e8f0",
                                                    color: step.completed || step.error || step.current ? "#ffffff" : "#94a3b8",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "0.85rem",
                                                    fontWeight: 800
                                                }}>
                                                    {step.error ? <FiAlertCircle /> : step.completed ? <FiCheckCircle /> : idx + 1}
                                                </div>
                                                {idx < 5 && (
                                                    <div style={{ width: "2px", height: "24px", background: step.completed ? "#10b981" : "#e2e8f0", margin: "2px 0" }}></div>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: step.current || step.completed ? 700 : 500, fontSize: "0.875rem", color: step.error ? "#dc2626" : step.current ? "#d97706" : step.completed ? "#0f172a" : "#64748b" }}>
                                                    {step.title}
                                                </div>
                                                <div style={{ fontSize: "0.775rem", color: "#64748b", marginTop: "0.15rem" }}>
                                                    {step.desc}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Details Card Grid */}
                            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1rem", fontSize: "0.825rem", color: "#334155" }}>
                                <h4 style={{ margin: "0 0 0.6rem 0", fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                                    Shipment & Item Info
                                </h4>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                                    <div><strong>Customer:</strong> {selectedDelivery.customerName}</div>
                                    <div><strong>Contact:</strong> {selectedDelivery.customerPhone || "N/A"}</div>
                                    <div><strong>Address:</strong> {selectedDelivery.address}, {selectedDelivery.city}</div>
                                    <div><strong>Landmark:</strong> {selectedDelivery.landmark || "N/A"}</div>
                                    <div><strong>Item Weight:</strong> {selectedDelivery.weight || 1} kg</div>
                                    <div><strong>Condition:</strong> {selectedDelivery.working ? "Working" : "Non-Functional"}</div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setSelectedDelivery(null)}
                                style={{ padding: "0.55rem 1.25rem", borderRadius: "10px", background: "#0f172a", border: "none", color: "#ffffff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                            >
                                Close Tracking
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Handover Success & Inspection Deadline / Instructions Modal */}
            {handoverInstructionModal && (
                <div className="modal-backdrop" style={{ zIndex: 9999 }}>
                    <div className="inspection-modal-card" style={{ maxWidth: "580px", borderRadius: "20px", padding: "0", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
                        <div className="modal-header" style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#ffffff", padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", color: "#ffffff" }}>
                                    <FiCheckCircle />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#ffffff" }}>Device Handover Accepted!</h3>
                                </div>
                            </div>
                            <button
                                className="close-modal-btn"
                                onClick={() => setHandoverInstructionModal(null)}
                                style={{ color: "#ffffff", background: "rgba(255, 255, 255, 0.15)", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="modal-body-scroll" style={{ padding: "1.5rem", background: "#f8fafc" }}>
                            {/* Device Info Summary */}
                            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <span style={{ fontSize: "0.725rem", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        Accepted Item
                                    </span>
                                    <h4 style={{ margin: "0.2rem 0 0 0", fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                                        {handoverInstructionModal.device.brand} {handoverInstructionModal.device.model}
                                    </h4>
                                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                        Category: {handoverInstructionModal.device.categoryName || "E-Waste Device"}
                                    </span>
                                </div>
                                <span style={{ padding: "0.35rem 0.85rem", borderRadius: "9999px", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", fontSize: "0.75rem", fontWeight: 700 }}>
                                    #DEV-{String(handoverInstructionModal.device.deviceId).padStart(3, "0")}
                                </span>
                            </div>

                            {/* QR Code Packaging Protection Notice Card */}
                            <div style={{
                                background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                                border: "1.5px solid #93c5fd",
                                borderRadius: "14px",
                                padding: "1.1rem 1.25rem",
                                marginBottom: "1.25rem",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "1rem",
                                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.08)"
                            }}>
                                <div style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "12px",
                                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                                    color: "#ffffff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.4rem",
                                    flexShrink: 0,
                                    boxShadow: "0 4px 10px rgba(37, 99, 235, 0.25)"
                                }}>
                                    <FaQrcode />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <FiShield style={{ color: "#2563eb" }} /> QR Code {"&"} Packaging Protection Protocol
                                    </div>
                                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1e3a8a", margin: "0.2rem 0 0.3rem 0" }}>
                                        Do NOT destroy or discard the QR Code packaging!
                                    </div>
                                    <div style={{ fontSize: "0.825rem", color: "#1e40af", lineHeight: "1.45" }}>
                                        Please keep the original QR code label intact. When dispatching or transferring this device to recycling/processing centers, <strong>pack the device in the exact same package with its original QR code</strong>.
                                    </div>
                                </div>
                            </div>

                            {/* Inspection Deadline Card */}
                            <div style={{ background: "linear-gradient(135deg, #fffbe6 0%, #fef3c7 100%)", border: "1px solid #fde68a", borderRadius: "14px", padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#f59e0b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>
                                    <FiClock />
                                </div>
                                <div>
                                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        Technician Inspection Deadline
                                    </div>
                                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#78350f", margin: "0.15rem 0" }}>
                                        {handoverInstructionModal.deadline}
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "#92400e" }}>
                                        Complete technical testing and destination routing before deadline.
                                    </div>
                                </div>
                            </div>

                            {/* Technician Inspection Deadline & Penalty Instruction Card */}
                            <div style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", border: "1.5px solid #fed7aa", borderRadius: "14px", padding: "1.1rem 1.25rem", marginBottom: "1.25rem", boxShadow: "0 4px 12px rgba(194, 65, 12, 0.06)" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0, boxShadow: "0 4px 10px rgba(234, 88, 12, 0.25)" }}>
                                        <FiAlertTriangle />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                            <FiShield style={{ color: "#ea580c" }} /> Technician Inspection Deadline {"&"} Penalty Instruction
                                        </div>
                                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#9a3412", margin: "0.25rem 0 0.35rem 0" }}>
                                            Inspection Deadline Policy
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.825rem", color: "#7c2d12", display: "flex", flexDirection: "column", gap: "0.45rem", lineHeight: "1.45" }}>
                                            <li>
                                                <strong>Responsibility:</strong> Once a device is assigned to you, you are responsible for completing the inspection within the specified inspection deadline.
                                            </li>
                                            <li>
                                                <strong>Extension Limit:</strong> If you are unable to complete the inspection within the initial deadline, an extension may be provided. A <strong>maximum of two 24-hour extensions</strong> will be permitted.
                                            </li>
                                            <li>
                                                <strong>Penalty Rule:</strong> If the inspection is still not completed after the second 24-hour extension, a <strong>penalty will be applied</strong> to the assigned technician for failure to complete the inspection within the permitted timeframe.
                                            </li>
                                            <li>
                                                <strong>Record Impact:</strong> Repeated failure to complete inspections on time may also affect your technician performance record and future assignments.
                                            </li>
                                            <li>
                                                <strong>Action Required:</strong> Please ensure that every assigned device is inspected within the permitted deadline or request an extension when necessary.
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Inspection Guidelines / Instructions */}
                            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1.25rem" }}>
                                <h4 style={{ margin: "0 0 0.85rem 0", fontSize: "0.9rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <FiFileText style={{ color: "#059669" }} /> Technical Inspection Instructions
                                </h4>
                                <ol style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.825rem", color: "#334155", display: "flex", flexDirection: "column", gap: "0.65rem", lineHeight: "1.45" }}>
                                    <li>
                                        <strong>Physical {"&"} Cosmetic Audit:</strong> Verify serial number, casing integrity, screen glass, and check for unreported water or physical damages.
                                    </li>
                                    <li>
                                        <strong>Hardware Diagnostic Test:</strong> Test motherboard response, battery health, charging port status, and overall component functionality.
                                    </li>
                                    <li>
                                        <strong>Packaging Preservation:</strong> Ensure the original QR code packaging label is undamaged and pack the device in the same package when sending to centers.
                                    </li>
                                    <li>
                                        <strong>Environmental Routing Decision:</strong> Determine the optimal final pathway: <em>Eco Recycling</em>, <em>Refurbishment</em>, or <em>Part Salvage</em>.
                                    </li>
                                    <li>
                                        <strong>Report Submission:</strong> Log technical scores, technician comments, and upload component evidence photos.
                                    </li>
                                </ol>
                            </div>
                        </div>

                        <div className="modal-footer" style={{ padding: "1rem 1.5rem", background: "#ffffff", borderTop: "1px solid #e2e8f0", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setHandoverInstructionModal(null)}
                                style={{ padding: "0.6rem 1.25rem", borderRadius: "10px", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setHandoverInstructionModal(null);
                                    navigate("/technician/device-inspection");
                                }}
                                style={{ padding: "0.6rem 1.35rem", borderRadius: "10px", background: "#059669", border: "none", color: "#ffffff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                            >
                                <FiActivity /> Go to Device Inspection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TechnicianDelivery;
