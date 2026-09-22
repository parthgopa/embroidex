import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import {
  MdMailOutline,
  MdLockOutline,
  MdVisibility,
  MdVisibilityOff,
  MdArrowBack,
  MdCheckCircle,
  MdErrorOutline,
  MdRefresh,
} from "react-icons/md";
import API from "../services/api";
import { signInWithGoogle } from "../services/firebase";
import authBanner from "../assets/auth-banner.jpg";
import styles from "./Login.module.css";

const Login = () => {
  const navigate = useNavigate();

  // "login" | "forgot_email" | "forgot_otp" | "forgot_reset"
  const [view, setView] = useState("login");

  // Login form
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // Forgot password states
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [deactivated, setDeactivated] = useState(false);

  const otpInputRef = useRef(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (view === "forgot_otp" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [view, countdown]);

  // Auto-focus OTP input on enter
  useEffect(() => {
    if (view === "forgot_otp" && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [view]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    setDeactivated(false);
    try {
      const result = await signInWithGoogle();
      const fbUser = result.user;
      const idToken = await fbUser.getIdToken();

      const res = await API.post("/auth/google-login", {
        email: fbUser.email,
        name: fbUser.displayName || "",
        photo_url: fbUser.photoURL || "",
        id_token: idToken,
      });

      localStorage.setItem("token", res.data.token);
      window.location.href = "/seller/my-designs";
    } catch (err) {
      console.error("Google sign-in error:", err);
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        return;
      }
      const message = err.response?.data?.error || err.message || "Google sign-in failed";
      if (err.response?.status === 403) {
        setDeactivated(true);
      } else {
        setError(message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDeactivated(false);
    setSuccessMsg(null);

    try {
      const res = await API.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      window.location.href = "/seller/my-designs";
    } catch (err) {
      const status = err.response?.status;
      let message = err.response?.data?.error || "Login failed";
      if (message === "Invalid credentials" || message.toLowerCase().includes("invalid credential")) {
        message = "Invalid password or email Id";
      }
      if (status === 403) {
        setDeactivated(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send Reset OTP
  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      return setError("Please enter your registered email address.");
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await API.post("/auth/forgot-password", { email: cleanEmail });
      setSuccessMsg(res.data.message || `Verification code sent to ${cleanEmail}`);
      setView("forgot_otp");
      setCountdown(60);
      setOtp("");
    } catch (err) {
      setError(err.response?.data?.error || "Could not send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Auto-verify OTP when 6 digits are typed
  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(val);
    setError(null);

    if (val.length === 6) {
      triggerVerifyOtp(val);
    }
  };

  const triggerVerifyOtp = async (code) => {
    setVerifyingOtp(true);
    setError(null);

    try {
      const res = await API.post("/auth/verify-reset-otp", {
        email: resetEmail.trim().toLowerCase(),
        otp: code,
      });
      setResetToken(res.data.reset_token);
      setView("forgot_reset");
      setSuccessMsg("Code verified successfully! Now create your new password.");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid verification code. Please check and try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Resend reset code
  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const res = await API.post("/auth/forgot-password", {
        email: resetEmail.trim().toLowerCase(),
      });
      setSuccessMsg(res.data.message || "A new verification code has been sent!");
      setCountdown(60);
      setOtp("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  // Step 3: Set new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      return setError("Password must be at least 6 characters long.");
    }
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match. Please re-enter.");
    }

    setLoading(true);
    setError(null);

    try {
      const res = await API.post("/auth/reset-password", {
        email: resetEmail.trim().toLowerCase(),
        reset_token: resetToken,
        new_password: newPassword,
      });

      // Return to login with pre-filled email
      setView("login");
      setForm((prev) => ({ ...prev, email: resetEmail, password: "" }));
      setSuccessMsg(res.data.message || "Password has been successfully reset! Please log in.");
      setNewPassword("");
      setConfirmPassword("");
      setResetToken("");
      setOtp("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchBackToLogin = () => {
    setView("login");
    setError(null);
    setSuccessMsg(null);
    setOtp("");
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.authContainer}>
        {/* LEFT COLUMN: AUTH FORMS */}
        <div className={styles.formSide}>
          <div className={styles.formInner}>
            {deactivated && (
            <div className={styles.deactivatedBanner}>
              <strong>Account Deactivated</strong>
              <p>Your account has been deactivated by the admin. To restore access, please contact Admin.</p>
            </div>
          )}

          {error && (
            <div className={styles.errorBanner}>
              <MdErrorOutline size={18} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className={styles.successBanner}>
              <MdCheckCircle size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN VIEW */}
          {view === "login" && (
            <>
              <div className={styles.header}>
                <h2 className={styles.title}>Welcome Back</h2>
                <p className={styles.subtitle}>Sign in to access your Embroidex workspace</p>
              </div>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email Address</label>
                  <div className={styles.inputWrapper}>
                    <MdMailOutline size={19} className={styles.inputIcon} />
                    <input
                      type="email"
                      name="email"
                      placeholder="name@example.com"
                      className={`input-custom ${styles.inputField}`}
                      onChange={handleChange}
                      value={form.email}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <div className={styles.labelRow}>
                    <label className={styles.label}>Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(form.email || "");
                        setView("forgot_email");
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className={styles.forgotBtn}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className={styles.inputWrapper}>
                    <MdLockOutline size={19} className={styles.inputIcon} />
                    <input
                      type={showLoginPw ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      className={`input-custom ${styles.inputField}`}
                      onChange={handleChange}
                      value={form.password}
                      required
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowLoginPw(!showLoginPw)}
                      aria-label="Toggle password visibility"
                    >
                      {showLoginPw ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`btn-primary-custom ${styles.submitBtn}`}
                  disabled={loading || googleLoading}
                >
                  {loading ? "Logging in..." : "Sign In"}
                </button>
              </form>

              <div className={styles.divider}>
                <span>or continue with</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className={styles.googleBtn}
                disabled={loading || googleLoading}
              >
                <FcGoogle size={22} />
                <span>{googleLoading ? "Connecting with Google..." : "Continue with Google"}</span>
              </button>

              <div className={styles.footer}>
                <p className={styles.footerText}>
                  Don't have an account?{" "}
                  <Link to="/signup" className={styles.link}>
                    Create Account
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* 2. FORGOT PASSWORD - EMAIL INPUT */}
          {view === "forgot_email" && (
            <>
              <button type="button" onClick={switchBackToLogin} className={styles.backLink}>
                <MdArrowBack size={18} />
                <span>Back to Login</span>
              </button>

              <div className={styles.header}>
                <h2 className={styles.title}>Forgot Password</h2>
                <p className={styles.subtitle}>
                  Enter your registered email address and we'll send you a 6-digit verification code.
                </p>
              </div>

              <form onSubmit={handleSendResetOtp} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Registered Email Address</label>
                  <div className={styles.inputWrapper}>
                    <MdMailOutline size={19} className={styles.inputIcon} />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      className={`input-custom ${styles.inputField}`}
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        setError(null);
                      }}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`btn-primary-custom ${styles.submitBtn}`}
                  disabled={loading}
                >
                  {loading ? "Sending Code..." : "Send Verification Code"}
                </button>
              </form>
            </>
          )}

          {/* 3. FORGOT PASSWORD - 6-DIGIT OTP AUTO-CHECK */}
          {view === "forgot_otp" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setView("forgot_email");
                  setError(null);
                }}
                className={styles.backLink}
              >
                <MdArrowBack size={18} />
                <span>Change Email</span>
              </button>

              <div className={styles.header}>
                <h2 className={styles.title}>Enter 6-Digit Code</h2>
                <p className={styles.subtitle}>
                  We sent a verification code to <strong>{resetEmail}</strong>. Code is automatically checked once 6 digits are entered.
                </p>
              </div>

              <div className={styles.otpCardBox}>
                <label className={styles.otpLabel}>6-Digit Verification Code</label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="------"
                  className={styles.otpBigInput}
                  disabled={verifyingOtp}
                  autoComplete="one-time-code"
                />

                {verifyingOtp && (
                  <div className={styles.verifyingIndicator}>
                    <span className={styles.spinner} />
                    <span>Verifying code automatically...</span>
                  </div>
                )}

                <div className={styles.resendArea}>
                  <span className={styles.resendText}>Didn't receive the code?</span>
                  {countdown > 0 ? (
                    <span className={styles.countdownBadge}>Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resending || verifyingOtp}
                      className={styles.resendActionBtn}
                    >
                      <MdRefresh size={16} />
                      <span>{resending ? "Sending..." : "Resend Code"}</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* 4. FORGOT PASSWORD - NEW PASSWORD */}
          {view === "forgot_reset" && (
            <>
              <div className={styles.header}>
                <h2 className={styles.title}>Set New Password</h2>
                <p className={styles.subtitle}>Create a strong new password for your account</p>
              </div>

              <form onSubmit={handleResetPassword} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>New Password</label>
                  <div className={styles.inputWrapper}>
                    <MdLockOutline size={19} className={styles.inputIcon} />
                    <input
                      type={showNewPw ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      className={`input-custom ${styles.inputField}`}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError(null);
                      }}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowNewPw(!showNewPw)}
                      aria-label="Toggle password visibility"
                    >
                      {showNewPw ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Confirm New Password</label>
                  <div className={styles.inputWrapper}>
                    <MdLockOutline size={19} className={styles.inputIcon} />
                    <input
                      type={showConfirmPw ? "text" : "password"}
                      placeholder="Re-enter your new password"
                      className={`input-custom ${styles.inputField}`}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      aria-label="Toggle password visibility"
                    >
                      {showConfirmPw ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`btn-primary-custom ${styles.submitBtn}`}
                  disabled={loading}
                >
                  {loading ? "Updating Password..." : "Update Password & Sign In"}
                </button>
              </form>
            </>
          )}
          </div>
        </div>

        {/* RIGHT COLUMN: CONCEPT ARTWORK BANNER */}
        <div className={styles.bannerSide}>
          <img src={authBanner} alt="Embroidex Digital Design" className={styles.bannerImg} />
          <div className={styles.bannerOverlay}>
            <div className={styles.bannerBadge}>
              <span className={styles.pulseDot} />
              <span>Digital Embroidery Platform</span>
            </div>
            <h3 className={styles.bannerTitle}>Precision Craft, Digital Velocity.</h3>
            <p className={styles.bannerText}>
              Transform creative vector stitch designs into production-ready embroidery files with state-of-the-art tooling.
            </p>
            <div className={styles.featurePills}>
              <span className={styles.pill}>✨ Precision Stitches</span>
              <span className={styles.pill}>🎨 Thread Palettes</span>
              <span className={styles.pill}>⚡ Instant EMB / DST</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;