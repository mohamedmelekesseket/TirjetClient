"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Trash2 } from "lucide-react";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

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

// ── Delete confirmation modal ──────────────────────────────────────
function DeleteUserModal({
  user,
  onClose,
  onConfirm,
  loading,
}: {
  user: User;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div
      onClick={() => !loading && onClose()}
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
          Supprimer l'utilisateur ?
        </h3>
        <p style={{ fontSize: "0.9rem", color: "#4a5568", marginBottom: 8, lineHeight: 1.5 }}>
          Cette action est irréversible.
        </p>
        <p style={{ fontSize: "0.9rem", color: "#4a5568", marginBottom: 24, lineHeight: 1.5 }}>
          <strong>«&nbsp;{user.name}&nbsp;»</strong> ({user.email}) sera définitivement supprimé.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "9px 20px", borderRadius: 8, border: "1px solid #e2e8f0",
              background: "#f8fafc", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
            }}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "9px 20px", borderRadius: 8, border: "none",
              background: "#e53e3e", color: "#fff", cursor: "pointer",
              fontWeight: 600, fontSize: "0.875rem",
              display: "flex", alignItems: "center", gap: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Suppression…</>
            ) : (
              "Supprimer"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Role Change Modal ──────────────────────────────────────────────
function RoleModal({
  user,
  onClose,
  onConfirm,
  loading,
}: {
  user: User;
  onClose: () => void;
  onConfirm: (newRole: User["role"]) => void;
  loading: boolean;
}) {
  const [selected, setSelected] = useState<User["role"]>(user.role);

  const roles: { value: User["role"]; label: string; description: string; color: string; gradient: string }[] = [
    { value: "user",   label: "Client",  description: "Peut parcourir et commander des produits", color: "#0234AB", gradient: "linear-gradient(135deg,#0234AB,#1a4fd4)" },
    { value: "vendor", label: "Artisan", description: "Peut créer et gérer des produits à vendre", color: "#0B9E5E", gradient: "linear-gradient(135deg,#0B9E5E,#047857)" },
    { value: "admin",  label: "Admin",   description: "Accès complet à l'administration",           color: "#8B5CF6", gradient: "linear-gradient(135deg,#8B5CF6,#6D28D9)" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(10,15,44,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "28px 28px 24px",
        width: "100%", maxWidth: 420, boxShadow: "0 24px 60px rgba(2,52,171,0.18)",
        animation: "modalIn 0.22s cubic-bezier(.34,1.56,.64,1) both",
      }} onClick={(e) => e.stopPropagation()}>
        <style>{`
          @keyframes modalIn { from { opacity:0; transform:scale(0.92) translateY(12px); } to { opacity:1; transform:none; } }
        `}</style>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: avatarGradient[user.role], color: "#fff", fontWeight: 700, fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {initials(user.name)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "#0A0F2C" }}>{user.name}</div>
            <div style={{ fontSize: "0.78rem", color: "#8B9AB5" }}>{user.email}</div>
          </div>
        </div>

        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#4A5568", marginBottom: 12 }}>
          Choisir un nouveau rôle
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {roles.map((r) => {
            const isActive = selected === r.value;
            return (
              <button key={r.value} onClick={() => setSelected(r.value)} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "13px 16px",
                borderRadius: 12, cursor: "pointer", textAlign: "left", width: "100%",
                border: `2px solid ${isActive ? r.color : "#E2E8F0"}`,
                background: isActive ? `${r.color}08` : "#FAFAFA",
                transition: "all 0.15s",
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: isActive ? r.gradient : "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 800, color: isActive ? "#fff" : "#8B9AB5" }}>
                    {r.label[0]}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: isActive ? r.color : "#2D3748" }}>
                    {r.label}
                    {user.role === r.value && (
                      <span style={{ marginLeft: 8, fontSize: "0.68rem", background: "#E2E8F0", color: "#8B9AB5", padding: "1px 7px", borderRadius: 10, fontWeight: 600 }}>
                        actuel
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.73rem", color: "#8B9AB5", marginTop: 2 }}>{r.description}</div>
                </div>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${isActive ? r.color : "#CBD5E0"}`, background: isActive ? r.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {isActive && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
                </div>
              </button>
            );
          })}
        </div>

        {selected === "admin" && user.role !== "admin" && (
          <div style={{ padding: "10px 14px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 10, fontSize: "0.78rem", color: "#c53030", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>
            Attention : accorder le rôle Admin donne un accès complet à la plateforme.
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={loading} style={{
            flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #E2E8F0",
            background: "#fff", color: "#4A5568", fontWeight: 600, fontSize: "0.85rem",
            cursor: "pointer", transition: "all 0.15s",
          }}>
            Annuler
          </button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={loading || selected === user.role}
            style={{
              flex: 2, padding: "11px", borderRadius: 10, border: "none",
              background: selected === user.role ? "#E2E8F0" : "linear-gradient(135deg,#0234AB,#1a4fd4)",
              color: selected === user.role ? "#8B9AB5" : "#fff",
              fontWeight: 700, fontSize: "0.85rem",
              cursor: selected === user.role ? "not-allowed" : "pointer",
              transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading ? (
              <>
                <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #ffffff44", borderTopColor: "#fff", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                Mise à jour…
              </>
            ) : (
              `Changer en ${roleLabel[selected]}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────
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

  // Role modal state
  const [roleModalUser, setRoleModalUser] = useState<User | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // ── Delete modal state ──
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // ── Status toggle ──
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
      showErrorToast(err.message ?? "Échec de mise à jour du statut utilisateur");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Role change ──
  const handleRoleChange = async (newRole: User["role"]) => {
    if (!roleModalUser) return;
    setRoleLoading(true);
    try {
      const res = await fetch(`${API}/api/users/${roleModalUser._id}/role`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Échec du changement de rôle");
      setUsers((prev) =>
        prev.map((u) => (u._id === roleModalUser._id ? { ...u, role: newRole } : u))
      );
      setRoleModalUser(null);
      showSuccessToast(`Rôle de ${roleModalUser.name} changé en ${roleLabel[newRole]}`);
    } catch (err: any) {
      showErrorToast(err.message ?? "Échec du changement de rôle");
    } finally {
      setRoleLoading(false);
    }
  };

  // ── Delete user ──
  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;
    setDeletingId(deleteConfirm._id);
    try {
      const res = await fetch(`${API}/api/users/${deleteConfirm._id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Échec de la suppression");
      setUsers((prev) => prev.filter((u) => u._id !== deleteConfirm._id));
      setDeleteConfirm(null);
      showSuccessToast(`Utilisateur «\u00a0${deleteConfirm.name}\u00a0» supprimé`);
    } catch (err: any) {
      showErrorToast(err.message ?? "Échec de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Filtering ──
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Role modal ── */}
      {roleModalUser && (
        <RoleModal
          user={roleModalUser}
          onClose={() => !roleLoading && setRoleModalUser(null)}
          onConfirm={handleRoleChange}
          loading={roleLoading}
        />
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteConfirm && (
        <DeleteUserModal
          user={deleteConfirm}
          onClose={() => !deletingId && setDeleteConfirm(null)}
          onConfirm={handleDeleteUser}
          loading={deletingId === deleteConfirm._id}
        />
      )}

      {/* ── Header ── */}
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

      {/* ── Stats ── */}
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

      {/* ── Filter tabs ── */}
      <div className="tabs">
        {(["Tous", "Clients", "Artisans", "Admins", "Suspendus"] as FilterTab[]).map((t) => (
          <button key={t} className={`tab${activeTab === t ? " active" : ""}`} onClick={() => handleTabChange(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="card anim-fade-up anim-d3">
        <div className="card-header">
          <h2 className="card-title">Tous les utilisateurs</h2>
          <span style={{ fontSize: "0.8rem", color: "#8B9AB5" }}>{filtered.length} affiché(s)</span>
        </div>

        {isSessionLoading && (
          <div style={{ padding: "40px", textAlign: "center", color: "#8B9AB5" }}>Chargement de la session...</div>
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
                    paginated.map((u, i) => {
                      const isDeleting = deletingId === u._id;
                      return (
                        <tr key={u._id} style={{ animationDelay: `${i * 0.055}s`, opacity: isDeleting ? 0.5 : 1 }}>
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
                            <button
                              onClick={() => setRoleModalUser(u)}
                              title="Changer le rôle"
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                padding: 0, display: "inline-flex", alignItems: "center", gap: 5,
                              }}
                            >
                              <span className={`badge ${roleColors[u.role]}`}>{roleLabel[u.role]}</span>
                              <span style={{ fontSize: "0.68rem", color: "#8B9AB5", fontWeight: 500 }}>✎</span>
                            </button>
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
                            <div style={{ display: "flex", gap: 6 }}>
                              {/* Change role */}
                              <button
                                className="icon-btn"
                                title="Changer le rôle"
                                onClick={() => setRoleModalUser(u)}
                                style={{ fontSize: "0.78rem", fontWeight: 600, color: "#0234AB" }}
                              >
                                ⇄ Rôle
                              </button>

                              {/* Suspend / activate (not for admins) */}
                              {u.role !== "admin" && (
                                <button
                                  className={`icon-btn${u.status === "active" ? " danger" : ""}`}
                                  title={u.status === "active" ? "Suspendre" : "Réactiver"}
                                  disabled={actionLoading === u._id}
                                  onClick={() => handleToggleStatus(u)}
                                >
                                  {actionLoading === u._id ? "…" : u.status === "active" ? "⊘" : "✓"}
                                </button>
                              )}

                              {/* Delete (not for admins) */}
                              {u.role !== "admin" && (
                                <button
                                  className="icon-btn danger"
                                  title="Supprimer"
                                  disabled={isDeleting}
                                  onClick={() => setDeleteConfirm(u)}
                                >
                                  {isDeleting
                                    ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                                    : <Trash2 size={14} />
                                  }
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

            {/* ── Pagination ── */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 22px", borderTop: "1px solid rgba(2,52,171,0.07)",
            }}>
              <span style={{ fontSize: "0.82rem", color: "#8B9AB5" }}>
                Affichage{" "}
                {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(page * ITEMS_PER_PAGE, filtered.length)} sur {filtered.length}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="icon-btn" style={{ fontSize: "0.82rem" }} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>←</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p} className="icon-btn" style={{
                    background: page === p ? "#0234AB" : "white",
                    color: page === p ? "white" : "#4A5568",
                    borderColor: page === p ? "transparent" : "rgba(2,52,171,0.12)",
                    fontSize: "0.82rem", fontWeight: page === p ? 700 : 400,
                  }} onClick={() => setPage(p)}>{p}</button>
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