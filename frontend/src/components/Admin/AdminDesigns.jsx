import { useState, useEffect } from "react";
import { MdClose, MdImage, MdGridOn, MdStraighten, MdDescription, MdCheckCircle, MdCancel, MdDelete, MdUndo } from "react-icons/md";
import API from "../../services/api";
import styles from "./AdminDesigns.module.css";

const AdminDesigns = ({ designs, onApprove, onReject, onUnapprove, onDelete, BASE_URL }) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [fullDesign, setFullDesign] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const categories = [...new Set(designs.map(d => d.category).filter(Boolean))];

  const filteredDesigns = designs.filter((design) => {
    const matchesStatus = filterStatus === "all" || design.status === filterStatus;
    const matchesCategory = filterCategory === "all" || design.category === filterCategory;
    const matchesSearch =
      design.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      design.seller_email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  useEffect(() => {
    if (!selectedDesign) { setFullDesign(null); setActiveImageIdx(0); return; }
    setLoadingDetail(true);
    const token = localStorage.getItem("token");
    API.get(`/admin/design/${selectedDesign._id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => setFullDesign(res.data.design))
      .catch(() => setFullDesign(selectedDesign))
      .finally(() => setLoadingDetail(false));
  }, [selectedDesign]);

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
  const allImages = activeDesign ? [activeDesign.thumbnail, ...(activeDesign.additional_images || [])].filter(Boolean) : [];

  const closeModal = () => setSelectedDesign(null);

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h1 className={styles.pageTitle}>All Designs</h1>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search by title or seller..."
            className="input-custom"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select className="input-custom" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="input-custom" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      <p className={styles.resultCount}>{filteredDesigns.length} design{filteredDesigns.length !== 1 ? "s" : ""} found</p>

      <div className={styles.designsGrid}>
        {filteredDesigns.map((design) => (
          <div key={design._id} className={`card-custom ${styles.designCard}`}>
            <div className={styles.cardImage}>
              {design.thumbnail ? (
                <img src={design.thumbnail} alt={design.title} />
              ) : (
                <div className={styles.noThumb}><MdImage size={40} color="#9ca3af" /></div>
              )}
              <div className={styles.statusBadge}>{getStatusBadge(design.status)}</div>
            </div>
            <div className={styles.cardBody}>
              <h3 className={styles.designTitle}>{design.title}</h3>
              <p className={styles.designSeller}>by {design.seller_email}</p>
              <p className={styles.designCategory}>{design.category} {design.subcategory ? `· ${design.subcategory}` : ""}</p>
              <p className={styles.designPrice}>₹{design.price}</p>
              <button className="btn-outline-custom" onClick={() => setSelectedDesign(design)}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDesigns.length === 0 && (
        <div className={styles.emptyState}><p>No designs found</p></div>
      )}

      {/* Detail Modal */}
      {selectedDesign && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Design Details</h2>
              <button className={styles.closeButton} onClick={closeModal}><MdClose /></button>
            </div>

            {loadingDetail ? (
              <div className={styles.modalLoading}>Loading...</div>
            ) : (
              <div className={styles.modalBody}>
                {/* Image Gallery */}
                <div className={styles.gallerySection}>
                  <div className={styles.mainImageWrap}>
                    {allImages[activeImageIdx] ? (
                      <img src={allImages[activeImageIdx]} alt={activeDesign?.title} className={styles.mainImg} />
                    ) : (
                      <div className={styles.noThumbLg}><MdImage size={64} color="#9ca3af" /></div>
                    )}
                    {allImages.length > 0 && (
                      <span className={styles.imgCounter}>{activeImageIdx + 1} / {allImages.length}</span>
                    )}
                  </div>
                  {allImages.length > 1 && (
                    <div className={styles.thumbStrip}>
                      {allImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`img-${idx + 1}`}
                          className={`${styles.thumbImg} ${activeImageIdx === idx ? styles.thumbActive : ""}`}
                          onClick={() => setActiveImageIdx(idx)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div className={styles.infoSection}>
                  <div className={styles.titleRow}>
                    <h3>{activeDesign?.title}</h3>
                    {getStatusBadge(activeDesign?.status)}
                  </div>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Seller</span><span className={styles.detailValue}>{activeDesign?.seller_email}</span></div>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Price</span><span className={styles.detailValue}>₹{activeDesign?.price?.toLocaleString()}</span></div>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Category</span><span className={styles.detailValue}>{activeDesign?.category}</span></div>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Subcategory</span><span className={styles.detailValue}>{activeDesign?.subcategory}</span></div>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Upload Type</span><span className={styles.detailValue}>{(activeDesign?.design_file_type || "emb").toUpperCase()}</span></div>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Total Stitches</span><span className={styles.detailValue}>{activeDesign?.total_stitch_count?.toLocaleString() || "—"}</span></div>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>EMB Files</span><span className={styles.detailValue}>{activeDesign?.emb_files_count || activeDesign?.file_names?.length || 0}</span></div>
                    <div className={styles.detailItem}><span className={styles.detailLabel}>Design ID</span><span className={styles.detailValue} style={{fontSize:"12px",wordBreak:"break-all"}}>{activeDesign?.design_id}</span></div>
                  </div>
                </div>

                {/* Description */}
                <div className={styles.infoSection}>
                  <h4><MdDescription style={{marginRight:6,verticalAlign:"middle"}}/>Description</h4>
                  <p className={styles.descText}>{activeDesign?.description}</p>
                </div>

                {/* EMB Metadata */}
                {activeDesign?.emb_metadata?.length > 0 && (
                  <div className={styles.infoSection}>
                    <h4><MdGridOn style={{marginRight:6,verticalAlign:"middle"}}/>EMB File Details</h4>
                    <div className={styles.embGrid}>
                      {activeDesign.emb_metadata.map((emb, idx) => (
                        <div key={idx} className={styles.embCard}>
                          <p className={styles.embName}>{emb.file_name}</p>
                          <p><MdGridOn style={{verticalAlign:"middle",marginRight:4}}/>{emb.stitch_count?.toLocaleString()} stitches</p>
                          <p><MdStraighten style={{verticalAlign:"middle",marginRight:4}}/>{emb.width_mm} × {emb.height_mm} mm</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Names */}
                {activeDesign?.file_names?.length > 0 && (
                  <div className={styles.infoSection}>
                    <h4>EMB Files ({activeDesign.file_names.length})</h4>
                    <ul className={styles.filesList}>
                      {activeDesign.file_names.map((f, idx) => <li key={idx}>{f}</li>)}
                    </ul>
                  </div>
                )}

                {/* Rejection reason */}
                {activeDesign?.rejection_reason && (
                  <div className={styles.infoSection}>
                    <h4>Rejection Reason</h4>
                    <p className={styles.rejectionText}>{activeDesign.rejection_reason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={styles.actionRow}>
                  {activeDesign?.status !== "approved" && (
                    <button className="btn-primary-custom" onClick={() => { onApprove(selectedDesign._id); closeModal(); }}>
                      <MdCheckCircle style={{marginRight:6}}/> Approve
                    </button>
                  )}
                  {activeDesign?.status === "approved" && (
                    <button className={styles.unapproveBtn} onClick={() => { onUnapprove(selectedDesign._id); closeModal(); }}>
                      <MdUndo style={{marginRight:6}}/> Un-approve
                    </button>
                  )}
                  {activeDesign?.status !== "rejected" && (
                    <button className="btn-danger-custom" onClick={() => { onReject(selectedDesign._id); closeModal(); }}>
                      <MdCancel style={{marginRight:6}}/> Reject
                    </button>
                  )}
                  <button className={styles.deleteBtn} onClick={() => { onDelete(selectedDesign._id); closeModal(); }}>
                    <MdDelete style={{marginRight:6}}/> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDesigns;
