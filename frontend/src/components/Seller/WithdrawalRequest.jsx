/**
 * Withdrawal Request Component
 * Displays seller's balance and allows withdrawal requests
 * Locks withdrawal if payment settings not configured
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import styles from "./WithdrawalRequest.module.css";

const MINIMUM_WITHDRAWAL = 500;

const WithdrawalRequest = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [amount, setAmount] = useState("");
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [showSales, setShowSales] = useState(true);

  useEffect(() => {
    fetchBalance();
    fetchHistory();
    fetchSalesData();
  }, []);

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/withdrawal/balance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalance(res.data);
    } catch (err) {
      console.error("Failed to fetch balance", err);
      if (err.response?.status === 403) {
        alert("Only sellers can access this page");
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/withdrawal/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWithdrawalHistory(res.data.withdrawals);
    } catch (err) {
      console.error("Failed to fetch withdrawal history", err);
    }
  };

  const fetchSalesData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/seller/earnings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSalesData(res.data.sales || []);
    } catch (err) {
      console.error("Failed to fetch sales data", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (withdrawAmount < MINIMUM_WITHDRAWAL) {
      alert(`Minimum withdrawal amount is ₹${MINIMUM_WITHDRAWAL}`);
      return;
    }

    if (withdrawAmount > balance.availableBalance) {
      alert(`Insufficient balance. Available: ₹${balance.availableBalance}`);
      return;
    }

    setRequesting(true);

    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        "/withdrawal/request",
        { amount: withdrawAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(res.data.message);
      setAmount("");
      fetchBalance();
      fetchHistory();
    } catch (err) {
      console.error("Withdrawal request failed", err);
      
      if (err.response?.data?.requiresPayoutSetup) {
        alert(err.response.data.error + "\n\nRedirecting to Payment Settings...");
        navigate("/seller/payment-settings");
      } else {
        alert(err.response?.data?.error || "Failed to submit withdrawal request");
      }
    } finally {
      setRequesting(false);
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

  const getStatusClass = (status) => {
    switch (status) {
      case "PENDING": return styles.statusPending;
      case "APPROVED": return styles.statusApproved;
      case "REJECTED": return styles.statusRejected;
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading balance...</div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Failed to load balance</div>
      </div>
    );
  }

  const hasPayoutDetails = balance.hasPayoutDetails;
  const isWithdrawalLocked = !hasPayoutDetails;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Withdraw Earnings</h2>
        <p className={styles.subtitle}>Request withdrawal of your available balance</p>
      </div>

      {/* Balance Summary */}
      <div className={styles.balanceCard}>
        <div className={styles.balanceGrid}>
          <div className={styles.balanceItem}>
            <span className={styles.balanceLabel}>Available Balance</span>
            <span className={styles.balanceAmount}>₹{balance.availableBalance.toFixed(2)}</span>
          </div>
          
          <div className={styles.balanceItem}>
            <span className={styles.balanceLabel}>Total Earnings</span>
            <span className={styles.balanceValue}>₹{balance.totalEarnings.toFixed(2)}</span>
          </div>
          
          <div className={styles.balanceItem}>
            <span className={styles.balanceLabel}>Total Withdrawn</span>
            <span className={styles.balanceValue}>₹{balance.totalWithdrawn.toFixed(2)}</span>
          </div>
          
          {balance.pendingAmount > 0 && (
            <div className={styles.balanceItem}>
              <span className={styles.balanceLabel}>Pending Requests</span>
              <span className={styles.balancePending}>₹{balance.pendingAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Warning if payment settings not configured */}
      {isWithdrawalLocked && (
        <div className={styles.warningBox}>
          <div className={styles.warningIcon}>⚠️</div>
          <div className={styles.warningContent}>
            <h3>Payment Settings Required</h3>
            <p>Please configure your Payment Settings first before requesting a withdrawal.</p>
            <button 
              className={styles.settingsButton}
              onClick={() => navigate("/seller/payment-settings")}
            >
              Go to Payment Settings
            </button>
          </div>
        </div>
      )}

      {/* Withdrawal Form */}
      <div className={styles.withdrawalCard}>
        <h3>Request Withdrawal</h3>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="amount">Amount (₹)</label>
            <input
              type="number"
              id="amount"
              placeholder={`Minimum ₹${MINIMUM_WITHDRAWAL}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isWithdrawalLocked}
              min={MINIMUM_WITHDRAWAL}
              max={balance.availableBalance}
              step="0.01"
              required
            />
            <small>
              Minimum: ₹{MINIMUM_WITHDRAWAL} | Available: ₹{balance.availableBalance.toFixed(2)}
            </small>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isWithdrawalLocked || requesting || balance.availableBalance < MINIMUM_WITHDRAWAL}
          >
            {requesting ? "Submitting..." : "Request Withdrawal"}
          </button>
        </form>

        {balance.availableBalance < MINIMUM_WITHDRAWAL && !isWithdrawalLocked && (
          <div className={styles.infoMessage}>
            You need at least ₹{MINIMUM_WITHDRAWAL} to request a withdrawal.
          </div>
        )}

        <div className={styles.processingNote}>
          <strong>Processing Time:</strong> Withdrawal requests are processed within 2-3 business days.
        </div>
      </div>

      {/* Sales Details */}
      <div className={styles.historySection}>
        <div className={styles.historyHeader}>
          <h3>Sales & Earnings Details</h3>
          <button 
            className={styles.toggleButton}
            onClick={() => setShowSales(!showSales)}
          >
            {showSales ? "Hide" : "Show"} Sales
          </button>
        </div>

        {showSales && (
          <div className={styles.historyContent}>
            {salesData.length === 0 ? (
              <div className={styles.emptyState}>
                No sales yet
              </div>
            ) : (
              <div className={styles.historyTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Design</th>
                      <th>Sale Price</th>
                      <th>Platform Fee</th>
                      <th>Your Earning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesData.map((sale) => (
                      <tr key={sale._id}>
                        <td>{formatDate(sale.purchased_at)}</td>
                        <td>{sale.design_title}</td>
                        <td>₹{sale.sale_price.toFixed(2)}</td>
                        <td className={styles.platformFee}>₹{sale.platform_fee.toFixed(2)}</td>
                        <td className={styles.earning}>₹{sale.seller_earning.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Withdrawal History */}
      <div className={styles.historySection}>
        <div className={styles.historyHeader}>
          <h3>Withdrawal History</h3>
          <button 
            className={styles.toggleButton}
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "Hide" : "Show"} History
          </button>
        </div>

        {showHistory && (
          <div className={styles.historyContent}>
            {withdrawalHistory.length === 0 ? (
              <div className={styles.emptyState}>
                No withdrawal requests yet
              </div>
            ) : (
              <div className={styles.historyTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference ID</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalHistory.map((withdrawal) => (
                      <tr key={withdrawal._id}>
                        <td>{formatDate(withdrawal.requestedAt)}</td>
                        <td className={styles.referenceId}>{withdrawal.referenceId}</td>
                        <td className={styles.amount}>₹{withdrawal.amount.toFixed(2)}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${getStatusClass(withdrawal.status)}`}>
                            {withdrawal.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawalRequest;
