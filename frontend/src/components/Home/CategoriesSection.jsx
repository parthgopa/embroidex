import { Link } from "react-router-dom";
import { MdCategory, MdArrowForward } from "react-icons/md";
import styles from "./CategoriesSection.module.css";

const CategoriesSection = () => {
  const categories = [
    { name: "Floral & Nature", count: "2,500+ designs", color: "#10b981", emoji: "🌸" },
    { name: "Animals & Wildlife", count: "1,800+ designs", color: "#f59e0b", emoji: "🦋" },
    { name: "Geometric Patterns", count: "1,200+ designs", color: "#3b82f6", emoji: "◆" },
    { name: "Vintage & Classic", count: "950+ designs", color: "#8b5cf6", emoji: "👑" },
    { name: "Modern & Abstract", count: "1,400+ designs", color: "#ec4899", emoji: "✨" },
    { name: "Seasonal & Holiday", count: "800+ designs", color: "#ef4444", emoji: "🎄" },
    { name: "Monograms & Letters", count: "600+ designs", color: "#06b6d4", emoji: "A" },
    { name: "Cultural & Traditional", count: "700+ designs", color: "#f97316", emoji: "🎨" }
  ];

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
          {categories.map((category, index) => (
            <Link to="/explore" key={index} className={styles.categoryCard}>
              <div className={styles.categoryIcon} style={{ backgroundColor: category.color }}>
                <span className={styles.categoryEmoji}>{category.emoji}</span>
              </div>
              <div className={styles.categoryContent}>
                <h4 className={styles.categoryName}>{category.name}</h4>
                <p className={styles.categoryCount}>{category.count}</p>
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
            <p className={styles.ctaText}>Browse our complete collection or use advanced filters to discover the perfect design</p>
          </div>
          <Link to="/explore" className="btn-primary-custom">
            View All Categories
            <MdArrowForward style={{ marginLeft: '8px' }} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
