"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, SlidersHorizontal, X, Search,
  Heart, HeartOff, Package, Loader2, ArrowLeft,
  Grid3X3, LayoutList, ChevronDown, Check,
} from "lucide-react";
import { useSession } from "next-auth/react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Level4 { _id: string; name: string; slug: string; productCount?: number; }
interface Level3 { _id: string; name: string; slug: string; subcategories: Level4[]; }
interface Level2 { _id: string; name: string; slug: string; subcategories: Level3[]; }
interface Category {
  _id: string; name: string; description: string;
  mainCategory: string; subcategories: Level2[]; isActive: boolean; slug: string;
}
interface Product {
  _id: string; title: string; description: string; price: number;
  images: string[]; stock: number; isApproved: boolean; createdAt: string;
  subcategoryL2?: { slug: string; name: string };
  subcategoryL3?: { slug: string; name: string };
  subcategoryL4?: { slug: string; name: string };
}

const SORT_OPTIONS = [
  { value: "newest",     label: "Plus récents" },
  { value: "price_asc",  label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
];

// Pure helper — derives active sub-levels from the tree + current URL slugs.
// Keeping this outside state eliminates the effect-chain that caused re-fetch loops.
function resolveLevels(tree: Category | null, slugs: string[]) {
  const [, l2Slug, l3Slug, l4Slug] = slugs;
  const l2 = l2Slug ? (tree?.subcategories?.find((c) => c.slug === l2Slug) ?? null) : null;
  const l3 = l3Slug && l2 ? (l2.subcategories?.find((c) => c.slug === l3Slug) ?? null) : null;
  const l4 = l4Slug && l3 ? (l3.subcategories?.find((c) => c.slug === l4Slug) ?? null) : null;
  return { l2, l3, l4 };
}

export default function CategoryPage() {
  const params   = useParams();
  const router   = useRouter();
  const { data: session } = useSession();
  const apiToken = (session as any)?.apiToken as string | undefined;

  const rawSlug = params?.slug;
  const slugs: string[] = Array.isArray(rawSlug)
    ? rawSlug
    : typeof rawSlug === "string" ? [rawSlug] : [];
  const [l1Slug, l2Slug, l3Slug, l4Slug] = slugs;

  // ── Category tree ─────────────────────────────────────────────────────────
  // Fetched once per L1 slug; sub-navigation reuses the cached tree.
  const [categoryTree, setCategoryTree] = useState<Category | null>(null);
  const treeSlugRef = useRef<string | null>(null);

  // Active levels derived inline from tree + URL — no extra state, no loops.
  const { l2: activeL2, l3: activeL3, l4: activeL4 } = resolveLevels(categoryTree, slugs);
  const activeL1 = categoryTree;

  // ── Products ──────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // ── Wishlist — use Set for O(1) lookups ───────────────────────────────────
  const [wishlist, setWishlist]       = useState<string[]>([]);
  const [wishPending, setWishPending] = useState<Set<string>>(new Set());

  // ── UI ────────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy]           = useState("newest");
  const [priceRange, setPriceRange]   = useState<[number, number]>([0, 5000]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode]       = useState<"grid" | "list">("grid");
  const [sortOpen, setSortOpen]       = useState(false);

  // ── 1. Fetch category tree — only when L1 slug changes ───────────────────
  useEffect(() => {
    if (!l1Slug) return;
    if (treeSlugRef.current === l1Slug) return; // already loaded, skip
    treeSlugRef.current = l1Slug;

    fetch(`${API}/api/categories?mainCategory=artisanat`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list: Category[] = data?.data ?? [];
        setCategoryTree(list.find((c) => c.slug === l1Slug) ?? null);
      })
      .catch(() => {
        treeSlugRef.current = null; // allow retry on next render
      });
  }, [l1Slug]);

  // ── 2. Fetch products — keyed on deepest active slug to avoid over-fetching
  const activeCategoryKey = [
    categoryTree?._id,
    activeL4?.slug ?? activeL3?.slug ?? activeL2?.slug ?? "root",
  ].join("|");

  useEffect(() => {
    if (!categoryTree) return;
    const controller = new AbortController();

    const load = async () => {
      setFetching(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ category: categoryTree._id });
        if (activeL4?.slug)      qs.set("subcategoryL4", activeL4.slug);
        else if (activeL3?.slug) qs.set("subcategoryL3", activeL3.slug);
        else if (activeL2?.slug) qs.set("subcategoryL2", activeL2.slug);

        const res  = await fetch(`${API}/api/products?${qs}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Erreur serveur");
        const data = await res.json();
        const list: Product[] = Array.isArray(data) ? data : (data.products ?? data.data ?? []);
        setProducts(list.filter((p) => p.isApproved && p.stock > 0));
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message);
      } finally {
        if (!controller.signal.aborted) setFetching(false);
      }
    };
    load();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategoryKey]);

  // ── 3. Wishlist IDs ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!apiToken) return;
    fetch(`${API}/api/favourites/ids`, { headers: { Authorization: `Bearer ${apiToken}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.ids && setWishlist(d.ids))
      .catch(() => {});
  }, [apiToken]);

  // ── 4. Toggle wishlist — fixed stale-closure bug via functional updater ───
  const toggleWish = useCallback(async (id: string) => {
    if (!apiToken || wishPending.has(id)) return;

    let wasIn = false;
    setWishlist((prev) => {
      wasIn = prev.includes(id);
      return wasIn ? prev.filter((i) => i !== id) : [...prev, id];
    });
    setWishPending((prev) => new Set(prev).add(id));

    try {
      const res = await fetch(`${API}/api/favourites/${id}`, {
        method: wasIn ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (!res.ok) throw new Error();
    } catch {
      setWishlist((prev) => wasIn ? [...prev, id] : prev.filter((i) => i !== id));
    } finally {
      setWishPending((prev) => { const s = new Set(prev); s.delete(id); return s; });
    }
  }, [apiToken, wishPending]);

  // ── 5. Filter + sort ──────────────────────────────────────────────────────
  const filtered = products
    .filter((p) => {
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q) || !!p.description?.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc")  return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // ── 6. Breadcrumb ─────────────────────────────────────────────────────────
  const breadcrumbs = [
    { label: "Boutique", href: "/boutique" },
    activeL1 && { label: activeL1.name, href: `/boutique/categorie/${activeL1.slug}` },
    activeL2 && { label: activeL2.name, href: `/boutique/categorie/${l1Slug}/${activeL2.slug}` },
    activeL3 && { label: activeL3.name, href: `/boutique/categorie/${l1Slug}/${l2Slug}/${activeL3.slug}` },
    activeL4 && { label: activeL4.name, href: null as string | null },
  ].filter(Boolean) as { label: string; href: string | null }[];

  const activeName = activeL4?.name ?? activeL3?.name ?? activeL2?.name ?? activeL1?.name ?? "Catégorie";

  // memoised so pill buttons don't recreate this on every render
  const navTo = useCallback(
    (newSlugs: string[]) =>
      router.push(`/boutique/categorie/${newSlugs.join("/")}`, { scroll: false }),
    [router]
  );

  const showError    = !fetching && !!error  && products.length === 0;
  const showEmpty    = !fetching && !error   && products.length === 0 && !!categoryTree;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="cat__page">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div className="cat__hero">
        <div className="cat__hero-bg" />
        <div className="cat__hero-inner">

          {/* Breadcrumb fades in */}
          <motion.nav
            className="cat__breadcrumb"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {breadcrumbs.map((bc, i) => (
              <span key={i} className="cat__breadcrumb-item">
                {i > 0 && <ChevronRight size={11} className="cat__breadcrumb-sep" />}
                {bc.href
                  ? <Link href={bc.href} scroll={false} className="cat__breadcrumb-link">{bc.label}</Link>
                  : <span className="cat__breadcrumb-current">{bc.label}</span>}
              </span>
            ))}
          </motion.nav>

          {/* Title slides up */}
          <motion.h1
            className="cat__hero-title"
            key={activeName}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
          >
            {activeName}
          </motion.h1>

          {activeL1?.description && !activeL2 && (
            <motion.p
              className="cat__hero-desc"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.16 }}
            >
              {activeL1.description}
            </motion.p>
          )}

          {!activeL2 && (activeL1?.subcategories?.length ?? 0) > 0 && (
            <motion.div
              className="cat__level-pills"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.22 }}
            >
              {activeL1!.subcategories.map((l2) => (
                <button key={l2._id} className="cat__pill" onClick={() => navTo([l1Slug, l2.slug])}>
                  {l2.name}
                  {l2.subcategories.length > 0 && (
                    <span className="cat__pill-count">{l2.subcategories.length} sous-cat.</span>
                  )}
                  <ChevronRight size={12} />
                </button>
              ))}
            </motion.div>
          )}

          {activeL2 && !activeL3 && (activeL2.subcategories?.length ?? 0) > 0 && (
            <motion.div
              className="cat__level-pills"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.22 }}
            >
              {activeL2.subcategories.map((l3) => (
                <button key={l3._id} className="cat__pill" onClick={() => navTo([l1Slug, l2Slug, l3.slug])}>
                  {l3.name}
                  {l3.subcategories.length > 0 && (
                    <span className="cat__pill-count">{l3.subcategories.length} pièces</span>
                  )}
                  <ChevronRight size={12} />
                </button>
              ))}
            </motion.div>
          )}

          {activeL3 && !activeL4 && (activeL3.subcategories?.length ?? 0) > 0 && (
            <motion.div
              className="cat__level-pills"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.22 }}
            >
              {activeL3.subcategories.map((l4) => (
                <button key={l4._id} className="cat__pill cat__pill--leaf"
                  onClick={() => navTo([l1Slug, l2Slug, l3Slug, l4.slug])}>
                  <span className="cat__pill-dot" />
                  {l4.name}
                  {(l4.productCount ?? 0) > 0 && (
                    <span className="cat__pill-count">{l4.productCount}</span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <div className="cat__hero-deco" aria-hidden="true">
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path d="M100,10 L190,55 L190,145 L100,190 L10,145 L10,55 Z"
              fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
            <path d="M100,30 L170,67 L170,133 L100,170 L30,133 L30,67 Z"
              fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
            <circle cx="100" cy="100" r="8" fill="currentColor" opacity="0.15" />
          </svg>
        </div>
      </div>

      {/* ── TOOLBAR ──────────────────────────────────────────────────── */}
      <div className="cat__toolbar">
        <div className="cat__toolbar-inner">
          <div className="cat__search">
            <Search size={14} className="cat__search-icon" />
            <input type="text" placeholder="Rechercher dans cette catégorie…"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="cat__search-input" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="cat__search-clear">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="cat__toolbar-right">
            <span className="cat__count">
              {`${filtered.length} pièce${filtered.length !== 1 ? "s" : ""}`}
            </span>

            {/* Sort dropdown — backdrop has correct z-index so clicks don't fall through */}
            <div className="cat__sort-wrap" style={{ position: "relative" }}>
              <button className="cat__sort-btn" onClick={() => setSortOpen((v) => !v)}>
                {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                <ChevronDown size={13} />
              </button>
              <AnimatePresence>
                {sortOpen && (
                  <>
                    <div
                      className="cat__sort-backdrop"
                      style={{ position: "fixed", inset: 0, zIndex: 10 }}
                      onClick={() => setSortOpen(false)}
                    />
                    <motion.div
                      className="cat__sort-dd"
                      style={{ position: "absolute", zIndex: 11 }}
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <button key={opt.value}
                          className={`cat__sort-opt${sortBy === opt.value ? " cat__sort-opt--active" : ""}`}
                          onClick={() => { setSortBy(opt.value); setSortOpen(false); }}>
                          {opt.label}
                          {sortBy === opt.value && <Check size={13} />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="cat__view-toggle">
              <button className={`cat__view-btn${viewMode === "grid" ? " cat__view-btn--active" : ""}`}
                onClick={() => setViewMode("grid")} aria-label="Vue grille"><Grid3X3 size={15} /></button>
              <button className={`cat__view-btn${viewMode === "list" ? " cat__view-btn--active" : ""}`}
                onClick={() => setViewMode("list")} aria-label="Vue liste"><LayoutList size={15} /></button>
            </div>

            <button className="cat__filter-toggle" onClick={() => setSidebarOpen((v) => !v)}>
              <SlidersHorizontal size={15} /> Filtres
            </button>
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <div className="cat__body">

        <aside className={`cat__sidebar${sidebarOpen ? " cat__sidebar--mobile-open" : ""}`}>
          <button className="cat__sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>

          {categoryTree && (
            <div className="cat__sidebar-section">
              <div className="cat__sidebar-label">Navigation</div>

              <Link href={`/boutique/categorie/${categoryTree.slug}`} scroll={false}
                className={`cat__sidebar-cat${!activeL2 ? " cat__sidebar-cat--active" : ""}`}>
                {categoryTree.name}
              </Link>

              {categoryTree.subcategories?.map((l2) => (
                <div key={l2._id}>
                  <Link href={`/boutique/categorie/${l1Slug}/${l2.slug}`} scroll={false}
                    className={`cat__sidebar-l2${activeL2?._id === l2._id ? " cat__sidebar-l2--active" : ""}`}>
                    <ChevronRight size={10} /> {l2.name}
                  </Link>
                  {activeL2?._id === l2._id && l2.subcategories?.map((l3) => (
                    <div key={l3._id}>
                      <Link href={`/boutique/categorie/${l1Slug}/${l2.slug}/${l3.slug}`} scroll={false}
                        className={`cat__sidebar-l3${activeL3?._id === l3._id ? " cat__sidebar-l3--active" : ""}`}>
                        <span className="cat__sidebar-dot" /> {l3.name}
                      </Link>
                      {activeL3?._id === l3._id && l3.subcategories?.map((l4) => (
                        <Link key={l4._id} scroll={false}
                          href={`/boutique/categorie/${l1Slug}/${l2.slug}/${l3.slug}/${l4.slug}`}
                          className={`cat__sidebar-l4${activeL4?._id === l4._id ? " cat__sidebar-l4--active" : ""}`}>
                          {l4.name}
                          {(l4.productCount ?? 0) > 0 && (
                            <span className="cat__sidebar-l4-count">{l4.productCount}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="cat__sidebar-section">
            <div className="cat__sidebar-label">Prix (TND)</div>
            <div className="cat__price-vals">
              <span>{priceRange[0].toLocaleString("fr-TN")}</span>
              <span>–</span>
              <span>{priceRange[1].toLocaleString("fr-TN")}</span>
            </div>
            <div className="cat__range-wrap">
              <div className="cat__range-track" />
              <div className="cat__range-fill" style={{
                left:  `${(priceRange[0] / 5000) * 100}%`,
                right: `${100 - (priceRange[1] / 5000) * 100}%`,
              }} />
              <input type="range" min={0} max={5000} step={50} value={priceRange[0]}
                onChange={(e) => setPriceRange(([, max]) => [Math.min(+e.target.value, max - 50), max])}
                className="cat__range-input" />
              <input type="range" min={0} max={5000} step={50} value={priceRange[1]}
                onChange={(e) => setPriceRange(([min]) => [min, Math.max(+e.target.value, min + 50)])}
                className="cat__range-input" />
            </div>
            <div className="cat__range-labels"><span>0</span><span>5 000 TND</span></div>
          </div>

          {(searchQuery || priceRange[0] > 0 || priceRange[1] < 5000) && (
            <button className="cat__sidebar-reset"
              onClick={() => { setSearchQuery(""); setPriceRange([0, 5000]); }}>
              <X size={12} /> Réinitialiser
            </button>
          )}
        </aside>

        {/* Products — grid stays mounted; only a subtle overlay shows during refetch */}
        <div className="cat__products" style={{ position: "relative" }}>

          {/* Overlay spinner — fades over existing cards while new ones load.
              Never unmounts the grid, so there's no full-page reload feel. */}
          <AnimatePresence>
            {fetching && (
              <motion.div
                className="cat__center"
                style={{
                  position: "absolute", inset: 0, zIndex: 5,
                  backdropFilter: "blur(2px)",
                  backgroundColor: "rgba(255,255,255,0.55)",
                  pointerEvents: "none",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Loader2 size={28} className="cat__spin" />
              </motion.div>
            )}
          </AnimatePresence>

          {showError && (
            <div className="cat__center cat__error">
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="cat__retry">Réessayer</button>
            </div>
          )}

          {showEmpty && (
            <div className="cat__center cat__empty">
              <Package size={36} />
              <p>Aucun produit dans cette catégorie.</p>
              <Link href="/boutique" className="cat__back-link">
                <ArrowLeft size={14} /> Retour à la boutique
              </Link>
            </div>
          )}

          {/* Grid is ALWAYS mounted once products exist — category changes only
              swap cards in/out via AnimatePresence, never tear down the grid. */}
          <div className={viewMode === "grid" ? "cat__grid" : "cat__list"}>
            <AnimatePresence mode="popLayout" initial={false}>
              {filtered.map((p) => {
                const wished  = wishlist.includes(p._id);
                const pending = wishPending.has(p._id);
                return (
                  <motion.article
                    key={p._id}
                    layout
                    className={`cat__card${viewMode === "list" ? " cat__card--list" : ""}`}
                    onClick={() => router.push(`/boutique/${p._id}`)}
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1,    y: 0,
                      transition: { duration: 0.32, ease: [0.25, 0.1, 0.25, 1] } }}
                    exit={{    opacity: 0, scale: 0.96, y: -8,
                      transition: { duration: 0.18 } }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    <div className="cat__card-img">
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.title} loading="lazy" />
                        : <div className="cat__card-placeholder"><Package size={32} /></div>
                      }
                      {p.subcategoryL2?.name && (
                        <span className="cat__card-badge">{p.subcategoryL2.name}</span>
                      )}
                      <button className="cat__card-wish"
                        onClick={(e) => { e.stopPropagation(); toggleWish(p._id); }}
                        disabled={pending}
                        style={{ color: wished ? "#d4784f" : undefined }}
                        aria-label={wished ? "Retirer des favoris" : "Ajouter aux favoris"}>
                        {wished ? <Heart size={16} fill="currentColor" /> : <HeartOff size={16} />}
                      </button>
                      <div className="cat__card-grad" />
                    </div>

                    <div className="cat__card-body">
                      <div className="cat__card-trail">
                        {[p.subcategoryL2?.name, p.subcategoryL3?.name, p.subcategoryL4?.name]
                          .filter(Boolean).join(" › ")}
                      </div>
                      <h3 className="cat__card-title">{p.title}</h3>
                      {viewMode === "list" && (
                        <p className="cat__card-desc">{p.description?.slice(0, 140)}</p>
                      )}
                      <div className="cat__card-foot">
                        <span className="cat__card-price">{p.price.toLocaleString("fr-TN")} TND</span>
                        <span className="cat__card-cta">Voir →</span>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}