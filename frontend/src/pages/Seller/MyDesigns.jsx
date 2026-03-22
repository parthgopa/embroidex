import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import styles from "./MyDesigns.module.css";


const MyDesigns = () => {
  const BASE_URL = API.defaults.baseURL;
  // console.log(BASE_URL);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDesign, setEditingDesign] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
  });

  useEffect(() => {
    fetchMyDesigns();
  }, []);

  const fetchMyDesigns = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/seller/my-designs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log(res.data.designs[0].thumbnail_path);
      setDesigns(res.data.designs);
    } catch (err) {
      console.error("Failed to fetch designs", err);
      alert("Failed to load designs");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (design) => {
    setEditingDesign(design);
    setEditForm({
      title: design.title,
      description: design.description,
      price: design.price,
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      await API.put(`/seller/design/${editingDesign._id}`, editForm, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Design updated successfully!");
      setEditingDesign(null);
      fetchMyDesigns();
    } catch (err) {
      alert(err.response?.data?.error || "Update failed");
    }
  };

  const handleDelete = async (designId) => {
    if (!window.confirm("Are you sure you want to delete this design?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await API.delete(`/seller/design/${designId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Design deleted successfully!");
      fetchMyDesigns();
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed");
    }
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="container">
          <div className={styles.loading}>Loading your designs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>My Designs</h1>
            <p className={styles.subtitle}>Manage your uploaded embroidery designs</p>
          </div>
          <button onClick={() => window.location.href = "/seller/upload"} className="btn-primary-custom">
            + Upload New Design
          </button>
        </div>

        {designs.length === 0 ? (
          <div className={`container-box ${styles.emptyState}`}>
            <div className={styles.emptyIcon}>📦</div>
            <h3>No designs yet</h3>
            <p>Upload your first embroidery design to get started</p>
            <Link to="/seller/upload" className="btn-primary-custom">
              Upload Design
            </Link>
          </div>
        ) : (
          <div className={styles.designsGrid}>
            {designs.map((design) => (
              <div key={design._id} className={`card-custom ${styles.designCard}`}>
                <div className={styles.cardImage}>
                  <img
                    src={`${BASE_URL}/${design.thumbnail_path}`}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/300x200";
                      console.log("Image failed to load:", `${BASE_URL}/${design.thumbnail_path}`);
                    }}
                    alt={design.title}
                  />
                  <div className={styles.statusBadge}>
                    {getStatusBadge(design.status)}
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.designTitle}>{design.title}</h3>
                  <p className={styles.designDesc}>{design.description}</p>

                  <div className={styles.designMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Category:</span>
                      <span className={styles.metaValue}>{design.category}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Subcategory:</span>
                      <span className={styles.metaValue}>{design.subcategory}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Stitches:</span>
                      <span className={styles.metaValue}>
                        {design.total_stitch_count?.toLocaleString() || "N/A"}
                      </span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Files:</span>
                      <span className={styles.metaValue}>
                        {design.file_names?.length || 0}
                      </span>
                    </div>
                  </div>

                  <div className={styles.priceRow}>
                    <span className={styles.price}>₹{design.price}</span>
                  </div>

                  {/* Admin Queries Alert */}
                  {design.admin_queries && design.admin_queries.length > 0 && (
                    <div className={styles.queriesAlert}>
                      <strong>⚠️ Admin Query ({design.admin_queries.length})</strong>
                      <p>{design.admin_queries[design.admin_queries.length - 1].message}</p>
                    </div>
                  )}

                  <div className={styles.cardActions}>
                    <button
                      className="btn-outline-custom"
                      onClick={() => handleEdit(design)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-danger-custom"
                      onClick={() => handleDelete(design._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingDesign && (
          <div className={styles.modal}>
            <div className={styles.modalOverlay} onClick={() => setEditingDesign(null)}></div>
            <div className={`container-box ${styles.modalContent}`}>
              <h2 className={styles.modalTitle}>Edit Design</h2>

              <form onSubmit={handleUpdateSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Title</label>
                  <input
                    type="text"
                    name="title"
                    className="input-custom"
                    value={editForm.title}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Description</label>
                  <textarea
                    name="description"
                    className={`input-custom ${styles.textarea}`}
                    value={editForm.description}
                    onChange={handleEditChange}
                    rows={4}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    className="input-custom"
                    value={editForm.price}
                    onChange={handleEditChange}
                    min="1"
                    required
                  />
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className="btn-outline-custom"
                    onClick={() => setEditingDesign(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary-custom">
                    Update Design
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDesigns;
