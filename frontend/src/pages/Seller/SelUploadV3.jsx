/**
 * SelUploadV3 - Unified Upload & Edit Flow (Meesho Style Image Uploader)
 * Order: Images → File Format & Design File Upload → Design Details (Name, Description, Category, Needles, Price)
 * Features:
 * - Single unified photo upload (Meesho theme)
 * - First image is Front/Main Photo with change option
 * - Extra images labeled as "Image 1", "Image 2", etc. with remove options
 * - Design File & Format placed right under Design Photos
 * - Clean standard inputs for Design Name and Description
 * - Supports both "Upload New Design" and "Edit Existing Design" (via ?editId=...)
 * - Unsaved changes prompt on window close / tab navigation
 * - Responsive 70/30 layout with guidance cards
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MdCheckCircle,
  MdUploadFile,
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
  MdWarning,
  MdAddPhotoAlternate,
  MdSync
} from "react-icons/md";
import API from "../../services/api";
import styles from "./SelUploadV3.module.css";

// Available file formats in UPPERCASE
const FILE_FORMAT_OPTIONS = [
  ".DST", ".PES", ".EMB", ".JEF", ".EXP", ".VP3",
  ".ART", ".XXX", ".HUS", ".VIP", ".SEW"
];

// Design Types (Machines Types) options
const DESIGN_MACHINE_TYPE_OPTIONS = [
  "Flat/Multi Designs",
  "Only Cording Designs",
  "Only Sequin Designs",
  "Only Chain Stitch Designs",
  "Multi+Cording Designs",
  "Multi+Cording+Sequin Designs",
  "Multi+Sequin Designs",
  "Multi+Chain Stitch Designs",
  "Dual & Sandwich Sequin",
  "Cording + Sequin Designs",
  "Beads and Sequin Designs",
  "2/4/6 Sequin Design"
];

// Design Area options
const DESIGN_AREA_OPTIONS = [
  "100 mm",
  "125 mm",
  "150 mm",
  "175 mm",
  "200 mm",
  "225 mm",
  "250 mm",
  "300 mm",
  "330 mm",
  "400 mm",
  "500 mm",
  "600 mm"
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
        subtitle: "Front Photo (Main)",
        points: [
          "The first photo is your main cover photo.",
          "You can change the front photo anytime."
        ]
      },
      {
        subtitle: "Extra Photos (Image 1 to 5)",
        points: [
          "Upload up to 5 extra photos.",
          "Show close-up stitches, fabric, and thread work."
        ]
      }
    ]
  },
  {
    id: "fileUpload",
    stepNum: "2",
    title: "2. File Format & Upload",
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
  },
  {
    id: "details",
    stepNum: "3",
    title: "3. Design Details & Pricing",
    icon: MdCategory,
    description: "Type your design details, category, and needle count.",
    details: [
      {
        subtitle: "Name & Description",
        points: [
          "Type a clear design name (e.g. Saree Pallu Floral Design).",
          "Add helpful details, dimensions, and stitch notes."
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

  // Form state - Images (Meesho style)
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState(null);

  const [additionalImages, setAdditionalImages] = useState([]);
  const [imagesPreviews, setImagesPreviews] = useState([]);
  const [existingAdditionalImages, setExistingAdditionalImages] = useState([]); // [{ index: 0, src: '...' }]

  // Form state - File Format & File Upload
  const [fileFormat, setFileFormat] = useState(".EMB");
  const [designFile, setDesignFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [uploadPreview, setUploadPreview] = useState(null);
  const [embMetadata, setEmbMetadata] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [showFileList, setShowFileList] = useState(false);

  // Form state - Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [machineType, setMachineType] = useState("");
  const [area, setArea] = useState("");
  const [needles, setNeedles] = useState("1");
  const [price, setPrice] = useState("");

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

      setTitle(d.title_original || d.title || "");
      setDescription(d.description_original || d.description || "");
      setCategory(d.category || "");
      setSubcategory(d.subcategory || "");
      setMachineType(d.machine_type || d.design_type || "");
      setArea(d.area || "");
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

  // Meesho Theme: Unified image upload handler
  const handleUnifiedImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = "";
    if (files.length === 0) return;

    const oversized = files.find(f => f.size > 10 * 1024 * 1024);
    if (oversized) {
      alert(`"${oversized.name}" exceeds 10MB. Please use a smaller image.`);
      return;
    }

    try {
      const compressed = await Promise.all(files.map(compressImage));
      let availableFiles = [...compressed];

      // If no front photo exists, set the first file as front photo
      if (!thumbnail && !thumbnailPreview && availableFiles.length > 0) {
        const frontFile = availableFiles.shift();
        setThumbnail(frontFile);
        setThumbnailPreview(URL.createObjectURL(frontFile));
      }

      // Any remaining files go to additional extra images
      if (availableFiles.length > 0) {
        const totalExistingExtra = existingAdditionalImages.length + additionalImages.length;
        const maxCanAdd = 5 - totalExistingExtra;
        if (maxCanAdd <= 0) {
          alert("Maximum 5 extra photos allowed (6 total photos).");
        } else {
          const toAdd = availableFiles.slice(0, maxCanAdd);
          if (availableFiles.length > maxCanAdd) {
            alert(`Only ${maxCanAdd} extra photo(s) added. Maximum limit is 5 extra photos.`);
          }
          setAdditionalImages(prev => [...prev, ...toAdd]);
          setImagesPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
        }
      }
      setIsDirty(true);
    } catch (err) {
      alert(err.message || "Failed to process images");
    }
  };

  // Change only the Front Photo
  const handleChangeFrontPhoto = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert(`"${file.name}" exceeds 10MB. Please use a smaller image.`);
      return;
    }
    try {
      const compressed = await compressImage(file);
      setThumbnail(compressed);
      setThumbnailPreview(URL.createObjectURL(compressed));
      setIsDirty(true);
    } catch (err) {
      alert(err.message || "Failed to compress photo");
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
      setIsDirty(true);

      // Auto-detect format from extension
      const ext = file.name.slice(file.name.lastIndexOf(".")).toUpperCase();
      if (FILE_FORMAT_OPTIONS.includes(ext)) {
        setFileFormat(ext);
      }

      setUploadPreview({
        file_names: [file.name],
        design_file_path: ""
      });

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

      if (res.data) {
        setSessionId(res.data.session_id || "");
        setUploadPreview(res.data.preview || {
          file_names: res.data.file_names || [file.name],
          design_file_path: res.data.design_file_path || ""
        });
        setEmbMetadata(res.data.emb_metadata || []);

        if (res.data.design_file_type) {
          const detected = "." + res.data.design_file_type.toUpperCase();
          if (FILE_FORMAT_OPTIONS.includes(detected)) {
            setFileFormat(detected);
          }
        }
      }
    } catch (err) {
      console.warn("Design file upload notice: file will be saved directly on submit", err);
      setUploadPreview({
        file_names: [file.name],
        design_file_path: ""
      });
    } finally {
      setProcessing(false);
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
      return alert("Front photo is required");
    }
    if (isEditMode && !thumbnail && !thumbnailPreview) {
      return alert("Front photo is required");
    }

    if (!isEditMode && !designFile && !uploadPreview && !sessionId) {
      return alert("Please upload a design file");
    }
    if (!fileFormat) {
      return alert("Please select a design file format");
    }

    if (!title.trim()) {
      return alert("Please enter design name");
    }
    if (!description.trim()) {
      return alert("Please enter description");
    }
    if (!category || !subcategory) {
      return alert("Please select category and subcategory");
    }
    if (!price || parseFloat(price) <= 0) {
      return alert("Please enter a valid price");
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("title_original", title.trim());
    formData.append("description_original", description.trim());
    formData.append("category", category);
    formData.append("subcategory", subcategory);
    formData.append("machine_type", machineType);
    formData.append("design_type", machineType);
    formData.append("area", area);
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
        if (designFile) {
          formData.append("design_file", designFile);
        }
        if (sessionId) {
          formData.append("session_id", sessionId);
        }
        formData.append("emb_metadata", JSON.stringify(embMetadata));
        formData.append("file_names", JSON.stringify(uploadPreview?.file_names || (designFile ? [designFile.name] : [])));
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

  // Total extra images count
  const totalExtraImages = existingAdditionalImages.length + imagesPreviews.length;
  const hasPhotos = Boolean(thumbnailPreview || existingAdditionalImages.length > 0 || imagesPreviews.length > 0);

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

            {/* ========================================================= */}
            {/* 1. DESIGN PHOTOS (MEESHO THEME) */}
            {/* ========================================================= */}
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>
                  1. Design Photos * <small className={styles.labelSubText}>(PNG, JPG - Max 10MB each)</small>
                </label>
                <span className={styles.photoCountBadge}>
                  {(thumbnailPreview ? 1 : 0) + totalExtraImages}/6 Photos
                </span>
              </div>

              {/* Photos Gallery View */}
              {hasPhotos ? (
                <div className={styles.meeshoGallery}>
                  
                  {/* Slot 0: Front Photo / Main Photo */}
                  {thumbnailPreview && (
                    <div className={styles.meeshoCardWrapper}>
                      <div className={`${styles.meeshoPhotoCard} ${styles.meeshoMainCard}`}>
                        <img src={thumbnailPreview} alt="Front Photo" />
                      </div>
                      <span className={styles.meeshoPhotoLabelMain}>Front Photo</span>
                      <label className={styles.meeshoChangeBtnBelow} title="Change Front Photo">
                        <MdSync size={13} />
                        <span>Change</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleChangeFrontPhoto}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>
                  )}

                  {/* Slot 1..N: Existing Extra Photos (in edit mode) */}
                  {existingAdditionalImages.map((item, index) => (
                    <div key={`existing-${index}`} className={styles.meeshoCardWrapper}>
                      <div className={styles.meeshoPhotoCard}>
                        <img src={item.src} alt={`Image ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeExistingAdditionalImage(index)}
                          className={styles.meeshoRemoveBtn}
                          title="Delete this image"
                        >
                          <MdClose size={13} />
                        </button>
                      </div>
                      <span className={styles.meeshoPhotoLabel}>Image {index + 1}</span>
                    </div>
                  ))}

                  {/* Slot N+1..M: Newly Added Extra Photos */}
                  {imagesPreviews.map((preview, index) => {
                    const displayIndex = existingAdditionalImages.length + index + 1;
                    return (
                      <div key={`new-${index}`} className={styles.meeshoCardWrapper}>
                        <div className={styles.meeshoPhotoCard}>
                          <img src={preview} alt={`Image ${displayIndex}`} />
                          <button
                            type="button"
                            onClick={() => removeNewAdditionalImage(index)}
                            className={styles.meeshoRemoveBtn}
                            title="Delete this image"
                          >
                            <MdClose size={13} />
                          </button>
                        </div>
                        <span className={styles.meeshoPhotoLabel}>Image {displayIndex}</span>
                      </div>
                    );
                  })}

                  {/* Add More Photos Slot (up to 6 total = 1 main + 5 extras) */}
                  {(thumbnailPreview ? 1 : 0) + totalExtraImages < 6 && (
                    <div className={styles.meeshoCardWrapper}>
                      <label className={styles.meeshoAddTile} title="Add more photos">
                        <MdAddPhotoAlternate className={styles.meeshoAddIcon} />
                        <span className={styles.meeshoAddText}>+ Add Photo</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          multiple
                          onChange={handleUnifiedImageUpload}
                          style={{ display: "none" }}
                        />
                      </label>
                      <span className={styles.meeshoPhotoLabelPlaceholder}>Extra Photo</span>
                    </div>
                  )}

                </div>
              ) : (
                /* Initial Empty Dropzone (Select 1 to 6 photos) */
                <label className={styles.meeshoUploadDropzone}>
                  <div className={styles.meeshoDropzoneContent}>
                    <div className={styles.meeshoUploadIconCircle}>
                      <MdCloudUpload size={28} />
                    </div>
                    <h4 className={styles.meeshoDropzoneTitle}>Click or Drag to Upload Photos</h4>
                    <p className={styles.meeshoDropzoneSub}>
                      Select 1 to 6 photos. First image will automatically be set as your <strong>Front Photo</strong>.
                    </p>
                    <span className={styles.meeshoBrowseBtn}>
                      <MdAddPhotoAlternate size={16} /> Choose Images
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    multiple
                    onChange={handleUnifiedImageUpload}
                    style={{ display: "none" }}
                    id="unifiedPhotos"
                  />
                </label>
              )}
            </div>

            {/* ========================================================= */}
            {/* 2. DESIGN FILE FORMAT & DESIGN FILE / ZIP UPLOAD */}
            {/* ========================================================= */}
            <div className={styles.formGroup}>
              <label className={styles.label}>2. Design File Type / Format *</label>
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
                  <MdCloudUpload className={styles.spinIcon} />
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

            {/* ========================================================= */}
            {/* 3. DESIGN DETAILS (NAME, DESCRIPTION, CATEGORY, NEEDLES, PRICE) */}
            {/* ========================================================= */}
            {/* Design Name */}
            <div className={styles.formGroup}>
              <label className={styles.label}>3. Design Name *</label>
              <input
                type="text"
                className="input-custom"
                value={title}
                onChange={(e) => {
                  setIsDirty(true);
                  setTitle(e.target.value);
                }}
                placeholder="Enter design name (e.g. Saree Pallu Floral Design)"
                required
              />
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Description *</label>
              <textarea
                className={`input-custom ${styles.textarea}`}
                value={description}
                onChange={(e) => {
                  setIsDirty(true);
                  setDescription(e.target.value);
                }}
                placeholder="Enter detailed description of your embroidery design"
                rows={4}
                required
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

            {/* Design Types (Machines Types) & Area - Displayed when Subcategory is selected */}
            {subcategory && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Design Types (Machines Types) *</label>
                  <select
                    className="input-custom"
                    value={machineType}
                    onChange={(e) => {
                      setIsDirty(true);
                      setMachineType(e.target.value);
                    }}
                    required
                  >
                    <option value="">Choose Design Types (machines types)</option>
                    {DESIGN_MACHINE_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Area *</label>
                  <select
                    className="input-custom"
                    value={area}
                    onChange={(e) => {
                      setIsDirty(true);
                      setArea(e.target.value);
                    }}
                    required
                  >
                    <option value="">Choose Area</option>
                    {DESIGN_AREA_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

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
