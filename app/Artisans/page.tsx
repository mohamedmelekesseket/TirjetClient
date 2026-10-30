"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  Variants,
  useScroll,
  useTransform,
} from "framer-motion";
import { MapPin, Phone, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

/* Set to true if you want the image to alternate left / right */
const ALTERNATE = false;

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ───────── Animation variants ───────── */
const stagger = (delay = 0.14): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay, delayChildren: 0.1 } },
});

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

const ruleGrow: Variants = {
  hidden: { opacity: 0, scaleX: 0 },
  visible: { opacity: 1, scaleX: 1, transition: { duration: 0.9, ease: EASE } },
};

const mediaIn = (fromLeft: boolean): Variants => ({
  hidden: { opacity: 0, x: fromLeft ? -70 : 70, scale: 0.85, rotate: fromLeft ? -4 : 4 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    rotate: 0,
    transition: { duration: 1, ease: EASE },
  },
});

const badgePop: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 380, damping: 14, delay: 0.6 },
  },
};

const wordReveal: Variants = {
  hidden: { opacity: 0, y: "60%" },
  visible: { opacity: 1, y: "0%", transition: { duration: 0.9, ease: EASE } },
};

/* ───────── One artisan row ───────── */
function ArtisanRow({ a, index }: { a: Artisan; index: number }) {
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const imgLeft = ALTERNATE ? index % 2 === 0 : true;

  // gentle parallax on the circle while scrolling
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [28, -28]);

  const go = () => router.push(`/Artisanprofile/${a.user._id}`);

  return (
    <motion.article
      ref={ref}
      className={`artisan-row ${imgLeft ? "img-left" : "img-right"}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={stagger(0.12)}
      onClick={go}
    >
      {/* IMAGE */}
      <motion.div
        className="artisan-media"
        variants={mediaIn(imgLeft)}
        style={{ y: parallaxY }}
      >
        <span className="artisan-ring" aria-hidden="true" />
        <motion.div
          className="artisan-img-wrap"
          whileHover={{ scale: 1.035 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <img src={a.profilePhoto} alt={a.user?.name} loading="lazy" />
        </motion.div>
        <motion.span className="artisan-badge" variants={badgePop}>
          {String(index + 1).padStart(2, "0")}
        </motion.span>
      </motion.div>

      {/* CONTENT */}
      <motion.div className="artisan-content" variants={stagger(0.1)}>
        <motion.p className="artisan-role" variants={fadeUp}>
          {a.specialite}
        </motion.p>

        <motion.h2 className="artisan-name" variants={fadeUp}>
          {a.user?.name}
        </motion.h2>

        <motion.div className="artisan-meta" variants={fadeUp}>
          <span className="artisan-location">
            <MapPin size={12} color="#d93a2b" aria-hidden="true" />
            {a.region}, Tunisie
          </span>
          <span className="artisan-location">
            <Phone size={12} aria-hidden="true" />
            <bdi>{a.phone}</bdi>
          </span>
        </motion.div>

        {/* dir="auto" => Arabic bios flip to RTL with the border on the right,
            French bios stay LTR with the border on the left */}
        <motion.p className="artisan-bio" dir="auto" variants={fadeUp}>
          {a.description}
        </motion.p>

        <motion.div variants={fadeUp}>
          <Link
            href={`/Artisanprofile/${a.user._id}`}
            onClick={(e) => e.stopPropagation()}
            className="artisan-btn"
          >
            <span>Voir ses créations</span>
            <ArrowRight size={14} className="artisan-btn-arrow" aria-hidden="true" />
          </Link>
        </motion.div>
      </motion.div>
    </motion.article>
  );
}

/* ───────── Page ───────── */
export default function ArtisansPage() {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtisans = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/artisans/public`);
        if (!res.ok) throw new Error("Impossible de charger les artisans.");
        const data = await res.json();
        const list: Artisan[] = Array.isArray(data) ? data : data.artisans ?? [];

        // Sort: ranked first (ascending), then unranked
        list.sort((a, b) => {
          if (a.rank == null && b.rank == null) return 0;
          if (a.rank == null) return 1;
          if (b.rank == null) return -1;
          return a.rank - b.rank;
        });

        // Only keep artisans who have ALL required fields
        const complete = list.filter(
          (a) =>
            a.profilePhoto &&
            a.profilePhoto !== "" &&
            a.region &&
            a.phone &&
            a.specialite &&
            a.description
        );

        setArtisans(complete);
      } catch (err: any) {
        setError(err.message ?? "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };
    fetchArtisans();
  }, []);

  return (
    <div className="artisans-page">
      {/* HERO */}
      <motion.section
        className="artisans-hero"
        initial="hidden"
        animate="visible"
        variants={stagger(0.15)}
      >
        <span className="artisans-glow" aria-hidden="true" />

        <motion.p className="artisans-eyebrow" variants={fadeUp}>
          NOS ARTISANS
        </motion.p>

        <h1 className="artisans-title">
          <span className="title-line">
            <motion.span variants={wordReveal}>Les mains</motion.span>
          </span>
          <span className="title-line">
            <motion.span variants={wordReveal}>
              derrière <em className="title-accent">la beauté</em>
            </motion.span>
          </span>
        </h1>

        <motion.div className="artisans-rule" variants={ruleGrow} />

        <motion.p className="artisans-subtitle" variants={fadeUp}>
          Rencontrez les artisans talentueux qui perpétuent le patrimoine amazigh à travers
          leurs créations uniques.
        </motion.p>
      </motion.section>

      {/* STATES */}
      {loading && (
        <div className="artisans-state" role="status">
          <span className="artisans-spinner" />
          Chargement…
        </div>
      )}
      {error && <p className="artisans-state artisans-state-error">{error}</p>}
      {!loading && !error && artisans.length === 0 && (
        <p className="artisans-state">Aucun artisan approuvé pour le moment.</p>
      )}

      {/* ARTISANS LIST */}
      {!loading && !error && artisans.length > 0 && (
        <section className="artisans-list">
          {artisans.map((a, index) => (
            <ArtisanRow key={a._id} a={a} index={index} />
          ))}
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
          Partagez votre savoir-faire avec le monde. Rejoignez notre communauté d'artisans et
          donnez une vitrine internationale à vos créations.
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