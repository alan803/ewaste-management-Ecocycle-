import "./Login.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  FiAlertTriangle,
  FiCreditCard,
  FiMail,
  FiArrowLeft,
  FiCheckCircle,
  FiRefreshCw,
  FiCheck,
  FiLogIn
} from "react-icons/fi";
import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

function LoginIllustration() {
  return (
    <svg
      className="login-illustration"
      viewBox="0 0 520 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="260" cy="240" r="180" fill="rgba(255,255,255,0.12)" />
      <circle cx="260" cy="240" r="130" fill="rgba(255,255,255,0.1)" />

      <path
        d="M260 90 C260 90 320 140 320 210 C320 280 260 330 260 330 C260 330 200 280 200 210 C200 140 260 90 260 90Z"
        fill="rgba(255,255,255,0.18)"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="2"
      />
      <path
        d="M260 130 L290 200 L260 250 L230 200 Z"
        fill="#ffffff"
        opacity="0.9"
      />

      <rect x="148" y="268" width="72" height="110" rx="10" fill="#ffffff" opacity="0.92" />
      <rect x="158" y="278" width="52" height="72" rx="4" fill="#c8e6d4" />
      <circle cx="184" cy="362" r="5" fill="#1e8a55" />

      <rect x="300" y="255" width="100" height="68" rx="8" fill="#ffffff" opacity="0.92" />
      <rect x="310" y="265" width="80" height="48" rx="4" fill="#c8e6d4" />
      <rect x="335" y="323" width="30" height="4" rx="2" fill="#1e8a55" />

      <circle cx="380" cy="180" r="28" fill="#ffffff" opacity="0.85" />
      <path
        d="M380 162 C388 162 394 170 394 180 C394 190 388 198 380 198 C372 198 366 190 366 180 C366 170 372 162 380 162Z"
        fill="#1e8a55"
        opacity="0.3"
      />
      <path
        d="M380 168 L380 192 M368 180 L392 180"
        stroke="#1e8a55"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path
        d="M120 190 Q100 210 110 235 Q125 250 140 230"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="2"
        fill="none"
      />
      <ellipse cx="108" cy="218" rx="14" ry="22" fill="rgba(255,255,255,0.25)" transform="rotate(-30 108 218)" />
      <ellipse cx="128" cy="200" rx="12" ry="20" fill="rgba(255,255,255,0.2)" transform="rotate(20 128 200)" />

      <path
        d="M400 300 Q420 320 410 345 Q395 360 385 340"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="2"
        fill="none"
      />
      <ellipse cx="412" cy="328" rx="14" ry="22" fill="rgba(255,255,255,0.25)" transform="rotate(30 412 328)" />
      <ellipse cx="392" cy="310" rx="12" ry="20" fill="rgba(255,255,255,0.2)" transform="rotate(-15 392 310)" />

      <path
        d="M200 120 Q230 100 260 115 Q290 100 320 120"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="2"
        strokeDasharray="6 4"
        fill="none"
      />
      <circle cx="200" cy="120" r="5" fill="#ffffff" opacity="0.7" />
      <circle cx="260" cy="115" r="5" fill="#ffffff" opacity="0.7" />
      <circle cx="320" cy="120" r="5" fill="#ffffff" opacity="0.7" />
    </svg>
  );
}


function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [penaltyInfo, setPenaltyInfo] = useState(null);
  const [payingPenalty, setPayingPenalty] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState("");
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const [form_dta, set_form_dta] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    email_er: "",
    password_er: "",
    status_er: ""
  });

  const handlePayPenalty = async () => {
    if (!penaltyInfo?.penaltyId) return;
    setPayingPenalty(true);
    const createUrl = `https://ecocycle.runasp.net/api/TechnicianPenaltyPayment/create-order/${penaltyInfo.penaltyId}`;
    const verifyUrl = "https://ecocycle.runasp.net/api/TechnicianPenaltyPayment/verify";

    try {
      // 1. Create Razorpay order on backend
      const res = await axios.post(createUrl);

      const data = res.data;

      // 2. Open Razorpay Checkout modal
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "EcoCycle",
        description: data.description || (isAgent ? "Collection Agent Penalty Fine (₹50)" : "Technician Policy Violation Fine"),
        order_id: data.orderId,
        handler: async function (response) {
          try {
            setPayingPenalty(true);
            // 3. Verify Razorpay payment signature on backend
            const verifyRes = await axios.post(
              verifyUrl,
              {
                paymentId: data.paymentId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature
              }
            );

            setPaySuccessMsg(
              verifyRes.data?.message || "Fine paid successfully! You may now sign in."
            );
          } catch (verifyErr) {
            console.error("Payment verification failed:", verifyErr);
            alert(
              verifyErr.response?.data?.message || "Payment verification failed. Please contact support."
            );
          } finally {
            setPayingPenalty(false);
          }
        },
        theme: {
          color: "#10b981"
        },
        modal: {
          ondismiss: function () {
            setPayingPenalty(false);
          }
        }
      };

      if (!window.Razorpay) {
        alert("Razorpay SDK failed to load. Please refresh and try again.");
        setPayingPenalty(false);
        return;
      }

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (err) {
      console.error("Error creating payment order:", err);
      alert(
        err.response?.data?.message || err.response?.data || "Failed to initialize Razorpay payment. Please try again."
      );
      setPayingPenalty(false);
    }
  };
  function handleInputChange(e) {
    const { name, value } = e.target;

    set_form_dta(prev => ({
      ...prev,
      [name]: value
    }));

    setErrors(prev => ({
      ...prev,
      [name]: name === "email" ? validateEmail(value) : validatepassword(value),
      email_er: "",
      password_er: "",
      status_er: ""
    }));
  }
  function validateEmail(email) {
    if (email === "")
      return "Email is required";

    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email))
      return "Invalid Gmail address";

    return "";
  }
  function validatepassword(password) {
    if (password === "")
      return "Password is required";

    if (password.length < 6)
      return "Password must be at least 6 characters";

    return "";
  }
  async function login_validation(e) {
    e.preventDefault();
    const newErrors = {
      email: validateEmail(form_dta.email),
      password: validatepassword(form_dta.password)
    };
    setErrors(prev => ({
      ...prev,
      ...newErrors
    }));
    if (Object.values(newErrors).some(err => err !== "")) {
      return;
    }
    try {
      const response = await axios.post(
        "https://ecocycle.runasp.net/api/Login/Login",
        form_dta
      );
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("loginId", response.data.loginId);
      if (response.data.technicianId) {
        localStorage.setItem("technicianId", response.data.technicianId);
      }
      localStorage.setItem("firstName", response.data.firstName);
      localStorage.setItem("roleId", response.data.roleId);
      localStorage.setItem("role", response.data.role);

      switch (response.data.role) {
        case "Citizen":
          navigate("/citizen");
          break;

        case "Administrator":
          navigate("/admin");
          break;

        case "Collection Agent":
          sessionStorage.setItem("justLoggedInCollectionAgent", "true");
          navigate("/collectionagent/dashboard");
          break;
        case "Inspection Officer":
          sessionStorage.setItem("justLoggedInInspectionTechnician", "true");
          navigate("/technician_dashboard");
          break;
        case "Refurbishment Center":
          navigate("/refurbishmententer_dashboard");
          break;
        case "Recycling Center":
          navigate("/recyclingenter_dashboard");
          break;
        default:
          console.log("Invalid role:", response.data.role);
          navigate("/");
          break;
      }
    }
    catch (error) {
      if (error.response?.data) {
        const { field, message, penaltyData } = error.response.data;

        if (field === "penalty_blocked" || penaltyData) {
          setPenaltyInfo(penaltyData || {
            penaltyId: 1,
            penaltyAmount: 100,
            reason: message || "Overdue inspection fine pending."
          });
          return;
        }

        if (field) {
          setErrors(prev => ({
            ...prev,
            [field]: message
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            password_er: message || "Invalid login credentials."
          }));
        }
      } else {
        setErrors(prev => ({
          ...prev,
          status_er: "Server connection error. Please try again."
        }));
      }
    }
  }
  return (
    <div className="login">
      <div className="login-visual">
        <div className="login-visual-content">
          <span className="login-brand">ECOCYCLE</span>
          <h2>Recycle electronics responsibly</h2>
          <p>
            Track pickups, manage collections, and contribute to a
            cleaner planet — all from one dashboard.
          </p>
          <LoginIllustration />
        </div>

        <div className="login-blob login-blob--1" />
        <div className="login-blob login-blob--2" />
        <div className="login-blob login-blob--3" />

      </div>

      {/* Form Side */}
      <div className="login-panel">
        <div className="login-card">
          {penaltyInfo ? (
            <div className="penalty-restriction-card">
              {paySuccessMsg ? (
                <div className="penalty-success-wrapper">
                  <div className="penalty-badge-icon penalty-badge-icon--success">
                    <FiCheckCircle />
                  </div>
                  <span className="penalty-status-tag penalty-status-tag--success">
                    ACCOUNT RESTORED • FINE PAID
                  </span>
                  <h2>Payment Verified!</h2>
                  <p className="penalty-sub-desc">
                    {paySuccessMsg}
                  </p>

                  <div className="penalty-details-box penalty-details-box--success">
                    <div className="penalty-detail-item">
                      <span className="p-label">Penalty Reference</span>
                      <span className="p-val bold">#PEN-{penaltyInfo.penaltyId}</span>
                    </div>
                    <div className="penalty-detail-item">
                      <span className="p-label">Payment Status</span>
                      <span className="p-val fine-amount fine-amount--paid">
                        <FiCheck /> PAID
                      </span>
                    </div>
                  </div>

                  <div className="penalty-actions-group">
                    <button
                      type="button"
                      className="penalty-btn penalty-btn--pay"
                      onClick={() => {
                        setPenaltyInfo(null);
                        setPaySuccessMsg("");
                      }}
                    >
                      <FiLogIn /> Sign In to Your Account
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="penalty-restriction-header">
                    <div className="penalty-badge-icon">
                      <FiAlertTriangle />
                    </div>
                    <span className="penalty-status-tag">Access Restricted • Unpaid Fine</span>
                    <h2>Inspection Policy Violation</h2>
                    <p className="penalty-sub-desc">
                      Your account access is temporarily suspended due to an unfulfilled inspection deadline fine. Please clear your fine below to restore login access.
                    </p>
                  </div>

                  <div className="penalty-details-box">
                    <div className="penalty-detail-item">
                      <span className="p-label">Penalty Reference</span>
                      <span className="p-val bold">#PEN-{penaltyInfo.penaltyId}</span>
                    </div>
                    {penaltyInfo.deviceId && (
                      <div className="penalty-detail-item">
                        <span className="p-label">Associated Device</span>
                        <span className="p-val bold">#DEV-{String(penaltyInfo.deviceId).padStart(3, "0")}</span>
                      </div>
                    )}
                    <div className="penalty-detail-item">
                      <span className="p-label">Fine Amount Due</span>
                      <span className="p-val fine-amount">₹{penaltyInfo.penaltyAmount || 100}</span>
                    </div>
                    <div className="penalty-detail-item reason-item">
                      <span className="p-label">Violation Reason</span>
                      <span className="p-val reason-text">{penaltyInfo.reason || "Failure to complete device inspection within 24-hour extended timeframe."}</span>
                    </div>
                  </div>

                  <div className="penalty-actions-group">
                    <button
                      type="button"
                      className="penalty-btn penalty-btn--pay"
                      onClick={handlePayPenalty}
                      disabled={payingPenalty}
                    >
                      {payingPenalty ? (
                        <>
                          <FiRefreshCw className="spin-icon" /> Processing Payment...
                        </>
                      ) : (
                        <>
                          <FiCreditCard /> Pay Fine Now (₹{penaltyInfo.penaltyAmount || 100})
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="penalty-btn penalty-btn--back"
                      onClick={() => {
                        setPenaltyInfo(null);
                        setPaySuccessMsg("");
                      }}
                    >
                      <FiArrowLeft /> Back to Sign In
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="login-header">
                <div className="login-eyebrow">WELCOME BACK</div>
                <h1>Sign in</h1>
                <p>Access your e-waste management dashboard</p>
              </div>

              <form className="login-form" onSubmit={login_validation}>
                <div className="login-field">
                  <label>Username or email</label>
                  <input
                    type="text"
                    placeholder="Username or email"
                    name="email"
                    value={form_dta.email}
                    onChange={handleInputChange}
                    className={errors.email || errors.email_er ? "input-error" : ""}
                  />
                  {(errors.email || errors.email_er) && (
                    <div className="error-message">
                      {errors.email || errors.email_er}
                    </div>
                  )}
                </div>

                <div className="login-field">
                  <label>Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      name="password"
                      value={form_dta.password}
                      onChange={handleInputChange}
                      className={errors.password || errors.password_er ? "input-error" : ""}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={togglePasswordVisibility}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {(errors.password || errors.password_er) && (
                    <div className="error-message">
                      {errors.password || errors.password_er}
                    </div>
                  )}
                </div>
                {errors.status_er && (
                  <div className="error-message status-error">
                    {errors.status_er}
                  </div>
                )}
                <button type="submit" className="login-btn">
                  Login
                </button>
              </form>

              <div className="google-divider">
                <span>or</span>
              </div>

              <div className="google-login-container">
                <GoogleLogin
                  width="100%"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  theme="outline"
                  logo_alignment="center"
                  onSuccess={async (credentialResponse) => {
                    try {
                        const response = await axios.post(
                            "https://ecocycle.runasp.net/api/Login/GoogleLogin",
                            {
                                credential: credentialResponse.credential
                            }
                        );

                        console.log("Google login successful:", response.data);

                        localStorage.setItem("token", response.data.token);
                        localStorage.setItem("loginId", response.data.loginId);

                        if (response.data.technicianId) {
                            localStorage.setItem(
                                "technicianId",
                                response.data.technicianId
                            );
                        }

                        localStorage.setItem(
                            "firstName",
                            response.data.firstName
                        );

                        localStorage.setItem(
                            "roleId",
                            response.data.roleId
                        );

                        localStorage.setItem(
                            "role",
                            response.data.role
                        );

                        switch (response.data.role) {
                            case "Citizen":
                                navigate("/citizen");
                                break;

                            case "Administrator":
                                navigate("/admin");
                                break;

                            case "Collection Agent":
                                sessionStorage.setItem("justLoggedInCollectionAgent", "true");
                                navigate("/collectionagent/dashboard");
                                break;

                            case "Inspection Officer":
                                sessionStorage.setItem("justLoggedInInspectionTechnician", "true");
                                navigate("/technician_dashboard");
                                break;

                            case "Refurbishment Center":
                                navigate("/refurbishmententer_dashboard");
                                break;

                            case "Recycling Center":
                                navigate("/recyclingenter_dashboard");
                                break;

                            default:
                                console.log(
                                    "Invalid role:",
                                    response.data.role
                                );
                                navigate("/");
                                break;
                        }

                    } catch (error) {
                        console.error("Google login error:", error);

                        if (error.response?.data?.field === "penalty_blocked" || error.response?.data?.penaltyData) {
                            setPenaltyInfo(error.response.data.penaltyData || {
                                penaltyId: 1,
                                penaltyAmount: 100,
                                reason: error.response.data.message || "Overdue inspection fine pending."
                            });
                            return;
                        }

                        const message =
                            error.response?.data?.message ||
                            "Google login failed.";

                        setErrors(prev => ({
                            ...prev,
                            status_er: message
                        }));
                    }
                }}

                onError={() => {
                    console.error("Google login failed.");

                    setErrors(prev => ({
                        ...prev,
                        status_er: "Google login failed. Please try again."
                    }));
                }}
            />
              </div>

              <div className="login-links">
                <p>
                  <a href="/forgot-password">Forgot password?</a>
                </p>
                <p>
                  Don't have an account?{" "}
                  <a href="/signup">Sign up</a>
                </p>
                <p>
                  <a href="/" className="login-back">← Back to home</a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
export default Login;