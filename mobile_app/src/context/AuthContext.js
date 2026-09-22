import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../services/api';
import { configureGoogleSignIn } from '../services/googleAuth';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing session on app launch
  useEffect(() => {
    configureGoogleSignIn();
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        // Verify token with backend
        await fetchProfile(storedToken);
      }
    } catch (err) {
      console.warn('Session restoration failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async (authToken) => {
    try {
      const res = await API.get('/auth/profile', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.data) {
        setUser(res.data);
        await AsyncStorage.setItem('user', JSON.stringify(res.data));
        // Also fetch user stats
        fetchStats(authToken);
      }
    } catch (err) {
      console.warn('Failed to refresh profile from backend:', err.message);
    }
  };

  const fetchStats = async (authToken) => {
    try {
      const res = await API.get('/auth/stats', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn('Failed to refresh stats:', err.message);
    }
  };

  // Login
  const login = async (email, password) => {
    const res = await API.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });

    const authToken = res.data.token;
    if (authToken) {
      setToken(authToken);
      await AsyncStorage.setItem('token', authToken);

      // Fetch fresh profile
      const profRes = await API.get('/auth/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUser(profRes.data);
      await AsyncStorage.setItem('user', JSON.stringify(profRes.data));
      await fetchStats(authToken);
      return profRes.data;
    }
    throw new Error('Authentication token not received');
  };

  // 2-Step Signup with OTP: Step 1
  const sendSignupOtp = async (name, email, password) => {
    const res = await API.post('/auth/send-signup-otp', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
    return res.data;
  };

  // 2-Step Signup with OTP: Step 2
  const verifySignupOtp = async (name, email, password, otp) => {
    const res = await API.post('/auth/verify-signup-otp', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      otp: otp.trim(),
    });

    const authToken = res.data.token;
    const userData = res.data.user;

    if (authToken) {
      setToken(authToken);
      setUser(userData);
      await AsyncStorage.setItem('token', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await fetchStats(authToken);
      return userData;
    }
    return res.data;
  };

  // Google Login
  const googleLogin = async (googlePayload) => {
    const res = await API.post('/auth/google-login', googlePayload);
    const authToken = res.data.token;
    if (authToken) {
      setToken(authToken);
      await AsyncStorage.setItem('token', authToken);

      // Fetch fresh profile
      const profRes = await API.get('/auth/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUser(profRes.data);
      await AsyncStorage.setItem('user', JSON.stringify(profRes.data));
      await fetchStats(authToken);
      return profRes.data;
    }
    throw new Error('Authentication token not received');
  };

  // Register as Seller
  const registerSeller = async (sellerData) => {
    const res = await API.post('/auth/register-seller', sellerData);
    await fetchProfile(token);
    return res.data;
  };

  // Logout
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore Google signout error if not signed in via Google
      }
    } catch (e) {
      console.warn('Error clearing AsyncStorage on logout:', e);
    }
    setToken(null);
    setUser(null);
    setStats(null);
  };

  const isSeller = Boolean(user?.is_seller);
  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        stats,
        isLoading,
        isAuthenticated,
        isSeller,
        login,
        googleLogin,
        sendSignupOtp,
        verifySignupOtp,
        registerSeller,
        logout,
        refreshProfile: () => fetchProfile(token),
        refreshStats: () => fetchStats(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
