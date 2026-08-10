import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
    FiRefreshCw,
    FiZap,
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
    FiUser,
    FiAlertTriangle
} from "react-icons/fi";
import "./Recyclingcenter_dashboard.css";

function RecyclingCenterDashboard() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [activeTab, setActiveTab] = useState("All");
    const [loading, setLoading] = useState(true);
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("No JWT token found, redirecting to login.");
            navigate("/");
            return;
        }
        fetchProfile(token);
        fetchRecyclingBatches(token);
    }, [navigate]);

    const fetchProfile = async (token) => {
        try {
            const response = await axios.get("https://localhost:7102/api/User/profile", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(response.data || {});
        } catch (err) {
            console.error("Error fetching recycling center profile:", err);
        }
    };

    const fetchRecyclingBatches = async (token) => {
        try {
            setLoading(true);
            const response = await axios.get("https://localhost:7102/api/RecyclingCenter/All", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data && response.data.length > 0) {
                const mapped = response.data.map((item, idx) => ({
                    id: item.recyclingCenterId || (idx + 401),
                    batchTitle: `${item.centerName || "Mixed E-Waste Batch"} #${idx + 1}`,
                    materialType: "Printed Circuit Boards & Cables",
                    weight: "140 kg",
                    operator: "Operator Marcus Vance",
                    stage: idx % 4 === 0 ? "Received" : idx % 4 === 1 ? "In Sorting" : idx % 4 === 2 ? "Smelting & Shredding" : "Certified Recycled",
                    recoveredMetals: "12 kg Copper, 4 kg Aluminum, 0.2 kg Gold",
                    hazardRisk: "Neutralized (Lead/Cadmium safe)"
                }));
                setBatches(mapped);
            } else {
                setBatches(defaultRecyclingBatches);
            }
        } catch (err) {
            setBatches(defaultRecyclingBatches);
        } finally {
            setLoading(false);
        }
    };

    const defaultRecyclingBatches = [
        {
            id: 401,
            batchTitle: "High-Grade Computer PCBs & RAM Modules",
            materialType: "Electronics Circuit Boards",
            weight: "185 kg",
            operator: "Operator Marcus Vance",
            stage: "Smelting & Shredding",
            recoveredMetals: "18.5 kg Copper, 6.2 kg Silver, 0.45 kg Gold",
            hazardRisk: "Contained (Lead Solder Isolated)"
        },
        {
            id: 402,
            batchTitle: "Li-Ion Laptop & Powerbank Batteries",
            materialType: "Lithium Power Cells",
            weight: "95 kg",
            operator: "Operator Elena Rostova",
            stage: "In Sorting",
            recoveredMetals: "22 kg Lithium, 8 kg Cobalt",
            hazardRisk: "Requires Fire-Proof Storage"
        },
        {
            id: 403,
            batchTitle: "CRT Monitors & Heavy Glass Assemblies",
            materialType: "Cathode Ray Tubes & Transformers",
            weight: "320 kg",
            operator: "Operator David Miller",
            stage: "Received",
            recoveredMetals: "45 kg Copper Coils, 120 kg Glass",
            hazardRisk: "High Lead Glass Content"
        },
        {
            id: 404,
            batchTitle: "Stripped Copper Wiring & Power Adapters",
            materialType: "Insulated Wire & Transformers",
            weight: "210 kg",
            operator: "Operator Marcus Vance",
            stage: "Certified Recycled",
            recoveredMetals: "98 kg High-Purity Copper, 30 kg Plastics",
            hazardRisk: "Non-Hazardous Cleaned"
        }
    ];

    const facilityName = profile?.firstName 
        ? `${profile.firstName} ${profile.lastName || ""}`.trim()
        : localStorage.getItem("firstName") || "GreenCycle Processing Plant";

    const updateStage = (batchId, newStage) => {
        setBatches(prev =>
            prev.map(b => (b.id === batchId ? { ...b, stage: newStage } : b))
        );
        if (selectedBatch && selectedBatch.id === batchId) {
            setSelectedBatch(prev => ({ ...prev, stage: newStage }));
        }
    };

    const filteredBatches = batches.filter(b => {
        if (activeTab === "All") return true;
        return b.stage === activeTab;
    });

    const getStageBadge = (stage) => {
        switch (stage) {
            case "Certified Recycled":
                return <span className="recyc-stage-badge certified"><FiCheckSquare /> Certified Recycled</span>;
            case "Smelting & Shredding":
                return <span className="recyc-stage-badge smelting"><FiZap /> Smelting & Shredding</span>;
            case "In Sorting":
                return <span className="recyc-stage-badge sorting"><FiRefreshCw /> In Sorting</span>;
            case "Received":
            default:
                return <span className="recyc-stage-badge received"><FiClock /> Received</span>;
        }
    };

    return (
        <div className="recyc-dashboard-layout">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Dashboard */}
            <main className="recyc-main-content">
                {/* Header Ribbon */}
                <div className="recyc-header-ribbon">
                    <div>
                        <h1 className="recyc-welcome-title">Welcome, {facilityName}!</h1>
                        <p className="recyc-welcome-sub">Plant ID: <strong>RECYC-HUB-4090</strong> • Zone: State E-Waste Recycling Depot</p>
                    </div>

                    <div className="recyc-header-actions">
                        <span style={{ background: "#f0fdfa", color: "#0f766e", padding: "0.4rem 0.85rem", borderRadius: "20px", fontWeight: 700, fontSize: "0.8rem" }}>
                            ● Plant Active (Shredder #02 Live)
                        </span>

                        <Link to="/manage-userprofile" className="recyc-profile-pill">
                            <div className="recyc-avatar">
                                {facilityName.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{facilityName}</span>
                                <span style={{ fontSize: "0.725rem", color: "#0d9488", fontWeight: 600 }}>Recycling Facility</span>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Metric Summary Cards Grid */}
                <div className="recyc-kpi-grid">
                    <div className="recyc-kpi-card">
                        <div className="recyc-kpi-top">
                            <div className="recyc-kpi-icon teal">
                                <FiRefreshCw />
                            </div>
                            <span className="recyc-kpi-badge">+180 kg Today</span>
                        </div>
                        <div>
                            <h3 className="recyc-kpi-val">1,420 kg</h3>
                            <div className="recyc-kpi-lbl">Total E-Waste Processed</div>
                        </div>
                    </div>

                    <div className="recyc-kpi-card">
                        <div className="recyc-kpi-top">
                            <div className="recyc-kpi-icon amber">
                                <FiAward />
                            </div>
                            <span className="recyc-kpi-badge">High Purity</span>
                        </div>
                        <div>
                            <h3 className="recyc-kpi-val">42.5 kg</h3>
                            <div className="recyc-kpi-lbl">Precious Metals Recovered</div>
                        </div>
                    </div>

                    <div className="recyc-kpi-card">
                        <div className="recyc-kpi-top">
                            <div className="recyc-kpi-icon rose">
                                <FiAlertTriangle />
                            </div>
                            <span className="recyc-kpi-badge" style={{ background: "#fff1f2", color: "#be123c" }}>100% Contained</span>
                        </div>
                        <div>
                            <h3 className="recyc-kpi-val">18.2 kg</h3>
                            <div className="recyc-kpi-lbl">Toxins Safely Neutralized</div>
                        </div>
                    </div>

                    <div className="recyc-kpi-card">
                        <div className="recyc-kpi-top">
                            <div className="recyc-kpi-icon emerald">
                                <FiShield />
                            </div>
                            <span className="recyc-kpi-badge" style={{ background: "#ecfdf5", color: "#047857" }}>Certified</span>
                        </div>
                        <div>
                            <h3 className="recyc-kpi-val">2.8 Tons</h3>
                            <div className="recyc-kpi-lbl">Carbon Offset Credit</div>
                        </div>
                    </div>
                </div>

                {/* 2-Column Dashboard Grid */}
                <div className="recyc-grid-layout">
                    {/* Left Column (Inbound E-Waste Batches Table) */}
                    <div>
                        <div className="recyc-panel-card">
                            <div className="recyc-panel-header">
                                <div>
                                    <h2 className="recyc-panel-title">Inbound E-Waste Processing Queue</h2>
                                    <p className="recyc-panel-subtitle">Sort material batches, operate shredding/smelting, and issue green recycling certificates</p>
                                </div>

                                <div className="recyc-tab-pills">
                                    {["All", "Received", "In Sorting", "Smelting & Shredding", "Certified Recycled"].map((tab) => (
                                        <button
                                            key={tab}
                                            className={`recyc-tab-btn ${activeTab === tab ? "active" : ""}`}
                                            onClick={() => setActiveTab(tab)}
                                        >
                                            {tab} ({tab === "All" ? batches.length : batches.filter(b => b.stage === tab).length})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="recyc-table-wrapper">
                                {loading ? (
                                    <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                                        Loading recycling queue...
                                    </div>
                                ) : filteredBatches.length === 0 ? (
                                    <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", color: "#64748b" }}>
                                        <FiBox style={{ fontSize: "2rem", color: "#94a3b8", marginBottom: "0.5rem" }} />
                                        <p style={{ margin: 0, fontWeight: 600 }}>No material batches in stage "{activeTab}".</p>
                                    </div>
                                ) : (
                                    <table className="recyc-table">
                                        <thead>
                                            <tr>
                                                <th>Batch Tag</th>
                                                <th>Material Title & Type</th>
                                                <th>Weight & Toxins</th>
                                                <th>Operator</th>
                                                <th>Processing Stage</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredBatches.map((batch) => (
                                                <tr key={batch.id}>
                                                    <td>
                                                        <span style={{ fontFamily: "monospace", fontWeight: 700, background: "#f1f5f9", padding: "0.25rem 0.6rem", borderRadius: "6px", color: "#0f172a" }}>
                                                            #BATCH-{batch.id}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{batch.batchTitle}</div>
                                                        <div style={{ fontSize: "0.75rem", color: "#0d9488", fontWeight: 600 }}>{batch.materialType}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, color: "#334155" }}>{batch.weight} Gross</div>
                                                        <div style={{ fontSize: "0.725rem", color: "#64748b" }}>{batch.hazardRisk}</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#0f172a" }}>{batch.operator}</div>
                                                    </td>
                                                    <td>{getStageBadge(batch.stage)}</td>
                                                    <td>
                                                        <div style={{ display: "flex", gap: "0.4rem" }}>
                                                            {batch.stage === "Received" && (
                                                                <button
                                                                    className="recyc-action-btn primary"
                                                                    onClick={() => updateStage(batch.id, "In Sorting")}
                                                                    title="Begin Material Sorting"
                                                                >
                                                                    <FiRefreshCw /> Start Sorting
                                                                </button>
                                                            )}
                                                            {batch.stage === "In Sorting" && (
                                                                <button
                                                                    className="recyc-action-btn primary"
                                                                    onClick={() => updateStage(batch.id, "Smelting & Shredding")}
                                                                    title="Send to Shredding Line"
                                                                >
                                                                    <FiZap /> Shred & Smelt
                                                                </button>
                                                            )}
                                                            {batch.stage === "Smelting & Shredding" && (
                                                                <button
                                                                    className="recyc-action-btn success"
                                                                    onClick={() => updateStage(batch.id, "Certified Recycled")}
                                                                    title="Issue Green Recycling Certificate"
                                                                >
                                                                    <FiCheckSquare /> Issue Green Cert
                                                                </button>
                                                            )}
                                                            <button
                                                                className="recyc-action-btn"
                                                                onClick={() => setSelectedBatch(batch)}
                                                                title="View Yield Breakdown"
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

                    {/* Right Side Panel: Material Yield Breakdown & Pipeline */}
                    <div>
                        <div className="recyc-panel-card">
                            <h3 className="recyc-panel-title">Green Recycling Protocol</h3>
                            <p className="recyc-panel-subtitle">Zero-landfill eco processing steps</p>

                            <div className="recyc-pipeline">
                                <div className="recyc-pipeline-item">
                                    <div className="recyc-pipeline-icon done">
                                        <FiCheck />
                                    </div>
                                    <div>
                                        <div className="recyc-pipeline-title">1. Decontamination</div>
                                        <div className="recyc-pipeline-sub">Lithium & Mercury safely extracted</div>
                                    </div>
                                </div>

                                <div className="recyc-pipeline-item">
                                    <div className="recyc-pipeline-icon active">
                                        <FiRefreshCw />
                                    </div>
                                    <div>
                                        <div className="recyc-pipeline-title">2. Mechanical Shredding</div>
                                        <div className="recyc-pipeline-sub">PCB & wire granulator active</div>
                                    </div>
                                </div>

                                <div className="recyc-pipeline-item">
                                    <div className="recyc-pipeline-icon">
                                        <FiZap />
                                    </div>
                                    <div>
                                        <div className="recyc-pipeline-title">3. Precious Metal Refining</div>
                                        <div className="recyc-pipeline-sub">Gold, Copper & Silver extraction</div>
                                    </div>
                                </div>

                                <div className="recyc-pipeline-item">
                                    <div className="recyc-pipeline-icon">
                                        <FiShield />
                                    </div>
                                    <div>
                                        <div className="recyc-pipeline-title">4. Green Audit Certificate</div>
                                        <div className="recyc-pipeline-sub">EPA compliant recycling certificate</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Batch Details Modal */}
            {selectedBatch && (
                <div className="recyc-modal-overlay">
                    <div className="recyc-modal-card">
                        <div className="recyc-modal-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                <FiRefreshCw style={{ fontSize: "1.3rem" }} />
                                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Batch #BATCH-{selectedBatch.id}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedBatch(null)}
                                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#ffffff", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="recyc-modal-body">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
                                <div>
                                    <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Assigned Plant Operator</span>
                                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>{selectedBatch.operator}</div>
                                </div>
                                {getStageBadge(selectedBatch.stage)}
                            </div>

                            <div style={{ display: "grid", gap: "1rem" }}>
                                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Material Batch Name</div>
                                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", marginTop: "0.2rem" }}>{selectedBatch.batchTitle}</div>
                                    <div style={{ fontSize: "0.8rem", color: "#0d9488", fontWeight: 600, marginTop: "0.2rem" }}>Material: {selectedBatch.materialType} • Weight: {selectedBatch.weight}</div>
                                </div>

                                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Hazardous Toxins Assessment</div>
                                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#be123c", marginTop: "0.25rem" }}>{selectedBatch.hazardRisk}</div>
                                </div>

                                <div style={{ background: "#f0fdfa", padding: "1rem", borderRadius: "12px", border: "1px solid #99f6e4" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#0f766e", fontWeight: 700, textTransform: "uppercase" }}>Recovered Precious Metal Yield</div>
                                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#115e59", marginTop: "0.2rem" }}>{selectedBatch.recoveredMetals}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                            {selectedBatch.stage === "Received" ? (
                                <button
                                    className="recyc-action-btn primary"
                                    onClick={() => updateStage(selectedBatch.id, "In Sorting")}
                                    style={{ padding: "0.6rem 1.25rem", width: "100%", justifyContent: "center" }}
                                >
                                    <FiRefreshCw /> Move to Mechanical Sorting Line
                                </button>
                            ) : selectedBatch.stage === "In Sorting" ? (
                                <button
                                    className="recyc-action-btn primary"
                                    onClick={() => updateStage(selectedBatch.id, "Smelting & Shredding")}
                                    style={{ padding: "0.6rem 1.25rem", width: "100%", justifyContent: "center" }}
                                >
                                    <FiZap /> Start Granulation & Metal Refining
                                </button>
                            ) : selectedBatch.stage === "Smelting & Shredding" ? (
                                <button
                                    className="recyc-action-btn success"
                                    onClick={() => updateStage(selectedBatch.id, "Certified Recycled")}
                                    style={{ padding: "0.6rem 1.25rem", width: "100%", justifyContent: "center" }}
                                >
                                    <FiCheckSquare /> Issue Green Recycling Certificate
                                </button>
                            ) : (
                                <div style={{ textAlign: "center", fontSize: "0.85rem", color: "#047857", fontWeight: 700 }}>
                                    ✓ Zero-Landfill Green Certificate Issued
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RecyclingCenterDashboard;