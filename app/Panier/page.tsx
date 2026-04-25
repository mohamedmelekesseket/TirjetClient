"use client";

import { useCart } from "../context/CartContext";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2,
  Package, ClipboardList, Clock, CheckCircle2, XCircle,
  Truck, RefreshCw, ChevronDown, MapPin, CreditCard, ShieldCheck,
  RotateCcw, Tag,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

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
  pending:    { label: "En attente", icon: <Clock size={12} />,        step: 1 },
  processing: { label: "En cours",   icon: <RefreshCw size={12} />,    step: 2 },
  shipped:    { label: "Expédié",    icon: <Truck size={12} />,        step: 3 },
  delivered:  { label: "Livré",      icon: <CheckCircle2 size={12} />, step: 4 },
  cancelled:  { label: "Annulé",     icon: <XCircle size={12} />,      step: 0 },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`order-badge order-badge--${status}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Progress Stepper ─────────────────────────────────────────────────────────
function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "cancelled") return null;
  const step = STATUS_CONFIG[status]?.step ?? 0;
  const steps = [
    { label: "En attente", icon: <Clock size={13} /> },
    { label: "En cours",   icon: <RefreshCw size={13} /> },
    { label: "Expédié",    icon: <Truck size={13} /> },
    { label: "Livré",      icon: <CheckCircle2 size={13} /> },
  ];

  return (
    <div className="order-progress">
      {steps.map((s, i) => {
        const done   = i < step;
        const active = i === step - 1;
        return (
          <div key={s.label} className={`order-progress__step ${done ? "done" : active ? "active" : ""}`}>
            {i < steps.length - 1 && (
              <div className={`order-progress__line ${done ? "done" : ""}`} />
            )}
            <div className="order-progress__dot">
              {done ? <CheckCircle2 size={13} /> : s.icon}
            </div>
            <span className="order-progress__label">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, idx }: { order: Order; idx: number }) {
  const [open, setOpen] = useState(false);
  const date = new Date(order.createdAt).toLocaleDateString("fr-TN", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <motion.div
      className={`order-card ${open ? "order-card--open" : ""}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <button className="order-card__header" onClick={() => setOpen(o => !o)}>
        <div className="order-card__meta">
          <span className="order-card__id">#{order._id.slice(-8).toUpperCase()}</span>
          <span className="order-card__date">{date}</span>
        </div>

        <div className="order-card__thumbs">
          {order.items.slice(0, 4).map((item, i) => (
            <div key={i} className="order-thumb">
              {item.product?.images?.[0]
                ? <img src={item.product.images[0]} alt="" />
                : <Package size={14} />}
            </div>
          ))}
          {order.items.length > 4 && (
            <div className="order-thumb order-thumb--more">+{order.items.length - 4}</div>
          )}
        </div>

        <div className="order-card__right">
          <StatusBadge status={order.status} />
          <span className="order-card__total">{order.total.toLocaleString("fr-TN")} TND</span>
          <ChevronDown
            size={16}
            className={`order-card__chevron ${open ? "order-card__chevron--open" : ""}`}
          />
        </div>
      </button>

      {/* Expandable */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="order-card__details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <OrderProgress status={order.status} />

            <div className="order-items-list">
              {order.items.map((item, i) => (
                <div key={i} className="order-item-row">
                  <div className="order-item-row__img">
                    {item.product?.images?.[0]
                      ? <img src={item.product.images[0]} alt={item.product?.title} />
                      : <Package size={14} />}
                  </div>
                  <div className="order-item-row__info">
                    <span className="order-item-row__name">{item.product?.title ?? "Produit supprimé"}</span>
                    <span className="order-item-row__qty">× {item.quantity}</span>
                  </div>
                  <span className="order-item-row__price">
                    {(item.price * item.quantity).toLocaleString("fr-TN")} TND
                  </span>
                </div>
              ))}
            </div>

            {order.shippingAddress && (
              <div className="order-address">
                <MapPin size={13} />
                <span>
                  {order.shippingAddress.fullName} · {order.shippingAddress.address} · {order.shippingAddress.phone}
                </span>
              </div>
            )}

            {order.paymentMethod && (
              <div className="order-address">
                <CreditCard size={13} />
                <span className="order-address__payment">
                  {order.paymentMethod === "cash_on_delivery" ? "Paiement à la livraison" : order.paymentMethod}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab({ token }: { token: string }) {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [filter, setFilter]   = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setError("Session expirée. Veuillez vous reconnecter.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
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
      setError("Impossible de charger vos commandes.");
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

      ) : error ? (
        <div className="orders-error">
          <XCircle size={36} strokeWidth={1.2} />
          <p>{error}</p>
          <button className="orders-retry-btn" onClick={load}>
            <RotateCcw size={13} /> Réessayer
          </button>
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
        <div className="orders-list">
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
  const { data: session }                         = useSession();
  const router                                    = useRouter();
  const [removing, setRemoving]                   = useState<string | null>(null);
  const [updating, setUpdating]                   = useState<string | null>(null);
  const [tab, setTab]                             = useState<"cart" | "orders">("cart");
  const SHIPPING = 7;

  // ⚠️ Requires NextAuth session callback to expose accessToken:
  // callbacks: { session({ session, token }) { session.accessToken = token.accessToken; return session; } }
  const token = (session as any)?.apiToken ?? "";

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
          <ShoppingBag size={15} />
          Panier
          {cartCount > 0 && <span className="tab-count">{cartCount}</span>}
        </button>
        <button
          className={`page-tab ${tab === "orders" ? "active" : ""}`}
          onClick={() => setTab("orders")}
        >
          <ClipboardList size={15} />
          Mes Commandes
        </button>
        <div
          className="tabs-ink"
          style={{ transform: tab === "cart" ? "translateX(0)" : "translateX(100%)" }}
        />
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
                <Link href="/boutique" className="cart-checkout-btn" style={{ width: "auto", padding: "0.85rem 2rem" }}>
                  Explorer la boutique →
                </Link>
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
                      { icon: <ShieldCheck size={13} />, label: "Paiement sécurisé" },
                      { icon: <Truck size={13} />,        label: "Livraison 3–5 jours" },
                      { icon: <RotateCcw size={13} />,    label: "Retour sous 14 jours" },
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