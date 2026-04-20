"use client";

import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // adjust to your auth setup

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Artisan {
  _id: string;
  user: {
    _id: string;
    name: string;
    image?: string;
  };
  specialite?: string;
  region?: string;
  description?: string;
  images?: string[];
  isApproved: boolean;
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ArtisansPage() {
  const router = useRouter();
  const { data: session } = useSession(); // remove if not using next-auth
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchArtisans = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/artisans/public` // ← /public, no auth
      );

      if (!res.ok) throw new Error("Impossible de charger les artisans.");

      const data = await res.json();
      const list: Artisan[] = Array.isArray(data) ? data : data.artisans ?? [];
      setArtisans(list); // already filtered to isApproved on the backend
    } catch (err: any) {
      setError(err.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  fetchArtisans();
}, []); // no session dependency needed

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

      {/* ARTISAN ROWS */}
      {!loading && !error && (
        <section className="artisans-list">
          {artisans.length === 0 && (
            <p style={{ textAlign: "center", padding: "4rem 0" }}>
              Aucun artisan approuvé pour le moment.
            </p>
          )}

          {artisans.map((a, index) => {
            const imgLeft = index % 2 === 0;
            const coverImg =
              a.images && a.images.length > 0
                ? a.images[0]
                : a.user?.image ?? "/placeholder-artisan.jpg";

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
                {/* Image */}
                <motion.div
                  className="artisan-img-wrap"
                  variants={imgLeft ? fadeLeft : fadeRight}
                >
                  <img src={coverImg} alt={a.user?.name} />
                </motion.div>

                {/* Content */}
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