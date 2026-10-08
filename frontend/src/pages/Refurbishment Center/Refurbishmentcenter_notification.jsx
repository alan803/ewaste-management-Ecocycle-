import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
  FiInbox,
  FiMail,
  FiCheckCircle,
  FiCheckSquare,
  FiCheck,
  FiX,
  FiClock,
  FiAlertCircle,
  FiSearch,
  FiRefreshCw,
  FiTrash2,
  FiArrowLeft,
  FiClipboard,
  FiExternalLink,
  FiBell,
  FiCpu
} from "react-icons/fi";
import "./Refurbishmentcenter_notification.css";

function Refurbishmentcenter_notification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const navigate = useNavigate();
  const dashboardPath = "/refurbishmentcenter_dashboard";

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

      const raw = Array.isArray(response.data) ? response.data : [];
      const data = raw.map((n) => ({
        notificationId: n.notificationId ?? n.NotificationId ?? n.id,
        title: n.title ?? n.Title ?? "Refurbishment Notice",
        message: n.message ?? n.Message ?? "",
        isRead: n.isRead !== undefined ? n.isRead : (n.isread !== undefined ? n.isread : n.Isread),
        status: n.status !== undefined ? n.status : n.Status,
        createdAt: n.createdAt ?? n.CreatedAt ?? n.created_at
      }));
      setNotifications(data);

      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].notificationId);
      }
    } catch (err) {
      console.error("Error fetching refurbishment center notifications:", err);
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
    if (text.includes("allocat") || text.includes("assign") || text.includes("device") || text.includes("refurbish") || text.includes("unit")) {
      return { key: "allocations", label: "Allocation", icon: <FiClipboard />, class: "cat-assignment" };
    }
    if (text.includes("alert") || text.includes("warn") || text.includes("reject") || text.includes("urgent") || text.includes("overdue") || text.includes("deadline")) {
      return { key: "alerts", label: "Alert", icon: <FiAlertCircle />, class: "cat-alert" };
    }
    if (text.includes("complete") || text.includes("passed") || text.includes("approved") || text.includes("accept") || text.includes("certified")) {
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

  // Unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Filtered notifications list
  const filteredNotifications = notifications.filter((item) => {
    const titleMatch = (item.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const messageMatch = (item.message || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (!titleMatch && !messageMatch) return false;

    if (activeTab === "unread") return !item.isRead;
    if (activeTab === "allocations") {
      return getCategory(item.title, item.message).key === "allocations";
    }
    return true;
  });

  const activeNotification = notifications.find((n) => n.notificationId === selectedId) || filteredNotifications[0];

  return (
    <div className="refurb-notif-app">
      <Sidebar />

      <main className="inbox-main-container">
        {/* Background Ambient Glow */}
        <div className="ambient-glow ambient-glow--1"></div>
        <div className="ambient-glow ambient-glow--2"></div>

        {/* Topbar Header */}
        <header className="inbox-topbar">
          <div className="inbox-topbar-left">
            <Link to={dashboardPath} className="back-home-link" title="Facility Dashboard">
              <FiArrowLeft />
            </Link>
            <div className="inbox-title-area">
              <h1>
                <FiInbox style={{ color: "#7c3aed" }} /> Refurbishment Notifications
                {unreadCount > 0 && (
                  <span className="unread-count-pill">{unreadCount} unread</span>
                )}
              </h1>
            </div>
          </div>

          <div className="inbox-topbar-actions">
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
        <div className="inbox-toolbar">
          <div>
            <h3 className="inbox-toolbar-title">Filter Facility Notices</h3>
            <p className="inbox-toolbar-sub">Manage refurbishment center device allocation notices and status updates</p>
          </div>

          <div className="inbox-toolbar-right">
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

              <button
                className={`pill-btn ${activeTab === "allocations" ? "active" : ""}`}
                onClick={() => setActiveTab("allocations")}
              >
                Allocations
                <span className="tab-badge">
                  {notifications.filter((n) => getCategory(n.title, n.message).key === "allocations").length}
                </span>
              </button>
            </div>

            <div className="inbox-search-wrap">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="icon-action-btn clear-search-btn"
                  onClick={() => setSearchQuery("")}
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
                  {searchQuery ? "Try clearing search filter" : "Your facility inbox is clean."}
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
                    <span>From: EcoCycle Admin / Dispatch</span>
                    <span title={formatFullDate(activeNotification.createdAt)}>
                      <FiClock style={{ verticalAlign: "middle", marginRight: "4px" }} />
                      {formatFullDate(activeNotification.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="reader-body">
                  <div className="reader-message-content">{activeNotification.message}</div>
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

export default Refurbishmentcenter_notification;
