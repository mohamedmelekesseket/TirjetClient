"use client";

import { useCart } from "../context/CartContext";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, Package, ChevronRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ShippingForm {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
}

export default function CommandePage() {
  const { cart, loading } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const SHIPPING = 7;
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [paymentMethod, setPaymentMethod] = useState<"cash_on_delivery" | "card">("cash_on_delivery");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [form, setForm] = useState<ShippingForm>({
    fullName: (session as any)?.apiUser?.name ?? "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
  });

  const token = () => (session as any)?.apiToken as string | undefined;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleNext() {
    if (!form.fullName || !form.phone || !form.address || !form.city) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setError(null);
    setStep("confirm");
  }

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const t = token();
      if (!t) throw new Error("Vous devez être connecté.");

      const res = await fetch(`${API}/api/orders/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ shippingAddress: form, paymentMethod }),
      });

      if (!res.ok) throw new Error((await res.json()).message);
      const order = await res.json();
      setOrderId(order._id);
      setStep("success");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Guards ──
  if (!session) return (
    <div className="cart-empty">
      <div className="cart-empty__icon"><ShoppingBag size={52} strokeWidth={1.1} /></div>
      <h2 className="cart-empty__title">Connectez-vous pour passer commande</h2>
      <p className="cart-empty__sub">Accédez à votre compte pour continuer</p>
      <Link href="/connexion" className="cart-checkout-btn" style={{ width: "auto", padding: "0.85rem 2rem" }}>
        Se connecter →
      </Link>
    </div>
  );

  if (loading) return (
    <div className="cart-empty">
      <Loader2 size={32} style={{ animation: "spin 1s linear infinite", opacity: 0.35 }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (cart.items.length === 0 && step !== "success") return (
    <motion.div className="cart-empty"
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="cart-empty__icon"><ShoppingBag size={48} strokeWidth={1.1} /></div>
      <h2 className="cart-empty__title">Votre panier est vide</h2>
      <Link href="/boutique" className="cart-checkout-btn" style={{ width: "auto", padding: "0.85rem 2rem" }}>
        Explorer la boutique →
      </Link>
    </motion.div>
  );

  // ── Success ──
  if (step === "success") return (
    <motion.div className="cmd-success"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      <motion.div className="cmd-success__icon"
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ delay: 0.22, type: "spring", stiffness: 200, damping: 15 }}>
        <CheckCircle size={56} strokeWidth={1.4} />
      </motion.div>
      <h1 className="cmd-success__title">Commande confirmée !</h1>
      <p className="cmd-success__sub">
        Merci pour votre achat. Vous recevrez une confirmation par email sous peu.
      </p>
      {orderId && (
        <p className="cmd-success__ref">
          Réf : {orderId.slice(-8).toUpperCase()}
        </p>
      )}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem" }}>
        <Link href="/boutique" className="cart-checkout-btn" style={{ width: "auto", padding: "0.85rem 1.75rem" }}>
          Continuer les achats
        </Link>
        <Link href="/mes-commandes" className="cart-checkout-btn">
          Voir mes commandes →
        </Link>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );

  // ── Main checkout layout ──
  return (
    <div className="cart-root">
      {/* Breadcrumb */}
      <motion.div className="cmd-steps"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}>
        {[
          { key: "form",    label: "Livraison" },
          { key: "confirm", label: "Confirmation" },
        ].map((s, i, arr) => (
          <span key={s.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className={
              `cmd-step${step === s.key ? " cmd-step--active" : ""}${
                step === "confirm" && i === 0 ? " cmd-step--done" : ""
              }`
            }>
              {step === "confirm" && i === 0 ? "✓ " : `${i + 1}. `}{s.label}
            </span>
            {i < arr.length - 1 && (
              <ChevronRight size={13} style={{ opacity: 0.3 }} />
            )}
          </span>
        ))}
      </motion.div>

      <div className="cart-layout">
        {/* ── Left: form or confirm ── */}
        <div>
          <AnimatePresence mode="wait">

            {/* Step 1: Shipping form */}
            {step === "form" && (
              <motion.div key="form" className="cmd-form-card"
                initial={{ opacity: 0, x: -22 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 22 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>

                <h2 className="cmd-form-card__title">Adresse de livraison</h2>

                <div className="cmd-grid-2">
                  <div className="cmd-field">
                    <label className="cmd-label">Nom complet <span className="cmd-req">*</span></label>
                    <input className="cmd-input" name="fullName" value={form.fullName}
                      onChange={handleChange} placeholder="Prénom Nom" autoComplete="name" />
                  </div>
                  <div className="cmd-field">
                    <label className="cmd-label">Téléphone <span className="cmd-req">*</span></label>
                    <input className="cmd-input" name="phone" value={form.phone}
                      onChange={handleChange} placeholder="+216 XX XXX XXX" type="tel" autoComplete="tel" />
                  </div>
                </div>

                <div className="cmd-field">
                  <label className="cmd-label">Adresse <span className="cmd-req">*</span></label>
                  <input className="cmd-input" name="address" value={form.address}
                    onChange={handleChange} placeholder="Numéro, rue, quartier…" autoComplete="street-address" />
                </div>

                <div className="cmd-grid-2">
                  <div className="cmd-field">
                    <label className="cmd-label">Ville <span className="cmd-req">*</span></label>
                    <input className="cmd-input" name="city" value={form.city}
                      onChange={handleChange} placeholder="Tunis, Sfax…" autoComplete="address-level2" />
                  </div>
                  <div className="cmd-field">
                    <label className="cmd-label">Code postal</label>
                    <input className="cmd-input" name="postalCode" value={form.postalCode}
                      onChange={handleChange} placeholder="1000" autoComplete="postal-code" />
                  </div>
                </div>

                <div className="cmd-field">
                  <label className="cmd-label">Instructions (facultatif)</label>
                  <textarea className="cmd-input cmd-textarea" name="notes" value={form.notes}
                    onChange={handleChange}
                    placeholder="Instructions de livraison particulières…" rows={3} />
                </div>

                {/* Payment */}
                <p className="cmd-section-label">Mode de paiement</p>

                <div className="cmd-payment-opts">
                  {([
                    { value: "cash_on_delivery", label: "💵 Paiement à la livraison", sub: "Payez en espèces à la réception" },
                    // { value: "card",             label: "💳 Carte bancaire",          sub: "Visa, Mastercard, CIB" },
                  ] as const).map(opt => (
                    <motion.label key={opt.value}
                      className={`cmd-pay-opt${paymentMethod === opt.value ? " cmd-pay-opt--active" : ""}`}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <input type="radio" name="payment" value={opt.value}
                        checked={paymentMethod === opt.value}
                        onChange={() => setPaymentMethod(opt.value)}
                        style={{ display: "none" }} />
                      <div>
                        <div className="cmd-pay-opt__label">{opt.label}</div>
                        <div className="cmd-pay-opt__sub">{opt.sub}</div>
                      </div>
                      <div className={`cmd-pay-opt__radio${paymentMethod === opt.value ? " cmd-pay-opt__radio--on" : ""}`} />
                    </motion.label>
                  ))}
                </div>

                {error && <p className="cmd-error">{error}</p>}

                <motion.button className="cart-checkout-btn"
                  onClick={handleNext} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  Continuer → Récapitulatif
                </motion.button>
              </motion.div>
            )}

            {/* Step 2: Confirm */}
            {step === "confirm" && (
              <motion.div key="confirm" className="cmd-form-card"
                initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -22 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>

                <h2 className="cmd-form-card__title">Vérifiez votre commande</h2>

                <div className="cmd-recap-block">
                  <div className="cmd-recap-block__head">
                    <span>📍 Adresse de livraison</span>
                    <button className="cmd-edit-btn" onClick={() => setStep("form")}>Modifier</button>
                  </div>
                  <p className="cmd-recap-block__text">
                    {form.fullName} · {form.phone}<br />
                    {form.address}, {form.city}{form.postalCode ? ` ${form.postalCode}` : ""}
                    {form.notes && <><br /><em style={{ color: "var(--warm-faint)" }}>{form.notes}</em></>}
                  </p>
                </div>

                <div className="cmd-recap-block">
                  <div className="cmd-recap-block__head">
                    <span>💳 Paiement</span>
                    <button className="cmd-edit-btn" onClick={() => setStep("form")}>Modifier</button>
                  </div>
                  <p className="cmd-recap-block__text">
                    {paymentMethod === "cash_on_delivery" ? "Paiement à la livraison" : "Carte bancaire"}
                  </p>
                </div>

                <div className="cmd-items-recap">
                  {cart.items.map(item => (
                    <div key={item.product._id} className="cmd-recap-item">
                      {item.product.images?.[0] && (
                        <img src={item.product.images[0]} alt={item.product.title}
                          className="cmd-recap-item__img" />
                      )}
                      <span className="cmd-recap-item__name">{item.product.title}</span>
                      <span className="cmd-recap-item__qty">× {item.quantity}</span>
                      <span className="cmd-recap-item__price">
                        {(item.price * item.quantity).toLocaleString("fr-TN")} TND
                      </span>
                    </div>
                  ))}
                </div>

                {error && <p className="cmd-error">{error}</p>}

                <div style={{ display: "flex", gap: 10, marginTop: "1.5rem" }}>
                  <motion.button className="cmd-outline-btn" style={{ flex: 1 }}
                    onClick={() => setStep("form")} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}>
                    ← Retour
                  </motion.button>
                  <motion.button className="cart-checkout-btn"
                    style={{ flex: 2, marginTop: 0 }}
                    onClick={handleConfirm} disabled={submitting}
                    whileHover={!submitting ? { scale: 1.02 } : {}}
                    whileTap={!submitting ? { scale: 0.97 } : {}}>
                    {submitting
                      ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                      : "✓ Confirmer la commande"}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right: order summary ── */}
        <motion.aside className="cart-summary"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}>

          <h2 className="cart-summary__title">Votre commande</h2>

          <div style={{ marginBottom: "1rem" }}>
            {cart.items.map(item => (
              <div key={item.product._id} className="cmd-recap-item"
                style={{ padding: "0.55rem 0", borderBottom: "1px solid var(--border-soft)" }}>
                {item.product.images?.[0] && (
                  <img src={item.product.images[0]} alt={item.product.title}
                    className="cmd-recap-item__img" />
                )}
                <span className="cmd-recap-item__name" style={{ fontSize: "0.82rem" }}>
                  {item.product.title}
                </span>
                <span className="cmd-recap-item__qty">×{item.quantity}</span>
                <span className="cmd-recap-item__price" style={{ fontSize: "0.82rem" }}>
                  {(item.price * item.quantity).toLocaleString("fr-TN")} TND
                </span>
              </div>
            ))}
          </div>

          <div className="cart-summary__divider" />

          <div className="cart-summary__rows">
            <div className="cart-summary__row">
              <span>Sous-total</span>
              <span>{(cart.total + SHIPPING).toLocaleString("fr-TN")} TND</span>
            </div>
            <div className="cart-summary__row">
              <span>Livraison</span>
              <span className="cart-summary__free">7 TND</span>
            </div>
            <div className="cart-summary__divider" />
            <div className="cart-summary__row cart-summary__row--total">
              <span>Total</span>
              <span>{(cart.total + SHIPPING).toLocaleString("fr-TN")} TND</span>
            </div>
          </div>

          <div className="cart-summary__badges" style={{ marginBottom: 0 }}>
            {["Paiement sécurisé", "Livraison 3–5 jours", "Retour sous 14 jours"].map(b => (
              <span key={b} className="cart-summary__badge">{b}</span>
            ))}
          </div>
        </motion.aside>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}