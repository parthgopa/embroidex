/**
 * Profile & Settings Page - Clean, Streamlined & Editable
 * Clean UI focused on Account Details (Name, Address, Phone) & Account Security (Password Change).
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdPerson,
  MdLogout,
  MdEdit,
  MdCheckCircle,
  MdEmail,
  MdPhone,
  MdHome,
  MdVerified,
  MdCheck,
  MdLockOutline,
  MdVpnKey,
  MdVisibility,
  MdVisibilityOff,
  MdClose
} from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import API from "../services/api";
import styles from "./Profile.module.css";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", address: "", phone: "" });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/auth/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      setEditForm({
        name: res.data.name || "",
        address: res.data.address || res.data.seller_info?.business_address || "",
        phone: res.data.phone || res.data.seller_info?.mobile_number || ""
      });
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = () => {
    setEditForm({
      name: user?.name || "",
      address: user?.address || user?.seller_info?.business_address || "",
      phone: user?.phone || user?.seller_info?.mobile_number || ""
    });
    setUpdateError("");
    setUpdateSuccess("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setUpdateError("");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      return setUpdateError("Name cannot be empty.");
    }
    setUpdateLoading(true);
    setUpdateError("");
    setUpdateSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await API.put("/auth/profile", editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.user);
      setUpdateSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setUpdateSuccess(""), 4000);
    } catch (err) {
      setUpdateError(err.response?.data?.error || "Failed to update profile.");
    } finally {
      setUpdateLoading(false);
    }
  };

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
    setPwSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/auth/change-password/update", {
        change_token: changeToken,
        new_password: newPw
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPwSuccess(res.data.message || "Password changed successfully!");
      setTimeout(() => {
        setShowPwModal(false);
        setPwStep("initial");
        setPwSuccess("");
      }, 2000);
    } catch (err) {
      setPwError(err.response?.data?.error || "Failed to update password.");
    } finally {
      setPwLoading(false);
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
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className={styles.headerLogoutBtn}
              title="Sign out of account"
            >
              <MdLogout size={16} /> Sign Out
            </button>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {updateSuccess && (
          <div className={styles.alertBannerSuccess}>
            <MdCheckCircle size={18} /> {updateSuccess}
          </div>
        )}
        {updateError && (
          <div className={styles.alertBannerError}>
            <MdClose size={18} /> {updateError}
          </div>
        )}

        {/* Card 1: Account Details (Editable Name & Address) */}
        <div className={styles.cardSection}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleGroup}>
              <div className={styles.cardHeaderIcon}>
                <MdPerson size={20} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Account Details</h2>
                <p className={styles.cardSubtitle}>Your personal identity, contact, and address information</p>
              </div>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className={styles.editProfileBtn}
              >
                <MdEdit size={15} /> Edit Details
              </button>
            )}
          </div>

          <div className={styles.cardBody}>
            {!isEditing ? (
              /* VIEW MODE */
              <div className={styles.keyValueList}>
                <div className={styles.kvItem}>
                  <span className={styles.kvLabel}>
                    <MdPerson size={16} className={styles.kvIcon} /> Full Name
                  </span>
                  <span className={styles.kvValue}>{user?.name || "Not set"}</span>
                </div>

                <div className={styles.kvItem}>
                  <span className={styles.kvLabel}>
                    <MdEmail size={16} className={styles.kvIcon} /> Email Address
                  </span>
                  <span className={styles.kvValue}>
                    {user?.email || "Not set"}
                    <span className={styles.accountPill}>Account ID</span>
                  </span>
                </div>

                <div className={styles.kvItem}>
                  <span className={styles.kvLabel}>
                    <MdPhone size={16} className={styles.kvIcon} /> Phone Number
                  </span>
                  <span className={styles.kvValue}>
                    {user?.phone || user?.seller_info?.mobile_number || "Not set"}
                  </span>
                </div>

                <div className={styles.kvItem}>
                  <span className={styles.kvLabel}>
                    <MdHome size={16} className={styles.kvIcon} /> Address
                  </span>
                  <span className={styles.kvValue}>
                    {user?.address || user?.seller_info?.business_address || "No address added yet"}
                  </span>
                </div>

                <div className={styles.kvItem}>
                  <span className={styles.kvLabel}>
                    <MdVerified size={16} className={styles.kvIcon} /> Account Role
                  </span>
                  <span className={styles.kvValue}>
                    <span className={isSeller ? styles.sellerPill : styles.buyerPill}>
                      {isSeller ? "Seller Account" : "Buyer Account"}
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
              </div>
            ) : (
              /* EDIT MODE */
              <form onSubmit={handleSaveProfile} className={styles.editProfileForm}>
                <div className={styles.editFormGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.fieldLabel}>
                      <MdPerson size={15} /> Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.fieldLabel}>
                      <MdEmail size={15} /> Email Address (Sign-In)
                    </label>
                    <input
                      type="email"
                      className={`${styles.fieldInput} ${styles.fieldInputDisabled}`}
                      value={user?.email || ""}
                      disabled
                      title="Email is your account sign-in identifier and cannot be altered directly"
                    />
                    <span className={styles.helperNote}>Linked to your Embroidex account credentials</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.fieldLabel}>
                      <MdPhone size={15} /> Phone / Mobile Number
                    </label>
                    <input
                      type="tel"
                      className={styles.fieldInput}
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullWidthCol}`}>
                    <label className={styles.fieldLabel}>
                      <MdHome size={15} /> Address (Shipping / Billing)
                    </label>
                    <textarea
                      rows="3"
                      className={styles.fieldTextarea}
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Enter your full street address, city, state, and postal code"
                    />
                  </div>
                </div>

                <div className={styles.formActionRow}>
                  <button
                    type="submit"
                    className={styles.saveProfileBtn}
                    disabled={updateLoading}
                  >
                    <MdCheck size={16} />
                    {updateLoading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className={styles.cancelProfileBtn}
                    disabled={updateLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Card 2: Account Security & Password */}
        <div className={styles.cardSection}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleGroup}>
              <div className={styles.cardHeaderIcon}>
                <MdLockOutline size={20} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Account Security</h2>
                <p className={styles.cardSubtitle}>Manage your password and authentication settings</p>
              </div>
            </div>

            {user?.signup_method === "google" ? (
              <span className={styles.methodBadgeGoogle}>
                <FcGoogle size={16} /> Google Account
              </span>
            ) : (
              !showPwModal && (
                <button
                  type="button"
                  onClick={handleStartChangePassword}
                  className={styles.changePasswordBtn}
                >
                  <MdVpnKey size={16} /> Change Password
                </button>
              )
            )}
          </div>

          <div className={styles.cardBody}>
            {user?.signup_method === "google" ? (
              <div className={styles.googleNoticeBox}>
                <FcGoogle size={24} />
                <div>
                  <strong>Managed via Google Sign-In</strong>
                  <p>Your Embroidex account authenticates using your Google profile credentials. You do not need a separate password.</p>
                </div>
              </div>
            ) : (
              <div>
                {!showPwModal ? (
                  <div className={styles.securityInfoBox}>
                    <p>
                      Password updates require verification via a 6-digit OTP sent to your registered email address: <strong>{user?.email}</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={handleStartChangePassword}
                      className={styles.inlineActionBtn}
                    >
                      <MdVpnKey size={16} /> Change Password
                    </button>
                  </div>
                ) : (
                  /* Interactive Password Change Box */
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
                          We will send a 6-digit one-time verification code to <strong>{user?.email}</strong>.
                        </p>
                        <div className={styles.pwActionRow}>
                          <button
                            type="button"
                            className={styles.sendCodeBtn}
                            onClick={handleSendPwOtp}
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
                            maxLength={6}
                            value={pwOtp}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                              setPwOtp(clean);
                              if (clean.length === 6) {
                                handleVerifyPwOtp(clean);
                              }
                            }}
                            placeholder="------"
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
                              Resend Verification Code
                            </button>
                          )}
                        </div>

                        <div className={styles.pwActionRow}>
                          <button
                            type="button"
                            className={styles.sendCodeBtn}
                            onClick={() => handleVerifyPwOtp(pwOtp)}
                            disabled={pwLoading || pwOtp.length !== 6}
                          >
                            {pwLoading ? "Verifying..." : "Verify Code"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: NEW PASSWORD & CONFIRM PASSWORD */}
                    {pwStep === "new_password" && (
                      <form onSubmit={handleUpdatePassword} className={styles.pwForm}>
                        <p className={styles.pwStepDesc}>
                          Choose a new, secure password (minimum 6 characters).
                        </p>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>New Password</label>
                          <div className={styles.inputWrap}>
                            <input
                              type={showNewPw ? "text" : "password"}
                              className={styles.textInput}
                              placeholder="Enter new password"
                              value={newPw}
                              onChange={(e) => setNewPw(e.target.value)}
                              required
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
                              className={styles.textInput}
                              placeholder="Re-enter new password"
                              value={confirmPw}
                              onChange={(e) => setConfirmPw(e.target.value)}
                              required
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

                        {/* Real-time match indicator */}
                        {newPw && confirmPw && (
                          newPw === confirmPw ? (
                            <div className={styles.matchIndicatorSuccess}>
                              <MdCheck size={16} /> Passwords match
                            </div>
                          ) : (
                            <div className={styles.matchIndicatorError}>
                              ✕ Passwords do not match
                            </div>
                          )
                        )}

                        <div className={styles.pwActionRow}>
                          <button
                            type="submit"
                            className={styles.sendCodeBtn}
                            disabled={pwLoading || newPw !== confirmPw || newPw.length < 6}
                          >
                            {pwLoading ? "Updating Password..." : "Update Password"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
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
