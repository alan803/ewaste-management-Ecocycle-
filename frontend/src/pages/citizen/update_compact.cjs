const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/ASUS/ewaste-management/frontend/src/pages/citizen/Add_device.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `{/* Hero Welcome & Device Registration Banner */}
                <div className="citizen-hero-card" style={{ marginBottom: "1.75rem" }}>
                    <div className="citizen-hero-main">
                        <div className="citizen-hero-badge">
                            <FiShield /> EcoCycle Circular Portal • Zero-Landfill Verified
                        </div>
                        <h1 className="citizen-hero-title">
                            Post E-Waste <span style={{ color: "#059669" }}>Device</span>
                        </h1>
                        <p className="citizen-hero-sub">
                            Register your surplus, broken, or end-of-life electronics for free doorstep collection, certified data erasure &amp; green recovery. Turn your unused electronics into eco impact or cashback valuation.
                        </p>

                        <div className="citizen-hero-metrics">
                            <div className="hero-metric-item">
                                <FiTruck className="hero-metric-icon" />
                                <div className="hero-metric-text">
                                    <span className="hero-metric-val">100% Free</span>
                                    <span className="hero-metric-lbl">Doorstep Pickup</span>
                                </div>
                            </div>
                            <div className="hero-metric-item">
                                <FiShield className="hero-metric-icon" style={{ color: "#059669" }} />
                                <div className="hero-metric-text">
                                    <span className="hero-metric-val">NIST SP 800-88</span>
                                    <span className="hero-metric-lbl">Data Sanitization</span>
                                </div>
                            </div>
                            <div className="hero-metric-item">
                                <FiAward className="hero-metric-icon" style={{ color: "#7c3aed" }} />
                                <div className="hero-metric-text">
                                    <span className="hero-metric-val">Green Certificate</span>
                                    <span className="hero-metric-lbl">Verified Processing</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="citizen-hero-actions">
                        <div className="btn-hero-secondary-group">
                            <Link to="/view-device" className="btn-hero-secondary">
                                <FiBox /> View Devices
                            </Link>
                            <Link to="/citizen/certificates" className="btn-hero-secondary">
                                <FiAward /> Certificates
                            </Link>
                        </div>
                    </div>
                </div>`;

const replacementStr = `{/* Compact Hero Banner */}
                <div className="add-device-compact-hero">
                    <div className="add-device-hero-left">
                        <div className="citizen-hero-badge" style={{ marginBottom: "0.25rem", fontSize: "0.72rem" }}>
                            <FiShield /> EcoCycle Circular Portal • Zero-Landfill Verified
                        </div>
                        <h1 className="add-device-main-title" style={{ fontSize: "1.45rem", marginBottom: "0.25rem" }}>
                            Post E-Waste <span style={{ color: "#059669" }}>Device</span>
                        </h1>
                        <p style={{ color: "#64748b", fontSize: "0.825rem", margin: 0, lineHeight: 1.4 }}>
                            Register hardware for free doorstep pickup, certified data erasure &amp; green recovery.
                        </p>
                    </div>

                    <div className="citizen-hero-metrics" style={{ marginTop: 0, gap: "0.75rem" }}>
                        <div className="hero-metric-item" style={{ padding: "0.35rem 0.75rem" }}>
                            <FiTruck className="hero-metric-icon" style={{ fontSize: "0.95rem" }} />
                            <div className="hero-metric-text">
                                <span className="hero-metric-val" style={{ fontSize: "0.85rem" }}>100% Free</span>
                                <span className="hero-metric-lbl" style={{ fontSize: "0.65rem" }}>Doorstep Pickup</span>
                            </div>
                        </div>
                        <div className="hero-metric-item" style={{ padding: "0.35rem 0.75rem" }}>
                            <FiShield className="hero-metric-icon" style={{ color: "#059669", fontSize: "0.95rem" }} />
                            <div className="hero-metric-text">
                                <span className="hero-metric-val" style={{ fontSize: "0.85rem" }}>NIST SP 800-88</span>
                                <span className="hero-metric-lbl" style={{ fontSize: "0.65rem" }}>Data Sanitization</span>
                            </div>
                        </div>
                        <div className="hero-metric-item" style={{ padding: "0.35rem 0.75rem" }}>
                            <FiAward className="hero-metric-icon" style={{ color: "#7c3aed", fontSize: "0.95rem" }} />
                            <div className="hero-metric-text">
                                <span className="hero-metric-val" style={{ fontSize: "0.85rem" }}>Green Certificate</span>
                                <span className="hero-metric-lbl" style={{ fontSize: "0.65rem" }}>Verified Processing</span>
                            </div>
                        </div>
                    </div>
                </div>`;

const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = targetStr.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
    const updated = normalizedContent.replace(normalizedTarget, replacementStr);
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log('Successfully updated Add_device.jsx with compact hero card without buttons!');
} else {
    console.log('Target string not found.');
}
