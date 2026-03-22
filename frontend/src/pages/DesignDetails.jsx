import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  MdArrowBack, 
  MdShoppingCart, 
  MdImage,
  MdDescription,
  MdCategory,
  MdAttachMoney,
  MdGridOn
} from "react-icons/md";
import API from "../services/api";
import styles from "./DesignDetails.module.css";

const DesignDetails = () => {
  const { designId } = useParams();
  const navigate = useNavigate();
  const BASE_URL = API.defaults.baseURL;
  
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
        <p>Loading design details...</p>
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
    design.thumbnail_path,
    ...(design.additional_images || [])
  ].filter(Boolean);

  return (
    <div className={styles.container}>
      <div className="container">
        <button className={styles.backBtn} onClick={() => navigate("/explore")}>
          <MdArrowBack /> Back to Explore
        </button>

        <div className={styles.detailsGrid}>
          {/* Image Gallery Section */}
          <div className={styles.imageSection}>
            <div className={styles.mainImageContainer}>
              <img
                src={`${BASE_URL}/${allImages[currentImageIndex]}`}
                alt={design.title}
                className={styles.mainImage}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/600x400";
                }}
              />
              {allImages.length > 1 && (
                <div className={styles.imageCounter}>
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              )}
            </div>

            {allImages.length > 1 && (
              <div className={styles.thumbnailStrip}>
                {allImages.map((img, index) => (
                  <img
                    key={index}
                    src={`${BASE_URL}/${img}`}
                    alt={`${design.title} - ${index + 1}`}
                    className={`${styles.thumbnail} ${
                      currentImageIndex === index ? styles.activeThumbnail : ""
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/100x100";
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className={styles.detailsSection}>
            <h1 className={styles.title}>{design.title}</h1>
            
            <div className={styles.priceSection}>
              <span className={styles.price}>₹{design.price}</span>
              <span className="tag tag-approved">Approved Design</span>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <MdCategory className={styles.infoIcon} />
                <div>
                  <strong>Category</strong>
                  <p>{design.category}</p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <MdCategory className={styles.infoIcon} />
                <div>
                  <strong>Subcategory</strong>
                  <p>{design.subcategory}</p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <MdGridOn className={styles.infoIcon} />
                <div>
                  <strong>Total Stitches</strong>
                  <p>{design.total_stitch_count?.toLocaleString() || "N/A"}</p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <MdImage className={styles.infoIcon} />
                <div>
                  <strong>Files Included</strong>
                  <p>{design.file_names?.length || 0} EMB files</p>
                </div>
              </div>
            </div>

            <div className={styles.descriptionSection}>
              <h3>
                <MdDescription className={styles.sectionIcon} />
                Description
              </h3>
              <p className={styles.description}>{design.description}</p>
            </div>

            {design.file_names && design.file_names.length > 0 && (
              <div className={styles.filesSection}>
                <h3>Included Files</h3>
                <div className={styles.filesList}>
                  {design.file_names.map((fileName, index) => (
                    <div key={index} className={styles.fileItem}>
                      <MdImage />
                      <span>{fileName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              className={`btn-primary-custom ${styles.purchaseBtn}`}
              onClick={handlePurchase}
            >
              <MdShoppingCart />
              Purchase Design - ₹{design.price}
            </button>

            <div className={styles.securityNote}>
              <p>🔒 Secure payment powered by Razorpay</p>
              <p>✓ Instant download after payment</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignDetails;
