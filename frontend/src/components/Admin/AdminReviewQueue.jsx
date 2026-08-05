import { useState, useEffect } from "react";
import { 
  MdCheckCircle, 
  MdCancel, 
  MdClose, 
  MdDownload, 
  MdImage,
  MdDescription,
  MdStraighten,
  MdGridOn,
  MdTableChart
} from "react-icons/md";
import API from "../../services/api";
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
  const [fullDesign, setFullDesign] = useState(null);

  useEffect(() => {
    if (!selectedDesign) {
      setFullDesign(null);
      setSelectedImageIndex(0);
      return;
    }
    const token = localStorage.getItem("token");
    API.get(`/admin/design/${selectedDesign._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => setFullDesign(res.data.design))
      .catch(() => setFullDesign(selectedDesign));
  }, [selectedDesign]);

  const handleAddQuery = async () => {
    if (!queryText.trim()) {
      alert("Please enter a query message");
      return;
    }

    await onAddQuery(selectedDesign._id, queryText);

    const newQuery = {
      message: queryText,
      created_at: new Date().toISOString(),
      seller_response: null,
    };
    setFullDesign((prev) => {
      if (!prev) return prev;
      return { ...prev, admin_queries: [...(prev.admin_queries || []), newQuery] };
    });
    setQueryText("");
    setShowQueryForm(false);
  };

  const handleDeleteQuery = async (queryIndex) => {
    if (!window.confirm("Remove this query? This means the issue has been resolved.")) return;
    const token = localStorage.getItem("token");
    try {
      await API.delete(`/admin/design/${selectedDesign._id}/query/${queryIndex}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFullDesign((prev) => {
        if (!prev) return prev;
        const updatedQueries = (prev.admin_queries || []).filter((_, i) => i !== queryIndex);
        return { ...prev, admin_queries: updatedQueries };
      });
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete query");
    }
  };

  const handleDownloadZip = () => {
    const design = fullDesign || selectedDesign;
    if (design?.design_file_path) {
      const downloadUrl = `${BASE_URL}/${design.design_file_path}`;
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

  const activeDesign = fullDesign || selectedDesign;
  const allImages = activeDesign ? [
    activeDesign.thumbnail,
    ...(activeDesign.additional_images || [])
  ].filter(Boolean) : [];

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
                {allImages[selectedImageIndex] ? (
                  <img
                    src={allImages[selectedImageIndex]}
                    alt={activeDesign?.title}
                    className={styles.reviewImage}
                  />
                ) : (
                  <div className={styles.noImage}><MdImage size={48} /></div>
                )}
                <div className={styles.imageCounter}>
                  {selectedImageIndex + 1} / {allImages.length}
                </div>
              </div>
              
              {allImages.length > 1 && (
                <div className={styles.thumbnailStrip}>
                  {allImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
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
                  <h2>{activeDesign?.title}</h2>
                  {getStatusBadge(activeDesign?.status)}
                </div>
                <button
                  className="btn-outline-custom"
                  onClick={handleDownloadZip}
                >
                  <MdDownload style={{ marginRight: '8px' }} />
                  Download Design File
                </button>
              </div>

              {/* 2-Column Details Table */}
              <div className={styles.infoSection}>
                <h3><MdTableChart style={{ marginRight: '8px', verticalAlign: 'middle' }} />Design Specification Details</h3>
                <div className={styles.tableWrapper}>
                  <table className={styles.infoTable}>
                    <tbody>
                      <tr>
                        <td className={styles.tableLabel}>Seller Email</td>
                        <td className={styles.tableValue}>{activeDesign?.seller_email}</td>
                      </tr>
                      <tr>
                        <td className={styles.tableLabel}>Design Name</td>
                        <td className={styles.tableValue}><strong>{activeDesign?.title}</strong></td>
                      </tr>
                      <tr>
                        <td className={styles.tableLabel}>Selling Price</td>
                        <td className={styles.tableValue}>₹{activeDesign?.price?.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td className={styles.tableLabel}>Category</td>
                        <td className={styles.tableValue}>{activeDesign?.category}</td>
                      </tr>
                      <tr>
                        <td className={styles.tableLabel}>Subcategory</td>
                        <td className={styles.tableValue}>{activeDesign?.subcategory || "N/A"}</td>
                      </tr>
                      <tr>
                        <td className={styles.tableLabel}>Number of Needles</td>
                        <td className={styles.tableValue}>
                          <span className={styles.needleBadge}>
                            {activeDesign?.needles || 1} {activeDesign?.needles === 1 ? "Needle" : "Needles"}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className={styles.tableLabel}>File Format</td>
                        <td className={styles.tableValue}>
                          <span className={styles.formatBadge}>
                            {(activeDesign?.file_format || activeDesign?.design_file_type || "EMB").toUpperCase()}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className={styles.tableLabel}>Total Stitches</td>
                        <td className={styles.tableValue}>{activeDesign?.total_stitch_count?.toLocaleString() || "N/A"}</td>
                      </tr>
                      <tr>
                        <td className={styles.tableLabel}>Files Included</td>
                        <td className={styles.tableValue}>{activeDesign?.emb_files_count || activeDesign?.file_names?.length || 0} Files</td>
                      </tr>
                      <tr>
                        <td className={styles.tableLabel}>Design ID</td>
                        <td className={styles.tableValue}><code>{activeDesign?.design_id}</code></td>
                      </tr>
                      <tr>
                        <td className={styles.tableLabel}>Title Source</td>
                        <td className={styles.tableValue}>{(activeDesign?.title_source || "original").toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td className={styles.tableLabel}>Description Source</td>
                        <td className={styles.tableValue}>{(activeDesign?.description_source || "original").toUpperCase()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Description */}
              <div className={styles.infoSection}>
                <h3>Description</h3>
                <p className={styles.descriptionText}>{activeDesign?.description}</p>
              </div>

              <div className={styles.infoSection}>
                <h3>Seller Content Versions</h3>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <strong>Original Title:</strong> {activeDesign?.title_original || "Not provided"}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>AI Title:</strong> {activeDesign?.title_ai || "Not generated"}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Original Description:</strong> {activeDesign?.description_original || "Not provided"}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>AI Description:</strong> {activeDesign?.description_ai || "Not generated"}
                  </div>
                </div>
              </div>

              {/* EMB Files Metadata */}
              {activeDesign?.emb_metadata && activeDesign.emb_metadata.length > 0 && (
                <div className={styles.infoSection}>
                  <h3><MdGridOn style={{ marginRight: '8px', verticalAlign: 'middle' }} />EMB Files Details</h3>
                  <div className={styles.embFilesGrid}>
                    {activeDesign.emb_metadata.map((emb, idx) => (
                      <div key={idx} className={styles.embCard}>
                        <h4>{emb.file_name}</h4>
                        <div className={styles.embDetails}>
                          <div className={styles.embDetailItem}>
                            <MdGridOn />
                            <span>{emb.stitch_count?.toLocaleString()} stitches</span>
                          </div>
                          <div className={styles.embDetailItem}>
                            <MdStraighten />
                            <span>{emb.width_mm} × {emb.height_mm} mm</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.totalStitches}>
                    <strong>Total Stitches (All Files):</strong> {activeDesign.total_stitch_count?.toLocaleString()}
                  </div>
                </div>
              )}

              {/* File Names List */}
              <div className={styles.infoSection}>
                <h3>EMB Files ({activeDesign?.file_names?.length || 0})</h3>
                <div className={styles.filesList}>
                  {activeDesign?.file_names?.map((fileName, idx) => (
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
                {activeDesign?.admin_queries && activeDesign.admin_queries.length > 0 ? (
                  <div className={styles.queriesList}>
                    {activeDesign.admin_queries.map((query, idx) => (
                      <div key={idx} className={styles.queryItem}>
                        <div className={styles.queryHeader}>
                          <strong>Query #{idx + 1}</strong>
                          <div className={styles.queryHeaderRight}>
                            <span className={styles.queryDate}>
                              {new Date(query.created_at).toLocaleDateString()}
                            </span>
                            <button
                              className={styles.deleteQueryBtn}
                              onClick={() => handleDeleteQuery(idx)}
                              title="Remove query (design issue resolved)"
                            >
                              ✕ Remove
                            </button>
                          </div>
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
              {activeDesign?.status === "pending" && (
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
                  <button
                    className="btn-outline-custom"
                    onClick={() => onDelete(selectedDesign._id)}
                    style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                  >
                    Delete Permanent
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.queueGrid}>
          {pendingDesigns.length === 0 ? (
            <div className={styles.emptyState}>
              <MdCheckCircle size={64} color="var(--success)" />
              <h2>All Caught Up!</h2>
              <p>There are no pending designs to review.</p>
            </div>
          ) : (
            pendingDesigns.map((design) => (
              <div
                key={design._id}
                className={`container-box ${styles.designCard}`}
                onClick={() => onDesignSelect(design)}
              >
                <div className={styles.cardHeader}>
                  <img
                    src={design.thumbnail || "https://via.placeholder.com/150"}
                    alt={design.title}
                    className={styles.thumbnail}
                  />
                  <div className={styles.cardMeta}>
                    <h3>{design.title}</h3>
                    <p className={styles.sellerEmail}>{design.seller_email}</p>
                    <p className={styles.categoryInfo}>
                      {design.category} {design.subcategory && `• ${design.subcategory}`}
                    </p>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.price}>₹{design.price?.toLocaleString()}</span>
                  <span className={styles.badge}>{design.emb_files_count || design.file_names?.length || 0} Files</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReviewQueue;
