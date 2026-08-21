import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdAdd, MdEdit, MdDelete, MdWarning } from "react-icons/md";
import API from "../../services/api";
import styles from "./MyDesigns.module.css";

const MyDesigns = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setDesigns(res.data.designs || []);
    } catch (err) {
      console.error("Failed to fetch designs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (design) => {
    navigate(`/seller/upload?editId=${design._id}`);
  };

  const handleDelete = async (designId) => {
    if (!window.confirm("Are you sure you want to delete this design? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await API.delete(`/seller/design/${designId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("✓ Design deleted successfully!");
      fetchMyDesigns();
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: styles.statusPending, text: "Pending" },
      approved: { class: styles.statusApproved, text: "Approved" },
      rejected: { class: styles.statusRejected, text: "Rejected" },
    };
    const badge = badges[status] || badges.pending;
    return <span className={`${styles.statusBadge} ${badge.class}`}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className="container">
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading your designs...</p>
          </div>
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
            <p className={styles.subtitle}>
              {designs.length} uploaded design{designs.length !== 1 ? "s" : ""} in your portfolio
            </p>
          </div>
          <button 
            onClick={() => navigate("/seller/upload")} 
            className="btn-primary-custom"
            type="button"
          >
            <MdAdd size={18} /> Upload New Design
          </button>
        </div>

        {designs.length === 0 ? (
          <div className={`container-box ${styles.emptyState}`}>
            <div className={styles.emptyIcon}>📦</div>
            <h3>No designs yet</h3>
            <p>Upload your first embroidery design to start earning from sales</p>
            <Link to="/seller/upload" className="btn-primary-custom">
              <MdAdd size={18} /> Upload Design
            </Link>
          </div>
        ) : (
          <div className={styles.tableCard}>
            <div className={styles.tableResponsive}>
              <table className={styles.designsTable}>
                <thead>
                  <tr>
                    <th style={{ width: "35%" }}>Design Details</th>
                    <th style={{ width: "22%" }}>Category</th>
                    <th style={{ width: "15%" }}>Needles & Format</th>
                    <th style={{ width: "10%" }}>Price</th>
                    <th style={{ width: "10%" }}>Status</th>
                    <th style={{ width: "8%", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {designs.map((design) => (
                    <tr key={design._id} className={styles.tableRow}>
                      {/* Design Info & Image */}
                      <td>
                        <div className={styles.designCell}>
                          <img
                            src={design.thumbnail || "https://via.placeholder.com/100"}
                            alt={design.title}
                            className={styles.designThumb}
                            onContextMenu={(e) => e.preventDefault()}
                          />
                          <div className={styles.designCellText}>
                            <span className={styles.designName} title={design.title}>
                              {design.title}
                            </span>
                            {design.description && (
                              <span className={styles.designDescText}>
                                {design.description}
                              </span>
                            )}
                            {design.admin_queries && design.admin_queries.length > 0 && (
                              <span className={styles.adminQueryTag}>
                                <MdWarning size={12} /> Query: {design.admin_queries[design.admin_queries.length - 1].message}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category & Subcategory */}
                      <td>
                        <div className={styles.categoryCell}>
                          <span className={styles.mainCategory}>{design.category}</span>
                          {design.subcategory && (
                            <span className={styles.subCategoryBadge}>
                              {design.subcategory}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Needles & Format */}
                      <td>
                        <span className={styles.specBadge}>
                          {design.needles || 1}N • {(design.file_format || "EMB").toUpperCase()}
                        </span>
                      </td>

                      {/* Price */}
                      <td>
                        <span className={styles.priceTag}>
                          ₹{Number(design.price || 0).toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        {getStatusBadge(design.status)}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ textAlign: "right" }}>
                        <div className={styles.actionButtons}>
                          <button
                            type="button"
                            className={styles.editBtn}
                            onClick={() => handleEdit(design)}
                            title="Edit this design"
                          >
                            <MdEdit size={16} />
                          </button>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(design._id)}
                            title="Delete design"
                          >
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDesigns;
