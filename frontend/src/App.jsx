import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import DashboardLayout from "./components/DashboardLayout";
import SellerProtectedRoute from "./components/SellerProtectedRoute";
import ChatbotWidget from "./components/ChatbotWidget";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import DesignDetails from "./pages/DesignDetails";
import Cart from "./pages/Cart";
import Purchase from "./pages/Purchase";
import MyPurchases from "./pages/MyPurchases";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SellerRegister from "./pages/SellerRegister";
import SelUploadV3 from "./pages/Seller/SelUploadV3";
import MyDesigns from "./pages/Seller/MyDesigns";
import Profile from "./pages/Profile";
import PaymentSettings from "./components/Seller/PaymentSettings";
import WithdrawalRequest from "./components/Seller/WithdrawalRequest";

import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminSignup from "./pages/Admin/AdminSignup";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ChatbotWidget />
      <Routes>
        {/* Full-Page Storefront Routes (Top Navbar, Full Width) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/design/:designId" element={<DesignDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Unified Dashboard Routes (Left Sidebar Navigation + Top Header) */}
        <Route element={<DashboardLayout />}>
          <Route path="/my-purchases" element={<MyPurchases />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/purchase/:designId" element={<Purchase />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/seller/register" element={<SellerRegister />} />
          
          {/* Protected Seller Dashboard Routes */}
          <Route path="/seller/upload" element={<SellerProtectedRoute><SelUploadV3 /></SellerProtectedRoute>} />
          <Route path="/seller/my-designs" element={<SellerProtectedRoute><MyDesigns /></SellerProtectedRoute>} />
          <Route path="/seller/earnings" element={<SellerProtectedRoute><WithdrawalRequest /></SellerProtectedRoute>} />
          <Route path="/seller/payment-settings" element={<SellerProtectedRoute><PaymentSettings /></SellerProtectedRoute>} />
          <Route path="/seller/withdraw" element={<SellerProtectedRoute><WithdrawalRequest /></SellerProtectedRoute>} />
        </Route>

        {/* Admin Routes (Dedicated AdminLayout) */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/designs" element={<AdminDashboard />} />
        <Route path="/admin/review" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminDashboard />} />
        <Route path="/admin/settings" element={<AdminDashboard />} />
        <Route path="/admin/withdrawals" element={<AdminDashboard />} />
        <Route path="/admin/withdrawal-history" element={<AdminDashboard />} />
        <Route path="/admin/homepage-config" element={<AdminDashboard />} />
        <Route path="/admin/platform-categories" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;