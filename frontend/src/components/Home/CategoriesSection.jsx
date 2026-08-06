import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MdArrowForward } from "react-icons/md";
import API from "../../services/api";
import styles from "./CategoriesSection.module.css";

const ACCENT_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#3b82f6",
  "#8b5cf6", "#ec4899", "#ef4444", "#06b6d4", "#f97316"
];

const CategoriesSection = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    API.get("/seller/categories")
      .then((res) => {
        if (res.data.categories) {
          const cats = Object.keys(res.data.categories);
          setCategories(cats);
        }
      })
      .catch(() => {});
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className={styles.categoriesSection}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>Browse Collections</span>
          <h2 className={styles.sectionTitle}>Explore by Category</h2>
          <p className={styles.sectionSubtitle}>
            Find the perfect design for your project from our extensive collection
          </p>
        </div>

        <div className={styles.categoriesGrid}>
          {categories.map((name, index) => (
            <Link
              to={`/explore?category=${encodeURIComponent(name)}`}
              key={index}
              className={styles.categoryCard}
            >
              <div
                className={styles.categoryIcon}
                style={{ backgroundColor: ACCENT_COLORS[index % ACCENT_COLORS.length] }}
              >
                <span className={styles.categoryEmoji}>
                  {name.charAt(0)}
                </span>
              </div>
              <div className={styles.categoryContent}>
                <h4 className={styles.categoryName}>{name}</h4>
              </div>
              <div className={styles.categoryArrow}>
                <MdArrowForward />
              </div>
            </Link>
          ))}
        </div>

        <div className={styles.ctaBox}>
          <div className={styles.ctaContent}>
            <h3 className={styles.ctaTitle}>Can't find what you're looking for?</h3>
            <p className={styles.ctaText}>
              Browse our complete collection or use advanced filters to discover the perfect design
            </p>
          </div>
          <Link to="/explore" className="btn-primary-custom">
            View All Categories
            <MdArrowForward style={{ marginLeft: "8px" }} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
