"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import Image1 from "../images/hero-artisan.jpg";
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

// ─── Categories ───────────────────────────────────────────────────────────────
interface CategoriesSectionProps {
  categories: Category[];
  loading: boolean;
}

function CategoriesSection({ categories, loading }: CategoriesSectionProps) {
  const router = useRouter();

  if (loading) {
    return (
      <section className="pg-artisans">
        <div className="pg-artisans__head">
          <p className="pg-label">Nos Catégories</p>
          <h2 className="pg-h2">Explorer par catégorie</h2>
        </div>
        <div className="pg-artisans__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pg-art-card" style={{ opacity: 0.3 }}>
              <div className="pg-art-card__avatar" style={{ background: "#e2e8f0", borderRadius: "50%" }} />
              <div style={{ height: 14, background: "#e2e8f0", borderRadius: 4, margin: "10px auto 6px", width: "70%" }} />
              <div style={{ height: 11, background: "#e2e8f0", borderRadius: 4, margin: "0 auto", width: "50%" }} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="pg-artisans">
      <motion.div
        className="pg-artisans__head"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <p className="pg-label">Nos Catégories</p>
        <h2 className="pg-h2">Explorer par catégorie</h2>
      </motion.div>

      <div className="pg-artisans__grid">
        {categories.map((cat, i) => (
          <motion.article
            key={cat._id}
            className="pg-art-card"
            variants={fadeUp}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            style={{ cursor: "pointer" }}
            onClick={() => router.push(`/boutique?category=${cat._id}`)}
          >
            <motion.div
              className="pg-art-card__avatar"
              whileHover={{ scale: 1.04, transition: { duration: 0.3 } }}
              style={{ overflow: "hidden", position: "relative" }}
            >
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                style={{
                  display: cat.image ? "none" : "flex",
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#b85d38",
                  fontFamily: "'Playfair Display', serif",
                  position: cat.image ? "absolute" : "relative",
                  inset: 0,
                }}
              >
                {cat.name.charAt(0)}
              </div>
              <div className="pg-art-card__ring" />
            </motion.div>

            <h4 className="pg-art-card__name">{cat.name}</h4>
            <p className="pg-art-card__craft" style={{ fontSize: "11px", color: "#8a7b72" }}>
              {cat.subcategories.length} sous-catégories
            </p>
            {cat.description && (
              <p className="pg-art-card__loc" style={{ fontSize: "9px", marginTop: 4, color: "#aaa", lineHeight: 1.4 }}>
                {cat.description.length > 50 ? cat.description.slice(0, 50) + "…" : cat.description}
              </p>
            )}
          </motion.article>
        ))}
      </div>

      <motion.div
        style={{ textAlign: "center", marginTop: 32 }}
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <Link href="/boutique" className="pg-textlink">
          Voir toutes les catégories →
        </Link>
      </motion.div>
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
    fetch(`${API}/api/products?isHome=true&limit=6`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          const list: Product[] = data.products ?? data.data ?? [];
          const homeProducts = list.filter((p: Product) => p.isHome).slice(0, 6);
          setProducts(homeProducts.length > 0 ? homeProducts : list.slice(0, 6));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Resolves the category name whether the API returns a populated object or a raw ID string
  const getCategoryName = (category: Product["category"]): string => {
    if (!category) return "";
    if (typeof category === "object") return category.name;
    // It's a raw ID string — look it up in the shared categories list
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
          setCategories(data.data.filter((c: Category) => c.isActive).slice(0, 6));
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