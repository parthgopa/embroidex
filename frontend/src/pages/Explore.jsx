import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MdSearch, 
  MdFilterList, 
  MdClose, 
  MdTune, 
  MdChevronRight, 
  MdOutlineSwapVert,
  MdLayers,
  MdCheck
} from "react-icons/md";
import API from "../services/api";
import styles from "./Explore.module.css";

const Explore = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [filteredDesigns, setFilteredDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryTree, setCategoryTree] = useState({});
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [sortBy, setSortBy] = useState("latest");

  // Mobile Drawer State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  useEffect(() => {
    fetchApprovedDesigns();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterDesigns();
  }, [searchQuery, selectedCategories, selectedSubcategories, selectedPriceRanges, sortBy, designs]);

  const fetchApprovedDesigns = async () => {
    try {
      const res = await API.get("/seller/approved");
      const reversedDesigns = [...res.data.designs].reverse();
      setDesigns(reversedDesigns);
      setFilteredDesigns(reversedDesigns);
    } catch (err) {
      console.error("Failed to fetch designs", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get("/seller/categories");
      if (res.data.categories) {
        setCategoryTree(res.data.categories);
      }
    } catch (err) {
      console.error("Failed to fetch categories tree", err);
    }
  };

  const filterDesigns = () => {
    let filtered = [...designs];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (design) =>
          design.title?.toLowerCase().includes(q) ||
          design.description?.toLowerCase().includes(q) ||
          design.category?.toLowerCase().includes(q) ||
          design.subcategory?.toLowerCase().includes(q)
      );
    }

    // Category filter (multi-select)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((design) => selectedCategories.includes(design.category));
    }

    // Subcategory filter (multi-select)
    if (selectedSubcategories.length > 0) {
      filtered = filtered.filter((design) => selectedSubcategories.includes(design.subcategory));
    }

    // Price ranges filter (multi-select)
    if (selectedPriceRanges.length > 0) {
      filtered = filtered.filter((design) => {
        const price = design.price;
        return selectedPriceRanges.some((range) => {
          if (range === "0-200") return price <= 200;
          if (range === "200-500") return price > 200 && price <= 500;
          if (range === "500-1000") return price > 500 && price <= 1000;
          if (range === "1000+") return price > 1000;
          return true;
        });
      });
    }

    // Sorting
    if (sortBy === "price_asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "title_asc") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredDesigns(filtered);
  };

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const toggleSubcategory = (subcat) => {
    if (selectedSubcategories.includes(subcat)) {
      setSelectedSubcategories(selectedSubcategories.filter((s) => s !== subcat));
    } else {
      setSelectedSubcategories([...selectedSubcategories, subcat]);
    }
  };

  const togglePriceRange = (range) => {
    if (selectedPriceRanges.includes(range)) {
      setSelectedPriceRanges(selectedPriceRanges.filter((r) => r !== range));
    } else {
      setSelectedPriceRanges([...selectedPriceRanges, range]);
    }
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedPriceRanges([]);
    setSortBy("latest");
  };

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    selectedCategories.length +
    selectedSubcategories.length +
    selectedPriceRanges.length +
    (sortBy !== "latest" ? 1 : 0);

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
      {/* Sticky Mobile/Tablet Compact Header Bar */}
      <div className={styles.stickyHeader}>
        <div className={styles.topSearchWrapper}>
          <div className={styles.compactSearchBar}>
            <MdSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search embroidery designs..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className={styles.clearBtn} onClick={() => setSearchQuery("")}>
                <MdClose />
              </button>
            )}
          </div>

          <button
            className={`${styles.mobileFilterToggle} ${activeFilterCount > 0 ? styles.activeFilterBtn : ""}`}
            onClick={() => setIsFilterDrawerOpen(true)}
          >
            <MdTune className={styles.tuneIcon} />
            <span>Filters</span>
            {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
          </button>
        </div>

        {/* Quick Filter Pills / Result Bar */}
        <div className={styles.filterPillsRow}>
          <span className={styles.resultsBadge}>
            <strong>{filteredDesigns.length}</strong> designs
          </span>

          {selectedCategories.map((cat) => (
            <span key={cat} className={styles.activePill} onClick={() => toggleCategory(cat)}>
              {cat} <MdClose />
            </span>
          ))}

          {selectedSubcategories.map((subcat) => (
            <span key={subcat} className={styles.activePill} onClick={() => toggleSubcategory(subcat)}>
              {subcat} <MdClose />
            </span>
          ))}

          {selectedPriceRanges.map((range) => (
            <span key={range} className={styles.activePill} onClick={() => togglePriceRange(range)}>
              ₹{range} <MdClose />
            </span>
          ))}

          {activeFilterCount > 0 && (
            <button className={styles.clearAllTextBtn} onClick={resetAllFilters}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className={styles.mainLayout}>
        {/* Desktop Sidebar Filters */}
        <aside className={styles.desktopSidebar}>
          <div className={styles.sidebarHeader}>
            <h3><MdFilterList /> Filters</h3>
            {activeFilterCount > 0 && (
              <button className={styles.clearAllBtn} onClick={resetAllFilters}>
                Clear All
              </button>
            )}
          </div>

          {/* Sort Selection */}
          <div className={styles.sidebarGroup}>
            <label className={styles.groupTitle}>Sort By</label>
            <select
              className={styles.sidebarSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="latest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="title_asc">Title: A to Z</option>
            </select>
          </div>

          {/* Categories & Subcategories Tree */}
          <div className={styles.sidebarGroup}>
            <label className={styles.groupTitle}>Categories</label>
            <div className={styles.treeList}>
              {Object.keys(categoryTree).length > 0 ? (
                Object.entries(categoryTree).map(([catName, subcats]) => (
                  <div key={catName} className={styles.categoryBlock}>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(catName)}
                        onChange={() => toggleCategory(catName)}
                      />
                      <span className={styles.catName}>{catName}</span>
                    </label>
                    {subcats && subcats.length > 0 && (
                      <div className={styles.subcatList}>
                        {subcats.map((subcat) => (
                          <label key={subcat} className={styles.subCheckboxRow}>
                            <input
                              type="checkbox"
                              checked={selectedSubcategories.includes(subcat)}
                              onChange={() => toggleSubcategory(subcat)}
                            />
                            <span>{subcat}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                getUniqueCategories().map((cat) => (
                  <label key={cat} className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    <span>{cat}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Price Ranges */}
          <div className={styles.sidebarGroup}>
            <label className={styles.groupTitle}>Price Range</label>
            {[
              { id: "0-200", label: "₹0 - ₹200" },
              { id: "200-500", label: "₹200 - ₹500" },
              { id: "500-1000", label: "₹500 - ₹1,000" },
              { id: "1000+", label: "₹1,000+" },
            ].map((range) => (
              <label key={range.id} className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={selectedPriceRanges.includes(range.id)}
                  onChange={() => togglePriceRange(range.id)}
                />
                <span>{range.label}</span>
              </label>
            ))}
          </div>
        </aside>

        {/* Designs Display Section */}
        <main className={styles.designsContent}>
          {filteredDesigns.length === 0 ? (
            <div className={styles.emptyState}>
              <MdSearch className={styles.emptyIcon} />
              <h3>No designs match your filters</h3>
              <p>Try clearing your search or expanding price range</p>
              <button className="btn-outline-custom" onClick={resetAllFilters}>
                Reset Filters
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
                      src={design.thumbnail || "https://via.placeholder.com/300x200"}
                      alt={design.title}
                    />
                    <div className={styles.cardOverlay}>
                      <button className="btn-primary-custom">View Details</button>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardMainInfo}>
                      <h3 className={styles.cardTitle}>{design.title}</h3>
                      <div className={styles.cardBadges}>
                        <span className={styles.categoryBadge}>{design.category}</span>
                        {design.subcategory && (
                          <span className={styles.subcategoryBadge}>• {design.subcategory}</span>
                        )}
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.cardPrice}>₹{design.price}</span>
                      <span className={styles.mobileDetailsBtn}>
                        Details <MdChevronRight />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Amazon-Style Slide-Over Drawer for Mobile & Tablet */}
      {isFilterDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsFilterDrawerOpen(false)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3>Filters & Categories</h3>
              <div className={styles.drawerHeaderRight}>
                {activeFilterCount > 0 && (
                  <button className={styles.drawerClearBtn} onClick={resetAllFilters}>
                    Clear All
                  </button>
                )}
                <button className={styles.closeDrawerBtn} onClick={() => setIsFilterDrawerOpen(false)}>
                  <MdClose size={24} />
                </button>
              </div>
            </div>

            <div className={styles.drawerBody}>
              {/* Sort By Section */}
              <div className={styles.drawerSection}>
                <h4>Sort By</h4>
                <div className={styles.sortPillsGrid}>
                  {[
                    { id: "latest", label: "Newest First" },
                    { id: "price_asc", label: "Price: Low to High" },
                    { id: "price_desc", label: "Price: High to Low" },
                    { id: "title_asc", label: "Title: A to Z" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      className={`${styles.sortPill} ${sortBy === item.id ? styles.activeSortPill : ""}`}
                      onClick={() => setSortBy(item.id)}
                    >
                      {item.label} {sortBy === item.id && <MdCheck />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Tree Section */}
              <div className={styles.drawerSection}>
                <h4>Categories & Subcategories</h4>
                {Object.keys(categoryTree).length > 0 ? (
                  Object.entries(categoryTree).map(([catName, subcats]) => (
                    <div key={catName} className={styles.drawerCategoryGroup}>
                      <label className={styles.drawerCheckboxRow}>
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(catName)}
                          onChange={() => toggleCategory(catName)}
                        />
                        <span className={styles.drawerCatTitle}>{catName}</span>
                      </label>
                      {subcats && subcats.length > 0 && (
                        <div className={styles.drawerSubcatGrid}>
                          {subcats.map((subcat) => (
                            <label key={subcat} className={styles.drawerSubCheckboxRow}>
                              <input
                                type="checkbox"
                                checked={selectedSubcategories.includes(subcat)}
                                onChange={() => toggleSubcategory(subcat)}
                              />
                              <span>{subcat}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  getUniqueCategories().map((cat) => (
                    <label key={cat} className={styles.drawerCheckboxRow}>
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                      />
                      <span>{cat}</span>
                    </label>
                  ))
                )}
              </div>

              {/* Price Range Section */}
              <div className={styles.drawerSection}>
                <h4>Price Range</h4>
                {[
                  { id: "0-200", label: "Under ₹200" },
                  { id: "200-500", label: "₹200 - ₹500" },
                  { id: "500-1000", label: "₹500 - ₹1,000" },
                  { id: "1000+", label: "Above ₹1,000" },
                ].map((range) => (
                  <label key={range.id} className={styles.drawerCheckboxRow}>
                    <input
                      type="checkbox"
                      checked={selectedPriceRanges.includes(range.id)}
                      onChange={() => togglePriceRange(range.id)}
                    />
                    <span>{range.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <button
                className="btn-primary-custom"
                style={{ width: "100%", padding: "14px", borderRadius: "10px", fontSize: "15px" }}
                onClick={() => setIsFilterDrawerOpen(false)}
              >
                Apply & Show {filteredDesigns.length} Design{filteredDesigns.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;
