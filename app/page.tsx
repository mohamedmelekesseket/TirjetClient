"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import Image1 from "../images/hero-artisan.jpg";
import Image2 from "../images/Untitled.png";
import story from "../images/story.jpg";
import { ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
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
  isApproved: boolean;
  rating?: number;
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
        {/* <div className="pg-hero__stats">
          {[["150+", "Artisans"], ["2 000+", "Créations"], ["24", "Gouvernorats"]].map(([n, l]) => (
            <div key={l} className="pg-hero__stat">
              <span className="pg-hero__stat-n">{n}</span>
              <span className="pg-hero__stat-l">{l}</span>
            </div>
          ))}
        </div> */}
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
          <img src={Image2.src} width={"70px"} height={"70px"} alt="" />
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

// ─── Premium Artisans Carousel ────────────────────────────────────────────────
function PremiumArtisans({ allProducts }: { allProducts: Product[] }) {
  const [artisans, setArtisans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wished, setWished] = useState<Record<string, boolean>>({});
  const carouselRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API}/api/artisans/public`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          const list = Array.isArray(data) ? data : data.artisans ?? [];
          setArtisans(list.filter((a: any) => a.isPremium === true).slice(0, 5));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getProductsForArtisan = (artisan: any): Product[] => {
    const artisanDocId = artisan._id;
    const artisanUserId = artisan.user?._id;
    return allProducts
      .filter((p) => {
        if (!p.artisan) return false;
        const pId = typeof p.artisan === "object" ? p.artisan._id : p.artisan;
        return pId === artisanDocId || pId === artisanUserId;
      })
      .slice(0, 3);
  };

  const scroll = (dir: number) =>
    carouselRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  const toggleWish = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWished((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading)
    return (
      <section className="pg-premium-section">
        <div className="pg-premium__hd">
          <div>
            <div className="pg-premium__title-row">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A055" strokeWidth="1.5">
                <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
              </svg>
              <h2 className="pg-premium__h2">Artisans Premium</h2>
            </div>
            <p className="pg-premium__sub">Ces artisans soutiennent notre plateforme et sont mis en avant</p>
          </div>
        </div>
        <div className="pg-premium__carousel-wrap">
          <div className="pg-premium__carousel">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="pg-artisan-card2" style={{ opacity: 0.3 }}>
                <div className="pg-artisan-card2__top">
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#2a1f10", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, background: "#2a1f10", borderRadius: 4, marginBottom: 8, width: "70%" }} />
                    <div style={{ height: 10, background: "#2a1f10", borderRadius: 4, width: "50%" }} />
                  </div>
                </div>
                <div className="pg-artisan-card2__divider" />
                <div className="pg-artisan-card2__products">
                  {[1, 2, 3].map((j) => (
                    <div key={j} style={{ background: "#1a1208", borderRadius: 8, aspectRatio: "1", height: 90 }} />
                  ))}
                </div>
                <div className="pg-artisan-card2__cta">
                  <div style={{ height: 38, background: "#1a1208", borderRadius: 8 }} />
                </div>
              </div>
            ))}
            <div style={{ minWidth: 80, flexShrink: 0 }} aria-hidden="true" />
          </div>
        </div>
      </section>
    );

  if (artisans.length === 0) return null;

  return (
    <section className="pg-premium-section">
      <div className="pg-premium__hd">
        <div>
          <div className="pg-premium__title-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A055" strokeWidth="1.5">
              <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
            </svg>
            <h2 className="pg-premium__h2">Artisans Premium</h2>
          </div>
          <p className="pg-premium__sub">Ces artisans soutiennent notre plateforme et sont mis en avant</p>
        </div>
        <div className="pg-premium__nav">
          <button className="pg-premium__link" onClick={() => router.push("/Artisans")}>
            Voir tous les artisans
          </button>
        </div>
      </div>

      <div className="pg-premium__carousel-wrap">
        <button
          className="pg-carousel-arrow pg-carousel-arrow--left"
          onClick={() => scroll(-1)}
          aria-label="Précédent"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>

        <div className="pg-premium__carousel" ref={carouselRef}>
          {artisans.map((a) => {
            const name = a.user?.name ?? a.name ?? "Artisan";
            const userId = a.user?._id ?? a._id;
            const photo = a.profilePhoto ?? a.user?.image ?? null;
            const products = getProductsForArtisan(a);

            return (
              <article
                key={a._id}
                className="pg-artisan-card2"
                onClick={() => router.push(`/Artisanprofile/${userId}`)}
              >
                <div className="pg-artisan-card2__top">
                  <span className="pg-premium-badge">PREMIUM</span>

                  <div className="pg-artisan-card2__avatar-wrap">
                    {photo ? (
                      <img src={photo} alt={name} className="pg-artisan-card2__avatar" />
                    ) : (
                      <div className="pg-artisan-card2__avatar-fallback">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="pg-artisan-card2__meta">
                    <h4 className="pg-artisan-card2__name">{name}</h4>
                    {a.specialite && (
                      <p className="pg-artisan-card2__spec">{a.specialite}</p>
                    )}
                    {a.region && (
                      <p className="pg-artisan-card2__loc">
                        <Pin /> {a.region}, Tunisie
                      </p>
                    )}
                    {a.rating != null && (
                      <p className="pg-artisan-card2__rating">
                        ★ {a.rating}{" "}
                        <span>
                          ({a.reviewCount ?? 0})
                          {a.salesCount != null && ` | ${a.salesCount} ventes`}
                        </span>
                      </p>
                    )}
                  </div>

                  <button
                    className={`pg-artisan-card2__wish${wished[a._id] ? " pg-artisan-card2__wish--active" : ""}`}
                    onClick={(e) => toggleWish(a._id, e)}
                    aria-label="Favoris"
                  >
                    {wished[a._id] ? "♥" : "♡"}
                  </button>
                </div>

                <div className="pg-artisan-card2__divider" />

                {products.length > 0 ? (
                  <div className="pg-artisan-card2__products">
                    {products.map((prod) => (
                      <div
                        key={prod._id}
                        className="pg-artisan-prod"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/boutique/${prod._id}`);
                        }}
                      >
                        <div className="pg-artisan-prod__img-wrap">
                          {prod.images?.[0] ? (
                            <img src={prod.images[0]} alt={prod.title} className="pg-artisan-prod__img" />
                          ) : (
                            <div className="pg-artisan-prod__fallback">🏺</div>
                          )}
                          <span className="pg-artisan-prod__price">
                            {prod.price?.toLocaleString("fr-FR")} DT
                          </span>
                        </div>
                        <p className="pg-artisan-prod__name">{prod.title}</p>
                        {prod.rating != null && (
                          <p className="pg-artisan-prod__rating">★ {prod.rating}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pg-artisan-card2__no-products">
                    <p>Aucun produit pour l&apos;instant</p>
                  </div>
                )}

                <div className="pg-artisan-card2__cta">
                  <Link
                    href={`/Artisanprofile/${userId}`}
                    className="pg-artisan-card2__btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ShoppingBag size={15} strokeWidth={2} />
                    Voir la boutique
                  </Link>
                </div>
              </article>
            );
          })}
          <div style={{ minWidth: 80, flexShrink: 0 }} aria-hidden="true" />
        </div>

        <button
          className="pg-carousel-arrow pg-carousel-arrow--right"
          onClick={() => scroll(1)}
          aria-label="Suivant"
        >
          <ChevronRight size={22} strokeWidth={2} />
        </button>
      </div>
    </section>
  );
}

// ─── Premium Products Carousel ────────────────────────────────────────────────

function PremiumProducts({
  allProducts,
  categories,
}: {
  allProducts: Product[];
  categories: Category[];
}) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const products = allProducts.filter((p) => p.isHome === true).slice(0, 8);

  const scroll = (dir: number) =>
    carouselRef.current?.scrollBy({ left: dir * 210, behavior: "smooth" });

  const getCatName = (cat: Product["category"]) =>
    typeof cat === "object" ? cat.name : categories.find((c) => c._id === cat)?.name ?? "";

  const getArtisanName = (a: Product["artisan"]) =>
    !a ? "" : typeof a === "string" ? a : a.name;

  if (products.length === 0) return null;

  return (
    <section className="pg-premium-section">
      <div className="pg-premium__hd">
        <div>
          <div className="pg-premium__title-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A055" strokeWidth="1.5">
              <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
            </svg>
            <h2 className="pg-premium__h2">
              Produits en vedette <em style={{ color: "#C9A055", fontStyle: "normal" }}>Premium</em>
            </h2>
          </div>
          <p className="pg-premium__sub">Les meilleures créations sélectionnées par notre équipe</p>
        </div>
        <div className="pg-premium__nav">
          <button className="pg-premium__link" onClick={() => router.push("/boutique")}>
            Voir tous les produits
          </button>
        </div>
      </div>

      <div className="pg-premium__carousel-wrap">
        <button
          className="pg-carousel-arrow pg-carousel-arrow--left"
          onClick={() => scroll(-1)}
          aria-label="Précédent"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>

        <div className="pg-premium__carousel" ref={carouselRef}>
          {products.map((p) => (
            <article
              key={p._id}
              className="pg-prod-card-h"
              onClick={() => router.push(`/boutique/${p._id}`)}
            >
              <div className="pg-prod-card-h__img-wrap">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.title} className="pg-prod-card-h__img" />
                ) : (
                  <div className="pg-prod-card-h__fallback">🏺</div>
                )}
                <span className="pg-premium-badge-prod">PREMIUM</span>
              </div>
              <div className="pg-prod-card-h__body">
                <h4 className="pg-prod-card-h__name">{p.title}</h4>
                {getArtisanName(p.artisan) && (
                  <p className="pg-prod-card-h__by">Par {getArtisanName(p.artisan)}</p>
                )}
                <div className="pg-prod-card-h__footer">
                  <div>
                    <span className="pg-prod-card-h__price">
                      {p.price.toLocaleString("fr-FR")} DT
                    </span>
                  </div>
                  <button
                    className="pg-cart-btn"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Ajouter au panier"
                  >
                    <ShoppingBag size={18} />
                  </button>
                </div>
              </div>
            </article>
          ))}
          <div style={{ minWidth: 80, flexShrink: 0 }} aria-hidden="true" />
        </div>

        <button
          className="pg-carousel-arrow pg-carousel-arrow--right"
          onClick={() => scroll(1)}
          aria-label="Suivant"
        >
          <ChevronRight size={22} strokeWidth={2} />
        </button>
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
        {/* <div className="pg-story__stats">
          {[["150+", "Artisans"], ["2K+", "Créations"]].map(([n, l]) => (
            <div key={l} className="pg-story__stat">
              <span className="pg-story__stat-n">{n}</span>
              <span className="pg-story__stat-l">{l}</span>
            </div>
          ))}
        </div> */}
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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

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

  // ✅ Single shared fetch — used by PremiumArtisans, PremiumProducts, and Products
useEffect(() => {
  fetch(`${API}/api/products?limit=100`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data) {
        const list: Product[] = data.products ?? data.data ?? [];

        const approved = list.filter((p) => p.isApproved);

        setAllProducts(approved);
      }
    })
    .catch(() => {})
    .finally(() => setProductsLoading(false));
}, []);

  return (
    <main className="pg-main">
      <Hero />
      <CategoriesSection categories={categories} loading={categoriesLoading} />
      <PremiumArtisans allProducts={allProducts} />
      <PremiumProducts allProducts={allProducts} categories={categories} />
      <Values />
      <Story />
      <CTA />
    </main>
  );
}
