"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Eye, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ALL_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
type Status = (typeof ALL_STATUSES)[number];

interface Order {
  _id: string;
  orderNumber?: string;
  items: { product: { title: string } | null; quantity: number; price: number }[];
  user?: { name: string; email: string };
  createdAt: string;
  total: number;
  status: Status;
  paymentMethod?: "card" | "cash_on_delivery";
  shippingAddress?: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    notes?: string;
  };
}

const STATUS_CONFIG: Record<Status, { label: string; badgeClass: string; dot: string; desc: string; gradient: string }> = {
  pending:   { label: "En attente", badgeClass: "badge-warning", dot: "#F59E0B", desc: "Commande reçue, en attente de traitement.",  gradient: "linear-gradient(135deg,#F59E0B,#D97706)" },
  paid:      { label: "Payé",       badgeClass: "badge-primary", dot: "#0234AB", desc: "Paiement confirmé par le client.",            gradient: "linear-gradient(135deg,#0234AB,#1a4fd4)" },
  shipped:   { label: "En cours",   badgeClass: "badge-primary", dot: "#8B5CF6", desc: "Le colis est en préparation ou expédié.",     gradient: "linear-gradient(135deg,#8B5CF6,#6D28D9)" },
  delivered: { label: "Livré",      badgeClass: "badge-success", dot: "#0B9E5E", desc: "Commande reçue par le client.",               gradient: "linear-gradient(135deg,#0B9E5E,#047857)" },
  cancelled: { label: "Annulé",     badgeClass: "badge-danger",  dot: "#E53E3E", desc: "Commande annulée définitivement.",            gradient: "linear-gradient(135deg,#E53E3E,#C53030)" },
};

const TABS = ["Toutes", "En attente", "En cours", "Livrées", "Annulées"] as const;
type Tab = (typeof TABS)[number];

const TAB_STATUS_MAP: Record<Tab, Status | null> = {
  "Toutes":      null,
  "En attente": "pending",
  "En cours":   "shipped",
  "Livrées":    "delivered",
  "Annulées":   "cancelled",
};

function orderProductLabel(order: Order): string {
  if (!order.items?.length) return "—";
  const title = order.items[0]?.product?.title ?? "Produit supprimé";
  return order.items.length > 1 ? `${title} +${order.items.length - 1}` : title;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared backdrop
// ─────────────────────────────────────────────────────────────────────────────
function Backdrop({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(10,15,44,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Error modal
// ─────────────────────────────────────────────────────────────────────────────
function ErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <Backdrop onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, padding: 32,
          maxWidth: 400, width: "100%", textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          animation: "modalIn 0.22s cubic-bezier(.34,1.56,.64,1) both",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <AlertCircle size={40} color="#E53E3E" />
        </div>
        <h3 style={{ margin: "0 0 10px", fontSize: "1.05rem", fontWeight: 700, color: "#0A0F2C" }}>
          Une erreur est survenue
        </h3>
        <p style={{ fontSize: "0.875rem", color: "#4a5568", marginBottom: 24, lineHeight: 1.6 }}>
          {message}
        </p>
        <button
          onClick={onClose}
          style={{
            padding: "10px 28px", borderRadius: 8, border: "none",
            background: "#0234AB", color: "#fff", cursor: "pointer",
            fontWeight: 600, fontSize: "0.875rem",
          }}
        >
          Fermer
        </button>
      </div>
    </Backdrop>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cancel confirm modal
// ─────────────────────────────────────────────────────────────────────────────
function CancelModal({
  order, onClose, onConfirm, loading,
}: {
  order: Order; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  const displayId = order.orderNumber ?? `#${order._id.slice(-6).toUpperCase()}`;
  return (
    <Backdrop onClick={() => !loading && onClose()}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, padding: 32,
          maxWidth: 400, width: "100%", textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          animation: "modalIn 0.22s cubic-bezier(.34,1.56,.64,1) both",
        }}
      >
        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🚫</div>
        <h3 style={{ margin: "0 0 10px", fontSize: "1.05rem", fontWeight: 700, color: "#0A0F2C" }}>
          Annuler la commande ?
        </h3>
        <p style={{ fontSize: "0.875rem", color: "#4a5568", marginBottom: 6, lineHeight: 1.6 }}>
          Cette action est irréversible.
        </p>
        <p style={{ fontSize: "0.875rem", color: "#4a5568", marginBottom: 24, lineHeight: 1.6 }}>
          La commande <strong>«&nbsp;{displayId}&nbsp;»</strong> sera définitivement annulée.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "9px 20px", borderRadius: 8, border: "1px solid #e2e8f0",
              background: "#f8fafc", cursor: "pointer", fontWeight: 600,
              fontSize: "0.875rem", color: "#4a5568",
            }}
          >
            Retour
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
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Annulation…</>
              : "Confirmer l'annulation"}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Selection Modal
// ─────────────────────────────────────────────────────────────────────────────
function StatusSelectionModal({
  order, onClose, onConfirm, loading,
}: {
  order: Order; onClose: () => void; onConfirm: (newStatus: Status) => void; loading: boolean;
}) {
  const [selected, setSelected] = useState<Status>(order.status);
  const displayId = order.orderNumber ?? `#${order._id.slice(-6).toUpperCase()}`;

  return (
    <Backdrop onClick={() => !loading && onClose()}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, padding: "28px",
          width: "100%", maxWidth: 440,
          boxShadow: "0 24px 60px rgba(2,52,171,0.18)",
          animation: "modalIn 0.22s cubic-bezier(.34,1.56,.64,1) both",
        }}
      >
        <div style={{ marginBottom: 22 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 700, color: "#0A0F2C" }}>
            Modifier le statut
          </h3>
          <p style={{ fontSize: "0.82rem", color: "#8B9AB5", margin: 0 }}>
            Commande <strong>{displayId}</strong> · {order.user?.name || "Client anonyme"}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {ALL_STATUSES.map((statusKey) => {
            const cfg = STATUS_CONFIG[statusKey];
            const isActive = selected === statusKey;
            return (
              <button
                key={statusKey}
                onClick={() => setSelected(statusKey)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                  textAlign: "left", width: "100%",
                  border: `2px solid ${isActive ? cfg.dot : "#F1F5F9"}`,
                  background: isActive ? `${cfg.dot}08` : "#FAFAFA",
                  transition: "all 0.15s",
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: isActive ? cfg.gradient : "#E2E8F0",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <CheckCircle2 size={18} color={isActive ? "#fff" : "#8B9AB5"} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", color: isActive ? cfg.dot : "#2D3748" }}>
                    {cfg.label}
                    {order.status === statusKey && (
                      <span style={{
                        marginLeft: 8, fontSize: "0.68rem",
                        background: "#E2E8F0", color: "#8B9AB5",
                        padding: "1px 7px", borderRadius: 10,
                      }}>
                        actuel
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.73rem", color: "#8B9AB5", marginTop: 2 }}>{cfg.desc}</div>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: `2px solid ${isActive ? cfg.dot : "#CBD5E0"}`,
                  background: isActive ? cfg.dot : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isActive && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: "12px", borderRadius: 10,
              border: "1.5px solid #E2E8F0", background: "#fff",
              color: "#4A5568", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={loading || selected === order.status}
            style={{
              flex: 2, padding: "12px", borderRadius: 10, border: "none",
              background: selected === order.status
                ? "#E2E8F0"
                : "linear-gradient(135deg,#0234AB,#1a4fd4)",
              color: selected === order.status ? "#8B9AB5" : "#fff",
              fontWeight: 700, fontSize: "0.85rem",
              cursor: loading || selected === order.status ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : "Appliquer le changement"}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Order Detail Modal
// ─────────────────────────────────────────────────────────────────────────────
function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const displayId = order.orderNumber ?? `#${order._id.slice(-6).toUpperCase()}`;
  const cfg = STATUS_CONFIG[order.status];

  return (
    <Backdrop onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 520,
          boxShadow: "0 24px 60px rgba(2,52,171,0.18)",
          animation: "modalIn 0.22s cubic-bezier(.34,1.56,.64,1) both",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{
              fontSize: "0.68rem", fontWeight: 600, color: "#8B9AB5",
              letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4,
            }}>
              Détail commande
            </div>
            <div style={{
              fontSize: "1.1rem", fontWeight: 700, color: "#0234AB",
              fontFamily: "'Space Mono', monospace",
            }}>
              {displayId}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={`badge ${cfg.badgeClass}`}>
              <span className="order-status-dot" style={{ background: cfg.dot }} />
              {cfg.label}
            </span>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 8,
                border: "1px solid #E2E8F0", background: "transparent",
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", color: "#8B9AB5",
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{
          padding: "20px 24px",
          display: "flex", flexDirection: "column", gap: 14,
          maxHeight: "70vh", overflowY: "auto",
        }}>

          {/* Client + Date */}
          <div className="dash-inline-2col">
            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12 }}>
              <div style={{
                fontSize: "0.68rem", color: "#8B9AB5", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6,
              }}>
                Client
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0A0F2C" }}>
                {order.user?.name ?? "—"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#8B9AB5", marginTop: 2 }}>
                {order.user?.email ?? ""}
              </div>
            </div>
            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12 }}>
              <div style={{
                fontSize: "0.68rem", color: "#8B9AB5", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6,
              }}>
                Date
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0A0F2C" }}>
                {fmtDate(order.createdAt)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#8B9AB5", marginTop: 2 }}>
                {order.paymentMethod === "cash_on_delivery"
                  ? "Paiement à la livraison"
                  : order.paymentMethod === "card"
                  ? "Carte bancaire"
                  : "—"}
              </div>
            </div>
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12 }}>
              <div style={{
                fontSize: "0.68rem", color: "#8B9AB5", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8,
              }}>
                Adresse de livraison
              </div>
              <div style={{ fontSize: "0.82rem", color: "#0A0F2C", lineHeight: 1.7 }}>
                <strong>{order.shippingAddress.fullName}</strong>
                &nbsp;·&nbsp;
                {order.shippingAddress.phone}
                <br />
                {order.shippingAddress.address}, {order.shippingAddress.city}
                {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ""}
              </div>
              {order.shippingAddress.notes && (
                <div style={{
                  fontSize: "0.75rem", color: "#8B9AB5",
                  marginTop: 6, fontStyle: "italic",
                }}>
                  {order.shippingAddress.notes}
                </div>
              )}
            </div>
          )}

          {/* Items */}
          <div>
            <div style={{
              fontSize: "0.68rem", color: "#8B9AB5", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8,
            }}>
              Articles ({order.items.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {order.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "10px 12px",
                    background: "#F8FAFC", borderRadius: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0A0F2C" }}>
                      {item.product?.title ?? "Produit supprimé"}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#8B9AB5", marginTop: 2 }}>
                      Qté : {item.quantity} &nbsp;·&nbsp; {item.price.toLocaleString("fr-FR")} TND / unité
                    </div>
                  </div>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "0.82rem", fontWeight: 700, color: "#0A0F2C",
                  }}>
                    {(item.price * item.quantity).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} TND
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 14px", border: "1.5px solid #E2E8F0", borderRadius: 10,
          }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#8B9AB5" }}>Total</span>
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "1rem", fontWeight: 700, color: "#0234AB",
            }}>
              {(order.total ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} TND
            </span>
          </div>
        </div>
      </div>
    </Backdrop>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<Tab>("Toutes");
  const [search, setSearch]           = useState("");
  const [updatingId, setUpdatingId]   = useState<string | null>(null);

  const [errorMsg,      setErrorMsg]      = useState<string | null>(null);
  const [cancelTarget,  setCancelTarget]  = useState<Order | null>(null);
  const [statusTarget,  setStatusTarget]  = useState<Order | null>(null);
  const [detailTarget,  setDetailTarget]  = useState<Order | null>(null);

  const getHeaders = useCallback(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${apiToken}` }),
    [apiToken]
  );

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/api/orders/artisan`, { headers: getHeaders() });
      if (res.status === 401) throw new Error("Non autorisé — session expirée ?");
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : data.orders ?? data.data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => { if (apiToken) fetchOrders(); }, [apiToken, fetchOrders]);

  async function handleStatusUpdate(newStatus: Status) {
    if (!statusTarget) return;
    const target = statusTarget;
    try {
      setUpdatingId(target._id);
      const res = await fetch(`${API}/api/orders/${target._id}/status`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const updated: Order = await res.json();
      setOrders((prev) => prev.map((o) => (o._id === target._id ? updated : o)));
      setStatusTarget(null);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    const target = cancelTarget;
    setCancelTarget(null);
    try {
      setUpdatingId(target._id);
      const res = await fetch(`${API}/api/orders/${target._id}/cancel`, {
        method: "PATCH",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const updated: Order = await res.json();
      setOrders((prev) => prev.map((o) => (o._id === target._id ? updated : o)));
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  const isSessionLoading =
    sessionStatus === "loading" || (!apiToken && sessionStatus === "authenticated");

  const counts = {
    Toutes:       orders.length,
    "En attente": orders.filter((o) => o.status === "pending").length,
    "En cours":   orders.filter((o) => o.status === "shipped").length,
    Livrées:      orders.filter((o) => o.status === "delivered").length,
    Annulées:     orders.filter((o) => o.status === "cancelled").length,
  } as Record<Tab, number>;

  const miniStats = [
    { label: "Total commandes", val: orders.length,       color: "#0234AB" },
    { label: "En cours",        val: counts["En cours"],  color: "#F59E0B" },
    { label: "Livrées",         val: counts["Livrées"],   color: "#0B9E5E" },
    { label: "Annulées",        val: counts["Annulées"],  color: "#E53E3E" },
  ];

  const visibleOrders = orders.filter((o) => {
    const matchTab = TAB_STATUS_MAP[activeTab] === null || o.status === TAB_STATUS_MAP[activeTab];
    const matchSearch =
      search === "" ||
      orderProductLabel(o).toLowerCase().includes(search.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o._id.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        .animate-spin     { animation: spin 1s linear infinite; }
        @keyframes modalIn { from { opacity:0; transform:scale(0.92) translateY(12px); } to { opacity:1; transform:none; } }
      `}</style>

      {/* Modals */}
      {errorMsg && <ErrorModal message={errorMsg} onClose={() => setErrorMsg(null)} />}

      {cancelTarget && (
        <CancelModal
          order={cancelTarget}
          loading={updatingId === cancelTarget._id}
          onClose={() => setCancelTarget(null)}
          onConfirm={confirmCancel}
        />
      )}

      {statusTarget && (
        <StatusSelectionModal
          order={statusTarget}
          loading={updatingId === statusTarget._id}
          onClose={() => setStatusTarget(null)}
          onConfirm={handleStatusUpdate}
        />
      )}

      {detailTarget && (
        <OrderDetailModal
          order={detailTarget}
          onClose={() => setDetailTarget(null)}
        />
      )}

      {/* Header */}
      <div className="page-header anim-fade-up">
        <div>
          <h1 className="page-title">Commandes</h1>
          <p className="page-subtitle">Suivez et gérez toutes vos commandes</p>
        </div>
        <div className="header-actions-row">
          <div className="search-bar">
            <span className="search-bar-icon">⌕</span>
            <input
              className="search-bar-input"
              placeholder="Rechercher une commande..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8B9AB5", padding: "0 8px" }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button className="btn btn-secondary">⬇ Exporter</button>
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

      {/* Loading */}
      {(isSessionLoading || loading) && (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Loader2 size={32} className="animate-spin" style={{ opacity: 0.4 }} />
        </div>
      )}

      {/* Error */}
      {!isSessionLoading && !loading && error && (
        <div className="card" style={{ padding: "2rem", textAlign: "center", color: "#e53e3e" }}>
          <p>{error}</p>
          <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={fetchOrders}>
            Réessayer
          </button>
        </div>
      )}

      {/* Empty */}
      {!isSessionLoading && !loading && !error && visibleOrders.length === 0 && (
        <div className="card" style={{ padding: "4rem", textAlign: "center" }}>
          <p style={{ color: "#8B9AB5" }}>
            {search ? `Aucun résultat pour "${search}"` : "Aucune commande trouvée."}
          </p>
        </div>
      )}

      {/* Table */}
      {!isSessionLoading && !loading && !error && visibleOrders.length > 0 && (
        <div className="card anim-fade-up anim-d2">
          <div className="card-header">
            <h2 className="card-title">Liste des commandes</h2>
            <span style={{ fontSize: "0.8rem", color: "#8B9AB5" }}>{visibleOrders.length} commandes</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>N° Commande</th>
                  <th>Produit</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Modifier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((o, i) => {
                  const cfg       = STATUS_CONFIG[o.status];
                  const isBusy    = updatingId === o._id;
                  const displayId = o.orderNumber ?? (o._id ? `#${o._id.slice(-6).toUpperCase()}` : "#------");

                  return (
                    <tr
                      key={o._id}
                      style={{ animationDelay: `${i * 0.06}s`, opacity: isBusy ? 0.6 : 1 }}
                    >
                      <td>
                        <span style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "0.78rem", fontWeight: 700, color: "#0234AB",
                        }}>
                          {displayId}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{orderProductLabel(o)}</td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{o.user?.name ?? "—"}</div>
                        <div style={{ fontSize: "0.72rem", color: "#8B9AB5", marginTop: 2 }}>{o.user?.email ?? ""}</div>
                      </td>
                      <td style={{ color: "#8B9AB5", fontSize: "0.82rem" }}>{fmtDate(o.createdAt)}</td>
                      <td>
                        <span style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: "0.82rem", fontWeight: 700,
                        }}>
                          {(o.total ?? 0).toLocaleString("fr-FR")} TND
                        </span>
                      </td>
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
                            border: "1px solid #E2E8F0", background: "#fff",
                            cursor: "pointer", fontSize: "0.8rem",
                            fontWeight: 600, color: "#4A5568", transition: "all 0.2s",
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.borderColor = "#0234AB")}
                          onMouseOut={(e)  => (e.currentTarget.style.borderColor = "#E2E8F0")}
                        >
                          {isBusy ? <Loader2 size={14} className="animate-spin" /> : "⇄"}
                          Statut
                        </button>
                      </td>
                      <td>
                        <div className="order-actions-cell">
                          <button
                            className="icon-btn"
                            title="Voir"
                            onClick={() => setDetailTarget(o)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="icon-btn icon-btn-danger"
                            title="Annuler"
                            disabled={o.status === "cancelled" || o.status === "delivered" || isBusy}
                            onClick={() => setCancelTarget(o)}
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