import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import AdminLayout from "../../components/Admin/AdminLayout";
import AdminDesigns from "../../components/Admin/AdminDesigns";

const AdminDesignsPage = () => {
  const BASE_URL = API.defaults.baseURL;
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

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
        <p>Loading designs...</p>
      </div>
    );
  }

  return (
    <AdminLayout
      activeSection="designs"
      stats={stats}
      onLogout={handleLogout}
    >
      <AdminDesigns
        designs={designs}
        BASE_URL={BASE_URL}
      />
    </AdminLayout>
  );
};

export default AdminDesignsPage;
