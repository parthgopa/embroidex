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
  MdCheck
} from "react-icons/md";
import API from "../services/api";
import styles from "./Profile.module.css";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payoutDetails, setPayoutDetails] = useState(null);
  const [stats, setStats] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

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
                      <MdCheckCircle size={14} /> Seller Account
                    </>
                  ) : (
                    "Buyer Account"
                  )}
                </span>
              </div>
              <div className={styles.userMeta}>
                <span className={styles.metaItem}>
                  <MdEmail size={15} /> {user?.email || "No email available"}
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
                    {isSeller ? "Seller Account" : "Buyer Account"}
                  </span>
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

      </div>
    </div>
  );
};

export default Profile;

