import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MdSearch,
  MdFilterList,
  MdClose,
  MdTune,
  MdChevronRight,
  MdOutlineSwapVert,
  MdLayers,
  MdCheck,
  MdFormatListNumbered
} from "react-icons/md";
import API from "../services/api";
import styles from "./Explore.module.css";

const NEEDLE_OPTIONS = ["1", "2", "3", "4", "5", "5+"];
const FILE_FORMAT_OPTIONS = ["DST", "PES", "EMB", "JEF", "EXP", "VP3", "ART", "XXX", "HUS", "VIP", "SEW"];
const DESIGN_MACHINE_TYPE_OPTIONS = [
  "Flat/Multi Designs",
  "Only Cording Designs",
  "Only Sequin Designs",
  "Only Chain Stitch Designs",
  "Multi+Cording Designs",
  "Multi+Cording+Sequin Designs",
  "Multi+Sequin Designs",
  "Multi+Chain Stitch Designs",
  "Dual & Sandwich Sequin",
  "Cording + Sequin Designs",
  "Beads and Sequin Designs",
  "2/4/6 Sequin Design"
];
const DESIGN_AREA_OPTIONS = [
  "100 mm",
  "125 mm",
  "150 mm",
  "175 mm",
  "200 mm",
  "225 mm",
  "250 mm",
  "300 mm",
  "330 mm",
  "400 mm",
  "500 mm",
  "600 mm"
];
const PRICE_RANGE_OPTIONS = [
  { id: "all", label: "All" },
  { id: "0-200", label: "₹0 - ₹200" },
  { id: "200-500", label: "₹200 - ₹500" },
  { id: "500-1000", label: "₹500 - ₹1,000" },
  { id: "1000+", label: "₹1,000+" },
];

const Explore = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [designs, setDesigns] = useState([]);
  const [filteredDesigns, setFilteredDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryTree, setCategoryTree] = useState({});
  // Pre-populate from URL ?category= param
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const cat = searchParams.get("category");
    return cat ? [cat] : [];
  });
  const [selectedMachineTypes, setSelectedMachineTypes] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedNeedles, setSelectedNeedles] = useState([]);
  const [selectedFileFormats, setSelectedFileFormats] = useState([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState(["all"]);
  const [sortBy, setSortBy] = useState("latest");

  // Mobile Drawer State
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  useEffect(() => {
    fetchApprovedDesigns();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterDesigns();
  }, [
    searchQuery,
    selectedCategories,
    selectedMachineTypes,
    selectedAreas,
    selectedNeedles,
    selectedFileFormats,
    selectedPriceRanges,
    sortBy,
    designs
  ]);

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
          design.subcategory?.toLowerCase().includes(q) ||
          (design.machine_type || design.design_type || "").toLowerCase().includes(q) ||
          (design.area || "").toLowerCase().includes(q)
      );
    }

    // Main Category filter (multi-select)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((design) => selectedCategories.includes(design.category));
    }

    // Machine Types filter (multi-select)
    if (selectedMachineTypes.length > 0) {
      filtered = filtered.filter((design) => {
        const mType = design.machine_type || design.design_type || "";
        return selectedMachineTypes.includes(mType);
      });
    }

    // Area filter (multi-select)
    if (selectedAreas.length > 0) {
      filtered = filtered.filter((design) => {
        return selectedAreas.includes(design.area);
      });
    }

    // Needles filter (multi-select)
    if (selectedNeedles.length > 0) {
      filtered = filtered.filter((design) => {
        const needles = design.needles || 1;
        return selectedNeedles.some((val) => {
          if (val === "5+") return needles >= 5;
          return needles === parseInt(val);
        });
      });
    }

    // File Format filter (multi-select)
    if (selectedFileFormats.length > 0) {
      filtered = filtered.filter((design) => {
        const fmt = (design.file_format || design.design_file_type || "EMB").toUpperCase();
        return selectedFileFormats.includes(fmt);
      });
    }

    // Price ranges filter (multi-select)
    if (selectedPriceRanges.length > 0 && !selectedPriceRanges.includes("all")) {
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

  const toggleMachineType = (type) => {
    if (selectedMachineTypes.includes(type)) {
      setSelectedMachineTypes(selectedMachineTypes.filter((t) => t !== type));
    } else {
      setSelectedMachineTypes([...selectedMachineTypes, type]);
    }
  };

  const toggleArea = (areaVal) => {
    if (selectedAreas.includes(areaVal)) {
      setSelectedAreas(selectedAreas.filter((a) => a !== areaVal));
    } else {
      setSelectedAreas([...selectedAreas, areaVal]);
    }
  };

  const toggleNeedle = (needle) => {
    if (selectedNeedles.includes(needle)) {
      setSelectedNeedles(selectedNeedles.filter((n) => n !== needle));
    } else {
      setSelectedNeedles([...selectedNeedles, needle]);
    }
  };

  const toggleFileFormat = (fmt) => {
    if (selectedFileFormats.includes(fmt)) {
      setSelectedFileFormats(selectedFileFormats.filter((f) => f !== fmt));
    } else {
      setSelectedFileFormats([...selectedFileFormats, fmt]);
    }
  };

  const togglePriceRange = (rangeId) => {
    if (rangeId === "all") {
      setSelectedPriceRanges(["all"]);
      return;
    }

    let updated = selectedPriceRanges.filter((r) => r !== "all");

    if (updated.includes(rangeId)) {
      updated = updated.filter((r) => r !== rangeId);
    } else {
      updated = [...updated, rangeId];
    }

    if (updated.length === 0) {
      updated = ["all"];
    }

    setSelectedPriceRanges(updated);
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSelectedMachineTypes([]);
    setSelectedAreas([]);
    setSelectedNeedles([]);
    setSelectedFileFormats([]);
    setSelectedPriceRanges(["all"]);
    setSortBy("latest");
  };

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    selectedCategories.length +
    selectedMachineTypes.length +
    selectedAreas.length +
    selectedNeedles.length +
    selectedFileFormats.length +
    (selectedPriceRanges.includes("all") ? 0 : selectedPriceRanges.length);

  const getMainCategories = () => {
    if (Object.keys(categoryTree).length > 0) {
      return Object.keys(categoryTree);
    }
    return Array.from(new Set(designs.map((d) => d.category).filter(Boolean)));
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading curated embroidery designs...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Top Banner / Search Header */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h1 className={styles.pageTitle}>Explore Embroidery Designs</h1>
          <p className={styles.pageSubtitle}>
            Discover verified high-quality embroidery patterns ready for instant download
          </p>

          {/* Search Input Bar */}
          <div className={styles.searchBarWrapper}>
            <MdSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by design name, category, machine type, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button className={styles.clearSearchBtn} onClick={() => setSearchQuery("")}>
                <MdClose />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className={styles.mainLayout}>
        {/* Mobile Filter Toggle Header */}
        <div className={styles.mobileFilterHeader}>
          <button
            className={`${styles.mobileFilterToggle} ${activeFilterCount > 0 ? styles.activeFilterBtn : ""}`}
            onClick={() => setIsFilterDrawerOpen(true)}
          >
            <MdFilterList className={styles.tuneIcon} />
            <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
          </button>

          <div className={styles.resultsCountMobile}>
            Showing <strong>{filteredDesigns.length}</strong> designs
          </div>
        </div>
        {/* Desktop Left Sidebar Filters */}
        <aside className={styles.desktopSidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitleRow}>
              <MdTune className={styles.filterHeaderIcon} />
              <h3>Filters</h3>
              {activeFilterCount > 0 && (
                <span className={styles.activeBadge}>{activeFilterCount}</span>
              )}
            </div>
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

          {/* Main Categories Filter */}
          <div className={styles.sidebarGroup}>
            <label className={styles.groupTitle}>Categories</label>
            <div className={styles.treeList}>
              {getMainCategories().map((cat) => (
                <label key={cat} className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  <span className={styles.catName}>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Design Types (Machine Types) Filter */}
          <div className={styles.sidebarGroup}>
            <label className={styles.groupTitle}>Design / Machine Type</label>
            <div className={styles.treeList}>
              {DESIGN_MACHINE_TYPE_OPTIONS.map((type) => (
                <label key={type} className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={selectedMachineTypes.includes(type)}
                    onChange={() => toggleMachineType(type)}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Design Area Filter */}
          <div className={styles.sidebarGroup}>
            <label className={styles.groupTitle}>Area Size</label>
            <div className={styles.treeList}>
              {DESIGN_AREA_OPTIONS.map((areaVal) => (
                <label key={areaVal} className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={selectedAreas.includes(areaVal)}
                    onChange={() => toggleArea(areaVal)}
                  />
                  <span>{areaVal}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Number of Needles Filter */}
          <div className={styles.sidebarGroup}>
            <label className={styles.groupTitle}>Number of Needles</label>
            <div className={styles.treeList}>
              {NEEDLE_OPTIONS.map((needle) => (
                <label key={needle} className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={selectedNeedles.includes(needle)}
                    onChange={() => toggleNeedle(needle)}
                  />
                  <span>{needle} {needle === "1" ? "Needle" : "Needles"}</span>
                </label>
              ))}
            </div>
          </div>

          {/* File Format Filter */}
          <div className={styles.sidebarGroup}>
            <label className={styles.groupTitle}>File Format</label>
            <div className={styles.treeList}>
              {FILE_FORMAT_OPTIONS.map((fmt) => (
                <label key={fmt} className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={selectedFileFormats.includes(fmt)}
                    onChange={() => toggleFileFormat(fmt)}
                  />
                  <span className={styles.formatTag}>.{fmt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Ranges */}
          <div className={styles.sidebarGroup}>
            <label className={styles.groupTitle}>Price Range</label>
            {PRICE_RANGE_OPTIONS.map((range) => (
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
              <p>Try clearing your search or expanding category/machine type selection</p>
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
                  onClick={() => window.open(`/design/${design._id}`, "_blank")}
                >
                  <div className={styles.cardImage}>
                    <img
                      src={design.thumbnail || "https://via.placeholder.com/300x200"}
                      alt={design.title}
                      loading="lazy"
                    />
                  </div>

                  <div className={styles.cardBody}>
                    <div className={styles.cardMainInfo}>
                      <h3 className={styles.cardTitle}>{design.title}</h3>
                      <div className={styles.cardBadges}>
                        <span className={styles.categoryBadge}>{design.category}</span>
                        {(design.machine_type || design.design_type) && (
                          <span className={styles.categoryBadge}>{design.machine_type || design.design_type}</span>
                        )}
                        {design.area && (
                          <span className={styles.categoryBadge}>{design.area}</span>
                        )}
                        <span className={styles.needleBadgeText}>
                          {design.needles || 1} Needle{design.needles !== 1 ? "s" : ""}
                        </span>
                        <span className={styles.formatTag}>
                          .{(design.file_format || design.design_file_type || "EMB").toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.cardPrice}>₹{design.price?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Slide-over Drawer */}
      {isFilterDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsFilterDrawerOpen(false)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3>Filter Designs</h3>
              <button className={styles.closeDrawerBtn} onClick={() => setIsFilterDrawerOpen(false)}>
                <MdClose size={24} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Sort By Section */}
              <div className={styles.drawerSection}>
                <h4>Sort By</h4>
                <div className={styles.sortPillGroup}>
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

              {/* Main Categories Section */}
              <div className={styles.drawerSection}>
                <h4>Main Categories</h4>
                {getMainCategories().map((cat) => (
                  <label key={cat} className={styles.drawerCheckboxRow}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>

              {/* Design Types (Machine Types) Section */}
              <div className={styles.drawerSection}>
                <h4>Design / Machine Type</h4>
                {DESIGN_MACHINE_TYPE_OPTIONS.map((type) => (
                  <label key={type} className={styles.drawerCheckboxRow}>
                    <input
                      type="checkbox"
                      checked={selectedMachineTypes.includes(type)}
                      onChange={() => toggleMachineType(type)}
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>

              {/* Design Area Section */}
              <div className={styles.drawerSection}>
                <h4>Area Size</h4>
                {DESIGN_AREA_OPTIONS.map((areaVal) => (
                  <label key={areaVal} className={styles.drawerCheckboxRow}>
                    <input
                      type="checkbox"
                      checked={selectedAreas.includes(areaVal)}
                      onChange={() => toggleArea(areaVal)}
                    />
                    <span>{areaVal}</span>
                  </label>
                ))}
              </div>

              {/* Needles Section */}
              <div className={styles.drawerSection}>
                <h4>Number of Needles</h4>
                {NEEDLE_OPTIONS.map((needle) => (
                  <label key={needle} className={styles.drawerCheckboxRow}>
                    <input
                      type="checkbox"
                      checked={selectedNeedles.includes(needle)}
                      onChange={() => toggleNeedle(needle)}
                    />
                    <span>{needle} {needle === "1" ? "Needle" : "Needles"}</span>
                  </label>
                ))}
              </div>

              {/* File Format Section */}
              <div className={styles.drawerSection}>
                <h4>File Format</h4>
                {FILE_FORMAT_OPTIONS.map((fmt) => (
                  <label key={fmt} className={styles.drawerCheckboxRow}>
                    <input
                      type="checkbox"
                      checked={selectedFileFormats.includes(fmt)}
                      onChange={() => toggleFileFormat(fmt)}
                    />
                    <span>.{fmt}</span>
                  </label>
                ))}
              </div>

              {/* Price Range Section */}
              <div className={styles.drawerSection}>
                <h4>Price Range</h4>
                {PRICE_RANGE_OPTIONS.map((range) => (
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
