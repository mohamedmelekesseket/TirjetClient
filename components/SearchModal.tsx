"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowUpRight, Package, Search, Tag, X } from "lucide-react";
import { getProductPrice, hasProductDiscount } from "@/lib/productPricing";

/* ─── Config (adjust to your backend / routes) ─────────────────────────────── */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const SEARCH_PARAM = "search"; // query-string key read by getAllProducts
const MIN_CHARS = 2;
const PRODUCT_LIMIT = 8;
const MAX_BODY_HEIGHT = 340;

const productUrl = (p: Product) => `/boutique/${encodeURIComponent(p.slug || p._id)}`;
const allResultsUrl = (q: string) => `/boutique?${SEARCH_PARAM}=${encodeURIComponent(q)}`;

/* ─── Types ────────────────────────────────────────────────────────────────── */
interface CatNode {
  _id: string;
  name: string;
  slug: string;
  subcategories?: CatNode[];
}

interface Product {
  _id: string;
  name?: string;
  title?: string; // fallbacks in case your API uses another field name
  nom?: string;
  slug?: string;
  price?: number;
  solde?: number;
  images?: unknown[];
  image?: string;
  category?: unknown;
}

interface Item {
  key: string;
  kind: "category" | "product";
  label: string;
  sub?: string;
  price?: string;
  originalPrice?: string;
  image?: string;
  url: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  categories: CatNode[];
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
const fold = (s?: string) =>
  (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Per-character fold so indexes stay aligned with the original string
const foldChars = (s?: string) =>
  (s ?? "")
    .split("")
    .map((c) => {
      const f = fold(c);
      return f.length === 1 ? f : c.toLowerCase();
    })
    .join("");

const absoluteSrc = (src?: string) => {
  if (!src) return undefined;
  if (/^(https?:|data:)/.test(src)) return src;
  return `${API_URL}${src.startsWith("/") ? "" : "/"}${src}`;
};

const imageOf = (p: Product) => {
  const first: any = p.images?.[0];
  return absoluteSrc(typeof first === "string" ? first : first?.url ?? p.image);
};

const categoryOf = (p: Product) => {
  const c: any = p.category;
  const name = typeof c === "string" ? c : c?.name;
  // ignore un-populated ObjectIds
  return name && !/^[a-f0-9]{24}$/i.test(name) ? (name as string) : undefined;
};

const formatPrice = (n?: number) =>
  typeof n === "number" ? `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} DT` : undefined;

const Highlight = ({ text = "", q }: { text?: string; q: string }) => {
  const i = q && text ? foldChars(text).indexOf(foldChars(q)) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
};

/* ─── Component ────────────────────────────────────────────────────────────── */
export default function SearchModal({ open, onClose, categories }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [bodyH, setBodyH] = useState(0);

  const q = query.trim();
  const searching = q.length >= MIN_CHARS;

  /* Flatten the category tree once (L1 → L4) */
  const flatCats = useMemo(() => {
    const out: { id: string; name: string; url: string; depth: number }[] = [];
    categories.forEach((l1) => {
      const u1 = `/boutique/categorie/${l1.slug}`;
      out.push({ id: l1._id, name: l1.name, url: u1, depth: 0 });
      l1.subcategories?.forEach((l2) => {
        const u2 = `${u1}/${l2.slug}`;
        out.push({ id: l2._id, name: l2.name, url: u2, depth: 1 });
        l2.subcategories?.forEach((l3) => {
          const u3 = `${u2}/${l3.slug}`;
          out.push({ id: l3._id, name: l3.name, url: u3, depth: 2 });
          l3.subcategories?.forEach((l4) => {
            out.push({ id: l4._id, name: l4.name, url: `${u3}/${l4.slug}`, depth: 3 });
          });
        });
      });
    });
    return out;
  }, [categories]);

  const catItems: Item[] = useMemo(() => {
    let list = flatCats;
    if (searching) {
      const f = fold(q);
      list = flatCats
        .filter((c) => fold(c.name).includes(f))
        .sort((a, b) => {
          const as = fold(a.name).startsWith(f) ? 0 : 1;
          const bs = fold(b.name).startsWith(f) ? 0 : 1;
          return as - bs || a.depth - b.depth;
        });
    } else {
      list = flatCats.filter((c) => c.depth === 0);
    }
    return list.slice(0, searching ? 4 : 5).map((c) => ({
      key: `c-${c.id}`,
      kind: "category" as const,
      label: c.name,
      url: c.url,
    }));
  }, [flatCats, q, searching]);

  const productItems: Item[] = useMemo(
    () =>
      products.map((p) => ({
        key: `p-${p._id}`,
        kind: "product" as const,
        label: p.name ?? p.title ?? p.nom ?? "Produit sans nom",
        sub: categoryOf(p),
        price: formatPrice(getProductPrice({ price: p.price ?? 0, solde: p.solde })),
        originalPrice: hasProductDiscount({ price: p.price ?? 0, solde: p.solde })
          ? formatPrice(p.price)
          : undefined,
        image: imageOf(p),
        url: productUrl(p),
      })),
    [products]
  );

  const items = useMemo(() => [...catItems, ...productItems], [catItems, productItems]);

  /* Debounced product fetch */
  useEffect(() => {
    if (!searching) {
      setProducts([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/products?${SEARCH_PARAM}=${encodeURIComponent(q)}&limit=${PRODUCT_LIMIT}`,
          { signal: ctrl.signal }
        );
        const json = res.ok ? await res.json() : null;
        const list: Product[] = json?.products ?? json?.data ?? (Array.isArray(json) ? json : []);
        setProducts(list);
        setTotal(json?.total ?? json?.pagination?.total ?? list.length);
        setLoading(false);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setProducts([]);
          setTotal(0);
          setLoading(false);
        }
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q, searching]);

  /* Focus + scroll lock while open */
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* Animate the panel height to fit its content */
  useEffect(() => {
    if (!open) return;
    const el = innerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBodyH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  /* Keep the keyboard-active row visible */
  useEffect(() => {
    bodyRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (url: string) => {
    router.push(url);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (items.length ? (i + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = items[active];
      if (it) go(it.url);
      else if (searching) go(allResultsUrl(q));
    }
  };

  const reset = () => {
    setQuery("");
    setProducts([]);
    setTotal(0);
    setActive(0);
  };

  const renderRow = (item: Item, idx: number) => {
    const isActive = idx === active;
    return (
      <motion.button
        key={item.key}
        type="button"
        role="option"
        aria-selected={isActive}
        data-idx={idx}
        className={`sm__row sm__row--${item.kind}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, delay: Math.min(idx, 8) * 0.025 }}
        onMouseMove={() => active !== idx && setActive(idx)}
        onClick={() => go(item.url)}
      >
        {isActive && (
          <motion.span
            layoutId="sm-active"
            className="sm__row-bg"
            transition={{ type: "spring", stiffness: 520, damping: 40 }}
          />
        )}

        {item.kind === "category" ? (
          <>
            <Tag size={14} strokeWidth={1.8} className="sm__cat-icon" />
            <span className="sm__label">
              <Highlight text={item.label} q={searching ? q : ""} />
            </span>
          </>
        ) : (
          <>
            <span className="sm__tile">
              {item.image ? (
                <img src={item.image} alt="" loading="lazy" />
              ) : (
                <Package size={15} strokeWidth={1.8} />
              )}
            </span>
            <span className="sm__text">
              <span className="sm__label">
                <Highlight text={item.label} q={q} />
              </span>
              {item.sub && <span className="sm__sub">{item.sub}</span>}
            </span>
            {item.price && (
              <span className="sm__price">
                {item.price}
                {item.originalPrice && <del>{item.originalPrice}</del>}
              </span>
            )}
          </>
        )}
      </motion.button>
    );
  };

  const showSkeleton = searching && loading && products.length === 0;
  const showEmpty = searching && !loading && items.length === 0;
  const hasMore = searching && total > products.length;

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence onExitComplete={reset}>
        {open && (
          <motion.div
            className="sm__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
          >
            <motion.div
              className="sm__panel"
              role="dialog"
              aria-modal="true"
              aria-label="Recherche"
              initial={{ opacity: 0, y: -14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              onKeyDown={onKeyDown}
            >
              {/* Input row */}
              <div className="sm__bar">
                <Search size={17} strokeWidth={1.9} className="sm__bar-icon" />
                <input
                  ref={inputRef}
                  className="sm__input"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  placeholder="Rechercher un produit, une catégorie…"
                  role="combobox"
                  aria-expanded
                  aria-controls="sm-list"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button type="button" className="sm__close" onClick={onClose} aria-label="Fermer">
                  <X size={17} strokeWidth={2} />
                </button>

                <AnimatePresence>
                  {loading && (
                    <motion.span
                      className="sm__progress"
                      initial={{ scaleX: 0, opacity: 1 }}
                      animate={{ scaleX: 0.85 }}
                      exit={{ scaleX: 1, opacity: 0 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Results (height animates to fit content) */}
              <motion.div
                ref={bodyRef}
                className="sm__body"
                animate={{ height: Math.min(bodyH, MAX_BODY_HEIGHT) }}
                initial={false}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
              >
                <div ref={innerRef} id="sm-list" role="listbox" className="sm__inner">
                  {catItems.length > 0 && (
                    <div className="sm__section">
                      <p className="sm__section-label">{searching ? "Catégories" : "Parcourir"}</p>
                      {catItems.map((it, i) => renderRow(it, i))}
                    </div>
                  )}

                  {showSkeleton && (
                    <div className="sm__section">
                      <p className="sm__section-label">Produits</p>
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="sm__skel">
                          <span className="sm__skel-tile" />
                          <span className="sm__skel-lines">
                            <span />
                            <span />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {productItems.length > 0 && (
                    <div className="sm__section">
                      <p className="sm__section-label">Produits ({total || productItems.length})</p>
                      {productItems.map((it, i) => renderRow(it, catItems.length + i))}
                    </div>
                  )}

                  {showEmpty && (
                    <motion.div
                      className="sm__empty"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p>Aucun résultat pour « {q} »</p>
                      <span>Essayez un autre mot, ou parcourez les catégories.</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Footer */}
              <AnimatePresence initial={false}>
                {searching && productItems.length > 0 && (
                  <motion.div
                    className="sm__footer"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <span className="sm__hints">↑↓ naviguer · ↵ ouvrir · esc fermer</span>
                    <button type="button" className="sm__all" onClick={() => go(allResultsUrl(q))}>
                      {hasMore ? `Voir les ${total} résultats` : "Voir tous les résultats"}
                      <ArrowUpRight size={13} strokeWidth={2} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}