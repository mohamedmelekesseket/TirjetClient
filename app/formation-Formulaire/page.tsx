"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  User,
  Mic,
  Target,
  Check,
} from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/lib/toast";
import { useApiToken } from "@/lib/useApiToken";
import { signIn } from "next-auth/react";
import logo from '../icon.png';

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

interface FormData {
  // Step 1
  nomPrenom: string;
  genre: string;
  trancheAge: string;
  email: string;
  telephone: string;
  region: string;
  niveauEtudes: string;
  // Step 2
  niveauOral: string;
  niveauEcrit: string;
  niveauTifinagh: string;
  // Step 3
  attentes: string[];
  motivation: string;
}

const initialData: FormData = {
  nomPrenom: "",
  genre: "",
  trancheAge: "",
  email: "",
  telephone: "",
  region: "",
  niveauEtudes: "",
  niveauOral: "",
  niveauEcrit: "",
  niveauTifinagh: "",
  attentes: [],
  motivation: "",
};

const steps = [
  { key: "info", label: "Informations", icon: User },
  { key: "comp", label: "Compétences", icon: Mic },
  { key: "att", label: "Attentes", icon: Target },
];

const attentesOptions = [
  "Apprendre à parler au quotidien (Conversation)",
  "Apprendre à lire et à écrire (Alphabet Tifinagh)",
  "Approfondir mon vocabulaire et ma grammaire",
  "Découvrir la culture et l'histoire Amazigh",
  "Valoriser mon parcours professionnel",
];

// ─── Reusable atoms ─────────────────────────────────────────────────────────
function RadioCard({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`fam-radio${checked ? " fam-radio--checked" : ""}`}
      onClick={onClick}
    >
      <span className="fam-radio__dot">{checked && <span className="fam-radio__dot-fill" />}</span>
      {label}
    </button>
  );
}

function CheckCard({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`fam-check${checked ? " fam-check--checked" : ""}`}
      onClick={onClick}
    >
      <span className="fam-check__box">{checked && <Check size={13} strokeWidth={3} />}</span>
      {label}
    </button>
  );
}

function FieldLabel({ children, required = true }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="fam-label">
      {children} {required && <span className="fam-required">*</span>}
    </label>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function FormulaireAmazighPage() {
  const router = useRouter();
  const { session, status } = useApiToken();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // ── Check authentication (matching Header logic) ───────────────────────────
  const isAuthenticated = !!session;

  // Debug logging
  useEffect(() => {
    console.log("Auth status:", status);
    console.log("Session:", session);
    console.log("Is authenticated:", isAuthenticated);
  }, [status, session, isAuthenticated]);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const toggleAttente = (val: string) => {
    setData((d) => ({
      ...d,
      attentes: d.attentes.includes(val)
        ? d.attentes.filter((a) => a !== val)
        : [...d.attentes, val],
    }));
  };

  const isStepValid = () => {
    if (step === 0) {
      return (
        data.nomPrenom.trim() &&
        data.genre &&
        data.trancheAge &&
        data.email.trim() &&
        data.telephone.trim() &&
        data.region.trim() &&
        data.niveauEtudes
      );
    }
    if (step === 1) {
      return data.niveauOral && data.niveauEcrit && data.niveauTifinagh;
    }
    if (step === 2) {
      return data.attentes.length > 0 && data.motivation && data.motivation.trim().length > 0;
    }
    return false;
  };

  const next = () => {
    if (!isStepValid()) {
      showErrorToast("Merci de remplir tous les champs obligatoires.");
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const prev = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      showErrorToast("Vous devez être connecté pour envoyer le formulaire.");
      return;
    }
    if (!isStepValid()) {
      showErrorToast("Merci de remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/formation-amazigh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur lors de l'envoi");
      setDone(true);
      showSuccessToast("Demande enregistrée avec succès !");
    } catch (e) {
      showErrorToast("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const progressPct = ((step + 1) / steps.length) * 100;

  if (done) {
    return (
      <main className="fam-main">
        <div className="fam-wrap">
          <motion.div
            className="fam-success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="fam-success__icon">
              <Check size={32} strokeWidth={2.5} />
            </div>
            <h2>Merci !</h2>
            <p>Votre demande a bien été enregistrée. Notre équipe vous contactera très prochainement.</p>
            <button className="fam-btn fam-btn--primary" onClick={() => router.push("/")}>
              Retour à l&apos;accueil
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="fam-main">
      <style>{`
        .fam-login-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .lp-card {
          background: white;
          border-radius: 24px;
          padding: 2.5rem;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .lp-card__logo {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .lp-card__logo img {
          width: 64px;
          height: 64px;
          border-radius: 16px;
        }
        .lp-card__heading {
          text-align: center;
          margin-bottom: 2rem;
        }
        .lp-card__heading h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }
        .lp-card__heading p {
          color: #666;
          font-size: 0.95rem;
        }
        .lp-card__actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .lp-oauth-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.875rem 1.5rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
          font-weight: 500;
          font-size: 0.95rem;
          color: #1a1a1a;
          cursor: pointer;
          transition: all 0.2s;
        }
        .lp-oauth-btn:hover {
          background: #f9fafb;
        }
        .lp-oauth-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .lp-card__divider {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 1.5rem 0;
          position: relative;
        }
        .lp-card__divider::before,
        .lp-card__divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        .lp-card__divider span {
          padding: 0 1rem;
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 500;
          letter-spacing: 0.05em;
        }
        .lp-card__legal {
          text-align: center;
          font-size: 0.8rem;
          color: #6b7280;
          line-height: 1.5;
        }
        .lp-card__legal a {
          color: #2d6a4f;
          text-decoration: underline;
        }
      `}</style>
      {/* Login Overlay for unauthenticated users */}
      <AnimatePresence>
        {!isAuthenticated && (
          <motion.div
            className="fam-login-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
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
                <img src={logo.src} alt="" />
              </motion.div>

              {/* Heading */}
              <motion.div
                className="lp-card__heading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5 }}
              >
                <h1>Bienvenue sur Tirjet</h1>
                <p>Vous devez établir une connexion pour envoyer le formulaire.</p>
              </motion.div>

              {/* OAuth buttons */}
              <motion.div
                className="lp-card__actions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
              >
                <motion.button
                  className="lp-oauth-btn lp-oauth-btn--google"
                  onClick={async () => {
                    try {
                      setIsGoogleLoading(true);
                      await signIn("google", { callbackUrl: "/formation-Formulaire" });
                    } finally {
                      setIsGoogleLoading(false);
                    }
                  }}
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  disabled={isGoogleLoading}
                >
                  <GoogleIcon />
                  <span>{isGoogleLoading ? "Connexion..." : "Continuer avec Google"}</span>
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
                <Link href="/privacy">conditions d&apos;utilisation</Link> et notre{" "}
                <Link href="/privacy">politique de confidentialité</Link>.
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fam-wrap" style={{
        filter: !isAuthenticated ? "blur(8px)" : "none",
        pointerEvents: !isAuthenticated ? "none" : "auto",
        opacity: !isAuthenticated ? 0.5 : 1
      }}>
        <button className="fam-back" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="fam-head">
          <p className="fam-tag">
            <FileText size={13} /> FORMULAIRE
          </p>
          <h1>Besoins en formation de langue Amazigh</h1>
          <p className="fam-sub">Envie de découvrir ou de perfectionner votre langue Amazigh ?</p>
        </div>

        <div className="fam-steps">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done_ = i < step;
            return (
              <div key={s.key} className="fam-step">
                <div className={`fam-step__icon${active ? " fam-step__icon--active" : ""}${done_ ? " fam-step__icon--done" : ""}`}>
                  {done_ ? <Check size={16} strokeWidth={3} /> : <Icon size={18} />}
                </div>
                <span className={`fam-step__label${active ? " fam-step__label--active" : ""}`}>{s.label}</span>
                {i < steps.length - 1 && <div className="fam-step__line" />}
              </div>
            );
          })}
        </div>

        <div className="fam-progress">
          <motion.div
            className="fam-progress__fill"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <div className="fam-card">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="fam-card__title">
                  <User size={18} />
                  <h3>Informations personnelles</h3>
                </div>
                <div className="fam-card__divider" />

                <FieldLabel>Nom et Prénom</FieldLabel>
                <input
                  className="fam-input"
                  placeholder="Votre nom complet"
                  value={data.nomPrenom}
                  onChange={(e) => set("nomPrenom", e.target.value)}
                />

                <FieldLabel>Genre</FieldLabel>
                <div className="fam-grid-2">
                  <RadioCard label="Femme" checked={data.genre === "femme"} onClick={() => set("genre", "femme")} />
                  <RadioCard label="Homme" checked={data.genre === "homme"} onClick={() => set("genre", "homme")} />
                </div>

                <FieldLabel>Tranche d&apos;âge</FieldLabel>
                <div className="fam-grid-2">
                  <RadioCard
                    label="Moins de 25 ans"
                    checked={data.trancheAge === "moins25"}
                    onClick={() => set("trancheAge", "moins25")}
                  />
                  <RadioCard
                    label="De 26 à 40 ans"
                    checked={data.trancheAge === "26-40"}
                    onClick={() => set("trancheAge", "26-40")}
                  />
                  <RadioCard
                    label="De 41 à 55 ans"
                    checked={data.trancheAge === "41-55"}
                    onClick={() => set("trancheAge", "41-55")}
                  />
                  <RadioCard
                    label="Plus de 55 ans"
                    checked={data.trancheAge === "plus55"}
                    onClick={() => set("trancheAge", "plus55")}
                  />
                </div>

                <div className="fam-grid-2">
                  <div>
                    <FieldLabel>Adresse e-mail</FieldLabel>
                    <input
                      className="fam-input"
                      type="email"
                      placeholder="vous@email.com"
                      value={data.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Numéro de téléphone</FieldLabel>
                    <input
                      className="fam-input"
                      placeholder="+216 ..."
                      value={data.telephone}
                      onChange={(e) => set("telephone", e.target.value)}
                    />
                  </div>
                </div>

                <FieldLabel>Région</FieldLabel>
                <input
                  className="fam-input"
                  placeholder="Votre région"
                  value={data.region}
                  onChange={(e) => set("region", e.target.value)}
                />

                <FieldLabel>Niveau d&apos;études</FieldLabel>
                <div className="fam-grid-2">
                  <RadioCard
                    label="Enseignement secondaire (ou moins)"
                    checked={data.niveauEtudes === "secondaire"}
                    onClick={() => set("niveauEtudes", "secondaire")}
                  />
                  <RadioCard
                    label="Baccalauréat"
                    checked={data.niveauEtudes === "bac"}
                    onClick={() => set("niveauEtudes", "bac")}
                  />
                  <RadioCard
                    label="Études supérieures (Université)"
                    checked={data.niveauEtudes === "superieur"}
                    onClick={() => set("niveauEtudes", "superieur")}
                  />
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="fam-card__title">
                  <Mic size={18} />
                  <h3>Compétences actuelles</h3>
                </div>
                <div className="fam-card__divider" />

                <FieldLabel>Niveau de langue parlée (Oral)</FieldLabel>
                <div className="fam-grid-3">
                  <RadioCard label="Bien" checked={data.niveauOral === "bien"} onClick={() => set("niveauOral", "bien")} />
                  <RadioCard label="Moyen" checked={data.niveauOral === "moyen"} onClick={() => set("niveauOral", "moyen")} />
                  <RadioCard
                    label="Non (Je ne parle pas)"
                    checked={data.niveauOral === "non"}
                    onClick={() => set("niveauOral", "non")}
                  />
                </div>

                <FieldLabel>Niveau de langue écrite</FieldLabel>
                <div className="fam-grid-3">
                  <RadioCard label="Bien" checked={data.niveauEcrit === "bien"} onClick={() => set("niveauEcrit", "bien")} />
                  <RadioCard label="Moyen" checked={data.niveauEcrit === "moyen"} onClick={() => set("niveauEcrit", "moyen")} />
                  <RadioCard
                    label="Non (Je n'écris pas)"
                    checked={data.niveauEcrit === "non"}
                    onClick={() => set("niveauEcrit", "non")}
                  />
                </div>

                <FieldLabel>Connaissance de l&apos;alphabet Tifinagh</FieldLabel>
                <div className="fam-grid-3">
                  <RadioCard
                    label="Oui (Je le connais bien)"
                    checked={data.niveauTifinagh === "oui"}
                    onClick={() => set("niveauTifinagh", "oui")}
                  />
                  <RadioCard
                    label="Moyen (Je connais quelques lettres)"
                    checked={data.niveauTifinagh === "moyen"}
                    onClick={() => set("niveauTifinagh", "moyen")}
                  />
                  <RadioCard
                    label="Non (Je ne le connais pas du tout)"
                    checked={data.niveauTifinagh === "non"}
                    onClick={() => set("niveauTifinagh", "non")}
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="fam-card__title">
                  <Target size={18} />
                  <h3>Vos attentes</h3>
                </div>
                <div className="fam-card__divider" />

                <FieldLabel>Quelles sont vos attentes principales pour cette formation ?</FieldLabel>
                <p className="fam-hint">Plusieurs choix possibles</p>
                <div className="fam-grid-1">
                  {attentesOptions.map((opt) => (
                    <CheckCard
                      key={opt}
                      label={opt}
                      checked={data.attentes.includes(opt)}
                      onClick={() => toggleAttente(opt)}
                    />
                  ))}
                </div>
                <FieldLabel required>Pourquoi souhaitez-vous rejoindre notre formation ?</FieldLabel>
                <textarea
                  style={{width:"90%",backgroundColor:"white",color:"black",padding:"10px 10px",minHeight:"100px"}}
                  value={data.motivation}
                  onChange={(e) => set("motivation", e.target.value)}
                  placeholder="Expliquez vos motivations personnelles ou professionnelles..."
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="fam-card__footer">
            <button className="fam-btn fam-btn--ghost" onClick={prev} disabled={step === 0}>
              <ArrowLeft size={16} /> Précédent
            </button>
            {step < steps.length - 1 ? (
              <button className="fam-btn fam-btn--primary" onClick={next}>
                Suivant <ArrowRight size={16} />
              </button>
            ) : (
              <button className="fam-btn fam-btn--primary" onClick={handleSubmit} disabled={submitting || !isAuthenticated}>
                {submitting ? "Envoi..." : "Envoyer"} <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}