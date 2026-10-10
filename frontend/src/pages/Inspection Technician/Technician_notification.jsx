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
  FiBell,
  FiKey,
  FiCopy,
  FiShield,
  FiSmartphone
} from "react-icons/fi";
import "./Technician_notification.css";

function Technician_notification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

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
        "https://ecocycle.runasp.net/api/Notificationcon/my_notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const raw = Array.isArray(response.data) ? response.data : [];
      let currentLoginId = localStorage.getItem("loginId");
      if (!currentLoginId && token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          currentLoginId = payload.sub || payload.nameid || payload.LoginId;
        } catch (e) {}
      }
      const currentUserName = (localStorage.getItem("citizen_fullName") || localStorage.getItem("firstName") || "").toLowerCase().trim();

      let citizenDevices = [];
      if (isCitizen) {
        try {
          const devRes = await axios.get("https://ecocycle.runasp.net/api/Device/MyDevices", {
            headers: { Authorization: `Bearer ${token}` }
          });
          citizenDevices = Array.isArray(devRes.data) ? devRes.data : [];
        } catch (e) {
          console.warn("Could not fetch citizen devices for notification matching", e);
        }
      }

      const data = raw
        .filter((n) => {
          const notifLoginId = n.loginId ?? n.LoginId;
          if (notifLoginId && currentLoginId && String(notifLoginId) !== String(currentLoginId)) {
            return false;
          }
          const msg = (n.message ?? n.Message ?? "").toLowerCase();
          const title = (n.title ?? n.Title ?? "").toLowerCase();

          // 1. If greeting another citizen by name, filter out
          if (currentUserName && currentUserName.length > 2 && msg.startsWith("hello ")) {
            const firstWords = msg.replace("hello ", "").split(/[,.!]/)[0].trim();
            if (firstWords && !currentUserName.includes(firstWords.split(" ")[0]) && !firstWords.includes(currentUserName.split(" ")[0])) {
              return false;
            }
          }

          // 2. If citizen notification relates to a device, verify citizen owns the device
          if (isCitizen) {
            const devIdMatch = msg.match(/(?:device\s*#|device\s*id\s*#?|#)(\d+)/i) || title.match(/(?:device\s*#|#)(\d+)/i);
            if (devIdMatch) {
              const matchedDevId = parseInt(devIdMatch[1], 10);
              const userOwnsDevice = citizenDevices.some((d) => (d.deviceId ?? d.DeviceId ?? d.id) === matchedDevId);
              if (!userOwnsDevice) {
                return false;
              }
            } else if (citizenDevices.length === 0) {
              // Citizen has 0 registered devices, so device lifecycle notices do not belong to them
              const isDeviceNotif =
                title.includes("inspection") ||
                title.includes("handover") ||
                title.includes("pickup") ||
                title.includes("device") ||
                msg.includes("handover") ||
                msg.includes("inspection") ||
                msg.includes("pickup");
              if (isDeviceNotif) {
                return false;
              }
            } else {
              // Check if any of citizen's devices matches the brand or model mentioned
              const matchesAnyBrandOrModel = citizenDevices.some((d) => {
                const b = (d.brand || d.Brand || "").toLowerCase();
                const m = (d.model || d.Model || "").toLowerCase();
                return (b && (msg.includes(b) || title.includes(b))) || (m && (msg.includes(m) || title.includes(m)));
              });
              if (!matchesAnyBrandOrModel) {
                return false;
              }
            }
          }

          return true;
        })
        .map((n) => ({
          notificationId: n.notificationId ?? n.NotificationId ?? n.id,
          loginId: n.loginId ?? n.LoginId,
          title: n.title ?? n.Title ?? "System Notification",
          message: n.message ?? n.Message ?? "",
          isRead: n.isRead !== undefined ? n.isRead : (n.isread !== undefined ? n.isread : n.Isread),
          status: n.status !== undefined ? n.status : n.Status,
          createdAt: n.createdAt ?? n.CreatedAt ?? n.created_at
        }));
      setNotifications(data);

      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].notificationId);
      } else if (data.length === 0) {
        setSelectedId(null);
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
    setCopiedOtp(false);
    if (!notification.isRead) {
      markAsRead(notification.notificationId);
    }
  };

  const markAsRead = async (notificationId, e) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://ecocycle.runasp.net/api/Notificationcon/mark_asread/${notificationId}`,
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
        "https://ecocycle.runasp.net/api/Notificationcon/mark_asread",
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
        "https://ecocycle.runasp.net/api/Notificationcon/clearall",
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
        `https://ecocycle.runasp.net/api/Notificationcon/delete_selected/${notificationId}`,
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

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  // Category helper
  const getCategory = (title = "", message = "") => {
    const text = (title + " " + message).toLowerCase();
    if (text.includes("otp") || text.includes("verification code")) {
      return { key: "otp", label: "Verification OTP", icon: <FiKey />, class: "cat-assignment" };
    }
    if (text.includes("assign") || text.includes("allocat") || text.includes("dispatch") || text.includes("deliver") || text.includes("inspection")) {
      return { key: "assignments", label: "Assignment", icon: <FiClipboard />, class: "cat-assignment" };
    }
    if (text.includes("alert") || text.includes("warn") || text.includes("reject") || text.includes("penalty") || text.includes("urgent")) {
      return { key: "alerts", label: "Alert", icon: <FiAlertCircle />, class: "cat-alert" };
    }
    if (text.includes("complete") || text.includes("passed") || text.includes("approved") || text.includes("success")) {
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

  // Render message body with structured cards if special notice
  const renderMessageContent = (notif) => {
    if (!notif || !notif.message) return null;
    const message = notif.message;
    const title = notif.title || "";

    // OTP Detection
    const otpMatch = message.match(/(?:OTP\s*(?:is|:)?\s*|verification\s*OTP[^\d]*is\s*|code\s*is\s*)(\d{4,6})/i) ||
                     message.match(/\bis\s+(\d{4,6})\b/i);
    const hasOtp = otpMatch && (title.toLowerCase().includes("otp") || message.toLowerCase().includes("otp") || message.toLowerCase().includes("verification"));

    if (hasOtp) {
      const otpCode = otpMatch[1];
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{message}</div>
          <div style={{
            background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
            border: "1px solid #a7f3d0",
            borderRadius: "12px",
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "#059669",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem"
              }}>
                <FiShield />
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#065f46", textTransform: "uppercase" }}>Handover Code</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#064e3b", letterSpacing: "2px", fontFamily: "monospace" }}>{otpCode}</div>
              </div>
            </div>
            <button
              type="button"
              className="inbox-btn btn-primary-ghost"
              onClick={() => copyToClipboard(otpCode)}
              style={{ padding: "0.45rem 0.9rem", fontSize: "0.8rem", fontWeight: 700 }}
            >
              {copiedOtp ? <><FiCheck /> Copied!</> : <><FiCopy /> Copy OTP</>}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
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
      return getCategory(item.title, item.message).key === "assignments" || getCategory(item.title, item.message).key === "otp";
    }
    return true;
  });

  const activeNotification =
    notifications.find((n) => n.notificationId === selectedId) || filteredNotifications[0];

  return (
    <div className={`tech-notif-app ${isAgent ? "agent-theme" : isCitizen ? "citizen-theme" : ""}`}>
      <SidebarComponent />

      <main className="inbox-main-container">
        {/* Background Ambient Glow */}
        <div className="ambient-glow ambient-glow--1"></div>
        <div className="ambient-glow ambient-glow--2"></div>

        {/* Topbar Header */}
        <header className="inbox-topbar">
          <div className="inbox-topbar-left">
            <Link to={dashboardPath} className="back-home-link" title="Dashboard">
              <FiArrowLeft />
            </Link>
            <div className="inbox-title-area">
              <h1>
                <FiInbox style={{ color: "#059669" }} /> Notification Inbox
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
              title="Refresh Notifications"
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
        <div className="inbox-toolbar">
          <div>
            <h3 className="inbox-toolbar-title">Filter Messages</h3>
            <p className="inbox-toolbar-sub">Manage system notices, assignment alerts, and status updates</p>
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

              {!isCitizen && (
                <button
                  className={`pill-btn ${activeTab === "assignments" ? "active" : ""}`}
                  onClick={() => setActiveTab("assignments")}
                >
                  Assignments
                  <span className="tab-badge">
                    {
                      notifications.filter(
                        (n) =>
                          getCategory(n.title, n.message).key === "assignments" ||
                          getCategory(n.title, n.message).key === "otp"
                      ).length
                    }
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
                  {searchQuery ? "Try clearing search filter" : "Your inbox is clean."}
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
                    <span>From: System Coordinator / Dispatch</span>
                    <span title={formatFullDate(activeNotification.createdAt)}>
                      <FiClock style={{ verticalAlign: "middle", marginRight: "4px" }} />
                      {formatFullDate(activeNotification.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="reader-body">
                  <div className="reader-message-content">
                    {renderMessageContent(activeNotification)}
                  </div>
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