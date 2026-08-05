import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdShoppingCart, MdArrowForward } from "react-icons/md";
import { getCartItems, getCartTotal, getCartCount } from "../utils/cartUtils";
import styles from "./FloatingCartWidget.module.css";

const FloatingCartWidget = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [animate, setAnimate] = useState(false);

  const updateCartState = () => {
    const userId = localStorage.getItem("user_id");
    const items = getCartItems(userId);
    const count = getCartCount(userId);
    const total = getCartTotal(userId);
    
    setCartItems(items);
    setCartCount(count);
    setCartTotal(total);

    // Trigger bounce animation
    setAnimate(true);
    setTimeout(() => setAnimate(false), 500);
  };

  useEffect(() => {
    updateCartState();

    window.addEventListener("embroidex_cart_updated", updateCartState);
    return () => {
      window.removeEventListener("embroidex_cart_updated", updateCartState);
    };
  }, []);

  if (cartCount === 0) return null;

  return (
    <div className={`${styles.floatingWidgetContainer} ${animate ? styles.bounce : ""}`}>
      <div className={styles.widgetCard} onClick={() => navigate("/cart")}>
        <div className={styles.iconWrapper}>
          <MdShoppingCart className={styles.cartIcon} />
          <span className={styles.badge}>{cartCount}</span>
        </div>

        <div className={styles.widgetInfo}>
          <span className={styles.itemCountText}>{cartCount} {cartCount === 1 ? "Item" : "Items"} in Cart</span>
          <span className={styles.totalPrice}>₹{cartTotal.toLocaleString()}</span>
        </div>

        <button 
          className={styles.viewCartBtn}
          onClick={(e) => {
            e.stopPropagation();
            navigate("/cart");
          }}
          title="View Cart"
        >
          <span className={styles.btnLabel}>View Cart</span>
          <MdArrowForward className={styles.arrowIcon} />
        </button>
      </div>
    </div>
  );
};

export default FloatingCartWidget;
