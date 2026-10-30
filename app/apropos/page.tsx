"use client";

import { useEffect, useRef, useState } from "react";
import image from "../../images/apropo.jpg";

// ─── InView hook ──────────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Star (Amazigh-style 8 point) ─────────────────────────────────────────────
function TifStar({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M16 2L18.5 12.5L29 8L22 17.5L31 23L19.5 20.5L21 31L16 23L11 31L12.5 20.5L1 23L10 17.5L3 8L13.5 12.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ─── Reveal wrapper ───────────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  variant = "",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  variant?: "" | "left" | "right" | "scale";
  className?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={`ap-reveal ${variant ? `ap-reveal--${variant}` : ""} ${
        visible ? "ap-reveal--in" : ""
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const objectives = [
  "Promouvoir le patrimoine culturel amazigh",
  "Soutenir les artisans indépendants",
  "Offrir une vitrine digitale aux produits faits main",
  "Encourager une économie solidaire et locale",
];

const columns = [
  {
    key: "visitor",
    icon: "ⵣ",
    title: "Aux visiteurs",
    items: [
      "Découvrir des produits artisanaux uniques (margoum, poterie, bijoux…)",
      "Explorer les profils des artisans",
      "Acheter en ligne en toute facilité",
    ],
  },
  {
    key: "artisan",
    icon: "✦",
    title: "Aux artisans",
    items: [
      "Soumettre une demande pour rejoindre la plateforme",
      "Présenter leurs créations",
      "Gérer leurs produits via un espace dédié",
    ],
  },
  {
    key: "admin",
    icon: "◈",
    title: "À l'administration",
    items: [
      "Valider les artisans",
      "Superviser les contenus",
      "Assurer la qualité et l'authenticité",
    ],
  },
];

const valueTags = [
  "Histoires d'artisans",
  "Commerce équitable",
  "Vitrine mondiale",
  "Authenticité garantie",
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const [heroIn, setHeroIn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHeroIn(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="ap-main">
      {/* ══ HERO ═════════════════════════════════════════════════════════ */}
      <section className="ap-hero">
        <div className="ap-hero__pattern ap-pattern" />
        <div className="ap-hero__glow" />
        <TifStar className="ap-hero__star ap-hero__star--lg" />
        <TifStar className="ap-hero__star ap-hero__star--sm" />

        <div className={`ap-hero__content ${heroIn ? "ap-hero__content--in" : ""}`}>
          <div className="ap-hero__eyebrow">
            <span className="ap-tif">ⵜⴰⵎⴰⵖⵓⵜ</span>
            <span>· À propos</span>
          </div>
          <h1 className="ap-hero__title">
            Association
            <span>Tamaguit</span>
          </h1>
          <p className="ap-hero__subtitle">
            Pour les droits, les libertés et la culture des Amazighs
          </p>
          <p className="ap-hero__desc">
            Une plateforme numérique dédiée à la valorisation de l&apos;artisanat amazigh en
            Tunisie, reliant directement les artisans locaux à un public plus large tout en
            préservant l&apos;authenticité du savoir-faire traditionnel.
          </p>
        </div>
      </section>

      {/* ══ PRÉSENTATION ═════════════════════════════════════════════════ */}
      <section className="ap-presentation">
        <div className="ap-presentation__inner">
          <Reveal variant="left">
            <p className="ap-eyebrow">Présentation générale</p>
            <h2 className="ap-section-title">
              Un espace numérique pour un <em>patrimoine vivant</em>
            </h2>
            <p className="ap-body-text">
              La plateforme de l&apos;Association Tamaguit met en relation directe les artisans
              locaux avec un public plus large, tout en préservant l&apos;authenticité et le
              savoir-faire traditionnel.
            </p>
            <p className="ap-body-text">
              Ce n&apos;est pas un simple marketplace. C&apos;est une{" "}
              <strong>plateforme culturelle</strong> qui raconte l&apos;histoire derrière chaque
              produit — un pont entre les générations.
            </p>
            <div className="ap-presentation__tags">
              {["Amazigh", "Tunisie", "Artisanat", "Culture"].map((t) => (
                <span key={t} className="ap-tag">
                  {t}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal variant="right" delay={150} className="ap-presentation__img-col">
            <div className="ap-presentation__img-frame">
              <img src={image.src} alt="Métier à tisser amazigh" />
              <div className="ap-presentation__img-badge">
                <TifStar className="ap-star" />
                <span>Savoir-faire millénaire</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ OBJECTIFS ════════════════════════════════════════════════════ */}
      <section className="ap-objectives ap-pattern">
        <Reveal>
          <p className="ap-eyebrow ap-eyebrow--center">Objectifs</p>
          <h2 className="ap-section-title ap-section-title--center">Ce qui nous guide</h2>
        </Reveal>
        <div className="ap-objectives__grid">
          {objectives.map((text, i) => (
            <Reveal key={text} delay={i * 110} variant="scale">
              <div className="ap-obj-card">
                <span className="ap-obj-card__num">{String(i + 1).padStart(2, "0")}</span>
                <p className="ap-obj-card__text">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ FONCTIONNEMENT ═══════════════════════════════════════════════ */}
      <section className="ap-how">
        <Reveal>
          <p className="ap-eyebrow ap-eyebrow--center">Fonctionnement</p>
          <h2 className="ap-section-title ap-section-title--center">La plateforme permet…</h2>
        </Reveal>
        <div className="ap-how__grid">
          {columns.map((c, i) => (
            <Reveal key={c.key} delay={i * 130} className="ap-how__col">
              <div className="ap-how-card">
                <div className={`ap-how-card__icon ap-how-card__icon--${c.key}`}>{c.icon}</div>
                <h3>{c.title}</h3>
                <ul className="ap-how-card__list">
                  {c.items.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ VALEUR AJOUTÉE ═══════════════════════════════════════════════ */}
      <section className="ap-value">
        <div className="ap-value__pattern ap-pattern" />
        <div className="ap-value__glow" />
        <TifStar className="ap-value__star" />
        <div className="ap-value__inner">
          <Reveal>
            <p className="ap-eyebrow ap-eyebrow--center ap-eyebrow--gold">Valeur ajoutée</p>
            <h2 className="ap-value__title">
              Plus qu&apos;un marketplace,
              <em>une mémoire vivante</em>
            </h2>
            <p className="ap-value__text">
              Une plateforme culturelle qui raconte l&apos;histoire derrière chaque produit et
              chaque artisan — la voix d&apos;un peuple, préservée pour les générations futures.
            </p>
            <div className="ap-value__features">
              {valueTags.map((label) => (
                <span key={label} className="ap-value__feat">
                  {label}
                </span>
              ))}
            </div>
            <a href="/boutique" className="ap-btn ap-btn--orange">
              Explorer la boutique <span className="ap-btn__arrow">→</span>
            </a>
          </Reveal>
        </div>
      </section>
    </main>
  );
}