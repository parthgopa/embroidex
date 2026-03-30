/**
 * Seller Protected Route
 * Redirects non-sellers to seller registration page
 * Ensures only sellers can access seller-specific routes
 */

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../services/api";

const SellerProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkSellerStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const checkSellerStatus = async () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const res = await API.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsAuthenticated(true);
      setIsSeller(res.data.is_seller);
    } catch (err) {
      console.error("Failed to verify seller status", err);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        color: 'var(--text-light)'
      }}>
        <p>Verifying access...</p>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not a seller - redirect to seller registration
  if (!isSeller) {
    return <Navigate to="/seller/register" replace />;
  }

  // Is a seller - allow access
  return children;
};

export default SellerProtectedRoute;
