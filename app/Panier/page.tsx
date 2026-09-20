"use client";

import { useCart } from "../context/CartContext";
import { useApiToken } from "@/lib/useApiToken";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2,
  Package, ClipboardList, Clock, CheckCircle2, XCircle,
  Truck, RefreshCw, MapPin, CreditCard, Tag,
} from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { showErrorToast } from "@/lib/toast";

// ─── Types ───────────────────────────────────────────────────────────────────
type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

interface OrderItem {
  product: { _id: string; title: string; images?: string[]; price: number };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  shippingAddress?: { fullName: string; address: string; phone: string };
  paymentMethod?: string;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: React.ReactNode; step: number }> = {
  pending:    { label: "En attente", icon: <Clock size={14} />,        step: 1 },
  processing: { label: "En cours",   icon: <RefreshCw size={14} />,    step: 2 },
  shipped:    { label: "Expédié",    icon: <Truck size={14} />,        step: 3 },
  delivered:  { label: "Livré",      icon: <CheckCircle2 size={14} />, step: 4 },
  cancelled:  { label: "Annulé",     icon: <XCircle size={14} />,      step: 0 },
};

// ─── Orders styles (self-contained: no globals.css needed) ────────────────────
const ORDERS_CSS = `
/* ── Mes Commandes (all classes prefixed "mo-") ── paste into your global CSS ── */
.mo-label {
  font-family: "JetBrains Mono","IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6f7f9c;
  line-height: 1.3;
}

.mo-list { display: flex; flex-direction: column; gap: 2.5rem; margin-top: 1.5rem; }

.mo-detail {
  display: grid;
  grid-template-columns: minmax(0, 1.42fr) minmax(0, 1fr);
  gap: 2rem;
  align-items: stretch;
}

/* left: image card */
.mo-gallery {
  background: #fff;
  border: 1px solid var(--border-soft, #efe9dc);
  border-radius: 20px;
  padding: 1rem;
  box-shadow: var(--shadow-card, 0 2px 12px rgba(0,0,0,0.05));
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.mo-gallery__main {
  width: 100%;
  flex: 1;
  min-height: 320px;
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  background: #f4efe6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a89f8d;
}
.mo-gallery__main img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.mo-gallery__thumbs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.mo-thumb {
  width: 64px; height: 64px;
  border-radius: 10px;
  overflow: hidden;
  background: #f4efe6;
  border: 1px solid var(--border-soft, #efe9dc);
  display: flex; align-items: center; justify-content: center;
  color: #a89f8d;
  font-size: 0.72rem; font-weight: 700;
  flex-shrink: 0;
}
.mo-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

/* right column */
.mo-side { display: flex; flex-direction: column; gap: 1.1rem; min-width: 0; }

.mo-card {
  background: #fff;
  border: 1px solid var(--border-soft, #efe9dc);
  border-radius: 20px;
  padding: 1.9rem 1.9rem 1.7rem;
  box-shadow: var(--shadow-card, 0 2px 12px rgba(0,0,0,0.05));
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
.mo-card__top { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.mo-card__meta { display: flex; flex-direction: column; gap: 0.3rem; min-width: 0; }
.mo-card__id {
  font-size: 1.35rem; font-weight: 800; letter-spacing: 0.01em;
  color: var(--gold, #c9a055); line-height: 1.1;
  background: none; border: none; padding: 0;
}
.mo-card__date { font-size: 0.85rem; color: #6f7f9c; }
.mo-card__amount { display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem; }
.mo-card__total {
  font-size: 1.5rem; font-weight: 800; letter-spacing: -0.01em;
  color: var(--ink, #171510); white-space: nowrap; line-height: 1.1;
}

/* cancelled badge */
.mo-badge {
  display: inline-flex; align-items: center; align-self: flex-start; gap: 0.4rem;
  padding: 0.3rem 0.8rem; border-radius: 100px;
  font-size: 0.72rem; font-weight: 700;
  background: #fdecea; color: #b3261e; border: 1px solid #f5c6c2;
}

/* progress */
.mo-progress { display: flex; align-items: flex-start; padding: 0 0.2rem; }
.mo-progress__step { display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; }
.mo-progress__dot {
  width: 12px; height: 12px; border-radius: 50%;
  background: #fff; border: 1px solid #d9d2c3; z-index: 1;
  transition: background .3s, box-shadow .3s, border-color .3s;
}
.mo-progress__step.done .mo-progress__dot { background: var(--gold, #c9a055); border-color: var(--gold, #c9a055); }
.mo-progress__step.active .mo-progress__dot {
  background: var(--gold, #c9a055); border-color: var(--gold, #c9a055);
  box-shadow: 0 0 0 3px #fff, 0 0 0 4px rgba(201,160,85,0.55);
}
.mo-progress__label {
  font-size: 0.6rem; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase;
  color: #6f7f9c; margin-top: 0.7rem; text-align: center; white-space: nowrap;
}
.mo-progress__step.done .mo-progress__label,
.mo-progress__step.active .mo-progress__label { color: var(--gold, #c9a055); }
.mo-progress__icon {
  display: flex; align-items: center; justify-content: center;
  margin-top: 0.55rem; color: #6f7f9c; transition: color .3s;
}
.mo-progress__step.done .mo-progress__icon,
.mo-progress__step.active .mo-progress__icon { color: var(--gold, #c9a055); }
.mo-progress__line {
  position: absolute; top: 5.5px; left: 50%; width: 100%; height: 1px;
  background: #ece6d8; z-index: 0; transition: background .3s;
}
.mo-progress__line.done { background: var(--gold, #c9a055); }

/* info cards */
.mo-info {
  display: flex; align-items: center; gap: 1.1rem;
  background: #fff;
  border: 1px solid var(--border-soft, #efe9dc);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: var(--shadow-card, 0 2px 12px rgba(0,0,0,0.05));
}
.mo-info__icon {
  width: 40px; height: 40px; border-radius: 50%;
  background: #fbf6ec; color: var(--gold, #c9a055);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.mo-info__body { display: flex; flex-direction: column; gap: 0.3rem; min-width: 0; }
.mo-info__text { font-size: 0.88rem; font-weight: 500; color: var(--ink, #171510); line-height: 1.5; overflow-wrap: anywhere; }

/* help button */
.mo-help {
  display: flex; align-items: center; justify-content: center;
  width: 100%; min-height: 64px; padding: 0 1.5rem;
  border-radius: 18px; background: #171510; color: #fff;
  font-size: 0.95rem; font-weight: 700; text-align: center; text-decoration: none;
  transition: transform .2s, box-shadow .2s;
}
.mo-help:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(23,21,16,0.22); }

@media (max-width: 900px) {
  .mo-detail { grid-template-columns: 1fr; gap: 1.1rem; }
  .mo-gallery__main { flex: none; min-height: 0; aspect-ratio: 1 / 1; }
  .mo-card { padding: 1.4rem; }
}
`;

// ─── Tab pill (inline styles: no dependency on globals.css) ───────────────────
const TAB_PILL_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "var(--surface, #fff)",
  borderRadius: 100,
  boxShadow: "var(--shadow-card, 0 2px 12px rgba(0,0,0,0.08))",
  zIndex: -1,
};
const TAB_PILL_SPRING = { type: "spring" as const, stiffness: 420, damping: 36 };

// ─── Progress Stepper ─────────────────────────────────────────────────────────
const PROGRESS_STEPS = [
  { label: "En attente", icon: <Clock size={18} /> },
  { label: "En cours",   icon: <RefreshCw size={18} /> },
  { label: "Expédié",    icon: <Truck size={18} /> },
  { label: "Livré",      icon: <CheckCircle2 size={18} /> },
];

function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "cancelled") return null;
  const current = (STATUS_CONFIG[status]?.step ?? 1) - 1;

  return (
    <div className="mo-progress">
      {PROGRESS_STEPS.map(({ label, icon }, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} className={`mo-progress__step ${done ? "done" : active ? "active" : ""}`}>
            {i < PROGRESS_STEPS.length - 1 && (
              <div className={`mo-progress__line ${done ? "done" : ""}`} />
            )}
            <div className="mo-progress__dot" />
            <span className="mo-progress__label">{label}</span>
            <span className="mo-progress__icon">{icon}</span>
          </div>
        );
      })}
    </div>
  );
}

function InfoCard({
  icon, label, children,
}: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="mo-info">
      <div className="mo-info__icon">{icon}</div>
      <div className="mo-info__body">
        <span className="mo-label">{label}</span>
        {children}
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, idx }: { order: Order; idx: number }) {
  const date = new Date(order.createdAt).toLocaleDateString("fr-TN", {
    day: "numeric", month: "long", year: "numeric",
  });
  const qty     = order.items.reduce((s, i) => s + i.quantity, 0);
  const mainImg = order.items[0]?.product?.images?.[0];

  return (
    <motion.div
      className="mo-detail"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Left: image */}
      <div className="mo-gallery">
        <div className="mo-gallery__main">
          {mainImg
            ? <img src={mainImg} alt={order.items[0]?.product?.title ?? ""} />
            : <Package size={48} strokeWidth={1.2} />}
        </div>

        {order.items.length > 1 && (
          <div className="mo-gallery__thumbs">
            {order.items.slice(1, 6).map((item, i) => (
              <div key={i} className="mo-thumb" title={item.product?.title}>
                {item.product?.images?.[0]
                  ? <img src={item.product.images[0]} alt="" />
                  : <Package size={16} />}
              </div>
            ))}
            {order.items.length > 6 && (
              <div className="mo-thumb">+{order.items.length - 6}</div>
            )}
          </div>
        )}
      </div>

      {/* Right: info */}
      <div className="mo-side">
        <div className="mo-card">
          <div className="mo-card__top">
            <div className="mo-card__meta">
              <span className="mo-label">Référence commande</span>
              <span className="mo-card__id">#{order._id.slice(-8).toUpperCase()}</span>
              <span className="mo-card__date">{date}</span>
            </div>
            <div className="mo-card__amount">
              <span className="mo-card__total">{order.total.toLocaleString("fr-TN")} TND</span>
              <span className="mo-label">Qté : {String(qty).padStart(2, "0")}</span>
            </div>
          </div>

          {order.status === "cancelled" ? (
            <span className="mo-badge">
              {STATUS_CONFIG.cancelled.icon}
              {STATUS_CONFIG.cancelled.label}
            </span>
          ) : (
            <OrderProgress status={order.status} />
          )}
        </div>

        {order.shippingAddress && (
          <InfoCard icon={<MapPin size={16} />} label="Adresse de livraison">
            <span className="mo-info__text">{order.shippingAddress.address}</span>
            <span className="mo-info__text">{order.shippingAddress.phone}</span>
          </InfoCard>
        )}

        {order.paymentMethod && (
          <InfoCard icon={<CreditCard size={16} />} label="Méthode de paiement">
            <span className="mo-info__text">
              {order.paymentMethod === "cash_on_delivery" ? "Paiement à la livraison" : order.paymentMethod}
            </span>
          </InfoCard>
        )}

        {/* <Link href="/contact" className="mo-help">
          Besoin d’aide avec cette commande ?
        </Link> */}
      </div>
    </motion.div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab({ token }: { token: string }) {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("");

  const load = useCallback(async () => {
    if (!token) {
      showErrorToast("Session expirée. Veuillez vous reconnecter.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const query = filter ? `?status=${filter}` : "";
      const res   = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/mine${query}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (err: any) {
      showErrorToast("Impossible de charger vos commandes.");
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, token]);

  useEffect(() => { load(); }, [load]);

  const filters = [
    { value: "",           label: "Toutes" },
    { value: "pending",    label: "En attente" },
    { value: "processing", label: "En cours" },
    { value: "shipped",    label: "Expédiées" },
    { value: "delivered",  label: "Livrées" },
    { value: "cancelled",  label: "Annulées" },
  ];

  return (
    <div className="orders-tab">
      <style dangerouslySetInnerHTML={{ __html: ORDERS_CSS }} />


      <div className="orders-filters">
        {filters.map(f => (
          <button
            key={f.value}
            className={`orders-filter-pill ${filter === f.value ? "active" : ""}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="orders-loading">
          <Loader2 size={28} className="spin" />
        </div>

      ) : orders.length === 0 ? (
        <motion.div className="orders-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ClipboardList size={48} strokeWidth={1.1} />
          <p>{filter ? "Aucune commande dans cette catégorie" : "Vous n'avez pas encore commandé"}</p>
          {!filter && (
            <Link href="/boutique" className="cart-checkout-btn" style={{ width: "auto", padding: "0.85rem 2rem" }}>
              Explorer la boutique <ArrowRight size={14} />
            </Link>
          )}
        </motion.div>

      ) : (
        <div className="mo-list">
          {orders.map((order, i) => (
            <OrderCard key={order._id} order={order} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PanierPage() {
  const { cart, loading, updateItem, removeItem } = useCart();
  const { apiToken, session } = useApiToken();
  const router                                    = useRouter();
  const [removing, setRemoving]                   = useState<string | null>(null);
  const [updating, setUpdating]                   = useState<string | null>(null);
  const [tab, setTab]                             = useState<"cart" | "orders">("cart");
  const SHIPPING = 7;

  const token = apiToken ?? "";

  async function handleRemove(productId: string) {
    setRemoving(productId);
    await removeItem(productId);
    setRemoving(null);
  }

  async function handleQty(productId: string, qty: number) {
    if (qty < 1) return;
    setUpdating(productId);
    await updateItem(productId, qty);
    setUpdating(null);
  }

  const validItems = cart.items.filter(item => item.product != null);
  const isEmpty    = validItems.length === 0;
  const subtotal   = validItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount  = validItems.reduce((s, i) => s + i.quantity, 0);

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!session) return (
    <div className="cart-empty">
      <div className="cart-empty__icon"><ShoppingBag size={52} strokeWidth={1.2} /></div>
      <h2 className="cart-empty__title">Connectez-vous pour voir votre panier</h2>
      <p className="cart-empty__sub">Accédez à votre compte pour retrouver vos articles</p>
      <Link href="/connexion" className="cart-checkout-btn" style={{ width: "auto", padding: "0.85rem 2rem" }}>
        Se connecter <ArrowRight size={15} />
      </Link>
    </div>
  );

  return (
    <div className="cart-root">

      {/* ── Header ── */}
      <motion.div
        className="cart-header"
        initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <h1 className="cart-header__title">Mon Espace</h1>
          <p className="cart-header__count">Gérez vos achats et commandes</p>
        </div>
        <Link href="/boutique" className="cart-continue-link">← Continuer les achats</Link>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="page-tabs">
        <button
          className={`page-tab ${tab === "cart" ? "active" : ""}`}
          onClick={() => setTab("cart")}
        >
          {tab === "cart" && (
            <motion.span layoutId="tab-pill" style={TAB_PILL_STYLE} transition={TAB_PILL_SPRING} />
          )}
          <ShoppingBag size={15} />
          Panier
          {cartCount > 0 && <span className="tab-count">{cartCount}</span>}
        </button>
        <button
          className={`page-tab ${tab === "orders" ? "active" : ""}`}
          onClick={() => setTab("orders")}
        >
          {tab === "orders" && (
            <motion.span layoutId="tab-pill" style={TAB_PILL_STYLE} transition={TAB_PILL_SPRING} />
          )}
          <ClipboardList size={15} />
          Mes Commandes
        </button>
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">

        {tab === "cart" ? (
          <motion.div key="cart"
            initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Loading */}
            {loading ? (
              <div className="cart-empty">
                <Loader2 size={32} className="spin" />
              </div>

            /* Empty */
            ) : isEmpty ? (
              <motion.div className="cart-empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <div className="cart-empty__icon"><ShoppingBag size={52} strokeWidth={1.1} /></div>
                <h2 className="cart-empty__title">Votre panier est vide</h2>
                <p className="cart-empty__sub">Découvrez nos créations artisanales uniques</p>
              </motion.div>

            /* Items */
            ) : (
              <div className="cart-layout">
                <div className="cart-items">
                  <AnimatePresence>
                    {validItems.map((item, idx) => {
                      const p          = item.product;
                      const isRemoving = removing === p._id;
                      const isUpdating = updating === p._id;

                      return (
                        <motion.div key={p._id} className="cart-item" layout
                          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 40, height: 0, margin: 0, padding: 0 }}
                          transition={{ duration: 0.38, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <Link href={`/boutique/${p._id}`} className="cart-item__img-wrap">
                            {p.images?.[0]
                              ? <img src={p.images[0]} alt={p.title} className="cart-item__img" />
                              : <div className="cart-item__img-placeholder"><Package size={22} /></div>}
                          </Link>

                          <div className="cart-item__info">
                            <Link href={`/boutique/${p._id}`} className="cart-item__name">{p.title}</Link>
                            {(p as any).artisan && (
                              <span className="cart-item__artisan">
                                par {typeof (p as any).artisan === "object" ? (p as any).artisan.name : (p as any).artisan}
                                {typeof (p as any).artisan === "object" && (p as any).artisan.city
                                  ? ` · ${(p as any).artisan.city}` : ""}
                              </span>
                            )}
                            <span className="cart-item__unit-price">
                              <Tag size={11} />
                              {p.price.toLocaleString("fr-TN")} TND / pièce
                            </span>
                          </div>

                          <div className="cart-item__qty">
                            <motion.button
                              className="cart-qty-btn"
                              onClick={() => handleQty(p._id, item.quantity - 1)}
                              disabled={isUpdating || item.quantity <= 1}
                              whileTap={{ scale: 0.85 }}
                            >
                              <Minus size={12} />
                            </motion.button>
                            <span className="cart-qty-val">
                              {isUpdating
                                ? <Loader2 size={12} className="spin" />
                                : item.quantity}
                            </span>
                            <motion.button
                              className="cart-qty-btn"
                              onClick={() => handleQty(p._id, item.quantity + 1)}
                              disabled={isUpdating || item.quantity >= (p as any).stock}
                              whileTap={{ scale: 0.85 }}
                            >
                              <Plus size={12} />
                            </motion.button>
                          </div>

                          <div className="cart-item__subtotal">
                            {(p.price * item.quantity).toLocaleString("fr-TN")} TND
                          </div>

                          <motion.button
                            className="cart-item__remove"
                            onClick={() => handleRemove(p._id)}
                            disabled={isRemoving}
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}
                            title="Retirer l'article"
                          >
                            {isRemoving
                              ? <Loader2 size={14} className="spin" />
                              : <Trash2 size={14} />}
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Summary */}
                <motion.aside className="cart-summary"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h2 className="cart-summary__title">Récapitulatif</h2>

                  <div className="cart-summary__rows">
                    <div className="cart-summary__row">
                      <span>Sous-total ({cartCount} article{cartCount > 1 ? "s" : ""})</span>
                      <span>{subtotal.toLocaleString("fr-TN")} TND</span>
                    </div>
                    <div className="cart-summary__row">
                      <span>Livraison</span>
                      <span className="cart-summary__free">{SHIPPING} TND</span>
                    </div>
                    <div className="cart-summary__divider" />
                    <div className="cart-summary__row cart-summary__row--total">
                      <span>Total</span>
                      <span>{(subtotal + SHIPPING).toLocaleString("fr-TN")} TND</span>
                    </div>
                  </div>

                  <div className="cart-summary__badges">
                    {[
                      { icon: <Truck size={13} />, label: "Livraison 3–5 jours" },
                    ].map(b => (
                      <span key={b.label} className="cart-summary__badge">
                        {b.icon} {b.label}
                      </span>
                    ))}
                  </div>

                  <motion.button
                    className="cart-checkout-btn"
                    onClick={() => router.push("/Commande")}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  >
                    Passer la commande
                    <ArrowRight size={15} />
                  </motion.button>

                  <p className="cart-summary__tva">TVA incluse · Toutes taxes comprises</p>
                </motion.aside>
              </div>
            )}
          </motion.div>

        ) : (
          <motion.div key="orders"
            initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <OrdersTab token={token} />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}