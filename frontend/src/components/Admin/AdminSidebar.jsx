import { 
  MdDashboard, 
  MdDesignServices, 
  MdCheckCircle, 
  MdPeople,
  MdAccountBalanceWallet,
  MdSettings,
  MdHome,
  MdCategory
} from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import styles from "./AdminSidebar.module.css";

const AdminSidebar = ({ stats }) => {
  const location = useLocation();
  
  // Determine active section from URL
  const getActiveSection = () => {
    const path = location.pathname;
    if (path === "/admin/designs") return "designs";
    if (path === "/admin/review") return "review";
    if (path === "/admin/users") return "users";
    if (path === "/admin/settings") return "settings";
    if (path === "/admin/withdrawals") return "withdrawals";
    if (path === "/admin/homepage-config") return "homepage-config";
    if (path === "/admin/platform-categories") return "platform-categories";
    return "dashboard";
  };
  
  const activeSection = getActiveSection();
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: MdDashboard,
      path: "/admin/dashboard",
    },
    {
      id: "designs",
      label: "Designs",
      icon: MdDesignServices,
      path: "/admin/designs",
      badge: null,
    },
    {
      id: "review",
      label: "Review Queue",
      icon: MdCheckCircle,
      path: "/admin/review",
      badge: stats?.pendingDesigns > 0 ? stats.pendingDesigns : null,
    },
    {
      id: "users",
      label: "Users",
      icon: MdPeople,
      path: "/admin/users",
    },
    {
      id: "settings",
      label: "Settings",
      icon: MdSettings,
      path: "/admin/settings",
    },
    {
      id: "homepage-config",
      label: "Homepage Config",
      icon: MdHome,
      path: "/admin/homepage-config",
    },
    {
      id: "platform-categories",
      label: "Platform Categories",
      icon: MdCategory,
      path: "/admin/platform-categories",
    },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>Admin Panel</h2>
      </div>

      <nav className={styles.sidebarNav}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`${styles.navItem} ${
                activeSection === item.id ? styles.navItemActive : ""
              }`}
            >
              <Icon className={styles.navIcon} />
              {item.label}
              {item.badge && <span className={styles.badge}>{item.badge}</span>}
            </Link>
          );
        })}
        
        {/* Withdrawal Requests */}
        <Link 
          to="/admin/withdrawals" 
          className={`${styles.navItem} ${
            activeSection === "withdrawals" ? styles.navItemActive : ""
          }`}
        >
          <MdAccountBalanceWallet className={styles.navIcon} />
          Withdrawal Requests
        </Link>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
