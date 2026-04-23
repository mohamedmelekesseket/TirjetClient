"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Check, Plus, Eye, Flag, Gem, Package, Search, Shirt, Lamp, X, Loader2, Home } from "lucide-react";
import type { ComponentType } from "react";
import Link from "next/link";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Product {
  _id: string;
  title: string;
  price: number;
  category: string | { _id: string; name: string; slug?: string; mainCategory?: any };
  stock: number;
  isApproved: boolean;
  isReported?: boolean;
  isHome?: boolean;
  images: string[];
  artisan: { _id: string; name: string; slug?: string } | string | null;
  createdAt: string;
  isSuspended?: boolean;
}

type FilterTab = "Tous" | "Publiés" | "En attente" | "Signalés" | "Suspendus" | "Accueil";

// ── Safe field extractors ───────────────────────────────────────────────────

const getCategoryDisplay = (category: Product["category"]): string => {
  if (!category) return "—";
  if (typeof category === "object") {
    return category.name || category.slug || "—";
  }
  return categoryLabel[category] || category || "—";
};

const getCategoryIconKey = (category: Product["category"]): string => {
  if (!category) return "";
  if (typeof category === "object") return category.slug || "";
  return category;
};

const getArtisanName = (artisan: Product["artisan"]): string => {
  if (!artisan) return "—";
  if (typeof artisan === "string") return artisan;
  return artisan.name || "—";
};

const getPrice = (price: any): number => {
  if (typeof price === "number") return price;
  if (typeof price === "object" && price !== null) return 0;
  return Number(price) || 0;
};

// ───────────────────────────────────────────────────────────────────────────

const categoryIcon: Record<string, ComponentType<{ size?: number }>> = {
  fokhar: Package,
  margoum: Shirt,
  bijoux: Gem,
  tissage: Lamp,
};

const categoryLabel: Record<string, string> = {
  fokhar: "Fokhar",
  margoum: "Margoum",
  bijoux: "Bijoux",
  tissage: "Tissage",
};

const productStatus = (p: Product): "Publié" | "En attente" | "Suspendu" =>
  !p.isApproved ? "En attente" : "Publié";

const statusClass: Record<string, string> = {
  Publié: "badge-success",
  "En attente": "badge-warning",
  Suspendu: "badge-danger",
};

export default function AdminProductsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("Tous");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiToken}`,
  });

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/products?limit=100`, { headers: getHeaders() });
      if (res.status === 401) throw new Error("Non autorisé — session expirée ?");
      if (!res.ok) throw new Error("Erreur lors du chargement des produits");
      const data = await res.json();
      console.log("total:", data.products.length);
      setProducts(data.products || data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiToken) fetchProducts();
  }, [apiToken]);

  const handleApprove = async (id: string) => {
    setActionLoading(id + "-approve");
    try {
      const res = await fetch(`${API}/api/products/${id}/approve`, {
        method: "PATCH",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Échec de la validation");
      await fetchProducts();
      showSuccessToast("Produit validé");
    } catch (err: any) {
      showErrorToast("Validation impossible", err?.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ── NEW: Toggle isHome ──────────────────────────────────────────────────
  const handleToggleHome = async (id: string, currentValue: boolean) => {
    setActionLoading(id + "-home");
    try {
      const res = await fetch(`${API}/api/products/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ isHome: !currentValue }),
      });
      if (!res.ok) throw new Error("Échec");
      // Optimistic update — no need for full refetch
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isHome: !currentValue } : p))
      );
      showSuccessToast(currentValue ? "Retiré de l'accueil" : "Mis en vedette sur l'accueil");
    } catch (err: any) {
      showErrorToast("Erreur", err?.message);
    } finally {
      setActionLoading(null);
    }
  };
  // ───────────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await fetch(`${API}/api/products/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      
      setDeleteConfirm(null);
      showSuccessToast("Produit supprimé");
    } catch (err: any) {
      showErrorToast("Suppression impossible", err?.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter((p) => {
    const status = productStatus(p);
    const matchTab =
      activeTab === "Tous" ||
      (activeTab === "Publiés" && status === "Publié") ||
      (activeTab === "En attente" && status === "En attente") ||
      (activeTab === "Signalés" && p.isReported) ||
      (activeTab === "Suspendus" && status === "Suspendu") ||
      (activeTab === "Accueil" && p.isHome === true); // ← NEW
    const artisanName = getArtisanName(p.artisan);
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      artisanName.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    total: products.length,
    published: products.filter((p) => productStatus(p) === "Publié").length,
    pending: products.filter((p) => productStatus(p) === "En attente").length,
    reported: products.filter((p) => p.isReported).length,
    home: products.filter((p) => p.isHome === true).length, // ← NEW
  };

  const isSessionLoading =
    sessionStatus === "loading" || (!apiToken && sessionStatus === "authenticated");

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Delete confirmation modal ── */}
      {deleteConfirm && (
        <div
          onClick={() => !deletingId && setDeleteConfirm(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 16, padding: 32,
              maxWidth: 400, width: "100%", textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: "0 0 10px", fontSize: "1.1rem", fontWeight: 700 }}>
              Supprimer le produit ?
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#4a5568", marginBottom: 24, lineHeight: 1.5 }}>
              Cette action est irréversible.{" "}
              <strong>«&nbsp;{deleteConfirm.title}&nbsp;»</strong> sera définitivement supprimé.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={!!deletingId}
                style={{
                  padding: "9px 20px", borderRadius: 8, border: "1px solid #e2e8f0",
                  background: "#f8fafc", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm._id)}
                disabled={deletingId === deleteConfirm._id}
                style={{
                  padding: "9px 20px", borderRadius: 8, border: "none",
                  background: "#e53e3e", color: "#fff", cursor: "pointer",
                  fontWeight: 600, fontSize: "0.875rem",
                  display: "flex", alignItems: "center", gap: 8,
                  opacity: deletingId === deleteConfirm._id ? 0.7 : 1,
                }}
              >
                {deletingId === deleteConfirm._id ? (
                  <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Suppression…</>
                ) : (
                  "Supprimer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ── */}
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Gestion des Produits</h1>
          <p className="page-subtitle">Modérez et contrôlez les produits de la plateforme</p>
        </div>
        <div className="header-actions-row">
          <div className="search-bar">
            <span className="search-bar-icon"><Search size={16} /></span>
            <input
              className="search-bar-input"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link href="/dashboard/admin/products/create" className="btn btn-primary">
            <Plus size={16} style={{ marginRight: 8 }} />
            Nouveau produit
          </Link>
        </div>
      </div>

      {/* ── Stats — now 5 cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total produits", val: counts.total,     color: "#0234AB" },
          { label: "Publiés",        val: counts.published, color: "#0B9E5E" },
          { label: "En attente",     val: counts.pending,   color: "#F59E0B" },
          { label: "Signalés",       val: counts.reported,  color: "#E53E3E" },
          { label: "Accueil",        val: counts.home,      color: "#6B46C1" }, // ← NEW
        ].map((s, i) => (
          <div key={s.label} className="order-stat-mini anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="order-stat-mini-label">{s.label}</div>
            <div className="order-stat-mini-value" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs — now includes Accueil ── */}
      <div className="tabs">
        {(["Tous", "Publiés", "En attente", "Signalés", "Suspendus", "Accueil"] as FilterTab[]).map((t) => (
          <button key={t} className={`tab${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
            {t === "Accueil" ? (
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Home size={13} /> {t}
              </span>
            ) : t}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="card anim-fade-up anim-d3">
        <div className="card-header">
          <h2 className="card-title">Catalogue complet</h2>
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
            <button className="btn btn-secondary" onClick={fetchProducts}>Réessayer</button>
          </div>
        )}

        {!isSessionLoading && !loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Artisan</th>
                  <th>Catégorie</th>
                  <th>Prix</th>
                  <th>Stock</th>
                  <th>Signalé</th>
                  <th>Accueil</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "#8B9AB5" }}>
                      Aucun produit trouvé
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, i) => {
                    const status = productStatus(p);
                    const catDisplay = getCategoryDisplay(p.category);
                    const iconKey = getCategoryIconKey(p.category);
                    const artisanName = getArtisanName(p.artisan);
                    const price = getPrice(p.price);
                    const Icon = categoryIcon[iconKey] || Package;
                    const isDeleting = deletingId === p._id;
                    const isHomeBusy = actionLoading === p._id + "-home";

                    return (
                      <tr key={p._id} style={{ animationDelay: `${i * 0.055}s`, opacity: isDeleting ? 0.5 : 1 }}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                              width: "36px", height: "36px", borderRadius: "10px",
                              background: "linear-gradient(135deg,#EEF2FF,#E0E9FF)",
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>
                              <Icon size={18} />
                            </div>
                            <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>{p.title}</span>
                          </div>
                        </td>
                        <td style={{ color: "#4A5568", fontSize: "0.875rem" }}>{artisanName}</td>
                        <td>
                          <span className="badge badge-primary">{catDisplay}</span>
                        </td>
                        <td>
                          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.8rem", fontWeight: 700 }}>
                            {price.toLocaleString("fr-FR")} TND
                          </span>
                        </td>
                        <td className="td-mono">{p.stock}</td>
                        <td>
                          {p.isReported
                            ? <span className="badge badge-danger"><Flag size={14} style={{ marginRight: 6 }} />Signalé</span>
                            : <span style={{ color: "#8B9AB5", fontSize: "0.82rem" }}>—</span>
                          }
                        </td>

                        {/* ── NEW: isHome column ── */}
                        <td>
                          {p.isHome ? (
                            <button
                              title="Retirer de l'accueil"
                              disabled={isHomeBusy}
                              onClick={() => handleToggleHome(p._id, true)}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                padding: "3px 10px", borderRadius: 20, border: "none", cursor: "pointer",
                                background: "#EBF8FF", color: "#0234AB", fontWeight: 600, fontSize: "0.75rem",
                                opacity: isHomeBusy ? 0.6 : 1, transition: "opacity 0.15s",
                              }}
                            >
                              {isHomeBusy
                                ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                                : <Home size={12} />}
                              Accueil
                            </button>
                          ) : (
                            <span style={{ color: "#8B9AB5", fontSize: "0.82rem" }}>—</span>
                          )}
                        </td>

                        <td>
                          <span className={`badge ${statusClass[status] || "badge-gray"}`}>{status}</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px",borderColor:"blue",color:"blue" }}>
                            <Link href={`/dashboard/admin/products/${p._id}`} style={{borderColor:"blue",color:"blue"}} className="icon-btn" title="Voir">
                              <Eye size={16} />
                            </Link>

                            {status === "En attente" && (
                              <button
                                className="btn btn-success btn-sm"
                                disabled={actionLoading === p._id + "-approve"}
                                onClick={() => handleApprove(p._id)}
                                style={{borderColor:"blue",color:"blue"}}
                              >
                                {actionLoading === p._id + "-approve" ? "..." : <Check size={14} />}
                              </button>
                            )}

                            {p.isReported ? (
                              <button
                                className="btn btn-danger btn-sm"
                                disabled={isDeleting}
                                onClick={() => setDeleteConfirm(p)}
                              >
                                {isDeleting
                                  ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                                  : <><X size={14} style={{ marginRight: 4 }} />Retirer</>
                                }
                              </button>
                            ) : (
                              status !== "En attente" && (
                                <button
                                  className="icon-btn danger"
                                  title="Supprimer"
                                  disabled={isDeleting}
                                  onClick={() => setDeleteConfirm(p)}
                                  style={{borderColor:"red",color:"red"}}
                                >
                                  {isDeleting
                                    ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                    : <X size={16} />
                                  }
                                </button>
                              )
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