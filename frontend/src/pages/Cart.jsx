import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  MdShoppingCart, 
  MdDeleteOutline, 
  MdArrowBack, 
  MdCheckCircle, 
  MdShield, 
  MdVerified, 
  MdFormatListNumbered, 
  MdGridOn,
  MdLayers
} from "react-icons/md";
import { getCartItems, removeFromCart, clearCart, getCartTotal } from "../utils/cartUtils";
import styles from "./Cart.module.css";

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [userId, setUserId] = useState(null);

  const loadCartData = () => {
    const activeUserId = localStorage.getItem("user_id");
    setUserId(activeUserId);
    const items = getCartItems(activeUserId);
    const total = getCartTotal(activeUserId);
    setCartItems(items);
    setCartTotal(total);
  };

  useEffect(() => {
    loadCartData();

    window.addEventListener("embroidex_cart_updated", loadCartData);
    return () => {
      window.removeEventListener("embroidex_cart_updated", loadCartData);
    };
  }, []);

  const handleRemove = (designId) => {
    const updated = removeFromCart(designId, userId);
    setCartItems(updated);
    setCartTotal(getCartTotal(userId));
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      clearCart(userId);
      setCartItems([]);
      setCartTotal(0);
    }
  };

  const handleCheckout = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to proceed with checkout");
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) return;

    navigate("/purchase/checkout");
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>
              <MdShoppingCart className={styles.titleIcon} />
              Shopping Cart
            </h1>
            <p className={styles.pageSubtitle}>
              {cartItems.length} design{cartItems.length !== 1 ? "s" : ""} selected
            </p>
          </div>

          {cartItems.length > 0 && (
            <button className={styles.clearBtn} onClick={handleClear}>
              <MdDeleteOutline /> Clear Cart
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className={styles.emptyCartCard}>
            <MdShoppingCart className={styles.emptyCartIcon} />
            <h2>Your Cart is Empty</h2>
            <p>Explore thousands of premium embroidery designs and add them to your cart.</p>
            <button className="btn-primary-custom" onClick={() => navigate("/explore")}>
              Browse Designs
            </button>
          </div>
        ) : (
          <div className={styles.cartGrid}>
            {/* Cart Items List Column */}
            <div className={styles.itemsColumn}>
              {cartItems.map((item) => (
                <div key={item._id} className={styles.cartItemCard}>
                  <img
                    src={item.thumbnail || "https://via.placeholder.com/150"}
                    alt={item.title}
                    className={styles.itemImage}
                    onContextMenu={(e) => e.preventDefault()}
                  />

                  <div className={styles.itemDetails}>
                    <div className={styles.itemMetaHeader}>
                      <span className={styles.categoryBadge}>{item.category}</span>
                      {item.subcategory && (
                        <span className={styles.subcategoryBadge}>{item.subcategory}</span>
                      )}
                    </div>

                    <h3 
                      className={styles.itemTitle}
                      onClick={() => window.open(`/design/${item._id}`, "_blank")}
                    >
                      {item.title}
                    </h3>

                    <div className={styles.specBadgesRow}>
                      <span className={styles.specPill}>
                        <MdFormatListNumbered /> {item.needles} Needle{item.needles !== 1 ? "s" : ""}
                      </span>
                      <span className={styles.specPillFormat}>
                        <MdLayers /> {(item.file_format || "EMB").toUpperCase()}
                      </span>
                      {item.total_stitch_count > 0 && (
                        <span className={styles.specPillStitches}>
                          <MdGridOn /> {item.total_stitch_count.toLocaleString()} Stitches
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.itemPriceCol}>
                    <div className={styles.priceText}>₹{item.price}</div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => handleRemove(item._id)}
                      title="Remove design"
                    >
                      <MdDeleteOutline /> Remove
                    </button>
                  </div>
                </div>
              ))}

              <Link to="/explore" className={styles.continueShoppingLink}>
                <MdArrowBack /> Continue Shopping for Designs
              </Link>
            </div>

            {/* Order Summary Column */}
            <div className={styles.summaryColumn}>
              <div className={styles.summaryCard}>
                <h3 className={styles.summaryTitle}>Order Summary</h3>

                <div className={styles.summaryRow}>
                  <span>Subtotal ({cartItems.length} items)</span>
                  <strong>₹{cartTotal.toLocaleString()}</strong>
                </div>

                <div className={styles.summaryRow}>
                  <span>Convenience Fee</span>
                  <span className={styles.freeBadge}>FREE</span>
                </div>

                <div className={styles.divider}></div>

                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span>Total Amount</span>
                  <span className={styles.totalPrice}>₹{cartTotal.toLocaleString()}</span>
                </div>

                <button 
                  className={`btn-primary-custom ${styles.checkoutBtn}`}
                  onClick={handleCheckout}
                >
                  <MdCheckCircle /> Proceed to Checkout
                </button>

                <div className={styles.guaranteeBox}>
                  <div className={styles.guaranteeItem}>
                    <MdCheckCircle className={styles.gIcon} />
                    <span>Instant EMB & Machine Files Download</span>
                  </div>
                  <div className={styles.guaranteeItem}>
                    <MdShield className={styles.gIcon} />
                    <span>100% Safe & Secure Payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
