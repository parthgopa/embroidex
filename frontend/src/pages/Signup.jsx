import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdVisibility, MdVisibilityOff, MdMailOutline, MdArrowBack, MdLockOutline, MdCheckCircle, MdErrorOutline } from "react-icons/md";
import { useAuth } from "../context/authContext";
import API from "../services/api";
import styles from "./Signup.module.css";

const Signup = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  // "form" | "otp"
  const [step, setStep] = useState("form");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const otpInputRef = useRef(null);

  // Timer countdown for resending OTP
  useEffect(() => {
    let timer;
    if (step === "otp" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Focus OTP input on transition
  useEffect(() => {
    if (step === "otp" && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  const handleChange = (e) => {
    setErrorMsg("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (form.password !== form.confirmPassword) {
      return setErrorMsg("Passwords do not match. Please re-enter.");
    }

    if (form.password.length < 6) {
      return setErrorMsg("Password must be at least 6 characters long.");
    }

    setLoading(true);

    try {
      const res = await API.post("/auth/send-signup-otp", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      setSuccessMsg(res.data?.message || `Verification code sent to ${form.email}`);
      setStep("otp");
      setCountdown(60);
      setOtp("");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setErrorMsg("");
    setSuccessMsg("");
    setResending(true);

    try {
      const res = await API.post("/auth/send-signup-otp", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      setSuccessMsg(res.data?.message || "A new verification code has been sent!");
      setCountdown(60);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to resend verification code.");
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify OTP & Create Account
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      return setErrorMsg("Please enter the complete 6-digit verification code.");
    }

    setLoading(true);

    try {
      const res = await API.post("/auth/verify-signup-otp", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        otp: cleanOtp,
      });

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        if (refreshUser) await refreshUser();
      }

      alert("✓ Account created and verified successfully!");
      navigate("/");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Invalid verification code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(val);
    setErrorMsg("");
  };

  return (
    <div className={styles.wrapper}>
      <div className={`container-box ${styles.card}`}>
        {step === "form" ? (
          <>
            {/* STEP 1: INITIAL SIGNUP FORM */}
            <div className={styles.header}>
              <h2 className={styles.title}>Create Account</h2>
              <p className={styles.subtitle}>Join Embroidex and start creating</p>
            </div>

            {errorMsg && (
              <div className={styles.errorBanner}>
                <MdErrorOutline size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSendOtp} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  className="input-custom"
                  onChange={handleChange}
                  value={form.name}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  className="input-custom"
                  onChange={handleChange}
                  value={form.email}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Password *</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create password (min. 6 characters)"
                    className="input-custom"
                    onChange={handleChange}
                    value={form.password}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Confirm Password *</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    className="input-custom"
                    onChange={handleChange}
                    value={form.confirmPassword}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className={`btn-primary-custom ${styles.submitBtn}`}
                disabled={loading}
              >
                {loading ? "Sending Verification Code..." : "Continue with Email Verification"}
              </button>
            </form>

            <div className={styles.footer}>
              <p className={styles.footerText}>
                Already have an account? 
                <Link to="/login" className={styles.link}> Login</Link>
              </p>
            </div>
          </>
        ) : (
          <>
            {/* STEP 2: OTP VERIFICATION SCREEN */}
            <div className={styles.header}>
              <div className={styles.otpIconBadge}>
                <MdMailOutline size={28} />
              </div>
              <h2 className={styles.title}>Verify Your Email</h2>
              <p className={styles.subtitle}>
                We sent a 6-digit verification code to:
              </p>
              <div className={styles.emailPill}>
                <span>{form.email}</span>
                <button
                  type="button"
                  className={styles.changeEmailBtn}
                  onClick={() => {
                    setStep("form");
                    setErrorMsg("");
                  }}
                  title="Change email"
                >
                  Edit
                </button>
              </div>
            </div>

            {successMsg && (
              <div className={styles.successBanner}>
                <MdCheckCircle size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className={styles.errorBanner}>
                <MdErrorOutline size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label} style={{ textAlign: "center", display: "block" }}>
                  Enter 6-Digit OTP
                </label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="------"
                  className={`input-custom ${styles.otpInput}`}
                  value={otp}
                  onChange={handleOtpChange}
                  required
                />
              </div>

              <button 
                type="submit" 
                className={`btn-primary-custom ${styles.submitBtn}`}
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying & Creating Account..." : "Verify & Complete Signup"}
              </button>

              <div className={styles.resendSection}>
                {countdown > 0 ? (
                  <span className={styles.countdownText}>
                    Resend code in <strong>{countdown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    className={styles.resendBtn}
                    onClick={handleResendOtp}
                    disabled={resending}
                  >
                    {resending ? "Sending code..." : "Resend Verification Code"}
                  </button>
                )}
              </div>

              <button
                type="button"
                className={styles.backToFormBtn}
                onClick={() => {
                  setStep("form");
                  setErrorMsg("");
                }}
              >
                <MdArrowBack size={16} /> Back to Edit Details
              </button>
            </form>

            <div className={styles.footer}>
              <p className={styles.footerText}>
                Already have an account? 
                <Link to="/login" className={styles.link}> Login</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;