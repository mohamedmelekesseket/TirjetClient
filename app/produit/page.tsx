"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

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

// ─── Demo product (replace with real fetch) ───────────────────────────────────
const DEMO: Product = {
  _id: "demo-001",
  title: "Parure Djerba Atlas",
  description:
    "Argent ciselé à la main, silhouette contemporaine pour un rendu premium unique. Chaque pièce est travaillée durant plus de 40 heures par nos artisans de Djerba, en utilisant des techniques transmises de génération en génération. L'oxydation naturelle crée un caractère unique à chaque parure — aucune n'est identique.",
  price: 290,
  images: [
    "https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=1200",
  ],
  category: "bijoux",
  artisan: {
    _id: "artisan-001",
    name: "Atelier Djerba Silver",
    city: "Djerba",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80",
  },
  stock: 3,
  isApproved: true,
  createdAt: "2025-01-15T00:00:00.000Z",
};

const RELATED = [
  {
    id: "r1", cat: "Bijoux", title: "Collier Berbère Argent", price: "180 TND", loc: "SFAX",
    img: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "r2", cat: "Bijoux", title: "Bracelet Tafraout", price: "120 TND", loc: "TUNIS",
    img: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: "r3", cat: "Bijoux", title: "Bague Chéchia d'Argent", price: "95 TND", loc: "KAIROUAN",
    img: "https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80&w=600",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  margoum: "Margoum",
  fokhar: "Poterie",
  bijoux: "Bijoux",
  tissage: "Tissage",
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth="1.8">
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

  return (
    <>
      <div className="pd-gallery">
        {/* Thumbnails */}
        <div className="pd-gallery__thumbs">
          {images.map((img, i) => (
            <motion.button
              key={i}
              className={`pd-gallery__thumb${active === i ? " pd-gallery__thumb--active" : ""}`}
              onClick={() => setActive(i)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <img src={img} alt={`Vue ${i + 1}`} />
            </motion.button>
          ))}
        </div>

        {/* Main */}
        <div className="pd-gallery__main" onClick={() => setLightbox(true)}>
          <AnimatePresence mode="wait">
            <motion.img
              key={active}
              src={images[active]}
              alt="Produit principal"
              className="pd-gallery__main-img"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            />
          </AnimatePresence>
          <div className="pd-gallery__zoom-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              <path d="M11 8v6M8 11h6"/>
            </svg>
            Agrandir
          </div>
          {/* Nav arrows */}
          <button className="pd-gallery__arrow pd-gallery__arrow--prev"
            onClick={(e) => { e.stopPropagation(); setActive((a) => (a - 1 + images.length) % images.length); }}>
            ‹
          </button>
          <button className="pd-gallery__arrow pd-gallery__arrow--next"
            onClick={(e) => { e.stopPropagation(); setActive((a) => (a + 1) % images.length); }}>
            ›
          </button>
          {/* Dots */}
          <div className="pd-gallery__dots">
            {images.map((_, i) => (
              <button key={i} className={`pd-gallery__dot${active === i ? " pd-gallery__dot--on" : ""}`}
                onClick={(e) => { e.stopPropagation(); setActive(i); }} />
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div className="pd-lightbox"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}>
            <motion.img
              src={images[active]}
              alt="Agrandir"
              className="pd-lightbox__img"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              onClick={(e) => e.stopPropagation()}
            />
            <button className="pd-lightbox__close" onClick={() => setLightbox(false)}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Related card ─────────────────────────────────────────────────────────────
function RelatedCard({ p, index }: { p: typeof RELATED[0]; index: number }) {
  const [wish, setWish] = useState(false);
  return (
    <motion.article
      className="pd-rel-card"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      whileHover={{ y: -6 }}
    >
      <div className="pd-rel-card__media">
        <motion.img src={p.img} alt={p.title}
          whileHover={{ scale: 1.07 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }} />
        <div className="pd-rel-card__shade" />
        <span className="pd-rel-card__cat">{p.cat}</span>
        <motion.button className={`pd-rel-card__wish${wish ? " pd-rel-card__wish--on" : ""}`}
          onClick={() => setWish(!wish)} whileTap={{ scale: 0.85 }}>
          <HeartIcon filled={wish} />
        </motion.button>
      </div>
      <div className="pd-rel-card__body">
        <h4 className="pd-rel-card__name">{p.title}</h4>
        <div className="pd-rel-card__row">
          <span className="pd-rel-card__loc"><Pin />{p.loc}</span>
          <span className="pd-rel-card__price">{p.price}</span>
        </div>
        <a href="#" className="pd-rel-card__cta">Voir la pièce →</a>
      </div>
    </motion.article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProductPage() {
  const product = DEMO; // Replace with: const product = await fetchProduct(id)

  const [qty, setQty] = useState(1);
  const [wish, setWish] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<"desc" | "details" | "avis">("desc");
  const [toastVisible, setToastVisible] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  const { ref: relRef, visible: relVisible } = useInView(0.1);

  function handleCart() {
    setAdded(true);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  }

  const inStock = product.stock > 0;
  const catLabel = CATEGORY_LABELS[product.category] ?? product.category;

  return (
    <div className="pd-root">

      {/* ── Breadcrumb ────────────────────────────────────────────────── */}
      <motion.nav
        className="pd-breadcrumb"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <a href="/">Accueil</a>
        <span className="pd-breadcrumb__sep">›</span>
        <a href="/boutique">Boutique</a>
        <span className="pd-breadcrumb__sep">›</span>
        <a href={`/boutique?cat=${product.category}`}>{catLabel}</a>
        <span className="pd-breadcrumb__sep">›</span>
        <span>{product.title}</span>
      </motion.nav>

      {/* ── Main Grid ─────────────────────────────────────────────────── */}
      <section className="pd-main" ref={heroRef}>

        {/* Gallery */}
        <motion.div
          className="pd-main__gallery"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <Gallery images={product.images} />
        </motion.div>

        {/* Info panel */}
        <motion.div
          className="pd-main__info"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          {/* Category + badges */}
          <div className="pd-info__top">
            <span className="pd-cat-pill">{catLabel}</span>
            {inStock && <span className="pd-badge pd-badge--green">En stock ({product.stock})</span>}
            {!inStock && <span className="pd-badge pd-badge--red">Épuisé</span>}
          </div>

          <h1 className="pd-info__title">{product.title}</h1>
          <StarRow count={4} />

          {/* Price */}
          <div className="pd-info__price-row">
            <span className="pd-info__price">{product.price} TND</span>
            <span className="pd-info__price-sub">TVA incluse · Livraison gratuite</span>
          </div>

          {/* Short desc */}
          <p className="pd-info__short-desc">
            {product.description.slice(0, 120)}…
          </p>

          {/* Divider */}
          <div className="pd-divider" />

          {/* Artisan */}
          <div className="pd-artisan-row">
            <div className="pd-artisan-row__avatar">
              {product.artisan.avatar
                ? <img src={product.artisan.avatar} alt={product.artisan.name} />
                : <span>{product.artisan.name[0]}</span>}
            </div>
            <div className="pd-artisan-row__text">
              <span className="pd-artisan-row__label">Artisan</span>
              <span className="pd-artisan-row__name">{product.artisan.name}</span>
              {product.artisan.city && (
                <span className="pd-artisan-row__loc"><Pin />{product.artisan.city.toUpperCase()}</span>
              )}
            </div>
            <a href={`/artisans/${product.artisan._id}`} className="pd-artisan-row__link">
              Voir le profil →
            </a>
          </div>

          <div className="pd-divider" />

          {/* Qty + CTA */}
          <div className="pd-actions">
            {/* Qty selector */}
            <div className="pd-qty">
              <motion.button className="pd-qty__btn"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                whileTap={{ scale: 0.88 }}>−</motion.button>
              <span className="pd-qty__val">{qty}</span>
              <motion.button className="pd-qty__btn"
                onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                whileTap={{ scale: 0.88 }}>+</motion.button>
            </div>

            {/* Cart button */}
            <motion.button
              className={`pd-cart-btn${added ? " pd-cart-btn--added" : ""}`}
              onClick={handleCart}
              disabled={!inStock}
              whileHover={inStock ? { scale: 1.02 } : {}}
              whileTap={inStock ? { scale: 0.97 } : {}}
            >
              <AnimatePresence mode="wait">
                {added ? (
                  <motion.span key="added"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    ✓ Ajouté au panier
                  </motion.span>
                ) : (
                  <motion.span key="add"
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    Ajouter au panier
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Wishlist */}
            <motion.button
              className={`pd-wish-btn${wish ? " pd-wish-btn--on" : ""}`}
              onClick={() => setWish(!wish)}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}
            >
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

      {/* ── Tabs: Description / Détails / Avis ────────────────────────── */}
      <section className="pd-tabs-section">
        <div className="pd-tabs__nav">
          {(["desc", "details", "avis"] as const).map((t) => (
            <motion.button
              key={t}
              className={`pd-tabs__tab${activeTab === t ? " pd-tabs__tab--active" : ""}`}
              onClick={() => setActiveTab(t)}
              whileHover={{ y: -1 }}
            >
              {{ desc: "Description", details: "Détails", avis: "Avis (24)" }[t]}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="pd-tabs__content"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            {activeTab === "desc" && (
              <p className="pd-tab-text">{product.description}</p>
            )}
            {activeTab === "details" && (
              <div className="pd-details-grid">
                {[
                  ["Catégorie", catLabel],
                  ["Matériaux", "Argent 925, pierre naturelle"],
                  ["Dimensions", "45 × 35 mm"],
                  ["Poids", "38 g"],
                  ["Origine", product.artisan.city ?? "Tunisie"],
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
            {activeTab === "avis" && (
              <div className="pd-reviews">
                {[
                  { name: "Mariem B.", rating: 5, text: "Absolument magnifique, dépasse les attentes. La qualité de l'argent et le soin des détails sont remarquables.", date: "Jan 2025" },
                  { name: "Karim T.", rating: 4, text: "Très beau bijou, l'artisan est talentueux. Livraison rapide et emballage soigné.", date: "Fév 2025" },
                  { name: "Sonia A.", rating: 5, text: "Je recommande vivement. Pièce unique, chaque détail est parfait.", date: "Mar 2025" },
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

      {/* ── Related ───────────────────────────────────────────────────── */}
      <section className="pd-related" ref={relRef}>
        <motion.div className="pd-related__head"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}>
          <p className="pd-label">Vous aimerez aussi</p>
          <h2 className="pd-related__title">Pièces similaires</h2>
        </motion.div>
        <div className="pd-related__grid">
          {RELATED.map((p, i) => <RelatedCard key={p.id} p={p} index={i} />)}
        </div>
      </section>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toastVisible && (
          <motion.div className="pd-toast"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}>
            <span className="pd-toast__icon">✓</span>
            <div>
              <strong>{product.title}</strong>
              <span>ajouté au panier · {qty} pièce{qty > 1 ? "s" : ""}</span>
            </div>
            <a href="/cart" className="pd-toast__link">Voir le panier →</a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}