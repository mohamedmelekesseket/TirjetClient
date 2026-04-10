"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Calendar,
  Heart,
  HeartOff,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";

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

const FAVOURITES = [
  {
    id: 1,
    title: "Collier de perles",
    artisan: "Fatma Ben Amor",
    category: "Bijoux",
    price: "185 TND",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80",
    badge: "DERNIÈRE PIÈCE",
  },
  {
    id: 2,
    title: "Tapis Margoum",
    artisan: "Sami Trabelsi",
    category: "Margoum",
    price: "340 TND",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80",
    badge: null,
  },
  {
    id: 3,
    title: "Poterie Nabeul",
    artisan: "Leila Gharbi",
    category: "Poterie",
    price: "95 TND",
    image: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80",
    badge: "NOUVEAU",
  },
  {
    id: 4,
    title: "Broderie traditionnelle",
    artisan: "Nour Mansour",
    category: "Tissage",
    price: "210 TND",
    image: "https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?w=400&q=80",
    badge: null,
  },
  {
    id: 5,
    title: "Lanterne ciselée",
    artisan: "Karim Ezzine",
    category: "Métal",
    price: "130 TND",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80",
    badge: null,
  },
  {
    id: 6,
    title: "Sac en alfa",
    artisan: "Amira Saïd",
    category: "Vannerie",
    price: "75 TND",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
    badge: "POPULAIRE",
  },
];

type FavouriteItem = (typeof FAVOURITES)[number];

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function getInitials(name?: string) {
  return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function FavCard({ item, index }: { item: FavouriteItem; index: number }) {
  const [liked, setLiked] = useState(true);
  return (
    <motion.div
      className="profile-card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: "0 8px 32px rgba(44,24,16,0.13)" }}
    >
      <img src={item.image} alt={item.title} className="profile-card-img" />
      {item.badge && <span className="profile-card-badge">{item.badge}</span>}
      <motion.button
        className={`profile-heart-btn${liked ? " liked" : ""}`}
        onClick={() => setLiked((l) => !l)}
        whileTap={{ scale: 0.8 }}
        whileHover={{ scale: 1.15 }}
        aria-label="Retirer des favoris"
      >
        {liked ? <Heart size={16} fill="currentColor" /> : <HeartOff size={16} />}
      </motion.button>
      <div className="profile-card-body">
        <p className="profile-card-title">{item.title}</p>
        <p className="profile-card-artisan">par {item.artisan}</p>
        <div className="profile-card-footer">
          <span className="profile-card-category">{item.category}</span>
          <span className="profile-card-price">{item.price}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function UserProfile() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [activeTab, setActiveTab] = useState("favoris");
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const apiToken = (session as any)?.apiToken as string | undefined;
  const sessionUser = session?.user
    ? {
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
        image: session.user.image ?? undefined,
      }
    : undefined;

  const fetchedRef = useRef(false);
  const meFetchedRef = useRef(false);

  // ── Redirect if not logged in ────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/connexion");
  }, [status, router]);

  // ── Step 1: authenticated but no apiToken → call sync-token ─────────────
  useEffect(() => {
    if (status !== "authenticated") return;
    if (apiToken) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    (async () => {
      try {
        setLoadingUser(true);
        setLoadError(null);
        const r = await fetch("/api/auth/sync-token", { method: "POST" });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "sync-token failed");
        await update({ apiToken: data.token, apiUser: data.user } as any);
      } catch (e: any) {
        setLoadError(
          e.message?.includes("INTERNAL_API_KEY")
            ? "INTERNAL_API_KEY manquant — vérifiez les variables Vercel et Railway."
            : "Impossible de lier votre session au serveur. Vérifiez INTERNAL_API_KEY (Vercel + Railway) et API_URL."
        );
        setLoadingUser(false);
      }
    })();
  }, [status, apiToken, update]);

  // ── Step 2: have apiToken → fetch /api/auth/me once ─────────────────────
  useEffect(() => {
    if (!apiToken) return;
    if (meFetchedRef.current) return;
    meFetchedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        setLoadingUser(true);
        setLoadError(null);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const resp = await fetch(`${apiUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        });
        if (!resp.ok) throw new Error(`/api/auth/me returned ${resp.status}`);
        const me = (await resp.json()) as ApiUser;
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled)
          setLoadError(
            "Impossible de charger votre profil. Vérifiez la configuration API/CORS (Railway) puis réessayez."
          );
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    })();

    return () => { cancelled = true; };
  }, [apiToken]);

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
              onClick={() => {
                fetchedRef.current = false;
                meFetchedRef.current = false;
                window.location.reload();
              }}
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
            <img src={user.image} alt={user.name ?? undefined} className="profile-avatar" />
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
              <span className="profile-role-pill">
                <Sparkles size={14} />
                {user?.role || sessionUser?.role || "-"}
              </span>
              {user?.provider && (
                <span className="profile-provider-pill">
                  <span>{user.provider === "google" ? "G" : user.provider === "facebook" ? "f" : "•"}</span>
                  {user.provider.charAt(0).toUpperCase() + user.provider.slice(1)}
                </span>
              )}
            </div>

            <h1 className="profile-hero-name">
              {loadingUser ? "Chargement..." : user?.name || sessionUser?.name || "Profil"}
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
              <span className={`profile-meta-item ${isActive ? "profile-meta-active" : "profile-meta-inactive"}`}>
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
            {[{ key: "favoris", label: `Favoris (${FAVOURITES.length})` }].map(({ key, label }) => (
              <button
                key={key}
                className={`profile-tab-btn${activeTab === key ? " active" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
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
                <div className="profile-grid">
                  {FAVOURITES.map((item, i) => (
                    <FavCard key={item.id} item={item} index={i} />
                  ))}
                </div>
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
              { icon: <Mail size={16} />, label: "Email", value: user?.email || sessionUser?.email || "-" },
              {
                icon: <Lock size={16} />,
                label: "Connexion via",
                value: user?.provider
                  ? user.provider.charAt(0).toUpperCase() + user.provider.slice(1)
                  : "-",
              },
              { icon: <Calendar size={16} />, label: "Membre depuis", value: memberSince || "-" },
              { icon: <BadgeCheck size={16} />, label: "Statut", value: user?.isVerified ? "Vérifié" : "Non vérifié" },
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