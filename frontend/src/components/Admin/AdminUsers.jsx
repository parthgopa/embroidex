import styles from "./AdminUsers.module.css";

const AdminUsers = ({ users }) => {
  return (
    <div className={styles.section}>
      <h1 className={styles.pageTitle}>Users Management</h1>

      <div className={`container-box ${styles.tableContainer}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Seller Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>
                  <strong>{user.name}</strong>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className="tag tag-approved">{user.role || "buyer"}</span>
                </td>
                <td>
                  {user.is_seller ? (
                    <span className="tag tag-approved">Seller</span>
                  ) : (
                    <span className="tag tag-pending">Buyer Only</span>
                  )}
                </td>
                <td>{new Date(user.created_at || Date.now()).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
