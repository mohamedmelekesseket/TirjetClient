import React from "react";

// ── Types ──────────────────────────────────────────────────────────────────

interface Category {
  id: number;
  slug: string;
  color: "clay" | "amber" | "forest" | "brown" | "navy" | "plum" | "ochre" | "dark";
  tifinagh: string;
  name: string;
  desc: string;
  count: string;
}

interface Highlight {
  tag: string;
  title: string;
  excerpt: string;
  tifinagh: string;
  color: string;
}

// ── Data ───────────────────────────────────────────────────────────────────

const FLOAT_LETTERS = ["ⴰ", "ⵜ", "ⵎ", "ⵣ", "ⵉ", "ⵖ", "ⵙ", "ⴷ", "ⵔ", "ⵏ"];

const SECONDARY_NAV = [
  "Produits du terroir",
  "Vêtements et chaussures",
  "Coffrets cadeaux",
  "Cosmétiques naturels",
  "Trésors de la gastronomie",
  "Bijoux et accessoires",
];

const CATEGORIES: Category[] = [
  {
    id: 1,
    slug: "langueAmazigh",
    color: "clay",
    tifinagh: "ⵜⴰⵎⴰⵣⵉⵖⵜ",
    name: "Langue amazigh",
    desc: "L'alphabet Tifinagh, les dialectes et la poésie orale — une langue vivante de 3000 ans.",
    count: "12 articles",
  },
  {
    id: 2,
    slug: "evenements",
    color: "amber",
    tifinagh: "ⵉⵎⴰⵍⴰⵙⵙⵏ",
    name: "Événements & traditions",
    desc: "Yennayer, Tiwizi, Imilchil… Les grandes fêtes et rituels qui rythment la vie amazighe.",
    count: "8 articles",
  },
  {
    id: 3,
    slug: "symboles",
    color: "forest",
    tifinagh: "ⵜⵉⵔⵎⴰⴷ",
    name: "Symboles et motifs",
    desc: "Géométrie sacrée, tatouages berbères, motifs de tapis — un langage visuel millénaire.",
    count: "15 articles",
  },
  {
    id: 4,
    slug: "musique",
    color: "brown",
    tifinagh: "ⵉⵣⵍⴰⵏ",
    name: "Musique amazigh",
    desc: "Ahwach, Ahidous, gnaoua — les rythmes et chants qui portent l'âme du peuple libre.",
    count: "10 articles",
  },
  {
    id: 5,
    slug: "patrimoine",
    color: "navy",
    tifinagh: "ⴰⵎⵣⵔⵓⵢ",
    name: "Patrimoine et Traditions",
    desc: "Artisanat, costumes, bijoux et savoir-faire transmis de génération en génération.",
    count: "18 articles",
  },
  {
    id: 6,
    slug: "agriculture",
    color: "ochre",
    tifinagh: "ⵜⴰⴳⵔⴰⵡⵜ",
    name: "Agriculture amazigh",
    desc: "Khettaras, jardins oasiens, cultures séculaires — l'homme amazigh et sa terre nourricière.",
    count: "7 articles",
  },
  {
    id: 7,
    slug: "architecture",
    color: "plum",
    tifinagh: "ⵉⵖⵔⵎⴰⵏ",
    name: "Architecture amazigh",
    desc: "Ksours, Tighremt, greniers collectifs — une architecture de terre qui défie le temps.",
    count: "9 articles",
  },
  {
    id: 8,
    slug: "documentation",
    color: "dark",
    tifinagh: "ⵜⵉⵔⵔⴰ",
    name: "Documentation",
    desc: "Textes, archives, études et ressources pour approfondir la connaissance amazighe.",
    count: "24 ressources",
  },
];

const HIGHLIGHTS: Highlight[] = [
  {
    tag: "Langue",
    title: "Le Tifinagh, écriture des origines",
    excerpt:
      "Retrouvé dans des gravures rupestres sahariennes vieilles de 3 millénaires, le Tifinagh est aujourd'hui renouvelé par une jeunesse fière de ses racines.",
    tifinagh: "ⵜⵉⴼⵉⵏⴰⵖ",
    color: "clay",
  },
  {
    tag: "Musique",
    title: "Izlan, chants de l'âme berbère",
    excerpt:
      "La poésie chantée amazighe traverse déserts et montagnes, portée par des bardes itinérants — les Imedyazen — gardiens d'une mémoire orale irremplaçable.",
    tifinagh: "ⵉⵣⵍⴰⵏ",
    color: "brown",
  },
  {
    tag: "Symboles",
    title: "Aza, l'homme libre en signe",
    excerpt:
      "Le symbole Aza — ⵣ — incarne l'identité amazighe. Présent sur les bijoux, les tapis et les murs peints, il est le cœur graphique d'une civilisation entière.",
    tifinagh: "ⵣ",
    color: "forest",
  },
];

const STATS = [
  { value: "40M+",  label: "Locuteurs dans le monde" },
  { value: "3000",  label: "Ans d'histoire écrite" },
  { value: "8",     label: "Grandes familles dialectales" },
  { value: "2011",  label: "Langue officielle au Maroc" },
];

// ── SVG Category Illustrations ─────────────────────────────────────────────

const CatIllustrations: Record<string, () => React.ReactElement> = {
  clay: () => (
    <svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="52" fontSize="38" fill="currentColor" opacity=".18" fontFamily="serif">ⴰ</text>
      <text x="52" y="52" fontSize="38" fill="currentColor" opacity=".28" fontFamily="serif">ⵜ</text>
      <text x="82" y="78" fontSize="28" fill="currentColor" opacity=".22" fontFamily="serif">ⵎ</text>
    </svg>
  ),
  amber: () => (
    <svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
      <circle cx="38" cy="45" r="22" fill="currentColor" opacity=".12" />
      <circle cx="82" cy="45" r="18" fill="currentColor" opacity=".16" />
      <text x="28" y="52" fontSize="20" fill="currentColor" opacity=".45" textAnchor="middle">✦</text>
      <text x="82" y="52" fontSize="16" fill="currentColor" opacity=".38" textAnchor="middle">✦</text>
    </svg>
  ),
  forest: () => (
    <svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
      <polygon points="60,8 90,70 30,70" fill="currentColor" opacity=".12" />
      <polygon points="60,22 82,68 38,68" fill="currentColor" opacity=".10" />
      <text x="60" y="62" fontSize="22" fill="currentColor" opacity=".40" textAnchor="middle">ⵣ</text>
    </svg>
  ),
  brown: () => (
    <svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
      <text x="60" y="58" fontSize="48" fill="currentColor" opacity=".15" textAnchor="middle">♪</text>
      <text x="60" y="80" fontSize="14" fill="currentColor" opacity=".35" textAnchor="middle" fontFamily="serif">ⵉⵣⵍⴰⵏ</text>
    </svg>
  ),
  navy: () => (
    <svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="18" width="90" height="58" rx="6" fill="currentColor" opacity=".10" />
      <rect x="22" y="30" width="50" height="4" rx="2" fill="currentColor" opacity=".22" />
      <rect x="22" y="42" width="70" height="4" rx="2" fill="currentColor" opacity=".18" />
      <rect x="22" y="54" width="38" height="4" rx="2" fill="currentColor" opacity=".15" />
    </svg>
  ),
  ochre: () => (
    <svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="60" cy="60" rx="44" ry="18" fill="currentColor" opacity=".10" />
      <line x1="60" y1="12" x2="60" y2="60" stroke="currentColor" strokeWidth="2" opacity=".22" />
      <line x1="36" y1="24" x2="60" y2="60" stroke="currentColor" strokeWidth="1.5" opacity=".16" />
      <line x1="84" y1="24" x2="60" y2="60" stroke="currentColor" strokeWidth="1.5" opacity=".16" />
      <text x="60" y="55" fontSize="14" fill="currentColor" opacity=".40" textAnchor="middle">ⵜⴰⴳⵔⴰⵡⵜ</text>
    </svg>
  ),
  plum: () => (
    <svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="30" width="84" height="48" rx="4" fill="currentColor" opacity=".10" />
      <rect x="30" y="18" width="60" height="14" rx="3" fill="currentColor" opacity=".14" />
      <rect x="48" y="8" width="24" height="12" rx="2" fill="currentColor" opacity=".16" />
      <text x="60" y="62" fontSize="13" fill="currentColor" opacity=".35" textAnchor="middle">ⵉⵖⵔⵎⴰⵏ</text>
    </svg>
  ),
  dark: () => (
    <svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="14" width="80" height="62" rx="5" fill="currentColor" opacity=".10" />
      <text x="60" y="55" fontSize="30" fill="currentColor" opacity=".20" textAnchor="middle" fontFamily="serif">ⵜⵉⵔⵔⴰ</text>
      <line x1="28" y1="28" x2="92" y2="28" stroke="currentColor" strokeWidth="1" opacity=".18" />
      <line x1="28" y1="70" x2="92" y2="70" stroke="currentColor" strokeWidth="1" opacity=".18" />
    </svg>
  ),
};

// ── Sub-components ─────────────────────────────────────────────────────────

function NavBar() {
  return (
    <nav className="cult-nav">
      <div className="cult-nav-logo">
        <div className="cult-nav-logo-icon">
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 4 L22 14 L33 14 L24 21 L27 32 L18 25 L9 32 L12 21 L3 14 L14 14Z"
              fill="white" opacity=".9" />
          </svg>
        </div>
        <div>
          <span className="cult-nav-logo-name">TIRJET</span>
          <span className="cult-nav-logo-sub">CULTURE AMAZIGHE</span>
        </div>
      </div>

      <ul className="cult-nav-links">
        <li><a href="#">Accueil</a></li>
        <li className="cult-active">
          <a href="#">Culture Amazigh <span className="cult-nav-chevron">▾</span></a>
        </li>
        <li><a href="#">Artisans</a></li>
        <li>
          <a href="#">Tourisme et Loisir <span className="cult-nav-chevron">▾</span></a>
        </li>
        <li><a href="#">À propos</a></li>
      </ul>

      <div className="cult-nav-actions">
        <button className="cult-nav-icon-btn" aria-label="Panier">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </button>
        <button className="cult-nav-icon-btn" aria-label="Compte">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
        <button className="cult-nav-btn">REJOINDRE</button>
      </div>
    </nav>
  );
}

function SecondaryNav() {
  return (
    <div className="cult-sec-nav">
      <ul className="cult-sec-nav-list">
        {SECONDARY_NAV.map((item) => (
          <li key={item}>
            <a href="#">{item} <span className="cult-nav-chevron">▾</span></a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Hero() {
  return (
    <header className="cult-hero">
      <div className="cult-hero-bg-pattern" aria-hidden="true">
        {["ⴰ","ⵜ","ⵎ","ⵣ","ⵉ","ⵖ","ⵙ","ⴷ","ⵔ","ⵏ","ⵡ","ⵢ","ⵍ","ⴽ","ⵀ","ⵓ"].map((l,i) => (
          <span key={i} className="cult-hero-bg-letter">{l}</span>
        ))}
      </div>

      {FLOAT_LETTERS.map((letter, i) => (
        <span key={i} className="cult-hero-float">{letter}</span>
      ))}

      <div className="cult-hero-inner">
        <div className="cult-hero-label">
          <span className="cult-hero-label-dot" />
          Culture Amazigh
          <span className="cult-hero-label-dot" />
        </div>

        <h1 className="cult-hero-title">
          <span className="cult-hero-title-top">Amalay</span>
          <span className="cult-hero-title-tif">ⴰⵎⴰⵍⴰⵢ</span>
          <span className="cult-hero-title-sub">n Yimazighen</span>
        </h1>

        <p className="cult-hero-desc">
          Plongez dans l'univers fascinant de la culture amazighe — langue, musique, architecture,
          symboles et traditions d'un peuple libre qui a façonné l'Afrique du Nord depuis la nuit des temps.
        </p>

        <div className="cult-hero-cta-row">
          <button className="cult-hero-cta-primary">Explorer la culture</button>
          <button className="cult-hero-cta-ghost">Voir la documentation</button>
        </div>
      </div>

      <div className="cult-hero-scroll-hint">
        <span className="cult-hero-scroll-text">Défiler</span>
        <div className="cult-hero-scroll-line" />
      </div>
    </header>
  );
}

function StatsBar() {
  return (
    <div className="cult-stats-bar">
      {STATS.map((s) => (
        <div key={s.label} className="cult-stat">
          <span className="cult-stat-value">{s.value}</span>
          <span className="cult-stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function CategoriesSection() {
  return (
    <section className="cult-categories">
      <div className="cult-section-header">
        <p className="cult-section-tag">ⵜⵉⵖⵔⵉ · Explorer</p>
        <h2 className="cult-section-title">Univers thématiques</h2>
        <p className="cult-section-desc">
          Huit portes d'entrée vers la richesse de la civilisation amazighe
        </p>
      </div>

      <div className="cult-categories-grid">
        {CATEGORIES.map((cat) => {
          const Illus = CatIllustrations[cat.color];
          return (
            <a key={cat.id} href={`#${cat.slug}`} className="cult-cat-card" data-color={cat.color}>
              <div className="cult-cat-card-top">
                <div className="cult-cat-illus">
                  <Illus />
                </div>
                <span className="cult-cat-tif">{cat.tifinagh}</span>
              </div>
              <div className="cult-cat-card-body">
                <h3 className="cult-cat-name">{cat.name}</h3>
                <p className="cult-cat-desc">{cat.desc}</p>
                <div className="cult-cat-footer">
                  <span className="cult-cat-count">{cat.count}</span>
                  <span className="cult-cat-arrow">→</span>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function HighlightsSection() {
  return (
    <section className="cult-highlights">
      <div className="cult-section-header cult-section-header--light">
        <p className="cult-section-tag cult-section-tag--light">ⵉⵙⴻⵍⵎⴰⴷⵏ · À la une</p>
        <h2 className="cult-section-title cult-section-title--light">Regards sur la culture</h2>
      </div>

      <div className="cult-highlights-grid">
        {HIGHLIGHTS.map((h, i) => (
          <article key={i} className={`cult-hl-card cult-hl-card--${h.color}`}>
            <div className="cult-hl-card-tif">{h.tifinagh}</div>
            <div className="cult-hl-card-inner">
              <span className="cult-hl-tag">{h.tag}</span>
              <h3 className="cult-hl-title">{h.title}</h3>
              <p className="cult-hl-excerpt">{h.excerpt}</p>
              <div className="cult-hl-more">
                <div className="cult-hl-more-line" />
                <span>Lire l'article</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function QuoteSection() {
  return (
    <section className="cult-quote">
      <div className="cult-quote-deco-left">ⵣ</div>
      <div className="cult-quote-inner">
        <p className="cult-quote-tif">ⴰⵎⴰⵣⵉⵖ</p>
        <blockquote className="cult-quote-text">
          « Amazigh — l'homme libre. Non pas libre de ses chaînes,<br />
          mais libre dans son essence, dans sa langue, dans sa mémoire. »
        </blockquote>
        <p className="cult-quote-source">Proverbe amazigh</p>
      </div>
      <div className="cult-quote-deco-right">ⵣ</div>
    </section>
  );
}

function MapSection() {
  const regions = [
    { name: "Maroc", dialects: "Tarifit · Tachelhit · Tamazight", top: "38%", left: "14%" },
    { name: "Algérie", dialects: "Kabyle · Chaoui · Tamacheq", top: "30%", left: "36%" },
    { name: "Tunisie", dialects: "Nefoussi · Djerbi", top: "28%", left: "52%" },
    { name: "Libye", dialects: "Nefoussi · Ghadamès", top: "32%", left: "64%" },
    { name: "Mali · Niger", dialects: "Tamacheq · Tuareg", top: "62%", left: "44%" },
  ];

  return (
    <section className="cult-map-section">
      <div className="cult-section-header">
        <p className="cult-section-tag">ⵜⴰⵎⵓⵔⵜ · Géographie</p>
        <h2 className="cult-section-title">L'aire amazighe</h2>
        <p className="cult-section-desc">Du détroit de Gibraltar aux oasis du Sahara, une présence continue depuis 3000 ans</p>
      </div>

      <div className="cult-map-container">
        <div className="cult-map-visual">
          {/* Simplified SVG North Africa map shape */}
          <svg viewBox="0 0 700 380" xmlns="http://www.w3.org/2000/svg" className="cult-map-svg">
            <defs>
              <radialGradient id="mapGrad" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#C4622D" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#C4622D" stopOpacity="0.03" />
              </radialGradient>
            </defs>
            {/* North Africa landmass rough shape */}
            <path
              d="M60,60 L120,30 L200,20 L300,15 L400,22 L480,30 L560,60 L620,110 L650,160 L640,220 L600,260 L560,300 L500,340 L440,360 L380,370 L320,365 L260,355 L200,330 L140,290 L90,240 L50,180 L40,120 Z"
              fill="url(#mapGrad)"
              stroke="rgba(196,98,45,0.25)"
              strokeWidth="1.5"
            />
            {/* Internal region lines */}
            <line x1="220" y1="20" x2="240" y2="340" stroke="rgba(196,98,45,0.1)" strokeWidth="1" strokeDasharray="4,4"/>
            <line x1="380" y1="15" x2="400" y2="350" stroke="rgba(196,98,45,0.1)" strokeWidth="1" strokeDasharray="4,4"/>
            <line x1="510" y1="30" x2="530" y2="290" stroke="rgba(196,98,45,0.1)" strokeWidth="1" strokeDasharray="4,4"/>
            {/* Tifinagh watermark */}
            <text x="350" y="210" textAnchor="middle" fontSize="80" fill="rgba(196,98,45,0.06)" fontFamily="serif">ⵜ</text>
            {/* Region dots */}
            <circle cx="115" cy="130" r="6" fill="#C4622D" opacity=".6" />
            <circle cx="270" cy="120" r="6" fill="#C4622D" opacity=".6" />
            <circle cx="390" cy="110" r="6" fill="#C4622D" opacity=".5" />
            <circle cx="470" cy="115" r="5" fill="#C4622D" opacity=".5" />
            <circle cx="340" cy="250" r="5" fill="#C4622D" opacity=".4" />
          </svg>

          {regions.map((r) => (
            <div
              key={r.name}
              className="cult-map-pin"
              style={{ top: r.top, left: r.left }}
            >
              <div className="cult-map-pin-dot" />
              <div className="cult-map-pin-label">
                <strong>{r.name}</strong>
                <span>{r.dialects}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



// ── Page ───────────────────────────────────────────────────────────────────

export default function CultureAmazighPage() {
  return (
    <>
      <NavBar />
      <SecondaryNav />
      <Hero />
      <StatsBar />
      <CategoriesSection />
      <HighlightsSection />
      <QuoteSection />
      <MapSection />
    </>
  );
}