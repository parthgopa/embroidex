import { useState, useEffect } from "react";
import { MdAdd, MdDelete, MdSave } from "react-icons/md";
import API from "../../services/api";
import styles from "./AdminDashboardV2.module.css";

const AdminPlatformCategories = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await API.get("/admin/platform-categories", { headers });
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Failed to fetch platform categories", err);
      alert("Failed to load platform categories.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      await API.post("/admin/platform-categories", { categories }, { headers });
      alert("Platform categories saved successfully!");
    } catch (err) {
      console.error("Failed to save", err);
      alert("Failed to save categories.");
    } finally {
      setSaving(false);
    }
  };

  const addMainCategory = () => {
    setCategories([...categories, { category_name: "", subcategories: [] }]);
  };

  const removeMainCategory = (index) => {
    if (window.confirm("Are you sure you want to remove this main category?")) {
      const newCats = [...categories];
      newCats.splice(index, 1);
      setCategories(newCats);
    }
  };

  const updateMainCategoryName = (index, value) => {
    const newCats = [...categories];
    newCats[index].category_name = value;
    setCategories(newCats);
  };

  const addSubcategory = (mainIndex) => {
    const newCats = [...categories];
    if (!newCats[mainIndex].subcategories) newCats[mainIndex].subcategories = [];
    newCats[mainIndex].subcategories.push("");
    setCategories(newCats);
  };

  const removeSubcategory = (mainIndex, subIndex) => {
    const newCats = [...categories];
    newCats[mainIndex].subcategories.splice(subIndex, 1);
    setCategories(newCats);
  };

  const updateSubcategory = (mainIndex, subIndex, value) => {
    const newCats = [...categories];
    newCats[mainIndex].subcategories[subIndex] = value;
    setCategories(newCats);
  };

  if (loading) return <div>Loading configuration...</div>;

  return (
    <div className={styles.section}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 className={styles.pageTitle}>Platform Categories</h1>
        <button 
          onClick={handleSave} 
          disabled={saving}
          style={{ padding: "10px 20px", background: "var(--primary)", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}
        >
          <MdSave /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className={`container-box ${styles.activityBox}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <p style={{ fontSize: "14px", color: "var(--text-light)" }}>
            These are the global categories available for sellers when uploading designs and for buyers when filtering.
          </p>
          <button 
            onClick={addMainCategory}
            style={{ padding: "6px 12px", background: "var(--success)", color: "white", borderRadius: "6px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <MdAdd /> Add Main Category
          </button>
        </div>

        {categories.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--text-light)", border: "1px dashed var(--border-color)", borderRadius: "8px" }}>
            No categories defined yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {categories.map((mainCat, mainIndex) => (
              <div key={mainIndex} style={{ border: "1px solid var(--border-color)", borderRadius: "8px", padding: "16px", background: "var(--bg-main)" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
                  <input 
                    type="text" 
                    value={mainCat.category_name} 
                    onChange={(e) => updateMainCategoryName(mainIndex, e.target.value)}
                    placeholder="Main Category Name"
                    style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "16px", fontWeight: "bold" }}
                  />
                  <button onClick={() => removeMainCategory(mainIndex)} style={{ color: "var(--error)", background: "none", border: "none", cursor: "pointer", padding: "8px" }}>
                    <MdDelete size={20} />
                  </button>
                </div>
                
                <div style={{ marginLeft: "20px", paddingLeft: "16px", borderLeft: "2px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h4 style={{ fontSize: "14px", color: "var(--text-dark)", margin: 0 }}>Subcategories</h4>
                    <button 
                      onClick={() => addSubcategory(mainIndex)}
                      style={{ fontSize: "12px", padding: "4px 8px", background: "var(--border-color)", border: "none", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <MdAdd /> Add Subcategory
                    </button>
                  </div>
                  
                  {(!mainCat.subcategories || mainCat.subcategories.length === 0) ? (
                    <div style={{ fontSize: "12px", color: "var(--text-light)", fontStyle: "italic" }}>No subcategories added.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {mainCat.subcategories.map((sub, subIndex) => (
                        <div key={subIndex} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <input 
                            type="text" 
                            value={sub} 
                            onChange={(e) => updateSubcategory(mainIndex, subIndex, e.target.value)}
                            placeholder="Subcategory Name"
                            style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid var(--border-color)", fontSize: "14px" }}
                          />
                          <button onClick={() => removeSubcategory(mainIndex, subIndex)} style={{ color: "var(--text-light)", background: "none", border: "none", cursor: "pointer" }}>
                            <MdDelete />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPlatformCategories;
