/**
 * Cart Manager Utility - Manages per-user shopping cart in localStorage
 */

const getCartKey = (userId) => {
  const activeUserId = userId || localStorage.getItem("user_id") || "guest";
  return `embroidex_cart_${activeUserId}`;
};

export const getCartItems = (userId) => {
  try {
    const key = getCartKey(userId);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Failed to read cart items", err);
    return [];
  }
};

export const addToCart = (design, userId) => {
  if (!design || !design._id) return false;
  
  const key = getCartKey(userId);
  const items = getCartItems(userId);
  
  // Check if item already exists
  const existing = items.find((item) => item._id === design._id);
  if (existing) {
    return false; // Already in cart
  }

  const newItem = {
    _id: design._id,
    title: design.title,
    price: design.price,
    thumbnail: design.thumbnail,
    category: design.category,
    subcategory: design.subcategory,
    needles: design.needles || 1,
    file_format: design.file_format || design.design_file_type || "EMB",
    file_names: design.file_names || [],
    total_stitch_count: design.total_stitch_count || 0,
    addedAt: new Date().toISOString()
  };

  const updatedCart = [newItem, ...items];
  localStorage.setItem(key, JSON.stringify(updatedCart));

  // Dispatch custom event for real-time UI updates
  window.dispatchEvent(new CustomEvent("embroidex_cart_updated"));
  return true;
};

export const removeFromCart = (designId, userId) => {
  const key = getCartKey(userId);
  const items = getCartItems(userId);
  const updatedCart = items.filter((item) => item._id !== designId);
  localStorage.setItem(key, JSON.stringify(updatedCart));

  window.dispatchEvent(new CustomEvent("embroidex_cart_updated"));
  return updatedCart;
};

export const clearCart = (userId) => {
  const key = getCartKey(userId);
  localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent("embroidex_cart_updated"));
};

export const getCartTotal = (userId) => {
  const items = getCartItems(userId);
  return items.reduce((total, item) => total + (Number(item.price) || 0), 0);
};

export const getCartCount = (userId) => {
  const items = getCartItems(userId);
  return items.length;
};
