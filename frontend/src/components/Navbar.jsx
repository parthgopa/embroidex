import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { MdMenu, MdClose, MdDashboard, MdLogin, MdPersonAdd } from "react-icons/md";
import { useAuth } from "../context/authContext";
import BecomeSellerModal from "./BecomeSellerModal";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const { isSeller, isAuthenticated, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    setShowMobileMenu(false);
    if (isSeller) {
      navigate("/seller/my-designs");
    } else {
      navigate("/profile");
    }
  };

  const handleLogout = () => {
    logout();
    setShowMobileMenu(false);
    navigate("/");
  };

  return (
    <>
      {/* Become Seller Modal - Shows once for first-time buyers */}
      <BecomeSellerModal isLoggedIn={isAuthenticated} isSeller={isSeller} />

      <nav className={`navbar-custom ${styles.nav}`}>
        <div className={`container ${styles.navContainer}`}>
          {/* Logo */}
          <Link to="/" className={styles.logo}>
            <img src="/Embroidex.png" alt="Embroidex" className={styles.logoImage} />
            <span>Embroidex</span>
          </Link>

          {/* Desktop Navigation */}
          <div className={styles.navLinks}>
            <NavLink 
              to="/" 
              end
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
            >
              Home
            </NavLink>

            <NavLink 
              to="/explore" 
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
            >
              Buy Design
            </NavLink>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleDashboardClick}
                className={styles.dashboardBtn}
              >
                <MdDashboard size={18} />
                <span>Dashboard</span>
              </button>
            ) : (
              <div className={styles.authGroup}>
                <Link to="/login" className={styles.loginLink}>
                  Login
                </Link>
                <Link to="/signup" className={styles.signupBtn}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className={styles.mobileToggle}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle navigation menu"
          >
            {showMobileMenu ? <MdClose size={24} /> : <MdMenu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <>
          <div className={styles.mobileOverlay} onClick={() => setShowMobileMenu(false)}></div>
          <div className={styles.mobileMenu}>
            <div className={styles.mobileMenuHeader}>
              <span className={styles.mobileMenuTitle}>Menu</span>
              <button 
                type="button" 
                className={styles.mobileCloseBtn} 
                onClick={() => setShowMobileMenu(false)}
                aria-label="Close menu"
              >
                <MdClose size={24} />
              </button>
            </div>

            <div className={styles.mobileMenuContent}>
              <Link to="/" className={styles.mobileMenuItem} onClick={() => setShowMobileMenu(false)}>
                Home
              </Link>
              <Link to="/explore" className={styles.mobileMenuItem} onClick={() => setShowMobileMenu(false)}>
                Buy Design
              </Link>

              {isAuthenticated ? (
                <>
                  <button 
                    type="button" 
                    className={`${styles.mobileMenuItem} ${styles.mobileDashboardBtn}`} 
                    onClick={handleDashboardClick}
                  >
                    <MdDashboard size={18} />
                    <span>Dashboard</span>
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.mobileMenuItem} ${styles.mobileLogoutBtn}`} 
                    onClick={handleLogout}
                  >
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className={styles.mobileAuthGroup}>
                  <Link 
                    to="/login" 
                    className={`${styles.mobileMenuItem} ${styles.mobileLoginBtn}`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <MdLogin size={18} />
                    <span>Login</span>
                  </Link>
                  <Link 
                    to="/signup" 
                    className={`${styles.mobileMenuItem} ${styles.mobileSignupBtn}`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <MdPersonAdd size={18} />
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;