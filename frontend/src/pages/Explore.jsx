import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdSearch, MdFilterList, MdClose } from "react-icons/md";
import API from "../services/api";
import styles from "./Explore.module.css";

const Explore = () => {
  const BASE_URL = API.defaults.baseURL;
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [filteredDesigns, setFilteredDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");

  useEffect(() => {
    fetchApprovedDesigns();
  }, []);

  useEffect(() => {
    filterDesigns();
  }, [searchQuery, selectedCategory, priceRange, designs]);

  const fetchApprovedDesigns = async () => {
    try {
      const res = await API.get("/seller/approved");
      // Reverse to show earliest first
      const reversedDesigns = [...res.data.designs].reverse();
      setDesigns(reversedDesigns);
      setFilteredDesigns(reversedDesigns);
    } catch (err) {
      console.error("Failed to fetch designs", err);
    } finally {
      setLoading(false);
    }
  };

  const filterDesigns = () => {
    let filtered = [...designs];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (design) =>
          design.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          design.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          design.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((design) => design.category === selectedCategory);
    }

    // Price filter
    if (priceRange !== "all") {
      filtered = filtered.filter((design) => {
        const price = design.price;
        switch (priceRange) {
          case "0-200":
            return price <= 200;
          case "200-500":
            return price > 200 && price <= 500;
          case "500+":
            return price > 500;
          default:
            return true;
        }
      });
    }

    setFilteredDesigns(filtered);
  };

  const getUniqueCategories = () => {
    const categories = designs.map((d) => d.category).filter(Boolean);
    return [...new Set(categories)];
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading designs...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Search Header */}
      <div className={styles.searchHeader}>
        <div className="container">
          <h1 className={styles.title}>Buy Design</h1>
          <p className={styles.subtitle}>
            Discover premium embroidery designs from talented creators
          </p>

          <div className={styles.searchBar}>
            <MdSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by title, description, or category..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className={styles.clearBtn}
                onClick={() => setSearchQuery("")}
              >
                <MdClose />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className="container">
          <div className={styles.filters}>
            <div className={styles.filterGroup}>
              <MdFilterList className={styles.filterIcon} />
              <span className={styles.filterLabel}>Filters:</span>
            </div>

            <div className={styles.filterGroup}>
              <label>Category:</label>
              <select
                className={styles.filterSelect}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {getUniqueCategories().map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Price Range:</label>
              <select
                className={styles.filterSelect}
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              >
                <option value="all">All Prices</option>
                <option value="0-200">₹0 - ₹200</option>
                <option value="200-500">₹200 - ₹500</option>
                <option value="500+">₹500+</option>
              </select>
            </div>

            <div className={styles.resultsCount}>
              {filteredDesigns.length} design{filteredDesigns.length !== 1 ? "s" : ""} found
            </div>
          </div>
        </div>
      </div>

      {/* Designs Grid */}
      <div className={styles.designsSection}>
        <div className="container">
          {filteredDesigns.length === 0 ? (
            <div className={styles.emptyState}>
              <MdSearch className={styles.emptyIcon} />
              <h3>No designs found</h3>
              <p>Try adjusting your search or filters</p>
              <button
                className="btn-outline-custom"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setPriceRange("all");
                }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className={styles.designsGrid}>
              {filteredDesigns.map((design) => (
                <div
                  key={design._id}
                  className={styles.designCard}
                  onClick={() => navigate(`/design/${design._id}`)}
                >
                  <div className={styles.cardImage}>
                    <img
                      src={`${BASE_URL}/${design.thumbnail_path}`}
                      alt={design.title}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/300x200";
                      }}
                    />
                    <div className={styles.cardOverlay}>
                      <button className="btn-primary-custom">View Details</button>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{design.title}</h3>
                    <p className={styles.cardCategory}>{design.category}</p>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardPrice}>₹{design.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explore;
