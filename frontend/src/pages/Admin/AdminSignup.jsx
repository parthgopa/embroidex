import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import styles from "./AdminSignup.module.css";

const AdminSignup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    adminKey: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      return alert("Passwords do not match");
    }

    if (form.password.length < 6) {
      return alert("Password must be at least 6 characters");
    }

    setLoading(true);

    try {
      await API.post("/auth/admin-signup", {
        name: form.name,
        email: form.email,
        password: form.password,
        admin_key: form.adminKey,
      });

      navigate("/admin");
    } catch (err) {
      alert(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`container-box ${styles.card}`}>
        <div className={styles.header}>
          <div className={styles.icon}>👤</div>
          <h2 className={styles.title}>Create Admin Account</h2>
          <p className={styles.subtitle}>Register as a platform administrator</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              className="input-custom"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="admin@embroidex.com"
              className="input-custom"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              className="input-custom"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Re-enter password"
              className="input-custom"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Admin Key</label>
            <input
              type="password"
              name="adminKey"
              placeholder="Enter secret admin key"
              className="input-custom"
              value={form.adminKey}
              onChange={handleChange}
              required
            />
            <small className={styles.hint}>
              Contact system administrator for the admin key
            </small>
          </div>

          <button
            type="submit"
            className={`btn-primary-custom ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Admin Account"}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Already have an account?{" "}
            <a href="/admin" className={styles.link}>
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;
