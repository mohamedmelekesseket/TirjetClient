"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

// ─── Types (matching your schemas) ───────────────────────────────────────────
interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: "user" | "vendor" | "admin";
  isVerified: boolean;
  status: "active" | "pending" | "blocked";
  createdAt: string;
}

interface ArtisanProfile {
  _id: string;
  user: User;
  phone?: string;
  region?: string;
  description?: string;
  images: string[];
  isApproved: boolean;
  createdAt: string;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: "margoum" | "fokhar" | "bijoux" | "tissage";
  stock: number;
}

// ─── Demo data (replace with real API fetch) ─────────────────────────────────
const DEMO_ARTISAN: ArtisanProfile = {
  _id: "artisan-001",
  user: {
    _id: "user-001",
    name: "Fatma Ben Amor",
    email: "fatma@tirjet.tn",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
    role: "vendor",
    isVerified: true,
    status: "active",
    createdAt: "2023-06-01T00:00:00.000Z",
  },
  phone: "+216 98 456 789",
  region: "Gafsa",
  description:
    "Fatma tisse depuis l'âge de 12 ans. Formée par sa grand-mère, elle perpétue un savoir-faire familial vieux de plus de cinq générations. Ses margoums mêlent motifs ancestraux et sensibilité contemporaine. Chaque fil est choisi avec soin, chaque motif raconte une histoire du peuple amazigh de Gafsa.",
  images: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=900",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=900",
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=900",
  ],
  isApproved: true,
  createdAt: "2023-06-01T00:00:00.000Z",
};

const DEMO_PRODUCTS: Product[] = [
  {
    _id: "p1", title: "Margoum Gafsa Heritage", description: "Tissage ancestral aux motifs géométriques berbères.",
    price: 850, images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&q=80"],
    category: "margoum", stock: 2,
  },
  {
    _id: "p2", title: "Tapis Berbère Rouge", description: "Laine naturelle teinte à la grenade, motifs de Gafsa.",
    price: 620, images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80"],
    category: "tissage", stock: 1,
  },
  {
    _id: "p3", title: "Coussin Tissé Main", description: "Laine mérinos, motifs traditionnels amazighs.",
    price: 180, images: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&q=80"],
    category: "tissage", stock: 5,
  },
  {
    _id: "p4", title: "Margoum Contemporain", description: "Fusion moderne et tradition, palette naturelle.",
    price: 1100, images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&q=80"],
    category: "margoum", stock: 1,
  },
  {
    _id: "p5", title: "Nappe Brodée Gafsa", description: "Coton naturel, broderie main à l'aiguille d'or.",
    price: 290, images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80"],
    category: "tissage", stock: 3,
  },
  {
    _id: "p6", title: "Kilim Ancestral", description: "Technique kilim, motifs rhombiques berbères.",
    price: 740, images: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&q=80"],
    category: "margoum", stock: 2,
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  margoum: "Margoum", fokhar: "Poterie", bijoux: "Bijoux", tissage: "Tissage",
};

// ─── Motion presets ───────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7 } },
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

// ─── Atoms ────────────────────────────────────────────────────────────────────
function Pin() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ display:"inline", verticalAlign:"middle", marginRight:4 }}>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

// ─── Gallery strip ────────────────────────────────────────────────────────────
function WorksGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="ap-works-gallery">
      <AnimatePresence mode="wait">
        <motion.div className="ap-works-gallery__main"
          key={active}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <img src={images[active]} alt="" />
        </motion.div>
      </AnimatePresence>
      <div className="ap-works-gallery__thumbs">
        {images.map((img, i) => (
          <motion.button key={i}
            className={`ap-works-gallery__thumb${active === i ? " ap-works-gallery__thumb--on" : ""}`}
            onClick={() => setActive(i)}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
            <img src={img} alt="" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ p, index, onWishToggle, wishlist, cartAdded, onCart }:
  { p: Product; index: number; onWishToggle: (id: string) => void;
    wishlist: string[]; cartAdded: string[]; onCart: (id: string) => void }) {
  const isWished = wishlist.includes(p._id);
  const isAdded  = cartAdded.includes(p._id);

  return (
    <motion.article
      className="ap-prod-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.8 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
    >
      {/* Image */}
      <div className="ap-prod-card__media">
        <motion.img
          src={p.images[0]} alt={p.title}
          whileHover={{ scale: 1.07 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="ap-prod-card__shade" />
        <span className="ap-prod-card__cat">{CATEGORY_LABELS[p.category]}</span>

        <motion.button className={`ap-prod-card__wish${isWished ? " ap-prod-card__wish--on" : ""}`}
          onClick={() => onWishToggle(p._id)} whileTap={{ scale: 0.82 }}>
          <HeartIcon filled={isWished} />
        </motion.button>

        {p.stock === 1 && <span className="ap-prod-card__last">Dernière pièce</span>}
      </div>

      {/* Body */}
      <div className="ap-prod-card__body">
        <div className="ap-prod-card__top">
          <h3 className="ap-prod-card__title">{p.title}</h3>
          <span className="ap-prod-card__price">{p.price} TND</span>
        </div>
        <p className="ap-prod-card__desc">{p.description}</p>
        <div className="ap-prod-card__foot">
          <a href={`/boutique/${p._id}`} className="ap-prod-card__cta">Voir la pièce →</a>
          <motion.button
            className={`ap-prod-card__cart${isAdded ? " ap-prod-card__cart--added" : ""}`}
            onClick={() => onCart(p._id)}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}>
            {isAdded ? "✓" : "+"}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ArtisanProfilePage() {
  // Replace DEMO with: const artisan = await fetchArtisan(params.id)
  const artisan  = DEMO_ARTISAN;
  const products = DEMO_PRODUCTS;

  const [wishlist, setWishlist]   = useState<string[]>([]);
  const [cartAdded, setCartAdded] = useState<string[]>([]);
  const [activeFilter, setFilter] = useState<string>("all");
  const [toastVisible, setToast]  = useState(false);
  const [toastProduct, setToastP] = useState("");
  const [tab, setTab]             = useState<"creations" | "about">("creations");

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY   = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const textY  = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  const { ref: prodRef, visible: prodVisible } = useInView(0.05);
  const { ref: statsRef, visible: statsVisible } = useInView(0.3);

  const categories = Array.from(new Set(products.map(p => p.category)));
  const filtered   = activeFilter === "all" ? products : products.filter(p => p.category === activeFilter);
  const joinYear   = new Date(artisan.createdAt).getFullYear();
  const memberYrs  = new Date().getFullYear() - joinYear;

  function toggleWish(id: string) {
    setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);
  }

  function handleCart(id: string) {
    setCartAdded(c => c.includes(id) ? c : [...c, id]);
    const prod = products.find(p => p._id === id);
    if (prod) { setToastP(prod.title); setToast(true); setTimeout(() => setToast(false), 2800); }
  }

  return (
    <div className="ap-root">

      {/* ── Breadcrumb ──────────────────────────────────────────────── */}
      <motion.nav className="ap-breadcrumb"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <a href="/">Accueil</a>
        <span className="ap-breadcrumb__sep">›</span>
        <a href="/artisans">Artisans</a>
        <span className="ap-breadcrumb__sep">›</span>
        <span>{artisan.user.name}</span>
      </motion.nav>

      {/* ══ HERO BANNER ════════════════════════════════════════════════ */}
      <section className="ap-hero" ref={heroRef}>
        {/* Parallax background — first work image */}
        <motion.div className="ap-hero__bg" style={{ y: imgY }}>
          <img src={artisan.images[0]} alt="" />
          <div className="ap-hero__veil" />
        </motion.div>

        {/* Floating content */}
        <motion.div className="ap-hero__body" style={{ y: textY }}>
          <motion.p className="ap-hero__eyebrow"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}>
            Artisan certifié · TIRJET
          </motion.p>

          {/* Avatar */}
          <motion.div className="ap-hero__avatar"
            initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            {artisan.user.image
              ? <img src={artisan.user.image} alt={artisan.user.name} />
              : <span>{artisan.user.name[0]}</span>}
            <div className="ap-hero__avatar-ring" />
          </motion.div>

          <motion.h1 className="ap-hero__name"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.7 }}>
            {artisan.user.name}
          </motion.h1>

          <motion.p className="ap-hero__role"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36, duration: 0.6 }}>
            Tisseuse de Margoum
          </motion.p>

          {artisan.region && (
            <motion.p className="ap-hero__loc"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.44, duration: 0.6 }}>
              <Pin />{artisan.region}, Tunisie
            </motion.p>
          )}

          {/* Quick stats */}
          <motion.div className="ap-hero__stats"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52, duration: 0.65 }}>
            <div className="ap-hero__stat">
              <span className="ap-hero__stat-n">{products.length}</span>
              <span className="ap-hero__stat-l">Créations</span>
            </div>
            <div className="ap-hero__stat-sep" />
            <div className="ap-hero__stat">
              <span className="ap-hero__stat-n">{memberYrs || 1}+</span>
              <span className="ap-hero__stat-l">Ans sur Tirjet</span>
            </div>
            <div className="ap-hero__stat-sep" />
            <div className="ap-hero__stat">
              <span className="ap-hero__stat-n">4.9</span>
              <span className="ap-hero__stat-l">Note moyenne</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <div className="ap-scroll-cue">
          <span>Défiler</span>
          <div className="ap-scroll-cue__line" />
        </div>
      </section>

      {/* ══ CONTENT BELOW HERO ════════════════════════════════════════ */}
      <div className="ap-content">

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <div className="ap-tabs">
          {(["creations", "about"] as const).map(t => (
            <motion.button key={t}
              className={`ap-tabs__tab${tab === t ? " ap-tabs__tab--active" : ""}`}
              onClick={() => setTab(t)}
              whileHover={{ y: -1 }}>
              {{ creations: `Créations (${products.length})`, about: "À propos" }[t]}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ══ CRÉATIONS TAB ═══════════════════════════════════════ */}
          {tab === "creations" && (
            <motion.div key="creations"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}>

              {/* Filter pills */}
              <div className="ap-filters">
                <motion.button
                  className={`ap-filter-btn${activeFilter === "all" ? " ap-filter-btn--active" : ""}`}
                  onClick={() => setFilter("all")}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  Tout voir
                </motion.button>
                {categories.map(cat => (
                  <motion.button key={cat}
                    className={`ap-filter-btn${activeFilter === cat ? " ap-filter-btn--active" : ""}`}
                    onClick={() => setFilter(cat)}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    {CATEGORY_LABELS[cat]}
                  </motion.button>
                ))}
              </div>

              {/* Grid */}
              <div className="ap-prod-grid" ref={prodRef}>
                <AnimatePresence>
                  {filtered.map((p, i) => (
                    <ProductCard key={p._id} p={p} index={i}
                      wishlist={wishlist} cartAdded={cartAdded}
                      onWishToggle={toggleWish} onCart={handleCart} />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ══ ABOUT TAB ═══════════════════════════════════════════ */}
          {tab === "about" && (
            <motion.div key="about" className="ap-about"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}>

              {/* Split: bio + gallery */}
              <div className="ap-about__split">
                <div className="ap-about__text">
                  <motion.p className="ap-section-eyebrow"
                    variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    Son histoire
                  </motion.p>
                  <motion.h2 className="ap-about__heading"
                    variants={fadeUp} custom={1} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    Un savoir-faire<br /><em>millénaire</em>
                  </motion.h2>
                  <motion.p className="ap-about__bio"
                    variants={fadeUp} custom={2} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    {artisan.description}
                  </motion.p>

                  {/* Details */}
                  <motion.div className="ap-about__details"
                    variants={fadeUp} custom={3} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    {[
                      ["Région", artisan.region ?? "—"],
                      ["Spécialité", "Tissage Margoum"],
                      ["Sur Tirjet depuis", String(joinYear)],
                      ["Statut", artisan.isApproved ? "Artisan vérifié ✓" : "En attente"],
                    ].map(([k, v]) => (
                      <div key={k} className="ap-about__detail-row">
                        <span className="ap-about__detail-key">{k}</span>
                        <span className="ap-about__detail-val">{v}</span>
                      </div>
                    ))}
                  </motion.div>
                </div>

                {/* Gallery */}
                <motion.div className="ap-about__gallery-col"
                  initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}>
                  <WorksGallery images={artisan.images} />
                </motion.div>
              </div>

              {/* Stats */}
              <div className="ap-about__stats" ref={statsRef}>
                {[
                  { n: "5", lbl: "Générations de savoir" },
                  { n: "40h", lbl: "Par création" },
                  { n: "100%", lbl: "Fait main" },
                  { n: "4.9 ★", lbl: "Note clients" },
                ].map(({ n, lbl }, i) => (
                  <motion.div key={lbl} className="ap-about__stat"
                    initial={{ opacity: 0, y: 20 }}
                    animate={statsVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: i * 0.1, duration: 0.65 }}>
                    <span className="ap-about__stat-n">{n}</span>
                    <span className="ap-about__stat-l">{lbl}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ══ CTA BANNER ══════════════════════════════════════════════ */}
      <motion.section className="ap-cta-banner"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}>
        <div className="ap-cta-banner__pattern" aria-hidden />
        <p className="ap-cta-banner__eyebrow">Rejoindre Tirjet</p>
        <h2 className="ap-cta-banner__title">Vous êtes artisan ?</h2>
        <p className="ap-cta-banner__sub">
          Partagez votre savoir-faire avec le monde. Rejoignez notre communauté
          et donnez une vitrine internationale à vos créations.
        </p>
        <motion.a href="/register" className="ap-cta-banner__btn"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          Rejoindre la communauté →
        </motion.a>
      </motion.section>

      {/* ── Toast ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toastVisible && (
          <motion.div className="ap-toast"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <span className="ap-toast__icon">✓</span>
            <div>
              <strong>{toastProduct}</strong>
              <span>ajouté au panier</span>
            </div>
            <a href="/cart" className="ap-toast__link">Voir →</a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}