"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Package, ShoppingBag, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApiToken } from "@/lib/useApiToken";
import { useCart } from "../../context/CartContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const EASE = [0.22, 1, 0.36, 1] as any;
const REVIEWS_PER_PAGE = 4;

// ─── Types ────────────────────────────────────────────────────────────────────
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
  views: number;
  category: { _id: string; name: string } | string;
  artisan: {
    _id: string;
    name: string;
    city?: string;
    image?: string;
    avatar?: string;
    createdAt?: string;
  };
  location?: string;
  material?: string;
  dimensions?: string;
  colors?: string[];
  tags?: string[];
  stock: number;
  isApproved: boolean;
  createdAt: string;
}

interface Comment {
  _id: string;
  user: { _id: string; name: string; image?: string };
  rating: number;
  content: string;
  createdAt: string;
}

interface DrawerItem {
  product: {
    _id: string;
    title: string;
    images?: string[];
    price: number;
    stock?: number;
  };
  quantity: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveCategoryName(
  category: Product["category"],
  categoriesMap: Map<string, string>
): string {
  if (!category) return "";
  if (typeof category === "object") return category.name;
  if (categoriesMap.has(category)) return categoriesMap.get(category)!;
  return category;
}

function initials(name?: string) {
  if (!name) return "A";
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join("");
}

function getPageList(total: number, current: number): (number | "…")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

const STAR_PATH = "M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 9.2l7.1-.6z";

// ─── Sub-components ───────────────────────────────────────────────────────────
function Pin() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ display: "inline", verticalAlign: "middle", marginRight: 5, opacity: 0.6 }}>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function StarRow({ rating, total }: { rating: number; total: number }) {
  return (
    <div className="pd-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.svg key={i} width="15" height="15" viewBox="0 0 24 24"
          fill={i < rating ? "#D39A3F" : "none"} stroke="#D39A3F" strokeWidth="1.5" strokeLinejoin="round"
          initial={{ opacity: 0, scale: 0, rotate: -50 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.5 + i * 0.07, duration: 0.5, ease: EASE }}>
          <path d={STAR_PATH} />
        </motion.svg>
      ))}
      <span className="pd-stars__count">{total === 0 ? "Nouveau" : `(${total} avis)`}</span>
    </div>
  );
}

// ─── Cart Drawer (logic unchanged) ────────────────────────────────────────────
const stepperBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  color: "inherit",
  padding: 0,
};

function CartDrawer({
  open, onClose, items, onRemove, onUpdateQty, onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  items: DrawerItem[];
  onRemove: (productId: string) => Promise<void> | void;
  onUpdateQty: (productId: string, quantity: number) => Promise<void> | void;
  onCheckout: () => void;
}) {
  const [localItems, setLocalItems] = useState<DrawerItem[]>(items);
  const [syncing, setSyncing] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  const itemsRef = useRef(items);
  const onUpdateQtyRef = useRef(onUpdateQty);
  const onRemoveRef = useRef(onRemove);
  itemsRef.current = items;
  onUpdateQtyRef.current = onUpdateQty;
  onRemoveRef.current = onRemove;

  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const targets = useRef<Record<string, number>>({});
  const chains = useRef<Record<string, Promise<void>>>({});
  const inflight = useRef(0);

  const isIdle = () => inflight.current === 0 && Object.keys(timers.current).length === 0;

  const settle = () => {
    if (isIdle()) {
      setLocalItems(itemsRef.current);
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (isIdle()) setLocalItems(items);
  }, [items]);

  useEffect(() => () => {
    Object.values(timers.current).forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setDrawerError(null);
  }, [open]);

  function enqueue(id: string, task: () => Promise<void> | void) {
    inflight.current++;
    setSyncing(true);
    chains.current[id] = (chains.current[id] ?? Promise.resolve())
      .then(() => task())
      .catch((err: any) => setDrawerError(err?.message ?? "Une erreur est survenue. Réessayez."))
      .finally(() => {
        inflight.current--;
        settle();
      });
  }

  function handleQty(id: string, next: number) {
    if (next < 1) return;
    setDrawerError(null);
    setLocalItems(prev => prev.map(i => (i.product._id === id ? { ...i, quantity: next } : i)));
    targets.current[id] = next;
    setSyncing(true);
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => {
      delete timers.current[id];
      const qty = targets.current[id];
      delete targets.current[id];
      enqueue(id, () => onUpdateQtyRef.current(id, qty));
    }, 350);
  }

  function handleRemove(id: string) {
    setDrawerError(null);
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    delete targets.current[id];
    setLocalItems(prev => prev.filter(i => i.product._id !== id));
    enqueue(id, () => onRemoveRef.current(id));
  }

  const total = localItems.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="cd-overlay" className="cd-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose} />
      )}
      {open && (
        <motion.aside key="cd-panel" className="cd-panel"
          role="dialog" aria-modal="true" aria-label="Votre panier"
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ duration: 0.45, ease: EASE }}>

          <header className="cd-head">
            <div>
              <span className="cd-head__label">Sélection</span>
              <h2 className="cd-head__title">Votre panier</h2>
            </div>
            <button className="cd-close" onClick={onClose} aria-label="Fermer">
              <X size={16} />
            </button>
          </header>

          <div className="cd-body">
            {localItems.length === 0 ? (
              <p className="cd-empty">Votre panier est vide.</p>
            ) : (
              localItems.map(({ product: p, quantity }) => {
                const maxQty = typeof p.stock === "number" && p.stock > 0 ? p.stock : 99;
                const atMin = quantity <= 1;
                const atMax = quantity >= maxQty;

                return (
                  <div key={p._id} className="cd-item">
                    <div className="cd-item__img">
                      {p.images?.[0] ? <img src={p.images[0]} alt={p.title} /> : <Package size={22} />}
                    </div>
                    <div className="cd-item__info">
                      <h3 className="cd-item__name">{p.title}</h3>

                      <div
                        className="cd-item__qty"
                        role="group"
                        aria-label={`Quantité de ${p.title}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          border: "1px solid rgba(0,0,0,0.18)",
                          borderRadius: 999,
                          margin: "6px 0",
                          width: "33%",
                          overflow: "hidden",
                        }}>
                        <button
                          type="button"
                          aria-label="Diminuer la quantité"
                          onClick={() => handleQty(p._id, quantity - 1)}
                          disabled={atMin}
                          style={{ ...stepperBtnStyle, opacity: atMin ? 0.35 : 1, cursor: atMin ? "not-allowed" : "pointer" }}>
                          <Minus size={13} />
                        </button>
                        <span
                          aria-live="polite"
                          style={{ minWidth: 26, textAlign: "center", fontSize: "0.85rem", fontVariantNumeric: "tabular-nums" }}>
                          {quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Augmenter la quantité"
                          onClick={() => handleQty(p._id, quantity + 1)}
                          disabled={atMax}
                          style={{ ...stepperBtnStyle, opacity: atMax ? 0.35 : 1, cursor: atMax ? "not-allowed" : "pointer" }}>
                          <Plus size={13} />
                        </button>
                      </div>
                      {atMax && typeof p.stock === "number" && (
                        <span style={{ display: "block", fontSize: "0.72rem", opacity: 0.6 }}>
                          Stock maximum atteint
                        </span>
                      )}

                      <div className="cd-item__row">
                        <span className="cd-item__price">{(p.price * quantity).toLocaleString("fr-TN")} TND</span>
                        <button className="cd-item__remove" onClick={() => handleRemove(p._id)}>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <footer className="cd-foot">
            {drawerError && (
              <p role="alert" style={{
                color: "#c0392b", fontSize: "0.8rem", marginBottom: "0.5rem",
                background: "#fdf0ef", border: "1px solid #f5c6c2",
                borderRadius: 8, padding: "0.4rem 0.7rem",
              }}>
                {drawerError}
              </p>
            )}
            <div className="cd-foot__total">
              <span>Total</span>
              <strong>{total.toLocaleString("fr-TN")} TND</strong>
            </div>
            <div className="cd-foot__livraison">
              <span>Livraison calculée à l’étape suivante</span>
            </div>
            <button className="cd-checkout" onClick={onCheckout} disabled={localItems.length === 0 || syncing}>
              {syncing ? "MISE À JOUR…" : "PASSER LA COMMANDE"}
              {!syncing && <span className="cd-checkout__arrow">→</span>}
            </button>
            <p className="cd-foot__note" style={{ cursor: "pointer" }} onClick={onClose}>
              Continuer mes achats
            </p>
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
function Gallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const go = (dir: 1 | -1) =>
    setActive(a => (a + dir + images.length) % images.length);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  // Hover-zoom: image follows the cursor
  const onMouseMove = (e: React.MouseEvent) => {
    const el = mainRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--zx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--zy", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  if (!images.length) return (
    <div style={{
      width: "100%", aspectRatio: "3/4", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "#efe5d4", borderRadius: 28, opacity: 0.6,
    }}>
      <Package size={48} />
    </div>
  );

  return (
    <>
      <div className="pd-gallery">
        <div className="pd-gallery__thumbs">
          {images.map((img, i) => (
            <motion.button key={i}
              className={`pd-gallery__thumb${active === i ? " pd-gallery__thumb--active" : ""}`}
              onClick={() => setActive(i)}
              initial={{ opacity: 0, x: -18, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.1, duration: 0.6, ease: EASE }}
              whileHover={{ y: -3 }} whileTap={{ scale: 0.94 }}>
              <img src={img} alt={`Vue ${i + 1}`} />
            </motion.button>
          ))}
        </div>

        <motion.div
          ref={mainRef}
          className={`pd-gallery__main${zoom ? " is-zoom" : ""}`}
          onClick={() => setLightbox(true)}
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onMouseMove={onMouseMove}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          initial={{ opacity: 0, clipPath: "inset(8% 8% 8% 8% round 40px)", scale: 0.96 }}
          animate={{ opacity: 1, clipPath: "inset(0% 0% 0% 0% round 28px)", scale: 1 }}
          transition={{ duration: 1, ease: EASE }}
        >
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Produit ${i + 1}`}
              draggable={false}
              className={`pd-gallery__main-img${active === i ? " pd-gallery__main-img--on" : ""}`}
            />
          ))}
          <div className="pd-gallery__zoom-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              <path d="M11 8v6M8 11h6" />
            </svg>
            Survolez pour zoomer
          </div>
          {images.length > 1 && (
            <>
              <button className="pd-gallery__arrow pd-gallery__arrow--prev" aria-label="Précédent"
                onClick={e => { e.stopPropagation(); go(-1); }}>‹</button>
              <button className="pd-gallery__arrow pd-gallery__arrow--next" aria-label="Suivant"
                onClick={e => { e.stopPropagation(); go(1); }}>›</button>
              <div className="pd-gallery__dots">
                {images.map((_, i) => (
                  <button key={i} aria-label={`Image ${i + 1}`}
                    className={`pd-gallery__dot${active === i ? " pd-gallery__dot--on" : ""}`}
                    onClick={e => { e.stopPropagation(); setActive(i); }} />
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div className="pd-lightbox"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}>
            <motion.img src={images[active]} alt="Agrandir" className="pd-lightbox__img"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              onClick={e => e.stopPropagation()} />
            <button className="pd-lightbox__close" onClick={() => setLightbox(false)} aria-label="Fermer">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { apiToken, session } = useApiToken();
  const router = useRouter();

  const cartCtx = useCart() as any;
  const { cart, addToCart, removeItem } = cartCtx;

  const [currentId, setCurrentId] = useState(id);
  const [categoriesMap, setCategoriesMap] = useState<Map<string, string>>(new Map());

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [mostViewed, setMostViewed] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [qty, setQty] = useState(1);
  const [wish, setWish] = useState(false);
  const [wishPending, setWishPending] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const publishBtnRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Reviews pagination
  const [reviewPage, setReviewPage] = useState(1);
  const reviewListRef = useRef<HTMLDivElement>(null);
  const totalReviewPages = Math.max(1, Math.ceil(comments.length / REVIEWS_PER_PAGE));

  // keep the page valid after a delete
  useEffect(() => {
    setReviewPage(p => Math.min(p, totalReviewPages));
  }, [totalReviewPages]);

  function goToReviewPage(p: number) {
    setReviewPage(p);
    const el = reviewListRef.current;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: "smooth" });
  }

  // ── Categories ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API}/api/categories`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const list: Category[] = data?.data ?? (Array.isArray(data) ? data : []);
        const map = new Map<string, string>();
        list.forEach(c => map.set(c._id, c.name));
        setCategoriesMap(map);
      })
      .catch(() => { });
  }, []);

  // ── Product (+ unique view tracking) ───────────────────────────────────────
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const viewedKey = `viewed_product_${currentId}`;
        const alreadyViewed = localStorage.getItem(viewedKey) === "1";

        const url = `${API}/api/products/${currentId}${alreadyViewed ? "?viewed=1" : ""}`;
        const res = await fetch(url, { credentials: "include" });

        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        const data = await res.json();

        if (!alreadyViewed) localStorage.setItem(viewedKey, "1");

        setProduct(data);

        const relRes = await fetch(`${API}/api/products`);
        if (relRes.ok) {
          const allData = await relRes.json();
          const all: Product[] = Array.isArray(allData)
            ? allData
            : allData.products ?? allData.data ?? [];

          const thisCatId = typeof data.category === "object" ? data.category._id : data.category;

          setRelated(
            all
              .filter(p => {
                const pCatId = typeof p.category === "object" ? p.category._id : p.category;
                return p._id !== data._id && pCatId === thisCatId && p.isApproved && p.stock > 0;
              })
              .slice(0, 3)
          );

          setMostViewed(
            all
              .filter(p => p._id !== data._id && p.isApproved && p.stock > 0)
              .sort((a, b) => (b.views || 0) - (a.views || 0))
              .slice(0, 3)
          );
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [currentId]);

  // ── Comments ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentId) return;
    const fetchComments = async () => {
      setCommentsLoading(true);
      try {
        const res = await fetch(`${API}/api/products/${currentId}/comments`);
        if (res.ok) setComments(await res.json());
      } finally {
        setCommentsLoading(false);
      }
    };
    fetchComments();
  }, [currentId]);

  // ── Wishlist ───────────────────────────────────────────────────────────────
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    if (!apiToken) return;
    fetch(`${API}/api/favourites/ids`, { headers: { Authorization: `Bearer ${apiToken}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.ids && setWishlist(d.ids))
      .catch(() => { });
  }, [apiToken]);

  useEffect(() => {
    if (currentId) setWish(wishlist.includes(currentId));
  }, [currentId, wishlist]);

  const toggleWish = useCallback(async (pid: string) => {
    if (!apiToken || wishPending.has(pid)) return;
    let wasIn = false;
    setWishlist((prev) => { wasIn = prev.includes(pid); return wasIn ? prev.filter((i) => i !== pid) : [...prev, pid]; });
    setWishPending((prev) => new Set(prev).add(pid));
    try {
      const res = await fetch(`${API}/api/favourites/${pid}`, {
        method: wasIn ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (!res.ok) throw new Error();
    } catch {
      setWishlist((prev) => wasIn ? [...prev, pid] : prev.filter((i) => i !== pid));
    } finally {
      setWishPending((prev) => { const s = new Set(prev); s.delete(pid); return s; });
    }
  }, [apiToken, wishPending]);

  const currentUserId = (session as any)?.apiUser?._id as string | undefined;

  // ── Cart: set an exact quantity for a line ─────────────────────────────────
  async function updateCartQty(productId: string, quantity: number) {
    if (quantity < 1) {
      await removeItem(productId);
      return;
    }
    if (typeof cartCtx.updateQuantity === "function") {
      await cartCtx.updateQuantity(productId, quantity);
      return;
    }
    const current: number =
      (cartCtx.cart?.items ?? []).find((i: any) => i.product?._id === productId)?.quantity ?? 0;
    if (quantity === current) return;
    if (quantity > current) {
      await addToCart(productId, quantity - current);
      return;
    }
    await removeItem(productId);
    await addToCart(productId, quantity);
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleRelatedClick(productId: string) {
    setCurrentId(productId);
    setComments([]);
    setReviewPage(1);
    setQty(1);
    setAdded(false);
    setWish(false);
    setCartError(null);
    setEditingId(null);
    setNewContent("");
    setNewRating(5);
    setSubmitError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleCart() {
    if (!product) return;
    if (!session) {
      router.push("/connexion");
      return;
    }
    setCartLoading(true);
    setCartError(null);
    try {
      await addToCart(product._id, qty);
      setAdded(true);
      setCartOpen(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err: any) {
      setCartError(err.message ?? "Erreur lors de l'ajout au panier.");
    } finally {
      setCartLoading(false);
    }
  }

  function handleStartEdit(r: Comment) {
    setEditingId(r._id);
    setNewRating(r.rating);
    setNewContent(r.content);
    setSubmitError(null);
    const form = formRef.current;
    if (form) window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setNewContent("");
    setNewRating(5);
    setSubmitError(null);
  }

  async function handleSubmitComment() {
    if (!newContent.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (!apiToken) { setSubmitError("Vous devez être connecté pour laisser un avis."); return; }
      const res = await fetch(`${API}/api/products/${currentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiToken}` },
        body: JSON.stringify({ rating: newRating, content: newContent }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      const created: Comment = await res.json();
      setComments(prev => [created, ...prev]);
      setReviewPage(1);
      setNewContent("");
      setNewRating(5);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateComment() {
    if (!newContent.trim() || !editingId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${API}/api/products/${currentId}/comments/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiToken}` },
        body: JSON.stringify({ rating: newRating, content: newContent }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      const updated: Comment = await res.json();
      setComments(prev => prev.map(c => c._id === editingId ? updated : c));
      handleCancelEdit();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Supprimer cet avis ?")) return;
    try {
      const res = await fetch(`${API}/api/products/${currentId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (err: any) {
      setSubmitError(err.message);
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const avgRating = comments.length
    ? comments.reduce((sum, c) => sum + c.rating, 0) / comments.length
    : 0;

  const pagedComments = comments.slice(
    (reviewPage - 1) * REVIEWS_PER_PAGE,
    reviewPage * REVIEWS_PER_PAGE
  );

  const drawerItems: DrawerItem[] = (cart?.items ?? []).filter((i: any) => i.product != null);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#FBF6EE" }}>
      <Loader2 size={36} className="pd-spin" style={{ opacity: 0.4, color: "#BE4A1D" }} />
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !product) return (
    <div className="pd-root" style={{ textAlign: "center", paddingTop: "8rem" }}>
      <Package size={40} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
      <p style={{ marginBottom: "1rem", opacity: 0.7 }}>{error ?? "Produit introuvable."}</p>
      <Link href="/boutique" className="pd-related__all">← Retour à la boutique</Link>
    </div>
  );

  const inStock = product.stock > 0;
  const catLabel = resolveCategoryName(product.category, categoriesMap);
  const catId = typeof product.category === "object" ? product.category._id : product.category;
  const relatedList = related.length > 0 ? related : mostViewed;
  const artisan = product.artisan;
  const since = artisan?.createdAt ? new Date(artisan.createdAt).getFullYear() : null;
  const totalPrice = (product.price * qty).toLocaleString("fr-TN");

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="pd-root">
      <div className="pd-wrap">

        {/* Breadcrumb */}
        <motion.nav className="pd-breadcrumb"
          initial="hidden" animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
          {[
            <Link key="a" href="/">Accueil</Link>,
            <Link key="b" href="/boutique">Boutique</Link>,
            <Link key="c" href={`/boutique?cat=${catId}`}>{catLabel}</Link>,
            <span key="d" className="pd-breadcrumb__current">{product.title}</span>,
          ].flatMap((el, i, arr) => [
            <motion.span key={`i${i}`}
              variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}>
              {el}
            </motion.span>,
            i < arr.length - 1 ? <span key={`s${i}`} className="pd-breadcrumb__sep">›</span> : null,
          ])}
        </motion.nav>

        {/* Main */}
        <section className="pd-main">

          <Gallery key={product._id} images={product.images} />

          <aside className="pd-main__side">

            {/* Info card */}
            <motion.div className="pd-info"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: EASE }}>

              <div className="pd-info__side">
                <span>{catLabel || "ARTISANAT TUNISIEN"}</span>
              </div>

              <div className="pd-info__content">
                <motion.p className="pd-info__eyebrow"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6, ease: EASE }}>
                  Fait main · Tunisie
                </motion.p>

                <div className="pd-info__heading">
                  <motion.h1 className="pd-info__title"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.7, ease: EASE }}>
                    {product.title}
                  </motion.h1>

                  <motion.div className="pd-info__price-row"
                    initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 220, damping: 14 }}>
                    <span className="pd-info__price">{product.price.toLocaleString("fr-TN")}</span>
                    <span className="pd-info__currency">TND</span>
                  </motion.div>
                </div>

                <StarRow rating={Math.round(avgRating)} total={comments.length} />

                <motion.p className="pd-info__short-desc" dir="auto"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.7, ease: EASE }}>
                  {product.description}
                </motion.p>

                <motion.div className="pd-actions"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.7, ease: EASE }}>

                  <div className="pd-qty">
                    <motion.button className="pd-qty__btn" aria-label="Diminuer la quantité"
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      disabled={cartLoading || qty <= 1} whileTap={{ scale: 0.85 }}>
                      <Minus size={15} />
                    </motion.button>
                    <span className="pd-qty__val">
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span key={qty} style={{ display: "inline-block" }}
                          initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}
                          transition={{ duration: 0.2 }}>
                          {qty}
                        </motion.span>
                      </AnimatePresence>
                    </span>
                    <motion.button className="pd-qty__btn" aria-label="Augmenter la quantité"
                      onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                      disabled={cartLoading || qty >= product.stock} whileTap={{ scale: 0.85 }}>
                      <Plus size={15} />
                    </motion.button>
                  </div>

                  <motion.button
                    className={`pd-cart-btn${added ? " pd-cart-btn--added" : ""}`}
                    onClick={handleCart}
                    disabled={!inStock || cartLoading}
                    whileHover={inStock && !cartLoading ? { scale: 1.02 } : {}}
                    whileTap={inStock && !cartLoading ? { scale: 0.97 } : {}}>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span key={cartLoading ? "l" : added ? "a" : "i"} className="pd-cart-btn__inner"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}>
                        {cartLoading ? (
                          <><Loader2 size={16} className="pd-spin" /> Chargement</>
                        ) : added ? (
                          <><Check size={16} /> Ajouté</>
                        ) : !inStock ? (
                          "Rupture de stock"
                        ) : (
                          <><ShoppingBag size={16} /> Ajouter au panier · {totalPrice} TND</>
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </motion.div>

                {cartError && <p className="pd-cart-error">{cartError}</p>}

                <motion.button
                  className={`pd-wish-btn${wish ? " pd-wish-btn--on" : ""}`}
                  onClick={() => toggleWish(currentId)}
                  disabled={wishPending.has(currentId)}
                  whileTap={{ scale: 0.96 }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.85, duration: 0.6 }}>
                  <motion.span className="pd-wish-btn__icon"
                    animate={wish ? { scale: [1, 1.5, 1], rotate: [0, -12, 0] } : { scale: 1 }}
                    transition={{ duration: 0.45 }}>
                    <HeartIcon filled={wish} />
                  </motion.span>
                  <span>{wish ? "DANS VOS FAVORIS" : "AJOUTER AUX FAVORIS"}</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Artisan */}
            {artisan && (
              <motion.div className="pd-artisan"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8, ease: EASE }}>
                <div className="pd-artisan__avatar-wrap">
                  {artisan.image ? (
                    <img src={artisan.image} alt={artisan.name} className="pd-artisan__avatar" />
                  ) : (
                    <div className="pd-artisan__avatar">{initials(artisan.name)}</div>
                  )}
                </div>
                <div className="pd-artisan__info">
                  <span className="pd-artisan__label">L'ARTISANE</span>
                  <h3 className="pd-artisan__name">{artisan.name}</h3>
                  {(product.location || since) && (
                    <p className="pd-artisan__meta">
                      {[product.location, since ? `Depuis ${since}` : null].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <Link href={`/Artisanprofile/${artisan._id}`} className="pd-artisan__cta">
                  Boutique
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </motion.div>
            )}
          </aside>
        </section>

        {/* Reviews */}
        <section className="pd-reviews">
          <div className="pd-reviews__top">
            <motion.div
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8, ease: EASE }}>
              <span className="pd-label">Avis</span>
              <h2 className="pd-section-title">Votre expérience compte</h2>
              <p className="pd-reviews__intro">
                {comments.length === 0
                  ? "Aucun avis pour le moment. Soyez le premier à partager votre goût de la tradition."
                  : `${comments.length} avis de clients qui ont goûté la tradition.`}
              </p>
              {comments.length > 0 && (
                <div className="pd-reviews__avg">
                  <strong>{avgRating.toFixed(1)}</strong>
                  <StarRow rating={Math.round(avgRating)} total={comments.length} />
                </div>
              )}
            </motion.div>

            <motion.div ref={formRef}
              className={`pd-review-card${session ? "" : " pd-review-card--login"}`}
              initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8, delay: 0.1, ease: EASE }}>

              {session ? (
                <>
                  {editingId && <h3 className="pd-review-card__title">Modifier votre avis</h3>}

                  <div className="pd-review-card__rating">
                    <span className="pd-review-card__rating-label">Votre note</span>
                    <div className="pd-review-card__stars" onMouseLeave={() => setHoverRating(0)}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <motion.button key={i} type="button" className="pd-review-card__star"
                          aria-label={`Note ${i + 1}`}
                          onClick={() => setNewRating(i + 1)}
                          onMouseEnter={() => setHoverRating(i + 1)}
                          whileTap={{ scale: 0.8 }}>
                          <motion.svg width="22" height="22" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinejoin="round"
                            stroke="#D39A3F"
                            animate={{
                              fill: i < (hoverRating || newRating) ? "#D39A3F" : "rgba(211,154,63,0)",
                              scale: i < (hoverRating || newRating) ? 1 : 0.9,
                            }}
                            transition={{ duration: 0.2 }}>
                            <path d={STAR_PATH} />
                          </motion.svg>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <textarea rows={4} placeholder="Racontez-nous…"
                    value={newContent} onChange={e => setNewContent(e.target.value)} />

                  {submitError && <p className="pd-review-card__error">{submitError}</p>}

                  <div className="pd-review-card__actions">
                    <motion.button ref={publishBtnRef} className="pd-review-card__submit"
                      onClick={editingId ? handleUpdateComment : handleSubmitComment}
                      disabled={submitting || !newContent.trim()}
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                      {submitting ? <Loader2 size={16} className="pd-spin" />
                        : editingId ? "ENREGISTRER" : "PUBLIER L'AVIS"}
                    </motion.button>
                    {editingId && (
                      <motion.button className="pd-review-card__cancel" onClick={handleCancelEdit}
                        whileTap={{ scale: 0.98 }}>
                        ANNULER
                      </motion.button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="pd-review-card__title">Laisser un avis</h3>
                  <p>Connectez-vous pour laisser un avis.</p>
                  <Link href="/connexion" className="pd-review-card__login-link">SE CONNECTER →</Link>
                </>
              )}
            </motion.div>
          </div>

          {commentsLoading ? (
            <div className="pd-reviews__loading"><Loader2 size={28} className="pd-spin" /></div>
          ) : comments.length > 0 && (
            <div ref={reviewListRef}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={reviewPage} className="pd-review-list"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: EASE }}>
                  {pagedComments.map(r => {
                    const isMine = currentUserId === r.user._id;
                    return (
                      <article key={r._id} className="pd-review">
                        <div className="pd-review__footer">
                          <div className="pd-review__avatar">
                            {r.user.image ? <img src={r.user.image} alt={r.user.name} /> : r.user.name?.[0]?.toUpperCase()}
                          </div>
                          <span className="pd-review__name">{r.user.name}</span>
                          <div className="pd-review__stars">
                            {Array.from({ length: 5 }).map((_, si) => (
                              <svg key={si} width="11" height="11" viewBox="0 0 24 24"
                                fill={si < r.rating ? "#D39A3F" : "none"} stroke="#D39A3F" strokeWidth="1.5" strokeLinejoin="round">
                                <path d={STAR_PATH} />
                              </svg>
                            ))}
                          </div>
                          {isMine && (
                            <div className="pd-review__actions">
                              <motion.button className="pd-review__action-btn" title="Modifier"
                                onClick={() => handleStartEdit(r)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </motion.button>
                              <motion.button className="pd-review__action-btn pd-review__action-btn--delete" title="Supprimer"
                                onClick={() => handleDeleteComment(r._id)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6M14 11v6" />
                                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                </svg>
                              </motion.button>
                            </div>
                          )}
                        </div>
                        <br />
                        <p className="pd-review__text">{r.content}</p>

                      </article>
                    );
                  })}
                </motion.div>
              </AnimatePresence>

              {totalReviewPages > 1 && (
                <nav className="pd-pager" aria-label="Pagination des avis">
                  <button className="pd-pager__arrow" aria-label="Page précédente"
                    onClick={() => goToReviewPage(reviewPage - 1)} disabled={reviewPage === 1}>‹</button>

                  {getPageList(totalReviewPages, reviewPage).map((p, i) =>
                    p === "…" ? (
                      <span key={`e${i}`} className="pd-pager__dots">…</span>
                    ) : (
                      <button key={p}
                        className={`pd-pager__num${p === reviewPage ? " pd-pager__num--on" : ""}`}
                        aria-current={p === reviewPage ? "page" : undefined}
                        onClick={() => goToReviewPage(p)}>
                        {p}
                      </button>
                    )
                  )}

                  <button className="pd-pager__arrow" aria-label="Page suivante"
                    onClick={() => goToReviewPage(reviewPage + 1)} disabled={reviewPage === totalReviewPages}>›</button>
                </nav>
              )}

              <p className="pd-pager__info">
                {(reviewPage - 1) * REVIEWS_PER_PAGE + 1}–{Math.min(reviewPage * REVIEWS_PER_PAGE, comments.length)} sur {comments.length} avis
              </p>
            </div>
          )}
        </section>

        {/* Related */}
        <section className="pd-related">
          <motion.div className="pd-related__head"
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}>
            <div>
              <span className="pd-label">Vous aimerez aussi</span>
              <h2 className="pd-section-title" style={{ margin: 0 }}>
                {related.length > 0 ? "Pièces similaires" : "Tu pourrais aimer aussi"}
              </h2>
            </div>
            <Link href="/boutique" className="pd-related__all">Tout voir</Link>
          </motion.div>

          {relatedList.length === 0 ? (
            <p style={{ opacity: 0.45, textAlign: "center", padding: "2rem" }}>
              Aucune pièce similaire pour le moment.
            </p>
          ) : (
            <div className="pd-related__grid">
              {relatedList.map((p, i) => (
                <motion.article key={p._id} className="pd-rel-card"
                  initial={{ opacity: 0, y: 44 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.8, delay: i * 0.12, ease: EASE }}
                  whileHover={{ y: -8 }}
                  onClick={() => handleRelatedClick(p._id)}>
                  <div className="pd-rel-card__media">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.title} loading="lazy" />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Package size={28} style={{ opacity: 0.4 }} />
                      </div>}
                    <span className="pd-rel-card__cat">{resolveCategoryName(p.category, categoriesMap)}</span>
                  </div>
                  <div className="pd-rel-card__body">
                    <div className="pd-rel-card__top">
                      <h4 className="pd-rel-card__name">{p.title}</h4>
                      <span className="pd-rel-card__price">{p.price.toLocaleString("fr-TN")}<small>TND</small></span>
                    </div>
                    <span className="pd-rel-card__loc"><Pin />{p.artisan?.city?.toUpperCase() ?? "TUNISIE"}</span>
                    <span className="pd-rel-card__cta">Voir la pièce <span>→</span></span>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </div>

      <CartDrawer
        open={cartOpen}
        onClose={closeCart}
        items={drawerItems}
        onRemove={removeItem}
        onUpdateQty={updateCartQty}
        onCheckout={() => { closeCart(); router.push("/Commande"); }}
      />
    </div>
  );
}