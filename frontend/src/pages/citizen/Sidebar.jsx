import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import "./Sidebar.css";

function Sidebar() {
    const location = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState({});
    const [searchQuery, setSearchQuery] = useState("");

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + "/");
    };

    const toggleSection = (sectionName) => {
        setCollapsedSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }));
    };

    const toggleMobileMenu = () => {
        setIsMobileOpen(!isMobileOpen);
    };

    const filteredLinks = (links) => {
        if (!searchQuery) return links;
        return links.filter(link => 
            link.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const mainLinks = [
        { path: "/citizen", label: "Dashboard", icon: "home" },
        { path: "/citizen/pickup", label: "Schedule Pickup", icon: "calendar" },
        { path: "/citizen/history", label: "Pickup History", icon: "clock" }
    ];

    const profileLinks = [
        { path: "/citizen/profile", label: "My Profile", icon: "user" },
        { path: "/citizen/rewards", label: "Rewards & Points", icon: "award", badge: 250 },
        { path: "/citizen/settings", label: "Settings", icon: "settings" }
    ];

    const icons = {
        home: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
        ),
        calendar: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
        ),
        clock: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
        ),
        user: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        ),
        award: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="7"></circle>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
        ),
        settings: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
        )
    };

    return (
        <>
            <button 
                className={`citizen-mobile-toggle ${isMobileOpen ? 'open' : ''}`} 
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>
            
            <div className={`citizen-sidebar ${isMobileOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                            <line x1="12" y1="22.08" x2="12" y2="12"></line>
                        </svg>
                        <span>EcoCycle</span>
                    </div>
                </div>

                <div className="sidebar-search">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search menu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <nav className="sidebar-nav">
                    <div className="sidebar-section">
                        <button 
                            className="sidebar-section-header"
                            onClick={() => toggleSection('main')}
                        >
                            <span className="sidebar-section-title">Main</span>
                            <svg 
                                className={`chevron ${collapsedSections.main ? 'collapsed' : ''}`} 
                                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        <ul className={`sidebar-menu ${collapsedSections.main ? 'collapsed' : ''}`}>
                            {filteredLinks(mainLinks).map(link => (
                                <li key={link.path}>
                                    <Link 
                                        to={link.path} 
                                        className={`sidebar-link ${isActive(link.path) ? "active" : ""}`}
                                        onClick={() => setIsMobileOpen(false)}
                                    >
                                        {icons[link.icon]}
                                        <span>{link.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="sidebar-section">
                        <button 
                            className="sidebar-section-header"
                            onClick={() => toggleSection('profile')}
                        >
                            <span className="sidebar-section-title">Profile & Settings</span>
                            <svg 
                                className={`chevron ${collapsedSections.profile ? 'collapsed' : ''}`} 
                                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        <ul className={`sidebar-menu ${collapsedSections.profile ? 'collapsed' : ''}`}>
                            {filteredLinks(profileLinks).map(link => (
                                <li key={link.path}>
                                    <Link 
                                        to={link.path} 
                                        className={`sidebar-link ${isActive(link.path) ? "active" : ""}`}
                                        onClick={() => setIsMobileOpen(false)}
                                    >
                                        {icons[link.icon]}
                                        <span>{link.label}</span>
                                        {link.badge && <span className="sidebar-badge sidebar-badge--points">{link.badge}</span>}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user-profile">
                        <div className="sidebar-user-avatar">C</div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">Citizen User</span>
                            <span className="sidebar-user-role">Eco Warrior</span>
                        </div>
                    </div>
                    <Link to="/logout" className="sidebar-link sidebar-link--logout" onClick={() => setIsMobileOpen(false)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <span>Logout</span>
                    </Link>
                </div>
            </div>
            
            {isMobileOpen && (
                <div className="sidebar-overlay" onClick={toggleMobileMenu}></div>
            )}
        </>
    );
}

export default Sidebar;
