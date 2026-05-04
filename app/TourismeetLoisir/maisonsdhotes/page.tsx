"use client";

import React, { useState } from "react";

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */
const FILTERS = ["All", "Mountains", "Desert", "Seaside", "Medina", "Forest"];

const HOUSES = [
  {
    id: 1,
    name: "Dar Ain Draham",
    location: "Aïn Draham, Jendouba",
    tag: "Forest",
    price: 265,
    rating: 4.9,
    reviews: 124,
    nights: "2 nights min.",
    description:
      "A rustic retreat nestled in Tunisia's lush cork-oak forests, offering sweeping hillside views and genuine Amazigh hospitality in the green north.",
    amenities: ["Private Terrace", "Hammam", "Breakfast Included", "Wifi"],
    img: "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80",
    badge: "Editor's Pick",
  },
  {
    id: 2,
    name: "Maison Douz",
    location: "Douz, Kébili",
    tag: "Desert",
    price: 340,
    rating: 4.8,
    reviews: 89,
    nights: "1 night min.",
    description:
      "Sleep under a blanket of Saharan stars at the gateway to the Great Erg. Wake up to sunrise over golden dunes stretching toward the horizon.",
    amenities: ["Camel Trek", "Rooftop Dining", "Desert Camp", "Wifi"],
    img: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
    badge: "Most Loved",
  },
  {
    id: 3,
    name: "Riad Médina",
    location: "Médina de Tunis, Tunis",
    tag: "Medina",
    price: 295,
    rating: 4.7,
    reviews: 212,
    nights: "2 nights min.",
    description:
      "Behind an unassuming door lies a timeless riad adorned with hand-cut zellige, carved stucco, and a courtyard fountain in the UNESCO-listed old city.",
    amenities: ["Rooftop Pool", "Hammam", "Cooking Class", "Wifi"],
    img: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=80",
    badge: null,
  },
  {
    id: 4,
    name: "Dar Jugurtha",
    location: "Plateau de Jugurtha, Le Kef",
    tag: "Mountains",
    price: 215,
    rating: 4.9,
    reviews: 67,
    nights: "3 nights min.",
    description:
      "A stone house perched atop Tunisia's dramatic tabletop mountain at 1,271m. Hike ancient trails, breathe crisp mountain air, and share couscous by the fireplace.",
    amenities: ["Hiking Guides", "Fireplace", "Farm-to-Table", "Garden"],
    img: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
    badge: "New",
  },
  {
    id: 5,
    name: "Dar Kairouan",
    location: "Médina, Kairouan",
    tag: "Medina",
    price: 250,
    rating: 4.6,
    reviews: 153,
    nights: "1 night min.",
    description:
      "Whitewashed walls, jasmine-scented alleys, and a rooftop overlooking the minarets of Islam's fourth holiest city. Pure medina tranquility.",
    amenities: ["Rooftop Terrace", "City Views", "Breakfast", "Wifi"],
    img: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80",
    badge: null,
  },
  {
    id: 6,
    name: "Dar Sidi Bou Saïd",
    location: "Sidi Bou Saïd, Tunis",
    tag: "Seaside",
    price: 370,
    rating: 4.8,
    reviews: 98,
    nights: "2 nights min.",
    description:
      "Blue-and-white Andalusian architecture, sea breezes, and panoramic views of the Gulf of Tunis — sip mint tea on the terrace at golden hour.",
    amenities: ["Sea Views", "Beach Access", "Artisan Tours", "Wifi"],
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    badge: "Trending",
  },
];

/* ─────────────────────────────────────────────
   STAR COMPONENT
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
   CARD COMPONENT — horizontal layout
───────────────────────────────────────────── */
function HouseCard({ house }: { house: (typeof HOUSES)[0] }) {
  const [saved, setSaved] = useState(false);

  return (
    <article className="maisonsdhotes-card">
      {/* ── Image (left) ── */}
      <div className="maisonsdhotes-card-img-wrap">
        <img src={house.img} alt={house.name} className="maisonsdhotes-card-img" />

        <button
          className={`maisonsdhotes-save-btn ${saved ? "maisonsdhotes-save-btn-active" : ""}`}
          onClick={() => setSaved(!saved)}
          aria-label="Save"
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

        {house.badge && (
          <span className="maisonsdhotes-badge">{house.badge}</span>
        )}

        <div className="maisonsdhotes-card-tag">{house.tag}</div>
      </div>

      {/* ── Info (right) ── */}
      <div className="maisonsdhotes-card-body">
        {/* Top: name + price */}
        <div className="maisonsdhotes-card-top">
          <div>
            <h3 className="maisonsdhotes-card-name">{house.name}</h3>
            <p className="maisonsdhotes-card-loc">
              <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              {house.location}
            </p>
          </div>

          <div className="maisonsdhotes-card-price-block">
            <span className="maisonsdhotes-price-num">{house.price} TND</span>
            <span className="maisonsdhotes-price-night">/night</span>
          </div>
        </div>

        {/* Description */}
        <p className="maisonsdhotes-card-desc">{house.description}</p>

        {/* Amenities */}
        <div className="maisonsdhotes-amenities">
          {house.amenities.map((a) => (
            <span key={a} className="maisonsdhotes-amenity">
              {a}
            </span>
          ))}
        </div>

        {/* Footer: rating + book */}
        <div className="maisonsdhotes-card-footer">
          <div className="maisonsdhotes-rating-row">
            <Stars rating={house.rating} />
            <span className="maisonsdhotes-rating-num">{house.rating}</span>
            <span className="maisonsdhotes-rating-count">({house.reviews} reviews)</span>
            <span className="maisonsdhotes-min-nights"> · {house.nights}</span>
          </div>

          <button className="maisonsdhotes-book-btn">
            Discover & Book
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
export default function Page() {
  const [active, setActive] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = HOUSES.filter((h) => {
    const matchTag = active === "All" || h.tag === active;
    const matchSearch =
      search === "" ||
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.location.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

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
          <svg
            className="maisonsdhotes-search-icon"
            viewBox="0 0 24 24"
            width={17}
            height={17}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
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
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="white" strokeWidth={2.5}>
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="maisonsdhotes-stats-row">
          {[["120+", "Maisons"], ["24", "Governorates"], ["4.8★", "Avg Rating"], ["98%", "Satisfaction"]].map(
            ([n, l]) => (
              <div className="maisonsdhotes-stat" key={l}>
                <div className="maisonsdhotes-stat-num">{n}</div>
                <div className="maisonsdhotes-stat-label">{l}</div>
              </div>
            )
          )}
        </div>

        {/* Bottom arc */}
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
          <span className="maisonsdhotes-section-count">{filtered.length} properties found</span>
        </div>

        <div className="maisonsdhotes-filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`maisonsdhotes-filter-btn ${active === f ? "maisonsdhotes-filter-btn-active" : ""}`}
              onClick={() => setActive(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="maisonsdhotes-list">
          {filtered.length === 0 ? (
            <div className="maisonsdhotes-empty">
              <h3>No maisons found</h3>
              <p>Try adjusting your search or filter.</p>
            </div>
          ) : (
            filtered.map((h) => <HouseCard key={h.id} house={h} />)
          )}
        </div>
      </main>

      {/* ── FOOTER BANNER ── */}
      <section className="maisonsdhotes-footer-banner">
        <h2>List Your Maison d'Hôtes</h2>
        <p>
          Join our community of hosts and share your home with travelers seeking
          authentic, meaningful experiences across Tunisia.
        </p>
        <button className="maisonsdhotes-footer-cta">
          Become a Host
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="white" strokeWidth={2}>
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>
    </div>
  );
}