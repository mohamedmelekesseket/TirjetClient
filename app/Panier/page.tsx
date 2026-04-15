"use client";

import { useCart } from "../context/CartContext";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PanierPage() {
  const { cart, loading, updateItem, removeItem } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

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

  const isEmpty = cart.items.length === 0;

  if (!session) return (
    <div className="cart-empty">
      <ShoppingBag size={52} strokeWidth={1.2} />
      <h2>Connectez-vous pour voir votre panier</h2>
      <Link href="/connexion" className="cart-checkout-btn">Se connecter →</Link>
    </div>
  );

  if (loading) return (
    <div className="cart-empty">
      <Loader2 size={36} style={{ animation: "spin 1s linear infinite", opacity: 0.4 }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (isEmpty) return (
    <div className="cart-empty">
      <div className="cart-empty__icon"><ShoppingBag size={48} strokeWidth={1.2} /></div>
      <h2 className="cart-empty__title">Votre panier est vide</h2>
      <p className="cart-empty__sub">Découvrez nos créations artisanales uniques</p>
      <Link href="/boutique" className="cart-checkout-btn">
        Explorer la boutique →
      </Link>
    </div>
  );

  return (
    <div className="cart-root">
      {/* Header */}
      <motion.div className="cart-header"
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <div>
          <h1 className="cart-header__title">Mon Panier</h1>
          <p className="cart-header__count">{cart.items.reduce((s, i) => s + i.quantity, 0)} article(s)</p>
        </div>
        <Link href="/boutique" className="cart-continue-link">
          ← Continuer les achats
        </Link>
      </motion.div>

      <div className="cart-layout">
        {/* Items list */}
        <div className="cart-items">
          <AnimatePresence>
            {cart.items.map((item, idx) => {
              const p = item.product;
              const isRemoving = removing === p._id;
              const isUpdating = updating === p._id;

              return (
                <motion.div key={p._id} className="cart-item"
                  layout
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}>

                  {/* Image */}
                  <Link href={`/boutique/${p._id}`} className="cart-item__img-wrap">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.title} className="cart-item__img" />
                      : <div className="cart-item__img-placeholder"><Package size={24} /></div>
                    }
                  </Link>

                  {/* Info */}
                  <div className="cart-item__info">
                    <Link href={`/boutique/${p._id}`} className="cart-item__name">{p.title}</Link>
                    {p.artisan && (
                      <span className="cart-item__artisan">par {p.artisan.name}{p.artisan.city ? ` · ${p.artisan.city}` : ""}</span>
                    )}
                    <span className="cart-item__unit-price">{p.price.toLocaleString("fr-TN")} TND / pièce</span>
                  </div>

                  {/* Qty controls */}
                  <div className="cart-item__qty">
                    <motion.button className="cart-qty-btn"
                      onClick={() => handleQty(p._id, item.quantity - 1)}
                      disabled={isUpdating || item.quantity <= 1}
                      whileTap={{ scale: 0.88 }}>
                      <Minus size={13} />
                    </motion.button>
                    <span className="cart-qty-val">
                      {isUpdating ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : item.quantity}
                    </span>
                    <motion.button className="cart-qty-btn"
                      onClick={() => handleQty(p._id, item.quantity + 1)}
                      disabled={isUpdating || item.quantity >= p.stock}
                      whileTap={{ scale: 0.88 }}>
                      <Plus size={13} />
                    </motion.button>
                  </div>

                  {/* Subtotal */}
                  <div className="cart-item__subtotal">
                    {(p.price * item.quantity).toLocaleString("fr-TN")} TND
                  </div>

                  {/* Remove */}
                  <motion.button className="cart-item__remove"
                    onClick={() => handleRemove(p._id)}
                    disabled={isRemoving}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.88 }}
                    title="Supprimer">
                    {isRemoving
                      ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                      : <Trash2 size={15} />}
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Summary panel */}
        <motion.aside className="cart-summary"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>

          <h2 className="cart-summary__title">Récapitulatif</h2>

          <div className="cart-summary__rows">
            <div className="cart-summary__row">
              <span>Sous-total</span>
              <span>{cart.total.toLocaleString("fr-TN")} TND</span>
            </div>
            <div className="cart-summary__row">
              <span>Livraison</span>
              <span className="cart-summary__free">Gratuite</span>
            </div>
            <div className="cart-summary__divider" />
            <div className="cart-summary__row cart-summary__row--total">
              <span>Total</span>
              <span>{cart.total.toLocaleString("fr-TN")} TND</span>
            </div>
          </div>

          <div className="cart-summary__badges">
            {["Paiement sécurisé", "Livraison 3–5 jours", "Retour 14 jours"].map(b => (
              <span key={b} className="cart-summary__badge">✓ {b}</span>
            ))}
          </div>

          <motion.button
            className="cart-checkout-btn"
            onClick={() => router.push("/commande")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}>
            Passer la commande
            <ArrowRight size={16} style={{ marginLeft: 8 }} />
          </motion.button>

          <p className="cart-summary__tva">TVA incluse · Toutes taxes comprises</p>
        </motion.aside>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}