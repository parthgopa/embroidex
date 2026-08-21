/**
 * Sidebar Component
 * Unified, Role-Based Left Navigation for Buyers and Sellers
 */

import { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { 
  MdHome,
  MdExplore,
  MdShoppingCart,
  MdShoppingBag,
  MdCloudUpload,
  MdCollectionsBookmark,
  MdAccountBalanceWallet,
  MdPayment,
  MdStorefront,
  MdPerson,
  MdLogout,
  MdLogin,
  MdPersonAdd,
  MdClose,
  MdCheckCircle,
  MdArrowForward
} from "react-icons/md";
import { useAuth } from "../context/authContext";
import { getCartCount } from "../utils/cartUtils";
import styles from "./Sidebar.module.css";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isSeller, isAuthenticated, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  const updateCartBadge = () => {
    const userId = localStorage.getItem("user_id");
    setCartCount(getCartCount(userId));
  };

  useEffect(() => {
    updateCartBadge();
    window.addEventListener("embroidex_cart_updated", updateCartBadge);
    return () => {
      window.removeEventListener("embroidex_cart_updated", updateCartBadge);
    };
  }, []);

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
    navigate("/");
  };

  const initials = user?.name 
    ? user.name.split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
      {/* Brand Header */}
      <div className={styles.brandHeader}>
        <Link to="/" className={styles.brandLink} onClick={handleLinkClick}>
          <img src="/Embroidex.png" alt="Embroidex" className={styles.brandLogo} />
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Embroidex</span>
            <span className={styles.brandSubtitle}>Design Hub</span>
          </div>
        </Link>

        <button 
          type="button" 
          className={styles.mobileCloseBtn} 
          onClick={onClose}
          aria-label="Close navigation"
        >
          <MdClose size={22} />
        </button>
      </div>

      {/* User Role Card (When logged in) */}
      {isAuthenticated && (
        <div className={styles.userCard}>
          <div className={styles.userAvatar}>
            <span>{initials}</span>
          </div>
          <div className={styles.userMeta}>
            <span className={styles.userName}>{user?.name || "User"}</span>
            {isSeller && (
              <span className={styles.sellerPill}>
                <MdCheckCircle size={12} /> Seller Account
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation Links Area */}
      <div className={styles.navContainer}>
        {/* Buyer / General Section */}
        <div className={styles.navSection}>
          <span className={styles.sectionLabel}>ACCOUNT & ORDERS</span>
          <nav className={styles.navLinks}>
            {isAuthenticated && (
              <NavLink 
                to="/my-purchases" 
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={handleLinkClick}
              >
                <MdShoppingBag className={styles.navIcon} size={20} />
                <span>My Purchases</span>
              </NavLink>
            )}

            <NavLink 
              to="/cart" 
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              onClick={handleLinkClick}
            >
              <div className={styles.cartIconWrapper}>
                <MdShoppingCart className={styles.navIcon} size={20} />
                {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
              </div>
              <span>My Cart</span>
            </NavLink>

            {isAuthenticated && (
              <NavLink 
                to="/profile" 
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={handleLinkClick}
              >
                <MdPerson className={styles.navIcon} size={20} />
                <span>My Profile</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Seller Studio Section - Reactive to Seller Role */}
        {isSeller && (
          <div className={styles.navSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>SELLER STUDIO</span>
              <span className={styles.sellerSectionBadge}>Pro</span>
            </div>
            <nav className={styles.navLinks}>
              <NavLink 
                to="/seller/upload" 
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={handleLinkClick}
              >
                <MdCloudUpload className={styles.navIcon} size={20} />
                <span>Upload Design</span>
              </NavLink>

              <NavLink 
                to="/seller/my-designs" 
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={handleLinkClick}
              >
                <MdCollectionsBookmark className={styles.navIcon} size={20} />
                <span>My Designs</span>
              </NavLink>

              <NavLink 
                to="/seller/earnings" 
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={handleLinkClick}
              >
                <MdAccountBalanceWallet className={styles.navIcon} size={20} />
                <span>Earnings & Payouts</span>
              </NavLink>

              <NavLink 
                to="/seller/payment-settings" 
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={handleLinkClick}
              >
                <MdPayment className={styles.navIcon} size={20} />
                <span>Payment Settings</span>
              </NavLink>
            </nav>
          </div>
        )}

        {/* Become a Seller Banner - Shown for logged-in non-sellers */}
        {isAuthenticated && !isSeller && (
          <div className={styles.sellerCtaBox}>
            <div className={styles.sellerCtaIcon}>
              <MdStorefront size={22} />
            </div>
            <div className={styles.sellerCtaText}>
              <h4>Sell Your Designs</h4>
              <p>Monetize embroidery files with verified daily payouts</p>
            </div>
            <Link 
              to="/seller/register" 
              className={styles.sellerCtaBtn}
              onClick={handleLinkClick}
            >
              <span>Become a Seller</span>
              <MdArrowForward size={14} />
            </Link>
          </div>
        )}
      </div>

      {/* Sidebar Footer (Profile / Auth) */}
      <div className={styles.sidebarFooter}>
        {isAuthenticated ? (
          <div className={styles.footerActions}>
            <NavLink 
              to="/profile" 
              className={({ isActive }) => `${styles.footerItem} ${isActive ? styles.footerItemActive : ""}`}
              onClick={handleLinkClick}
            >
              <MdPerson className={styles.footerIcon} size={20} />
              <span>Profile & Settings</span>
            </NavLink>

            <button 
              type="button" 
              className={styles.logoutBtn} 
              onClick={handleLogout}
            >
              <MdLogout size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className={styles.guestAuthActions}>
            <Link 
              to="/login" 
              className={styles.loginBtn}
              onClick={handleLinkClick}
            >
              <MdLogin size={17} />
              <span>Login</span>
            </Link>
            <Link 
              to="/signup" 
              className={styles.signupBtn}
              onClick={handleLinkClick}
            >
              <MdPersonAdd size={17} />
              <span>Get Started</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
