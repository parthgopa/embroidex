import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdPerson, MdMenu, MdClose } from "react-icons/md";
import API from "../services/api";
import BecomeSellerModal from "./BecomeSellerModal";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      fetchUserInfo(token);
    } else {
      setIsLoggedIn(false);
      setIsSeller(false);
    }
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const res = await API.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log(res);
      setIsSeller(res.data.is_seller);
      setUserName(res.data.name || "User");
    } catch (err) {
      console.error("Failed to fetch user info", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setIsSeller(false);
    setUserName("");
    setShowProfileMenu(false);
    setShowMobileMenu(false);
    navigate("/");
  };

  return (
    <>
      {/* Become Seller Modal - Shows once for first-time buyers */}
      <BecomeSellerModal isLoggedIn={isLoggedIn} isSeller={isSeller} />

      <nav className={`navbar-custom ${styles.nav}`}>
        <div className={`container ${styles.navContainer}`}>
          {/* Logo Image below*/}

          <Link to="/" className={styles.logo}>
            <img src="/Embroidex.png" alt="Embroidex" className={styles.logoImage} />
            Embroidex
          </Link>

          {/* Desktop Navigation */}
          <div className={styles.navLinks}>
            <Link to="/" className="nav-link-custom">Home</Link>
            <Link to="/explore" className="nav-link-custom">Buy Design</Link>

            {!isLoggedIn ? (
              <>
                <Link to="/login" className="nav-link-custom">Login</Link>
                <button onClick={() => navigate("/signup")} className="btn-primary-custom">
                  Get Started
                </button>
              </>
            ) : (
              <>
                {/* My Purchases - Visible for all logged-in users */}
                <Link to="/my-purchases" className="nav-link-custom">My Purchases</Link>

                {/* Seller Tabs - Visible for sellers */}
                {isSeller && (
                  <>
                    <Link to="/seller/my-designs" className="nav-link-custom">My Designs</Link>
                    <Link to="/seller/upload" className="nav-link-custom">Upload Design</Link>
                    <Link to="/seller/earnings" className="nav-link-custom">My Earnings</Link>
                  </>
                )}

                {/* Become a Seller Button - Only for buyers */}
                {!isSeller && (
                  <Link to="/seller/register" className={styles.becomeSellerBtn}>
                    Become a Seller
                  </Link>
                )}

                {/* Profile Dropdown - Minimal (Profile + Logout only) */}
                <div className={styles.profileDropdown}>
                  <button
                    className={styles.profileBtn}
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                  >
                    <MdPerson size={20} />
                    <span>{userName}</span>
                  </button>

                  {showProfileMenu && (
                    <div className={styles.dropdownMenu}>
                      <Link
                        to="/profile"
                        className={styles.dropdownItem}
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <MdPerson size={16} /> Profile
                      </Link>

                      <div className={styles.divider}></div>

                      <button
                        className={`${styles.dropdownItem} ${styles.logoutItem}`}
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={styles.mobileToggle}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <MdClose size={24} /> : <MdMenu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu - Right Side Drawer (OUTSIDE nav to avoid stacking context issues) */}
      {showMobileMenu && (
        <>
          <div className={styles.mobileOverlay} onClick={() => setShowMobileMenu(false)}></div>
          <div className={styles.mobileMenu}>
            <div className={styles.mobileMenuHeader}>
              <span className={styles.mobileMenuTitle}>Menu</span>
              <button className={styles.mobileCloseBtn} onClick={() => setShowMobileMenu(false)}>
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

              {!isLoggedIn ? (
                <>
                  <div className={styles.mobileDivider}></div>
                  <Link to="/login" className={styles.mobileMenuItem} onClick={() => setShowMobileMenu(false)}>
                    Login
                  </Link>
                  <Link to="/signup" className={styles.mobileMenuItem} onClick={() => setShowMobileMenu(false)}>
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <div className={styles.mobileDivider}></div>
                  <Link to="/profile" className={styles.mobileMenuItem} onClick={() => setShowMobileMenu(false)}>
                    Profile & Settings
                  </Link>
                  <Link to="/my-purchases" className={styles.mobileMenuItem} onClick={() => setShowMobileMenu(false)}>
                    My Purchases
                  </Link>

                  {isSeller && (
                    <>
                      <div className={styles.mobileDivider}></div>
                      <Link to="/seller/my-designs" className={styles.mobileMenuItem} onClick={() => setShowMobileMenu(false)}>
                        My Designs
                      </Link>
                      <Link to="/seller/upload" className={styles.mobileMenuItem} onClick={() => setShowMobileMenu(false)}>
                        Upload Design
                      </Link>
                      <Link to="/seller/earnings" className={styles.mobileMenuItem} onClick={() => setShowMobileMenu(false)}>
                        My Earnings
                      </Link>
                    </>
                  )}

                  {!isSeller && (
                    <Link to="/seller/register" className={styles.mobileMenuItem} onClick={() => setShowMobileMenu(false)}>
                      Become a Seller
                    </Link>
                  )}

                  <div className={styles.mobileDivider}></div>
                  <button className={`${styles.mobileMenuItem} ${styles.logoutBtn}`} onClick={handleLogout}>
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;