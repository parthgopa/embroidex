import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MdCheckCircle, 
  MdUploadFile, 
  MdImage, 
  MdAutoAwesome, 
  MdClose,
  MdArrowForward,
  MdArrowBack
} from "react-icons/md";
import API from "../../services/api";
import styles from "./SelUploadV3.module.css";

const SelUploadV3 = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState({});
  const [step, setStep] = useState(1); // 1: Upload ZIP, 2: Preview & Edit
  
  // Step 1 state
  const [designFile, setDesignFile] = useState(null);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [processing, setProcessing] = useState(false);
  
  // Step 2 state (preview data)
  const [sessionId, setSessionId] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [imagesPreviews, setImagesPreviews] = useState([]);
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

  const handleDesignFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext !== 'zip' && ext !== 'emb') {
        alert("Please upload a .zip or .emb file");
        return;
      }
      setDesignFile(file);
    }
  };

  const handleProcessUpload = async (e) => {
    e.preventDefault();

    if (!designFile) {
      return alert("Please select a design file");
    }

    setProcessing(true);

    const formData = new FormData();
    formData.append("design_file", designFile);
    formData.append("category", category);
    formData.append("subcategory", subcategory);

    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/seller/process-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      // Store session ID and preview data
      setSessionId(res.data.session_id);
      setPreviewData(res.data);
      
      // Auto-fill title and description
      setForm({
        title: res.data.title,
        description: res.data.description,
        price: "",
      });

      // Move to step 2
      setStep(2);
      
      alert(`Design processed!\n\nFiles found: ${res.data.file_names.length}\nTotal stitches: ${res.data.total_stitch_count}\n\nPlease review and edit the details below.`);
    } catch (err) {
      alert(err.response?.data?.error || "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 7) {
      alert("Maximum 7 additional images allowed");
      return;
    }
    
    setAdditionalImages(files);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setImagesPreviews(previews);
  };

  const removeAdditionalImage = (index) => {
    const newImages = additionalImages.filter((_, i) => i !== index);
    const newPreviews = imagesPreviews.filter((_, i) => i !== index);
    setAdditionalImages(newImages);
    setImagesPreviews(newPreviews);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();

    if (!thumbnail) {
      return alert("Thumbnail is required");
    }

    if (!form.title || !form.description || !form.price) {
      return alert("Please fill all required fields");
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("category", category);
    formData.append("subcategory", subcategory);
    formData.append("price", form.price);
    formData.append("thumbnail", thumbnail);

    additionalImages.forEach((img) => {
      formData.append("additional_images", img);
    });

    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/seller/final-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      alert(`Design uploaded successfully!\n\nYour design is now pending admin approval.`);
      
      // Reset form
      setStep(1);
      setDesignFile(null);
      setCategory("");
      setSubcategory("");
      setForm({ title: "", description: "", price: "" });
      setThumbnail(null);
      setAdditionalImages([]);
      setThumbnailPreview(null);
      setImagesPreviews([]);
      setPreviewData(null);
      
      navigate("/seller/my-designs");
    } catch (err) {
      alert(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const subcategories = category ? categories[category] || [] : [];

  return (
    <div className={styles.container}>
      <div className="container">
        <div className={`container-box ${styles.card}`}>
          <h2 className={styles.title}>Upload Design</h2>
          <p className={styles.subtitle}>
            {step === 1 ? "Upload your design file for AI processing" : "Review and finalize your design"}
          </p>

          {/* Step Indicator */}
          <div className={styles.stepIndicator}>
            <div className={`${styles.stepItem} ${step >= 1 ? styles.active : ""}`}>
              <div className={styles.stepNumber}>1</div>
              <span>Upload & Process</span>
            </div>
            <div className={styles.stepLine}></div>
            <div className={`${styles.stepItem} ${step >= 2 ? styles.active : ""}`}>
              <div className={styles.stepNumber}>2</div>
              <span>Review & Submit</span>
            </div>
          </div>

          {/* STEP 1: Upload ZIP File */}
          {step === 1 && (
            <form onSubmit={handleProcessUpload}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  Design File (ZIP/EMB) <span className={styles.required}>*</span>
                </h3>
                <div className="file-upload">
                  <input
                    type="file"
                    accept=".zip,.emb"
                    onChange={handleDesignFileChange}
                    id="designFile"
                    required
                  />
                  <p>{designFile ? `Selected: ${designFile.name}` : "Upload ZIP or EMB file (Max 20MB)"}</p>
                  <small>The system will extract files and generate title/description using AI</small>
                </div>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  Category <span className={styles.required}>*</span>
                </h3>
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
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {category && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    Subcategory <span className={styles.required}>*</span>
                  </h3>
                  <select
                    className="input-custom"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    required
                  >
                    <option value="">Select Subcategory</option>
                    {subcategories.map((subcat) => (
                      <option key={subcat} value={subcat}>
                        {subcat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className={`btn-primary-custom ${styles.submitBtn}`}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <MdAutoAwesome style={{ marginRight: '8px' }} />
                    Processing with AI...
                  </>
                ) : (
                  <>
                    Process Design
                    <MdArrowForward style={{ marginLeft: '8px' }} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Preview & Edit */}
          {step === 2 && previewData && (
            <form onSubmit={handleFinalSubmit}>
              {/* AI Generated Preview */}
              <div className={styles.previewBox}>
                <h3>
                  <MdAutoAwesome style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  AI Generated Information
                </h3>
                <div className={styles.previewGrid}>
                  <div className={styles.previewItem}>
                    <strong>Files Found:</strong> {previewData.file_names.length}
                  </div>
                  <div className={styles.previewItem}>
                    <strong>Total Stitches:</strong> {previewData.total_stitch_count.toLocaleString()}
                  </div>
                  <div className={styles.previewItem}>
                    <strong>EMB Files:</strong> {previewData.emb_files_count}
                  </div>
                </div>
                <div className={styles.filesList}>
                  <strong>Extracted Files:</strong>
                  <ul>
                    {previewData.file_names.slice(0, 10).map((name, idx) => (
                      <li key={idx}>{name}</li>
                    ))}
                    {previewData.file_names.length > 10 && <li>...and {previewData.file_names.length - 10} more</li>}
                  </ul>
                </div>
              </div>

              {/* Editable Fields */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  Design Title <span className={styles.required}>*</span>
                </h3>
                <input
                  type="text"
                  name="title"
                  className="input-custom"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="Edit the AI-generated title"
                  required
                />
                <small className={styles.hint}>
                  <MdAutoAwesome style={{ marginRight: '4px', verticalAlign: 'middle', fontSize: '14px' }} />
                  AI-generated, you can edit it
                </small>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  Description <span className={styles.required}>*</span>
                </h3>
                <textarea
                  name="description"
                  className={`input-custom ${styles.textarea}`}
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Edit the AI-generated description"
                  rows={4}
                  required
                />
                <small className={styles.hint}>
                  <MdAutoAwesome style={{ marginRight: '4px', verticalAlign: 'middle', fontSize: '14px' }} />
                  AI-generated, you can edit it
                </small>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  Price (₹) <span className={styles.required}>*</span>
                </h3>
                <input
                  type="number"
                  name="price"
                  className="input-custom"
                  value={form.price}
                  onChange={handleFormChange}
                  placeholder="Enter price in rupees"
                  min="1"
                  required
                />
              </div>

              {/* Thumbnail Upload */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  Thumbnail Image <span className={styles.required}>*</span>
                </h3>
                <div className={styles.fileUploadArea}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleThumbnailChange}
                    className={styles.fileInput}
                    id="thumbnail"
                    required
                  />
                  <label htmlFor="thumbnail" className={styles.fileLabel}>
                    {thumbnailPreview ? (
                      <img src={thumbnailPreview} alt="Thumbnail" className={styles.preview} />
                    ) : (
                      <div className={styles.uploadPlaceholder}>
                        <MdImage className={styles.uploadIcon} />
                        <p>Click to upload thumbnail</p>
                        <small>PNG, JPG (Max 5MB)</small>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Additional Images */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  Additional Images (Max 7)
                </h3>
                <div className="file-upload">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    multiple
                    onChange={handleAdditionalImagesChange}
                    id="additionalImages"
                  />
                  <p>Upload multiple design images to showcase your work</p>
                </div>
                
                {imagesPreviews.length > 0 && (
                  <div className={styles.imagesGrid}>
                    {imagesPreviews.map((preview, index) => (
                      <div key={index} className={styles.imagePreview}>
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

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-outline-custom"
                >
                  <MdArrowBack style={{ marginRight: '8px' }} />
                  Back
                </button>
                <button
                  type="submit"
                  className={`btn-primary-custom ${styles.submitBtn}`}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : (
                    <>
                      Submit Design
                      <MdCheckCircle style={{ marginLeft: '8px' }} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelUploadV3;
