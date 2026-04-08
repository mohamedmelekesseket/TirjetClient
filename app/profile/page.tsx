"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Calendar,
  Heart,
  HeartOff,
  Lock,
  Mail,
  Sparkles,
  User,
  LogOut,
} from "lucide-react";
import Link from "next/link";

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

const s: any = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #faf6f1 0%, #f5ede3 50%, #faf6f1 100%)",
    fontFamily: "'Cormorant Garamond', 'Georgia', serif",
    color: "#2c1810",
  },
  hero: {
    padding: "52px 80px 44px",
    display: "flex",
    alignItems: "flex-start",
    gap: 32,
    maxWidth: 1200,
    margin: "0 0",
  },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 18,
    objectFit: "cover",
    border: "3px solid rgba(205,133,80,0.3)",
    display: "block",
    background: "#e8d5c0",
  },
  avatarFallback: {
    width: 110,
    height: 110,
    borderRadius: 18,
    background: "linear-gradient(135deg, #cd8550 0%, #e8a070 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 40,
    fontWeight: 700,
    flexShrink: 0,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#22c55e",
    border: "2.5px solid #faf6f1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 14,
  },
  heroInfo: { flex: 1 },
  heroName: {
    fontSize: 38,
    fontWeight: 700,
    margin: "0 0 6px",
    letterSpacing: "-0.01em",
    color: "#1a0f09",
  },
  heroMeta: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
    color: "#7a5a50",
  },
  rolePill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 14px",
    borderRadius: 50,
    background: "linear-gradient(135deg, #cd8550 0%, #e8a070 100%)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.04em",
    marginBottom: 8,
  },
  providerPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 14px",
    borderRadius: 50,
    background: "rgba(205,133,80,0.12)",
    color: "#cd8550",
    fontSize: 12,
    fontWeight: 500,
    border: "1px solid rgba(205,133,80,0.25)",
    marginLeft: 8,
  },
  layout: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 80px 80px",
    display: "grid",
    gridTemplateColumns: "1fr 300px",
    gap: 48,
    alignItems: "start",
  },
  tabs: {
    display: "flex",
    gap: 0,
    borderBottom: "2px solid rgba(205,133,80,0.15)",
    marginBottom: 28,
  },
  tabBtn: (active: boolean) => ({
    padding: "12px 28px",
    background: "none",
    border: "none",
    borderBottom: active ? "2px solid #cd8550" : "2px solid transparent",
    marginBottom: -2,
    color: active ? "#cd8550" : "#7a5a50",
    fontSize: 16,
    fontWeight: active ? 700 : 400,
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.01em",
    transition: "all 0.2s",
  }),
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 18,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 2px 16px rgba(44,24,16,0.07)",
    cursor: "pointer",
    position: "relative",
  },
  cardImg: {
    width: "100%",
    aspectRatio: "4/3",
    objectFit: "cover",
    display: "block",
    background: "#e8d5c0",
  },
  cardBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    padding: "4px 10px",
    borderRadius: 50,
    background: "linear-gradient(135deg, #cd8550 0%, #e8a070 100%)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
  },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.92)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 16,
    boxShadow: "0 2px 8px rgba(44,24,16,0.12)",
    transition: "transform 0.15s",
  },
  cardBody: { padding: "12px 14px 14px" },
  cardTitle: { fontSize: 15, fontWeight: 700, margin: "0 0 3px", color: "#1a0f09" },
  cardArtisan: { fontSize: 12, color: "#9a7060", margin: "0 0 8px" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardCategory: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    color: "#cd8550",
    textTransform: "uppercase",
    padding: "3px 10px",
    borderRadius: 50,
    background: "rgba(205,133,80,0.1)",
  },
  cardPrice: { fontSize: 15, fontWeight: 700, color: "#2c1810" },
  sidebar: {},
  infoCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "28px 24px",
    boxShadow: "0 2px 20px rgba(44,24,16,0.07)",
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 20,
    color: "#1a0f09",
    letterSpacing: "-0.01em",
  },
  infoRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 18,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "rgba(205,133,80,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    flexShrink: 0,
  },
  infoLabel: { fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#9a7060", textTransform: "uppercase", marginBottom: 2 },
  infoValue: { fontSize: 14, color: "#2c1810", fontWeight: 500, wordBreak: "break-all" },
  empty: {
    gridColumn: "1/-1",
    textAlign: "center",
    padding: "60px 0",
    color: "#9a7060",
  },
};

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
      style={s.card}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: "0 8px 32px rgba(44,24,16,0.13)" }}
    >
      <img src={item.image} alt={item.title} style={s.cardImg} />
      {item.badge && <span style={s.cardBadge}>{item.badge}</span>}
      <motion.button
        style={{ ...s.heartBtn, color: liked ? "#ef4444" : "#9a7060" }}
        onClick={() => setLiked((l) => !l)}
        whileTap={{ scale: 0.8 }}
        whileHover={{ scale: 1.15 }}
        aria-label="Retirer des favoris"
      >
        {liked ? <Heart size={16} fill="currentColor" /> : <HeartOff size={16} />}
      </motion.button>
      <div style={s.cardBody}>
        <p style={s.cardTitle}>{item.title}</p>
        <p style={s.cardArtisan}>par {item.artisan}</p>
        <div style={s.cardFooter}>
          <span style={s.cardCategory}>{item.category}</span>
          <span style={s.cardPrice}>{item.price}</span>
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

  // Pull token/user from session — cast once here
  const apiToken = (session as any)?.apiToken as string | undefined;
  const sessionUser = session?.user
    ? {
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
        image: session.user.image ?? undefined,
      }
    : undefined;
  const displayName =
    ((session as any)?.apiUser as { name?: string } | undefined)?.name ||
    sessionUser?.name ||
    sessionUser?.email ||
    "Compte";

  // Use a ref so the fetch effect doesn't re-run while token is being injected
  const fetchedRef = useRef(false);
  const meFetchedRef = useRef(false);

  // ── Redirect if not logged in ──────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/connexion");
  }, [status, router]);

  // ── Step 1: if authenticated but no apiToken yet, call sync-token ──────────
  useEffect(() => {
    if (status !== "authenticated") return;
    if (apiToken) return; // already have it — skip
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    (async () => {
      try {
        setLoadingUser(true);
        setLoadError(null);
        const r = await fetch("/api/auth/sync-token", { method: "POST" });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "sync-token failed");
        // Inject token+user into the NextAuth session; the session update triggers
        // a re-render with the new apiToken, which runs Step 2 below.
        await update({ apiToken: data.token, apiUser: data.user } as any);
      } catch (e: any) {
        setLoadError(
          e.message?.includes("INTERNAL_API_KEY")
            ? "INTERNAL_API_KEY manquant — vérifiez les variables Vercel et Railway."
            : "Impossible de lier votre session au serveur. Vérifiez INTERNAL_API_KEY (Vercel + Railway) et API_URL."
        );
        setLoadingUser(false);
      }
      // Don't set loadingUser(false) here — Step 2 will do it after /me succeeds
    })();
  }, [status, apiToken, update]);

  // ── Step 2: once we have apiToken, fetch /api/auth/me (run once only) ────────
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
      } catch (err: any) {
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

  return (
    <div style={s.page}>
      {/* ── ERROR BANNER ── */}
      {loadError && (
        <div style={{ maxWidth: 980, margin: "100px auto 0", padding: "0 24px" }}>
          <div
            style={{
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#7f1d1d",
              borderRadius: 16,
              padding: "14px 16px",
              fontSize: 14,
            }}
          >
            {loadError}{" "}
            <button
              onClick={() => { fetchedRef.current = false; window.location.reload(); }}
              style={{
                marginLeft: 8,
                border: "none",
                background: "transparent",
                textDecoration: "underline",
                cursor: "pointer",
                color: "inherit",
                fontWeight: 700,
              }}
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <motion.section
        style={{ ...s.hero, marginTop: 80 /* clear global Header */ }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        {/* Avatar */}
        <motion.div
          style={s.avatarWrap}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {user?.image ? (
            <img src={user.image ?? undefined} alt={user.name ?? undefined} style={s.avatar} />
          ) : null}
          <div style={{ ...s.avatarFallback, display: user?.image ? "none" : "flex" }}>
            {loadingUser ? "…" : getInitials(user?.name || sessionUser?.name)}
          </div>
          {user?.isVerified && (
            <motion.div
              style={s.verifiedBadge}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.55, type: "spring", stiffness: 300 }}
              title="Compte vérifié"
            >
              <BadgeCheck size={16} />
            </motion.div>
          )}
        </motion.div>

        {/* Info */}
        <div style={s.heroInfo}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ ...s.rolePill, gap: 8 }}>
                <Sparkles size={14} />
                Membre
              </span>
              {user?.provider && (
                <span style={s.providerPill}>
                  <span>{user.provider === "google" ? "G" : user.provider === "facebook" ? "f" : "•"}</span>
                  {user.provider.charAt(0).toUpperCase() + user.provider.slice(1)}
                </span>
              )}
            </div>
            <h1 style={s.heroName}>
              {loadingUser
                ? "Chargement..."
                : user?.name || sessionUser?.name || "Profil"}
            </h1>
            <div style={s.heroMeta}>
              <span style={s.metaItem}>
                <Mail size={14} />
                {user?.email || sessionUser?.email || "-"}
              </span>
              {memberSince && (
                <span style={s.metaItem}>
                  <Calendar size={14} />
                  Membre depuis {memberSince}
                </span>
              )}
              <span style={{ ...s.metaItem, color: user?.status === "active" ? "#22c55e" : "#ef4444" }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: user?.status === "active" ? "#22c55e" : "#ef4444",
                    display: "inline-block",
                    marginRight: 6,
                  }}
                />
                {loadingUser ? "…" : user?.status === "active" ? "Actif" : "Inactif"}
              </span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── BODY ── */}
      <div style={s.layout}>
        <main>
          <div style={s.tabs}>
            {[{ key: "favoris", label: `Favoris (${FAVOURITES.length})` }].map(({ key, label }) => (
              <button key={key} style={s.tabBtn(activeTab === key)} onClick={() => setActiveTab(key)}>
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
                <div style={s.grid}>
                  {FAVOURITES.map((item, i) => (
                    <FavCard key={item.id} item={item} index={i} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* SIDEBAR */}
        <aside style={s.sidebar}>
          <motion.div
            style={s.infoCard}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div style={s.infoTitle}>Informations</div>
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
              <div style={s.infoRow} key={label}>
                <div style={s.infoIcon}>{icon}</div>
                <div>
                  <div style={s.infoLabel}>{label}</div>
                  <div style={s.infoValue}>{value}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </aside>
      </div>
    </div>
  );
}