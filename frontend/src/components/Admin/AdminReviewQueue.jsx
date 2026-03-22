import { useState } from "react";
import { 
  MdCheckCircle, 
  MdCancel, 
  MdClose, 
  MdDownload, 
  MdImage,
  MdDescription,
  MdColorLens,
  MdStraighten,
  MdGridOn
} from "react-icons/md";
import styles from "./AdminReviewQueue.module.css";

const AdminReviewQueue = ({ 
  designs, 
  selectedDesign, 
  onDesignSelect, 
  onApprove, 
  onReject, 
  onDelete,
  onAddQuery,
  BASE_URL 
}) => {
  const pendingDesigns = designs.filter((d) => d.status === "pending");
  const [queryText, setQueryText] = useState("");
  const [showQueryForm, setShowQueryForm] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleAddQuery = async () => {
    if (!queryText.trim()) {
      alert("Please enter a query message");
      return;
    }
    
    await onAddQuery(selectedDesign._id, queryText);
    setQueryText("");
    setShowQueryForm(false);
    window.location.reload();
  };

  const handleDownloadZip = () => {
    if (selectedDesign?.design_file_path) {
      const downloadUrl = `${BASE_URL}/${selectedDesign.design_file_path}`;
      window.open(downloadUrl, '_blank');
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

  const allImages = selectedDesign ? [
    selectedDesign.thumbnail_path,
    ...(selectedDesign.additional_images || [])
  ] : [];

  return (
    <div className={styles.section}>
      <h1 className={styles.pageTitle}>Review Queue</h1>

      {selectedDesign ? (
        <div className={`container-box ${styles.reviewBox}`}>
          <button
            className="btn-outline-custom"
            onClick={() => onDesignSelect(null)}
          >
            ← Back to Queue
          </button>

          <div className={styles.reviewContent}>
            {/* Image Gallery */}
            <div className={styles.imageGallery}>
              <div className={styles.mainImageContainer}>
                <img
                  src={`${BASE_URL}/${allImages[selectedImageIndex]}`}
                  alt={selectedDesign.title}
                  className={styles.reviewImage}
                  onError={(e) => {
                    console.log("Image failed to load:", `${BASE_URL}/${allImages[selectedImageIndex]}`);
                  }}
                />
                <div className={styles.imageCounter}>
                  {selectedImageIndex + 1} / {allImages.length}
                </div>
              </div>
              
              {allImages.length > 1 && (
                <div className={styles.thumbnailStrip}>
                  {allImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={`${BASE_URL}/${img}`}
                      alt={`Preview ${idx + 1}`}
                      className={`${styles.thumbnailImage} ${selectedImageIndex === idx ? styles.activeThumbnail : ''}`}
                      onClick={() => setSelectedImageIndex(idx)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className={styles.reviewDetails}>
              <div className={styles.headerSection}>
                <div>
                  <h2>{selectedDesign.title}</h2>
                  {getStatusBadge(selectedDesign.status)}
                </div>
                <button
                  className="btn-outline-custom"
                  onClick={handleDownloadZip}
                >
                  <MdDownload style={{ marginRight: '8px' }} />
                  Download ZIP
                </button>
              </div>

              {/* Basic Info */}
              <div className={styles.infoSection}>
                <h3><MdDescription style={{ marginRight: '8px', verticalAlign: 'middle' }} />Basic Information</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <strong>Seller:</strong> {selectedDesign.seller_email}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Price:</strong> ₹{selectedDesign.price?.toLocaleString()}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Category:</strong> {selectedDesign.category}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Subcategory:</strong> {selectedDesign.subcategory}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Design ID:</strong> {selectedDesign.design_id}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Total Files:</strong> {selectedDesign.extracted_files_count || selectedDesign.file_names?.length || 0}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className={styles.infoSection}>
                <h3>Description</h3>
                <p className={styles.descriptionText}>{selectedDesign.description}</p>
              </div>

              {/* EMB Files Metadata */}
              {selectedDesign.emb_metadata && selectedDesign.emb_metadata.length > 0 && (
                <div className={styles.infoSection}>
                  <h3><MdGridOn style={{ marginRight: '8px', verticalAlign: 'middle' }} />EMB Files Details</h3>
                  <div className={styles.embFilesGrid}>
                    {selectedDesign.emb_metadata.map((emb, idx) => (
                      <div key={idx} className={styles.embCard}>
                        <h4>{emb.file_name}</h4>
                        <div className={styles.embDetails}>
                          <div className={styles.embDetailItem}>
                            <MdGridOn />
                            <span>{emb.stitch_count?.toLocaleString()} stitches</span>
                          </div>
                          <div className={styles.embDetailItem}>
                            <MdColorLens />
                            <span>{emb.color_count} colors</span>
                          </div>
                          <div className={styles.embDetailItem}>
                            <MdStraighten />
                            <span>{emb.width_mm} × {emb.height_mm} mm</span>
                          </div>
                          <div className={styles.embDetailItem}>
                            <MdDescription />
                            <span>{(emb.file_size / 1024).toFixed(2)} KB</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.totalStitches}>
                    <strong>Total Stitches (All Files):</strong> {selectedDesign.total_stitch_count?.toLocaleString()}
                  </div>
                </div>
              )}

              {/* File Names List */}
              <div className={styles.infoSection}>
                <h3>Extracted Files ({selectedDesign.file_names?.length || 0})</h3>
                <div className={styles.filesList}>
                  {selectedDesign.file_names?.map((fileName, idx) => (
                    <div key={idx} className={styles.fileName}>
                      <MdDescription style={{ marginRight: '8px' }} />
                      {fileName}
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Queries Section */}
              <div className={styles.infoSection}>
                <h3>Admin Queries & Notes</h3>
                {selectedDesign.admin_queries && selectedDesign.admin_queries.length > 0 ? (
                  <div className={styles.queriesList}>
                    {selectedDesign.admin_queries.map((query, idx) => (
                      <div key={idx} className={styles.queryItem}>
                        <div className={styles.queryHeader}>
                          <strong>Query #{idx + 1}</strong>
                          <span className={styles.queryDate}>
                            {new Date(query.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={styles.queryText}>{query.message}</p>
                        {query.seller_response && (
                          <div className={styles.sellerResponse}>
                            <strong>Seller Response:</strong>
                            <p>{query.seller_response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noQueries}>No queries raised yet</p>
                )}
                
                {!showQueryForm ? (
                  <button
                    className="btn-outline-custom"
                    onClick={() => setShowQueryForm(true)}
                  >
                    Add Query/Note
                  </button>
                ) : (
                  <div className={styles.queryForm}>
                    <textarea
                      className="input-custom"
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      placeholder="Enter your query or note for the seller..."
                      rows={4}
                    />
                    <div className={styles.queryFormActions}>
                      <button
                        className="btn-primary-custom"
                        onClick={handleAddQuery}
                      >
                        Submit Query
                      </button>
                      <button
                        className="btn-outline-custom"
                        onClick={() => {
                          setShowQueryForm(false);
                          setQueryText("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedDesign.status === "pending" && (
                <div className={styles.reviewActions}>
                  <button
                    className="btn-primary-custom"
                    onClick={() => onApprove(selectedDesign._id)}
                  >
                    <MdCheckCircle style={{ marginRight: '8px' }} />
                    Approve Design
                  </button>
                  <button
                    className="btn-danger-custom"
                    onClick={() => onReject(selectedDesign._id)}
                  >
                    <MdCancel style={{ marginRight: '8px' }} />
                    Reject Design
                  </button>
                </div>
              )}

              <button
                className="btn-danger-custom"
                onClick={() => onDelete(selectedDesign._id)}
              >
                Delete Design
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.queueList}>
          {pendingDesigns.map((design) => (
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
                onClick={() => onDesignSelect(design)}
              >
                Review Now
              </button>
            </div>
          ))}

          {pendingDesigns.length === 0 && (
            <div className={styles.emptyState}>
              <p><MdCheckCircle style={{ marginRight: '8px', verticalAlign: 'middle' }} /> No pending designs to review</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReviewQueue;
