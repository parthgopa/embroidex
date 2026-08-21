/**
 * SelUploadV3 - Unified Upload & Edit Flow
 * Order: Images → Design Details (Name, Description, Category, Needles, Price) → File Format & Upload File
 * Features:
 * - Supports both "Upload New Design" and "Edit Existing Design" (via ?editId=...)
 * - Prominent "✨ Write with AI" buttons for Title & Description
 * - Unsaved changes prompt on window close / tab navigation
 * - Responsive 70/30 layout with guidance cards
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MdCheckCircle,
  MdUploadFile,
  MdImage,
  MdAutoAwesome,
  MdClose,
  MdCloudUpload,
  MdPhotoLibrary,
  MdInfoOutline,
  MdCategory,
  MdFormatListNumbered,
  MdFolderZip,
  MdExpandMore,
  MdExpandLess,
  MdArrowBack,
  MdEdit,
  MdWarning
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
        subtitle: "First Photo *",
        points: [
          "Upload 1 main photo for design preview.",
          "Use JPG or PNG photo (Max 10 MB)."
        ]
      },
      {
        subtitle: "Extra Photos (Max 5)",
        points: [
          "Upload up to 5 extra photos.",
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
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("editId");
  const isEditMode = Boolean(editId);

  const [categories, setCategories] = useState({});
  const [loadingDesign, setLoadingDesign] = useState(isEditMode);
  const [isDirty, setIsDirty] = useState(false);

  // Form state - Images
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState(null);

  const [additionalImages, setAdditionalImages] = useState([]);
  const [imagesPreviews, setImagesPreviews] = useState([]);
  const [existingAdditionalImages, setExistingAdditionalImages] = useState([]); // [{ index: 0, src: '...' }]

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
  const [existingFiles, setExistingFiles] = useState([]);
  const [showFileList, setShowFileList] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Initial load
  useEffect(() => {
    fetchCategories();
    if (editId) {
      fetchDesignForEdit(editId);
    }
  }, [editId]);

  // Unsaved Changes: BeforeUnload browser warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  const fetchCategories = async () => {
    try {
      const res = await API.get("/seller/categories");
      setCategories(res.data.categories || {});
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  const fetchDesignForEdit = async (id) => {
    setLoadingDesign(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/seller/design/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = res.data.design;
      if (!d) throw new Error("Design not found");

      setForm({
        titleOriginal: d.title_original || d.title || "",
        titleAi: d.title_ai || "",
        titleSource: d.title_source || "original",
        descriptionOriginal: d.description_original || d.description || "",
        descriptionAi: d.description_ai || "",
        descriptionSource: d.description_source || "original",
      });

      setCategory(d.category || "");
      setSubcategory(d.subcategory || "");
      setNeedles(String(d.needles || "1"));
      setPrice(String(d.price || ""));

      if (d.file_format) {
        const fmt = d.file_format.startsWith(".") ? d.file_format.toUpperCase() : "." + d.file_format.toUpperCase();
        setFileFormat(fmt);
      }

      if (d.thumbnail) {
        setThumbnailPreview(d.thumbnail);
        setExistingThumbnailUrl(d.thumbnail);
      }

      if (d.additional_images && Array.isArray(d.additional_images)) {
        setExistingAdditionalImages(
          d.additional_images.map((img, idx) => ({ index: idx, src: img }))
        );
      }

      if (d.file_names && Array.isArray(d.file_names)) {
        setExistingFiles(d.file_names);
      }

      setIsDirty(false);
    } catch (err) {
      console.error("Failed to load design for editing", err);
      alert("Failed to load design details for editing.");
      navigate("/seller/my-designs");
    } finally {
      setLoadingDesign(false);
    }
  };

  // Image compressor
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
      setIsDirty(true);
    } catch (err) {
      alert(err.message);
      e.target.value = "";
    }
  };

  const handleAdditionalImagesChange = async (e) => {
    const newFiles = Array.from(e.target.files);
    e.target.value = "";

    const totalCurrent = existingAdditionalImages.length + additionalImages.length;
    if (totalCurrent + newFiles.length > 5) {
      alert(`You can have a maximum of 5 extra photos. You already have ${totalCurrent}.`);
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
      setIsDirty(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const removeExistingAdditionalImage = (indexToRemove) => {
    setExistingAdditionalImages(prev => prev.filter((_, i) => i !== indexToRemove));
    setIsDirty(true);
  };

  const removeNewAdditionalImage = (indexToRemove) => {
    setAdditionalImages(prev => prev.filter((_, i) => i !== indexToRemove));
    setImagesPreviews(prev => prev.filter((_, i) => i !== indexToRemove));
    setIsDirty(true);
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
      setIsDirty(true);
      processDesignFile(file);
    }
  };

  const processDesignFile = async (file) => {
    setProcessing(true);
    const formData = new FormData();
    formData.append("design_file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/seller/upload-zip", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setSessionId(res.data.session_id);
      setUploadPreview(res.data.preview);
      setEmbMetadata(res.data.preview?.emb_metadata || []);

      if (res.data.preview?.detected_format) {
        const detected = "." + res.data.preview.detected_format.toUpperCase();
        if (FILE_FORMAT_OPTIONS.includes(detected)) {
          setFileFormat(detected);
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to process design file");
      setDesignFile(null);
    } finally {
      setProcessing(false);
    }
  };

  // Form value helpers
  const handleFieldValueChange = (field, value) => {
    setIsDirty(true);
    if (field === "title") {
      setForm(prev => ({
        ...prev,
        titleOriginal: form.titleSource === "original" ? value : prev.titleOriginal,
        titleAi: form.titleSource === "ai" ? value : prev.titleAi,
      }));
    } else if (field === "description") {
      setForm(prev => ({
        ...prev,
        descriptionOriginal: form.descriptionSource === "original" ? value : prev.descriptionOriginal,
        descriptionAi: form.descriptionSource === "ai" ? value : prev.descriptionAi,
      }));
    }
  };

  const getFieldValue = (field) => {
    if (field === "title") {
      return form.titleSource === "ai" ? form.titleAi : form.titleOriginal;
    }
    if (field === "description") {
      return form.descriptionSource === "ai" ? form.descriptionAi : form.descriptionOriginal;
    }
    return "";
  };

  const handleContentSourceChange = (field, source) => {
    setIsDirty(true);
    setForm(prev => ({
      ...prev,
      [`${field}Source`]: source
    }));
  };

  // AI Generator
  const handleWriteWithAi = async (fieldType) => {
    setRefiningField(fieldType);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        "/seller/refine-text",
        {
          field_type: fieldType,
          original_text: fieldType === "title" ? (form.titleOriginal || form.titleAi) : (form.descriptionOriginal || form.descriptionAi),
          category: category,
          subcategory: subcategory,
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
      setIsDirty(true);
    } catch (err) {
      alert(err.response?.data?.error || `Failed to write ${fieldType} with AI`);
    } finally {
      setRefiningField("");
    }
  };

  // Cancel with unsaved check
  const handleCancel = () => {
    if (isDirty) {
      const confirmLeave = window.confirm("You have unsaved changes. Are you sure you want to leave without saving?");
      if (!confirmLeave) return;
    }
    navigate("/seller/my-designs");
  };

  // Submission handler (handles both NEW and UPDATE)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEditMode && !thumbnail) {
      return alert("First photo is required");
    }
    if (isEditMode && !thumbnail && !thumbnailPreview) {
      return alert("First photo is required");
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
    if (!fileFormat) {
      return alert("Please select a design file format");
    }
    if (!isEditMode && (!designFile || !uploadPreview || !sessionId)) {
      return alert("Please upload a design file");
    }

    const selectedTitle = form.titleSource === "ai" ? form.titleAi : (form.titleOriginal || form.titleAi);
    const selectedDescription = form.descriptionSource === "ai" ? form.descriptionAi : (form.descriptionOriginal || form.descriptionAi);

    setSubmitting(true);

    const formData = new FormData();
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

    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    // Handle additional images
    if (isEditMode) {
      const keptIndices = existingAdditionalImages.map(img => img.index);
      formData.append("kept_image_indices_json", JSON.stringify(keptIndices));
    }

    additionalImages.forEach((img) => {
      formData.append("additional_images", img);
    });

    try {
      const token = localStorage.getItem("token");

      if (isEditMode) {
        // UPDATE EXISTING DESIGN
        if (designFile) {
          formData.append("design_file", designFile);
        }

        const res = await API.put(`/seller/design/${editId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });

        setIsDirty(false);
        alert(res.data?.message || "✓ Design updated successfully!");
        navigate("/seller/my-designs");
      } else {
        // CREATE NEW DESIGN
        formData.append("session_id", sessionId);
        formData.append("emb_metadata", JSON.stringify(embMetadata));
        formData.append("file_names", JSON.stringify(uploadPreview?.file_names || []));
        formData.append("design_file_path", uploadPreview?.design_file_path || "");

        await API.post("/seller/final-upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });

        setIsDirty(false);
        alert("✓ Design uploaded successfully!\n\nYour design is pending admin approval.");
        navigate("/seller/my-designs");
      }
    } catch (err) {
      alert(err.response?.data?.error || (isEditMode ? "Update failed" : "Upload failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const subcategories = category ? categories[category] || [] : [];
  const fileNames = uploadPreview?.file_names || [];

  if (loadingDesign) {
    return (
      <div className={styles.fullWidthContainer}>
        <div className={styles.loadingBox}>
          <div className={styles.spinner}></div>
          <p>Loading design details for editing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.fullWidthContainer}>
      <div className={styles.header}>
        <div className={styles.headerTitleRow}>
          <div>
            <h1 className={styles.title}>
              {isEditMode ? "Edit Embroidery Design" : "Upload New Design"}
            </h1>
            <p className={styles.subtitle}>
              {isEditMode 
                ? "Update your design photos, details, pricing, or embroidery files below" 
                : "Follow the simple steps below to upload your embroidery design"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className={styles.backBtn}
            title="Cancel and return to designs list"
          >
            <MdArrowBack size={16} /> Back to My Designs
          </button>
        </div>

        {isDirty && (
          <div className={styles.unsavedWarningPill}>
            <MdWarning size={14} /> Unsaved changes
          </div>
        )}
      </div>

      <div className={styles.layoutGrid}>
        {/* LEFT COLUMN: FORM INPUTS (~70%) */}
        <form onSubmit={handleSubmit} className={styles.uploadForm} noValidate>

          <div className={styles.singleFormCard}>

            {/* First Photo Upload */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                First Photo * <small className={styles.labelSubText}>(PNG, JPG - Max 10MB)</small>
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleThumbnailChange}
                className={styles.simpleFileInput}
                id="thumbnail"
              />
              {thumbnailPreview && (
                <div className={styles.simplePreviewWrapper}>
                  <img src={thumbnailPreview} alt="First Photo Preview" className={styles.previewImageSimple} />
                  <span className={styles.simpleFileName}>
                    {thumbnail?.name || (isEditMode ? "Current First Photo (Click above to replace)" : "Selected photo")}
                  </span>
                </div>
              )}
            </div>

            {/* Extra Photos Upload */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Extra Photos <small className={styles.labelSubText}>(Max 5 extra photos)</small>
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                multiple
                onChange={handleAdditionalImagesChange}
                className={styles.simpleFileInput}
                id="additionalImages"
              />

              {/* Combined Previews: Existing + Newly Added */}
              {(existingAdditionalImages.length > 0 || imagesPreviews.length > 0) && (
                <div className={styles.additionalPreviewsCompact}>
                  {/* Existing Images in Edit Mode */}
                  {existingAdditionalImages.map((item, index) => (
                    <div key={`existing-${index}`} className={styles.previewItemCompact}>
                      <img src={item.src} alt={`Existing Photo ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeExistingAdditionalImage(index)}
                        className={styles.removeBtnCompact}
                        title="Remove this extra photo"
                      >
                        <MdClose />
                      </button>
                    </div>
                  ))}

                  {/* Newly selected images */}
                  {imagesPreviews.map((preview, index) => (
                    <div key={`new-${index}`} className={styles.previewItemCompact}>
                      <img src={preview} alt={`New Extra Photo ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => removeNewAdditionalImage(index)}
                        className={styles.removeBtnCompact}
                        title="Remove photo"
                      >
                        <MdClose />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

            {/* Category */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Category *</label>
              <select
                className="input-custom"
                value={category}
                onChange={(e) => {
                  setIsDirty(true);
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

            {/* Subcategory */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Subcategory *</label>
              <select
                className="input-custom"
                value={subcategory}
                onChange={(e) => {
                  setIsDirty(true);
                  setSubcategory(e.target.value);
                }}
                required
                disabled={!category}
              >
                <option value="">{category ? "Select Subcategory" : "Select category first"}</option>
                {subcategories.map((subcat) => (
                  <option key={subcat} value={subcat}>{subcat}</option>
                ))}
              </select>
            </div>

            {/* Number of Needles */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <MdFormatListNumbered className={styles.fieldIcon} /> Number of Needles *
              </label>
              <select
                className="input-custom"
                value={needles}
                onChange={(e) => {
                  setIsDirty(true);
                  setNeedles(e.target.value);
                }}
                required
              >
                {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num.toString()}>
                    {num} {num === 1 ? "Needle" : "Needles"}
                  </option>
                ))}
              </select>
            </div>

            {/* Design File Type & File Upload */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Design File Type / Format *</label>
              <div className={styles.formatPillsContainer}>
                {FILE_FORMAT_OPTIONS.map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    className={`${styles.formatPill} ${fileFormat === fmt ? styles.formatPillActive : ""}`}
                    onClick={() => {
                      setIsDirty(true);
                      setFileFormat(fmt);
                    }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                {isEditMode ? "Replace Design File / ZIP (Optional)" : "Upload Design File or ZIP *"} 
                <small className={styles.labelSubText}> (Supports {fileFormat || "all formats"} & .ZIP - Max 20MB)</small>
              </label>
              <input
                type="file"
                accept=".zip,.emb,.dst,.pes,.jef,.exp,.vp3,.art,.xxx,.hus,.vip,.sew"
                onChange={handleDesignFileChange}
                className={styles.simpleFileInput}
                id="designFile"
                disabled={processing}
              />

              {isEditMode && !designFile && existingFiles.length > 0 && (
                <div className={styles.existingFileNotice}>
                  <MdFolderZip className={styles.existingFileIcon} />
                  <span>Current design has <strong>{existingFiles.length} file(s)</strong> attached ({existingFiles.slice(0, 3).join(", ")}{existingFiles.length > 3 ? "..." : ""}). Upload a new file only if replacing.</span>
                </div>
              )}

              {processing && (
                <div className={styles.processingIndicator}>
                  <MdAutoAwesome className={styles.spinIcon} />
                  <span>Processing design file...</span>
                </div>
              )}
            </div>

            {/* Clean File Uploaded Status Card */}
            {uploadPreview && (
              <div className={styles.fileSuccessCard}>
                <div className={styles.fileSuccessHeader}>
                  <div className={styles.fileSuccessLeft}>
                    <MdFolderZip className={styles.fileSuccessIcon} />
                    <div>
                      <h4 className={styles.fileSuccessTitle}>File Processed Successfully</h4>
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

            {/* Selling Price (₹) */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Selling Price (₹) *</label>
              <input
                type="number"
                className="input-custom"
                value={price}
                onChange={(e) => {
                  setIsDirty(true);
                  setPrice(e.target.value);
                }}
                placeholder="Price in rupees"
                min="1"
                step="1"
                required
              />
            </div>

          </div>

          {/* Submit Button Section */}
          <div className={styles.submitSection}>
            <button
              type="submit"
              className={`btn-primary-custom ${styles.submitButton}`}
              disabled={submitting || processing}
            >
              {submitting ? (
                <>
                  <MdCloudUpload className={styles.btnIcon} />
                  {isEditMode ? "Updating Design..." : "Uploading..."}
                </>
              ) : isEditMode ? (
                <>
                  <MdEdit className={styles.btnIcon} />
                  Update Design
                </>
              ) : (
                <>
                  <MdCheckCircle className={styles.btnIcon} />
                  Submit Design for Approval
                </>
              )}
            </button>
            <p className={styles.submitNote}>
              {isEditMode 
                ? "Your design updates will be saved immediately." 
                : "Your design will be reviewed by our team before being published live."}
            </p>
          </div>
        </form>

        {/* RIGHT COLUMN: SCROLLING GUIDE CARD (~30%) */}
        <div className={styles.rightSidebar}>
          <div className={styles.fullGuideCard}>
            <div className={styles.mainGuideHeader}>
              <MdInfoOutline className={styles.mainGuideHeaderIcon} />
              <div>
                <h3 className={styles.mainGuideTitle}>
                  {isEditMode ? "Editing Instructions" : "Upload Instructions"}
                </h3>
                <p className={styles.mainGuideSubtitle}>Follow simple rules for quick approval</p>
              </div>
            </div>

            <div className={styles.guideBlocksContainer}>
              {GUIDE_SECTIONS.map((section) => {
                const IconComponent = section.icon;
                return (
                  <div key={section.id} className={styles.guideBlock}>
                    <div className={styles.guideBlockHeader}>
                      <span className={styles.stepBadge}>{section.stepNum}</span>
                      <IconComponent className={styles.guideBlockIcon} />
                      <h4 className={styles.guideBlockTitle}>{section.title}</h4>
                    </div>

                    <p className={styles.guideBlockDesc}>{section.description}</p>

                    <div className={styles.guideBlockDetails}>
                      {section.details.map((item, idx) => (
                        <div key={idx} className={styles.guideSubSection}>
                          <h5 className={styles.guideSubTitle}>{item.subtitle}</h5>
                          <ul className={styles.guidePointsList}>
                            {item.points.map((pt, pIdx) => (
                              <li key={pIdx}>• {pt}</li>
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
