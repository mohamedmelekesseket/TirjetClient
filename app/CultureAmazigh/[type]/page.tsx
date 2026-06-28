"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────

type PubColor = "clay" | "amber" | "brown" | "forest" | "navy" | "plum";

interface Publication {
  id: number;
  color: PubColor;
  category: string;
  title: string;
  subtitle: string;
  body: string;
  symbol: string;
  images?: string[];
  videos?: string[];
  _skeleton?: boolean;
  _placeholder?: boolean;
}

interface VocabWord {
  tifinagh: string;
  latin: string;
  meaning: string;
}

type LoadStatus = "loading" | "success" | "error";

// ── Slug → display label map ───────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; tifinagh: string; desc: string }> = {
  langueAmazigh:  { label: "Langue amazigh",             tifinagh: "ⵜⴰⵎⴰⵣⵉⵖⵜ", desc: "La langue des hommes libres — un patrimoine millénaire, une identité vivante, une voix qui traverse les siècles et les déserts." },
  evenements:     { label: "Événements & traditions",     tifinagh: "ⵉⵎⵓⵙⵙⵏⴰⵡⵏ", desc: "Les fêtes, cérémonies et traditions vivantes du peuple amazigh à travers les saisons et les régions." },
  symboles:       { label: "Symboles et motifs berbères", tifinagh: "ⵉⵛⵉⵔⴰⵏ",    desc: "Les motifs géométriques et symboles amazighs, porteurs de sens, gravés dans la pierre, le tissu et la poterie." },
  musique:        { label: "Musique amazigh",             tifinagh: "ⵓⴷⵎⴰⵡⵏ",    desc: "Les rythmes, instruments et chants de la tradition musicale amazighe, de l'Ahwach à la Tindé." },
  patrimoine:     { label: "Patrimoine et Traditions",    tifinagh: "ⵜⴰⵎⵓⵔⵜ",    desc: "Le patrimoine immatériel amazigh : coutumes, savoir-faire et mémoire collective transmis de génération en génération." },
  agriculture:    { label: "Agriculture amazigh",         tifinagh: "ⵜⴰⴼⴰⵍⵍⴰⵃⵜ", desc: "Les pratiques agricoles ancestrales des communautés amazighes, en harmonie avec les terres et les saisons." },
  architecture:   { label: "Architecture amazigh",        tifinagh: "ⵜⴰⵙⴳⴰ",      desc: "Les ksours, greniers collectifs (agadirs) et maisons traditionnelles qui témoignent d'une architecture vernaculaire remarquable." },
  documentation:  { label: "Documentation",               tifinagh: "ⵜⵉⵔⵔⴰ",      desc: "Archives, recherches et ressources documentaires sur la culture et la civilisation amazighe." },
};

// ── Slug → exact backend ALLOWED_TYPES value ──────────────────────────────
// Backend validates against: "Langue amazigh", "Événements & traditions", etc.

const SLUG_TO_API_TYPE: Record<string, string> = {
  langueAmazigh: "Langue amazigh",
  evenements:    "Événements & traditions",
  symboles:      "Symboles et motifs berbères",
  musique:       "Musique amazigh",
  patrimoine:    "Patrimoine et Traditions",
  agriculture:   "Agriculture amazigh",
  architecture:  "Architecture amazigh",
  documentation: "Documentation",
};

// ── One placeholder per type (shown when API returns 0 results) ────────────

const TYPE_PLACEHOLDER: Record<string, Omit<Publication, "id" | "_placeholder">> = {
  langueAmazigh: {
    color: "clay", category: "Alphabet", symbol: "ⵜⵉⴼⵉⵏⴰⵖ",
    title: "Tifinagh — L'écriture ancestrale",
    subtitle: "Aucune publication pour l'instant",
    body: "Cette section accueillera bientôt des publications sur la langue amazighe. Revenez prochainement ou contribuez en rejoignant la communauté Tirjet.",
  },
  evenements: {
    color: "amber", category: "Fêtes", symbol: "ⵢⵉⵏⵏⴰⵢⵔ",
    title: "Événements & Traditions",
    subtitle: "Aucune publication pour l'instant",
    body: "Les fêtes, cérémonies et traditions vivantes du peuple amazigh seront documentées ici. Rejoignez Tirjet pour contribuer.",
  },
  symboles: {
    color: "brown", category: "Géométrie", symbol: "ⵣ",
    title: "Symboles et Motifs Berbères",
    subtitle: "Aucune publication pour l'instant",
    body: "Les motifs géométriques et symboles amazighs seront présentés ici. Participez à la documentation de ce patrimoine visuel.",
  },
  musique: {
    color: "forest", category: "Instruments", symbol: "ⴱⵏⴷⵉⵔ",
    title: "Musique Amazigh",
    subtitle: "Aucune publication pour l'instant",
    body: "Les rythmes, instruments et chants de la tradition musicale amazighe trouveront leur place ici. Rejoignez la communauté pour contribuer.",
  },
  patrimoine: {
    color: "navy", category: "Savoir-faire", symbol: "ⵜⴰⵎⵓⵔⵜ",
    title: "Patrimoine et Traditions",
    subtitle: "Aucune publication pour l'instant",
    body: "Le patrimoine immatériel amazigh sera documenté ici. Coutumes, savoir-faire et mémoire collective attendent d'être partagés.",
  },
  agriculture: {
    color: "plum", category: "Irrigation", symbol: "ⴰⵏⵣⴰⵔ",
    title: "Agriculture Amazigh",
    subtitle: "Aucune publication pour l'instant",
    body: "Les pratiques agricoles ancestrales des communautés amazighes seront présentées ici. Contribuez à la valorisation de ce savoir.",
  },
  architecture: {
    color: "clay", category: "Pisé", symbol: "ⴰⴽⴰⵍ",
    title: "Architecture Amazigh",
    subtitle: "Aucune publication pour l'instant",
    body: "Les ksours, agadirs et kasbahs de la tradition amazighe seront documentés ici. Rejoignez Tirjet pour enrichir cette section.",
  },
  documentation: {
    color: "amber", category: "Archives", symbol: "ⵜⵉⵔⵔⴰ",
    title: "Documentation",
    subtitle: "Aucune publication pour l'instant",
    body: "Archives, recherches et ressources documentaires sur la culture amazighe seront disponibles ici prochainement.",
  },
};

const DEFAULT_PLACEHOLDER: Omit<Publication, "id" | "_placeholder"> = {
  color: "clay", category: "Culture", symbol: "ⴰⵎⴰⵣⵉⵖ",
  title: "Aucune publication disponible",
  subtitle: "Revenez bientôt",
  body: "Cette section n'a pas encore de publications. Rejoignez la communauté Tirjet pour contribuer à la valorisation de la culture amazighe.",
};

// ── Static data ────────────────────────────────────────────────────────────

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

// ── Color → hex map ────────────────────────────────────────────────────────

const COLOR_HEX: Record<PubColor, { hex: string; bg: string }> = {
  clay:   { hex: "#C4622D", bg: "rgba(196,98,45,0.10)"   },
  amber:  { hex: "#8B6914", bg: "rgba(139,105,20,0.10)"  },
  brown:  { hex: "#5C4A1E", bg: "rgba(92,74,30,0.10)"    },
  forest: { hex: "#2D5016", bg: "rgba(45,80,22,0.10)"    },
  navy:   { hex: "#1A3A5C", bg: "rgba(26,58,92,0.10)"    },
  plum:   { hex: "#7B2D8B", bg: "rgba(123,45,139,0.10)"  },
};

const COLORS: PubColor[] = ["clay", "amber", "brown", "forest", "navy", "plum"];

// ── Config ─────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ── Dynamic SVG illustration (fallback when no images) ────────────────────

function DynamicIllustration({ color, symbol, category }: { color: PubColor; symbol: string; category: string }) {
  const { hex, bg } = COLOR_HEX[color] || COLOR_HEX.clay;
  const letters = symbol ? [...symbol].slice(0, 6) : ["ⴰ","ⵜ","ⵎ"];
  const positions = [
    [10, 55], [75, 55], [135, 55],
    [10, 118],[75, 118],[135, 118],
  ];
  return (
    <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
      <rect width="200" height="160" fill={bg} rx="12" />
      {letters.map((l, i) => {
        const [x, y] = positions[i] || [10 + i * 60, 85];
        return (
          <text key={i} x={x} y={y} fontSize="42"
            fill={hex} opacity={0.3 + i * 0.07} fontFamily="serif">{l}</text>
        );
      })}
      <text x="10" y="152" fontSize="10" fill={hex} opacity=".50" fontFamily="monospace">
        {category?.toUpperCase()} · TIRJET
      </text>
    </svg>
  );
}

// ── Image carousel ─────────────────────────────────────────────────────────

function ImageCarousel({ images, videos, color, symbol, category, tag }: {
  images: string[];
  videos?: string[];
  color: PubColor;
  symbol: string;
  category: string;
  tag: string;
}) {
  const [current, setCurrent] = useState(0);
  const mediaItems = [...images, ...(videos || [])];
  const hasMultiple = mediaItems.length > 1;

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent(i => (i - 1 + mediaItems.length) % mediaItems.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent(i => (i + 1) % mediaItems.length);
  };

  // No real media — show SVG fallback
  if (mediaItems.length === 0) {
    return (
      <>
        <span className="langue-pub-visual-tag">{tag}</span>
        <DynamicIllustration color={color} symbol={symbol} category={category} />
        <span className="langue-pub-visual-symbol">{symbol}</span>
      </>
    );
  }

  const currentMedia = mediaItems[current];
  const isVideo = currentMedia.match(/\.(mp4|webm|ogg|mov)$/i) || (videos && videos.includes(currentMedia));

  return (
    <>
      {/* Media strip */}
      <div style={{ position: "absolute", width: "100%", height: "100%", overflow: "hidden", borderRadius: "inherit" }}>
        {isVideo ? (
          <video
            src={currentMedia}
            controls
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <img
            src={currentMedia}
            alt={`${category} ${current + 1}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transition: "opacity 0.25s ease",
            }}
          />
        )}

        {/* Dark gradient at bottom for text legibility */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)",
          pointerEvents: "none",
        }} />

        {/* Arrows — only when multiple media */}
        {hasMultiple && (
          <>
            <button
              onClick={prev}
              aria-label="Média précédent"
              style={{
                position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.82)", border: "none", borderRadius: "50%",
                width: 30, height: 30, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 6px rgba(0,0,0,0.22)",
                fontSize: 14, color: "#333", zIndex: 2,
                transition: "background 0.15s",
              }}
            >‹</button>
            <button
              onClick={next}
              aria-label="Média suivant"
              style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.82)", border: "none", borderRadius: "50%",
                width: 30, height: 30, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 6px rgba(0,0,0,0.22)",
                fontSize: 14, color: "#333", zIndex: 2,
                transition: "background 0.15s",
              }}
            >›</button>

            {/* Dot indicators */}
            <div style={{
              position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
              display: "flex", gap: 5, zIndex: 2,
            }}>
              {mediaItems.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                  aria-label={`Média ${i + 1}`}
                  style={{
                    width: i === current ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === current ? "#fff" : "rgba(255,255,255,0.5)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "width 0.2s, background 0.2s",
                  }}
                />
              ))}
            </div>

            {/* Counter badge */}
            <span style={{
              position: "absolute", top: 8, right: 8,
              background: "rgba(0,0,0,0.5)", color: "#fff",
              fontSize: 11, padding: "2px 7px", borderRadius: 10,
              fontFamily: "monospace", zIndex: 2,
            }}>
              {current + 1}/{mediaItems.length}
            </span>
          </>
        )}
      </div>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Breadcrumb({ label }: { label: string }) {
  return (
    <div className="langue-breadcrumb">
      <a href="/CultureAmazigh">Culture Amazigh</a>
      <span className="langue-breadcrumb-sep">›</span>
      <span className="langue-breadcrumb-current">{label}</span>
    </div>
  );
}

function Hero({ meta }: { meta: { label: string; tifinagh: string; desc: string } }) {
  return (
    <header className="langue-hero">
      <div className="langue-hero-watermark">ⵜ</div>
      {FLOAT_LETTERS.map((letter, i) => (
        <span key={i} className="langue-hero-float">{letter}</span>
      ))}
      <div className="langue-hero-content">
        <p className="langue-hero-tag">Culture Amazigh · {meta.label}</p>
        <h1 className="langue-hero-title">{meta.label}</h1>
        <p className="langue-hero-tifinagh">{meta.tifinagh}</p>
        <p className="langue-hero-desc">{meta.desc}</p>
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
    <article
      className="langue-pub-card"
      data-color={pub.color}
      style={pub._placeholder ? { opacity: 0.75 } : undefined}
    >
      <div className="langue-pub-visual">
        <ImageCarousel
          images={pub.images ?? []}
          videos={pub.videos}
          color={pub.color}
          symbol={pub.symbol}
          category={pub.category}
          tag={pub.category}
        />
      </div>
      <div className="langue-pub-body">
        <p className="langue-pub-cat">{pub.category}</p>
        <h2 className="langue-pub-title">{pub.title}</h2>
        <p className="langue-pub-subtitle">{pub.subtitle}</p>
        <p className="langue-pub-text">{pub.body}</p>
        {!pub._placeholder && (
          <div className="langue-pub-more">
            <div className="langue-pub-more-bar" />
            <span className="langue-pub-more-text">En savoir plus</span>
          </div>
        )}
        {pub._placeholder && (
          <div className="langue-pub-more" style={{ opacity: 0.5 }}>
            <div className="langue-pub-more-bar" />
            <span className="langue-pub-more-text" style={{ fontStyle: "italic" }}>
              Bientôt disponible
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

function SkeletonCard({ index }: { index: number }) {
  const color = COLORS[index % COLORS.length];
  return (
    <article className="langue-pub-card" data-color={color} style={{ opacity: 0.55 }}>
      <div className="langue-pub-visual">
        <span className="langue-pub-visual-tag" style={{ background: "rgba(255,255,255,0.15)" }}>…</span>
        <DynamicIllustration color={color} symbol="ⴰⵜⵎ" category="Chargement" />
        <span className="langue-pub-visual-symbol">ⴰ</span>
      </div>
      <div className="langue-pub-body" style={{ animation: "pulse 1.4s ease-in-out infinite" }}>
        <p className="langue-pub-cat" style={{ background: "currentColor", borderRadius: 4, height: 10, width: "40%", color: "transparent", opacity: 0.15, marginBottom: 8 }} />
        <h2 className="langue-pub-title" style={{ background: "currentColor", borderRadius: 4, height: 16, width: "80%", color: "transparent", opacity: 0.15, marginBottom: 8 }} />
        <p className="langue-pub-subtitle" style={{ background: "currentColor", borderRadius: 4, height: 11, width: "60%", color: "transparent", opacity: 0.12 }} />
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

function StatusBanner({ status, onRetry, show }: { status: LoadStatus; onRetry: () => void; show: boolean }) {
  if (status === "loading") {
    return (
      <div style={{
        textAlign: "center", padding: "12px 20px",
        background: "rgba(196,98,45,0.08)", borderBottom: "1px solid rgba(196,98,45,0.15)",
        fontSize: 13, color: "#C4622D", letterSpacing: "0.05em",
        fontFamily: "serif", fontStyle: "italic",
      }}>
        ⵜ &nbsp; Chargement des publications depuis la base de données… &nbsp; ⵜ
      </div>
    );
  }
  if (status === "error" && show) {
    return (
      <div style={{
        textAlign: "center", padding: "12px 20px",
        background: "rgba(196,98,45,0.08)", borderBottom: "1px solid rgba(196,98,45,0.15)",
        fontSize: 13, color: "#C4622D", letterSpacing: "0.05em",
        fontFamily: "serif", display: "flex", alignItems: "center",
        justifyContent: "center", gap: 12,
      }}>
        <span>Impossible de charger les publications — vérifiez la connexion au serveur.</span>
        <button onClick={onRetry} style={{
          background: "rgba(196,98,45,0.15)", border: "1px solid rgba(196,98,45,0.4)",
          color: "#C4622D", padding: "4px 12px", borderRadius: 4,
          cursor: "pointer", fontSize: 12, fontFamily: "serif",
        }}>Réessayer</button>
      </div>
    );
  }
  if (status === "success") {
    return (
      <div style={{
        textAlign: "center", padding: "10px 20px",
        background: "rgba(45,80,22,0.06)", borderBottom: "1px solid rgba(45,80,22,0.12)",
        fontSize: 12, color: "#2D5016", letterSpacing: "0.05em", fontFamily: "serif",
      }}>
        ✦ &nbsp; Publications chargées depuis la base de données Tirjet &nbsp; ✦
      </div>
    );
  }
  return null;
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CultureAmazighPage() {
  const params = useParams();
  const typeParam = Array.isArray(params?.type) ? params.type[0] : (params?.type ?? "langueAmazigh");

  const meta = TYPE_META[typeParam] ?? {
    label: typeParam,
    tifinagh: "ⴰⵎⴰⵣⵉⵖ",
    desc: "Découvrez la richesse de la culture et de la civilisation amazighe.",
  };

  // Build the one placeholder for this type
  const placeholderData = TYPE_PLACEHOLDER[typeParam] ?? DEFAULT_PLACEHOLDER;
  const placeholder: Publication = { id: 1, _placeholder: true, ...placeholderData };

  const [publications, setPublications] = useState<Publication[] | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [showErrorBanner, setShowErrorBanner] = useState(false);

  const loadPublications = async () => {
    setStatus("loading");
    setPublications(null);
    setShowErrorBanner(false);
    try {
      // Map frontend slug → backend ALLOWED_TYPES value (e.g. "langueAmazigh" → "Langue amazigh")
      const apiType = SLUG_TO_API_TYPE[typeParam] ?? typeParam;
      const res = await fetch(`${API}/api/culture-amazigh/type/${encodeURIComponent(apiType)}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();

      const pubs: Publication[] = (data.cultures || data.data || []).map(
        (c: any, i: number): Publication => ({
          id:       i + 1,
          color:    COLORS[i % COLORS.length],
          category: c.type        ?? "Culture",
          title:    c.title       ?? "Publication amazighe",
          subtitle: c.Auteur      ?? "",
          symbol:   c.symbol      ?? "ⴰⵎⴰⵣⵉⵖ",
          body:     c.description ?? "",
          images:   Array.isArray(c.images) ? c.images.filter(Boolean) : [],
          videos:   Array.isArray(c.videos) ? c.videos.filter(Boolean) : [],
        })
      );

      if (pubs.length === 0) {
        // API is reachable but no publications yet → show placeholder
        setPublications([placeholder]);
      } else {
        setPublications(pubs);
      }
      setStatus("success");
    } catch (err) {
      console.error("API fetch failed:", err);
      // Network / server error → show placeholder + error banner
      setPublications([placeholder]);
      setStatus("error");
      setShowErrorBanner(true);
    }
  };

  useEffect(() => {
    loadPublications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeParam]);

  // While loading: show 3 skeleton cards
  const displayPubs: Publication[] =
    publications ?? Array.from({ length: 3 }, (_, i) => ({
      id: i, _skeleton: true, color: COLORS[i],
      category: "", title: "", subtitle: "", body: "", symbol: "",
    }));

  return (
    <>
      <Breadcrumb label={meta.label} />
      <Hero meta={meta} />
      <StatusBanner status={status} onRetry={loadPublications} show={showErrorBanner} />
      <Marquee />
      <main className="langue-publications">
        {displayPubs.map((pub, i) =>
          pub._skeleton
            ? <SkeletonCard key={`skel-${i}`} index={i} />
            : <PublicationCard key={pub.id} pub={pub} />
        )}
      </main>
      <VocabSection />
      <AlphabetSection />
      <Footer />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 0.75; }
        }
      `}</style>
    </>
  );
}