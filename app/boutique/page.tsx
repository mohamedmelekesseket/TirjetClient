"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Check, Heart, HeartOff, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";

const products = [
  {
    id: 1, cat: "Tissage", mat: "Laine", loc: "Kairouan", numPrice: 1200,
    title: "Tapis Kairouan Horizon",
    desc: "Grand format lumineux tissé en laine naturelle avec tracés libres.",
    price: "290 TND",
    img: "https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 2, cat: "Poterie", mat: "Céramique", loc: "Nabeul", numPrice: 120,
    title: "Vase Nabeul Ruban",
    desc: "Céramique peinte à la main, pensée comme pièce centrale.",
    price: "120 TND",
    img: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 4, cat: "Poterie", mat: "Céramique", loc: "Nabeul", numPrice: 120,
    title: "Vase Nabeul Ruban",
    desc: "Céramique peinte à la main, pensée comme pièce centrale.",
    price: "120 TND",
    img: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 3, cat: "Bijoux", mat: "Argent", loc: "Djerba", numPrice: 290,
    title: "Parure Djerba Atlas",
    desc: "Argent ciselé à la main, silhouette contemporaine.",
    price: "290 TND",
    img: "https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80&w=800",
  },
];

const CATS    = ["Tissage", "Poterie", "Bijoux", "Maison", "Textile"];
const REGIONS = ["Kairouan", "Nabeul", "Djerba", "Sfax", "Tunis", "Sejnane"];
const MATS    = ["Laine", "Argent", "Céramique", "Cuir", "Alfa", "Cuivre"];

const values = [
  { n: "01", t: "Paiement simple et rassurant, sécurisé à chaque étape." },
  { n: "02", t: "Livraison suivie en Tunisie et à l'international." },
  { n: "03", t: "Pièces sourcées directement auprès des artisans." },
  { n: "04", t: "Interface pensée pour mobile et desktop, en toute fluidité." },
];

type FilterGroup = "cat" | "region" | "mat";

export default function Boutique() {
  const [wishlist, setWishlist]   = useState<number[]>([]);
  const [addedIds, setAddedIds]   = useState<number[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    cat:      [] as string[],
    region:   [] as string[],
    mat:      [] as string[],
    minPrice: 0,
    maxPrice: 500,
  });

  /* ── helpers ── */
  const toggleWish = (id: number) =>
    setWishlist((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id]);

  const handleAddToCart = (id: number) => {
    setAddedIds((p) => [...p, id]);
    setTimeout(() => setAddedIds((p) => p.filter((i) => i !== id)), 2000);
  };

  const toggleChip = (group: FilterGroup, val: string) =>
    setFilters((p) => ({
      ...p,
      [group]: p[group].includes(val)
        ? p[group].filter((v) => v !== val)
        : [...p[group], val],
    }));

  const clearAll = () => {
    setFilters({ cat: [], region: [], mat: [], minPrice: 0, maxPrice: 500 });
    setSearchQuery("");
  };

  const activeCount =
    filters.cat.length + filters.region.length + filters.mat.length +
    (filters.minPrice > 0 || filters.maxPrice < 500 ? 1 : 0);

  /* ── filter logic ── */
  const filteredProducts = products.filter((p) => {
    if (filters.cat.length    && !filters.cat.includes(p.cat))    return false;
    if (filters.region.length && !filters.region.includes(p.loc)) return false;
    if (filters.mat.length    && !filters.mat.includes(p.mat))    return false;
    if (p.numPrice < filters.minPrice || p.numPrice > filters.maxPrice) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !p.desc.toLowerCase().includes(q))
        return false;
    }
    return true;
  });

  return (
    <div className="boutique">

      {/* ── HERO ── */}
      <header className="hero">
        <motion.p className="hero-eyebrow"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}>
          Artisanat Tunisien · Collection 2025
        </motion.p>

        <motion.h1 className="hero-title"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}>
          L'art de<br /><em>l'artisan</em>
        </motion.h1>

        <div className="hero-line" />
      </header>

      {/* ── SEARCH + FILTER ── */}
      <motion.div className="search-section"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.55 }}>

        {/* bar */}
        <div className="search-bar-row">
          <div className="search-field">
            <span className="search-icon" aria-hidden="true">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Rechercher une pièce, une région ou une technique…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className={`filter-toggle-btn${panelOpen ? " open" : ""}`}
            onClick={() => setPanelOpen((v) => !v)}
          >
            <span className="filter-icon" aria-hidden="true">
              <SlidersHorizontal size={16} />
            </span>
            Filtres
            {activeCount > 0 && (
              <span className="filter-badge">{activeCount}</span>
            )}
          </button>
        </div>

        {/* collapsible panel */}
        <motion.div
          initial={false}
          animate={{ height: panelOpen ? "auto" : 0, opacity: panelOpen ? 1 : 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as any }}
          style={{ overflow: "hidden" }}
        >
          <div className="filter-panel-inner">

            {/* CATÉGORIE */}
            <div className="filter-group">
              <div className="filter-label">Catégorie</div>
              <div className="chip-list">
                {CATS.map((v) => (
                  <button key={v}
                    className={`chip${filters.cat.includes(v) ? " active" : ""}`}
                    onClick={() => toggleChip("cat", v)}>{v}</button>
                ))}
              </div>
            </div>

            {/* RÉGION */}
            <div className="filter-group">
              <div className="filter-label">Région</div>
              <div className="chip-list">
                {REGIONS.map((v) => (
                  <button key={v}
                    className={`chip${filters.region.includes(v) ? " active" : ""}`}
                    onClick={() => toggleChip("region", v)}>{v}</button>
                ))}
              </div>
            </div>

            {/* MATIÈRE */}
            <div className="filter-group">
              <div className="filter-label">Matière</div>
              <div className="chip-list">
                {MATS.map((v) => (
                  <button key={v}
                    className={`chip${filters.mat.includes(v) ? " active" : ""}`}
                    onClick={() => toggleChip("mat", v)}>{v}</button>
                ))}
              </div>
            </div>

            {/* PRIX */}
            <div className="filter-group">
              <div className="filter-label">Prix (TND)</div>
              <div className="price-range">
                <div className="price-display">
                  <span className="price-val">Min <em>{filters.minPrice.toLocaleString("fr-TN")}</em></span>
                  <span className="price-val">Max <em>{filters.maxPrice.toLocaleString("fr-TN")}</em></span>
                </div>
                <div className="slider-wrap">
                  <div className="slider-track" />
                  <div className="slider-fill" style={{
                    left:  `${(filters.minPrice / 500) * 100}%`,
                    width: `${((filters.maxPrice - filters.minPrice) / 500) * 100}%`,
                  }} />
                  <input type="range" className="price-slider"
                    min={0} max={500} step={50} value={filters.minPrice}
                    onChange={(e) => {
                      const v = Math.min(Number(e.target.value), filters.maxPrice - 50);
                      setFilters((p) => ({ ...p, minPrice: v }));
                    }} />
                  <input type="range" className="price-slider"
                    min={0} max={500} step={50} value={filters.maxPrice}
                    onChange={(e) => {
                      const v = Math.max(Number(e.target.value), filters.minPrice + 50);
                      setFilters((p) => ({ ...p, maxPrice: v }));
                    }} />
                </div>
                <div className="price-minmax-labels">
                  <span>0 TND</span><span>5 000 TND</span>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* active tags */}
        <AnimatePresence>
          {activeCount > 0 && (
            <motion.div className="active-tags-row"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
              {(["cat", "region", "mat"] as FilterGroup[]).flatMap((group) =>
                filters[group].map((val) => (
                  <button key={`${group}-${val}`} className="active-tag"
                    onClick={() => toggleChip(group, val)}>
                    {val}{" "}
                    <span aria-hidden="true">
                      <X size={14} />
                    </span>
                  </button>
                ))
              )}
              {(filters.minPrice > 0 || filters.maxPrice < 500) && (
                <button className="active-tag"
                  onClick={() => setFilters((p) => ({ ...p, minPrice: 0, maxPrice: 500 }))}>
                  {filters.minPrice.toLocaleString("fr-TN")} – {filters.maxPrice.toLocaleString("fr-TN")} TND{" "}
                  <span aria-hidden="true">
                    <X size={14} />
                  </span>
                </button>
              )}
              <button className="clear-all-btn" onClick={clearAll}>Tout effacer</button>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>

      {/* ── MAIN ── */}
      <main className="main-body">
        <motion.div className="section-label"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}>
          <span>Sélection du moment — {filteredProducts.length} pièces</span>
        </motion.div>

        {/* PRODUCT GRID */}
        <div className="product-grid">
          {filteredProducts.map((p, index) => (
            <motion.div key={p.id} className="product-card"
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8 + index * 0.15, ease: [0.16, 1, 0.3, 1] as any }}
              whileHover={{ y: -6 }}>

              {/* IMAGE */}
              <div className="img-wrap">
                <motion.img src={p.img} alt={p.title} loading="lazy"
                  whileHover={{ scale: 1.07 }} transition={{ duration: 1.4 }} />
                <div className="img-overlay" />
                <span className="cat-pill">{p.cat}</span>
                <button className="wish-btn" onClick={() => toggleWish(p.id)}
                  style={{ color: wishlist.includes(p.id) ? "#d4784f" : undefined }}>
                  {wishlist.includes(p.id) ? <Heart size={18} fill="currentColor" /> : <HeartOff size={18} />}
                </button>
              </div>

              {/* BODY */}
              <div className="card-body">
                <div className="card-top">
                  <h3 className="card-title">{p.title}</h3>
                  <span className="card-price">{p.price}</span>
                </div>
                <p className="card-desc">{p.desc}</p>
                <div className="card-footer">
                  <span className="card-loc">{p.loc}</span>
                  <Link href="/produit" className="card-cta">Voir la pièce →</Link>
                </div>
                <motion.button className="card-cart"
                  onClick={() => handleAddToCart(p.id)}
                  initial={{ y: "100%" }} whileHover={{ y: 0 }}
                  transition={{ duration: 0.4 }}
                  style={addedIds.includes(p.id) ? { background: "#3a6b3a" } : undefined}>
                  {addedIds.includes(p.id) ? (
                    <>
                      <Check size={16} style={{ marginRight: 8 }} aria-hidden="true" />
                      Ajouté
                    </>
                  ) : (
                    "Ajouter au panier"
                  )}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* VALUES */}
        <motion.div className="values-wrap"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}>
          <div className="section-label"><span>Nos engagements</span></div>
          <div className="values-grid">
            {values.map((v) => (
              <motion.div key={v.n} className="value-item"
                whileHover={{ backgroundColor: "#1a1410" }}>
                <span className="value-num">{v.n}</span>
                <p className="value-text">{v.t}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}