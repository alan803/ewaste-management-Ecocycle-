import { Link } from "react-router-dom";
import Navbar from "./Navbar";
import "./Admindashboard.css";

function AdminDashboard() {
    return (
        <div className="admin-dashboard">
            {/* <Navbar /> */}
            <div className="admin-content">
                <div className="admin-header">
                    <div className="admin-header-left">
                        <h1>Admin Dashboard</h1>
                        <p>Welcome back, Administrator</p>
                    </div>
                    <div className="admin-header-right">
                        <div className="admin-user-info">
                            <div className="admin-avatar">A</div>
                            <div className="admin-user-details">
                                <span className="admin-user-name">Admin User</span>
                                <span className="admin-user-role">Super Admin</span>
                            </div>
                        </div>
                        <Link to="/logout" className="admin-logout-btn">
                            Logout
                        </Link>
                    </div>
                </div>

                <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-stat-icon--users">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <div className="admin-stat-content">
                            <h3>Total Users</h3>
                            <p className="admin-stat-value">1,234</p>
                            <span className="admin-stat-change admin-stat-change--positive">+12%</span>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-stat-icon--pickups">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                            </svg>
                        </div>
                        <div className="admin-stat-content">
                            <h3>Pending Pickups</h3>
                            <p className="admin-stat-value">45</p>
                            <span className="admin-stat-change admin-stat-change--neutral">Same</span>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-stat-icon--completed">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <div className="admin-stat-content">
                            <h3>Completed</h3>
                            <p className="admin-stat-value">892</p>
                            <span className="admin-stat-change admin-stat-change--positive">+8%</span>
                        </div>
                    </div>

                    <div className="admin-stat-card">
                        <div className="admin-stat-icon admin-stat-icon--agents">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                            </svg>
                        </div>
                        <div className="admin-stat-content">
                            <h3>Active Agents</h3>
                            <p className="admin-stat-value">67</p>
                            <span className="admin-stat-change admin-stat-change--positive">+5%</span>
                        </div>
                    </div>
                </div>

                <div className="admin-dashboard-grid">
                    <div className="admin-card admin-card--recent">
                        <div className="admin-card-header">
                            <h2>Recent Pickup Requests</h2>
                            <Link to="/admin/pickups" className="admin-view-all">View All</Link>
                        </div>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>User</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>#PU001</td>
                                        <td>John Doe</td>
                                        <td>Electronics</td>
                                        <td><span className="admin-status admin-status--pending">Pending</span></td>
                                        <td>Jan 15, 2024</td>
                                    </tr>
                                    <tr>
                                        <td>#PU002</td>
                                        <td>Jane Smith</td>
                                        <td>Plastic</td>
                                        <td><span className="admin-status admin-status--assigned">Assigned</span></td>
                                        <td>Jan 15, 2024</td>
                                    </tr>
                                    <tr>
                                        <td>#PU003</td>
                                        <td>Bob Johnson</td>
                                        <td>Metal</td>
                                        <td><span className="admin-status admin-status--completed">Completed</span></td>
                                        <td>Jan 14, 2024</td>
                                    </tr>
                                    <tr>
                                        <td>#PU004</td>
                                        <td>Alice Brown</td>
                                        <td>Paper</td>
                                        <td><span className="admin-status admin-status--pending">Pending</span></td>
                                        <td>Jan 14, 2024</td>
                                    </tr>
                                    <tr>
                                        <td>#PU005</td>
                                        <td>Charlie Davis</td>
                                        <td>Electronics</td>
                                        <td><span className="admin-status admin-status--in-progress">In Progress</span></td>
                                        <td>Jan 13, 2024</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="admin-card admin-card--quick">
                        <div className="admin-card-header">
                            <h2>Quick Actions</h2>
                        </div>
                        <div className="admin-quick-actions">
                            <Link to="/admin/assign-pickups" className="admin-quick-action">
                                <div className="admin-quick-action-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="8.5" cy="7" r="4"></circle>
                                        <line x1="20" y1="8" x2="20" y2="14"></line>
                                        <line x1="23" y1="11" x2="17" y2="11"></line>
                                    </svg>
                                </div>
                                <span>Assign Pickup</span>
                            </Link>
                            <Link to="/usermanagement" className="admin-quick-action">
                                <div className="admin-quick-action-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                    </svg>
                                </div>
                                <span>Manage Users</span>
                            </Link>
                            <Link to="/admin/reports" className="admin-quick-action">
                                <div className="admin-quick-action-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="20" x2="18" y2="10"></line>
                                        <line x1="12" y1="20" x2="12" y2="4"></line>
                                        <line x1="6" y1="20" x2="6" y2="14"></line>
                                    </svg>
                                </div>
                                <span>View Reports</span>
                            </Link>
                            <Link to="/admin/settings" className="admin-quick-action">
                                <div className="admin-quick-action-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="3"></circle>
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                    </svg>
                                </div>
                                <span>Settings</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;