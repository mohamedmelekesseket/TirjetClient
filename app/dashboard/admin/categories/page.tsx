"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/categories`;

const MAIN_CATEGORIES = [
  { value: "artisanat",                label: "Artisanat" },
  { value: "art-et-culture",           label: "Art et culture" },
  { value: "evenements-et-traditions", label: "Événements et traditions" },
  { value: "tourisme-et-loisir",       label: "Tourisme et loisir" },
  { value: "langue-amazigh",           label: "Langue amazigh" },
  { value: "gda",                      label: "GDA" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface L4 { _id: string; name: string; slug: string; image: string; }
interface L3 { _id: string; name: string; slug: string; image: string; subcategories: L4[]; }
interface L2 { _id: string; name: string; slug: string; image: string; subcategories: L3[]; }
interface Category {
  _id: string; name: string; slug: string; image: string;
  description: string; mainCategory: string;
  subcategories: L2[]; isActive: boolean; productCount: number; createdAt: string;
}

type ModalMode =
  | { kind: "create-l1" }
  | { kind: "edit-l1"; cat: Category }
  | { kind: "create-l2"; catId: string }
  | { kind: "edit-l2"; catId: string; l2: L2 }
  | { kind: "create-l3"; catId: string; l2Id: string }
  | { kind: "edit-l3"; catId: string; l2Id: string; l3: L3 }
  | { kind: "create-l4"; catId: string; l2Id: string; l3Id: string }
  | { kind: "edit-l4"; catId: string; l2Id: string; l3Id: string; l4: L4 };

interface NodeForm { name: string; image: string; description: string; mainCategory: string; }

type DeleteTarget =
  | { kind: "l1"; cat: Category }
  | { kind: "l2"; catId: string; l2Id: string; name: string }
  | { kind: "l3"; catId: string; l2Id: string; l3Id: string; name: string }
  | { kind: "l4"; catId: string; l2Id: string; l3Id: string; l4Id: string; name: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_COLORS = ["#2c3e8c", "#0891b2", "#059669", "#d97706"];
const LEVEL_LABELS = ["L1", "L2", "L3", "L4"];
const LEVEL_NAMES  = ["Catégorie racine", "Sous-catégorie", "Niveau 3", "Niveau 4 (feuille)"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countDescendants(subs: L2[]): number {
  let n = 0;
  for (const l2 of subs) {
    n += 1;
    for (const l3 of l2.subcategories ?? []) {
      n += 1;
      n += (l3.subcategories ?? []).length;
    }
  }
  return n;
}

// ─── Image upload hook ────────────────────────────────────────────────────────

function useImageUpload(initial: string) {
  const [image, setImage] = useState(initial);
  const [mode, setMode]   = useState<"url" | "file">("url");
  const [busy, setBusy]   = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { showErrorToast("Fichier image invalide"); return; }
    if (file.size > 5 * 1024 * 1024)    { showErrorToast("Max 5 Mo"); return; }
    setBusy(true);
    const r = new FileReader();
    r.onload  = () => { setImage(r.result as string); setBusy(false); };
    r.onerror = () => { showErrorToast("Erreur lecture fichier"); setBusy(false); };
    r.readAsDataURL(file);
  }, []);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  }, [handleFile]);

  const clear = useCallback(() => {
    setImage("");
    if (ref.current) ref.current.value = "";
  }, []);

  return { image, setImage, mode, setMode, busy, ref, onInputChange, handleFile, clear };
}

// ─── Image Picker ─────────────────────────────────────────────────────────────

function ImagePicker({ hook }: { hook: ReturnType<typeof useImageUpload> }) {
  const { image, setImage, mode, setMode, busy, ref, onInputChange, handleFile, clear } = hook;
  return (
    <div className="cat-field">
      <label>Image</label>
      <div className="cat-img-tabs">
        <button type="button" className={`cat-img-tab${mode === "url" ? " cat-img-tab--active" : ""}`}
          onClick={() => setMode("url")}>🔗 URL</button>
        <button type="button" className={`cat-img-tab${mode === "file" ? " cat-img-tab--active" : ""}`}
          onClick={() => setMode("file")}>📁 Fichier</button>
      </div>
      {mode === "url" ? (
        <input className="cat-input" placeholder="https://…"
          value={image.startsWith("data:") ? "" : image}
          onChange={(e) => setImage(e.target.value)} />
      ) : (
        <div className="cat-file-upload-area"
          onClick={() => ref.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}>
          {busy
            ? <div className="cat-file-upload-loading">
                <div className="cat-spinner" style={{ width: 22, height: 22 }} /><span>Chargement…</span>
              </div>
            : <>
                <div className="cat-file-upload-icon">🖼️</div>
                <div className="cat-file-upload-text">Cliquez ou glissez une image</div>
                <div className="cat-file-upload-hint">PNG, JPG, WEBP — max 5 Mo</div>
              </>
          }
          <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={onInputChange} />
        </div>
      )}
      {image && (
        <div className="cat-img-preview-wrap">
          <img src={image} alt="preview" className="cat-img-preview-img"
            onError={(e) => (e.currentTarget.style.display = "none")} />
          <button type="button" className="cat-img-preview-clear" onClick={clear}>✕</button>
        </div>
      )}
    </div>
  );
}

// ─── Node Modal ───────────────────────────────────────────────────────────────

function NodeModal({ mode, onClose, onSave }:
  { mode: ModalMode; onClose: () => void; onSave: (form: NodeForm) => Promise<void> }) {
  const isL1   = mode.kind === "create-l1" || mode.kind === "edit-l1";
  const isEdit = mode.kind.startsWith("edit");
  const level  = mode.kind.includes("l4") ? 3 : mode.kind.includes("l3") ? 2 : mode.kind.includes("l2") ? 1 : 0;

  const getInitial = (): NodeForm => {
    if (mode.kind === "edit-l1") return { name: mode.cat.name,  image: mode.cat.image,  description: mode.cat.description,  mainCategory: mode.cat.mainCategory };
    if (mode.kind === "edit-l2") return { name: mode.l2.name,   image: mode.l2.image,   description: "", mainCategory: "" };
    if (mode.kind === "edit-l3") return { name: mode.l3.name,   image: mode.l3.image,   description: "", mainCategory: "" };
    if (mode.kind === "edit-l4") return { name: mode.l4.name,   image: mode.l4.image,   description: "", mainCategory: "" };
    return { name: "", image: "", description: "", mainCategory: "" };
  };

  const initial = getInitial();
  const [name, setName]               = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [mainCat, setMainCat]         = useState(initial.mainCategory);
  const [saving, setSaving]           = useState(false);
  const img = useImageUpload(initial.image);

  const parentLabel = isL1 ? "" :
    mode.kind === "create-l2" || mode.kind === "edit-l2" ? "dans la catégorie parente" :
    mode.kind === "create-l3" || mode.kind === "edit-l3" ? "dans le groupe L2" : "dans le groupe L3";

const handleSave = async () => {
    if (!name.trim()) { showErrorToast("Le nom est requis"); return; }
    if (isL1 && !mainCat) { showErrorToast("Catégorie principale requise"); return; }
    setSaving(true);

    let finalImage = img.image;

    if (img.image.startsWith("data:")) {
      try {
        const blob = await fetch(img.image).then(r => r.blob());
        const formData = new FormData();
        formData.append("image", blob, "category.jpg");
        const uploadRes = await fetch(`${API_BASE}/upload-image`, {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) throw new Error(uploadData.message);
        finalImage = uploadData.url;
      } catch (e: any) {
        showErrorToast("Erreur upload image: " + e.message);
        setSaving(false);
        return;
      }
    }

    await onSave({ name: name.trim(), image: finalImage, description, mainCategory: mainCat });
    setSaving(false);
  };

  return (
    <div className="cat-overlay" onClick={onClose}>
      <div className="cat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cat-modal-header">
          <div className="cat-modal-title-row">
            <span className="cat-level-badge" style={{ background: LEVEL_COLORS[level] }}>
              {LEVEL_LABELS[level]}
            </span>
            <div>
              <h2>{isEdit ? "Modifier" : `Ajouter ${LEVEL_NAMES[level]}`}</h2>
              {parentLabel && <p className="cat-modal-subtitle">{parentLabel}</p>}
            </div>
          </div>
          <button className="cat-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="cat-modal-body">
          <ImagePicker hook={img} />

          <div className="cat-field">
            <label>Nom <span className="cat-required">*</span></label>
            <input className="cat-input" placeholder="Nom…" value={name} autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !saving && handleSave()} />
          </div>

          {isL1 && (
            <>
              <div className="cat-field">
                <label>Catégorie principale <span className="cat-required">*</span></label>
                <select className="cat-input cat-select" value={mainCat}
                  onChange={(e) => setMainCat(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {MAIN_CATEGORIES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="cat-field">
                <label>Description</label>
                <input className="cat-input" placeholder="Description (optionnel)" value={description}
                  onChange={(e) => setDescription(e.target.value)} />
              </div>
            </>
          )}
        </div>

        <div className="cat-modal-footer">
          <button className="cat-btn cat-btn--ghost" onClick={onClose}>Annuler</button>
          <button className="cat-btn cat-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement…" : isEdit ? "Sauvegarder" : "Créer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ target, onClose, onConfirm }:
  { target: DeleteTarget; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const label = target.kind === "l1" ? target.cat.name : target.name;
  const confirm = async () => { setBusy(true); await onConfirm(); setBusy(false); };
  return (
    <div className="cat-overlay" onClick={onClose}>
      <div className="cat-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cat-confirm-icon">🗑️</div>
        <h3>Supprimer ?</h3>
        <p>
          «&nbsp;<strong>{label}</strong>&nbsp;» sera supprimé(e) définitivement
          {target.kind !== "l4" && " ainsi que tous ses descendants"}.
        </p>
        <div className="cat-confirm-actions">
          <button className="cat-btn cat-btn--ghost" onClick={onClose}>Annuler</button>
          <button className="cat-btn cat-btn--danger" onClick={confirm} disabled={busy}>
            {busy ? "…" : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Thumb ───────────────────────────────────────────────────────────────────

function Thumb({ image, name, size = 40, level = 0 }:
  { image: string; name: string; size?: number; level?: number }) {
  const [err, setErr] = useState(false);
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: level === 0 ? 10 : 7,
      overflow: "hidden", border: "1px solid #e2e8f0",
      background: "#f0f4ff", display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      {image && !err
        ? <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setErr(true)} />
        : <span style={{ fontSize: size * 0.42, fontWeight: 700, color: LEVEL_COLORS[level] }}>
            {name.charAt(0).toUpperCase()}
          </span>
      }
    </div>
  );
}

// ─── L4 Row ───────────────────────────────────────────────────────────────────

function L4Row({ item, catId, l2Id, l3Id, onEdit, onDelete }:
  { item: L4; catId: string; l2Id: string; l3Id: string;
    onEdit: (m: ModalMode) => void; onDelete: (t: DeleteTarget) => void }) {
  return (
    <div className="cat-tree-row cat-tree-row--l4">
      <div className="cat-tree-row-inner">
        <div className="cat-tree-indent" />
        <Thumb image={item.image} name={item.name} size={26} level={3} />
        <span className="cat-tree-name">{item.name}</span>
        <span className="cat-level-dot" style={{ background: LEVEL_COLORS[3] }}>L4</span>
        <div className="cat-tree-actions">
          <button className="cat-icon-action" title="Modifier"
            onClick={() => onEdit({ kind: "edit-l4", catId, l2Id, l3Id, l4: item })}>✏️</button>
          <button className="cat-icon-action cat-icon-action--del" title="Supprimer"
            onClick={() => onDelete({ kind: "l4", catId, l2Id, l3Id, l4Id: item._id, name: item.name })}>🗑</button>
        </div>
      </div>
    </div>
  );
}

// ─── L3 Row ───────────────────────────────────────────────────────────────────

function L3Row({ item, catId, l2Id, onEdit, onDelete }:
  { item: L3; catId: string; l2Id: string;
    onEdit: (m: ModalMode) => void; onDelete: (t: DeleteTarget) => void }) {
  const [open, setOpen] = useState(false);
  const count = (item.subcategories ?? []).length;
  return (
    <div className="cat-tree-group">
      <div className="cat-tree-row cat-tree-row--l3">
        <div className="cat-tree-row-inner">
          <div className="cat-tree-indent" />
          <button className="cat-tree-toggle" onClick={() => setOpen((o) => !o)}
            style={{ opacity: count === 0 ? 0.3 : 1 }}>
            {open ? "▾" : "▸"}
          </button>
          <Thumb image={item.image} name={item.name} size={30} level={2} />
          <span className="cat-tree-name">{item.name}</span>
          <span className="cat-level-dot" style={{ background: LEVEL_COLORS[2] }}>L3</span>
          <span className="cat-tree-count">{count} L4</span>
          <div className="cat-tree-actions">
            <button className="cat-icon-action cat-icon-action--add" title="Ajouter L4"
              onClick={() => onEdit({ kind: "create-l4", catId, l2Id, l3Id: item._id })}>＋ L4</button>
            <button className="cat-icon-action" title="Modifier"
              onClick={() => onEdit({ kind: "edit-l3", catId, l2Id, l3: item })}>✏️</button>
            <button className="cat-icon-action cat-icon-action--del" title="Supprimer"
              onClick={() => onDelete({ kind: "l3", catId, l2Id, l3Id: item._id, name: item.name })}>🗑</button>
          </div>
        </div>
      </div>
      {open && (item.subcategories ?? []).map((l4) => (
        <L4Row key={l4._id} item={l4} catId={catId} l2Id={l2Id} l3Id={item._id}
          onEdit={onEdit} onDelete={onDelete} />
      ))}
      {open && count === 0 && (
        <div className="cat-tree-empty-leaf">
          Aucun niveau 4 —{" "}
          <button className="cat-link-btn"
            onClick={() => onEdit({ kind: "create-l4", catId, l2Id, l3Id: item._id })}>
            Ajouter ＋
          </button>
        </div>
      )}
    </div>
  );
}

// ─── L2 Row ───────────────────────────────────────────────────────────────────

function L2Row({ item, catId, onEdit, onDelete }:
  { item: L2; catId: string;
    onEdit: (m: ModalMode) => void; onDelete: (t: DeleteTarget) => void }) {
  const [open, setOpen] = useState(false);
  const count = (item.subcategories ?? []).length;
  return (
    <div className="cat-tree-group">
      <div className="cat-tree-row cat-tree-row--l2">
        <div className="cat-tree-row-inner">
          <div className="cat-tree-indent" />
          <button className="cat-tree-toggle" onClick={() => setOpen((o) => !o)}
            style={{ opacity: count === 0 ? 0.3 : 1 }}>
            {open ? "▾" : "▸"}
          </button>
          <Thumb image={item.image} name={item.name} size={34} level={1} />
          <span className="cat-tree-name">{item.name}</span>
          <span className="cat-level-dot" style={{ background: LEVEL_COLORS[1] }}>L2</span>
          <span className="cat-tree-count">{count} L3</span>
          <div className="cat-tree-actions">
            <button className="cat-icon-action cat-icon-action--add" title="Ajouter L3"
              onClick={() => onEdit({ kind: "create-l3", catId, l2Id: item._id })}>＋ L3</button>
            <button className="cat-icon-action" title="Modifier"
              onClick={() => onEdit({ kind: "edit-l2", catId, l2: item })}>✏️</button>
            <button className="cat-icon-action cat-icon-action--del" title="Supprimer"
              onClick={() => onDelete({ kind: "l2", catId, l2Id: item._id, name: item.name })}>🗑</button>
          </div>
        </div>
      </div>
      {open && (item.subcategories ?? []).map((l3) => (
        <L3Row key={l3._id} item={l3} catId={catId} l2Id={item._id} onEdit={onEdit} onDelete={onDelete} />
      ))}
      {open && count === 0 && (
        <div className="cat-tree-empty-leaf">
          Aucun niveau 3 —{" "}
          <button className="cat-link-btn"
            onClick={() => onEdit({ kind: "create-l3", catId, l2Id: item._id })}>
            Ajouter ＋
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Category Card (L1) ───────────────────────────────────────────────────────

function CategoryCard({ cat, onEdit, onDelete, onToggle }:
  { cat: Category;
    onEdit: (m: ModalMode) => void;
    onDelete: (t: DeleteTarget) => void;
    onToggle: (cat: Category) => void;
  }) {
  const [open, setOpen] = useState(false);
  const total     = countDescendants(cat.subcategories ?? []);
  const mainLabel = MAIN_CATEGORIES.find((m) => m.value === cat.mainCategory)?.label ?? cat.mainCategory;

  return (
    <div className={`cat-card${!cat.isActive ? " cat-card--inactive" : ""}`}>
      <div className="cat-card-main">
        <Thumb image={cat.image} name={cat.name} size={52} level={0} />
        <div className="cat-card-info">
          <div className="cat-card-name">{cat.name}</div>
          {cat.description && <div className="cat-card-desc">{cat.description}</div>}
          <div className="cat-card-meta">
            {cat.mainCategory && (
              <span className="cat-meta-chip cat-meta-chip--main">{mainLabel}</span>
            )}
            <span className="cat-meta-chip">{(cat.subcategories ?? []).length} L2</span>
            <span className="cat-meta-chip">{total} descendants</span>
            <span className="cat-meta-chip">{cat.productCount ?? 0} produits</span>
            <span className={`cat-status-badge${cat.isActive ? " cat-status-badge--active" : " cat-status-badge--inactive"}`}>
              {cat.isActive ? "Actif" : "Inactif"}
            </span>
          </div>
        </div>
        <div className="cat-card-actions">
          <button className="cat-action-btn" onClick={() => setOpen((o) => !o)} title="Voir l'arbre">
            {open ? "▲" : "▼"}
          </button>
          <button className="cat-action-btn cat-action-btn--add" title="Ajouter L2"
            onClick={() => onEdit({ kind: "create-l2", catId: cat._id })}>
            ＋ L2
          </button>
          <button className="cat-action-btn" onClick={() => onEdit({ kind: "edit-l1", cat })} title="Modifier">✏️</button>
          <button className={`cat-action-btn${cat.isActive ? " cat-action-btn--toggle-off" : " cat-action-btn--toggle-on"}`}
            onClick={() => onToggle(cat)} title={cat.isActive ? "Désactiver" : "Activer"}>
            {cat.isActive ? "⊘" : "✓"}
          </button>
          <button className="cat-action-btn cat-action-btn--delete"
            onClick={() => onDelete({ kind: "l1", cat })} title="Supprimer">🗑</button>
        </div>
      </div>

      {open && (
        <div className="cat-tree">
          {(cat.subcategories ?? []).length === 0 ? (
            <div className="cat-tree-empty-leaf">
              Aucune sous-catégorie —{" "}
              <button className="cat-link-btn"
                onClick={() => onEdit({ kind: "create-l2", catId: cat._id })}>
                Ajouter L2 ＋
              </button>
            </div>
          ) : (
            (cat.subcategories ?? []).map((l2) => (
              <L2Row key={l2._id} item={l2} catId={cat._id} onEdit={onEdit} onDelete={onDelete} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal]           = useState<ModalMode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const closeModal  = () => setModal(null);
  const closeDelete = () => setDeleteTarget(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setCategories(data.data ?? []);
    } catch (e: any) { setError(e.message || "Erreur chargement"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ── Save dispatcher ────────────────────────────────────────────────────────
const handleSave = async (form: NodeForm) => {
    if (!modal) return;
    try {
      let res: Response;

      if (modal.kind === "create-l1") {
        res = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name, image: form.image,
            description: form.description, mainCategory: form.mainCategory,
          }),
        });

      } else if (modal.kind === "edit-l1") {
        res = await fetch(`${API_BASE}/${modal.cat._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name, image: form.image,
            description: form.description, mainCategory: form.mainCategory,
          }),
        });

      } else if (modal.kind === "create-l2") {
        res = await fetch(`${API_BASE}/${modal.catId}/subcategories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, image: form.image }),
        });

      } else if (modal.kind === "edit-l2") {
        // ← NOW calls PUT /:id/subcategories/:subId directly
        res = await fetch(`${API_BASE}/${modal.catId}/subcategories/${modal.l2._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, image: form.image }),
        });

      } else if (modal.kind === "create-l3") {
        res = await fetch(
          `${API_BASE}/${modal.catId}/subcategories/${modal.l2Id}/subcategories`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: form.name, image: form.image }),
          }
        );

      } else if (modal.kind === "edit-l3") {
        // ← NOW calls PUT /:id/subcategories/:subId/subcategories/:subSubId directly
        res = await fetch(
          `${API_BASE}/${modal.catId}/subcategories/${modal.l2Id}/subcategories/${modal.l3._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: form.name, image: form.image }),
          }
        );

      } else if (modal.kind === "create-l4") {
        res = await fetch(
          `${API_BASE}/${modal.catId}/subcategories/${modal.l2Id}/subcategories/${modal.l3Id}/subcategories`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: form.name, image: form.image }),
          }
        );

      } else {
        // edit-l4 ← NOW calls PUT /:id/.../subcategories/:itemId directly
        res = await fetch(
          `${API_BASE}/${modal.catId}/subcategories/${modal.l2Id}/subcategories/${modal.l3Id}/subcategories/${modal.l4._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: form.name, image: form.image }),
          }
        );
      }

      if (!res!.ok) {
        const d = await res!.json().catch(() => ({}));
        throw new Error(d.message || `Erreur ${res!.status}`);
      }
      showSuccessToast(modal.kind.startsWith("edit") ? "Mis à jour ✓" : "Créé ✓");
      await fetchCategories();
    } catch (e: any) {
      showErrorToast(e.message || "Erreur sauvegarde");
    }
    closeModal();
  };

  // ── Delete dispatcher ──────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      let res: Response;
      if (deleteTarget.kind === "l1") {
        res = await fetch(`${API_BASE}/${deleteTarget.cat._id}`, { method: "DELETE" });
      } else if (deleteTarget.kind === "l2") {
        res = await fetch(`${API_BASE}/${deleteTarget.catId}/subcategories/${deleteTarget.l2Id}`, { method: "DELETE" });
      } else if (deleteTarget.kind === "l3") {
        res = await fetch(
          `${API_BASE}/${deleteTarget.catId}/subcategories/${deleteTarget.l2Id}/subcategories/${deleteTarget.l3Id}`,
          { method: "DELETE" }
        );
      } else {
        res = await fetch(
          `${API_BASE}/${deleteTarget.catId}/subcategories/${deleteTarget.l2Id}/subcategories/${deleteTarget.l3Id}/subcategories/${deleteTarget.l4Id}`,
          { method: "DELETE" }
        );
      }
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      showSuccessToast("Supprimé ✓");
      await fetchCategories();
    } catch (e: any) { showErrorToast(e.message || "Erreur suppression"); }
    closeDelete();
  };

  // ── Toggle active ──────────────────────────────────────────────────────────
  const handleToggle = async (cat: Category) => {
    try {
      const res = await fetch(`${API_BASE}/${cat._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setCategories((cs) =>
        cs.map((c) => c._id === cat._id ? { ...c, isActive: !c.isActive } : c)
      );
      showSuccessToast(cat.isActive ? "Désactivé" : "Activé");
    } catch (e: any) { showErrorToast(e.message || "Erreur"); }
  };

  // ── Seed ──────────────────────────────────────────────────────────────────
  const handleSeed = async () => {
    try {
      const res = await fetch(`${API_BASE}/seed/defaults`, { method: "POST" });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      await fetchCategories();
      showSuccessToast("Données importées ✓");
    } catch (e: any) { showErrorToast(e.message || "Erreur import"); }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.description ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalNodes  = categories.reduce((acc, c) => acc + countDescendants(c.subcategories ?? []), 0);
  const activeCount = categories.filter((c) => c.isActive).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="cat-page">
      {modal && <NodeModal mode={modal} onClose={closeModal} onSave={handleSave} />}
      {deleteTarget && <DeleteModal target={deleteTarget} onClose={closeDelete} onConfirm={handleDelete} />}

      {/* Header */}
      <div className="cat-header">
        <div>
          <h1 className="cat-title">Gestion des Catégories</h1>
          <p className="cat-subtitle">Arbre hiérarchique complet — L1 → L2 → L3 → L4</p>
        </div>
        <div className="cat-header-actions">
          <button className="cat-btn cat-btn--outline" onClick={handleSeed}>↺ Importer défauts</button>
          <button className="cat-btn cat-btn--primary" onClick={() => setModal({ kind: "create-l1" })}>
            ＋ Catégorie L1
          </button>
        </div>
      </div>

      {/* Level legend */}
      <div className="cat-legend">
        {LEVEL_LABELS.map((l, i) => (
          <div key={l} className="cat-legend-item">
            <span className="cat-level-dot" style={{ background: LEVEL_COLORS[i] }}>{l}</span>
            <span className="cat-legend-label">{LEVEL_NAMES[i]}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="cat-stats-row">
        <div className="cat-stat-card">
          <div className="cat-stat-label">CATÉGORIES L1</div>
          <div className="cat-stat-value cat-stat-value--blue">{categories.length}</div>
        </div>
        <div className="cat-stat-card">
          <div className="cat-stat-label">ACTIVES</div>
          <div className="cat-stat-value cat-stat-value--green">{activeCount}</div>
        </div>
        <div className="cat-stat-card">
          <div className="cat-stat-label">TOTAL NŒUDS</div>
          <div className="cat-stat-value cat-stat-value--purple">{totalNodes}</div>
        </div>
        <div className="cat-stat-card">
          <div className="cat-stat-label">INACTIVES</div>
          <div className="cat-stat-value cat-stat-value--red">{categories.length - activeCount}</div>
        </div>
      </div>

      {/* Search */}
      <div className="cat-search-bar">
        <span className="cat-search-icon">🔍</span>
        <input className="cat-search-input" placeholder="Rechercher une catégorie L1…"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        {searchTerm && (
          <button className="cat-search-clear" onClick={() => setSearchTerm("")}>✕</button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="cat-loading"><div className="cat-spinner" /><span>Chargement…</span></div>
      ) : error ? (
        <div className="cat-error">
          <div className="cat-error-icon">⚠️</div>
          <p>{error}</p>
          <button className="cat-btn cat-btn--primary" onClick={fetchCategories}>Réessayer</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="cat-empty">
          <div className="cat-empty-icon">📂</div>
          <p>Aucune catégorie</p>
          <button className="cat-btn cat-btn--primary" onClick={() => setModal({ kind: "create-l1" })}>
            Créer la première
          </button>
        </div>
      ) : (
        <div className="cat-list">
          <div className="cat-list-header">
            <span>Catégories ({filtered.length})</span>
            <span>{filtered.length} affiché(s)</span>
          </div>
          {filtered.map((cat) => (
            <CategoryCard key={cat._id} cat={cat}
              onEdit={setModal} onDelete={setDeleteTarget} onToggle={handleToggle} />
          ))}
        </div>
      )}
    </div>
  );
}