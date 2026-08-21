import { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isAuthenticated = Boolean(token && user);
  const isSeller = Boolean(user?.is_seller);

  const fetchCurrentUser = async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const res = await API.get("/auth/me", {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setUser(res.data);
      return res.data;
    } catch (err) {
      console.error("AuthContext: Failed to fetch current user", err);
      // If token expired or invalid, clear it
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        setUser(null);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    setUser(null);
  };

  const refreshUser = async () => {
    return await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isSeller,
        isAuthenticated: Boolean(user),
        loading,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;