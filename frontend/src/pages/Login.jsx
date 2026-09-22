import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import API from "../services/api";
import { signInWithGoogle } from "../services/firebase";
import styles from "./Login.module.css";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deactivated, setDeactivated] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
    try {
      const res = await API.post("/auth/login", form);
      localStorage.setItem("token", res.data.token);
      window.location.href = "/seller/my-designs";
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.error || "Login failed";
      if (status === 403) {
        setDeactivated(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={`container-box ${styles.card}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Welcome Back</h2>
          <p className={styles.subtitle}>Login to access your account</p>
        </div>

        {deactivated && (
          <div className={styles.deactivatedBanner}>
            <strong>Account Deactivated</strong>
            <p>Your account has been deactivated by the admin. To restore access, please contact Admin.</p>
          </div>
        )}

        {error && (
          <div className={styles.errorBanner}>{error}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className="input-custom"
              onChange={handleChange}
              value={form.email}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              className="input-custom"
              onChange={handleChange}
              value={form.password}
              required
            />
          </div>

          <button 
            type="submit" 
            className={`btn-primary-custom ${styles.submitBtn}`}
            disabled={loading || googleLoading}
          >
            {loading ? "Logging in..." : "Login"}
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
            Don't have an account? 
            <Link to="/signup" className={styles.link}> Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;