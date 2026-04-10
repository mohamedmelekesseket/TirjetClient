"use client";

import { use, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Check, X, Loader2, Package } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: "margoum" | "fokhar" | "bijoux" | "tissage";
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

const CATEGORY_LABELS: Record<string, string> = {
  margoum: "Margoum",
  fokhar:  "Poterie",
  bijoux:  "Bijoux",
  tissage: "Tissage",
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
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

function StarRow({ count = 5 }: { count?: number }) {
  return (
    <div className="pd-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24"
          fill={i < count ? "#C9A055" : "none"} stroke="#C9A055" strokeWidth="1.5">
          <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
        </svg>
      ))}
      <span className="pd-stars__count">(24 avis)</span>
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
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              <path d="M11 8v6M8 11h6"/>
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

  const [product, setProduct]   = useState<Product | null>(null);
  const [related, setRelated]   = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const [qty, setQty]           = useState(1);
  const [wish, setWish]         = useState(false);
  const [added, setAdded]       = useState(false);
  const [activeTab, setActiveTab] = useState<"desc" | "details" | "avis">("desc");
  const [toastVisible, setToastVisible] = useState(false);



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

        // fetch related: same category, exclude current
        const relRes = await fetch(`${API}/api/products`);
        if (relRes.ok) {
          const allData = await relRes.json();
          const all: Product[] = Array.isArray(allData)
            ? allData
            : allData.products ?? allData.data ?? [];
          setRelated(
            all
              .filter(p => p._id !== data._id && p.category === data.category && p.isApproved && p.stock > 0)
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

  function handleCart() {
    setAdded(true);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  }

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

  const inStock  = product.stock > 0;
  const catLabel = CATEGORY_LABELS[product.category] ?? product.category;

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
        <Link href={`/boutique?cat=${product.category}`}>{catLabel}</Link>
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
          <StarRow count={4} />

          <div className="pd-info__price-row">
            <span className="pd-info__price">{product.price.toLocaleString("fr-TN")} TND</span>
            <span className="pd-info__price-sub">TVA incluse · Livraison gratuite</span>
          </div>

          <p className="pd-info__short-desc">
            {product.description.slice(0, 120)}…
          </p>

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
            <Link href={`/Artisanprofile/${product.artisan?._id}`} className="pd-artisan-row__link">
              Voir le profil →
            </Link>
          </div>

          <div className="pd-divider" />

          {/* Qty + CTA */}
          <div className="pd-actions">
            <div className="pd-qty">
              <motion.button className="pd-qty__btn"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                whileTap={{ scale: 0.88 }}>−</motion.button>
              <span className="pd-qty__val">{qty}</span>
              <motion.button className="pd-qty__btn"
                onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                whileTap={{ scale: 0.88 }}>+</motion.button>
            </div>

            <motion.button
              className={`pd-cart-btn${added ? " pd-cart-btn--added" : ""}`}
              onClick={handleCart}
              disabled={!inStock}
              whileHover={inStock ? { scale: 1.02 } : {}}
              whileTap={inStock ? { scale: 0.97 } : {}}>
              <AnimatePresence mode="wait">
                {added ? (
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

          {/* Trust badges */}
          <div className="pd-trust">
            {[
              { icon: "🔒", text: "Paiement sécurisé" },
              { icon: "🚚", text: "Livraison 3–5 jours" },
              { icon: "↩️", text: "Retour 14 jours" },
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
          {(["desc", "details", "avis"] as const).map(t => (
            <motion.button key={t}
              className={`pd-tabs__tab${activeTab === t ? " pd-tabs__tab--active" : ""}`}
              onClick={() => setActiveTab(t)}
              whileHover={{ y: -1 }}>
              {{ desc: "Description", details: "Détails", avis: "Avis (24)" }[t]}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} className="pd-tabs__content"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] as any }}>

            {activeTab === "desc" && (
              <p className="pd-tab-text">{product.description}</p>
            )}

            {activeTab === "details" && (
              <div className="pd-details-grid">
                {[
                  ["Catégorie",  catLabel],
                  ["Origine",    product.artisan?.city ?? "Tunisie"],
                  ["Stock",      `${product.stock} pièce(s)`],
                  ["Référence",  product._id.slice(-8).toUpperCase()],
                  ["Ajouté le",  new Date(product.createdAt).toLocaleDateString("fr-FR")],
                ].map(([k, v]) => (
                  <div key={k} className="pd-detail-row">
                    <span className="pd-detail-row__key">{k}</span>
                    <span className="pd-detail-row__val">{v}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "avis" && (
              <div className="pd-reviews">
                {[
                  { name: "Mariem B.", rating: 5, text: "Absolument magnifique, dépasse les attentes. La qualité et le soin des détails sont remarquables.", date: "Jan 2025" },
                  { name: "Karim T.",  rating: 4, text: "Très beau bijou, livraison rapide et emballage soigné.", date: "Fév 2025" },
                  { name: "Sonia A.",  rating: 5, text: "Je recommande vivement. Pièce unique, chaque détail est parfait.", date: "Mar 2025" },
                ].map((r, i) => (
                  <motion.div key={i} className="pd-review"
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}>
                    <div className="pd-review__head">
                      <div className="pd-review__avatar">{r.name[0]}</div>
                      <div>
                        <span className="pd-review__name">{r.name}</span>
                        <div className="pd-review__stars">
                          {Array.from({ length: 5 }).map((_, si) => (
                            <svg key={si} width="11" height="11" viewBox="0 0 24 24"
                              fill={si < r.rating ? "#C9A055" : "none"} stroke="#C9A055" strokeWidth="1.5">
                              <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <span className="pd-review__date">{r.date}</span>
                    </div>
                    <p className="pd-review__text">{r.text}</p>
                  </motion.div>
                ))}
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
            {related.map((p, i) => (
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
                    : <div style={{ width: "100%", height: "100%", background: "#f0ebe3",
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Package size={28} style={{ opacity: 0.4 }} />
                      </div>
                  }
                  <div className="pd-rel-card__shade" />
                  <span className="pd-rel-card__cat">{CATEGORY_LABELS[p.category] ?? p.category}</span>
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
            ))}
          </div>
        )}
      </section>

      {/* Toast */}
      <AnimatePresence>
        {toastVisible && (
          <motion.div className="pd-toast"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as any }}>
            <span className="pd-toast__icon" aria-hidden="true"><Check size={18} /></span>
            <div>
              <strong>{product.title}</strong>
              <span>ajouté au panier · {qty} pièce{qty > 1 ? "s" : ""}</span>
            </div>
            <Link href="/cart" className="pd-toast__link">Voir le panier →</Link>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}