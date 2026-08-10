import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiCpu,
    FiTool,
    FiCheckSquare,
    FiActivity,
    FiClock,
    FiShield,
    FiPackage,
    FiAward,
    FiInfo,
    FiX,
    FiBox,
    FiCheck,
    FiRefreshCw,
    FiUser
} from "react-icons/fi";
import "./Refurbishmentcenter_dashboard.css";

function RefurbishmentCenterDashboard() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [activeTab, setActiveTab] = useState("All");
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found, redirecting to login.");
            navigate("/");
            return;
        }
        fetchProfile(token);
        fetchRefurbishDevices(token);
    }, [navigate]);

    const fetchProfile = async (token) => {
        try {
            const response = await axios.get("https://localhost:7102/api/User/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(response.data || {});
        } catch (err) {
            console.error("Error fetching refurbishment center profile:", err);
        }
    };

    const fetchRefurbishDevices = async (token) => {
        try {
            setLoading(true);
            const response = await axios.get("https://localhost:7102/api/RefurbishmentCenter/All", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data && response.data.length > 0) {
                const mapped = response.data.map((item, idx) => ({
                    id: item.refurbishmentCenterId || (idx + 301),
                    deviceName: `${item.centerName || "Inspected Laptop"} Unit #${idx + 1}`,
                    category: "Computers & Laptops",
                    condition: "Faulty Screen & Battery",
                    technician: "Tech Alex Vance",
                    stage: idx % 4 === 0 ? "Diagnosis" : idx % 4 === 1 ? "Repairing" : idx % 4 === 2 ? "QC Testing" : "Certified Ready",
                    partsNeeded: "256GB SSD, 45W AC Adapter",
                    qcScore: "94/100"
                }));
                setDevices(mapped);
            } else {
                setDevices(defaultRefurbishDevices);
            }
        } catch (err) {
            setDevices(defaultRefurbishDevices);
        } finally {
            setLoading(false);
        }
    };

    const defaultRefurbishDevices = [
        {
            id: 301,
            deviceName: "Dell XPS 13 (i7 10th Gen)",
            category: "Laptops & Notebooks",
            condition: "Faulty SSD & Thermal Paste Breakdown",
            technician: "Tech Alex Vance",
            stage: "Repairing",
            partsNeeded: "512GB NVMe SSD, Thermal Pad",
            qcScore: "88/100 Pending QC"
        },
        {
            id: 302,
            deviceName: "Apple iPad Air 4 (64GB Wi-Fi)",
            category: "Tablets & Mobiles",
            condition: "Cracked Glass Digitizer",
            technician: "Tech Sarah Lin",
            stage: "QC Testing",
            partsNeeded: "Retina Display Digitizer Glass",
            qcScore: "96/100 Tested Pass"
        },
        {
            id: 303,
            deviceName: "HP Pavilion Desktop Tower",
            category: "Computers & Workstations",
            condition: "Power Supply Unit Short Circuit",
            technician: "Tech David Kim",
            stage: "Diagnosis",
            partsNeeded: "500W Bronze PSU",
            qcScore: "Pending Diagnosis"
        },
        {
            id: 304,
            deviceName: "Lenovo ThinkPad T14 Gen 2",
            category: "Laptops & Notebooks",
            condition: "Refurbished Keyboard & New Battery",
            technician: "Tech Alex Vance",
            stage: "Certified Ready",
            partsNeeded: "Original Backlit Keyboard",
            qcScore: "98/100 Certified"
        }
    ];

    const centerName = profile?.firstName 
        ? `${profile.firstName} ${profile.lastName || ""}`.trim()
        : localStorage.getItem("firstName") || "Apex Refurbish Hub";

    const updateStage = (deviceId, newStage) => {
        setDevices(prev =>
            prev.map(d => (d.id === deviceId ? { ...d, stage: newStage } : d))
        );
        if (selectedDevice && selectedDevice.id === deviceId) {
            setSelectedDevice(prev => ({ ...prev, stage: newStage }));
        }
    };

    const filteredDevices = devices.filter(d => {
        if (activeTab === "All") return true;
        return d.stage === activeTab;
    });

    const getStageBadge = (stage) => {
        switch (stage) {
            case "Certified Ready":
                return <span className="refurb-stage-badge certified"><FiCheckSquare /> Certified Ready</span>;
            case "QC Testing":
                return <span className="refurb-stage-badge testing"><FiActivity /> QC Testing</span>;
            case "Repairing":
                return <span className="refurb-stage-badge repairing"><FiTool /> Repairing</span>;
            case "Diagnosis":
            default:
                return <span className="refurb-stage-badge diagnosis"><FiClock /> In Diagnosis</span>;
        }
    };

    return (
        <div className="refurb-dashboard-layout">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Dashboard */}
            <main className="refurb-main-content">
                {/* Header Ribbon */}
                <div className="refurb-header-ribbon">
                    <div>
                        <h1 className="refurb-welcome-title">Welcome, {centerName}!</h1>
                        <p className="refurb-welcome-sub">Facility ID: <strong>REF-HUB-8092</strong> • Zone: Central Refurbishment Facility</p>
                    </div>

                    <div className="refurb-header-actions">
                        <span style={{ background: "#f5f3ff", color: "#6d28d9", padding: "0.4rem 0.85rem", borderRadius: "20px", fontWeight: 700, fontSize: "0.8rem" }}>
                            ● Bench Active (6 Techs)
                        </span>

                        <Link to="/manage-userprofile" className="refurb-profile-pill">
                            <div className="refurb-avatar">
                                {centerName.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{centerName}</span>
                                <span style={{ fontSize: "0.725rem", color: "#7c3aed", fontWeight: 600 }}>Refurbishment Facility</span>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Metric Summary Cards Grid */}
                <div className="refurb-kpi-grid">
                    <div className="refurb-kpi-card">
                        <div className="refurb-kpi-top">
                            <div className="refurb-kpi-icon purple">
                                <FiTool />
                            </div>
                            <span className="refurb-kpi-badge">Active Queue</span>
                        </div>
                        <div>
                            <h3 className="refurb-kpi-val">{devices.filter(d => d.stage !== "Certified Ready").length} Units</h3>
                            <div className="refurb-kpi-lbl">Devices Under Repair</div>
                        </div>
                    </div>

                    <div className="refurb-kpi-card">
                        <div className="refurb-kpi-top">
                            <div className="refurb-kpi-icon emerald">
                                <FiCheckSquare />
                            </div>
                            <span className="refurb-kpi-badge">+12 This Month</span>
                        </div>
                        <div>
                            <h3 className="refurb-kpi-val">86 Units</h3>
                            <div className="refurb-kpi-lbl">Refurbished & Certified</div>
                        </div>
                    </div>

                    <div className="refurb-kpi-card">
                        <div className="refurb-kpi-top">
                            <div className="refurb-kpi-icon blue">
                                <FiActivity />
                            </div>
                            <span className="refurb-kpi-badge">QC Passed</span>
                        </div>
                        <div>
                            <h3 className="refurb-kpi-val">96.4%</h3>
                            <div className="refurb-kpi-lbl">Quality Control Pass Rate</div>
                        </div>
                    </div>

                    <div className="refurb-kpi-card">
                        <div className="refurb-kpi-top">
                            <div className="refurb-kpi-icon amber">
                                <FiShield />
                            </div>
                            <span className="refurb-kpi-badge" style={{ background: "#fffbeb", color: "#b45309" }}>Landfill Saved</span>
                        </div>
                        <div>
                            <h3 className="refurb-kpi-val">420 kg</h3>
                            <div className="refurb-kpi-lbl">E-Waste Diverted Saved</div>
                        </div>
                    </div>
                </div>

                {/* 2-Column Dashboard Grid */}
                <div className="refurb-grid-layout">
                    {/* Left Column (Refurbishment Workstation Table) */}
                    <div>
                        <div className="refurb-panel-card">
                            <div className="refurb-panel-header">
                                <div>
                                    <h2 className="refurb-panel-title">Refurbishment Workstation Queue</h2>
                                    <p className="refurb-panel-subtitle">Diagnose, repair, replace components, and issue testing certifications</p>
                                </div>

                                <div className="refurb-tab-pills">
                                    {["All", "Diagnosis", "Repairing", "QC Testing", "Certified Ready"].map((tab) => (
                                        <button
                                            key={tab}
                                            className={`refurb-tab-btn ${activeTab === tab ? "active" : ""}`}
                                            onClick={() => setActiveTab(tab)}
                                        >
                                            {tab} ({tab === "All" ? devices.length : devices.filter(d => d.stage === tab).length})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="refurb-table-wrapper">
                                {loading ? (
                                    <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                                        Loading workstation queue...
                                    </div>
                                ) : filteredDevices.length === 0 ? (
                                    <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", color: "#64748b" }}>
                                        <FiBox style={{ fontSize: "2rem", color: "#94a3b8", marginBottom: "0.5rem" }} />
                                        <p style={{ margin: 0, fontWeight: 600 }}>No items in stage "{activeTab}".</p>
                                    </div>
                                ) : (
                                    <table className="refurb-table">
                                        <thead>
                                            <tr>
                                                <th>Device Tag</th>
                                                <th>Device & Category</th>
                                                <th>Condition / Defect</th>
                                                <th>Lead Tech</th>
                                                <th>Refurbish Stage</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredDevices.map((item) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <span style={{ fontFamily: "monospace", fontWeight: 700, background: "#f1f5f9", padding: "0.25rem 0.6rem", borderRadius: "6px", color: "#0f172a" }}>
                                                            #DEV-{item.id}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.deviceName}</div>
                                                        <div style={{ fontSize: "0.75rem", color: "#7c3aed", fontWeight: 600 }}>{item.category}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, color: "#334155" }}>{item.condition}</div>
                                                        <div style={{ fontSize: "0.725rem", color: "#64748b" }}>Parts: {item.partsNeeded}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#0f172a" }}>{item.technician}</div>
                                                    </td>
                                                    <td>{getStageBadge(item.stage)}</td>
                                                    <td>
                                                        <div style={{ display: "flex", gap: "0.4rem" }}>
                                                            {item.stage === "Diagnosis" && (
                                                                <button
                                                                    className="refurb-action-btn primary"
                                                                    onClick={() => updateStage(item.id, "Repairing")}
                                                                    title="Start Hardware Repair"
                                                                >
                                                                    <FiTool /> Start Repair
                                                                </button>
                                                            )}
                                                            {item.stage === "Repairing" && (
                                                                <button
                                                                    className="refurb-action-btn primary"
                                                                    onClick={() => updateStage(item.id, "QC Testing")}
                                                                    title="Send to Quality Control Testing"
                                                                >
                                                                    <FiActivity /> Pass to QC
                                                                </button>
                                                            )}
                                                            {item.stage === "QC Testing" && (
                                                                <button
                                                                    className="refurb-action-btn success"
                                                                    onClick={() => updateStage(item.id, "Certified Ready")}
                                                                    title="Issue Refurbished Certification"
                                                                >
                                                                    <FiCheckSquare /> Issue Cert
                                                                </button>
                                                            )}
                                                            <button
                                                                className="refurb-action-btn"
                                                                onClick={() => setSelectedDevice(item)}
                                                                title="View Diagnostics"
                                                            >
                                                                <FiInfo /> Inspect
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side Panel: Refurbishment Pipeline Timeline */}
                    <div>
                        <div className="refurb-panel-card">
                            <h3 className="refurb-panel-title">Refurbish Process Pipeline</h3>
                            <p className="refurb-panel-subtitle">Standardized 4-step restoration protocol</p>

                            <div className="refurb-pipeline">
                                <div className="refurb-pipeline-item">
                                    <div className="refurb-pipeline-icon done">
                                        <FiCheck />
                                    </div>
                                    <div>
                                        <div className="refurb-pipeline-title">1. Intake & Inspection</div>
                                        <div className="refurb-pipeline-sub">Barcode logged & serialized</div>
                                    </div>
                                </div>

                                <div className="refurb-pipeline-item">
                                    <div className="refurb-pipeline-icon active">
                                        <FiTool />
                                    </div>
                                    <div>
                                        <div className="refurb-pipeline-title">2. Hardware Repair & Upgrade</div>
                                        <div className="refurb-pipeline-sub">SSD, RAM & Screen replacement</div>
                                    </div>
                                </div>

                                <div className="refurb-pipeline-item">
                                    <div className="refurb-pipeline-icon">
                                        <FiActivity />
                                    </div>
                                    <div>
                                        <div className="refurb-pipeline-title">3. QC Stress & Battery Test</div>
                                        <div className="refurb-pipeline-sub">Full hardware stress benchmark</div>
                                    </div>
                                </div>

                                <div className="refurb-pipeline-item">
                                    <div className="refurb-pipeline-icon">
                                        <FiShield />
                                    </div>
                                    <div>
                                        <div className="refurb-pipeline-title">4. Warranty & Certification</div>
                                        <div className="refurb-pipeline-sub">Passed & ready for second life</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Diagnostics Details Modal */}
            {selectedDevice && (
                <div className="refurb-modal-overlay">
                    <div className="refurb-modal-card">
                        <div className="refurb-modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                <FiCpu style={{ fontSize: "1.3rem" }} />
                                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Diagnostics #DEV-{selectedDevice.id}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedDevice(null)}
                                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#ffffff", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="refurb-modal-body">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
                                <div>
                                    <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Assigned Lead Technician</span>
                                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>{selectedDevice.technician}</div>
                                </div>
                                {getStageBadge(selectedDevice.stage)}
                            </div>

                            <div style={{ display: "grid", gap: "1rem" }}>
                                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Item Name & Spec</div>
                                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", marginTop: "0.2rem" }}>{selectedDevice.deviceName}</div>
                                    <div style={{ fontSize: "0.8rem", color: "#7c3aed", fontWeight: 600, marginTop: "0.2rem" }}>Category: {selectedDevice.category}</div>
                                </div>

                                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Hardware Defect & Diagnostic Note</div>
                                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1e293b", marginTop: "0.25rem" }}>{selectedDevice.condition}</div>
                                    <div style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 600, marginTop: "0.2rem" }}>Replacement Parts Required: {selectedDevice.partsNeeded}</div>
                                </div>

                                <div style={{ background: "#f5f3ff", padding: "1rem", borderRadius: "12px", border: "1px solid #ddd6fe" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#6d28d9", fontWeight: 700, textTransform: "uppercase" }}>QC Score & Certification Status</div>
                                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "#5b21b6", marginTop: "0.2rem" }}>{selectedDevice.qcScore}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                            {selectedDevice.stage === "Diagnosis" ? (
                                <button
                                    className="refurb-action-btn primary"
                                    onClick={() => updateStage(selectedDevice.id, "Repairing")}
                                    style={{ padding: "0.6rem 1.25rem", width: "100%", justifyContent: "center" }}
                                >
                                    <FiTool /> Move to Hardware Repair Bench
                                </button>
                            ) : selectedDevice.stage === "Repairing" ? (
                                <button
                                    className="refurb-action-btn primary"
                                    onClick={() => updateStage(selectedDevice.id, "QC Testing")}
                                    style={{ padding: "0.6rem 1.25rem", width: "100%", justifyContent: "center" }}
                                >
                                    <FiActivity /> Submit for QC Stress Testing
                                </button>
                            ) : selectedDevice.stage === "QC Testing" ? (
                                <button
                                    className="refurb-action-btn success"
                                    onClick={() => updateStage(selectedDevice.id, "Certified Ready")}
                                    style={{ padding: "0.6rem 1.25rem", width: "100%", justifyContent: "center" }}
                                >
                                    <FiCheckSquare /> Issue Certified Refurbished Badge
                                </button>
                            ) : (
                                <div style={{ textAlign: "center", fontSize: "0.85rem", color: "#047857", fontWeight: 700 }}>
                                    ✓ Certified Refurbished Unit Ready for Market
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RefurbishmentCenterDashboard;