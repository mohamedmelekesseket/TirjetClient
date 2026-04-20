"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import ConfirmDialog from "@/components/ConfirmDialog";

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

export default function AdminArtisansPage() {
  const { data: session, status: sessionStatus } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("Tous");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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
    total: artisans.length,
    actif: artisans.filter((a) => statusLabel(a) === "Actif").length,
    enAttente: artisans.filter((a) => statusLabel(a) === "En attente").length,
    suspendu: artisans.filter((a) => statusLabel(a) === "Suspendu").length,
  };

  const isSessionLoading = sessionStatus === "loading" || (!apiToken && sessionStatus === "authenticated");

  return (
    <div>
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
          { label: "Total artisans", val: counts.total, color: "#0234AB", icon: "◈" },
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
          <span style={{ fontSize: "0.8rem", color: "#8B9AB5" }}>{filtered.length} résultat(s)</span>
        </div>

        {isSessionLoading && (
          <div style={{ padding: "40px", textAlign: "center", color: "#8B9AB5" }}>
            Chargement de la session...
          </div>
        )}

        {!isSessionLoading && loading && (
          <div style={{ padding: "40px", textAlign: "center", color: "#8B9AB5" }}>Chargement...</div>
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
                    <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#8B9AB5" }}>
                      Aucun artisan trouvé
                    </td>
                  </tr>
                ) : (
                  filtered.map((a, i) => {
                    const label = statusLabel(a);
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
                        <td style={{ color: "#4A5568", fontSize: "0.875rem" }}>{a.region || "—"}</td>
                        <td style={{ color: "#4A5568", fontSize: "0.875rem" }}>{a.phone || "—"}</td>
                        <td>
                          <span className={`badge ${statusClass[label] || "badge-gray"}`}>{label}</span>
                        </td>
                        <td style={{ color: "#8B9AB5", fontSize: "0.82rem" }}>
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
                                      description: "Cette action refusera la demande de l’artisan.",
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
                            {label !== "En attente" && (
                              <>
                                <button className="icon-btn" title="Voir">👁</button>
                                {label !== "Suspendu" && (
                                  <button
                                    className="icon-btn danger"
                                    title="Suspendre"
                                    disabled={actionLoading === a._id + "-suspend"}
                                    onClick={() =>
                                      setConfirmState({
                                        open: true,
                                        title: "Suspendre cet artisan ?",
                                        description: "L’artisan ne pourra plus se connecter ni vendre tant qu’il est suspendu.",
                                        confirmLabel: "Suspendre",
                                        danger: true,
                                        onConfirm: () => void handleSuspend(a.user._id, a._id),
                                      })
                                    }
                                  >
                                    {actionLoading === a._id + "-suspend" ? "..." : "⊘"}
                                  </button>
                                )}
                              </>
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