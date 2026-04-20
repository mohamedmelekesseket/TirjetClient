"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Calendar,
  HeartOff,
  Lock,
  Loader2,
  Mail,
  Package,
  Sparkles,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiUser = {
  _id: string;
  name: string;
  email: string;
  image?: string;
  provider?: "credentials" | "google" | "facebook";
  role?: "user" | "vendor" | "admin";
  isVerified?: boolean;
  status?: "active" | "pending" | "blocked";
  createdAt?: string;
};

type FavProduct = {
  _id: string;
  favouriteId: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string | { _id: string; name: string; slug?: string };
  location?: string;
  material?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function getInitials(name?: string) {
  return (
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

function getCategoryLabel(
  category: FavProduct["category"],
  map: Record<string, string> = {}
): string {
  if (!category) return "";
  if (typeof category === "object") return category.name || category.slug || "";
  // raw string: check map first, then fall back to raw value
  return map[category] || category;
}

function safePrice(price: any): number {
  if (typeof price === "number") return price;
  if (typeof price === "object" && price !== null) return 0;
  return Number(price) || 0;
}

// ─── Heart SVG ────────────────────────────────────────────────────────────────

function HeartFilled() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

// ─── FavCard (styled like ProductCard from ArtisanProfilePage) ────────────────

function FavCard({
  item,
  apiToken,
  categoryMap,
  onRemoved,
}: {
  item: FavProduct;
  apiToken?: string;
  categoryMap: Record<string, string>;
  onRemoved: (id: string) => void;
}) {
  const [removing, setRemoving] = useState(false);

  const categoryLabel = getCategoryLabel(item.category, categoryMap);
  const price = safePrice(item.price);

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!apiToken || removing) return;
    setRemoving(true);
    try {
      const res = await fetch(`${API}/api/favourites/${item._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (res.ok) onRemoved(item._id);
    } catch {
      // silently fail
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Link href={`/boutique/${item._id}`}>
      <motion.article
        className="artp-prod-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        whileHover={{ y: -6 }}
        layout
      >
        {/* Media */}
        <div className="artp-prod-card__media">
          {item.images?.[0] ? (
            <motion.img
              src={item.images[0]}
              alt={item.title}
              loading="lazy"
              whileHover={{ scale: 1.07 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#f0ebe3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package size={28} style={{ opacity: 0.4 }} />
            </div>
          )}
          <div className="artp-prod-card__shade" />
          <span className="artp-prod-card__cat">{categoryLabel}</span>

          {/* Heart button — always filled (it's a fav), click removes */}
          <motion.button
            className="artp-prod-card__wish artp-prod-card__wish--on"
            onClick={handleRemove}
            disabled={removing}
            whileTap={{ scale: 0.82 }}
            aria-label="Retirer des favoris"
            style={{ opacity: removing ? 0.5 : 1, cursor: removing ? "wait" : "pointer" }}
          >
            {removing ? (
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <HeartFilled />
            )}
          </motion.button>
        </div>

        {/* Body */}
        <div className="artp-prod-card__body">
          <div className="artp-prod-card__top">
            <h3 className="artp-prod-card__title">{item.title}</h3>
            <span className="artp-prod-card__price">
              {price.toLocaleString("fr-TN")} TND
            </span>
          </div>
          <p className="artp-prod-card__desc">
            {item.description?.slice(0, 120)}
          </p>
          <div className="artp-prod-card__foot">
            <span className="artp-prod-card__loc">
              {item.location ?? categoryLabel}
            </span>
            <span className="artp-prod-card__cta">Voir la pièce →</span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

// ─── UserProfile ──────────────────────────────────────────────────────────────

export default function UserProfile() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const apiToken = (session as any)?.apiToken as string | undefined;
  const sessionUser = session?.user
    ? {
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
        image: session.user.image ?? undefined,
      }
    : undefined;

  const [activeTab, setActiveTab] = useState("favoris");

  const [user, setUser] = useState<ApiUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const [favourites, setFavourites] = useState<FavProduct[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(false);
  const [favError, setFavError] = useState<string | null>(null);

  // map: categoryId → categoryName (for raw-id categories)
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

  // ── Redirect if unauthenticated ────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/connexion");
  }, [status, router]);

  // ── Step 1: sync-token ────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== "authenticated") return;
    if (apiToken) return;

    let cancelled = false;
    (async () => {
      try {
        setLoadingUser(true);
        setLoadError(null);
        const r = await fetch("/api/auth/sync-token", { method: "POST" });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "sync-token failed");
        if (!cancelled)
          await update({ apiToken: data.token, apiUser: data.user } as any);
      } catch (e: any) {
        if (!cancelled)
          setLoadError(
            e.message?.includes("INTERNAL_API_KEY")
              ? "INTERNAL_API_KEY manquant — vérifiez les variables Vercel et Railway."
              : "Impossible de lier votre session au serveur."
          );
        if (!cancelled) setLoadingUser(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, apiToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 2: fetch /api/auth/me ────────────────────────────────────────────
  useEffect(() => {
    if (!apiToken) return;

    let cancelled = false;
    (async () => {
      try {
        setLoadingUser(true);
        setLoadError(null);
        const resp = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        });
        if (!resp.ok) throw new Error(`/api/auth/me returned ${resp.status}`);
        const me = (await resp.json()) as ApiUser;
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setLoadError("Impossible de charger votre profil.");
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiToken]);

  // ── Step 3: fetch favourites ──────────────────────────────────────────────
  useEffect(() => {
    if (!apiToken) return;

    let cancelled = false;
    (async () => {
      try {
        setLoadingFavs(true);
        setFavError(null);
        const resp = await fetch(`${API}/api/favourites`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        });
        if (!resp.ok) throw new Error(`/api/favourites returned ${resp.status}`);
        const data = await resp.json();
        const items: FavProduct[] = (data.favourites ?? []).filter(
          (f: any) => f != null && f._id != null
        );
        if (!cancelled) setFavourites(items);

        // ── Step 4: resolve raw category IDs → names ──────────────────────
        const rawIds = items
          .map((f) => f.category)
          .filter((c): c is string => typeof c === "string");
        const uniqueIds = [...new Set(rawIds)];

        if (uniqueIds.length > 0) {
          try {
            const catRes = await fetch(
              `${API}/api/categories?ids=${uniqueIds.join(",")}`
            );
            if (catRes.ok) {
              const catData = await catRes.json();
              const map: Record<string, string> = {};
              (catData.categories ?? catData ?? []).forEach((c: any) => {
                map[c._id] = c.name;
              });
              if (!cancelled) setCategoryMap(map);
            }
          } catch {
            // silently fail — raw IDs will show as fallback
          }
        }
      } catch {
        if (!cancelled) setFavError("Impossible de charger vos favoris.");
      } finally {
        if (!cancelled) setLoadingFavs(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiToken]);

  useEffect(() => {
    setImgError(false);
  }, [user?.image]);

  const handleRemoved = (productId: string) => {
    setFavourites((prev) => prev.filter((f) => f._id !== productId));
  };

  const memberSince = formatDate(user?.createdAt);
  const isActive = user?.status === "active";

  return (
    <div className="profile-page">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── ERROR BANNER ── */}
      {loadError && (
        <div className="profile-error-wrap">
          <div className="profile-error-box">
            {loadError}
            <button
              className="profile-error-retry"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <motion.section
        className="profile-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <motion.div
          className="profile-avatar-wrap"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {user?.image && !imgError ? (
            <img
              src={user.image}
              alt={user?.name ?? undefined}
              className="profile-avatar"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="profile-avatar-fallback">
              {loadingUser ? "…" : getInitials(user?.name || sessionUser?.name)}
            </div>
          )}
          {user?.isVerified && (
            <motion.div
              className="profile-verified-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.55, type: "spring", stiffness: 300 }}
              title="Compte vérifié"
            >
              <BadgeCheck size={16} />
            </motion.div>
          )}
        </motion.div>

        <div className="profile-hero-info">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
                flexWrap: "wrap",
              }}
            >
              <span className="profile-role-pill">
                <Sparkles size={14} />
                {user?.role || "-"}
              </span>
              {user?.provider && (
                <span className="profile-provider-pill">
                  <span>
                    {user.provider === "google"
                      ? "G"
                      : user.provider === "facebook"
                      ? "f"
                      : "•"}
                  </span>
                  {user.provider.charAt(0).toUpperCase() +
                    user.provider.slice(1)}
                </span>
              )}
            </div>

            <h1 className="profile-hero-name">
              {loadingUser
                ? "Chargement..."
                : user?.name || sessionUser?.name || "Profil"}
            </h1>

            <div className="profile-hero-meta">
              <span className="profile-meta-item">
                <Mail size={14} />
                {user?.email || sessionUser?.email || "-"}
              </span>
              {memberSince && (
                <span className="profile-meta-item">
                  <Calendar size={14} />
                  Membre depuis {memberSince}
                </span>
              )}
              <span
                className={`profile-meta-item ${
                  isActive ? "profile-meta-active" : "profile-meta-inactive"
                }`}
              >
                <span
                  className="profile-status-dot"
                  style={{ background: isActive ? "#22c55e" : "#ef4444" }}
                />
                {loadingUser ? "…" : isActive ? "Actif" : "Inactif"}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── BODY ── */}
      <div className="profile-layout">
        <main>
          <div className="profile-tabs">
            <button
              className={`profile-tab-btn${
                activeTab === "favoris" ? " active" : ""
              }`}
              onClick={() => setActiveTab("favoris")}
            >
              Favoris ({loadingFavs ? "…" : favourites.length})
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "favoris" && (
              <motion.div
                key="favoris"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {loadingFavs && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: "3rem",
                    }}
                  >
                    <Loader2
                      size={28}
                      style={{
                        animation: "spin 1s linear infinite",
                        opacity: 0.5,
                      }}
                    />
                  </div>
                )}

                {!loadingFavs && favError && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      opacity: 0.7,
                    }}
                  >
                    <p>{favError}</p>
                  </div>
                )}

                {!loadingFavs && !favError && favourites.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      opacity: 0.5,
                    }}
                  >
                    <HeartOff size={36} style={{ margin: "0 auto 1rem" }} />
                    <p>Vous n'avez pas encore de favoris.</p>
                  </div>
                )}

                {!loadingFavs && !favError && favourites.length > 0 && (
                  <motion.div className="artp-prod-grid" layout>
                    <AnimatePresence>
                      {favourites.map((item) => (
                        <FavCard
                          key={item._id}
                          item={item}
                          apiToken={apiToken}
                          categoryMap={categoryMap}
                          onRemoved={handleRemoved}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <aside>
          <motion.div
            className="profile-info-card"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="profile-info-title">Informations</div>
            {[
              {
                icon: <Mail size={16} />,
                label: "Email",
                value: user?.email || sessionUser?.email || "-",
              },
              {
                icon: <Lock size={16} />,
                label: "Connexion via",
                value: user?.provider
                  ? user.provider.charAt(0).toUpperCase() +
                    user.provider.slice(1)
                  : "-",
              },
              {
                icon: <Calendar size={16} />,
                label: "Membre depuis",
                value: memberSince || "-",
              },
              {
                icon: <BadgeCheck size={16} />,
                label: "Statut",
                value: user?.isVerified ? "Vérifié" : "Non vérifié",
              },
            ].map(({ icon, label, value }) => (
              <div className="profile-info-row" key={label}>
                <div className="profile-info-icon">{icon}</div>
                <div>
                  <div className="profile-info-label">{label}</div>
                  <div className="profile-info-value">{value}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </aside>
      </div>
    </div>
  );
}