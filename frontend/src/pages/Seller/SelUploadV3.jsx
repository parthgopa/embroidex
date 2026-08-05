/**
 * SelUploadV3 - Redesigned Upload Flow
 * Order: Images → Design Details (Name, Description, Category, Needles, Price) → File Format & Upload File
 * Features:
 * - Prominent "✨ Write with AI" buttons for Title & Description
 * - Simple File Upload Status Card (no tedious 50-file manual stitch/height/width input boxes)
 * - 70/30 Split Layout with Brief Simple-English Guidance Card
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
  MdPhotoLibrary,
  MdInfoOutline,
  MdLightbulbOutline,
  MdCategory,
  MdFormatListNumbered,
  MdFolderZip,
  MdExpandMore,
  MdExpandLess
} from "react-icons/md";
import API from "../../services/api";
import styles from "./SelUploadV3.module.css";

// Available file formats in UPPERCASE
const FILE_FORMAT_OPTIONS = [
  ".DST", ".PES", ".EMB", ".JEF", ".EXP", ".VP3",
  ".ART", ".XXX", ".HUS", ".VIP", ".SEW"
];

// Brief, simple English guide sections
const GUIDE_SECTIONS = [
  {
    id: "images",
    stepNum: "1",
    title: "1. Design Photos",
    icon: MdPhotoLibrary,
    description: "Upload clear photos of your embroidery design.",
    details: [
      {
        subtitle: "Main Photo *",
        points: [
          "Upload 1 main photo for design preview.",
          "Use JPG or PNG photo (Max 10 MB)."
        ]
      },
      {
        subtitle: "Extra Photos (Max 7)",
        points: [
          "Upload up to 7 extra photos.",
          "Show close-up stitches and thread work."
        ]
      }
    ]
  },
  {
    id: "details",
    stepNum: "2",
    title: "2. Design Details & Needles",
    icon: MdCategory,
    description: "Type your design details, category, and needle count.",
    details: [
      {
        subtitle: "Name & Description",
        points: [
          "Type design name and description.",
          "Click '✨ Write with AI' to automatically write name & description!"
        ]
      },
      {
        subtitle: "Category & Needles",
        points: [
          "Select category and subcategory.",
          "Choose number of needles (1 to 15).",
          "Set selling price in Rupees (₹)."
        ]
      }
    ]
  },
  {
    id: "fileUpload",
    stepNum: "3",
    title: "3. File Format & Upload",
    icon: MdUploadFile,
    description: "Select file format and upload your design file.",
    details: [
      {
        subtitle: "File Format & File",
        points: [
          "Select format: .DST, .PES, .EMB, .JEF, etc.",
          "Upload .ZIP or single design file (Max 20 MB)."
        ]
      }
    ]
  }
];

const SelUploadV3 = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState({});

  // Form state - Images
  const [thumbnail, setThumbnail] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [imagesPreviews, setImagesPreviews] = useState([]);

  // Form state - Details
  const [form, setForm] = useState({
    titleOriginal: "",
    titleAi: "",
    titleSource: "original",
    descriptionOriginal: "",
    descriptionAi: "",
    descriptionSource: "original",
  });
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [needles, setNeedles] = useState("1");
  const [price, setPrice] = useState("");
  const [refiningField, setRefiningField] = useState("");

  // Form state - File Format & File Upload
  const [fileFormat, setFileFormat] = useState(".EMB");
  const [designFile, setDesignFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [uploadPreview, setUploadPreview] = useState(null);
  const [embMetadata, setEmbMetadata] = useState([]);
  const [showFileList, setShowFileList] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState("images");

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

  // Compress image using canvas
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

  // Design file upload handler
  const handleDesignFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("File must be less than 20MB");
        return;
      }
      setDesignFile(file);
      setSessionId("");
      setUploadPreview(null);
      setEmbMetadata([]);
      processDesignFile(file);
    }
  };

  // Process design file with AI / scanner
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

  // "Write with AI" handler - works even if field is empty!
  const handleWriteWithAi = async (fieldType) => {
    let originalText = fieldType === "title" ? form.titleOriginal : form.descriptionOriginal;

    if (!originalText.trim()) {
      originalText = `${category || "Embroidery"} ${subcategory || "Design"} ${designFile ? designFile.name.replace(/\.[^/.]+$/, "") : "Neck Pattern"}`.trim();
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
      alert(err.response?.data?.error || `Failed to write ${fieldType} with AI`);
    } finally {
      setRefiningField("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!thumbnail) {
      return alert("Thumbnail image is required");
    }
    if (!form.titleOriginal && !form.titleAi) {
      return alert("Please enter design name or use '✨ Write with AI'");
    }
    if (!form.descriptionOriginal && !form.descriptionAi) {
      return alert("Please enter description or use '✨ Write with AI'");
    }
    if (!category || !subcategory) {
      return alert("Please select category and subcategory");
    }
    if (!price || parseFloat(price) <= 0) {
      return alert("Please enter a valid price");
    }
    if (!designFile || !uploadPreview || !sessionId) {
      return alert("Please upload a design file");
    }

    const selectedTitle = form.titleSource === "ai" ? form.titleAi : (form.titleOriginal || form.titleAi);
    const selectedDescription = form.descriptionSource === "ai" ? form.descriptionAi : (form.descriptionOriginal || form.descriptionAi);

    setUploading(true);

    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("title", selectedTitle);
    formData.append("description", selectedDescription);
    formData.append("title_original", form.titleOriginal || selectedTitle);
    formData.append("title_ai", form.titleAi);
    formData.append("title_source", form.titleSource);
    formData.append("description_original", form.descriptionOriginal || selectedDescription);
    formData.append("description_ai", form.descriptionAi);
    formData.append("description_source", form.descriptionSource);
    formData.append("category", category);
    formData.append("subcategory", subcategory);
    formData.append("needles", needles);
    formData.append("file_format", fileFormat.replace(".", "").toUpperCase());
    formData.append("price", price);
    formData.append("emb_metadata", JSON.stringify(embMetadata));
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
  const fileNames = uploadPreview?.file_names || [];

  return (
    <div className={styles.fullWidthContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Upload New Design</h1>
        <p className={styles.subtitle}>Follow the simple steps below to upload your embroidery design</p>
      </div>

      <div className={styles.layoutGrid}>
        {/* LEFT COLUMN: FORM INPUTS (~70%) */}
        <form onSubmit={handleSubmit} className={styles.uploadForm} noValidate>

          {/* STEP 1: Upload Design Images */}
          <div
            className={`${styles.section} ${activeSectionId === "images" ? styles.sectionActive : ""}`}
            onMouseEnter={() => setActiveSectionId("images")}
            onFocus={() => setActiveSectionId("images")}
          >
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <MdPhotoLibrary className={styles.titleIcon} />
                1. Upload Design Images
              </h2>
              <span className={styles.required}>Required</span>
            </div>

            <div className={styles.imagesUploadGrid}>
              {/* Thumbnail Upload */}
              <div
                className={styles.thumbnailUpload}
                onClick={() => setActiveSectionId("images")}
              >
                <label className={styles.uploadLabel}>Main Thumbnail *</label>
                <div className={styles.uploadBox}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleThumbnailChange}
                    className={styles.fileInput}
                    id="thumbnail"
                  />
                  <label htmlFor="thumbnail" className={styles.uploadAreaCompact}>
                    {thumbnailPreview ? (
                      <div className={styles.compactPreviewWrapper}>
                        <img src={thumbnailPreview} alt="Thumbnail" className={styles.previewImageCompact} />
                        <span className={styles.changeBadge}>Change</span>
                      </div>
                    ) : (
                      <div className={styles.uploadPlaceholderCompact}>
                        <MdImage className={styles.uploadIconCompact} />
                        <div>
                          <p className={styles.uploadTextCompact}>Click to upload thumbnail</p>
                          <small className={styles.uploadSubCompact}>PNG, JPG (Max 10MB)</small>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Additional Images Upload */}
              <div
                className={styles.additionalUpload}
                onClick={() => setActiveSectionId("images")}
              >
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
                  <label htmlFor="additionalImages" className={styles.uploadAreaCompact}>
                    <div className={styles.uploadPlaceholderCompact}>
                      <MdCloudUpload className={styles.uploadIconCompact} />
                      <div>
                        <p className={styles.uploadTextCompact}>Click to upload extra photos</p>
                        <small className={styles.uploadSubCompact}>Showcase stitch details</small>
                      </div>
                    </div>
                  </label>
                </div>

                {imagesPreviews.length > 0 && (
                  <div className={styles.additionalPreviewsCompact}>
                    {imagesPreviews.map((preview, index) => (
                      <div key={index} className={styles.previewItemCompact}>
                        <img src={preview} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeAdditionalImage(index)}
                          className={styles.removeBtnCompact}
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

          {/* STEP 2: Design Details (Name, Description, Category, Subcategory, Needles, Price) */}
          <div
            className={`${styles.section} ${activeSectionId === "details" ? styles.sectionActive : ""}`}
            onMouseEnter={() => setActiveSectionId("details")}
            onFocus={() => setActiveSectionId("details")}
          >
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <MdCategory className={styles.titleIcon} />
                2. Design Details & Classification
              </h2>
              <span className={styles.required}>Required</span>
            </div>

            {/* Design Name / Title */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Design Name *</label>
                <button
                  type="button"
                  className={styles.writeAiButton}
                  onClick={() => handleWriteWithAi("title")}
                  disabled={refiningField === "title" || processing}
                  title="Click to automatically generate design name with AI"
                >
                  <MdAutoAwesome className={styles.sparkleIcon} />
                  {refiningField === "title" ? "Writing..." : "Write with AI"}
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
                  AI Generated
                </button>
              </div>

              <input
                type="text"
                className="input-custom"
                value={getFieldValue("title")}
                onChange={(e) => handleFieldValueChange("title", e.target.value)}
                placeholder={form.titleSource === "ai" ? "AI generated name will appear here" : "Enter your design name (or click ✨ Write with AI)"}
              />
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Description *</label>
                <button
                  type="button"
                  className={styles.writeAiButton}
                  onClick={() => handleWriteWithAi("description")}
                  disabled={refiningField === "description" || processing}
                  title="Click to automatically write design description with AI"
                >
                  <MdAutoAwesome className={styles.sparkleIcon} />
                  {refiningField === "description" ? "Writing..." : "Write with AI"}
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
                  AI Generated
                </button>
              </div>

              <textarea
                className={`input-custom ${styles.textarea}`}
                value={getFieldValue("description")}
                onChange={(e) => handleFieldValueChange("description", e.target.value)}
                placeholder={form.descriptionSource === "ai" ? "AI generated description will appear here" : "Enter design description (or click ✨ Write with AI)"}
                rows={4}
              />
            </div>

            {/* Category, Subcategory, Needles, Price Grid */}
            <div className={styles.detailsGrid}>
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
                  <option value="">{category ? "Select Subcategory" : "Select category first"}</option>
                  {subcategories.map((subcat) => (
                    <option key={subcat} value={subcat}>{subcat}</option>
                  ))}
                </select>
              </div>

              {/* Number of Needles (1 to 15) */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <MdFormatListNumbered className={styles.fieldIcon} /> Number of Needles *
                </label>
                <select
                  className="input-custom"
                  value={needles}
                  onChange={(e) => setNeedles(e.target.value)}
                  required
                >
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num.toString()}>
                      {num} {num === 1 ? "Needle" : "Needles"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selling Price */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Selling Price (₹) *</label>
                <input
                  type="number"
                  className="input-custom"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Price in rupees"
                  min="1"
                  step="1"
                  required
                />
              </div>
            </div>
          </div>

          {/* STEP 3: Upload Design File & Format */}
          <div
            className={`${styles.section} ${activeSectionId === "fileUpload" ? styles.sectionActive : ""}`}
            onMouseEnter={() => setActiveSectionId("fileUpload")}
            onFocus={() => setActiveSectionId("fileUpload")}
          >
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <MdUploadFile className={styles.titleIcon} />
                3. Upload Design File & Format
              </h2>
              <span className={styles.required}>Required</span>
            </div>

            {/* Design File Format Selection (UPPERCASE) */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Design File Type / Format *</label>
              <div className={styles.formatPillsContainer}>
                {FILE_FORMAT_OPTIONS.map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    className={`${styles.formatPill} ${fileFormat === fmt ? styles.formatPillActive : ""}`}
                    onClick={() => setFileFormat(fmt)}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Design File Upload Box */}
            <div className={styles.zipUploadBox}>
              <input
                type="file"
                accept=".zip,.emb,.dst,.pes,.jef,.exp,.vp3,.art,.xxx,.hus,.vip,.sew"
                onChange={handleDesignFileChange}
                className={styles.fileInput}
                id="designFile"
                disabled={processing}
              />
              <label htmlFor="designFile" className={styles.zipUploadLabelCompact}>
                {designFile ? (
                  <div className={styles.fileSelected}>
                    <MdCheckCircle className={styles.successIcon} />
                    <div>
                      <p className={styles.fileName}>{designFile.name}</p>
                      <small>Click to change file ({fileFormat})</small>
                    </div>
                  </div>
                ) : (
                  <div className={styles.zipPlaceholderCompact}>
                    <MdCloudUpload className={styles.zipIconCompact} />
                    <div>
                      <p className={styles.uploadTextCompact}>Click to upload design file or ZIP</p>
                      <small className={styles.uploadSubCompact}>Supports {fileFormat} and .ZIP files (Max 20MB)</small>
                    </div>
                  </div>
                )}
              </label>

              {processing && (
                <div className={styles.processingIndicator}>
                  <MdAutoAwesome className={styles.spinIcon} />
                  <span>Processing design file...</span>
                </div>
              )}
            </div>

            {/* Clean File Uploaded Status Card (No tedious 50-file manual input boxes!) */}
            {uploadPreview && (
              <div className={styles.fileSuccessCard}>
                <div className={styles.fileSuccessHeader}>
                  <div className={styles.fileSuccessLeft}>
                    <MdFolderZip className={styles.fileSuccessIcon} />
                    <div>
                      <h4 className={styles.fileSuccessTitle}>File Uploaded Successfully</h4>
                      <p className={styles.fileSuccessSubtitle}>
                        {designFile?.name} • <strong>{fileNames.length} file{fileNames.length !== 1 ? "s" : ""} included</strong>
                      </p>
                    </div>
                  </div>

                  {fileNames.length > 1 && (
                    <button
                      type="button"
                      className={styles.toggleFilesBtn}
                      onClick={() => setShowFileList(!showFileList)}
                    >
                      {showFileList ? (
                        <>Hide file list <MdExpandLess /></>
                      ) : (
                        <>View files ({fileNames.length}) <MdExpandMore /></>
                      )}
                    </button>
                  )}
                </div>

                {showFileList && fileNames.length > 0 && (
                  <div className={styles.fileNamesListContainer}>
                    <h5 className={styles.fileListHeading}>Extracted Design Files:</h5>
                    <ul className={styles.fileNamesList}>
                      {fileNames.map((fn, idx) => (
                        <li key={idx}>
                          <span className={styles.fileDot}>•</span> {fn}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
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
              Your design will be reviewed by our team before being published live.
            </p>
          </div>
        </form>

        {/* RIGHT COLUMN: BRIEF SIMPLE-ENGLISH SCROLLING GUIDE CARD (~30%) */}
        <div className={styles.rightSidebar}>
          <div className={styles.fullGuideCard}>
            <div className={styles.mainGuideHeader}>
              <MdInfoOutline className={styles.mainGuideHeaderIcon} />
              <div>
                <h3 className={styles.mainGuideTitle}>Simple Upload Help</h3>
                <p className={styles.mainGuideSubtitle}>Easy instructions to upload your design</p>
              </div>
            </div>

            <div className={styles.guideBlocksContainer}>
              {GUIDE_SECTIONS.map((sec) => {
                const SecIcon = sec.icon;
                const isActive = activeSectionId === sec.id;
                return (
                  <div
                    key={sec.id}
                    className={`${styles.guideBlock} ${isActive ? styles.guideBlockActive : ""}`}
                    onClick={() => setActiveSectionId(sec.id)}
                  >
                    <div className={styles.guideBlockHeader}>
                      <span className={styles.stepBadge}>{sec.stepNum}</span>
                      <SecIcon className={styles.guideBlockIcon} />
                      <h4 className={styles.guideBlockTitle}>{sec.title}</h4>
                    </div>

                    <p className={styles.guideBlockDesc}>{sec.description}</p>

                    <div className={styles.guideBlockDetails}>
                      {sec.details.map((det, idx) => (
                        <div key={idx} className={styles.detailSubBlock}>
                          <h5 className={styles.detailSubtitle}>
                            <MdLightbulbOutline className={styles.detailBulb} />
                            {det.subtitle}
                          </h5>
                          <ul className={styles.detailList}>
                            {det.points.map((pt, pIdx) => (
                              <li key={pIdx}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelUploadV3;
