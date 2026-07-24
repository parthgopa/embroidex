import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MdDownload, 
  MdShoppingBag, 
  MdCheckCircle,
  MdCalendarToday,
  MdReceiptLong
} from "react-icons/md";
import API from "../services/api";
import styles from "./MyPurchases.module.css";

const MyPurchases = () => {
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

  const handleDownloadReceipt = (purchase) => {
    const receiptNo = purchase.receipt || `RCPT-${purchase._id.slice(-8).toUpperCase()}`;
    const dateStr = formatDate(purchase.purchased_at || new Date());

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 36px; background: #ffffff; color: #1e293b; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 24px;">
          <div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px;">Embroidex</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; font-weight: 500;">Embroidery Design Marketplace</p>
          </div>
          <div style="background: #e0e7ff; color: #4338ca; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
            Official Receipt
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; background: #f8fafc; padding: 18px; border-radius: 8px; border: 1px solid #f1f5f9;">
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Receipt Number</div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 4px;">${receiptNo}</div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Date & Time</div>
            <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 4px;">${dateStr}</div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Payment Method</div>
            <div style="font-size: 12px; font-weight: 600; color: #4338ca; margin-top: 4px;">${purchase.payment_detail || (purchase.payment_method ? purchase.payment_method.toUpperCase() : 'Razorpay Online')}</div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Payment ID</div>
            <div style="font-size: 12px; font-weight: 600; color: #334155; margin-top: 4px;">${purchase.payment_id || 'N/A'}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #4f46e5; color: #ffffff;">
              <th style="padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700;">Design Item</th>
              <th style="padding: 10px 14px; text-align: right; font-size: 12px; font-weight: 700;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 14px;">
                <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${purchase.design_title}</div>
                <div style="font-size: 12px; color: #4338ca; font-weight: 600;">Includes ${purchase.design_files?.length || 0} EMB Embroidery Files</div>
              </td>
              <td style="padding: 14px; text-align: right; font-size: 15px; font-weight: 700; color: #0f172a;">₹${purchase.amount_paid}</td>
            </tr>
          </tbody>
        </table>

        <div style="width: 220px; margin-left: auto; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #64748b;">
            <span>Subtotal:</span>
            <span>₹${purchase.amount_paid}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; color: #64748b;">
            <span>Platform Fee:</span>
            <span>₹0.00</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 16px; font-weight: 800; color: #4f46e5; border-top: 2px solid #e2e8f0; margin-top: 4px;">
            <span>Total Paid:</span>
            <span>₹${purchase.amount_paid}</span>
          </div>
        </div>

        <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8;">
          <p style="margin: 0 0 2px 0; font-weight: 600; color: #64748b;">Thank you for purchasing from Embroidex Marketplace!</p>
          <p style="margin: 0;">This is an official computer-generated receipt.</p>
        </div>
      </div>
    `;

    const generatePdf = () => {
      const opt = {
        margin: [0.2, 0.2, 0.2, 0.2],
        filename: `Receipt_${receiptNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      window.html2pdf().set(opt).from(element).save();
    };

    if (window.html2pdf) {
      generatePdf();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => generatePdf();
      script.onerror = () => alert("Failed to load PDF generator library");
      document.head.appendChild(script);
    }
  };

  const getInitials = (title) => {
    const words = (title || "Design").trim().split(/\s+/);
    return words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : words[0].slice(0, 2).toUpperCase();
  };

  const avatarColors = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444"];
  const getAvatarColor = (title) => avatarColors[(title?.charCodeAt(0) || 0) % avatarColors.length];

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
                    {purchase.design_thumbnail ? (
                      <img
                        src={purchase.design_thumbnail}
                        alt={purchase.design_title}
                        className={styles.thumbnail}
                      />
                    ) : (
                      <div
                        className={styles.thumbnailFallback}
                        style={{ background: getAvatarColor(purchase.design_title) }}
                      >
                        {getInitials(purchase.design_title)}
                      </div>
                    )}
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
                          <strong>Amount:</strong> ₹{purchase.amount_paid}
                        </span>
                        {(purchase.receipt || purchase.order_id) && (
                          <span className={styles.metaItem}>
                            <strong>Receipt:</strong> {purchase.receipt || purchase.order_id}
                          </span>
                        )}
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
                      className={`btn-primary-custom ${styles.mainDownloadBtn}`}
                      onClick={() => handleDownload(purchase)}
                    >
                      <MdDownload />
                      Download Files
                    </button>
                    <div className={styles.secondaryActions}>
                      <button
                        className={styles.smallOutlineBtn}
                        onClick={() => handleDownloadReceipt(purchase)}
                        title="Download Receipt File"
                      >
                        <MdReceiptLong />
                        Receipt
                      </button>
                      <button
                        className={styles.smallOutlineBtn}
                        onClick={() => navigate(`/design/${purchase.design_id}`)}
                      >
                        Details
                      </button>
                    </div>
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
