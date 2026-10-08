import "./Forgot_password.css";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { validate_email } from "../../utils/validation";

function Forgot_password() {
    const navigate = useNavigate();

    const [form_dta, set_form_dta] = useState({
        email: ""
    });

    const [error, set_error] = useState({
        email_er: ""
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        set_form_dta(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === "email") {
            const emailError = validate_email(value);

            set_error(prev => ({
                ...prev,
                email_er: emailError
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const emailError = validate_email(form_dta.email);

        set_error({
            email_er: emailError
        });

        if (emailError) {
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                "https://ecocycle.runasp.net/api/Login/ForgotPassword",
                {
                    email: form_dta.email
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            console.log(response.data);

            // Save email temporarily for OTP verification
            sessionStorage.setItem(
                "resetEmail",
                form_dta.email
            );

            // Redirect to OTP page
            navigate("/verify-otp");

        } catch (error) {

            if (error.response) {

                set_error({
                    email_er:
                        error.response.data.message ||
                        "Unable to send OTP."
                });

            } else {

                set_error({
                    email_er: "Unable to connect to server."
                });
            }

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-password">

            <div className="forgot-password-visual">

                <div className="forgot-password-visual-content">

                    <span className="forgot-password-brand">
                        ECOCYCLE
                    </span>

                    <h2>Reset Your Password</h2>

                    <p>
                        Forgot your password? No worries!
                        Enter your email address and we'll
                        send you a verification OTP.
                    </p>

                </div>

                <div className="forgot-password-blob forgot-password-blob--1" />
                <div className="forgot-password-blob forgot-password-blob--2" />
                <div className="forgot-password-blob forgot-password-blob--3" />

            </div>


            <div className="forgot-password-panel">

                <div className="forgot-password-card">

                    <div className="forgot-password-header">

                        <div className="forgot-password-eyebrow">
                            PASSWORD RECOVERY
                        </div>

                        <h1>Forgot Password</h1>

                        <p>
                            Enter your email to receive a verification OTP
                        </p>

                    </div>


                    <form
                        className="forgot-password-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="forgot-password-field">

                            <label>Email Address</label>

                            <input
                                type="email"
                                placeholder="Enter your email address"
                                name="email"
                                value={form_dta.email}
                                onChange={handleChange}
                                className={
                                    error.email_er
                                        ? "input-error"
                                        : ""
                                }
                            />

                            {error.email_er && (
                                <div className="error-message">
                                    {error.email_er}
                                </div>
                            )}

                        </div>


                        <button
                            type="submit"
                            className="forgot-password-btn"
                            disabled={loading}
                        >
                            {loading
                                ? "Sending OTP..."
                                : "Send OTP"}
                        </button>

                    </form>


                    <div className="forgot-password-footer">

                        <p>
                            Remember your password?{" "}
                            <a href="/login">
                                Sign in
                            </a>
                        </p>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Forgot_password;