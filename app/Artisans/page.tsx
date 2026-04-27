"use client";

import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Artisan {
  _id: string;
  user: {
    _id: string;
    name: string;
    image?: string;
  };
  profilePhoto?: string;
  phone?: number;
  specialite?: string;
  region?: string;
  description?: string;
  images?: string[];
  isApproved: boolean;
  rank?: number | null;
}

// ─── Animation variants ────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const fadeRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

// ─── Rank badge colours ────────────────────────────────────────────────────────
// Top 1 = gold, Top 2 = silver, Top 3 = bronze, rest = neutral clay

const RANK_META: Record<number, { label: string; bg: string; color: string; border: string }> = {
  1: { label: "Top 1", bg: "#FDF3D0", color: "#92650A", border: "#E6B332" },
  2: { label: "Top 2", bg: "#F0F0F0", color: "#555555", border: "#A8A8A8" },
  3: { label: "Top 3", bg: "#FDEEE4", color: "#8B4A1F", border: "#C97A45" },
};

function RankBadge({ rank }: { rank: number }) {
  const meta = RANK_META[rank] ?? {
    label: `Top ${rank}`,
    bg: "#F5F0E8",
    color: "#6B5B3E",
    border: "#C4B49A",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        background: meta.bg,
        color: meta.color,
        border: `1.5px solid ${meta.border}`,
        marginBottom: "8px",
      }}
    >
      {rank === 1 ? "★ " : rank === 2 ? "✦ " : rank === 3 ? "◆ " : "#"}
      {meta.label}
    </span>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ArtisansPage() {
  const router = useRouter();
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtisans = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/artisans/public`
        );
        if (!res.ok) throw new Error("Impossible de charger les artisans.");
        const data = await res.json();
        const list: Artisan[] = Array.isArray(data) ? data : data.artisans ?? [];

        // Sort: ranked artisans first (ascending), then unranked
        list.sort((a, b) => {
          if (a.rank == null && b.rank == null) return 0;
          if (a.rank == null) return 1;
          if (b.rank == null) return -1;
          return a.rank - b.rank;
        });

        setArtisans(list);
      } catch (err: any) {
        setError(err.message ?? "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };
    fetchArtisans();
  }, []);

  // Split into ranked and unranked
  const ranked = artisans.filter((a) => a.rank != null);
  const unranked = artisans.filter((a) => a.rank == null);

  return (
    <div className="artisans-page">
      {/* HERO */}
      <motion.section
        className="artisans-hero"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
      >
        <motion.p className="artisans-eyebrow" variants={fadeUp}>
          NOS ARTISANS
        </motion.p>
        <motion.h1 className="artisans-title" variants={fadeUp}>
          Les mains derrière la beauté
        </motion.h1>
        <motion.div className="artisans-rule" variants={fadeUp} />
        <motion.p className="artisans-subtitle" variants={fadeUp}>
          Rencontrez les artisans talentueux qui perpétuent le patrimoine amazigh à
          travers leurs créations uniques.
        </motion.p>
      </motion.section>

      {/* STATES */}
      {loading && (
        <p style={{ textAlign: "center", padding: "4rem 0" }}>Chargement…</p>
      )}
      {error && (
        <p style={{ textAlign: "center", padding: "4rem 0", color: "red" }}>{error}</p>
      )}

      {!loading && !error && artisans.length === 0 && (
        <p style={{ textAlign: "center", padding: "4rem 0" }}>
          Aucun artisan approuvé pour le moment.
        </p>
      )}

      {/* ── RANKED SECTION ── */}
      {!loading && !error && ranked.length > 0 && (
        <>
          {/* Section heading */}
          <motion.div
            style={{ textAlign: "center", padding: "2rem 0 0.5rem" }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#92650A",
                background: "#FDF3D0",
                border: "1.5px solid #E6B332",
                borderRadius: "999px",
                padding: "4px 14px",
              }}
            >
              ★ Artisans en vedette
            </span>
          </motion.div>

          <section className="artisans-list">
            {ranked.map((a, index) => {
              const imgLeft = index % 2 === 0;
              const coverImg =
                a.profilePhoto && a.profilePhoto !== ""
                  ? a.profilePhoto
                  : "/placeholder-artisan.jpg";

              return (
                <motion.div
                  key={a._id}
                  className={`artisan-row ${imgLeft ? "img-left" : "img-right"}`}
                  style={{
                    cursor: "pointer",
                    // Subtle warm left border to distinguish ranked rows
                    borderLeft: "3px solid #E6B332",
                  }}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
                  onClick={() => router.push(`/Artisans/${a.user._id}`)}
                >
                  <motion.div
                    className="artisan-img-wrap"
                    variants={imgLeft ? fadeLeft : fadeRight}
                  >
                    <img src={coverImg} alt={a.user?.name} />
                  </motion.div>

                  <motion.div
                    className="artisan-content"
                    variants={imgLeft ? fadeRight : fadeLeft}
                  >
                    {/* Rank badge */}
                    {a.rank != null && <RankBadge rank={a.rank} />}

                    <h2 className="artisan-name">{a.user?.name}</h2>
                    {a.specialite && (
                      <p className="artisan-role">{a.specialite}</p>
                    )}
                    {a.region && (
                      <p className="artisan-location">
                        <span className="pin" aria-hidden="true">
                          <MapPin size={16} />
                        </span>{" "}
                        {a.region}, Tunisie
                      </p>
                    )}
                    {a.phone && (
                      <p className="artisan-location">
                        <span className="pin" aria-hidden="true">
                          <Phone size={15} />
                        </span>{" "}
                        {a.phone}
                      </p>
                    )}
                    {a.description && (
                      <p className="artisan-bio">{a.description}</p>
                    )}
                    <Link
                      href={`/Artisans/${a.user._id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <motion.span
                        className="artisan-btn"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: "inline-block" }}
                      >
                        Voir ses créations →
                      </motion.span>
                    </Link>
                  </motion.div>
                </motion.div>
              );
            })}
          </section>
        </>
      )}

      {/* ── UNRANKED SECTION ── */}
      {!loading && !error && unranked.length > 0 && (
        <>
          {/* Divider only shown when there are also ranked artisans */}
          {ranked.length > 0 && (
            <motion.div
              style={{ textAlign: "center", padding: "2rem 0 0.5rem" }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span
                style={{
                  display: "inline-block",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#555",
                  background: "#F5F5F5",
                  border: "1.5px solid #D0D0D0",
                  borderRadius: "999px",
                  padding: "4px 14px",
                }}
              >
                Tous les artisans
              </span>
            </motion.div>
          )}

          <section className="artisans-list">
            {unranked.map((a, index) => {
              const imgLeft = index % 2 === 0;
              const coverImg =
                a.profilePhoto && a.profilePhoto !== ""
                  ? a.profilePhoto
                  : "/placeholder-artisan.jpg";

              return (
                <motion.div
                  key={a._id}
                  className={`artisan-row ${imgLeft ? "img-left" : "img-right"}`}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
                  onClick={() => router.push(`/Artisans/${a.user._id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <motion.div
                    className="artisan-img-wrap"
                    variants={imgLeft ? fadeLeft : fadeRight}
                  >
                    <img src={coverImg} alt={a.user?.name} />
                  </motion.div>

                  <motion.div
                    className="artisan-content"
                    variants={imgLeft ? fadeRight : fadeLeft}
                  >
                    <h2 className="artisan-name">{a.user?.name}</h2>
                    {a.specialite && (
                      <p className="artisan-role">{a.specialite}</p>
                    )}
                    {a.region && (
                      <p className="artisan-location">
                        <span className="pin" aria-hidden="true">
                          <MapPin size={16} />
                        </span>{" "}
                        {a.region}, Tunisie
                      </p>
                    )}
                    {a.phone && (
                      <p className="artisan-location">
                        <span className="pin" aria-hidden="true">
                          <Phone size={15} />
                        </span>{" "}
                        {a.phone}
                      </p>
                    )}
                    {a.description && (
                      <p className="artisan-bio">{a.description}</p>
                    )}
                    <Link
                      href={`/Artisanprofile/${a.user._id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <motion.span
                        className="artisan-btn"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                        style={{ display: "inline-block" }}
                      >
                        Voir ses créations →
                      </motion.span>
                    </Link>
                  </motion.div>
                </motion.div>
              );
            })}
          </section>
        </>
      )}

      {/* CTA BANNER */}
      <motion.section
        className="artisans-cta"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <p className="cta-eyebrow">REJOINDRE TIRJET</p>
        <h2 className="cta-title">Vous êtes artisan ?</h2>
        <p className="cta-sub">
          Partagez votre savoir-faire avec le monde. Rejoignez notre communauté
          d'artisans et donnez une vitrine internationale à vos créations.
        </p>
        <Link href="/Rejoigneznous">
          <motion.button
            className="cta-btn"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            Rejoindre la communauté
          </motion.button>
        </Link>
      </motion.section>
    </div>
  );
}