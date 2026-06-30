"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useApiToken } from "@/lib/useApiToken";
import { Eye, X, Loader2, AlertCircle, CheckCircle2, RefreshCw  } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ALL_STATUSES = ["nouveau", "contacté", "inscrit", "refusé"] as const;
type Status = (typeof ALL_STATUSES)[number];

interface Formation {
  _id: string;
  nomPrenom: string;
  genre: "femme" | "homme";
  trancheAge: string;
  email: string;
  telephone: string;
  region: string;
  niveauEtudes: string;
  niveauOral: string;
  niveauEcrit: string;
  niveauTifinagh: string;
  attentes: string[];
  status: Status;
  motivation: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<Status, { label: string; badgeClass: string; dot: string; desc: string; gradient: string }> = {
  nouveau:  { label: "Nouveau",   badgeClass: "badge-warning", dot: "#F59E0B", desc: "Demande reçue, non encore traitée.",      gradient: "linear-gradient(135deg,#F59E0B,#D97706)" },
  contacté: { label: "Contacté",  badgeClass: "badge-primary", dot: "#8B5CF6", desc: "Le candidat a été contacté.",             gradient: "linear-gradient(135deg,#8B5CF6,#6D28D9)" },
  inscrit:  { label: "Inscrit",   badgeClass: "badge-success", dot: "#0B9E5E", desc: "Candidat inscrit à la formation.",        gradient: "linear-gradient(135deg,#0B9E5E,#047857)" },
  refusé:   { label: "Refusé",    badgeClass: "badge-danger",  dot: "#E53E3E", desc: "Demande refusée ou non retenue.",         gradient: "linear-gradient(135deg,#E53E3E,#C53030)" },
};

const TABS = ["Toutes", "Nouveau", "Contacté", "Inscrit", "Refusé"] as const;
type Tab = (typeof TABS)[number];

const TAB_STATUS_MAP: Record<Tab, Status | null> = {
  "Toutes":   null,
  "Nouveau":  "nouveau",
  "Contacté": "contacté",
  "Inscrit":  "inscrit",
  "Refusé":   "refusé",
};

const NIVEAU_LABEL: Record<string, string> = {
  bien: "Bien", moyen: "Moyen", non: "Non",
  oui: "Oui (connais bien)",
  secondaire: "Secondaire", bac: "Baccalauréat", superieur: "Supérieur",
  moins25: "< 25 ans", "26-40": "26–40 ans", "41-55": "41–55 ans", plus55: "> 55 ans",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Backdrop ────────────────────────────────────────────────────────────────
function Backdrop({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(
    <div onClick={onClick} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(10,15,44,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, overflowY: "auto",
    }}>
      {children}
    </div>,
    document.body
  );
}

// ─── Error Modal ─────────────────────────────────────────────────────────────
function ErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <Backdrop onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 16, padding: 32,
        maxWidth: 400, width: "100%", textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        animation: "modalIn 0.22s cubic-bezier(.34,1.56,.64,1) both",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <AlertCircle size={40} color="#E53E3E" />
        </div>
        <h3 style={{ margin: "0 0 10px", fontSize: "1.05rem", fontWeight: 700, color: "#0A0F2C" }}>
          Une erreur est survenue
        </h3>
        <p style={{ fontSize: "0.875rem", color: "#8B9AB5", marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <button onClick={onClose} style={{
          padding: "10px 28px", borderRadius: 8, border: "none",
          background: "#0234AB", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
        }}>Fermer</button>
      </div>
    </Backdrop>
  );
}

// ─── Delete Confirm Modal ────────────────────────────────────────────────────
function DeleteModal({ item, onClose, onConfirm, loading }: {
  item: Formation; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <Backdrop onClick={() => !loading && onClose()}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 16, padding: 32,
        maxWidth: 400, width: "100%", textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        animation: "modalIn 0.22s cubic-bezier(.34,1.56,.64,1) both",
      }}>
        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🗑️</div>
        <h3 style={{ margin: "0 0 10px", fontSize: "1.05rem", fontWeight: 700, color: "#0A0F2C" }}>
          Supprimer la demande ?
        </h3>
        <p style={{ fontSize: "0.875rem", color: "#8B9AB5", marginBottom: 24, lineHeight: 1.6 }}>
          La demande de <strong>{item.nomPrenom}</strong> sera définitivement supprimée.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={onClose} disabled={loading} style={{
            padding: "9px 20px", borderRadius: 8, border: "1px solid #e2e8f0",
            background: "#f8fafc", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", color: "#8B9AB5",
          }}>Retour</button>
          <button onClick={onConfirm} disabled={loading} style={{
            padding: "9px 20px", borderRadius: 8, border: "none",
            background: "#e53e3e", color: "#fff", cursor: "pointer",
            fontWeight: 600, fontSize: "0.875rem",
            display: "flex", alignItems: "center", gap: 8, opacity: loading ? 0.7 : 1,
          }}>
            {loading ? <><Loader2 size={14} className="animate-spin" /> Suppression…</> : "Supprimer"}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

// ─── Status Modal ────────────────────────────────────────────────────────────
function StatusModal({ item, onClose, onConfirm, loading }: {
  item: Formation; onClose: () => void; onConfirm: (s: Status) => void; loading: boolean;
}) {
  const [selected, setSelected] = useState<Status>(item.status);
  return (
    <Backdrop onClick={() => !loading && onClose()}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 20, padding: 28,
        width: "100%", maxWidth: 440,
        boxShadow: "0 24px 60px rgba(2,52,171,0.18)",
        animation: "modalIn 0.22s cubic-bezier(.34,1.56,.64,1) both",
      }}>
        <div style={{ marginBottom: 22 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 700, color: "#0A0F2C" }}>
            Modifier le statut
          </h3>
          <p style={{ fontSize: "0.82rem", color: "#8B9AB5", margin: 0 }}>
            Demande de <strong>{item.nomPrenom}</strong>
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {ALL_STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = selected === s;
            return (
              <button key={s} onClick={() => setSelected(s)} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                textAlign: "left", width: "100%",
                border: `2px solid ${isActive ? cfg.dot : "#F1F5F9"}`,
                background: isActive ? `${cfg.dot}12` : "#FAFAFA",
                transition: "all 0.15s",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: isActive ? cfg.gradient : "#E2E8F0",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <CheckCircle2 size={18} color={isActive ? "#fff" : "#8B9AB5"} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: isActive ? cfg.dot : "#2D3748" }}>
                    {cfg.label}
                    {item.status === s && (
                      <span style={{
                        marginLeft: 8, fontSize: "0.68rem",
                        background: "#E2E8F0", color: "#8B9AB5",
                        padding: "1px 7px", borderRadius: 10,
                      }}>actuel</span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.73rem", color: "#8B9AB5", marginTop: 2 }}>{cfg.desc}</div>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: `2px solid ${isActive ? cfg.dot : "#CBD5E0"}`,
                  background: isActive ? cfg.dot : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {isActive && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={loading} style={{
            flex: 1, padding: 12, borderRadius: 10,
            border: "1.5px solid #E2E8F0", background: "#fff",
            color: "#8B9AB5", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
          }}>Annuler</button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={loading || selected === item.status}
            style={{
              flex: 2, padding: 12, borderRadius: 10, border: "none",
              background: selected === item.status ? "#E2E8F0" : "linear-gradient(135deg,#0234AB,#1a4fd4)",
              color: selected === item.status ? "#8B9AB5" : "#fff",
              fontWeight: 700, fontSize: "0.85rem",
              cursor: loading || selected === item.status ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Appliquer le changement"}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ item, onClose }: { item: Formation; onClose: () => void }) {
  const cfg = STATUS_CONFIG[item.status];

  const infoRow = (label: string, value: string) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: "0.68rem", color: "#8B9AB5", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0A0F2C" }}>{value || "—"}</span>
    </div>
  );

  return (
    <Backdrop onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 680,
        boxShadow: "0 24px 60px rgba(2,52,171,0.18)",
        animation: "modalIn 0.22s cubic-bezier(.34,1.56,.64,1) both",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px", borderBottom: "1px solid #F1F5F9",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#8B9AB5", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
              Détail de la demande
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0234AB" }}>{item.nomPrenom}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={`badge ${cfg.badgeClass}`}>
              <span className="order-status-dot" style={{ background: cfg.dot }} />
              {cfg.label}
            </span>
            <button onClick={onClose} style={{
              width: 28, height: 28, borderRadius: 8, border: "1px solid #E2E8F0",
              background: "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#8B9AB5",
            }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14, maxHeight: "calc(90vh - 80px)", overflowY: "auto" }}>

          {/* Section 1 — Informations */}
          <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8B9AB5", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
              👤 Informations personnelles
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {infoRow("Genre", item.genre === "femme" ? "Femme" : "Homme")}
              {infoRow("Tranche d'âge", NIVEAU_LABEL[item.trancheAge] ?? item.trancheAge)}
              {infoRow("E-mail", item.email)}
              {infoRow("Téléphone", item.telephone)}
              {infoRow("Région", item.region)}
              {infoRow("Niveau d'études", NIVEAU_LABEL[item.niveauEtudes] ?? item.niveauEtudes)}
            </div>
          </div>

          {/* Section 2 — Compétences */}
          <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8B9AB5", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
              🗣️ Compétences actuelles
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              {infoRow("Niveau oral", NIVEAU_LABEL[item.niveauOral] ?? item.niveauOral)}
              {infoRow("Niveau écrit", NIVEAU_LABEL[item.niveauEcrit] ?? item.niveauEcrit)}
              {infoRow("Alphabet Tifinagh", NIVEAU_LABEL[item.niveauTifinagh] ?? item.niveauTifinagh)}
            </div>
          </div>

          {/* Section 3 — Attentes */}
          <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8B9AB5", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
               motivation
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {item.attentes.map((a, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", background: "#fff", borderRadius: 8,
                  border: "1px solid #E2E8F0", fontSize: "0.85rem", color: "#0A0F2C",
                }}>
                  {item.motivation}

                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8B9AB5", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              🎯 Attentes
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {item.attentes.map((a, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 12px", background: "#fff", borderRadius: 8,
                  border: "1px solid #E2E8F0", fontSize: "0.85rem", color: "#0A0F2C",
                }}>
                  <CheckCircle2 size={15} color="#0B9E5E" />
                  {a}
                </div>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10,
          }}>
            <span style={{ fontSize: "0.8rem", color: "#8B9AB5" }}>Soumis le</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0A0F2C" }}>{fmtDate(item.createdAt)}</span>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FormationsAdminPage() {
  const { apiToken, isLoading: tokenLoading } = useApiToken();

  const [items, setItems]           = useState<Formation[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<Tab>("Toutes");
  const [search, setSearch]         = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [errorMsg,      setErrorMsg]      = useState<string | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<Formation | null>(null);
  const [statusTarget,  setStatusTarget]  = useState<Formation | null>(null);
  const [detailTarget,  setDetailTarget]  = useState<Formation | null>(null);

  const getHeaders = useCallback(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${apiToken}` }),
    [apiToken]
  );

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/api/formation-amazigh`, { headers: getHeaders() });
      if (res.status === 401) throw new Error("Non autorisé — session expirée ?");
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.forms ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => { if (apiToken) fetchItems(); }, [apiToken, fetchItems]);

  async function handleStatusUpdate(newStatus: Status) {
    if (!statusTarget) return;
    const target = statusTarget;
    try {
      setUpdatingId(target._id);
      const res = await fetch(`${API}/api/formation-amazigh/${target._id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const updated = await res.json();
      setItems((prev) => prev.map((o) => (o._id === target._id ? updated.form : o)));
      setStatusTarget(null);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      setUpdatingId(target._id);
      const res = await fetch(`${API}/api/formation-amazigh/${target._id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setItems((prev) => prev.filter((o) => o._id !== target._id));
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    const anyOpen = !!(errorMsg || deleteTarget || statusTarget || detailTarget);
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [errorMsg, deleteTarget, statusTarget, detailTarget]);

  const isSessionLoading = tokenLoading || (!apiToken);

  const counts = {
    Toutes:   items.length,
    Nouveau:  items.filter((o) => o.status === "nouveau").length,
    Contacté: items.filter((o) => o.status === "contacté").length,
    Inscrit:  items.filter((o) => o.status === "inscrit").length,
    Refusé:   items.filter((o) => o.status === "refusé").length,
  } as Record<Tab, number>;

  const miniStats = [
    { label: "Total demandes", val: items.length,      color: "#0234AB" },
    { label: "Nouvelles",      val: counts["Nouveau"],  color: "#F59E0B" },
    { label: "Inscrits",       val: counts["Inscrit"],  color: "#0B9E5E" },
    { label: "Refusés",        val: counts["Refusé"],   color: "#E53E3E" },
  ];

  const visible = items.filter((o) => {
    const matchTab    = TAB_STATUS_MAP[activeTab] === null || o.status === TAB_STATUS_MAP[activeTab];
    const matchSearch = search === "" ||
      o.nomPrenom.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase()) ||
      o.region.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        .animate-spin      { animation: spin 1s linear infinite; }
        @keyframes modalIn { from { opacity:0; transform:scale(0.92) translateY(12px); } to { opacity:1; transform:none; } }
      `}</style>

      {/* Modals */}
      {errorMsg     && <ErrorModal  message={errorMsg} onClose={() => setErrorMsg(null)} />}
      {deleteTarget && <DeleteModal item={deleteTarget} loading={updatingId === deleteTarget._id} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}
      {statusTarget && <StatusModal item={statusTarget} loading={updatingId === statusTarget._id} onClose={() => setStatusTarget(null)} onConfirm={handleStatusUpdate} />}
      {detailTarget && <DetailModal item={detailTarget} onClose={() => setDetailTarget(null)} />}

      {/* Header */}
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Formations Amazigh</h1>
          <p className="page-subtitle">Gérez les demandes d'inscription à la formation</p>
        </div>
        <div className="header-actions-row">
          <div className="search-bar">
            <span className="search-bar-icon">⌕</span>
            <input
              className="search-bar-input"
              placeholder="Rechercher un candidat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#8B9AB5", padding: "0 8px" }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mini stats */}
      <div className="orders-stats">
        {miniStats.map((s, i) => (
          <div key={s.label} className="order-stat-mini anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="order-stat-mini-label">{s.label}</div>
            <div className="order-stat-mini-value" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
            {t}
            <span style={{
              marginLeft: 6, fontSize: "0.75rem",
              background: activeTab === t ? "rgba(255,255,255,0.25)" : "#f1f5f9",
              color: activeTab === t ? "inherit" : "#8B9AB5",
              padding: "1px 7px", borderRadius: 20, fontWeight: 600,
            }}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {(isSessionLoading || loading) && (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Loader2 size={32} className="animate-spin" style={{ opacity: 0.4 }} />
        </div>
      )}

      {!isSessionLoading && !loading && error && (
        <div className="card" style={{ padding: "2rem", textAlign: "center", color: "#e53e3e" }}>
          <p>{error}</p>
          <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={fetchItems}>Réessayer</button>
        </div>
      )}

      {!isSessionLoading && !loading && !error && visible.length === 0 && (
        <div className="card" style={{ padding: "4rem", textAlign: "center" }}>
          <p style={{ color: "#8B9AB5" }}>
            {search ? `Aucun résultat pour "${search}"` : "Aucune demande trouvée."}
          </p>
        </div>
      )}

      {!isSessionLoading && !loading && !error && visible.length > 0 && (
        <div className="card anim-fade-up anim-d2" style={{backgroundColor:"#232C47"}}>
          <div className="card-header" >
            <h2 className="card-title" style={{color:"white"}}>Liste des demandes</h2>
            <span style={{ fontSize: "0.8rem", color: "#8B9AB5" }}>{visible.length} demandes</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Candidat</th>
                  <th>Contact</th>
                  <th>Région</th>
                  <th>Niveau études</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Modifier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((o, i) => {
                  const cfg    = STATUS_CONFIG[o.status];
                  const isBusy = updatingId === o._id;
                  return (
                    <tr key={o._id} style={{ animationDelay: `${i * 0.06}s`, opacity: isBusy ? 0.6 : 1 }}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "white" }}>{o.nomPrenom}</div>
                        <div style={{ fontSize: "0.72rem", color: "#8B9AB5", marginTop: 2 }}>
                          {o.genre === "femme" ? "Femme" : "Homme"} · {NIVEAU_LABEL[o.trancheAge] ?? o.trancheAge}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.82rem" ,color:"white"}}>{o.email}</div>
                        <div style={{ fontSize: "0.72rem", color: "#8B9AB5", marginTop: 2 }}>{o.telephone}</div>
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "#8B9AB5" }}>{o.region}</td>
                      <td style={{ fontSize: "0.82rem", color: "#8B9AB5" }}>
                        {NIVEAU_LABEL[o.niveauEtudes] ?? o.niveauEtudes}
                      </td>
                      <td style={{ color: "#8B9AB5", fontSize: "0.82rem" }}>{fmtDate(o.createdAt)}</td>
                      <td>
                        <span className={`badge ${cfg.badgeClass}`}>
                          <span className="order-status-dot" style={{ background: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setStatusTarget(o)}
                          disabled={isBusy}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "6px 12px", borderRadius: 8,
                            border: "1px solid #373737", background: "#0D1530",
                            cursor: "pointer", fontSize: "0.8rem",
                            fontWeight: 600, color: "#ffffff", transition: "all 0.2s",
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.borderColor = "#0234AB")}
                          onMouseOut={(e)  => (e.currentTarget.style.borderColor = "#E2E8F0")}
                        >
                          {isBusy ? <Loader2 size={14} className="animate-spin" /> :<RefreshCw size={16}/>}
                          Statut
                        </button>
                      </td>
                      <td>
                        <div className="order-actions-cell">
                          <button className="icon-btn" title="Voir" onClick={() => setDetailTarget(o)}>
                            <Eye color="#0E2B7F" size={16} />
                          </button>
                          <button
                            className="icon-btn icon-btn-danger"
                            title="Supprimer"
                            disabled={isBusy}
                            onClick={() => setDeleteTarget(o)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}