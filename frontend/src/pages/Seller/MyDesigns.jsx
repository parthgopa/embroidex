import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MdClose, MdImage, MdCloudUpload } from "react-icons/md";
import API from "../../services/api";
import styles from "./MyDesigns.module.css";


const MyDesigns = () => {
  const BASE_URL = API.defaults.baseURL;
  // console.log(BASE_URL);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDesign, setEditingDesign] = useState(null);
  const [categories, setCategories] = useState({});
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    subcategory: "",
  });
  
  // File uploads for edit
  const [newThumbnail, setNewThumbnail] = useState(null);
  const [newThumbnailPreview, setNewThumbnailPreview] = useState(null);
  const [newAdditionalImages, setNewAdditionalImages] = useState([]);
  const [newImagesPreviews, setNewImagesPreviews] = useState([]);
  const [newDesignFile, setNewDesignFile] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMyDesigns();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await API.get("/seller/categories");
      setCategories(res.data.categories);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

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
      category: design.category,
      subcategory: design.subcategory,
    });
    // Reset file uploads
    setNewThumbnail(null);
    setNewThumbnailPreview(null);
    setNewAdditionalImages([]);
    setNewImagesPreviews([]);
    setNewDesignFile(null);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Thumbnail must be less than 5MB");
        return;
      }
      setNewThumbnail(file);
      setNewThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 7) {
      alert("Maximum 7 additional images allowed");
      return;
    }
    setNewAdditionalImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setNewImagesPreviews(previews);
  };

  const removeNewImage = (index) => {
    const newImages = newAdditionalImages.filter((_, i) => i !== index);
    const newPreviews = newImagesPreviews.filter((_, i) => i !== index);
    setNewAdditionalImages(newImages);
    setNewImagesPreviews(newPreviews);
  };

  const handleDesignFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext !== 'zip' && ext !== 'emb') {
        alert("Please upload a .zip or .emb file");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        alert("File must be less than 20MB");
        return;
      }
      setNewDesignFile(file);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const token = localStorage.getItem("token");
      
      // Check if files were changed (requires admin approval)
      const filesChanged = newThumbnail || newAdditionalImages.length > 0 || newDesignFile;
      
      // Use FormData if files are being updated
      if (filesChanged) {
        const formData = new FormData();
        formData.append("title", editForm.title);
        formData.append("description", editForm.description);
        formData.append("price", editForm.price);
        formData.append("category", editForm.category);
        formData.append("subcategory", editForm.subcategory);
        
        if (newThumbnail) {
          formData.append("thumbnail", newThumbnail);
        }
        if (newAdditionalImages.length > 0) {
          newAdditionalImages.forEach(img => {
            formData.append("additional_images", img);
          });
        }
        if (newDesignFile) {
          formData.append("design_file", newDesignFile);
        }
        
        await API.put(`/seller/design/${editingDesign._id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
        
        alert("Design updated successfully!\n\nNote: Since you updated files/images, your design will require admin approval again.");
      } else {
        // Only text fields changed - no admin approval needed
        await API.put(`/seller/design/${editingDesign._id}`, editForm, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        alert("Design updated successfully!");
      }

      setEditingDesign(null);
      fetchMyDesigns();
    } catch (err) {
      alert(err.response?.data?.error || "Update failed");
    } finally {
      setUpdating(false);
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

        {/* Edit Modal - Comprehensive */}
        {editingDesign && (
          <div className={styles.modal}>
            <div className={styles.modalOverlay} onClick={() => setEditingDesign(null)}></div>
            <div className={`container-box ${styles.modalContent}`}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Edit Design</h2>
                <button 
                  className={styles.closeBtn}
                  onClick={() => setEditingDesign(null)}
                  type="button"
                >
                  <MdClose size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className={styles.editForm}>
                {/* Basic Info */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Basic Information</h3>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Title *</label>
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
                    <label className={styles.label}>Description *</label>
                    <textarea
                      name="description"
                      className={`input-custom ${styles.textarea}`}
                      value={editForm.description}
                      onChange={handleEditChange}
                      rows={4}
                      required
                    />
                  </div>
                </div>

                {/* Category */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Category</h3>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Category *</label>
                      <select
                        name="category"
                        className="input-custom"
                        value={editForm.category}
                        onChange={(e) => {
                          setEditForm({ ...editForm, category: e.target.value, subcategory: "" });
                        }}
                        required
                      >
                        <option value="">Select Category</option>
                        {Object.keys(categories).map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {editForm.category && (
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Subcategory *</label>
                        <select
                          name="subcategory"
                          className="input-custom"
                          value={editForm.subcategory}
                          onChange={handleEditChange}
                          required
                        >
                          <option value="">Select Subcategory</option>
                          {(categories[editForm.category] || []).map((subcat) => (
                            <option key={subcat} value={subcat}>{subcat}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Pricing</h3>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Price (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      className="input-custom"
                      value={editForm.price}
                      onChange={handleEditChange}
                      min="1"
                      required
                    />
                    <small className={styles.hint}>Changes to price do not require admin approval</small>
                  </div>
                </div>

                {/* Images */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Images (Optional - Requires Admin Approval)</h3>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>New Thumbnail</label>
                      <div className={styles.fileUpload}>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleThumbnailChange}
                          className={styles.fileInput}
                          id="editThumbnail"
                        />
                        <label htmlFor="editThumbnail" className={styles.uploadLabel}>
                          {newThumbnailPreview ? (
                            <img src={newThumbnailPreview} alt="New thumbnail" className={styles.previewImg} />
                          ) : (
                            <div className={styles.uploadPlaceholder}>
                              <MdImage size={32} />
                              <span>Upload new thumbnail</span>
                            </div>
                          )}
                        </label>
                      </div>
                      <small className={styles.hint}>Current: {editingDesign.thumbnail_path?.split('/').pop()}</small>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Additional Images</label>
                      <div className={styles.fileUpload}>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          multiple
                          onChange={handleAdditionalImagesChange}
                          className={styles.fileInput}
                          id="editAdditionalImages"
                        />
                        <label htmlFor="editAdditionalImages" className={styles.uploadLabel}>
                          <div className={styles.uploadPlaceholder}>
                            <MdCloudUpload size={32} />
                            <span>Upload new images (Max 7)</span>
                          </div>
                        </label>
                      </div>
                      {newImagesPreviews.length > 0 && (
                        <div className={styles.imagePreviews}>
                          {newImagesPreviews.map((preview, index) => (
                            <div key={index} className={styles.previewItem}>
                              <img src={preview} alt={`Preview ${index + 1}`} />
                              <button
                                type="button"
                                onClick={() => removeNewImage(index)}
                                className={styles.removeBtn}
                              >
                                <MdClose />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Design File */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Design File (Optional - Requires Admin Approval)</h3>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>New ZIP/EMB File</label>
                    <div className={styles.fileUpload}>
                      <input
                        type="file"
                        accept=".zip,.emb"
                        onChange={handleDesignFileChange}
                        className={styles.fileInput}
                        id="editDesignFile"
                      />
                      <label htmlFor="editDesignFile" className={styles.uploadLabel}>
                        <div className={styles.uploadPlaceholder}>
                          <MdCloudUpload size={32} />
                          <span>{newDesignFile ? newDesignFile.name : "Upload new design file"}</span>
                        </div>
                      </label>
                    </div>
                    <small className={styles.hint}>Current: {editingDesign.design_file_path?.split('/').pop()}</small>
                  </div>
                </div>

                {/* Warning */}
                {(newThumbnail || newAdditionalImages.length > 0 || newDesignFile) && (
                  <div className={styles.warningBox}>
                    ⚠️ <strong>Note:</strong> Updating images or design files will require admin approval again.
                  </div>
                )}

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className="btn-outline-custom"
                    onClick={() => setEditingDesign(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary-custom"
                    disabled={updating}
                  >
                    {updating ? "Updating..." : "Update Design"}
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
