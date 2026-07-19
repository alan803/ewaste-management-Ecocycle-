import "./Login.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useState } from "react";

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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login">
      {/* Illustration Side */}
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
          <div className="login-header">
            <div className="login-eyebrow">WELCOME BACK</div>
            <h1>Sign in</h1>
            <p>Access your e-waste management dashboard</p>
          </div>

          <form className="login-form">
            <div className="login-field">
              <label>Username or email</label>
              <input
                type="text"
                placeholder="Username or email"
                required
              />
            </div>

            <div className="login-field">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
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
            </div>

            <button type="submit" className="login-btn">
              Login
            </button>
          </form>

          <div className="google-divider">
            <span>or</span>
          </div>

          <button className="google-btn">
            <img src="https://www.google.com/favicon.ico" alt="Google" width="20" height="20" />
            Sign in with Google
          </button>

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
        </div>
      </div>
    </div>
  );
}

export default Login;