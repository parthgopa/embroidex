import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MdDownload, 
  MdShoppingBag, 
  MdCheckCircle,
  MdCalendarToday,
  MdAttachMoney
} from "react-icons/md";
import API from "../services/api";
import styles from "./MyPurchases.module.css";

const MyPurchases = () => {
  const BASE_URL = API.defaults.baseURL;
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to view your purchases");
      navigate("/login");
      return;
    }
    fetchMyPurchases();
  }, []);

  const fetchMyPurchases = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/payment/my-purchases", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPurchases(res.data.purchases);
    } catch (err) {
      console.error("Failed to fetch purchases", err);
      alert(err.response?.data?.error || "Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (purchase) => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/payment/download/${purchase._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${purchase.design_title}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download design files");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading your purchases...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              <MdShoppingBag className={styles.titleIcon} />
              My Purchases
            </h1>
            <p className={styles.subtitle}>
              View and download your purchased embroidery designs
            </p>
          </div>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{purchases.length}</span>
              <span className={styles.statLabel}>Total Purchases</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                ₹{purchases.reduce((sum, p) => sum + p.amount_paid, 0)}
              </span>
              <span className={styles.statLabel}>Total Spent</span>
            </div>
          </div>
        </div>

        {purchases.length === 0 ? (
          <div className={styles.emptyState}>
            <MdShoppingBag className={styles.emptyIcon} />
            <h3>No purchases yet</h3>
            <p>Browse our collection and purchase your first design</p>
            <button 
              className="btn-primary-custom"
              onClick={() => navigate("/explore")}
            >
              Explore Designs
            </button>
          </div>
        ) : (
          <div className={styles.purchasesList}>
            {purchases.map((purchase) => (
              <div key={purchase._id} className={styles.purchaseCard}>
                <div className={styles.cardContent}>
                  <div className={styles.designInfo}>
                    <img
                      src={`${BASE_URL}/${purchase.design_thumbnail}`}
                      alt={purchase.design_title}
                      className={styles.thumbnail}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/120x120";
                      }}
                    />
                    <div className={styles.details}>
                      <h3 className={styles.designTitle}>
                        {purchase.design_title}
                      </h3>
                      <div className={styles.meta}>
                        <span className={styles.metaItem}>
                          <MdCalendarToday />
                          {formatDate(purchase.purchased_at)}
                        </span>
                        <span className={styles.metaItem}>
                          <MdAttachMoney />
                          ₹{purchase.amount_paid}
                        </span>
                      </div>
                      <div className={styles.filesInfo}>
                        {purchase.design_files?.length || 0} EMB files included
                      </div>
                      <span className="tag tag-approved">
                        <MdCheckCircle /> Purchased
                      </span>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button
                      className="btn-primary-custom"
                      onClick={() => handleDownload(purchase)}
                    >
                      <MdDownload />
                      Download Files
                    </button>
                    <button
                      className="btn-outline-custom"
                      onClick={() => navigate(`/design/${purchase.design_id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* <div className={styles.transactionInfo}>
                  <div className={styles.transactionItem}>
                    <span>Order ID:</span>
                    <span className={styles.orderId}>{purchase.order_id}</span>
                  </div>
                  <div className={styles.transactionItem}>
                    <span>Payment ID:</span>
                    <span className={styles.paymentId}>{purchase.payment_id}</span>
                  </div>
                </div> */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPurchases;
