import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  MdArrowBack, 
  MdCheckCircle, 
  MdError,
  MdShoppingCart,
  MdSecurity
} from "react-icons/md";
import API from "../services/api";
import styles from "./Purchase.module.css";

const Purchase = () => {
  const { designId } = useParams();
  const navigate = useNavigate();
  const BASE_URL = API.defaults.baseURL;
  
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to purchase designs");
      navigate("/login");
      return;
    }

    fetchDesignDetails();
    loadRazorpayScript();
  }, [designId]);

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
      setDesign(res.data.design);
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
      
      // Step 1: Create Razorpay order
      const orderRes = await API.post(
        "/payment/create-order",
        { design_id: designId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { order_id, amount, currency } = orderRes.data;

      // Step 2: Initialize Razorpay payment
      const options = {
        key: "rzp_test_STud3pKjWPTcMu",
        amount: amount,
        currency: currency,
        name: "Embroidex",
        description: design.title,
        order_id: order_id,
        handler: async function (response) {
          // Step 3: Verify payment
          try {
            const verifyRes = await API.post(
              "/payment/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                design_id: designId
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              setPaymentStatus("success");
              setTimeout(() => {
                navigate("/my-purchases");
              }, 3000);
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
        <p>Loading payment details...</p>
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

  return (
    <div className={styles.container}>
      <div className="container">
        <button className={styles.backBtn} onClick={() => navigate(`/design/${designId}`)}>
          <MdArrowBack /> Back to Design
        </button>

        {paymentStatus === "success" && (
          <div className={styles.successMessage}>
            <MdCheckCircle className={styles.successIcon} />
            <h2>Payment Successful!</h2>
            <p>Your purchase has been completed. Redirecting to your purchases...</p>
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className={styles.errorMessage}>
            <MdError className={styles.errorIcon} />
            <h2>Payment Failed</h2>
            <p>There was an issue processing your payment. Please try again.</p>
            <button className="btn-primary-custom" onClick={() => setPaymentStatus(null)}>
              Try Again
            </button>
          </div>
        )}

        {paymentStatus === "cancelled" && (
          <div className={styles.warningMessage}>
            <MdError className={styles.warningIcon} />
            <h2>Payment Cancelled</h2>
            <p>You cancelled the payment. You can try again when ready.</p>
            <button className="btn-primary-custom" onClick={() => setPaymentStatus(null)}>
              Try Again
            </button>
          </div>
        )}

        {!paymentStatus && (
          <div className={styles.purchaseCard}>
            <h1 className={styles.title}>Complete Your Purchase</h1>

            <div className={styles.designPreview}>
              <img
                src={`${BASE_URL}/${design.thumbnail_path}`}
                alt={design.title}
                className={styles.designImage}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/200x150";
                }}
              />
              <div className={styles.designInfo}>
                <h3>{design.title}</h3>
                <p className={styles.category}>{design.category} • {design.subcategory}</p>
                <p className={styles.files}>{design.file_names?.length || 0} EMB files included</p>
              </div>
            </div>

            <div className={styles.priceBreakdown}>
              <h3>Order Summary</h3>
              <div className={styles.priceRow}>
                <span>Design Price</span>
                <span>₹{design.price}</span>
              </div>
              <div className={styles.priceRow}>
                <span>Platform Fee</span>
                <span>₹0</span>
              </div>
              <div className={styles.divider}></div>
              <div className={`${styles.priceRow} ${styles.totalRow}`}>
                <span>Total Amount</span>
                <span>₹{design.price}</span>
              </div>
            </div>

            <div className={styles.securityInfo}>
              <MdSecurity className={styles.securityIcon} />
              <div>
                <strong>Secure Payment</strong>
                <p>Your payment is secured by Razorpay with 256-bit encryption</p>
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
                  Pay ₹{design.price} with Razorpay
                </>
              )}
            </button>

            <div className={styles.benefits}>
              <h4>What you'll get:</h4>
              <ul>
                <li>✓ Instant download after payment</li>
                <li>✓ All {design.file_names?.length || 0} EMB files</li>
                <li>✓ High-quality embroidery design</li>
                <li>✓ Lifetime access to your purchase</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Purchase;
