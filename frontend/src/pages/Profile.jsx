/**
 * Profile & Settings Page
 * Professional user profile with modern key-value layout and payment setup integration
 */

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MdPerson,
  MdPayment,
  MdAccountBalanceWallet,
  MdShoppingBag,
  MdSettings,
  MdLogout,
  MdEdit,
  MdCheckCircle,
  MdWarning,
  MdEmail,
  MdPhone,
  MdBusiness,
  MdOutlineQrCode2,
  MdOutlineAccountBalance,
  MdSchedule,
  MdVerified,
  MdArrowForward,
  MdContentCopy,
  MdCheck,
  MdLockOutline,
  MdVpnKey,
  MdVisibility,
  MdVisibilityOff
} from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import API from "../services/api";
import styles from "./Profile.module.css";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payoutDetails, setPayoutDetails] = useState(null);
  const [stats, setStats] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Change Password state
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwStep, setPwStep] = useState("initial"); // "initial" | "otp" | "new_password"
  const [pwOtp, setPwOtp] = useState("");
  const [changeToken, setChangeToken] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwCountdown, setPwCountdown] = useState(60);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  useEffect(() => {
    let timer;
    if (pwStep === "otp" && pwCountdown > 0) {
      timer = setInterval(() => setPwCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [pwStep, pwCountdown]);

  const handleStartChangePassword = () => {
    setShowPwModal(true);
    setPwStep("initial");
    setPwError("");
    setPwSuccess("");
    setPwOtp("");
    setNewPw("");
    setConfirmPw("");
  };

  const handleSendPwOtp = async () => {
    setPwLoading(true);
    setPwError("");
    setPwSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/auth/change-password/send-otp", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPwSuccess(res.data.message || `Code sent to ${user?.email}`);
      setPwStep("otp");
      setPwCountdown(60);
    } catch (err) {
      setPwError(err.response?.data?.error || "Failed to send verification code.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleVerifyPwOtp = async (codeToVerify) => {
    const code = (codeToVerify || pwOtp).trim();
    if (code.length !== 6) {
      return setPwError("Please enter the 6-digit verification code.");
    }
    setPwLoading(true);
    setPwError("");
    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/auth/change-password/verify-otp", { otp: code }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChangeToken(res.data.change_token);
      setPwStep("new_password");
      setPwSuccess("Code verified! Please create your new password.");
    } catch (err) {
      setPwError(err.response?.data?.error || "Invalid verification code.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPw.length < 6) {
      return setPwError("Password must be at least 6 characters long.");
    }
    if (newPw !== confirmPw) {
      return setPwError("Passwords do not match. Please re-enter.");
    }
    setPwLoading(true);
    setPwError("");
    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/auth/change-password/update", {
        change_token: changeToken,
        new_password: newPw
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPwSuccess(res.data.message || "Password updated successfully!");
      setTimeout(() => {
        setShowPwModal(false);
        setPwStep("initial");
        setPwSuccess("");
      }, 1500);
    } catch (err) {
      setPwError(err.response?.data?.error || "Failed to update password.");
    } finally {
      setPwLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchUserProfile();
    fetchPayoutDetails();
    fetchUserStats();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/auth/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayoutDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/payment/payout-details", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayoutDetails(res.data?.payoutDetails || null);
    } catch (err) {
      console.error("Failed to fetch payout details", err);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/auth/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  const isSeller = user?.is_seller || false;
  const hasPayoutSetup = Boolean(payoutDetails?.type);
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.headerContent}>
            <div className={styles.avatar}>
              <span className={styles.avatarText}>{initials}</span>
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userNameRow}>
                <h1>{user?.name || "User"}</h1>
                <span className={isSeller ? styles.sellerBadge : styles.buyerBadge}>
                  {isSeller ? (
                    <>
                      <MdCheckCircle size={14} /> Seller
                    </>
                  ) : (
                    "Buyer"
                  )}
                </span>
              </div>
              <div className={styles.userMeta}>
                <span className={styles.metaItem}>
                  <MdEmail size={15} /> {user?.email || "No email available"}
                </span>
                <span className={styles.metaItem}>
                  {user?.signup_method === "google" ? (
                    <span className={styles.methodBadgeGoogle}>
                      <FcGoogle size={14} /> Registered with Google
                    </span>
                  ) : (
                    <span className={styles.methodBadgePassword}>
                      <MdLockOutline size={14} /> Registered with Password
                    </span>
                  )}
                </span>
                {isSeller && user?.seller_info?.mobile_number && (
                  <span className={styles.metaItem}>
                    <MdPhone size={15} /> {user.seller_info.mobile_number}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Setup Status - Only for sellers */}
        {isSeller && (
          <div className={styles.cardSection}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <div className={styles.cardHeaderIcon}>
                  <MdPayment size={20} />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Payment Setup</h2>
                  <p className={styles.cardSubtitle}>Manage your payout destination and verification details</p>
                </div>
              </div>
              {hasPayoutSetup ? (
                <span className={styles.statusBadgeSuccess}>
                  <MdCheckCircle size={16} /> Configured
                </span>
              ) : (
                <span className={styles.statusBadgeWarning}>
                  <MdWarning size={16} /> Not Configured
                </span>
              )}
            </div>

            {hasPayoutSetup ? (
              <div className={styles.cardBody}>
                <div className={styles.keyValueList}>
                  <div className={styles.kvItem}>
                    <span className={styles.kvLabel}>Payment Method</span>
                    <span className={styles.kvValue}>
                      <span className={styles.methodPill}>
                        {payoutDetails.type === "UPI" ? <MdOutlineQrCode2 size={16} /> : <MdOutlineAccountBalance size={16} />}
                        {payoutDetails.type}
                      </span>
                    </span>
                  </div>

                  <div className={styles.kvItem}>
                    <span className={styles.kvLabel}>Verification Status</span>
                    <span className={styles.kvValue}>
                      {payoutDetails.verified ? (
                        <span className={styles.verifiedBadge}>
                          <MdCheckCircle size={14} /> Verified
                        </span>
                      ) : (
                        <span className={styles.pendingBadge}>
                          <MdSchedule size={14} /> Pending Verification
                        </span>
                      )}
                    </span>
                  </div>

                  {payoutDetails.type === "UPI" && (
                    <div className={styles.kvItem}>
                      <span className={styles.kvLabel}>UPI ID</span>
                      <span className={styles.kvValue}>
                        <span className={styles.monoValue}>{payoutDetails.upiId}</span>
                        <button
                          type="button"
                          className={styles.copyBtn}
                          onClick={() => handleCopy(payoutDetails.upiId, 'upi')}
                          title="Copy UPI ID"
                        >
                          {copiedKey === 'upi' ? <MdCheck size={14} color="#16a34a" /> : <MdContentCopy size={14} />}
                        </button>
                      </span>
                    </div>
                  )}

                  {payoutDetails.type === "BANK" && (
                    <>
                      <div className={styles.kvItem}>
                        <span className={styles.kvLabel}>Account Holder</span>
                        <span className={styles.kvValue}>{payoutDetails.accountHolderName || "N/A"}</span>
                      </div>
                      <div className={styles.kvItem}>
                        <span className={styles.kvLabel}>Bank Name</span>
                        <span className={styles.kvValue}>{payoutDetails.bankName || "N/A"}</span>
                      </div>
                      <div className={styles.kvItem}>
                        <span className={styles.kvLabel}>Account Number</span>
                        <span className={styles.kvValue}>
                          <span className={styles.monoValue}>{payoutDetails.accountNumber || "N/A"}</span>
                        </span>
                      </div>
                      <div className={styles.kvItem}>
                        <span className={styles.kvLabel}>IFSC Code</span>
                        <span className={styles.kvValue}>
                          <span className={styles.monoValue}>{payoutDetails.ifscCode}</span>
                          <button
                            type="button"
                            className={styles.copyBtn}
                            onClick={() => handleCopy(payoutDetails.ifscCode, 'ifsc')}
                            title="Copy IFSC Code"
                          >
                            {copiedKey === 'ifsc' ? <MdCheck size={14} color="#16a34a" /> : <MdContentCopy size={14} />}
                          </button>
                        </span>
                      </div>
                    </>
                  )}

                  {payoutDetails.addedAt && (
                    <div className={styles.kvItem}>
                      <span className={styles.kvLabel}>Added On</span>
                      <span className={styles.kvValue}>{formatDate(payoutDetails.addedAt)}</span>
                    </div>
                  )}

                  {payoutDetails.lastUpdated && (
                    <div className={styles.kvItem}>
                      <span className={styles.kvLabel}>Last Updated</span>
                      <span className={styles.kvValue}>{formatDate(payoutDetails.lastUpdated)}</span>
                    </div>
                  )}
                </div>

                <div className={styles.cardFooter}>
                  <Link to="/seller/payment-settings" className={styles.editButton}>
                    <MdEdit size={16} /> Edit Payment Details
                  </Link>
                </div>
              </div>
            ) : (
              <div className={styles.setupPrompt}>
                <div className={styles.promptIcon}>
                  <MdPayment size={30} />
                </div>
                <div className={styles.promptContent}>
                  <h3>Set Up Payout Method</h3>
                  <p>Configure your bank account or UPI ID to receive payouts when buyers purchase your embroidery designs.</p>
                </div>
                <Link to="/seller/payment-settings" className={styles.setupButton}>
                  <MdPayment size={18} /> Setup Payment Method
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIconPurple}>
                <MdShoppingBag size={22} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Purchases</div>
                <div className={styles.statValue}>{stats.totalPurchases || 0}</div>
              </div>
            </div>

            {isSeller && (
              <>
                <div className={styles.statCard}>
                  <div className={styles.statIconIndigo}>
                    <MdSettings size={22} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statLabel}>Uploaded Designs</div>
                    <div className={styles.statValue}>{stats.totalDesigns || 0}</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statIconGreen}>
                    <MdAccountBalanceWallet size={22} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statLabel}>Total Earnings</div>
                    <div className={styles.statValue}>₹{Number(stats.totalEarnings || 0).toLocaleString("en-IN")}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
          </div>
          <div className={styles.actionsGrid}>
            <Link to="/my-purchases" className={styles.actionCard}>
              <div className={styles.actionIconWrap}>
                <MdShoppingBag size={22} />
              </div>
              <div className={styles.actionContent}>
                <div className={styles.actionTitleRow}>
                  <h3>My Purchases</h3>
                  <MdArrowForward className={styles.actionArrow} size={18} />
                </div>
                <p>View and download your purchased embroidery designs</p>
              </div>
            </Link>

            {isSeller && (
              <>
                <Link to="/seller/my-designs" className={styles.actionCard}>
                  <div className={styles.actionIconWrap}>
                    <MdSettings size={22} />
                  </div>
                  <div className={styles.actionContent}>
                    <div className={styles.actionTitleRow}>
                      <h3>My Designs</h3>
                      <MdArrowForward className={styles.actionArrow} size={18} />
                    </div>
                    <p>Manage, edit, or upload new embroidery designs</p>
                  </div>
                </Link>

                <Link to="/seller/earnings" className={styles.actionCard}>
                  <div className={styles.actionIconWrap}>
                    <MdAccountBalanceWallet size={22} />
                  </div>
                  <div className={styles.actionContent}>
                    <div className={styles.actionTitleRow}>
                      <h3>Earnings & Withdrawals</h3>
                      <MdArrowForward className={styles.actionArrow} size={18} />
                    </div>
                    <p>Track your balance and request withdrawals</p>
                  </div>
                </Link>
              </>
            )}

            <button onClick={handleLogout} className={`${styles.actionCard} ${styles.logoutCard}`}>
              <div className={`${styles.actionIconWrap} ${styles.logoutIconWrap}`}>
                <MdLogout size={22} />
              </div>
              <div className={styles.actionContent}>
                <div className={styles.actionTitleRow}>
                  <h3>Sign Out</h3>
                  <MdArrowForward className={styles.actionArrow} size={18} />
                </div>
                <p>Securely sign out of your Embroidex account</p>
              </div>
            </button>
          </div>
        </div>

        {/* Account Details */}
        <div className={styles.cardSection}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleGroup}>
              <div className={styles.cardHeaderIcon}>
                <MdPerson size={20} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Account Details</h2>
                <p className={styles.cardSubtitle}>Your personal contact and account profile information</p>
              </div>
            </div>
          </div>

          <div className={styles.cardBody}>
            <div className={styles.keyValueList}>
              <div className={styles.kvItem}>
                <span className={styles.kvLabel}>
                  <MdPerson size={16} className={styles.kvIcon} /> Full Name
                </span>
                <span className={styles.kvValue}>{user?.name || "N/A"}</span>
              </div>

              <div className={styles.kvItem}>
                <span className={styles.kvLabel}>
                  <MdEmail size={16} className={styles.kvIcon} /> Email Address
                </span>
                <span className={styles.kvValue}>{user?.email || "N/A"}</span>
              </div>

              <div className={styles.kvItem}>
                <span className={styles.kvLabel}>
                  <MdVerified size={16} className={styles.kvIcon} /> Account Role
                </span>
                <span className={styles.kvValue}>
                  <span className={isSeller ? styles.sellerPill : styles.buyerPill}>
                    {isSeller ? "Seller" : "Buyer"}
                  </span>
                </span>
              </div>

              <div className={styles.kvItem}>
                <span className={styles.kvLabel}>
                  <MdLockOutline size={16} className={styles.kvIcon} /> Registered Via
                </span>
                <span className={styles.kvValue}>
                  {user?.signup_method === "google" ? (
                    <span className={styles.methodBadgeGoogle}>
                      <FcGoogle size={14} /> Google Account
                    </span>
                  ) : (
                    <span className={styles.methodBadgePassword}>
                      <MdLockOutline size={14} /> Email & Password
                    </span>
                  )}
                </span>
              </div>

              {isSeller && user?.seller_info?.mobile_number && (
                <div className={styles.kvItem}>
                  <span className={styles.kvLabel}>
                    <MdPhone size={16} className={styles.kvIcon} /> Mobile Number
                  </span>
                  <span className={styles.kvValue}>{user.seller_info.mobile_number}</span>
                </div>
              )}

              {isSeller && user?.seller_info?.business_address && (
                <div className={styles.kvItem}>
                  <span className={styles.kvLabel}>
                    <MdBusiness size={16} className={styles.kvIcon} /> Business Address
                  </span>
                  <span className={styles.kvValue}>{user.seller_info.business_address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security & Password Section */}
        <div className={styles.cardSection}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleGroup}>
              <div className={styles.cardHeaderIcon}>
                <MdLockOutline size={20} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Account Security</h2>
                <p className={styles.cardSubtitle}>Manage your sign-in credentials and password</p>
              </div>
            </div>

            {user?.signup_method === "google" ? (
              <span className={styles.methodBadgeGoogle}>
                <FcGoogle size={16} /> Google Account
              </span>
            ) : (
              <button
                type="button"
                onClick={handleStartChangePassword}
                className={styles.changePasswordBtn}
              >
                <MdVpnKey size={16} /> Change Password
              </button>
            )}
          </div>

          <div className={styles.cardBody}>
            {user?.signup_method === "google" ? (
              <div className={styles.googleNoticeBox}>
                <FcGoogle size={24} />
                <div>
                  <strong>Managed via Google Sign-In</strong>
                  <p>Your Embroidex account is authenticated using your Google profile. You do not have a separate password here.</p>
                </div>
              </div>
            ) : (
              <div className={styles.securityInfoBox}>
                <p>
                  To change your password, an OTP verification code will be sent to your registered email address <strong>{user?.email}</strong>.
                </p>
                {!showPwModal && (
                  <button
                    type="button"
                    onClick={handleStartChangePassword}
                    className={styles.inlineActionBtn}
                  >
                    <MdVpnKey size={16} /> Change My Password
                  </button>
                )}
              </div>
            )}

            {/* Interactive Password Change Box */}
            {showPwModal && user?.signup_method !== "google" && (
              <div className={styles.pwModalContainer}>
                <div className={styles.pwModalHeader}>
                  <h3>Change Password</h3>
                  <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={() => setShowPwModal(false)}
                  >
                    ✕
                  </button>
                </div>

                {pwError && <div className={styles.pwErrorBanner}>{pwError}</div>}
                {pwSuccess && <div className={styles.pwSuccessBanner}>{pwSuccess}</div>}

                {/* STEP 1: INITIAL */}
                {pwStep === "initial" && (
                  <div className={styles.pwStepBox}>
                    <p className={styles.pwStepDesc}>
                      Click below to send a 6-digit verification code to <strong>{user?.email}</strong>.
                    </p>
                    <div className={styles.pwActionRow}>
                      <button
                        type="button"
                        onClick={handleSendPwOtp}
                        className={styles.sendCodeBtn}
                        disabled={pwLoading}
                      >
                        {pwLoading ? "Sending Code..." : "Send Verification Code"}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: VERIFY OTP */}
                {pwStep === "otp" && (
                  <div className={styles.pwStepBox}>
                    <p className={styles.pwStepDesc}>
                      Enter the 6-digit code sent to <strong>{user?.email}</strong>:
                    </p>
                    <div className={styles.otpInputGroup}>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="------"
                        value={pwOtp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setPwOtp(val);
                          setPwError("");
                          if (val.length === 6) {
                            handleVerifyPwOtp(val);
                          }
                        }}
                        className={styles.pwOtpInput}
                        autoFocus
                      />
                    </div>

                    <div className={styles.pwResendRow}>
                      {pwCountdown > 0 ? (
                        <span>Resend code in {pwCountdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendPwOtp}
                          disabled={pwLoading}
                          className={styles.resendBtnLink}
                        >
                          Resend Code
                        </button>
                      )}
                    </div>

                    <div className={styles.pwActionRow}>
                      <button
                        type="button"
                        onClick={() => handleVerifyPwOtp(pwOtp)}
                        className={styles.sendCodeBtn}
                        disabled={pwLoading || pwOtp.length !== 6}
                      >
                        {pwLoading ? "Verifying..." : "Verify Code"}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: NEW PASSWORD */}
                {pwStep === "new_password" && (
                  <form onSubmit={handleUpdatePassword} className={styles.pwForm}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>New Password</label>
                      <div className={styles.inputWrap}>
                        <input
                          type={showNewPw ? "text" : "password"}
                          placeholder="Min. 6 characters"
                          value={newPw}
                          onChange={(e) => {
                            setNewPw(e.target.value);
                            setPwError("");
                          }}
                          className={styles.textInput}
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          className={styles.eyeToggle}
                          onClick={() => setShowNewPw(!showNewPw)}
                        >
                          {showNewPw ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Confirm New Password</label>
                      <div className={styles.inputWrap}>
                        <input
                          type={showConfirmPw ? "text" : "password"}
                          placeholder="Re-enter new password"
                          value={confirmPw}
                          onChange={(e) => {
                            setConfirmPw(e.target.value);
                            setPwError("");
                          }}
                          className={styles.textInput}
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          className={styles.eyeToggle}
                          onClick={() => setShowConfirmPw(!showConfirmPw)}
                        >
                          {showConfirmPw ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* REAL-TIME MATCH INDICATION */}
                    {newPw && confirmPw && (
                      <div
                        className={
                          newPw === confirmPw
                            ? styles.matchIndicatorSuccess
                            : styles.matchIndicatorError
                        }
                      >
                        {newPw === confirmPw ? (
                          <>
                            <MdCheckCircle size={16} />
                            <span>Passwords match</span>
                          </>
                        ) : (
                          <>
                            <MdWarning size={16} />
                            <span>Passwords do not match</span>
                          </>
                        )}
                      </div>
                    )}

                    <div className={styles.pwActionRow}>
                      <button
                        type="submit"
                        className={styles.sendCodeBtn}
                        disabled={pwLoading || !newPw || newPw !== confirmPw || newPw.length < 6}
                      >
                        {pwLoading ? "Updating..." : "Change Password"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;

