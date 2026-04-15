"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Check, Plus, Eye, Flag, Gem, Package, Search, Shirt, Lamp, X, Loader2 } from "lucide-react";
import type { ComponentType } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Product {
  _id: string;
  title: string;
  price: number;
  category: string;
  stock: number;
  isApproved: boolean;
  isReported?: boolean;
  images: string[];
  artisan: { _id: string; name: string };
  createdAt: string;
  isSuspended?: boolean;
}

type FilterTab = "Tous" | "Publiés" | "En attente" | "Signalés" | "Suspendus";

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

  // ── Delete confirmation modal state ──
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
      const res = await fetch(`${API}/api/products`, { headers: getHeaders() });
      if (res.status === 401) throw new Error("Non autorisé — session expirée ?");
      if (!res.ok) throw new Error("Erreur lors du chargement des produits");
      const data = await res.json();
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
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Confirmed delete (called from modal) ──
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
    } catch (err: any) {
      alert(err.message);
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
      (activeTab === "Suspendus" && status === "Suspendu");
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.artisan?.name || "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    total: products.length,
    published: products.filter((p) => productStatus(p) === "Publié").length,
    pending: products.filter((p) => productStatus(p) === "En attente").length,
    reported: products.filter((p) => p.isReported).length,
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

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total produits", val: counts.total,     color: "#0234AB" },
          { label: "Publiés",        val: counts.published, color: "#0B9E5E" },
          { label: "En attente",     val: counts.pending,   color: "#F59E0B" },
          { label: "Signalés",       val: counts.reported,  color: "#E53E3E" },
        ].map((s, i) => (
          <div key={s.label} className="order-stat-mini anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="order-stat-mini-label">{s.label}</div>
            <div className="order-stat-mini-value" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div className="tabs">
        {(["Tous", "Publiés", "En attente", "Signalés", "Suspendus"] as FilterTab[]).map((t) => (
          <button key={t} className={`tab${activeTab === t ? " active" : ""}`} onClick={() => setActiveTab(t)}>
            {t}
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
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "#8B9AB5" }}>
                      Aucun produit trouvé
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, i) => {
                    const status = productStatus(p);
                    const Icon = categoryIcon[p.category] || Package;
                    const isDeleting = deletingId === p._id;

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
                        <td style={{ color: "#4A5568", fontSize: "0.875rem" }}>{p.artisan?.name || "—"}</td>
                        <td><span className="badge badge-primary">{categoryLabel[p.category] || p.category}</span></td>
                        <td>
                          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.8rem", fontWeight: 700 }}>
                            {p.price.toLocaleString("fr-FR")} TND
                          </span>
                        </td>
                        <td className="td-mono">{p.stock}</td>
                        <td>
                          {p.isReported
                            ? <span className="badge badge-danger"><Flag size={14} style={{ marginRight: 6 }} />Signalé</span>
                            : <span style={{ color: "#8B9AB5", fontSize: "0.82rem" }}>—</span>
                          }
                        </td>
                        <td>
                          <span className={`badge ${statusClass[status] || "badge-gray"}`}>{status}</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <Link href={`/dashboard/admin/products/${p._id}`} className="icon-btn" title="Voir">
                              <Eye size={16} />
                            </Link>

                            {status === "En attente" && (
                              <button
                                className="btn btn-success btn-sm"
                                disabled={actionLoading === p._id + "-approve"}
                                onClick={() => handleApprove(p._id)}
                              >
                                {actionLoading === p._id + "-approve" ? "..." : <Check size={14} />}
                              </button>
                            )}

                            {/* ── All delete paths now open the modal ── */}
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