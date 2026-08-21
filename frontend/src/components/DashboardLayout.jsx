/**
 * DashboardLayout Component
 * Master Layout Wrapper with fixed Left Sidebar and dynamic Right Content Area (<Outlet />)
 */

import { useState, useEffect } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { MdMenu, MdShoppingCart, MdSearch } from "react-icons/md";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import FloatingCartWidget from "./FloatingCartWidget";
import BecomeSellerModal from "./BecomeSellerModal";
import { useAuth } from "../context/authContext";
import { getCartCount } from "../utils/cartUtils";
import styles from "./DashboardLayout.module.css";

const DashboardLayout = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { user, isSeller, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-close mobile sidebar whenever route changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

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

  const initials = user?.name 
    ? user.name.split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div className={styles.layoutWrapper}>
      {/* Role-Based Left Sidebar */}
      <Sidebar 
        isOpen={mobileSidebarOpen} 
        onClose={() => setMobileSidebarOpen(false)} 
      />

      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div 
          className={styles.mobileBackdrop} 
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Right-Side Content & Viewport Container */}
      <div className={styles.mainViewport}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button 
              type="button" 
              className={styles.hamburgerBtn}
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <MdMenu size={22} />
            </button>

            <Link to="/" className={styles.mobileLogo}>
              <img src="/Embroidex.png" alt="Embroidex" className={styles.mobileLogoImg} />
              <span className={styles.mobileLogoText}>Embroidex</span>
            </Link>
          </div>

          <div className={styles.topBarRight}>
            <Link to="/" className={styles.topNavLink}>
              Home
            </Link>

            <Link to="/explore" className={styles.topNavLink}>
              Buy Design
            </Link>

            <Link to="/cart" className={styles.cartIconBtn} title="Shopping Cart">
              <MdShoppingCart size={20} />
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </Link>

            {isAuthenticated ? (
              <Link to="/profile" className={styles.profileAvatarBtn} title="My Profile">
                <span className={styles.avatarInitials}>{initials}</span>
              </Link>
            ) : (
              <button 
                type="button" 
                className={styles.topLoginBtn}
                onClick={() => navigate("/login")}
              >
                Login
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className={styles.pageContent}>
          {children || <Outlet />}
        </main>

        {/* Global Floating Widgets & Modals */}
        <FloatingCartWidget />
        <BecomeSellerModal isLoggedIn={isAuthenticated} isSeller={isSeller} />

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
