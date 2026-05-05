import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import styles from "./Login.module.css";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deactivated, setDeactivated] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

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