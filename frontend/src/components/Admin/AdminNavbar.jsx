import { useNavigate } from "react-router-dom";
import { MdLogout, MdAdminPanelSettings } from "react-icons/md";
import styles from "./AdminNavbar.module.css";

const AdminNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <div className={styles.navLeft}>
          <MdAdminPanelSettings className={styles.navIcon} />
          <h1 className={styles.navTitle}>Embroidex Admin</h1>
        </div>

        <div className={styles.navRight}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <MdLogout className={styles.logoutIcon} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
