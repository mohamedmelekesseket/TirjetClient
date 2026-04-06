"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform,Variants  } from "framer-motion";
import Image1 from "../images/hero-artisan.jpg";
import story from "../images/story.jpg";

// ─── Data ─────────────────────────────────────────────────────────────────────
const values = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    title: "Authentique",
    desc: "Créations 100% faites main par des artisans talentueux amazighs",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Communautaire",
    desc: "Valorisation directe du travail des artisans amazighs",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Équitable",
    desc: "Prix justes et contact direct avec les créateurs",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
      </svg>
    ),
    title: "Ancestrale",
    desc: "Transmission vivante des techniques traditionnelles",
  },
];

const products = [
  {
    cat: "Tissage",
    name: "Tapis berbère traditionnel",
    shop: "Atelier Azilal",
    loc: "Azilal",
    price: "1 200",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&q=85",
  },
  {
    cat: "Poterie",
    name: "Poterie artisanale peinte",
    shop: "Poterie Safi",
    loc: "Safi",
    price: "350",
    img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=700&q=85",
  },
  {
    cat: "Bijouterie",
    name: "Bijoux en argent amazigh",
    shop: "Bijoux Tiznit",
    loc: "Tiznit",
    price: "890",
    img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=700&q=85",
  },
];

const artisans = [
  { name: "Atelier Azilal", craft: "Tapis berbères", loc: "Azilal", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80" },
  { name: "Poterie Safi", craft: "Céramique", loc: "Safi", img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=500&q=80" },
  { name: "Bijoux Tiznit", craft: "Bijouterie", loc: "Tiznit", img: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80" },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────
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

// ─── Atoms ────────────────────────────────────────────────────────────────────
function Pin() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display:"inline", verticalAlign:"middle", marginRight:4, opacity:0.5 }}>
      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

function Ornament() {
  return (
    <svg width="40" height="12" viewBox="0 0 40 12" fill="none" className="pg-ornament">
      <line x1="0" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.4"/>
      <circle cx="20" cy="6" r="2.5" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.6"/>
      <line x1="26" y1="6" x2="40" y2="6" stroke="currentColor" strokeWidth="0.75" strokeOpacity="0.4"/>
    </svg>
  );
}

// ─── Motion presets ───────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i?: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i ? i * 0.1 : 0,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] as [number, number, number, number],
    },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i?: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      delay: i ? i * 0.1 : 0,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] as [number, number, number, number],
    },
  }),
};

// ─── Sections ─────────────────────────────────────────────────────────────────

function Hero() {
  const [in_, setIn] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  useEffect(() => { const t = setTimeout(() => setIn(true), 60); return () => clearTimeout(t); }, []);

  return (
    <section className="pg-hero" ref={containerRef}>
      {/* Parallax image */}
      <motion.div className="pg-hero__imgwrap" style={{ y: imgY }}>
        <img src={Image1.src} alt="" aria-hidden className="pg-hero__img" />
      </motion.div>
      <div className="pg-hero__veil" />

      {/* Tifinagh watermark */}
      <div className="pg-hero__watermark" aria-hidden>ⵜⵉⵔⵊⵜ</div>

      {/* Content */}
      <div className={`pg-hero__body${in_ ? " pg-hero__body--in" : ""}`}>
        <p className="pg-label pg-label--amber">
          <Ornament />
          Artisanat Amazigh · Collection 2025
          <Ornament />
        </p>

        <h1 className="pg-hero__h1">
          L&apos;art de<br />
          <em>l&apos;artisan</em>
        </h1>

        <p className="pg-hero__sub">
          Pièces uniques sourcées directement auprès des maîtres<br />
          artisans. Chaque objet porte une histoire, un territoire.
        </p>

        <div className="pg-hero__ctas">
          <motion.button className="pg-btn pg-btn--amber" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            Explorer la boutique →
          </motion.button>
          <motion.button className="pg-btn pg-btn--ghost" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            Notre histoire
          </motion.button>
        </div>

        <div className="pg-hero__rule" />

        <div className="pg-hero__stats">
          {[["150+", "Artisans"], ["2 000+", "Créations"], ["12", "Régions"]].map(([n, l]) => (
            <div key={l} className="pg-hero__stat">
              <span className="pg-hero__stat-n">{n}</span>
              <span className="pg-hero__stat-l">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div className="pg-scroll-cue">
        <span>Défiler</span>
        <div className="pg-scroll-cue__line" />
      </div>
    </section>
  );
}

function Values() {
  return (
    <section className="pg-values">
      <motion.div
        className="pg-values__head"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <p className="pg-label">Nos valeurs</p>
        <h2 className="pg-h2">Ce qui nous guide</h2>
      </motion.div>

      <div className="pg-values__grid">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            className="pg-val-card"
            variants={scaleIn}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
          >
            <motion.span
              className="pg-val-card__icon"
              whileHover={{ rotate: 12, scale: 1.15, transition: { duration: 0.2 } }}
            >
              {v.icon}
            </motion.span>
            <h3 className="pg-val-card__title">{v.title}</h3>
            <p className="pg-val-card__desc">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Products() {
  return (
    <section className="pg-products">
      <motion.div
        className="pg-products__hd"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div>
          <p className="pg-label pg-label--amber">Boutique</p>
          <h2 className="pg-h2">Créations en vedette</h2>
        </div>
        <a href="#" className="pg-textlink">Voir tout →</a>
      </motion.div>

      <div className="pg-products__grid">
        {products.map((p, i) => (
          <motion.article
            key={p.name}
            className="pg-prod-card"
            variants={scaleIn}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            <div className="pg-prod-card__media">
              <motion.img
                src={p.img}
                alt={p.name}
                className="pg-prod-card__img"
                whileHover={{ scale: 1.07 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              />
              <div className="pg-prod-card__shade" />
              <span className="pg-prod-card__cat">{p.cat}</span>

              <div className="pg-prod-card__info">
                <h4 className="pg-prod-card__name">{p.name}</h4>
                <p className="pg-prod-card__shop">{p.shop}</p>
                <div className="pg-prod-card__foot">
                  <span className="pg-prod-card__loc"><Pin />{p.loc}</span>
                  <span className="pg-prod-card__price">
                    <strong>{p.price}</strong> MAD
                  </span>
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function Story() {
  return (
    <section className="pg-story">
      <motion.div
        className="pg-story__img"
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        <img src={story.src} alt="Artisane tissant" />
        {/* floating badge */}
        <div className="pg-story__badge">
          <span className="pg-story__badge-num">12</span>
          <span className="pg-story__badge-lbl">Régions<br />couvertes</span>
        </div>
      </motion.div>

      <motion.div
        className="pg-story__text"
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      >
        <p className="pg-label pg-label--amber">Notre histoire</p>
        <h2 className="pg-h2">Préserver un<br /><em>héritage millénaire</em></h2>
        <p className="pg-story__para">
          Tirjet est née de la volonté de valoriser l&apos;artisanat amazigh. Nous connectons les
          artisans talentueux du Maroc avec le monde entier, en leur offrant une vitrine
          numérique pour leurs créations uniques.
        </p>
        <p className="pg-story__para">
          Chaque produit sur notre plateforme raconte une histoire — celle d&apos;un savoir-faire
          transmis de génération en génération, d&apos;une culture riche et vivante.
        </p>
        <div className="pg-story__stats">
          {[["150+", "Artisans"], ["2K+", "Créations"]].map(([n, l]) => (
            <div key={l} className="pg-story__stat">
              <span className="pg-story__stat-n">{n}</span>
              <span className="pg-story__stat-l">{l}</span>
            </div>
          ))}
        </div>
        <motion.button
          className="pg-btn pg-btn--dark"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        >
          En savoir plus →
        </motion.button>
      </motion.div>
    </section>
  );
}

function Artisans() {
  return (
    <section className="pg-artisans">
      <motion.div
        className="pg-artisans__head"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <p className="pg-label">Nos artisans</p>
        <h2 className="pg-h2">Les maîtres artisans</h2>
      </motion.div>

      <div className="pg-artisans__grid">
        {artisans.map((a, i) => (
          <motion.article
            key={a.name}
            className="pg-art-card"
            variants={fadeUp}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div
              className="pg-art-card__avatar"
              whileHover={{ scale: 1.04, transition: { duration: 0.3 } }}
            >
              <img src={a.img} alt={a.name} />
              <div className="pg-art-card__ring" />
            </motion.div>
            <h4 className="pg-art-card__name">{a.name}</h4>
            <p className="pg-art-card__craft">{a.craft}</p>
            <p className="pg-art-card__loc"><Pin />{a.loc}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="pg-cta">
      {/* Geometric pattern overlay */}
      <div className="pg-cta__pattern" aria-hidden />

      <motion.div
        className="pg-cta__inner"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <p className="pg-label pg-label--amber">
          <Ornament /> Rejoignez-nous <Ornament />
        </p>
        <h2 className="pg-cta__h2">
          Vous êtes <em>artisan</em> ?
        </h2>
        <p className="pg-cta__sub">
          Créez votre boutique et partagez vos créations avec le monde entier.
          <br />Valorisez votre savoir-faire dès aujourd&apos;hui.
        </p>
        <div className="pg-cta__btns">
          <motion.button className="pg-btn pg-btn--amber" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            Créer ma boutique →
          </motion.button>
          <motion.button className="pg-btn pg-btn--ghost" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            En savoir plus
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Page() {
  return (
    <main className="pg-main">
      <Hero />
      <Values />
      <Products />
      <Story />
      <Artisans />
      <CTA />
    </main>
  );
}