import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerGrid}>
          
          <div className={styles.footerColumn}>
            <h4 className={styles.footerTitle}>Embroidex</h4>
            <p className={styles.footerDesc}>
              Your trusted marketplace for premium embroidery designs. 
              Buy, sell, and create with confidence.
            </p>
          </div>

          <div className={styles.footerColumn}>
            <h5 className={styles.footerHeading}>Quick Links</h5>
            <ul className={styles.footerLinks}>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/explore">Explore Designs</Link></li>
              <li><Link to="/seller/upload">Sell Designs</Link></li>
              <li><Link to="/about">About Us</Link></li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h5 className={styles.footerHeading}>Support</h5>
            <ul className={styles.footerLinks}>
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>

          <div className={styles.footerColumn}>
            <h5 className={styles.footerHeading}>Connect</h5>
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialIcon}>📘</a>
              <a href="#" className={styles.socialIcon}>📷</a>
              <a href="#" className={styles.socialIcon}>🐦</a>
              <a href="#" className={styles.socialIcon}>💼</a>
            </div>
          </div>

        </div>

        <div className={styles.footerBottom}>
          <p> 2026 Embroidex. All rights reserved.</p>
          <div className={styles.footerBottomLinks}>
            <Link to="/privacy">Privacy Policy</Link>
            <span className={styles.separator}>•</span>
            <Link to="/terms">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;