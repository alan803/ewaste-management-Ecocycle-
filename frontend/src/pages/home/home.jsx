import { useEffect, useRef, useState } from "react";
import { enableNotifications } from "../../services/notificationService";
import Navbar from "../../components/navbar/Navbar";
import {
    FiArrowRight,
    FiCheckCircle,
    FiShield,
    FiTruck,
    FiRefreshCw,
    FiAward,
    FiLayers,
    FiFileText,
    FiMail,
    FiUser,
    FiMessageSquare,
    FiCpu,
    FiSmartphone,
    FiActivity,
    FiSend,
    FiChevronRight
} from "react-icons/fi";
import "./home.css";

const STATS = [
    {
        value: "50K+",
        label: "Devices Recycled Annually",
        subtext: "Diverted from toxic landfills"
    },
    {
        value: "120+",
        label: "Certified Collection Hubs",
        subtext: "Nationwide pickup network"
    },
    {
        value: "98%",
        label: "Material Recovery Rate",
        subtext: "Closed-loop circular processing"
    },
    {
        value: "24/7",
        label: "Pickup Scheduling",
        subtext: "Real-time dispatch support"
    }
];

const MATERIALS = [
    {
        swatch: "swatch-copper",
        name: "Copper & Precious Metals",
        pct: "12%",
        desc: "Recovered from high-density circuit boards, wiring, and high-frequency connectors for new electronics.",
        icon: <FiCpu />
    },
    {
        swatch: "swatch-gold",
        name: "Gold & Silver",
        pct: "0.2%",
        desc: "Extracted through zero-emission refined smelting processes with strictly zero environmental impact.",
        icon: <FiAward />
    },
    {
        swatch: "swatch-aluminum",
        name: "Aluminum & Steel",
        pct: "28%",
        desc: "Shredded and sorted for high-purity remelting — one of the highest-yield recyclable metal fractions.",
        icon: <FiLayers />
    },
    {
        swatch: "swatch-glass",
        name: "Glass & LCD Panels",
        pct: "18%",
        desc: "Safely processed under negative pressure to prevent mercury and lead from contaminating ecosystems.",
        icon: <FiSmartphone />
    },
    {
        swatch: "swatch-plastic",
        name: "Plastics & Polymers",
        pct: "22%",
        desc: "Separated by resin grade and pelletized for circular manufacturing of non-food-grade tech enclosures.",
        icon: <FiRefreshCw />
    },
    {
        swatch: "swatch-other",
        name: "Rare-Earth & Lithium",
        pct: "19%",
        desc: "Lithium batteries, capacitors, and rare-earth magnets handled under ISO 14001 environmental compliance.",
        icon: <FiActivity />
    }
];

const PROCESS_STEPS = [
    {
        step: "01",
        title: "Register Your Device",
        desc: "Create a free citizen account, list device specifications, upload photos, and choose compensation or donation.",
        icon: <FiSmartphone />
    },
    {
        step: "02",
        title: "Pickup & Collection",
        desc: "A verified collection agent receives your request, picks up items from your doorstep, and transports them safely.",
        icon: <FiTruck />
    },
    {
        step: "03",
        title: "Inspection & Evaluation",
        desc: "Certified technicians perform diagnostics to determine repairability, reusable parts, or raw material recycling.",
        icon: <FiCpu />
    },
    {
        step: "04",
        title: "Valuation & Approval",
        desc: "Receive a transparent market valuation report. Review the compensation offer and approve processing with one click.",
        icon: <FiCheckCircle />
    },
    {
        step: "05",
        title: "Refurbishment or Recycling",
        desc: "Workable devices are restored for secondary life while non-repairable units undergo zero-landfill material extraction.",
        icon: <FiRefreshCw />
    },
    {
        step: "06",
        title: "Certificate & Rewards",
        desc: "Receive instant payout/eco-points and download an official digital Green Disposal Certificate.",
        icon: <FiFileText />
    }
];

const SERVICES = [
    {
        title: "Residential Pickup",
        desc: "Schedule convenient home doorstep collection for your old electronics. Certified agents provide instant receipt digital tracking.",
        icon: <FiTruck />
    },
    {
        title: "Corporate E-Waste Management",
        desc: "Enterprise-grade disposal solutions for companies. Includes bulk pickup logistics, asset tags auditing, and legal compliance.",
        icon: <FiShield />
    },
    {
        title: "Device Refurbishment",
        desc: "Functional units undergo professional diagnostic repair and component restoration, dramatically extending product lifespans.",
        icon: <FiCpu />
    },
    {
        title: "NIST-Compliant Data Wiping",
        desc: "Cryptographic data erasure and physical storage drive shredding to guarantee 100% confidential data destruction.",
        icon: <FiFileText />
    },
    {
        title: "Green Disposal Certification",
        desc: "Official tamper-proof recycling certificates generated for all processed devices to verify environmental compliance.",
        icon: <FiAward />
    },
    {
        title: "Sustainability Consulting",
        desc: "Expert advisory for organizations on carbon footprint reduction, circular economy workflows, and ESG reporting.",
        icon: <FiActivity />
    }
];

function Home() {
    const statsRef = useRef(null);

    const [form_dta, set_form_dta] = useState({
        name: "",
        email: "",
        message: ""
    });

    const [error, set_error] = useState({
        name_er: "",
        email_er: "",
        message_er: ""
    });

    const [isSubmitted, setIsSubmitted] = useState(false);

    // Automatic notification permission
    useEffect(() => {
        const requestNotificationPermission = async () => {
            console.log("HOME LOADED");

            if (!("Notification" in window)) {
                console.log("This browser does not support notifications.");
                return;
            }

            console.log(
                "Notification permission:",
                Notification.permission
            );

            if (Notification.permission === "default") {
                try {
                    const permission =
                        await Notification.requestPermission();

                    console.log("Permission result:", permission);

                    if (permission === "granted") {
                        console.log("Notification permission granted.");

                        const token = await enableNotifications();

                        if (token) {
                            console.log("FCM Token:", token);
                        } else {
                            console.log("FCM Token was not generated.");
                        }
                    } else if (permission === "denied") {
                        console.log("Notification permission denied.");
                    }
                } catch (error) {
                    console.error("Permission error:", error);
                }
            } else if (Notification.permission === "granted") {
                console.log(
                    "Notification permission was already granted."
                );
            } else if (Notification.permission === "denied") {
                console.log(
                    "Notification permission was previously denied."
                );
            }
        };

        requestNotificationPermission();
    }, []);

    function handleInputChange(e) {
        const { name, value } = e.target;

        set_form_dta({
            ...form_dta,
            [name]: value
        });

        if (name === "name") {
            set_error(prev => ({
                ...prev,
                name_er: validate_name(value)
            }));
        }

        if (name === "email") {
            set_error(prev => ({
                ...prev,
                email_er: validate_email(value)
            }));
        }

        if (name === "message") {
            set_error(prev => ({
                ...prev,
                message_er: validate_message(value)
            }));
        }
    }

    function validate_name(value) {
        if (value === "") {
            return "Name is required";
        }

        if (value.length < 3) {
            return "Name must be at least 3 characters long";
        }

        if (!/^[a-zA-Z\s]+$/.test(value)) {
            return "Name must contain only letters and spaces";
        }

        return "";
    }

    function validate_email(value) {
        if (value === "") {
            return "Email is required";
        }

        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(value)) {
            return "Email must be a valid Gmail address";
        }

        return "";
    }

    function validate_message(value) {
        if (value === "") {
            return "Message is required";
        }

        if (value.length < 10) {
            return "Message must be at least 10 characters long";
        }

        return "";
    }

    // Stats animation
    useEffect(() => {
        const container = statsRef.current;

        if (!container) {
            return;
        }

        const items = container.querySelectorAll(".stat-card");

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("stat--visible");
                    }
                });
            },
            {
                threshold: 0.2
            }
        );

        items.forEach(item => {
            observer.observe(item);
        });

        return () => {
            observer.disconnect();
        };
    }, []);

    function validate_contact(e) {
        e.preventDefault();

        const nameErr = validate_name(form_dta.name);
        const emailErr = validate_email(form_dta.email);
        const msgErr = validate_message(form_dta.message);

        set_error({
            name_er: nameErr,
            email_er: emailErr,
            message_er: msgErr
        });

        if (!nameErr && !emailErr && !msgErr) {
            setIsSubmitted(true);

            setTimeout(() => {
                setIsSubmitted(false);
            }, 4000);

            set_form_dta({
                name: "",
                email: "",
                message: ""
            });
        }
    }

    return (
        <div className="home-wrapper">
            <Navbar />

            <main className="home" id="home">
                {/* HERO SECTION */}
                <section className="hero">
                    <div className="hero-glow-backdrop"></div>

                    <div className="hero-container">
                        <div className="hero-content">
                            <div className="hero-pill-badge">
                                <span className="pill-dot"></span>
                                <span className="pill-text">
                                    Zero-Landfill Circular E-Waste Platform
                                </span>
                            </div>

                            <h1 className="hero-title">
                                Empowering Sustainable <br />
                                <span className="gradient-text">
                                    Electronics Recycling
                                </span>
                            </h1>

                            <p className="hero-sub">
                                Responsibly dispose of outdated tech,
                                unlock financial valuation for functional
                                gear, and eliminate toxic electronic waste
                                — backed by certified recycling centers.
                            </p>

                            <div className="hero-actions">
                                <a
                                    href="/login"
                                    className="btn btn-primary btn-hero"
                                >
                                    Get Started Free
                                    <FiArrowRight className="btn-icon" />
                                </a>

                                <a
                                    href="#process"
                                    className="btn btn-ghost btn-hero"
                                >
                                    Explore Process
                                    <FiChevronRight className="btn-icon" />
                                </a>
                            </div>

                            <div className="hero-trust-badges">
                                <div className="trust-item">
                                    <FiCheckCircle className="trust-icon" />
                                    <span>ISO 14001 Certified</span>
                                </div>

                                <div className="trust-item">
                                    <FiShield className="trust-icon" />
                                    <span>NIST 800-88 Data Wiped</span>
                                </div>

                                <div className="trust-item">
                                    <FiAward className="trust-icon" />
                                    <span>Certified Green Recyclers</span>
                                </div>
                            </div>
                        </div>

                        {/* HERO DIAGRAM */}
                        <div
                            className="hero-visual"
                            aria-hidden="true"
                        >
                            <div className="diagram-card-glass">
                                <div className="diagram-header">
                                    <span className="diagram-title">
                                        E-WASTE MATERIAL BREAKDOWN
                                    </span>

                                    <span className="diagram-status">
                                        <span className="live-dot"></span>
                                        Real-time Recovery
                                    </span>
                                </div>

                                <svg
                                    className="exploded-diagram"
                                    viewBox="0 0 420 380"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <defs>
                                        <linearGradient
                                            id="partGrad"
                                            x1="0%"
                                            y1="0%"
                                            x2="100%"
                                            y2="100%"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#1e293b"
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#0f172a"
                                            />
                                        </linearGradient>

                                        <linearGradient
                                            id="glowGrad"
                                            x1="0%"
                                            y1="0%"
                                            x2="100%"
                                            y2="100%"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#10b981"
                                                stopOpacity="0.4"
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="#059669"
                                                stopOpacity="0"
                                            />
                                        </linearGradient>
                                    </defs>

                                    <rect
                                        className="device-part main-chassis"
                                        x="110"
                                        y="140"
                                        width="200"
                                        height="160"
                                        rx="12"
                                    />

                                    <rect
                                        className="device-part top-screen"
                                        x="130"
                                        y="30"
                                        width="160"
                                        height="90"
                                        rx="8"
                                    />

                                    <rect
                                        className="device-part battery-cell"
                                        x="145"
                                        y="315"
                                        width="130"
                                        height="35"
                                        rx="6"
                                    />

                                    <line
                                        className="trace pulsing-trace"
                                        x1="210"
                                        y1="120"
                                        x2="80"
                                        y2="180"
                                    />

                                    <line
                                        className="trace pulsing-trace"
                                        x1="210"
                                        y1="120"
                                        x2="340"
                                        y2="160"
                                    />

                                    <line
                                        className="trace pulsing-trace"
                                        x1="210"
                                        y1="300"
                                        x2="210"
                                        y2="350"
                                    />

                                    <line
                                        className="trace pulsing-trace"
                                        x1="210"
                                        y1="300"
                                        x2="60"
                                        y2="310"
                                    />

                                    <line
                                        className="trace pulsing-trace"
                                        x1="210"
                                        y1="300"
                                        x2="360"
                                        y2="300"
                                    />

                                    <g className="node node-copper">
                                        <circle
                                            cx="80"
                                            cy="180"
                                            r="22"
                                        />
                                        <text
                                            x="80"
                                            y="185"
                                            textAnchor="middle"
                                        >
                                            Cu
                                        </text>
                                        <text
                                            className="node-label"
                                            x="80"
                                            y="218"
                                            textAnchor="middle"
                                        >
                                            Copper
                                        </text>
                                    </g>

                                    <g className="node node-gold">
                                        <circle
                                            cx="340"
                                            cy="160"
                                            r="22"
                                        />
                                        <text
                                            x="340"
                                            y="165"
                                            textAnchor="middle"
                                        >
                                            Au
                                        </text>
                                        <text
                                            className="node-label"
                                            x="340"
                                            y="198"
                                            textAnchor="middle"
                                        >
                                            Gold
                                        </text>
                                    </g>

                                    <g className="node node-aluminum">
                                        <circle
                                            cx="60"
                                            cy="310"
                                            r="22"
                                        />
                                        <text
                                            x="60"
                                            y="315"
                                            textAnchor="middle"
                                        >
                                            Al
                                        </text>
                                        <text
                                            className="node-label"
                                            x="60"
                                            y="348"
                                            textAnchor="middle"
                                        >
                                            Aluminum
                                        </text>
                                    </g>

                                    <g className="node node-glass">
                                        <circle
                                            cx="360"
                                            cy="300"
                                            r="22"
                                        />
                                        <text
                                            x="360"
                                            y="305"
                                            textAnchor="middle"
                                        >
                                            Si
                                        </text>
                                        <text
                                            className="node-label"
                                            x="360"
                                            y="338"
                                            textAnchor="middle"
                                        >
                                            Glass
                                        </text>
                                    </g>

                                    <g className="node node-plastic">
                                        <circle
                                            cx="210"
                                            cy="350"
                                            r="22"
                                        />
                                        <text
                                            x="210"
                                            y="355"
                                            textAnchor="middle"
                                        >
                                            Li
                                        </text>
                                        <text
                                            className="node-label"
                                            x="210"
                                            y="378"
                                            textAnchor="middle"
                                        >
                                            Lithium
                                        </text>
                                    </g>
                                </svg>
                            </div>
                        </div>
                    </div>
                </section>

                {/* STATS SECTION */}
                <section
                    className="stats-section"
                    ref={statsRef}
                    aria-label="Impact statistics"
                >
                    <div className="stats-container">
                        {STATS.map(stat => (
                            <div
                                className="stat-card"
                                key={stat.label}
                            >
                                <div className="stat-num">
                                    {stat.value}
                                </div>

                                <div className="stat-label">
                                    {stat.label}
                                </div>

                                <div className="stat-subtext">
                                    {stat.subtext}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* MATERIALS RECOVERED */}
                <section
                    className="materials-section"
                    id="materials"
                >
                    <div className="container">
                        <div className="section-head">
                            <span className="eyebrow">
                                WHAT WE RECOVER
                            </span>

                            <h2>
                                Every Device Holds Valuable Resources
                            </h2>

                            <p>
                                Modern electronics contain precious
                                non-renewable elements. Our closed-loop
                                extraction isolate fractions for certified
                                eco-friendly manufacturing.
                            </p>
                        </div>

                        <div className="material-grid">
                            {MATERIALS.map(material => (
                                <article
                                    className="material-card"
                                    key={material.name}
                                >
                                    <div className="material-card-top">
                                        <div
                                            className={`material-swatch-badge ${material.swatch}`}
                                        >
                                            {material.icon}
                                        </div>

                                        <span className="material-pct-badge">
                                            {material.pct}
                                        </span>
                                    </div>

                                    <h3>{material.name}</h3>

                                    <p>{material.desc}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* WORKFLOW PROCESS SECTION */}
                <section
                    className="process-section"
                    id="process"
                >
                    <div className="container">
                        <div className="section-head">
                            <span className="eyebrow">
                                TRANSPARENT WORKFLOW
                            </span>

                            <h2>
                                How Our E-Waste Process Works
                            </h2>

                            <p>
                                A seamless, secure 6-step lifecycle ensuring
                                safe pickup, diagnostic evaluation, fair
                                market valuation, zero-waste recycling,
                                and digital certification.
                            </p>
                        </div>

                        <div className="process-grid">
                            {PROCESS_STEPS.map(p => (
                                <div
                                    className="process-card"
                                    key={p.step}
                                >
                                    <div className="process-card-header">
                                        <div className="process-step-pill">
                                            {p.step}
                                        </div>

                                        <div className="process-icon">
                                            {p.icon}
                                        </div>
                                    </div>

                                    <h3>{p.title}</h3>

                                    <p>{p.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ABOUT US SECTION */}
                <section
                    className="about-section"
                    id="about"
                >
                    <div className="container">
                        <div className="section-head">
                            <span className="eyebrow">
                                ABOUT ECOCYCLE
                            </span>

                            <h2>
                                Committed to a Cleaner Planet
                            </h2>

                            <p>
                                EcoCycle is a government-compliant,
                                ISO-certified e-waste management portal
                                uniting citizens, collection agents,
                                technicians, and recycling facilities.
                            </p>
                        </div>

                        <div className="about-grid">
                            <div className="about-card">
                                <div className="about-icon-box">
                                    <FiShield />
                                </div>

                                <h3>Our Mission</h3>

                                <p>
                                    To eliminate illegal electronic dumping
                                    through accessible, transparent
                                    recycling, reward incentives, and
                                    high-yield raw material recovery.
                                </p>
                            </div>

                            <div className="about-card">
                                <div className="about-icon-box">
                                    <FiRefreshCw />
                                </div>

                                <h3>Our Vision</h3>

                                <p>
                                    A world where 100% of discarded consumer
                                    and enterprise technology is safely
                                    refurbished or re-introduced into
                                    circular manufacturing loops.
                                </p>
                            </div>

                            <div className="about-card">
                                <div className="about-icon-box">
                                    <FiAward />
                                </div>

                                <h3>Certified Quality</h3>

                                <p>
                                    ISO 14001 & ISO 9001 certified handling
                                    standards ensuring 100% regulatory
                                    compliance, confidential data
                                    destruction, and zero landfill waste.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SERVICES SECTION */}
                <section
                    className="services-section"
                    id="services"
                >
                    <div className="container">
                        <div className="section-head">
                            <span className="eyebrow">
                                COMPREHENSIVE SOLUTIONS
                            </span>

                            <h2>
                                Tailored E-Waste Services
                            </h2>

                            <p>
                                From household single-item pickups to
                                enterprise bulk asset decommissioning,
                                we provide end-to-end eco solutions.
                            </p>
                        </div>

                        <div className="services-grid">
                            {SERVICES.map((s, idx) => (
                                <div
                                    className="service-card"
                                    key={idx}
                                >
                                    <div className="service-icon-wrapper">
                                        {s.icon}
                                    </div>

                                    <h3>{s.title}</h3>

                                    <p>{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CONTACT SECTION */}
                <section
                    className="contact-section"
                    id="contact"
                >
                    <div className="container">
                        <div className="section-head">
                            <span className="eyebrow">
                                GET IN TOUCH
                            </span>

                            <h2>
                                Have Questions? Contact Us
                            </h2>

                            <p>
                                Our environmental compliance specialists
                                and customer support team are here to help.
                            </p>
                        </div>

                        <div className="contact-form-card">
                            {isSubmitted ? (
                                <div className="contact-success-alert">
                                    <FiCheckCircle className="success-icon" />

                                    <h3>
                                        Thank you for reaching out!
                                    </h3>

                                    <p>
                                        Your message has been sent
                                        successfully. Our team will get
                                        back to you within 24 hours.
                                    </p>
                                </div>
                            ) : (
                                <form
                                    onSubmit={validate_contact}
                                    className="contact-form"
                                >
                                    <div className="form-group">
                                        <label htmlFor="name">
                                            <FiUser className="input-icon" />
                                            Full Name
                                        </label>

                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            placeholder="Enter your full name"
                                            value={form_dta.name}
                                            onChange={handleInputChange}
                                        />

                                        {error.name_er && (
                                            <span className="error-text">
                                                {error.name_er}
                                            </span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="email">
                                            <FiMail className="input-icon" />
                                            Gmail Address
                                        </label>

                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="yourname@gmail.com"
                                            value={form_dta.email}
                                            onChange={handleInputChange}
                                        />

                                        {error.email_er && (
                                            <span className="error-text">
                                                {error.email_er}
                                            </span>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="message">
                                            <FiMessageSquare className="input-icon" />
                                            Your Message
                                        </label>

                                        <textarea
                                            id="message"
                                            name="message"
                                            rows="4"
                                            placeholder="Tell us how we can assist you..."
                                            value={form_dta.message}
                                            onChange={handleInputChange}
                                        ></textarea>

                                        {error.message_er && (
                                            <span className="error-text">
                                                {error.message_er}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-submit"
                                    >
                                        Send Message
                                        <FiSend className="btn-icon" />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </section>

                {/* CTA SECTION */}
                <section className="cta-section">
                    <div className="container">
                        <div className="cta-card">
                            <span className="eyebrow eyebrow-light">
                                JOIN THE MOVEMENT
                            </span>

                            <h2>
                                Ready to Recycle Your E-Waste Responsibly?
                            </h2>

                            <p>
                                Join thousands of eco-conscious citizens
                                and enterprises turning electronic waste
                                into renewable value.
                            </p>

                            <div className="cta-actions">
                                <a
                                    href="/login"
                                    className="btn btn-primary btn-cta"
                                >
                                    Create Free Account
                                    <FiArrowRight className="btn-icon" />
                                </a>

                                <a
                                    href="/citizen/pickup"
                                    className="btn btn-outline-light btn-cta"
                                >
                                    Book Pickup Now
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Home;