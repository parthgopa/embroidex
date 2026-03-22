import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MdAttachMoney, 
  MdAccountBalance,
  MdTrendingUp,
  MdShoppingCart,
  MdWarning
} from "react-icons/md";
import API from "../../services/api";
import styles from "./SellerEarnings.module.css";

const SellerEarnings = () => {
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [bankAccount, setBankAccount] = useState(null);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    account_number: "",
    ifsc: "",
    account_holder_name: "",
    bank_name: ""
  });
  const [withdrawals, setWithdrawals] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to view earnings");
      navigate("/login");
      return;
    }
    fetchEarnings();
    fetchBankAccount();
    fetchWithdrawals();
  }, []);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/seller/earnings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEarnings(res.data.earnings);
      setSales(res.data.sales);
    } catch (err) {
      console.error("Failed to fetch earnings", err);
      alert(err.response?.data?.error || "Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccount = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/seller/bank-account", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBankAccount(res.data.bank_account);
    } catch (err) {
      console.error("Failed to fetch bank account", err);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/seller/withdrawal-history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWithdrawals(res.data.withdrawals);
    } catch (err) {
      console.error("Failed to fetch withdrawals", err);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawAmount);
    
    if (amount < 2000) {
      alert("Minimum withdrawal amount is ₹2000");
      return;
    }

    if (amount > earnings.available_balance) {
      alert("Insufficient balance");
      return;
    }

    setWithdrawing(true);

    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        "/seller/withdraw",
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(res.data.message);
      setShowWithdrawForm(false);
      setWithdrawAmount("");
      fetchEarnings();
      fetchWithdrawals();
    } catch (err) {
      console.error("Withdrawal failed", err);
      alert(err.response?.data?.error || "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleBankFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        "/seller/bank-account",
        bankFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(res.data.message);
      setShowBankForm(false);
      setBankFormData({
        account_number: "",
        ifsc: "",
        account_holder_name: "",
        bank_name: ""
      });
      fetchBankAccount();
    } catch (err) {
      console.error("Failed to save bank account", err);
      alert(err.response?.data?.error || "Failed to save bank account");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading earnings...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>
            <MdAttachMoney className={styles.titleIcon} />
            Earnings & Withdrawals
          </h1>
          <p className={styles.subtitle}>
            Track your sales and manage your earnings
          </p>
        </div>

        {/* Earnings Summary */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.cardIcon} style={{ background: 'rgba(79, 70, 229, 0.1)' }}>
              <MdTrendingUp style={{ color: 'var(--primary)' }} />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>Total Sales</span>
              <span className={styles.cardValue}>₹{earnings?.total_sales || 0}</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardIcon} style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <MdWarning style={{ color: 'var(--danger)' }} />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>Platform Fee (30%)</span>
              <span className={styles.cardValue}>₹{earnings?.platform_fee || 0}</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardIcon} style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
              <MdAccountBalance style={{ color: 'var(--success)' }} />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>Available Balance</span>
              <span className={styles.cardValue}>₹{earnings?.available_balance || 0}</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardIcon} style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
              <MdShoppingCart style={{ color: 'var(--warning)' }} />
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>Total Orders</span>
              <span className={styles.cardValue}>{earnings?.total_orders || 0}</span>
            </div>
          </div>
        </div>

        {/* Withdraw Section */}
        <div className={styles.withdrawSection}>
          <div className={styles.withdrawHeader}>
            <div>
              <h3>Withdraw Funds</h3>
              <p>Minimum withdrawal amount: ₹2000</p>
            </div>
            {!showWithdrawForm && (
              <button
                className="btn-primary-custom"
                onClick={() => setShowWithdrawForm(true)}
                disabled={earnings?.available_balance < 2000}
              >
                Request Withdrawal
              </button>
            )}
          </div>

          {showWithdrawForm && (
            <form className={styles.withdrawForm} onSubmit={handleWithdraw}>
              <div className={styles.formGroup}>
                <label>Withdrawal Amount (₹)</label>
                <input
                  type="number"
                  className="input-custom"
                  placeholder="Enter amount (min ₹2000)"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="2000"
                  max={earnings?.available_balance}
                  required
                />
                <small>Available: ₹{earnings?.available_balance || 0}</small>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className="btn-outline-custom"
                  onClick={() => {
                    setShowWithdrawForm(false);
                    setWithdrawAmount("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-custom"
                  disabled={withdrawing}
                >
                  {withdrawing ? "Processing..." : "Confirm Withdrawal"}
                </button>
              </div>

              <div className={styles.withdrawNote}>
                <MdWarning />
                <p>
                  Note: Withdrawals are processed via Razorpay and may take 2-3 business days.
                  A 30% platform fee has already been deducted from your sales.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Sales Table */}
        <div className={styles.salesSection}>
          <h3 className={styles.sectionTitle}>Sales History</h3>

          {sales.length === 0 ? (
            <div className={styles.emptyState}>
              <MdShoppingCart className={styles.emptyIcon} />
              <h4>No sales yet</h4>
              <p>Your sold designs will appear here</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.salesTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Design</th>
                    <th>Sale Price</th>
                    <th>Platform Fee (30%)</th>
                    <th>Your Earning (70%)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale._id}>
                      <td>{formatDate(sale.purchased_at)}</td>
                      <td className={styles.designCell}>
                        <strong>{sale.design_title}</strong>
                      </td>
                      <td className={styles.priceCell}>₹{sale.sale_price}</td>
                      <td className={styles.feeCell}>₹{sale.platform_fee}</td>
                      <td className={styles.earningCell}>₹{sale.seller_earning}</td>
                      <td>
                        <span className="tag tag-approved">Completed</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerEarnings;
