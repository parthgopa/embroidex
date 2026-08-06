import { Link } from "react-router-dom";
import styles from "./ShowcaseSections.module.css";
import API from "../../services/api";

const BASE_URL = API.defaults.baseURL.replace("/api", "");

const ShowcaseSections = ({ showcases }) => {
  if (!showcases || showcases.length === 0) return null;

  return (
    <div className={styles.showcaseContainer}>
      {showcases.map((showcase, index) => (
        <section
          key={index}
          className={`${styles.showcaseSection} ${index % 2 === 1 ? styles.reversed : ""}`}
        >
          <div className={styles.sectionHeader}>
            <h2 className={styles.title}>{showcase.title}</h2>
            {showcase.description && (
              <p className={styles.description}>{showcase.description}</p>
            )}
          </div>

          {/* 4 Static Design Image Cards */}
          {showcase.images && showcase.images.length > 0 && (
            <div className={styles.grid}>
              {showcase.images.map((imgData, imgIndex) => {
                const exploreUrl = showcase.category
                  ? `/explore?category=${encodeURIComponent(showcase.category)}`
                  : "/explore";

                return (
                  <Link key={imgIndex} to={exploreUrl} className={styles.card}>
                    <div className={styles.imageWrapper}>
                      <img
                        src={
                          imgData.url
                            ? `${BASE_URL}/${imgData.url}`
                            : "/placeholder-image.png"
                        }
                        alt={imgData.name || `Design ${imgIndex + 1}`}
                        className={styles.image}
                        onError={(e) => {
                          e.target.src = "/placeholder-image.png";
                        }}
                      />
                    </div>
                    {imgData.name && (
                      <div className={styles.cardLabel}>{imgData.name}</div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {showcase.category && (
            <div className={styles.viewMoreContainer}>
              <Link
                to={`/explore?category=${encodeURIComponent(showcase.category)}`}
                className={styles.viewMoreBtn}
              >
                View All {showcase.title || showcase.category}
              </Link>
            </div>
          )}
        </section>
      ))}
    </div>
  );
};

export default ShowcaseSections;
