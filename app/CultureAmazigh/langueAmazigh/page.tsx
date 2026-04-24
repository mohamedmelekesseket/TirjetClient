import type { ReactNode } from "react";

// ── Types ──────────────────────────────────────────────────────────────────

interface Publication {
  id: number;
  color: "clay" | "amber" | "brown" | "forest" | "navy" | "plum";
  category: string;
  title: string;
  subtitle: string;
  body: string;
  symbol: string;
  illustration: ReactNode;
}

interface VocabWord {
  tifinagh: string;
  latin: string;
  meaning: string;
}

// ── Data ───────────────────────────────────────────────────────────────────

const MARQUEE_WORDS = [
  "ⴰⵣⵓⵍ", "ⵜⴰⵎⴰⵣⵉⵖⵜ", "ⵜⵉⴼⵉⵏⴰⵖ",
  "ⵉⵣⵍⴰⵏ", "ⵜⴰⵏⵎⵉⵔⵜ", "ⴰⵎⴰⵣⵉⵖ",
  "ⵜⴰⴼⴰⵜ", "ⵓⵙⵙⵓⴼⴼⵖ",
];

const FLOAT_LETTERS = ["ⴰ", "ⵜ", "ⵎ", "ⵣ", "ⵉ", "ⵖ", "ⵙ", "ⴷ"];

const ALPHABET = [
  "ⴰ","ⴱ","ⴳ","ⴷ","ⴻ","ⴼ","ⵀ","ⵉ",
  "ⵊ","ⴽ","ⵍ","ⵎ","ⵏ","ⵓ","ⵔ","ⵙ",
  "ⵜ","ⵡ","ⵢ","ⵣ","ⵥ","ⵖ",
];

const VOCAB: VocabWord[] = [
  { tifinagh: "ⴰⵣⵓⵍ",    latin: "Azul",    meaning: "Bonjour"     },
  { tifinagh: "ⵜⴰⵏⵎⵉⵔⵜ", latin: "Tanmirt", meaning: "Merci"       },
  { tifinagh: "ⵜⴰⴼⴰⵜ",   latin: "Tafat",   meaning: "Lumière"     },
  { tifinagh: "ⴰⵎⴰⵣⵉⵖ",  latin: "Amazigh", meaning: "Homme libre" },
  { tifinagh: "ⵜⴰⵎⵓⵔⵜ",  latin: "Tamurt",  meaning: "Pays / Terre"},
  { tifinagh: "ⵉⵖⵔⵎ",    latin: "Ighrem",  meaning: "Village"     },
  { tifinagh: "ⵜⵉⵔⵔⴰ",   latin: "Tirra",   meaning: "Écriture"    },
  { tifinagh: "ⵓⴷⵎ",      latin: "Udm",     meaning: "Visage"      },
];

// ── SVG Illustrations ──────────────────────────────────────────────────────

const IllustrationAlphabet = () => (
  <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="160" fill="rgba(196,98,45,0.10)" rx="12" />
    <text x="10"  y="55"  fontSize="42" fill="#C4622D" opacity=".35" fontFamily="serif">ⴰ</text>
    <text x="75"  y="55"  fontSize="42" fill="#C4622D" opacity=".45" fontFamily="serif">ⵜ</text>
    <text x="135" y="55"  fontSize="42" fill="#C4622D" opacity=".55" fontFamily="serif">ⵎ</text>
    <text x="10"  y="118" fontSize="42" fill="#C4622D" opacity=".40" fontFamily="serif">ⵣ</text>
    <text x="75"  y="118" fontSize="42" fill="#C4622D" opacity=".50" fontFamily="serif">ⵉ</text>
    <text x="135" y="118" fontSize="42" fill="#C4622D" opacity=".60" fontFamily="serif">ⵖ</text>
    <text x="10"  y="152" fontSize="10" fill="#C4622D" opacity=".50" fontFamily="monospace">TIFINAGH · 3000 ANS</text>
  </svg>
);

const IllustrationDialects = () => (
  <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="160" fill="rgba(139,105,20,0.10)" rx="12" />
    <circle cx="45"  cy="52"  r="26" fill="#8B6914" opacity=".15" />
    <text x="45"  y="47"  textAnchor="middle" fontSize="9" fill="#8B6914" fontWeight="bold">Tarifit</text>
    <text x="45"  y="60"  textAnchor="middle" fontSize="8" fill="#8B6914" opacity=".7">Rif</text>
    <circle cx="145" cy="52"  r="26" fill="#8B6914" opacity=".20" />
    <text x="145" y="47"  textAnchor="middle" fontSize="9" fill="#8B6914" fontWeight="bold">Tachelhit</text>
    <text x="145" y="60"  textAnchor="middle" fontSize="8" fill="#8B6914" opacity=".7">Souss</text>
    <circle cx="80"  cy="115" r="24" fill="#8B6914" opacity=".15" />
    <text x="80"  y="110" textAnchor="middle" fontSize="9" fill="#8B6914" fontWeight="bold">Kabyle</text>
    <text x="80"  y="123" textAnchor="middle" fontSize="8" fill="#8B6914" opacity=".7">Kabylie</text>
    <circle cx="160" cy="118" r="20" fill="#8B6914" opacity=".18" />
    <text x="160" y="113" textAnchor="middle" fontSize="9" fill="#8B6914" fontWeight="bold">Tamacheq</text>
    <text x="160" y="126" textAnchor="middle" fontSize="8" fill="#8B6914" opacity=".7">Sahara</text>
  </svg>
);

const IllustrationPoetry = () => (
  <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="160" fill="rgba(92,74,30,0.10)" rx="12" />
    <text x="100" y="62"  textAnchor="middle" fontSize="46" fill="#5C4A1E" opacity=".22">♪</text>
    <text x="100" y="90"  textAnchor="middle" fontSize="14" fill="#5C4A1E" fontFamily="serif" fontStyle="italic" opacity=".8">« Izlan »</text>
    <text x="100" y="110" textAnchor="middle" fontSize="11" fill="#5C4A1E" opacity=".6">Poésie chantée</text>
    <text x="100" y="142" textAnchor="middle" fontSize="26" fill="#5C4A1E" opacity=".18" fontFamily="serif">ⵉⵣⵍⴰⵏ</text>
  </svg>
);

const IllustrationRecognition = () => (
  <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="160" fill="rgba(45,80,22,0.10)" rx="12" />
    <polygon points="100,18 122,72 180,72 132,104 150,158 100,124 50,158 68,104 20,72 78,72" fill="#2D5016" opacity=".20" />
    <text x="100" y="96"  textAnchor="middle" fontSize="11" fill="#2D5016" fontWeight="bold">Officielle</text>
    <text x="100" y="114" textAnchor="middle" fontSize="9"  fill="#2D5016" opacity=".7">2011 · 2016</text>
  </svg>
);

const IllustrationVocab = () => (
  <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="160" fill="rgba(26,58,92,0.10)" rx="12" />
    <text x="18"  y="44"  fontSize="22" fill="#1A3A5C" opacity=".65" fontFamily="serif">ⴰⵣⵓⵍ</text>
    <text x="100" y="44"  fontSize="13" fill="#1A3A5C" fontFamily="serif" fontStyle="italic">Azul</text>
    <text x="18"  y="90"  fontSize="22" fill="#1A3A5C" opacity=".65" fontFamily="serif">ⵜⴰⵏⵎⵉⵔⵜ</text>
    <text x="118" y="90"  fontSize="13" fill="#1A3A5C" fontFamily="serif" fontStyle="italic">Tanmirt</text>
    <text x="18"  y="136" fontSize="22" fill="#1A3A5C" opacity=".65" fontFamily="serif">ⵜⴰⴼⴰⵜ</text>
    <text x="100" y="136" fontSize="13" fill="#1A3A5C" fontFamily="serif" fontStyle="italic">Tafat</text>
  </svg>
);

const IllustrationTransmission = () => (
  <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="160" fill="rgba(123,45,139,0.10)" rx="12" />
    <circle cx="60"  cy="66" r="18" fill="#7B2D8B" opacity=".15" />
    <text x="60"  y="72" textAnchor="middle" fontSize="20" fill="#7B2D8B">♦</text>
    <circle cx="100" cy="66" r="21" fill="#7B2D8B" opacity=".20" />
    <text x="100" y="72" textAnchor="middle" fontSize="20" fill="#7B2D8B">♦</text>
    <circle cx="140" cy="66" r="24" fill="#7B2D8B" opacity=".25" />
    <text x="140" y="72" textAnchor="middle" fontSize="20" fill="#7B2D8B">♦</text>
    <path d="M60,82 Q100,122 140,82" stroke="#7B2D8B" strokeWidth="1.5" fill="none" opacity=".4" strokeDasharray="4,3" />
    <text x="100" y="145" textAnchor="middle" fontSize="10" fill="#7B2D8B" opacity=".7">Imedyazen · Bardes</text>
  </svg>
);

const PUBLICATIONS: Publication[] = [
  {
    id: 1, color: "clay", category: "Alphabet",
    title: "Tifinagh — L'écriture ancestrale", subtitle: "Plus de 3000 ans d'histoire",
    symbol: "ⵜⵉⴼⵉⵏⴰⵖ",
    body: "Le Tifinagh est l'alphabet utilisé pour écrire la langue berbère depuis l'Antiquité. Retrouvé dans des inscriptions rupestres à travers l'Afrique du Nord et le Sahara, il témoigne d'une civilisation riche et ancienne. Aujourd'hui standardisé par l'IRCAM au Maroc, il connaît un renouveau remarquable.",
    illustration: <IllustrationAlphabet />,
  },
  {
    id: 2, color: "amber", category: "Dialectes",
    title: "Une langue, mille voix", subtitle: "Du Rif au Hoggar",
    symbol: "ⵜⴰⵎⴰⵣⵉⵖⵜ",
    body: "Le Tamazight regroupe une famille de dialectes : le Tarifit (nord du Maroc), le Tachelhit (sud du Maroc), le Kabyle (Algérie), le Tamacheq (Touareg du Sahara), et bien d'autres. Chaque variété est un trésor vivant, porteur d'une identité unique et d'une mémoire collective irremplaçable.",
    illustration: <IllustrationDialects />,
  },
  {
    id: 3, color: "brown", category: "Poésie",
    title: "Izlan — La poésie berbère", subtitle: "Chants de résistance et d'amour",
    symbol: "ⵉⵣⵍⴰⵏ",
    body: "La poésie amazighe, ou «izlan», est une forme d'expression orale transmise de génération en génération. Elle aborde l'amour, la nature, l'exil et la résistance. Des poétesses comme Taos Amrouche ont porté ces chants vers le monde entier, faisant de la langue une musique universelle.",
    illustration: <IllustrationPoetry />,
  },
  {
    id: 4, color: "forest", category: "Reconnaissance",
    title: "Officialisation & Renaissance", subtitle: "Un avenir pour la langue",
    symbol: "ⵓⵙⵙⵓⴼⴼⵖ",
    body: "Au fil des décennies, le Tamazight a gagné en reconnaissance institutionnelle. Langue co-officielle au Maroc depuis 2011 et en Algérie depuis 2016, elle est désormais enseignée dans les écoles. Des académies, médias et artistes contribuent chaque jour à sa revitalisation et à sa modernisation.",
    illustration: <IllustrationRecognition />,
  },
  {
    id: 5, color: "navy", category: "Vocabulaire",
    title: "Mots essentiels", subtitle: "Découvrir le Tamazight",
    symbol: "ⴰⵣⵓⵍ",
    body: "Apprendre quelques mots en Tamazight, c'est ouvrir une porte sur une culture millénaire. «Azul» pour bonjour, «Tanmirt» pour merci, «Tafat» pour lumière… Chaque mot porte en lui une vision du monde, une façon d'être ensemble et de nommer la vie avec poésie.",
    illustration: <IllustrationVocab />,
  },
  {
    id: 6, color: "plum", category: "Transmission",
    title: "Les gardiens de la mémoire", subtitle: "Imedyazen — Bardes amazighs",
    symbol: "ⵉⵎⴷⵢⴰⵣⴻⵏ",
    body: "Les «Imedyazen» sont les poètes-bardes itinérants de la tradition amazighe. Véritables encyclopédies vivantes, ils ont préservé la langue à travers les siècles en chantant l'histoire, les mythes et les valeurs de leur peuple. Leur héritage inspire aujourd'hui une nouvelle génération d'artistes.",
    illustration: <IllustrationTransmission />,
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────


function Breadcrumb() {
  return (
    <div className="langue-breadcrumb">
      <a href="#">Culture Amazigh</a>
      <span className="langue-breadcrumb-sep">›</span>
      <span className="langue-breadcrumb-current">Langue</span>
    </div>
  );
}

function Hero() {
  return (
    <header className="langue-hero">
      <div className="langue-hero-watermark">ⵜ</div>
      {FLOAT_LETTERS.map((letter, i) => (
        <span key={i} className="langue-hero-float">{letter}</span>
      ))}
      <div className="langue-hero-content">
        <p className="langue-hero-tag">Culture Amazigh · Langue</p>
        <h1 className="langue-hero-title">Tamazight</h1>
        <p className="langue-hero-tifinagh">ⵜⴰⵎⴰⵣⵉⵖⵜ</p>
        <p className="langue-hero-desc">
          La langue des hommes libres — un patrimoine millénaire, une identité vivante,
          une voix qui traverse les siècles et les déserts.
        </p>
        <div className="langue-hero-divider">
          <div className="langue-hero-divider-line" />
          <span className="langue-hero-divider-gem">✦</span>
          <div className="langue-hero-divider-line langue-right" />
        </div>
      </div>
    </header>
  );
}

function Marquee() {
  const items = [...MARQUEE_WORDS, ...MARQUEE_WORDS];
  return (
    <div className="langue-marquee-wrap">
      <div className="langue-marquee-track">
        {items.map((word, i) => (
          <span key={i} className="langue-marquee-item">
            {word}
            <span className="langue-marquee-dot" />
          </span>
        ))}
      </div>
    </div>
  );
}

function PublicationCard({ pub }: { pub: Publication }) {
  return (
    <article className="langue-pub-card" data-color={pub.color}>
      <div className="langue-pub-visual">
        <span className="langue-pub-visual-tag">{pub.category}</span>
        {pub.illustration}
        <span className="langue-pub-visual-symbol">{pub.symbol}</span>
      </div>
      <div className="langue-pub-body">
        <p className="langue-pub-cat">{pub.category}</p>
        <h2 className="langue-pub-title">{pub.title}</h2>
        <p className="langue-pub-subtitle">{pub.subtitle}</p>
        <p className="langue-pub-text">{pub.body}</p>
        <div className="langue-pub-more">
          <div className="langue-pub-more-bar" />
          <span className="langue-pub-more-text">En savoir plus</span>
        </div>
      </div>
    </article>
  );
}

function VocabSection() {
  return (
    <section className="langue-vocab-section">
      <div className="langue-section-header">
        <p className="langue-section-tag">Vocabulaire · Mots essentiels</p>
        <h2 className="langue-section-title">Premiers Mots en Tamazight</h2>
      </div>
      <div className="langue-vocab-grid">
        {VOCAB.map((word) => (
          <div key={word.latin} className="langue-vocab-card">
            <span className="langue-vocab-tif">{word.tifinagh}</span>
            <span className="langue-vocab-latin">{word.latin}</span>
            <span className="langue-vocab-meaning">{word.meaning}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AlphabetSection() {
  return (
    <section className="langue-alpha-section">
      <div className="langue-section-header">
        <p className="langue-section-tag">L'Alphabet · Tifinagh</p>
        <h2 className="langue-section-title">Les signes du Tifinagh</h2>
      </div>
      <div className="langue-alpha-grid">
        {ALPHABET.map((letter, i) => (
          <div key={i} className="langue-alpha-letter">{letter}</div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="langue-footer">
      <p className="langue-footer-tif">ⴰⵎⴰⵣⵉⵖ</p>
      <h3 className="langue-footer-title">
        Préserver la langue, c'est préserver l'âme d'un peuple
      </h3>
      <p className="langue-footer-desc">
        Rejoignez Tirjet et participez à la valorisation de la culture et de la langue amazighe.
      </p>
      <button className="langue-footer-btn">REJOINDRE LA COMMUNAUTÉ</button>
      <p className="langue-footer-copy">© 2026 TIRJET · CULTURE AMAZIGHE</p>
    </footer>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function LangueAmazighPage() {
  return (
    <>
      <Breadcrumb />
      <Hero />
      <Marquee />
      <main className="langue-publications">
        {PUBLICATIONS.map((pub) => (
          <PublicationCard key={pub.id} pub={pub} />
        ))}
      </main>
      <VocabSection />
      <AlphabetSection />
      <Footer />
    </>
  );
}