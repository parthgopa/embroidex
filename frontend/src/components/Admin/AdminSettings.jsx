/**
 * Admin Settings Component
 * Allows admin to configure platform-wide settings like platform fee
 */

import { useState, useEffect } from "react";
import API from "../../services/api";
import styles from "./AdminSettings.module.css";

const AdminSettings = () => {
  const [platformFee, setPlatformFee] = useState(30);
  const [originalFee, setOriginalFee] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/settings/platform-fee", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlatformFee(res.data.platformFee);
      setOriginalFee(res.data.platformFee);
    } catch (err) {
      console.error("Failed to fetch settings", err);
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validation
    const feeValue = parseFloat(platformFee);
    if (isNaN(feeValue) || feeValue < 0 || feeValue > 100) {
      setMessage({ type: "error", text: "Platform fee must be between 0 and 100" });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      await API.put(
        "/settings/platform-fee",
        { platformFee: feeValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOriginalFee(feeValue);
      setMessage({ type: "success", text: "Platform fee updated successfully!" });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("Failed to update settings", err);
      setMessage({ 
        type: "error", 
        text: err.response?.data?.error || "Failed to update platform fee" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPlatformFee(originalFee);
    setMessage({ type: "", text: "" });
  };

  const hasChanges = platformFee !== originalFee;

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Platform Settings</h2>
        <p className={styles.subtitle}>Configure platform-wide settings and fees</p>
      </div>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.settingsCard}>
        <form onSubmit={handleSave}>
          <div className={styles.settingSection}>
            <div className={styles.sectionHeader}>
              <h3>Platform Fee (Convenience Fee)</h3>
              <p className={styles.description}>
                Percentage of each sale taken as platform fee. This fee is deducted from seller earnings.
              </p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="platformFee">Platform Fee Percentage</label>
              <div className={styles.inputWrapper}>
                <input
                  type="number"
                  id="platformFee"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(e.target.value)}
                  min="0"
                  max="100"
                  step="0.1"
                  className={styles.input}
                  disabled={saving}
                />
                <span className={styles.inputSuffix}>%</span>
              </div>
              <small className={styles.hint}>
                Current: {originalFee}% | Range: 0% - 100%
              </small>
            </div>

            <div className={styles.example}>
              <h4>Example Calculation:</h4>
              <div className={styles.exampleGrid}>
                <div className={styles.exampleItem}>
                  <span className={styles.exampleLabel}>Design Sale Price:</span>
                  <span className={styles.exampleValue}>₹1,000</span>
                </div>
                <div className={styles.exampleItem}>
                  <span className={styles.exampleLabel}>Platform Fee ({platformFee}%):</span>
                  <span className={styles.exampleValue}>
                    ₹{((1000 * platformFee) / 100).toFixed(2)}
                  </span>
                </div>
                <div className={styles.exampleItem}>
                  <span className={styles.exampleLabel}>Seller Earnings:</span>
                  <span className={styles.exampleValue}>
                    ₹{(1000 - (1000 * platformFee) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.resetButton}
              onClick={handleReset}
              disabled={!hasChanges || saving}
            >
              Reset
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={!hasChanges || saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.infoCard}>
        <h3>Important Notes:</h3>
        <ul>
          <li>Changes to the platform fee will apply to all future transactions</li>
          <li>Existing seller earnings are calculated with the fee at the time of sale</li>
          <li>Sellers will see their earnings after the platform fee is deducted</li>
          <li>This fee helps cover platform costs and maintenance</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminSettings;
