/**
 * Payment Settings Component
 * Allows sellers to configure UPI or Bank Account for payouts
 * Only visible to users with isSeller = true
 */

import React, { useState, useEffect } from "react";
import API from "../../services/api";
import styles from "./PaymentSettings.module.css";

const PaymentSettings = () => {
  const [payoutType, setPayoutType] = useState("UPI"); // UPI or BANK
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingDetails, setExistingDetails] = useState(null);
  
  // UPI Form Data
  const [upiId, setUpiId] = useState("");
  
  // Bank Account Form Data
  const [bankData, setBankData] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: ""
  });

  useEffect(() => {
    fetchPayoutSettings();
  }, []);

  const fetchPayoutSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/withdrawal/payout-settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.payoutDetails) {
        setExistingDetails(res.data.payoutDetails);
        setPayoutType(res.data.payoutDetails.type);
        
        if (res.data.payoutDetails.type === "UPI") {
          setUpiId(res.data.payoutDetails.upiId || "");
        } else if (res.data.payoutDetails.type === "BANK") {
          setBankData({
            accountHolderName: res.data.payoutDetails.accountHolderName || "",
            accountNumber: res.data.payoutDetails.accountNumber || "",
            ifscCode: res.data.payoutDetails.ifscCode || "",
            bankName: res.data.payoutDetails.bankName || ""
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch payout settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const payload = { type: payoutType };

      if (payoutType === "UPI") {
        if (!upiId.trim()) {
          alert("Please enter your UPI ID");
          setSaving(false);
          return;
        }
        payload.upiId = upiId.trim();
      } else if (payoutType === "BANK") {
        if (!bankData.accountHolderName || !bankData.accountNumber || !bankData.ifscCode) {
          alert("Please fill all required bank account fields");
          setSaving(false);
          return;
        }
        payload.accountHolderName = bankData.accountHolderName.trim();
        payload.accountNumber = bankData.accountNumber.trim();
        payload.ifscCode = bankData.ifscCode.trim().toUpperCase();
        payload.bankName = bankData.bankName.trim();
      }

      const res = await API.post("/withdrawal/payout-settings", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(res.data.message);
      fetchPayoutSettings();
    } catch (err) {
      console.error("Failed to save payout settings", err);
      alert(err.response?.data?.error || "Failed to save payout settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading payment settings...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Payment Settings</h2>
        <p className={styles.subtitle}>
          Configure how you want to receive your earnings
        </p>
      </div>

      {existingDetails && (
        <div className={styles.existingDetails}>
          <h3>Current Configuration</h3>
          <div className={styles.detailsCard}>
            <div className={styles.detailRow}>
              <span className={styles.label}>Type:</span>
              <span className={styles.value}>{existingDetails.type}</span>
            </div>
            
            {existingDetails.type === "UPI" && (
              <div className={styles.detailRow}>
                <span className={styles.label}>UPI ID:</span>
                <span className={styles.value}>{existingDetails.upiId}</span>
              </div>
            )}
            
            {existingDetails.type === "BANK" && (
              <>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Account Holder:</span>
                  <span className={styles.value}>{existingDetails.accountHolderName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Account Number:</span>
                  <span className={styles.value}>{existingDetails.accountNumber}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>IFSC Code:</span>
                  <span className={styles.value}>{existingDetails.ifscCode}</span>
                </div>
                {existingDetails.bankName && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Bank Name:</span>
                    <span className={styles.value}>{existingDetails.bankName}</span>
                  </div>
                )}
              </>
            )}
          </div>
          <p className={styles.updateNote}>Update your details below if needed</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.typeSelector}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="payoutType"
              value="UPI"
              checked={payoutType === "UPI"}
              onChange={(e) => setPayoutType(e.target.value)}
            />
            <span>UPI</span>
          </label>
          
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="payoutType"
              value="BANK"
              checked={payoutType === "BANK"}
              onChange={(e) => setPayoutType(e.target.value)}
            />
            <span>Bank Account</span>
          </label>
        </div>

        {payoutType === "UPI" && (
          <div className={styles.formSection}>
            <h3>UPI Details</h3>
            <div className={styles.formGroup}>
              <label htmlFor="upiId">UPI ID *</label>
              <input
                type="text"
                id="upiId"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                required
              />
              <small>Example: 9876543210@paytm, yourname@oksbi</small>
            </div>
          </div>
        )}

        {payoutType === "BANK" && (
          <div className={styles.formSection}>
            <h3>Bank Account Details</h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="accountHolderName">Account Holder Name *</label>
              <input
                type="text"
                id="accountHolderName"
                placeholder="As per bank records"
                value={bankData.accountHolderName}
                onChange={(e) => setBankData({...bankData, accountHolderName: e.target.value})}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="accountNumber">Account Number *</label>
              <input
                type="text"
                id="accountNumber"
                placeholder="Enter account number"
                value={bankData.accountNumber}
                onChange={(e) => setBankData({...bankData, accountNumber: e.target.value})}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="ifscCode">IFSC Code *</label>
              <input
                type="text"
                id="ifscCode"
                placeholder="HDFC0001234"
                value={bankData.ifscCode}
                onChange={(e) => setBankData({...bankData, ifscCode: e.target.value.toUpperCase()})}
                required
              />
              <small>11-character IFSC code</small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="bankName">Bank Name</label>
              <input
                type="text"
                id="bankName"
                placeholder="HDFC Bank, SBI, etc."
                value={bankData.bankName}
                onChange={(e) => setBankData({...bankData, bankName: e.target.value})}
              />
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <button 
            type="submit" 
            className={styles.saveButton}
            disabled={saving}
          >
            {saving ? "Saving..." : existingDetails ? "Update Settings" : "Save Settings"}
          </button>
        </div>
      </form>

      <div className={styles.infoBox}>
        <h4>Important Information</h4>
        <ul>
          <li>Your payment details are securely stored and encrypted</li>
          <li>These details will be used for processing your withdrawal requests</li>
          <li>Ensure all information is accurate to avoid payment delays</li>
          <li>You can update your payment settings anytime</li>
        </ul>
      </div>
    </div>
  );
};

export default PaymentSettings;
