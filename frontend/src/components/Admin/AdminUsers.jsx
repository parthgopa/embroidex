import { useState } from "react";
import { MdClose, MdPerson, MdEmail, MdPhone, MdBusiness, MdPayment, MdVerified } from "react-icons/md";
import styles from "./AdminUsers.module.css";

const AdminUsers = ({ users, onDeactivate, onReactivate }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      filterRole === "all" ||
      (filterRole === "seller" && u.is_seller) ||
      (filterRole === "buyer" && !u.is_seller) ||
      (filterRole === "admin" && u.role === "admin") ||
      (filterRole === "inactive" && u.is_active === false);
    return matchesSearch && matchesRole;
  });

  const getStatusBadge = (user) => {
    if (user.is_active === false) return <span className="tag tag-rejected">Inactive</span>;
    if (user.role === "admin") return <span className="tag tag-approved">Admin</span>;
    if (user.is_seller) return <span className="tag tag-approved">Seller</span>;
    return <span className="tag tag-pending">Buyer</span>;
  };

  const formatDate = (val) => {
    if (!val) return "—";
    const d = val.$date ? new Date(val.$date) : new Date(val);
    return isNaN(d) ? "—" : d.toLocaleDateString();
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h1 className={styles.pageTitle}>Users Management</h1>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search by name or email..."
            className="input-custom"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select className="input-custom" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">All Users</option>
            <option value="seller">Sellers</option>
            <option value="buyer">Buyers Only</option>
            <option value="admin">Admins</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <p className={styles.resultCount}>{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found</p>

      <div className={`container-box ${styles.tableContainer}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Seller</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id} className={user.is_active === false ? styles.inactiveRow : ""}>
                <td><strong>{user.name}</strong></td>
                <td>{user.email}</td>
                <td>{getStatusBadge(user)}</td>
                <td>{user.is_seller ? <span className="tag tag-approved">Yes</span> : <span className="tag">No</span>}</td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                  <div className={styles.rowActions}>
                    <button className="btn-outline-custom" style={{padding:"4px 12px",fontSize:"13px"}} onClick={() => setSelectedUser(user)}>
                      Details
                    </button>
                    {user.is_active === false ? (
                      <button className={styles.activateBtn} onClick={() => onReactivate(user._id)}>Reactivate</button>
                    ) : (
                      <button className={styles.deactivateBtn} onClick={() => onDeactivate(user._id)}>Deactivate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className={styles.emptyState}><p>No users found</p></div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className={styles.modal} onClick={() => setSelectedUser(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>User Details</h2>
              <button className={styles.closeButton} onClick={() => setSelectedUser(null)}><MdClose /></button>
            </div>
            <div className={styles.modalBody}>
              {/* Avatar + name */}
              <div className={styles.userAvatar}>
                <div className={styles.avatarCircle}>{(selectedUser.name || "?")[0].toUpperCase()}</div>
                <div>
                  <h3 className={styles.userName}>{selectedUser.name}</h3>
                  <p className={styles.userEmail}>{selectedUser.email}</p>
                  <div className={styles.badgeRow}>
                    {getStatusBadge(selectedUser)}
                    {selectedUser.is_seller && <span className="tag tag-approved">Seller</span>}
                  </div>
                </div>
              </div>

              {/* Basic info */}
              <div className={styles.infoSection}>
                <h4><MdPerson style={{marginRight:6,verticalAlign:"middle"}}/>Account Info</h4>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}><span className={styles.detailLabel}>User ID</span><span className={styles.detailValue} style={{fontSize:"12px",wordBreak:"break-all"}}>{selectedUser._id}</span></div>
                  <div className={styles.detailItem}><span className={styles.detailLabel}>Role</span><span className={styles.detailValue}>{selectedUser.role || "buyer"}</span></div>
                  <div className={styles.detailItem}><span className={styles.detailLabel}>Status</span><span className={styles.detailValue}>{selectedUser.is_active === false ? "Inactive" : "Active"}</span></div>
                  <div className={styles.detailItem}><span className={styles.detailLabel}>Joined</span><span className={styles.detailValue}>{formatDate(selectedUser.created_at)}</span></div>
                  <div className={styles.detailItem}><span className={styles.detailLabel}>Last Updated</span><span className={styles.detailValue}>{formatDate(selectedUser.updatedAt)}</span></div>
                </div>
              </div>

              {/* Seller info */}
              {selectedUser.is_seller && selectedUser.seller_info && (
                <div className={styles.infoSection}>
                  <h4><MdBusiness style={{marginRight:6,verticalAlign:"middle"}}/>Seller Info</h4>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}><span className={styles.detailLabel}><MdPhone style={{verticalAlign:"middle",marginRight:4}}/>Mobile</span><span className={styles.detailValue}>{selectedUser.seller_info.mobile_number || "—"}</span></div>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Website</span><span className={styles.detailValue}>{selectedUser.seller_info.business_website || "—"}</span></div>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Address</span><span className={styles.detailValue}>{selectedUser.seller_info.business_address || "—"}</span></div>
                  </div>
                </div>
              )}

              {/* Payout info */}
              {selectedUser.payoutDetails && (
                <div className={styles.infoSection}>
                  <h4><MdPayment style={{marginRight:6,verticalAlign:"middle"}}/>Payout Details</h4>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Type</span><span className={styles.detailValue}>{selectedUser.payoutDetails.type || "—"}</span></div>
                    {selectedUser.payoutDetails.upiId && (
                      <div className={styles.detailItem}><span className={styles.detailLabel}>UPI ID</span><span className={styles.detailValue}>{selectedUser.payoutDetails.upiId}</span></div>
                    )}
                    {selectedUser.payoutDetails.accountNumber && (
                      <div className={styles.detailItem}><span className={styles.detailLabel}>Account No.</span><span className={styles.detailValue}>{selectedUser.payoutDetails.accountNumber}</span></div>
                    )}
                    {selectedUser.payoutDetails.ifsc && (
                      <div className={styles.detailItem}><span className={styles.detailLabel}>IFSC</span><span className={styles.detailValue}>{selectedUser.payoutDetails.ifsc}</span></div>
                    )}
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Verified</span>
                      <span className={styles.detailValue}>
                        {selectedUser.payoutDetails.verified
                          ? <span style={{color:"#16a34a",display:"flex",alignItems:"center",gap:4}}><MdVerified />Yes</span>
                          : <span style={{color:"#d97706"}}>No</span>}
                      </span>
                    </div>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Added</span><span className={styles.detailValue}>{formatDate(selectedUser.payoutDetails.addedAt)}</span></div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className={styles.actionRow}>
                {selectedUser.is_active === false ? (
                  <button className={styles.activateBtn} onClick={() => { onReactivate(selectedUser._id); setSelectedUser(null); }}>
                    Reactivate Account
                  </button>
                ) : (
                  <button className={styles.deactivateBtn} onClick={() => { onDeactivate(selectedUser._id); setSelectedUser(null); }}>
                    Deactivate Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
