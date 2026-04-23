"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import Image1 from "../images/hero-artisan.jpg";
import Image2 from "../images/Untitled.png";
import story from "../images/story.jpg";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  _id: string;
  title: string;
  price: number;
  images: string[];
  category: { _id: string; name: string } | string;
  subcategory?: { name: string; slug: string };
  artisan: { _id: string; name: string; location?: string } | null;
  isHome: boolean;
}

interface Category {
  _id: string;
  name: string;
  image: string;
  description: string;
  slug: string;
  subcategories: { _id: string; name: string; slug: string }[];
  isActive: boolean;
}

// ─── Static Data ──────────────────────────────────────────────────────────────
const values = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    title: "Authentique",
    desc: "Créations 100% faites main par des artisans talentueux amazighs",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Communautaire",
    desc: "Valorisation directe du travail des artisans amazighs",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Équitable",
    desc: "Prix justes et contact direct avec les créateurs",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
      </svg>
    ),
    title: "Ancestrale",
    desc: "Transmission vivante des techniques traditionnelles",
  },
];

// ─── Atoms ────────────────────────────────────────────────────────────────────
function Pin() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.5 }}
    >
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function Ornament() {
  return (
    <svg width="40" height="12" viewBox="0 0 40 12" fill="none" className="pg-ornament">
      <line x1="0" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.4" />
      <circle cx="20" cy="6" r="2.5" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.6" />
      <line x1="26" y1="6" x2="40" y2="6" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.4" />
    </svg>
  );
}

// ─── Motion presets ───────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i?: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i ? i * 0.1 : 0,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i?: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: i ? i * 0.1 : 0,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [in_, setIn] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setIn(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="pg-hero" ref={containerRef}>
      <motion.div className="pg-hero__imgwrap" style={{ y: imgY }}>
        <img src={Image1.src} alt="" aria-hidden className="pg-hero__img" />
      </motion.div>
      <div className="pg-hero__veil" />
      <div className="pg-hero__watermark" aria-hidden>
        ⵜⵉⵔⵊⵜ
      </div>

      <div className={`pg-hero__body${in_ ? " pg-hero__body--in" : ""}`}>
        <p className="pg-label pg-label--amber">
          <Ornament /> Artisanat Amazigh · Collection 2025 <Ornament />
        </p>
        <h1 className="pg-hero__h1">
          L&apos;art de<br />
          <em>l&apos;artisan</em>
        </h1>
        <p className="pg-hero__sub">
          Pièces uniques sourcées directement auprès des maîtres<br />
          artisans de Tunisie. Chaque objet porte une histoire, un territoire.
        </p>
        <div className="pg-hero__ctas">
          <motion.button
            className="pg-btn pg-btn--amber"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/boutique")}
          >
            Explorer la boutique →
          </motion.button>
          <motion.button
            className="pg-btn pg-btn--ghost"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/apropos")}
          >
            Notre histoire
          </motion.button>
        </div>
        <div className="pg-hero__rule" />
        <div className="pg-hero__stats">
          {[["150+", "Artisans"], ["2 000+", "Créations"], ["24", "Gouvernorats"]].map(([n, l]) => (
            <div key={l} className="pg-hero__stat">
              <span className="pg-hero__stat-n">{n}</span>
              <span className="pg-hero__stat-l">{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pg-scroll-cue">
        <span>Défiler</span>
        <div className="pg-scroll-cue__line" />
      </div>
    </section>
  );
}

// ─── Category Icon ────────────────────────────────────────────────────────────
function CategoryIcon({ name }: { name: string }) {
  const n = name.toLowerCase();

  if (n.includes("coffret") || n.includes("cadeau"))
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="#8a5c2e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <rect x="3" y="8" width="18" height="13" rx="1" />
        <path d="M21 8H3V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2z" />
        <path d="M12 5V21" />
        <path d="M8.5 5c0-1.9 3.5-3.5 3.5-3.5s3.5 1.6 3.5 3.5" />
      </svg>
    );

  if (n.includes("vêtement") || n.includes("chaussure") || n.includes("mode") || n.includes("habit"))
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="#8a5c2e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    );

  if (n.includes("maison") || n.includes("décor") || n.includes("intérieur") || n.includes("tapis"))
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="#8a5c2e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );

  if (n.includes("cosmétique") || n.includes("beauté") || n.includes("soin") || n.includes("naturel"))
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="#8a5c2e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M12 2a5 5 0 0 1 5 5c0 3-2 5.5-5 8-3-2.5-5-5-5-8a5 5 0 0 1 5-5z" />
        <path d="M12 15v7" />
        <path d="M9 19h6" />
      </svg>
    );

  if (n.includes("gastronomie") || n.includes("alimentaire") || n.includes("cuisine") || n.includes("trésor"))
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="#8a5c2e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    );

  if (n.includes("bijou") || n.includes("accessoire") || n.includes("joaillerie"))
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="#8a5c2e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    );

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#8a5c2e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────
interface CategoriesSectionProps {
  categories: Category[];
  loading: boolean;
}

function CategoriesSection({ categories, loading }: CategoriesSectionProps) {
  const router = useRouter();

  if (loading) {
    return (
      <section className="tjs">
        <div className="tjs-head">
          <h2 className="tjs-h2">Découvrez nos univers</h2>
        </div>
        <div className="tjs-row1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="tjs-card tjs-card--skeleton">
              <div className="tjs-card__photo tjs-skeleton" />
              <div className="tjs-card__body">
                <div className="tjs-skeleton tjs-skeleton--line" style={{ width: "70%", height: 16, marginBottom: 8 }} />
                <div className="tjs-skeleton tjs-skeleton--line" style={{ width: "55%", height: 11 }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  const row1 = categories.slice(0, 4);
  const row2 = categories.slice(4, 7);

  return (
    <section className="tjs">
      <div className="tjs-head">
        <div className="tjs-icon-top">
          <img src={Image2.src} width={'70px'} height={'70px'} alt="" />
        </div>
        <h2 className="tjs-h2">Découvrez nos univers</h2>
        <p className="tjs-sub">
          Explorez la richesse de la culture amazighe à travers nos catégories
        </p>
        <div className="tjs-divider" />
      </div>

      <div className="tjs-row1">
        {row1.map((cat) => (
          <article
            key={cat._id}
            className="tjs-card"
            onClick={() => router.push(`/boutique/categorie/${cat.slug}`)}
          >
            <div className="tjs-card__photo">
              {cat.image ? (
                <img src={cat.image} alt={cat.name} loading="lazy" />
              ) : (
                <div className="tjs-card__photo-fallback">{cat.name.charAt(0)}</div>
              )}
            </div>
            <div className="tjs-card__body">
              <h4 className="tjs-card__name">{cat.name}</h4>
              {cat.description && (
                <p className="tjs-card__line1">
                  {cat.description.length > 40 ? cat.description.slice(0, 40) + "…" : cat.description}
                </p>
              )}
              {cat.subcategories?.length > 0 && (
                <p className="tjs-card__line2">
                  {cat.subcategories.slice(0, 2).map((s) => s.name).join(", ")}
                  {cat.subcategories.length > 2 ? "…" : ""}
                </p>
              )}
              <span className="tjs-card__arrow">→</span>
            </div>
          </article>
        ))}
      </div>

      {row2.length > 0 && (
        <div className="tjs-row2">
          {row2.map((cat) => (
            <article
              key={cat._id}
              className="tjs-card"
              onClick={() => router.push(`/boutique/categorie/${cat.slug}`)}
            >
              <div className="tjs-card__photo">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} loading="lazy" />
                ) : (
                  <div className="tjs-card__photo-fallback">{cat.name.charAt(0)}</div>
                )}
              </div>
              <div className="tjs-card__body">
                <h4 className="tjs-card__name">{cat.name}</h4>
                {cat.description && (
                  <p className="tjs-card__line1">
                    {cat.description.length > 40 ? cat.description.slice(0, 40) + "…" : cat.description}
                  </p>
                )}
                {cat.subcategories?.length > 0 && (
                  <p className="tjs-card__line2">
                    {cat.subcategories.slice(0, 2).map((s) => s.name).join(", ")}
                    {cat.subcategories.length > 2 ? "…" : ""}
                  </p>
                )}
                <span className="tjs-card__arrow">→</span>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="tjs-cta">
        <Link href="/boutique" className="tjs-btn">
          Voir toutes les catégories →
        </Link>
      </div>
    </section>
  );
}

// ─── Featured Products ────────────────────────────────────────────────────────
interface ProductsProps {
  categories: Category[];
}

function Products({ categories }: ProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API}/api/products?limit=100`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          const list: Product[] = data.products ?? data.data ?? [];
          console.log("total:", list.length);
          console.log("isHome true:", list.filter(p => p.isHome === true).length);
          console.log("isHome false:", list.filter(p => p.isHome === false).length);
          console.log("isHome undefined/null:", list.filter(p => p.isHome == null).length);
          const homeProducts = list.filter((p: Product) => p.isHome === true).slice(0, 6);
          setProducts(homeProducts);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getCategoryName = (category: Product["category"]): string => {
    if (!category) return "";
    if (typeof category === "object") return category.name;
    return categories.find((c) => c._id === category)?.name ?? "";
  };

  const getArtisanName = (artisan: Product["artisan"]): string => {
    if (!artisan) return "";
    if (typeof artisan === "string") return artisan;
    return artisan.name;
  };

  const getArtisanLocation = (artisan: Product["artisan"]): string => {
    if (!artisan || typeof artisan === "string") return "";
    return artisan.location ?? "";
  };

  if (loading) {
    return (
      <section className="pg-products">
        <div className="pg-products__hd">
          <div>
            <p className="pg-label pg-label--amber">Boutique</p>
            <h2 className="pg-h2">Créations en vedette</h2>
          </div>
        </div>
        <div className="pg-products__grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="pg-prod-card" style={{ opacity: 0.3 }}>
              <div className="pg-prod-card__media" style={{ background: "#e2e8f0", height: 320, borderRadius: 16 }} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ✅ If no isHome products exist, render nothing — don't show an empty section
  if (products.length === 0) return null;

  return (
    <section className="pg-products">
      <motion.div
        className="pg-products__hd"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div>
          <p className="pg-label pg-label--amber">Boutique</p>
          <h2 className="pg-h2">Créations en vedette</h2>
        </div>
        <Link href="/boutique" className="pg-textlink">
          Voir tout →
        </Link>
      </motion.div>

      <div className="pg-products__grid">
        {/* ✅ No extra .filter() here — products state already contains only isHome===true items */}
        {products.map((p, i) => (
          <motion.article
            key={p._id}
            className="pg-prod-card"
            variants={scaleIn}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            style={{ cursor: "pointer" }}
            onClick={() => router.push(`/boutique/${p._id}`)}
          >
            <div className="pg-prod-card__media">
              {p.images?.[0] ? (
                <motion.img
                  src={p.images[0]}
                  alt={p.title}
                  className="pg-prod-card__img"
                  whileHover={{ scale: 1.07 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(135deg, #f4ede3, #e8d5c0)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "3rem",
                  }}
                >
                  🏺
                </div>
              )}
              <div className="pg-prod-card__shade" />
              <span className="pg-prod-card__cat">{getCategoryName(p.category)}</span>
              <div className="pg-prod-card__info">
                <h4 className="pg-prod-card__name">{p.title}</h4>
                {getArtisanName(p.artisan) && (
                  <p className="pg-prod-card__shop">{getArtisanName(p.artisan)}</p>
                )}
                <div className="pg-prod-card__foot">
                  {getArtisanLocation(p.artisan) && (
                    <span className="pg-prod-card__loc">
                      <Pin />
                      {getArtisanLocation(p.artisan)}
                    </span>
                  )}
                  <span className="pg-prod-card__price">
                    <strong>{p.price.toLocaleString("fr-FR")}</strong> TND
                  </span>
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

// ─── Values ───────────────────────────────────────────────────────────────────
function Values() {
  return (
    <section className="pg-values">
      <motion.div
        className="pg-values__head"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <p className="pg-label">Nos valeurs</p>
        <h2 className="pg-h2">Ce qui nous guide</h2>
      </motion.div>

      <div className="pg-values__grid">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            className="pg-val-card"
            variants={scaleIn}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
          >
            <motion.span
              className="pg-val-card__icon"
              whileHover={{ rotate: 12, scale: 1.15, transition: { duration: 0.2 } }}
            >
              {v.icon}
            </motion.span>
            <h3 className="pg-val-card__title">{v.title}</h3>
            <p className="pg-val-card__desc">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── Story ────────────────────────────────────────────────────────────────────
function Story() {
  const router = useRouter();
  return (
    <section className="pg-story">
      <motion.div
        className="pg-story__img"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <img src={story.src} alt="Artisane tissant" />
        <div className="pg-story__badge">
          <span className="pg-story__badge-num">24</span>
          <span className="pg-story__badge-lbl">
            Gouvernorats<br />couverts
          </span>
        </div>
      </motion.div>

      <motion.div
        className="pg-story__text"
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="pg-label pg-label--amber">Notre histoire</p>
        <h2 className="pg-h2">
          Préserver un<br />
          <em>héritage millénaire</em>
        </h2>
        <p className="pg-story__para">
          Tirjet est née de la volonté de valoriser l&apos;artisanat amazigh. Nous connectons les
          artisans talentueux de Tunisie avec le monde entier, en leur offrant une vitrine
          numérique pour leurs créations uniques.
        </p>
        <p className="pg-story__para">
          Chaque produit sur notre plateforme raconte une histoire — celle d&apos;un savoir-faire
          transmis de génération en génération, d&apos;une culture riche et vivante.
        </p>
        <div className="pg-story__stats">
          {[["150+", "Artisans"], ["2K+", "Créations"]].map(([n, l]) => (
            <div key={l} className="pg-story__stat">
              <span className="pg-story__stat-n">{n}</span>
              <span className="pg-story__stat-l">{l}</span>
            </div>
          ))}
        </div>
        <motion.button
          className="pg-btn pg-btn--dark"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/apropos")}
        >
          En savoir plus →
        </motion.button>
      </motion.div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
  const router = useRouter();
  return (
    <section className="pg-cta">
      <div className="pg-cta__pattern" aria-hidden />
      <motion.div
        className="pg-cta__inner"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <p className="pg-label pg-label--amber">
          <Ornament /> Rejoignez-nous <Ornament />
        </p>
        <h2 className="pg-cta__h2">
          Vous êtes <em>artisan</em> ?
        </h2>
        <p className="pg-cta__sub">
          Créez votre boutique et partagez vos créations avec le monde entier.
          <br />
          Valorisez votre savoir-faire dès aujourd&apos;hui.
        </p>
        <div className="pg-cta__btns">
          <motion.button
            className="pg-btn pg-btn--amber"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/Rejoigneznous")}
          >
            Créer ma boutique →
          </motion.button>
          <motion.button
            className="pg-btn pg-btn--ghost"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/apropos")}
          >
            En savoir plus
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Page() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.data) {
          setCategories(data.data.filter((c: Category) => c.isActive).slice(0, 7));
        }
      })
      .catch(() => {})
      .finally(() => setCategoriesLoading(false));
  }, []);

  return (
    <main className="pg-main">
      <Hero />
      <CategoriesSection categories={categories} loading={categoriesLoading} />
      <Products categories={categories} />
      <Values />
      <Story />
      <CTA />
    </main>
  );
}