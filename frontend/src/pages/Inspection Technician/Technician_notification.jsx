import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import TechSidebar from "./Sidebar";
import AgentSidebar from "../Collection Agent/Sidebar";
import CitizenSidebar from "../citizen/Sidebar";
import {
  FiInbox,
  FiMail,
  FiCheckCircle,
  FiCheckSquare,
  FiCheck,
  FiX,
  FiClock,
  FiAlertCircle,
  FiAlertTriangle,
  FiSearch,
  FiRefreshCw,
  FiTrash2,
  FiArrowLeft,
  FiClipboard,
  FiExternalLink,
  FiEyeOff,
  FiBell
} from "react-icons/fi";
import "./Technician_notification.css";

function Technician_notification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const navigate = useNavigate();

  const userRole = localStorage.getItem("role");
  const isAgent = userRole === "Collection Agent";
  const isCitizen = userRole === "Citizen";

  let SidebarComponent = TechSidebar;
  let dashboardPath = "/technician_dashboard";

  if (isAgent) {
    SidebarComponent = AgentSidebar;
    dashboardPath = "/collectionagent/dashboard";
  } else if (isCitizen) {
    SidebarComponent = CitizenSidebar;
    dashboardPath = "/citizen";
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await axios.get(
        "https://localhost:7102/api/Notificationcon/my_notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = Array.isArray(response.data) ? response.data : [];
      setNotifications(data);

      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].notificationId);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSelectNotification = (notification) => {
    setSelectedId(notification.notificationId);
    if (!notification.isRead) {
      markAsRead(notification.notificationId);
    }
  };

  const markAsRead = async (notificationId, e) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://localhost:7102/api/Notificationcon/mark_asread/${notificationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (err) {
      console.error("Error marking as read:", err);
      // Fallback local update
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.get(
        "https://localhost:7102/api/Notificationcon/mark_asread",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error("Error marking all as read:", err);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
    }
  };

  const clearAllNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.get(
        "https://localhost:7102/api/Notificationcon/clearall",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setNotifications([]);
      setSelectedId(null);
    } catch (err) {
      console.error("Error clearing all notifications:", err);
      // Optimistic local update fallback
      setNotifications([]);
      setSelectedId(null);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    if (e) e.stopPropagation();

    setNotifications((prev) => {
      const updated = prev.filter((n) => n.notificationId !== notificationId);
      if (selectedId === notificationId) {
        setSelectedId(updated.length > 0 ? updated[0].notificationId : null);
      }
      return updated;
    });

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://localhost:7102/api/Notificationcon/delete_selected/${notificationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // Helper category classification
  const getCategory = (title = "", message = "") => {
    const text = (title + " " + message).toLowerCase();
    if (text.includes("assign") || text.includes("device") || text.includes("inspection")) {
      return { key: "assignments", label: "Assignment", icon: <FiClipboard />, class: "cat-assignment" };
    }
    if (text.includes("alert") || text.includes("warn") || text.includes("reject") || text.includes("urgent")) {
      return { key: "alerts", label: "Alert", icon: <FiAlertCircle />, class: "cat-alert" };
    }
    if (text.includes("complete") || text.includes("passed") || text.includes("approved")) {
      return { key: "success", label: "Success", icon: <FiCheckCircle />, class: "cat-success" };
    }
    return { key: "system", label: "System", icon: <FiBell />, class: "cat-system" };
  };

  // Date formatting helpers
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const formatFullDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString([], { dateStyle: "full", timeStyle: "short" });
  };

  const renderProfessionalMessage = (message) => {
    if (!message) return null;

    const isExtensionNotif = message.includes("Extension Count") || message.includes("Inspection Deadline Policy") || message.includes("deadline extension");

    if (isExtensionNotif) {
      const deviceMatch = message.match(/\(([^)]+)\)/);
      const deadlineMatch = message.match(/New inspection deadline:\s*([^.\n]+)/i) || message.match(/New Deadline:\s*([^.\n]+)/i);
      const countMatch = message.match(/Extension Count:\s*(\d+\/\d+)/i) || message.match(/Extensions Used:\s*([^\n]+)/i);

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1.15rem" }}>
            <p style={{ margin: "0 0 0.85rem 0", fontSize: "0.95rem", color: "#1e293b", lineHeight: "1.5" }}>
              The Administrator has granted a <strong>24-hour deadline extension</strong> for device inspection {deviceMatch ? `(${deviceMatch[1]})` : ""}.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "0.85rem" }}>
              <div>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>New Inspection Deadline</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#059669", marginTop: "0.2rem" }}>
                  {deadlineMatch ? deadlineMatch[1] : "Extended Deadline Active"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Extension Usage</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#d97706", marginTop: "0.2rem" }}>
                  {countMatch ? countMatch[1] : "1 / 2 Max Extensions"}
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "#fffbe6", border: "1px solid #fde68a", borderRadius: "12px", padding: "1.15rem" }}>
            <h4 style={{ margin: "0 0 0.65rem 0", color: "#92400e", fontSize: "0.925rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <FiAlertTriangle style={{ color: "#d97706" }} /> Technician Inspection Deadline &amp; Penalty Guidelines
            </h4>
            <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.825rem", color: "#78350f", lineHeight: "1.6" }}>
              <li style={{ marginBottom: "0.4rem" }}>
                <strong>Inspection Timeframe:</strong> Once assigned, you are responsible for completing the inspection within the specified deadline.
              </li>
              <li style={{ marginBottom: "0.4rem" }}>
                <strong>Permitted Extensions:</strong> A maximum of <strong>two 24-hour extensions</strong> will be permitted per device task.
              </li>
              <li style={{ marginBottom: "0.4rem" }}>
                <strong>Overdue Penalty:</strong> Failure to complete the inspection after the second 24-hour extension will incur a technician performance penalty.
              </li>
              <li>
                <strong>Performance Record:</strong> Repeated overdue inspections may impact your technician evaluation score and future assignments.
              </li>
            </ul>
          </div>
        </div>
      );
    }

    return (
      <div style={{ whiteSpace: "pre-line", lineHeight: "1.6", color: "#334155", fontSize: "0.925rem" }}>
        {message}
      </div>
    );
  };

  // Unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Filtered notifications list
  const filteredNotifications = notifications.filter((item) => {
    const titleMatch = (item.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const messageMatch = (item.message || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (!titleMatch && !messageMatch) return false;

    if (activeTab === "unread") return !item.isRead;
    if (activeTab === "assignments") {
      return getCategory(item.title, item.message).key === "assignments";
    }
    return true;
  });

  const activeNotification = notifications.find((n) => n.notificationId === selectedId) || filteredNotifications[0];

  return (
    <div className={`technician-notif-app ${isAgent ? "agent-theme" : isCitizen ? "citizen-theme" : "tech-theme"}`}>
      <SidebarComponent />

      <main className="inbox-main-container">
        {/* Topbar Header */}
        <header className="inbox-topbar">
          <div className="inbox-topbar-left">
            <Link to={dashboardPath} className="back-home-link" title="Dashboard">
              <FiArrowLeft />
            </Link>
            <div className="inbox-title-area">
              <h1>
                <FiInbox style={{ color: "#10b981" }} /> Notification Inbox
                {unreadCount > 0 && (
                  <span className="unread-count-pill">{unreadCount} unread</span>
                )}
              </h1>
            </div>
          </div>

          <div className="inbox-topbar-actions">
            <button
              className="inbox-btn"
              onClick={() => fetchNotifications(true)}
              disabled={refreshing}
              title="Refresh Inbox"
            >
              <FiRefreshCw className={refreshing ? "spin-icon" : ""} />
              <span>Refresh</span>
            </button>

            <button
              className="inbox-btn btn-primary-ghost"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <FiCheckSquare />
              <span>Mark all read</span>
            </button>

            <button
              className="inbox-btn btn-danger-ghost"
              onClick={clearAllNotifications}
              disabled={notifications.length === 0}
              title="Clear all notifications"
            >
              <FiTrash2 />
              <span>Clear All</span>
            </button>
          </div>
        </header>

        {/* Toolbar Controls */}
        <div className="inbox-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.2rem", color: "#0f172a" }}>Filter Messages</h3>
            <p style={{ margin: 0, fontSize: "0.775rem", color: "#64748b" }}>Filter notifications by status or assignment category</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap", marginLeft: "auto" }}>
            <div className="filter-pills">
              <button
                className={`pill-btn ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All Inbox
                <span className="tab-badge">{notifications.length}</span>
              </button>

              <button
                className={`pill-btn ${activeTab === "unread" ? "active" : ""}`}
                onClick={() => setActiveTab("unread")}
              >
                Unread
                <span className="tab-badge">{unreadCount}</span>
              </button>

              {!isCitizen && (
                <button
                  className={`pill-btn ${activeTab === "assignments" ? "active" : ""}`}
                  onClick={() => setActiveTab("assignments")}
                >
                  Assignments
                  <span className="tab-badge">
                    {notifications.filter((n) => getCategory(n.title, n.message).key === "assignments").length}
                  </span>
                </button>
              )}
            </div>

          <div className="inbox-search-wrap">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="icon-action-btn"
                onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: "0.5rem" }}
              >
                <FiX />
              </button>
            )}
          </div>
        </div>
      </div>

        {/* Main Split View: Left List + Right Reader */}
        <div className="inbox-split-view">
          {/* Left Notification Row List */}
          <div className="inbox-list-panel">
            {loading ? (
              <div className="inbox-list-scroll">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton-row">
                    <div className="skeleton-shimmer sk-icon" />
                    <div className="sk-lines">
                      <div className="skeleton-shimmer sk-line-1" />
                      <div className="skeleton-shimmer sk-line-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="reader-empty">
                <FiInbox className="reader-empty-icon" />
                <p style={{ margin: 0, fontWeight: 600, color: "#475569" }}>No messages found</p>
                <span style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                  {searchQuery ? "Try clearing search filter" : "Your inbox is completely clean."}
                </span>
              </div>
            ) : (
              <div className="inbox-list-scroll">
                {filteredNotifications.map((notif) => {
                  const cat = getCategory(notif.title, notif.message);
                  const isSelected = activeNotification?.notificationId === notif.notificationId;

                  return (
                    <div
                      key={notif.notificationId}
                      className={`inbox-row ${notif.isRead ? "read" : "unread"} ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => handleSelectNotification(notif)}
                    >
                      <div className={`row-dot ${notif.isRead ? "read" : ""}`} />

                      <div className={`row-icon-chip ${cat.class}`}>{cat.icon}</div>

                      <div className="row-main-content">
                        <div className="row-header">
                          <h4 className="row-title">{notif.title}</h4>
                          <span className="row-time">{formatTime(notif.createdAt)}</span>
                        </div>
                        <p className="row-snippet">{notif.message}</p>
                      </div>

                      <div className="row-hover-actions">
                        {!notif.isRead && (
                          <button
                            className="icon-action-btn"
                            onClick={(e) => markAsRead(notif.notificationId, e)}
                            title="Mark as Read"
                          >
                            <FiCheck />
                          </button>
                        )}
                        <button
                          className="icon-action-btn delete-hover"
                          onClick={(e) => deleteNotification(notif.notificationId, e)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Message Reader Panel */}
          <div className="inbox-reader-panel">
            {activeNotification ? (
              <>
                <div className="reader-header">
                  <div className="reader-title-bar">
                    <h2 className="reader-title">{activeNotification.title}</h2>
                    <span
                      className={`reader-tag ${
                        getCategory(activeNotification.title, activeNotification.message).class
                      }`}
                    >
                      {getCategory(activeNotification.title, activeNotification.message).label}
                    </span>
                  </div>

                  <div className="reader-meta-row">
                    <span>From: System Coordinator</span>
                    <span title={formatFullDate(activeNotification.createdAt)}>
                      <FiClock style={{ verticalAlign: "middle", marginRight: "4px" }} />
                      {formatFullDate(activeNotification.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="reader-body">
                  <div className="reader-message-content">{renderProfessionalMessage(activeNotification.message)}</div>
                </div>

                <div className="reader-actions">
                  <button
                    className="inbox-btn"
                    onClick={() => navigate(dashboardPath)}
                  >
                    <FiExternalLink />
                    <span>Go to Dashboard</span>
                  </button>
                  <button
                    className="inbox-btn"
                    onClick={(e) => deleteNotification(activeNotification.notificationId, e)}
                  >
                    <FiTrash2 />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="reader-empty">
                <FiMail className="reader-empty-icon" />
                <p style={{ margin: 0, fontWeight: 600, color: "#475569" }}>Select a notification</p>
                <span style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                  Choose any notification from the left list to read details here.
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Technician_notification;