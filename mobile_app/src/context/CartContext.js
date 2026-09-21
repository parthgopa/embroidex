import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const CartContext = createContext({});

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const cartKey = `embroidex_cart_${user?.email || 'guest'}`;

  const GUEST_KEY = 'embroidex_cart_guest';

  useEffect(() => {
    loadCart();
  }, [cartKey]);

  const loadCart = async () => {
    try {
      // Read the target cart (user or guest)
      const stored = await AsyncStorage.getItem(cartKey);
      const userItems = stored ? JSON.parse(stored) : [];

      // If we just logged in (key is no longer guest), merge guest cart in
      if (cartKey !== GUEST_KEY) {
        const guestStored = await AsyncStorage.getItem(GUEST_KEY);
        if (guestStored) {
          const guestItems = JSON.parse(guestStored);
          if (guestItems.length > 0) {
            // Merge: keep user items, append guest items that aren't duplicates
            const merged = [...userItems];
            guestItems.forEach((g) => {
              if (!merged.some((u) => u._id === g._id)) merged.push(g);
            });
            // Persist merged cart to user key and clear guest key
            await AsyncStorage.setItem(cartKey, JSON.stringify(merged));
            await AsyncStorage.removeItem(GUEST_KEY);
            setCartItems(merged);
            return;
          }
          // No guest items — just delete the empty guest key
          await AsyncStorage.removeItem(GUEST_KEY);
        }
      }

      setCartItems(userItems);
    } catch (err) {
      console.warn('Failed to load cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const persistCart = async (items) => {
    setCartItems(items);
    try {
      await AsyncStorage.setItem(cartKey, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to persist cart:', err);
    }
  };

  const addToCart = (design) => {
    if (!design || !design._id) return false;

    // Avoid duplicate additions
    const exists = cartItems.some((item) => item._id === design._id);
    if (exists) {
      return false;
    }

    const newItem = {
      _id: design._id,
      title: design.title,
      price: Number(design.price) || 0,
      thumbnail: design.thumbnail,
      category: design.category,
      subcategory: design.subcategory,
      machine_type: design.machine_type || design.design_type || '',
      area: design.area || '',
      needles: design.needles || 1,
      file_format: (design.file_format || design.design_file_type || 'EMB').toUpperCase(),
      file_names: design.file_names || [],
      total_stitch_count: design.total_stitch_count || 0,
      addedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...cartItems];
    persistCart(updated);
    return true;
  };

  const removeFromCart = (designId) => {
    const updated = cartItems.filter((item) => item._id !== designId);
    persistCart(updated);
  };

  const clearCart = () => {
    persistCart([]);
  };

  const isInCart = (designId) => {
    return cartItems.some((item) => item._id === designId);
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + (Number(item.price) || 0),
    0
  );

  const cartCount = cartItems.length;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        isLoading,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
