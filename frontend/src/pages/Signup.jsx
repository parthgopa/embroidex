import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MdVisibility,
  MdVisibilityOff,
  MdMailOutline,
  MdArrowBack,
  MdLockOutline,
  MdPersonOutline,
  MdCheckCircle,
  MdErrorOutline,
  MdRefresh,
} from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../context/authContext";
import API from "../services/api";
import { signInWithGoogle } from "../services/firebase";
import authBanner from "../assets/auth-banner.jpg";
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setErrorMsg("");
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
      await refreshUser();
      window.location.href = "/seller/my-designs";
    } catch (err) {
      console.error("Google sign-up error:", err);
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        return;
      }
      setErrorMsg(err.response?.data?.error || err.message || "Google sign-up failed");
    } finally {
      setGoogleLoading(false);
    }
  };

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
      setOtp("");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to resend verification code.");
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify OTP & Create Account
  const handleVerifyOtp = async (codeToVerify) => {
    const finalOtp = (codeToVerify || otp).trim();
    if (finalOtp.length !== 6) {
      return setErrorMsg("Please enter the complete 6-digit verification code.");
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await API.post("/auth/verify-signup-otp", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        otp: finalOtp,
      });

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
      }

      setSuccessMsg("Account created and verified successfully!");
      setTimeout(() => {
        window.location.href = "/seller/my-designs";
      }, 600);
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

    // Auto verify as soon as 6 digits are typed
    if (val.length === 6) {
      handleVerifyOtp(val);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.authContainer}>
        {/* LEFT COLUMN: FORM SIDE */}
        <div className={styles.formSide}>
          <div className={styles.formInner}>
            {step === "form" ? (
            <>
              {/* STEP 1: INITIAL SIGNUP FORM */}
              <div className={styles.header}>
                <h2 className={styles.title}>Create Account</h2>
                <p className={styles.subtitle}>Join Embroidex and start creating or trading embroidery designs</p>
              </div>

              {errorMsg && (
                <div className={styles.errorBanner}>
                  <MdErrorOutline size={18} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className={styles.successBanner}>
                  <MdCheckCircle size={18} />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSendOtp} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name *</label>
                  <div className={styles.inputWrapper}>
                    <MdPersonOutline size={19} className={styles.inputIcon} />
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      className={`input-custom ${styles.inputField}`}
                      onChange={handleChange}
                      value={form.name}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Email Address *</label>
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
                  <label className={styles.label}>Password *</label>
                  <div className={styles.inputWrapper}>
                    <MdLockOutline size={19} className={styles.inputIcon} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Min. 6 characters"
                      className={`input-custom ${styles.inputField}`}
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
                  <div className={styles.inputWrapper}>
                    <MdLockOutline size={19} className={styles.inputIcon} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Re-enter password"
                      className={`input-custom ${styles.inputField}`}
                      onChange={handleChange}
                      value={form.confirmPassword}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className={styles.eyeButton}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showConfirmPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`btn-primary-custom ${styles.submitBtn}`}
                  disabled={loading || googleLoading}
                >
                  {loading ? "Sending Verification Code..." : "Continue with Email Verification"}
                </button>
              </form>

              <div className={styles.divider}>
                <span>or sign up with</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignup}
                className={styles.googleBtn}
                disabled={loading || googleLoading}
              >
                <FcGoogle size={22} />
                <span>{googleLoading ? "Connecting with Google..." : "Sign up with Google"}</span>
              </button>

              <div className={styles.footer}>
                <p className={styles.footerText}>
                  Already have an account?{" "}
                  <Link to="/login" className={styles.link}>
                    Login
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* STEP 2: OTP VERIFICATION SCREEN */}
              <button
                type="button"
                className={styles.backLink}
                onClick={() => {
                  setStep("form");
                  setErrorMsg("");
                }}
              >
                <MdArrowBack size={18} />
                <span>Back to Edit Details</span>
              </button>

              <div className={styles.header}>
                <h2 className={styles.title}>Verify Your Email</h2>
                <p className={styles.subtitle}>
                  We sent a 6-digit code to <strong>{form.email}</strong>. It will be verified automatically when entered.
                </p>
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

              <div className={styles.otpCardBox}>
                <label className={styles.otpLabel}>6-Digit Verification Code</label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="------"
                  className={styles.otpBigInput}
                  value={otp}
                  onChange={handleOtpChange}
                  disabled={loading}
                />

                {loading && (
                  <div className={styles.verifyingIndicator}>
                    <span className={styles.spinner} />
                    <span>Verifying code & activating account...</span>
                  </div>
                )}

                <div className={styles.resendArea}>
                  <span className={styles.resendText}>Didn't get the code?</span>
                  {countdown > 0 ? (
                    <span className={styles.countdownBadge}>Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      className={styles.resendActionBtn}
                      onClick={handleResendOtp}
                      disabled={resending || loading}
                    >
                      <MdRefresh size={16} />
                      <span>{resending ? "Sending..." : "Resend Code"}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.footer}>
                <p className={styles.footerText}>
                  Already have an account?{" "}
                  <Link to="/login" className={styles.link}>
                    Login
                  </Link>
                </p>
              </div>
            </>
          )}
          </div>
        </div>

        {/* RIGHT COLUMN: CONCEPT ARTWORK BANNER */}
        <div className={styles.bannerSide}>
          <img src={authBanner} alt="Embroidex Embroidery Software Art" className={styles.bannerImg} />
          <div className={styles.bannerOverlay}>
            <div className={styles.bannerBadge}>
              <span className={styles.pulseDot} />
              <span>Digital Embroidery Platform</span>
            </div>
            <h3 className={styles.bannerTitle}>Craft Elevated. Stitches Mastered.</h3>
            <p className={styles.bannerText}>
              Empower your textile creativity with precision stitch engines, color-managed thread palettes, and instantaneous file export.
            </p>
            <div className={styles.featurePills}>
              <span className={styles.pill}>🧵 Silk & Metallic Palettes</span>
              <span className={styles.pill}>💎 High-Density Stitching</span>
              <span className={styles.pill}>🛡️ Verified Pattern Security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;