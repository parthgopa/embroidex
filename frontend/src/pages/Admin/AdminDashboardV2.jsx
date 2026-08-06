import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MdDashboard, 
  MdDesignServices, 
  MdCheckCircle, 
  MdPeople, 
  MdLogout,
  MdBarChart,
  MdHourglassEmpty,
  MdCancel,
  MdStorefront
} from "react-icons/md";
import API from "../../services/api";
import AdminHomepageConfig from "./AdminHomepageConfig";
import AdminPlatformCategories from "./AdminPlatformCategories";
import styles from "./AdminDashboardV2.module.css";

const AdminDashboardV2 = () => {
  const BASE_URL = API.defaults.baseURL;

  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
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
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
    navigate("/admin");
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: "tag-pending", text: "Pending" },
      approved: { class: "tag-approved", text: "Approved" },
      rejected: { class: "tag-rejected", text: "Rejected" },
    };
    const badge = badges[status] || badges.pending;
    return <span className={`tag ${badge.class}`}>{badge.text}</span>;
  };

  const filteredDesigns = designs.filter((design) => {
    const matchesStatus = filterStatus === "all" || design.status === filterStatus;
    const matchesSearch =
      design.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      design.seller_email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Admin Panel</h2>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.navItem} ${activeSection === "dashboard" ? styles.navItemActive : ""}`}
            onClick={() => setActiveSection("dashboard")}
          >
            <MdDashboard className={styles.navIcon} />
            Dashboard
          </button>

          <button
            className={`${styles.navItem} ${activeSection === "designs" ? styles.navItemActive : ""}`}
            onClick={() => setActiveSection("designs")}
          >
            <MdDesignServices className={styles.navIcon} />
            Designs
            {stats.pendingDesigns > 0 && (
              <span className={styles.badge}>{stats.pendingDesigns}</span>
            )}
          </button>

          <button
            className={`${styles.navItem} ${activeSection === "review" ? styles.navItemActive : ""}`}
            onClick={() => setActiveSection("review")}
          >
            <MdCheckCircle className={styles.navIcon} />
            Review Queue
            {stats.pendingDesigns > 0 && (
              <span className={styles.badge}>{stats.pendingDesigns}</span>
            )}
          </button>

          <button
            className={`${styles.navItem} ${activeSection === "users" ? styles.navItemActive : ""}`}
            onClick={() => setActiveSection("users")}
          >
            <MdPeople className={styles.navIcon} />
            Users
          </button>

          <button
            className={`${styles.navItem} ${activeSection === "homepage" ? styles.navItemActive : ""}`}
            onClick={() => setActiveSection("homepage")}
          >
            <MdDashboard className={styles.navIcon} />
            Homepage Config
          </button>

          <button
            className={`${styles.navItem} ${activeSection === "platform-categories" ? styles.navItemActive : ""}`}
            onClick={() => setActiveSection("platform-categories")}
          >
            <MdDesignServices className={styles.navIcon} />
            Platform Categories
          </button>

          <button className={styles.navItem} onClick={handleLogout}>
            <MdLogout className={styles.navIcon} />
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Dashboard Section */}
        {activeSection === "dashboard" && (
          <div className={styles.section}>
            <h1 className={styles.pageTitle}>Dashboard Overview</h1>

            <div className={styles.statsGrid}>
              <div className={`container-box ${styles.statCard}`}>
                <MdBarChart className={styles.statIcon} />
                <div className={styles.statValue}>{stats.totalDesigns}</div>
                <div className={styles.statLabel}>Total Designs</div>
              </div>

              <div className={`container-box ${styles.statCard} ${styles.statPending}`}>
                <MdHourglassEmpty className={styles.statIcon} />
                <div className={styles.statValue}>{stats.pendingDesigns}</div>
                <div className={styles.statLabel}>Pending Approval</div>
              </div>

              <div className={`container-box ${styles.statCard} ${styles.statApproved}`}>
                <MdCheckCircle className={styles.statIcon} />
                <div className={styles.statValue}>{stats.approvedDesigns}</div>
                <div className={styles.statLabel}>Approved</div>
              </div>

              <div className={`container-box ${styles.statCard} ${styles.statRejected}`}>
                <MdCancel className={styles.statIcon} />
                <div className={styles.statValue}>{stats.rejectedDesigns}</div>
                <div className={styles.statLabel}>Rejected</div>
              </div>

              <div className={`container-box ${styles.statCard}`}>
                <MdPeople className={styles.statIcon} />
                <div className={styles.statValue}>{stats.totalUsers}</div>
                <div className={styles.statLabel}>Total Users</div>
              </div>

              <div className={`container-box ${styles.statCard}`}>
                <MdStorefront className={styles.statIcon} />
                <div className={styles.statValue}>{stats.totalSellers}</div>
                <div className={styles.statLabel}>Sellers</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className={`container-box ${styles.activityBox}`}>
              <h3>Recent Pending Designs</h3>
              <div className={styles.activityList}>
                {designs
                  .filter((d) => d.status === "pending")
                  .slice(0, 5)
                  .map((design) => (
                    <div key={design._id} className={styles.activityItem}>
                      <img
                        src={design.thumbnail || (design.thumbnail_path ? `${BASE_URL}/${design.thumbnail_path}` : "https://via.placeholder.com/150")}
                        alt={design.title}
                        className={styles.activityThumb}
                      />
                      <div className={styles.activityInfo}>
                        <strong>{design.title}</strong>
                        <small>by {design.seller_email}</small>
                      </div>
                      <button
                        className="btn-primary-custom"
                        onClick={() => {
                          setSelectedDesign(design);
                          setActiveSection("review");
                        }}
                      >
                        Review
                      </button>
                    </div>
                  ))}
                {designs.filter((d) => d.status === "pending").length === 0 && (
                  <p className={styles.emptyText}>No pending designs</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Designs Section */}
        {activeSection === "designs" && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h1 className={styles.pageTitle}>All Designs</h1>
              <div className={styles.filters}>
                <input
                  type="text"
                  placeholder="Search designs..."
                  className="input-custom"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select
                  className="input-custom"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className={styles.designsGrid}>
              {filteredDesigns.map((design) => (
                <div key={design._id} className={`card-custom ${styles.designCard}`}>
                  <div className={styles.cardImage}>
                    <img
                      src={`${BASE_URL}/${design.thumbnail_path}`}
                      alt={design.title}
                      onError={(e) => {
                        console.log("Image failed to load:", `${BASE_URL}/${design.thumbnail_path}`);
                      }}
                    />
                    <div className={styles.statusBadge}>{getStatusBadge(design.status)}</div>
                  </div>

                  <div className={styles.cardBody}>
                    <h3 className={styles.designTitle}>{design.title}</h3>
                    <p className={styles.designSeller}>by {design.seller_email}</p>
                    <p className={styles.designPrice}>₹{design.price}</p>

                    <button
                      className="btn-outline-custom"
                      onClick={() => setSelectedDesign(design)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredDesigns.length === 0 && (
              <div className={styles.emptyState}>
                <p>No designs found</p>
              </div>
            )}
          </div>
        )}

        {/* Review Queue Section */}
        {activeSection === "review" && (
          <div className={styles.section}>
            <h1 className={styles.pageTitle}>Review Queue</h1>

            {selectedDesign ? (
              <div className={`container-box ${styles.reviewBox}`}>
                <button
                  className="btn-outline-custom"
                  onClick={() => setSelectedDesign(null)}
                >
                  ← Back to Queue
                </button>

                <div className={styles.reviewContent}>
                  <img
                    src={`${BASE_URL}/${selectedDesign.thumbnail_path}`}
                    alt={selectedDesign.title}
                    className={styles.reviewImage}
                    onError={(e) => {
                      console.log("Image failed to load:", `${BASE_URL}/${selectedDesign.thumbnail_path}`);
                    }}
                  />

                  <div className={styles.reviewDetails}>
                    <h2>{selectedDesign.title}</h2>
                    {getStatusBadge(selectedDesign.status)}

                    <div className={styles.detailsGrid}>
                      <div className={styles.detailItem}>
                        <strong>Seller:</strong> {selectedDesign.seller_email}
                      </div>
                      <div className={styles.detailItem}>
                        <strong>Price:</strong> ₹{selectedDesign.price}
                      </div>
                      <div className={styles.detailItem}>
                        <strong>Category:</strong> {selectedDesign.category}
                      </div>
                      <div className={styles.detailItem}>
                        <strong>Subcategory:</strong> {selectedDesign.subcategory}
                      </div>
                      <div className={styles.detailItem}>
                        <strong>Total Stitches:</strong>{" "}
                        {selectedDesign.total_stitch_count?.toLocaleString() || "N/A"}
                      </div>
                      <div className={styles.detailItem}>
                        <strong>Files:</strong> {selectedDesign.file_names?.length || 0}
                      </div>
                    </div>

                    <div className={styles.detailItem}>
                      <strong>Description:</strong>
                      <p>{selectedDesign.description}</p>
                    </div>

                    {selectedDesign.status === "pending" && (
                      <div className={styles.reviewActions}>
                        <button
                          className="btn-primary-custom"
                          onClick={() => handleApproveDesign(selectedDesign._id)}
                        >
                          <MdCheckCircle style={{ marginRight: '8px' }} />
                          Approve Design
                        </button>
                        <button
                          className="btn-danger-custom"
                          onClick={() => handleRejectDesign(selectedDesign._id)}
                        >
                          <MdCancel style={{ marginRight: '8px' }} />
                          Reject Design
                        </button>
                      </div>
                    )}

                    <button
                      className="btn-danger-custom"
                      onClick={() => handleDeleteDesign(selectedDesign._id)}
                    >
                      Delete Design
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.queueList}>
                {designs
                  .filter((d) => d.status === "pending")
                  .map((design) => (
                    <div key={design._id} className={`container-box ${styles.queueItem}`}>
                      <img
                        src={`${BASE_URL}/${design.thumbnail_path}`}
                        alt={design.title}
                        className={styles.queueThumb}
                      />
                      <div className={styles.queueInfo}>
                        <h3>{design.title}</h3>
                        <p>by {design.seller_email}</p>
                        <p className={styles.queuePrice}>₹{design.price}</p>
                      </div>
                      <button
                        className="btn-primary-custom"
                        onClick={() => setSelectedDesign(design)}
                      >
                        Review Now
                      </button>
                    </div>
                  ))}

                {designs.filter((d) => d.status === "pending").length === 0 && (
                  <div className={styles.emptyState}>
                    <p><MdCheckCircle style={{ marginRight: '8px', verticalAlign: 'middle' }} /> No pending designs to review</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Users Section */}
        {activeSection === "users" && (
          <div className={styles.section}>
            <h1 className={styles.pageTitle}>Users Management</h1>

            <div className={`container-box ${styles.tableContainer}`}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Seller Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <strong>{user.name}</strong>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className="tag tag-approved">{user.role || "buyer"}</span>
                      </td>
                      <td>
                        {user.is_seller ? (
                          <span className="tag tag-approved">Seller</span>
                        ) : (
                          <span className="tag tag-pending">Buyer Only</span>
                        )}
                      </td>
                      <td>{new Date(user.created_at || Date.now()).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Homepage Config Section */}
        {activeSection === "homepage" && <AdminHomepageConfig />}

        {/* Platform Categories Section */}
        {activeSection === "platform-categories" && <AdminPlatformCategories />}
      </main>
    </div>
  );
};

export default AdminDashboardV2;
