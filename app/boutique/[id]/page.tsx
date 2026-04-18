"use client";

import { use, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Package, Dot } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { showSuccessToast } from "@/lib/toast";
import { useCart } from "../../context/CartContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category {
  _id: string;
  name: string;
  isActive: boolean;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: { _id: string; name: string } | string;
  artisan: {
    _id: string;
    name: string;
    city?: string;
    avatar?: string;
  };
  stock: number;
  isApproved: boolean;
  createdAt: string;
}

interface Comment {
  _id: string;
  user: { _id: string; name: string; image?: string };
  rating: number;
  content: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveCategoryName(
  category: Product["category"],
  categoriesMap: Map<string, string>
): string {
  if (!category) return "";
  if (typeof category === "object") return category.name;
  if (categoriesMap.has(category)) return categoriesMap.get(category)!;
  return category;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Pin() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.55 }}>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function StarRow({ count = 0, total }: { count?: number; total: number }) {
  return (
    <div className="pd-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24"
          fill={i < count ? "#C9A055" : "none"} stroke="#C9A055" strokeWidth="1.5">
          <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
        </svg>
      ))}
      <span className="pd-stars__count">({total} avis)</span>
    </div>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
function Gallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images.length) return (
    <div style={{
      width: "100%", aspectRatio: "1", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "#f0ebe3", borderRadius: 12, opacity: 0.5,
    }}>
      <Package size={48} />
    </div>
  );

  return (
    <>
      <div className="pd-gallery">
        <div className="pd-gallery__thumbs">
          {images.map((img, i) => (
            <motion.button key={i}
              className={`pd-gallery__thumb${active === i ? " pd-gallery__thumb--active" : ""}`}
              onClick={() => setActive(i)}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <img src={img} alt={`Vue ${i + 1}`} />
            </motion.button>
          ))}
        </div>

        <div className="pd-gallery__main" onClick={() => setLightbox(true)}>
          <AnimatePresence mode="wait">
            <motion.img key={active} src={images[active]} alt="Produit principal"
              className="pd-gallery__main-img"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as any }} />
          </AnimatePresence>
          <div className="pd-gallery__zoom-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              <path d="M11 8v6M8 11h6" />
            </svg>
            Agrandir
          </div>
          <button className="pd-gallery__arrow pd-gallery__arrow--prev"
            onClick={e => { e.stopPropagation(); setActive(a => (a - 1 + images.length) % images.length); }}>‹</button>
          <button className="pd-gallery__arrow pd-gallery__arrow--next"
            onClick={e => { e.stopPropagation(); setActive(a => (a + 1) % images.length); }}>›</button>
          <div className="pd-gallery__dots">
            {images.map((_, i) => (
              <button key={i}
                className={`pd-gallery__dot${active === i ? " pd-gallery__dot--on" : ""}`}
                onClick={e => { e.stopPropagation(); setActive(i); }} />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div className="pd-lightbox"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}>
            <motion.img src={images[active]} alt="Agrandir" className="pd-lightbox__img"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as any }}
              onClick={e => e.stopPropagation()} />
            <button className="pd-lightbox__close" onClick={() => setLightbox(false)} aria-label="Fermer">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const { addToCart } = useCart();

  // ── Categories map ─────────────────────────────────────────────────────────
  const [categoriesMap, setCategoriesMap] = useState<Map<string, string>>(new Map());

  // ── Product state ──────────────────────────────────────────────────────────
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [qty, setQty] = useState(1);
  const [wish, setWish] = useState(false);
  const [added, setAdded] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"avis" | "details">("avis");

  // ── Comments state ─────────────────────────────────────────────────────────
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── Fetch categories ───────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const list: Category[] = data?.data ?? (Array.isArray(data) ? data : []);
        const map = new Map<string, string>();
        list.forEach(c => map.set(c._id, c.name));
        setCategoriesMap(map);
      })
      .catch(() => { });
  }, []);

  // ── Fetch product ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API}/api/products/${id}`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        setProduct(data);

        const relRes = await fetch(`${API}/api/products`);
        if (relRes.ok) {
          const allData = await relRes.json();
          const all: Product[] = Array.isArray(allData)
            ? allData
            : allData.products ?? allData.data ?? [];

          const thisCatId = typeof data.category === "object"
            ? data.category._id
            : data.category;

          setRelated(
            all
              .filter(p => {
                const pCatId = typeof p.category === "object" ? p.category._id : p.category;
                return p._id !== data._id && pCatId === thisCatId && p.isApproved && p.stock > 0;
              })
              .slice(0, 3)
          );
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // ── Fetch comments ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "avis" || !id) return;
    const fetchComments = async () => {
      setCommentsLoading(true);
      try {
        const res = await fetch(`${API}/api/products/${id}/comments`);
        if (res.ok) setComments(await res.json());
      } finally {
        setCommentsLoading(false);
      }
    };
    fetchComments();
  }, [activeTab, id]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getToken = () => (session as any)?.apiToken as string | undefined;
  const currentUserId = (session as any)?.apiUser?._id as string | undefined;

  // ── Handlers ───────────────────────────────────────────────────────────────

  // ✅ Real cart integration
  async function handleCart() {
    if (!product) return;

    // Redirect to login if not authenticated
    if (!session) {
      router.push("/connexion");
      return;
    }

    setCartLoading(true);
    setCartError(null);

    try {
      await addToCart(product._id, qty);
      setAdded(true);
      showSuccessToast(
        `${product.title} ajouté au panier`,
        `${qty} pièce${qty > 1 ? "s" : ""} sélectionnée${qty > 1 ? "s" : ""}.`
      );
      // Reset "added" state after 2.5s so button returns to normal
      setTimeout(() => setAdded(false), 2500);
    } catch (err: any) {
      setCartError(err.message ?? "Erreur lors de l'ajout au panier.");
    } finally {
      setCartLoading(false);
    }
  }

  function handleStartEdit(r: Comment) {
    setEditingId(r._id);
    setNewRating(r.rating);
    setNewContent(r.content);
    setSubmitError(null);
    const form = document.querySelector(".pd-review-form") as HTMLElement | null;
    if (form) window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setNewContent("");
    setNewRating(5);
    setSubmitError(null);
  }

  async function handleSubmitComment() {
    if (!newContent.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = getToken();
      if (!token) { setSubmitError("Vous devez être connecté pour laisser un avis."); return; }

      const res = await fetch(`${API}/api/products/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: newRating, content: newContent }),
      });
      if (!res.ok) throw new Error((await res.json()).message);

      const created: Comment = await res.json();
      setComments(prev => [created, ...prev]);
      setNewContent("");
      setNewRating(5);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateComment() {
    if (!newContent.trim() || !editingId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API}/api/products/${id}/comments/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: newRating, content: newContent }),
      });
      if (!res.ok) throw new Error((await res.json()).message);

      const updated: Comment = await res.json();
      setComments(prev => prev.map(c => c._id === editingId ? updated : c));
      handleCancelEdit();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Supprimer cet avis ?")) return;
    try {
      const token = getToken();
      const res = await fetch(`${API}/api/products/${id}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (err: any) {
      setSubmitError(err.message);
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const avgRating = comments.length
    ? Math.round(comments.reduce((sum, c) => sum + c.rating, 0) / comments.length)
    : 0;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <Loader2 size={36} style={{ animation: "spin 1s linear infinite", opacity: 0.4 }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !product) return (
    <div style={{ textAlign: "center", padding: "4rem", opacity: 0.6 }}>
      <Package size={40} style={{ margin: "0 auto 1rem" }} />
      <p style={{ marginBottom: "1rem" }}>{error ?? "Produit introuvable."}</p>
      <Link href="/boutique" className="pd-artisan-row__link">← Retour à la boutique</Link>
    </div>
  );

  const inStock = product.stock > 0;
  const catLabel = resolveCategoryName(product.category, categoriesMap);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="pd-root">

      {/* Breadcrumb */}
      <motion.nav className="pd-breadcrumb"
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <Link href="/">Accueil</Link>
        <span className="pd-breadcrumb__sep">›</span>
        <Link href="/boutique">Boutique</Link>
        <span className="pd-breadcrumb__sep">›</span>
        <Link href={`/boutique?cat=${typeof product.category === "object" ? product.category._id : product.category}`}>
          {catLabel}
        </Link>
        <span className="pd-breadcrumb__sep">›</span>
        <span>{product.title}</span>
      </motion.nav>

      {/* Main grid */}
      <section className="pd-main">

        {/* Gallery */}
        <motion.div className="pd-main__gallery"
          initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }}>
          <Gallery images={product.images} />
        </motion.div>

        {/* Info panel */}
        <motion.div className="pd-main__info"
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] as any }}>

          <div className="pd-info__top">
            <span className="pd-cat-pill">{catLabel}</span>
            {inStock
              ? <span className="pd-badge pd-badge--green">En stock ({product.stock})</span>
              : <span className="pd-badge pd-badge--red">Épuisé</span>}
          </div>

          <h1 className="pd-info__title">{product.title}</h1>
          {/* <StarRow count={avgRating} total={comments.length} /> */}

          <div className="pd-info__price-row">
            <span className="pd-info__price">{product.price.toLocaleString("fr-TN")} TND</span>
            <span className="pd-info__price-sub">TVA incluse · Livraison gratuite</span>
          </div>

          <p className="pd-info__short-desc">{product.description}</p>

          <div className="pd-divider" />

          {/* Artisan */}
          <div className="pd-artisan-row">
            <div className="pd-artisan-row__avatar">
              {product.artisan?.avatar
                ? <img src={product.artisan.avatar} alt={product.artisan.name} />
                : <span>{product.artisan?.name?.[0] ?? "A"}</span>}
            </div>
            <div className="pd-artisan-row__text">
              <span className="pd-artisan-row__label">Artisan</span>
              <span className="pd-artisan-row__name">{product.artisan?.name}</span>
              {product.artisan?.city && (
                <span className="pd-artisan-row__loc"><Pin />{product.artisan.city.toUpperCase()}</span>
              )}
            </div>
            <Link href={`/Artisanprofile/${product?.artisan?._id}`} className="pd-artisan-row__link">
              Voir le profil →
            </Link>
          </div>

          <div className="pd-divider" />

          {/* Qty + CTA */}
          <div className="pd-actions">
            <div className="pd-qty">
              <motion.button className="pd-qty__btn"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                disabled={cartLoading}
                whileTap={{ scale: 0.88 }}>−</motion.button>
              <span className="pd-qty__val">{qty}</span>
              <motion.button className="pd-qty__btn"
                onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                disabled={cartLoading}
                whileTap={{ scale: 0.88 }}>+</motion.button>
            </div>

            <motion.button
              className={`pd-cart-btn${added ? " pd-cart-btn--added" : ""}`}
              onClick={handleCart}
              disabled={!inStock || cartLoading}
              whileHover={inStock && !cartLoading ? { scale: 1.02 } : {}}
              whileTap={inStock && !cartLoading ? { scale: 0.97 } : {}}>
              <AnimatePresence mode="wait">
                {cartLoading ? (
                  <motion.span key="loading"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <Loader2 size={16} style={{ marginRight: 8, animation: "spin 1s linear infinite" }} />
                    Ajout…
                  </motion.span>
                ) : added ? (
                  <motion.span key="added"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <Check size={16} style={{ marginRight: 8 }} aria-hidden="true" />
                    Ajouté au panier
                  </motion.span>
                ) : (
                  <motion.span key="add"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    {inStock ? "Ajouter au panier" : "Épuisé"}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              className={`pd-wish-btn${wish ? " pd-wish-btn--on" : ""}`}
              onClick={() => setWish(!wish)}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}>
              <HeartIcon filled={wish} />
            </motion.button>
          </div>

          {/* Cart error message */}
          {cartError && (
            <motion.p
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{
                color: "#c0392b", fontSize: "0.82rem", marginTop: "0.5rem",
                background: "#fdf0ef", border: "1px solid #f5c6c2",
                borderRadius: 8, padding: "0.5rem 0.75rem",
              }}>
              {cartError}
            </motion.p>
          )}

          {/* Go to cart shortcut when item just added */}
          {added && !cartLoading && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: "0.5rem", display: "flex", gap: 10 }}>
              <Link href="/panier" className="pd-artisan-row__link">
                Voir le panier →
              </Link>
              <span style={{ color: "#b8a88a", fontSize: "0.82rem" }}>·</span>
              <Link href="/commande" className="pd-artisan-row__link">
                Commander →
              </Link>
            </motion.div>
          )}

          {/* Trust badges */}
          <div className="pd-trust">
            {[
              { icon: <Dot />, text: "Paiement sécurisé" },
              { icon: <Dot />, text: "Livraison 3–5 jours" },
              { icon: <Dot />, text: "Retour 14 jours" },
            ].map(b => (
              <div key={b.text} className="pd-trust__item">
                <span className="pd-trust__icon">{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Tabs */}
      <section className="pd-tabs-section">
        <div className="pd-tabs__nav">
          {(["details", "avis"] as const).map(t => (
            <motion.button key={t}
              className={`pd-tabs__tab${activeTab === t ? " pd-tabs__tab--active" : ""}`}
              onClick={() => setActiveTab(t)}
              whileHover={{ y: -1 }}>
              {{ details: "Détails", avis: `Avis (${comments.length})` }[t]}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} className="pd-tabs__content"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] as any }}>

            {/* Details tab */}
            {activeTab === "details" && (
              <div className="pd-details-grid">
                {[
                  ["Catégorie", catLabel],
                  ["Origine", product.artisan?.city ?? "Tunisie"],
                  ["Stock", `${product.stock} pièce(s)`],
                  ["Référence", product._id.slice(-8).toUpperCase()],
                  ["Ajouté le", new Date(product.createdAt).toLocaleDateString("fr-FR")],
                ].map(([k, v]) => (
                  <div key={k} className="pd-detail-row">
                    <span className="pd-detail-row__key">{k}</span>
                    <span className="pd-detail-row__val">{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Avis tab */}
            {activeTab === "avis" && (
              <div className="pd-reviews">

                {session ? (
                  <div className="pd-review-form">
                    <h3 className="pd-review-form__title">
                      {editingId ? "Modifier votre avis" : "Laisser un avis"}
                    </h3>

                    <div className="pd-review-form__stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button key={i} type="button" onClick={() => setNewRating(i + 1)}>
                          <svg width="22" height="22" viewBox="0 0 24 24"
                            fill={i < newRating ? "#C9A055" : "none"} stroke="#C9A055" strokeWidth="1.5">
                            <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
                          </svg>
                        </button>
                      ))}
                    </div>

                    <textarea
                      className="pd-review-form__textarea"
                      rows={3}
                      placeholder="Partagez votre expérience…"
                      value={newContent}
                      onChange={e => setNewContent(e.target.value)}
                    />

                    {submitError && (
                      <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 8 }}>{submitError}</p>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      <motion.button
                        className="pd-cart-btn"
                        onClick={editingId ? handleUpdateComment : handleSubmitComment}
                        disabled={submitting || !newContent.trim()}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}>
                        {submitting
                          ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                          : editingId ? "Enregistrer" : "Publier l'avis"}
                      </motion.button>

                      {editingId && (
                        <motion.button
                          className="pd-qty__btn"
                          onClick={handleCancelEdit}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          style={{ padding: "0 1.2rem" }}>
                          Annuler
                        </motion.button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pd-review-form" style={{ textAlign: "center", opacity: 0.7 }}>
                    <p style={{ marginBottom: "0.75rem" }}>Connectez-vous pour laisser un avis.</p>
                    <Link href="/connexion" className="pd-artisan-row__link">Se connecter →</Link>
                  </div>
                )}

                {commentsLoading ? (
                  <div style={{ textAlign: "center", padding: "2rem", opacity: 0.4 }}>
                    <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
                  </div>
                ) : comments.length === 0 ? (
                  <p style={{ opacity: 0.4, textAlign: "center", padding: "1.5rem" }}>
                    Aucun avis pour le moment. Soyez le premier !
                  </p>
                ) : (
                  comments.map((r, i) => {
                    const isMyComment = currentUserId === r.user._id;
                    return (
                      <motion.div key={r._id} className="pd-review"
                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.5 }}>
                        <div className="pd-review__head">
                          <div className="pd-review__avatar">
                            {r.user.image
                              ? <img src={r.user.image} alt={r.user.name}
                                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                              : r.user.name[0]}
                          </div>
                          <div style={{ flex: 1 }}>
                            <span className="pd-review__name">{r.user.name}</span>
                            <div className="pd-review__stars">
                              {Array.from({ length: 5 }).map((_, si) => (
                                <svg key={si} width="11" height="11" viewBox="0 0 24 24"
                                  fill={si < r.rating ? "#C9A055" : "none"} stroke="#C9A055" strokeWidth="1.5">
                                  <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <span className="pd-review__date">
                            {new Date(r.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                          </span>

                          {isMyComment && (
                            <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
                              <motion.button
                                className="pd-review__action-btn"
                                onClick={() => handleStartEdit(r)}
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                title="Modifier">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </motion.button>
                              <motion.button
                                className="pd-review__action-btn pd-review__action-btn--delete"
                                onClick={() => handleDeleteComment(r._id)}
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                title="Supprimer">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6M14 11v6" />
                                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                </svg>
                              </motion.button>
                            </div>
                          )}
                        </div>
                        <p className="pd-review__text">{r.content}</p>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </section>

      {/* Related */}
      <section className="pd-related">
        <motion.div className="pd-related__head"
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.65 }}>
          <p className="pd-label">Vous aimerez aussi</p>
          <h2 className="pd-related__title">Pièces similaires</h2>
        </motion.div>

        {related.length === 0 ? (
          <p style={{ opacity: 0.4, textAlign: "center", padding: "2rem" }}>
            Aucune pièce similaire pour le moment.
          </p>
        ) : (
          <div className="pd-related__grid">
            {related.map((p, i) => {
              const relCatLabel = resolveCategoryName(p.category, categoriesMap);
              return (
                <motion.article key={p._id} className="pd-rel-card"
                  initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as any }}
                  whileHover={{ y: -6 }}>
                  <div className="pd-rel-card__media">
                    {p.images?.[0]
                      ? <motion.img src={p.images[0]} alt={p.title}
                        whileHover={{ scale: 1.07 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }} />
                      : <div style={{
                        width: "100%", height: "100%", background: "#f0ebe3",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <Package size={28} style={{ opacity: 0.4 }} />
                      </div>
                    }
                    <div className="pd-rel-card__shade" />
                    <span className="pd-rel-card__cat">{relCatLabel}</span>
                  </div>
                  <div className="pd-rel-card__body">
                    <h4 className="pd-rel-card__name">{p.title}</h4>
                    <div className="pd-rel-card__row">
                      <span className="pd-rel-card__loc">
                        <Pin />{p.artisan?.city?.toUpperCase() ?? "TUNISIE"}
                      </span>
                      <span className="pd-rel-card__price">{p.price.toLocaleString("fr-TN")} TND</span>
                    </div>
                    <Link href={`/boutique/${p._id}`} className="pd-rel-card__cta">
                      Voir la pièce →
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .pd-review-form {
          background: var(--surface, #faf8f5);
          border: 1px solid #e8e0d5;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 1.5rem;
        }
        .pd-review-form__title {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }
        .pd-review-form__stars {
          display: flex;
          gap: 4px;
          margin-bottom: 0.75rem;
        }
        .pd-review-form__stars button {
          background: none;
          border: none;
          padding: 2px;
          cursor: pointer;
          transition: transform 0.15s;
        }
        .pd-review-form__stars button:hover { transform: scale(1.2); }
        .pd-review-form__textarea {
          width: 100%;
          border: 1px solid #e0d8ce;
          border-radius: 8px;
          padding: 0.65rem 0.9rem;
          font-size: 0.9rem;
          resize: vertical;
          margin-bottom: 0.75rem;
          background: #fff;
          font-family: inherit;
          box-sizing: border-box;
        }
        .pd-review-form__textarea:focus {
          outline: none;
          border-color: #C9A055;
        }
        .pd-review__action-btn {
          background: none;
          border: 1px solid #e0d8ce;
          border-radius: 6px;
          padding: 4px 6px;
          cursor: pointer;
          color: #888;
          display: flex;
          align-items: center;
          transition: all 0.15s;
        }
        .pd-review__action-btn:hover {
          border-color: #C9A055;
          color: #C9A055;
        }
        .pd-review__action-btn--delete:hover {
          border-color: #c0392b;
          color: #c0392b;
        }
      `}</style>
    </div>
  );
}