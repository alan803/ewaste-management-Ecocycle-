import React, { useState } from 'react'
import {
    validate_password,
    validate_confirm_password
} from "../../utils/validation"
import "./Reset_passwprd.css"
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Reset_passwprd() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [form_dta, set_form_dta] = useState({
        password: "",
        confirmPassword: ""
    });
    const [errors, set_errors] = useState({
        password_er: "",
        confirmPassword_er: ""
    });

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    function handleInputChange(e) {
        const { name, value } = e.target;
        set_form_dta(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === "password") {
            const passwordError = validate_password(value);
            set_errors(prev => ({
                ...prev,
                password_er: passwordError
            }));
        }
        if (name === "confirmPassword") {
            const passwordError = validate_confirm_password(value, form_dta.password);
            set_errors(prev => ({
                ...prev,
                confirmPassword_er: passwordError
            }));
        }
    }

    async function reset_password(e) {
        e.preventDefault();
        const newErrors = {
            password_er: validate_password(form_dta.password),
            confirmPassword_er: validate_confirm_password(form_dta.confirmPassword, form_dta.password),
        };
        set_errors(newErrors);

        if (Object.values(newErrors).some(err => err !== "")) {
            return;
        }

        setLoading(true);

        const email = sessionStorage.getItem("resetEmail");
        const otp = sessionStorage.getItem("resetOtp");

        try {
            await axios.post(
                "https://ecocycle.runasp.net/api/Login/ResetPassword",
                {
                    email: email,
                    otp: otp,
                    newPassword: form_dta.password,
                    confirmPassword: form_dta.confirmPassword
                }
            );
            setSuccess(true);
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (error) {
            console.log(error);
            set_errors(prev => ({
                ...prev,
                password_er: "Failed to reset password. Please try again."
            }));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="reset-password">
            <div className="reset-password-visual">
                <div className="reset-password-visual-content">
                    <span className="reset-password-brand">ECOCYCLE</span>
                    <h2>Reset Your Password</h2>
                    <p>
                        Create a new secure password for your account. Make sure it's
                        strong and memorable for your safety.
                    </p>
                </div>
                <div className="reset-password-blob reset-password-blob--1" />
                <div className="reset-password-blob reset-password-blob--2" />
                <div className="reset-password-blob reset-password-blob--3" />
            </div>

            <div className="reset-password-panel">
                <div className="reset-password-card">
                    <div className="reset-password-header">
                        <div className="reset-password-eyebrow">PASSWORD RESET</div>
                        <h1>New Password</h1>
                        <p>Enter your new password below</p>
                    </div>

                    {!success ? (
                        <form className="reset-password-form" onSubmit={reset_password}>
                            <div className="reset-password-field">
                                <label>New Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        name="password"
                                        value={form_dta.password}
                                        onChange={handleInputChange}
                                        className={errors.password_er ? "input-error" : ""}
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
                                {errors.password_er && <div className="error-message">{errors.password_er}</div>}
                            </div>

                            <div className="reset-password-field">
                                <label>Confirm Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        name="confirmPassword"
                                        value={form_dta.confirmPassword}
                                        onChange={handleInputChange}
                                        className={errors.confirmPassword_er ? "input-error" : ""}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={toggleConfirmPasswordVisibility}
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {errors.confirmPassword_er && <div className="error-message">{errors.confirmPassword_er}</div>}
                            </div>

                            <button type="submit" className="reset-password-btn" disabled={loading}>
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>
                        </form>
                    ) : (
                        <div className="success-message">
                            <div className="success-icon">✓</div>
                            <h3>Password Reset Successful!</h3>
                            <p>Your password has been successfully reset. Redirecting to login...</p>
                        </div>
                    )}

                    <div className="reset-password-footer">
                        <p><a href="/login">Back to Login</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Reset_passwprd;