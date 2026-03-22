import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import AdminLayout from "../../components/Admin/AdminLayout";
import AdminUsers from "../../components/Admin/AdminUsers";

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [usersRes, statsRes] = await Promise.all([
        API.get("/admin/users", { headers }),
        API.get("/admin/stats", { headers }),
      ]);

      setUsers(usersRes.data.users);
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
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <AdminLayout
      activeSection="users"
      stats={stats}
      onLogout={handleLogout}
    >
      <AdminUsers users={users} />
    </AdminLayout>
  );
};

export default AdminUsersPage;
