/**
 * Profile & Settings Page
 * Professional user profile with payment setup integration
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
  MdBusiness
} from "react-icons/md";
import API from "../services/api";
import styles from "./Profile.module.css";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payoutDetails, setPayoutDetails] = useState(null);
  const [stats, setStats] = useState(null);

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
      setPayoutDetails(res.data);
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
  const hasPayoutSetup = payoutDetails?.type ? true : false;

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.headerContent}>
            <div className={styles.avatar}>
              <MdPerson size={48} />
            </div>
            <div className={styles.userInfo}>
              <h1>{user?.name || "User"}</h1>
              <div className={styles.userMeta}>
                <span className={styles.email}>
                  <MdEmail size={16} /> {user?.email}
                </span>
                <span className={styles.badge}>
                  {isSeller ? '✓ Seller Account' : 'Buyer Account'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Setup Status - Only for sellers */}
        {isSeller && (
          <div className={styles.paymentStatusCard}>
            <div className={styles.statusHeader}>
              <h2>Payment Setup</h2>
              {hasPayoutSetup ? (
                <span className={styles.statusBadgeSuccess}>
                  <MdCheckCircle size={20} /> Configured
                </span>
              ) : (
                <span className={styles.statusBadgeWarning}>
                  <MdWarning size={20} /> Not Configured
                </span>
              )}
            </div>
            
            {hasPayoutSetup ? (
              <div className={styles.payoutInfo}>
                <div className={styles.payoutDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Payment Method:</span>
                    <span className={styles.detailValue}>{payoutDetails.type}</span>
                  </div>
                  {payoutDetails.type === "UPI" && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>UPI ID:</span>
                      <span className={styles.detailValue}>{payoutDetails.upiId}</span>
                    </div>
                  )}
                  {payoutDetails.type === "BANK" && (
                    <>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Account Holder:</span>
                        <span className={styles.detailValue}>{payoutDetails.accountHolderName}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Account Number:</span>
                        <span className={styles.detailValue}>****{payoutDetails.accountNumber?.slice(-4)}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>IFSC Code:</span>
                        <span className={styles.detailValue}>{payoutDetails.ifscCode}</span>
                      </div>
                    </>
                  )}
                </div>
                <Link to="/seller/payment-settings" className={styles.editButton}>
                  <MdEdit size={18} /> Edit Payment Details
                </Link>
              </div>
            ) : (
              <div className={styles.setupPrompt}>
                <p>Configure your payment details to receive withdrawals</p>
                <Link to="/seller/payment-settings" className={styles.setupButton}>
                  <MdPayment size={20} /> Setup Payment Method
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <MdShoppingBag size={24} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statValue}>{stats.totalPurchases || 0}</div>
                <div className={styles.statLabel}>Purchases</div>
              </div>
            </div>
            {isSeller && (
              <>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <MdSettings size={24} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>{stats.totalDesigns || 0}</div>
                    <div className={styles.statLabel}>Designs</div>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <MdAccountBalanceWallet size={24} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>₹{stats.totalEarnings?.toFixed(0) || 0}</div>
                    <div className={styles.statLabel}>Total Earnings</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <Link to="/my-purchases" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <MdShoppingBag size={24} />
              </div>
              <div className={styles.actionContent}>
                <h3>My Purchases</h3>
                <p>View and download purchased designs</p>
              </div>
            </Link>

            {isSeller && (
              <>
                <Link to="/seller/my-designs" className={styles.actionCard}>
                  <div className={styles.actionIcon}>
                    <MdSettings size={24} />
                  </div>
                  <div className={styles.actionContent}>
                    <h3>My Designs</h3>
                    <p>Manage your uploaded designs</p>
                  </div>
                </Link>

                <Link to="/seller/earnings" className={styles.actionCard}>
                  <div className={styles.actionIcon}>
                    <MdAccountBalanceWallet size={24} />
                  </div>
                  <div className={styles.actionContent}>
                    <h3>Earnings & Withdrawals</h3>
                    <p>View balance and request withdrawals</p>
                  </div>
                </Link>
              </>
            )}

            <button onClick={handleLogout} className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <MdLogout size={24} />
              </div>
              <div className={styles.actionContent}>
                <h3>Logout</h3>
                <p>Sign out of your account</p>
              </div>
            </button>
          </div>
        </div>

        {/* Account Details */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Account Details</h2>
          <div className={styles.detailsCard}>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <MdPerson size={20} />
                </div>
                <div>
                  <div className={styles.detailLabel}>Full Name</div>
                  <div className={styles.detailValue}>{user?.name || "N/A"}</div>
                </div>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailIcon}>
                  <MdEmail size={20} />
                </div>
                <div>
                  <div className={styles.detailLabel}>Email Address</div>
                  <div className={styles.detailValue}>{user?.email || "N/A"}</div>
                </div>
              </div>

              {isSeller && user?.seller_info?.mobile_number && (
                <div className={styles.detailItem}>
                  <div className={styles.detailIcon}>
                    <MdPhone size={20} />
                  </div>
                  <div>
                    <div className={styles.detailLabel}>Mobile Number</div>
                    <div className={styles.detailValue}>{user.seller_info.mobile_number}</div>
                  </div>
                </div>
              )}

              {isSeller && user?.seller_info?.business_address && (
                <div className={styles.detailItem}>
                  <div className={styles.detailIcon}>
                    <MdBusiness size={20} />
                  </div>
                  <div>
                    <div className={styles.detailLabel}>Business Address</div>
                    <div className={styles.detailValue}>{user.seller_info.business_address}</div>
                  </div>
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
