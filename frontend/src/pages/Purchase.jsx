import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  MdArrowBack, 
  MdCheckCircle, 
  MdError,
  MdShoppingCart,
  MdSecurity,
  MdVerified,
  MdFileDownload,
  MdHighQuality,
  MdFormatListNumbered,
  MdLayers
} from "react-icons/md";
import API from "../services/api";
import { getCartItems, getCartTotal, clearCart } from "../utils/cartUtils";
import styles from "./Purchase.module.css";

const Purchase = () => {
  const { designId } = useParams();
  const navigate = useNavigate();
  
  const isCartCheckout = designId === "checkout";

  const [design, setDesign] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [receiptNumber, setReceiptNumber] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to purchase designs");
      navigate("/login");
      return;
    }

    if (isCartCheckout) {
      loadCartItemsData();
    } else {
      fetchDesignDetails();
    }

    loadRazorpayScript();
  }, [designId]);

  const loadCartItemsData = () => {
    const userId = localStorage.getItem("user_id");
    const items = getCartItems(userId);
    if (items.length === 0) {
      alert("Your cart is empty!");
      navigate("/explore");
      return;
    }
    setCartItems(items);
    setTotalPrice(getCartTotal(userId));
    setLoading(false);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchDesignDetails = async () => {
    try {
      const res = await API.get(`/seller/design/${designId}`);
      const singleDesign = res.data.design;
      setDesign(singleDesign);
      setTotalPrice(singleDesign.price || 0);
    } catch (err) {
      console.error("Failed to fetch design details", err);
      alert("Failed to load design details");
      navigate("/explore");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("user_id");

      let payload = {};
      if (isCartCheckout) {
        payload = { design_ids: cartItems.map((item) => item._id) };
      } else {
        payload = { design_id: designId };
      }

      const orderRes = await API.post("/payment/create-order", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { order_id, amount, currency } = orderRes.data;

      const options = {
        key: "rzp_test_STud3pKjWPTcMu",
        amount: amount,
        currency: currency,
        name: "Embroidex",
        description: isCartCheckout 
          ? `Purchase ${cartItems.length} Embroidery Design(s)`
          : design?.title,
        order_id: order_id,
        handler: async function (response) {
          try {
            const verifyRes = await API.post(
              "/payment/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              if (isCartCheckout) {
                clearCart(userId);
              }
              if (verifyRes.data.receipt) {
                setReceiptNumber(verifyRes.data.receipt);
              }
              setPaymentStatus("success");
              setTimeout(() => {
                navigate("/my-purchases");
              }, 4000);
            }
          } catch (err) {
            console.error("Payment verification failed", err);
            setPaymentStatus("failed");
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: ""
        },
        theme: {
          color: "#4f46e5"
        },
        modal: {
          ondismiss: function() {
            setProcessing(false);
            setPaymentStatus("cancelled");
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setProcessing(false);

    } catch (err) {
      console.error("Payment initiation failed", err);
      alert(err.response?.data?.error || "Failed to initiate payment");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading checkout details...</p>
      </div>
    );
  }

  if (!isCartCheckout && !design) {
    return (
      <div className={styles.error}>
        <h2>Design not found</h2>
        <button className="btn-primary-custom" onClick={() => navigate("/explore")}>
          Back to Explore
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {paymentStatus === "success" && (
          <div className={styles.statusCard}>
            <MdCheckCircle className={styles.successIcon} />
            <h2>Payment Successful!</h2>
            {receiptNumber && (
              <p className={styles.receiptText}>
                Receipt No: <strong>{receiptNumber}</strong>
              </p>
            )}
            <p>
              Your purchase of {isCartCheckout ? `${cartItems.length} designs` : "1 design"} is complete. 
              Redirecting to your purchases page...
            </p>
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className={styles.statusCard}>
            <MdError className={styles.errorIcon} />
            <h2>Payment Failed</h2>
            <p>There was an issue processing your payment. Please try again.</p>
            <button className="btn-primary-custom" onClick={() => setPaymentStatus(null)}>
              Try Again
            </button>
          </div>
        )}

        {paymentStatus === "cancelled" && (
          <div className={styles.statusCard}>
            <MdError className={styles.warningIcon} />
            <h2>Payment Cancelled</h2>
            <p>You cancelled the payment. You can try again whenever ready.</p>
            <button className="btn-primary-custom" onClick={() => setPaymentStatus(null)}>
              Try Again
            </button>
          </div>
        )}

        {!paymentStatus && (
          <div className={styles.purchaseCard}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeftGroup}>
                <button 
                  className={styles.backBtn} 
                  onClick={() => navigate(isCartCheckout ? "/cart" : `/design/${designId}`)}
                >
                  <MdArrowBack /> {isCartCheckout ? "Back to Cart" : "Back to Design"}
                </button>
                <h1 className={styles.title}>Checkout & Payment</h1>
              </div>
              <span className={styles.secureTag}><MdSecurity /> 256-bit Encrypted</span>
            </div>

            <div className={styles.contentGrid}>
              {/* Left Column: Items Summary List */}
              <div className={styles.leftCol}>
                {isCartCheckout ? (
                  <div className={styles.cartItemsListSummary}>
                    <h3>Order Items ({cartItems.length})</h3>
                    {cartItems.map((item) => (
                      <div key={item._id} className={styles.cartItemRowSummary}>
                        <img
                          src={item.thumbnail || "https://via.placeholder.com/80"}
                          alt={item.title}
                          className={styles.cartItemThumb}
                        />
                        <div className={styles.cartItemMeta}>
                          <h4>{item.title}</h4>
                          <span className={styles.catBadge}>{item.category}</span>
                          <span className={styles.specPill}>
                            <MdFormatListNumbered /> {item.needles || 1} Needles • {(item.file_format || "EMB").toUpperCase()}
                          </span>
                        </div>
                        <div className={styles.cartItemPrice}>
                          ₹{item.price}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.designPreview}>
                    <img
                      src={design.thumbnail || "https://via.placeholder.com/200x150"}
                      alt={design.title}
                      className={styles.designImage}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/200x150";
                      }}
                    />
                    <div className={styles.designInfo}>
                      <h3>{design.title}</h3>
                      <div className={styles.badgeRow}>
                        <span className={styles.catBadge}>{design.category}</span>
                        {design.subcategory && <span className={styles.subcatBadge}>• {design.subcategory}</span>}
                      </div>
                      <p className={styles.filesCount}>
                        <MdFileDownload /> {design.file_names?.length || 0} EMB Embroidery Files
                      </p>
                    </div>
                  </div>
                )}

                <div className={styles.benefits}>
                  <h4><MdVerified className={styles.benefitHeaderIcon} /> What's included in your purchase:</h4>
                  <ul>
                    <li><MdCheckCircle className={styles.checkIcon} /> Instant ZIP download after payment</li>
                    <li><MdCheckCircle className={styles.checkIcon} /> All production-ready machine EMB files</li>
                    <li><MdCheckCircle className={styles.checkIcon} /> Full commercial use authorization</li>
                    <li><MdCheckCircle className={styles.checkIcon} /> Lifetime download access from your account</li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Price Breakdown & Checkout Action */}
              <div className={styles.rightCol}>
                <div className={styles.priceBreakdown}>
                  <h3>Order Summary</h3>
                  <div className={styles.priceRow}>
                    <span>Subtotal ({isCartCheckout ? cartItems.length : 1} item{isCartCheckout && cartItems.length !== 1 ? "s" : ""})</span>
                    <span>₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className={styles.priceRow}>
                    <span>Platform Convenience Fee</span>
                    <span className={styles.freeTag}>FREE</span>
                  </div>
                  <div className={styles.divider}></div>
                  <div className={`${styles.priceRow} ${styles.totalRow}`}>
                    <span>Total Amount</span>
                    <span className={styles.totalPrice}>₹{totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <div className={styles.securityBadgeBox}>
                  <MdSecurity className={styles.securityIcon} />
                  <div>
                    <strong>100% Guaranteed Safe Checkout</strong>
                    <p>Secured by Razorpay • UPI, Cards, NetBanking, Wallets</p>
                  </div>
                </div>

                <button
                  className={`btn-primary-custom ${styles.payBtn}`}
                  onClick={handlePayment}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <div className={styles.btnSpinner}></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <MdShoppingCart />
                      Pay ₹{totalPrice.toLocaleString()} Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Mobile Bottom Pay Bar (Mobile Only) */}
      {!paymentStatus && (
        <div className={styles.stickyMobilePayBar}>
          <div className={styles.stickyMobileInfo}>
            <span className={styles.stickyLabel}>Total Amount</span>
            <span className={styles.stickyPrice}>₹{totalPrice.toLocaleString()}</span>
          </div>
          <button
            className={`btn-primary-custom ${styles.stickyPayBtn}`}
            onClick={handlePayment}
            disabled={processing}
          >
            {processing ? "Processing..." : `Pay ₹${totalPrice.toLocaleString()}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default Purchase;
