"use client";

import { motion,Variants  } from "framer-motion";
import { signIn } from "next-auth/react";
import { Badge, Leaf, Languages, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const PILL_TAGS = [
  { Icon: Zap, text: "Droits" },
  { Icon: Leaf, text: "Culture" },
  { Icon: Languages, text: "Langue" },
  { Icon: Badge, text: "Identité" },
] as const;

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" fill="#1877F2"/>
    </svg>
  );
}

function TifinaughStar() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path d="M16 2 L18 13 L29 8 L22 17 L30 22 L19 20 L20 30 L16 22 L12 30 L13 20 L2 22 L10 17 L3 8 L14 13 Z" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}

const floatingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] as [number, number, number, number],  // ✅ typed as tuple
    },
  }),
};


export default function LoginPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (!err) return;
    if (err === "OAuthCallback") {
      setErrorMessage(
        "Erreur OAuth. Vérifiez que l’URL Vercel est bien ajoutée dans Google Console (Authorized redirect URIs)."
      );
      return;
    }
    if (err === "OAuthAccountNotLinked") {
      setErrorMessage(
        "Ce compte est déjà lié à un autre mode de connexion. Utilisez la méthode utilisée lors de la première connexion."
      );
      return;
    }
    setErrorMessage(`Connexion impossible (${err}).`);
  }, []);

  return (
    <div className="lp-root">
      {/* ── LEFT PANEL ── */}
      <div className="lp-left">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=900&q=80"
          alt="Amazigh artisan"
          className="lp-left__img"
        />
        {/* Dark gradient overlay */}
        <div className="lp-left__overlay" />

        {/* Top badge */}
        <motion.div
          className="lp-left__badge"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <span className="lp-left__badge-tif">ⵜⴰⵎⴰⵖⵓⵜ</span>
          <span className="lp-left__badge-sep">·</span>
          <span className="lp-left__badge-txt">TAMAGUIT</span>
        </motion.div>

        {/* Bottom card */}
        <div className="lp-left__bottom">
          <motion.div
            className="lp-left__decorative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <TifinaughStar />
          </motion.div>

          <motion.h2
            className="lp-left__title"
            custom={0}
            variants={floatingVariants}
            initial="hidden"
            animate="visible"
          >
            Association Tamaguit pour les droits, les libertés et la culture des Amazighs
          </motion.h2>

          <motion.p
            className="lp-left__desc"
            custom={1}
            variants={floatingVariants}
            initial="hidden"
            animate="visible"
          >
            Nous préservons et promouvons le patrimoine millénaire amazigh — langue, culture
            et identité berbère — pour les générations futures.
          </motion.p>

          {/* Pills row */}
          <motion.div
            className="lp-left__pills"
            custom={2}
            variants={floatingVariants}
            initial="hidden"
            animate="visible"
          >
            {PILL_TAGS.map(({ Icon, text }) => (
              <span key={text} className="lp-left__pill">
                <Icon size={14} style={{ marginRight: 8 }} aria-hidden="true" />
                {text}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="lp-right">
        {/* Home icon top-right */}
        <a href="/" className="lp-right__home" aria-label="Retour à l'accueil">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
            <path d="M9 21V12h6v9" />
          </svg>
        </a>

        <motion.div
          className="lp-card"
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          {/* Logo */}
          <motion.div
            className="lp-card__logo"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <div className="lp-logo-icon">
              <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="9" fill="url(#lp-grad)" />
                <path d="M8 20l10 5 10-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 16l10 5 10-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                <path d="M8 12l10 5 10-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
                <defs>
                  <linearGradient id="lp-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#c9845a"/>
                    <stop offset="100%" stopColor="#2d6a4f"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.div
            className="lp-card__heading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <h1>Bienvenue sur Tirjet</h1>
            <p>Connectez-vous pour accéder à votre compte</p>
          </motion.div>

          {/* OAuth buttons */}
          <motion.div
            className="lp-card__actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            {errorMessage && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(239,68,68,0.10)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#7f1d1d",
                  fontSize: 13,
                  marginBottom: 10,
                }}
              >
                {errorMessage}
              </div>
            )}

            <motion.button
              className="lp-oauth-btn lp-oauth-btn--google"
              onClick={async () => {
                try {
                  setIsGoogleLoading(true);
                  await signIn("google", { callbackUrl: "/profile" });
                } finally {
                  setIsGoogleLoading(false);
                }
              }}
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.985 }}
              disabled={isGoogleLoading || isFacebookLoading}
            >
              <GoogleIcon />
              <span>{isGoogleLoading ? "Connexion..." : "Continuer avec Google"}</span>
            </motion.button>

            <motion.button
              className="lp-oauth-btn lp-oauth-btn--facebook"
              onClick={async () => {
                try {
                  setIsFacebookLoading(true);
                  await signIn("facebook", { callbackUrl: "/profile" });
                } finally {
                  setIsFacebookLoading(false);
                }
              }}
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.985 }}
              disabled={isGoogleLoading || isFacebookLoading}
            >
              <FacebookIcon />
              <span>{isFacebookLoading ? "Connexion..." : "Continuer avec Facebook"}</span>
            </motion.button>
          </motion.div>

          {/* Divider */}
          <motion.div
            className="lp-card__divider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
          >
            <span>CONNEXION SÉCURISÉE</span>
          </motion.div>

          {/* Legal */}
          <motion.p
            className="lp-card__legal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.52, duration: 0.5 }}
          >
            En vous connectant, vous acceptez nos{" "}
            <Link href="/apropos">conditions d&apos;utilisation</Link> et notre{" "}
            <Link href="/apropos">politique de confidentialité</Link>.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}