import { Link } from "react-router-dom";
import { MdDesignServices, MdPeople, MdTrendingUp, MdPalette, MdAttachMoney } from "react-icons/md";
import styles from "./HeroSection.module.css";

const HeroSection = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.overlay} />
      <div className={styles.heroContent}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>
            Discover Premium <span className={styles.highlight}>Embroidery Designs</span>
          </h1>

          {/* <p className={styles.heroSubtitle}>
            The world's largest marketplace for high-quality embroidery files.
            Buy from talented creators, sell your designs, and bring your creative visions to life.
          </p> */}

          {/* <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <div className={styles.statIconWrapper}>
                <MdDesignServices className={styles.statIcon} />
              </div>
              <div className={styles.statText}>
                <strong>10,000+</strong>
                <span>Premium Designs</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statIconWrapper}>
                <MdPeople className={styles.statIcon} />
              </div>
              <div className={styles.statText}>
                <strong>5,000+</strong>
                <span>Active Creators</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statIconWrapper}>
                <MdTrendingUp className={styles.statIcon} />
              </div>
              <div className={styles.statText}>
                <strong>50,000+</strong>
                <span>Happy Downloads</span>
              </div>
            </div>
          </div> */}

          <div className={styles.heroButtons}>
            <Link to="/explore" className={`btn-primary-custom ${styles.primaryBtn}`}>
              <MdPalette />
              Buy Design
            </Link>
            <Link to="/seller/register" className={styles.secondaryBtn}>
              <MdAttachMoney />
              Start Selling
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
