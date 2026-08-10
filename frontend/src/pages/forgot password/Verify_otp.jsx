import "./Verify_otp.css";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function VerifyOtp() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        const savedEmail = sessionStorage.getItem("resetEmail");

        if (!savedEmail) {
            navigate("/forgot-password");
            return;
        }

        setEmail(savedEmail);
    }, [navigate]);

    const handleOtpChange = (e) => {
        const value = e.target.value;

        // Allow only numbers
        if (!/^\d*$/.test(value)) {
            return;
        }

        // Maximum 6 digits
        if (value.length > 6) {
            return;
        }

        setOtp(value);
        setError("");
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!otp) {
            setError("Please enter the OTP.");
            return;
        }

        if (otp.length !== 6) {
            setError("OTP must contain 6 digits.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                "https://localhost:7102/api/Login/VerifyOtp",
                {
                    email: email,
                    otp: otp
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            console.log(response.data);

            sessionStorage.setItem("otpVerified", "true");
            sessionStorage.setItem("resetOtp", otp);

            setSuccess("OTP verified successfully.");

            navigate("/reset-password");

        } catch (error) {
            if (error.response) {
                setError(
                    error.response.data.message ||
                    "Invalid or expired OTP."
                );
            } else {
                setError(
                    "Unable to connect to server."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError("");
        setSuccess("");

        setResending(true);

        try {
            const response = await axios.post(
                "https://localhost:7102/api/Login/ForgotPassword",
                {
                    email: email
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            console.log(response.data);

            setOtp("");

            setSuccess(
                "A new OTP has been sent to your email."
            );

        } catch (error) {
            if (error.response) {
                setError(
                    error.response.data.message ||
                    "Unable to resend OTP."
                );
            } else {
                setError(
                    "Unable to connect to server."
                );
            }
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="verify-otp">
            <div className="verify-otp-visual">
                <div className="verify-otp-visual-content">
                    <span className="verify-otp-brand">ECOCYCLE</span>
                    <h2>Verify Your Identity</h2>
                    <p>
                        Enter the 6-digit code we sent to your email to verify
                        your identity and reset your password securely.
                    </p>
                </div>
                <div className="verify-otp-blob verify-otp-blob--1" />
                <div className="verify-otp-blob verify-otp-blob--2" />
                <div className="verify-otp-blob verify-otp-blob--3" />
            </div>

            <div className="verify-otp-panel">
                <div className="verify-otp-card">
                    <div className="verify-otp-header">
                        <div className="verify-otp-eyebrow">OTP VERIFICATION</div>
                        <h1>Enter OTP</h1>
                        <p>
                            We've sent a 6-digit code to <strong>{email}</strong>
                        </p>
                    </div>

                    <form className="verify-otp-form" onSubmit={handleVerifyOtp}>
                        <div className="verify-otp-field">
                            <label>OTP Code</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength="6"
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChange={handleOtpChange}
                                className={error ? "input-error" : ""}
                            />
                            {error && <div className="error-message">{error}</div>}
                            {success && <div className="success-message">{success}</div>}
                        </div>

                        <button
                            type="submit"
                            className="verify-otp-btn"
                            disabled={loading}
                        >
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>
                    </form>

                    <div className="resend-section">
                        <p>Didn't receive the code?</p>
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resending}
                            className="resend-otp-btn"
                        >
                            {resending ? "Sending..." : "Resend OTP"}
                        </button>
                    </div>

                    <div className="verify-otp-footer">
                        <p>Wrong email? <a href="/forgot-password">Change email</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VerifyOtp;