import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import SellerProtectedRoute from "./components/SellerProtectedRoute";
import ChatbotWidget from "./components/ChatbotWidget";
import ScrollToTop from "./components/ScrollToTop";

import Home from "./pages/Home";
import Explore from "./pages/Explore";
import DesignDetails from "./pages/DesignDetails";
import Purchase from "./pages/Purchase";
import MyPurchases from "./pages/MyPurchases";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SellerRegister from "./pages/SellerRegister";
import SelUploadV3 from "./pages/Seller/SelUploadV3";
import MyDesigns from "./pages/Seller/MyDesigns";
// import SellerEarnings from "./pages/Seller/SellerEarnings"; // Replaced with WithdrawalRequest
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminSignup from "./pages/Admin/AdminSignup";
import Profile from "./pages/Profile";
import PaymentSettings from "./components/Seller/PaymentSettings";
import WithdrawalRequest from "./components/Seller/WithdrawalRequest";
import AdminWithdrawals from "./components/Admin/AdminWithdrawals";


function App() {
  return (
    <Router>
      <ScrollToTop />
      <ChatbotWidget />
      <Routes>
        {/* Public and User Routes with Main Layout */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/explore" element={<Layout><Explore /></Layout>} />
        <Route path="/design/:designId" element={<Layout><DesignDetails /></Layout>} />
        <Route path="/purchase/:designId" element={<Layout><Purchase /></Layout>} />
        <Route path="/my-purchases" element={<Layout><MyPurchases /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
        <Route path="/login" element={<Layout><Login /></Layout>} />
        <Route path="/signup" element={<Layout><Signup /></Layout>} />
        <Route path="/seller/register" element={<Layout><SellerRegister /></Layout>} />
        
        {/* Protected Seller Routes - Only accessible by sellers */}
        <Route path="/seller/upload" element={<Layout><SellerProtectedRoute><SelUploadV3 /></SellerProtectedRoute></Layout>} />
        <Route path="/seller/my-designs" element={<Layout><SellerProtectedRoute><MyDesigns /></SellerProtectedRoute></Layout>} />
        <Route path="/seller/earnings" element={<Layout><SellerProtectedRoute><WithdrawalRequest /></SellerProtectedRoute></Layout>} />
        <Route path="/seller/payment-settings" element={<Layout><SellerProtectedRoute><PaymentSettings /></SellerProtectedRoute></Layout>} />
        <Route path="/seller/withdraw" element={<Layout><SellerProtectedRoute><WithdrawalRequest /></SellerProtectedRoute></Layout>} />


        {/* Admin Routes without Main Layout (each has AdminLayout) */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/designs" element={<AdminDashboard />} />
        <Route path="/admin/review" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminDashboard />} />
        <Route path="/admin/settings" element={<AdminDashboard />} />
        <Route path="/admin/withdrawals" element={<AdminDashboard />} />
        <Route path="/admin/withdrawal-history" element={<AdminDashboard />} />

      </Routes>
    </Router>
  );
}

export default App;