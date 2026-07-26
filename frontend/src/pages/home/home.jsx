import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/navbar/Navbar";
import "./home.css";

const STATS = [
    { value: "50K+", label: "Devices recycled annually" },
    { value: "120+", label: "Certified collection centers" },
    { value: "98%", label: "Material recovery rate" },
    { value: "24/7", label: "Pickup scheduling support" },
];

const MATERIALS = [
    {
        swatch: "swatch-copper",
        name: "Copper & Precious Metals",
        pct: "12%",
        desc: "Recovered from circuit boards, wiring, and connectors for reuse in new electronics.",
    },
    {
        swatch: "swatch-gold",
        name: "Gold & Silver",
        pct: "0.2%",
        desc: "Extracted through refined smelting processes with minimal environmental impact.",
    },
    {
        swatch: "swatch-aluminum",
        name: "Aluminum & Steel",
        pct: "28%",
        desc: "Shredded and sorted for remelting — one of the highest-yield recyclable fractions.",
    },
    {
        swatch: "swatch-glass",
        name: "Glass & LCD Panels",
        pct: "18%",
        desc: "Safely processed to prevent mercury and lead from entering landfills.",
    },
    {
        swatch: "swatch-plastic",
        name: "Plastics & Polymers",
        pct: "22%",
        desc: "Separated by resin type and pelletized for use in non-food-grade products.",
    },
    {
        swatch: "swatch-other",
        name: "Other Components",
        pct: "19%",
        desc: "Batteries, capacitors, and rare-earth elements handled under strict compliance.",
    },
];

function Home() {
    const statsRef = useRef(null);
    const[form_dta,set_form_dta]=useState({
        name: "",
        email: "",
        message: ""
    });
    const[error,set_error]=useState({
        name_er:"",
        email_er:"",
        message_er:""
    });
    function handleInputChange(e)
    {
        const{name,value}=e.target;
        set_form_dta({
            ...form_dta,
            [name]:value
        });
        if(name==="name")
        {
            set_error({
                ...error,
                name_er:validate_name(value)
            });
        }
        if(name==="email")
        {
            set_error({
                ...error,
                email_er:validate_email(value)
            });
        }
        if(name==="message")
        {
            set_error({
                ...error,
                message_er:validate_message(value)
            });
        }
    }
    function validate_name(value)
    {
        if(value==="")
        {
            return "Name is required"
        }
        else if(value.length<3)
        {
            return "Name must be at least 3 characters long"
        }
        else if(!/^[a-zA-Z\s]+$/.test(value))
        {
            return "Name must contain only letters and spaces"
        }
        return ""
    }
    function validate_email(value)
    {
        if(value==="")
        {
            return "Email is required"
        }
        else if(!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(value))
        {
            return "Email must be a valid Gmail address"
        }
        return ""
    }
    function validate_message(value)
    {
        if(value==="")
        {
            return "Message is required"
        }
        else if(value.length<10)
        {
            return "Message must be at least 10 characters long"
        }
        return ""
    }
    useEffect(() => {
        const container = statsRef.current;
        if (!container) return;

        const items = container.querySelectorAll(".stat");
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("stat--visible");
                    }
                });
            },
            { threshold: 0.3 }
        );

        items.forEach((item) => observer.observe(item));
        return () => observer.disconnect();
    }, []);
    function validate_contact(e)
    {
        e.preventDefault();
    }
    return (
        <>
            <Navbar />

            <main className="home" id="home">
                <section className="hero">
                    <div className="hero-content">
                        <span className="eyebrow">Sustainable Electronics</span>
                        <h1>E-Waste Management System</h1>
                        <p className="hero-sub">
                            Responsibly recycle outdated electronics, recover valuable materials,
                            and keep hazardous waste out of landfills — all through one
                            certified platform.
                        </p>
                        <div className="hero-actions">
                            <a href="/services" className="btn btn-primary">
                                Schedule Pickup
                            </a>
                            <a href="/about" className="btn btn-ghost">
                                How It Works
                            </a>
                        </div>
                    </div>

                    <div className="hero-visual" aria-hidden="true">
                        <svg
                            className="exploded-diagram"
                            viewBox="0 0 420 380"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <rect
                                className="device-part"
                                x="130"
                                y="40"
                                width="160"
                                height="100"
                                rx="8"
                            />
                            <rect
                                className="device-part"
                                x="110"
                                y="160"
                                width="200"
                                height="140"
                                rx="10"
                            />
                            <rect
                                className="device-part"
                                x="145"
                                y="310"
                                width="130"
                                height="40"
                                rx="6"
                            />

                            <line className="trace" x1="210" y1="140" x2="80" y2="200" />
                            <line className="trace" x1="210" y1="140" x2="340" y2="180" />
                            <line className="trace" x1="210" y1="300" x2="210" y2="350" />
                            <line className="trace" x1="210" y1="300" x2="60" y2="320" />
                            <line className="trace" x1="210" y1="300" x2="360" y2="310" />

                            <g className="node node-copper">
                                <circle cx="80" cy="200" r="22" />
                                <text x="80" y="205" textAnchor="middle">
                                    Cu
                                </text>
                                <text className="node-label" x="80" y="240" textAnchor="middle">
                                    Copper
                                </text>
                            </g>

                            <g className="node node-gold">
                                <circle cx="340" cy="180" r="22" />
                                <text x="340" y="185" textAnchor="middle">
                                    Au
                                </text>
                                <text className="node-label" x="340" y="220" textAnchor="middle">
                                    Gold
                                </text>
                            </g>

                            <g className="node node-aluminum">
                                <circle cx="60" cy="320" r="22" />
                                <text x="60" y="325" textAnchor="middle">
                                    Al
                                </text>
                                <text className="node-label" x="60" y="360" textAnchor="middle">
                                    Aluminum
                                </text>
                            </g>

                            <g className="node node-glass">
                                <circle cx="360" cy="310" r="22" />
                                <text x="360" y="315" textAnchor="middle">
                                    Si
                                </text>
                                <text className="node-label" x="360" y="350" textAnchor="middle">
                                    Glass
                                </text>
                            </g>

                            <g className="node node-plastic">
                                <circle cx="210" cy="350" r="22" />
                                <text x="210" y="355" textAnchor="middle">
                                    PP
                                </text>
                                <text className="node-label" x="210" y="378" textAnchor="middle">
                                    Plastic
                                </text>
                            </g>
                        </svg>
                    </div>
                </section>

                <section className="stats" ref={statsRef} aria-label="Impact statistics">
                    {STATS.map((stat) => (
                        <div className="stat" key={stat.label}>
                            <span className="stat-num">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    ))}
                </section>

                <section className="materials">
                    <div className="section-head">
                        <span className="eyebrow">What We Recover</span>
                        <h2>Every device contains recoverable value</h2>
                        <p>
                            Modern electronics are packed with metals and minerals. Our
                            process isolates each fraction for safe, certified reuse.
                        </p>
                    </div>

                    <div className="material-grid">
                        {MATERIALS.map((material) => (
                            <article className="material-card" key={material.name}>
                                <span className={`material-swatch ${material.swatch}`} />
                                <span className="material-pct">{material.pct}</span>
                                <h3>{material.name}</h3>
                                <p>{material.desc}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="process">

    <div className="section-head">
        <span className="eyebrow">WORKFLOW</span>
        <h2>How Our E-Waste Recycling Process Works</h2>

        <p>
            A simple, transparent, and secure six-step workflow that ensures
            responsible collection, inspection, valuation, recycling, and
            certification of electronic waste.
        </p>
    </div>

    <div className="process-list">

        <div className="process-card">
            <div className="process-step">01</div>

            <h3>Register Your Device</h3>

            <p>
                Create an account, enter your device details, upload photos,
                choose your compensation option, and schedule a pickup.
            </p>
        </div>

        <div className="process-card">
            <div className="process-step">02</div>

            <h3>Pickup & Collection</h3>

            <p>
                A certified collection agent receives your request,
                collects the electronic device safely, and transports it
                to our inspection centre.
            </p>
        </div>

        <div className="process-card">
            <div className="process-step">03</div>

            <h3>Inspection & Evaluation</h3>

            <p>
                Expert technicians inspect the device, evaluate its
                condition, estimate repair cost, and decide whether it
                should be refurbished or recycled.
            </p>
        </div>

        <div className="process-card">
            <div className="process-step">04</div>

            <h3>Valuation & Approval</h3>

            <p>
                If you selected valuation, an estimated value is generated.
                You may accept or reject the offer before processing begins.
            </p>
        </div>

        <div className="process-card">
            <div className="process-step">05</div>

            <h3>Refurbishment or Recycling</h3>

            <p>
                Repairable devices are refurbished for reuse while
                non-repairable devices are dismantled to recover valuable
                recyclable materials responsibly.
            </p>
        </div>

        <div className="process-card">
            <div className="process-step">06</div>

            <h3>Certificate & Completion</h3>

            <p>
                After successful processing, users receive payment
                (if applicable) and can download an official digital
                recycling certificate.
            </p>
        </div>

    </div>

</section>

                <section className="about" id="about">
                    <div className="section-head">
                        <span className="eyebrow">About Us</span>
                        <h2>Committed to a Greener Tomorrow</h2>
                        <p>
                            We are a certified e-waste management platform dedicated to
                            responsible electronics recycling, environmental protection, and
                            sustainable resource recovery.
                        </p>
                    </div>

                    <div className="about-grid">
                        <div className="about-card">
                            <h3>Our Mission</h3>
                            <p>
                                To provide accessible, certified e-waste recycling services that
                                protect the environment, recover valuable materials, and promote
                                circular economy principles.
                            </p>
                        </div>

                        <div className="about-card">
                            <h3>Our Vision</h3>
                            <p>
                                A world where electronic waste is eliminated through responsible
                                recycling, refurbishment, and sustainable consumption practices.
                            </p>
                        </div>

                        <div className="about-card">
                            <h3>Certified Excellence</h3>
                            <p>
                                ISO 14001 certified and compliant with all environmental regulations,
                                ensuring safe handling and processing of electronic waste.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="services" id="services">
                    <div className="section-head">
                        <span className="eyebrow">Our Services</span>
                        <h2>Comprehensive E-Waste Solutions</h2>
                        <p>
                            From residential pickups to enterprise recycling programs, we offer
                            tailored solutions for all your electronic waste management needs.
                        </p>
                    </div>

                    <div className="services-grid">
                        <div className="service-card">
                            <h3>Residential Pickup</h3>
                            <p>
                                Schedule convenient home pickups for your old electronics. Our
                                certified agents collect devices safely and provide documentation.
                            </p>
                        </div>

                        <div className="service-card">
                            <h3>Business Recycling</h3>
                            <p>
                                Enterprise-grade e-waste management for companies. Bulk pickups,
                                data destruction, and compliance reporting included.
                            </p>
                        </div>

                        <div className="service-card">
                            <h3>Device Refurbishment</h3>
                            <p>
                                Functional devices are professionally refurbished and resold,
                                extending product lifecycle and reducing environmental impact.
                            </p>
                        </div>

                        <div className="service-card">
                            <h3>Data Destruction</h3>
                            <p>
                                Secure data wiping and physical destruction of storage devices
                                following industry standards to protect your information.
                            </p>
                        </div>

                        <div className="service-card">
                            <h3>Certification</h3>
                            <p>
                                Official recycling certificates for all processed items,
                                providing proof of responsible disposal for compliance.
                            </p>
                        </div>

                        <div className="service-card">
                            <h3>Consulting Services</h3>
                            <p>
                                Expert guidance on e-waste management strategies, regulatory
                                compliance, and sustainability reporting for organizations.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="contact" id="contact">
                    <div className="section-head">
                        <span className="eyebrow">Contact Us</span>
                        <h2>Get in Touch</h2>
                        <p>
                            Have questions about our services or need assistance with your
                            e-waste? Our team is here to help.
                        </p>
                    </div>

                    <div className="contact-form-wrapper">
                        <div className="contact-form">
                            <form onSubmit={validate_contact}>
                                <div className="form-group">
                                    <label htmlFor="name">Name</label>
                                    <input 
                                        type="text" 
                                        id="name" 
                                        name="name" 
                                        placeholder="Your full name" 
                                        onChange={handleInputChange}
                                    />
                                    <div className="error-message">
                                        {error.name_er}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input 
                                        type="email" 
                                        id="email" 
                                        name="email" 
                                        placeholder="your@email.com" 
                                        required 
                                        onChange={handleInputChange}
                                    />
                                    <div className="error-message">
                                        {error.email_er}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message">Message</label>
                                    <textarea 
                                        id="message" 
                                        name="message" 
                                        rows="5" 
                                        placeholder="How can we help you today?"
                                        required
                                        onChange={handleInputChange}
                                    ></textarea>
                                    <div className="error-message">
                                        {error.message_er}
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary">
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </section>

                <section className="cta-band">
                    <span className="eyebrow">Get Started</span>
                    <h2>Ready to dispose of your e-waste responsibly?</h2>
                    <p>
                        Join thousands of households and businesses already using our
                        platform to recycle electronics the right way.
                    </p>
                    <a href="/login" className="btn btn-primary btn-large">
                        Create Free Account
                    </a>
                </section>
            </main>
        </>
    );
}

export default Home;