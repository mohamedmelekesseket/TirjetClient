"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { Check, Heart, HeartOff, Search, SlidersHorizontal, X, Loader2, Package } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const REGIONS = ["Kairouan", "Nabeul", "Djerba", "Sfax", "Tunis", "Sejnane"];
const MATS    = ["Laine", "Argent", "Céramique", "Cuir", "Alfa", "Cuivre"];

const values = [
  { n: "01", t: "Paiement simple et rassurant, sécurisé à chaque étape." },
  { n: "02", t: "Livraison suivie en Tunisie et à l'international." },
  { n: "03", t: "Pièces sourcées directement auprès des artisans." },
  { n: "04", t: "Interface pensée pour mobile et desktop, en toute fluidité." },
];

interface Category {
  _id: string;
  name: string;
  isActive: boolean;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  // May come back as a populated object or a raw ID string
  category: { _id: string; name: string } | string;
  stock: number;
  location?: string;
  material?: string;
  isApproved: boolean;
}

type FilterGroup = "cat" | "region" | "mat";

export default function Boutique() {
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const [products, setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [wishlist, setWishlist]   = useState<string[]>([]);
  const [wishPending, setWishPending] = useState<string[]>([]);

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

  // ── Resolve category name from either a populated object or a raw ID ────────
  const getCategoryName = useCallback((category: Product["category"]): string => {
    if (!category) return "";
    if (typeof category === "object") return category.name;
    // Raw ID — look it up in the fetched categories list
    return categories.find(c => c._id === category)?.name ?? "";
  }, [categories]);

  // ── Resolve category ID for consistent filter matching ──────────────────────
  const getCategoryId = (category: Product["category"]): string => {
    if (!category) return "";
    if (typeof category === "object") return category._id;
    return category;
  };

  // ── Fetch categories ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.data) setCategories(data.data.filter((c: Category) => c.isActive));
        else if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  // ── Fetch products ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API}/api/products`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();
        const list: Product[] = Array.isArray(data)
          ? data
          : data.products ?? data.data ?? [];
        setProducts(list.filter(p => p.isApproved && p.stock > 0));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // ── Fetch favourite IDs ───────────────────────────────────────────────────
  useEffect(() => {
    if (!apiToken) return;
    const fetchIds = async () => {
      try {
        const res = await fetch(`${API}/api/favourites/ids`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setWishlist(data.ids ?? []);
      } catch {}
    };
    fetchIds();
  }, [apiToken]);

  // ── Toggle wishlist (optimistic) ──────────────────────────────────────────
  const toggleWish = useCallback(async (id: string) => {
    if (!apiToken) return;
    if (wishPending.includes(id)) return;

    const isInWish = wishlist.includes(id);

    setWishlist(prev =>
      isInWish ? prev.filter(i => i !== id) : [...prev, id]
    );
    setWishPending(prev => [...prev, id]);

    try {
      const res = await fetch(`${API}/api/favourites/${id}`, {
        method: isInWish ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (!res.ok) throw new Error();
    } catch {
      setWishlist(prev =>
        isInWish ? [...prev, id] : prev.filter(i => i !== id)
      );
    } finally {
      setWishPending(prev => prev.filter(i => i !== id));
    }
  }, [apiToken, wishlist, wishPending]);

  // ── Add to cart ───────────────────────────────────────────────────────────
  const handleAddToCart = (id: string) => {
    setAddedIds(p => [...p, id]);
    setTimeout(() => setAddedIds(p => p.filter(i => i !== id)), 2000);
  };

  // ── Filter helpers ────────────────────────────────────────────────────────
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

  // Filter by category ID so it works regardless of populated vs raw
  const filteredProducts = products.filter(p => {
    if (filters.cat.length && !filters.cat.includes(getCategoryId(p.category))) return false;
    if (filters.region.length && !filters.region.includes(p.location ?? ""))   return false;
    if (filters.mat.length    && !filters.mat.includes(p.material ?? ""))      return false;
    if (p.price < filters.minPrice || p.price > filters.maxPrice)              return false;
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
    <div className="boutique__page">

      {/* HERO */}
      <header className="boutique__hero">
        <motion.p className="boutique__hero-eyebrow"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}>
          Artisanat Tunisien · Collection 2025
        </motion.p>
        <motion.h1 className="boutique__hero-title"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}>
          L'art de<br /><em>l'artisan</em>
        </motion.h1>
        <div className="boutique__hero-line" />
      </header>

      {/* SEARCH + FILTER */}
      <motion.div className="boutique__search"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.55 }}>

        <div className="boutique__search-row">
          <div className="boutique__search-field">
            <span className="boutique__search-icon" aria-hidden="true"><Search size={16} /></span>
            <input
              type="text"
              placeholder="Rechercher une pièce, une région ou une technique…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className={`boutique__filter-btn${panelOpen ? " boutique__filter-btn--open" : ""}`}
            onClick={() => setPanelOpen(v => !v)}
          >
            <span aria-hidden="true"><SlidersHorizontal size={16} /></span>
            Filtres
            {activeCount > 0 && <span className="boutique__filter-badge">{activeCount}</span>}
          </button>
        </div>

        {/* Collapsible filter panel */}
        <motion.div
          initial={false}
          animate={{ height: panelOpen ? "auto" : 0, opacity: panelOpen ? 1 : 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] as any }}
          style={{ overflow: "hidden" }}
        >
          <div className="boutique__filter-panel">

            {/* Category chips — dynamic from API */}
            <div className="boutique__filter-group">
              <div className="boutique__filter-label">Catégorie</div>
              <div className="boutique__chips">
                {categories.map(cat => (
                  <button key={cat._id}
                    className={`boutique__chip${filters.cat.includes(cat._id) ? " boutique__chip--active" : ""}`}
                    onClick={() => toggleChip("cat", cat._id)}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="boutique__filter-group">
              <div className="boutique__filter-label">Région</div>
              <div className="boutique__chips">
                {REGIONS.map(v => (
                  <button key={v}
                    className={`boutique__chip${filters.region.includes(v) ? " boutique__chip--active" : ""}`}
                    onClick={() => toggleChip("region", v)}>{v}
                  </button>
                ))}
              </div>
            </div>

            <div className="boutique__filter-group">
              <div className="boutique__filter-label">Matière</div>
              <div className="boutique__chips">
                {MATS.map(v => (
                  <button key={v}
                    className={`boutique__chip${filters.mat.includes(v) ? " boutique__chip--active" : ""}`}
                    onClick={() => toggleChip("mat", v)}>{v}
                  </button>
                ))}
              </div>
            </div>

            <div className="boutique__filter-group">
              <div className="boutique__filter-label">Prix (TND)</div>
              <div className="boutique__price-range">
                <div className="boutique__price-display">
                  <span className="boutique__price-val">Min <em>{filters.minPrice.toLocaleString("fr-TN")}</em></span>
                  <span className="boutique__price-val">Max <em>{filters.maxPrice.toLocaleString("fr-TN")}</em></span>
                </div>
                <div className="boutique__slider-wrap">
                  <div className="boutique__slider-track" />
                  <div className="boutique__slider-fill" style={{
                    left:  `${(filters.minPrice / 5000) * 100}%`,
                    width: `${((filters.maxPrice - filters.minPrice) / 5000) * 100}%`,
                  }} />
                  <input type="range" className="boutique__price-slider"
                    min={0} max={5000} step={50} value={filters.minPrice}
                    onChange={e => {
                      const v = Math.min(Number(e.target.value), filters.maxPrice - 50);
                      setFilters(p => ({ ...p, minPrice: v }));
                    }} />
                  <input type="range" className="boutique__price-slider"
                    min={0} max={5000} step={50} value={filters.maxPrice}
                    onChange={e => {
                      const v = Math.max(Number(e.target.value), filters.minPrice + 50);
                      setFilters(p => ({ ...p, maxPrice: v }));
                    }} />
                </div>
                <div className="boutique__price-labels">
                  <span>0 TND</span><span>5 000 TND</span>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Active filter tags — show category name not ID */}
        <AnimatePresence>
          {activeCount > 0 && (
            <motion.div className="boutique__active-tags"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
              {filters.cat.map(id => {
                const name = categories.find(c => c._id === id)?.name ?? id;
                return (
                  <button key={`cat-${id}`} className="boutique__tag"
                    onClick={() => toggleChip("cat", id)}>
                    {name} <span aria-hidden="true"><X size={14} /></span>
                  </button>
                );
              })}
              {(["region", "mat"] as FilterGroup[]).flatMap(group =>
                filters[group].map(val => (
                  <button key={`${group}-${val}`} className="boutique__tag"
                    onClick={() => toggleChip(group, val)}>
                    {val} <span aria-hidden="true"><X size={14} /></span>
                  </button>
                ))
              )}
              {(filters.minPrice > 0 || filters.maxPrice < 5000) && (
                <button className="boutique__tag"
                  onClick={() => setFilters(p => ({ ...p, minPrice: 0, maxPrice: 5000 }))}>
                  {filters.minPrice.toLocaleString("fr-TN")} – {filters.maxPrice.toLocaleString("fr-TN")} TND{" "}
                  <span aria-hidden="true"><X size={14} /></span>
                </button>
              )}
              <button className="boutique__clear-btn" onClick={clearAll}>Tout effacer</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* MAIN */}
      <main className="boutique__main">
        <motion.div className="boutique__section-label"
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
              <button className="boutique__clear-btn" style={{ marginTop: "1rem" }} onClick={clearAll}>
                Effacer les filtres
              </button>
            )}
          </div>
        )}

        {/* Product grid */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="boutique__grid">
            {filteredProducts.map((p, index) => {
              const isWished  = wishlist.includes(p._id);
              const isPending = wishPending.includes(p._id);
              const catName   = getCategoryName(p.category);

              return (
                <Link href={`/boutique/${p._id}`} key={p._id}>
                  <motion.div className="boutique__card"
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.8 + index * 0.1, ease: [0.16, 1, 0.3, 1] as any }}
                    whileHover={{ y: -6 }}>

                    {/* Image */}
                    <div className="boutique__card-img">
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
                      <div className="boutique__card-overlay" />

                      {/* ✅ Now shows the human-readable name */}
                      <span className="boutique__card-cat">{catName}</span>

                      <button
                        className="boutique__card-wish"
                        onClick={e => { e.preventDefault(); toggleWish(p._id); }}
                        disabled={isPending}
                        style={{
                          color:   isWished ? "#d4784f" : undefined,
                          opacity: isPending ? 0.5 : 1,
                          cursor:  isPending ? "wait" : "pointer",
                        }}
                        aria-label={isWished ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        {isWished
                          ? <Heart size={18} fill="currentColor" />
                          : <HeartOff size={18} />}
                      </button>
                    </div>

                    {/* Body */}
                    <div className="boutique__card-body">
                      <div className="boutique__card-top">
                        <h3 className="boutique__card-title">{p.title}</h3>
                        <span className="boutique__card-price">{p.price.toLocaleString("fr-TN")} TND</span>
                      </div>
                      <p className="boutique__card-desc">{p.description.slice(0, 120)}</p>
                    </div>
                    <div className="boutique__card-footer">
                      <span className="boutique__card-loc">{p.location ?? catName}</span>
                      <Link href={`/boutique/${p._id}`} className="boutique__card-cta">Voir la pièce →</Link>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Values */}
        <motion.div className="boutique__values"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}>
          <div className="boutique__section-label"><span>Nos engagements</span></div>
          <div className="boutique__values-grid">
            {values.map(v => (
              <motion.div key={v.n} className="boutique__value-item"
                whileHover={{ backgroundColor: "#1a1410" }}>
                <span className="boutique__value-num">{v.n}</span>
                <p className="boutique__value-text">{v.t}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}