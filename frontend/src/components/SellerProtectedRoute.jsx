/**
 * Seller Protected Route
 * Redirects non-sellers to seller registration page
 * Ensures only sellers can access seller-specific routes
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

const SellerProtectedRoute = ({ children }) => {
  const { isSeller, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        color: '#64748b'
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
