"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const FILTERS = ["All", "Mountains", "Desert", "Seaside", "Medina", "Forest"];

const FILTER_TO_TAG: Record<string, string> = {
  Mountains: "MOUNTAINS",
  Desert:    "DESERT",
  Seaside:   "SEASIDE",
  Medina:    "MEDINA",
  Forest:    "FOREST",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=80";

/* ─────────────────────────────────────────────
   TYPES  — mirrors MaisonDhote mongoose schema
───────────────────────────────────────────── */
interface Maison {
  _id: string;
  name: string;
  description: string;
  type: "traditionnelle" | "moderne";
  location: string;
  region?: string;
  governorate?: string;
  tag?: string;
  pricePerNight: number;
  currency?: string;
  minNights?: number;
  phone?: string;
  website?: string;
  amenities?: string[];
  images?: string[];
  host?: { _id: string; name: string; email?: string } | null;
  rating: number;
  reviewCount: number;
  isApproved: boolean;
  isSuspended: boolean;
  isEditorsPick?: boolean;
  isFeatured?: boolean;
  views?: number;
  createdAt?: string;
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function normalizeTag(tag?: string): string {
  if (!tag) return "";
  const map: Record<string, string> = {
    MOUNTAINS: "Mountains",
    DESERT:    "Desert",
    SEASIDE:   "Seaside",
    MEDINA:    "Medina",
    FOREST:    "Forest",
  };
  return map[tag.toUpperCase()] ?? tag;
}

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1)  return "Today";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/* ─────────────────────────────────────────────
   STARS
───────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="maisonsdhotes-stars">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          viewBox="0 0 16 16"
          fill={s <= Math.round(rating) ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.2}
          width={13}
          height={13}
        >
          <polygon points="8,1 10,6 15,6 11,9.5 12.5,15 8,11.5 3.5,15 5,9.5 1,6 6,6" />
        </svg>
      ))}
    </span>
  );
}

/* ─────────────────────────────────────────────
   TYPE BADGE
───────────────────────────────────────────── */
function TypeBadge({ type }: { type: Maison["type"] }) {
  return (
    <span className={`mdh-type-badge mdh-type-${type}`}>
      {type === "traditionnelle" ? (
        <>
          <svg viewBox="0 0 16 16" width={11} height={11} fill="currentColor">
            <path d="M8 1L1 6v9h5V9h4v6h5V6z" />
          </svg>
          Traditionnelle
        </>
      ) : (
        <>
          <svg viewBox="0 0 16 16" width={11} height={11} fill="currentColor">
            <rect x="2" y="4" width="12" height="10" rx="1" />
            <path d="M1 5l7-4 7 4" />
          </svg>
          Moderne
        </>
      )}
    </span>
  );
}

/* ─────────────────────────────────────────────
   IMAGE CAROUSEL
   Arrows are absolutely positioned siblings of
   the track inside .maisonsdhotes-card-img-wrap
   (which has overflow:hidden). They stay within
   the container bounds and fade in on card hover.
───────────────────────────────────────────── */
function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const slideTo = useCallback((next: number) => {
    setIdx(next);
    if (trackRef.current) {
      const w = trackRef.current.parentElement?.offsetWidth ?? 300;
      trackRef.current.style.transform = `translateX(-${next * w}px)`;
    }
  }, []);

  const goTo = useCallback(
    (dir: 1 | -1, e: React.MouseEvent) => {
      e.stopPropagation();
      slideTo((idx + dir + images.length) % images.length);
    },
    [idx, images.length, slideTo]
  );

  return (
    <>
      {/* ── Sliding track ── */}
      <div className="maisonsdhotes-carousel-track" ref={trackRef}>
        {images.map((src, i) => (
          <div key={i} className="maisonsdhotes-carousel-slide">
            <img
              src={src}
              alt={`${alt} — photo ${i + 1}`}
              className="maisonsdhotes-card-img"
              loading={i === 0 ? "eager" : "lazy"}
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
              }}
            />
          </div>
        ))}
      </div>

      {/* ── Arrows (only when > 1 image) ── */}
      {images.length > 1 && (
        <>
          <button
            className="mdh-arrow mdh-arrow-prev"
            onClick={(e) => goTo(-1, e)}
            aria-label="Previous photo"
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none"
              stroke="currentColor" strokeWidth={2.5}
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            className="mdh-arrow mdh-arrow-next"
            onClick={(e) => goTo(1, e)}
            aria-label="Next photo"
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none"
              stroke="currentColor" strokeWidth={2.5}
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Dots */}
          <div className="mdh-dots">
            {images.map((_, i) => (
              <button
                key={i}
                className={`mdh-dot${i === idx ? " mdh-dot-active" : ""}`}
                onClick={(e) => { e.stopPropagation(); slideTo(i); }}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>

          {/* Counter */}
          <span className="mdh-img-counter">{idx + 1} / {images.length}</span>
        </>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   HOUSE CARD — all schema fields
───────────────────────────────────────────── */
function HouseCard({ maison }: { maison: Maison }) {
  const [saved, setSaved] = useState(false);

  const images  = maison.images?.length ? maison.images : [FALLBACK_IMAGE];
  const tag     = normalizeTag(maison.tag);
  const nights  = maison.minNights ?? 1;
  const badge   = maison.isEditorsPick
    ? "Editor's Pick"
    : maison.isFeatured ? "Most Loved" : null;
  const listed  = timeAgo(maison.createdAt);

  return (
    <article className="maisonsdhotes-card">

      {/* ── Image column ── */}
      <div className="maisonsdhotes-card-img-wrap">
        <ImageCarousel images={images} alt={maison.name} />

        {/* Wishlist */}
        <button
          className={`maisonsdhotes-save-btn${saved ? " maisonsdhotes-save-btn-active" : ""}`}
          onClick={(e) => { e.stopPropagation(); setSaved(!saved); }}
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        >
          <svg viewBox="0 0 24 24" width={18} height={18}>
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill={saved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.8}
            />
          </svg>
        </button>

        {badge && <span className="maisonsdhotes-badge">{badge}</span>}
        {tag   && <div  className="maisonsdhotes-card-tag">{tag.toUpperCase()}</div>}
      </div>

      {/* ── Info column ── */}
      <div className="maisonsdhotes-card-body">

        {/* Top: name + type badge + price */}
        <div className="maisonsdhotes-card-top">
          <div className="mdh-title-block">
            <div className="mdh-name-row">
              <h3 className="maisonsdhotes-card-name">{maison.name}</h3>
              <TypeBadge type={maison.type} />
            </div>
            <p className="maisonsdhotes-card-loc">
              <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              {[maison.governorate, maison.region, maison.location]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <div className="maisonsdhotes-card-price-block">
            <span className="maisonsdhotes-price-num">
              {(maison.pricePerNight ?? 0).toLocaleString("fr-FR")}
              <span className="mdh-currency"> {maison.currency ?? "TND"}</span>
            </span>
            <span className="maisonsdhotes-price-night">/night</span>
            <span className="mdh-min-nights-pill">
              {nights} night{nights > 1 ? "s" : ""} min.
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="maisonsdhotes-card-desc">{maison.description}</p>

        {/* Amenities */}
        {!!maison.amenities?.length && (
          <div className="maisonsdhotes-amenities">
            {maison.amenities.map((a) => (
              <span key={a} className="maisonsdhotes-amenity">{a}</span>
            ))}
          </div>
        )}

        {/* Contact — phone & website */}
        {(maison.phone || maison.website) && (
          <div className="mdh-contact-row">
            {maison.phone && (
              <a href={`tel:${maison.phone}`} className="mdh-contact-chip">
                <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
                {maison.phone}
              </a>
            )}
            {maison.website && (
              <a
                href={maison.website.startsWith("http") ? maison.website : `https://${maison.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mdh-contact-chip"
              >
                <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
                Website
              </a>
            )}
          </div>
        )}

        {/* Footer: rating + meta */}
        <div className="maisonsdhotes-card-footer">
          <div className="maisonsdhotes-rating-row">
            <Stars rating={maison.rating ?? 0} />
            <span className="maisonsdhotes-rating-num">
              {(maison.rating ?? 0).toFixed(1)}
            </span>
            <span className="maisonsdhotes-rating-count">
              ({maison.reviewCount ?? 0} reviews)
            </span>
          </div>

          <div className="mdh-meta-row">
            {maison.host?.name && (
              <span className="mdh-meta-chip">
                <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
                {maison.host.name}
              </span>
            )}
            {(maison.views ?? 0) > 0 && (
              <span className="mdh-meta-chip">
                <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
                {(maison.views!).toLocaleString()}
              </span>
            )}
            {listed && (
              <span className="mdh-meta-chip">
                <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L11 13V7h1.5v5.25l4.5 2.67-.77 1.08z" />
                </svg>
                {listed}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────
   PAGE  ← default export required by Next.js
───────────────────────────────────────────── */
export default function Page() {
  const [active, setActive]   = useState("All");
  const [search, setSearch]   = useState("");
  const [maisons, setMaisons] = useState<Maison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchMaisons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API}/api/maisons-dhotes?limit=100&approved=true`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMaisons(data.maisons ?? data ?? []);
    } catch (err: any) {
      setError(err.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMaisons(); }, [fetchMaisons]);

  /* Client-side filter */
  const filtered = maisons.filter((m) => {
    if (m.isSuspended || !m.isApproved) return false;
    const matchTag =
      active === "All" ||
      (m.tag ?? "").toUpperCase() === (FILTER_TO_TAG[active] ?? "");
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      (m.location ?? "").toLowerCase().includes(q) ||
      (m.governorate ?? "").toLowerCase().includes(q) ||
      (m.region ?? "").toLowerCase().includes(q);
    return matchTag && matchSearch;
  });

  const avgRating =
    maisons.filter((m) => m.rating > 0).length
      ? (
          maisons
            .filter((m) => m.rating > 0)
            .reduce((sum, m) => sum + m.rating, 0) /
          maisons.filter((m) => m.rating > 0).length
        ).toFixed(1)
      : "4.8";

  return (
    <div className="maisonsdhotes-root">

      {/* ── HERO ── */}
      <header className="maisonsdhotes-hero">
        <div className="maisonsdhotes-hero-pattern" />

        <p className="maisonsdhotes-hero-flag">✦ Maisons d'Hôtes · Authentic Stays</p>

        <h1 className="maisonsdhotes-hero-title">
          Find Your <em>Home</em> in the<br />Heart of Tunisia
        </h1>

        <p className="maisonsdhotes-hero-sub">
          Curated guest houses where every doorway opens to a story. Comfort,
          culture, and genuine Tunisian hospitality await.
        </p>

        <div className="maisonsdhotes-search-wrap">
          <svg className="maisonsdhotes-search-icon" viewBox="0 0 24 24"
            width={17} height={17} fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            className="maisonsdhotes-search-input"
            type="text"
            placeholder="Search by name or region…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="maisonsdhotes-search-btn">
            Search
            <svg viewBox="0 0 24 24" width={14} height={14}
              fill="none" stroke="white" strokeWidth={2.5}>
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="maisonsdhotes-stats-row">
          {[
            [loading ? "—" : `${maisons.length}+`, "Maisons"],
            ["24", "Governorates"],
            [`${avgRating}★`, "Avg Rating"],
            ["98%", "Satisfaction"],
          ].map(([n, l]) => (
            <div className="maisonsdhotes-stat" key={l as string}>
              <div className="maisonsdhotes-stat-num">{n}</div>
              <div className="maisonsdhotes-stat-label">{l}</div>
            </div>
          ))}
        </div>

        <svg className="maisonsdhotes-hero-arc" viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,80 C360,0 1080,0 1440,80 L1440,80 L0,80 Z" />
        </svg>
      </header>

      {/* ── LISTINGS ── */}
      <main>
        <div className="maisonsdhotes-section-header">
          <div>
            <p className="maisonsdhotes-section-kicker">Handpicked for you</p>
            <h2 className="maisonsdhotes-section-title">Featured Maisons d'Hôtes</h2>
          </div>
          <span className="maisonsdhotes-section-count">
            {loading ? "Loading…" : `${filtered.length} properties found`}
          </span>
        </div>

        <div className="maisonsdhotes-filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`maisonsdhotes-filter-btn${active === f ? " maisonsdhotes-filter-btn-active" : ""}`}
              onClick={() => setActive(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="maisonsdhotes-loading">
            <div className="maisonsdhotes-spinner" />
            <p>Loading maisons…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="maisonsdhotes-error">
            <p>⚠ {error}</p>
            <button className="maisonsdhotes-retry-btn" onClick={fetchMaisons}>
              Retry
            </button>
          </div>
        )}

        {/* Cards */}
        {!loading && !error && (
          <div className="maisonsdhotes-list">
            {filtered.length === 0 ? (
              <div className="maisonsdhotes-empty">
                <h3>No maisons found</h3>
                <p>Try adjusting your search or filter.</p>
              </div>
            ) : (
              filtered.map((m) => <HouseCard key={m._id} maison={m} />)
            )}
          </div>
        )}
      </main>

      {/* ── FOOTER BANNER ── */}
      {/* <section className="maisonsdhotes-footer-banner">
        <h2>List Your Maison d'Hôtes</h2>
        <p>
          Join our community of hosts and share your home with travelers seeking
          authentic, meaningful experiences across Tunisia.
        </p>
        <button className="maisonsdhotes-footer-cta">
          Become a Host
          <svg viewBox="0 0 24 24" width={16} height={16}
            fill="none" stroke="white" strokeWidth={2}>
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section> */}
    </div>
  );
}