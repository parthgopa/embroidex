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
  MdZoomIn,
  MdClose
} from "react-icons/md";
import API from "../services/api";
import styles from "./DesignDetails.module.css";

const DesignDetails = () => {
  const { designId } = useParams();
  const navigate = useNavigate();
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    fetchDesignDetails();
  }, [designId]);

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

  const handlePurchase = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to purchase designs");
      navigate("/login");
      return;
    }
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

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Amazon-Style Breadcrumb Navigation */}
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

        {/* Amazon 2-Column Product Layout */}
        <div className={styles.productGrid}>
          {/* Left Column: Sticky Image Gallery & Zoom */}
          <div className={styles.imageGalleryCol}>
            <div className={styles.mainImageCard} onClick={() => setIsLightboxOpen(true)}>
              <img
                src={allImages[currentImageIndex] || "https://via.placeholder.com/600x400"}
                alt={design.title}
                className={styles.mainImage}
              />
              <div className={styles.zoomHint}>
                <MdZoomIn /> Click to expand
              </div>
              {allImages.length > 1 && (
                <span className={styles.imageBadge}>
                  {currentImageIndex + 1} of {allImages.length} Photos
                </span>
              )}
            </div>

            {allImages.length > 1 && (
              <div className={styles.thumbnailStrip}>
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    className={`${styles.thumbBtn} ${currentImageIndex === index ? styles.activeThumb : ""}`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img src={img} alt={`Preview ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Complete Product Details, Buy Card & Specifications */}
          <div className={styles.productInfoCol}>
            {/* Title & Badges */}
            <div className={styles.headerInfo}>
              <div className={styles.tagRow}>
                <span className={styles.categoryTag}>{design.category}</span>
                {design.subcategory && <span className={styles.subcatTag}>{design.subcategory}</span>}
                <span className={styles.verifiedBadge}><MdVerified /> Verified Design</span>
              </div>
              <h1 className={styles.productTitle}>{design.title}</h1>
            </div>

            {/* Amazon Buy Box / Action Section */}
            <div className={styles.buyBoxCard}>
              <div className={styles.priceRow}>
                <div className={styles.priceDisplay}>
                  <span className={styles.currencySymbol}>₹</span>
                  <span className={styles.priceValue}>{design.price}</span>
                </div>
                <span className={styles.freeFeeBadge}>No Convenience Fee</span>
              </div>

              <div className={styles.stockStatus}>
                <MdCheckCircle className={styles.inStockIcon} />
                <span>Instant Digital Download Available Immediately</span>
              </div>

              <button className={`btn-primary-custom ${styles.buyNowBtn}`} onClick={handlePurchase}>
                <MdShoppingCart /> Purchase Design - ₹{design.price}
              </button>

              <div className={styles.guaranteeRow}>
                <span><MdCheckCircle /> {design.file_names?.length || 0} EMB Files Included</span>
                <span><MdCheckCircle /> Lifetime Download Access</span>
                <span><MdShield /> Razorpay Safe Payment</span>
              </div>
            </div>

            {/* Quick Spec Highlights Grid */}
            <div className={styles.specHighlightsGrid}>
              <div className={styles.specBox}>
                <MdGridOn className={styles.specIcon} />
                <div>
                  <span className={styles.specLabel}>Total Stitches</span>
                  <strong className={styles.specVal}>{design.total_stitch_count?.toLocaleString() || "N/A"}</strong>
                </div>
              </div>

              <div className={styles.specBox}>
                <MdFileDownload className={styles.specIcon} />
                <div>
                  <span className={styles.specLabel}>Files Included</span>
                  <strong className={styles.specVal}>{design.file_names?.length || 0} EMB Files</strong>
                </div>
              </div>

              <div className={styles.specBox}>
                <MdLayers className={styles.specIcon} />
                <div>
                  <span className={styles.specLabel}>Format</span>
                  <strong className={styles.specVal}>Machine EMB ZIP</strong>
                </div>
              </div>
            </div>

            {/* About / Description Section */}
            <div className={styles.aboutSection}>
              <h3><MdFormatListBulleted /> Product Description</h3>
              <p className={styles.descriptionText}>{design.description}</p>
            </div>

            {/* Individual File Specifications Table */}
            {design.emb_metadata && design.emb_metadata.length > 0 && (
              <div className={styles.fileSpecsSection}>
                <h3>Embroidery File Specifications</h3>
                <div className={styles.specsTableWrapper}>
                  <table className={styles.specsTable}>
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Stitch Count</th>
                        <th>Width</th>
                        <th>Height</th>
                      </tr>
                    </thead>
                    <tbody>
                      {design.emb_metadata.map((emb, idx) => (
                        <tr key={idx}>
                          <td className={styles.fileNameCell}>{emb.file_name}</td>
                          <td><strong>{emb.stitch_count?.toLocaleString() || "N/A"}</strong></td>
                          <td>{emb.width_mm ?? "N/A"} mm</td>
                          <td>{emb.height_mm ?? "N/A"} mm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div className={styles.lightboxOverlay} onClick={() => setIsLightboxOpen(false)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.lightboxCloseBtn} onClick={() => setIsLightboxOpen(false)}>
              <MdClose size={28} />
            </button>
            {allImages.length > 1 && (
              <>
                <button className={`${styles.lightboxNavBtn} ${styles.prevBtn}`} onClick={prevImage}>
                  <MdChevronLeft size={36} />
                </button>
                <button className={`${styles.lightboxNavBtn} ${styles.nextBtn}`} onClick={nextImage}>
                  <MdChevronRight size={36} />
                </button>
              </>
            )}
            <img
              src={allImages[currentImageIndex]}
              alt={design.title}
              className={styles.lightboxImage}
            />
          </div>
        </div>
      )}

      {/* Sticky Mobile Buy Bar */}
      <div className={styles.stickyMobileBuyBar}>
        <div className={styles.mobilePriceInfo}>
          <span className={styles.mobilePriceLabel}>Total</span>
          <span className={styles.mobilePriceVal}>₹{design.price}</span>
        </div>
        <button className={`btn-primary-custom ${styles.mobileBuyBtn}`} onClick={handlePurchase}>
          <MdShoppingCart /> Buy Now
        </button>
      </div>
    </div>
  );
};

export default DesignDetails;
