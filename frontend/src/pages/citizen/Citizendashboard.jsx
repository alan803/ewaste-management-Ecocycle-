import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./Citizendashboard.css";

function CitizenDashboard() {
    return (
        <>
            {/* <Sidebar /> */}
            <div className="citizen-dashboard">
                <div className="citizen-content">
                    <div className="citizen-header">
                        <div className="citizen-header-left">
                            <h1>Welcome Back!</h1>
                            <p>Thank you for making a difference for our planet</p>
                        </div>
                        <div className="citizen-header-right">
                            <div className="citizen-user-info">
                                <div className="citizen-avatar">C</div>
                                <div className="citizen-user-details">
                                    <span className="citizen-user-name">Citizen User</span>
                                    <span className="citizen-user-role">Eco Warrior</span>
                                </div>
                            </div>
                            <Link to="/logout" className="citizen-logout-btn">
                                Logout
                            </Link>
                        </div>
                    </div>

                    <div className="citizen-stats-grid">
                        <div className="citizen-stat-card">
                            <div className="citizen-stat-icon citizen-stat-icon--pickups">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                </svg>
                            </div>
                            <div className="citizen-stat-content">
                                <h3>Total Pickups</h3>
                                <p className="citizen-stat-value">24</p>
                                <span className="citizen-stat-change citizen-stat-change--positive">+3 this month</span>
                            </div>
                        </div>

                        <div className="citizen-stat-card">
                            <div className="citizen-stat-icon citizen-stat-icon--points">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="8" r="7"></circle>
                                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                                </svg>
                            </div>
                            <div className="citizen-stat-content">
                                <h3>Eco Points</h3>
                                <p className="citizen-stat-value">1,250</p>
                                <span className="citizen-stat-change citizen-stat-change--positive">+150 this month</span>
                            </div>
                        </div>

                        <div className="citizen-stat-card">
                            <div className="citizen-stat-icon citizen-stat-icon--impact">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                                </svg>
                            </div>
                            <div className="citizen-stat-content">
                                <h3>CO₂ Saved</h3>
                                <p className="citizen-stat-value">45 kg</p>
                                <span className="citizen-stat-change citizen-stat-change--positive">+5 kg this month</span>
                            </div>
                        </div>

                        <div className="citizen-stat-card">
                            <div className="citizen-stat-icon citizen-stat-icon--recycled">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="23 4 23 10 17 10"></polyline>
                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                </svg>
                            </div>
                            <div className="citizen-stat-content">
                                <h3>Recycled</h3>
                                <p className="citizen-stat-value">120 kg</p>
                                <span className="citizen-stat-change citizen-stat-change--positive">+15 kg this month</span>
                            </div>
                        </div>
                    </div>

                    <div className="citizen-dashboard-grid">
                        <div className="citizen-card citizen-card--recent">
                            <div className="citizen-card-header">
                                <h2>Recent Pickups</h2>
                                <Link to="/citizen/history" className="citizen-view-all">View All</Link>
                            </div>
                            <div className="citizen-table-container">
                                <table className="citizen-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Type</th>
                                            <th>Weight</th>
                                            <th>Points</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>#PC001</td>
                                            <td>Electronics</td>
                                            <td>5 kg</td>
                                            <td>+50</td>
                                            <td><span className="citizen-status citizen-status--completed">Completed</span></td>
                                            <td>Jan 15, 2024</td>
                                        </tr>
                                        <tr>
                                            <td>#PC002</td>
                                            <td>Plastic</td>
                                            <td>8 kg</td>
                                            <td>+40</td>
                                            <td><span className="citizen-status citizen-status--completed">Completed</span></td>
                                            <td>Jan 12, 2024</td>
                                        </tr>
                                        <tr>
                                            <td>#PC003</td>
                                            <td>Paper</td>
                                            <td>12 kg</td>
                                            <td>+36</td>
                                            <td><span className="citizen-status citizen-status--completed">Completed</span></td>
                                            <td>Jan 10, 2024</td>
                                        </tr>
                                        <tr>
                                            <td>#PC004</td>
                                            <td>Metal</td>
                                            <td>3 kg</td>
                                            <td>+30</td>
                                            <td><span className="citizen-status citizen-status--pending">Scheduled</span></td>
                                            <td>Jan 18, 2024</td>
                                        </tr>
                                        <tr>
                                            <td>#PC005</td>
                                            <td>Glass</td>
                                            <td>6 kg</td>
                                            <td>+24</td>
                                            <td><span className="citizen-status citizen-status--in-progress">In Progress</span></td>
                                            <td>Jan 16, 2024</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="citizen-card citizen-card--quick">
                            <div className="citizen-card-header">
                                <h2>Quick Actions</h2>
                            </div>
                            <div className="citizen-quick-actions">
                                <Link to="/citizen/pickup" className="citizen-quick-action">
                                    <div className="citizen-quick-action-icon citizen-quick-action-icon--primary">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                    </div>
                                    <span>Schedule Pickup</span>
                                </Link>
                                <Link to="/citizen/history" className="citizen-quick-action">
                                    <div className="citizen-quick-action-icon citizen-quick-action-icon--secondary">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                    </div>
                                    <span>Pickup History</span>
                                </Link>
                                <Link to="/citizen/rewards" className="citizen-quick-action">
                                    <div className="citizen-quick-action-icon citizen-quick-action-icon--accent">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="8" r="7"></circle>
                                            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                                        </svg>
                                    </div>
                                    <span>View Rewards</span>
                                </Link>
                                <Link to="/citizen/profile" className="citizen-quick-action">
                                    <div className="citizen-quick-action-icon citizen-quick-action-icon--info">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                    </div>
                                    <span>My Profile</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="citizen-card citizen-card--impact">
                        <div className="citizen-card-header">
                            <h2>Your Environmental Impact</h2>
                        </div>
                        <div className="citizen-impact-grid">
                            <div className="citizen-impact-item">
                                <div className="citizen-impact-icon citizen-impact-icon--trees">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 19V6M5 12l7-7 7 7M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"></path>
                                    </svg>
                                </div>
                                <div className="citizen-impact-content">
                                    <h3>Trees Saved</h3>
                                    <p className="citizen-impact-value">3.5</p>
                                </div>
                            </div>
                            <div className="citizen-impact-item">
                                <div className="citizen-impact-icon citizen-impact-icon--water">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                                    </svg>
                                </div>
                                <div className="citizen-impact-content">
                                    <h3>Water Saved</h3>
                                    <p className="citizen-impact-value">2,400 L</p>
                                </div>
                            </div>
                            <div className="citizen-impact-item">
                                <div className="citizen-impact-icon citizen-impact-icon--energy">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                    </svg>
                                </div>
                                <div className="citizen-impact-content">
                                    <h3>Energy Saved</h3>
                                    <p className="citizen-impact-value">180 kWh</p>
                                </div>
                            </div>
                            <div className="citizen-impact-item">
                                <div className="citizen-impact-icon citizen-impact-icon--landfill">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9"></path>
                                    </svg>
                                </div>
                                <div className="citizen-impact-content">
                                    <h3>Landfill Reduced</h3>
                                    <p className="citizen-impact-value">120 kg</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CitizenDashboard;