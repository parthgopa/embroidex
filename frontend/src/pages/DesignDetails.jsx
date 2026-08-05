import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  MdArrowBack, 
  MdShoppingCart, 
  MdImage, 
  MdDescription, 
  MdCategory, 
  MdGridOn, 
  MdCheckCircle, 
  MdSecurity, 
  MdFileDownload, 
  MdVerified, 
  MdChevronRight,
  MdChevronLeft,
  MdLayers,
  MdFormatListBulleted,
  MdShield,
  MdFormatListNumbered,
  MdAddShoppingCart,
  MdLock
} from "react-icons/md";
import API from "../services/api";
import { addToCart, getCartItems } from "../utils/cartUtils";
import styles from "./DesignDetails.module.css";

const DesignDetails = () => {
  const { designId } = useParams();
  const navigate = useNavigate();
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [userId, setUserId] = useState(null);
  const [screenProtected, setScreenProtected] = useState(false);

  useEffect(() => {
    fetchDesignDetails();
    const activeUserId = localStorage.getItem("user_id");
    setUserId(activeUserId);
  }, [designId]);

  useEffect(() => {
    if (design) {
      const cartItems = getCartItems(userId);
      const inCart = cartItems.some((item) => item._id === design._id);
      setAddedToCart(inCart);
    }
  }, [design, userId]);

  // Anti-Screenshot & Screen Capture Detection
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Intercept PrintScreen (KeyCode 44 or 'PrintScreen')
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        setScreenProtected(true);
        setTimeout(() => setScreenProtected(false), 2000);
      }
      // Intercept Mac Screenshot (Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5" || e.key === "S" || e.key === "s")) {
        e.preventDefault();
        setScreenProtected(true);
        setTimeout(() => setScreenProtected(false), 2500);
      }
      // Intercept Ctrl+P (Print) and Ctrl+S (Save)
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P" || e.key === "s" || e.key === "S")) {
        e.preventDefault();
        alert("Printing and Saving are disabled to protect design copyright.");
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        setScreenProtected(true);
        setTimeout(() => setScreenProtected(false), 2000);
      }
    };

    const handleBlur = () => {
      // Protect preview image when window loses focus (e.g. Snipping tool opened)
      setScreenProtected(true);
    };

    const handleFocus = () => {
      setScreenProtected(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const fetchDesignDetails = async () => {
    try {
      const res = await API.get(`/seller/design/${designId}`);
      setDesign(res.data.design);
    } catch (err) {
      console.error("Failed to fetch design details", err);
      alert("Failed to load design details");
      navigate("/explore");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!design) return;
    const success = addToCart(design, userId);
    if (success) {
      setAddedToCart(true);
    } else {
      alert("Design is already in your cart!");
    }
  };

  const handleBuyNow = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to purchase designs");
      navigate("/login");
      return;
    }
    addToCart(design, userId);
    navigate(`/purchase/${designId}`);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!design) {
    return (
      <div className={styles.error}>
        <h2>Design not found</h2>
        <button className="btn-primary-custom" onClick={() => navigate("/explore")}>
          Back to Explore
        </button>
      </div>
    );
  }

  const allImages = [
    design.thumbnail,
    ...(design.additional_images || [])
  ].filter(Boolean);

  const formatName = (design.file_format || design.design_file_type || "EMB").toUpperCase();
  const needlesCount = design.needles || 1;

  return (
    <div 
      className={styles.container}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
    >
      <div className={styles.wrapper}>
        {/* Breadcrumb Navigation */}
        <nav className={styles.breadcrumbNav}>
          <Link to="/explore">Explore</Link>
          <MdChevronRight />
          <span>{design.category}</span>
          {design.subcategory && (
            <>
              <MdChevronRight />
              <span>{design.subcategory}</span>
            </>
          )}
          <MdChevronRight />
          <span className={styles.breadcrumbCurrent}>{design.title}</span>
        </nav>

        {/* Product Layout: Protected Gallery (Left) | Specs Table (Middle) | Buy Card (Right) */}
        <div className={styles.productGrid}>
          
          {/* Left Column: Anti-Screenshot Watermarked Compact Image Gallery */}
          <div className={styles.imageGalleryCol}>
            <div 
              className={`${styles.mainImageCard} ${screenProtected ? styles.blurProtected : ""}`}
              onContextMenu={(e) => e.preventDefault()}
            >
              <img
                src={allImages[currentImageIndex] || "https://via.placeholder.com/600x400"}
                alt={design.title}
                className={styles.mainImage}
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />

              {/* Blur Protection Screen when Window Unfocused or Screenshot Triggered */}
              {screenProtected && (
                <div className={styles.screenshotShield}>
                  <MdLock size={32} />
                  <span>Preview Shielded</span>
                </div>
              )}
            </div>

            {allImages.length > 1 && (
              <div className={styles.thumbnailStrip}>
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    className={`${styles.thumbBtn} ${currentImageIndex === index ? styles.activeThumb : ""}`}
                    onClick={() => setCurrentImageIndex(index)}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <img 
                      src={img} 
                      alt={`Preview ${index + 1}`} 
                      onContextMenu={(e) => e.preventDefault()} 
                      draggable={false} 
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Middle Column: Details & Input Specifications Table */}
          <div className={styles.middleDetailsCol}>
            <div className={styles.headerInfo}>
              <div className={styles.tagRow}>
                <span className={styles.categoryTag}>{design.category}</span>
                {design.subcategory && <span className={styles.subcatTag}>{design.subcategory}</span>}
                <span className={styles.verifiedBadge}><MdVerified /> Verified Design</span>
              </div>
              <h1 className={styles.productTitle}>{design.title}</h1>
            </div>

            {/* Input Specifications 2-Column Table */}
            <div className={styles.specsTableBox}>
              <h3 className={styles.sectionHeaderTitle}>
                <MdFormatListBulleted className={styles.sectionIcon} />
                Design Specification Details
              </h3>

              <div className={styles.tableWrapper}>
                <table className={styles.specDetailsTable}>
                  <tbody>
                    <tr>
                      <td className={styles.specLabelCell}>Design Name</td>
                      <td className={styles.specValCell}><strong>{design.title}</strong></td>
                    </tr>
                    <tr>
                      <td className={styles.specLabelCell}>Category</td>
                      <td className={styles.specValCell}>{design.category}</td>
                    </tr>
                    <tr>
                      <td className={styles.specLabelCell}>Subcategory</td>
                      <td className={styles.specValCell}>{design.subcategory || "N/A"}</td>
                    </tr>
                    <tr>
                      <td className={styles.specLabelCell}>Number of Needles</td>
                      <td className={styles.specValCell}>
                        <span className={styles.needlePill}>
                          <MdFormatListNumbered /> {needlesCount} Needle{needlesCount !== 1 ? "s" : ""}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.specLabelCell}>Design File Format</td>
                      <td className={styles.specValCell}>
                        <span className={styles.formatPill}>
                          <MdLayers /> {formatName}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.specLabelCell}>Total Stitches</td>
                      <td className={styles.specValCell}>
                        {design.total_stitch_count ? (
                          <span className={styles.stitchHighlight}>
                            <MdGridOn /> {design.total_stitch_count.toLocaleString()} stitches
                          </span>
                        ) : (
                          "Available in files"
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.specLabelCell}>Files Included</td>
                      <td className={styles.specValCell}>{design.file_names?.length || 1} File{design.file_names?.length !== 1 ? "s" : ""}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Description Box */}
            <div className={styles.aboutSection}>
              <h3>Product Description</h3>
              <p className={styles.descriptionText}>{design.description}</p>
            </div>
          </div>

          {/* Right Column: Price & Add to Cart / Buy Action Card */}
          <div className={styles.rightActionCol}>
            <div className={styles.buyBoxCard}>
              <div className={styles.priceRow}>
                <span className={styles.priceLabelText}>Price</span>
                <div className={styles.priceDisplay}>
                  <span className={styles.currencySymbol}>₹</span>
                  <span className={styles.priceValue}>{design.price}</span>
                </div>
              </div>

              <div className={styles.stockStatus}>
                <MdCheckCircle className={styles.inStockIcon} />
                <span>Instant Digital Download</span>
              </div>

              <div className={styles.actionButtonsCol}>
                <button 
                  className={`btn-primary-custom ${styles.addToCartBtn} ${addedToCart ? styles.addedBtn : ""}`} 
                  onClick={handleAddToCart}
                >
                  <MdAddShoppingCart />
                  {addedToCart ? "✓ Added to Cart" : "Add to Cart"}
                </button>

                <button className={styles.buyNowBtn} onClick={handleBuyNow}>
                  <MdShoppingCart /> Buy Now - ₹{design.price}
                </button>
              </div>

              <div className={styles.guaranteeRow}>
                <span><MdCheckCircle /> {design.file_names?.length || 1} Machine Files Included</span>
                <span><MdCheckCircle /> Lifetime Download Access</span>
                <span><MdShield /> 100% Safe & Secure Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignDetails;
