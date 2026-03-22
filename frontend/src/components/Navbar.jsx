import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdPerson, MdMenu, MdClose } from "react-icons/md";
import API from "../services/api";
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
    <nav className={`navbar-custom ${styles.nav}`}>
      <div className={`container ${styles.navContainer}`}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          Embroidex
        </Link>

        {/* Desktop Navigation */}
        <div className={styles.navLinks}>
          <Link to="/" className="nav-link-custom">Home</Link>
          <Link to="/explore" className="nav-link-custom">Explore</Link>

          {!isLoggedIn ? (
            <>
              <Link to="/login" className="nav-link-custom">Login</Link>
              <button onClick={() => navigate("/signup")} className="btn-primary-custom">
                Get Started
              </button>
            </>
          ) : (
            <>
              {/* Profile Dropdown */}
              <div className={styles.profileDropdown}>
                <button 
                  className={styles.profileBtn}
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <MdPerson size={18} />
                  <span>{userName}</span>
                </button>
                
                {showProfileMenu && (
                  <div className={styles.dropdownMenu}>
                    <Link 
                      to="/profile" 
                      className={styles.dropdownItem}
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <MdPerson size={16} /> Profile & Settings
                    </Link>
                    
                    <div className={styles.divider}></div>
                    
                    <Link 
                      to="/my-purchases" 
                      className={styles.dropdownItem}
                      onClick={() => setShowProfileMenu(false)}
                    >
                      My Purchases
                    </Link>
                    
                    {isSeller && (
                      <>
                        <div className={styles.divider}></div>
                        <div className={styles.dropdownHeader}>Seller Options</div>
                        <Link 
                          to="/seller/my-designs" 
                          className={styles.dropdownItem}
                          onClick={() => setShowProfileMenu(false)}
                        >
                          My Designs
                        </Link>
                        <Link 
                          to="/seller/upload" 
                          className={styles.dropdownItem}
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Upload Design
                        </Link>
                        <Link 
                          to="/seller/earnings" 
                          className={styles.dropdownItem}
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Earnings & Withdrawals
                        </Link>
                      </>
                    )}
                    
                    {!isSeller && (
                      <>
                        <div className={styles.divider}></div>
                        <Link 
                          to="/seller/register" 
                          className={styles.dropdownItem}
                          onClick={() => setShowProfileMenu(false)}
                        >
                          Become a Seller
                        </Link>
                      </>
                    )}
                    
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

      {/* Mobile Menu */}
      {showMobileMenu && isLoggedIn && (
        <div className={styles.mobileMenu}>
          <Link to="/profile" className={styles.mobileMenuItem} onClick={() => setShowMobileMenu(false)}>
            Profile & Settings
          </Link>
          <Link to="/my-purchases" className={styles.mobileMenuItem} onClick={() => setShowMobileMenu(false)}>
            My Purchases
          </Link>
          
          {isSeller && (
            <>
              <div className={styles.mobileDivider}>Seller Options</div>
              <Link to="/seller/my-designs" className={styles.mobileMenuItem} onClick={() => setShowMobileMenu(false)}>
                My Designs
              </Link>
              <Link to="/seller/upload" className={styles.mobileMenuItem} onClick={() => setShowMobileMenu(false)}>
                Upload Design
              </Link>
              <Link to="/seller/earnings" className={styles.mobileMenuItem} onClick={() => setShowMobileMenu(false)}>
                Earnings
              </Link>
            </>
          )}
          
          {!isSeller && (
            <Link to="/seller/register" className={styles.mobileMenuItem} onClick={() => setShowMobileMenu(false)}>
              Become a Seller
            </Link>
          )}
          
          <button className={`${styles.mobileMenuItem} ${styles.logoutBtn}`} onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;