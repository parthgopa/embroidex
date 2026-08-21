/**
 * Payment Settings Component
 * Professional, modern payout setup for sellers (UPI / Bank Transfer)
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  MdPayment, 
  MdOutlineQrCode2, 
  MdOutlineAccountBalance, 
  MdCheckCircle, 
  MdWarning, 
  MdLock, 
  MdContentCopy, 
  MdCheck, 
  MdArrowBack
} from "react-icons/md";
import API from "../../services/api";
import styles from "./PaymentSettings.module.css";

const PaymentSettings = () => {
  const [payoutType, setPayoutType] = useState("UPI"); // UPI or BANK
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingDetails, setExistingDetails] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null); // { type: 'success' | 'error', message: '' }
  
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

  const showAlert = (type, message) => {
    setAlertInfo({ type, message });
    setTimeout(() => {
      setAlertInfo(null);
    }, 4000);
  };

  const fetchPayoutSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/withdrawal/payout-settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data?.payoutDetails) {
        const details = res.data.payoutDetails;
        setExistingDetails(details);
        setPayoutType(details.type || "UPI");
        
        if (details.type === "UPI") {
          setUpiId(details.upiId || "");
        } else if (details.type === "BANK") {
          setBankData({
            accountHolderName: details.accountHolderName || "",
            accountNumber: details.accountNumber || "",
            ifscCode: details.ifscCode || "",
            bankName: details.bankName || ""
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch payout settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlertInfo(null);

    try {
      const token = localStorage.getItem("token");
      const payload = { type: payoutType };

      if (payoutType === "UPI") {
        if (!upiId.trim()) {
          showAlert("error", "Please enter a valid UPI ID (e.g., username@bank)");
          setSaving(false);
          return;
        }
        payload.upiId = upiId.trim();
      } else if (payoutType === "BANK") {
        if (!bankData.accountHolderName.trim() || !bankData.accountNumber.trim() || !bankData.ifscCode.trim()) {
          showAlert("error", "Please fill in all required bank details");
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

      showAlert("success", res.data?.message || "Payment settings updated successfully!");
      fetchPayoutSettings();
    } catch (err) {
      console.error("Failed to save payout settings", err);
      showAlert("error", err.response?.data?.error || "Failed to save payment settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading payment settings...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        {/* Navigation & Header */}
        <div className={styles.pageHeader}>
          <Link to="/profile" className={styles.backLink}>
            <MdArrowBack size={16} /> Back to Profile
          </Link>
          <div className={styles.headerInfo}>
            <div className={styles.headerIconWrap}>
              <MdPayment size={22} />
            </div>
            <div>
              <h1>Payment & Payout Settings</h1>
              <p className={styles.subtitle}>
                Configure your verified UPI ID or Bank Account to receive earnings withdrawals
              </p>
            </div>
          </div>
        </div>

        {/* Alert Banner */}
        {alertInfo && (
          <div className={alertInfo.type === 'success' ? styles.alertSuccess : styles.alertError}>
            {alertInfo.type === 'success' ? <MdCheckCircle size={17} /> : <MdWarning size={17} />}
            <span>{alertInfo.message}</span>
          </div>
        )}

        {/* Current Active Configuration */}
        {existingDetails && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <div className={styles.cardHeaderIcon}>
                  {existingDetails.type === "UPI" ? <MdOutlineQrCode2 size={17} /> : <MdOutlineAccountBalance size={17} />}
                </div>
                <div>
                  <h2>Active Configuration</h2>
                  <p className={styles.cardSubtitle}>Your current payout destination for withdrawals</p>
                </div>
              </div>
              <span className={styles.statusBadgeSuccess}>
                <MdCheckCircle size={13} /> Active
              </span>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.keyValueList}>
                <div className={styles.kvItem}>
                  <span className={styles.kvLabel}>Payment Method</span>
                  <span className={styles.kvValue}>
                    <span className={styles.methodPill}>
                      {existingDetails.type === "UPI" ? <MdOutlineQrCode2 size={15} /> : <MdOutlineAccountBalance size={15} />}
                      {existingDetails.type}
                    </span>
                  </span>
                </div>

                {existingDetails.type === "UPI" && (
                  <div className={styles.kvItem}>
                    <span className={styles.kvLabel}>UPI ID</span>
                    <span className={styles.kvValue}>
                      <span className={styles.monoValue}>{existingDetails.upiId}</span>
                      <button 
                        type="button"
                        className={styles.copyBtn} 
                        onClick={() => handleCopy(existingDetails.upiId, 'upi')}
                        title="Copy UPI ID"
                      >
                        {copiedKey === 'upi' ? <MdCheck size={14} color="#16a34a" /> : <MdContentCopy size={14} />}
                      </button>
                    </span>
                  </div>
                )}

                {existingDetails.type === "BANK" && (
                  <>
                    <div className={styles.kvItem}>
                      <span className={styles.kvLabel}>Account Holder</span>
                      <span className={styles.kvValue}>{existingDetails.accountHolderName || "N/A"}</span>
                    </div>
                    <div className={styles.kvItem}>
                      <span className={styles.kvLabel}>Account Number</span>
                      <span className={styles.kvValue}>
                        <span className={styles.monoValue}>{existingDetails.accountNumber}</span>
                      </span>
                    </div>
                    <div className={styles.kvItem}>
                      <span className={styles.kvLabel}>IFSC Code</span>
                      <span className={styles.kvValue}>
                        <span className={styles.monoValue}>{existingDetails.ifscCode}</span>
                        <button 
                          type="button"
                          className={styles.copyBtn} 
                          onClick={() => handleCopy(existingDetails.ifscCode, 'ifsc')}
                          title="Copy IFSC Code"
                        >
                          {copiedKey === 'ifsc' ? <MdCheck size={14} color="#16a34a" /> : <MdContentCopy size={14} />}
                        </button>
                      </span>
                    </div>
                    {existingDetails.bankName && (
                      <div className={styles.kvItem}>
                        <span className={styles.kvLabel}>Bank Name</span>
                        <span className={styles.kvValue}>{existingDetails.bankName}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Configuration Form Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleGroup}>
              <div className={styles.cardHeaderIcon}>
                <MdPayment size={17} />
              </div>
              <div>
                <h2>{existingDetails ? "Update Payment Method" : "Set Up Payment Method"}</h2>
                <p className={styles.cardSubtitle}>Select your preferred withdrawal method and fill in details</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.formBody}>
            {/* Segmented Method Selector */}
            <div className={styles.methodSelector}>
              <button
                type="button"
                className={`${styles.methodBtn} ${payoutType === "UPI" ? styles.methodBtnActive : ""}`}
                onClick={() => setPayoutType("UPI")}
              >
                <MdOutlineQrCode2 size={17} />
                <span>UPI Transfer</span>
              </button>

              <button
                type="button"
                className={`${styles.methodBtn} ${payoutType === "BANK" ? styles.methodBtnActive : ""}`}
                onClick={() => setPayoutType("BANK")}
              >
                <MdOutlineAccountBalance size={17} />
                <span>Bank Account</span>
              </button>
            </div>

            {/* UPI Form */}
            {payoutType === "UPI" && (
              <div className={styles.fieldsContainer}>
                <div className={styles.inputGroup}>
                  <label htmlFor="upiId" className={styles.inputLabel}>
                    UPI ID <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="upiId"
                    className={styles.textInput}
                    placeholder="e.g. 9876543210@paytm, username@oksbi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                  />
                  <span className={styles.inputHint}>
                    Enter the VPA / UPI ID linked to your bank account for direct payouts.
                  </span>
                </div>
              </div>
            )}

            {/* Bank Form */}
            {payoutType === "BANK" && (
              <div className={styles.fieldsContainer}>
                <div className={styles.formGrid}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="accountHolderName" className={styles.inputLabel}>
                      Account Holder Name <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="accountHolderName"
                      className={styles.textInput}
                      placeholder="Full name per bank records"
                      value={bankData.accountHolderName}
                      onChange={(e) => setBankData({...bankData, accountHolderName: e.target.value})}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="bankName" className={styles.inputLabel}>
                      Bank Name
                    </label>
                    <input
                      type="text"
                      id="bankName"
                      className={styles.textInput}
                      placeholder="e.g. HDFC Bank, SBI"
                      value={bankData.bankName}
                      onChange={(e) => setBankData({...bankData, bankName: e.target.value})}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="accountNumber" className={styles.inputLabel}>
                      Account Number <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="accountNumber"
                      className={styles.textInput}
                      placeholder="Enter account number"
                      value={bankData.accountNumber}
                      onChange={(e) => setBankData({...bankData, accountNumber: e.target.value})}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label htmlFor="ifscCode" className={styles.inputLabel}>
                      IFSC Code <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="ifscCode"
                      className={`${styles.textInput} ${styles.uppercaseInput}`}
                      placeholder="e.g. HDFC0001234"
                      value={bankData.ifscCode}
                      onChange={(e) => setBankData({...bankData, ifscCode: e.target.value.toUpperCase()})}
                      required
                      maxLength={11}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className={styles.btnSpinner}></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  existingDetails ? "Update Payment Settings" : "Save Payment Settings"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security & Info Box */}
        <div className={styles.infoCard}>
          <div className={styles.infoTitle}>
            <MdLock size={16} />
            <h4>Security & Payout Guidelines</h4>
          </div>
          <ul className={styles.infoList}>
            <li>All payout credentials are encrypted and securely stored.</li>
            <li>Earnings withdrawals are processed directly to your configured payout method.</li>
            <li>Please ensure details are accurate to avoid transfer delays.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default PaymentSettings;
