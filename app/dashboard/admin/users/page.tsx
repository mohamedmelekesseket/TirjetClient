"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "vendor" | "admin";
  status: "active" | "pending" | "blocked";
  isVerified: boolean;
  createdAt: string;
}

type FilterTab = "Tous" | "Clients" | "Artisans" | "Admins" | "Suspendus";

const ITEMS_PER_PAGE = 10;

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const roleLabel: Record<string, string> = { user: "Client", vendor: "Artisan", admin: "Admin" };
const roleColors: Record<string, string> = { user: "badge-primary", vendor: "badge-success", admin: "badge-purple" };
const avatarGradient: Record<string, string> = {
  user:   "linear-gradient(135deg,#0234AB,#1a4fd4)",
  vendor: "linear-gradient(135deg,#0B9E5E,#047857)",
  admin:  "linear-gradient(135deg,#8B5CF6,#6D28D9)",
};

export default function AdminUsersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("Tous");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiToken}`,
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/users`, { headers: getHeaders() });
      if (res.status === 401) throw new Error("Non autorisé — session expirée ?");
      if (!res.ok) throw new Error("Erreur lors du chargement des utilisateurs");
      const data = await res.json();
      setUsers(data.users || data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiToken) fetchUsers();
  }, [apiToken]);

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "active" ? "blocked" : "active";
    const action = newStatus === "blocked" ? "Suspendre" : "Réactiver";
    if (!confirm(`${action} cet utilisateur ?`)) return;
    setActionLoading(user._id);
    try {
      const res = await fetch(`${API}/api/users/${user._id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`Échec : ${action}`);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchTab =
      activeTab === "Tous" ||
      (activeTab === "Clients"   && u.role === "user") ||
      (activeTab === "Artisans"  && u.role === "vendor") ||
      (activeTab === "Admins"    && u.role === "admin") ||
      (activeTab === "Suspendus" && u.status === "blocked");
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const counts = {
    total:     users.length,
    clients:   users.filter((u) => u.role === "user").length,
    artisans:  users.filter((u) => u.role === "vendor").length,
    suspended: users.filter((u) => u.status === "blocked").length,
  };

  const handleTabChange = (tab: FilterTab) => { setActiveTab(tab); setPage(1); };

  const isSessionLoading = sessionStatus === "loading" || (!apiToken && sessionStatus === "authenticated");

  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Gestion des Utilisateurs</h1>
          <p className="page-subtitle">Administrez tous les comptes de la plateforme</p>
        </div>
        <div className="header-actions-row">
          <div className="search-bar">
            <span className="search-bar-icon">⌕</span>
            <input
              className="search-bar-input"
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total comptes", val: counts.total,     color: "#0234AB" },
          { label: "Clients",       val: counts.clients,   color: "#8B5CF6" },
          { label: "Artisans",      val: counts.artisans,  color: "#0B9E5E" },
          { label: "Suspendus",     val: counts.suspended, color: "#E53E3E" },
        ].map((s, i) => (
          <div key={s.label} className="order-stat-mini anim-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="order-stat-mini-label">{s.label}</div>
            <div className="order-stat-mini-value" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        {(["Tous", "Clients", "Artisans", "Admins", "Suspendus"] as FilterTab[]).map((t) => (
          <button key={t} className={`tab${activeTab === t ? " active" : ""}`} onClick={() => handleTabChange(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card anim-fade-up anim-d3">
        <div className="card-header">
          <h2 className="card-title">Tous les utilisateurs</h2>
          <span style={{ fontSize: "0.8rem", color: "#8B9AB5" }}>{filtered.length} affiché(s)</span>
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
            <button className="btn btn-secondary" onClick={fetchUsers}>Réessayer</button>
          </div>
        )}

        {!isSessionLoading && !loading && !error && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Rôle</th>
                    <th>Inscrit le</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "#8B9AB5" }}>
                        Aucun utilisateur trouvé
                      </td>
                    </tr>
                  ) : (
                    paginated.map((u, i) => (
                      <tr key={u._id} style={{ animationDelay: `${i * 0.055}s` }}>
                        <td>
                          <div className="user-cell">
                            <div className="user-row-avatar" style={{ background: avatarGradient[u.role] }}>
                              {initials(u.name)}
                            </div>
                            <div>
                              <div className="user-cell-name">{u.name}</div>
                              <div className="user-cell-email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${roleColors[u.role]}`}>{roleLabel[u.role]}</span>
                        </td>
                        <td style={{ color: "#8B9AB5", fontSize: "0.82rem" }}>
                          {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td>
                          <span className={`badge ${u.status === "active" ? "badge-success" : "badge-danger"}`}>
                            {u.status === "active" ? "Actif" : "Suspendu"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button className="icon-btn" title="Voir profil">👁</button>
                            {u.role !== "admin" && (
                              <button
                                className={`icon-btn${u.status === "active" ? " danger" : ""}`}
                                title={u.status === "active" ? "Suspendre" : "Réactiver"}
                                disabled={actionLoading === u._id}
                                onClick={() => handleToggleStatus(u)}
                              >
                                {actionLoading === u._id ? "..." : u.status === "active" ? "⊘" : "✓"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 22px", borderTop: "1px solid rgba(2,52,171,0.07)",
            }}>
              <span style={{ fontSize: "0.82rem", color: "#8B9AB5" }}>
                Affichage{" "}
                {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(page * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button className="icon-btn" style={{ fontSize: "0.82rem" }} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>←</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className="icon-btn"
                    style={{
                      background: page === p ? "#0234AB" : "white",
                      color: page === p ? "white" : "#4A5568",
                      borderColor: page === p ? "transparent" : "rgba(2,52,171,0.12)",
                      fontSize: "0.82rem",
                      fontWeight: page === p ? 700 : 400,
                    }}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button className="icon-btn" style={{ fontSize: "0.82rem" }} disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>→</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}