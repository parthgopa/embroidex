/**
 * Admin Withdrawal History Component
 * Comprehensive withdrawal history with advanced filters
 * Shows all withdrawals (pending, approved, rejected)
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import styles from "./AdminWithdrawalHistory.module.css";

const AdminWithdrawalHistory = () => {
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState([]);
  const [filteredWithdrawals, setFilteredWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [withdrawalDetails, setWithdrawalDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: "all",
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: ""
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchAllWithdrawals();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [withdrawals, filters]);

  const fetchAllWithdrawals = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/withdrawal/admin/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWithdrawals(res.data.withdrawals || []);
    } catch (err) {
      console.error("Failed to fetch withdrawals", err);
      if (err.response?.status === 403) {
        alert("Admin access required");
        navigate("/admin/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...withdrawals];

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(w => w.status.toLowerCase() === filters.status.toLowerCase());
    }

    // Search filter (seller name, email, reference ID)
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(w =>
        w.sellerName?.toLowerCase().includes(search) ||
        w.sellerEmail?.toLowerCase().includes(search) ||
        w.referenceId?.toLowerCase().includes(search)
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(w => new Date(w.requestedAt) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(w => new Date(w.requestedAt) <= toDate);
    }

    // Amount range filter
    if (filters.minAmount) {
      filtered = filtered.filter(w => w.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(w => w.amount <= parseFloat(filters.maxAmount));
    }

    setFilteredWithdrawals(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      status: "all",
      searchTerm: "",
      dateFrom: "",
      dateTo: "",
      minAmount: "",
      maxAmount: ""
    });
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
    switch (status.toUpperCase()) {
      case "PENDING": return styles.statusPending;
      case "APPROVED": return styles.statusApproved;
      case "REJECTED": return styles.statusRejected;
      default: return "";
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredWithdrawals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentWithdrawals = filteredWithdrawals.slice(startIndex, endIndex);

  if (loading) {
    return <div className={styles.loading}>Loading withdrawal history...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Withdrawal History</h2>
          <p className={styles.subtitle}>Complete history of all withdrawal requests</p>
        </div>
        <button 
          className={styles.backButton}
          onClick={() => navigate("/admin/withdrawals")}
        >
          ← Back to Pending
        </button>
      </div>

      {/* Summary Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Requests</div>
          <div className={styles.statValue}>{withdrawals.length}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Pending</div>
          <div className={styles.statValue}>
            {withdrawals.filter(w => w.status === "PENDING").length}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Approved</div>
          <div className={styles.statValue}>
            {withdrawals.filter(w => w.status === "APPROVED").length}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Rejected</div>
          <div className={styles.statValue}>
            {withdrawals.filter(w => w.status === "REJECTED").length}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className={styles.filtersCard}>
        <h3>Filters</h3>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label>Status</label>
            <select 
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Search</label>
            <input
              type="text"
              placeholder="Seller name, email, or reference ID"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Min Amount (₹)</label>
            <input
              type="number"
              placeholder="0"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange("minAmount", e.target.value)}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Max Amount (₹)</label>
            <input
              type="number"
              placeholder="100000"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
            />
          </div>
        </div>

        <div className={styles.filterActions}>
          <button className={styles.resetButton} onClick={resetFilters}>
            Reset Filters
          </button>
          <div className={styles.resultCount}>
            Showing {filteredWithdrawals.length} of {withdrawals.length} requests
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className={styles.tableSection}>
        {filteredWithdrawals.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h3>No Withdrawals Found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Seller</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Reference ID</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal._id}>
                      <td>{formatDate(withdrawal.requestedAt)}</td>
                      <td>
                        <div className={styles.sellerInfo}>
                          <div className={styles.sellerName}>{withdrawal.sellerName}</div>
                          <div className={styles.sellerEmail}>{withdrawal.sellerEmail}</div>
                        </div>
                      </td>
                      <td className={styles.amount}>₹{withdrawal.amount.toFixed(2)}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(withdrawal.status)}`}>
                          {withdrawal.status}
                        </span>
                      </td>
                      <td className={styles.referenceId}>{withdrawal.referenceId}</td>
                      <td>
                        <button
                          className={styles.viewButton}
                          onClick={() => handleViewDetails(withdrawal)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageButton}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className={styles.pageButton}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Modal */}
      {selectedWithdrawal && (
        <div className={styles.modal} onClick={() => setSelectedWithdrawal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Withdrawal Details</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setSelectedWithdrawal(null)}
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
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Status:</span>
                      <span className={`${styles.statusBadge} ${getStatusClass(selectedWithdrawal.status)}`}>
                        {selectedWithdrawal.status}
                      </span>
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

                {/* Admin Notes / Rejection Reason */}
                {selectedWithdrawal.adminNotes && (
                  <div className={styles.section}>
                    <h3>Admin Notes</h3>
                    <div className={styles.notesBox}>
                      {selectedWithdrawal.adminNotes}
                    </div>
                  </div>
                )}

                {selectedWithdrawal.rejectionReason && (
                  <div className={styles.section}>
                    <h3>Rejection Reason</h3>
                    <div className={styles.rejectionBox}>
                      {selectedWithdrawal.rejectionReason}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className={styles.section}>
                  <h3>Timeline</h3>
                  <div className={styles.timeline}>
                    <div className={styles.timelineItem}>
                      <span className={styles.label}>Requested:</span>
                      <span className={styles.value}>{formatDate(selectedWithdrawal.requestedAt)}</span>
                    </div>
                    {selectedWithdrawal.processedAt && (
                      <div className={styles.timelineItem}>
                        <span className={styles.label}>Processed:</span>
                        <span className={styles.value}>{formatDate(selectedWithdrawal.processedAt)}</span>
                      </div>
                    )}
                  </div>
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

export default AdminWithdrawalHistory;
