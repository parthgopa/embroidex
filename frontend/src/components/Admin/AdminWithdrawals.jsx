/**
 * Admin Withdrawals Dashboard
 * Displays all pending withdrawal requests
 * Allows admin to view details and approve/reject requests
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import styles from "./AdminWithdrawals.module.css";
import { FaHistory } from "react-icons/fa";

const AdminWithdrawals = () => {
  const navigate = useNavigate();
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [withdrawalDetails, setWithdrawalDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingWithdrawals();
    fetchStats();
  }, []);

  const fetchPendingWithdrawals = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/withdrawal/admin/pending", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingWithdrawals(res.data.withdrawals);
    } catch (err) {
      console.error("Failed to fetch pending withdrawals", err);
      if (err.response?.status === 403) {
        alert("Admin access required");
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/withdrawal/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const fetchWithdrawalDetails = async (withdrawalId) => {
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/withdrawal/admin/${withdrawalId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWithdrawalDetails(res.data);
    } catch (err) {
      console.error("Failed to fetch withdrawal details", err);
      alert("Failed to load withdrawal details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    fetchWithdrawalDetails(withdrawal._id);
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;

    const adminNotes = prompt("Enter admin notes (optional):");
    
    if (adminNotes === null) return; // User cancelled

    setProcessing(true);

    try {
      const token = localStorage.getItem("token");
      await API.post(
        `/withdrawal/admin/${selectedWithdrawal._id}/approve`,
        { adminNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Withdrawal approved! Amount: ₹${selectedWithdrawal.amount}\n\nPlease process the payout manually using the seller's payout details.`);
      
      setSelectedWithdrawal(null);
      setWithdrawalDetails(null);
      fetchPendingWithdrawals();
      fetchStats();
    } catch (err) {
      console.error("Failed to approve withdrawal", err);
      alert(err.response?.data?.error || "Failed to approve withdrawal");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal) return;

    const rejectionReason = prompt("Enter rejection reason (required):");
    
    if (!rejectionReason || rejectionReason.trim() === "") {
      alert("Rejection reason is required");
      return;
    }

    setProcessing(true);

    try {
      const token = localStorage.getItem("token");
      await API.post(
        `/withdrawal/admin/${selectedWithdrawal._id}/reject`,
        { rejectionReason: rejectionReason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Withdrawal rejected. Amount returned to seller's balance.`);
      
      setSelectedWithdrawal(null);
      setWithdrawalDetails(null);
      fetchPendingWithdrawals();
      fetchStats();
    } catch (err) {
      console.error("Failed to reject withdrawal", err);
      alert(err.response?.data?.error || "Failed to reject withdrawal");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading withdrawals...</div>;
  }

  return (
    <div className={styles.withdrawalsContainer}>
      <div className={styles.header}>
        <div>
          <h2>Withdrawal Requests</h2>
          <p className={styles.subtitle}>Review and process seller withdrawal requests</p>
        </div>
        <button 
          className={styles.historyButton}
          onClick={() => navigate("/admin/withdrawal-history")}
        >
          <FaHistory /> View History
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Pending Requests</div>
            <div className={styles.statValue}>{stats.pending.count}</div>
            <div className={styles.statAmount}>₹{stats.pending.totalAmount.toFixed(2)}</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Approved (All Time)</div>
            <div className={styles.statValue}>{stats.approved.count}</div>
            <div className={styles.statAmount}>₹{stats.approved.totalAmount.toFixed(2)}</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Rejected (All Time)</div>
            <div className={styles.statValue}>{stats.rejected.count}</div>
          </div>
        </div>
      )}

      {/* Pending Withdrawals Table */}
      <div className={styles.tableSection}>
        <h2>Pending Requests</h2>
        
        {pendingWithdrawals.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>✓</div>
            <h3>No Pending Withdrawals</h3>
            <p>All withdrawal requests have been processed</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Requested</th>
                  <th>Seller</th>
                  <th>Amount</th>
                  <th>Total Earnings</th>
                  <th>Reference ID</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal._id}>
                    <td>{formatDate(withdrawal.requestedAt)}</td>
                    <td>
                      <div className={styles.sellerInfo}>
                        <div className={styles.sellerName}>{withdrawal.sellerName}</div>
                        <div className={styles.sellerEmail}>{withdrawal.sellerEmail}</div>
                      </div>
                    </td>
                    <td className={styles.amount}>₹{withdrawal.amount.toFixed(2)}</td>
                    <td>₹{withdrawal.totalEarnings.toFixed(2)}</td>
                    <td className={styles.referenceId}>{withdrawal.referenceId}</td>
                    <td>
                      <button
                        className={styles.viewButton}
                        onClick={() => handleViewDetails(withdrawal)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Details Modal */}
      {selectedWithdrawal && (
        <div className={styles.modal} onClick={() => !processing && setSelectedWithdrawal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Withdrawal Request Details</h2>
              <button 
                className={styles.closeButton}
                onClick={() => !processing && setSelectedWithdrawal(null)}
                disabled={processing}
              >
                ×
              </button>
            </div>

            {loadingDetails ? (
              <div className={styles.modalLoading}>Loading details...</div>
            ) : withdrawalDetails ? (
              <div className={styles.modalBody}>
                {/* Seller Information */}
                <div className={styles.section}>
                  <h3>Seller Information</h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Name:</span>
                      <span className={styles.value}>{withdrawalDetails.sellerName}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Email:</span>
                      <span className={styles.value}>{withdrawalDetails.sellerEmail}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Reference ID:</span>
                      <span className={styles.value}>{withdrawalDetails.referenceId}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className={styles.section}>
                  <h3>Financial Summary</h3>
                  <div className={styles.financialGrid}>
                    <div className={styles.financialItem}>
                      <span className={styles.label}>Requested Amount:</span>
                      <span className={styles.valueHighlight}>₹{withdrawalDetails.amount.toFixed(2)}</span>
                    </div>
                    <div className={styles.financialItem}>
                      <span className={styles.label}>Total Earnings:</span>
                      <span className={styles.value}>₹{withdrawalDetails.totalEarnings.toFixed(2)}</span>
                    </div>
                    <div className={styles.financialItem}>
                      <span className={styles.label}>Total Withdrawn:</span>
                      <span className={styles.value}>₹{withdrawalDetails.totalWithdrawn.toFixed(2)}</span>
                    </div>
                    <div className={styles.financialItem}>
                      <span className={styles.label}>Available Balance:</span>
                      <span className={styles.value}>₹{withdrawalDetails.availableBalance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payout Details */}
                <div className={styles.section}>
                  <h3>Payout Details</h3>
                  <div className={styles.payoutCard}>
                    <div className={styles.payoutType}>
                      Type: <strong>{withdrawalDetails.payoutDetails.type}</strong>
                    </div>
                    
                    {withdrawalDetails.payoutDetails.type === "UPI" && (
                      <div className={styles.payoutInfo}>
                        <div className={styles.infoItem}>
                          <span className={styles.label}>UPI ID:</span>
                          <span className={styles.value}>{withdrawalDetails.payoutDetails.upiId}</span>
                        </div>
                      </div>
                    )}
                    
                    {withdrawalDetails.payoutDetails.type === "BANK" && (
                      <div className={styles.payoutInfo}>
                        <div className={styles.infoItem}>
                          <span className={styles.label}>Account Holder:</span>
                          <span className={styles.value}>{withdrawalDetails.payoutDetails.accountHolderName}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.label}>Account Number:</span>
                          <span className={styles.value}>{withdrawalDetails.payoutDetails.accountNumber}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <span className={styles.label}>IFSC Code:</span>
                          <span className={styles.value}>{withdrawalDetails.payoutDetails.ifscCode}</span>
                        </div>
                        {withdrawalDetails.payoutDetails.bankName && (
                          <div className={styles.infoItem}>
                            <span className={styles.label}>Bank Name:</span>
                            <span className={styles.value}>{withdrawalDetails.payoutDetails.bankName}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Sales Verification */}
                <div className={styles.section}>
                  <h3>Recent Sales ({withdrawalDetails.totalSalesCount} total)</h3>
                  {withdrawalDetails.recentSales.length === 0 ? (
                    <div className={styles.noSales}>No sales found</div>
                  ) : (
                    <div className={styles.salesTable}>
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Design</th>
                            <th>Sale Price</th>
                            <th>Platform Fee</th>
                            <th>Seller Earning</th>
                          </tr>
                        </thead>
                        <tbody>
                          {withdrawalDetails.recentSales.slice(0, 10).map((sale) => (
                            <tr key={sale.purchaseId}>
                              <td>{formatDate(sale.purchasedAt)}</td>
                              <td>{sale.designTitle}</td>
                              <td>₹{sale.salePrice.toFixed(2)}</td>
                              <td>₹{sale.platformFee.toFixed(2)}</td>
                              <td className={styles.earning}>₹{sale.sellerEarning.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className={styles.actions}>
                  <button
                    className={styles.approveButton}
                    onClick={handleApprove}
                    disabled={processing}
                  >
                    {processing ? "Processing..." : "Approve Withdrawal"}
                  </button>
                  <button
                    className={styles.rejectButton}
                    onClick={handleReject}
                    disabled={processing}
                  >
                    {processing ? "Processing..." : "Reject Withdrawal"}
                  </button>
                </div>

                <div className={styles.note}>
                  <strong>Note:</strong> After approval, you must manually process the payout using the seller's payout details above.
                </div>
              </div>
            ) : (
              <div className={styles.modalError}>Failed to load details</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;
