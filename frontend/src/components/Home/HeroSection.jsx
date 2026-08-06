import { Link, useNavigate } from "react-router-dom";
import { MdPalette, MdAttachMoney } from "react-icons/md";
import styles from "./HeroSection.module.css";

const HeroSection = ({ topCategories = [] }) => {
  const navigate = useNavigate();

  const handleCategoryClick = (category, subcategory = null) => {
    let url = `/explore?category=${encodeURIComponent(category)}`;
    if (subcategory) {
      url += `&subcategory=${encodeURIComponent(subcategory)}`;
    }
    navigate(url);
  };

  return (
    <section className={styles.heroSectionWrapper}>
      {/* Amazon-style Dark Category Nav Bar */}
      {topCategories.length > 0 && (
        <nav className={styles.topNavbar}>
          <div className={styles.navContainer}>
            {topCategories.map((cat, idx) => (
              <div key={idx} className={styles.navItem}>
                <button
                  className={styles.navLink}
                  onClick={() => handleCategoryClick(cat.name)}
                >
                  {cat.name}
                  {cat.subcategories?.length > 0 && (
                    <span className={styles.navLinkChevron}>▾</span>
                  )}
                </button>

                {cat.subcategories && cat.subcategories.length > 0 && (
                  <div className={styles.dropdownMenu}>
                    <div className={styles.dropdownInner}>
                      <div className={styles.dropdownHeader}>{cat.name}</div>
                      <div className={styles.dropdownGrid}>
                        {cat.subcategories.map((sub, sIdx) => (
                          <button
                            key={sIdx}
                            className={styles.dropdownItem}
                            onClick={() => handleCategoryClick(cat.name, sub)}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                      <button
                        className={styles.dropdownViewAll}
                        onClick={() => handleCategoryClick(cat.name)}
                      >
                        View all in {cat.name} →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
      )}

      <div className={styles.hero}>
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
      </div>
    </section>
  );
};

export default HeroSection;
