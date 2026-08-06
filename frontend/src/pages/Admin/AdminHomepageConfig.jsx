import { useState, useEffect } from "react";
import { MdAdd, MdDelete, MdSave, MdUpload } from "react-icons/md";
import API from "../../services/api";
import styles from "./AdminDashboardV2.module.css";

const BASE_URL = API.defaults.baseURL.replace("/api", "");

const AdminHomepageConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});
  const [config, setConfig] = useState({
    topCategories: [],
    showcases: [],
  });
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [configRes, catRes] = await Promise.all([
        API.get("/admin/homepage-config", { headers }),
        API.get("/seller/categories"),
      ]);

      setConfig(configRes.data);
      setAvailableCategories(Object.keys(catRes.data.categories));
    } catch (err) {
      console.error("Failed to fetch config", err);
      alert("Failed to load homepage configuration.");
    } finally {
      setLoading(false);
    }
  };

  // ── Save entire config ─────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      await API.post("/admin/homepage-config", config, { headers });
      alert("Homepage configuration saved successfully!");
    } catch (err) {
      console.error("Failed to save", err);
      alert("Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  // ── Top Categories ─────────────────────────────────────────────────────────
  const toggleTopCategory = (category) => {
    let cats = [...(config.topCategories || [])];
    if (cats.includes(category)) {
      cats = cats.filter((c) => c !== category);
    } else {
      if (cats.length >= 4) {
        alert("You can only select up to 4 top categories.");
        return;
      }
      cats.push(category);
    }
    setConfig({ ...config, topCategories: cats });
  };

  // ── Showcase helpers ───────────────────────────────────────────────────────
  const addShowcase = () => {
    const newShowcase = {
      title: "",
      description: "",
      category: availableCategories[0] || "",
      images: [], // flexible, not hardcoded to 4
    };
    setConfig({ ...config, showcases: [...(config.showcases || []), newShowcase] });
  };

  const removeShowcase = (index) => {
    const s = [...config.showcases];
    s.splice(index, 1);
    setConfig({ ...config, showcases: s });
  };

  const updateShowcase = (index, field, value) => {
    const s = [...config.showcases];
    s[index][field] = value;
    setConfig({ ...config, showcases: s });
  };

  const updateImageName = (showcaseIndex, imgIndex, value) => {
    const s = [...config.showcases];
    s[showcaseIndex].images[imgIndex] = {
      ...s[showcaseIndex].images[imgIndex],
      name: value,
    };
    setConfig({ ...config, showcases: s });
  };

  const removeImage = (showcaseIndex, imgIndex) => {
    const s = [...config.showcases];
    s[showcaseIndex].images.splice(imgIndex, 1);
    setConfig({ ...config, showcases: s });
  };

  // ── Image upload ───────────────────────────────────────────────────────────
  // Fix: do NOT set Content-Type manually — let browser/Axios set the multipart boundary
  const handleImageUpload = async (showcaseIndex, file) => {
    if (!file) return;
    const uploadKey = `${showcaseIndex}-${Date.now()}`;
    setUploading((prev) => ({ ...prev, [uploadKey]: true }));

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", file);

      const res = await API.post("/admin/showcase-image-upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // ⚠️  Do NOT set Content-Type here — Axios sets it automatically with boundary
        },
      });

      // Push the new image into the showcase's images array
      const s = [...config.showcases];
      if (!s[showcaseIndex].images) s[showcaseIndex].images = [];
      s[showcaseIndex].images.push({ url: res.data.url, name: "" });
      setConfig({ ...config, showcases: s });
    } catch (err) {
      console.error("Upload failed", err.response?.data || err);
      alert(err.response?.data?.error || "Failed to upload image.");
    } finally {
      setUploading((prev) => {
        const n = { ...prev };
        delete n[uploadKey];
        return n;
      });
    }
  };

  const anyUploading = Object.keys(uploading).length > 0;

  if (loading) return <div style={{ padding: "40px" }}>Loading configuration…</div>;

  return (
    <div className={styles.section}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 className={styles.pageTitle}>Homepage Configuration</h1>
        <button
          onClick={handleSave}
          disabled={saving || anyUploading}
          style={{ padding: "10px 20px", background: "var(--primary)", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}
        >
          <MdSave /> {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* ─── Top Categories ─────────────────────────────────────────────── */}
      <div className={`container-box ${styles.activityBox}`} style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "8px", color: "var(--text-dark)" }}>
          Top Navigation Categories <span style={{ fontWeight: 400, fontSize: "14px", color: "var(--text-light)" }}>(Max 4)</span>
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-light)", marginBottom: "16px" }}>
          Selected categories show as dropdown menus above the hero image. Hovering reveals subcategories.
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {availableCategories.map((cat) => {
            const isSelected = (config.topCategories || []).includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleTopCategory(cat)}
                style={{
                  padding: "8px 16px", borderRadius: "20px",
                  border: `1.5px solid ${isSelected ? "var(--primary)" : "var(--border-color)"}`,
                  background: isSelected ? "var(--primary)" : "white",
                  color: isSelected ? "white" : "var(--text-dark)",
                  cursor: "pointer", transition: "all 0.2s", fontWeight: isSelected ? "600" : "400",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Showcases ──────────────────────────────────────────────────── */}
      <div className={`container-box ${styles.activityBox}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "18px", color: "var(--text-dark)" }}>Category Showcases</h2>
          <button
            onClick={addShowcase}
            style={{ padding: "8px 14px", background: "var(--success, #22c55e)", color: "white", borderRadius: "6px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}
          >
            <MdAdd /> Add Showcase
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "var(--text-light)", marginBottom: "16px" }}>
          Each showcase shows on the homepage. Upload as many images as you want — they appear 4 per row. 
          Clicking any image redirects users to the Explore page with that category pre-filtered.
        </p>

        {(config.showcases || []).length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-light)", border: "1px dashed var(--border-color)", borderRadius: "8px" }}>
            No showcases yet — click <strong>Add Showcase</strong> to create one.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {config.showcases.map((showcase, si) => {
              const isUploadingForThis = Object.keys(uploading).some((k) => k.startsWith(`${si}-`));

              return (
                <div
                  key={si}
                  style={{ border: "1px solid var(--border-color)", borderRadius: "10px", padding: "20px", background: "#fafafa" }}
                >
                  {/* Showcase header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Showcase #{si + 1}</h3>
                    <button
                      onClick={() => removeShowcase(si)}
                      style={{ color: "var(--error, #ef4444)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}
                    >
                      <MdDelete /> Remove
                    </button>
                  </div>

                  {/* Showcase meta fields */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Title *</label>
                      <input
                        type="text"
                        value={showcase.title}
                        onChange={(e) => updateShowcase(si, "title", e.target.value)}
                        placeholder="e.g. Multi Head Machine Designs"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "14px", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>
                        Category (for Explore filter when image clicked)
                      </label>
                      <select
                        value={showcase.category || ""}
                        onChange={(e) => updateShowcase(si, "category", e.target.value)}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "14px", background: "white", boxSizing: "border-box" }}
                      >
                        <option value="">— No filter —</option>
                        {availableCategories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>Description (optional)</label>
                      <input
                        type="text"
                        value={showcase.description || ""}
                        onChange={(e) => updateShowcase(si, "description", e.target.value)}
                        placeholder="Short subtitle shown below the title"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "14px", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  {/* Image grid — flexible, 4 per row */}
                  <h4 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", color: "var(--text-dark)" }}>
                    Design Images — {(showcase.images || []).length} uploaded
                    <span style={{ fontWeight: 400, color: "var(--text-light)", fontSize: "12px", marginLeft: "8px" }}>
                      (displayed 4 per row on homepage)
                    </span>
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "12px" }}>
                    {(showcase.images || []).map((imgData, ii) => (
                      <div
                        key={ii}
                        style={{ border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden", background: "white" }}
                      >
                        {/* Preview */}
                        <div style={{ width: "100%", aspectRatio: "1", background: "#f4f6f8", overflow: "hidden" }}>
                          <img
                            src={`${BASE_URL}/${imgData.url}`}
                            alt={imgData.name || `Image ${ii + 1}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { e.target.src = "/placeholder-image.png"; }}
                          />
                        </div>
                        <div style={{ padding: "8px" }}>
                          <input
                            type="text"
                            value={imgData.name || ""}
                            onChange={(e) => updateImageName(si, ii, e.target.value)}
                            placeholder="Card label (optional)"
                            style={{ width: "100%", padding: "5px 6px", borderRadius: "4px", border: "1px solid var(--border-color)", fontSize: "12px", boxSizing: "border-box", marginBottom: "4px" }}
                          />
                          <button
                            onClick={() => removeImage(si, ii)}
                            style={{ width: "100%", padding: "4px", background: "none", border: "1px solid #fca5a5", borderRadius: "4px", color: "#ef4444", cursor: "pointer", fontSize: "11px" }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Upload slot */}
                    <label
                      style={{
                        border: "2px dashed var(--border-color)", borderRadius: "8px",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        aspectRatio: "1", cursor: isUploadingForThis ? "not-allowed" : "pointer",
                        background: isUploadingForThis ? "#f4f6f8" : "white",
                        color: "var(--text-light)", transition: "border-color 0.2s",
                      }}
                    >
                      <MdUpload size={28} />
                      <span style={{ fontSize: "12px", marginTop: "4px", textAlign: "center" }}>
                        {isUploadingForThis ? "Uploading…" : "Add Image"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        disabled={isUploadingForThis}
                        onChange={(e) => handleImageUpload(si, e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHomepageConfig;
