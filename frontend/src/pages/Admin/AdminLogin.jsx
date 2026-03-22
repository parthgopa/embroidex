import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import styles from "./AdminLogin.module.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/auth/login", form);
      const token = res.data.token;
      
      localStorage.setItem("token", token);

      const userRes = await API.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userRes.data.role !== "admin") {
        localStorage.removeItem("token");
        alert("Access denied. Admin credentials required.");
        return;
      }

      navigate("/admin/dashboard");
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`container-box ${styles.card}`}>
        <div className={styles.header}>
          <div className={styles.icon}>🔐</div>
          <h2 className={styles.title}>Admin Login</h2>
          <p className={styles.subtitle}>Access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
              className="input-custom"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className={`btn-primary-custom ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login as Admin"}
          </button>

          {/* If not admin acoount the create account button */}
          <p>
            Don't have an admin account? <a href="/admin/signup">Create one</a>
          </p>
        </form>

        <div className={styles.footer}>
          <p>Admin access only. Unauthorized access is prohibited.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
