import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import AdminLayout from "../../components/Admin/AdminLayout";
import AdminReviewQueue from "../../components/Admin/AdminReviewQueue";

const AdminReviewPage = () => {
  const BASE_URL = API.defaults.baseURL;
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [designsRes, statsRes] = await Promise.all([
        API.get("/admin/designs", { headers }),
        API.get("/admin/stats", { headers }),
      ]);

      setDesigns(designsRes.data.designs);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
      alert("Failed to load data. Please ensure you're logged in as admin.");
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
      fetchData();
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
      fetchData();
      setSelectedDesign(null);
    } catch (err) {
      alert(err.response?.data?.error || "Rejection failed");
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
      fetchData();
      setSelectedDesign(null);
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed");
    }
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
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add query");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
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
        <p>Loading review queue...</p>
      </div>
    );
  }

  return (
    <AdminLayout
      activeSection="review"
      stats={stats}
      onLogout={handleLogout}
    >
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
    </AdminLayout>
  );
};

export default AdminReviewPage;
