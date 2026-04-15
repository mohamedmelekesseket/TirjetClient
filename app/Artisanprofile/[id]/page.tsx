"use client";

import { use, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Loader2, Package } from "lucide-react";
import Link from "next/link";
import { showSuccessToast } from "@/lib/toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  _id: string; name: string; email: string; image?: string;
  role: "user" | "vendor" | "admin"; isVerified: boolean;
  status: "active" | "pending" | "blocked"; createdAt: string;
}
interface ArtisanProfile {
  _id: string; user: User; phone?: string; region?: string;
  description?: string; images: string[]; isApproved: boolean; createdAt: string;
  specialty?: string; availability?: string;
  products?: Product[];
}
interface Product {
  _id: string; title: string; description: string; price: number;
  images: string[]; category: "margoum" | "fokhar" | "bijoux" | "tissage"; stock: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  margoum: "Margoum", fokhar: "Poterie", bijoux: "Bijoux", tissage: "Tissage",
};

// ─── Motion presets ───────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.65, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.1) {
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

// ─── Icons ────────────────────────────────────────────────────────────────────
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

// ─── Works Gallery ────────────────────────────────────────────────────────────
function WorksGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);

  if (!images.length) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
      background: "#f0ebe3", borderRadius: 12, aspectRatio: "4/3", opacity: 0.5 }}>
      <Package size={40} />
    </div>
  );

  return (
    <div className="artp-works-gallery">
      <AnimatePresence mode="wait">
        <motion.div className="artp-works-gallery__main" key={active}
          initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <img src={images[active]} alt="" />
        </motion.div>
      </AnimatePresence>
      <div className="artp-works-gallery__thumbs">
        {images.map((img, i) => (
          <motion.button key={i}
            className={`artp-works-gallery__thumb${active === i ? " artp-works-gallery__thumb--on" : ""}`}
            onClick={() => setActive(i)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
            <img src={img} alt="" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ p, index, wishlist, cartAdded, onWishToggle, onCart }: {
  p: Product; index: number; wishlist: string[]; cartAdded: string[];
  onWishToggle: (id: string) => void; onCart: (id: string) => void;
}) {
  const isWished = wishlist.includes(p._id);
  const isAdded  = cartAdded.includes(p._id);

  return (
    <motion.article className="artp-prod-card"
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.6 + index * 0.09, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}>
      <div className="artp-prod-card__media">
        {p.images?.[0]
          ? <motion.img src={p.images[0]} alt={p.title}
              whileHover={{ scale: 1.07 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
          : <div style={{ width: "100%", height: "100%", background: "#f0ebe3",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={28} style={{ opacity: 0.4 }} />
            </div>
        }
        <div className="artp-prod-card__shade" />
        <span className="artp-prod-card__cat">{CATEGORY_LABELS[p.category] ?? p.category}</span>
        <motion.button
          className={`artp-prod-card__wish${isWished ? " artp-prod-card__wish--on" : ""}`}
          onClick={() => onWishToggle(p._id)} whileTap={{ scale: 0.82 }}>
          <HeartIcon filled={isWished} />
        </motion.button>
        {p.stock === 1 && <span className="artp-prod-card__last">Dernière pièce</span>}
      </div>
      <div className="artp-prod-card__body">
        <div className="artp-prod-card__top">
          <h3 className="artp-prod-card__title">{p.title}</h3>
          <span className="artp-prod-card__price">{p.price.toLocaleString("fr-TN")} TND</span>
        </div>
        <p className="artp-prod-card__desc">{p.description}</p>
        <div className="artp-prod-card__foot">
          <Link href={`/boutique/${p._id}`} className="artp-prod-card__cta">Voir la pièce →</Link>
          <motion.button
            className={`artp-prod-card__cart${isAdded ? " artp-prod-card__cart--added" : ""}`}
            onClick={() => onCart(p._id)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}>
            {isAdded ? <Check size={16} /> : <Plus size={16} />}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Info Sidebar ─────────────────────────────────────────────────────────────
function InfoCard({ artisan, joinDate, totalProducts }: {
  artisan: ArtisanProfile; joinDate: string; totalProducts: number;
}) {
  return (
    <motion.aside className="artp-info-card"
      initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>

      <h3 className="artp-info-card__title">Informations</h3>

      <ul className="artp-info-card__list">
        {artisan.phone && (
          <li className="artp-info-card__item">
            <span className="artp-info-card__icon-wrap artp-info-card__icon-wrap--orange">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </span>
            <div>
              <span className="artp-info-card__label">Téléphone</span>
              <span className="artp-info-card__val">{artisan.phone}</span>
            </div>
          </li>
        )}
        <li className="artp-info-card__item">
          <span className="artp-info-card__icon-wrap artp-info-card__icon-wrap--orange">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </span>
          <div>
            <span className="artp-info-card__label">Email</span>
            <span className="artp-info-card__val">{artisan.user.email}</span>
          </div>
        </li>
        {artisan.region && (
          <li className="artp-info-card__item">
            <span className="artp-info-card__icon-wrap artp-info-card__icon-wrap--orange">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <div>
              <span className="artp-info-card__label">Région</span>
              <span className="artp-info-card__val">{artisan.region}</span>
            </div>
          </li>
        )}
        <li className="artp-info-card__item">
          <span className="artp-info-card__icon-wrap artp-info-card__icon-wrap--orange">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          <div>
            <span className="artp-info-card__label">Disponibilité</span>
            <span className="artp-info-card__val">{artisan.availability ?? "Lun - Sam, 9h - 18h"}</span>
          </div>
        </li>
      </ul>

      <div className="artp-info-card__divider" />

      <div className="artp-info-card__stats">
        <div className="artp-info-card__stat">
          <span className="artp-info-card__stat-n">4.6</span>
          <span className="artp-info-card__stat-l">Note</span>
        </div>
        <div className="artp-info-card__stat">
          <span className="artp-info-card__stat-n">{totalProducts}</span>
          <span className="artp-info-card__stat-l">Produits</span>
        </div>
        <div className="artp-info-card__stat">
          <span className="artp-info-card__stat-n">20+</span>
          <span className="artp-info-card__stat-l">Ans</span>
        </div>
      </div>

      <div className="artp-info-card__divider" />

      <div className="artp-info-card__badges">
        {artisan.user.isVerified && (
          <div className="artp-info-card__badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
            </svg>
            <span>Profil vérifié</span>
          </div>
        )}
        {artisan.isApproved && (
          <div className="artp-info-card__badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C9A055" strokeWidth="2">
              <circle cx="12" cy="8" r="4" /><path d="M12 12v10M8 22h8" />
            </svg>
            <span>Artisan certifié</span>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ArtisanProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [artisan, setArtisan]   = useState<ArtisanProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartAdded, setCartAdded] = useState<string[]>([]);
  const [filter, setFilter]     = useState("all");
  const [tab, setTab]           = useState<"creations" | "about">("creations");

  const { ref: statsRef, visible: statsVisible } = useInView(0.3);

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchArtisan = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API}/api/artisans/${id}`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data: ArtisanProfile = await res.json();
        setArtisan(data);
        setProducts(data.products ?? []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArtisan();
  }, [id]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  function toggleWish(id: string) {
    setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);
  }
  function handleCart(id: string) {
    setCartAdded(c => c.includes(id) ? c : [...c, id]);
    const prod = products.find(p => p._id === id);
    if (prod) showSuccessToast(`${prod.title} ajouté au panier`);
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <Loader2 size={36} style={{ animation: "spin 1s linear infinite", opacity: 0.4 }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !artisan) return (
    <div style={{ textAlign: "center", padding: "4rem", opacity: 0.6 }}>
      <Package size={40} style={{ margin: "0 auto 1rem" }} />
      <p style={{ marginBottom: "1rem" }}>{error ?? "Artisan introuvable."}</p>
      <Link href="/Artisans" className="artp-prod-card__cta">← Retour aux artisans</Link>
    </div>
  );

  const categories = Array.from(new Set(products.map(p => p.category)));
  const filtered   = filter === "all" ? products : products.filter(p => p.category === filter);
  const joinDate   = new Date(artisan.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const joinYear   = new Date(artisan.createdAt).getFullYear();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="artp-root">

      {/* HERO */}
      <section className="artp-hero">
        <div className="artp-hero__bg-gradient" />
        <div className="artp-hero__inner">

          <motion.div className="artp-hero__back"
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}>
            <Link href="/Artisans">← Retour</Link>
          </motion.div>

          <motion.div className="artp-hero__profile-row"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>

            {/* Avatar */}
            <div className="artp-hero__avatar-wrap">
              {artisan.user.image
                ? <img src={artisan.user.image} alt={artisan.user.name} className="artp-hero__avatar-img" />
                : <div className="artp-hero__avatar-fallback">{artisan.user.name[0]}</div>}
              {artisan.isApproved && (
                <div className="artp-hero__avatar-badge" title="Artisan vérifié">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="artp-hero__meta">
              <div className="artp-hero__name-row">
                <h1 className="artp-hero__name">{artisan.user.name}</h1>
                {artisan.specialty && (
                  <span className="artp-hero__specialty-pill">{artisan.specialty}</span>
                )}
              </div>
              <div className="artp-hero__sub-row">
                {artisan.region && (
                  <span className="artp-hero__sub-item">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    {artisan.region}
                  </span>
                )}
                <span className="artp-hero__sub-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#f5a623" strokeWidth="0">
                    <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
                  </svg>
                  4.6 (82 avis)
                </span>
                <span className="artp-hero__sub-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Membre depuis {joinDate}
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="artp-hero__ctas">
              <motion.button className="artp-hero__btn-contact"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Contacter
              </motion.button>
              <motion.button className="artp-hero__btn-call"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Appeler
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MAIN LAYOUT */}
      <div className="artp-layout">
        <div className="artp-layout__main">

          {/* Tabs */}
          <div className="artp-tabs">
            {(["creations", "about"] as const).map(t => (
              <motion.button key={t}
                className={`artp-tabs__tab${tab === t ? " artp-tabs__tab--active" : ""}`}
                onClick={() => setTab(t)} whileHover={{ y: -1 }}>
                {{ creations: `Créations (${products.length})`, about: "À propos" }[t]}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* CRÉATIONS */}
            {tab === "creations" && (
              <motion.div key="creations"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.38 }}>
                <div className="artp-filters">
                  {["all", ...categories].map(cat => (
                    <motion.button key={cat}
                      className={`artp-filter-btn${filter === cat ? " artp-filter-btn--active" : ""}`}
                      onClick={() => setFilter(cat)}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                      {cat === "all" ? "Tout voir" : CATEGORY_LABELS[cat] ?? cat}
                    </motion.button>
                  ))}
                </div>

                {filtered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>
                    <Package size={36} style={{ margin: "0 auto 1rem" }} />
                    <p>Aucun produit dans cette catégorie.</p>
                  </div>
                ) : (
                  <div className="artp-prod-grid">
                    <AnimatePresence>
                      {filtered.map((p, i) => (
                        <ProductCard key={p._id} p={p} index={i}
                          wishlist={wishlist} cartAdded={cartAdded}
                          onWishToggle={toggleWish} onCart={handleCart} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* ABOUT */}
            {tab === "about" && (
              <motion.div key="about" className="artp-about"
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.38 }}>
                <div className="artp-about__split">
                  <div className="artp-about__text">
                    <motion.p className="artp-section-eyebrow"
                      variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                      Son histoire
                    </motion.p>
                    <motion.h2 className="artp-about__heading"
                      variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                      Un savoir-faire<br /><em>millénaire</em>
                    </motion.h2>
                    <motion.p className="artp-about__bio"
                      variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                      {artisan.description ?? "Aucune description disponible."}
                    </motion.p>
                    <motion.div className="artp-about__details"
                      variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                      {[
                        ["Région",             artisan.region      ?? "—"],
                        ["Spécialité",         artisan.specialty   ?? "—"],
                        ["Sur Tirjet depuis",  String(joinYear)],
                        ["Statut",             artisan.isApproved ? "Artisan vérifié ✓" : "En attente"],
                      ].map(([k, v]) => (
                        <div key={k} className="artp-about__detail-row">
                          <span className="artp-about__detail-key">{k}</span>
                          <span className="artp-about__detail-val">{v}</span>
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  <motion.div className="artp-about__gallery-col"
                    initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
                    <WorksGallery images={artisan.images} />
                  </motion.div>
                </div>

                <div className="artp-about__stats" ref={statsRef}>
                  {[
                    { n: "5",    lbl: "Générations de savoir" },
                    { n: "40h",  lbl: "Par création" },
                    { n: "100%", lbl: "Fait main" },
                    { n: "4.6 ★", lbl: "Note clients" },
                  ].map(({ n, lbl }, i) => (
                    <motion.div key={lbl} className="artp-about__stat"
                      initial={{ opacity: 0, y: 20 }}
                      animate={statsVisible ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: i * 0.1, duration: 0.65 }}>
                      <span className="artp-about__stat-n">{n}</span>
                      <span className="artp-about__stat-l">{lbl}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <InfoCard artisan={artisan} joinDate={joinDate} totalProducts={products.length} />
      </div>

      {/* CTA Banner */}
      <motion.section className="artp-cta-banner"
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.7 }}>
        <div className="artp-cta-banner__pattern" aria-hidden />
        <p className="artp-cta-banner__eyebrow">Rejoindre Tirjet</p>
        <h2 className="artp-cta-banner__title">Vous êtes artisan ?</h2>
        <p className="artp-cta-banner__sub">
          Partagez votre savoir-faire avec le monde. Rejoignez notre communauté et donnez une vitrine internationale à vos créations.
        </p>
        <motion.div className="artp-cta-banner__btn"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link href="/Rejoigneznous">Rejoindre la communauté →</Link>
        </motion.div>
      </motion.section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}