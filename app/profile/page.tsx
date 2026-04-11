"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Calendar,
  Heart,
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
  category: string;
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

// ─── FavCard ──────────────────────────────────────────────────────────────────

function FavCard({
  item,
  index,
  apiToken,
  onRemoved,
}: {
  item: FavProduct;
  index: number;
  apiToken?: string;
  onRemoved: (id: string) => void;
}) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!apiToken || removing) return;
    setRemoving(true);
    try {
      const res = await fetch(`${API}/api/favourites/${item._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (res.ok) onRemoved(item._id);
    } catch {
      // silently fail — button re-enables
    } finally {
      setRemoving(false);
    }
  };

  return (
    <motion.div
      className="profile-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: "0 8px 32px rgba(44,24,16,0.13)" }}
      layout
    >
      {item.images?.[0] ? (
        <img src={item.images[0]} alt={item.title} className="profile-card-img" />
      ) : (
        <div
          className="profile-card-img"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f0ebe3",
            opacity: 0.6,
          }}
        >
          <Package size={32} />
        </div>
      )}

      <motion.button
        className="profile-heart-btn liked"
        onClick={handleRemove}
        disabled={removing}
        whileTap={{ scale: 0.8 }}
        whileHover={{ scale: 1.15 }}
        style={{ opacity: removing ? 0.5 : 1, cursor: removing ? "wait" : "pointer" }}
        aria-label="Retirer des favoris"
      >
        {removing ? (
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <Heart size={16} fill="currentColor" />
        )}
      </motion.button>

      <div className="profile-card-body">
        <p className="profile-card-title">{item.title}</p>
        <p className="profile-card-artisan">{item.description?.slice(0, 60)}…</p>
        <div className="profile-card-footer">
          <span className="profile-card-category">{item.category}</span>
          <span className="profile-card-price">
            {item.price.toLocaleString("fr-TN")} TND
          </span>
        </div>
      </div>
    </motion.div>
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

  // user profile
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // favourites
  const [favourites, setFavourites] = useState<FavProduct[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(false);
  const [favError, setFavError] = useState<string | null>(null);

  // ── Redirect if unauthenticated ────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/connexion");
  }, [status, router]);

  // ── Step 1: sync-token (no apiToken yet) ──────────────────────────────────
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
        if (!cancelled) setFavourites(data.favourites ?? []);
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

  // ── Remove from local list after successful API delete ────────────────────
  const handleRemoved = (productId: string) => {
    setFavourites((prev) => prev.filter((f) => f._id !== productId));
  };

  const memberSince = formatDate(user?.createdAt);
  const isActive = user?.status === "active";

  return (
    <div className="profile-page">

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
          {user?.image && (
            <img
              src={user.image}
              alt={user.name ?? undefined}
              className="profile-avatar"
            />
          )}
          <div
            className="profile-avatar-fallback"
            style={{ display: user?.image ? "none" : "flex" }}
          >
            {loadingUser ? "…" : getInitials(user?.name || sessionUser?.name)}
          </div>
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
                  {user.provider.charAt(0).toUpperCase() + user.provider.slice(1)}
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
              className={`profile-tab-btn${activeTab === "favoris" ? " active" : ""}`}
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
                {/* Loading */}
                {loadingFavs && (
                  <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
                    <Loader2
                      size={28}
                      style={{ animation: "spin 1s linear infinite", opacity: 0.5 }}
                    />
                  </div>
                )}

                {/* Error */}
                {!loadingFavs && favError && (
                  <div style={{ textAlign: "center", padding: "2rem", opacity: 0.7 }}>
                    <p>{favError}</p>
                  </div>
                )}

                {/* Empty */}
                {!loadingFavs && !favError && favourites.length === 0 && (
                  <div style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>
                    <HeartOff size={36} style={{ margin: "0 auto 1rem" }} />
                    <p>Vous n'avez pas encore de favoris.</p>
                  </div>
                )}

                {/* Grid */}
                {!loadingFavs && !favError && favourites.length > 0 && (
                  <motion.div className="profile-grid" layout>
                    <AnimatePresence>
                      {favourites.map((item, i) => (
                        <FavCard
                          key={item._id}
                          item={item}
                          index={i}
                          apiToken={apiToken}
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
                  ? user.provider.charAt(0).toUpperCase() + user.provider.slice(1)
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}