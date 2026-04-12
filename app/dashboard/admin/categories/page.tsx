"use client";
import React from "react";
import { useState, useEffect, KeyboardEvent } from "react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/categories`;

interface Subcategory {
  _id: string;
  name: string;
  slug: string;
}

interface Category {
  _id: string;
  name: string;
  image: string;
  description: string;
  subcategories: Subcategory[];
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

interface FormState {
  name: string;
  image: string;
  description: string;
  subcategories: Subcategory[];
}

interface ToastState {
  message: string;
  type: "success" | "error";
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [newSubInput, setNewSubInput] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [form, setForm] = useState<FormState>({ name: "", image: "", description: "", subcategories: [] });
  const [newSubName, setNewSubName] = useState<string>("");

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setCategories(data.data ?? []);
    } catch (err: any) {
      setError(err.message || "Impossible de charger les catégories");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error" = "success"): void => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = (): void => {
    setEditingCategory(null);
    setForm({ name: "", image: "", description: "", subcategories: [] });
    setNewSubName("");
    setShowModal(true);
  };

  const openEdit = (cat: Category): void => {
    setEditingCategory(cat);
    setForm({ name: cat.name, image: cat.image ?? "", description: cat.description ?? "", subcategories: [...cat.subcategories] });
    setNewSubName("");
    setShowModal(true);
  };

  const addSubToForm = (): void => {
    if (!newSubName.trim()) return;
    const sub: Subcategory = { _id: `temp_${Date.now()}`, name: newSubName.trim(), slug: newSubName.trim() };
    setForm((f) => ({ ...f, subcategories: [...f.subcategories, sub] }));
    setNewSubName("");
  };

  const removeSubFromForm = (idx: number): void => {
    setForm((f) => ({ ...f, subcategories: f.subcategories.filter((_, i) => i !== idx) }));
  };

  const handleSave = async (): Promise<void> => {
    if (!form.name.trim()) { showToast("Le nom est requis", "error"); return; }
    try {
      const method = editingCategory ? "PUT" : "POST";
      const url = editingCategory ? `${API_BASE}/${editingCategory._id}` : API_BASE;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      if (editingCategory) {
        setCategories((cs) => cs.map((c) => c._id === editingCategory._id ? data.data : c));
        showToast("Catégorie mise à jour");
      } else {
        setCategories((cs) => [data.data, ...cs]);
        showToast("Catégorie créée");
      }
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la sauvegarde", "error");
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setCategories((cs) => cs.filter((c) => c._id !== id));
      showToast("Catégorie supprimée");
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la suppression", "error");
    }
    setDeleteConfirm(null);
  };

  const handleToggleActive = async (cat: Category): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/${cat._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setCategories((cs) => cs.map((c) => c._id === cat._id ? { ...c, isActive: !c.isActive } : c));
      showToast(cat.isActive ? "Catégorie désactivée" : "Catégorie activée");
    } catch (err: any) {
      showToast(err.message || "Erreur", "error");
    }
  };

  const handleAddSubInline = async (catId: string): Promise<void> => {
    const val = newSubInput[catId]?.trim();
    if (!val) return;
    try {
      const res = await fetch(`${API_BASE}/${catId}/subcategories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: val }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setCategories((cs) => cs.map((c) => c._id === catId ? data.data : c));
      setNewSubInput((s) => ({ ...s, [catId]: "" }));
      showToast("Sous-catégorie ajoutée");
    } catch (err: any) {
      showToast(err.message || "Erreur", "error");
    }
  };

  const handleDeleteSub = async (catId: string, subId: string): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/${catId}/subcategories/${subId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setCategories((cs) => cs.map((c) => c._id === catId ? data.data : c));
      showToast("Sous-catégorie supprimée");
    } catch (err: any) {
      showToast(err.message || "Erreur", "error");
    }
  };

  const handleSeedDefaults = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/seed/defaults`, { method: "POST" });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      await fetchCategories();
      showToast("Catégories par défaut importées");
    } catch (err: any) {
      showToast(err.message || "Erreur lors de l'import", "error");
    }
  };

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSubs = categories.reduce((acc, c) => acc + (c.subcategories?.length ?? 0), 0);
  const activeCount = categories.filter((c) => c.isActive).length;

  return (
    <div className="cat-page">
      {toast && (
        <div className={`cat-toast cat-toast--${toast.type}`}>
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.message}
        </div>
      )}

      {deleteConfirm && (
        <div className="cat-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="cat-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cat-confirm-icon">🗑️</div>
            <h3>Supprimer la catégorie ?</h3>
            <p>Cette action est irréversible. La catégorie{" "}
              <strong>«&nbsp;{deleteConfirm.name}&nbsp;»</strong> et toutes ses sous-catégories seront supprimées.
            </p>
            <div className="cat-confirm-actions">
              <button className="cat-btn cat-btn--ghost" onClick={() => setDeleteConfirm(null)}>Annuler</button>
              <button className="cat-btn cat-btn--danger" onClick={() => handleDelete(deleteConfirm._id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="cat-overlay" onClick={() => setShowModal(false)}>
          <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cat-modal-header">
              <h2>{editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}</h2>
              <button className="cat-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="cat-modal-body">

              {/* Image URL */}
              <div className="cat-field">
                <label>Image (URL)</label>
                <input
                  className="cat-input"
                  placeholder="https://example.com/image.jpg"
                  value={form.image}
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                />
                {/* Preview */}
                {form.image && (
                  <div className="cat-img-preview">
                    <img
                      src={form.image}
                      alt="preview"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}
              </div>

              <div className="cat-field">
                <label>Nom de la catégorie <span className="cat-required">*</span></label>
                <input
                  className="cat-input"
                  placeholder="ex: Bijoux et accessoires"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="cat-field">
                <label>Description</label>
                <input
                  className="cat-input"
                  placeholder="Description courte (optionnel)"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="cat-field">
                <label>Sous-catégories <span className="cat-count-badge">{form.subcategories.length}</span></label>
                <div className="cat-sub-list">
                  {form.subcategories.map((sub, idx) => (
                    <div key={sub._id} className="cat-sub-chip">
                      <span>{sub.name}</span>
                      <button onClick={() => removeSubFromForm(idx)}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="cat-sub-add-row">
                  <input
                    className="cat-input"
                    placeholder="Ajouter une sous-catégorie..."
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && addSubToForm()}
                  />
                  <button className="cat-btn cat-btn--outline" onClick={addSubToForm}>+ Ajouter</button>
                </div>
              </div>
            </div>
            <div className="cat-modal-footer">
              <button className="cat-btn cat-btn--ghost" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="cat-btn cat-btn--primary" onClick={handleSave}>
                {editingCategory ? "Sauvegarder" : "Créer la catégorie"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cat-header">
        <div>
          <h1 className="cat-title">Gestion des Catégories</h1>
          <p className="cat-subtitle">Organisez les catégories et sous-catégories de la plateforme</p>
        </div>
        <div className="cat-header-actions">
          <button className="cat-btn cat-btn--outline" onClick={handleSeedDefaults}>↺ Importer défauts</button>
          <button className="cat-btn cat-btn--primary" onClick={openCreate}>+ Nouvelle catégorie</button>
        </div>
      </div>

      <div className="cat-stats-row">
        <div className="cat-stat-card">
          <div className="cat-stat-label">TOTAL CATÉGORIES</div>
          <div className="cat-stat-value cat-stat-value--blue">{categories.length}</div>
        </div>
        <div className="cat-stat-card">
          <div className="cat-stat-label">ACTIVES</div>
          <div className="cat-stat-value cat-stat-value--green">{activeCount}</div>
        </div>
        <div className="cat-stat-card">
          <div className="cat-stat-label">SOUS-CATÉGORIES</div>
          <div className="cat-stat-value cat-stat-value--purple">{totalSubs}</div>
        </div>
        <div className="cat-stat-card">
          <div className="cat-stat-label">INACTIVES</div>
          <div className="cat-stat-value cat-stat-value--red">{categories.length - activeCount}</div>
        </div>
      </div>

      <div className="cat-search-bar">
        <span className="cat-search-icon">🔍</span>
        <input
          className="cat-search-input"
          placeholder="Rechercher une catégorie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && <button className="cat-search-clear" onClick={() => setSearchTerm("")}>✕</button>}
      </div>

      {loading ? (
        <div className="cat-loading"><div className="cat-spinner" /><span>Chargement...</span></div>
      ) : error ? (
        <div className="cat-error">
          <div className="cat-error-icon">⚠️</div>
          <p>{error}</p>
          <button className="cat-btn cat-btn--primary" onClick={fetchCategories}>Réessayer</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="cat-empty">
          <div className="cat-empty-icon">📂</div>
          <p>Aucune catégorie trouvée</p>
          <button className="cat-btn cat-btn--primary" onClick={openCreate}>Créer la première catégorie</button>
        </div>
      ) : (
        <div className="cat-list">
          <div className="cat-list-header">
            <span>Catégories ({filtered.length})</span>
            <span>{filtered.length} affiché(s)</span>
          </div>
          {filtered.map((cat) => (
            <div key={cat._id} className={`cat-card ${!cat.isActive ? "cat-card--inactive" : ""}`}>
              <div className="cat-card-main">

                {/* Category image or placeholder */}
                <div className="cat-card-thumb">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.removeAttribute("style");
                    }} />
                  ) : null}
                  <div className="cat-card-thumb-fallback" style={cat.image ? { display: "none" } : {}}>
                    {cat.name.charAt(0)}
                  </div>
                </div>

                <div className="cat-card-info">
                  <div className="cat-card-name">{cat.name}</div>
                  {cat.description && <div className="cat-card-desc">{cat.description}</div>}
                  <div className="cat-card-meta">
                    <span className="cat-meta-chip">{(cat.subcategories ?? []).length} sous-catégories</span>
                    <span className="cat-meta-chip">{cat.productCount ?? 0} produits</span>
                    <span className={`cat-status-badge ${cat.isActive ? "cat-status-badge--active" : "cat-status-badge--inactive"}`}>
                      {cat.isActive ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </div>

                <div className="cat-card-actions">
                  <button className="cat-action-btn"
                    onClick={() => setExpandedId(expandedId === cat._id ? null : cat._id)}
                    title="Voir les sous-catégories">
                    {expandedId === cat._id ? "▲" : "▼"}
                  </button>
                  <button className="cat-action-btn" onClick={() => openEdit(cat)} title="Modifier">✏️</button>
                  <button
                    className={`cat-action-btn ${cat.isActive ? "cat-action-btn--toggle-off" : "cat-action-btn--toggle-on"}`}
                    onClick={() => handleToggleActive(cat)}
                    title={cat.isActive ? "Désactiver" : "Activer"}>
                    {cat.isActive ? "⊘" : "✓"}
                  </button>
                  <button className="cat-action-btn cat-action-btn--delete"
                    onClick={() => setDeleteConfirm(cat)} title="Supprimer">🗑</button>
                </div>
              </div>

              {expandedId === cat._id && (
                <div className="cat-subcategories">
                  <div className="cat-sub-header">Sous-catégories</div>
                  <div className="cat-sub-tags">
                    {(cat.subcategories ?? []).map((sub) => (
                      <div key={sub._id} className="cat-sub-tag">
                        <span>{sub.name}</span>
                        <button onClick={() => handleDeleteSub(cat._id, sub._id)}>✕</button>
                      </div>
                    ))}
                    {(cat.subcategories ?? []).length === 0 && (
                      <span className="cat-no-subs">Aucune sous-catégorie</span>
                    )}
                  </div>
                  <div className="cat-sub-add-inline">
                    <input
                      className="cat-input cat-input--sm"
                      placeholder="Nouvelle sous-catégorie..."
                      value={newSubInput[cat._id] ?? ""}
                      onChange={(e) => setNewSubInput((s) => ({ ...s, [cat._id]: e.target.value }))}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleAddSubInline(cat._id)}
                    />
                    <button className="cat-btn cat-btn--outline cat-btn--sm" onClick={() => handleAddSubInline(cat._id)}>
                      + Ajouter
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}