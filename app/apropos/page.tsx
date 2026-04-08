"use client";

import { useEffect, useRef, useState } from "react";
import image from '../../images/apropo.jpg'
// ─── InView hook ──────────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Tifinagh decorative icon ─────────────────────────────────────────────────
function TifStar({ size = 28, opacity = 0.35 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity }}>
      <path
        d="M16 2L18.5 12.5L29 8L22 17.5L31 23L19.5 20.5L21 31L16 23L11 31L12.5 20.5L1 23L10 17.5L3 8L13.5 12.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useInView(0.5);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(to / 60);
    const id = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(id); }
      else setCount(start);
    }, 22);
    return () => clearInterval(id);
  }, [visible, to]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const objectives = [
  { icon: "", text: "Promouvoir le patrimoine culturel amazigh" },
  { icon: "", text: "Soutenir les artisans indépendants" },
  { icon: "", text: "Offrir une vitrine digitale aux produits faits main" },
  { icon: "", text: "Encourager une économie solidaire et locale" },
];

const visitorFeatures = [
  "Découvrir des produits artisanaux uniques (margoum, poterie, bijoux…)",
  "Explorer les profils des artisans",
  "Acheter en ligne en toute facilité",
];

const artisanFeatures = [
  "Soumettre une demande pour rejoindre la plateforme",
  "Présenter leurs créations",
  "Gérer leurs produits via un espace dédié",
];

const adminFeatures = [
  "Valider les artisans",
  "Superviser les contenus",
  "Assurer la qualité et l'authenticité",
];

const stats = [
  { num: 150, suffix: "+", label: "Artisans" },
  { num: 2000, suffix: "+", label: "Créations" },
  { num: 12, suffix: "", label: "Régions" },
  { num: 8, suffix: "", label: "Années" },
];

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={`ap-reveal ${visible ? "ap-reveal--in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const [heroIn, setHeroIn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setHeroIn(true), 80); return () => clearTimeout(t); }, []);

  return (
    <main className="ap-main">

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="ap-hero">
        {/* <div className="ap-hero__bg-img">
          <img
            src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1400&q=80"
            alt="Artisane amazighe"
          />
          <div className="ap-hero__overlay" />
        </div> */}

        {/* Floating geometric shapes */}
        <div className="ap-hero__geo ap-hero__geo--tl"><TifStar size={56} opacity={0.18} /></div>
        <div className="ap-hero__geo ap-hero__geo--br"><TifStar size={80} opacity={0.1} /></div>

        <div className={`ap-hero__content ${heroIn ? "ap-hero__content--in" : ""}`}>
          <div className="ap-hero__eyebrow">
            <span className="ap-tif">ⵜⴰⵎⴰⵖⵓⵜ</span>
            <span className="ap-dot">·</span>
            <span>À PROPOS</span>
          </div>
          <h1 className="ap-hero__title">
            Association <span style={{color:"#E2C98A"}}>Tirjet</span> 
          </h1>
          <p className="ap-hero__subtitle">
            Pour les droits, les libertés et la culture des Amazighs
          </p>
          <p className="ap-hero__desc">
            Une plateforme numérique dédiée à la valorisation de l&apos;artisanat amazigh
            en Tunisie 🇹🇳, mettant en relation directe les artisans locaux avec un public
            plus large tout en préservant l&apos;authenticité du savoir-faire traditionnel.
          </p>
        </div>

        {/* Stats bar */}
        <div className={`ap-hero__stats ${heroIn ? "ap-hero__stats--in" : ""}`}>
          {stats.map((s) => (
            <div key={s.label} className="ap-hero__stat">
              <span className="ap-hero__stat-num">
                <Counter to={s.num} suffix={s.suffix} />
              </span>
              <span className="ap-hero__stat-lbl">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══ PRÉSENTATION ══════════════════════════════════════════════════ */}
      <section className="ap-presentation">
        <div className="ap-presentation__inner">
          <Reveal className="ap-presentation__text-col">
            <p className="ap-eyebrow">🧾 PRÉSENTATION GÉNÉRALE</p>
            <h2 className="ap-section-title">
              Un espace numérique pour un{" "}
              <em>patrimoine vivant</em>
            </h2>
            <p className="ap-body-text">
              La plateforme de l&apos;Association Tamaguit est un espace numérique dédié à la
              valorisation de l&apos;artisanat amazigh en Tunisie. Elle met en relation directe
              les artisans locaux avec un public plus large, tout en préservant
              l&apos;authenticité et le savoir-faire traditionnel.
            </p>
            <p className="ap-body-text">
              Ce n&apos;est pas un simple marketplace. C&apos;est une <strong>plateforme
              culturelle</strong> qui raconte l&apos;histoire derrière chaque produit et chaque
              artisan — un pont entre les générations.
            </p>
            <div className="ap-presentation__tags">
              {["Amazigh", "Tunisie 🇹🇳", "Artisanat", "Culture"].map((t) => (
                <span key={t} className="ap-tag">{t}</span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120} className="ap-presentation__img-col">
            <div className="ap-presentation__img-frame">
              <img
                src={image.src}
                alt="Poterie amazighe"
              />
              <div className="ap-presentation__img-badge">
                <TifStar size={18} opacity={1} />
                <span>Savoir-faire millénaire</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ OBJECTIFS ═════════════════════════════════════════════════════ */}
      <section className="ap-objectives">
        <Reveal>
          <p className="ap-eyebrow ap-eyebrow--center">🎯 OBJECTIFS</p>
          <h2 className="ap-section-title ap-section-title--center">Ce qui nous guide</h2>
        </Reveal>
        <div className="ap-objectives__grid">
          {objectives.map((obj, i) => (
            <Reveal key={obj.text} delay={i * 80}>
              <div className="ap-obj-card">
                <span className="ap-obj-card__icon">{obj.icon}</span>
                <p className="ap-obj-card__text">{obj.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ FONCTIONNEMENT ════════════════════════════════════════════════ */}
      <section className="ap-how">
        <Reveal>
          <p className="ap-eyebrow ap-eyebrow--center">🛍️ FONCTIONNEMENT</p>
          <h2 className="ap-section-title ap-section-title--center">La plateforme permet…</h2>
        </Reveal>

        <div className="ap-how__grid">
          {/* Visitors */}
          <Reveal delay={0} className="ap-how__col">
            <div className="ap-how-card ap-how-card--visitor">
              <div className="ap-how-card__head">
                <span className="ap-how-card__emoji">👥</span>
                <h3>Aux visiteurs</h3>
              </div>
              <ul className="ap-how-card__list">
                {visitorFeatures.map((f) => (
                  <li key={f}>
                    <span className="ap-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Artisans */}
          <Reveal delay={100} className="ap-how__col">
            <div className="ap-how-card ap-how-card--artisan">
              <div className="ap-how-card__head">
                <span className="ap-how-card__emoji">🧑‍🎨</span>
                <h3>Aux artisans</h3>
              </div>
              <ul className="ap-how-card__list">
                {artisanFeatures.map((f) => (
                  <li key={f}>
                    <span className="ap-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Admin */}
          <Reveal delay={200} className="ap-how__col">
            <div className="ap-how-card ap-how-card--admin">
              <div className="ap-how-card__head">
                <span className="ap-how-card__emoji">🛠️</span>
                <h3>À l&apos;administration</h3>
              </div>
              <ul className="ap-how-card__list">
                {adminFeatures.map((f) => (
                  <li key={f}>
                    <span className="ap-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ VALEUR AJOUTÉE ════════════════════════════════════════════════ */}
      <section className="ap-value">
        <div className="ap-value__inner">
          <div className="ap-value__tif-deco">
            <TifStar size={120} opacity={0.07} />
          </div>
          <Reveal className="ap-value__content">
            <p className="ap-eyebrow ap-eyebrow--white">🌍 VALEUR AJOUTÉE</p>
            <h2 className="ap-value__title">
              Plus qu&apos;un marketplace,<br />
              <em>une mémoire vivante</em>
            </h2>
            <p className="ap-value__text">
              Ce site n&apos;est pas un simple marketplace. C&apos;est une plateforme culturelle
              qui raconte l&apos;histoire derrière chaque produit et chaque artisan — la voix
              d&apos;un peuple, préservée pour les générations futures.
            </p>
            <div className="ap-value__features">
              {[
                { icon: "", label: "Histoires d'artisans" },
                { icon: "", label: "Commerce équitable" },
                { icon: "", label: "Vitrine mondiale" },
                { icon: "", label: "Authenticité garantie" },
              ].map((f) => (
                <div key={f.label} className="ap-value__feat">
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
            <a href="/boutique" className="ap-btn ap-btn--white">
              Explorer la boutique →
            </a>
          </Reveal>
        </div>
      </section>

      {/* ══ CTA JOIN ══════════════════════════════════════════════════════ */}
      {/* <section className="ap-join">
        <Reveal className="ap-join__inner">
          <p className="ap-eyebrow ap-eyebrow--center">REJOIGNEZ-NOUS</p>
          <h2 className="ap-join__title">
            Vous êtes <em>artisan</em> ?
          </h2>
          <p className="ap-join__sub">
            Créez votre boutique et partagez vos créations avec le monde.
            Valorisez votre savoir-faire dès aujourd&apos;hui.
          </p>
          <div className="ap-join__btns">
            <a href="/Rejoigneznous" className="ap-btn ap-btn--green">Créer ma boutique →</a>
            <a href="/contact" className="ap-btn ap-btn--ghost">Nous contacter</a>
          </div>
          <div className="ap-join__blob ap-join__blob--l" />
          <div className="ap-join__blob ap-join__blob--r" />
        </Reveal>
      </section> */}

    </main>
  );
}