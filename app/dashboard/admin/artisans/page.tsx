"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Ban, Eye,CircleAlert } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Artisan {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    status: string;
  };
  phone?: string;
  region?: string;
  city?: string;
  specialite?: string;
  description?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  website?: string;
  experience?: number;
  languages?: string[];
  tags?: string[];
  notes?: string;
  isFeatured?: boolean;
  isApproved: boolean;
  createdAt: string;
}

type FilterTab = "Tous" | "Actif" | "En attente" | "Suspendu";

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const statusLabel = (a: Artisan): string => {
  if (a.user.status === "blocked") return "Suspendu";
  if (!a.isApproved) return "En attente";
  return "Actif";
};

const statusClass: Record<string, string> = {
  Actif: "badge-success",
  "En attente": "badge-warning",
  Suspendu: "badge-danger",
};

// ─── Edit Modal ────────────────────────────────────────────────────────────────
const EDIT_FIELDS = [
  { key: "phone",       label: "Téléphone",                    multiline: false, type: "text"   },
  { key: "region",      label: "Région",                       multiline: false, type: "text"   },
  { key: "city",        label: "Ville",                        multiline: false, type: "text"   },
  { key: "specialite",  label: "Spécialité",                   multiline: false, type: "text"   },
  { key: "experience",  label: "Années d'expérience",          multiline: false, type: "number" },
  { key: "instagram",   label: "Instagram",                    multiline: false, type: "text"   },
  { key: "facebook",    label: "Facebook",                     multiline: false, type: "text"   },
  { key: "tiktok",      label: "TikTok",                       multiline: false, type: "text"   },
  { key: "website",     label: "Site web",                     multiline: false, type: "text"   },
  { key: "languages",   label: "Langues (virgule séparées)",   multiline: false, type: "text"   },
  { key: "tags",        label: "Tags (virgule séparées)",      multiline: false, type: "text"   },
  { key: "description", label: "Description",                  multiline: true,  type: "text"   },
  { key: "notes",       label: "Notes internes (admin)",       multiline: true,  type: "text"   },
];

function EditArtisanModal({
  artisan,
  onClose,
  onSave,
  saving,
}: {
  artisan: Artisan;
  onClose: () => void;
  onSave: (id: string, data: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    EDIT_FIELDS.forEach((f) => {
      const val = (artisan as any)[f.key];
      init[f.key] = Array.isArray(val) ? val.join(", ") : (val ?? "");
    });
    return init;
  });
  const [isFeatured, setIsFeatured] = useState<boolean>(artisan.isFeatured ?? false);

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    const payload: Record<string, unknown> = { isFeatured };
    EDIT_FIELDS.forEach((f) => {
      if (f.key === "languages" || f.key === "tags") {
        payload[f.key] = (form[f.key] as string)
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      } else if (f.type === "number") {
        payload[f.key] = form[f.key] === "" ? undefined : Number(form[f.key]);
      } else {
        payload[f.key] = form[f.key];
      }
    });
    onSave(artisan._id, payload);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          padding: "28px 32px",
          width: "min(600px, 95vw)",
          maxHeight: "88vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>Modifier l'artisan</h2>
            <p style={{ fontSize: "0.82rem", color: "black", margin: "2px 0 0" }}>{artisan.user.name} · {artisan.user.email}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "black" }}
          >✕</button>
        </div>

        {/* Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {EDIT_FIELDS.map((f) =>
            f.multiline ? (
              <div key={f.key} style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: ".78rem", color: "black", marginBottom: "5px", fontWeight: 500 }}>
                  {f.label}
                </label>
                <textarea
                  rows={3}
                  className="search-bar-input"
                  style={{ width: "100%", resize: "vertical", boxSizing: "border-box" }}
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </div>
            ) : (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: ".78rem", color: "black", marginBottom: "5px", fontWeight: 500 }}>
                  {f.label}
                </label>
                <input
                  type={f.type}
                  className="search-bar-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </div>
            )
          )}
        </div>

        {/* Featured toggle */}
        <label
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            marginTop: "18px", cursor: "pointer",
            padding: "12px 14px",
            background: "var(--bg, #f8f9fc)",
            borderRadius: "8px",
          }}
        >
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            style={{ width: "16px", height: "16px", cursor: "pointer" }}
          />
          <div>
            <div style={{ fontSize: ".875rem", fontWeight: 500 }}>Mettre en avant</div>
            <div style={{ fontSize: ".775rem", color: "black" }}>Affiché en priorité sur la page d'accueil</div>
          </div>
        </label>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "24px" }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AdminArtisansPage() {
  const { data: session, status: sessionStatus } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("Tous");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Artisan | null>(null);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    danger?: boolean;
    onConfirm?: () => void;
  }>({ open: false, title: "" });

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiToken}`,
  });

  const fetchArtisans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/artisans`, { headers: getHeaders() });
      if (res.status === 401) throw new Error("Non autorisé — session expirée ?");
      if (!res.ok) throw new Error("Erreur lors du chargement des artisans");
      const data = await res.json();
      setArtisans(data.artisans || data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiToken) fetchArtisans();
  }, [apiToken]);

  const handleApprove = async (artisanId: string) => {
    setActionLoading(artisanId + "-approve");
    try {
      const res = await fetch(`${API}/api/artisans/${artisanId}/approve`, {
        method: "PATCH",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Échec de la validation");
      await fetchArtisans();
      showSuccessToast("Artisan validé");
    } catch (err: any) {
      showErrorToast("Validation impossible", err?.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (artisanId: string) => {
    setActionLoading(artisanId + "-reject");
    try {
      const res = await fetch(`${API}/api/artisans/${artisanId}/reject`, {
        method: "PATCH",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Échec du rejet");
      await fetchArtisans();
      showSuccessToast("Artisan rejeté");
    } catch (err: any) {
      showErrorToast("Rejet impossible", err?.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (userId: string, artisanId: string) => {
    setActionLoading(artisanId + "-suspend");
    try {
      const res = await fetch(`${API}/api/users/${userId}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status: "blocked" }),
      });
      if (!res.ok) throw new Error("Échec de la suspension");
      await fetchArtisans();
      showSuccessToast("Artisan suspendu");
    } catch (err: any) {
      showErrorToast("Suspension impossible", err?.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdminUpdate = async (id: string, payload: Record<string, unknown>) => {
    setActionLoading(id + "-edit");
    try {
      const res = await fetch(`${API}/api/artisans/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Échec de la mise à jour");
      await fetchArtisans();
      showSuccessToast("Artisan mis à jour");
      setEditTarget(null);
    } catch (err: any) {
      showErrorToast("Mise à jour impossible", err?.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = artisans.filter((a) => {
    const label = statusLabel(a);
    const matchTab =
      activeTab === "Tous" ||
      (activeTab === "Actif" && label === "Actif") ||
      (activeTab === "En attente" && label === "En attente") ||
      (activeTab === "Suspendu" && label === "Suspendu");
    const matchSearch =
      a.user.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.region || "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    total:     artisans.length,
    actif:     artisans.filter((a) => statusLabel(a) === "Actif").length,
    enAttente: artisans.filter((a) => statusLabel(a) === "En attente").length,
    suspendu:  artisans.filter((a) => statusLabel(a) === "Suspendu").length,
  };

  const isSessionLoading =
    sessionStatus === "loading" || (!apiToken && sessionStatus === "authenticated");

  return (
    <div>
      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        confirmLabel={confirmState.confirmLabel}
        danger={confirmState.danger}
        loading={false}
        onClose={() => setConfirmState({ open: false, title: "" })}
        onConfirm={() => {
          const cb = confirmState.onConfirm;
          setConfirmState({ open: false, title: "" });
          cb?.();
        }}
      />

      {/* Edit modal */}
      {editTarget && (
        <EditArtisanModal
          artisan={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleAdminUpdate}
          saving={actionLoading === editTarget._id + "-edit"}
        />
      )}

      {/* Page header */}
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Gestion des Artisans</h1>
          <p className="page-subtitle">{counts.total} artisans inscrits sur la plateforme</p>
        </div>
        <div className="header-actions-row">
          <div className="search-bar">
            <span className="search-bar-icon">⌕</span>
            <input
              className="search-bar-input"
              placeholder="Rechercher un artisan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary">⬇ Exporter</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total artisans", val: counts.total,     color: "#0234AB", icon: "◈" },
          { label: "Actifs",         val: counts.actif,     color: "#0B9E5E", icon: "✓" },
          { label: "En attente",     val: counts.enAttente, color: "#F59E0B", icon: "⏳" },
          { label: "Suspendus",      val: counts.suspendu,  color: "#E53E3E", icon: "✕" },
        ].map((s, i) => (
          <div key={s.label} className="order-stat-mini anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div className="order-stat-mini-label">{s.label}</div>
              <span style={{ fontSize: "1rem", color: s.color }}>{s.icon}</span>
            </div>
            <div className="order-stat-mini-value" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        {(["Tous", "Actif", "En attente", "Suspendu"] as FilterTab[]).map((t) => (
          <button key={t} className={`tab${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div className="card anim-fade-up anim-d3">
        <div className="card-header">
          <h2 className="card-title">Liste des artisans</h2>
          <span style={{ fontSize: "0.8rem", color: "black" }}>{filtered.length} résultat(s)</span>
        </div>

        {isSessionLoading && (
          <div style={{ padding: "40px", textAlign: "center", color: "black" }}>
            Chargement de la session...
          </div>
        )}

        {!isSessionLoading && loading && (
          <div style={{ padding: "40px", textAlign: "center", color: "black" }}>Chargement...</div>
        )}

        {!isSessionLoading && error && (
          <div style={{ padding: "24px", textAlign: "center", color: "#E53E3E" }}>
            {error}{" "}
            <button className="btn btn-secondary" onClick={fetchArtisans}>Réessayer</button>
          </div>
        )}

        {!isSessionLoading && !loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Artisan</th>
                  <th>Région</th>
                  <th>Téléphone</th>
                  <th>Statut</th>
                  <th>Inscrit le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "black" }}>
                      Aucun artisan trouvé
                    </td>
                  </tr>
                ) : (
                  filtered.map((a, i) => {
                    const label = statusLabel(a);
                    const isSaving = actionLoading === a._id + "-edit";
                    return (
                      <tr key={a._id} style={{ animationDelay: `${i * 0.055}s` }}>
                        <td>
                          <div className="user-cell">
                            <div className="user-row-avatar">{initials(a.user.name)}</div>
                            <div>
                              <div className="user-cell-name">{a.user.name}</div>
                              <div className="user-cell-email">{a.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "#4A5568", fontSize: "0.875rem" }}>{a.region || <CircleAlert color="red" />}</td>
                        <td style={{ color: "#4A5568", fontSize: "0.875rem" }}>{a.phone || <CircleAlert color="red"/>}</td>
                        <td>
                          <span className={`badge ${statusClass[label] || "badge-gray"}`}>{label}</span>
                          {a.isFeatured && (
                            <span
                              style={{
                                marginLeft: "6px", fontSize: ".7rem",
                                background: "#FEF3C7", color: "#92400E",
                                borderRadius: "4px", padding: "1px 5px",
                              }}
                            >
                              ⭐ Featured
                            </span>
                          )}
                        </td>
                        <td style={{ color: "black", fontSize: "0.82rem" }}>
                          {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {label === "En attente" && (
                              <>
                                <button
                                  className="btn btn-success btn-sm"
                                  disabled={actionLoading === a._id + "-approve"}
                                  onClick={() => handleApprove(a._id)}
                                >
                                  {actionLoading === a._id + "-approve" ? "..." : "✓ Valider"}
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  disabled={actionLoading === a._id + "-reject"}
                                  onClick={() =>
                                    setConfirmState({
                                      open: true,
                                      title: "Rejeter cet artisan ?",
                                      description: "Cette action refusera la demande de l'artisan.",
                                      confirmLabel: "Rejeter",
                                      danger: true,
                                      onConfirm: () => void handleReject(a._id),
                                    })
                                  }
                                >
                                  {actionLoading === a._id + "-reject" ? "..." : "✕"}
                                </button>
                              </>
                            )}

                            {/* Edit button — always visible */}
                            <button
                              className="icon-btn"
                              title="Modifier"
                              disabled={isSaving}
                              onClick={() => setEditTarget(a)}
                            >
                              {isSaving ? "..." : <Eye color="#0B3EBA" size={15}/>}
                            </button>

                            {label !== "En attente" && label !== "Suspendu" && (
                              <button
                                className="icon-btn danger"
                                title="Suspendre"
                                disabled={actionLoading === a._id + "-suspend"}
                                onClick={() =>
                                  setConfirmState({
                                    open: true,
                                    title: "Suspendre cet artisan ?",
                                    description:
                                      "L'artisan ne pourra plus se connecter ni vendre tant qu'il est suspendu.",
                                    confirmLabel: "Suspendre",
                                    danger: true,
                                    onConfirm: () => void handleSuspend(a.user._id, a._id),
                                  })
                                }
                              >
                                {actionLoading === a._id + "-suspend" ? "..." : <Ban size={15} color="red"/>}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}