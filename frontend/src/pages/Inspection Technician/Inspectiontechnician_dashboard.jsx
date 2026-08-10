import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiSearch,
    FiBell,
    FiLogOut,
    FiEye,
    FiCheck,
    FiX,
    FiFilter,
    FiCpu,
    FiClock,
    FiAlertCircle,
    FiCheckSquare,
    FiActivity,
    FiGrid,
    FiList,
    FiRefreshCw,
    FiSmartphone,
    FiFileText
} from "react-icons/fi";
import "./Inspectiontechnician_dashboard.css";

function Inspectiontechnician_dashboard() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");
    const [viewMode, setViewMode] = useState("table"); // "table" or "grid"
    
    // Modal State
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [activeModalTab, setActiveModalTab] = useState("overview");
    const [rejectionTarget, setRejectionTarget] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [processingId, setProcessingId] = useState(null);

    // Diagnostic form inside modal
    const [diagnosticNotes, setDiagnosticNotes] = useState("");

    const navigate = useNavigate();

    const userName = localStorage.getItem("firstName") ||
                     localStorage.getItem("userName") ||
                     localStorage.getItem("username") ||
                     localStorage.getItem("name") ||
                     "Inspection Officer";

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found in localStorage, redirecting to login.");
            navigate("/");
            return;
        }
        fetchInspectionRequests();
    }, []);

    const fetchInspectionRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const techId = localStorage.getItem("technicianId") ||
                           localStorage.getItem("userId") ||
                           localStorage.getItem("loginId") || 1;
            
            const response = await axios.get(
                `https://localhost:7102/api/Inspection/technicain/${techId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log("Technician Inspection Requests:", response.data);

response.data.forEach((req) => {
    console.log(
        "Request ID:",
        req.inspectionRequestId,
        "STATUS:",
        req.status,
        "STATUS LOWER:",
        req.status?.toLowerCase()
    );
});
            setRequests(response.data || []);
            setError("");
        } catch (err) {
            console.error("Error fetching inspection requests:", err);
            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
                localStorage.clear();
                navigate("/");
            } else {
                setError(err.response?.data?.message || "Failed to load assigned inspection requests.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId) => {
        try {
            setProcessingId(requestId);
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `https://localhost:7102/api/Inspection/accept/${requestId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            setRequests(prev =>
                prev.map(r => r.inspectionRequestId === requestId ? { ...r, status: "Accepted" } : r)
            );
            if (selectedRequest?.inspectionRequestId === requestId) {
                setSelectedRequest(prev => prev ? { ...prev, status: "Accepted" } : null);
            }
        } catch (err) {
            console.error("Error accepting request:", err);
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectSubmit = async (e) => {
        e.preventDefault();
        if (!rejectionTarget) return;

        try {
            setProcessingId(rejectionTarget.inspectionRequestId);
            const token = localStorage.getItem("token");
            
            const response = await axios.post(
                `https://localhost:7102/api/Inspection/reject/${rejectionTarget.inspectionRequestId}`,
                JSON.stringify(rejectionReason || "Unable to inspect at this time."),
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            setRequests(prev => prev.filter(r => r.inspectionRequestId !== rejectionTarget.inspectionRequestId));
            setRejectionTarget(null);
            setRejectionReason("");
            if (selectedRequest?.inspectionRequestId === rejectionTarget.inspectionRequestId) {
                setSelectedRequest(null);
            }
        } catch (err) {
            console.error("Error rejecting request:", err);
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case "assigned":
                return <span className="pill pill-blue">Assigned</span>;
            case "accepted":
                return <span className="pill pill-green">Accepted</span>;
            case "inprogress":
            case "in progress":
                return <span className="pill pill-amber">In Evaluation</span>;
            case "rejected":
                return <span className="pill pill-red">Declined</span>;
            default:
                return <span className="pill pill-gray">{status || "Assigned"}</span>;
        }
    };

    const filteredRequests = requests.filter((r) => {
        const d = r.device || {};
        const matchesSearch =
            (d.brand?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.model?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.modelNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.serialNumber?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.condition?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.category?.categoryName?.toLowerCase() || "").includes(searchQuery.toLowerCase());

        const matchesStatus =
            activeFilter === "All" ||
            (r.status?.toLowerCase() || "") === activeFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    const totalCount = requests.length;
    const pendingActionCount = requests.filter(r => r.status?.toLowerCase() === "assigned").length;
    const acceptedCount = requests.filter(r => r.status?.toLowerCase() === "accepted" || r.status?.toLowerCase() === "inprogress").length;
    const urgentCount = requests.filter(r => r.responseDeadline && new Date(r.responseDeadline) < new Date(Date.now() + 86400000)).length;

    return (
        <div className="clean-dashboard-app">
            <Sidebar />
            
            <div className="clean-main-container">
                {/* Header */}
                <header className="clean-topbar">
                    <div className="topbar-title-area">
                        <h1>Inspection Dashboard</h1>
                        <p>Manage and inspect assigned e-waste device submissions</p>
                    </div>

                    <div className="topbar-actions">
                        <div className="clean-search-box">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by brand, model, S/N..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <button className="clean-icon-btn" title="Refresh" onClick={fetchInspectionRequests}>
                            <FiRefreshCw className={loading ? "spin-icon" : ""} />
                        </button>

                        <button className="clean-icon-btn" title="Notifications">
                            <FiBell />
                            {pendingActionCount > 0 && <span className="dot-badge"></span>}
                        </button>

                        <div className="vd-user-profile-pill" style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#ffffff", border: "1px solid #e2e8f0", padding: "0.3rem 0.8rem 0.3rem 0.3rem", borderRadius: "9999px" }}>
                            <div className="vd-user-avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#635bff", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem" }}>{userName.charAt(0).toUpperCase()}</div>
                            <div className="vd-user-info" style={{ display: "flex", flexDirection: "column" }}>
                                <span className="vd-user-name" style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1a202c" }}>{userName}</span>
                                <span className="vd-user-role" style={{ fontSize: "0.7rem", color: "#718096" }}>Inspection Officer</span>
                            </div>
                        </div>

                        <button onClick={() => { localStorage.clear(); navigate("/"); }} className="clean-logout-btn" style={{ cursor: "pointer" }}>
                            <FiLogOut /> Exit
                        </button>
                    </div>
                </header>

                {/* Summary Metric Cards */}
                <div className="summary-cards-grid">
                    <div className="summary-card">
                        <div className="card-info">
                            <span className="card-label">Total Assigned</span>
                            <span className="card-value">{totalCount}</span>
                            <span className="card-subtext">Total active assignments</span>
                        </div>
                        <div className="card-icon icon-blue"><FiCheckSquare /></div>
                    </div>

                    <div className="summary-card">
                        <div className="card-info">
                            <span className="card-label">Action Required</span>
                            <span className="card-value">{pendingActionCount}</span>
                            <span className="card-subtext">Pending review & acceptance</span>
                        </div>
                        <div className="card-icon icon-amber"><FiAlertCircle /></div>
                    </div>

                    <div className="summary-card">
                        <div className="card-info">
                            <span className="card-label">In Evaluation</span>
                            <span className="card-value">{acceptedCount}</span>
                            <span className="card-subtext">Accepted inspection queue</span>
                        </div>
                        <div className="card-icon icon-green"><FiActivity /></div>
                    </div>

                    <div className="summary-card">
                        <div className="card-info">
                            <span className="card-label">Urgent Deadlines</span>
                            <span className="card-value">{urgentCount}</span>
                            <span className="card-subtext">Expires within 24 hours</span>
                        </div>
                        <div className="card-icon icon-red"><FiClock /></div>
                    </div>
                </div>

                {/* Inspection Queue Panel */}
                <section className="queue-section">
                    <div className="queue-card">
                        {/* Toolbar */}
                        <div className="queue-toolbar">
                            <div>
                                <h3 className="queue-heading">Assigned Submissions</h3>
                                <p className="queue-desc">Review device specifications and complete quality evaluations</p>
                            </div>

                            <div className="queue-controls">
                                <div className="filter-pills">
                                    {["All", "Assigned", "Accepted", "InProgress"].map((tab) => (
                                        <button
                                            key={tab}
                                            className={`pill-btn ${activeFilter === tab ? "active" : ""}`}
                                            onClick={() => setActiveFilter(tab)}
                                        >
                                            {tab === "InProgress" ? "In Evaluation" : tab}
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

                        {/* Content Body */}
                        {loading ? (
                            <div className="state-box">
                                <div className="spinner"></div>
                                <p>Loading inspection requests...</p>
                            </div>
                        ) : error ? (
                            <div className="state-box error-box">
                                <p>{error}</p>
                                <button className="retry-btn" onClick={fetchInspectionRequests}>Retry</button>
                            </div>
                        ) : filteredRequests.length === 0 ? (
                            <div className="state-box">
                                <FiFilter className="empty-icon" />
                                <p>No inspection requests match your criteria.</p>
                            </div>
                        ) : viewMode === "table" ? (
                            /* TABLE VIEW */
                            <div className="table-wrapper">
                                <table className="clean-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Device Details</th>
                                            <th>Model & S/N</th>
                                            <th>Declared Condition</th>
                                            <th>Deadline</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRequests.map((req, index) => {
                                            const dev = req.device || {};
                                            return (
                                                <tr key={req.inspectionRequestId}>
                                                    <td style={{ fontWeight: 700, color: "#64748b" }}>{index + 1}</td>
                                                    <td>
                                                        <div className="device-name-cell">
                                                            <span className="dev-name">{dev.brand} {dev.model}</span>
                                                            <span className="dev-meta">Category: {dev.category?.categoryName || "Electronics"} | Qty: {dev.quantity || 1}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div><strong>Model:</strong> {dev.modelNumber || "N/A"}</div>
                                                        <div className="dev-meta"><strong>S/N:</strong> {dev.serialNumber || "N/A"}</div>
                                                    </td>
                                                    <td>
                                                        <span className="tag">{dev.condition || "Standard"}</span>
                                                    </td>
                                                    <td>
                                                        <div className="deadline-text">
                                                            <FiClock />
                                                            <span>{req.inspectionDeadline ? new Date(req.inspectionDeadline).toLocaleDateString() : "3 Days"}</span>
                                                        </div>
                                                    </td>
                                                    <td>{getStatusBadge(req.status)}</td>
                                                    <td>
                                                        <div
    className="action-row"
    style={{
        display: "flex",
        gap: "10px",
        alignItems: "center"
    }}
>
    <button
        type="button"
        className="btn btn-secondary"
        onClick={() => {
            setSelectedRequest(req);
            setActiveModalTab("overview");
        }}
    >
        <FiEye /> View
    </button>

    {req.status?.toLowerCase() === "assigned" && (
        <>
            <button
                type="button"
                onClick={() => handleAccept(req.inspectionRequestId)}
                disabled={processingId === req.inspectionRequestId}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    backgroundColor: "green",
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "5px",
                    cursor: "pointer"
                }}
            >
                <FiCheck /> Accept
            </button>

            <button
                type="button"
                onClick={() => {
                    console.log("DECLINE BUTTON CLICKED", req);
                    setRejectionTarget(req);
                }}
                disabled={processingId === req.inspectionRequestId}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    backgroundColor: "red",
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "5px",
                    cursor: "pointer"
                }}
            >
                <FiX /> Decline
            </button>
        </>
    )}
</div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            /* GRID VIEW */
                            <div className="grid-cards">
                                {filteredRequests.map((req) => {
                                    const dev = req.device || {};
                                    return (
                                        <div key={req.inspectionRequestId} className="grid-card">
                                            <div className="grid-card-header">
                                                <span className="id-badge">ID #{req.inspectionRequestId}</span>
                                                {getStatusBadge(req.status)}
                                            </div>

                                            <div className="grid-card-body">
                                                <h4 className="device-title">{dev.brand} {dev.model}</h4>
                                                <p className="device-sub">{dev.category?.categoryName || "Hardware"} • Qty: {dev.quantity || 1}</p>

                                                <div className="spec-list">
                                                    <div className="spec-item">
                                                        <span>Model No:</span>
                                                        <strong>{dev.modelNumber || "N/A"}</strong>
                                                    </div>
                                                    <div className="spec-item">
                                                        <span>Serial No:</span>
                                                        <strong>{dev.serialNumber || "N/A"}</strong>
                                                    </div>
                                                    <div className="spec-item">
                                                        <span>Condition:</span>
                                                        <strong>{dev.condition || "Standard"}</strong>
                                                    </div>
                                                    <div className="spec-item">
                                                        <span>Deadline:</span>
                                                        <strong>{req.inspectionDeadline ? new Date(req.inspectionDeadline).toLocaleDateString() : "3 Days"}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid-card-footer">
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ flex: 1 }}
                                                    onClick={() => {
                                                        setSelectedRequest(req);
                                                        setActiveModalTab("overview");
                                                    }}
                                                >
                                                    <FiEye /> View
                                                </button>

                                                {req.status?.toLowerCase() === "assigned" && (
                                                    <>
                                                        <button
                                                            className="btn btn-success"
                                                            onClick={() => handleAccept(req.inspectionRequestId)}
                                                            disabled={processingId === req.inspectionRequestId}
                                                        >
                                                            <FiCheck /> Accept
                                                        </button>
                                                        <button
                                                            className="btn btn-danger"
                                                            onClick={() => setRejectionTarget(req)}
                                                            disabled={processingId === req.inspectionRequestId}
                                                        >
                                                            <FiX /> Decline
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* Inspection Details Modal */}
                {selectedRequest && (
                    <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
                        <div className="clean-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h2>{selectedRequest.device?.brand} {selectedRequest.device?.model}</h2>
                                    <p className="modal-sub">Inspection Request #{selectedRequest.inspectionRequestId}</p>
                                </div>
                                <button className="close-btn" onClick={() => setSelectedRequest(null)}>
                                    <FiX />
                                </button>
                            </div>

                            {/* Modal Tabs */}
                            <div className="modal-tabs">
                                <button
                                    className={`tab-item ${activeModalTab === "overview" ? "active" : ""}`}
                                    onClick={() => setActiveModalTab("overview")}
                                >
                                    Overview & Specs
                                </button>
                                <button
                                    className={`tab-item ${activeModalTab === "diagnostic" ? "active" : ""}`}
                                    onClick={() => setActiveModalTab("diagnostic")}
                                >
                                    Evaluation Form
                                </button>
                                <button
                                    className={`tab-item ${activeModalTab === "photos" ? "active" : ""}`}
                                    onClick={() => setActiveModalTab("photos")}
                                >
                                    Uploaded Photos
                                </button>
                            </div>

                            <div className="modal-content">
                                {activeModalTab === "overview" && (
                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <label>Brand & Model</label>
                                            <span>{selectedRequest.device?.brand} {selectedRequest.device?.model}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Model Number</label>
                                            <span>{selectedRequest.device?.modelNumber || "N/A"}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Serial Number</label>
                                            <span>{selectedRequest.device?.serialNumber || "N/A"}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Quantity</label>
                                            <span>{selectedRequest.device?.quantity || 1} Unit(s)</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Condition</label>
                                            <span>{selectedRequest.device?.condition || "N/A"}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Working State</label>
                                            <span>{selectedRequest.device?.working || "N/A"}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Preference</label>
                                            <span>{selectedRequest.device?.processingPreference || "Standard"}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>Pickup Location</label>
                                            <span>{selectedRequest.device?.landmark || selectedRequest.device?.address || "N/A"}</span>
                                        </div>
                                    </div>
                                )}

                                {activeModalTab === "diagnostic" && (
                                    <div className="diagnostic-form">
                                        <label>Technician Evaluation Notes</label>
                                        <textarea
                                            placeholder="Enter hardware condition, component testing result, or evaluation notes..."
                                            value={diagnosticNotes}
                                            onChange={(e) => setDiagnosticNotes(e.target.value)}
                                            rows={5}
                                        ></textarea>
                                    </div>
                                )}

                                {activeModalTab === "photos" && (
                                    <div className="photos-grid">
                                        {selectedRequest.device?.frontPhoto && (
                                            <div className="photo-card">
                                                <img src={`https://localhost:7102/uploads/devices/FrontPhotos/${selectedRequest.device.frontPhoto}`} alt="Front" />
                                                <span>Front View</span>
                                            </div>
                                        )}
                                        {selectedRequest.device?.backPhoto && (
                                            <div className="photo-card">
                                                <img src={`https://localhost:7102/uploads/devices/BackPhotos/${selectedRequest.device.backPhoto}`} alt="Back" />
                                                <span>Back View</span>
                                            </div>
                                        )}
                                        {selectedRequest.device?.damagePhoto && (
                                            <div className="photo-card">
                                                <img src={`https://localhost:7102/uploads/devices/DamagePhotos/${selectedRequest.device.damagePhoto}`} alt="Damage" />
                                                <span>Damage Area</span>
                                            </div>
                                        )}
                                        {selectedRequest.device?.labelPhoto && (
                                            <div className="photo-card">
                                                <img src={`https://localhost:7102/uploads/devices/LabelPhotos/${selectedRequest.device.labelPhoto}`} alt="Label" />
                                                <span>Serial Label</span>
                                            </div>
                                        )}
                                        {!selectedRequest.device?.frontPhoto && !selectedRequest.device?.backPhoto && !selectedRequest.device?.damagePhoto && !selectedRequest.device?.labelPhoto && (
                                            <p className="no-photos">No photos uploaded for this device.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                {selectedRequest.status?.toLowerCase() === "assigned" && (
                                    <>
                                        <button
                                            className="btn btn-success"
                                            onClick={() => handleAccept(selectedRequest.inspectionRequestId)}
                                            disabled={processingId === selectedRequest.inspectionRequestId}
                                        >
                                            <FiCheck /> Accept Inspection Task
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => setRejectionTarget(selectedRequest)}
                                            disabled={processingId === selectedRequest.inspectionRequestId}
                                        >
                                            <FiX /> Decline Request
                                        </button>
                                    </>
                                )}
                                <button className="btn btn-secondary" onClick={() => setSelectedRequest(null)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Decline Modal */}
                {rejectionTarget && (
                    <div className="modal-overlay" onClick={() => setRejectionTarget(null)}>
                        <div className="clean-modal" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <div>
                                    <h2>Decline Request</h2>
                                    <p className="modal-sub">Inspection Request #{rejectionTarget.inspectionRequestId}</p>
                                </div>
                                <button className="close-btn" onClick={() => setRejectionTarget(null)}>
                                    <FiX />
                                </button>
                            </div>

                            <form onSubmit={handleRejectSubmit}>
                                <div style={{ margin: "1rem 0" }}>
                                    <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.5rem" }}>
                                        Reason for declining request:
                                    </label>
                                    <textarea
                                        className="clean-textarea"
                                        placeholder="Enter reason for declining..."
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        required
                                        rows={4}
                                    ></textarea>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setRejectionTarget(null)}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-danger"
                                        disabled={processingId === rejectionTarget.inspectionRequestId}
                                    >
                                        Decline Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Inspectiontechnician_dashboard;