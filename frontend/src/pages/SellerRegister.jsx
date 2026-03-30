import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import styles from "./SellerRegister.module.css";

const SellerRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    mobile_number: "",
    business_website: "",
    business_address: "",
  });
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // If already a seller, redirect to My Designs page
  useEffect(() => {
    const checkSellerStatus = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await API.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // If already a seller, redirect to My Designs
        if (res.data.is_seller) {
          navigate("/seller/my-designs");
        }
      } catch (err) {
        console.error("Failed to check seller status", err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkSellerStatus();
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.mobile_number || !form.business_address) {
      return alert("Mobile number and business address are required");
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      await API.post("/auth/register-seller", form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Registration successful! You can now upload designs.");
      navigate("/seller/upload");
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className={styles.wrapper}>
        <div className={`container-box ${styles.card}`}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-light)' }}>Checking status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={`container-box ${styles.card}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Become a Seller</h2>
          <p className={styles.subtitle}>
            Start selling your embroidery designs on Embroidex
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Mobile Number <span className={styles.required}>*</span>
            </label>
            <input
              type="tel"
              name="mobile_number"
              placeholder="Enter your mobile number"
              className="input-custom"
              onChange={handleChange}
              value={form.mobile_number}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Business Website (Optional)</label>
            <input
              type="url"
              name="business_website"
              placeholder="https://yourwebsite.com"
              className="input-custom"
              onChange={handleChange}
              value={form.business_website}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Business Address <span className={styles.required}>*</span>
            </label>
            <textarea
              name="business_address"
              placeholder="Enter your complete business address"
              className={`input-custom ${styles.textarea}`}
              onChange={handleChange}
              value={form.business_address}
              required
              rows={4}
            />
          </div>

          <button
            type="submit"
            className={`btn-primary-custom ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register as Seller"}
          </button>
        </form>

        <div className={styles.info}>
          <h4>Why become a seller?</h4>
          <ul>
            <li>Reach thousands of embroidery enthusiasts</li>
            <li>Set your own prices</li>
            <li>Get paid directly to your account</li>
            <li>Build your brand and reputation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SellerRegister;
