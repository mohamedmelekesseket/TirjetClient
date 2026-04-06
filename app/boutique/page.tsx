"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const products = [
  {
    id: 1,
    cat: "Tissage",
    title: "Tapis Kairouan Horizon",
    desc: "Grand format lumineux tissé en laine naturelle avec tracés libres — idéal pour un salon contemporain.",
    loc: "KAIROUAN",
    price: "1 200 TND",
    img: "https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 2,
    cat: "Poterie",
    title: "Vase Nabeul Ruban",
    desc: "Céramique peinte à la main, pensée comme pièce centrale sur une table ou une console.",
    loc: "NABEUL",
    price: "120 TND",
    img: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 3,
    cat: "Bijoux",
    title: "Parure Djerba Atlas",
    desc: "Argent ciselé à la main, silhouette contemporaine pour un rendu premium unique.",
    loc: "DJERBA",
    price: "290 TND",
    img: "https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80&w=800",
  },
];

const filters = ["Tout", "Tissage", "Poterie", "Bijoux", "Maison"];

const values = [
  { n: "01", t: "Paiement simple et rassurant, sécurisé à chaque étape." },
  { n: "02", t: "Livraison suivie en Tunisie et à l'international." },
  { n: "03", t: "Pièces sourcées directement auprès des artisans." },
  { n: "04", t: "Interface pensée pour mobile et desktop, en toute fluidité." },
];

export default function Boutique() {
  const [activeFilter, setActiveFilter] = useState("Tout");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [addedIds, setAddedIds] = useState<number[]>([]);

  const toggleWish = (id: number) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddToCart = (id: number) => {
    setAddedIds((prev) => [...prev, id]);
    setTimeout(() => {
      setAddedIds((prev) => prev.filter((i) => i !== id));
    }, 2000);
  };

  // ✅ FILTER LOGIC
  const filteredProducts =
    activeFilter === "Tout"
      ? products
      : products.filter((p) => p.cat === activeFilter);

  return (
    <div className="boutique">
      {/* ── HERO ── */}
      <header className="hero">
        <motion.p
          className="hero-eyebrow"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Artisanat Tunisien · Collection 2025
        </motion.p>

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          L'art de<br />
          <em>l'artisan</em>
        </motion.h1>

        <motion.p
          className="hero-desc"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Pièces uniques sourcées directement auprès des maîtres artisans de
          la Tunisie. Chaque objet porte une histoire, un territoire, un
          savoir-faire.
        </motion.p>

        <div className="hero-line" />
      </header>

      {/* ── SEARCH + FILTER ── */}
      <motion.div
        className="search-section"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.55 }}
      >
        <div className="search-row">
          <div className="search-field">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              placeholder="Rechercher une pièce, une région ou une technique…"
            />
          </div>

          <div className="filter-row">
            {filters.map((f) => (
              <button
                key={f}
                className={`filter-btn${
                  activeFilter === f ? " active" : ""
                }`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── MAIN ── */}
      <main className="main-body">
        <motion.div
          className="section-label"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <span>
            Sélection du moment — {filteredProducts.length} pièces
          </span>
        </motion.div>

        {/* PRODUCT GRID */}
        <div className="product-grid">
          {filteredProducts.map((p, index) => (
            <motion.div
              key={p.id}
              className="product-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.8 + index * 0.15,
                ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
              }}
              whileHover={{ y: -6 }}
            >
              {/* IMAGE */}
              <div className="img-wrap">
                <motion.img
                  src={p.img}
                  alt={p.title}
                  loading="lazy"
                  whileHover={{ scale: 1.07 }}
                  transition={{ duration: 1.4 }}
                />

                <div className="img-overlay" />

                <span className="cat-pill">{p.cat}</span>

                <button
                  className="wish-btn"
                  onClick={() => toggleWish(p.id)}
                  style={{
                    color: wishlist.includes(p.id)
                      ? "#d4784f"
                      : undefined,
                  }}
                >
                  {wishlist.includes(p.id) ? "♥" : "♡"}
                </button>
              </div>

              {/* BODY */}
              <div className="card-body">
                <div className="card-top">
                  <h3 className="card-title">{p.title}</h3>
                  <span className="card-price">{p.price}</span>
                </div>

                <p className="card-desc">{p.desc}</p>

                <div className="card-footer">
                  <span className="card-loc">{p.loc}</span>
                  <a href="#" className="card-cta">
                    Voir la pièce →
                  </a>
                </div>

                {/* ADD TO CART */}
                <motion.button
                  className="card-cart"
                  onClick={() => handleAddToCart(p.id)}
                  initial={{ y: "100%" }}
                  whileHover={{ y: 0 }}
                  transition={{ duration: 0.4 }}
                  style={
                    addedIds.includes(p.id)
                      ? { background: "#3a6b3a" }
                      : undefined
                  }
                >
                  {addedIds.includes(p.id)
                    ? "✓ Ajouté"
                    : "Ajouter au panier"}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* VALUES */}
        <motion.div
          className="values-wrap"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="section-label">
            <span>Nos engagements</span>
          </div>

          <div className="values-grid">
            {values.map((v) => (
              <motion.div
                key={v.n}
                className="value-item"
                whileHover={{ backgroundColor: "#1a1410" }}
              >
                <span className="value-num">{v.n}</span>
                <p className="value-text">{v.t}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}