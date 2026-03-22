import { useState } from "react";
import styles from "./AdminDesigns.module.css";

const AdminDesigns = ({ designs, onDesignClick, BASE_URL }) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDesign, setSelectedDesign] = useState(null);

  const handleViewDetails = (design) => {
    setSelectedDesign(design);
    if (onDesignClick) onDesignClick(design);
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

  return (
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
                onClick={() => handleViewDetails(design)}
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

      {/* Design Details Modal */}
      {selectedDesign && (
        <div className={styles.modal} onClick={() => setSelectedDesign(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Design Details</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setSelectedDesign(null)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.designPreview}>
                <img
                  src={`${BASE_URL}/${selectedDesign.thumbnail_path}`}
                  alt={selectedDesign.title}
                  className={styles.previewImage}
                />
              </div>

              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Title:</span>
                  <span className={styles.detailValue}>{selectedDesign.title}</span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Price:</span>
                  <span className={styles.detailValue}>₹{selectedDesign.price}</span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Category:</span>
                  <span className={styles.detailValue}>{selectedDesign.category}</span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Subcategory:</span>
                  <span className={styles.detailValue}>{selectedDesign.subcategory}</span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Status:</span>
                  <span className={styles.detailValue}>{getStatusBadge(selectedDesign.status)}</span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Seller:</span>
                  <span className={styles.detailValue}>{selectedDesign.seller_email}</span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Stitch Count:</span>
                  <span className={styles.detailValue}>{selectedDesign.total_stitch_count?.toLocaleString()}</span>
                </div>

                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Files:</span>
                  <span className={styles.detailValue}>{selectedDesign.file_names?.length || 0} file(s)</span>
                </div>
              </div>

              <div className={styles.descriptionSection}>
                <h3>Description</h3>
                <p>{selectedDesign.description}</p>
              </div>

              {selectedDesign.file_names && selectedDesign.file_names.length > 0 && (
                <div className={styles.filesSection}>
                  <h3>Files Included</h3>
                  <ul className={styles.filesList}>
                    {selectedDesign.file_names.map((file, idx) => (
                      <li key={idx}>{file}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedDesign.additional_images && selectedDesign.additional_images.length > 0 && (
                <div className={styles.additionalImages}>
                  <h3>Additional Images</h3>
                  <div className={styles.imagesGrid}>
                    {selectedDesign.additional_images.map((img, idx) => (
                      <img
                        key={idx}
                        src={`${BASE_URL}/${img}`}
                        alt={`Additional ${idx + 1}`}
                        className={styles.additionalImage}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDesigns;
