"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Check, Heart, HeartOff, Search, SlidersHorizontal, X, Loader2, Package } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CATS    = ["fokhar", "margoum", "tissage", "bijoux", "Bois", "Métal"];
const REGIONS = ["Kairouan", "Nabeul", "Djerba", "Sfax", "Tunis", "Sejnane"];
const MATS    = ["Laine", "Argent", "Céramique", "Cuir", "Alfa", "Cuivre"];

const values = [
  { n: "01", t: "Paiement simple et rassurant, sécurisé à chaque étape." },
  { n: "02", t: "Livraison suivie en Tunisie et à l'international." },
  { n: "03", t: "Pièces sourcées directement auprès des artisans." },
  { n: "04", t: "Interface pensée pour mobile et desktop, en toute fluidité." },
];

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  location?: string;
  material?: string;
  isApproved: boolean;
}

type FilterGroup = "cat" | "region" | "mat";

export default function Boutique() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [wishlist, setWishlist]   = useState<string[]>([]);
  const [addedIds, setAddedIds]   = useState<string[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    cat:      [] as string[],
    region:   [] as string[],
    mat:      [] as string[],
    minPrice: 0,
    maxPrice: 5000,
  });

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API}/api/products`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        // handle { products: [] } or [] directly
        const list: Product[] = Array.isArray(data)
          ? data
          : data.products ?? data.data ?? [];
        // only show approved products with stock
        setProducts(list.filter(p => p.isApproved && p.stock > 0));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggleWish = (id: string) =>
    setWishlist(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);

  const handleAddToCart = (id: string) => {
    setAddedIds(p => [...p, id]);
    setTimeout(() => setAddedIds(p => p.filter(i => i !== id)), 2000);
  };

  const toggleChip = (group: FilterGroup, val: string) =>
    setFilters(p => ({
      ...p,
      [group]: p[group].includes(val)
        ? p[group].filter(v => v !== val)
        : [...p[group], val],
    }));

  const clearAll = () => {
    setFilters({ cat: [], region: [], mat: [], minPrice: 0, maxPrice: 5000 });
    setSearchQuery("");
  };

  const activeCount =
    filters.cat.length + filters.region.length + filters.mat.length +
    (filters.minPrice > 0 || filters.maxPrice < 5000 ? 1 : 0);

  // ── Client-side filter ───────────────────────────────────────────────────
  const filteredProducts = products.filter(p => {
    if (filters.cat.length    && !filters.cat.includes(p.category))       return false;
    if (filters.region.length && !filters.region.includes(p.location ?? "")) return false;
    if (filters.mat.length    && !filters.mat.includes(p.material ?? ""))    return false;
    if (p.price < filters.minPrice || p.price > filters.maxPrice)         return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !p.title.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="boutique">

      {/* HERO */}
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

      {/* SEARCH + FILTER */}
      <motion.div className="search-section"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.55 }}>

        <div className="search-bar-row">
          <div className="search-field">
            <span className="search-icon" aria-hidden="true"><Search size={16} /></span>
            <input
              type="text"
              placeholder="Rechercher une pièce, une région ou une technique…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className={`filter-toggle-btn${panelOpen ? " open" : ""}`}
            onClick={() => setPanelOpen(v => !v)}
          >
            <span className="filter-icon" aria-hidden="true"><SlidersHorizontal size={16} /></span>
            Filtres
            {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
          </button>
        </div>

        {/* Collapsible filter panel */}
        <motion.div
          initial={false}
          animate={{ height: panelOpen ? "auto" : 0, opacity: panelOpen ? 1 : 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as any }}
          style={{ overflow: "hidden" }}
        >
          <div className="filter-panel-inner">

            <div className="filter-group">
              <div className="filter-label">Catégorie</div>
              <div className="chip-list">
                {CATS.map(v => (
                  <button key={v}
                    className={`chip${filters.cat.includes(v) ? " active" : ""}`}
                    onClick={() => toggleChip("cat", v)}>{v}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-label">Région</div>
              <div className="chip-list">
                {REGIONS.map(v => (
                  <button key={v}
                    className={`chip${filters.region.includes(v) ? " active" : ""}`}
                    onClick={() => toggleChip("region", v)}>{v}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-label">Matière</div>
              <div className="chip-list">
                {MATS.map(v => (
                  <button key={v}
                    className={`chip${filters.mat.includes(v) ? " active" : ""}`}
                    onClick={() => toggleChip("mat", v)}>{v}
                  </button>
                ))}
              </div>
            </div>

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
                    left:  `${(filters.minPrice / 5000) * 100}%`,
                    width: `${((filters.maxPrice - filters.minPrice) / 5000) * 100}%`,
                  }} />
                  <input type="range" className="price-slider"
                    min={0} max={5000} step={50} value={filters.minPrice}
                    onChange={e => {
                      const v = Math.min(Number(e.target.value), filters.maxPrice - 50);
                      setFilters(p => ({ ...p, minPrice: v }));
                    }} />
                  <input type="range" className="price-slider"
                    min={0} max={5000} step={50} value={filters.maxPrice}
                    onChange={e => {
                      const v = Math.max(Number(e.target.value), filters.minPrice + 50);
                      setFilters(p => ({ ...p, maxPrice: v }));
                    }} />
                </div>
                <div className="price-minmax-labels">
                  <span>0 TND</span><span>5 000 TND</span>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Active filter tags */}
        <AnimatePresence>
          {activeCount > 0 && (
            <motion.div className="active-tags-row"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
              {(["cat", "region", "mat"] as FilterGroup[]).flatMap(group =>
                filters[group].map(val => (
                  <button key={`${group}-${val}`} className="active-tag"
                    onClick={() => toggleChip(group, val)}>
                    {val} <span aria-hidden="true"><X size={14} /></span>
                  </button>
                ))
              )}
              {(filters.minPrice > 0 || filters.maxPrice < 5000) && (
                <button className="active-tag"
                  onClick={() => setFilters(p => ({ ...p, minPrice: 0, maxPrice: 5000 }))}>
                  {filters.minPrice.toLocaleString("fr-TN")} – {filters.maxPrice.toLocaleString("fr-TN")} TND{" "}
                  <span aria-hidden="true"><X size={14} /></span>
                </button>
              )}
              <button className="clear-all-btn" onClick={clearAll}>Tout effacer</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* MAIN */}
      <main className="main-body">
        <motion.div className="section-label"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}>
          <span>
            {loading
              ? "Chargement…"
              : `Sélection du moment — ${filteredProducts.length} pièce${filteredProducts.length !== 1 ? "s" : ""}`
            }
          </span>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite", opacity: 0.5 }} />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: "center", padding: "3rem", opacity: 0.7 }}>
            <p style={{ marginBottom: "1rem" }}>{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Réessayer
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem", opacity: 0.5 }}>
            <Package size={40} style={{ margin: "0 auto 1rem" }} />
            <p>Aucun produit trouvé.</p>
            {activeCount > 0 && (
              <button className="clear-all-btn" style={{ marginTop: "1rem" }} onClick={clearAll}>
                Effacer les filtres
              </button>
            )}
          </div>
        )}

        {/* Product grid */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="product-grid">
            {filteredProducts.map((p, index) => (
              <motion.div key={p._id} className="product-card"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.8 + index * 0.1, ease: [0.16, 1, 0.3, 1] as any }}
                whileHover={{ y: -6 }}>

                {/* Image */}
                <div className="img-wrap">
                  {p.images?.[0] ? (
                    <motion.img
                      src={p.images[0]}
                      alt={p.title}
                      loading="lazy"
                      whileHover={{ scale: 1.07 }}
                      transition={{ duration: 1.4 }}
                    />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "#f0ebe3", opacity: 0.6,
                    }}>
                      <Package size={36} />
                    </div>
                  )}
                  <div className="img-overlay" />
                  <span className="cat-pill">{p.category}</span>
                  <button className="wish-btn" onClick={() => toggleWish(p._id)}
                    style={{ color: wishlist.includes(p._id) ? "#d4784f" : undefined }}>
                    {wishlist.includes(p._id)
                      ? <Heart size={18} fill="currentColor" />
                      : <HeartOff size={18} />}
                  </button>
                </div>

                {/* Body */}
                <div className="card-body">
                  <div className="card-top">
                    <h3 className="card-title">{p.title}</h3>
                    <span className="card-price">{p.price.toLocaleString("fr-TN")} TND</span>
                  </div>
                  <p className="card-desc">{p.description}</p>
                  <div className="card-footer">
                    <span className="card-loc">{p.location ?? p.category}</span>
                    <Link href={`/boutique/${p._id}`} className="card-cta">Voir la pièce →</Link>
                  </div>
                  <motion.button className="card-cart"
                    onClick={() => handleAddToCart(p._id)}
                    initial={{ y: "100%" }} whileHover={{ y: 0 }}
                    transition={{ duration: 0.4 }}
                    style={addedIds.includes(p._id) ? { background: "#3a6b3a" } : undefined}>
                    {addedIds.includes(p._id) ? (
                      <><Check size={16} style={{ marginRight: 8 }} aria-hidden="true" />Ajouté</>
                    ) : (
                      "Ajouter au panier"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Values */}
        <motion.div className="values-wrap"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}>
          <div className="section-label"><span>Nos engagements</span></div>
          <div className="values-grid">
            {values.map(v => (
              <motion.div key={v.n} className="value-item"
                whileHover={{ backgroundColor: "#1a1410" }}>
                <span className="value-num">{v.n}</span>
                <p className="value-text">{v.t}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}