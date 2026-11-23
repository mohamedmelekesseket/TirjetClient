"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type PubColor = "clay" | "amber" | "brown" | "forest" | "navy" | "plum";

interface Publication {
  id: string | number;
  color: PubColor;
  category: string;
  title: string;
  subtitle: string;
  body: string;
  symbol: string;
  images?: string[];
  videos?: string[];
  videoUrls?: string[];
  _skeleton?: boolean;
  _placeholder?: boolean;
}

interface VocabWord {
  tifinagh: string;
  latin: string;
  meaning: string;
}

type LoadStatus = "loading" | "success" | "error";

interface ApiPublication {
  _id?: string;
  Auteur?: string;
  title?: string;
  description?: string;
  type?: string;
  symbol?: string;
  images?: unknown[];
  videos?: unknown[];
  videoUrls?: unknown[];
}

interface CultureListResponse {
  cultures?: ApiPublication[];
  data?: ApiPublication[];
  pages?: number;
  total?: number;
}

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

// ── Image lightbox (zoom / pan / pinch / gallery) ──────────────────────────

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function ImageLightbox({
  images,
  startIndex,
  alt,
  onClose,
}: {
  images: string[];
  startIndex: number;
  alt: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const pinchStart = useRef({ dist: 0, scale: 1 });
  const moved = useRef(false);

  const hasMultiple = images.length > 1;

  const resetView = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const changeScale = useCallback((next: number) => {
    const s = clamp(next, MIN_SCALE, MAX_SCALE);
    setScale(s);
    if (s === MIN_SCALE) setPos({ x: 0, y: 0 });
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => (i + dir + images.length) % images.length);
      resetView();
    },
    [images.length, resetView]
  );

  // Keyboard + body scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && hasMultiple) go(1);
      else if (e.key === "ArrowLeft" && hasMultiple) go(-1);
      else if (e.key === "+" || e.key === "=") setScale((s) => clamp(s * 1.25, MIN_SCALE, MAX_SCALE));
      else if (e.key === "-") changeScale(scale / 1.25);
      else if (e.key === "0") resetView();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, go, hasMultiple, changeScale, resetView, scale]);

  const onWheel = (e: React.WheelEvent) => {
    changeScale(scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;

    if (pointers.current.size === 1) {
      dragStart.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
      if (scale > 1) setDragging(true);
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale };
      setDragging(false);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchStart.current.dist > 0) {
        changeScale(pinchStart.current.scale * (dist / pinchStart.current.dist));
      }
      moved.current = true;
      return;
    }

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved.current = true;
    if (scale > 1) {
      setPos({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) setDragging(false);
  };

  // Click on image toggles zoom (ignored if it was a drag)
  const onImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (moved.current) return;
    if (scale > 1) resetView();
    else changeScale(2.5);
  };

  // Click on the dark backdrop closes (ignored if it was a drag)
  const onBackdropClick = () => {
    if (moved.current) return;
    onClose();
  };

  return createPortal(
    <motion.div
      className="langue-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Agrandissement de l'image"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Toolbar */}
      <div className="langue-lightbox-toolbar" onClick={(e) => e.stopPropagation()}>
        <span className="langue-lightbox-counter">
          {index + 1} / {images.length}
        </span>
        <div className="langue-lightbox-actions">
          <button type="button" onClick={() => changeScale(scale / 1.25)} disabled={scale <= MIN_SCALE} aria-label="Dézoomer">
            <ZoomOut size={18} />
          </button>
          <span className="langue-lightbox-zoom">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => changeScale(scale * 1.25)} disabled={scale >= MAX_SCALE} aria-label="Zoomer">
            <ZoomIn size={18} />
          </button>
          <button type="button" onClick={resetView} disabled={scale === 1} aria-label="Réinitialiser le zoom">
            <RotateCcw size={17} />
          </button>
          <button type="button" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Stage */}
      <div
        className="langue-lightbox-stage"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onBackdropClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={images[index]}
          src={images[index]}
          alt={`${alt} ${index + 1}`}
          draggable={false}
          onClick={onImageClick}
          onDoubleClick={(e) => e.stopPropagation()}
          className="langue-lightbox-img"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in",
            transition: dragging ? "none" : "transform 0.2s ease",
          }}
        />
      </div>

      {hasMultiple && (
        <>
          <button
            type="button"
            className="langue-lightbox-nav langue-lightbox-prev"
            aria-label="Image précédente"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
          >
            <ChevronLeft size={26} />
          </button>
          <button
            type="button"
            className="langue-lightbox-nav langue-lightbox-next"
            aria-label="Image suivante"
            onClick={(e) => { e.stopPropagation(); go(1); }}
          >
            <ChevronRight size={26} />
          </button>
        </>
      )}

      <p className="langue-lightbox-hint">
        Molette ou pincer pour zoomer · Glisser pour déplacer · Échap pour fermer
      </p>
    </motion.div>,
    document.body
  );
}

// ── Image carousel ─────────────────────────────────────────────────────────

function ImageCarousel({ images, videos, videoUrls, color, symbol, category, tag }: {
  images: string[];
  videos?: string[];
  videoUrls?: string[];
  color: PubColor;
  symbol: string;
  category: string;
  tag: string;
}) {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const mediaItems = [
    ...images.map(src => ({ src, kind: "image" as const })),
    ...(videos || []).map(src => ({ src, kind: "video" as const })),
    ...(videoUrls || []).map(src => ({ src, kind: "link" as const })),
  ];
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
  const embedUrl = currentMedia.kind === "link" ? getVideoEmbedUrl(currentMedia.src) : null;
  const externalUrl = currentMedia.kind === "link" ? getSafeExternalUrl(currentMedia.src) : null;
  const isImage = currentMedia.kind === "image";

  // Images come first in mediaItems, so `current` is also the index in `images`
  const openLightbox = () => {
    if (isImage) setLightboxOpen(true);
  };

  return (
    <>
      {/* Media strip */}
      <div style={{ position: "absolute", width: "100%", height: "100%", overflow: "hidden", borderRadius: "inherit" }}>
        {currentMedia.kind === "video" ? (
          <video
            src={currentMedia.src}
            controls
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : currentMedia.kind === "link" && embedUrl ? (
          <iframe
            src={embedUrl}
            title={`Vidéo ${current + 1}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", height: "100%", display: "block", border: "none" }}
          />
        ) : currentMedia.kind === "link" && externalUrl ? (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              background: "#2D3748",
              textDecoration: "underline",
            }}
          >
            Ouvrir le lien vidéo ↗
          </a>
        ) : currentMedia.kind === "link" ? (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "#fff", background: "#2D3748" }}>
            Lien vidéo indisponible
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentMedia.src}
            alt={`${category} ${current + 1}`}
            onClick={openLightbox}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              cursor: "zoom-in",
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

        {/* Zoom button — only for images */}
        {isImage && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); openLightbox(); }}
            aria-label="Agrandir l'image"
            className="langue-zoom-btn"
          >
            <ZoomIn size={16} />
          </button>
        )}

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

      <AnimatePresence>
        {lightboxOpen && images.length > 0 && (
          <ImageLightbox
            images={images}
            startIndex={Math.min(current, images.length - 1)}
            alt={category}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function getVideoEmbedUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (hostname === "youtu.be" || hostname.endsWith(".youtu.be")) {
      const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
      const videoId = parsedUrl.searchParams.get("v")
        ?? parsedUrl.pathname.match(/\/(?:embed|shorts)\/([^/]+)/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (hostname === "vimeo.com" || hostname.endsWith(".vimeo.com")) {
      const videoId = parsedUrl.pathname.match(/\/(\d+)/)?.[1];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

function getSafeExternalUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Breadcrumb({ label }: { label: string }) {
  return (
    <div className="langue-breadcrumb">
      <Link href="/CultureAmazigh">Culture Amazigh</Link>
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
      id={`culture-article-${pub.id}`}
      className="langue-pub-card"
      data-color={pub.color}
      style={pub._placeholder ? { opacity: 0.75 } : undefined}
    >
      <div className="langue-pub-visual">
        <ImageCarousel
          images={pub.images ?? []}
          videos={pub.videos}
          videoUrls={pub.videoUrls}
          color={pub.color}
          symbol={pub.symbol}
          category={pub.category}
          tag={pub.category}
        />
      </div>
      <div className="langue-pub-body">
        <p className="langue-pub-cat">{pub.category}</p>
        <h2 className="langue-pub-title" dir="auto">{pub.title}</h2>
        <p className="langue-pub-subtitle" dir="auto">{pub.subtitle}</p>
        <p className="langue-pub-text" dir="auto">{pub.body}</p>
        {!pub._placeholder && (
          <div className="langue-pub-more">
            <div className="langue-pub-more-bar" />
            {/* <span className="langue-pub-more-text">En savoir plus</span> */}
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
        <p className="langue-section-tag">L&apos;Alphabet · Tifinagh</p>
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
        Préserver la langue, c&apos;est préserver l&apos;âme d&apos;un peuple
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
        ✦ &nbsp; &nbsp; ✦
      </div>
    );
  }
  return null;
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function ArticleSearch({
  articles,
  loading,
  typeLabel,
  onSelect,
}: {
  articles: Publication[];
  loading: boolean;
  typeLabel: string;
  onSelect: (id: Publication["id"]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTerm = normalizeSearch(query.trim());
  const matches = useMemo(
    () =>
      articles.filter((article) =>
        normalizeSearch(`${article.title} ${article.subtitle} ${article.category}`).includes(searchTerm)
      ),
    [articles, searchTerm]
  );

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [open]);

  return (
    <section className="langue-article-explorer" aria-label={`Rechercher un article de ${typeLabel}`}>
      <div className="langue-article-search-card">
        <div className="langue-article-search-heading">
          <div>
            <p className="langue-article-search-eyebrow">Explorer la collection</p>
            <h2>Retrouvez un article</h2>
          </div>
          <span className="langue-article-count">
            {loading ? "Chargement…" : `${articles.length} article${articles.length === 1 ? "" : "s"}`}
          </span>
        </div>

        <div className="langue-article-search-control" ref={containerRef}>
          <Search size={19} aria-hidden="true" className="langue-article-search-icon" />
          <input
            type="search"
            role="combobox"
            aria-label={`Rechercher parmi les articles de ${typeLabel}`}
            aria-expanded={open}
            aria-controls="langue-article-results"
            aria-autocomplete="list"
            autoComplete="off"
            placeholder={loading ? "Chargement des articles…" : "Rechercher par titre, auteur ou thème…"}
            value={query}
            disabled={loading}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
          />
          {query && (
            <button
              type="button"
              className="langue-article-search-clear"
              aria-label="Effacer la recherche"
              onClick={() => {
                setQuery("");
                setOpen(true);
              }}
            >
              <X size={16} />
            </button>
          )}

          <AnimatePresence>
            {open && !loading && (
              <motion.div
                id="langue-article-results"
                role="listbox"
                className="langue-article-results"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <p className="langue-article-results-label">
                  {searchTerm ? `${matches.length} résultat${matches.length === 1 ? "" : "s"}` : "Tous les articles"}
                </p>
                <div className="langue-article-results-list">
                  {matches.length > 0 ? (
                    matches.map((article, index) => (
                      <motion.button
                        type="button"
                        role="option"
                        aria-selected="false"
                        key={article.id}
                        className="langue-article-result"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.16, delay: Math.min(index, 12) * 0.02 }}
                        onClick={() => {
                          setQuery("");
                          setOpen(false);
                          onSelect(article.id);
                        }}
                      >
                        <span className="langue-article-result-copy">
                          <span className="langue-article-result-title">{article.title}</span>
                          <span className="langue-article-result-meta">
                            {[article.subtitle, article.category].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <ArrowDown size={16} aria-hidden="true" />
                      </motion.button>
                    ))
                  ) : (
                    <p className="langue-article-results-empty">
                      {articles.length ? "Aucun article ne correspond à votre recherche." : "Aucun article publié dans cette rubrique."}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
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
      const baseUrl = `${API}/api/culture-amazigh/type/${encodeURIComponent(apiType)}`;
      const pageSize = 100;
      let page = 1;
      let pages = 1;
      const apiPublications: ApiPublication[] = [];

      do {
        const res = await fetch(`${baseUrl}?page=${page}&limit=${pageSize}`);
        if (!res.ok) throw new Error(`Erreur ${res.status}`);

        const data = await res.json() as CultureListResponse;
        apiPublications.push(...(data.cultures ?? data.data ?? []));
        pages = Math.max(1, Number(data.pages) || Math.ceil((data.total ?? apiPublications.length) / pageSize));
        page += 1;
      } while (page <= pages);

      const pubs: Publication[] = apiPublications.map((c, i) => ({
        id:        c._id ?? i + 1,
        color:     COLORS[i % COLORS.length],
        category:  c.type ?? "Culture",
        title:     c.title ?? "Publication amazighe",
        subtitle:  c.Auteur ?? "",
        symbol:    c.symbol ?? "ⴰⵎⴰⵣⵉⵖ",
        body:      c.description ?? "",
        images:    Array.isArray(c.images) ? c.images.filter((image): image is string => typeof image === "string" && Boolean(image)) : [],
        videos:    Array.isArray(c.videos) ? c.videos.filter((video): video is string => typeof video === "string" && Boolean(video)) : [],
        videoUrls: Array.isArray(c.videoUrls) ? c.videoUrls.filter((url): url is string => typeof url === "string" && Boolean(url)) : [],
      }));

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
  const articles = (publications ?? []).filter((publication) => !publication._placeholder && !publication._skeleton);

  const scrollToArticle = (id: Publication["id"]) => {
    document.getElementById(`culture-article-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <Breadcrumb label={meta.label} />
      <Hero meta={meta} />
      <StatusBanner status={status} onRetry={loadPublications} show={showErrorBanner} />
      <Marquee />
      <ArticleSearch articles={articles} loading={status === "loading"} typeLabel={meta.label} onSelect={scrollToArticle} />
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

        /* ── Zoom button on card images ── */
        .langue-zoom-btn {
          position: absolute;
          top: 8px;
          left: 8px;
          z-index: 2;
          display: grid;
          width: 32px;
          height: 32px;
          place-items: center;
          border: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.85);
          color: #4a3728;
          cursor: pointer;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.22);
          opacity: 0;
          transform: scale(0.9);
          transition: opacity 0.2s ease, transform 0.2s ease, background 0.15s ease;
        }
        .langue-pub-visual:hover .langue-zoom-btn,
        .langue-zoom-btn:focus-visible { opacity: 1; transform: scale(1); }
        .langue-zoom-btn:hover { background: #fff; }
        @media (hover: none) {
          .langue-zoom-btn { opacity: 1; transform: none; }
        }

        /* ── Lightbox ── */
        .langue-lightbox {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          background: rgba(20, 14, 8, 0.94);
          backdrop-filter: blur(6px);
          user-select: none;
        }
        .langue-lightbox-toolbar {
          position: absolute;
          top: 0;
          right: 0;
          left: 0;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: linear-gradient(to bottom, rgba(0,0,0,0.55), transparent);
          color: #fff;
        }
        .langue-lightbox-counter {
          font: 600 12px/1 ui-monospace, monospace;
          letter-spacing: 0.1em;
          opacity: 0.85;
        }
        .langue-lightbox-actions { display: flex; align-items: center; gap: 6px; }
        .langue-lightbox-actions button,
        .langue-lightbox-nav {
          display: grid;
          width: 38px;
          height: 38px;
          place-items: center;
          border: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          cursor: pointer;
          transition: background 0.15s ease, opacity 0.15s ease;
        }
        .langue-lightbox-actions button:hover:not(:disabled),
        .langue-lightbox-nav:hover { background: rgba(255, 255, 255, 0.26); }
        .langue-lightbox-actions button:disabled { opacity: 0.35; cursor: default; }
        .langue-lightbox-zoom {
          min-width: 48px;
          text-align: center;
          font: 600 12px/1 ui-monospace, monospace;
        }
        .langue-lightbox-stage {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          touch-action: none;
        }
        .langue-lightbox-img {
          max-width: 92vw;
          max-height: 86vh;
          object-fit: contain;
          border-radius: 6px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          will-change: transform;
        }
        .langue-lightbox-nav {
          position: absolute;
          top: 50%;
          z-index: 3;
          width: 46px;
          height: 46px;
          transform: translateY(-50%);
        }
        .langue-lightbox-prev { left: 16px; }
        .langue-lightbox-next { right: 16px; }
        .langue-lightbox-hint {
          position: absolute;
          right: 0;
          bottom: 14px;
          left: 0;
          z-index: 3;
          margin: 0;
          color: rgba(255, 255, 255, 0.55);
          font-size: 12px;
          text-align: center;
          pointer-events: none;
        }
        @media (max-width: 600px) {
          .langue-lightbox-hint { display: none; }
          .langue-lightbox-prev { left: 8px; }
          .langue-lightbox-next { right: 8px; }
        }

        .langue-article-explorer {
          width: min(calc(100% - 48px), 1100px);
          margin: 34px auto -34px;
          position: relative;
          z-index: 4;
        }
        .langue-article-search-card {
          padding: 22px 24px;
          border: 1px solid rgba(92, 74, 30, 0.14);
          border-radius: 20px;
          background: linear-gradient(135deg, #fffefa 0%, #f8f1e7 100%);
          box-shadow: 0 16px 42px rgba(62, 42, 18, 0.09);
        }
        .langue-article-search-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }
        .langue-article-search-heading h2 {
          margin: 3px 0 0;
          color: #38291d;
          font: 700 20px/1.2 Georgia, serif;
        }
        .langue-article-search-eyebrow {
          margin: 0;
          color: #a45b31;
          font: 600 10px/1.4 ui-monospace, monospace;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .langue-article-count {
          flex: 0 0 auto;
          padding: 7px 11px;
          border: 1px solid rgba(164, 91, 49, 0.18);
          border-radius: 999px;
          background: rgba(255,255,255,0.72);
          color: #78563b;
          font-size: 12px;
          font-weight: 600;
        }
        .langue-article-search-control { position: relative; }
        .langue-article-search-icon {
          position: absolute;
          top: 50%;
          left: 16px;
          z-index: 1;
          color: #a45b31;
          transform: translateY(-50%);
          pointer-events: none;
        }
        .langue-article-search-control input {
          width: 100%;
          height: 52px;
          padding: 0 48px;
          border: 1px solid rgba(92, 74, 30, 0.2);
          border-radius: 13px;
          outline: none;
          background: #fff;
          color: #38291d;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.4;
          transition: border-color 180ms ease, box-shadow 180ms ease;
        }
        .langue-article-search-control input:focus {
          border-color: #b66a3d;
          box-shadow: 0 0 0 4px rgba(182, 106, 61, 0.12);
        }
        .langue-article-search-control input:disabled { cursor: wait; opacity: 0.65; }
        .langue-article-search-clear {
          position: absolute;
          top: 50%;
          right: 12px;
          display: grid;
          width: 30px;
          height: 30px;
          place-items: center;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: #78563b;
          cursor: pointer;
          transform: translateY(-50%);
        }
        .langue-article-search-clear:hover { background: #f3e7d8; }
        .langue-article-results {
          position: absolute;
          top: calc(100% + 9px);
          right: 0;
          left: 0;
          padding: 8px;
          border: 1px solid rgba(92, 74, 30, 0.15);
          border-radius: 15px;
          background: #fffefa;
          box-shadow: 0 20px 50px rgba(62, 42, 18, 0.18);
        }
        .langue-article-results-list {
          max-height: 300px;
          overflow-y: auto;
          overscroll-behavior: contain;
          scroll-behavior: smooth;
        }
        .langue-article-results-label {
          margin: 5px 10px 8px;
          color: #9a8065;
          font: 600 10px/1.4 ui-monospace, monospace;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .langue-article-result {
          display: flex;
          box-sizing: border-box;
          width: 100%;
          height: 60px;
          flex: 0 0 60px;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 11px 12px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: #4a3728;
          text-align: left;
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease, transform 160ms ease;
        }
        .langue-article-result:hover, .langue-article-result:focus-visible {
          outline: none;
          background: #f5eadc;
          color: #9b4e27;
          transform: translateX(3px);
        }
        .langue-article-result > svg { flex: 0 0 auto; transform: rotate(-45deg); }
        .langue-article-result-copy { display: grid; min-width: 0; gap: 4px; }
        .langue-article-result-title {
          overflow: hidden;
          font: 600 14px/1.35 Georgia, serif;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .langue-article-result-meta {
          overflow: hidden;
          color: #9a8065;
          font-size: 11px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .langue-article-results-empty {
          margin: 0;
          padding: 16px 12px;
          color: #78563b;
          font-size: 13px;
        }
        .langue-pub-card[id^="culture-article-"] { scroll-margin-top: 100px; }
        @media (max-width: 600px) {
          .langue-article-explorer { width: calc(100% - 32px); margin: 24px auto -38px; }
          .langue-article-search-card { padding: 17px 15px; border-radius: 16px; }
          .langue-article-search-heading h2 { font-size: 18px; }
          .langue-article-search-control input { height: 48px; font-size: 13px; }
        }
      `}</style>
    </>
  );
}