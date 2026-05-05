/**
 * SelUploadV3 - Redesigned Upload Flow
 * New Flow: Images → ZIP → AI Processing → Category → Price
 * Single page, full width, expandable EMB file details
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MdCheckCircle, 
  MdUploadFile, 
  MdImage, 
  MdAutoAwesome, 
  MdClose,
  MdCloudUpload,
  MdPhotoLibrary
} from "react-icons/md";
import API from "../../services/api";
import styles from "./SelUploadV3.module.css";

const SelUploadV3 = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState({});
  
  // Form state - single page flow
  const [thumbnail, setThumbnail] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [imagesPreviews, setImagesPreviews] = useState([]);
  
  const [designFile, setDesignFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // AI-generated data (editable)
  const [sessionId, setSessionId] = useState("");
  const [uploadPreview, setUploadPreview] = useState(null);
  const [embMetadata, setEmbMetadata] = useState([]);
  const [form, setForm] = useState({
    titleOriginal: "",
    titleAi: "",
    titleSource: "original",
    descriptionOriginal: "",
    descriptionAi: "",
    descriptionSource: "original",
  });
  const [refiningField, setRefiningField] = useState("");
  
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [price, setPrice] = useState("");
  
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
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

  // Compress image using canvas — max 1200px, quality 0.82, output as File
  const compressImage = (file) => new Promise((resolve, reject) => {
    const MAX_SIDE = 1200;
    const QUALITY = 0.82;
    const MAX_BYTES = 10 * 1024 * 1024;

    if (file.size > MAX_BYTES) {
      reject(new Error(`"${file.name}" exceeds 10MB. Please use a smaller image.`));
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_SIDE || height > MAX_SIDE) {
        if (width > height) { height = Math.round((height / width) * MAX_SIDE); width = MAX_SIDE; }
        else { width = Math.round((width / height) * MAX_SIDE); height = MAX_SIDE; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error(`Failed to compress ${file.name}`)); return; }
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error(`Cannot read ${file.name}`)); };
    img.src = objectUrl;
  });

  // Image upload handlers
  const handleThumbnailChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert(`"${file.name}" exceeds 10MB. Please use a smaller image.`);
      e.target.value = "";
      return;
    }
    try {
      const compressed = await compressImage(file);
      setThumbnail(compressed);
      setThumbnailPreview(URL.createObjectURL(compressed));
    } catch (err) {
      alert(err.message);
      e.target.value = "";
    }
  };

  const handleAdditionalImagesChange = async (e) => {
    const newFiles = Array.from(e.target.files);
    e.target.value = "";

    if (additionalImages.length + newFiles.length > 7) {
      alert(`You can upload a maximum of 7 additional images. You already have ${additionalImages.length}.`);
      return;
    }

    const oversized = newFiles.find(f => f.size > 10 * 1024 * 1024);
    if (oversized) {
      alert(`"${oversized.name}" exceeds 10MB. Please use a smaller image.`);
      return;
    }

    try {
      const compressed = await Promise.all(newFiles.map(compressImage));
      setAdditionalImages(prev => [...prev, ...compressed]);
      setImagesPreviews(prev => [...prev, ...compressed.map(f => URL.createObjectURL(f))]);
    } catch (err) {
      alert(err.message);
    }
  };

  const removeAdditionalImage = (index) => {
    const newImages = additionalImages.filter((_, i) => i !== index);
    const newPreviews = imagesPreviews.filter((_, i) => i !== index);
    setAdditionalImages(newImages);
    setImagesPreviews(newPreviews);
  };

  // ZIP file upload handler
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
      setDesignFile(file);
      setSessionId("");
      setUploadPreview(null);
      setEmbMetadata([]);
      setForm({
        titleOriginal: "",
        titleAi: "",
        titleSource: "original",
        descriptionOriginal: "",
        descriptionAi: "",
        descriptionSource: "original",
      });
      // Auto-process when file is selected
      processDesignFile(file);
    }
  };

  // Process ZIP file with AI
  const processDesignFile = async (file) => {
    setProcessing(true);

    const formData = new FormData();
    formData.append("design_file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/seller/process-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setSessionId(res.data.session_id);
      setUploadPreview(res.data);
      setEmbMetadata(res.data.emb_metadata || []);

      alert(`✓ Design processed successfully!\n\nEMB files found: ${res.data.file_names.length}`);
    } catch (err) {
      alert(err.response?.data?.error || "Processing failed");
      setDesignFile(null);
      setSessionId("");
      setUploadPreview(null);
      setEmbMetadata([]);
    } finally {
      setProcessing(false);
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEmbMetadataChange = (index, field, value) => {
    setEmbMetadata((prev) => prev.map((item, currentIndex) => (
      currentIndex === index ? { ...item, [field]: value } : item
    )));
  };

  const handleContentSourceChange = (fieldType, source) => {
    setForm((prev) => ({
      ...prev,
      [`${fieldType}Source`]: source,
    }));
  };

  const getFieldValue = (fieldType) => {
    const source = form[`${fieldType}Source`];
    return source === "ai" ? form[`${fieldType}Ai`] : form[`${fieldType}Original`];
  };

  const handleFieldValueChange = (fieldType, value) => {
    const source = form[`${fieldType}Source`];
    const targetKey = `${fieldType}${source === "ai" ? "Ai" : "Original"}`;

    setForm((prev) => ({
      ...prev,
      [targetKey]: value,
    }));
  };

  const handleRefineField = async (fieldType) => {
    const originalText = fieldType === "title" ? form.titleOriginal : form.descriptionOriginal;

    if (!sessionId) {
      alert("Please upload and process a design file first");
      return;
    }

    if (!originalText.trim()) {
      alert(`Please enter a ${fieldType} before refining with AI`);
      return;
    }

    setRefiningField(fieldType);

    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        "/seller/refine-metadata",
        {
          field_type: fieldType,
          original_text: originalText,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setForm((prev) => ({
        ...prev,
        [fieldType === "title" ? "titleAi" : "descriptionAi"]: res.data.refined_text,
        [`${fieldType}Source`]: "ai",
      }));
    } catch (err) {
      alert(err.response?.data?.error || `Failed to refine ${fieldType}`);
    } finally {
      setRefiningField("");
    }
  };


  // Final submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!thumbnail) {
      return alert("Thumbnail image is required");
    }
    if (!designFile || !uploadPreview || !sessionId) {
      return alert("Please upload and process a design file");
    }
    if (!form.titleOriginal || !form.descriptionOriginal) {
      return alert("Please enter the original title and description");
    }
    if (!category || !subcategory) {
      return alert("Please select category and subcategory");
    }
    if (!price || parseFloat(price) <= 0) {
      return alert("Please enter a valid price");
    }
    if (form.titleSource === "ai" && !form.titleAi.trim()) {
      return alert("Please generate the AI title or switch to Original title");
    }
    if (form.descriptionSource === "ai" && !form.descriptionAi.trim()) {
      return alert("Please generate the AI description or switch to Original description");
    }
    if (embMetadata.length === 0) {
      return alert("No EMB files were found to save");
    }

    const hasInvalidEmbMetadata = embMetadata.some((item) => {
      const stitchCount = item.stitch_count;
      const width = item.width_mm;
      const height = item.height_mm;
      return stitchCount === "" || width === "" || height === "" || Number(stitchCount) < 0 || Number(width) < 0 || Number(height) < 0;
    });

    if (hasInvalidEmbMetadata) {
      return alert("Please fill stitches, width, and height for every EMB file");
    }

    const selectedTitle = form.titleSource === "ai" ? form.titleAi : form.titleOriginal;
    const selectedDescription = form.descriptionSource === "ai" ? form.descriptionAi : form.descriptionOriginal;

    setUploading(true);

    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("title", selectedTitle);
    formData.append("description", selectedDescription);
    formData.append("title_original", form.titleOriginal);
    formData.append("title_ai", form.titleAi);
    formData.append("title_source", form.titleSource);
    formData.append("description_original", form.descriptionOriginal);
    formData.append("description_ai", form.descriptionAi);
    formData.append("description_source", form.descriptionSource);
    formData.append("emb_metadata", JSON.stringify(embMetadata));
    formData.append("category", category);
    formData.append("subcategory", subcategory);
    formData.append("price", price);
    formData.append("file_names", JSON.stringify(uploadPreview?.file_names || []));
    formData.append("design_file_path", uploadPreview?.design_file_path || "");
    formData.append("thumbnail", thumbnail);

    additionalImages.forEach((img) => {
      formData.append("additional_images", img);
    });

    try {
      const token = localStorage.getItem("token");
      await API.post("/seller/final-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      alert("✓ Design uploaded successfully!\n\nYour design is pending admin approval.");
      navigate("/seller/my-designs");
    } catch (err) {
      alert(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const subcategories = category ? categories[category] || [] : [];
  const totalEnteredStitches = embMetadata.reduce((total, item) => total + (Number(item.stitch_count) || 0), 0);

  return (
    <div className={styles.fullWidthContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Upload New Design</h1>
        <p className={styles.subtitle}>Follow the steps below to upload your embroidery design</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.uploadForm} noValidate>

        {/* STEP 1: Upload Design Images */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <MdPhotoLibrary className={styles.titleIcon} />
              1. Upload Design Images
            </h2>
            <span className={styles.required}>Required</span>
          </div>
          
          <div className={styles.imagesUploadGrid}>
            {/* Thumbnail Upload */}
            <div className={styles.thumbnailUpload}>
              <label className={styles.uploadLabel}>Main Thumbnail *</label>
              <div className={styles.uploadBox}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleThumbnailChange}
                  className={styles.fileInput}
                  id="thumbnail"
                />
                <label htmlFor="thumbnail" className={styles.uploadArea}>
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="Thumbnail" className={styles.previewImage} />
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      <MdImage className={styles.uploadIcon} />
                      <p>Click to upload</p>
                      <small>PNG, JPG (Max 5MB)</small>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Additional Images Upload */}
            <div className={styles.additionalUpload}>
              <label className={styles.uploadLabel}>Additional Images (Max 7)</label>
              <div className={styles.uploadBox}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  multiple
                  onChange={handleAdditionalImagesChange}
                  className={styles.fileInput}
                  id="additionalImages"
                />
                <label htmlFor="additionalImages" className={styles.uploadArea}>
                  <div className={styles.uploadPlaceholder}>
                    <MdCloudUpload className={styles.uploadIcon} />
                    <p>Click to upload multiple</p>
                    <small>Showcase your design</small>
                  </div>
                </label>
              </div>
              
              {imagesPreviews.length > 0 && (
                <div className={styles.additionalPreviews}>
                  {imagesPreviews.map((preview, index) => (
                    <div key={index} className={styles.previewItem}>
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeAdditionalImage(index)}
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

        {/* STEP 2: Upload ZIP File */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <MdUploadFile className={styles.titleIcon} />
              2. Upload Design File (ZIP/EMB)
            </h2>
            <span className={styles.required}>Required</span>
          </div>
          
          <div className={styles.zipUploadBox}>
            <input
              type="file"
              accept=".zip,.emb"
              onChange={handleDesignFileChange}
              className={styles.fileInput}
              id="designFile"
              disabled={processing}
            />
            <label htmlFor="designFile" className={styles.zipUploadLabel}>
              {designFile ? (
                <div className={styles.fileSelected}>
                  <MdCheckCircle className={styles.successIcon} />
                  <div>
                    <p className={styles.fileName}>{designFile.name}</p>
                    <small>Click to change file</small>
                  </div>
                </div>
              ) : (
                <div className={styles.zipPlaceholder}>
                  <MdCloudUpload className={styles.zipIcon} />
                  <p>Click to upload ZIP or EMB file</p>
                  <small>Max 20MB • ZIP will list EMB files for manual details entry</small>
                </div>
              )}
            </label>
            
            {processing && (
              <div className={styles.processingIndicator}>
                <MdAutoAwesome className={styles.spinIcon} />
                <span>Processing with AI...</span>
              </div>
            )}
          </div>
        </div>

        {/* STEP 3: AI-Generated Details (shown after ZIP processing) */}
        {uploadPreview && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <MdAutoAwesome className={styles.titleIcon} />
                3. Design Details
              </h2>
              <span className={styles.badge}>Editable</span>
            </div>
            
            <div className={styles.aiSummary}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Files Found</span>
                <span className={styles.statValue}>{uploadPreview.file_names.length}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Upload Type</span>
                <span className={styles.statValue}>{(uploadPreview.design_file_type || "emb").toUpperCase()}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Entered Stitches</span>
                <span className={styles.statValue}>{totalEnteredStitches.toLocaleString()}</span>
              </div>
            </div>

            {embMetadata.length > 0 && (
              <div className={styles.embFilesSection}>
                <h3 className={styles.subsectionTitle}>EMB File Details</h3>
                {embMetadata.map((fileItem, index) => (
                  <div key={index} className={styles.embFileCard}>
                    <div className={styles.embFileHeaderStatic}>
                      <span className={styles.fileName}>{fileItem.file_name}</span>
                    </div>
                    <div className={styles.embFileDetails}>
                      <div className={styles.metadataInputsRow}>
                        <div className={styles.metadataInputGroup}>
                          <label className={styles.metadataLabel}>Stitches</label>
                          <input
                            type="number"
                            className="input-custom"
                            min="0"
                            step="1"
                            value={fileItem.stitch_count}
                            onChange={(e) => handleEmbMetadataChange(index, "stitch_count", e.target.value)}
                            placeholder="Enter stitches"
                          />
                        </div>
                        <div className={styles.metadataInputGroup}>
                          <label className={styles.metadataLabel}>Height (mm)</label>
                          <input
                            type="number"
                            className="input-custom"
                            min="0"
                            step="0.01"
                            value={fileItem.height_mm}
                            onChange={(e) => handleEmbMetadataChange(index, "height_mm", e.target.value)}
                            placeholder="Enter height"
                          />
                        </div>
                        <div className={styles.metadataInputGroup}>
                          <label className={styles.metadataLabel}>Width (mm)</label>
                          <input
                            type="number"
                            className="input-custom"
                            min="0"
                            step="0.01"
                            value={fileItem.width_mm}
                            onChange={(e) => handleEmbMetadataChange(index, "width_mm", e.target.value)}
                            placeholder="Enter width"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Design Title *</label>
                <button
                  type="button"
                  className={styles.refineButton}
                  onClick={() => handleRefineField("title")}
                  disabled={refiningField === "title" || processing}
                >
                  <MdAutoAwesome /> {refiningField === "title" ? "Refining..." : "Refine with AI"}
                </button>
              </div>
              <div className={styles.contentTabs}>
                <button
                  type="button"
                  className={`${styles.contentTab} ${form.titleSource === "original" ? styles.contentTabActive : ""}`}
                  onClick={() => handleContentSourceChange("title", "original")}
                >
                  Original
                </button>
                <button
                  type="button"
                  className={`${styles.contentTab} ${form.titleSource === "ai" ? styles.contentTabActive : ""}`}
                  onClick={() => handleContentSourceChange("title", "ai")}
                >
                  AI
                </button>
              </div>
              <input
                type="text"
                className="input-custom"
                value={getFieldValue("title")}
                onChange={(e) => handleFieldValueChange("title", e.target.value)}
                placeholder={form.titleSource === "ai" ? "AI refined title will appear here" : "Enter your design title"}
              />
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Description *</label>
                <button
                  type="button"
                  className={styles.refineButton}
                  onClick={() => handleRefineField("description")}
                  disabled={refiningField === "description" || processing}
                >
                  <MdAutoAwesome /> {refiningField === "description" ? "Refining..." : "Refine with AI"}
                </button>
              </div>
              <div className={styles.contentTabs}>
                <button
                  type="button"
                  className={`${styles.contentTab} ${form.descriptionSource === "original" ? styles.contentTabActive : ""}`}
                  onClick={() => handleContentSourceChange("description", "original")}
                >
                  Original
                </button>
                <button
                  type="button"
                  className={`${styles.contentTab} ${form.descriptionSource === "ai" ? styles.contentTabActive : ""}`}
                  onClick={() => handleContentSourceChange("description", "ai")}
                >
                  AI
                </button>
              </div>
              <textarea
                className={`input-custom ${styles.textarea}`}
                value={getFieldValue("description")}
                onChange={(e) => handleFieldValueChange("description", e.target.value)}
                placeholder={form.descriptionSource === "ai" ? "AI refined description will appear here" : "Enter your design description"}
                rows={5}
              />
            </div>
          </div>
        )}

        {/* STEP 4: Category & Subcategory */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              4. Category & Subcategory
            </h2>
            <span className={styles.required}>Required</span>
          </div>
          
          <div className={styles.categoryGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Category *</label>
              <select
                className="input-custom"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubcategory("");
                }}
                required
              >
                <option value="">Select Category</option>
                {Object.keys(categories).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Subcategory *</label>
              <select
                className="input-custom"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                required
                disabled={!category}
              >
                <option value="">{category ? "Select Subcategory" : "Select a category first"}</option>
                {subcategories.map((subcat) => (
                  <option key={subcat} value={subcat}>{subcat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* STEP 5: Selling Price */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              5. Selling Price
            </h2>
            <span className={styles.required}>Required</span>
          </div>
          
          <div className={styles.priceInput}>
            <label className={styles.label}>Price (₹) *</label>
            <input
              type="number"
              className="input-custom"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price in rupees"
              min="1"
              step="1"
              required
            />
            <small className={styles.hint}>Set a competitive price for your design</small>
          </div>
        </div>

        {/* Submit Button */}
        <div className={styles.submitSection}>
          <button
            type="submit"
            className={`btn-primary-custom ${styles.submitButton}`}
            disabled={uploading || processing}
          >
            {uploading ? (
              <>
                <MdCloudUpload className={styles.btnIcon} />
                Uploading...
              </>
            ) : (
              <>
                <MdCheckCircle className={styles.btnIcon} />
                Submit Design for Approval
              </>
            )}
          </button>
          <p className={styles.submitNote}>
            Your design will be reviewed by our team before being published
          </p>
        </div>
      </form>
    </div>
  );
};

export default SelUploadV3;
