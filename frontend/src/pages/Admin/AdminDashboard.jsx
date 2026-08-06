import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../../services/api";
import AdminLayout from "../../components/Admin/AdminLayout";
import AdminDashboardOverview from "../../components/Admin/AdminDashboardOverview";
import AdminDesigns from "../../components/Admin/AdminDesigns";
import AdminReviewQueue from "../../components/Admin/AdminReviewQueue";
import AdminUsers from "../../components/Admin/AdminUsers";
import AdminSettings from "../../components/Admin/AdminSettings";
import AdminWithdrawals from "../../components/Admin/AdminWithdrawals";
import AdminWithdrawalHistory from "../../components/Admin/AdminWithdrawalHistory";
import AdminHomepageConfig from "./AdminHomepageConfig";
import AdminPlatformCategories from "./AdminPlatformCategories";

const AdminDashboard = () => {
  const BASE_URL = API.defaults.baseURL;
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active section from URL path
  const getActiveSectionFromPath = () => {
    const path = location.pathname;
    if (path === "/admin/designs") return "designs";
    if (path === "/admin/review") return "review";
    if (path === "/admin/users") return "users";
    if (path === "/admin/settings") return "settings";
    if (path === "/admin/withdrawals") return "withdrawals";
    if (path === "/admin/withdrawal-history") return "withdrawal-history";
    if (path === "/admin/homepage-config") return "homepage-config";
    if (path === "/admin/platform-categories") return "platform-categories";
    return "dashboard";
  };

  const [activeSection, setActiveSection] = useState(getActiveSectionFromPath());
  const [designs, setDesigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalDesigns: 0,
    pendingDesigns: 0,
    approvedDesigns: 0,
    rejectedDesigns: 0,
    totalUsers: 0,
    totalSellers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update active section when URL changes
  useEffect(() => {
    setActiveSection(getActiveSectionFromPath());
  }, [location.pathname]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [designsRes, usersRes, statsRes] = await Promise.all([
        API.get("/admin/designs", { headers }),
        API.get("/admin/users", { headers }),
        API.get("/admin/stats", { headers }),
      ]);

      setDesigns(designsRes.data.designs);
      setUsers(usersRes.data.users);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      alert("Failed to load dashboard. Please ensure you're logged in as admin.");
      navigate("/admin");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDesign = async (designId) => {
    try {
      const token = localStorage.getItem("token");
      await API.put(
        `/admin/design/${designId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Design approved successfully!");
      fetchDashboardData();
      setSelectedDesign(null);
    } catch (err) {
      alert(err.response?.data?.error || "Approval failed");
    }
  };

  const handleRejectDesign = async (designId) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      const token = localStorage.getItem("token");
      await API.put(
        `/admin/design/${designId}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Design rejected successfully!");
      fetchDashboardData();
      setSelectedDesign(null);
    } catch (err) {
      alert(err.response?.data?.error || "Rejection failed");
    }
  };

  const handleUnapproveDesign = async (designId) => {
    if (!window.confirm("Revert this design back to pending review?")) return;
    try {
      const token = localStorage.getItem("token");
      await API.put(`/admin/design/${designId}/unapprove`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to unapprove design");
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm("Deactivate this user account?")) return;
    try {
      const token = localStorage.getItem("token");
      await API.put(`/admin/user/${userId}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to deactivate user");
    }
  };

  const handleReactivateUser = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await API.put(`/admin/user/${userId}/reactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to reactivate user");
    }
  };

  const handleDeleteDesign = async (designId) => {
    if (!window.confirm("Are you sure you want to delete this design?")) return;

    try {
      const token = localStorage.getItem("token");
      await API.delete(`/admin/design/${designId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Design deleted successfully!");
      fetchDashboardData();
      setSelectedDesign(null);
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleReviewClick = (design) => {
    setSelectedDesign(design);
    setActiveSection("review");
  };

  const handleAddQuery = async (designId, queryMessage) => {
    try {
      const token = localStorage.getItem("token");
      await API.post(
        `/admin/design/${designId}/query`,
        { message: queryMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Query added successfully!");
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add query");
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <AdminLayout
      stats={stats}
      onLogout={handleLogout}
    >
      {activeSection === "dashboard" && (
        <AdminDashboardOverview
          stats={stats}
          designs={designs}
          onReviewClick={handleReviewClick}
          BASE_URL={BASE_URL}
        />
      )}

      {activeSection === "designs" && (
        <AdminDesigns
          designs={designs}
          onApprove={handleApproveDesign}
          onReject={handleRejectDesign}
          onUnapprove={handleUnapproveDesign}
          onDelete={handleDeleteDesign}
          BASE_URL={BASE_URL}
        />
      )}

      {activeSection === "review" && (
        <AdminReviewQueue
          designs={designs}
          selectedDesign={selectedDesign}
          onDesignSelect={setSelectedDesign}
          onApprove={handleApproveDesign}
          onReject={handleRejectDesign}
          onDelete={handleDeleteDesign}
          onAddQuery={handleAddQuery}
          BASE_URL={BASE_URL}
        />
      )}

      {activeSection === "users" && (
        <AdminUsers
          users={users}
          onDeactivate={handleDeactivateUser}
          onReactivate={handleReactivateUser}
        />
      )}

      {activeSection === "settings" && (
        <AdminSettings />
      )}

      {activeSection === "withdrawals" && (
        <AdminWithdrawals />
      )}

      {activeSection === "withdrawal-history" && (
        <AdminWithdrawalHistory />
      )}

      {activeSection === "homepage-config" && <AdminHomepageConfig />}

      {activeSection === "platform-categories" && <AdminPlatformCategories />}
    </AdminLayout>
  );
};

export default AdminDashboard;
