"use client";

import { motion,Variants  } from "framer-motion";
import { MapPin } from "lucide-react";

const artisans = [
  {
    id: 1,
    name: "Fatma Ben Amor",
    role: "Tisseuse de Margoum",
    location: "Gafsa, Tunisie",
    quote: "Chaque fil raconte l'histoire de nos ancêtres.",
    bio: "Fatma tisse depuis l'âge de 12 ans. Formée par sa grand-mère, elle perpétue un savoir-faire familial vieux de plus de cinq générations. Ses margoums mêlent motifs ancestraux et sensibilité contemporaine.",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=900",
    imgLeft: true,
  },
  {
    id: 2,
    name: "Khaled Amazigh",
    role: "Maître Potier",
    location: "Sejnane, Tunisie",
    quote: "La terre prend forme entre mes mains comme un poème.",
    bio: "Khaled est l'un des rares potiers hommes de Sejnane. Il a appris l'art de la poterie auprès des femmes de son village et a développé un style unique alliant tradition et modernité.",
    img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&q=80&w=900",
    imgLeft: false,
  },
  {
    id: 3,
    name: "Zahra Tmazight",
    role: "Joaillère traditionnelle",
    location: "Matmata, Tunisie",
    quote: "L'argent garde la mémoire de notre peuple.",
    bio: "Zahra crée des bijoux en argent depuis plus de 30 ans. Chaque pièce est ciselée à la main avec une précision remarquable, perpétuant les symboles identitaires amazighs.",
    img: "https://images.unsplash.com/photo-1509130872995-86c1159b0afe?auto=format&fit=crop&q=80&w=900",
    imgLeft: true,
  },
  {
    id: 4,
    name: "Mokhtar Sellami",
    role: "Brodeur d'art",
    location: "Monastir, Tunisie",
    quote: "Chaque point est une prière, chaque motif un symbole.",
    bio: "Mokhtar perpétue la broderie traditionnelle tunisienne depuis 25 ans. Ses œuvres ornent aussi bien les costumes de mariée que les collections de haute couture internationale.",
    img: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=900",
    imgLeft: false,
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number]  },
  },
};
export default function ArtisansPage() {
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

      {/* ARTISAN ROWS */}
      <section className="artisans-list">
        {artisans.map((a) => (
          <motion.div
            key={a.id}
            className={`artisan-row ${a.imgLeft ? "img-left" : "img-right"}`}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          >
            {/* Image */}
            <motion.div
              className="artisan-img-wrap"
              variants={a.imgLeft ? fadeLeft : fadeRight}
            >
              <img src={a.img} alt={a.name} />
            </motion.div>

            {/* Content */}
            <motion.div
              className="artisan-content"
              variants={a.imgLeft ? fadeRight : fadeLeft}
            >
              <h2 className="artisan-name">{a.name}</h2>
              <p className="artisan-role">{a.role}</p>
              <p className="artisan-location">
                <span className="pin" aria-hidden="true">
                  <MapPin size={16} />
                </span>{" "}
                {a.location}
              </p>
              <blockquote className="artisan-quote">"{a.quote}"</blockquote>
              <p className="artisan-bio">{a.bio}</p>
              <motion.button
                className="artisan-btn"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                Voir ses créations →
              </motion.button>
            </motion.div>
          </motion.div>
        ))}
      </section>

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
        <motion.button
          className="cta-btn"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Rejoindre la communauté
        </motion.button>
      </motion.section>
    </div>
  );
}