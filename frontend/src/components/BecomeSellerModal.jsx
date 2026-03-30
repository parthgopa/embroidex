/**
 * Become Seller Modal
 * Shows once to first-time buyers encouraging them to become sellers
 * Indian-style messaging with professional UI
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdClose, MdTrendingUp, MdAccountBalanceWallet, MdPeople } from "react-icons/md";
import styles from "./BecomeSellerModal.module.css";

const BecomeSellerModal = ({ isLoggedIn, isSeller }) => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Only show for logged-in buyers (not sellers)
    if (isLoggedIn && !isSeller) {
      // Check if user has seen the modal before
      const hasSeenModal = localStorage.getItem("hasSeenSellerModal");
      
      if (!hasSeenModal) {
        // Show modal after a short delay for better UX
        const timer = setTimeout(() => {
          setShowModal(true);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isLoggedIn, isSeller]);

  const handleBecomeSeller = () => {
    localStorage.setItem("hasSeenSellerModal", "true");
    setShowModal(false);
    navigate("/seller/register");
  };

  const handleMaybeLater = () => {
    localStorage.setItem("hasSeenSellerModal", "true");
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleMaybeLater}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          className={styles.closeButton}
          onClick={handleMaybeLater}
          aria-label="Close modal"
        >
          <MdClose size={24} />
        </button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <MdTrendingUp size={48} />
          </div>
          <h2 className={styles.title}>Turn Your Creativity into Income! 🎨</h2>
          <p className={styles.subtitle}>
            Join thousands of designers earning from their embroidery designs
          </p>
        </div>

        {/* Benefits */}
        <div className={styles.benefits}>
          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}>
              <MdAccountBalanceWallet size={24} />
            </div>
            <div className={styles.benefitContent}>
              <h3>Earn While You Create</h3>
              <p>Set your own prices and earn from every sale</p>
            </div>
          </div>

          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}>
              <MdPeople size={24} />
            </div>
            <div className={styles.benefitContent}>
              <h3>Reach Lakhs of Buyers</h3>
              <p>Connect with embroidery enthusiasts across India</p>
            </div>
          </div>

          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}>
              <MdTrendingUp size={24} />
            </div>
            <div className={styles.benefitContent}>
              <h3>Grow Your Business</h3>
              <p>Build your brand and expand your customer base</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className={styles.cta}>
          <p className={styles.ctaText}>
            <strong>शुरुआत करें आज ही!</strong> It's completely free to start selling.
          </p>
          <div className={styles.buttonGroup}>
            <button 
              className={styles.primaryButton}
              onClick={handleBecomeSeller}
            >
              Become a Seller
            </button>
            <button 
              className={styles.secondaryButton}
              onClick={handleMaybeLater}
            >
              Maybe Later
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className={styles.footerNote}>
          No hidden charges • Quick approval • Start earning in 24 hours
        </p>
      </div>
    </div>
  );
};

export default BecomeSellerModal;
